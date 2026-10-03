/**
 * The seam between the intake form and the frozen engine.
 *
 * Everything here is pure and carries no React and no clock. It exists because
 * src/lib/osteo/logic.ts is ported verbatim and may not be edited, so the two
 * places where the UI knows more than the engine does — the CKD stage and the
 * Clinical Frailty Scale — are translated here rather than inside it.
 */
import {
  SAFETY_KEYS,
  initialState,
  type CkdStatus,
  type CurrentTherapy,
  type DxaStatus,
  type FragilityFracture,
  type FraxComparison,
  type Menopause,
  type OsteoState,
  type SafetyKey,
  type Sex,
  type Tri,
} from "@/lib/osteo/types";

/* ------------------------------------------------------------------ */
/* Option lists                                                        */
/* ------------------------------------------------------------------ */

/** Gate 4a. "bone_loss_condition" and "other_clinician_confirmed_risk" are absent
 *  by design: they are parents, derived from 4b and 4c being non-empty (M3). */
export const STANDALONE_RISK_FACTORS = [
  "low_body_weight",
  "high_risk_medication",
  "parental_hip_fracture",
  "frequent_falls",
] as const;

export const NONE_IDENTIFIED = "none_identified";

/** Gate 4b — conditions causing bone loss. The engine's own list, order preserved. */
export const BONE_LOSS_CONDITIONS = [
  "hypogonadism_or_early_menopause",
  "hyperthyroidism_or_overreplacement",
  "primary_hyperparathyroidism",
  "type_1_diabetes",
  "type_2_diabetes",
  "ckd",
  "chronic_liver_disease",
  "malabsorption_ibd_bariatric",
  "rheumatoid_or_inflammatory_disease",
  "mgus_or_suspected_myeloma",
  "osteomalacia_or_other_metabolic_bone_disease",
  "other_specify",
] as const;

/** Gate 4c — other clinician-confirmed risks. The engine's own list. */
export const OTHER_CONFIRMED_RISKS = [
  "prior_fragility_fracture_confirm_above",
  "other_family_fracture_history",
  "current_smoking",
  "high_alcohol_intake",
  "recurrent_falls_or_frailty",
  "height_loss_possible_vertebral_fracture",
  "prolonged_immobility",
  "aromatase_inhibitor_or_androgen_deprivation",
  "other_specify",
] as const;

/** The engine's canonical order for dxa_risk_factors. Emitting in this order keeps
 *  the token stable regardless of the order the clinician ticked things in. */
export const RISK_FACTOR_ORDER = [
  "low_body_weight",
  "high_risk_medication",
  "bone_loss_condition",
  "parental_hip_fracture",
  "frequent_falls",
  "other_clinician_confirmed_risk",
  NONE_IDENTIFIED,
] as const;

/* ------------------------------------------------------------------ */
/* M1 — the CKD / CKD-MBD ladder                                       */
/* ------------------------------------------------------------------ */

/**
 * The engine has one tri-state and no room for a stage, so the ladder is where
 * the granularity lives. The collapse follows the spec table exactly: only
 * "Not advanced" is a negative finding. "Unknown" stays unknown, because the
 * engine ORs the tri-state with eGFR < 30 and a false negative would let a
 * recorded "Not advanced" stand over an unrecorded eGFR.
 */
export const CKD_LADDER = [
  "unknown",
  "not_advanced",
  "ckd_g4",
  "ckd_g5",
  "dialysis",
  "advanced_ckd_not_staged",
  "suspected_ckd_mbd",
  "ckd_mbd_present",
] as const;

export type CkdLadderRung = (typeof CKD_LADDER)[number];

/** The engine's label() would render these as "Ckd g4"; logic.ts is frozen, so the
 *  labels live here and reach the screen through PillSelect. */
export const CKD_LADDER_LABELS: Record<CkdLadderRung, string> = {
  unknown: "Unknown / not reviewed",
  not_advanced: "Not advanced",
  ckd_g4: "CKD G4",
  ckd_g5: "CKD G5",
  dialysis: "Dialysis",
  advanced_ckd_not_staged: "Advanced CKD, not staged",
  suspected_ckd_mbd: "Suspected CKD-MBD",
  ckd_mbd_present: "CKD-MBD present",
};

export function ladderToCkdStatus(rung: CkdLadderRung): CkdStatus {
  if (rung === "unknown") return "unknown";
  if (rung === "not_advanced") return "no";
  return "yes_or_suspected";
}

/* ------------------------------------------------------------------ */
/* M2 — the Clinical Frailty Scale                                     */
/* ------------------------------------------------------------------ */

export const CFS_SCORES = [1, 2, 3, 4, 5, 6, 7, 8, 9] as const;
export type CfsScore = (typeof CFS_SCORES)[number];

