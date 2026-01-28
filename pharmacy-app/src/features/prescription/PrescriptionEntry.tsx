import { useState } from "react";
import type { PrescriptionDraft, DoctorDetails } from "./models";
import { createPrescription } from "@api/prescription";
import {
  type CreatePrescriptionRequest,
  type CreatePrescriptionMedicineRequest,
  type PrescriberDto,
} from "@api/prescription.types";
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
    if (!draft.patient) {
      toast.error("Validation Error", "Patient information is missing");
      return;
    }

    if (!draft.doctor.id || !draft.doctor.name) {
      toast.error("Validation Error", "Doctor information is incomplete");
      return;
    }

    const invalidMeds = draft.medications.filter((m) => !m.drugId);
    if (invalidMeds.length > 0) {
      toast.error(
        "Validation Error",
        "Please select valid drugs for all medications",
      );
      return;
    }

    setIsSubmitting(true);

    try {
      // Map UI draft → backend DTO
      const payload = mapDraftToCreatePrescriptionRequest(draft);

      console.log(
        "Submitting prescription payload:",
        JSON.stringify(payload, null, 2),
      );

      try {
        const response = await createPrescription(payload);

        toast.success(
          "Prescription Created Successfully",
          `Prescription ID: ${response.id} | Status: ${response.status}`,
        );
      } catch (error) {
        toast.error("Failed to create prescription");
      }

      setDraft(INITIAL_DRAFT);
      setCurrentStep(1);
    } catch (error) {
      toast.error(
        "Prescription Submission Failed",
        "Unable to submit prescription. Please try again.",
      );
      console.error("Create prescription failed:", error);
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

            setDraft((d) => ({
              ...d,
              patient: details,
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
