import { useMemo, useState, useEffect } from "react";
import {
  FileText,
  Clock,
  Package,
  AlertTriangle,
  Activity
} from "lucide-react";

import DataTable from "@components/common/Table/Table";
import type { Column } from "@components/common/Table/Table";
import TrendIndicator from "@components/common/TrendIndicator/TrendIndicator";
import Breadcrumbs from "@components/common/BreadCrumps/Breadcrumbs";
import { TableSkeleton } from "@components/common/SkeletonLoader/SkeletonLoader";

/*
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from "recharts";
*/

/* ---------------------------------- */
/* Types */
/* ---------------------------------- */

export type PrescriptionStatus =
  | "Created"
  | "Validated"
  | "Payment Processed"
  | "Dispensed";

export interface Prescription {
  id: string;
  patientName: string;
  patientId: string;
  doctorName: string;
  createdAt: Date;
  status: PrescriptionStatus;
  alerts?: string[];
}

/* ---------------------------------- */
/* Mock Data */
/* ---------------------------------- */

const MOCK_PRESCRIPTIONS: Prescription[] = [
  {
    id: "RX-1001",
    patientName: "Sarah Johnson",
    patientId: "PT-001",
    doctorName: "Dr. Michael Chen",
    createdAt: new Date(),
    status: "Created",
    alerts: []
  },
  {
    id: "RX-1002",
    patientName: "Maria Garcia",
    patientId: "PT-002",
    doctorName: "Dr. Emily Rodriguez",
    createdAt: new Date(Date.now() - 3600000),
    status: "Validated",
    alerts: ["Drug Interaction"]
  },
  {
    id: "RX-1003",
    patientName: "James Chen",
    patientId: "PT-003",
    doctorName: "Dr. Sarah Martinez",
    createdAt: new Date(Date.now() - 7200000),
    status: "Payment Processed",
    alerts: []
  },
  {
    id: "RX-1004",
    patientName: "Robert Williams",
    patientId: "PT-004",
    doctorName: "Dr. Michael Chen",
    createdAt: new Date(Date.now() - 86400000),
    status: "Dispensed",
    alerts: []
  }
];

/* ---------------------------------- */
/* Component */
/* ---------------------------------- */

