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

export interface RequestInventoryLotPayload {
  productId:         string;
  lotNumber:         string;
  expiry:            string;
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
    logger.error("searchInventory failed", { query, error });
    throw error;
  }
}