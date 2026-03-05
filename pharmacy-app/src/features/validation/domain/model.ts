export type ValidationSeverity = "High" | "Moderate" | "Low" | "None";

export interface LineValidation {
  lineId: string;
  productId?: string;
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

export interface ValidationResult {
  prescriptionId: string;
  patientId: string;
  lines: LineValidation[];
}
