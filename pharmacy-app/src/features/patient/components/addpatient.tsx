import type { CreatePatientRequest } from "@store/patient/patienttype";
import PatientFormModal from "./PatientFormModal";
import type { PatientFormValues } from "../hooks/usePatientForm";

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
  };

  const handleSubmit = async (values: PatientFormValues) => {
    const request: CreatePatientRequest = {
      fullName: values.fullName,
      dob: new Date(values.dob).toISOString(),
      gender: values.gender,
      phone: values.phone,
      email: values.email,
      address: values.address,
      allergies: values.allergies,
    };

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
