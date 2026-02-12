import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import PrescriptionValidationDetailsPage from "../PrescriptionValidationPage";
import type { PrescriptionDetailsDto } from "@prescription/types/prescription.types";

/* ---------------- MOCKS ---------------- */

const mockNavigate = vi.fn();
const mockToast = {
  error: vi.fn(),
  success: vi.fn(),
};

vi.mock("react-router-dom", () => ({
  useParams: () => ({ rxId: "RX-1" }),
  useNavigate: () => mockNavigate,
}));

vi.mock("@components/common/Toast/useToast", () => ({
  useToast: () => mockToast,
}));

vi.mock("./components/Pill", () => ({
  Pill: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

vi.mock("./components/ValidationTable", () => ({
  default: () => <div data-testid="validation-table" />,
}));

vi.mock("./components/ValidationModals", () => ({
  default: () => <div data-testid="validation-modals" />,
}));

/* ---------------- DATA FACTORY ---------------- */

function createMockPrescription(): PrescriptionDetailsDto {
  return {
    id: "RX-1",
    patientId: "P-1",
    patientName: "John Doe",
    prescriber: { id: "DR-1", name: "Dr. Smith" },
    createdAt: "2024-01-01",
    expiresAt: "2024-12-31",
    status: "Pending",
    isRefillable: false,
    medicines: [],
  };
}

/* ---------------- HOOK MOCKS ---------------- */

let mockData: PrescriptionDetailsDto | null = createMockPrescription();
let mockSubmitResult: { ok: boolean; message?: string }


vi.mock("@validation/hooks/usePrescriptionDetails", () => ({
  usePrescriptionDetails: () => ({
    data: mockData,
    loading: false,
    error: null,
  }),
}));

vi.mock("@validation/hooks/usePrescriptionReview", () => ({
  usePrescriptionReview: () => ({
    submitting: false,
    submitReview: vi.fn(() => Promise.resolve(mockSubmitResult)),
  }),
}));

vi.mock("./hooks/useValidationUiState", () => ({
  useValidationUiState: () => ({
    ui: {
      data: mockData,
      adjusted: {},
      decisions: {},
      reasons: {},
      allergyFor: null,
      rejectLineId: null,
      rejectAllOpen: false,
    },
    actions: {
      init: vi.fn(),
      setAdjusted: vi.fn(),
      acceptLine: vi.fn(),
      openRejectLine: vi.fn(),
      closeRejectLine: vi.fn(),
      confirmRejectLine: vi.fn(),
      setReason: vi.fn(),
      openRejectAll: vi.fn(),
      closeRejectAll: vi.fn(),
      openAllergy: vi.fn(),
      closeAllergy: vi.fn(),
    },
  }),
}));

/* ---------------- TESTS ---------------- */

describe("PrescriptionValidationDetailsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockData = createMockPrescription();
    mockSubmitResult = { ok: true };
  });

  it("renders loading state", () => {
    mockData = null;

    vi.doMock("@validation/hooks/usePrescriptionDetails", () => ({
      usePrescriptionDetails: () => ({
        data: null,
        loading: true,
        error: null,
      }),
    }));

    render(<PrescriptionValidationDetailsPage />);
    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("renders error state", () => {
    vi.doMock("@validation/hooks/usePrescriptionDetails", () => ({
      usePrescriptionDetails: () => ({
        data: null,
        loading: false,
        error: "Error occurred",
      }),
    }));

    render(<PrescriptionValidationDetailsPage />);
    expect(screen.getByText("Error occurred")).toBeInTheDocument();
  });

  it("renders main content", () => {
    render(<PrescriptionValidationDetailsPage />);
    expect(
      screen.getByText("Prescription Validation")
    ).toBeInTheDocument();
  });

  it("shows error toast if missing reject reason on approve", async () => {
    vi.doMock("./hooks/useValidationUiState", () => ({
      useValidationUiState: () => ({
        ui: {
          data: mockData,
          adjusted: {},
          decisions: { MED1: "Rejected" },
          reasons: {},
          allergyFor: null,
          rejectLineId: null,
          rejectAllOpen: false,
        },
        actions: {},
      }),
    }));

    render(<PrescriptionValidationDetailsPage />);
    fireEvent.click(screen.getByText("Approve Prescription"));

    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalled();
    });
  });

  it("navigates on successful approve", async () => {
    render(<PrescriptionValidationDetailsPage />);
    fireEvent.click(screen.getByText("Approve Prescription"));

    await waitFor(() => {
      expect(mockToast.success).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalled();
    });
  });

  it("shows error toast when submit fails", async () => {
    mockSubmitResult = { ok: false, message: "Failed" };

    render(<PrescriptionValidationDetailsPage />);
    fireEvent.click(screen.getByText("Approve Prescription"));

    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalledWith("Failed", "Failed");
    });
  });
});
