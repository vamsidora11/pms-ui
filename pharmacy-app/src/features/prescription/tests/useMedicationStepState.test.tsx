// src/prescription/hooks/tests/useMedicationStepState.test.tsx
import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderHook, act, cleanup } from '@testing-library/react';
import { useMedicationStepState } from '../hooks/useMedicationStepState';
import type { MedicationDraft, InventorySearchItem } from '../types/models';

vi.mock('@api/inventory', () => ({
  searchInventory: vi.fn(),
}));

function deferred<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

// Helper to create valid InventorySearchItem objects
const makeSearchItem = (overrides: Partial<InventorySearchItem> = {}): InventorySearchItem => ({
  productId: 'p-1',
  name: 'Paracetamol',
  strength: '500mg',
  availableStock: 25,
  ...overrides,
});

afterEach(async () => {
  // Unmount anything rendered in the test (prevents open effects/timers)
  cleanup();

  // Drain any pending timers from debounced effects safely
  try {
    await vi.runOnlyPendingTimersAsync();
  } catch {
    // ignore if none pending
  }
  vi.clearAllTimers();

  // Restore real timers and mocks
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('useMedicationStepState', () => {
  it('initializes with one empty row when medications is empty and emits onChange once', async () => {
    const onChange = vi.fn();

    renderHook(() =>
      useMedicationStepState({
        medications: [],
        onChange,
        searchFn: vi.fn<(q: string) => Promise<InventorySearchItem[]>>().mockResolvedValue([]),
        debounceMs: 10,
      }),
    );

    // onChange emits after mount (effect)
    await Promise.resolve();
    expect(onChange).toHaveBeenCalledTimes(1);

    const emitted = onChange.mock.calls[0][0] as MedicationDraft[];
    expect(emitted).toEqual([
      {
        drugId: undefined,
        drugName: '',
        strength: '',
        frequency: 'BID',
        quantity: 1,
        durationDays: 7,
        refills: 0,
        instructions: '',
      },
    ]);
  });

  it('initializes from medications with isSearching=false and emits onChange', async () => {
    const onChange = vi.fn();
    const meds: MedicationDraft[] = [
      {
        drugId: 'p-001',
        drugName: 'Paracetamol',
        strength: '500mg',
        frequency: 'TID',
        quantity: 9,
        durationDays: 3,
        refills: 0,
        instructions: 'pc',
      },
    ];

    renderHook(() =>
      useMedicationStepState({
        medications: meds,
        onChange,
        searchFn: vi.fn<(q: string) => Promise<InventorySearchItem[]>>().mockResolvedValue([]),
        debounceMs: 10,
      }),
    );

    await Promise.resolve(); // flush effect
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(meds);
  });

  it('addRow adds a new blank row', async () => {
    const onChange = vi.fn();
    const { result } = renderHook(() =>
      useMedicationStepState({
        medications: [],
        onChange,
        searchFn: vi.fn<(q: string) => Promise<InventorySearchItem[]>>().mockResolvedValue([]),
        debounceMs: 10,
      }),
    );

    const initialLen = result.current.rows.length;
    await act(async () => {
      result.current.addRow();
    });
    expect(result.current.rows.length).toBe(initialLen + 1);
  });

  it('removeRow prevents removing the last row, but removes when more than one and cleans search state', async () => {
    const onChange = vi.fn();
    const { result } = renderHook(() =>
      useMedicationStepState({
        medications: [],
        onChange,
        searchFn: vi.fn<(q: string) => Promise<InventorySearchItem[]>>().mockResolvedValue([]),
        debounceMs: 10,
      }),
    );

    const onlyUid = result.current.rows[0].uid;
    await act(async () => {
      result.current.removeRow(onlyUid);
    });
    expect(result.current.rows).toHaveLength(1);

    await act(async () => {
      result.current.addRow();
    });
    expect(result.current.rows).toHaveLength(2);
    const secondUid = result.current.rows[1].uid;

    await act(async () => {
      result.current.setSearchText({ [secondUid]: 'par' });
    });
    expect(result.current.searchText[secondUid]).toBe('par');

    await act(async () => {
      result.current.removeRow(secondUid);
    });
    expect(result.current.rows).toHaveLength(1);
    expect(result.current.searchText[secondUid]).toBeUndefined();
    expect(result.current.results[secondUid]).toBeUndefined();
    expect(result.current.loadingByUid[secondUid]).toBeUndefined();
  });

  it('updateField updates a specific field in a row', async () => {
    const onChange = vi.fn();
    const { result } = renderHook(() =>
      useMedicationStepState({
        medications: [],
        onChange,
        searchFn: vi.fn<(q: string) => Promise<InventorySearchItem[]>>().mockResolvedValue([]),
        debounceMs: 10,
      }),
    );

    const uid = result.current.rows[0].uid;
    await act(async () => {
      result.current.updateField(uid, 'quantity', 12);
      result.current.updateField(uid, 'frequency', 'QID');
    });

    const updated = result.current.rows.find((r) => r.uid === uid)!;
    expect(updated.quantity).toBe(12);
    expect(updated.frequency).toBe('QID');
  });

  it('startSearchMode enables search for a row', async () => {
    const onChange = vi.fn();
    const { result } = renderHook(() =>
      useMedicationStepState({
        medications: [
          {
            drugId: 'p-1',
            drugName: 'Ibuprofen',
            strength: '200mg',
            frequency: 'BID',
            quantity: 10,
            durationDays: 5,
            refills: 0,
            instructions: '',
          },
        ],
        onChange,
        searchFn: vi.fn<(q: string) => Promise<InventorySearchItem[]>>().mockResolvedValue([]),
        debounceMs: 10,
      }),
    );

    const uid = result.current.rows[0].uid;
    expect(result.current.rows[0].isSearching).toBe(false);

    await act(async () => {
      result.current.startSearchMode(uid);
    });
    expect(result.current.rows[0].isSearching).toBe(true);
  });

  it('selectDrug updates row and clears search UI state for that uid', async () => {
    const onChange = vi.fn();
    const { result } = renderHook(() =>
      useMedicationStepState({
        medications: [],
        onChange,
        searchFn: vi.fn<(q: string) => Promise<InventorySearchItem[]>>().mockResolvedValue([]),
        debounceMs: 10,
      }),
    );

    const uid = result.current.rows[0].uid;

    await act(async () => {
      result.current.setSearchText({ [uid]: 'para' });
    });

    const item: InventorySearchItem = makeSearchItem({
      productId: 'p-001',
      name: 'Paracetamol',
      strength: '500mg',
      availableStock: 50,
    });

    await act(async () => {
      result.current.selectDrug(uid, item);
    });

    const r = result.current.rows[0];
    expect(r.drugId).toBe('p-001');
    expect(r.drugName).toBe('Paracetamol');
    expect(r.strength).toBe('500mg');
    expect(r.isSearching).toBe(false);
    expect(result.current.searchText[uid]).toBe('');
    expect(result.current.results[uid]).toEqual([]);
    expect(result.current.loadingByUid[uid]).toBe(false);
  });

  it('debounced search: respects minChars and toggles loading/results via searchFn', async () => {
    vi.useFakeTimers(); // only for debounce test

    const onChange = vi.fn();
    const searchFn = vi
      .fn<(q: string) => Promise<InventorySearchItem[]>>()
      .mockResolvedValue([makeSearchItem({ productId: 'p-1' })]);

    const { result } = renderHook(() =>
      useMedicationStepState({
        medications: [],
        onChange,
        searchFn,
        debounceMs: 10,
        minChars: 2,
      }),
    );

    const uid = result.current.rows[0].uid;

    // Too short
    await act(async () => {
      result.current.setSearchText({ [uid]: 'p' }); // length 1 < minChars
    });
    await vi.advanceTimersByTimeAsync(11);
    await Promise.resolve();

    expect(searchFn).not.toHaveBeenCalled();
    expect(result.current.results[uid]).toEqual([]);
    expect(result.current.loadingByUid[uid]).toBe(false);

    // Meets minChars
    await act(async () => {
      result.current.setSearchText({ [uid]: 'pa' }); // length 2
    });
    await vi.advanceTimersByTimeAsync(11);
    await Promise.resolve(); // flush async IIFE

    expect(searchFn).toHaveBeenCalledWith('pa');
    expect(result.current.loadingByUid[uid]).toBe(false);
    expect(result.current.results[uid]).toEqual([makeSearchItem({ productId: 'p-1' })]);
  });

  it('latest-request-wins: only latest search result updates state', async () => {
    vi.useFakeTimers(); // only for debounce test

    const onChange = vi.fn();
    const d1 = deferred<InventorySearchItem[]>();
    const d2 = deferred<InventorySearchItem[]>();

    const searchFn = vi
      .fn<(q: string) => Promise<InventorySearchItem[]>>()
      .mockImplementationOnce(() => d1.promise)
      .mockImplementationOnce(() => d2.promise);

    const { result } = renderHook(() =>
      useMedicationStepState({
        medications: [],
        onChange,
        searchFn,
        debounceMs: 5,
        minChars: 2,
      }),
    );
    const uid = result.current.rows[0].uid;

    // First query
    await act(async () => {
      result.current.setSearchText({ [uid]: 'par' });
    });
    await vi.advanceTimersByTimeAsync(6);
    await Promise.resolve();

    // Second query (should win)
    await act(async () => {
      result.current.setSearchText({ [uid]: 'para' });
    });
    await vi.advanceTimersByTimeAsync(6);
    await Promise.resolve();

    // Resolve the first (should be ignored)
    await act(async () => {
      d1.resolve([makeSearchItem({ productId: 'p-1', name: 'Old', strength: '100mg' })]);
    });
    await Promise.resolve();

    expect(result.current.results[uid]).not.toEqual([
      makeSearchItem({ productId: 'p-1', name: 'Old', strength: '100mg' }),
    ]);

    // Resolve the latest (should apply)
    await act(async () => {
      d2.resolve([
        makeSearchItem({ productId: 'p-2', name: 'Latest', strength: '500mg', availableStock: 10 }),
      ]);
    });
    await Promise.resolve();

    expect(result.current.results[uid]).toEqual([
      makeSearchItem({ productId: 'p-2', name: 'Latest', strength: '500mg', availableStock: 10 }),
    ]);
    expect(result.current.loadingByUid[uid]).toBe(false);
  });

  it('syncs with external medications changes (resets local rows & clears transient search state)', async () => {
    const onChange = vi.fn();
    const initialMeds: MedicationDraft[] = [
      {
        drugId: 'a-1',
        drugName: 'Amoxicillin',
        strength: '250mg',
        frequency: 'BID',
        quantity: 10,
        durationDays: 5,
        refills: 0,
        instructions: '',
      },
    ];

    const { result, rerender } = renderHook(
      (props: {
        medications: MedicationDraft[];
        onChange: (x: MedicationDraft[]) => void;
        searchFn: (q: string) => Promise<InventorySearchItem[]>;
        debounceMs?: number;
        minChars?: number;
      }) => useMedicationStepState(props),
      {
        initialProps: {
          medications: initialMeds,
          onChange,
          searchFn: vi.fn<(q: string) => Promise<InventorySearchItem[]>>().mockResolvedValue([]),
          debounceMs: 10,
          minChars: 2,
        },
      },
    );

    const uid = result.current.rows[0].uid;
    await act(async () => {
      result.current.setSearchText({ [uid]: 'amo' });
    });
    expect(result.current.searchText[uid]).toBe('amo');

    const newMeds: MedicationDraft[] = [];
    rerender({
      medications: newMeds,
      onChange,
      searchFn: vi.fn<(q: string) => Promise<InventorySearchItem[]>>().mockResolvedValue([]),
      debounceMs: 10,
      minChars: 2,
    });

    expect(result.current.rows).toHaveLength(1);
    const newUid = result.current.rows[0].uid;
    expect(result.current.searchText[uid]).toBeUndefined();
    expect(result.current.results[uid]).toBeUndefined();
    expect(result.current.loadingByUid[uid]).toBeUndefined();
    expect(result.current.searchText[newUid]).toBeUndefined();
  });

  it('exposes minChars value passed in options', () => {
    const onChange = vi.fn();
    const { result } = renderHook(() =>
      useMedicationStepState({
        medications: [],
        onChange,
        searchFn: vi.fn<(q: string) => Promise<InventorySearchItem[]>>().mockResolvedValue([]),
        debounceMs: 50,
        minChars: 3,
      }),
    );

    expect(result.current.minChars).toBe(3);
  });
});