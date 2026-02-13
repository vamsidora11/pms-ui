import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import DoctorStep from "../steps/DoctorStep";

const getIdInput = () => screen.getByPlaceholderText("e.g., DR-001, DOC123");
const getNameInput = () => screen.getByPlaceholderText("e.g., John Smith");

describe("DoctorStep", () => {
  it("renders header, helper texts initially; preview hidden when id or name missing", () => {
    render(<DoctorStep doctor={{ id: "", name: "" }} onChange={vi.fn()} />);

    expect(
      screen.getByRole("heading", { name: /doctor information/i })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Enter prescribing doctor details/i)
    ).toBeInTheDocument();

    expect(getIdInput()).toBeInTheDocument();
    expect(getNameInput()).toBeInTheDocument();

    // name is empty => no warning; helper is shown
    expect(screen.getByText(/Enter the doctor's id/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Enter the full name of the prescribing doctor/i)
    ).toBeInTheDocument();

    // No preview because id || name falsy
    expect(screen.queryByText(/Preview/i)).not.toBeInTheDocument();
  });

  it("calls onChange with merged doctor when changing Doctor ID", () => {
    const onChange = vi.fn();
    render(<DoctorStep doctor={{ id: "", name: "John Smith" }} onChange={onChange} />);

    fireEvent.change(getIdInput(), { target: { value: "DR-001" } });

    // onChange receives merged output
    const last = onChange.mock.calls.at(-1)?.[0];
    expect(last).toEqual({ id: "DR-001", name: "John Smith" });
  });

  it("shows validation warning only when name prop is invalid; helper text when valid (via rerender)", () => {
    const onChange = vi.fn();
    const { rerender } = render(
      <DoctorStep doctor={{ id: "DR-123", name: "" }} onChange={onChange} />
    );

    // First, ensure helper text is shown when name is empty (no warning)
    expect(
      screen.getByText(/Enter the full name of the prescribing doctor/i)
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/Only alphabets and spaces are allowed/i)
    ).not.toBeInTheDocument();

    // Simulate user typing -> component calls onChange but DOM won’t change until parent updates props
    fireEvent.change(getNameInput(), { target: { value: "Dr. John2" } });
    const callAfterType = onChange.mock.calls.at(-1)?.[0];
    expect(callAfterType).toMatchObject({ name: "Dr. John2" });

    // Now parent "applies" invalid name via props (so validation runs on props)
    rerender(<DoctorStep doctor={{ id: "DR-123", name: "Dr. John2" }} onChange={onChange} />);

    // Warning appears, helper text hidden
    expect(
      screen.getByText(/Only alphabets and spaces are allowed/i)
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/Enter the full name of the prescribing doctor/i)
    ).not.toBeInTheDocument();

    // Parent fixes the name via props
    rerender(<DoctorStep doctor={{ id: "DR-123", name: "John Smith" }} onChange={onChange} />);

    // Warning disappears; helper text returns
    expect(
      screen.queryByText(/Only alphabets and spaces are allowed/i)
    ).not.toBeInTheDocument();
    expect(
      screen.getByText(/Enter the full name of the prescribing doctor/i)
    ).toBeInTheDocument();
  });

  it("renders Preview only when both id and name exist (via rerender), showing those values", () => {
    const onChange = vi.fn();
    const { rerender } = render(
      <DoctorStep doctor={{ id: "", name: "" }} onChange={onChange} />
    );

    // No preview initially
    expect(screen.queryByText(/Preview/i)).not.toBeInTheDocument();

    // Parent provides both id and name via props
    rerender(<DoctorStep doctor={{ id: "DR-888", name: "Alice" }} onChange={onChange} />);

    // Preview exists
    const preview = screen.getByText(/Preview/i).closest("div") as HTMLElement;
    expect(preview).toBeInTheDocument();

    // Scope checks to preview container to avoid label collisions
    const p = within(preview);

    expect(p.getByText(/Doctor ID/i)).toBeInTheDocument();
    expect(p.getByText(/Doctor Name/i)).toBeInTheDocument();
    expect(p.getByText("DR-888")).toBeInTheDocument();
    expect(p.getByText("Alice")).toBeInTheDocument();
  });

  it("nameWarning depends only on doctor.name: changing id keeps warning; fixing name removes it (via rerender)", () => {
    const onChange = vi.fn();
    const { rerender } = render(
      <DoctorStep doctor={{ id: "", name: "John2" }} onChange={onChange} />
    );

    // Invalid name => warning visible
    expect(
      screen.getByText(/Only alphabets and spaces are allowed/i)
    ).toBeInTheDocument();

    // Change ID only (name still invalid) -> warning remains
    rerender(<DoctorStep doctor={{ id: "DR-123", name: "John2" }} onChange={onChange} />);
    expect(
      screen.getByText(/Only alphabets and spaces are allowed/i)
    ).toBeInTheDocument();

    // Fix name -> warning disappears, helper returns
    rerender(<DoctorStep doctor={{ id: "DR-123", name: "John Doe" }} onChange={onChange} />);
    expect(
      screen.queryByText(/Only alphabets and spaces are allowed/i)
    ).not.toBeInTheDocument();
    expect(
      screen.getByText(/Enter the full name of the prescribing doctor/i)
    ).toBeInTheDocument();
  });
});