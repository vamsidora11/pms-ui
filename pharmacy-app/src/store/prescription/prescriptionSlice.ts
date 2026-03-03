import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import {
  createPrescription as createPrescriptionApi,
  getPrescriptionDetails,
  searchPrescriptions,
  getAllPrescriptions,
  getPrescriptionsByPatient,
  cancelPrescription as cancelPrescriptionApi,
} from "@api/prescription";
import type {
  PrescriptionHistoryPageResult,
  PrescriptionHistoryQueryParams,
} from "@api/prescription";
import type {
  CreatePrescriptionRequest,
  PrescriptionDetailsDto,
  PrescriptionSummaryDto,
} from "@prescription/types/prescription.types";

/* ===================== THUNKS ===================== */

type PrescriptionListItem = PrescriptionSummaryDto | PrescriptionDetailsDto;

function getErrorMessage(error: unknown): string {
  if (typeof error === "string") return error;
  if (typeof error === "object" && error !== null) {
    const err = error as {
      response?: { data?: { message?: string } };
      message?: string;
    };
    return err.response?.data?.message || err.message || "Unknown error";
  }
  return "Unknown error";
}

export const createPrescription = createAsyncThunk<
  PrescriptionDetailsDto,
  CreatePrescriptionRequest,
  { rejectValue: string }