/** Source: src/components/ClinicalFrailtyScale.tsx — "Scores >=5 indicate
 *  increasing frailty". No other clinical threshold is introduced by this file. */
export const CFS_FRAILTY_THRESHOLD = 5;

export function cfsIndicatesFrailty(score: CfsScore): boolean {
  return score >= CFS_FRAILTY_THRESHOLD;
}

/* ------------------------------------------------------------------ */
/* M4 — mutual exclusion, enforced here rather than trusted to the UI  */
/* ------------------------------------------------------------------ */

/**
 * "None identified" is only a claim about a list that has nothing else in it.
 * controls.tsx fixes its own toggle, but the frailty rule below adds a risk the
 * clinician never ticked, so the invariant has to hold here too — otherwise the
 * engine refuses to compute a result for a patient who is plainly frail.
 */
export function reconcileStandaloneRiskFactors(next: string[]): string[] {
  const others = next.filter((v) => v !== NONE_IDENTIFIED);
  if (others.length) return others;
  return next.includes(NONE_IDENTIFIED) ? [NONE_IDENTIFIED] : [];
}

/* ------------------------------------------------------------------ */
/* View state                                                          */
/* ------------------------------------------------------------------ */

/**
 * What the form holds, and what gets persisted. It differs from OsteoState in
 * three ways, each deliberate:
 *   - the two parent risk factors are absent; they are derived (M3)
 *   - the CKD stage and the CFS score are present; the engine has no field for them
 *   - free text for the two "other" options is present; the engine has no field
 * Every array is stored in the clinician's tick order; toOsteoState canonicalises.
 */
export interface OsteoView {
  age: number | null;
  sex: Sex;
  menopause: Menopause;
  fragility_fracture: FragilityFracture;
  other_fracture_site: string;
  recent_vertebral_fracture_within_2_years: Tri;
  dxa_status: DxaStatus;
  lowest_valid_t_score: number | null;
  lowest_valid_z_score: number | null;
  extreme_verified: Tri;
  standalone_risk_factors: string[];
  bone_loss_conditions: string[];
  bone_loss_other_text: string;
  other_confirmed_risks: string[];
  other_risks_other_text: string;
  ckd_ladder: CkdLadderRung;
  /** null means not recorded, which is not the same as CFS 1. */
  clinical_frailty_scale: CfsScore | null;
  male_50_69_dxa_risk_review_complete: Tri;
  frax_comparison: FraxComparison;
  frax_country_threshold_policy_version: string;
  systemic_glucocorticoids: Tri;
  prednisolone_equivalent_mg_per_day: number | null;
  glucocorticoid_duration_months: number | null;
  egfr_ml_min_1_73m2: number | null;
  drug_specific_crcl_ml_min: number | null;
  current_therapy: CurrentTherapy;
  last_injection_or_infusion_date: string;
  safety: Record<SafetyKey, Tri>;
}

export function initialView(): OsteoView {
  const base = initialState();
  return {
    age: null,
    sex: base.sex,
    menopause: base.menopause,
    fragility_fracture: base.fragility_fracture,
    other_fracture_site: "",
    recent_vertebral_fracture_within_2_years: base.recent_vertebral_fracture_within_2_years,
    dxa_status: base.dxa_status,
    lowest_valid_t_score: null,
    lowest_valid_z_score: null,
    extreme_verified: base.extreme_verified,
    standalone_risk_factors: [],
    bone_loss_conditions: [],
    bone_loss_other_text: "",
    other_confirmed_risks: [],
    other_risks_other_text: "",
    ckd_ladder: "unknown",
    clinical_frailty_scale: null,
    male_50_69_dxa_risk_review_complete: base.male_50_69_dxa_risk_review_complete,
    frax_comparison: base.frax_comparison,
    frax_country_threshold_policy_version: "",
    systemic_glucocorticoids: base.systemic_glucocorticoids,
    prednisolone_equivalent_mg_per_day: null,
    glucocorticoid_duration_months: null,
    egfr_ml_min_1_73m2: null,
    drug_specific_crcl_ml_min: null,
    current_therapy: base.current_therapy,
    last_injection_or_infusion_date: "",
    safety: { ...base.safety },
  };
}

/* ------------------------------------------------------------------ */
/* Reading persisted state back (Review Focus 1)                       */
/* ------------------------------------------------------------------ */

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

const asNumber = (v: unknown): number | null =>
  typeof v === "number" && Number.isFinite(v) ? v : null;

const asString = (v: unknown): string => (typeof v === "string" ? v : "");

function asOneOf<T extends string>(v: unknown, allowed: readonly T[], fallback: T): T {
  return typeof v === "string" && (allowed as readonly string[]).includes(v) ? (v as T) : fallback;
}

function asStringArray(v: unknown, allowed: readonly string[]): string[] {
  if (!Array.isArray(v)) return [];
  return v.filter((x): x is string => typeof x === "string" && allowed.includes(x));
}

