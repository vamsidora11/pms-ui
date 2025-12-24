import { render, screen, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import "@testing-library/jest-dom";
import Toast from "./Toast";

describe("Toast component", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it("renders the toast message", () => {
    render(
      <Toast
        message="Saved successfully"
        onClose={vi.fn()}
      />
    );

    expect(
      screen.getByText("Saved successfully")
    ).toBeInTheDocument();
  });

  it("applies default info styling", () => {
    render(
      <Toast
        message="Info message"
        onClose={vi.fn()}
      />
    );

    const toast = screen.getByText("Info message");
    expect(toast.className).toContain("bg-blue-600");
  });

  it("applies success styling", () => {
    render(
      <Toast
        message="Success!"
        type="success"
        onClose={vi.fn()}
      />
    );

    const toast = screen.getByText("Success!");
    expect(toast.className).toContain("bg-green-600");
  });

  it("applies error styling", () => {
    render(
      <Toast
        message="Error occurred"
        type="error"
        onClose={vi.fn()}
      />
    );

    const toast = screen.getByText("Error occurred");
    expect(toast.className).toContain("bg-red-600");
  });

  it("applies warning styling", () => {
    render(
      <Toast
        message="Warning"
        type="warning"
        onClose={vi.fn()}
      />
    );

    const toast = screen.getByText("Warning");
    expect(toast.className).toContain("bg-yellow-600");
  });

  it("calls onClose after default duration", () => {
    const onClose = vi.fn();

    render(
      <Toast
        message="Auto close"
        onClose={onClose}
      />
    );

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose after custom duration", () => {
    const onClose = vi.fn();

    render(
      <Toast
        message="Custom duration"
        duration={1000}
        onClose={onClose}
      />
    );

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("clears timer on unmount", () => {
    const onClose = vi.fn();

    const { unmount } = render(
      <Toast
        message="Unmount test"
        duration={2000}
        onClose={onClose}
      />
    );

    unmount();

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(onClose).not.toHaveBeenCalled();
  });
});
