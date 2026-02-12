//  renders empty state when no patient is selected and not loading 
//  renders loading skeletons when detailsLoading is true
//  renders error message when detailsError is set 
//  renders patient details and allergies correctly 
//  renders prescriptions correctly 
//  shows 'No prescriptions found' if patient has no prescriptions

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import PatientDetailsPanel from "../components/PatientDetailsPanel";
import type { PatientDetailsDto,  } from "@patient/types/patienttype";
import type {PrescriptionSummaryDto} from "@prescription/types/prescription.types"
describe("PatientDetailsPanel", () => {
  const mockPatient: PatientDetailsDto = {
    id: "p1",
    fullName: "John Doe",
    dob: "1990-01-01",
    phone: "1234567890",
    email: "john@example.com",
    address: "123 Main St",
    gender: "Male",
    allergies: ["Peanuts", "Dust"],
  };

  const mockPrescriptions: PrescriptionSummaryDto[] = [
    {
      id: "rx1",
      patientId: "p1",
      patientName: "John Doe",
      prescriberName: "Dr. Smith",
      createdAt: "2026-02-11T10:00:00Z",
      expiresAt: "2026-03-11T10:00:00Z",
      status: "Active",
      medicineCount: 2,
      validationSummary: {
        totalIssues: 0,
        highSeverityCount: 0,
        moderateCount: 0,
        lowCount: 0,
        requiresReview: false,
      },
    },
  ];

  it("renders empty state when no patient is selected and not loading", () => {
    render(
      <PatientDetailsPanel
        selectedPatient={null}
        detailsLoading={false}
        detailsError={null}
        prescriptions={[]}
        onClickUpdate={vi.fn()}
      />
    );

    expect(screen.getByText(/Select a patient to view details/i)).toBeInTheDocument();
    expect(screen.getByText(/Quick steps/i)).toBeInTheDocument();
  });

  it("renders loading skeletons when detailsLoading is true", () => {
    const { container } = render(
      <PatientDetailsPanel
        selectedPatient={null}
        detailsLoading={true}
        detailsError={null}
        prescriptions={[]}
        onClickUpdate={vi.fn()}
      />
    );

    const skeletons = container.querySelectorAll(".animate-pulse");
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("renders error message when detailsError is set", () => {
    render(
      <PatientDetailsPanel
        selectedPatient={null}
        detailsLoading={false}
        detailsError="Failed to load patient"
        prescriptions={[]}
        onClickUpdate={vi.fn()}
      />
    );

    expect(screen.getByText(/Failed to load patient/i)).toBeInTheDocument();
  });

  it("renders patient details and allergies correctly", () => {
    render(
      <PatientDetailsPanel
        selectedPatient={mockPatient}
        detailsLoading={false}
        detailsError={null}
        prescriptions={[]}
        onClickUpdate={vi.fn()}
      />
    );

    // Demographics
    expect(screen.getByText(/John Doe/i)).toBeInTheDocument();
    expect(screen.getByText(/1\/1\/1990/i)).toBeInTheDocument(); // matches rendered format
    expect(screen.getByText(/1234567890/i)).toBeInTheDocument();
    expect(screen.getByText(/john@example.com/i)).toBeInTheDocument();
    expect(screen.getByText(/123 Main St/i)).toBeInTheDocument();
    expect(screen.getByText(/Male/i)).toBeInTheDocument();

    // Allergies
    expect(screen.getByText(/Peanuts/i)).toBeInTheDocument();
    expect(screen.getByText(/Dust/i)).toBeInTheDocument();

    // Update button
    expect(screen.getByRole("button", { name: /Update Patient/i })).toBeInTheDocument();
  });

  it("renders prescriptions correctly", () => {
    render(
      <PatientDetailsPanel
        selectedPatient={mockPatient}
        detailsLoading={false}
        detailsError={null}
        prescriptions={mockPrescriptions}
        onClickUpdate={vi.fn()}
      />
    );

    // Prescription info
    expect(screen.getByText(/rx1/i)).toBeInTheDocument();
    expect(screen.getByText(/Active/i)).toBeInTheDocument();
    expect(screen.getByText(/2 medicines/i)).toBeInTheDocument();
    expect(screen.getByText(/Dr. Smith/i)).toBeInTheDocument();
  });

  it("shows 'No prescriptions found' if patient has no prescriptions", () => {
    render(
      <PatientDetailsPanel
        selectedPatient={mockPatient}
        detailsLoading={false}
        detailsError={null}
        prescriptions={[]}
        onClickUpdate={vi.fn()}
      />
    );

    expect(screen.getByText(/No prescriptions found/i)).toBeInTheDocument();
  });
});
