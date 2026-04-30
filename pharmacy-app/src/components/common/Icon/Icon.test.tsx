import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import "@testing-library/jest-dom";
import Icon from "./Icon";

// Mock react-icons
vi.mock("react-icons/fi", () => ({
  FiAlertCircle: ({ className, size }: { className: string; size: number }) => (
    <svg data-testid="alert-icon" className={className} data-size={size}>
      <title>Alert Icon</title>
    </svg>
  ),
  FiCheckCircle: ({ className, size }: { className: string; size: number }) => (
    <svg data-testid="check-icon" className={className} data-size={size}>
      <title>Check Icon</title>
    </svg>
  ),
  FiClock: ({ className, size }: { className: string; size: number }) => (
    <svg data-testid="clock-icon" className={className} data-size={size}>
      <title>Clock Icon</title>
    </svg>
  ),
  FiPackage: ({ className, size }: { className: string; size: number }) => (
    <svg data-testid="package-icon" className={className} data-size={size}>
      <title>Package Icon</title>
    </svg>
  ),
}));

describe("Icon Component", () => {
  describe("Rendering icons", () => {
    it("renders alert icon", () => {
      render(<Icon name="alert" />);
      expect(screen.getByTestId("alert-icon")).toBeInTheDocument();
    });

    it("renders check icon", () => {
      render(<Icon name="check" />);
      expect(screen.getByTestId("check-icon")).toBeInTheDocument();
    });

    it("renders clock icon", () => {
      render(<Icon name="clock" />);
      expect(screen.getByTestId("clock-icon")).toBeInTheDocument();
    });

    it("renders package icon", () => {
      render(<Icon name="package" />);
      expect(screen.getByTestId("package-icon")).toBeInTheDocument();
    });
  });

  describe("Default props", () => {
    it("uses default size of 20", () => {
      render(<Icon name="alert" />);
      expect(screen.getByTestId("alert-icon")).toHaveAttribute("data-size", "20");
    });

    it("uses default color of text-gray-600", () => {
      render(<Icon name="check" />);
      expect(screen.getByTestId("check-icon")).toHaveClass("text-gray-600");
    });
  });

  describe("Custom size", () => {
    it("applies custom size 16", () => {
      render(<Icon name="alert" size={16} />);
      expect(screen.getByTestId("alert-icon")).toHaveAttribute("data-size", "16");
    });

    it("applies custom size 24", () => {
      render(<Icon name="check" size={24} />);
      expect(screen.getByTestId("check-icon")).toHaveAttribute("data-size", "24");
    });

    it("applies custom size 32", () => {
      render(<Icon name="clock" size={32} />);
      expect(screen.getByTestId("clock-icon")).toHaveAttribute("data-size", "32");
    });

    it("applies very small size 8", () => {
      render(<Icon name="package" size={8} />);
      expect(screen.getByTestId("package-icon")).toHaveAttribute("data-size", "8");
    });

    it("applies very large size 64", () => {
      render(<Icon name="alert" size={64} />);
      expect(screen.getByTestId("alert-icon")).toHaveAttribute("data-size", "64");
    });
  });

  describe("Custom color", () => {
    it("applies text-red-500 color", () => {
      render(<Icon name="alert" color="text-red-500" />);
      expect(screen.getByTestId("alert-icon")).toHaveClass("text-red-500");
    });

    it("applies text-green-500 color", () => {
      render(<Icon name="check" color="text-green-500" />);
      expect(screen.getByTestId("check-icon")).toHaveClass("text-green-500");
    });

    it("applies text-blue-600 color", () => {
      render(<Icon name="clock" color="text-blue-600" />);
      expect(screen.getByTestId("clock-icon")).toHaveClass("text-blue-600");
    });

    it("applies text-yellow-500 color", () => {
      render(<Icon name="package" color="text-yellow-500" />);
      expect(screen.getByTestId("package-icon")).toHaveClass("text-yellow-500");
    });
  });

  describe("Combined props", () => {
    it("applies custom size and color together", () => {
      render(<Icon name="alert" size={28} color="text-red-600" />);
      const icon = screen.getByTestId("alert-icon");
      expect(icon).toHaveAttribute("data-size", "28");
      expect(icon).toHaveClass("text-red-600");
    });
  });

  describe("Icon switching", () => {
    it("changes icon when name prop changes", () => {
      const { rerender } = render(<Icon name="alert" />);
      expect(screen.getByTestId("alert-icon")).toBeInTheDocument();

      rerender(<Icon name="check" />);
      expect(screen.queryByTestId("alert-icon")).not.toBeInTheDocument();
      expect(screen.getByTestId("check-icon")).toBeInTheDocument();
    });
  });

  describe("Edge cases", () => {
    it("handles size of 0", () => {
      render(<Icon name="alert" size={0} />);
      expect(screen.getByTestId("alert-icon")).toHaveAttribute("data-size", "0");
    });

    it("handles very large size", () => {
      render(<Icon name="check" size={999} />);
      expect(screen.getByTestId("check-icon")).toHaveAttribute("data-size", "999");
    });

    it('handles empty string color', () => {
    render(<Icon name="clock" color="" />);
    const icon = screen.getByTestId('clock-icon');

    expect(icon.getAttribute("class")).toBe("");
    });


    it("handles multiple color classes", () => {
      render(
        <Icon name="package" color="text-red-500 hover:text-red-700" />
      );
      expect(screen.getByTestId("package-icon")).toHaveClass(
        "text-red-500",
        "hover:text-red-700"
      );
    });
  });

  describe("Accessibility", () => {
    it("alert icon has accessible title", () => {
      render(<Icon name="alert" />);
      expect(screen.getByTitle("Alert Icon")).toBeInTheDocument();
    });

    it("check icon has accessible title", () => {
      render(<Icon name="check" />);
      expect(screen.getByTitle("Check Icon")).toBeInTheDocument();
    });

    it("clock icon has accessible title", () => {
      render(<Icon name="clock" />);
      expect(screen.getByTitle("Clock Icon")).toBeInTheDocument();
    });

    it("package icon has accessible title", () => {
      render(<Icon name="package" />);
      expect(screen.getByTitle("Package Icon")).toBeInTheDocument();
    });
  });
});
