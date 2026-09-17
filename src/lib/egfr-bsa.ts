/** Mosteller body surface area (m²): √(height_cm × weight_kg / 3600). */
export function calculateMostellerBsa(weightKg: number, heightCm: number): number {
  if (!(weightKg > 0) || !(heightCm > 0)) return NaN;
  return Math.sqrt((heightCm * weightKg) / 3600);
}

/**
 * Convert indexed eGFR (mL/min/1.73 m²) to BSA-adjusted / unindexed eGFR (mL/min).
 * CKD-EPI reports values indexed to 1.73 m²; multiply by BSA/1.73 for absolute GFR.
 */
export function adjustEgfrForBsa(indexedEgfrMlMinPer173: number, bsaM2: number): number {
  if (!(indexedEgfrMlMinPer173 >= 0) || !(bsaM2 > 0)) return NaN;
  return indexedEgfrMlMinPer173 * (bsaM2 / 1.73);
}

export const KG_PER_LB = 0.45359237;
export const CM_PER_INCH = 2.54;

export function kgFromLb(lb: number): number {
  return lb * KG_PER_LB;
}

export function lbFromKg(kg: number): number {
  return kg / KG_PER_LB;
}

export function cmFromInches(inches: number): number {
  return inches * CM_PER_INCH;
}

export function inchesFromCm(cm: number): number {
  return cm / CM_PER_INCH;
}

export function heightToFtIn(heightCm: number): { feet: number; inches: number } {
  const totalIn = inchesFromCm(heightCm);
  const feet = Math.floor(totalIn / 12 + 1e-9);
  const inches = Math.max(0, totalIn - feet * 12);
  return { feet, inches };
}

export function heightFromFtIn(feet: number, inches: number): number {
  return cmFromInches(feet * 12 + inches);
}

export function roundTo(n: number, decimals: number): number {
  const f = 10 ** decimals;
  return Math.round(n * f) / f;
}

export function parsePositiveNumber(raw: string): number | null {
  const n = parseFloat(raw);
  if (!raw.trim() || Number.isNaN(n)) return null;
  return n;
}

export type BsaInputErrors = { height?: string; weight?: string };

/** Validate height (cm) and weight (kg) used for BSA. */
export function validateBsaInputs(heightCm: string, weightKg: string): BsaInputErrors {
  const errors: BsaInputErrors = {};
  const w = parsePositiveNumber(weightKg);
  if (w === null || w <= 0 || w > 300) {
    errors.weight = "Enter valid weight (1–300 kg, or equivalent in lb)";
  }
  const h = parsePositiveNumber(heightCm);
  if (h === null || h < 50 || h > 250) {
    errors.height = "Enter valid height (50–250 cm, or equivalent in ft/in)";
  }
  return errors;
}
