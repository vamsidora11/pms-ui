// src/features/prescription/hooks/tests/useMedicationStepState.test.tsx
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor, cleanup } from "@testing-library/react";

// ---- Mocks -------------------------------------------------

// Make the debouncer synchronous (no timers)
vi.mock("@utils/hooks/useDebouncedValue", () => ({
  __esModule: true,
  useDebouncedValue: <T,>(v: T) => v,
}));

// Default inventory API (used when searchFn not supplied)
vi.mock("@api/inventory", () => ({
  __esModule: true,
  searchInventory: vi.fn(async (_q: string) => []),
}));

// ⚠️ Adjust the relative import if your file structure differs.
import { useMedicationStepState } from "../hooks/useMedicationStepState";
import { searchInventory as defaultSearchInventory } from "@api/inventory";

// Import the real app types to avoid drift with your models
import type {
  MedicationDraft,
  InventorySearchItem,
} from "../types/models";

// ---- Helpers: factories using real types -------------------

const makeDraft = (overrides: Partial<MedicationDraft> = {}): MedicationDraft => ({
  drugId: "p-1",
  drugName: "Amoxicillin", // required: string
  strength: "500mg",
  frequency: "TID",
  quantity: 15,
  durationDays: 5,
  refills: 1,
  instructions: "After meals",
  ...overrides,
});

// Ensure we satisfy required fields in InventorySearchItem
const makeInvItem = (overrides: Partial<InventorySearchItem> = {}): InventorySearchItem => ({
  productId: "prod-1",
  name: "Amoxicillin",
  strength: "500mg",
  availableStock: 100, // required per your models.ts(78)
  ...overrides,
});

// Minimal sleep helper for microtasks if we really need it
const sleep = (ms = 0) => new Promise((r) => setTimeout(r, ms));

// ---- Crypto handling (safe, no global "unstub all") --------

const originalCrypto = globalThis.crypto as Crypto | undefined;

