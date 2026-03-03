import { useCallback, useMemo, useReducer } from "react";
import type { PrescriptionDetailsDto } from "@prescription/types/prescription.types";
import type { AllergyAlert, ValidationUIState } from "../types/validation.types";

type Action =
  | { type: "INIT"; payload: PrescriptionDetailsDto }
  | { type: "OPEN_REJECT_LINE"; id: string }
  | { type: "CLOSE_REJECT_LINE" }
  | { type: "SET_REASON"; key: string; value: string }
  | { type: "CLEAR_REASON"; key: string }
  | { type: "OPEN_REJECT_ALL" }
  | { type: "CLOSE_REJECT_ALL" }
  | { type: "OPEN_ALLERGY"; alert: AllergyAlert }
  | { type: "CLOSE_ALLERGY" };

function createInitialUIState(): ValidationUIState {
  return {
    data: null,
    reasons: {},
    allergyFor: null,
    rejectLineId: null,
    rejectAllOpen: false,
  };
}

function reducer(state: ValidationUIState, action: Action): ValidationUIState {
  switch (action.type) {
    case "INIT":
      return {
        ...state,
        data: action.payload,
        reasons: {},
        rejectLineId: null,
        rejectAllOpen: false,
      };

    case "OPEN_REJECT_LINE":
      return { ...state, rejectLineId: action.id };

    case "CLOSE_REJECT_LINE":
      return { ...state, rejectLineId: null };

    case "SET_REASON":
      return {
        ...state,
        reasons: { ...state.reasons, [action.key]: action.value },
      };

    case "CLEAR_REASON": {
      const nextReasons = { ...state.reasons };
      delete nextReasons[action.key];
      return {
        ...state,
        reasons: nextReasons,
      };
    }

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

  const openRejectLine = useCallback((id: string) => {
    dispatch({ type: "OPEN_REJECT_LINE", id });
  }, []);

  const closeRejectLine = useCallback(() => {
    dispatch({ type: "CLOSE_REJECT_LINE" });
  }, []);

  const setReason = useCallback((key: string, value: string) => {
    dispatch({ type: "SET_REASON", key, value });
  }, []);

  const clearReason = useCallback((key: string) => {
    dispatch({ type: "CLEAR_REASON", key });
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

  const actions = useMemo(
    () => ({
      init,
      openRejectLine,
      closeRejectLine,
      setReason,
      clearReason,
      openRejectAll,
      closeRejectAll,
      openAllergy,
      closeAllergy,
    }),
    [
      init,
      openRejectLine,
      closeRejectLine,
      setReason,
      clearReason,
      openRejectAll,
      closeRejectAll,
      openAllergy,
      closeAllergy,
    ]
  );

  return { ui, actions };
}
