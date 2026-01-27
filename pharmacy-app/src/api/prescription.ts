// import api from "./axiosInstance";
// import { ENDPOINTS } from "./endpoints";

// // Create a new manual prescription
// export const prescriptionApi = async (prescriptionData: any) => {
//   try {
//     const response = await api.post(
//       ENDPOINTS.prescriptionentry,
//       prescriptionData
//     );
//     return response.data;
//   } catch (error: any) {
//     console.error("Failed to create prescription:", error);
//     throw error; // rethrow so UI can handle
//   }
// };

// // Fetch prescription details by ID
// export const getPrescriptionDetails = async (id: string) => {
//   try {
//     const response = await api.get(`${ENDPOINTS.prescriptionDetails}/${id}`);
//     return response.data;
//   } catch (error: any) {
//     console.error(`Failed to fetch prescription details for ${id}:`, error);
//     throw error;
//   }
// };

// // Validate a prescription
// export const validatePrescription = async (id: string) => {
//   try {
//     const response = await api.post(`${ENDPOINTS.validatePrescription}/${id}`);
//     return response.data;
//   } catch (error: any) {
//     console.error(`Failed to validate prescription ${id}:`, error);
//     throw error;
//   }
// };

import api from "./axiosInstance";
import { ENDPOINTS } from "./endpoints";

/**
 * EXPECTED ENDPOINTS SHAPE (align this to your endpoints.ts):
 *
 * export const ENDPOINTS = {
 *   prescriptions: "/api/prescriptions",                 // base
 *   prescriptionDetails: "/api/prescriptions",           // /:id
 *   prescriptionByPatient: "/api/prescriptions/patient", // /:patientId
 *   cancelPrescription: "/api/prescriptions",            // /:id/cancel
 *   // approvePrescription: "/api/prescriptions",       // /:id/approve (add when backend ready)
 * };
 *
 * If your current ENDPOINTS keys differ (e.g., prescriptionentry, validatePrescription),
 * either update ENDPOINTS or adjust the URLs below accordingly.
 */

/* -------------------------------------------
 * Create a new manual prescription
 * ----------------------------------------- */
export const prescriptionApi = async (prescriptionData: any) => {
  try {
    // POST /api/prescriptions
    const url = ENDPOINTS.prescriptions ?? "/api/prescriptions";
    const response = await api.post(url, prescriptionData);
    // Swagger: returns { prescriptionId, status }
    return response.data;
  } catch (error: any) {
    console.error("Failed to create prescription:", error);
    throw error;
  }
};

/* -------------------------------------------
 * Fetch prescription details by ID
 * ----------------------------------------- */
export const getPrescriptionDetails = async (id: string) => {
  try {
    // GET /api/prescriptions/{id}
    const base = ENDPOINTS.prescriptionDetails ?? "/api/prescriptions";
    const response = await api.get(`${base}/${encodeURIComponent(id)}`);
    return response.data;
  } catch (error: any) {
    console.error(`Failed to fetch prescription details for ${id}:`, error);
    throw error;
  }
};

/* -------------------------------------------
 * Fetch prescriptions for a patient
 * ----------------------------------------- */
export const getPrescriptionsByPatient = async (
  patientId: string
) => {
  try {
    // GET /api/prescriptions/patient/{patientId}
    const base = ENDPOINTS.prescriptionByPatient ?? "/api/prescriptions/patient";
    const response = await api.get(`${base}/${encodeURIComponent(patientId)}`);
    // If your backend returns an array, this is already correct.
    // If it returns { items: [...] }, adjust to: return response.data.items;
    return response.data;
  } catch (error: any) {
    console.error(`Failed to fetch prescriptions for patient ${patientId}:`, error);
    throw error;
  }
};

/* -------------------------------------------
 * Cancel a prescription (your Swagger has this)
 * ----------------------------------------- */
export const cancelPrescription = async (id: string, reason?: string) => {
  try {
    // POST /api/prescriptions/{id}/cancel
    const base = ENDPOINTS.cancelPrescription ?? "/api/prescriptions";
    const response = await api.post(
      `${base}/${encodeURIComponent(id)}/cancel`,
      // If your endpoint doesn’t accept a body, you can pass undefined
      reason ? { reason } : undefined
    );
    // Often returns 204 No Content; guard for that:
    return response.data ?? { status: "ok" };
  } catch (error: any) {
    console.error(`Failed to cancel prescription ${id}:`, error);
    throw error;
  }
};

/* -------------------------------------------
 * Validate/Approve a prescription
 * NOTE: Your Swagger does NOT have an approve/validate endpoint yet.
 * This function tries to call /approve; if it doesn't exist (404),
 * it throws a helpful error message.
 * ----------------------------------------- */
export const validatePrescription = async (id: string) => {
  try {
    // Hypothetical: POST /api/prescriptions/{id}/approve
    const base =
      // Prefer explicit key if you added it:
      (ENDPOINTS as any).approvePrescription ?? "/api/prescriptions";
    const url = `${base}/${encodeURIComponent(id)}/approve`;
    const response = await api.post(url);
    return response.data ?? { status: "ok" };
  } catch (error: any) {
    // If backend hasn't implemented /approve yet, guide the developer.
    if (error?.response?.status === 404) {
      const msg =
        "Approve endpoint not found. Implement POST /api/prescriptions/{id}/approve on the server, " +
        "or stop calling validatePrescription and use cancelPrescription for rejection until approve is available.";
      console.error(msg);
      throw new Error(msg);
    }
    console.error(`Failed to validate (approve) prescription ${id}:`, error);
    throw error;
  }
};
