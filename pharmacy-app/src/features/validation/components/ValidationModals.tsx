import React from "react";
import { XCircle } from "lucide-react";

import type { AllergyAlert } from "../types/validation.types";
import { pillToneBySeverity } from "../utils/prescriptionValidationUtils";

import Modal from "@components/common/Modal/Modal";
import { Pill } from "@components/common/Pill/Pill";

function ModalShell({
  open,
  onClose,
  title,
  children,
  footer,
  widthClass = "max-w-lg",
}: {
  open: boolean;
  onClose: () => void;
  title: string | React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  widthClass?: string;
}) {
  return (
    <Modal isOpen={open} onClose={onClose} className={`${widthClass} w-full`}>
      {/* Header */}
      <div className="flex items-center justify-between p-5 border-b">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600"
          aria-label="Close"
        >
          ✕
        </button>
      </div>

      {/* Body */}
      <div className="p-5">{children}</div>

      {/* Footer */}
      {footer && (
        <div className="p-4 border-t flex justify-end gap-3">{footer}</div>
      )}
    </Modal>
  );
}

export default function ValidationModals({
  allergyFor,
  rejectLineOpen,
  rejectLineReason,
  rejectAllOpen,
  rejectAllReason,
  submitting,

  onCloseAllergy,
  onCloseRejectLine,
  onRejectLineReasonChange,
  onConfirmRejectLine,

  onCloseRejectAll,
  onRejectAllReasonChange,
  onConfirmRejectAll,
}: {
  allergyFor: AllergyAlert | null;

  rejectLineOpen: boolean;
  rejectLineReason: string;

  rejectAllOpen: boolean;
  rejectAllReason: string;

  submitting: boolean;

  onCloseAllergy: () => void;

  onCloseRejectLine: () => void;
  onRejectLineReasonChange: (v: string) => void;
  onConfirmRejectLine: () => void;

  onCloseRejectAll: () => void;
  onRejectAllReasonChange: (v: string) => void;
  onConfirmRejectAll: () => void;
}) {
  return (
    <>
      {/* Allergy modal */}
      <ModalShell
        open={!!allergyFor}
        onClose={onCloseAllergy}
        title="Safety Alert Details"
        widthClass="max-w-xl"
        footer={
          <button
            onClick={onCloseAllergy}
            className="px-4 py-2 rounded-md border text-gray-700 hover:bg-gray-50"
          >
            Close
          </button>
        }
      >
        {allergyFor && (
          <div className="space-y-4 text-sm">
            <Row label="Issue Type" value={allergyFor.issueType} />
            <Row
              label="Severity"
              value={
                <Pill tone={pillToneBySeverity(allergyFor.severity)}>
                  {allergyFor.severity === "High" && <XCircle size={14} />}
                  {allergyFor.severity}
                </Pill>
              }
            />
            <Row label="Allergen" value={allergyFor.affectedBy} />
            <div>
              <div className="text-xs text-gray-500 mb-1">Message</div>
              <div className="p-3 rounded-md bg-red-50 text-red-800 border border-red-200">
                {allergyFor.message}
              </div>
            </div>
          </div>
        )}
      </ModalShell>

      {/* Reject line modal */}
      <ModalShell
        open={rejectLineOpen}
        onClose={onCloseRejectLine}
        title="Reject Medication"
        footer={
          <>
            <button
              onClick={onCloseRejectLine}
              className="px-4 py-2 rounded-md border text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={onConfirmRejectLine}
              className="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
              disabled={!rejectLineReason.trim()}
            >
              Confirm Rejection
            </button>
          </>
        }
      >
        <div className="space-y-2">
          <div className="text-sm text-gray-700">Please provide a reason for rejection:</div>
          <textarea
            rows={4}
            className="w-full border rounded-md p-2"
            placeholder="Enter reason for rejection..."
            value={rejectLineReason}
            onChange={(e) => onRejectLineReasonChange(e.target.value)}
          />
        </div>
      </ModalShell>

      {/* Reject all modal */}
      <ModalShell
        open={rejectAllOpen}
        onClose={onCloseRejectAll}
        title="Reject Entire Prescription"
        footer={
          <>
            <button
              onClick={onCloseRejectAll}
              disabled={submitting}
              className="px-4 py-2 rounded-md border text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={onConfirmRejectAll}
              disabled={submitting || !rejectAllReason.trim()}
              className="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
            >
              {submitting ? "Submitting..." : "Confirm Rejection"}
            </button>
          </>
        }
      >
        <div className="space-y-2">
          <div className="text-sm text-gray-700">Please provide a reason for rejection:</div>
          <textarea
            rows={4}
            className="w-full border rounded-md p-2"
            placeholder="Enter reason for rejection..."
            value={rejectAllReason}
            onChange={(e) => onRejectAllReasonChange(e.target.value)}
          />
        </div>
      </ModalShell>
    </>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-3 gap-2 items-start">
      <div className="col-span-1 text-xs text-gray-500">{label}</div>
      <div className="col-span-2 text-gray-900">{value}</div>
    </div>
  );
}