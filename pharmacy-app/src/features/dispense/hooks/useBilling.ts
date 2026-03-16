// src/features/prescription/hooks/useBilling.ts
import { useState, useCallback } from "react";
import type { ClaimStatus, PaymentStatus, PaymentMethod } from "features/dispense/types/dispense.types";
import { submitInsuranceClaim } from "@api/dispense";

export function useBilling() {
  const [claimStatus, setClaimStatus] = useState<ClaimStatus>("pending");
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>("pending");
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [transactionId, setTransactionId] = useState("");
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const reset = useCallback((status?: string) => {
    const isPaid = status === "PaymentProcessed" || status === "Dispensed";
    setClaimStatus(isPaid ? "approved" : "pending");
    setPaymentStatus(isPaid ? "paid" : "pending");
    setShowPaymentModal(false);
    setPaymentMethod("cash");
    setTransactionId("");
    setIsProcessingPayment(false);
  }, []);

  // Returns true if approved, false on failure
  const submitClaim = useCallback(
    async (
      dispenseId: string,
      patientId: string,
      etag: string
    ): Promise<{ ok: boolean; etag?: string }> => {
      if (claimStatus !== "pending") return { ok: false };
      setClaimStatus("submitting");
      try {
        const nextEtag = await submitInsuranceClaim(dispenseId, patientId, etag);
        setClaimStatus("approved");
        return { ok: true, etag: nextEtag };
      } catch {
        setClaimStatus("rejected");
        return { ok: false };
      }
    },
    [claimStatus]
  );

  // Returns true on success
  const recordPayment = useCallback(async (): Promise<boolean> => {
    setIsProcessingPayment(true);
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
