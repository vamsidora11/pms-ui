// src/features/labels/hooks/useLabelQueue.ts
import { useCallback, useEffect, useRef, useState } from "react";
import { extractApiError } from "@utils/httpError";
import type { LabelQueuePrescription } from "@labels/types/label.types";
import { getLabelQueue } from "@api/label";

const LABEL_QUEUE_PAGE_SIZE = 10;
const LABEL_QUEUE_PAGE_NUMBER = 1;

type UseLabelQueueResult = {
  prescriptions: LabelQueuePrescription[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};

export function useLabelQueue(): UseLabelQueueResult {
  const [prescriptions, setPrescriptions] = useState<LabelQueuePrescription[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await getLabelQueue(
        LABEL_QUEUE_PAGE_SIZE,
        LABEL_QUEUE_PAGE_NUMBER
      );
      if (!mountedRef.current) return;
      setPrescriptions(res.items ?? []);
    } catch (error) {
      if (!mountedRef.current) return;
      setError(extractApiError(error) || "Failed to load label queue. Please try again.");
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { prescriptions, loading, error, refresh };
}
