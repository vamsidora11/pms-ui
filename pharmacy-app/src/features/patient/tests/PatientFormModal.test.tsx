// src/features/patients/tests/PatientFormModal.test.tsx
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";

// 🔒 Guard mocks for infra we don't want to execute in unit tests
vi.mock("store", () => ({}));
vi.mock("redux-persist", () => ({
  persistReducer: (_cfg: unknown, reducer: unknown) => reducer,
  persistStore: vi.fn(),
}));

// 🧩 Mock lucide-react icons to avoid SVG complexity
vi.mock("lucide-react", () => ({
  X: () => <span data-testid="icon-x" />,
}));

// 🧪 Mock API used by AllergySelector prop
const searchAllergiesMock = vi.fn<(q: string) => Promise<string[]> | string[]>();
vi.mock("@api/catalogs", () => ({
  searchAllergies: (q: string) => searchAllergiesMock(q),
}));

/**
 * 🧱 Mock child components (Input, Dropdown, AppPhoneInput, AllergySelector)
 * We render simple elements that call the provided onChange/onAdd/onRemove
 * to test PatientFormModal's wiring without depending on child implementations.
 */

// Input mock
vi.mock("@components/common/Input/Input", () => ({
  default: (props: {
    label?: React.ReactNode;
    type?: string;
    value: string;
    onChange: (v: string) => void;
    error?: string | null;
  }) => {
    let labelText = "input";
    if (typeof props.label === "string") {
      labelText = props.label;
    } else if (props.label && typeof props.label === "object") {
      const maybeLabel = props.label as { props?: { text?: string } };
      if (typeof maybeLabel.props?.text === "string") {
        labelText = maybeLabel.props.text;
      }
    }
    const inputType = props.type ?? "text";
    return (
      <div data-testid={`mock-input-${labelText}`}>
        {props.label ? <div>{labelText}</div> : null}
        <input
          placeholder={labelText}
          type={inputType}
          value={props.value}
          onChange={(e) => props.onChange((e.target as HTMLInputElement).value)}
        />
        {props.error ? <div data-testid={`error-${labelText}`}>{props.error}</div> : null}
      </div>
    );
  },
}));

// Dropdown mock
vi.mock("@components/common/Dropdown/Dropdown", () => ({
  default: (props: {
    label?: string;
    value: string;
    onChange: (v: string) => void;
    options: string[];
  }) => {
    const id = props.label ?? "Dropdown";
    return (
      <div data-testid={`mock-dropdown-${id}`}>
        {props.label ? <div>{props.label}</div> : null}
        <select
          aria-label={id}
          value={props.value}
          onChange={(e) => props.onChange((e.target as HTMLSelectElement).value)}
        >
          {props.options.map((opt) => (
            <option value={opt} key={opt}>
              {opt}
            </option>
          ))}
        </select>
      </div>
    );
  },
}));

// Phone input mock
vi.mock("@components/common/PhoneInput/PhoneInput", () => ({
  default: (props: {
    label?: React.ReactNode;
    value: string;
    onChange: (v: string) => void;
    error?: string | null;
    warning?: string | null;
    defaultCountry?: string;
  }) => {
    let labelText = "Phone";
    if (typeof props.label === "string") {
      labelText = props.label;
    } else if (props.label && typeof props.label === "object") {
      const maybeLabel = props.label as { props?: { text?: string } };
      if (typeof maybeLabel.props?.text === "string") {
        labelText = maybeLabel.props.text;
      }
    }
    return (
      <div data-testid="mock-phone-input">
        {props.label ? <div>{labelText}</div> : null}
        <input
          placeholder={labelText}
          value={props.value}
          onChange={(e) => props.onChange((e.target as HTMLInputElement).value)}
        />
        {props.error ? <div data-testid="phone-error">{props.error}</div> : null}
        {props.warning ? <div data-testid="phone-warning">{props.warning}</div> : null}
      </div>
    );
  },
}));

