import React from "react";
import clsx from "clsx";
import { AlertTriangle, CheckCircle2, XCircle } from "lucide-react";

import type { PrescriptionDetailsDto, PrescriptionMedicineDto } from "@prescription/types/prescription.types";
import type { AllergyAlert, LineDecision } from "../types/validation.types";

import {
  computeValidation,
  mapInteractionLevel,
  pillToneBySeverity,
  type Severity,
  type ValidationResult,
} from "../utils/prescriptionValidationUtils";

import { Pill } from "./Pill";

export default function ValidationTable({
  data,
  adjusted,
  decisions,
  overallResult,
  onAdjust,
  onAccept,
  onOpenReject,
  onOpenAllergy,
}: {
  data: PrescriptionDetailsDto;
  adjusted: Record<string, number>;
  decisions: Record<string, LineDecision>;
  overallResult: ValidationResult;
  onAdjust: (id: string, qty: number) => void;
  onAccept: (id: string) => void;
  onOpenReject: (id: string) => void;
  onOpenAllergy: (alert: AllergyAlert) => void;
}) {
  return (
    <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
      <div className="p-5 border-b flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-gray-900">Prescription Validation</h2>
          <div className="text-sm text-gray-500">
            Overall: <StatusPill result={overallResult} />
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-gray-500 border-b">
              <Th>Medicine</Th>
              <Th align="center">Prescribed</Th>
              <Th align="center">Adjusted</Th>
              <Th align="center">Stock</Th>
              <Th align="center">Allergy</Th>
              <Th align="center">Interaction</Th>
              <Th align="center">Result</Th>
              <Th align="center">Decision</Th>
            </tr>
          </thead>

          <tbody className="divide-y">
            {data.medicines.map((m: PrescriptionMedicineDto) => {
              const id = m.prescriptionMedicineId;
              const adjustedQty = adjusted[id] ?? m.prescribedQuantity;
              const vr = computeValidation(m, adjustedQty);
              const decision = decisions[id];

              const stockInfo = m.validation?.lowStock;
              const stockOk = stockInfo ? stockInfo.availableQty >= m.prescribedQuantity : true;

              return (
                <tr key={id} className="align-top">
                  <Td>
                    <div className="font-medium text-gray-900">{m.name}</div>
                    <div className="text-gray-500">{m.strength}</div>
                  </Td>

                  <Td align="center">{m.prescribedQuantity}</Td>

                  <Td align="center">
                    <div className="inline-flex items-center gap-2">
                      <input
                        type="number"
                        value={adjustedQty}
                        onChange={(e) => onAdjust(id, Number(e.target.value))}
                        className="w-20 px-2 py-1 border rounded-md"
                      />
                      {stockInfo && (
                        <button
                          onClick={() => onAdjust(id, stockInfo.availableQty)}
                          className="text-blue-600 hover:text-blue-700 text-xs px-2 py-0.5 border rounded-md bg-blue-50"
                        >
                          Max
                        </button>
                      )}
                    </div>
                  </Td>

                  <Td align="center">
                    {stockInfo ? (
                      <Pill tone={stockOk ? "green" : "amber"}>
                        {stockInfo.availableQty} / {stockInfo.requiredQty}
                      </Pill>
                    ) : (
                      <Pill tone="green">Sufficient</Pill>
                    )}
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
                          {m.validation.drugAllergy.overallSeverity === "High" && <XCircle size={14} />}
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
                    <StatusPill result={vr} />
                  </Td>

                  <Td align="center">
                    <div className="inline-flex items-center gap-2">
                      <button
                        onClick={() => onAccept(id)}
                        className={clsx(
                          "px-2.5 py-1 rounded-md text-xs border",
                          decision === "Accepted"
                            ? "bg-green-600 text-white border-green-600"
                            : "text-green-700 border-green-200 hover:bg-green-50"
                        )}
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => onOpenReject(id)}
                        className={clsx(
                          "px-2.5 py-1 rounded-md text-xs border",
                          decision === "Rejected"
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

function StatusPill({ result }: { result: ValidationResult }) {
  if (result === "Blocked")
    return (
      <Pill tone="red">
        <XCircle size={14} /> Blocked
      </Pill>
    );
  if (result === "Partial")
    return (
      <Pill tone="amber">
        <AlertTriangle size={14} /> Partial
      </Pill>
    );
  return (
    <Pill tone="green">
      <CheckCircle2 size={14} /> OK
    </Pill>
  );
}

function Th({ children, align = "left" }: { children: React.ReactNode; align?: "left" | "center" | "right" }) {
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

function Td({ children, align = "left" }: { children: React.ReactNode; align?: "left" | "center" | "right" }) {
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