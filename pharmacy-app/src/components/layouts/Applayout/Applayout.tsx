import { Outlet } from "react-router-dom";
import { useSelector } from "react-redux";
import type { RootState } from "../../../store";
import Sidebar from "../Sidebar/Sidebar";
import TopNavBar from "../TopNavBar/TopNavBar";

export default function AppLayout() {
  const user = useSelector((s: RootState) => s.auth.user);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top navigation bar */}
      <TopNavBar
        userName={user.username}
        userRole={user.role}
        avatar={user.avatarUrl}
      />

      {/* Sidebar */}
      <Sidebar
        user={{
          id: user.id,
          username: user.username,
          role: user.role,
          avatarUrl: user.avatarUrl,
        }}
      />

      {/* Main content area shifted for navbar + sidebar */}
      <main className="pt-16 pl-64">
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
