import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import { getInventoryProducts, searchInventory } from "../inventory";

// --- Mocks ---
vi.mock("../axiosInstance", () => {
  return {
    default: {
      get: vi.fn(),
    },
  };
});

vi.mock("../endpoints", () => {
  return {
    ENDPOINTS: {
      products: "/api/products/search",
      inventoryProducts: "/api/inventory/products",
    },
  };
});

vi.mock("@utils/logger/logger", () => {
  return {
    logger: {
      error: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      debug: vi.fn(),
    },
  };
});

// Import the mocked modules' types and instances
import api from "../axiosInstance";
import { ENDPOINTS } from "../endpoints";
import { logger } from "@utils/logger/logger";

describe("getInventoryProducts", () => {
  const apiGet = api.get as unknown as ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls the inventory products endpoint with server-side query params", async () => {
    apiGet.mockResolvedValueOnce({
      data: {
        items: [],
        pageSize: 20,
        totalCount: 0,
      },
    });

    await getInventoryProducts({
      name: "amo",
      manufacturer: "Pfizer",
      isActive: true,
      sortBy: "name",
      sortDirection: "asc",
      pageNumber: 2,
      pageSize: 20,
    });

    expect(apiGet).toHaveBeenCalledTimes(1);
    expect(apiGet).toHaveBeenCalledWith(ENDPOINTS.inventoryProducts, {
      params: {
        name: "amo",
        manufacturer: "Pfizer",
        isActive: true,
        sortBy: "name",
        sortDirection: "asc",
        pageNumber: 2,
        pageSize: 20,
      },
    });
  });

  it("normalizes missing items to an empty page", async () => {
    apiGet.mockResolvedValueOnce({
      data: {
        pageSize: 20,
        totalCount: 7,
      },
    });

    const result = await getInventoryProducts({ pageSize: 20, pageNumber: 1 });

    expect(result).toEqual({
      items: [],
      pageSize: 20,
      totalCount: 7,
    });
  });
});

describe("searchInventory", () => {
  const apiGet = api.get as unknown as ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("calls the products endpoint with the correct query param", async () => {
    const query = "amox";
    apiGet.mockResolvedValueOnce({
      data: [],
    });

    await searchInventory(query);

    expect(apiGet).toHaveBeenCalledTimes(1);
    expect(apiGet).toHaveBeenCalledWith(`${ENDPOINTS.products}`, {
      params: { q: query },
    });
  });

  it("maps API response items to InventorySearchItem correctly (with inventory present)", async () => {
    apiGet.mockResolvedValueOnce({
      data: [
        {
          id: "prod-1",
          name: "Amoxicillin",
          strength: "500 mg",
          inventory: { totalQuantity: 25 },
        },
        {
          id: "prod-2",
          name: "Ibuprofen",
          strength: "200 mg",
          inventory: { totalQuantity: 0 },
        },
      ],
    });

    const result = await searchInventory("pain");

    expect(result).toEqual([
      {
        productId: "prod-1",
        name: "Amoxicillin",
        strength: "500 mg",
        availableStock: 25,
      },
      {
        productId: "prod-2",
        name: "Ibuprofen",
        strength: "200 mg",
        availableStock: 0,
      },
    ]);
  });

  it("sets availableStock to 0 when inventory is null or missing", async () => {
    apiGet.mockResolvedValueOnce({
      data: [
        {
          id: "prod-3",
          name: "Paracetamol",
          strength: "650 mg",
          inventory: null,
        },
        {
          id: "prod-4",
          name: "Cetrizine",
          strength: "10 mg",
          // inventory field completely missing
        },
      ],
    });

    const result = await searchInventory("allergy");

    expect(result).toEqual([
      {
        productId: "prod-3",
        name: "Paracetamol",
        strength: "650 mg",
        availableStock: 0,
      },
      {
        productId: "prod-4",
        name: "Cetrizine",
        strength: "10 mg",
        availableStock: 0,
      },
    ]);
  });

  it("returns an empty array when API returns an empty list", async () => {
    apiGet.mockResolvedValueOnce({ data: [] });

    const result = await searchInventory("zzz");
    expect(result).toEqual([]);
  });

  it("logs error and rethrows when the API call fails", async () => {
    const query = "amox";
    const err = new Error("Network down");

    apiGet.mockRejectedValueOnce(err);

    await expect(searchInventory(query)).rejects.toThrow("Network down");

    expect(logger.error).toHaveBeenCalledTimes(1);
    expect(logger.error).toHaveBeenCalledWith("Product search failed", {
      query,
      error: err,
    });
  });

  it("handles non-Error rejections (e.g., axios-style error objects) and still rethrows", async () => {
    const query = "amox";
    const axiosLikeError = { message: "Bad Request", status: 400 };

    apiGet.mockRejectedValueOnce(axiosLikeError);

    await expect(searchInventory(query)).rejects.toEqual(axiosLikeError);

    expect(logger.error).toHaveBeenCalledWith("Product search failed", {
      query,
      error: axiosLikeError,
    });
  });
});
