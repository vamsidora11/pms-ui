// src/features/labels/components/MedicationLabelCard.tsx
import type { LabelMedicine, LabelPrescriptionDetails } from "@labels/types/label.types";
import { getFrequencyLabel } from "@labels/types/label.types";
import { formatDate } from "@utils/format";

type Props = {
  prescription: LabelPrescriptionDetails;
  medicine: LabelMedicine;
};

export function MedicationLabelCard({ prescription, medicine }: Props) {
  return (
    <div
      className="print-label border-2 border-gray-300 rounded-lg p-6 bg-white mb-6"
      style={{ fontFamily: "monospace" }}
    >
      {/* Pharmacy Header */}
      <div className="border-b-2 border-gray-300 pb-4 mb-4">
        <div className="font-bold">MEDIFLOW PHARMACY</div>
        <div>123 Healthcare Blvd, Springfield, IL 62701</div>
        <div>Phone: (555) 123-4567</div>
      </div>

      {/* RX Info */}
      <div className="grid grid-cols-2 gap-4 mb-4 pb-4 border-b-2 border-gray-300">
        <div>
          <div className="text-xs">PATIENT</div>
          <div>{prescription.patientName}</div>
        </div>

        <div>
          <div className="text-xs">RX #</div>
          <div>{prescription.id}</div>
        </div>

        <div>
          <div className="text-xs">DATE</div>
          <div>{formatDate(prescription.createdAt)}</div>
        </div>

        <div>
          <div className="text-xs">DOCTOR</div>
          <div>{prescription.prescriber.name}</div>
        </div>
      </div>

      {/* Medication */}
      <div className="mb-4">
        <div className="font-semibold">
          {medicine.name} {medicine.strength}
        </div>

        <div className="mb-2">QTY: {medicine.prescribedQuantity}</div>
        <div className="mb-2">Frequency: {getFrequencyLabel(medicine.frequency)}</div>

        <div className="bg-yellow-50 border border-yellow-300 rounded p-3">
          <div className="font-semibold">DIRECTIONS:</div>
          <div>{medicine.instruction}</div>
        </div>
      </div>

      {/* Warnings */}
      <div className="border-t-2 border-gray-300 pt-4">
        <div className="font-semibold mb-2">⚠ WARNINGS</div>
        <ul className="space-y-1">
          <li>• Take as directed by physician</li>
          <li>• Do not share this medication</li>
          <li>• Store at room temperature</li>
          <li>• Keep out of reach of children</li>
        </ul>
      </div>

      {/* Footer */}
      <div className="text-sm text-gray-500 mt-4 pt-4 border-t border-gray-300">
        Pharmacist: Dr. Jane Smith • License: PH-12345
      </div>
    </div>
  );
}