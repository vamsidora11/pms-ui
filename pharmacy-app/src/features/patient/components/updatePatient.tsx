import type {
  PatientDetailsDto,
} from "@patient/types/patienttype";
import { updatePatient, getPatientDetails } from "@api/patient";
import { extractApiError } from "@utils/httpError";
import { useToast } from "@components/common/Toast/useToast";
import PatientFormModal from "./PatientFormModal";
import type { PatientFormValues } from "@patient/hooks/usePatientForm";
import {
  toPatientFormValues,
  toUpdatePatientRequest,
} from "@patient/utils/patientPayload";

interface UpdatePatientModalProps {
  patient: PatientDetailsDto;
  onClose: () => void;
  onSave: (updated: PatientDetailsDto) => void;
}

export default function UpdatePatientModal({
  patient,
  onClose,
  onSave,
}: UpdatePatientModalProps) {
  const toast = useToast();
  const initialValues: PatientFormValues = toPatientFormValues(patient);

  const handleSubmit = async (values: PatientFormValues) => {
    const request = toUpdatePatientRequest(values);

    try {
      await updatePatient(patient.id, request);
      const updated = await getPatientDetails(patient.id);
      onSave(updated);
    } catch (e) {
      const message = extractApiError(e) || "Error updating patient";
      toast.error("Error updating patient", message);
      throw new Error(message);
    }
  };

  return (
    <PatientFormModal
      title="Update Patient"
      submitLabel="Save Changes"
      initialValues={initialValues}
      onClose={onClose}
      onSubmit={handleSubmit}
      closeOnSuccess={true}
      showGender={false}
    />
  );
}
