import React from "react";
import { User, Pill, AlertCircle } from "lucide-react";
 
import type {
  PrescriptionSummaryDto,
  PrescriptionDetailsDto,
  PrescriptionMedicineDto,
} from "@prescription/prescription.types";
import type { PatientDetails } from "@prescription/models";
 
import { calculateAgeFromDob } from "../prescriptionHistoryUtils";
 
type Props = {
  row: PrescriptionSummaryDto;
  details: PrescriptionDetailsDto | null;
  patient: PatientDetails | null;
  patientLoading: boolean;
};
 
export default function PrescriptionExpandedDetails({
  row,
  details,
  patient,
  patientLoading,
}: Props) {
  if (!details) {
    return (
      <div className="p-8 text-gray-500">
        Loading prescription details...
      </div>
    );
  }
 
  const age = calculateAgeFromDob(patient?.dob);
 
  return (
    <div className="bg-gradient-to-br from-slate-50 via-blue-50 to-emerald-50 p-8">
      <div className="grid grid-cols-12 gap-6">
        {/* ================= PATIENT ================= */}
        <div className="col-span-4 flex">
          <div className="rounded-2xl border border-blue-200/70 bg-white shadow-md shadow-blue-100/60 overflow-hidden flex-1 flex flex-col">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-white/25 rounded-xl flex items-center justify-center">
                <User className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="text-sm font-bold text-white">
                  Patient Information
                </div>
                <div className="text-xs text-blue-100/90">
                  Demographics & Records
                </div>
              </div>
            </div>
 
            <div className="p-5 space-y-4 divide-y flex-1 min-h-0 max-h-96 overflow-auto">
              {patient ? (
                <>
                  <div>
                    <div className="text-xs text-gray-500">FULL NAME</div>
                    <div className="text-lg font-bold">
                      {patient.fullName}
                    </div>
                  </div>
 
                  <div className="grid grid-cols-2 gap-3 pt-4">
                    <div className="bg-blue-50 border border-blue-100 p-3 rounded-lg">
                      <div className="text-[11px] text-blue-700/70">
                        Age
                      </div>
                      <div className="font-bold">
                        {age ?? "—"}
                      </div>
                    </div>
 
                    <div className="bg-blue-50 border border-blue-100 p-3 rounded-lg">
                      <div className="text-[11px] text-blue-700/70">
                        Gender
                      </div>
                      <div className="font-bold">
                        {patient.gender ?? "—"}
                      </div>
                    </div>
                  </div>
 
                  <div>
                    <div className="text-xs text-gray-500">Phone</div>
                    <div className="font-medium">
                      {patient.phone ?? "—"}
                    </div>
                  </div>
 
                  {/* ===== ALLERGIES (FIXED) ===== */}
                  {Array.isArray(patient.allergies) &&
                    patient.allergies.length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 text-rose-700 mb-2">
                          <AlertCircle className="w-4 h-4" />
                          <span className="text-xs font-bold">
                            ALLERGIES
                          </span>
                        </div>
 
                        {patient.allergies.map((a) => (
                          <div
                            key={a}
                            className="bg-rose-50 border border-rose-200 rounded-md px-3 py-2 text-sm mb-2"
                          >
                            {a}
                          </div>
                        ))}
                      </div>
                    )}
                </>
              ) : patientLoading ? (
                <div className="text-gray-500">
                  Loading patient...
                </div>
              ) : (
                <div className="text-gray-500">
                  Patient details not available.
                </div>
              )}
            </div>
          </div>
        </div>
 
        {/* ================= MEDICATIONS ================= */}
        <div className="col-span-8 flex">
          <div className="rounded-2xl border border-emerald-200/70 bg-white shadow-md shadow-emerald-100/60 overflow-hidden flex-1 flex flex-col">
            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-4 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/25 rounded-xl flex items-center justify-center">
                  <Pill className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="text-sm font-bold text-white">
                    Prescribed Medications
                  </div>
                  <div className="text-xs text-emerald-100/90">
                    Complete medication list
                  </div>
                </div>
              </div>
 
              <div className="bg-white/20 px-3 py-1 rounded-full text-white text-sm font-bold">
                {details.medicines?.length || 0} items
              </div>
            </div>
 
            <div className="p-5 space-y-5 flex-1 min-h-0 max-h-96 overflow-auto">
              {details.medicines?.map(
                (med: PrescriptionMedicineDto, idx) => (
                  <div
                    key={med.prescriptionMedicineId}
                    className="border border-emerald-200 rounded-xl p-5 bg-emerald-50/40 shadow-sm"
                  >
                    <div className="flex justify-between mb-3">
                      <div>
                        <div className="text-lg font-bold">
                          {med.name}
                        </div>
                        <div className="text-sm font-semibold text-green-600">
                          {med.strength}
                        </div>
                      </div>
 
                      <div className="bg-emerald-100 text-emerald-800 text-xs font-bold px-3 h-7 min-w-[2.5rem] rounded-full inline-flex items-center justify-center leading-none tabular-nums">
                        #{idx + 1}
                      </div>
                    </div>
 
                    <div className="grid grid-cols-3 gap-3 mb-4">
                      <div className="bg-white border rounded-lg p-3">
                        <div className="text-[11px] text-emerald-700/70">
                          Quantity
                        </div>
                        <div className="font-bold">
                          {med.prescribedQuantity}
                        </div>
                      </div>
 
                      <div className="bg-white border rounded-lg p-3">
                        <div className="text-[11px] text-emerald-700/70">
                          Days
                        </div>
                        <div className="font-bold">
                          {med.daysSupply}
                        </div>
                      </div>
 
                      <div className="bg-white border rounded-lg p-3">
                        <div className="text-[11px] text-emerald-700/70">
                          Refills
                        </div>
                        <div className="font-bold">
                          {med.refillsRemaining}
                        </div>
                      </div>
                    </div>
 
                    {med.instruction && (
                      <div className="pt-3 border-t">
                        <div className="text-xs font-semibold text-gray-500 mb-1">
                          INSTRUCTIONS
                        </div>
                        <div className="text-sm text-gray-700">
                          {med.instruction}
                        </div>
                      </div>
                    )}
                  </div>
                )
              )}
 
              {!details.medicines?.length && (
                <div className="text-gray-500">
                  No medicines found.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
 
      {/* Hidden future hook */}
      <div className="sr-only">{row.id}</div>
    </div>
  );
}
 
 