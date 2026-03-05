import { useCallback, useEffect, useState } from "react";
import { getPrescriptionById } from "@api/prescription.api";
import { mapDetailsDto } from "@prescription/domain/mapper";
import type { PrescriptionDetails } from "@prescription/domain/model";

type Result = {
  data: PrescriptionDetails | null;
  etag: string;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
};

function getErrorMessage(err: unknown): string {
  if (typeof err === "string") {
    return err;
  }
  if (typeof err === "object" && err !== null) {
    const obj = err as { response?: { data?: { message?: string } }; message?: string };
    return obj.response?.data?.message || obj.message || "Failed to load prescription";
  }
  return "Failed to load prescription";
}

export function usePrescriptionDetails(rxId: string, patientId: string): Result {
  const [data, setData] = useState<PrescriptionDetails | null>(null);
  const [etag, setEtag] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(async () => {
    if (!rxId || !patientId) {
      setLoading(false);
      setData(null);
      setEtag("");
      setError("Missing patient context.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await getPrescriptionById(rxId, patientId);
      setData(mapDetailsDto(response.data));
      setEtag(response.etag ?? "");
    } catch (err) {
      setError(getErrorMessage(err));
      setData(null);
      setEtag("");
    } finally {
      setLoading(false);
    }
  }, [patientId, rxId]);

  useEffect(() => {
    let mounted = true;
    const execute = async () => {
      if (!mounted) {
        return;
      }
      await run();
    };

    void execute();

    return () => {
      mounted = false;
    };
  }, [run]);

  return { data, etag, loading, error, refetch: run };
}
