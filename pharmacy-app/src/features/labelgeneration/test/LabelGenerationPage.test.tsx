import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import LabelGenerationPage from "../components/LabelGeneration";

/* ---------------- HOISTED MOCKS ---------------- */

const toastMock = vi.hoisted(() => ({
  warning: vi.fn(),
  error: vi.fn(),
  success: vi.fn(),
}));

const saveMock = vi.hoisted(() => vi.fn());

/* ---------------- TOAST ---------------- */

vi.mock("@components/common/Toast/toastService", () => ({
  toast: toastMock,
}));

/* ---------------- html2canvas ---------------- */

vi.mock("html2canvas", () => ({
  default: vi.fn(() =>
    Promise.resolve({
      toDataURL: () => "data:image/png;base64,test",
      width: 100,
      height: 100,
    })
  ),
}));

/* ---------------- jsPDF ---------------- */

vi.mock("jspdf", () => ({
  default: vi.fn(() => {
    return function () {
      return {
        internal: {
          pageSize: {
            getWidth: () => 200,
            getHeight: () => 200,
          },
        },
        addPage: vi.fn(),
        addImage: vi.fn(),
        save: saveMock,
      };
    };
  }),
}));

/* ---------------- STATE ---------------- */

let selected: any = null;

const mockSelectById = vi.fn((id: string, patientId: string) => {
  selected = {
    dispenseId: "DSP-001",
    prescriptionId: id,
    patientId,
    patientName: "John Doe",
    dispenseDate: "2024-01-01",
    status: "PaymentProcessed",
    pharmacistId: "PH-001",
    items: [],
  };
});

/* ---------------- MOCK HOOKS ---------------- */

vi.mock("@labels/hooks/useLabelQueue", () => ({
  useLabelQueue: () => ({
    prescriptions: [],
    loading: false,
    error: null,
  }),
}));

vi.mock("@labels/hooks/useLabelPrescriptionDetails", () => ({
  useLabelPrescriptionDetails: () => ({
    selected,
    loading: false,
    error: null,
    selectById: mockSelectById,
  }),
}));

/* ---------------- COMPONENT MOCKS ---------------- */

vi.mock("@labels/components/LabelQueueList", () => ({
  LabelQueueList: ({ onSelect }: any) => (
    <button data-testid="select-btn" onClick={() => onSelect("RX-001", "P-001")}>
      Select
    </button>
  ),
}));

vi.mock("@labels/components/LabelPreview", () => ({
  LabelPreview: ({ onPrint, onDownload }: any) => (
    <div>
      <button data-testid="print-btn" onClick={onPrint}>
        Print
      </button>
      <button data-testid="download-btn" onClick={onDownload}>
        Download
      </button>
    </div>
  ),
}));

/* ---------------- TESTS ---------------- */

describe("LabelGenerationPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    selected = null;
    document.body.innerHTML = ""; // IMPORTANT CLEANUP
  });

  it("renders header", () => {
    render(<LabelGenerationPage />);
    expect(screen.getByText("Label Generation")).toBeInTheDocument();
  });

  it("calls selectById when queue item selected", () => {
    render(<LabelGenerationPage />);
    fireEvent.click(screen.getByTestId("select-btn"));

    expect(mockSelectById).toHaveBeenCalledWith("RX-001", "P-001");
  });

  it("shows warning when printing with no labels", () => {
    render(<LabelGenerationPage />);
    fireEvent.click(screen.getByTestId("print-btn"));

    expect(toastMock.warning).toHaveBeenCalledWith(
      "No Labels Found",
      "Please select a prescription first."
    );
  });

  it("shows warning when downloading without selection", () => {
    render(<LabelGenerationPage />);
    fireEvent.click(screen.getByTestId("download-btn"));

    expect(toastMock.warning).toHaveBeenCalledWith(
      "No Prescription Selected",
      "Please select a prescription first."
    );
  });

  it("shows warning when downloading with no labels", () => {
    selected = {
      dispenseId: "DSP-001",
      prescriptionId: "RX-001",
      patientId: "P-001",
      patientName: "John Doe",
      items: [],
    };

    render(<LabelGenerationPage />);
    fireEvent.click(screen.getByTestId("download-btn"));

    expect(toastMock.warning).toHaveBeenCalledWith(
      "No Labels Found",
      "No labels available to download."
    );
  });

  it("opens print window when labels exist", () => {
    selected = {
      dispenseId: "DSP-001",
      prescriptionId: "RX-001",
      patientId: "P-001",
      patientName: "John Doe",
      items: [{ id: 1 }],
    };

    const label = document.createElement("div");
    label.className = "print-label";
    document.body.appendChild(label);

    const mockWrite = vi.fn();
    const mockClose = vi.fn();

    const mockWindow = {
      document: { write: mockWrite, close: mockClose },
      focus: vi.fn(),
      print: vi.fn(),
    };

    const openSpy = vi
      .spyOn(window, "open")
      .mockReturnValue(mockWindow as any);

    render(<LabelGenerationPage />);
    fireEvent.click(screen.getByTestId("print-btn"));

    expect(openSpy).toHaveBeenCalled();
    expect(mockWrite).toHaveBeenCalled();

    document.body.removeChild(label);
  });

  it("downloads pdf when labels exist", async () => {
    selected = {
      dispenseId: "DSP-001",
      prescriptionId: "RX-001",
      patientId: "P-001",
      patientName: "John Doe",
      items: [{ id: 1 }],
    };

    render(<LabelGenerationPage />);

    const label = document.createElement("div");
    label.className = "print-label";
    document.body.appendChild(label);

    // 🔥 CRITICAL: wait for DOM to be visible to querySelectorAll
    await waitFor(() => {
      expect(document.querySelectorAll(".print-label").length).toBe(1);
    });

    fireEvent.click(screen.getByTestId("download-btn"));

    expect(saveMock).toHaveBeenCalledTimes(1);
    expect(toastMock.success).toHaveBeenCalled();

    document.body.removeChild(label);
  });
});