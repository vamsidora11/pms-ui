// axiosInstance.ts
import axios, { AxiosHeaders } from "axios";
import { store } from "../store";
import { refreshAccess, logout } from "@store/auth/authSlice";
import type { InternalAxiosRequestConfig } from "axios";

type RetriableConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
};

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

// Interceptor for attaching token (skip for login/refresh)
api.interceptors.request.use((config) => {
  const url = config.url ?? "";
  const skipAuth = url.includes("/auth/login") || url.includes("/auth/refresh");
  if (!skipAuth) {
    const token = store.getState().auth.accessToken;
    if (token) {
      // Use AxiosHeaders to avoid Axios v1 typing issues
      const headers = new AxiosHeaders(config.headers);
      headers.set("Authorization", `Bearer ${token}`);
      config.headers = headers;
    }
  }
  return config;
});

// Interceptor for handling 401, 403, 500 and refreshing
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest: RetriableConfig = error.config || {};
    const status = error.response?.status;
    const url = originalRequest?.url ?? "";

    const isAuthCall = url.includes("/auth/login") || url.includes("/auth/refresh");

    // Only try refresh if it's a 401 from a non-auth endpoint, and we haven't retried yet
    if (status === 401 && !originalRequest._retry && !isAuthCall) {
      originalRequest._retry = true;

      // Attempt refresh via Redux thunk
      const refreshResult = await store.dispatch(refreshAccess());

      if (refreshAccess.fulfilled.match(refreshResult)) {
        const newToken = refreshResult.payload.accessToken;


        // Update axios defaults for future requests
        (api.defaults.headers as any).common = {
          ...(api.defaults.headers as any).common,
          Authorization: `Bearer ${newToken}`,
        };

        // Ensure the retried request carries the new token even if defaults merge doesn’t apply
        const headers = new AxiosHeaders(originalRequest.headers);
        headers.set("Authorization", `Bearer ${newToken}`);
        originalRequest.headers = headers;

        return api(originalRequest);
      }

      // Refresh failed – fall back to logout
      store.dispatch(logout());
      throw error;
    }

    if (status === 403) {
      console.error("Forbidden: insufficient permissions");
    }

    if (status === 500) {
      console.error("Server error occurred");
    }

    throw error;
  }
);

export default api;
