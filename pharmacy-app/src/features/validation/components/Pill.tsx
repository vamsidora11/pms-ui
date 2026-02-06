import React from "react";
import clsx from "clsx";

export function Pill({
  children,
  tone = "gray",
}: {
  children: React.ReactNode;
  tone?: "red" | "green" | "blue" | "gray" | "amber" | "yellow";
}) {
  const map = {
    red: "bg-red-100 text-red-800",
    green: "bg-green-100 text-green-800",
    blue: "bg-blue-100 text-blue-800",
    gray: "bg-gray-100 text-gray-700",
    amber: "bg-amber-100 text-amber-800",
    yellow: "bg-yellow-100 text-yellow-800",
  } as const;

  return (
    <span className={clsx("px-2 py-0.5 rounded text-xs inline-flex items-center gap-1", map[tone])}>
      {children}
    </span>
  );
}