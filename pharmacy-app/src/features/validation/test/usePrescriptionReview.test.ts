import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { usePrescriptionReview } from "../hooks/usePrescriptionReview";
import api from "@api/axiosInstance";
// import { ENDPOINTS } from "@api/endpoints";

vi.mock("@api/axiosInstance", () => ({
  default: {
    put: vi.fn(),
  },
}));

vi.mock("@api/endpoints", () => ({
  ENDPOINTS: {
    prescriptions: "/prescriptions",
  },
}));

describe("usePrescriptionReview", () => {
  const mockedPut = vi.mocked(api.put);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("initially sets submitting to false", () => {
    const { result } = renderHook(() =>
      usePrescriptionReview("RX-001")
    );

    expect(result.current.submitting).toBe(false);
  });

  it("submits successfully", async () => {
    mockedPut.mockResolvedValueOnce({});

    const { result } = renderHook(() =>
      usePrescriptionReview("RX-001")
    );

    let response;

    await act(async () => {
      response = await result.current.submitReview({
        status: "APPROVED",
      });
    });

    expect(mockedPut).toHaveBeenCalledWith(
      "/prescriptions/RX-001/review",
      { status: "APPROVED" }
    );

    expect(response).toEqual({ ok: true });
    expect(result.current.submitting).toBe(false);
  });

  it("handles API error with response message", async () => {
    mockedPut.mockRejectedValueOnce({
      response: { data: { message: "Validation failed" } },
    });

    const { result } = renderHook(() =>
      usePrescriptionReview("RX-001")
    );

    let response;

    await act(async () => {
      response = await result.current.submitReview({});
    });

    expect(response).toEqual({
      ok: false,
      message: "Validation failed",
    });

    expect(result.current.submitting).toBe(false);
  });

  it("handles API error with generic message", async () => {
    mockedPut.mockRejectedValueOnce({
      message: "Network error",
    });

    const { result } = renderHook(() =>
      usePrescriptionReview("RX-001")
    );

    let response;

    await act(async () => {
      response = await result.current.submitReview({});
    });

    expect(response).toEqual({
      ok: false,
      message: "Network error",
    });
  });

  it("falls back to default error message", async () => {
    mockedPut.mockRejectedValueOnce({});

    const { result } = renderHook(() =>
      usePrescriptionReview("RX-001")
    );

    let response;

    await act(async () => {
      response = await result.current.submitReview({});
    });

    expect(response).toEqual({
      ok: false,
      message: "Request failed",
    });
  });

  it("toggles submitting state correctly", async () => {
    let resolvePromise!: () => void;

    const pending = new Promise<void>((res) => {
      resolvePromise = res;
    });

    mockedPut.mockReturnValueOnce(pending as unknown as Promise<unknown>);

    const { result } = renderHook(() =>
      usePrescriptionReview("RX-001")
    );

    act(() => {
      result.current.submitReview({});
    });

    expect(result.current.submitting).toBe(true);

    await act(async () => {
      resolvePromise();
    });

    expect(result.current.submitting).toBe(false);
  });

  it("rebinds when rxId changes", async () => {
    mockedPut.mockResolvedValue({});

    const { result, rerender } = renderHook(
      ({ id }) => usePrescriptionReview(id),
      { initialProps: { id: "RX-001" } }
    );

    await act(async () => {
      await result.current.submitReview({});
    });

    rerender({ id: "RX-002" });

    await act(async () => {
      await result.current.submitReview({});
    });

    expect(mockedPut).toHaveBeenNthCalledWith(
      2,
      "/prescriptions/RX-002/review",
      {}
    );
  });
});
