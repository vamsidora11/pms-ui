import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// SUT
import {
  getLabelQueue,
  getDispenseLabels,
} from "../label";

// ---- Mocks ----
vi.mock("../axiosInstance", () => {
  return {
    default: {
      get: vi.fn(),
    },
  };
});

vi.mock("../endpoints", () => {
  return {
    ENDPOINTS: {
      dispenses: "/api/dispenses",
      dispenseLabel: (id: string) => `/api/dispenses/${id}/label`,
    },
  };
});

// Import mocked instances/types after vi.mock
import api from "../axiosInstance";
import { ENDPOINTS } from "../endpoints";

// Types used in return values (optional for clarity in test data)
type LabelQueuePrescription = {
  id: string;
  prescriptionId: string;
  patientId: string;
  patientName: string;
  dispenseDate: string;
  status: string;
  itemCount: number;
  grandTotal: number;
};
type LabelPrescriptionDetails = {
  dispenseId: string;
  prescriptionId: string;
  patientId: string;
  patientName: string;
  dispenseDate: string;
  status: string;
  pharmacistId: string;
  items: Array<{
    prescriptionLineId: string;
    productId: string;
    productName: string;
    frequency: string;
    instructions: string;
    refillNumber: number;
    quantityDispensed: number;
    isManualAdjustment: boolean;
    lotsUsed: Array<{ lotId: string; quantity: number; expiry: string }>;
    pricing: {
      unitPrice: number;
      total: number;
      insurancePaid: number;
      patientPayable: number;
    };
  }>;
};

describe("labels API", () => {
  const apiGet = api.get as unknown as ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("getLabelQueue", () => {
    it("calls dispenses endpoint with default pageSize (10) and default pageNumber/status", async () => {
      const mockResponse = {
        data: {
          items: [
            {
              id: "disp-1",
              prescriptionId: "rx-1",
              patientId: "patient-1",
              patientName: "John Doe",
              dispenseDate: "2026-02-10T09:00:00.000Z",
              status: "PaymentProcessed",
              itemCount: 2,
              grandTotal: 10,
            },
          ] as LabelQueuePrescription[],
          pageSize: 10,
          totalCount: 1,
        },
      };
      apiGet.mockResolvedValueOnce(mockResponse);

      const result = await getLabelQueue(); // uses defaults

      expect(apiGet).toHaveBeenCalledTimes(1);
      expect(apiGet).toHaveBeenCalledWith(ENDPOINTS.dispenses, {
        params: {
          pageSize: 10,
          pageNumber: 1,
          status: "PaymentProcessed",
        },
      });
      expect(result).toEqual(mockResponse.data);
    });

    it("passes provided pageSize and pageNumber via query params", async () => {
      const mockResponse = {
        data: {
          items: [
            {
              id: "disp-1",
              prescriptionId: "rx-1",
              patientId: "patient-1",
              patientName: "John Doe",
              dispenseDate: "2026-02-10T09:00:00.000Z",
              status: "PaymentProcessed",
              itemCount: 2,
              grandTotal: 10,
            },
          ] satisfies LabelQueuePrescription[],
          pageSize: 50,
          totalCount: 1,
        },
      };
      apiGet.mockResolvedValueOnce(mockResponse);

      const res = await getLabelQueue(50, 3);

      expect(apiGet).toHaveBeenCalledWith(ENDPOINTS.dispenses, {
        params: { pageSize: 50, pageNumber: 3, status: "PaymentProcessed" },
      });
      expect(res).toEqual(mockResponse.data);
    });

    it("rethrows errors from the API call", async () => {
      const err = new Error("Queue fetch failed");
      apiGet.mockRejectedValueOnce(err);

      await expect(getLabelQueue(10)).rejects.toThrow("Queue fetch failed");
    });

    it("works when API omits totalCount", async () => {
      const mockResponse = {
        data: {
          items: [
            {
              id: "disp-2",
              prescriptionId: "rx-2",
              patientId: "patient-2",
              patientName: "Jane Doe",
              dispenseDate: "2026-02-10T10:00:00.000Z",
              status: "PaymentProcessed",
              itemCount: 1,
              grandTotal: 12.5,
            },
          ] as LabelQueuePrescription[],
          pageSize: 10,
        },
      };
      apiGet.mockResolvedValueOnce(mockResponse);

      const res = await getLabelQueue(10);

      expect(res).toEqual({
        items: [
          {
            id: "disp-2",
            prescriptionId: "rx-2",
            patientId: "patient-2",
            patientName: "Jane Doe",
            dispenseDate: "2026-02-10T10:00:00.000Z",
            status: "PaymentProcessed",
            itemCount: 1,
            grandTotal: 12.5,
          },
        ],
        pageSize: 10,
      });
    });
  });

  describe("getDispenseLabels", () => {
    it("calls dispenseLabel endpoint with given dispenseId/patientId and returns data", async () => {
      const dispenseId = "disp-123";
      const patientId = "patient-123";
      const mockPayload: LabelPrescriptionDetails = {
        dispenseId,
        prescriptionId: "rx-123",
        patientId,
        patientName: "John Doe",
        dispenseDate: "2026-03-11T15:36:46.220Z",
        status: "PaymentProcessed",
        pharmacistId: "pharm-1",
        items: [
          {
            prescriptionLineId: "line-1",
            productId: "prod-1",
            productName: "Amoxicillin",
            frequency: "BID",
            instructions: "Take one capsule twice daily",
            refillNumber: 0,
            quantityDispensed: 10,
            isManualAdjustment: false,
            lotsUsed: [],
            pricing: {
              unitPrice: 1,
              total: 10,
              insurancePaid: 5,
              patientPayable: 5,
            },
          },
        ],
      };

      apiGet.mockResolvedValueOnce({ data: mockPayload });

      const res = await getDispenseLabels(dispenseId, patientId);

      expect(apiGet).toHaveBeenCalledTimes(1);
      expect(apiGet).toHaveBeenCalledWith(ENDPOINTS.dispenseLabel(dispenseId), {
        params: { patientId },
      });
      expect(res).toEqual(mockPayload);
    });

    it("rethrows errors from the API call", async () => {
      const err = new Error("Not Found");
      apiGet.mockRejectedValueOnce(err);

      await expect(getDispenseLabels("disp-err", "patient-err")).rejects.toThrow("Not Found");
    });

    it("handles minimal payloads (no optional fields)", async () => {
      const minimal: LabelPrescriptionDetails = {
        dispenseId: "disp-min",
        prescriptionId: "rx-min",
        patientId: "patient-min",
        patientName: "Minimal",
        dispenseDate: "2026-03-11T15:36:46.220Z",
        status: "PaymentProcessed",
        pharmacistId: "pharm-min",
        items: [
          {
            prescriptionLineId: "line-1",
            productId: "p-1",
            productName: "Drug",
            frequency: "OD",
            instructions: "Take once daily",
            refillNumber: 0,
            quantityDispensed: 1,
            isManualAdjustment: false,
            lotsUsed: [],
            pricing: {
              unitPrice: 1,
              total: 1,
              insurancePaid: 0,
              patientPayable: 1,
            },
          },
        ],
      };
      apiGet.mockResolvedValueOnce({ data: minimal });

      const res = await getDispenseLabels("disp-min", "patient-min");

      expect(res).toEqual(minimal);
    });
  });
});
