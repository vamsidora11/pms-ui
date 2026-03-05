import api from "./axiosInstance";
import type {
  CreatePrescriptionRequestDto,
  PrescriptionDetailsDto,
  PrescriptionListResponseDto,
  ReviewPrescriptionRequestDto,
} from "./prescription.dto";

type SortDirection = "asc" | "desc";

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

export interface ApiEntityResponse<T> {
  data: T;
  etag?: string;
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

export async function createPrescription(
  payload: CreatePrescriptionRequestDto
): Promise<ApiEntityResponse<PrescriptionDetailsDto>> {
  const res = await api.post<PrescriptionDetailsDto>("/api/prescriptions", payload);
  return {
    data: res.data,
    etag: extractEtag(res.headers),
  };
}

export async function getAllPrescriptions(
  query: PrescriptionHistoryQueryParams = {}
): Promise<PrescriptionListResponseDto> {
  const params: Record<string, string | number> = {
    pageNumber: query.pageNumber ?? 1,
    pageSize: query.pageSize ?? 10,
  };

  if (isNonEmptyString(query.prescriptionId)) {
    params.prescriptionId = query.prescriptionId.trim();
  }
  if (isNonEmptyString(query.patientId)) {
    params.patientId = query.patientId.trim();
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
  if (isNonEmptyString(query.status)) {
    params.status = query.status.trim();
  }
  if (isNonEmptyString(query.sortBy)) {
    params.sortBy = query.sortBy.trim();
  }
  if (query.sortDirection) {
    params.sortDirection = query.sortDirection;
  }

  const res = await api.get<PrescriptionListResponseDto>("/api/prescriptions", {
    params,
  });

  return res.data;
}

export async function getPrescriptionById(
  id: string,
  patientId: string
): Promise<ApiEntityResponse<PrescriptionDetailsDto>> {
  const res = await api.get<PrescriptionDetailsDto>(`/api/prescriptions/${id}`, {
    params: { patientId },
  });
  return {
    data: res.data,
    etag: extractEtag(res.headers),
  };
}

export async function reviewPrescription(
  id: string,
  patientId: string,
  payload: ReviewPrescriptionRequestDto,
  etag: string
): Promise<string | undefined> {
  const res = await api.put(`/api/prescriptions/${id}/review`, payload, {
    params: { patientId },
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
    {
      headers: { "If-Match": requireEtag(etag) },
    }
  );
  return extractEtag(res.headers);
}

export async function getPendingPrescriptions() {
  const page = await getAllPrescriptions({
    pageNumber: 1,
    pageSize: 20,
    status: "Created",
  });
  return page.items;
}
