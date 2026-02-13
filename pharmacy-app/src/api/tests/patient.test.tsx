import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import {
  searchPatients,
  getPatientDetails,
  createPatient,
  updatePatient,
} from "../patient";

// ---- Mocks ----
vi.mock("../axiosInstance", () => {
  return {
    default: {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
    },
  };
});

vi.mock("../endpoints", () => {
  return {
    ENDPOINTS: {
      patientSearch: "/api/patients/search",
      patients: "/api/patients",
      patientDetails: "/api/patients/details",
    },
  };
});

// Import mocked instances after vi.mock
import api from "../axiosInstance";
import { ENDPOINTS } from "../endpoints";

// ----- Real DTO shapes based on user's types -----
interface Patient {
  id: string;
  fullName: string;
  dob: string; // ISO
  gender: string;
  phone: string;
  email?: string;
  address?: string;
  allergies?: string[];
  insurance?: { provider: string; memberId: string };
}

type UpdatePatientRequest = Partial<Omit<Patient, "id">>;

interface PatientSummaryDto {
  id: string;
  fullName: string;
  phone: string;
}

interface InsuranceDto {
  provider: string;
  memberId: string;
}

interface CreatePatientRequest {
  fullName: string;
  dob: string;
  gender: string;
  phone: string;
  email?: string;
  address?: string;
  allergies?: string[];
  insurance?: InsuranceDto;
}

type PatientDetailsDto = Patient;

