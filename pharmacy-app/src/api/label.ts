import api from "./axiosInstance";
import { ENDPOINTS } from "./endpoints";

import type {
  LabelQueuePrescription,
  LabelPrescriptionDetails,
} from "@labels/types/label.types";

const LABEL_QUEUE_STATUS = "PaymentProcessed";
const DEFAULT_LABEL_QUEUE_PAGE_SIZE = 10;
const DEFAULT_LABEL_QUEUE_PAGE_NUMBER = 1;

/* ======================================
   GET LABEL QUEUE
====================================== */

export async function getLabelQueue(
  pageSize: number = DEFAULT_LABEL_QUEUE_PAGE_SIZE,
  pageNumber: number = DEFAULT_LABEL_QUEUE_PAGE_NUMBER
) {
  const response = await api.get(ENDPOINTS.dispenses, {
    params: {
      pageSize,
      pageNumber,
      status: LABEL_QUEUE_STATUS,
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
