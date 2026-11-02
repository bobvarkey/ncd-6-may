import { describe, expect, it } from "vitest";
import { assessIronCbc, EMPTY_IRON_CBC } from "@/lib/iron-cbc";

const assess = (overrides = {}) => assessIronCbc({ ...EMPTY_IRON_CBC, hemoglobin: "10.5", mcv: "88", rdw: "16", ...overrides });
describe("Iron CBC pattern assessment", () => {
  it("flags possible deficiency despite normocytic anemia", () => {
    expect(assess()).toMatchObject({ status: "ready", morphology: "normocytic", pattern: "normocytic-high-rdw", anemia: true });
  });
  it("does not exclude deficiency when both indices are normal", () => {
    expect(assess({ rdw: "14" })).toMatchObject({ pattern: "normocytic-normal-rdw" });
  });
  it("includes 80 and 100 fL in the normocytic interval", () => {
    expect(assess({ mcv: "80" })).toMatchObject({ morphology: "normocytic" });
    expect(assess({ mcv: "100" })).toMatchObject({ morphology: "normocytic" });
    expect(assess({ mcv: "79.9" })).toMatchObject({ morphology: "microcytic" });
    expect(assess({ mcv: "100.1" })).toMatchObject({ pattern: "macrocytic-anemia" });
  });
  it("uses the entered RDW-CV upper limit with strict greater-than", () => {
    expect(assess({ rdw: "14.5" })).toMatchObject({ elevatedRdw: false });
    expect(assess({ rdw: "14.6" })).toMatchObject({ elevatedRdw: true });
    expect(assess({ rdwUpperLimit: "17" })).toMatchObject({ elevatedRdw: false });
  });
  it("uses the patient-specific Hb limit without diagnosing anemia at equality", () => {
    expect(assess({ hemoglobin: "12" })).toMatchObject({ anemia: false, pattern: "no-anemia" });
    expect(assess({ hemoglobin: "12", hbLowerLimit: "13" })).toMatchObject({ anemia: true });
  });
  it("requires complete input", () => {
    expect(assessIronCbc(EMPTY_IRON_CBC)).toEqual({ status: "incomplete" });
  });
  it("rejects invalid values rather than assigning a pattern", () => {
    for (const value of ["NaN", "abc", "0", "-1", "Infinity", "201"]) {
      expect(assess({ mcv: value })).toEqual({ status: "invalid" });
    }
  });
});