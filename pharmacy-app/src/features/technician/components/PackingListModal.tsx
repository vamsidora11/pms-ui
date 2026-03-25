// src/features/technician/components/PackingListModal.tsx
//
// Receives real DispenseDetailsDto from the backend.
// Shows actual lot numbers and expiry dates from dispense items.
//
import { Package, User, Calendar, Pill, CheckCircle, X, RefreshCw } from "lucide-react";
import Modal from "@components/common/Modal/Modal";
import Button from "@components/common/Button/Button";
import type { DispenseDetailsDto, DispenseSummaryDto } from "@api/dispense";

// ── Props ─────────────────────────────────────────────────────────────────────

interface PackingListModalProps {
  isOpen:     boolean;
  dispense:   DispenseDetailsDto | null;
  isLoading:  boolean;
  onClose:    () => void;
  // Called when technician clicks "Dispense" — passes a minimal summary
  // so the hook can fetch the ETag and call PUT /execute
  onExecute:  (row: DispenseSummaryDto) => Promise<void>;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function PackingListModal({
  isOpen,
  dispense,
  isLoading,
  onClose,
  onExecute,
}: PackingListModalProps) {

  // Build the minimal DispenseSummaryDto the hook expects
  const asSummary = (): DispenseSummaryDto | null => {
    if (!dispense) return null;
    return {
      id:             dispense.id,
      prescriptionId: dispense.prescriptionId,
      patientId:      dispense.patientId,
      dispenseDate:   dispense.dispenseDate,
      status:         dispense.status,
      itemCount:      dispense.items.length,
      grandTotal:     dispense.billingSummary.grandTotal,
    };
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="w-full max-w-lg max-h-[92vh] flex flex-col overflow-hidden !p-0 rounded-2xl"
    >
      {/* ── Header — pinned ─────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between px-6 pt-5 pb-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <Package className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Packing List</h2>
            <p className="text-sm text-gray-400">
              {dispense ? `Order #${dispense.id}` : "Loading…"}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors mt-0.5"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <p className="px-6 pb-3 text-sm text-gray-400 flex-shrink-0">
        View and manage lot information for this prescription order
      </p>

      {/* ── Scrollable Body ──────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-6 pb-4 space-y-3">

        {/* Loading state */}
        {isLoading && (
          <div className="flex items-center justify-center py-16 text-gray-400">
            <RefreshCw className="w-5 h-5 animate-spin mr-2" />
            <span className="text-sm">Loading packing list…</span>
          </div>
        )}

        {/* Content — only rendered when dispense is available */}
        {!isLoading && dispense && (
          <>
            {/* Patient Info Card */}
            <div className="bg-blue-50 rounded-2xl p-4">
              <div className="flex items-center gap-6 flex-wrap">
                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-blue-400 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-400">Patient</p>
                    <p className="font-semibold text-gray-900 text-sm font-mono">
                      {dispense.patientId}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-gray-300 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-400">Order Date</p>
                    <p className="font-semibold text-gray-900 text-sm">
                      {new Date(dispense.dispenseDate).toLocaleDateString("en-US", {
                        month: "short", day: "numeric", year: "numeric",
                      })}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">Status</p>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border bg-blue-50 text-blue-600 border-blue-200">
                    Payment Processed
                  </span>
                </div>
              </div>
            </div>

            {/* Items to Pack Card */}
            <div className="bg-blue-50 rounded-2xl p-4 flex items-center gap-3">
              <div className="w-11 h-11 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <Pill className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">
                  {dispense.items.length}{" "}
                  {dispense.items.length === 1 ? "Item" : "Items"} to Pack
                </p>
                <p className="text-sm text-gray-400 mt-0.5">
                  Retrieve the following medicines from the specified lot numbers and quantities
                </p>
              </div>
            </div>

            {/* Medication Cards — real lot data from backend */}
            <div className="space-y-3">
              {dispense.items.map((item, idx) => (
                  <div
                    key={item.prescriptionLineId}
                    className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden"
                  >
                    <div className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-blue-600 text-white rounded-xl flex items-center justify-center font-bold text-base flex-shrink-0">
                          {idx + 1}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 font-mono text-sm">
                            {item.productId}
                          </p>
                          <p className="text-xs text-gray-400">
                            Refill #{item.refillNumber}
                            {item.isManualAdjustment && (
                              <span className="ml-2 text-orange-500">• Manual Adjustment</span>
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-4xl font-bold text-blue-600 leading-none">
                          {item.quantityDispensed}
                        </p>
                        <p className="text-xs text-gray-400 uppercase tracking-wide mt-0.5">
                          Units
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
            </div>

            {/* Billing summary */}
            <div className="bg-gray-50 rounded-xl p-3 flex items-center justify-between text-sm border border-gray-100">
              <span className="text-gray-500">Grand Total</span>
              <div className="text-right">
                <span className="font-bold text-gray-900">
                  ${dispense.billingSummary.grandTotal.toFixed(2)}
                </span>
                {dispense.billingSummary.totalInsurancePaid > 0 && (
                  <p className="text-xs text-green-600 mt-0.5">
                    Insurance covers ${dispense.billingSummary.totalInsurancePaid.toFixed(2)}
                  </p>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── Footer — pinned ──────────────────────────────────────────────────── */}
      <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 flex-shrink-0 bg-white">
        <Button
          variant="secondary"
          size="md"
          onClick={onClose}
          className="!bg-white border border-gray-200 !text-gray-700 hover:!bg-gray-50 rounded-xl"
        >
          Close
        </Button>

        {dispense && !isLoading && (
          <Button
            variant="primary"
            size="md"
            onClick={async () => {
              const summary = asSummary();
              if (summary) await onExecute(summary);
            }}
            className="!bg-green-600 hover:!bg-green-700 rounded-xl flex items-center gap-2"
          >
            <CheckCircle className="w-4 h-4" />
            Complete Dispense
          </Button>
        )}
      </div>
    </Modal>
  );
}