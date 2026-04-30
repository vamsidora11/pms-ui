// import React from "react";

type BadgeVariant =
  | "default"
  | "secondary"
  | "success"
  | "warning"
  | "error"
  | "outline";

type BadgeProps = {
  label: string;
  variant?: BadgeVariant;
  className?: string;
};

export default function Badge({
  label,
  variant = "default",
  className = "",
}: BadgeProps) {
  const base =
    "inline-flex items-center justify-center rounded-md px-2 py-0.5 text-xs font-medium whitespace-nowrap";

  const variants: Record<BadgeVariant, string> = {
    default: "bg-blue-600 text-white",
    secondary: "bg-gray-200 text-gray-800",
    success: "bg-green-100 text-green-700",
    warning: "bg-yellow-100 text-yellow-700",
    error: "bg-red-100 text-red-700",
    outline: "border border-gray-300 text-gray-700 bg-transparent",
  };

  return (
    <span
      role="status"
      className={`
        ${base}
        ${variants[variant]}
        ${className}
      `}
    >
      {label}
    </span>
  );
}
