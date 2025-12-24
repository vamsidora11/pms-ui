import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import "@testing-library/jest-dom";
import Tooltip from "./Tooltip";

describe("Tooltip component", () => {
  it("renders children", () => {
    render(
      <Tooltip text="Tooltip text">
        <button>Hover me</button>
      </Tooltip>
    );

    expect(screen.getByText("Hover me")).toBeInTheDocument();
  });

  it("does not show tooltip text initially", () => {
    render(
      <Tooltip text="Tooltip text">
        <span>Target</span>
      </Tooltip>
    );

    expect(
      screen.queryByText("Tooltip text")
    ).not.toBeInTheDocument();
  });

  it("shows tooltip on mouse enter", () => {
    render(
      <Tooltip text="Tooltip text">
        <span>Target</span>
      </Tooltip>
    );

    const wrapper = screen.getByText("Target").parentElement!;
    fireEvent.mouseEnter(wrapper);

    expect(
      screen.getByText("Tooltip text")
    ).toBeInTheDocument();
  });

  it("hides tooltip on mouse leave", () => {
    render(
      <Tooltip text="Tooltip text">
        <span>Target</span>
      </Tooltip>
    );

    const wrapper = screen.getByText("Target").parentElement!;

    fireEvent.mouseEnter(wrapper);
    expect(screen.getByText("Tooltip text")).toBeInTheDocument();

    fireEvent.mouseLeave(wrapper);
    expect(
      screen.queryByText("Tooltip text")
    ).not.toBeInTheDocument();
  });

  it("toggles tooltip visibility correctly on repeated hover", () => {
    render(
      <Tooltip text="Tooltip text">
        <span>Target</span>
      </Tooltip>
    );

    const wrapper = screen.getByText("Target").parentElement!;

    fireEvent.mouseEnter(wrapper);
    expect(screen.getByText("Tooltip text")).toBeInTheDocument();

    fireEvent.mouseLeave(wrapper);
    expect(screen.queryByText("Tooltip text")).not.toBeInTheDocument();

    fireEvent.mouseEnter(wrapper);
    expect(screen.getByText("Tooltip text")).toBeInTheDocument();
  });

  it("supports complex child components", () => {
    render(
      <Tooltip text="Tooltip content">
        <button>
          <span>Icon</span>
          <span>Button</span>
        </button>
      </Tooltip>
    );

    const button = screen.getByRole("button");
    fireEvent.mouseEnter(button.parentElement!);

    expect(
      screen.getByText("Tooltip content")
    ).toBeInTheDocument();
  });
});
