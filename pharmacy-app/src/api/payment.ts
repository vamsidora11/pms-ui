// src/api/payment.ts
// All payment API calls — matches PaymentController routes.

import api from "./axiosInstance";
import { ENDPOINTS } from "./endpoints";
import { logger } from "@utils/logger/logger";

// ── DTOs ──────────────────────────────────────────────────────────────────────

export type PaymentMode   = "Cash" | "Card" | "UPI" | "BankTransfer";
export type PayerType     = "Patient" | "Insurance";
export type PaymentStatus = "Cleared" | "Pending" | "Failed";

export interface CreatePaymentRequest {
  patientId:       string;
  dispenseId:      string;
  paymentMode:     PaymentMode;
  transactionId:   string;
  amount:          number;
  payerType:       PayerType;
  transactionDate?: string; // ISO string, optional — defaults to now on backend
}

export interface PaymentSummaryDto {
  id:              string;
  patientId:       string;
  dispenseId:      string;
  transactionDate: string;
  paymentMode:     PaymentMode;
  transactionId:   string;
  amount:          number;
  payerType:       PayerType;
  status:          PaymentStatus;
}

export interface PaymentDetailsDto {
  id:              string;
  patientId:       string;
  dispenseId:      string;
  transactionDate: string;
  paymentMode:     PaymentMode;
  transactionId:   string;
  amount:          number;
  payerType:       PayerType;
  status:          PaymentStatus;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Maps frontend payment method string to backend PaymentMode enum value */
export function toPaymentMode(method: "cash" | "card" | "upi"): PaymentMode {
  switch (method) {
    case "cash": return "Cash";
    case "card": return "Card";
    case "upi":  return "UPI";
  }
}

/**
 * Generates a transaction ID for cash payments.
 * Backend Payment.Create requires transactionId to be non-empty for ALL modes.
 * For cash there is no real transaction ID so we generate a reference.
 */
export function resolveTransactionId(
  method: "cash" | "card" | "upi",
  txnId:  string
): string {
  if (method !== "cash" && txnId.trim()) return txnId.trim();
  // Cash — generate a short reference the backend will accept
  return `CASH-${Date.now().toString(36).toUpperCase()}`;
}

// ── API Functions ─────────────────────────────────────────────────────────────

/**
 * POST /api/payments
 * Records a patient payment for a dispense.
 * If total cleared >= grandTotal, backend marks dispense as PaymentProcessed.
 * Requires If-Match ETag (dispense ETag) in header.
 */
export async function recordPayment(
  request:     CreatePaymentRequest,
  dispenseEtag: string
): Promise<string> {
  try {
    const res = await api.post<string>(ENDPOINTS.payments, request, {
      headers: { "If-Match": dispenseEtag },
    });
    // Backend returns the new paymentId as string
    return res.data;
  } catch (error) {
    logger.error("recordPayment failed", {
      dispenseId: request.dispenseId,
      amount: request.amount,
      error,
    });
    throw error;
  }
}

/**
 * GET /api/payments/{id}
 */
export async function getPaymentById(id: string): Promise<PaymentDetailsDto> {
  try {
    const res = await api.get<PaymentDetailsDto>(ENDPOINTS.paymentById(id));
    return res.data;
  } catch (error) {
    logger.error("getPaymentById failed", { id, error });
    throw error;
  }
}

/**
 * GET /api/payments/dispense/{dispenseId}
 * Returns all payments for a given dispense.
 */
export async function getPaymentsByDispense(
  dispenseId: string
): Promise<PaymentSummaryDto[]> {
  try {
    const res = await api.get<PaymentSummaryDto[]>(
      ENDPOINTS.paymentsByDispense(dispenseId)
    );
    return res.data;
  } catch (error) {
    logger.error("getPaymentsByDispense failed", { dispenseId, error });
    throw error;
  }
}