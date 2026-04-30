import { describe, it, beforeEach, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import type { PrescriptionSummaryDto } from "@prescription/types/prescription.types";
import type { PatientDetails } from "../types/models";
import type { HistoryTableQuery } from "../utils/prescriptionHistoryUtils";
import type { PrescriptionHistoryQueryParams } from "@api/prescription";

/**
 * IMPORTANT: All mocks are declared BEFORE importing the SUT, and
 * they use the EXACT SAME module specifiers as the component.
 */

// -----------------------
// Mock: react-redux/useDispatch
// -----------------------
const dispatchSpy = vi.fn();
vi.mock("react-redux", async (orig: () => Promise<Record<string, unknown>>) => {
  const actual = await orig();
  return {
    ...(actual as Record<string, unknown>),
    useDispatch: () => dispatchSpy,
  };
});

// -----------------------
// Mocks: utils (use EXACT string: "./utils/prescriptionHistoryUtils")
// -----------------------
const formatDateTimeMock = vi.fn((iso: string) => {
  void iso;
  return {
    date: "2025-01-01",
    time: "10:00 AM",
  };
});
const statusStyleMock = vi.fn((status: string) => {
  void status;
  return "bg-green-100 text-green-800";
});
type MappedParams = PrescriptionHistoryQueryParams & { __mapped: boolean };
const buildHistoryQueryParamsMock = vi.fn(
  (q: HistoryTableQuery): MappedParams => ({ ...q, __mapped: true })
);

vi.mock("../utils/prescriptionHistoryUtils", () => ({
  formatDateTime: (iso: string) => formatDateTimeMock(iso),
  statusStyle: (s: string) => statusStyleMock(s),
  buildHistoryQueryParams: (q: HistoryTableQuery) => buildHistoryQueryParamsMock(q),
}));

// -----------------------
// Mock: Redux action creator (exact string: "@store/prescription/prescriptionSlice")
// -----------------------
const fetchAllPrescriptionsMock = vi.fn((payload: PrescriptionHistoryQueryParams) => ({
  type: "prescriptions/fetchAll",
  payload,
}));
vi.mock("@store/prescription/prescriptionSlice", () => ({
  fetchAllPrescriptions: (payload: PrescriptionHistoryQueryParams) =>
    fetchAllPrescriptionsMock(payload),
}));

// -----------------------
// Mock: Expanded details (exact string: "./components/PrescriptionExpandedDetails")
// -----------------------
vi.mock("../components/PrescriptionExpandedDetails", () => {
  const Mock = (props: {
    row?: PrescriptionSummaryDto;
    patient?: PatientDetails | null;
    patientLoading?: boolean;
    details?: { items?: unknown[] };
  }) => (
    <div data-testid="expanded-details">
      <div data-testid="expanded-row-id">{props.row?.id}</div>
      <div data-testid="expanded-patient-loading">{String(props.patientLoading)}</div>
      <div data-testid="expanded-patient-name">{props.patient?.fullName ?? ""}</div>
      <div data-testid="expanded-details-count">{(props.details?.items ?? []).length}</div>
    </div>
  );
  return { default: Mock };
});

// -----------------------
// Mock: DataTable (exact string: "@components/common/Table/Table")
// We render all column renderers for the first row to execute formatDateTime/statusStyle.
// Also trigger renderExpandedRow, isRowExpanded, onRowClick, onServerQueryChange.
// -----------------------
type ColumnDef = {
  key: keyof PrescriptionSummaryDto | string;
  render?: (value: unknown, row: PrescriptionSummaryDto) => ReactNode;
};

type DataTableProps = {
  data?: PrescriptionSummaryDto[];
  columns?: ColumnDef[];
  loading?: boolean;
  initialServerQuery?: { pageNumber?: number; pageSize?: number };
  renderExpandedRow?: (row: PrescriptionSummaryDto) => ReactNode;
  isRowExpanded?: (row: PrescriptionSummaryDto) => boolean;
  onRowClick?: (row: PrescriptionSummaryDto) => void;
  onServerQueryChange?: (query: HistoryTableQuery) => void;
};

vi.mock("@components/common/Table/Table", () => {
  const MockDataTable = (props: DataTableProps) => {
    const rows = Array.isArray(props.data) ? props.data : [];

    const firstRow = rows[0];
    const renderedCells =
      firstRow && Array.isArray(props.columns)
        ? props.columns.map((col, idx) => {
            if (typeof col.render === "function") {
              const val = firstRow[col.key as keyof PrescriptionSummaryDto];
              return (
                <div key={idx} data-testid={`col-${col.key}`}>
                  {col.render(val, firstRow)}
                </div>
              );
            }
            return (
              <div key={idx} data-testid={`col-${col.key}`}>
                {String(firstRow[col.key as keyof PrescriptionSummaryDto] ?? "")}
              </div>
            );
          })
        : null;

    const expandedResults = rows.map((r) => (
      <div key={`exp-${r.id}`} data-testid={`expanded-for-${r.id}`}>
        {props.renderExpandedRow ? props.renderExpandedRow(r) : null}
      </div>
    ));

    const isRowExpanded = props.isRowExpanded;
    const expandStateText =
      typeof isRowExpanded === "function"
        ? rows.map((r) => (
            <div key={`isExp-${r.id}`} data-testid={`is-expanded-${r.id}`}>
              {String(isRowExpanded(r))}
            </div>
          ))
        : null;

    if (rows[0] && typeof props.onRowClick === "function") {
      props.onRowClick(rows[0]);
    }

    if (typeof props.onServerQueryChange === "function") {
      props.onServerQueryChange({
        pageNumber: 3,
        pageSize: 20,
        searchTerm: "ibuprofen",
        sortBy: "createdAt",
        sortDirection: "desc",
        columnFilters: { status: "Active" },
      });
    }

    return (
      <div data-testid="datatable">
        <div data-testid="dt-loading">{String(props.loading)}</div>
        <div data-testid="dt-initial-page-number">{props.initialServerQuery?.pageNumber}</div>
        <div data-testid="dt-initial-page-size">{props.initialServerQuery?.pageSize}</div>
        {renderedCells}
        {expandedResults}
        {expandStateText}
      </div>
    );
  };

  return { default: MockDataTable };
});

// -----------------------
// Mock: usePrescriptionHistoryData (exact string: "./hooks/usePrescriptionHistoryData")
// -----------------------
const toggleRowSpy = vi.fn();
const isRowExpandedSpy = vi.fn((row: PrescriptionSummaryDto) => row?.id === "rx-1");

const baseSummary: PrescriptionSummaryDto = {
  alerts: false,
  id: "rx-1",
  patientId: "P-001",
  patientName: "Alice",
  prescriberName: "Dr. Who",
  createdAt: "2025-01-01T04:30:00.000Z",
  expiresAt: "2025-12-31T00:00:00.000Z",
  status: "Active",
  medicineCount: 1,
  validationSummary: {
    totalIssues: 0,
    highSeverityCount: 0,
    moderateCount: 0,
    lowCount: 0,
    requiresReview: false,
  },
};

const baseHookReturn = {
  prescriptions: [
    baseSummary,
    {
      ...baseSummary,
      id: "rx-2",
      patientName: "Bob",
      patientId: "P-002",
      prescriberName: "Dr. House",
      createdAt: "2025-01-02T04:30:00.000Z",
      status: "Completed",
    },
  ],
  requestStatus: "idle",
  totalCount: 42,
  pageNumber: 2,
  pageSize: 10,
  expandedRowId: "rx-1",
  expandedDetails: { items: [{ k: 1 }, { k: 2 }] },
  expandedPatient: {
    id: "P-001",
    fullName: "Alice A.",
    phone: "5550001111",
    dob: "1990-01-01",
    gender: "Female",
  } satisfies PatientDetails,
  expandedPatientLoading: true,
  toggleRow: toggleRowSpy,
  isRowExpanded: isRowExpandedSpy,
};

type HookReturn = typeof baseHookReturn;
let hookReturn: HookReturn = { ...baseHookReturn };

vi.mock("../hooks/usePrescriptionHistoryData", () => ({
  usePrescriptionHistoryData: vi.fn(() => hookReturn),
}));

// ⬇️ Import the SUT **after** mocks so they apply correctly.
import PrescriptionHistory from "../PrescriptionHistory";

// -----------------------
// Helpers
// -----------------------
const renderSUT = () => render(<PrescriptionHistory />);

describe("PrescriptionHistory", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    hookReturn = { ...baseHookReturn };
  });

  it("renders heading/subtitle, passes initial query, renders columns (including date & status) and expanded details, handles row click and server query", () => {
    renderSUT();

    // Title & subtitle with totalCount
    expect(screen.getByRole("heading", { name: /prescription history/i })).toBeInTheDocument();
    expect(
      screen.getByText(/View and track all prescriptions - 42/i)
    ).toBeInTheDocument();

    // initialServerQuery from hook (pageNumber=2, pageSize=10)
    expect(screen.getByTestId("datatable")).toBeInTheDocument();
    expect(screen.getByTestId("dt-initial-page-number").textContent).toBe("2");
    expect(screen.getByTestId("dt-initial-page-size").textContent).toBe("10");

    // Columns renderers executed for the first row:
    expect(screen.getByTestId("col-id")).toBeInTheDocument();
    expect(screen.getByText("Alice")).toBeInTheDocument(); // patientName
    expect(screen.getByText("P-001")).toBeInTheDocument(); // patientId
    expect(screen.getByTestId("col-prescriberName")).toBeInTheDocument();

    // createdAt → formatDateTime called
    expect(formatDateTimeMock).toHaveBeenCalledWith("2025-01-01T04:30:00.000Z");
    expect(screen.getByText("2025-01-01")).toBeInTheDocument();
    expect(screen.getByText("10:00 AM")).toBeInTheDocument();

    // status → statusStyle called + label rendered
    expect(statusStyleMock).toHaveBeenCalledWith("Active");
    const statusNode = screen.getByTestId("col-status").querySelector("span");
    expect(statusNode?.className).toContain("bg-green-100");
    expect(statusNode?.textContent).toBe("Active");

    // Expanded rows: rx-2 => null, rx-1 => details component
    expect(screen.getByTestId("expanded-for-rx-2").textContent).toBe("");
    expect(screen.getByTestId("expanded-for-rx-1").querySelector("[data-testid='expanded-details']"))
      .toBeTruthy();
    expect(screen.getByTestId("expanded-row-id").textContent).toBe("rx-1");
    expect(screen.getByTestId("expanded-patient-loading").textContent).toBe("true");
    expect(screen.getByTestId("expanded-patient-name").textContent).toBe("Alice A.");
    expect(screen.getByTestId("expanded-details-count").textContent).toBe("2");

    // isRowExpanded invoked for each row
    expect(isRowExpandedSpy).toHaveBeenCalledWith(hookReturn.prescriptions[0]);
    expect(isRowExpandedSpy).toHaveBeenCalledWith(hookReturn.prescriptions[1]);

    // onRowClick triggered for first row
    expect(toggleRowSpy).toHaveBeenCalledWith("rx-1");

    // onServerQueryChange -> buildHistoryQueryParams -> dispatch(fetchAllPrescriptions(mapped))
    expect(buildHistoryQueryParamsMock).toHaveBeenCalledWith({
      pageNumber: 3,
      pageSize: 20,
      searchTerm: "ibuprofen",
      sortBy: "createdAt",
      sortDirection: "desc",
      columnFilters: { status: "Active" },
    });

    const mapped = fetchAllPrescriptionsMock.mock.calls[0][0];
    expect(mapped).toMatchObject({
      pageNumber: 3,
      pageSize: 20,
      searchTerm: "ibuprofen",
      sortBy: "createdAt",
      sortDirection: "desc",
      columnFilters: { status: "Active" },
      __mapped: true,
    });

    expect(dispatchSpy).toHaveBeenCalledTimes(1);
    expect(dispatchSpy.mock.calls[0][0]).toMatchObject({
      type: "prescriptions/fetchAll",
      payload: mapped,
    });

    // loading derived from requestStatus === "loading" (idle => false)
    expect(screen.getByTestId("dt-loading").textContent).toBe("false");
  });

  it("sets loading=true when requestStatus is 'loading'", () => {
    hookReturn = { ...hookReturn, requestStatus: "loading" };
    renderSUT();
    expect(screen.getByTestId("dt-loading").textContent).toBe("true");
  });
});
