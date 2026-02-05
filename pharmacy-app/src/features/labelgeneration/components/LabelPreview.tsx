// src/features/labels/components/LabelPreview.tsx
import { Download, Printer } from "lucide-react";
import type { LabelPrescriptionDetails } from "@labels/label.types";
import { MedicationLabelCard } from "./MedicationLabelCard";

type Props = {
  selected: LabelPrescriptionDetails | null;
  loading: boolean;
  error?: string | null;
  onPrint: () => void;
  onDownload?: () => void; // keep open for future
};

export function LabelPreview({
  selected,
  loading,
  error,
  onPrint,
  onDownload,
}: Props) {
  return (
    <div className="col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm">
      <div className="p-6 border-b border-gray-100 flex justify-between items-center">
        <h2 className="font-semibold text-gray-900">Label Preview</h2>

        {selected && (
          <div className="flex gap-2">
            <button
              onClick={onDownload}
              className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50"
              type="button"
            >
              <Download size={16} />
              Download
            </button>

            <button
              onClick={onPrint}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-white bg-gradient-to-r from-blue-600 to-teal-500 hover:from-blue-700 hover:to-teal-600"
              type="button"
            >
              <Printer size={16} />
              Print Label
            </button>
          </div>
        )}
      </div>

      <div className="p-6">
        {!selected && !loading && !error && (
          <div className="text-center py-12 text-gray-500">
            Select a prescription to preview labels
          </div>
        )}

        {loading && (
          <div className="text-center py-12 text-gray-500">
            Loading prescription...
          </div>
        )}

        {!loading && error && (
          <div className="text-center py-12 text-red-600">{error}</div>
        )}

        {!loading &&
          selected &&
          selected.medicines.map((med) => (
            <MedicationLabelCard
              key={med.prescriptionMedicineId}
              prescription={selected}
              medicine={med}
            />
          ))}
      </div>
    </div>
  );
}
