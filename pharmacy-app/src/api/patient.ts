import api from "./axiosInstance";
import { ENDPOINTS } from "./endpoints";
import { extractApiError } from "@utils/httpError";
import type { PrescriptionListResponseDto } from "./prescription.dto";
import type {
  CreatePatientRequest,
  PatientDetailsDto,
  PatientSummaryDto,
  UpdatePatientRequest,
} from "@patient/types/patienttype";

type SearchPatientsOptions = {
  signal?: AbortSignal;
  minChars?: number;
  returnAllOnEmpty?: boolean;
};

const isCanceledRequest = (error: unknown): boolean => {
  if (typeof error !== "object" || error === null) {
    return false;
  }

  const candidate = error as { name?: string; code?: string };
  return (
    candidate.name === "CanceledError" ||
    candidate.code === "ERR_CANCELED" ||
    candidate.name === "AbortError"
  );
};

export const searchPatients = async (
  query?: string,
  opts?: SearchPatientsOptions,
): Promise<PatientSummaryDto[]> => {
  const q = (query ?? "").trim();
  const minChars = opts?.minChars ?? 2;
  const returnAllOnEmpty = opts?.returnAllOnEmpty ?? false;

  try {
    if (!q) {
      if (!returnAllOnEmpty) {
        return [];
      }

      const response = await api.get(ENDPOINTS.patientSearch, {
        signal: opts?.signal,
      });

      return response.data as PatientSummaryDto[];
    }

    if (q.length < minChars) {
      return [];
    }

    const response = await api.get(ENDPOINTS.patientSearch, {
      params: { query: q },
      signal: opts?.signal,
    });

    return response.data as PatientSummaryDto[];
  } catch (error) {
    if (isCanceledRequest(error)) {
      throw error;
    }

    console.error("Failed to search patients:", error);
    throw error;
  }
};

export const getPatientDetails = async (
  patientId: string,
  opts?: { signal?: AbortSignal },
): Promise<PatientDetailsDto> => {
  const response = await api.get(`${ENDPOINTS.patients}/${patientId}`, {
    signal: opts?.signal,
  });

  return response.data as PatientDetailsDto;
};

export const getPatientById = async (
  patientId: string,
  opts?: { signal?: AbortSignal },
): Promise<PatientDetailsDto | undefined> => {
  try {
    return await getPatientDetails(patientId, opts);
  } catch (error) {
    console.error("Fetching patient details failed:", error);
    return undefined;
  }
};

export const getPatientPrescriptions = async (
  patientId: string,
  opts?: { pageNumber?: number; pageSize?: number; signal?: AbortSignal },
): Promise<PrescriptionListResponseDto> => {
  const normalizedPatientId = patientId.trim();
  const pageNumber = opts?.pageNumber ?? 1;
  const pageSize = opts?.pageSize ?? 10;

  const response = await api.get(ENDPOINTS.prescriptionsByPatient(normalizedPatientId), {
    params: {
      pageNumber,
      pageSize,
    },
    signal: opts?.signal,
  });

  return response.data as PrescriptionListResponseDto;
};

export const createPatient = async (
  request: CreatePatientRequest,
  opts?: { signal?: AbortSignal },
): Promise<{ patientId: string }> => {
  try {
    const response = await api.post(ENDPOINTS.patients, request, {
      signal: opts?.signal,
    });

    return response.data;
  } catch (error) {
    console.error("Failed to create patient:", error);
    throw new Error(extractApiError(error) || "Error adding patient");
  }
};

export const updatePatient = async (
  id: string,
  request: UpdatePatientRequest,
  opts?: { signal?: AbortSignal },
) => {
  try {
    const response = await api.put(`${ENDPOINTS.patients}/${id}`, request, {
      signal: opts?.signal,
    });

    return response.data;
  } catch (error) {
    console.error(`Failed to update patient ${id}:`, error);
    throw new Error(extractApiError(error) || "Error updating patient");
  }
};
