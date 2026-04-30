import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

vi.mock("lucide-react", () => ({
  X: () => <span data-testid="icon-x" />,
}));

vi.mock("@api/catalogs", () => ({
  searchAllergies: vi.fn(),
}));

vi.mock("@components/common/Input/Input", () => ({
  default: ({
    label,
    value,
    onChange,
    error,
  }: {
    label?: React.ReactNode;
    value: string;
    onChange: (value: string) => void;
    error?: string;
  }) => {
    const labelText =
      typeof label === "string"
        ? label
        : (label as { props?: { text?: string } } | undefined)?.props?.text ?? "input";

    return (
      <div>
        <input
          aria-label={labelText}
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
        {error ? <span>{error}</span> : null}
      </div>
    );
  },
}));

vi.mock("@components/common/Dropdown/Dropdown", () => ({
  default: ({
    label,
    value,
    onChange,
    options,
  }: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    options: string[];
  }) => (
    <select
      aria-label={label}
      value={value}
      onChange={(event) => onChange(event.target.value)}
    >
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  ),
}));

vi.mock("@components/common/PhoneInput/PhoneInput", () => ({
  default: ({
    value,
    onChange,
  }: {
    value: string;
    onChange: (value: string) => void;
  }) => (
    <input
      aria-label="Phone"
      value={value}
      onChange={(event) => onChange(event.target.value)}
    />
  ),
}));

vi.mock("react-datepicker", () => ({
  default: ({
    onChange,
  }: {
    onChange: (date: Date | null) => void;
  }) => (
    <button type="button" onClick={() => onChange(new Date("2000-01-01"))}>
      Pick Date
    </button>
  ),
}));

vi.mock("../components/AllergySelector", () => ({
  default: ({
    query,
    onQueryChange,
    onAdd,
    onRemove,
    selected,
  }: {
    query: string;
    onQueryChange: (value: string) => void;
    onAdd: (value: string) => void;
    onRemove: (value: string) => void;
    selected: string[];
  }) => (
    <div>
      <input
        aria-label="Allergy query"
        value={query}
        onChange={(event) => onQueryChange(event.target.value)}
      />
      <button type="button" onClick={() => onAdd("Peanuts")}>
        Add Allergy
      </button>
      <button type="button" onClick={() => onRemove("Peanuts")}>
        Remove Allergy
      </button>
      <span data-testid="selected-allergies">{selected.join(",")}</span>
    </div>
  ),
}));

type PatientFormValues = {
  fullName: string;
  dob: string;
  gender: string;
  phone: string;
  email: string;
  address: string;
  allergies: string[];
  insuranceProvider: string;
  insurancePolicyId: string;
  newAllergy: string;
};

type UsePatientFormReturn = {
  form: PatientFormValues;
  errors: Partial<Record<keyof PatientFormValues, string>>;
  warnings: Partial<Record<keyof PatientFormValues, string>>;
  formError: string;
  submitting: boolean;
  updateField: (field: keyof PatientFormValues, value: string) => void;
  addAllergy: (value: string) => void;
  removeAllergy: (value: string) => void;
  submit: () => void;
  setFormError: (value: string) => void;
};

const usePatientFormMock = vi.fn<
  (args: {
    initialValues: Omit<PatientFormValues, "newAllergy">;
    onSubmit: (values: Omit<PatientFormValues, "newAllergy">) => unknown;
    onClose: () => void;
    closeOnSuccess: boolean;
  }) => UsePatientFormReturn
>();

vi.mock("@patient/hooks/usePatientForm", () => ({
  usePatientForm: (...args: Parameters<typeof usePatientFormMock>) =>
    usePatientFormMock(...args),
}));

import PatientFormModal from "../components/PatientFormModal";

const initialValues = {
  fullName: "John Doe",
  dob: "1990-01-01",
  gender: "Male",
  phone: "+14155550101",
  email: "john@example.com",
  address: "123 Street",
  allergies: ["Peanuts"],
  insuranceProvider: "ABC Health",
  insurancePolicyId: "POL-123",
};

describe("PatientFormModal", () => {
  const onClose = vi.fn();
  const onSubmit = vi.fn();
  const updateField = vi.fn();
  const addAllergy = vi.fn();
  const removeAllergy = vi.fn();
  const submit = vi.fn();
  const setFormError = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    usePatientFormMock.mockReturnValue({
      form: { ...initialValues, newAllergy: "" },
      errors: {},
      warnings: {},
      formError: "",
      submitting: false,
      updateField,
      addAllergy,
      removeAllergy,
      submit,
      setFormError,
    });
    document.body.style.overflow = "";
  });

  afterEach(() => {
    cleanup();
    document.body.style.overflow = "";
  });

  const renderModal = (
    overrides: Partial<Parameters<typeof PatientFormModal>[0]> = {},
  ) =>
    render(
      <PatientFormModal
        title="Patient"
        submitLabel="Save"
        initialValues={initialValues}
        onClose={onClose}
        onSubmit={onSubmit}
        {...overrides}
      />,
    );

  it("wires the form hook with the modal props", () => {
    renderModal({ closeOnSuccess: false });

    expect(usePatientFormMock).toHaveBeenCalledWith({
      initialValues,
      onSubmit,
      onClose,
      closeOnSuccess: false,
    });
  });

  it("locks body scroll while mounted", () => {
    const { unmount } = renderModal();

    expect(document.body.style.overflow).toBe("hidden");
    unmount();
    expect(document.body.style.overflow).toBe("");
  });

  it("wires insurance and allergy field updates", () => {
    renderModal();

    fireEvent.change(screen.getByLabelText("Insurance Provider"), {
      target: { value: "XYZ Health" },
    });
    fireEvent.change(screen.getByLabelText("Policy ID"), {
      target: { value: "POL-999" },
    });
    fireEvent.change(screen.getByLabelText("Allergy query"), {
      target: { value: "Dust" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Add Allergy/i }));
    fireEvent.click(screen.getByRole("button", { name: /Remove Allergy/i }));

    expect(updateField).toHaveBeenCalledWith("insuranceProvider", "XYZ Health");
    expect(updateField).toHaveBeenCalledWith("insurancePolicyId", "POL-999");
    expect(updateField).toHaveBeenCalledWith("newAllergy", "Dust");
    expect(addAllergy).toHaveBeenCalledWith("Peanuts");
    expect(removeAllergy).toHaveBeenCalledWith("Peanuts");
    expect(screen.getByTestId("selected-allergies")).toHaveTextContent("Peanuts");
  });

  it("uses a read-only gender input when showGender is false", () => {
    renderModal({ showGender: false });

    expect(screen.queryByLabelText("Gender", { selector: "select" })).not.toBeInTheDocument();
    expect(screen.getByLabelText("Gender")).toHaveValue("Male");
  });

  it("uses the hook submit handler and clears form error on cancel", () => {
    renderModal();

    fireEvent.click(screen.getByRole("button", { name: /Save/i }));
    fireEvent.click(screen.getByRole("button", { name: /Cancel/i }));

    expect(submit).toHaveBeenCalledTimes(1);
    expect(setFormError).toHaveBeenCalledWith("");
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
