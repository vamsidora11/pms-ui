import { render, screen } from "@testing-library/react";
import TopNavBar from "./TopNavBar";
import { vi } from "vitest";
import React from "react";

// ---------------- ICON MOCKS ----------------

vi.mock("lucide-react", () => ({
  Bell: () => <svg data-testid="bell-icon" />,
  Settings: () => <svg data-testid="settings-icon" />,
  ChevronDown: () => <svg data-testid="chevron-icon" />,
}));

// ---------------- TESTS ----------------

describe("TopNavBar", () => {
  test("renders branding, icons, and user info", () => {
    render(
      <TopNavBar
        userName="Vamsi"
        userRole="Pharmacist"
        avatar="avatar.png"
      />
    );

    expect(screen.getByText("MediFlow")).toBeInTheDocument();
    expect(screen.getByText("Pharmacy Management System")).toBeInTheDocument();

    expect(screen.getByText("Vamsi")).toBeInTheDocument();
    expect(screen.getByText("Pharmacist")).toBeInTheDocument();

    expect(screen.getByTestId("bell-icon")).toBeInTheDocument();
    expect(screen.getByTestId("settings-icon")).toBeInTheDocument();
    expect(screen.getByTestId("chevron-icon")).toBeInTheDocument();
  });

  test("uses provided avatar when avatar prop exists", () => {
    render(
      <TopNavBar
        userName="Vamsi"
        userRole="Technician"
        avatar="custom-avatar.png"
      />
    );

    const img = screen.getByAltText("Vamsi") as HTMLImageElement;
    expect(img.src).toContain("custom-avatar.png");
  });

  test("uses fallback avatar when avatar prop is not provided", () => {
    render(
      <TopNavBar
        userName="Vamsi"
        userRole="Manager"
      />
    );

    const img = screen.getByAltText("Vamsi") as HTMLImageElement;
    expect(img.src).toContain("https://ui-avatars.com/api/?name=Vamsi");
  });

  test("renders notification indicator dot and avatar", () => {
    const { container } = render(
      <TopNavBar
        userName="Alex"
        userRole="Manager"
        avatar="alex.png"
      />
    );

    const dot = container.querySelector(".bg-red-500");
    expect(dot).toBeInTheDocument();

    expect(screen.getByAltText("Alex")).toBeInTheDocument();
    expect(screen.getByTestId("chevron-icon")).toBeInTheDocument();
  });
});
