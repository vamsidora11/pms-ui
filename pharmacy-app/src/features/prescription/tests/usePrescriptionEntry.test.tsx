import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

import { usePrescriptionEntry } from "../hooks/usePrescriptionEntry";

/* -------------------- MOCKS -------------------- */

vi.mock("@components/common/Toast/useToast", () => {
  const toastMock = {
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
  return { id: "p-1", fullName: "John Doe" } as any;
}

function samplePatientDetails(overrides: Partial<any> = {}) {
  return {
    id: "p-1",
    fullName: "John Doe",
    phone: "+1-555-0100",
    email: "john@example.com",
    address: "221B Baker Street",
    allergies: undefined,
    ...overrides,
  } as any;
}

function sampleDoctor() {
  return { id: "d-99", name: "Dr. Jane Smith" } as any;
}

function sampleMedications() {
  return [
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
  ] as any;
}

/* -------------------- TESTS -------------------- */

describe("usePrescriptionEntry", () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    (validatePatientStep as any).mockReturnValue({ valid: false, errors: ["Invalid patient"] });
    (validateDoctorStep as any).mockReturnValue({ valid: false, errors: ["Invalid doctor"] });
    (validateMedicationStep as any).mockReturnValue({ valid: false, errors: ["Invalid meds"] });
    (validatePrescriptionDraft as any).mockReturnValue({ valid: false, errors: ["Form invalid"] });

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
  (validatePatientStep as any).mockReturnValue({ valid: true, errors: [] });

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
  (validateDoctorStep as any).mockReturnValue({ valid: true, errors: [] });

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
  (validateMedicationStep as any).mockReturnValue({ valid: true, errors: [] });

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
    (getPatientById as any).mockResolvedValueOnce(samplePatientDetails({ allergies: undefined }));
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

    const { toastMock } = ToastModule as unknown as { toastMock: { success: any; error: any } };
    expect(toastMock.error).not.toHaveBeenCalled();
  });

  it("handlePatientSelected shows toast error when details missing", async () => {
    (getPatientById as any).mockResolvedValueOnce(null);
    const { result } = renderHook(() => usePrescriptionEntry());

    await act(async () => {
      await result.current.handlePatientSelected(samplePatientSummary());
    });

    const { toastMock } = ToastModule as unknown as { toastMock: { success: any; error: any } };
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
    (validatePrescriptionDraft as any).mockReturnValueOnce({
      valid: false,
      errors: ["Please fix the issues"],
    });

    const { result } = renderHook(() => usePrescriptionEntry());

    await act(async () => {
      await result.current.handleSubmit();
    });

    const { toastMock } = ToastModule as unknown as { toastMock: { success: any; error: any } };
    expect(toastMock.error).toHaveBeenCalledWith("Validation Error", "Please fix the issues");
    expect(createPrescription).not.toHaveBeenCalled();
    expect(result.current.isSubmitting).toBe(false);
  });

  it("handleSubmit posts when valid, shows success, and resets state", async () => {
    (validatePrescriptionDraft as any).mockReturnValueOnce({ valid: true, errors: [] });
    (createPrescription as any).mockResolvedValueOnce({ id: "rx-100", status: "CREATED" });

    const { result } = renderHook(() => usePrescriptionEntry());

    await act(async () => {
      (getPatientById as any).mockResolvedValueOnce(samplePatientDetails({ allergies: ["Peanuts"] }));
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
    const calledWith = (createPrescription as any).mock.calls[0][0];

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

    const { toastMock } = ToastModule as unknown as { toastMock: { success: any; error: any } };
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
    (validatePrescriptionDraft as any).mockReturnValueOnce({ valid: true, errors: [] });
    (createPrescription as any).mockRejectedValueOnce(new Error("Server down"));

    const { result } = renderHook(() => usePrescriptionEntry());

    await act(async () => {
      (getPatientById as any).mockResolvedValueOnce(samplePatientDetails());
      await result.current.handlePatientSelected(samplePatientSummary());
    });
    act(() => {
      result.current.handleDoctorChange(sampleDoctor());
      result.current.handleMedicationsChange(sampleMedications());
    });

    await act(async () => {
      await result.current.handleSubmit();
    });

    const { toastMock } = ToastModule as unknown as { toastMock: { success: any; error: any } };

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