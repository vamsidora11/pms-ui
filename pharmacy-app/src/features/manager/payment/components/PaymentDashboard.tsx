
// import React, { useState, useMemo } from "react";
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

// // ⬇️ Use your common DataTable
// import DataTable, { type Column } from "@components/common/Table/Table";

// // ─── Types ─────────────────────────────────────────────────────────────────────
// type PaymentMode = "Cash" | "UPI" | "Card" | "Bank Transfer" | "Insurance";
// type PaymentType = "Patient" | "Insurance";
// type PaymentStatus = "Cleared" | "Pending" | "Failed";

// interface Transaction {
//   id: string;
//   patientName: string;
//   patientId: string;
//   rxId: string;
//   amount: number;
//   mode: PaymentMode;
//   type: PaymentType;
//   status: PaymentStatus;
//   transactionId?: string;
//   timestamp: string; // e.g. "2026-03-13 09:12:00"
//   insurerName?: string;
// }

// // ─── Mock Data ─────────────────────────────────────────────────────────────────
// const ALL_TRANSACTIONS: Transaction[] = [
//   { id: "PAY-9100", patientName: "Nina Brown", patientId: "PT-2201", rxId: "RX-5530", amount: 78.50, mode: "UPI", type: "Patient", status: "Cleared", transactionId: "UPI2026030901234", timestamp: "2026-03-13 09:12:00" },
//   { id: "PAY-9099", patientName: "Oscar Davis", patientId: "PT-3312", rxId: "RX-5529", amount: 245.00, mode: "Card", type: "Patient", status: "Cleared", transactionId: "CARD20260309TXN456", timestamp: "2026-03-13 09:06:00" },
//   { id: "INS-9096", patientName: "Priya Nair", patientId: "PT-4421", rxId: "RX-5528", amount: 130.00, mode: "Insurance", type: "Insurance", status: "Cleared", transactionId: "CLM-2026-0355", insurerName: "BlueCross", timestamp: "2026-03-13 08:58:00" },
//   { id: "PAY-9098", patientName: "Robert Kim", patientId: "PT-4412", rxId: "RX-5522", amount: 210.00, mode: "Bank Transfer", type: "Patient", status: "Pending", transactionId: "NEFT20260313BNK789", timestamp: "2026-03-13 08:45:00" },
//   { id: "INS-9093", patientName: "Alice Johnson", patientId: "PT-1042", rxId: "RX-5510", amount: 150.00, mode: "Insurance", type: "Insurance", status: "Pending", transactionId: "CLM-2026-0341", insurerName: "UnitedHealth", timestamp: "2026-03-13 08:38:00" },
//   { id: "PAY-9090", patientName: "Mark Tanaka", patientId: "PT-5533", rxId: "RX-5519", amount: 55.00, mode: "Cash", type: "Patient", status: "Cleared", timestamp: "2026-03-13 08:25:00" },
//   { id: "PAY-9088", patientName: "Emma Wilson", patientId: "PT-2218", rxId: "RX-5516", amount: 320.00, mode: "Card", type: "Patient", status: "Cleared", transactionId: "CARD20260313TXN112", timestamp: "2026-03-12 17:40:00" },
//   { id: "INS-9087", patientName: "John Doe", patientId: "PT-1001", rxId: "RX-5501", amount: 375.00, mode: "Insurance", type: "Insurance", status: "Pending", transactionId: "CLM-2026-0338", insurerName: "BlueCross", timestamp: "2026-03-12 16:30:00" },
//   { id: "PAY-9085", patientName: "Carlos Garcia", patientId: "PT-3311", rxId: "RX-5514", amount: 88.00, mode: "UPI", type: "Patient", status: "Cleared", transactionId: "UPI2026031298765", timestamp: "2026-03-12 15:22:00" },
//   { id: "INS-9083", patientName: "Jane Smith", patientId: "PT-1002", rxId: "RX-5496", amount: 220.00, mode: "Insurance", type: "Insurance", status: "Pending", transactionId: "CLM-2026-0332", insurerName: "Aetna", timestamp: "2026-03-12 14:15:00" },
//   { id: "PAY-9080", patientName: "David Chen", patientId: "PT-2033", rxId: "RX-5512", amount: 45.00, mode: "UPI", type: "Patient", status: "Cleared", transactionId: "UPI2026031244332", timestamp: "2026-03-12 13:05:00" },
//   { id: "PAY-9077", patientName: "Maria Lopez", patientId: "PT-0988", rxId: "RX-5518", amount: 190.00, mode: "Cash", type: "Patient", status: "Cleared", timestamp: "2026-03-12 12:00:00" },
//   { id: "INS-9075", patientName: "Emma Wilson", patientId: "PT-2218", rxId: "RX-5478", amount: 165.00, mode: "Insurance", type: "Insurance", status: "Cleared", transactionId: "CLM-2026-0319", insurerName: "Humana", timestamp: "2026-03-11 16:50:00" },
//   { id: "PAY-9072", patientName: "Robert Brown", patientId: "PT-1003", rxId: "RX-5503", amount: 660.00, mode: "Card", type: "Patient", status: "Cleared", transactionId: "CARD20260311TXN991", timestamp: "2026-03-11 15:30:00" },
//   { id: "INS-9068", patientName: "Carlos Garcia", patientId: "PT-3311", rxId: "RX-5481", amount: 480.00, mode: "Insurance", type: "Insurance", status: "Failed", transactionId: "CLM-2026-0325", insurerName: "Cigna", timestamp: "2026-03-11 14:10:00" },
//   { id: "PAY-9065", patientName: "Nina Brown", patientId: "PT-2201", rxId: "RX-5499", amount: 120.00, mode: "Bank Transfer", type: "Patient", status: "Cleared", transactionId: "NEFT20260311BNK441", timestamp: "2026-03-11 13:00:00" },
//   { id: "PAY-9060", patientName: "Oscar Davis", patientId: "PT-3312", rxId: "RX-5490", amount: 340.00, mode: "Card", type: "Patient", status: "Cleared", transactionId: "CARD20260310TXN774", timestamp: "2026-03-10 16:45:00" },
//   { id: "INS-9055", patientName: "Alice Johnson", patientId: "PT-1042", rxId: "RX-5485", amount: 210.00, mode: "Insurance", type: "Insurance", status: "Cleared", transactionId: "CLM-2026-0310", insurerName: "UnitedHealth", timestamp: "2026-03-10 15:20:00" },
//   { id: "PAY-9050", patientName: "Mark Tanaka", patientId: "PT-5533", rxId: "RX-5480", amount: 75.00, mode: "UPI", type: "Patient", status: "Cleared", transactionId: "UPI2026031011223", timestamp: "2026-03-10 14:00:00" },
//   { id: "PAY-9045", patientName: "David Chen", patientId: "PT-2033", rxId: "RX-5475", amount: 95.00, mode: "Cash", type: "Patient", status: "Cleared", timestamp: "2026-03-09 17:30:00" },
// ];

