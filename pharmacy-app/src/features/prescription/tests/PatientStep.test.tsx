import React from "react";
import { describe, it, beforeEach, afterEach, expect, vi } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";

/**
 * IMPORTANT:
 * - All vi.mock() calls come BEFORE importing the SUT.
 * - Use the EXACT module specifiers that the component under test uses.
 * - No top-level variables referenced INSIDE mock factories (hoist-safe).
 */

// Mock lucide-react icons to simple SVGs to avoid environment quirks.
vi.mock("lucide-react", () => {
  const Icon =
    (name: string) =>
    (props: any) =>
      <svg data-icon={name} {...props} />;
  return {
    AlertTriangle: Icon("AlertTriangle"),
    Search: Icon("Search"),
  };
});

// Spy-able, configurable state for the hook mock
type PatientSummary = {
  id: string;
  fullName: string;
  phone: string;
};

let mockQuery = "";
let mockResults: PatientSummary[] = [];
let mockLoading = false;
let mockError: string | null = null;
let mockShowResults = false;

const onQueryChangeSpy = vi.fn();
const selectPatientSpy = vi.fn();
const openResultsSpy = vi.fn();

vi.mock("../hooks/usePatientSearch", () => ({
  usePatientSearch: vi.fn(() => ({
    query: mockQuery,
    results: mockResults,
    loading: mockLoading,
    error: mockError,
    showResults: mockShowResults,
    onQueryChange: onQueryChangeSpy,
    selectPatient: selectPatientSpy,
    openResults: openResultsSpy,
  })),
}));

// ⬇️ Import the SUT after mocks so they take effect.
import PatientStep from "../steps/PatientStep";

// Fixed system time so age calculation is deterministic
const FIXED_NOW = new Date("2025-06-15T12:00:00.000Z");

describe("PatientStep", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(FIXED_NOW);

    // Default hook state for each test; tests override as needed
    mockQuery = "";
    mockResults = [];
    mockLoading = false;
    mockError = null;
    mockShowResults = false;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders header and search box; typing calls onQueryChange", () => {
    render(
      <PatientStep
        patient={null}
        onChange={vi.fn()}
        // searchFn not required since we mock the hook
      />
    );

    // Header
    expect(
      screen.getByRole("heading", { name: /select patient/i })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Search for an existing patient or create a new one/i)
    ).toBeInTheDocument();

    // Input and typing
    const input = screen.getByPlaceholderText(
      /Search by patient name, phone no. or ID/i
    ) as HTMLInputElement;
    expect(input).toBeInTheDocument();

    // Default query is "", simulate typing
    fireEvent.change(input, { target: { value: "john" } });
    expect(onQueryChangeSpy).toHaveBeenCalledWith("john");
  });

  it("renders results: loading, error, empty, and populated states; selection calls selectPatient with onChange", () => {
    const onChange = vi.fn();

    // 1) Loading state
    mockShowResults = true;
    mockLoading = true;
    mockError = null;
    mockResults = [];
    mockQuery = "j";
    const { rerender } = render(
      <PatientStep patient={null} onChange={onChange} />
    );
    expect(screen.getByText(/Searching patients/i)).toBeInTheDocument();

    // 2) Error state (not loading)
    mockLoading = false;
    mockError = "Oops!";
    rerender(<PatientStep patient={null} onChange={onChange} />);
    expect(screen.getByText("Oops!")).toBeInTheDocument();

    // 3) Empty state (not loading, no error, query.trim() truthy)
    mockError = null;
    mockResults = [];
    mockQuery = "ab";
    rerender(<PatientStep patient={null} onChange={onChange} />);
    expect(screen.getByText(/No patients found/i)).toBeInTheDocument();

    // 4) Populated results (not loading, no error)
    mockResults = [
      { id: "P-100", fullName: "Alice Anderson", phone: "9990001111" },
      { id: "P-200", fullName: "Bob Brown", phone: "9990002222" },
    ];
    rerender(<PatientStep patient={null} onChange={onChange} />);

    // Two result buttons present
    const aliceBtn = screen.getByRole("button", { name: /Alice Anderson/i });
    const bobBtn = screen.getByRole("button", { name: /Bob Brown/i });
    expect(aliceBtn).toBeInTheDocument();
    expect(bobBtn).toBeInTheDocument();

    // Clicking a result calls selectPatient(p, onChange)
    fireEvent.click(aliceBtn);
    expect(selectPatientSpy).toHaveBeenCalledWith(
      { id: "P-100", fullName: "Alice Anderson", phone: "9990001111" },
      onChange
    );
  });

  it("renders selected patient card with age/gender/phone and allergies list", () => {
    // Age calculation is based on FIXED_NOW = 2025-06-15
    // Use a DOB where birthday has already occurred this year
    const patient = {
      id: "P-1",
      fullName: "John Doe",
      dob: "2000-05-10", // birthday passed (May < June)
      gender: "M",
      phone: "8887776666",
      allergies: ["Penicillin", "Dust"],
    };

    render(<PatientStep patient={patient as any} onChange={vi.fn()} />);

    // Selected card basics
    expect(screen.getByText(/Selected Patient/i)).toBeInTheDocument();
    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText("P-1")).toBeInTheDocument();
    expect(screen.getByText("8887776666")).toBeInTheDocument();

    // Age/Gender: Born 2000 -> in 2025 they are 25 since birthday (May) already occurred before June 15
    // Text appears as: "25y / M"
    expect(screen.getByText(/25y \/ M/i)).toBeInTheDocument();

    // Allergies section visible with chips
    expect(screen.getByText(/Known Allergies/i)).toBeInTheDocument();
    expect(screen.getByText("Penicillin")).toBeInTheDocument();
    expect(screen.getByText("Dust")).toBeInTheDocument();
  });

  it("age calculation: handles 'birthday not yet occurred' and invalid DOB → '—'", () => {
    const { rerender } = render(
      <PatientStep
        patient={{
          id: "P-2",
          fullName: "Jane Roe",
          dob: "2000-06-16", // one day after FIXED_NOW (2025-06-15) => birthday not yet occurred
          gender: "F",
          phone: "7776665555",
          allergies: [],
        } as any}
        onChange={vi.fn()}
      />
    );

    // Age/Gender: If birthdate is June 16, and today is June 15, age should be 24
    expect(screen.getByText(/24y \/ F/i)).toBeInTheDocument();

    // Now rerender with invalid DOB, age should be "—"
    rerender(
      <PatientStep
        patient={{
          id: "P-3",
          fullName: "Jordan",
          dob: "not-a-date",
          gender: "O",
          phone: "7000000000",
          allergies: [],
        } as any}
        onChange={vi.fn()}
      />
    );

    // Expect "—y / O"
    expect(screen.getByText(/—y \/ O/i)).toBeInTheDocument();
  });

  it("when patient is null, no selected card shown; when showResults=false, no results container", () => {
    // Default: patient=null, showResults=false (from beforeEach)
    render(<PatientStep patient={null} onChange={vi.fn()} />);

    // No selected card
    expect(screen.queryByText(/Selected Patient/i)).not.toBeInTheDocument();

    // No results wrapper
    // The results wrapper has "border ... rounded-lg max-h-64 overflow-y-auto"
    // We'll simply check for either of key texts not present
    expect(screen.queryByText(/Searching patients/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/No patients found/i)).not.toBeInTheDocument();
  });
});