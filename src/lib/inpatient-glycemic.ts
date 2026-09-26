
// ============================================================
// INPATIENT GLYCEMIC MANAGEMENT CDS
// Adult inpatient insulin management recommendations
// ============================================================

export type DiabetesType = "type1" | "type2" | "stress_hyperglycemia" | "other" | "unknown";
export type CareSetting = "ward" | "icu" | "stepdown" | "ed" | "perioperative" | "unknown";
export type NutritionStatus = "eating_regular" | "eating_poorly" | "clear_liquids" | "enteral_feeds" | "parenteral_nutrition" | "npo" | "unknown";
export type RecommendedRegimen = "basal_bolus_correction" | "basal_plus_correction" | "correction_only_exception" | "iv_insulin_protocol" | "endocrinology_review" | "unable_to_determine";
export type AlertCode = "TYPE1_NO_BASAL" | "SSI_ONLY_INAPPROPRIATE" | "RECURRENT_HYPERGLYCEMIA" | "SEVERE_HYPERGLYCEMIA" | "IMPENDING_HYPOGLYCEMIA" | "HYPOGLYCEMIA" | "STEROID_HYPERGLYCEMIA_PATTERN" | "NPO_PRANDIAL_MISMATCH" | "RENAL_HYPOGLYCEMIA_RISK" | "INSUFFICIENT_DATA" | "OUT_OF_SCOPE";
export type Severity = "info" | "warning" | "high" | "critical";
export type Confidence = "high" | "moderate" | "low";
export type Status = "ok" | "incomplete" | "out_of_scope";

export interface GlucoseMeasurement {
  timestamp: string;
  glucose_mg_dl: number;
  source: "poc" | "lab" | "cgm" | "unknown";
  context: "fasting" | "premeal" | "postmeal" | "bedtime" | "overnight" | "unknown";
}

export interface InpatientGlycemicInput {
  patient: {
    patient_id: string;
    age_years: number;
    weight_kg: number;
    diabetes_type: DiabetesType;
    known_diabetes: boolean;
    a1c_percent?: number;
  };
  encounter: {
    encounter_id: string;
    care_setting: CareSetting;
    service?: string;
  };
  clinical_state: {
    nutrition_status: NutritionStatus;
    npo: boolean;
    percent_meals_eaten?: number;
    hemodynamic_instability: boolean;
    procedure_planned_within_24h: boolean;
    renal_status: {
      creatinine_mg_dl?: number;
      egfr_ml_min_1_73m2?: number;
      dialysis: boolean;
    };
    steroid_status: {
      on_glucocorticoid: boolean;
      agent?: string;
      dose_mg_per_day?: number;
      frequency?: string;
    };
    hypoglycemia_risk_factors: string[];
  };
  current_therapy: {
    home_regimen: {
      uses_insulin: boolean;
      basal_insulin: boolean;
      bolus_insulin: boolean;
      total_daily_dose_units?: number;
      noninsulin_agents: string[];
    };
    inpatient_insulin: {
      basal_ordered: boolean;
      basal_type?: string;
      basal_daily_units?: number;
      prandial_ordered: boolean;
      prandial_type?: string;
      prandial_dose_strategy?: string;
      correction_ordered: boolean;
      correction_scale?: string;
      sliding_scale_only: boolean;
      iv_insulin: boolean;
      nph_for_steroids: boolean;
    };
  };
  glucose_data: {
    measurements_last_24h: GlucoseMeasurement[];
  };
}

export interface Alert {
  code: AlertCode;
  severity: Severity;
  message: string;
  recommended_action: string;
}

export interface DerivedFeatures {
  persistent_hyperglycemia: boolean;
  severe_hyperglycemia: boolean;
  impending_hypoglycemia: boolean;
  hypoglycemia: boolean;
  is_ssi_only: boolean;
  type1_without_basal: boolean;
  npo_prandial_mismatch: boolean;
  steroid_hyperglycemia_pattern: boolean;
  high_hypoglycemia_risk: boolean;
}

