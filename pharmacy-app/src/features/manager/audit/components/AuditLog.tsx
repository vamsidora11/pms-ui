// import { useEffect, useMemo, useState } from "react";
// import { User, Activity, AlertTriangle, TrendingUp, Shield } from "lucide-react";
// import DataTable, { type Column } from "../../../../components/common/Table/Table";
// import { getAuditLogs, type AuditListItemDto } from "../../../../api/audit";

// export default function AuditLog() {
//   const [data, setData] = useState<AuditListItemDto[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [total, setTotal] = useState(0);

//   const pageSize = 10;
//   const [pageNumber, setPageNumber] = useState(1);

//   useEffect(() => {
//     loadData();
//   }, [pageNumber]);

//   async function loadData() {
//     setLoading(true);
//     const result = await getAuditLogs({
//       pageNumber,
//       pageSize,
//       sortBy: "timestamp",
//       sortDirection: "desc"
//     });

//     setData(result.items);
//     setTotal(result.totalCount);
//     setLoading(false);
//   }

//   const stats = useMemo(() => ({
//     total,
//     today: data.filter(a =>
//       new Date(a.timestamp).toDateString() === new Date().toDateString()
//     ).length,
//     failed: data.filter(a => a.action.toLowerCase().includes("failed")).length,
//     critical: data.filter(a => a.action.toLowerCase().includes("rejected")).length
//   }), [data, total]);

//   const auditColumns: Column<AuditListItemDto>[] = [
//     {
//       key: "timestamp",
//       header: "Timestamp",
//       render: value => {
//         const d = new Date(value);
//         return (
//           <div>
//             <div className="text-sm font-medium text-gray-900">
//               {d.toLocaleDateString()}
//             </div>
//             <div className="text-xs text-gray-500">
//               {d.toLocaleTimeString()}
//             </div>
//           </div>
//         );
//       }
//     },
//     {
//       key: "actorUserId",
//       header: "User",
//       render: value => (
//         <div className="flex items-center gap-1.5">
//           <User className="w-3.5 h-3.5 text-gray-400" />
//           <span>{value}</span>
//         </div>
//       )
//     },
//     {
//       key: "action",
//       header: "Action",
//       render: value => (
//         <span className="px-2 py-1 text-xs rounded-lg border bg-blue-50 text-blue-700">
//           {value}
//         </span>
//       )
//     },
//     {
//       key: "entityType",
//       header: "Entity",
//       render: value => (
//         <span className="px-2 py-1 text-xs rounded-lg border bg-gray-50 text-gray-700">
//           {value}
//         </span>
//       )
//     },
//     {
//       key: "entityId",
//       header: "Entity ID",
//       render: value => (
//         <span className="text-sm text-gray-700">
//           {value}
//         </span>
//       )
//     }
//   ];

//   const renderExpandedRow = (log: AuditListItemDto) => (
//     <div className="p-4 bg-gray-50 border-t grid grid-cols-2 gap-4">
//       <div>
//         <div className="text-xs text-gray-500">Action</div>
//         <div className="font-medium">{log.action}</div>
//       </div>
//       <div>
//         <div className="text-xs text-gray-500">Performed By</div>
//         <div className="font-medium">{log.actorUserId}</div>
//       </div>
//     </div>
//   );

//   return (
//     <div className="space-y-6">

//       {/* HEADER */}
//       <div>
//         <h1 className="text-xl font-semibold text-gray-900">System Activity Log</h1>
//         <p className="text-sm text-gray-500">Complete record of all system actions</p>
//       </div>

//       {/* STATS */}
//       <div className="grid grid-cols-4 gap-4">
//         <StatCard icon={<Activity className="text-blue-600" />} value={stats.total} label="Total" />
//         <StatCard icon={<TrendingUp className="text-green-600" />} value={stats.today} label="Today" />
//         <StatCard icon={<AlertTriangle className="text-red-600" />} value={stats.failed} label="Failed" />
//         <StatCard icon={<Shield className="text-orange-600" />} value={stats.critical} label="Critical" />
//       </div>

//       {/* TABLE */}
//       <div className="bg-white rounded-xl border p-6">
//         <DataTable
//           data={data}
//           columns={auditColumns}
//           loading={loading}
//           page={pageNumber}
//           pageSize={pageSize}
//           total={total}
//           onPageChange={setPageNumber}
//           expandable
//           renderExpandedRow={renderExpandedRow}
//         />
//       </div>

//     </div>
//   );
// }

// function StatCard({ icon, value, label }: any) {
//   return (
//     <div className="p-5 bg-white border rounded-xl shadow-sm">
//       {icon}
//       <div className="text-2xl font-bold">{value}</div>
//       <div className="text-xs text-gray-500">{label}</div>
//     </div>
//   );
// }

import { useEffect, useState } from "react";
import DataTable from "../../../../components/common/Table/Table";
import { getAuditLogs, type AuditListItemDto } from "../../../../api/audit";

import Badge from "@components/common/Badge/Badge";
import { getAuditBadgeVariant } from "@audit/utils/auditBadge";

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
  );
}