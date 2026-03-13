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

      return {
        items: result.items.map(mapSummaryDto),
        pageNumber: result.pageNumber,
        totalPages: result.totalPages,
      };
    },
    details.selectedPatient?.id ?? null,
    10,
  );

  useEffect(() => {
    const selectedId = details.selectedPatient?.id ?? null;

    if (selectedId && !directory.patients.some((patient) => patient.id === selectedId)) {
      details.setSelectedPatient(null);
      prescriptionsState.reset();
    }

    if (!details.selectedPatient && directory.patients.length > 0) {
      void details.selectPatient(directory.patients[0].id);
    }
  }, [
    details.selectedPatient,
    details.selectPatient,
    details.setSelectedPatient,
    directory.patients,
    prescriptionsState.reset,
  ]);

  const refreshPatients = async () => {
    const refreshed = await searchPatients((directory.debouncedSearch ?? "").trim());
    directory.setPatients(refreshed);
  };

  const focusDirectoryOnPatient = (patient: PatientDetailsDto) => {
    directory.setSearchTerm(patient.fullName);
    directory.setPatients([
      {
        id: patient.id,
        fullName: patient.fullName,
        phone: patient.phone,
      },
    ]);
    details.setSelectedPatient(patient);
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
          patients={directory.patients}
          searchTerm={directory.searchTerm}
          onSearchTermChange={directory.setSearchTerm}
          listLoading={directory.listLoading}
          listError={directory.listError}
          selectedPatientId={details.selectedPatient?.id}
          onSelectPatient={details.selectPatient}
        />

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

      {showUpdateModal && details.selectedPatient && (
        <UpdatePatientModal
          patient={details.selectedPatient}
          onClose={() => setShowUpdateModal(false)}
          onSave={async (updated: PatientDetailsDto) => {
            details.setSelectedPatient(updated);
            await refreshPatients();
            setShowUpdateModal(false);
            toast.success("Success", "Patient updated successfully.");
          }}
        />
      )}
    </div>
  );
}
