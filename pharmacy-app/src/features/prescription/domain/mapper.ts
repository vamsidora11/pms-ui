import type {
  CreatePrescriptionRequestDto,
} from "@api/prescription.dto";
import type {
  PrescriptionCreateDraft,
  PrescriptionDetails,
  PrescriptionLine,
  PrescriptionLineReviewDraft,
  PrescriptionStatus,
  PrescriptionSummary,
  ValidationSeverity,
} from "./model";

type LineTransport = {
  id?: string;
  prescriptionLineId?: string;
  lineId?: string;
  medicineId?: string;
  prescriptionMedicineId?: string;
  productId: string;
  productName: string;
  strength: string;
  frequency: string;
  instructions?: string | null;
  durationDays: number;
  quantityPrescribed: number;
  quantityApprovedPerFill?: number | null;
  quantityDispensed?: number;
  refillsAllowed: number;
  refillsRemaining?: number;
  validation?: {
    drugAllergy?: {
      isPresent: boolean;
      overallSeverity: string | null;
    };
    drugInteraction?: {
      isPresent: boolean;
      overallSeverity: string | null;
      interactingWith?: Array<{
        productId?: string;
        productName?: string;
        severity?: "High" | "Moderate" | "Low" | "None";
        message?: string;
      }>;
    };
  };
  pharmacistReview?: {
    status: "Pending" | "Approved" | "Rejected";
    reviewedBy?: string | null;
    reviewedAt?: string | null;
    notes?: string | null;
  };
};

type SummaryTransport = {
  id: string;
  patientId: string;
  patientName: string;
  prescriberName: string;
  createdAt: string;
  status: string;
  medicineCount: number;
};

type DetailsTransport = {
  id: string;
  patientId: string;
  patientName: string;
  prescriber: {
    id: string;
    name: string;
  };
  createdAt: string;
  status: string;
  medicines: LineTransport[];
};

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

function mapLineDto(dto: LineTransport, index: number): PrescriptionLine {
  const allergySeverity = dto.validation?.drugAllergy?.overallSeverity;
  const interactionSeverity = dto.validation?.drugInteraction?.overallSeverity;
  const lineId =
    dto.lineId ??
    dto.prescriptionLineId ??
    dto.prescriptionMedicineId ??
    dto.id ??
    dto.medicineId ??
    `line:${index + 1}`;

  return {
    lineId,
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

export function mapSummaryDto(dto: SummaryTransport): PrescriptionSummary {
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

export function mapDetailsDto(dto: DetailsTransport): PrescriptionDetails {
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
  draft: PrescriptionCreateDraft
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
): { reviews: Array<{ prescriptionLineId: string; status: "Approved" | "Rejected"; notes?: string | null }> } {
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
