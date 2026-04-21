// src/features/dispense/components/PrescriptionDispense.tsx
import { useEffect, useState } from "react";
import {
  ArrowLeft, CheckCircle, AlertTriangle, Shield,
  CreditCard, Banknote, Wallet, Building2, Loader2,
  Package, ChevronRight, Pill, User, Clock,
  SkipForward, RefreshCw, SendHorizonal, Printer,
} from "lucide-react";

import Button from "@components/common/Button/Button";
import Input  from "@components/common/Input/Input";
import Badge  from "@components/common/Badge/Badge";
import { useToast } from "@components/common/Toast/useToast";
import { cancelDispense, executeDispenseWithEtag, markDispenseReadyWithEtag } from "@api/dispense";
import type { PrescriptionSummaryDto } from "@api/prescription";

import { useDispense }        from "../hooks/useDispense";
import { useBilling }         from "../hooks/useBilling";
import { usePrescriptionSearch } from "../hooks/usePrescriptionSearch";
import { useRecentPrescriptions } from "../hooks/useRecentPrescriptions";

import type { DispenseQueueItem, WorkflowStep } from "../types/dispense.types";

// ── Step Progress Bar ─────────────────────────────────────────────────────────

const STEPS: { num: WorkflowStep; label: string; icon: React.ElementType }[] = [
  { num: 1, label: "Verify Dispense",  icon: Pill       },
  { num: 2, label: "Process Payment",  icon: CreditCard },
];

function toQueueCardItem(item: PrescriptionSummaryDto): DispenseQueueItem {
  return {
    prescriptionId: item.id,
    patientId: item.patientId,
    patientName: item.patientName,
    doctorName: item.prescriberName,
    medicineCount: item.medicineCount,
    status: item.status,
    createdAt: item.createdAt,
  };
}

