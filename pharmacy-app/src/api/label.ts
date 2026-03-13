import api from "./axiosInstance";
import { ENDPOINTS } from "./endpoints";

import type {
  LabelQueuePrescription,
  LabelPrescriptionDetails,
} from "@labels/types/label.types";

/* ======================================
   GET LABEL QUEUE
====================================== */

export async function getLabelQueue(
  pageSize: number = 20,
  pageNumber: number = 1
) {
  const response = await api.get(ENDPOINTS.labelQueue, {
    params: {
      pageSize,
      pageNumber,
      status: "PaymentProcessed",
    },
  });

  return response.data as {
    items: LabelQueuePrescription[];
    pageSize: number;
    totalCount: number;
  };
}

/* ======================================
   GET PRESCRIPTION FOR LABELS
====================================== */

export async function getDispenseLabels(dispenseId: string, patientId: string) {
  const response = await api.get(ENDPOINTS.dispenseLabel(dispenseId), {
    params: { patientId },
  });

  return response.data as LabelPrescriptionDetails;
}
