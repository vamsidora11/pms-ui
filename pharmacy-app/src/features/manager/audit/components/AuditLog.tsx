import { useEffect, useState, useMemo } from "react";
import DataTable from "../../../../components/common/Table/Table";
import { getAuditLogs, type AuditListItemDto } from "../../../../api/audit";

import Badge from "@components/common/Badge/Badge";
import { getAuditBadgeVariant } from "@audit/utils/auditBadge";

import { Activity, TrendingUp, AlertTriangle, Shield } from "lucide-react";

export default function AuditLog() {
  const [data, setData] = useState<AuditListItemDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);

  // Handles queries from the DataTable
  async function handleServerQueryChange(query) {
    setLoading(true);

    const result = await getAuditLogs({
      pageNumber: query.pageNumber,
      pageSize: query.pageSize,
      search: query.searchTerm || null,

      // Map filters
      entityType: query.columnFilters["entityType"] || null,
      entityId: query.columnFilters["entityId"] || null,
      action: query.columnFilters["action"] || null,
      actorUserId: query.columnFilters["actorUserId"] || null,

      // Date filters (Table sends ISO full-datetime; extract YYYY-MM-DD)
      dateFrom: query.columnFilters["dateFrom"]
        ? query.columnFilters["dateFrom"].substring(0, 10)
        : null,

      dateTo: query.columnFilters["dateTo"]
        ? query.columnFilters["dateTo"].substring(0, 10)
        : null,

      // Sorting
      sortBy: query.sortBy || "timestamp",
      sortDirection: query.sortDirection || "desc",
    });

    setData(result.items);
    setTotal(result.totalCount);
    setLoading(false);
  }

  // -------------------------------
  // ⭐ ADDED: Stats derived from real data
  // -------------------------------
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

    return {
      total,
      today,
      failed,
      critical
    };
  }, [data, total]);

  const columns = [
    {
      key: "timestamp",
      header: "Timestamp",
      sortable: true,
      render: (value) => {
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
      filterType: "text"
    },
    {
      key: "action",
      header: "Action",
      sortable: true,
      filterable: true,
      render: (_, row) => (
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
      filterable: true,
    },
    {
      key: "entityId",
      header: "Entity ID",
      filterable: true,
    }
  ];

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div>
        <h1 className="text-xl font-semibold text-gray-900">System Activity Log</h1>
        <p className="text-sm text-gray-500">Complete record of all system actions</p>
      </div>

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

// import { useEffect, useState } from "react";
// import DataTable from "../../../../components/common/Table/Table";
// import { getAuditLogs, type AuditListItemDto } from "../../../../api/audit";

// import Badge from "@components/common/Badge/Badge";
// import { getAuditBadgeVariant } from "@audit/utils/auditBadge";

// export default function AuditLog() {
//   const [data, setData] = useState<AuditListItemDto[]>([]);
//   const [loading, setLoading] = useState(false);
//   const [total, setTotal] = useState(0);

//   // Handles queries from the DataTable
//   async function handleServerQueryChange(query) {
//     setLoading(true);

//     const result = await getAuditLogs({
//       pageNumber: query.pageNumber,
//       pageSize: query.pageSize,
//       search: query.searchTerm || null,

//       // Map filters
//       entityType: query.columnFilters["entityType"] || null,
//       entityId: query.columnFilters["entityId"] || null,
//       action: query.columnFilters["action"] || null,
//       actorUserId: query.columnFilters["actorUserId"] || null,

//       // Date filters (Table sends ISO full-datetime; extract YYYY-MM-DD)
//       dateFrom: query.columnFilters["dateFrom"]
//         ? query.columnFilters["dateFrom"].substring(0, 10)
//         : null,

//       dateTo: query.columnFilters["dateTo"]
//         ? query.columnFilters["dateTo"].substring(0, 10)
//         : null,

//       // Sorting
//       sortBy: query.sortBy || "timestamp",
//       sortDirection: query.sortDirection || "desc",
//     });

//     setData(result.items);
//     setTotal(result.totalCount);
//     setLoading(false);
//   }

//   const columns = [
//     {
//       key: "timestamp",
//       header: "Timestamp",
//       sortable: true,
//       render: (value) => {
//         const d = new Date(value);
//         return (
//           <div>
//             <div className="font-medium">{d.toLocaleDateString()}</div>
//             <div className="text-xs text-gray-500">{d.toLocaleTimeString()}</div>
//           </div>
//         );
//       }
//     },
//     {
//       key: "actorUserId",
//       header: "User",
//       sortable: true,
//       filterable: true,
//       filterType: "text"
//     },
//     {
      
// key: "action",
//   header: "Action",
//   sortable: true,
//   filterable: true,
//   render: (_, row) => (
//     <Badge
//       label={row.action}
//       variant={getAuditBadgeVariant(row.action)}
//       className="capitalize"
//     />
//   )

//     },
//     {
//       key: "entityType",
//       header: "Entity Type",
//       sortable: true,
//       filterable: true,
//     },
//     {
//       key: "entityId",
//       header: "Entity ID",
//       filterable: true,
//     }
//   ];

//   return (
//     <div className="p-6 bg-white rounded-xl border">

//       <DataTable
//         data={data}
//         columns={columns}

//         serverSide={true}
//         loading={loading}
//         totalItems={total}

//         initialServerQuery={{
//           pageNumber: 1,
//           pageSize: 10,
//           searchTerm: "",
//           sortBy: "timestamp",
//           sortDirection: "desc",
//         }}

//         onServerQueryChange={handleServerQueryChange}

//         expandable={false}
//         pageSize={10}
//       />
//     </div>
//   );
// }

