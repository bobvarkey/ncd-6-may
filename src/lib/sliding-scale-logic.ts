// Inpatient Glycemic Management CDS — Sliding Scale Insulin Decision Logic
// Based on ADA inpatient guidelines + provided JSON schema rules

export type DiabetesType = "type1" | "type2" | "stress_hyperglycemia" | "other" | "unknown";
export type CareSetting = "ward" | "icu" | "stepdown" | "ed" | "perioperative";
export type NutritionStatus =
  | "eating_regular"
  | "eating_poorly"
  | "clear_liquids"
  | "enteral_feeds"
  | "parenteral_nutrition"
  | "npo";
export type CorrectionScale = "low" | "medium" | "high" | "none";

export interface SSIInput {
  // Patient
  age_years: number;
  weight_kg: number;
  diabetes_type: DiabetesType;
  a1c_percent?: number;
  pregnant?: boolean;
  // Encounter
  care_setting: CareSetting;
  // Clinical state
  nutrition_status: NutritionStatus;
  npo: boolean;
  egfr: number;
  dialysis?: boolean;
  liver_failure?: boolean;
  hemodynamic_instability?: boolean;
  on_glucocorticoid?: boolean;
  steroid_dose_pred_eq_mg?: number; // prednisone-equivalent mg/day
  procedure_planned_within_24h?: boolean;
  // Therapy
  basal_ordered: boolean;
  prandial_ordered: boolean;
  correction_ordered: boolean;
  sliding_scale_only: boolean;
  iv_insulin: boolean;
  total_daily_dose_units?: number;
  // Glucose summary (last 24h)
  min_glucose: number;
  max_glucose: number;
  mean_glucose?: number;
  events_ge_180: number;
  events_ge_250: number;
  events_le_80: number;
  events_le_70: number;
}

export type AlertCode =
  | "TYPE1_NO_BASAL"
  | "SSI_ONLY_INAPPROPRIATE"
  | "RECURRENT_HYPERGLYCEMIA"
  | "SEVERE_HYPERGLYCEMIA"
  | "IMPENDING_HYPOGLYCEMIA"
  | "HYPOGLYCEMIA"
  | "STEROID_HYPERGLYCEMIA_PATTERN"
  | "NPO_PRANDIAL_MISMATCH"
  | "RENAL_HYPOGLYCEMIA_RISK";

export type Severity = "info" | "warning" | "high" | "critical";

export interface SSIAlert {
  code: AlertCode;
  severity: Severity;
  message: string;
  recommended_action: string;
}

export type RecommendedRegimen =
  | "basal_bolus_correction"
  | "basal_plus_correction"
  | "correction_only_exception"
  | "iv_insulin_protocol"
  | "endocrinology_review";

export interface SlidingScaleRow {
  range: string;
  low: number;
  medium: number;
  high: number;
}

// Standard subcutaneous correction (sliding) scales — units of rapid-acting insulin
export const SLIDING_SCALES: SlidingScaleRow[] = [
  { range: "<70 mg/dL", low: 0, medium: 0, high: 0 },     // hypoglycemia protocol
  { range: "70–149", low: 0, medium: 0, high: 0 },
  { range: "150–199", low: 1, medium: 2, high: 4 },
  { range: "200–249", low: 2, medium: 4, high: 8 },
  { range: "250–299", low: 3, medium: 6, high: 10 },
  { range: "300–349", low: 4, medium: 8, high: 12 },
  { range: "350–399", low: 5, medium: 10, high: 14 },
  { range: "≥400", low: 6, medium: 12, high: 16 },
];

export interface SSIResult {
  recommended_regimen: RecommendedRegimen;
  recommended_scale: CorrectionScale;
  tdd_estimate_units?: number;
  basal_units?: number;
  prandial_units_per_meal?: number;
  alerts: SSIAlert[];
  rationale: string[];
  rules_fired: string[];
  scale_table: SlidingScaleRow[];
}

/**
 * Estimate total daily insulin dose (TDD) for inpatient initiation.
 * ADA: 0.3–0.5 units/kg; reduce in elderly/CKD/insulin-naïve.
 */
