import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { extractApiError } from "@utils/httpError";
import {
  cancelPrescription as cancelPrescriptionApi,
  createPrescription as createPrescriptionApi,
  getAllPrescriptions,
  getPrescriptionById,
  reviewPrescription as reviewPrescriptionApi,
} from "@api/prescription.ts";
import type {
  CreatePrescriptionRequestDto,
} from "@api/prescription.ts";
import type { PrescriptionHistoryQueryParams } from "@api/prescription.ts";
import {
  mapDetailsDto,
  mapReviewToDto,
  mapSummaryDto,
} from "@prescription/domain/mapper";
import type {
  PrescriptionDetails,
  PrescriptionLineReviewDraft,
  PrescriptionSummary,
} from "@prescription/domain/model";

type RequestStatus = "idle" | "loading" | "succeeded" | "failed";

type SelectedPrescription = {
  prescription: PrescriptionDetails;
  etag: string;
};

type ReviewConflictError = {
  type: "conflict";
  message: string;
  latest: SelectedPrescription;
};

type RejectableError = string | ReviewConflictError;

function getStatusCode(error: unknown): number | undefined {
  if (typeof error === "object" && error !== null) {
    const obj = error as { response?: { status?: number } };
    return obj.response?.status;
  }
  return undefined;
}

export const createPrescription = createAsyncThunk<
  SelectedPrescription,
  CreatePrescriptionRequestDto,
  { rejectValue: string }
>("prescriptions/create", async (payload, { rejectWithValue }) => {
  try {
    const res = await createPrescriptionApi(payload);
    return {
      prescription: mapDetailsDto(res.data),
      etag: res.etag ?? "",
    };
  } catch (error) {
    return rejectWithValue(extractApiError(error));
  }
});

export const fetchPrescriptionDetails = createAsyncThunk<
  SelectedPrescription,
  { id: string; patientId: string },
  { rejectValue: string }
>("prescriptions/details", async ({ id, patientId }, { rejectWithValue }) => {
  try {
    const res = await getPrescriptionById(id, patientId);
    return {
      prescription: mapDetailsDto(res.data),
      etag: res.etag ?? "",
    };
  } catch (error) {
    return rejectWithValue(extractApiError(error));
  }
});

export const fetchAllPrescriptions = createAsyncThunk<
  {
    items: PrescriptionSummary[];
    pageNumber: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  },
  PrescriptionHistoryQueryParams | undefined,
  { rejectValue: string }
>("prescriptions/fetchAll", async (query, { rejectWithValue }) => {
  try {
    const response = await getAllPrescriptions(query ?? {});
    return {
      items: response.items.map(mapSummaryDto),
      pageNumber: response.pageNumber,
      pageSize: response.pageSize,
      totalCount: response.totalCount,
      totalPages: response.totalPages,
      hasNextPage: response.hasNextPage,
      hasPreviousPage: response.hasPreviousPage,
    };
  } catch (error) {
    return rejectWithValue(extractApiError(error));
  }
});

export const cancelPrescription = createAsyncThunk<
  { id: string; etag?: string },
  { id: string; patientId: string; reason?: string },
  { state: { prescriptions: PrescriptionState }; rejectValue: string }
>("prescriptions/cancel", async ({ id, patientId, reason }, thunkApi) => {
  const { getState, rejectWithValue } = thunkApi;

  try {
    const selected = getState().prescriptions.selected;
    let etag = selected?.prescription.id === id ? selected.etag : "";

    if (!etag) {
      const latest = await getPrescriptionById(id, patientId);
      etag = latest.etag ?? "";
    }

    if (!etag) {
      throw new Error("Missing ETag");
    }

    const nextEtag = await cancelPrescriptionApi(id, reason, etag);
    return { id, etag: nextEtag };
  } catch (error) {
    return rejectWithValue(extractApiError(error));
  }
});

export const reviewPrescription = createAsyncThunk<
  SelectedPrescription,
  {
    id: string;
    patientId: string;
    reviews: PrescriptionLineReviewDraft[];
    etag: string;
  },
  { rejectValue: RejectableError }
>("prescriptions/review", async ({ id, patientId, reviews, etag }, thunkApi) => {
  const { rejectWithValue } = thunkApi;

  try {
    const payload = mapReviewToDto(reviews);
    const nextEtag = await reviewPrescriptionApi(id, patientId, payload, etag);
    const latest = await getPrescriptionById(id, patientId);
    return {
      prescription: mapDetailsDto(latest.data),
      etag: nextEtag ?? latest.etag ?? etag,
    };
  } catch (error) {
    if (getStatusCode(error) === 412) {
      try {
        const latest = await getPrescriptionById(id, patientId);
        return rejectWithValue({
          type: "conflict",
          message: "Prescription updated by another user.",
          latest: {
            prescription: mapDetailsDto(latest.data),
            etag: latest.etag ?? etag,
          },
        });
      } catch {
        return rejectWithValue("Prescription updated by another user.");
      }
    }

    return rejectWithValue(extractApiError(error));
  }
});

export interface PrescriptionState {
  items: PrescriptionSummary[];
  selected?: SelectedPrescription;
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  status: RequestStatus;
  error?: string;
}

const initialState: PrescriptionState = {
  items: [],
  selected: undefined,
  pageNumber: 1,
  pageSize: 10,
  totalCount: 0,
  totalPages: 1,
  status: "idle",
  error: undefined,
};

const slice = createSlice({
  name: "prescriptions",
  initialState,
  reducers: {
    clearPrescriptions: (state) => {
      state.items = [];
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
  extraReducers: (builder) => {
    builder
      .addCase(createPrescription.pending, (state) => {
        state.status = "loading";
        state.error = undefined;
      })
      .addCase(createPrescription.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.selected = action.payload;
      })
      .addCase(createPrescription.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload ?? action.error.message ?? "Unknown error";
      });

    builder
      .addCase(fetchPrescriptionDetails.pending, (state) => {
        state.status = "loading";
        state.error = undefined;
      })
      .addCase(fetchPrescriptionDetails.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.selected = action.payload;
      })
      .addCase(fetchPrescriptionDetails.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload ?? action.error.message ?? "Unknown error";
      });

    builder
      .addCase(fetchAllPrescriptions.pending, (state) => {
        state.status = "loading";
        state.error = undefined;
      })
      .addCase(fetchAllPrescriptions.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items = action.payload.items;
        state.pageNumber = action.payload.pageNumber;
        state.pageSize = action.payload.pageSize;
        state.totalCount = action.payload.totalCount;
        state.totalPages = action.payload.totalPages;
      })
      .addCase(fetchAllPrescriptions.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload ?? action.error.message ?? "Unknown error";
      });

    builder.addCase(cancelPrescription.fulfilled, (state, action) => {
      const id = action.payload.id;
      state.items = state.items.filter((item) => item.id !== id);

      if (state.selected?.prescription.id === id) {
        state.selected = undefined;
      }
    });

    builder
      .addCase(reviewPrescription.pending, (state) => {
        state.status = "loading";
        state.error = undefined;
      })
      .addCase(reviewPrescription.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.selected = action.payload;
      })
      .addCase(reviewPrescription.rejected, (state, action) => {
        state.status = "failed";

        if (action.payload && typeof action.payload === "object" && "type" in action.payload) {
          const conflict = action.payload as ReviewConflictError;
          state.selected = conflict.latest;
          state.error = conflict.message;
          return;
        }

        state.error =
          (typeof action.payload === "string" ? action.payload : undefined) ??
          action.error.message ??
          "Unknown error";
      });
  },
});

export const { clearPrescriptions, clearSelected } = slice.actions;
export default slice.reducer;
