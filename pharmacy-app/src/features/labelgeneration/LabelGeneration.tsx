// import { useEffect, useState } from "react";
// import { Printer, Download } from "lucide-react";

// import type  {
//   LabelQueuePrescription,
//   LabelPrescriptionDetails,
// } from "@labels/label.types";

// import {
//   getLabelQueue,
//   getPrescriptionForLabels,
// } from "@api/label";

// const FREQUENCY_LABEL_MAP: Record<string, string> = {
//   OD: "Once Daily",
//   BID: "Twice Daily",
//   TID: "Three Times Daily",
//   QID: "Four Times Daily",
//   Q4H: "Every 4 Hours",
//   Q6H: "Every 6 Hours",
//   Q8H: "Every 8 Hours",
//   Q12H: "Every 12 Hours",
//   PRN: "As Needed",
//   STAT: "Immediately",
// };

// function getFrequencyLabel(code?: string) {
//   if (!code) return "";
//   return FREQUENCY_LABEL_MAP[code] ?? code;
// }

/* ================= COMPONENT ================= */

// export default function LabelGeneration() {

//   /* ================= STATE ================= */

//   const [prescriptions, setPrescriptions] =
//     useState<LabelQueuePrescription[]>([]);

//   const [selectedPrescription, setSelectedPrescription] =
//     useState<LabelPrescriptionDetails | null>(null);

//   const [loading, setLoading] = useState(false);

//   /* ================= LOAD QUEUE ================= */

//   useEffect(() => {
//     loadQueue();
//   }, []);

//   async function loadQueue() {
//     setLoading(true);
//     try {
//       const res = await getLabelQueue();
//       setPrescriptions(res.items);
//     } finally {
//       setLoading(false);
//     }
//   }
  
//   /* ================= SELECT RX ================= */

//   async function handleSelectPrescription(id: string) {
//     const data = await getPrescriptionForLabels(id);
//     setSelectedPrescription(data);
//   }

//   /* ================= HELPERS ================= */

//   const handlePrint = () => window.print();

//   const formatDate = (date: string) =>
//     new Date(date).toLocaleDateString("en-US", {
//       month: "long",
//       day: "numeric",
//       year: "numeric",
//     });

//   /* ================= UI ================= */

//   return (
//     <div className="max-w-6xl mx-auto space-y-6">

//       {/* Header */}
//       <div>
//         <h1 className="text-2xl font-semibold text-gray-900">
//           Label Generation
//         </h1>
//         <p className="text-gray-500">
//           Generate and print medication labels
//         </p>
//       </div>

//       <div className="grid grid-cols-3 gap-6">

//         {/* ================= LEFT PANEL ================= */}

//         <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">

//           <div className="p-6 border-b border-gray-100">
//             <h2 className="font-semibold text-gray-900">
//               Ready Prescriptions
//             </h2>
//           </div>

//           {loading && (
//             <div className="p-4 text-gray-500">
//               Loading...
//             </div>
//           )}

//           {!loading && prescriptions.length === 0 && (
//             <div className="p-4 text-gray-500">
//               No prescriptions ready for labels
//             </div>
//           )}

//           <div className="divide-y divide-gray-100">
//             {prescriptions.map((rx) => (
//               <button
//                 key={rx.id}
//                 onClick={() => handleSelectPrescription(rx.id)}
//                 className={`w-full p-4 text-left transition-colors
//                   ${
//                     selectedPrescription?.id === rx.id
//                       ? "bg-blue-50"
//                       : "hover:bg-gray-50"
//                   }`}
//               >
//                 <div className="font-medium text-gray-900">
//                   {rx.id}
//                 </div>

//                 <div className="text-gray-600">
//                   {rx.patientName}
//                 </div>

//                 <div className="text-sm text-gray-500">
//                   {rx.medicineCount} medication(s)
//                 </div>
//               </button>
//             ))}
//           </div>
//         </div>

//         {/* ================= RIGHT PANEL ================= */}

//         <div className="col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm">

//           <div className="p-6 border-b border-gray-100 flex justify-between items-center">

//             <h2 className="font-semibold text-gray-900">
//               Label Preview
//             </h2>

//             {selectedPrescription && (
//               <div className="flex gap-2">

//                 <button
//                   className="flex items-center gap-2 px-4 py-2
//                   border border-gray-200 rounded-lg text-gray-700
//                   hover:bg-gray-50"
//                 >
//                   <Download size={16} />
//                   Download
//                 </button>

