import { useMemo, useState } from "react";
import Button from "@components/common/Button/Button";

type RefillStatus = "ELIGIBLE" | "EXHAUSTED" | "EXPIRED";

interface RefillRecord {
  id: string;
  patientName: string;
  medicine: string;
  totalRefills: number;
  refillsUsed: number;
  expiryDate: string;
}

const PAGE_SIZE = 5;

/* ---- mock data here (use DATA from above) ---- */

function getStatus(r: RefillRecord): RefillStatus {
  const remaining = r.totalRefills - r.refillsUsed;
  const today = new Date();
  const expiry = new Date(r.expiryDate);

  if (expiry < today) return "EXPIRED";
  if (remaining === 0) return "EXHAUSTED";
  return "ELIGIBLE";
}

export default function Refill() {
  const [statusFilter, setStatusFilter] =
    useState<RefillStatus | "ALL">("ALL");
  const [page, setPage] = useState(1);

  const filteredData = useMemo(() => {
    return DATA.filter((r) => {
      if (statusFilter === "ALL") return true;
      return getStatus(r) === statusFilter;
    });
  }, [statusFilter]);

  const totalPages = Math.ceil(
    filteredData.length / PAGE_SIZE
  );

  const paginatedData = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredData.slice(start, start + PAGE_SIZE);
  }, [filteredData, page]);

  return (
    <div className="p-5 bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-xl font-semibold text-slate-900">
          Refill Management
        </h1>
        <p className="text-sm text-slate-500">
          Prescription-based refill tracking
        </p>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-lg shadow-sm px-4 py-3 mb-3 flex items-center gap-3">
        <span className="text-sm text-slate-600">
          Filter:
        </span>
        <select
          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value as never);
            setPage(1);
          }}
        >
          <option value="ALL">All</option>
          <option value="ELIGIBLE">Eligible</option>
          <option value="EXHAUSTED">Exhausted</option>
          <option value="EXPIRED">Expired</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="px-4 py-2 text-left">Patient</th>
              <th className="px-4 py-2 text-left">Medicine</th>
              <th className="px-4 py-2 text-left">Allowed</th>
              <th className="px-4 py-2 text-left">Used</th>
              <th className="px-4 py-2 text-left">Remaining</th>
              <th className="px-4 py-2 text-left">Expiry</th>
              <th className="px-4 py-2 text-left">Status</th>
              <th className="px-4 py-2 text-right">Action</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-200">
            {paginatedData.map((r) => {
              const remaining =
                r.totalRefills - r.refillsUsed;
              const status = getStatus(r);

              return (
                <tr key={r.id}>
                  <td className="px-4 py-2">
                    {r.patientName}
                  </td>
                  <td className="px-4 py-2">
                    {r.medicine}
                  </td>
                  <td className="px-4 py-2">
                    {r.totalRefills}
                  </td>
                  <td className="px-4 py-2">
                    {r.refillsUsed}
                  </td>
                  <td className="px-4 py-2 font-medium">
                    {remaining}
                  </td>
                  <td className="px-4 py-2">
                    {new Date(
                      r.expiryDate
                    ).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-2">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        status === "ELIGIBLE"
                          ? "bg-green-100 text-green-700"
                          : status === "EXHAUSTED"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {status}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-right">
                    <Button
                      size="sm"
                      disabled={status !== "ELIGIBLE"}
                    >
                      Refill
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t">
          <span className="text-sm text-gray-500">
            Page {page} of {totalPages}
          </span>

          <div className="flex gap-2">
            <Button
              size="sm"
              variant="secondary"
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </Button>
            <Button
              size="sm"
              variant="secondary"
              disabled={page === totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
const DATA: RefillRecord[] = [
  {
    id: "1",
    patientName: "Ravi Kumar",
    medicine: "Metformin 500mg",
    totalRefills: 3,
    refillsUsed: 1,
    expiryDate: "2026-02-10",
  },
  {
    id: "2",
    patientName: "Anjali Sharma",
    medicine: "Amlodipine 5mg",
    totalRefills: 2,
    refillsUsed: 2,
    expiryDate: "2026-01-05",
  },
  {
    id: "3",
    patientName: "Sunil Das",
    medicine: "Atorvastatin 10mg",
    totalRefills: 1,
    refillsUsed: 0,
    expiryDate: "2026-03-20",
  },
  {
    id: "4",
    patientName: "Meera Nair",
    medicine: "Levothyroxine 50mcg",
    totalRefills: 3,
    refillsUsed: 3,
    expiryDate: "2025-12-01",
  },
  {
    id: "5",
    patientName: "Arjun Patel",
    medicine: "Pantoprazole 40mg",
    totalRefills: 2,
    refillsUsed: 1,
    expiryDate: "2026-04-15",
  },
  {
    id: "6",
    patientName: "Neha Verma",
    medicine: "Losartan 50mg",
    totalRefills: 2,
    refillsUsed: 0,
    expiryDate: "2026-05-10",
  },
  {
    id: "7",
    patientName: "Kiran Rao",
    medicine: "Insulin Glargine",
    totalRefills: 1,
    refillsUsed: 1,
    expiryDate: "2025-11-20",
  },
  {
    id: "8",
    patientName: "Suresh Menon",
    medicine: "Clopidogrel 75mg",
    totalRefills: 3,
    refillsUsed: 2,
    expiryDate: "2026-06-01",
  },
];
