import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { usePrescriptionReview } from "../hooks/usePrescriptionReview";
import {
  createDispenseForPrescription,
  reviewPrescription,
} from "@api/prescription";

vi.mock("@api/prescription", () => ({
  reviewPrescription: vi.fn(),
  createDispenseForPrescription: vi.fn(),
}));

describe("usePrescriptionReview", () => {
  const mockedReviewPrescription = vi.mocked(reviewPrescription);
  const mockedCreateDispenseForPrescription = vi.mocked(createDispenseForPrescription);

  const acceptedPayload = {
    medicines: [
      {
        prescriptionMedicineId: "MED-1",
        decision: "Accepted" as const,
        overrideReason: null,
        approvedQuantity: 5,
      },
    ],
  };

  const rejectedPayload = {
    medicines: [
      {
        prescriptionMedicineId: "MED-1",
        decision: "Rejected" as const,
        overrideReason: "Out of stock",
        approvedQuantity: 0,
      },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("initially sets submitting to false", () => {
    const { result } = renderHook(() => usePrescriptionReview("RX-001"));
    expect(result.current.submitting).toBe(false);
  });

  it("submits successfully and creates dispense when at least one medicine is accepted", async () => {
    mockedReviewPrescription.mockResolvedValueOnce();
    mockedCreateDispenseForPrescription.mockResolvedValueOnce();

    const { result } = renderHook(() => usePrescriptionReview("RX-001"));

    let response: Awaited<ReturnType<typeof result.current.submitReview>> | undefined;
    await act(async () => {
      response = await result.current.submitReview(acceptedPayload);
    });

    expect(mockedReviewPrescription).toHaveBeenCalledWith("RX-001", acceptedPayload);
    expect(mockedCreateDispenseForPrescription).toHaveBeenCalledWith("RX-001");
    expect(response).toEqual({ ok: true });
    expect(result.current.submitting).toBe(false);
  });

  it("submits successfully without creating dispense when all medicines are rejected", async () => {
    mockedReviewPrescription.mockResolvedValueOnce();

    const { result } = renderHook(() => usePrescriptionReview("RX-001"));

    let response: Awaited<ReturnType<typeof result.current.submitReview>> | undefined;
    await act(async () => {
      response = await result.current.submitReview(rejectedPayload);
    });

    expect(mockedReviewPrescription).toHaveBeenCalledWith("RX-001", rejectedPayload);
    expect(mockedCreateDispenseForPrescription).not.toHaveBeenCalled();
    expect(response).toEqual({ ok: true });
  });

  it("handles review API error with response message", async () => {
    mockedReviewPrescription.mockRejectedValueOnce({
      response: { data: { message: "Validation failed" } },
    });

    const { result } = renderHook(() => usePrescriptionReview("RX-001"));

    let response: Awaited<ReturnType<typeof result.current.submitReview>> | undefined;
    await act(async () => {
      response = await result.current.submitReview(acceptedPayload);
    });

    expect(response).toEqual({
      ok: false,
      message: "Validation failed",
    });
    expect(mockedCreateDispenseForPrescription).not.toHaveBeenCalled();
    expect(result.current.submitting).toBe(false);
  });

  it("handles dispense API error with generic message", async () => {
    mockedReviewPrescription.mockResolvedValueOnce();
    mockedCreateDispenseForPrescription.mockRejectedValueOnce({
      message: "Dispense failed",
    });

    const { result } = renderHook(() => usePrescriptionReview("RX-001"));

    let response: Awaited<ReturnType<typeof result.current.submitReview>> | undefined;
    await act(async () => {
      response = await result.current.submitReview(acceptedPayload);
    });

    expect(response).toEqual({
      ok: false,
      message: "Dispense failed",
    });
  });

  it("falls back to default error message", async () => {
    mockedReviewPrescription.mockRejectedValueOnce({});

    const { result } = renderHook(() => usePrescriptionReview("RX-001"));

    let response: Awaited<ReturnType<typeof result.current.submitReview>> | undefined;
    await act(async () => {
      response = await result.current.submitReview(acceptedPayload);
    });

    expect(response).toEqual({
      ok: false,
      message: "Request failed",
    });
  });

  it("toggles submitting state correctly", async () => {
    let resolvePromise!: () => void;
    const pending = new Promise<void>((resolve) => {
      resolvePromise = resolve;
    });

    mockedReviewPrescription.mockReturnValueOnce(pending);

    const { result } = renderHook(() => usePrescriptionReview("RX-001"));

    act(() => {
      void result.current.submitReview(acceptedPayload);
    });

    expect(result.current.submitting).toBe(true);

    await act(async () => {
      resolvePromise();
    });

    expect(result.current.submitting).toBe(false);
  });

  it("rebinds when rxId changes", async () => {
    mockedReviewPrescription.mockResolvedValue(undefined);
    mockedCreateDispenseForPrescription.mockResolvedValue(undefined);

    const { result, rerender } = renderHook(
      ({ id }) => usePrescriptionReview(id),
      { initialProps: { id: "RX-001" } }
    );

    await act(async () => {
      await result.current.submitReview(acceptedPayload);
    });

    rerender({ id: "RX-002" });

    await act(async () => {
      await result.current.submitReview(acceptedPayload);
    });

    expect(mockedReviewPrescription).toHaveBeenNthCalledWith(2, "RX-002", acceptedPayload);
    expect(mockedCreateDispenseForPrescription).toHaveBeenNthCalledWith(2, "RX-002");
  });
});
