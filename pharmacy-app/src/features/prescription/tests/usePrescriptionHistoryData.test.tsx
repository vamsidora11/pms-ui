import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import type { RootState } from "../../../store";
import { usePrescriptionHistoryData } from "../hooks/usePrescriptionHistoryData";
import type {
  PrescriptionDetailsDto,
  PrescriptionSummaryDto,
} from "@prescription/types/prescription.types";
import type { PatientDetails } from "@prescription/types/models";
import type { PrescriptionHistoryQueryParams } from "@api/prescription";

/* -------------------- Mocks -------------------- */

// Mutable in-memory store for useSelector
let mockState: RootState;

// Spy-able dispatch
const dispatchSpy = vi.fn();

// Mock react-redux to use our mock state and dispatch
vi.mock("react-redux", () => {
  return {
    __esModule: true,
    useDispatch: () => dispatchSpy,
    useSelector: (selector: (s: RootState) => unknown) => selector(mockState),
  };
});

// Mock thunks as simple action creators (plain objects)
vi.mock("@store/prescription/prescriptionSlice", () => {
  return {
    __esModule: true,
    fetchAllPrescriptions: vi.fn((payload: PrescriptionHistoryQueryParams) => ({
      type: "prescriptions/fetchAllPrescriptions",
      payload,
    })),
    fetchPrescriptionDetails: vi.fn((id: string) => ({
      type: "prescriptions/fetchPrescriptionDetails",
      payload: id,
    })),
  };
});

vi.mock("@api/patientSearch", () => {
  return {
    __esModule: true,
    getPatientById: vi.fn(),
  };
});

/* -------------------- Import mocked modules -------------------- */

import { fetchAllPrescriptions, fetchPrescriptionDetails } from "@store/prescription/prescriptionSlice";
import { getPatientById } from "@api/patientSearch";

/* -------------------- Helpers -------------------- */

const baseSummary: PrescriptionSummaryDto = {
  alerts: false,
  id: "rx-1",
  patientId: "p-1",
  patientName: "John Doe",
  prescriberName: "Dr. Jane Smith",
  createdAt: "2026-02-01T10:00:00Z",
  expiresAt: "2026-12-31T10:00:00Z",
  status: "CREATED",
  medicineCount: 1,
  validationSummary: {
    totalIssues: 0,
    highSeverityCount: 0,
    moderateCount: 0,
    lowCount: 0,
    requiresReview: false,
  },
};

const makeSummary = (overrides: Partial<PrescriptionSummaryDto> = {}) => ({
  ...baseSummary,
  ...overrides,
});

const baseDetails: PrescriptionDetailsDto = {
  id: "rx-1",
  patientId: "p-1",
  patientName: "John Doe",
  prescriber: { id: "d-1", name: "Dr. Jane Smith" },
  createdAt: "2026-02-01T10:00:00Z",
  expiresAt: "2026-12-31T10:00:00Z",
  status: "CREATED",
  isRefillable: false,
  medicines: [],
};

const makeDetails = (overrides: Partial<PrescriptionDetailsDto> = {}) => ({
  ...baseDetails,
  ...overrides,
});

const basePatient: PatientDetails = {
  id: "p-1",
  fullName: "John Doe",
  phone: "+1-555-0100",
  dob: "1980-01-01",
  gender: "Male",
  email: "john@example.com",
  address: "221B Baker Street",
  allergies: [],
};

const makePatient = (overrides: Partial<PatientDetails> = {}) => ({
  ...basePatient,
  ...overrides,
});

function seedState(overrides?: Partial<RootState>): RootState {
  return {
    prescriptions: {
      items: [],
      selected: undefined,         // optional -> prefer undefined
      continuationToken: null,     // REQUIRED by PrescriptionState
      pageNumber: 1,
      pageSize: 10,
      totalCount: 0,
      totalPages: 0,
      status: "idle",
      error: undefined,            // optional -> prefer undefined or omit
    },
    // add other root slices here if your RootState includes them
    ...overrides,
  } as RootState;
}

/* -------------------- Tests -------------------- */

