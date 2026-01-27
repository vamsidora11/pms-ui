// import { useState } from "react";
// import {
//   AlertTriangle,
//   CheckCircle2,
//   XCircle,
//   MessageSquare,
//   User,
//   Stethoscope,
//   Calendar,
//   Clock,
//   ShieldCheck,
// } from "lucide-react";

// import {
//   Card,
//   CardHeader,
//   CardTitle,
//   CardDescription,
//   CardContent,
// } from "@components/common/Card/Card";

// import Button from "@components/common/Button/Button";
// import Badge from "@components/common/Badge/Badge";
// import Separator from "@components/common/Separator/Separator";
// import ScrollArea from "@components/common/ScrollArea/ScrollArea";

// type Risk = "low" | "moderate" | "high";

// const prescriptions = [
//   {
//     id: "RX-2024-001",
//     patient: "John Doe",
//     age: 45,
//     gender: "Male",
//     time: "10:30 AM",
//     risk: "moderate" as Risk,
//   },
//   {
//     id: "RX-2024-002",
//     patient: "Jane Smith",
//     age: 52,
//     gender: "Female",
//     time: "11:15 AM",
//     risk: "high" as Risk,
//   },
//   {
//     id: "RX-2024-003",
//     patient: "Robert Brown",
//     age: 39,
//     gender: "Male",
//     time: "12:00 PM",
//     risk: "low" as Risk,
//   },
//   {
//     id: "RX-2024-004",
//     patient: "Emily Davis",
//     age: 28,
//     gender: "Female",
//     time: "12:45 PM",
//     risk: "low" as Risk,
//   },
//   {
//     id: "RX-2024-005",
//     patient: "Michael Lee",
//     age: 61,
//     gender: "Male",
//     time: "01:10 PM",
//     risk: "moderate" as Risk,
//   },
// ];

// const riskVariant = (risk: Risk) =>
//   risk === "high" ? "error" : risk === "moderate" ? "warning" : "success";

// export default function PrescriptionValidationPage() {
//   const [selected, setSelected] = useState(prescriptions[0]);

//   return (
//     <div className="max-w-7xl space-y-6">
//       {/* HEADER */}
//       <div className="flex items-center justify-between">
//         <div>
//           <h1 className="text-xl font-semibold">Prescription Validation</h1>
//           <p className="text-gray-600 text-sm">
//             Review and validate prescriptions for safety
//           </p>
//         </div>

//         <Badge label="5 Pending" variant="warning" />
//       </div>

//       {/* MAIN GRID */}
//       <div className="grid grid-cols-12 gap-6">
//         {/* LEFT QUEUE */}
//         <div className="col-span-12 lg:col-span-3">
//           <Card className="h-full">
//             <CardHeader>
//               <CardTitle>Validation Queue</CardTitle>
//               <CardDescription>
//                 Prescriptions awaiting review
//               </CardDescription>
//             </CardHeader>

//             <CardContent className="p-0">
//               <ScrollArea className="h-full">
//                 <div className="p-4 space-y-3">
//                   {prescriptions.map((rx) => (
//                     <button
//                       key={rx.id}
//                       onClick={() => setSelected(rx)}
//                       className={`w-full rounded-lg border p-4 text-left transition
//                         ${
//                           selected.id === rx.id
//                             ? "border-yellow-400 bg-yellow-50"
//                             : "hover:bg-gray-50"
//                         }`}
//                     >
//                       <div className="flex justify-between items-center">
//                         <div>
//                           <p className="text-sm font-medium">{rx.id}</p>
//                           <p className="text-xs text-gray-500">
//                             {rx.patient}
//                           </p>
//                         </div>

//                         <Badge
//                           label={rx.risk}
//                           variant={riskVariant(rx.risk)}
//                         />
//                       </div>

//                       <div className="mt-2 flex items-center gap-1 text-xs text-gray-500">
//                         <Clock className="size-3" />
//                         {rx.time}
//                       </div>
//                     </button>
//                   ))}
//                 </div>
//               </ScrollArea>
//             </CardContent>
//           </Card>
//         </div>

//         {/* RIGHT CONTENT */}
//         <div className="col-span-12 lg:col-span-9 space-y-6">
//           {/* TOP ROW */}
//           <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//             {/* SUMMARY */}
//             <Card>
//               <CardHeader>
//                 <CardTitle>Prescription Summary</CardTitle>
//               </CardHeader>

