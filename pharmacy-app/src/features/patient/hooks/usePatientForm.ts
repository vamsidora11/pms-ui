import { useState } from "react";
import { applyPatientRule, validatePatientForm } from "../utils/patientFormRules";

export type PatientFormValues = {
  fullName: string;
  dob: string; // yyyy-mm-dd
  gender: string;
  phone: string;
  email: string;
  address: string;
  allergies: string[];
};

export type PatientFormState = PatientFormValues & { newAllergy: string };

type Params = {
  initialValues: PatientFormValues;
  onSubmit: (values: PatientFormValues) => Promise<void> | void;
  onClose: () => void;
  closeOnSuccess?: boolean;
};

const VALIDATED_FIELDS = new Set<keyof PatientFormState>([
  "fullName",
  "dob",
  "phone",
  "email",
  "address",
]);

export function usePatientForm({
  initialValues,
  onSubmit,
  onClose,
  closeOnSuccess = true,
}: Params) {
  const [form, setForm] = useState<PatientFormState>({
    ...initialValues,
    newAllergy: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [warnings, setWarnings] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const updateField = (field: keyof PatientFormState, raw: string) => {
    if (VALIDATED_FIELDS.has(field)) {
      const { value, warning } = applyPatientRule(field as any, raw, {
        fullName: form.fullName,
        dob: form.dob,
        phone: form.phone,
        email: form.email,
        address: form.address,
      });

      setForm((prev) => ({ ...prev, [field]: value }));
      setWarnings((prev) => ({ ...prev, [field]: warning }));
    } else {
      // gender, newAllergy, etc.
      setForm((prev) => ({ ...prev, [field]: raw }));
    }

    // clear field error on edit
    setErrors((prev) => ({ ...prev, [field]: "" }));
    setFormError("");
  };

  const addAllergy = (value: string) => {
    const v = (value ?? "").toString().trim();
    if (!v) return;

    setForm((prev) => {
      const exists = prev.allergies.some(
        (a) => (a ?? "").toLowerCase() === v.toLowerCase(),
      );
      if (exists) return prev;

      return {
        ...prev,
        allergies: [...prev.allergies, v],
        newAllergy: "",
      };
    });
  };

  const removeAllergy = (value: string) => {
    setForm((prev) => ({
      ...prev,
      allergies: prev.allergies.filter(
        (a) => a.toLowerCase() !== value.toLowerCase(),
      ),
    }));
  };

  const submit = async () => {
    const newErrors = validatePatientForm({
      fullName: form.fullName,
      dob: form.dob,
      phone: form.phone,
      email: form.email,
      address: form.address,
    });

    if (Object.keys(newErrors).length) {
      setErrors(newErrors);
      setFormError("Please fix the errors below before submitting details.");
      return;
    }

    setSubmitting(true);
    setFormError("");

    try {
      const payload: PatientFormValues = {
        fullName: form.fullName.trim(),
        dob: form.dob,
        gender: form.gender,
        phone: form.phone.trim(),
        email: form.email.trim(),
        address: form.address.trim(),
        allergies: form.allergies,
      };

      await onSubmit(payload);

      if (closeOnSuccess) onClose();
    } catch (err: any) {
      setFormError(err?.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  return {
    form,
    setForm,
    errors,
    warnings,
    formError,
    submitting,
    updateField,
    addAllergy,
    removeAllergy,
    submit,
    setFormError,
  };
}
