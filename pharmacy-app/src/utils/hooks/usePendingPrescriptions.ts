import { useCallback, useEffect, useRef, useState } from "react";
import { getPendingPrescriptions } from "@api/prescription";
import { mapSummaryDto } from "@prescription/domain/mapper";
import type { PrescriptionSummary } from "@prescription/domain/model";

type Options = {
  refreshOnFocus?: boolean;
};

type UsePendingPrescriptionsReturn = {
  rows: PrescriptionSummary[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
};

export function usePendingPrescriptions(
  options: Options = {}
): UsePendingPrescriptionsReturn {
  const { refreshOnFocus = true } = options;

  const [rows, setRows] = useState<PrescriptionSummary[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const aliveRef = useRef<boolean>(true);

  const fetchData = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);

    let data: PrescriptionSummary[] | null = null;
    let hasError = false;

    try {
      const response = await getPendingPrescriptions();
      data = response.map(mapSummaryDto);
    } catch {
      hasError = true;
    }

    if (!aliveRef.current) return;

    if (hasError) {
      setError("Failed to load prescriptions");
    } else if (data) {
      setRows(data);
    }

    setLoading(false);
  }, []);

  // Initial fetch (corrected pattern)
  useEffect(() => {
    aliveRef.current = true;

    const run = async (): Promise<void> => {
      await fetchData();
    };

    void run();

    return () => {
      aliveRef.current = false;
    };
  }, [fetchData]);

  // Refetch on window focus
  useEffect(() => {
    if (!refreshOnFocus) return;

    const handleFocus = (): void => {
      void fetchData();
    };

    window.addEventListener("focus", handleFocus);

    return () => {
      window.removeEventListener("focus", handleFocus);
    };
  }, [refreshOnFocus, fetchData]);

  return { rows, loading, error, refetch: fetchData };
}
