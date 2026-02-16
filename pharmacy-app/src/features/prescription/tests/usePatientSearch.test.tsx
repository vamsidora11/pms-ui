// src/prescription/hooks/tests/usePatientSearch.test.tsx
import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { usePatientSearch } from "../hooks/usePatientSearch";
import type { PatientSummary } from "../types/models";

// Utility: resolve on next macrotask
const flushMicrotasks = async () => {
  await Promise.resolve();
};

describe("usePatientSearch", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  const samplePatients: PatientSummary[] = [
    { id: "p-001", fullName: "Alice Walker", phone: "+14155550101" },
    { id: "p-002", fullName: "Bob Marley", phone: "+14155550102" },
    { id: "p-003", fullName: "Charlie Puth", phone: "+14155550103" },
  ];

  it("returns initial state", () => {
    const { result } = renderHook(() => usePatientSearch());
    expect(result.current.query).toBe("");
    expect(result.current.results).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(null);
    expect(result.current.showResults).toBe(false);
  });

  it("does not search when query length is below minChars", async () => {
    const searchFn = vi.fn().mockResolvedValue(samplePatients);
    const { result } = renderHook(() => usePatientSearch({ searchFn, minChars: 3, debounceMs: 300 }));

    act(() => {
      result.current.onQueryChange("ab"); // length 2 < 3
    });

    // Advance debounce
    await act(async () => {
      vi.advanceTimersByTime(300);
      await flushMicrotasks();
    });

    expect(searchFn).not.toHaveBeenCalled();
    expect(result.current.results).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(null);
  });

  it("performs a debounced search when query length >= minChars", async () => {
    const searchFn = vi.fn().mockResolvedValue([samplePatients[0]]);
    const { result } = renderHook(() => usePatientSearch({ searchFn, minChars: 2, debounceMs: 300 }));

    act(() => {
      result.current.onQueryChange("Al");
    });

    // While waiting for debounce, loading should not yet be true until effect runs
    expect(result.current.loading).toBe(false);

    await act(async () => {
      vi.advanceTimersByTime(300); // trigger debounced effect
      await flushMicrotasks();     // allow promise resolve
    });

    expect(searchFn).toHaveBeenCalledTimes(1);
    expect(searchFn).toHaveBeenCalledWith("Al");
    expect(result.current.results).toEqual([samplePatients[0]]);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(null);
    expect(result.current.showResults).toBe(true); // turned on in onQueryChange
  });

  it("sets error and clears results on search failure", async () => {
    const searchFn = vi.fn().mockRejectedValue(new Error("Network down"));
    const { result } = renderHook(() => usePatientSearch({ searchFn, debounceMs: 200, minChars: 2 }));

    act(() => {
      result.current.onQueryChange("Bo");
    });

    await act(async () => {
      vi.advanceTimersByTime(200);
      await flushMicrotasks();
    });

    expect(searchFn).toHaveBeenCalledTimes(1);
    expect(result.current.results).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe("Network down");
  });

  it("ignores stale requests (only latest response wins)", async () => {
    // Two requests: first resolves later than the second; first should be ignored
    const firstResolve: { fn?: (v?: unknown) => void } = {};
    const secondResolve: { fn?: (v?: unknown) => void } = {};

    const searchFn = vi
      .fn()
      // First call returns a promise we control
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            firstResolve.fn = resolve;
          })
      )
      // Second call returns a different controllable promise
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            secondResolve.fn = resolve;
          })
      );

    const { result } = renderHook(() => usePatientSearch({ searchFn, debounceMs: 250 }));

    // Trigger first request: "Al"
    act(() => {
      result.current.onQueryChange("Al");
    });

    await act(async () => {
      vi.advanceTimersByTime(250);
      await flushMicrotasks();
    });

    // Trigger second request: "Ali"
    act(() => {
      result.current.onQueryChange("Ali");
    });

    await act(async () => {
      vi.advanceTimersByTime(250);
      await flushMicrotasks();
    });

    // Resolve second (latest) first
    await act(async () => {
      secondResolve.fn?.([samplePatients[1]]);
      await flushMicrotasks();
    });

    expect(result.current.results).toEqual([samplePatients[1]]);

    // Now resolve the first (stale) call; it should be ignored
    await act(async () => {
      firstResolve.fn?.([samplePatients[0]]);
      await flushMicrotasks();
    });

    // Still the latest result remains
    expect(result.current.results).toEqual([samplePatients[1]]);
    expect(searchFn).toHaveBeenCalledTimes(2);
  });

  it("clears results when query becomes empty", async () => {
    const searchFn = vi.fn().mockResolvedValue([samplePatients[0]]);
    const { result } = renderHook(() => usePatientSearch({ searchFn, debounceMs: 100 }));

    // Type a valid query to populate results
    act(() => {
      result.current.onQueryChange("Al");
    });
    await act(async () => {
      vi.advanceTimersByTime(100);
      await flushMicrotasks();
    });
    expect(result.current.results.length).toBe(1);

    // Clear the input
    act(() => {
      result.current.onQueryChange("   ");
    });

    // Should clear immediately without calling searchFn again
    expect(result.current.results).toEqual([]);
    expect(searchFn).toHaveBeenCalledTimes(1);
  });

  it("selectPatient calls onPicked and resets internal state", () => {
    const { result } = renderHook(() => usePatientSearch());

    const picked: PatientSummary = samplePatients[2];
    const onPicked = vi.fn();

    // Put some state in
    act(() => {
      result.current.onQueryChange("Char");
      result.current.openResults();
    });

    act(() => {
      result.current.selectPatient(picked, onPicked);
    });

    expect(onPicked).toHaveBeenCalledWith(picked);
    expect(result.current.query).toBe("");
    expect(result.current.results).toEqual([]);
    expect(result.current.showResults).toBe(false);
  });

  it("openResults/closeResults toggles visibility", () => {
    const { result } = renderHook(() => usePatientSearch());
    expect(result.current.showResults).toBe(false);

    act(() => result.current.openResults());
    expect(result.current.showResults).toBe(true);

    act(() => result.current.closeResults());
    expect(result.current.showResults).toBe(false);
  });

  it("respects custom debounceMs and minChars", async () => {
    const searchFn = vi.fn().mockResolvedValue([samplePatients[0]]);
    const { result } = renderHook(() =>
      usePatientSearch({ searchFn, debounceMs: 500, minChars: 4 })
    );

    act(() => {
      result.current.onQueryChange("Ali"); // length 3 < 4
    });

    await act(async () => {
      vi.advanceTimersByTime(500);
      await flushMicrotasks();
    });

    expect(searchFn).not.toHaveBeenCalled();

    act(() => {
      result.current.onQueryChange("Alin"); // length 4 == minChars
    });

    await act(async () => {
      vi.advanceTimersByTime(499);
      await flushMicrotasks();
    });
    expect(searchFn).not.toHaveBeenCalled();

    await act(async () => {
      vi.advanceTimersByTime(1); // now equals debounceMs
      await flushMicrotasks();
    });
    expect(searchFn).toHaveBeenCalledWith("Alin");
    expect(result.current.loading).toBe(false);
  });
});
