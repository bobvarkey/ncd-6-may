import { describe, expect, it } from "vitest";
import {
  adjustEgfrForBsa,
  calculateMostellerBsa,
  cmFromInches,
  heightFromFtIn,
  heightToFtIn,
  kgFromLb,
  lbFromKg,
  roundTo,
  validateBsaInputs,
} from "@/lib/egfr-bsa";

describe("Mosteller BSA", () => {
  it("matches the classic 180 cm / 80 kg example (2.00 m²)", () => {
    expect(roundTo(calculateMostellerBsa(80, 180), 2)).toBe(2);
  });

  it("computes BSA for a typical adult", () => {
    // √(170 × 70 / 3600) ≈ 1.82 m²
    expect(roundTo(calculateMostellerBsa(70, 170), 2)).toBe(1.82);
  });

  it("returns NaN for non-positive inputs", () => {
    expect(calculateMostellerBsa(0, 170)).toBeNaN();
    expect(calculateMostellerBsa(70, -1)).toBeNaN();
  });
});

describe("BSA-adjusted eGFR", () => {
  it("converts indexed eGFR to absolute mL/min", () => {
    // 90 mL/min/1.73m² at BSA 2.00 m² → 90 × (2/1.73) ≈ 104.0
    expect(roundTo(adjustEgfrForBsa(90, 2), 1)).toBe(104);
  });

  it("is a no-op when BSA is 1.73 m²", () => {
    expect(roundTo(adjustEgfrForBsa(62.4, 1.73), 1)).toBe(62.4);
  });

  it("returns NaN for invalid BSA", () => {
    expect(adjustEgfrForBsa(90, 0)).toBeNaN();
  });
});

describe("height/weight unit helpers", () => {
  it("round-trips kg ↔ lb", () => {
    const kg = 70;
    expect(roundTo(kgFromLb(lbFromKg(kg)), 5)).toBe(70);
  });

  it("round-trips cm ↔ ft/in", () => {
    const cm = heightFromFtIn(5, 10); // 70 in = 177.8 cm
    expect(roundTo(cm, 1)).toBe(177.8);
    const { feet, inches } = heightToFtIn(cm);
    expect(feet).toBe(5);
    expect(roundTo(inches, 1)).toBe(10);
  });

  it("converts inches to cm", () => {
    expect(roundTo(cmFromInches(12), 2)).toBe(30.48);
  });
});

describe("validateBsaInputs", () => {
  it("accepts typical metric values", () => {
    expect(validateBsaInputs("170", "70")).toEqual({});
  });

  it("rejects empty or out-of-range values", () => {
    expect(validateBsaInputs("", "")).toMatchObject({
      height: expect.any(String),
      weight: expect.any(String),
    });
    expect(validateBsaInputs("10", "400")).toMatchObject({
      height: expect.any(String),
      weight: expect.any(String),
    });
  });
});