describe("useMedicationStepState", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Provide a predictable uuid
    if (originalCrypto && typeof originalCrypto.randomUUID === "function") {
      vi.spyOn(originalCrypto, "randomUUID").mockReturnValue("uuid-123" as any);
    } else {
      // Provide a minimal polyfill when not present
      Object.defineProperty(globalThis, "crypto", {
        configurable: true,
        value: {
          randomUUID: vi.fn(() => "uuid-123"),
        },
      });
    }
  });

  afterEach(() => {
    cleanup(); // unmount hook to avoid open effects
    vi.restoreAllMocks();

    // Restore original crypto for the environment
    if (originalCrypto) {
      Object.defineProperty(globalThis, "crypto", {
        configurable: true,
        value: originalCrypto,
      });
    } else {
      // @ts-expect-error – remove our polyfill if we added it
      delete (globalThis as any).crypto;
    }
  });

  it("initializes with one empty row and emits to parent when no medications provided", async () => {
    const onChange = vi.fn();
    const { result } = renderHook(() =>
      useMedicationStepState({
        medications: [],
        onChange,
      })
    );

    expect(result.current.rows.length).toBe(1);
    const r0 = result.current.rows[0];

    expect(typeof r0.uid).toBe("string");
    expect(r0.uid.length).toBeGreaterThan(0);

    expect(r0.drugName).toBe("");
    expect(r0.strength).toBe("");
    expect(r0.frequency).toBe("BID");
    expect(r0.quantity).toBe(1);
    expect(r0.durationDays).toBe(7);
    expect(r0.refills).toBe(0);
    expect(r0.instructions).toBe("");
    expect(r0.isSearching).toBe(true);

    await waitFor(() => {
      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange).toHaveBeenLastCalledWith([
        {
          drugId: undefined,
          drugName: "",
          strength: "",
          frequency: "BID",
          quantity: 1,
          durationDays: 7,
          refills: 0,
          instructions: "",
        },
      ]);
    });

    expect(result.current.minChars).toBe(2);
  });

  it("initializes from provided medications and does not start in searching mode if drugName is present", async () => {
    const onChange = vi.fn();
    const meds: MedicationDraft[] = [makeDraft()];
    const { result } = renderHook(() =>
      useMedicationStepState({
        medications: meds,
        onChange,
      })
    );

    expect(result.current.rows.length).toBe(1);
    const r0 = result.current.rows[0];
    expect(r0.drugName).toBe("Amoxicillin");
    expect(r0.strength).toBe("500mg");
    expect(r0.frequency).toBe("TID");
    expect(r0.isSearching).toBe(false);

    await waitFor(() => {
      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange).toHaveBeenLastCalledWith([makeDraft()]);
    });
  });

  it("does not echo-reset when parent passes back the same drafts (signature guard); but resets on true external change", async () => {
    const onChange = vi.fn();
    const meds: MedicationDraft[] = [];

    const { result, rerender } = renderHook(
      (props: { medications: MedicationDraft[]; onChange: (m: MedicationDraft[]) => void }) =>
        useMedicationStepState(props),
      {
        initialProps: { medications: meds, onChange },
      }
    );

    await waitFor(() => {
      expect(onChange).toHaveBeenCalledTimes(1);
    });

    const emitted1: MedicationDraft[] = onChange.mock.calls[0][0];

    const uid = result.current.rows[0].uid;
    await act(async () => {
      result.current.setSearchText({ [uid]: "am" });
    });
    expect(result.current.searchText[uid]).toBe("am");

    rerender({ medications: emitted1, onChange });

    // No external change -> transient state stays
    await act(async () => {
      await sleep(0);
    });
    expect(result.current.searchText[uid]).toBe("am");

    // External change -> rows and transient states reset
    const externalChange: MedicationDraft[] = [
      makeDraft({ drugName: "Paracetamol", strength: "650mg" }),
    ];
    rerender({ medications: externalChange, onChange });

    await act(async () => {
      await sleep(0);
    });

    expect(result.current.rows.length).toBe(1);
    expect(result.current.rows[0].drugName).toBe("Paracetamol");
    expect(result.current.rows[0].strength).toBe("650mg");

    expect(result.current.searchText[uid]).toBeUndefined();
    expect(result.current.results[uid]).toBeUndefined();
    expect(result.current.loadingByUid[uid]).toBeUndefined();
  });

  it("addRow adds; removeRow guards if single; removes + cleans per-uid UI state when multiple", async () => {
    const onChange = vi.fn();
    const searchFn = vi.fn(async (q: string): Promise<InventorySearchItem[]> => [
      { productId: "p", name: q, strength: "10mg", availableStock: 50 },
    ]);

    const { result } = renderHook(() =>
      useMedicationStepState({ medications: [], onChange, searchFn })
    );

    const uid0 = result.current.rows[0].uid;

    // Single-row removal guard (hook still cleans per-uid states)
    await act(async () => {
      result.current.removeRow(uid0);
    });
    expect(result.current.rows.length).toBe(1);
    expect(result.current.searchText[uid0]).toBeUndefined();
    expect(result.current.results[uid0]).toBeUndefined();
    expect(result.current.loadingByUid[uid0]).toBeUndefined();

    // Add a second row
    await act(async () => {
      result.current.addRow();
    });
    expect(result.current.rows.length).toBe(2);
    const uid1 = result.current.rows[1].uid;

    // Put second row into searching state via public API
    await act(async () => {
      result.current.startSearchMode(uid1);
      result.current.setSearchText({ ...result.current.searchText, [uid1]: "amo" });
    });

    await waitFor(() => {
      expect(searchFn).toHaveBeenCalledWith("amo");
      expect(result.current.results[uid1]).toEqual([
        { productId: "p", name: "amo", strength: "10mg", availableStock: 50 },
      ]);
      expect(result.current.loadingByUid[uid1]).toBe(false);
    });

    // Remove second row -> its per-uid UI state cleans
    await act(async () => {
      result.current.removeRow(uid1);
    });

    expect(result.current.rows.length).toBe(1);
    expect(result.current.searchText[uid1]).toBeUndefined();
    expect(result.current.results[uid1]).toBeUndefined();
    expect(result.current.loadingByUid[uid1]).toBeUndefined();
  });

  it("updateField, startSearchMode, selectDrug update row and UI states correctly", async () => {
    const onChange = vi.fn();
    const { result } = renderHook(() =>
      useMedicationStepState({ medications: [], onChange })
    );

    const uid = result.current.rows[0].uid;

    await act(async () => {
      result.current.updateField(uid, "quantity", 5);
    });
    expect(result.current.rows[0].quantity).toBe(5);

    await act(async () => {
      result.current.startSearchMode(uid);
      result.current.setSearchText({ [uid]: "am" });
    });
    expect(result.current.searchText[uid]).toBe("am");

    const item = makeInvItem({ productId: "xx-1", name: "Amox", strength: "250mg", availableStock: 30 });
    await act(async () => {
      result.current.selectDrug(uid, item);
    });

    expect(result.current.rows[0].drugId).toBe("xx-1");
    expect(result.current.rows[0].drugName).toBe("Amox");
    expect(result.current.rows[0].strength).toBe("250mg");
    expect(result.current.rows[0].isSearching).toBe(false);
    expect(result.current.results[uid]).toEqual([]);
    expect(result.current.searchText[uid]).toBe("");
    expect(result.current.loadingByUid[uid]).toBe(false);
  });

  it("search effect: respects minChars (no call when below) and calls searchFn when >= minChars", async () => {
    const onChange = vi.fn();
    const searchFn = vi.fn(async (q: string): Promise<InventorySearchItem[]> => [
      { productId: "p", name: q, strength: "10mg", availableStock: 99 },
    ]);

    const { result } = renderHook(() =>
      useMedicationStepState({
        medications: [],
        onChange,
        searchFn,
        minChars: 3,
        debounceMs: 1,
      })
    );

    const uid = result.current.rows[0].uid;

    await act(async () => {
      result.current.startSearchMode(uid);
    });

    // Below minChars
    await act(async () => {
      result.current.setSearchText({ [uid]: "ab" });
    });

    await waitFor(() => {
      expect(result.current.results[uid]).toEqual([]);
      expect(result.current.loadingByUid[uid]).toBe(false);
    });
    expect(searchFn).not.toHaveBeenCalled();

    // At minChars
    await act(async () => {
      result.current.setSearchText({ [uid]: "abc" });
    });

    // loading true before the response comes back
    await waitFor(() => {
      expect(result.current.loadingByUid[uid]).toBe(true);
    });

    // Allow microtask to resolve the mocked Promise
    await act(async () => {
      await sleep(0);
    });

    await waitFor(() => {
      expect(searchFn).toHaveBeenCalledWith("abc");
      expect(result.current.results[uid]).toEqual([
        { productId: "p", name: "abc", strength: "10mg", availableStock: 99 },
      ]);
      expect(result.current.loadingByUid[uid]).toBe(false);
    });
  });

  it("search effect: handles error by setting empty results and resetting loading", async () => {
    const onChange = vi.fn();
    const searchFn = vi.fn(async (_q: string): Promise<InventorySearchItem[]> => {
      throw new Error("boom");
    });

    const { result } = renderHook(() =>
      useMedicationStepState({ medications: [], onChange, searchFn })
    );

    const uid = result.current.rows[0].uid;

    await act(async () => {
      result.current.startSearchMode(uid);
      result.current.setSearchText({ [uid]: "am" }); // >= default 2
    });

    await waitFor(() => {
      expect(searchFn).toHaveBeenCalledTimes(1);
      expect(result.current.results[uid]).toEqual([]);
      expect(result.current.loadingByUid[uid]).toBe(false);
    });
  });

  it("latest-request-wins: ignores late results from older request", async () => {
    const onChange = vi.fn();

    let resolveFirst!: (v: InventorySearchItem[]) => void;
    let resolveSecond!: (v: InventorySearchItem[]) => void;

    const first = new Promise<InventorySearchItem[]>((res) => {
      resolveFirst = res;
    });
    const second = new Promise<InventorySearchItem[]>((res) => {
      resolveSecond = res;
    });

    const searchFn = vi
      .fn()
      .mockImplementationOnce((_q: string) => first as any)
      .mockImplementationOnce((_q: string) => second as any);

    const { result } = renderHook(() =>
      useMedicationStepState({ medications: [], onChange, searchFn })
    );

    const uid = result.current.rows[0].uid;

    await act(async () => {
      result.current.startSearchMode(uid);
      result.current.setSearchText({ [uid]: "amo" });  // triggers first
      result.current.setSearchText({ [uid]: "amox" }); // triggers second
    });

    // Resolve the second (newer) first
    await act(async () => {
      resolveSecond([{ productId: "p2", name: "amox", strength: "500mg", availableStock: 42 }]);
    });

    // Then resolve the first (older)
    await act(async () => {
      resolveFirst([{ productId: "p1", name: "amo", strength: "250mg", availableStock: 15 }]);
    });

    await waitFor(() => {
      expect(result.current.results[uid]).toEqual([
        { productId: "p2", name: "amox", strength: "500mg", availableStock: 42 },
      ]);
      expect(result.current.loadingByUid[uid]).toBe(false);
    });
  });

  it("safeUid fallback path works when crypto.randomUUID is unavailable", async () => {
    const onChange = vi.fn();

    // Temporarily remove crypto.randomUUID
    const saved = globalThis.crypto;
    // @ts-expect-error – replace with undefined for the test
    Object.defineProperty(globalThis, "crypto", { configurable: true, value: undefined });

    const { result } = renderHook(() =>
      useMedicationStepState({ medications: [], onChange })
    );

    const uid1 = result.current.rows[0].uid;
    expect(typeof uid1).toBe("string");
    expect(uid1.length).toBeGreaterThan(0);

    await act(async () => {
      result.current.addRow();
    });
    const uid2 = result.current.rows[1].uid;
    expect(uid2).not.toBe(uid1);

    // Restore crypto for subsequent tests
    Object.defineProperty(globalThis, "crypto", {
      configurable: true,
      value: saved,
    });
  });

  it("uses default searchInventory when no searchFn provided", async () => {
    const onChange = vi.fn();
    (defaultSearchInventory as any).mockResolvedValueOnce([
      { productId: "d1", name: "Default", strength: "1mg", availableStock: 7 },
    ]);

    const { result } = renderHook(() =>
      useMedicationStepState({ medications: [], onChange })
    );

    const uid = result.current.rows[0].uid;

    await act(async () => {
      result.current.startSearchMode(uid);
      result.current.setSearchText({ [uid]: "de" }); // >= 2
    });

    await waitFor(() => {
      expect(defaultSearchInventory).toHaveBeenCalledWith("de");
      expect(result.current.results[uid]).toEqual([
        { productId: "d1", name: "Default", strength: "1mg", availableStock: 7 },
      ]);
      expect(result.current.loadingByUid[uid]).toBe(false);
    });
  });
});