import { useEffect, useMemo, useRef, useState } from "react";
import { useDebouncedValue } from "@utils/hooks/useDebouncedValue";

export type AllergySearchFn = (
  query: string,
  opts?: { signal?: AbortSignal; minChars?: number },
) => Promise<string[]>;

type Params = {
  query: string;
  selected: string[];
  searchFn: AllergySearchFn; // DIP: injected dependency
  minChars?: number;
  debounceMs?: number;
};

export function useAllergySearch({
  query,
  selected,
  searchFn,
  minChars = 2, // ✅ default aligned with your api/catalogs.ts searchAllergies default
  debounceMs = 250,
}: Params) {
  const debouncedQuery = useDebouncedValue(query, debounceMs);

  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);

  const abortRef = useRef<AbortController | null>(null);

  const selectedSet = useMemo(() => {
    return new Set((selected ?? []).map((a) => (a ?? "").toLowerCase()));
  }, [selected]);

  const getErrorMessage = (err: unknown): string => {
    if (typeof err === "string") return err;
    if (typeof err === "object" && err !== null) {
      const errorObj = err as { name?: string; code?: string; message?: string };
      return errorObj.message || "Failed to search allergies";
    }
    return "Failed to search allergies";
  };

  useEffect(() => {
    const q = (debouncedQuery ?? "").trim();

    // Close & reset when query is empty or too short
    if (!q || q.length < minChars) {
      abortRef.current?.abort();
      setSuggestions([]);
      setError(null);
      setOpen(false);
      setHighlightIndex(-1);
      return;
    }

    // Cancel previous request
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const run = async () => {
      setLoading(true);
      setError(null);

      try {
        const results = await searchFn(q, {
          signal: controller.signal,
          minChars,
        });

        const normalized = (results ?? [])
          .map((s) => (s ?? "").toString().trim())
          .filter(Boolean);

        const filtered = normalized.filter(
          (s) => !selectedSet.has(s.toLowerCase()),
        );

        setSuggestions(filtered);
        setOpen(true);
        setHighlightIndex(filtered.length ? 0 : -1);
      } catch (err) {
        // Ignore aborts
        if (typeof err === "object" && err !== null) {
          const errorObj = err as { name?: string; code?: string };
          if (errorObj.name === "AbortError" || errorObj.code === "ERR_CANCELED") return;
        }

        setError(getErrorMessage(err));
        setSuggestions([]);
        setOpen(true);
        setHighlightIndex(-1);
      } finally {
        setLoading(false);
      }
    };

    run();
    return () => controller.abort();
  }, [debouncedQuery, minChars, searchFn, selectedSet]);

  return {
    suggestions,
    loading,
    error,
    open,
    setOpen,
    highlightIndex,
    setHighlightIndex,
  };
}
