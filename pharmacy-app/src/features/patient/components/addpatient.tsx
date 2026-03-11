import type { CreatePatientRequest } from "@patient/types/patienttype";
import PatientFormModal from "./PatientFormModal";
import type { PatientFormValues } from "@patient/hooks/usePatientForm";
import { toCreatePatientRequest } from "@patient/utils/patientPayload";

interface AddPatientModalProps {
  onClose: () => void;
  onSave: (request: CreatePatientRequest) => void | Promise<void>;
}

export default function AddPatientModal({ onClose, onSave }: AddPatientModalProps) {
  const initialValues: PatientFormValues = {
    fullName: "",
    dob: "",
    gender: "Male",
    phone: "",
    email: "",
    address: "",
    allergies: [],
    insuranceProvider: "",
    insurancePolicyId: "",
  };

  const handleSubmit = async (values: PatientFormValues) => {
    const request: CreatePatientRequest = toCreatePatientRequest(values);
    await onSave(request);
  };

  return (
    <PatientFormModal
      title="Add New Patient"
      submitLabel="Add Patient"
      initialValues={initialValues}
      onClose={onClose}
      onSubmit={handleSubmit}
      closeOnSuccess={true}
    />
  );
}
