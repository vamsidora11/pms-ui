// PharmacistDashboard.tsx
import { useMemo, useEffect } from "react";
import { useDispatch } from "react-redux";
import {
  FileText,
  Clock,
  Package,

} from "lucide-react";

import DataTable from "@components/common/Table/Table";
import type { Column } from "@components/common/Table/Table";
import TrendIndicator from "@components/common/TrendIndicator/TrendIndicator";

import { formatDateTime, statusStyle } from "@prescription/utils/prescriptionHistoryUtils";
import type { AppDispatch } from "store";
import type { PrescriptionSummary } from "@prescription/domain/model";

import { fetchAllPrescriptions } from "@store/prescription/prescriptionSlice";
import { useDashboardData } from "@auth/hooks/useDashboardData";
import  { isSameDay } from "@auth/utils/Pharmacistdashboardutils"; 

/* ---------------------------------- */
/* Component */
/* ---------------------------------- */

export default function PharmacistDashboard() {
  const dispatch = useDispatch<AppDispatch>();

  const {
    prescriptions: allPrescriptions,
    requestStatus,
  } = useDashboardData({ pageSize: 10 });

  /* ---------------------------------- */
  /* Filter Today's Prescriptions */
  /* ---------------------------------- */

  const todaysPrescriptions = useMemo(() => {
    const today = new Date();
    return allPrescriptions.filter(p => isSameDay(p.createdAt, today));
  }, [allPrescriptions]);

  /* ---------------------------------- */
  /* Stats Calculation */
  /* ---------------------------------- */

  const stats = useMemo(() => ({
    pending: todaysPrescriptions.filter(p => p.status === "Created").length,
    readyForPickup: todaysPrescriptions.filter(
      p => p.status === "Active"
    ).length,
    todayTotal: todaysPrescriptions.length
  }), [todaysPrescriptions]);

  const trends = {
    pending: 0,
    todayTotal: 0
  };

  /* ---------------------------------- */
  /* Initial Data Fetch */
  /* ---------------------------------- */

  useEffect(() => {
    // Fetch all recent prescriptions without date filter
    // The backend will return recent ones and we filter client-side
    dispatch(
      fetchAllPrescriptions({
        pageNumber: 1,
        pageSize: 10,
        sortBy: "createdAt",
        sortDirection: "desc",
      })
    );
  }, [dispatch]);

  /* ---------------------------------- */
  /* Table Columns */
  /* ---------------------------------- */

  const columns: Column<PrescriptionSummary>[] = useMemo(
    () => [
      {
        key: "id",
        header: "Prescription ID",
        sortable: true,
        filterable: true,
        width: 150,
        render: value => {
          const display =
            typeof value === "string" || typeof value === "number" ? String(value) : "";
          return <div className="font-semibold text-gray-900">{display}</div>;
        }
      },
      {
        key: "patientName",
        header: "Patient",
        sortable: true,
        filterable: true,
        width: 180,
        render: (_, row) => (
          <div>
            <div className="font-medium text-gray-900">
              {row.patientName}
            </div>
            <div className="text-xs text-gray-500">
              {row.patientId}
            </div>
          </div>
        )
      },
      {
        key: "prescriberName",
        header: "Doctor",
        sortable: true,
        filterable: true
      },
      {
        key: "createdAt",
        header: "Date & Time",
        sortable: true,
        width: 180,
        render: (v) => {
          const { date, time } = formatDateTime(v as Date);
          return (
            <div>
              <div className="font-medium">{date}</div>
              <div className="text-xs text-gray-500">{time}</div>
            </div>
          );
        },
      },
      {
        key: "status",
        header: "Status",
        sortable: true,
        filterable: true,
        filterType: "select",
        filterOptions: [
          { label: "Created", value: "Created" },
          { label: "Active", value: "Active" },
          { label: "Completed", value: "Completed" },
          { label: "Cancelled", value: "Cancelled" },
        ],
        render: value => {
          const statusValue = String(value);
          return (
            <span
              className={`px-2.5 py-1 rounded-full border text-xs font-medium ${statusStyle(statusValue)}`}
            >
              {statusValue}
            </span>
          );
        }
      }
    ],
    []
  );

  /* ---------------------------------- */
  /* Render */
  /* ---------------------------------- */

  return (
    <div className="space-y-6">

      

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">
          Pharmacist Dashboard
        </h1>
        <p className="text-sm text-gray-500">
          Monitor today's activities • {stats.todayTotal} total prescriptions
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

        <Kpi
          title="Pending Prescriptions"
          value={stats.pending}
          icon={<Clock className="w-5 h-5 text-amber-600" />}
          trend={<TrendIndicator value={trends.pending} inverse />}
        />

        <Kpi
          title="Ready for Pickup"
          value={stats.readyForPickup}
          icon={<Package className="w-5 h-5 text-green-600" />}
        />

      

        <Kpi
          title="Today's Prescriptions"
          value={stats.todayTotal}
          icon={<FileText className="w-5 h-5 text-blue-600" />}
          trend={<TrendIndicator value={trends.todayTotal} />}
        />

      </div>

      {/* Prescriptions Table */}
      <div className="bg-white rounded-xl border shadow-sm">

        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-bold">
            Today's Prescriptions
          </h2>
          <p className="text-xs text-gray-500">
            {stats.todayTotal > 0 
              ? `${stats.todayTotal} prescriptions created today`
              : "No prescriptions created today"}
          </p>
        </div>

        <div className="p-4">
          {requestStatus === "loading" ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-gray-500">Loading...</div>
            </div>
          ) : stats.todayTotal === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <FileText className="w-16 h-16 text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No Prescriptions Today
              </h3>
              <p className="text-sm text-gray-500">
                There are no prescriptions created today yet.
              </p>
            </div>
          ) : (
            <DataTable
              data={todaysPrescriptions}
              columns={columns}
              pageSize={10}
              pageSizeOptions={[5, 10, 20]}
              searchPlaceholder="Search prescriptions..."
              exportFileName="today-prescriptions"
              height={400}
            />
          )}
        </div>

      </div>

    </div>
  );
}

/* ---------------------------------- */
/* KPI Card Component */
/* ---------------------------------- */

function Kpi({
  title,
  value,
  icon,
  
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  trend?: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-xl border p-5 shadow-sm hover:shadow-lg transition-all">
      <div className="flex justify-between mb-3">
        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
          {icon}
        </div>
        
      </div>

      <div className="text-2xl font-bold">
        {value}
      </div>

      <div className="text-sm text-gray-600">
        {title}
      </div>
    </div>
  );
}