export interface InpatientGlycemicOutput {
  status: Status;
  missing_data: string[];
  derived_features: DerivedFeatures;
  recommended_regimen: RecommendedRegimen;
  alerts: Alert[];
  recommended_actions: string[];
  monitoring_plan: string[];
  reassessment_triggers: string[];
  audit: {
    rules_fired: string[];
    confidence: Confidence;
  };
}

// ============================================================
// INPATIENT GLYCEMIC ANALYSIS ENGINE
// ============================================================

export function analyzeInpatientGlycemia(input: InpatientGlycemicInput): InpatientGlycemicOutput {
  const missing: string[] = [];
  const alerts: Alert[] = [];
  const actions: string[] = [];
  const monitoring: string[] = [];
  const triggers: string[] = [];
  const rulesFired: string[] = [];

  // === SCOPE VALIDATION ===
  if (input.patient.age_years < 18) {
    return {
      status: "out_of_scope",
      missing_data: [],
      derived_features: {
        persistent_hyperglycemia: false,
        severe_hyperglycemia: false,
        impending_hypoglycemia: false,
        hypoglycemia: false,
        is_ssi_only: false,
        type1_without_basal: false,
        npo_prandial_mismatch: false,
        steroid_hyperglycemia_pattern: false,
        high_hypoglycemia_risk: false,
      },
      recommended_regimen: "unable_to_determine",
      alerts: [
        {
          code: "OUT_OF_SCOPE",
          severity: "info",
          message: "Pediatric patient — this tool is for adult inpatients only.",
          recommended_action: "Refer to pediatric endocrinology guidelines.",
        },
      ],
      recommended_actions: [],
      monitoring_plan: [],
      reassessment_triggers: [],
      audit: { rules_fired: [], confidence: "high" },
    };
  }

  // === DERIVE GLYCEMIC FEATURES FROM GLUCOSE DATA ===
  const glucose24h = input.glucose_data.measurements_last_24h.map((m) => m.glucose_mg_dl).sort((a, b) => a - b);
  const minGlucose = glucose24h.length > 0 ? glucose24h[0] : null;
  const maxGlucose = glucose24h.length > 0 ? glucose24h[glucose24h.length - 1] : null;
  const avgGlucose = glucose24h.length > 0 ? glucose24h.reduce((a, b) => a + b) / glucose24h.length : null;

  const persistent_hyperglycemia = glucose24h.filter((g) => g >= 180).length >= 2;
  const severe_hyperglycemia = glucose24h.filter((g) => g >= 250).length >= 1;
  const derived: DerivedFeatures = {
    persistent_hyperglycemia,
    severe_hyperglycemia,
    impending_hypoglycemia: glucose24h.filter((g) => g <= 80).length >= 1,
    hypoglycemia: glucose24h.filter((g) => g <= 70).length >= 1,
    is_ssi_only: input.current_therapy.inpatient_insulin.sliding_scale_only,
    type1_without_basal:
      input.patient.diabetes_type === "type1" &&
      !input.current_therapy.inpatient_insulin.basal_ordered &&
      !input.current_therapy.inpatient_insulin.iv_insulin,
    npo_prandial_mismatch: input.clinical_state.npo && input.current_therapy.inpatient_insulin.prandial_ordered,
    steroid_hyperglycemia_pattern:
      input.clinical_state.steroid_status.on_glucocorticoid &&
      (persistent_hyperglycemia || severe_hyperglycemia),
    high_hypoglycemia_risk: false, // Will set after renal check
  };

  // === RULE: TYPE 1 WITHOUT BASAL ===
  if (derived.type1_without_basal) {
    rulesFired.push("TYPE1_NO_BASAL_RULE");
    alerts.push({
      code: "TYPE1_NO_BASAL",
      severity: "critical",
      message: "Type 1 diabetes patient without basal insulin and without active IV insulin protocol.",
      recommended_action: "URGENT: Initiate basal insulin (e.g., Lantus, Levemir, Degludec) immediately to prevent DKA.",
    });
  }

  // === RULE: HYPOGLYCEMIA DETECTION ===
  if (derived.hypoglycemia) {
    rulesFired.push("HYPOGLYCEMIA_RULE");
    alerts.push({
      code: "HYPOGLYCEMIA",
      severity: "critical",
      message: `Documented hypoglycemia (≤70 mg/dL) in last 24 hours. Min glucose: ${minGlucose} mg/dL.`,
      recommended_action: "Reduce insulin doses, increase monitoring frequency, ensure access to fast-acting carbs, screen for causes.",
    });
  }

  // === RULE: IMPENDING HYPOGLYCEMIA ===
  if (derived.impending_hypoglycemia && !derived.hypoglycemia) {
    rulesFired.push("IMPENDING_HYPOGLYCEMIA_RULE");
    alerts.push({
      code: "IMPENDING_HYPOGLYCEMIA",
      severity: "high",
      message: `Glucose approached hypoglycemic range (≤80 mg/dL) in last 24 hours. Min glucose: ${minGlucose} mg/dL.`,
      recommended_action: "Assess hypoglycemia risk factors. Consider reducing insulin, increasing meal frequency, or PO carb intake.",
    });
  }

  // === RULE: SEVERE HYPERGLYCEMIA ===
  if (derived.severe_hyperglycemia) {
    rulesFired.push("SEVERE_HYPERGLYCEMIA_RULE");
    alerts.push({
      code: "SEVERE_HYPERGLYCEMIA",
      severity: "high",
      message: `Severe hyperglycemia documented (≥250 mg/dL). Max glucose: ${maxGlucose} mg/dL.`,
      recommended_action: "Escalate insulin therapy, assess DKA/HHS risk, rule out infection, medication non-compliance, or insulin infusion issues.",
    });
  }

  // === RULE: PERSISTENT HYPERGLYCEMIA ===
  if (derived.persistent_hyperglycemia && !derived.severe_hyperglycemia) {
    rulesFired.push("PERSISTENT_HYPERGLYCEMIA_RULE");
    alerts.push({
      code: "RECURRENT_HYPERGLYCEMIA",
      severity: "warning",
      message: `Persistent hyperglycemia (≥180 mg/dL on ≥2 occasions). Avg: ${avgGlucose?.toFixed(0)} mg/dL.`,
      recommended_action: "Initiate or intensify scheduled insulin therapy; reassess within 24 hours.",
    });
  }

  // === RULE: SSI-ONLY INAPPROPRIATENESS ===
  if (derived.is_ssi_only && (derived.persistent_hyperglycemia || derived.severe_hyperglycemia)) {
    rulesFired.push("SSI_ONLY_INAPPROPRIATE_RULE");
    alerts.push({
      code: "SSI_ONLY_INAPPROPRIATE",
      severity: "high",
      message: "Correction-only insulin active despite persistent or severe hyperglycemia.",
      recommended_action: "Escalate to scheduled insulin (basal-bolus or basal-plus-correction) unless institution-specific contraindications apply.",
    });
  }

  // === RULE: NPO + PRANDIAL MISMATCH ===
  if (derived.npo_prandial_mismatch) {
    rulesFired.push("NPO_PRANDIAL_MISMATCH_RULE");
    alerts.push({
      code: "NPO_PRANDIAL_MISMATCH",
      severity: "high",
      message: "Patient NPO but prandial insulin is still ordered.",
      recommended_action: "Hold prandial insulin while NPO. Ensure basal insulin and correction insulin remain active (unless IV insulin).",
    });
  }

  // === RULE: STEROID HYPERGLYCEMIA PATTERN ===
  if (derived.steroid_hyperglycemia_pattern) {
    rulesFired.push("STEROID_PATTERN_RULE");
    alerts.push({
      code: "STEROID_HYPERGLYCEMIA_PATTERN",
      severity: "warning",
      message: `Glucocorticoid exposure (${input.clinical_state.steroid_status.agent} ${input.clinical_state.steroid_status.dose_mg_per_day} mg/day) likely contributing to hyperglycemia.`,
      recommended_action: "Review steroid-matched insulin strategy. Consider NPH for afternoon/evening steroid peaks. Monitor during taper.",
    });
  }

  // === RULE: RENAL HYPOGLYCEMIA RISK ===
  const hasLowEGFR = input.clinical_state.renal_status.egfr_ml_min_1_73m2 !== undefined && input.clinical_state.renal_status.egfr_ml_min_1_73m2 < 30;
  const hasDialysis = input.clinical_state.renal_status.dialysis;
  const poorIntake = input.clinical_state.nutrition_status === "eating_poorly" || input.clinical_state.nutrition_status === "npo";
  const priorLowGlucose = derived.hypoglycemia || derived.impending_hypoglycemia;

  if ((hasLowEGFR || hasDialysis) && (poorIntake || priorLowGlucose)) {
    rulesFired.push("RENAL_HYPOGLYCEMIA_RISK_RULE");
    derived.high_hypoglycemia_risk = true;
    alerts.push({
      code: "RENAL_HYPOGLYCEMIA_RISK",
      severity: "high",
      message: "High hypoglycemia risk due to renal impairment + reduced nutrition or prior hypoglycemia.",
      recommended_action: "Reduce insulin doses by 25-50%, increase glucose monitoring to every 2-4 hours, assess medication clearance.",
    });
  }

  // === DETERMINE RECOMMENDED REGIMEN ===
  let recommendedRegimen: RecommendedRegimen = "unable_to_determine";

  if (input.patient.diabetes_type === "unknown" || glucose24h.length === 0) {
    recommendedRegimen = "unable_to_determine";
  } else if (input.encounter.care_setting === "icu" || input.clinical_state.hemodynamic_instability) {
    recommendedRegimen = "iv_insulin_protocol";
  } else if (input.patient.diabetes_type === "type1") {
    recommendedRegimen = input.clinical_state.npo ? "basal_plus_correction" : "basal_bolus_correction";
  } else if (input.clinical_state.nutrition_status === "eating_regular" && derived.persistent_hyperglycemia) {
    recommendedRegimen = "basal_bolus_correction";
  } else if ((input.clinical_state.nutrition_status === "npo" || input.clinical_state.nutrition_status === "eating_poorly") && derived.persistent_hyperglycemia) {
    recommendedRegimen = "basal_plus_correction";
  } else if (
    derived.is_ssi_only &&
    input.patient.diabetes_type === "type2" &&
    !derived.severe_hyperglycemia &&
    input.clinical_state.nutrition_status === "eating_regular"
  ) {
    recommendedRegimen = "correction_only_exception";
    actions.push("Daily reassessment required; escalate if hyperglycemia worsens.");
  } else {
    recommendedRegimen = "endocrinology_review";
  }

  // === RECOMMENDED ACTIONS ===
  if (recommendedRegimen === "iv_insulin_protocol") {
    actions.push("Initiate IV insulin protocol per institution guidelines (e.g., glucose target 140-180 mg/dL for noncritical, 110-140 for critical).");
    actions.push("Transition to subcutaneous insulin when stable and able to eat.");
  } else if (recommendedRegimen === "basal_bolus_correction") {
    actions.push("Initiate or escalate to basal-bolus-correction regimen.");
    actions.push("Basal: 40-50% of estimated daily requirement; prandial: 50-60% split with meals; correction scale per patient sensitivity.");
  } else if (recommendedRegimen === "basal_plus_correction") {
    actions.push("Initiate basal insulin (40-50% of estimated daily requirement).");
    actions.push("Hold prandial insulin while NPO/poor intake; maintain correction scale.");
    actions.push("Transition to basal-bolus when nutrition improves.");
  }

  if (input.clinical_state.steroid_status.on_glucocorticoid) {
    actions.push("Consider NPH insulin in afternoon/evening to cover steroid-induced peaks.");
    actions.push("Expect reduced insulin needs if steroid is tapered.");
  }

  // === MONITORING PLAN ===
  monitoring.push("Bedside glucose monitoring before meals and at bedtime per institution protocol.");
  monitoring.push("More frequent monitoring (every 2-4 hours) if on IV insulin or high hypoglycemia risk.");
  monitoring.push("Document glucose source (POC vs lab) and timing in relation to meals and insulin.");

  if (derived.high_hypoglycemia_risk) {
    monitoring.push("Increase surveillance for hypoglycemia; educate patient/family on symptoms and treatment.");
  }

  // === REASSESSMENT TRIGGERS ===
  triggers.push("Any glucose ≤70 mg/dL → reduce insulin immediately, assess cause.");
  triggers.push("Any glucose ≥250 mg/dL → evaluate for new infection, non-compliance, infusion issues.");
  triggers.push("Change in nutrition status (NPO to eating or vice versa) → adjust insulin accordingly.");
  triggers.push("Steroid dose change or discontinuation → reassess insulin 24-48 hours later.");
  triggers.push("Planned procedure or discharge → prepare discharge insulin plan with endocrinology input if needed.");

  // === COMPILE OUTPUT ===
  const confidence: Confidence = glucose24h.length >= 4 ? "high" : glucose24h.length >= 2 ? "moderate" : "low";
  const status: Status = alerts.filter((a) => a.code === "INSUFFICIENT_DATA").length > 0 ? "incomplete" : "ok";

  return {
    status,
    missing_data: missing,
    derived_features: derived,
    recommended_regimen: recommendedRegimen,
    alerts,
    recommended_actions: actions,
    monitoring_plan: monitoring,
    reassessment_triggers: triggers,
    audit: {
      rules_fired: rulesFired,
      confidence,
    },
  };
}

