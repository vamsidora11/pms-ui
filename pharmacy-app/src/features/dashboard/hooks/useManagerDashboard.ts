// import { useEffect, useMemo, useState } from "react";
// import {
//   getPaymentSummary,
//   getPaymentTrend,
//   getPaymentTransactions,
//   type Period,
// } from "@api/payments";

// import {
//   getManagerInventoryProducts,
//   getManagerPendingInventoryLots,
//   type ManagerProductInventoryDto,
//   type ManagerInventoryLotDto,
// } from "@api/managerInventory";

// export function useManagerDashboard() {
//   const [period, setPeriod] = useState<Period>("week");

//   // ─────────────────────────────
//   // KPI SUMMARY (revenue, pending)
//   // ─────────────────────────────
//   const [summary, setSummary] = useState<any>(null);
//   const [summaryLoading, setSummaryLoading] = useState(false);

//   useEffect(() => {
//     (async () => {
//       try {
//         setSummaryLoading(true);
//         const res = await getPaymentSummary(period);

//         setSummary({
//           totalCollected: Number(res.totalCollected),
//           patientCollected: Number(res.patientCollected),
//           insuranceCollected: Number(res.insuranceCollected),
//           totalPending: Number(res.totalPending),
//           pendingCount: res.pendingCount,
//         });
//       } finally {
//         setSummaryLoading(false);
//       }
//     })();
//   }, [period]);

//   // ─────────────────────────────
//   // WEEKLY/DAILY TREND
//   // ─────────────────────────────
//   const [trendData, setTrendData] = useState<
//     { day: string; patient: number; insurance: number }[]
//   >([]);

//   useEffect(() => {
//     (async () => {
//       const res = await getPaymentTrend(period);
//       setTrendData(
//         res.data.map((p) => ({
//           day: p.label,
//           patient: Number(p.patient),
//           insurance: Number(p.insurance),
//         }))
//       );
//     })();
//   }, [period]);

//   // ─────────────────────────────
//   // RECENT TRANSACTIONS
//   // ─────────────────────────────
//   const [recentTxns, setRecentTxns] = useState<any[]>([]);

//   useEffect(() => {
//     (async () => {
//       const res = await getPaymentTransactions({
//         page: 1,
//         pageSize: 5,
//         search: "",
//         status: "all",
//         mode: "all",
//         sortKey: "timestamp",
//         sortDir: "desc",
//       });

//       setRecentTxns(
//         res.data.map((t) => ({
//           id: t.id,
//           patient: t.patientName,
//           amount: Number(t.amount),
//           mode: t.mode,
//           status: t.status,
//           time: new Date(t.timestamp).toLocaleTimeString("en-US", {
//             hour: "2-digit",
//             minute: "2-digit",
//           }),
//         }))
//       );
//     })();
//   }, []);

//   // ─────────────────────────────
//   // INVENTORY (REAL DATA)
//   // ─────────────────────────────
//   const [inventoryProducts, setInventoryProducts] = useState<
//     ManagerProductInventoryDto[]
//   >([]);

//   const [pendingLots, setPendingLots] = useState<
//     ManagerInventoryLotDto[]
//   >([]);

//   useEffect(() => {
//     (async () => {
//       // fetch *all* products (we only need counts, but backend paginates → get huge page)
//       const productsRes = await getManagerInventoryProducts({
//         pageNumber: 1,
//         pageSize: 9999,
//       });

//       setInventoryProducts(productsRes.items);

//       // fetch all pending lots
//       const pendingRes = await getManagerPendingInventoryLots({
//         pageNumber: 1,
//         pageSize: 9999,
//       });

//       setPendingLots(pendingRes.items);
//     })();
//   }, []);

//   // ─────────────────────────────
//   // INVENTORY METRICS (REAL)
//   // ─────────────────────────────
//   const inventoryMetrics = useMemo(() => {
//     const products = inventoryProducts;
//     const lots = products.flatMap((p) => p.inventoryLots);

//     const stockByProduct: Record<string, number> = {};

//     for (const prod of products) {
//       stockByProduct[prod.id] = prod.totalQuantityAvailable;
//     }

//     const lowStock = products.filter(
//       (p) => p.totalQuantityAvailable > 0 && p.totalQuantityAvailable <= 10 // configurable threshold
//     ).length;

//     const outOfStock = products.filter(
//       (p) => p.totalQuantityAvailable === 0
//     ).length;

