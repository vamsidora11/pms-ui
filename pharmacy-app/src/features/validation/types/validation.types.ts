import type { PrescriptionDetailsDto } from "@prescription/prescription.types";
import type { Severity } from "@validation/prescriptionValidationUtils";

export type LineDecision = "Accepted" | "Rejected" | null;

export interface AllergyAlert {
  issueType: string;
  severity: Severity;
  affectedBy: string;
  message: string;
  allergenCode: string;
}

export type ValidationUIState = {
  data: PrescriptionDetailsDto | null;

  adjusted: Record<string, number>;
  decisions: Record<string, LineDecision>;
  reasons: Record<string, string>; // lineId -> reason, plus "_ALL_"

  allergyFor: AllergyAlert | null;
  rejectLineId: string | null;
  rejectAllOpen: boolean;
};