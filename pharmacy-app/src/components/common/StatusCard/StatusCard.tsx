import React from "react";

interface StatusCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  bgColor?: string;
  textColor?: string;
  onClick?: () => void;
}

const StatusCard: React.FC<StatusCardProps> = ({
  title,
  value,
  icon,
  bgColor = "bg-gray-100",
  textColor = "text-gray-800",
  onClick,
}) => {
  return (
    <div
      className={`flex items-center justify-between p-4 rounded-lg shadow-sm cursor-pointer ${bgColor} ${textColor}`}
      onClick={onClick}
    >
      <div className="flex items-center space-x-3">
        {icon && <div className="text-xl">{icon}</div>}
        <h3 className="text-sm font-medium">{title}</h3>
      </div>

      <span className="text-2xl font-bold">{value}</span>
    </div>
  );
};

export default StatusCard;
