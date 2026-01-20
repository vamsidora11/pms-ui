import { useState } from "react";
import type { PrescriptionDraft, DoctorDetails } from "./models";
import {
  createPrescription,
  type CreatePrescriptionRequest,
  type DoctorDto,
} from "@api/prescription.api";
import { getPatientById } from "@api/patientSearch";
import type { PatientSummary } from "./models";
import { useToast } from "@components/common/Toast/useToast";

import Stepper from "./components/Stepper";
import PatientStep from "./steps/PatientStep";
import DoctorStep from "./steps/DoctorStep";
import MedicationStep from "./steps/MedicationStep";
import ReviewStep from "./steps/ReviewStep";

import {
  validatePatientStep,
  validateDoctorStep,
  validateMedicationStep,
} from "./validation";

/* ---------------- INITIAL STATE ---------------- */

const INITIAL_DRAFT: PrescriptionDraft = {
  patient: null,
  doctor: { id: "", name: "" },
  medications: [
    {
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
        "Please select valid drugs for all medications"
      );
      return;
    }

    setIsSubmitting(true);

    const payload: CreatePrescriptionRequest = {
      PatientId: draft.patient.id,
      Doctor: {
        Id: draft.doctor.id,
        Name: draft.doctor.name,
      } as DoctorDto,
      ExpiresAt: new Date(
        Date.now() + 365 * 24 * 60 * 60 * 1000
      ).toISOString(),
      Items: draft.medications.map((m) => ({
        InventoryId: m.drugId!,
        MedicineName: m.drugName,
        Strength: m.strength,
        Frequency: m.frequency,
        QuantityPrescribed: m.quantity,
        DurationDays: m.durationDays,
        RemainingRefills: m.refills,
        Instructions: m.instructions || "",
      })),
    };

    const response = await createPrescription(payload);

    if (!response) {
      toast.error(
        "Prescription Submission Failed",
        "Unable to submit prescription. Please try again."
      );
      setIsSubmitting(false);
      return;
    }

    toast.success(
      "Prescription Created Successfully",
      `Prescription ID: ${response.prescriptionId} | Status: ${response.status}`
    );

    setDraft(INITIAL_DRAFT);
    setCurrentStep(1);
    setIsSubmitting(false);
  };

  /* ---------------- RENDER ---------------- */

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <Stepper currentStep={currentStep} />

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

            toast.success(
              "Patient Selected",
              `${details.fullName} selected successfully`
            );
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
          onChange={(medications) =>
            setDraft((d) => ({ ...d, medications }))
          }
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
