export interface ValidationIssueDto {
  isPresent: boolean;
  overallSeverity?: "High" | "Moderate" | "Low" | "None" | null;
}

export interface ValidationIssueDetailDto {
  severity?: "High" | "Moderate" | "Low" | "None";
  message?: string;
}

export interface DrugAllergyIssueDto extends ValidationIssueDto {
  allergies?: Array<
    ValidationIssueDetailDto & {
      allergenCode?: string;
    }
  >;
}

export interface DrugInteractionIssueDto extends ValidationIssueDto {
  interactingWith?: Array<
    ValidationIssueDetailDto & {
      productId?: string;
      productName?: string;
    }
  >;
}

export interface ValidationLineResultDto {
  id?: string;
  medicineId?: string;
  prescriptionLineId?: string;
  lineId?: string;
  prescriptionMedicineId?: string;
  productId?: string;
  productName?: string;

  // Some backends return flattened fields.
  drugAllergy?: DrugAllergyIssueDto;
  drugInteraction?: DrugInteractionIssueDto;

  // Current backend returns nested `validation`.
  validation?: {
    drugAllergy?: DrugAllergyIssueDto;
    drugInteraction?: DrugInteractionIssueDto;
  };
}

export interface ValidationResultDto {
  prescriptionId?: string;
  patientId?: string;
  lines?: ValidationLineResultDto[];
  medicines?: ValidationLineResultDto[];
  totalWarnings?: number;
  hasHighSeverityWarnings?: boolean;
  [key: string]: unknown;
}
