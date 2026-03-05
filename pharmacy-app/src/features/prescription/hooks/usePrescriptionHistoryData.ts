import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { RootState, AppDispatch } from "../../../store";
import {
  fetchAllPrescriptions,
  fetchPrescriptionDetails,
} from "@store/prescription/prescriptionSlice";
import type {
  PrescriptionDetails,
  PrescriptionSummary,
} from "@prescription/domain/model";
import type { PatientDetails } from "@prescription/types/models";
import { getPatientById } from "@api/patientSearch";

type Options = { pageSize?: number; skipInitialFetch?: boolean };

export function usePrescriptionHistoryData(options?: Options) {
  const dispatch = useDispatch<AppDispatch>();
  const prescriptionState = useSelector((s: RootState) => s.prescriptions);
  const prescriptions = useMemo(
    () => prescriptionState.items ?? [],
    [prescriptionState.items]
  );
  const selected = prescriptionState.selected;
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);

  const [patientCache, setPatientCache] = useState<Record<string, PatientDetails>>({});
  const [patientLoading, setPatientLoading] = useState<Record<string, boolean>>({});
  const inFlightRef = useRef<Record<string, boolean>>({});

  const pageSize = options?.pageSize ?? 10;
  const skipInitialFetch = options?.skipInitialFetch ?? false;

  useEffect(() => {
    if (skipInitialFetch) {
      return;
    }

    dispatch(
      fetchAllPrescriptions({
        pageNumber: 1,
        pageSize,
      })
    );
  }, [dispatch, pageSize, skipInitialFetch]);

  const expandedRow = useMemo(() => {
    if (!expandedRowId) {
      return null;
    }
    return prescriptions.find((row) => row.id === expandedRowId) ?? null;
  }, [expandedRowId, prescriptions]);

  useEffect(() => {
    if (!expandedRow) {
      return;
    }

    if (selected?.prescription.id !== expandedRow.id) {
      dispatch(
        fetchPrescriptionDetails({
          id: expandedRow.id,
          patientId: expandedRow.patientId,
        })
      );
    }
  }, [dispatch, expandedRow, selected?.prescription.id]);

  const fetchPatient = useCallback(async (patientId: string) => {
    if (patientCache[patientId]) {
      return;
    }
    if (inFlightRef.current[patientId]) {
      return;
    }

    inFlightRef.current[patientId] = true;
    setPatientLoading((prev) => ({ ...prev, [patientId]: true }));

    try {
      const data = await getPatientById(patientId);
      if (data) {
        setPatientCache((prev) => ({ ...prev, [patientId]: data }));
      }
    } finally {
      inFlightRef.current[patientId] = false;
      setPatientLoading((prev) => ({ ...prev, [patientId]: false }));
    }
  }, [patientCache]);

  useEffect(() => {
    const patientId = expandedRow?.patientId;
    if (patientId) {
      void fetchPatient(patientId);
    }
  }, [expandedRow?.patientId, fetchPatient]);

  const expandedDetails: PrescriptionDetails | null =
    expandedRow && selected?.prescription.id === expandedRow.id
      ? selected.prescription
      : null;

  const expandedPatient: PatientDetails | null =
    expandedRow ? patientCache[expandedRow.patientId] ?? null : null;

  const expandedPatientLoading =
    expandedRow ? !!patientLoading[expandedRow.patientId] : false;

  const toggleRow = useCallback((rowId: string) => {
    setExpandedRowId((prev) => (prev === rowId ? null : rowId));
  }, []);

  const isRowExpanded = useCallback(
    (row: PrescriptionSummary) => row.id === expandedRowId,
    [expandedRowId]
  );

  return {
    prescriptions,
    requestStatus: prescriptionState.status,
    requestError: prescriptionState.error,
    totalCount: prescriptionState.totalCount,
    pageNumber: prescriptionState.pageNumber,
    pageSize: prescriptionState.pageSize,
    totalPages: prescriptionState.totalPages,
    expandedRowId,
    expandedRow,
    expandedDetails,
    expandedPatient,
    expandedPatientLoading,
    toggleRow,
    isRowExpanded,
  };
}
