export interface PrescriberDto {
  id: string;
  name: string;
}

export interface CreatePrescriptionMedicineRequest {
  productId: string;
  // Backend snapshots product metadata; keep client values optional/display-only.
  name?: string;
  strength?: string;
  prescribedQuantity: number;
  totalRefillsAuthorized: number;
  frequency: string;
  daysSupply: number;
  instruction?: string;
}

export interface CreatePrescriptionRequest {
  patientId: string;
  patientName: string;
  prescriber: PrescriberDto;
  medicines: CreatePrescriptionMedicineRequest[];
}

export interface PrescriptionMedicineDto {
  prescriptionMedicineId: string;
  productId: string;
  name: string;
  strength: string;
  prescribedQuantity: number;
  approvedQuantityPerFill?: number | null;
  dispensedQuantity: number;
  totalRefillsAuthorized: number;
  refillsRemaining: number;
  frequency: string;
  daysSupply: number;
  endDate: string | null;
  instruction: string;
  validation: MedicineValidationDto;
  pharmacistReview: PharmacistReviewDto;
}

export interface PrescriptionDetailsDto {
  id: string;
  patientId: string;
  patientName: string;
  prescriber: PrescriberDto;
  createdAt: string;
  expiresAt: string;
  status: string;
  isRefillable: boolean;
  medicines: PrescriptionMedicineDto[];
  __etag?: string;
}

export interface PrescriptionSummaryDto {
  alerts: boolean;
  id: string;
  patientId: string;
  patientName: string;
  prescriberName: string;
  createdAt: string;
  expiresAt: string;
  status: string;
  medicineCount: number;
  validationSummary: {
    totalIssues: number;
    highSeverityCount: number;
    moderateCount: number;
    lowCount: number;
    requiresReview: boolean;
  };
}

export interface ValidationSummaryDto {
  totalIssues: number;
  highSeverityCount: number;
  moderateCount: number;
  lowCount: number;
  requiresReview: boolean;
}

export interface MedicineValidationDto {
  drugAllergy: DrugAllergyValidationDto;
  drugInteraction: DrugInteractionValidationDto;
  inventory?: InventoryValidationDto;
  lowStock?: InventoryValidationDto;
}

export interface DrugAllergyValidationDto {
  isPresent: boolean;
  overallSeverity: string | null;
  allergies: AllergyValidationItemDto[];
}

export interface AllergyValidationItemDto {
  allergenCode: string;
  severity: string;
  message: string;
}

export interface DrugInteractionValidationDto {
  isPresent: boolean;
  overallSeverity: string | null;
  interactingWith: InteractionValidationItemDto[];
}

export interface InteractionValidationItemDto {
  productId: string;
  productName: string;
  severity: string;
  message: string;
}

export interface InventoryValidationDto {
  isPresent: boolean;
  severity: string | null;
  requiredQty: number;
  reservableQty?: number;
  physicalQty?: number;
  reservableNow?: number; // backward compatibility
  availableQty?: number; // backward compatibility
  message: string | null;
}

export type LowStockValidationDto = InventoryValidationDto;

export interface PharmacistReviewDto {
  decision: string;
  reviewedBy: string | null;
  reviewedAt: string | null;
  overrideReason: string | null;
}

// ==================== REVIEW TYPES ====================

export interface MedicineReviewDto {
  prescriptionMedicineId: string;
  decision: "Accepted" | "Rejected";
  overrideReason?: string | null;
  approvedQuantity: number | null;
}

export interface ReviewPrescriptionRequest {
  medicines: MedicineReviewDto[];
}
