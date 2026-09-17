import { beforeEach, describe, expect, it } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useOpenSections } from "@/hooks/useOpenSections";

const KEY = "ncd_test_open_sections";

describe("useOpenSections", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("defaults listed ids to open and treats missing keys as open", () => {
    const { result } = renderHook(() => useOpenSections(KEY, ["a", "b"]));
    expect(result.current.value).toEqual(["a", "b"]);
  });

  it("records closed sections and leaves unknown ids open", () => {
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