describe("patient API", () => {
  const apiGet = api.get as unknown as ReturnType<typeof vi.fn>;
  const apiPost = api.post as unknown as ReturnType<typeof vi.fn>;
  const apiPut = api.put as unknown as ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ---------------- searchPatients ----------------
  describe("searchPatients", () => {
    it("returns [] when query is empty and returnAllOnEmpty=false (default)", async () => {
      const res = await searchPatients("");
      expect(res).toEqual([]);
      expect(apiGet).not.toHaveBeenCalled();
    });

    it("returns all patients when query is empty and returnAllOnEmpty=true", async () => {
      const mockData: PatientSummaryDto[] = [
        { id: "p1", fullName: "John Doe", phone: "111" },
        { id: "p2", fullName: "Jane Doe", phone: "222" },
      ];
      apiGet.mockResolvedValueOnce({ data: mockData });

      const controller = new AbortController();
      const result = await searchPatients("", {
        returnAllOnEmpty: true,
        signal: controller.signal,
      });

      expect(apiGet).toHaveBeenCalledTimes(1);
      expect(apiGet).toHaveBeenCalledWith(ENDPOINTS.patientSearch, {
        signal: controller.signal,
      });
      expect(result).toEqual(mockData);
    });

    it("returns [] when query length is below minChars", async () => {
      const result = await searchPatients("a", { minChars: 2 });
      expect(result).toEqual([]);
      expect(apiGet).not.toHaveBeenCalled();
    });

    it("calls patientSearch with query param when q >= minChars", async () => {
      const mockData: PatientSummaryDto[] = [
        { id: "p1", fullName: "John", phone: "999" },
      ];
      apiGet.mockResolvedValueOnce({ data: mockData });

      const controller = new AbortController();
      const result = await searchPatients("jo", {
        minChars: 2,
        signal: controller.signal,
      });

      expect(apiGet).toHaveBeenCalledWith(ENDPOINTS.patientSearch, {
        params: { query: "jo" },
        signal: controller.signal,
      });
      expect(result).toEqual(mockData);
    });

    it("trims the input before using it", async () => {
      const mockData: PatientSummaryDto[] = [{ id: "p1", fullName: "John", phone: "123" }];
      apiGet.mockResolvedValueOnce({ data: mockData });

      await searchPatients("  john  ");

      expect(apiGet).toHaveBeenCalledWith(ENDPOINTS.patientSearch, {
        params: { query: "john" },
        signal: undefined,
      });
    });

    it("rethrows cancellation errors (CanceledError)", async () => {
      const err = { name: "CanceledError" };
      apiGet.mockRejectedValueOnce(err);

      await expect(searchPatients("john", { minChars: 1 })).rejects.toEqual(err);
    });

    it("rethrows cancellation errors (ERR_CANCELED)", async () => {
      const err = { code: "ERR_CANCELED" };
      apiGet.mockRejectedValueOnce(err);

      await expect(searchPatients("john", { minChars: 1 })).rejects.toEqual(err);
    });

    it("rethrows cancellation errors (AbortError)", async () => {
      const err = { name: "AbortError" };
      apiGet.mockRejectedValueOnce(err);

      await expect(searchPatients("john", { minChars: 1 })).rejects.toEqual(err);
    });

    it("rethrows non-cancellation errors after logging", async () => {
      const err = new Error("Search failed");
      const spy = vi.spyOn(console, "error").mockImplementation(() => {});

      apiGet.mockRejectedValueOnce(err);

      await expect(searchPatients("john", { minChars: 1 })).rejects.toThrow("Search failed");
      expect(spy).toHaveBeenCalledWith("Failed to search patients:", err);

      spy.mockRestore();
    });
  });

  // ---------------- getPatientDetails ----------------
  describe("getPatientDetails", () => {
    it("calls GET /patients/{id} and returns PatientDetailsDto", async () => {
      const id = "p-123";
      const mockDetails: PatientDetailsDto = {
        id,
        fullName: "John Doe",
        dob: "1990-01-01",
        gender: "male",
        phone: "1234567890",
        email: "john@example.com",
        address: "123 Street",
        allergies: ["Peanuts"],
        insurance: { provider: "ABC", memberId: "MEM-1" },
      };

      const controller = new AbortController();

      apiGet.mockResolvedValueOnce({ data: mockDetails });

      const res = await getPatientDetails(id, { signal: controller.signal });

      expect(apiGet).toHaveBeenCalledWith(`${ENDPOINTS.patients}/${id}`, {
        signal: controller.signal,
      });
      expect(res).toEqual(mockDetails);
    });
  });

  // ---------------- createPatient ----------------
  describe("createPatient", () => {
    it("posts to /patients with request body and returns { patientId }", async () => {
      const req: CreatePatientRequest = {
        fullName: "New Patient",
        dob: "2000-02-02",
        gender: "female",
        phone: "9999999999",
        email: "new@x.com",
        address: "Somewhere",
        allergies: ["pollen"],
        insurance: { provider: "XYZ", memberId: "MEM-9" },
      };
      const controller = new AbortController();
      const apiResponse = { data: { patientId: "new-id-001" } };

      apiPost.mockResolvedValueOnce(apiResponse);

      const res = await createPatient(req, { signal: controller.signal });

      expect(apiPost).toHaveBeenCalledWith(ENDPOINTS.patients, req, {
        signal: controller.signal,
      });
      expect(res).toEqual({ patientId: "new-id-001" });
    });
  });

  // ---------------- updatePatient ----------------
  describe("updatePatient", () => {
    it("puts to /patientDetails/{id} and returns response data", async () => {
      const id = "p-777";
      const req: UpdatePatientRequest = {
        phone: "7777777777",
        fullName: "Edited Name",
        address: "New Addr",
      };
      const apiResponse = {
        data: {
          success: true,
          updatedId: id,
        },
      };

      apiPut.mockResolvedValueOnce(apiResponse);

      const res = await updatePatient(id, req);

      expect(apiPut).toHaveBeenCalledWith(`${ENDPOINTS.patientDetails}/${id}`, req);
      expect(res).toEqual(apiResponse.data);
    });

    it("logs error and rethrows on failure", async () => {
      const id = "p-err";
      const req: UpdatePatientRequest = { address: "Nope" };
      const err = new Error("Update failed");
      const spy = vi.spyOn(console, "error").mockImplementation(() => {});

      apiPut.mockRejectedValueOnce(err);

      await expect(updatePatient(id, req)).rejects.toThrow("Update failed");
      expect(spy).toHaveBeenCalledWith(`Failed to update patient ${id}:`, err);

      spy.mockRestore();
    });
  });
});