// import { useState } from "react";
// import { NavLink } from "react-router-dom";

// export type UserRole = "Manager" | "Pharmacist" | "Technician";

// export interface User {
//   id: string;
//   name: string;
//   role: UserRole;
//   avatarUrl?: string;
// }

// // Role-based nav items
// import {
//   HomeIcon,
//   ClipboardDocumentListIcon,
//   CheckBadgeIcon,
//   BeakerIcon,
//   TagIcon,
//   ArrowPathIcon,
//   UserCircleIcon,
//   BellIcon,
// } from "@heroicons/react/24/outline";

// const roleNavItems: Record<UserRole, { key: string; label: string; to: string; icon: React.ElementType }[]> = {
//   Manager: [
//     { key: "dashboard", label: "Dashboard", to: "/manager/dashboard", icon: HomeIcon },
//   ],
//   Pharmacist: [
//     { key: "dashboard", label: "Dashboard", to: "/pharmacist/dashboard", icon: HomeIcon },
//     { key: "entry", label: "Prescription entry", to: "/pharmacist/prescription-entry", icon: ClipboardDocumentListIcon },
//     { key: "validation", label: "Validation queue", to: "/pharmacist/validation", icon: CheckBadgeIcon },
//     { key: "clinical", label: "Clinical check", to: "/pharmacist/clinical-check", icon: BeakerIcon },
//     { key: "label", label: "Label generation", to: "/pharmacist/label", icon: TagIcon },
//     { key: "refills", label: "Refill management", to: "/pharmacist/refills", icon: ArrowPathIcon },
//     { key: "history", label: "Patient history", to: "/pharmacist/patient-history", icon: UserCircleIcon },
//     { key: "alerts", label: "Alerts & reminders", to: "/pharmacist/alerts", icon: BellIcon },
//   ],
//   Technician: [
//     { key: "dashboard", label: "Dashboard", to: "/technician/dashboard", icon: HomeIcon },
//     { key: "status", label: "Prescription status tracking", to: "/technician/prescriptions/status", icon: ClipboardDocumentListIcon },
//     { key: "alerts", label: "Alerts", to: "/technician/alerts", icon: BellIcon },
//   ],
// };

// // const sharedNavItems = [
// //   { key: "notifications", label: "Notifications", to: "/notifications", icon: BellIcon },
// // ];

// interface SidebarProps {
//   user: User;
// }

// export function Sidebar({ user }: SidebarProps) {
//   const [collapsed, setCollapsed] = useState(false);
//   const navItems = roleNavItems[user.role];

//   return (
//     <aside
//       className={`h-screen border-r border-gray-200 bg-white shadow-sm flex flex-col ${
//         collapsed ? "w-16" : "w-64"
//       }`}
//     >
//       {/* Header */}
//       <div className="flex items-center justify-between px-3 py-3 border-b">
//         <span className="font-semibold text-gray-800">{!collapsed && "Pharmacy"}</span>
//         <button
//           onClick={() => setCollapsed((c) => !c)}
//           className="p-1 rounded hover:bg-gray-100 transition"
//         >
//           {collapsed ? "➡️" : "⬅️"}
//         </button>
//       </div>

//       {/* User block */}
//       <div className="px-3 py-3 border-b">
//         <div className="flex items-center gap-3">
//           <div className="size-8 rounded-full bg-gray-200 overflow-hidden" />
//           {!collapsed && (
//             <div className="flex flex-col">
//               <span className="text-sm font-medium text-gray-900">{user.name}</span>
//               <span className="text-xs text-gray-600">{user.role}</span>
//             </div>
//           )}
//         </div>
//       </div>

//       {/* Role nav */}
//       <nav className="flex-1 overflow-y-auto px-2 py-2">
//         <ul className="space-y-1">
//           {navItems.map((item) => (
//             <li key={item.key}>
//               <NavLink
//   to={item.to}
//   className={({ isActive }) =>
//     [
//       "flex items-center gap-3 px-3 py-2 rounded-md transition",
//       isActive
//         ? "bg-indigo-50 text-indigo-700 font-medium"
//         : "text-gray-700 hover:bg-gray-100",
//       collapsed ? "justify-center" : "",
//     ].join(" ")
//   }
// >
//   <item.icon className="h-5 w-5" />
//   {!collapsed && <span>{item.label}</span>}
// </NavLink>

//             </li>
//           ))}
//         </ul>

