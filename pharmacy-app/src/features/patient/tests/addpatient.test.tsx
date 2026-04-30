import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

import AddPatientModal from "../components/addpatient";

const formValues = {
  fullName: "John Doe",
  dob: "2000-01-01",
  gender: "Male",
  phone: "+14155552671",
  email: "john@example.com",
  address: "123 Main St",
  allergies: ["Peanuts"],
  insuranceProvider: "ABC Health",
  insurancePolicyId: "POL-123",
};

vi.mock("../components/PatientFormModal", () => ({
  default: ({
    title,
    submitLabel,
    onClose,
    onSubmit,
  }: {
    title: string;
    submitLabel: string;
    onClose: () => void;
    onSubmit: (values: typeof formValues) => void;
  }) => (
    <div>
      <h3>{title}</h3>
      <button aria-label="submit-button" onClick={() => onSubmit(formValues)}>
        {submitLabel}
      </button>
      <button aria-label="close-button" onClick={onClose}>
        Close
      </button>
    </div>
  ),
}));

describe("AddPatientModal", () => {
  const onClose = vi.fn();
  const onSave = vi.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the modal shell", () => {
    render(<AddPatientModal onClose={onClose} onSave={onSave} />);

    expect(screen.getByText("Add New Patient")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /submit-button/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /close-button/i })).toBeInTheDocument();
  });

  it("maps insurance fields into the create patient request", async () => {
    render(<AddPatientModal onClose={onClose} onSave={onSave} />);

    fireEvent.click(screen.getByRole("button", { name: /submit-button/i }));

    expect(onSave).toHaveBeenCalledWith({
      fullName: "John Doe",
      dob: new Date("2000-01-01").toISOString(),
      gender: "Male",
      phone: "+14155552671",
      email: "john@example.com",
      address: "123 Main St",
      allergies: ["Peanuts"],
      insurance: {
        provider: "ABC Health",
        policyId: "POL-123",
      },
    });
  });

  it("closes when the close button is clicked", () => {
    render(<AddPatientModal onClose={onClose} onSave={onSave} />);

    fireEvent.click(screen.getByRole("button", { name: /close-button/i }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
