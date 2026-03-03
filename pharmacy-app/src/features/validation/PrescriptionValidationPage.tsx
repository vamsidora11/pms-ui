// import React, { useEffect, useMemo, useCallback } from "react";
// import { useNavigate, useParams } from "react-router-dom";
// import { CheckCircle2, ChevronLeft, XCircle } from "lucide-react";

// import { ROUTES } from "../../constants/routes";
// import { useToast } from "@components/common/Toast/useToast";

// import type { PrescriptionDetailsDto } from "@prescription/types/prescription.types";

// import { usePrescriptionDetails } from "@validation/hooks/usePrescriptionDetails";
// import { usePrescriptionReview } from "@validation/hooks/usePrescriptionReview";

// import { computeValidation, type ValidationResult } from "./utils/prescriptionValidationUtils";
// import { useValidationUiState } from "./hooks/useValidationUiState";
// import { formatDate } from "@utils/format";

// import { Pill } from "./components/Pill";
// import ValidationTable from "./components/ValidationTable";
// import ValidationModals from "./components/ValidationModals";

// export default function PrescriptionValidationDetailsPage() {
//   const { rxId = "" } = useParams();
//   const navigate = useNavigate();
//   const toast = useToast();

//   const { data, loading, error } = usePrescriptionDetails(rxId);
//   const { submitting, submitReview } = usePrescriptionReview(rxId);

//   const { ui, actions } = useValidationUiState();

//   // useEffect(() => {
//   //   if (data) actions.init(data);
//   // }, [data, actions]);
//   useEffect(() => {
//   if (!data) return;

//   // ✅ guard to avoid dispatching INIT repeatedly
//   if (ui.data?.id === data.id) return;

//   actions.init(data);
// }, [data?.id, ui.data?.id, actions.init]);

//   const viewData = (ui.data ?? data) as PrescriptionDetailsDto | null;

//   const backToQueue = useCallback(() => {
//     navigate(ROUTES.PHARMACIST.VALIDATION, { state: { refresh: true } });
//   }, [navigate]);

//   const overallResult = useMemo<ValidationResult>(() => {
//     if (!viewData) return "OK";
//     const results = viewData.medicines.map((m) =>
//       computeValidation(m, ui.adjusted[m.prescriptionMedicineId] ?? m.prescribedQuantity)
//     );
//     if (results.includes("Blocked")) return "Blocked";
//     if (results.includes("Partial")) return "Partial";
//     return "OK";
//   }, [viewData, ui.adjusted]);

//   const approvePrescription = useCallback(async () => {
//     if (!viewData) return;

//     // ✅ Default = Accepted, only explicit rejected stays rejected
//     const medicines = viewData.medicines.map((m) => {
//       const id = m.prescriptionMedicineId;
//       const decision = ui.decisions[id] ?? null;

//       const finalDecision: "Accepted" | "Rejected" =
//         decision === "Rejected" ? "Rejected" : "Accepted";

//       const reason = finalDecision === "Rejected" ? (ui.reasons[id]?.trim() || "") : null;

//       return {
//         prescriptionMedicineId: id,
//         decision: finalDecision,
//         overrideReason: finalDecision === "Rejected" ? reason : null,
//       };
//     });

//     const missingReason = medicines.some((x) => x.decision === "Rejected" && !x.overrideReason);
//     if (missingReason) {
//       toast.error("Cannot approve", "Please provide a reason for all rejected medicines.");
//       return;
//     }

//     const res = await submitReview({ medicines });
//     if (!res.ok) {
//       toast.error("Failed", res.message);
//       return;
//     }

//     toast.success("Success", "Prescription review submitted successfully.");
//     navigate(ROUTES.PHARMACIST.VALIDATION, { state: { refresh: true } });
//   }, [navigate, submitReview, toast, ui.decisions, ui.reasons, viewData]);

//   const confirmRejectAll = useCallback(async () => {
//     if (!viewData) return;

//     const reason = ui.reasons["_ALL_"]?.trim();
//     if (!reason) {
//       toast.error("Reason required", "Please provide a reason to reject the entire prescription.");
//       return;
//     }

