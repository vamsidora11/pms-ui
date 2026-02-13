import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import type { PatientDetailsDto } from '@patient/types/patienttype';
import { usePatientDetails, type GetPatientDetailsFn } from '../hooks/usePatientDetails';

// Helper to control async resolution deterministically
function defer<T>() {
  let resolve!: (v: T) => void;
  let reject!: (e: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe('usePatientDetails', () => {
  const fakePatient: PatientDetailsDto = {
    id: 'p-001',
    fullName: 'John Doe',
    dob: '1990-01-01',
    gender: 'male',
    phone: '+911234567890',
    address: '123 Street',
    allergies: [],
  };

  let originalConsoleError: typeof console.error;

  beforeEach(() => {
    originalConsoleError = console.error;
    console.error = vi.fn(); // suppress error logs in test output
  });

  afterEach(() => {
    console.error = originalConsoleError;
    vi.restoreAllMocks();
  });

  it('initial state is correct', () => {
    const getDetailsFn: GetPatientDetailsFn = vi.fn();
    const hook = renderHook(() => usePatientDetails(getDetailsFn));

    expect(hook.result.current.selectedPatient).toBeNull();
    expect(hook.result.current.detailsLoading).toBe(false);
    expect(hook.result.current.detailsError).toBeNull();
    expect(typeof hook.result.current.selectPatient).toBe('function');
    expect(typeof hook.result.current.setSelectedPatient).toBe('function');
  });

  it('loads and sets patient details on success', async () => {
    const getDetailsFn: GetPatientDetailsFn = vi.fn().mockResolvedValue(fakePatient);
    const hook = renderHook(() => usePatientDetails(getDetailsFn));

    await act(async () => {
      await hook.result.current.selectPatient('p-001');
    });

    expect(getDetailsFn).toHaveBeenCalledTimes(1);
    expect(getDetailsFn).toHaveBeenCalledWith('p-001');
    expect(hook.result.current.detailsLoading).toBe(false);
    expect(hook.result.current.detailsError).toBeNull();
    expect(hook.result.current.selectedPatient).toEqual(fakePatient);
  });

  it('sets error and clears selectedPatient on failure', async () => {
    const error = new Error('Network down');
    const getDetailsFn: GetPatientDetailsFn = vi.fn().mockRejectedValue(error);
    const hook = renderHook(() => usePatientDetails(getDetailsFn));

    await act(async () => {
      await hook.result.current.selectPatient('p-001');
    });

    expect(getDetailsFn).toHaveBeenCalledTimes(1);
    expect(hook.result.current.detailsLoading).toBe(false);
    expect(hook.result.current.selectedPatient).toBeNull();
    expect(hook.result.current.detailsError).toBe('Network down');
    expect(console.error).toHaveBeenCalled();
  });

  it('uses a default error message when error.message is missing', async () => {
    const getDetailsFn: GetPatientDetailsFn = vi.fn().mockRejectedValue({});
    const hook = renderHook(() => usePatientDetails(getDetailsFn));

    await act(async () => {
      await hook.result.current.selectPatient('p-001');
    });

    expect(hook.result.current.detailsError).toBe('Failed to load patient details');
  });

  it('does nothing when patientId is empty', async () => {
    const getDetailsFn: GetPatientDetailsFn = vi.fn();
    const hook = renderHook(() => usePatientDetails(getDetailsFn));

    await act(async () => {
      await hook.result.current.selectPatient('');
      await hook.result.current.selectPatient(undefined as unknown as string);
      await hook.result.current.selectPatient(null as unknown as string);
    });

    expect(getDetailsFn).not.toHaveBeenCalled();
    expect(hook.result.current.selectedPatient).toBeNull();
    expect(hook.result.current.detailsError).toBeNull();
    expect(hook.result.current.detailsLoading).toBe(false);
  });

  it('concurrency guard: prevents overlapping calls', async () => {
    // 1st call is intentionally slow (we control when it resolves)
    const d1 = defer<PatientDetailsDto>();
    const getDetailsFn = vi.fn<GetPatientDetailsFn>().mockReturnValueOnce(d1.promise);

    const hook = renderHook(() => usePatientDetails(getDetailsFn));

    // Fire first call - puts selectingRef.current = true
    await act(async () => {
      // don't await yet; we purposely keep it pending
      hook.result.current.selectPatient('p-001');
    });

    // Try to fire another "overlapping" call; should be ignored by guard
    await act(async () => {
      // Because the guard returns early, this should NOT invoke getDetailsFn again
      await hook.result.current.selectPatient('p-001');
    });
    expect(getDetailsFn).toHaveBeenCalledTimes(1);

    // Resolve the first call
    await act(async () => {
      d1.resolve(fakePatient);
      // let the microtask queue flush
      await Promise.resolve();
    });

    expect(hook.result.current.selectedPatient).toEqual(fakePatient);
    expect(hook.result.current.detailsLoading).toBe(false);

    // Now that the first call has completed and guard is lifted,
    // a subsequent call should work normally.
    const anotherPatient: PatientDetailsDto = {
      ...fakePatient,
      id: 'p-002',
      fullName: 'John Doe',
    };

    // Next invocation resolves immediately with anotherPatient
    (getDetailsFn as vi.Mock).mockResolvedValueOnce(anotherPatient);

    await act(async () => {
      await hook.result.current.selectPatient('p-002');
    });

    expect(getDetailsFn).toHaveBeenCalledTimes(2);
    expect(hook.result.current.selectedPatient).toEqual(anotherPatient);
  });

  it('allows manual override via setSelectedPatient', async () => {
    const getDetailsFn: GetPatientDetailsFn = vi.fn();
    const hook = renderHook(() => usePatientDetails(getDetailsFn));

    await act(async () => {
      hook.result.current.setSelectedPatient(fakePatient);
    });

    expect(hook.result.current.selectedPatient).toEqual(fakePatient);
  });

  it('detailsLoading toggles true during fetch then false after', async () => {
    const d = defer<PatientDetailsDto>();
    const getDetailsFn: GetPatientDetailsFn = vi.fn().mockImplementation(() => d.promise);
    const hook = renderHook(() => usePatientDetails(getDetailsFn));

    // 1) Kick off the request (do not await the returned promise here)
    await act(async () => {
      hook.result.current.selectPatient('p-001');
    });

    // 2) Wait for loading to turn true (React may commit after a tick)
    await waitFor(() => {
      expect(hook.result.current.detailsLoading).toBe(true);
    });

    // 3) Resolve and flush
    await act(async () => {
      d.resolve(fakePatient);
      await Promise.resolve();
    });

    // 4) Wait for settled state
    await waitFor(() => {
      expect(hook.result.current.detailsLoading).toBe(false);
      expect(hook.result.current.selectedPatient).toEqual(fakePatient);
    });
  });
});