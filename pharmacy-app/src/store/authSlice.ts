// src/store/authSlice.ts (replace direct fetch calls)
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import {jwtDecode} from "jwt-decode";
import { loginApi, refreshApi, logoutApi } from "../api/auth";

export const loginUser = createAsyncThunk("auth/login", async (credentials: { username: string; password: string }) => {
  return await loginApi(credentials);
});

export const refreshAccess = createAsyncThunk("auth/refresh", async () => {
  return await refreshApi();
});

export const serverLogout = createAsyncThunk("auth/serverLogout", async () => {
  await logoutApi();
});

type UserRole = "Manager" | "Pharmacist" | "Technician";
type TokenPayload = { sub: string; username: string; role: UserRole; exp: number };
type User = { id: string; username: string; role: UserRole };

interface AuthState {
  user: User | null;
  accessToken: string | null;
  status: "idle" | "loading" | "succeeded" | "failed";
  error?: string;
}

const initialState: AuthState = { user: null, accessToken: null, status: "idle" };

const slice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout(state) {
      state.user = null;
      state.accessToken = null;
      state.status = "idle";
    },
  },
  extraReducers: (b) => {
    b.addCase(loginUser.pending, (s) => {
      s.status = "loading";
      s.error = undefined;
    })
      .addCase(loginUser.fulfilled, (s, a) => {
        s.status = "succeeded";
        s.accessToken = a.payload.accessToken;
        const payload = jwtDecode<TokenPayload>(a.payload.accessToken);
        s.user = { id: payload.sub, username: payload.username, role: payload.role };
      })
      .addCase(loginUser.rejected, (s, a) => {
        s.status = "failed";
        s.error = a.error.message;
      })
      .addCase(refreshAccess.fulfilled, (s, a) => {
        s.accessToken = a.payload.accessToken;
        const payload = jwtDecode<TokenPayload>(a.payload.accessToken);
        s.user = { id: payload.sub, username: payload.username, role: payload.role };
      })
      .addCase(serverLogout.fulfilled, (s) => {
        s.user = null;
        s.accessToken = null;
        s.status = "idle";
      });
  },
});

export const { logout } = slice.actions;
export default slice.reducer;
