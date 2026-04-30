import { Search } from "lucide-react";
import clsx from "clsx";
import type { PatientSummaryDto } from "@patient/types/patienttype";

type Props = {
  patients: PatientSummaryDto[];
  searchTerm: string;
  onSearchTermChange: (value: string) => void;

  listLoading: boolean;
  listError: string | null;

  selectedPatientId?: string | null;
  onSelectPatient: (patientId: string) => Promise<void> | void;
};

export default function PatientDirectoryPanel({
  patients,
  searchTerm,
  onSearchTermChange,
  listLoading,
  listError,
  selectedPatientId,
  onSelectPatient,
}: Props) {
  return (
    // ✅ h-full to fill the grid cell, flex-col for header+list, and min-h-0 so the list can shrink and scroll
    <div className="bg-white rounded-2xl border shadow-sm h-full flex flex-col min-h-0">
      {/* ✅ Sticky header */}
      <div className="p-4 border-b sticky top-0 bg-white z-10">
        <h2 className="font-semibold mb-3">Patient Directory</h2>
        <div className="relative">
          <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
          <input
            type="search"
            name="patient-directory-search"
            value={searchTerm}
            onChange={(e) => onSearchTermChange(e.target.value)}
            placeholder="Search by name, ID, or phone..."
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="none"
            inputMode="search"
            spellCheck={false}
            aria-autocomplete="none"
            data-lpignore="true"
            className="w-full pl-10 pr-3 py-2 bg-gray-50 border rounded-lg"
          />
        </div>
      </div>

      {/* ✅ List fills remaining height and scrolls */}
      <div className="p-3 space-y-2 overflow-y-auto flex-1">
        {/* Loading state */}
        {listLoading && (
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="p-4 rounded-xl border bg-gray-50 animate-pulse h-16"
              />
            ))}
          </div>
        )}

        {/* Error state */}
        {!listLoading && listError && (
          <div className="p-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg">
            {listError}
          </div>
        )}

        {/* Empty state */}
        {!listLoading && !listError && patients.length === 0 && (
          <div className="p-4 text-center text-gray-500">No patients found</div>
        )}

        {/* Results */}
        {!listLoading &&
          !listError &&
          patients.map((p) => (
            <button
              key={p.id}
              onClick={() => onSelectPatient(p.id)}
              className={clsx(
                "w-full p-4 text-left rounded-xl transition duration-150",
                selectedPatientId === p.id
                  ? "bg-blue-50 ring-2 ring-blue-400"
                  : "hover:bg-gray-50 border",
              )}
            >
              <div className="font-medium">{p.fullName}</div>
              <div className="text-sm text-gray-500">{p.id}</div>
              <div className="text-sm text-gray-500">{p.phone}</div>
            </button>
          ))}
      </div>
    </div>
  );
}
