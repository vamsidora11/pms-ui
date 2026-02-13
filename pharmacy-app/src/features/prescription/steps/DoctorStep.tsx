import { useMemo } from "react";
import type { DoctorDetails } from "../types/models";

interface DoctorStepProps {
  doctor: DoctorDetails;
  onChange: (doctor: DoctorDetails) => void;
}

export default function DoctorStep({ doctor, onChange }: DoctorStepProps) {
  const handleChange = (field: keyof DoctorDetails, value: string) => {
    onChange({
      ...doctor,
      [field]: value,
    });
  };

  // ✅ Validation: allow any chars, but warn if non alphabet/space is present
  const nameWarning = useMemo(() => {
    if (!doctor.name) return "";
    return /^[A-Za-z ]*$/.test(doctor.name)
      ? ""
      : "Only alphabets and spaces are allowed";
  }, [doctor.name]);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
      <div className="p-6 border-b border-gray-100">
        <h2 className="text-xl font-semibold text-gray-900 mb-1">
          Doctor Information
        </h2>
        <p className="text-sm text-gray-500">
          Enter prescribing doctor details
        </p>
      </div>

      <div className="p-6 space-y-6">
        {/* Doctor ID */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Doctor ID <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={doctor.id}
            onChange={(e) => handleChange("id", e.target.value)}
            placeholder="e.g., DR-001, DOC123"
            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg
                       focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="mt-1 text-xs text-gray-500">
            Enter the doctor's id
          </p>
        </div>

        {/* Doctor Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Doctor Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={doctor.name}
            onChange={(e) => handleChange("name", e.target.value)} // ✅ still allows any chars
            placeholder="e.g., John Smith"
            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg
                       focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          {/* ✅ Only add warning when invalid; otherwise keep your original helper text */}
          {nameWarning ? (
            <p className="mt-1 text-xs text-red-600">{nameWarning}</p>
          ) : (
            <p className="mt-1 text-xs text-gray-500">
              Enter the full name of the prescribing doctor
            </p>
          )}
        </div>

        {/* Preview */}
        {doctor.id && doctor.name && (
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              Preview
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-gray-600 mb-1">Doctor ID</div>
                <div className="text-sm font-medium text-gray-900">
                  {doctor.id}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-600 mb-1">Doctor Name</div>
                <div className="text-sm font-medium text-gray-900">
                  {doctor.name}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}