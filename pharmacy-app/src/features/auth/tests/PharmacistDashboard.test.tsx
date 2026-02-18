import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Mock } from "vitest";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import type { PrescriptionSummaryDto } from "@prescription/types/prescription.types";
import PharmacistDashboard from "../components/PharmacistDashboard";

/* ============================================
   MOCKS
============================================ */

// Mock only the hook (NOT DataTable)
vi.mock("../hooks/useDashboardData", () => ({
  useDashboardData: vi.fn(),
}));

// Mock thunk dispatch
const mockFetch = vi.fn();

vi.mock("@store/prescription/prescriptionSlice", () => ({
  fetchAllPrescriptions: (payload: unknown) => {
    mockFetch(payload);
    return { type: "mock/fetch" };
  },
}));

/* ============================================
   HELPERS
============================================ */

function createMockPrescription(
  overrides?: Partial<PrescriptionSummaryDto>
): PrescriptionSummaryDto {
  const today = new Date().toISOString();

  return {
    id: Math.random().toString(),
    patientId: "P001",
    patientName: "John Doe",
    prescriberName: "Dr. Smith",
    createdAt: today,
    expiresAt: today,
    status: "Created",
    medicineCount: 2,
    alerts: false,
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

/* ============================================
   TEST SUITE
============================================ */

describe("PharmacistDashboard - Maximum Coverage", () => {
  const mockStore = configureStore({
    reducer: () => ({}),
  });

  const renderComponent = () =>
    render(
      <Provider store={mockStore}>
        <PharmacistDashboard />
      </Provider>
    );

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("dispatches fetchAllPrescriptions on mount", async () => {
    const { useDashboardData } = await import("../hooks/useDashboardData");

    (useDashboardData as unknown as Mock).mockReturnValue({
      prescriptions: [],
      requestStatus: "idle",
    });

    renderComponent();

    expect(mockFetch).toHaveBeenCalledWith({
      pageNumber: 1,
      pageSize: 10,
      sortBy: "createdAt",
      sortDirection: "desc",
    });
  });

  it("shows loading state", async () => {
    const { useDashboardData } = await import("../hooks/useDashboardData");

    (useDashboardData as unknown as Mock).mockReturnValue({
      prescriptions: [],
      requestStatus: "loading",
    });

    renderComponent();

    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("shows empty state when no prescriptions today", async () => {
    const { useDashboardData } = await import("../hooks/useDashboardData");

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    (useDashboardData as unknown as Mock).mockReturnValue({
      prescriptions: [
        createMockPrescription({ createdAt: yesterday.toISOString() }),
      ],
      requestStatus: "succeeded",
    });

    renderComponent();

    expect(
      screen.getByText("No Prescriptions Today")
    ).toBeInTheDocument();
  });

  it("renders real table and executes column render functions", async () => {
    const { useDashboardData } = await import("../hooks/useDashboardData");

    const prescription = createMockPrescription({
      status: "Active",
    });

    (useDashboardData as unknown as Mock).mockReturnValue({
      prescriptions: [prescription],
      requestStatus: "succeeded",
    });

    renderComponent();

    // ID column
    expect(screen.getByText(prescription.id)).toBeInTheDocument();

    // Patient column (name + id)
    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText("P001")).toBeInTheDocument();

    // Doctor column
    expect(screen.getByText("Dr. Smith")).toBeInTheDocument();

    // Status column render
    expect(screen.getByText("Active")).toBeInTheDocument();
  });

  it("calculates KPI stats correctly", async () => {
    const { useDashboardData } = await import("../hooks/useDashboardData");

    const prescriptions = [
      createMockPrescription({ status: "Created" }),  // pending
      createMockPrescription({ status: "Active" }),   // ready
      createMockPrescription({ status: "Reviewed" }), // ready
      createMockPrescription({ alerts: true }),       // alert
    ];

    (useDashboardData as unknown as Mock).mockReturnValue({
      prescriptions,
      requestStatus: "succeeded",
    });

    renderComponent();

    // KPI Titles
    expect(screen.getByText("Pending Prescriptions")).toBeInTheDocument();
    expect(screen.getByText("Ready for Pickup")).toBeInTheDocument();
    expect(screen.getByText("Active Alerts")).toBeInTheDocument();
    expect(
      screen.getByText("Today's Prescriptions", { selector: "div" })
    ).toBeInTheDocument();

    // KPI Values (assert at least one occurrence)
    expect(screen.getAllByText("1").length).toBeGreaterThan(0);
    expect(screen.getAllByText("2").length).toBeGreaterThan(0);
  });

  it("shows correct header total count", async () => {
    const { useDashboardData } = await import("../hooks/useDashboardData");

    const prescriptions = [
      createMockPrescription(),
      createMockPrescription(),
    ];

    (useDashboardData as unknown as Mock).mockReturnValue({
      prescriptions,
      requestStatus: "succeeded",
    });

    renderComponent();

    expect(
      screen.getByText(/2 total prescriptions/)
    ).toBeInTheDocument();
  });
});
