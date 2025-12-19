import {
  HomeIcon,
  ClipboardDocumentListIcon,
  CheckBadgeIcon,
  BeakerIcon,
  TagIcon,
  ArrowPathIcon,
  UserCircleIcon,
  BellIcon,
  ArrowRightOnRectangleIcon,
} from "@heroicons/react/24/outline";
import { useNavigate, useLocation } from "react-router-dom";

export type UserRole = "Manager" | "Pharmacist" | "Technician";

type NavItem = {
  key: string;
  label: string;
  icon: React.ElementType;
};

const roleNavItems: Record<UserRole, NavItem[]> = {
  Manager: [{ key: "dashboard", label: "Dashboard", icon: HomeIcon }],

  Pharmacist: [
    { key: "dashboard", label: "Dashboard", icon: HomeIcon },
    { key: "entry", label: "Manual Prescription Entry", icon: ClipboardDocumentListIcon },
    { key: "validation", label: "Prescription Validation", icon: CheckBadgeIcon },
    { key: "clinical", label: "Drug Interaction Checker", icon: BeakerIcon },
    { key: "labels", label: "Label Generator", icon: TagIcon },
    { key: "refills", label: "Refill Management", icon: ArrowPathIcon },
    { key: "history", label: "Patient History", icon: UserCircleIcon },
  ],

  Technician: [
    { key: "dashboard", label: "Dashboard", icon: HomeIcon },
    { key: "status", label: "Prescription Status", icon: ClipboardDocumentListIcon },
    { key: "alerts", label: "Alerts", icon: BellIcon },
  ],
};

interface SidebarProps {
  role: UserRole;
}

export default function Sidebar({ role }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const items = roleNavItems[role];

  return (
    <aside className="fixed left-0 top-16 w-64 h-[calc(100vh-4rem)] bg-white border-r">
      <nav className="p-4 space-y-1">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname.endsWith(item.key);

          return (
            <button
              key={item.key}
              onClick={() => navigate(`/pharmacist/${item.key}`)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition
                ${
                  isActive
                    ? "bg-green-50 text-green-700 font-medium"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </button>
          );
        })}

        <div className="pt-4 mt-4 border-t">
          <button
            onClick={() => navigate("/login")}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm text-gray-600 hover:bg-red-50 hover:text-red-700"
          >
            <ArrowRightOnRectangleIcon className="h-5 w-5" />
            Logout
          </button>
        </div>
      </nav>
    </aside>
  );
}
