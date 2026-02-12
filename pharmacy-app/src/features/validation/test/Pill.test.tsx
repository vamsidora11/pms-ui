import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Pill } from "../components/Pill";

describe("Pill", () => {
  it("renders children", () => {
    render(<Pill>Test Label</Pill>);

    expect(screen.getByText("Test Label")).toBeInTheDocument();
  });

  it("uses gray tone by default", () => {
    render(<Pill>Default</Pill>);

    const element = screen.getByText("Default");
    expect(element).toHaveClass("bg-gray-100");
    expect(element).toHaveClass("text-gray-700");
  });

  it("applies red tone correctly", () => {
    render(<Pill tone="red">Danger</Pill>);

    const element = screen.getByText("Danger");
    expect(element).toHaveClass("bg-red-100");
    expect(element).toHaveClass("text-red-800");
  });

  it("applies green tone correctly", () => {
    render(<Pill tone="green">Success</Pill>);

    const element = screen.getByText("Success");
    expect(element).toHaveClass("bg-green-100");
    expect(element).toHaveClass("text-green-800");
  });

  it("renders as span element", () => {
    render(<Pill>SpanCheck</Pill>);

    const element = screen.getByText("SpanCheck");
    expect(element.tagName).toBe("SPAN");
  });
});
