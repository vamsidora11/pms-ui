import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import TopNavBar from "./TopNavBar";
import React from "react";

vi.mock("lucide-react", () => ({
  Bell: (props: any) => <svg data-testid="bell-icon" {...props} />,
  Settings: (props: any) => <svg data-testid="settings-icon" {...props} />,
  ChevronDown: (props: any) => <svg data-testid="chevron-icon" {...props} />,
}));

describe("TopNavBar Component", () => {
  const defaultProps = {
    userName: "John Doe",
    userRole: "pharmacist" as const,  // ✔️ FIXED
    avatar: undefined,
  };

  it("renders branding with MediFlow and subtitle", () => {
    render(<TopNavBar {...defaultProps} />);

    expect(screen.getByText("MediFlow")).toBeInTheDocument();
    expect(
      screen.getByText("Pharmacy Management System")
    ).toBeInTheDocument();
  });

  it("renders user name and role badge", () => {
    render(<TopNavBar {...defaultProps} />);
    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText("pharmacist")).toBeInTheDocument();
  });

  it("renders bell icon with notification dot", () => {
    render(<TopNavBar {...defaultProps} />);
    expect(screen.getByTestId("bell-icon")).toBeInTheDocument();
    expect(document.querySelector("span.bg-red-500")).toBeInTheDocument();
  });

  it("renders fallback avatar when avatar not provided", () => {
    render(<TopNavBar {...defaultProps} />);
    const img = screen.getByRole("img");
    expect(img).toHaveAttribute(
      "src",
      "https://ui-avatars.com/api/?name=John Doe"
    );
  });

  it("renders provided avatar", () => {
    render(
      <TopNavBar
        {...defaultProps}
        avatar="https://example.com/avatar.png"
      />
    );

    const img = screen.getByRole("img");
    expect(img).toHaveAttribute("src", "https://example.com/avatar.png");
  });

  it("renders header element", () => {
    render(<TopNavBar {...defaultProps} />);
    expect(screen.getByRole("banner")).toBeInTheDocument();
  });
});