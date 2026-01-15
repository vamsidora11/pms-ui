import api from "./axiosInstance";
import { ENDPOINTS } from "./endpoints";
import type {
  CreatePatientRequest,
  UpdatePatientRequest,
  PatientDetailsDto,
  PatientSummaryDto,
} from "@store/patient/patienttype";
/*create new patient profile*/
export const createPatient = async (request: CreatePatientRequest) => {
  try {
    const response = await api.post(ENDPOINTS.patients, request);
    return response.data as { patientId: string };
  } catch (error: any) {
    console.error("Failed to create patient:", error);
    // throw error; // rethrow so UI can handle
  }
};
/*update existing patient profile*/
export const updatePatient = async (id: string, request: UpdatePatientRequest) => {
  try {
    const response = await api.put(`${ENDPOINTS.patientDetails}/${id}`, request);
    return response.data;
  } catch (error: any) {
    console.error(`Failed to update patient ${id}:`, error);
    // throw error;
  }
};
/*retrieve details of a patient*/
export const getPatientDetails = async (id: string) => {
  try {
    const response = await api.get(`${ENDPOINTS.patientDetails}/${id}`);
    return response.data as PatientDetailsDto;
  } catch (error: any) {
    console.error(`Failed to fetch patient details for ${id}:`, error);
    // throw error;
  }
};
/*search a patient*/
export const searchPatients = async (query?: string) => {
  try {
    if (!query || !query.trim()) {
      // call without query param → backend should return all patients
      const response = await api.get(ENDPOINTS.patientSearch);
      return response.data as PatientSummaryDto[];
    }
    const response = await api.get(ENDPOINTS.patientSearch, {
      params: { query: query.trim() },
    });
    return response.data as PatientSummaryDto[];
  } catch (error: any) {
    console.error("Failed to search patients:", error);
    // throw error;
  }
};
