import { useState, useEffect } from "react";
import {
  Search,
  User,
  Phone,
  Mail,
  MapPin,
  AlertTriangle,
  Calendar,
  Plus,
} from "lucide-react";

import AddPatientModal from "./addpatient";
import {
  createPatient,
  getPatientDetails,
  searchPatients,
} from "@api/patient"; // <-- your API layer
import type {
  PatientDetailsDto,
  PatientSummaryDto,
} from "@store/patient/patienttype";

/* =========================
   Types
========================= */
interface Prescription {
  id: string;
  patientId: string;
  medicationsCount: number;
  status: "Pending" | "Rejected" | "Approved";
}

/* =========================
   Component
========================= */
export default function PatientProfiles() {
  const [patients, setPatients] = useState<PatientSummaryDto[]>([]);
  const [selectedPatient, setSelectedPatient] =
    useState<PatientDetailsDto | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);

  // Fetch initial patient list
  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const result = await searchPatients(""); // empty query returns all
        setPatients(result);
        if (result.length > 0) {
          const details = await getPatientDetails(result[0].id);
          setSelectedPatient(details);
        }
      } catch (err) {
        console.error("Failed to fetch patients", err);
      }
    };
    fetchPatients();
  }, []);

  // Filter patients client‑side
  const filteredPatients = patients.filter(
    (p) =>
      (p.fullName ?? "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.id ?? "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.phone ?? "").includes(searchTerm)
  );

  const getStatusStyle = (status: Prescription["status"]) => {
    switch (status) {
      case "Pending":
        return "bg-yellow-100 text-yellow-700";
      case "Approved":
        return "bg-green-100 text-green-700";
      case "Rejected":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Patient Profiles
          </h1>
          <p className="text-gray-500">
            View patient demographics and medical information
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-blue-600 to-teal-500 text-white rounded-xl shadow"
        >
          <Plus size={18} />
          Add New Patient
        </button>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Patient Directory */}
        <div className="bg-white rounded-2xl border shadow-sm">
          <div className="p-4 border-b">
            <h2 className="font-semibold mb-3">Patient Directory</h2>
            <div className="relative">
              <Search
                className="absolute left-3 top-2.5 text-gray-400"
                size={18}
              />
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name, ID, or phone..."
                className="w-full pl-10 pr-3 py-2 bg-gray-50 border rounded-lg"
              />
            </div>
          </div>

          <div className="p-3 space-y-2 max-h-[600px] overflow-y-auto">
            {filteredPatients.map((p) => (
              <button
                key={p.id}
                onClick={async () => {
                  const details = await getPatientDetails(p.id);
                  setSelectedPatient(details);
                  // TODO: fetch prescriptions for this patient from backend
                  setPrescriptions([]); // placeholder until you wire prescriptions API
                }}
                className={`w-full p-4 text-left rounded-xl transition ${
                  selectedPatient?.id === p.id
                    ? "bg-blue-50 ring-2 ring-blue-400"
                    : "hover:bg-gray-50 border"
                }`}
              >
                <div className="font-medium">{p.fullName}</div>
                <div className="text-sm text-gray-500">{p.id}</div>
                <div className="text-sm text-gray-500">{p.phone}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Patient Details */}
        <div className="col-span-2 space-y-6">
          {selectedPatient && (
            <>
              {/* Demographics */}
              <Section title="Patient Demographics">
                <Info
                  icon={User}
                  label="Full Name"
                  value={selectedPatient.fullName}
                />
                <Info
                  icon={Calendar}
                  label="Date of Birth"
                  value={new Date(selectedPatient.dob).toLocaleDateString()}
                />
                <Info
                  icon={Phone}
                  label="Phone"
                  value={selectedPatient.phone}
                />
                <Info
                  icon={Mail}
                  label="Email"
                  value={selectedPatient.email ?? ""}
                />
                <Info
                  icon={MapPin}
                  label="Address"
                  value={selectedPatient.address}
                />
                <Info
                  icon={User}
                  label="Gender"
                  value={selectedPatient.gender}
                />
              </Section>

              {/* Allergies */}
              <div className="bg-white rounded-2xl border shadow-sm">
                <div className="p-6 border-b flex items-center gap-2">
                  <AlertTriangle className="text-red-600" />
                  <h2 className="font-semibold">Known Allergies</h2>
                </div>
                <div className="p-6 flex gap-2 flex-wrap">
                  {selectedPatient.allergies.length ? (
                    selectedPatient.allergies.map((a) => (
                      <span
                        key={a.code}
                        className="px-4 py-2 bg-red-100 text-red-700 rounded-lg"
                      >
                        {a.displayName}
                      </span>
                    ))
                  ) : (
                    <span className="text-gray-500">
                      No known allergies documented
                    </span>
                  )}
                </div>
              </div>

              {/* Prescriptions */}
              <div className="bg-white rounded-2xl border shadow-sm">
                <div className="p-6 border-b">
                  <h2 className="font-semibold">Active Prescriptions</h2>
                </div>
                <div className="p-6 space-y-3">
                  {prescriptions.length ? (
                    prescriptions.map((rx) => (
                      <div
                        key={rx.id}
                        className="flex justify-between items-center p-4 bg-gray-50 rounded-lg"
                      >
                        <div>
                          <div className="font-medium">{rx.id}</div>
                          <div className="text-sm text-gray-500">
                            {rx.medicationsCount} medication(s)
                          </div>
                        </div>
                        <span
                          className={`px-3 py-1 rounded-full text-sm ${getStatusStyle(
                            rx.status
                          )}`}
                        >
                          {rx.status}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="text-gray-500 text-center">
                      No prescriptions found
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Add Patient Modal */}
      {showAddModal && (
        <AddPatientModal
          onClose={() => setShowAddModal(false)}
          onSave={async (request) => {
            try {
              const result = await createPatient(request);
              const details = await getPatientDetails(result.patientId);

              setPatients((prev) => [
                ...prev,
                {
                  id: details.id,
                  fullName: details.fullName,
                  phone: details.phone,
                },
              ]);
              setSelectedPatient(details);
              setShowAddModal(false);
            } catch (err) {
              console.error("Failed to add patient", err);
              alert("Error adding patient");
            }
          }}
        />
      )}
    </div>
  );
}

/* =========================
   Reusable UI Helpers
========================= */
function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl border shadow-sm">
      <div className="p-6 border-b">
        <h2 className="font-semibold">{title}</h2>
      </div>
      <div className="p-6 grid grid-cols-2 gap-6">{children}</div>
    </div>
  );
}

function Info({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="flex gap-3">
      <Icon className="text-gray-400 mt-1" size={18} />
      <div>
        <div className="text-sm text-gray-500">{label}</div>
        <div className="text-gray-900">{value || "—"}</div>
      </div>
    </div>
  );
}
