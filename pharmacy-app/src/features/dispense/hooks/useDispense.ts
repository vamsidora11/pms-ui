// src/features/prescription/hooks/useDispense.ts
import { useState, useCallback } from "react";
import type {
  DispenseRow,
  AllocationResult,
  DispenseQueueItem,
} from "features/dispense/types/dispense.types";
import {
  createDispense,
  getDispenseById,
  getDispensePreview,
  type DispenseBillingSummaryDto,
  type DispenseDetailsDto,
} from "@api/dispense";
import { getPrescriptionById } from "@api/prescription";
import type { PrescriptionDetailsDto, PrescriptionLineDto } from "@api/prescription.dto";

export function calculateAllocation(
  row: DispenseRow,
  quantity: number,
  externalQty: number
): AllocationResult {
  const totalQty = quantity + externalQty;
  const totalPrice = quantity * row.unitPrice;

  const result: AllocationResult = {
    rowId: row.id,
    quantity,
    externalQty,
    isValid: true,
    totalPrice,
    insuranceCovered: 0,
    patientPayable: totalPrice,
  };

  if (totalQty > row.remaining) {
    result.isValid = false;
    result.error = `Max ${row.remaining}`;
  } else if (quantity > row.safeStock) {
    result.isValid = false;
    result.error = "Stock Low";
  }

  return result;
}

function resolvePrescriptionLineId(line: PrescriptionLineDto): string | undefined {
  return line.prescriptionLineId ?? line.id;
}

function buildRefillLabel(activeRefill: number, line?: PrescriptionLineDto): string {
  if (activeRefill <= 0) {
    return "Original Fill";
  }

  const allowed = line?.refillsAllowed ?? line?.refillsRemaining;
  if (typeof allowed === "number") {
    return `Refill ${activeRefill} of ${allowed}`;
  }

  return `Refill ${activeRefill}`;
}

function buildRowsFromPreview(
  preview: Awaited<ReturnType<typeof getDispensePreview>>,
  prescription: PrescriptionDetailsDto
): DispenseRow[] {
  const lines = prescription.medicines ?? [];
  const lineMap = new Map<string, PrescriptionLineDto>();
  lines.forEach((line) => {
    const id = resolvePrescriptionLineId(line);
    if (id) {
      lineMap.set(id, line);
    }
  });

  return preview.items.map((item) => {
    const line = lineMap.get(item.prescriptionLineId);
    const maxPrescribed =
      line?.quantityApprovedPerFill ?? line?.quantityPrescribed ?? item.remainingQty;
    const instructions = line?.instructions ?? line?.frequency ?? "";

    return {
      id: item.prescriptionLineId,
      prescriptionLineId: item.prescriptionLineId,
      productId: item.productId,
      medicineName: item.productName ?? line?.productName ?? "Unknown",
      strength: line?.strength ?? "",
      frequency: instructions,
      refillLabel: buildRefillLabel(item.activeRefillNumber, line),
      remaining: item.remainingQty,
      maxPrescribed,
      safeStock: item.safeStockAvailable,
      unitPrice: 0,
      status: "ready" as const,
    };
  });
}

export interface DispenseCheckoutState {
  dispenseId: string;
  patientId: string;
  prescriptionId: string;
  status: string;
  etag: string;
  billingSummary: DispenseBillingSummaryDto | null;
}

