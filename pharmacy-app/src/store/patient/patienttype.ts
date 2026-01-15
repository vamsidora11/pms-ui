export interface Patient {
  id: string;
  fullName: string;
  dob: string; // ISO date string
  gender: string;
  phone: string;
  email?: string;
  address: string;
  allergies?: { code: string; displayName: string }[];
  insurance?: { provider: string; memberId: string };
}

export type UpdatePatientRequest = Partial<Omit<Patient, "id">>;

// Response DTOs 
export interface PatientSummaryDto {
  id: string;
  fullName: string;
  phone: string;
}
export interface PatientAllergyDto {
  code: string;
  displayName: string;
}

export interface InsuranceDto {
  provider: string;
  memberId: string;
}

export interface CreatePatientRequest {
  fullName: string;
  dob: string;
  gender: string;
  phone: string;
  email?: string;
  address?: string;
  allergies?: PatientAllergyDto[];
  insurance?: InsuranceDto;
}

export type PatientDetailsDto = Patient;