export function estimateTDD(input: SSIInput): number {
  let factor = 0.5;
  if (input.diabetes_type === "type1") factor = 0.5;
  else if (input.diabetes_type === "type2") factor = 0.4;
  else factor = 0.3;

  if (input.age_years >= 70) factor -= 0.1;
  if (input.egfr < 45) factor -= 0.1;
  if (input.dialysis) factor -= 0.1;
  if (input.liver_failure) factor -= 0.05;

  factor = Math.max(0.2, factor);
  return Math.round(input.weight_kg * factor);
}

/**
 * Pick a sliding-scale intensity tier based on insulin sensitivity proxies:
 * - TDD or weight-based estimate
 * - Renal function, age, hypo history
 */
export function pickScale(input: SSIInput, tdd: number): CorrectionScale {
  // Hypoglycemia or significant renal impairment → low
  if (input.events_le_70 > 0 || input.min_glucose < 70) return "low";
  if (input.egfr < 30 || input.dialysis) return "low";
  if (input.age_years >= 75 && input.npo) return "low";

  // High insulin requirements → high
  if (tdd >= 80) return "high";
  if (input.events_ge_250 >= 2) return "high";

  // Default medium for most insulin-requiring inpatients
  if (tdd >= 40 || input.events_ge_180 >= 3) return "medium";
  return "low";
}

