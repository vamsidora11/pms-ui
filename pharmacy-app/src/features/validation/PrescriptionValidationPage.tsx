import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  XCircle,
} from "lucide-react";
import clsx from "clsx";
import { getPrescriptionById } from "@api/prescription";
import api from "@api/axiosInstance";
import { ENDPOINTS } from "@api/endpoints";
import type {
  PrescriptionDetailsDto,
  PrescriptionMedicineDto,
  AllergyValidationItemDto,
} from "@api/prescription.types";

/* =========================
   Types
========================= */
type Severity = "High" | "Moderate" | "Low" | "None";
type InteractionLevel = "None" | "Minor" | "Moderate" | "Major";
type ValidationResult = "Blocked" | "Partial" | "OK";
type LineDecision = "Accepted" | "Rejected" | null;

interface AllergyAlert {
  issueType: string;
  severity: Severity;
  affectedBy: string;
  message: string;
  allergenCode: string;
}

/* =========================
   Helpers (UI + logic)
========================= */

function formatDateTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString();
}

function pillToneBySeverity(
  s: string | null | undefined,
): "red" | "amber" | "yellow" | "green" {
  switch (s) {
    case "High":
      return "red";
    case "Moderate":
      return "amber";
    case "Low":
      return "yellow";
    default:
      return "green";
  }
}

function computeValidation(
  medicine: PrescriptionMedicineDto,
  adjustedQty: number,
): ValidationResult {
  // Check for high severity allergy
  if (medicine.validation?.drugAllergy?.overallSeverity === "High") {
    return "Blocked";
  }

  // Check if stock is insufficient
  if (
    medicine.validation?.lowStock?.isPresent &&
    medicine.validation.lowStock.availableQty < adjustedQty
  ) {
    return "Partial";
  }

  return "OK";
}

function mapInteractionLevel(
  severity: string | null | undefined,
): InteractionLevel {
  switch (severity) {
    case "High":
      return "Major";
    case "Moderate":
      return "Moderate";
    case "Low":
      return "Minor";
    default:
      return "None";
  }
}

/* =============== Small UI bits =============== */

function SectionCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl border shadow-sm">
      <div className="p-5 border-b">
        <h2 className="font-semibold text-gray-900">{title}</h2>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function Pill({
  children,
  tone = "gray",
  soft = true,
}: {
  children: React.ReactNode;
  tone?: "red" | "green" | "blue" | "gray" | "amber" | "yellow";
  soft?: boolean;
}) {
  const base = soft
    ? {
        red: "bg-red-100 text-red-800",
        green: "bg-green-100 text-green-800",
        blue: "bg-blue-100 text-blue-800",
        gray: "bg-gray-100 text-gray-700",
        amber: "bg-amber-100 text-amber-800",
        yellow: "bg-yellow-100 text-yellow-800",
      }
    : {
        red: "bg-red-600 text-white",
        green: "bg-green-600 text-white",
        blue: "bg-blue-600 text-white",
        gray: "bg-gray-600 text-white",
        amber: "bg-amber-600 text-white",
        yellow: "bg-yellow-600 text-white",
      };
  return (
    <span
      className={clsx(
        "px-2 py-0.5 rounded text-xs inline-flex items-center gap-1",
        base[tone],
      )}
    >
      {children}
    </span>
  );
}

function StatusPill({ result }: { result: ValidationResult }) {
  if (result === "Blocked")
    return (
      <Pill tone="red">
        <XCircle size={14} />
        Blocked
      </Pill>
    );
  if (result === "Partial")
    return (
      <Pill tone="amber">
        <AlertTriangle size={14} />
        Partial
      </Pill>
    );
  return (
    <Pill tone="green">
      <CheckCircle2 size={14} />
      OK
    </Pill>
  );
}

function Modal({
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
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div
        className={clsx(
          "absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl shadow-xl border",
          widthClass,
        )}
        role="dialog"
        aria-modal="true"
      >
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
        <div className="p-5">{children}</div>
        {footer && (
          <div className="p-4 border-t flex justify-end gap-3">{footer}</div>
        )}
      </div>
    </div>
  );
}

/* =========================
   Main Component
========================= */

