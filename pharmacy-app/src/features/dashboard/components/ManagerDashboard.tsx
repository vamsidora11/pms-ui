import type { ElementType } from "react";
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  Banknote,
  Building2,
  CheckCircle2,
  ChevronRight,
  CreditCard,
  DollarSign,
  Layers,
  Shield,
  Smartphone,
  Users,
} from "lucide-react";

import { ROUTES } from "@constants/routes";
import { useManagerDashboard } from "../hooks/useManagerDashboard";

function ModeIcon({ mode }: { mode: string }) {
  const icons: Record<string, ElementType> = {
    Cash: Banknote,
    UPI: Smartphone,
    Card: CreditCard,
    "Bank Transfer": Building2,
    Insurance: Shield,
  };
  const Icon = icons[mode] ?? DollarSign;
  return <Icon className="h-3.5 w-3.5 text-gray-300" />;
}

// Chart tooltip preserved exactly
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;

  const total = payload.reduce((sum, e) => sum + (e.value ?? 0), 0);

  return (
    <div className="rounded-xl border border-gray-100 bg-white px-3 py-2.5 text-xs shadow-lg">
      <p className="mb-1.5 text-gray-400">{label}</p>

      {payload.map((entry) => (
        <div key={entry.name} className="mb-0.5 flex items-center justify-between gap-5">
          <span className="flex items-center gap-1.5 text-gray-500">
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: entry.color }} />
            {entry.name}
          </span>
          <span className="text-gray-800">${((entry.value ?? 0) / 1000).toFixed(1)}k</span>
        </div>
      ))}

      <div className="mt-1.5 flex justify-between border-t border-gray-100 pt-1.5 text-gray-500">
        <span>Total</span>
        <span className="text-gray-800">${(total / 1000).toFixed(1)}k</span>
      </div>
    </div>
  );
}

