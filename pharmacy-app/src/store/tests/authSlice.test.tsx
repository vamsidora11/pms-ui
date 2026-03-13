import { describe, it, expect, afterEach, vi } from "vitest";
import { configureStore, type AnyAction } from "@reduxjs/toolkit";
import { NETWORK_ERROR_MESSAGE } from "@utils/httpError";
import type { UserRole } from "../auth/authtype";

// ---- Mocks (declare first, then import SUT) ----
const loginApiMock = vi.fn();
const refreshApiMock = vi.fn();
const logoutApiMock = vi.fn();
vi.mock("@api/auth", () => ({
  loginApi: (...args: unknown[]) => loginApiMock(...args),
  refreshApi: (...args: unknown[]) => refreshApiMock(...args),
  logoutApi: (...args: unknown[]) => logoutApiMock(...args),
}));

const jwtDecodeMock = vi.fn();
vi.mock("jwt-decode", () => ({
  jwtDecode: (...args: unknown[]) => jwtDecodeMock(...args),
}));

// ---- Import SUT after mocks ----
import authReducer, {
  loginUser,
  refreshAccess,
  serverLogout,
  logout,
} from "../auth/authSlice";

// ---- Helpers ----
function makeStore() {
  return configureStore({
    reducer: { auth: authReducer },
  });
}

