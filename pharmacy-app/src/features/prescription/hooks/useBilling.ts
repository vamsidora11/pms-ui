// src/features/prescription/hooks/useBilling.ts
import { useState, useCallback } from "react";
import type { ClaimStatus, PaymentStatus, PaymentMethod } from "../types/dispense.types";

export function useBilling() {
  const [claimStatus, setClaimStatus] = useState<ClaimStatus>("pending");
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>("pending");
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [transactionId, setTransactionId] = useState("");
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const reset = useCallback((status?: string) => {
    setClaimStatus(status === "Payment Processed" ? "approved" : "pending");
    setPaymentStatus(status === "Payment Processed" ? "paid" : "pending");
    setShowPaymentModal(false);
    setPaymentMethod("cash");
    setTransactionId("");
    setIsProcessingPayment(false);
  }, []);

  // Returns true if approved, false on failure
  const submitClaim = useCallback(async (): Promise<boolean> => {
    if (claimStatus !== "pending") return false;
    setClaimStatus("submitting");
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setClaimStatus("approved");
    return true;
  }, [claimStatus]);

  // Returns true on success
  const recordPayment = useCallback(async (): Promise<boolean> => {
    setIsProcessingPayment(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setPaymentStatus("paid");
    setIsProcessingPayment(false);
    setShowPaymentModal(false);
    return true;
  }, []);

  return {
    claimStatus,
    paymentStatus,
    showPaymentModal,
    paymentMethod,
    transactionId,
    isProcessingPayment,
    setShowPaymentModal,
    setPaymentMethod,
    setTransactionId,
    submitClaim,
    recordPayment,
    reset,
  };
}