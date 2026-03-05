import { useEffect, forwardRef } from "react";
import { X } from "lucide-react";
import clsx from "clsx";

import Input from "@components/common/Input/Input";
import Dropdown from "@components/common/Dropdown/Dropdown";
import AppPhoneInput from "@components/common/PhoneInput/PhoneInput";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "../../../styles/datepicker.css";
import { searchAllergies } from "@api/catalogs";

import { usePatientForm, type PatientFormValues } from "../hooks/usePatientForm";
import AllergySelector from "./AllergySelector";

export const RequiredLabel: React.FC<{ text: string }> = ({ text }) => (
  <span>
    {text} <span className="text-red-600">*</span>
  </span>
);

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

type DateInputProps = {
  value?: string;
  hasError?: boolean;
};

const DateInput = forwardRef<HTMLInputElement, DateInputProps>(
  ({ value, hasError, ...rest }, ref) => (
    <div
      className={clsx(
        "flex items-center gap-3 h-11 px-4 rounded-lg transition-all duration-200 shadow-inner",
        hasError
          ? "ring-1 ring-red-500 bg-red-50"
          : "bg-gray-50 border border-gray-200 hover:bg-gray-200 focus-within:bg-gray-200 focus-within:ring-2 focus-within:ring-blue-500",
      )}
    >
      <input
        ref={ref}
        value={value ?? ""}
        readOnly
        placeholder="Select date of birth"
        aria-invalid={!!hasError}
        className="w-full bg-transparent text-sm text-gray-900 placeholder:text-gray-500 outline-none border-0"
        {...rest}
      />
    </div>
  ),
);
DateInput.displayName = "DateInput";

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

  // ESC + lock body scroll (modal responsibility)
  useEffect(() => {
    document.body.style.overflow = "hidden";
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    globalThis.addEventListener("keydown", onEsc);
    return () => {
      document.body.style.overflow = "";
      globalThis.removeEventListener("keydown", onEsc);
    };
  }, [onClose]);

  // Parse DOB string to Date object for DatePicker
  const parseDobToDate = (dob: string): Date | null => {
    if (!dob) return null;
    const parsed = new Date(dob);
    return isNaN(parsed.getTime()) ? null : parsed;
  };

  // Format Date object to YYYY-MM-DD string for form state
  const formatDateToString = (date: Date | null): string => {
    if (!date) return "";
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

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

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-900 mb-1 block">
                <RequiredLabel text="Date of Birth" />
              </label>
              <DatePicker
                selected={parseDobToDate(form.dob)}
                onChange={(date: Date | null) => {
                  updateField("dob", formatDateToString(date));
                }}
                dateFormat="yyyy-MM-dd"
                showYearDropdown
                showMonthDropdown
                dropdownMode="select"
                yearDropdownItemNumber={100}
                scrollableYearDropdown
                maxDate={new Date()}
                placeholderText="Select date of birth"
                autoComplete="off"
                onKeyDown={(e) => {
                  // Prevent typing letters, only allow numbers, backspace, delete, tab, and arrow keys
                  if (
                    !/[0-9]/.test(e.key) &&
                    e.key !== "Backspace" &&
                    e.key !== "Delete" &&
                    e.key !== "Tab" &&
                    e.key !== "ArrowLeft" &&
                    e.key !== "ArrowRight" &&
                    e.key !== "-" &&
                    e.key !== "/"
                  ) {
                    e.preventDefault();
                  }
                }}
                customInput={<DateInput hasError={!!errors.dob} />}
                wrapperClassName="w-full"
              />
              {errors.dob && (
                <p className="mt-1 text-xs text-red-600">{errors.dob}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Dropdown
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