export default function PrescriptionValidationDetails() {
  const { rxId = "" } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState<PrescriptionDetailsDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // per-line decisions & adjusted qty
  const [decisions, setDecisions] = useState<Record<string, LineDecision>>({});
  const [reasons, setReasons] = useState<Record<string, string>>({});
  const [adjusted, setAdjusted] = useState<Record<string, number>>({});

  // modals
  const [allergyFor, setAllergyFor] = useState<AllergyAlert | null>(null);
  const [rejectLineId, setRejectLineId] = useState<string | null>(null);
  const [rejectAllOpen, setRejectAllOpen] = useState(false);

  // Fetch prescription details
  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);

    getPrescriptionById(rxId)
      .then((res) => {
        if (!alive) return;
        setData(res);

        // Initialize states
        const adj: Record<string, number> = {};
        const dcs: Record<string, LineDecision> = {};

        res.medicines.forEach((m) => {
          adj[m.prescriptionMedicineId] = m.prescribedQuantity;
          dcs[m.prescriptionMedicineId] = null;
        });

        setAdjusted(adj);
        setDecisions(dcs);
      })
      .catch((e) => {
        if (alive) {
          setError(
            e.response?.data?.message ||
              e.message ||
              "Failed to load prescription",
          );
        }
      })
      .finally(() => alive && setLoading(false));

    return () => {
      alive = false;
    };
  }, [rxId]);

  // Compute overall validation result
  const overallResult = useMemo<ValidationResult>(() => {
    if (!data) return "OK";

    const results = data.medicines.map((m) =>
      computeValidation(
        m,
        adjusted[m.prescriptionMedicineId] ?? m.prescribedQuantity,
      ),
    );

    if (results.includes("Blocked")) return "Blocked";
    if (results.includes("Partial")) return "Partial";
    return "OK";
  }, [data, adjusted]);

  // Get patient allergies from the first medicine's validation
  const patientAllergies = useMemo(() => {
    if (!data) return [];

    const allergies = new Set<string>();
    data.medicines.forEach((m) => {
      if (m.validation?.drugAllergy?.allergies) {
        m.validation.drugAllergy.allergies.forEach((a) => {
          allergies.add(a.allergenCode);
        });
      }
    });

    return Array.from(allergies);
  }, [data]);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-4">
        <div className="h-6 w-40 bg-gray-200 rounded animate-pulse mb-4" />
        <div className="h-32 bg-gray-200 rounded-2xl animate-pulse mb-6" />
        <div className="h-80 bg-gray-200 rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-5xl mx-auto p-4">
        <button
          onClick={() => navigate(-1)}
          className="text-gray-600 hover:text-gray-800 inline-flex items-center gap-1 mb-4"
        >
          <ChevronLeft size={18} />
          Back to Queue
        </button>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <XCircle className="text-red-600 mt-0.5" size={20} />
            <div>
              <h3 className="font-semibold text-red-900">
                Error Loading Prescription
              </h3>
              <p className="text-red-700 text-sm mt-1">
                {error || "No data available"}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const onAccept = (id: string) =>
    setDecisions((d) => ({ ...d, [id]: "Accepted" }));
  const onReject = (id: string) => setRejectLineId(id);

  const confirmRejectLine = () => {
    if (!rejectLineId) return;
    setDecisions((d) => ({ ...d, [rejectLineId]: "Rejected" }));
    setRejectLineId(null);
  };

  const approveAll = async () => {
    setSubmitting(true);

    try {
      // Build review payload
      const reviewPayload = {
        medicines: data.medicines.map((m) => ({
          prescriptionMedicineId: m.prescriptionMedicineId,
          decision: decisions[m.prescriptionMedicineId] || "Accepted",
          overrideReason:
            decisions[m.prescriptionMedicineId] === "Rejected"
              ? reasons[m.prescriptionMedicineId]
              : null,
        })),
      };

      await api.put(`${ENDPOINTS.prescriptions}/${rxId}/review`, reviewPayload);

      navigate("/pharmacist/validation", {
        state: { message: "Prescription approved successfully" },
      });
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to approve prescription");
    } finally {
      setSubmitting(false);
    }
  };

  const confirmRejectAll = async () => {
    setSubmitting(true);

    try {
      // Build review payload - reject all medicines
      const reviewPayload = {
        medicines: data.medicines.map((m) => ({
          prescriptionMedicineId: m.prescriptionMedicineId,
          decision: "Rejected",
          overrideReason: reasons["_ALL_"] || "Entire prescription rejected",
        })),
      };

      await api.put(`${ENDPOINTS.prescriptions}/${rxId}/review`, reviewPayload);

      setRejectAllOpen(false);
      navigate("/pharmacist/validation", {
        state: { message: "Prescription rejected successfully" },
      });
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to reject prescription");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <button
            onClick={() => navigate(-1)}
            className="text-gray-600 hover:text-gray-800 inline-flex items-center gap-1 mb-2"
          >
            <ChevronLeft size={18} />
            Back to Queue
          </button>
          <h1 className="text-2xl font-semibold text-gray-900">
            Prescription Validation
          </h1>
          <p className="text-gray-500">
            Review and validate prescription details
          </p>
        </div>
        <div className="self-start">
          <Pill tone="amber">{data.id}</Pill>
        </div>
      </div>

      {/* Patient Info */}
      <SectionCard title="Patient Information">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
          <KV label="Patient Name" value={data.patientName} />
          <KV label="Patient ID" value={data.patientId} />
          <div className="min-w-0">
            <div className="text-xs text-gray-500">Allergies</div>
            <div className="flex flex-wrap gap-2">
              {patientAllergies.length > 0 ? (
                patientAllergies.map((a) => (
                  <Pill key={a} tone="amber">
                    {a}
                  </Pill>
                ))
              ) : (
                <span className="text-gray-900">None</span>
              )}
            </div>
          </div>
          <KV label="Submission Time" value={formatDateTime(data.createdAt)} />
        </div>
      </SectionCard>

      {/* Validation Table */}
      <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
        <div className="p-5 border-b">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-gray-900">
                Prescription Validation
              </h2>
              <div className="text-sm text-gray-500">
                Doctor: {data.prescriber.name} ({data.prescriber.id})
              </div>
            </div>
            <div>
              Overall: <StatusPill result={overallResult} />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-gray-500 border-b">
                <Th>Medicine</Th>
                <Th align="center">Prescribed Qty</Th>
                <Th align="center">Adjusted Qty</Th>
                <Th align="center">Available Stock</Th>
                <Th align="center">Allergy</Th>
                <Th align="center">Drug Interaction</Th>
                <Th align="center">Validation Result</Th>
                <Th align="center">Decision</Th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {data.medicines.map((medicine) => {
                const adjustedQty =
                  adjusted[medicine.prescriptionMedicineId] ??
                  medicine.prescribedQuantity;
                const vr = computeValidation(medicine, adjustedQty);
                const dec = decisions[medicine.prescriptionMedicineId];

                const stockInfo = medicine.validation?.lowStock;
                const stockGood = stockInfo
                  ? stockInfo.availableQty >= medicine.prescribedQuantity
                  : true;

                return (
                  <tr
                    key={medicine.prescriptionMedicineId}
                    className="align-top"
                  >
                    <Td>
                      <div className="font-medium text-gray-900">
                        {medicine.name}
                      </div>
                      <div className="text-gray-500">{medicine.strength}</div>
                    </Td>

                    <Td align="center">
                      <span className="text-gray-900">
                        {medicine.prescribedQuantity}
                      </span>
                    </Td>

                    <Td align="center">
                      <div className="inline-flex items-center gap-2">
                        <input
                          type="number"
                          value={adjustedQty}
                          onChange={(e) =>
                            setAdjusted((a) => ({
                              ...a,
                              [medicine.prescriptionMedicineId]: Math.max(
                                0,
                                Number(e.target.value),
                              ),
                            }))
                          }
                          className="w-20 px-2 py-1 border rounded-md"
                        />
                        {stockInfo && (
                          <button
                            onClick={() => {
                              if (
                                stockInfo.requiredQty > stockInfo.availableQty
                              ) {
                                setAdjusted((a) => ({
                                  ...a,
                                  [medicine.prescriptionMedicineId]:
                                    stockInfo.availableQty,
                                }));
                              }
                            }}
                            className="text-blue-600 hover:text-blue-700 text-xs px-2 py-0.5 border rounded-md bg-blue-50"
                          >
                            Max
                          </button>
                        )}
                      </div>
                    </Td>

                    <Td align="center">
                      {stockInfo ? (
                        <Pill tone={stockGood ? "green" : "amber"}>
                          {stockInfo.availableQty} / {stockInfo.requiredQty}
                        </Pill>
                      ) : (
                        <Pill tone="green">Sufficient</Pill>
                      )}
                    </Td>

                    <Td align="center">
                      {medicine.validation?.drugAllergy?.isPresent ? (
                        <button
                          onClick={() => {
                            const allergy = medicine.validation?.drugAllergy;
                            if (allergy && allergy.allergies.length > 0) {
                              const firstAllergy = allergy.allergies[0];
                              setAllergyFor({
                                issueType: "Drug Allergy",
                                severity: firstAllergy.severity as Severity,
                                affectedBy: firstAllergy.allergenCode,
                                message: firstAllergy.message,
                                allergenCode: firstAllergy.allergenCode,
                              });
                            }
                          }}
                          className="inline-flex items-center gap-1"
                        >
                          <Pill
                            tone={pillToneBySeverity(
                              medicine.validation.drugAllergy.overallSeverity,
                            )}
                          >
                            {medicine.validation.drugAllergy.overallSeverity ===
                              "High" && <XCircle size={14} />}
                            {medicine.validation.drugAllergy.overallSeverity ||
                              "Unknown"}
                          </Pill>
                        </button>
                      ) : (
                        <Pill tone="green">None</Pill>
                      )}
                    </Td>

                    <Td align="center">
                      {medicine.validation?.drugInteraction?.isPresent ? (
                        <Pill
                          tone={pillToneBySeverity(
                            medicine.validation.drugInteraction.overallSeverity,
                          )}
                        >
                          <AlertTriangle size={14} />
                          {mapInteractionLevel(
                            medicine.validation.drugInteraction.overallSeverity,
                          )}
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
                          onClick={() =>
                            onAccept(medicine.prescriptionMedicineId)
                          }
                          className={clsx(
                            "px-2.5 py-1 rounded-md text-xs border",
                            dec === "Accepted"
                              ? "bg-green-600 text-white border-green-600"
                              : "text-green-700 border-green-200 hover:bg-green-50",
                          )}
                        >
                          Accept
                        </button>
                        <button
                          onClick={() =>
                            onReject(medicine.prescriptionMedicineId)
                          }
                          className={clsx(
                            "px-2.5 py-1 rounded-md text-xs border",
                            dec === "Rejected"
                              ? "bg-red-600 text-white border-red-600"
                              : "text-red-700 border-red-200 hover:bg-red-50",
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

        {/* Footer actions */}
        <div className="p-5 border-t flex flex-col sm:flex-row gap-3 sm:justify-end">
          <button
            onClick={() => setRejectAllOpen(true)}
            disabled={submitting}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md border text-red-700 border-red-300 hover:bg-red-50 disabled:opacity-50"
          >
            <XCircle size={18} />
            Reject Entire Prescription
          </button>
          <button
            onClick={approveAll}
            disabled={submitting}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            <CheckCircle2 size={18} />
            {submitting ? "Submitting..." : "Approve Prescription"}
          </button>
        </div>
      </div>

      {/* Allergy modal */}
      <Modal
        open={!!allergyFor}
        onClose={() => setAllergyFor(null)}
        title="Safety Alert Details"
        widthClass="max-w-xl"
        footer={
          <button
            onClick={() => setAllergyFor(null)}
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
            <div className="text-sm">
              <div className="text-xs text-gray-500 mb-1">Message</div>
              <div className="p-3 rounded-md bg-red-50 text-red-800 border border-red-200">
                {allergyFor.message}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Reject line modal */}
      <Modal
        open={!!rejectLineId}
        onClose={() => setRejectLineId(null)}
        title={`Reject ${rejectLineId ? displayMedName(data, rejectLineId) : "Medication"}`}
        footer={
          <>
            <button
              onClick={() => setRejectLineId(null)}
              className="px-4 py-2 rounded-md border text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={confirmRejectLine}
              className="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
              disabled={!reasons[rejectLineId ?? ""]?.trim()}
            >
              Confirm Rejection
            </button>
          </>
        }
      >
        <div className="space-y-2">
          <div className="text-sm text-gray-700">
            Please provide a reason for rejection:
          </div>
          <textarea
            rows={4}
            className="w-full border rounded-md p-2"
            placeholder="Enter reason for rejection..."
            value={reasons[rejectLineId ?? ""] ?? ""}
            onChange={(e) =>
              setReasons((r) => ({
                ...r,
                [rejectLineId ?? ""]: e.target.value,
              }))
            }
          />
        </div>
      </Modal>

      {/* Reject entire prescription modal */}
      <Modal
        open={rejectAllOpen}
        onClose={() => setRejectAllOpen(false)}
        title="Reject Entire Prescription"
        footer={
          <>
            <button
              onClick={() => setRejectAllOpen(false)}
              disabled={submitting}
              className="px-4 py-2 rounded-md border text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={confirmRejectAll}
              disabled={submitting || !reasons["_ALL_"]?.trim()}
              className="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
            >
              {submitting ? "Submitting..." : "Confirm Rejection"}
            </button>
          </>
        }
      >
        <div className="space-y-2">
          <div className="text-sm text-gray-700">
            Please provide a reason for rejection:
          </div>
          <textarea
            rows={4}
            className="w-full border rounded-md p-2"
            placeholder="Enter reason for rejection..."
            value={reasons["_ALL_"] ?? ""}
            onChange={(e) =>
              setReasons((r) => ({
                ...r,
                _ALL_: e.target.value,
              }))
            }
          />
        </div>
      </Modal>
    </div>
  );
}

/* =========================
   Local UI helpers
========================= */

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
        align === "right" && "text-right",
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
        align === "right" && "text-right",
      )}
    >
      {children}
    </td>
  );
}

function KV({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="text-gray-900">{value ?? "—"}</div>
    </div>
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

function displayMedName(data: PrescriptionDetailsDto, lineId: string) {
  const medicine = data.medicines.find(
    (m) => m.prescriptionMedicineId === lineId,
  );
  return medicine ? `${medicine.name} ${medicine.strength}` : "Medication";
}
