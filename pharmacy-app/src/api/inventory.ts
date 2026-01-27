// import api from "./axiosInstance";
// import { ENDPOINTS } from "./endpoints";
// import { logger } from "@utils/logger/logger";
// import type { InventorySearchItem } from "@prescription/models";

// /**
//  * Search inventory items
//  */
// export async function searchInventory(
//   query: string
// ): Promise<InventorySearchItem[] | undefined> {
//   try {
//     const res = await api.get<InventorySearchItem[]>(
//       ENDPOINTS.inventorySearch,
//       { params: { query } }
//     );

//     return res.data;
//   } catch (error) {
//     logger.error("Inventory search failed", {
//       query,
//       error,
//     });
//     return undefined;
//   }
// }
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
    const mapped: InventorySearchItem[] = res.data.map((item: any) => ({
      productId: item.id,           // map 'id' → 'productId'
      name: item.name,
      strength: item.strength,
      availableStock: item.inventory?.totalQuantity ?? 0,
    }));

    return mapped;
  } catch (error) {
    logger.error("Product search failed", {
      query,
      error,
    });
    throw error;
  }
}
