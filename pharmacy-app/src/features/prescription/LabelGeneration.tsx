import { useState } from "react";
import { Printer, Download } from "lucide-react";

/* =========================
   Dummy Data Types
========================= */
interface Medication {
  drugName: string;
  strength: string;
  quantity: number;
  instructions: string;
}

interface Prescription {
  id: string;
  patientName: string;
  doctorName: string;
  createdAt: Date;
  medications: Medication[];
}

/* =========================
   Dummy Prescriptions
========================= */
const DUMMY_PRESCRIPTIONS: Prescription[] = [
  {
    id: "RX-2026-003",
    patientName: "Maria Garcia",
    doctorName: "Dr. Michael Chen",
    createdAt: new Date("2026-01-01"),
    medications: [
      {
        drugName: "Amoxicillin",
        strength: "500mg",
        quantity: 21,
        instructions: "Take three times daily with food",
      },
    ],
  },
  {
    id: "RX-2026-005",
    patientName: "Emily Davis",
    doctorName: "Dr. Robert Allen",
    createdAt: new Date("2026-01-02"),
    medications: [
      {
        drugName: "Paracetamol",
        strength: "650mg",
        quantity: 10,
        instructions: "Take one tablet every 6 hours as needed",
      },
    ],
  },
];

/* =========================
   Component
========================= */
export default function LabelGeneration() {
  const [selectedPrescription, setSelectedPrescription] =
    useState<Prescription | null>(null);

  const handlePrint = () => window.print();

  const formatDate = (date: Date) =>
    date.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">
          Label Generation
        </h1>
        <p className="text-gray-500">
          Generate and print medication labels
        </p>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Ready Prescriptions */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="p-6 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">
              Ready Prescriptions
            </h2>
          </div>

          <div className="divide-y divide-gray-100">
            {DUMMY_PRESCRIPTIONS.map((rx) => (
              <button
                key={rx.id}
                onClick={() => setSelectedPrescription(rx)}
                className={`w-full p-4 text-left transition-colors ${
                  selectedPrescription?.id === rx.id
                    ? "bg-blue-50"
                    : "hover:bg-gray-50"
                }`}
              >
                <div className="font-medium text-gray-900">{rx.id}</div>
                <div className="text-gray-600">{rx.patientName}</div>
                <div className="text-sm text-gray-500">
                  {rx.medications.length} medication(s)
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Label Preview */}
        <div className="col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="p-6 border-b border-gray-100 flex justify-between items-center">
            <h2 className="font-semibold text-gray-900">Label Preview</h2>

            {selectedPrescription && (
              <div className="flex gap-2">
                <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50">
                  <Download size={16} />
                  Download
                </button>

                <button
                  onClick={handlePrint}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-white bg-gradient-to-r from-blue-600 to-teal-500 hover:from-blue-700 hover:to-teal-600 shadow-md"
                >
                  <Printer size={16} />
                  Print Label
                </button>
              </div>
            )}
          </div>

          <div className="p-6">
            {!selectedPrescription && (
              <div className="text-center py-12 text-gray-500">
                Select a prescription to preview labels
              </div>
            )}

            {selectedPrescription &&
              selectedPrescription.medications.map((med, idx) => (
                <div
                  key={idx}
                  className="print-label border-2 border-gray-300 rounded-lg p-6 bg-white"
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
                      <div>{selectedPrescription.patientName}</div>
                    </div>
                    <div>
                      <div className="text-xs">RX #</div>
                      <div>{selectedPrescription.id}</div>
                    </div>
                    <div>
                      <div className="text-xs">DATE</div>
                      <div>
                        {formatDate(selectedPrescription.createdAt)}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs">DOCTOR</div>
                      <div>{selectedPrescription.doctorName}</div>
                    </div>
                  </div>

                  {/* Medication */}
                  <div className="mb-4">
                    <div className="font-semibold">
                      {med.drugName} {med.strength}
                    </div>
                    <div className="mb-2">QTY: {med.quantity}</div>

                    <div className="bg-yellow-50 border border-yellow-300 rounded p-3">
                      <div className="font-semibold">DIRECTIONS:</div>
                      <div>{med.instructions}</div>
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
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}
