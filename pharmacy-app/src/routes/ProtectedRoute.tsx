// src/routes/ProtectedRoute.tsx
import { useSelector } from "react-redux";
import { Navigate, Outlet } from "react-router-dom";
import type { RootState } from "../store";

type Props = { allowedRoles?: Array<"Manager" | "Pharmacist" | "Technician"> };

export default function ProtectedRoute({ allowedRoles }: Props) {
  const user = useSelector((s: RootState) => s.auth.user);
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    const fallback =
      user.role === "Manager"
        ? "/manager/dashboard"
        : user.role === "Pharmacist"
        ? "/pharmacist/dashboard"
        : "/technician/dashboard";
    return <Navigate to={fallback} replace />;
  }
  return <Outlet />;
}
