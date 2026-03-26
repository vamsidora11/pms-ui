import { useState, useMemo } from "react";
import { getAuditLogs, type AuditListItemDto } from "@api/audit";

export function useAuditLogs() {
  const [data, setData] = useState<AuditListItemDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);

  async function handleServerQueryChange(query: any) {
    setLoading(true);

    const result = await getAuditLogs({
      pageNumber: query.pageNumber,
      pageSize: query.pageSize,
      search: query.searchTerm || null,

      entityType: query.columnFilters["entityType"] || null,
      entityId: query.columnFilters["entityId"] || null,
      action: query.columnFilters["action"] || null,
      actorUserId: query.columnFilters["actorUserId"] || null,

      dateFrom: query.columnFilters["dateFrom"]
        ? query.columnFilters["dateFrom"].substring(0, 10)
        : null,

      dateTo: query.columnFilters["dateTo"]
        ? query.columnFilters["dateTo"].substring(0, 10)
        : null,

      sortBy: query.sortBy || "timestamp",
      sortDirection: query.sortDirection || "desc",
    });

    setData(result.items);
    setTotal(result.totalCount);
    setLoading(false);
  }

  // Stats computation
  const stats = useMemo(() => {
    const today = data.filter(a =>
      new Date(a.timestamp).toDateString() === new Date().toDateString()
    ).length;

    const failed = data.filter(a =>
      a.action.toLowerCase().includes("failed")
    ).length;

    const critical = data.filter(a =>
      ["lotrejected", "loginfailed", "refreshtokenfailed"].includes(
        a.action.toLowerCase()
      )
    ).length;

    return { total, today, failed, critical };
  }, [data, total]);

  return {
    data,
    total,
    stats,
    loading,
    handleServerQueryChange,
  };
}