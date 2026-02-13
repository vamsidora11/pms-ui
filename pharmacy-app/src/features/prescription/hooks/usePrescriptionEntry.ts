import { useCallback, useMemo, useState } from "react";
import { useToast } from "@components/common/Toast/useToast";

import { createPrescription } from "@api/prescription";
import { getPatientById } from "@api/patientSearch";

import type { PatientSummary } from "@prescription/models";
import type { PrescriptionDraft, DoctorDetails } from "../models";

import type {
  CreatePrescriptionRequest,
  CreatePrescriptionMedicineRequest,
  PrescriberDto,
} from "@prescription/prescription.types";

import {
  validatePatientStep,
  validateDoctorStep,
  validateMedicationStep,
  validatePrescriptionDraft,
} from "@prescription/validation";

/* ---------------- INITIAL STATE ---------------- */

const INITIAL_DRAFT: PrescriptionDraft = {
  patient: null,
  doctor: { id: "", name: "" },
  medications: [
    {
      drugId: "",
      drugName: "",
      strength: "",
      frequency: "BID",
      quantity: 1,
      durationDays: 7,
      refills: 0,
      instructions: "",
    },
  ],
  notes: "",
};

export const PRESCRIPTION_STEPS = [
  { step: 1, label: "Patient" },
  { step: 2, label: "Doctor" },
  { step: 3, label: "Medications" },
  { step: 4, label: "Review" },
] as const;

/* ---------------- MAPPER FUNCTION ---------------- */

function mapDraftToCreatePrescriptionRequest(
  draft: PrescriptionDraft
): CreatePrescriptionRequest {
  if (!draft.patient) throw new Error("Patient is required");

  return {
    patientId: draft.patient.id,
    patientName: draft.patient.fullName,
    prescriber: {
      id: draft.doctor.id,
      name: draft.doctor.name,
    } as PrescriberDto,
    medicines: draft.medications.map<CreatePrescriptionMedicineRequest>((m) => ({
      productId: m.drugId!,
      name: m.drugName,
      strength: m.strength,
      prescribedQuantity: m.quantity,
      totalRefillsAuthorized: m.refills,
      frequency: m.frequency,
      daysSupply: m.durationDays,
      instruction: m.instructions || "",
    })),
  };
}

/* ---------------- HOOK ---------------- */

export function usePrescriptionEntry() {
  const toast = useToast();

  const [currentStep, setCurrentStep] = useState(1);
  const [draft, setDraft] = useState<PrescriptionDraft>(INITIAL_DRAFT);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getErrorMessage = (err: unknown): string => {
    if (typeof err === "string") return err;
    if (typeof err === "object" && err !== null) {
      const errorObj = err as { message?: string };
      return errorObj.message || "Server error";
    }
    return "Server error";
  };

  // ✅ derived (memo) – avoids recomputing validation unnecessarily
  const isNextDisabled = useMemo(() => {
    if (currentStep === 1) return !validatePatientStep(draft).valid;
    if (currentStep === 2) return !validateDoctorStep(draft).valid;
    if (currentStep === 3) return !validateMedicationStep(draft).valid;
    return true;
  }, [currentStep, draft]);

  const goNext = useCallback(() => {
    setCurrentStep((s) => (s < 4 ? s + 1 : s));
  }, []);

  const goPrev = useCallback(() => {
    setCurrentStep((s) => (s > 1 ? s - 1 : s));
  }, []);

  const reset = useCallback(() => {
    setDraft(INITIAL_DRAFT);
    setCurrentStep(1);
  }, []);

  // Patient selection handler (fetch details, normalize allergies)
  const handlePatientSelected = useCallback(
    async (summary: PatientSummary) => {
      const details = await getPatientById(summary.id);

      if (!details) {
        toast.error("Error", "Failed to load patient details");
        return;
      }

      setDraft((d) => ({
        ...d,
        patient: { ...details, allergies: details.allergies ?? [] },
      }));
    },
    [toast]
  );

  const handleDoctorChange = useCallback((doctor: DoctorDetails) => {
    setDraft((d) => ({ ...d, doctor }));
  }, []);

  const handleMedicationsChange = useCallback(
    (medications: PrescriptionDraft["medications"]) => {
      setDraft((d) => ({ ...d, medications }));
    },
    []
  );

  const handleSubmit = useCallback(async () => {
    const validation = validatePrescriptionDraft(draft);
    if (!validation.valid) {
      toast.error(
        "Validation Error",
        validation.errors[0] || "Please fix the issues before submitting."
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = mapDraftToCreatePrescriptionRequest(draft);
      const response = await createPrescription(payload);

      toast.success(
        "Prescription Created Successfully",
        `Prescription ID: ${response.id} | Status: ${response.status}`
      );

      reset();
    } catch (error) {
      console.error("Create prescription failed:", error);

      toast.error(
        "Failed to create prescription",
        getErrorMessage(error)
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [draft, reset, toast]);

  return {
    // state
    currentStep,
    draft,
    isSubmitting,

    // constants
    steps: PRESCRIPTION_STEPS,

    // derived
    isNextDisabled,

    // handlers
    goNext,
    goPrev,
    setCurrentStep,

    handlePatientSelected,
    handleDoctorChange,
    handleMedicationsChange,

    handleSubmit,
    reset,
  };
}
