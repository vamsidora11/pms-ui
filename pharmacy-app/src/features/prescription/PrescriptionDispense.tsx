// src/features/prescription/PrescriptionDispense.tsx
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  CheckCircle,
  Shield,
  CreditCard,
  Banknote,
  Wallet,
  Building2,
  Loader2,
  Clock,
  Package,
} from "lucide-react";

import Button from "@components/common/Button/Button";
import Badge from "@components/common/Badge/Badge";
import Modal from "@components/common/Modal/Modal";

import { useDispense } from "./hooks/useDispense";
import { useBilling } from "./hooks/useBilling";
import { useToast } from "@components/common/Toast/useToast";

import type { DispenseQueueItem, DispenseRow, ClaimStatus } from "./types/dispense.types";

// ─── Mock queue data ──────────────────────────────────────────────────────────

const MOCK_QUEUE: DispenseQueueItem[] = [
  {
    id: "RX-DEMO-UX",
    patientId: "PT-1234",
    patientName: "John Doe",
    doctorName: "Dr. Sarah Smith",
    insuranceProvider: "BlueCross Shield",
    medications: [
      { drugName: "Amoxicillin",  strength: "500mg", quantity: 15, instructions: "Take 1 capsule TID",  price: 7.5,  refills: 0 },
      { drugName: "Atorvastatin", strength: "20mg",  quantity: 30, instructions: "Take 1 tablet Daily", price: 36.0, refills: 3 },
      { drugName: "Vitamin D",    strength: "10mg",  quantity: 30, instructions: "Take 1 tablet Daily", price: 4.5,  refills: 3 },
    ],
    status: "Validated",
    createdAt: new Date(),
    totalAmount: 48.0,
    paymentStatus: "Pending",
    allergies: ["PENICILLIN"],   // ← clean allergy name only
  },
  {
    id: "RX-2026-010",
    patientId: "PT-004",
    patientName: "James Chen",
    doctorName: "Dr. Sarah Martinez",
    insuranceProvider: "Aetna Health",
    medications: [
      { drugName: "Lisinopril", strength: "10mg", quantity: 30, instructions: "Take 1 tablet daily",             price: 18.75, refills: 2 },
      { drugName: "Omeprazole", strength: "20mg", quantity: 30, instructions: "Take 1 capsule before breakfast", price: 25.0,  refills: 1 },
    ],
    status: "Payment Processed",
    createdAt: new Date("2026-02-15T11:30:00"),
    totalAmount: 43.75,
    paymentStatus: "Paid",
    allergies: [],
  },
  {
    id: "RX-2026-011",
    patientId: "PT-002",
    patientName: "Robert Williams",
    doctorName: "Dr. Emily Carter",
    insuranceProvider: "United Healthcare",
    medications: [
      { drugName: "Metformin",  strength: "850mg", quantity: 60, instructions: "Take 1 tablet twice daily with meals", price: 12.0, refills: 5 },
      { drugName: "Amlodipine", strength: "5mg",   quantity: 30, instructions: "Take 1 tablet daily",                  price: 9.5,  refills: 3 },
    ],
    status: "Payment Processed",
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    totalAmount: 21.5,
    paymentStatus: "Paid",
    allergies: ["Aspirin"],
  },
  {
    id: "RX-2026-012",
    patientId: "PT-009",
    patientName: "Maria Lopez",
    doctorName: "Dr. James Patel",
    insuranceProvider: "Cigna",
    medications: [
      { drugName: "Sertraline", strength: "50mg", quantity: 30, instructions: "Take 1 tablet daily in the morning", price: 22.0, refills: 1 },
    ],
    status: "Validated",
    createdAt: new Date(Date.now() - 45 * 60 * 1000),
    totalAmount: 22.0,
    paymentStatus: "Pending",
    allergies: [],
  },
];

// Compute isUrgent once at module load time — keeps render functions pure
const _now = new Date().getTime();
const MOCK_QUEUE_WITH_URGENCY: DispenseQueueItem[] = MOCK_QUEUE.map((item) => ({
  ...item,
  isUrgent: item.status === "Validated" && (_now - item.createdAt.getTime()) > 60 * 60 * 1000,
}));

