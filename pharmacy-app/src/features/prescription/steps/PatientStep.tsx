import { AlertTriangle, Search } from "lucide-react";
import type { PatientSummary, PatientDetails } from "../types/models";
import { usePatientSearch } from "../hooks/usePatientSearch";

interface Props {
  patient: PatientDetails | null;
  onChange: (patient: PatientSummary) => void | Promise<void>;

  /** DIP-friendly: allows mocking/search swap later; defaults to API */
  searchFn?: (q: string) => Promise<PatientSummary[] | undefined>;

  debounceMs?: number;
  minChars?: number;
}

function calculateAge(dob: string): number | null {
  if (!dob) return null;
  const birthDate = new Date(dob);
  if (Number.isNaN(birthDate.getTime())) return null;

  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();

  const monthDiff = today.getMonth() - birthDate.getMonth();
  const dayDiff = today.getDate() - birthDate.getDate();
  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) age--;

  return age;
}

export default function PatientStep({
  patient,
  onChange,
  searchFn,
  debounceMs = 300,
  minChars = 2,
}: Props) {
  const {
    query,
    results,
    loading,
    error,
    showResults,
    onQueryChange,
    selectPatient,
    openResults,
  } = usePatientSearch({ searchFn, debounceMs, minChars });

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
      {/* Header */}
      <div className="p-6 border-b border-gray-100">
        <h2 className="text-gray-900 mb-1">Select Patient</h2>
        <p className="text-gray-500">
          Search for an existing patient or create a new one
        </p>
      </div>

      <div className="p-6 space-y-4">
        {/* Search box */}
        <div className="relative">
          <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Search by patient name, phone no. or ID..."
            className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg
                       focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Search Results */}
        {showResults && (
          <div className="border border-gray-200 rounded-lg max-h-64 overflow-y-auto">
            {loading && (
              <div className="p-4 text-center text-gray-500">
                Searching patients...
              </div>
            )}

            {!loading && error && (
              <div className="p-4 text-center text-red-600">{error}</div>
            )}

            {!loading && !error && results.length === 0 && query.trim() && (
              <div className="p-4 text-center text-gray-500">No patients found</div>
            )}

            {!loading &&
              !error &&
              results.map((p) => (
                <button
                  key={p.id}
                  onClick={() => selectPatient(p, onChange)}
                  className="w-full p-4 text-left hover:bg-gray-50 border-b last:border-b-0"
                >
                  <div className="text-gray-900 font-medium">{p.fullName}</div>
                  <div className="text-gray-500 text-sm">
                    {p.id} • {p.phone}
                  </div>
                </button>
              ))}
          </div>
        )}

        {/* Selected Patient Card */}
        {patient && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-blue-900 font-medium">Selected Patient</div>
                <div className="text-blue-800 mt-1">{patient.fullName}</div>
              </div>

              {/* <button
                onClick={openResults}
                className="text-blue-600 text-sm hover:underline"
              >
                Change
              </button> */}
            </div>

            {/* Patient Meta */}
            <div className="grid grid-cols-3 gap-6 text-sm">
              <div>
                <div className="text-gray-500">Patient ID</div>
                <div className="text-gray-900">{patient.id}</div>
              </div>

              <div>
                <div className="text-gray-500">Age / Gender</div>
                <div className="text-gray-900">
                  {calculateAge(patient.dob) ?? "—"}y / {patient.gender}
                </div>
              </div>

              <div>
                <div className="text-gray-500">Phone</div>
                <div className="text-gray-900">{patient.phone}</div>
              </div>
            </div>

            {/* Allergy Warning */}
            {(patient.allergies?.length ?? 0) > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-red-800 font-medium mb-2">
                  <AlertTriangle className="w-4 h-4" />
                  Known Allergies
                </div>
                <div className="flex flex-wrap gap-2">
                  {(patient.allergies ?? []).map((allergy, idx) => (
                    <span
                      key={`${allergy}-${idx}`}
                      className="px-3 py-1 bg-red-100 text-red-700 rounded-md text-sm"
                    >
                      {allergy}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}