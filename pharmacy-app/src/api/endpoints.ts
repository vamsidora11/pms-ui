// src/api/endpoints.ts
export const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5287";

export const ENDPOINTS = {
  // ── Auth ─────────────────────────────────────────────────────────────────────
  login:   "/api/auth/login",
  refresh: "/api/auth/refresh",
  logout:  "/api/auth/logout",

  // ── Users ────────────────────────────────────────────────────────────────────
  users: "/api/users",

  // ── Patients ─────────────────────────────────────────────────────────────────
  patients:      "/api/patients",
  patientSearch: "/api/patients/search",

  // ── Catalogs ─────────────────────────────────────────────────────────────────
  ALLERGY_SEARCH_ENDPOINT: "/api/catalogs/allergies/search",

  // ── Products ─────────────────────────────────────────────────────────────────
  products: "/api/products/search",

  // ── Prescriptions ────────────────────────────────────────────────────────────
  prescriptions:          "/api/prescriptions",
  prescriptionById:       (id: string) => `/api/prescriptions/${id}`,
  prescriptionsByPatient: (patientId: string) => `/api/prescriptions/patient/${patientId}`,
  prescriptionDispensePreview: (id: string) => `/api/prescriptions/${id}/dispense-preview`,

  // ── Dispenses ────────────────────────────────────────────────────────────────
  dispenses:             "/api/dispenses",
  dispenseById:          (id: string) => `/api/dispenses/${id}`,
  dispenseLabel:         (id: string) => `/api/dispenses/${id}/label`,
  dispenseExecute:       (id: string) => `/api/dispenses/${id}/execute`,
  dispenseCancel:        (id: string) => `/api/dispenses/${id}/cancel`,
  dispenseInsuranceClaim:(id: string) => `/api/dispenses/${id}/insurance-claim`,

  // Preview eligible lines for a prescription before checkout
  // GET /api/prescriptions/{prescriptionId}/dispense-preview?patientId={patientId}
  dispensePreview: (prescriptionId: string) =>
    `/api/prescriptions/${prescriptionId}/dispense-preview`,

  // ── Payments ─────────────────────────────────────────────────────────────────
  payments:              "/api/payments",
  paymentById:           (id: string) => `/api/payments/${id}`,
  paymentsByDispense:    (dispenseId: string) => `/api/payments/dispense/${dispenseId}`,

  // ── Inventory ────────────────────────────────────────────────────────────────
  inventoryLotsByProduct: (productId: string) =>
    `/api/inventory/products/${productId}/lots`,
  inventoryProducts:    "/api/inventory/products",
  inventoryLotRequest:  "/api/inventory/lots/request",
  inventoryPendingLots: "/api/inventory/lots/pending",
  inventoryLotsAll:    "/api/inventory/lots/all",      
  inventoryExpiring:   "/api/inventory/lots/expiring", 

  
// ── Payments ────────────────────────────────────────────────────────────────
  // Controller: Pms.Api.Controllers.Payments.PaymentController
  paymentRecord:           "/api/payments",                            // POST
  paymentsSummary:         "/api/payments/summary",                    // GET ?period=
  paymentsTrend:           "/api/payments/trend",                      // GET ?period=
  paymentsModeBreakdown:   "/api/payments/mode-breakdown",             // GET ?period=&type=
  paymentsTransactions:    "/api/payments/transactions",               // GET paging/sort/filter

  
  auditList: "/api/audit",
  auditById: (id: string) => `/api/audit/${id}`,


};
