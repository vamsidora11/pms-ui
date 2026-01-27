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
