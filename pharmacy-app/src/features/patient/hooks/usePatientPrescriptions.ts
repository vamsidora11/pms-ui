import { useCallback, useEffect, useRef, useState } from "react";

type PageResult<T> = { items: T[]; continuationToken: string | null };

export type GetPrescriptionsByPatientFn<T> = (
  patientId: string,
  pageSize?: number,
  continuationToken?: string | null,
) => Promise<PageResult<T>>;

export function usePatientPrescriptions<T>(
  getPrescriptionsByPatient: GetPrescriptionsByPatientFn<T>,
  patientId: string | null | undefined,
  pageSize = 10,
) {
  const [items, setItems] = useState<T[]>([]);
  const [token, setToken] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // prevents race conditions when switching patients quickly
  const reqIdRef = useRef(0);
  const getFnRef = useRef(getPrescriptionsByPatient);

  useEffect(() => {
    getFnRef.current = getPrescriptionsByPatient;
  }, [getPrescriptionsByPatient]);

  const reset = useCallback(() => {
    setItems([]);
    setToken(null);
    setLoading(false);
    setLoadingMore(false);
    setError(null);
  }, []);

  const loadFirstPage = useCallback(async () => {
    if (!patientId) {
      reset();
      return;
    }

    const reqId = ++reqIdRef.current;
    setLoading(true);
    setError(null);

    try {
      const res = await getFnRef.current(patientId, pageSize, null);

      // ignore stale responses
      if (reqId !== reqIdRef.current) return;

      setItems(res.items ?? []);
      setToken(res.continuationToken ?? null);
    } catch (err) {
      if (reqId !== reqIdRef.current) return;
      console.error("getPrescriptionsByPatient failed:", err);
      const message =
        typeof err === "object" && err !== null && "message" in err
          ? String((err as { message?: string }).message)
          : "Failed to load prescriptions";
      setError(message);
      setItems([]);
      setToken(null);
    } finally {
      if (reqId === reqIdRef.current) setLoading(false);
    }
  }, [pageSize, patientId, reset]);

  const loadMore = useCallback(async () => {
    if (!patientId) return;
    if (!token) return;
    if (loadingMore) return;

    const reqId = ++reqIdRef.current;
    setLoadingMore(true);
    setError(null);

    try {
      const res = await getFnRef.current(patientId, pageSize, token);

      if (reqId !== reqIdRef.current) return;

      setItems((prev) => [...prev, ...(res.items ?? [])]);
      setToken(res.continuationToken ?? null);
    } catch (err) {
      if (reqId !== reqIdRef.current) return;
      console.error("loadMore prescriptions failed:", err);
      const message =
        typeof err === "object" && err !== null && "message" in err
          ? String((err as { message?: string }).message)
          : "Failed to load more prescriptions";
      setError(message);
    } finally {
      if (reqId === reqIdRef.current) setLoadingMore(false);
    }
  }, [loadingMore, pageSize, patientId, token]);

  // auto-load whenever patient changes
  useEffect(() => {
    loadFirstPage();
  }, [loadFirstPage]);

  return {
    prescriptions: items,
    prescriptionsLoading: loading,
    prescriptionsLoadingMore: loadingMore,
    prescriptionsError: error,
    hasMore: Boolean(token),
    loadMore,
    reload: loadFirstPage,
    reset,
  };
}