describe("usePrescriptionHistoryData", () => {
  const mockedGetPatientById = vi.mocked(getPatientById);

  beforeEach(() => {
    vi.clearAllMocks();
    dispatchSpy.mockClear();

    mockState = seedState({
      prescriptions: {
        items: [makeSummary()],
        selected: undefined,
        continuationToken: null,
        status: "succeeded",
        error: undefined,
        totalCount: 1,
        pageNumber: 1,
        pageSize: 10,
        totalPages: 1,
      },
    });
  });

  it("dispatches initial fetchAllPrescriptions on mount (default pageSize=10) unless skipInitialFetch", () => {
    renderHook(() => usePrescriptionHistoryData());

    expect(fetchAllPrescriptions).toHaveBeenCalledWith({
      pageNumber: 1,
      pageSize: 10,
    });
    expect(dispatchSpy).toHaveBeenCalledWith({
      type: "prescriptions/fetchAllPrescriptions",
      payload: { pageNumber: 1, pageSize: 10 },
    });
  });

  it("does not dispatch initial fetch when skipInitialFetch = true", () => {
    renderHook(() => usePrescriptionHistoryData({ skipInitialFetch: true }));

    expect(fetchAllPrescriptions).not.toHaveBeenCalled();
    expect(dispatchSpy).not.toHaveBeenCalled();
  });

  it("uses provided pageSize for initial fetch", () => {
    renderHook(() => usePrescriptionHistoryData({ pageSize: 25 }));

    expect(fetchAllPrescriptions).toHaveBeenCalledWith({
      pageNumber: 1,
      pageSize: 25,
    });
    expect(dispatchSpy).toHaveBeenCalledWith({
      type: "prescriptions/fetchAllPrescriptions",
      payload: { pageNumber: 1, pageSize: 25 },
    });
  });

  it("exposes derived list pagination & request metadata", () => {
    mockState = seedState({
      prescriptions: {
        items: [makeSummary({ id: "rx-2" })],
        selected: undefined,
        continuationToken: null,
        status: "loading",
        error: "Network",
        totalCount: 42,
        pageNumber: 2,
        pageSize: 20,
        totalPages: 3,
      },
    });

    const { result } = renderHook(() => usePrescriptionHistoryData());

    expect(result.current.prescriptions).toHaveLength(1);
    expect(result.current.requestStatus).toBe("loading");
    expect(result.current.requestError).toBe("Network");
    expect(result.current.totalCount).toBe(42);
    expect(result.current.pageNumber).toBe(2);
    expect(result.current.pageSize).toBe(20);
    expect(result.current.totalPages).toBe(3);
  });

  it("toggleRow expands and collapses rows; isRowExpanded reflects state", () => {
    const row = makeSummary({ id: "rx-9" });
    mockState = seedState({
      prescriptions: {
        items: [row],
        selected: undefined,
        continuationToken: null,
        status: "succeeded",
        error: undefined,
        totalCount: 1,
        pageNumber: 1,
        pageSize: 10,
        totalPages: 1,
      },
    });

    const { result } = renderHook(() => usePrescriptionHistoryData());

    expect(result.current.expandedRowId).toBeNull();
    expect(result.current.isRowExpanded(row)).toBe(false);

    act(() => {
      result.current.toggleRow("rx-9");
    });
    expect(result.current.expandedRowId).toBe("rx-9");
    expect(result.current.isRowExpanded(row)).toBe(true);

    act(() => {
      result.current.toggleRow("rx-9");
    });
    expect(result.current.expandedRowId).toBeNull();
    expect(result.current.isRowExpanded(row)).toBe(false);
  });

  it("expandedRow resolves from prescriptions by expandedRowId", () => {
    const rowA = makeSummary({ id: "rx-A" });
    const rowB = makeSummary({ id: "rx-B" });
    mockState = seedState({
      prescriptions: {
        items: [rowA, rowB],
        selected: undefined,
        continuationToken: null,
        status: "succeeded",
        error: undefined,
        totalCount: 2,
        pageNumber: 1,
        pageSize: 10,
        totalPages: 1,
      },
    });

    const { result } = renderHook(() => usePrescriptionHistoryData());

    act(() => {
      result.current.toggleRow("rx-B");
    });
    expect(result.current.expandedRow).toEqual(rowB);
  });

  it("dispatches fetchPrescriptionDetails when a row is expanded and selected.id differs", () => {
    const row = makeSummary({ id: "rx-7" });
    mockState = seedState({
      prescriptions: {
        items: [row],
        selected: undefined,          // nothing selected yet
        continuationToken: null,
        status: "succeeded",
        error: undefined,
        totalCount: 1,
        pageNumber: 1,
        pageSize: 10,
        totalPages: 1,
      },
    });

    const { result } = renderHook(() => usePrescriptionHistoryData());

    act(() => {
      result.current.toggleRow("rx-7");
    });

    expect(fetchPrescriptionDetails).toHaveBeenCalledWith("rx-7");
    expect(dispatchSpy).toHaveBeenCalledWith({
      type: "prescriptions/fetchPrescriptionDetails",
      payload: "rx-7",
    });
  });

  it("does not dispatch details fetch if selected.id already equals expanded row id", () => {
    const row = makeSummary({ id: "rx-7" });
    mockState = seedState({
      prescriptions: {
        items: [row],
        selected: makeDetails({ id: "rx-7" }),
        continuationToken: null,
        status: "succeeded",
        error: undefined,
        totalCount: 1,
        pageNumber: 1,
        pageSize: 10,
        totalPages: 1,
      },
    });

    const { result } = renderHook(() => usePrescriptionHistoryData());

    act(() => {
      result.current.toggleRow("rx-7");
    });

    expect(fetchPrescriptionDetails).not.toHaveBeenCalled();
  });

  it("expandedDetails is non-null only when expandedRow exists and selected.id matches it", () => {
    const row = makeSummary({ id: "rx-123" });

    // Case 1: No selection -> expandedDetails null
    mockState = seedState({
      prescriptions: {
        items: [row],
        selected: undefined,
        continuationToken: null,
        status: "succeeded",
        error: undefined,
        totalCount: 1,
        pageNumber: 1,
        pageSize: 10,
        totalPages: 1,
      },
    });

    const h1 = renderHook(() => usePrescriptionHistoryData());
    act(() => {
      h1.result.current.toggleRow("rx-123");
    });
    expect(h1.result.current.expandedDetails).toBeNull();

    // Case 2: Selected different -> still null
    mockState = seedState({
      prescriptions: {
        items: [row],
        selected: makeDetails({ id: "rx-OTHER" }),
        continuationToken: null,
        status: "succeeded",
        error: undefined,
        totalCount: 1,
        pageNumber: 1,
        pageSize: 10,
        totalPages: 1,
      },
    });
    const h2 = renderHook(() => usePrescriptionHistoryData());
    act(() => {
      h2.result.current.toggleRow("rx-123");
    });
    expect(h2.result.current.expandedDetails).toBeNull();

    // Case 3: Selected matches -> expandedDetails set
    mockState = seedState({
      prescriptions: {
        items: [row],
        selected: makeDetails({ id: "rx-123" }),
        continuationToken: null,
        status: "succeeded",
        error: undefined,
        totalCount: 1,
        pageNumber: 1,
        pageSize: 10,
        totalPages: 1,
      },
    });
    const h3 = renderHook(() => usePrescriptionHistoryData());
    act(() => {
      h3.result.current.toggleRow("rx-123");
    });
    expect(h3.result.current.expandedDetails).toEqual(makeDetails({ id: "rx-123" }));
  });

  it("fetches patient on expand, sets loading flags, caches result, and dedupes concurrent fetches", async () => {
    const row = makeSummary({ id: "rx-1", patientId: "p-9" });
    mockState = seedState({
      prescriptions: {
        items: [row],
        selected: undefined,
        continuationToken: null,
        status: "succeeded",
        error: undefined,
        totalCount: 1,
        pageNumber: 1,
        pageSize: 10,
        totalPages: 1,
      },
    });

    const resolveQueue: Array<() => void> = [];
    mockedGetPatientById.mockImplementation((id: string) => {
      return new Promise((resolve) => {
        resolveQueue.push(() =>
          resolve(makePatient({ id, fullName: "Alice" }))
        );
      });
    });

    const { result } = renderHook(() => usePrescriptionHistoryData({ skipInitialFetch: true }));

    // Expand row -> triggers patient fetch
    act(() => {
      result.current.toggleRow("rx-1");
    });

    // Loading flag should be true
    expect(result.current.expandedPatientLoading).toBe(true);
    expect(result.current.expandedPatient).toBeNull();

    // Trigger another effect cycle (no second request should be made due to inFlightRef)
    await act(async () => {
      // Re-trigger effect by toggling away and back to same row
      result.current.toggleRow("rx-1"); // collapse
      result.current.toggleRow("rx-1"); // expand again (shouldn't duplicate fetch)
    });

    expect(mockedGetPatientById.mock.calls.length).toBe(1);

    // Resolve pending fetch
    await act(async () => {
      resolveQueue.forEach((fn) => fn());
      // Allow microtask queue to flush
      await Promise.resolve();
    });

    // Cache should be populated, loading false, data available
    expect(result.current.expandedPatientLoading).toBe(false);
    expect(result.current.expandedPatient).toMatchObject({ id: "p-9", fullName: "Alice" });

    // Expand again -> should use cache, no additional API calls
    act(() => {
      result.current.toggleRow("rx-1");
      result.current.toggleRow("rx-1");
    });
    expect(mockedGetPatientById.mock.calls.length).toBe(1);
  });

  it("handles getPatientById resolve to null (no cache insert) and loading flags reset", async () => {
    const row = makeSummary({ id: "rx-5", patientId: "p-NO" });
    mockState = seedState({
      prescriptions: {
        items: [row],
        selected: undefined,
        continuationToken: null,
        status: "succeeded",
        error: undefined,
        totalCount: 1,
        pageNumber: 1,
        pageSize: 10,
        totalPages: 1,
      },
    });

    mockedGetPatientById.mockResolvedValueOnce(undefined);

    const { result } = renderHook(() => usePrescriptionHistoryData({ skipInitialFetch: true }));

    act(() => {
      result.current.toggleRow("rx-5");
    });

    expect(result.current.expandedPatientLoading).toBe(true);

    await act(async () => {
      // flush promise
      await Promise.resolve();
    });

    expect(result.current.expandedPatientLoading).toBe(false);
    expect(result.current.expandedPatient).toBeNull();
  });
});
