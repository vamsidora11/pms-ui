import type { PrescriptionDetails } from "@prescription/domain/model";
import type { ValidationSeverity } from "@validation/domain/model";

export interface AllergyAlert {
  issueType: string;
  severity: ValidationSeverity;
  affectedBy: string;
  message: string;
  allergenCode: string;
}

export type LineDecision = "Approved" | "Rejected";

export type ValidationUIState = {
  data: PrescriptionDetails | null;
  decisions: Record<string, LineDecision>;
  reasons: Record<string, string>;
  allergyFor: AllergyAlert | null;
  rejectLineId: string | null;
  rejectAllOpen: boolean;
};