function formatDateTime(date: Date): string {
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ─── Reusable number input — native, no wrapper, works reliably ───────────────

function QtyInput({
  value,
  disabled,
  placeholder,
  hasError,
  isExternal,
  onChange,
}: {
  value: number;
  disabled: boolean;
  placeholder?: string;
  hasError?: boolean;
  isExternal?: boolean;
  onChange: (val: number) => void;
}) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = parseInt(e.target.value, 10);
    // Clamp: no negatives, no NaN
    const safe = isNaN(raw) ? 0 : Math.max(0, raw);
    onChange(safe);
  };

  return (
    <input
      type="number"
      min={0}
      disabled={disabled}
      value={isExternal && !value ? "" : value === 0 ? "" : value}
      placeholder={placeholder ?? "0"}
      onChange={handleChange}
      onKeyDown={(e) => {
        // Prevent minus sign and 'e' (scientific notation)
        if (e.key === "-" || e.key === "e" || e.key === "E") e.preventDefault();
      }}
      className={[
        "w-24 h-10 rounded-lg border px-3 text-sm font-mono text-right",
        "focus:outline-none focus:ring-2 transition-all",
        "appearance-none", // hide default browser spinner on some browsers; keep on others for UX
        disabled
          ? "bg-gray-50 text-gray-400 cursor-not-allowed border-gray-200"
          : hasError
          ? "border-red-300 bg-red-50 text-red-700 focus:ring-red-200 focus:border-red-400"
          : "border-gray-200 bg-white text-gray-900 focus:ring-blue-100 focus:border-blue-400",
      ].join(" ")}
    />
  );
}

// ─── Queue Card ───────────────────────────────────────────────────────────────

