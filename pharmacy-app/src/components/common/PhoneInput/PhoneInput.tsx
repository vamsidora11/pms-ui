import React, { useState } from "react";
import "react-phone-number-input/style.css";
import "../../../styles/phone-input.css";
import PhoneInput, { type Country, type Value } from "react-phone-number-input";
import clsx from "clsx";

type Props = {
  label: React.ReactNode;
  value: string;                 // E.164 or ""
  onChange: (v: string) => void; // E.164 or ""
  error?: string;
  warning?: string;
  defaultCountry?: Country;
  disabled?: boolean;
};

export default function AppPhoneInput({
  label,
  value,
  onChange,
  error,
  warning,
  defaultCountry = "IN",
  disabled = false,
}: Props) {
  // ✅ Control country (prevents number disappearing on country change)
  const [country, setCountry] = useState<Country>(defaultCountry);

  return (
    <div className="flex flex-col gap-1">
      {/* Label */}
      <label className="text-sm font-medium text-gray-900 mb-1 block">
        {label}
      </label>

      {/* Wrapper - EXACT same as Input.tsx */}
      <div
        className={clsx(
          "flex items-center gap-3 h-11 px-4 rounded-lg transition-all duration-200 shadow-inner",
          disabled
            ? "bg-gray-100 cursor-not-allowed opacity-70"
            : "bg-gray-50 border border-gray-200 hover:bg-gray-200 focus-within:bg-gray-200 focus-within:ring-2 focus-within:ring-blue-500",
          error && "ring-1 ring-red-500 bg-red-50",
          "phone-input-shell" // hook for tiny CSS adjustments (optional)
        )}
      >
        <PhoneInput
          className="phone-input w-full" // hook for CSS below
          international={false}
          country={country}
          onCountryChange={(c) => setCountry((c || defaultCountry) as Country)}
          value={(value || "") as Value}
          onChange={(v) => onChange((v || "").toString())}
          disabled={disabled}
        />
      </div>

      {/* Error / Warning */}
      {error ? (
        <p className="text-xs text-red-500 mt-1">{error}</p>
      ) : warning ? (
        <p className="text-xs text-red-600 mt-1">{warning}</p>
      ) : null}
    </div>
  );
}