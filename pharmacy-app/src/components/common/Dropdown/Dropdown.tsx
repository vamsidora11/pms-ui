import type { ReactNode } from "react";

export interface DropdownOption {
  label: string;
  value: string;
}

export interface DropdownProps {
  label?: ReactNode;
  value: string;
  onChange: (v: string) => void;
  options: Array<string | DropdownOption>;
  id?: string;
  disabled?: boolean;
  className?: string;
  selectClassName?: string;
}

function normalizeOption(option: string | DropdownOption): DropdownOption {
  if (typeof option === "string") {
    return { label: option, value: option };
  }
  return option;
}

export default function Dropdown({
  label,
  value,
  onChange,
  options,
  id,
  disabled = false,
  className = "",
  selectClassName = "",
}: DropdownProps) {
  const normalizedOptions = options.map(normalizeOption);

  return (
    <div className={className}>
      {label ? <label className="text-sm font-medium text-gray-700 mb-1 block">{label}</label> : null}
      <select
        id={id}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-60 ${selectClassName}`}
      >
        {normalizedOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
