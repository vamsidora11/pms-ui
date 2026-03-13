export interface CreatePrescriptionRequestDto {
  patientId: string;
  patientName?: string;
  prescriber: {
    id: string;
    name: string;
  };
  medicines: {
    productId: string;
    frequency: string;
    instructions?: string;
    durationDays: number;
    quantityPrescribed: number;
    refillsAllowed: number;
  }[];
}

export interface ReviewPrescriptionRequestDto {
  reviews: {
    prescriptionLineId: string;
    status: "Approved" | "Rejected";
    notes?: string | null;
  }[];
}

export interface PrescriptionValidationSummaryDto {
  totalIssues: number;
  highSeverityCount: number;
  moderateCount: number;
  lowCount: number;
  requiresReview: boolean;
}

export interface PrescriptionSummaryDto {
  id: string;
  patientId: string;
  patientName: string;
  prescriberName: string;
  createdAt: string;
  status: "Created" | "Active" | "Cancelled" | "Completed";
  medicineCount: number;
  validationSummary?: PrescriptionValidationSummaryDto;
}

export interface PrescriptionLineValidationDto {
  drugAllergy?: {
    isPresent: boolean;
    overallSeverity: "High" | "Moderate" | "Low" | "None" | null;
    allergies?: {
      allergenCode: string;
      severity: "High" | "Moderate" | "Low" | "None";
      message: string;
    }[];
  };
  drugInteraction?: {
    isPresent: boolean;
    overallSeverity: "High" | "Moderate" | "Low" | "None" | null;
    interactingWith?: {
      productId: string;
      productName: string;
      severity: "High" | "Moderate" | "Low" | "None";
      message: string;
    }[];
  };
}

export interface PrescriptionLineReviewDto {
  status: "Pending" | "Approved" | "Rejected";
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  notes?: string | null;
}

export interface PrescriptionLineDto {
  id?: string;
  prescriptionLineId?: string;
  productId: string;
  productName: string;
  strength: string;
  frequency: string;
  instructions?: string | null;
  durationDays: number;
  quantityPrescribed: number;
  quantityApprovedPerFill?: number | null;
  quantityDispensed?: number;
  refillsAllowed: number;
  refillsRemaining?: number;
  validation?: PrescriptionLineValidationDto;
  pharmacistReview?: PrescriptionLineReviewDto;
}

export interface PrescriptionDetailsDto {
  id: string;
  patientId: string;
  patientName: string;
  prescriber: {
    id: string;
    name: string;
  };
  createdAt: string;
  status: "Created" | "Active" | "Cancelled" | "Completed";
  medicines: PrescriptionLineDto[];
}

export interface PrescriptionListResponseDto {
  items: PrescriptionSummaryDto[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}
