import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

import { usePrescriptionEntry } from "../hooks/usePrescriptionEntry";
import type {
  DoctorDetails,
  MedicationDraft,
  PatientDetails,
  PatientSummary,
} from "@prescription/types/models";
import type {
  CreatePrescriptionRequest,
  PrescriptionDetailsDto,
} from "@prescription/types/prescription.types";
import type { ValidationResult } from "@prescription/utils/validation";

/* -------------------- MOCKS -------------------- */

type ToastMock = {
  success: ReturnType<typeof vi.fn>;
  error: ReturnType<typeof vi.fn>;
};

vi.mock("@components/common/Toast/useToast", () => {
  const toastMock: ToastMock = {
    success: vi.fn(),
    error: vi.fn(),
  };
  return {
    __esModule: true,
    useToast: () => toastMock,
    toastMock,
  };
});

vi.mock("@api/patientSearch", () => {
  return {
    __esModule: true,
    getPatientById: vi.fn(),
  };
});

vi.mock("@api/prescription", () => {
  return {
    __esModule: true,
    createPrescription: vi.fn(),
  };
});

vi.mock("@prescription/utils/validation", () => {
  const validatePatientStep = vi.fn(() => ({ valid: false, errors: ["Invalid patient"] }));
  const validateDoctorStep = vi.fn(() => ({ valid: false, errors: ["Invalid doctor"] }));
  const validateMedicationStep = vi.fn(() => ({ valid: false, errors: ["Invalid meds"] }));
  const validatePrescriptionDraft = vi.fn(() => ({ valid: false, errors: ["Form invalid"] }));

  return {
    __esModule: true,
    validatePatientStep,
    validateDoctorStep,
    validateMedicationStep,
    validatePrescriptionDraft,
  };
});

/* -------------------- IMPORT MOCK HANDLES -------------------- */

import * as ToastModule from "@components/common/Toast/useToast";
import { getPatientById } from "@api/patientSearch";
import { createPrescription } from "@api/prescription";
import {
  validatePatientStep,
  validateDoctorStep,
  validateMedicationStep,
  validatePrescriptionDraft,
} from "@prescription/utils/validation";

/* -------------------- HELPERS -------------------- */

function samplePatientSummary() {
  const summary: PatientSummary = {
    id: "p-1",
    fullName: "John Doe",
    phone: "+1-555-0100",
  };
  return summary;
}

function samplePatientDetails(overrides: Partial<PatientDetails> = {}) {
  const details: PatientDetails = {
    id: "p-1",
    fullName: "John Doe",
    phone: "+1-555-0100",
    dob: "1980-01-01",
    gender: "Male",
    email: "john@example.com",
    address: "221B Baker Street",
    allergies: undefined,
    ...overrides,
  };
  return details;
}

function sampleDoctor() {
  const doctor: DoctorDetails = { id: "d-99", name: "Dr. Jane Smith" };
  return doctor;
}

function sampleMedications() {
  const meds: MedicationDraft[] = [
    {
      drugId: "prod-123",
      drugName: "Amoxicillin",
      strength: "500mg",
      frequency: "BID",
      quantity: 10,
      durationDays: 5,
      refills: 1,
      instructions: "After meals",
    },
  ];
  return meds;
}

const createdPrescriptionResponse: PrescriptionDetailsDto = {
  id: "rx-100",
  patientId: "p-1",
  patientName: "John Doe",
  prescriber: { id: "d-99", name: "Dr. Jane Smith" },
  createdAt: "2025-01-01T00:00:00.000Z",
  expiresAt: "2025-12-31T00:00:00.000Z",
  status: "CREATED",
  isRefillable: false,
  medicines: [],
};

/* -------------------- TESTS -------------------- */

