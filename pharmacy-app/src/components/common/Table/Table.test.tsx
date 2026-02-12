import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import DataTable, { type Column } from "./Table";
import React from "react";

/* -------------------------------------------------------
   1) Mock lucide-react icons
-------------------------------------------------------- */
vi.mock("lucide-react", () => ({
  Search: (p: any) => <svg data-testid="icon-search" {...p} />,
  Download: (p: any) => <svg data-testid="icon-download" {...p} />,
  Filter: (p: any) => <svg data-testid="icon-filter" {...p} />,
  ChevronUp: (p: any) => <svg data-testid="icon-up" {...p} />,
  ChevronDown: (p: any) => <svg data-testid="icon-down" {...p} />,
  ChevronsUpDown: (p: any) => <svg data-testid="icon-updown" {...p} />,
  ChevronsLeft: (p: any) => <svg data-testid="icon-first" {...p} />,
  ChevronsRight: (p: any) => <svg data-testid="icon-last" {...p} />,
  ChevronLeft: (p: any) => <svg data-testid="icon-prev" {...p} />,
  ChevronRight: (p: any) => <svg data-testid="icon-next" {...p} />,
}));

/* -------------------------------------------------------
   2) Mock react-datepicker
-------------------------------------------------------- */
vi.mock("react-datepicker", () => ({
  __esModule: true,
  default: (props: any) => (
    <input
      data-testid="datepicker"
      value={props.selected ?? ""}
      onChange={(e) => props.onChange?.(new Date(e.target.value))}
    />
  ),
}));

/* -------------------------------------------------------
   3) Mock XLSX
-------------------------------------------------------- */
vi.mock("xlsx", () => ({
  __esModule: true,
  utils: {
    json_to_sheet: vi.fn(() => ({})),
    book_new: vi.fn(() => ({})),
    book_append_sheet: vi.fn(),
  },
  writeFile: vi.fn(),
}));

import * as XLSX from "xlsx";

/* -------------------------------------------------------
   4) Sample Data
-------------------------------------------------------- */
type TestRow = { id: number; name: string; age: number };

const columns: Column<TestRow>[] = [
  { key: "name", header: "Name", sortable: true },
  { key: "age", header: "Age", sortable: true },
];

const sampleData: TestRow[] = [
  { id: 1, name: "Alice", age: 30 },
  { id: 2, name: "Bob", age: 25 },
  { id: 3, name: "Charlie", age: 35 },
];

/* -------------------------------------------------------
   5) Tests
-------------------------------------------------------- */
describe("DataTable Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /* ---------------------------------------------------
     RENDERS HEADERS + ROWS
  ---------------------------------------------------- */
  it("renders table headers and rows", () => {
    render(<DataTable data={sampleData} columns={columns} />);

    expect(screen.getByText("Name")).toBeInTheDocument();
    expect(screen.getByText("Age")).toBeInTheDocument();

    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("Bob")).toBeInTheDocument();
  });

  /* ---------------------------------------------------
     SEARCH FILTER
  ---------------------------------------------------- */
  it("filters rows using search box", () => {
    render(<DataTable data={sampleData} columns={columns} />);

    const input = screen.getByPlaceholderText("Search...");

    fireEvent.change(input, { target: { value: "alice" } });

    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.queryByText("Bob")).not.toBeInTheDocument();
    expect(screen.queryByText("Charlie")).not.toBeInTheDocument();
  });

  /* ---------------------------------------------------
     SORTING (FIXED VERSION — clicks the sort icon)
  ---------------------------------------------------- */
  it("sorts rows when clicking sortable header", () => {
    render(<DataTable data={sampleData} columns={columns} />);

    // First sort: click the sort icon inside column Age
    let sortIcon = screen.getAllByTestId("icon-updown")[1]; // second column's sort icon
    fireEvent.click(sortIcon); // ASC

    // After first click, icon becomes "icon-up"
    sortIcon = screen.getByTestId("icon-up");
    fireEvent.click(sortIcon); // DESC

    // Now DESC sort means Charlie (age 35) should be first row
    const firstCell = screen.getAllByRole("cell")[0];
    expect(firstCell).toHaveTextContent("Charlie");
  });

  /* ---------------------------------------------------
     EMPTY STATE
  ---------------------------------------------------- */
  it("shows empty state when no data", () => {
    render(
      <DataTable data={[]} columns={columns} emptyMessage="Nothing here" />
    );

    expect(screen.getByText("Nothing here")).toBeInTheDocument();
  });

  /* ---------------------------------------------------
     PAGINATION
  ---------------------------------------------------- */
  it("paginates data correctly", () => {
    render(<DataTable data={sampleData} columns={columns} pageSize={1} />);

    // Page 1 → Alice
    expect(screen.getByText("Alice")).toBeInTheDocument();

    // Next page → Bob
    fireEvent.click(screen.getByTitle("Next page"));
    expect(screen.getByText("Bob")).toBeInTheDocument();
  });

  /* ---------------------------------------------------
     ROW CLICK
  ---------------------------------------------------- */
  it("calls onRowClick when clicking row", () => {
    const mockClick = vi.fn();

    render(
      <DataTable
        data={sampleData}
        columns={columns}
        onRowClick={mockClick}
      />
    );

    fireEvent.click(screen.getByText("Alice"));

    expect(mockClick).toHaveBeenCalledWith(sampleData[0], 0);
  });

  /* ---------------------------------------------------
     EXPORT
  ---------------------------------------------------- */
  it("exports data using XLSX", () => {
    render(<DataTable data={sampleData} columns={columns} />);

    fireEvent.click(screen.getByText("Export"));

    expect(XLSX.utils.json_to_sheet).toHaveBeenCalledTimes(1);
    expect(XLSX.writeFile).toHaveBeenCalledTimes(1);
  });
});