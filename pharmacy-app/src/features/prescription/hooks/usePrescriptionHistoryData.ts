import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { RootState, AppDispatch } from "../../../store";
import {
  fetchAllPrescriptions,
  fetchPrescriptionDetails,
} from "@store/prescription/prescriptionSlice";
import type {
  PrescriptionSummaryDto,
  PrescriptionDetailsDto,
} from "@prescription/prescription.types";
import type { PatientDetails } from "@prescription/models";
import { getPatientById } from "@api/patientSearch";
 
type Options = { pageSize?: number };
 
export function usePrescriptionHistoryData(options?: Options) {
  const dispatch = useDispatch<AppDispatch>();
  const prescriptions =
    useSelector((s: RootState) => s.prescriptions.items) || [];
  const selected = useSelector((s: RootState) => s.prescriptions.selected);
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
 
  // UI state
  const [patientCache, setPatientCache] =
    useState<Record<string, PatientDetails>>({});
  const [patientLoading, setPatientLoading] =
    useState<Record<string, boolean>>({});
 
  // refs (no re-renders)
  const inFlightRef = useRef<Record<string, boolean>>({});
 
  const pageSize = options?.pageSize ?? 100;
 
  /* ---------------- Initial load ---------------- */
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
 
  /* ---------------- Expanded row ---------------- */
  const expandedRow = useMemo(() => {
    if (!expandedRowId) return null;
    return prescriptions.find((p) => p.id === expandedRowId) || null;
  }, [expandedRowId, prescriptions]);
 
  /* ---------------- Prescription details ---------------- */
  useEffect(() => {
    if (!expandedRow) return;
    if (selected?.id !== expandedRow.id) {
      dispatch(fetchPrescriptionDetails(expandedRow.id));
    }
  }, [dispatch, expandedRow, selected?.id]);
 
  /* ---------------- Patient fetch (FIXED) ---------------- */
  const fetchPatient = useCallback(async (pid: string) => {
    // already cached
    if (patientCache[pid]) return;
    // already fetching
    if (inFlightRef.current[pid]) return;
 
    inFlightRef.current[pid] = true;
    setPatientLoading((prev) => ({ ...prev, [pid]: true }));
 
    try {
      const res = await getPatientById(pid);
      if (res) {
        setPatientCache((prev) => ({ ...prev, [pid]: res }));
      }
    } finally {
      inFlightRef.current[pid] = false;
      setPatientLoading((prev) => ({ ...prev, [pid]: false }));
    }
  }, [patientCache]);
 
  useEffect(() => {
    const pid = expandedRow?.patientId;
    if (pid) {
      fetchPatient(pid);
    }
  }, [expandedRow?.patientId, fetchPatient]);
 
  /* ---------------- Derived data ---------------- */
  const expandedDetails: PrescriptionDetailsDto | null =
    expandedRow && selected?.id === expandedRow.id
      ? (selected as PrescriptionDetailsDto)
      : null;
 
  const expandedPatient: PatientDetails | null =
    expandedRow ? patientCache[expandedRow.patientId] ?? null : null;
 
  const expandedPatientLoading =
    expandedRow ? !!patientLoading[expandedRow.patientId] : false;
 
  /* ---------------- Actions ---------------- */
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
 