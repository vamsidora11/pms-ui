// import { useCallback, useEffect, useMemo, useState } from "react";
// import { useDispatch, useSelector } from "react-redux";

// import type { RootState, AppDispatch } from "../../../store";

// import {
//   fetchAllPrescriptions,
//   fetchPrescriptionDetails,
// } from "@store/prescription/prescriptionSlice";

// import type { PrescriptionSummaryDto, PrescriptionDetailsDto } from "@prescription/prescription.types";
// import type { PatientDetails } from "@prescription/models";

// import { getPatientById } from "@api/patientSearch";

// type Options = {
//   pageSize?: number;
// };

// export function usePrescriptionHistoryData(options?: Options) {
//   const dispatch = useDispatch<AppDispatch>();

//   const prescriptions = useSelector((s: RootState) => s.prescriptions.items) || [];
//   const selected = useSelector((s: RootState) => s.prescriptions.selected);

//   const [expandedRowId, setExpandedRowId] = useState<string | null>(null);

//   const [patientCache, setPatientCache] = useState<Record<string, PatientDetails>>({});
//   const [patientLoading, setPatientLoading] = useState<Record<string, boolean>>({});

//   const pageSize = options?.pageSize ?? 100;

//   // ✅ Initial load (side effect belongs in useEffect)
//   useEffect(() => {
//     dispatch(
//       fetchAllPrescriptions({
//         status: undefined,
//         pageSize,
//         continuationToken: null,
//         reset: true,
//       })
//     );
//   }, [dispatch, pageSize]);

//   // Compute expanded row
//   const expandedRow = useMemo<PrescriptionSummaryDto | null>(() => {
//     if (!expandedRowId) return null;
//     return prescriptions.find((p) => p.id === expandedRowId) || null;
//   }, [expandedRowId, prescriptions]);

//   // ✅ Fetch details + patient when expanded changes
//   useEffect(() => {
//     if (!expandedRow) return;

//     // Fetch prescription details if needed
//     if (selected?.id !== expandedRow.id) {
//       dispatch(fetchPrescriptionDetails(expandedRow.id));
//     }

//     // Fetch patient (cached)
//     const pid = expandedRow.patientId;
//     const cached = !!patientCache[pid];
//     const loading = !!patientLoading[pid];

//     if (cached || loading) return;

//     let cancelled = false;
//     setPatientLoading((prev) => ({ ...prev, [pid]: true }));

//     getPatientById(pid)
//       .then((res) => {
//         if (cancelled) return;
//         if (res) setPatientCache((prev) => ({ ...prev, [pid]: res }));
//       })
//       .finally(() => {
//         if (cancelled) return;
//         setPatientLoading((prev) => ({ ...prev, [pid]: false }));
//       });

//     return () => {
//       cancelled = true;
//     };
//   }, [dispatch, expandedRow, selected?.id, patientCache, patientLoading]);

//   // Details for expanded row
//   const expandedDetails: PrescriptionDetailsDto | null =
//     expandedRow && selected?.id === expandedRow.id
//       ? (selected as PrescriptionDetailsDto)
//       : null;

//   const expandedPatient: PatientDetails | null =
//     expandedRow ? patientCache[expandedRow.patientId] ?? null : null;

//   const expandedPatientLoading =
//     expandedRow ? !!patientLoading[expandedRow.patientId] : false;

//   const toggleRow = useCallback((rowId: string) => {
//     setExpandedRowId((prev) => (prev === rowId ? null : rowId));
//   }, []);

//   const isRowExpanded = useCallback(
//     (row: PrescriptionSummaryDto) => row.id === expandedRowId,
//     [expandedRowId]
//   );

//   return {
//     prescriptions,

//     expandedRowId,
//     expandedRow,
//     expandedDetails,

//     expandedPatient,
//     expandedPatientLoading,

//     toggleRow,
//     isRowExpanded,
//   };
// }
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import type { RootState, AppDispatch } from "../../../store";

