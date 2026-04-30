import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import type { Country, Value } from "react-phone-number-input";
import AppPhoneInput from "./PhoneInput";

/**
 * Properly typed mock props (NO `any`)
 */
type MockPhoneInputProps = {
  value?: Value;
  onChange?: (value?: Value) => void;
  country?: Country;
  onCountryChange?: (country?: Country) => void;
  disabled?: boolean;
};

vi.mock("react-phone-number-input", () => {
  return {
    default: ({
      value,
      onChange,
      country,
      onCountryChange,
      disabled,
    }: MockPhoneInputProps) => (
      <div>
        <input
          data-testid="phone-input"
          value={value ?? ""}
          disabled={disabled}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            onChange?.(e.target.value as Value)
          }
        />
        <button
          data-testid="country-change"
          onClick={() => onCountryChange?.("US")}
        >
          Change Country
        </button>
        <span data-testid="country-value">{country}</span>
      </div>
    ),
  };
});

describe("AppPhoneInput", () => {
  const defaultProps = {
    label: "Phone Number",
    value: "",
    onChange: vi.fn(),
  };

  it("renders label correctly", () => {
    render(<AppPhoneInput {...defaultProps} />);
    expect(screen.getByText("Phone Number")).toBeInTheDocument();
  });

  it("renders with default country IN", () => {
    render(<AppPhoneInput {...defaultProps} />);
    expect(screen.getByTestId("country-value")).toHaveTextContent("IN");
  });

  it("renders with custom default country", () => {
    render(<AppPhoneInput {...defaultProps} defaultCountry="US" />);
    expect(screen.getByTestId("country-value")).toHaveTextContent("US");
  });

  it("calls onChange when phone number changes", () => {
    const handleChange = vi.fn();

    render(
      <AppPhoneInput
        {...defaultProps}
        onChange={handleChange}
      />
    );

    fireEvent.change(screen.getByTestId("phone-input"), {
      target: { value: "+919876543210" },
    });

    expect(handleChange).toHaveBeenCalledWith("+919876543210");
  });

  it("updates country when changed", () => {
    render(<AppPhoneInput {...defaultProps} />);
    fireEvent.click(screen.getByTestId("country-change"));
    expect(screen.getByTestId("country-value")).toHaveTextContent("US");
  });

  it("disables phone input when disabled prop is true", () => {
    render(<AppPhoneInput {...defaultProps} disabled />);
    expect(screen.getByTestId("phone-input")).toBeDisabled();
  });

  it("shows error message", () => {
    render(
      <AppPhoneInput
        {...defaultProps}
        error="Invalid phone number"
      />
    );

    expect(
      screen.getByText("Invalid phone number")
    ).toBeInTheDocument();
  });

  it("shows warning message when no error", () => {
    render(
      <AppPhoneInput
        {...defaultProps}
        warning="Phone format looks unusual"
      />
    );

    expect(
      screen.getByText("Phone format looks unusual")
    ).toBeInTheDocument();
  });

  it("prioritizes error over warning", () => {
    render(
      <AppPhoneInput
        {...defaultProps}
        error="Error message"
        warning="Warning message"
      />
    );

    expect(screen.getByText("Error message")).toBeInTheDocument();
    expect(
      screen.queryByText("Warning message")
    ).not.toBeInTheDocument();
  });

  it("applies error styling class when error exists", () => {
    const { container } = render(
      <AppPhoneInput {...defaultProps} error="Error" />
    );

    const wrapper = container.querySelector(".phone-input-shell");
    expect(wrapper?.className).toContain("ring-red-500");
  });

  it("applies disabled styling when disabled", () => {
    const { container } = render(
      <AppPhoneInput {...defaultProps} disabled />
    );

    const wrapper = container.querySelector(".phone-input-shell");
    expect(wrapper?.className).toContain("cursor-not-allowed");
  });
});
