/* ======================================
   LABEL QUEUE (LEFT LIST)
====================================== */

export interface LabelQueuePrescription {
  id: string;
  patientId: string;
  patientName: string;
  prescriberName: string;
  createdAt: string;
  expiresAt: string;
  status: string;
  medicineCount: number;
}

/* ======================================
   LABEL DETAILS (RIGHT PREVIEW)
====================================== */

export interface LabelMedicine {
  prescriptionMedicineId: string;
  name: string;
  strength: string;
  prescribedQuantity: number;
  instruction: string;
  frequency: string;
}

export interface LabelPrescriptionDetails {
  id: string;
  patientId: string;
  patientName: string;
  prescriber: {
    id: string;
    name: string;
  };
  createdAt: string;
  medicines: LabelMedicine[];
}

/* ======================================
   FREQUENCY HELPERS (Moved here)
====================================== */

export const FREQUENCY_LABEL_MAP: Record<string, string> = {
  OD: "Once Daily",
  BID: "Twice Daily",
  TID: "Three Times Daily",
  QID: "Four Times Daily",
  Q4H: "Every 4 Hours",
  Q6H: "Every 6 Hours",
  Q8H: "Every 8 Hours",
  Q12H: "Every 12 Hours",
  PRN: "As Needed",
  STAT: "Immediately",
};

export function getFrequencyLabel(code?: string): string {
  if (!code) return "";
  return FREQUENCY_LABEL_MAP[code] ?? code;
}