export function evaluateSSI(input: SSIInput): SSIResult {
  const alerts: SSIAlert[] = [];
  const rationale: string[] = [];
  const rules_fired: string[] = [];

  // ---- Critical safety rules ----
  if (input.diabetes_type === "type1" && !input.basal_ordered) {
    alerts.push({
      code: "TYPE1_NO_BASAL",
      severity: "critical",
      message: "Type 1 diabetes without basal insulin — DKA risk.",
      recommended_action: "Order basal insulin immediately (glargine/detemir/degludec). Never use SSI alone in T1DM.",
    });
    rules_fired.push("TYPE1_REQUIRES_BASAL");
  }

  if (input.min_glucose < 54) {
    alerts.push({
      code: "HYPOGLYCEMIA",
      severity: "critical",
      message: `Severe hypoglycemia (min ${input.min_glucose} mg/dL) in last 24h.`,
      recommended_action: "Activate hypoglycemia protocol. Reduce basal 20% and hold next correction dose.",
    });
    rules_fired.push("HYPO_LT_54");
  } else if (input.events_le_70 > 0) {
    alerts.push({
      code: "HYPOGLYCEMIA",
      severity: "high",
      message: `${input.events_le_70} hypoglycemic event(s) <70 mg/dL.`,
      recommended_action: "Reduce basal by 10–20% and switch to LOW correction scale.",
    });
    rules_fired.push("HYPO_EVENTS");
  } else if (input.events_le_80 >= 2) {
    alerts.push({
      code: "IMPENDING_HYPOGLYCEMIA",
      severity: "warning",
      message: `${input.events_le_80} readings ≤80 mg/dL — trend toward hypoglycemia.`,
      recommended_action: "Consider 10% basal reduction; reassess nutrition timing.",
    });
    rules_fired.push("IMPENDING_HYPO");
  }

  if (input.max_glucose >= 400 || input.events_ge_250 >= 3) {
    alerts.push({
      code: "SEVERE_HYPERGLYCEMIA",
      severity: "high",
      message: `Severe hyperglycemia (max ${input.max_glucose} mg/dL).`,
      recommended_action: "Check ketones/anion gap. Consider IV insulin if persistent or DKA/HHS suspected.",
    });
    rules_fired.push("SEVERE_HYPER");
  } else if (input.events_ge_180 >= 3) {
    alerts.push({
      code: "RECURRENT_HYPERGLYCEMIA",
      severity: "warning",
      message: `${input.events_ge_180} readings ≥180 mg/dL in 24h.`,
      recommended_action: "Intensify regimen: add/uptitrate basal and prandial insulin.",
    });
    rules_fired.push("RECURRENT_HYPER");
  }

  // SSI-only inappropriate use
  if (
    input.sliding_scale_only &&
    input.diabetes_type !== "stress_hyperglycemia" &&
    (input.max_glucose >= 180 || input.events_ge_180 >= 2 || input.diabetes_type === "type1")
  ) {
    alerts.push({
      code: "SSI_ONLY_INAPPROPRIATE",
      severity: "high",
      message: "Sliding-scale insulin alone is inadequate for sustained hyperglycemia.",
      recommended_action: "Transition to scheduled basal ± prandial with correction (basal-bolus).",
    });
    rules_fired.push("SSI_ONLY_BAD");
  }

  // NPO + prandial mismatch
  if (input.npo && input.prandial_ordered) {
    alerts.push({
      code: "NPO_PRANDIAL_MISMATCH",
      severity: "high",
      message: "Prandial insulin ordered while patient is NPO.",
      recommended_action: "Hold prandial doses while NPO; continue basal at reduced dose (50–80%) and correction q4–6h.",
    });
    rules_fired.push("NPO_PRANDIAL");
  }

  // Renal hypoglycemia risk
  if ((input.egfr < 30 || input.dialysis) && input.basal_ordered) {
    alerts.push({
      code: "RENAL_HYPOGLYCEMIA_RISK",
      severity: "warning",
      message: `eGFR ${input.egfr} mL/min — increased insulin half-life and hypoglycemia risk.`,
      recommended_action: "Reduce TDD by 25%. Use LOW correction scale. Avoid glyburide; prefer glargine/detemir.",
    });
    rules_fired.push("RENAL_RISK");
  }

  // Steroid pattern
  if (input.on_glucocorticoid && (input.events_ge_180 >= 2 || input.max_glucose >= 200)) {
    alerts.push({
      code: "STEROID_HYPERGLYCEMIA_PATTERN",
      severity: "warning",
      message: "Steroid-induced hyperglycemia pattern (post-lunch/afternoon peaks expected).",
      recommended_action:
        "Add NPH insulin matched to steroid timing (e.g., NPH 0.1 U/kg per 10 mg prednisone-equivalent in AM with steroid).",
    });
    rules_fired.push("STEROID_PATTERN");
  }

  // ---- TDD estimate & scale selection ----
  const tdd = input.total_daily_dose_units && input.total_daily_dose_units > 0
    ? input.total_daily_dose_units
    : estimateTDD(input);
  const scale = pickScale(input, tdd);

  // ---- Recommended regimen ----
  let regimen: RecommendedRegimen = "basal_bolus_correction";

  if (
    input.care_setting === "icu" ||
    input.hemodynamic_instability ||
    input.max_glucose >= 400 ||
    (input.diabetes_type === "type1" && input.events_ge_250 >= 2)
  ) {
    regimen = "iv_insulin_protocol";
    rationale.push("Critical illness or severe hyperglycemia → IV insulin infusion preferred.");
  } else if (input.npo || input.nutrition_status === "clear_liquids" || input.nutrition_status === "eating_poorly") {
    regimen = "basal_plus_correction";
    rationale.push("Poor/no PO intake → basal + correction only; hold scheduled prandial.");
  } else if (
    input.diabetes_type === "stress_hyperglycemia" &&
    input.max_glucose < 180 &&
    input.events_ge_180 === 0 &&
    !input.basal_ordered
  ) {
    regimen = "correction_only_exception";
    rationale.push("Stress hyperglycemia without sustained BG ≥180 → correction-only is acceptable initially.");
  } else if (input.diabetes_type === "type1" || input.pregnant) {
    regimen = "basal_bolus_correction";
    rationale.push("T1DM or pregnancy → scheduled basal-bolus + correction is mandatory.");
  } else {
    regimen = "basal_bolus_correction";
    rationale.push("Sustained inpatient hyperglycemia → basal-bolus with correction is first-line.");
  }

  if (input.diabetes_type === "type1" && (input.events_ge_250 >= 2 || input.max_glucose >= 350)) {
    alerts.push({
      code: "RECURRENT_HYPERGLYCEMIA",
      severity: "high",
      message: "Persistent hyperglycemia in T1DM despite basal-bolus.",
      recommended_action: "Endocrinology consultation recommended.",
    });
    if (regimen !== "iv_insulin_protocol") regimen = "endocrinology_review";
  }

  // Dose split
  let basal_units: number | undefined;
  let prandial_units_per_meal: number | undefined;

  if (regimen === "basal_bolus_correction") {
    basal_units = Math.round(tdd * 0.5);
    prandial_units_per_meal = Math.round((tdd * 0.5) / 3);
  } else if (regimen === "basal_plus_correction") {
    basal_units = Math.round(tdd * 0.4); // reduced because no scheduled prandial
  }

  rationale.push(`Estimated TDD ≈ ${tdd} units (weight ${input.weight_kg} kg).`);
  rationale.push(`Selected ${scale.toUpperCase()} correction scale based on insulin sensitivity, renal function, and hypo history.`);
  if (basal_units) rationale.push(`Basal: ${basal_units} U at bedtime (glargine) or split BID (detemir/NPH).`);
  if (prandial_units_per_meal) rationale.push(`Prandial: ${prandial_units_per_meal} U with each meal (rapid-acting).`);
  rationale.push("Goal BG: 140–180 mg/dL (most non-critical inpatients); 110–180 mg/dL in select stable patients.");

  return {
    recommended_regimen: regimen,
    recommended_scale: scale,
    tdd_estimate_units: tdd,
    basal_units,
    prandial_units_per_meal,
    alerts,
    rationale,
    rules_fired,
    scale_table: SLIDING_SCALES,
  };
}