//               <CardContent className="space-y-4">
//                 <section>
//                   <div className="flex items-center gap-2 mb-1">
//                     <User className="size-4" />
//                     <span className="font-medium">
//                       Patient Information
//                     </span>
//                   </div>
//                   <p className="text-sm text-gray-600">
//                     {selected.patient} • {selected.age} years •{" "}
//                     {selected.gender}
//                   </p>

//                   <div className="mt-2 flex gap-2">
//                     <Badge label="Penicillin" variant="error" />
//                     <Badge label="Sulfa drugs" variant="error" />
//                   </div>
//                 </section>

//                 <Separator />

//                 <section>
//                   <div className="flex items-center gap-2 mb-1">
//                     <Stethoscope className="size-4" />
//                     <span className="font-medium">
//                       Doctor Information
//                     </span>
//                   </div>
//                   <p className="text-sm text-gray-600">
//                     Dr. Sarah Smith (DR-789)
//                   </p>
//                   <p className="text-sm text-gray-500">
//                     City Medical Center
//                   </p>
//                 </section>

//                 <Separator />

//                 <section>
//                   <div className="flex items-center gap-2 mb-1">
//                     <Calendar className="size-4" />
//                     <span className="font-medium">Diagnosis</span>
//                   </div>
//                   <p className="text-sm">
//                     Hypertension with mild infection
//                   </p>
//                   <p className="text-xs text-gray-500">
//                     Symptoms: High BP, fever, body ache, weakness
//                   </p>
//                 </section>
//               </CardContent>
//             </Card>

//             {/* MEDICINES */}
//             <Card>
//               <CardHeader>
//                 <CardTitle>Prescribed Medicines</CardTitle>
//                 <CardDescription>3 medications</CardDescription>
//               </CardHeader>

//               <CardContent className="space-y-4">
//                 {[
//                   {
//                     name: "Amlodipine",
//                     strength: "5mg",
//                     freq: "1-0-0",
//                     dur: "30 days",
//                     qty: "30 units",
//                     inst: "Before food",
//                   },
//                   {
//                     name: "Azithromycin",
//                     strength: "500mg",
//                     freq: "1-0-0",
//                     dur: "5 days",
//                     qty: "5 units",
//                     inst: "After food",
//                   },
//                   {
//                     name: "Paracetamol",
//                     strength: "500mg",
//                     freq: "1-1-1",
//                     dur: "5 days",
//                     qty: "15 units",
//                     inst: "After food",
//                   },
//                 ].map((m) => (
//                   <div
//                     key={m.name}
//                     className="rounded-lg border p-4"
//                   >
//                     <div className="flex justify-between items-center mb-2">
//                       <p className="font-medium">{m.name}</p>
//                       <Badge
//                         label={m.strength}
//                         variant="secondary"
//                       />
//                     </div>

//                     <div className="grid grid-cols-2 gap-y-1 text-xs text-gray-600">
//                       <p>Frequency: {m.freq}</p>
//                       <p>Duration: {m.dur}</p>
//                       <p>Quantity: {m.qty}</p>
//                       <p>Instructions: {m.inst}</p>
//                     </div>
//                   </div>
//                 ))}
//               </CardContent>
//             </Card>
//           </div>

//           {/* INTERACTIONS + CONTRAINDICATIONS */}
//           <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//             <Card>
//               <CardHeader>
//                 <CardTitle className="flex items-center gap-2">
//                   <AlertTriangle className="text-yellow-600 size-5" />
//                   Drug Interactions
//                 </CardTitle>
//                 <CardDescription>
//                   Potential interactions between prescribed medications
//                 </CardDescription>
//               </CardHeader>

//               <CardContent>
//                 <div className="rounded-lg border border-yellow-300 bg-yellow-50 p-4">
//                   <div className="flex items-center gap-2 mb-1">
//                     <AlertTriangle className="size-4 text-yellow-600" />
//                     <p className="font-medium text-sm">
//                       Amlodipine + Azithromycin
//                     </p>
//                     <Badge label="moderate" variant="warning" />
//                   </div>
//                   <p className="text-xs text-gray-700">
//                     May increase risk of QT prolongation. Monitor
//                     patient for irregular heartbeat.
//                   </p>
//                 </div>
//               </CardContent>
//             </Card>

