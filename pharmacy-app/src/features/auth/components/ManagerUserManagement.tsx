import { useCallback, useEffect, useState, type ReactNode } from "react";
import {
  Activity,
  Edit2,
  KeyRound,
  Plus,
  Shield,
  UserCheck,
  UserCog,
  UserX,
  Users as UsersIcon,
} from "lucide-react";

import Breadcrumbs from "@components/common/BreadCrumps/Breadcrumbs";
import Button from "@components/common/Button/Button";
import Checkbox from "@components/common/Checkbox/Checkbox";
import DataTable from "@components/common/Table/Table";
import type { Column } from "@components/common/Table/Table";
import Dropdown from "@components/common/Dropdown/Dropdown";
import Input from "@components/common/Input/Input";
import { useToast } from "@components/common/Toast/useToast";

import {
  activateUser,
  createUser,
  deactivateUser,
  getAllUsers,
  resetUserPassword,
  type CreateUserRequest,
  type UpdateUserRequest,
  type UserRole,
  updateUser,
} from "@api/users";

interface UserRow {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  actions?: string;
}

interface CreateFormState {
  fullName: string;
  email: string;
  password: string;
  role: UserRole;
  active: boolean;
}

interface EditFormState {
  fullName: string;
  email: string;
  role: UserRole;
}

interface ResetPasswordFormState {
  newPassword: string;
  confirmPassword: string;
}

const ROLE_OPTIONS: Array<{ label: string; value: UserRole }> = [
  { label: "Manager", value: "manager" },
  { label: "Pharmacist", value: "pharmacist" },
  { label: "Technician", value: "technician" },
];

const EMPTY_CREATE_FORM: CreateFormState = {
  fullName: "",
  email: "",
  password: "",
  role: "pharmacist",
  active: true,
};

const EMPTY_RESET_PASSWORD_FORM: ResetPasswordFormState = {
  newPassword: "",
  confirmPassword: "",
};

function roleLabel(role: UserRole): string {
  switch (role) {
    case "manager":
      return "Manager";
    case "pharmacist":
      return "Pharmacist";
    case "technician":
      return "Technician";
    default:
      return role;
  }
}

function getRoleBadgeColor(role: UserRole): string {
  switch (role) {
    case "pharmacist":
      return "bg-blue-100 text-blue-700 border-blue-200";
    case "technician":
      return "bg-teal-100 text-teal-700 border-teal-200";
    case "manager":
      return "bg-orange-100 text-orange-700 border-orange-200";
    default:
      return "bg-gray-100 text-gray-700 border-gray-200";
  }
}