// const weeklyTrendData = [
//   { day: "Mon", patient: 12000, insurance: 6200 },
//   { day: "Tue", patient: 14800, insurance: 7600 },
//   { day: "Wed", patient: 12500, insurance: 7300 },
//   { day: "Thu", patient: 16200, insurance: 8400 },
//   { day: "Fri", patient: 18200, insurance: 10200 },
//   { day: "Sat", patient: 10800, insurance: 5400 },
//   { day: "Sun", patient: 6500, insurance: 3300 },
// ];

// const patientModeData = [
//   { name: "Cash", value: 4200 },
//   { name: "UPI", value: 6800 },
//   { name: "Card", value: 8200 },
//   { name: "Bank Transfer", value: 3000 },
// ];

// // ─── Constants ─────────────────────────────────────────────────────────────────
// const MODE_META: Record<PaymentMode, { badge: string; chart: string; icon: React.ReactNode }> = {
//   Cash: { badge: "bg-emerald-100 text-emerald-700", chart: "#10B981", icon: <Banknote className="w-3.5 h-3.5" /> },
//   UPI: { badge: "bg-purple-100 text-purple-700", chart: "#8B5CF6", icon: <Smartphone className="w-3.5 h-3.5" /> },
//   Card: { badge: "bg-blue-100 text-blue-700", chart: "#3B82F6", icon: <CreditCard className="w-3.5 h-3.5" /> },
//   "Bank Transfer": { badge: "bg-orange-100 text-orange-700", chart: "#F59E0B", icon: <Building2 className="w-3.5 h-3.5" /> },
//   Insurance: { badge: "bg-cyan-100 text-cyan-700", chart: "#06B6D4", icon: <Shield className="w-3.5 h-3.5" /> },
// };

// // ─── Small Components ──────────────────────────────────────────────────────────
// function ModeBadge({ mode }: { mode: PaymentMode }) {
//   const m = MODE_META[mode];
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
//           <span style={{ color: e.color }} className="text-xs">
//             {e.name}
//           </span>
//           <span className="font-medium text-gray-800">${e.value.toLocaleString()}</span>
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
//       <p className="text-blue-600">${item.value.toLocaleString()}</p>
//       <p className="text-gray-400">{pct}% of total</p>
//     </div>
//   );
// }

