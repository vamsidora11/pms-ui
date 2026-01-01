import axios from "axios";
import { store } from "../store";
import { refreshAccess, logout } from "../store/auth/authSlice";

const api = axios.create({
  baseURL: "http://localhost:5287", 
  withCredentials: true,     
  headers: { "Content-Type": "application/json" },
});

// Interceptor for attaching token
api.interceptors.request.use((config) => {
  // if ( config.url?.includes("/login") && (!config.data?.username || !config.data?.password) ) { return Promise.reject(new Error("Username and password required")); }
  const token = store.getState().auth.accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor for handling 401 and refreshing
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshResult = await store.dispatch(refreshAccess());
      if (refreshAccess.fulfilled.match(refreshResult)) {
        const newToken = refreshResult.payload.accessToken;
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      }
      store.dispatch(logout());
    }
    return Promise.reject(error);
  }
);

export default api;
