import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { LabelPreview } from "../components/LabelPreview";
import type { LabelPrescriptionDetails } from "@labels/types/label.types";

// Mock child component (unit isolation)
vi.mock("../components/MedicationLabelCard", () => ({
  MedicationLabelCard: ({ medicine }: { medicine: { prescriptionLineId: string } }) => (
    <div data-testid="medication-card">
      Medicine: {medicine.prescriptionLineId}
    </div>
  ),
}));

describe("LabelPreview", () => {
  const mockOnPrint = vi.fn();
  const mockOnDownload = vi.fn();

  const mockSelected: LabelPrescriptionDetails = {
    dispenseId: "dispense-1",
    prescriptionId: "prescription-1",
    patientId: "patient-1",
    patientName: "John Doe",
    dispenseDate: "2026-03-11T15:36:46.220Z",
    status: "PaymentProcessed",
    pharmacistId: "pharmacist-1",
    items: [
      { prescriptionLineId: "med-1" },
      { prescriptionLineId: "med-2" },
    ],
  } as LabelPrescriptionDetails;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders empty state when no selection", () => {
    render(
      <LabelPreview
        selected={null}
        loading={false}
        error={null}
        onPrint={mockOnPrint}
      />
    );

    expect(
      screen.getByText("Select a dispense to preview labels")
    ).toBeInTheDocument();
  });

  it("renders loading state", () => {
    render(
      <LabelPreview
        selected={null}
        loading
        error={null}
        onPrint={mockOnPrint}
      />
    );

    expect(
      screen.getByText("Loading label details...")
    ).toBeInTheDocument();
  });

  it("renders error state", () => {
    render(
      <LabelPreview
        selected={null}
        loading={false}
        error="Something went wrong"
        onPrint={mockOnPrint}
      />
    );

    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
  });

  it("renders medication cards when selected", () => {
    render(
      <LabelPreview
        selected={mockSelected}
        loading={false}
        error={null}
        onPrint={mockOnPrint}
      />
    );

    const cards = screen.getAllByTestId("medication-card");
    expect(cards).toHaveLength(2);
  });

  it("calls onPrint when print button is clicked", () => {
    render(
      <LabelPreview
        selected={mockSelected}
        loading={false}
        error={null}
        onPrint={mockOnPrint}
      />
    );

    const printButton = screen.getByRole("button", {
      name: /print label/i,
    });

    fireEvent.click(printButton);

    expect(mockOnPrint).toHaveBeenCalledTimes(1);
  });

  it("calls onDownload when download button is clicked", () => {
    render(
      <LabelPreview
        selected={mockSelected}
        loading={false}
        error={null}
        onPrint={mockOnPrint}
        onDownload={mockOnDownload}
      />
    );

    const downloadButton = screen.getByRole("button", {
      name: /download pdf/i,
    });

    fireEvent.click(downloadButton);

    expect(mockOnDownload).toHaveBeenCalledTimes(1);
  });

  it("disables buttons when printing", () => {
    render(
      <LabelPreview
        selected={mockSelected}
        loading={false}
        error={null}
        onPrint={mockOnPrint}
        isPrinting
      />
    );

    const printButton = screen.getByRole("button", {
      name: /preparing/i,
    });

    expect(printButton).toBeDisabled();
  });

  it("disables buttons when downloading", () => {
    render(
      <LabelPreview
        selected={mockSelected}
        loading={false}
        error={null}
        onPrint={mockOnPrint}
        onDownload={mockOnDownload}
        isDownloading
      />
    );

    const downloadButton = screen.getByRole("button", {
      name: /generating pdf/i,
    });

    expect(downloadButton).toBeDisabled();
  });
});
