import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import "@testing-library/jest-dom";
import Tabs from "./Tabs";

describe("Tabs component", () => {
  const tabs = ["All", "Active", "Completed"];
  const onChange = vi.fn();

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders all tabs", () => {
    render(
      <Tabs
        tabs={tabs}
        active="All"
        onChange={onChange}
      />
    );

    tabs.forEach((tab) => {
      expect(screen.getByText(tab)).toBeInTheDocument();
    });
  });

  it("highlights the active tab", () => {
    render(
      <Tabs
        tabs={tabs}
        active="Active"
        onChange={onChange}
      />
    );

    const activeTab = screen.getByText("Active");
    const inactiveTab = screen.getByText("All");

    expect(activeTab).toHaveClass("border-b-2", "border-blue-600", "text-blue-600");
    expect(inactiveTab).toHaveClass("text-gray-500");
  });

  it("calls onChange with correct tab when clicked", () => {
    render(
      <Tabs
        tabs={tabs}
        active="All"
        onChange={onChange}
      />
    );

    fireEvent.click(screen.getByText("Completed"));

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith("Completed");
  });

  it("calls onChange for each tab click", () => {
    render(
      <Tabs
        tabs={tabs}
        active="All"
        onChange={onChange}
      />
    );

    fireEvent.click(screen.getByText("Active"));
    fireEvent.click(screen.getByText("Completed"));

    expect(onChange).toHaveBeenCalledTimes(2);
    expect(onChange).toHaveBeenNthCalledWith(1, "Active");
    expect(onChange).toHaveBeenNthCalledWith(2, "Completed");
  });

  it("does not break when clicking the already active tab", () => {
    render(
      <Tabs
        tabs={tabs}
        active="All"
        onChange={onChange}
      />
    );

    fireEvent.click(screen.getByText("All"));

    expect(onChange).toHaveBeenCalledWith("All");
  });

  it("renders correct number of tab buttons", () => {
    const { container } = render(
      <Tabs
        tabs={tabs}
        active="All"
        onChange={onChange}
      />
    );

    const buttons = container.querySelectorAll("button");
    expect(buttons.length).toBe(tabs.length);
  });
});