export default function ManagerDashboard() {
  const navigate = useNavigate();
  const {
    period,
    setPeriod,
    summary,
    trendData,
    recentTxns,
    inventoryMetrics,
  } = useManagerDashboard();

  const weekTotal = trendData.reduce((s, d) => s + d.patient + d.insurance, 0);

  const todayLabel = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  // Needs Attention section preserved from original
  const attentionItems = useMemo(() => {
    const items: any[] = [];

    if (inventoryMetrics.outOfStock > 0) {
      items.push({
        id: "out-of-stock",
        dot: "bg-red-500",
        title: `${inventoryMetrics.outOfStock} medicines out of stock`,
        sub: "Inventory",
        badge: "Critical",
        badgeClass: "bg-red-50 text-red-700",
        nav: ROUTES.MANAGER.INVENTORY,
      });
    }

    if (inventoryMetrics.expiring > 0) {
      items.push({
        id: "expiring",
        dot: "bg-orange-400",
        title: `${inventoryMetrics.expiring} lots expiring within 60 days`,
        sub: "Expiry",
        badge: "Review",
        badgeClass: "bg-orange-50 text-orange-700",
        nav: ROUTES.MANAGER.INVENTORY,
      });
    }

    if (inventoryMetrics.pendingRestock > 0) {
      items.push({
        id: "restock",
        dot: "bg-amber-400",
        title: `${inventoryMetrics.pendingRestock} pending restock requests`,
        sub: "Restock",
        badge: "Pending",
        badgeClass: "bg-amber-50 text-amber-700",
        nav: ROUTES.MANAGER.INVENTORY,
      });
    }

    items.push({
      id: "users",
      dot: "bg-blue-400",
      title: "Review user access and staffing",
      sub: "Users",
      badge: "Action",
      badgeClass: "bg-blue-50 text-blue-700",
      nav: ROUTES.MANAGER.USERS,
    });

    return items.slice(0, 4);
  }, [inventoryMetrics]);

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      {/* HEADER */}
      <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-end">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-400">{todayLabel}</p>
        </div>

        <div className="flex items-center gap-2">
          {["today", "week", "month"].map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p as any)}
              className={`px-3 py-1.5 rounded-lg text-sm ${
                p === period ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-500"
              }`}
            >
              {p === "today" ? "Today" : p === "week" ? "This Week" : "This Month"}
            </button>
          ))}
        </div>
      </div>

      {/* KPI CARDS – EXACT UI */}
      <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="grid grid-cols-2 divide-x divide-y divide-gray-100 lg:grid-cols-4 lg:divide-y-0">
          <div className="px-6 py-5">
            <p className="text-2xl text-gray-900">
              ${(weekTotal / 1000).toFixed(1)}k
            </p>
            <p className="mt-1 text-xs text-gray-400">
              Revenue this {period}
            </p>
          </div>

          <div className="px-6 py-5">
            <p className="text-2xl text-gray-900">
              {inventoryMetrics.lowStock + inventoryMetrics.outOfStock}
            </p>
            <p className="mt-1 text-xs text-gray-400">Stock alerts</p>
            <p className="mt-0.5 text-xs text-gray-400">
              {inventoryMetrics.outOfStock} out of stock ·{" "}
              {inventoryMetrics.lowStock} low
            </p>
          </div>

          <div className="px-6 py-5">
            <p className="text-2xl text-gray-900">
              {inventoryMetrics.pendingRestock}
            </p>
            <p className="mt-1 text-xs text-gray-400">Restock requests</p>
          </div>

          <div className="px-6 py-5">
            <p className="text-2xl text-gray-900">
              ${summary?.totalPending ?? 0}
            </p>
            <p className="mt-1 text-xs text-gray-400">Pending clearance</p>
            <p className="text-xs text-gray-400">
              {summary?.pendingCount ?? 0} transactions
            </p>
          </div>
        </div>
      </div>

      {/* WEEKLY TREND – EXACT UI */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="relative rounded-2xl border border-gray-100 bg-white p-5 shadow-sm lg:col-span-2">
          <div className="mb-4 flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-800">Weekly Revenue</p>
              <p className="text-xs text-gray-400">
                Patient vs. insurance · this {period}
              </p>
            </div>

            <div className="text-right">
              <p className="text-xs text-gray-400">Catalogue</p>
              <p className="text-sm font-medium text-gray-800">
                {inventoryMetrics.inventoryCount} medicines
              </p>
            </div>
          </div>

          {/* Gradients unchanged */}
          <svg style={{ position: "absolute", width: 0, height: 0, overflow: "hidden" }}>
            <defs>
              <linearGradient id="mgr-pg" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="mgr-ig" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.1} />
                <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
              </linearGradient>
            </defs>
          </svg>

          <ResponsiveContainer width="100%" height={196}>
            <AreaChart data={trendData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
              <CartesianGrid stroke="#f8fafc" strokeDasharray="3 3" vertical={false} />

              <XAxis dataKey="day" stroke="#94a3b8" tick={{ fontSize: 11 }} />
              <YAxis
                stroke="#94a3b8"
                tick={{ fontSize: 10 }}
                tickFormatter={(value) => `$${value / 1000}k`}
              />

              <Tooltip content={<ChartTooltip />} />

              <Area
                type="monotone"
                dataKey="patient"
                stroke="#3b82f6"
                strokeWidth={2}
                fill="url(#mgr-pg)"
                isAnimationActive={false}
                name="Patient"
              />

              <Area
                type="monotone"
                dataKey="insurance"
                stroke="#22c55e"
                strokeWidth={2}
                fill="url(#mgr-ig)"
                isAnimationActive={false}
                name="Insurance"
              />
            </AreaChart>
          </ResponsiveContainer>

          {/* Legends unchanged */}
          <div className="mt-2.5 flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-xs text-gray-400">
              <span className="inline-block h-px w-3 rounded-full bg-blue-500" /> Patient
            </span>
            <span className="flex items-center gap-1.5 text-xs text-gray-400">
              <span className="inline-block h-px w-3 rounded-full bg-emerald-500" /> Insurance
            </span>
          </div>
        </div>

        {/* NEEDS ATTENTION – EXACT UI */}
        <div className="flex flex-col rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-gray-800">Needs Attention</p>
            {attentionItems.length > 0 && (
              <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs text-red-600">
                {attentionItems.length}
              </span>
            )}
          </div>

          {attentionItems.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center py-8">
              <CheckCircle2 className="mb-2 h-8 w-8 text-emerald-300" />
              <p className="text-sm text-gray-400">All clear</p>
            </div>
          ) : (
            <div className="space-y-px">
              {attentionItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => navigate(item.nav)}
                  className="group -mx-2 flex w-full items-center gap-3 rounded-lg px-2 py-2.5 text-left transition-colors hover:bg-gray-50"
                >
                  <span className={`h-2 w-2 shrink-0 rounded-full ${item.dot}`} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-gray-800">{item.title}</p>
                    <p className="text-xs text-gray-400">{item.sub}</p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs ${item.badgeClass}`}>
                    {item.badge}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* RECENT TRANSACTIONS – EXACT UI */}
      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-800">Recent Transactions</p>
            <p className="text-xs text-gray-400">
              Operational snapshot for the manager dashboard
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate(ROUTES.MANAGER.INVENTORY)}
            className="flex items-center gap-0.5 text-xs text-blue-600 transition-colors hover:text-blue-700"
          >
            Review stock impact <ChevronRight className="h-3 w-3" />
          </button>
        </div>

        <div>
          {recentTxns.map((txn, index) => (
            <div
              key={txn.id}
              className={`flex items-center gap-4 py-2.5 ${
                index < recentTxns.length - 1 ? "border-b border-gray-50" : ""
              }`}
            >
              <div className="shrink-0 rounded-lg bg-gray-50 p-1.5">
                <ModeIcon mode={txn.mode} />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-sm text-gray-800">{txn.patient}</span>
                <span className="mx-2 text-xs text-gray-300">·</span>
                <span className="text-xs text-gray-400">{txn.id}</span>
              </div>
              <span className="hidden text-xs text-gray-400 sm:block">{txn.mode}</span>
              <span className="w-16 text-right text-sm text-gray-900">
                ${txn.amount.toFixed(2)}
              </span>
              <span
                className={`w-16 shrink-0 rounded-full px-2 py-0.5 text-center text-xs ${
                  txn.status === "Cleared"
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-amber-50 text-amber-700"
                }`}
              >
                {txn.status}
              </span>
              <span className="w-10 shrink-0 text-right text-xs text-gray-300">
                {txn.time}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}