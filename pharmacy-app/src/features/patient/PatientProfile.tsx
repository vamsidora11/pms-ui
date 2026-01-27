import { useState, useEffect, useRef } from "react";
import {
  Search,
  User,
  Phone,
  Mail,
  MapPin,
  AlertTriangle,
  Calendar,
  Plus,
} from "lucide-react";

import AddPatientModal from "./addpatient";
import UpdatePatientModal from "./updatePatient";

import { createPatient, getPatientDetails, searchPatients } from "@api/patient";
import type {
  PatientDetailsDto,
  PatientSummaryDto,
} from "@store/patient/patienttype";
import clsx from "clsx";

/* =========================
   Small utilities
========================= */
function useDebouncedValue<T>(value: T, delay = 250) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

/* =========================
   Types
========================= */
interface Prescription {
  id: string;
  patientId: string;
  medicationsCount: number;
  status: "Pending" | "Rejected" | "Approved";
}

/* =========================
   Component
========================= */
export default function PatientProfiles() {
  // Directory state
  const [patients, setPatients] = useState<PatientSummaryDto[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebouncedValue(searchTerm, 250); // tweak to 0 if you want true per-key calls
  const [listLoading, setListLoading] = useState(false);
  const [listError, setListError] = useState<string | null>(null);

  // Selection + details
  const [selectedPatient, setSelectedPatient] =
    useState<PatientDetailsDto | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);

  // Prescriptions (kept as-is; to be wired later)
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);

  // Track first successful search to auto-select first item only once
  const autoSelectedOnceRef = useRef(false);

  // AbortController for list search (works with fetch-based layers).
  const listAbortRef = useRef<AbortController | null>(null);

  // ---------------------------
  // Server-side search on type
  // ---------------------------
  useEffect(() => {
    // Cancel any in-flight search
    listAbortRef.current?.abort();
    const controller = new AbortController();
    listAbortRef.current = controller;

    const load = async () => {
      setListLoading(true);
      setListError(null);

      try {
        // Decide minimum chars to search
        // For "every letter", keep >= 1; to reduce noise, you can set to 2 or 3.
        const q = (debouncedSearch ?? "").trim();
        const shouldQuery = q.length >= 1; // change to 0 if you want initial "all patients" load
        const result = await searchPatients(shouldQuery ? q : "", {
          signal: controller.signal,
        } as any);
        setPatients(result);

        // Auto-select first patient only once after first meaningful search result
        if (!autoSelectedOnceRef.current && result.length > 0) {
          autoSelectedOnceRef.current = true;
          await selectPatient(result[0].id);
        }

        // If the current selected patient is not in result set, clear it (optional behavior)
        if (
          selectedPatient &&
          !result.some((p) => p.id === selectedPatient.id)
        ) {
          setSelectedPatient(null);
          setPrescriptions([]);
        }
      } catch (err: any) {
        if (err?.name === "AbortError") return; // user typed again; ignore
        console.error("searchPatients failed:", err);
        setListError(err?.message || "Failed to fetch patients");
        setPatients([]);
      } finally {
        setListLoading(false);
      }
    };

    load();

    return () => {
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  // ---------------------------
  // Selecting a patient loads details
  // ---------------------------

  const selectPatient = async (patientId: string) => {
    try {
      setDetailsLoading(true);
      setDetailsError(null);
      const details = await getPatientDetails(patientId);
      setSelectedPatient(details);
      // TODO: fetch prescriptions for this patient from backend
      setPrescriptions([]); // placeholder until you wire prescriptions API
    } catch (err: any) {
      console.error("getPatientDetails failed:", err);
      setDetailsError(err?.message || "Failed to load patient details");
      setSelectedPatient(null);
    } finally {
      setDetailsLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Patient Profiles
          </h1>
          <p className="text-gray-500">
            View patient demographics and medical information
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-blue-600 to-teal-500 text-white rounded-xl shadow"
        >
          <Plus size={18} />
          Add New Patient
        </button>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Patient Directory */}
        <div className="bg-white rounded-2xl border shadow-sm">
          <div className="p-4 border-b">
            <h2 className="font-semibold mb-3">Patient Directory</h2>
            <div className="relative">
              <Search
                className="absolute left-3 top-2.5 text-gray-400"
                size={18}
              />
              <input
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  // Reset the auto-select logic if user clears and re-types
                  if (e.target.value.length === 0) {
                    autoSelectedOnceRef.current = false;
                  }
                }}
                placeholder="Search by name, ID, or phone..."
                className="w-full pl-10 pr-3 py-2 bg-gray-50 border rounded-lg"
              />
            </div>
          </div>

          <div className="p-3 space-y-2 max-h-[600px] overflow-y-auto">
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
              <div className="p-4 text-center text-gray-500">
                No patients found
              </div>
            )}

            {/* Results */}
            {!listLoading &&
              !listError &&
              patients.map((p) => (
                <button
                  key={p.id}
                  onClick={async () => {
                    await selectPatient(p.id);
                  }}
                  className={clsx(
                    "w-full p-4 text-left rounded-xl transition",
                    selectedPatient?.id === p.id
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

        {/* Patient Details */}
        <div className="col-span-2 space-y-6">
          {/* Detail loading / errors */}
          {detailsLoading && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl border shadow-sm h-48 animate-pulse" />
              <div className="bg-white rounded-2xl border shadow-sm h-32 animate-pulse" />
              <div className="bg-white rounded-2xl border shadow-sm h-40 animate-pulse" />
            </div>
          )}

          {!detailsLoading && detailsError && (
            <div className="p-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg">
              {detailsError}
            </div>
          )}

          {!detailsLoading && !detailsError && selectedPatient && (
            <>
              {/* Demographics */}
              <Section title="Patient Demographics">
                <Info
                  icon={User}
                  label="Full Name"
                  value={selectedPatient.fullName}
                />
                <Info
                  icon={Calendar}
                  label="Date of Birth"
                  value={new Date(selectedPatient.dob).toLocaleDateString()}
                />
                <Info
                  icon={Phone}
                  label="Phone"
                  value={selectedPatient.phone}
                />
                <Info
                  icon={Mail}
                  label="Email"
                  value={selectedPatient.email ?? ""}
                />
                <Info
                  icon={MapPin}
                  label="Address"
                  value={selectedPatient.address}
                />
                <Info
                  icon={User}
                  label="Gender"
                  value={selectedPatient.gender}
                />
              </Section>

              {/* Known Allergies */}
              <div className="bg-white rounded-2xl border shadow-sm">
                <div className="p-6 border-b flex items-center gap-2">
                  <AlertTriangle className="text-red-600" />
                  <h2 className="font-semibold">Known Allergies</h2>
                </div>

                <div className="p-6 flex gap-2 flex-wrap">
                  {Array.isArray(selectedPatient?.allergies) &&
                  selectedPatient.allergies.length > 0 ? (
                    selectedPatient.allergies.map((label, idx) => {
                      const text = (label ?? "").toString().trim();
                      if (!text) return null;
                      return (
                        <span
                          key={`${text}-${idx}`}
                          className="px-4 py-2 bg-red-100 text-red-700 rounded-lg"
                          title={text}
                        >
                          {text}
                        </span>
                      );
                    })
                  ) : (
                    <span className="text-gray-500">
                      No known allergies documented
                    </span>
                  )}
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => setShowUpdateModal(true)}
                  className="px-4 py-2 bg-green-400 text-white rounded-lg hover:bg-green-200"
                >
                  Update Patient
                </button>
              </div>

              {/* Prescriptions */}
              <div className="bg-white rounded-2xl border shadow-sm">
                <div className="p-6 border-b">
                  <h2 className="font-semibold">Active Prescriptions</h2>
                </div>
                <div className="p-6 space-y-3">
                  {prescriptions.length ? (
                    prescriptions.map((rx) => (
                      <div
                        key={rx.id}
                        className="flex justify-between items-center p-4 bg-gray-50 rounded-lg"
                      >
                        <div>
                          <div className="font-medium">{rx.id}</div>
                          <div className="text-sm text-gray-500">
                            {rx.medicationsCount} medication(s)
                          </div>
                        </div>
                        <span
                          className={clsx("px-3 py-1 rounded-full text-sm", {
                            "bg-yellow-100 text-yellow-700":
                              rx.status === "Pending",
                            "bg-green-100 text-green-700":
                              rx.status === "Approved",
                            "bg-red-100 text-red-700": rx.status === "Rejected",
                            "bg-gray-100 text-gray-700": ![
                              "Pending",
                              "Approved",
                              "Rejected",
                            ].includes(rx.status),
                          })}
                        >
                          {rx.status}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="text-gray-500 text-center">
                      No prescriptions found
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Add Patient Modal */}
      {showAddModal && (
        <AddPatientModal
          onClose={() => setShowAddModal(false)}
          onSave={async (request) => {
            try {
              const {patientId} = await createPatient(request);
              const details = await getPatientDetails(patientId);
              // Optionally refetch the server list for the current query instead of pushing locally:
              const refreshed = await searchPatients(
                (debouncedSearch ?? "").trim(),
              );
              setPatients(refreshed);
              setSelectedPatient(details);
              setShowAddModal(false);
            } catch (err) {
              console.error("Failed to add patient", err);
              alert("Error adding patient");
            }
          }}
        />
      )}

      {/* Update Patient Modal */}
      {showUpdateModal && selectedPatient && (
        <UpdatePatientModal
          patient={selectedPatient}
          onClose={() => setShowUpdateModal(false)}
          onSave={async (updated) => {
            // Update details pane immediately
            setSelectedPatient(updated);
            // Also refresh list from server to keep it the source of truth
            const refreshed = await searchPatients(
              (debouncedSearch ?? "").trim(),
            );
            setPatients(refreshed);
            setShowUpdateModal(false);
          }}
        />
      )}
    </div>
  );
}

/* =========================
   Reusable UI Helpers
========================= */
function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl border shadow-sm">
      <div className="p-6 border-b">
        <h2 className="font-semibold">{title}</h2>
      </div>
      <div className="p-6 grid grid-cols-2 gap-6">{children}</div>
    </div>
  );
}

function Info({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="flex gap-3">
      <Icon className="text-gray-400 mt-1" size={18} />
      <div>
        <div className="text-sm text-gray-500">{label}</div>
        <div className="text-gray-900">{value || "—"}</div>
      </div>
    </div>
  );
}
