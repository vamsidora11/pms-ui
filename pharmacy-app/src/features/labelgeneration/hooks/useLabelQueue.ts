// src/features/labels/hooks/useLabelQueue.ts
import { useCallback, useEffect, useRef, useState } from "react";
import type { LabelQueuePrescription } from "@labels/types/label.types";
import { getLabelQueue } from "@api/label";

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
      const res = await getLabelQueue();
      if (!mountedRef.current) return;
      setPrescriptions(res.items ?? []);
    } catch {
      if (!mountedRef.current) return;
      setError("Failed to load label queue. Please try again.");
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
