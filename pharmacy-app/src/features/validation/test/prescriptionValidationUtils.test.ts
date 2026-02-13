import { describe, it, expect } from "vitest";
import {
  pillToneBySeverity,
  computeValidation,
  mapInteractionLevel,
} from "../utils/prescriptionValidationUtils";
import type {
  PrescriptionMedicineDto,
  MedicineValidationDto,
} from "@prescription/types/prescription.types";

/* ---------------- Factory Helpers ---------------- */

function createValidation(
  overrides?: Partial<MedicineValidationDto>
): MedicineValidationDto {
  return {
    drugAllergy: {
      isPresent: false,
      overallSeverity: null,
      allergies: [],
    },
    drugInteraction: {
      isPresent: false,
      overallSeverity: null,
      interactingWith: [],
    },
    lowStock: {
      isPresent: false,
      severity: null,
      requiredQty: 0,
      availableQty: 0,
      message: null,
    },
    ...overrides,
  };
}

function createMedicine(
  overrides?: Partial<PrescriptionMedicineDto>
): PrescriptionMedicineDto {
  return {
    prescriptionMedicineId: "MED-1",
    productId: "PROD-1",
    name: "Paracetamol",
    strength: "500mg",
    prescribedQuantity: 10,
    dispensedQuantity: 0,
    totalRefillsAuthorized: 1,
    refillsRemaining: 1,
    frequency: "BID",
    daysSupply: 5,
    endDate: null,
    instruction: "Take after food",
    validation: createValidation(),
    pharmacistReview: {
      decision: "Pending",
      reviewedBy: null,
      reviewedAt: null,
      overrideReason: null,
    },
    ...overrides,
  };
}

/* ---------------- pillToneBySeverity ---------------- */

describe("pillToneBySeverity", () => {
  it("returns correct tone", () => {
    expect(pillToneBySeverity("High")).toBe("red");
    expect(pillToneBySeverity("Moderate")).toBe("amber");
    expect(pillToneBySeverity("Low")).toBe("yellow");
  });

  it("defaults to green", () => {
    expect(pillToneBySeverity("None")).toBe("green");
    expect(pillToneBySeverity(null)).toBe("green");
    expect(pillToneBySeverity(undefined)).toBe("green");
    expect(pillToneBySeverity("Random")).toBe("green");
  });
});

/* ---------------- computeValidation ---------------- */

describe("computeValidation", () => {
  it("returns Blocked when drug allergy severity is High", () => {
    const medicine = createMedicine({
      validation: createValidation({
        drugAllergy: {
          isPresent: true,
          overallSeverity: "High",
          allergies: [],
        },
      }),
    });

    expect(computeValidation(medicine, 10)).toBe("Blocked");
  });

  it("returns Partial when low stock insufficient", () => {
    const medicine = createMedicine({
      validation: createValidation({
        lowStock: {
          isPresent: true,
          severity: "Moderate",
          requiredQty: 10,
          availableQty: 5,
          message: "Low stock",
        },
      }),
    });

    expect(computeValidation(medicine, 10)).toBe("Partial");
  });

  it("returns OK when low stock sufficient", () => {
    const medicine = createMedicine({
      validation: createValidation({
        lowStock: {
          isPresent: true,
          severity: "Low",
          requiredQty: 10,
          availableQty: 20,
          message: null,
        },
      }),
    });

    expect(computeValidation(medicine, 10)).toBe("OK");
  });

  it("returns OK when no validation issues", () => {
    const medicine = createMedicine();

    expect(computeValidation(medicine, 10)).toBe("OK");
  });
});

/* ---------------- mapInteractionLevel ---------------- */

describe("mapInteractionLevel", () => {
  it("maps correctly", () => {
    expect(mapInteractionLevel("High")).toBe("Major");
    expect(mapInteractionLevel("Moderate")).toBe("Moderate");
    expect(mapInteractionLevel("Low")).toBe("Minor");
  });

  it("defaults to None", () => {
    expect(mapInteractionLevel("None")).toBe("None");
    expect(mapInteractionLevel(null)).toBe("None");
    expect(mapInteractionLevel(undefined)).toBe("None");
    expect(mapInteractionLevel("Random")).toBe("None");
  });
});
