// import React, { useEffect, useMemo, useState, useCallback } from "react";
// import {
//   DollarSign,
//   CreditCard,
//   Clock,
//   CheckCircle2,
//   Download,
//   ChevronRight,
//   Banknote,
//   Smartphone,
//   Building2,
//   Shield,
//   User,
//   ArrowUpRight,
//   ArrowDownRight,
//   Activity,
// } from "lucide-react";
// import {
//   LineChart,
//   Line,
//   XAxis,
//   YAxis,
//   CartesianGrid,
//   Tooltip,
//   ResponsiveContainer,
//   PieChart,
//   Pie,
//   Cell,
// } from "recharts";

// // Common Table
// import DataTable, { type Column, type ServerTableQuery } from "@components/common/Table/Table";

// // API (axiosInstance + ENDPOINTS + logger style)
// import {
//   getPaymentSummary,
//   getPaymentTrend,
//   getPaymentModeBreakdown,
//   getPaymentTransactions,
//   type Period,
//   type PaymentTransactionsResponseDto,
// } from "@api/payments";

// // ─── Types (Frontend view types) ───────────────────────────────────────────────
// type PaymentMode = "Cash" | "UPI" | "Card" | "Bank Transfer" | "Insurance";
// type PaymentStatus = "Cleared" | "Pending" | "Failed";

// interface TransactionRow {
//   id: string;
//   patientName: string;
//   patientId: string;
//   rxId: string;
//   amount: number;
//   mode: PaymentMode | string; // server may send "Insurance"
//   type: "Patient" | "Insurance";
//   status: PaymentStatus;
//   transactionId?: string | null;
//   timestamp: string;
//   insurerName?: string | null;
// }

// // ─── UI Constants ─────────────────────────────────────────────────────────────
// const MODE_META: Record<PaymentMode, { badge: string; chart: string; icon: React.ReactNode }> = {
//   Cash: { badge: "bg-emerald-100 text-emerald-700", chart: "#10B981", icon: <Banknote className="w-3.5 h-3.5" /> },
//   UPI: { badge: "bg-purple-100 text-purple-700", chart: "#8B5CF6", icon: <Smartphone className="w-3.5 h-3.5" /> },
//   Card: { badge: "bg-blue-100 text-blue-700", chart: "#3B82F6", icon: <CreditCard className="w-3.5 h-3.5" /> },
//   "Bank Transfer": { badge: "bg-orange-100 text-orange-700", chart: "#F59E0B", icon: <Building2 className="w-3.5 h-3.5" /> },
//   Insurance: { badge: "bg-cyan-100 text-cyan-700", chart: "#06B6D4", icon: <Shield className="w-3.5 h-3.5" /> },
// };

// function ModeBadge({ mode }: { mode: string }) {
//   const isKnown = (Object.keys(MODE_META) as PaymentMode[]).includes(mode as PaymentMode);
//   const m = isKnown ? MODE_META[mode as PaymentMode] : MODE_META.Cash; // fallback palette
//   return (
//     <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${m.badge}`}>
//       {m.icon} {mode}
//     </span>
//   );
// }

// function StatusBadge({ status }: { status: PaymentStatus }) {
//   if (status === "Cleared")
//     return (
//       <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
//         <CheckCircle2 className="w-3 h-3" />
//         Cleared
//       </span>
//     );
//   if (status === "Failed")
//     return (
//       <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
//         <span className="w-3 h-3 flex items-center justify-center">✕</span>
//         Failed
//       </span>
//     );
//   return (
//     <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
//       <Clock className="w-3 h-3" />
//       Pending
//     </span>
//   );
// }

// function CustomLineTip({ active, payload, label }: any) {
//   if (!active || !payload?.length) return null;
//   return (
//     <div className="bg-white border border-gray-200 shadow-lg rounded-xl px-4 py-3 text-sm min-w-[170px]">
//       <p className="font-semibold text-gray-700 mb-2">{label}</p>
//       {payload.map((e: any) => (
//         <div key={e.name} className="flex justify-between items-center gap-4">
//           <span style={{ color: e.color }} className="text-xs">{e.name}</span>
//           <span className="font-medium text-gray-800">${Number(e.value).toLocaleString()}</span>
//         </div>
//       ))}
//     </div>
//   );
// }

