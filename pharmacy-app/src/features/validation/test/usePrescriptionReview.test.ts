import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { usePrescriptionReview } from "../hooks/usePrescriptionReview";
import {
  activatePrescription,
  reviewPrescriptionLine,
  validatePrescription,
} from "@api/prescription";

vi.mock("@api/prescription", () => ({
  reviewPrescriptionLine: vi.fn(),
  validatePrescription: vi.fn(),
  activatePrescription: vi.fn(),
}));

describe("usePrescriptionReview", () => {
  const mockedReviewPrescriptionLine = vi.mocked(reviewPrescriptionLine);
  const mockedValidatePrescription = vi.mocked(validatePrescription);
  const mockedActivatePrescription = vi.mocked(activatePrescription);

  const payload = {
    medicines: [
      {
        prescriptionMedicineId: "MED-1",
        decision: "Accepted" as const,
        overrideReason: null,
        approvedQuantity: 5,
      },
      {
        prescriptionMedicineId: "MED-2",
        decision: "Rejected" as const,
        overrideReason: "Out of stock",
        approvedQuantity: 0,
      },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("submits per-line review calls in order and tracks latest etag", async () => {
    mockedReviewPrescriptionLine
      .mockResolvedValueOnce("etag-2")
      .mockResolvedValueOnce("etag-3");

    const { result } = renderHook(() => usePrescriptionReview("RX-001"));

    let response: Awaited<ReturnType<typeof result.current.submitReview>> | undefined;
    await act(async () => {
      response = await result.current.submitReview(
        payload,
        "PAT-1",
        "etag-1"
      );
    });

    expect(mockedReviewPrescriptionLine).toHaveBeenNthCalledWith(
      1,
      "RX-001",
      "PAT-1",
      "MED-1",
      "Accepted",
      null,
      "etag-1"
    );
    expect(mockedReviewPrescriptionLine).toHaveBeenNthCalledWith(
      2,
      "RX-001",
      "PAT-1",
      "MED-2",
      "Rejected",
      "Out of stock",
      "etag-2"
    );
    expect(response).toEqual({ ok: true });
    expect(result.current.latestEtag).toBe("etag-3");
  });

  it("validates then activates with chained etag", async () => {
    mockedValidatePrescription.mockResolvedValueOnce("etag-2");
    mockedActivatePrescription.mockResolvedValueOnce("etag-3");

    const { result } = renderHook(() => usePrescriptionReview("RX-001"));

    let response: Awaited<ReturnType<typeof result.current.validateAndActivate>> | undefined;
    await act(async () => {
      response = await result.current.validateAndActivate("etag-1");
    });

    expect(mockedValidatePrescription).toHaveBeenCalledWith("RX-001", "etag-1");
    expect(mockedActivatePrescription).toHaveBeenCalledWith("RX-001", "etag-2");
    expect(response).toEqual({ ok: true });
    expect(result.current.latestEtag).toBe("etag-3");
  });

  it("returns API message on review failure", async () => {
    mockedReviewPrescriptionLine.mockRejectedValueOnce({
      response: { data: { message: "Validation failed" } },
    });

    const { result } = renderHook(() => usePrescriptionReview("RX-001"));

    let response: Awaited<ReturnType<typeof result.current.submitReview>> | undefined;
    await act(async () => {
      response = await result.current.submitReview(payload, "PAT-1", "etag-1");
    });

    expect(response).toEqual({ ok: false, message: "Validation failed" });
  });
});
