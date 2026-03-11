// src/api/dispense.ts
//
// All technician dispense API calls.
// Matches DispenseController.cs routes exactly.
//
import api from "./axiosInstance";
import { ENDPOINTS } from "./endpoints";
import { logger } from "@utils/logger/logger";

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

// Paged wrapper (mirrors PagedResult<T>)
export interface PagedResult<T> {
  items:      T[];
  pageSize:   number;
  totalCount: number;
}

// ── Get dispense queue (PaymentProcessed) ─────────────────────────────────────
// GET /api/dispenses?status=PaymentProcessed&pageSize=50&pageNumber=1
// Used by TechnicianDashboard to populate the queue table
export async function getDispenseQueue(
  pageSize   = 50,
  pageNumber = 1
): Promise<PagedResult<DispenseSummaryDto>> {
  try {
    const res = await api.get<PagedResult<DispenseSummaryDto>>(
      ENDPOINTS.dispenses,
      {
        params: {
          status:     "PaymentProcessed",
          pageSize,
          pageNumber,
        },
      }
    );
    return res.data;
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
    const res = await api.get<DispenseDetailsDto>(
      ENDPOINTS.dispenseById(dispenseId),
      { params: { patientId } }
    );
    const etag = (res.headers["etag"] as string | undefined) ?? "";
    return { dispense: res.data, etag };
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
        headers: { "If-Match": etag },
      }
    );
  } catch (error) {
    logger.error("executeDispense failed", { dispenseId, patientId, error });
    throw error;
  }
}