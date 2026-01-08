import { render, screen, fireEvent } from "@testing-library/react";
import Sidebar from "./Sidebar";
import { vi } from "vitest";
import React from "react";
import * as reactRedux from "react-redux";

// ------------------ MOCK STATE ------------------

const mockDispatch = vi.fn();
const mockNavigate = vi.fn();
let isActiveMock = false;

// ------------------ MOCKS ------------------

// 🔒 Fully mock react-redux
vi.mock("react-redux", () => ({
  useSelector: vi.fn(),
  useDispatch: () => mockDispatch,
}));

// Router
vi.mock("react-router-dom", () => ({
  NavLink: ({
    children,
    className,
  }: {
    children: React.ReactNode;
    className: (props: { isActive: boolean }) => string;
  }) => <div className={className({ isActive: isActiveMock })}>{children}</div>,
  useNavigate: () => mockNavigate,
}));

// Auth actions
vi.mock("../../../store/auth/authSlice", () => ({
  serverLogout: vi.fn(() => ({ type: "auth/logout" })),
}));

// UI actions
vi.mock("../../../store/ui/uiSlice", () => ({
  toggleSidebar: vi.fn(() => ({ type: "ui/toggleSidebar" })),
}));

// Icons
vi.mock("@heroicons/react/24/outline", () => ({
  HomeIcon: () => <svg />,
  ClipboardDocumentListIcon: () => <svg />,
  CheckBadgeIcon: () => <svg />,
  TagIcon: () => <svg />,
  ArrowPathIcon: () => <svg />,
  UserCircleIcon: () => <svg />,
  BellIcon: () => <svg />,
  ArrowRightOnRectangleIcon: () => <svg />,
}));

// ------------------ HELPER ------------------

const renderSidebar = (
  collapsed: boolean,
  role: "Pharmacist" | "Technician" | "Manager"
) => {
  vi.spyOn(reactRedux, "useSelector").mockImplementation((selector: any) =>
    selector({
      ui: { sidebarCollapsed: collapsed },
    })
  );

  render(
    <Sidebar
      user={{
        id: "1",
        name: "Test User",
        role,
      }}
    />
  );
};

// ------------------ TESTS ------------------

describe("Sidebar Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    isActiveMock = false;
  });

  test("renders expanded sidebar with pharmacist menu", () => {
    renderSidebar(false, "Pharmacist");

    expect(screen.getByText("Menu")).toBeInTheDocument();
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Manual Prescription Entry")).toBeInTheDocument();
    expect(screen.getByText("Logout")).toBeInTheDocument();
    expect(screen.getByText("© 2025 Pharmacy App")).toBeInTheDocument();
  });

  test("renders collapsed sidebar without labels", () => {
    renderSidebar(true, "Pharmacist");

    expect(screen.queryByText("Menu")).not.toBeInTheDocument();
    expect(screen.queryByText("Dashboard")).not.toBeInTheDocument();
    expect(screen.queryByText("© 2025 Pharmacy App")).not.toBeInTheDocument();
    expect(screen.getByText("➡️")).toBeInTheDocument();
  });

  test("renders technician menu items", () => {
    renderSidebar(false, "Technician");

    expect(screen.getByText("Prescription Status")).toBeInTheDocument();
    expect(screen.getByText("Alerts")).toBeInTheDocument();
  });

  test("renders manager menu items", () => {
    renderSidebar(false, "Manager");

    expect(screen.getByText("Dashboard")).toBeInTheDocument();
  });

  test("shows left arrow icon when expanded", () => {
    renderSidebar(false, "Pharmacist");
    expect(screen.getByText("⬅️")).toBeInTheDocument();
  });

  test("dispatches toggleSidebar on toggle click", () => {
    renderSidebar(false, "Pharmacist");

    fireEvent.click(screen.getByText("⬅️"));

    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({ type: "ui/toggleSidebar" })
    );
  });

  test("applies active nav link styles when route is active", () => {
    isActiveMock = true;
    renderSidebar(false, "Pharmacist");

    const dashboard = screen.getByText("Dashboard");
    expect(dashboard.parentElement?.className).toContain("bg-green-50");
  });
  

  test("dispatches logout and navigates to login", () => {
    renderSidebar(false, "Pharmacist");

    fireEvent.click(screen.getByText("Logout"));

    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({ type: "auth/logout" })
    );
    expect(mockNavigate).toHaveBeenCalledWith("/login");
  });
});
