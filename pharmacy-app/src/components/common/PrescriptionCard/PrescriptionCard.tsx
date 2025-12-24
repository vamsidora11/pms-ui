import React from "react";

interface PrescriptionCardProps {
  rxId: string;
  patientName: string;
  timestamp: string;
  itemCount?: number;
  status?: "Urgent" | "Ready" | "Collected" | "In Progress"; // restrict to known statuses
  primaryActionLabel?: string;
  onPrimaryAction?: () => void;
  onViewDetails?: () => void;
}

const PrescriptionCard: React.FC<PrescriptionCardProps> = ({
  rxId,
  patientName,
  timestamp,
  itemCount,
  status,
  primaryActionLabel,
  onPrimaryAction,
  onViewDetails,
}) => {
  const statusColor =
    status === "Urgent"
      ? "bg-red-100 text-red-600"
      : status === "Ready"
      ? "bg-green-100 text-green-600"
      : status === "Collected"
      ? "bg-purple-100 text-purple-600"
      : "bg-gray-100 text-gray-600";

  return (
    <div className="p-4 bg-white rounded-lg shadow-md border border-gray-200">
      <div className="flex justify-between items-center mb-2">
        <h4 className="font-semibold text-gray-800">{patientName}</h4>
        {status && (
          <span className={`text-xs px-2 py-1 rounded ${statusColor}`}>
            {status}
          </span>
        )}
      </div>
      <p className="text-sm text-gray-600">RX: {rxId}</p>
      <p className="text-xs text-gray-500">{timestamp}</p>
      {itemCount !== undefined && (
        <p className="text-xs text-gray-500">{itemCount} items</p>
      )}

      <div className="flex space-x-2 mt-3">
        {primaryActionLabel && (
          <button
            onClick={onPrimaryAction}
            className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            {primaryActionLabel}
          </button>
        )}
        {onViewDetails && (
          <button
            onClick={onViewDetails}
            className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
          >
            View
          </button>
        )}
      </div>
    </div>
  );
};

export default PrescriptionCard;
