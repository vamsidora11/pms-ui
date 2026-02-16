import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import type { ReactNode } from "react";

import PrescriptionValidationDetailsPage from "../PrescriptionValidationPage";
import type { PrescriptionDetailsDto } from "@prescription/types/prescription.types";

/* =====================================================
   ROUTER MOCK
===================================================== */

const mockNavigate = vi.fn();

vi.mock("react-router-dom", async (importOriginal) => {
  const actual =
    (await importOriginal()) as typeof import("react-router-dom");

  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => ({ rxId: "RX123" }),
  };
});

/* =====================================================
   TOAST MOCK
===================================================== */

interface ToastApi {
  success: Mock<(title: string, message: string) => void>;
  error: Mock<(title: string, message: string) => void>;
}

const mockToast: ToastApi = {
  success: vi.fn(),
  error: vi.fn(),
};

vi.mock("@components/common/Toast/useToast", () => ({
  useToast: () => mockToast,
}));

/* =====================================================
   REVIEW HOOK MOCK
===================================================== */

const mockSubmitReview: Mock<
  (payload: { medicines: unknown[] }) => Promise<{ ok: boolean; message?: string }>
> = vi.fn();

vi.mock("@validation/hooks/usePrescriptionReview", () => ({
  usePrescriptionReview: () => ({
    submitting: false,
    submitReview: mockSubmitReview,
  }),
}));

/* =====================================================
   UI STATE MOCK
===================================================== */

interface MockUiState {
  data: PrescriptionDetailsDto | null;
  approved: Record<string, number>;
  decisions: Record<string, "Accepted" | "Rejected">;
  reasons: Record<string, string>;
  rejectLineId: string | null;
  rejectAllOpen: boolean;
  allergyFor: string | null;
}

let uiState: MockUiState;

const mockActions = {
  init: vi.fn(),
  setApproved: vi.fn(),
  acceptLine: vi.fn(),
  openRejectLine: vi.fn(),
  openAllergy: vi.fn(),
  openRejectAll: vi.fn(),
  closeRejectAll: vi.fn(),
  closeRejectLine: vi.fn(),
  closeAllergy: vi.fn(),
  setReason: vi.fn(),
  confirmRejectLine: vi.fn(),
};

vi.mock("../hooks/useValidationUiState", () => ({
  useValidationUiState: () => ({
    ui: uiState,
    actions: mockActions,
  }),
}));

/* =====================================================
   computeValidation MOCK
===================================================== */

const mockComputeValidation: Mock<
  (medicine: unknown, qty: number) => "OK" | "Partial" | "Blocked"
> = vi.fn();

vi.mock("../prescriptionValidationUtils", () => ({
  computeValidation: (medicine: unknown, qty: number) =>
    mockComputeValidation(medicine, qty),
}));

/* =====================================================
   CHILD COMPONENT MOCKS
===================================================== */

vi.mock("../components/ValidationTable", () => ({
  default: () => <div data-testid="validation-table" />,
}));

interface ModalProps {
  onConfirmRejectAll: () => Promise<void> | void;
}

let modalProps: ModalProps;

vi.mock("../components/ValidationModals", () => ({
  default: (props: ModalProps) => {
    modalProps = props;
    return <div data-testid="validation-modals" />;
  },
}));

vi.mock("../components/Pill", () => ({
  Pill: ({ children }: { children: ReactNode }) => (
    <div>{children}</div>
  ),
}));

/* =====================================================
   DATA MOCK
===================================================== */

const baseData: PrescriptionDetailsDto = {
  id: "RX123",
  patientId: "P001",
  patientName: "John Doe",
  prescriber: { id: "D001", name: "Dr. Smith" },
  createdAt: "2025-01-01T10:00:00Z",
  expiresAt: "2025-12-31T00:00:00Z",
  status: "Pending",
  isRefillable: true,
  medicines: [
    {
      prescriptionMedicineId: "M1",
      productId: "PR1",
      name: "Drug A",
      strength: "10mg",
      prescribedQuantity: 10,
      dispensedQuantity: 0,
      totalRefillsAuthorized: 1,
      refillsRemaining: 1,
      frequency: "OD",
      daysSupply: 10,
      endDate: null,
      instruction: "",
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
        inventory: {
          isPresent: false,
          severity: null,
          requiredQty: 10,
          reservableNow: 10,
          message: null,
        },
      },
      pharmacistReview: {
        decision: "",
        reviewedBy: null,
        reviewedAt: null,
        overrideReason: null,
      },
    },
  ],
};

let loadingState = false;
let errorState: string | null = null;
let dataState: PrescriptionDetailsDto | null = baseData;

vi.mock("@validation/hooks/usePrescriptionDetails", () => ({
  usePrescriptionDetails: () => ({
    data: dataState,
    loading: loadingState,
    error: errorState,
  }),
}));

/* =====================================================
   HELPER
===================================================== */

function renderPage() {
  return render(
    <MemoryRouter initialEntries={["/rx/RX123"]}>
      <Routes>
        <Route
          path="/rx/:rxId"
          element={<PrescriptionValidationDetailsPage />}
        />
      </Routes>
    </MemoryRouter>
  );
}

/* =====================================================
   TESTS
===================================================== */

describe("PrescriptionValidationDetailsPage - Fully Clean", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    uiState = {
      data: null,
      approved: {},
      decisions: {},
      reasons: {},
      rejectLineId: null,
      rejectAllOpen: false,
      allergyFor: null,
    };

    loadingState = false;
    errorState = null;
    dataState = baseData;

    mockComputeValidation.mockReturnValue("OK");
  });

  it("shows loading state", () => {
    loadingState = true;
    renderPage();
    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("shows error state", () => {
    errorState = "Something went wrong";
    renderPage();
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
  });

  it("renders patient info", () => {
    renderPage();
    expect(screen.getByText("John Doe")).toBeInTheDocument();
  });

  it("calls init", () => {
    renderPage();
    expect(mockActions.init).toHaveBeenCalledWith(baseData);
  });

  it("approve success", async () => {
    mockSubmitReview.mockResolvedValue({ ok: true });

    renderPage();
    fireEvent.click(screen.getByText("Approve Prescription"));

    await waitFor(() => {
      expect(mockToast.success).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalled();
    });
  });

  it("reject entire success", async () => {
    uiState.reasons = { _ALL_: "Invalid" };
    mockSubmitReview.mockResolvedValue({ ok: true });

    renderPage();
    await modalProps.onConfirmRejectAll();

    await waitFor(() => {
      expect(mockSubmitReview).toHaveBeenCalled();
      expect(mockToast.success).toHaveBeenCalled();
    });
  });
});