// ============================================================
// Insulin-product-specific SSI Dose Calculator
// ============================================================

export type InsulinProduct =
  | "regular"        // Generic regular human insulin (short-acting)
  | "actrapid"       // Novo Nordisk regular human insulin
  | "insugen_r"      // Biocon regular short-acting
  | "insugen_n"      // Biocon NPH intermediate-acting
  | "insugen_30_70"; // Biocon 30/70 premix (30% regular + 70% NPH)

export interface InsulinProductMeta {
  id: InsulinProduct;
  label: string;
  kind: "short" | "intermediate" | "premix";
  onset_min: string;
  peak_hr: string;
  duration_hr: string;
  notes: string;
  use_for_correction: boolean; // can be used at the BG-based correction column
  use_for_basal: boolean;
  premix_split?: { fast: number; intermediate: number };
}

export const INSULIN_PRODUCTS: Record<InsulinProduct, InsulinProductMeta> = {
  regular: {
    id: "regular",
    label: "Regular insulin (generic)",
    kind: "short",
    onset_min: "30–60 min",
    peak_hr: "2–3",
    duration_hr: "5–8",
    notes: "Give 30 min before meals. Acceptable for SSI correction when rapid-acting unavailable.",
    use_for_correction: true,
    use_for_basal: false,
  },
  actrapid: {
    id: "actrapid",
    label: "Actrapid (regular human insulin)",
    kind: "short",
    onset_min: "30 min",
    peak_hr: "1.5–3.5",
    duration_hr: "7–8",
    notes: "Soluble human insulin. Inject 30 min before meals. Suitable for SC correction & IV infusion.",
    use_for_correction: true,
    use_for_basal: false,
  },
  insugen_r: {
    id: "insugen_r",
    label: "Insugen-R (regular short-acting)",
    kind: "short",
    onset_min: "30 min",
    peak_hr: "1–3",
    duration_hr: "6–8",
    notes: "Biocon recombinant human regular insulin. Use 30 min pre-meal & for correction.",
    use_for_correction: true,
    use_for_basal: false,
  },
  insugen_n: {
    id: "insugen_n",
    label: "Insugen-N (NPH intermediate)",
    kind: "intermediate",
    onset_min: "1–2 h",
    peak_hr: "4–10",
    duration_hr: "12–18",
    notes: "Isophane (NPH). Use as basal — usually split 2/3 AM + 1/3 HS. Do NOT use for correction.",
    use_for_correction: false,
    use_for_basal: true,
  },
  insugen_30_70: {
    id: "insugen_30_70",
    label: "Insugen 30/70 premix (30% R + 70% NPH)",
    kind: "premix",
    onset_min: "30 min",
    peak_hr: "2–8 (biphasic)",
    duration_hr: "up to 24",
    notes:
      "Biphasic premix. Give 2/3 TDD before breakfast + 1/3 TDD before dinner, 30 min pre-meal. Avoid in NPO patients & avoid for ad-hoc correction (use Insugen-R/Actrapid instead).",
    use_for_correction: false,
    use_for_basal: false,
    premix_split: { fast: 0.3, intermediate: 0.7 },
  },
};

