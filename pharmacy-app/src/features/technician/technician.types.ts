

export interface TechnicianMedication {
  drugName: string;
  strength: string;
  dosage: string;
  quantity: number;
}

export type DispenseStatus =
  | "Pending"
  | "Validated"
  | "Payment Processed"
  | "Ready to Dispense"
  | "Dispensed"
  | "Cancelled";

export interface DispenseItem {
  id: string;
  patientId: string;
  patientName: string;
  medications: TechnicianMedication[];
  status: DispenseStatus;
  createdAt: Date;
  dispensedAt?: Date;
}

// ── Inventory ─────────────────────────────────────────────────────────────────

export type InventoryStatus =
  | "In Stock"
  | "Low Stock"
  | "Out of Stock"
  | "Expiring Soon";

export interface InventoryItem {
  id: string;
  drugName: string;
  batchNumber: string;
  strength: string;
  category: string;
  currentStock: number;
  minStock: number;
  maxStock: number;
  reorderLevel: number;
  unitPrice: number;
  expiryDate: string; // "YYYY-MM-DD"
  supplier: string;
  lastRestocked: string; // "YYYY-MM-DD"
  status: InventoryStatus;
}

export interface MedicineGroup {
  key: string;            // `${drugName}-${strength}` — unique per medicine+dose
  drugName: string;
  strength: string;
  category: string;
  totalStock: number;
  minStock: number;
  maxStock: number;
  lotsCount: number;
  lots: InventoryItem[];  // sorted by expiry ASC (FEFO order)
  status: InventoryStatus;
}

// ── Restock Requests ──────────────────────────────────────────────────────────

export type RestockPriority = "Low" | "Medium" | "High" | "Critical";
export type RestockStatus   = "Pending" | "Approved" | "Rejected" | "Completed";

export interface RestockRequest {
  id: string;
  drugName: string;
  batchNumber: string;
  requestedQuantity: number;
  currentStock: number;
  reason: string;
  priority: RestockPriority;
  status: RestockStatus;
  requestedBy: string;
  requestedAt: Date;
  approvedBy?: string;
  approvedAt?: Date;
  notes?: string;
}

export interface NewRestockRequestForm {
  quantity: string;
  reason: string;
  priority: RestockPriority;
}