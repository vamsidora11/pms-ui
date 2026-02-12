// initializes form state with initialValues and newAllergy as empty string 
// updateField applies applyPatientRule for validated fields and stores warnings 
// updateField sets raw value for non-validated fields (e.g., gender) without calling applyPatientRule 
// addAllergy trims, adds when non-empty, clears newAllergy, avoids duplicates case-insensitively 
// removeAllergy removes allergy case-insensitively 
// submit sets field errors and formError when validatePatientForm returns errors; does not call onSubmit 
// submit calls onSubmit with trimmed payload, toggles submitting, and calls onClose when closeOnSuccess=true 
// does not call onClose when closeOnSuccess=false 
// submit handles onSubmit rejection by setting formError and resetting submitting        
// clears field-specific error and form-level error when updating a field after a failed validation 
// sets warnings only for validated fields and not for non-validated fields 

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { usePatientForm, type PatientFormValues } from "../hooks/usePatientForm";

// Mock the validation utilities the hook depends on.
// If you want to test real rules, remove this vi.mock and import real functions.
vi.mock("../utils/patientFormRules", () => {
  return {
    applyPatientRule: vi.fn(
      // Default behavior: trim the value and return no warning.
      (field: string, raw: string) => ({ value: raw.trim(), warning: "" })
    ),
    validatePatientForm: vi.fn(() => ({})),
  };
});

import {
  applyPatientRule,
  validatePatientForm,
} from "../utils/patientFormRules";

// Helpers
const makeInitialValues = (
  partial: Partial<PatientFormValues> = {}
): PatientFormValues => ({
  fullName: "John Doe",
  dob: "1990-01-01",
  gender: "Male",
  phone: "9999999999",
  email: "john@example.com",
  address: "123 Street",
  allergies: ["Penicillin"],
  ...partial,
});

