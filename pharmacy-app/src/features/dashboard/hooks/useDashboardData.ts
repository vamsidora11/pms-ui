// hooks/useDashboardData.ts
import { useSelector } from "react-redux";
import type { RootState } from "@store/index";
import type { PrescriptionSummary } from "@prescription/domain/model";

interface UseDashboardDataResult {
  prescriptions: PrescriptionSummary[];
  requestStatus: "idle" | "loading" | "succeeded" | "failed";
  totalCount: number;
  pageNumber: number;
  pageSize: number;
}

interface UseDashboardDataParams {
  pageSize?: number;
}

export function useDashboardData(
  params: UseDashboardDataParams = {}
): UseDashboardDataResult {
  const { pageSize = 10 } = params;

  // Access items from Redux state (not prescriptions)
  const prescriptions = useSelector(
    (state: RootState) => state.prescriptions.items || []
  );
  const requestStatus = useSelector(
    (state: RootState) => state.prescriptions.status || "idle"
  );
  const totalCount = useSelector(
    (state: RootState) => state.prescriptions.totalCount || 0
  );
  const currentPageNumber = useSelector(
    (state: RootState) => state.prescriptions.pageNumber || 1
  );
  const currentPageSize = useSelector(
    (state: RootState) => state.prescriptions.pageSize || pageSize
  );

  return {
    prescriptions,
    requestStatus,
    totalCount,
    pageNumber: currentPageNumber,
    pageSize: currentPageSize,
  };
}
