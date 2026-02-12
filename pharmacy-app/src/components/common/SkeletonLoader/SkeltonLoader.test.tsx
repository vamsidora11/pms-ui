import { render } from "@testing-library/react";
import { TableSkeleton } from "./SkeletonLoader";

describe("TableSkeleton component", () => {
  test("renders with default rows and columns (5x5)", () => {
    const { container } = render(<TableSkeleton />);

    // 5 header cells + (5 rows × 5 columns)
    const skeletonCells = container.querySelectorAll(".bg-gray-200");

    expect(skeletonCells.length).toBe(5 + 5 * 5);
  });

  test("renders correct number of header columns when custom columns provided", () => {
    const { container } = render(<TableSkeleton columns={3} />);

    const header = container.querySelector("div.p-4");
    const headerCells = header?.querySelectorAll(".bg-gray-200");

    expect(headerCells?.length).toBe(3);
  });

  test("renders correct number of rows when custom rows provided", () => {
    const { container } = render(<TableSkeleton rows={2} columns={4} />);

    // total cells = 4 header + (2 rows × 4 columns)
    const skeletonCells = container.querySelectorAll(".bg-gray-200");

    expect(skeletonCells.length).toBe(4 + 2 * 4);
  });

  test("applies correct gridTemplateColumns style", () => {
    const { container } = render(<TableSkeleton columns={3} />);

    const grids = container.querySelectorAll(".p-4");

    grids.forEach((grid) => {
      expect(grid).toHaveStyle({
        gridTemplateColumns: "repeat(3, 1fr)",
      });
    });
  });

  test("renders no row cells when rows is 0", () => {
    const { container } = render(<TableSkeleton rows={0} columns={4} />);

    // only header cells should exist
    const skeletonCells = container.querySelectorAll(".bg-gray-200");

    expect(skeletonCells.length).toBe(4);
  });
});
