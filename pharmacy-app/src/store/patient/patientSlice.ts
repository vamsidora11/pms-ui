import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  createPatient,
  updatePatient,
  getPatientDetails,
  searchPatients,
} from "@api/patient";
import type {
  PatientDetailsDto,
  PatientSummaryDto,
  CreatePatientRequest,
  UpdatePatientRequest,
} from "../patient/patienttype";

interface PatientState {
  list: PatientSummaryDto[];
  selected?: PatientDetailsDto;
  loading: boolean;
  error?: string;
}

const initialState: PatientState = {
  list: [],
  loading: false,
  error: undefined,
};

/* =========================
   Thunks
========================= */
export const searchPatientsThunk = createAsyncThunk(
  "patients/search",
  async (query?: string) => {
    return await searchPatients(query);
  }
);

export const getPatientThunk = createAsyncThunk(
  "patients/getById",
  async (id: string) => {
    return await getPatientDetails(id);
  }
);

export const createPatientThunk = createAsyncThunk(
  "patients/create",
  async (request: CreatePatientRequest) => {
    return await createPatient(request); // returns { patientId }
  }
);

export const updatePatientThunk = createAsyncThunk(
  "patients/update",
  async ({ id, request }: { id: string; request: UpdatePatientRequest }) => {
    await updatePatient(id, request);
    return { id, request };
  }
);

/* =========================
   Slice
========================= */
const patientSlice = createSlice({
  name: "patients",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      /* Search patients */
      .addCase(searchPatientsThunk.pending, (state) => {
        state.loading = true;
        state.error = undefined;
      })
      .addCase(searchPatientsThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload;
      })
      .addCase(searchPatientsThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })

      /* Get patient details */
      .addCase(getPatientThunk.pending, (state) => {
        state.loading = true;
        state.error = undefined;
      })
      .addCase(getPatientThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.selected = action.payload;
      })
      .addCase(getPatientThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })

      /* Create patient */
      .addCase(createPatientThunk.fulfilled, (state) => {
        // backend returns { patientId }
        // Optionally trigger refetch in component after creation
        // For now, just clear error/loading
        state.loading = false;
        state.error = undefined;
      })

      /* Update patient */
      .addCase(updatePatientThunk.fulfilled, (state, action) => {
        const idx = state.list.findIndex((p) => p.id === action.payload.id);
        if (idx !== -1) {
          state.list[idx] = { ...state.list[idx], ...action.payload.request };
        }
      });
  },
});

export default patientSlice.reducer;
