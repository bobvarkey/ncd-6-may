/** mg of named glucocorticoid that equals 5 mg prednisone / prednisolone. */
export const GLUCOCORTICOID_EQ_MG: Record<string, number> = {
  Prednisone: 5,
  Prednisolone: 5,
  Methylprednisolone: 4,
  Hydrocortisone: 20,
  Dexamethasone: 0.75,
  Deflazacort: 6,
  Triamcinolone: 4,
  Betamethasone: 0.6,
};

export const GLUCOCORTICOID_NAMES = Object.keys(GLUCOCORTICOID_EQ_MG);

/** Conventional conversion: 1 µg/dL cortisol ≈ 27.59 nmol/L. */
export const CORTISOL_UG_DL_TO_NMOL_L = 27.59;

export type DoseBand = "high" | "ten_to_five" | "near_physiologic";

export const WITHDRAWAL_PHASES: {
  id: DoseBand;
  title: string;
  dose: string;
  action: string;
}[] = [
  {
    id: "high",
    title: "High doses",
    dose: "Above ~10 mg/day",
    action: "Reduce relatively rapidly toward ~10 mg/day prednisolone.",
  },
  {
    id: "ten_to_five",
    title: "10 → 5 mg/day",
    dose: "10 to 5 mg/day",
    action: "Reduce more slowly.",
  },
  {
    id: "near_physiologic",
    title: "Near 5 mg/day",
    dose: "Approaching physiologic dose",
    action: "Taper more gradually to allow HPA-axis recovery.",
  },
];

export function toPrednisoloneEq(drug: string, doseMg: number): number {
  const factor = GLUCOCORTICOID_EQ_MG[drug] ?? 5;
  return (doseMg / factor) * 5;
}

export function fromPrednisoloneEq(drug: string, predEqMg: number): number {
  const factor = GLUCOCORTICOID_EQ_MG[drug] ?? 5;
  return (predEqMg / 5) * factor;
}

export function doseBand(predEqMg: number): DoseBand {
  if (predEqMg > 10) return "high";
  if (predEqMg > 5) return "ten_to_five";
  return "near_physiologic";
}

export type CortisolBand = "low" | "indeterminate" | "adequate";

export type CortisolInterpretation = {
  band: CortisolBand;
  label: string;
  detail: string;
};

/**
 * Morning (08:00) cortisol after prolonged glucocorticoid use or withdrawal symptoms.
 * Thresholds: <3 µg/dL suggests adrenal insufficiency; >15 µg/dL makes it unlikely;
 * 3–15 µg/dL → consider ACTH stimulation testing.
 */
export function interpretMorningCortisolUgDl(ugDl: number): CortisolInterpretation {
  if (ugDl < 3) {
    return {
      band: "low",
      label: "Adrenal insufficiency suggested",
      detail:
        "08:00 cortisol <3 µg/dL after prolonged use or with symptoms suggests adrenal insufficiency. Continue physiologic replacement; do not stop abruptly.",
    };
  }
  if (ugDl > 15) {
    return {
      band: "adequate",
      label: "Adrenal insufficiency unlikely",
      detail:
        "08:00 cortisol >15 µg/dL makes adrenal insufficiency unlikely. Confirm the withdrawal decision clinically.",
    };
  }
  return {
    band: "indeterminate",
    label: "Indeterminate — consider ACTH stim",
    detail:
      "08:00 cortisol 3–15 µg/dL is indeterminate. Consider an ACTH (Synacthen) stimulation test and continue physiologic replacement while evaluating.",
  };
}

export function cortisolUgDlFromNmolL(nmolL: number): number {
  return nmolL / CORTISOL_UG_DL_TO_NMOL_L;
}

export function cortisolNmolLFromUgDl(ugDl: number): number {
  return ugDl * CORTISOL_UG_DL_TO_NMOL_L;
}

export const TAPER_SPEED = {
  faster: { label: "Faster", mult: 0.5, note: "Short courses, good control, urgent withdrawal" },
  standard: { label: "Standard", mult: 1, note: "Default for most chronic courses" },
  slower: { label: "Slower", mult: 2, note: "Long duration, prior flares, symptomatic withdrawal" },
} as const;

export type TaperSpeed = keyof typeof TAPER_SPEED;

export type TaperStep = {
  phase: string;
  band: DoseBand;
  predEq: number;
  weeks: number;
};

function decrement(predEq: number): { dec: number; weeks: number; phase: string; band: DoseBand } {
  if (predEq > 40) return { dec: 10, weeks: 1, phase: "High dose", band: "high" };
  if (predEq > 20) return { dec: 5, weeks: 1, phase: "High dose", band: "high" };
  if (predEq > 10) return { dec: 2.5, weeks: 2, phase: "Toward ~10 mg", band: "high" };
  if (predEq > 5) return { dec: 1, weeks: 2, phase: "10 → 5 mg", band: "ten_to_five" };
  return { dec: 0.5, weeks: 4, phase: "Near 5 mg / HPA", band: "near_physiologic" };
}

/** Phase-based taper: faster above physiologic dose, slower near replacement (~5 mg pred-eq). */
export function buildTaperSchedule(
  startPredEq: number,
  speed: TaperSpeed,
  targetPredEq: number,
): TaperStep[] {
  const steps: TaperStep[] = [];
  let cur = startPredEq;
  let guard = 0;
  while (cur > targetPredEq + 0.001 && guard < 60) {
    const { dec, weeks, phase, band } = decrement(cur);
    const next = Math.max(targetPredEq, Math.round((cur - dec) * 100) / 100);
    const w = Math.max(1, Math.round(weeks * TAPER_SPEED[speed].mult));
    steps.push({ phase, band, predEq: next, weeks: w });
    cur = next;
    guard += 1;
  }
  return steps;
}

export function roundMg(n: number): string {
  return (Math.round(n * 100) / 100).toFixed(2).replace(/\.00$/, "").replace(/(\.\d)0$/, "$1");
}
