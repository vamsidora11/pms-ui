import { ROUTES } from "../constants/routes";
import { UserRoleEnum, type UserRole } from "@store/auth/authtype";

/** Mapping from user role enum -> dashboard route */
const ROLE_DASHBOARD_ROUTE: Record<UserRoleEnum, string> = {
  [UserRoleEnum.manager]: ROUTES.MANAGER.DASHBOARD,
  [UserRoleEnum.pharmacist]: ROUTES.PHARMACIST.DASHBOARD,
  [UserRoleEnum.technician]: ROUTES.TECHNICIAN.DASHBOARD,
};

export function getDashboardRoute(role: UserRole) {
  return ROLE_DASHBOARD_ROUTE[UserRoleEnum[role]] ?? ROUTES.LOGIN;
}