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
  totalMedicines: number;
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
