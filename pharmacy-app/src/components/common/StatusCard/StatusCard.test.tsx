import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import "@testing-library/jest-dom";
import StatusCard from "./StatusCard";

describe("StatusCard component", () => {
  const baseProps = {
    title: "Total Prescriptions",
    value: 42,
  };

  it("renders title and value", () => {
    render(<StatusCard {...baseProps} />);

    expect(
      screen.getByText("Total Prescriptions")
    ).toBeInTheDocument();

    expect(
      screen.getByText("42")
    ).toBeInTheDocument();
  });

  it("renders value as string", () => {
    render(
      <StatusCard
        title="Status"
        value="Active"
      />
    );

    expect(
      screen.getByText("Active")
    ).toBeInTheDocument();
  });

  it("renders icon when icon prop is provided", () => {
    render(
      <StatusCard
        {...baseProps}
        icon={<span data-testid="status-icon">I</span>}
      />
    );

    expect(
      screen.getByTestId("status-icon")
    ).toBeInTheDocument();
  });

  it("does not render icon container when icon is not provided", () => {
    render(<StatusCard {...baseProps} />);

    expect(
      screen.queryByTestId("status-icon")
    ).not.toBeInTheDocument();
  });

  it("applies default background and text color classes", () => {
    const { container } = render(<StatusCard {...baseProps} />);
    const card = container.firstChild as HTMLElement;

    expect(card.className).toContain("bg-gray-100");
    expect(card.className).toContain("text-gray-800");
  });

  it("applies custom background and text color classes", () => {
    const { container } = render(
      <StatusCard
        {...baseProps}
        bgColor="bg-green-100"
        textColor="text-green-800"
      />
    );

    const card = container.firstChild as HTMLElement;

    expect(card.className).toContain("bg-green-100");
    expect(card.className).toContain("text-green-800");
  });

  it("calls onClick handler when card is clicked", () => {
    const onClick = vi.fn();

    const { container } = render(
      <StatusCard
        {...baseProps}
        onClick={onClick}
      />
    );

    fireEvent.click(container.firstChild as HTMLElement);

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("does not throw when clicked without onClick handler", () => {
    const { container } = render(<StatusCard {...baseProps} />);

    expect(() => {
      fireEvent.click(container.firstChild as HTMLElement);
    }).not.toThrow();
  });
});
