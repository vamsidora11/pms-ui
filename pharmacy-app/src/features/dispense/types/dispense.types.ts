// src/features/dispense/types/dispense.types.ts

export type WorkflowStep   = 1 | 2;
export type ClaimStatus    = "idle" | "submitting" | "approved" | "rejected";
export type PaymentStatus  = "idle" | "processing" | "done";
export type PaymentMethod  = "cash" | "card" | "upi";

/** A single row in the Step 1 dispense table — built from DispensePreviewItemDto */
export interface DispenseRow {
  id:               string; // prescriptionLineId
  productId:        string;
  medicineName:     string;
  strength:         string;
  frequency:        string;
  refillLabel:      string;
  remaining:        number; // remainingQty from preview
  maxPrescribed:    number;
  safeStock:        number; // safeStockAvailable from preview (real inventory)
  unitPrice:        number; // from DispenseItemPricingDto after checkout; 0 before
  isExternal?:      boolean;
}

/** Billing totals computed from dispense billing summary */
export interface BillTotals {
  subtotal:          number;
  insuranceCovered:  number;
  patientDue:        number;
}

/** Queue item built from PrescriptionSummaryDto */
export interface DispenseQueueItem {
  prescriptionId:    string;
  patientId:         string;
  patientName:       string;
  doctorName:        string;
  medicineCount:     number;
  status:            string;
  createdAt:         string; // ISO string from API
  insuranceProvider? : string;
  insuranceId?:      string;
  allergies?:        string[];
}

/** Workspace state — loaded after selecting a queue item */
export interface DispenseWorkspace {
  prescriptionId:   string;
  patientId:        string;
  patientName:      string;
  doctorName:       string;
  insuranceProvider?: string;
  insuranceId?:     string;
  allergies?:       string[];
  rows:             DispenseRow[];
  // Set after checkout succeeds
  dispenseId?:      string;
  dispenseEtag?:    string;
  grandTotal?:      number;
  // Set after insurance claim — real amounts from backend
  backendPatientPayable?: number;
  backendInsurancePaid?:  number;
}