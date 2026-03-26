export type InventoryStatus =
  | "In Stock"
  | "Low Stock"
  | "Out of Stock"
  | "Expiring Soon";

export interface InventoryItem {
  id:            string;
  productId:     string;
  drugName:      string;
  batchNumber:   string;
  strength:      string;
  category:      string;
  currentStock:  number;
  minStock:      number;
  maxStock:      number;
  reorderLevel:  number;
  unitPrice:     number;
  expiryDate:    string;
  supplier:      string;
  lastRestocked: string;
  status:        InventoryStatus;
}

export interface MedicineGroup {
  key:        string;
  drugName:   string;
  strength:   string;
  category:   string;
  totalStock: number;
  minStock:   number;
  maxStock:   number;
  lotsCount:  number;
  lots:       InventoryItem[];
  status:     InventoryStatus;
}

export interface RestockProduct {
  id:                     string;
  name:                   string;
  strength:               string;
  form:                   string;
  manufacturer:           string;
  totalQuantityAvailable: number;
}

export interface NewRestockRequestForm {
  requestedQuantity: string;
}