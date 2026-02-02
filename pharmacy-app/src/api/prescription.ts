import api from "./axiosInstance";
import { ENDPOINTS } from "./endpoints";
import { logger } from "@utils/logger/logger";

import type {
  CreatePrescriptionRequest,
  PrescriptionSummaryDto,
  PrescriptionDetailsDto,
  ReviewPrescriptionRequest,
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

// ================== REVIEW PRESCRIPTION ==================

export async function reviewPrescription(
  prescriptionId: string,
  payload: ReviewPrescriptionRequest
): Promise<void> {
  try {
    await api.put(
      `${ENDPOINTS.prescriptions}/${prescriptionId}/review`,
      payload
    );
    logger.info("Prescription reviewed successfully", { prescriptionId });
  } catch (error) {
    logger.error("Review prescription failed", {
      prescriptionId,
      payload,
      error,
    });
    throw error;
  }
}

// ================== GET PENDING PRESCRIPTIONS ==================

export async function getPendingPrescriptions(): Promise<PrescriptionSummaryDto[]> {
  try {
    const res = await api.get(ENDPOINTS.prescriptions, {
      params: {
        status: "Created",
        pageSize: 20,
      },
    });

    return res.data.items; // PagedResultDto -> items
  } catch (error) {
    logger.error("Get pending prescriptions failed", { error });
    throw error;
  }
}