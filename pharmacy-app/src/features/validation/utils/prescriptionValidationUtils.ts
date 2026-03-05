import type { ValidationSeverity } from "@validation/domain/model";

export function pillToneBySeverity(
  severity: ValidationSeverity | string | null | undefined
): "red" | "amber" | "yellow" | "green" {
  switch (severity) {
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

export function mapInteractionLevel(
  severity: ValidationSeverity | string | null | undefined
): "None" | "Minor" | "Moderate" | "Major" {
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

export function isReviewedDecision(decision: string | null | undefined): boolean {
  return decision === "Approved" || decision === "Rejected";
}
