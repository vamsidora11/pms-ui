import { useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  XCircle,
  MessageSquare,
  User,
  Stethoscope,
  Calendar,
  Clock,
  ShieldCheck,
} from "lucide-react";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "../../components/common/Card/Card";

import Button from "../../components/common/Button/Button";
import Badge from "../../components/common/Badge/Badge";
import Separator from "../../components/common/Separator/Separator";
import ScrollArea from "../../components/common/ScrollArea/ScrollArea";

type Risk = "low" | "moderate" | "high";

const prescriptions = [
  {
    id: "RX-2024-001",
    patient: "John Doe",
    age: 45,
    gender: "Male",
    time: "10:30 AM",
    risk: "moderate" as Risk,
  },
  {
    id: "RX-2024-002",
    patient: "Jane Smith",
    age: 52,
    gender: "Female",
    time: "11:15 AM",
    risk: "high" as Risk,
  },
  {
    id: "RX-2024-003",
    patient: "Robert Brown",
    age: 39,
    gender: "Male",
    time: "12:00 PM",
    risk: "low" as Risk,
  },
  {
    id: "RX-2024-004",
    patient: "Emily Davis",
    age: 28,
    gender: "Female",
    time: "12:45 PM",
    risk: "low" as Risk,
  },
  {
    id: "RX-2024-005",
    patient: "Michael Lee",
    age: 61,
    gender: "Male",
    time: "01:10 PM",
    risk: "moderate" as Risk,
  },
];

const riskVariant = (risk: Risk) =>
  risk === "high" ? "error" : risk === "moderate" ? "warning" : "success";

export default function PrescriptionValidationPage() {
  const [selected, setSelected] = useState(prescriptions[0]);

  return (
    <div className="max-w-7xl space-y-6">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Prescription Validation</h1>
          <p className="text-gray-600 text-sm">
            Review and validate prescriptions for safety
          </p>
        </div>

        <Badge label="5 Pending" variant="warning" />
      </div>

      {/* MAIN GRID */}
      <div className="grid grid-cols-12 gap-6">
        {/* LEFT QUEUE */}
        <div className="col-span-12 lg:col-span-3">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Validation Queue</CardTitle>
              <CardDescription>
                Prescriptions awaiting review
              </CardDescription>
            </CardHeader>

            <CardContent className="p-0">
              <ScrollArea className="h-full">
                <div className="p-4 space-y-3">
                  {prescriptions.map((rx) => (
                    <button
                      key={rx.id}
                      onClick={() => setSelected(rx)}
                      className={`w-full rounded-lg border p-4 text-left transition
                        ${
                          selected.id === rx.id
                            ? "border-yellow-400 bg-yellow-50"
                            : "hover:bg-gray-50"
                        }`}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-sm font-medium">{rx.id}</p>
                          <p className="text-xs text-gray-500">
                            {rx.patient}
                          </p>
                        </div>

                        <Badge
                          label={rx.risk}
                          variant={riskVariant(rx.risk)}
                        />
                      </div>

                      <div className="mt-2 flex items-center gap-1 text-xs text-gray-500">
                        <Clock className="size-3" />
                        {rx.time}
                      </div>
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT CONTENT */}
        <div className="col-span-12 lg:col-span-9 space-y-6">
          {/* TOP ROW */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* SUMMARY */}
            <Card>
              <CardHeader>
                <CardTitle>Prescription Summary</CardTitle>
              </CardHeader>

              <CardContent className="space-y-4">
                <section>
                  <div className="flex items-center gap-2 mb-1">
                    <User className="size-4" />
                    <span className="font-medium">
                      Patient Information
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    {selected.patient} • {selected.age} years •{" "}
                    {selected.gender}
                  </p>

                  <div className="mt-2 flex gap-2">
                    <Badge label="Penicillin" variant="error" />
                    <Badge label="Sulfa drugs" variant="error" />
                  </div>
                </section>

                <Separator />

                <section>
                  <div className="flex items-center gap-2 mb-1">
                    <Stethoscope className="size-4" />
                    <span className="font-medium">
                      Doctor Information
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    Dr. Sarah Smith (DR-789)
                  </p>
                  <p className="text-sm text-gray-500">
                    City Medical Center
                  </p>
                </section>

                <Separator />

                <section>
                  <div className="flex items-center gap-2 mb-1">
                    <Calendar className="size-4" />
                    <span className="font-medium">Diagnosis</span>
                  </div>
                  <p className="text-sm">
                    Hypertension with mild infection
                  </p>
                  <p className="text-xs text-gray-500">
                    Symptoms: High BP, fever, body ache, weakness
                  </p>
                </section>
              </CardContent>
            </Card>

            {/* MEDICINES */}
            <Card>
              <CardHeader>
                <CardTitle>Prescribed Medicines</CardTitle>
                <CardDescription>3 medications</CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                {[
                  {
                    name: "Amlodipine",
                    strength: "5mg",
                    freq: "1-0-0",
                    dur: "30 days",
                    qty: "30 units",
                    inst: "Before food",
                  },
                  {
                    name: "Azithromycin",
                    strength: "500mg",
                    freq: "1-0-0",
                    dur: "5 days",
                    qty: "5 units",
                    inst: "After food",
                  },
                  {
                    name: "Paracetamol",
                    strength: "500mg",
                    freq: "1-1-1",
                    dur: "5 days",
                    qty: "15 units",
                    inst: "After food",
                  },
                ].map((m) => (
                  <div
                    key={m.name}
                    className="rounded-lg border p-4"
                  >
                    <div className="flex justify-between items-center mb-2">
                      <p className="font-medium">{m.name}</p>
                      <Badge
                        label={m.strength}
                        variant="secondary"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-y-1 text-xs text-gray-600">
                      <p>Frequency: {m.freq}</p>
                      <p>Duration: {m.dur}</p>
                      <p>Quantity: {m.qty}</p>
                      <p>Instructions: {m.inst}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* INTERACTIONS + CONTRAINDICATIONS */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="text-yellow-600 size-5" />
                  Drug Interactions
                </CardTitle>
                <CardDescription>
                  Potential interactions between prescribed medications
                </CardDescription>
              </CardHeader>

              <CardContent>
                <div className="rounded-lg border border-yellow-300 bg-yellow-50 p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <AlertTriangle className="size-4 text-yellow-600" />
                    <p className="font-medium text-sm">
                      Amlodipine + Azithromycin
                    </p>
                    <Badge label="moderate" variant="warning" />
                  </div>
                  <p className="text-xs text-gray-700">
                    May increase risk of QT prolongation. Monitor
                    patient for irregular heartbeat.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShieldCheck className="text-green-600 size-5" />
                  Contraindications
                </CardTitle>
                <CardDescription>
                  Safety checks based on patient profile
                </CardDescription>
              </CardHeader>

              <CardContent>
                <div className="rounded-lg border border-green-300 bg-green-50 p-4 text-sm text-green-700">
                  Allergy Check passed. Azithromycin is safe for
                  patients with Penicillin allergy.
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ACTION BAR */}
          <Card>
            <CardContent className="flex gap-4 p-6">
              <Button variant="secondary" className="flex-1">
                <MessageSquare className="size-4 mr-2" />
                Request Clarification
              </Button>

              <Button variant="danger" className="flex-1">
                <XCircle className="size-4 mr-2" />
                Reject Prescription
              </Button>

              <Button className="flex-1 bg-gradient-to-r from-blue-600 to-green-600">
                <CheckCircle2 className="size-4 mr-2" />
                Approve Prescription
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
