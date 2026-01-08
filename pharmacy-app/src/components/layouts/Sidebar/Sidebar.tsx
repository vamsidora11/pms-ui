import { serverLogout } from "../../../store/auth/authSlice";
import { NavLink, useNavigate,  } from "react-router-dom";
import {
  HomeIcon,
  ClipboardDocumentListIcon,
  CheckBadgeIcon,
  // BeakerIcon,
  TagIcon,
  ArrowPathIcon,
  UserCircleIcon,
  BellIcon,
  ArrowRightOnRectangleIcon,
} from "@heroicons/react/24/outline";
import { useSelector, useDispatch } from "react-redux";
import type { RootState } from "../../../store";
import { toggleSidebar } from "../../../store/ui/uiSlice"; 
import type { User, UserRole } from "../../../store/auth/authtype";
import type { AppDispatch } from "../../../store/index";

interface SidebarProps {
  user: User;
}

const roleNavItems: Record<
  UserRole,
  { key: string; label: string; to: string; icon: React.ElementType }[]
> = {
  Manager: [
    { key: "dashboard", label: "Dashboard", to: "/manager/dashboard", icon: HomeIcon },
  ],
  Pharmacist: [
    { key: "dashboard", label: "Dashboard", to: "/pharmacist/dashboard", icon: HomeIcon },
    { key: "entry", label: "Manual Prescription Entry", to: "/pharmacist/entry", icon: ClipboardDocumentListIcon },
    { key: "validation", label: "Prescription Validation", to: "/pharmacist/validation", icon: CheckBadgeIcon },
    { key: "profiles", label: "Patient Profiles", to: "/pharmacist/profiles", icon: UserCircleIcon },
    { key: "labels", label: "Label Generator", to: "/pharmacist/labels", icon: TagIcon },
    { key: "refills", label: "Refill Management", to: "/pharmacist/refills", icon: ArrowPathIcon },
    { key: "history", label: "Patient History", to: "/pharmacist/history", icon: UserCircleIcon },
  ],
  Technician: [
    { key: "dashboard", label: "Dashboard", to: "/technician/dashboard", icon: HomeIcon },
    { key: "status", label: "Prescription Status", to: "/technician/status", icon: ClipboardDocumentListIcon },
    { key: "alerts", label: "Alerts", to: "/technician/alerts", icon: BellIcon },
  ],
};

export default function Sidebar({ user }: SidebarProps) {
  const collapsed = useSelector((s: RootState) => s.ui.sidebarCollapsed);
  const navigate = useNavigate();
  //const location = useLocation();
  const navItems = roleNavItems[user.role];
  const dispatch = useDispatch<AppDispatch>();
  return (
    <aside
      className={`fixed left-0 top-16 ${
        collapsed ? "w-16" : "w-64"
      } h-[calc(100vh-4rem)] bg-white border-r flex flex-col transition-all duration-300`}
    >
      {/* Toggle button */}
      <div className="px-3 py-2 border-b flex justify-between items-center">
        {!collapsed && <span className="font-semibold">Menu</span>}
        <button
          onClick={() => dispatch(toggleSidebar())}
          className="flex items-center justify-center text-gray-600 hover:text-gray-900 w-10 h-8"
        >
          {collapsed ? "➡️" : "⬅️"}
        </button>
      </div>

      {/* Role nav */}
      <nav className="flex-1 overflow-y-auto px-2 py-2 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.key}
              to={item.to}
              className={({ isActive }) =>
                [
                  "flex items-center gap-3 px-3 py-2 rounded-md transition text-sm",
                  isActive
                    ? "bg-green-50 text-green-700 font-medium"
                    : "text-gray-700 hover:bg-gray-100",
                  collapsed ? "justify-center" : "",
                ].join(" ")
              }
            >
              <Icon className="h-5 w-5" />
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          );
        })}

        {/* Logout */}
        <div className="pt-4 mt-4 border-t">
          <button
          
            onClick={() => {
              dispatch(serverLogout()); 
              navigate("/login");      
            }}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm text-gray-600 hover:bg-red-50 hover:text-red-700"
          >
            <ArrowRightOnRectangleIcon className="h-5 w-5" />
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </nav>

      {/* Footer */}
      <div className="p-3 border-t text-sm text-gray-500">
        {!collapsed && "© 2025 Pharmacy App"}
      </div>
    </aside>
  );
}
