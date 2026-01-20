import api from "./axiosInstance";
import { ENDPOINTS } from "./endpoints";
import type { InventorySearchItem } from "@prescription/models";

/**
 * Search inventory items
 */
export async function searchInventory(
  query: string
): Promise<InventorySearchItem[] | undefined> {
  try {
    const res = await api.get<InventorySearchItem[]>(
      ENDPOINTS.inventorySearch,
      { params: { query } }
    );

    return res.data;
  } catch (error: any) {
    console.error("Inventory search failed:", error);
    return undefined;
  }
}
