// Tests the following:
// Initial fetch on mount
// minChars behavior
// Success state
// Error state
// Abort error ignored
// Loading state transitions
// Fully aligned with your DTO types

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { usePatientDirectory, type SearchPatientsFn } from "../hooks/usePatientDirectory";
import type { PatientSummaryDto } from "@store/patient/patienttype";

// Mock debounce hook to avoid timing complexity
vi.mock("@utils/hooks/useDebouncedValue", () => ({
  useDebouncedValue: (value: string) => value,
}));

describe("usePatientDirectory", () => {
  const mockPatients: PatientSummaryDto[] = [
    {
      id: "1",
      fullName: "John Doe",
      phone: "1234567890",
    },
    {
      id: "2",
      fullName: "Jane Smith",
      phone: "0987654321",
    },
  ];

  let searchFn: ReturnType<typeof vi.fn<SearchPatientsFn>>;

  beforeEach(() => {
    searchFn = vi.fn();
    vi.clearAllMocks();
  });

  it("fetches patients on mount", async () => {
    searchFn.mockResolvedValue(mockPatients);

    const { result } = renderHook(() =>
      usePatientDirectory({ searchFn })
    );

    await waitFor(() => {
      expect(result.current.listLoading).toBe(false);
    });

    expect(searchFn).toHaveBeenCalledWith("", expect.any(Object));
    expect(result.current.patients).toEqual(mockPatients);
    expect(result.current.listError).toBeNull();
  });

  it("searches when minChars is met", async () => {
    searchFn.mockResolvedValue(mockPatients);

    const { result } = renderHook(() =>
      usePatientDirectory({ searchFn, minChars: 2 })
    );

    await act(async () => {
      result.current.setSearchTerm("Jo");
    });

    await waitFor(() => {
      expect(searchFn).toHaveBeenLastCalledWith("Jo", expect.any(Object));
    });

    expect(result.current.patients).toEqual(mockPatients);
  });

  it("does not pass query if below minChars", async () => {
    searchFn.mockResolvedValue(mockPatients);

    const { result } = renderHook(() =>
      usePatientDirectory({ searchFn, minChars: 3 })
    );

    await act(async () => {
      result.current.setSearchTerm("Jo"); // only 2 chars
    });

    await waitFor(() => {
      expect(searchFn).toHaveBeenLastCalledWith("", expect.any(Object));
    });
  });

  it("handles non-abort errors correctly", async () => {
    searchFn.mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() =>
      usePatientDirectory({ searchFn })
    );

    await waitFor(() => {
      expect(result.current.listLoading).toBe(false);
    });

    expect(result.current.listError).toBe("Network error");
    expect(result.current.patients).toEqual([]);
  });

  it("ignores AbortError", async () => {
    const abortError = new DOMException("Aborted", "AbortError");
    searchFn.mockRejectedValue(abortError);

    const { result } = renderHook(() =>
      usePatientDirectory({ searchFn })
    );

    await waitFor(() => {
      expect(result.current.listLoading).toBe(false);
    });

    expect(result.current.listError).toBeNull();
  });

  it("toggles loading state properly", async () => {
    let resolveFn!: (value: PatientSummaryDto[]) => void;

    const promise = new Promise<PatientSummaryDto[]>((resolve) => {
      resolveFn = resolve;
    });

    searchFn.mockReturnValue(promise);

    const { result } = renderHook(() =>
      usePatientDirectory({ searchFn })
    );

    expect(result.current.listLoading).toBe(true);

    await act(async () => {
      resolveFn(mockPatients);
    });

    await waitFor(() => {
      expect(result.current.listLoading).toBe(false);
    });

    expect(result.current.patients).toEqual(mockPatients);
  });
});
