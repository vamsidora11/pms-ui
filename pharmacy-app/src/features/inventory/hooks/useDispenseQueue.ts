// src/features/technician/hooks/useDispenseQueue.ts
//
// Fetches the PaymentProcessed dispense queue from the real backend.
// Technician can execute (mark Dispensed) each item.
//
import { useState, useEffect, useCallback, useMemo } from "react";
import { useToast } from "@components/common/Toast/useToast";
import { logger } from "@utils/logger/logger";
import {
  getDispenseQueue,
  getDispenseById,
  executeDispense,
  type DispenseSummaryDto,
} from "@api/dispense";

// ── Types ─────────────────────────────────────────────────────────────────────

export type { DispenseSummaryDto };

export interface DispenseQueueStats {
  paymentProcessed: number; // awaiting physical dispense
  dispensedToday:   number; // completed today
}

export interface UseDispenseQueueReturn {
  queueData:           DispenseSummaryDto[];
  stats:               DispenseQueueStats;
  isLoading:           boolean;
  // id of the row currently being executed (shows spinner on that row only)
  executingId:         string | null;
  // details fetched for PackingListModal
  selectedDispense:    { dispense: import("@api/dispense").DispenseDetailsDto; etag: string } | null;
  isLoadingDetails:    boolean;
  handleOpenDetails:   (row: DispenseSummaryDto) => Promise<void>;
  handleCloseDetails:  () => void;
  handleExecute:       (row: DispenseSummaryDto) => Promise<void>;
  refetch:             () => Promise<void>;
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useDispenseQueue(): UseDispenseQueueReturn {
  const { showToast } = useToast();

  const [allItems, setAllItems]   = useState<DispenseSummaryDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [executingId, setExecutingId] = useState<string | null>(null);

  const [selectedDispense, setSelectedDispense] = useState<{
    dispense: import("@api/dispense").DispenseDetailsDto;
    etag: string;
  } | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  // ── Fetch queue ────────────────────────────────────────────────────────────
  const fetchQueue = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await getDispenseQueue(50, 1);
      setAllItems(result.items);
    } catch (error) {
      showToast("error", "Failed to Load Queue", "Could not fetch the dispense queue.");
      logger.error("fetchQueue failed", { error });
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    void fetchQueue();
  }, [fetchQueue]);

  // ── Derived: only PaymentProcessed visible in the queue ───────────────────
  const queueData = useMemo(
    () => allItems.filter((d) => d.status === "PaymentProcessed"),
    [allItems]
  );

  // ── Stats ──────────────────────────────────────────────────────────────────
  const stats = useMemo<DispenseQueueStats>(() => {
    const today = new Date().toDateString();
    return {
      paymentProcessed: queueData.length,
      dispensedToday: allItems.filter((d) => {
        if (d.status !== "Dispensed") return false;
        return new Date(d.dispenseDate).toDateString() === today;
      }).length,
    };
  }, [queueData, allItems]);

  // ── Open packing list modal — fetch full details + ETag ───────────────────
  const handleOpenDetails = useCallback(
    async (row: DispenseSummaryDto) => {
      setIsLoadingDetails(true);
      try {
        const result = await getDispenseById(row.id, row.patientId);
        setSelectedDispense(result);
      } catch (error) {
        showToast("error", "Failed to Load Details", "Could not load dispense details.");
        logger.error("handleOpenDetails failed", { id: row.id, error });
      } finally {
        setIsLoadingDetails(false);
      }
    },
    [showToast]
  );

  const handleCloseDetails = useCallback(() => {
    setSelectedDispense(null);
  }, []);

  // ── Execute dispense ───────────────────────────────────────────────────────
  // Requires ETag from the details fetch — always fetch details first.
  // PUT /api/dispenses/{id}/execute?patientId=  → 204
  const handleExecute = useCallback(
    async (row: DispenseSummaryDto) => {
      setExecutingId(row.id);

      // Fetch fresh details to get the current ETag
      let etag: string;
      try {
        const result = await getDispenseById(row.id, row.patientId);
        etag = result.etag;
        // Also update modal details if it's open for this row
        setSelectedDispense(result);
      } catch (error) {
        showToast("error", "Failed to Execute", "Could not fetch dispense details before executing.");
        logger.error("handleExecute — details fetch failed", { id: row.id, error });
        setExecutingId(null);
        return;
      }

      // Optimistic: remove from queue immediately
      setAllItems((prev) =>
        prev.map((d) =>
          d.id === row.id ? { ...d, status: "Dispensed" } : d
        )
      );
      handleCloseDetails();

      try {
        await executeDispense(row.id, row.patientId, etag);
        showToast("success", "Dispensed", `Prescription ${row.prescriptionId} has been dispensed.`);
      } catch (error) {
        // Roll back
        setAllItems((prev) =>
          prev.map((d) =>
            d.id === row.id ? { ...d, status: "PaymentProcessed" } : d
          )
        );
        showToast("error", "Execute Failed", `Could not execute dispense for ${row.prescriptionId}.`);
        logger.error("handleExecute — execute failed", { id: row.id, error });
      } finally {
        setExecutingId(null);
      }
    },
    [showToast, handleCloseDetails]
  );

  return {
    queueData,
    stats,
    isLoading,
    executingId,
    selectedDispense,
    isLoadingDetails,
    handleOpenDetails,
    handleCloseDetails,
    handleExecute,
    refetch: fetchQueue,
  };
}