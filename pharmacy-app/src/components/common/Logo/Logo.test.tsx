import { render, screen } from "@testing-library/react";
import Logo from "./Logo";

describe("Logo component", () => {
  test("renders icon when icon prop is provided", () => {
    render(<Logo icon={<span data-testid="logo-icon">I</span>} />);

    expect(screen.getByTestId("logo-icon")).toBeInTheDocument();
  });

  test("renders title and subtitle when showText is true", () => {
    render(
      <Logo
        title="PharmaCare"
        subtitle="Health First"
        showText
      />
    );

    expect(screen.getByText("PharmaCare")).toBeInTheDocument();
    expect(screen.getByText("Health First")).toBeInTheDocument();
  });

  test("does not render text when showText is false", () => {
    render(
      <Logo
        title="PharmaCare"
        subtitle="Health First"
        showText={false}
      />
    );

    expect(
      screen.queryByText("PharmaCare")
    ).not.toBeInTheDocument();

    expect(
      screen.queryByText("Health First")
    ).not.toBeInTheDocument();
  });

  test("renders only title when subtitle is not provided", () => {
    render(<Logo title="PharmaCare" />);

    expect(screen.getByText("PharmaCare")).toBeInTheDocument();
  });

  test("renders only subtitle when title is not provided", () => {
    render(<Logo subtitle="Health First" />);

    expect(screen.getByText("Health First")).toBeInTheDocument();
  });

  test("applies vertical layout by default", () => {
    const { container } = render(<Logo title="Brand" />);

    expect(container.firstChild).toHaveClass("flex-col");
  });

  test("applies horizontal layout when direction is horizontal", () => {
    const { container } = render(
      <Logo title="Brand" direction="horizontal" />
    );

    expect(container.firstChild).toHaveClass("flex-row");
  });

  test("applies custom className", () => {
    const { container } = render(
      <Logo title="Brand" className="custom-logo" />
    );

    expect(container.firstChild).toHaveClass("custom-logo");
  });

  test("applies icon size using inline styles", () => {
    render(
      <Logo
        icon={<span data-testid="logo-icon">I</span>}
        size={48}
      />
    );

    const iconWrapper = screen.getByTestId("logo-icon").parentElement;
    expect(iconWrapper).toHaveStyle({
      width: "48px",
      height: "48px",
      fontSize: "48px",
    });
  });
});
