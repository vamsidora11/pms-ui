import api from "./axiosInstance";
import { ENDPOINTS } from "./endpoints";
import type {
  CreatePatientRequest,
  UpdatePatientRequest,
  PatientDetailsDto,
  PatientSummaryDto,
} from "../store/patient/patienttype";

export const createPatient = async (request: CreatePatientRequest) => {
  const response = await api.post(ENDPOINTS.patients, request);
  return response.data as { patientId: string };
};

export const updatePatient = async (id: string, request: UpdatePatientRequest) => {
  const response = await api.put(`${ENDPOINTS.patientDetails}/${id}`, request);
  return response.data;
};

export const getPatientDetails = async (id: string) => {
  const response = await api.get(`${ENDPOINTS.patientDetails}/${id}`);
  return response.data as PatientDetailsDto;
};


export const searchPatients = async (query?: string) => {
  if (!query || !query.trim()) {
    // call without query param → backend should return all patients
    const response = await api.get(ENDPOINTS.patientSearch);
    return response.data as PatientSummaryDto[];
  }

  const response = await api.get(ENDPOINTS.patientSearch, {
    params: { query: query.trim() },
  });
  return response.data as PatientSummaryDto[];
};
