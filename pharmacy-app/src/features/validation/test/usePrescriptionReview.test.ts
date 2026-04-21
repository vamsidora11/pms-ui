// import { renderHook, act } from "@testing-library/react";
// import { describe, it, expect, vi, beforeEach } from "vitest";
// import { usePrescriptionReview } from "../hooks/usePrescriptionReview";
// import {
//   activatePrescription,
//   reviewPrescriptionLine,
//   validatePrescription,
// } from "@api/prescription";

// vi.mock("@api/prescription", () => ({
//   reviewPrescriptionLine: vi.fn(),
//   validatePrescription: vi.fn(),
//   activatePrescription: vi.fn(),
// }));

// describe("usePrescriptionReview", () => {
//   const mockedReviewPrescriptionLine = vi.mocked(reviewPrescriptionLine);
//   const mockedValidatePrescription = vi.mocked(validatePrescription);
//   const mockedActivatePrescription = vi.mocked(activatePrescription);

//   const payload = {
//     medicines: [
//       {
//         prescriptionMedicineId: "MED-1",
//         decision: "Accepted" as const,
//         overrideReason: null,
//         approvedQuantity: 5,
//       },
//       {
//         prescriptionMedicineId: "MED-2",
//         decision: "Rejected" as const,
//         overrideReason: "Out of stock",
//         approvedQuantity: 0,
//       },
//     ],
//   };

//   beforeEach(() => {
//     vi.clearAllMocks();
//   });

//   it("submits per-line review calls in order and tracks latest etag", async () => {
//     mockedReviewPrescriptionLine
//       .mockResolvedValueOnce("etag-2")
//       .mockResolvedValueOnce("etag-3");

//     const { result } = renderHook(() => usePrescriptionReview("RX-001"));

//     let response: Awaited<ReturnType<typeof result.current.submitReview>> | undefined;
//     await act(async () => {
//       response = await result.current.submitReview(
//         payload,
//         "PAT-1",
//         "etag-1"
//       );
//     });

//     expect(mockedReviewPrescriptionLine).toHaveBeenNthCalledWith(
//       1,
//       "RX-001",
//       "PAT-1",
//       "MED-1",
//       "Accepted",
//       null,
//       "etag-1"
//     );
//     expect(mockedReviewPrescriptionLine).toHaveBeenNthCalledWith(
//       2,
//       "RX-001",
//       "PAT-1",
//       "MED-2",
//       "Rejected",
//       "Out of stock",
//       "etag-2"
//     );
//     expect(response).toEqual({ ok: true });
//     expect(result.current.latestEtag).toBe("etag-3");
//   });

//   it("validates then activates with chained etag", async () => {
//     mockedValidatePrescription.mockResolvedValueOnce("etag-2");
//     mockedActivatePrescription.mockResolvedValueOnce("etag-3");

//     const { result } = renderHook(() => usePrescriptionReview("RX-001"));

//     let response: Awaited<ReturnType<typeof result.current.validateAndActivate>> | undefined;
//     await act(async () => {
//       response = await result.current.validateAndActivate("etag-1");
//     });

//     expect(mockedValidatePrescription).toHaveBeenCalledWith("RX-001", "etag-1");
//     expect(mockedActivatePrescription).toHaveBeenCalledWith("RX-001", "etag-2");
//     expect(response).toEqual({ ok: true });
//     expect(result.current.latestEtag).toBe("etag-3");
//   });

//   it("returns API message on review failure", async () => {
//     mockedReviewPrescriptionLine.mockRejectedValueOnce({
//       response: { data: { message: "Validation failed" } },
//     });

//     const { result } = renderHook(() => usePrescriptionReview("RX-001"));

//     let response: Awaited<ReturnType<typeof result.current.submitReview>> | undefined;
//     await act(async () => {
//       response = await result.current.submitReview(payload, "PAT-1", "etag-1");
//     });

//     expect(response).toEqual({ ok: false, message: "Validation failed" });
//   });
// });
import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { usePrescriptionReview } from "../hooks/usePrescriptionReview";

// ---------------- MOCK REDUX ----------------
const mockDispatch = vi.fn();

const mockState = {
  prescriptions: {
    selected: {
      prescription: { id: "RX-1" },
      etag: "etag-1",
    },
  },
};

vi.mock("react-redux", () => ({
  useDispatch: () => mockDispatch,
  useSelector: (selector: any) => selector(mockState),
}));

// ---------------- MOCK SLICE ----------------
vi.mock("@store/prescription/prescriptionSlice", () => {
  const mockThunk = vi.fn();

  // attach matcher like RTK does
  (mockThunk as any).fulfilled = {
    match: (action: any) => action.type.endsWith("/fulfilled"),
  };

  return {
    fetchPrescriptionDetails: vi.fn((payload) => ({
      type: "prescriptions/details",
      payload,
    })),
    reviewPrescription: mockThunk,
  };
});

