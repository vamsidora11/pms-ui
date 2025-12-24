import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import "@testing-library/jest-dom";
import FilterBar from "./FilterBar";

describe("FilterBar Component", () => {
  const mockOnSearch = vi.fn();

  afterEach(() => {
    vi.clearAllMocks();
  });

  /* -------------------- Rendering -------------------- */

  describe("Rendering", () => {
    it("renders search input", () => {
      render(<FilterBar onSearch={mockOnSearch} />);
      expect(screen.getByPlaceholderText("Search...")).toBeInTheDocument();
    });

    it("renders with right content", () => {
      render(
        <FilterBar
          onSearch={mockOnSearch}
          rightContent={<button>Add</button>}
        />
      );

      expect(
        screen.getByRole("button", { name: /add/i })
      ).toBeInTheDocument();
    });

    it("renders without right content (no buttons rendered)", () => {
      render(<FilterBar onSearch={mockOnSearch} />);

      // Behavior-based assertion (correct)
      expect(
        screen.queryByRole("button")
      ).not.toBeInTheDocument();
    });
  });

  /* -------------------- Input attributes -------------------- */

  describe("Search input", () => {
    it("has correct type attribute", () => {
      render(<FilterBar onSearch={mockOnSearch} />);
      expect(
        screen.getByPlaceholderText("Search...")
      ).toHaveAttribute("type", "text");
    });

    it("applies correct input styles", () => {
      render(<FilterBar onSearch={mockOnSearch} />);
      expect(
        screen.getByPlaceholderText("Search...")
      ).toHaveClass("border", "px-3", "py-2", "rounded", "w-64");
    });
  });

  /* -------------------- Search functionality -------------------- */

  describe("Search functionality", () => {
    it("calls onSearch when input value changes", () => {
      render(<FilterBar onSearch={mockOnSearch} />);
      const input = screen.getByPlaceholderText("Search...");

      fireEvent.change(input, { target: { value: "test" } });

      expect(mockOnSearch).toHaveBeenCalledTimes(1);
      expect(mockOnSearch).toHaveBeenCalledWith("test");
    });

    it("does NOT call onSearch when value does not change (empty → empty)", () => {
      render(<FilterBar onSearch={mockOnSearch} />);
      const input = screen.getByPlaceholderText("Search...");

      fireEvent.change(input, { target: { value: "" } });

      // Correct expectation
      expect(mockOnSearch).toHaveBeenCalledTimes(0);
    });

    it("calls onSearch multiple times as user types", () => {
      render(<FilterBar onSearch={mockOnSearch} />);
      const input = screen.getByPlaceholderText("Search...");

      fireEvent.change(input, { target: { value: "t" } });
      fireEvent.change(input, { target: { value: "te" } });
      fireEvent.change(input, { target: { value: "tes" } });
      fireEvent.change(input, { target: { value: "test" } });

      expect(mockOnSearch).toHaveBeenCalledTimes(4);
      expect(mockOnSearch).toHaveBeenNthCalledWith(4, "test");
    });

    it("handles special characters", () => {
      render(<FilterBar onSearch={mockOnSearch} />);
      fireEvent.change(screen.getByPlaceholderText("Search..."), {
        target: { value: "@#$%" },
      });

      expect(mockOnSearch).toHaveBeenCalledWith("@#$%");
    });

    it("updates input value when typing", () => {
      render(<FilterBar onSearch={mockOnSearch} />);
      const input = screen.getByPlaceholderText(
        "Search..."
      ) as HTMLInputElement;

      fireEvent.change(input, { target: { value: "new value" } });

      expect(input.value).toBe("new value");
    });
  });

  /* -------------------- Layout & styling -------------------- */

  describe("Container styling", () => {
    it("applies wrapper layout styles", () => {
      const { container } = render(<FilterBar onSearch={mockOnSearch} />);
      const wrapper = container.firstChild as HTMLElement;

      expect(wrapper).toHaveClass(
        "flex",
        "items-center",
        "justify-between",
        "p-3",
        "bg-white",
        "rounded-lg",
        "shadow",
        "mb-4"
      );
    });
  });

  /* -------------------- Right content -------------------- */

  describe("Right content", () => {
    it("renders simple text content", () => {
      render(
        <FilterBar
          onSearch={mockOnSearch}
          rightContent="Status: Active"
        />
      );

      expect(
        screen.getByText("Status: Active")
      ).toBeInTheDocument();
    });

    it("renders multiple interactive elements independently", () => {
      const action1 = vi.fn();
      const action2 = vi.fn();

      render(
        <FilterBar
          onSearch={mockOnSearch}
          rightContent={
            <>
              <button onClick={action1}>One</button>
              <button onClick={action2}>Two</button>
            </>
          }
        />
      );

      fireEvent.change(screen.getByPlaceholderText("Search..."), {
        target: { value: "search" },
      });
      fireEvent.click(screen.getByText("One"));
      fireEvent.click(screen.getByText("Two"));

      expect(mockOnSearch).toHaveBeenCalledWith("search");
      expect(action1).toHaveBeenCalled();
      expect(action2).toHaveBeenCalled();
    });
  });

  /* -------------------- Edge cases -------------------- */

  describe("Edge cases", () => {
    it("handles very long search strings", () => {
      render(<FilterBar onSearch={mockOnSearch} />);
      const longValue = "a".repeat(1000);

      fireEvent.change(screen.getByPlaceholderText("Search..."), {
        target: { value: longValue },
      });

      expect(mockOnSearch).toHaveBeenCalledWith(longValue);
    });

    it("handles undefined or null rightContent gracefully", () => {
      render(<FilterBar onSearch={mockOnSearch} rightContent={null} />);
      expect(screen.getByPlaceholderText("Search...")).toBeInTheDocument();
    });
  });
});
