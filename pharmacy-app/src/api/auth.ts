// src/api/auth.ts
import { ENDPOINTS, API_BASE } from "./endpoints";

export async function loginApi(credentials: { username: string; password: string }) {
  const res = await fetch(API_BASE + ENDPOINTS.login, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include", // sets refresh cookie
    body: JSON.stringify(credentials),
  });
  if (!res.ok) throw new Error("Invalid credentials");
  return (await res.json()) as { accessToken: string };
}

export async function refreshApi() {
  const res = await fetch(API_BASE + ENDPOINTS.refresh, {
    method: "POST",
    credentials: "include",
  });
  if (!res.ok) throw new Error("Refresh failed");
  return (await res.json()) as { accessToken: string };
}

export async function logoutApi() {
  const res = await fetch(API_BASE + ENDPOINTS.logout, {
    method: "POST",
    credentials: "include",
  });
  if (!res.ok) throw new Error("Logout failed");
}
