import React from "react";

type InputProps = {
  label?: string;
  placeholder?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  required?: boolean;
  error?: string;
  disabled?: boolean;
  success?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  className?: string;
};

export default function Input({
  label,
  placeholder,
  value,
  onChange,
  type = "text",
  required = false,
  error,
  disabled = false,
  success = false,
  leftIcon,
  rightIcon,
  className = "",
}: InputProps) {
  return (
    <div className="flex flex-col mb-4">
      {/* Label */}
      {label && (
        <label className="mb-1 font-medium">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      <div
        className={`flex items-center border rounded px-3 py-2 
          ${error ? "border-red-500" : success ? "border-green-500" : "border-gray-300"}
          ${disabled ? "bg-gray-100 cursor-not-allowed" : ""}
          ${className}
        `}
      >
        {/* Left Icon */}
        {leftIcon && <span className="mr-2">{leftIcon}</span>}

        {/* Actual Input */}
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          disabled={disabled}
          className="flex-1 outline-none bg-transparent"
        />

        {/* Right Icon */}
        {rightIcon && <span className="ml-2">{rightIcon}</span>}
      </div>

      {/* Error Message */}
      {error && (
        <p className="text-red-500 text-sm mt-1">
          {error}
        </p>
      )}
    </div>
  );
}
