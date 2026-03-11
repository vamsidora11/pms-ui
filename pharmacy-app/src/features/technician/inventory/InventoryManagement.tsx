// src/features/technician/inventory/InventoryManagement.tsx
import { useEffect, useMemo, useState } from "react";
import {
  Package,
  TrendingDown,
  Calendar,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  Archive,
  AlertTriangle,
  Search,
  Plus,
} from "lucide-react";

import DataTable, { type Column } from "@components/common/Table/Table";
import Modal from "@components/common/Modal/Modal";
import Button from "@components/common/Button/Button";
import InventoryStockList from "../components/InventoryStockList";
import { useInventoryItems } from "../hooks/useInventoryItems";
import { useRestockRequests } from "../hooks/useRestockRequests";
import type { InventoryItem } from "../technician.types";
import type { InventoryLotDto } from "@api/inventory";

// ── Tab definition ────────────────────────────────────────────────────────────

type TabKey = "stock" | "expiry" | "requests";

const TABS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  { key: "stock",    label: "Stock Levels",     icon: <Package className="w-4 h-4" /> },
  { key: "expiry",   label: "Expiry Tracking",  icon: <Calendar className="w-4 h-4" /> },
  { key: "requests", label: "Restock Requests", icon: <FileText className="w-4 h-4" /> },
];

// ── Component ─────────────────────────────────────────────────────────────────

