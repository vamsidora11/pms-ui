import api from "./axiosInstance";
import { ENDPOINTS } from "./endpoints";
import { logger } from "@utils/logger/logger";

import type {
  CreatePrescriptionRequest,
  CreatePrescriptionResponse,
  PrescriptionSummaryDto,
  PrescriptionDetailsDto,
} from "./prescription.types";

// ================== API FUNCTIONS ==================

export async function createPrescription(
  payload: CreatePrescriptionRequest
): Promise<CreatePrescriptionResponse | undefined> {
  try {
    const res = await api.post<CreatePrescriptionResponse>(
      ENDPOINTS.prescriptions,
      payload
    );
    return res.data;
  } catch (error) {
    logger.error("Create prescription failed", {
      payload,
      error,
    });
    return undefined;
  }
}

export async function getPrescriptionsByPatient(
  patientId: string
): Promise<PrescriptionSummaryDto[] | undefined> {
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
    return undefined;
  }
}

export async function getPrescriptionById(
  prescriptionId: string
): Promise<PrescriptionDetailsDto | undefined> {
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
    return undefined;
  }
}

export async function cancelPrescription(
  prescriptionId: string
): Promise<boolean> {
  try {
    await api.post(
      `${ENDPOINTS.prescriptions}/${prescriptionId}/cancel`
    );
    return true;
  } catch (error) {
    logger.error("Cancel prescription failed", {
      prescriptionId,
      error,
    });
    return false;
  }
}
