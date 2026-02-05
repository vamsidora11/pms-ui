// prescriptionSlice.ts - FIXED VERSION (No More Duplicates!)
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import {
  createPrescription as createPrescriptionApi,
  getPrescriptionDetails,
  searchPrescriptions,
  getAllPrescriptions,
  getPrescriptionsByPatient,
  cancelPrescription as cancelPrescriptionApi
} from "@api/prescription";

/* ===================== THUNKS ===================== */

// Create prescription
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

// Get prescription details
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

// Cancel prescription
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

// ---------------- PAGINATED THUNKS ----------------

// Fetch all prescriptions (paginated)
export const fetchAllPrescriptions = createAsyncThunk(
  "prescriptions/fetchAll",
  async (
    {
      status,
      pageSize = 10,
      continuationToken = null,
      reset = true
    }: {
      status?: string;
      pageSize?: number;
      continuationToken?: string | null;
      reset?: boolean;
    },
    { rejectWithValue }
  ) => {
    try {
      console.log('🔵 Fetching prescriptions:', { status, pageSize, continuationToken, reset });
      const result = await getAllPrescriptions(status, pageSize, continuationToken);
      console.log('✅ API returned:', { 
        itemsCount: result.items?.length, 
        hasToken: !!result.continuationToken,
        firstId: result.items?.[0]?.id 
      });
      return {
        items: result.items || [],
        continuationToken: result.continuationToken || null,
        reset
      };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

// Search prescriptions (paginated)
export const searchPrescriptionsThunk = createAsyncThunk(
  "prescriptions/search",
  async (
    {
      searchTerm,
      pageSize = 10,
      continuationToken = null,
      reset = true
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
        reset
      };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

// Fetch prescriptions by patient (paginated)
export const fetchPrescriptionsByPatient = createAsyncThunk(
  "prescriptions/byPatient",
  async (
    {
      patientId,
      pageSize = 10,
      continuationToken = null,
      reset = true
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
        reset
      };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

// Validate prescription
// export const validatePrescriptionThunk = createAsyncThunk(
//   "prescriptions/validate",
//   async (id: string, { rejectWithValue }) => {
//     try {
//       return await validatePrescription(id);
//     } catch (error: any) {
//       return rejectWithValue(error.response?.data?.message || error.message);
//     }
//   }
// );

/* ===================== STATE ===================== */

interface PrescriptionState {
  items: any[];
  selected?: any;
  continuationToken: string | null;
  status: "idle" | "loading" | "succeeded" | "failed";
  error?: string;
}

const initialState: PrescriptionState = {
  items: [],
  continuationToken: null,
  status: "idle"
};

/* ===================== SLICE ===================== */

const slice = createSlice({
  name: "prescriptions",
  initialState,
  reducers: {
    clearPrescriptions: (state) => {
      state.items = [];
      state.continuationToken = null;
      state.status = "idle";
      state.error = undefined;
    },
    clearSelected: (state) => {
      state.selected = undefined;
    }
  },
  extraReducers: (b) => {
    /* ---------- CREATE ---------- */
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
        s.error = a.payload as string || a.error.message;
      });

    /* ---------- DETAILS ---------- */
    b.addCase(fetchPrescriptionDetails.pending, (s) => {
      s.status = "loading";
      s.error = undefined;
    })
      .addCase(fetchPrescriptionDetails.fulfilled, (s, a) => {
        s.status = "succeeded";
        s.selected = a.payload;
        console.log('✅ Selected prescription loaded:', a.payload);
      })
      .addCase(fetchPrescriptionDetails.rejected, (s, a) => {
        s.status = "failed";
        s.error = a.payload as string || a.error.message;
      });

    /* ---------- CANCEL ---------- */
    b.addCase(cancelPrescription.fulfilled, (s, a) => {
      s.items = s.items.filter(p => p.id !== a.payload);
      if (s.selected?.id === a.payload) {
        s.selected = undefined;
      }
    });

    /* ---------- FETCH ALL (PAGINATED) ---------- */
    b.addCase(fetchAllPrescriptions.pending, (s) => {
      s.status = "loading";
      s.error = undefined;
    })
      .addCase(fetchAllPrescriptions.fulfilled, (s, a) => {
        const { items, continuationToken, reset } = a.payload;

        console.log('📦 Redux updating:', { 
          reset, 
          newItemsCount: items.length,
          oldItemsCount: s.items.length,
          firstNewId: items[0]?.id,
          firstOldId: s.items[0]?.id
        });

        // ⭐ KEY FIX: ALWAYS REPLACE when reset is true
        if (reset) {
          s.items = items;
          console.log('✅ REPLACED items');
        } else {
          // Only append if explicitly told not to reset
          s.items = [...s.items, ...items];
          console.log('✅ APPENDED items');
        }

        s.continuationToken = continuationToken;
        s.status = "succeeded";
      })
      .addCase(fetchAllPrescriptions.rejected, (s, a) => {
        s.status = "failed";
        s.error = a.payload as string || a.error.message;
      });

    /* ---------- SEARCH (PAGINATED) ---------- */
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
        s.status = "succeeded";
      })
      .addCase(searchPrescriptionsThunk.rejected, (s, a) => {
        s.status = "failed";
        s.error = a.payload as string || a.error.message;
      });

    /* ---------- BY PATIENT (PAGINATED) ---------- */
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
        s.status = "succeeded";
      })
      .addCase(fetchPrescriptionsByPatient.rejected, (s, a) => {
        s.status = "failed";
        s.error = a.payload as string || a.error.message;
      });

    /* ---------- VALIDATE ---------- */
    // b.addCase(validatePrescriptionThunk.fulfilled, (s, a) => {
    //   const idx = s.items.findIndex(p => p.id === a.payload.id);
    //   if (idx !== -1) s.items[idx] = a.payload;
    //   if (s.selected?.id === a.payload.id) s.selected = a.payload;
    // });
  }
});

export const { clearPrescriptions, clearSelected } = slice.actions;
export default slice.reducer;