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

/** --- New: dosing rules and helpers --- */
const DOSES_PER_DAY: Record<string, number | null> = {
  OD: 1,
  BID: 2,
  TID: 3,
  QID: 4,
  Q4H: 6,   // 24/4
  Q6H: 4,   // 24/6
  Q8H: 3,   // 24/8
  Q12H: 2,  // 24/12
  PRN: null, // as-needed -> cannot derive exact quantity
  STAT: 1,  // one-time dose; we also nudge days to 1
};

function calcExpectedQty(freq: string, durationDays: number): number | null {
  const doses = DOSES_PER_DAY[freq];
  const days = Number.isFinite(durationDays) ? Math.max(1, Math.floor(durationDays)) : 0;
  if (!doses || days <= 0) return null;
  return doses * days;
}

function validateMedication(med: MedicationDraft, position: number): string[] {
  const errors: string[] = [];
  const prefix = `Medication ${position}:`;

  // Existing required-field checks
  if (!med.drugId) errors.push(`${prefix} Drug must be selected from inventory`);
  if (!med.drugName || med.drugName.trim() === "") errors.push(`${prefix} Drug name is required`);
  if (!med.strength || med.strength.trim() === "") errors.push(`${prefix} Strength is required`);
  if (!med.frequency || med.frequency.trim() === "") errors.push(`${prefix} Frequency is required`);
  if (!Number.isFinite(med.quantity) || med.quantity <= 0)
    errors.push(`${prefix} Quantity must be greater than 0`);
  if (!Number.isFinite(med.durationDays) || med.durationDays <= 0)
    errors.push(`${prefix} Duration must be greater than 0 days`);
  if (med.refills < 0) errors.push(`${prefix} Refills cannot be negative`);

  // If any of the base numeric checks failed, skip the math validation to avoid noisy messages
  if (errors.length > 0) return errors;

  // Normalize values for calculation
  const freq = med.frequency;
  const days = Math.max(1, Math.floor(med.durationDays));
  const qty = Math.floor(med.quantity);

  // PRN: allow clinician discretion; keep it simple but safe.
  if (freq === "PRN") {
    // Already ensured qty >= 1 and days >= 1 above.
    // No strict equality check for PRN.
    return errors;
  }

  // STAT: typically single dose; warn if days > 1 (treat as error to block Next; change to advisory if needed)
  if (freq === "STAT") {
    if (days > 1) {
      errors.push(`${prefix} STAT is typically one-time; consider setting Duration to 1 day`);
    }
    // We don't force qty===1 because some clinics may give more than one unit for STAT (e.g., repeat if vomited).
    return errors;
  }

  // Standard frequencies: enforce exact match
  const expected = calcExpectedQty(freq, days);

  if (expected === null) {
    // Unknown frequency mapping: fallback to minimal guard
    if (qty < 1) {
      errors.push(`${prefix} Quantity must be at least 1`);
    }
    return errors;
  }

  if (qty !== expected) {
    errors.push(
      `${prefix} Quantity (${qty}) does not match expected (${DOSES_PER_DAY[freq]} × ${days} = ${expected})`
    );
  }

  return errors;
}

export function validatePrescriptionDraft(draft: PrescriptionDraft): ValidationResult {
  const errors: string[] = [];
  errors.push(...validatePatientStep(draft).errors);
  errors.push(...validateDoctorStep(draft).errors);
  errors.push(...validateMedicationStep(draft).errors);

  return { valid: errors.length === 0, errors };
}
