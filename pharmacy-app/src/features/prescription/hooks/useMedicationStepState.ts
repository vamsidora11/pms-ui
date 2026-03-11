import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { searchInventory as defaultSearchInventory } from "@api/inventory";
import { useDebouncedValue } from "@utils/hooks/useDebouncedValue";
import type { MedicationDraft, InventorySearchItem } from "@prescription/types/models";
 
export type MedicationRow = MedicationDraft & {
  uid: string;
  isSearching: boolean;
};
 
type Options = {
  medications: MedicationDraft[];
  onChange: (medications: MedicationDraft[]) => void;
 
  searchFn?: (q: string) => Promise<InventorySearchItem[]>;
  debounceMs?: number;
  minChars?: number;
};
 
const safeUid = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};
 
const createRow = (draft?: MedicationDraft): MedicationRow => ({
  uid: safeUid(),
  drugId: draft?.drugId,
  drugName: draft?.drugName ?? "",
  strength: draft?.strength ?? "",
  frequency: draft?.frequency ?? "BID",
  quantity: draft?.quantity ?? 1,
  durationDays: draft?.durationDays ?? 7,
  refills: draft?.refills ?? 0,
  instructions: draft?.instructions ?? "",
  isSearching: !draft?.drugName,
});
 
function signatureFromDrafts(meds: MedicationDraft[]) {
  return meds
    .map((m) =>
      [
        m.drugId ?? "",
        m.drugName ?? "",
        m.strength ?? "",
        m.frequency ?? "",
        m.quantity ?? 0,
        m.durationDays ?? 0,
        m.refills ?? 0,
        m.instructions ?? "",
      ].join("|")
    )
    .join("::");
}
 
