// 🚧 Guard mocks: prevent real store/persist from executing during unit tests
import { vi, describe, it, expect, beforeEach } from "vitest";

vi.mock("store", () => ({}));
vi.mock("redux-persist", () => ({
  persistReducer: (_cfg: unknown, reducer: unknown) => reducer,
  persistStore: vi.fn(),
}));

import { render, screen, fireEvent } from "@testing-library/react";

// --- Mock react-redux hooks so we don't need a Provider ---
const mockUseSelector = vi.fn();
const mockDispatch = vi.fn();

vi.mock("react-redux", async () => {
  const actual = await vi.importActual<typeof import("react-redux")>("react-redux");
  return {
    ...actual,
    useSelector: (sel: (s: unknown) => unknown) => mockUseSelector(sel),
    useDispatch: () => mockDispatch,
  };
});

// --- Mock useLoginFlow (correct relative path from /tests folder) ---
interface LoginResult {
  ok: boolean; 
}

interface UseLoginFlowReturn {
  login: (u: string, p: string) => Promise<LoginResult> | LoginResult;
  errorMessage: string | null;
  clearError: () => void;
}

const loginMock = vi.fn<(u: string, p: string) => Promise<LoginResult> | LoginResult>();
const clearErrorMock = vi.fn<() => void>();

let useLoginFlowMockReturn: UseLoginFlowReturn = {
  login: loginMock,
  errorMessage: null,
  clearError: clearErrorMock,
};

vi.mock("../hooks/useLoginFlow", () => ({
  useLoginFlow: (): UseLoginFlowReturn => useLoginFlowMockReturn,
}));

// Keep lucide-react icons lightweight to avoid SVG complexity in tests
vi.mock("lucide-react", () => ({
  Eye: (props: unknown) => <svg data-testid="icon-eye" {...(props as object)} />,
  EyeOff: (props: unknown) => <svg data-testid="icon-eyeoff" {...(props as object)} />,
  Mail: (props: unknown) => <svg data-testid="icon-mail" {...(props as object)} />,
  Lock: (props: unknown) => <svg data-testid="icon-lock" {...(props as object)} />,
}));

// SUT (import AFTER mocks)
import LoginPage from "../LoginPage";

describe("LoginPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // default store state for unit tests
    mockUseSelector.mockImplementation((sel: (s: unknown) => unknown) =>
      sel({ auth: { status: "idle" } })
    );

    // default hook shape (no error)
    useLoginFlowMockReturn = {
      login: loginMock,
      errorMessage: null,
      clearError: clearErrorMock,
    };
  });

  it("renders email, password and submit button", () => {
    render(<LoginPage />);

    // Use placeholder-based queries since labels aren’t associated via htmlFor/id
    const email = screen.getByPlaceholderText("Enter your email");
    const password = screen.getByPlaceholderText("Enter your password");
    const submit = screen.getByRole("button", { name: /sign in/i });

    expect(email).toBeInTheDocument();
    expect(password).toBeInTheDocument();
    expect(submit).toBeInTheDocument();
  });

  it("submits with username & password and calls login", () => {
    render(<LoginPage />);

    const email = screen.getByPlaceholderText("Enter your email");
    const password = screen.getByPlaceholderText("Enter your password");
    const submit = screen.getByRole("button", { name: /sign in/i });

    // Narrowing: ensure HTMLInputElement before accessing .value
    expect(email).toBeInstanceOf(HTMLInputElement);
    expect(password).toBeInstanceOf(HTMLInputElement);

    fireEvent.change(email, { target: { value: "test@example.com" } });
    fireEvent.change(password, { target: { value: "secret" } });
    fireEvent.click(submit);

    expect(loginMock).toHaveBeenCalledWith("test@example.com", "secret");
  });

  it("shows loading state and disables inputs when status is 'loading'", () => {
    mockUseSelector.mockImplementation((sel: (s: unknown) => unknown) =>
      sel({ auth: { status: "loading" } })
    );

    render(<LoginPage />);

    const submit = screen.getByRole("button", { name: /signing in/i });
    expect(submit).toBeDisabled();

    const email = screen.getByPlaceholderText("Enter your email");
    const password = screen.getByPlaceholderText("Enter your password");

    expect(email).toBeInstanceOf(HTMLInputElement);
    expect(password).toBeInstanceOf(HTMLInputElement);

    expect((email as HTMLInputElement).disabled).toBe(true);
    expect((password as HTMLInputElement).disabled).toBe(true);
  });

  it("toggles password visibility with the eye button", () => {
    render(<LoginPage />);

    const passwordEl = screen.getByPlaceholderText("Enter your password");
    expect(passwordEl).toBeInstanceOf(HTMLInputElement);

    const password = passwordEl as HTMLInputElement;
    expect(password.type).toBe("password");

    const toggleBtn = screen.getByRole("button", { name: /show password/i });
    fireEvent.click(toggleBtn);

    // after toggle
    expect(
      screen.getByRole("button", { name: /hide password/i })
    ).toBeInTheDocument();

    const toggled = screen.getByPlaceholderText("Enter your password");
    expect(toggled).toBeInstanceOf(HTMLInputElement);
    expect((toggled as HTMLInputElement).type).toBe("text");
  });

  it("renders inline error when hook returns errorMessage", () => {
    useLoginFlowMockReturn = {
      ...useLoginFlowMockReturn,
      errorMessage: "Incorrect username or password",
    };

    render(<LoginPage />);

    expect(
      screen.getByText(/incorrect username or password/i)
    ).toBeInTheDocument();
  });

  it("calls clearError when user types after an error is shown", () => {
    useLoginFlowMockReturn = {
      ...useLoginFlowMockReturn,
      errorMessage: "Some error",
    };

    render(<LoginPage />);

    const email = screen.getByPlaceholderText("Enter your email");
    expect(email).toBeInstanceOf(HTMLInputElement);

    fireEvent.change(email, { target: { value: "john@doe.com" } });

    expect(clearErrorMock).toHaveBeenCalledTimes(1);
  });
});