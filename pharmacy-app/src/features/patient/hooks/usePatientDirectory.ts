import { useEffect, useRef, useState } from "react";
import { useDebouncedValue } from "@utils/hooks/useDebouncedValue";
import type { PatientSummaryDto } from "@patient/types/patienttype";

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
  const searchFnRef = useRef(searchFn);

  useEffect(() => {
    searchFnRef.current = searchFn;
  }, [searchFn]);
  const getErrorMessage = (err: unknown): string => {
    if (typeof err === "string") return err;
    if (typeof err === "object" && err !== null) {
      const errorObj = err as { name?: string; code?: string; message?: string };
      return errorObj.message || "Failed to fetch patients";
    }
    return "Failed to fetch patients";
  };

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
        const result = await searchFnRef.current(shouldQuery ? q : "", {
          signal: controller.signal,
        });

        setPatients(result);
      } catch (err) {
        if (typeof err === "object" && err !== null) {
          const errorObj = err as { name?: string; code?: string };
          if (errorObj.name === "AbortError" || errorObj.code === "ERR_CANCELED") return;
        }
        console.error("searchPatients failed:", err);
        setListError(getErrorMessage(err));
        setPatients([]);
      } finally {
        setListLoading(false);
      }
    };

    load();
    return () => controller.abort();
  }, [debouncedSearch, minChars]);

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
