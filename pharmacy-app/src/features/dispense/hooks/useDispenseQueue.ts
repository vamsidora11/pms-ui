// src/features/dispense/hooks/useDispenseQueue.ts
import { useState, useCallback, useEffect } from "react";
import { useSelector } from "react-redux";
import { getValidatedPrescriptions } from "@api/prescription";
import type { PrescriptionSummaryDto } from "@api/prescription";
import type { RootState } from "@store/index";
import type { DispenseQueueItem } from "../types/dispense.types";

function toQueueItem(dto: PrescriptionSummaryDto): DispenseQueueItem {
  return {
    prescriptionId: dto.id,
    patientId:      dto.patientId,
    patientName:    dto.patientName,
    doctorName:     dto.prescriberName,
    medicineCount:  dto.medicineCount,
    status:         dto.status,
    createdAt:      dto.createdAt,
  };
}

export function useDispenseQueue() {
  const [items, setItems]       = useState<DispenseQueueItem[]>([]);
  const [isLoading, setLoading] = useState(false);
  const [error, setError]       = useState<string | null>(null);

  // Wait for token to be present in Redux before firing
  const accessToken = useSelector((s: RootState) => s.auth.accessToken);

  const fetchQueue = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getValidatedPrescriptions(50, 1);
      setItems(result.items.map(toQueueItem));
    } catch (err) {
      setError("Failed to load dispense queue. Please try again.");
      console.error("useDispenseQueue:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Only fetch once we have a valid token
  useEffect(() => {
    if (accessToken) {
      fetchQueue();
    }
  }, [accessToken, fetchQueue]);

  return { items, isLoading, error, refetch: fetchQueue };
}