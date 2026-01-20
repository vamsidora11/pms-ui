import api from "./axiosInstance";
import { ENDPOINTS } from "./endpoints";

// ===== DTOs matching C# backend =====

export interface DoctorDto {
  Id: string;
  Name: string;
}

export interface CreatePrescriptionItemDto {
  InventoryId: string;
  MedicineName: string;
  Strength: string;
  Frequency: string;
  QuantityPrescribed: number;
  DurationDays: number;
  RemainingRefills: number;
  Instructions: string;
}

export interface CreatePrescriptionRequest {
  PatientId: string;
  Doctor: DoctorDto;
  ExpiresAt: string;
  Items: CreatePrescriptionItemDto[];
}

export interface PrescriptionItemDto {
  RxItemId: string;
  InventoryId: string;
  MedicineName: string;
  Strength: string;
  Frequency: string;
  QuantityPrescribed: number;
  DurationDays: number;
  RemainingRefills: number;
  Instructions: string;
}

export interface PrescriptionDetailsDto {
  Id: string;
  PatientId: string;
  Doctor: DoctorDto;
  CreatedAt: string;
  ExpiresAt: string;
  Status: string;
  Items: PrescriptionItemDto[];
}

export interface PrescriptionSummaryDto {
  Id: string;
  CreatedAt: string;
  ExpiresAt: string;
  Status: string;
}

export interface CreatePrescriptionResponse {
  prescriptionId: string;
  status: string;
}

// ===== API FUNCTIONS =====

export async function createPrescription(
  payload: CreatePrescriptionRequest
): Promise<CreatePrescriptionResponse | undefined> {
  try {
    const res = await api.post<CreatePrescriptionResponse>(
      ENDPOINTS.prescriptions,
      payload
    );
    return res.data;
  } catch (error: any) {
    console.error("Create prescription failed:", error);
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
  } catch (error: any) {
    console.error("Fetching prescriptions by patient failed:", error);
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
  } catch (error: any) {
    console.error("Fetching prescription details failed:", error);
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
  } catch (error: any) {
    console.error("Cancel prescription failed:", error);
    return false;
  }
}
