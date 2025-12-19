import { Outlet } from "react-router-dom";
import type { UserRole } from "./Sidebar";
import TopNavBar from "./TopNavBar";
import Sidebar from "./Sidebar";

interface AppLayoutProps {
  role: UserRole;
}

export default function AppLayout({ role }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <TopNavBar
        userName={role === "Pharmacist" ? "Dr. Sarah Mitchell" : "John Davis"}
        userRole={role}
      />

      <Sidebar role={role} />

      {/* SINGLE SOURCE OF LAYOUT SPACING */}
      <main className="pt-16 pl-64">
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
