import { render, screen } from "@testing-library/react";
import Stepper from "./Stepper";

describe("Stepper component", () => {
  const steps = [
    { step: 1, label: "Patient Info" },
    { step: 2, label: "Prescription" },
    { step: 3, label: "Review" },
  ];

  test("renders all steps with labels", () => {
    render(<Stepper currentStep={1} steps={steps} />);

    steps.forEach((s) => {
      expect(screen.getByText(`Step ${s.step}`)).toBeInTheDocument();
      expect(screen.getByText(s.label)).toBeInTheDocument();
    });
  });

  test("applies active styles for completed and current steps", () => {
    render(<Stepper currentStep={2} steps={steps} />);

    const step1Circle = screen.getByText("1");
    const step2Circle = screen.getByText("2");

    expect(step1Circle.className).toContain("bg-blue-600");
    expect(step2Circle.className).toContain("bg-blue-600");
  });

  test("applies inactive styles for future steps", () => {
    render(<Stepper currentStep={1} steps={steps} />);

    const step2Circle = screen.getByText("2");

    expect(step2Circle.className).toContain("bg-gray-100");
    expect(step2Circle.className).toContain("text-gray-400");
  });

  test("applies correct connector styles when step is completed", () => {
    const { container } = render(
      <Stepper currentStep={2} steps={steps} />
    );

    const connectors = container.querySelectorAll(".h-px");

    // First connector should be blue (1 → 2)
    expect(connectors[0].className).toContain("bg-blue-600");

    // Second connector should be gray (2 → 3)
    expect(connectors[1].className).toContain("bg-gray-200");
  });

  test("does not render connector after last step", () => {
    const { container } = render(
      <Stepper currentStep={1} steps={steps} />
    );

    const connectors = container.querySelectorAll(".h-px");

    // steps.length - 1 connectors
    expect(connectors.length).toBe(steps.length - 1);
  });

  test("handles empty steps array", () => {
    render(<Stepper currentStep={1} steps={[]} />);

    expect(screen.queryByText(/Step/)).not.toBeInTheDocument();
  });
});
