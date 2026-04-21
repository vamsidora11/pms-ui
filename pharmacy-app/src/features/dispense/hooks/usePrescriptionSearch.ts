import { useState, useCallback } from "react";
import { getAllPrescriptions } from "@api/prescription";
import type { PrescriptionSummaryDto } from "@api/prescription";

interface SearchFilters {
  prescriptionId?: string;
  patientId?: string;
  patientName?: string;
}

export function usePrescriptionSearch() {
  const [results, setResults] = useState<PrescriptionSummaryDto[]>([]);
  const [isLoading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async (filters: SearchFilters) => {
    setLoading(true);
    setError(null);

    try {
      const res = await getAllPrescriptions({
        ...filters,
        pageSize: 10,
        pageNumber: 1,
        sortBy: "createdAt",
        sortDirection: "desc",
        status: "Active",
      });

      setResults(res.items);
    } catch {
      setError("Search failed");
    } finally {
      setLoading(false);
    }
  }, []);

  return { results, isLoading, error, search };
}
