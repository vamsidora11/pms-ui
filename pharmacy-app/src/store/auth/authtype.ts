import { extractApiError, getHttpStatus } from "@utils/httpError";

export const UserRoleEnum = {
  manager: "manager",
  pharmacist: "pharmacist",
  technician: "technician",
} as const;

export type UserRole = keyof typeof UserRoleEnum;

export interface User {
  id: string;
  username: string;
  role: UserRole;
  avatarUrl?: string;
}

export type AuthStatus = "idle" | "loading" | "succeeded" | "failed";

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  status: AuthStatus;
  error?: string;
}

export const AUTH_INVALID_CREDENTIALS_MESSAGE = "Incorrect username or password";

const GENERIC_AUTH_MESSAGES = new Set([
  "Request failed",
  "Unexpected error",
  "Unauthorized",
  "Forbidden",
]);

export function extractAuthError(err: unknown): string {
  const message = extractApiError(err);
  const status = getHttpStatus(err);

  if ((status === 400 || status === 401) && GENERIC_AUTH_MESSAGES.has(message)) {
    return AUTH_INVALID_CREDENTIALS_MESSAGE;
  }

  return message;
}
