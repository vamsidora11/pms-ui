import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import "@testing-library/jest-dom";
import Table from "./Table";

type User = {
  id: number;
  name: string;
  age: number;
};

describe("Table component", () => {
  const columns: {
    key: keyof User;
    label: string;
  }[] = [
    { key: "id", label: "ID" },
    { key: "name", label: "Name" },
    { key: "age", label: "Age" },
  ];

  const data: User[] = [
    { id: 1, name: "Alice", age: 25 },
    { id: 2, name: "Bob", age: 30 },
  ];

  it("renders table headers", () => {
    render(<Table<User> columns={columns} data={data} />);

    expect(screen.getByText("ID")).toBeInTheDocument();
    expect(screen.getByText("Name")).toBeInTheDocument();
    expect(screen.getByText("Age")).toBeInTheDocument();
  });

  it("renders table rows and cell values", () => {
    render(<Table<User> columns={columns} data={data} />);

    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("Bob")).toBeInTheDocument();
    expect(screen.getByText("25")).toBeInTheDocument();
    expect(screen.getByText("30")).toBeInTheDocument();
  });

  it("renders correct number of rows", () => {
    const { container } = render(
      <Table<User> columns={columns} data={data} />
    );

    const rows = container.querySelectorAll("tbody tr");
    expect(rows.length).toBe(2);
  });

  it("renders custom cell content using render function", () => {
    const customColumns: {
      key: keyof User;
      label: string;
      render?: (value: unknown, row: User) => React.ReactNode;
    }[] = [
      { key: "name", label: "Name" },
      {
        key: "age",
        label: "Age",
        render: (value) => (
          <span data-testid="custom-age">
            {value as number} yrs
          </span>
        ),
      },
    ];

    render(<Table<User> columns={customColumns} data={data} />);

    const customCells = screen.getAllByTestId("custom-age");
    expect(customCells.length).toBe(2);
    expect(customCells[0]).toHaveTextContent("25 yrs");
    expect(customCells[1]).toHaveTextContent("30 yrs");
  });

  it("renders empty body when data array is empty", () => {
    const { container } = render(
      <Table<User> columns={columns} data={[]} />
    );

    const rows = container.querySelectorAll("tbody tr");
    expect(rows.length).toBe(0);
  });
});
