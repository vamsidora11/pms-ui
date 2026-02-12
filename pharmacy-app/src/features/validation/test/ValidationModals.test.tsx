import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { ReactNode } from "react";

import ValidationModals from "../components/ValidationModals";
import type { AllergyAlert } from "../types/validation.types";

/* =====================================================
   MOCK Modal
===================================================== */

vi.mock("../components/Modal", () => ({
  Modal: ({
    open,
    title,
    children,
    footer,
  }: {
    open: boolean;
    title?: string;
    children: ReactNode;
    footer?: ReactNode;
  }) =>
    open ? (
      <div>
        {title && <div>{title}</div>}
        <div data-testid="modal-body">{children}</div>
        <div data-testid="modal-footer">{footer}</div>
      </div>
    ) : null,
}));

/* =====================================================
   MOCK Pill
===================================================== */

vi.mock("../components/Pill", () => ({
  Pill: ({ children }: { children: ReactNode }) => (
    <span>{children}</span>
  ),
}));

/* =====================================================
   MOCK pillToneBySeverity
===================================================== */

vi.mock("../prescriptionValidationUtils", () => ({
  pillToneBySeverity: () => "red",
}));

/* =====================================================
   FACTORY
===================================================== */

function createAllergy(): AllergyAlert {
  return {
    issueType: "Drug-Allergy",
    severity: "High",
    affectedBy: "Penicillin",
    message: "Severe reaction",
    allergenCode: "ALG-1",
  };
}

/* =====================================================
   TESTS
===================================================== */

describe("ValidationModals - Final Stable Version", () => {
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

  /* ================= ALLERGY ================= */

  it("renders allergy modal correctly", () => {
    render(
      <ValidationModals
        {...baseProps}
        allergyFor={createAllergy()}
      />
    );

    expect(screen.getByText("Safety Alert Details")).toBeInTheDocument();
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
    expect(baseProps.onCloseAllergy).toHaveBeenCalledTimes(1);
  });

  /* ================= REJECT LINE ================= */

  it("renders reject line modal", () => {
    render(
      <ValidationModals
        {...baseProps}
        rejectLineOpen={true}
      />
    );

    expect(screen.getByText("Reject Medication")).toBeInTheDocument();
    expect(
      screen.getByText("Please provide a reason for rejection:")
    ).toBeInTheDocument();
  });

  it("reject line textarea change triggers handler", () => {
    render(
      <ValidationModals
        {...baseProps}
        rejectLineOpen={true}
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
        rejectLineOpen={true}
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
        rejectLineOpen={true}
        rejectLineReason="Reason"
      />
    );

    expect(
      screen.getByText("Confirm Rejection")
    ).not.toBeDisabled();
  });

  it("reject line confirm calls handler", () => {
    render(
      <ValidationModals
        {...baseProps}
        rejectLineOpen={true}
        rejectLineReason="Reason"
      />
    );

    fireEvent.click(screen.getByText("Confirm Rejection"));
    expect(baseProps.onConfirmRejectLine).toHaveBeenCalledTimes(1);
  });

  /* ================= REJECT ALL ================= */

  it("renders reject all modal", () => {
    render(
      <ValidationModals
        {...baseProps}
        rejectAllOpen={true}
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
        rejectAllOpen={true}
        rejectAllReason=""
      />
    );

    expect(
      screen.getByText("Confirm Rejection")
    ).toBeDisabled();
  });

  it("reject all shows submitting state", () => {
    render(
      <ValidationModals
        {...baseProps}
        rejectAllOpen={true}
        rejectAllReason="Reason"
        submitting={true}
      />
    );

    expect(screen.getByText("Submitting...")).toBeInTheDocument();
  });

  it("reject all confirm calls handler", () => {
    render(
      <ValidationModals
        {...baseProps}
        rejectAllOpen={true}
        rejectAllReason="Reason"
      />
    );

    fireEvent.click(screen.getByText("Confirm Rejection"));
    expect(baseProps.onConfirmRejectAll).toHaveBeenCalledTimes(1);
  });

  /* ================= MULTIPLE MODALS ================= */

  it("renders multiple modals if multiple flags true", () => {
    render(
      <ValidationModals
        {...baseProps}
        allergyFor={createAllergy()}
        rejectLineOpen={true}
        rejectAllOpen={true}
      />
    );

    expect(screen.getByText("Safety Alert Details")).toBeInTheDocument();
    expect(screen.getByText("Reject Medication")).toBeInTheDocument();
    expect(
      screen.getByText("Reject Entire Prescription")
    ).toBeInTheDocument();
  });
});
