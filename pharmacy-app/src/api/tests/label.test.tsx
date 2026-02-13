import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// SUT
import {
  getLabelQueue,
  getPrescriptionForLabels,
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
      labelQueue: "/api/labels/queue",
      prescriptionLabels: (id: string) => `/api/labels/prescriptions/${id}`,
    },
  };
});

// Import mocked instances/types after vi.mock
import api from "../axiosInstance";
import { ENDPOINTS } from "../endpoints";

// Types used in return values (optional for clarity in test data)
type LabelQueuePrescription = {
  prescriptionId: string;
  patientName: string;
  createdAt: string;
};
type LabelPrescriptionDetails = {
  prescriptionId: string;
  patientName: string;
  items: Array<{
    productId: string;
    name: string;
    strength?: string;
    quantity: number;
    directions?: string;
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
    it("calls labelQueue endpoint with default pageSize (20) and no continuationToken", async () => {
      const mockResponse = {
        data: {
          items: [] as LabelQueuePrescription[],
          continuationToken: undefined as string | undefined,
        },
      };
      apiGet.mockResolvedValueOnce(mockResponse);

      const result = await getLabelQueue(); // uses defaults

      expect(apiGet).toHaveBeenCalledTimes(1);
      expect(apiGet).toHaveBeenCalledWith(ENDPOINTS.labelQueue, {
        params: {
          pageSize: 20,
          continuationToken: undefined,
        },
      });
      expect(result).toEqual(mockResponse.data);
    });

    it("passes provided pageSize and continuationToken via query params", async () => {
      const mockResponse = {
        data: {
          items: [
            {
              prescriptionId: "rx-1",
              patientName: "John Doe",
              createdAt: "2026-02-10T09:00:00.000Z",
            },
          ] satisfies LabelQueuePrescription[],
          continuationToken: "next-123",
        },
      };
      apiGet.mockResolvedValueOnce(mockResponse);

      const res = await getLabelQueue(50, "ct-abc");

      expect(apiGet).toHaveBeenCalledWith(ENDPOINTS.labelQueue, {
        params: { pageSize: 50, continuationToken: "ct-abc" },
      });
      expect(res).toEqual({
        items: [
          {
            prescriptionId: "rx-1",
            patientName: "John Doe",
            createdAt: "2026-02-10T09:00:00.000Z",
          },
        ],
        continuationToken: "next-123",
      });
    });

    it("rethrows errors from the API call", async () => {
      const err = new Error("Queue fetch failed");
      apiGet.mockRejectedValueOnce(err);

      await expect(getLabelQueue(10)).rejects.toThrow("Queue fetch failed");
    });

    it("works when API omits continuationToken", async () => {
      const mockResponse = {
        data: {
          items: [
            {
              prescriptionId: "rx-2",
              patientName: "Jane Doe",
              createdAt: "2026-02-10T10:00:00.000Z",
            },
          ] as LabelQueuePrescription[],
          // continuationToken intentionally missing
        },
      };
      apiGet.mockResolvedValueOnce(mockResponse);

      const res = await getLabelQueue(10);

      expect(res).toEqual({
        items: [
          {
            prescriptionId: "rx-2",
            patientName: "Jane Doe",
            createdAt: "2026-02-10T10:00:00.000Z",
          },
        ],
        // no continuationToken key asserted here since function returns response.data as-is
      });
    });
  });

  describe("getPrescriptionForLabels", () => {
    it("calls prescriptionLabels endpoint with given prescriptionId and returns data", async () => {
      const rxId = "rx-123";
      const mockPayload: LabelPrescriptionDetails = {
        prescriptionId: rxId,
        patientName: "John Doe",
        items: [
          {
            productId: "prod-1",
            name: "Amoxicillin",
            strength: "500 mg",
            quantity: 10,
            directions: "Take one capsule twice daily",
          },
        ],
      };

      apiGet.mockResolvedValueOnce({ data: mockPayload });

      const res = await getPrescriptionForLabels(rxId);

      expect(apiGet).toHaveBeenCalledTimes(1);
      expect(apiGet).toHaveBeenCalledWith(
        ENDPOINTS.prescriptionLabels(rxId)
      );
      expect(res).toEqual(mockPayload);
    });

    it("rethrows errors from the API call", async () => {
      const rxId = "rx-err";
      const err = new Error("Not Found");
      apiGet.mockRejectedValueOnce(err);

      await expect(getPrescriptionForLabels(rxId)).rejects.toThrow("Not Found");
    });

    it("handles minimal payloads (no optional fields)", async () => {
      const rxId = "rx-min";
      const minimal: LabelPrescriptionDetails = {
        prescriptionId: rxId,
        patientName: "Minimal",
        items: [
          {
            productId: "p-1",
            name: "Drug",
            quantity: 1,
            // no strength/directions
          },
        ],
      };
      apiGet.mockResolvedValueOnce({ data: minimal });

      const res = await getPrescriptionForLabels(rxId);

      expect(res).toEqual(minimal);
    });
  });
});