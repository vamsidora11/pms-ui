export type Severity = "High" | "Moderate" | "Low" | "None";
export type InteractionLevel = "None" | "Minor" | "Moderate" | "Major";

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

export function mapInteractionLevel(
  severity: string | null | undefined
): InteractionLevel {
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
  return decision === "Accepted" || decision === "Rejected";
}
