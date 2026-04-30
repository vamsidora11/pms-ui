// src/features/labels/components/LabelQueueList.tsx
import type { LabelQueuePrescription } from "@labels/types/label.types";
import { formatDate } from "@utils/format";

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

type Props = {
  prescriptions: LabelQueuePrescription[];
  loading: boolean;
  error?: string | null;
  selectedId?: string | null;
  onSelect: (dispenseId: string, patientId: string) => void;
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
        <h2 className="font-semibold text-gray-900">Ready for Labels</h2>
      </div>

      {loading && <div className="p-4 text-gray-500">Loading...</div>}

      {!loading && error && (
        <div className="p-4 text-red-600">{error}</div>
      )}

      {!loading && !error && prescriptions.length === 0 && (
        <div className="p-4 text-gray-500">No dispenses ready for labels</div>
      )}

      <div className="divide-y divide-gray-100">
        {prescriptions.map((rx) => {
          const isActive = selectedId === rx.id;

          return (
            <button
              key={rx.id}
              type="button"
              onClick={() => onSelect(rx.id, rx.patientId)}
              className={`w-full p-4 text-left transition-colors ${
                isActive ? "bg-blue-50" : "hover:bg-gray-50"
              }`}
            >
              <div className="font-medium text-gray-900">{rx.patientName}</div>
              <div className="text-sm text-gray-600">Dispense ID: {rx.id}</div>
              <div className="text-sm text-gray-600">Prescription ID: {rx.prescriptionId}</div>
              <div className="mt-2 flex items-center justify-between text-sm text-gray-500">
                <span>{formatDate(rx.dispenseDate)}</span>
                <span>{rx.itemCount} item(s)</span>
              </div>
              <div className="mt-1 flex items-center justify-between text-xs uppercase tracking-wide text-gray-400">
                <span>{rx.status}</span>
                <span>{formatCurrency(rx.grandTotal)}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
