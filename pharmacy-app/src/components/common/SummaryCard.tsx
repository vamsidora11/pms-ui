import React from "react";

type SummaryCardProps = {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  footer?: string;
};

export default function SummaryCard({
  title,
  value,
  icon,
  footer,
}: SummaryCardProps) {
  return (
    <div className="p-4 bg-white rounded-lg shadow-sm border flex items-center gap-4">
      {icon && <div className="text-blue-600">{icon}</div>}
      <div className="flex flex-col">
        <span className="text-gray-500 text-sm">{title}</span>
        <span className="text-2xl font-bold">{value}</span>
        {footer && <span className="text-green-600 text-sm">{footer}</span>}
      </div>
    </div>
  );
}


