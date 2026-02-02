// prescription.ts - MERGED VERSION
import api from "./axiosInstance";
import { ENDPOINTS } from "./endpoints";
import { logger } from "@utils/logger/logger";

import type {
  CreatePrescriptionRequest,
  PrescriptionSummaryDto,
  PrescriptionDetailsDto,
  ReviewPrescriptionRequest,
} from "./prescription.types";

// ================== CREATE PRESCRIPTION ==================

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

// ================== GET PRESCRIPTION DETAILS ==================

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

// Alias for backward compatibility with your code
export const getPrescriptionDetails = getPrescriptionById;

// ================== PAGINATED: GET BY PATIENT ==================

export async function getPrescriptionsByPatient(
  patientId: string,
  pageSize = 10,
  continuationToken?: string | null
): Promise<{ items: PrescriptionSummaryDto[]; continuationToken: string | null }> {
  try {
    const params: any = { pageSize };
    if (continuationToken) {
      params.continuationToken = continuationToken;
    }

    const res = await api.get(
      `${ENDPOINTS.prescriptions}/patient/${patientId}`,
      { params }
    );
    
    return res.data; // { items, continuationToken }
  } catch (error) {
    logger.error("Fetching prescriptions by patient failed", {
      patientId,
      error,
    });
    throw error;
  }
}

// ================== PAGINATED: SEARCH ==================

export async function searchPrescriptions(
  searchTerm: string,
  pageSize = 10,
  continuationToken?: string | null
): Promise<{ items: PrescriptionSummaryDto[]; continuationToken: string | null }> {
  try {
    const params: any = {
      searchTerm,
      pageSize
    };

    if (continuationToken) {
      params.continuationToken = continuationToken;
    }

    const res = await api.get(`${ENDPOINTS.prescriptions}/search`, { params });
    return res.data; // { items, continuationToken }
  } catch (error) {
    logger.error("Searching prescriptions failed", {
      searchTerm,
      error,
    });
    throw error;
  }
}

// ================== PAGINATED: GET ALL ==================

export async function getAllPrescriptions(
  status?: string,
  pageSize = 10,
  continuationToken?: string | null
): Promise<{ items: PrescriptionSummaryDto[]; continuationToken: string | null }> {
  try {
    const params: any = { pageSize };

    if (status && status !== 'All') {
      params.status = status;
    }

    if (continuationToken) {
      params.continuationToken = continuationToken;
    }

    console.log('[API] getAllPrescriptions', {
      status: status ?? 'All',
      pageSize,
      continuationToken: continuationToken ?? null,
      finalParams: params
    });

    const res = await api.get(ENDPOINTS.prescriptions, { params });

    return res.data;
  } catch (error) {
    logger.error("Fetching all prescriptions failed", {
      status,
      continuationToken,
      error,
    });
    throw error;
  }
}


// ================== CANCEL PRESCRIPTION ==================

export async function cancelPrescription(
  prescriptionId: string,
  reason?: string
): Promise<void> {
  try {
    await api.post(
      `${ENDPOINTS.prescriptions}/${prescriptionId}/cancel`,
      reason ? { reason } : undefined
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
