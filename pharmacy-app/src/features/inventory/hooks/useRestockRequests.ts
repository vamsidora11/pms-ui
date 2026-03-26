import { useCallback, useEffect, useMemo, useState } from "react";
import { useToast } from "@components/common/Toast/useToast";
import { logger } from "@utils/logger/logger";
import {
  getPendingInventoryLots,
  requestInventoryLot,
  type InventoryLotDto,
  type RequestInventoryLotPayload,
} from "@api/inventory";
import type { NewRestockRequestForm, RestockProduct } from "@inventory/types/inventory.types";

export type { InventoryLotDto as RestockLotDto };

const DEFAULT_FORM: NewRestockRequestForm = { requestedQuantity: "" };
const PENDING_REQUESTS_PAGE_SIZE = 20;

function sortLotsByRequestedAt(lots: InventoryLotDto[]): InventoryLotDto[] {
  return [...lots].sort(
    (left, right) =>
      new Date(right.workflow.requestedAt).getTime() -
      new Date(left.workflow.requestedAt).getTime()
  );
}

export function useRestockRequests() {
  const { showToast } = useToast();

  const [restockRequests, setRestockRequests]                   = useState<InventoryLotDto[]>([]);
  const [pendingRequestsTotalCount, setPendingRequestsTotalCount] = useState(0);
  const [selectedProduct, setSelectedProduct]                   = useState<RestockProduct | null>(null);
  const [isDialogOpen, setIsDialogOpen]                         = useState(false);
  const [form, setForm]                                         = useState<NewRestockRequestForm>(DEFAULT_FORM);
  const [isLoadingRequests, setIsLoadingRequests]               = useState(true);
  const [isSubmitting, setIsSubmitting]                         = useState(false);

  const loadRestockRequests = useCallback(async () => {
    setIsLoadingRequests(true);
    try {
      const page = await getPendingInventoryLots({ pageSize: PENDING_REQUESTS_PAGE_SIZE });
      setRestockRequests(sortLotsByRequestedAt(page.items));
      setPendingRequestsTotalCount(page.totalCount);
    } catch (error) {
      setRestockRequests([]);
      setPendingRequestsTotalCount(0);
      showToast("error", "Failed to Load Requests", "Could not fetch restock requests.");
      logger.error("loadRestockRequests failed", { error });
    } finally {
      setIsLoadingRequests(false);
    }
  }, [showToast]);

  useEffect(() => { void loadRestockRequests(); }, [loadRestockRequests]);

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

  const handleCreateRequest = useCallback(async () => {
    if (!selectedProduct) return;

    if (!form.requestedQuantity.trim()) {
      showToast("error", "Missing Quantity", "Please enter a requested quantity.");
      return;
    }

    const qty = Number.parseInt(form.requestedQuantity, 10);
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
      await requestInventoryLot(payload);
      await loadRestockRequests();
      closeRestockDialog();
      showToast("success", "Request Submitted", `Restock request for ${selectedProduct.name} submitted.`);
    } catch (error) {
      showToast("error", "Submission Failed", "Could not submit the restock request. Please try again.");
      logger.error("handleCreateRequest failed", { productId: selectedProduct.id, error });
    } finally {
      setIsSubmitting(false);
    }
  }, [closeRestockDialog, form.requestedQuantity, loadRestockRequests, selectedProduct, showToast]);

  const pendingRequestsCount = useMemo(
    () => pendingRequestsTotalCount,
    [pendingRequestsTotalCount]
  );

  return {
    restockRequests,
    selectedProduct,
    isDialogOpen,
    form,
    setForm,
    isLoadingRequests,
    isSubmitting,
    pendingRequestsCount,
    openRestockDialog,
    closeRestockDialog,
    handleCreateRequest,
  };
}