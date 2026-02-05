import { useMemo, useState } from "react";
import {
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  Search,
} from "lucide-react";

/* ---------- TYPES ---------- */

export interface Column<T> {
  key: keyof T;
  header: string;
  sortable?: boolean;
  render?: (value: T[keyof T], row: T) => React.ReactNode;
}

interface Props<T extends Record<string, unknown>> {
  data: T[];
  columns: Column<T>[];
  pageSize?: number;
  height?: number;
  searchPlaceholder?: string;
}

/* ---------- HELPER ---------- */

function getValue<T, K extends keyof T>(row: T, key: K): T[K] {
  return row[key];
}

/* ---------- COMPONENT ---------- */

export default function DataTable<T extends Record<string, unknown>>({
  data,
  columns,
  pageSize = 10,
  height = 400,
  searchPlaceholder = "Search...",
}: Props<T>) {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<keyof T | null>(null);
  const [dir, setDir] = useState<"asc" | "desc">("asc");

  /* Search */
  const filtered = useMemo(() => {
    return data.filter((row) =>
      Object.values(row)
        .join(" ")
        .toLowerCase()
        .includes(search.toLowerCase())
    );
  }, [data, search]);

  /* Sort */
  const sorted = useMemo(() => {
    if (!sortKey) return filtered;

    return [...filtered].sort((a, b) => {
      const aVal = getValue(a, sortKey);
      const bVal = getValue(b, sortKey);

      if (aVal < bVal) return dir === "asc" ? -1 : 1;
      if (aVal > bVal) return dir === "asc" ? 1 : -1;
      return 0;
    });
  }, [filtered, sortKey, dir]);

  return (
    <div className="space-y-3">

      {/* Search */}
      <div className="relative w-64">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={searchPlaceholder}
          className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm"
        />
      </div>

      {/* Table */}
      <div style={{ height }} className="overflow-auto border rounded-xl">
        <table className="w-full">

          <thead className="bg-gray-50 sticky top-0">
            <tr>
              {columns.map((c) => (
                <th
                  key={String(c.key)}
                  className="px-4 py-3 text-left text-xs font-bold text-gray-600"
                  onClick={() => {
                    if (!c.sortable) return;
                    setSortKey(c.key);
                    setDir((d) => (d === "asc" ? "desc" : "asc"));
                  }}
                >
                  <div className="flex items-center gap-1 cursor-pointer">
                    {c.header}
                    {!c.sortable && null}
                    {c.sortable && sortKey !== c.key && (
                      <ChevronsUpDown size={14} />
                    )}
                    {sortKey === c.key &&
                      (dir === "asc" ? (
                        <ChevronUp size={14} />
                      ) : (
                        <ChevronDown size={14} />
                      ))}
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {sorted.slice(0, pageSize).map((row, i) => (
              <tr key={i} className="border-t hover:bg-blue-50">
                {columns.map((c) => (
                  <td key={String(c.key)} className="px-4 py-3 text-sm">
                    {c.render
                      ? c.render(getValue(row, c.key), row)
                      : String(getValue(row, c.key))}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>

        </table>
      </div>
    </div>
  );
}
