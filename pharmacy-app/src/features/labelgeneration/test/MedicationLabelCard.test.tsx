import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MedicationLabelCard } from "../components/MedicationLabelCard";
import type {
  LabelPrescriptionDetails,
  LabelMedicine,
} from "@labels/types/label.types";

// Mock external dependencies
vi.mock("@utils/format", () => ({
  formatDate: vi.fn(() => "01-Jan-2024"),
}));

vi.mock("../label.types", () => ({
  getFrequencyLabel: vi.fn(() => "Twice Daily"),
}));

function createMockPrescription(
  overrides?: Partial<LabelPrescriptionDetails>
): LabelPrescriptionDetails {
  return {
    id: "RX-001",
    patientId: "P-001",
    patientName: "John Doe",
    createdAt: "2024-01-01T00:00:00Z",
    // expiresAt: "2024-12-31T00:00:00Z",
    // status: "READY",
    prescriber: {
      id: "DR-001",
      name: "Dr. Smith",
    },
    medicines: [],
    ...overrides,
  };
}

function createMockMedicine(
  overrides?: Partial<LabelMedicine>
): LabelMedicine {
  return {
    prescriptionMedicineId: "MED-001",
    name: "Paracetamol",
    strength: "500mg",
    prescribedQuantity: 10,
    frequency: "BID",
    instruction: "Take after meals",
    ...overrides,
  };
}

describe("MedicationLabelCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders pharmacy header", () => {
    const prescription = createMockPrescription();
    const medicine = createMockMedicine();

    render(
      <MedicationLabelCard
        prescription={prescription}
        medicine={medicine}
      />
    );

    expect(screen.getByText("MEDIFLOW PHARMACY")).toBeInTheDocument();
    expect(
      screen.getByText("123 Healthcare Blvd, Springfield, IL 62701")
    ).toBeInTheDocument();
  });

  it("renders prescription details", () => {
    const prescription = createMockPrescription();
    const medicine = createMockMedicine();

    render(
      <MedicationLabelCard
        prescription={prescription}
        medicine={medicine}
      />
    );

    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText("RX-001")).toBeInTheDocument();
    expect(screen.getByText("01-Jan-2024")).toBeInTheDocument();
    expect(screen.getByText("Dr. Smith")).toBeInTheDocument();
  });

  it("renders medicine details correctly", () => {
    const prescription = createMockPrescription();
    const medicine = createMockMedicine();

    render(
      <MedicationLabelCard
        prescription={prescription}
        medicine={medicine}
      />
    );

    expect(screen.getByText("Paracetamol 500mg")).toBeInTheDocument();
    expect(screen.getByText("QTY: 10")).toBeInTheDocument();
    expect(screen.getByText("Frequency: Twice Daily")).toBeInTheDocument();
    expect(screen.getByText("Take after meals")).toBeInTheDocument();
  });

  it("renders warning section", () => {
    const prescription = createMockPrescription();
    const medicine = createMockMedicine();

    render(
      <MedicationLabelCard
        prescription={prescription}
        medicine={medicine}
      />
    );

    expect(screen.getByText("⚠ WARNINGS")).toBeInTheDocument();
    expect(
      screen.getByText("Take as directed by physician")
    ).toBeInTheDocument();
    expect(
      screen.getByText("Do not share this medication")
    ).toBeInTheDocument();
  });

  it("renders footer information", () => {
    const prescription = createMockPrescription();
    const medicine = createMockMedicine();

    render(
      <MedicationLabelCard
        prescription={prescription}
        medicine={medicine}
      />
    );

    expect(
      screen.getByText(/Pharmacist: Dr\. Jane Smith/i)
    ).toBeInTheDocument();
  });
});
