// src/features/technician/TechnicianDashboard.tsx
import { useEffect, useState } from "react";
import {
  ClipboardList,
  Package,
  CheckCircle,
  AlertTriangle,
  Activity,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import DataTable, { type Column } from "@components/common/Table/Table";
import Button from "@components/common/Button/Button";
import Badge from "@components/common/Badge/Badge";
import PackingListModal from "./components/PackingListModal";
import { useDispenseQueue } from "./hooks/useDispenseQueue";
import { ROUTES } from "@constants/routes";
import type { DispenseItem, DispenseStatus } from "./technician.types";

// ── Mock data ─────────────────────────────────────────────────────────────────
const MOCK_DISPENSES: DispenseItem[] = [
  {
    id: "RX-20240201-001",
    patientId: "PAT001",
    patientName: "Sarah Johnson",
    medications: [
      { drugName: "Amoxicillin", strength: "500mg", dosage: "1 tablet TID", quantity: 21 },
      { drugName: "Ibuprofen",   strength: "400mg", dosage: "1 tablet PRN", quantity: 10 },
    ],
    status: "Payment Processed",
    createdAt: new Date("2024-02-20T09:15:00"),
  },
  {
    id: "RX-20240201-002",
    patientId: "PAT002",
    patientName: "Michael Chen",
    medications: [
      { drugName: "Lisinopril", strength: "10mg", dosage: "1 tablet OD", quantity: 30 },
    ],
    status: "Ready to Dispense",
    createdAt: new Date("2024-02-20T08:30:00"),
  },
  {
    id: "RX-20240201-003",
    patientId: "PAT003",
    patientName: "Emily Davis",
    medications: [
      { drugName: "Metformin",    strength: "1000mg", dosage: "1 tablet BD", quantity: 60 },
      { drugName: "Atorvastatin", strength: "20mg",   dosage: "1 tablet OD", quantity: 30 },
      { drugName: "Aspirin",      strength: "81mg",   dosage: "1 tablet OD", quantity: 30 },
    ],
    status: "Payment Processed",
    createdAt: new Date("2024-02-20T10:00:00"),
  },
];

// ── Component ─────────────────────────────────────────────────────────────────

export default function TechnicianDashboard() {
  const navigate = useNavigate();

  const [dispenses, setDispenses]                       = useState<DispenseItem[]>(MOCK_DISPENSES);
  const [selectedPrescription, setSelectedPrescription] = useState<DispenseItem | null>(null);
  const [detailsOpen, setDetailsOpen]                   = useState(false);

  const updateStatus = (id: string, status: DispenseStatus) => {
    setDispenses((prev) =>
      prev.map((d) =>
        d.id === id
          ? { ...d, status, ...(status === "Dispensed" ? { dispensedAt: new Date() } : {}) }
          : d
      )
    );
  };

  const { queueData, stats, handleMarkReady, handleMarkDispensed } =
    useDispenseQueue({ items: dispenses, onUpdateStatus: updateStatus });

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, []);

  // ✅ Only called from "View Lots" button — NOT from row click
  const openDetails = (row: DispenseItem) => {
    setSelectedPrescription(row);
    setDetailsOpen(true);
  };

  const closeDetails = () => {
    setDetailsOpen(false);
    setTimeout(() => setSelectedPrescription(null), 200);
  };

  // ── Table columns: 160+170+340+185+220 = 1075px — Dispense Time removed
  const columns: Column<DispenseItem>[] = [
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
      key: "patientName",
      header: "Patient",
      sortable: true,
      filterable: true,
      width: 170,
      render: (value, row) => (
        <div>
          <div className="font-medium text-gray-900 text-sm">{String(value)}</div>
          <div className="text-xs text-gray-500">ID: {row.patientId}</div>
        </div>
      ),
    },
    {
      key: "medications",
      header: "Items",
      width: 340,
      render: (_, row) => (
        <div className="space-y-1">
          {row.medications.slice(0, 3).map((med, idx) => (
            <div key={idx} className="flex items-center gap-1.5 text-sm bg-gray-50 px-2 py-0.5 rounded">
              <span className="font-medium text-gray-900 shrink-0">{med.quantity}x</span>
              <span className="text-gray-700 truncate">{med.drugName}</span>
              <span className="text-gray-400 shrink-0">•</span>
              <span className="font-mono text-xs text-gray-500 shrink-0">
                LOT{String(idx + 1).padStart(3, "0")}-{new Date().getFullYear()}
              </span>
            </div>
          ))}
          {row.medications.length > 3 && (
            <div className="text-xs text-blue-600 font-medium pl-2">
              +{row.medications.length - 3} more
            </div>
          )}
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      filterable: true,
      filterType: "select",
      filterOptions: ["Payment Processed", "Ready to Dispense"],
      width: 185,
      render: (value) => {
        const isReady = value === "Ready to Dispense";
        return (
          <Badge
            label={String(value)}
            variant={isReady ? "success" : "default"}
            className={
              isReady
                ? "!bg-purple-50 !text-purple-700 border border-purple-200 !rounded-full"
                : "!bg-blue-50 !text-blue-700 border border-blue-200 !rounded-full"
            }
          />
        );
      },
    },
    {
      key: "id",
      header: "Actions",
      width: 220,
      render: (_, row) => {
        if (row.status === "Payment Processed") {
          return (
            // h-full + justify-center so the button group is vertically centred in the row
            <div
              className="flex flex-row items-center gap-2"
              onClick={(e) => e.stopPropagation()}
            >
              <Button
                size="sm"
                variant="secondary"
                onClick={() => openDetails(row)}
                className="!text-blue-600 !bg-white border border-blue-200 hover:!bg-blue-50 whitespace-nowrap"
              >
                View Lots
              </Button>
              <Button
                size="sm"
                variant="primary"
                onClick={() => handleMarkReady(row)}
                className="!bg-purple-600 hover:!bg-purple-700 whitespace-nowrap"
              >
                Mark Ready
              </Button>
            </div>
          );
        }
        if (row.status === "Ready to Dispense") {
          return (
            <div
              className="flex flex-row items-center gap-2"
              onClick={(e) => e.stopPropagation()}
            >
              <Button
                size="sm"
                variant="secondary"
                onClick={() => openDetails(row)}
                className="!text-purple-600 !bg-white border border-purple-200 hover:!bg-purple-50 whitespace-nowrap"
              >
                View Lots
              </Button>
              <Button
                size="sm"
                variant="primary"
                onClick={() => handleMarkDispensed(row)}
                className="!bg-green-600 hover:!bg-green-700 whitespace-nowrap"
              >
                Dispense
              </Button>
            </div>
          );
        }
        return null;
      },
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Technician Dashboard</h1>
        <p className="text-gray-500 mt-1">Manage orders and monitor inventory status</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4">
        <KpiCard icon={<ClipboardList className="w-5 h-5 text-blue-600" />}   iconBg="bg-blue-100"   value={stats.pendingDispense} label="Pending Dispense"  sub="Action Required" />
        <KpiCard icon={<Package className="w-5 h-5 text-purple-600" />}       iconBg="bg-purple-100" value={stats.readyToDispense} label="Ready to Dispense" sub="Awaiting Pickup" />
        <KpiCard icon={<CheckCircle className="w-5 h-5 text-green-600" />}    iconBg="bg-green-100"  value={stats.dispensedToday}  label="Dispensed Today"   sub="Completed" />
        <KpiCard icon={<AlertTriangle className="w-5 h-5 text-orange-600" />} iconBg="bg-orange-100" value={5} label="Inventory Alerts" sub="Needs attention" clickable onClick={() => navigate(ROUTES.TECHNICIAN.INVENTORY)} />
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
                Pack and process prescriptions for patient pickup
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                <span className="text-sm font-medium text-blue-700">{stats.pendingDispense} Pending</span>
              </div>
              <div className="bg-purple-50 px-3 py-1.5 rounded-lg border border-purple-200 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-purple-500" />
                <span className="text-sm font-medium text-purple-700">{stats.readyToDispense} Ready</span>
              </div>
            </div>
          </div>
        </div>

        {/* ✅ NO onRowClick — only button clicks trigger actions */}
        <DataTable
          data={queueData}
          columns={columns}
          searchPlaceholder="Search by Dispense ID, Patient Name..."
          emptyMessage="No orders in the queue"
          height={600}
          pageSize={10}
          pageSizeOptions={[5, 10, 15, 20]}
          exportFileName="dispense-queue"
        />
      </div>

      {/* Modal — only opens via "View Lots" button */}
      <PackingListModal
        isOpen={detailsOpen}
        prescription={selectedPrescription}
        onClose={closeDetails}
        onMarkReady={(item) => { handleMarkReady(item); closeDetails(); }}
        onMarkDispensed={(item) => { handleMarkDispensed(item); closeDetails(); }}
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