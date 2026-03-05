import { useCallback, useMemo, useReducer } from "react";
import type { PrescriptionDetails } from "@prescription/domain/model";
import type { AllergyAlert, LineDecision, ValidationUIState } from "../types/validation.types";

type Action =
  | { type: "INIT"; payload: PrescriptionDetails }
  | { type: "ACCEPT_LINE"; id: string }
  | { type: "OPEN_REJECT_LINE"; id: string }
  | { type: "CLOSE_REJECT_LINE" }
  | { type: "CONFIRM_REJECT_LINE"; id: string }
  | { type: "SET_REASON"; key: string; value: string }
  | { type: "CLEAR_REASON"; key: string }
  | { type: "OPEN_REJECT_ALL" }
  | { type: "CLOSE_REJECT_ALL" }
  | { type: "REJECT_ALL"; reason: string }
  | { type: "OPEN_ALLERGY"; alert: AllergyAlert }
  | { type: "CLOSE_ALLERGY" };

function buildInitialDecisions(data: PrescriptionDetails): Record<string, LineDecision> {
  return data.medicines.reduce<Record<string, LineDecision>>((acc, line) => {
    if (line.review.status === "Approved" || line.review.status === "Rejected") {
      acc[line.lineId] = line.review.status;
    }
    return acc;
  }, {});
}

function createInitialUIState(): ValidationUIState {
  return {
    data: null,
    decisions: {},
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
        decisions: buildInitialDecisions(action.payload),
        reasons: {},
        rejectLineId: null,
        rejectAllOpen: false,
      };

    case "ACCEPT_LINE": {
      const nextReasons = { ...state.reasons };
      delete nextReasons[action.id];
      return {
        ...state,
        decisions: { ...state.decisions, [action.id]: "Approved" },
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

    case "CLEAR_REASON": {
      const nextReasons = { ...state.reasons };
      delete nextReasons[action.key];
      return { ...state, reasons: nextReasons };
    }

    case "OPEN_REJECT_ALL":
      return { ...state, rejectAllOpen: true };

    case "CLOSE_REJECT_ALL":
      return { ...state, rejectAllOpen: false };

    case "REJECT_ALL": {
      if (!state.data) {
        return state;
      }

      const decisions = state.data.medicines.reduce<Record<string, LineDecision>>(
        (acc, line) => {
          acc[line.lineId] = "Rejected";
          return acc;
        },
        {}
      );

      const reasons = state.data.medicines.reduce<Record<string, string>>((acc, line) => {
        acc[line.lineId] = action.reason;
        return acc;
      }, {});

      return {
        ...state,
        decisions,
        reasons: { ...state.reasons, ...reasons, _ALL_: action.reason },
        rejectAllOpen: false,
      };
    }

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

  const init = useCallback((data: PrescriptionDetails) => {
    dispatch({ type: "INIT", payload: data });
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

  const confirmRejectLine = useCallback((id: string) => {
    dispatch({ type: "CONFIRM_REJECT_LINE", id });
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

  const rejectAll = useCallback((reason: string) => {
    dispatch({ type: "REJECT_ALL", reason });
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
      acceptLine,
      openRejectLine,
      closeRejectLine,
      confirmRejectLine,
      setReason,
      clearReason,
      openRejectAll,
      closeRejectAll,
      rejectAll,
      openAllergy,
      closeAllergy,
    }),
    [
      acceptLine,
      clearReason,
      closeAllergy,
      closeRejectAll,
      closeRejectLine,
      confirmRejectLine,
      init,
      openAllergy,
      openRejectAll,
      openRejectLine,
      rejectAll,
      setReason,
    ]
  );

  return { ui, actions };
}
