import { describe, expect, it } from "vitest";

import {
  validateMedicationStep,
  validatePrescriptionDraft,
} from "@prescription/utils/validation";
import type { PrescriptionDraft } from "@prescription/types/models";

function buildDraft(
  overrides: Partial<PrescriptionDraft> = {}
): PrescriptionDraft {
  return {
    patient: {
      id: "patient-1",
      fullName: "John Doe",
      phone: "5550001111",
      dob: "1990-01-01",
      gender: "Male",
      allergies: [],
    },
    doctor: {
      id: "doctor-1",
      name: "Dr. Smith",
    },
    medications: [
      {
        drugId: "product-1",
        drugName: "Amoxicillin",
        strength: "500mg",
        frequency: "BID",
        quantity: 5,
        durationDays: 7,
        refills: 0,
        instructions: "After food",
      },
    ],
    notes: "",
    ...overrides,
  };
}

describe("prescription medication validation", () => {
  it("accepts a medication row when required fields are present", () => {
    const result = validateMedicationStep(buildDraft());

    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("does not block submission when quantity differs from the helper suggestion", () => {
    const draft = buildDraft({
      medications: [
        {
          drugId: "product-1",
          drugName: "Ibuprofen",
          strength: "200mg",
          frequency: "TID",
          quantity: 10,
          durationDays: 5,
          refills: 1,
          instructions: "",
        },
      ],
    });

    const result = validatePrescriptionDraft(draft);

    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("still rejects medications that were not selected from inventory", () => {
    const result = validateMedicationStep(
      buildDraft({
        medications: [
          {
            drugId: "",
            drugName: "Ibuprofen",
            strength: "200mg",
            frequency: "TID",
            quantity: 10,
            durationDays: 5,
            refills: 1,
            instructions: "",
          },
        ],
      })
    );

    expect(result.valid).toBe(false);
    expect(result.errors).toContain(
      "Medication 1: Drug must be selected from inventory"
    );
  });
});
