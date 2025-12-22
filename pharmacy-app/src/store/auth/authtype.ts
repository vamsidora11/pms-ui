export type UserRole = "Manager" | "Pharmacist" | "Technician";

export interface User {
  id: string;
  username: string;
  role: UserRole;
  avatarUrl?: string;
}
