import { useEffect, useRef, useState } from "react";
import { useDebouncedValue } from "@utils/hooks/useDebouncedValue";
import type { PatientSummaryDto } from "@store/patient/patienttype";

export type SearchPatientsFn = (
  query: string,
  opts?: { signal?: AbortSignal },
) => Promise<PatientSummaryDto[]>;

type Params = {
  searchFn: SearchPatientsFn;
  debounceMs?: number;
  minChars?: number; // keep same behavior as before (>=1)
};

export function usePatientDirectory({
  searchFn,
  debounceMs = 250,
  minChars = 2,
}: Params) {
  const [patients, setPatients] = useState<PatientSummaryDto[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebouncedValue(searchTerm, debounceMs);

  const [listLoading, setListLoading] = useState(false);
  const [listError, setListError] = useState<string | null>(null);

  const listAbortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    listAbortRef.current?.abort();
    const controller = new AbortController();
    listAbortRef.current = controller;

    const load = async () => {
      setListLoading(true);
      setListError(null);

      try {
        const q = (debouncedSearch ?? "").trim();
        const shouldQuery = q.length >= minChars;
        const result = await searchFn(shouldQuery ? q : "", {
          signal: controller.signal,
        });

        setPatients(result);
      } catch (err: any) {
        if (err?.name === "AbortError" || err?.code === "ERR_CANCELED") return;
        console.error("searchPatients failed:", err);
        setListError(err?.message || "Failed to fetch patients");
        setPatients([]);
      } finally {
        setListLoading(false);
      }
    };

    load();
    return () => controller.abort();
  }, [debouncedSearch, minChars, searchFn]);

  return {
    patients,
    setPatients,
    searchTerm,
    setSearchTerm,
    debouncedSearch,
    listLoading,
    listError,
  };
}
