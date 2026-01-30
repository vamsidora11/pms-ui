// endpoints.ts - MERGED VERSION
export const API_BASE = "http://localhost:5287";

export const ENDPOINTS = {
  // Auth
  login: "/api/auth/login",
  refresh: "/api/auth/refresh",
  logout: "/api/auth/logout",

  // Patients
  patients: "/api/patients",
  patientDetails: "/api/patients",
  patientSearch: "/api/patients/search",

  // Allergies
  ALLERGY_SEARCH_ENDPOINT: "/api/catalogs/allergies/search",

  // Products
  products: "/api/products/search",
  
  // Prescriptions (unified approach)
  prescriptions: "/api/prescriptions",
  // All other prescription endpoints are built dynamically:
  // GET    /api/prescriptions              - get all (paginated)
  // GET    /api/prescriptions/:id          - get details
  // POST   /api/prescriptions              - create
  // GET    /api/prescriptions/search       - search (paginated)
  // GET    /api/prescriptions/patient/:id  - get by patient (paginated)
  // POST   /api/prescriptions/:id/cancel   - cancel
  // POST   /api/prescriptions/:id/approve  - approve/validate
};