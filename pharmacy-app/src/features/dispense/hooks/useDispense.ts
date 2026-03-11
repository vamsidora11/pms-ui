// src/features/prescription/hooks/useDispense.ts
import { useState, useCallback } from "react";
import type {
  DispenseRow,
  AllocationResult,
  DispenseQueueItem,
  ClaimStatus,
} from "features/dispense/types/dispense.types";

const INSURANCE_COVERAGE_RATE = 0.65;

export function calculateAllocation(
  row: DispenseRow,
  internalQty: number,
  externalQty: number,
  claimStatus: ClaimStatus
): AllocationResult {
  const totalQty = internalQty + externalQty;
  const totalPrice = internalQty * row.unitPrice;

  const result: AllocationResult = {
    rowId: row.id,
    internalQty,
    externalQty,
    isValid: true,
    totalPrice,
    insuranceCovered: 0,
    patientPayable: totalPrice,
  };

  // Apply insurance only after claim approved, not for external rows
  if (!row.isExternal && claimStatus === "approved") {
    result.insuranceCovered = totalPrice * INSURANCE_COVERAGE_RATE;
    result.patientPayable = totalPrice - result.insuranceCovered;
  }

  if (totalQty > row.remaining) {
    result.isValid = false;
    result.error = `Max ${row.remaining}`;
  } else if (internalQty > row.safeStock) {
    result.isValid = false;
    result.error = `Stock Low`;
  }

  return result;
}

function buildRowsFromQueueItem(item: DispenseQueueItem): DispenseRow[] {
  return item.medications.map((m, i) => ({
    id: `${item.id}-${i}`,
    medicineName: m.drugName,
    strength: m.strength,
    frequency: m.instructions,
    refillLabel: m.refills === 0 ? "Original Fill" : `Refill 1 of ${m.refills}`,
    remaining: m.quantity,
    maxPrescribed: m.quantity,
    safeStock: 100,
    unitPrice: m.quantity > 0 ? m.price / m.quantity : 0,
    status: "ready" as const,
  }));
}

export function useDispense() {
  const [selectedItem, setSelectedItem] = useState<DispenseQueueItem | null>(null);
  const [activeRows, setActiveRows] = useState<DispenseRow[]>([]);
  const [dispenseQuantities, setDispenseQuantities] = useState<Record<string, number>>({});
  const [externalQuantities, setExternalQuantities] = useState<Record<string, number>>({});
  const [allocations, setAllocations] = useState<Record<string, AllocationResult>>({});

  const loadItem = useCallback((item: DispenseQueueItem) => {
    const rows = buildRowsFromQueueItem(item);
    const initialAllocations: Record<string, AllocationResult> = {};
    rows.forEach((r) => {
      initialAllocations[r.id] = calculateAllocation(r, 0, 0, "pending");
    });
    setActiveRows(rows);
    setDispenseQuantities({});
    setExternalQuantities({});
    setAllocations(initialAllocations);
    setSelectedItem(item);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedItem(null);
    setActiveRows([]);
    setDispenseQuantities({});
    setExternalQuantities({});
    setAllocations({});
  }, []);

  // Called after claim approved — recalculate all allocations with insurance
  const recalculateWithInsurance = useCallback(
    (
      rows: DispenseRow[],
      qty: Record<string, number>,
      extQty: Record<string, number>
    ) => {
      const newAllocations: Record<string, AllocationResult> = {};
      rows.forEach((row) => {
        newAllocations[row.id] = calculateAllocation(
          row,
          qty[row.id] || 0,
          extQty[row.id] || 0,
          "approved"
        );
      });
      setAllocations(newAllocations);
    },
    []
  );

  // Accepts a number directly — clamped to 0+ by QtyInput before calling
  const handleQtyChange = useCallback(
    (row: DispenseRow, value: string, claimStatus: ClaimStatus) => {
      const qty = Math.max(0, parseInt(value, 10) || 0);
      const extQty = externalQuantities[row.id] || 0;
      setDispenseQuantities((prev) => ({ ...prev, [row.id]: qty }));
      setAllocations((prev) => ({
        ...prev,
        [row.id]: calculateAllocation(row, qty, extQty, claimStatus),
      }));
    },
    [externalQuantities]
  );

  const handleExternalQtyChange = useCallback(
    (row: DispenseRow, value: string, claimStatus: ClaimStatus) => {
      const extQty = Math.max(0, parseInt(value, 10) || 0);
      const qty = dispenseQuantities[row.id] || 0;
      setExternalQuantities((prev) => ({ ...prev, [row.id]: extQty }));
      setAllocations((prev) => ({
        ...prev,
        [row.id]: calculateAllocation(row, qty, extQty, claimStatus),
      }));
    },
    [dispenseQuantities]
  );

  const hasErrors = activeRows.some(
    (r) => !r.isExternal && allocations[r.id] && !allocations[r.id].isValid
  );

  // Compute totals — grand is always the raw sum, insurance and patient depend on claim
  const computeTotals = () => {
    return Object.values(allocations).reduce(
      (acc, curr) => {
        if (curr.isValid) {
          acc.insurance += curr.insuranceCovered;
          acc.patient += curr.patientPayable;
          acc.grand += curr.totalPrice;
        }
        return acc;
      },
      { insurance: 0, patient: 0, grand: 0 }
    );
  };

  return {
    selectedItem,
    activeRows,
    dispenseQuantities,
    externalQuantities,
    allocations,
    hasErrors,
    computeTotals,
    loadItem,
    clearSelection,
    recalculateWithInsurance,
    handleQtyChange,
    handleExternalQtyChange,
  };
}