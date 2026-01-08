import { render, screen } from "@testing-library/react";
import AppLayout from "./Applayout";
import { vi } from "vitest";
import * as reactRedux from "react-redux";
import React from "react";

// ---------------- MOCK react-redux ----------------
// IMPORTANT: prevents real store / persistReducer from loading
vi.mock("react-redux", () => ({
  useSelector: vi.fn(),
}));

// ---------------- MOCK CHILD COMPONENTS ----------------

vi.mock("../Sidebar/Sidebar", () => ({
  __esModule: true,
  default: ({ user }: { user: { role: string } }) => (
    <div data-testid="sidebar">Sidebar - {user.role}</div>
  ),
}));

vi.mock("../TopNavBar/TopNavBar", () => ({
  __esModule: true,
  default: ({
    userName,
    userRole,
  }: {
    userName: string;
    userRole: string;
  }) => (
    <div data-testid="top-navbar">
      {userName} - {userRole}
    </div>
  ),
}));

vi.mock("react-router-dom", () => ({
  Outlet: () => <div data-testid="outlet" />,
}));

// ---------------- TESTS ----------------

describe("AppLayout", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  test("returns null when user is not present", () => {
    vi.spyOn(reactRedux, "useSelector").mockImplementation((selector: any) =>
      selector({ auth: { user: null } })
    );

    const { container } = render(<AppLayout />);

    expect(container.firstChild).toBeNull();
  });

  test("renders layout when user is present", () => {
    const mockUser = {
      id: "1",
      username: "Vamsi",
      role: "Pharmacist",
      avatarUrl: "avatar.png",
    };

    vi.spyOn(reactRedux, "useSelector").mockImplementation((selector: any) =>
      selector({ auth: { user: mockUser } })
    );

    render(<AppLayout />);

    // Top navbar rendered
    expect(screen.getByTestId("top-navbar")).toHaveTextContent(
      "Vamsi - Pharmacist"
    );

    // Sidebar rendered
    expect(screen.getByTestId("sidebar")).toHaveTextContent("Pharmacist");

    // Outlet rendered
    expect(screen.getByTestId("outlet")).toBeInTheDocument();
  });
});
