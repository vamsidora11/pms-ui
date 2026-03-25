import api from "./axiosInstance";

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

function requireEtag(etag: string): string {
  if (!isNonEmptyString(etag)) {
    throw new Error("Missing ETag");
  }

  return etag.trim();
}

export function extractEtag(headers: unknown): string | undefined {
  if (!headers) return undefined;

  const getter = headers as { get?: (name: string) => unknown };
  if (typeof getter.get === "function") {
    const viaGetter = normalizeEtag(
      getter.get("etag") ?? getter.get("ETag") ?? getter.get("Etag"),
    );
    if (viaGetter) return viaGetter;
  }

  if (typeof headers === "object" && headers !== null) {
    const record = headers as Record<string, unknown>;
    return normalizeEtag(record.etag ?? record.ETag ?? record.Etag);
  }

  return undefined;
}

export interface ManagerInventoryWorkflowDto {
  requestedBy: string;
  requestedAt: string;
  reviewedAt: string | null;
  reviewedBy: string | null;
  rejectionReason: string | null;
}

export interface ManagerInventoryLotDto {
  id: string;
  productId: string;
  supplierName: string | null;
  expiry: string | null;
  requestedQuantity: number;
  initialQuantity: number;
  quantityAvailable: number;
  status: string;
  workflow: ManagerInventoryWorkflowDto;
}

export interface ManagerProductInteractionDto {
  productId: string;
  name: string;
  severity: string;
}

export interface ManagerProductBasePricingDto {
  unitPrice: number;
  taxPercent: number;
}

export interface ManagerProductInventoryDto {
  id: string;
  name: string;
  strength: string;
  form: string;
  manufacturer: string;
  isActive: boolean;
  allergyTags: string[];
  interactions: ManagerProductInteractionDto[];
  basePricing: ManagerProductBasePricingDto;
  totalQuantityAvailable: number;
  inventoryLots: ManagerInventoryLotDto[];
}

export interface ManagerProductDetailsDto {
  id: string;
  name: string;
  strength: string;
  form: string;
  manufacturer: string;
  isActive: boolean;
  allergyTags: string[];
  interactions: ManagerProductInteractionDto[];
  basePricing: ManagerProductBasePricingDto;
  availableStock: number;
}

export interface ManagerPagedResultDto<T> {
  items: T[];
  pageSize: number;
  totalCount: number;
}

export interface ManagerInventoryProductsQueryParams {
  name?: string;
  manufacturer?: string;
  isActive?: boolean;
  sortBy?: string;
  sortDirection?: "asc" | "desc";
  pageSize?: number;
  pageNumber?: number;
}

export interface CreateManagerProductPayload {
  id: string;
  name: string;
  strength: string;
  form: string;
  manufacturer: string;
  isActive: boolean;
  allergyTags: string[];
  interactions: ManagerProductInteractionDto[];
  unitPrice: number;
  taxPercent: number;
}

export interface UpdateManagerProductPayload {
  name: string;
  strength: string;
  form: string;
  manufacturer: string;
  isActive: boolean;
  allergyTags: string[];
  interactions: ManagerProductInteractionDto[];
  unitPrice: number;
  taxPercent: number;
}

export interface RequestManagerInventoryLotPayload {
  productId: string;
  requestedQuantity: number;
}

export interface ReviewManagerInventoryLotPayload {
  approved: boolean;
  quantity?: number | null;
  expiry?: string | null;
  supplierName?: string | null;
  rejectionReason?: string | null;
}

export interface ManagerEntityResponse<T> {
  data: T;
  etag?: string;
}

const MANAGER_ENDPOINTS = {
  inventoryProducts: "/api/inventory/products",
  inventoryProductLots: (productId: string) => `/api/inventory/products/${productId}/lots`,
  inventoryLotRequest: "/api/inventory/lots/request",
  inventoryPendingLots: "/api/inventory/lots/pending",
  inventoryReviewLot: (lotId: string) => `/api/inventory/lots/${lotId}/review`,
  products: "/api/products",
  productById: (productId: string) => `/api/products/${productId}`,
  productSearch: "/api/products/search",
};

