import api from "./axiosInstance";
import { ENDPOINTS } from "./endpoints";
import { logger } from "@utils/logger/logger";

/* ======================================================
   DTO TYPES (mirror ASP.NET Core camelCase serialization)
====================================================== */

/**
 * This matches AuditListItemDto from backend
 */
export interface AuditListItemDto {
  id: string;
  entityType: string;
  entityId: string;
  action: string;
  actorUserId: string;
  timestamp: string; // ISO date
}

/**
 * Generic paged wrapper from backend
 */
export interface PagedResultDto<T> {
  items: T[];
  totalCount: number;
  pageSize: number;
}

/**
 * Query filters supported by AuditController
 */
export interface AuditQuery {
  pageNumber?: number;
  pageSize?: number;
  search?: string | null;
  entityType?: string | null;
  entityId?: string | null;
  action?: string | null;
  actorUserId?: string | null;
  dateFrom?: string | null; // yyyy-MM-dd
  dateTo?: string | null;   // yyyy-MM-dd
  sortBy?: string;          // usually "timestamp"
  sortDirection?: "asc" | "desc";
}

/* ======================================================
   API FUNCTIONS
====================================================== */

/**
 * Fetch audit logs with full server-side filtering & pagination
 */
export async function getAuditLogs(
  query: AuditQuery
): Promise<PagedResultDto<AuditListItemDto>> {
  try {
    const res = await api.get<PagedResultDto<AuditListItemDto>>(
      ENDPOINTS.auditList,
      {
        params: {
          pageNumber: query.pageNumber ?? 1,
          pageSize: query.pageSize ?? 10,
          search: query.search ?? null,
          entityType: query.entityType ?? null,
          entityId: query.entityId ?? null,
          action: query.action ?? null,
          actorUserId: query.actorUserId ?? null,
          dateFrom: query.dateFrom ?? null,
          dateTo: query.dateTo ?? null,
          sortBy: query.sortBy ?? "timestamp",
          sortDirection: query.sortDirection ?? "desc",
        },
      }
    );

    const items = Array.isArray(res.data?.items) ? res.data.items : [];

    return {
      items,
      pageSize: Number(res.data?.pageSize ?? query.pageSize ?? 10),
      totalCount: Number(res.data?.totalCount ?? items.length)
    };
  } catch (error) {
    logger.error("getAuditLogs failed", { query, error });
    throw error;
  }
}

/**
 * Convenience wrapper: get a single audit entry by ID
 * (Only works if backend adds /audit/{id})
 */
export async function getAuditById(id: string): Promise<AuditListItemDto | null> {
  try {
    const res = await api.get<AuditListItemDto>(ENDPOINTS.auditById(id));
    return res.data ?? null;
  } catch (error) {
    logger.warn("getAuditById failed or not implemented", { id, error });
    return null;
  }
}