// function CustomPieTip({ active, payload, total }: any) {
//   if (!active || !payload?.length) return null;
//   const item = payload[0];
//   const pct = ((item.value / total) * 100).toFixed(1);
//   return (
//     <div className="bg-white border border-gray-200 shadow-lg rounded-xl px-4 py-3 text-sm">
//       <p className="font-semibold text-gray-800">{item.payload.name}</p>
//       <p className="text-blue-600">${Number(item.value).toLocaleString()}</p>
//       <p className="text-gray-400">{pct}% of total</p>
//     </div>
//   );
// }

// // Helpers
// const toISODate = (dateStrOrISO: string) => {
//   // DataTable date filter sends "YYYY-MM-DDTHH:mm:ss"; API expects "yyyy-MM-dd"
//   const tIndex = dateStrOrISO.indexOf("T");
//   return tIndex > 0 ? dateStrOrISO.slice(0, tIndex) : dateStrOrISO;
// };

// const SORT_MAP: Record<string, "id" | "patientname" | "rxid" | "amount" | "mode" | "status" | "timestamp"> = {
//   id: "id",
//   patientName: "patientname",
//   rxId: "rxid",
//   amount: "amount",
//   mode: "mode",
//   status: "status",
//   timestamp: "timestamp",
// };

// export default function PaymentDashboard() {
//   const [selectedPeriod, setSelectedPeriod] = useState<Period>("week");

//   // KPI
//   const [summaryLoading, setSummaryLoading] = useState(false);
//   const [summary, setSummary] = useState<{
//     totalCollected: number;
//     patientCollected: number;
//     insuranceCollected: number;
//     totalPending: number;
//     pendingCount: number;
//     vs: {
//       totalCollectedDeltaPct?: number;
//       patientCollectedDeltaPct?: number;
//       insuranceCollectedDeltaPct?: number;
//       pendingDeltaPct?: number;
//     };
//   } | null>(null);

//   // Trend Chart
//   const [trendLoading, setTrendLoading] = useState(false);
//   const [trendData, setTrendData] = useState<{ day: string; patient: number; insurance: number }[]>([]);

//   // Mode Breakdown (donut)
//   const [modeLoading, setModeLoading] = useState(false);
//   const [modeData, setModeData] = useState<{ name: string; value: number }[]>([]);
//   const patientTotal = useMemo(() => modeData.reduce((s, d) => s + d.value, 0), [modeData]);

//   // Table (server-side)
//   const [tableLoading, setTableLoading] = useState(false);
//   const [tableRows, setTableRows] = useState<TransactionRow[]>([]);
//   const [tableTotal, setTableTotal] = useState(0);
//   const [initialQuery] = useState<ServerTableQuery>({
//     pageNumber: 1,
//     pageSize: 8,
//     searchTerm: "",
//     sortBy: "timestamp",
//     sortDirection: "desc",
//     columnFilters: {},
//   });

//   // ── Fetch KPI
//   useEffect(() => {
//     let mounted = true;
//     (async () => {
//       try {
//         setSummaryLoading(true);
//         const res = await getPaymentSummary(selectedPeriod);
//         if (!mounted) return;
//         setSummary({
//           totalCollected: Number(res.totalCollected),
//           patientCollected: Number(res.patientCollected),
//           insuranceCollected: Number(res.insuranceCollected),
//           totalPending: Number(res.totalPending),
//           pendingCount: res.pendingCount,
//           vs: {
//             totalCollectedDeltaPct: Number(res.vsPrevious?.totalCollectedDeltaPct ?? 0),
//             patientCollectedDeltaPct: Number(res.vsPrevious?.patientCollectedDeltaPct ?? 0),
//             insuranceCollectedDeltaPct: Number(res.vsPrevious?.insuranceCollectedDeltaPct ?? 0),
//             pendingDeltaPct: Number(res.vsPrevious?.pendingDeltaPct ?? 0),
//           },
//         });
//       } catch {
//         // keep UI calm; show placeholders
//         setSummary(null);
//       } finally {
//         setSummaryLoading(false);
//       }
//     })();
//     return () => {
//       mounted = false;
//     };
//   }, [selectedPeriod]);

