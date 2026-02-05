import "react-phone-number-input/style.css";
import PhoneInput, { type Value } from "react-phone-number-input";
import clsx from "clsx";

type Props = {
  label: React.ReactNode;
  value: string;                 // E.164 like +919876543210 or ""
  onChange: (v: string) => void; // E.164 or ""
  error?: string;
  warning?: string;
  defaultCountry?: any;          // "IN", "US", etc.
};

export default function AppPhoneInput({
  label,
  value,
  onChange,
  error,
  warning,
  defaultCountry = "IN",
}: Props) {
  return (
    <div>
      <label className="text-sm font-medium text-gray-700 mb-1 block">{label}</label>

      <div
        className={clsx(
          "rounded-xl border bg-gray-50 px-3 py-2 focus-within:ring-2",
          error ? "border-red-400 focus-within:ring-red-300" : "border-gray-200 focus-within:ring-blue-500"
        )}
      >
        <PhoneInput
          international
          defaultCountry={defaultCountry}
          value={(value || "") as Value}
          onChange={(v) => onChange((v || "").toString())}
          className="phone-input"
        />
      </div>

      {error ? (
        <p className="mt-1 text-xs text-red-600">{error}</p>
      ) : warning ? (
        <p className="mt-1 text-xs text-amber-600">{warning}</p>
      ) : null}
    </div>
  );
}