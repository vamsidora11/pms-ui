export enum UserRoleEnum {
  manager = "manager",
  pharmacist = "pharmacist",
  technician = "technician",
}

export type UserRole = keyof typeof UserRoleEnum;

export interface User {
  id: string;
  username: string;
  role: UserRole;
  avatarUrl?: string;
}
