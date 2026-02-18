import { useCallback, useState } from "react";
import {
  createDispenseForPrescription,
  reviewPrescription,
} from "@api/prescription";
import type { ReviewPrescriptionRequest } from "@prescription/types/prescription.types";

export function usePrescriptionReview(rxId: string) {
  const [submitting, setSubmitting] = useState(false);

  const getErrorMessage = (error: unknown): string => {
    if (typeof error === "string") return error;
    if (typeof error === "object" && error !== null) {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      return err.response?.data?.message || err.message || "Request failed";
    }
    return "Request failed";
  };

  const submitReview = useCallback(
    async (payload: ReviewPrescriptionRequest) => {
      setSubmitting(true);
      try {
        await reviewPrescription(rxId, payload);

        const hasAcceptedMedicine = payload.medicines.some(
          (medicine) => medicine.decision === "Accepted"
        );

        if (hasAcceptedMedicine) {
          await createDispenseForPrescription(rxId);
        }

        return { ok: true as const };
      } catch (e) {
        return {
          ok: false as const,
          message: getErrorMessage(e),
        };
      } finally {
        setSubmitting(false);
      }
    },
    [rxId]
  );

  return { submitting, submitReview };
}
