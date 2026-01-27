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
///////////////--------///////
// import api from "./axiosInstance";
// import { ENDPOINTS } from "./endpoints";
// import { logger } from "@utils/logger/logger";

// import type {
//   CreatePrescriptionRequest,
//   CreatePrescriptionResponse,
//   PrescriptionSummaryDto,
//   PrescriptionDetailsDto,
// } from "./prescription.types";

// // ================== API FUNCTIONS ==================

// export async function createPrescription(
//   payload: CreatePrescriptionRequest
// ): Promise<CreatePrescriptionResponse | undefined> {
//   try {
//     const res = await api.post<CreatePrescriptionResponse>(
//       ENDPOINTS.prescriptions,
//       payload
//     );
//     return res.data;
//   } catch (error) {
//     logger.error("Create prescription failed", {
//       payload,
//       error,
//     });
//     return undefined;
//   }
// }

// export async function getPrescriptionsByPatient(
//   patientId: string
// ): Promise<PrescriptionSummaryDto[] | undefined> {
//   try {
//     const res = await api.get<PrescriptionSummaryDto[]>(
//       `${ENDPOINTS.prescriptions}/patient/${patientId}`
//     );
//     return res.data;
//   } catch (error) {
//     logger.error("Fetching prescriptions by patient failed", {
//       patientId,
//       error,
//     });
//     return undefined;
//   }
// }

// export async function getPrescriptionById(
//   prescriptionId: string
// ): Promise<PrescriptionDetailsDto | undefined> {
//   try {
//     const res = await api.get<PrescriptionDetailsDto>(
//       `${ENDPOINTS.prescriptions}/${prescriptionId}`
//     );
//     return res.data;
//   } catch (error) {
//     logger.error("Fetching prescription details failed", {
//       prescriptionId,
//       error,
//     });
//     return undefined;
//   }
// }

// export async function cancelPrescription(
//   prescriptionId: string
// ): Promise<boolean> {
//   try {
//     await api.post(
//       `${ENDPOINTS.prescriptions}/${prescriptionId}/cancel`
//     );
//     return true;
//   } catch (error) {
//     logger.error("Cancel prescription failed", {
//       prescriptionId,
//       error,
//     });
//     return false;
//   }
// }
import api from "./axiosInstance";
import { ENDPOINTS } from "./endpoints";
import { logger } from "@utils/logger/logger";

import type {
  CreatePrescriptionRequest,
  PrescriptionSummaryDto,
  PrescriptionDetailsDto,
} from "./prescription.types";

// ================== API FUNCTIONS ==================

export async function createPrescription(
  payload: CreatePrescriptionRequest
): Promise<PrescriptionDetailsDto> {
  try {
    const res = await api.post<PrescriptionDetailsDto>(
      ENDPOINTS.prescriptions,
      payload
    );
    console.log("Submitting prescription payload:", JSON.stringify(payload, null, 2));
    return res.data;
  } catch (error) {
    logger.error("Create prescription failed", { payload, error });
    throw error; // 🔥 important
  }
}

export async function getPrescriptionsByPatient(
  patientId: string
): Promise<PrescriptionSummaryDto[]> {
  try {
    const res = await api.get<PrescriptionSummaryDto[]>(
      `${ENDPOINTS.prescriptions}/patient/${patientId}`
    );
    return res.data;
  } catch (error) {
    logger.error("Fetching prescriptions by patient failed", {
      patientId,
      error,
    });
    throw error;
  }
}

export async function getPrescriptionById(
  prescriptionId: string
): Promise<PrescriptionDetailsDto> {
  try {
    const res = await api.get<PrescriptionDetailsDto>(
      `${ENDPOINTS.prescriptions}/${prescriptionId}`
    );
    return res.data;
  } catch (error) {
    logger.error("Fetching prescription details failed", {
      prescriptionId,
      error,
    });
    throw error;
  }
}

export async function cancelPrescription(
  prescriptionId: string
): Promise<void> {
  try {
    await api.post(
      `${ENDPOINTS.prescriptions}/${prescriptionId}/cancel`
    );
  } catch (error) {
    logger.error("Cancel prescription failed", {
      prescriptionId,
      error,
    });
    throw error;
  }
}
