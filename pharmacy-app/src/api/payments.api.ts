// payments.api.ts — unified payments API (merged from payments.ts)
import api from "./axiosInstance";
import { ENDPOINTS } from "./endpoints";
import { extractEtag } from "./prescription";
import { logger } from "@utils/logger/logger";

/* ======================================================
   TYPES (mirror DTOs serialized by ASP.NET Core: camelCase)
====================================================== */

export type Period = "today" | "week" | "month";

export type PaymentStatus = "Cleared" | "Pending" | "Failed";
export type PayerType = "Patient" | "Insurance";

// ⚠️ For POST payload: backend enum is PaymentMode { Cash, UPI, Card, BankTransfer }
// Use "BankTransfer" (no space) in payload. For reads, server may return "Insurance" via mode label in transactions.
export type PaymentMode = "Cash" | "UPI" | "Card" | "BankTransfer";

export interface CreatePaymentPayload {
  patientId: string;
  dispenseId: string;
  amount: number;
  payerType: PayerType;
  paymentMode: PaymentMode;
  transactionId?: string | null;
  // ISO 8601; optional (server defaults to now if not provided)
  transactionDate?: string | null;
}

/* ---------- Summary (cards) ---------- */

export interface PaymentKpiDeltaDto {
  totalCollectedDeltaPct: number;
  patientCollectedDeltaPct: number;
  insuranceCollectedDeltaPct: number;
  pendingDeltaPct: number;
}

export interface PaymentKpiSummaryDto {
  period: string;
  generatedAt: string;
  totalCollected: number;
  patientCollected: number;
  insuranceCollected: number;
  totalPending: number;
  pendingCount: number;
  failedCount: number;
  transactionCount: number;
  vsPrevious: PaymentKpiDeltaDto;
}

/* ---------- Trend (line chart) ---------- */

export interface PaymentTrendPointDto {
  label: string; // "Mon" | "Tue" | ... or "HH:mm" or "Mar 1"
  date: string;  // "yyyy-MM-dd"
  patient: number;
  insurance: number;
}

export interface PaymentTrendDto {
  period: string;
  granularity: "hourly" | "daily";
  data: PaymentTrendPointDto[];
}

/* ---------- Mode breakdown (donut) ---------- */

export interface PaymentModeBreakdownItemDto {
  mode: string;     // "Cash" | "UPI" | "Card" | "Bank Transfer" | "Insurance"
  amount: number;
  count: number;
  percentage: number; // 0..100
}

export interface PaymentModeBreakdownDto {
  period: string;
  type: "Patient" | "Insurance" | "all";
  totalAmount: number;
  breakdown: PaymentModeBreakdownItemDto[];
}

/* ---------- Transactions (table) ---------- */

export interface PaymentTransactionItemDto {
  id: string;
  patientName: string;
  patientId: string;
  rxId: string;
  amount: number;
  mode: string; // may be "Insurance" or payment mode
  type: PayerType;
  status: PaymentStatus;
  transactionId?: string | null;
  timestamp: string; // ISO
  insurerName?: string | null;
}

export interface PaymentTransactionsPaginationDto {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface PaymentTransactionsSummaryDto {
  totalAmount: number;
  clearedAmount: number;
  pendingAmount: number;
  failedAmount: number;
}

export interface PaymentTransactionsResponseDto {
  data: PaymentTransactionItemDto[];
  pagination: PaymentTransactionsPaginationDto;
  filteredSummary: PaymentTransactionsSummaryDto;
}

export interface PaymentTransactionsQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: "all" | PaymentStatus;
  type?: "all" | PayerType;
  mode?: "all" | "Cash" | "UPI" | "Card" | "Bank Transfer" | "Insurance";
  sortKey?: "id" | "patientname" | "rxid" | "amount" | "mode" | "status" | "timestamp";
  sortDir?: "asc" | "desc";
  // Server expects ISO date (yyyy-MM-dd); when equal-date filter is needed, send both.
  dateFrom?: string;
  dateTo?: string;
}

