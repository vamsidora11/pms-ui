// src/features/labels/components/LabelQueueList.tsx
import type { LabelQueuePrescription } from "@labels/types/label.types";

type Props = {
  prescriptions: LabelQueuePrescription[];
  loading: boolean;
  error?: string | null;
  selectedId?: string | null;
  onSelect: (id: string) => void;
};

export function LabelQueueList({
  prescriptions,
  loading,
  error,
  selectedId,
  onSelect,
}: Props) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
      <div className="p-6 border-b border-gray-100">
        <h2 className="font-semibold text-gray-900">Ready Prescriptions</h2>
      </div>

      {loading && <div className="p-4 text-gray-500">Loading...</div>}

      {!loading && error && (
        <div className="p-4 text-red-600">{error}</div>
      )}

      {!loading && !error && prescriptions.length === 0 && (
        <div className="p-4 text-gray-500">No prescriptions ready for labels</div>
      )}

      <div className="divide-y divide-gray-100">
        {prescriptions.map((rx) => {
          const isActive = selectedId === rx.id;

          return (
            <button
              key={rx.id}
              onClick={() => onSelect(rx.id)}
              className={`w-full p-4 text-left transition-colors ${
                isActive ? "bg-blue-50" : "hover:bg-gray-50"
              }`}
            >
              <div className="font-medium text-gray-900">{rx.id}</div>
              <div className="text-gray-600">{rx.patientName}</div>
              <div className="text-sm text-gray-500">{rx.medicineCount} medication(s)</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}