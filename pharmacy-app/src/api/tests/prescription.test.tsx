// src/api/tests/prescription.test.tsx
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// ---- Mocks (declare BEFORE importing the SUT) ----
vi.mock("../axiosInstance", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
  },
}));

vi.mock("../endpoints", () => ({
  ENDPOINTS: {
    prescriptions: "/api/prescriptions",
  },
}));

vi.mock("@utils/logger/logger", () => ({
  logger: {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

// ---- Import SUT after mocks ----
import api from "../axiosInstance";
import { ENDPOINTS } from "../endpoints";
import { logger } from "@utils/logger/logger";
import {
  createPrescription,
  getPrescriptionById,
  getPrescriptionDetails, // alias
  getPrescriptionsByPatient,
  searchPrescriptions,
  getAllPrescriptions,
  cancelPrescription,
  reviewPrescription,
  getPendingPrescriptions,
} from "../prescription";

// ✅ Type-only imports of your real DTOs
import type {
  CreatePrescriptionRequest,
  PrescriptionSummaryDto,
  PrescriptionDetailsDto,
  ReviewPrescriptionRequest,
} from "@prescription/types/prescription.types";

describe("prescription API", () => {
  const apiGet = api.get as unknown as ReturnType<typeof vi.fn>;
  const apiPost = api.post as unknown as ReturnType<typeof vi.fn>;
  const apiPut = api.put as unknown as ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ---------------- createPrescription ----------------
  describe("createPrescription", () => {
    it("POSTs the payload and returns details", async () => {
      const payload = {
        patientId: "p-1",
        patientName: "John Doe",
        prescriber: { id: "d-1", name: "Dr. Jane" },
        medicines: [
          {
            productId: "prod-1",
            name: "Amoxicillin",
            strength: "500 mg",
            prescribedQuantity: 10,
            totalRefillsAuthorized: 2,
            frequency: "BID",
            daysSupply: 5,
            instruction: "After food",
          },
        ],
      } satisfies CreatePrescriptionRequest;

      const details = {
        id: "rx-1",
        patientId: "p-1",
        patientName: "John Doe",
        prescriber: { id: "d-1", name: "Dr. Jane" },
        createdAt: "2026-02-10T10:00:00Z",
        expiresAt: "2026-03-10T10:00:00Z",
        status: "Created",
        isRefillable: false,
        medicines: [],
      } satisfies PrescriptionDetailsDto;

      apiPost.mockResolvedValueOnce({ data: details });

      const res = await createPrescription(payload);

      expect(apiPost).toHaveBeenCalledWith(ENDPOINTS.prescriptions, payload);
      expect(res).toEqual(details);
    });

    it("logs and rethrows on failure", async () => {
      const payload = {
        patientId: "p-1",
        patientName: "John Doe",
        prescriber: { id: "d-1", name: "Dr. Jane" },
        medicines: [],
      } satisfies CreatePrescriptionRequest;

      const err = new Error("Create failed");
      apiPost.mockRejectedValueOnce(err);

      await expect(createPrescription(payload)).rejects.toThrow("Create failed");
      expect(logger.error).toHaveBeenCalledWith("Create prescription failed", {
        payload,
        error: err,
      });
    });
  });

  // ---------------- getPrescriptionById / alias ----------------
  describe("getPrescriptionById / getPrescriptionDetails", () => {
    it("GETs by id and returns details", async () => {
      const id = "rx-123";
      const details = {
        id,
        patientId: "p-1",
        patientName: "John",
        prescriber: { id: "d-1", name: "Dr. A" },
        createdAt: "2026-02-10T10:00:00Z",
        expiresAt: "2026-03-10T10:00:00Z",
        status: "Created",
        isRefillable: true,
        medicines: [],
      } satisfies PrescriptionDetailsDto;

      apiGet.mockResolvedValueOnce({ data: details });

      const res = await getPrescriptionById(id);

      expect(apiGet).toHaveBeenCalledWith(`${ENDPOINTS.prescriptions}/${id}`);
      expect(res).toEqual(details);
    });

    it("alias behaves the same", async () => {
      const id = "rx-555";
      const details = {
        id,
        patientId: "p-9",
        patientName: "Jane",
        prescriber: { id: "d-2", name: "Dr. Smith" },
        createdAt: "2026-02-11T10:00:00Z",
        expiresAt: "2026-03-11T10:00:00Z",
        status: "Created",
        isRefillable: false,
        medicines: [],
      } satisfies PrescriptionDetailsDto;

      apiGet.mockResolvedValueOnce({ data: details });

      const res = await getPrescriptionDetails(id);

      expect(apiGet).toHaveBeenCalledWith(`${ENDPOINTS.prescriptions}/${id}`);
      expect(res).toEqual(details);
    });

    it("logs and rethrows on failure", async () => {
      const id = "rx-err";
      const err = new Error("Not Found");
      apiGet.mockRejectedValueOnce(err);

      await expect(getPrescriptionById(id)).rejects.toThrow("Not Found");
      expect(logger.error).toHaveBeenCalledWith(
        "Fetching prescription details failed",
        { prescriptionId: id, error: err }
      );
    });
  });

  // ---------------- getPrescriptionsByPatient ----------------
  describe("getPrescriptionsByPatient", () => {
    it("calls patient endpoint with pageSize only when no continuationToken", async () => {
      const patientId = "p-1";
      const payload = {
        data: {
          items: [
            {
              alerts: false,
              id: "rx-1",
              patientId: "p-1",
              patientName: "John",
              prescriberName: "Dr. A",
              createdAt: "2026-02-10",
              expiresAt: "2026-03-10",
              status: "Created",
              medicineCount: 1,
              validationSummary: {
                totalIssues: 0,
                highSeverityCount: 0,
                moderateCount: 0,
                lowCount: 0,
                requiresReview: false,
              },
            },
          ] satisfies PrescriptionSummaryDto[],
          continuationToken: "token-2",
        },
      };

      apiGet.mockResolvedValueOnce(payload);

      const res = await getPrescriptionsByPatient(patientId, 20);

      expect(apiGet).toHaveBeenCalledWith(
        `${ENDPOINTS.prescriptions}/patient/${patientId}`,
        { params: { pageSize: 20 } }
      );
      expect(res).toEqual({
        items: payload.data.items,
        continuationToken: "token-2",
      });
    });

    it("includes continuationToken when provided", async () => {
      const patientId = "p-1";
      apiGet.mockResolvedValueOnce({
        data: { items: [], continuationToken: null },
      });

      const res = await getPrescriptionsByPatient(patientId, 10, "ct-9");

      expect(apiGet).toHaveBeenCalledWith(
        `${ENDPOINTS.prescriptions}/patient/${patientId}`,
        { params: { pageSize: 10, continuationToken: "ct-9" } }
      );
      expect(res).toEqual({ items: [], continuationToken: null });
    });

    it("defaults missing items/continuationToken", async () => {
      apiGet.mockResolvedValueOnce({ data: {} });

      const res = await getPrescriptionsByPatient("p-1", 10);

      expect(res).toEqual({ items: [], continuationToken: null });
    });

    it("logs and rethrows on failure", async () => {
      const err = new Error("Network");
      apiGet.mockRejectedValueOnce(err);

      await expect(getPrescriptionsByPatient("p-1", 10)).rejects.toThrow(
        "Network"
      );
      expect(logger.error).toHaveBeenCalledWith(
        "Fetching prescriptions by patient failed",
        { patientId: "p-1", error: err }
      );
    });
  });

  // ---------------- searchPrescriptions ----------------
  describe("searchPrescriptions", () => {
    it("GETs search endpoint with searchTerm, pageSize (no token)", async () => {
      apiGet.mockResolvedValueOnce({
        data: {
          items: [
            {
              alerts: true,
              id: "rx-9",
              patientId: "p-7",
              patientName: "Jenny",
              prescriberName: "Dr. Z",
              createdAt: "2026-02-09",
              expiresAt: "2026-03-09",
              status: "Created",
              medicineCount: 2,
              validationSummary: {
                totalIssues: 1,
                highSeverityCount: 0,
                moderateCount: 1,
                lowCount: 0,
                requiresReview: true,
              },
            },
          ] satisfies PrescriptionSummaryDto[],
          continuationToken: "token-abc",
        },
      });

      const res = await searchPrescriptions("jenny", 15);

      expect(apiGet).toHaveBeenCalledWith(
        `${ENDPOINTS.prescriptions}/search`,
        { params: { searchTerm: "jenny", pageSize: 15 } }
      );
      expect(res.items).toHaveLength(1);
      expect(res.continuationToken).toBe("token-abc");
    });

    it("includes continuationToken when provided", async () => {
      apiGet.mockResolvedValueOnce({
        data: { items: [], continuationToken: null },
      });

      await searchPrescriptions("x", 5, "ct-1");

      expect(apiGet).toHaveBeenCalledWith(
        `${ENDPOINTS.prescriptions}/search`,
        { params: { searchTerm: "x", pageSize: 5, continuationToken: "ct-1" } }
      );
    });

    it("logs and rethrows on failure", async () => {
      const err = new Error("Search failed");
      apiGet.mockRejectedValueOnce(err);

      await expect(searchPrescriptions("x")).rejects.toThrow("Search failed");
      expect(logger.error).toHaveBeenCalledWith(
        "Searching prescriptions failed",
        { searchTerm: "x", error: err }
      );
    });
  });

  // ---------------- getAllPrescriptions ----------------
  describe("getAllPrescriptions", () => {
    it("builds params correctly (trims, omits status 'All', keeps sort)", async () => {
      const responseData = {
        items: [
          {
            alerts: false,
            id: "rx-1",
            patientId: "p-1",
            patientName: "John",
            prescriberName: "Dr. A",
            createdAt: "2026-02-10",
            expiresAt: "2026-03-10",
            status: "Created",
            medicineCount: 1,
            validationSummary: {
              totalIssues: 0,
              highSeverityCount: 0,
              moderateCount: 0,
              lowCount: 0,
              requiresReview: false,
            },
          },
        ] satisfies PrescriptionSummaryDto[],
        totalCount: 100,
        totalPages: 10,
        pageNumber: 2,
        pageSize: 10,
        hasNextPage: true,
        hasPreviousPage: true,
      };
      apiGet.mockResolvedValueOnce({ data: responseData });

      const res = await getAllPrescriptions({
        prescriptionId: "  RX-1  ",
        patientName: "  John  ",
        prescriberName: "  Dr. A ",
        createdAt: " 2026-02-10 ",
        status: "All", // omitted
        pageSize: 10,
        pageNumber: 2,
        sortBy: " createdAt ",
        sortDirection: "desc",
      });

      expect(apiGet).toHaveBeenCalledWith(ENDPOINTS.prescriptions, {
        params: {
          prescriptionId: "RX-1",
          patientName: "John",
          prescriberName: "Dr. A",
          createdAt: "2026-02-10",
          pageNumber: 2,
          pageSize: 10,
          sortBy: "createdAt",
          sortDirection: "desc",
        },
      });

      expect(res).toEqual({
        items: responseData.items,
        pageNumber: 2,
        pageSize: 10,
        totalCount: 100,
        totalPages: 10,
        hasNextPage: true,
        hasPreviousPage: true,
      });
    });

    it("parses array-only responses and derives counts/pages", async () => {
      const arrayResponse = [
        {
          alerts: false,
          id: "rx-1",
          patientId: "p-1",
          patientName: "John",
          prescriberName: "Dr. A",
          createdAt: "2026-02-10",
          expiresAt: "2026-03-10",
          status: "Created",
          medicineCount: 1,
          validationSummary: {
            totalIssues: 0,
            highSeverityCount: 0,
            moderateCount: 0,
            lowCount: 0,
            requiresReview: false,
          },
        },
        {
          alerts: false,
          id: "rx-2",
          patientId: "p-2",
          patientName: "Jane",
          prescriberName: "Dr. B",
          createdAt: "2026-02-11",
          expiresAt: "2026-03-11",
          status: "Created",
          medicineCount: 2,
          validationSummary: {
            totalIssues: 0,
            highSeverityCount: 0,
            moderateCount: 0,
            lowCount: 0,
            requiresReview: false,
          },
        },
        {
          alerts: true,
          id: "rx-3",
          patientId: "p-3",
          patientName: "Jim",
          prescriberName: "Dr. C",
          createdAt: "2026-02-12",
          expiresAt: "2026-03-12",
          status: "Created",
          medicineCount: 3,
          validationSummary: {
            totalIssues: 1,
            highSeverityCount: 1,
            moderateCount: 0,
            lowCount: 0,
            requiresReview: true,
          },
        },
      ] satisfies PrescriptionSummaryDto[];

      apiGet.mockResolvedValueOnce({ data: arrayResponse });

      const res = await getAllPrescriptions({
        pageNumber: 2,
        pageSize: 2,
      });

      expect(res).toEqual({
        items: arrayResponse,
        pageNumber: 2,
        pageSize: 2,
        totalCount: 3,
        totalPages: 2,
        hasNextPage: false,
        hasPreviousPage: true,
      });
    });

    it("logs and rethrows on failure", async () => {
      const err = new Error("History error");
      apiGet.mockRejectedValueOnce(err);

      await expect(getAllPrescriptions({})).rejects.toThrow("History error");
      expect(logger.error).toHaveBeenCalledWith(
        "Fetching all prescriptions failed",
        { query: {}, error: err }
      );
    });
  });

  // ---------------- cancelPrescription ----------------
  describe("cancelPrescription", () => {
    it("POSTs cancel without body when reason is not provided", async () => {
      const id = "rx-1";
      apiPost.mockResolvedValueOnce({});

      await cancelPrescription(id);

      expect(apiPost).toHaveBeenCalledWith(
        `${ENDPOINTS.prescriptions}/${id}/cancel`,
        undefined
      );
    });

    it("POSTs cancel with reason when provided", async () => {
      const id = "rx-2";
      apiPost.mockResolvedValueOnce({});

      await cancelPrescription(id, "Duplicate");

      expect(apiPost).toHaveBeenCalledWith(
        `${ENDPOINTS.prescriptions}/${id}/cancel`,
        { reason: "Duplicate" }
      );
    });

    it("logs and rethrows on failure", async () => {
      const id = "rx-err";
      const err = new Error("Cancel failed");
      apiPost.mockRejectedValueOnce(err);

      await expect(cancelPrescription(id)).rejects.toThrow("Cancel failed");
      expect(logger.error).toHaveBeenCalledWith(
        "Cancel prescription failed",
        { prescriptionId: id, error: err }
      );
    });
  });

  // ---------------- reviewPrescription ----------------
  describe("reviewPrescription", () => {
    it("PUTs review with payload and logs info on success", async () => {
      const id = "rx-1";
      const payload = {
        medicines: [
          { prescriptionMedicineId: "pm-1", decision: "Accepted", overrideReason: null },
          { prescriptionMedicineId: "pm-2", decision: "Rejected", overrideReason: "Dose too high" },
        ],
      } satisfies ReviewPrescriptionRequest;

      apiPut.mockResolvedValueOnce({});

      await reviewPrescription(id, payload);

      expect(apiPut).toHaveBeenCalledWith(
        `${ENDPOINTS.prescriptions}/${id}/review`,
        payload
      );
      expect(logger.info).toHaveBeenCalledWith(
        "Prescription reviewed successfully",
        { prescriptionId: id }
      );
    });

    it("logs and rethrows on failure", async () => {
      const id = "rx-err";
      const payload = {
        medicines: [{ prescriptionMedicineId: "pm-x", decision: "Rejected" }],
      } satisfies ReviewPrescriptionRequest;

      const err = new Error("Review failed");
      apiPut.mockRejectedValueOnce(err);

      await expect(reviewPrescription(id, payload)).rejects.toThrow(
        "Review failed"
      );
      expect(logger.error).toHaveBeenCalledWith(
        "Review prescription failed",
        { prescriptionId: id, payload, error: err }
      );
    });
  });

  // ---------------- getPendingPrescriptions ----------------
  describe("getPendingPrescriptions", () => {
    it("delegates to getAllPrescriptions (via api.get) and returns items", async () => {
      const items = [
        {
          alerts: false,
          id: "rx-1",
          patientId: "p-1",
          patientName: "John",
          prescriberName: "Dr. A",
          createdAt: "2026-02-10",
          expiresAt: "2026-03-10",
          status: "Created",
          medicineCount: 1,
          validationSummary: {
            totalIssues: 0,
            highSeverityCount: 0,
            moderateCount: 0,
            lowCount: 0,
            requiresReview: false,
          },
        },
      ] satisfies PrescriptionSummaryDto[];

      // Mock the underlying api.get used by getAllPrescriptions
      apiGet.mockResolvedValueOnce({
        data: {
          items,
          pageNumber: 1,
          pageSize: 20,
          totalCount: 1,
          totalPages: 1,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      });

      const res = await getPendingPrescriptions();

      // Ensure the right params were sent by getAllPrescriptions
      expect(apiGet).toHaveBeenCalledWith(ENDPOINTS.prescriptions, {
        params: { status: "Created", pageSize: 20, pageNumber: 1 },
      });

      expect(res).toEqual(items);
    });

    it("logs and rethrows when getAllPrescriptions (api.get) fails", async () => {
      const err = new Error("Pending failed");
      apiGet.mockRejectedValueOnce(err);

      await expect(getPendingPrescriptions()).rejects.toThrow("Pending failed");
      expect(logger.error).toHaveBeenCalledWith(
        "Get pending prescriptions failed",
        { error: err }
      );
    });
  });
});