// ---------------- MOCK ERROR UTILS ----------------
vi.mock("@utils/httpError", () => ({
  extractApiError: vi.fn(() => "fallback error"),
}));

import {
  reviewPrescription,
  fetchPrescriptionDetails,
} from "@store/prescription/prescriptionSlice";

describe("usePrescriptionReview", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // 🧠 INIT
  it("initializes correctly", () => {
    const { result } = renderHook(() =>
      usePrescriptionReview("RX-1", "PAT-1")
    );

    expect(result.current.submitting).toBe(false);
    expect(result.current.latestEtag).toBe(null);
    expect(result.current.latestSnapshot).toEqual({ id: "RX-1" });
  });

  // 🔄 REFRESH SUCCESS
  it("dispatches fetchPrescriptionDetails when ids exist", async () => {
    mockDispatch.mockResolvedValue({});

    const { result } = renderHook(() =>
      usePrescriptionReview("RX-1", "PAT-1")
    );

    await act(async () => {
      await result.current.refreshLatest();
    });

    expect(fetchPrescriptionDetails).toHaveBeenCalledWith({
      id: "RX-1",
      patientId: "PAT-1",
    });

    expect(mockDispatch).toHaveBeenCalled();
  });

  // ❌ REFRESH SKIP
  it("does not dispatch when ids missing", async () => {
    const { result } = renderHook(() =>
      usePrescriptionReview("", "")
    );

    await act(async () => {
      await result.current.refreshLatest();
    });

    expect(mockDispatch).not.toHaveBeenCalled();
  });

  // ✅ SUCCESS PATH
  it("handles successful review submission", async () => {
    mockDispatch.mockResolvedValue({
      type: "prescriptions/review/fulfilled",
      payload: {
        etag: "etag-2",
        prescription: { id: "RX-1" },
      },
    });

    const { result } = renderHook(() =>
      usePrescriptionReview("RX-1", "PAT-1")
    );

    let response: any;

    await act(async () => {
      response = await result.current.submitReview([], "etag-1");
    });

    expect(reviewPrescription).toHaveBeenCalled(); // thunk called
    expect(response).toEqual({ ok: true });
    expect(result.current.latestEtag).toBe("etag-2");
  });

  // ⚠️ CONFLICT CASE
  it("handles conflict response and updates etag", async () => {
    mockDispatch.mockResolvedValue({
      type: "prescriptions/review/rejected",
      payload: {
        type: "conflict",
        message: "Prescription updated by another user.",
        latest: {
          prescription: { id: "RX-1" },
          etag: "etag-new",
        },
      },
      error: {},
    });

    const { result } = renderHook(() =>
      usePrescriptionReview("RX-1", "PAT-1")
    );

    let response: any;

    await act(async () => {
      response = await result.current.submitReview([], "etag-old");
    });

    expect(response).toEqual({
      ok: false,
      message: "Prescription updated by another user.",
    });

    expect(result.current.latestEtag).toBe("etag-new");
  });

  // ❌ STRING ERROR
  it("returns string payload error", async () => {
    mockDispatch.mockResolvedValue({
      type: "prescriptions/review/rejected",
      payload: "Something went wrong",
      error: {},
    });

    const { result } = renderHook(() =>
      usePrescriptionReview("RX-1", "PAT-1")
    );

    let response: any;

    await act(async () => {
      response = await result.current.submitReview([], "etag");
    });

    expect(response).toEqual({
      ok: false,
      message: "Something went wrong",
    });
  });

  // ❌ FALLBACK ERROR
  it("falls back to extractApiError", async () => {
    mockDispatch.mockResolvedValue({
      type: "prescriptions/review/rejected",
      payload: null,
      error: {},
    });

    const { result } = renderHook(() =>
      usePrescriptionReview("RX-1", "PAT-1")
    );

    let response: any;

    await act(async () => {
      response = await result.current.submitReview([], "etag");
    });

    expect(response).toEqual({
      ok: false,
      message: "fallback error",
    });
  });

  // 🧯 FINALLY BLOCK
  it("resets submitting even if dispatch throws", async () => {
    mockDispatch.mockRejectedValue(new Error("unexpected"));

    const { result } = renderHook(() =>
      usePrescriptionReview("RX-1", "PAT-1")
    );

    await act(async () => {
      try {
        await result.current.submitReview([], "etag");
      } catch {}
    });

    expect(result.current.submitting).toBe(false);
  });
});