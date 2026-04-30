//  renders input with label and placeholder
//  renders selected chips and calls onRemove when clicking X 
//  calls onQueryChange when typing in the input 
//  renders suggestions and allows selecting one 
//  renders loading and error states

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AllergySelector from "../components/AllergySelector";
import { useState } from "react";
// Mock the useAllergySearch hook
vi.mock("../hooks/useAllergySearch", () => ({
  useAllergySearch: vi.fn(),
}));

import { useAllergySearch } from "../hooks/useAllergySearch";
const mockedUseAllergySearch = vi.mocked(useAllergySearch);

describe("AllergySelector", () => {
  const onQueryChange = vi.fn();
  const onAdd = vi.fn();
  const onRemove = vi.fn();
  const searchFn = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders input with label and placeholder", () => {
    mockedUseAllergySearch.mockReturnValue({
      suggestions: [],
      loading: false,
      error: null,
      open: false,
      setOpen: vi.fn(),
      highlightIndex: -1,
      setHighlightIndex: vi.fn(),
    });

    render(
      <AllergySelector
        query=""
        onQueryChange={onQueryChange}
        selected={[]}
        onAdd={onAdd}
        onRemove={onRemove}
        searchFn={searchFn}
      />
    );

    expect(screen.getByPlaceholderText(/type to search allergy/i)).toBeInTheDocument();
    expect(screen.getByText(/allergies/i)).toBeInTheDocument();
  });

  it("renders selected chips and calls onRemove when clicking X", async () => {
    mockedUseAllergySearch.mockReturnValue({
      suggestions: [],
      loading: false,
      error: null,
      open: false,
      setOpen: vi.fn(),
      highlightIndex: -1,
      setHighlightIndex: vi.fn(),
    });

    render(
      <AllergySelector
        query=""
        onQueryChange={onQueryChange}
        selected={["Peanuts", "Shellfish"]}
        onAdd={onAdd}
        onRemove={onRemove}
        searchFn={searchFn}
      />
    );

    // Chips are rendered
    expect(screen.getByText("Peanuts")).toBeInTheDocument();
    expect(screen.getByText("Shellfish")).toBeInTheDocument();

    // Click remove button on Peanuts
    await userEvent.click(screen.getByLabelText("Remove Peanuts"));
    expect(onRemove).toHaveBeenCalledWith("Peanuts");
  });

  it("calls onQueryChange when typing in the input", async () => {
  mockedUseAllergySearch.mockReturnValue({
    suggestions: [],
    loading: false,
    error: null,
    open: false,
    setOpen: vi.fn(),
    highlightIndex: -1,
    setHighlightIndex: vi.fn(),
  });

  // Local state to mimic input behavior
  const Wrapper = () => {
    const [query, setQuery] = useState("");
    return (
      <AllergySelector
        query={query}
        onQueryChange={(val) => {
          setQuery(val);
          onQueryChange(val);
        }}
        selected={[]}
        onAdd={onAdd}
        onRemove={onRemove}
        searchFn={searchFn}
      />
    );
  };

  render(<Wrapper />);

  const input = screen.getByPlaceholderText(/type to search allergy/i);
  await userEvent.type(input, "Penicillin");

  // Now the last call should be the full string
  expect(onQueryChange).toHaveBeenLastCalledWith("Penicillin");
});



  it("renders suggestions and allows selecting one", async () => {
    const setOpen = vi.fn();
    const setHighlightIndex = vi.fn();

    mockedUseAllergySearch.mockReturnValue({
      suggestions: ["Penicillin", "Aspirin"],
      loading: false,
      error: null,
      open: true,
      setOpen,
      highlightIndex: 0,
      setHighlightIndex,
    });

    render(
      <AllergySelector
        query="Pe"
        onQueryChange={onQueryChange}
        selected={[]}
        onAdd={onAdd}
        onRemove={onRemove}
        searchFn={searchFn}
      />
    );

    // Use a function matcher to handle <mark> splitting
    const penicillinButton = screen.getByRole("button", {
      name: (content) => content.replace(/\s+/g, "") === "Penicillin",
    });

    const aspirinButton = screen.getByRole("button", {
      name: (content) => content.replace(/\s+/g, "") === "Aspirin",
    });

    expect(penicillinButton).toBeInTheDocument();
    expect(aspirinButton).toBeInTheDocument();

    // Click suggestion
    await userEvent.click(penicillinButton);
    expect(onAdd).toHaveBeenCalledWith("Penicillin");
  });

  it("renders loading and error states", () => {
    const setOpen = vi.fn();
    const setHighlightIndex = vi.fn();

    // Loading
    mockedUseAllergySearch.mockReturnValue({
      suggestions: [],
      loading: true,
      error: null,
      open: true,
      setOpen,
      highlightIndex: -1,
      setHighlightIndex,
    });

    render(
      <AllergySelector
        query="Pe"
        onQueryChange={onQueryChange}
        selected={[]}
        onAdd={onAdd}
        onRemove={onRemove}
        searchFn={searchFn}
      />
    );

    expect(screen.getByText(/searching…/i)).toBeInTheDocument();

    // Error
    mockedUseAllergySearch.mockReturnValue({
      suggestions: [],
      loading: false,
      error: "Network error",
      open: true,
      setOpen,
      highlightIndex: -1,
      setHighlightIndex,
    });

    render(
      <AllergySelector
        query="Pe"
        onQueryChange={onQueryChange}
        selected={[]}
        onAdd={onAdd}
        onRemove={onRemove}
        searchFn={searchFn}
      />
    );

    expect(screen.getByText(/network error/i)).toBeInTheDocument();
  });
});
