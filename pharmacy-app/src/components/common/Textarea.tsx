import React from "react";

type TextareaProps = {
  value?: string;
  placeholder?: string;
  rows?: number;
  variant?: "default" | "error" | "success";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  className?: string;
};

export default function Textarea({
  value,
  placeholder,
  rows = 3,
  variant = "default",
  size = "md",
  disabled = false,
  onChange,
  className = "",
}: TextareaProps) {
  const base =
    "w-full rounded-lg border transition focus:outline-none focus:ring-2";

  const variants = {
    default:
      "border-gray-300 focus:ring-blue-500 focus:border-blue-500",
    error:
      "border-red-500 focus:ring-red-500 focus:border-red-500",
    success:
      "border-green-500 focus:ring-green-500 focus:border-green-500",
  };

  const sizes = {
    sm: "px-3 py-2 text-sm",
    md: "px-4 py-2 text-sm",
    lg: "px-4 py-3 text-base",
  };

  return (
    <textarea
      value={value}
      placeholder={placeholder}
      rows={rows}
      disabled={disabled}
      onChange={onChange}
      className={`
        ${base}
        ${variants[variant]}
        ${sizes[size]}
        ${disabled ? "opacity-50 cursor-not-allowed" : ""}
        ${className}
      `}
    />
  );
}
