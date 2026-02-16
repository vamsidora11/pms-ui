// src/features/prescription/tests/MedicationStep.test.tsx
import React from "react";
import { describe, it, beforeEach, expect, vi } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";

/**
 * IMPORTANT:
 * - All vi.mock() calls come BEFORE importing the SUT.
 * - No top-level variables are referenced by any mock factories (hoist-safe).
 */

// --- Mock lucide-react icons to simple components ---
vi.mock("lucide-react", () => {
  const Icon =
    (name: string) =>
    (props: React.SVGProps<SVGSVGElement>) =>
      <svg data-icon={name} {...props} />;
  return {
    Plus: Icon("Plus"),
    X: Icon("X"),
    Search: Icon("Search"),
  };
});

// --- Mock FREQUENCY_OPTIONS from ../types/models (hoist-safe) ---
vi.mock("../types/models", () => {
  return {
    FREQUENCY_OPTIONS: [
      { label: "Once daily", value: "once" },
      { label: "Twice daily", value: "twice" },
    ],
  };
});

// --- Mock the hook: ../hooks/useMedicationStepState ---
// Declare the state BEFORE the mock so the factory can close over it safely.
type Row = {
  uid: string;
  isSearching: boolean;
  drugName: string;
  strength: string;
  frequency: string;
  quantity: number;
  durationDays: number;
  refills: number;
  instructions: string;
};

let mockRows: Row[] = [];
type SearchText = Record<string, string>;

let mockSearchText: SearchText = {};
let mockResults: Record<string, Array<{ productId: string; name: string; strength: string }>> = {};
let mockLoadingByUid: Record<string, boolean> = {};

const addRowSpy = vi.fn();
const removeRowSpy = vi.fn();
const updateFieldSpy = vi.fn();
const startSearchModeSpy = vi.fn();
const selectDrugSpy = vi.fn();

// This spy applies the updater immediately, mimicking React's setState(updater)
const setSearchTextSpy = vi.fn(
  (updaterOrValue: SearchText | ((prev: SearchText) => SearchText) | null) => {
  if (typeof updaterOrValue === "function") {
    mockSearchText = updaterOrValue(mockSearchText);
  } else {
    mockSearchText = updaterOrValue ?? {};
  }
  }
);

vi.mock("../hooks/useMedicationStepState", () => ({
  useMedicationStepState: vi.fn(() => ({
    rows: mockRows,
    searchText: mockSearchText,
    results: mockResults,
    loadingByUid: mockLoadingByUid,
    setSearchText: setSearchTextSpy,
    addRow: addRowSpy,
    removeRow: removeRowSpy,
    updateField: updateFieldSpy,
    startSearchMode: startSearchModeSpy,
    selectDrug: selectDrugSpy,
  })),
}));

// ⬇️ Import the SUT after mocks so they take effect.
import MedicationStep from "../steps/MedicationStep";

// Helpers
const renderSUT = (props?: Partial<React.ComponentProps<typeof MedicationStep>>) =>
  render(
    <MedicationStep
      medications={[]}
      onChange={vi.fn()}
      {...props}
    />
  );