export function useMedicationStepState({
  medications,
  onChange,
  searchFn = defaultSearchInventory,
  debounceMs = 250,
  minChars = 2,
}: Options) {
  // local rows (UI state)
  const [rows, setRows] = useState<MedicationRow[]>(() =>
    medications.length > 0 ? medications.map(createRow) : [createRow()]
  );
 
  // search UI states keyed by uid
  const [searchText, setSearchText] = useState<Record<string, string>>({});
  const [results, setResults] = useState<Record<string, InventorySearchItem[]>>({});
  const [loadingByUid, setLoadingByUid] = useState<Record<string, boolean>>({});
  const debouncedSearchText = useDebouncedValue(searchText, debounceMs);
 
  // latest-request-wins per uid
  const reqIdByUidRef = useRef<Record<string, number>>({});
 
  // --- map rows -> drafts (what parent needs)
  const drafts = useMemo<MedicationDraft[]>(
    () =>
      rows.map((row) => {
        const draft = { ...row } as Partial<MedicationRow>;
        delete draft.uid;
        delete draft.isSearching;
        return draft as MedicationDraft;
      }),
    [rows]
  );
 
  const draftsSig = useMemo(() => signatureFromDrafts(drafts), [drafts]);
  const propsSig = useMemo(() => signatureFromDrafts(medications), [medications]);
 
  // To avoid loops:
  // - lastEmittedSig tracks what we last told parent
  // - if parent sends back same data, we do nothing
  const lastEmittedSigRef = useRef<string>("");
  const lastPropsSigRef = useRef<string>(propsSig);
 
  // ✅ Emit to parent AFTER render (standard)
  useEffect(() => {
    if (lastEmittedSigRef.current === draftsSig) return;
    lastEmittedSigRef.current = draftsSig;
    onChange(drafts);
  }, [drafts, draftsSig, onChange]);
 
  // ✅ Sync local rows when parent changes meds externally (reset/load), without echo loop
  useEffect(() => {
    // If parent value equals what we just emitted, ignore
    if (propsSig === lastEmittedSigRef.current) {
      lastPropsSigRef.current = propsSig;
      return;
    }
 
    // Only react when props actually change
    if (propsSig === lastPropsSigRef.current) return;
    lastPropsSigRef.current = propsSig;
 
    // Parent truly changed outside (e.g., reset draft)
    setRows(medications.length > 0 ? medications.map(createRow) : [createRow()]);
 
    // Optional: reset transient search UI state on external change
    setSearchText({});
    setResults({});
    setLoadingByUid({});
    reqIdByUidRef.current = {};
  }, [propsSig, medications]);
 
  // Pure updater
  const updateRows = useCallback((updater: (prev: MedicationRow[]) => MedicationRow[]) => {
    setRows((prev) => updater(prev));
  }, []);
 
  const addRow = useCallback(() => {
    updateRows((prev) => [...prev, createRow()]);
  }, [updateRows]);
 
  const removeRow = useCallback(
    (uid: string) => {
      updateRows((prev) => (prev.length === 1 ? prev : prev.filter((r) => r.uid !== uid)));
 
      setResults((r) => {
        const copy = { ...r };
        delete copy[uid];
        return copy;
      });
      setSearchText((s) => {
        const copy = { ...s };
        delete copy[uid];
        return copy;
      });
      setLoadingByUid((l) => {
        const copy = { ...l };
        delete copy[uid];
        return copy;
      });
      delete reqIdByUidRef.current[uid];
    },
    [updateRows]
  );
 
  const updateField = useCallback(
    (uid: string, field: keyof MedicationDraft, value: string | number) => {
      updateRows((prev) => prev.map((r) => (r.uid === uid ? { ...r, [field]: value } : r)));
    },
    [updateRows]
  );
 
  const startSearchMode = useCallback(
    (uid: string) => {
      updateRows((prev) => prev.map((r) => (r.uid === uid ? { ...r, isSearching: true } : r)));
    },
    [updateRows]
  );
 
  const selectDrug = useCallback(
    (uid: string, item: InventorySearchItem) => {
      updateRows((prev) =>
        prev.map((r) =>
          r.uid === uid
            ? {
                ...r,
                drugId: item.productId,
                drugName: item.name,
                strength: item.strength,
                isSearching: false,
              }
            : r
        )
      );
 
      setResults((r) => ({ ...r, [uid]: [] }));
      setSearchText((s) => ({ ...s, [uid]: "" }));
      setLoadingByUid((l) => ({ ...l, [uid]: false }));
    },
    [updateRows]
  );
 
  // Debounced inventory search for rows in searching mode
  useEffect(() => {
    const searchingUids = rows.filter((r) => r.isSearching).map((r) => r.uid);
 
    searchingUids.forEach((uid) => {
      const q = (debouncedSearchText[uid] ?? "").trim();
 
      if (!q || q.length < minChars) {
        setResults((prev) => ({ ...prev, [uid]: [] }));
        setLoadingByUid((prev) => ({ ...prev, [uid]: false }));
        return;
      }
 
      const requestId = (reqIdByUidRef.current[uid] ?? 0) + 1;
      reqIdByUidRef.current[uid] = requestId;
 
      setLoadingByUid((prev) => ({ ...prev, [uid]: true }));
 
      (async () => {
        try {
          const data = await searchFn(q);
          if (reqIdByUidRef.current[uid] !== requestId) return;
          setResults((prev) => ({ ...prev, [uid]: Array.isArray(data) ? data : [] }));
        } catch {
          if (reqIdByUidRef.current[uid] !== requestId) return;
          setResults((prev) => ({ ...prev, [uid]: [] }));
        } finally {
          if (reqIdByUidRef.current[uid] === requestId) {
            setLoadingByUid((prev) => ({ ...prev, [uid]: false }));
          }
        }
      })();
    });
  }, [debouncedSearchText, minChars, rows, searchFn]);
 
  return {
    rows,
    searchText,
    results,
    loadingByUid,
 
    setSearchText,
 
    addRow,
    removeRow,
    updateField,
    startSearchMode,
    selectDrug,
 
    minChars, // useful for UI condition
  };
}
 
 