import { useState, useMemo, useEffect, useRef, type ReactNode, Fragment } from "react";

import {
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  Search,
  Download,
  ChevronsLeft,
  ChevronsRight,
  ChevronLeft,
  ChevronRight,
  Filter,
} from "lucide-react";

import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

import * as XLSX from "xlsx";

/* ======================================================
   TYPES
====================================================== */

export interface Column<T extends object = Record<string, unknown>> {
  key: keyof T;
  header: string;
  sortable?: boolean;
  filterable?: boolean;
  filterType?: "text" | "date" | "select";
  filterOptions?: Array<string | { label: string; value: string }>;
  width?: number;
  render?: (value: T[keyof T], row: T, index: number) => ReactNode;
  exportRender?: (value: T[keyof T], row: T) => string | number;
}

export interface ServerTableQuery {
  pageNumber: number;
  pageSize: number;
  searchTerm: string;
  sortBy?: string;
  sortDirection?: "asc" | "desc";
  columnFilters: Record<string, string>;
}

interface InitialServerQuery {
  pageNumber?: number;
  pageSize?: number;
  searchTerm?: string;
  sortBy?: string;
  sortDirection?: "asc" | "desc";
  columnFilters?: Record<string, string>;
}

export interface DataTableProps<T extends object> {
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

  serverSide?: boolean;
  loading?: boolean;
  totalItems?: number;
  initialServerQuery?: InitialServerQuery;
  onServerQueryChange?: (query: ServerTableQuery) => void;
}

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

function toLocalDateTimeString(date: Date): string {
  return [
    date.getFullYear(),
    "-",
    pad2(date.getMonth() + 1),
    "-",
    pad2(date.getDate()),
    "T",
    pad2(date.getHours()),
    ":",
    pad2(date.getMinutes()),
    ":",
    pad2(date.getSeconds()),
  ].join("");
}

function toFilterDateString(date: Date): string {
  const localDate = new Date(date.getTime());
  localDate.setHours(0, 0, 0, 0);
  return toLocalDateTimeString(localDate);
}

function parseFilterDate(value?: string): Date | null {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
}

function normalizeFilterOption(option: string | { label: string; value: string }) {
  if (typeof option === "string") {
    return { label: option, value: option };
  }
  return option;
}

function serializeServerQuery(query: ServerTableQuery): string {
  const sortedFilters = Object.keys(query.columnFilters)
    .sort()
    .reduce<Record<string, string>>((acc, key) => {
      const value = query.columnFilters[key];
      if (!value || value.trim().length === 0) {
        return acc;
      }
      acc[key] = value;
      return acc;
    }, {});

  return JSON.stringify({
    ...query,
    columnFilters: sortedFilters,
  });
}

/* ======================================================
   COMPONENT
====================================================== */

