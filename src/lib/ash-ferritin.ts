/**
 * ASH hematology ferritin ID cut-offs for the Iron Calculator.
 *
 * Source: ASH hematology guidance (@ASH_hematology / ASH), as supplied for this app.
 * Ganzoni deficit math is intentionally not derived from these cut-offs.
 */

export type AshFerritinBand = "inflammatory" | "high_risk" | "adult" | "pediatric";

export type AshFerritinContext = {
  ageYears?: number | null;
  pregnancy?: boolean;
  hmb?: boolean;
  symptomatic?: boolean;
  inflammation?: boolean;
  ibd?: boolean;
  cancer?: boolean;
  /** Pregnancy with anaemia (typically Hb < 11 g/dL) or other listed risk factors. */
  pregnancyAnemia?: boolean;
};

export type AshFerritinCutoff = {
  ngPerMl: number;
  inclusive: boolean;
  band: AshFerritinBand;
  inequality: string;
  shortLabel: string;
};

export type DeficiencyType = "absolute" | "functional" | "early" | "borderline" | "none" | "other" | "unknown";

export type DeficiencyDiagnosis = {
  diagnosis: string;
  detail: string;
  label: DeficiencyType;
};

export const ASH_FERRITIN_SOURCE = "ASH hematology (@ASH_hematology)";

/** Children 9 months–4 years (age entered in years; 0.75 = 9 months, up to but not including 5). */
export function isAshPediatricAge(ageYears: number | null | undefined): boolean {
  if (ageYears == null || Number.isNaN(ageYears)) return false;
  return ageYears >= 0.75 && ageYears < 5;
}

export function isInflammatoryAshSetting(ctx: AshFerritinContext): boolean {
  return Boolean(ctx.inflammation || ctx.ibd || ctx.cancer);
}

export function isHighRiskAshSetting(ctx: AshFerritinContext): boolean {
  return Boolean(ctx.hmb || ctx.symptomatic || (ctx.pregnancy && ctx.pregnancyAnemia));
}

/**
 * Pick the ASH ferritin ID cut-off for the current context.
 * More specific / higher inflammatory and high-risk bands take precedence.
 */
export function ashFerritinCutoff(ctx: AshFerritinContext = {}): AshFerritinCutoff {
  if (isInflammatoryAshSetting(ctx)) {
    return {
      ngPerMl: 100,
      inclusive: false,
      band: "inflammatory",
      inequality: "<100 ng/mL",
      shortLabel: "<100 ng/mL or TSAT <20% · inflammation",
    };
  }
  if (isHighRiskAshSetting(ctx)) {
    return {
      ngPerMl: 50,
      inclusive: true,
      band: "high_risk",
      inequality: "≤50 ng/mL",
      shortLabel: "≤50 ng/mL · high-risk",
    };
  }
  if (isAshPediatricAge(ctx.ageYears)) {
    return {
      ngPerMl: 20,
      inclusive: true,
      band: "pediatric",
      inequality: "≤20 ng/mL",
      shortLabel: "≤20 ng/mL · 9 mo–4 y",
    };
  }
  return {
    ngPerMl: 30,
    inclusive: true,
    band: "adult",
    inequality: "≤30 ng/mL",
    shortLabel: "≤30 ng/mL · adults",
  };
}

export function ferritinBelowCutoff(ferritin: number, cutoff: AshFerritinCutoff): boolean {
  if (!(ferritin > 0)) return false;
  return cutoff.inclusive ? ferritin <= cutoff.ngPerMl : ferritin < cutoff.ngPerMl;
}

/**
 * Iron-deficiency pattern using ASH ferritin bands.
 * Does not compute Ganzoni doses.
 */
export function diagnoseIronDeficiency(
  ferritin: number,
  tsat: number,
  cutoff: AshFerritinCutoff,
): DeficiencyDiagnosis | null {
  if (!ferritin && !tsat) return null;

  const inflam = cutoff.band === "inflammatory";
  const below = ferritinBelowCutoff(ferritin, cutoff);
  const ferritinFunctional = ferritin >= 100 && ferritin < 300;
  const ferritinReplete = ferritin >= 300;
  const tsatLow = tsat < 20;
  const tsatNormal = tsat >= 20;

  if (below) {
    return {
      diagnosis: "Absolute Iron Deficiency",
      detail: tsatLow
        ? `Ferritin ${cutoff.inequality} (ASH hematology) + TSAT <20%. Definitive iron deficiency.`
        : `Ferritin ${cutoff.inequality} indicates iron deficiency (ASH hematology). A normal TSAT does not exclude it.`,
      label: "absolute",
    };
  }

  if (ferritinFunctional && tsatLow) {
    if (inflam) {
      return {
        diagnosis: "Functional Iron Deficiency",
        detail:
          "Ferritin 100–300 ng/mL with TSAT <20% in inflammation, cancer, IBD or infection — iron trapped in storage. ASH: TSAT <20% may indicate iron deficiency in these settings.",
        label: "functional",
      };
    }
    return {
      diagnosis: "Functional Iron Deficiency (CKD/ESA)",
      detail:
        "Ferritin 100–300 with low TSAT — iron available but not utilized. IV iron indicated per guidelines.",
      label: "functional",
    };
  }

  if (!inflam && ferritin > cutoff.ngPerMl && ferritin < 100) {
    if (tsatNormal) {
      return {
        diagnosis: "Early/Marginal Iron Deficiency",
        detail: `Ferritin above the ASH ${cutoff.inequality} cut-off but <100, with normal TSAT. Low stores, still sufficient for erythropoiesis. Oral iron may benefit.`,
        label: "early",
      };
    }
    return {
      diagnosis: "Absolute Iron Deficiency (Borderline)",
      detail:
        "Ferritin between the ASH cut-off and 100 with low TSAT — consistent with absolute iron deficiency despite borderline ferritin.",
      label: "absolute",
    };
  }

  if (ferritinReplete && tsatNormal) {
    return {
      diagnosis: "Iron Deficiency Unlikely",
      detail: "Ferritin ≥300 ng/mL and TSAT ≥20%. Adequate iron stores.",
      label: "none",
    };
  }

  if (ferritinReplete && tsatLow) {
    return {
      diagnosis: "Low TSAT with Replete Ferritin",
      detail: "Consider anemia of chronic disease, mixed deficiency, or lab error. Further workup needed.",
      label: "other",
    };
  }

  if (ferritinFunctional && tsatNormal) {
    return {
      diagnosis: "Iron Deficiency Unlikely",
      detail: "Ferritin 100–300 with normal TSAT — adequate iron for erythropoiesis.",
      label: "none",
    };
  }

  return { diagnosis: "Unable to Classify", detail: "Check input values.", label: "unknown" };
}
