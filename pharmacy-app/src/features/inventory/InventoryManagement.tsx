import { useEffect, useMemo, useState } from "react";
import { Package, Calendar, FileText, Clock, Archive, AlertTriangle } from "lucide-react";
import DataTable, { type Column } from "@components/common/Table/Table";
import Modal from "@components/common/Modal/Modal";
import Button from "@components/common/Button/Button";
import InventoryStockDataGrid from "@inventory/components/InventoryStockDataGrid";
import { useInventoryProducts } from "@inventory/hooks/useInventoryProducts";
import { useRestockRequests } from "@inventory/hooks/useRestockRequests";
import type { InventoryItem } from "@inventory/types/inventory.types";
import type { InventoryLotDto, InventoryWorkflowDto } from "@api/inventory";

type TabKey = "stock" | "expiry" | "requests";

const TABS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  { key: "stock",    label: "Stock Levels",     icon: <Package className="w-4 h-4" /> },
  { key: "expiry",   label: "Expiry Tracking",  icon: <Calendar className="w-4 h-4" /> },
  { key: "requests", label: "Restock Requests", icon: <FileText className="w-4 h-4" /> },
];

export default function InventoryManagement() {
  const [activeTab, setActiveTab]       = useState<TabKey>("stock");
  const [itemToDispose, setItemToDispose] = useState<InventoryItem | null>(null);

  useEffect(() => { window.scrollTo({ top: 0, behavior: "auto" }); }, []);

  const {
    stockRows, expiryData, inventoryStats, productDetailsById,
    totalCount, isLoading, tableQuery, handleServerQueryChange, handleDispose,
  } = useInventoryProducts();

  const {
    restockRequests, selectedProduct, isDialogOpen, form, setForm,
    isLoadingRequests, isSubmitting, pendingRequestsCount,
    openRestockDialog, closeRestockDialog, handleCreateRequest,
  } = useRestockRequests();

  const expiryColumns = useMemo((): Column<InventoryItem>[] => [
    {
      key: "drugName", header: "Drug Name", sortable: true, filterable: true,
      filterType: "text" as const, width: 180,
      render: (value, row) => (
        <div>
          <p className="font-semibold text-gray-900">{String(value)}</p>
          <p className="text-xs text-gray-500 mt-0.5">{row.batchNumber}</p>
        </div>
      ),
    },
    {
      key: "strength", header: "Strength", width: 100,
      render: (value) => <span className="text-gray-700">{String(value)}</span>,
    },
    {
      key: "currentStock", header: "Stock", sortable: true, width: 110,
      render: (value) => <span className="font-semibold text-gray-900">{String(value)} units</span>,
    },
    {
      key: "expiryDate", header: "Expiry Date", sortable: true, width: 140,
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
      key: "supplier", header: "Supplier", filterable: true,
      filterType: "text" as const, width: 150,
      render: (value) => <span className="text-gray-700">{String(value)}</span>,
    },
    {
      key: "id", header: "Actions", width: 120,
      render: (_, row) => {
        const isExpired = new Date(row.expiryDate) < new Date();
        if (!isExpired) return null;
        return (
          <div onClick={(e) => e.stopPropagation()}>
            <Button variant="danger" size="sm" onClick={() => setItemToDispose(row)}>
              <Archive className="w-3 h-3 mr-1" />
              Dispose
            </Button>
          </div>
        );
      },
    },
  ], []);

  const requestColumns = useMemo((): Column<InventoryLotDto>[] => [
    {
      key: "productId", header: "Product", sortable: true, filterable: true,
      filterType: "text" as const, width: 200,
      render: (value, row) => {
        const product     = productDetailsById[row.productId];
        const productName = product?.name || row.productName || String(value);
        const details     = [product?.strength, product?.form].filter(Boolean).join(" | ");
        return (
          <div>
            <p className="font-semibold text-gray-900 text-sm">{productName}</p>
            <p className="text-xs text-gray-500 mt-0.5">{details || "Product details unavailable"}</p>
            <p className="text-xs text-gray-400 mt-0.5 font-mono">{String(value)}</p>
          </div>
        );
      },
    },
    {
      key: "workflow", header: "Requested On", sortable: true, width: 140,
      render: (value) => {
        const workflow = value as InventoryWorkflowDto;
        return <span className="text-sm text-gray-900">{new Date(workflow.requestedAt).toLocaleDateString()}</span>;
      },
    },
    {
      key: "requestedQuantity", header: "Qty Requested", sortable: true, width: 130,
      render: (value) => <span className="font-semibold text-gray-900">{String(value)} units</span>,
    },
    {
      key: "status", header: "Status", sortable: true, width: 130,
      render: (value) => {
        const map: Record<string, { cls: string; icon: React.ReactNode }> = {
          Pending: { cls: "bg-yellow-50 text-yellow-700 border-yellow-200", icon: <Clock className="w-3 h-3" /> },
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
      key: "workflow", header: "Requested By", width: 160,
      render: (value) => {
        const workflow = value as InventoryWorkflowDto;
        return (
          <div>
            <p className="text-sm text-gray-900">{workflow.requestedBy}</p>
            <p className="text-xs text-gray-500 mt-0.5">Awaiting review</p>
          </div>
        );
      },
    },
  ], [productDetailsById]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Inventory Management</h1>
        <p className="text-sm text-gray-500 mt-1">Track medicine stock levels, expiry dates, and restock requests</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <StatCard icon={<Package className="w-5 h-5 text-teal-600" />} iconBg="bg-teal-100"
          value={inventoryStats.totalItems} label="Total Medicines" sub="In inventory" />
        <ExpiryCard icon={<Calendar className="w-5 h-5 text-yellow-600" />} iconBg="bg-yellow-100"
          lots={inventoryStats.expiringLots} medicines={inventoryStats.expiringMedicines} />
        <StatCard icon={<FileText className="w-5 h-5 text-blue-600" />} iconBg="bg-blue-100"
          value={pendingRequestsCount} label="Pending Requests" sub="Awaiting approval" />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="border-b border-gray-200">
          <nav className="flex gap-8 px-6">
            {TABS.map((tab) => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                className={`py-4 border-b-2 font-medium text-sm transition-colors flex items-center gap-2 ${
                  activeTab === tab.key
                    ? "border-teal-600 text-teal-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}>
                {tab.icon}{tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === "stock" && (
            <InventoryStockDataGrid
              products={stockRows} totalCount={totalCount} isLoading={isLoading}
              initialQuery={tableQuery} onServerQueryChange={handleServerQueryChange}
              onRequestRestock={openRestockDialog}
            />
          )}
          {activeTab === "expiry" && (
            <DataTable data={expiryData} columns={expiryColumns} pageSize={15}
              pageSizeOptions={[10, 15, 25, 50]} searchPlaceholder="Search expiring items…"
              exportFileName="inventory-expiry-tracking" height={600} />
          )}
          {activeTab === "requests" && (
            <DataTable data={restockRequests} columns={requestColumns} pageSize={15}
              pageSizeOptions={[10, 15, 25, 50]} searchPlaceholder="Search requests…"
              exportFileName="restock-requests" height={600} loading={isLoadingRequests} />
          )}
        </div>
      </div>

      <Modal isOpen={!!itemToDispose} onClose={() => setItemToDispose(null)}
        className="w-full max-w-sm flex flex-col overflow-hidden !p-0 rounded-xl">
        {itemToDispose && (
          <>
            <div className="flex items-center gap-3 px-6 pt-5 pb-4 border-b border-gray-100">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h2 className="text-base font-bold text-gray-900">Dispose Item</h2>
                <p className="text-sm text-gray-500 mt-0.5">This action cannot be undone</p>
              </div>
            </div>
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
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-white">
              <Button variant="secondary" size="md" onClick={() => setItemToDispose(null)}
                className="!bg-white border border-gray-200 !text-gray-700 hover:!bg-gray-50">Cancel</Button>
              <Button variant="danger" size="md" className="flex items-center gap-2"
                onClick={() => { handleDispose(itemToDispose); setItemToDispose(null); }}>
                <Archive className="w-4 h-4" />Dispose
              </Button>
            </div>
          </>
        )}
      </Modal>

      <Modal isOpen={isDialogOpen} onClose={closeRestockDialog}
        className="w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden !p-0 rounded-xl">
        {selectedProduct && (
          <>
            <div className="px-6 pt-5 pb-3 border-b border-gray-100 flex-shrink-0">
              <h2 className="text-lg font-bold text-gray-900">Create Restock Request</h2>
              <p className="text-sm text-gray-500 mt-0.5">
                Submit a request to restock{" "}
                <span className="font-semibold text-gray-800">{selectedProduct.name}</span>
              </p>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                {[
                  ["Strength",      selectedProduct.strength               || "-"],
                  ["Form",          selectedProduct.form                   || "-"],
                  ["Manufacturer",  selectedProduct.manufacturer           || "-"],
                  ["Current Stock", `${selectedProduct.totalQuantityAvailable} units`],
                ].map(([label, val]) => (
                  <div key={label} className="flex justify-between">
                    <span className="text-gray-500">{label}:</span>
                    <span className="font-semibold text-gray-900">{val}</span>
                  </div>
                ))}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Requested Quantity <span className="text-red-500">*</span>
                </label>
                <input type="number" min={1} step={1} value={form.requestedQuantity}
                  onChange={(e) => setForm({ requestedQuantity: e.target.value })}
                  placeholder="Enter quantity"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500" />
              </div>
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 flex-shrink-0 bg-white">
              <Button variant="secondary" onClick={closeRestockDialog}>Cancel</Button>
              <Button variant="primary" onClick={handleCreateRequest} disabled={isSubmitting}>
                {isSubmitting ? "Submitting..." : "Create Request"}
              </Button>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
}

interface StatCardProps { icon: React.ReactNode; iconBg: string; value: number; label: string; sub: string; }
function StatCard({ icon, iconBg, value, label, sub }: StatCardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 ${iconBg} rounded-lg flex items-center justify-center`}>{icon}</div>
        <span className="text-2xl font-bold text-gray-900">{value}</span>
      </div>
      <p className="text-sm font-semibold text-gray-700 mb-1">{label}</p>
      <p className="text-xs text-gray-500">{sub}</p>
    </div>
  );
}

interface ExpiryCardProps { icon: React.ReactNode; iconBg: string; lots: number; medicines: number; }
function ExpiryCard({ icon, iconBg, lots, medicines }: ExpiryCardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 ${iconBg} rounded-lg flex items-center justify-center`}>{icon}</div>
        <span className="text-2xl font-bold text-gray-900">{lots}</span>
      </div>
      <p className="text-sm font-semibold text-gray-700 mb-1">Expiring Soon</p>
      <p className="text-xs text-gray-500">
        {lots === 0
          ? "No lots expiring within 90 days"
          : `${lots} lot${lots !== 1 ? "s" : ""} across ${medicines} medicine${medicines !== 1 ? "s" : ""}`}
      </p>
    </div>
  );
}