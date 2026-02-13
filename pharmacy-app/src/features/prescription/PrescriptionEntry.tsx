import Stepper from "@components/common/Stepper/Stepper";

import PatientStep from "@prescription/steps/PatientStep";
import DoctorStep from "@prescription/steps/DoctorStep";
import MedicationStep from "@prescription/steps/MedicationStep";
import ReviewStep from "@prescription/steps/ReviewStep";

import { usePrescriptionEntry } from "./hooks/usePrescriptionEntry";
import type { DoctorDetails } from "./types/models";

export default function PrescriptionEntry() {
  const {
    currentStep,
    steps,
    draft,
    isSubmitting,
    isNextDisabled,
    goNext,
    goPrev,

    handlePatientSelected,
    handleDoctorChange,
    handleMedicationsChange,

    handleSubmit,
  } = usePrescriptionEntry();

  const isFirst = currentStep === 1;
  const isLast = currentStep === 4;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <Stepper currentStep={currentStep} steps={steps} />

      {currentStep === 1 && (
        <PatientStep patient={draft.patient} onChange={handlePatientSelected} />
      )}

      {currentStep === 2 && (
        <DoctorStep
          doctor={draft.doctor}
          onChange={(doctor: DoctorDetails) => handleDoctorChange(doctor)}
        />
      )}

      {currentStep === 3 && (
        <MedicationStep
          medications={draft.medications}
          onChange={handleMedicationsChange}
        />
      )}

      {currentStep === 4 && (
        <ReviewStep
          draft={draft}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
        />
      )}

      {/* Footer: Always show "Previous". Show "Next" only for steps 1–3. */}
      <div className="flex justify-between pt-4">
        <button
          type="button"
          disabled={isFirst}
          onClick={goPrev}
          className="px-6 py-2 bg-gray-200 rounded-lg disabled:opacity-50 hover:bg-gray-300"
        >
          Previous
        </button>

        {!isLast && (
          <button
            type="button"
            disabled={isNextDisabled}
            onClick={goNext}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50 hover:bg-blue-700"
          >
            Next
          </button>
        )}
      </div>
    </div>
  );
}