import {
  SPEC_VERSION,
  type DxaDecision,
  type EntryRouteId,
  type Kleene,
  type MedicationOption,
  type OsteoResult,
  type OsteoState,
  type Pathway,
  type RiskStatus,
  type Tri,
  type ValidationIssue,
} from "./types";

/* ------------------------------------------------------------------ */
/* Kleene helpers — unknown is never a negative finding.              */
/* ------------------------------------------------------------------ */

const tri = (v: Tri): Kleene => (v === "unknown" ? "unknown" : v === "yes");

function anyTrue(vals: Kleene[]): Kleene {
  if (vals.some((v) => v === true)) return true;
  if (vals.some((v) => v === "unknown")) return "unknown";
  return false;
}

/* ------------------------------------------------------------------ */
/* Labels                                                             */
/* ------------------------------------------------------------------ */

export const LABELS: Record<string, string> = {
  unknown: "Unknown / not reviewed",
  yes: "Yes",
  no: "No",
  female: "Female",
  male: "Male",
  other: "Other",
  premenopausal: "Premenopausal",
  menopausal_transition: "Menopausal transition",
  postmenopausal: "Postmenopausal",
  none: "None",
  hip: "Hip",
  one_vertebral: "One vertebral",
  multiple_vertebral: "Multiple vertebral",
  other_fragility: "Other fragility site",
  available_valid: "Available and valid",
  unavailable_or_not_feasible: "Unavailable / not feasible",
  not_assessed: "Not assessed",
  below_local_treatment_threshold: "Below local threshold",
  above_local_treatment_threshold: "Above local threshold",
  very_high_independently_confirmed: "Very high (independently confirmed)",
  yes_or_suspected: "Yes or suspected",
  oral_bisphosphonate: "Oral bisphosphonate",
  iv_bisphosphonate: "IV bisphosphonate",
  denosumab: "Denosumab",
  anabolic_or_romosozumab: "Anabolic / romosozumab",
  low_body_weight: "Low body weight",
  high_risk_medication: "High-risk medication",
  bone_loss_condition: "Condition causing bone loss",
  parental_hip_fracture: "Parental hip fracture",
  frequent_falls: "Frequent falls",
  other_clinician_confirmed_risk: "Other clinician-confirmed risk",
  none_identified: "None identified",
  hypogonadism_or_early_menopause: "Hypogonadism / early menopause",
  hyperthyroidism_or_overreplacement: "Hyperthyroidism / over-replacement",
  primary_hyperparathyroidism: "Primary hyperparathyroidism",
  type_1_diabetes: "Type 1 diabetes",
  type_2_diabetes: "Type 2 diabetes",
  ckd: "Chronic kidney disease",
  chronic_liver_disease: "Chronic liver disease",
  malabsorption_ibd_bariatric: "Malabsorption / IBD / bariatric",
  rheumatoid_or_inflammatory_disease: "Rheumatoid / inflammatory disease",
  mgus_or_suspected_myeloma: "MGUS / suspected myeloma",
  osteomalacia_or_other_metabolic_bone_disease: "Osteomalacia / metabolic bone disease",
  other_specify: "Other",
  prior_fragility_fracture_confirm_above: "Prior fragility fracture (confirm in Gate 2)",
  other_family_fracture_history: "Other family fracture history",
  current_smoking: "Current smoking",
  high_alcohol_intake: "High alcohol intake",
  recurrent_falls_or_frailty: "Recurrent falls / frailty",
  height_loss_possible_vertebral_fracture: "Height loss (possible vertebral fracture)",
  prolonged_immobility: "Prolonged immobility",
  aromatase_inhibitor_or_androgen_deprivation: "Aromatase inhibitor / androgen deprivation",
  oral_bisphosphonate_unsuitable: "Oral bisphosphonate unsuitable",
  hypocalcemia: "Hypocalcaemia",
  hypercalcemia: "Hypercalcaemia",
  calcium_vitamin_d_adequate: "Calcium & vitamin D adequate",
  acute_kidney_injury: "Acute kidney injury",
  pregnancy_lactation: "Pregnancy or lactation",
  prior_mi_or_stroke: "Prior MI or stroke",
  skeletal_malignancy_or_metabolic_bone_disease:
    "Skeletal malignancy / metabolic bone disease",
  drug_specific_local_label_reviewed: "Drug-specific local label reviewed",
};

export const label = (v: string) =>
  LABELS[v] ?? v.replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase());

export const PATHWAY_LABELS: Record<Pathway, string> = {
  standard_adult: "Standard adult",
  younger_individualized_z_score: "Younger / premenopausal — individualised Z-score",
  individualized_no_auto_class: "Individualised — no automatic class",
  outside_scope: "Outside scope (paediatric)",
  incomplete_no_risk_classification: "Incomplete — no risk classification",
};

