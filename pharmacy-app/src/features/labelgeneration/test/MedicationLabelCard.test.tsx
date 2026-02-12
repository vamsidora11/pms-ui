import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MedicationLabelCard } from "../components/MedicationLabelCard";
import type {
  LabelPrescriptionDetails,
  LabelMedicine,
} from "@labels/types/label.types";

/* =====================================================
   MOCKS
===================================================== */

vi.mock("@utils/format", () => ({
  formatDate: vi.fn(() => "01-Jan-2024"),
}));

vi.mock("../types/label.types", () => ({
  getFrequencyLabel: vi.fn(() => "Twice Daily"),
}));

/* =====================================================
   FACTORIES
===================================================== */

function createMockPrescription(
  overrides?: Partial<LabelPrescriptionDetails>
): LabelPrescriptionDetails {
  return {
    id: "RX-001",
    patientId: "P-001",
    patientName: "John Doe",
    createdAt: "2024-01-01T00:00:00Z",
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

/* =====================================================
   TESTS
===================================================== */

describe("MedicationLabelCard - High Coverage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders pharmacy header", () => {
    render(
      <MedicationLabelCard
        prescription={createMockPrescription()}
        medicine={createMockMedicine()}
      />
    );

    expect(screen.getByText("MEDIFLOW PHARMACY")).toBeInTheDocument();
    expect(
      screen.getByText("123 Healthcare Blvd, Springfield, IL 62701")
    ).toBeInTheDocument();
    expect(screen.getByText("Phone: (555) 123-4567")).toBeInTheDocument();
  });

  it("renders prescription information correctly", () => {
    render(
      <MedicationLabelCard
        prescription={createMockPrescription()}
        medicine={createMockMedicine()}
      />
    );

    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText("RX-001")).toBeInTheDocument();
    expect(screen.getByText("01-Jan-2024")).toBeInTheDocument();
    expect(screen.getByText("Dr. Smith")).toBeInTheDocument();
  });

  it("renders medicine name and strength", () => {
    render(
      <MedicationLabelCard
        prescription={createMockPrescription()}
        medicine={createMockMedicine()}
      />
    );

    expect(screen.getByText("Paracetamol 500mg")).toBeInTheDocument();
  });

  it("renders quantity correctly", () => {
    render(
      <MedicationLabelCard
        prescription={createMockPrescription()}
        medicine={createMockMedicine()}
      />
    );

    expect(screen.getByText("QTY: 10")).toBeInTheDocument();
  });

  it("renders frequency using getFrequencyLabel", () => {
    render(
      <MedicationLabelCard
        prescription={createMockPrescription()}
        medicine={createMockMedicine()}
      />
    );

    expect(screen.getByText("Frequency: Twice Daily")).toBeInTheDocument();
  });

  it("renders directions section", () => {
    render(
      <MedicationLabelCard
        prescription={createMockPrescription()}
        medicine={createMockMedicine()}
      />
    );

    expect(screen.getByText("DIRECTIONS:")).toBeInTheDocument();
    expect(screen.getByText("Take after meals")).toBeInTheDocument();
  });

  it("renders warning section with all warnings", () => {
    render(
      <MedicationLabelCard
        prescription={createMockPrescription()}
        medicine={createMockMedicine()}
      />
    );

    expect(screen.getByText("⚠ WARNINGS")).toBeInTheDocument();

    // Use regex to ignore bullet character
    expect(
      screen.getByText(/Take as directed by physician/i)
    ).toBeInTheDocument();

    expect(
      screen.getByText(/Do not share this medication/i)
    ).toBeInTheDocument();

    expect(
      screen.getByText(/Store at room temperature/i)
    ).toBeInTheDocument();

    expect(
      screen.getByText(/Keep out of reach of children/i)
    ).toBeInTheDocument();
  });

  it("renders footer correctly", () => {
    render(
      <MedicationLabelCard
        prescription={createMockPrescription()}
        medicine={createMockMedicine()}
      />
    );

    expect(
      screen.getByText(/Pharmacist: Dr\. Jane Smith/i)
    ).toBeInTheDocument();

    expect(
      screen.getByText(/License: PH-12345/i)
    ).toBeInTheDocument();
  });

  it("renders correctly with different medicine data", () => {
    render(
      <MedicationLabelCard
        prescription={createMockPrescription({
          patientName: "Alice Johnson",
        })}
        medicine={createMockMedicine({
          name: "Ibuprofen",
          strength: "200mg",
          prescribedQuantity: 20,
          instruction: "After food",
        })}
      />
    );

    expect(screen.getByText("Alice Johnson")).toBeInTheDocument();
    expect(screen.getByText("Ibuprofen 200mg")).toBeInTheDocument();
    expect(screen.getByText("QTY: 20")).toBeInTheDocument();
    expect(screen.getByText("After food")).toBeInTheDocument();
  });
});
