import { useState } from "react";
import type { PrescriptionDraft, DoctorDetails } from "./models";
import { createPrescription } from "@api/prescription";
import {
  type CreatePrescriptionRequest,
  type CreatePrescriptionMedicineRequest,
  type PrescriberDto,
} from "@prescription/prescription.types";
import { getPatientById } from "@api/patientSearch";
import type { PatientSummary } from "@prescription/models";
import { useToast } from "@components/common/Toast/useToast";
import Stepper from "@components/common/Stepper/Stepper";
import PatientStep from "@prescription/steps/PatientStep";
import DoctorStep from "@prescription/steps/DoctorStep";
import MedicationStep from "@prescription/steps/MedicationStep";
import ReviewStep from "@prescription/steps/ReviewStep";
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

const PRESCRIPTION_STEPS = [
  { step: 1, label: "Patient" },
  { step: 2, label: "Doctor" },
  { step: 3, label: "Medications" },
  { step: 4, label: "Review" },
];

/* ---------------- MAPPER FUNCTION ---------------- */

function mapDraftToCreatePrescriptionRequest(
  draft: PrescriptionDraft,
): CreatePrescriptionRequest {
  if (!draft.patient) throw new Error("Patient is required");

  return {
    patientId: draft.patient.id,
    patientName: draft.patient.fullName,
    prescriber: {
      id: draft.doctor.id,
      name: draft.doctor.name,
    } as PrescriberDto,
    medicines: draft.medications.map<CreatePrescriptionMedicineRequest>(
      (m) => ({
        productId: m.drugId!,
        name: m.drugName,
        strength: m.strength,
        prescribedQuantity: m.quantity,
        totalRefillsAuthorized: m.refills,
        frequency: m.frequency,
        daysSupply: m.durationDays,
        instruction: m.instructions || "",
      }),
    ),
  };
}

/* ---------------- COMPONENT ---------------- */

export default function PrescriptionEntry() {
  const [currentStep, setCurrentStep] = useState(1);
  const [draft, setDraft] = useState<PrescriptionDraft>(INITIAL_DRAFT);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const toast = useToast();

  /* ---------------- STEP VALIDATION ---------------- */

  const isNextDisabled = () => {
    if (currentStep === 1) return !validatePatientStep(draft).valid;
    if (currentStep === 2) return !validateDoctorStep(draft).valid;
    if (currentStep === 3) return !validateMedicationStep(draft).valid;
    return true;
  };

  /* ---------------- SUBMIT ---------------- */

  const handleSubmit = async () => {
    const validation = validatePrescriptionDraft(draft);
    if (!validation.valid) {
      toast.error(
        "Validation Error",
        validation.errors[0] || "Please fix the issues before submitting.",
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = mapDraftToCreatePrescriptionRequest(draft);
      const response = await createPrescription(payload);

      toast.success(
        "Prescription Created Successfully",
        `Prescription ID: ${response.id} | Status: ${response.status}`,
      );

      setDraft(INITIAL_DRAFT);
      setCurrentStep(1);
    } catch (error: any) {
      console.error("Create prescription failed:", error);
      toast.error(
        "Failed to create prescription",
        error?.message || "Server error",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ---------------- RENDER ---------------- */

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <Stepper currentStep={currentStep} steps={PRESCRIPTION_STEPS} />

      {currentStep === 1 && (
        <PatientStep
          patient={draft.patient}
          onChange={async (summary: PatientSummary) => {
            const details = await getPatientById(summary.id);

            if (!details) {
              toast.error("Error", "Failed to load patient details");
              return;
            }

            // Normalize allergies to array to avoid optional issues across UI
            setDraft((d) => ({
              ...d,
              patient: { ...details, allergies: details.allergies ?? [] },
            }));
          }}
        />
      )}

      {currentStep === 2 && (
        <DoctorStep
          doctor={draft.doctor}
          onChange={(doctor: DoctorDetails) =>
            setDraft((d) => ({ ...d, doctor }))
          }
        />
      )}

      {currentStep === 3 && (
        <MedicationStep
          medications={draft.medications}
          onChange={(medications) => setDraft((d) => ({ ...d, medications }))}
        />
      )}

      {currentStep === 4 && (
        <ReviewStep
          draft={draft}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
        />
      )}

      {currentStep < 4 && (
        <div className="flex justify-between pt-4">
          <button
            disabled={currentStep === 1}
            onClick={() => setCurrentStep((s) => s - 1)}
            className="px-6 py-2 bg-gray-200 rounded-lg disabled:opacity-50 hover:bg-gray-300"
          >
            Previous
          </button>

          <button
            disabled={isNextDisabled()}
            onClick={() => setCurrentStep((s) => s + 1)}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50 hover:bg-blue-700"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
