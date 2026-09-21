import { describe, expect, it } from "vitest";
import {
  buildTaperSchedule,
  cortisolNmolLFromUgDl,
  cortisolUgDlFromNmolL,
  doseBand,
  interpretMorningCortisolUgDl,
  toPrednisoloneEq,
} from "@/lib/steroid-taper";

describe("glucocorticoid prednisolone-equivalent", () => {
  it("treats prednisolone and prednisone 1:1", () => {
    expect(toPrednisoloneEq("Prednisolone", 10)).toBe(10);
    expect(toPrednisoloneEq("Prednisone", 40)).toBe(40);
  });

  it("converts hydrocortisone 20 mg to 5 mg pred-eq", () => {
    expect(toPrednisoloneEq("Hydrocortisone", 20)).toBe(5);
  });

  it("converts dexamethasone 0.75 mg to 5 mg pred-eq", () => {
    expect(toPrednisoloneEq("Dexamethasone", 0.75)).toBe(5);
  });
});

describe("withdrawal dose bands", () => {
  it("maps high / 10→5 / near-physiologic bands", () => {
    expect(doseBand(40)).toBe("high");
    expect(doseBand(10.1)).toBe("high");
    expect(doseBand(10)).toBe("ten_to_five");
    expect(doseBand(6)).toBe("ten_to_five");
    expect(doseBand(5)).toBe("near_physiologic");
    expect(doseBand(2.5)).toBe("near_physiologic");
  });
});

describe("morning cortisol interpretation (µg/dL)", () => {
  it("flags <3 µg/dL as adrenal insufficiency suggested", () => {
    const r = interpretMorningCortisolUgDl(2.9);
    expect(r.band).toBe("low");
    expect(r.label).toMatch(/adrenal insufficiency/i);
  });

  it("treats 3–15 µg/dL as indeterminate (ACTH stim)", () => {
    expect(interpretMorningCortisolUgDl(3).band).toBe("indeterminate");
    expect(interpretMorningCortisolUgDl(8).band).toBe("indeterminate");
    expect(interpretMorningCortisolUgDl(15).band).toBe("indeterminate");
    expect(interpretMorningCortisolUgDl(8).label).toMatch(/ACTH/i);
  });

  it("treats >15 µg/dL as adrenal insufficiency unlikely", () => {
    const r = interpretMorningCortisolUgDl(15.1);
    expect(r.band).toBe("adequate");
    expect(r.label).toMatch(/unlikely/i);
  });

  it("converts 3 µg/dL ≈ 83 nmol/L and 15 µg/dL ≈ 414 nmol/L", () => {
    expect(cortisolNmolLFromUgDl(3)).toBeCloseTo(82.77, 1);
    expect(cortisolNmolLFromUgDl(15)).toBeCloseTo(413.85, 1);
    expect(cortisolUgDlFromNmolL(82.77)).toBeCloseTo(3, 2);
  });
});

describe("taper schedule", () => {
  it("reduces 40 mg pred-eq toward 0 with faster steps above 10 mg", () => {
    const steps = buildTaperSchedule(40, "standard", 0);
    expect(steps.length).toBeGreaterThan(4);
    expect(steps[0].predEq).toBe(35);
    expect(steps[0].band).toBe("high");
    expect(steps.some((s) => s.band === "ten_to_five")).toBe(true);
    expect(steps[steps.length - 1].band).toBe("near_physiologic");
    expect(steps[steps.length - 1].predEq).toBe(0);
  });

  it("holds near-physiologic steps longer than high-dose steps", () => {
    const steps = buildTaperSchedule(40, "standard", 0);
    const high = steps.find((s) => s.band === "high")!;
    const phys = steps.find((s) => s.band === "near_physiologic")!;
    expect(phys.weeks).toBeGreaterThan(high.weeks);
  });
});
