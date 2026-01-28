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
    console.log("Create prescription API response:", res.data);
    return res.data;
  } catch (error) {
    logger.error("Create prescription failed", { payload, error });
    throw error; 
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
