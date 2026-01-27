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

  // prescriptions
  // prescriptions: "/api/prescriptions",
  // prescriptionentry: "/api/prescriptions/entry",
  // prescriptionDetails: "/api/prescriptions/details",
  // validatePrescription: "/api/prescription/validate",

  
  // prescriptions: "/api/prescriptions",                    // base
  // prescriptionQueue: "/api/prescriptions/queue",         // GET list pending
  // prescriptionDetails: "/api/prescriptions",             // GET /:id details
  // approvePrescription: "/api/prescriptions",             // POST /:id/approve
  // rejectPrescription: "/api/prescriptions",              // POST /:id/reject
  // medicationAction: "/api/prescriptions",   

  
  prescriptions: "/api/prescriptions",                 // base
    prescriptionDetails: "/api/prescriptions",           // /:id
    prescriptionByPatient: "/api/prescriptions/patient", // /:patientId
    cancelPrescription: "/api/prescriptions",            // /:id/cancel
     approvePrescription: "/api/prescriptions",       // /:id/approve (add when backend ready)
 };