describe("usePrescriptionEntry", () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
  const mockedGetPatientById = vi.mocked(getPatientById);
  const mockedCreatePrescription = vi.mocked(createPrescription);

  beforeEach(() => {
    vi.clearAllMocks();
    const invalidPatient: ValidationResult = { valid: false, errors: ["Invalid patient"] };
    const invalidDoctor: ValidationResult = { valid: false, errors: ["Invalid doctor"] };
    const invalidMeds: ValidationResult = { valid: false, errors: ["Invalid meds"] };
    const invalidDraft: ValidationResult = { valid: false, errors: ["Form invalid"] };

    vi.mocked(validatePatientStep).mockReturnValue(invalidPatient);
    vi.mocked(validateDoctorStep).mockReturnValue(invalidDoctor);
    vi.mocked(validateMedicationStep).mockReturnValue(invalidMeds);
    vi.mocked(validatePrescriptionDraft).mockReturnValue(invalidDraft);

    // Silence console.error by default (we'll restore per-test if needed)
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy?.mockRestore();
  });

  it("returns initial state and constants", () => {
    const { result } = renderHook(() => usePrescriptionEntry());
    const { currentStep, draft, isSubmitting, steps, isNextDisabled } = result.current;

    expect(currentStep).toBe(1);
    expect(isSubmitting).toBe(false);
    expect(steps).toEqual([
      { step: 1, label: "Patient" },
      { step: 2, label: "Doctor" },
      { step: 3, label: "Medications" },
      { step: 4, label: "Review" },
    ]);

    expect(draft.patient).toBeNull();
    expect(draft.doctor).toEqual({ id: "", name: "" });
    expect(Array.isArray(draft.medications)).toBe(true);
    expect(draft.medications.length).toBe(1);
    expect(draft.medications[0]).toMatchObject({
      drugId: "",
      drugName: "",
      strength: "",
      frequency: "BID",
      quantity: 1,
      durationDays: 7,
      refills: 0,
      instructions: "",
    });
    expect(draft.notes).toBe("");

    expect(isNextDisabled).toBe(true);
  });

it("computes isNextDisabled based on step-specific validations", () => {
  const { result, rerender } = renderHook(() => usePrescriptionEntry());

  // --- Step 1 (Patient) ---
  // make it valid
  vi.mocked(validatePatientStep).mockReturnValue({ valid: true, errors: [] });

  // Force a state change: move away from 1, then back to 1
  act(() => {
    result.current.setCurrentStep(2);
  });
  rerender();

  act(() => {
    result.current.setCurrentStep(1);
  });
  rerender();

  expect(result.current.isNextDisabled).toBe(false);

  // --- Step 2 (Doctor) ---
  vi.mocked(validateDoctorStep).mockReturnValue({ valid: true, errors: [] });

  act(() => {
    result.current.setCurrentStep(3);
  });
  rerender();

  act(() => {
    result.current.setCurrentStep(2);
  });
  rerender();

  expect(result.current.isNextDisabled).toBe(false);

  // --- Step 3 (Medications) ---
  vi.mocked(validateMedicationStep).mockReturnValue({ valid: true, errors: [] });

  act(() => {
    result.current.setCurrentStep(4);
  });
  rerender();

  act(() => {
    result.current.setCurrentStep(3);
  });
  rerender();

  expect(result.current.isNextDisabled).toBe(false);

  // --- Step 4 (Review) — always true per hook logic ---
  act(() => {
    result.current.setCurrentStep(4);
  });
  rerender();
  expect(result.current.isNextDisabled).toBe(true);
});

  it("navigates steps with goNext/goPrev and clamps between 1..4", () => {
    const { result } = renderHook(() => usePrescriptionEntry());

    act(() => {
      result.current.goPrev(); // already at 1
    });
    expect(result.current.currentStep).toBe(1);

    act(() => {
      result.current.goNext();
      result.current.goNext();
      result.current.goNext();
      result.current.goNext(); // beyond 4 ignored
    });
    expect(result.current.currentStep).toBe(4);

    act(() => {
      result.current.goPrev();
      result.current.goPrev();
      result.current.goPrev();
      result.current.goPrev(); // below 1 ignored
    });
    expect(result.current.currentStep).toBe(1);
  });

  it("handlePatientSelected loads details, normalizes allergies, and updates draft", async () => {
    mockedGetPatientById.mockResolvedValueOnce(
      samplePatientDetails({ allergies: undefined })
    );
    const { result } = renderHook(() => usePrescriptionEntry());

    await act(async () => {
      await result.current.handlePatientSelected(samplePatientSummary());
    });

    expect(getPatientById).toHaveBeenCalledWith("p-1");
    expect(result.current.draft.patient).toMatchObject({
      id: "p-1",
      fullName: "John Doe",
      allergies: [],
    });

    const { toastMock } = ToastModule as unknown as { toastMock: ToastMock };
    expect(toastMock.error).not.toHaveBeenCalled();
  });

  it("handlePatientSelected shows toast error when details missing", async () => {
    mockedGetPatientById.mockResolvedValueOnce(undefined);
    const { result } = renderHook(() => usePrescriptionEntry());

    await act(async () => {
      await result.current.handlePatientSelected(samplePatientSummary());
    });

    const { toastMock } = ToastModule as unknown as { toastMock: ToastMock };
    expect(toastMock.error).toHaveBeenCalledWith("Error", "Failed to load patient details");
  });

  it("handleDoctorChange updates draft doctor", () => {
    const { result } = renderHook(() => usePrescriptionEntry());

    act(() => {
      result.current.handleDoctorChange(sampleDoctor());
    });

    expect(result.current.draft.doctor).toEqual(sampleDoctor());
  });

  it("handleMedicationsChange updates the medications array", () => {
    const { result } = renderHook(() => usePrescriptionEntry());
    const meds = sampleMedications();

    act(() => {
      result.current.handleMedicationsChange(meds);
    });

    expect(result.current.draft.medications).toEqual(meds);
  });

  it("handleSubmit shows validation error and does not call API when invalid", async () => {
    vi.mocked(validatePrescriptionDraft).mockReturnValueOnce({
      valid: false,
      errors: ["Please fix the issues"],
    });

    const { result } = renderHook(() => usePrescriptionEntry());

    await act(async () => {
      await result.current.handleSubmit();
    });

    const { toastMock } = ToastModule as unknown as { toastMock: ToastMock };
    expect(toastMock.error).toHaveBeenCalledWith("Validation Error", "Please fix the issues");
    expect(createPrescription).not.toHaveBeenCalled();
    expect(result.current.isSubmitting).toBe(false);
  });

  it("handleSubmit posts when valid, shows success, and resets state", async () => {
    vi.mocked(validatePrescriptionDraft).mockReturnValueOnce({
      valid: true,
      errors: [],
    });
    mockedCreatePrescription.mockResolvedValueOnce(createdPrescriptionResponse);

    const { result } = renderHook(() => usePrescriptionEntry());

    await act(async () => {
      mockedGetPatientById.mockResolvedValueOnce(
        samplePatientDetails({ allergies: ["Peanuts"] })
      );
      await result.current.handlePatientSelected(samplePatientSummary());
    });

    act(() => {
      result.current.handleDoctorChange(sampleDoctor());
      result.current.handleMedicationsChange(sampleMedications());
    });

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(createPrescription).toHaveBeenCalledTimes(1);
    const calledWith = mockedCreatePrescription.mock.calls[0]?.[0] as CreatePrescriptionRequest;

    expect(calledWith).toMatchObject({
      patientId: "p-1",
      patientName: "John Doe",
      prescriber: { id: "d-99", name: "Dr. Jane Smith" },
    });
    expect(Array.isArray(calledWith.medicines)).toBe(true);
    expect(calledWith.medicines[0]).toMatchObject({
      productId: "prod-123",
      name: "Amoxicillin",
      strength: "500mg",
      prescribedQuantity: 10,
      totalRefillsAuthorized: 1,
      frequency: "BID",
      daysSupply: 5,
      instruction: "After meals",
    });

    const { toastMock } = ToastModule as unknown as { toastMock: ToastMock };
    expect(toastMock.success).toHaveBeenCalledWith(
      "Prescription Created Successfully",
      "Prescription ID: rx-100 | Status: CREATED"
    );

    expect(result.current.currentStep).toBe(1);
    expect(result.current.draft.patient).toBeNull();
    expect(result.current.draft.doctor).toEqual({ id: "", name: "" });
    expect(result.current.draft.medications.length).toBe(1);
    expect(result.current.isSubmitting).toBe(false);
  });

  it("handleSubmit shows error when API fails and does not reset draft", async () => {
    vi.mocked(validatePrescriptionDraft).mockReturnValueOnce({
      valid: true,
      errors: [],
    });
    mockedCreatePrescription.mockRejectedValueOnce(new Error("Server down"));

    const { result } = renderHook(() => usePrescriptionEntry());

    await act(async () => {
      mockedGetPatientById.mockResolvedValueOnce(samplePatientDetails());
      await result.current.handlePatientSelected(samplePatientSummary());
    });
    act(() => {
      result.current.handleDoctorChange(sampleDoctor());
      result.current.handleMedicationsChange(sampleMedications());
    });

    await act(async () => {
      await result.current.handleSubmit();
    });

    const { toastMock } = ToastModule as unknown as { toastMock: ToastMock };

    // ✅ Your hook uses anyErr?.message || "Server error" → for Error("Server down"), msg is "Server down"
    expect(toastMock.error).toHaveBeenCalledWith(
      "Failed to create prescription",
      "Server down"
    );

    expect(result.current.draft.patient?.id).toBe("p-1");
    expect(result.current.draft.doctor).toEqual(sampleDoctor());
    expect(result.current.isSubmitting).toBe(false);
  });

  it("reset() returns to initial draft and step 1", () => {
    const { result } = renderHook(() => usePrescriptionEntry());

    act(() => {
      result.current.handleDoctorChange(sampleDoctor());
      result.current.setCurrentStep(3);
      result.current.reset();
    });

    expect(result.current.currentStep).toBe(1);
    expect(result.current.draft.patient).toBeNull();
    expect(result.current.draft.doctor).toEqual({ id: "", name: "" });
    expect(result.current.draft.medications.length).toBe(1);
  });
});
