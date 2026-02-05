import { useCallback, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import type { ColDef, ICellRendererParams, ValueGetterParams } from "ag-grid-community";

import DataGrid from "@components/common/Datagrid/Datagrid";
import Button from "@components/common/Button/Button";

import { useDispatch, useSelector } from "react-redux";
import type { RootState, AppDispatch } from "@store/index";

import { fetchAllPrescriptions, clearPrescriptions } from "@store/prescription/prescriptionSlice";

type PrescriptionStatus = "Created" | "In Preparation" | "Ready for Pickup" | "Approved";

type PrescriptionRow = {
  id: string;
  patient: { name: string; code: string };
  doctor: string;
  date: { day: string; time: string };
  status: PrescriptionStatus;
};

const PAGE_SIZE = 5;
const STATUS_FILTER: PrescriptionStatus = "Created";

function formatDateParts(value?: string | Date | null) {
  if (!value) return { day: "-", time: "-" };
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return { day: "-", time: "-" };

  return {
    day: d.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
    time: d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }),
  };
}

function normalizeStatus(raw: any): PrescriptionStatus {
  const s = String(raw ?? "Created").trim().toLowerCase();
  if (s === "created") return "Created";
  if (s === "in preparation" || s === "inpreparation") return "In Preparation";
  if (s === "ready for pickup" || s === "readyforpickup") return "Ready for Pickup";
  if (s === "approved") return "Approved";
  return "Created";
}

function mapApiPrescriptionToRow(p: any): PrescriptionRow {
  const created = p.createdAt ?? p.issuedAt ?? p.createdOn ?? p.date ?? p.timestamp ?? null;

  return {
    id: p.id ?? p.prescriptionId ?? p.rxId ?? "—",
    patient: {
      name: p.patient?.name ?? p.patient?.fullName ?? p.patientName ?? "Unknown Patient",
      code: p.patient?.code ?? p.patientCode ?? p.patientId ?? "—",
    },
    doctor: p.doctor?.name ?? p.doctorName ?? p.prescriberName ?? p.prescribedBy ?? "—",
    date: formatDateParts(created),
    status: normalizeStatus(p.status),
  };
}

export default function PharmacistDashboard() {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();

  const { items, continuationToken, status, error } = useSelector((s: RootState) => s.prescriptions);

  const isLoading = status === "loading";
  const hasNext = !!continuationToken;

  // Helps prevent rapid double “next” clicks triggering parallel requests
  const loadingNextRef = useRef(false);

  /** ✅ Initial fetch */
  useEffect(() => {
    dispatch(clearPrescriptions());
    dispatch(
      fetchAllPrescriptions({
        status: STATUS_FILTER,           // "Created"
        pageSize: PAGE_SIZE,             // 5
        continuationToken: null,
        reset: true,                     // replace initial
      })
    );
  }, [dispatch]);

  /** ✅ Accumulated rows */
  const rowData: PrescriptionRow[] = useMemo(() => {
    return (items ?? []).map(mapApiPrescriptionToRow);
    // If backend already filters by status, no need to filter again.
    // If you want safety, uncomment:
    // .filter((r) => r.status === STATUS_FILTER);
  }, [items]);

  /** ✅ Refresh (reset list) */
  const onRefresh = useCallback(() => {
    dispatch(
      fetchAllPrescriptions({
        status: STATUS_FILTER,
        pageSize: PAGE_SIZE,
        continuationToken: null,
        reset: true,
      })
    );
  }, [dispatch]);

  /** ✅ Load next page (append) */
  const onLoadNext = useCallback(async () => {
    if (!continuationToken || isLoading || loadingNextRef.current) return;

    loadingNextRef.current = true;
    try {
      await dispatch(
        fetchAllPrescriptions({
          status: STATUS_FILTER,
          pageSize: PAGE_SIZE,
          continuationToken,
          reset: false, // ⭐ MUST be false to append
        })
      ).unwrap();
    } finally {
      loadingNextRef.current = false;
    }
  }, [dispatch, continuationToken, isLoading]);

  const columnDefs = useMemo<ColDef<PrescriptionRow>[]>(
    () => [
      { headerName: "ID", field: "id", width: 160, filter: "agTextColumnFilter" },
      {
        headerName: "Patient",
        field: "patient",
        flex: 1,
        filter: "agTextColumnFilter",
        valueGetter: (params: ValueGetterParams<PrescriptionRow>) => params.data?.patient.name,
        cellRenderer: (params: ICellRendererParams<PrescriptionRow>) => (
          <div className="flex flex-col">
            <span className="font-medium text-gray-900">{params.data?.patient.name}</span>
            {/* <span className="text-xs text-gray-500">{params.data?.patient.code}</span> */}
          </div>
        ),
      },
      { headerName: "Doctor", field: "doctor", flex: 1, filter: "agTextColumnFilter" },
      {
        headerName: "Date",
        field: "date",
        width: 160,
        filter: false,
        cellRenderer: (params: ICellRendererParams<PrescriptionRow>) => (
          <div className="flex flex-col">
            <span>{params.data?.date.day}</span>
            {/* <span className="text-xs text-gray-500">{params.data?.date.time}</span> */}
          </div>
        ),
      },
      {
        headerName: "Status",
        field: "status",
        width: 190,
        filter: "agSetColumnFilter",
        cellRenderer: (params: ICellRendererParams<PrescriptionRow, PrescriptionStatus>) => {
          const styles: Record<PrescriptionStatus, string> = {
            Created: "bg-yellow-100 text-yellow-800",
            "In Preparation": "bg-blue-100 text-blue-800",
            "Ready for Pickup": "bg-teal-100 text-teal-800",
            Approved: "bg-green-100 text-green-800",
          };
          const val = params.value ?? "Created";
          return (
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${styles[val]}`}>
              {val}
            </span>
          );
        },
      },
      {
        headerName: "",
        width: 120,
        sortable: false,
        filter: false,
        cellRenderer: (params: ICellRendererParams<PrescriptionRow>) => (
          <button
            className="text-sm font-medium text-blue-600 hover:underline"
            onClick={() => navigate(`/pharmacist/validation/${params.data?.id}`)}
          >
            View
          </button>
        ),
      },
    ],
    [navigate]
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-2">
  <h1 className="text-xl font-semibold text-gray-900">New Prescriptions</h1>
</div>

<p className="mt-1 text-sm text-gray-500">
  Review newly created prescriptions and validate them.
</p>

        <div className="flex gap-2">
          <Button onClick={onRefresh} disabled={isLoading}>
            {isLoading ? "Refreshing..." : "Refresh"}
          </Button>

          <Button onClick={() => navigate("/pharmacist/entry")}>
            + Add New Prescription
          </Button>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
  <div className="p-4">
    <DataGrid columns={columnDefs} data={rowData} />
  </div>
</div>

      <div className="flex justify-end gap-2">
        <Button onClick={onLoadNext} disabled={!hasNext || isLoading}>
          {!hasNext ? "No More" : isLoading ? "Loading..." : "Next 5"}
        </Button>
      </div>
    </div>
  );
}

