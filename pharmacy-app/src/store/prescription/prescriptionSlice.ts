import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import {
  createPrescription as createPrescriptionApi,
  getPrescriptionDetails,
  searchPrescriptions,
  getAllPrescriptions,
  getPrescriptionsByPatient,
  cancelPrescription as cancelPrescriptionApi,
} from "@api/prescription";
import type { PrescriptionHistoryQueryParams } from "@api/prescription";

/* ===================== THUNKS ===================== */

export const createPrescription = createAsyncThunk(
  "prescriptions/create",
  async (prescriptionData: any, { rejectWithValue }) => {
    try {
      return await createPrescriptionApi(prescriptionData);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const fetchPrescriptionDetails = createAsyncThunk(
  "prescriptions/details",
  async (id: string, { rejectWithValue }) => {
    try {
      return await getPrescriptionDetails(id);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const cancelPrescription = createAsyncThunk(
  "prescriptions/cancel",
  async ({ id, reason }: { id: string; reason?: string }, { rejectWithValue }) => {
    try {
      await cancelPrescriptionApi(id, reason);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const fetchAllPrescriptions = createAsyncThunk(
  "prescriptions/fetchAll",
  async (query: PrescriptionHistoryQueryParams = {}, { rejectWithValue }) => {
    try {
      return await getAllPrescriptions(query);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const searchPrescriptionsThunk = createAsyncThunk(
  "prescriptions/search",
  async (
    {
      searchTerm,
      pageSize = 10,
      continuationToken = null,
      reset = true,
    }: {
      searchTerm: string;
      pageSize?: number;
      continuationToken?: string | null;
      reset?: boolean;
    },
    { rejectWithValue }
  ) => {
    try {
      const result = await searchPrescriptions(searchTerm, pageSize, continuationToken);
      return {
        items: result.items || [],
        continuationToken: result.continuationToken || null,
        reset,
      };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const fetchPrescriptionsByPatient = createAsyncThunk(
  "prescriptions/byPatient",
  async (
    {
      patientId,
      pageSize = 10,
      continuationToken = null,
      reset = true,
    }: {
      patientId: string;
      pageSize?: number;
      continuationToken?: string | null;
      reset?: boolean;
    },
    { rejectWithValue }
  ) => {
    try {
      const result = await getPrescriptionsByPatient(patientId, pageSize, continuationToken);
      return {
        items: result.items || [],
        continuationToken: result.continuationToken || null,
        reset,
      };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

/* ===================== STATE ===================== */

interface PrescriptionState {
  items: any[];
  selected?: any;
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
        s.error = (a.payload as string) || a.error.message;
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
        s.error = (a.payload as string) || a.error.message;
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
        s.error = (a.payload as string) || a.error.message;
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
        s.error = (a.payload as string) || a.error.message;
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
        s.error = (a.payload as string) || a.error.message;
      });
  },
});

export const { clearPrescriptions, clearSelected } = slice.actions;
export default slice.reducer;