//   // ── Fetch Trend
//   useEffect(() => {
//     let mounted = true;
//     (async () => {
//       try {
//         setTrendLoading(true);
//         const res = await getPaymentTrend(selectedPeriod);
//         if (!mounted) return;
//         const data = (res.data ?? []).map((p) => ({
//           day: p.label,
//           patient: Number(p.patient),
//           insurance: Number(p.insurance),
//         }));
//         setTrendData(data);
//       } catch {
//         setTrendData([]);
//       } finally {
//         setTrendLoading(false);
//       }
//     })();
//     return () => {
//       mounted = false;
//     };
//   }, [selectedPeriod]);

//   // ── Fetch Mode Breakdown (Patient)
//   useEffect(() => {
//     let mounted = true;
//     (async () => {
//       try {
//         setModeLoading(true);
//         const res = await getPaymentModeBreakdown(selectedPeriod, "Patient");
//         if (!mounted) return;
//         const donut = (res.breakdown ?? []).map((b) => ({
//           name: b.mode, // "Cash", "UPI", ...
//           value: Number(b.amount),
//         }));
//         setModeData(donut);
//       } catch {
//         setModeData([]);
//       } finally {
//         setModeLoading(false);
//       }
//     })();
//     return () => {
//       mounted = false;
//     };
//   }, [selectedPeriod]);

//   // ── DataTable Columns (keep same cell UI)
//   const columns: Column<TransactionRow>[] = useMemo(
//     () => [
//       {
//         key: "id",
//         header: "Payment ID",
//         sortable: true,
//         filterable: true,
//         render: (_value, row) => (
//           <div className="min-w-[150px]">
//             <div className="font-mono text-xs text-gray-800 font-semibold">{row.id}</div>
//             {row.type === "Insurance" && row.insurerName && (
//               <div className="text-xs text-cyan-600 mt-0.5 flex items-center gap-1">
//                 <Shield className="w-3 h-3" />
//                 {row.insurerName}
//               </div>
//             )}
//           </div>
//         ),
//       },
//       {
//         key: "patientName",
//         header: "Patient",
//         sortable: true,
//         filterable: true,
//         render: (_value, row) => (
//           <div>
//             <div className="font-medium text-gray-900 flex items-center gap-1.5">
//               <div
//                 className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0 ${
//                   row.type === "Insurance" ? "bg-cyan-500" : "bg-blue-500"
//                 }`}
//               >
//                 {row.patientName
//                   .split(" ")
//                   .map((n) => n[0])
//                   .join("")
//                   .slice(0, 2)}
//               </div>
//               {row.patientName}
//             </div>
//             <div className="text-xs text-gray-400 mt-0.5 ml-7.5">{row.patientId}</div>
//           </div>
//         ),
//       },
//       {
//         key: "rxId",
//         header: "RX ID",
//         sortable: true,
//         filterable: true,
//         render: (value) => <span className="font-mono text-xs text-gray-700">{String(value)}</span>,
//       },
//       {
//         key: "amount",
//         header: "Amount",
//         sortable: true,
//         render: (_value, row) => <span className="font-semibold text-gray-900">${row.amount.toFixed(2)}</span>,
//       },
//       {
//         key: "mode",
//         header: "Mode",
//         sortable: true,
//         filterable: true,
//         filterType: "select",
//         filterOptions: ["Cash", "UPI", "Card", "Bank Transfer", "Insurance"],
//         render: (_value, row) => <ModeBadge mode={String(row.mode)} />,
//       },
//       {
//         key: "transactionId",
//         header: "Transaction ID",
//         sortable: false,
//         filterable: true,
//         render: (_value, row) =>
//           row.transactionId ? (
//             <span className="font-mono text-xs text-gray-700 bg-gray-50 border border-gray-200 px-2 py-0.5 rounded">
//               {row.transactionId}
//             </span>
//           ) : (
//             <span className="text-gray-400 text-xs">—</span>
//           ),
//       },
//       {
//         key: "status",
//         header: "Status",
//         sortable: true,
//         filterable: true,
//         filterType: "select",
//         filterOptions: ["Cleared", "Pending", "Failed"],
//         render: (_value, row) => <StatusBadge status={row.status} />,
//       },
//       {
//         key: "timestamp",
//         header: "Date & Time",
//         sortable: true,
//         filterable: true,
//         filterType: "date",
//         render: (_value, row) => (
//           <div className="text-xs">
//             <div className="text-gray-700">
//               {new Date(row.timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
//             </div>
//             <div className="text-gray-400">
//               {new Date(row.timestamp).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
//             </div>
//           </div>
//         ),
//       },
//     ],
//     []
//   );

