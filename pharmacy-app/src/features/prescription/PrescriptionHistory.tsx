import { useMemo, useState, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  User,
  Pill,
  AlertCircle
} from "lucide-react";

import type { RootState, AppDispatch } from "../../store";

import {
  fetchAllPrescriptions,
  fetchPrescriptionDetails
} from "@store/prescription/prescriptionSlice";

import type {
  PrescriptionSummaryDto,
  PrescriptionDetailsDto,
  PrescriptionMedicineDto
} from "@prescription/prescription.types";

import type { PatientDetails } from "@prescription/models";

import { getPatientById } from "@api/patientSearch";

import DataTable from "@components/common/Table/Table";
import type { Column } from "@components/common/Table/Table";
import Breadcrumbs from "@components/common/BreadCrumps/Breadcrumbs";

/* =======================================================
   AGE CALCULATOR (DOB -> Age)
======================================================= */

function calculateAgeFromDob(dob?: string): number | null {
  if (!dob) return null;

  const birthDate = new Date(dob);
  if (isNaN(birthDate.getTime())) return null;

  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();

  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthDate.getDate())
  ) {
    age--;
  }

  return age;
}

/* =======================================================
   Component
======================================================= */

export default function PrescriptionHistory() {

  const dispatch = useDispatch<AppDispatch>();

  /* ---------------- Redux ---------------- */

  const prescriptions =
    useSelector((s: RootState) => s.prescriptions.items) || [];

  const selected =
    useSelector((s: RootState) => s.prescriptions.selected);

  /* ---------------- Local ---------------- */

  const [expandedRowId, setExpandedRowId] =
    useState<string | null>(null);

  const [patientCache, setPatientCache] =
    useState<Record<string, PatientDetails>>({});

  /* ---------------- Initial Load ---------------- */

  useMemo(() => {
    dispatch(fetchAllPrescriptions({
      status: undefined,
      pageSize: 100,
      continuationToken: null,
      reset: true
    }));
  }, [dispatch]);

  /* =======================================================
     STATUS COLORS
======================================================= */

  const statusStyle = (status: string) => {
    switch (status) {
      case "Created":
        return "bg-amber-100 text-amber-800 border border-amber-300";
      case "Validated":
        return "bg-sky-100 text-sky-800 border border-sky-300";
      case "Active":
        return "bg-sky-100 text-sky-800 border border-sky-300";
      case "Payment Processed":
        return "bg-fuchsia-100 text-fuchsia-800 border border-fuchsia-300";
      case "Dispensed":
      case "Completed":
        return "bg-emerald-100 text-emerald-800 border border-emerald-300";
      case "Cancelled":
      case "Canceled":
        return "bg-rose-100 text-rose-800 border border-rose-300";
      case "Rejected":
        return "bg-red-100 text-red-800 border border-red-300";
      default:
        return "bg-slate-100 text-slate-700 border border-slate-300";
    }
  };

  /* =======================================================
     TABLE COLUMNS
======================================================= */

  const columns: Column<PrescriptionSummaryDto>[] = useMemo(() => [
    {
      key: "id",
      header: "Prescription ID",
      sortable: true,
      filterable: true,
      width: 180,
      render: v => (
        <span className="font-semibold text-gray-900">{v}</span>
      )
    },
    {
      key: "patientName",
      header: "Patient",
      sortable: true,
      filterable: true,
      width: 220,
      render: (_, row) => (
        <div>
          <div className="font-medium">{row.patientName}</div>
          <div className="text-xs text-gray-500">{row.patientId}</div>
        </div>
      )
    },
    {
      key: "prescriberName",
      header: "Doctor",
      sortable: true,
      filterable: true,
      width: 200
    },
    {
      key: "createdAt",
      header: "Date & Time",
      sortable: true,
      width: 180,
      render: v => {
        const d = new Date(v as string);
        return (
          <div>
            <div className="font-medium">
              {d.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric"
              })}
            </div>
            <div className="text-xs text-gray-500">
              {d.toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit"
              })}
            </div>
          </div>
        );
      }
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      filterable: true,
      width: 160,
      render: v => (
        <span
          className={`px-3 py-1 rounded-full text-xs font-semibold ${statusStyle(
            v as string
          )}`}
        >
          {v}
        </span>
      )
    }
  ], []);

  /* =======================================================
     EXPANDED ROW
======================================================= */

  const renderExpandedRow = useCallback(
    (row: PrescriptionSummaryDto) => {
      if (expandedRowId !== row.id) {
        return null;
      }

      if (expandedRowId === row.id && selected?.id !== row.id) {
        dispatch(fetchPrescriptionDetails(row.id));
      }

      if (!patientCache[row.patientId]) {
        getPatientById(row.patientId).then(res => {
          if (res) {
            setPatientCache(prev => ({
              ...prev,
              [row.patientId]: res
            }));
          }
        });
      }

      if (selected?.id !== row.id) {
        return <div className="p-8 text-gray-500">Loading...</div>;
      }

      const details = selected as PrescriptionDetailsDto;
      const patient = patientCache[row.patientId];
      const age = calculateAgeFromDob(patient?.dob);

      return (
        <div className="bg-gradient-to-br from-slate-50 via-blue-50 to-emerald-50 p-8">

          <div className="grid grid-cols-12 gap-6">

            {/* ================= PATIENT ================= */}

            <div className="col-span-4 flex">

              <div className="rounded-2xl border border-blue-200/70 bg-white shadow-md shadow-blue-100/60 overflow-hidden flex-1 flex flex-col">

                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-4 flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/25 rounded-xl flex items-center justify-center">
                    <User className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white">
                      Patient Information
                    </div>
                    <div className="text-xs text-blue-100/90">
                      Demographics & Records
                    </div>
                  </div>
                </div>

                <div className="p-5 space-y-4 divide-y flex-1 min-h-0 max-h-96 overflow-auto">

                  {patient ? (
                    <>
                      <div>
                        <div className="text-xs text-gray-500">FULL NAME</div>
                        <div className="text-lg font-bold">
                          {patient.fullName}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 pt-4">
                        <div className="bg-blue-50 border border-blue-100 p-3 rounded-lg">
                          <div className="text-[11px] text-blue-700/70">Age</div>
                          <div className="font-bold">
                            {age ?? "—"}
                          </div>
                        </div>

                        <div className="bg-blue-50 border border-blue-100 p-3 rounded-lg">
                          <div className="text-[11px] text-blue-700/70">Gender</div>
                          <div className="font-bold">{patient.gender}</div>
                        </div>
                      </div>

                      <div>
                        <div className="text-xs text-gray-500">Phone</div>
                        <div className="font-medium">{patient.phone}</div>
                      </div>

                      {patient.allergies?.length > 0 && (
                        <div>
                          <div className="flex items-center gap-2 text-rose-700 mb-2">
                            <AlertCircle className="w-4 h-4" />
                            <span className="text-xs font-bold">
                              ALLERGIES
                            </span>
                          </div>

                          {patient.allergies.map(a => (
                            <div
                              key={a}
                              className="bg-rose-50 border border-rose-200 rounded-md px-3 py-2 text-sm mb-2"
                            >
                              {a}
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <div>Loading patient...</div>
                  )}

                </div>
              </div>

            </div>

            {/* ================= MEDICATIONS ================= */}

            <div className="col-span-8 flex">

              <div className="rounded-2xl border border-emerald-200/70 bg-white shadow-md shadow-emerald-100/60 overflow-hidden flex-1 flex flex-col">

                <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-4 flex justify-between items-center">

                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/25 rounded-xl flex items-center justify-center">
                      <Pill className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white">
                        Prescribed Medications
                      </div>
                      <div className="text-xs text-emerald-100/90">
                        Complete medication list
                      </div>
                    </div>
                  </div>

                  <div className="bg-white/20 px-3 py-1 rounded-full text-white text-sm font-bold">
                    {details.medicines?.length || 0} items
                  </div>

                </div>

                <div className="p-5 space-y-5 flex-1 min-h-0 max-h-96 overflow-auto">

                  {details.medicines?.map(
                    (med: PrescriptionMedicineDto, idx) => (
                      <div
                        key={med.prescriptionMedicineId}
                        className="border border-emerald-200 rounded-xl p-5 bg-emerald-50/40 shadow-sm"
                      >

                        <div className="flex justify-between mb-3">
                          <div>
                            <div className="text-lg font-bold">
                              {med.name}
                            </div>
                            <div className="text-sm font-semibold text-green-600">
                              {med.strength}
                            </div>
                          </div>

                          <div className="bg-emerald-100 text-emerald-800 text-xs font-bold px-3 h-7 min-w-[2.5rem] rounded-full inline-flex items-center justify-center leading-none tabular-nums">
                            #{idx + 1}
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-3 mb-4">

                          <div className="bg-white border rounded-lg p-3">
                            <div className="text-[11px] text-emerald-700/70">Quantity</div>
                            <div className="font-bold">{med.prescribedQuantity}</div>
                          </div>

                          <div className="bg-white border rounded-lg p-3">
                            <div className="text-[11px] text-emerald-700/70">Days</div>
                            <div className="font-bold">{med.daysSupply}</div>
                          </div>

                          <div className="bg-white border rounded-lg p-3">
                            <div className="text-[11px] text-emerald-700/70">Refills</div>
                            <div className="font-bold">{med.refillsRemaining}</div>
                          </div>

                        </div>

                        {med.instruction && (
                          <div className="pt-3 border-t">
                            <div className="text-xs font-semibold text-gray-500 mb-1">
                              INSTRUCTIONS
                            </div>
                            <div className="text-sm text-gray-700">
                              {med.instruction}
                            </div>
                          </div>
                        )}

                      </div>
                    )
                  )}

                </div>
              </div>

            </div>

          </div>
        </div>
      );
    },
    [dispatch, selected, expandedRowId, patientCache]
  );

  /* ======================================================= */

  return (
    <div className="space-y-6">

      <Breadcrumbs
        items={[{ label: "Prescription History" }]}
      />

      <div>
        <h1 className="text-2xl font-bold">
          Prescription History
        </h1>
        <p className="text-sm text-gray-500">
          View and track all prescriptions • {prescriptions.length}
        </p>
      </div>

      <DataTable
        data={prescriptions}
        columns={columns}
        pageSize={10}
        pageSizeOptions={[5, 10, 20]}
        searchPlaceholder="Search prescription, patient, doctor..."
        exportFileName="prescription-history"
        height={650}

        expandable
        renderExpandedRow={renderExpandedRow}

        isRowExpanded={(row) =>
          row.id === expandedRowId
        }

        onRowClick={(row) => {
          setExpandedRowId(prev =>
            prev === row.id ? null : row.id
          );
        }}
      />

    </div>
  );
}
