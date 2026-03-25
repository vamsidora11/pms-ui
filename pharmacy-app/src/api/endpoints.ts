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
  prescriptionDispensePreview: (id: string) => `/api/prescriptions/${id}/dispense-preview`,
  labelQueue:        "/api/dispenses",


  dispenses:        "/api/dispenses",
  dispenseById:     (id: string) => `/api/dispenses/${id}`,
  dispensesByPrescription: (id: string) => `/api/dispenses/prescription/${id}`,
  dispenseLabel:    (id: string) => `/api/dispenses/${id}/label`,
  dispenseExecute:  (id: string) => `/api/dispenses/${id}/execute`,
  dispenseInsuranceClaim: (id: string) => `/api/dispenses/${id}/insurance-claim`,
  dispenseCancel:   (id: string) => `/api/dispenses/${id}/cancel`,


  inventoryLotsByProduct: (productId: string) =>
    `/api/inventory/products/${productId}/lots`,
  inventoryProducts: "/api/inventory/products",
  inventoryLotRequest: "/api/inventory/lots/request",
  inventoryPendingLots: "/api/inventory/lots/pending",
  inventoryLotsAll:    "/api/inventory/lots/all",      
  inventoryExpiring:   "/api/inventory/lots/expiring", 

  
// ── Payments ────────────────────────────────────────────────────────────────
  // Controller: Pms.Api.Controllers.Payments.PaymentController
  paymentRecord:           "/api/payments",                            // POST
  paymentById:             (id: string) => `/api/payments/${id}`,      // GET
  paymentsByDispense:      (dispenseId: string) => `/api/payments/dispense/${dispenseId}`, // GET
  paymentsSummary:         "/api/payments/summary",                    // GET ?period=
  paymentsTrend:           "/api/payments/trend",                      // GET ?period=
  paymentsModeBreakdown:   "/api/payments/mode-breakdown",             // GET ?period=&type=
  paymentsTransactions:    "/api/payments/transactions",               // GET paging/sort/filter

  
  auditList: "/api/audit",
  auditById: (id: string) => `/api/audit/${id}`,


};
