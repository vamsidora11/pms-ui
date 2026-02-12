//   renders loading skeletons when listLoading is true
//   renders error message when listError is set
//   renders empty state when patients list is empty
//   renders a list of patients correctly
//   highlights the selected patient
//   calls onSelectPatient when a patient is clicked
//   updates searchTerm on input change

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import PatientDirectoryPanel from "../components/PatientDirectoryPanel";
import type { PatientSummaryDto } from "@store/patient/patienttype";

describe("PatientDirectoryPanel", () => {
  const mockPatients: PatientSummaryDto[] = [
    { id: "p1", fullName: "John Doe", phone: "1234567890" },
    { id: "p2", fullName: "Jane Smith", phone: "9876543210" },
  ];

  it("renders loading skeletons when listLoading is true", () => {
    const { container } = render(
      <PatientDirectoryPanel
        patients={[]}
        searchTerm=""
        onSearchTermChange={vi.fn()}
        listLoading={true}
        listError={null}
        onSelectPatient={vi.fn()}
      />
    );

    const skeletons = container.querySelectorAll(".animate-pulse");
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("renders error message when listError is set", () => {
    render(
      <PatientDirectoryPanel
        patients={[]}
        searchTerm=""
        onSearchTermChange={vi.fn()}
        listLoading={false}
        listError="Failed to load patients"
        onSelectPatient={vi.fn()}
      />
    );

    expect(screen.getByText(/Failed to load patients/i)).toBeInTheDocument();
  });

  it("renders empty state when patients list is empty", () => {
    render(
      <PatientDirectoryPanel
        patients={[]}
        searchTerm=""
        onSearchTermChange={vi.fn()}
        listLoading={false}
        listError={null}
        onSelectPatient={vi.fn()}
      />
    );

    expect(screen.getByText(/No patients found/i)).toBeInTheDocument();
  });

  it("renders a list of patients correctly", () => {
    render(
      <PatientDirectoryPanel
        patients={mockPatients}
        searchTerm=""
        onSearchTermChange={vi.fn()}
        listLoading={false}
        listError={null}
        onSelectPatient={vi.fn()}
      />
    );

    mockPatients.forEach((p) => {
      expect(screen.getByText(p.fullName)).toBeInTheDocument();
      expect(screen.getByText(p.id)).toBeInTheDocument();
      expect(screen.getByText(p.phone)).toBeInTheDocument();
    });
  });

  it("highlights the selected patient", () => {
    render(
      <PatientDirectoryPanel
        patients={mockPatients}
        searchTerm=""
        onSearchTermChange={vi.fn()}
        listLoading={false}
        listError={null}
        selectedPatientId="p2"
        onSelectPatient={vi.fn()}
      />
    );

    const selectedButton = screen.getByText("Jane Smith").closest("button");
    expect(selectedButton).toHaveClass("ring-2 ring-blue-400");
  });

  it("calls onSelectPatient when a patient is clicked", async () => {
    const selectMock = vi.fn();
    render(
      <PatientDirectoryPanel
        patients={mockPatients}
        searchTerm=""
        onSearchTermChange={vi.fn()}
        listLoading={false}
        listError={null}
        onSelectPatient={selectMock}
      />
    );

    const button = screen.getByText("John Doe").closest("button")!;
    await fireEvent.click(button);
    expect(selectMock).toHaveBeenCalledWith("p1");
  });

  it("updates searchTerm on input change", () => {
    const searchMock = vi.fn();
    render(
      <PatientDirectoryPanel
        patients={mockPatients}
        searchTerm=""
        onSearchTermChange={searchMock}
        listLoading={false}
        listError={null}
        onSelectPatient={vi.fn()}
      />
    );

    const input = screen.getByPlaceholderText(/Search by name, ID, or phone/i);
    fireEvent.change(input, { target: { value: "Jane" } });
    expect(searchMock).toHaveBeenCalledWith("Jane");
  });
});
