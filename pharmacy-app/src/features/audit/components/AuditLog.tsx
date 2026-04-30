import Badge from "@components/common/Badge/Badge";
import DataTable, { type Column } from "@components/common/Table/Table";
import type { AuditListItemDto } from "@api/audit";
import { getAuditBadgeVariant } from "../utils/auditBadge";
import { useAuditLogs } from "../hooks/useAuditLogs";

import {
  Activity,
  TrendingUp,
  AlertTriangle,
  Shield,
  User
} from "lucide-react";

export default function AuditLog() {
  const {
    data,
    loading,
    total,
    stats,
    handleServerQueryChange
  } = useAuditLogs();

  // Table columns
  const columns: Column<AuditListItemDto>[] = [
    {
      key: "timestamp",
      header: "Timestamp",
      sortable: true,
      render: (value: string) => {
        const d = new Date(value);
        return (
          <div>
            <div className="font-medium">{d.toLocaleDateString()}</div>
            <div className="text-xs text-gray-500">{d.toLocaleTimeString()}</div>
          </div>
        );
      }
    },
    {
      key: "actorUserId",
      header: "User",
      sortable: true,
      filterable: true,
      filterType: "text",
      render: (value: string) => (
        <div className="flex items-center gap-1.5">
          <User className="w-4 h-4 text-gray-400" />
          {value}
        </div>
      )
    },
    {
      key: "action",
      header: "Action",
      sortable: true,
      filterable: true,
      render: (_value, row) => (
        <Badge
          label={row.action}
          variant={getAuditBadgeVariant(row.action)}
          className="capitalize"
        />
      )
    },
    {
      key: "entityType",
      header: "Entity Type",
      sortable: true,
      filterable: true
    },
    {
      key: "entityId",
      header: "Entity ID",
      filterable: true
    }
  ];

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div>
        <h1 className="text-xl font-semibold text-gray-900">System Activity Log</h1>
        <p className="text-sm text-gray-500">Complete record of all system actions</p>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-4 gap-4">
        <div className="p-5 bg-white border rounded-xl shadow-sm">
          <Activity className="text-blue-600 mb-2" />
          <div className="text-2xl font-bold">{stats.total}</div>
          <div className="text-xs text-gray-500">Total</div>
        </div>

        <div className="p-5 bg-white border rounded-xl shadow-sm">
          <TrendingUp className="text-green-600 mb-2" />
          <div className="text-2xl font-bold">{stats.today}</div>
          <div className="text-xs text-gray-500">Today</div>
        </div>

        <div className="p-5 bg-white border rounded-xl shadow-sm">
          <AlertTriangle className="text-red-600 mb-2" />
          <div className="text-2xl font-bold">{stats.failed}</div>
          <div className="text-xs text-gray-500">Failed</div>
        </div>

        <div className="p-5 bg-white border rounded-xl shadow-sm">
          <Shield className="text-orange-600 mb-2" />
          <div className="text-2xl font-bold">{stats.critical}</div>
          <div className="text-xs text-gray-500">Critical</div>
        </div>
      </div>

      {/* TABLE */}
      <div className="p-6 bg-white rounded-xl border">
        <DataTable
          data={data}
          columns={columns}
          serverSide={true}
          loading={loading}
          totalItems={total}
          initialServerQuery={{
            pageNumber: 1,
            pageSize: 10,
            searchTerm: "",
            sortBy: "timestamp",
            sortDirection: "desc",
          }}
          onServerQueryChange={handleServerQueryChange}
          expandable={false}
          pageSize={10}
        />
      </div>
    </div>
  );
}
