import { beforeEach, describe, expect, it } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useOpenSections } from "@/hooks/useOpenSections";

const KEY = "ncd_test_open_sections";

describe("useOpenSections", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("defaults listed ids to closed and treats missing keys as closed", () => {
    const { result } = renderHook(() => useOpenSections(KEY, ["a", "b"]));
    expect(result.current.value).toEqual([]);
  });

  it("respects a saved open/closed map and defaults unknown ids to closed", () => {
    localStorage.setItem(KEY, JSON.stringify({ a: true, b: false }));
    const { result } = renderHook(() => useOpenSections(KEY, ["a", "b", "c"]));
    expect(result.current.value).toEqual(["a"]);
  });

  it("records open sections and leaves unselected ids closed", () => {
    const { result } = renderHook(() => useOpenSections(KEY, ["a", "b", "c"]));

    act(() => {
      result.current.onValueChange(["a"]);
    });

    expect(result.current.value).toEqual(["a"]);
    expect(JSON.parse(localStorage.getItem(KEY) ?? "{}")).toMatchObject({
      a: true,
      b: false,
      c: false,
    });
  });
});
