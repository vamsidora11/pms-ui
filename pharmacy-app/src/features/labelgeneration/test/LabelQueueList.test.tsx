import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { LabelQueueList } from "../components/LabelQueueList";
import type { LabelQueuePrescription } from "@labels/label.types";

/**
 * Factory function to create fully valid mock prescriptions.
 * Keeps tests clean and type-safe.
 */
function createMockPrescription(
  overrides?: Partial<LabelQueuePrescription>
): LabelQueuePrescription {
  return {
    id: "RX-DEFAULT",
    patientId: "P-DEFAULT",
    patientName: "Default Patient",
    prescriberName: "Dr. Default",
    createdAt: "2024-01-01T00:00:00Z",
    expiresAt: "2024-12-31T00:00:00Z",
    status: "READY",
    medicineCount: 1,
    ...overrides,
  };
}

describe("LabelQueueList", () => {
  const mockOnSelect = vi.fn();

  const mockPrescriptions: LabelQueuePrescription[] = [
    createMockPrescription({
      id: "RX-001",
      patientId: "P-001",
      patientName: "John Doe",
      prescriberName: "Dr. Smith",
      medicineCount: 2,
    }),
    createMockPrescription({
      id: "RX-002",
      patientId: "P-002",
      patientName: "Jane Smith",
      prescriberName: "Dr. Adams",
      medicineCount: 1,
    }),
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders loading state", () => {
    render(
      <LabelQueueList
        prescriptions={[]}
        loading
        error={null}
        onSelect={mockOnSelect}
      />
    );

    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("renders error state", () => {
    render(
      <LabelQueueList
        prescriptions={[]}
        loading={false}
        error="Failed to load"
        onSelect={mockOnSelect}
      />
    );

    expect(screen.getByText("Failed to load")).toBeInTheDocument();
  });

  it("renders empty state when no prescriptions available", () => {
    render(
      <LabelQueueList
        prescriptions={[]}
        loading={false}
        error={null}
        onSelect={mockOnSelect}
      />
    );

    expect(
      screen.getByText("No prescriptions ready for labels")
    ).toBeInTheDocument();
  });

  it("renders prescription list correctly", () => {
    render(
      <LabelQueueList
        prescriptions={mockPrescriptions}
        loading={false}
        error={null}
        onSelect={mockOnSelect}
      />
    );

    expect(screen.getByText("RX-001")).toBeInTheDocument();
    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText("2 medication(s)")).toBeInTheDocument();

    expect(screen.getByText("RX-002")).toBeInTheDocument();
    expect(screen.getByText("Jane Smith")).toBeInTheDocument();
    expect(screen.getByText("1 medication(s)")).toBeInTheDocument();
  });

  it("calls onSelect when a prescription is clicked", () => {
    render(
      <LabelQueueList
        prescriptions={mockPrescriptions}
        loading={false}
        error={null}
        onSelect={mockOnSelect}
      />
    );

    const firstButton = screen.getByRole("button", {
      name: /RX-001/i,
    });

    fireEvent.click(firstButton);

    expect(mockOnSelect).toHaveBeenCalledTimes(1);
    expect(mockOnSelect).toHaveBeenCalledWith("RX-001");
  });

  it("applies active styling when selectedId matches", () => {
    render(
      <LabelQueueList
        prescriptions={mockPrescriptions}
        loading={false}
        error={null}
        selectedId="RX-002"
        onSelect={mockOnSelect}
      />
    );

    const activeButton = screen.getByRole("button", {
      name: /RX-002/i,
    });

    expect(activeButton.className).toContain("bg-blue-50");
  });
});
