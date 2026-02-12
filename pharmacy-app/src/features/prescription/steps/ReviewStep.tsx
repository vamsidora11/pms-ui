import { formatDate } from "@utils/format";
import type { PrescriptionDraft } from "../types/models";

interface ReviewStepProps {
  draft: PrescriptionDraft;
  onSubmit: () => void;
  isSubmitting: boolean;
}

export default function ReviewStep({
  draft,
  onSubmit,
  isSubmitting,
}: ReviewStepProps) {
  const { patient, doctor, medications, notes } = draft;

  const incompleteMeds = medications.filter((m) => !m.drugId);
  const hasErrors =
    !patient || !doctor.id || !doctor.name || incompleteMeds.length > 0;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
      <div className="p-6 border-b border-gray-100">
        <h2 className="text-xl font-semibold text-gray-900 mb-1">
          Review Prescription
        </h2>
        <p className="text-sm text-gray-500">
          Verify all details before submission
        </p>
      </div>

      <div className="p-6 space-y-6">
        {hasErrors && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h3 className="text-red-800 font-semibold mb-2">
              ⚠️ Cannot Submit - Issues Found:
            </h3>
            <ul className="text-red-700 space-y-1 list-disc list-inside text-sm">
              {!patient && <li>Patient information is missing</li>}
              {!doctor.id && <li>Doctor ID is missing</li>}
              {!doctor.name && <li>Doctor name is missing</li>}
              {incompleteMeds.length > 0 && (
                <li>
                  {incompleteMeds.length} medication(s) missing drug selection
                </li>
              )}
            </ul>
          </div>
        )}

        {/* PATIENT */}
        <section>
          <h3 className="text-base font-semibold text-gray-900 mb-3">
            Patient Information
          </h3>

          {patient ? (
            <div className="bg-gray-50 rounded-lg p-4 grid grid-cols-3 gap-4">
              <div>
                <div className="text-xs text-gray-600 mb-1">Name</div>
                <div className="text-sm font-medium text-gray-900">
                  {patient.fullName}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-600 mb-1">ID</div>
                <div className="text-sm font-medium text-gray-900">
                  {patient.id}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-600 mb-1">Gender</div>
                <div className="text-sm font-medium text-gray-900">
                  {patient.gender}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-600 mb-1">Date of Birth</div>
                <div className="text-sm font-medium text-gray-900">
                  {formatDate(patient.dob)}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-600 mb-1">Phone</div>
                <div className="text-sm font-medium text-gray-900">
                  {patient.phone}
                </div>
              </div>
              {patient.email && (
                <div>
                  <div className="text-xs text-gray-600 mb-1">Email</div>
                  <div className="text-sm font-medium text-gray-900">
                    {patient.email}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-red-600 bg-red-50 rounded-lg p-4 text-sm">
              ❌ No patient selected
            </div>
          )}
        </section>

        {/* ALLERGIES */}
        {patient && (patient.allergies?.length ?? 0) > 0 && (
          <section>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="text-yellow-800 font-semibold mb-2 text-sm">
                ⚠️ Patient Allergies:
              </h3>
              <div className="flex flex-wrap gap-2">
                {(patient.allergies ?? []).map((allergy, idx) => (
                  <span
                    key={`${allergy}-${idx}`}
                    className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-xs font-medium"
                  >
                    {allergy}
                  </span>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* DOCTOR */}
        <section>
          <h3 className="text-base font-semibold text-gray-900 mb-3">
            Prescribing Doctor
          </h3>
          <div className="bg-gray-50 rounded-lg p-4 grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs text-gray-600 mb-1">Doctor ID</div>
              <div className="text-sm font-medium text-gray-900">
                {doctor.id || "(Not set)"}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-600 mb-1">Doctor Name</div>
              <div className="text-sm font-medium text-gray-900">
                {doctor.name || "(Not set)"}
              </div>
            </div>
          </div>
        </section>

        {/* MEDICATIONS (unchanged in structure) */}
        <section>
          <h3 className="text-base font-semibold text-gray-900 mb-3">
            Medications ({medications.length})
          </h3>

          <div className="space-y-3">
            {medications.map((m, idx) => (
              <div
                key={idx}
                className={`${m.drugId ? "bg-blue-50 border-blue-200" : "bg-red-50 border-red-300"} border rounded-lg p-4`}
              >
                {!m.drugId && (
                  <div className="mb-3 text-red-700 text-xs font-semibold">
                    ❌ Drug not selected - please go back to Medication step
                  </div>
                )}

                <div className="grid grid-cols-4 gap-4 mb-3">
                  <div>
                    <div
                      className={`text-xs mb-1 ${m.drugId ? "text-blue-600" : "text-red-600"}`}
                    >
                      Drug Name
                    </div>
                    <div
                      className={`text-sm font-medium ${m.drugId ? "text-blue-900" : "text-red-900"}`}
                    >
                      {m.drugName || "(Not selected)"}
                    </div>
                  </div>
                  <div>
                    <div
                      className={`text-xs mb-1 ${m.drugId ? "text-blue-600" : "text-red-600"}`}
                    >
                      Strength
                    </div>
                    <div
                      className={`text-sm font-medium ${m.drugId ? "text-blue-900" : "text-red-900"}`}
                    >
                      {m.strength}
                    </div>
                  </div>
                  <div>
                    <div
                      className={`text-xs mb-1 ${m.drugId ? "text-blue-600" : "text-red-600"}`}
                    >
                      Frequency
                    </div>
                    <div
                      className={`text-sm font-medium ${m.drugId ? "text-blue-900" : "text-red-900"}`}
                    >
                      {m.frequency}
                    </div>
                  </div>
                  <div>
                    <div
                      className={`text-xs mb-1 ${m.drugId ? "text-blue-600" : "text-red-600"}`}
                    >
                      Quantity
                    </div>
                    <div
                      className={`text-sm font-medium ${m.drugId ? "text-blue-900" : "text-red-900"}`}
                    >
                      {m.quantity}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <div
                      className={`text-xs mb-1 ${m.drugId ? "text-blue-600" : "text-red-600"}`}
                    >
                      Duration (Days)
                    </div>
                    <div
                      className={`text-sm font-medium ${m.drugId ? "text-blue-900" : "text-red-900"}`}
                    >
                      {m.durationDays} days
                    </div>
                  </div>
                  <div>
                    <div
                      className={`text-xs mb-1 ${m.drugId ? "text-blue-600" : "text-red-600"}`}
                    >
                      Refills
                    </div>
                    <div
                      className={`text-sm font-medium ${m.drugId ? "text-blue-900" : "text-red-900"}`}
                    >
                      {m.refills}
                    </div>
                  </div>
                  {m.drugId && (
                    <div>
                      <div className="text-xs mb-1 text-blue-600">
                        Inventory ID
                      </div>
                      <div className="text-xs font-mono text-blue-900">
                        {m.drugId}
                      </div>
                    </div>
                  )}
                </div>

                {m.instructions && (
                  <div
                    className={`mt-3 pt-3 border-t ${m.drugId ? "border-blue-200" : "border-red-200"}`}
                  >
                    <div
                      className={`text-xs mb-1 ${m.drugId ? "text-blue-600" : "text-red-600"}`}
                    >
                      Instructions
                    </div>
                    <div
                      className={`text-sm ${m.drugId ? "text-blue-900" : "text-red-900"}`}
                    >
                      {m.instructions}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {notes && (
          <section>
            <h3 className="text-base font-semibold text-gray-900 mb-3">
              Additional Notes
            </h3>
            <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-900">
              {notes}
            </div>
          </section>
        )}

        {/* SUBMIT */}
        <div className="flex justify-end pt-4 border-t border-gray-200">
          <button
            onClick={onSubmit}
            disabled={isSubmitting || hasErrors}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed font-medium hover:bg-blue-700 transition-colors"
          >
            {isSubmitting ? "Submitting..." : "Submit Prescription"}
          </button>
        </div>
      </div>
    </div>
  );
}
