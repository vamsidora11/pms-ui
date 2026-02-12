import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import PrescriptionValidationQueuePage from "../PrescriptionValidationPage";
import type { PrescriptionSummaryDto } from "@prescription/types/prescription.types";

/* ---------------- MOCKS ---------------- */

const mockNavigate = vi.fn();
const mockRefetch = vi.fn();

vi.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
  useLocation: () => ({ state: null }),
}));

vi.mock("@utils/hooks/usePendingPrescriptions", () => ({
  usePendingPrescriptions: () => ({
    rows: [],
    loading: false,
    error: null,
    refetch: mockRefetch,
  }),
}));

vi.mock("@utils/format", () => ({
  formatDate: (v: string) => `formatted-${v}`,
}));

/* ---------------- DATA FACTORY ---------------- */

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
    status: "Pending",
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

/* ---------------- TESTS ---------------- */

describe("PrescriptionValidationQueuePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders loading skeleton", () => {
    vi.doMock("@utils/hooks/usePendingPrescriptions", () => ({
      usePendingPrescriptions: () => ({
        rows: [],
        loading: true,
        error: null,
        refetch: mockRefetch,
      }),
    }));

    render(<PrescriptionValidationQueuePage />);
    expect(screen.getByText("Prescription Validation Queue")).toBeInTheDocument();
  });

  it("renders error state", () => {
    vi.doMock("@utils/hooks/usePendingPrescriptions", () => ({
      usePendingPrescriptions: () => ({
        rows: [],
        loading: false,
        error: "Failed",
        refetch: mockRefetch,
      }),
    }));

    render(<PrescriptionValidationQueuePage />);
    expect(screen.getByText("Failed")).toBeInTheDocument();
  });

  it("renders empty state", () => {
    render(<PrescriptionValidationQueuePage />);
    expect(screen.getByText("No pending items")).toBeInTheDocument();
  });

  it("renders sorted prescriptions", () => {
    const rows = [
      createSummary({ id: "RX-2", createdAt: "2024-02-01" }),
      createSummary({ id: "RX-1", createdAt: "2024-01-01" }),
    ];

    vi.doMock("@utils/hooks/usePendingPrescriptions", () => ({
      usePendingPrescriptions: () => ({
        rows,
        loading: false,
        error: null,
        refetch: mockRefetch,
      }),
    }));

    render(<PrescriptionValidationQueuePage />);

    const items = screen.getAllByText(/RX-/);
    expect(items[0]).toHaveTextContent("RX-1");
    expect(items[1]).toHaveTextContent("RX-2");
  });

  it("shows critical badge when high severity exists", () => {
    const rows = [
      createSummary({
        validationSummary: {
          totalIssues: 1,
          highSeverityCount: 2,
          moderateCount: 0,
          lowCount: 0,
          requiresReview: true,
        },
      }),
    ];

    vi.doMock("@utils/hooks/usePendingPrescriptions", () => ({
      usePendingPrescriptions: () => ({
        rows,
        loading: false,
        error: null,
        refetch: mockRefetch,
      }),
    }));

    render(<PrescriptionValidationQueuePage />);
    expect(screen.getByText("2 Critical")).toBeInTheDocument();
  });

  it("navigates to details on Review click", () => {
    const rows = [createSummary()];

    vi.doMock("@utils/hooks/usePendingPrescriptions", () => ({
      usePendingPrescriptions: () => ({
        rows,
        loading: false,
        error: null,
        refetch: mockRefetch,
      }),
    }));

    render(<PrescriptionValidationQueuePage />);

    fireEvent.click(screen.getByText("Review"));

    expect(mockNavigate).toHaveBeenCalledWith(
      expect.stringContaining("RX-1")
    );
  });

  it("calls refetch when location.state.refresh is true", () => {
    vi.doMock("react-router-dom", () => ({
      useNavigate: () => mockNavigate,
      useLocation: () => ({ state: { refresh: true } }),
    }));

    render(<PrescriptionValidationQueuePage />);
    expect(mockRefetch).toHaveBeenCalled();
  });
});
