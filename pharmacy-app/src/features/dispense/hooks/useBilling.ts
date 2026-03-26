// src/features/dispense/hooks/useBilling.ts
import { useState, useCallback } from "react";
import { createDispense, submitInsuranceClaim, getDispenseById } from "@api/dispense";
import { recordPayment, toPaymentMode, resolveTransactionId } from "@api/payment";
import type { CreateDispenseItemRequest } from "@api/dispense";
import type { ClaimStatus, PaymentStatus, PaymentMethod, BillTotals, DispenseRow } from "../types/dispense.types";

const INSURANCE_RATE = 0.65;

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
    setClaimStatus(itemStatus === "Payment Processed" ? "approved" : "idle");
    setInsuranceSkipped(false);
    setPaymentStatus(itemStatus === "Payment Processed" ? "done" : "idle");
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
    dispenseId:   string,
    patientId:    string,
    dispenseEtag: string
  ): Promise<boolean> => {
    if (claimStatus !== "idle") return false;
    setClaimStatus("submitting");
    try {
      const fresh = await getDispenseById(dispenseId, patientId);

      if (fresh.dispense.status === "InsuranceApproved") {
        setClaimStatus("approved");
        return true;
      }

      if (fresh.dispense.status !== "Created") {
        setClaimStatus("idle");
        return false;
      }

      await submitInsuranceClaim(dispenseId, patientId, fresh.etag);
      setClaimStatus("approved");
      return true;
    } catch (err: unknown) {
      try {
        const recheck = await getDispenseById(dispenseId, patientId);
        if (
          recheck.dispense.status === "InsuranceApproved" ||
          recheck.dispense.status === "Created"
        ) {
          setClaimStatus("approved");
          return true;
        }
      } catch {
        // recheck failed — fall through to error
      }
      setClaimStatus("idle");
      console.error("submitClaim failed:", err);
      return false;
    }
  }, [claimStatus]);

  const skipInsurance     = useCallback(() => setInsuranceSkipped(true),  []);
  const undoSkipInsurance = useCallback(() => setInsuranceSkipped(false), []);

  // ── Validate transaction ID — returns true if valid ───────────────────────

  const validateTxnId = useCallback((): boolean => {
    if (paymentMethod !== "cash" && !txnId.trim()) {
      setTxnIdError("Transaction / Reference ID is required");
      return false;
    }
    setTxnIdError(null);
    return true;
  }, [paymentMethod, txnId]);

  // ── Record Patient Payment ────────────────────────────────────────────────

  const doRecordPayment = useCallback(async (
    patientId:    string,
    dispenseId:   string,
    dispenseEtag: string,
    amount:       number
  ): Promise<boolean> => {
    if (!validateTxnId()) return false;

    setPaymentStatus("processing");
    try {
      await recordPayment(
        {
          patientId,
          dispenseId,
          paymentMode:   toPaymentMode(paymentMethod),
          transactionId: resolveTransactionId(paymentMethod, txnId),
          amount,
          payerType:     "Patient",
        },
        dispenseEtag
      );
      setPaymentStatus("done");
      return true;
    } catch (err) {
      setPaymentStatus("idle");
      console.error("doRecordPayment failed:", err);
      return false;
    }
  }, [paymentMethod, txnId, validateTxnId]);

  // ── Totals ────────────────────────────────────────────────────────────────

  const computeTotals = useCallback(
    (subtotal: number): BillTotals => {
      const insuranceCovered =
        claimStatus === "approved" && !insuranceSkipped
          ? subtotal * INSURANCE_RATE
          : 0;
      return { subtotal, insuranceCovered, patientDue: subtotal - insuranceCovered };
    },
    [claimStatus, insuranceSkipped]
  );

  const canRelease = useCallback(
    (hasInsurance: boolean): boolean => {
      if (hasInsurance && !insuranceSkipped)
        return claimStatus === "approved" && paymentStatus === "done";
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
    insuranceRate: INSURANCE_RATE,
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
