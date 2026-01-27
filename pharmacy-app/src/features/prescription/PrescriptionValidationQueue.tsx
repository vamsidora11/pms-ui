import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ClipboardList,
  AlertTriangle,
  ChevronRight,
} from "lucide-react";
import clsx from "clsx";

/* =========================
   Types
========================= */
type QueueItem = {
  id: string; // RX-2026-001
  patientName: string;
  patientId: string;
  doctorName: string;
  medicationsCount: number;
  submittedAt: string; // ISO
  alerts: {
    critical: number;
    warning: number;
    info: number;
  };
};

/* =========================
   Dummy data + mock fetch
========================= */
const DUMMY_QUEUE: QueueItem[] = [
  {
    id: "RX-2026-001",
    patientName: "Sarah Johnson",
    patientId: "PT-001",
    doctorName: "Dr. Michael Chen",
    medicationsCount: 2,
    submittedAt: "2026-01-02T09:30:00+05:30",
    alerts: { critical: 3, warning: 0, info: 0 },
  },
  {
    id: "RX-2026-004",
    patientName: "James Chen",
    patientId: "PT-004",
    doctorName: "Dr. Sarah Martinez",
    medicationsCount: 2,
    submittedAt: "2026-01-02T10:45:00+05:30",
    alerts: { critical: 2, warning: 0, info: 0 },
  },
  {
    id: "RX-2026-008",
    patientName: "Emily Davis",
    patientId: "PT-005",
    doctorName: "Dr. Michael Chen",
    medicationsCount: 1,
    submittedAt: "2026-01-02T11:15:00+05:30",
    alerts: { critical: 1, warning: 1, info: 0 },
  },
];

function mockFetchQueue(delayMs = 400): Promise<QueueItem[]> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(DUMMY_QUEUE), delayMs);
  });
}

/* =========================
   Component
========================= */
export default function PrescriptionValidationQueue() {
  const navigate = useNavigate();
  const [items, setItems] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let done = false;
    setLoading(true);
    mockFetchQueue().then((res) => {
      if (!done) {
        setItems(res);
        setLoading(false);
      }
    });
    return () => {
      done = true;
    };
  }, []);

  const pendingCount = items.length;

  const sorted = useMemo(
    () =>
      [...items].sort(
        (a, b) =>
          new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime(),
      ),
    [items],
  );

  return (
    <div className="max-w-5xl mx-auto p-4 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">
          Prescription Validation Queue
        </h1>
        <p className="text-gray-500">
          Review and validate pending prescriptions
        </p>
      </div>

      {/* Summary */}
      <div className="bg-white rounded-2xl border shadow-sm">
        <div className="p-5 flex items-center justify-between">
          <div>
            <div className="text-sm text-gray-500">Pending Validations</div>
            {loading ? (
              <div className="h-6 w-56 bg-gray-200 rounded animate-pulse mt-1" />
            ) : (
              <div className="text-gray-900 font-medium">
                {pendingCount} prescription{pendingCount === 1 ? "" : "s"} awaiting review
              </div>
            )}
          </div>
          <div className="p-2 rounded-full bg-yellow-100 text-yellow-700">
            <ClipboardList size={20} />
          </div>
        </div>
      </div>

      {/* List */}
      <div className="bg-white rounded-2xl border shadow-sm">
        <div className="p-5 border-b">
          <h2 className="font-semibold text-gray-900">Pending Prescriptions</h2>
        </div>

        {loading ? (
          <ListSkeleton />
        ) : sorted.length === 0 ? (
          <div className="p-6 text-gray-500 text-center">No pending items</div>
        ) : (
          <ul className="divide-y">
            {sorted.map((rx) => (
              <li
                key={rx.id}
                className="p-5 hover:bg-gray-50/70 transition"
              >
                <div className="flex items-start justify-between gap-4">
                  {/* Left content */}
                  <div className="min-w-0">
                    {/* Row 1: badges */}
                    <div className="flex items-center gap-2 mb-3">
                      <Badge tone="amber">{rx.id}</Badge>

                      {rx.alerts.critical > 0 && (
                        <Badge tone="red">
                          <span className="inline-flex items-center gap-1">
                            <AlertTriangle size={14} />
                            {rx.alerts.critical} Critical
                          </span>
                        </Badge>
                      )}
                      {rx.alerts.warning > 0 && (
                        <Badge tone="amber-soft">
                          {rx.alerts.warning} Warning
                        </Badge>
                      )}
                      {rx.alerts.info > 0 && (
                        <Badge tone="gray">{rx.alerts.info} Info</Badge>
                      )}
                    </div>

                    {/* Row 2: grid details */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                      <KV label="Patient" value={`${rx.patientName}\n${rx.patientId}`} multiline />
                      <KV label="Doctor" value={rx.doctorName} />
                      <KV
                        label="Medications"
                        value={`${rx.medicationsCount} item${rx.medicationsCount === 1 ? "" : "s"}`}
                      />
                      <KV
                        label="Submitted"
                        value={formatDateTime(rx.submittedAt)}
                      />
                    </div>
                  </div>

                  {/* Right: action */}
                  <button
                    onClick={() =>
                      navigate(`/pharmacist/validation/${rx.id}`)
                    }
                    className="text-blue-600 hover:text-blue-700 inline-flex items-center gap-1 shrink-0"
                    aria-label={`Review ${rx.id}`}
                    title="Review"
                  >
                    Review <ChevronRight size={18} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

/* =========================
   UI bits
========================= */
function Badge({
  children,
  tone,
}: {
  children: React.ReactNode;
  tone: "red" | "amber" | "amber-soft" | "gray";
}) {
  const map = {
    red: "bg-red-100 text-red-700",
    amber: "bg-yellow-100 text-yellow-800",
    "amber-soft": "bg-amber-100 text-amber-800",
    gray: "bg-gray-100 text-gray-700",
  } as const;
  return (
    <span className={clsx("px-2 py-0.5 rounded text-xs", map[tone])}>
      {children}
    </span>
  );
}

function KV({
  label,
  value,
  multiline = false,
}: {
  label: string;
  value: string;
  multiline?: boolean;
}) {
  return (
    <div className="min-w-0">
      <div className="text-xs text-gray-500">{label}</div>
      <div className={clsx("text-gray-900", multiline && "whitespace-pre-line")}>
        {value || "—"}
      </div>
    </div>
  );
}

function ListSkeleton() {
  return (
    <div className="divide-y">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="p-5 space-y-3">
          <div className="h-5 w-40 bg-gray-200 rounded animate-pulse" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((__, j) => (
              <div key={j} className="h-10 bg-gray-200 rounded animate-pulse" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function formatDateTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString();
}