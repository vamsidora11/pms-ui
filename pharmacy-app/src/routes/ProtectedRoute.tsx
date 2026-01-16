import { useSelector } from "react-redux";
import { Navigate, Outlet } from "react-router-dom";
import type { RootState } from "store";
import { ROUTES } from "../constants/routes";
import type { UserRole } from "@store/auth/authtype";

type Props = { allowedRoles?: UserRole[] };

const ROLE_FALLBACKS: Record<UserRole, string> = {
  Manager: ROUTES.MANAGER.DASHBOARD,
  Pharmacist: ROUTES.PHARMACIST.DASHBOARD,
  Technician: ROUTES.TECHNICIAN.DASHBOARD,
};

export default function ProtectedRoute({ allowedRoles }: Props) {
  const user = useSelector((s: RootState) => s.auth.user);

  if (!user) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }

  const role = user.role as UserRole;

  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to={ROLE_FALLBACKS[role]} replace />;
  }

  return <Outlet />;
}
