export type PrescriptionStatus = "Created" | "Active" | "Cancelled" | "Completed";
export type ValidationSeverity = "High" | "Moderate" | "Low" | "None";
export type PrescriptionReviewStatus = "Pending" | "Approved" | "Rejected";

export interface PrescriptionSummary {
  id: string;
  patientId: string;
  patientName: string;
  prescriberName: string;
  createdAt: Date;
  status: PrescriptionStatus;
  medicineCount: number;
}

export interface PrescriptionLineValidation {
  hasAllergy: boolean;
  hasInteraction: boolean;
  severity: ValidationSeverity;
  interactionDetails?: Array<{
    productId?: string;
    productName?: string;
    severity?: ValidationSeverity;
    message?: string;
  }>;
}

export interface PrescriptionLineReview {
  status: PrescriptionReviewStatus;
  reviewedBy: string | null;
  reviewedAt: Date | null;
  notes: string | null;
}

export interface PrescriptionLine {
  lineId: string;
  productId: string;
  name: string;
  strength: string;
  frequency: string;
  instructions: string;
  durationDays: number;
  quantityPrescribed: number;
  quantityApprovedPerFill: number | null;
  quantityDispensed: number;
  refillsAllowed: number;
  refillsRemaining: number;
  validation: PrescriptionLineValidation;
  review: PrescriptionLineReview;
}

export interface PrescriptionDetails {
  id: string;
  patientId: string;
  patientName: string;
  prescriber: {
    id: string;
    name: string;
  };
  prescriberName: string;
  createdAt: Date;
  status: PrescriptionStatus;
  medicineCount: number;
  medicines: PrescriptionLine[];
}

export interface PrescriptionLineReviewDraft {
  prescriptionLineId?: string;
  lineId?: string;
  status: "Approved" | "Rejected";
  notes?: string | null;
}

export interface PrescriptionCreateDraft {
  patient: {
    id: string;
    fullName: string;
  } | null;
  doctor: {
    id: string;
    name: string;
  };
  medications: {
    drugId?: string;
    frequency: string;
    instructions: string;
    durationDays: number;
    quantity: number;
    refills: number;
  }[];
}