//             <Card>
//               <CardHeader>
//                 <CardTitle className="flex items-center gap-2">
//                   <ShieldCheck className="text-green-600 size-5" />
//                   Contraindications
//                 </CardTitle>
//                 <CardDescription>
//                   Safety checks based on patient profile
//                 </CardDescription>
//               </CardHeader>

//               <CardContent>
//                 <div className="rounded-lg border border-green-300 bg-green-50 p-4 text-sm text-green-700">
//                   Allergy Check passed. Azithromycin is safe for
//                   patients with Penicillin allergy.
//                 </div>
//               </CardContent>
//             </Card>
//           </div>

//           {/* ACTION BAR */}
//           <Card>
//             <CardContent className="flex gap-4 p-6">
//               <Button variant="secondary" className="flex-1">
//                 <MessageSquare className="size-4 mr-2" />
//                 Request Clarification
//               </Button>

//               <Button variant="danger" className="flex-1">
//                 <XCircle className="size-4 mr-2" />
//                 Reject Prescription
//               </Button>

//               <Button className="flex-1 bg-gradient-to-r from-blue-600 to-green-600">
//                 <CheckCircle2 className="size-4 mr-2" />
//                 Approve Prescription
//               </Button>
//             </CardContent>
//           </Card>
//         </div>
//       </div>
//     </div>
//   );
// }



import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  Info,
  XCircle,
} from "lucide-react";
import clsx from "clsx";

/* =========================
   Types
========================= */
type Severity = "High" | "Medium" | "Low" | "None";
type InteractionLevel = "None" | "Minor" | "Moderate" | "Major";

type AllergyAlert = {
  issueType: "Drug Allergy";
  severity: Severity;
  affectedBy: string; // e.g., "Aspirin"
  message: string;
};

type MedicationLine = {
  id: string; // med-1
  name: string; // Aspirin
  strength: string; // 500mg
  prescribedQty: number;
  adjustedQty: number;
  maxQty?: number;
  stockCurrent: number;
  stockTotal: number;
  allergy?: AllergyAlert | null;
  interaction: InteractionLevel;
};

type PrescriptionDetails = {
  id: string; // RX-2026-001
  doctorName: string;
  doctorId: string;
  submittedAt: string; // ISO
  patient: {
    name: string;
    id: string;
    allergies: string[]; // labels only
  };
  lines: MedicationLine[];
};

type LineDecision = "accept" | "reject" | null;

type RejectPayload = {
  reason: string;
};

/* =========================
   Dummy data + mock fetch
========================= */

const MOCK_PRESCRIPTIONS: Record<string, PrescriptionDetails> = {
  "RX-2026-001": {
    id: "RX-2026-001",
    doctorName: "Dr. Michael Chen",
    doctorId: "DOC-5678",
    submittedAt: "2026-01-02T12:30:00+05:30",
    patient: {
      name: "Robert Williams",
      id: "PT-002",
      allergies: ["Aspirin"],
    },
    lines: [
      {
        id: "med-1",
        name: "Aspirin",
        strength: "500mg",
        prescribedQty: 30,
        adjustedQty: 30,
        maxQty: 30,
        stockCurrent: 10,
        stockTotal: 30,
        allergy: {
          issueType: "Drug Allergy",
          severity: "High",
          affectedBy: "Aspirin",
          message:
            "Patient has a documented Aspirin allergy. Aspirin is contraindicated and may cause severe allergic reaction including anaphylaxis. Do not dispense.",
        },
        interaction: "None",
      },
      {
        id: "med-2",
        name: "Metformin",
        strength: "500mg",
        prescribedQty: 60,
        adjustedQty: 60,
        maxQty: 60,
        stockCurrent: 40,
        stockTotal: 60,
        allergy: null,
        interaction: "None",
      },
      {
        id: "med-3",
        name: "Amoxicillin",
        strength: "250mg",
        prescribedQty: 21,
        adjustedQty: 21,
        stockCurrent: 21,
        stockTotal: 21,
        allergy: null,
        interaction: "None",
      },
    ],
  },
  "RX-2026-004": {
    id: "RX-2026-004",
    doctorName: "Dr. Sarah Martinez",
    doctorId: "DOC-2345",
    submittedAt: "2026-01-02T10:45:00+05:30",
    patient: {
      name: "James Chen",
      id: "PT-004",
      allergies: [],
    },
    lines: [
      {
        id: "med-1",
        name: "Atorvastatin",
        strength: "20mg",
        prescribedQty: 30,
        adjustedQty: 30,
        maxQty: 30,
        stockCurrent: 28,
        stockTotal: 30,
        allergy: null,
        interaction: "Minor",
      },
      {
        id: "med-2",
        name: "Losartan",
        strength: "50mg",
        prescribedQty: 30,
        adjustedQty: 30,
        stockCurrent: 30,
        stockTotal: 30,
        allergy: null,
        interaction: "None",
      },
    ],
  },
  "RX-2026-008": {
    id: "RX-2026-008",
    doctorName: "Dr. Michael Chen",
    doctorId: "DOC-5678",
    submittedAt: "2026-01-02T11:15:00+05:30",
    patient: {
      name: "Emily Davis",
      id: "PT-005",
      allergies: [],
    },
    lines: [
      {
        id: "med-1",
        name: "Ibuprofen",
        strength: "400mg",
        prescribedQty: 20,
        adjustedQty: 20,
        stockCurrent: 18,
        stockTotal: 20,
        allergy: null,
        interaction: "None",
      },
    ],
  },
};

