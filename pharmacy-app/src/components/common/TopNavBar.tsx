import React from "react";
import { Bell, ChevronDown } from "lucide-react";

type TopNavBarProps = {
  logo?: React.ReactNode;
  title?: string;
  showSearch?: boolean;
  onSearch?: (value: string) => void;
  userName?: string;
  userRole?: string;
  avatar?: string; // image URL
};

export default function TopNavBar({
  logo,
  title = "",
  showSearch = true,
  onSearch,
  userName = "User",
  userRole = "",
  avatar,
}: TopNavBarProps) {
  return (
    <div className="w-full bg-white shadow-sm px-6 py-3 flex items-center justify-between sticky top-0 z-50">

      {/* Left Section - Logo + Title */}
      <div className="flex items-center gap-3">
        {logo}
        {title && <h1 className="text-lg font-semibold">{title}</h1>}
      </div>

      {/* Middle Section - Search Bar */}
      {showSearch && (
        <div className="flex-1 max-w-md mx-6">
          <input
            type="text"
            placeholder="Search..."
            onChange={(e) => onSearch && onSearch(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-600"
          />
        </div>
      )}

      {/* Right Section - User Menu */}
      <div className="flex items-center gap-6">
        
        {/* Notifications */}
        <button className="relative">
          <Bell size={20} className="text-gray-700" />
          <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>

        {/* User Info */}
        <div className="flex items-center gap-2 cursor-pointer">
          <img
            src={avatar || "https://ui-avatars.com/api/?name=User"}
            alt="avatar"
            className="w-8 h-8 rounded-full object-cover"
          />
          
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-medium">{userName}</span>
            {userRole && (
              <span className="text-xs text-gray-500 -mt-1">{userRole}</span>
            )}
          </div>

          <ChevronDown size={18} className="text-gray-600" />
        </div>

      </div>
    </div>
  );
}