export const ENTRY_LABELS: Record<EntryRouteId, string> = {
  postmenopausal: "Postmenopausal woman",
  male_70_plus: "Man aged 70 or over",
  male_50_69: "Man aged 50–69",
  younger: "Younger adult / premenopausal",
  sex_other: "Sex recorded as other",
  pediatric: "Paediatric",
  incomplete: "Gate 1 incomplete",
};

export const DXA_LABELS: Record<DxaDecision, string> = {
  diagnostic_or_treatment_monitoring:
    "Diagnostic or treatment monitoring — not asymptomatic screening",
  age_based_prompt: "Age-based DXA prompt",
  risk_based_prompt: "Risk-based DXA prompt",
  pending_risk_review: "Pending risk review — not a negative decision",
  no_age_only_prompt: "No age-only prompt (this is not low fracture risk)",
  risk_based_individualized: "Risk-based, individualised assessment",
  clinician_individualized: "Clinician-individualised decision",
  outside_scope: "Outside scope",
  pending_entry: "Pending Gate 1 entry",
};

/** Five internal statuses, four displayed labels. `at_least_high` is a floor on
 *  the high tier and shows as high, with `riskCertainty` carrying the caveat;
 *  `no_adult_class` is out of the adult T-score pathway entirely, so it shows as
 *  unresolved rather than as a second kind of "not established". */
export const RISK_LABELS: Record<RiskStatus, string> = {
  very_high: "Very high risk",
  at_least_high: "High risk",
  high: "High risk",
  low: "Low risk",
  unclassified_or_incomplete: "Unresolved / insufficient information",
  no_adult_class: "Unresolved / insufficient information",
};

/* ------------------------------------------------------------------ */
/* Derived facts                                                      */
/* ------------------------------------------------------------------ */

function num(v: number | null): boolean {
  return typeof v === "number" && Number.isFinite(v);
}

export function entryRoute(s: OsteoState): { id: EntryRouteId; pathway: Pathway } {
  if (num(s.age) && (s.age as number) < 18) {
    return { id: "pediatric", pathway: "outside_scope" };
  }
  if (
    !num(s.age) ||
    s.sex === "unknown" ||
    (s.sex === "female" && s.menopause === "unknown")
  ) {
    return { id: "incomplete", pathway: "incomplete_no_risk_classification" };
  }
  const age = s.age as number;
  if (s.sex === "other") return { id: "sex_other", pathway: "individualized_no_auto_class" };
  if (s.sex === "female" && s.menopause === "postmenopausal") {
    return { id: "postmenopausal", pathway: "standard_adult" };
  }
  if (s.sex === "male" && age >= 70) return { id: "male_70_plus", pathway: "standard_adult" };
  if (s.sex === "male" && age >= 50) return { id: "male_50_69", pathway: "standard_adult" };
  return { id: "younger", pathway: "younger_individualized_z_score" };
}

const HIP_OR_VERTEBRAL = ["hip", "one_vertebral", "multiple_vertebral"];

export function monthsSince(dateStr: string, today: Date): number | null {
  if (!dateStr) return null;
  const d = new Date(dateStr + "T00:00:00Z");
  if (Number.isNaN(d.getTime())) return null;
  return (today.getTime() - d.getTime()) / (1000 * 60 * 60 * 24 * 30.4375);
}

/* ------------------------------------------------------------------ */
/* Validation                                                         */
/* ------------------------------------------------------------------ */

