import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";

import Dropdown, {
  type DropdownOption,
} from "./Dropdown";

/* =====================================================
   TESTS
===================================================== */

describe("Dropdown - Full Coverage", () => {
  it("renders without label when label not provided", () => {
    render(
      <Dropdown
        value="A"
        onChange={() => {}}
        options={["A", "B"]}
      />
    );

    expect(screen.queryByText("Test Label")).not.toBeInTheDocument();
    expect(screen.getByRole("combobox")).toBeInTheDocument();
  });

  it("renders label when provided", () => {
    render(
      <Dropdown
        label="Test Label"
        value="A"
        onChange={() => {}}
        options={["A", "B"]}
      />
    );

    expect(screen.getByText("Test Label")).toBeInTheDocument();
  });

  it("renders string options correctly", () => {
    render(
      <Dropdown
        value="A"
        onChange={() => {}}
        options={["A", "B"]}
      />
    );

    expect(screen.getByRole("option", { name: "A" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "B" })).toBeInTheDocument();
  });

  it("renders object options correctly", () => {
    const options: DropdownOption[] = [
      { label: "Option 1", value: "1" },
      { label: "Option 2", value: "2" },
    ];

    render(
      <Dropdown
        value="1"
        onChange={() => {}}
        options={options}
      />
    );

    expect(screen.getByRole("option", { name: "Option 1" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Option 2" })).toBeInTheDocument();
  });

  it("renders mixed string and object options", () => {
    render(
      <Dropdown
        value="A"
        onChange={() => {}}
        options={[
          "A",
          { label: "Custom B", value: "B" },
        ]}
      />
    );

    expect(screen.getByRole("option", { name: "A" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Custom B" })).toBeInTheDocument();
  });

  it("calls onChange when selection changes", () => {
    const handleChange = vi.fn();

    render(
      <Dropdown
        value="A"
        onChange={handleChange}
        options={["A", "B"]}
      />
    );

    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: "B" },
    });

    expect(handleChange).toHaveBeenCalledWith("B");
  });

  it("respects disabled prop", () => {
    render(
      <Dropdown
        value="A"
        onChange={() => {}}
        options={["A", "B"]}
        disabled
      />
    );

    expect(screen.getByRole("combobox")).toBeDisabled();
  });

  it("applies custom className to wrapper", () => {
    const { container } = render(
      <Dropdown
        value="A"
        onChange={() => {}}
        options={["A", "B"]}
        className="custom-wrapper"
      />
    );

    expect(container.firstChild).toHaveClass("custom-wrapper");
  });

  it("applies selectClassName to select element", () => {
    render(
      <Dropdown
        value="A"
        onChange={() => {}}
        options={["A", "B"]}
        selectClassName="custom-select"
      />
    );

    expect(screen.getByRole("combobox")).toHaveClass("custom-select");
  });

  it("applies id correctly", () => {
    render(
      <Dropdown
        value="A"
        onChange={() => {}}
        options={["A", "B"]}
        id="my-dropdown"
      />
    );

    expect(screen.getByRole("combobox")).toHaveAttribute("id", "my-dropdown");
  });

  it("reflects controlled value", () => {
    render(
      <Dropdown
        value="B"
        onChange={() => {}}
        options={["A", "B"]}
      />
    );

    expect(screen.getByRole("combobox")).toHaveValue("B");
  });
});
