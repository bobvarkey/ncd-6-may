import { describe, expect, it } from "vitest";
import {
  defaultIronStores,
  defaultTargetHb,
  ganzoniDeficitMg,
  ganzoniDoseRecommendation,
} from "@/lib/ganzoni";

describe("Ganzoni iron deficit (existing app formula)", () => {
  it("uses weight × (target Hb − actual Hb) × 2.4 + iron stores", () => {
    // 70 × (14 − 8.5) × 2.4 + 500 = 1424
    expect(
      ganzoniDeficitMg({ weightKg: 70, actualHb: 8.5, targetHb: 14, ironStores: 500 }),
    ).toBe(1424);
  });

  it("does not return a negative deficit", () => {
    expect(
      ganzoniDeficitMg({ weightKg: 70, actualHb: 16, targetHb: 14, ironStores: 0 }),
    ).toBe(0);
  });

  it("defaults target Hb: adult ≥35 kg 14, <35 kg 13, pregnancy 11, CKD 12", () => {
    expect(defaultTargetHb(70)).toBe(14);
    expect(defaultTargetHb(34)).toBe(13);
    expect(defaultTargetHb(70, { pregnancy: true })).toBe(11);
    expect(defaultTargetHb(70, { ckd: true })).toBe(12);
    expect(defaultTargetHb(70, { pregnancy: true, ckd: true })).toBe(11);
  });

  it("defaults iron stores: 500 mg if ≥35 kg, else 15 mg/kg", () => {
    expect(defaultIronStores(70)).toBe(500);
    expect(defaultIronStores(34)).toBe(510);
  });

  it("rounds IV dosing the same way as the existing calculators", () => {
    expect(ganzoniDoseRecommendation(400, true)).toBe("400 mg → 500 mg IV iron (single dose)");
    expect(ganzoniDoseRecommendation(800, true)).toBe("800 mg → 1000 mg IV iron (single or split dose)");
    expect(ganzoniDoseRecommendation(1424, true)).toBe(
      "1424 mg → 1500 mg IV iron, split over 1–2 doses",
    );
  });
});
