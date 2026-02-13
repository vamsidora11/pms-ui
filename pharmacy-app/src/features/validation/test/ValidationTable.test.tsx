import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import ValidationTable from "../components/ValidationTable";
import type {
  PrescriptionDetailsDto,
  PrescriptionMedicineDto,
} from "@prescription/types/prescription.types";

/* ---------------- MOCKS ---------------- */

vi.mock("../prescriptionValidationUtils", () => ({
  computeValidation: vi.fn(() => "OK"),
  mapInteractionLevel: vi.fn(() => "Major"),
  pillToneBySeverity: vi.fn(() => "red"),
}));

vi.mock("../components/Pill", () => ({
  Pill: ({ children }: { children: React.ReactNode }) => (
    <span>{children}</span>
  ),
}));

/* ---------------- FACTORY ---------------- */

function createMedicine(
  overrides?: Partial<PrescriptionMedicineDto>
): PrescriptionMedicineDto {
  return {
    prescriptionMedicineId: "MED-1",
    productId: "PROD-1",
    name: "Paracetamol",
    strength: "500mg",
    prescribedQuantity: 10,
    dispensedQuantity: 0,
    totalRefillsAuthorized: 1,
    refillsRemaining: 1,
    frequency: "BID",
    daysSupply: 5,
    endDate: null,
    instruction: "Take after food",
    pharmacistReview: {
      decision: "Pending",
      reviewedBy: null,
      reviewedAt: null,
      overrideReason: null,
    },
    validation: {
      drugAllergy: {
        isPresent: false,
        overallSeverity: null,
        allergies: [],
      },
      drugInteraction: {
        isPresent: false,
        overallSeverity: null,
        interactingWith: [],
      },
      lowStock: {
        isPresent: false,
        severity: null,
        requiredQty: 10,
        availableQty: 10,
        message: null,
      },
    },
    ...overrides,
  };
}

function createData(): PrescriptionDetailsDto {
  return {
    id: "RX-1",
    patientId: "P-1",
    patientName: "John Doe",
    prescriber: { id: "DR-1", name: "Dr. Smith" },
    createdAt: "2024-01-01",
    expiresAt: "2024-12-31",
    status: "Pending",
    isRefillable: false,
    medicines: [createMedicine()],
  };
}

/* ---------------- TESTS ---------------- */

describe("ValidationTable", () => {
  const onAdjust = vi.fn();
  const onAccept = vi.fn();
  const onOpenReject = vi.fn();
  const onOpenAllergy = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders medicine row", () => {
    render(
      <ValidationTable
        data={createData()}
        adjusted={{}}
        decisions={{}}
        overallResult="OK"
        onAdjust={onAdjust}
        onAccept={onAccept}
        onOpenReject={onOpenReject}
        onOpenAllergy={onOpenAllergy}
      />
    );

    expect(screen.getByText("Paracetamol")).toBeInTheDocument();
    expect(screen.getByText("500mg")).toBeInTheDocument();
  });

  it("calls onAdjust when quantity changes", () => {
    render(
      <ValidationTable
        data={createData()}
        adjusted={{}}
        decisions={{}}
        overallResult="OK"
        onAdjust={onAdjust}
        onAccept={onAccept}
        onOpenReject={onOpenReject}
        onOpenAllergy={onOpenAllergy}
      />
    );

    fireEvent.change(screen.getByRole("spinbutton"), {
      target: { value: "5" },
    });

    expect(onAdjust).toHaveBeenCalledWith("MED-1", 5);
  });

  it("calls onAccept when Accept clicked", () => {
    render(
      <ValidationTable
        data={createData()}
        adjusted={{}}
        decisions={{}}
        overallResult="OK"
        onAdjust={onAdjust}
        onAccept={onAccept}
        onOpenReject={onOpenReject}
        onOpenAllergy={onOpenAllergy}
      />
    );

    fireEvent.click(screen.getByText("Accept"));
    expect(onAccept).toHaveBeenCalledWith("MED-1");
  });

  it("calls onOpenReject when Reject clicked", () => {
    render(
      <ValidationTable
        data={createData()}
        adjusted={{}}
        decisions={{}}
        overallResult="OK"
        onAdjust={onAdjust}
        onAccept={onAccept}
        onOpenReject={onOpenReject}
        onOpenAllergy={onOpenAllergy}
      />
    );

    fireEvent.click(screen.getByText("Reject"));
    expect(onOpenReject).toHaveBeenCalledWith("MED-1");
  });

  it("renders Max button when lowStock present", () => {
    const data = createData();

    render(
      <ValidationTable
        data={data}
        adjusted={{}}
        decisions={{}}
        overallResult="OK"
        onAdjust={onAdjust}
        onAccept={onAccept}
        onOpenReject={onOpenReject}
        onOpenAllergy={onOpenAllergy}
      />
    );

    expect(screen.getByText("Max")).toBeInTheDocument();
  });

  it("calls onAdjust with max when Max clicked", () => {
    const data = createData();

    render(
      <ValidationTable
        data={data}
        adjusted={{}}
        decisions={{}}
        overallResult="OK"
        onAdjust={onAdjust}
        onAccept={onAccept}
        onOpenReject={onOpenReject}
        onOpenAllergy={onOpenAllergy}
      />
    );

    fireEvent.click(screen.getByText("Max"));
    expect(onAdjust).toHaveBeenCalledWith("MED-1", 10);
  });

  it("opens allergy modal when allergy present", () => {
    const med = createMedicine({
      validation: {
        drugAllergy: {
          isPresent: true,
          overallSeverity: "High",
          allergies: [
            {
              allergenCode: "ALG-1",
              severity: "High",
              message: "Severe",
            },
          ],
        },
        drugInteraction: {
          isPresent: false,
          overallSeverity: null,
          interactingWith: [],
        },
        lowStock: {
          isPresent: false,
          severity: null,
          requiredQty: 10,
          availableQty: 10,
          message: null,
        },
      },
    });

    const data = createData();
    data.medicines = [med];

    render(
      <ValidationTable
        data={data}
        adjusted={{}}
        decisions={{}}
        overallResult="OK"
        onAdjust={onAdjust}
        onAccept={onAccept}
        onOpenReject={onOpenReject}
        onOpenAllergy={onOpenAllergy}
      />
    );

    fireEvent.click(screen.getByText("High"));
    expect(onOpenAllergy).toHaveBeenCalled();
  });

  it("renders overall status pill", () => {
    render(
      <ValidationTable
        data={createData()}
        adjusted={{}}
        decisions={{}}
        overallResult="Blocked"
        onAdjust={onAdjust}
        onAccept={onAccept}
        onOpenReject={onOpenReject}
        onOpenAllergy={onOpenAllergy}
      />
    );

    expect(screen.getByText("Blocked")).toBeInTheDocument();
  });
});
