import {
  useState,
  useMemo,
  type ReactNode,
  Fragment,
} from "react";
 
import {
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  Search,
  Download,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
 
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
 
import * as XLSX from "xlsx";
 
/* ======================================================
   TYPES
====================================================== */
 
export interface Column<T = unknown> {
  key: keyof T;
  header: string;
  sortable?: boolean;
  filterable?: boolean;
  filterType?: "text" | "date";
  width?: number;
  render?: (value: T[keyof T], row: T, index: number) => ReactNode;
  exportRender?: (value: T[keyof T], row: T) => string | number;
}
 
export interface DataTableProps<T extends Record<string, unknown>> {
  data: T[];
  columns: Column<T>[];
 
  pageSize?: number;
  pageSizeOptions?: number[];
 
  searchable?: boolean;
  searchPlaceholder?: string;
 
  exportFileName?: string;
 
  onRowClick?: (row: T, index: number) => void;
  rowClassName?: (row: T, index: number) => string;
 
  emptyMessage?: string;
  height?: number;
 
  expandable?: boolean;
  renderExpandedRow?: (row: T, index: number) => ReactNode;
  isRowExpanded?: (row: T) => boolean;
}
 
/* ======================================================
   COMPONENT
====================================================== */
 
export default function DataTable<T extends Record<string, unknown>>({
  data,
  columns,
 
  pageSize = 10,
  pageSizeOptions = [5, 10, 20, 50],
 
  searchable = true,
  searchPlaceholder = "Search...",
  exportFileName = "export",
 
  onRowClick,
  rowClassName,
  emptyMessage = "No data available",
  height,
 
  expandable = false,
  renderExpandedRow,
  isRowExpanded,
}: DataTableProps<T>) {
  /* ---------------- State ---------------- */
 
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedPageSize, setSelectedPageSize] = useState(pageSize);
  const [searchTerm, setSearchTerm] = useState("");
 
  const [sortConfig, setSortConfig] = useState<{
    key: keyof T;
    direction: "asc" | "desc";
  } | null>(null);
 
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>(
    {}
  );
 
  const [activeFilterKeys, setActiveFilterKeys] = useState<Set<string>>(
    new Set()
  );
 
  /* ---------------- Sorting ---------------- */
 
  const handleSort = (key: keyof T) => {
    setSortConfig((prev) => {
      if (!prev || prev.key !== key) {
        return { key, direction: "asc" };
      }
      if (prev.direction === "asc") {
        return { key, direction: "desc" };
      }
      return null;
    });
  };
 
  /* ---------------- Data processing ---------------- */
 
  const processedData = useMemo(() => {
    let result = [...data];
 
    // Global search
    if (searchable && searchTerm) {
      result = result.filter((row) =>
        columns.some((col) =>
          String(row[col.key] ?? "")
            .toLowerCase()
            .includes(searchTerm.toLowerCase())
        )
      );
    }
 
    // Column filters
    Object.entries(columnFilters).forEach(([key, value]) => {
      if (!value) return;
 
      const column = columns.find((c) => String(c.key) === key);
 
      if (column?.filterType === "date") {
        result = result.filter(
          (row) =>
            new Date(row[key as keyof T] as string).toDateString() ===
            new Date(value).toDateString()
        );
      } else {
        result = result.filter((row) =>
          String(row[key as keyof T] ?? "")
            .toLowerCase()
            .includes(value.toLowerCase())
        );
      }
    });
 
    // Sorting
    if (sortConfig) {
      result.sort((a, b) => {
        const aVal = a[sortConfig.key];
        const bVal = b[sortConfig.key];
        if (aVal === bVal) return 0;
 
        return sortConfig.direction === "asc"
          ? String(aVal).localeCompare(String(bVal))
          : String(bVal).localeCompare(String(aVal));
      });
    }
 
    return result;
  }, [data, columns, searchTerm, columnFilters, sortConfig, searchable]);
 
  /* ---------------- Pagination ---------------- */
 
const totalPages = Math.ceil(processedData.length / selectedPageSize);
 
// ✅ Derive safe current page (no effect needed!)
const safeCurrentPage = totalPages === 0 ? 1 : Math.min(currentPage, totalPages);
const startIndex = (safeCurrentPage - 1) * selectedPageSize;
 
const pageData = processedData.slice(
  startIndex,
  startIndex + selectedPageSize
);
 
  /* ---------------- Export ---------------- */
 
  const handleExport = () => {
    const exportRows: Record<string, string | number | null>[] =
      processedData.map((row) => {
        const out: Record<string, string | number | null> = {};
        columns.forEach((col) => {
          out[col.header] = row[col.key] as string | number | null;
        });
        return out;
      });
 
    const sheet = XLSX.utils.json_to_sheet(exportRows);
    const book = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(book, sheet, "Data");
    XLSX.writeFile(book, `${exportFileName}.xlsx`);
  };
 
  /* ---------------- Icons ---------------- */
 
  const getSortIcon = (key: keyof T) => {
    if (!sortConfig || sortConfig.key !== key) {
      return <ChevronsUpDown className="w-4 h-4 text-gray-400" />;
    }
    return sortConfig.direction === "asc" ? (
      <ChevronUp className="w-4 h-4 text-blue-600" />
    ) : (
      <ChevronDown className="w-4 h-4 text-blue-600" />
    );
  };
 
  const maxHeight = height ? `${height}px` : "600px";
 
  /* ======================================================
     RENDER
  ====================================================== */
 
  return (
    <div className="w-full space-y-4">
      {/* Controls */}
      <div className="flex justify-between items-center gap-4 bg-white p-4 border rounded-lg">
        {searchable && (
          <div className="relative max-w-md w-full">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm"
            />
          </div>
        )}
 
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm"
        >
          <Download size={16} />
          Export
        </button>
      </div>
 
      {/* Table */}
      <div className="bg-white border rounded-xl overflow-hidden">
        <div className="overflow-auto" style={{ maxHeight }}>
          <table className="w-full">
            <thead className="bg-gray-50 sticky top-0 z-10 border-b">
              <tr>
                {columns.map((col) => (
                  <th
                    key={String(col.key)}
                    style={{ width: col.width }}
                    className="px-5 py-4 text-left select-none"
                  >
                    <div className="flex items-center justify-between text-xs font-bold uppercase text-gray-700">
                      <div
                        className="flex-1 cursor-pointer hover:text-blue-600"
                        onClick={() => {
                          if (!col.filterable) return;
                          setActiveFilterKeys((prev) => {
                            const next = new Set(prev);
                            const key = String(col.key);
                            if (next.has(key)) {
                              next.delete(key);
                            } else {
                              next.add(key);
                            }
                            return next;
                          });
                        }}
                      >
                        {col.header}
                      </div>
 
                      {col.sortable && (
                        <div
                          className="ml-2 cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSort(col.key);
                          }}
                        >
                          {getSortIcon(col.key)}
                        </div>
                      )}
                    </div>
 
                    {col.filterable &&
                      activeFilterKeys.has(String(col.key)) && (
                        col.filterType === "date" ? (
                          <div
                            className="mt-2"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <DatePicker
                              selected={
                                columnFilters[String(col.key)]
                                  ? new Date(
                                      columnFilters[String(col.key)]
                                    )
                                  : null
                              }
                              onChange={(date: Date | null) =>
                                setColumnFilters((prev) => ({
                                  ...prev,
                                  [String(col.key)]: date
                                    ? date.toISOString()
                                    : "",
                                }))
                              }
                              isClearable
                              className="w-full px-2 py-1 border rounded text-xs"
                              placeholderText="Select date"
                            />
                          </div>
                        ) : (
                          <input
                            className="mt-2 w-full px-2 py-1 border rounded text-xs"
                            placeholder="Filter..."
                            value={columnFilters[String(col.key)] || ""}
                            onChange={(e) =>
                              setColumnFilters((prev) => ({
                                ...prev,
                                [String(col.key)]: e.target.value,
                              }))
                            }
                          />
                        )
                      )}
                  </th>
                ))}
              </tr>
            </thead>
 
            <tbody className="divide-y">
              {pageData.length === 0 && (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="py-12 text-center text-gray-400"
                  >
                    {emptyMessage}
                  </td>
                </tr>
              )}
 
              {pageData.map((row, i) => {
                const globalIndex = startIndex + i;
                const expanded =
                  expandable && isRowExpanded?.(row);
 
                return (
                  <Fragment key={globalIndex}>
                    <tr
                      className={`hover:bg-blue-50 cursor-pointer ${
                        rowClassName?.(row, globalIndex) || ""
                      }`}
                      onClick={() => onRowClick?.(row, globalIndex)}
                    >
                      {columns.map((col) => (
                        <td
                          key={String(col.key)}
                          className="px-5 py-4 text-sm"
                        >
                          {col.render
                            ? col.render(
                                row[col.key],
                                row,
                                globalIndex
                              )
                            : String(row[col.key] ?? "—")}
                        </td>
                      ))}
                    </tr>
 
                    {expandable && expanded && renderExpandedRow && (
                      <tr>
                        <td
                          colSpan={columns.length}
                          className="bg-gray-50 p-0"
                        >
                          {renderExpandedRow(row, globalIndex)}
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
 
        {/* Pagination */}
        <div className="flex justify-between items-center px-5 py-4 border-t bg-gray-50">
          <div className="flex items-center gap-2 text-sm">
            Show
            <select
              value={selectedPageSize}
              onChange={(e) =>
                setSelectedPageSize(Number(e.target.value))
              }
              className="border rounded px-2 py-1"
            >
              {pageSizeOptions.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            of {processedData.length}
          </div>
 
          <div className="flex items-center gap-3">
            <button
              disabled={currentPage === 1}
              onClick={() =>
                setCurrentPage((p) => Math.max(1, p - 1))
              }
              className="p-2 disabled:opacity-40"
            >
              <ChevronLeft size={18} />
            </button>
 
            <span className="text-sm">
              Page <b>{currentPage}</b> of <b>{totalPages}</b>
            </span>
 
            <button
              disabled={currentPage === totalPages}
              onClick={() =>
                setCurrentPage((p) => Math.min(totalPages, p + 1))
              }
              className="p-2 disabled:opacity-40"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
 