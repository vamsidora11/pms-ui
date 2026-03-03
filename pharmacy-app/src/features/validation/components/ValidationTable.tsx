import clsx from "clsx";
import { AlertTriangle, XCircle } from "lucide-react";

import type {
  PrescriptionDetailsDto,
  PrescriptionMedicineDto,
} from "@prescription/types/prescription.types";
import type { AllergyAlert } from "../types/validation.types";

import {
  isReviewedDecision,
  mapInteractionLevel,
  pillToneBySeverity,
  type Severity,
} from "../utils/prescriptionValidationUtils";

import { Pill } from "./Pill";

export default function ValidationTable({
  data,
  submitting,
  onAccept,
  onOpenReject,
  onOpenAllergy,
}: {
  data: PrescriptionDetailsDto;
  submitting: boolean;
  onAccept: (id: string) => void;
  onOpenReject: (id: string) => void;
  onOpenAllergy: (alert: AllergyAlert) => void;
}) {
  return (
    <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
      <div className="p-5 border-b">
        <h2 className="font-semibold text-gray-900">Prescription Validation</h2>
        <div className="text-sm text-gray-500">
          Backend safety validation only (allergy + interaction).
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-gray-500 border-b">
              <Th>Medicine</Th>
              <Th align="center">Prescribed</Th>
              <Th align="center">Approved/Fill</Th>
              <Th align="center">Allergy</Th>
              <Th align="center">Interaction</Th>
              <Th align="center">Review</Th>
              <Th align="center">Decision</Th>
            </tr>
          </thead>

          <tbody className="divide-y">
            {data.medicines.map((m: PrescriptionMedicineDto) => {
              const id = m.prescriptionMedicineId;
              const reviewDecision = m.pharmacistReview?.decision;
              const isFinalized = isReviewedDecision(reviewDecision);

              return (
                <tr key={id} className="align-top">
                  <Td>
                    <div className="font-medium text-gray-900">{m.name}</div>
                    <div className="text-gray-500">{m.strength}</div>
                  </Td>

                  <Td align="center">{m.prescribedQuantity}</Td>

                  <Td align="center">
                    <Pill tone="blue">
                      {typeof m.approvedQuantityPerFill === "number"
                        ? m.approvedQuantityPerFill
                        : "Pending"}
                    </Pill>
                  </Td>

                  <Td align="center">
                    {m.validation?.drugAllergy?.isPresent ? (
                      <button
                        className="inline-flex items-center gap-1"
                        onClick={() => {
                          const allergy = m.validation?.drugAllergy;
                          const first = allergy?.allergies?.[0];
                          if (!first) return;

                          onOpenAllergy({
                            issueType: "Drug Allergy",
                            severity: first.severity as Severity,
                            affectedBy: first.allergenCode,
                            message: first.message,
                            allergenCode: first.allergenCode,
                          });
                        }}
                      >
                        <Pill tone={pillToneBySeverity(m.validation.drugAllergy.overallSeverity)}>
                          {m.validation.drugAllergy.overallSeverity === "High" && (
                            <XCircle size={14} />
                          )}
                          {m.validation.drugAllergy.overallSeverity || "Unknown"}
                        </Pill>
                      </button>
                    ) : (
                      <Pill tone="green">None</Pill>
                    )}
                  </Td>

                  <Td align="center">
                    {m.validation?.drugInteraction?.isPresent ? (
                      <Pill tone={pillToneBySeverity(m.validation.drugInteraction.overallSeverity)}>
                        <AlertTriangle size={14} />
                        {mapInteractionLevel(m.validation.drugInteraction.overallSeverity)}
                      </Pill>
                    ) : (
                      <Pill tone="green">None</Pill>
                    )}
                  </Td>

                  <Td align="center">
                    <Pill tone={isFinalized ? "green" : "amber"}>
                      {isFinalized ? reviewDecision : "Pending"}
                    </Pill>
                  </Td>

                  <Td align="center">
                    <div className="inline-flex items-center gap-2">
                      <button
                        onClick={() => onAccept(id)}
                        disabled={submitting || isFinalized}
                        className={clsx(
                          "px-2.5 py-1 rounded-md text-xs border disabled:opacity-50 disabled:cursor-not-allowed",
                          reviewDecision === "Accepted"
                            ? "bg-green-600 text-white border-green-600"
                            : "text-green-700 border-green-200 hover:bg-green-50"
                        )}
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => onOpenReject(id)}
                        disabled={submitting || isFinalized}
                        className={clsx(
                          "px-2.5 py-1 rounded-md text-xs border disabled:opacity-50 disabled:cursor-not-allowed",
                          reviewDecision === "Rejected"
                            ? "bg-red-600 text-white border-red-600"
                            : "text-red-700 border-red-200 hover:bg-red-50"
                        )}
                      >
                        Reject
                      </button>
                    </div>
                  </Td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Th({
  children,
  align = "left",
}: {
  children: React.ReactNode;
  align?: "left" | "center" | "right";
}) {
  return (
    <th
      className={clsx(
        "px-5 py-3 text-xs font-medium uppercase tracking-wide",
        align === "center" && "text-center",
        align === "right" && "text-right"
      )}
    >
      {children}
    </th>
  );
}

function Td({
  children,
  align = "left",
}: {
  children: React.ReactNode;
  align?: "left" | "center" | "right";
}) {
  return (
    <td
      className={clsx(
        "px-5 py-4 align-middle",
        align === "center" && "text-center",
        align === "right" && "text-right"
      )}
    >
      {children}
    </td>
  );
}
