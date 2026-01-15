import api from "./axiosInstance";
import { ENDPOINTS } from "./endpoints";

// Create a new manual prescription
export const prescriptionApi = async (prescriptionData: any) => {
  try {
    const response = await api.post(ENDPOINTS.prescriptionentry, prescriptionData);
    return response.data;
  } catch (error: any) {
    console.error("Failed to create prescription:", error);
    // throw error; // rethrow so UI can handle
  }
};

// Fetch prescription details by ID
export const getPrescriptionDetails = async (id: string) => {
  try {
    const response = await api.get(`${ENDPOINTS.prescriptionDetails}/${id}`);
    return response.data;
  } catch (error: any) {
    console.error(`Failed to fetch prescription details for ${id}:`, error);
    // throw error;
  }
};

// Validate a prescription
export const validatePrescription = async (id: string) => {
  try {
    const response = await api.post(`${ENDPOINTS.validatePrescription}/${id}`);
    return response.data;
  } catch (error: any) {
    console.error(`Failed to validate prescription ${id}:`, error);
    // throw error;
  }
};
