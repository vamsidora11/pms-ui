// // ===== DTOs matching C# backend =====

// export interface DoctorDto {
//   Id: string;
//   Name: string;
// }

// export interface CreatePrescriptionItemDto {
//   InventoryId: string;
//   MedicineName: string;
//   Strength: string;
//   Frequency: string;
//   QuantityPrescribed: number;
//   DurationDays: number;
//   RemainingRefills: number;
//   Instructions: string;
// }

// export interface CreatePrescriptionRequest {
//   PatientId: string;
//   Doctor: DoctorDto;
//   ExpiresAt: string;
//   Items: CreatePrescriptionItemDto[];
// }

// export interface PrescriptionItemDto {
//   RxItemId: string;
//   InventoryId: string;
//   MedicineName: string;
//   Strength: string;
//   Frequency: string;
//   QuantityPrescribed: number;
//   DurationDays: number;
//   RemainingRefills: number;
//   Instructions: string;
// }

// export interface PrescriptionDetailsDto {
//   Id: string;
//   PatientId: string;
//   Doctor: DoctorDto;
//   CreatedAt: string;
//   ExpiresAt: string;
//   Status: string;
//   Items: PrescriptionItemDto[];
// }

// export interface PrescriptionSummaryDto {
//   Id: string;
//   CreatedAt: string;
//   ExpiresAt: string;
//   Status: string;
// }

// export interface CreatePrescriptionResponse {
//   prescriptionId: string;
//   status: string;
// }

// Request DTO
// ===== DTOs matching backend JSON (camelCase) =====

export interface DoctorDto {
  id: string;
  name: string;
}

export interface CreatePrescriptionItemDto {
  inventoryId: string;
  medicineName: string;
  strength: string;
  frequency: string;
  quantityPrescribed: number;
  durationDays: number;
  remainingRefills: number;
  instructions: string;
}

export interface CreatePrescriptionRequest {
  patientId: string;
  doctor: DoctorDto;
  expiresAt: string; // ISO string
  items: CreatePrescriptionItemDto[];
}

export interface PrescriptionItemDto {
  rxItemId: string;
  inventoryId: string;
  medicineName: string;
  strength: string;
  frequency: string;
  quantityPrescribed: number;
  durationDays: number;
  remainingRefills: number;
  instructions: string;
}

export interface PrescriptionDetailsDto {
  id: string;
  patientId: string;
  doctor: DoctorDto;
  createdAt: string;
  expiresAt: string;
  status: string;
  items: PrescriptionItemDto[];
}

export interface PrescriptionSummaryDto {
  id: string;
  createdAt: string;
  expiresAt: string;
  status: string;
}

export interface CreatePrescriptionResponse {
  prescriptionId: string;
  status: string;
}
