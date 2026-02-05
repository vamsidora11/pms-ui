import { useEffect } from "react";
import { X } from "lucide-react";
import clsx from "clsx";

import Input from "@components/common/Input/Input";
import Select from "@components/common/Select/Select";
import AppPhoneInput from "@components/common/PhoneInput/PhoneInput";

import { searchAllergies } from "@api/catalogs";

import { usePatientForm, type PatientFormValues } from "./hooks/usePatientForm";
import AllergySelector from "./components/AllergySelector";

type Props = {
  title: string;
  submitLabel: string;
  initialValues: PatientFormValues;
  onClose: () => void;

  /** Return/throw error to keep modal open and show message */
  onSubmit: (values: PatientFormValues) => Promise<void> | void;

  /** default true */
  closeOnSuccess?: boolean;
};

export default function PatientFormModal({
  title,
  submitLabel,
  initialValues,
  onClose,
  onSubmit,
  closeOnSuccess = true,
}: Props) {
  const {
    form,
    errors,
    warnings,
    formError,
    submitting,
    updateField,
    addAllergy,
    removeAllergy,
    submit,
    setFormError,
  } = usePatientForm({ initialValues, onSubmit, onClose, closeOnSuccess });

  const RequiredLabel = ({ text }: { text: string }) => (
    <span>
      {text} <span className="text-red-600">*</span>
    </span>
  );

  // ESC + lock body scroll (modal responsibility)
  useEffect(() => {
    document.body.style.overflow = "hidden";
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onEsc);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onEsc);
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b flex justify-between items-center">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-800"
          >
            <X />
          </button>
        </div>

        {/* Global alert */}
        {formError && (
          <div className="bg-red-100 text-red-700 px-6 py-3">{formError}</div>
        )}

        {/* Body */}
        <div className="px-6 py-4 overflow-y-auto flex-1 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Input
                label={<RequiredLabel text="Full Name" />}
                value={form.fullName}
                onChange={(v) => updateField("fullName", v)}
                error={errors.fullName}
              />
              {!errors.fullName && warnings.fullName && (
                <p className="mt-1 text-xs text-red-600">{warnings.fullName}</p>
              )}
            </div>

            <div>
              <Input
                label={<RequiredLabel text="Date of Birth" />}
                type="date"
                value={form.dob}
                onChange={(v) => updateField("dob", v)}
                error={errors.dob}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Gender"
              value={form.gender}
              onChange={(v) => updateField("gender", v)}
              options={["Male", "Female", "Other"]}
            />

            <div>
              <AppPhoneInput
                label={<RequiredLabel text="Phone" />}
                value={form.phone}
                onChange={(v) => updateField("phone", v)}
                error={errors.phone}
                warning={warnings.phone}
                defaultCountry="IN"
              />
            </div>
          </div>

          <div>
            <Input
              label="Email"
              value={form.email}
              onChange={(v) => updateField("email", v)}
              error={errors.email}
            />
            {!errors.email && warnings.email && (
              <p className="mt-1 text-xs text-red-600">{warnings.email}</p>
            )}
          </div>

          <div>
            <Input
              label="Address"
              value={form.address}
              onChange={(v) => updateField("address", v)}
              error={errors.address}
            />
            {!errors.address && warnings.address && (
              <p className="mt-1 text-xs text-red-600">{warnings.address}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              {form.address.length}/50
            </p>
          </div>

          {/* ✅ Allergies extracted */}
          <AllergySelector
            query={form.newAllergy}
            onQueryChange={(v) => updateField("newAllergy", v)}
            selected={form.allergies}
            onAdd={addAllergy}
            onRemove={removeAllergy}
            searchFn={searchAllergies}
            minChars={2}
            debounceMs={250}
          />
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t flex justify-end gap-3">
          <button
            onClick={() => {
              setFormError("");
              onClose();
            }}
            className="px-4 py-2 rounded-lg border hover:bg-gray-50"
          >
            Cancel
          </button>

          <button
            onClick={submit}
            disabled={submitting}
            className={clsx(
              "px-5 py-2 rounded-lg text-white",
              submitting
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-gradient-to-r from-blue-600 to-teal-500 hover:from-blue-700 hover:to-teal-600",
            )}
          >
            {submitting ? "Saving..." : submitLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