function QueueCard({
  item,
  onSelect,
}: {
  item: DispenseQueueItem;
  onSelect: (item: DispenseQueueItem) => void;
}) {
  const isPaymentProcessed = item.status === "Payment Processed";
  const isUrgent = item.isUrgent ?? false;

  return (
    <div
      onClick={() => onSelect(item)}
      className="px-6 py-5 hover:bg-gray-50 transition-colors cursor-pointer group border-b border-gray-100 last:border-b-0"
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          {/* Badge row */}
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                isPaymentProcessed
                  ? "bg-green-100 text-green-700"
                  : "bg-blue-100 text-blue-700"
              }`}
            >
              {item.status}
            </span>
            <span className="text-xs font-mono text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
              {item.id}
            </span>
            {isUrgent && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-semibold">
                <Clock className="w-3 h-3" />
                Urgent
              </span>
            )}
          </div>

          {/* Info grid */}
          <div className="grid grid-cols-4 gap-8">
            <div>
              <div className="text-xs text-gray-500 uppercase tracking-wide mb-1 font-semibold">Patient</div>
              <div className="text-gray-900 font-semibold">{item.patientName}</div>
              <div className="text-xs text-gray-500">{item.patientId}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500 uppercase tracking-wide mb-1 font-semibold">Details</div>
              <div className="text-gray-900">
                {item.medications.length} Medication{item.medications.length !== 1 ? "s" : ""}
              </div>
              <div className="text-xs text-gray-500">{item.doctorName}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500 uppercase tracking-wide mb-1 font-semibold">Est. Total</div>
              <div className="text-gray-900 font-bold">${item.totalAmount.toFixed(2)}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500 uppercase tracking-wide mb-1 font-semibold">Time</div>
              <div className="text-gray-900">{formatDateTime(item.createdAt)}</div>
            </div>
          </div>
        </div>

        {/* Arrow — only on hover */}
        <div className="opacity-0 group-hover:opacity-100 transition-opacity text-blue-500 shrink-0">
          <ArrowLeft className="w-5 h-5 rotate-180" />
        </div>
      </div>
    </div>
  );
}

// ─── Dispense Table Row ───────────────────────────────────────────────────────

function DispenseTableRow({
  row,
  qty,
  extQty,
  allocation,
  claimStatus,
  isPaid,
  onQtyChange,
  onExtQtyChange,
}: {
  row: DispenseRow;
  qty: number;
  extQty: number;
  allocation: ReturnType<typeof useDispense>["allocations"][string];
  claimStatus: ClaimStatus;
  isPaid: boolean;
  onQtyChange: (row: DispenseRow, val: number, claim: ClaimStatus) => void;
  onExtQtyChange: (row: DispenseRow, val: number, claim: ClaimStatus) => void;
}) {
  const isError = allocation && !allocation.isValid;
  const stockLow = row.safeStock < row.remaining;

  return (
    <tr className="hover:bg-gray-50/50 transition-colors border-b border-gray-100 last:border-b-0">

      {/* Medication */}
      <td className="py-4 px-4 align-middle">
        <div className="font-bold text-gray-900 text-sm">{row.medicineName}</div>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs text-gray-500">{row.strength}</span>
          <Badge label={row.refillLabel} variant="secondary" className="text-[10px] h-5 px-2 rounded-md" />
        </div>
      </td>

      {/* Instructions */}
      <td className="py-4 px-4 align-middle max-w-[180px]">
        <div className="text-xs text-gray-600 leading-relaxed">{row.frequency}</div>
      </td>

      {/* Available qty */}
      <td className="py-4 px-4 align-middle text-center">
        <div className="text-sm font-bold text-gray-900">
          {row.remaining}{" "}
          <span className="text-gray-400 font-normal">/ {row.maxPrescribed}</span>
        </div>
        <div className={`text-[11px] mt-0.5 ${stockLow ? "text-red-500 font-medium" : "text-gray-400"}`}>
          Stock: {row.safeStock}
        </div>
      </td>

      {/* Dispense qty */}
      <td className="py-4 px-4 align-middle">
        <div className="flex justify-center relative">
          {row.isExternal ? (
            // External rows: non-editable dash
            <div className="w-24 h-10 flex items-center justify-center border border-dashed border-gray-300 rounded-lg bg-gray-50 text-gray-400 text-sm">
              -
            </div>
          ) : (
            <QtyInput
              value={qty}
              disabled={isPaid}
              hasError={isError}
              onChange={(val) => onQtyChange(row, val, claimStatus)}
            />
          )}

          {/* Error tooltip — "Max 15" style */}
          {isError && !row.isExternal && (
            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 z-20 pointer-events-none">
              <div className="relative bg-red-600 text-white text-[11px] font-semibold px-2.5 py-1 rounded shadow-lg whitespace-nowrap">
                {allocation.error}
                {/* Arrow pointing up */}
                <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-red-600 rotate-45" />
              </div>
            </div>
          )}
        </div>
      </td>

      {/* External fill */}
      <td className="py-4 px-4 align-middle">
        <div className="flex justify-center">
          <QtyInput
            value={extQty}
            disabled={isPaid}
            onChange={(val) => onExtQtyChange(row, val, claimStatus)}
          />
        </div>
      </td>

      {/* Unit price */}
      <td className="py-4 px-4 align-middle text-right font-mono text-sm text-gray-700">
        ${row.unitPrice.toFixed(2)}
      </td>

      {/* Totals / breakdown */}
      <td className="py-4 px-4 align-middle text-right">
        {row.isExternal ? (
          <span className="text-xs border border-gray-200 text-gray-400 px-2 py-1 rounded-full">
            External
          </span>
        ) : claimStatus === "approved" ? (
          <div className="flex flex-col items-end gap-0.5">
            <div className="flex items-center gap-1.5 text-[11px] text-gray-500">
              <span>Ins</span>
              <span className="font-semibold text-green-600">
                ${allocation?.insuranceCovered.toFixed(2) ?? "0.00"}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-900 font-bold">
              <span>Pt</span>
              <span>${allocation?.patientPayable.toFixed(2) ?? "0.00"}</span>
            </div>
          </div>
        ) : (
          <div className="text-sm font-bold text-gray-900">
            ${allocation?.totalPrice.toFixed(2) ?? "0.00"}
          </div>
        )}
      </td>
    </tr>
  );
}

// ─── Payment Modal ────────────────────────────────────────────────────────────

function PaymentModal({
  isOpen,
  onClose,
  patientName,
  totalDue,
  paymentMethod,
  transactionId,
  isProcessing,
  onMethodChange,
  onTransactionIdChange,
  onConfirm,
}: {
  isOpen: boolean;
  onClose: () => void;
  patientName: string;
  totalDue: number;
  paymentMethod: string;
  transactionId: string;
  isProcessing: boolean;
  onMethodChange: (method: "cash" | "card" | "upi") => void;
  onTransactionIdChange: (val: string) => void;
  onConfirm: () => void;
}) {
  // Track whether user has attempted to confirm — validation only shows after that
  const [attempted, setAttempted] = useState(false);

  const methods = [
    { id: "cash" as const, icon: Banknote,   label: "Cash" },
    { id: "card" as const, icon: CreditCard,  label: "Card" },
    { id: "upi"  as const, icon: Wallet,      label: "UPI"  },
  ];

  const needsTransactionId = paymentMethod === "card" || paymentMethod === "upi";
  const transactionIdComplete = transactionId.length === 4;

  // Error only visible after user tries to confirm
  const showTxError = attempted && needsTransactionId && !transactionIdComplete;

  const handleConfirmClick = () => {
    if (needsTransactionId && !transactionIdComplete) {
      setAttempted(true); // reveal error
      return;
    }
    onConfirm();
  };

  // Reset attempted state when modal closes or method changes
  const handleClose = () => {
    setAttempted(false);
    onClose();
  };

  const handleMethodChange = (method: "cash" | "card" | "upi") => {
    setAttempted(false);
    onTransactionIdChange(""); // clear digits when switching method
    onMethodChange(method);
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} className="w-[440px] p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-1">Record Patient Payment</h2>
      <p className="text-sm text-gray-500 mb-5">
        Collect payment for{" "}
        <span className="font-medium text-gray-900">{patientName}</span>. Total due:{" "}
        <span className="font-bold text-gray-900">${totalDue.toFixed(2)}</span>.
      </p>

      {/* Payment method selector */}
      <div className="mb-5">
        <div className="text-sm font-medium text-gray-700 mb-3">Payment Method</div>
        <div className="grid grid-cols-3 gap-3">
          {methods.map((m) => (
            <div
              key={m.id}
              onClick={() => handleMethodChange(m.id)}
              className={`cursor-pointer rounded-xl border p-4 flex flex-col items-center gap-2 hover:bg-gray-50 transition-all ${
                paymentMethod === m.id
                  ? "border-blue-500 bg-blue-50 text-blue-700 ring-1 ring-blue-500 shadow-sm"
                  : "border-gray-200 text-gray-600"
              }`}
            >
              <m.icon className="w-6 h-6" />
              <span className="text-xs font-medium">{m.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Transaction ID — Card / UPI only */}
      {needsTransactionId && (
        <div className="mb-5">
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-sm font-medium text-gray-700">
              {paymentMethod === "card" ? "Card" : "UPI"} Transaction ID
            </label>
            {/* Error message sits inline next to the label */}
            {showTxError && (
              <span className="text-xs font-medium text-red-500 flex items-center gap-1">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-500" />
                {transactionId.length === 0
                  ? "Transaction ID is required"
                  : `${4 - transactionId.length} more digit${4 - transactionId.length !== 1 ? "s" : ""} needed`}
              </span>
            )}
          </div>
          <input
            type="text"
            inputMode="numeric"
            maxLength={4}
            placeholder="Last 4 digits"
            value={transactionId}
            onChange={(e) => {
              onTransactionIdChange(e.target.value.replace(/\D/g, ""));
              if (attempted && e.target.value.length === 4) setAttempted(false);
            }}
            className={[
              "w-full h-10 rounded-lg border px-3 text-sm font-mono tracking-widest",
              "focus:outline-none focus:ring-2 transition-all",
              showTxError
                ? "border-red-400 bg-red-50 text-red-700 focus:ring-red-100 focus:border-red-400"
                : transactionIdComplete
                ? "border-green-400 bg-green-50 text-gray-900 focus:ring-green-100 focus:border-green-400"
                : "border-gray-200 bg-white text-gray-900 focus:ring-blue-100 focus:border-blue-400",
            ].join(" ")}
          />
          {/* Helper text below input — only when no error */}
          {!showTxError && (
            <p className="text-xs text-gray-400 mt-1.5">
              Enter last 4 digits of transaction ID for verification
            </p>
          )}
        </div>
      )}

      <div className="flex justify-end gap-3 mt-2">
        <Button variant="secondary" onClick={handleClose} disabled={isProcessing}>
          Cancel
        </Button>
        <Button
          onClick={handleConfirmClick}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <span className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Processing...
            </span>
          ) : (
            "Confirm Receipt"
          )}
        </Button>
      </div>
    </Modal>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function PrescriptionDispense() {
  const toast    = useToast();
  const dispense = useDispense();
  const billing  = useBilling();

  useEffect(() => {
    if (dispense.selectedItem) {
      billing.reset(dispense.selectedItem.status);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispense.selectedItem?.id]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleSubmitClaim = async () => {
    const ok = await billing.submitClaim();
    if (ok) {
      toast.success("Insurance Claim Approved", "Coverage applied to eligible medications.");
      dispense.recalculateWithInsurance(
        dispense.activeRows,
        dispense.dispenseQuantities,
        dispense.externalQuantities
      );
    }
  };

  const handleRecordPayment = async () => {
    const ok = await billing.recordPayment();
    if (ok) toast.success("Payment Recorded Successfully", "");
  };

  const handleComplete = () => {
    if (dispense.hasErrors) {
      toast.error("Validation Error", "Please fix quantity errors before completing.");
      return;
    }
    if (billing.paymentStatus !== "paid") {
      toast.error("Payment Required", "Please collect payment before dispensing.");
      return;
    }
    toast.success("Transaction Completed", `Prescription ${dispense.selectedItem?.id} dispensed.`);
    dispense.clearSelection();
  };

  // ── Queue View ─────────────────────────────────────────────────────────────

  if (!dispense.selectedItem) {
    return (
      <div className="max-w-5xl mx-auto p-6 space-y-6">
        <div>
          <h1 className="text-gray-900 mb-2 font-bold text-2xl">Dispense & Billing Queue</h1>
          <p className="text-gray-500">
            Process payments and dispense medications for validated prescriptions
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-gray-500 mb-1">Ready for Dispense</div>
              <div className="text-gray-900 font-semibold">
                {MOCK_QUEUE_WITH_URGENCY.length} prescriptions awaiting processing
              </div>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-gray-900 font-semibold">Active Queue</h2>
          </div>
          {MOCK_QUEUE_WITH_URGENCY.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-gray-400" />
              </div>
              <div className="text-gray-900 mb-2 font-medium">No Pending Dispenses</div>
              <div className="text-gray-500">All validated prescriptions have been processed.</div>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {MOCK_QUEUE_WITH_URGENCY.map((item) => (
                <QueueCard key={item.id} item={item} onSelect={dispense.loadItem} />
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Workspace View ─────────────────────────────────────────────────────────

  const item = dispense.selectedItem;
  const claimApproved = billing.claimStatus === "approved";
  const totals = dispense.computeTotals();

  return (
    <div className="max-w-7xl mx-auto space-y-6 p-6">

      {/* Back */}
      <button
        onClick={dispense.clearSelection}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        Back to Queue
      </button>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-gray-900 text-2xl font-bold mb-1">Process Dispense & Payment</h1>
          <p className="text-gray-500">Review items, process insurance claim, and collect payment</p>
        </div>
        <div className="flex items-center gap-3">
          <span
            className={`px-3 py-1 rounded-full text-xs font-bold border ${
              claimApproved
                ? "bg-green-50 text-green-700 border-green-200"
                : "bg-yellow-50 text-yellow-700 border-yellow-200"
            }`}
          >
            Insurance: {claimApproved ? "Approved" : "Pending"}
          </span>
          <span
            className={`px-3 py-1 rounded-full text-xs font-bold border ${
              billing.paymentStatus === "paid"
                ? "bg-green-50 text-green-700 border-green-200"
                : "bg-red-50 text-red-700 border-red-200"
            }`}
          >
            Payment: {billing.paymentStatus === "paid" ? "Complete" : "Due"}
          </span>
        </div>
      </div>

      {/* Patient info */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="grid grid-cols-4 gap-6">
          <div>
            <div className="text-gray-500 text-sm mb-1">Patient Name</div>
            <div className="text-gray-900 font-semibold text-lg">{item.patientName}</div>
          </div>
          <div>
            <div className="text-gray-500 text-sm mb-1">Patient ID</div>
            <code className="bg-gray-100 px-2 py-1 rounded text-gray-700 font-mono text-sm">
              {item.patientId}
            </code>
          </div>
          <div>
            <div className="text-gray-500 text-sm mb-1">Insurance</div>
            {item.insuranceProvider ? (
              <div className="flex items-center gap-2 text-blue-700 font-medium">
                <Shield className="w-4 h-4" />
                {item.insuranceProvider}
              </div>
            ) : (
              <span className="text-gray-400">Self-Pay</span>
            )}
          </div>
          <div>
            <div className="text-gray-500 text-sm mb-1">Allergies</div>
            {item.allergies && item.allergies.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {item.allergies.map((a) => (
                  <span
                    key={a}
                    className="text-xs bg-red-50 text-red-700 px-2 py-0.5 rounded border border-red-100 font-medium"
                  >
                    {a}
                  </span>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-1 text-green-700">
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm">No Known Allergies</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Medication table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <h2 className="text-gray-900 font-semibold">Medication & Billing Details</h2>
          <div className="text-sm text-gray-500">
            Prescription ID:{" "}
            <span className="font-mono font-semibold text-gray-900">{item.id}</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Medication
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Instructions
                </th>
                <th className="text-center py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Dispensable Qty
                </th>
                <th className="text-center py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Dispense
                </th>
                <th className="text-center py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Ext. Fill
                </th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Price
                </th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Totals
                </th>
              </tr>
            </thead>

            <tbody>
              {dispense.activeRows.map((row) => (
                <DispenseTableRow
                  key={row.id}
                  row={row}
                  qty={dispense.dispenseQuantities[row.id] || 0}
                  extQty={dispense.externalQuantities[row.id] || 0}
                  allocation={dispense.allocations[row.id]}
                  claimStatus={billing.claimStatus}
                  isPaid={billing.paymentStatus === "paid"}
                  onQtyChange={(r, val, claim) => dispense.handleQtyChange(r, String(val), claim)}
                  onExtQtyChange={(r, val, claim) => dispense.handleExternalQtyChange(r, String(val), claim)}
                />
              ))}
            </tbody>

            <tfoot className="border-t border-gray-100">
              <tr>
                <td colSpan={5} />
                <td className="py-4 px-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Totals
                </td>
                <td className="py-4 px-4">
                  {claimApproved ? (
                    <div className="flex flex-col gap-1 items-end">
                      <div className="flex justify-between w-36 text-xs text-gray-500">
                        <span>Subtotal</span>
                        <span className="font-mono text-gray-900">${totals.grand.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between w-36 text-xs text-gray-500">
                        <span>Insurance</span>
                        <span className="font-medium text-green-600">-${totals.insurance.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between w-36 text-sm font-bold text-gray-900 border-t border-gray-200 pt-1 mt-1">
                        <span>Patient Due</span>
                        <span className="text-blue-600">${totals.patient.toFixed(2)}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-between w-36 items-center">
                      <span className="text-sm font-bold text-gray-900">Total Due</span>
                      <span className="text-sm font-bold text-blue-600">${totals.grand.toFixed(2)}</span>
                    </div>
                  )}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Action footer */}
      <div className="flex items-center justify-end gap-4 pt-2">
        {/* Step 1: Submit claim */}
        <Button
          variant="secondary"
          onClick={handleSubmitClaim}
          disabled={billing.claimStatus !== "pending" || billing.paymentStatus === "paid"}
          className={`flex items-center gap-2 border border-gray-200 ${
            claimApproved
              ? "!bg-green-50 !text-green-700 !border-green-200 opacity-80"
              : "text-gray-700"
          }`}
        >
          {billing.claimStatus === "submitting" ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : claimApproved ? (
            <CheckCircle className="w-4 h-4" />
          ) : (
            <Building2 className="w-4 h-4" />
          )}
          {claimApproved ? "Claim Approved" : "Submit Insurance Claim"}
        </Button>

        {/* Step 2: Record payment */}
        <Button
          variant="secondary"
          onClick={() => billing.setShowPaymentModal(true)}
          disabled={billing.paymentStatus === "paid"}
          className={`flex items-center gap-2 border border-gray-200 ${
            billing.paymentStatus === "paid"
              ? "!bg-green-50 !text-green-700 !border-green-200 opacity-80"
              : "text-gray-700"
          }`}
        >
          {billing.paymentStatus === "paid" ? (
            <CheckCircle className="w-4 h-4" />
          ) : (
            <CreditCard className="w-4 h-4" />
          )}
          {billing.paymentStatus === "paid" ? "Payment Recorded" : "Record Payment"}
        </Button>

        <div className="w-px h-10 bg-gray-200 mx-2" />

        {/* Step 3: Complete */}
        <Button
          onClick={handleComplete}
          disabled={billing.paymentStatus !== "paid"}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg transition-all px-8"
        >
          <Package className="w-4 h-4" />
          Complete & Mark Ready
        </Button>
      </div>

      {/* Payment modal */}
      <PaymentModal
        isOpen={billing.showPaymentModal}
        onClose={() => billing.setShowPaymentModal(false)}
        patientName={item.patientName}
        totalDue={totals.patient > 0 ? totals.patient : totals.grand}
        paymentMethod={billing.paymentMethod}
        transactionId={billing.transactionId}
        isProcessing={billing.isProcessingPayment}
        onMethodChange={billing.setPaymentMethod}
        onTransactionIdChange={billing.setTransactionId}
        onConfirm={handleRecordPayment}
      />
    </div>
  );
}