function getRoleIcon(role: UserRole) {
  switch (role) {
    case "pharmacist":
      return <Shield className="h-3.5 w-3.5" />;
    case "technician":
      return <UserCog className="h-3.5 w-3.5" />;
    case "manager":
      return <Activity className="h-3.5 w-3.5" />;
    default:
      return null;
  }
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default function ManagerUserManagement() {
  const toast = useToast();

  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(false);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [createForm, setCreateForm] = useState<CreateFormState>(EMPTY_CREATE_FORM);

  const [showEditModal, setShowEditModal] = useState(false);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserRow | null>(null);
  const [editForm, setEditForm] = useState<EditFormState>({
    fullName: "",
    email: "",
    role: "pharmacist",
  });

  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusSubmitting, setStatusSubmitting] = useState(false);
  const [userToToggle, setUserToToggle] = useState<UserRow | null>(null);

  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const [passwordSubmitting, setPasswordSubmitting] = useState(false);
  const [passwordTargetUser, setPasswordTargetUser] = useState<UserRow | null>(null);
  const [passwordForm, setPasswordForm] = useState<ResetPasswordFormState>(EMPTY_RESET_PASSWORD_FORM);

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getAllUsers();
      setUsers(response);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load users";
      toast.error("Users load failed", message);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  const openCreateModal = () => {
    setCreateForm(EMPTY_CREATE_FORM);
    setShowCreateModal(true);
  };

  const closeCreateModal = () => {
    setShowCreateModal(false);
    setCreateForm(EMPTY_CREATE_FORM);
  };

  const openEditModal = (user: UserRow) => {
    setSelectedUser(user);
    setEditForm({
      fullName: user.fullName,
      email: user.email,
      role: user.role,
    });
    setShowEditModal(true);
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setSelectedUser(null);
    setEditForm({
      fullName: "",
      email: "",
      role: "pharmacist",
    });
  };

  const openResetPasswordModal = (user: UserRow) => {
    setPasswordTargetUser(user);
    setPasswordForm(EMPTY_RESET_PASSWORD_FORM);
    setShowResetPasswordModal(true);
  };

  const closeResetPasswordModal = () => {
    setShowResetPasswordModal(false);
    setPasswordTargetUser(null);
    setPasswordForm(EMPTY_RESET_PASSWORD_FORM);
  };

  const handleCreateUser = async () => {
    const fullName = createForm.fullName.trim();
    const email = createForm.email.trim();
    const password = createForm.password;

    if (!fullName || !email || !password) {
      toast.error("Missing fields", "Full name, email, and password are required.");
      return;
    }

    if (!isValidEmail(email)) {
      toast.error("Invalid email", "Please enter a valid email address.");
      return;
    }

    if (password.length < 6) {
      toast.error("Weak password", "Password must be at least 6 characters.");
      return;
    }

    const payload: CreateUserRequest = {
      fullName,
      email,
      password,
      role: createForm.role,
    };

    try {
      setCreateSubmitting(true);

      const created = await createUser(payload);

      if (!createForm.active) {
        await deactivateUser(created.id);
      }

      toast.success("User created", `${created.fullName} was created successfully.`);
      closeCreateModal();
      await loadUsers();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create user";
      toast.error("Create failed", message);
    } finally {
      setCreateSubmitting(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!selectedUser) {
      return;
    }

    const fullName = editForm.fullName.trim();
    const email = editForm.email.trim();

    if (!fullName || !email) {
      toast.error("Missing fields", "Full name and email are required.");
      return;
    }

    if (!isValidEmail(email)) {
      toast.error("Invalid email", "Please enter a valid email address.");
      return;
    }

    const payload: UpdateUserRequest = {
      fullName,
      email,
      role: editForm.role,
    };

    try {
      setEditSubmitting(true);
      await updateUser(selectedUser.id, payload);

      toast.success("User updated", `${selectedUser.fullName} was updated.`);
      closeEditModal();
      await loadUsers();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update user";
      toast.error("Update failed", message);
    } finally {
      setEditSubmitting(false);
    }
  };

  const openStatusModal = (user: UserRow) => {
    setUserToToggle(user);
    setShowStatusModal(true);
  };

  const closeStatusModal = () => {
    setShowStatusModal(false);
    setUserToToggle(null);
  };

  const confirmToggleStatus = async () => {
    if (!userToToggle) {
      return;
    }

    try {
      setStatusSubmitting(true);

      if (userToToggle.isActive) {
        await deactivateUser(userToToggle.id);
        toast.success("User deactivated", `${userToToggle.fullName} was deactivated.`);
      } else {
        await activateUser(userToToggle.id);
        toast.success("User activated", `${userToToggle.fullName} was activated.`);
      }

      closeStatusModal();
      await loadUsers();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update status";
      toast.error("Status update failed", message);
    } finally {
      setStatusSubmitting(false);
    }
  };

  const handleResetPassword = async () => {
    if (!passwordTargetUser) {
      return;
    }

    const { newPassword, confirmPassword } = passwordForm;

    if (!newPassword || !confirmPassword) {
      toast.error("Missing fields", "Please provide and confirm the new password.");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("Weak password", "Password must be at least 6 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Password mismatch", "New password and confirm password must match.");
      return;
    }

    try {
      setPasswordSubmitting(true);
      await resetUserPassword(passwordTargetUser.id, { newPassword });
      toast.success("Password reset", `Password updated for ${passwordTargetUser.fullName}.`);
      closeResetPasswordModal();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to reset password";
      toast.error("Reset failed", message);
    } finally {
      setPasswordSubmitting(false);
    }
  };

  const columns: Column<UserRow>[] = [
    {
      key: "id",
      header: "User ID",
      sortable: true,
      filterable: true,
      width: 220,
      render: (value) => <span className="font-mono text-sm text-gray-900">{String(value)}</span>,
    },
    {
      key: "fullName",
      header: "Name",
      sortable: true,
      filterable: true,
      render: (value) => <span className="font-medium text-gray-900">{String(value)}</span>,
    },
    {
      key: "email",
      header: "Email",
      sortable: true,
      filterable: true,
      render: (value) => <span className="text-gray-600">{String(value)}</span>,
    },
    {
      key: "role",
      header: "Role",
      sortable: true,
      filterable: true,
      filterType: "select",
      filterOptions: ROLE_OPTIONS,
      width: 170,
      render: (value) => {
        const role = value as UserRole;
        return (
          <span
            className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium ${getRoleBadgeColor(role)}`}
          >
            {getRoleIcon(role)}
            {roleLabel(role)}
          </span>
        );
      },
      exportRender: (value) => roleLabel(value as UserRole),
    },
    {
      key: "isActive",
      header: "Status",
      sortable: true,
      width: 130,
      render: (value) => {
        const isActive = Boolean(value);
        return isActive ? (
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-green-200 bg-green-50 px-3 py-1.5 text-sm font-medium text-green-700">
            <span className="h-2 w-2 rounded-full bg-green-500" />
            Active
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm font-medium text-gray-500">
            <span className="h-2 w-2 rounded-full bg-gray-400" />
            Inactive
          </span>
        );
      },
      exportRender: (value) => (value ? "Active" : "Inactive"),
    },
    {
      key: "actions",
      header: "Actions",
      width: 190,
      render: (_, user) => (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              openEditModal(user);
            }}
            className="rounded-lg p-2 text-blue-600 transition-colors hover:bg-blue-50"
            title="Edit role and status"
          >
            <Edit2 className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              openStatusModal(user);
            }}
            className={`rounded-lg p-2 transition-colors ${
              user.isActive ? "text-orange-600 hover:bg-orange-50" : "text-green-600 hover:bg-green-50"
            }`}
            title={user.isActive ? "Deactivate user" : "Activate user"}
          >
            {user.isActive ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
          </button>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              openResetPasswordModal(user);
            }}
            className="rounded-lg p-2 text-purple-600 transition-colors hover:bg-purple-50"
            title="Reset password"
          >
            <KeyRound className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  const totalUsers = users.length;
  const activeUsers = users.filter((user) => user.isActive).length;
  const inactiveUsers = users.filter((user) => !user.isActive).length;
  const managers = users.filter((user) => user.role === "manager").length;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <Breadcrumbs items={[{ label: "Manager" }, { label: "User Management" }]} />

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-sm text-gray-500">Manage users, roles, activation status, and password resets.</p>
        </div>

        <Button onClick={openCreateModal} className="gap-2">
          <Plus className="h-4 w-4" />
          Add New User
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total Users" value={totalUsers} icon={<UsersIcon className="h-6 w-6 text-blue-600" />} iconBg="bg-blue-50" />
        <StatCard title="Active Users" value={activeUsers} icon={<UserCheck className="h-6 w-6 text-green-600" />} iconBg="bg-green-50" />
        <StatCard title="Inactive Users" value={inactiveUsers} icon={<UserX className="h-6 w-6 text-gray-600" />} iconBg="bg-gray-50" />
        <StatCard title="Managers" value={managers} icon={<Shield className="h-6 w-6 text-orange-600" />} iconBg="bg-orange-50" />
      </div>

      <DataTable
        data={users}
        columns={columns}
        loading={loading}
        pageSize={10}
        pageSizeOptions={[5, 10, 20, 50]}
        searchable
        searchPlaceholder="Search by name, email, or user ID..."
        exportFileName="user_management"
        emptyMessage="No users found"
        height={560}
      />

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h2 className="mb-6 text-xl font-semibold text-gray-900">Add New User</h2>

            <div className="mb-6 space-y-4">
              <Input
                label="Full Name"
                value={createForm.fullName}
                onChange={(value) => setCreateForm((prev) => ({ ...prev, fullName: value }))}
                placeholder="Enter full name"
                required
              />

              <Input
                label="Email Address"
                type="email"
                value={createForm.email}
                onChange={(value) => setCreateForm((prev) => ({ ...prev, email: value }))}
                placeholder="Enter email address"
                required
              />

              <Input
                label="Temporary Password"
                type="password"
                value={createForm.password}
                onChange={(value) => setCreateForm((prev) => ({ ...prev, password: value }))}
                placeholder="Enter temporary password"
                required
              />

              <Dropdown
                label="Role"
                value={createForm.role}
                onChange={(value) => setCreateForm((prev) => ({ ...prev, role: value as UserRole }))}
                options={ROLE_OPTIONS}
              />

              <div className="rounded-lg bg-gray-50 p-3">
                <Checkbox
                  label="Active User"
                  checked={createForm.active}
                  onChange={(event) =>
                    setCreateForm((prev) => ({
                      ...prev,
                      active: event.target.checked,
                    }))
                  }
                />
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="secondary" onClick={closeCreateModal}>
                Cancel
              </Button>
              <Button onClick={() => void handleCreateUser()} disabled={createSubmitting}>
                {createSubmitting ? "Creating..." : "Create User"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {showEditModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h2 className="mb-4 text-xl font-semibold text-gray-900">Edit User</h2>

            <div className="mb-6 space-y-4">
              <Input
                label="Full Name"
                value={editForm.fullName}
                onChange={(value) => setEditForm((prev) => ({ ...prev, fullName: value }))}
                placeholder="Enter full name"
                required
              />
              <Input
                label="Email Address"
                value={editForm.email}
                onChange={(value) => setEditForm((prev) => ({ ...prev, email: value }))}
                placeholder="Enter email address"
                required
              />

              <Dropdown
                label="Role"
                value={editForm.role}
                onChange={(value) => setEditForm((prev) => ({ ...prev, role: value as UserRole }))}
                options={ROLE_OPTIONS}
              />
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="secondary" onClick={closeEditModal}>
                Cancel
              </Button>
              <Button onClick={() => void handleSaveEdit()} disabled={editSubmitting}>
                {editSubmitting ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {showStatusModal && userToToggle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h2 className="mb-4 text-xl font-semibold text-gray-900">
              {userToToggle.isActive ? "Deactivate User" : "Activate User"}
            </h2>
            <p className="mb-6 text-gray-600">
              Are you sure you want to {userToToggle.isActive ? "deactivate" : "activate"}{" "}
              <span className="font-semibold text-gray-900">{userToToggle.fullName}</span>?
            </p>

            <div className="mb-6 rounded-lg border border-gray-200 bg-gray-50 p-3">
              <p className="text-sm text-gray-700">
                {userToToggle.isActive
                  ? "This user will no longer be able to access the system."
                  : "This user will regain access to the system."}
              </p>
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="secondary" onClick={closeStatusModal}>
                Cancel
              </Button>
              <Button
                variant={userToToggle.isActive ? "secondary" : "primary"}
                onClick={() => void confirmToggleStatus()}
                disabled={statusSubmitting}
              >
                {statusSubmitting
                  ? userToToggle.isActive
                    ? "Deactivating..."
                    : "Activating..."
                  : userToToggle.isActive
                    ? "Deactivate"
                    : "Activate"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {showResetPasswordModal && passwordTargetUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h2 className="mb-2 text-xl font-semibold text-gray-900">Reset Password</h2>
            <p className="mb-6 text-sm text-gray-600">Set a new password for {passwordTargetUser.fullName}.</p>

            <div className="mb-6 space-y-4">
              <Input
                label="New Password"
                type="password"
                value={passwordForm.newPassword}
                onChange={(value) => setPasswordForm((prev) => ({ ...prev, newPassword: value }))}
                placeholder="Enter new password"
                required
              />

              <Input
                label="Confirm Password"
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(value) => setPasswordForm((prev) => ({ ...prev, confirmPassword: value }))}
                placeholder="Confirm new password"
                required
              />
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="secondary" onClick={closeResetPasswordModal}>
                Cancel
              </Button>
              <Button variant="danger" onClick={() => void handleResetPassword()} disabled={passwordSubmitting}>
                {passwordSubmitting ? "Resetting..." : "Reset Password"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
  iconBg,
}: {
  title: string;
  value: number;
  icon: ReactNode;
  iconBg: string;
}) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
      <div className="mb-4 flex items-start justify-between">
        <div className={`rounded-xl p-3 ${iconBg}`}>{icon}</div>
      </div>
      <div className="mb-1 text-3xl font-semibold text-gray-900">{value}</div>
      <div className="text-gray-500">{title}</div>
    </div>
  );
}