// AllergySelector mock
vi.mock("../components/AllergySelector", () => ({
  default: (props: {
    query: string;
    onQueryChange: (v: string) => void;
    selected: string[];
    onAdd: (v: string) => void;
    onRemove: (v: string) => void;
    searchFn: (q: string) => Promise<string[]> | string[];
    minChars?: number;
    debounceMs?: number;
  }) => (
    <div data-testid="mock-allergy-selector">
      <input
        placeholder="Allergy query"
        value={props.query}
        onChange={(e) => props.onQueryChange((e.target as HTMLInputElement).value)}
      />
      <button type="button" onClick={() => props.onAdd("Penicillin")}>
        Add Allergy
      </button>
      <button type="button" onClick={() => props.onRemove("Penicillin")}>
        Remove Allergy
      </button>
      <div data-testid="selected-allergies">{props.selected.join(",")}</div>
    </div>
  ),
}));

// 🎣 Types and hook mock
type PatientFormValues = {
  fullName: string;
  dob: string; // yyyy-mm-dd
  gender: string;
  phone: string;
  email: string;
  address: string;
  allergies: string[];
  newAllergy: string;
};

interface UsePatientFormReturn {
  form: PatientFormValues;
  errors: Partial<Record<keyof PatientFormValues, string | null>>;
  warnings: Partial<Record<keyof PatientFormValues, string | null>>;
  formError: string;
  submitting: boolean;
  updateField: <K extends keyof PatientFormValues>(k: K, v: PatientFormValues[K]) => void;
  addAllergy: (v: string) => void;
  removeAllergy: (v: string) => void;
  submit: () => void | Promise<void>;
  setFormError: (msg: string) => void;
}

// ✅ Correct vi.fn generics: single function signature (Vitest typing)
const usePatientFormMock = vi.fn<
  (args: {
    initialValues: PatientFormValues;
    onSubmit: (values: PatientFormValues) => unknown;
    onClose: () => void;
    closeOnSuccess: boolean;
  }) => UsePatientFormReturn
>();

vi.mock("../hooks/usePatientForm", () => ({
  usePatientForm: (...args: unknown[]) => usePatientFormMock(...(args as Parameters<typeof usePatientFormMock>)),
}));

// 🧪 SUT
import PatientFormModal, { RequiredLabel } from "../components/PatientFormModal";

// ℹ️ Default props for tests
const defaultInitialValues: PatientFormValues = {
  fullName: "John Doe",
  dob: "1990-01-01",
  gender: "Male",
  phone: "",
  email: "",
  address: "",
  allergies: [],
  newAllergy: "",
};

