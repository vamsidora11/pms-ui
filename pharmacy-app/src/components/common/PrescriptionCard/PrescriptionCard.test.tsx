import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import PrescriptionCard from "./PrescriptionCard";

describe("PrescriptionCard component", () => {
  const baseProps = {
    rxId: "RX12345",
    patientName: "John Doe",
    timestamp: "2025-01-01 10:30 AM",
  };

  test("renders basic prescription information", () => {
    render(<PrescriptionCard {...baseProps} />);

    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText("RX: RX12345")).toBeInTheDocument();
    expect(screen.getByText("2025-01-01 10:30 AM")).toBeInTheDocument();
  });

  test("renders item count when itemCount is provided", () => {
    render(
      <PrescriptionCard
        {...baseProps}
        itemCount={3}
      />
    );

    expect(screen.getByText("3 items")).toBeInTheDocument();
  });

  test("renders status badge when status is provided", () => {
    render(
      <PrescriptionCard
        {...baseProps}
        status="Urgent"
      />
    );

    expect(screen.getByText("Urgent")).toBeInTheDocument();
  });

  test("applies correct color class for Urgent status", () => {
    render(
      <PrescriptionCard
        {...baseProps}
        status="Urgent"
      />
    );

    const badge = screen.getByText("Urgent");
    expect(badge.className).toContain("bg-red-100");
    expect(badge.className).toContain("text-red-600");
  });

  test("renders primary action button when label is provided", () => {
    render(
      <PrescriptionCard
        {...baseProps}
        primaryActionLabel="Validate"
      />
    );

    expect(
      screen.getByRole("button", { name: /validate/i })
    ).toBeInTheDocument();
  });

  test("calls onPrimaryAction when primary action button is clicked", async () => {
    const user = userEvent.setup();
    const onPrimaryAction = vi.fn();

    render(
      <PrescriptionCard
        {...baseProps}
        primaryActionLabel="Validate"
        onPrimaryAction={onPrimaryAction}
      />
    );

    await user.click(
      screen.getByRole("button", { name: /validate/i })
    );

    expect(onPrimaryAction).toHaveBeenCalledTimes(1);
  });

  test("renders view button when onViewDetails is provided", () => {
    render(
      <PrescriptionCard
        {...baseProps}
        onViewDetails={() => {}}
      />
    );

    expect(
      screen.getByRole("button", { name: /view/i })
    ).toBeInTheDocument();
  });

  test("calls onViewDetails when View button is clicked", async () => {
    const user = userEvent.setup();
    const onViewDetails = vi.fn();

    render(
      <PrescriptionCard
        {...baseProps}
        onViewDetails={onViewDetails}
      />
    );

    await user.click(
      screen.getByRole("button", { name: /view/i })
    );

    expect(onViewDetails).toHaveBeenCalledTimes(1);
  });

  test("does not render action buttons when props are not provided", () => {
    render(<PrescriptionCard {...baseProps} />);

    expect(
      screen.queryByRole("button")
    ).not.toBeInTheDocument();
  });
});
