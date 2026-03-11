import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  createPatient,
  getPatientById,
  getPatientDetails,
  searchPatients,
  updatePatient,
} from "../patient";

vi.mock("../axiosInstance", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
  },
}));

vi.mock("../endpoints", () => ({
  ENDPOINTS: {
    patientSearch: "/api/patients/search",
    patients: "/api/patients",
  },
}));

import api from "../axiosInstance";
import { ENDPOINTS } from "../endpoints";

describe("patient API", () => {
  const apiGet = vi.mocked(api.get);
  const apiPost = vi.mocked(api.post);
  const apiPut = vi.mocked(api.put);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("searchPatients", () => {
    it("returns an empty array when the query is empty", async () => {
      await expect(searchPatients("")).resolves.toEqual([]);
      expect(apiGet).not.toHaveBeenCalled();
    });

    it("loads all results when returnAllOnEmpty is enabled", async () => {
      apiGet.mockResolvedValueOnce({
        data: [{ id: "p-1", fullName: "John Doe", phone: "+1" }],
      } as never);

      await expect(
        searchPatients("", { returnAllOnEmpty: true }),
      ).resolves.toEqual([{ id: "p-1", fullName: "John Doe", phone: "+1" }]);

      expect(apiGet).toHaveBeenCalledWith(ENDPOINTS.patientSearch, {
        signal: undefined,
      });
    });

    it("trims the query before requesting the API", async () => {
      apiGet.mockResolvedValueOnce({ data: [] } as never);

      await searchPatients("  jane  ", { minChars: 2 });

      expect(apiGet).toHaveBeenCalledWith(ENDPOINTS.patientSearch, {
        params: { query: "jane" },
        signal: undefined,
      });
    });

    it("returns an empty array when query length is below minChars", async () => {
      await expect(searchPatients("a", { minChars: 2 })).resolves.toEqual([]);
      expect(apiGet).not.toHaveBeenCalled();
    });

    it("rethrows cancellation errors without wrapping", async () => {
      const cancellation = { code: "ERR_CANCELED" };
      apiGet.mockRejectedValueOnce(cancellation);

      await expect(searchPatients("john", { minChars: 1 })).rejects.toBe(
        cancellation,
      );
    });

    it("logs and rethrows non-cancellation errors", async () => {
      const error = new Error("search failed");
      const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
      apiGet.mockRejectedValueOnce(error);

      await expect(searchPatients("john", { minChars: 1 })).rejects.toThrow(
        "search failed",
      );
      expect(consoleError).toHaveBeenCalledWith(
        "Failed to search patients:",
        error,
      );
    });
  });

  describe("getPatientDetails", () => {
    it("requests /api/patients/{id}", async () => {
      const patient = {
        id: "p-1",
        fullName: "John Doe",
        dob: "1990-01-01T00:00:00.000Z",
        gender: "Male",
        phone: "+14155550101",
        allergies: ["Peanuts"],
        insurance: { provider: "ABC", policyId: "POL-1" },
      };

      apiGet.mockResolvedValueOnce({ data: patient } as never);

      await expect(getPatientDetails("p-1")).resolves.toEqual(patient);
      expect(apiGet).toHaveBeenCalledWith(`${ENDPOINTS.patients}/p-1`, {
        signal: undefined,
      });
    });
  });

  describe("getPatientById", () => {
    it("returns undefined when detail lookup fails", async () => {
      const error = new Error("not found");
      const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
      apiGet.mockRejectedValueOnce(error);

      await expect(getPatientById("p-404")).resolves.toBeUndefined();
      expect(consoleError).toHaveBeenCalledWith(
        "Fetching patient details failed:",
        error,
      );
    });
  });

  describe("createPatient", () => {
    it("posts the new insurance DTO shape", async () => {
      const request = {
        fullName: "John Doe",
        dob: "2026-03-11T12:18:08.797Z",
        gender: "Male",
        phone: "+14155550101",
        email: "john@example.com",
        address: "123 Main St",
        allergies: ["Peanuts"],
        insurance: {
          provider: "ABC Health",
          policyId: "POL-123",
        },
      };

      apiPost.mockResolvedValueOnce({ data: { patientId: "p-1" } } as never);

      await expect(createPatient(request)).resolves.toEqual({ patientId: "p-1" });
      expect(apiPost).toHaveBeenCalledWith(ENDPOINTS.patients, request, {
        signal: undefined,
      });
    });

    it("wraps API errors using extractApiError", async () => {
      apiPost.mockRejectedValueOnce({
        response: { data: { detail: "Email already exists" } },
      });

      await expect(
        createPatient({
          fullName: "John Doe",
          dob: "2026-03-11T12:18:08.797Z",
          gender: "Male",
          phone: "+14155550101",
        }),
      ).rejects.toThrow("Email already exists");
    });
  });

  describe("updatePatient", () => {
    it("puts to /api/patients/{id} without a gender field", async () => {
      const request = {
        fullName: "Jane Doe",
        dob: "2026-03-11T12:18:40.836Z",
        phone: "+14155550199",
        email: "jane@example.com",
        address: "456 Main St",
        allergies: ["Dust"],
        insurance: {
          provider: "XYZ Health",
          policyId: "POL-999",
        },
      };

      apiPut.mockResolvedValueOnce({ data: { success: true } } as never);

      await expect(updatePatient("p-2", request)).resolves.toEqual({
        success: true,
      });
      expect(apiPut).toHaveBeenCalledWith(`${ENDPOINTS.patients}/p-2`, request, {
        signal: undefined,
      });
    });

    it("wraps update errors using extractApiError", async () => {
      apiPut.mockRejectedValueOnce({
        response: { data: { title: "Update rejected" } },
      });

      await expect(
        updatePatient("p-2", {
          fullName: "Jane Doe",
          dob: "2026-03-11T12:18:40.836Z",
          phone: "+14155550199",
        }),
      ).rejects.toThrow("Update rejected");
    });
  });
});
