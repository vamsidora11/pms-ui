import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import "@testing-library/jest-dom";
import SummaryCard from "./SummaryCard";

describe("SummaryCard component", () => {
  const baseProps = {
    title: "Total Sales",
    value: 1200,
  };

  it("renders title and value", () => {
    render(<SummaryCard {...baseProps} />);

    expect(
      screen.getByText("Total Sales")
    ).toBeInTheDocument();

    expect(
      screen.getByText("1200")
    ).toBeInTheDocument();
  });

  it("renders value when value is a string", () => {
    render(
      <SummaryCard
        title="Status"
        value="Completed"
      />
    );

    expect(
      screen.getByText("Completed")
    ).toBeInTheDocument();
  });

  it("renders icon when icon prop is provided", () => {
    render(
      <SummaryCard
        {...baseProps}
        icon={<span data-testid="summary-icon">I</span>}
      />
    );

    expect(
      screen.getByTestId("summary-icon")
    ).toBeInTheDocument();
  });

  it("does not render icon when icon prop is not provided", () => {
    render(<SummaryCard {...baseProps} />);

    expect(
      screen.queryByTestId("summary-icon")
    ).not.toBeInTheDocument();
  });

  it("renders footer text when footer prop is provided", () => {
    render(
      <SummaryCard
        {...baseProps}
        footer="Compared to last week"
      />
    );

    expect(
      screen.getByText("Compared to last week")
    ).toBeInTheDocument();
  });

  it("does not render footer when footer prop is not provided", () => {
    render(<SummaryCard {...baseProps} />);

    expect(
      screen.queryByText("Compared to last week")
    ).not.toBeInTheDocument();
  });

  it("renders title, value, and footer together", () => {
    render(
      <SummaryCard
        title="Revenue"
        value={5000}
        footer="Up by 10%"
      />
    );

    expect(screen.getByText("Revenue")).toBeInTheDocument();
    expect(screen.getByText("5000")).toBeInTheDocument();
    expect(screen.getByText("Up by 10%")).toBeInTheDocument();
  });
});