// // ─── Main Component ────────────────────────────────────────────────────────────
// export default function PaymentDashboard() {
//   const [selectedPeriod, setSelectedPeriod] = useState<"today" | "week" | "month">("week");

//   const metrics = useMemo(() => {
//     const cleared = ALL_TRANSACTIONS.filter((t) => t.status === "Cleared");
//     const pending = ALL_TRANSACTIONS.filter((t) => t.status === "Pending");

//     const totalCollected = cleared.reduce((s, t) => s + t.amount, 0);
//     const totalPending = pending.reduce((s, t) => s + t.amount, 0);
//     const patientCollected = cleared
//       .filter((t) => t.type === "Patient")
//       .reduce((s, t) => s + t.amount, 0);
//     const insuranceCollected = cleared
//       .filter((t) => t.type === "Insurance")
//       .reduce((s, t) => s + t.amount, 0);

//     return {
//       totalCollected,
//       totalPending,
//       patientCollected,
//       insuranceCollected,
//       pendingCount: pending.length,
//     };
//   }, []);

//   const patientTotal = patientModeData.reduce((s, d) => s + d.value, 0);

//   // ── Columns for your common DataTable (keeps the same cell UI) ───────────────
//   const columns: Column<Transaction>[] = useMemo(
//     () => [
//       {
//         key: "id",
//         header: "Txn ID",
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
//         // not adding filterable for numeric range; (your table supports text/select/date)
//         render: (_value, row) => (
//           <span className="font-semibold text-gray-900">${row.amount.toFixed(2)}</span>
//         ),
//       },
//       {
//         key: "mode",
//         header: "Mode",
//         sortable: true,
//         filterable: true,
//         filterType: "select",
//         filterOptions: ["Cash", "UPI", "Card", "Bank Transfer", "Insurance"],
//         render: (_value, row) => <ModeBadge mode={row.mode} />,
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
//               {new Date(row.timestamp).toLocaleDateString("en-US", {
//                 month: "short",
//                 day: "numeric",
//                 year: "numeric",
//               })}
//             </div>
//             <div className="text-gray-400">
//               {new Date(row.timestamp).toLocaleTimeString("en-US", {
//                 hour: "2-digit",
//                 minute: "2-digit",
//               })}
//             </div>
//           </div>
//         ),
//       },
//     ],
//     []
//   );

//   return (
//     <div className="space-y-6 max-w-7xl mx-auto">
//       {/* Header */}
//       <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
//         <div>
//           <nav className="flex items-center gap-2 text-sm text-gray-400 mb-1">
//             <span>Manager</span>
//             <ChevronRight className="w-3.5 h-3.5" />
//             <span className="text-gray-700 font-medium">Payment Dashboard</span>
//           </nav>
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
//         {[
//           {
//             label: "Total Collected",
//             value: `$${metrics.totalCollected.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
//             sub: "All cleared payments",
//             icon: DollarSign,
//             color: "bg-blue-50 text-blue-600",
//             delta: "+9.4%",
//             deltaDir: "up" as const,
//           },
//           {
//             label: "Patient Payments",
//             value: `$${metrics.patientCollected.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
//             sub: `${Math.round((metrics.patientCollected / (metrics.totalCollected || 1)) * 100)}% of total`,
//             icon: User,
//             color: "bg-blue-50 text-blue-600",
//             delta: "+7.2%",
//             deltaDir: "up" as const,
//           },
//           {
//             label: "Insurance Claims",
//             value: `$${metrics.insuranceCollected.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
//             sub: `${Math.round((metrics.insuranceCollected / (metrics.totalCollected || 1)) * 100)}% of total`,
//             icon: Shield,
//             color: "bg-cyan-50 text-cyan-600",
//             delta: "+11.3%",
//             deltaDir: "up" as const,
//           },
//           {
//             label: "Pending",
//             value: `$${metrics.totalPending.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
//             sub: `${metrics.pendingCount} transactions`,
//             icon: Clock,
//             color: "bg-amber-50 text-amber-600",
//             delta: undefined,
//             deltaDir: "up" as const,
//           },
//         ].map((card) => (
//           <div
//             key={card.label}
//             className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow"
//           >
//             <div className="flex items-center justify-between mb-3">
//               <div className={`inline-flex p-2.5 rounded-xl ${card.color}`}>
//                 <card.icon className="w-4 h-4" />
//               </div>
//               {card.delta && (
//                 <div
//                   className={`flex items-center gap-0.5 text-xs font-medium ${
//                     card.deltaDir === "up" ? "text-emerald-600" : "text-red-500"
//                   }`}
//                 >
//                   {card.deltaDir === "up" ? (
//                     <ArrowUpRight className="w-3.5 h-3.5" />
//                   ) : (
//                     <ArrowDownRight className="w-3.5 h-3.5" />
//                   )}
//                   {card.delta}
//                 </div>
//               )}
//             </div>
//             <div className="text-xl font-bold text-gray-900 mb-0.5">{card.value}</div>
//             <div className="text-sm text-gray-600 font-medium">{card.label}</div>
//             <div className="text-xs text-gray-400 mt-0.5">{card.sub}</div>
//           </div>
//         ))}
//       </div>