function mockFetchPrescriptionDetails(id: string, delayMs = 450): Promise<PrescriptionDetails> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const data = MOCK_PRESCRIPTIONS[id];
      if (data) resolve(structuredClone(data));
      else reject(new Error("Prescription not found"));
    }, delayMs);
  });
}

/* =========================
   Helpers (UI + logic)
========================= */

function formatDateTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString();
}

function pillToneBySeverity(s: Severity) {
  switch (s) {
    case "High":
      return "red";
    case "Medium":
      return "amber";
    case "Low":
      return "yellow";
    default:
      return "green";
  }
}

type ValidationResult = "Blocked" | "Partial" | "OK";

function computeValidation(line: MedicationLine): ValidationResult {
  if (line.allergy?.severity === "High") return "Blocked";
  if (line.stockCurrent < line.prescribedQty) return "Partial";
  return "OK";
}

/* =============== Small UI bits =============== */

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border shadow-sm">
      <div className="p-5 border-b">
        <h2 className="font-semibold text-gray-900">{title}</h2>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function Pill({
  children,
  tone = "gray",
  soft = true,
}: {
  children: React.ReactNode;
  tone?: "red" | "green" | "blue" | "gray" | "amber" | "yellow";
  soft?: boolean;
}) {
  const base = soft
    ? {
        red: "bg-red-100 text-red-800",
        green: "bg-green-100 text-green-800",
        blue: "bg-blue-100 text-blue-800",
        gray: "bg-gray-100 text-gray-700",
        amber: "bg-amber-100 text-amber-800",
        yellow: "bg-yellow-100 text-yellow-800",
      }
    : {
        red: "bg-red-600 text-white",
        green: "bg-green-600 text-white",
        blue: "bg-blue-600 text-white",
        gray: "bg-gray-600 text-white",
        amber: "bg-amber-600 text-white",
        yellow: "bg-yellow-600 text-white",
      };
  return <span className={clsx("px-2 py-0.5 rounded text-xs inline-flex items-center gap-1", base[tone])}>{children}</span>;
}

function StatusPill({ result }: { result: ValidationResult }) {
  if (result === "Blocked")
    return (
      <Pill tone="red">
        <XCircle size={14} />
        Blocked
      </Pill>
    );
  if (result === "Partial")
    return (
      <Pill tone="amber">
        <AlertTriangle size={14} />
        Partial
      </Pill>
    );
  return (
    <Pill tone="green">
      <CheckCircle2 size={14} />
      OK
    </Pill>
  );
}

function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  widthClass = "max-w-lg",
}: {
  open: boolean;
  onClose: () => void;
  title: string | React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  widthClass?: string;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div
        className={clsx(
          "absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl shadow-xl border",
          widthClass
        )}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between p-5 border-b">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        <div className="p-5">{children}</div>
        {footer && <div className="p-4 border-t flex justify-end gap-3">{footer}</div>}
      </div>
    </div>
  );
}

