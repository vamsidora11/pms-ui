import type { PrescriptionHistoryQueryParams } from "@api/prescription";

export type HistorySortDirection = "asc" | "desc";

export interface HistoryTableQuery {
  pageNumber: number;
  pageSize: number;
  searchTerm?: string;
  status?: string;
  sortBy?: string;
  sortDirection?: HistorySortDirection;
  columnFilters?: Record<string, string>;
}

const SORT_KEY_MAP: Record<string, string> = {
  id: "prescriptionId",
  patientName: "patientName",
  prescriberName: "prescriberName",
  createdAt: "createdAt",
  status: "status",
};

function clean(value?: string): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

function toLocalDateTime(date: Date): string {
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

function toLocalDateTimeString(value?: string): string | undefined {
  const normalized = clean(value);
  if (!normalized) return undefined;

  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) {
    return undefined;
  }

  return toLocalDateTime(date);
}

export function buildHistoryQueryParams(query: HistoryTableQuery): PrescriptionHistoryQueryParams {
  const filters = query.columnFilters ?? {};

  const prescriptionId = clean(filters.id);
  const patientName = clean(filters.patientName);
  const prescriberName = clean(filters.prescriberName);
  const createdAt = toLocalDateTimeString(filters.createdAt);
  const status = clean(query.status ?? filters.status);

  const globalSearch = clean(query.searchTerm);

  return {
    pageNumber: query.pageNumber,
    pageSize: query.pageSize,
    prescriptionId,
    patientName: patientName ?? globalSearch,
    prescriberName,
    createdAt,
    status,
    sortBy: query.sortBy ? SORT_KEY_MAP[query.sortBy] ?? query.sortBy : undefined,
    sortDirection: query.sortDirection,
  };
}

export function calculateAgeFromDob(dob?: string): number | null {
  if (!dob) return null;

  const birthDate = new Date(dob);
  if (Number.isNaN(birthDate.getTime())) return null;

  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();

  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  return age;
}

export function statusStyle(status: string) {
  switch (status) {
    case "Created":
      return "bg-amber-100 text-amber-800 border border-amber-300";
    case "Validated":
    case "Active":
      return "bg-sky-100 text-sky-800 border border-sky-300";
    case "Completed":
      return "bg-emerald-100 text-emerald-800 border border-emerald-300";
    case "Cancelled":
    case "Canceled":
      return "bg-rose-100 text-rose-800 border border-rose-300";
    default:
      return "bg-slate-100 text-slate-700 border border-slate-300";
  }
}

export function formatDateTime(value?: string) {
  if (!value) return { date: "-", time: "-" };

  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return { date: "-", time: "-" };

  return {
    date: d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }),
    time: d.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    }),
  };
}