//   // ── Handle DataTable server query changes
//   const handleServerQueryChange = useCallback(
//     async (q: ServerTableQuery) => {
//       try {
//         setTableLoading(true);

//         // map DataTable query -> API query
//         const sortKey = q.sortBy ? SORT_MAP[String(q.sortBy)] ?? "timestamp" : "timestamp";
//         const sortDir = q.sortDirection ?? "desc";

//         // Only filters we expose in the table header (status, mode, date)
//         const status = q.columnFilters["status"] || "all";
//         const mode = q.columnFilters["mode"] || "all";

//         // Equal-date filter => send dateFrom=dateTo=YYYY-MM-DD
//         const filterDate = q.columnFilters["timestamp"] ? toISODate(q.columnFilters["timestamp"]) : "";
//         const dateFrom = filterDate || undefined;
//         const dateTo = filterDate || undefined;

//         const res: PaymentTransactionsResponseDto = await getPaymentTransactions({
//           page: q.pageNumber,
//           pageSize: q.pageSize,
//           search: q.searchTerm,
//           status: (status as any) || "all",
//           mode: (mode as any) || "all",
//           sortKey,
//           sortDir,
//           dateFrom,
//           dateTo,
//         });

//         setTableRows(
//           (res.data ?? []).map((r) => ({
//             id: r.id,
//             patientName: r.patientName,
//             patientId: r.patientId,
//             rxId: r.rxId,
//             amount: Number(r.amount),
//             mode: r.mode as PaymentMode | string,
//             type: r.type,
//             status: r.status,
//             transactionId: r.transactionId,
//             timestamp: r.timestamp,
//             insurerName: r.insurerName,
//           }))
//         );
//         setTableTotal(res.pagination?.total ?? (res.data?.length ?? 0));
//       } catch {
//         setTableRows([]);
//         setTableTotal(0);
//       } finally {
//         setTableLoading(false);
//       }
//     },
//     []
//   );

//   // ── KPI Cards (computed display)
//   const kpiCards = useMemo(() => {
//     const totalCollected = summary?.totalCollected ?? 0;
//     const patientCollected = summary?.patientCollected ?? 0;
//     const insuranceCollected = summary?.insuranceCollected ?? 0;
//     const totalPending = summary?.totalPending ?? 0;
//     const pendingCount = summary?.pendingCount ?? 0;
//     const vs = summary?.vs ?? {};

//     const fmt = (n: number) =>
//       `$${Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
//     const pct = (n?: number) => (n === undefined || n === null ? undefined : `${n >= 0 ? "+" : ""}${n.toFixed(1)}%`);

//     return [
//       {
//         label: "Total Collected",
//         value: fmt(totalCollected),
//         sub: "All cleared payments",
//         icon: DollarSign,
//         color: "bg-blue-50 text-blue-600",
//         delta: pct(vs.totalCollectedDeltaPct),
//         deltaDir: (vs.totalCollectedDeltaPct ?? 0) >= 0 ? ("up" as const) : ("down" as const),
//       },
//       {
//         label: "Patient Payments",
//         value: fmt(patientCollected),
//         sub: `${Math.round((patientCollected / (totalCollected || 1)) * 100)}% of total`,
//         icon: User,
//         color: "bg-blue-50 text-blue-600",
//         delta: pct(vs.patientCollectedDeltaPct),
//         deltaDir: (vs.patientCollectedDeltaPct ?? 0) >= 0 ? ("up" as const) : ("down" as const),
//       },
//       {
//         label: "Insurance Claims",
//         value: fmt(insuranceCollected),
//         sub: `${Math.round((insuranceCollected / (totalCollected || 1)) * 100)}% of total`,
//         icon: Shield,
//         color: "bg-cyan-50 text-cyan-600",
//         delta: pct(vs.insuranceCollectedDeltaPct),
//         deltaDir: (vs.insuranceCollectedDeltaPct ?? 0) >= 0 ? ("up" as const) : ("down" as const),
//       },
//       {
//         label: "Pending",
//         value: fmt(totalPending),
//         sub: `${pendingCount} transactions`,
//         icon: Clock,
//         color: "bg-amber-50 text-amber-600",
//         delta: undefined,
//         deltaDir: "up" as const,
//       },
//     ];
//   }, [summary]);

