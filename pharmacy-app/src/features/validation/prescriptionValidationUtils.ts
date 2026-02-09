import type { PrescriptionMedicineDto } from "@prescription/prescription.types";

export type Severity = "High" | "Moderate" | "Low" | "None";
export type InteractionLevel = "None" | "Minor" | "Moderate" | "Major";
export type ValidationResult = "Blocked" | "Partial" | "OK";

export function pillToneBySeverity(
  s: string | null | undefined
): "red" | "amber" | "yellow" | "green" {
  switch (s) {
    case "High":
      return "red";
    case "Moderate":
      return "amber";
    case "Low":
      return "yellow";
    default:
      return "green";
  }
}

export function computeValidation(
  medicine: PrescriptionMedicineDto,
  adjustedQty: number
): ValidationResult {
  if (medicine.validation?.drugAllergy?.overallSeverity === "High") return "Blocked";

  if (
    medicine.validation?.lowStock?.isPresent &&
    medicine.validation.lowStock.availableQty < adjustedQty
  ) {
    return "Partial";
  }

  return "OK";
}

export function mapInteractionLevel(severity: string | null | undefined): InteractionLevel {
  switch (severity) {
    case "High":
      return "Major";
    case "Moderate":
      return "Moderate";
    case "Low":
      return "Minor";
    default:
      return "None";
  }
}