function StepBar({ currentStep, paymentDone }: { currentStep: WorkflowStep; paymentDone: boolean }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
      <div className="flex items-center">
        {STEPS.map((s, idx) => {
          const isDone   = s.num === 2 && paymentDone;
          const isActive = currentStep === s.num && !isDone;
          const isPast   = currentStep > s.num;
          const Icon     = s.icon;
          return (
            <div key={s.num} className="flex items-center flex-1">
              <div className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl transition-all ${
                isDone || isPast ? "bg-green-50" : isActive ? "bg-blue-50" : ""
              }`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                  isDone || isPast ? "bg-green-500" : isActive ? "bg-blue-600" : "bg-gray-100"
                }`}>
                  {isDone || isPast
                    ? <CheckCircle className="w-4 h-4 text-white" />
                    : <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-gray-400"}`} />
                  }
                </div>
                <div>
                  <div className={`text-xs font-semibold ${isDone || isPast ? "text-green-700" : isActive ? "text-blue-700" : "text-gray-400"}`}>
                    Step {s.num}
                  </div>
                  <div className={`text-sm font-bold leading-tight ${isDone || isPast ? "text-green-800" : isActive ? "text-blue-900" : "text-gray-400"}`}>
                    {s.label}
                  </div>
                </div>
                {isDone && (
                  <span className="text-xs font-semibold text-green-700 bg-green-100 px-2 py-0.5 rounded-full ml-1">
                    Complete
                  </span>
                )}
              </div>
              {idx < STEPS.length - 1 && (
                <div className={`flex-1 h-0.5 mx-2 rounded ${currentStep > s.num ? "bg-green-300" : "bg-gray-100"}`} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function PrescriptionDispense() {
  const toast    = useToast();
  const dispense = useDispense();
  const billing  = useBilling();
  const { recent, isLoading: isLoadingRecent } = useRecentPrescriptions();
  const { results, search, isLoading: isSearching, error: searchError } = usePrescriptionSearch();
  const [searchTerm, setSearchTerm] = useState("");

  const ws           = dispense.workspace;
  const hasInsurance = ws?.insuranceProvider != null;
  const subtotal     = dispense.computeSubtotal();
  const totals       = billing.computeTotals(subtotal);

  // After insurance claim: use real amounts from backend
  // Before claim or skipped: use frontend estimate
  const realPatientDue       = ws?.backendPatientPayable ?? totals.patientDue;
  const realInsuranceCovered = ws?.backendInsurancePaid  ?? totals.insuranceCovered;

  const effectiveTotals = {
    ...totals,
    patientDue:       realPatientDue,
    insuranceCovered: realInsuranceCovered,
  };

  const isPaymentDone = billing.canRelease(hasInsurance);

  // Reset billing when workspace changes
  useEffect(() => {
    billing.reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ws?.prescriptionId]);

  // ── Step 1 → Step 2: Save & Checkout ──────────────────────────────────────

  const handleSaveDispense = async () => {
    if (!ws) return;

    if (!dispense.validateAndProceed()) {
      toast.error("Fix quantity errors", "Please resolve all errors before saving.");
      return;
    }
    const total = ws.rows.reduce(
      (s, r) => s + (r.isExternal ? 0 : dispense.dispenseQty[r.id] || 0), 0
    );
    if (total === 0) {
      toast.error("No quantities", "Please enter at least one dispense quantity.");
      return;
    }

    const result = await billing.checkout(
      ws.patientId,
      ws.prescriptionId,
      ws.rows,
      dispense.dispenseQty,
      dispense.externalQty
    );

    if (!result) {
      toast.error("Checkout failed", billing.checkoutError ?? "Please try again.");
      return;
    }

    dispense.setCheckoutResult(result.dispenseId, result.etag, result.grandTotal);
    dispense.setStep(2);
    toast.success("Dispense saved", "Proceed to payment.");
  };

  // ── Insurance Claim ────────────────────────────────────────────────────────

  const handleSubmitClaim = async () => {
    if (!ws?.dispenseId || !ws.dispenseEtag) return;
    const result = await billing.submitClaim(ws.dispenseId, ws.patientId, ws.dispenseEtag);
    if (result?.success && result.etag && result.data) {
      toast.success("Claim Approved", `Covered by ${ws.insuranceProvider}`);
      // Update workspace ETag and billing amounts from backend response
      dispense.setBackendBilling(
        result.etag,
        result.data.billingSummary.totalPatientPayable,
        result.data.billingSummary.totalInsurancePaid
      );
    } else {
      toast.error("Claim Failed", "Insurance claim could not be processed. You can skip and collect full payment.");
    }
  };

  // ── Patient Payment ────────────────────────────────────────────────────────

  const handlePatientPayment = async () => {
    if (!ws?.dispenseId || !ws.dispenseEtag) return;
    const amountDue = ws.backendPatientPayable ?? effectiveTotals.patientDue;
    const result = await billing.doRecordPayment(
      ws.patientId,
      ws.dispenseId,
      ws.dispenseEtag,
      amountDue
    );

    if (result?.etag) {
      // Update local checkout result with new etag returned after payment
      dispense.setCheckoutResult(ws.dispenseId!, result.etag, ws.grandTotal ?? effectiveTotals.subtotal);
      toast.success(`$${amountDue.toFixed(2)} payment recorded.`);
    } else if (billing.paymentStatus !== "idle") {
      toast.error("Payment failed", "Could not record payment. Please try again.");
    }
  };

  // ── Release to Technician ──────────────────────────────────────────────────

  const handleRelease = async () => {
    if (!ws?.dispenseId || !ws.dispenseEtag) return;
    billing.setIsReleasing(true);
    try {
      // STEP 1: mark ready and update etag
      const { etag: readyEtag } = await markDispenseReadyWithEtag(ws.dispenseId, ws.patientId, ws.dispenseEtag);

      // STEP 2: then execute using latest etag
      const { etag: finalEtag } = await executeDispenseWithEtag(ws.dispenseId, ws.patientId, readyEtag || ws.dispenseEtag);

      // Update workspace to latest etag
      dispense.setCheckoutResult(ws.dispenseId!, finalEtag, ws.grandTotal ?? effectiveTotals.subtotal);
      toast.success("Sent to dispensing queue", "Technician will complete handover.");
      dispense.clearSelection();
    } catch (err) {
      console.error("release flow failed", err);
      toast.error("Release failed", "Could not move this dispense forward.");
    } finally {
      billing.setIsReleasing(false);
    }
  };

  const handleCancel = async () => {
    if (!ws?.dispenseId || !ws.dispenseEtag) {
      dispense.clearSelection();
      return;
    }

    try {
      await cancelDispense(ws.dispenseId, ws.patientId, ws.dispenseEtag);
      toast.success("Dispense cancelled", "The dispense has been cancelled.");
      dispense.clearSelection();
    } catch {
      toast.error("Cancel failed", "Could not cancel this dispense.");
    }
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;

    await search({
      prescriptionId: searchTerm,
      patientName: searchTerm,
      patientId: searchTerm,
    });
  };

  // ── Print Receipt ──────────────────────────────────────────────────────────

  const handlePrintReceipt = () => {
    if (!ws) return;
    const now = new Date().toLocaleString("en-US", {
      month: "long", day: "numeric", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
    const itemRows = ws.rows
      .filter((r) => !r.isExternal)
      .map((r) => {
        const qty   = dispense.dispenseQty[r.id] || 0;
        const total = (qty * r.unitPrice).toFixed(2);
        return `<tr>
          <td>${r.medicineName} ${r.strength} <span style="color:#888;font-size:11px">(${r.refillLabel})</span></td>
          <td style="text-align:center">${qty}</td>
          <td style="text-align:right">$${r.unitPrice.toFixed(2)}</td>
          <td style="text-align:right">$${total}</td>
        </tr>`;
      }).join("");

    const insuranceLine =
      !billing.insuranceSkipped && billing.claimStatus === "approved"
        ? `<tr><td colspan="3" style="text-align:right;color:#16a34a">Insurance (${ws.insuranceProvider})</td><td style="text-align:right;color:#16a34a">−$${effectiveTotals.insuranceCovered.toFixed(2)}</td></tr>`
        : billing.insuranceSkipped
        ? `<tr><td colspan="3" style="text-align:right;color:#9ca3af">Insurance</td><td style="text-align:right;color:#9ca3af">Skipped</td></tr>`
        : "";

    const txnLine = billing.txnId ? `<p><strong>Transaction ID:</strong> ${billing.txnId}</p>` : "";
    const insHeaderLine = ws.insuranceId
      ? `<p><strong>Insurance:</strong> ${ws.insuranceProvider} · <span style="font-family:monospace">${ws.insuranceId}</span></p>`
      : "";

    const html = `<!DOCTYPE html><html><head><title>Receipt — ${ws.prescriptionId}</title>
<style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Courier New',monospace;font-size:13px;color:#111;padding:32px;max-width:480px;margin:auto}h1{font-size:17px;letter-spacing:2px;text-align:center;margin-bottom:2px}.sub{text-align:center;color:#666;font-size:11px;margin-bottom:16px}hr{border:none;border-top:1px dashed #bbb;margin:12px 0}table{width:100%;border-collapse:collapse}th{text-align:left;border-bottom:1px solid #ddd;padding:0 0 6px;font-size:10px;text-transform:uppercase;letter-spacing:.5px;color:#666}td{padding:5px 0;vertical-align:top}.total-row td{font-weight:bold;font-size:14px;border-top:1px solid #111;padding-top:8px}.meta p{margin:3px 0;line-height:1.5}.footer{text-align:center;color:#999;font-size:10px;margin-top:24px;line-height:1.6}@media print{@page{margin:16mm}}</style>
</head><body>
<h1>MEDIFLOW PHARMACY</h1><p class="sub">Payment Receipt</p><hr/>
<div class="meta">
<p><strong>Patient:</strong> ${ws.patientName} &nbsp;·&nbsp; <span style="color:#555">${ws.patientId}</span></p>
<p><strong>Rx ID:</strong> <span style="font-family:monospace">${ws.prescriptionId}</span></p>
<p><strong>Dispense ID:</strong> <span style="font-family:monospace">${ws.dispenseId ?? "—"}</span></p>
<p><strong>Date:</strong> ${now}</p>${insHeaderLine}</div><hr/>
<table><thead><tr><th>Medication</th><th style="text-align:center">Qty</th><th style="text-align:right">Unit</th><th style="text-align:right">Amount</th></tr></thead>
<tbody>${itemRows}</tbody>
<tfoot>
<tr style="color:#555"><td colspan="3" style="text-align:right;padding-top:10px">Subtotal</td><td style="text-align:right;padding-top:10px">$${effectiveTotals.subtotal.toFixed(2)}</td></tr>
${insuranceLine}
<tr class="total-row"><td colspan="3" style="text-align:right">Total Paid</td><td style="text-align:right">$${effectiveTotals.patientDue.toFixed(2)}</td></tr>
</tfoot></table><hr/>
<div class="meta"><p><strong>Payment Method:</strong> ${billing.paymentMethod.charAt(0).toUpperCase() + billing.paymentMethod.slice(1)}</p>${txnLine}</div>
<p class="footer">Thank you for visiting MediFlow Pharmacy.<br/>Your medications are being prepared. Please wait at the counter.</p>
</body></html>`;

    const win = window.open("", "_blank", "width=520,height=720");
    win?.document.write(html);
    win?.document.close();
    win?.focus();
    setTimeout(() => win?.print(), 350);
  };

  // ════════════════════════════════════════════════════════════════════════════
  // QUEUE VIEW
  // ════════════════════════════════════════════════════════════════════════════

  if (!ws) {
    return (
      <div className="max-w-4xl mx-auto space-y-5 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-gray-900 font-bold text-xl mb-0.5">Dispense & Billing</h1>
            <p className="text-gray-500 text-sm">Search prescriptions to begin</p>
          </div>
        </div>

        {/* Preview error */}
        {dispense.previewError && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
            {dispense.previewError}
          </div>
        )}

        {/* List */}
        {searchError && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
            {searchError}
          </div>
        )}

        <div className="space-y-6">
          <div className="bg-white p-4 rounded-xl border">
            <div className="flex gap-2">
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSearch();
                }}
                placeholder="Search by Rx ID / Patient ID / Name"
                className="flex-1 border px-3 py-2 rounded-lg text-sm"
              />
              <button
                onClick={handleSearch}
                disabled={isSearching}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:bg-blue-300"
              >
                {isSearching ? "Searching..." : "Search"}
              </button>
            </div>
          </div>

          {isSearching && (
            <div className="flex justify-center py-4">
              <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
            </div>
          )}

          <div>
            <h2 className="text-sm font-semibold text-gray-600 mb-2">
              Recent Prescriptions
            </h2>

            <div className="bg-white rounded-xl border overflow-hidden">
              {isLoadingRecent ? (
                <div className="p-10 flex flex-col items-center gap-3 text-gray-400">
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <span className="text-sm">Loading prescriptions...</span>
                </div>
              ) : recent.length === 0 ? (
                <div className="p-10 text-center text-sm text-gray-500">
                  Search prescriptions to begin
                </div>
              ) : (
                recent.map((item) => (
                  <QueueCard
                    key={item.id}
                    item={toQueueCardItem(item)}
                    isLoading={dispense.isLoadingPreview}
                    onSelect={() => dispense.loadItem(toQueueCardItem(item))}
                  />
                ))
              )}
            </div>
          </div>

          {results.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-gray-600 mb-2">
                Search Results
              </h2>

              <div className="bg-white rounded-xl border overflow-hidden">
                {results.map((item) => (
                  <QueueCard
                    key={item.id}
                    item={toQueueCardItem(item)}
                    isLoading={dispense.isLoadingPreview}
                    onSelect={() => dispense.loadItem(toQueueCardItem(item))}
                  />
                ))}
              </div>
            </div>
          )}

          {!isSearching && results.length === 0 && searchTerm && (
            <div className="text-center text-gray-400 py-6 text-sm">
              No prescriptions found
            </div>
          )}
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════════════════
  // WORKSPACE VIEW
  // ════════════════════════════════════════════════════════════════════════════

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-4">

      {/* Top Bar */}
      <div className="flex items-center gap-3 flex-wrap">
        <button
          onClick={dispense.clearSelection}
          className="flex items-center gap-1.5 text-gray-500 hover:text-gray-900 transition-colors text-sm"
        >
          <ArrowLeft className="w-4 h-4" /> Search
        </button>
        <div className="w-px h-4 bg-gray-200" />
        <div className="flex items-center gap-2">
          <User className="w-4 h-4 text-gray-400" />
          <span className="font-semibold text-gray-900 text-sm">{ws.patientName}</span>
          <code className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded font-mono">{ws.patientId}</code>
        </div>
        <div className="w-px h-4 bg-gray-200" />
        <code className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded font-mono">{ws.prescriptionId}</code>
        {hasInsurance ? (
          <span className="flex items-center gap-1 text-xs text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100">
            <Shield className="w-3 h-3" /> {ws.insuranceProvider}
            {ws.insuranceId && <span className="text-blue-400 font-mono"> · {ws.insuranceId}</span>}
          </span>
        ) : (
          <span className="text-xs text-gray-400 bg-gray-50 px-2.5 py-1 rounded-full border border-gray-100">Self-Pay</span>
        )}
        {ws.allergies && ws.allergies.length > 0 && (
          <span className="flex items-center gap-1 text-xs text-red-600 bg-red-50 px-2.5 py-1 rounded-full border border-red-100 ml-auto">
            <AlertTriangle className="w-3 h-3" /> Allergy: {ws.allergies.join(", ")}
          </span>
        )}
      </div>

      {/* Step Progress */}
      <StepBar currentStep={dispense.step} paymentDone={isPaymentDone} />

      {/* ════════ STEP 1: VERIFY DISPENSE ════════ */}
      {dispense.step === 1 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 className="text-gray-900 font-semibold">Medication Quantities</h2>
              <p className="text-xs text-gray-500 mt-0.5">Review and confirm quantities — safe stock is live from inventory</p>
            </div>
            <span className="text-xs text-gray-400">
              Estimated: <span className="font-bold text-gray-700">${subtotal.toFixed(2)}</span>
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {["Medication", "Instructions", "Avail / Safe Stock", "Dispense Qty", "Ext. Fill", "Line Total"].map((h, i) => (
                    <th key={h} className={`py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide ${
                      i === 0 || i === 1 ? "text-left" : i === 2 ? "text-center" : i >= 4 ? "text-right" : "text-center"
                    } ${i === 1 ? "hidden md:table-cell" : ""}`}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {ws.rows.map((row) => {
                  const qty            = dispense.dispenseQty[row.id] || 0;
                  const ext            = dispense.externalQty[row.id] || 0;
                  const lineTotal      = row.isExternal ? 0 : qty * row.unitPrice;
                  const hasDispErr     = !!dispense.qtyErrors[row.id];
                  const hasExtErr      = !!dispense.extQtyErrors[row.id];
                  const dispMaxAllowed = row.isExternal
                    ? 0
                    : Math.max(0, Math.min(row.safeStock, row.remaining) - ext);
                  const extMaxAllowed  = row.isExternal
                    ? row.remaining
                    : Math.max(0, row.remaining - qty);

                  return (
                    <tr key={row.id} className="hover:bg-gray-50/70 transition-colors">
                      {/* Medication */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-gray-900 text-sm">{row.medicineName}</div>
                        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                          {row.strength && <span className="text-xs text-gray-500">{row.strength}</span>}
                          <Badge label={row.refillLabel} variant="secondary" className="text-[10px]" />
                          {row.isExternal && <Badge label="External" variant="warning" className="text-[10px]" />}
                        </div>
                      </td>

                      {/* Instructions */}
                      <td className="py-3 px-4 hidden md:table-cell">
                        <span className="text-xs text-gray-500 leading-tight">{row.frequency || "—"}</span>
                      </td>

                      {/* Avail / Safe Stock */}
                      <td className="py-3 px-4 text-center">
                        <div className="text-sm font-semibold text-gray-900">
                          {row.remaining} <span className="text-gray-400 font-normal">/ {row.maxPrescribed}</span>
                        </div>
                        <div className={`text-[10px] font-medium ${row.safeStock < row.remaining ? "text-red-500" : "text-gray-400"}`}>
                          Safe stock: {row.safeStock}
                        </div>
                      </td>

                      {/* Dispense Qty */}
                      <td className="py-3 px-4">
                        <div className="flex flex-col items-center gap-1">
                          {row.isExternal ? (
                            <div className="w-20 h-8 flex items-center justify-center border border-dashed border-gray-300 rounded-lg bg-gray-50 text-gray-400 text-sm">—</div>
                          ) : (
                            <Input
                              type="number"
                              value={qty === 0 ? "" : String(qty)}
                              placeholder="0"
                              disabled={false}
                              onChange={(val) => dispense.handleQtyChange(row.id, val)}
                              className={`w-20 h-8 text-center font-mono text-sm ${
                                hasDispErr ? "border-red-400 bg-red-50" : qty > 0 ? "border-green-300 bg-green-50/60" : ""
                              }`}
                            />
                          )}
                          {/* Inline error below input */}
                          {hasDispErr ? (
                            <span className="text-[10px] text-red-600 font-semibold text-center leading-tight max-w-[90px]">
                              {dispense.qtyErrors[row.id]}
                            </span>
                          ) : !row.isExternal ? (
                            <span className="text-[10px] text-center">
                              <span className="text-gray-400">max </span>
                              <span className={`font-semibold ${dispMaxAllowed === 0 ? "text-amber-500" : "text-gray-500"}`}>
                                {dispMaxAllowed}
                              </span>
                            </span>
                          ) : null}
                        </div>
                      </td>

                      {/* Ext. Fill */}
                      <td className="py-3 px-4">
                        <div className="flex flex-col items-center gap-1">
                          <Input
                            type="number"
                            value={ext === 0 ? "" : String(ext)}
                            placeholder="0"
                            disabled={false}
                            onChange={(val) => dispense.handleExternalQtyChange(row.id, val)}
                            className={`w-20 h-8 text-center font-mono text-sm ${
                              hasExtErr ? "border-red-400 bg-red-50" : ext > 0 ? "border-amber-300 bg-amber-50/60" : "bg-gray-50"
                            }`}
                          />
                          {hasExtErr ? (
                            <span className="text-[10px] text-red-600 font-semibold text-center leading-tight max-w-[90px]">
                              {dispense.extQtyErrors[row.id]}
                            </span>
                          ) : (
                            <span className="text-[10px] text-center">
                              <span className="text-gray-400">max </span>
                              <span className={`font-semibold ${extMaxAllowed === 0 ? "text-amber-500" : "text-gray-500"}`}>
                                {extMaxAllowed}
                              </span>
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Line Total */}
                      <td className="py-3 px-4 text-right">
                        {row.isExternal
                          ? <span className="text-xs text-gray-400">External</span>
                          : <span className="font-semibold text-gray-900 text-sm">${lineTotal.toFixed(2)}</span>
                        }
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="border-t border-gray-200 bg-gray-50">
                <tr>
                  <td colSpan={5} className="py-3 px-4 text-right text-sm font-semibold text-gray-600">Subtotal</td>
                  <td className="py-3 px-4 text-right font-bold text-gray-900">${subtotal.toFixed(2)}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between">
            <button
              onClick={dispense.clearSelection}
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" /> Cancel
            </button>
            <Button
              onClick={handleSaveDispense}
              disabled={billing.checkoutLoading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-7 flex items-center gap-1.5"
            >
              {billing.checkoutLoading
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating…</>
                : <>Save Dispense <ChevronRight className="w-4 h-4" /></>
              }
            </Button>
          </div>
        </div>
      )}

      {/* ════════ STEP 2: PROCESS PAYMENT ════════ */}
      {dispense.step === 2 && (
        <div className="space-y-4">

          {/* Bill Summary Strip */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-6 py-4">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="text-sm font-semibold text-gray-600">Bill Summary</div>
              <div className="flex items-center gap-5 flex-wrap">
                <div className="text-center">
                  <div className="text-xs text-gray-400 mb-0.5">Subtotal</div>
                  <div className="font-bold text-gray-900">${effectiveTotals.subtotal.toFixed(2)}</div>
                </div>
                {hasInsurance && !billing.insuranceSkipped && (
                  <>
                    <ChevronRight className="w-4 h-4 text-gray-300" />
                    <div className="text-center">
                      <div className="text-xs text-gray-400 mb-0.5">
                        Insurance {billing.claimStatus === "approved" ? "(approved)" : "(pending)"}
                      </div>
                      <div className={`font-bold ${billing.claimStatus === "approved" ? "text-green-600" : "text-gray-400"}`}>
                        {billing.claimStatus === "approved" ? `-$${effectiveTotals.insuranceCovered.toFixed(2)}` : "—"}
                      </div>
                    </div>
                  </>
                )}
                {billing.insuranceSkipped && (
                  <>
                    <ChevronRight className="w-4 h-4 text-gray-300" />
                    <div className="text-center">
                      <div className="text-xs text-gray-400 mb-0.5">Insurance</div>
                      <div className="text-xs font-semibold text-gray-400">Skipped</div>
                    </div>
                  </>
                )}
                <ChevronRight className="w-4 h-4 text-gray-300" />
                <div className="text-center">
                  <div className="text-xs text-gray-400 mb-0.5">Patient Due</div>
                  <div className="font-bold text-blue-700 text-lg">${effectiveTotals.patientDue.toFixed(2)}</div>
                </div>
                {isPaymentDone && (
                  <span className="flex items-center gap-1.5 text-xs font-semibold text-green-700 bg-green-100 px-3 py-1.5 rounded-full">
                    <CheckCircle className="w-3.5 h-3.5" /> Fully Paid
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Payment Cards */}
          <div className={`grid gap-4 ${hasInsurance ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1 max-w-lg mx-auto w-full"}`}>

            {/* Insurance Card */}
            {hasInsurance && (
              <div className={`bg-white rounded-2xl border shadow-sm p-6 transition-all ${
                billing.insuranceSkipped ? "border-gray-200 bg-gray-50/40"
                : billing.claimStatus === "approved" ? "border-green-200 bg-green-50/20"
                : "border-gray-100"
              }`}>
                <div className="flex items-center gap-3 mb-5">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    billing.insuranceSkipped ? "bg-gray-100"
                    : billing.claimStatus === "approved" ? "bg-green-100"
                    : "bg-blue-100"
                  }`}>
                    {billing.insuranceSkipped ? <SkipForward className="w-5 h-5 text-gray-400" />
                     : billing.claimStatus === "approved" ? <CheckCircle className="w-5 h-5 text-green-600" />
                     : <Shield className="w-5 h-5 text-blue-600" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-900 text-sm">Insurance Claim</div>
                    <div className="text-xs text-gray-500">{ws.insuranceProvider}</div>
                    {ws.insuranceId && <div className="text-xs text-gray-400 font-mono mt-0.5">ID: {ws.insuranceId}</div>}
                  </div>
                  {billing.insuranceSkipped && <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">Skipped</span>}
                  {!billing.insuranceSkipped && billing.claimStatus === "approved" && <span className="text-xs font-bold text-green-700 bg-green-100 px-2.5 py-1 rounded-full">Approved</span>}
                  {!billing.insuranceSkipped && billing.claimStatus === "idle" && <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100">Optional</span>}
                </div>

                {billing.insuranceSkipped ? (
                  <div className="space-y-3">
                    <div className="bg-gray-100 rounded-xl p-4 text-sm text-gray-500 text-center border border-gray-200">
                      Patient pays full <span className="font-bold text-gray-700">${effectiveTotals.subtotal.toFixed(2)}</span> out of pocket.
                    </div>
                    <button onClick={billing.undoSkipInsurance} className="w-full text-xs text-blue-500 hover:text-blue-700 py-1.5 flex items-center justify-center gap-1.5">
                      <RefreshCw className="w-3 h-3" /> Use insurance instead
                    </button>
                  </div>
                ) : billing.claimStatus === "approved" ? (
                  <div className="space-y-2.5 bg-green-50 rounded-xl p-4 border border-green-100">
                    <div className="flex justify-between text-sm"><span className="text-gray-600">Provider</span><span className="font-semibold text-gray-900">{ws.insuranceProvider}</span></div>
                    {ws.insuranceId && <div className="flex justify-between text-sm"><span className="text-gray-600">Policy ID</span><span className="font-mono text-gray-700 text-xs">{ws.insuranceId}</span></div>}
                    <div className="flex justify-between text-sm"><span className="text-gray-600">Covered Amount</span><span className="font-bold text-green-700">${effectiveTotals.insuranceCovered.toFixed(2)}</span></div>
                    <div className="flex justify-between text-sm border-t border-green-200 pt-2"><span className="text-gray-600">Patient Responsibility</span><span className="font-bold text-blue-700">${effectiveTotals.patientDue.toFixed(2)}</span></div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="bg-blue-50 rounded-xl p-4 border border-blue-100 space-y-2">
                      {ws.insuranceId && (
                        <div className="flex justify-between text-sm text-blue-800 pb-2 border-b border-blue-200">
                          <span>Policy ID</span><span className="font-mono font-bold text-xs">{ws.insuranceId}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-sm text-blue-800"><span>Claim Amount</span><span className="font-bold">${effectiveTotals.subtotal.toFixed(2)}</span></div>
                      <div className="text-xs text-blue-700 border-t border-blue-200 pt-2">
                        Backend values will be loaded after claim approval.
                      </div>
                    </div>
                    <Button
                      onClick={handleSubmitClaim}
                      disabled={billing.claimStatus === "submitting"}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-2"
                    >
                      {billing.claimStatus === "submitting"
                        ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting Claim…</>
                        : <><Building2 className="w-4 h-4" /> Submit Insurance Claim</>
                      }
                    </Button>
                    <button
                      onClick={() => { billing.skipInsurance(); toast.info("Insurance skipped", "Patient will pay full amount."); }}
                      className="w-full text-xs text-gray-400 hover:text-gray-600 py-1.5 flex items-center justify-center gap-1.5"
                    >
                      <SkipForward className="w-3 h-3" /> Skip — patient pays out of pocket
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Patient Payment Card */}
            <div className={`bg-white rounded-2xl border shadow-sm p-6 transition-all ${
              billing.paymentStatus === "done" ? "border-green-200 bg-green-50/20"
              : hasInsurance && !billing.insuranceSkipped && billing.claimStatus !== "approved"
              ? "border-gray-100 opacity-50 pointer-events-none select-none"
              : "border-gray-100"
            }`}>
              <div className="flex items-center gap-3 mb-5">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${billing.paymentStatus === "done" ? "bg-green-100" : "bg-blue-100"}`}>
                  {billing.paymentStatus === "done" ? <CheckCircle className="w-5 h-5 text-green-600" /> : <CreditCard className="w-5 h-5 text-blue-600" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-900 text-sm">Patient Payment</div>
                  <div className="text-xs text-gray-500">
                    {billing.insuranceSkipped ? "Full amount (insurance skipped)"
                     : hasInsurance ? "Remaining after insurance deduction"
                     : "Self-pay — full amount due"}
                  </div>
                </div>
                {billing.paymentStatus === "done" && <span className="text-xs font-bold text-green-700 bg-green-100 px-2.5 py-1 rounded-full">Paid</span>}
                {hasInsurance && !billing.insuranceSkipped && billing.claimStatus !== "approved" && (
                  <span className="flex items-center gap-1 text-xs text-gray-400"><Clock className="w-3 h-3" /> Awaiting claim</span>
                )}
              </div>

              {billing.paymentStatus === "done" ? (
                <div className="space-y-2.5 bg-green-50 rounded-xl p-4 border border-green-100">
                  <div className="flex justify-between text-sm"><span className="text-gray-600">Amount Paid</span><span className="font-bold text-green-700">${effectiveTotals.patientDue.toFixed(2)}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-gray-600">Method</span><span className="font-semibold text-gray-900 capitalize">{billing.paymentMethod}</span></div>
                  {billing.txnId && <div className="flex justify-between text-sm"><span className="text-gray-600">Transaction ID</span><span className="font-mono text-gray-700">{billing.txnId}</span></div>}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-xl p-4 text-center border border-gray-100">
                    <div className="text-xs text-gray-500 mb-0.5">Amount Due</div>
                    <div className="text-3xl font-bold text-gray-900">${effectiveTotals.patientDue.toFixed(2)}</div>
                    {hasInsurance && !billing.insuranceSkipped && billing.claimStatus === "approved" && (
                      <div className="text-xs text-green-600 mt-1">Amount from approved backend billing summary</div>
                    )}
                  </div>

                  <div>
                    <div className="text-xs text-gray-500 mb-2 font-medium">Payment Method</div>
                    <div className="grid grid-cols-3 gap-2">
                      {(
                        [
                          { id: "cash" as const, icon: Banknote,  label: "Cash" },
                          { id: "card" as const, icon: CreditCard, label: "Card" },
                          { id: "upi"  as const, icon: Wallet,     label: "UPI"  },
                        ] as const
                      ).map(({ id, icon: Icon, label }) => (
                        <button
                          key={id}
                          onClick={() => { billing.setPaymentMethod(id); billing.setTxnId(""); }}
                          className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-sm font-medium transition-all ${
                            billing.paymentMethod === id
                              ? "border-blue-500 bg-blue-50 text-blue-700 shadow-sm"
                              : "border-gray-200 text-gray-600 hover:bg-gray-50"
                          }`}
                        >
                          <Icon className="w-5 h-5" /> {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {billing.paymentMethod !== "cash" && (
                    <div>
                      <Input
                        label="Transaction / Reference ID"
                        value={billing.txnId}
                        onChange={(val) => billing.setTxnId(val)}
                        placeholder="Enter transaction ID"
                        className={`font-mono text-sm ${billing.txnIdError ? "border-red-400 bg-red-50" : ""}`}
                      />
                      {billing.txnIdError && (
                        <p className="mt-1 text-xs text-red-600 font-medium flex items-center gap-1">
                          <span className="inline-block w-3 h-3 rounded-full bg-red-500 text-white text-[8px] flex items-center justify-center font-bold">!</span>
                          {billing.txnIdError}
                        </p>
                      )}
                    </div>
                  )}

                  <Button
                    onClick={handlePatientPayment}
                    disabled={
                      billing.paymentStatus === "processing" ||
                      (hasInsurance && billing.claimStatus !== "approved" && !billing.insuranceSkipped)
                    }
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-2"
                  >
                    {billing.paymentStatus === "processing"
                      ? <><Loader2 className="w-4 h-4 animate-spin" /> Processing…</>
                      : <><CreditCard className="w-4 h-4" /> Confirm Payment — ${effectiveTotals.patientDue.toFixed(2)}</>
                    }
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          {isPaymentDone ? (
            <div className="bg-white rounded-2xl border-2 border-green-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 bg-green-50/60 border-b border-green-100">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-semibold text-green-800">Payment Complete — Ready to Release</span>
                </div>
                <div className="flex items-center gap-6 flex-wrap text-sm">
                  <div><span className="text-gray-500 text-xs">Patient</span><div className="font-medium text-gray-900">{ws.patientName}</div></div>
                  <div className="w-px h-8 bg-green-200" />
                  <div><span className="text-gray-500 text-xs">Subtotal</span><div className="font-medium text-gray-900">${effectiveTotals.subtotal.toFixed(2)}</div></div>
                  {hasInsurance && !billing.insuranceSkipped && billing.claimStatus === "approved" && (
                    <><div className="w-px h-8 bg-green-200" /><div><span className="text-gray-500 text-xs">Insurance Covered</span><div className="font-medium text-green-700">−${effectiveTotals.insuranceCovered.toFixed(2)}</div></div></>
                  )}
                  <div className="w-px h-8 bg-green-200" />
                  <div>
                    <span className="text-gray-500 text-xs">Patient Paid</span>
                    <div className="font-bold text-gray-900">${effectiveTotals.patientDue.toFixed(2)} <span className="font-normal text-gray-500 text-xs capitalize">· {billing.paymentMethod}</span></div>
                  </div>
                  {ws.dispenseId && (
                    <><div className="w-px h-8 bg-green-200" /><div><span className="text-gray-500 text-xs">Dispense ID</span><div className="font-mono text-xs text-gray-700">{ws.dispenseId}</div></div></>
                  )}
                </div>
              </div>
              <div className="px-6 py-4 flex items-center justify-between bg-white">
                <div className="flex items-center gap-4">
                  <button onClick={() => dispense.setStep(1)} className="text-sm text-gray-400 hover:text-gray-600 flex items-center gap-1.5">
                    <ArrowLeft className="w-4 h-4" /> Edit Dispense
                  </button>
                  <div className="w-px h-4 bg-gray-200" />
                  <button onClick={handleCancel} className="text-sm text-red-400 hover:text-red-600">Cancel</button>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={handlePrintReceipt} className="flex items-center gap-1.5 px-4 py-2 text-sm text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50">
                    <Printer className="w-4 h-4" /> Print Receipt
                  </button>
                  <Button
                    onClick={handleRelease}
                    disabled={billing.isReleasing}
                    className="bg-green-600 hover:bg-green-700 text-white px-6 flex items-center gap-2"
                  >
                    {billing.isReleasing ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending…</> : <><SendHorizonal className="w-4 h-4" /> Send to Dispensing</>}
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button onClick={() => dispense.setStep(1)} className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1.5">
                  <ArrowLeft className="w-4 h-4" /> Edit Dispense
                </button>
                <div className="w-px h-4 bg-gray-200" />
                <button onClick={handleCancel} className="text-sm text-red-400 hover:text-red-600">Cancel</button>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-400">
                {hasInsurance && !billing.insuranceSkipped && (
                  <>
                    <span className={`flex items-center gap-1 ${billing.claimStatus === "approved" ? "text-green-600" : ""}`}>
                      {billing.claimStatus === "approved" ? <CheckCircle className="w-3.5 h-3.5" /> : <div className="w-3.5 h-3.5 rounded-full border-2 border-gray-300" />}
                      Insurance
                    </span>
                    <ChevronRight className="w-3 h-3" />
                  </>
                )}
                <span className={`flex items-center gap-1 ${billing.paymentStatus === "done" ? "text-green-600" : ""}`}>
                  {billing.paymentStatus === "done" ? <CheckCircle className="w-3.5 h-3.5" /> : <div className="w-3.5 h-3.5 rounded-full border-2 border-gray-300" />}
                  Payment
                </span>
              </div>
              <Button disabled className="bg-gray-100 text-gray-400 cursor-not-allowed px-6 flex items-center gap-2">
                <Package className="w-4 h-4" /> Complete Payment First
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Queue Card ────────────────────────────────────────────────────────────────

function QueueCard({
  item,
  isLoading,
  onSelect,
}: {
  item:      DispenseQueueItem;
  isLoading: boolean;
  onSelect:  () => void;
}) {
  const createdDate = new Date(item.createdAt);
  const formatted   = createdDate.toLocaleString("en-US", {
    month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });

  return (
    <div
      onClick={isLoading ? undefined : onSelect}
      className={`p-5 hover:bg-gray-50 flex items-center gap-5 transition-colors border-b border-gray-50 last:border-b-0 ${isLoading ? "opacity-50 cursor-wait" : "cursor-pointer group"}`}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-2.5 flex-wrap">
          <span className="px-2.5 py-0.5 rounded-md text-xs font-semibold bg-blue-100 text-blue-700">
            {item.status}
          </span>
          <code className="text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded font-mono">{item.prescriptionId}</code>
          {item.insuranceProvider && (
            <span className="flex items-center gap-1 text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
              <Shield className="w-3 h-3" /> {item.insuranceProvider}
            </span>
          )}
        </div>
        <div className="grid grid-cols-4 gap-6">
          <div>
            <div className="text-xs text-gray-400 mb-0.5">Patient</div>
            <div className="text-gray-900 font-medium text-sm">{item.patientName}</div>
            <div className="text-xs text-gray-400">{item.patientId}</div>
          </div>
          <div>
            <div className="text-xs text-gray-400 mb-0.5">Doctor</div>
            <div className="text-gray-700 text-sm">{item.doctorName}</div>
          </div>
          <div>
            <div className="text-xs text-gray-400 mb-0.5">Medications</div>
            <div className="text-gray-900 text-sm">{item.medicineCount} item{item.medicineCount !== 1 ? "s" : ""}</div>
          </div>
          <div>
            <div className="text-xs text-gray-400 mb-0.5">Time</div>
            <div className="text-gray-600 text-sm">{formatted}</div>
          </div>
        </div>
      </div>
      <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-blue-500 transition-colors flex-shrink-0" />
    </div>
  );
}



