import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Sidebar from "@components/layouts/Sidebar/Sidebar";
import type { User } from "../../../store/auth/authtype";

// ==============================================
// GLOBAL STATE for mocking Redux useSelector
// ==============================================
let mockCollapsed = false;

// =========================
// Mock react-redux
// =========================
vi.mock("react-redux", () => {
  return {
    useDispatch: () => mockDispatch,
    useSelector: (selector: any) =>
      selector({
        ui: { sidebarCollapsed: mockCollapsed },
      }),
  };
});

// =========================
// Mock store actions
// =========================
const mockDispatch = vi.fn();
const mockNavigate = vi.fn();

vi.mock("../../../store/auth/authSlice", () => ({
  serverLogout: () => ({ type: "auth/serverLogout" }),
}));

vi.mock("../../../store/ui/uiSlice", () => ({
  toggleSidebar: () => ({ type: "ui/toggleSidebar" }),
}));

// =========================
// Mock router
// =========================
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// ==============================================
// RENDER HELPER
// ==============================================
function setup(user: User, collapsed = false) {
  mockCollapsed = collapsed;

  return render(
    <MemoryRouter>
      <Sidebar user={user} />
    </MemoryRouter>
  );
}

describe("Sidebar Component", () => {
  beforeEach(() => {
    mockDispatch.mockClear();
    mockNavigate.mockClear();
  });

  // ============================================================
  // Role Navigation
  // ============================================================
  it("renders pharmacist navigation items", () => {
    setup({ role: "pharmacist" } as User);

    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Manual Prescription Entry")).toBeInTheDocument();
    expect(screen.getByText("Prescription Validation")).toBeInTheDocument();
    expect(screen.getByText("Patient Profiles")).toBeInTheDocument();
    expect(screen.getByText("Label Generator")).toBeInTheDocument();
    expect(screen.getByText("Prescription History")).toBeInTheDocument();
  });

  it("renders manager navigation items", () => {
    setup({ role: "manager" } as User);

    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.queryByText("Prescription Validation")).not.toBeInTheDocument();
  });

  it("renders technician navigation items", () => {
    setup({ role: "technician" } as User);

    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Prescription Status")).toBeInTheDocument();
    expect(screen.getByText("Alerts")).toBeInTheDocument();
  });

  // ============================================================
  // Collapse
  // ============================================================
  it("dispatches toggleSidebar when clicking collapse button", () => {
    setup({ role: "pharmacist" } as User);

    const toggleBtn = screen.getAllByRole("button")[0]; // first button in header
    fireEvent.click(toggleBtn);

    expect(mockDispatch).toHaveBeenCalledWith({ type: "ui/toggleSidebar" });
  });

  it("hides labels when collapsed", () => {
    setup({ role: "pharmacist" } as User, true);

    expect(screen.queryByText("Dashboard")).not.toBeInTheDocument();
    expect(screen.queryByText("Manual Prescription Entry")).not.toBeInTheDocument();
  });

  // ============================================================
  // Logout
  // ============================================================
  it("dispatches logout and navigates to /login", () => {
    setup({ role: "pharmacist" } as User);

    const logoutBtn = screen.getByText("Logout");
    fireEvent.click(logoutBtn);

    expect(mockDispatch).toHaveBeenCalledWith({ type: "auth/serverLogout" });
    expect(mockNavigate).toHaveBeenCalledWith("/login");
  });

  // ============================================================
  // Footer
  // ============================================================
  it("shows footer when expanded", () => {
    setup({ role: "pharmacist" } as User);

    expect(screen.getByText("© 2025 Pharmacy App")).toBeInTheDocument();
  });

  it("hides footer when collapsed", () => {
    setup({ role: "pharmacist" } as User, true);

    expect(screen.queryByText("© 2025 Pharmacy App")).not.toBeInTheDocument();
  });
});
``