import { useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ClipboardList, ChevronRight } from "lucide-react";
import clsx from "clsx";

import { ROUTES } from "../../constants/routes";
import { usePendingPrescriptions } from "@utils/hooks/usePendingPrescriptions";
import { formatDate } from "@utils/format";
import type { PrescriptionSummary } from "@prescription/domain/model";

type LocationState = { refresh?: boolean } | null;

export default function PrescriptionValidationQueuePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { rows, loading, error, refetch } = usePendingPrescriptions({
    refreshOnFocus: true,
  });

  useEffect(() => {
    const state = location.state as LocationState;
    if (state?.refresh) {
      void refetch();
    }
  }, [location.state, refetch]);

  const sorted = useMemo(
    () => [...rows].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime()),
    [rows]
  );

  return (
    <div className="max-w-5xl mx-auto p-4 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Prescription Validation Queue</h1>
        <p className="text-gray-500">Review and validate pending prescriptions</p>
      </div>

      <div className="bg-white rounded-2xl border shadow-sm">
        <div className="p-5 flex items-center justify-between">
          <div>
            <div className="text-sm text-gray-500">Pending Validations</div>
            {loading ? (
              <div className="h-6 w-56 bg-gray-200 rounded animate-pulse mt-1" />
            ) : (
              <div className="text-gray-900 font-medium">
                {rows.length} prescription{rows.length === 1 ? "" : "s"} awaiting review
              </div>
            )}
          </div>
          <div className="p-2 rounded-full bg-yellow-100 text-yellow-700">
            <ClipboardList size={20} />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border shadow-sm">
        <div className="p-5 border-b">
          <h2 className="font-semibold text-gray-900">Pending Prescriptions</h2>
        </div>

        {error && <div className="p-5 text-red-600">{error}</div>}

        {loading ? (
          <ListSkeleton />
        ) : sorted.length === 0 ? (
          <div className="p-6 text-gray-500 text-center">No pending items</div>
        ) : (
          <ul className="divide-y">
            {sorted.map((rx: PrescriptionSummary) => (
              <li key={rx.id} className="p-5 hover:bg-gray-50/70 transition">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      <Badge tone="amber">{rx.id}</Badge>
                      <Badge tone="gray">{rx.status}</Badge>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                      <KV label="Patient" value={`${rx.patientName}\n${rx.patientId}`} multiline />
                      <KV label="Doctor" value={rx.prescriberName} />
                      <KV
                        label="Medications"
                        value={`${rx.medicineCount} item${rx.medicineCount === 1 ? "" : "s"}`}
                      />
                      <KV label="Submitted" value={formatDate(rx.createdAt)} />
                    </div>
                  </div>

                  <button
                    onClick={() =>
                      navigate(`${ROUTES.PHARMACIST.VALIDATION}/${rx.id}`, {
                        state: { patientId: rx.patientId },
                      })
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

function Badge({
  children,
  tone,
}: {
  children: React.ReactNode;
  tone: "amber" | "gray";
}) {
  const map = {
    amber: "bg-yellow-100 text-yellow-800",
    gray: "bg-gray-100 text-gray-700",
  } as const;

  return <span className={clsx("px-2 py-0.5 rounded text-xs", map[tone])}>{children}</span>;
}

function KV({ label, value, multiline = false }: { label: string; value: string; multiline?: boolean }) {
  return (
    <div>
      <div className="text-xs text-gray-500">{label}</div>
      <div className={clsx("text-gray-900", multiline && "whitespace-pre-line")}>{value || "-"}</div>
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