describe("MedicationStep", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Base state with 4 rows to exercise all branches:
    mockRows = [
      // r1: not searching → shows computed "drugName strength", click should startSearchMode
      {
        uid: "r1",
        isSearching: false,
        drugName: "Paracetamol",
        strength: "500mg",
        frequency: "once",
        quantity: 1,
        durationDays: 3,
        refills: 0,
        instructions: "",
      },
      // r2: searching + loading → shows "Searching…"
      {
        uid: "r2",
        isSearching: true,
        drugName: "",
        strength: "",
        frequency: "twice",
        quantity: 2,
        durationDays: 5,
        refills: 1,
        instructions: "after meals",
      },
      // r3: searching + not loading + no results + >= minChars → "No results"
      {
        uid: "r3",
        isSearching: true,
        drugName: "",
        strength: "",
        frequency: "once",
        quantity: 3,
        durationDays: 10,
        refills: 0,
        instructions: "",
      },
      // r4: searching + results present → render results and allow selection
      {
        uid: "r4",
        isSearching: true,
        drugName: "",
        strength: "",
        frequency: "once",
        quantity: 1,
        durationDays: 1,
        refills: 0,
        instructions: "",
      },
    ];

    mockSearchText = {
      r2: "p", // < minChars (2) → no "No results"
      r3: "am", // == minChars → show "No results" when results empty
      r4: "amo",
    };

    mockLoadingByUid = {
      r2: true, // Searching…
      r3: false,
      r4: false,
    };

    mockResults = {
      r2: [], // still loading, ignored
      r3: [], // not loading + >=minChars → "No results"
      r4: [
        { productId: "p1", name: "Amoxicillin", strength: "500mg" },
        { productId: "p2", name: "Azithromycin", strength: "250mg" },
      ],
    };
  });

  it("renders header, allows adding a row, and shows remove buttons when rows > 1", () => {
    renderSUT();

    // Header
    expect(screen.getByRole("heading", { name: /medications/i })).toBeInTheDocument();
    expect(
      screen.getByText(/Search and add medications from inventory/i)
    ).toBeInTheDocument();

    // Add row
    const addBtn = screen.getByRole("button", { name: /add medication/i });
    fireEvent.click(addBtn);
    expect(addRowSpy).toHaveBeenCalledTimes(1);

    // Remove buttons (icon-only) are present because rows.length > 1
    const allButtons = screen.getAllByRole("button");
    const iconOnlyButtons = allButtons.filter((b) => b.textContent?.trim() === "");
    expect(iconOnlyButtons.length).toBeGreaterThan(0);

    // Clicking any icon-only remove button invokes removeRow with a uid
    fireEvent.click(iconOnlyButtons[0]);
    expect(removeRowSpy).toHaveBeenCalledTimes(1);
    expect(removeRowSpy.mock.calls[0][0]).toMatch(/r[1-4]/);
  });

  it("not-searching row shows computed drug label and clicking enters search mode", () => {
    renderSUT();

    // r1 input shows "Paracetamol 500mg"
    const r1Display = screen.getByDisplayValue("Paracetamol 500mg");
    expect(r1Display).toBeInTheDocument();

    // Clicking the readOnly input triggers startSearchMode for r1
    fireEvent.click(r1Display);
    expect(startSearchModeSpy).toHaveBeenCalledWith("r1");
  });

  it("searching: shows 'Searching…', 'No results', renders results and allows selecting a drug", () => {
    renderSUT();

    // r2: Searching…
    expect(screen.getByText("Searching…")).toBeInTheDocument();

    // r3: No results (>= minChars=2, not loading, empty results)
    expect(screen.getByText("No results")).toBeInTheDocument();

    // r4: Results present
    const amoxBtn = screen.getByRole("button", { name: /amoxicillin/i });
    const azithBtn = screen.getByRole("button", { name: /azithromycin/i });
    expect(amoxBtn).toBeInTheDocument();
    expect(azithBtn).toBeInTheDocument();

    // Click r4's first item
    fireEvent.click(amoxBtn);
    expect(selectDrugSpy).toHaveBeenCalledWith("r4", {
      productId: "p1",
      name: "Amoxicillin",
      strength: "500mg",
    });
  });

  it("typing into searching input updates searchText via updater function", () => {
    renderSUT();

    // r3 is searching with current value "am"
    const r3Input = screen.getByDisplayValue("am");
    fireEvent.change(r3Input, { target: { value: "amox" } });

    // We expect setSearchText to receive an updater function
    expect(setSearchTextSpy).toHaveBeenCalled();
    const arg = setSearchTextSpy.mock.calls.at(-1)?.[0];
    expect(typeof arg).toBe("function");

    // Our spy applies the updater immediately; assert updated internal state
    expect(mockSearchText.r3).toBe("amox");
  });

  it("updates frequency, quantity, duration, refills, and instructions via updateField", () => {
    renderSUT();

    // Frequency (combobox). First select corresponds to first row (r1).
    const selects = screen.getAllByRole("combobox");
    expect(selects.length).toBeGreaterThan(0);
    fireEvent.change(selects[0], { target: { value: "twice" } });
    expect(updateFieldSpy).toHaveBeenCalledWith("r1", "frequency", "twice");

    // Numeric inputs have role=spinbutton. The first three belong to r1: quantity, durationDays, refills.
    const spins = screen.getAllByRole("spinbutton");
    expect(spins.length).toBeGreaterThan(0);

    // Quantity
    fireEvent.change(spins[0], { target: { value: "5" } });
    expect(updateFieldSpy).toHaveBeenCalledWith("r1", "quantity", 5);

    // Duration (Days)
    fireEvent.change(spins[1], { target: { value: "7" } });
    expect(updateFieldSpy).toHaveBeenCalledWith("r1", "durationDays", 7);

    // Refills
    fireEvent.change(spins[2], { target: { value: "2" } });
    expect(updateFieldSpy).toHaveBeenCalledWith("r1", "refills", 2);

    // Instructions input: scope to the first row via its unique "Paracetamol 500mg" display
    const r1Display = screen.getByDisplayValue("Paracetamol 500mg");
    const r1Container = r1Display.closest("div")!.parentElement!.parentElement!; // climb up to row block
    const r1Within = within(r1Container);

    const instrInputs = r1Within.getAllByRole("textbox");
    // The last text box in the row block is the "Instructions" input (others are search/display)
    const instrInput = instrInputs[instrInputs.length - 1];
    fireEvent.change(instrInput, { target: { value: "after lunch" } });
    expect(updateFieldSpy).toHaveBeenCalledWith("r1", "instructions", "after lunch");
  });
});
