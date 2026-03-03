// src/features/technician/hooks/useRestockRequests.ts
import { useState, useMemo, useCallback } from "react";
import { useToast } from "@components/common/Toast/useToast";
// TODO: replace stub with real import once inventory.ts is updated:
// import { createRestockRequest } from "@api/inventory";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function createRestockRequest(_payload: {
  inventoryItemId: string;
  batchNumber: string;
  drugName: string;
  requestedQuantity: number;
  currentStock: number;
  reason: string;
  priority: string;
}): Promise<void> {
  // stub — wire to real API when backend is ready
  void _payload;
}
import { logger } from "@utils/logger/logger";
import type {
  InventoryItem,
  RestockRequest,
  NewRestockRequestForm,
} from "../technician.types";

// ── Seed data ────────────────────────────────────────────────────────────────
const SEED_REQUESTS: RestockRequest[] = [
  {
    id: "REQ001",
    drugName: "Amoxicillin",
    batchNumber: "BAT2024-001",
    requestedQuantity: 200,
    currentStock: 45,
    reason: "Low stock level — approaching minimum threshold",
    priority: "High",
    status: "Pending",
    requestedBy: "John Tech",
    requestedAt: new Date("2024-02-15"),
  },
  {
    id: "REQ002",
    drugName: "Metformin",
    batchNumber: "BAT2024-003",
    requestedQuantity: 300,
    currentStock: 0,
    reason: "Out of stock — urgent reorder needed",
    priority: "Critical",
    status: "Approved",
    requestedBy: "Jane Technician",
    requestedAt: new Date("2024-02-14"),
    approvedBy: "Dr. Smith",
    approvedAt: new Date("2024-02-14"),
  },
];

const DEFAULT_FORM: NewRestockRequestForm = {
  quantity: "",
  reason: "",
  priority: "Medium",
};

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useRestockRequests(technicianName: string) {
  const { showToast } = useToast();

  const [restockRequests, setRestockRequests] =
    useState<RestockRequest[]>(SEED_REQUESTS);

  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [form, setForm] = useState<NewRestockRequestForm>(DEFAULT_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ── Derived stats ─────────────────────────────────────────────────────────
  const pendingRequestsCount = useMemo(
    () => restockRequests.filter((r) => r.status === "Pending").length,
    [restockRequests]
  );

  // ── Open dialog for a specific inventory lot ──────────────────────────────
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

  // ── Submit new restock request ────────────────────────────────────────────
  const handleCreateRequest = useCallback(async () => {
    if (!selectedItem) return;

    if (!form.quantity || !form.reason) {
      showToast("error", "Missing Fields", "Please fill in all required fields before submitting");
      return;
    }

    const qty = parseInt(form.quantity, 10);
    if (isNaN(qty) || qty <= 0) {
      showToast("error", "Invalid Quantity", "Please enter a valid quantity greater than 0");
      return;
    }

    // Optimistic add
    const optimisticRequest: RestockRequest = {
      id: `REQ${String(restockRequests.length + 1).padStart(3, "0")}`,
      drugName: selectedItem.drugName,
      batchNumber: selectedItem.batchNumber,
      requestedQuantity: qty,
      currentStock: selectedItem.currentStock,
      reason: form.reason,
      priority: form.priority,
      status: "Pending",
      requestedBy: technicianName,
      requestedAt: new Date(),
    };

    setRestockRequests((prev) => [...prev, optimisticRequest]);
    showToast("success", "Request Created", `Restock request for ${selectedItem.drugName} has been submitted`);
    closeRestockDialog();

    // Persist to API
    setIsSubmitting(true);
    try {
      await createRestockRequest({
        inventoryItemId: selectedItem.id,
        batchNumber: selectedItem.batchNumber,
        drugName: selectedItem.drugName,
        requestedQuantity: qty,
        currentStock: selectedItem.currentStock,
        reason: form.reason,
        priority: form.priority,
      });
    } catch (error) {
      // Roll back
      setRestockRequests((prev) =>
        prev.filter((r) => r.id !== optimisticRequest.id)
      );
      showToast("error", "Submission Failed", "Could not submit the restock request. Please try again.");
      logger.error("handleCreateRequest failed", {
        item: selectedItem.id,
        error,
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [
    selectedItem,
    form,
    restockRequests.length,
    technicianName,
    showToast,
    closeRestockDialog,
  ]);

  return {
    restockRequests,
    selectedItem,
    isDialogOpen,
    form,
    setForm,
    isSubmitting,
    pendingRequestsCount,
    openRestockDialog,
    closeRestockDialog,
    handleCreateRequest,
  };
}