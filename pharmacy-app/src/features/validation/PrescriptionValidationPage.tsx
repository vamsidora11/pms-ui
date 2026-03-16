import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { CheckCircle2, ChevronLeft, XCircle } from "lucide-react";

import { ROUTES } from "../../constants/routes";
import { useToast } from "@components/common/Toast/useToast";
import { usePrescriptionDetails } from "@validation/hooks/usePrescriptionDetails";
import { usePrescriptionReview } from "@validation/hooks/usePrescriptionReview";
import { useValidationUiState } from "./hooks/useValidationUiState";
import { formatDate } from "@utils/format";
import { extractApiError } from "@utils/httpError";
import { getValidationResults } from "@api/validation.api";
import { mapValidationResultDto } from "@validation/domain/mapper";
import type { LineValidation } from "@validation/domain/model";
import type { LineDecision } from "./types/validation.types";
import type { PrescriptionLine } from "@prescription/domain/model";

import { Pill } from "../../components/common/Pill/Pill";
import ValidationTable from "./components/ValidationTable";
import ValidationModals from "./components/ValidationModals";
import { isReviewedDecision } from "./utils/prescriptionValidationUtils";

type LocationState = { patientId?: string } | null;

function normalizeKey(value: string | undefined | null): string {
  return (value ?? "").trim().toLowerCase();
}

