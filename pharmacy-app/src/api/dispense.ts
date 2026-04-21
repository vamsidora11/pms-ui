// src/api/dispense.ts
// All dispense API calls — matches DispenseController.cs exactly.

import api from "./axiosInstance";
import { ENDPOINTS } from "./endpoints";
import { extractEtag } from "./prescription";
import { logger } from "@utils/logger/logger";

// ── DTOs ──────────────────────────────────────────────────────────────────────

export interface DispenseLotUsageDto {
  lotId:     string;
  quantity:  number;
  expiry:    string;
}

export interface DispenseItemPricingDto {
  unitPrice:      number;
  total:          number;
  insurancePaid:  number;
  patientPayable: number;
}

export interface DispenseItemDto {
  prescriptionLineId: string;
  productId:          string;
  refillNumber:       number;
  quantityDispensed:  number;
  isManualAdjustment: boolean;
  lotsUsed:           DispenseLotUsageDto[];
  pricing:            DispenseItemPricingDto;
}

export interface DispenseBillingSummaryDto {
  grandTotal:          number;
  totalInsurancePaid:  number;
  totalPatientPayable: number;
}

export interface DispenseSummaryDto {
  id:             string;
  prescriptionId: string;
  patientId:      string;
  patientName:    string;
  dispenseDate:   string;
  status:         string;
  itemCount:      number;
  grandTotal:     number;
}

export interface DispenseDetailsDto {
  id:             string;
  prescriptionId: string;
  patientId:      string;
  patientName:    string;
  dispenseDate:   string;
  status:         string;
  pharmacistId:   string;
  items:          DispenseItemDto[];
  billingSummary: DispenseBillingSummaryDto;
}

export interface PagedResult<T> {
  items:      T[];
  pageSize:   number;
  totalCount: number;
}

// ── Preview DTOs ──────────────────────────────────────────────────────────────

export interface InsuranceInfoDto {
  provider: string;
  policyId: string;
}

export interface DispensePreviewItemDto {
  prescriptionLineId: string;
  productId:          string;
  productName:        string;
  activeRefillNumber: number;
  remainingQty:       number;
  safeStockAvailable: number;
 unitPrice: number; 
}

export interface DispensePreviewDto {
  prescriptionId: string;
  patientId:      string;
  patientName:    string;
  insurance:      InsuranceInfoDto | null;
  items:          DispensePreviewItemDto[];
  
}

// ── Checkout Request DTOs ─────────────────────────────────────────────────────

export interface CreateDispenseItemRequest {
  prescriptionLineId: string;
  productId:          string;
  quantityToDispense: number;
  isManualAdjustment?: boolean;
}

export interface CreateDispenseRequest {
  prescriptionId: string;
  items:          CreateDispenseItemRequest[];
}

// ── API Functions ─────────────────────────────────────────────────────────────

/**
 * GET /api/prescriptions/{prescriptionId}/dispense-preview?patientId={patientId}
 * Returns eligible dispense lines with safe stock + unit price from inventory/product.
 */
export async function getDispensePreview(
  prescriptionId: string,
  patientId:      string
): Promise<DispensePreviewDto> {
  try {
    const res = await api.get<DispensePreviewDto>(
      ENDPOINTS.dispensePreview(prescriptionId),
      { params: { patientId } }
    );
    return res.data;
  } catch (error) {
    logger.error("getDispensePreview failed", { prescriptionId, patientId, error });
    throw error;
  }
}

/**
 * POST /api/dispenses?patientId={patientId}
 */
export async function createDispense(
  patientId: string,
  request:   CreateDispenseRequest
): Promise<{ dispense: DispenseDetailsDto; etag: string }> {
  try {
    const res = await api.post<DispenseDetailsDto>(ENDPOINTS.dispenses, request, {
      params: { patientId },
    });
    return { dispense: res.data, etag: extractEtag(res.headers) ?? "" };
  } catch (error) {
    logger.error("createDispense failed", { patientId, prescriptionId: request.prescriptionId, error });
    throw error;
  }
}

/**
 * POST /api/dispenses/{dispenseId}/insurance-claim?patientId={patientId}
 */
export async function submitInsuranceClaim(
  dispenseId: string,
  patientId:  string,
  etag:       string
): Promise<{ data: DispenseDetailsDto; headers: any; etag: string }> {
  try {
    const res = await api.post<DispenseDetailsDto>(
      ENDPOINTS.dispenseInsuranceClaim(dispenseId),
      null,
      { params: { patientId }, headers: { "If-Match": etag } }
    );
    return { data: res.data, headers: res.headers, etag: extractEtag(res.headers) ?? "" };
  } catch (error) {
    logger.error("submitInsuranceClaim failed", { dispenseId, patientId, error });
    throw error;
  }
}

/**
 * GET /api/dispenses?status=PaymentProcessed — technician queue
 */
