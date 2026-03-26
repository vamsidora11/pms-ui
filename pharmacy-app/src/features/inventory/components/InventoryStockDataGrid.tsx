import { useCallback, useMemo, useState } from "react";
import { AlertTriangle, Calendar, CheckCircle, ChevronDown, ChevronRight } from "lucide-react";
import Button from "@components/common/Button/Button";
import DataTable, { type Column, type ServerTableQuery } from "@components/common/Table/Table";
import type { InventoryStatus, RestockProduct } from "@inventory/types/inventory.types";
import {
  formatInventoryDate,
  getLotNumber,
  isExpiringSoon,
  toRestockProduct,
  type InventoryProductRow,
} from "@inventory/inventoryProductUtils";

interface InventoryStockListProps {
  products:            InventoryProductRow[];
  totalCount:          number;
  isLoading?:          boolean;
  initialQuery:        ServerTableQuery;
  onServerQueryChange: (query: ServerTableQuery) => void;
  onRequestRestock:    (product: RestockProduct) => void;
}

function StatusBadge({ status }: { status: InventoryStatus }) {
  if (status === "In Stock") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-lg border border-green-200 bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-700">
        <CheckCircle className="h-3 w-3" />
        In Stock
      </span>
    );
  }
  if (status === "Low Stock") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-lg border border-orange-200 bg-orange-50 px-3 py-1.5 text-xs font-semibold text-orange-700">
        <AlertTriangle className="h-3 w-3" />
        Low Stock
      </span>
    );
  }
  if (status === "Out of Stock") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700">
        <AlertTriangle className="h-3 w-3" />
        Out of Stock
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-lg border border-yellow-200 bg-yellow-50 px-3 py-1.5 text-xs font-semibold text-yellow-700">
      <Calendar className="h-3 w-3" />
      Expiring Soon
    </span>
  );
}

export default function InventoryStockDataGrid({
  products,
  totalCount,
  isLoading = false,
  initialQuery,
  onServerQueryChange,
  onRequestRestock,
}: InventoryStockListProps) {
  const [expandedProductIds, setExpandedProductIds] = useState<Set<string>>(new Set());

  const toggleRow = useCallback((productId: string) => {
    setExpandedProductIds((prev) => {
      const next = new Set(prev);
      if (next.has(productId)) { next.delete(productId); } else { next.add(productId); }
      return next;
    });
  }, []);

  const columns = useMemo((): Column<InventoryProductRow>[] => [
    {
      key: "name",
      header: "Medicine",
      sortable: true,
      filterable: true,
      width: 280,
      render: (value, row) => (
        <div>
          <div className="font-semibold text-gray-900">{String(value)}</div>
          <div className="mt-0.5 text-xs text-gray-500">
            {[row.strength || "No strength", row.form || "No form"].join(" | ")}
          </div>
        </div>
      ),
    },
    {
      key: "manufacturer",
      header: "Manufacturer",
      sortable: true,
      filterable: true,
      width: 180,
      render: (value) => <span className="text-gray-700">{String(value || "-")}</span>,
    },
    {
      key: "totalQuantityAvailable",
      header: "Available",
      sortable: true,
      width: 130,
      render: (value) => (
        <span className="font-semibold text-gray-900">{String(value)} units</span>
      ),
    },
    {
      key: "lotsCount",
      header: "Lots",
      width: 110,
      render: (value) => <span className="text-gray-700">{String(value)}</span>,
    },
    {
      key: "stockStatus",
      header: "Status",
      width: 170,
      render: (value) => <StatusBadge status={value as InventoryStatus} />,
    },
    {
      key: "id",
      header: "Actions",
      width: 170,
      render: (_, row) => (
        <div onClick={(event) => event.stopPropagation()}>
          <Button variant="primary" size="sm" onClick={() => onRequestRestock(toRestockProduct(row))}>
            Request Restock
          </Button>
        </div>
      ),
    },
    {
      key: "inventoryLots",
      header: "Details",
      width: 120,
      render: (_, row) => {
        const isExpanded = expandedProductIds.has(row.id);
        return (
          <span className="inline-flex items-center gap-1.5 text-sm font-medium text-teal-700">
            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            {isExpanded ? "Hide lots" : "View lots"}
          </span>
        );
      },
    },
  ], [expandedProductIds, onRequestRestock]);

  const renderExpandedRow = useCallback((row: InventoryProductRow) => {
    const sortedLots = [...row.inventoryLots].sort(
      (left, right) => new Date(left.expiry).getTime() - new Date(right.expiry).getTime()
    );

    if (sortedLots.length === 0) {
      return (
        <div className="p-5 text-sm text-gray-500">
          No inventory lots are available for this product.
        </div>
      );
    }

    return (
      <div className="space-y-3 p-4">
        {sortedLots.map((lot) => {
          const daysUntilExpiry = Math.ceil(
            (new Date(lot.expiry).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
          );
          return (
            <div
              key={lot.id}
              className="flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-4 md:flex-row md:items-center md:justify-between"
            >
              <div className="grid flex-1 gap-4 md:grid-cols-5">
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-500">Lot Number</p>
                  <p className="font-mono text-sm font-semibold text-gray-900">{getLotNumber(lot)}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-500">Stock</p>
                  <p className="text-sm font-semibold text-gray-900">{lot.quantityAvailable} units</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-500">Expiry</p>
                  <p className={`text-sm font-medium ${isExpiringSoon(lot.expiry) ? "text-orange-600" : "text-gray-900"}`}>
                    {formatInventoryDate(lot.expiry)}
                  </p>
                  {isExpiringSoon(lot.expiry) && (
                    <p className="text-xs text-orange-600">
                      {daysUntilExpiry < 0 ? "Expired" : `${daysUntilExpiry} days left`}
                    </p>
                  )}
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-500">Supplier</p>
                  <p className="text-sm text-gray-900">{lot.supplierName || lot.workflow.requestedBy || "-"}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-500">Requested At</p>
                  <p className="text-sm text-gray-900">{formatInventoryDate(lot.workflow.requestedAt)}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  }, []);

  return (
    <DataTable
      data={products}
      columns={columns}
      pageSize={initialQuery.pageSize}
      pageSizeOptions={[10, 20, 50]}
      searchPlaceholder="Search medicine name..."
      exportFileName="inventory-stock-levels"
      emptyMessage="No medicines found"
      height={650}
      expandable
      renderExpandedRow={renderExpandedRow}
      isRowExpanded={(row) => expandedProductIds.has(row.id)}
      onRowClick={(row) => toggleRow(row.id)}
      rowClassName={(row) => row.stockStatus === "Out of Stock" ? "bg-red-50/40" : ""}
      serverSide
      loading={isLoading}
      totalItems={totalCount}
      initialServerQuery={initialQuery}
      onServerQueryChange={onServerQueryChange}
    />
  );
}