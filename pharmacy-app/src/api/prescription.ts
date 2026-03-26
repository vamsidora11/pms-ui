// src/api/prescription.ts
// Single file — DTOs + all API functions merged from prescription.dto.ts + prescription.api.ts

import api from "./axiosInstance";
import { ENDPOINTS } from "./endpoints";
import { logger } from "@utils/logger/logger";

// ── DTOs ──────────────────────────────────────────────────────────────────────

export interface CreatePrescriptionRequestDto {
  patientId: string;
  patientName?: string;
  prescriber: { id: string; name: string };
  medicines: {
    productId: string;
    frequency: string;
    instructions?: string;
    durationDays: number;
    quantityPrescribed: number;
    refillsAllowed: number;
  }[];
}

export interface ReviewPrescriptionRequestDto {
  reviews: {
    prescriptionLineId: string;
    status: "Approved" | "Rejected";
    notes?: string | null;
  }[];
}

export interface PrescriptionValidationSummaryDto {
  totalIssues: number;
  highSeverityCount: number;
  moderateCount: number;
  lowCount: number;
  requiresReview: boolean;
}

export interface PrescriptionSummaryDto {
  id: string;
  patientId: string;
  patientName: string;
  prescriberName: string;
  createdAt: string;
  status: "Created" | "Active" | "Cancelled" | "Completed";
  medicineCount: number;
  validationSummary?: PrescriptionValidationSummaryDto;
}

export interface PrescriptionLineValidationDto {
  drugAllergy?: {
    isPresent: boolean;
    overallSeverity: "High" | "Moderate" | "Low" | "None" | null;
    allergies?: {
      allergenCode: string;
      severity: "High" | "Moderate" | "Low" | "None";
      message: string;
    }[];
  };
  drugInteraction?: {
    isPresent: boolean;
    overallSeverity: "High" | "Moderate" | "Low" | "None" | null;
    interactingWith?: {
      productId: string;
      productName: string;
      severity: "High" | "Moderate" | "Low" | "None";
      message: string;
    }[];
  };
}

export interface PrescriptionLineReviewDto {
  status: "Pending" | "Approved" | "Rejected";
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  notes?: string | null;
}

export interface PrescriptionLineDto {
  id?: string;
  prescriptionLineId?: string;
  productId: string;
  productName: string;
  strength: string;
  frequency: string;
  instructions?: string | null;
  durationDays: number;
  quantityPrescribed: number;
  quantityApprovedPerFill?: number | null;
  quantityDispensed?: number;
  refillsAllowed: number;
  refillsRemaining?: number;
  validation?: PrescriptionLineValidationDto;
  pharmacistReview?: PrescriptionLineReviewDto;
}

export interface PrescriptionDetailsDto {
  id: string;
  patientId: string;
  patientName: string;
  prescriber: { id: string; name: string };
  createdAt: string;
  status: "Created" | "Active" | "Cancelled" | "Completed";
  medicines: PrescriptionLineDto[];
}

