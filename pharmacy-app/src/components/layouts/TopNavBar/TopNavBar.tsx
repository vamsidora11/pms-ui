import { Bell } from "lucide-react";
import type { UserRole } from "../../../store/auth/authtype"; 
import appLogo from "@assets/logo.png";

type TopNavBarProps = {
  onSearch?: (value: string) => void;
  userName: string;
  userRole: UserRole; 
  avatar?: string;
};

export default function TopNavBar({
  /*onSearch,*/
  userName,
  userRole,
  avatar,
}: TopNavBarProps) {
  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-white border-b z-50">
      <div className="h-full flex items-center justify-between px-6">
        
        {/* Branding */}
        <div className="flex items-center gap-3">
          <img
            src={appLogo}
            alt=""
            aria-hidden="true"
            className="h-10 w-10 rounded-lg object-contain"
          />
          <div>
            <div className="font-semibold text-gray-900">MediFlow</div>
            <div className="text-xs text-gray-500">
              Pharmacy Management System
            </div>
          </div>
        </div>

        {/* Search */}
        {/* <div className="flex-1 max-w-md mx-10">
          <input
            type="text"
            placeholder="Search prescriptions, patients..."
            onChange={(e) => onSearch?.(e.target.value)}
            className="w-full rounded-lg border border-gray-200 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div> */}

        {/* Right Section */}
        <div className="flex items-center gap-4">
          <button className="relative">
            <Bell className="h-5 w-5 text-gray-600" />
            <span className="absolute top-0 right-0 h-2 w-2 bg-red-500 rounded-full" />
          </button>

          {/* <Settings className="h-5 w-5 text-gray-600 cursor-pointer" /> */}

          <div className="flex items-center gap-3 pl-4 border-l">
            <div className="text-right">
              <div className="text-sm font-medium text-gray-900">{userName}</div>
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                {userRole}
              </span>
            </div>

            <img
              src={avatar || `https://ui-avatars.com/api/?name=${userName}`}
              className="h-9 w-9 rounded-full"
              alt={userName}
            />

            {/* <ChevronDown className="h-4 w-4 text-gray-500" /> */}
          </div>
        </div>
      </div>
    </header>
  );
}
