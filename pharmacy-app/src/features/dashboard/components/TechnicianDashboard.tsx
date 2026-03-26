// src/features/technician/TechnicianDashboard.tsx
import { useEffect } from "react";
import {
  ClipboardList,
  Package,
  CheckCircle,
  AlertTriangle,
  Activity,
  RefreshCw,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import DataTable, { type Column } from "@components/common/Table/Table";
import Button from "@components/common/Button/Button";
import Badge from "@components/common/Badge/Badge";
import PackingListModal from "../../technician/components/PackingListModal";
import { useDispenseQueue } from "../../technician/hooks/useDispenseQueue";
import { ROUTES } from "@constants/routes";
import type { DispenseSummaryDto } from "@api/dispense";

// ── Component ─────────────────────────────────────────────────────────────────

export default function TechnicianDashboard() {
  const navigate = useNavigate();

  const {
    queueData,
    stats,
    isLoading,
    executingId,
    selectedDispense,
    isLoadingDetails,
    handleOpenDetails,
    handleCloseDetails,
    handleExecute,
    refetch,
  } = useDispenseQueue();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, []);

  // ── Table columns ─────────────────────────────────────────────────────────
  // Total width: 160+170+300+185+220 = 1035px
  const columns: Column<DispenseSummaryDto>[] = [
    {
      key: "id",
      header: "Dispense ID",
      sortable: true,
      filterable: true,
      width: 160,
      render: (value) => (
        <span className="font-mono text-sm font-semibold text-blue-600 break-all">
          {String(value)}
        </span>
      ),
    },
    {
      key: "patientId",
      header: "Patient",
      sortable: true,
      filterable: true,
      width: 170,
      render: (value, row) => (
        <div>
          <div className="font-medium text-gray-900 text-sm font-mono">{String(value)}</div>
          <div className="text-xs text-gray-500">Rx: {row.prescriptionId}</div>
        </div>
      ),
    },
    {
      key: "itemCount",
      header: "Items",
      width: 300,
      render: (value, row) => (
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-sm bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200">
            <Package className="w-4 h-4 text-gray-400 shrink-0" />
            <span className="font-semibold text-gray-900">{String(value)}</span>
            <span className="text-gray-500">
              {Number(value) === 1 ? "item" : "items"} to pack
            </span>
          </div>
          <div className="text-xs text-gray-400">
            {new Date(row.dispenseDate).toLocaleDateString("en-US", {
              month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
            })}
          </div>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      filterable: true,
      filterType: "select",
      filterOptions: ["PaymentProcessed"],
      width: 185,
      render: () => (
        <Badge
          label="Payment Processed"
          variant="default"
          className="!bg-blue-50 !text-blue-700 border border-blue-200 !rounded-full"
        />
      ),
    },
    {
      key: "id",
      header: "Actions",
      width: 220,
      render: (_, row) => {
        const isExecuting = executingId === row.id;
        return (
          <div
            className="flex flex-row items-center gap-2"
            onClick={(e) => e.stopPropagation()}
          >
            <Button
              size="sm"
              variant="secondary"
              onClick={() => handleOpenDetails(row)}
              disabled={isLoadingDetails}
              className="!text-blue-600 !bg-white border border-blue-200 hover:!bg-blue-50 whitespace-nowrap"
            >
              View Lots
            </Button>
            <Button
              size="sm"
              variant="primary"
              onClick={() => handleExecute(row)}
              disabled={isExecuting}
              className="!bg-green-600 hover:!bg-green-700 whitespace-nowrap"
            >
              {isExecuting ? "Dispensing…" : "Dispense"}
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Technician Dashboard
          </h1>
          <p className="text-gray-500 mt-1">
            Manage orders and monitor inventory status
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => void refetch()}
          disabled={isLoading}
          className="flex items-center gap-2 !bg-white border border-gray-200"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          {isLoading ? "Loading…" : "Refresh"}
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4">
        <KpiCard
          icon={<ClipboardList className="w-5 h-5 text-blue-600" />}
          iconBg="bg-blue-100"
          value={stats.paymentProcessed}
          label="Pending Dispense"
          sub="Payment processed — awaiting packing"
        />
        <KpiCard
          icon={<CheckCircle className="w-5 h-5 text-green-600" />}
          iconBg="bg-green-100"
          value={stats.dispensedToday}
          label="Dispensed Today"
          sub="Completed"
        />
        <KpiCard
          icon={<Package className="w-5 h-5 text-purple-600" />}
          iconBg="bg-purple-100"
          value={queueData.length}
          label="Queue Length"
          sub="Items to process"
        />
        <KpiCard
          icon={<AlertTriangle className="w-5 h-5 text-orange-600" />}
          iconBg="bg-orange-100"
          value={0}
          label="Inventory Alerts"
          sub="Needs attention"
          clickable
          onClick={() => navigate(ROUTES.TECHNICIAN.INVENTORY)}
        />
      </div>

      {/* Dispense Queue */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="p-5 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-bold text-gray-900 flex items-center gap-2">
                <Activity className="w-5 h-5 text-blue-600" />
                Dispense Queue
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Pack and process prescriptions ready for patient pickup
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                <span className="text-sm font-medium text-blue-700">
                  {stats.paymentProcessed} Pending
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Loading state */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20 text-gray-400">
            <RefreshCw className="w-6 h-6 animate-spin mr-3" />
            <span className="text-sm">Loading queue…</span>
          </div>
        ) : (
          <DataTable
            data={queueData}
            columns={columns}
            searchPlaceholder="Search by Dispense ID, Patient ID…"
            emptyMessage="No orders awaiting dispense"
            height={600}
            pageSize={10}
            pageSizeOptions={[5, 10, 15, 20]}
            exportFileName="dispense-queue"
          />
        )}
      </div>

      {/* Packing List Modal — opens via "View Lots" */}
      <PackingListModal
        isOpen={!!selectedDispense}
        dispense={selectedDispense?.dispense ?? null}
        isLoading={isLoadingDetails}
        onClose={handleCloseDetails}
        onExecute={handleExecute}
      />
    </div>
  );
}

// ── KPI Card ──────────────────────────────────────────────────────────────────

interface KpiCardProps {
  icon: React.ReactNode;
  iconBg: string;
  value: number;
  label: string;
  sub: string;
  clickable?: boolean;
  onClick?: () => void;
}

function KpiCard({ icon, iconBg, value, label, sub, clickable, onClick }: KpiCardProps) {
  return (
    <div
      className={`bg-white rounded-xl border border-gray-200 p-5 shadow-sm ${
        clickable ? "cursor-pointer hover:shadow-md transition-shadow" : ""
      }`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 ${iconBg} rounded-lg flex items-center justify-center`}>
          {icon}
        </div>
        <span className="text-2xl font-bold text-gray-900">{value}</span>
      </div>
      <p className="text-sm font-semibold text-gray-700 mb-1">{label}</p>
      <p className="text-xs text-gray-500">{sub}</p>
    </div>
  );
}