/* ---------- Payment details / summaries ---------- */

export interface PaymentDetailsDto {
  id: string;
  patientId: string;
  dispenseId: string;
  transactionDate: string;
  paymentMode: PaymentMode;
  transactionId?: string | null;
  amount: number;
  payerType: PayerType;
  status: PaymentStatus;
}

export interface PaymentSummaryDto {
  id: string;
  patientId: string;
  dispenseId: string;
  transactionDate: string;
  paymentMode: PaymentMode;
  transactionId?: string | null;
  amount: number;
  payerType: PayerType;
  status: PaymentStatus;
}

/* ======================================================
   API FUNCTIONS
====================================================== */

/**
 * Record a payment (requires If-Match header for dispense concurrency when it may close the dispense).
 * Returns created paymentId.
 */
export async function recordPayment(payload: CreatePaymentPayload, etag: string): Promise<{ paymentId: string; etag: string }> {
  try {
    const res = await api.post<{ paymentId: string }>(
      ENDPOINTS.paymentRecord,
      payload,
      {
        headers: { "If-Match": etag },
      }
    );
    const id = res.data?.paymentId ?? "";
    if (!id) {
      throw new Error("Payment recorded but response did not include paymentId");
    }
    return { paymentId: id, etag: extractEtag(res.headers) ?? "" };
  } catch (error) {
    logger.error("recordPayment failed", { payload, error });
    throw error;
  }
}

/** Get payment details by id */
export async function getPaymentById(paymentId: string): Promise<PaymentDetailsDto> {
  try {
    const res = await api.get<PaymentDetailsDto>(ENDPOINTS.paymentById(paymentId));
    return res.data;
  } catch (error) {
    logger.error("getPaymentById failed", { paymentId, error });
    throw error;
  }
}

/** Get all payments for a dispense */
export async function getPaymentsByDispenseId(dispenseId: string): Promise<PaymentSummaryDto[]> {
  try {
    const res = await api.get<PaymentSummaryDto[]>(ENDPOINTS.paymentsByDispense(dispenseId));
    return Array.isArray(res.data) ? res.data : [];
  } catch (error) {
    logger.error("getPaymentsByDispenseId failed", { dispenseId, error });
    throw error;
  }
}

/** KPI Summary for dashboard cards */
export async function getPaymentSummary(period: Period): Promise<PaymentKpiSummaryDto> {
  try {
    const res = await api.get<PaymentKpiSummaryDto>(ENDPOINTS.paymentsSummary, {
      params: { period },
    });

    // Defensive defaults (avoid undefined in UI)
    return {
      period: res.data?.period ?? period,
      generatedAt: res.data?.generatedAt ?? new Date().toISOString(),
      totalCollected: Number(res.data?.totalCollected ?? 0),
      patientCollected: Number(res.data?.patientCollected ?? 0),
      insuranceCollected: Number(res.data?.insuranceCollected ?? 0),
      totalPending: Number(res.data?.totalPending ?? 0),
      pendingCount: Number(res.data?.pendingCount ?? 0),
      failedCount: Number(res.data?.failedCount ?? 0),
      transactionCount: Number(res.data?.transactionCount ?? 0),
      vsPrevious: {
        totalCollectedDeltaPct: Number(res.data?.vsPrevious?.totalCollectedDeltaPct ?? 0),
        patientCollectedDeltaPct: Number(res.data?.vsPrevious?.patientCollectedDeltaPct ?? 0),
        insuranceCollectedDeltaPct: Number(res.data?.vsPrevious?.insuranceCollectedDeltaPct ?? 0),
        pendingDeltaPct: Number(res.data?.vsPrevious?.pendingDeltaPct ?? 0),
      },
    };
  } catch (error) {
    logger.error("getPaymentSummary failed", { period, error });
    throw error;
  }
}

