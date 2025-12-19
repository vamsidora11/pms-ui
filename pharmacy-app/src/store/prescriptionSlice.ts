import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import { http } from "../api/http";

type Prescription = {
  id: string;
  patientName: string;
  doctor: string;
  date: string;
  item: string;
  status: "new" | "inprogress" | "completed";
};

type PrescriptionsState = {
  list: Prescription[];
  filter: "all" | "new" | "inprogress" | "completed";
  searchType: "patientId" | "phone" | "prescriptionId";
  query: string;
  status: "idle" | "loading" | "succeeded" | "failed";
  error?: string;
};

const initialState: PrescriptionsState = {
  list: [],
  filter: "all",
  searchType: "patientId",
  query: "",
  status: "idle",
};

export const fetchPrescriptions = createAsyncThunk(
  "prescriptions/fetch",
  async (_, { dispatch, getState, rejectWithValue }) => {
    try {
      const data = await http("/prescriptions", {
        method: "GET",
        auth: true,
        dispatch,
        getState,
      });
      return data as Prescription[];
    } catch (e: any) {
      return rejectWithValue(e.message || "Failed to fetch prescriptions");
    }
  }
);

const prescriptionSlice = createSlice({
  name: "prescriptions",
  initialState,
  reducers: {
    setFilter: (state, action: PayloadAction<PrescriptionsState["filter"]>) => {
      state.filter = action.payload;
    },
    setSearchType: (
      state,
      action: PayloadAction<PrescriptionsState["searchType"]>
    ) => {
      state.searchType = action.payload;
    },
    setQuery: (state, action: PayloadAction<string>) => {
      state.query = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPrescriptions.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchPrescriptions.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.list = action.payload;
      })
      .addCase(fetchPrescriptions.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload as string;
      });
  },
});

export const { setFilter, setSearchType, setQuery } = prescriptionSlice.actions;
export default prescriptionSlice.reducer;
