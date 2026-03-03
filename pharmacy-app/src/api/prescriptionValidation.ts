import api from "./axiosInstance";
import { ENDPOINTS } from "./endpoints";
import { logger } from "@utils/logger/logger";

type ReviewDecision = "Accepted" | "Rejected";

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function normalizeEtag(value: unknown): string | undefined {
  if (!isNonEmptyString(value)) {
    return undefined;
  }
  const cleaned = value.trim().replace(/"/g, "");
  return cleaned.length > 0 ? cleaned : undefined;
}

function requireEtag(etag: string | undefined, operation: string): string {
  if (!isNonEmptyString(etag)) {
    throw new Error(`Missing ETag for ${operation}`);
  }
  return etag.trim();
}

function extractEtag(headers: unknown): string | undefined {
  if (!headers) {
    return undefined;
  }

  const getter = headers as { get?: (name: string) => unknown };
  if (typeof getter.get === "function") {
    const viaGetter = normalizeEtag(getter.get("etag"));
    if (viaGetter) {
      return viaGetter;
    }
  }

  if (typeof headers === "object" && headers !== null) {
    const record = headers as Record<string, unknown>;
    return normalizeEtag(record.etag ?? record.ETag);
  }

  return undefined;
}

export async function reviewPrescriptionLine(
  prescriptionId: string,
  patientId: string,
  lineId: string,
  decision: ReviewDecision,
  notes: string | null | undefined,
  etag: string
): Promise<string | undefined> {
  try {
    const res = await api.put(
      `${ENDPOINTS.prescriptions}/${prescriptionId}/lines/${lineId}/review`,
      {
        patientId,
        decision,
        notes: isNonEmptyString(notes) ? notes.trim() : null,
      },
      {
        headers: { "If-Match": requireEtag(etag, "review line") },
      }
    );

    logger.info("Prescription line reviewed successfully", {
      prescriptionId,
      lineId,
      decision,
    });

    return extractEtag(res.headers);
  } catch (error) {
    logger.error("Review prescription line failed", {
      prescriptionId,
      lineId,
      patientId,
      decision,
      error,
    });
    throw error;
  }
}

export async function validatePrescription(
  prescriptionId: string,
  etag: string
): Promise<string | undefined> {
  try {
    const res = await api.put(
      `${ENDPOINTS.prescriptions}/${prescriptionId}/validate`,
      undefined,
      {
        headers: { "If-Match": requireEtag(etag, "validate prescription") },
      }
    );
    logger.info("Prescription validated successfully", { prescriptionId });
    return extractEtag(res.headers);
  } catch (error) {
    logger.error("Validate prescription failed", {
      prescriptionId,
      error,
    });
    throw error;
  }
}

export async function activatePrescription(
  prescriptionId: string,
  etag: string
): Promise<string | undefined> {
  try {
    const res = await api.put(
      `${ENDPOINTS.prescriptions}/${prescriptionId}/activate`,
      undefined,
      {
        headers: { "If-Match": requireEtag(etag, "activate prescription") },
      }
    );
    logger.info("Prescription activated successfully", { prescriptionId });
    return extractEtag(res.headers);
  } catch (error) {
    logger.error("Activate prescription failed", {
      prescriptionId,
      error,
    });
    throw error;
  }
}
