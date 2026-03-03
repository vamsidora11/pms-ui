import type { PrescriptionDetailsDto } from "@prescription/types/prescription.types";
import type { Severity } from "@validation/utils/prescriptionValidationUtils";

export interface AllergyAlert {
  issueType: string;
  severity: Severity;
  affectedBy: string;
  message: string;
  allergenCode: string;
}

export type ValidationUIState = {
  data: PrescriptionDetailsDto | null;
  reasons: Record<string, string>; // lineId -> reason, plus "_ALL_"
  allergyFor: AllergyAlert | null;
  rejectLineId: string | null;
  rejectAllOpen: boolean;
};
