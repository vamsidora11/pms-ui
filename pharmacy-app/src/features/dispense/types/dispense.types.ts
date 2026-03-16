// src/features/prescription/types/dispense.types.ts

export type ClaimStatus = "pending" | "submitting" | "approved" | "rejected";
export type PaymentStatus = "pending" | "paid";
export type PaymentMethod = "cash" | "card" | "upi";
export type DispenseRowStatus = "ready" | "external" | "blocked" | "completed";

export interface DispenseRow {
  id: string;
  prescriptionLineId: string;
  productId: string;
  medicineName: string;
  strength: string;
  frequency: string;
  refillLabel: string;
  remaining: number;
  maxPrescribed: number;
  safeStock: number;
  unitPrice: number;
  status: DispenseRowStatus;
}

export interface AllocationResult {
  rowId: string;
  quantity: number;
  externalQty: number;
  totalPrice: number;
  patientPayable: number;
  insuranceCovered: number;
  isValid: boolean;
  error?: string;
}

export interface DispenseQueueItem {
  id: string;
  patientId: string;
  patientName: string;
  prescriberName: string;
  createdAt: string;
  status: "Created" | "Active" | "Cancelled" | "Completed";
  medicineCount: number;
  isUrgent?: boolean;
}