//     const medicines = viewData.medicines.map((m) => ({
//       prescriptionMedicineId: m.prescriptionMedicineId,
//       decision: "Rejected" as const,
//       overrideReason: reason,
//     }));

//     const res = await submitReview({ medicines });
//     if (!res.ok) {
//       toast.error("Failed", res.message);
//       return;
//     }

//     toast.success("Success", "Prescription rejected successfully.");
//     actions.closeRejectAll();
//     navigate(ROUTES.PHARMACIST.VALIDATION, { state: { refresh: true } });
//   }, [actions, navigate, submitReview, toast, ui.reasons, viewData]);

//   if (loading) return <div className="max-w-6xl mx-auto p-4">Loading...</div>;

//   if (error || !viewData) {
//     return (
//       <div className="max-w-5xl mx-auto p-4">
//         <button
//           onClick={backToQueue}
//           className="text-gray-600 hover:text-gray-800 inline-flex items-center gap-1 mb-4"
//         >
//           <ChevronLeft size={18} /> Back to Queue
//         </button>
//         <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
//           {error || "No data available"}
//         </div>
//       </div>
//     );
//   }

//   const rejectLineId = ui.rejectLineId;
//   const rejectLineReason = ui.reasons[rejectLineId ?? ""] ?? "";

//   return (
//     <div className="max-w-6xl mx-auto p-4 space-y-6">
//       {/* Header */}
//       <div className="flex items-start justify-between">
//         <div>
//           <button
//             onClick={backToQueue}
//             className="text-gray-600 hover:text-gray-800 inline-flex items-center gap-1 mb-2"
//           >
//             <ChevronLeft size={18} />
//             Back to Queue
//           </button>
//           <h1 className="text-2xl font-semibold text-gray-900">Prescription Validation</h1>
//           <p className="text-gray-500">Review and validate prescription details</p>
//         </div>
//         <div className="self-start">
//           <Pill tone="amber">{viewData.id}</Pill>
//         </div>
//       </div>

//       {/* Patient info */}
//       <div className="bg-white rounded-2xl border shadow-sm">
//         <div className="p-5 border-b">
//           <h2 className="font-semibold text-gray-900">Patient Information</h2>
//         </div>
//         <div className="p-5 grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
//           <KV label="Patient Name" value={viewData.patientName} />
//           <KV label="Patient ID" value={viewData.patientId} />
//           <KV label="Submission Time" value={formatDate(viewData.createdAt)} />
//           <KV label="Doctor" value={`${viewData.prescriber.name} (${viewData.prescriber.id})`} />
//         </div>
//       </div>

//       {/* Table */}
//       <ValidationTable
//         data={viewData}
//         adjusted={ui.adjusted}
//         decisions={ui.decisions}
//         overallResult={overallResult}
//         onAdjust={actions.setAdjusted}
//         onAccept={actions.acceptLine}
//         onOpenReject={actions.openRejectLine}
//         onOpenAllergy={actions.openAllergy}
//       />

//       {/* Footer actions */}
//       <div className="p-5 border rounded-2xl shadow-sm bg-white flex flex-col sm:flex-row gap-3 sm:justify-end">
//         <button
//           onClick={actions.openRejectAll}
//           disabled={submitting}
//           className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md border text-red-700 border-red-300 hover:bg-red-50 disabled:opacity-50"
//         >
//           <XCircle size={18} />
//           Reject Entire Prescription
//         </button>

//         <button
//           onClick={approvePrescription}
//           disabled={submitting}
//           className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
//         >
//           <CheckCircle2 size={18} />
//           {submitting ? "Submitting..." : "Approve Prescription"}
//         </button>
//       </div>

