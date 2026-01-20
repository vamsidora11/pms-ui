export enum UserRoleEnum {
  Manager = "Manager",
  Pharmacist = "Pharmacist",
  Technician = "Technician",
}

export type UserRole = keyof typeof UserRoleEnum;

export interface User {
  id: string;
  username: string;
  role: UserRole;
  avatarUrl?: string;
}
