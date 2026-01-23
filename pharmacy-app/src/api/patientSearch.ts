import api from "./axiosInstance";
import { ENDPOINTS } from "./endpoints";
import { logger } from "@utils/logger/logger";
import type { PatientSummary, PatientDetails } from "@prescription/models";

/**
 * Search patients
 */
export async function searchPatients(
  query: string
): Promise<PatientSummary[] | undefined> {
  try {
    const res = await api.get<PatientSummary[]>(
      ENDPOINTS.patientSearch,
      { params: { query } }
    );
    return res.data;
  } catch (error) {
    logger.error("Patient search failed", {
      query,
      error,
    });
    return undefined;
  }
}

/**
 * Get patient details by ID
 */
export async function getPatientById(
  patientId: string
): Promise<PatientDetails | undefined> {
  try {
    const res = await api.get<PatientDetails>(
      `${ENDPOINTS.patientDetails}/${patientId}`
    );
    return res.data;
  } catch (error) {
    logger.error("Fetching patient details failed", {
      patientId,
      error,
    });
    return undefined;
  }
}
