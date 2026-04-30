export type PatientGender = "Male" | "Female" | "Other";

export interface Patient {
  id: string;
  fullName: string;
  dob: string; // ISO date string
  gender: PatientGender;
  phone: string;
  email?: string | null;
  address?: string | null;
  allergies?: string[];
  insurance?: InsuranceDto | null;
}

export interface PatientSummaryDto {
  id: string;
  fullName: string;
  phone: string;
}

export interface InsuranceDto {
  provider: string;
  policyId: string;
}

export interface CreatePatientRequest {
  fullName: string;
  dob: string;
  gender: PatientGender;
  phone: string;
  email?: string;
  address?: string;
  allergies?: string[];
  insurance?: InsuranceDto;
}

export interface UpdatePatientRequest {
  fullName: string;
  dob: string;
  phone: string;
  email?: string;
  address?: string;
  allergies?: string[];
  insurance?: InsuranceDto;
}

export type PatientDetailsDto = Patient;
