import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ErrorBoundary } from "./ErrorBoundary";
import type { FC } from "react";

/* ---------------- Test Components ---------------- */

const SafeChild: FC = () => {
  return <div>Safe Content</div>;
};

const ProblemChild: FC = () => {
  throw new Error("Test error");
};

/* ---------------- Test Suite ---------------- */

describe("ErrorBoundary", () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // Suppress React error logging in test output
    consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it("renders children when no error occurs", () => {
    render(
      <ErrorBoundary>
        <SafeChild />
      </ErrorBoundary>
    );

    expect(screen.getByText("Safe Content")).toBeInTheDocument();
  });

  it("renders default fallback when error occurs", () => {
    render(
      <ErrorBoundary>
        <ProblemChild />
      </ErrorBoundary>
    );

    expect(
      screen.getByText("Something went wrong.")
    ).toBeInTheDocument();
  });

  it("renders custom fallback when provided", () => {
    render(
      <ErrorBoundary fallback={<div>Custom Fallback UI</div>}>
        <ProblemChild />
      </ErrorBoundary>
    );

    expect(
      screen.getByText("Custom Fallback UI")
    ).toBeInTheDocument();
  });

  it("calls console.error inside componentDidCatch", () => {
    render(
      <ErrorBoundary>
        <ProblemChild />
      </ErrorBoundary>
    );

    expect(consoleSpy).toHaveBeenCalled();
  });
});
