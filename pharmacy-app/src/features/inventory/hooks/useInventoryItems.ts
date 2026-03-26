// src/features/technician/hooks/useInventoryItems.ts
//
// Fetches all inventory lots from the backend and groups them into
// MedicineGroup[] (one group per drug+strength, sorted FEFO).
//
import { useState, useEffect, useMemo, useCallback } from "react";
import { useToast } from "@components/common/Toast/useToast";
import { logger } from "@utils/logger/logger";
import {
  getAllInventoryLots,
  type InventoryLotDto,
} from "@api/inventory";
import type { InventoryItem, MedicineGroup, InventoryStatus } from "../technician.types";

// ── Pure helper — avoids Date.now() inside useMemo (React strict-mode rule) ──
function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

// ── Map backend InventoryLotDto → frontend InventoryItem ─────────────────────
//
// Field mapping:
//   lot.id                 → id
//   lot.productId          → id is actually the Lot ID; productId is separate
//   lot.lotNumber          → batchNumber
//   lot.expiry             → expiryDate (formatted as "YYYY-MM-DD")
//   lot.quantityAvailable  → currentStock
//   lot.status             → drives InventoryStatus derivation
//
// NOTE: minStock/maxStock/reorderLevel/unitPrice/supplier/category are NOT
// returned by InventoryLotDto — they live on the Product. For now we use
// sensible defaults; wire up once a combined endpoint is added.
//
function mapLotToItem(lot: InventoryLotDto): InventoryItem {
  const expiryDate = lot.expiry.split("T")[0]; // "2025-06-15T00:00:00Z" → "2025-06-15"

  return {
    id:           lot.id,         // lot ID (used for dispose key)
    productId:    lot.productId,
    drugName:     lot.productId,  // will be overridden once product names are joined
    batchNumber:  lot.lotNumber,
    strength:     "",             // not in InventoryLotDto — join with product if needed
    category:     "",
    currentStock: lot.quantityAvailable,
    minStock:     0,              // not in lot — wire from product when available
    maxStock:     lot.initialQuantity,
    reorderLevel: 0,
    unitPrice:    0,
    expiryDate,
    supplier:     lot.workflow.requestedBy, // closest available field
    lastRestocked: lot.workflow.requestedAt.split("T")[0],
    status:       deriveLotStatus(lot),
  };
}

function deriveLotStatus(lot: InventoryLotDto): InventoryStatus {
  if (lot.status === "Depleted" || lot.quantityAvailable === 0) return "Out of Stock";
  const threeMonths = addDays(new Date(), 90);
  if (new Date(lot.expiry) <= threeMonths) return "Expiring Soon";
  return "In Stock";
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useInventoryItems() {
  const { showToast } = useToast();

  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading]           = useState(true);
  const [expandedMedicines, setExpandedMedicines] = useState<Set<string>>(new Set());

  // ── Stable threshold — computed outside useMemo (React purity rule) ───────
  const threeMonthsTs = addDays(new Date(), 90).getTime();

  // ── Fetch all lots ────────────────────────────────────────────────────────
  const fetchItems = useCallback(async () => {
    setIsLoading(true);
    try {
      const lots = await getAllInventoryLots();
      setInventoryItems(lots.map(mapLotToItem));
    } catch (error) {
      showToast("error", "Failed to Load Inventory", "Could not fetch inventory data.");
      logger.error("fetchInventoryItems failed", { error });
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    void fetchItems();
  }, [fetchItems]);

  // ── Derived: medicine groups (FEFO) ──────────────────────────────────────
  const medicineGroups = useMemo<MedicineGroup[]>(() => {
    const cutoff = new Date(threeMonthsTs);
    const map    = new Map<string, InventoryItem[]>();

    inventoryItems.forEach((item) => {
      const key = `${item.drugName}-${item.strength}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(item);
    });

    return Array.from(map.entries()).map(([, lots]) => {
      const totalStock  = lots.reduce((sum, l) => sum + l.currentStock, 0);
      const first       = lots[0];
      const hasLow      = first.minStock > 0 && totalStock < first.minStock;
      const hasExpiring = lots.some((l) => new Date(l.expiryDate) <= cutoff);

      const status: InventoryStatus = hasLow
        ? "Low Stock"
        : hasExpiring
        ? "Expiring Soon"
        : "In Stock";

      return {
        key:       `${first.drugName}-${first.strength}`,
        drugName:  first.drugName,
        strength:  first.strength,
        category:  first.category,
        totalStock,
        minStock:  first.minStock,
        maxStock:  first.maxStock,
        lotsCount: lots.length,
        lots: [...lots].sort(
          (a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime()
        ),
        status,
      };
    });
  }, [inventoryItems, threeMonthsTs]);

  // ── Derived: stats ────────────────────────────────────────────────────────
  const inventoryStats = useMemo(() => {
    const cutoff = new Date(threeMonthsTs);
    const expiringLots = inventoryItems.filter(
      (i) => new Date(i.expiryDate) <= cutoff
    ).length;
    const expiringMedicines = medicineGroups.filter((g) =>
      g.lots.some((l) => new Date(l.expiryDate) <= cutoff)
    ).length;
    return {
      totalItems:       medicineGroups.length,
      lowStock:         medicineGroups.filter((g) => g.status === "Low Stock").length,
      expiringLots,
      expiringMedicines,
    };
  }, [medicineGroups, inventoryItems, threeMonthsTs]);

  // ── Derived: expiry tracking data ─────────────────────────────────────────
  const expiryData = useMemo(() => {
    const cutoff = new Date(threeMonthsTs);
    return inventoryItems.filter((i) => new Date(i.expiryDate) <= cutoff);
  }, [inventoryItems, threeMonthsTs]);

  // ── Action: toggle expand ─────────────────────────────────────────────────
  const toggleExpand = useCallback((key: string) => {
    setExpandedMedicines((prev) => {
      const next = new Set(prev);
      if (next.has(key)) { next.delete(key); } else { next.add(key); }
      return next;
    });
  }, []);

  // ── Action: dispose expired lot ───────────────────────────────────────────
  // NOTE: No DELETE endpoint exists in InventoryController.
  // This optimistically removes the item from the UI.
  // Wire to a real endpoint when the backend exposes one.
  const handleDispose = useCallback(
    async (item: InventoryItem) => {
      setInventoryItems((prev) => prev.filter((i) => i.id !== item.id));
      showToast(
        "success",
        "Item Removed",
        `${item.drugName} — Batch ${item.batchNumber} removed from view.`
      );
      // TODO: call DELETE /api/inventory/lots/{id} when endpoint is added
      logger.warn("handleDispose: no backend endpoint yet", { id: item.id });
    },
    [showToast]
  );

  return {
    inventoryItems,
    medicineGroups,
    expiryData,
    inventoryStats,
    isLoading,
    expandedMedicines,
    toggleExpand,
    handleDispose,
    refetch: fetchItems,
  };
}