export async function getManagerInventoryProducts(
  query: ManagerInventoryProductsQueryParams,
): Promise<ManagerPagedResultDto<ManagerProductInventoryDto>> {
  const res = await api.get<ManagerPagedResultDto<ManagerProductInventoryDto>>(
    MANAGER_ENDPOINTS.inventoryProducts,
    { params: query },
  );

  return {
    items: Array.isArray(res.data?.items) ? res.data.items : [],
    pageSize: res.data?.pageSize ?? query.pageSize ?? 20,
    totalCount: res.data?.totalCount ?? 0,
  };
}

export async function getManagerProductLots(productId: string): Promise<ManagerInventoryLotDto[]> {
  const res = await api.get<ManagerInventoryLotDto[]>(MANAGER_ENDPOINTS.inventoryProductLots(productId));
  return Array.isArray(res.data) ? res.data : [];
}

export async function requestManagerInventoryLot(
  payload: RequestManagerInventoryLotPayload,
): Promise<ManagerInventoryLotDto> {
  const res = await api.post<ManagerInventoryLotDto>(MANAGER_ENDPOINTS.inventoryLotRequest, payload);
  return res.data;
}

export async function getManagerPendingInventoryLots(
  query: Pick<ManagerInventoryProductsQueryParams, "pageSize" | "pageNumber"> = {},
): Promise<ManagerPagedResultDto<ManagerInventoryLotDto>> {
  const res = await api.get<ManagerPagedResultDto<ManagerInventoryLotDto>>(
    MANAGER_ENDPOINTS.inventoryPendingLots,
    { params: query },
  );

  return {
    items: Array.isArray(res.data?.items) ? res.data.items : [],
    pageSize: res.data?.pageSize ?? query.pageSize ?? 20,
    totalCount: res.data?.totalCount ?? 0,
  };
}

export async function reviewManagerInventoryLot(
  lotId: string,
  payload: ReviewManagerInventoryLotPayload,
): Promise<ManagerInventoryLotDto> {
  const normalizedPayload: ReviewManagerInventoryLotPayload = {
    approved: payload.approved,
    quantity: payload.quantity ?? null,
    expiry: payload.expiry ? new Date(`${payload.expiry}T00:00:00`).toISOString() : null,
    supplierName: payload.supplierName?.trim() || null,
    rejectionReason: payload.rejectionReason?.trim() || null,
  };

  const res = await api.put<ManagerInventoryLotDto>(
    MANAGER_ENDPOINTS.inventoryReviewLot(lotId),
    normalizedPayload,
  );
  return res.data;
}

export async function createManagerProduct(
  payload: CreateManagerProductPayload,
): Promise<ManagerEntityResponse<ManagerProductDetailsDto>> {
  const res = await api.post<ManagerProductDetailsDto>(MANAGER_ENDPOINTS.products, payload);
  return {
    data: res.data,
    etag: extractEtag(res.headers),
  };
}

export async function getManagerProductById(
  productId: string,
): Promise<ManagerEntityResponse<ManagerProductDetailsDto>> {
  const res = await api.get<ManagerProductDetailsDto>(MANAGER_ENDPOINTS.productById(productId));
  return {
    data: res.data,
    etag: extractEtag(res.headers),
  };
}

export async function updateManagerProduct(
  productId: string,
  payload: UpdateManagerProductPayload,
  etag: string,
): Promise<ManagerEntityResponse<ManagerProductDetailsDto>> {
  const res = await api.put<ManagerProductDetailsDto>(
    MANAGER_ENDPOINTS.productById(productId),
    payload,
    {
      headers: { "If-Match": requireEtag(etag) },
    },
  );

  return {
    data: res.data,
    etag: extractEtag(res.headers),
  };
}

export async function searchManagerProducts(query: string): Promise<ManagerProductDetailsDto[]> {
  const res = await api.get<ManagerProductDetailsDto[]>(MANAGER_ENDPOINTS.productSearch, {
    params: { q: query },
  });
  return Array.isArray(res.data) ? res.data : [];
}