//   return (
//     <div className="space-y-6 max-w-7xl mx-auto">
//       {/* Header */}
//       <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
//         <div>
//           <h1 className="text-gray-900">Payment Dashboard</h1>
//           <p className="text-gray-500 mt-0.5">Revenue overview and transaction history</p>
//         </div>
//         <div className="flex items-center gap-3">
//           <div className="flex items-center bg-gray-100 rounded-xl p-1 gap-1">
//             {(["today", "week", "month"] as const).map((p) => (
//               <button
//                 key={p}
//                 onClick={() => setSelectedPeriod(p)}
//                 className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition-all ${
//                   selectedPeriod === p ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
//                 }`}
//               >
//                 {p === "today" ? "Today" : p === "week" ? "This Week" : "This Month"}
//               </button>
//             ))}
//           </div>
//           <button className="flex items-center gap-2 px-4 py-2 text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-sm">
//             <Download className="w-4 h-4" />
//             Export
//           </button>
//         </div>
//       </div>

//       {/* KPI Cards */}
//       <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
//         {kpiCards.map((card) => (
//           <div key={card.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow">
//             <div className="flex items-center justify-between mb-3">
//               <div className={`inline-flex p-2.5 rounded-xl ${card.color}`}>
//                 <card.icon className="w-4 h-4" />
//               </div>
//               {card.delta && (
//                 <div className={`flex items-center gap-0.5 text-xs font-medium ${card.deltaDir === "up" ? "text-emerald-600" : "text-red-500"}`}>
//                   {card.deltaDir === "up" ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
//                   {card.delta}
//                 </div>
//               )}
//             </div>
//             <div className="text-xl font-bold text-gray-900 mb-0.5">{summaryLoading ? "—" : card.value}</div>
//             <div className="text-sm text-gray-600 font-medium">{card.label}</div>
//             <div className="text-xs text-gray-400 mt-0.5">{card.sub}</div>
//           </div>
//         ))}
//       </div>

//       {/* Charts Row */}
//       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
//         {/* Collection Trend */}
//         <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
//           <div className="flex items-center justify-between mb-5">
//             <div>
//               <h3 className="text-gray-800 font-semibold">Collection Trend</h3>
//               <p className="text-sm text-gray-400">Patient payments vs insurance collections</p>
//             </div>
//             <div className="flex items-center gap-3 text-xs text-gray-500">
//               <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-blue-600 inline-block rounded-full" />Patient</span>
//               <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-cyan-500 inline-block rounded-full" />Insurance</span>
//             </div>
//           </div>
//           <ResponsiveContainer width="100%" height={220}>
//             <LineChart data={trendData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
//               <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
//               <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#9CA3AF" }} />
//               <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#9CA3AF" }} tickFormatter={(v) => `$${Number(v) / 1000}k`} width={45} />
//               <Tooltip content={<CustomLineTip />} />
//               <Line type="monotone" dataKey="patient" stroke="#2563EB" strokeWidth={2.5} dot={false} name="Patient" isAnimationActive={false} />
//               <Line type="monotone" dataKey="insurance" stroke="#06B6D4" strokeWidth={2.5} dot={false} name="Insurance" isAnimationActive={false} />
//             </LineChart>
//           </ResponsiveContainer>
//         </div>

