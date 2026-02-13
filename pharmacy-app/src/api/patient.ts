import api from "./axiosInstance";
import { ENDPOINTS } from "./endpoints";
import type {
  CreatePatientRequest,
  UpdatePatientRequest,
  PatientDetailsDto,
  PatientSummaryDto,
} from "@patient/types/patienttype";

/**
 * Server-side patient search.
 * @param query The search string (name/id/phone)
 * @param opts Optional { signal } for cancellation
 */

export const searchPatients = async (
  query?: string,
  opts?: {
    signal?: AbortSignal;
    minChars?: number;          // default: 1 (per-letter search)
    returnAllOnEmpty?: boolean; // default: false
  }
): Promise<PatientSummaryDto[]> => {
  const q = (query ?? "").trim();
  const minChars = opts?.minChars ?? 2;
  const returnAllOnEmpty = opts?.returnAllOnEmpty ?? false;

  try {
    if (!q) {
      if (returnAllOnEmpty) {
        const res = await api.get(ENDPOINTS.patientSearch, {
          signal: opts?.signal,
        });
        return res.data as PatientSummaryDto[];
      }
      // When empty and we don't want "all", return []
      return [];
    }

    if (q.length < minChars) return [];

    const res = await api.get(ENDPOINTS.patientSearch, {
      params: { query: q },
      signal: opts?.signal,
      // withCredentials: true, // uncomment if you rely on cookie auth
    });

    return res.data as PatientSummaryDto[];
  } catch (error) {
    // Axios v1 cancellation markers
    if (typeof error === "object" && error !== null) {
      const errObj = error as { name?: string; code?: string };
      if (
        errObj.name === "CanceledError" ||
        errObj.code === "ERR_CANCELED" ||
        errObj.name === "AbortError"
      ) {
        // let caller decide to ignore
        throw error;
      }
    }
    console.error("Failed to search patients:", error);
    throw error;
  }
};

export const getPatientDetails = async (patientId: string, opts?: { signal?: AbortSignal }) => {
  console.log(patientId);
  return (await api.get(`${ENDPOINTS.patients}/${patientId}`, { signal: opts?.signal })).data as PatientDetailsDto;
};

export const createPatient = async (
  request: CreatePatientRequest,
  opts?: { signal?: AbortSignal }
): Promise<{ patientId: string }> => {
  const res = await api.post(ENDPOINTS.patients, request, {
    signal: opts?.signal,
  });
  return res.data;
};

/*update existing patient profile*/
export const updatePatient = async (id: string, request: UpdatePatientRequest) => {
  try {
    const response = await api.put(`${ENDPOINTS.patientDetails}/${id}`, request);
    return response.data;
  } catch (error) {
    console.error(`Failed to update patient ${id}:`, error);
    throw error;
  }
};

