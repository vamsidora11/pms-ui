import { useCallback, useRef, useState } from "react";
import type { PatientDetailsDto } from "@patient/types/patienttype";

export type GetPatientDetailsFn = (
  patientId: string,
) => Promise<PatientDetailsDto>;

export function usePatientDetails(getDetailsFn: GetPatientDetailsFn) {
  const [selectedPatient, setSelectedPatient] =
    useState<PatientDetailsDto | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);

  const selectingRef = useRef(false);
  const getErrorMessage = (err: unknown): string => {
    if (typeof err === "string") return err;
    if (typeof err === "object" && err !== null) {
      const errorObj = err as { message?: string };
      return errorObj.message || "Failed to load patient details";
    }
    return "Failed to load patient details";
  };

  const selectPatient = useCallback(async (patientId: string) => {
    if (!patientId) return;
    if (selectingRef.current) return;

    selectingRef.current = true;
    try {
      setDetailsLoading(true);
      setDetailsError(null);

      const details = await getDetailsFn(patientId);
      setSelectedPatient(details);
    } catch (err) {
      console.error("getPatientDetails failed:", err);
      setDetailsError(getErrorMessage(err));
      setSelectedPatient(null);
    } finally {
      setDetailsLoading(false);
      selectingRef.current = false;
    }
  }, [getDetailsFn]);

  return {
    selectedPatient,
    setSelectedPatient,
    detailsLoading,
    detailsError,
    selectPatient,
  };
}
