import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useMedicationStepState } from "../hooks/useMedicationStepState";
import type { InventorySearchItem, MedicationDraft } from "../types/models";
 
vi.mock("@utils/hooks/useDebouncedValue", () => ({
  useDebouncedValue: (value: unknown) => value,
}));
 
type SearchFn = (q: string) => Promise<InventorySearchItem[]>;
 
const makeDraft = (over: Partial<MedicationDraft> = {}): MedicationDraft => ({
  drugId: over.drugId,
  drugName: over.drugName ?? "",
  strength: over.strength ?? "",
  frequency: over.frequency ?? "BID",
  quantity: over.quantity ?? 1,
  durationDays: over.durationDays ?? 7,
  refills: over.refills ?? 0,
  instructions: over.instructions ?? "",
  price: over.price,
});
 
describe("useMedicationStepState", () => {
  let onChange: ReturnType<typeof vi.fn>;
  let searchFn: ReturnType<typeof vi.fn<SearchFn>>;
 
  beforeEach(() => {
    onChange = vi.fn();
    searchFn = vi.fn();
    vi.clearAllMocks();
  });
 
  it("initializes with a single empty row and emits drafts", async () => {
    const { result } = renderHook(() =>
      useMedicationStepState({ medications: [], onChange, searchFn }),
    );
 
    expect(result.current.rows).toHaveLength(1);
    expect(result.current.rows[0].isSearching).toBe(true);
 
    await waitFor(() => {
      expect(onChange).toHaveBeenCalledTimes(1);
    });
 
    const draft = onChange.mock.calls[0]?.[0]?.[0];
    expect(draft).toMatchObject({
      drugName: "",
      strength: "",
      frequency: "BID",
      quantity: 1,
      durationDays: 7,
      refills: 0,
      instructions: "",
    });
  });
 
  it("initializes from provided medications", () => {
    const meds = [
      makeDraft({ drugId: "d1", drugName: "Med A", strength: "10mg" }),
      makeDraft({ drugId: "d2", drugName: "Med B", strength: "20mg" }),
    ];
 
    const { result } = renderHook(() =>
      useMedicationStepState({ medications: meds, onChange, searchFn }),
    );
 
    expect(result.current.rows).toHaveLength(2);
    expect(result.current.rows[0].drugName).toBe("Med A");
    expect(result.current.rows[0].isSearching).toBe(false);
  });
 
  it("addRow and removeRow behave correctly", () => {
    const { result } = renderHook(() =>
      useMedicationStepState({ medications: [], onChange, searchFn }),
    );
 
    act(() => {
      result.current.addRow();
    });
    expect(result.current.rows.length).toBe(2);
 
    const firstUid = result.current.rows[0].uid;
    act(() => {
      result.current.removeRow(firstUid);
    });
    expect(result.current.rows.length).toBe(1);
 
    // remove when only one row -> no-op
    const onlyUid = result.current.rows[0].uid;
    act(() => {
      result.current.removeRow(onlyUid);
    });
    expect(result.current.rows.length).toBe(1);
  });
 
  it("updateField and startSearchMode update row state", () => {
    const { result } = renderHook(() =>
      useMedicationStepState({ medications: [], onChange, searchFn }),
    );
 
    const uid = result.current.rows[0].uid;
 
    act(() => {
      result.current.updateField(uid, "drugName", "Amoxicillin");
    });
    expect(result.current.rows[0].drugName).toBe("Amoxicillin");
 
    act(() => {
      result.current.startSearchMode(uid);
    });
    expect(result.current.rows[0].isSearching).toBe(true);
  });
 
  it("selectDrug fills fields and clears search state", async () => {
    searchFn.mockResolvedValueOnce([
      { productId: "p1", name: "Drug X", strength: "10mg", availableStock: 5 },
    ]);
 
    const { result } = renderHook(() =>
      useMedicationStepState({ medications: [], onChange, searchFn }),
    );
 
    const uid = result.current.rows[0].uid;
 
    act(() => {
      result.current.setSearchText({ [uid]: "Drug" });
    });
 
    await waitFor(() => {
      expect(result.current.results[uid]).toHaveLength(1);
    });
 
    act(() => {
      result.current.selectDrug(uid, {
        productId: "p1",
        name: "Drug X",
        strength: "10mg",
        availableStock: 5,
      });
    });
 
    const row = result.current.rows[0];
    expect(row.drugId).toBe("p1");
    expect(row.drugName).toBe("Drug X");
    expect(row.strength).toBe("10mg");
    expect(row.isSearching).toBe(false);
    expect(result.current.searchText[uid]).toBe("");
    expect(result.current.results[uid]).toEqual([]);
    expect(result.current.loadingByUid[uid]).toBe(false);
  });
 
  it("respects minChars and does not search for short queries", async () => {
    const { result } = renderHook(() =>
      useMedicationStepState({ medications: [], onChange, searchFn, minChars: 3 }),
    );
    const uid = result.current.rows[0].uid;
 
    act(() => {
      result.current.setSearchText({ [uid]: "ab" });
    });
 
    await waitFor(() => {
      expect(result.current.loadingByUid[uid]).toBe(false);
    });
    expect(searchFn).not.toHaveBeenCalled();
    expect(result.current.results[uid]).toEqual([]);
  });
 
  it("handles search errors and clears results", async () => {
    searchFn.mockRejectedValueOnce(new Error("boom"));
 
    const { result } = renderHook(() =>
      useMedicationStepState({ medications: [], onChange, searchFn }),
    );
    const uid = result.current.rows[0].uid;
 
    act(() => {
      result.current.setSearchText({ [uid]: "Drug" });
    });
 
    await waitFor(() => {
      expect(result.current.loadingByUid[uid]).toBe(false);
    });
    expect(result.current.results[uid]).toEqual([]);
  });
 
  it("ignores stale search responses (latest wins)", async () => {
    let resolveFirst: (v: InventorySearchItem[]) => void;
    let resolveSecond: (v: InventorySearchItem[]) => void;
 
    const firstPromise = new Promise<InventorySearchItem[]>((res) => {
      resolveFirst = res;
    });
    const secondPromise = new Promise<InventorySearchItem[]>((res) => {
      resolveSecond = res;
    });
 
    searchFn
      .mockReturnValueOnce(firstPromise)
      .mockReturnValueOnce(secondPromise);
 
    const { result } = renderHook(() =>
      useMedicationStepState({ medications: [], onChange, searchFn }),
    );
    const uid = result.current.rows[0].uid;
 
    act(() => {
      result.current.setSearchText({ [uid]: "Aspirin" });
    });
    act(() => {
      result.current.setSearchText({ [uid]: "Ibuprofen" });
    });
 
    await act(async () => {
      resolveSecond!([{ productId: "p2", name: "Ibu", strength: "200mg", availableStock: 3 }]);
    });
    await act(async () => {
      resolveFirst!([{ productId: "p1", name: "Asp", strength: "100mg", availableStock: 2 }]);
    });
 
    expect(result.current.results[uid]).toEqual([
      { productId: "p2", name: "Ibu", strength: "200mg", availableStock: 3 },
    ]);
  });
 
  it("syncs rows when medications prop changes", () => {
    const medsA = [makeDraft({ drugId: "d1", drugName: "Med A" })];
    const medsB = [makeDraft({ drugId: "d2", drugName: "Med B" })];
 
    const { result, rerender } = renderHook(
      ({ meds }) => useMedicationStepState({ medications: meds, onChange, searchFn }),
      { initialProps: { meds: medsA } },
    );
 
    expect(result.current.rows[0].drugId).toBe("d1");
 
    rerender({ meds: medsB });
    expect(result.current.rows[0].drugId).toBe("d2");
  });
});
 
 