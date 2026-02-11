import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import LabelGenerationPage from "../LabelGeneration";
import type { LabelPrescriptionDetails } from "@labels/label.types";

/* ---------------- MOCK CHILD COMPONENTS ---------------- */

vi.mock("@labels/components/LabelQueueList", () => ({
  LabelQueueList: ({ onSelect }: { onSelect: (id: string) => void }) => (
    <button onClick={() => onSelect("RX-001")} data-testid="select-btn">
      Select RX
    </button>
  ),
}));

vi.mock("@labels/components/LabelPreview", () => ({
  LabelPreview: ({
    onPrint,
    onDownload,
  }: {
    onPrint: () => void;
    onDownload: () => void;
  }) => (
    <div>
      <button onClick={onPrint} data-testid="print-btn">
        Print
      </button>
      <button onClick={onDownload} data-testid="download-btn">
        Download
      </button>
    </div>
  ),
}));

/* ---------------- MOCK HOOKS ---------------- */

const mockSelectById = vi.fn();

vi.mock("@labels/hooks/useLabelQueue", () => ({
  useLabelQueue: () => ({
    prescriptions: [],
    loading: false,
    error: null,
  }),
}));

vi.mock("@labels/hooks/useLabelPrescriptionDetails", () => ({
  useLabelPrescriptionDetails: () => ({
    selected: {
  id: "RX-001",
  patientId: "P-001",
  patientName: "John Doe",
  createdAt: "2024-01-01",
  prescriber: {
    id: "DR-001",
    name: "Dr. Smith",
  },
  medicines: [],
} satisfies LabelPrescriptionDetails,

    loading: false,
    error: null,
    selectById: mockSelectById,
  }),
}));

describe("LabelGenerationPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(window, "alert").mockImplementation(() => {});
  });

  it("renders page header", () => {
    render(<LabelGenerationPage />);

    expect(
      screen.getByText("Label Generation")
    ).toBeInTheDocument();
  });

  it("calls selectById when queue item selected", () => {
    render(<LabelGenerationPage />);

    fireEvent.click(screen.getByTestId("select-btn"));

    expect(mockSelectById).toHaveBeenCalledWith("RX-001");
  });

  it("shows alert if trying to print with no labels in DOM", () => {
    render(<LabelGenerationPage />);

    fireEvent.click(screen.getByTestId("print-btn"));

    expect(window.alert).toHaveBeenCalledWith(
      "No labels to print. Please select a prescription first."
    );
  });

  it("shows alert if trying to download without labels", () => {
    render(<LabelGenerationPage />);

    fireEvent.click(screen.getByTestId("download-btn"));

    expect(window.alert).toHaveBeenCalledWith(
      "No labels to download."
    );
  });

  it("opens print window when labels exist", () => {
    // Add fake print label element
    const label = document.createElement("div");
    label.className = "print-label";
    document.body.appendChild(label);

    const mockOpen = vi.spyOn(window, "open").mockReturnValue({
      document: {
        write: vi.fn(),
        close: vi.fn(),
      },
      focus: vi.fn(),
    } as unknown as Window);

    render(<LabelGenerationPage />);

    fireEvent.click(screen.getByTestId("print-btn"));

    expect(mockOpen).toHaveBeenCalled();

    document.body.removeChild(label);
  });
});
