import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";

import PrescriptionValidationDetailsPage from "../PrescriptionValidationPage";
import type { PrescriptionDetails, PrescriptionLineReviewDraft } from "@prescription/domain/model";

const mockNavigate = vi.fn();
const mockSubmitReview = vi.fn<
  (reviews: PrescriptionLineReviewDraft[], etag: string) => Promise<{ ok: true } | { ok: false; message: string }>
>();
const mockRefetch = vi.fn();
const mockToast = {
  success: vi.fn(),
  error: vi.fn(),
};

let uiState: {
  data: PrescriptionDetails | null;
  decisions: Record<string, "Approved" | "Rejected">;
  reasons: Record<string, string>;
  allergyFor: null;
  rejectLineId: string | null;
  rejectAllOpen: boolean;
};

const mockActions = {
  init: vi.fn(),
  acceptLine: vi.fn(),
  openRejectLine: vi.fn(),
  openAllergy: vi.fn(),
  openRejectAll: vi.fn(),
  closeRejectAll: vi.fn(),
  closeRejectLine: vi.fn(),
  closeAllergy: vi.fn(),
  setReason: vi.fn(),
  confirmRejectLine: vi.fn(),
  clearReason: vi.fn(),
  rejectAll: vi.fn(),
};

const baseData: PrescriptionDetails = {
  id: "RX123",
  patientId: "P001",
  patientName: "John Doe",
  prescriber: { id: "D001", name: "Dr. Smith" },
  prescriberName: "Dr. Smith",
  createdAt: new Date("2026-03-10T10:00:00Z"),
  status: "Created",
  medicineCount: 2,
  medicines: [
    {
      lineId: "line-1",
      productId: "prod-1",
      name: "Amoxicillin",
      strength: "500mg",
      frequency: "BID",
      instructions: "",
      durationDays: 7,
      quantityPrescribed: 14,
      quantityApprovedPerFill: null,
      quantityDispensed: 0,
      refillsAllowed: 0,
      refillsRemaining: 0,
      validation: {
        hasAllergy: false,
        hasInteraction: false,
        severity: "None",
        interactionDetails: [],
      },
      review: {
        status: "Pending",
        reviewedBy: null,
        reviewedAt: null,
        notes: null,
      },
    },
    {
      lineId: "line-2",
      productId: "prod-2",
      name: "Cetirizine",
      strength: "10mg",
      frequency: "OD",
      instructions: "",
      durationDays: 5,
      quantityPrescribed: 5,
      quantityApprovedPerFill: null,
      quantityDispensed: 0,
      refillsAllowed: 0,
      refillsRemaining: 0,
      validation: {
        hasAllergy: false,
        hasInteraction: false,
        severity: "None",
        interactionDetails: [],
      },
      review: {
        status: "Pending",
        reviewedBy: null,
        reviewedAt: null,
        notes: null,
      },
    },
  ],
};

let detailsData: PrescriptionDetails = baseData;

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();

  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock("@components/common/Toast/useToast", () => ({
  useToast: () => mockToast,
}));

vi.mock("@validation/hooks/usePrescriptionDetails", () => ({
  usePrescriptionDetails: () => ({
    data: detailsData,
    etag: "etag-1",
    loading: false,
    error: null,
    refetch: mockRefetch,
  }),
}));

vi.mock("@validation/hooks/usePrescriptionReview", () => ({
  usePrescriptionReview: () => ({
    submitting: false,
    submitReview: mockSubmitReview,
    latestEtag: null,
    latestSnapshot: null,
  }),
}));

vi.mock("../hooks/useValidationUiState", () => ({
  useValidationUiState: () => ({
    ui: uiState,
    actions: mockActions,
  }),
}));

vi.mock("@api/validation.api", () => ({
  getValidationResults: vi.fn().mockResolvedValue({ lines: [] }),
}));

vi.mock("@validation/domain/mapper", () => ({
  mapValidationResultDto: vi.fn(() => ({ lines: [] })),
}));

vi.mock("../components/ValidationTable", () => ({
  default: () => <div data-testid="validation-table" />,
}));

vi.mock("../components/ValidationModals", () => ({
  default: () => <div data-testid="validation-modals" />,
}));

function renderPage() {
  return render(
    <MemoryRouter
      initialEntries={[
        {
          pathname: "/validation/RX123",
          state: { patientId: "P001" },
        },
      ]}
    >
      <Routes>
        <Route
          path="/validation/:rxId"
          element={<PrescriptionValidationDetailsPage />}
        />
      </Routes>
    </MemoryRouter>,
  );
}

describe("PrescriptionValidationDetailsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    detailsData = baseData;
    uiState = {
      data: null,
      decisions: {},
      reasons: {},
      allergyFor: null,
      rejectLineId: null,
      rejectAllOpen: false,
    };
  });

  it("disables submit review until every line has a decision", () => {
    uiState.decisions = { "line-1": "Rejected" };
    uiState.reasons = { "line-1": "Allergy risk" };

    renderPage();

    expect(screen.getByRole("button", { name: "Submit Review" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Reject Entire Prescription" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Refresh Validation" })).toBeInTheDocument();
  });

  it("disables submit review when a rejected line is missing a reason", () => {
    uiState.decisions = {
      "line-1": "Rejected",
      "line-2": "Approved",
    };

    renderPage();

    expect(screen.getByRole("button", { name: "Submit Review" })).toBeDisabled();
  });

  it("submits once all decisions are complete and each rejected line has a reason", async () => {
    uiState.decisions = {
      "line-1": "Rejected",
      "line-2": "Approved",
    };
    uiState.reasons = { "line-1": "Allergy risk" };
    mockSubmitReview.mockResolvedValueOnce({ ok: true });

    renderPage();
    fireEvent.click(screen.getByRole("button", { name: "Submit Review" }));

    await waitFor(() => {
      expect(mockSubmitReview).toHaveBeenCalledWith(
        [
          {
            prescriptionLineId: "line-1",
            status: "Rejected",
            notes: "Allergy risk",
          },
          {
            prescriptionLineId: "line-2",
            status: "Approved",
            notes: null,
          },
        ],
        "etag-1",
      );
    });
  });

  it("forces single-medicine rejection through Reject Entire Prescription instead of Submit Review", () => {
    detailsData = {
      ...baseData,
      medicineCount: 1,
      medicines: [baseData.medicines[0]],
    };
    uiState.decisions = { "line-1": "Rejected" };
    uiState.reasons = { "line-1": "Allergy risk" };

    renderPage();

    expect(screen.getByRole("button", { name: "Submit Review" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Reject Entire Prescription" })).not.toBeDisabled();
  });
});
