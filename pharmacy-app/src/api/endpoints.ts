// src/api/endpoints.ts
export const API_BASE = "http://localhost:5287"; // if same origin; otherwise "http://localhost:5000"

export const ENDPOINTS = {
  login: "/api/auth/login",
  refresh: "/api/auth/refresh",
  logout: "/api/auth/logout",

  // prescriptions
  prescriptions: "/api/prescriptions",
  prescriptionById: (id: string) => `/api/prescriptions/${id}`,
};
