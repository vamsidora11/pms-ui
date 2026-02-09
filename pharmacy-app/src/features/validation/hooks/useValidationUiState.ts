import { useCallback, useMemo, useReducer } from "react";
import type { PrescriptionDetailsDto } from "@prescription/prescription.types";
import type {
  AllergyAlert,
  LineDecision,
  ValidationUIState,
} from "../types/validation.types";

type Action =
  | { type: "INIT"; payload: PrescriptionDetailsDto }
  | { type: "SET_ADJUSTED"; id: string; qty: number }
  | { type: "ACCEPT_LINE"; id: string }
  | { type: "OPEN_REJECT_LINE"; id: string }
  | { type: "CLOSE_REJECT_LINE" }
  | { type: "CONFIRM_REJECT_LINE"; id: string }
  | { type: "SET_REASON"; key: string; value: string }
  | { type: "OPEN_REJECT_ALL" }
  | { type: "CLOSE_REJECT_ALL" }
  | { type: "OPEN_ALLERGY"; alert: AllergyAlert }
  | { type: "CLOSE_ALLERGY" };

function createInitialUIState(): ValidationUIState {
  return {
    data: null,
    adjusted: {},
    decisions: {},
    reasons: {},
    allergyFor: null,
    rejectLineId: null,
    rejectAllOpen: false,
  };
}

function reducer(state: ValidationUIState, action: Action): ValidationUIState {
  switch (action.type) {
    case "INIT": {
      const res = action.payload;
      const adjusted: Record<string, number> = {};
      const decisions: Record<string, LineDecision> = {};

      res.medicines.forEach((m) => {
        adjusted[m.prescriptionMedicineId] = m.prescribedQuantity;
        decisions[m.prescriptionMedicineId] = null;
      });

      return { ...state, data: res, adjusted, decisions, reasons: {} };
    }

    case "SET_ADJUSTED":
      return {
        ...state,
        adjusted: { ...state.adjusted, [action.id]: Math.max(0, action.qty) },
      };

    case "ACCEPT_LINE": {
      const nextReasons = { ...state.reasons };
      delete nextReasons[action.id];
      return {
        ...state,
        decisions: { ...state.decisions, [action.id]: "Accepted" },
        reasons: nextReasons,
      };
    }

    case "OPEN_REJECT_LINE":
      return { ...state, rejectLineId: action.id };

    case "CLOSE_REJECT_LINE":
      return { ...state, rejectLineId: null };

    case "CONFIRM_REJECT_LINE":
      return {
        ...state,
        decisions: { ...state.decisions, [action.id]: "Rejected" },
        rejectLineId: null,
      };

    case "SET_REASON":
      return {
        ...state,
        reasons: { ...state.reasons, [action.key]: action.value },
      };

    case "OPEN_REJECT_ALL":
      return { ...state, rejectAllOpen: true };

    case "CLOSE_REJECT_ALL":
      return { ...state, rejectAllOpen: false };

    case "OPEN_ALLERGY":
      return { ...state, allergyFor: action.alert };

    case "CLOSE_ALLERGY":
      return { ...state, allergyFor: null };

    default:
      return state;
  }
}

export function useValidationUiState() {
  const [ui, dispatch] = useReducer(reducer, undefined, createInitialUIState);

  const init = useCallback((data: PrescriptionDetailsDto) => {
    dispatch({ type: "INIT", payload: data });
  }, []);

  const setAdjusted = useCallback((id: string, qty: number) => {
    dispatch({ type: "SET_ADJUSTED", id, qty });
  }, []);

  const acceptLine = useCallback((id: string) => {
    dispatch({ type: "ACCEPT_LINE", id });
  }, []);

  const openRejectLine = useCallback((id: string) => {
    dispatch({ type: "OPEN_REJECT_LINE", id });
  }, []);

  const closeRejectLine = useCallback(() => {
    dispatch({ type: "CLOSE_REJECT_LINE" });
  }, []);

  const setReason = useCallback((key: string, value: string) => {
    dispatch({ type: "SET_REASON", key, value });
  }, []);

  const confirmRejectLine = useCallback((id: string) => {
    dispatch({ type: "CONFIRM_REJECT_LINE", id });
  }, []);

  const openRejectAll = useCallback(() => {
    dispatch({ type: "OPEN_REJECT_ALL" });
  }, []);

  const closeRejectAll = useCallback(() => {
    dispatch({ type: "CLOSE_REJECT_ALL" });
  }, []);

  const openAllergy = useCallback((alert: AllergyAlert) => {
    dispatch({ type: "OPEN_ALLERGY", alert });
  }, []);

  const closeAllergy = useCallback(() => {
    dispatch({ type: "CLOSE_ALLERGY" });
  }, []);

  // ✅ key fix: memoize the object so it's stable across renders
  const actions = useMemo(
    () => ({
      init,
      setAdjusted,
      acceptLine,
      openRejectLine,
      closeRejectLine,
      confirmRejectLine,
      setReason,
      openRejectAll,
      closeRejectAll,
      openAllergy,
      closeAllergy,
    }),
    [
      init,
      setAdjusted,
      acceptLine,
      openRejectLine,
      closeRejectLine,
      confirmRejectLine,
      setReason,
      openRejectAll,
      closeRejectAll,
      openAllergy,
      closeAllergy,
    ]
  );

  return { ui, actions };
}