// src/prescription/hooks/usePatientSearch.ts
import { useCallback, useEffect, useRef, useState } from "react";
import { useDebouncedValue } from "@utils/hooks/useDebouncedValue";
import { searchPatients as defaultSearchPatients } from "@api/patientSearch";
import type { PatientSummary } from "../types/models";

type Options = {
  searchFn?: (q: string) => Promise<PatientSummary[] | undefined>;
  debounceMs?: number;
  minChars?: number;
};

export function usePatientSearch(options: Options = {}) {
  const {
    searchFn = defaultSearchPatients,
    debounceMs = 300,
    minChars = 2,
  } = options;

  const [query, setQuery] = useState("");
  const [showResults, setShowResults] = useState(false);

  const [results, setResults] = useState<PatientSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const debouncedQuery = useDebouncedValue(query, debounceMs);
  const requestIdRef = useRef(0);

  const getErrorMessage = (err: unknown): string => {
    if (typeof err === "string") return err;
    if (typeof err === "object" && err !== null) {
      const errorObj = err as { message?: string };
      return errorObj.message || "Failed to search patients";
    }
    return "Failed to search patients";
  };

  useEffect(() => {
    const q = (debouncedQuery ?? "").trim();

    if (!q || q.length < minChars) {
      setLoading(false);
      setError(null);
      setResults([]);
      return;
    }

    const requestId = ++requestIdRef.current;

    (async () => {
      setLoading(true);
      setError(null);

      try {
        const data = await searchFn(q);
        if (requestId !== requestIdRef.current) return;
        setResults(Array.isArray(data) ? data : []);
      } catch (e) {
        if (requestId !== requestIdRef.current) return;
        setError(getErrorMessage(e));
        setResults([]);
      } finally {
        if (requestId === requestIdRef.current) setLoading(false);
      }
    })();
  }, [debouncedQuery, minChars, searchFn]);

  const onQueryChange = useCallback((value: string) => {
    setQuery(value);
    setShowResults(true);
    if (!value.trim()) setResults([]);
  }, []);

  const selectPatient = useCallback((p: PatientSummary, onPicked: (p: PatientSummary) => void) => {
    onPicked(p);
    setQuery("");
    setResults([]);
    setShowResults(false);
  }, []);

  const openResults = useCallback(() => setShowResults(true), []);
  const closeResults = useCallback(() => setShowResults(false), []);

  return {
    query,
    results,
    loading,
    error,
    showResults,

    onQueryChange,
    selectPatient,
    openResults,
    closeResults,
    setShowResults, // sometimes useful
  };
}
