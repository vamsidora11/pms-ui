import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ClipboardList, AlertTriangle, ChevronRight } from "lucide-react";
import clsx from "clsx";

import { getPendingPrescriptions } from "@api/prescription";
import type { PrescriptionSummaryDto } from "@api/prescription.types";

/* =========================
   Component
========================= */

export default function PrescriptionValidationQueue() {
  const navigate = useNavigate();
  const location = useLocation();

  const [rows, setRows] = useState<PrescriptionSummaryDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /* -------------------------
     Fetch Function
  ------------------------- */
  const loadQueue = useCallback(() => {
    setLoading(true);
    getPendingPrescriptions()
      .then(setRows)
      .catch(() => setError("Failed to load prescriptions"))
      .finally(() => setLoading(false));
  }, []);

  /* Initial load */
  useEffect(() => {
    Promise.resolve().then(loadQueue);
  }, [loadQueue]);

  /* Refresh on window focus */
  useEffect(() => {
    const onFocus = () => loadQueue();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [loadQueue]);

  /* Refresh after coming back from details page */
  useEffect(() => {
    if ((location.state as { refresh?: boolean })?.refresh) {
      Promise.resolve().then(loadQueue);
    }
  }, [location.state, loadQueue]);

  /* -------------------------
     Derived
  ------------------------- */

  const pendingCount = rows.length;

  const sorted = useMemo(
    () =>
      [...rows].sort(
        (a, b) =>
          new Date(a.createdAt).getTime() -
          new Date(b.createdAt).getTime()
      ),
    [rows]
  );

  /* -------------------------
     Render
  ------------------------- */

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
                {pendingCount} prescription
                {pendingCount === 1 ? "" : "s"} awaiting review
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
          <h2 className="font-semibold text-gray-900">
            Pending Prescriptions
          </h2>
        </div>

        {error && (
          <div className="p-5 text-red-600">{error}</div>
        )}

        {loading ? (
          <ListSkeleton />
        ) : sorted.length === 0 ? (
          <div className="p-6 text-gray-500 text-center">
            No pending items
          </div>
        ) : (
          <ul className="divide-y">
            {sorted.map((rx) => (
              <li
                key={rx.id}
                className="p-5 hover:bg-gray-50/70 transition"
              >
                <div className="flex items-start justify-between gap-4">

                  {/* Left */}
                  <div>

                    {/* Badges */}
                    <div className="flex flex-wrap items-center gap-2 mb-3">

                      <Badge tone="amber">{rx.id}</Badge>

                      {rx.validationSummary.highSeverityCount > 0 && (
                        <Badge tone="red">
                          <span className="inline-flex items-center gap-1">
                            <AlertTriangle size={14} />
                            {rx.validationSummary.highSeverityCount} Critical
                          </span>
                        </Badge>
                      )}

                      {rx.validationSummary.moderateCount > 0 && (
                        <Badge tone="amber-soft">
                          {rx.validationSummary.moderateCount} Moderate
                        </Badge>
                      )}

                      {rx.validationSummary.lowCount > 0 && (
                        <Badge tone="gray">
                          {rx.validationSummary.lowCount} Info
                        </Badge>
                      )}

                      {rx.validationSummary.totalIssues === 0 && (
                        <Badge tone="gray">No Issues</Badge>
                      )}

                    </div>

                    {/* Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">

                      <KV
                        label="Patient"
                        value={`${rx.patientName}\n${rx.patientId}`}
                        multiline
                      />

                      <KV label="Doctor" value={rx.prescriberName} />

                      <KV
                        label="Medications"
                        value={`${rx.medicineCount} item${
                          rx.medicineCount === 1 ? "" : "s"
                        }`}
                      />

                      <KV
                        label="Submitted"
                        value={formatDateTime(rx.createdAt)}
                      />

                    </div>
                  </div>

                  {/* Action */}
                  <button
                    onClick={() =>
                      navigate(`/pharmacist/validation/${rx.id}`)
                    }
                    className="text-blue-600 hover:text-blue-700 inline-flex items-center gap-1"
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
   UI Helpers
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
    <div>
      <div className="text-xs text-gray-500">{label}</div>
      <div
        className={clsx(
          "text-gray-900",
          multiline && "whitespace-pre-line"
        )}
      >
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
              <div
                key={j}
                className="h-10 bg-gray-200 rounded animate-pulse"
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString();
}
