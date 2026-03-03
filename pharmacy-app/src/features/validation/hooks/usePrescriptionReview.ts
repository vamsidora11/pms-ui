import { useCallback, useState } from "react";
import {
  activatePrescription,
  reviewPrescriptionLine,
  validatePrescription,
} from "@api/prescriptionValidation";
import { getPrescriptionById } from "@api/prescription";
import type { ReviewPrescriptionRequest } from "@prescription/types/prescription.types";

type SubmitResult = { ok: true } | { ok: false; message: string };

export function usePrescriptionReview(rxId: string) {
  const [submitting, setSubmitting] = useState(false);
  const [latestEtag, setLatestEtag] = useState<string | null>(null);
  const [latestSnapshot, setLatestSnapshot] = useState<
    Awaited<ReturnType<typeof getPrescriptionById>> | null
  >(null);

  const getErrorMessage = (error: unknown): string => {
    if (typeof error === "string") return error;
    if (typeof error === "object" && error !== null) {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      return err.response?.data?.message || err.message || "Request failed";
    }
    return "Request failed";
  };

  const refreshLatest = useCallback(
    async (fallbackEtag: string): Promise<void> => {
      const refreshed = await getPrescriptionById(rxId);
      setLatestSnapshot(refreshed);
      setLatestEtag(refreshed.__etag ?? fallbackEtag);
    },
    [rxId]
  );

  const reviewLine = useCallback(
    async (
      patientId: string,
      lineId: string,
      decision: "Accepted" | "Rejected",
      notes: string | null,
      etag: string
    ): Promise<SubmitResult> => {
      setSubmitting(true);
      try {
        const nextEtag = await reviewPrescriptionLine(
          rxId,
          patientId,
          lineId,
          decision,
          notes,
          etag
        );
        await refreshLatest(nextEtag ?? etag);
        return { ok: true };
      } catch (e) {
        return {
          ok: false,
          message: getErrorMessage(e),
        };
      } finally {
        setSubmitting(false);
      }
    },
    [refreshLatest, rxId]
  );

  const submitReview = useCallback(
    async (
      payload: ReviewPrescriptionRequest,
      patientId: string,
      etag: string
    ): Promise<SubmitResult> => {
      setSubmitting(true);
      try {
        let currentEtag = etag;

        for (const medicine of payload.medicines) {
          const nextEtag = await reviewPrescriptionLine(
            rxId,
            patientId,
            medicine.prescriptionMedicineId,
            medicine.decision,
            medicine.overrideReason ?? null,
            currentEtag
          );
          currentEtag = nextEtag ?? currentEtag;
        }

        await refreshLatest(currentEtag);
        return { ok: true };
      } catch (e) {
        return {
          ok: false,
          message: getErrorMessage(e),
        };
      } finally {
        setSubmitting(false);
      }
    },
    [refreshLatest, rxId]
  );

  const validateAndActivate = useCallback(
    async (etag: string): Promise<SubmitResult> => {
      setSubmitting(true);
      try {
        const validatedEtag = await validatePrescription(rxId, etag);
        const etagAfterValidate = validatedEtag ?? etag;
        const activatedEtag = await activatePrescription(rxId, etagAfterValidate);
        await refreshLatest(activatedEtag ?? etagAfterValidate);

        return { ok: true };
      } catch (e) {
        return {
          ok: false,
          message: getErrorMessage(e),
        };
      } finally {
        setSubmitting(false);
      }
    },
    [refreshLatest, rxId]
  );

  return {
    submitting,
    reviewLine,
    submitReview,
    validateAndActivate,
    latestEtag,
    latestSnapshot,
  };
}