//       {/* Charts Row */}
//       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
//         {/* Weekly Trend */}
//         <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
//           <div className="flex items-center justify-between mb-5">
//             <div>
//               <h3 className="text-gray-800 font-semibold">Weekly Collection Trend</h3>
//               <p className="text-sm text-gray-400">Patient payments vs insurance collections</p>
//             </div>
//             <div className="flex items-center gap-3 text-xs text-gray-500">
//               <span className="flex items-center gap-1.5">
//                 <span className="w-3 h-0.5 bg-blue-600 inline-block rounded-full" />
//                 Patient
//               </span>
//               <span className="flex items-center gap-1.5">
//                 <span className="w-3 h-0.5 bg-cyan-500 inline-block rounded-full" />
//                 Insurance
//               </span>
//             </div>
//           </div>
//           <ResponsiveContainer width="100%" height={220}>
//             <LineChart data={weeklyTrendData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
//               <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
//               <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#9CA3AF" }} />
//               <YAxis
//                 axisLine={false}
//                 tickLine={false}
//                 tick={{ fontSize: 11, fill: "#9CA3AF" }}
//                 tickFormatter={(v) => `$${v / 1000}k`}
//                 width={45}
//               />
//               <Tooltip content={<CustomLineTip />} />
//               <Line
//                 key="line-patient"
//                 type="monotone"
//                 dataKey="patient"
//                 stroke="#2563EB"
//                 strokeWidth={2.5}
//                 dot={false}
//                 name="Patient"
//                 isAnimationActive={false}
//               />
//               <Line
//                 key="line-insurance"
//                 type="monotone"
//                 dataKey="insurance"
//                 stroke="#06B6D4"
//                 strokeWidth={2.5}
//                 dot={false}
//                 name="Insurance"
//                 isAnimationActive={false}
//               />
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
//                 <Pie
//                   data={patientModeData}
//                   cx="50%"
//                   cy="50%"
//                   innerRadius={45}
//                   outerRadius={68}
//                   paddingAngle={3}
//                   dataKey="value"
//                   strokeWidth={0}
//                   isAnimationActive={false}
//                 >
//                   {patientModeData.map((entry) => (
//                     <Cell key={`pc-${entry.name}`} fill={MODE_META[entry.name as keyof typeof MODE_META]?.chart ?? "#ccc"} />
//                   ))}
//                 </Pie>
//                 <Tooltip content={<CustomPieTip total={patientTotal} />} />
//               </PieChart>
//             </ResponsiveContainer>
//           </div>
//           <div className="space-y-2 mt-1">
//             {patientModeData.map((entry) => {
//               const pct = Math.round((entry.value / patientTotal) * 100);
//               const meta = MODE_META[entry.name as keyof typeof MODE_META];
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
//         <p className="text-sm text-gray-400 mb-5">
//           Complete payment record with transaction IDs — sortable, filterable, paginated
//         </p>

//         {/* ⬇️ Replaces the old inline TransactionsTable with your common DataTable */}
//         <DataTable<Transaction>
//           data={ALL_TRANSACTIONS}
//           columns={columns}
//           pageSize={8}
//           pageSizeOptions={[8, 15, 30]}
//           searchable
//           searchPlaceholder="Search by ID, patient, RX, transaction..."
//           exportFileName="transactions"
//           emptyMessage="No transactions found"
//           // Keep zebra-striping similar to your old table
//           rowClassName={(_row, index) => (index % 2 === 1 ? "bg-gray-50/30" : "")}
//         />
//       </div>
//     </div>
//   );
// }
// PaymentDashboard.tsx — FULL UPDATED CODE (uses ./payments + your common DataTable)

import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  DollarSign,
  CreditCard,
  Clock,
  CheckCircle2,
  Download,
  ChevronRight,
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

