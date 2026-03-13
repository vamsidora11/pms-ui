import api from "./axiosInstance";
import { ENDPOINTS } from "./endpoints";
import { logger } from "@utils/logger/logger";
import type { InventorySearchItem } from "@prescription/types/models";

export interface InventoryWorkflowDto {
  requestedBy:     string;
  requestedAt:     string;
  reviewedAt:      string | null;
  reviewedBy:      string | null;
  rejectionReason: string | null;
}

export interface InventoryLotDto {
  id:                string;
  productId:         string;
  lotNumber:         string;
  supplierName?:     string;
  expiry:            string;
  requestedQuantity: number;
  initialQuantity:   number;
  quantityAvailable: number;
  status:            string;
  workflow:          InventoryWorkflowDto;
  productName?:      string;
  strength?:         string;
  manufacturer?:     string;
}

export interface InventoryInteractionDto {
  productId: string;
  name: string;
  severity: string;
}

export interface InventoryBasePricingDto {
  unitPrice: number;
  taxPercent: number;
}

export interface InventoryProductDto {
  id: string;
  name: string;
  strength: string;
  form: string;
  manufacturer: string;
  isActive: boolean;
  allergyTags: string[];
  interactions: InventoryInteractionDto[];
  basePricing: InventoryBasePricingDto;
  totalQuantityAvailable: number;
  inventoryLots: InventoryLotDto[];
}

export interface InventoryProductsQueryParams {
  name?: string;
  manufacturer?: string;
  isActive?: boolean;
  sortBy?: string;
  sortDirection?: "asc" | "desc";
  pageSize?: number;
  pageNumber?: number;
}

export interface InventoryProductsPageDto {
  items: InventoryProductDto[];
  pageSize: number;
  totalCount: number;
}

export interface RequestInventoryLotPayload {
  productId:         string;
  requestedQuantity: number;
}

export async function getLotsByProduct(productId: string): Promise<InventoryLotDto[]> {
  try {
    const res = await api.get<InventoryLotDto[]>(ENDPOINTS.inventoryLotsByProduct(productId));
    return res.data;
  } catch (error) {
    logger.error("getLotsByProduct failed", { productId, error });
    throw error;
  }
}

export async function getInventoryProducts(
  query: InventoryProductsQueryParams
): Promise<InventoryProductsPageDto> {
  try {
    const res = await api.get<InventoryProductsPageDto>(ENDPOINTS.inventoryProducts, {
      params: query,
    });

    return {
      items: Array.isArray(res.data?.items) ? res.data.items : [],
      pageSize: res.data?.pageSize ?? query.pageSize ?? 20,
      totalCount:
        res.data?.totalCount ??
        (Array.isArray(res.data?.items) ? res.data.items.length : 0),
    };
  } catch (error) {
    logger.error("getInventoryProducts failed", { query, error });
    throw error;
  }
}

export async function requestInventoryLot(payload: RequestInventoryLotPayload): Promise<InventoryLotDto> {
  try {
    const res = await api.post<InventoryLotDto>(ENDPOINTS.inventoryLotRequest, payload);
    return res.data;
  } catch (error) {
    logger.error("requestInventoryLot failed", { payload, error });
    throw error;
  }
}

export async function getAllInventoryLots(): Promise<InventoryLotDto[]> {
  try {
    const res = await api.get<InventoryLotDto[]>(ENDPOINTS.inventoryLotsAll);
    return res.data;
  } catch (error) {
    logger.error("getAllInventoryLots failed", { error });
    throw error;
  }
}

export async function getExpiringLots(days = 90): Promise<InventoryLotDto[]> {
  try {
    const res = await api.get<InventoryLotDto[]>(ENDPOINTS.inventoryExpiring, { params: { days } });
    return res.data;
  } catch (error) {
    logger.error("getExpiringLots failed", { days, error });
    throw error;
  }
}

export async function searchInventory(query: string): Promise<InventorySearchItem[]> {
  try {
    const res = await api.get(`${ENDPOINTS.products}`, { params: { q: query } });
    const data = Array.isArray(res.data) ? res.data : [];
    return data.map((item: unknown): InventorySearchItem => {
      if (typeof item !== "object" || item === null) {
        return { productId: "", name: "", strength: "", availableStock: 0 };
      }
      const record = item as {
        id?:        string;
        name?:      string;
        strength?:  string;
        inventory?: { totalQuantity?: number };
      };
      return {
        productId:      record.id       ?? "",
        name:           record.name     ?? "",
        strength:       record.strength ?? "",
        availableStock: record.inventory?.totalQuantity ?? 0,
      };
    });
  } catch (error) {
    logger.error("Product search failed", { query, error });
    throw error;
  }
}
