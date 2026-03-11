import type { CreatePatientRequest } from "@patient/types/patienttype";
import PatientFormModal from "./PatientFormModal";
import type { PatientFormValues } from "@patient/hooks/usePatientForm";
import { toast } from "@components/common/Toast/toastService";

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
    try {
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
    } catch (error) {
      console.error("[AddPatientModal] Failed to save patient:", error);
      toast.error(
        "Failed to Add Patient",
        error instanceof Error ? error.message : "An unexpected error occurred. Please try again."
      );
    }
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