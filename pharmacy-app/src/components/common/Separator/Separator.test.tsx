import { render, screen } from "@testing-library/react";
import Separator from "./Separator";

describe("Separator component", () => {
  test("renders a separator element", () => {
    render(<Separator />);

    const separator = screen.getByRole("separator");
    expect(separator).toBeInTheDocument();
  });

  test("defaults to horizontal orientation", () => {
    render(<Separator />);

    const separator = screen.getByRole("separator");
    expect(separator).toHaveAttribute("aria-orientation", "horizontal");
  });

  test("applies vertical orientation when specified", () => {
    render(<Separator orientation="vertical" />);

    const separator = screen.getByRole("separator");
    expect(separator).toHaveAttribute("aria-orientation", "vertical");
  });

  test("applies default variant styles", () => {
    const { container } = render(<Separator />);

    const separator = container.firstChild as HTMLElement;
    expect(separator.className).toContain("bg-gray-300");
  });

  test("applies muted variant styles", () => {
    const { container } = render(<Separator variant="muted" />);

    const separator = container.firstChild as HTMLElement;
    expect(separator.className).toContain("bg-gray-200");
  });

  test("applies strong variant styles", () => {
    const { container } = render(<Separator variant="strong" />);

    const separator = container.firstChild as HTMLElement;
    expect(separator.className).toContain("bg-gray-400");
  });

  test("applies size classes based on orientation and size", () => {
    const { container } = render(
      <Separator orientation="horizontal" size="lg" />
    );

    const separator = container.firstChild as HTMLElement;
    expect(separator.className).toContain("h-[4px]");
  });

  test("applies vertical size classes correctly", () => {
    const { container } = render(
      <Separator orientation="vertical" size="sm" />
    );

    const separator = container.firstChild as HTMLElement;
    expect(separator.className).toContain("w-px");
  });

  test("applies custom className", () => {
    const { container } = render(
      <Separator className="custom-separator" />
    );

    const separator = container.firstChild as HTMLElement;
    expect(separator.className).toContain("custom-separator");
  });
});
