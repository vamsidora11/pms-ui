import { useCallback, useState } from "react";
import api from "@api/axiosInstance";
import { ENDPOINTS } from "@api/endpoints";

export function usePrescriptionReview(rxId: string) {
  const [submitting, setSubmitting] = useState(false);

  const submitReview = useCallback(
    async (payload: any) => {
      setSubmitting(true);
      try {
        await api.put(`${ENDPOINTS.prescriptions}/${rxId}/review`, payload);
        return { ok: true as const };
      } catch (e: unknown) {
        const anyE = e as any;
        return {
          ok: false as const,
          message:
            anyE?.response?.data?.message ||
            anyE?.message ||
            "Request failed",
        };
      } finally {
        setSubmitting(false);
      }
    },
    [rxId]
  );

  return { submitting, submitReview };
}