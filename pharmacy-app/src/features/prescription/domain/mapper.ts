import type {
  CreatePrescriptionRequestDto,
  PrescriptionDetailsDto,
  PrescriptionLineDto,
  PrescriptionSummaryDto,
  ReviewPrescriptionRequestDto,
} from "@api/prescription.dto";
import type { PrescriptionDraft } from "@prescription/types/models";
import type {
  PrescriptionDetails,
  PrescriptionLine,
  PrescriptionLineReviewDraft,
  PrescriptionStatus,
  PrescriptionSummary,
  ValidationSeverity,
} from "./model";

function toDate(value: string): Date {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? new Date(0) : parsed;
}

function toStatus(value: string): PrescriptionStatus {
  switch (value) {
    case "Created":
    case "Active":
    case "Cancelled":
    case "Completed":
      return value;
    default:
      return "Created";
  }
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

function maxSeverity(...values: Array<unknown>): ValidationSeverity {
  const hasHigh = values.some((value) => value === "High");
  if (hasHigh) return "High";

  const hasModerate = values.some((value) => value === "Moderate");
  if (hasModerate) return "Moderate";

  const hasLow = values.some((value) => value === "Low");
  if (hasLow) return "Low";

  return "None";
}

function getLineId(dto: PrescriptionLineDto, index: number): string {
  const candidates = [dto.id, dto.prescriptionLineId];
  const resolved = candidates.find(
    (value): value is string => typeof value === "string" && value.trim().length > 0
  );

  return resolved ?? `line:${index + 1}`;
}

function mapLineDto(dto: PrescriptionLineDto, index: number): PrescriptionLine {
  const allergySeverity = dto.validation?.drugAllergy?.overallSeverity;
  const interactionSeverity = dto.validation?.drugInteraction?.overallSeverity;

  return {
    lineId: getLineId(dto, index),
    productId: dto.productId,
    name: dto.productName,
    strength: dto.strength,
    frequency: dto.frequency,
    instructions: dto.instructions ?? "",
    durationDays: dto.durationDays,
    quantityPrescribed: dto.quantityPrescribed,
    quantityApprovedPerFill: dto.quantityApprovedPerFill ?? null,
    quantityDispensed: dto.quantityDispensed ?? 0,
    refillsAllowed: dto.refillsAllowed,
    refillsRemaining: dto.refillsRemaining ?? dto.refillsAllowed,
    validation: {
      hasAllergy: !!dto.validation?.drugAllergy?.isPresent,
      hasInteraction: !!dto.validation?.drugInteraction?.isPresent,
      severity: maxSeverity(allergySeverity, interactionSeverity),
      interactionDetails: dto.validation?.drugInteraction?.interactingWith?.map((detail) => ({
        productId: detail.productId,
        productName: detail.productName,
        severity: toSeverity(detail.severity),
        message: detail.message,
      })),
    },
    review: {
      status: dto.pharmacistReview?.status ?? "Pending",
      reviewedBy: dto.pharmacistReview?.reviewedBy ?? null,
      reviewedAt: dto.pharmacistReview?.reviewedAt
        ? toDate(dto.pharmacistReview.reviewedAt)
        : null,
      notes: dto.pharmacistReview?.notes ?? null,
    },
  };
}

export function mapSummaryDto(dto: PrescriptionSummaryDto): PrescriptionSummary {
  return {
    id: dto.id,
    patientId: dto.patientId,
    patientName: dto.patientName,
    prescriberName: dto.prescriberName,
    createdAt: toDate(dto.createdAt),
    status: toStatus(dto.status),
    medicineCount: dto.medicineCount,
  };
}

export function mapDetailsDto(dto: PrescriptionDetailsDto): PrescriptionDetails {
  const medicines = Array.isArray(dto.medicines)
    ? dto.medicines.map((line, index) => mapLineDto(line, index))
    : [];

  return {
    id: dto.id,
    patientId: dto.patientId,
    patientName: dto.patientName,
    prescriber: {
      id: dto.prescriber.id,
      name: dto.prescriber.name,
    },
    prescriberName: dto.prescriber.name,
    createdAt: toDate(dto.createdAt),
    status: toStatus(dto.status),
    medicineCount: medicines.length,
    medicines,
  };
}

export function mapDraftToCreateDto(
  draft: PrescriptionDraft
): CreatePrescriptionRequestDto {
  if (!draft.patient) {
    throw new Error("Patient is required");
  }

  return {
    patientId: draft.patient.id,
    patientName: draft.patient.fullName,
    prescriber: {
      id: draft.doctor.id,
      name: draft.doctor.name,
    },
    medicines: draft.medications.map((line) => {
      if (!line.drugId) {
        throw new Error("Each medicine must include a product id");
      }

      return {
        productId: line.drugId,
        frequency: line.frequency,
        instructions: line.instructions || "",
        durationDays: line.durationDays,
        quantityPrescribed: line.quantity,
        refillsAllowed: line.refills,
      };
    }),
  };
}

export function mapReviewToDto(
  reviews: PrescriptionLineReviewDraft[]
): ReviewPrescriptionRequestDto {
  return {
    reviews: reviews
      .map((review) => ({
        prescriptionLineId: review.prescriptionLineId ?? review.lineId ?? "",
        status: review.status,
        notes: review.notes?.trim() ? review.notes.trim() : null,
      }))
      .filter((review) => review.prescriptionLineId.trim().length > 0),
  };
}

export function mapSeverityFromLine(line: PrescriptionLine): ValidationSeverity {
  return toSeverity(line.validation.severity);
}
