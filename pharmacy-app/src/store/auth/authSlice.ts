import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { jwtDecode } from "jwt-decode";
import { loginApi, refreshApi, logoutApi } from "@api/auth";
import type { User, UserRole } from "./authtype";
type TokenPayload = {
  sub: string;
  username: string;
  role: UserRole;
  exp: number;
  avatarUrl?: string;
};

interface AuthState {
  user: User | null;
  accessToken: string | null;
  status: "idle" | "loading" | "succeeded" | "failed";
  error?: string;
}

const initialState: AuthState = { user: null, accessToken: null, status: "idle" };
// Helper to decode JWT
const decodeToken = (token: string): User => {
  const payload = jwtDecode<TokenPayload>(token);
  return {
    id: payload.sub,
    username: payload.username,
    role: payload.role,
    avatarUrl: payload.avatarUrl,
  };
};

const getErrorMessage = (error: unknown): string => {
  if (typeof error === "string") return error;
  if (typeof error === "object" && error !== null) {
    const err = error as { message?: string };
    return err.message || "Unknown error";
  }
  return "Unknown error";
};

// Thunks
export const loginUser = createAsyncThunk(
  "auth/login",
  async (credentials: { username: string; password: string }, { rejectWithValue }) => {
    try {
      const res = await loginApi(credentials);
      return res;
    } catch {
      return rejectWithValue("Incorrect username or password");
    }
  }
);

export const refreshAccess = createAsyncThunk(
  "auth/refresh",
  async (_, { rejectWithValue }) => {
    try {
      const res = await refreshApi();
      return res; // { accessToken }
    } catch (error) {
      return rejectWithValue(getErrorMessage(error) || "Refresh failed");
    }
  }
);

export const serverLogout = createAsyncThunk("auth/logout", async () => {
  await logoutApi();
});

// Slice
const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout(state) {
      state.user = null;
      state.accessToken = null;
      state.status = "idle";
      state.error = undefined;
    },
  },
  extraReducers: (builder) => {
    builder
      // LOGIN
      .addCase(loginUser.pending, (state) => {
        state.status = "loading";
        state.error = undefined;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.accessToken = action.payload.accessToken;
        state.user = decodeToken(action.payload.accessToken);
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload as string;
        state.accessToken = null;
        state.user = null;
      })

      // REFRESH
      .addCase(refreshAccess.fulfilled, (state, action) => {
        state.accessToken = action.payload.accessToken;
        state.user = decodeToken(action.payload.accessToken);
      })
      .addCase(refreshAccess.rejected, (state) => {
        // Clear state on refresh failure to force logout
        state.accessToken = null;
        state.user = null;
        state.status = "idle";
      })

      // LOGOUT
      .addCase(serverLogout.fulfilled, (state) => {
        state.accessToken = null;
        state.user = null;
        state.status = "idle";
        state.error = undefined;
      });
  },
});

export const { logout } = authSlice.actions;
export default authSlice.reducer;