// Common Table
import DataTable, { type Column, type ServerTableQuery } from "@components/common/Table/Table";

// API (axiosInstance + ENDPOINTS + logger style)
import {
  getPaymentSummary,
  getPaymentTrend,
  getPaymentModeBreakdown,
  getPaymentTransactions,
  type Period,
  type PaymentTransactionsResponseDto,
} from "@api/payments";

// ─── Types (Frontend view types) ───────────────────────────────────────────────
type PaymentMode = "Cash" | "UPI" | "Card" | "Bank Transfer" | "Insurance";
type PaymentStatus = "Cleared" | "Pending" | "Failed";

interface TransactionRow {
  id: string;
  patientName: string;
  patientId: string;
  rxId: string;
  amount: number;
  mode: PaymentMode | string; // server may send "Insurance"
  type: "Patient" | "Insurance";
  status: PaymentStatus;
  transactionId?: string | null;
  timestamp: string;
  insurerName?: string | null;
}

// ─── UI Constants ─────────────────────────────────────────────────────────────
const MODE_META: Record<PaymentMode, { badge: string; chart: string; icon: React.ReactNode }> = {
  Cash: { badge: "bg-emerald-100 text-emerald-700", chart: "#10B981", icon: <Banknote className="w-3.5 h-3.5" /> },
  UPI: { badge: "bg-purple-100 text-purple-700", chart: "#8B5CF6", icon: <Smartphone className="w-3.5 h-3.5" /> },
  Card: { badge: "bg-blue-100 text-blue-700", chart: "#3B82F6", icon: <CreditCard className="w-3.5 h-3.5" /> },
  "Bank Transfer": { badge: "bg-orange-100 text-orange-700", chart: "#F59E0B", icon: <Building2 className="w-3.5 h-3.5" /> },
  Insurance: { badge: "bg-cyan-100 text-cyan-700", chart: "#06B6D4", icon: <Shield className="w-3.5 h-3.5" /> },
};

