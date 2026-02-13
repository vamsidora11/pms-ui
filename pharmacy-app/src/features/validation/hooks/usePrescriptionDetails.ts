import { useEffect, useState } from "react";
import { getPrescriptionById } from "@api/prescription";
import type { PrescriptionDetailsDto } from "@prescription/types/prescription.types";

export function usePrescriptionDetails(rxId: string) {
  const [data, setData] = useState<PrescriptionDetailsDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;

    const getErrorMessage = (err: unknown): string => {
      if (typeof err === "string") return err;
      if (typeof err === "object" && err !== null) {
        const errorObj = err as { response?: { data?: { message?: string } }; message?: string };
        return (
          errorObj.response?.data?.message ||
          errorObj.message ||
          "Failed to load prescription"
        );
      }
      return "Failed to load prescription";
    };

    const run = async (): Promise<void> => {
      setLoading(true);
      setError(null);

      try {
        const res = await getPrescriptionById(rxId);
        if (alive) {
          setData(res);
        }
      } catch (e) {
        if (alive) {
          setError(getErrorMessage(e));
        }
      } finally {
        if (alive) {
          setLoading(false);
        }
      }
    };

    void run();

    return () => {
      alive = false;
    };
  }, [rxId]);

  return { data, loading, error };
}
