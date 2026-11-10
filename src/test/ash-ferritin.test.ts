import { describe, expect, it } from "vitest";
import {
  ashFerritinCutoff,
  diagnoseIronDeficiency,
  ferritinBelowCutoff,
  isAshPediatricAge,
} from "@/lib/ash-ferritin";
import { ganzoniDeficitMg } from "@/lib/ganzoni";

const adult = ashFerritinCutoff();
const inflam = ashFerritinCutoff({ inflammation: true });
const ibd = ashFerritinCutoff({ ibd: true });
const cancer = ashFerritinCutoff({ cancer: true });
const hmb = ashFerritinCutoff({ hmb: true });
const symptomatic = ashFerritinCutoff({ symptomatic: true });
const pregAnemia = ashFerritinCutoff({ pregnancy: true, pregnancyAnemia: true });
const pregOnly = ashFerritinCutoff({ pregnancy: true });
const pediatric = ashFerritinCutoff({ ageYears: 3 });

describe("ASH ferritin ID cut-offs", () => {
  it("defaults to ≤30 ng/mL for adults (inclusive)", () => {
    expect(adult).toMatchObject({ ngPerMl: 30, inclusive: true, band: "adult" });
    expect(ferritinBelowCutoff(30, adult)).toBe(true);
    expect(ferritinBelowCutoff(30.1, adult)).toBe(false);
    expect(ferritinBelowCutoff(0, adult)).toBe(false);
  });

  it("uses ≤50 ng/mL in high-risk settings (HMB, symptomatic, pregnancy with anaemia)", () => {
    expect(hmb.ngPerMl).toBe(50);
    expect(symptomatic.ngPerMl).toBe(50);
    expect(pregAnemia.ngPerMl).toBe(50);
    expect(ferritinBelowCutoff(50, hmb)).toBe(true);
    expect(ferritinBelowCutoff(51, hmb)).toBe(false);
  });

  it("keeps pregnancy without anaemia on the adult ≤30 band", () => {
    expect(pregOnly.band).toBe("adult");
    expect(pregOnly.ngPerMl).toBe(30);
  });

  it("uses <100 ng/mL (or TSAT <20%) for inflammation, IBD, or cancer", () => {
    expect(inflam).toMatchObject({ ngPerMl: 100, inclusive: false, band: "inflammatory" });
    expect(ibd.band).toBe("inflammatory");
    expect(cancer.band).toBe("inflammatory");
    expect(ferritinBelowCutoff(99.9, inflam)).toBe(true);
    expect(ferritinBelowCutoff(100, inflam)).toBe(false);
  });

  it("uses ≤20 ng/mL for children 9 months–4 years", () => {
    expect(isAshPediatricAge(0.74)).toBe(false);
    expect(isAshPediatricAge(0.75)).toBe(true);
    expect(isAshPediatricAge(4.9)).toBe(true);
    expect(isAshPediatricAge(5)).toBe(false);
    expect(pediatric.ngPerMl).toBe(20);
    expect(ferritinBelowCutoff(20, pediatric)).toBe(true);
    expect(ferritinBelowCutoff(21, pediatric)).toBe(false);
  });

  it("lets inflammatory and high-risk bands take precedence over pediatric/adult", () => {
    expect(ashFerritinCutoff({ ageYears: 3, inflammation: true }).band).toBe("inflammatory");
    expect(ashFerritinCutoff({ ageYears: 3, hmb: true }).band).toBe("high_risk");
  });
});

describe("ASH-aligned deficiency diagnosis (not Ganzoni)", () => {
  it("classifies ferritin 15 + TSAT 12 as absolute ID (existing path)", () => {
    const dx = diagnoseIronDeficiency(15, 12, adult);
    expect(dx?.label).toBe("absolute");
    expect(dx?.diagnosis).toBe("Absolute Iron Deficiency");
    expect(dx?.detail).toMatch(/Definitive iron deficiency/i);
  });

  it("treats ferritin 30 as absolute ID (ASH ≤30, previously <30)", () => {
    expect(diagnoseIronDeficiency(30, 25, adult)?.label).toBe("absolute");
    expect(diagnoseIronDeficiency(31, 25, adult)?.label).toBe("early");
  });

  it("applies ≤50 for HMB so ferritin 40 becomes absolute ID", () => {
    expect(diagnoseIronDeficiency(40, 22, adult)?.label).toBe("early");
    expect(diagnoseIronDeficiency(40, 22, hmb)?.label).toBe("absolute");
  });

  it("applies inflammatory <100 so ferritin 80 + normal TSAT is absolute ID", () => {
    expect(diagnoseIronDeficiency(80, 25, adult)?.label).toBe("early");
    expect(diagnoseIronDeficiency(80, 25, inflam)?.label).toBe("absolute");
    expect(diagnoseIronDeficiency(80, 25, ibd)?.label).toBe("absolute");
  });

  it("keeps ferritin 150 + TSAT 15 + inflammation as functional ID", () => {
    const dx = diagnoseIronDeficiency(150, 15, inflam);
    expect(dx?.label).toBe("functional");
    expect(dx?.diagnosis).toBe("Functional Iron Deficiency");
  });

  it("uses pediatric ≤20 so ferritin 25 with low TSAT is borderline, not ≤20 absolute ID", () => {
    expect(diagnoseIronDeficiency(25, 12, adult)?.label).toBe("absolute");
    expect(diagnoseIronDeficiency(25, 12, pediatric)?.label).toBe("absolute"); // borderline: 20–100 + low TSAT
    expect(diagnoseIronDeficiency(25, 12, pediatric)?.diagnosis).toMatch(/Borderline/);
    expect(diagnoseIronDeficiency(15, 12, pediatric)?.diagnosis).toBe("Absolute Iron Deficiency");
  });
});

describe("Ganzoni math is independent of ASH ferritin cut-offs", () => {
  it("still uses weight × (target Hb − actual Hb) × 2.4 + stores", () => {
    expect(
      ganzoniDeficitMg({ weightKg: 70, actualHb: 8.5, targetHb: 14, ironStores: 500 }),
    ).toBe(1424);
  });
});
