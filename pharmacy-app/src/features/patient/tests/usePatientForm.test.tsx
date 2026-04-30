import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { usePatientForm, type PatientFormValues } from "../hooks/usePatientForm";

vi.mock("@patient/utils/patientFormRules", () => ({
  applyPatientRule: vi.fn((_: string, raw: string) => ({
    value: raw.trim(),
    warning: "",
  })),
  validatePatientForm: vi.fn(() => ({})),
}));

import {
  applyPatientRule,
  validatePatientForm,
} from "@patient/utils/patientFormRules";

const makeInitialValues = (
  partial: Partial<PatientFormValues> = {},
): PatientFormValues => ({
  fullName: "John Doe",
  dob: "1990-01-01",
  gender: "Male",
  phone: "+14155550101",
  email: "john@example.com",
  address: "123 Street",
  allergies: ["Penicillin"],
  insuranceProvider: "",
  insurancePolicyId: "",
  ...partial,
});

describe("usePatientForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(applyPatientRule).mockImplementation((_: string, raw: string) => ({
      value: raw.trim(),
      warning: "",
    }));
    vi.mocked(validatePatientForm).mockReturnValue(
      {} as ReturnType<typeof validatePatientForm>,
    );
  });

  it("initializes the form with insurance fields", () => {
    const initialValues = makeInitialValues({
      insuranceProvider: "ABC Health",
      insurancePolicyId: "POL-123",
    });

    const { result } = renderHook(() =>
      usePatientForm({
        initialValues,
        onSubmit: vi.fn(),
        onClose: vi.fn(),
      }),
    );

    expect(result.current.form).toEqual({
      ...initialValues,
      newAllergy: "",
    });
  });

  it("applies validation rules to validated fields and stores warnings", () => {
    vi.mocked(applyPatientRule).mockImplementationOnce(() => ({
      value: "JANE DOE",
      warning: "Looks shouty",
    }));

    const { result } = renderHook(() =>
      usePatientForm({
        initialValues: makeInitialValues(),
        onSubmit: vi.fn(),
        onClose: vi.fn(),
      }),
    );

    act(() => {
      result.current.updateField("fullName", "  Jane Doe  ");
    });

    expect(applyPatientRule).toHaveBeenCalledWith("fullName", "  Jane Doe  ", {
      fullName: "John Doe",
      dob: "1990-01-01",
      phone: "+14155550101",
      email: "john@example.com",
      address: "123 Street",
    });
    expect(result.current.form.fullName).toBe("JANE DOE");
    expect(result.current.warnings.fullName).toBe("Looks shouty");
  });

  it("stores raw values for non-validated insurance fields", () => {
    const { result } = renderHook(() =>
      usePatientForm({
        initialValues: makeInitialValues(),
        onSubmit: vi.fn(),
        onClose: vi.fn(),
      }),
    );

    act(() => {
      result.current.updateField("insuranceProvider", "  ABC Health  ");
    });

    expect(result.current.form.insuranceProvider).toBe("  ABC Health  ");
  });

  it("normalizes the submit payload and closes on success", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const onClose = vi.fn();

    const { result } = renderHook(() =>
      usePatientForm({
        initialValues: makeInitialValues({
          fullName: "  John Doe  ",
          phone: "  +14155550101  ",
          email: "  john@example.com  ",
          address: "  123 Street  ",
          insuranceProvider: "  ABC Health  ",
          insurancePolicyId: "  POL-123  ",
        }),
        onSubmit,
        onClose,
      }),
    );

    await act(async () => {
      await result.current.submit();
    });

    expect(onSubmit).toHaveBeenCalledWith({
      fullName: "John Doe",
      dob: "1990-01-01",
      gender: "Male",
      phone: "+14155550101",
      email: "john@example.com",
      address: "123 Street",
      allergies: ["Penicillin"],
      insuranceProvider: "ABC Health",
      insurancePolicyId: "POL-123",
    });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("blocks submit when only one insurance field is provided", async () => {
    const onSubmit = vi.fn();

    const { result } = renderHook(() =>
      usePatientForm({
        initialValues: makeInitialValues({
          insuranceProvider: "ABC Health",
          insurancePolicyId: "",
        }),
        onSubmit,
        onClose: vi.fn(),
      }),
    );

    await act(async () => {
      await result.current.submit();
    });

    expect(onSubmit).not.toHaveBeenCalled();
    expect(result.current.formError).toBe(
      "Insurance provider and policy ID must both be entered.",
    );
  });

  it("surfaces validation errors before submit", async () => {
    vi.mocked(validatePatientForm).mockReturnValueOnce({
      fullName: "Full name is required",
    } as ReturnType<typeof validatePatientForm>);

    const { result } = renderHook(() =>
      usePatientForm({
        initialValues: makeInitialValues({ fullName: "" }),
        onSubmit: vi.fn(),
        onClose: vi.fn(),
      }),
    );

    await act(async () => {
      await result.current.submit();
    });

    expect(result.current.errors.fullName).toBe("Full name is required");
    expect(result.current.formError).toBe(
      "Please fix the errors below before submitting details.",
    );
  });
});
