import type { PatientFormValues } from "@patient/hooks/usePatientForm";
import type {
  CreatePatientRequest,
  InsuranceDto,
  PatientDetailsDto,
  UpdatePatientRequest,
} from "@patient/types/patienttype";

const normalizeOptional = (value: string): string | undefined => {
  const normalized = (value ?? "").trim();
  return normalized || undefined;
};

export const hasPartialInsurance = (values: PatientFormValues): boolean => {
  const provider = normalizeOptional(values.insuranceProvider);
  const policyId = normalizeOptional(values.insurancePolicyId);

  return Boolean(provider) !== Boolean(policyId);
};

export const buildInsuranceDto = (
  values: PatientFormValues,
): InsuranceDto | undefined => {
  const provider = normalizeOptional(values.insuranceProvider);
  const policyId = normalizeOptional(values.insurancePolicyId);

  if (!provider && !policyId) {
    return undefined;
  }

  return {
    provider: provider ?? "",
    policyId: policyId ?? "",
  };
};

const buildBasePayload = (values: PatientFormValues) => ({
  fullName: values.fullName,
  dob: new Date(values.dob).toISOString(),
  phone: values.phone,
  email: normalizeOptional(values.email),
  address: normalizeOptional(values.address),
  allergies: values.allergies,
  insurance: buildInsuranceDto(values),
});

export const toCreatePatientRequest = (
  values: PatientFormValues,
): CreatePatientRequest => ({
  ...buildBasePayload(values),
  gender: values.gender,
});

export const toUpdatePatientRequest = (
  values: PatientFormValues,
): UpdatePatientRequest => buildBasePayload(values);

export const toPatientFormValues = (
  patient: PatientDetailsDto,
): PatientFormValues => ({
  fullName: patient.fullName,
  dob: patient.dob ? patient.dob.split("T")[0] : "",
  gender: patient.gender,
  phone: patient.phone,
  email: patient.email ?? "",
  address: patient.address ?? "",
  allergies: Array.isArray(patient.allergies)
    ? patient.allergies
        .map((item) => (item ?? "").toString().trim())
        .filter(Boolean)
    : [],
  insuranceProvider: patient.insurance?.provider ?? "",
  insurancePolicyId: patient.insurance?.policyId ?? "",
});
