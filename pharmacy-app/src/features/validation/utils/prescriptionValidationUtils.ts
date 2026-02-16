import type { PrescriptionMedicineDto } from "@prescription/types/prescription.types";

export type Severity = "High" | "Moderate" | "Low" | "None";
export type InteractionLevel = "None" | "Minor" | "Moderate" | "Major";
export type ValidationResult = "Blocked" | "Partial" | "OK";

export function getInventoryValidation(medicine: PrescriptionMedicineDto) {
  return medicine.validation?.inventory ?? medicine.validation?.lowStock ?? null;
}

export function getReservableNow(medicine: PrescriptionMedicineDto): number | null {
  const inventory = getInventoryValidation(medicine);
  if (!inventory) return null;

  if (typeof inventory.reservableQty === "number") {
    return inventory.reservableQty;
  }
  if (typeof inventory.reservableNow === "number") {
    return inventory.reservableNow;
  }
  if (typeof inventory.availableQty === "number") {
    return inventory.availableQty;
  }

  return null;
}

export function getMaxApprovableQuantity(medicine: PrescriptionMedicineDto): number {
  const reservableNow = getReservableNow(medicine);
  if (reservableNow === null) {
    return medicine.prescribedQuantity;
  }

  return Math.max(0, Math.min(medicine.prescribedQuantity, reservableNow));
}

export function isValidApprovedQuantity(
  medicine: PrescriptionMedicineDto,
  approvedQty: number
): boolean {
  if (!Number.isFinite(approvedQty)) return false;
  if (!Number.isInteger(approvedQty)) return false;
  if (approvedQty <= 0) return false;
  return approvedQty <= getMaxApprovableQuantity(medicine);
}

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
  approvedQty: number
): ValidationResult {
  if (medicine.validation?.drugAllergy?.overallSeverity === "High") return "Blocked";

  const inventory = getInventoryValidation(medicine);
  const reservableNow = getReservableNow(medicine);

  if (
    inventory?.isPresent &&
    reservableNow !== null &&
    reservableNow < approvedQty
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
