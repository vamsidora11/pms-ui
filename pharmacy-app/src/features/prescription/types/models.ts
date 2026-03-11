/**
 * Patient data used in Prescription flow
 */
export type Gender = "Male" | "Female" | "Other";

export interface PatientSummary {
  id: string;
  fullName: string;
  phone: string;
}

export interface PatientDetails extends PatientSummary {
  dob: string;
  gender: Gender;
  email?: string | null;
  address?: string | null;
  allergies?: string[];
  insurance?: {
    provider: string;
    policyId: string;
  } | null;
}

/**
 * Drug master data
 */
export interface Drug {
  id: string;
  name: string;
  strength: string;
  price: number;
}

/**
 * Medication row while creating prescription
 * Maps to CreatePrescriptionItemDto in backend
 */
export interface MedicationDraft {
  drugId?: string; // Maps to InventoryId - REQUIRED for submission
  drugName: string; // Maps to MedicineName
  strength: string; // Maps to Strength
  frequency: string; // Maps to Frequency (e.g., "BID", "TID", "QID", "Once daily")
  quantity: number; // Maps to QuantityPrescribed
  durationDays: number; // Maps to DurationDays
  refills: number; // Maps to RemainingRefills
  instructions: string; // Maps to Instructions
  price?: number; // UI only - not submitted
}

export interface InventoryItem {
  id: string;
  name: string;
  strength: string;
  allergenCodes: string[];
  lots: {
    lotId: string;
    expiry: string;
    quantity: number;
  }[];
}

/**
 * Doctor details - no validation, just free text entry
 * User enters ID and Name manually
 */
export interface DoctorDetails {
  id: string; // Free text - user enters manually
  name: string; // Free text - user enters manually
}

export interface PrescriptionDraft {
  patient: PatientDetails | null;
  doctor: DoctorDetails;
  medications: MedicationDraft[];
  notes: string; // Not sent to backend currently
}

export interface InventorySearchItem {
  productId: string;
  name: string;
  strength: string;
  availableStock: number;
}

/**
 * Frequency options for prescriptions
 */
export const FREQUENCY_OPTIONS = [
  { value: "OD", label: "Once Daily (OD)" },
  { value: "BID", label: "Twice Daily (BID)" },
  { value: "TID", label: "Three Times Daily (TID)" },
  { value: "QID", label: "Four Times Daily (QID)" },
  { value: "Q4H", label: "Every 4 Hours (Q4H)" },
  { value: "Q6H", label: "Every 6 Hours (Q6H)" },
  { value: "Q8H", label: "Every 8 Hours (Q8H)" },
  { value: "Q12H", label: "Every 12 Hours (Q12H)" },
  { value: "PRN", label: "As Needed (PRN)" },
  { value: "STAT", label: "Immediately (STAT)" },
] as const;
