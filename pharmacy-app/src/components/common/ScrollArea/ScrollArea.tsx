import React from "react";

type ScrollAreaProps = {
  children: React.ReactNode;
  height?: string;
  width?: string;
  className?: string;
};

export default function ScrollArea({
  children,
  height = "h-full",
  width = "w-full",
  className = "",
}: ScrollAreaProps) {
  const base = "relative overflow-auto";

  return (
    <div
      className={`
        ${base}
        ${height}
        ${width}
        scrollbar-thin
        scrollbar-thumb-gray-300
        scrollbar-track-transparent
        ${className}
      `}
    >
      {children}
    </div>
  );
}