/* =========================
   Main Component
========================= */

export default function PrescriptionValidationDetails() {
  const { rxId = "" } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState<PrescriptionDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // per-line decisions & adjusted qty
  const [decisions, setDecisions] = useState<Record<string, LineDecision>>({});
  const [reasons, setReasons] = useState<Record<string, string>>({});
  const [adjusted, setAdjusted] = useState<Record<string, number>>({});

  // modals
  const [allergyFor, setAllergyFor] = useState<AllergyAlert | null>(null);
  const [rejectLineId, setRejectLineId] = useState<string | null>(null);
  const [rejectAllOpen, setRejectAllOpen] = useState(false);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);

    mockFetchPrescriptionDetails(rxId)
      .then((res) => {
        if (!alive) return;
        setData(res);
        // initialize states
        const adj: Record<string, number> = {};
        const dcs: Record<string, LineDecision> = {};
        res.lines.forEach((l) => {
          adj[l.id] = l.adjustedQty;
          dcs[l.id] = null;
        });
        setAdjusted(adj);
        setDecisions(dcs);
      })
      .catch((e) => alive && setError(e.message || "Failed to load"))
      .finally(() => alive && setLoading(false));

    return () => {
      alive = false;
    };
  }, [rxId]);

  const overallResult = useMemo<ValidationResult>(() => {
    if (!data) return "OK";
    const results = data.lines.map((l) => computeValidation({ ...l, adjustedQty: adjusted[l.id] ?? l.adjustedQty }));
    if (results.includes("Blocked")) return "Blocked";
    if (results.includes("Partial")) return "Partial";
    return "OK";
  }, [data, adjusted]);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-4">
        <div className="h-6 w-40 bg-gray-200 rounded animate-pulse mb-4" />
        <div className="h-32 bg-gray-200 rounded-2xl animate-pulse mb-6" />
        <div className="h-80 bg-gray-200 rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-5xl mx-auto p-4">
        <button
          onClick={() => navigate(-1)}
          className="text-gray-600 hover:text-gray-800 inline-flex items-center gap-1 mb-4"
        >
          <ChevronLeft size={18} />
          Back to Queue
        </button>
        <div className="text-red-600">Error: {error || "No data"}</div>
      </div>
    );
  }

  const onAccept = (id: string) => setDecisions((d) => ({ ...d, [id]: "accept" }));
  const onReject = (id: string) => setRejectLineId(id);

  const confirmRejectLine = () => {
    if (!rejectLineId) return;
    setDecisions((d) => ({ ...d, [rejectLineId]: "reject" }));
    setRejectLineId(null);
  };

  const approveAll = () => {
    // In real app: call approve API
    alert("Prescription approved (demo).");
    navigate("/pharmacist/validation");
  };

  const confirmRejectAll = () => {
    // In real app: call reject API passing reasons
    setRejectAllOpen(false);
    alert("Entire prescription rejected (demo).");
    navigate("/pharmacist/validation");
  };

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <button
            onClick={() => navigate(-1)}
            className="text-gray-600 hover:text-gray-800 inline-flex items-center gap-1 mb-2"
          >
            <ChevronLeft size={18} />
            Back to Queue
          </button>
          <h1 className="text-2xl font-semibold text-gray-900">Prescription Validation</h1>
          <p className="text-gray-500">Review and validate prescription details</p>
        </div>
        <div className="self-start">
          <Pill tone="amber">{data.id}</Pill>
        </div>
      </div>

      {/* Patient Info */}
      <SectionCard title="Patient Information">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
          <KV label="Patient Name" value={data.patient.name} />
          <KV label="Patient ID" value={data.patient.id} />
          <div className="min-w-0">
            <div className="text-xs text-gray-500">Allergies</div>
            <div className="flex flex-wrap gap-2">
              {data.patient.allergies.length > 0 ? (
                data.patient.allergies.map((a) => (
                  <Pill key={a} tone="amber">
                    {a}
                  </Pill>
                ))
              ) : (
                <span className="text-gray-900">—</span>
              )}
            </div>
          </div>
          <KV label="Submission Time" value={formatDateTime(data.submittedAt)} />
        </div>
      </SectionCard>

      {/* Validation Table */}
      <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
        <div className="p-5 border-b">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-gray-900">Prescription Validation</h2>
              <div className="text-sm text-gray-500">
                Doctor: {data.doctorName} ({data.doctorId})
              </div>
            </div>
            <div>
              Overall: <StatusPill result={overallResult} />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-gray-500 border-b">
                <Th>Medicine</Th>
                <Th align="center">Prescribed Qty</Th>
                <Th align="center">Adjusted Qty</Th>
                <Th align="center">Available Stock</Th>
                <Th align="center">Allergy</Th>
                <Th align="center">Drug Interaction</Th>
                <Th align="center">Validation Result</Th>
                <Th align="center">Decision</Th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {data.lines.map((line) => {
                const vr = computeValidation({ ...line, adjustedQty: adjusted[line.id] ?? line.adjustedQty });
                const dec = decisions[line.id];
                const stockGood = line.stockCurrent >= line.prescribedQty;

                return (
                  <tr key={line.id} className="align-top">
                    <Td>
                      <div className="font-medium text-gray-900">{line.name}</div>
                      <div className="text-gray-500">{line.strength}</div>
                    </Td>

                    <Td align="center">
                      <span className="text-gray-900">{line.prescribedQty}</span>
                    </Td>

                    <Td align="center">
                      <div className="inline-flex items-center gap-2">
                        <input
                          type="number"
                          value={adjusted[line.id] ?? line.adjustedQty}
                          onChange={(e) =>
                            setAdjusted((a) => ({
                              ...a,
                              [line.id]: Math.max(0, Number(e.target.value)),
                            }))
                          }
                          className="w-20 px-2 py-1 border rounded-md"
                        />
                        {typeof line.maxQty === "number" && (
                          <button
                            onClick={() =>
                              setAdjusted((a) => ({
                                ...a,
                                [line.id]: line.maxQty!,
                              }))
                            }
                            className="text-blue-600 hover:text-blue-700 text-xs px-2 py-0.5 border rounded-md bg-blue-50"
                          >
                            Max
                          </button>
                        )}
                      </div>
                    </Td>

                    <Td align="center">
                      <Pill tone={stockGood ? "green" : "amber"}>
                        {line.stockCurrent} / {line.stockTotal}
                      </Pill>
                    </Td>

                    <Td align="center">
                      {line.allergy ? (
                        <button
                          onClick={() => setAllergyFor(line.allergy!)}
                          className="inline-flex items-center gap-1"
                        >
                          <Pill tone={pillToneBySeverity(line.allergy.severity)}>
                            {line.allergy.severity === "High" && <XCircle size={14} />}
                            {line.allergy.severity}
                          </Pill>
                        </button>
                      ) : (
                        <Pill tone="green">None</Pill>
                      )}
                    </Td>

                    <Td align="center">
                      {line.interaction === "None" ? (
                        <Pill tone="green">None</Pill>
                      ) : (
                        <Pill tone="amber">
                          <AlertTriangle size={14} />
                          {line.interaction}
                        </Pill>
                      )}
                    </Td>

                    <Td align="center">
                      <StatusPill result={vr} />
                    </Td>

                    <Td align="center">
                      <div className="inline-flex items-center gap-2">
                        <button
                          onClick={() => onAccept(line.id)}
                          className={clsx(
                            "px-2.5 py-1 rounded-md text-xs border",
                            dec === "accept"
                              ? "bg-green-600 text-white border-green-600"
                              : "text-green-700 border-green-200 hover:bg-green-50"
                          )}
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => onReject(line.id)}
                          className={clsx(
                            "px-2.5 py-1 rounded-md text-xs border",
                            dec === "reject"
                              ? "bg-red-600 text-white border-red-600"
                              : "text-red-700 border-red-200 hover:bg-red-50"
                          )}
                        >
                          Reject
                        </button>
                      </div>
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer actions */}
        <div className="p-5 border-t flex flex-col sm:flex-row gap-3 sm:justify-end">
          <button
            onClick={() => setRejectAllOpen(true)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md border text-red-700 border-red-300 hover:bg-red-50"
          >
            <XCircle size={18} />
            Reject Entire Prescription
          </button>
          <button
            onClick={approveAll}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700"
          >
            <CheckCircle2 size={18} />
            Approve Prescription
          </button>
        </div>
      </div>

      {/* Allergy modal */}
      <Modal
        open={!!allergyFor}
        onClose={() => setAllergyFor(null)}
        title="Safety Alert Details"
        widthClass="max-w-xl"
        footer={
          <button
            onClick={() => setAllergyFor(null)}
            className="px-4 py-2 rounded-md border text-gray-700 hover:bg-gray-50"
          >
            Close
          </button>
        }
      >
        {allergyFor && (
          <div className="space-y-4 text-sm">
            <Row label="Issue Type" value={allergyFor.issueType} />
            <Row
              label="Severity"
              value={
                <Pill tone={pillToneBySeverity(allergyFor.severity)}>
                  {allergyFor.severity === "High" && <XCircle size={14} />}
                  {allergyFor.severity}
                </Pill>
              }
            />
            <Row label="Affected By" value={allergyFor.affectedBy} />
            <div className="text-sm">
              <div className="text-xs text-gray-500 mb-1">Message</div>
              <div className="p-3 rounded-md bg-red-50 text-red-800 border border-red-200">
                {allergyFor.message}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Reject line modal */}
      <Modal
        open={!!rejectLineId}
        onClose={() => setRejectLineId(null)}
        title={`Reject ${rejectLineId ? displayMedName(data, rejectLineId) : "Medication"}`}
        footer={
          <>
            <button
              onClick={() => setRejectLineId(null)}
              className="px-4 py-2 rounded-md border text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={confirmRejectLine}
              className="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
              disabled={!reasons[rejectLineId ?? ""]?.trim()}
            >
              Confirm Rejection
            </button>
          </>
        }
      >
        <div className="space-y-2">
          <div className="text-sm text-gray-700">Please provide a reason for rejection:</div>
          <textarea
            rows={4}
            className="w-full border rounded-md p-2"
            placeholder="Enter reason for rejection..."
            value={reasons[rejectLineId ?? ""] ?? ""}
            onChange={(e) =>
              setReasons((r) => ({
                ...r,
                [rejectLineId ?? ""]: e.target.value,
              }))
            }
          />
        </div>
      </Modal>

      {/* Reject entire prescription modal */}
      <Modal
        open={rejectAllOpen}
        onClose={() => setRejectAllOpen(false)}
        title="Reject Entire Prescription"
        footer={
          <>
            <button
              onClick={() => setRejectAllOpen(false)}
              className="px-4 py-2 rounded-md border text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={confirmRejectAll}
              className="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
              disabled={!reasons["_ALL_"]?.trim()}
            >
              Confirm Rejection
            </button>
          </>
        }
      >
        <div className="space-y-2">
          <div className="text-sm text-gray-700">Please provide a reason for rejection:</div>
          <textarea
            rows={4}
            className="w-full border rounded-md p-2"
            placeholder="Enter reason for rejection..."
            value={reasons["_ALL_"] ?? ""}
            onChange={(e) =>
              setReasons((r) => ({
                ...r,
                _ALL_: e.target.value,
              }))
            }
          />
        </div>
      </Modal>
    </div>
  );
}

/* =========================
   Local UI helpers
========================= */

function Th({ children, align = "left" }: { children: React.ReactNode; align?: "left" | "center" | "right" }) {
  return (
    <th className={clsx("px-5 py-3 text-xs font-medium uppercase tracking-wide", align === "center" && "text-center", align === "right" && "text-right")}>
      {children}
    </th>
  );
}

function Td({ children, align = "left" }: { children: React.ReactNode; align?: "left" | "center" | "right" }) {
  return (
    <td className={clsx("px-5 py-4 align-middle", align === "center" && "text-center", align === "right" && "text-right")}>
      {children}
    </td>
  );
}

function KV({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="text-gray-900">{value ?? "—"}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-3 gap-2 items-start">
      <div className="col-span-1 text-xs text-gray-500">{label}</div>
      <div className="col-span-2 text-gray-900">{value}</div>
    </div>
  );
}

function displayMedName(data: PrescriptionDetails, lineId: string) {
  const line = data.lines.find((l) => l.id === lineId);
  return line ? `${line.name} ${line.strength}` : "Medication";
}
