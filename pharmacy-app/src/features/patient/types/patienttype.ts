export interface Patient {
  id: string;
  fullName: string;
  dob: string; // ISO date string
  gender: string;
  phone: string;
  email?: string;
  address?: string;
  allergies?: string[];
  insurance?: { provider: string; memberId: string };
}

export type UpdatePatientRequest = Partial<Omit<Patient, "id">>;

// Response DTOs 
export interface PatientSummaryDto {
  id: string;
  fullName: string;
  phone: string;
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
  allergies?: string[];
  insurance?: InsuranceDto;
}

export type PatientDetailsDto = Patient;
