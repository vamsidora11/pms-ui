export const API_BASE = "http://localhost:5287";

export const ENDPOINTS = {
  login: "/api/auth/login",
  refresh: "/api/auth/refresh",
  logout: "/api/auth/logout",

  // prescriptions
  prescriptions: "/api/prescriptions",
  prescriptionById: (id: string) => `/api/prescriptions/${id}`,
};
