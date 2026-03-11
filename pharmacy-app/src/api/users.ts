import api from "./axiosInstance";
import { ENDPOINTS } from "./endpoints";

export type UserRole = "manager" | "pharmacist" | "technician";

export interface UserResponse {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  isActive: boolean;
}

export interface CreateUserRequest {
  fullName: string;
  email: string;
  password: string;
  role: UserRole;
}

export interface ChangeUserRoleRequest {
  newRole: UserRole;
}

export interface ResetPasswordRequest {
  newPassword: string;
}

export interface UpdateUserRequest {
  fullName: string;
  email: string;
  role: UserRole;
}

type ApiErrorShape = {
  response?: {
    data?: {
      detail?: string;
      message?: string;
      title?: string;
    };
  };
  message?: string;
};

function getApiErrorMessage(error: unknown, fallback: string): string {
  if (typeof error === "string") {
    return error;
  }

  if (typeof error === "object" && error !== null) {
    const err = error as ApiErrorShape;
    return (
      err.response?.data?.detail ||
      err.response?.data?.message ||
      err.response?.data?.title ||
      err.message ||
      fallback
    );
  }

  return fallback;
}

export async function getAllUsers(signal?: AbortSignal): Promise<UserResponse[]> {
  try {
    const response = await api.get<UserResponse[]>(ENDPOINTS.users, { signal });
    return response.data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Failed to load users"));
  }
}

export async function createUser(request: CreateUserRequest): Promise<UserResponse> {
  try {
    const response = await api.post<UserResponse>(ENDPOINTS.users, request);
    return response.data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Failed to create user"));
  }
}

export async function updateUser(userId: string, request: UpdateUserRequest): Promise<void> {
  try {
    await api.put(`${ENDPOINTS.users}/${userId}`, request);
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Failed to update user"));
  }
}

export async function changeUserRole(id: string, request: ChangeUserRoleRequest): Promise<void> {
  try {
    await api.put(`${ENDPOINTS.users}/${id}/role`, request);
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Failed to change user role"));
  }
}

export async function deactivateUser(id: string): Promise<void> {
  try {
    await api.put(`${ENDPOINTS.users}/${id}/deactivate`);
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Failed to deactivate user"));
  }
}

export async function activateUser(id: string): Promise<void> {
  try {
    await api.put(`${ENDPOINTS.users}/${id}/activate`);
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Failed to activate user"));
  }
}

export async function resetUserPassword(id: string, request: ResetPasswordRequest): Promise<void> {
  try {
    await api.put(`${ENDPOINTS.users}/${id}/reset-password`, request);
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Failed to reset password"));
  }
}