export default function PharmacistDashboard() {
  const [isLoading, setIsLoading] = useState(true);
  const [prescriptions] = useState<Prescription[]>(MOCK_PRESCRIPTIONS);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  /* ---------------------------------- */
  /* Stats */
  /* ---------------------------------- */

  const today = new Date().toDateString();
  const yesterday = new Date(Date.now() - 86400000).toDateString();

  const stats = {
    pending: prescriptions.filter(p => p.status === "Created").length,
    readyForPickup: prescriptions.filter(
      p => p.status === "Payment Processed"
    ).length,
    alerts: prescriptions.filter(p => p.alerts?.length).length,
    todayTotal: prescriptions.filter(
      p => p.createdAt.toDateString() === today
    ).length
  };

  const yesterdayStats = {
    pending: prescriptions.filter(
      p =>
        p.status === "Created" &&
        p.createdAt.toDateString() === yesterday
    ).length,
    todayTotal: prescriptions.filter(
      p => p.createdAt.toDateString() === yesterday
    ).length
  };

  const trends = {
    pending:
      yesterdayStats.pending > 0
        ? Math.round(
            ((stats.pending - yesterdayStats.pending) /
              yesterdayStats.pending) *
              100
          )
        : 0,

    todayTotal:
      yesterdayStats.todayTotal > 0
        ? Math.round(
            ((stats.todayTotal - yesterdayStats.todayTotal) /
              yesterdayStats.todayTotal) *
              100
          )
        : 0
  };

  /* ---------------------------------- */
  /* Charts */
  /* ---------------------------------- */

  const recentPrescriptions = useMemo(() => {
    return [...prescriptions]
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 10);
  }, [prescriptions]);

  /* ---------------------------------- */
  /* Columns */
  /* ---------------------------------- */

  const columns: Column<Prescription>[] = useMemo(
    () => [
      {
        key: "id",
        header: "Prescription ID",
        sortable: true,
        filterable: true,
        width: 150,
        render: value => (
          <div className="font-semibold text-gray-900">
            {value}
          </div>
        )
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
        key: "doctorName",
        header: "Doctor",
        sortable: true,
        filterable: true
      },
      {
        key: "createdAt",
        header: "Date & Time",
        sortable: true,
        render: value => {
          const d = value as Date;
          return (
            <div>
              <div className="font-medium">
                {d.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric"
                })}
              </div>
              <div className="text-xs text-gray-500">
                {d.toLocaleTimeString("en-US", {
                  hour: "2-digit",
                  minute: "2-digit"
                })}
              </div>
            </div>
          );
        }
      },
      {
        key: "status",
        header: "Status",
        sortable: true,
        filterable: true,
        render: value => {
          const map: Record<string, string> = {
            Created: "bg-yellow-50 text-yellow-700 border-yellow-200",
            Validated: "bg-blue-50 text-blue-700 border-blue-200",
            "Payment Processed":
              "bg-purple-50 text-purple-700 border-purple-200",
            Dispensed:
              "bg-green-50 text-green-700 border-green-200"
          };

          return (
            <span
              className={`px-2.5 py-1 rounded-full border text-xs font-medium ${
                map[value as string]
              }`}
            >
              {value}
            </span>
          );
        }
      }
    ],
    []
  );

  /* ---------------------------------- */

  if (isLoading) {
    return <TableSkeleton rows={10} columns={5} />;
  }

  return (
    <div className="space-y-6">

      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          {
            label: "Dashboard",
            onClick: () => {},
            icon: <Activity className="w-4 h-4" />
          }
        ]}
      />

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">
          Pharmacist Dashboard
        </h1>
        <p className="text-sm text-gray-500">
          Monitor daily activities • {prescriptions.length} total
        </p>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

        <Kpi
          title="Pending Prescriptions"
          value={stats.pending}
          icon={<Clock className="w-5 h-5 text-amber-600" />}
          trend={
            <TrendIndicator value={trends.pending} inverse />
          }
        />

        <Kpi
          title="Ready for Pickup"
          value={stats.readyForPickup}
          icon={<Package className="w-5 h-5 text-green-600" />}
        />

        <Kpi
          title="Active Alerts"
          value={stats.alerts}
          icon={<AlertTriangle className="w-5 h-5 text-red-600" />}
        />

        <Kpi
          title="Today's Prescriptions"
          value={stats.todayTotal}
          icon={<FileText className="w-5 h-5 text-blue-600" />}
          trend={
            <TrendIndicator value={trends.todayTotal} />
          }
        />

      </div>

      {/* Charts (commented out) */}
      {/*
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        <div className="bg-white rounded-xl border p-6">
          <h3 className="font-bold mb-4">
            Weekly Prescription Volume
          </h3>

          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Line
                dataKey="prescriptions"
                stroke="#14b8a6"
                strokeWidth={3}
              />
              <Line
                dataKey="validated"
                stroke="#3b82f6"
                strokeWidth={3}
                strokeDasharray="5 5"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl border p-6">
          <h3 className="font-bold mb-4">
            Status Distribution
          </h3>

          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={statusData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="status" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#14b8a6" />
            </BarChart>
          </ResponsiveContainer>
        </div>

      </div>
      */}

      {/* Table */}
      <div className="bg-white rounded-xl border shadow-sm">

        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-bold">
            Recent Prescriptions
          </h2>
          <p className="text-xs text-gray-500">
            Latest 10 prescription orders
          </p>
        </div>

        <div className="p-4">
          <DataTable
            data={recentPrescriptions}
            columns={columns}
            pageSize={10}
            pageSizeOptions={[5, 10, 20]}
            searchPlaceholder="Search prescriptions..."
            exportFileName="recent-prescriptions"
            height={400}
          />
        </div>

      </div>

    </div>
  );
}

/* ---------------------------------- */
/* KPI Card */
/* ---------------------------------- */

function Kpi({
  title,
  value,
  icon,
  trend
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
        {trend}
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
