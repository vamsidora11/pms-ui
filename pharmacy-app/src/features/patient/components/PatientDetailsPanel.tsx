import {
  User,
  Phone,
  Mail,
  MapPin,
  AlertTriangle,
  Calendar,
} from "lucide-react";
import clsx from "clsx";
import type { PatientDetailsDto } from "@store/patient/patienttype";

interface Prescription {
  id: string;
  patientId: string;
  medicationsCount: number;
  status: "Pending" | "Rejected" | "Approved";
}

type Props = {
  selectedPatient: PatientDetailsDto | null;
  detailsLoading: boolean;
  detailsError: string | null;

  prescriptions: Prescription[];

  onClickUpdate: () => void;
};

export default function PatientDetailsPanel({
  selectedPatient,
  detailsLoading,
  detailsError,
  prescriptions,
  onClickUpdate,
}: Props) {
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
              value={selectedPatient.address}
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
                        "bg-green-100 text-green-700": rx.status === "Approved",
                        "bg-red-100 text-red-700": rx.status === "Rejected",
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
  );
}

/* UI helpers (kept local) */
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
