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
import type { NewRestockRequestForm, RestockProduct } from "../technician.types";

// ── Re-export so callers can use InventoryLotDto directly ────────────────────
export type { InventoryLotDto as RestockLotDto };

const DEFAULT_FORM: NewRestockRequestForm = {
  quantity: "",
};

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useRestockRequests() {
  const { showToast } = useToast();

  // Submitted lots returned by the backend (status = "Pending")
  const [submittedLots, setSubmittedLots] = useState<InventoryLotDto[]>([]);

  const [selectedProduct, setSelectedProduct] = useState<RestockProduct | null>(null);
  const [isDialogOpen, setIsDialogOpen]   = useState(false);
  const [form, setForm]                   = useState<NewRestockRequestForm>(DEFAULT_FORM);
  const [isSubmitting, setIsSubmitting]   = useState(false);

  // ── Open / close dialog ───────────────────────────────────────────────────
  const openRestockDialog = useCallback((product: RestockProduct) => {
    setSelectedProduct(product);
    setForm(DEFAULT_FORM);
    setIsDialogOpen(true);
  }, []);

  const closeRestockDialog = useCallback(() => {
    setIsDialogOpen(false);
    setSelectedProduct(null);
    setForm(DEFAULT_FORM);
  }, []);

  // ── Submit — POST /api/inventory/lots/request ─────────────────────────────
  const handleCreateRequest = useCallback(async () => {
    if (!selectedProduct) return;

    // ── Validation ─────────────────────────────────────────────────────────
    if (!form.quantity) {
      showToast("error", "Missing Quantity", "Please enter a requested quantity.");
      return;
    }

    const qty = parseInt(form.quantity, 10);
    if (isNaN(qty) || qty <= 0) {
      showToast("error", "Invalid Quantity", "Please enter a valid quantity greater than 0.");
      return;
    }

    const payload: RequestInventoryLotPayload = {
      productId:         selectedProduct.id,
      requestedQuantity: qty,
    };

    setIsSubmitting(true);

    try {
      const created = await requestInventoryLot(payload);
      setSubmittedLots((prev) => [created, ...prev]);
      closeRestockDialog();
      showToast(
        "success",
        "Request Submitted",
        `Restock request for ${selectedProduct.name} submitted.`
      );
    } catch (error) {
      showToast(
        "error",
        "Submission Failed",
        "Could not submit the restock request. Please try again."
      );
      logger.error("handleCreateRequest failed", { item: selectedProduct.id, error });
    } finally {
      setIsSubmitting(false);
    }
  }, [closeRestockDialog, form.quantity, selectedProduct, showToast]);

  return {
    submittedLots,
    selectedProduct,
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
