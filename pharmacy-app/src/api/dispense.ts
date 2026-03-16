// src/api/dispense.ts
//
// All technician dispense API calls.
// Matches DispenseController.cs routes exactly.
//
import api from "./axiosInstance";
import { ENDPOINTS } from "./endpoints";
import { logger } from "@utils/logger/logger";

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function normalizeEtag(value: unknown): string | undefined {
  if (!isNonEmptyString(value)) {
    return undefined;
  }
  const cleaned = value.trim().replace(/"/g, "");
  return cleaned.length > 0 ? cleaned : undefined;
}

export function extractEtag(headers: unknown): string | undefined {
  if (!headers) {
    return undefined;
  }

  const getter = headers as { get?: (name: string) => unknown };
  if (typeof getter.get === "function") {
    const viaGetter = normalizeEtag(
      getter.get("etag") ?? getter.get("ETag") ?? getter.get("Etag")
    );
    if (viaGetter) {
      return viaGetter;
    }
  }

  if (typeof headers === "object" && headers !== null) {
    const record = headers as Record<string, unknown>;
    return normalizeEtag(record.etag ?? record.ETag ?? record.Etag);
  }

  return undefined;
}

function requireEtag(etag: string): string {
  if (!isNonEmptyString(etag)) {
    throw new Error("Missing ETag");
  }
  return etag.trim();
}

// ── DTOs (mirrors C# records exactly) ────────────────────────────────────────

export interface DispenseLotUsageDto {
  lotNumber: string;
  quantity:  number;
  expiry:    string; // ISO string
}

export interface DispenseItemPricingDto {
  unitPrice:       number;
  total:           number;
  insurancePaid:   number;
  patientPayable:  number;
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

export interface DispensePreviewItemDto {
  prescriptionLineId: string;
  productId: string;
  productName: string;
  activeRefillNumber: number;
  remainingQty: number;
  safeStockAvailable: number;
}

export interface DispensePreviewDto {
  prescriptionId: string;
  patientId: string;
  patientName: string;
  items: DispensePreviewItemDto[];
}

export interface CreateDispenseItemRequestDto {
  prescriptionLineId: string;
  productId: string;
  quantityToDispense: number;
  isManualAdjustment: boolean;
}

export interface CreateDispenseRequestDto {
  prescriptionId: string;
  items: CreateDispenseItemRequestDto[];
}

// Summary — used in the queue list
export interface DispenseSummaryDto {
  id:             string;
  prescriptionId: string;
  patientId:      string;
  dispenseDate:   string; // ISO string
  // "Created" | "InsuranceApproved" | "PaymentProcessed" | "Dispensed" | "Cancelled"
  status:         string;
  itemCount:      number;
  grandTotal:     number;
}

interface DispenseSummaryResponseDto {
  dispenseId?: string;
  id?: string;
  prescriptionId: string;
  patientId: string;
  dispenseDateUtc?: string;
  dispenseDate?: string;
  status: string;
  itemCount: number;
  grandTotal: number;
}

// Details — used in PackingListModal
export interface DispenseDetailsDto {
  id:             string;
  prescriptionId: string;
  patientId:      string;
  dispenseDate:   string;
  status:         string;
  pharmacistId:   string;
  items:          DispenseItemDto[];
  billingSummary: DispenseBillingSummaryDto;
}

interface DispenseDetailsResponseDto {
  dispenseId?: string;
  id?: string;
  prescriptionId: string;
  patientId: string;
  dispenseDateUtc?: string;
  dispenseDate?: string;
  status: string;
  pharmacistId?: string;
  items: DispenseItemDto[];
  billingSummary: DispenseBillingSummaryDto;
}

// Paged wrapper (mirrors PagedResult<T>)
export interface PagedResult<T> {
  items:      T[];
  pageSize:   number;
  totalCount: number;
}

function normalizeDispenseSummary(payload: DispenseSummaryResponseDto): DispenseSummaryDto {
  return {
    id: payload.dispenseId ?? payload.id ?? "",
    prescriptionId: payload.prescriptionId,
    patientId: payload.patientId,
    dispenseDate: payload.dispenseDateUtc ?? payload.dispenseDate ?? "",
    status: payload.status,
    itemCount: payload.itemCount,
    grandTotal: payload.grandTotal,
  };
}

function normalizeDispenseDetails(payload: DispenseDetailsResponseDto): DispenseDetailsDto {
  return {
    id: payload.dispenseId ?? payload.id ?? "",
    prescriptionId: payload.prescriptionId,
    patientId: payload.patientId,
    dispenseDate: payload.dispenseDateUtc ?? payload.dispenseDate ?? "",
    status: payload.status,
    pharmacistId: payload.pharmacistId ?? "",
    items: payload.items,
    billingSummary: payload.billingSummary,
  };
}

// ── Dispense preview (per prescription) ──────────────────────────────────────
// GET /api/prescriptions/{prescriptionId}/dispense-preview?patientId={patientId}
export async function getDispensePreview(
  prescriptionId: string,
  patientId: string
): Promise<DispensePreviewDto> {
  try {
    const res = await api.get<DispensePreviewDto>(
      ENDPOINTS.prescriptionDispensePreview(prescriptionId),
      { params: { patientId } }
    );
    return res.data;
  } catch (error) {
    logger.error("getDispensePreview failed", { prescriptionId, patientId, error });
    throw error;
  }
}

// ── Create dispense (checkout) ───────────────────────────────────────────────
// POST /api/dispenses?patientId={patientId}
export async function createDispense(
  patientId: string,
  payload: CreateDispenseRequestDto
): Promise<{ dispense: DispenseDetailsDto; etag: string }> {
  try {
    const res = await api.post<DispenseDetailsResponseDto>(
      ENDPOINTS.dispenses,
      payload,
      {
        params: { patientId },
      }
    );
    return { dispense: normalizeDispenseDetails(res.data), etag: extractEtag(res.headers) ?? "" };
  } catch (error) {
    logger.error("createDispense failed", { patientId, error });
    throw error;
  }
}

// ── Get dispenses for a prescription ────────────────────────────────────────
// GET /api/dispenses/prescription/{prescriptionId}?patientId={patientId}
export async function getDispensesByPrescription(
  prescriptionId: string,
  patientId: string
): Promise<DispenseSummaryDto[]> {
  try {
    const res = await api.get<DispenseSummaryResponseDto[]>(
      ENDPOINTS.dispensesByPrescription(prescriptionId),
      { params: { patientId } }
    );
    return res.data.map(normalizeDispenseSummary);
  } catch (error) {
    logger.error("getDispensesByPrescription failed", { prescriptionId, patientId, error });
    throw error;
  }
}

// ── Submit insurance claim ──────────────────────────────────────────────────
// POST /api/dispenses/{dispenseId}/insurance-claim?patientId={patientId}
export async function submitInsuranceClaim(
  dispenseId: string,
  patientId: string,
  etag: string
): Promise<string | undefined> {
  try {
    const res = await api.post(
      ENDPOINTS.dispenseInsuranceClaim(dispenseId),
      null,
      {
        params: { patientId },
        headers: { "If-Match": requireEtag(etag) },
      }
    );
    return extractEtag(res.headers);
  } catch (error) {
    logger.error("submitInsuranceClaim failed", { dispenseId, patientId, error });
    throw error;
  }
}

// ── Cancel dispense ─────────────────────────────────────────────────────────
// PUT /api/dispenses/{dispenseId}/cancel?patientId={patientId}
export async function cancelDispense(
  dispenseId: string,
  patientId: string,
  etag: string
): Promise<void> {
  try {
    await api.put(
      ENDPOINTS.dispenseCancel(dispenseId),
      null,
      {
        params: { patientId },
        headers: { "If-Match": requireEtag(etag) },
      }
    );
  } catch (error) {
    logger.error("cancelDispense failed", { dispenseId, patientId, error });
    throw error;
  }
}

// ── Get dispense queue (PaymentProcessed) ─────────────────────────────────────
// GET /api/dispenses?status=PaymentProcessed&pageSize=50&pageNumber=1
// Used by TechnicianDashboard to populate the queue table
export async function getDispenseQueue(
  pageSize   = 50,
  pageNumber = 1
): Promise<PagedResult<DispenseSummaryDto>> {
  try {
    const res = await api.get<PagedResult<DispenseSummaryResponseDto>>(
      ENDPOINTS.dispenses,
      {
        params: {
          status:     "PaymentProcessed",
          pageSize,
          pageNumber,
        },
      }
    );
    return {
      items: res.data.items.map(normalizeDispenseSummary),
      pageSize: res.data.pageSize,
      totalCount: res.data.totalCount,
    };
  } catch (error) {
    logger.error("getDispenseQueue failed", { error });
    throw error;
  }
}

// ── Get dispense details (packing list) ──────────────────────────────────────
// GET /api/dispenses/{dispenseId}?patientId={patientId}
// Used by PackingListModal
export async function getDispenseById(
  dispenseId: string,
  patientId:  string
): Promise<{ dispense: DispenseDetailsDto; etag: string }> {
  try {
    const res = await api.get<DispenseDetailsResponseDto>(
      ENDPOINTS.dispenseById(dispenseId),
      { params: { patientId } }
    );
    const etag = extractEtag(res.headers) ?? "";
    return { dispense: normalizeDispenseDetails(res.data), etag };
  } catch (error) {
    logger.error("getDispenseById failed", { dispenseId, patientId, error });
    throw error;
  }
}

// ── Execute dispense (technician marks as Dispensed) ─────────────────────────
// PUT /api/dispenses/{dispenseId}/execute?patientId={patientId}
// Requires If-Match header with the ETag from getDispenseById
// Returns 204 NoContent on success
export async function executeDispense(
  dispenseId: string,
  patientId:  string,
  etag:       string
): Promise<void> {
  try {
    await api.put(
      ENDPOINTS.dispenseExecute(dispenseId),
      null, // no body
      {
        params:  { patientId },
        headers: { "If-Match": requireEtag(etag) },
      }
    );
  } catch (error) {
    logger.error("executeDispense failed", { dispenseId, patientId, error });
    throw error;
  }
}