>(
  "prescriptions/create",
  async (prescriptionData, { rejectWithValue }) => {
    try {
      return await createPrescriptionApi(prescriptionData);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

export const fetchPrescriptionDetails = createAsyncThunk<
  PrescriptionDetailsDto,
  string,
  { rejectValue: string }
>(
  "prescriptions/details",
  async (id: string, { rejectWithValue }) => {
    try {
      return await getPrescriptionDetails(id);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

export const cancelPrescription = createAsyncThunk<
  string,
  { id: string; reason?: string },
  { rejectValue: string }
>(
  "prescriptions/cancel",
  async ({ id, reason }, { getState, rejectWithValue }) => {
    try {
      const rootState = getState() as { prescriptions: PrescriptionState };
      const currentSelected = rootState.prescriptions.selected;
      let etag =
        currentSelected?.id === id ? currentSelected.__etag : undefined;

      if (!etag) {
        const fresh = await getPrescriptionDetails(id);
        etag = fresh.__etag;
      }

      if (!etag) {
        throw new Error("Unable to cancel prescription: missing ETag");
      }

      await cancelPrescriptionApi(id, reason, etag);
      return id;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

export const fetchAllPrescriptions = createAsyncThunk<
  PrescriptionHistoryPageResult,
  PrescriptionHistoryQueryParams | undefined,
  { rejectValue: string }
>(
  "prescriptions/fetchAll",
  async (query, { rejectWithValue }) => {
    try {
      return await getAllPrescriptions(query ?? {});
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

export const searchPrescriptionsThunk = createAsyncThunk<
  { items: PrescriptionSummaryDto[]; continuationToken: string | null; reset: boolean },
  {
    searchTerm: string;
    pageSize?: number;
    continuationToken?: string | null;
    reset?: boolean;
  },
  { rejectValue: string }
>(
  "prescriptions/search",
  async (
    { searchTerm, pageSize, continuationToken, reset },
    { rejectWithValue }
  ) => {
    try {
      const resolvedPageSize = pageSize ?? 10;
      const resolvedContinuationToken = continuationToken ?? null;
      const resolvedReset = reset ?? true;
      const result = await searchPrescriptions(
        searchTerm,
        resolvedPageSize,
        resolvedContinuationToken
      );
      return {
        items: result.items || [],
        continuationToken: result.continuationToken || null,
        reset: resolvedReset,
      };
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

export const fetchPrescriptionsByPatient = createAsyncThunk<
  { items: PrescriptionSummaryDto[]; continuationToken: string | null; reset: boolean },
  {
    patientId: string;
    pageSize?: number;
    continuationToken?: string | null;
    reset?: boolean;
  },
  { rejectValue: string }
>(
  "prescriptions/byPatient",
  async (
    { patientId, pageSize, continuationToken, reset },
    { rejectWithValue }
  ) => {
    try {
      const resolvedPageSize = pageSize ?? 10;
      const resolvedContinuationToken = continuationToken ?? null;
      const resolvedReset = reset ?? true;
      const result = await getPrescriptionsByPatient(
        patientId,
        resolvedPageSize,
        resolvedContinuationToken
      );
      return {
        items: result.items || [],
        continuationToken: result.continuationToken || null,
        reset: resolvedReset,
      };
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

/* ===================== STATE ===================== */

interface PrescriptionState {
  items: PrescriptionListItem[];
  selected?: PrescriptionDetailsDto;
  continuationToken: string | null;
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  status: "idle" | "loading" | "succeeded" | "failed";
  error?: string;
}

const initialState: PrescriptionState = {
  items: [],
  continuationToken: null,
  pageNumber: 1,
  pageSize: 10,
  totalCount: 0,
  totalPages: 1,
  status: "idle",
};

/* ===================== SLICE ===================== */

const slice = createSlice({
  name: "prescriptions",
  initialState,
  reducers: {
    clearPrescriptions: (state) => {
      state.items = [];
      state.continuationToken = null;
      state.pageNumber = 1;
      state.pageSize = 10;
      state.totalCount = 0;
      state.totalPages = 1;
      state.status = "idle";
      state.error = undefined;
    },
    clearSelected: (state) => {
      state.selected = undefined;
    },
  },
  extraReducers: (b) => {
    b.addCase(createPrescription.pending, (s) => {
      s.status = "loading";
      s.error = undefined;
    })
      .addCase(createPrescription.fulfilled, (s, a) => {
        s.status = "succeeded";
        s.items.unshift(a.payload);
      })
      .addCase(createPrescription.rejected, (s, a) => {
        s.status = "failed";
        s.error = a.payload ?? a.error.message ?? "Unknown error";
      });

    b.addCase(fetchPrescriptionDetails.pending, (s) => {
      s.status = "loading";
      s.error = undefined;
    })
      .addCase(fetchPrescriptionDetails.fulfilled, (s, a) => {
        s.status = "succeeded";
        s.selected = a.payload;
      })
      .addCase(fetchPrescriptionDetails.rejected, (s, a) => {
        s.status = "failed";
        s.error = a.payload ?? a.error.message ?? "Unknown error";
      });

    b.addCase(cancelPrescription.fulfilled, (s, a) => {
      s.items = s.items.filter((p) => p.id !== a.payload);
      if (s.selected?.id === a.payload) {
        s.selected = undefined;
      }
    });

    b.addCase(fetchAllPrescriptions.pending, (s) => {
      s.status = "loading";
      s.error = undefined;
    })
      .addCase(fetchAllPrescriptions.fulfilled, (s, a) => {
        s.items = a.payload.items;
        s.continuationToken = null;
        s.pageNumber = a.payload.pageNumber;
        s.pageSize = a.payload.pageSize;
        s.totalCount = a.payload.totalCount;
        s.totalPages = a.payload.totalPages;
        s.status = "succeeded";
      })
      .addCase(fetchAllPrescriptions.rejected, (s, a) => {
        s.status = "failed";
        s.error = a.payload ?? a.error.message ?? "Unknown error";
      });

    b.addCase(searchPrescriptionsThunk.pending, (s) => {
      s.status = "loading";
      s.error = undefined;
    })
      .addCase(searchPrescriptionsThunk.fulfilled, (s, a) => {
        const { items, continuationToken, reset } = a.payload;

        if (reset) {
          s.items = items;
        } else {
          s.items = [...s.items, ...items];
        }

        s.continuationToken = continuationToken;
        s.pageNumber = 1;
        s.totalCount = s.items.length;
        s.totalPages = 1;
        s.status = "succeeded";
      })
      .addCase(searchPrescriptionsThunk.rejected, (s, a) => {
        s.status = "failed";
        s.error = a.payload ?? a.error.message ?? "Unknown error";
      });

    b.addCase(fetchPrescriptionsByPatient.pending, (s) => {
      s.status = "loading";
      s.error = undefined;
    })
      .addCase(fetchPrescriptionsByPatient.fulfilled, (s, a) => {
        const { items, continuationToken, reset } = a.payload;

        if (reset) {
          s.items = items;
        } else {
          s.items = [...s.items, ...items];
        }

        s.continuationToken = continuationToken;
        s.pageNumber = 1;
        s.totalCount = s.items.length;
        s.totalPages = 1;
        s.status = "succeeded";
      })
      .addCase(fetchPrescriptionsByPatient.rejected, (s, a) => {
        s.status = "failed";
        s.error = a.payload ?? a.error.message ?? "Unknown error";
      });
  },
});

export const { clearPrescriptions, clearSelected } = slice.actions;
export default slice.reducer;
