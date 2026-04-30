import type {
  ValidationLineResultDto,
  ValidationResultDto,
} from "@api/validation.dto";
import type { LineValidation, ValidationResult, ValidationSeverity } from "./model";

function getAllergy(line: ValidationLineResultDto) {
  return line.validation?.drugAllergy ?? line.drugAllergy;
}

function getInteraction(line: ValidationLineResultDto) {
  return line.validation?.drugInteraction ?? line.drugInteraction;
}

function toSeverity(value: unknown): ValidationSeverity {
  switch (value) {
    case "High":
    case "Moderate":
    case "Low":
      return value;
    default:
      return "None";
  }
}

function resolveSeverity(line: ValidationLineResultDto): ValidationSeverity {
  const allergySeverity = getAllergy(line)?.overallSeverity;
  const interactionSeverity = getInteraction(line)?.overallSeverity;

  if (allergySeverity === "High" || interactionSeverity === "High") {
    return "High";
  }
  if (allergySeverity === "Moderate" || interactionSeverity === "Moderate") {
    return "Moderate";
  }
  if (allergySeverity === "Low" || interactionSeverity === "Low") {
    return "Low";
  }
  return "None";
}

function mapLine(line: ValidationLineResultDto): LineValidation {
  const allergy = getAllergy(line);
  const interaction = getInteraction(line);

  return {
    lineId:
      line.lineId ??
      line.prescriptionLineId ??
      line.prescriptionMedicineId ??
      line.id ??
      line.medicineId ??
      "",
    productId: line.productId,
    hasAllergy: !!allergy?.isPresent,
    hasInteraction: !!interaction?.isPresent,
    severity: toSeverity(resolveSeverity(line)),
    interactionDetails: interaction?.interactingWith?.map((detail) => ({
      productId: detail.productId,
      productName: detail.productName,
      severity: toSeverity(detail.severity),
      message: detail.message,
    })),
  };
}

function normalizeLines(dto: ValidationResultDto): ValidationLineResultDto[] {
  if (Array.isArray(dto.lines)) return dto.lines;
  if (Array.isArray(dto.medicines)) return dto.medicines;

  return Object.entries(dto)
    .filter(([key]) => key.startsWith("rxline"))
    .map(([id, value]) => {
      const lineData =
        typeof value === "object" && value !== null
          ? (value as Partial<ValidationLineResultDto>)
          : {};

      return {
        prescriptionLineId: id,
        ...lineData,
      };
    });
}

export function mapValidationResultDto(dto: ValidationResultDto): ValidationResult {
  const rawLines = normalizeLines(dto);

  return {
    prescriptionId: dto.prescriptionId ?? "",
    patientId: dto.patientId ?? "",
    lines: rawLines
      .map(mapLine)
      .filter((line) => line.lineId.length > 0 || (line.productId ?? "").length > 0),
  };
}
