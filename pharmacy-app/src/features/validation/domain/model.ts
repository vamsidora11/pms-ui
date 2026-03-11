import type { ValidationSeverity } from "@prescription/domain/model";

export type { ValidationSeverity };

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
