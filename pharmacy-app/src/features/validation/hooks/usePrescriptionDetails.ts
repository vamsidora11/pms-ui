import { useEffect, useState } from "react";
import { getPrescriptionById } from "@api/prescription";
import type { PrescriptionDetailsDto } from "@prescription/types/prescription.types";

export function usePrescriptionDetails(rxId: string) {
  const [data, setData] = useState<PrescriptionDetailsDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;

    (async () => {
      setLoading(true);
      setError(null);

      try {
        const res = await getPrescriptionById(rxId);
        if (!alive) return;
        setData(res);
      } catch (e: unknown) {
        const anyE = e as any;
        if (!alive) return;
        setError(
          anyE?.response?.data?.message ||
            anyE?.message ||
            "Failed to load prescription"
        );
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [rxId]);

  return { data, loading, error };
}