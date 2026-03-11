import clsx from "clsx";
import { AlertTriangle, XCircle } from "lucide-react";

import type { PrescriptionDetails, PrescriptionLine } from "@prescription/domain/model";
import type { AllergyAlert, LineDecision } from "../types/validation.types";
import {
  isReviewedDecision,
  mapInteractionLevel,
  pillToneBySeverity,
} from "../utils/prescriptionValidationUtils";
import { Pill } from "../../../components/common/Pill/Pill";

export default function ValidationTable({
  data,
  submitting,
  decisions,
  onAccept,
  onOpenReject,
  onOpenAllergy,
}: {
  data: PrescriptionDetails;
  submitting: boolean;
  decisions: Record<string, LineDecision>;
  onAccept: (id: string) => void;
  onOpenReject: (id: string) => void;
  onOpenAllergy: (alert: AllergyAlert) => void;
}) {
  return (
    <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
      <div className="p-5 border-b">
        <h2 className="font-semibold text-gray-900">Prescription Validation</h2>
        <div className="text-sm text-gray-500">Read-only validation plus pharmacist review.</div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-gray-500 border-b">
              <Th>Medicine</Th>
              <Th align="center">Prescribed</Th>
              <Th align="center">Allergy</Th>
              <Th align="center">Interaction</Th>
              <Th align="center">Review</Th>
              <Th align="center">Decision</Th>
            </tr>
          </thead>

          <tbody className="divide-y">
            {data.medicines.map((line: PrescriptionLine) => {
              const id = line.lineId;
              const selectedDecision = decisions[id];
              const persistedDecision = line.review?.status;
              const reviewDecision =
                selectedDecision !== undefined ? selectedDecision : persistedDecision;
              const finalized = isReviewedDecision(persistedDecision);

              return (
                <tr key={id} className="align-top">
                  <Td>
                    <div className="font-medium text-gray-900">{line.name}</div>
                    <div className="text-gray-500">{line.strength}</div>
                  </Td>

                  <Td align="center">{line.quantityPrescribed}</Td>

                  <Td align="center">
                    {line.validation.hasAllergy ? (
                      <button
                        className="inline-flex items-center gap-1"
                        onClick={() =>
                          onOpenAllergy({
                            issueType: "Drug Allergy",
                            severity: line.validation.severity,
                            affectedBy: line.name,
                            message: "Potential allergy risk detected for this medicine.",
                            allergenCode: line.productId,
                          })
                        }
                      >
                        <Pill tone={pillToneBySeverity(line.validation.severity)}>
                          {line.validation.severity === "High" && <XCircle size={14} />}
                          {line.validation.severity}
                        </Pill>
                      </button>
                    ) : (
                      <Pill tone="green">None</Pill>
                    )}
                  </Td>

                  <Td align="center">
                    {line.validation.hasInteraction ? (
                      <div className="flex flex-col items-center gap-1">
                        <Pill tone={pillToneBySeverity(line.validation.severity)}>
                          <AlertTriangle size={14} />
                          {mapInteractionLevel(line.validation.severity)}
                        </Pill>
                        {line.validation.interactionDetails?.length ? (
                          <div className="text-xs text-gray-500">
                            with {line.validation.interactionDetails[0].productName}
                          </div>
                        ) : null}
                      </div>
                    ) : (
                      <Pill tone="green">None</Pill>
                    )}
                  </Td>

                  <Td align="center">
                    <Pill tone={finalized ? "green" : "amber"}>
                      {finalized ? persistedDecision : "Pending"}
                    </Pill>
                  </Td>

                  <Td align="center">
                    <div className="inline-flex items-center gap-2">
                      <button
                        onClick={() => onAccept(id)}
                        disabled={submitting}
                        className={clsx(
                          "px-2.5 py-1 rounded-md text-xs border disabled:opacity-50 disabled:cursor-not-allowed",
                          reviewDecision === "Approved"
                            ? "bg-green-600 text-white border-green-600"
                            : "text-green-700 border-green-200 hover:bg-green-50"
                        )}
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => onOpenReject(id)}
                        disabled={submitting}
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
