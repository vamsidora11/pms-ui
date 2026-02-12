// calls updatePatient, getPatientDetails, and onSave when submitted 109ms
// calls onClose when close button is clicked

import { vi, describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import UpdatePatientModal from "../components/updatePatient";
import type { PatientDetailsDto } from "@store/patient/patienttype";
import * as patientApi from "@api/patient";
import React from "react";

// Mock PatientFormModal to handle submit
vi.mock("../components/PatientFormModal", () => {
  return {
    default: ({ onSubmit, onClose, initialValues, submitLabel }: any) => (
      <div>
        <button data-testid="modal-close" onClick={onClose}>
          Close
        </button>
        <button
          data-testid="modal-submit"
          onClick={() => onSubmit(initialValues)}
        >
          {submitLabel}
        </button>
      </div>
    ),
  };
});

describe("UpdatePatientModal", () => {
  const mockPatient: PatientDetailsDto = {
    id: "123",
    fullName: "John Doe",
    dob: "1990-01-01T00:00:00.000Z",
    gender: "Male",
    phone: "555-1234",
    email: "john@example.com",
    address: "123 Main St",
    allergies: ["Peanuts"],
  };

  let onClose: vi.Mock;
  let onSave: vi.Mock;

  beforeEach(() => {
    vi.clearAllMocks();
    onClose = vi.fn();
    onSave = vi.fn();
  });

  it("calls updatePatient, getPatientDetails, and onSave when submitted", async () => {
    const user = userEvent.setup();
    const updatedPatient = { ...mockPatient, fullName: "John Smith" };

    vi.spyOn(patientApi, "updatePatient").mockResolvedValue(undefined);
    vi.spyOn(patientApi, "getPatientDetails").mockResolvedValue(updatedPatient);

    render(
      <UpdatePatientModal patient={mockPatient} onClose={onClose} onSave={onSave} />
    );

    const submitButton = screen.getByTestId("modal-submit");
    await user.click(submitButton);

    expect(patientApi.updatePatient).toHaveBeenCalledWith(mockPatient.id, {
      fullName: mockPatient.fullName,
      dob: mockPatient.dob,
      gender: mockPatient.gender,
      phone: mockPatient.phone,
      email: mockPatient.email,
      address: mockPatient.address,
      allergies: mockPatient.allergies,
    });

    expect(patientApi.getPatientDetails).toHaveBeenCalledWith(mockPatient.id);
    expect(onSave).toHaveBeenCalledWith(updatedPatient);
  });

  it("calls onClose when close button is clicked", async () => {
    const user = userEvent.setup();

    render(
      <UpdatePatientModal patient={mockPatient} onClose={onClose} onSave={onSave} />
    );

    const closeButton = screen.getByTestId("modal-close");
    await user.click(closeButton);

    expect(onClose).toHaveBeenCalled();
  });
});
