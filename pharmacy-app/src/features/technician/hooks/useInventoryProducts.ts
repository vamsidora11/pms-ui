import { useCallback, useEffect, useMemo, useState } from "react";

import type { ServerTableQuery } from "@components/common/Table/Table";
import { useToast } from "@components/common/Toast/useToast";
import { getInventoryProducts, type InventoryProductDto } from "@api/inventory";
import { logger } from "@utils/logger/logger";

import type { InventoryItem } from "../technician.types";
import {
  buildInventoryProductsQuery,
  deriveProductStatus,
  getExpiringInventoryItems,
  isExpiringSoon,
  removeInventoryLot,
  toInventoryProductRow,
} from "../inventory/inventoryProductUtils";

const DEFAULT_TABLE_QUERY: ServerTableQuery = {
  pageNumber: 1,
  pageSize: 20,
  searchTerm: "",
  sortBy: "name",
  sortDirection: "asc",
  columnFilters: {},
};

const SUMMARY_PAGE_SIZE = 100;

function normalizeQuery(query: ServerTableQuery): ServerTableQuery {
  const columnFilters = Object.keys(query.columnFilters)
    .sort()
    .reduce<Record<string, string>>((acc, key) => {
      acc[key] = query.columnFilters[key] ?? "";
      return acc;
    }, {});

  return {
    ...query,
    columnFilters,
  };
}

function areQueriesEqual(left: ServerTableQuery, right: ServerTableQuery): boolean {
  return JSON.stringify(normalizeQuery(left)) === JSON.stringify(normalizeQuery(right));
}

export function useInventoryProducts() {
  const { showToast } = useToast();

  const [tableQuery, setTableQuery] = useState<ServerTableQuery>(DEFAULT_TABLE_QUERY);
  const [stockProducts, setStockProducts] = useState<InventoryProductDto[]>([]);
  const [summaryProducts, setSummaryProducts] = useState<InventoryProductDto[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStockProducts = useCallback(
    async (query: ServerTableQuery) => {
      setIsLoading(true);

      try {
        const page = await getInventoryProducts(buildInventoryProductsQuery(query));
        setStockProducts(page.items);
        setTotalCount(page.totalCount);
      } catch (error) {
        setStockProducts([]);
        setTotalCount(0);
        showToast(
          "error",
          "Failed to Load Inventory",
          "Could not fetch inventory products."
        );
        logger.error("fetchStockProducts failed", { query, error });
      } finally {
        setIsLoading(false);
      }
    },
    [showToast]
  );

  const fetchSummaryProducts = useCallback(async () => {
    try {
      const allProducts: InventoryProductDto[] = [];
      let pageNumber = 1;
      let expectedCount = 0;

      do {
        const page = await getInventoryProducts({
          isActive: true,
          sortBy: "name",
          sortDirection: "asc",
          pageNumber,
          pageSize: SUMMARY_PAGE_SIZE,
        });

        expectedCount = page.totalCount;
        allProducts.push(...page.items);

        if (page.items.length === 0) {
          break;
        }

        pageNumber += 1;
      } while (allProducts.length < expectedCount);

      setSummaryProducts(allProducts);
    } catch (error) {
      setSummaryProducts([]);
      showToast(
        "error",
        "Failed to Load Inventory",
        "Could not fetch inventory summary data."
      );
      logger.error("fetchSummaryProducts failed", { error });
    }
  }, [showToast]);

  useEffect(() => {
    void fetchStockProducts(tableQuery);
  }, [fetchStockProducts, tableQuery]);

  useEffect(() => {
    void fetchSummaryProducts();
  }, [fetchSummaryProducts]);

  const stockRows = useMemo(
    () => stockProducts.map(toInventoryProductRow),
    [stockProducts]
  );

  const expiryData = useMemo(
    () => getExpiringInventoryItems(summaryProducts),
    [summaryProducts]
  );

  const inventoryStats = useMemo(() => {
    const expiringMedicines = summaryProducts.filter((product) =>
      product.inventoryLots.some((lot) => isExpiringSoon(lot.expiry))
    ).length;

    const lowStock = summaryProducts.filter(
      (product) => deriveProductStatus(product) === "Low Stock"
    ).length;

    return {
      totalItems: summaryProducts.length || totalCount,
      lowStock,
      expiringLots: expiryData.length,
      expiringMedicines,
    };
  }, [expiryData.length, summaryProducts, totalCount]);

  const handleServerQueryChange = useCallback((query: ServerTableQuery) => {
    setTableQuery((prev) => (areQueriesEqual(prev, query) ? prev : query));
  }, []);

  const handleDispose = useCallback(
    async (item: InventoryItem) => {
      setStockProducts((prev) => removeInventoryLot(prev, item));
      setSummaryProducts((prev) => removeInventoryLot(prev, item));

      showToast(
        "success",
        "Item Removed",
        `${item.drugName} - Batch ${item.batchNumber} removed from view.`
      );

      logger.warn("handleDispose: no backend endpoint yet", {
        id: item.id,
        productId: item.productId,
      });
    },
    [showToast]
  );

  return {
    stockRows,
    expiryData,
    inventoryStats,
    totalCount,
    isLoading,
    tableQuery,
    handleServerQueryChange,
    handleDispose,
  };
}
