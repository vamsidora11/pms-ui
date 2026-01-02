import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { prescriptionApi, getPrescriptionDetails, validatePrescription } from "../../api/prescription";

// Create a new manual prescription
export const createPrescription = createAsyncThunk(
  "prescriptions/entry",
  async (prescriptionData) => {
    return await prescriptionApi(prescriptionData);
  }
);

// Fetch prescription details by ID
export const fetchPrescriptionDetails = createAsyncThunk(
  "prescriptions/details",
  async (id: string) => {
    return await getPrescriptionDetails(id);
  }
);

// Validate a prescription
export const validatePrescriptionThunk = createAsyncThunk(
  "prescriptions/validate",
  async (id: string) => {
    return await validatePrescription(id);
  }
);

interface PrescriptionState {
  items: any[];
  selected?: any; // holds details of a single prescription
  status: "idle" | "loading" | "succeeded" | "failed";
  error?: string;
}

const initialState: PrescriptionState = { items: [], status: "idle" };

const slice = createSlice({
  name: "prescriptions",
  initialState,
  reducers: {},
  extraReducers: (b) => {
    // Create prescription
    b.addCase(createPrescription.pending, (s) => {
      s.status = "loading";
      s.error = undefined;
    })
      .addCase(createPrescription.fulfilled, (s, a) => {
        s.status = "succeeded";
        s.items.push(a.payload);
      })
      .addCase(createPrescription.rejected, (s, a) => {
        s.status = "failed";
        s.error = a.error.message;
      });

    // Fetch prescription details
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
        s.error = a.error.message;
      });

    // Validate prescription
    b.addCase(validatePrescriptionThunk.pending, (s) => {
      s.status = "loading";
      s.error = undefined;
    })
      .addCase(validatePrescriptionThunk.fulfilled, (s, a) => {
        s.status = "succeeded";
        // Update the prescription status in items if found
        const idx = s.items.findIndex((p) => p.id === a.payload.id);
        if (idx !== -1) {
          s.items[idx] = a.payload;
        }
        // Also update selected if it's the same prescription
        if (s.selected && s.selected.id === a.payload.id) {
          s.selected = a.payload;
        }
      })
      .addCase(validatePrescriptionThunk.rejected, (s, a) => {
        s.status = "failed";
        s.error = a.error.message;
      });
  },
});

export default slice.reducer;
