// src/api/http.ts
import { store } from "../store";
import { refreshAccess, logout } from "../store/authSlice";

export async function http(input: RequestInfo | URL, init?: RequestInit) {
  const state = store.getState();
  const token = state.auth.accessToken;

  let res = await fetch(input, {
    ...init,
    headers: {
      ...(init?.headers || {}),
      Authorization: token ? `Bearer ${token}` : "",
      "Content-Type": "application/json",
    },
    credentials: "include", // send refresh cookie when needed
  });

  if (res.status !== 401) return res;

  // Attempt token refresh
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

  // Refresh failed → logout
  store.dispatch(logout());
  return res;
}