// ============================================================
// INSULIN SLIDING SCALE CALCULATOR
// ============================================================

export interface SlidingScaleEntry {
  glucose_range: { min: number; max: number };
  units_bolus: number;
  duration_hours: number;
  notes: string;
}

export interface InsulinSlidingScale {
  scale_type: "correction_only" | "standard" | "high_sensitivity";
  insulin_type: string;
  insulin_sensitivity_factor: number;
  target_glucose: number;
  entries: SlidingScaleEntry[];
}

export function generateInsulinSlidingScale(patientWeight: number, insulinSensitivity: "standard" | "high" | "low" = "standard"): InsulinSlidingScale {
  const sensitivity = insulinSensitivity === "standard" ? 1 : insulinSensitivity === "high" ? 1.5 : 0.7;
  const baseFactor = 1800 / (patientWeight * 20); // Simplified sensitivity calculation

  const entries: SlidingScaleEntry[] = [
    {
      glucose_range: { min: 0, max: 80 },
      units_bolus: 0,
      duration_hours: 2,
      notes: "Hypoglycemia — hold insulin, give fast carbs, monitor q15min",
    },
    {
      glucose_range: { min: 81, max: 120 },
      units_bolus: 0,
      duration_hours: 3,
      notes: "Target range — no correction insulin needed",
    },
    {
      glucose_range: { min: 121, max: 150 },
      units_bolus: Math.ceil(baseFactor * sensitivity * 1),
      duration_hours: 4,
      notes: "Mild elevation — small correction",
    },
    {
      glucose_range: { min: 151, max: 180 },
      units_bolus: Math.ceil(baseFactor * sensitivity * 2),
      duration_hours: 4,
      notes: "Moderate elevation — standard correction",
    },
    {
      glucose_range: { min: 181, max: 220 },
      units_bolus: Math.ceil(baseFactor * sensitivity * 3),
      duration_hours: 3,
      notes: "Above goal — increased correction",
    },
    {
      glucose_range: { min: 221, max: 250 },
      units_bolus: Math.ceil(baseFactor * sensitivity * 4),
      duration_hours: 3,
      notes: "Significant elevation — robust correction",
    },
    {
      glucose_range: { min: 251, max: 300 },
      units_bolus: Math.ceil(baseFactor * sensitivity * 5),
      duration_hours: 2,
      notes: "Severe hyperglycemia — maximum correction, consider escalation",
    },
    {
      glucose_range: { min: 301, max: 500 },
      units_bolus: Math.ceil(baseFactor * sensitivity * 6),
      duration_hours: 2,
      notes: "Critical hyperglycemia — escalate regimen, rule out DKA/HHS",
    },
  ];

  return {
    scale_type: "correction_only",
    insulin_type: "Humalog or NovoLog (rapid-acting)",
    insulin_sensitivity_factor: baseFactor * sensitivity,
    target_glucose: 120,
    entries,
  };
}
