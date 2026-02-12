// src/api/tests/patient.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// ---- Mocks (declare BEFORE importing the SUT) ----
vi.mock("../axiosInstance", () => ({
  default: {
    get: vi.fn(),
  },
}));

vi.mock("../endpoints", () => ({
  ENDPOINTS: {
    patientSearch: "/api/patients/search",
    patientDetails: "/api/patients/details",
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
import { searchPatients, getPatientById } from "../patientSearch";

// ✅ Type-only imports for your real models (adjust alias if needed)
import type { PatientSummary, PatientDetails } from "@prescription/models";

describe("patient API", () => {
  const apiGet = api.get as unknown as ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ---------------- searchPatients ----------------
  describe("searchPatients", () => {
    it("calls patientSearch with query param and returns data on success", async () => {
      const query = "john";
      const mockData = [
        { id: "p1", fullName: "John Doe", phone: "111" },
        { id: "p2", fullName: "Johnny Bravo", phone: "222" },
      ] satisfies PatientSummary[];

      apiGet.mockResolvedValueOnce({ data: mockData });

      const res = await searchPatients(query);

      expect(apiGet).toHaveBeenCalledTimes(1);
      expect(apiGet).toHaveBeenCalledWith(ENDPOINTS.patientSearch, {
        params: { query },
      });
      expect(res).toEqual(mockData);
    });

    it("logs error and returns undefined when API call fails", async () => {
      const query = "error-case";
      const err = new Error("Network down");

      apiGet.mockRejectedValueOnce(err);

      const res = await searchPatients(query);

      expect(res).toBeUndefined();
      expect(logger.error).toHaveBeenCalledTimes(1);
      expect(logger.error).toHaveBeenCalledWith("Patient search failed", {
        query,
        error: err,
      });
    });
  });

  // ---------------- getPatientById ----------------
  describe("getPatientById", () => {
    it("calls patientDetails/{id} and returns PatientDetails on success", async () => {
      const patientId = "p-123";
      const mockDetails = {
        id: patientId,
        fullName: "Jane Doe",
        dob: "1995-06-15",
        gender: "Female",
        phone: "9999999999",
        email: "jane@example.com",
        address: "123 Street",
        allergies: ["Peanuts"],
      } satisfies PatientDetails;

      apiGet.mockResolvedValueOnce({ data: mockDetails });

      const res = await getPatientById(patientId);

      expect(apiGet).toHaveBeenCalledTimes(1);
      expect(apiGet).toHaveBeenCalledWith(
        `${ENDPOINTS.patientDetails}/${patientId}`
      );
      expect(res).toEqual(mockDetails);
    });

    it("logs error and returns undefined when fetch fails", async () => {
      const patientId = "p-err";
      const err = new Error("Not Found");

      apiGet.mockRejectedValueOnce(err);

      const res = await getPatientById(patientId);

      expect(res).toBeUndefined();
      expect(logger.error).toHaveBeenCalledTimes(1);
      expect(logger.error).toHaveBeenCalledWith(
        "Fetching patient details failed",
        {
          patientId,
          error: err,
        }
      );
    });
  });
});