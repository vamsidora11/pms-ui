import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import "@testing-library/jest-dom";
import ValidationMessage from "./Validationmessage";

/**
 * Mock lucide-react icons so we don't depend on SVG internals
 */
vi.mock("lucide-react", () => ({
  AlertCircle: () => <svg data-testid="error-icon" />,
  AlertTriangle: () => <svg data-testid="warning-icon" />,
  CheckCircle: () => <svg data-testid="success-icon" />,
  Info: () => <svg data-testid="info-icon" />,
}));

describe("ValidationMessage component", () => {
  it("renders nothing when message is empty", () => {
    const { container } = render(<ValidationMessage message="" />);
    expect(container.firstChild).toBeNull();
  });

  it("renders error message by default", () => {
    render(<ValidationMessage message="Invalid input" />);

    expect(screen.getByText("Invalid input")).toBeInTheDocument();
    expect(screen.getByTestId("error-icon")).toBeInTheDocument();
  });

  it("renders warning message", () => {
    render(
      <ValidationMessage
        message="Be careful"
        type="warning"
      />
    );

    expect(screen.getByText("Be careful")).toBeInTheDocument();
    expect(screen.getByTestId("warning-icon")).toBeInTheDocument();
  });

  it("renders success message", () => {
    render(
      <ValidationMessage
        message="Saved successfully"
        type="success"
      />
    );

    expect(
      screen.getByText("Saved successfully")
    ).toBeInTheDocument();
    expect(screen.getByTestId("success-icon")).toBeInTheDocument();
  });

  it("renders info message", () => {
    render(
      <ValidationMessage
        message="FYI"
        type="info"
      />
    );

    expect(screen.getByText("FYI")).toBeInTheDocument();
    expect(screen.getByTestId("info-icon")).toBeInTheDocument();
  });

  it("applies correct text color for each type", () => {
    const { rerender } = render(
      <ValidationMessage
        message="Error"
        type="error"
      />
    );

    let wrapper = screen.getByText("Error").parentElement!;
    expect(wrapper.className).toContain("text-red-600");

    rerender(
      <ValidationMessage
        message="Warning"
        type="warning"
      />
    );
    wrapper = screen.getByText("Warning").parentElement!;
    expect(wrapper.className).toContain("text-yellow-600");

    rerender(
      <ValidationMessage
        message="Success"
        type="success"
      />
    );
    wrapper = screen.getByText("Success").parentElement!;
    expect(wrapper.className).toContain("text-green-600");

    rerender(
      <ValidationMessage
        message="Info"
        type="info"
      />
    );
    wrapper = screen.getByText("Info").parentElement!;
    expect(wrapper.className).toContain("text-blue-600");
  });
});
