import { useCallback, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "@store/index";
import { extractApiError } from "@utils/httpError";
import {
  fetchPrescriptionDetails,
  reviewPrescription as reviewPrescriptionThunk,
} from "@store/prescription/prescriptionSlice";
import type { PrescriptionLineReviewDraft } from "@prescription/domain/model";

type SubmitResult = { ok: true } | { ok: false; message: string };

export function usePrescriptionReview(rxId: string, patientId: string) {
  const dispatch = useDispatch<AppDispatch>();
  const [submitting, setSubmitting] = useState(false);
  const [latestEtag, setLatestEtag] = useState<string | null>(null);
  const latestSnapshot = useSelector(
    (state: RootState) => state.prescriptions.selected?.prescription ?? null
  );

  const refreshLatest = useCallback(async () => {
    if (!rxId || !patientId) {
      return;
    }
    await dispatch(fetchPrescriptionDetails({ id: rxId, patientId }));
  }, [dispatch, patientId, rxId]);

  const submitReview = useCallback(
    async (reviews: PrescriptionLineReviewDraft[], etag: string): Promise<SubmitResult> => {
      setSubmitting(true);

      try {
        const action = await dispatch(
          reviewPrescriptionThunk({
            id: rxId,
            patientId,
            reviews,
            etag,
          })
        );

        if (reviewPrescriptionThunk.fulfilled.match(action)) {
          setLatestEtag(action.payload.etag);
          return { ok: true };
        }

        const payload = action.payload;
        if (payload && typeof payload === "object" && "type" in payload) {
          const conflict = payload as { type: string; message: string; latest: { etag: string } };
          if (conflict.type === "conflict") {
            setLatestEtag(conflict.latest.etag);
            return { ok: false, message: conflict.message };
          }
        }

        return {
          ok: false,
          message:
            (typeof payload === "string" && payload.trim().length > 0
              ? payload
              : extractApiError(action.error)) || "Request failed",
        };
      } finally {
        setSubmitting(false);
      }
    },
    [dispatch, patientId, rxId]
  );

  return {
    submitting,
    submitReview,
    refreshLatest,
    latestEtag,
    latestSnapshot,
  };
}