//         {/* Shared nav */}
//         {/* <ul className="space-y-1 mt-4">
//           {sharedNavItems.map((item) => (
//             <li key={item.key}>
//               <NavLink
//                 to={item.to}
//                 className={({ isActive }) =>
//                   [
//                     "flex items-center gap-3 px-3 py-2 rounded-md transition",
//                     isActive
//                       ? "bg-indigo-50 text-indigo-700 font-medium"
//                       : "text-gray-700 hover:bg-gray-100",
//                     collapsed ? "justify-center" : "",
//                   ].join(" ")
//                 }
//               >
//                 <span>{item.label}</span>
//               </NavLink>
//             </li>
//           ))}
//         </ul> */}
//       </nav>

//       {/* Footer */}
//       <div className="px-3 py-3 border-t text-xs text-gray-500">
//         {!collapsed && <span>© {new Date().getFullYear()} Pharmacy</span>}
//       </div>
//     </aside>
//   );
// }
// Minimal Sidebar example that uses user.role for role-based UI.
// Reasoning:
// - Demonstrates reading from Redux-provided user info in layout components.

import { useState } from "react";
import { NavLink } from "react-router-dom";
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

// Define roles and user type inline
export type UserRole = "Manager" | "Pharmacist" | "Technician";

export interface User {
  id: string;
  name: string;
  role: UserRole;
  avatarUrl?: string;
}

interface SidebarProps {
  user: User;
}

// Role-based nav items
const roleNavItems: Record<
  UserRole,
  { key: string; label: string; to: string; icon: React.ElementType }[]
> = {
  Manager: [
    { key: "dashboard", label: "Dashboard", to: "/manager/dashboard", icon: HomeIcon },
  ],
  Pharmacist: [
    { key: "dashboard", label: "Dashboard", to: "/pharmacist/dashboard", icon: HomeIcon },
    { key: "entry", label: "Prescription entry", to: "/pharmacist/prescription-entry", icon: ClipboardDocumentListIcon },
    { key: "validation", label: "Validation queue", to: "/pharmacist/validation", icon: CheckBadgeIcon },
    { key: "clinical", label: "Clinical check", to: "/pharmacist/clinical-check", icon: BeakerIcon },
    { key: "label", label: "Label generation", to: "/pharmacist/label", icon: TagIcon },
    { key: "refills", label: "Refill management", to: "/pharmacist/refills", icon: ArrowPathIcon },
    { key: "history", label: "Patient history", to: "/pharmacist/patient-history", icon: UserCircleIcon },
    { key: "alerts", label: "Alerts & reminders", to: "/pharmacist/alerts", icon: BellIcon },
  ],
  Technician: [
    { key: "dashboard", label: "Dashboard", to: "/technician/dashboard", icon: HomeIcon },
    { key: "status", label: "Prescription status tracking", to: "/technician/prescriptions/status", icon: ClipboardDocumentListIcon },
    { key: "alerts", label: "Alerts", to: "/technician/alerts", icon: BellIcon },
  ],
};

export default function Sidebar({ user }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const navItems = roleNavItems[user.role];

  return (
    <aside
      className={`h-screen border-r border-gray-200 bg-white shadow-sm flex flex-col ${
        collapsed ? "w-16" : "w-64"
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-3 border-b">
        <span className="font-semibold text-gray-800">{!collapsed && "Pharmacy"}</span>
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="p-1 rounded hover:bg-gray-100 transition"
        >
          {collapsed ? "➡️" : "⬅️"}
        </button>
      </div>

      {/* User block */}
      <div className="px-3 py-3 border-b">
        <div className="flex items-center gap-3">
          <div className="size-8 rounded-full bg-gray-200 overflow-hidden">
            {user.avatarUrl && (
              <img
                src={user.avatarUrl}
                alt={user.name}
                className="w-full h-full object-cover"
              />
            )}
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-sm font-medium text-gray-900">{user.name}</span>
              <span className="text-xs text-gray-600">{user.role}</span>
            </div>
          )}
        </div>
      </div>

      {/* Role nav */}
      <nav className="flex-1 overflow-y-auto px-2 py-2">
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.key}>
              <NavLink
                to={item.to}
                className={({ isActive }) =>
                  [
                    "flex items-center gap-3 px-3 py-2 rounded-md transition",
                    isActive
                      ? "bg-indigo-50 text-indigo-700 font-medium border-l-4 border-indigo-600"
                      : "text-gray-700 hover:bg-gray-100",
                    collapsed ? "justify-center" : "",
                  ].join(" ")
                }
              >
                <item.icon className="h-5 w-5" />
                {!collapsed && <span>{item.label}</span>}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-3 border-t text-sm text-gray-500">
        {!collapsed && "© 2025 Pharmacy App"}
      </div>
    </aside>
  );
}
