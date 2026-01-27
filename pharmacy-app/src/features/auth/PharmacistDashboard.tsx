import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import type {
  ColDef,
  ICellRendererParams,
  ValueGetterParams,
} from "ag-grid-community";

import DataGrid from "@components/common/Datagrid/Datagrid";
import Button from "@components/common/Button/Button";

type PrescriptionStatus =
  | "Pending"
  | "In Preparation"
  | "Ready for Pickup"
  | "Approved";

type PrescriptionRow = {
  id: string;
  patient: {
    name: string;
    code: string;
  };
  doctor: string;
  date: {
    day: string;
    time: string;
  };
  status: PrescriptionStatus;
};

export default function PharmacistDashboard() {
  const navigate = useNavigate();

  const rowData: PrescriptionRow[] = [
    {
      id: "RX-2026-001",
      patient: { name: "Sarah Johnson", code: "PT-001" },
      doctor: "Dr. Michael Chen",
      date: { day: "Jan 2", time: "09:30 AM" },
      status: "Pending",
    },
    {
      id: "RX-2026-002",
      patient: { name: "Robert Williams", code: "PT-002" },
      doctor: "Dr. Emily Rodriguez",
      date: { day: "Jan 2", time: "08:15 AM" },
      status: "In Preparation",
    },
    {
      id: "RX-2026-003",
      patient: { name: "Maria Garcia", code: "PT-003" },
      doctor: "Dr. Michael Chen",
      date: { day: "Jan 1", time: "02:20 PM" },
      status: "Ready for Pickup",
    },
    {
      id: "RX-2026-004",
      patient: { name: "James Chen", code: "PT-004" },
      doctor: "Dr. Sarah Martinez",
      date: { day: "Jan 2", time: "10:45 AM" },
      status: "Pending",
    },
    {
      id: "RX-2026-005",
      patient: { name: "Emily Davis", code: "PT-005" },
      doctor: "Dr. Emily Rodriguez",
      date: { day: "Jan 2", time: "07:00 AM" },
      status: "Approved",
    },
  ];

  const columnDefs = useMemo<ColDef<PrescriptionRow>[]>(
    () => [
      {
        headerName: "ID",
        field: "id",
        width: 160,
        filter: "agTextColumnFilter",
      },
      {
        headerName: "Patient",
        field: "patient",
        flex: 1,
        filter: "agTextColumnFilter",
        valueGetter: (params: ValueGetterParams<PrescriptionRow>) =>
          params.data?.patient.name,
        cellRenderer: (
          params: ICellRendererParams<PrescriptionRow>
        ) => (
          <div className="flex flex-col">
            <span className="font-medium text-gray-900">
              {params.data?.patient.name}
            </span>
            <span className="text-xs text-gray-500">
              {params.data?.patient.code}
            </span>
          </div>
        ),
      },
      {
        headerName: "Doctor",
        field: "doctor",
        flex: 1,
        filter: "agTextColumnFilter",
      },
      {
        headerName: "Date",
        field: "date",
        width: 160,
        filter: false,
        cellRenderer: (
          params: ICellRendererParams<PrescriptionRow>
        ) => (
          <div className="flex flex-col">
            <span>{params.data?.date.day}</span>
            <span className="text-xs text-gray-500">
              {params.data?.date.time}
            </span>
          </div>
        ),
      },
      {
        headerName: "Status",
        field: "status",
        width: 190,
        filter: "agSetColumnFilter",
        cellRenderer: (
          params: ICellRendererParams<PrescriptionRow, PrescriptionStatus>
        ) => {
          const styles: Record<PrescriptionStatus, string> = {
            Pending: "bg-yellow-100 text-yellow-800",
            "In Preparation": "bg-blue-100 text-blue-800",
            "Ready for Pickup": "bg-teal-100 text-teal-800",
            Approved: "bg-green-100 text-green-800",
          };

          return (
            <span
              className={`px-3 py-1 rounded-full text-xs font-medium ${
                styles[params.value!]
              }`}
            >
              {params.value}
            </span>
          );
        },
      },
      {
        headerName: "",
        width: 120,
        sortable: false,
        filter: false,
        cellRenderer: (
          params: ICellRendererParams<PrescriptionRow>
        ) => (
          <button
            className="text-sm font-medium text-blue-600 hover:underline"
            onClick={() =>
              navigate(`/pharmacist/validation/${params.data?.id}`)
            }
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
        <div>
          <h1 className="text-xl font-semibold text-gray-900">
            Recent Prescriptions
          </h1>
          <p className="text-sm text-gray-500">
            Latest prescription entries and their status
          </p>
        </div>
        <Button onClick={() => navigate("/pharmacist/entry")}>
          + Add New Prescription
        </Button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200">
        <DataGrid columns={columnDefs} data={rowData} />
      </div>
    </div>
  );
}
