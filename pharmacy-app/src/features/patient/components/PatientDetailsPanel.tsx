import {
  User,
  Phone,
  Mail,
  MapPin,
  AlertTriangle,
  Calendar,
  Users,
  Search,
  FileText,
  UserCircle2,
  CalendarDays,
  Pill,
} from "lucide-react";
import type { ElementType, ReactNode } from "react";
import type { PatientDetailsDto } from "@patient/types/patienttype";
import type { PrescriptionSummaryDto } from "@prescription/types/prescription.types";
import { formatDate } from "../../../utils/format";
import clsx from "clsx";

/** Compact, aesthetic card for a single prescription summary */
function PrescriptionItem({ rx }: { rx: PrescriptionSummaryDto }) {
  const statusClass = clsx(
    "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
    {
      "bg-yellow-100 text-yellow-800": rx.status === "Created",
      "bg-green-100 text-green-700": rx.status === "Active",
      "bg-red-100 text-red-700": rx.status === "Cancelled",
    },
  );
  return (
    <div className="group rounded-xl border border-gray-200 bg-white p-4 shadow-sm hover:shadow transition">
      {/* Top row: ID + status + optional review badge */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText size={16} className="text-gray-400" />
          <div className="font-medium text-gray-900">{rx.id}</div>
        </div>
        <div className="flex items-center gap-2">
          <span className={statusClass}>{rx.status}</span>
        </div>
      </div>

      {/* Divider */}
      <div className="my-3 h-px bg-gray-100" />

      {/* Meta row: Date(s) + Prescriber */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm items-start">
        {/* Issued */}
        <div className="flex items-start gap-2 text-gray-600">
          <CalendarDays size={16} className="text-gray-400 shrink-0 mt-0.5" />
          <div className="whitespace-normal break-words">
            <span className="text-gray-500">Issued: </span>
            <span className="text-gray-800">{formatDate(rx.createdAt)}</span>
          </div>
        </div>

        {/* Prescriber (spans more width on md+ so it rarely wraps, but will wrap if needed) */}
        {rx.prescriberName && (
          <div className="flex items-start gap-2 text-gray-600 md:col-span-2">
            <UserCircle2 size={16} className="text-gray-400 shrink-0 mt-0.5" />
            <div className="whitespace-normal break-words">
              <span className="text-gray-500">Prescriber: </span>
              <span className="text-gray-800">{rx.prescriberName}</span>
            </div>
          </div>
        )}
      </div>

      {/* Footer row: counts + issues */}
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <span className="inline-flex items-center gap-1.5 rounded-lg bg-gray-50 px-2.5 py-1 text-xs text-gray-700">
          <Pill size={14} className="text-gray-500" />
          {rx.medicineCount} medicine{rx.medicineCount === 1 ? "" : "s"}
        </span>
      </div>
    </div>
  );
}

type Props = {
  selectedPatient: PatientDetailsDto | null;
  detailsLoading: boolean;
  detailsError: string | null;
  prescriptions: PrescriptionSummaryDto[];

  onClickUpdate: () => void;
};

export default function PatientDetailsPanel({
  selectedPatient,
  detailsLoading,
  detailsError,
  prescriptions,
  onClickUpdate,
}: Props) {
  // Empty state (unchanged)
  if (!detailsLoading && !detailsError && !selectedPatient) {
    return (
      <div className="col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-10">
        <div className="flex flex-col items-center text-center">
          <div className="h-14 w-14 rounded-full bg-blue-50 flex items-center justify-center mb-4">
            <Users className="text-blue-600" size={26} />
          </div>

          <h2 className="text-lg font-semibold text-gray-900">
            Select a patient to view details
          </h2>
          <p className="text-sm text-gray-500 mt-2 max-w-md">
            Choose a patient from the list to load demographics, allergies, and
            active prescriptions.
          </p>

          <div className="mt-6 w-full max-w-lg rounded-xl border border-dashed border-gray-200 bg-gray-50 p-5">
            <div className="flex items-center justify-center gap-2 text-sm font-medium text-gray-700">
              <Search size={16} className="text-gray-500" />
              Quick steps
            </div>

            <ul className="mt-3 space-y-2 text-sm text-gray-600 text-center">
              <li className="flex justify-center items-center gap-2">
                <span className="mt-[7px] h-1.5 w-1.5 rounded-full bg-gray-400" />
                Search by id/name/phone in the left panel
              </li>
              <li className="flex justify-center items-center gap-2">
                <span className="mt-[7px] h-1.5 w-1.5 rounded-full bg-gray-400" />
                Click a patient to load details here
              </li>
              <li className="flex justify-center items-center gap-2">
                <span className="mt-[7px] h-1.5 w-1.5 rounded-full bg-gray-400" />
                Use{" "}
                <span className="font-medium text-gray-800">
                  Add New Patient
                </span>{" "}
                if not found
              </li>
            </ul>
          </div>

          <p className="mt-5 text-xs text-gray-400">
            Tip: Results will auto-select the first patient when available.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="col-span-2 space-y-6">
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
            <Info icon={Phone} label="Phone" value={selectedPatient.phone} />
            <Info
              icon={Mail}
              label="Email"
              value={selectedPatient.email ?? ""}
            />
            <Info
              icon={MapPin}
              label="Address"
              value={selectedPatient.address ?? ""}
            />
            <Info icon={User} label="Gender" value={selectedPatient.gender} />
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
              onClick={onClickUpdate}
              className="px-4 py-2 bg-green-400 text-white rounded-lg hover:bg-green-200"
            >
              Update Patient
            </button>
          </div>

          {/* Prescriptions */}
          <div className="bg-white rounded-2xl border shadow-sm">
            <div className="p-6 border-b">
              <h2 className="font-semibold">Prescriptions</h2>
            </div>
            <div className="p-6 space-y-3">
              {prescriptions.length ? (
                prescriptions.map((rx) => (
                  <PrescriptionItem key={rx.id} rx={rx} />
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
  );
}

/* UI helpers (kept local) */
function Section({ title, children }: { title: string; children: ReactNode }) {
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
  icon: ElementType;
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
