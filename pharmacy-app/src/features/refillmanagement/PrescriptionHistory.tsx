import { useMemo, useState } from "react";
import Button from "@components/common/Button/Button";
interface PrescriptionRecord {
  id: string;
  date: string;
  patientName: string;
  doctorName: string;
  medicines: string[];
  validUntil: string;
}

const DATA: PrescriptionRecord[] = [
  {
    id: "RX001",
    date: "2026-01-05",
    patientName: "Ravi Kumar",
    doctorName: "Dr. Suresh Nair",
    medicines: ["Metformin 500mg", "Atorvastatin 10mg"],
    validUntil: "2026-04-05",
  },
  {
    id: "RX002",
    date: "2025-12-15",
    patientName: "Anjali Sharma",
    doctorName: "Dr. Meera Iyer",
    medicines: ["Amlodipine 5mg"],
    validUntil: "2026-03-15",
  },
  {
    id: "RX003",
    date: "2025-10-10",
    patientName: "Sunil Das",
    doctorName: "Dr. Arjun Rao",
    medicines: ["Pantoprazole 40mg", "Domperidone"],
    validUntil: "2026-01-10",
  },
  {
    id: "RX004",
    date: "2025-08-01",
    patientName: "Meera Nair",
    doctorName: "Dr. Kavya Menon",
    medicines: ["Levothyroxine 50mcg"],
    validUntil: "2025-11-01",
  },
];


const PAGE_SIZE = 5;

export default function PrescriptionHistory() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  const filteredData = useMemo(() => {
    return DATA.filter((p) =>
      `${p.patientName} ${p.doctorName} ${p.medicines.join(" ")}`
        .toLowerCase()
        .includes(search.toLowerCase())
    );
  }, [search]);

  const totalPages = Math.ceil(
    filteredData.length / PAGE_SIZE
  );

  const paginatedData = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredData.slice(start, start + PAGE_SIZE);
  }, [filteredData, page]);

  const today = new Date();

  return (
    <div className="p-5 bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-xl font-semibold text-slate-900">
          Prescription History
        </h1>
        <p className="text-sm text-slate-500">
          Complete record of all issued prescriptions
        </p>
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg shadow-sm px-4 py-3 mb-3">
        <input
          placeholder="Search patient, doctor, or medicine"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="px-4 py-2 text-left">Date</th>
              <th className="px-4 py-2 text-left">Patient</th>
              <th className="px-4 py-2 text-left">Doctor</th>
              <th className="px-4 py-2 text-left">Medicines</th>
              <th className="px-4 py-2 text-left">Valid Until</th>
              <th className="px-4 py-2 text-left">Status</th>
              <th className="px-4 py-2 text-right">Action</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-200">
            {paginatedData.map((p) => {
              const isExpired =
                new Date(p.validUntil) < today;

              return (
                <tr key={p.id}>
                  <td className="px-4 py-2">
                    {new Date(p.date).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-2">
                    {p.patientName}
                  </td>
                  <td className="px-4 py-2">
                    {p.doctorName}
                  </td>
                  <td className="px-4 py-2">
                    <span className="text-sm">
                      {p.medicines[0]}
                    </span>
                    {p.medicines.length > 1 && (
                      <span className="text-xs text-gray-500 ml-1">
                        +{p.medicines.length - 1} more
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2">
                    {new Date(
                      p.validUntil
                    ).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-2">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        isExpired
                          ? "bg-red-100 text-red-700"
                          : "bg-green-100 text-green-700"
                      }`}
                    >
                      {isExpired ? "Expired" : "Active"}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-right">
                    <Button size="sm" variant="secondary">
                      View
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
