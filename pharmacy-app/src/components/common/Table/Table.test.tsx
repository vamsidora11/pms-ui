import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import DataTable, { type Column } from "./Table";
import type { SVGProps } from "react";

/* =========================================================
   ICON MOCK (TS SAFE)
========================================================= */

vi.mock("lucide-react", () => ({
  Search: (p: SVGProps<SVGSVGElement>) => (
    <svg data-testid="icon-search" {...p} />
  ),
  Download: (p: SVGProps<SVGSVGElement>) => (
    <svg data-testid="icon-download" {...p} />
  ),
  Filter: (p: SVGProps<SVGSVGElement>) => (
    <svg data-testid="icon-filter" {...p} />
  ),
  ChevronUp: (p: SVGProps<SVGSVGElement>) => (
    <svg data-testid="icon-up" {...p} />
  ),
  ChevronDown: (p: SVGProps<SVGSVGElement>) => (
    <svg data-testid="icon-down" {...p} />
  ),
  ChevronsUpDown: (p: SVGProps<SVGSVGElement>) => (
    <svg data-testid="icon-updown" {...p} />
  ),
  ChevronsLeft: () => <svg />,
  ChevronsRight: () => <svg />,
  ChevronLeft: () => <svg />,
  ChevronRight: () => <svg />,
}));

/* =========================================================
   DATEPICKER MOCK
========================================================= */
vi.mock("react-datepicker", () => ({
  __esModule: true,
  default: (props: {
    selected?: Date | null;
    onChange?: (date: Date | null) => void;
  }) => (
    <input
      data-testid="datepicker"
      onClick={() => props.onChange?.(new Date("2024-01-01"))}
    />
  ),
}));

/* =========================================================
   XLSX MOCK
========================================================= */

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

/* =========================================================
   TEST DATA
========================================================= */

type Row = {
  id: number;
  name: string;
  age: number;
  role: string;
  date: string;
};

const columns: Column<Row>[] = [
  { key: "name", header: "Name", sortable: true, filterable: true },
  { key: "age", header: "Age", sortable: true },
  {
    key: "role",
    header: "Role",
    filterable: true,
    filterType: "select",
    filterOptions: ["Admin", "User"],
  },
  {
    key: "date",
    header: "Date",
    filterable: true,
    filterType: "date",
  },
];

const data: Row[] = [
  { id: 1, name: "Alice", age: 30, role: "Admin", date: "2024-01-01" },
  { id: 2, name: "Bob", age: 25, role: "User", date: "2024-01-02" },
];

/* =========================================================
   TEST SUITE
========================================================= */

describe("DataTable - High Coverage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders table with data", () => {
    render(<DataTable data={data} columns={columns} />);
    expect(screen.getByText("Alice")).toBeInTheDocument();
  });

  it("filters by search term", () => {
    render(<DataTable data={data} columns={columns} />);
    fireEvent.change(screen.getByPlaceholderText("Search..."), {
      target: { value: "alice" },
    });
    expect(screen.queryByText("Bob")).not.toBeInTheDocument();
  });

  it("text column filter works", () => {
    render(<DataTable data={data} columns={columns} />);
    fireEvent.click(screen.getAllByTestId("icon-filter")[0]);
    fireEvent.change(screen.getByPlaceholderText("Filter..."), {
      target: { value: "Alice" },
    });
    expect(screen.queryByText("Bob")).not.toBeInTheDocument();
  });

  it("select column filter works", () => {
    render(<DataTable data={data} columns={columns} />);
    fireEvent.click(screen.getAllByTestId("icon-filter")[1]);
    fireEvent.change(screen.getByDisplayValue("All"), {
      target: { value: "Admin" },
    });
    expect(screen.queryByText("Bob")).not.toBeInTheDocument();
  });

it("date filter works", async () => {
  render(<DataTable data={data} columns={columns} />);

  // Open Date filter
  fireEvent.click(screen.getAllByTestId("icon-filter")[2]);

  // Click mocked DatePicker
  fireEvent.click(screen.getByTestId("datepicker"));

  await waitFor(() => {
    expect(screen.queryByText("Bob")).not.toBeInTheDocument();
  });
});


  it("sort toggles through states", () => {
    render(<DataTable data={data} columns={columns} />);
    fireEvent.click(screen.getAllByTestId("icon-updown")[0]);
    fireEvent.click(screen.getByTestId("icon-up"));
    fireEvent.click(screen.getByTestId("icon-down"));
  });

  it("pagination next/prev works", () => {
    render(<DataTable data={data} columns={columns} pageSize={1} />);
    fireEvent.click(screen.getByTitle("Next page"));
    expect(screen.getByText("Bob")).toBeInTheDocument();
    fireEvent.click(screen.getByTitle("Previous page"));
  });

  it("changing page size resets page", () => {
    render(<DataTable data={data} columns={columns} pageSize={5} />);
    const select = screen.getByRole("combobox");
    fireEvent.change(select, { target: { value: "10" } });
    expect(select).toHaveValue("10");
  });

  it("row click handler fires", () => {
    const fn = vi.fn();
    render(<DataTable data={data} columns={columns} onRowClick={fn} />);
    fireEvent.click(screen.getByText("Alice"));
    expect(fn).toHaveBeenCalledWith(data[0], 0);
  });

  it("rowClassName applies class", () => {
    render(
      <DataTable
        data={data}
        columns={columns}
        rowClassName={() => "custom-class"}
      />
    );
    expect(screen.getByText("Alice").closest("tr")).toHaveClass(
      "custom-class"
    );
  });

  it("shows loading state", () => {
    render(<DataTable data={data} columns={columns} loading />);
    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("shows empty state", () => {
    render(<DataTable data={[]} columns={columns} />);
    expect(screen.getByText("No data available")).toBeInTheDocument();
  });

  it("expandable rows render expanded content", () => {
    render(
      <DataTable
        data={data}
        columns={columns}
        expandable
        isRowExpanded={() => true}
        renderExpandedRow={() => <div>Expanded Row</div>}
      />
    );

    expect(screen.getAllByText("Expanded Row")).toHaveLength(2);
  });

  it("export calls XLSX", () => {
    render(<DataTable data={data} columns={columns} />);
    fireEvent.click(screen.getByText("Export"));
    expect(XLSX.writeFile).toHaveBeenCalled();
  });

  it("server side triggers query callback", async () => {
    const fn = vi.fn();

    render(
      <DataTable
        data={data}
        columns={columns}
        serverSide
        onServerQueryChange={fn}
      />
    );

    fireEvent.change(screen.getByPlaceholderText("Search..."), {
      target: { value: "Alice" },
    });

    await waitFor(() => {
      expect(fn).toHaveBeenCalled();
    });
  });

  it("applies height style", () => {
    render(<DataTable data={data} columns={columns} height={200} />);
    const wrapper = screen.getByRole("table").parentElement;
    expect(wrapper).toHaveStyle("max-height: 200px");
  });
});
