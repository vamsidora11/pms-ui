// src/features/technician/technician.types.ts
//
// Types that map to/from the real backend DTOs.
// DispenseItem / DispenseStatus are removed — use DispenseSummaryDto from @api/dispense.
// InventoryItem / MedicineGroup / RestockRequest remain for the inventory UI.
//

// ── Inventory ─────────────────────────────────────────────────────────────────

export type InventoryStatus =
  | "In Stock"
  | "Low Stock"
  | "Out of Stock"
  | "Expiring Soon";

export interface InventoryItem {
  id:            string; // lot ID
  drugName:      string; // productId until product names are joined
  batchNumber:   string; // lot.lotNumber
  strength:      string;
  category:      string;
  currentStock:  number; // lot.quantityAvailable
  minStock:      number;
  maxStock:      number; // lot.initialQuantity
  reorderLevel:  number;
  unitPrice:     number;
  expiryDate:    string; // "YYYY-MM-DD"
  supplier:      string; // lot.workflow.requestedBy (best available)
  lastRestocked: string; // lot.workflow.requestedAt date part
  status:        InventoryStatus;
}

export interface MedicineGroup {
  key:        string;         // `${drugName}-${strength}`
  drugName:   string;
  strength:   string;
  category:   string;
  totalStock: number;
  minStock:   number;
  maxStock:   number;
  lotsCount:  number;
  lots:       InventoryItem[]; // sorted by expiry ASC (FEFO)
  status:     InventoryStatus;
}

// ── Restock Requests ──────────────────────────────────────────────────────────
// Used only by the Restock Requests table UI.
// After wiring: maps from InventoryLotDto (status = "Pending").

export type RestockPriority = "Low" | "Medium" | "High" | "Critical";
export type RestockStatus   = "Pending" | "Approved" | "Rejected" | "Completed";

export interface RestockRequest {
  id:                string;
  drugName:          string;
  batchNumber:       string;
  requestedQuantity: number;
  currentStock:      number;
  reason:            string;
  priority:          RestockPriority;
  status:            RestockStatus;
  requestedBy:       string;
  requestedAt:       Date;
  approvedBy?:       string;
  approvedAt?:       Date;
  notes?:            string;
}

export interface NewRestockRequestForm {
  quantity: string;
  reason:   string;
  priority: RestockPriority;
}