export default function DataTable<T extends object>({
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

  serverSide = false,
  loading = false,
  totalItems,
  initialServerQuery,
  onServerQueryChange,
}: DataTableProps<T>) {
  /* ---------------- State ---------------- */

  const initialPageNumber =
    initialServerQuery?.pageNumber && initialServerQuery.pageNumber > 0
      ? initialServerQuery.pageNumber
      : 1;

  const initialPageSize =
    initialServerQuery?.pageSize && initialServerQuery.pageSize > 0
      ? initialServerQuery.pageSize
      : pageSize;

  const [currentPage, setCurrentPage] = useState(initialPageNumber);
  const [selectedPageSize, setSelectedPageSize] = useState(initialPageSize);
  const [searchTerm, setSearchTerm] = useState(initialServerQuery?.searchTerm ?? "");

  const [sortConfig, setSortConfig] = useState<{
    key: keyof T;
    direction: "asc" | "desc";
  } | null>(
    initialServerQuery?.sortBy
      ? {
          key: initialServerQuery.sortBy as keyof T,
          direction: initialServerQuery.sortDirection ?? "asc",
        }
      : null
  );

  const [columnFilters, setColumnFilters] = useState<Record<string, string>>(
    initialServerQuery?.columnFilters ?? {}
  );

  const [activeFilterKeys, setActiveFilterKeys] = useState<Set<string>>(new Set());
  const lastDispatchedQueryRef = useRef<string>("");

  const serverQuery = useMemo<ServerTableQuery>(
    () => ({
      pageNumber: currentPage,
      pageSize: selectedPageSize,
      searchTerm,
      sortBy: sortConfig ? String(sortConfig.key) : undefined,
      sortDirection: sortConfig?.direction,
      columnFilters,
    }),
    [currentPage, selectedPageSize, searchTerm, sortConfig, columnFilters]
  );

  const serializedServerQuery = useMemo(
    () => serializeServerQuery(serverQuery),
    [serverQuery]
  );

  useEffect(() => {
    if (!serverSide || !onServerQueryChange) return;
    if (serializedServerQuery === lastDispatchedQueryRef.current) return;

    const timerId = window.setTimeout(() => {
      if (serializedServerQuery === lastDispatchedQueryRef.current) {
        return;
      }

      lastDispatchedQueryRef.current = serializedServerQuery;
      onServerQueryChange(serverQuery);
    }, 300);

    return () => window.clearTimeout(timerId);
  }, [
    serverSide,
    onServerQueryChange,
    serverQuery,
    serializedServerQuery,
  ]);

  /* ---------------- Sorting ---------------- */

  const handleSort = (key: keyof T) => {
    setCurrentPage(1);
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
    if (serverSide) {
      return data;
    }

    let result = [...data];

    if (searchable && searchTerm) {
      result = result.filter((row) =>
        columns.some((col) =>
          String(row[col.key] ?? "")
            .toLowerCase()
            .includes(searchTerm.toLowerCase())
        )
      );
    }

    Object.entries(columnFilters).forEach(([key, value]) => {
      if (!value) return;

      const column = columns.find((c) => String(c.key) === key);

      if (column?.filterType === "date") {
        result = result.filter(
          (row) =>
            new Date(row[key as keyof T] as string).toDateString() ===
            new Date(value).toDateString()
        );
      } else if (column?.filterType === "select") {
        result = result.filter(
          (row) =>
            String(row[key as keyof T] ?? "").toLowerCase() === value.toLowerCase()
        );
      } else {
        result = result.filter((row) =>
          String(row[key as keyof T] ?? "")
            .toLowerCase()
            .includes(value.toLowerCase())
        );
      }
    });

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
  }, [serverSide, data, columns, searchable, searchTerm, columnFilters, sortConfig]);

  /* ---------------- Pagination ---------------- */

  const totalRows = serverSide ? totalItems ?? data.length : processedData.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / Math.max(1, selectedPageSize)));

  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * selectedPageSize;

  const pageData = serverSide
    ? processedData
    : processedData.slice(startIndex, startIndex + selectedPageSize);

  /* ---------------- Export ---------------- */

  const handleExport = () => {
    const exportRows: Record<string, string | number | null>[] = processedData.map((row) => {
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
              onChange={(e) => {
                setCurrentPage(1);
                setSearchTerm(e.target.value);
              }}
              placeholder={searchPlaceholder}
              className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm"
            />
          </div>
        )}

        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition-colors"
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
                {columns.map((col) => {
                  const colKey = String(col.key);
                  const hasActiveFilter = columnFilters[colKey] && columnFilters[colKey].trim().length > 0;
                  
                  return (
                    <th
                      key={colKey}
                      style={{ width: col.width }}
                      className="px-5 py-4 text-left select-none"
                    >
                      <div className="flex items-center justify-between text-xs font-bold uppercase text-gray-700">
                        <div className="flex-1">
                          {col.header}
                        </div>

                        <div className="flex items-center gap-1">
                          {/* Filter Icon */}
                          {col.filterable && (
                            <div
                              className={`p-1 rounded cursor-pointer hover:bg-gray-200 transition-colors ${
                                hasActiveFilter ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'
                              }`}
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveFilterKeys((prev) => {
                                  const next = new Set(prev);
                                  if (next.has(colKey)) {
                                    next.delete(colKey);
                                  } else {
                                    next.add(colKey);
                                  }
                                  return next;
                                });
                              }}
                              title="Toggle filter"
                            >
                              <Filter className="w-4 h-4" />
                            </div>
                          )}

                          {/* Sort Icon */}
                          {col.sortable && (
                            <div
                              className="p-1 rounded cursor-pointer hover:bg-gray-200 transition-colors"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSort(col.key);
                              }}
                              title="Sort column"
                            >
                              {getSortIcon(col.key)}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Filter Input/Dropdown */}
                      {col.filterable &&
                        activeFilterKeys.has(colKey) &&
                        (col.filterType === "date" ? (
                          <div className="mt-2" onClick={(e) => e.stopPropagation()}>
                            <DatePicker
                              selected={parseFilterDate(columnFilters[colKey])}
                              onChange={(date: Date | null) => {
                                setCurrentPage(1);
                                setColumnFilters((prev) => ({
                                  ...prev,
                                  [colKey]: date ? toFilterDateString(date) : "",
                                }));
                              }}
                              isClearable
                              className="w-full px-2 py-1 border rounded text-xs"
                              placeholderText="Select date"
                            />
                          </div>
                        ) : col.filterType === "select" ? (
                          <select
                            className="mt-2 w-full px-2 py-1 border rounded text-xs bg-white"
                            value={columnFilters[colKey] || ""}
                            onChange={(e) => {
                              setCurrentPage(1);
                              setColumnFilters((prev) => ({
                                ...prev,
                                [colKey]: e.target.value,
                              }));
                            }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <option value="">All</option>
                            {(col.filterOptions ?? []).map((option) => {
                              const normalized = normalizeFilterOption(option);
                              return (
                                <option key={normalized.value} value={normalized.value}>
                                  {normalized.label}
                                </option>
                              );
                            })}
                          </select>
                        ) : (
                          <input
                            className="mt-2 w-full px-2 py-1 border rounded text-xs"
                            placeholder="Filter..."
                            value={columnFilters[colKey] || ""}
                            onChange={(e) => {
                              setCurrentPage(1);
                              setColumnFilters((prev) => ({
                                ...prev,
                                [colKey]: e.target.value,
                              }));
                            }}
                            onClick={(e) => e.stopPropagation()}
                          />
                        ))}
                    </th>
                  );
                })}
              </tr>
            </thead>

            <tbody className="divide-y">
              {loading && (
                <tr>
                  <td colSpan={columns.length} className="py-12 text-center text-gray-500">
                    Loading...
                  </td>
                </tr>
              )}

              {!loading && pageData.length === 0 && (
                <tr>
                  <td colSpan={columns.length} className="py-12 text-center text-gray-400">
                    {emptyMessage}
                  </td>
                </tr>
              )}

              {!loading &&
                pageData.map((row, i) => {
                  const globalIndex = startIndex + i;
                  const expanded = expandable && isRowExpanded?.(row);
                  const rowId = (row as Record<string, unknown>).id;
                  const rowKey =
                    typeof rowId === "string" || typeof rowId === "number"
                      ? String(rowId)
                      : `${globalIndex}`;

                  return (
                    <Fragment key={rowKey}>
                      <tr
                        className={`hover:bg-blue-50 cursor-pointer ${
                          rowClassName?.(row, globalIndex) || ""
                        }`}
                        onClick={() => onRowClick?.(row, globalIndex)}
                      >
                        {columns.map((col) => (
                          <td key={String(col.key)} className="px-5 py-4 text-sm">
                            {col.render
                              ? col.render(row[col.key], row, globalIndex)
                              : String(row[col.key] ?? "-")}
                          </td>
                        ))}
                      </tr>

                      {expandable && expanded && renderExpandedRow && (
                        <tr>
                          <td colSpan={columns.length} className="bg-gray-50 p-0">
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
          <div className="flex items-center gap-2 text-sm text-gray-700">
            Show
            <select
              value={selectedPageSize}
              onChange={(e) => {
                setCurrentPage(1);
                setSelectedPageSize(Number(e.target.value));
              }}
              className="border rounded px-2 py-1"
            >
              {pageSizeOptions.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            of <span className="font-semibold text-gray-900">{totalRows}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              title="First page"
              disabled={safeCurrentPage <= 1}
              onClick={() => setCurrentPage(1)}
              className="h-9 w-9 inline-flex items-center justify-center rounded-md border bg-white text-gray-700 disabled:opacity-40 hover:bg-gray-50 transition-colors"
            >
              <ChevronsLeft size={16} />
            </button>

            <button
              title="Previous page"
              disabled={safeCurrentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="h-9 w-9 inline-flex items-center justify-center rounded-md border bg-white text-gray-700 disabled:opacity-40 hover:bg-gray-50 transition-colors"
            >
              <ChevronLeft size={16} />
            </button>

            <span className="text-sm px-3 py-1 rounded-md border bg-white text-gray-700">
              Page <b>{safeCurrentPage}</b> of <b>{totalPages}</b>
            </span>

            <button
              title="Next page"
              disabled={safeCurrentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="h-9 w-9 inline-flex items-center justify-center rounded-md border bg-white text-gray-700 disabled:opacity-40 hover:bg-gray-50 transition-colors"
            >
              <ChevronRight size={16} />
            </button>

            <button
              title="Last page"
              disabled={safeCurrentPage >= totalPages}
              onClick={() => setCurrentPage(totalPages)}
              className="h-9 w-9 inline-flex items-center justify-center rounded-md border bg-white text-gray-700 disabled:opacity-40 hover:bg-gray-50 transition-colors"
            >
              <ChevronsRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