export interface POCBgDose {
  range: string;
  bg_low: number; // inclusive
  bg_high: number; // inclusive (use 999 for ≥400)
  premeal_units: number;
  bedtime_units: number;
  correction_only_units: number;
  action?: string;
}

export interface SSIDoseCalcInput {
  weight_kg: number;
  egfr: number;
  npo: boolean;
  on_glucocorticoid: boolean;
  steroid_dose_pred_eq_mg?: number;
  age_years: number;
  diabetes_type: DiabetesType;
  product: InsulinProduct;
  scale_override?: CorrectionScale;
  total_daily_dose_units?: number;
  // pass-through to reuse pickScale:
  min_glucose?: number;
  max_glucose?: number;
  events_ge_180?: number;
  events_ge_250?: number;
  events_le_70?: number;
  events_le_80?: number;
  dialysis?: boolean;
  liver_failure?: boolean;
}

export interface SSIDoseCalcResult {
  product: InsulinProductMeta;
  scale: CorrectionScale;
  tdd_units: number;
  basal_units?: number;
  basal_split?: { am: number; hs: number };
  prandial_units_per_meal?: number;
  premix_breakfast_units?: number;
  premix_dinner_units?: number;
  // POC table — exact units at each BG range for pre-meal, bedtime, and correction-only
  poc_table: POCBgDose[];
  adjustments: string[];
  warnings: string[];
}

/**
 * Build the exact-unit POC dose table for the chosen insulin product.
 * Pre-meal     = scheduled (basal-bolus) prandial dose + correction
 * Bedtime      = correction only, reduced ~50% (NPH-aware: never give NPH at bedtime as correction)
 * Correction-only = stand-alone correction (e.g. NPO patients q4–6h)
 */
