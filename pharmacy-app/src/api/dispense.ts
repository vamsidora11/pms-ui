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
): Promise<void> {
  try {
    await api.post(
      ENDPOINTS.dispenseInsuranceClaim(dispenseId),
      null,
      { params: { patientId }, headers: { "If-Match": etag } }
    );
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
      params: { status: "PaymentProcessed", pageSize, pageNumber },
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