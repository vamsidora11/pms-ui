import { useEffect, useState } from "react";
import { Plus } from "lucide-react";

import AddPatientModal from "./addpatient";
import UpdatePatientModal from "./updatePatient";

import { createPatient, getPatientDetails, searchPatients } from "@api/patient";
import { getPrescriptionsByPatient } from "@api/prescription";

import type {
  PatientDetailsDto
} from "@patient/types/patienttype";
import type {
  PrescriptionSummaryDto
} from "@prescription/types/prescription.types";

import { usePatientDirectory } from "../hooks/usePatientDirectory";
import { usePatientDetails } from "../hooks/usePatientDetails";
import { usePatientPrescriptions } from "../hooks/usePatientPrescriptions";
import { useToast } from "@components/common/Toast/useToast";
import PatientDirectoryPanel from "./PatientDirectoryPanel";
import PatientDetailsPanel from "./PatientDetailsPanel";

export default function PatientProfiles() {
  const toast=useToast();
  const directory = usePatientDirectory({
    searchFn: (query, opts) => searchPatients(query, opts),
    debounceMs: 250,
    minChars: 1,
  });

  const details = usePatientDetails((id) => getPatientDetails(id));

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);

  // ✅ Prescriptions (loads automatically when selected patient changes)
  const prescriptionsState = usePatientPrescriptions<PrescriptionSummaryDto>(
    (patientId, pageSize, continuationToken) =>
      getPrescriptionsByPatient(patientId, pageSize, continuationToken),
    details.selectedPatient?.id ?? null,
    10,
  );

  // ✅ Auto-select whenever there is no selection
  useEffect(() => {
    const selectedId = details.selectedPatient?.id ?? null;

    // If selection exists but isn't in current list, clear it
    if (selectedId && !directory.patients.some((p) => p.id === selectedId)) {
      details.setSelectedPatient(null);
      prescriptionsState.reset();
    }

    // If no selection, auto-select first result
    if (!details.selectedPatient && directory.patients.length > 0) {
      details.selectPatient(directory.patients[0].id);
      // prescriptions hook will auto-load after selection resolves
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [directory.patients]);

  return (
    <div className="max-w-6xl mx-auto space-y-6 min-h-screen pb-12 md:pb-16">
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

      {/* <div className="grid grid-cols-3 gap-6"> */}
      <div className="grid grid-cols-3 gap-6 items-stretch h-[calc(100vh-220px)]">
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
            // prescriptions auto-load via hook
          }}
        />

        {/* Right panel */}
        <PatientDetailsPanel
          selectedPatient={details.selectedPatient}
          detailsLoading={details.detailsLoading}
          detailsError={details.detailsError}
          prescriptions={prescriptionsState.prescriptions}
          prescriptionsLoading={prescriptionsState.prescriptionsLoading}
          prescriptionsError={prescriptionsState.prescriptionsError}
          prescriptionsHasMore={prescriptionsState.hasMore}
          onLoadMorePrescriptions={prescriptionsState.loadMore}
          prescriptionsLoadingMore={prescriptionsState.prescriptionsLoadingMore}
          onClickUpdate={() => setShowUpdateModal(true)}
        />
      </div>

      {/* Add Patient Modal */}
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
              setShowAddModal(false);
            } catch (err) {
              console.error("Failed to add patient", err);
              toast.error("Error adding patient");
            }
          }}
        />
      )}

      {/* Update Patient Modal */}
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
