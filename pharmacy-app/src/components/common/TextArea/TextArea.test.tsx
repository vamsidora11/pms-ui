import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import "@testing-library/jest-dom";
import Textarea from "./TextArea";

describe("Textarea component", () => {
  it("renders textarea element", () => {
    render(<Textarea />);
    expect(screen.getByRole("textbox")).toBeInTheDocument();
  });

  it("renders with placeholder", () => {
    render(<Textarea placeholder="Enter message" />);
    expect(
      screen.getByPlaceholderText("Enter message")
    ).toBeInTheDocument();
  });

  it("renders with default rows", () => {
    render(<Textarea />);
    const textarea = screen.getByRole("textbox");
    expect(textarea).toHaveAttribute("rows", "3");
  });

  it("renders with custom rows", () => {
    render(<Textarea rows={5} />);
    const textarea = screen.getByRole("textbox");
    expect(textarea).toHaveAttribute("rows", "5");
  });

  it("renders with value", () => {
    render(<Textarea value="Hello world" />);
    const textarea = screen.getByRole("textbox") as HTMLTextAreaElement;
    expect(textarea.value).toBe("Hello world");
  });

  it("calls onChange when value changes", () => {
    const onChange = vi.fn();
    render(<Textarea onChange={onChange} />);

    const textarea = screen.getByRole("textbox");
    fireEvent.change(textarea, {
      target: { value: "New text" },
    });

    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it("applies default variant styles", () => {
    render(<Textarea />);
    const textarea = screen.getByRole("textbox");

    expect(textarea.className).toContain("border-gray-300");
    expect(textarea.className).toContain("focus:ring-blue-500");
  });

  it("applies error variant styles", () => {
    render(<Textarea variant="error" />);
    const textarea = screen.getByRole("textbox");

    expect(textarea.className).toContain("border-red-500");
    expect(textarea.className).toContain("focus:ring-red-500");
  });

  it("applies success variant styles", () => {
    render(<Textarea variant="success" />);
    const textarea = screen.getByRole("textbox");

    expect(textarea.className).toContain("border-green-500");
    expect(textarea.className).toContain("focus:ring-green-500");
  });

  it("applies size styles correctly", () => {
    const { rerender } = render(<Textarea size="sm" />);
    let textarea = screen.getByRole("textbox");
    expect(textarea.className).toContain("px-3");

    rerender(<Textarea size="lg" />);
    textarea = screen.getByRole("textbox");
    expect(textarea.className).toContain("py-3");
  });

  it("is disabled when disabled prop is true", () => {
    render(<Textarea disabled />);
    const textarea = screen.getByRole("textbox");

    expect(textarea).toBeDisabled();
    expect(textarea.className).toContain("cursor-not-allowed");
  });

  it("applies custom className", () => {
    render(<Textarea className="custom-class" />);
    const textarea = screen.getByRole("textbox");

    expect(textarea).toHaveClass("custom-class");
  });

  it("does not throw if onChange is not provided", () => {
    render(<Textarea />);
    const textarea = screen.getByRole("textbox");

    expect(() => {
      fireEvent.change(textarea, {
        target: { value: "Safe change" },
      });
    }).not.toThrow();
  });
});
