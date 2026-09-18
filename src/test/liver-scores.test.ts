import { describe, expect, it } from "vitest";
import {
  AASLD_LIVER_CUTOFFS,
  calcChildPugh,
  calcMeld3,
  childPughClass,
  classifyAPRI,
  classifyFIB4,
  classifyNFS,
  patternFromLFTs,
} from "@/lib/liver-scores";

describe("Liver scores (existing app formulas)", () => {
  const aasld = AASLD_LIVER_CUTOFFS;

  it("computes FIB-4 as (age × AST) / (platelets × √ALT) with AASLD cut-offs", () => {
    // (58 × 45) / (180 × √38) ≈ 2.35 → indeterminate (1.3–2.67)
    const fib4 = classifyFIB4(58, 45, 38, 180, aasld);
    expect(fib4.score).toBeCloseTo(2.35, 2);
    expect(fib4.risk).toBe("indeterminate");
  });

  it("uses the age-adjusted FIB-4 low cut-off at ≥65 years", () => {
    const elderlyLow = classifyFIB4(70, 30, 25, 250, aasld);
    // (70 × 30) / (250 × √25) = 1.68 → low vs elderly cut-off 2.0
    expect(elderlyLow.score).toBeCloseTo(1.68, 2);
    expect(elderlyLow.risk).toBe("low");

    const midlifeSameScore = classifyFIB4(50, 42, 25, 250, aasld);
    // (50 × 42) / (250 × √25) = 1.68 → indeterminate vs <65 cut-off 1.3
    expect(midlifeSameScore.score).toBeCloseTo(1.68, 2);
    expect(midlifeSameScore.risk).toBe("indeterminate");
  });

  it("computes APRI as ((AST / ULN) × 100) / platelets", () => {
    // ((45 / 40) × 100) / 180 = 0.625 → indeterminate (0.5–1.5)
    const apri = classifyAPRI(45, 40, 180, aasld);
    expect(apri.score).toBeCloseTo(0.625, 3);
    expect(apri.risk).toBe("indeterminate");
  });

  it("computes NAFLD fibrosis score with the existing coefficients", () => {
    const nfs = classifyNFS(58, 27, false, 180, 3.8, 45, 38, aasld);
    const expected =
      -1.675 + 0.037 * 58 + 0.094 * 27 + 1.13 * 0 + 0.99 * (45 / 38) - 0.013 * 180 - 0.66 * 3.8;
    expect(nfs.score).toBeCloseTo(expected, 6);
    expect(nfs.risk).toBe("indeterminate");
  });

  it("adds the IFG/diabetes term to NFS when hyperglycemia is true", () => {
    const without = classifyNFS(58, 27, false, 180, 3.8, 45, 38, aasld).score;
    const withIfg = classifyNFS(58, 27, true, 180, 3.8, 45, 38, aasld).score;
    expect(withIfg - without).toBeCloseTo(1.13, 6);
  });

  it("classifies LFT pattern from AST/ALT/ALP the same way as the Liver page", () => {
    expect(patternFromLFTs(0, 0, 0)).toBe("unknown");
    expect(patternFromLFTs(20, 20, 80)).toBe("normal");
    expect(patternFromLFTs(200, 250, 90)).toBe("hepatocellular");
    expect(patternFromLFTs(45, 38, 120)).toBe("cholestatic");
  });

  it("computes MELD 3.0 with the existing clamps and coefficients", () => {
    const meld = calcMeld3({
      bilirubin: 1.2,
      inr: 1.1,
      creatinine: 0.9,
      sodium: 138,
      albumin: 3.8,
      sex: "male",
    });
    // bili 1.2, inr 1.1, cr→1, na→137, alb→3.5, male
    const expected = Math.max(
      6,
      Math.min(
        40,
        Math.round(
          4.56 * Math.log(1.2) + 9.09 * Math.log(1.1) + 11.14 * Math.log(1) + 6,
        ),
      ),
    );
    expect(meld).toBe(expected);
    expect(meld).toBe(8);
  });

  it("adds the MELD 3.0 female coefficient before rounding", () => {
    const shared = {
      bilirubin: 2.5,
      inr: 1.8,
      creatinine: 1.4,
      sodium: 130,
      albumin: 2.8,
    };
    const bili = Math.max(1, shared.bilirubin);
    const inr = Math.max(1, shared.inr);
    const cr = Math.min(3, Math.max(1, shared.creatinine));
    const na = Math.min(137, Math.max(125, shared.sodium));
    const alb = Math.min(3.5, Math.max(1.5, shared.albumin));
    const base =
      4.56 * Math.log(bili) +
      0.82 * (137 - na) -
      0.24 * (137 - na) * Math.log(bili) +
      9.09 * Math.log(inr) +
      11.14 * Math.log(cr) +
      1.85 * (3.5 - alb) -
      1.83 * (3.5 - alb) * Math.log(cr) +
      6;
    expect(calcMeld3({ ...shared, sex: "male" })).toBe(Math.max(6, Math.min(40, Math.round(base))));
    expect(calcMeld3({ ...shared, sex: "female" })).toBe(
      Math.max(6, Math.min(40, Math.round(base + 1.33))),
    );
  });

  it("scores Child-Pugh with the existing 1/2/3 lab bands and 1-or-3 clinical flags", () => {
    const compensated = calcChildPugh({
      bilirubin: 1.2,
      albumin: 3.8,
      inr: 1.1,
      ascites: false,
      encephalopathy: false,
    });
    expect(compensated).toBe(5);
    expect(childPughClass(compensated)).toBe("A");

    const decompensated = calcChildPugh({
      bilirubin: 4,
      albumin: 2.5,
      inr: 2.4,
      ascites: true,
      encephalopathy: true,
    });
    expect(decompensated).toBe(15);
    expect(childPughClass(decompensated)).toBe("C");
  });

  it("returns empty fibrosis scores when required inputs are missing", () => {
    expect(classifyFIB4(0, 45, 38, 180, aasld).risk).toBeNull();
    expect(Number.isNaN(classifyFIB4(0, 45, 38, 180, aasld).score)).toBe(true);
    expect(classifyAPRI(45, 40, 0, aasld).risk).toBeNull();
    expect(classifyNFS(58, 0, false, 180, 3.8, 45, 38, aasld).risk).toBeNull();
  });
});
