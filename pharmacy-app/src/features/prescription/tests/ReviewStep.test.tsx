import React from "react";
import { describe, it, beforeEach, expect, vi } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";

/**
 * Mocks must be declared BEFORE importing the SUT
 */

// Mock @utils/format → formatDate
const formatDateSpy = vi.fn((_iso: string) => "Jan 01, 2000");
vi.mock("@utils/format", () => ({
  formatDate: (iso: string) => formatDateSpy(iso),
}));

// ⬇️ Import SUT after mocks
import ReviewStep from "../steps/ReviewStep";

// Types (lightweight mirrors to help readability in this test)
type Patient = {
  id: string;
  fullName: string;
  dob: string;
  gender: string;
  phone: string;
  email?: string;
  allergies?: string[];
};

type Doctor = { id: string; name: string };

type Med = {
  drugId?: string; // optional when incomplete
  drugName: string;
  strength: string;
  frequency: string;
  quantity: number;
  durationDays: number;
  refills: number;
  instructions?: string;
};

type Draft = {
  patient: Patient | null;
  doctor: Doctor;
  medications: Med[];
  notes?: string;
};

// Helpers to quickly build drafts
const mkPatient = (p?: Partial<Patient>): Patient => ({
  id: "P-001",
  fullName: "John Patient",
  dob: "2000-01-01",
  gender: "M",
  phone: "9990001111",
  ...p,
});

const mkDoctor = (d?: Partial<Doctor>): Doctor => ({
  id: "DR-001",
  name: "Dr. Strange",
  ...d,
});

const mkMed = (m?: Partial<Med>): Med => ({
  drugId: "INV-123",
  drugName: "Amoxicillin",
  strength: "500mg",
  frequency: "once",
  quantity: 10,
  durationDays: 5,
  refills: 1,
  instructions: "After meals",
  ...m,
});

describe("ReviewStep", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows validation error box for missing patient, missing doctor fields, and incomplete medications", () => {
    // Missing: patient (null), doctor id empty, doctor name empty, and one med without drugId
    const draft: Draft = {
      patient: null,
      doctor: mkDoctor({ id: "", name: "" }),
      medications: [
        mkMed({ drugId: undefined, drugName: "(none)", instructions: "Drink water" }),
        mkMed(), // one complete med too (not strictly needed, but ok)
      ],
      notes: undefined,
    };

    const onSubmit = vi.fn();
    render(<ReviewStep draft={draft} onSubmit={onSubmit} isSubmitting={false} />);

    // Header
    expect(
      screen.getByRole("heading", { name: /review prescription/i })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Verify all details before submission/i)
    ).toBeInTheDocument();

    // Error box present with all messages
    expect(screen.getByText(/Cannot Submit - Issues Found/i)).toBeInTheDocument();
    expect(screen.getByText(/Patient information is missing/i)).toBeInTheDocument();
    expect(screen.getByText(/Doctor ID is missing/i)).toBeInTheDocument();
    expect(screen.getByText(/Doctor name is missing/i)).toBeInTheDocument();
    // Medication(s) missing drug selection message includes count = 1
    expect(
      screen.getByText(/1 medication\(s\) missing drug selection/i)
    ).toBeInTheDocument();

    // Patient section shows the "No patient selected" variant
    expect(screen.getByText(/No patient selected/i)).toBeInTheDocument();

   // Doctor section shows "(Not set)" fallbacks for both ID and Name
const doctorSection = screen.getByRole("heading", { name: /prescribing doctor/i }).closest("section") as HTMLElement;
const doctorWithin = within(doctorSection);

// Doctor ID "(Not set)"
const idField = doctorWithin.getByText(/doctor id/i).parentElement as HTMLElement;
expect(within(idField).getByText("(Not set)")).toBeInTheDocument();

