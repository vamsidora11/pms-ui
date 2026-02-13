// should return mapped allergy codes on success 
// should return empty array if query is too short 
// should handle empty backend data gracefully 
// should filter out invalid or empty codes 
// should propagate abort errors 
// should throw other errors and log them 
// should respect AbortSignal passed via opts
import { describe, it, expect, vi, beforeEach } from "vitest";
import * as catalog from "../catalogs";
import api from "../axiosInstance";
import { ENDPOINTS } from "../endpoints";

// Mock the api module
vi.mock("../axiosInstance");

const mockedApi = vi.mocked(api, true);

describe("catalog API > searchAllergies", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return mapped allergy codes on success", async () => {
    // Arrange
    const mockData = [{ code: "ALRG1" }, { code: "ALRG2" }];
    mockedApi.get.mockResolvedValueOnce({ data: mockData });

    // Act
    const result = await catalog.searchAllergies("allergy");

    // Assert
    expect(result).toEqual(["ALRG1", "ALRG2"]);
    expect(mockedApi.get).toHaveBeenCalledWith(
      ENDPOINTS.ALLERGY_SEARCH_ENDPOINT,
      { params: { q: "allergy" }, signal: undefined }
    );
  });

  it("should return empty array if query is too short", async () => {
    const result = await catalog.searchAllergies("a", { minChars: 2 });
    expect(result).toEqual([]);
    expect(mockedApi.get).not.toHaveBeenCalled();
  });

  it("should handle empty backend data gracefully", async () => {
    mockedApi.get.mockResolvedValueOnce({ data: [] });

    const result = await catalog.searchAllergies("allergy");
    expect(result).toEqual([]);
  });

  it("should filter out invalid or empty codes", async () => {
    const mockData = [{ code: "VALID" }, { code: null }, {}, { code: " " }];
    mockedApi.get.mockResolvedValueOnce({ data: mockData });

    const result = await catalog.searchAllergies("allergy");
    expect(result).toEqual(["VALID"]);
  });

  it("should propagate abort errors", async () => {
    const abortError = Object.assign(new Error("aborted"), { name: "AbortError" });
    mockedApi.get.mockRejectedValueOnce(abortError);

    await expect(catalog.searchAllergies("allergy")).rejects.toThrow(abortError);
  });

  it("should throw other errors and log them", async () => {
    const error = {
      response: { status: 500, data: { message: "Server error" } },
      code: "ERR_BAD_RESPONSE",
    };
    mockedApi.get.mockRejectedValueOnce(error);

    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(catalog.searchAllergies("allergy")).rejects.toEqual(error);
    expect(consoleSpy).toHaveBeenCalledWith("searchAllergies failed:", {
      status: 500,
      data: { message: "Server error" },
    });

    consoleSpy.mockRestore();
  });

  it("should respect AbortSignal passed via opts", async () => {
    const controller = new AbortController();
    const mockData = [{ code: "ALRG3" }];
    mockedApi.get.mockResolvedValueOnce({ data: mockData });

    const result = await catalog.searchAllergies("allergy", { signal: controller.signal });
    expect(result).toEqual(["ALRG3"]);
    expect(mockedApi.get).toHaveBeenCalledWith(
      ENDPOINTS.ALLERGY_SEARCH_ENDPOINT,
      { params: { q: "allergy" }, signal: controller.signal }
    );
  });
});
