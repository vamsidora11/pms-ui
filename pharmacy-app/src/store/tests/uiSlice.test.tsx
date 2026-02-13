import { describe, it, expect } from "vitest";
import reducer, { toggleSidebar, setSidebar } from "../ui/uiSlice";

describe("uiSlice (100% coverage)", () => {
  it("should return the initial state", () => {
    const initial = reducer(undefined, { type: "@@INIT" });
    expect(initial).toEqual({
      sidebarCollapsed: false,
    });
  });

  it("toggleSidebar should flip sidebarCollapsed from false → true", () => {
    const state = { sidebarCollapsed: false };
    const next = reducer(state, toggleSidebar());
    expect(next.sidebarCollapsed).toBe(true);
  });

  it("toggleSidebar should flip sidebarCollapsed from true → false", () => {
    const state = { sidebarCollapsed: true };
    const next = reducer(state, toggleSidebar());
    expect(next.sidebarCollapsed).toBe(false);
  });

  it("setSidebar(true) should set sidebarCollapsed to true", () => {
    const state = { sidebarCollapsed: false };
    const next = reducer(state, setSidebar(true));
    expect(next.sidebarCollapsed).toBe(true);
  });

  it("setSidebar(false) should set sidebarCollapsed to false", () => {
    const state = { sidebarCollapsed: true };
    const next = reducer(state, setSidebar(false));
    expect(next.sidebarCollapsed).toBe(false);
  });
});