describe("authSlice - end-to-end + reducer coverage", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("initial state", () => {
    it("should initialize with user=null, accessToken=null, status='idle'", () => {
      const store = makeStore();
      const state = store.getState().auth;
      expect(state).toEqual({
        user: null,
        accessToken: null,
        status: "idle",
      });
    });
  });

  describe("loginUser thunk", () => {
    it("sets status=loading and clears error on pending (reducer path)", () => {
      // Directly reduce the pending action to ensure that path is covered
      const prev: ReturnType<typeof authReducer> = {
        user: null,
        accessToken: null,
        status: "idle",
        error: "Old error",
      };
      const next = authReducer(prev, { type: loginUser.pending.type } as AnyAction);
      expect(next.status).toBe("loading");
      expect(next.error).toBeUndefined();
    });

    it("fulfilled → stores accessToken, decodes user, status=succeeded", async () => {
      const store = makeStore();

      const token = "token-1";
      const payload: {
        sub: string;
        username: string;
        role: UserRole;
        exp: number;
        avatarUrl?: string;
      } = {
        sub: "u-1",
        username: "alice",
        role: "manager",
        exp: 1234567890,
        avatarUrl: "https://example.com/a.png",
      };

      loginApiMock.mockResolvedValue({ accessToken: token });
      jwtDecodeMock.mockReturnValue(payload);

      const resultAction = await store.dispatch(
        loginUser({ username: "alice", password: "pw" })
      );

      // Assert thunk fulfilled
      expect(resultAction.type).toBe(loginUser.fulfilled.type);
      expect(loginApiMock).toHaveBeenCalledWith({ username: "alice", password: "pw" });
      expect(jwtDecodeMock).toHaveBeenCalledWith(token);

      // Assert state changes
      const state = store.getState().auth;
      expect(state.status).toBe("succeeded");
      expect(state.accessToken).toBe(token);
      expect(state.user).toEqual({
        id: payload.sub,
        username: payload.username,
        role: payload.role,
        avatarUrl: payload.avatarUrl,
      });
      expect(state.error).toBeUndefined();
    });

    it("rejected → sets status=failed, error='Incorrect username or password', clears user/token", async () => {
      const store = makeStore();

      loginApiMock.mockRejectedValue({
        code: "ERR_NETWORK",
        message: "Network Error",
        request: {},
      });

      const resultAction = await store.dispatch(
        loginUser({ username: "bob", password: "wrong" })
      );

      expect(resultAction.type).toBe(loginUser.rejected.type);
      expect(resultAction.payload).toBe(NETWORK_ERROR_MESSAGE);

      const state = store.getState().auth;
      expect(state.status).toBe("failed");
      expect(state.error).toBe(NETWORK_ERROR_MESSAGE);
      expect(state.accessToken).toBeNull();
      expect(state.user).toBeNull();
    });

    it("rejected with unauthorized response -> keeps invalid credentials message", async () => {
      const store = makeStore();

      loginApiMock.mockRejectedValue({
        response: {
          status: 401,
          data: {
            title: "Unauthorized",
          },
        },
      });

      const resultAction = await store.dispatch(
        loginUser({ username: "bob", password: "wrong" })
      );

      expect(resultAction.type).toBe(loginUser.rejected.type);
      expect(resultAction.payload).toBe("Incorrect username or password");

      const state = store.getState().auth;
      expect(state.status).toBe("failed");
      expect(state.error).toBe("Incorrect username or password");
      expect(state.accessToken).toBeNull();
      expect(state.user).toBeNull();
    });
  });

  describe("refreshAccess thunk", () => {
    it("fulfilled → updates token and user (decodeToken is exercised again)", async () => {
      const store = makeStore();

      // Seed: simulate already logged-in (not strictly necessary, but realistic)
      store.dispatch({
        type: loginUser.fulfilled.type,
        payload: { accessToken: "seed-token" },
      });

      const newToken = "token-2";
      const payload2: {
        sub: string;
        username: string;
        role: UserRole;
        exp: number;
        avatarUrl?: string;
      } = {
        sub: "u-2",
        username: "charlie",
        role: "pharmacist",
        exp: 9999999999,
        // avatarUrl omitted on purpose (optional)
      };

      refreshApiMock.mockResolvedValue({ accessToken: newToken });
      jwtDecodeMock.mockReturnValue(payload2);

      const resultAction = await store.dispatch(refreshAccess());

      expect(resultAction.type).toBe(refreshAccess.fulfilled.type);
      expect(refreshApiMock).toHaveBeenCalledTimes(1);
      expect(jwtDecodeMock).toHaveBeenCalledWith(newToken);

      const state = store.getState().auth;
      expect(state.accessToken).toBe(newToken);
      expect(state.user).toEqual({
        id: payload2.sub,
        username: payload2.username,
        role: payload2.role,
        avatarUrl: undefined, // optional field is fine
      });
      // note: refresh fulfilled does not change status directly
    });

    it("rejected → clears user/token and sets status=idle (forces logout path)", async () => {
      const store = makeStore();

      // Seed a logged-in state to verify it gets cleared
      store.dispatch({
        type: loginUser.fulfilled.type,
        payload: { accessToken: "seed-token" },
      });
      jwtDecodeMock.mockReturnValue({
        sub: "u-seed",
        username: "seed",
        role: "manager",
        exp: 1,
      });

      refreshApiMock.mockRejectedValue(new Error("Token expired"));

      const resultAction = await store.dispatch(refreshAccess());

      expect(resultAction.type).toBe(refreshAccess.rejected.type);
      expect(resultAction.payload).toBe("Token expired");

      const state = store.getState().auth;
      expect(state.accessToken).toBeNull();
      expect(state.user).toBeNull();
      expect(state.status).toBe("idle");
    });
  });

  describe("serverLogout thunk", () => {
    it("fulfilled → resets state (accessToken=null, user=null, status=idle, error=undefined)", async () => {
      const store = makeStore();

      // Seed a logged-in state first
      store.dispatch({
        type: loginUser.fulfilled.type,
        payload: { accessToken: "seed-token" },
      });
      jwtDecodeMock.mockReturnValue({
        sub: "u-logout",
        username: "to-logout",
        role: "manager",
        exp: 1,
      });

      logoutApiMock.mockResolvedValue(undefined);

      const resultAction = await store.dispatch(serverLogout());
      expect(resultAction.type).toBe(serverLogout.fulfilled.type);
      expect(logoutApiMock).toHaveBeenCalledTimes(1);

      const state = store.getState().auth;
      expect(state.accessToken).toBeNull();
      expect(state.user).toBeNull();
      expect(state.status).toBe("idle");
      expect(state.error).toBeUndefined();
    });
  });

  describe("logout reducer (sync action)", () => {
    it("clears state immediately", () => {
      // Start from a non-empty state
      const prevState: ReturnType<typeof authReducer> = {
        user: { id: "u-1", username: "x", role: "manager", avatarUrl: "a" },
        accessToken: "t",
        status: "succeeded",
        error: "something",
      };
      const next = authReducer(prevState, logout());

      expect(next.user).toBeNull();
      expect(next.accessToken).toBeNull();
      expect(next.status).toBe("idle");
      expect(next.error).toBeUndefined();
    });
  });
});
