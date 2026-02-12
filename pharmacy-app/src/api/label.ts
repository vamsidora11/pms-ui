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
  continuationToken?: string
) {
  const response = await api.get(
    ENDPOINTS.labelQueue,
    {
      params: {
        pageSize,
        continuationToken,
      },
    }
  );

  return response.data as {
    items: LabelQueuePrescription[];
    continuationToken?: string;
  };
}

/* ======================================
   GET PRESCRIPTION FOR LABELS
====================================== */

export async function getPrescriptionForLabels(
  prescriptionId: string
) {
  const response = await api.get(
    ENDPOINTS.prescriptionLabels(prescriptionId)
  );

  return response.data as LabelPrescriptionDetails;
}
