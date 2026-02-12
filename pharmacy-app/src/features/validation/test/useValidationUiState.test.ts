import { renderHook, act } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { useValidationUiState } from "../hooks/useValidationUiState";
import type { PrescriptionDetailsDto } from "@prescription/types/prescription.types";
import type { AllergyAlert } from "../types/validation.types";

/* ---------- Test Data Factory ---------- */

function createMockPrescription(): PrescriptionDetailsDto {
  return {
    id: "RX-001",
    medicines: [
      {
        prescriptionMedicineId: "MED-1",
        prescribedQuantity: 10,
      },
      {
        prescriptionMedicineId: "MED-2",
        prescribedQuantity: 5,
      },
    ],
  } as PrescriptionDetailsDto;
}

function createMockAllergy(
  overrides?: Partial<AllergyAlert>
): AllergyAlert {
  return {
    issueType: "Drug-Allergy",
    severity: "High", // must match Severity type
    affectedBy: "Penicillin",
    message: "Patient has a severe penicillin allergy",
    allergenCode: "ALG-001",
    ...overrides,
  };
}

/* ---------- Tests ---------- */

describe("useValidationUiState", () => {
  it("initializes with default state", () => {
    const { result } = renderHook(() => useValidationUiState());

    expect(result.current.ui.data).toBeNull();
    expect(result.current.ui.adjusted).toEqual({});
    expect(result.current.ui.decisions).toEqual({});
    expect(result.current.ui.reasons).toEqual({});
    expect(result.current.ui.rejectLineId).toBeNull();
    expect(result.current.ui.rejectAllOpen).toBe(false);
  });

  it("initializes data correctly with INIT", () => {
    const { result } = renderHook(() => useValidationUiState());
    const mockRx = createMockPrescription();

    act(() => {
      result.current.actions.init(mockRx);
    });

    expect(result.current.ui.data).toEqual(mockRx);
    expect(result.current.ui.adjusted).toEqual({
      "MED-1": 10,
      "MED-2": 5,
    });
    expect(result.current.ui.decisions).toEqual({
      "MED-1": null,
      "MED-2": null,
    });
  });

  it("sets adjusted quantity and clamps negative to zero", () => {
    const { result } = renderHook(() => useValidationUiState());
    act(() => result.current.actions.init(createMockPrescription()));

    act(() => {
      result.current.actions.setAdjusted("MED-1", -5);
    });

    expect(result.current.ui.adjusted["MED-1"]).toBe(0);
  });

  it("accepts a line and clears reason", () => {
    const { result } = renderHook(() => useValidationUiState());
    act(() => result.current.actions.init(createMockPrescription()));

    act(() => {
      result.current.actions.setReason("MED-1", "Some reason");
    });

    act(() => {
      result.current.actions.acceptLine("MED-1");
    });

    expect(result.current.ui.decisions["MED-1"]).toBe("Accepted");
    expect(result.current.ui.reasons["MED-1"]).toBeUndefined();
  });

  it("opens and closes reject line modal", () => {
    const { result } = renderHook(() => useValidationUiState());

    act(() => result.current.actions.openRejectLine("MED-1"));
    expect(result.current.ui.rejectLineId).toBe("MED-1");

    act(() => result.current.actions.closeRejectLine());
    expect(result.current.ui.rejectLineId).toBeNull();
  });

  it("confirms reject line", () => {
    const { result } = renderHook(() => useValidationUiState());
    act(() => result.current.actions.init(createMockPrescription()));

    act(() => result.current.actions.openRejectLine("MED-1"));
    act(() => result.current.actions.confirmRejectLine("MED-1"));

    expect(result.current.ui.decisions["MED-1"]).toBe("Rejected");
    expect(result.current.ui.rejectLineId).toBeNull();
  });

  it("sets reason correctly", () => {
    const { result } = renderHook(() => useValidationUiState());

    act(() => result.current.actions.setReason("MED-1", "Invalid dosage"));

    expect(result.current.ui.reasons["MED-1"]).toBe("Invalid dosage");
  });

  it("opens and closes reject all modal", () => {
    const { result } = renderHook(() => useValidationUiState());

    act(() => result.current.actions.openRejectAll());
    expect(result.current.ui.rejectAllOpen).toBe(true);

    act(() => result.current.actions.closeRejectAll());
    expect(result.current.ui.rejectAllOpen).toBe(false);
  });

  it("opens and closes allergy modal", () => {
    const { result } = renderHook(() => useValidationUiState());
    const alert = createMockAllergy();

    act(() => result.current.actions.openAllergy(alert));
    expect(result.current.ui.allergyFor).toEqual(alert);

    act(() => result.current.actions.closeAllergy());
    expect(result.current.ui.allergyFor).toBeNull();
  });

  it("actions object is memoized", () => {
    const { result, rerender } = renderHook(() =>
      useValidationUiState()
    );

    const firstActions = result.current.actions;

    rerender();

    expect(result.current.actions).toBe(firstActions);
  });
});