export function useDispense() {
  const [selectedItem, setSelectedItem] = useState<DispenseQueueItem | null>(null);
  const [activeRows, setActiveRows] = useState<DispenseRow[]>([]);
  const [dispenseQuantities, setDispenseQuantities] = useState<Record<string, number>>({});
  const [externalQuantities, setExternalQuantities] = useState<Record<string, number>>({});
  const [allocations, setAllocations] = useState<Record<string, AllocationResult>>({});
  const [checkoutState, setCheckoutState] = useState<DispenseCheckoutState | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);

  const applyDispenseDetails = useCallback(
    (dispense: DispenseDetailsDto) => {
      const itemMap = new Map(dispense.items.map((item) => [item.prescriptionLineId, item]));
      const nextRows = activeRows.map((row) => {
        const item = itemMap.get(row.prescriptionLineId);
        if (!item) return row;
        const unitPrice = item.pricing?.unitPrice ?? row.unitPrice;
        return { ...row, unitPrice };
      });

      const nextQuantities: Record<string, number> = {};
      const nextAllocations: Record<string, AllocationResult> = {};

      nextRows.forEach((row) => {
        const item = itemMap.get(row.prescriptionLineId);
        const quantity = item?.quantityDispensed ?? dispenseQuantities[row.id] ?? 0;
        const externalQty = externalQuantities[row.id] ?? 0;
        const totalPrice = item?.pricing?.total ?? quantity * row.unitPrice;
        const insuranceCovered = item?.pricing?.insurancePaid ?? 0;
        const patientPayable = item?.pricing?.patientPayable ?? totalPrice;
        const allocation = calculateAllocation(row, quantity, externalQty);
        allocation.totalPrice = totalPrice;
        allocation.insuranceCovered = insuranceCovered;
        allocation.patientPayable = patientPayable;
        nextQuantities[row.id] = quantity;
        nextAllocations[row.id] = allocation;
      });

      setActiveRows(nextRows);
      setDispenseQuantities(nextQuantities);
      setAllocations(nextAllocations);
      setCheckoutState((prev) =>
        prev
          ? { ...prev, billingSummary: dispense.billingSummary ?? null, status: dispense.status }
          : prev
      );
    },
    [activeRows, dispenseQuantities, externalQuantities]
  );

  const loadItem = useCallback(async (item: DispenseQueueItem) => {
    setSelectedItem(item);
    setIsLoadingDetails(true);
    setDetailsError(null);

    try {
      const [preview, prescription] = await Promise.all([
        getDispensePreview(item.id, item.patientId),
        getPrescriptionById(item.id, item.patientId),
      ]);

      const rows = buildRowsFromPreview(preview, prescription.data);
      const initialAllocations: Record<string, AllocationResult> = {};
      rows.forEach((r) => {
        initialAllocations[r.id] = calculateAllocation(r, 0, 0);
      });

      setActiveRows(rows);
      setDispenseQuantities({});
      setExternalQuantities({});
      setAllocations(initialAllocations);
      setCheckoutState(null);
    } catch (error) {
      setDetailsError("Failed to load dispense preview.");
      throw error;
    } finally {
      setIsLoadingDetails(false);
    }
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedItem(null);
    setActiveRows([]);
    setDispenseQuantities({});
    setExternalQuantities({});
    setAllocations({});
    setCheckoutState(null);
    setDetailsError(null);
  }, []);

  // Accepts a number directly — clamped to 0+ by QtyInput before calling
  const handleQtyChange = useCallback(
    (row: DispenseRow, value: string) => {
      const qty = Math.max(0, parseInt(value, 10) || 0);
      const externalQty = externalQuantities[row.id] ?? 0;
      setDispenseQuantities((prev) => ({ ...prev, [row.id]: qty }));
      setAllocations((prev) => ({
        ...prev,
        [row.id]: calculateAllocation(row, qty, externalQty),
      }));
    },
    [externalQuantities]
  );

  const handleExternalQtyChange = useCallback(
    (row: DispenseRow, value: string) => {
      const extQty = Math.max(0, parseInt(value, 10) || 0);
      const qty = dispenseQuantities[row.id] ?? 0;
      setExternalQuantities((prev) => ({ ...prev, [row.id]: extQty }));
      setAllocations((prev) => ({
        ...prev,
        [row.id]: calculateAllocation(row, qty, extQty),
      }));
    },
    [dispenseQuantities]
  );

  const hasErrors = activeRows.some((r) => allocations[r.id] && !allocations[r.id].isValid);
  const hasQuantities = activeRows.some((r) => (dispenseQuantities[r.id] ?? 0) > 0);

  const computeTotals = () => {
    if (checkoutState?.billingSummary) {
      return {
        insurance: checkoutState.billingSummary.totalInsurancePaid,
        patient: checkoutState.billingSummary.totalPatientPayable,
        grand: checkoutState.billingSummary.grandTotal,
      };
    }

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

  const checkoutDispense = useCallback(async (): Promise<DispenseCheckoutState | null> => {
    if (!selectedItem) return null;
    if (checkoutState) return checkoutState;

    const items = activeRows
      .map((row) => ({
        prescriptionLineId: row.prescriptionLineId,
        productId: row.productId,
        quantityToDispense: dispenseQuantities[row.id] ?? 0,
        isManualAdjustment: false,
      }))
      .filter((item) => item.quantityToDispense > 0);

    if (items.length === 0) {
      throw new Error("Select at least one quantity to dispense.");
    }
    if (hasErrors) {
      throw new Error("Fix quantity errors before checkout.");
    }

    const response = await createDispense(selectedItem.patientId, {
      prescriptionId: selectedItem.id,
      items,
    });

    const nextState: DispenseCheckoutState = {
      dispenseId: response.dispense.id,
      patientId: response.dispense.patientId,
      prescriptionId: response.dispense.prescriptionId,
      status: response.dispense.status,
      etag: response.etag ?? "",
      billingSummary: response.dispense.billingSummary ?? null,
    };

    setCheckoutState(nextState);
    applyDispenseDetails(response.dispense);
    return nextState;
  }, [activeRows, applyDispenseDetails, checkoutState, dispenseQuantities, hasErrors, selectedItem]);

  const refreshDispense = useCallback(
    async (dispenseId: string, patientId: string) => {
      const result = await getDispenseById(dispenseId, patientId);
      const nextState: DispenseCheckoutState = {
        dispenseId: result.dispense.id,
        patientId: result.dispense.patientId,
        prescriptionId: result.dispense.prescriptionId,
        status: result.dispense.status,
        etag: result.etag ?? "",
        billingSummary: result.dispense.billingSummary ?? null,
      };
      setCheckoutState(nextState);
      applyDispenseDetails(result.dispense);
      return nextState;
    },
    [applyDispenseDetails]
  );

  return {
    selectedItem,
    activeRows,
    dispenseQuantities,
    externalQuantities,
    allocations,
    hasErrors,
    hasQuantities,
    computeTotals,
    checkoutState,
    isLoadingDetails,
    detailsError,
    loadItem,
    clearSelection,
    handleQtyChange,
    handleExternalQtyChange,
    checkoutDispense,
    refreshDispense,
  };
}
