import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";


import Breadcrumbs from "./Breadcrumbs";

/* =====================================================
   MOCK lucide-react ICONS
===================================================== */

vi.mock("lucide-react", () => ({
  Home: () => <svg data-testid="home-icon" />,
  ChevronRight: () => <svg data-testid="chevron-icon" />,
}));

/* =====================================================
   TESTS
===================================================== */

describe("Breadcrumbs - Full Coverage", () => {
  it("renders home icon", () => {
    render(<Breadcrumbs items={[]} />);

    expect(screen.getByTestId("home-icon")).toBeInTheDocument();
  });

  it("renders single breadcrumb item", () => {
    render(
      <Breadcrumbs
        items={[
          {
            label: "Dashboard",
          },
        ]}
      />
    );

    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByTestId("chevron-icon")).toBeInTheDocument();
  });

  it("renders multiple breadcrumb items", () => {
    render(
      <Breadcrumbs
        items={[
          { label: "Dashboard" },
          { label: "Users" },
          { label: "Details" },
        ]}
      />
    );

    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Users")).toBeInTheDocument();
    expect(screen.getByText("Details")).toBeInTheDocument();

    // There should be 3 chevron icons (one per item)
    expect(screen.getAllByTestId("chevron-icon")).toHaveLength(3);
  });

  it("calls onClick handler when breadcrumb is clicked", () => {
    const mockClick = vi.fn();

    render(
      <Breadcrumbs
        items={[
          {
            label: "Dashboard",
            onClick: mockClick,
          },
        ]}
      />
    );

    fireEvent.click(screen.getByText("Dashboard"));

    expect(mockClick).toHaveBeenCalledTimes(1);
  });

  it("does not crash if onClick is undefined", () => {
    render(
      <Breadcrumbs
        items={[
          {
            label: "Dashboard",
          },
        ]}
      />
    );

    fireEvent.click(screen.getByText("Dashboard"));
    // No assertion needed — test passes if no error thrown
  });

  it("renders custom icon if provided", () => {
    const CustomIcon = () => <span data-testid="custom-icon">I</span>;

    render(
      <Breadcrumbs
        items={[
          {
            label: "Dashboard",
            icon: <CustomIcon />,
          },
        ]}
      />
    );

    expect(screen.getByTestId("custom-icon")).toBeInTheDocument();
  });

  it("renders correct number of buttons", () => {
    render(
      <Breadcrumbs
        items={[
          { label: "A" },
          { label: "B" },
          { label: "C" },
        ]}
      />
    );

    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(3);
  });

  it("renders nothing except home icon when items empty", () => {
    render(<Breadcrumbs items={[]} />);

    expect(screen.getByTestId("home-icon")).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
