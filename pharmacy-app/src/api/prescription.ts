import api from "./axiosInstance";
import { ENDPOINTS } from "./endpoints";

// Create a new manual prescription
export const prescriptionApi = async (prescriptionData: any) => {
  const response = await api.post(ENDPOINTS.prescriptionentry, prescriptionData);
  return response.data;
};

// Fetch prescription details by ID
export const getPrescriptionDetails = async (id: string) => {
  const response = await api.get(`${ENDPOINTS.prescriptionDetails}/${id}`);
  return response.data;
};

// Validate a prescription
export const validatePrescription = async (id: string) => {
  const response = await api.post(`${ENDPOINTS.validatePrescription}/${id}`);
  return response.data;
};
