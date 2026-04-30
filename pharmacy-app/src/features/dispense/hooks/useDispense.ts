// src/features/dispense/hooks/useDispense.ts
import { useState, useCallback } from "react";
import { getDispensePreview } from "@api/dispense";
import type { DispensePreviewDto } from "@api/dispense";
import type {
  DispenseRow,
  DispenseWorkspace,
  WorkflowStep,
  DispenseQueueItem,
} from "../types/dispense.types";

// ── Build rows from preview — unitPrice now comes from the API ────────────────

function buildRows(preview: DispensePreviewDto): DispenseRow[] {
  return preview.items.map((item) => ({
    id:            item.prescriptionLineId,
    productId:     item.productId,
    medicineName:  item.productName,
    strength:      "",
    frequency:     "",
    refillLabel:   item.activeRefillNumber === 0
      ? "Original Fill"
      : `Refill ${item.activeRefillNumber}`,
    remaining:     item.remainingQty,
    maxPrescribed: item.remainingQty,
    safeStock:     item.safeStockAvailable,
    unitPrice:     item.unitPrice,    // ← real price from Product.BasePricing.UnitPrice
  }));
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useDispense() {
  const [workspace, setWorkspace]             = useState<DispenseWorkspace | null>(null);
  const [step, setStep]                       = useState<WorkflowStep>(1);
  const [isLoadingPreview, setLoadingPreview] = useState(false);
  const [previewError, setPreviewError]       = useState<string | null>(null);

  const [dispenseQty, setDispenseQty]   = useState<Record<string, number>>({});
  const [externalQty, setExternalQty]   = useState<Record<string, number>>({});
  const [qtyErrors, setQtyErrors]       = useState<Record<string, string>>({});
  const [extQtyErrors, setExtQtyErrors] = useState<Record<string, string>>({});

  // ── Load preview from API ──────────────────────────────────────────────────

  const loadItem = useCallback(async (item: DispenseQueueItem) => {
    setLoadingPreview(true);
    setPreviewError(null);
    try {
      const preview = await getDispensePreview(item.prescriptionId, item.patientId);
      if (preview.items.length === 0) {
        setPreviewError("No medications eligible for dispense at this time.");
        setWorkspace(null);
        return;
      }
      const rows    = buildRows(preview);

      setWorkspace({
        prescriptionId:    item.prescriptionId,
        patientId:         item.patientId,
        patientName:       preview.patientName,
        doctorName:        item.doctorName,
        insuranceProvider: preview.insurance?.provider ?? null,
        insuranceId:       preview.insurance?.policyId ?? null,
        allergies:         item.allergies,
        rows,
      });

      // Pre-fill dispense qty = remaining for each non-external row
      const initialQty: Record<string, number> = {};
      rows.forEach((r) => { initialQty[r.id] = r.remaining; });
      setDispenseQty(initialQty);
      setExternalQty({});
      setQtyErrors({});
      setExtQtyErrors({});
      setStep(1);
    } catch (err) {
      setPreviewError("Failed to load prescription details. Please try again.");
      console.error("useDispense.loadItem:", err);
    } finally {
      setLoadingPreview(false);
    }
  }, []);

  const clearSelection = useCallback(() => {
    setWorkspace(null);
    setStep(1);
    setDispenseQty({});
    setExternalQty({});
    setQtyErrors({});
    setExtQtyErrors({});
    setPreviewError(null);
  }, []);

  // ── Qty change handlers ────────────────────────────────────────────────────

  const handleQtyChange = useCallback(
    (rowId: string, val: string) => {
      if (!workspace) return;
      const qty = Math.max(0, parseInt(val) || 0);
      setDispenseQty((prev) => ({ ...prev, [rowId]: qty }));

      const row = workspace.rows.find((r) => r.id === rowId);
      if (!row || row.isExternal) return;
      const ext      = externalQty[rowId] || 0;
      const combined = qty + ext;

      setQtyErrors((prev) => {
        const e = { ...prev };
        if (qty > row.safeStock)
          e[rowId] = `Only ${row.safeStock} in stock`;
        else if (qty > row.remaining)
          e[rowId] = `Max allowed: ${row.remaining}`;
        else if (combined > row.remaining)
          e[rowId] = `Combined max: ${row.remaining}`;
        else
          delete e[rowId];
        return e;
      });

      setExtQtyErrors((prev) => {
        const e = { ...prev };
        if (combined > row.remaining)
          e[rowId] = `Combined max: ${row.remaining}`;
        else
          delete e[rowId];
        return e;
      });
    },
    [workspace, externalQty]
  );

  const handleExternalQtyChange = useCallback(
    (rowId: string, val: string) => {
      if (!workspace) return;
      const qty = Math.max(0, parseInt(val) || 0);
      setExternalQty((prev) => ({ ...prev, [rowId]: qty }));

      const row = workspace.rows.find((r) => r.id === rowId);
      if (!row) return;

      if (row.isExternal) {
        setExtQtyErrors((prev) => {
          const e = { ...prev };
          if (qty > row.remaining) e[rowId] = `Max: ${row.remaining}`;
          else delete e[rowId];
          return e;
        });
      } else {
        const dQty     = dispenseQty[rowId] || 0;
        const combined = dQty + qty;
        setExtQtyErrors((prev) => {
          const e = { ...prev };
          if (combined > row.remaining) e[rowId] = `Combined max: ${row.remaining}`;
          else delete e[rowId];
          return e;
        });
        setQtyErrors((prev) => {
          const e = { ...prev };
          if (combined > row.remaining)
            e[rowId] = `Combined max: ${row.remaining}`;
          else if (e[rowId]?.startsWith("Combined"))
            delete e[rowId];
          return e;
        });
      }
    },
    [workspace, dispenseQty]
  );

  // ── Validation ─────────────────────────────────────────────────────────────

  const validateAndProceed = useCallback((): boolean => {
    if (!workspace) return false;
    const errors:    Record<string, string> = {};
    const extErrors: Record<string, string> = {};

    workspace.rows.forEach((row) => {
      if (row.isExternal) {
        const ext = externalQty[row.id] || 0;
        if (ext > row.remaining) extErrors[row.id] = `Max: ${row.remaining}`;
        return;
      }
      const qty      = dispenseQty[row.id] || 0;
      const ext      = externalQty[row.id] || 0;
      const combined = qty + ext;

      if (qty > row.safeStock)
        errors[row.id] = `Only ${row.safeStock} in stock`;
      else if (qty > row.remaining)
        errors[row.id] = `Max allowed: ${row.remaining}`;
      else if (combined > row.remaining) {
        errors[row.id]    = `Combined max: ${row.remaining}`;
        extErrors[row.id] = `Combined max: ${row.remaining}`;
      }
    });

    setQtyErrors(errors);
    setExtQtyErrors(extErrors);
    return Object.keys(errors).length === 0 && Object.keys(extErrors).length === 0;
  }, [workspace, dispenseQty, externalQty]);

  // ── Subtotal — now correctly uses real unitPrice from preview ──────────────

  const computeSubtotal = useCallback((): number => {
    if (!workspace) return 0;
    return workspace.rows.reduce((sum, row) => {
      if (row.isExternal) return sum;
      const qty = dispenseQty[row.id] || 0;
      return sum + qty * row.unitPrice; // unitPrice is now real, not 0
    }, 0);
  }, [workspace, dispenseQty]);

  // ── After checkout — store dispenseId + etag ───────────────────────────────

  const setCheckoutResult = useCallback((
    dispenseId: string,
    etag:        string,
    grandTotal:  number
  ) => {
    setWorkspace((prev) =>
      prev ? { ...prev, dispenseId, dispenseEtag: etag, grandTotal } : prev
    );
  }, []);

  // Store real patient payable + insurance paid from backend after claim
  const setBackendBilling = useCallback((
    etag:               string,
    patientPayable:     number,
    insurancePaid:      number
  ) => {
    setWorkspace((prev) =>
      prev
        ? { ...prev, dispenseEtag: etag, backendPatientPayable: patientPayable, backendInsurancePaid: insurancePaid }
        : prev
    );
  }, []);

  return {
    workspace,
    step,
    setStep,
    isLoadingPreview,
    previewError,
    dispenseQty,
    externalQty,
    qtyErrors,
    extQtyErrors,
    loadItem,
    clearSelection,
    handleQtyChange,
    handleExternalQtyChange,
    validateAndProceed,
    computeSubtotal,
    setCheckoutResult,
    setBackendBilling,
  };
}
