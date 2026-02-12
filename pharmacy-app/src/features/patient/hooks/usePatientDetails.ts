import { useRef, useState } from "react";
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

  const selectPatient = async (patientId: string) => {
    if (!patientId) return;
    if (selectingRef.current) return;

    selectingRef.current = true;
    try {
      setDetailsLoading(true);
      setDetailsError(null);

      const details = await getDetailsFn(patientId);
      setSelectedPatient(details);
    } catch (err: any) {
      console.error("getPatientDetails failed:", err);
      setDetailsError(err?.message || "Failed to load patient details");
      setSelectedPatient(null);
    } finally {
      setDetailsLoading(false);
      selectingRef.current = false;
    }
  };

  return {
    selectedPatient,
    setSelectedPatient,
    detailsLoading,
    detailsError,
    selectPatient,
  };
}