function ModeBadge({ mode }: { mode: string }) {
  const isKnown = (Object.keys(MODE_META) as PaymentMode[]).includes(mode as PaymentMode);
  const m = isKnown ? MODE_META[mode as PaymentMode] : MODE_META.Cash; // fallback palette
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${m.badge}`}>
      {m.icon} {mode}
    </span>
  );
}

function StatusBadge({ status }: { status: PaymentStatus }) {
  if (status === "Cleared")
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
        <CheckCircle2 className="w-3 h-3" />
        Cleared
      </span>
    );
  if (status === "Failed")
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
        <span className="w-3 h-3 flex items-center justify-center">✕</span>
        Failed
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
      <Clock className="w-3 h-3" />
      Pending
    </span>
  );
}

function CustomLineTip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 shadow-lg rounded-xl px-4 py-3 text-sm min-w-[170px]">
      <p className="font-semibold text-gray-700 mb-2">{label}</p>
      {payload.map((e: any) => (
        <div key={e.name} className="flex justify-between items-center gap-4">
          <span style={{ color: e.color }} className="text-xs">{e.name}</span>
          <span className="font-medium text-gray-800">${Number(e.value).toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
}

function CustomPieTip({ active, payload, total }: any) {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  const pct = ((item.value / total) * 100).toFixed(1);
  return (
    <div className="bg-white border border-gray-200 shadow-lg rounded-xl px-4 py-3 text-sm">
      <p className="font-semibold text-gray-800">{item.payload.name}</p>
      <p className="text-blue-600">${Number(item.value).toLocaleString()}</p>
      <p className="text-gray-400">{pct}% of total</p>
    </div>
  );
}

// Helpers
const toISODate = (dateStrOrISO: string) => {
  // DataTable date filter sends "YYYY-MM-DDTHH:mm:ss"; API expects "yyyy-MM-dd"
  const tIndex = dateStrOrISO.indexOf("T");
  return tIndex > 0 ? dateStrOrISO.slice(0, tIndex) : dateStrOrISO;
};

const SORT_MAP: Record<string, "id" | "patientname" | "rxid" | "amount" | "mode" | "status" | "timestamp"> = {
  id: "id",
  patientName: "patientname",
  rxId: "rxid",
  amount: "amount",
  mode: "mode",
  status: "status",
  timestamp: "timestamp",
};

export default function PaymentDashboard() {
  const [selectedPeriod, setSelectedPeriod] = useState<Period>("week");

  // KPI
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summary, setSummary] = useState<{
    totalCollected: number;
    patientCollected: number;
    insuranceCollected: number;
    totalPending: number;
    pendingCount: number;
    vs: {
      totalCollectedDeltaPct?: number;
      patientCollectedDeltaPct?: number;
      insuranceCollectedDeltaPct?: number;
      pendingDeltaPct?: number;
    };
  } | null>(null);

  // Trend Chart
  const [trendLoading, setTrendLoading] = useState(false);
  const [trendData, setTrendData] = useState<{ day: string; patient: number; insurance: number }[]>([]);

  // Mode Breakdown (donut)
  const [modeLoading, setModeLoading] = useState(false);
  const [modeData, setModeData] = useState<{ name: string; value: number }[]>([]);
  const patientTotal = useMemo(() => modeData.reduce((s, d) => s + d.value, 0), [modeData]);

  // Table (server-side)
  const [tableLoading, setTableLoading] = useState(false);
  const [tableRows, setTableRows] = useState<TransactionRow[]>([]);
  const [tableTotal, setTableTotal] = useState(0);
  const [initialQuery] = useState<ServerTableQuery>({
    pageNumber: 1,
    pageSize: 8,
    searchTerm: "",
    sortBy: "timestamp",
    sortDirection: "desc",
    columnFilters: {},
  });

  // ── Fetch KPI
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setSummaryLoading(true);
        const res = await getPaymentSummary(selectedPeriod);
        if (!mounted) return;
        setSummary({
          totalCollected: Number(res.totalCollected),
          patientCollected: Number(res.patientCollected),
          insuranceCollected: Number(res.insuranceCollected),
          totalPending: Number(res.totalPending),
          pendingCount: res.pendingCount,
          vs: {
            totalCollectedDeltaPct: Number(res.vsPrevious?.totalCollectedDeltaPct ?? 0),
            patientCollectedDeltaPct: Number(res.vsPrevious?.patientCollectedDeltaPct ?? 0),
            insuranceCollectedDeltaPct: Number(res.vsPrevious?.insuranceCollectedDeltaPct ?? 0),
            pendingDeltaPct: Number(res.vsPrevious?.pendingDeltaPct ?? 0),
          },
        });
      } catch {
        // keep UI calm; show placeholders
        setSummary(null);
      } finally {
        setSummaryLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [selectedPeriod]);

  // ── Fetch Trend
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setTrendLoading(true);
        const res = await getPaymentTrend(selectedPeriod);
        if (!mounted) return;
        const data = (res.data ?? []).map((p) => ({
          day: p.label,
          patient: Number(p.patient),
          insurance: Number(p.insurance),
        }));
        setTrendData(data);
      } catch {
        setTrendData([]);
      } finally {
        setTrendLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [selectedPeriod]);

  // ── Fetch Mode Breakdown (Patient)
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setModeLoading(true);
        const res = await getPaymentModeBreakdown(selectedPeriod, "Patient");
        if (!mounted) return;
        const donut = (res.breakdown ?? []).map((b) => ({
          name: b.mode, // "Cash", "UPI", ...
          value: Number(b.amount),
        }));
        setModeData(donut);
      } catch {
        setModeData([]);
      } finally {
        setModeLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [selectedPeriod]);

  // ── DataTable Columns (keep same cell UI)
  const columns: Column<TransactionRow>[] = useMemo(
    () => [
      {
        key: "id",
        header: "Payment ID",
        sortable: true,
        filterable: true,
        render: (_value, row) => (
          <div className="min-w-[150px]">
            <div className="font-mono text-xs text-gray-800 font-semibold">{row.id}</div>
            {row.type === "Insurance" && row.insurerName && (
              <div className="text-xs text-cyan-600 mt-0.5 flex items-center gap-1">
                <Shield className="w-3 h-3" />
                {row.insurerName}
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
        render: (_value, row) => (
          <div>
            <div className="font-medium text-gray-900 flex items-center gap-1.5">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0 ${
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
            <div className="text-xs text-gray-400 mt-0.5 ml-7.5">{row.patientId}</div>
          </div>
        ),
      },
      {
        key: "rxId",
        header: "RX ID",
        sortable: true,
        filterable: true,
        render: (value) => <span className="font-mono text-xs text-gray-700">{String(value)}</span>,
      },
      {
        key: "amount",
        header: "Amount",
        sortable: true,
        render: (_value, row) => <span className="font-semibold text-gray-900">${row.amount.toFixed(2)}</span>,
      },
      {
        key: "mode",
        header: "Mode",
        sortable: true,
        filterable: true,
        filterType: "select",
        filterOptions: ["Cash", "UPI", "Card", "Bank Transfer", "Insurance"],
        render: (_value, row) => <ModeBadge mode={String(row.mode)} />,
      },
      {
        key: "transactionId",
        header: "Transaction ID",
        sortable: false,
        filterable: true,
        render: (_value, row) =>
          row.transactionId ? (
            <span className="font-mono text-xs text-gray-700 bg-gray-50 border border-gray-200 px-2 py-0.5 rounded">
              {row.transactionId}
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
        render: (_value, row) => <StatusBadge status={row.status} />,
      },
      {
        key: "timestamp",
        header: "Date & Time",
        sortable: true,
        filterable: true,
        filterType: "date",
        render: (_value, row) => (
          <div className="text-xs">
            <div className="text-gray-700">
              {new Date(row.timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </div>
            <div className="text-gray-400">
              {new Date(row.timestamp).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
            </div>
          </div>
        ),
      },
    ],
    []
  );

  // ── Handle DataTable server query changes
  const handleServerQueryChange = useCallback(
    async (q: ServerTableQuery) => {
      try {
        setTableLoading(true);

        // map DataTable query -> API query
        const sortKey = q.sortBy ? SORT_MAP[String(q.sortBy)] ?? "timestamp" : "timestamp";
        const sortDir = q.sortDirection ?? "desc";

        // Only filters we expose in the table header (status, mode, date)
        const status = q.columnFilters["status"] || "all";
        const mode = q.columnFilters["mode"] || "all";

        // Equal-date filter => send dateFrom=dateTo=YYYY-MM-DD
        const filterDate = q.columnFilters["timestamp"] ? toISODate(q.columnFilters["timestamp"]) : "";
        const dateFrom = filterDate || undefined;
        const dateTo = filterDate || undefined;

        const res: PaymentTransactionsResponseDto = await getPaymentTransactions({
          page: q.pageNumber,
          pageSize: q.pageSize,
          search: q.searchTerm,
          status: (status as any) || "all",
          mode: (mode as any) || "all",
          sortKey,
          sortDir,
          dateFrom,
          dateTo,
        });

        setTableRows(
          (res.data ?? []).map((r) => ({
            id: r.id,
            patientName: r.patientName,
            patientId: r.patientId,
            rxId: r.rxId,
            amount: Number(r.amount),
            mode: r.mode as PaymentMode | string,
            type: r.type,
            status: r.status,
            transactionId: r.transactionId,
            timestamp: r.timestamp,
            insurerName: r.insurerName,
          }))
        );
        setTableTotal(res.pagination?.total ?? (res.data?.length ?? 0));
      } catch {
        setTableRows([]);
        setTableTotal(0);
      } finally {
        setTableLoading(false);
      }
    },
    []
  );

  // ── KPI Cards (computed display)
  const kpiCards = useMemo(() => {
    const totalCollected = summary?.totalCollected ?? 0;
    const patientCollected = summary?.patientCollected ?? 0;
    const insuranceCollected = summary?.insuranceCollected ?? 0;
    const totalPending = summary?.totalPending ?? 0;
    const pendingCount = summary?.pendingCount ?? 0;
    const vs = summary?.vs ?? {};

    const fmt = (n: number) =>
      `$${Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    const pct = (n?: number) => (n === undefined || n === null ? undefined : `${n >= 0 ? "+" : ""}${n.toFixed(1)}%`);

    return [
      {
        label: "Total Collected",
        value: fmt(totalCollected),
        sub: "All cleared payments",
        icon: DollarSign,
        color: "bg-blue-50 text-blue-600",
        delta: pct(vs.totalCollectedDeltaPct),
        deltaDir: (vs.totalCollectedDeltaPct ?? 0) >= 0 ? ("up" as const) : ("down" as const),
      },
      {
        label: "Patient Payments",
        value: fmt(patientCollected),
        sub: `${Math.round((patientCollected / (totalCollected || 1)) * 100)}% of total`,
        icon: User,
        color: "bg-blue-50 text-blue-600",
        delta: pct(vs.patientCollectedDeltaPct),
        deltaDir: (vs.patientCollectedDeltaPct ?? 0) >= 0 ? ("up" as const) : ("down" as const),
      },
      {
        label: "Insurance Claims",
        value: fmt(insuranceCollected),
        sub: `${Math.round((insuranceCollected / (totalCollected || 1)) * 100)}% of total`,
        icon: Shield,
        color: "bg-cyan-50 text-cyan-600",
        delta: pct(vs.insuranceCollectedDeltaPct),
        deltaDir: (vs.insuranceCollectedDeltaPct ?? 0) >= 0 ? ("up" as const) : ("down" as const),
      },
      {
        label: "Pending",
        value: fmt(totalPending),
        sub: `${pendingCount} transactions`,
        icon: Clock,
        color: "bg-amber-50 text-amber-600",
        delta: undefined,
        deltaDir: "up" as const,
      },
    ];
  }, [summary]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-gray-900">Payment Dashboard</h1>
          <p className="text-gray-500 mt-0.5">Revenue overview and transaction history</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-gray-100 rounded-xl p-1 gap-1">
            {(["today", "week", "month"] as const).map((p) => (
              <button
                key={p}
                onClick={() => setSelectedPeriod(p)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition-all ${
                  selectedPeriod === p ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {p === "today" ? "Today" : p === "week" ? "This Week" : "This Month"}
              </button>
            ))}
          </div>
          <button className="flex items-center gap-2 px-4 py-2 text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-sm">
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((card) => (
          <div key={card.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className={`inline-flex p-2.5 rounded-xl ${card.color}`}>
                <card.icon className="w-4 h-4" />
              </div>
              {card.delta && (
                <div className={`flex items-center gap-0.5 text-xs font-medium ${card.deltaDir === "up" ? "text-emerald-600" : "text-red-500"}`}>
                  {card.deltaDir === "up" ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                  {card.delta}
                </div>
              )}
            </div>
            <div className="text-xl font-bold text-gray-900 mb-0.5">{summaryLoading ? "—" : card.value}</div>
            <div className="text-sm text-gray-600 font-medium">{card.label}</div>
            <div className="text-xs text-gray-400 mt-0.5">{card.sub}</div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Collection Trend */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-gray-800 font-semibold">Collection Trend</h3>
              <p className="text-sm text-gray-400">Patient payments vs insurance collections</p>
            </div>
            <div className="flex items-center gap-3 text-xs text-gray-500">
              <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-blue-600 inline-block rounded-full" />Patient</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-cyan-500 inline-block rounded-full" />Insurance</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={trendData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#9CA3AF" }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#9CA3AF" }} tickFormatter={(v) => `$${Number(v) / 1000}k`} width={45} />
              <Tooltip content={<CustomLineTip />} />
              <Line type="monotone" dataKey="patient" stroke="#2563EB" strokeWidth={2.5} dot={false} name="Patient" isAnimationActive={false} />
              <Line type="monotone" dataKey="insurance" stroke="#06B6D4" strokeWidth={2.5} dot={false} name="Insurance" isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Patient Payment Modes */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-0.5">
              <div className="w-2 h-4 rounded-sm bg-blue-600" />
              <h3 className="text-gray-800 font-semibold">Payment Modes</h3>
            </div>
            <p className="text-sm text-gray-400 pl-4">Patient channel breakdown</p>
          </div>
          <div className="flex justify-center">
            <ResponsiveContainer width="100%" height={150}>
              <PieChart>
                <Pie data={modeData} cx="50%" cy="50%" innerRadius={45} outerRadius={68} paddingAngle={3} dataKey="value" strokeWidth={0} isAnimationActive={false}>
                  {modeData.map((entry) => {
                    const meta = MODE_META[entry.name as PaymentMode];
                    return <Cell key={`pc-${entry.name}`} fill={meta?.chart ?? "#ccc"} />;
                  })}
                </Pie>
                <Tooltip content={<CustomPieTip total={patientTotal} />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2 mt-1">
            {modeData.map((entry) => {
              const pct = patientTotal > 0 ? Math.round((entry.value / patientTotal) * 100) : 0;
              const meta = MODE_META[entry.name as PaymentMode] || { chart: "#ccc" };
              return (
                <div key={entry.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: meta.chart }} />
                    <span className="text-xs text-gray-600">{entry.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-14 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: meta.chart }} />
                    </div>
                    <span className="text-xs font-medium text-gray-700 w-7 text-right">{pct}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center gap-2 mb-1">
          <Activity className="w-4 h-4 text-gray-400" />
          <h3 className="text-gray-800 font-semibold">All Transactions</h3>
        </div>
        <p className="text-sm text-gray-400 mb-5">Complete payment record with transaction IDs — sortable, filterable, paginated</p>

        <DataTable<TransactionRow>
          data={tableRows}
          columns={columns}
          pageSize={8}
          pageSizeOptions={[8, 15, 30]}
          searchable
          searchPlaceholder="Search by ID, patient, RX, transaction..."
          exportFileName="transactions"
          emptyMessage="No transactions found"
          rowClassName={(_row, index) => (index % 2 === 1 ? "bg-gray-50/30" : "")}
          // Server-side
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