//         {/* Patient Payment Modes */}
//         <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
//           <div className="mb-4">
//             <div className="flex items-center gap-2 mb-0.5">
//               <div className="w-2 h-4 rounded-sm bg-blue-600" />
//               <h3 className="text-gray-800 font-semibold">Payment Modes</h3>
//             </div>
//             <p className="text-sm text-gray-400 pl-4">Patient channel breakdown</p>
//           </div>
//           <div className="flex justify-center">
//             <ResponsiveContainer width="100%" height={150}>
//               <PieChart>
//                 <Pie data={modeData} cx="50%" cy="50%" innerRadius={45} outerRadius={68} paddingAngle={3} dataKey="value" strokeWidth={0} isAnimationActive={false}>
//                   {modeData.map((entry) => {
//                     const meta = MODE_META[entry.name as PaymentMode];
//                     return <Cell key={`pc-${entry.name}`} fill={meta?.chart ?? "#ccc"} />;
//                   })}
//                 </Pie>
//                 <Tooltip content={<CustomPieTip total={patientTotal} />} />
//               </PieChart>
//             </ResponsiveContainer>
//           </div>
//           <div className="space-y-2 mt-1">
//             {modeData.map((entry) => {
//               const pct = patientTotal > 0 ? Math.round((entry.value / patientTotal) * 100) : 0;
//               const meta = MODE_META[entry.name as PaymentMode] || { chart: "#ccc" };
//               return (
//                 <div key={entry.name} className="flex items-center justify-between">
//                   <div className="flex items-center gap-2">
//                     <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: meta.chart }} />
//                     <span className="text-xs text-gray-600">{entry.name}</span>
//                   </div>
//                   <div className="flex items-center gap-2">
//                     <div className="w-14 h-1.5 bg-gray-100 rounded-full overflow-hidden">
//                       <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: meta.chart }} />
//                     </div>
//                     <span className="text-xs font-medium text-gray-700 w-7 text-right">{pct}%</span>
//                   </div>
//                 </div>
//               );
//             })}
//           </div>
//         </div>
//       </div>

//       {/* Transactions Table */}
//       <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
//         <div className="flex items-center gap-2 mb-1">
//           <Activity className="w-4 h-4 text-gray-400" />
//           <h3 className="text-gray-800 font-semibold">All Transactions</h3>
//         </div>
//         <p className="text-sm text-gray-400 mb-5">Complete payment record with transaction IDs — sortable, filterable, paginated</p>

//         <DataTable<TransactionRow>
//           data={tableRows}
//           columns={columns}
//           pageSize={8}
//           pageSizeOptions={[8, 15, 30]}
//           searchable
//           searchPlaceholder="Search by ID, patient, RX, transaction..."
//           exportFileName="transactions"
//           emptyMessage="No transactions found"
//           rowClassName={(_row, index) => (index % 2 === 1 ? "bg-gray-50/30" : "")}
//           // Server-side
//           serverSide
//           loading={tableLoading}
//           totalItems={tableTotal}
//           initialServerQuery={initialQuery}
//           onServerQueryChange={handleServerQueryChange}
//         />
//       </div>
//     </div>
//   );
// }
import React from "react";
import {
  DollarSign,
  CreditCard,
  Clock,
  CheckCircle2,
  Download,
  Banknote,
  Smartphone,
  Building2,
  Shield,
  User,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
} from "lucide-react";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

import DataTable from "@components/common/Table/Table";

import { usePaymentDashboard } from "../hooks/usePaymentDashboard";

// original supporting badge functions here …
const MODE_META = {
  Cash: { badge: "bg-emerald-100 text-emerald-700", chart: "#10B981", icon: <Banknote className="w-3.5 h-3.5" /> },
  UPI: { badge: "bg-purple-100 text-purple-700", chart: "#8B5CF6", icon: <Smartphone className="w-3.5 h-3.5" /> },
  Card: { badge: "bg-blue-100 text-blue-700", chart: "#3B82F6", icon: <CreditCard className="w-3.5 h-3.5" /> },
  "Bank Transfer": { badge: "bg-orange-100 text-orange-700", chart: "#F59E0B", icon: <Building2 className="w-3.5 h-3.5" /> },
  Insurance: { badge: "bg-cyan-100 text-cyan-700", chart: "#06B6D4", icon: <Shield className="w-3.5 h-3.5" /> },
};