export default function InventoryManagement() {

  const [activeTab, setActiveTab]     = useState<TabKey>("stock");
  const [searchQuery, setSearchQuery] = useState("");
  // ── Dispose confirmation modal state ──────────────────────────────────────
  const [itemToDispose, setItemToDispose] = useState<InventoryItem | null>(null);


  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, []);

  // ── Hooks ──────────────────────────────────────────────────────────────────
  const {
    medicineGroups,
    expiryData,
    inventoryStats,
    isLoading,
    expandedMedicines,
    toggleExpand,
    handleDispose,
  } = useInventoryItems();

  const {
    submittedLots,
    selectedItem,
    isDialogOpen,
    form,
    setForm,
    isSubmitting,
    pendingRequestsCount,
    openRestockDialog,
    closeRestockDialog,
    handleCreateRequest,
  } = useRestockRequests();

  // ── Filtered groups ────────────────────────────────────────────────────────
  const filteredGroups = useMemo(() => {
    if (!searchQuery) return medicineGroups;
    const q = searchQuery.toLowerCase();
    return medicineGroups.filter(
      (g) =>
        g.drugName.toLowerCase().includes(q) ||
        g.category.toLowerCase().includes(q) ||
        g.strength.toLowerCase().includes(q) ||
        g.lots.some((l: import("../technician.types").InventoryItem) => l.batchNumber.toLowerCase().includes(q))
    );
  }, [medicineGroups, searchQuery]);

  // ── Expiry table columns ───────────────────────────────────────────────────
  const expiryColumns = useMemo((): Column<InventoryItem>[] => [
    {
      key: "drugName",
      header: "Drug Name",
      sortable: true,
      filterable: true,
      filterType: "text" as const,
      width: 180,
      render: (value, row) => (
        <div>
          <p className="font-semibold text-gray-900">{String(value)}</p>
          <p className="text-xs text-gray-500 mt-0.5">{row.batchNumber}</p>
        </div>
      ),
    },
    {
      key: "strength",
      header: "Strength",
      width: 100,
      render: (value) => <span className="text-gray-700">{String(value)}</span>,
    },
    {
      key: "currentStock",
      header: "Stock",
      sortable: true,
      width: 110,
      render: (value) => (
        <span className="font-semibold text-gray-900">{String(value)} units</span>
      ),
    },
    {
      key: "expiryDate",
      header: "Expiry Date",
      sortable: true,
      width: 140,
      render: (value) => {
        const days = Math.floor(
          (new Date(String(value)).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        );
        return (
          <div>
            <p className="font-medium text-gray-900">{String(value)}</p>
            <p className={`text-xs mt-0.5 ${
              days < 0 ? "text-red-600 font-bold" :
              days <= 30 ? "text-red-600" :
              days <= 90 ? "text-orange-600" : "text-gray-500"
            }`}>
              {days < 0 ? "Expired" : `${days} days left`}
            </p>
          </div>
        );
      },
    },
    {
      key: "supplier",
      header: "Supplier",
      filterable: true,
      filterType: "text" as const,
      width: 150,
      render: (value) => <span className="text-gray-700">{String(value)}</span>,
    },
    {
      key: "id",
      header: "Actions",
      width: 120,
      render: (_, row) => {
        const isExpired = new Date(row.expiryDate) < new Date();
        if (!isExpired) return null;
        return (
          <div onClick={(e) => e.stopPropagation()}>
            <Button
              variant="danger"
              size="sm"
              onClick={() => setItemToDispose(row)}
            >
              <Archive className="w-3 h-3 mr-1" />
              Dispose
            </Button>
          </div>
        );
      },
    },
  ], [handleDispose, expiryData]);

  // ── Restock requests table columns ────────────────────────────────────────
  const requestColumns = useMemo((): Column<InventoryLotDto>[] => [
    {
      key: "productId",
      header: "Product",
      sortable: true,
      filterable: true,
      filterType: "text" as const,
      width: 200,
      render: (value, row) => (
        <div>
          <p className="font-semibold text-gray-900 font-mono text-sm">{String(value)}</p>
          <p className="text-xs text-gray-500 mt-0.5">Lot: {row.lotNumber}</p>
        </div>
      ),
    },
    {
      key: "requestedQuantity",
      header: "Qty Requested",
      sortable: true,
      width: 130,
      render: (value) => (
        <span className="font-semibold text-gray-900">{String(value)} units</span>
      ),
    },
    {
      key: "quantityAvailable",
      header: "Approved Qty",
      sortable: true,
      width: 130,
      render: (value, row) => {
        if (row.status !== "Approved") return <span className="text-gray-400 text-sm">—</span>;
        return <span className="font-semibold text-green-600">{String(value)} units</span>;
      },
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      filterable: true,
      filterType: "select",
      filterOptions: ["Pending", "Approved", "Rejected", "Depleted"],
      width: 130,
      render: (value) => {
        const map: Record<string, { cls: string; icon: React.ReactNode }> = {
          Pending:  { cls: "bg-yellow-50 text-yellow-700 border-yellow-200", icon: <Clock className="w-3 h-3" /> },
          Approved: { cls: "bg-green-50 text-green-700 border-green-200",   icon: <CheckCircle className="w-3 h-3" /> },
          Rejected: { cls: "bg-red-50 text-red-700 border-red-200",         icon: <XCircle className="w-3 h-3" /> },
          Depleted: { cls: "bg-blue-50 text-blue-700 border-blue-200",      icon: <Archive className="w-3 h-3" /> },
        };
        const cfg = map[String(value)] ?? map["Pending"];
        return (
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-semibold ${cfg.cls}`}>
            {cfg.icon}
            {String(value)}
          </span>
        );
      },
    },
    {
      key: "workflow",
      header: "Requested By",
      width: 160,
      render: (value) => {
        const wf = value as import("@api/inventory").InventoryWorkflowDto;
        return (
          <div>
            <p className="text-sm text-gray-900">{wf.requestedBy}</p>
            <p className="text-xs text-gray-500 mt-0.5">
              {new Date(wf.requestedAt).toLocaleDateString()}
            </p>
          </div>
        );
      },
    },
  ], [submittedLots]);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Inventory Management</h1>
        <p className="text-sm text-gray-500 mt-1">
          Track medicine stock levels, expiry dates, and restock requests
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard
          icon={<Package className="w-5 h-5 text-teal-600" />}
          iconBg="bg-teal-100"
          value={inventoryStats.totalItems}
          label="Total Medicines"
          sub="In inventory"
        />
        <StatCard
          icon={<TrendingDown className="w-5 h-5 text-orange-600" />}
          iconBg="bg-orange-100"
          value={inventoryStats.lowStock}
          label="Low Stock"
          sub="Needs attention"
        />
        <ExpiryCard
          icon={<Calendar className="w-5 h-5 text-yellow-600" />}
          iconBg="bg-yellow-100"
          lots={inventoryStats.expiringLots}
          medicines={inventoryStats.expiringMedicines}
        />
        <StatCard
          icon={<FileText className="w-5 h-5 text-blue-600" />}
          iconBg="bg-blue-100"
          value={pendingRequestsCount}
          label="Pending Requests"
          sub="Awaiting approval"
        />
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        {/* Tab bar */}
        <div className="border-b border-gray-200">
          <nav className="flex gap-8 px-6">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`py-4 border-b-2 font-medium text-sm transition-colors flex items-center gap-2 ${
                  activeTab === tab.key
                    ? "border-teal-600 text-teal-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* Stock Levels tab */}
          {activeTab === "stock" && (
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by medicine name, category, lot number…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>
              <InventoryStockList
                groups={filteredGroups}
                expandedMedicines={expandedMedicines}
                isLoading={isLoading}
                onToggleExpand={toggleExpand}
                onRequestRestock={openRestockDialog}
              />
            </div>
          )}

          {/* Expiry Tracking tab */}
          {activeTab === "expiry" && (
            <DataTable
              data={expiryData}
              columns={expiryColumns}
              pageSize={15}
              pageSizeOptions={[10, 15, 25, 50]}
              searchPlaceholder="Search expiring items…"
              exportFileName="inventory-expiry-tracking"
              height={600}
            />
          )}

          {/* Restock Requests tab */}
          {activeTab === "requests" && (
            <DataTable
              data={submittedLots}
              columns={requestColumns}
              pageSize={15}
              pageSizeOptions={[10, 15, 25, 50]}
              searchPlaceholder="Search requests…"
              exportFileName="restock-requests"
              height={600}
            />
          )}
        </div>
      </div>

      {/* ── Dispose Confirmation Modal ─────────────────────────────────────── */}
      <Modal
        isOpen={!!itemToDispose}
        onClose={() => setItemToDispose(null)}
        className="w-full max-w-sm flex flex-col overflow-hidden !p-0 rounded-xl"
      >
        {itemToDispose && (
          <>
            {/* Header */}
            <div className="flex items-center gap-3 px-6 pt-5 pb-4 border-b border-gray-100">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h2 className="text-base font-bold text-gray-900">Dispose Item</h2>
                <p className="text-sm text-gray-500 mt-0.5">This action cannot be undone</p>
              </div>
            </div>

            {/* Body */}
            <div className="px-6 py-4 space-y-3">
              <p className="text-sm text-gray-700">
                Are you sure you want to dispose{" "}
                <span className="font-semibold text-gray-900">{itemToDispose.drugName}</span>?
              </p>
              <div className="bg-gray-50 rounded-lg p-3 space-y-1.5 text-sm">
                {[
                  ["Batch Number", itemToDispose.batchNumber],
                  ["Strength",     itemToDispose.strength],
                  ["Stock",        `${itemToDispose.currentStock} units`],
                  ["Expired On",   itemToDispose.expiryDate],
                ].map(([label, val]) => (
                  <div key={label} className="flex justify-between">
                    <span className="text-gray-500">{label}:</span>
                    <span className="font-medium text-gray-900">{val}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-white">
              <Button
                variant="secondary"
                size="md"
                onClick={() => setItemToDispose(null)}
                className="!bg-white border border-gray-200 !text-gray-700 hover:!bg-gray-50"
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="md"
                onClick={() => {
                  handleDispose(itemToDispose);
                  setItemToDispose(null);
                }}
                className="flex items-center gap-2"
              >
                <Archive className="w-4 h-4" />
                Dispose
              </Button>
            </div>
          </>
        )}
      </Modal>

      {/* Restock Request Modal */}
      <Modal
        isOpen={isDialogOpen}
        onClose={closeRestockDialog}
        className="w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden !p-0 rounded-xl"
      >
        {selectedItem && (
          <>
            {/* ── Pinned Header ── */}
            <div className="px-6 pt-5 pb-3 border-b border-gray-100 flex-shrink-0">
              <h2 className="text-lg font-bold text-gray-900">Create Restock Request</h2>
              <p className="text-sm text-gray-500 mt-0.5">
                Submit a request to restock{" "}
                <span className="font-semibold text-gray-800">{selectedItem.drugName}</span>
              </p>
            </div>

            {/* ── Scrollable Body ── */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">

              {/* Item summary — no Maximum Stock */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                {[
                  ["Lot Number",    selectedItem.batchNumber],
                  ["Current Stock", `${selectedItem.currentStock} units`],
                  ["Minimum Stock", `${selectedItem.minStock} units`],
                ].map(([label, val]) => (
                  <div key={label} className="flex justify-between">
                    <span className="text-gray-500">{label}:</span>
                    <span className="font-semibold text-gray-900">{val}</span>
                  </div>
                ))}
              </div>

              {/* Quantity */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Requested Quantity <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={form.quantity}
                  onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                  placeholder="Enter quantity"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              {/* Priority */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Priority <span className="text-red-500">*</span>
                </label>
                <select
                  value={form.priority}
                  onChange={(e) =>
                    setForm({ ...form, priority: e.target.value as typeof form.priority })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  {(["Low", "Medium", "High", "Critical"] as const).map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>

              {/* Reason */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Reason <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={form.reason}
                  onChange={(e) => setForm({ ...form, reason: e.target.value })}
                  placeholder="Explain why this restock is needed…"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
                />
              </div>
            </div>

            {/* ── Pinned Footer ── */}
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 flex-shrink-0 bg-white">
              <Button variant="secondary" onClick={closeRestockDialog}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleCreateRequest}
                disabled={isSubmitting}
                className="flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                {isSubmitting ? "Submitting…" : "Create Request"}
              </Button>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
}

// ── Stat Card ─────────────────────────────────────────────────────────────────

interface StatCardProps {
  icon: React.ReactNode;
  iconBg: string;
  value: number;
  label: string;
  sub: string;
}

function StatCard({ icon, iconBg, value, label, sub }: StatCardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
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

// ── Expiry Card — shows lots count as main number + medicines count as sub ────

interface ExpiryCardProps {
  icon: React.ReactNode;
  iconBg: string;
  lots: number;
  medicines: number;
}

function ExpiryCard({ icon, iconBg, lots, medicines }: ExpiryCardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 ${iconBg} rounded-lg flex items-center justify-center`}>
          {icon}
        </div>
        {/* Main number: lot count */}
        <span className="text-2xl font-bold text-gray-900">{lots}</span>
      </div>
      <p className="text-sm font-semibold text-gray-700 mb-1">Expiring Soon</p>
      {/* Sub-text: both pieces of info in one line */}
      <p className="text-xs text-gray-500">
        {lots === 0
          ? "No lots expiring within 90 days"
          : `${lots} lot${lots !== 1 ? "s" : ""} across ${medicines} medicine${medicines !== 1 ? "s" : ""}`}
      </p>
    </div>
  );
}