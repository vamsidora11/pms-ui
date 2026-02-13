import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import PrescriptionValidationQueuePage from "../PrescriptionValidationPage";
import type { PrescriptionSummaryDto } from "@prescription/types/prescription.types";

/* ------------------------------------------------------------------ */
/* --------------------------- ROUTER MOCK ---------------------------- */
/* ------------------------------------------------------------------ */

const mockNavigate = vi.fn();
let mockLocationState: { refresh?: boolean } | null = null;

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({ state: mockLocationState }),
  };
});

/* ------------------------------------------------------------------ */
/* ---------------------- HOOK + FORMAT MOCKS ------------------------ */
/* ------------------------------------------------------------------ */

const mockRefetch = vi.fn();
const mockUsePendingPrescriptions = vi.fn();

vi.mock("@utils/hooks/usePendingPrescriptions", () => ({
  usePendingPrescriptions: () => mockUsePendingPrescriptions(),
}));

vi.mock("@utils/format", () => ({
  formatDate: (v: string) => `formatted-${v}`,
}));

/* ------------------------------------------------------------------ */
/* --------------------------- DATA FACTORY --------------------------- */
/* ------------------------------------------------------------------ */

function createSummary(
  overrides?: Partial<PrescriptionSummaryDto>
): PrescriptionSummaryDto {
  return {
    id: "RX-1",
    alerts: false,
    patientId: "P-1",
    patientName: "John Doe",
    prescriberName: "Dr. Smith",
    createdAt: "2024-01-01",
    expiresAt: "2024-12-31",
    status: "Created",
    medicineCount: 2,
    validationSummary: {
      totalIssues: 0,
      highSeverityCount: 0,
      moderateCount: 0,
      lowCount: 0,
      requiresReview: false,
    },
    ...overrides,
  };
}

/* ------------------------------------------------------------------ */
/* ------------------------------ TESTS ------------------------------- */
/* ------------------------------------------------------------------ */

describe("PrescriptionValidationQueuePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocationState = null;
  });

  /* ---------------- Loading ---------------- */

  it("renders loading skeleton and header", () => {
    mockUsePendingPrescriptions.mockReturnValue({
      rows: [],
      loading: true,
      error: null,
      refetch: mockRefetch,
    });

    render(<PrescriptionValidationQueuePage />);

    expect(
      screen.getByText("Prescription Validation Queue")
    ).toBeInTheDocument();

    expect(screen.getByText("Pending Prescriptions")).toBeInTheDocument();
  });

  /* ---------------- Error ---------------- */

  it("renders error state", () => {
    mockUsePendingPrescriptions.mockReturnValue({
      rows: [],
      loading: false,
      error: "Failed to load",
      refetch: mockRefetch,
    });

    render(<PrescriptionValidationQueuePage />);

    expect(screen.getByText("Failed to load")).toBeInTheDocument();
  });

  /* ---------------- Empty ---------------- */

  it("renders empty state when no rows", () => {
    mockUsePendingPrescriptions.mockReturnValue({
      rows: [],
      loading: false,
      error: null,
      refetch: mockRefetch,
    });

    render(<PrescriptionValidationQueuePage />);

    expect(screen.getByText("No pending items")).toBeInTheDocument();
  });

  /* ---------------- Sorting ---------------- */

  it("renders prescriptions sorted by createdAt ascending", () => {
    const rows = [
      createSummary({ id: "RX-2", createdAt: "2024-02-01" }),
      createSummary({ id: "RX-1", createdAt: "2024-01-01" }),
    ];

    mockUsePendingPrescriptions.mockReturnValue({
      rows,
      loading: false,
      error: null,
      refetch: mockRefetch,
    });

    render(<PrescriptionValidationQueuePage />);

    const badges = screen.getAllByText(/RX-/);

    expect(badges[0]).toHaveTextContent("RX-1");
    expect(badges[1]).toHaveTextContent("RX-2");
  });

  /* ---------------- Badge Variants ---------------- */

  it("shows critical badge", () => {
    const rows = [
      createSummary({
        validationSummary: {
          totalIssues: 2,
          highSeverityCount: 2,
          moderateCount: 0,
          lowCount: 0,
          requiresReview: true,
        },
      }),
    ];

    mockUsePendingPrescriptions.mockReturnValue({
      rows,
      loading: false,
      error: null,
      refetch: mockRefetch,
    });

    render(<PrescriptionValidationQueuePage />);

    expect(screen.getByText("2 Critical")).toBeInTheDocument();
  });

  it("shows moderate and low badges", () => {
    const rows = [
      createSummary({
        validationSummary: {
          totalIssues: 3,
          highSeverityCount: 0,
          moderateCount: 2,
          lowCount: 1,
          requiresReview: true,
        },
      }),
    ];

    mockUsePendingPrescriptions.mockReturnValue({
      rows,
      loading: false,
      error: null,
      refetch: mockRefetch,
    });

    render(<PrescriptionValidationQueuePage />);

    expect(screen.getByText("2 Moderate")).toBeInTheDocument();
    expect(screen.getByText("1 Info")).toBeInTheDocument();
  });

  it("shows No Issues badge", () => {
    const rows = [createSummary()];

    mockUsePendingPrescriptions.mockReturnValue({
      rows,
      loading: false,
      error: null,
      refetch: mockRefetch,
    });

    render(<PrescriptionValidationQueuePage />);

    expect(screen.getByText("No Issues")).toBeInTheDocument();
  });

  /* ---------------- Navigation ---------------- */

  it("navigates to details page on Review click", () => {
    const rows = [createSummary({ id: "RX-123" })];

    mockUsePendingPrescriptions.mockReturnValue({
      rows,
      loading: false,
      error: null,
      refetch: mockRefetch,
    });

    render(<PrescriptionValidationQueuePage />);

    fireEvent.click(screen.getByText("Review"));

    expect(mockNavigate).toHaveBeenCalledWith(
      expect.stringContaining("RX-123")
    );
  });

  /* ---------------- Refetch on refresh flag ---------------- */

  it("calls refetch when location.state.refresh is true", () => {
    mockLocationState = { refresh: true };

    mockUsePendingPrescriptions.mockReturnValue({
      rows: [],
      loading: false,
      error: null,
      refetch: mockRefetch,
    });

    render(<PrescriptionValidationQueuePage />);

    expect(mockRefetch).toHaveBeenCalled();
  });

  /* ---------------- Pluralization ---------------- */

  it("handles singular vs plural prescription count", () => {
    mockUsePendingPrescriptions.mockReturnValue({
      rows: [createSummary()],
      loading: false,
      error: null,
      refetch: mockRefetch,
    });

    render(<PrescriptionValidationQueuePage />);

    expect(
      screen.getByText("1 prescription awaiting review")
    ).toBeInTheDocument();
  });
});
