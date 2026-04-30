import { useEffect, useState } from "react";
import { Plus } from "lucide-react";

import AddPatientModal from "./addpatient";
import UpdatePatientModal from "./updatePatient";

import {
  createPatient,
  getPatientDetails,
  getPatientPrescriptions,
  searchPatients,
} from "@api/patient";
import { mapSummaryDto } from "@prescription/domain/mapper";

import type { PatientDetailsDto } from "@patient/types/patienttype";
import type { PrescriptionSummary } from "@prescription/domain/model";

import { usePatientDirectory } from "@patient/hooks/usePatientDirectory";
import { usePatientDetails } from "@patient/hooks/usePatientDetails";
import { usePatientPrescriptions } from "@patient/hooks/usePatientPrescriptions";
import { useToast } from "@components/common/Toast/useToast";
import { extractApiError } from "@utils/httpError";
import PatientDirectoryPanel from "./PatientDirectoryPanel";
import PatientDetailsPanel from "./PatientDetailsPanel";

export default function PatientProfiles() {
  const toast = useToast();

  const directory = usePatientDirectory({
    searchFn: (query, opts) => searchPatients(query, opts),
    debounceMs: 250,
    minChars: 1,
  });

  const details = usePatientDetails((id) => getPatientDetails(id));

  const [showAddModal, setShowAddModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);

  const prescriptionsState = usePatientPrescriptions<PrescriptionSummary>(
    async (id, pageNumber, pageSize) => {
      const result = await getPatientPrescriptions(id, {
        pageNumber,
        pageSize,
      });
      const items = Array.isArray(result.items) ? result.items : [];

      return {
        items: items.map(mapSummaryDto),
        pageNumber: result.pageNumber ?? pageNumber ?? 1,
        totalPages: result.totalPages ?? 1,
      };
    },
    details.selectedPatient?.id ?? null,
    10,
  );

  const { patients, debouncedSearch, searchTerm, setPatients, setSearchTerm, listLoading, listError } = directory;
  const { selectedPatient, detailsLoading, detailsError, selectPatient, setSelectedPatient } = details;
  const {
    prescriptions,
    prescriptionsLoading,
    prescriptionsError,
    hasMore,
    loadMore,
    prescriptionsLoadingMore,
    reset,
  } = prescriptionsState;

  useEffect(() => {
    const selectedId = selectedPatient?.id ?? null;

    if (selectedId && !patients.some((patient) => patient.id === selectedId)) {
      setSelectedPatient(null);
      reset();
    }

    if (!selectedPatient && patients.length > 0) {
      void selectPatient(patients[0].id);
    }
  }, [
    patients,
    reset,
    selectPatient,
    selectedPatient,
    setSelectedPatient,
  ]);

  const refreshPatients = async () => {
    const refreshed = await searchPatients((debouncedSearch ?? "").trim());
    setPatients(refreshed);
  };

  const focusDirectoryOnPatient = (patient: PatientDetailsDto) => {
    setSearchTerm(patient.fullName);
    setPatients([
      {
        id: patient.id,
        fullName: patient.fullName,
        phone: patient.phone,
      },
    ]);
    setSelectedPatient(patient);
  };

  return (
    <div className="mx-auto min-h-screen max-w-6xl space-y-6 pb-12 md:pb-16">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Patient Profiles</h1>
          <p className="text-gray-500">
            View patient demographics and medical information
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-teal-500 px-5 py-3 text-white shadow"
        >
          <Plus size={18} />
          Add New Patient
        </button>
      </div>

      <div className="grid h-[calc(100vh-220px)] grid-cols-3 items-stretch gap-6">
        <PatientDirectoryPanel
          patients={patients}
          searchTerm={searchTerm}
          onSearchTermChange={setSearchTerm}
          listLoading={listLoading}
          listError={listError}
          selectedPatientId={selectedPatient?.id}
          onSelectPatient={selectPatient}
        />

        <PatientDetailsPanel
          selectedPatient={selectedPatient}
          detailsLoading={detailsLoading}
          detailsError={detailsError}
          prescriptions={prescriptions}
          prescriptionsLoading={prescriptionsLoading}
          prescriptionsError={prescriptionsError}
          prescriptionsHasMore={hasMore}
          onLoadMorePrescriptions={loadMore}
          prescriptionsLoadingMore={prescriptionsLoadingMore}
          onClickUpdate={() => setShowUpdateModal(true)}
        />
      </div>

      {showAddModal && (
        <AddPatientModal
          onClose={() => setShowAddModal(false)}
          onSave={async (request) => {
            try {
              const { patientId } = await createPatient(request);
              const createdPatient = await getPatientDetails(patientId);
              focusDirectoryOnPatient(createdPatient);
              setShowAddModal(false);
              toast.success("Success", "Patient added successfully.");
            } catch (error) {
              const message = extractApiError(error) || "Error adding patient";
              console.error("Failed to add patient", error);
              toast.error(
                "Error adding patient",
                message,
              );
              throw error instanceof Error ? error : new Error(message);
            }
          }}
        />
      )}

      {showUpdateModal && selectedPatient && (
        <UpdatePatientModal
          patient={selectedPatient}
          onClose={() => setShowUpdateModal(false)}
          onSave={async (updated: PatientDetailsDto) => {
            setSelectedPatient(updated);
            await refreshPatients();
            setShowUpdateModal(false);
            toast.success("Success", "Patient updated successfully.");
          }}
        />
      )}
    </div>
  );
}