function validate(s: OsteoState, today: Date): ValidationIssue[] {
  const out: ValidationIssue[] = [];
  const add = (
    id: string,
    severity: ValidationIssue["severity"],
    message: string,
  ) => out.push({ id, severity, message });

  if (num(s.age)) {
    const a = s.age as number;
    if (a < 0 || a > 120 || a !== Math.floor(a)) {
      add("age_domain", "blocking", "Correct the age. Values are not clamped.");
    }
  }
  if (s.recent_vertebral_fracture_within_2_years === "yes" && s.fragility_fracture === "none") {
    add("recent_vf_none", "blocking", "A recent vertebral fracture cannot be recorded as none.");
  }
  if (
    s.recent_vertebral_fracture_within_2_years === "yes" &&
    s.fragility_fracture === "other_fragility"
  ) {
    add("recent_vf_other_only", "blocking", "A recent vertebral fracture needs a vertebral category.");
  }
  if (
    s.dxa_status === "unavailable_or_not_feasible" &&
    (num(s.lowest_valid_t_score) || num(s.lowest_valid_z_score))
  ) {
    add(
      "stale_dxa",
      "blocking",
      "Stale scores are ignored. Clear them, or mark DXA available and valid.",
    );
  }
  for (const v of [s.lowest_valid_t_score, s.lowest_valid_z_score]) {
    if (num(v) && ((v as number) < -8 || (v as number) > 6)) {
      add("score_domain", "blocking", "Score is outside the accepted domain. Correct it; values are not clamped.");
      break;
    }
  }
  const extremeEntered = [s.lowest_valid_t_score, s.lowest_valid_z_score].some(
    (v) => num(v) && ((v as number) < -5 || (v as number) > 4) && (v as number) >= -8 && (v as number) <= 6,
  );
  if (extremeEntered && s.extreme_verified !== "yes") {
    add("extreme_unverified", "warning", "Extreme score held out of the risk rules until verified.");
  }
  if (
    s.frax_comparison !== "not_assessed" &&
    s.frax_country_threshold_policy_version.trim() === ""
  ) {
    add(
      "frax_no_policy",
      "blocking",
      "Document the country and threshold policy version before FRAX is used.",
    );
  }
  const hasNoneIdentified = s.dxa_risk_factors.includes("none_identified");
  if (hasNoneIdentified && s.dxa_risk_factors.length > 1) {
    add("none_and_factors", "blocking", "Choose either none identified or specific factors, not both.");
  }
  const anyFragility = ["hip", "one_vertebral", "multiple_vertebral", "other_fragility"].includes(
    s.fragility_fracture,
  );
  if (hasNoneIdentified && anyFragility) {
    add("none_and_fracture", "blocking", "A documented fragility fracture is itself a risk factor.");
  }
  if (s.dxa_risk_factors.includes("bone_loss_condition") && s.bone_loss_conditions.length === 0) {
    add("parent_without_subtype", "warning", "Condition selected without a subtype: the factor is not confirmed.");
  }
  if (
    s.dxa_risk_factors.includes("other_clinician_confirmed_risk") &&
    s.other_confirmed_risks.length === 0
  ) {
    add("other_risk_without_subtype", "warning", "Other risk selected without a subtype: the factor is not confirmed.");
  }
  if (
    s.systemic_glucocorticoids === "no" &&
    ((num(s.prednisolone_equivalent_mg_per_day) && (s.prednisolone_equivalent_mg_per_day as number) > 0) ||
      (num(s.glucocorticoid_duration_months) && (s.glucocorticoid_duration_months as number) > 0))
  ) {
    add("gc_no_vs_dose", "blocking", "Resolve the glucocorticoid fields.");
  }
  if (
    s.systemic_glucocorticoids === "yes" &&
    (!num(s.prednisolone_equivalent_mg_per_day) || !num(s.glucocorticoid_duration_months))
  ) {
    add(
      "gc_yes_incomplete",
      "warning",
      "Dose and duration are needed for the very-high glucocorticoid rule. Glucocorticoid review still applies.",
    );
  }
  if (
    s.advanced_ckd_ckd_mbd_dialysis === "no" &&
    num(s.egfr_ml_min_1_73m2) &&
    (s.egfr_ml_min_1_73m2 as number) < 30
  ) {
    add("ckd_no_vs_egfr", "blocking", "An eGFR under 30 conflicts with no advanced CKD.");
  }
  if (
    s.bone_loss_conditions.includes("ckd") &&
    s.advanced_ckd_ckd_mbd_dialysis === "unknown" &&
    !num(s.egfr_ml_min_1_73m2)
  ) {
    add("ckd_selected_no_stage", "warning", "Advanced CKD is not inferred. Enter CKD-MBD status or eGFR.");
  }
  if (s.safety.hypocalcemia === "yes" && s.safety.hypercalcemia === "yes") {
    add("hypo_hyper", "blocking", "Hypocalcaemia and hypercalcaemia cannot both be yes.");
  }
  if (s.safety.pregnancy_lactation === "yes" && s.menopause === "postmenopausal") {
    add("preg_postmeno", "blocking", "Resolve pregnancy against postmenopausal status.");
  }
  if (s.sex === "male" && s.safety.pregnancy_lactation === "yes") {
    add("preg_male", "blocking", "Pregnancy or lactation does not apply when sex is male.");
  }
  const ms = monthsSince(s.last_injection_or_infusion_date, today);
  if (ms !== null && ms < 0) {
    add("future_dose_date", "blocking", "The last dose cannot be in the future.");
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* Main evaluation                                                    */
/* ------------------------------------------------------------------ */

export function evaluate(s: OsteoState, today: Date): OsteoResult {
  const { id: routeId, pathway } = entryRoute(s);
  const issues = validate(s, today);
  const blocked = issues.some((i) => i.severity === "blocking");
  const standardAdult = pathway === "standard_adult";

  const extremeOk = (v: number) =>
    (v >= -5 && v <= 4) || s.extreme_verified === "yes";
  const usableT =
    s.dxa_status === "available_valid" &&
    num(s.lowest_valid_t_score) &&
    (s.lowest_valid_t_score as number) >= -8 &&
    (s.lowest_valid_t_score as number) <= 6 &&
    extremeOk(s.lowest_valid_t_score as number)
      ? (s.lowest_valid_t_score as number)
      : null;
  const usableZ =
    s.dxa_status === "available_valid" &&
    num(s.lowest_valid_z_score) &&
    (s.lowest_valid_z_score as number) >= -8 &&
    (s.lowest_valid_z_score as number) <= 6 &&
    extremeOk(s.lowest_valid_z_score as number)
      ? (s.lowest_valid_z_score as number)
      : null;

  const anyHipOrVertebral = HIP_OR_VERTEBRAL.includes(s.fragility_fracture);
  const anyFragility = anyHipOrVertebral || s.fragility_fracture === "other_fragility";
  const fractureUnknown = s.fragility_fracture === "unknown";

  const highDoseGc: Kleene =
    s.systemic_glucocorticoids === "no"
      ? false
      : s.systemic_glucocorticoids === "yes"
        ? num(s.prednisolone_equivalent_mg_per_day) && num(s.glucocorticoid_duration_months)
          ? (s.prednisolone_equivalent_mg_per_day as number) >= 7.5 &&
            (s.glucocorticoid_duration_months as number) >= 3
          : "unknown"
        : "unknown";

  const advancedCkd: Kleene =
    s.advanced_ckd_ckd_mbd_dialysis === "yes_or_suspected" ||
    (num(s.egfr_ml_min_1_73m2) && (s.egfr_ml_min_1_73m2 as number) < 30)
      ? true
      : s.advanced_ckd_ckd_mbd_dialysis === "no" &&
          (!num(s.egfr_ml_min_1_73m2) || (s.egfr_ml_min_1_73m2 as number) >= 30)
        ? false
        : "unknown";

  const doseMonths = monthsSince(s.last_injection_or_infusion_date, today);
  const denosumabOverdue =
    s.current_therapy === "denosumab" && doseMonths !== null && doseMonths >= 7;

  const fraxUsable =
    s.frax_comparison !== "not_assessed" &&
    s.frax_country_threshold_policy_version.trim() !== "";

  /* ---------------- DXA decision ---------------- */
  const onTherapy = !["unknown", "none"].includes(s.current_therapy);
  let dxaDecision: DxaDecision;
  if (routeId === "pediatric") dxaDecision = "outside_scope";
  else if (routeId === "incomplete") dxaDecision = "pending_entry";
  else if (anyFragility || onTherapy) dxaDecision = "diagnostic_or_treatment_monitoring";
  else if (routeId === "male_70_plus") dxaDecision = "age_based_prompt";
  else if (routeId === "male_50_69") {
    const confirmedRisk =
      s.dxa_risk_factors.some((f) => f !== "none_identified") ||
      s.systemic_glucocorticoids === "yes";
    if (confirmedRisk) dxaDecision = "risk_based_prompt";
    else if (s.male_50_69_dxa_risk_review_complete !== "yes") dxaDecision = "pending_risk_review";
    else if (
      s.dxa_risk_factors.includes("none_identified") &&
      s.fragility_fracture === "none" &&
      s.systemic_glucocorticoids !== "yes"
    )
      dxaDecision = "no_age_only_prompt";
    else dxaDecision = "pending_risk_review";
  } else if (routeId === "younger") {
    dxaDecision =
      s.dxa_risk_factors.some((f) => f !== "none_identified") || s.systemic_glucocorticoids === "yes"
        ? "risk_based_individualized"
        : "pending_risk_review";
  } else if (routeId === "sex_other") dxaDecision = "clinician_individualized";
  else if (routeId === "postmenopausal") {
    dxaDecision =
      s.dxa_risk_factors.some((f) => f !== "none_identified") || (s.age as number) >= 65
        ? "risk_based_prompt"
        : "pending_risk_review";
  } else dxaDecision = "pending_entry";

  /** The three decisions that ask for a DXA. An absent T-score is missing
   *  evidence whenever one of these applies, never a below-threshold finding. */
  const dxaIndicated = (["age_based_prompt", "risk_based_prompt", "risk_based_individualized"] as DxaDecision[]).includes(
    dxaDecision,
  );

  /* ---------------- Risk resolution ---------------- */
  const evidence: string[] = [];
  const unresolvedHigherTier: string[] = [];
  let riskStatus: RiskStatus = "unclassified_or_incomplete";

  if (!standardAdult) {
    riskStatus = routeId === "incomplete" ? "unclassified_or_incomplete" : "no_adult_class";
  }

  const veryHighPredicates: { k: Kleene; text: string }[] = standardAdult
    ? [
        {
          k: tri(s.recent_vertebral_fracture_within_2_years),
          text: "Vertebral fracture within the last 2 years.",
        },
        {
          k: fractureUnknown ? "unknown" : s.fragility_fracture === "multiple_vertebral",
          text: "Multiple vertebral fractures.",
        },
        {
          k:
            usableT !== null
              ? usableT <= -3.5
              : s.dxa_status === "available_valid" || s.dxa_status === "unknown"
                ? "unknown"
                : false,
          text: "Lowest valid T-score of −3.5 or below.",
        },
        {
          k: highDoseGc,
          text: "Systemic glucocorticoid ≥7.5 mg/day prednisolone equivalent for ≥3 months.",
        },
        {
          k: fraxUsable
            ? s.frax_comparison === "very_high_independently_confirmed"
            : "unknown",
          text: "Independently confirmed very-high FRAX against a documented policy.",
        },
      ]
    : [];

  const highPredicates: { k: Kleene; text: string }[] = standardAdult
    ? [
        {
          k: fractureUnknown ? "unknown" : anyHipOrVertebral,
          text: "Documented hip or vertebral fragility fracture.",
        },
        {
          k:
            usableT !== null
              ? usableT <= -2.5
              : s.dxa_status === "available_valid" || s.dxa_status === "unknown"
                ? "unknown"
                : false,
          text: "Lowest valid T-score of −2.5 or below.",
        },
        {
          k: fraxUsable
            ? s.frax_comparison === "above_local_treatment_threshold"
            : "unknown",
          text: "FRAX above the documented local treatment threshold.",
        },
      ]
    : [];

  if (standardAdult) {
    for (const p of [...veryHighPredicates, ...highPredicates]) {
      if (p.k === true) evidence.push(p.text);
    }
    const vh = anyTrue(veryHighPredicates.map((p) => p.k));
    const hi = anyTrue(highPredicates.map((p) => p.k));

    if (vh === true) {
      riskStatus = "very_high";
    } else if (hi === true) {
      if (vh === "unknown") {
        riskStatus = "at_least_high";
        for (const p of veryHighPredicates) {
          if (p.k === "unknown") unresolvedHigherTier.push(p.text);
        }
      } else {
        riskStatus = "high";
      }
    } else {
      // Below the high tier. "Low" is a positive finding, so it needs every
      // criterion explicitly satisfied — a missing answer is never a "no", and
      // an unresolved one never resolves downward into low risk.
      const fraxBelow =
        fraxUsable && s.frax_comparison === "below_local_treatment_threshold";
      const fractureHistoryReviewed =
        s.fragility_fracture !== "unknown" &&
        s.recent_vertebral_fracture_within_2_years !== "unknown";
      const modifiersReviewed =
        s.systemic_glucocorticoids !== "unknown" &&
        s.advanced_ckd_ckd_mbd_dialysis !== "unknown" &&
        s.dxa_risk_factors.length > 0;
      const bmdAcceptable =
        usableT !== null
          ? usableT > -2.5
          : s.dxa_status === "unavailable_or_not_feasible" && !dxaIndicated;

      if (
        vh === false &&
        hi === false &&
        fraxBelow &&
        fractureHistoryReviewed &&
        modifiersReviewed &&
        bmdAcceptable &&
        !blocked
      ) {
        riskStatus = "low";
        evidence.push(
          "No high or very-high feature; no hip or vertebral fragility fracture; FRAX below the documented local threshold with the policy version recorded; BMD not in the osteoporotic range; glucocorticoid, CKD and clinical risk-factor review all complete.",
        );
      } else {
        riskStatus = "unclassified_or_incomplete";
      }
    }
  }

  if (usableT !== null) {
    evidence.push(`Lowest valid T-score recorded at ${usableT.toFixed(1)}.`);
  }
  if (usableZ !== null) {
    evidence.push(`Lowest valid Z-score recorded at ${usableZ.toFixed(1)}.`);
  }
  if (s.fragility_fracture === "other_fragility") {
    evidence.push(
      `Other fragility site${s.other_fracture_site ? ` (${s.other_fracture_site})` : ""} — clinician site-specific review needed; this blocks any below-threshold conclusion.`,
    );
  }
  if (s.dxa_status === "unavailable_or_not_feasible") {
    evidence.push("DXA unavailable or not feasible. No BMD conclusion is drawn and normal BMD is not inferred.");
  }

  const riskCertainty =
    riskStatus === "at_least_high"
      ? "Lower bound only — higher tier unresolved"
      : riskStatus === "very_high" || riskStatus === "high"
        ? "Resolved from present evidence"
        : riskStatus === "low"
          ? "Low-risk criteria all explicitly satisfied"
          : riskStatus === "no_adult_class"
            ? "Adult T-score classification not applicable"
            : "Not established — data incomplete";

  const riskLowerBound =
    riskStatus === "very_high"
      ? "Very high"
      : riskStatus === "at_least_high" || riskStatus === "high"
        ? "High"
        : riskStatus === "low"
          ? "Low"
          : "None established (this is not low risk)";

  /* ---------------- Documented screening risks ---------------- */
  const documentedScreeningRisks: string[] = [];
  for (const f of s.dxa_risk_factors) {
    if (f === "none_identified") continue;
    if (f === "bone_loss_condition") {
      for (const c of s.bone_loss_conditions) documentedScreeningRisks.push(label(c));
      if (s.bone_loss_conditions.length === 0)
        documentedScreeningRisks.push("Condition causing bone loss (subtype not confirmed)");
      continue;
    }
    if (f === "other_clinician_confirmed_risk") {
      for (const c of s.other_confirmed_risks) documentedScreeningRisks.push(label(c));
      if (s.other_confirmed_risks.length === 0)
        documentedScreeningRisks.push("Other clinician-confirmed risk (subtype not confirmed)");
      continue;
    }
    documentedScreeningRisks.push(label(f));
  }

  /* ---------------- Today actions, in priority order ---------------- */
  const todayActions: string[] = [];
  if (blocked) todayActions.push("Resolve the blocking validation entries before anything else.");
  if (denosumabOverdue)
    todayActions.push(
      "Denosumab is overdue (last dose ≥7 months ago): arrange same-day continuity or specialist exit. This outranks routine reassessment.",
    );
  else if (s.current_therapy === "denosumab")
    todayActions.push("On denosumab: document the next dose and a planned exit or transition plan.");
  if (anyHipOrVertebral)
    todayActions.push("Hip or vertebral fracture: start secondary prevention now; do not wait for a screening DXA.");
  if (advancedCkd === true)
    todayActions.push("Advanced CKD / CKD-MBD: renal-bone specialist review before any routine drug choice.");
  if (riskStatus === "very_high")
    todayActions.push(
      "Refer for osteoporosis specialist review; consider sequential anabolic therapy then antiresorptive where appropriate.",
    );
  if ((riskStatus === "at_least_high" || riskStatus === "high") && !blocked)
    todayActions.push("Discuss antiresorptive therapy once the safety gates are explicitly satisfied.");
  if (s.dxa_status === "unavailable_or_not_feasible" && dxaIndicated)
    todayActions.push("DXA indicated but unavailable: arrange DXA if feasible; do not delay a clear fracture indication.");
  if (riskStatus === "low")
    todayActions.push(
      "Low risk: no medication indication. Prevention only — calcium and vitamin D adequacy, weight-bearing and balance exercise, falls review, smoking and alcohol advice.",
    );
  if (riskStatus === "unclassified_or_incomplete")
    todayActions.push("Collect the missing information. This is not low risk and not below threshold.");
  if (routeId === "pediatric")
    todayActions.push("Paediatric: outside the scope of this pathway. Refer to paediatric bone health services.");
  if (routeId === "incomplete")
    todayActions.push("Enter age and sex to assign a pathway.");
  if (pathway === "younger_individualized_z_score")
    todayActions.push(
      "Use the Z-score, fracture phenotype and a secondary-cause evaluation. No automatic T-score medication trigger.",
    );
  if (pathway === "individualized_no_auto_class")
    todayActions.push("Individualise: no automatic male or female T-score pathway is applied.");

  /* ---------------- Safety alerts ---------------- */
  const safetyAlerts: string[] = [];
  if (denosumabOverdue)
    safetyAlerts.push("Denosumab lapse risks rebound vertebral fracture. Do not simply stop.");
  if (s.current_therapy === "denosumab")
    safetyAlerts.push("Never stop or delay denosumab without a planned effective antiresorptive transition, even if BMD improved.");
  if (advancedCkd === true)
    safetyAlerts.push("Advanced CKD / CKD-MBD: severe hypocalcaemia risk with denosumab. Not a default choice.");
  if (advancedCkd === "unknown")
    safetyAlerts.push("Advanced CKD status unknown: denosumab and anabolics stay needs-review, not eligible.");
  if (s.safety.hypocalcemia === "yes")
    safetyAlerts.push("Correct hypocalcaemia before starting any antiresorptive.");
  if (s.safety.calcium_vitamin_d_adequate !== "yes")
    safetyAlerts.push("Calcium and vitamin D adequacy is not confirmed.");
  if (s.safety.pregnancy_lactation !== "no")
    safetyAlerts.push("Pregnancy or lactation status is not explicitly excluded.");
  if (s.safety.acute_kidney_injury !== "no")
    safetyAlerts.push("Acute kidney injury is not explicitly excluded.");
  if (s.safety.skeletal_malignancy_or_metabolic_bone_disease !== "no")
    safetyAlerts.push("Skeletal malignancy or metabolic bone disease is not explicitly excluded.");
  if (s.current_therapy === "unknown")
    safetyAlerts.push("Current therapy unknown: reconcile before any change.");
  if (!num(s.drug_specific_crcl_ml_min))
    safetyAlerts.push("Drug-specific CrCl missing: bisphosphonate renal gates stay needs-review. eGFR is not a substitute.");

  /* ---------------- Missing information ---------------- */
  const missing: string[] = [];
  if (!num(s.age)) missing.push("Age");
  if (s.sex === "unknown") missing.push("Sex");
  if (s.sex === "female" && s.menopause === "unknown") missing.push("Menopause status");
  if (s.fragility_fracture === "unknown") missing.push("Fragility fracture history");
  if (s.recent_vertebral_fracture_within_2_years === "unknown")
    missing.push("Vertebral fracture within 2 years");
  if (s.dxa_status === "unknown") missing.push("DXA availability");
  if (s.dxa_status === "available_valid" && standardAdult && !num(s.lowest_valid_t_score))
    missing.push("Lowest valid T-score");
  if (s.dxa_risk_factors.length === 0) missing.push("Clinical risk factors (empty is incomplete, not none)");
  if (s.systemic_glucocorticoids === "unknown") missing.push("Systemic glucocorticoid use");
  if (advancedCkd === "unknown") missing.push("Advanced CKD / CKD-MBD status");
  if (s.current_therapy === "unknown") missing.push("Current therapy");
  if (!num(s.drug_specific_crcl_ml_min)) missing.push("Drug-specific CrCl");
  for (const [k, v] of Object.entries(s.safety)) {
    if (v === "unknown") missing.push(label(k));
  }

  /* ---------------- Medications ---------------- */
  const globalsMet =
    s.safety.pregnancy_lactation === "no" &&
    s.safety.hypocalcemia === "no" &&
    s.safety.calcium_vitamin_d_adequate === "yes" &&
    s.safety.acute_kidney_injury === "no" &&
    s.safety.drug_specific_local_label_reviewed === "yes" &&
    s.safety.skeletal_malignancy_or_metabolic_bone_disease === "no" &&
    standardAdult;

  const confirmedTreatable =
    riskStatus === "very_high" || riskStatus === "at_least_high" || riskStatus === "high";

  let medications: MedicationOption[] = [];
  let medicationsGateNote: string | null = null;

  if (!confirmedTreatable || blocked) {
    medicationsGateNote = blocked
      ? "Medication options are suppressed while blocking validation is unresolved. Positive evidence above is retained."
      : riskStatus === "low"
        ? "Low risk: no medication indication. Prevention, calcium and vitamin D, exercise and falls measures only."
        : "No confirmed high or very-high evidence. Medication options stay hidden; this is not a below-threshold conclusion.";
  } else if (!globalsMet) {
    medicationsGateNote =
      "Global safety requirements are not all explicitly satisfied. Every option below is needs-review, not cleared.";
  }

  if (confirmedTreatable && !blocked) {
    const crcl = num(s.drug_specific_crcl_ml_min) ? (s.drug_specific_crcl_ml_min as number) : null;
    const veryHigh = riskStatus === "very_high";
    const oralOk = s.safety.oral_bisphosphonate_unsuitable === "no";

    const renal = (min: number): MedicationOption["status"] => {
      if (crcl === null) return "needs_review";
      return crcl >= min ? "consider" : "unsuitable";
    };
    const gate = (base: MedicationOption["status"]): MedicationOption["status"] =>
      !globalsMet ? (base === "unsuitable" ? "unsuitable" : "needs_review") : base;

    const oralStatus = (min: number): MedicationOption["status"] => {
      if (s.safety.oral_bisphosphonate_unsuitable === "yes") return "unsuitable";
      const r = renal(min);
      if (r === "unsuitable") return "unsuitable";
      return gate(oralOk ? r : "needs_review");
    };

    medications = [
      {
        id: "alendronate",
        name: "Alendronate",
        dose: "70 mg orally weekly",
        review: "Review after 5 years",
        status: oralStatus(35),
        notes: [
          "Fasting with water, upright for at least 30 minutes.",
          "Renal gate: CrCl ≥35 mL/min.",
          "The oral route must be suitable.",
        ],
      },
      {
        id: "risedronate",
        name: "Risedronate",
        dose: "35 mg orally weekly",
        review: "Review after 5 years",
        status: oralStatus(30),
        notes: ["Renal gate: CrCl ≥30 mL/min.", "The oral route must be suitable."],
      },
      {
        id: "zoledronate",
        name: "Zoledronate",
        dose: "5 mg IV yearly over at least 15 minutes",
        review: "Review after 3 annual doses",
        status:
          s.safety.acute_kidney_injury !== "no"
            ? "unsuitable"
            : gate(renal(35)),
        notes: ["Renal gate: CrCl ≥35 mL/min and no acute kidney injury."],
      },
      {
        id: "denosumab",
        name: "Denosumab",
        dose: "60 mg subcutaneously every 6 months",
        review: "No routine drug holiday",
        status:
          advancedCkd === true
            ? "unsuitable"
            : advancedCkd === "unknown"
              ? "needs_review"
              : gate("consider"),
        notes: [
          "Document the next dose and an exit plan.",
          "Severe hypocalcaemia risk in advanced CKD.",
        ],
      },
      {
        id: "teriparatide",
        name: "Teriparatide",
        dose: "20 micrograms subcutaneously daily",
        review: "Usually up to 24 months; verify the local label",
        status: veryHigh ? (advancedCkd === false ? gate("consider") : "needs_review") : "needs_review",
        notes: [
          "Specialist decision for very-high risk.",
          "Follow with a prompt antiresorptive.",
        ],
      },
      {
        id: "abaloparatide",
        name: "Abaloparatide",
        dose: "80 micrograms subcutaneously daily",
        review: "18 months in the NOGG/UK pathway; verify the local label",
        status:
          veryHigh && routeId === "postmenopausal"
            ? advancedCkd === false
              ? gate("consider")
              : "needs_review"
            : "needs_review",
        notes: [
          "Specialist decision, postmenopausal women.",
          "Follow with a prompt antiresorptive.",
        ],
      },
      {
        id: "romosozumab",
        name: "Romosozumab",
        dose: "210 mg subcutaneously monthly as two 105 mg injections",
        review: "12 months",
        status:
          s.safety.prior_mi_or_stroke !== "no"
            ? s.safety.prior_mi_or_stroke === "yes"
              ? "unsuitable"
              : "needs_review"
            : veryHigh && routeId === "postmenopausal"
              ? gate("consider")
              : "needs_review",
        notes: [
          "Any prior MI or stroke blocks routine selection in the NOGG default; check the local label.",
          "Follow with a prompt antiresorptive.",
        ],
      },
    ];
  }

  const token = makeToken(s);

  return {
    entryRoute: routeId,
    pathway,
    dxaDecision,
    issues,
    blocked,
    riskStatus,
    riskCertainty,
    riskLowerBound,
    evidence,
    unresolvedHigherTier,
    documentedScreeningRisks,
    todayActions,
    safetyAlerts,
    medications,
    medicationsGateNote,
    missingInformation: Array.from(new Set(missing)),
    token,
  };
}

/** Deterministic token: changes on every input edit, so a copied report goes stale. */
export function makeToken(s: OsteoState): string {
  const str = JSON.stringify(s);
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return "tok_" + (h >>> 0).toString(36).padStart(7, "0");
}

export function buildReport(s: OsteoState, r: OsteoResult, dateISO: string): string {
  const list = (a: string[]) => (a.length ? a.join(" | ") : "none");
  return [
    `OSTEOPOROSIS PATHWAY ${SPEC_VERSION} | ${dateISO} | token ${r.token}`,
    `VALIDATION: ${r.blocked ? "BLOCKED" : r.issues.length ? "warnings present" : "no issues"} — ${list(r.issues.map((i) => `${i.severity}: ${i.message}`))}`,
    `GATE1 ${ENTRY_LABELS[r.entryRoute]} / ${PATHWAY_LABELS[r.pathway]} | GATE2 ${label(s.fragility_fracture)} | GATE3 ${label(s.dxa_status)} T=${s.lowest_valid_t_score ?? "—"} Z=${s.lowest_valid_z_score ?? "—"} | GATE4 ${list(s.dxa_risk_factors.map(label))}`,
    `DXA DECISION: ${DXA_LABELS[r.dxaDecision]}`,
    `RISK: ${RISK_LABELS[r.riskStatus]} | certainty ${r.riskCertainty} | lower_bound ${r.riskLowerBound}`,
    `EVIDENCE: ${list(r.evidence)}`,
    `UNRESOLVED HIGHER-TIER: ${list(r.unresolvedHigherTier)}`,
    `DOCUMENTED SCREENING RISKS: ${list(r.documentedScreeningRisks)}`,
    `TODAY: ${list(r.todayActions)}`,
    `SAFETY: ${list(r.safetyAlerts)}`,
    `MEDS (alternatives, not a combination): ${list(r.medications.map((m) => `${m.name} ${m.dose} [${m.status}]`))}`,
    `MISSING: ${list(r.missingInformation)}`,
    "Not an automatic prescription.",
  ].join("\n");
}