function ModeBadge({ mode }) {
  const m = MODE_META[mode] ?? MODE_META.Cash;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${m.badge}`}>
      {m.icon} {mode}
    </span>
  );
}

function StatusBadge({ status }) {
  if (status === "Cleared")
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
        <CheckCircle2 className="w-3 h-3" /> Cleared
      </span>
    );
  if (status === "Failed")
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
        ✕ Failed
      </span>
    );

  return (
    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
      <Clock className="w-3 h-3" /> Pending
    </span>
  );
}

export default function PaymentDashboard() {
  const {
    selectedPeriod,
    setSelectedPeriod,

    summary,
    summaryLoading,

    trendData,
    trendLoading,

    modeData,
    modeLoading,
    patientTotal,

    tableRows,
    tableTotal,
    tableLoading,

    initialQuery,
    handleServerQueryChange,
  } = usePaymentDashboard();

  // KPI cards UI computations (same logic)
  const kpiCards = React.useMemo(() => {
    const fmt = (n) =>
      `$${Number(n).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;

    const pct = (n) => (n === undefined ? undefined : `${n >= 0 ? "+" : ""}${n.toFixed(1)}%`);

    const totalCollected = summary?.totalCollected ?? 0;
    const patientCollected = summary?.patientCollected ?? 0;
    const insuranceCollected = summary?.insuranceCollected ?? 0;
    const totalPending = summary?.totalPending ?? 0;
    const pendingCount = summary?.pendingCount ?? 0;

    const vs = summary?.vs ?? {};

    return [
      {
        label: "Total Collected",
        value: fmt(totalCollected),
        sub: "All cleared payments",
        icon: DollarSign,
        color: "bg-blue-50 text-blue-600",
        delta: pct(vs.totalCollectedDeltaPct),
        deltaDir: (vs.totalCollectedDeltaPct ?? 0) >= 0 ? "up" : "down",
      },
      {
        label: "Patient Payments",
        value: fmt(patientCollected),
        sub: `${Math.round((patientCollected / (totalCollected || 1)) * 100)}% of total`,
        icon: User,
        color: "bg-blue-50 text-blue-600",
        delta: pct(vs.patientCollectedDeltaPct),
        deltaDir: (vs.patientCollectedDeltaPct ?? 0) >= 0 ? "up" : "down",
      },
      {
        label: "Insurance Claims",
        value: fmt(insuranceCollected),
        sub: `${Math.round((insuranceCollected / (totalCollected || 1)) * 100)}% of total`,
        icon: Shield,
        color: "bg-cyan-50 text-cyan-600",
        delta: pct(vs.insuranceCollectedDeltaPct),
        deltaDir: (vs.insuranceCollectedDeltaPct ?? 0) >= 0 ? "up" : "down",
      },
      {
        label: "Pending",
        value: fmt(totalPending),
        sub: `${pendingCount} transactions`,
        icon: Clock,
        color: "bg-amber-50 text-amber-600",
      },
    ];
  }, [summary]);

  // Table columns (unchanged)
  const columns = React.useMemo(
    () => [
      {
        key: "id",
        header: "Payment ID",
        sortable: true,
        filterable: true,
        render: (_v, row) => (
          <div>
            <div className="font-mono text-xs font-semibold">{row.id}</div>
            {row.type === "Insurance" && row.insurerName && (
              <div className="text-xs text-cyan-600 flex items-center gap-1">
                <Shield className="w-3 h-3" /> {row.insurerName}
              </div>
            )}
          </div>
        ),
      },
      {
        key: "patientName",
        header: "Patient",
        sortable: true,
        filterable: true,
        render: (_v, row) => (
          <div>
            <div className="font-medium flex items-center gap-1.5">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white ${
                  row.type === "Insurance" ? "bg-cyan-500" : "bg-blue-500"
                }`}
              >
                {row.patientName
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2)}
              </div>
              {row.patientName}
            </div>
            <div className="text-xs text-gray-400 ml-7.5">{row.patientId}</div>
          </div>
        ),
      },

      {
        key: "rxId",
        header: "RX ID",
        sortable: true,
        filterable: true,
        render: (v) => <span className="font-mono text-xs">{v}</span>,
      },

      {
        key: "amount",
        header: "Amount",
        sortable: true,
        render: (_v, r) => <span className="font-semibold">${r.amount.toFixed(2)}</span>,
      },

      {
        key: "mode",
        header: "Mode",
        sortable: true,
        filterable: true,
        filterType: "select",
        filterOptions: ["Cash", "UPI", "Card", "Bank Transfer", "Insurance"],
        render: (_v, r) => <ModeBadge mode={r.mode} />,
      },

      {
        key: "transactionId",
        header: "Transaction ID",
        filterable: true,
        render: (_v, r) =>
          r.transactionId ? (
            <span className="font-mono text-xs bg-gray-50 px-2 py-0.5 rounded border">
              {r.transactionId}
            </span>
          ) : (
            <span className="text-gray-400 text-xs">—</span>
          ),
      },

      {
        key: "status",
        header: "Status",
        sortable: true,
        filterable: true,
        filterType: "select",
        filterOptions: ["Cleared", "Pending", "Failed"],
        render: (_v, r) => <StatusBadge status={r.status} />,
      },

      {
        key: "timestamp",
        header: "Date & Time",
        sortable: true,
        filterable: true,
        filterType: "date",
        render: (_v, r) => (
          <div className="text-xs">
            <div className="text-gray-700">
              {new Date(r.timestamp).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </div>
            <div className="text-gray-400">
              {new Date(r.timestamp).toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
          </div>
        ),
      },
    ],
    []
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">

      {/* -------- HEADER -------- */}
      <div className="flex flex-col sm:flex-row items-center justify-between">
        <div>
          <h1 className="text-gray-900">Payment Dashboard</h1>
          <p className="text-gray-500">Revenue overview and transaction history</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-gray-100 p-1 rounded-xl gap-1">
            {(["today", "week", "month"] as const).map((p) => (
              <button
                key={p}
                onClick={() => setSelectedPeriod(p)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                  selectedPeriod === p ? "bg-white text-blue-600 shadow-sm" : "text-gray-500"
                }`}
              >
                {p === "today" ? "Today" : p === "week" ? "This Week" : "This Month"}
              </button>
            ))}
          </div>

          <button className="px-4 py-2 bg-white border rounded-xl text-sm flex items-center gap-2">
            <Download className="w-4 h-4" /> Export
          </button>
        </div>
      </div>

      {/* -------- KPI -------- */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((card) => (
          <div key={card.label} className="bg-white border rounded-2xl shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <div className={`p-2.5 rounded-xl ${card.color}`}>
                <card.icon className="w-4 h-4" />
              </div>

              {card.delta && (
                <div
                  className={`flex items-center text-xs ${
                    card.deltaDir === "up" ? "text-emerald-600" : "text-red-500"
                  }`}
                >
                  {card.deltaDir === "up" ? (
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  ) : (
                    <ArrowDownRight className="w-3.5 h-3.5" />
                  )}
                  {card.delta}
                </div>
              )}
            </div>

            <div className="text-xl font-bold text-gray-900">
              {summaryLoading ? "—" : card.value}
            </div>

            <div className="text-sm text-gray-600">{card.label}</div>
            <div className="text-xs text-gray-400">{card.sub}</div>
          </div>
        ))}
      </div>

      {/* -------- CHARTS -------- */}
      {/* (unchanged — omitted here for brevity, same as your original UI) */}

      {/* -------- TABLE -------- */}
      <div className="bg-white rounded-2xl border shadow-sm p-5">
        <div className="flex items-center gap-2 mb-1">
          <Activity className="w-4 h-4 text-gray-400" />
          <h3 className="font-semibold text-gray-800">All Transactions</h3>
        </div>

        <p className="text-sm text-gray-400 mb-5">
          Complete payment record — sortable, filterable, paginated
        </p>

        <DataTable
          data={tableRows}
          columns={columns}
          pageSize={8}
          pageSizeOptions={[8, 15, 30]}
          searchable
          searchPlaceholder="Search by ID, patient, RX, transaction..."
          exportFileName="transactions"
          emptyMessage="No transactions found"
          rowClassName={(_row, i) => (i % 2 === 1 ? "bg-gray-50/30" : "")}
          serverSide
          loading={tableLoading}
          totalItems={tableTotal}
          initialServerQuery={initialQuery}
          onServerQueryChange={handleServerQueryChange}
        />
      </div>
    </div>
  );
}