export function toCfsScore(v: unknown): CfsScore | null {
  return typeof v === "number" && (CFS_SCORES as readonly number[]).includes(v)
    ? (v as CfsScore)
    : null;
}

const TRI = ["unknown", "yes", "no"] as const;

/**
 * A value stored by an older build is read through this and never trusted
 * directly: unknown keys are dropped, wrong-typed values fall back to the
 * initial view, and every safety key is filled in — including one added after
 * the value was stored. A form saved under a previous version therefore loads
 * with the fields it can fill and asks for the rest.
 */
export function normaliseView(raw: unknown): OsteoView {
  const base = initialView();
  if (!isRecord(raw)) return base;

  const safety: Record<SafetyKey, Tri> = { ...base.safety };
  if (isRecord(raw.safety)) {
    for (const k of SAFETY_KEYS) safety[k] = asOneOf(raw.safety[k], TRI, "unknown");
  }

  return {
    age: asNumber(raw.age),
    sex: asOneOf(raw.sex, ["unknown", "female", "male", "other"] as const, "unknown"),
    menopause: asOneOf(
      raw.menopause,
      ["unknown", "premenopausal", "menopausal_transition", "postmenopausal"] as const,
      "unknown",
    ),
    fragility_fracture: asOneOf(
      raw.fragility_fracture,
      ["unknown", "none", "hip", "one_vertebral", "multiple_vertebral", "other_fragility"] as const,
      "unknown",
    ),
    other_fracture_site: asString(raw.other_fracture_site),
    recent_vertebral_fracture_within_2_years: asOneOf(
      raw.recent_vertebral_fracture_within_2_years,
      TRI,
      "unknown",
    ),
    dxa_status: asOneOf(
      raw.dxa_status,
      ["unknown", "available_valid", "unavailable_or_not_feasible"] as const,
      "unknown",
    ),
    lowest_valid_t_score: asNumber(raw.lowest_valid_t_score),
    lowest_valid_z_score: asNumber(raw.lowest_valid_z_score),
    extreme_verified: asOneOf(raw.extreme_verified, TRI, "unknown"),
    standalone_risk_factors: asStringArray(raw.standalone_risk_factors, [
      ...STANDALONE_RISK_FACTORS,
      NONE_IDENTIFIED,
    ]),
    bone_loss_conditions: asStringArray(raw.bone_loss_conditions, BONE_LOSS_CONDITIONS),
    bone_loss_other_text: asString(raw.bone_loss_other_text),
    other_confirmed_risks: asStringArray(raw.other_confirmed_risks, OTHER_CONFIRMED_RISKS),
    other_risks_other_text: asString(raw.other_risks_other_text),
    ckd_ladder: asOneOf(raw.ckd_ladder, CKD_LADDER, "unknown"),
    clinical_frailty_scale: toCfsScore(raw.clinical_frailty_scale),
    male_50_69_dxa_risk_review_complete: asOneOf(
      raw.male_50_69_dxa_risk_review_complete,
      TRI,
      "unknown",
    ),
    frax_comparison: asOneOf(
      raw.frax_comparison,
      [
        "not_assessed",
        "below_local_treatment_threshold",
        "above_local_treatment_threshold",
        "very_high_independently_confirmed",
      ] as const,
      "not_assessed",
    ),
    frax_country_threshold_policy_version: asString(raw.frax_country_threshold_policy_version),
    systemic_glucocorticoids: asOneOf(raw.systemic_glucocorticoids, TRI, "unknown"),
    prednisolone_equivalent_mg_per_day: asNumber(raw.prednisolone_equivalent_mg_per_day),
    glucocorticoid_duration_months: asNumber(raw.glucocorticoid_duration_months),
    egfr_ml_min_1_73m2: asNumber(raw.egfr_ml_min_1_73m2),
    drug_specific_crcl_ml_min: asNumber(raw.drug_specific_crcl_ml_min),
    current_therapy: asOneOf(
      raw.current_therapy,
      [
        "unknown",
        "none",
        "oral_bisphosphonate",
        "iv_bisphosphonate",
        "denosumab",
        "anabolic_or_romosozumab",
      ] as const,
      "unknown",
    ),
    last_injection_or_infusion_date: asString(raw.last_injection_or_infusion_date),
    safety,
  };
}

/* ------------------------------------------------------------------ */
/* View state -> engine state                                          */
/* ------------------------------------------------------------------ */

const canonical = (values: string[], order: readonly string[]): string[] => {
  const set = new Set(values);
  return order.filter((k) => set.has(k));
};

/**
 * Spreads initialState() first so the key order the engine sees is fixed by
 * construction. makeToken() hashes JSON.stringify(state), so key order changes
 * the token; deriving rather than persisting OsteoState is what removes that
 * hazard, and canonical array order removes the rest of it.
 */
