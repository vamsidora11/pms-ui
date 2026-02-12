import { useCallback, useEffect, useRef, useState } from "react";
import { getPendingPrescriptions } from "@api/prescription";
import type { PrescriptionSummaryDto } from "@prescription/types/prescription.types";

type Options = { refreshOnFocus?: boolean };

export function usePendingPrescriptions(options: Options = {}) {
  const { refreshOnFocus = true } = options;

  const [rows, setRows] = useState<PrescriptionSummaryDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const aliveRef = useRef(true);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getPendingPrescriptions();
      if (!aliveRef.current) return;
      setRows(data);
    } catch {
      if (!aliveRef.current) return;
      setError("Failed to load prescriptions");
    } finally {
      if (!aliveRef.current) return;
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    aliveRef.current = true;
    refetch();
    return () => {
      aliveRef.current = false;
    };
  }, [refetch]);

  useEffect(() => {
    if (!refreshOnFocus) return;
    const onFocus = () => refetch();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [refreshOnFocus, refetch]);

  return { rows, loading, error, refetch };
}
