// src/features/prescription/types/dispense.types.ts

export type ClaimStatus = "pending" | "submitting" | "approved" | "rejected";
export type PaymentStatus = "pending" | "paid";
export type PaymentMethod = "cash" | "card" | "upi";
export type DispenseRowStatus = "ready" | "external" | "blocked" | "completed";

export interface DispenseRow {
  id: string;
  medicineName: string;
  strength: string;
  frequency: string;
  refillLabel: string;
  remaining: number;
  maxPrescribed: number;
  safeStock: number;
  unitPrice: number;
  status: DispenseRowStatus;
  isExternal?: boolean;
}

export interface AllocationResult {
  rowId: string;
  internalQty: number;
  externalQty: number;
  totalPrice: number;
  patientPayable: number;
  insuranceCovered: number;
  isValid: boolean;
  error?: string;
}

export interface DispenseMedication {
  drugName: string;
  strength: string;
  quantity: number;
  instructions: string;
  price: number;
  refills: number;
}

export interface DispenseQueueItem {
  id: string;
  patientId: string;
  patientName: string;
  doctorName: string;
  insuranceProvider?: string;
  allergies?: string[];
  medications: DispenseMedication[];
  status: string;
  createdAt: Date;
  totalAmount: number;
  paymentStatus: string;
  isUrgent?: boolean;
}