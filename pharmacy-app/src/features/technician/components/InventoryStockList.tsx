// src/features/technician/components/InventoryStockList.tsx
import { ChevronDown, ChevronRight, CheckCircle, AlertTriangle, Calendar } from "lucide-react";
import Button from "@components/common/Button/Button";
import type { MedicineGroup, InventoryItem, InventoryStatus } from "../technician.types";

// ── Sub: Status Badge ────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: InventoryStatus }) {
  if (status === "In Stock")
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 rounded-lg border border-green-200 text-xs font-semibold">
        <CheckCircle className="w-3 h-3" />
        In Stock
      </span>
    );
  if (status === "Low Stock")
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 text-orange-700 rounded-lg border border-orange-200 text-xs font-semibold">
        <AlertTriangle className="w-3 h-3" />
        Low Stock
      </span>
    );
  if (status === "Out of Stock")
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-700 rounded-lg border border-red-200 text-xs font-semibold">
        <AlertTriangle className="w-3 h-3" />
        Out of Stock
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-yellow-50 text-yellow-700 rounded-lg border border-yellow-200 text-xs font-semibold">
      <Calendar className="w-3 h-3" />
      Expiring Soon
    </span>
  );
}

// ── Props ────────────────────────────────────────────────────────────────────

interface InventoryStockListProps {
  groups:            MedicineGroup[];
  expandedMedicines: Set<string>;
  isLoading?:        boolean;
  onToggleExpand:    (key: string) => void;
  onRequestRestock:  (item: InventoryItem) => void;
}

// ── Component ────────────────────────────────────────────────────────────────

export default function InventoryStockList({
  groups,
  expandedMedicines,
  isLoading = false,
  onToggleExpand,
  onRequestRestock,
}: InventoryStockListProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((n) => (
          <div key={n} className="border border-gray-200 rounded-lg p-4 animate-pulse">
            <div className="flex items-center gap-4">
              <div className="w-5 h-5 bg-gray-200 rounded" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-40" />
                <div className="h-3 bg-gray-100 rounded w-24" />
              </div>
              <div className="h-8 bg-gray-200 rounded w-16" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (groups.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        No medicines found
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {groups.map((group) => {
        const isExpanded = expandedMedicines.has(group.key);

        return (
          <div
            key={group.key}
            className="border border-gray-200 rounded-lg overflow-hidden"
          >
            {/* ── Group header ──────────────────────────────────────────── */}
            <div
              className="p-4 bg-gray-50 hover:bg-gray-100 cursor-pointer flex items-center justify-between transition-colors"
              onClick={() => onToggleExpand(group.key)}
            >
              <div className="flex items-center gap-4 flex-1">
                {/* Chevron */}
                <span className="text-gray-400 flex-shrink-0">
                  {isExpanded ? (
                    <ChevronDown className="w-5 h-5" />
                  ) : (
                    <ChevronRight className="w-5 h-5" />
                  )}
                </span>

                {/* Medicine info */}
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-gray-900 text-lg">
                      {group.drugName}
                    </span>
                    <span className="text-sm text-gray-500">
                      {group.strength}
                    </span>
                    <span className="px-2 py-0.5 bg-gray-200 text-gray-600 rounded text-xs font-medium">
                      {group.category}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    {group.lotsCount} lot{group.lotsCount !== 1 ? "s" : ""}{" "}
                    available
                  </p>
                </div>

                {/* Total stock */}
                <div className="text-right mr-4">
                  <p className="text-2xl font-bold text-gray-900">
                    {group.totalStock}
                  </p>
                  <p className="text-xs text-gray-500">Total Units</p>
                </div>

                {/* Status badge */}
                <StatusBadge status={group.status} />
              </div>
            </div>

            {/* ── Expanded: lot rows ────────────────────────────────────── */}
            {isExpanded && (
              <div className="bg-white border-t border-gray-200 p-4">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  Available Lots
                </p>
                <div className="space-y-2">
                  {group.lots.map((lot) => {
                    const days = Math.floor(
                      (new Date(lot.expiryDate).getTime() - Date.now()) /
                        (1000 * 60 * 60 * 24)
                    );
                    const isExpiring = days < 90;

                    return (
                      <div
                        key={lot.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-teal-300 transition-colors"
                      >
                        <div className="flex-1 grid grid-cols-5 gap-4">
                          <div>
                            <p className="text-xs text-gray-500">Lot Number</p>
                            <p className="font-mono font-medium text-gray-900 text-sm">
                              {lot.batchNumber}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Stock</p>
                            <p className="font-semibold text-gray-900">
                              {lot.currentStock} units
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Expiry Date</p>
                            <p
                              className={`font-medium ${
                                isExpiring ? "text-orange-600" : "text-gray-900"
                              }`}
                            >
                              {lot.expiryDate}
                            </p>
                            {isExpiring && (
                              <p className="text-xs text-orange-600">
                                {days} days left
                              </p>
                            )}
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Requested By</p>
                            <p className="text-gray-900 text-sm truncate max-w-[120px]" title={lot.supplier}>
                              {lot.supplier}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Requested At</p>
                            <p className="text-gray-900 text-sm">
                              {lot.lastRestocked}
                            </p>
                          </div>
                        </div>

                        <div onClick={(e) => e.stopPropagation()}>
                          <Button
                            variant="primary"
                            size="sm"
                            className="ml-4 flex-shrink-0"
                            onClick={() => onRequestRestock(lot)}
                          >
                            Request Restock
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}