//     const expiring = lots.filter((lot) => {
//       if (!lot.expiry) return false;
//       const daysLeft =
//         (new Date(lot.expiry).getTime() - Date.now()) /
//         (1000 * 60 * 60 * 24);
//       return daysLeft <= 60;
//     }).length;

//     const pendingRestock = pendingLots.length;

//     return {
//       inventoryCount: products.length,
//       lowStock,
//       outOfStock,
//       expiring,
//       pendingRestock,
//     };
//   }, [inventoryProducts, pendingLots]);

//   // ─────────────────────────────

//   return {
//     period,
//     setPeriod,

//     summary,
//     summaryLoading,

//     trendData,
//     recentTxns,

//     inventoryMetrics,
//   };
// }

import { useEffect, useState, useMemo } from "react";

import {
  getInventoryProducts,
  getPendingInventoryLots,
  getExpiringLots,
  type InventoryProductDto,
} from "@api/inventory";

import {
  getPaymentSummary,
  getPaymentTrend,
  getPaymentTransactions,
  type Period,
} from "@api/payments.api";

export function useManagerDashboard() {
  const [period, setPeriod] = useState<Period>("week");

  // ---------------- PAYMENT SUMMARY ----------------
  const [summary, setSummary] = useState<any>(null);

  useEffect(() => {
    (async () => {
      const res = await getPaymentSummary(period);
      setSummary({
        totalCollected: Number(res.totalCollected),
        patientCollected: Number(res.patientCollected),
        insuranceCollected: Number(res.insuranceCollected),
        totalPending: Number(res.totalPending),
        pendingCount: res.pendingCount,
      });
    })();
  }, [period]);

  // ---------------- PAYMENT TREND ----------------
  const [trendData, setTrendData] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const res = await getPaymentTrend(period);
      setTrendData(
        (res.data ?? []).map((p) => ({
          day: p.label,
          patient: Number(p.patient),
          insurance: Number(p.insurance),
        }))
      );
    })();
  }, [period]);

  // ---------------- RECENT TRANSACTIONS ----------------
  const [recentTxns, setRecentTxns] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const res = await getPaymentTransactions({
        page: 1,
        pageSize: 5,
        sortKey: "timestamp",
        sortDir: "desc",
        status: "all",
        mode: "all",
      });

      setRecentTxns(
        res.data.map((t) => ({
          id: t.id,
          patient: t.patientName,
          amount: Number(t.amount),
          mode: t.mode,
          status: t.status,
          time: new Date(t.timestamp).toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
          }),
        }))
      );
    })();
  }, []);

  // ---------------- INVENTORY METRICS (NO 9999!) ----------------

  const [productSample, setProductSample] = useState<InventoryProductDto[]>([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [pendingLots, setPendingLots] = useState<any[]>([]);
  const [expiringLots, setExpiringLots] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      // 1️⃣ ONLY FETCH ONE PRODUCT TO GET totalCount
      const firstPage = await getInventoryProducts({ pageNumber: 1, pageSize: 1 });
      setTotalProducts(firstPage.totalCount);

      // 2️⃣ FETCH A SMALL PAGE OF PRODUCTS TO CHECK STOCK (100 is safe)
      const productPage = await getInventoryProducts({ pageNumber: 1, pageSize: 200 });
      setProductSample(productPage.items);

      // 3️⃣ EXPIRING LOTS (real API)
      const expiring = await getExpiringLots(60);
      setExpiringLots(expiring);

      // 4️⃣ PENDING RESTOCK (real API)
      const pending = await getPendingInventoryLots({ pageNumber: 1, pageSize: 100 });
      setPendingLots(pending.items);
    })();
  }, []);

  const inventoryMetrics = useMemo(() => {
    const lowStock = productSample.filter(
      (p) => p.totalQuantityAvailable > 0 && p.totalQuantityAvailable <= 10
    ).length;

    const outOfStock = productSample.filter(
      (p) => p.totalQuantityAvailable === 0
    ).length;

    return {
      inventoryCount: totalProducts,
      lowStock,
      outOfStock,
      expiring: expiringLots.length,
      pendingRestock: pendingLots.length,
    };
  }, [productSample, totalProducts, expiringLots, pendingLots]);

  return {
    period,
    setPeriod,
    summary,
    trendData,
    recentTxns,
    inventoryMetrics,
  };
}