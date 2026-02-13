// src/features/auth/tests/useLoginFlow.test.tsx
import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, beforeEach, vi } from "vitest";

// 🚧 Guard mocks: prevent real store/slice/persist from executing during unit tests
vi.mock("@store/auth/authSlice", () => ({
  loginUser: vi.fn(
    (creds: { username: string; password: string }) => ({
      type: "auth/loginUser",
      payload: creds,
    })
  ),
}));

vi.mock("store", () => ({}));

vi.mock("redux-persist", () => ({
  persistReducer: (_cfg: unknown, reducer: unknown) => reducer,
  persistStore: vi.fn(),
}));

// --- Mocks for external hooks/deps used inside the hook ---
const mockDispatch = vi.fn();
const mockNavigate = vi.fn();
const mockToastSuccess = vi.fn();

vi.mock("react-redux", async () => {
  const actual = await vi.importActual<typeof import("react-redux")>("react-redux");
  return {
    ...actual,
    useDispatch: () => mockDispatch,
  };
});

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock("@components/common/Toast/useToast", () => ({
  useToast: () => ({ success: mockToastSuccess }),
}));

// Optional: spy default jwtDecode used by hook when no decoder injected
const jwtDecodeSpy = vi.fn();
vi.mock("jwt-decode", () => ({
  jwtDecode: (t: string) => jwtDecodeSpy(t),
}));

// 👉 Import the hook AFTER mocks
import { useLoginFlow } from "../hooks/useLoginFlow";

// Utilities to shape dispatch().unwrap()
function mockDispatchUnwrapResolve(payload: unknown) {
  mockDispatch.mockReturnValue({
    unwrap: vi.fn().mockResolvedValue(payload),
  });
}
function mockDispatchUnwrapReject(error: unknown) {
  mockDispatch.mockReturnValue({
    unwrap: vi.fn().mockRejectedValue(error),
  });
}

describe("useLoginFlow (vitest)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("success: decodes token, routes by role, toasts, navigates, returns { ok: true }", async () => {
    const FAKE_TOKEN = "header.payload.sig";
    mockDispatchUnwrapResolve({ accessToken: FAKE_TOKEN });

    const decodeToken = vi.fn().mockReturnValue({ role: "pharmacist" });
    const getRoute = vi.fn().mockReturnValue("/pharmacist/dashboard");

    const { result } = renderHook(() => useLoginFlow({ decodeToken, getRoute }));

    let resp;
    await act(async () => {
      resp = await result.current.login("sooraj", "secret");
    });

    expect(mockDispatch).toHaveBeenCalledTimes(1);
    expect(decodeToken).toHaveBeenCalledWith(FAKE_TOKEN);
    expect(getRoute).toHaveBeenCalledWith("pharmacist");
    expect(mockToastSuccess).toHaveBeenCalledWith("Successfully logged in");
    expect(mockNavigate).toHaveBeenCalledWith("/pharmacist/dashboard");
    expect(resp).toEqual({ ok: true });
    expect(result.current.errorMessage).toBeNull();
  });

  it("no token: sets error and returns { ok: false }", async () => {
    mockDispatchUnwrapResolve({});
    const { result } = renderHook(() => useLoginFlow());

    let resp;
    await act(async () => {
      resp = await result.current.login("user", "pass");
    });

    expect(resp).toEqual({ ok: false });
    expect(result.current.errorMessage).toBe("Login failed: No access token returned.");
    expect(mockNavigate).not.toHaveBeenCalled();
    expect(mockToastSuccess).not.toHaveBeenCalled();
  });

  it("invalid payload (no role): sets error and returns { ok: false }", async () => {
    mockDispatchUnwrapResolve({ accessToken: "token" });
    const decodeToken = vi.fn().mockReturnValue({});

    const { result } = renderHook(() => useLoginFlow({ decodeToken }));

    let resp;
    await act(async () => {
      resp = await result.current.login("user", "pass");
    });

    expect(resp).toEqual({ ok: false });
    expect(result.current.errorMessage).toBe("Login failed: Invalid token payload.");
    expect(mockNavigate).not.toHaveBeenCalled();
    expect(mockToastSuccess).not.toHaveBeenCalled();
  });

  it("error normalization: plain string", async () => {
    mockDispatchUnwrapReject("Account locked");
    const { result } = renderHook(() => useLoginFlow());

    await act(async () => {
      await result.current.login("user", "pass");
    });

    expect(result.current.errorMessage).toBe("Account locked");
  });

  it("error normalization: Error.message", async () => {
    mockDispatchUnwrapReject(new Error("Something broke"));
    const { result } = renderHook(() => useLoginFlow());

    await act(async () => {
      await result.current.login("user", "pass");
    });

    expect(result.current.errorMessage).toBe("Something broke");
  });

  it("error normalization: axios response.data string", async () => {
    mockDispatchUnwrapReject({ response: { data: "Bad credentials" } });
    const { result } = renderHook(() => useLoginFlow());

    await act(async () => {
      await result.current.login("user", "pass");
    });

    expect(result.current.errorMessage).toBe("Bad credentials");
  });

  it("error normalization: axios response.data.message", async () => {
    mockDispatchUnwrapReject({ response: { data: { message: "Too many attempts" } } });
    const { result } = renderHook(() => useLoginFlow());

    await act(async () => {
      await result.current.login("user", "pass");
    });

    expect(result.current.errorMessage).toBe("Too many attempts");
  });

  it("error normalization: unknown shape → default message", async () => {
    mockDispatchUnwrapReject({ foo: "bar" });
    const { result } = renderHook(() => useLoginFlow());

    await act(async () => {
      await result.current.login("user", "pass");
    });

    expect(result.current.errorMessage).toBe("Incorrect username or password");
  });

  it("clearError resets errorMessage", async () => {
    mockDispatchUnwrapReject("Some error");
    const { result } = renderHook(() => useLoginFlow());

    await act(async () => {
      await result.current.login("user", "pass");
    });
    expect(result.current.errorMessage).toBe("Some error");

    act(() => {
      result.current.clearError();
    });
    expect(result.current.errorMessage).toBeNull();
  });

  it("uses default jwtDecode when no decoder injected", async () => {
    mockDispatchUnwrapResolve({ accessToken: "abc.def.ghi" });
    jwtDecodeSpy.mockReturnValueOnce({ role: "manager" });

    const { result } = renderHook(() => useLoginFlow());
    await act(async () => {
      await result.current.login("user", "pass");
    });

    expect(jwtDecodeSpy).toHaveBeenCalledWith("abc.def.ghi");
  });
});
