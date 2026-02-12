// src/features/patient/tests/AddPatientModal.test.tsx
/**
 * Unit tests for AddPatientModal.tsx
 *
 * Tests:
 * 1. Modal renders with correct title and submit button.
 * 2. Submitting the form calls onSave with the correct data.
 * 3. Clicking the close button calls onClose.
 */

import { describe, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import AddPatientModal from "../components/addpatient";

// Mock PatientFormModal to simplify testing
vi.mock("../components/PatientFormModal", () => ({
  default: ({ title, submitLabel, onClose, onSubmit }: any) => (
    <div>
      <h3>{title}</h3>
      <button aria-label="submit-button" onClick={() => onSubmit({
        fullName: "John Doe",
        dob: "2000-01-01",
        gender: "Male",
        phone: "+14155552671",
        email: "john@example.com",
        address: "123 Main St",
        allergies: [],
      })}>
        {submitLabel}
      </button>
      <button aria-label="close-button" onClick={onClose}>X</button>
    </div>
  ),
}));

describe("AddPatientModal", () => {
  let onClose: () => void;
  let onSave: (request: any) => void;

  beforeEach(() => {
    onClose = vi.fn();
    onSave = vi.fn(() => Promise.resolve());
  });

  it("renders modal with correct title and submit button", () => {
    render(<AddPatientModal onClose={onClose} onSave={onSave} />);

    expect(screen.getByText("Add New Patient")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /submit-button/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /close-button/i })).toBeInTheDocument();
  });

  it("calls onSave with correct CreatePatientRequest when submitted", async () => {
    render(<AddPatientModal onClose={onClose} onSave={onSave} />);

    fireEvent.click(screen.getByRole("button", { name: /submit-button/i }));

    expect(onSave).toHaveBeenCalledWith({
      fullName: "John Doe",
      dob: new Date("2000-01-01").toISOString(),
      gender: "Male",
      phone: "+14155552671",
      email: "john@example.com",
      address: "123 Main St",
      allergies: [],
    });
  });

  it("calls onClose when the close button is clicked", () => {
    render(<AddPatientModal onClose={onClose} onSave={onSave} />);

    fireEvent.click(screen.getByRole("button", { name: /close-button/i }));

    expect(onClose).toHaveBeenCalled();
  });
});