describe("PatientFormModal", () => {
  const onClose = vi.fn();
  const onSubmit = vi.fn();

  const updateField = vi.fn();
  const addAllergy = vi.fn();
  const removeAllergy = vi.fn();
  const submit = vi.fn();
  const setFormError = vi.fn();

  const baseHookReturn: UsePatientFormReturn = {
    form: { ...defaultInitialValues },
    errors: {},
    warnings: {},
    formError: "",
    submitting: false,
    updateField,
    addAllergy,
    removeAllergy,
    submit,
    setFormError,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    usePatientFormMock.mockReturnValue({ ...baseHookReturn });
    // Ensure body style is clean before each (for ESC/body-lock tests)
    document.body.style.overflow = "";
  });

  afterEach(() => {
    cleanup();
    document.body.style.overflow = "";
  });

  const renderModal = (overrides?: Partial<Parameters<typeof PatientFormModal>[0]>) =>
    render(
      <PatientFormModal
        title="New Patient"
        submitLabel="Save"
        initialValues={defaultInitialValues}
        onClose={onClose}
        onSubmit={onSubmit}
        closeOnSuccess={true}
        {...overrides}
      />
    );

  it("renders title and buttons", () => {
    renderModal();

    expect(screen.getByText("New Patient")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Cancel/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Save/i })).toBeInTheDocument();
  });

  it("wires usePatientForm with correct arguments", () => {
    renderModal({ closeOnSuccess: false });

    expect(usePatientFormMock).toHaveBeenCalledWith({
      initialValues: defaultInitialValues,
      onSubmit,
      onClose,
      closeOnSuccess: false,
    });
  });

  it("locks body scroll on mount and restores on unmount", () => {
    const { unmount } = renderModal();
    expect(document.body.style.overflow).toBe("hidden");
    unmount();
    expect(document.body.style.overflow).toBe("");
  });

  it("clicking Cancel clears formError and calls onClose", () => {
    renderModal();

    fireEvent.click(screen.getByRole("button", { name: /Cancel/i }));

    expect(setFormError).toHaveBeenCalledWith("");
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("Escape key closes the modal (calls onClose)", () => {
    renderModal();

    fireEvent.keyDown(globalThis as unknown as Window, { key: "Escape" });

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("submit button calls submit from hook", () => {
    renderModal();

    fireEvent.click(screen.getByRole("button", { name: /Save/i }));

    expect(submit).toHaveBeenCalledTimes(1);
  });

  it("shows loading state when submitting=true", () => {
    usePatientFormMock.mockReturnValue({
      ...baseHookReturn,
      submitting: true,
    });

    renderModal();

    const submitBtn = screen.getByRole("button", { name: /Saving.../i });
    expect(submitBtn).toBeDisabled();
  });

  it("renders form-level error when formError is set", () => {
    usePatientFormMock.mockReturnValue({
      ...baseHookReturn,
      formError: "Validation failed",
    });

    renderModal();

    expect(screen.getByText("Validation failed")).toBeInTheDocument();
  });

  it("updates fields via updateField for Full Name, Phone, and Address", () => {
    renderModal();

    // Full Name (Input mock uses label text as placeholder)
    const fullNameInput = screen.getByPlaceholderText("Full Name");
    fireEvent.change(fullNameInput, { target: { value: "Jane Doe" } });

    // Phone
    const phoneInput = screen.getByPlaceholderText("Phone");
    fireEvent.change(phoneInput, { target: { value: "+919999999999" } });

    // Address
    const addressInput = screen.getByPlaceholderText("Address");
    fireEvent.change(addressInput, { target: { value: "123 Main St" } });

    // Assert updateField calls
    expect(updateField).toHaveBeenCalledWith("fullName", "Jane Doe");
    expect(updateField).toHaveBeenCalledWith("phone", "+919999999999");
    expect(updateField).toHaveBeenCalledWith("address", "123 Main St");
  });

  it("wires AllergySelector: query change, add, remove", () => {
    usePatientFormMock.mockReturnValue({
      ...baseHookReturn,
      form: {
        ...baseHookReturn.form,
        allergies: ["Peanuts"],
        newAllergy: "",
      },
    });

    renderModal();

    const queryInput = screen.getByPlaceholderText("Allergy query");
    fireEvent.change(queryInput, { target: { value: "Pen" } });
    expect(updateField).toHaveBeenCalledWith("newAllergy", "Pen");

    fireEvent.click(screen.getByText(/Add Allergy/i));
    expect(addAllergy).toHaveBeenCalledWith("Penicillin");

    fireEvent.click(screen.getByText(/Remove Allergy/i));
    expect(removeAllergy).toHaveBeenCalledWith("Penicillin");

    // ensure selected allergies are shown by the mock
    expect(screen.getByTestId("selected-allergies").textContent).toContain("Peanuts");
  });

  it("shows warnings and errors if provided by hook for specific fields", () => {
    usePatientFormMock.mockReturnValue({
      ...baseHookReturn,
      errors: { email: "Email invalid" },
      warnings: { fullName: "Looks too short" },
    });

    renderModal();

    // Warning for Full Name is rendered by the component as <p> under the field
    expect(screen.getByText("Looks too short")).toBeInTheDocument();
    // Error for Email is rendered by Input mock's error slot
    expect(screen.getByText("Email invalid")).toBeInTheDocument();
  });

  it("renders RequiredLabel correctly (smoke)", () => {
    render(<RequiredLabel text="Test Field" />);
    expect(screen.getByText(/Test Field/i)).toBeInTheDocument();
    expect(screen.getByText("*")).toBeInTheDocument();
  });
});
