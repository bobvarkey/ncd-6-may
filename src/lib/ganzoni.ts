/**
 * Ganzoni iron deficit — preserved from the existing calculators.
 *
 * Total iron deficit (mg) = weight (kg) × (target Hb − actual Hb) × 2.4 + iron stores
 *
 * Target Hb defaults: pregnancy 11, CKD 12, weight ≥35 kg → 14, else 13.
 * Iron stores defaults: ≥35 kg → 500 mg, else 15 mg/kg.
 */

export function defaultTargetHb(
  weightKg: number,
  opts?: { pregnancy?: boolean; ckd?: boolean },
): number {
  if (opts?.pregnancy) return 11;
  if (opts?.ckd) return 12;
  if (weightKg >= 35) return 14;
  return 13;
}

export function defaultIronStores(weightKg: number): number {
  return weightKg >= 35 ? 500 : 15 * weightKg;
}

export function ganzoniDeficitMg(params: {
  weightKg: number;
  actualHb: number;
  targetHb: number;
  ironStores: number;
}): number {
  const { weightKg, actualHb, targetHb, ironStores } = params;
  return Math.max(0, weightKg * (targetHb - actualHb) * 2.4 + ironStores);
}

export function ganzoniDoseRecommendation(deficit: number, isIV: boolean): string {
  if (!isIV) {
    return "40–65 mg elemental iron PO daily or every other day (e.g., ferrous sulfate 325 mg = 65 mg elemental)";
  }
  if (deficit <= 500) return `${Math.round(deficit)} mg → 500 mg IV iron (single dose)`;
  if (deficit <= 1000) return `${Math.round(deficit)} mg → 1000 mg IV iron (single or split dose)`;
  return `${Math.round(deficit)} mg → ${Math.ceil(deficit / 100) * 100} mg IV iron, split over 1–2 doses`;
}
