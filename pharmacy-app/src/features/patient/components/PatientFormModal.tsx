import { useEffect, forwardRef } from "react";
import { X } from "lucide-react";
import clsx from "clsx";

import Input from "@components/common/Input/Input";
import Dropdown from "@components/common/Dropdown/Dropdown";
import AppPhoneInput from "@components/common/PhoneInput/PhoneInput";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "@styles/datepicker.css";
import { searchAllergies } from "@api/catalogs";

import {
  usePatientForm,
  type PatientFormValues,
} from "@patient/hooks/usePatientForm";
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
  onSubmit: (values: PatientFormValues) => Promise<void> | void;
  closeOnSuccess?: boolean;
  showGender?: boolean;
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
  showGender = true,
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

  useEffect(() => {
    document.body.style.overflow = "hidden";

    const onEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    globalThis.addEventListener("keydown", onEsc);

    return () => {
      document.body.style.overflow = "";
      globalThis.removeEventListener("keydown", onEsc);
    };
  }, [onClose]);

  const parseDobToDate = (dob: string): Date | null => {
    if (!dob) {
      return null;
    }

    const parsed = new Date(dob);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  };

  const formatDateToString = (date: Date | null): string => {
    if (!date) {
      return "";
    }

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <form
        autoComplete="off"
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
        className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-500 hover:text-gray-800"
          >
            <X />
          </button>
        </div>

        {formError && (
          <div className="bg-red-100 px-6 py-3 text-red-700">{formError}</div>
        )}

        <div className="flex-1 space-y-5 overflow-y-auto px-6 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Input
                label={<RequiredLabel text="Full Name" />}
                value={form.fullName}
                onChange={(value) => updateField("fullName", value)}
                error={errors.fullName}
              />
              {!errors.fullName && warnings.fullName && (
                <p className="mt-1 text-xs text-red-600">{warnings.fullName}</p>
              )}
            </div>

            <div className="flex flex-col gap-1">
              <label className="mb-1 block text-sm font-medium text-gray-900">
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
                onKeyDown={(event) => {
                  if (
                    !/[0-9]/.test(event.key) &&
                    event.key !== "Backspace" &&
                    event.key !== "Delete" &&
                    event.key !== "Tab" &&
                    event.key !== "ArrowLeft" &&
                    event.key !== "ArrowRight" &&
                    event.key !== "-" &&
                    event.key !== "/"
                  ) {
                    event.preventDefault();
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
            {showGender ? (
              <Dropdown
                label="Gender"
                value={form.gender}
                onChange={(value) => updateField("gender", value)}
                options={["Male", "Female", "Other"]}
              />
            ) : (
              <Input label="Gender" value={form.gender} onChange={() => {}} />
            )}

            <div>
              <AppPhoneInput
                label={<RequiredLabel text="Phone" />}
                value={form.phone}
                onChange={(value) => updateField("phone", value)}
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
              onChange={(value) => updateField("email", value)}
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
              onChange={(value) => updateField("address", value)}
              error={errors.address}
            />
            {!errors.address && warnings.address && (
              <p className="mt-1 text-xs text-red-600">{warnings.address}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">{form.address.length}/50</p>
          </div>

          <div className="space-y-4 rounded-xl border border-gray-200 bg-gray-50/60 p-4">
            <div>
              <h4 className="text-sm font-semibold text-gray-900">Insurance</h4>
              <p className="mt-1 text-xs text-gray-500">
                Enter both fields to attach insurance information to this patient.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Insurance Provider"
                value={form.insuranceProvider}
                onChange={(value) => updateField("insuranceProvider", value)}
              />
              <Input
                label="Policy ID"
                value={form.insurancePolicyId}
                onChange={(value) => updateField("insurancePolicyId", value)}
              />
            </div>
          </div>

          <AllergySelector
            query={form.newAllergy}
            onQueryChange={(value) => updateField("newAllergy", value)}
            selected={form.allergies}
            onAdd={addAllergy}
            onRemove={removeAllergy}
            searchFn={searchAllergies}
            minChars={2}
            debounceMs={250}
          />
        </div>

        <div className="flex justify-end gap-3 border-t px-6 py-4">
          <button
            type="button"
            onClick={() => {
              setFormError("");
              onClose();
            }}
            className="rounded-lg border px-4 py-2 hover:bg-gray-50"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={submitting}
            className={clsx(
              "rounded-lg px-5 py-2 text-white",
              submitting
                ? "cursor-not-allowed bg-gray-400"
                : "bg-gradient-to-r from-blue-600 to-teal-500 hover:from-blue-700 hover:to-teal-600",
            )}
          >
            {submitting ? "Saving..." : submitLabel}
          </button>
        </div>
      </form>
    </div>
  );
}
