/* ======================================
   LABEL QUEUE (LEFT LIST)
====================================== */

export interface LabelQueuePrescription {
  id: string;
  prescriptionId: string;
  patientId: string;
  patientName: string;
  dispenseDate: string;
  status: string;
  itemCount: number;
  grandTotal: number;
}

/* ======================================
   LABEL DETAILS (RIGHT PREVIEW)
====================================== */

export interface LabelMedicine {
  prescriptionLineId: string;
  productId: string;
  productName: string;
  frequency: string;
  instructions: string;
  refillNumber: number;
  quantityDispensed: number;
  isManualAdjustment: boolean;
  lotsUsed: {
    lotId: string;
    quantity: number;
    expiry: string;
  }[];
  pricing: {
    unitPrice: number;
    total: number;
    insurancePaid: number;
    patientPayable: number;
  };
}

export interface LabelPrescriptionDetails {
  dispenseId: string;
  prescriptionId: string;
  patientId: string;
  patientName: string;
  dispenseDate: string;
  status: string;
  pharmacistId: string;
  items: LabelMedicine[];
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