export async function getDispenseQueue(
  pageSize   = 50,
  pageNumber = 1
): Promise<PagedResult<DispenseSummaryDto>> {
  try {
    const res = await api.get<PagedResult<DispenseSummaryDto>>(ENDPOINTS.dispenses, {
      params: { status: "ReadyForDispense", pageSize, pageNumber },
    });
    return res.data;
  } catch (error) {
    logger.error("getDispenseQueue failed", { error });
    throw error;
  }
}

/**
 * GET /api/dispenses/{dispenseId}?patientId={patientId}
 */
export async function getDispenseById(
  dispenseId: string,
  patientId:  string
): Promise<{ dispense: DispenseDetailsDto; etag: string }> {
  try {
    const res = await api.get<DispenseDetailsDto>(ENDPOINTS.dispenseById(dispenseId), {
      params: { patientId },
    });
    return { dispense: res.data, etag: extractEtag(res.headers) ?? "" };
  } catch (error) {
    logger.error("getDispenseById failed", { dispenseId, patientId, error });
    throw error;
  }
}

/**
 * PUT /api/dispenses/{dispenseId}/execute?patientId={patientId}
 */
export async function executeDispense(
  dispenseId: string,
  patientId:  string,
  etag:       string
): Promise<void> {
  try {
    await api.put(ENDPOINTS.dispenseExecute(dispenseId), null, {
      params:  { patientId },
      headers: { "If-Match": etag },
    });
  } catch (error) {
    logger.error("executeDispense failed", { dispenseId, patientId, error });
    throw error;
  }
}
// Return ETag variant
export async function executeDispenseWithEtag(
  dispenseId: string,
  patientId: string,
  etag: string
): Promise<{ etag: string }> {
  try {
    const res = await api.put(ENDPOINTS.dispenseExecute(dispenseId), null, {
      params: { patientId },
      headers: { "If-Match": etag },
    });
    return { etag: extractEtag(res.headers) ?? "" };
  } catch (error) {
    logger.error("executeDispenseWithEtag failed", { dispenseId, patientId, error });
    throw error;
  }
}

/**
 * PUT /api/dispenses/{dispenseId}/ready
 * Mark dispense as Ready (before final execute)
 */
export async function markDispenseReady(
  dispenseId: string,
  patientId: string,
  etag: string
): Promise<void> {
  try {
    await api.put(`/api/dispenses/${dispenseId}/ready`, null, {
      params: { patientId },
      headers: { "If-Match": etag },
    });
  } catch (error) {
    logger.error("markDispenseReady failed", { dispenseId, patientId, error });
    throw error;
  }
}

// Return ETag variant
export async function markDispenseReadyWithEtag(
  dispenseId: string,
  patientId: string,
  etag: string
): Promise<{ etag: string }> {
  try {
    const res = await api.put(`/api/dispenses/${dispenseId}/ready`, null, {
      params: { patientId },
      headers: { "If-Match": etag },
    });
    return { etag: extractEtag(res.headers) ?? "" };
  } catch (error) {
    logger.error("markDispenseReadyWithEtag failed", { dispenseId, patientId, error });
    throw error;
  }
}

/**
 * POST /api/dispenses/{dispenseId}/payment
 * Mark dispense as paid (calls dispense.MarkPaid on server)
 */
export async function markDispensePaid(
  dispenseId: string,
  patientId: string,
  etag: string,
  amount: number
): Promise<void> {
  try {
    await api.post(
      `/api/dispenses/${dispenseId}/payment`,
      { amount },
      {
        params: { patientId },
        headers: { "If-Match": etag },
      }
    );
  } catch (error) {
    logger.error("markDispensePaid failed", { dispenseId, patientId, amount, error });
    throw error;
  }
}

// Return ETag variant
export async function markDispensePaidWithEtag(
  dispenseId: string,
  patientId: string,
  etag: string,
  amount: number
): Promise<{ etag: string }> {
  try {
    const res = await api.post(
      `/api/dispenses/${dispenseId}/payment`,
      { amount },
      {
        params: { patientId },
        headers: { "If-Match": etag },
      }
    );
    return { etag: extractEtag(res.headers) ?? "" };
  } catch (error) {
    logger.error("markDispensePaidWithEtag failed", { dispenseId, patientId, amount, error });
    throw error;
  }
}

// NOTE: ready-for-dispense endpoint was replaced by the unified execute endpoint.
// Use `executeDispense` (defined above) which calls the correct `/execute` endpoint.

/**
 * PUT /api/dispenses/{dispenseId}/payment?patientId={patientId}
 */
/* markPayment removed — use /api/payments via payments.api.ts */

/**
 * PUT /api/dispenses/{dispenseId}/cancel?patientId={patientId}
 */
export async function cancelDispense(
  dispenseId: string,
  patientId:  string,
  etag:       string
): Promise<void> {
  try {
    await api.put(ENDPOINTS.dispenseCancel(dispenseId), null, {
      params:  { patientId },
      headers: { "If-Match": etag },
    });
  } catch (error) {
    logger.error("cancelDispense failed", { dispenseId, patientId, error });
    throw error;
  }
}
