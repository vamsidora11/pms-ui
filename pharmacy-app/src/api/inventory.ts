import api from "./axiosInstance";
import { ENDPOINTS } from "./endpoints";
import { logger } from "@utils/logger/logger";
import type { InventorySearchItem } from "@prescription/models";

/**
 * Search products (formerly inventory)
 * Maps API 'id' to InventorySearchItem.productId
 */
export async function searchInventory(
  query: string
): Promise<InventorySearchItem[]> {
  try {
    const res = await api.get(`${ENDPOINTS.products}`, {
      params: { q: query },
    });

    // Map raw API data to your DTO
    const data = Array.isArray(res.data) ? res.data : [];
    const mapped: InventorySearchItem[] = data.map((item: unknown) => {
      if (typeof item !== "object" || item === null) {
        return {
          productId: "",
          name: "",
          strength: "",
          availableStock: 0,
        };
      }

      const record = item as {
        id?: string;
        name?: string;
        strength?: string;
        inventory?: { totalQuantity?: number };
      };

      return {
        productId: record.id ?? "",
        name: record.name ?? "",
        strength: record.strength ?? "",
        availableStock: record.inventory?.totalQuantity ?? 0,
      };
    });

    return mapped;
  } catch (error) {
    logger.error("Product search failed", {
      query,
      error,
    });
    throw error;
  }
}