import {
  fetchAllPrescriptions,
  fetchPrescriptionDetails,
} from "@store/prescription/prescriptionSlice";

import type { PrescriptionSummaryDto, PrescriptionDetailsDto } from "@prescription/prescription.types";
import type { PatientDetails } from "@prescription/models";
import { getPatientById } from "@api/patientSearch";

type Options = { pageSize?: number };

export function usePrescriptionHistoryData(options?: Options) {
  const dispatch = useDispatch<AppDispatch>();

  const prescriptions = useSelector((s: RootState) => s.prescriptions.items) || [];
  const selected = useSelector((s: RootState) => s.prescriptions.selected);

  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);

  // Cache in state (so UI updates)
  const [patientCache, setPatientCache] = useState<Record<string, PatientDetails>>({});
  const [patientLoading, setPatientLoading] = useState<Record<string, boolean>>({});

  // ✅ refs to prevent effect dependency cancellation bugs
  const inFlightRef = useRef<Record<string, boolean>>({});
  const cacheRef = useRef<Record<string, PatientDetails>>({});

  // keep cacheRef in sync with state (safe, tiny)
  useEffect(() => {
    cacheRef.current = patientCache;
  }, [patientCache]);

  const pageSize = options?.pageSize ?? 100;

  // Initial load
  useEffect(() => {
    dispatch(
      fetchAllPrescriptions({
        status: undefined,
        pageSize,
        continuationToken: null,
        reset: true,
      })
    );
  }, [dispatch, pageSize]);

  // Find expanded row
  const expandedRow = useMemo(() => {
    if (!expandedRowId) return null;
    return prescriptions.find((p) => p.id === expandedRowId) || null;
  }, [expandedRowId, prescriptions]);

  // Fetch prescription details when expanded changes
  useEffect(() => {
    if (!expandedRow) return;
    if (selected?.id !== expandedRow.id) {
      dispatch(fetchPrescriptionDetails(expandedRow.id));
    }
  }, [dispatch, expandedRow?.id, selected?.id]); // ✅ safe deps

  // ✅ Fetch patient when expanded changes (no infinite cancellation)
  useEffect(() => {
    const pid = expandedRow?.patientId;
    if (!pid) return;

    // already cached?
    if (cacheRef.current[pid]) return;

    // already fetching?
    if (inFlightRef.current[pid]) return;

    inFlightRef.current[pid] = true;
    setPatientLoading((prev) => ({ ...prev, [pid]: true }));

    getPatientById(pid)
      .then((res) => {
        if (res) {
          setPatientCache((prev) => ({ ...prev, [pid]: res }));
        }
      })
      .catch(() => {
        // optional: you can set an error cache here if you want
      })
      .finally(() => {
        inFlightRef.current[pid] = false;
        setPatientLoading((prev) => ({ ...prev, [pid]: false }));
      });
  }, [expandedRow?.patientId]); // ✅ only depends on pid

  const expandedDetails: PrescriptionDetailsDto | null =
    expandedRow && selected?.id === expandedRow.id
      ? (selected as PrescriptionDetailsDto)
      : null;

  const expandedPatient: PatientDetails | null =
    expandedRow ? patientCache[expandedRow.patientId] ?? null : null;

  const expandedPatientLoading =
    expandedRow ? !!patientLoading[expandedRow.patientId] : false;

  const toggleRow = useCallback((rowId: string) => {
    setExpandedRowId((prev) => (prev === rowId ? null : rowId));
  }, []);

  const isRowExpanded = useCallback(
    (row: PrescriptionSummaryDto) => row.id === expandedRowId,
    [expandedRowId]
  );

  return {
    prescriptions,
    expandedRowId,
    expandedRow,
    expandedDetails,
    expandedPatient,
    expandedPatientLoading,
    toggleRow,
    isRowExpanded,
  };
}