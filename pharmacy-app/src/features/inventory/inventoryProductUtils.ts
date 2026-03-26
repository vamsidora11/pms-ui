import type { InventoryLotDto, InventoryProductDto, InventoryProductsQueryParams } from "@api/inventory";
import type { ServerTableQuery } from "@components/common/Table/Table";
import type { InventoryItem, InventoryStatus, RestockProduct } from "@inventory/types/inventory.types";

const DAY_MS = 24 * 60 * 60 * 1000;
const EXPIRING_SOON_DAYS = 90;

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * DAY_MS);
}

export function formatInventoryDate(value?: string | null): string {
  if (!value) return "-";
  return value.includes("T") ? value.split("T")[0] : value;
}

export function getLotNumber(lot: InventoryLotDto): string {
  return lot.lotNumber || lot.id;
}

export function isExpiringSoon(expiry: string): boolean {
  const expiryDate = new Date(expiry);
  if (Number.isNaN(expiryDate.getTime())) return false;
  return expiryDate.getTime() <= addDays(new Date(), EXPIRING_SOON_DAYS).getTime();
}

export function deriveLotStatus(
  lot: Pick<InventoryLotDto, "expiry" | "quantityAvailable" | "status">,
  isProductActive = true
): InventoryStatus {
  if (!isProductActive || lot.quantityAvailable <= 0 || lot.status === "Depleted") {
    return "Out of Stock";
  }
  if (isExpiringSoon(lot.expiry)) return "Expiring Soon";
  return "In Stock";
}

export function deriveProductStatus(
  product: Pick<InventoryProductDto, "isActive" | "totalQuantityAvailable" | "inventoryLots">
): InventoryStatus {
  if (!product.isActive || product.totalQuantityAvailable <= 0) return "Out of Stock";
  if (product.inventoryLots.some((lot) => isExpiringSoon(lot.expiry))) return "Expiring Soon";
  return "In Stock";
}

export interface InventoryProductRow extends InventoryProductDto {
  lotsCount:   number;
  stockStatus: InventoryStatus;
}

export function toInventoryProductRow(product: InventoryProductDto): InventoryProductRow {
  return {
    ...product,
    lotsCount:   product.inventoryLots.length,
    stockStatus: deriveProductStatus(product),
  };
}

export function toRestockProduct(
  product: Pick<
    InventoryProductDto,
    "id" | "name" | "strength" | "form" | "manufacturer" | "totalQuantityAvailable"
  >
): RestockProduct {
  return {
    id:                     product.id,
    name:                   product.name,
    strength:               product.strength,
    form:                   product.form,
    manufacturer:           product.manufacturer,
    totalQuantityAvailable: product.totalQuantityAvailable,
  };
}

export function mapInventoryLotToItem(
  product: InventoryProductDto,
  lot: InventoryLotDto
): InventoryItem {
  return {
    id:            lot.id,
    productId:     product.id,
    drugName:      product.name,
    batchNumber:   getLotNumber(lot),
    strength:      product.strength,
    category:      product.form,
    currentStock:  lot.quantityAvailable,
    minStock:      0,
    maxStock:      lot.initialQuantity,
    reorderLevel:  0,
    unitPrice:     product.basePricing?.unitPrice ?? 0,
    expiryDate:    formatInventoryDate(lot.expiry),
    supplier:      lot.supplierName || lot.workflow.requestedBy || "-",
    lastRestocked: formatInventoryDate(lot.workflow.requestedAt),
    status:        deriveLotStatus(lot, product.isActive),
  };
}

export function flattenInventoryLots(products: InventoryProductDto[]): InventoryItem[] {
  return products
    .flatMap((product) =>
      product.inventoryLots.map((lot) => mapInventoryLotToItem(product, lot))
    )
    .sort((left, right) =>
      new Date(left.expiryDate).getTime() - new Date(right.expiryDate).getTime()
    );
}

export function getExpiringInventoryItems(products: InventoryProductDto[]): InventoryItem[] {
  return flattenInventoryLots(products).filter((item) => isExpiringSoon(item.expiryDate));
}

export function removeInventoryLot(
  products: InventoryProductDto[],
  item: Pick<InventoryItem, "id" | "productId">
): InventoryProductDto[] {
  return products.map((product) => {
    if (product.id !== item.productId) return product;
    const inventoryLots = product.inventoryLots.filter((lot) => lot.id !== item.id);
    const totalQuantityAvailable = inventoryLots.reduce(
      (sum, lot) => sum + lot.quantityAvailable,
      0
    );
    return { ...product, inventoryLots, totalQuantityAvailable };
  });
}

export function buildInventoryProductsQuery(
  tableQuery: ServerTableQuery
): InventoryProductsQueryParams {
  const nameFilter         = tableQuery.columnFilters.name?.trim();
  const manufacturerFilter = tableQuery.columnFilters.manufacturer?.trim();
  const searchTerm         = tableQuery.searchTerm.trim();
  return {
    name:          nameFilter || searchTerm || undefined,
    manufacturer:  manufacturerFilter || undefined,
    isActive:      true,
    sortBy:        tableQuery.sortBy,
    sortDirection: tableQuery.sortDirection,
    pageSize:      tableQuery.pageSize,
    pageNumber:    tableQuery.pageNumber,
  };
}