/** Collection trend for charts */
export async function getPaymentTrend(period: Period): Promise<PaymentTrendDto> {
  try {
    const res = await api.get<PaymentTrendDto>(ENDPOINTS.paymentsTrend, {
      params: { period },
    });

    const data = Array.isArray(res.data?.data) ? res.data.data : [];

    return {
      period: res.data?.period ?? period,
      granularity: (res.data?.granularity as "hourly" | "daily") ?? "daily",
      data: data.map((p) => ({
        label: p.label,
        date: p.date,
        patient: Number(p.patient ?? 0),
        insurance: Number(p.insurance ?? 0),
      })),
    };
  } catch (error) {
    logger.error("getPaymentTrend failed", { period, error });
    throw error;
  }
}

/** Payment mode breakdown for donut chart */
export async function getPaymentModeBreakdown(
  period: Period,
  type: "Patient" | "Insurance" | "all" = "Patient"
): Promise<PaymentModeBreakdownDto> {
  try {
    const res = await api.get<PaymentModeBreakdownDto>(ENDPOINTS.paymentsModeBreakdown, {
      params: { period, type },
    });

    const breakdown = Array.isArray(res.data?.breakdown) ? res.data.breakdown : [];

    return {
      period: res.data?.period ?? period,
      type: (res.data?.type as any) ?? type,
      totalAmount: Number(res.data?.totalAmount ?? 0),
      breakdown: breakdown.map((b) => ({
        mode: b.mode,
        amount: Number(b.amount ?? 0),
        count: Number(b.count ?? 0),
        percentage: Number(b.percentage ?? 0),
      })),
    };
  } catch (error) {
    logger.error("getPaymentModeBreakdown failed", { period, type, error });
    throw error;
  }
}

/**
 * Server-side transactions for the dashboard table.
 * Pass-through of all query parameters supported by controller.
 */
export async function getPaymentTransactions(
  query: PaymentTransactionsQuery
): Promise<PaymentTransactionsResponseDto> {
  try {
    const res = await api.get<PaymentTransactionsResponseDto>(ENDPOINTS.paymentsTransactions, {
      params: {
        page: query.page ?? 1,
        pageSize: query.pageSize ?? 8,
        search: query.search ?? "",
        status: query.status ?? "all",
        type: query.type ?? "all",
        mode: query.mode ?? "all",
        sortKey: query.sortKey ?? "timestamp",
        sortDir: query.sortDir ?? "desc",
        dateFrom: query.dateFrom ?? "",
        dateTo: query.dateTo ?? "",
      },
      // Let axiosInstance carry credentials/csrf headers as configured
    });

    const data = Array.isArray(res.data?.data) ? res.data.data : [];
    const pagination = res.data?.pagination ?? {
      page: query.page ?? 1,
      pageSize: query.pageSize ?? 8,
      total: data.length,
      totalPages: data.length > 0 ? 1 : 0,
    };
    const filteredSummary = res.data?.filteredSummary ?? {
      totalAmount: 0,
      clearedAmount: 0,
      pendingAmount: 0,
      failedAmount: 0,
    };

    // Ensure numbers are numbers
    const normalizedData = data.map((row) => ({
      ...row,
      amount: Number(row.amount ?? 0),
    }));

    return {
      data: normalizedData,
      pagination: {
        page: Number(pagination.page ?? 1),
        pageSize: Number(pagination.pageSize ?? (query.pageSize ?? 8)),
        total: Number(pagination.total ?? normalizedData.length),
        totalPages: Number(pagination.totalPages ?? 0),
      },
      filteredSummary: {
        totalAmount: Number(filteredSummary.totalAmount ?? 0),
        clearedAmount: Number(filteredSummary.clearedAmount ?? 0),
        pendingAmount: Number(filteredSummary.pendingAmount ?? 0),
        failedAmount: Number(filteredSummary.failedAmount ?? 0),
      },
    };
  } catch (error) {
    logger.error("getPaymentTransactions failed", { query, error });
    throw error;
  }
}
