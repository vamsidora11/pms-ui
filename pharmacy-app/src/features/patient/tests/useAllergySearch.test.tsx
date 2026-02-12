/*
  useAllergySearch Hook Unit Tests

  This test suite covers the following scenarios:

  1. Initial state:
     - suggestions is an empty array
     - loading is false
     - error is null
     - open is false
     - highlightIndex is -1

  2. Query below minChars:
     - If query length is less than minChars, no search is triggered
     - suggestions remain empty
     - open remains false
     - searchFn is not called

  3. Successful search:
     - When query meets minChars, searchFn is called with correct parameters
     - suggestions are set to the returned results
     - open is true
     - highlightIndex is set to 0 if suggestions exist
     - loading toggles correctly from true → false
     - error remains null

  4. Filtering out selected items:
     - Any items in the `selected` array are removed from suggestions
     - suggestions contain only non-selected items
     - highlightIndex is adjusted accordingly

  5. Handling errors:
     - Non-abort errors from searchFn set the error state
     - suggestions are cleared
     - open is true
     - highlightIndex is -1
     - loading toggles correctly

  6. Ignoring AbortError:
     - If searchFn rejects with an AbortError, error state is not set
     - suggestions remain empty
     - open remains false
     - loading is false

  7. Loading state during async search:
     - While searchFn promise is pending, loading is true
     - After promise resolves, loading is false
     - suggestions are updated correctly

  8. Stable `selected` array:
     - Prevents infinite re-renders due to changing array references in useMemo
     - Important for proper hook behavior in tests

  Notes:
    - useDebouncedValue is mocked to return immediately to simplify testing
    - waitFor is used to await async state updates from the hook
    - act is used when manually resolving promises to trigger React state updates
*/

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor, cleanup } from "@testing-library/react";
import { useAllergySearch, type AllergySearchFn } from "../hooks/useAllergySearch";

vi.mock("@utils/hooks/useDebouncedValue", () => ({
  useDebouncedValue: (value: string) => value,
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("useAllergySearch", () => {
  let searchFn: ReturnType<typeof vi.fn<AllergySearchFn>>;
  const emptySelected: string[] = []; // stable reference to prevent infinite effect re-renders

  beforeEach(() => {
    searchFn = vi.fn();
  });

  it("has correct initial state", () => {
    const { result } = renderHook(() =>
      useAllergySearch({
        query: "",
        selected: emptySelected,
        searchFn,
      })
    );

    expect(result.current.suggestions).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.open).toBe(false);
    expect(result.current.highlightIndex).toBe(-1);
  });

  it("does nothing if query is below minChars", async () => {
    searchFn.mockResolvedValue(["Peanut"]);

    const { result } = renderHook(() =>
      useAllergySearch({
        query: "p", // 1 char, minChars = 2 default
        selected: emptySelected,
        searchFn,
      })
    );

    await waitFor(() => {
      expect(result.current.suggestions).toEqual([]);
      expect(result.current.open).toBe(false);
    });

    expect(searchFn).not.toHaveBeenCalled();
  });

  it("searches correctly when query meets minChars", async () => {
    searchFn.mockResolvedValue(["Peanut"]);

    const { result } = renderHook(() =>
      useAllergySearch({
        query: "pea",
        selected: emptySelected,
        searchFn,
      })
    );

    await waitFor(() => {
      expect(result.current.suggestions).toEqual(["Peanut"]);
      expect(result.current.open).toBe(true);
      expect(result.current.highlightIndex).toBe(0);
    });

    expect(searchFn).toHaveBeenCalledWith(
      "pea",
      expect.objectContaining({ minChars: 2 })
    );
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("filters out selected items", async () => {
    searchFn.mockResolvedValue(["Peanut", "Dust"]);

    const { result } = renderHook(() =>
      useAllergySearch({
        query: "p",
        selected: ["peanut"],
        searchFn,
        minChars: 1, // override minChars to trigger
      })
    );

    await waitFor(() => {
      expect(result.current.suggestions).toEqual(["Dust"]);
      expect(result.current.open).toBe(true);
      expect(result.current.highlightIndex).toBe(0);
    });
  });

  it("handles errors correctly", async () => {
    searchFn.mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() =>
      useAllergySearch({
        query: "pea",
        selected: emptySelected,
        searchFn,
      })
    );

    await waitFor(() => {
      expect(result.current.error).toBe("Network error");
      expect(result.current.suggestions).toEqual([]);
      expect(result.current.open).toBe(true);
      expect(result.current.highlightIndex).toBe(-1);
    });

    expect(result.current.loading).toBe(false);
  });

  it("ignores abort errors", async () => {
    const abortError = new DOMException("Aborted", "AbortError");
    searchFn.mockRejectedValue(abortError);

    const { result } = renderHook(() =>
      useAllergySearch({
        query: "pea",
        selected: emptySelected,
        searchFn,
      })
    );

    await waitFor(() => {
      expect(result.current.suggestions).toEqual([]);
      expect(result.current.error).toBeNull();
      expect(result.current.open).toBe(false);
    });

    expect(result.current.loading).toBe(false);
  });

  it("sets loading state correctly during async search", async () => {
    let resolveFn!: (value: string[]) => void;

    const promise = new Promise<string[]>((resolve) => {
      resolveFn = resolve;
    });

    searchFn.mockReturnValue(promise);

    const { result } = renderHook(() =>
      useAllergySearch({
        query: "pea",
        selected: emptySelected,
        searchFn,
      })
    );

    expect(result.current.loading).toBe(true);

    await act(async () => {
      resolveFn(["Peanut"]);
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.suggestions).toEqual(["Peanut"]);
    });
  });
});
