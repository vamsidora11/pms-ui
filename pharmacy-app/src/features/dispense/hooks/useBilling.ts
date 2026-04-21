// src/features/dispense/hooks/useBilling.ts
import { useState, useCallback } from "react";
import { createDispense, submitInsuranceClaim, markDispensePaidWithEtag, type DispenseDetailsDto } from "@api/dispense";
import { recordPayment } from "@api/payments.api";
import type { CreateDispenseItemRequest } from "@api/dispense";
import type { ClaimStatus, PaymentStatus, PaymentMethod, BillTotals, DispenseRow } from "../types/dispense.types";

export function useBilling() {
  const [claimStatus,       setClaimStatus]       = useState<ClaimStatus>("idle");
  const [insuranceSkipped,  setInsuranceSkipped]  = useState(false);
  const [paymentStatus,     setPaymentStatus]     = useState<PaymentStatus>("idle");
  const [paymentMethod,     setPaymentMethod]     = useState<PaymentMethod>("cash");
  const [txnId,             setTxnId]             = useState("");
  const [txnIdError,        setTxnIdError]        = useState<string | null>(null);
  const [isReleasing,       setIsReleasing]       = useState(false);
  const [checkoutLoading,   setCheckoutLoading]   = useState(false);
  const [checkoutError,     setCheckoutError]     = useState<string | null>(null);

  const reset = useCallback((itemStatus?: string) => {
    setClaimStatus(itemStatus === "PaymentProcessed" ? "approved" : "idle");
    setInsuranceSkipped(false);
    setPaymentStatus(itemStatus === "PaymentProcessed" ? "done" : "idle");
    setPaymentMethod("cash");
    setTxnId("");
    setTxnIdError(null);
    setIsReleasing(false);
    setCheckoutLoading(false);
    setCheckoutError(null);
  }, []);

  // ── Step 1 → Step 2: Checkout ─────────────────────────────────────────────

  const checkout = useCallback(async (
    patientId:      string,
    prescriptionId: string,
    rows:           DispenseRow[],
    dispenseQty:    Record<string, number>,
    externalQty:    Record<string, number>
  ): Promise<{ dispenseId: string; etag: string; grandTotal: number } | null> => {
    setCheckoutLoading(true);
    setCheckoutError(null);

    const items: CreateDispenseItemRequest[] = [];
    rows.forEach((row) => {
      const qty = dispenseQty[row.id] || 0;
      if (!row.isExternal && qty > 0) {
        items.push({
          prescriptionLineId: row.id,
          productId:          row.productId,
          quantityToDispense: qty,
          isManualAdjustment: false,
        });
      }
      const extQty = externalQty[row.id] || 0;
      if (extQty > 0) {
        items.push({
          prescriptionLineId: row.id,
          productId:          row.productId,
          quantityToDispense: extQty,
          isManualAdjustment: true,
        });
      }
    });

    try {
      const result = await createDispense(patientId, { prescriptionId, items });
      setCheckoutLoading(false);
      return {
        dispenseId: result.dispense.id,
        etag:       result.etag,
        grandTotal: result.dispense.billingSummary.grandTotal,
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Checkout failed. Please try again.";
      setCheckoutError(msg);
      setCheckoutLoading(false);
      return null;
    }
  }, []);

  // ── Submit Insurance Claim ────────────────────────────────────────────────

  const submitClaim = useCallback(async (
    dispenseId: string,
    patientId: string,
    dispenseEtag: string
  ): Promise<{ success: boolean; etag?: string; data?: DispenseDetailsDto } > => {
    setClaimStatus("submitting");

    try {
      console.log("CALLING CLAIM API", { dispenseId, patientId, dispenseEtag });

      // Force call to insurance-claim endpoint and get response (data + etag)
      const res = await submitInsuranceClaim(dispenseId, patientId, dispenseEtag);

      setClaimStatus("approved");
      return { success: true, etag: res.etag, data: res.data };
    } catch (err) {
      console.error("CLAIM FAILED", err);
      setClaimStatus("idle");
      return { success: false };
    }
  }, []);

  const skipInsurance     = useCallback(() => setInsuranceSkipped(true),  []);
  const undoSkipInsurance = useCallback(() => setInsuranceSkipped(false), []);

  // ── Validate transaction ID — returns true if valid ───────────────────────

  const validateTxnId = useCallback((): boolean => {
    if (paymentMethod !== "cash" && !txnId?.trim()) {
      setTxnIdError("Transaction / Reference ID is required");
      return false;
    }
    setTxnIdError(null);
    return true;
  }, [paymentMethod, txnId]);

  // ── Record Patient Payment ────────────────────────────────────────────────

  const doRecordPayment = useCallback(async (
    patientId: string,
    dispenseId: string,
    dispenseEtag: string,
    amount: number
  ): Promise<{ success: boolean; etag?: string }> => {
    if (!validateTxnId()) return { success: false };

    setPaymentStatus("processing");

    try {
      console.log("PAYMENT REQUEST", {
        patientId,
        dispenseId,
        amount,
        method: paymentMethod,
        txnId,
        etag: dispenseEtag,
      });

      const { paymentId, etag: paymentEtag } = await recordPayment(
        {
          patientId,
          dispenseId,
          amount,
          payerType: "Patient",
          paymentMode:
            paymentMethod === "cash"
              ? "Cash"
              : paymentMethod === "card"
              ? "Card"
              : "UPI",
          transactionId:
            paymentMethod === "cash"
              ? undefined
              : txnId?.trim() || undefined,
        },
        dispenseEtag
      );

      // Ensure backend Dispense state is updated to Paid so Ready/Execute transitions succeed.
      let paidEtag: string;
      try {
        const res = await markDispensePaidWithEtag(dispenseId, patientId, paymentEtag || dispenseEtag, amount);
        paidEtag = res.etag;
      } catch (err) {
        console.error("markDispensePaid failed", err);
        // If marking paid fails, treat as payment failure so UI can retry.
        setPaymentStatus("idle");
        return { success: false };
      }

      setPaymentStatus("done");
      return { success: true, etag: paidEtag };
    } catch (err) {
      console.error("PAYMENT FAILED", err);
      setPaymentStatus("idle");
      return { success: false };
    }
  }, [paymentMethod, txnId]);

  // ── Totals ────────────────────────────────────────────────────────────────

  const computeTotals = useCallback(
    (subtotal: number): BillTotals => {
      return {
        subtotal,
        insuranceCovered: 0,
        patientDue: subtotal,
      };
    },
    []
  );

  const canRelease = useCallback(
    (hasInsurance: boolean): boolean => {
      // Block release if insurance present and claim not approved (unless skipped)
      if (hasInsurance && claimStatus !== "approved" && !insuranceSkipped) return false;
      if (hasInsurance && !insuranceSkipped) return claimStatus === "approved" && paymentStatus === "done";
      return paymentStatus === "done";
    },
    [claimStatus, insuranceSkipped, paymentStatus]
  );

  return {
    claimStatus,
    insuranceSkipped,
    paymentStatus,
    paymentMethod,
    txnId,
    txnIdError,
    isReleasing,
    checkoutLoading,
    checkoutError,
    // setters
    setPaymentMethod,
    setTxnId: (val: string) => { setTxnId(val); if (val.trim()) setTxnIdError(null); },
    setIsReleasing,
    // actions
    reset,
    checkout,
    submitClaim,
    skipInsurance,
    undoSkipInsurance,
    doRecordPayment,
    computeTotals,
    canRelease,
  };
}