export function calculateSSIDoses(input: SSIDoseCalcInput): SSIDoseCalcResult {
  const product = INSULIN_PRODUCTS[input.product];
  const adjustments: string[] = [];
  const warnings: string[] = [];

  // 1) TDD with renal/age/steroid adjustment
  let factor = input.diabetes_type === "type1" ? 0.5 : 0.4;
  if (input.age_years >= 70) { factor -= 0.1; adjustments.push("Age ≥70 → TDD −0.1 U/kg"); }
  if (input.egfr < 30 || input.dialysis) { factor -= 0.1; adjustments.push("eGFR <30 / dialysis → TDD −0.1 U/kg"); }
  else if (input.egfr < 45) { factor -= 0.05; adjustments.push("eGFR 30–44 → TDD −0.05 U/kg"); }
  if (input.liver_failure) { factor -= 0.05; adjustments.push("Hepatic failure → TDD −0.05 U/kg"); }
  if (input.npo) { factor -= 0.1; adjustments.push("NPO → TDD −0.1 U/kg (basal only)"); }
  if (input.on_glucocorticoid && (input.steroid_dose_pred_eq_mg ?? 0) >= 10) {
    factor += 0.1;
    adjustments.push(`Glucocorticoid ${input.steroid_dose_pred_eq_mg} mg pred-eq → TDD +0.1 U/kg (steroid-driven hyperglycemia)`);
  }
  factor = Math.max(0.2, factor);

  const tdd = input.total_daily_dose_units && input.total_daily_dose_units > 0
    ? input.total_daily_dose_units
    : Math.round(input.weight_kg * factor);

  // 2) Pick scale
  const scale: CorrectionScale = input.scale_override
    ?? pickScale(
      {
        weight_kg: input.weight_kg, age_years: input.age_years, egfr: input.egfr,
        diabetes_type: input.diabetes_type, dialysis: input.dialysis,
        npo: input.npo, min_glucose: input.min_glucose ?? 100,
        max_glucose: input.max_glucose ?? 180,
        events_ge_180: input.events_ge_180 ?? 0,
        events_ge_250: input.events_ge_250 ?? 0,
        events_le_70: input.events_le_70 ?? 0,
        events_le_80: input.events_le_80 ?? 0,
        // unused but required by SSIInput:
        care_setting: "ward", nutrition_status: "eating_regular",
        basal_ordered: true, prandial_ordered: !input.npo,
        correction_ordered: true, sliding_scale_only: false, iv_insulin: false,
      } as SSIInput,
      tdd,
    );

  // 3) Pre-meal prandial component (scheduled bolus)
  const prandial_per_meal = input.npo ? 0 : Math.max(0, Math.round((tdd * 0.5) / 3));

  // 4) Build POC table
  const poc_table: POCBgDose[] = SLIDING_SCALES.map((row, idx) => {
    const corr = row[scale as "low" | "medium" | "high"];
    const bgRange = parseRange(row.range);
    const isHypo = bgRange.high < 70;
    let action: string | undefined;
    let premeal = prandial_per_meal + (corr ?? 0);
    let bedtime = isHypo ? 0 : Math.max(0, Math.round((corr ?? 0) * 0.5));
    let correctionOnly = corr ?? 0;

    if (isHypo) {
      action = "HOLD insulin. Treat hypoglycemia per protocol (15 g rapid carbs, recheck in 15 min).";
      premeal = 0; bedtime = 0; correctionOnly = 0;
    } else if (bgRange.low >= 400) {
      action = "Severe hyperglycemia. Check ketones/anion gap. Notify MD; consider IV insulin.";
    }

    // Premix products: only the breakfast/dinner scheduled doses are valid;
    // ad-hoc correction must use a regular/short-acting insulin.
    if (product.kind === "premix") {
      premeal = 0;
      bedtime = 0;
      correctionOnly = 0;
      action = action ?? "Premix 30/70 is dosed BID (breakfast/dinner). Use Insugen-R or Actrapid for ad-hoc correction.";
    }

    // NPH (intermediate) cannot be used for correction
    if (product.kind === "intermediate") {
      premeal = 0;
      bedtime = 0;
      correctionOnly = 0;
      action = action ?? "NPH is basal only. Use a short-acting insulin for pre-meal/correction doses.";
    }

    return {
      range: row.range,
      bg_low: bgRange.low,
      bg_high: bgRange.high,
      premeal_units: premeal,
      bedtime_units: bedtime,
      correction_only_units: correctionOnly,
      action,
    };
  });

  // 5) Product-specific basal / premix split
  let basal_units: number | undefined;
  let basal_split: { am: number; hs: number } | undefined;
  let premix_breakfast_units: number | undefined;
  let premix_dinner_units: number | undefined;

  if (product.kind === "intermediate") {
    basal_units = Math.round(tdd * 0.5);
    basal_split = {
      am: Math.round(basal_units * (2 / 3)),
      hs: Math.round(basal_units * (1 / 3)),
    };
  } else if (product.kind === "premix") {
    if (input.npo) {
      warnings.push("Premix 30/70 is contraindicated in NPO patients — switch to basal (NPH) + correction (R).");
    }
    premix_breakfast_units = Math.round(tdd * (2 / 3));
    premix_dinner_units = Math.round(tdd * (1 / 3));
  }

  // 6) Warnings
  if (input.diabetes_type === "type1" && product.kind === "premix") {
    warnings.push("T1DM should NOT be managed on premix 30/70 — risk of inter-meal hypoglycemia & DKA.");
  }
  if (product.kind === "intermediate" && input.npo) {
    warnings.push("In NPO patient on NPH only: reduce dose by 50% and monitor q4–6h.");
  }
  if ((input.egfr < 30 || input.dialysis) && scale !== "low") {
    warnings.push("Severe renal impairment — LOW scale strongly preferred.");
  }
  if (input.on_glucocorticoid && product.kind === "intermediate") {
    adjustments.push("Steroid pattern: give NPH with the morning steroid dose to match hyperglycemia peak.");
  }

  return {
    product,
    scale,
    tdd_units: tdd,
    basal_units,
    basal_split,
    prandial_units_per_meal: product.kind === "short" && !input.npo ? prandial_per_meal : undefined,
    premix_breakfast_units,
    premix_dinner_units,
    poc_table,
    adjustments,
    warnings,
  };
}

function parseRange(range: string): { low: number; high: number } {
  if (range.startsWith("<")) return { low: 0, high: parseInt(range.replace(/[^0-9]/g, ""), 10) - 1 };
  if (range.startsWith("≥")) return { low: parseInt(range.replace(/[^0-9]/g, ""), 10), high: 999 };
  const [a, b] = range.split("–").map((s) => parseInt(s.replace(/[^0-9]/g, ""), 10));
  return { low: a, high: b };
}
