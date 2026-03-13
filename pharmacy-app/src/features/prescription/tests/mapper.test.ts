import { describe, expect, it } from "vitest";

import { mapDetailsDto, mapReviewToDto } from "@prescription/domain/mapper";
import type { PrescriptionDetailsDto } from "@api/prescription.dto";

describe("prescription mapper", () => {
  it("uses backend medicine id as the lineId when prescriptionLineId is absent", () => {
    const dto: PrescriptionDetailsDto = {
      id: "rx-1",
      patientId: "pat-1",
      patientName: "John Doe",
      prescriber: {
        id: "doc-1",
        name: "Dr. Smith",
      },
      createdAt: "2026-03-13T00:00:00Z",
      status: "Created",
      medicines: [
        {
          id: "rxline-001",
          productId: "prod-aspirin-500",
          productName: "Aspirin",
          strength: "500 mg",
          frequency: "BID",
          instructions: "",
          durationDays: 5,
          quantityPrescribed: 10,
          refillsAllowed: 0,
          pharmacistReview: null,
        },
      ],
    };

    const result = mapDetailsDto(dto);

    expect(result.medicines[0]?.lineId).toBe("rxline-001");
  });

  it("builds review payloads with the resolved prescription line id", () => {
    const payload = mapReviewToDto([
      {
        lineId: "rxline-001",
        status: "Approved",
        notes: null,
      },
      {
        prescriptionLineId: "rxline-002",
        status: "Rejected",
        notes: "Allergy risk",
      },
    ]);

    expect(payload).toEqual({
      reviews: [
        {
          prescriptionLineId: "rxline-001",
          status: "Approved",
          notes: null,
        },
        {
          prescriptionLineId: "rxline-002",
          status: "Rejected",
          notes: "Allergy risk",
        },
      ],
    });
  });
});
