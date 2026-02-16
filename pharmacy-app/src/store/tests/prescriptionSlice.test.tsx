import { describe, it, expect, afterEach, vi } from "vitest";
import { configureStore, type AnyAction } from "@reduxjs/toolkit";
import type {
  CreatePrescriptionRequest,
  PrescriptionDetailsDto,
} from "@prescription/types/prescription.types";
import type { PrescriptionHistoryQueryParams } from "@api/prescription";

// ---- Mock APIs first (before importing SUT) ----
const createPrescriptionApiMock = vi.fn();
const getPrescriptionDetailsMock = vi.fn();
const searchPrescriptionsMock = vi.fn();
const getAllPrescriptionsMock = vi.fn();
const getPrescriptionsByPatientMock = vi.fn();
const cancelPrescriptionApiMock = vi.fn();

vi.mock("@api/prescription", () => ({
  createPrescription: (...args: unknown[]) => createPrescriptionApiMock(...args),
  getPrescriptionDetails: (...args: unknown[]) => getPrescriptionDetailsMock(...args),
  searchPrescriptions: (...args: unknown[]) => searchPrescriptionsMock(...args),
  getAllPrescriptions: (...args: unknown[]) => getAllPrescriptionsMock(...args),
  getPrescriptionsByPatient: (...args: unknown[]) =>
    getPrescriptionsByPatientMock(...args),
  cancelPrescription: (...args: unknown[]) => cancelPrescriptionApiMock(...args),
}));

// ---- Import SUT (after mocks) ----
import reducer, {
  createPrescription,
  fetchPrescriptionDetails,
  cancelPrescription,
  fetchAllPrescriptions,
  searchPrescriptionsThunk,
  fetchPrescriptionsByPatient,
  clearPrescriptions,
  clearSelected,
} from "../prescription/prescriptionSlice";

// ---- Helper to create a real store ----
function makeStore() {
  return configureStore({
    reducer: {
      prescriptions: reducer,
    },
  });
}

const baseCreateRequest: CreatePrescriptionRequest = {
  patientId: "p-1",
  patientName: "Patient One",
  prescriber: { id: "dr-1", name: "Dr. One" },
  medicines: [
    {
      productId: "med-1",
      name: "Amoxicillin",
      strength: "250mg",
      prescribedQuantity: 10,
      totalRefillsAuthorized: 0,
      frequency: "once",
      daysSupply: 5,
      instruction: "Take with water",
    },
  ],
};

const baseDetails: PrescriptionDetailsDto = {
  id: "rx-1",
  patientId: "p-1",
  patientName: "Patient One",
  prescriber: { id: "dr-1", name: "Dr. One" },
  createdAt: "2025-01-01T00:00:00.000Z",
  expiresAt: "2025-12-31T00:00:00.000Z",
  status: "Created",
  isRefillable: false,
  medicines: [],
};

