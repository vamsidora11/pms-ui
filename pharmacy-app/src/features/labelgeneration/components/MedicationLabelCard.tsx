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
          <div className="text-xs">DISPENSE #</div>
          <div>{prescription.dispenseId}</div>
        </div>

        <div>
          <div className="text-xs">DATE</div>
          <div>{formatDate(prescription.dispenseDate)}</div>
        </div>

        <div>
          <div className="text-xs">PRESCRIPTION #</div>
          <div>{prescription.prescriptionId}</div>
        </div>

        <div>
          <div className="text-xs">STATUS</div>
          <div>{prescription.status}</div>
        </div>

        <div>
          <div className="text-xs">PHARMACIST</div>
          <div>{prescription.pharmacistId}</div>
        </div>
      </div>

      {/* Medication */}
      <div className="mb-4">
        <div className="font-semibold">{medicine.productName}</div>

        <div className="mb-2">QTY: {medicine.quantityDispensed}</div>
        <div className="mb-2">Refill: {medicine.refillNumber}</div>
        <div className="mb-2">Frequency: {getFrequencyLabel(medicine.frequency)}</div>

        <div className="bg-yellow-50 border border-yellow-300 rounded p-3">
          <div className="font-semibold">DIRECTIONS:</div>
          <div>{medicine.instructions}</div>
        </div>
      </div>

      {medicine.lotsUsed.length > 0 && (
        <div className="border-t border-gray-300 pt-4 mb-4">
          <div className="font-semibold mb-2">LOT DETAILS</div>
          <ul className="space-y-1 text-sm">
            {medicine.lotsUsed.map((lot) => (
              <li key={lot.lotId}>
                {lot.lotId}: {lot.quantity} unit(s), exp {formatDate(lot.expiry)}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="border-t border-gray-300 pt-4 mb-4">
        <div className="font-semibold mb-2">PRICING</div>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>Unit Price: ${medicine.pricing.unitPrice.toFixed(2)}</div>
          <div>Total: ${medicine.pricing.total.toFixed(2)}</div>
          <div>Insurance: ${medicine.pricing.insurancePaid.toFixed(2)}</div>
          <div>Patient Payable: ${medicine.pricing.patientPayable.toFixed(2)}</div>
        </div>
        {medicine.isManualAdjustment && (
          <div className="mt-2 text-xs font-semibold text-amber-700">
            Manual adjustment applied
          </div>
        )}
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