export default function PrescriptionValidationDetailsPage() {
  const { rxId = "" } = useParams();
  const location = useLocation();
  const patientId = ((location.state as LocationState) ?? {}).patientId ?? "";
  const navigate = useNavigate();
  const toast = useToast();

  const { data, etag, loading, error, refetch } = usePrescriptionDetails(rxId, patientId);
  const { submitting, submitReview, latestEtag, latestSnapshot } = usePrescriptionReview(
    rxId,
    patientId
  );

  const { ui, actions } = useValidationUiState();
  const [validationLoading, setValidationLoading] = useState(false);
  const [validationByLine, setValidationByLine] = useState<Record<string, LineValidation>>({});

  useEffect(() => {
    if (!data) {
      return;
    }
    if (ui.data?.id === data.id) {
      return;
    }
    actions.init(data);
  }, [actions, data, ui.data?.id]);

  useEffect(() => {
    if (latestSnapshot && latestSnapshot.id === rxId) {
      actions.init(latestSnapshot);
    }
  }, [actions, latestSnapshot, rxId]);

  const viewData = ui.data ?? data;

  const getLineDecision = useCallback(
    (line: PrescriptionLine): LineDecision | undefined => {
      const selectedDecision = ui.decisions[line.lineId];
      if (selectedDecision) {
        return selectedDecision;
      }

      return isReviewedDecision(line.review?.status) ? line.review.status : undefined;
    },
    [ui.decisions],
  );

  const reviewSummary = useMemo(() => {
    if (!viewData) {
      return {
        hasAnyDecision: false,
        hasAllDecisions: false,
        hasMissingRejectedReason: false,
        hasRejectedDecision: false,
      };
    }

    let hasAnyDecision = false;
    let hasAllDecisions = true;
    let hasMissingRejectedReason = false;
    let hasRejectedDecision = false;

    for (const line of viewData.medicines) {
      const decision = getLineDecision(line);
      if (decision) {
        hasAnyDecision = true;
      } else {
        hasAllDecisions = false;
      }

      if (decision === "Rejected") {
        hasRejectedDecision = true;
        const notes = (ui.reasons[line.lineId] ?? line.review.notes ?? "").trim();
        if (!notes) {
          hasMissingRejectedReason = true;
        }
      }
    }

    return {
      hasAnyDecision,
      hasAllDecisions,
      hasMissingRejectedReason,
      hasRejectedDecision,
    };
  }, [getLineDecision, ui.reasons, viewData]);

  const hasLineReviewStarted = reviewSummary.hasAnyDecision;
  const isSingleMedicinePrescription = (viewData?.medicines.length ?? 0) === 1;
  const mustUseRejectEntirePrescription =
    isSingleMedicinePrescription && reviewSummary.hasRejectedDecision;
  const canSubmitReview =
    reviewSummary.hasAllDecisions &&
    !reviewSummary.hasMissingRejectedReason &&
    !mustUseRejectEntirePrescription;

  const tableData = useMemo(() => {
    if (!viewData) {
      return null;
    }

    if (Object.keys(validationByLine).length === 0) {
      return viewData;
    }

    return {
      ...viewData,
      medicines: viewData.medicines.map((line) => ({
        ...line,
        validation:
          validationByLine[normalizeKey(line.lineId)] ??
          validationByLine[`product:${normalizeKey(line.productId)}`] ??
          line.validation,
      })),
    };
  }, [validationByLine, viewData]);

  const loadValidation = useCallback(async () => {
    if (!rxId || !patientId) {
      return;
    }

    setValidationLoading(true);
    try {
      const dto = await getValidationResults(rxId, patientId);
      const mapped = mapValidationResultDto(dto);
      const asRecord = mapped.lines.reduce<Record<string, LineValidation>>((acc, line) => {
        const lineKey = normalizeKey(line.lineId);
        const productKey = normalizeKey(line.productId);

        if (lineKey) {
          acc[lineKey] = line;
        }
        if (productKey) {
          acc[`product:${productKey}`] = line;
        }
        return acc;
      }, {});
      setValidationByLine(asRecord);
    } catch (error) {
      toast.error("Validation failed", extractApiError(error));
    } finally {
      setValidationLoading(false);
    }
  }, [patientId, rxId, toast]);

  useEffect(() => {
    if (!data?.id || !data?.patientId) {
      return;
    }

    void loadValidation();
  }, [data?.id, data?.patientId, loadValidation]);

  const backToQueue = useCallback(() => {
    navigate(ROUTES.PHARMACIST.VALIDATION, { state: { refresh: true } });
  }, [navigate]);

  const resolveReviewEtag = useCallback((): string => {
    const activeEtag = (latestEtag ?? etag).trim();
    if (!activeEtag) {
      throw new Error("Missing ETag for review. Please refresh.");
    }
    return activeEtag;
  }, [etag, latestEtag]);

  const submitCurrentReview = useCallback(async () => {
    if (!viewData) {
      return;
    }

    if (!reviewSummary.hasAllDecisions) {
      toast.error(
        "Incomplete review",
        "Approve or reject every medication before submitting."
      );
      return;
    }

    if (reviewSummary.hasMissingRejectedReason) {
      toast.error("Cannot submit", "Please provide notes for all rejected lines.");
      return;
    }

    let effectiveEtag = "";
    try {
      effectiveEtag = resolveReviewEtag();
    } catch (error) {
      toast.error("Conflict", extractApiError(error));
      return;
    }

    const reviews = viewData.medicines.map((line) => ({
      prescriptionLineId: line.lineId,
      status: getLineDecision(line)!,
      notes:
        getLineDecision(line) === "Rejected"
          ? (ui.reasons[line.lineId] ?? line.review.notes ?? "").trim()
          : null,
    }));

    const result = await submitReview(reviews, effectiveEtag);
    if (!result.ok) {
      if (result.message.toLowerCase().includes("conflict")) {
        toast.error(
          "Prescription updated",
          "Another pharmacist modified this prescription. Reloading latest version."
        );
      } else {
        toast.error("Review failed", result.message);
      }

      await refetch();
      return;
    }

    toast.success("Success", "Prescription review submitted successfully.");
    navigate(ROUTES.PHARMACIST.VALIDATION, { state: { refresh: true } });
  }, [
    navigate,
    refetch,
    resolveReviewEtag,
    submitReview,
    toast,
    getLineDecision,
    ui.reasons,
    reviewSummary.hasAllDecisions,
    reviewSummary.hasMissingRejectedReason,
    viewData,
  ]);

  const confirmRejectAll = useCallback(async () => {
    if (!viewData) {
      return;
    }
    if (hasLineReviewStarted && !isSingleMedicinePrescription) {
      toast.error(
        "Review in progress",
        "Clear the line-by-line review before rejecting the entire prescription."
      );
      return;
    }

    const reason = (ui.reasons._ALL_ ?? "").trim();
    if (!reason) {
      toast.error("Reason required", "Please provide a rejection reason.");
      return;
    }

    let effectiveEtag = "";
    try {
      effectiveEtag = resolveReviewEtag();
    } catch (error) {
      toast.error("Conflict", extractApiError(error));
      return;
    }

    actions.rejectAll(reason);
    const reviews = viewData.medicines.map((line) => ({
      prescriptionLineId: line.lineId,
      status: "Rejected" as const,
      notes: reason,
    }));

    const result = await submitReview(reviews, effectiveEtag);
    if (!result.ok) {
      toast.error("Failed", result.message);
      await refetch();
      return;
    }

    toast.success("Success", "Prescription rejected successfully.");
    navigate(ROUTES.PHARMACIST.VALIDATION, { state: { refresh: true } });
  }, [
    actions,
    navigate,
    refetch,
    resolveReviewEtag,
    submitReview,
    toast,
    hasLineReviewStarted,
    isSingleMedicinePrescription,
    ui.reasons._ALL_,
    viewData
  ]);

  if (loading) {
    return <div className="max-w-6xl mx-auto p-4">Loading...</div>;
  }

  if (!patientId) {
    return (
      <div className="max-w-5xl mx-auto p-4">
        <button
          onClick={backToQueue}
          className="text-gray-600 hover:text-gray-800 inline-flex items-center gap-1 mb-4"
        >
          <ChevronLeft size={18} /> Back to Queue
        </button>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          Missing patient context. Open this prescription from the validation queue.
        </div>
      </div>
    );
  }

  if (error || !tableData) {
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
          <p className="text-gray-500">Review and submit pharmacist decisions</p>
        </div>
        <div className="self-start">
          <Pill tone="amber">{tableData.id}</Pill>
        </div>
      </div>

      <div className="bg-white rounded-2xl border shadow-sm">
        <div className="p-5 border-b">
          <h2 className="font-semibold text-gray-900">Patient Information</h2>
        </div>
        <div className="p-5 grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
          <KV label="Patient Name" value={tableData.patientName} />
          <KV label="Patient ID" value={tableData.patientId} />
          <KV label="Submission Time" value={formatDate(tableData.createdAt)} />
          <KV label="Doctor" value={`${tableData.prescriber.name} (${tableData.prescriber.id})`} />
        </div>
      </div>

      <ValidationTable
        data={tableData}
        submitting={submitting}
        decisions={ui.decisions}
        onAccept={actions.acceptLine}
        onOpenReject={(lineId) => {
          if (isSingleMedicinePrescription) {
            actions.setReason("_ALL_", ui.reasons[lineId] ?? ui.reasons._ALL_ ?? "");
            actions.openRejectAll(true);
            return;
          }

          actions.openRejectLine(lineId);
        }}
        onOpenAllergy={actions.openAllergy}
      />

      <div className="p-5 border rounded-2xl shadow-sm bg-white flex flex-col sm:flex-row gap-3 sm:justify-end">
        <button
          onClick={() => actions.openRejectAll()}
          disabled={submitting || (hasLineReviewStarted && !mustUseRejectEntirePrescription)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md border text-red-700 border-red-300 hover:bg-red-50 disabled:opacity-50"
        >
          <XCircle size={18} />
          Reject Entire Prescription
        </button>

        <button
          onClick={() => void loadValidation()}
          disabled={submitting || validationLoading}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md border text-gray-700 border-gray-300 hover:bg-gray-50 disabled:opacity-50"
        >
          {validationLoading ? "Refreshing..." : "Refresh Validation"}
        </button>

        <button
          onClick={() => void submitCurrentReview()}
          disabled={submitting || !canSubmitReview}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
          title={
            mustUseRejectEntirePrescription
              ? "Use Reject Entire Prescription for a single rejected medicine."
              : undefined
          }
        >
          <CheckCircle2 size={18} />
          {submitting ? "Submitting..." : "Submit Review"}
        </button>
      </div>

      <ValidationModals
        allergyFor={ui.allergyFor}
        rejectLineOpen={rejectLineId !== null}
        rejectLineReason={rejectLineReason}
        rejectAllOpen={ui.rejectAllOpen}
        rejectAllReason={ui.reasons._ALL_ ?? ""}
        submitting={submitting}
        onCloseAllergy={actions.closeAllergy}
        onCloseRejectLine={actions.closeRejectLine}
        onRejectLineReasonChange={(value) => {
          if (rejectLineId !== null) {
            actions.setReason(rejectLineId, value);
          }
        }}
        onConfirmRejectLine={() => {
          if (rejectLineId === null) {
            return;
          }
          if (!rejectLineReason.trim()) {
            toast.error("Reason required", "Please enter a rejection reason.");
            return;
          }
          actions.confirmRejectLine(rejectLineId);
          actions.setReason(rejectLineId, rejectLineReason);
        }}
        onCloseRejectAll={actions.closeRejectAll}
        onRejectAllReasonChange={(value) => actions.setReason("_ALL_", value)}
        onConfirmRejectAll={() => void confirmRejectAll()}
      />
    </div>
  );
}

function KV({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="text-gray-900">{value ?? "-"}</div>
    </div>
  );
}
