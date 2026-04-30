import { renderHook, act } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { useValidationUiState } from "../hooks/useValidationUiState";
import type { PrescriptionDetails } from "@prescription/domain/model";

function createPrescription(): PrescriptionDetails {
  return {
    id: "rx-1",
    patientId: "p-1",
    patientName: "John Doe",
    prescriber: { id: "dr-1", name: "Dr. Smith" },
    prescriberName: "Dr. Smith",
    createdAt: new Date("2026-03-01T10:00:00Z"),
    status: "Created",
    medicineCount: 2,
    medicines: [
      {
        lineId: "line-1",
        productId: "prod-1",
        name: "Amoxicillin",
        strength: "500mg",
        frequency: "BID",
        instructions: "",
        durationDays: 7,
        quantityPrescribed: 14,
        quantityApprovedPerFill: null,
        quantityDispensed: 0,
        refillsAllowed: 0,
        refillsRemaining: 0,
        validation: {
          hasAllergy: false,
          hasInteraction: false,
          severity: "None",
          interactionDetails: [],
        },
        review: {
          status: "Pending",
          reviewedBy: null,
          reviewedAt: null,
          notes: null,
        },
      },
      {
        lineId: "line-2",
        productId: "prod-2",
        name: "Cetirizine",
        strength: "10mg",
        frequency: "OD",
        instructions: "",
        durationDays: 5,
        quantityPrescribed: 5,
        quantityApprovedPerFill: null,
        quantityDispensed: 0,
        refillsAllowed: 0,
        refillsRemaining: 0,
        validation: {
          hasAllergy: false,
          hasInteraction: false,
          severity: "None",
          interactionDetails: [],
        },
        review: {
          status: "Approved",
          reviewedBy: "ph-1",
          reviewedAt: new Date("2026-03-01T12:00:00Z"),
          notes: null,
        },
      },
    ],
  };
}

describe("useValidationUiState", () => {
  it("initializes persisted reviewed lines into decisions", () => {
    const { result } = renderHook(() => useValidationUiState());

    act(() => {
      result.current.actions.init(createPrescription());
    });

    expect(result.current.ui.decisions).toEqual({ "line-2": "Approved" });
  });

  it("lets a draft approval be changed to rejection before submit", () => {
    const { result } = renderHook(() => useValidationUiState());

    act(() => {
      result.current.actions.init(createPrescription());
      result.current.actions.acceptLine("line-1");
      result.current.actions.openRejectLine("line-1");
    });

    expect(result.current.ui.decisions["line-1"]).toBe("Approved");
    expect(result.current.ui.rejectLineId).toBe("line-1");
  });

  it("lets a draft rejection be changed back to approval before submit", () => {
    const { result } = renderHook(() => useValidationUiState());

    act(() => {
      result.current.actions.init(createPrescription());
      result.current.actions.confirmRejectLine("line-1");
      result.current.actions.acceptLine("line-1");
    });

    expect(result.current.ui.decisions["line-1"]).toBe("Approved");
  });

  it("does not change a line that was already finalized in the loaded data", () => {
    const { result } = renderHook(() => useValidationUiState());

    act(() => {
      result.current.actions.init(createPrescription());
      result.current.actions.openRejectLine("line-2");
      result.current.actions.acceptLine("line-2");
    });

    expect(result.current.ui.decisions["line-2"]).toBe("Approved");
    expect(result.current.ui.rejectLineId).toBeNull();
  });

  it("does not open reject-all once line review has started", () => {
    const { result } = renderHook(() => useValidationUiState());

    act(() => {
      result.current.actions.init(createPrescription());
      result.current.actions.acceptLine("line-1");
      result.current.actions.openRejectAll();
    });

    expect(result.current.ui.rejectAllOpen).toBe(false);
  });
});
