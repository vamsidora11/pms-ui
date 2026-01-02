import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Input from "./Input";

describe("Input component", () => {
  test("renders input with placeholder", () => {
    render(
      <Input
        value=""
        placeholder="Enter name"
        onChange={() => {}}
      />
    );

    expect(
      screen.getByPlaceholderText(/enter name/i)
    ).toBeInTheDocument();
  });

  test("renders label when provided", () => {
    render(
      <Input
        label="Username"
        value=""
        onChange={() => {}}
      />
    );

    expect(
      screen.getByText("Username")
    ).toBeInTheDocument();
  });

  test("shows required asterisk when required=true", () => {
    render(
      <Input
        label="Email"
        required
        value=""
        onChange={() => {}}
      />
    );

    expect(
      screen.getByText("*")
    ).toBeInTheDocument();
  });

  test("calls onChange when typing", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(
      <Input
        value=""
        onChange={onChange}
      />
    );

    const input = screen.getByRole("textbox");
    await user.type(input, "abc");

    expect(onChange).toHaveBeenCalled();
  });

  test("disables input when disabled=true", () => {
    render(
      <Input
        value=""
        disabled
        onChange={() => {}}
      />
    );

    const input = screen.getByRole("textbox");
    expect(input).toBeDisabled();
  });

  test("renders error message when error prop is provided", () => {
    render(
      <Input
        value=""
        error="Invalid input"
        onChange={() => {}}
      />
    );

    expect(
      screen.getByText("Invalid input")
    ).toBeInTheDocument();
  });

  test("renders left and right icons when provided", () => {
    render(
      <Input
        value=""
        onChange={() => {}}
        leftIcon={<span data-testid="left-icon">L</span>}
        rightIcon={<span data-testid="right-icon">R</span>}
      />
    );

    expect(
      screen.getByTestId("left-icon")
    ).toBeInTheDocument();

    expect(
      screen.getByTestId("right-icon")
    ).toBeInTheDocument();
  });
});
