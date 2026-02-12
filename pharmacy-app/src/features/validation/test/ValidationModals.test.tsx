import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import ValidationModals from "../components/ValidationModals";
import type { AllergyAlert } from "../types/validation.types";

/* ---------------- MOCK CHILDREN ---------------- */

vi.mock("../components/Modal", () => ({
  Modal: ({
    open,
    children,
    footer,
  }: {
    open: boolean;
    children: React.ReactNode;
    footer?: React.ReactNode;
  }) =>
    open ? (
      <div>
        <div data-testid="modal-body">{children}</div>
        <div data-testid="modal-footer">{footer}</div>
      </div>
    ) : null,
}));

vi.mock("../components/Pill", () => ({
  Pill: ({ children }: { children: React.ReactNode }) => (
    <span>{children}</span>
  ),
}));

vi.mock("../prescriptionValidationUtils", () => ({
  pillToneBySeverity: () => "red",
}));

/* ---------------- FACTORY ---------------- */

function createAllergy(): AllergyAlert {
  return {
    issueType: "Drug-Allergy",
    severity: "High",
    affectedBy: "Penicillin",
    message: "Severe reaction",
    allergenCode: "ALG-1",
  };
}

/* ---------------- TESTS ---------------- */

describe("ValidationModals", () => {
  const baseProps = {
    allergyFor: null,
    rejectLineOpen: false,
    rejectLineReason: "",
    rejectAllOpen: false,
    rejectAllReason: "",
    submitting: false,
    onCloseAllergy: vi.fn(),
    onCloseRejectLine: vi.fn(),
    onRejectLineReasonChange: vi.fn(),
    onConfirmRejectLine: vi.fn(),
    onCloseRejectAll: vi.fn(),
    onRejectAllReasonChange: vi.fn(),
    onConfirmRejectAll: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders allergy modal when allergyFor exists", () => {
    render(
      <ValidationModals
        {...baseProps}
        allergyFor={createAllergy()}
      />
    );

    expect(screen.getByText("Drug-Allergy")).toBeInTheDocument();
    expect(screen.getByText("Penicillin")).toBeInTheDocument();
    expect(screen.getByText("Severe reaction")).toBeInTheDocument();
  });

  it("calls onCloseAllergy when Close clicked", () => {
    render(
      <ValidationModals
        {...baseProps}
        allergyFor={createAllergy()}
      />
    );

    fireEvent.click(screen.getByText("Close"));
    expect(baseProps.onCloseAllergy).toHaveBeenCalled();
  });

  it("renders reject line modal", () => {
    render(
      <ValidationModals
        {...baseProps}
        rejectLineOpen
      />
    );

    expect(
      screen.getByText("Please provide a reason for rejection:")
    ).toBeInTheDocument();
  });

  it("reject line textarea triggers change handler", () => {
    render(
      <ValidationModals
        {...baseProps}
        rejectLineOpen
      />
    );

    fireEvent.change(
      screen.getByPlaceholderText("Enter reason for rejection..."),
      { target: { value: "Invalid dose" } }
    );

    expect(baseProps.onRejectLineReasonChange).toHaveBeenCalledWith(
      "Invalid dose"
    );
  });

  it("reject line confirm disabled when reason empty", () => {
    render(
      <ValidationModals
        {...baseProps}
        rejectLineOpen
        rejectLineReason=""
      />
    );

    expect(
      screen.getByText("Confirm Rejection")
    ).toBeDisabled();
  });

  it("reject line confirm enabled when reason provided", () => {
    render(
      <ValidationModals
        {...baseProps}
        rejectLineOpen
        rejectLineReason="Reason"
      />
    );

    expect(
      screen.getByText("Confirm Rejection")
    ).not.toBeDisabled();
  });

  it("renders reject all modal", () => {
    render(
      <ValidationModals
        {...baseProps}
        rejectAllOpen
      />
    );

    expect(
      screen.getByText("Reject Entire Prescription")
    ).toBeInTheDocument();
  });

  it("reject all confirm disabled when reason empty", () => {
    render(
      <ValidationModals
        {...baseProps}
        rejectAllOpen
        rejectAllReason=""
      />
    );

    expect(
      screen.getByText("Confirm Rejection")
    ).toBeDisabled();
  });

  it("reject all confirm disabled when submitting", () => {
    render(
      <ValidationModals
        {...baseProps}
        rejectAllOpen
        rejectAllReason="Reason"
        submitting
      />
    );

    expect(
      screen.getByText("Submitting...")
    ).toBeInTheDocument();
  });

  it("reject all confirm calls handler", () => {
    render(
      <ValidationModals
        {...baseProps}
        rejectAllOpen
        rejectAllReason="Reason"
      />
    );

    fireEvent.click(screen.getByText("Confirm Rejection"));
    expect(baseProps.onConfirmRejectAll).toHaveBeenCalled();
  });
});