describe("prescriptionsSlice (100% coverage, race-free)", () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  describe("initial & sync reducers", () => {
    it("initializes to expected state", () => {
      const store = makeStore();
      expect(store.getState().prescriptions).toEqual({
        items: [],
        continuationToken: null,
        pageNumber: 1,
        pageSize: 10,
        totalCount: 0,
        totalPages: 1,
        status: "idle",
      });
    });

    it("clearPrescriptions resets state to initial (including status/error)", () => {
      const store = makeStore();

      // Seed a custom state
      store.dispatch({
        type: fetchAllPrescriptions.fulfilled.type,
        payload: {
          items: [{ id: "x" }],
          pageNumber: 2,
          pageSize: 50,
          totalCount: 1,
          totalPages: 1,
        },
      });

      store.dispatch({
        type: fetchAllPrescriptions.rejected.type,
        payload: "Some err",
      });

      store.dispatch(clearPrescriptions());
      expect(store.getState().prescriptions).toEqual({
        items: [],
        continuationToken: null,
        pageNumber: 1,
        pageSize: 10,
        totalCount: 0,
        totalPages: 1,
        status: "idle",
        error: undefined,
      });
    });

    it("clearSelected sets selected to undefined without touching other fields", () => {
      const store = makeStore();

      store.dispatch({
        type: fetchPrescriptionDetails.fulfilled.type,
        payload: { id: "p-1", name: "Rx-1" },
      });
      expect(store.getState().prescriptions.selected).toEqual({ id: "p-1", name: "Rx-1" });

      store.dispatch(clearSelected());
      expect(store.getState().prescriptions.selected).toBeUndefined();
    });
  });

  describe("createPrescription thunk", () => {
    it("pending → status=loading, clears error (reduce pending directly to avoid race)", () => {
      const prev: ReturnType<typeof reducer> = {
        items: [],
        continuationToken: null,
        pageNumber: 1,
        pageSize: 10,
        totalCount: 0,
        totalPages: 1,
        status: "idle" as const,
        error: "Prev error",
      };
      const next = reducer(prev, { type: createPrescription.pending.type } as AnyAction);
      expect(next.status).toBe("loading");
      expect(next.error).toBeUndefined();
    });

    it("fulfilled → adds item to front and status=succeeded", async () => {
      const store = makeStore();
      const newRx = { id: "rx-101", label: "Amoxicillin" };

      // Set mock BEFORE dispatch
      createPrescriptionApiMock.mockResolvedValueOnce(newRx);

      const action = await store.dispatch(createPrescription(baseCreateRequest));
      expect(action.type).toBe(createPrescription.fulfilled.type);

      const s = store.getState().prescriptions;
      expect(s.status).toBe("succeeded");
      expect(s.items[0]).toEqual(newRx);
    });

    it("rejected → status=failed and error from error.response.data.message", async () => {
      const store = makeStore();

      const axiosLike = {
        response: { data: { message: "Validation failed" } },
      };
      createPrescriptionApiMock.mockRejectedValueOnce(axiosLike);

      const action = await store.dispatch(createPrescription(baseCreateRequest));
      expect(action.type).toBe(createPrescription.rejected.type);

      const s = store.getState().prescriptions;
      expect(s.status).toBe("failed");
      expect(s.error).toBe("Validation failed");
    });
  });

  describe("fetchPrescriptionDetails thunk", () => {
    it("fulfilled → sets selected and status=succeeded", async () => {
      const store = makeStore();
      const details = { ...baseDetails, id: "p-11" };
      getPrescriptionDetailsMock.mockResolvedValueOnce(details);

      const action = await store.dispatch(fetchPrescriptionDetails("p-11"));
      expect(action.type).toBe(fetchPrescriptionDetails.fulfilled.type);

      const s = store.getState().prescriptions;
      expect(s.status).toBe("succeeded");
      expect(s.selected).toEqual(details);
    });

    it("rejected → status=failed with fallback error.message", async () => {
      const store = makeStore();

      getPrescriptionDetailsMock.mockRejectedValueOnce(new Error("Not found"));

      const action = await store.dispatch(fetchPrescriptionDetails("404"));
      expect(action.type).toBe(fetchPrescriptionDetails.rejected.type);

      const s = store.getState().prescriptions;
      expect(s.status).toBe("failed");
      expect(s.error).toBe("Not found");
    });
  });

  describe("cancelPrescription thunk", () => {
    it("fulfilled → removes from items and clears selected if same id", async () => {
      const store = makeStore();

      // Seed items and selected
      store.dispatch({
        type: fetchAllPrescriptions.fulfilled.type,
        payload: {
          items: [{ id: "a" }, { id: "b" }, { id: "c" }],
          pageNumber: 1,
          pageSize: 10,
          totalCount: 3,
          totalPages: 1,
        },
      });
      store.dispatch({
        type: fetchPrescriptionDetails.fulfilled.type,
        payload: { id: "b", label: "to cancel" },
      });

      cancelPrescriptionApiMock.mockResolvedValueOnce(undefined);

      const action = await store.dispatch(
        cancelPrescription({ id: "b", reason: "patient request" })
      );
      expect(action.type).toBe(cancelPrescription.fulfilled.type);

      const s = store.getState().prescriptions;
      expect(s.items.map((x) => x.id)).toEqual(["a", "c"]);
      expect(s.selected).toBeUndefined();
    });

    it("rejected → thunk catch path covered, state unchanged (no rejected reducer)", async () => {
      const store = makeStore();

      // Seed items to verify they remain untouched
      store.dispatch({
        type: fetchAllPrescriptions.fulfilled.type,
        payload: {
          items: [{ id: "x1" }, { id: "x2" }],
          pageNumber: 1,
          pageSize: 10,
          totalCount: 2,
          totalPages: 1,
        },
      });

      const axiosLike = {
        response: { data: { message: "Cancel not allowed" } },
      };
      cancelPrescriptionApiMock.mockRejectedValueOnce(axiosLike);

      const action = await store.dispatch(cancelPrescription({ id: "x1" }));
      expect(action.type).toBe(cancelPrescription.rejected.type);
      expect(action.payload).toBe("Cancel not allowed");

      // State remains unchanged because there is no .rejected handler
      const s = store.getState().prescriptions;
      expect(s.items.map((x) => x.id)).toEqual(["x1", "x2"]);
    });
  });

  describe("fetchAllPrescriptions thunk", () => {
    it("fulfilled → populates list, resets continuationToken, sets paging and status", async () => {
      const store = makeStore();

      const payload = {
        items: [{ id: "p-1" }, { id: "p-2" }],
        pageNumber: 3,
        pageSize: 25,
        totalCount: 50,
        totalPages: 2,
      };
      getAllPrescriptionsMock.mockResolvedValueOnce(payload);

      const query: PrescriptionHistoryQueryParams = { patientName: "anything" };
      const action = await store.dispatch(fetchAllPrescriptions(query));
      expect(action.type).toBe(fetchAllPrescriptions.fulfilled.type);

      const s = store.getState().prescriptions;
      expect(s.items).toEqual(payload.items);
      expect(s.continuationToken).toBeNull();
      expect(s.pageNumber).toBe(3);
      expect(s.pageSize).toBe(25);
      expect(s.totalCount).toBe(50);
      expect(s.totalPages).toBe(2);
      expect(s.status).toBe("succeeded");
    });

    it("rejected → status=failed with error.response.data.message", async () => {
      const store = makeStore();
      const axiosLike = { response: { data: { message: "Server busy" } } };

      getAllPrescriptionsMock.mockRejectedValueOnce(axiosLike);

      const action = await store.dispatch(fetchAllPrescriptions());
      expect(action.type).toBe(fetchAllPrescriptions.rejected.type);

      const s = store.getState().prescriptions;
      expect(s.status).toBe("failed");
      expect(s.error).toBe("Server busy");
    });
  });

  describe("searchPrescriptionsThunk", () => {
    it("fulfilled (reset=true) → replaces items and updates counters", async () => {
      const store = makeStore();

      const server = {
        items: [{ id: "s1" }, { id: "s2" }],
        continuationToken: "ct-1",
      };
      searchPrescriptionsMock.mockResolvedValueOnce(server);

      const action = await store.dispatch(
        searchPrescriptionsThunk({
          searchTerm: "amox",
          pageSize: 10,
          continuationToken: null,
          reset: true,
        })
      );
      expect(action.type).toBe(searchPrescriptionsThunk.fulfilled.type);

      const s = store.getState().prescriptions;
      expect(s.items).toEqual(server.items);
      expect(s.continuationToken).toBe("ct-1");
      expect(s.pageNumber).toBe(1);
      expect(s.totalCount).toBe(2);
      expect(s.totalPages).toBe(1);
      expect(s.status).toBe("succeeded");
    });

    it("fulfilled (reset=false) → appends items and keeps counters consistent", async () => {
      const store = makeStore();

      // Seed initial search results
      store.dispatch({
        type: searchPrescriptionsThunk.fulfilled.type,
        payload: {
          items: [{ id: "a1" }],
          continuationToken: "ct-a",
          reset: true,
        },
      });

      const more = {
        items: [{ id: "a2" }, { id: "a3" }],
        continuationToken: "ct-b",
      };
      searchPrescriptionsMock.mockResolvedValueOnce(more);

      const action = await store.dispatch(
        searchPrescriptionsThunk({
          searchTerm: "amox",
          pageSize: 10,
          continuationToken: "ct-a",
          reset: false,
        })
      );
      expect(action.type).toBe(searchPrescriptionsThunk.fulfilled.type);

      const s = store.getState().prescriptions;
      expect(s.items.map((x) => x.id)).toEqual(["a1", "a2", "a3"]);
      expect(s.continuationToken).toBe("ct-b");
      expect(s.totalCount).toBe(3);
      expect(s.status).toBe("succeeded");
    });

    it("rejected → status=failed with fallback error.message", async () => {
      const store = makeStore();

      searchPrescriptionsMock.mockRejectedValueOnce(new Error("Search error"));

      const action = await store.dispatch(searchPrescriptionsThunk({ searchTerm: "x" }));
      expect(action.type).toBe(searchPrescriptionsThunk.rejected.type);

      const s = store.getState().prescriptions;
      expect(s.status).toBe("failed");
      expect(s.error).toBe("Search error");
    });
  });

  describe("fetchPrescriptionsByPatient thunk", () => {
    it("fulfilled (reset=true) → replaces items and sets counters", async () => {
      const store = makeStore();

      const server = {
        items: [{ id: "pbp-1" }],
        continuationToken: "ct-11",
      };
      getPrescriptionsByPatientMock.mockResolvedValueOnce(server);

      const action = await store.dispatch(
        fetchPrescriptionsByPatient({ patientId: "p-1", reset: true })
      );
      expect(action.type).toBe(fetchPrescriptionsByPatient.fulfilled.type);

      const s = store.getState().prescriptions;
      expect(s.items).toEqual(server.items);
      expect(s.continuationToken).toBe("ct-11");
      expect(s.totalCount).toBe(1);
      expect(s.pageNumber).toBe(1);
      expect(s.totalPages).toBe(1);
      expect(s.status).toBe("succeeded");
    });

    it("fulfilled (reset=false) → appends items", async () => {
      const store = makeStore();

      // Seed with one
      store.dispatch({
        type: fetchPrescriptionsByPatient.fulfilled.type,
        payload: { items: [{ id: "z1" }], continuationToken: "ct-z", reset: true },
      });

      const server = {
        items: [{ id: "z2" }, { id: "z3" }],
        continuationToken: "ct-z2",
      };
      getPrescriptionsByPatientMock.mockResolvedValueOnce(server);

      const action = await store.dispatch(
        fetchPrescriptionsByPatient({
          patientId: "p-1",
          continuationToken: "ct-z",
          reset: false,
        })
      );
      expect(action.type).toBe(fetchPrescriptionsByPatient.fulfilled.type);

      const s = store.getState().prescriptions;
      expect(s.items.map((x) => x.id)).toEqual(["z1", "z2", "z3"]);
      expect(s.continuationToken).toBe("ct-z2");
      expect(s.totalCount).toBe(3);
      expect(s.status).toBe("succeeded");
    });

    it("rejected → status=failed with error.response.data.message", async () => {
      const store = makeStore();

      const axiosLike = { response: { data: { message: "Patient not found" } } };
      getPrescriptionsByPatientMock.mockRejectedValueOnce(axiosLike);

      const action = await store.dispatch(
        fetchPrescriptionsByPatient({ patientId: "nope" })
      );
      expect(action.type).toBe(fetchPrescriptionsByPatient.rejected.type);

      const s = store.getState().prescriptions;
      expect(s.status).toBe("failed");
      expect(s.error).toBe("Patient not found");
    });
  });
});
