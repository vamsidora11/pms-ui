import React from "react";

type CheckboxProps = {
  label?: string;
  checked: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  error?: string;
  description?: string;
  indeterminate?: boolean;
  className?: string;
};

export default function Checkbox({
  label,
  checked,
  onChange,
  disabled = false,
  error,
  description,
  indeterminate = false,
  className = "",
}: CheckboxProps) {

  const checkboxRef = React.useRef<HTMLInputElement>(null);

  // Set indeterminate visual state
  React.useEffect(() => {
    if (checkboxRef.current) {
      checkboxRef.current.indeterminate = indeterminate;
    }
  }, [indeterminate]);

  return (
    <div className={`flex flex-col mb-2 ${className}`}>
      
      {/* Checkbox & Label */}
      <label className={`flex items-center gap-2 cursor-pointer
        ${disabled ? "cursor-not-allowed opacity-60" : ""}
      `}>
        <input
          ref={checkboxRef}
          type="checkbox"
          checked={checked}
          onChange={onChange}
          disabled={disabled}
          className={`w-4 h-4 border rounded 
            ${error ? "border-red-500" : "border-gray-400"}
            focus:ring-blue-500
          `}
        />

        {label && <span className="text-gray-800 select-none">{label}</span>}
      </label>

      {/* Description text */}
      {description && (
        <p className="text-gray-500 text-sm ml-6">{description}</p>
      )}

      {/* Error message */}
      {error && (
        <p className="text-red-500 text-sm ml-6 mt-1">
          {error}
        </p>
      )}

    </div>
  );
}
