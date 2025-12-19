// src/utils/api.ts
import { store } from "../store";
import { refreshAccess, logout } from "../store/authSlice";

export async function apiFetch(input: RequestInfo, init?: RequestInit) {
  const state = store.getState();
  const token = state.auth.accessToken;

  let res = await fetch(input, {
    ...init,
    headers: {
      ...(init?.headers || {}),
      Authorization: token ? `Bearer ${token}` : "",
      "Content-Type": "application/json",
    },
    credentials: "include", // ensures refresh cookie is sent
  });

  if (res.status !== 401) return res;

  // try refresh
  const refreshResult = await store.dispatch(refreshAccess());
  if (refreshAccess.fulfilled.match(refreshResult)) {
    const newToken = refreshResult.payload.accessToken;
    res = await fetch(input, {
      ...init,
      headers: {
        ...(init?.headers || {}),
        Authorization: `Bearer ${newToken}`,
        "Content-Type": "application/json",
      },
      credentials: "include",
    });
    return res;
  }

  store.dispatch(logout());
  return res;
}