// Doctor Name "(Not set)"
const nameField = doctorWithin.getByText(/doctor name/i).parentElement as HTMLElement;
expect(within(nameField).getByText("(Not set)")).toBeInTheDocument();


    // Medications section shows the red banner for the incomplete med
    expect(
      screen.getByText(/Drug not selected - please go back to Medication step/i)
    ).toBeInTheDocument();

    // Submit button is disabled due to errors
    const submitBtn = screen.getByRole("button", { name: /submit prescription/i });
    expect(submitBtn).toBeDisabled();

    // Clicking shouldn't invoke onSubmit due to disabled
    fireEvent.click(submitBtn);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("renders complete patient info, calls formatDate for DOB, shows email, allergies, and a complete med including Inventory ID and Instructions; notes present", () => {
    const draft: Draft = {
      patient: mkPatient({
        email: "john@example.com",
        allergies: ["Peanuts", "Dust"],
      }),
      doctor: mkDoctor(), // valid
      medications: [
        mkMed({ // complete med
          drugId: "INV-777",
          drugName: "Ibuprofen",
          strength: "200mg",
          frequency: "twice",
          quantity: 15,
          durationDays: 7,
          refills: 2,
          instructions: "With food",
        }),
      ],
      notes: "Handle with care",
    };

    const onSubmit = vi.fn();
    render(<ReviewStep draft={draft} onSubmit={onSubmit} isSubmitting={false} />);

    // Patient information block (not the "No patient" variant)
    expect(screen.queryByText(/No patient selected/i)).not.toBeInTheDocument();

    // Patient fields
    expect(screen.getByText("John Patient")).toBeInTheDocument();
    expect(screen.getByText("P-001")).toBeInTheDocument();
    expect(screen.getByText("M")).toBeInTheDocument();
    expect(screen.getByText("9990001111")).toBeInTheDocument();

    // formatDate called with DOB and its returned string rendered
    expect(formatDateSpy).toHaveBeenCalledWith("2000-01-01");
    expect(screen.getByText("Jan 01, 2000")).toBeInTheDocument();

    // Email shown
    expect(screen.getByText("john@example.com")).toBeInTheDocument();

    // Allergies section visible and shows chips
    expect(screen.getByText(/Patient Allergies/i)).toBeInTheDocument();
    expect(screen.getByText("Peanuts")).toBeInTheDocument();
    expect(screen.getByText("Dust")).toBeInTheDocument();

    // Doctor section with real values (no "(Not set)")
    expect(screen.queryByText("(Not set)")).not.toBeInTheDocument();
    expect(screen.getByText("DR-001")).toBeInTheDocument();
    expect(screen.getByText("Dr. Strange")).toBeInTheDocument();

    // Medications header shows count
    expect(screen.getByText(/Medications \(1\)/i)).toBeInTheDocument();

    // Complete med -> shows Inventory ID and blue styled blocks content
    expect(screen.getByText(/Inventory ID/i)).toBeInTheDocument();
    expect(screen.getByText("INV-777")).toBeInTheDocument();
    expect(screen.getByText("Ibuprofen")).toBeInTheDocument();
    expect(screen.getByText("200mg")).toBeInTheDocument();
    expect(screen.getByText("twice")).toBeInTheDocument();
    expect(screen.getByText("15")).toBeInTheDocument();
    expect(screen.getByText(/7 days/i)).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();

    // Instructions shown for complete med
    expect(screen.getByText(/Instructions/i)).toBeInTheDocument();
    expect(screen.getByText("With food")).toBeInTheDocument();

    // Notes section present
    expect(screen.getByText(/Additional Notes/i)).toBeInTheDocument();
    expect(screen.getByText("Handle with care")).toBeInTheDocument();

    // Submit should be enabled (no errors)
    const submitBtn = screen.getByRole("button", { name: /submit prescription/i });
    expect(submitBtn).toBeEnabled();

    fireEvent.click(submitBtn);
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it("renders medication item without instructions cleanly (no Instructions block)", () => {
    const draft: Draft = {
      patient: mkPatient(),
      doctor: mkDoctor(),
      medications: [
        mkMed({ drugId: "INV-001", instructions: undefined, drugName: "Paracetamol" }),
      ],
      notes: undefined,
    };

    render(<ReviewStep draft={draft} onSubmit={vi.fn()} isSubmitting={false} />);

    // No instructions text for this med
    expect(screen.queryByText(/Instructions/i)).not.toBeInTheDocument();
    expect(screen.getByText("Paracetamol")).toBeInTheDocument();
  });

  it("shows 'Submitting...' and disables button when isSubmitting=true", () => {
    const draft: Draft = {
      patient: mkPatient(),
      doctor: mkDoctor(),
      medications: [mkMed()],
      notes: "ok",
    };
    const onSubmit = vi.fn();

    render(<ReviewStep draft={draft} onSubmit={onSubmit} isSubmitting={true} />);

    // Label changes and button is disabled
    const btn = screen.getByRole("button", { name: /Submitting\.\.\./i });
    expect(btn).toBeDisabled();

    // Clicking still shouldn't call since disabled
    fireEvent.click(btn);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("when allergies absent and email absent, those blocks do not render", () => {
    const draft: Draft = {
      patient: mkPatient({ email: undefined, allergies: [] }),
      doctor: mkDoctor(),
      medications: [mkMed()],
      notes: undefined,
    };
    render(<ReviewStep draft={draft} onSubmit={vi.fn()} isSubmitting={false} />);

    // No email text
    expect(screen.queryByText(/@/)).not.toBeInTheDocument();

    // Allergies section not rendered
    expect(screen.queryByText(/Patient Allergies/i)).not.toBeInTheDocument();
  });

  it("shows per-med red state when drugId missing, including red 'Drug not selected' banner", () => {
    const draft: Draft = {
      patient: mkPatient(),
      doctor: mkDoctor({ id: "", name: "" }), // doctor missing -> error + "(Not set)"
      medications: [
        mkMed({ drugId: undefined, drugName: "(Not selected)", strength: "" }),
      ],
      notes: undefined,
    };
    render(<ReviewStep draft={draft} onSubmit={vi.fn()} isSubmitting={false} />);

    // Issues found box visible because of errors
    expect(screen.getByText(/Cannot Submit - Issues Found/i)).toBeInTheDocument();

    // Red banner for the incomplete med
    expect(
      screen.getByText(/Drug not selected - please go back to Medication step/i)
    ).toBeInTheDocument();

    // Med details shown in red block content (text values appear regardless)
    expect(screen.getByText("(Not selected)")).toBeInTheDocument();
  });
});