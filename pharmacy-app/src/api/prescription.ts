import api from "./axiosInstance";
import { ENDPOINTS } from "./endpoints";
import { logger } from "@utils/logger/logger";
import {
  reviewPrescriptionLine,
  validatePrescription,
  activatePrescription,
} from "./prescriptionValidation";

import type {
  CreatePrescriptionRequest,
  PrescriptionSummaryDto,
  PrescriptionDetailsDto,
  ReviewPrescriptionRequest,
} from "@prescription/types/prescription.types";

type SortDirection = "asc" | "desc";

export interface PrescriptionHistoryQueryParams {
  prescriptionId?: string;
  patientName?: string;
  prescriberName?: string;
  createdAt?: string;
  status?: string;
  pageSize?: number;
  sortBy?: string;
  sortDirection?: SortDirection;
  pageNumber?: number;
}

export interface PrescriptionHistoryPageResult {
  items: PrescriptionSummaryDto[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

interface LegacyPrescriptionPageResponse {
  items?: PrescriptionSummaryDto[];
  continuationToken?: string | null;
  totalCount?: number;
  totalPages?: number;
  pageNumber?: number;
  pageSize?: number;
  hasNextPage?: boolean;
  hasPreviousPage?: boolean;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (typeof value !== "object" || value === null) {
    return null;
  }
  return value as Record<string, unknown>;
}

function getNumeric(value: unknown): number | null {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return null;
  }
  return value;
}

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

function extractEtag(headers: unknown): string | undefined {
  if (!headers) {
    return undefined;
  }

  const getter = headers as { get?: (name: string) => unknown };
  if (typeof getter.get === "function") {
    const viaGetter = normalizeEtag(getter.get("etag"));
    if (viaGetter) {
      return viaGetter;
    }
  }

  const record = asRecord(headers);
  return normalizeEtag(record?.etag ?? record?.ETag);
}

function withEtag<T extends object>(
  data: T,
  headers: unknown
): T & { __etag?: string } {
  return {
    ...data,
    __etag: extractEtag(headers),
  };
}

function requireEtag(etag: string | undefined, operation: string): string {
  if (!isNonEmptyString(etag)) {
    throw new Error(`Missing ETag for ${operation}`);
  }
  return etag.trim();
}

function parseHistoryResponse(
  data: unknown,
  requestedPageNumber: number,
  requestedPageSize: number
): PrescriptionHistoryPageResult {
  const root = asRecord(data);

  const items = Array.isArray(root?.items)
    ? (root.items as PrescriptionSummaryDto[])
    : Array.isArray(data)
      ? (data as PrescriptionSummaryDto[])
      : [];

  const totalCount =
    getNumeric(root?.totalCount) ??
    getNumeric(root?.count) ??
    getNumeric(root?.totalItems) ??
    items.length;

  const pageSize = getNumeric(root?.pageSize) ?? requestedPageSize;
  const pageNumber = getNumeric(root?.pageNumber) ?? requestedPageNumber;
  const totalPages =
    getNumeric(root?.totalPages) ??
    Math.max(1, Math.ceil(totalCount / Math.max(1, pageSize)));

  const hasNextPage =
    typeof root?.hasNextPage === "boolean"
      ? root.hasNextPage
      : pageNumber < totalPages;

  const hasPreviousPage =
    typeof root?.hasPreviousPage === "boolean"
      ? root.hasPreviousPage
      : pageNumber > 1;

  return {
    items,
    pageNumber,
    pageSize,
    totalCount,
    totalPages,
    hasNextPage,
    hasPreviousPage,
  };
}

// ================== CREATE PRESCRIPTION ==================

export async function createPrescription(
  payload: CreatePrescriptionRequest
): Promise<PrescriptionDetailsDto> {
  try {
    const res = await api.post<PrescriptionDetailsDto>(
      ENDPOINTS.prescriptions,
      payload
    );
    return withEtag(res.data, res.headers);
  } catch (error) {
    logger.error("Create prescription failed", { payload, error });
    throw error;
  }
}

// ================== GET PRESCRIPTION DETAILS ==================

export async function getPrescriptionById(
  prescriptionId: string
): Promise<PrescriptionDetailsDto> {
  try {
    const res = await api.get<PrescriptionDetailsDto>(
      `${ENDPOINTS.prescriptions}/${prescriptionId}`
    );
    return withEtag(res.data, res.headers);
  } catch (error) {
    logger.error("Fetching prescription details failed", {
      prescriptionId,
      error,
    });
    throw error;
  }
}

// Alias for backward compatibility
export const getPrescriptionDetails = getPrescriptionById;

// ================== PAGINATED: GET BY PATIENT ==================

export async function getPrescriptionsByPatient(
  patientId: string,
  pageSize = 10,
  continuationToken?: string | null
): Promise<{ items: PrescriptionSummaryDto[]; continuationToken: string | null }> {
  try {
    const params: Record<string, string | number> = { pageSize };
    if (continuationToken) {
      params.continuationToken = continuationToken;
    }

    const res = await api.get(
      `${ENDPOINTS.prescriptions}/patient/${patientId}`,
      { params }
    );

    const data = (res.data ?? {}) as LegacyPrescriptionPageResponse;

    return {
      items: data.items ?? [],
      continuationToken: data.continuationToken ?? null,
    };
  } catch (error) {
    logger.error("Fetching prescriptions by patient failed", {
      patientId,
      error,
    });
    throw error;
  }
}

// ================== PAGINATED: SEARCH ==================

export async function searchPrescriptions(
  searchTerm: string,
  pageSize = 10,
  continuationToken?: string | null
): Promise<{ items: PrescriptionSummaryDto[]; continuationToken: string | null }> {
  try {
    const params: Record<string, string | number> = {
      searchTerm,
      pageSize,
    };

    if (continuationToken) {
      params.continuationToken = continuationToken;
    }

    const res = await api.get(`${ENDPOINTS.prescriptions}/search`, { params });
    const data = (res.data ?? {}) as LegacyPrescriptionPageResponse;

    return {
      items: data.items ?? [],
      continuationToken: data.continuationToken ?? null,
    };
  } catch (error) {
    logger.error("Searching prescriptions failed", {
      searchTerm,
      error,
    });
    throw error;
  }
}

// ================== PAGINATED: GET ALL (SERVER FILTER/SORT/PAGE) ==================

export async function getAllPrescriptions(
  query: PrescriptionHistoryQueryParams = {}
): Promise<PrescriptionHistoryPageResult> {
  const pageNumber = query.pageNumber ?? 1;
  const pageSize = query.pageSize ?? 5;

  const params: Record<string, string | number> = {
    pageNumber,
    pageSize,
  };

  if (isNonEmptyString(query.prescriptionId)) {
    params.prescriptionId = query.prescriptionId.trim();
  }
  if (isNonEmptyString(query.patientName)) {
    params.patientName = query.patientName.trim();
  }
  if (isNonEmptyString(query.prescriberName)) {
    params.prescriberName = query.prescriberName.trim();
  }
  if (isNonEmptyString(query.createdAt)) {
    params.createdAt = query.createdAt.trim();
  }
  if (isNonEmptyString(query.status) && query.status !== "All") {
    params.status = query.status.trim();
  }
  if (isNonEmptyString(query.sortBy)) {
    params.sortBy = query.sortBy.trim();
  }
  if (query.sortDirection) {
    params.sortDirection = query.sortDirection;
  }

  try {
    const res = await api.get(ENDPOINTS.prescriptions, { params });
    return parseHistoryResponse(res.data, pageNumber, pageSize);
  } catch (error) {
    logger.error("Fetching all prescriptions failed", { query, error });
    throw error;
  }
}

// ================== CANCEL PRESCRIPTION ==================

export async function cancelPrescription(
  prescriptionId: string,
  reason?: string,
  etag?: string
): Promise<string | undefined> {
  try {
    const res = await api.post(
      `${ENDPOINTS.prescriptions}/${prescriptionId}/cancel`,
      reason ? { reason } : undefined,
      {
        headers: { "If-Match": requireEtag(etag, "cancel prescription") },
      }
    );
    return extractEtag(res.headers);
  } catch (error) {
    logger.error("Cancel prescription failed", {
      prescriptionId,
      error,
    });
    throw error;
  }
}

export { reviewPrescriptionLine, validatePrescription, activatePrescription };

// Backward-compatible wrapper now implemented via line-based endpoint.
export async function reviewPrescription(
  prescriptionId: string,
  payload: ReviewPrescriptionRequest,
  patientId?: string,
  etag?: string
): Promise<string | undefined> {
  if (!isNonEmptyString(patientId)) {
    throw new Error("Missing patientId for review prescription");
  }
  let currentEtag = requireEtag(etag, "review prescription");

  for (const medicine of payload.medicines) {
    const nextEtag = await reviewPrescriptionLine(
      prescriptionId,
      patientId,
      medicine.prescriptionMedicineId,
      medicine.decision,
      medicine.overrideReason ?? null,
      currentEtag
    );
    currentEtag = nextEtag ?? currentEtag;
  }

  logger.info("Prescription reviewed successfully", { prescriptionId });
  return currentEtag;
}

// ================== CREATE DISPENSE FROM PRESCRIPTION ==================

export async function createDispenseForPrescription(
  prescriptionId: string
): Promise<void> {
  try {
    await api.post(`/api/dispenses/prescription/${prescriptionId}`);
    logger.info("Dispense created from prescription", { prescriptionId });
  } catch (error) {
    logger.error("Create dispense from prescription failed", {
      prescriptionId,
      error,
    });
    throw error;
  }
}

// ================== GET PENDING PRESCRIPTIONS ==================

export async function getPendingPrescriptions(): Promise<PrescriptionSummaryDto[]> {
  try {
    const result = await getAllPrescriptions({
      status: "Created",
      pageSize: 20,
      pageNumber: 1,
    });
    return result.items;
  } catch (error) {
    logger.error("Get pending prescriptions failed", { error });
    throw error;
  }
}
