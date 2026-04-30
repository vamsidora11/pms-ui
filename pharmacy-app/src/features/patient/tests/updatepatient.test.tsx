import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import UpdatePatientModal from "../components/updatePatient";
import type { PatientDetailsDto } from "@patient/types/patienttype";
import * as patientApi from "@api/patient";

const toast = {
  error: vi.fn(),
  success: vi.fn(),
  warning: vi.fn(),
  info: vi.fn(),
  showToast: vi.fn(),
};

vi.mock("@components/common/Toast/useToast", () => ({
  useToast: () => toast,
}));

vi.mock("../components/PatientFormModal", () => ({
  default: ({
    onSubmit,
    onClose,
    initialValues,
    submitLabel,
    showGender,
  }: {
    onSubmit: (values: Record<string, unknown>) => void;
    onClose: () => void;
    initialValues: Record<string, unknown>;
    submitLabel: string;
    showGender?: boolean;
  }) => (
    <div>
      <div data-testid="show-gender">{String(showGender)}</div>
      <div data-testid="insurance-provider">
        {String(initialValues.insuranceProvider ?? "")}
      </div>
      <div data-testid="insurance-policy-id">
        {String(initialValues.insurancePolicyId ?? "")}
      </div>
      <button data-testid="modal-close" onClick={onClose}>
        Close
      </button>
      <button data-testid="modal-submit" onClick={() => onSubmit(initialValues)}>
        {submitLabel}
      </button>
    </div>
  ),
}));

describe("UpdatePatientModal", () => {
  const patient: PatientDetailsDto = {
    id: "p-1",
    fullName: "John Doe",
    dob: "1990-01-01T00:00:00.000Z",
    gender: "Male",
    phone: "+14155550101",
    email: "john@example.com",
    address: "123 Main St",
    allergies: ["Peanuts"],
    insurance: {
      provider: "ABC Health",
      policyId: "POL-123",
    },
  };

  const onClose = vi.fn();
  const onSave = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("initializes the shared form with insurance fields and hides gender edits", () => {
    render(<UpdatePatientModal patient={patient} onClose={onClose} onSave={onSave} />);

    expect(screen.getByTestId("show-gender")).toHaveTextContent("false");
    expect(screen.getByTestId("insurance-provider")).toHaveTextContent("ABC Health");
    expect(screen.getByTestId("insurance-policy-id")).toHaveTextContent("POL-123");
  });

  it("updates the patient without sending gender and then reloads details", async () => {
    const user = userEvent.setup();
    const updated = { ...patient, fullName: "John Smith" };

    vi.spyOn(patientApi, "updatePatient").mockResolvedValue(undefined);
    vi.spyOn(patientApi, "getPatientDetails").mockResolvedValue(updated);

    render(<UpdatePatientModal patient={patient} onClose={onClose} onSave={onSave} />);

    await user.click(screen.getByTestId("modal-submit"));

    expect(patientApi.updatePatient).toHaveBeenCalledWith(patient.id, {
      fullName: patient.fullName,
      dob: patient.dob,
      phone: patient.phone,
      email: patient.email,
      address: patient.address,
      allergies: patient.allergies,
      insurance: {
        provider: "ABC Health",
        policyId: "POL-123",
      },
    });
    expect(patientApi.getPatientDetails).toHaveBeenCalledWith(patient.id);
    expect(onSave).toHaveBeenCalledWith(updated);
  });

  it("closes the modal when requested", async () => {
    const user = userEvent.setup();

    render(<UpdatePatientModal patient={patient} onClose={onClose} onSave={onSave} />);

    await user.click(screen.getByTestId("modal-close"));

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
