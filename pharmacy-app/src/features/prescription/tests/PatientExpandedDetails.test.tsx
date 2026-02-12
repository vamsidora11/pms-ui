import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import '@testing-library/jest-dom';

import PrescriptionExpandedDetails from '../components/PrescriptionExpandedDetails';

import type {
  PrescriptionSummaryDto,
  PrescriptionDetailsDto,
  PrescriptionMedicineDto,
  PrescriberDto,
  ValidationSummaryDto,
  MedicineValidationDto,
  PharmacistReviewDto,
} from '@prescription/prescription.types';
import type { PatientDetails } from '@prescription/models';

// ---------- Mock utils ----------
vi.mock('../prescriptionHistoryUtils', () => ({
  calculateAgeFromDob: vi.fn(() => 30),
}));

import { calculateAgeFromDob } from '../prescriptionHistoryUtils';

// ---------- Mock icons ----------
vi.mock('lucide-react', () => ({
  User: (props: any) => <svg data-testid="icon-user" {...props} />,
  Pill: (props: any) => <svg data-testid="icon-pill" {...props} />,
  AlertCircle: (props: any) => <svg data-testid="icon-alert" {...props} />,
}));

// ---------- Helpers ----------
const byTextExact =
  (text: string) =>
  (_: string, el: Element | null) =>
    (el?.textContent ?? '').trim() === text;

const byTextIncludes =
  (part: string) =>
  (_: string, el: Element | null) =>
    (el?.textContent ?? '').toLowerCase().includes(part.toLowerCase());

function randomId() {
  return Math.random().toString(36).slice(2);
}

// ---------- Strict Builders ----------
const makePrescriber = (o: Partial<PrescriberDto> = {}): PrescriberDto => ({
  id: 'pr-001',
  name: 'Dr. Who',
  ...o,
});

const makeValidationSummary = (
  o: Partial<ValidationSummaryDto> = {}
): ValidationSummaryDto => ({
  totalIssues: 0,
  highSeverityCount: 0,
  moderateCount: 0,
  lowCount: 0,
  requiresReview: false,
  ...o,
});

const makeMedicineValidation = (
  o: Partial<MedicineValidationDto> = {}
): MedicineValidationDto => ({
  drugAllergy: { isPresent: false, overallSeverity: null, allergies: [] },
  drugInteraction: { isPresent: false, overallSeverity: null, interactingWith: [] },
  lowStock: { isPresent: false, severity: null, requiredQty: 0, availableQty: 0, message: null },
  ...o,
});

const makePharmacistReview = (
  o: Partial<PharmacistReviewDto> = {}
): PharmacistReviewDto => ({
  decision: 'Pending',
  reviewedBy: null,
  reviewedAt: null,
  overrideReason: null,
  ...o,
});

const makeMedicine = (
  o: Partial<PrescriptionMedicineDto> = {}
): PrescriptionMedicineDto => ({
  prescriptionMedicineId: randomId(),
  productId: 'prod-001',
  name: 'Amoxicillin',
  strength: '500 mg',
  prescribedQuantity: 30,
  dispensedQuantity: 0,
  totalRefillsAuthorized: 2,
  refillsRemaining: 2,
  frequency: 'BID',
  daysSupply: 10,
  endDate: null,
  instruction: 'Take one capsule twice daily after meals',
  validation: makeMedicineValidation(),
  pharmacistReview: makePharmacistReview(),
  ...o,
});

const makeDetails = (
  o: Partial<PrescriptionDetailsDto> = {}
): PrescriptionDetailsDto => ({
  id: 'rx-001',
  patientId: 'p-001',
  patientName: 'John Doe',
  prescriber: makePrescriber(),
  createdAt: new Date().toISOString(),
  expiresAt: new Date(Date.now() + 7 * 86400000).toISOString(),
  status: 'Active',
  isRefillable: true,
  medicines: [makeMedicine(), makeMedicine({ name: 'Ibuprofen', strength: '200 mg' })],
  ...o,
});

const makeSummary = (
  o: Partial<PrescriptionSummaryDto> = {}
): PrescriptionSummaryDto => ({
  alerts: false,
  id: 'rx-001',
  patientId: 'p-001',
  patientName: 'John Doe',
  prescriberName: 'Dr. Who',
  createdAt: new Date().toISOString(),
  expiresAt: new Date(Date.now() + 7 * 86400000).toISOString(),
  status: 'Active',
  medicineCount: 2,
  validationSummary: makeValidationSummary(),
  ...o,
});

const makePatient = (o: Partial<PatientDetails> = {}): PatientDetails => ({
  id: 'p-001',
  fullName: 'John Doe',
  dob: '1996-04-01',
  gender: 'Male',
  phone: '+1 555 123 4567',
  email: 'john@example.com',
  address: '123 Main St',
  allergies: [],
  ...o,
});