function deferred<T = void>() {
  let resolve!: (v: T | PromiseLike<T>) => void;
  let reject!: (e?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe("usePatientForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default mocks (can be overridden per test)
    (applyPatientRule as unknown as vi.Mock).mockImplementation(
      (_field: string, raw: string) => ({ value: raw.trim(), warning: "" })
    );
    (validatePatientForm as unknown as vi.Mock).mockReturnValue({});
  });

  it("initializes form state with initialValues and newAllergy as empty string", () => {
    const initialValues = makeInitialValues();
    const onSubmit = vi.fn();
    const onClose = vi.fn();

    const { result } = renderHook(() =>
      usePatientForm({ initialValues, onSubmit, onClose })
    );

    expect(result.current.form).toEqual({
      ...initialValues,
      newAllergy: "",
    });
    expect(result.current.errors).toEqual({});
    expect(result.current.warnings).toEqual({});
    expect(result.current.formError).toBe("");
    expect(result.current.submitting).toBe(false);
  });

  it("updateField applies applyPatientRule for validated fields and stores warnings", () => {
    const initialValues = makeInitialValues();
    const onSubmit = vi.fn();
    const onClose = vi.fn();

    (applyPatientRule as unknown as vi.Mock).mockImplementationOnce(
      (_f: string, raw: string) => ({
        value: raw.trim().toUpperCase(),
        warning: "Looks SHOUTY",
      })
    );

    const { result } = renderHook(() =>
      usePatientForm({ initialValues, onSubmit, onClose })
    );

    act(() => {
      result.current.updateField("fullName", "  john doe  ");
    });

    expect(applyPatientRule).toHaveBeenCalledWith("fullName", "  john doe  ", {
      fullName: initialValues.fullName,
      dob: initialValues.dob,
      phone: initialValues.phone,
      email: initialValues.email,
      address: initialValues.address,
    });

    expect(result.current.form.fullName).toBe("JOHN DOE");
    expect(result.current.warnings.fullName).toBe("Looks SHOUTY");
    // errors for that field cleared on edit
    expect(result.current.errors.fullName).toBe("");
    // form-level error cleared on edit
    expect(result.current.formError).toBe("");
  });

  it("updateField sets raw value for non-validated fields (e.g., gender) without calling applyPatientRule", () => {
    const initialValues = makeInitialValues();
    const onSubmit = vi.fn();
    const onClose = vi.fn();

    const { result } = renderHook(() =>
      usePatientForm({ initialValues, onSubmit, onClose })
    );

    act(() => {
      result.current.updateField("gender", "  Male  ");
    });

    // Not validated => should not invoke applyPatientRule for 'gender'
    expect(applyPatientRule).not.toHaveBeenCalledWith(
      "gender",
      expect.anything(),
      expect.anything()
    );
    // Non-validated stores raw (no trim in hook)
    expect(result.current.form.gender).toBe("  Male  ");
  });

  it("addAllergy trims, adds when non-empty, clears newAllergy, avoids duplicates case-insensitively", () => {
    const initialValues = makeInitialValues({ allergies: ["Penicillin"] });
    const onSubmit = vi.fn();
    const onClose = vi.fn();

    const { result } = renderHook(() =>
      usePatientForm({ initialValues, onSubmit, onClose })
    );

    // Empty/whitespace -> ignored
    act(() => {
      result.current.addAllergy("   ");
    });
    expect(result.current.form.allergies).toEqual(["Penicillin"]);

    // Adds trimmed
    act(() => {
      result.current.addAllergy("  Ibuprofen ");
    });
    expect(result.current.form.allergies).toEqual(["Penicillin", "Ibuprofen"]);
    expect(result.current.form.newAllergy).toBe("");

    // Duplicate (case-insensitive) -> ignored
    act(() => {
      result.current.addAllergy("ibuprofen");
      result.current.addAllergy("PENICILLIN");
    });
    expect(result.current.form.allergies).toEqual(["Penicillin", "Ibuprofen"]);
  });

  it("removeAllergy removes allergy case-insensitively", () => {
    const initialValues = makeInitialValues({
      allergies: ["Penicillin", "Ibuprofen"],
    });
    const onSubmit = vi.fn();
    const onClose = vi.fn();

    const { result } = renderHook(() =>
      usePatientForm({ initialValues, onSubmit, onClose })
    );

    act(() => {
      result.current.removeAllergy("PENICILLIN");
    });

    expect(result.current.form.allergies).toEqual(["Ibuprofen"]);
  });

  it("submit sets field errors and formError when validatePatientForm returns errors; does not call onSubmit", async () => {
    const initialValues = makeInitialValues({ fullName: "" });
    const onSubmit = vi.fn();
    const onClose = vi.fn();

    (validatePatientForm as unknown as vi.Mock).mockReturnValue({
      fullName: "Full name is required",
    });

    const { result } = renderHook(() =>
      usePatientForm({ initialValues, onSubmit, onClose })
    );

    await act(async () => {
      await result.current.submit();
    });

    expect(validatePatientForm).toHaveBeenCalledWith({
      fullName: "",
      dob: "1990-01-01",
      phone: "9999999999",
      email: "john@example.com",
      address: "123 Street",
    });

    expect(result.current.errors.fullName).toBe("Full name is required");
    expect(result.current.formError).toBe(
      "Please fix the errors below before submitting details."
    );
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("submit calls onSubmit with trimmed payload, toggles submitting, and calls onClose when closeOnSuccess=true", async () => {
    const initialValues = makeInitialValues({
      fullName: "  John Doe  ",
      phone: "  9999999999  ",
      email: "  john@example.com  ",
      address: "  123 Street   ",
      allergies: [" Penicillin "], // allergies passed through as-is
    });

    // Use deferred promise so submitting stays true until we resolve
    const d = deferred<void>();
    const onSubmit = vi.fn().mockReturnValue(d.promise);
    const onClose = vi.fn();

    const { result } = renderHook(() =>
      usePatientForm({
        initialValues,
        onSubmit,
        onClose,
        closeOnSuccess: true,
      })
    );

    let submitPromise!: Promise<void>;
    await act(async () => {
      submitPromise = result.current.submit();
      // Allow React to flush setSubmitting(true)
      await Promise.resolve();
    });

    // Now onSubmit is still pending -> submitting should be true
    expect(result.current.submitting).toBe(true);

    // Complete the submit flow
    await act(async () => {
      d.resolve();
      await submitPromise;
    });

    // Ensure payload had trimmed string fields
    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledWith({
      fullName: "John Doe",
      dob: "1990-01-01",
      gender: "Male",
      phone: "9999999999",
      email: "john@example.com",
      address: "123 Street",
      allergies: [" Penicillin "], // not trimmed by hook
    });

    expect(result.current.submitting).toBe(false);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("does not call onClose when closeOnSuccess=false", async () => {
    const initialValues = makeInitialValues();
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const onClose = vi.fn();

    const { result } = renderHook(() =>
      usePatientForm({
        initialValues,
        onSubmit,
        onClose,
        closeOnSuccess: false,
      })
    );

    await act(async () => {
      await result.current.submit();
    });

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onClose).not.toHaveBeenCalled();
  });

  it("submit handles onSubmit rejection by setting formError and resetting submitting", async () => {
    const initialValues = makeInitialValues();
    const onSubmit = vi.fn().mockRejectedValue(new Error("Server down"));
    const onClose = vi.fn();

    const { result } = renderHook(() =>
      usePatientForm({ initialValues, onSubmit, onClose })
    );

    await act(async () => {
      await result.current.submit();
    });

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(result.current.formError).toBe("Server down");
    expect(result.current.submitting).toBe(false);
    expect(onClose).not.toHaveBeenCalled();
  });

  it("clears field-specific error and form-level error when updating a field after a failed validation", async () => {
    const initialValues = makeInitialValues({ fullName: "" });
    const onSubmit = vi.fn();
    const onClose = vi.fn();

    // First, cause validation errors
    (validatePatientForm as unknown as vi.Mock).mockReturnValueOnce({
      fullName: "Full name is required",
    });

    const { result } = renderHook(() =>
      usePatientForm({ initialValues, onSubmit, onClose })
    );

    await act(async () => {
      await result.current.submit();
    });

    expect(result.current.errors.fullName).toBe("Full name is required");
    expect(result.current.formError).toBe(
      "Please fix the errors below before submitting details."
    );

    // Now update the field, which should clear the error(s)
    act(() => {
      result.current.updateField("fullName", "  Jane  ");
    });

    expect(result.current.errors.fullName).toBe(""); // field error cleared
    expect(result.current.formError).toBe(""); // form-level error cleared
    expect(result.current.form.fullName).toBe("Jane"); // trimmed via applyPatientRule mock
  });

  it("sets warnings only for validated fields and not for non-validated fields", () => {
    const initialValues = makeInitialValues();
    const onSubmit = vi.fn();
    const onClose = vi.fn();

    // First call: validated field warning
    (applyPatientRule as unknown as vi.Mock).mockImplementationOnce(
      (_f: string, raw: string) => ({
        value: raw.trim(),
        warning: "Be cautious",
      })
    );

    const { result } = renderHook(() =>
      usePatientForm({ initialValues, onSubmit, onClose })
    );

    // Validated field -> warning stored
    act(() => {
      result.current.updateField("email", "  a@b.com  ");
    });
    expect(result.current.warnings.email).toBe("Be cautious");

    // Non-validated field -> warning should not be set
    act(() => {
      result.current.updateField("newAllergy", "  Latex  ");
    });
    expect(result.current.warnings.newAllergy).toBeUndefined();
  });
});