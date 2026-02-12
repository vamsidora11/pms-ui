import type {
  UpdatePatientRequest,
  PatientDetailsDto,
} from "@patient/types/patienttype";
import { updatePatient, getPatientDetails } from "@api/patient";
import PatientFormModal from "./PatientFormModal";
import type { PatientFormValues } from "../hooks/usePatientForm";

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
  const initialValues: PatientFormValues = {
    fullName: patient.fullName,
    dob: patient.dob ? patient.dob.split("T")[0] : "",
    gender: patient.gender,
    phone: patient.phone,
    email: patient.email ?? "",
    address: patient.address ?? "",
    allergies: Array.isArray(patient.allergies)
      ? patient.allergies
          .map((s) => (s ?? "").toString().trim())
          .filter(Boolean)
      : [],
  };

  const handleSubmit = async (values: PatientFormValues) => {
    const request: UpdatePatientRequest = {
      fullName: values.fullName,
      dob: new Date(values.dob).toISOString(),
      gender: values.gender,
      phone: values.phone,
      email: values.email,
      address: values.address,
      allergies: values.allergies,
    };

    try {
      await updatePatient(patient.id, request);
      const updated = await getPatientDetails(patient.id);
      onSave(updated);
    } catch (e: any) {
      // throw so PatientFormModal shows formError and stays open
      throw new Error(e?.message || "Error updating patient");
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
    />
  );
}