//                 <button
//                   onClick={handlePrint}
//                   className="flex items-center gap-2 px-4 py-2
//                   rounded-lg text-white
//                   bg-gradient-to-r from-blue-600 to-teal-500
//                   hover:from-blue-700 hover:to-teal-600"
//                 >
//                   <Printer size={16} />
//                   Print Label
//                 </button>

//               </div>
//             )}

//           </div>

//           <div className="p-6">

//             {!selectedPrescription && (
//               <div className="text-center py-12 text-gray-500">
//                 Select a prescription to preview labels
//               </div>
//             )}

//             {selectedPrescription &&
//               selectedPrescription.medicines.map((med) => (

//                 <div
//                   key={med.prescriptionMedicineId}
//                   className="print-label border-2 border-gray-300 rounded-lg p-6 bg-white mb-6"
//                   style={{ fontFamily: "monospace" }}
//                 >

//                   {/* Pharmacy Header */}
//                   <div className="border-b-2 border-gray-300 pb-4 mb-4">
//                     <div className="font-bold">MEDIFLOW PHARMACY</div>
//                     <div>123 Healthcare Blvd, Springfield, IL 62701</div>
//                     <div>Phone: (555) 123-4567</div>
//                   </div>

//                   {/* RX Info */}
//                   <div className="grid grid-cols-2 gap-4 mb-4 pb-4 border-b-2 border-gray-300">

//                     <div>
//                       <div className="text-xs">PATIENT</div>
//                       <div>{selectedPrescription.patientName}</div>
//                     </div>

//                     <div>
//                       <div className="text-xs">RX #</div>
//                       <div>{selectedPrescription.id}</div>
//                     </div>

//                     <div>
//                       <div className="text-xs">DATE</div>
//                       <div>{formatDate(selectedPrescription.createdAt)}</div>
//                     </div>

//                     <div>
//                       <div className="text-xs">DOCTOR</div>
//                       <div>
//                         {selectedPrescription.prescriber.name}
//                       </div>
//                     </div>

//                   </div>

//                   {/* Medication */}
//                   <div className="mb-4">
//                     <div className="font-semibold">
//                       {med.name} {med.strength}
//                     </div>

//                     <div className="mb-2">
//                       QTY: {med.prescribedQuantity}
//                     </div>
//                     <div className="mb-2">
//                       Frequency: {getFrequencyLabel(med.frequency)}
//                     </div>

//                     <div className="bg-yellow-50 border border-yellow-300 rounded p-3">
//                       <div className="font-semibold">
//                         DIRECTIONS:
//                       </div>
//                       <div>{med.instruction}</div>
//                     </div>
//                   </div>

//                   {/* Warnings */}
//                   <div className="border-t-2 border-gray-300 pt-4">
//                     <div className="font-semibold mb-2">
//                       ⚠ WARNINGS
//                     </div>
//                     <ul className="space-y-1">
//                       <li>• Take as directed by physician</li>
//                       <li>• Do not share this medication</li>
//                       <li>• Store at room temperature</li>
//                       <li>• Keep out of reach of children</li>
//                     </ul>
//                   </div>

//                   {/* Footer */}
//                   <div className="text-sm text-gray-500 mt-4 pt-4 border-t border-gray-300">
//                     Pharmacist: Dr. Jane Smith • License: PH-12345
//                   </div>

//                 </div>

//               ))}
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }
// src/pages/labels/LabelGenerationPage.tsx
import { useCallback } from "react";
import { LabelQueueList } from "@labels/components/LabelQueueList";
import { LabelPreview } from "@labels/components/LabelPreview";
import { useLabelQueue } from "@labels/hooks/useLabelQueue";
import { useLabelPrescriptionDetails } from "@labels/hooks/useLabelPrescriptionDetails";

export default function LabelGenerationPage() {
  const { prescriptions, loading: queueLoading, error: queueError } = useLabelQueue();

  const {
    selected,
    loading: detailsLoading,
    error: detailsError,
    selectById,
  } = useLabelPrescriptionDetails();

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  // keep download open for future: PDF export, print-to-PDF, etc.
  const handleDownload = useCallback(() => {
    // TODO: implement "download label(s)" - pdf/html/canvas
    // For now do nothing to preserve behavior.
  }, []);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Label Generation</h1>
        <p className="text-gray-500">Generate and print medication labels</p>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Left */}
        <LabelQueueList
          prescriptions={prescriptions}
          loading={queueLoading}
          error={queueError}
          selectedId={selected?.id ?? null}
          onSelect={selectById}
        />

        {/* Right */}
        <LabelPreview
          selected={selected}
          loading={detailsLoading}
          error={detailsError}
          onPrint={handlePrint}
          onDownload={handleDownload}
        />
      </div>
    </div>
  );
}