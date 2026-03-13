import { renderHook, waitFor, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useLabelQueue } from "../hooks/useLabelQueue";
import { getLabelQueue } from "@api/label";

// Mock API module
vi.mock("@api/label", () => ({
  getLabelQueue: vi.fn(),
}));

describe("useLabelQueue", () => {
  const mockedGetLabelQueue = getLabelQueue as unknown as ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should initialize with default state", () => {
    const { result } = renderHook(() => useLabelQueue());

    expect(result.current.prescriptions).toEqual([]);
    expect(result.current.loading).toBe(true); // auto refresh runs
    expect(result.current.error).toBeNull();
  });

  it("should load prescriptions successfully", async () => {
    const mockData = {
      items: [
        { id: "1", patientName: "John Doe" },
        { id: "2", patientName: "Jane Doe" },
      ],
    };

    mockedGetLabelQueue.mockResolvedValueOnce(mockData);

    const { result } = renderHook(() => useLabelQueue());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.prescriptions).toEqual(mockData.items);
    expect(result.current.error).toBeNull();
    expect(mockedGetLabelQueue).toHaveBeenCalledTimes(1);
  });

  it("should handle API failure", async () => {
    mockedGetLabelQueue.mockRejectedValueOnce(new Error("API error"));

    const { result } = renderHook(() => useLabelQueue());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.prescriptions).toEqual([]);
    expect(result.current.error).toBe("API error");
  });

  it("should refresh manually", async () => {
    mockedGetLabelQueue.mockResolvedValueOnce({
      items: [{ id: "3", patientName: "Initial" }],
    });

    const { result } = renderHook(() => useLabelQueue());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.prescriptions).toEqual([
      { id: "3", patientName: "Initial" },
    ]);

    // Mock next call
    mockedGetLabelQueue.mockResolvedValueOnce({
      items: [{ id: "4", patientName: "Updated" }],
    });

    await act(async () => {
      await result.current.refresh();
    });

    expect(result.current.prescriptions).toEqual([
      { id: "4", patientName: "Updated" },
    ]);

    expect(mockedGetLabelQueue).toHaveBeenCalledTimes(2);
  });

  it("should not update state after unmount", async () => {
    mockedGetLabelQueue.mockResolvedValueOnce({
      items: [{ id: "5", patientName: "Unmount Test" }],
    });

    const { unmount } = renderHook(() => useLabelQueue());

    unmount();

    await Promise.resolve();

    expect(mockedGetLabelQueue).toHaveBeenCalledTimes(1);
  });
});
