// src/features/technician/hooks/useDispenseQueue.ts
import { useMemo } from "react";
import { useToast } from "@components/common/Toast/useToast";
import { logger } from "@utils/logger/logger";
import type { DispenseItem, DispenseStatus } from "../technician.types";

// ── API stub ──────────────────────────────────────────────────────────────────
async function updateDispenseStatus(
  _id: string,
  _status: "Ready to Dispense" | "Dispensed"
): Promise<void> {
  // TODO: replace with real API call
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface UseDispenseQueueProps {
  items: DispenseItem[];
  onUpdateStatus: (id: string, status: DispenseStatus) => void;
}

export interface DispenseQueueStats {
  pendingDispense: number;
  readyToDispense: number;
  dispensedToday: number;
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useDispenseQueue({ items, onUpdateStatus }: UseDispenseQueueProps) {
  // ✅ Correct API: showToast(type, title, message?)
  const { showToast } = useToast();

  // ── Derived queue ──────────────────────────────────────────────────────────
  const queueData = useMemo(
    () =>
      items
        .filter((p) => p.status === "Payment Processed" || p.status === "Ready to Dispense")
        .sort((a, b) => {
          if (a.status === "Payment Processed" && b.status === "Ready to Dispense") return -1;
          if (a.status === "Ready to Dispense"  && b.status === "Payment Processed") return 1;
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }),
    [items]
  );

  // ── Stats ──────────────────────────────────────────────────────────────────
  const stats = useMemo<DispenseQueueStats>(() => {
    const today = new Date();
    return {
      pendingDispense: items.filter((p) => p.status === "Payment Processed").length,
      readyToDispense: items.filter((p) => p.status === "Ready to Dispense").length,
      dispensedToday:  items.filter((p) => {
        if (p.status !== "Dispensed" || !p.dispensedAt) return false;
        const d = new Date(p.dispensedAt);
        return (
          d.getDate()     === today.getDate()    &&
          d.getMonth()    === today.getMonth()   &&
          d.getFullYear() === today.getFullYear()
        );
      }).length,
    };
  }, [items]);

  // ── Mark Ready to Dispense ─────────────────────────────────────────────────
  const handleMarkReady = async (item: DispenseItem) => {
    onUpdateStatus(item.id, "Ready to Dispense");
    // ✅ Correct: showToast(type, title, message?)
    showToast("success", "Ready to Dispense", `Prescription ${item.id} has been marked ready`);
    try {
      await updateDispenseStatus(item.id, "Ready to Dispense");
    } catch (error) {
      onUpdateStatus(item.id, "Payment Processed"); // rollback
      showToast("error", "Update Failed", `Could not update status for ${item.id}`);
      logger.error("handleMarkReady failed", { id: item.id, error });
    }
  };

  // ── Mark Dispensed ─────────────────────────────────────────────────────────
  const handleMarkDispensed = async (item: DispenseItem) => {
    onUpdateStatus(item.id, "Dispensed");
    // ✅ Correct: showToast(type, title, message?)
    showToast("success", "Dispensed", `Prescription ${item.id} has been dispensed successfully`);
    try {
      await updateDispenseStatus(item.id, "Dispensed");
    } catch (error) {
      onUpdateStatus(item.id, "Ready to Dispense"); // rollback
      showToast("error", "Dispense Failed", `Could not mark ${item.id} as dispensed`);
      logger.error("handleMarkDispensed failed", { id: item.id, error });
    }
  };

  return { queueData, stats, handleMarkReady, handleMarkDispensed };
}