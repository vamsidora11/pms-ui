import { renderHook, act, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useLabelPrescriptionDetails } from "../hooks/useLabelPrescriptionDetails";
import { getDispenseLabels } from "@api/label";
import type { LabelPrescriptionDetails } from "@labels/types/label.types";

vi.mock("@api/label", () => ({
  getDispenseLabels: vi.fn(),
}));

describe("useLabelPrescriptionDetails", () => {
  const mockedApi = vi.mocked(getDispenseLabels);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should initialize with default state", () => {
    const { result } = renderHook(() => useLabelPrescriptionDetails());

    expect(result.current.selected).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("should load prescription successfully", async () => {
    const mockData: LabelPrescriptionDetails = {
      dispenseId: "1",
    } as LabelPrescriptionDetails;

    mockedApi.mockResolvedValueOnce(mockData);

    const { result } = renderHook(() => useLabelPrescriptionDetails());

    await act(async () => {
      await result.current.selectById("1", "patient-1");
    });

    expect(result.current.selected).toEqual(mockData);
    expect(result.current.error).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(mockedApi).toHaveBeenCalledWith("1", "patient-1");
  });

  it("should handle API failure", async () => {
    mockedApi.mockRejectedValueOnce(new Error("API error"));

    const { result } = renderHook(() => useLabelPrescriptionDetails());

    await act(async () => {
      await result.current.selectById("1", "patient-1");
    });

    expect(result.current.selected).toBeNull();
    expect(result.current.error).toBe("API error");
    expect(result.current.loading).toBe(false);
  });

  it("should clear selected and error", async () => {
    const mockData: LabelPrescriptionDetails = {
      dispenseId: "1",
    } as LabelPrescriptionDetails;

    mockedApi.mockResolvedValueOnce(mockData);

    const { result } = renderHook(() => useLabelPrescriptionDetails());

    await act(async () => {
      await result.current.selectById("1", "patient-1");
    });

    act(() => {
      result.current.clear();
    });

    expect(result.current.selected).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it("should ignore stale responses (race condition protection)", async () => {
    let resolveFirst!: (value: LabelPrescriptionDetails) => void;
    let resolveSecond!: (value: LabelPrescriptionDetails) => void;

    const firstPromise = new Promise<LabelPrescriptionDetails>((res) => {
      resolveFirst = res;
    });

    const secondPromise = new Promise<LabelPrescriptionDetails>((res) => {
      resolveSecond = res;
    });

    mockedApi
      .mockReturnValueOnce(firstPromise)
      .mockReturnValueOnce(secondPromise);

    const { result } = renderHook(() => useLabelPrescriptionDetails());

    act(() => {
      result.current.selectById("1", "patient-1");
    });

    act(() => {
      result.current.selectById("2", "patient-2");
    });

    await act(async () => {
      resolveFirst({ dispenseId: "1" } as LabelPrescriptionDetails);
    });

    await act(async () => {
      resolveSecond({ dispenseId: "2" } as LabelPrescriptionDetails);
    });

    await waitFor(() => {
      expect(result.current.selected?.dispenseId).toBe("2");
    });
  });
});
