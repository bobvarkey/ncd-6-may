export const SPEC_VERSION = "3.3.0-robust";
export const UNKNOWN_LABEL = "Unknown / not reviewed";

export type Tri = "unknown" | "yes" | "no";
/** Kleene three-valued truth. */
export type Kleene = true | false | "unknown";

export type Sex = "unknown" | "female" | "male" | "other";
export type Menopause =
  | "unknown"
  | "premenopausal"
  | "menopausal_transition"
  | "postmenopausal";
export type FragilityFracture =
  | "unknown"
  | "none"
  | "hip"
  | "one_vertebral"
  | "multiple_vertebral"
  | "other_fragility";
export type DxaStatus = "unknown" | "available_valid" | "unavailable_or_not_feasible";
export type FraxComparison =
  | "not_assessed"
  | "below_local_treatment_threshold"
  | "above_local_treatment_threshold"
  | "very_high_independently_confirmed";
export type CkdStatus = "unknown" | "yes_or_suspected" | "no";
export type CurrentTherapy =
  | "unknown"
  | "none"
  | "oral_bisphosphonate"
  | "iv_bisphosphonate"
  | "denosumab"
  | "anabolic_or_romosozumab";

export type SafetyKey =
  | "oral_bisphosphonate_unsuitable"
  | "hypocalcemia"
  | "hypercalcemia"
  | "calcium_vitamin_d_adequate"
  | "acute_kidney_injury"
  | "pregnancy_lactation"
  | "prior_mi_or_stroke"
  | "skeletal_malignancy_or_metabolic_bone_disease"
  | "drug_specific_local_label_reviewed";

export interface OsteoState {
  // Gate 1 — population
  age: number | null;
  sex: Sex;
  menopause: Menopause;

  // Gate 2 — fracture
  fragility_fracture: FragilityFracture;
  other_fracture_site: string;
  recent_vertebral_fracture_within_2_years: Tri;

  // Gate 3 — DXA
  dxa_status: DxaStatus;
  lowest_valid_t_score: number | null;
  lowest_valid_z_score: number | null;
  extreme_verified: Tri;

  // Gate 4 — risk factors
  dxa_risk_factors: string[];
  bone_loss_conditions: string[];
  other_confirmed_risks: string[];
  male_50_69_dxa_risk_review_complete: Tri;

  // Branch modifiers
  frax_comparison: FraxComparison;
  frax_country_threshold_policy_version: string;
  systemic_glucocorticoids: Tri;
  prednisolone_equivalent_mg_per_day: number | null;
  glucocorticoid_duration_months: number | null;
  advanced_ckd_ckd_mbd_dialysis: CkdStatus;
  egfr_ml_min_1_73m2: number | null;
  drug_specific_crcl_ml_min: number | null;
  current_therapy: CurrentTherapy;
  last_injection_or_infusion_date: string;

  // Medication safety
  safety: Record<SafetyKey, Tri>;
}

export const SAFETY_KEYS: SafetyKey[] = [
  "oral_bisphosphonate_unsuitable",
  "hypocalcemia",
  "hypercalcemia",
  "calcium_vitamin_d_adequate",
  "acute_kidney_injury",
  "pregnancy_lactation",
  "prior_mi_or_stroke",
  "skeletal_malignancy_or_metabolic_bone_disease",
  "drug_specific_local_label_reviewed",
];

export function initialState(): OsteoState {
  return {
    age: null,
    sex: "unknown",
    menopause: "unknown",

    fragility_fracture: "unknown",
    other_fracture_site: "",
    recent_vertebral_fracture_within_2_years: "unknown",

    dxa_status: "unknown",
    lowest_valid_t_score: null,
    lowest_valid_z_score: null,
    extreme_verified: "unknown",

    dxa_risk_factors: [],
    bone_loss_conditions: [],
    other_confirmed_risks: [],
    male_50_69_dxa_risk_review_complete: "unknown",

    frax_comparison: "not_assessed",
    frax_country_threshold_policy_version: "",
    systemic_glucocorticoids: "unknown",
    prednisolone_equivalent_mg_per_day: null,
    glucocorticoid_duration_months: null,
    advanced_ckd_ckd_mbd_dialysis: "unknown",
    egfr_ml_min_1_73m2: null,
    drug_specific_crcl_ml_min: null,
    current_therapy: "unknown",
    last_injection_or_infusion_date: "",

    safety: SAFETY_KEYS.reduce(
      (acc, k) => ({ ...acc, [k]: "unknown" as Tri }),
      {} as Record<SafetyKey, Tri>,
    ),
  };
}

export type Pathway =
  | "standard_adult"
  | "younger_individualized_z_score"
  | "individualized_no_auto_class"
  | "outside_scope"
  | "incomplete_no_risk_classification";

export type EntryRouteId =
  | "postmenopausal"
  | "male_70_plus"
  | "male_50_69"
  | "younger"
  | "sex_other"
  | "pediatric"
  | "incomplete";

export type DxaDecision =
  | "diagnostic_or_treatment_monitoring"
  | "age_based_prompt"
  | "risk_based_prompt"
  | "pending_risk_review"
  | "no_age_only_prompt"
  | "risk_based_individualized"
  | "clinician_individualized"
  | "outside_scope"
  | "pending_entry";

export type RiskStatus =
  | "very_high"
  | "at_least_high"
  | "high"
  | "unclassified_or_incomplete"
  | "no_adult_class";

export interface ValidationIssue {
  id: string;
  severity: "blocking" | "warning";
  message: string;
}

export interface MedicationOption {
  id: string;
  name: string;
  dose: string;
  review: string;
  status: "consider" | "needs_review" | "unsuitable";
  notes: string[];
}

export interface OsteoResult {
  entryRoute: EntryRouteId;
  pathway: Pathway;
  dxaDecision: DxaDecision;
  issues: ValidationIssue[];
  blocked: boolean;
  riskStatus: RiskStatus;
  riskCertainty: string;
  riskLowerBound: string;
  evidence: string[];
  unresolvedHigherTier: string[];
  documentedScreeningRisks: string[];
  todayActions: string[];
  safetyAlerts: string[];
  medications: MedicationOption[];
  medicationsGateNote: string | null;
  missingInformation: string[];
  token: string;
}
