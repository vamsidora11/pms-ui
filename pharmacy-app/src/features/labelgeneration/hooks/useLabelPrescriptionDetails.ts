// src/features/labels/hooks/useLabelPrescriptionDetails.ts
import { useCallback, useRef, useState } from "react";
import type { LabelPrescriptionDetails } from "@labels/types/label.types";
import { getPrescriptionForLabels } from "@api/label";

type UseLabelPrescriptionDetailsResult = {
  selected: LabelPrescriptionDetails | null;
  loading: boolean;
  error: string | null;
  selectById: (id: string) => Promise<void>;
  clear: () => void;
};

export function useLabelPrescriptionDetails(): UseLabelPrescriptionDetailsResult {
  const [selected, setSelected] = useState<LabelPrescriptionDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // prevents out-of-order responses overriding newer selection
  const requestIdRef = useRef(0);

  const selectById = useCallback(async (id: string) => {
    const requestId = ++requestIdRef.current;
    setLoading(true);
    setError(null);

    try {
      const data = await getPrescriptionForLabels(id);
      if (requestId !== requestIdRef.current) return; // ignore stale response
      setSelected(data);
    } catch {
      if (requestId !== requestIdRef.current) return;
      setError("Failed to load prescription details.");
      setSelected(null);
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, []);

  const clear = useCallback(() => {
    setSelected(null);
    setError(null);
  }, []);

  return { selected, loading, error, selectById, clear };
}