export function toOsteoState(view: OsteoView): OsteoState {
  const standalone = reconcileStandaloneRiskFactors(view.standalone_risk_factors);
  const boneLoss = canonical(view.bone_loss_conditions, BONE_LOSS_CONDITIONS);
  const typedRisks = canonical(view.other_confirmed_risks, OTHER_CONFIRMED_RISKS);
  const frail = view.clinical_frailty_scale !== null && cfsIndicatesFrailty(view.clinical_frailty_scale);

  // M2 — the frailty flag is a real risk factor, and a real risk factor needs a
  // subtype, or the engine warns other_risk_without_subtype.
  const otherRisks = frail
    ? canonical([...typedRisks, "recurrent_falls_or_frailty"], OTHER_CONFIRMED_RISKS)
    : typedRisks;

  // M3 — parents are derived, never stored, so parent_without_subtype and
  // other_risk_without_subtype are unrepresentable.
  const present = new Set<string>(standalone);
  if (boneLoss.length) present.add("bone_loss_condition");
  if (otherRisks.length) present.add("other_clinician_confirmed_risk");
  // M4 — a claim of "none" cannot survive alongside anything it would deny.
  if (present.size > 1) present.delete(NONE_IDENTIFIED);

  return {
    ...initialState(),
    age: view.age,
    sex: view.sex,
    menopause: view.sex === "female" ? view.menopause : "unknown",
    fragility_fracture: view.fragility_fracture,
    other_fracture_site:
      view.fragility_fracture === "other_fragility" ? view.other_fracture_site : "",
    recent_vertebral_fracture_within_2_years: view.recent_vertebral_fracture_within_2_years,
    dxa_status: view.dxa_status,
    lowest_valid_t_score:
      view.dxa_status === "available_valid" ? view.lowest_valid_t_score : null,
    lowest_valid_z_score:
      view.dxa_status === "available_valid" ? view.lowest_valid_z_score : null,
    extreme_verified: view.extreme_verified,
    dxa_risk_factors: RISK_FACTOR_ORDER.filter((k) => present.has(k)),
    bone_loss_conditions: boneLoss,
    other_confirmed_risks: otherRisks,
    male_50_69_dxa_risk_review_complete: view.male_50_69_dxa_risk_review_complete,
    frax_comparison: view.frax_comparison,
    frax_country_threshold_policy_version:
      view.frax_comparison === "not_assessed" ? "" : view.frax_country_threshold_policy_version,
    systemic_glucocorticoids: view.systemic_glucocorticoids,
    prednisolone_equivalent_mg_per_day:
      view.systemic_glucocorticoids === "yes" ? view.prednisolone_equivalent_mg_per_day : null,
    glucocorticoid_duration_months:
      view.systemic_glucocorticoids === "yes" ? view.glucocorticoid_duration_months : null,
    advanced_ckd_ckd_mbd_dialysis: ladderToCkdStatus(view.ckd_ladder),
    egfr_ml_min_1_73m2: view.egfr_ml_min_1_73m2,
    drug_specific_crcl_ml_min: view.drug_specific_crcl_ml_min,
    current_therapy: view.current_therapy,
    last_injection_or_infusion_date: [
      "denosumab",
      "iv_bisphosphonate",
      "anabolic_or_romosozumab",
    ].includes(view.current_therapy)
      ? view.last_injection_or_infusion_date
      : "",
    safety: Object.fromEntries(SAFETY_KEYS.map((k) => [k, view.safety[k] ?? "unknown"])) as Record<
      SafetyKey,
      Tri
    >,
  };
}

/* ------------------------------------------------------------------ */
/* What the frozen engine cannot carry                                 */
/* ------------------------------------------------------------------ */

/**
 * buildReport() takes only (state, result, date) and logic.ts may not be edited,
 * so the two facts the engine has no field for are appended to the copied report
 * by ResultCard. A report that omits the stage it was assessed at is not a
 * complete record.
 */
export function reportContext(view: OsteoView): string[] {
  const out: string[] = [];
  if (view.ckd_ladder !== "unknown") {
    out.push(`CKD / CKD-MBD stage: ${CKD_LADDER_LABELS[view.ckd_ladder]}`);
  }
  if (view.clinical_frailty_scale !== null) {
    out.push(`Clinical Frailty Scale: ${view.clinical_frailty_scale}`);
  }
  if (view.bone_loss_conditions.includes("other_specify") && view.bone_loss_other_text.trim()) {
    out.push(`Other bone-loss condition: ${view.bone_loss_other_text.trim()}`);
  }
  if (view.other_confirmed_risks.includes("other_specify") && view.other_risks_other_text.trim()) {
    out.push(`Other clinician-confirmed risk: ${view.other_risks_other_text.trim()}`);
  }
  return out;
}