export interface PrescriptionListResponseDto {
  items: PrescriptionSummaryDto[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface ApiEntityResponse<T> {
  data: T;
  etag?: string;
}

export type SortDirection = "asc" | "desc";

export interface PrescriptionHistoryQueryParams {
  prescriptionId?: string;
  patientId?: string;
  patientName?: string;
  prescriberName?: string;
  createdAt?: string;
  status?: string;
  pageSize?: number;
  sortBy?: string;
  sortDirection?: SortDirection;
  pageNumber?: number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function normalizeEtag(value: unknown): string | undefined {
  if (!isNonEmptyString(value)) return undefined;
  const cleaned = value.trim().replace(/"/g, "");
  return cleaned.length > 0 ? cleaned : undefined;
}

export function extractEtag(headers: unknown): string | undefined {
  if (!headers) return undefined;
  const getter = headers as { get?: (name: string) => unknown };
  if (typeof getter.get === "function") {
    const viaGetter = normalizeEtag(
      getter.get("etag") ?? getter.get("ETag") ?? getter.get("Etag")
    );
    if (viaGetter) return viaGetter;
  }
  if (typeof headers === "object" && headers !== null) {
    const record = headers as Record<string, unknown>;
    return normalizeEtag(record.etag ?? record.ETag ?? record.Etag);
  }
  return undefined;
}

function requireEtag(etag: string): string {
  if (!isNonEmptyString(etag)) throw new Error("Missing ETag");
  return etag.trim();
}

type PatientPrescriptionHistoryResponse =
  | PrescriptionListResponseDto
  | PrescriptionSummaryDto[]
  | PrescriptionDetailsDto
  | PrescriptionDetailsDto[];

function toSummaryDto(
  dto: PrescriptionDetailsDto | PrescriptionSummaryDto
): PrescriptionSummaryDto {
  if ("medicineCount" in dto) return dto;
  return {
    id: dto.id,
    patientId: dto.patientId,
    patientName: dto.patientName,
    prescriberName: dto.prescriber.name,
    createdAt: dto.createdAt,
    status: dto.status,
    medicineCount: Array.isArray(dto.medicines) ? dto.medicines.length : 0,
  };
}

function normalizePatientPrescriptionHistory(
  payload: PatientPrescriptionHistoryResponse,
  fallbackPageNumber: number,
  fallbackPageSize: number
): PrescriptionListResponseDto {
  if (Array.isArray(payload)) {
    const items = payload.map((item) => toSummaryDto(item));
    return {
      items,
      pageNumber: fallbackPageNumber,
      pageSize: fallbackPageSize,
      totalCount: items.length,
      totalPages: 1,
      hasNextPage: false,
      hasPreviousPage: false,
    };
  }
  if ("items" in payload) return payload;
  return {
    items: [toSummaryDto(payload)],
    pageNumber: fallbackPageNumber,
    pageSize: fallbackPageSize,
    totalCount: 1,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false,
  };
}

// ── API Functions ─────────────────────────────────────────────────────────────

export async function createPrescription(
  payload: CreatePrescriptionRequestDto
): Promise<ApiEntityResponse<PrescriptionDetailsDto>> {
  const res = await api.post<PrescriptionDetailsDto>(ENDPOINTS.prescriptions, payload);
  return { data: res.data, etag: extractEtag(res.headers) };
}

export async function getAllPrescriptions(
  query: PrescriptionHistoryQueryParams = {}
): Promise<PrescriptionListResponseDto> {
  const params: Record<string, string | number> = {
    pageNumber: query.pageNumber ?? 1,
    pageSize:   query.pageSize   ?? 10,
  };
  if (isNonEmptyString(query.prescriptionId)) params.prescriptionId = query.prescriptionId.trim();
  if (isNonEmptyString(query.patientId))      params.patientId      = query.patientId.trim();
  if (isNonEmptyString(query.patientName))    params.patientName    = query.patientName.trim();
  if (isNonEmptyString(query.prescriberName)) params.prescriberName = query.prescriberName.trim();
  if (isNonEmptyString(query.createdAt))      params.createdAt      = query.createdAt.trim();
  if (isNonEmptyString(query.status))         params.status         = query.status.trim();
  if (isNonEmptyString(query.sortBy))         params.sortBy         = query.sortBy.trim();
  if (query.sortDirection)                    params.sortDirection   = query.sortDirection;

  const res = await api.get<PrescriptionListResponseDto>(ENDPOINTS.prescriptions, { params });
  return res.data;
}

export async function getPrescriptionsByPatient(
  patientId: string,
  query: Pick<PrescriptionHistoryQueryParams, "pageNumber" | "pageSize"> = {}
): Promise<PrescriptionListResponseDto> {
  const normalizedPatientId = patientId.trim();
  const pageNumber = query.pageNumber ?? 1;
  const pageSize   = query.pageSize   ?? 10;
  const res = await api.get<PatientPrescriptionHistoryResponse>(
    ENDPOINTS.prescriptionsByPatient(normalizedPatientId),
    { params: { pageNumber, pageSize } }
  );
  return normalizePatientPrescriptionHistory(res.data, pageNumber, pageSize);
}

export async function getPrescriptionById(
  id: string,
  patientId: string
): Promise<ApiEntityResponse<PrescriptionDetailsDto>> {
  const res = await api.get<PrescriptionDetailsDto>(ENDPOINTS.prescriptionById(id), {
    params: { patientId },
  });
  return { data: res.data, etag: extractEtag(res.headers) };
}

export async function reviewPrescription(
  id: string,
  patientId: string,
  payload: ReviewPrescriptionRequestDto,
  etag: string
): Promise<string | undefined> {
  const res = await api.put(`/api/prescriptions/${id}/review`, payload, {
    params:  { patientId },
    headers: { "If-Match": requireEtag(etag) },
  });
  return extractEtag(res.headers);
}

export async function cancelPrescription(
  id: string,
  reason: string | undefined,
  etag: string
): Promise<string | undefined> {
  const res = await api.post(
    `/api/prescriptions/${id}/cancel`,
    reason ? { reason } : undefined,
    { headers: { "If-Match": requireEtag(etag) } }
  );
  return extractEtag(res.headers);
}

export async function getPendingPrescriptions(): Promise<PrescriptionSummaryDto[]> {
  const page = await getAllPrescriptions({ pageNumber: 1, pageSize: 20, status: "Created" });
  return page.items;
}

/**
 * Fetch Active prescriptions for the pharmacist dispense queue.
 * Backend status = "Active" (PrescriptionStatus.Active) —
 * these are validated prescriptions ready for dispensing.
 */
export async function getValidatedPrescriptions(
  pageSize   = 50,
  pageNumber = 1
): Promise<PrescriptionListResponseDto> {
  try {
    const res = await api.get<PrescriptionListResponseDto>(ENDPOINTS.prescriptions, {
      params: {
        status: "Active",   // ← matches PrescriptionStatus.Active on backend
        pageSize,
        pageNumber,
      },
    });
    return res.data;
  } catch (error) {
    logger.error("getValidatedPrescriptions failed", { error });
    throw error;
  }
}