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

describe("patient history selector", () => {
  it("puts Woo first for a prior stroke patient", () => {
    expect(suggestCalculators("hip-knee", "", "stroke")[0]).toBe("woo");
  });
  it("puts RCRI first for a cardiac patient", () => {
    expect(suggestCalculators("laparoscopic", "", "cardiac")[0]).toBe("rcri");
  });
});
