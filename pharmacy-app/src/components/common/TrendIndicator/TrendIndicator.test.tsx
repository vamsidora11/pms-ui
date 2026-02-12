import { render, screen } from "@testing-library/react";
import TrendIndicator from "./TrendIndicator";

describe("TrendIndicator component", () => {
  test("renders positive value with green styling and + sign", () => {
    const { container } = render(<TrendIndicator value={10} />);

    const wrapper = container.firstChild as HTMLElement;

    expect(wrapper.className).toContain("text-green-600");
    expect(wrapper.className).toContain("bg-green-50");

    expect(screen.getByText("+10%")).toBeInTheDocument();
  });

  test("renders negative value with red styling", () => {
    const { container } = render(<TrendIndicator value={-5} />);

    const wrapper = container.firstChild as HTMLElement;

    expect(wrapper.className).toContain("text-red-600");
    expect(wrapper.className).toContain("bg-red-50");

    expect(screen.getByText("-5%")).toBeInTheDocument();
  });

  test("renders zero value with neutral styling", () => {
    const { container } = render(<TrendIndicator value={0} />);

    const wrapper = container.firstChild as HTMLElement;

    expect(wrapper.className).toContain("text-gray-600");
    expect(wrapper.className).toContain("bg-gray-50");

    expect(screen.getByText("0%")).toBeInTheDocument();
  });

  test("applies inverse logic (negative becomes good/green)", () => {
    const { container } = render(
      <TrendIndicator value={-10} inverse />
    );

    const wrapper = container.firstChild as HTMLElement;

    expect(wrapper.className).toContain("text-green-600");
    expect(wrapper.className).toContain("bg-green-50");
  });

  test("applies custom className", () => {
    const { container } = render(
      <TrendIndicator value={5} className="custom-class" />
    );

    const wrapper = container.firstChild as HTMLElement;

    expect(wrapper.className).toContain("custom-class");
  });

  test("does not render + sign for zero or negative values", () => {
    render(<TrendIndicator value={0} />);
    expect(screen.queryByText("+0%")).not.toBeInTheDocument();

    render(<TrendIndicator value={-3} />);
    expect(screen.queryByText("+-3%")).not.toBeInTheDocument();
  });
});
