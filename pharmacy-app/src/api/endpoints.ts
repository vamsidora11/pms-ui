export const API_BASE = "http://localhost:5287";

export const ENDPOINTS = {
  login: "/api/auth/login",
  refresh: "/api/auth/refresh",
  logout: "/api/auth/logout",

  patients: "/api/patients",
  patientDetails: "/api/patients",
  patientSearch: "/api/patients/search",

  ALLERGY_SEARCH_ENDPOINT: "/api/catalogs/allergies/search",

  products: "/api/products/search",
  
  prescriptions: "/api/prescriptions",        
  
  labelQueue: "/api/prescriptions/labels/queue",

  prescriptionLabels: (id: string) => `/api/prescriptions/${id}/labels`,
 };


