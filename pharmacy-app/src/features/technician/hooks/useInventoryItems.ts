// src/features/technician/hooks/useInventoryItems.ts
import { useState, useMemo, useCallback } from "react";
import { useToast } from "@components/common/Toast/useToast";
import { logger } from "@utils/logger/logger";
import type { InventoryItem, MedicineGroup, InventoryStatus } from "../technician.types";

// ── API stub ─────────────────────────────────────────────────────────────────
// TODO: replace with real import once inventory.ts is updated:
// import { disposeInventoryItem } from "@api/inventory";
async function disposeInventoryItem(id: string): Promise<void> {
  // stub — wire to real API when backend is ready
  return Promise.resolve(void id);
}

// ── Pure helper — avoids Date.now() inside useMemo ────────────────────────────
function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

// ── Seed data (replace with API call via useEffect when backend is ready) ────
const SEED_INVENTORY: InventoryItem[] = [
  {
    id: "INV001",
    drugName: "Amoxicillin",
    batchNumber: "BAT2024-001",
    strength: "500mg",
    category: "Antibiotic",
    currentStock: 45,
    minStock: 50,
    maxStock: 500,
    reorderLevel: 100,
    unitPrice: 12.5,
    expiryDate: "2025-06-15",
    supplier: "PharmaCorp",
    lastRestocked: "2024-01-15",
    status: "Low Stock",
  },
  {
    id: "INV001B",
    drugName: "Amoxicillin",
    batchNumber: "BAT2024-005",
    strength: "500mg",
    category: "Antibiotic",
    currentStock: 150,
    minStock: 50,
    maxStock: 500,
    reorderLevel: 100,
    unitPrice: 12.5,
    expiryDate: "2025-08-20",
    supplier: "PharmaCorp",
    lastRestocked: "2024-02-10",
    status: "In Stock",
  },
  {
    id: "INV002",
    drugName: "Lisinopril",
    batchNumber: "BAT2024-002",
    strength: "10mg",
    category: "Cardiovascular",
    currentStock: 250,
    minStock: 100,
    maxStock: 1000,
    reorderLevel: 200,
    unitPrice: 8.75,
    expiryDate: "2025-03-20",
    supplier: "MediSupply",
    lastRestocked: "2024-02-01",
    status: "Expiring Soon",
  },
  {
    id: "INV002B",
    drugName: "Lisinopril",
    batchNumber: "BAT2024-008",
    strength: "10mg",
    category: "Cardiovascular",
    currentStock: 400,
    minStock: 100,
    maxStock: 1000,
    reorderLevel: 200,
    unitPrice: 8.75,
    expiryDate: "2026-01-15",
    supplier: "MediSupply",
    lastRestocked: "2024-02-18",
    status: "In Stock",
  },
  {
    id: "INV003",
    drugName: "Metformin",
    batchNumber: "BAT2024-003",
    strength: "1000mg",
    category: "Diabetes",
    currentStock: 0,
    minStock: 75,
    maxStock: 750,
    reorderLevel: 150,
    unitPrice: 15.0,
    expiryDate: "2025-12-31",
    supplier: "GlobalMeds",
    lastRestocked: "2023-12-10",
    status: "Out of Stock",
  },
  {
    id: "INV004",
    drugName: "Atorvastatin",
    batchNumber: "BAT2024-004",
    strength: "20mg",
    category: "Cardiovascular",
    currentStock: 350,
    minStock: 100,
    maxStock: 800,
    reorderLevel: 200,
    unitPrice: 18.5,
    expiryDate: "2026-08-15",
    supplier: "PharmaCorp",
    lastRestocked: "2024-02-10",
    status: "In Stock",
  },
  {
    id: "INV005",
    drugName: "Ibuprofen",
    batchNumber: "BAT2024-011",
    strength: "400mg",
    category: "Pain Relief",
    currentStock: 35,
    minStock: 100,
    maxStock: 1000,
    reorderLevel: 200,
    unitPrice: 6.25,
    expiryDate: "2025-11-30",
    supplier: "PharmaCorp",
    lastRestocked: "2024-01-20",
    status: "Low Stock",
  },
  {
    id: "INV006",
    drugName: "Omeprazole",
    batchNumber: "BAT2024-012",
    strength: "20mg",
    category: "Gastrointestinal",
    currentStock: 42,
    minStock: 80,
    maxStock: 600,
    reorderLevel: 150,
    unitPrice: 10.0,
    expiryDate: "2025-09-15",
    supplier: "MediSupply",
    lastRestocked: "2024-01-05",
    status: "Low Stock",
  },
  {
    id: "INV007",
    drugName: "Aspirin",
    batchNumber: "BAT2024-013",
    strength: "81mg",
    category: "Cardiovascular",
    currentStock: 28,
    minStock: 150,
    maxStock: 2000,
    reorderLevel: 300,
    unitPrice: 3.5,
    expiryDate: "2026-02-28",
    supplier: "GlobalMeds",
    lastRestocked: "2023-12-15",
    status: "Low Stock",
  },
  {
    id: "INV008",
    drugName: "Levothyroxine",
    batchNumber: "BAT2024-014",
    strength: "50mcg",
    category: "Endocrine",
    currentStock: 18,
    minStock: 60,
    maxStock: 500,
    reorderLevel: 120,
    unitPrice: 14.75,
    expiryDate: "2025-07-20",
    supplier: "PharmaCorp",
    lastRestocked: "2024-01-12",
    status: "Low Stock",
  },
];

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useInventoryItems() {
  const { showToast } = useToast();

  const [inventoryItems, setInventoryItems] =
    useState<InventoryItem[]>(SEED_INVENTORY);

  const [expandedMedicines, setExpandedMedicines] = useState<Set<string>>(
    new Set()
  );

  // ── Stable threshold — computed OUTSIDE useMemo so memos stay pure ─────────
  // React flags Date.now() inside useMemo/render as impure because it changes
  // every call. We compute once per render here and pass the .getTime() number
  // as a dep, which IS stable between renders unless the date actually changes.
  const threeMonthsFromNow = addDays(new Date(), 90);
  const threeMonthsTs      = threeMonthsFromNow.getTime();

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
      const hasLow      = totalStock < first.minStock;
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

  // ── Derived: expiry tracking data ────────────────────────────────────────
  const expiryData = useMemo(() => {
    const cutoff = new Date(threeMonthsTs);
    return inventoryItems.filter((i) => new Date(i.expiryDate) <= cutoff);
  }, [inventoryItems, threeMonthsTs]);

  // ── Action: toggle expand ─────────────────────────────────────────────────
  const toggleExpand = useCallback((key: string) => {
    setExpandedMedicines((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }, []);

  // ── Action: dispose expired lot ───────────────────────────────────────────
  const handleDispose = useCallback(
    async (item: InventoryItem) => {
      setInventoryItems((prev) => prev.filter((i) => i.id !== item.id));
      showToast("success", "Item Disposed", `${item.drugName} — Batch ${item.batchNumber} removed from inventory`);

      try {
        await disposeInventoryItem(item.id);
      } catch (error) {
        setInventoryItems((prev) => [...prev, item]);
        showToast("error", "Dispose Failed", `Could not remove ${item.drugName} from inventory`);
        logger.error("handleDispose failed", { id: item.id, error });
      }
    },
    [showToast]
  );

  return {
    inventoryItems,
    medicineGroups,
    expiryData,
    inventoryStats,
    expandedMedicines,
    toggleExpand,
    handleDispose,
  };
}