//       {/* Modals */}
//       <ValidationModals
//         allergyFor={ui.allergyFor}
//         rejectLineOpen={!!rejectLineId}
//         rejectLineReason={rejectLineReason}
//         rejectAllOpen={ui.rejectAllOpen}
//         rejectAllReason={ui.reasons["_ALL_"] ?? ""}
//         submitting={submitting}
//         onCloseAllergy={actions.closeAllergy}
//         onCloseRejectLine={actions.closeRejectLine}
//         onRejectLineReasonChange={(v) => rejectLineId && actions.setReason(rejectLineId, v)}
//         onConfirmRejectLine={() => {
//           if (!rejectLineId) return;
//           if (!rejectLineReason.trim()) {
//             toast.error("Reason required", "Please enter a rejection reason.");
//             return;
//           }
//           actions.confirmRejectLine(rejectLineId);
//         }}
//         onCloseRejectAll={actions.closeRejectAll}
//         onRejectAllReasonChange={(v) => actions.setReason("_ALL_", v)}
//         onConfirmRejectAll={confirmRejectAll}
//       />
//     </div>
//   );
// }

// function KV({ label, value }: { label: string; value: React.ReactNode }) {
//   return (
//     <div className="min-w-0">
//       <div className="text-xs text-gray-500">{label}</div>
//       <div className="text-gray-900">{value ?? "—"}</div>
//     </div>
//   );
// }
import React, { useEffect, useMemo, useCallback, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { CheckCircle2, ChevronLeft, XCircle } from "lucide-react";

import { ROUTES } from "../../constants/routes";
import { useToast } from "@components/common/Toast/useToast";

import type { PrescriptionDetailsDto } from "@prescription/types/prescription.types";

import { usePrescriptionDetails } from "@validation/hooks/usePrescriptionDetails";
import { usePrescriptionReview } from "@validation/hooks/usePrescriptionReview";

import {
  computeValidation,
  getMaxApprovableQuantity,
  isValidApprovedQuantity,
  type ValidationResult,
} from "./utils/prescriptionValidationUtils";
import { useValidationUiState } from "./hooks/useValidationUiState";
import { formatDate } from "@utils/format";

import { Pill } from "./components/Pill";
import ValidationTable from "./components/ValidationTable";
import ValidationModals from "./components/ValidationModals";

export default function PrescriptionValidationDetailsPage() {
  const { rxId = "" } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const { data, loading, error } = usePrescriptionDetails(rxId);
  const { submitting, submitReview, validateAndActivate, latestEtag } =
    usePrescriptionReview(rxId);
  const [submittedSignature, setSubmittedSignature] = useState("");
  const [workingEtag, setWorkingEtag] = useState("");

  const { ui, actions } = useValidationUiState();

  // Initialize UI state once for this rxId/data
  useEffect(() => {
    if (!data) return;
    // Guard to avoid re-initializing if already set for this id
    if (ui.data?.id === data.id) return;
    actions.init(data);
  }, [data, ui.data?.id, actions]);

  const viewData = (ui.data ?? data) as PrescriptionDetailsDto | null;

  useEffect(() => {
    if (!viewData) return;
    setWorkingEtag(viewData.__etag ?? "");
    setSubmittedSignature("");
  }, [viewData?.id, viewData?.__etag]);

  useEffect(() => {
    if (latestEtag) {
      setWorkingEtag(latestEtag);
    }
  }, [latestEtag]);

  const backToQueue = useCallback(() => {
    navigate(ROUTES.PHARMACIST.VALIDATION, { state: { refresh: true } });
  }, [navigate]);

  const overallResult = useMemo<ValidationResult>(() => {
    if (!viewData) return "OK";
    const results = viewData.medicines.map((m) =>
      computeValidation(
        m,
        ui.approved[m.prescriptionMedicineId] ?? getMaxApprovableQuantity(m)
      )
    );
    if (results.includes("Blocked")) return "Blocked";
    if (results.includes("Partial")) return "Partial";
    return "OK";
  }, [viewData, ui.approved]);

  const reviewLines = useMemo(() => {
    if (!viewData) return [];
    return viewData.medicines.map((m) => {
      const id = m.prescriptionMedicineId;
      const decision = ui.decisions[id];
      const approvedQuantity = ui.approved[id] ?? getMaxApprovableQuantity(m);
      const reason = ui.reasons[id]?.trim() || "";

      return {
        id,
        medicineName: m.name,
        medicine: m,
        decision,
        overrideReason: reason,
        approvedQuantity,
      };
    });
  }, [viewData, ui.approved, ui.decisions, ui.reasons]);

  const allLinesReviewed = useMemo(
    () =>
      reviewLines.length > 0 &&
      reviewLines.every(
        (line) => line.decision === "Accepted" || line.decision === "Rejected"
      ),
    [reviewLines]
  );

  const reviewSignature = useMemo(
    () =>
      reviewLines
        .map((line) =>
          [
            line.id,
            line.decision ?? "Pending",
            line.overrideReason,
            String(line.approvedQuantity),
          ].join(":")
        )
        .join("|"),
    [reviewLines]
  );

  const reviewsSyncedForValidation =
    allLinesReviewed &&
    submittedSignature.length > 0 &&
    submittedSignature === reviewSignature;

  const submitLineReviews = useCallback(async () => {
    if (!viewData) return;

    if (!allLinesReviewed) {
      toast.error(
        "Incomplete review",
        "Review every line as Accepted or Rejected before submission."
      );
      return;
    }

    if (!workingEtag) {
      toast.error("Conflict", "Missing ETag for line review. Reload this prescription.");
      return;
    }

    const missingReason = reviewLines.some(
      (line) => line.decision === "Rejected" && !line.overrideReason
    );
    if (missingReason) {
      toast.error("Cannot submit", "Please provide a reason for all rejected medicines.");
      return;
    }

    const invalidAcceptedMeds = reviewLines
      .filter(
        (line) =>
          line.decision === "Accepted" &&
          !isValidApprovedQuantity(line.medicine, line.approvedQuantity)
      )
      .map((line) => line.medicineName);

    if (invalidAcceptedMeds.length > 0) {
      toast.error(
        "Invalid approved quantity",
        "For accepted medicines, approved quantity must be a whole number between 1 and the reservable amount."
      );
      return;
    }

    const res = await submitReview(
      {
        medicines: reviewLines.map((line) => ({
          prescriptionMedicineId: line.id,
          decision: line.decision as "Accepted" | "Rejected",
          overrideReason:
            line.decision === "Rejected" ? line.overrideReason : null,
          approvedQuantity:
            line.decision === "Rejected" ? 0 : line.approvedQuantity,
        })),
      },
      viewData.patientId,
      workingEtag
    );

    if (!res.ok) {
      toast.error("Failed", res.message);
      return;
    }

    setSubmittedSignature(reviewSignature);
    toast.success("Success", "Line reviews submitted successfully.");
  }, [allLinesReviewed, reviewLines, reviewSignature, submitReview, toast, viewData, workingEtag]);

  const handleValidatePrescription = useCallback(async () => {
    if (!viewData) return;

    if (!reviewsSyncedForValidation) {
      toast.error(
        "Review required",
        "Submit line reviews first, then validate and activate."
      );
      return;
    }

    if (!workingEtag) {
      toast.error("Conflict", "Missing ETag for validation. Reload this prescription.");
      return;
    }

    const res = await validateAndActivate(workingEtag);
    if (!res.ok) {
      toast.error("Failed", res.message);
      return;
    }

    toast.success("Success", "Prescription validated and activated successfully.");
    navigate(ROUTES.PHARMACIST.VALIDATION, { state: { refresh: true } });
  }, [navigate, reviewsSyncedForValidation, toast, validateAndActivate, viewData, workingEtag]);

  const confirmRejectAll = useCallback(async () => {
    if (!viewData) return;

    const reason = ui.reasons["_ALL_"]?.trim();
    if (!reason) {
      toast.error("Reason required", "Please provide a reason to reject the entire prescription.");
      return;
    }

    const medicines = viewData.medicines.map((m) => ({
      prescriptionMedicineId: m.prescriptionMedicineId,
      decision: "Rejected" as const,
      overrideReason: reason,
      approvedQuantity: 0,
    }));

    if (!workingEtag) {
      toast.error("Conflict", "Missing ETag for line review. Reload this prescription.");
      return;
    }

    const res = await submitReview(
      { medicines },
      viewData.patientId,
      workingEtag
    );
    if (!res.ok) {
      toast.error("Failed", res.message);
      return;
    }

    toast.success("Success", "Prescription rejected successfully.");
    actions.closeRejectAll();
    navigate(ROUTES.PHARMACIST.VALIDATION, { state: { refresh: true } });
  }, [actions, navigate, submitReview, toast, ui.reasons, viewData, workingEtag]);

  if (loading) return <div className="max-w-6xl mx-auto p-4">Loading...</div>;

  if (error || !viewData) {
    return (
      <div className="max-w-5xl mx-auto p-4">
        <button
          onClick={backToQueue}
          className="text-gray-600 hover:text-gray-800 inline-flex items-center gap-1 mb-4"
        >
          <ChevronLeft size={18} /> Back to Queue
        </button>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error || "No data available"}
        </div>
      </div>
    );
  }

  const rejectLineId = ui.rejectLineId;
  const rejectLineReason = ui.reasons[rejectLineId ?? ""] ?? "";

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <button
            onClick={backToQueue}
            className="text-gray-600 hover:text-gray-800 inline-flex items-center gap-1 mb-2"
          >
            <ChevronLeft size={18} />
            Back to Queue
          </button>
          <h1 className="text-2xl font-semibold text-gray-900">Prescription Validation</h1>
          <p className="text-gray-500">Review and validate prescription details</p>
        </div>
        <div className="self-start">
          <Pill tone="amber">{viewData.id}</Pill>
        </div>
      </div>

      {/* Patient info */}
      <div className="bg-white rounded-2xl border shadow-sm">
        <div className="p-5 border-b">
          <h2 className="font-semibold text-gray-900">Patient Information</h2>
        </div>
        <div className="p-5 grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
          <KV label="Patient Name" value={viewData.patientName} />
          <KV label="Patient ID" value={viewData.patientId} />
          <KV label="Submission Time" value={formatDate(viewData.createdAt)} />
          <KV
            label="Doctor"
            value={`${viewData.prescriber.name} (${viewData.prescriber.id})`}
          />
        </div>
      </div>

      {/* Table */}
      <ValidationTable
        data={viewData}
        approved={ui.approved}
        decisions={ui.decisions}
        overallResult={overallResult}
        onApprovedChange={actions.setApproved}
        onAccept={actions.acceptLine}
        onOpenReject={actions.openRejectLine}
        onOpenAllergy={actions.openAllergy}
      />

      {/* Footer actions */}
      <div className="p-5 border rounded-2xl shadow-sm bg-white flex flex-col sm:flex-row gap-3 sm:justify-end">
        <button
          onClick={actions.openRejectAll}
          disabled={submitting}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md border text-red-700 border-red-300 hover:bg-red-50 disabled:opacity-50"
        >
          <XCircle size={18} />
          Reject Entire Prescription
        </button>

        <button
          onClick={submitLineReviews}
          disabled={submitting || !allLinesReviewed}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
        >
          <CheckCircle2 size={18} />
          {submitting ? "Submitting..." : "Submit Line Reviews"}
        </button>

        <button
          onClick={handleValidatePrescription}
          disabled={submitting || !reviewsSyncedForValidation}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          <CheckCircle2 size={18} />
          {submitting ? "Submitting..." : "Validate Prescription"}
        </button>
      </div>

      {/* Modals */}
      <ValidationModals
        allergyFor={ui.allergyFor}
        rejectLineOpen={!!rejectLineId}
        rejectLineReason={rejectLineReason}
        rejectAllOpen={ui.rejectAllOpen}
        rejectAllReason={ui.reasons["_ALL_"] ?? ""}
        submitting={submitting}
        onCloseAllergy={actions.closeAllergy}
        onCloseRejectLine={actions.closeRejectLine}
        onRejectLineReasonChange={(v) => rejectLineId && actions.setReason(rejectLineId, v)}
        onConfirmRejectLine={() => {
          if (!rejectLineId) return;
          if (!rejectLineReason.trim()) {
            toast.error("Reason required", "Please enter a rejection reason.");
            return;
          }
          actions.confirmRejectLine(rejectLineId);
        }}
        onCloseRejectAll={actions.closeRejectAll}
        onRejectAllReasonChange={(v) => actions.setReason("_ALL_", v)}
        onConfirmRejectAll={confirmRejectAll}
      />
    </div>
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
