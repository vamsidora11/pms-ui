import { useEffect, useState } from "react";
import { Plus } from "lucide-react";

import AddPatientModal from "./addpatient";
import UpdatePatientModal from "./updatePatient";

import { createPatient, getPatientDetails, searchPatients } from "@api/patient";
import type { PatientDetailsDto } from "@store/patient/patienttype";

import { usePatientDirectory } from "./hooks/usePatientDirectory";
import { usePatientDetails } from "./hooks/usePatientDetails";

import PatientDirectoryPanel from "./components/PatientDirectoryPanel";
import PatientDetailsPanel from "./components/PatientDetailsPanel";

/* =========================
   Types
========================= */
interface Prescription {
  id: string;
  patientId: string;
  medicationsCount: number;
  status: "Pending" | "Rejected" | "Approved";
}

export default function PatientProfiles() {
  const directory = usePatientDirectory({
    searchFn: searchPatients as any,
    debounceMs: 250,
    minChars: 1,
  });

  const details = usePatientDetails(getPatientDetails as any);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);

  // Prescriptions (kept as-is; to be wired later)
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);

  // ✅ Auto-select whenever there is no selection
  useEffect(() => {
    const selectedId = details.selectedPatient?.id ?? null;

    // If selection exists but isn't in current list, clear it
    if (selectedId && !directory.patients.some((p) => p.id === selectedId)) {
      details.setSelectedPatient(null);
      setPrescriptions([]);
    }

    // If no selection, auto-select first result
    if (!details.selectedPatient && directory.patients.length > 0) {
      details.selectPatient(directory.patients[0].id);
      setPrescriptions([]); // placeholder until wired
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [directory.patients]);

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
        {/* Left panel */}
        <PatientDirectoryPanel
          patients={directory.patients}
          searchTerm={directory.searchTerm}
          onSearchTermChange={directory.setSearchTerm}
          listLoading={directory.listLoading}
          listError={directory.listError}
          selectedPatientId={details.selectedPatient?.id}
          onSelectPatient={async (id) => {
            await details.selectPatient(id);
            setPrescriptions([]); // placeholder
          }}
        />

        {/* Right panel */}
        <PatientDetailsPanel
          selectedPatient={details.selectedPatient}
          detailsLoading={details.detailsLoading}
          detailsError={details.detailsError}
          prescriptions={prescriptions}
          onClickUpdate={() => setShowUpdateModal(true)}
        />
      </div>

      {/* Add Patient Modal (wrapper stays) */}
      {showAddModal && (
        <AddPatientModal
          onClose={() => setShowAddModal(false)}
          onSave={async (request) => {
            try {
              const { patientId } = await createPatient(request);
              const refreshed = await searchPatients(
                (directory.debouncedSearch ?? "").trim(),
              );
              directory.setPatients(refreshed);

              await details.selectPatient(patientId);
              setPrescriptions([]);

              setShowAddModal(false);
            } catch (err) {
              console.error("Failed to add patient", err);
              alert("Error adding patient");
            }
          }}
        />
      )}

      {/* Update Patient Modal (wrapper stays) */}
      {showUpdateModal && details.selectedPatient && (
        <UpdatePatientModal
          patient={details.selectedPatient}
          onClose={() => setShowUpdateModal(false)}
          onSave={async (updated: PatientDetailsDto) => {
            details.setSelectedPatient(updated);

            const refreshed = await searchPatients(
              (directory.debouncedSearch ?? "").trim(),
            );
            directory.setPatients(refreshed);

            setShowUpdateModal(false);
          }}
        />
      )}
    </div>
  );
}
