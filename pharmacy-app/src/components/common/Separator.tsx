// import React from "react";

type SeparatorProps = {
  orientation?: "horizontal" | "vertical";
  variant?: "default" | "muted" | "strong";
  size?: "sm" | "md" | "lg";
  className?: string;
};

export default function Separator({
  orientation = "horizontal",
  variant = "default",
  size = "md",
  className = "",
}: SeparatorProps) {
  const base = "shrink-0";

  const orientations = {
    horizontal: "w-full",
    vertical: "h-full",
  };

  const variants = {
    default: "bg-gray-300",
    muted: "bg-gray-200",
    strong: "bg-gray-400",
  };

  const sizes = {
    sm: orientation === "horizontal" ? "h-px" : "w-px",
    md: orientation === "horizontal" ? "h-[2px]" : "w-[2px]",
    lg: orientation === "horizontal" ? "h-[4px]" : "w-[4px]",
  };

  return (
    <div
      role="separator"
      aria-orientation={orientation}
      className={`
        ${base}
        ${orientations[orientation]}
        ${variants[variant]}
        ${sizes[size]}
        ${className}
      `}
    />
  );
}
