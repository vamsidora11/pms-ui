// src/features/technician/components/PackingListModal.tsx
import { Package, User, Calendar, Pill, FileBarChart, CheckCircle, X } from "lucide-react";
import Modal from "@components/common/Modal/Modal";
import Button from "@components/common/Button/Button";
import type { DispenseItem } from "../technician.types";

// ── Helpers ───────────────────────────────────────────────────────────────────

function getLotNumber(index: number): string {
  return `LOT${String(index + 1).padStart(3, "0")}-${new Date().getFullYear()}`;
}

function getExpiryDate(): string {
  return new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface PackingListModalProps {
  isOpen: boolean;
  prescription: DispenseItem | null;
  onClose: () => void;
  onMarkReady: (item: DispenseItem) => void;
  onMarkDispensed: (item: DispenseItem) => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function PackingListModal({
  isOpen,
  prescription,
  onClose,
  onMarkReady,
  onMarkDispensed,
}: PackingListModalProps) {
  if (!prescription) return null;

  return (
    // ✅ Uses your reusable Modal component
    // className: narrower (max-w-lg ~512px matching Figma), tall enough to scroll
    // p-0 removes Modal's default p-6 so we control all padding ourselves
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="w-full max-w-lg max-h-[92vh] flex flex-col overflow-hidden !p-0 rounded-2xl"
    >
      {/* ── Header — pinned, outside scroll area ──────────────────────────── */}
      <div className="flex items-start justify-between px-6 pt-5 pb-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          {/* Blue box icon matching Figma */}
          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <Package className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Packing List</h2>
            <p className="text-sm text-gray-400">Order #{prescription.id}</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors mt-0.5"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Description line — matching Figma */}
      <p className="px-6 pb-3 text-sm text-gray-400 flex-shrink-0">
        View and manage lot information for this prescription order
      </p>

      {/* ── Scrollable Body — scrollbar sits on right edge of modal ───────── */}
      <div className="flex-1 overflow-y-auto px-6 pb-4 space-y-3">

        {/* Patient Info Card — light blue, rounded, matching Figma */}
        <div className="bg-blue-50 rounded-2xl p-4">
          <div className="flex items-center gap-6 flex-wrap">
            <div className="flex items-center gap-3">
              <User className="w-5 h-5 text-blue-400 flex-shrink-0" />
              <div>
                <p className="text-xs text-gray-400">Patient</p>
                <p className="font-semibold text-gray-900 text-sm">{prescription.patientName}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-gray-300 flex-shrink-0" />
              <div>
                <p className="text-xs text-gray-400">Order Date</p>
                <p className="font-semibold text-gray-900 text-sm">
                  {prescription.createdAt.toLocaleDateString("en-US", {
                    month: "short", day: "numeric", year: "numeric",
                  })}
                </p>
              </div>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">Status</p>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${
                prescription.status === "Ready to Dispense"
                  ? "bg-purple-50 text-purple-600 border-purple-200"
                  : "bg-white text-gray-600 border-gray-200"
              }`}>
                {prescription.status}
              </span>
            </div>
          </div>
        </div>

        {/* Items to Pack Card — matching Figma's light pill icon */}
        <div className="bg-blue-50 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-11 h-11 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <Pill className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <p className="font-semibold text-gray-900">
              {prescription.medications.length}{" "}
              {prescription.medications.length === 1 ? "Item" : "Items"} to Pack
            </p>
            <p className="text-sm text-gray-400 mt-0.5">
              Retrieve the following medicines from the specified lot numbers and quantities
            </p>
          </div>
        </div>

        {/* Medication Cards — matching Figma's card style */}
        <div className="space-y-3">
          {prescription.medications.map((med, idx) => (
            <div key={idx} className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
              <div className="p-4">
                {/* Drug header row */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-blue-600 text-white rounded-xl flex items-center justify-center font-bold text-base flex-shrink-0">
                      {idx + 1}
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">{med.drugName}</p>
                      <p className="text-xs text-gray-400">{med.strength} • {med.dosage}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-4xl font-bold text-blue-600 leading-none">{med.quantity}</p>
                    <p className="text-xs text-gray-400 uppercase tracking-wide mt-0.5">Units</p>
                  </div>
                </div>

                {/* Retrieve From section — matching Figma's light blue inner card */}
                <div className="bg-blue-50 rounded-xl p-3">
                  <div className="flex items-center gap-2 mb-2.5">
                    <FileBarChart className="w-3.5 h-3.5 text-blue-500" />
                    <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">
                      Retrieve From
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: "LOT NUMBER", value: getLotNumber(idx),         cls: "font-bold text-gray-900 font-mono" },
                      { label: "QUANTITY",   value: `${med.quantity} units`,   cls: "font-bold text-blue-600" },
                      { label: "EXPIRY",     value: getExpiryDate(),           cls: "font-medium text-gray-900" },
                    ].map(({ label, value, cls }) => (
                      <div key={label} className="bg-white rounded-lg p-2.5 border border-blue-100">
                        <p className="text-xs text-gray-400 mb-1">{label}</p>
                        <p className={`text-sm ${cls} break-words`}>{value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Ready to Proceed banner — matching Figma */}
        <div className="bg-purple-50 rounded-2xl p-4 flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-purple-400 flex-shrink-0" />
          <div>
            <p className="font-semibold text-gray-900 text-sm">Ready to proceed?</p>
            <p className="text-xs text-gray-400 mt-0.5">
              {prescription.status === "Payment Processed"
                ? "Mark as ready once all items are packed"
                : "Complete dispense to hand over to patient"}
            </p>
          </div>
        </div>
      </div>

      {/* ── Footer — pinned, outside scroll, matching Figma button layout ─── */}
      {/* NOTE: Modal's built-in Close button is suppressed by !p-0;
          we render our own footer with Close + action button side by side */}
      <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 flex-shrink-0 bg-white">
        <Button
          variant="secondary"
          size="md"
          onClick={onClose}
          className="!bg-white border border-gray-200 !text-gray-700 hover:!bg-gray-50 rounded-xl"
        >
          Close
        </Button>

        {prescription.status === "Payment Processed" && (
          <Button
            variant="primary"
            size="md"
            onClick={() => onMarkReady(prescription)}
            className="!bg-purple-600 hover:!bg-purple-700 rounded-xl flex items-center gap-2"
          >
            <Package className="w-4 h-4" />
            Mark Ready to Dispense
          </Button>
        )}

        {prescription.status === "Ready to Dispense" && (
          <Button
            variant="primary"
            size="md"
            onClick={() => onMarkDispensed(prescription)}
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