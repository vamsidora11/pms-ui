// src/features/technician/hooks/useRestockRequests.ts
//
// Restock = requesting a new inventory lot via POST /api/inventory/lots/request
// The backend's InventoryLotDto is the source of truth.
// "RestockRequest" in the UI = a pending InventoryLot.
//
import { useState, useCallback } from "react";
import { useToast } from "@components/common/Toast/useToast";
import { logger } from "@utils/logger/logger";
import {
  requestInventoryLot,
  type InventoryLotDto,
  type RequestInventoryLotPayload,
} from "@api/inventory";
import type { InventoryItem, NewRestockRequestForm } from "../technician.types";

// ── Re-export so callers can use InventoryLotDto directly ────────────────────
export type { InventoryLotDto as RestockLotDto };

const DEFAULT_FORM: NewRestockRequestForm = {
  quantity: "",
  reason:   "",
  priority: "Medium",
};

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useRestockRequests() {
  const { showToast } = useToast();

  // Submitted lots returned by the backend (status = "Pending")
  const [submittedLots, setSubmittedLots] = useState<InventoryLotDto[]>([]);

  const [selectedItem, setSelectedItem]   = useState<InventoryItem | null>(null);
  const [isDialogOpen, setIsDialogOpen]   = useState(false);
  const [form, setForm]                   = useState<NewRestockRequestForm>(DEFAULT_FORM);
  const [isSubmitting, setIsSubmitting]   = useState(false);

  // ── Open / close dialog ───────────────────────────────────────────────────
  const openRestockDialog = useCallback((item: InventoryItem) => {
    setSelectedItem(item);
    setForm(DEFAULT_FORM);
    setIsDialogOpen(true);
  }, []);

  const closeRestockDialog = useCallback(() => {
    setIsDialogOpen(false);
    setSelectedItem(null);
    setForm(DEFAULT_FORM);
  }, []);

  // ── Submit — POST /api/inventory/lots/request ─────────────────────────────
  // Maps InventoryItem (frontend) → RequestInventoryLotRequest (backend)
  //
  // Field mapping:
  //   selectedItem.id         → productId   (InventoryItem.id IS the productId)
  //   selectedItem.batchNumber → lotNumber
  //   selectedItem.expiryDate  → expiry (ISO string)
  //   form.quantity            → requestedQuantity
  //
  const handleCreateRequest = useCallback(async () => {
    if (!selectedItem) return;

    // ── Validation ─────────────────────────────────────────────────────────
    if (!form.quantity || !form.reason) {
      showToast("error", "Missing Fields", "Please fill in all required fields.");
      return;
    }

    const qty = parseInt(form.quantity, 10);
    if (isNaN(qty) || qty <= 0) {
      showToast("error", "Invalid Quantity", "Please enter a valid quantity greater than 0.");
      return;
    }

    // ── Build payload ──────────────────────────────────────────────────────
    // Backend expects: { productId, lotNumber, expiry (ISO), requestedQuantity }
    const payload: RequestInventoryLotPayload = {
      productId:         selectedItem.id,
      lotNumber:         selectedItem.batchNumber,
      expiry:            new Date(selectedItem.expiryDate).toISOString(),
      requestedQuantity: qty,
    };

    setIsSubmitting(true);
    closeRestockDialog();

    try {
      const created = await requestInventoryLot(payload);
      setSubmittedLots((prev) => [created, ...prev]);
      showToast(
        "success",
        "Request Submitted",
        `Restock request for ${selectedItem.drugName} submitted — pending manager approval.`
      );
    } catch (error) {
      showToast(
        "error",
        "Submission Failed",
        "Could not submit the restock request. Please try again."
      );
      logger.error("handleCreateRequest failed", { item: selectedItem.id, error });
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedItem, form, showToast, closeRestockDialog]);

  return {
    submittedLots,
    selectedItem,
    isDialogOpen,
    form,
    setForm,
    isSubmitting,
    pendingRequestsCount: submittedLots.filter((l) => l.status === "Pending").length,
    openRestockDialog,
    closeRestockDialog,
    handleCreateRequest,
  };
}