// src/api/endpoints.ts
export const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5287";

export const ENDPOINTS = {
  // ── Auth ────────────────────────────────────────────────────────────────────
  login:   "/api/auth/login",
  refresh: "/api/auth/refresh",
  logout:  "/api/auth/logout",

  // ── Users ───────────────────────────────────────────────────────────────────
  users: "/api/users",

  // ── Patients ────────────────────────────────────────────────────────────────
  patients:      "/api/patients",
  patientSearch: "/api/patients/search",

  // ── Catalogs ────────────────────────────────────────────────────────────────
  ALLERGY_SEARCH_ENDPOINT: "/api/catalogs/allergies/search",

  // ── Products ────────────────────────────────────────────────────────────────
  // GET /api/products/search?q=&limit=  → ProductSearchResultDto[]
  products: "/api/products/search",

  // ── Prescriptions ───────────────────────────────────────────────────────────
  prescriptions:     "/api/prescriptions",
  prescriptionById:  (id: string) => `/api/prescriptions/${id}`,
  prescriptionsByPatient: (patientId: string) => `/api/prescriptions/patient/${patientId}`,
  labelQueue:        "/api/dispenses",


  dispenses:        "/api/dispenses",
  dispenseById:     (id: string) => `/api/dispenses/${id}`,
  dispenseLabel:    (id: string) => `/api/dispenses/${id}/label`,
  dispenseExecute:  (id: string) => `/api/dispenses/${id}/execute`,


  inventoryLotsByProduct: (productId: string) =>
    `/api/inventory/products/${productId}/lots`,
  inventoryProducts: "/api/inventory/products",
  inventoryLotRequest: "/api/inventory/lots/request",
  inventoryLotsAll:    "/api/inventory/lots/all",      
  inventoryExpiring:   "/api/inventory/lots/expiring", 
};
