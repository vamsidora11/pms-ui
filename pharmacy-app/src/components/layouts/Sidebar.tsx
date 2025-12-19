import {
  HomeIcon,
  ClipboardDocumentListIcon,
  CheckBadgeIcon,
  BeakerIcon,
  TagIcon,
  ArrowPathIcon,
  UserCircleIcon,
  BellIcon,
} from "@heroicons/react/24/outline";

export type UserRole = "Manager" | "Pharmacist" | "Technician";

type NavItem = {
  key: string;
  label: string;
  icon: React.ElementType;
};

const roleNavItems: Record<UserRole, NavItem[]> = {
  Manager: [
    { key: "dashboard", label: "Dashboard", icon: HomeIcon },
  ],

  Pharmacist: [
    { key: "dashboard", label: "Dashboard", icon: HomeIcon },
    { key: "entry", label: "Prescription Entry", icon: ClipboardDocumentListIcon },
    { key: "validation", label: "Validation Queue", icon: CheckBadgeIcon },
    { key: "clinical", label: "Clinical Check", icon: BeakerIcon },
    { key: "label", label: "Label Generation", icon: TagIcon },
    { key: "refills", label: "Refill Management", icon: ArrowPathIcon },
    { key: "history", label: "Patient History", icon: UserCircleIcon },
    { key: "alerts", label: "Alerts & Reminders", icon: BellIcon },
  ],

  Technician: [
    { key: "dashboard", label: "Dashboard", icon: HomeIcon },
    { key: "status", label: "Prescription Status", icon: ClipboardDocumentListIcon },
    { key: "alerts", label: "Alerts", icon: BellIcon },
  ],
};

interface SidebarProps {
  role: UserRole;
  activeKey: string;
  onSelect: (key: string) => void;
}

export default function Sidebar({
  role,
  activeKey,
  onSelect,
}: SidebarProps) {
  const items = roleNavItems[role];

  return (
    <aside className="w-64 border-r bg-white p-4">
      <nav className="space-y-1">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = activeKey === item.key;

          return (
            <button
              key={item.key}
              onClick={() => onSelect(item.key)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left
                ${
                  isActive
                    ? "bg-blue-50 text-blue-600 font-medium"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
