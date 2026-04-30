import type { PrescriptionDraft, MedicationDraft } from "@prescription/types/models";

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export function validatePatientStep(draft: PrescriptionDraft): ValidationResult {
  const errors: string[] = [];

  if (!draft.patient) {
    errors.push("Patient is required");
  } else {
    if (!draft.patient.id) errors.push("Patient ID is missing");
    if (!draft.patient.fullName) errors.push("Patient name is missing");
    if (!draft.patient.phone) errors.push("Patient phone is missing");
  }

  return { valid: errors.length === 0, errors };
}

export function validateDoctorStep(draft: PrescriptionDraft): ValidationResult {
  const errors: string[] = [];

  if (!draft.doctor.id || draft.doctor.id.trim() === "") {
    errors.push("Doctor ID is required");
  }

  if (!draft.doctor.name || draft.doctor.name.trim() === "") {
    errors.push("Doctor name is required");
  }

  if (draft.doctor.id && draft.doctor.id.length < 2) {
    errors.push("Doctor ID must be at least 2 characters");
  }

  if (draft.doctor.name && draft.doctor.name.length < 3) {
    errors.push("Doctor name must be at least 3 characters");
  }

  return { valid: errors.length === 0, errors };
}

export function validateMedicationStep(draft: PrescriptionDraft): ValidationResult {
  const errors: string[] = [];

  if (!draft.medications || draft.medications.length === 0) {
    errors.push("At least one medication is required");
    return { valid: false, errors };
  }

  draft.medications.forEach((med, index) => {
    errors.push(...validateMedication(med, index + 1));
  });

  return { valid: errors.length === 0, errors };
}

function validateMedication(med: MedicationDraft, position: number): string[] {
  const errors: string[] = [];
  const prefix = `Medication ${position}:`;

  if (!med.drugId) errors.push(`${prefix} Drug must be selected from inventory`);
  if (!med.drugName || med.drugName.trim() === "") errors.push(`${prefix} Drug name is required`);
  if (!med.strength || med.strength.trim() === "") errors.push(`${prefix} Strength is required`);
  if (!med.frequency || med.frequency.trim() === "") errors.push(`${prefix} Frequency is required`);
  if (!Number.isFinite(med.quantity) || med.quantity <= 0)
    errors.push(`${prefix} Quantity must be greater than 0`);
  if (!Number.isFinite(med.durationDays) || med.durationDays <= 0)
    errors.push(`${prefix} Duration must be greater than 0 days`);
  if (med.refills < 0) errors.push(`${prefix} Refills cannot be negative`);

  return errors;
}

export function validatePrescriptionDraft(draft: PrescriptionDraft): ValidationResult {
  const errors: string[] = [];
  errors.push(...validatePatientStep(draft).errors);
  errors.push(...validateDoctorStep(draft).errors);
  errors.push(...validateMedicationStep(draft).errors);

  return { valid: errors.length === 0, errors };
}
