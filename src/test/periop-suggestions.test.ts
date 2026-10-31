import { describe, expect, it } from "vitest";
import { suggestCalculators } from "@/lib/periop-suggestions";

describe("perioperative calculator suggestions", () => {
  it("suggests STS first for cardiac surgery", () => {
    expect(suggestCalculators("cabg")[0]).toBe("sts");
  });
  it("suggests the cSDH tool for burr-hole surgery", () => {
    expect(suggestCalculators("csdh")).toContain("csdh");
  });
  it("puts airway tools first when airway focus is chosen", () => {
    expect(suggestCalculators("hip-knee", "airway").slice(0, 2)).toEqual(["mallampati", "stopbang"]);
  });
  it("returns nothing when no surgery is chosen", () => {
    expect(suggestCalculators("")).toEqual([]);
  });
});
