import { render, screen } from "@testing-library/react";
import SectionHeader from "./SectionHeader";

describe("SectionHeader component", () => {
  test("renders title", () => {
    render(<SectionHeader title="Patient Details" />);

    expect(
      screen.getByText("Patient Details")
    ).toBeInTheDocument();
  });

  test("renders subtitle when provided", () => {
    render(
      <SectionHeader
        title="Patient Details"
        subtitle="Basic information"
      />
    );

    expect(
      screen.getByText("Basic information")
    ).toBeInTheDocument();
  });

  test("does not render subtitle when not provided", () => {
    render(<SectionHeader title="Patient Details" />);

    expect(
      screen.queryByText("Basic information")
    ).not.toBeInTheDocument();
  });

  test("renders action when provided", () => {
    render(
      <SectionHeader
        title="Patient Details"
        action={<button>Action</button>}
      />
    );

    expect(
      screen.getByRole("button", { name: /action/i })
    ).toBeInTheDocument();
  });

  test("does not render action container when action is not provided", () => {
    render(<SectionHeader title="Patient Details" />);

    expect(
      screen.queryByRole("button")
    ).not.toBeInTheDocument();
  });
});