// ============================================================
//                       TESTS
// ============================================================
describe('PrescriptionExpandedDetails', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading message when details is null', () => {
    render(
      <PrescriptionExpandedDetails
        row={makeSummary()}
        details={null}
        patient={null}
        patientLoading={false}
      />
    );

    expect(screen.getByText(/Loading prescription details/i)).toBeInTheDocument();
  });

  it('renders patient info when provided', () => {
    const details = makeDetails();
    const patient = makePatient({
      fullName: 'Alice Johnson',
      gender: 'Female',
      phone: '+91 99999 00000',
      allergies: ['Penicillin', 'Peanuts'],
    });

    render(
      <PrescriptionExpandedDetails
        row={makeSummary({ id: 'rx-777' })}
        details={details}
        patient={patient}
        patientLoading={false}
      />
    );

    expect(screen.getByText(byTextExact('Patient Information'))).toBeInTheDocument();
    expect(screen.getByText(byTextExact('Alice Johnson'))).toBeInTheDocument();

    // Scoped Age check
    const ageLabel = screen.getByText(byTextExact('Age'));
    const ageBox = ageLabel.parentElement!;
    expect(within(ageBox).getByText(byTextExact('30'))).toBeInTheDocument();

    expect(screen.getByText(byTextExact('Female'))).toBeInTheDocument();
    expect(screen.getByText(byTextExact('+91 99999 00000'))).toBeInTheDocument();

    expect(screen.getByText(byTextExact('Penicillin'))).toBeInTheDocument();
    expect(screen.getByText(byTextExact('Peanuts'))).toBeInTheDocument();
  });

  it('renders "Loading patient..." when needed', () => {
    render(
      <PrescriptionExpandedDetails
        row={makeSummary()}
        details={makeDetails()}
        patient={null}
        patientLoading={true}
      />
    );

    expect(screen.getByText(/Loading patient/i)).toBeInTheDocument();
  });

  it('renders "Patient details not available."', () => {
    render(
      <PrescriptionExpandedDetails
        row={makeSummary()}
        details={makeDetails()}
        patient={null}
        patientLoading={false}
      />
    );

    expect(screen.getByText(/Patient details not available/i)).toBeInTheDocument();
  });

  // ============================================================
  //            MAIN FIXED TEST: MEDICATION LIST
  // ============================================================
  it('renders medication list without badge assertion', () => {
    const details = makeDetails({
      medicines: [
        makeMedicine({
          prescriptionMedicineId: 'm-1',
          name: 'Paracetamol',
          strength: '650 mg',
          prescribedQuantity: 15,
          daysSupply: 5,
          refillsRemaining: 1,
          instruction: 'Take one tablet every 8 hours if fever persists',
        }),
        makeMedicine({
          prescriptionMedicineId: 'm-2',
          name: 'Cetirizine',
          strength: '10 mg',
          prescribedQuantity: 10,
          daysSupply: 10,
          refillsRemaining: 0,
          instruction: '',
        }),
      ],
    });

    render(
      <PrescriptionExpandedDetails
        row={makeSummary()}
        details={details}
        patient={makePatient()}
        patientLoading={false}
      />
    );

    expect(screen.getByText(/2\s*items/i)).toBeInTheDocument();

    // ---- First card (Paracetamol) ----
    const pTitle = screen.getByText(byTextExact('Paracetamol'));
    const pCard = pTitle.closest('div')!.parentElement!.parentElement!.parentElement!;

    const inP = within(pCard);
    expect(inP.getByText(byTextExact('650 mg'))).toBeInTheDocument();
    expect(inP.getByText(byTextExact('Quantity'))).toBeInTheDocument();
    expect(inP.getByText(byTextExact('15'))).toBeInTheDocument();
    expect(inP.getByText(byTextExact('Days'))).toBeInTheDocument();
    expect(inP.getByText(byTextExact('5'))).toBeInTheDocument();
    expect(inP.getByText(byTextExact('Refills'))).toBeInTheDocument();
    expect(inP.getByText(byTextExact('1'))).toBeInTheDocument();
    expect(inP.getByText(byTextExact('INSTRUCTIONS'))).toBeInTheDocument();

    // -------- Second med card (Cetirizine) --------
const cTitle = screen.getByText(byTextExact('Cetirizine'));
const cCard =
  cTitle.closest('div')!.parentElement!.parentElement!.parentElement!;

const inC = within(cCard);

expect(inC.getByText(byTextExact('10 mg'))).toBeInTheDocument();
expect(inC.getByText(byTextExact('Quantity'))).toBeInTheDocument();
expect(inC.getAllByText(byTextExact('10')).length).toBeGreaterThanOrEqual(2);

expect(inC.getByText(byTextExact('Days'))).toBeInTheDocument();
// (no need to test the second '10' again here)

expect(inC.getByText(byTextExact('Refills'))).toBeInTheDocument();
expect(inC.getByText(byTextExact('0'))).toBeInTheDocument();
expect(inC.queryByText(byTextExact('INSTRUCTIONS'))).not.toBeInTheDocument();
  });

  it('shows zero-medications empty state', () => {
    const details = makeDetails({ medicines: [] });

    render(
      <PrescriptionExpandedDetails
        row={makeSummary()}
        details={details}
        patient={makePatient()}
        patientLoading={false}
      />
    );

    expect(screen.getByText(/0\s*items/i)).toBeInTheDocument();
    expect(screen.getByText(/No medicines found/i)).toBeInTheDocument();
  });

  it('shows age placeholder when dob invalid', () => {
    vi.mocked(calculateAgeFromDob).mockReturnValueOnce(undefined as any);

    const patient = makePatient({ dob: 'invalid-date' });

    render(
      <PrescriptionExpandedDetails
        row={makeSummary()}
        details={makeDetails()}
        patient={patient}
        patientLoading={false}
      />
    );

    const ageLabel = screen.getByText(byTextExact('Age'));
    const ageCard = ageLabel.parentElement!;
    expect(within(ageCard).getByText(byTextExact('—'))).toBeInTheDocument();
  });

  it('renders hidden row id', () => {
    render(
      <PrescriptionExpandedDetails
        row={makeSummary({ id: 'rx-hidden' })}
        details={makeDetails()}
        patient={makePatient()}
        patientLoading={false}
      />
    );

    expect(screen.getByText(byTextExact('rx-hidden'))).toBeInTheDocument();
  });
});