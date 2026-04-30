import { renderHook } from "@testing-library/react";
import type { RootState } from "@store/prescription/prescriptionSlice";
import { vi } from "vitest";

/* ---------------------------------- */
/* ESM-safe module mock */
/* ---------------------------------- */
vi.mock("react-redux", async () => {
  const actual = await vi.importActual<typeof import("react-redux")>(
    "react-redux"
  );

  return {
    ...actual,
    useSelector: vi.fn(),
  };
});

import { useSelector } from "react-redux";
import { useDashboardData } from "../../dashboard/hooks/useDashboardData";

describe("useDashboardData", () => {
  const mockedUseSelector = useSelector as unknown as {
    mockImplementation: (
      fn: (selector: (state: RootState) => unknown) => unknown
    ) => void;
    mockClear: () => void;
  };

  afterEach(() => {
    vi.clearAllMocks();
  });

  function mockState(state: RootState) {
    mockedUseSelector.mockImplementation(
      (selector: (state: RootState) => unknown) =>
        selector(state)
    );
  }

  test("returns values from redux state", () => {
    const state = {
      prescriptions: {
        items: [{ id: 1 }],
        status: "succeeded",
        totalCount: 50,
        pageNumber: 2,
        pageSize: 20,
      },
    } as unknown as RootState;

    mockState(state);

    const { result } = renderHook(() => useDashboardData());

    expect(result.current.prescriptions).toEqual([{ id: 1 }]);
    expect(result.current.requestStatus).toBe("succeeded");
    expect(result.current.totalCount).toBe(50);
    expect(result.current.pageNumber).toBe(2);
    expect(result.current.pageSize).toBe(20);
  });

  test("uses fallback defaults when state values are undefined", () => {
    const state = {
      prescriptions: {},
    } as unknown as RootState;

    mockState(state);

    const { result } = renderHook(() => useDashboardData());

    expect(result.current.prescriptions).toEqual([]);
    expect(result.current.requestStatus).toBe("idle");
    expect(result.current.totalCount).toBe(0);
    expect(result.current.pageNumber).toBe(1);
    expect(result.current.pageSize).toBe(10);
  });

  test("uses custom pageSize param when state.pageSize is undefined", () => {
    const state = {
      prescriptions: {
        items: [],
        status: "idle",
        totalCount: 0,
        pageNumber: 1,
        pageSize: undefined,
      },
    } as unknown as RootState;

    mockState(state);

    const { result } = renderHook(() =>
      useDashboardData({ pageSize: 25 })
    );

    expect(result.current.pageSize).toBe(25);
  });

  test("state.pageSize overrides custom pageSize param", () => {
    const state = {
      prescriptions: {
        items: [],
        status: "idle",
        totalCount: 0,
        pageNumber: 1,
        pageSize: 15,
      },
    } as unknown as RootState;

    mockState(state);

    const { result } = renderHook(() =>
      useDashboardData({ pageSize: 25 })
    );

    expect(result.current.pageSize).toBe(15);
  });
});
