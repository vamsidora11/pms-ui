import { useCallback, useEffect, useRef, useState } from "react";

type PageResult<T> = {
  items: T[];
  pageNumber: number;
  totalPages: number;
};

export type GetPrescriptionsByPatientFn<T> = (
  patientId: string,
  pageNumber?: number,
  pageSize?: number
) => Promise<PageResult<T>>;

export function usePatientPrescriptions<T>(
  getPrescriptionsByPatient: GetPrescriptionsByPatientFn<T>,
  patientId: string | null | undefined,
  pageSize = 10
) {
  const [items, setItems] = useState<T[]>([]);
  const [pageNumber, setPageNumber] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reqIdRef = useRef(0);
  const getFnRef = useRef(getPrescriptionsByPatient);

  useEffect(() => {
    getFnRef.current = getPrescriptionsByPatient;
  }, [getPrescriptionsByPatient]);

  const reset = useCallback(() => {
    setItems([]);
    setPageNumber(1);
    setTotalPages(1);
    setLoading(false);
    setLoadingMore(false);
    setError(null);
  }, []);

  const loadPage = useCallback(
    async (nextPageNumber: number, append: boolean) => {
      if (!patientId) {
        reset();
        return;
      }

      const reqId = ++reqIdRef.current;

      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }
      setError(null);

      try {
        const res = await getFnRef.current(patientId, nextPageNumber, pageSize);
        if (reqId !== reqIdRef.current) {
          return;
        }

        setItems((prev) => (append ? [...prev, ...(res.items ?? [])] : res.items ?? []));
        setPageNumber(res.pageNumber ?? nextPageNumber);
        setTotalPages(res.totalPages ?? nextPageNumber);
      } catch (err) {
        if (reqId !== reqIdRef.current) {
          return;
        }
        const message =
          typeof err === "object" && err !== null && "message" in err
            ? String((err as { message?: string }).message)
            : "Failed to load prescriptions";
        setError(message);
        if (!append) {
          setItems([]);
          setPageNumber(1);
          setTotalPages(1);
        }
      } finally {
        if (reqId === reqIdRef.current) {
          if (append) {
            setLoadingMore(false);
          } else {
            setLoading(false);
          }
        }
      }
    },
    [pageSize, patientId, reset]
  );

  const loadFirstPage = useCallback(async () => {
    await loadPage(1, false);
  }, [loadPage]);

  const loadMore = useCallback(async () => {
    if (!patientId) {
      return;
    }
    if (loadingMore) {
      return;
    }
    if (pageNumber >= totalPages) {
      return;
    }

    await loadPage(pageNumber + 1, true);
  }, [loadPage, loadingMore, pageNumber, patientId, totalPages]);

  useEffect(() => {
    void loadFirstPage();
  }, [loadFirstPage]);

  return {
    prescriptions: items,
    prescriptionsLoading: loading,
    prescriptionsLoadingMore: loadingMore,
    prescriptionsError: error,
    hasMore: pageNumber < totalPages,
    loadMore,
    reload: loadFirstPage,
    reset,
  };
}
