// ============================================================
// DIABETIC KETOACIDOSIS (DKA) & HYPEROSMOLAR HYPERGLYCEMIC
// STATE (HHS) TREATMENT ALGORITHM
// Adult emergency management based on clinical best practices
// ============================================================

export type HyperglycemicCrisisType = "dka" | "hhs" | "mixed_dka_hhs" | "unable_to_determine";
export type KetosisLevel = "none" | "mild" | "moderate" | "severe";
export type AcidosisLevel = "none" | "mild" | "moderate" | "severe";
export type MentalStatus = "alert" | "lethargic" | "stuporous" | "comatose";
export type HemodynamicStatus = "stable" | "compensated" | "decompensated_shock";

export interface DKA_HHS_Input {
  // Vital signs
  vital_signs: {
    systolic_bp: number;
    diastolic_bp: number;
    heart_rate: number;
    respiratory_rate: number;
    temperature_celsius: number;
    mental_status: MentalStatus;
  };

  // Laboratory values
  labs: {
    glucose_mg_dl: number;
    pH: number;
    pCO2_mmhg: number;
    bicarbonate_meq_l: number;
    anion_gap: number;
    serum_ketones?: "negative" | "small" | "moderate" | "large";
    beta_hydroxybutyrate_mmol_l?: number;
    sodium_meq_l: number;
    potassium_meq_l: number;
    chloride_meq_l: number;
    creatinine_mg_dl: number;
    BUN_mg_dl?: number;
    osmolality_mosm_kg?: number;
    urine_ketones?: "negative" | "small" | "moderate" | "large";
    ECG_findings?: string;
  };

  // Clinical context
  clinical_context: {
    diabetes_type: "type1" | "type2" | "unknown";
    known_diabetes: boolean;
    precipitating_cause?: string;
    current_insulin_status: "none" | "basal_only" | "basal_bolus" | "iv_insulin" | "unknown";
    recent_illness: boolean;
    recent_medication_change: boolean;
    pregnancy: boolean;
    on_sglt2i: boolean;
    urine_output_ml_per_hour?: number;
  };

  // Intake/Output
  fluid_status: {
    estimated_volume_deficit_liters?: number;
    recent_intake_last_24h_ml?: number;
    urine_output_last_4h_ml?: number;
  };
}

export interface DerivedCrisisFeatures {
  crisis_type: HyperglycemicCrisisType;
  ketosis_level: KetosisLevel;
  acidosis_level: AcidosisLevel;
  severity_classification: "mild" | "moderate" | "severe";
  hemodynamic_status: HemodynamicStatus;
  corrected_sodium: number;
  corrected_osmolality: number;
  anion_gap_closure_rate: string; // "expected", "slow", "accelerated"
}

export interface TreatmentStep {
  step_number: number;
  name: string;
  priority: "immediate" | "early" | "ongoing";
  actions: string[];
  monitoring: string[];
  safety_alerts: string[];
}

export interface DKA_HHS_ManagementPlan {
  status: "ok" | "incomplete";
  crisis_diagnosis: DerivedCrisisFeatures;
  initial_stabilization: TreatmentStep[];
  fluid_management: TreatmentStep[];
  insulin_therapy: TreatmentStep[];
  electrolyte_management: TreatmentStep[];
  glucose_management: TreatmentStep[];
  monitoring_frequencies: Record<string, string>;
  resolution_criteria: Record<string, string[]>;
  transition_to_subq: TreatmentStep[];
  critical_safety_alerts: string[];
  treatment_contraindications: string[];
}

// ============================================================
// DIAGNOSTIC CLASSIFICATION
// ============================================================

export function classifyHyperglycemicCrisis(input: DKA_HHS_Input): DerivedCrisisFeatures {
  const labs = input.labs;
  const vitals = input.vital_signs;

  // Determine ketosis level
  let ketosis_level: KetosisLevel = "none";
  if (labs.beta_hydroxybutyrate_mmol_l === undefined) {
    if (labs.serum_ketones === "large") ketosis_level = "severe";
    else if (labs.serum_ketones === "moderate") ketosis_level = "moderate";
    else if (labs.serum_ketones === "small") ketosis_level = "mild";
  } else {
    if (labs.beta_hydroxybutyrate_mmol_l >= 5) ketosis_level = "severe";
    else if (labs.beta_hydroxybutyrate_mmol_l >= 3) ketosis_level = "moderate";
    else if (labs.beta_hydroxybutyrate_mmol_l >= 1) ketosis_level = "mild";
  }

  // Determine acidosis level
  let acidosis_level: AcidosisLevel = "none";
  if (labs.pH < 7.1) acidosis_level = "severe";
  else if (labs.pH < 7.2) acidosis_level = "moderate";
  else if (labs.pH < 7.30) acidosis_level = "mild";

  // Calculate corrected sodium (normal ~140 mEq/L)
  const corrected_sodium = labs.sodium_meq_l + (labs.glucose_mg_dl - 100) * 0.016;

  // Calculate effective osmolality
  const corrected_osmolality = 2 * labs.sodium_meq_l + labs.glucose_mg_dl / 18 + (labs.BUN_mg_dl || 0) / 2.8;

  // Classify crisis type
  let crisis_type: HyperglycemicCrisisType;
  // DKA diagnostic criteria (per image): glucose >200 OR prior diabetes, AND ketosis (β-OHB ≥3.0 or urine ketones 2+), AND acidosis (pH <7.3 or bicarb <18)
  const is_hyperglycemic = labs.glucose_mg_dl > 200 || input.clinical_context.known_diabetes;
  const has_ketosis = labs.beta_hydroxybutyrate_mmol_l !== undefined
    ? labs.beta_hydroxybutyrate_mmol_l >= 3.0
    : (labs.serum_ketones === "moderate" || labs.serum_ketones === "large" || labs.urine_ketones === "moderate" || labs.urine_ketones === "large");
  const has_acidosis = labs.pH < 7.3 || labs.bicarbonate_meq_l < 18;
  // HHS criteria (per image): glucose >600, effective osm >300 OR total osm >320, no significant ketosis (β-OHB <3.0 or urine ketones <2+), no acidosis
  const is_hyperosmolar = (labs.osmolality_mosm_kg || corrected_osmolality) > 320;
  const effective_osm = 2 * labs.sodium_meq_l + labs.glucose_mg_dl / 18;
  const meets_hhs_osm = (labs.osmolality_mosm_kg || corrected_osmolality) > 320 || effective_osm > 300;
  const no_significant_ketosis = labs.beta_hydroxybutyrate_mmol_l !== undefined
    ? labs.beta_hydroxybutyrate_mmol_l < 3.0
    : (labs.serum_ketones === "negative" || labs.serum_ketones === "small" || labs.serum_ketones === undefined)
      && (labs.urine_ketones === "negative" || labs.urine_ketones === "small" || labs.urine_ketones === undefined);

  if (has_ketosis && has_acidosis && !is_hyperosmolar) {
    crisis_type = "dka";
  } else if (meets_hhs_osm && !has_acidosis && no_significant_ketosis && labs.glucose_mg_dl > 600) {
    crisis_type = "hhs";
  } else if ((has_ketosis || has_acidosis) && is_hyperosmolar) {
    crisis_type = "mixed_dka_hhs";
  } else {
    crisis_type = "unable_to_determine";
  }

  // Determine severity
  let severity_classification: "mild" | "moderate" | "severe";
  if (crisis_type === "dka") {
    if (labs.pH >= 7.25 && labs.bicarbonate_meq_l >= 15) severity_classification = "mild";
    else if (labs.pH >= 7.10 && labs.bicarbonate_meq_l >= 10) severity_classification = "moderate";
    else severity_classification = "severe";
  } else if (crisis_type === "hhs") {
    if (corrected_osmolality < 320) severity_classification = "mild";
    else if (corrected_osmolality < 330) severity_classification = "moderate";
    else severity_classification = "severe";
  } else {
    severity_classification = "moderate";
  }

  // Determine hemodynamic status
  let hemodynamic_status: HemodynamicStatus;
  if (vitals.systolic_bp < 90 || (vitals.heart_rate > 120 && vitals.mental_status !== "alert")) {
    hemodynamic_status = "decompensated_shock";
  } else if (vitals.systolic_bp < 100 || (vitals.heart_rate > 100 && input.fluid_status.estimated_volume_deficit_liters && input.fluid_status.estimated_volume_deficit_liters > 5)) {
    hemodynamic_status = "compensated";
  } else {
    hemodynamic_status = "stable";
  }

  // Estimate anion gap closure rate
  let anion_gap_closure_rate = "expected";
  if (labs.anion_gap > 16 && crisis_type === "dka") anion_gap_closure_rate = "expected";
  if (labs.creatinine_mg_dl > 3) anion_gap_closure_rate = "slow";

  return {
    crisis_type,
    ketosis_level,
    acidosis_level,
    severity_classification,
    hemodynamic_status,
    corrected_sodium,
    corrected_osmolality,
    anion_gap_closure_rate,
  };
}

// ============================================================
// TREATMENT ALGORITHM
// ============================================================

export function generateDKA_HHS_ManagementPlan(input: DKA_HHS_Input): DKA_HHS_ManagementPlan {
  const crisis = classifyHyperglycemicCrisis(input);
  const labs = input.labs;
  const vitals = input.vital_signs;
  const critical_alerts: string[] = [];
  const contraindications: string[] = [];

  // === CRITICAL ALERTS ===
  if (crisis.hemodynamic_status === "decompensated_shock") {
    critical_alerts.push("SHOCK PRESENT — Aggressive fluid resuscitation required. Consider vasopressors if SBP remains <90 after 1-2L fluids.");
  }
  if (labs.potassium_meq_l < 3.3) {
    critical_alerts.push("SEVERE HYPOKALEMIA — Do NOT start insulin until K+ ≥3.3. Replace potassium immediately.");
  }
  if (vitals.mental_status === "comatose") {
    critical_alerts.push("ALTERED MENTAL STATUS — Rule out cerebral edema, hypoglycemia, other CNS event. Arrange ICU monitoring.");
  }
  if (labs.pH < 6.8) {
    critical_alerts.push("SEVERE ACIDOSIS (pH <6.8) — Consider bicarbonate therapy per protocol. Escalate to ICU.");
  }
  if (input.clinical_context.on_sglt2i) {
    critical_alerts.push("SGLT2i USE NOTED — Consider euglycemic DKA risk. Monitor glucose and anion gap closely despite normal glucose.");
  }

  // === CONTRAINDICATIONS ===
  if (input.clinical_context.pregnancy) {
    contraindications.push("Pregnant patient — involve obstetrics and maternal-fetal medicine.");
  }

  // === INITIAL STABILIZATION ===
  const initial_stabilization: TreatmentStep[] = [
    {
      step_number: 1,
      name: "Rapid Assessment",
      priority: "immediate",
      actions: [
        "Check ABCs (airway, breathing, circulation).",
        "Obtain IV access (2 large-bore IVs recommended).",
        "Establish continuous cardiac monitoring.",
        "Send stat labs: CBC, BMP, VBG, troponin, lipase, urinalysis, β-hydroxybutyrate, lactate.",
        "Obtain portable chest X-ray if altered mental status or respiratory distress.",
        "Obtain ECG if K+ abnormal or cardiac symptoms.",
      ],
      monitoring: ["Vital signs q15-30min", "Mental status q30min"],
      safety_alerts: ["Do not delay IV access for lab confirmation.", "If altered mental status, also consider hypoglycemia as cause."],
    },
  ];

  // === FLUID MANAGEMENT (DKA vs HHS vs MIXED specific) ===
  const isDKA = crisis.crisis_type === "dka";
  const isHHS = crisis.crisis_type === "hhs";
  const isMixed = crisis.crisis_type === "mixed_dka_hhs";

  let initial_rate: string;
  let maintenance_rate: string;
  let fluid_type_initial: string;
  let total_first_4h: string;
  let mixed_phase_info: string = "";

  if (isDKA) {
    initial_rate = "1-1.5 L 0.9% NaCl IV in first hour";
    maintenance_rate = "250-500 mL/hr 0.9% NaCl, adjust based on hydration, urine output, corrected sodium";
    fluid_type_initial = "0.9% NaCl (isotonic)";
    total_first_4h = "Estimated 2-4 L";
  } else if (isHHS) {
    initial_rate = "1 L 0.9% NaCl IV in first hour (more cautious if elderly or heart failure)";
    maintenance_rate = "250-500 mL/hr 0.9% NaCl, target osmolality decrease 3-8 mOsm/kg/hr";
    fluid_type_initial = "0.9% NaCl (isotonic) - slower initial rate than DKA";
    total_first_4h = "Estimated 3-6 L (more severe dehydration)";
  } else if (isMixed) {
    initial_rate = "1 L 0.9% NaCl IV in first hour (HHS-FIRST approach — NOT 1.5L to avoid cerebral edema)";
    maintenance_rate = "250-500 mL/hr 0.9% NaCl with osmolality monitoring q4h";
    fluid_type_initial = "0.9% NaCl (isotonic) - conservative HHS rates initially";
    total_first_4h = "Estimated 3-5 L (HHS-driven dehydration)";
    mixed_phase_info = "PHASE 1 (HHS priority): Fluids at HHS-conservative rates, osmolality q4h + acidosis q4h. When osmolality <320 mOsm/kg, ESCALATE TO PHASE 2 (DKA protocols).";
  } else {
    initial_rate = "1-1.5 L 0.9% NaCl IV in first hour";
    maintenance_rate = "250-500 mL/hr per individual assessment";
    fluid_type_initial = "0.9% NaCl (isotonic)";
    total_first_4h = "Estimated 2-5 L";
  }

  const fluid_management: TreatmentStep[] = [
    {
      step_number: 2,
      name: "Fluid Resuscitation (DKA vs HHS Specific)",
      priority: "immediate",
      actions: [
        `Initial: ${initial_rate}`,
        `Maintenance: ${maintenance_rate}`,
        `When glucose reaches target (DKA: <250 mg/dL, HHS: <300 mg/dL), transition to 5% dextrose + 0.45% NaCl`,
        `Target urine output: 200-300 mL/hour or 0.5 mL/kg/hour`,
        `Total first 4 hours: ${total_first_4h}`,
        crisis.hemodynamic_status === "decompensated_shock" ? "SHOCK PRESENT: Prioritize 1-2 L bolus over 1-2 hours, consider vasopressors if SBP <90 after fluids" : "Hemodynamically stable: titrate to urine output and corrected sodium",
      ],
      monitoring: [
        "Urine output q1h initially",
        "Corrected sodium q2-4h",
        "Osmolality q4-6h (especially HHS)",
        "Vital signs q1h",
        "Fluid balance chart (strict I&Os)",
      ],
      safety_alerts: [
        "Avoid hypotonic fluids initially (cerebral edema risk)",
        "Monitor for hyperchloremic acidosis (high normal chloride)",
        isHHS ? "HHS: Avoid osmolality correction >3 mOsm/kg/hr in first 8h to prevent cerebral edema" : "DKA: Aggressive fluids acceptable due to acidosis",
        "In renal impairment: reduce fluid rate, monitor for pulmonary edema",
        "In heart failure: use central venous pressure monitoring if available",
      ],
    },
  ];

  // === POTASSIUM MANAGEMENT (CRITICAL - INSULIN GATED) ===
  let potassium_action = "";
  let potassium_monitoring = "";
  const potassium_alerts: string[] = [];

  if (labs.potassium_meq_l < 3.3) {
    potassium_action = `K+ ${labs.potassium_meq_l} mEq/L — CRITICAL: HOLD ALL INSULIN. Replace K+ to ≥3.3 immediately. Use 40 mEq KCl/L in IV fluids (max 40 mEq/L peripheral, 10 mEq/hr) or 20 mEq/hr via central line. Recheck q1-2h.`;
    potassium_monitoring = "q1h until >3.3, then q2h × 3, then q4h";
    potassium_alerts.push("FATAL HYPOKALEMIA RISK: Never start insulin with K+ <3.3 — insulin drives K+ into cells");
    potassium_alerts.push("12-lead ECG if <3.0 mEq/L (look for flattened T waves, widened QRS)");
  } else if (labs.potassium_meq_l <= 5.2) {
    potassium_action = `K+ ${labs.potassium_meq_l} mEq/L (safe) — Start insulin 0.1 U/kg/hr. Add 20-30 mEq KCl/L to IV fluids. Target K+ 4-5 mEq/L range during insulin.`;
    potassium_monitoring = "q2h × 3 (first 6h), then q4h";
  } else if (labs.potassium_meq_l > 5.2 && labs.potassium_meq_l < 6.0) {
    potassium_action = `K+ ${labs.potassium_meq_l} mEq/L — Do NOT supplement potassium. Start insulin 0.1 U/kg/hr. Recheck q2h.`;
    potassium_monitoring = "q2h until <5.0";
  } else {
    potassium_action = `K+ ${labs.potassium_meq_l} mEq/L (HYPERKALEMIA) — Obtain 12-lead ECG. If ECG changes present: give 10 mL calcium gluconate 10% IV over 2-5 min. Consider beta-agonists or insulin + dextrose per hyperkalemia protocol. HOLD insulin if ECG abnormalities.`;
    potassium_monitoring = "q1-2h, continuous ECG monitoring";
    potassium_alerts.push("Peaked T waves, widened QRS, or flattened P waves on ECG = emergency");
  }

  const electrolyte_management: TreatmentStep[] = [
    {
      step_number: 3,
      name: "Potassium Management (INSULIN GATED)",
      priority: "immediate",
      actions: [
        potassium_action,
        "Obtain 12-lead ECG if K+ <3.5 or >5.5 mEq/L",
        "Once K+ safe, maintain 4-5 mEq/L range by adjusting IV K+ replacement with insulin dosing",
        "Check for concurrent hypomagnesemia — if <2.0 mg/dL, replace Mg first (K+ refractory without it)",
        "Max peripheral IV: 40 mEq K+/L, 10 mEq/hr; central line: 60 mEq/L, 20 mEq/hr",
        "Max 240 mEq K+/day unless severe symptomatic hypokalemia",
      ],
      monitoring: [
        `K+ ${potassium_monitoring}`,
        "ECG at baseline and if K+ abnormal",
        "Magnesium level daily (supplement if <2.0 mg/dL)",
        "Urine output (oliguria worsens hypokalemia)",
      ],
      safety_alerts: [
        "CRITICAL: Never start insulin with K+ <3.3 — risk of fatal hypokalemia",
        ...potassium_alerts,
        "Insulin causes K+ shift into cells by 0.6 mEq/L per 10 U — account for this",
        "Hyperkalemia >6.0 with ECG changes: immediately notify MD, prepare for emergent K+ reduction",
      ],
    },
  ];

  // === INSULIN THERAPY (WEIGHT-BASED DOSING) ===
  const weight_kg = (input as any).patient?.weight_kg || 75; // Use patient weight if provided
  const has_prominent_acidosis = labs.pH < 7.20;
  const insulin_bolus_dose = `0.1 U/kg = ${(0.1 * weight_kg).toFixed(0)} U IV`;
  const insulin_infusion_dose = `0.1 U/kg/hr = ${(0.1 * weight_kg).toFixed(1)} U/hr`;
  const insulin_half_dose = `0.05 U/kg/hr = ${(0.05 * weight_kg).toFixed(1)} U/hr (MIXED ONLY - Phase 1)`;
  const insulin_reduced_dose = `0.02-0.05 U/kg/hr = ${((0.02 * weight_kg).toFixed(1))}-${((0.05 * weight_kg).toFixed(1))} U/hr`;

  const insulin_therapy: TreatmentStep[] = [
    {
      step_number: 4,
      name: "Insulin Therapy (Weight-Based, K+-Dependent)",
      priority: "early",
      actions: [
        `PREREQUISITE: K+ ≥3.3 mEq/L AND initial fluid resuscitation (1-1.5L) completed.`,
        isDKA && has_prominent_acidosis ? `DKA with pH <7.20: Give 0.1 U/kg IV bolus (${insulin_bolus_dose}) as 50 U IV regular insulin in 50 mL normal saline over 1 min, then continuous infusion` : isMixed ? `MIXED DKA/HHS: Skip bolus. Start Phase 1 at ${insulin_half_dose} (half-rate to avoid rapid osmolality drop).` : `HHS or mild DKA (pH >7.20): Skip bolus, start infusion only`,
        isMixed ? `Continuous IV regular (Humulin R) insulin infusion - PHASE 1: Start at ${insulin_half_dose}. Continue until osmolality <320 mOsm/kg, then ESCALATE TO PHASE 2.` : `Continuous IV regular (Humulin R) insulin infusion: Start at ${insulin_infusion_dose}`,
        `Glucose reduction targets: 50-75 mg/dL/hr (avoid >100 mg/dL/hr to prevent hypoglycemia)`,
        `Glucose-based insulin adjustments:`,
        `  • Glucose >350 mg/dL: ${isMixed ? insulin_half_dose + " (Phase 1) → " + insulin_infusion_dose + " (Phase 2)" : insulin_infusion_dose} (continue)`,
        `  • Glucose 250-350 mg/dL: ${((0.05 * weight_kg).toFixed(1))}-${((0.075 * weight_kg).toFixed(1))} U/hr (reduce)`,
        `  • Glucose <250 mg/dL (DKA) or <300 mg/dL (HHS): ${insulin_reduced_dose} + switch to D5 0.45% NaCl`,
        `Discontinue insulin when:`,
        `  • DKA: anion gap ≤12, pH >7.30, HCO3- ≥18, able to eat`,
        `  • HHS: osmolality <310, mental status improved, able to eat`,
        isMixed ? `  • MIXED: BOTH osmolality <310 AND anion gap ≤12 AND pH >7.30 — dual resolution criteria` : ``,
      ].filter(a => a),
      monitoring: [
        "Glucose q1h during IV infusion",
        "Anion gap q2-4h (DKA) — plot trend",
        isMixed ? "Osmolality q4h (critical for Phase 1 → Phase 2 transition)" : "Osmolality q4-6h (HHS)",
        "Potassium q2h ×3 (first 6h), then q4h",
        "Mental status, vital signs q1h",
      ],
      safety_alerts: [
        isMixed ? "MIXED CASE - Phase transition critical: When osmolality <320 mOsm/kg, escalate insulin to full 0.1 U/kg/hr and intensify DKA protocols" : "",
        isMixed ? "MIXED CASE: If osmolality drops >3 mOsm/kg/hr, slow fluids immediately (cerebral edema risk)" : "",
        "NEVER reduce insulin rate >50% at once — risk of DKA recurrence",
        "Hypoglycemia <70 mg/dL: Give 10 mL 50% dextrose IV, reduce insulin 50%",
        "Glucose falls >100 mg/dL/hr: add more dextrose (D5 or higher), reduce insulin by 25%",
        "Euglycemic DKA (glucose <250 but anion gap open): continue insulin, monitor beta-hydroxybutyrate not just glucose",
        "Renal impairment: clearance may be delayed, monitor closely for hypoglycemia",
      ].filter(a => a),
    },
  ];

  // === GLUCOSE MANAGEMENT ===
  const glucose_management: TreatmentStep[] = [
    {
      step_number: 5,
      name: "Glucose and Dextrose Management",
      priority: "ongoing",
      actions: [
        isMixed ? "MIXED DKA/HHS - PHASE 1: Target glucose 200-300 mg/dL (less aggressive than pure DKA to prevent osmolality overcorrection)" : "Once glucose reaches ~250 mg/dL, add dextrose to IV fluids (5% or 10% dextrose in 0.45% NaCl).",
        isMixed ? "MIXED DKA/HHS - PHASE 2 (after osmolality <320): Transition to DKA glucose targets (150-250 mg/dL) with escalated insulin rate (0.1 U/kg/hr)" : "Target glucose 150-250 mg/dL during acute phase (allows continued insulin action while preventing hypoglycemia).",
        "Continue insulin infusion throughout recovery phase even as glucose improves, until anion gap closed (DKA) or osmolality <310 (HHS)",
        isMixed ? "or BOTH criteria met (MIXED)" : "",
      ].filter(a => a),
      monitoring: [
        "Glucose q1h during insulin drip",
        isMixed ? "Osmolality q4h (to trigger Phase 2 transition)" : "",
        "Point-of-care β-hydroxybutyrate or serum ketones",
      ].filter(a => a),
      safety_alerts: [
        "Risk of hypoglycemia if insulin not reduced when glucose falls.",
        "Euglycemic DKA can occur with SGLT2i use — may present with normal glucose and low anion gap.",
        isMixed ? "MIXED CASE: Do NOT titrate aggressively to <200 in Phase 1 — risk of cerebral edema if osmolality drops too fast" : "",
      ].filter(a => a),
    },
  ];

  // === MIXED DKA/HHS PHASE MANAGEMENT ===
  const mixed_phase_management: TreatmentStep[] = isMixed ? [
    {
      step_number: 6,
      name: "MIXED DKA/HHS Phase Transition (HHS→DKA Escalation)",
      priority: "ongoing",
      actions: [
        "PHASE 1 (HHS Priority - Initial 4-8 hours): Conservative HHS-first approach",
        "  • Insulin: 0.05 U/kg/hr (half rate to prevent rapid osmolality drop)",
        "  • Fluids: 1 L initial + 250-500 mL/hr HHS-conservative rate",
        "  • Goal: Reduce osmolality from extreme dehydration (>330) to <320 mOsm/kg",
        "  • Monitor: Osmolality q4h, acidosis q4h, glucose q1h",
        "  • Safety: If osmolality drops >3 mOsm/kg/hr, slow fluids to prevent cerebral edema",
        "",
        "PHASE 2 TRIGGER (When osmolality <320 mOsm/kg AND anion gap still open): Escalate to DKA protocols",
        "  • Insulin: Escalate to 0.1 U/kg/hr (DOUBLE from Phase 1)",
        "  • Fluids: Switch to DKA-aggressive rates (1-1.5 L/hr if volume depleted)",
        "  • Glucose target: Transition to DKA targets (150-250 mg/dL)",
        "  • Anion gap: Now the primary marker — close gap to ≤12, achieve pH >7.30",
        "  • K+ supplementation: Maintain 20-30 mEq/L (K+ will shift again with insulin escalation)",
        "",
        "PHASE 2 TRANSITION CHECKLIST:",
        "  ✓ Osmolality <320 mOsm/kg (HHS component improving)",
        "  ✓ Anion gap still >12 mEq/L (DKA component unresolved)",
        "  ✓ pH <7.30 or HCO3- <18 (acidosis worsening or persistent)",
        "  → YES to all? ESCALATE TO FULL DKA THERAPY",
      ],
      monitoring: [
        "Osmolality q4h — is it <320?",
        "Anion gap q2h — is it closing?",
        "pH q4h — is it improving?",
        "K+ q2h during Phase 2 (due to second insulin dose escalation)",
        "If osmolality drops >3 mOsm/kg/hr in Phase 1: obtain head CT if neuro symptoms",
      ],
      safety_alerts: [
        "CRITICAL TRANSITION: Must check BOTH osmolality <320 AND anion gap open before escalating",
        "If only osmolality <320 but anion gap closed: STOP Phase 2, HHS component resolved, continue monitoring DKA component",
        "If osmolality still >320: STAY in Phase 1 even if glucose high; prevent rapid osmolality drop",
        "Dual insulin escalation in Phase 2: K+ will drop further — must have K+ ≥3.3 before escalating insulin",
        "Cerebral edema risk: osmolality correction >4 mOsm/kg/hr in first 24h → obtain CT, restrict fluids if symptoms",
      ],
    },
  ] : [];

  // === MONITORING FREQUENCIES ===
  const monitoring_frequencies: Record<string, string> = {
    glucose: "Every 1 hour initially; every 4 hours once stable",
    electrolytes: "Every 2-4 hours until stable; then q6-8h",
    arterial_or_venous_gas: "Baseline, 4 hours, then q6-8h or as clinically indicated",
    anion_gap: isMixed ? "Every 2 hours (DKA resolution tracking during Phase 2)" : "Every 2 hours until closed",
    osmolality: isMixed ? "Every 4 hours (critical: <320 triggers Phase 1→Phase 2 transition)" : "Every 4-6 hours in HHS",
    urinalysis: "Baseline; monitor for ketones and glucose",
    urine_output: "Every 1 hour",
    ...(isMixed && {
      mixed_phase_transition: "Monitor osmolality q4h: when <320 mOsm/kg (AND acidosis still present), escalate insulin to 0.1 U/kg/hr and intensify DKA fluids",
      phase_2_trigger: "Osmolality <320 mOsm/kg + ongoing anion gap opening/elevation (indicates DKA component now predominant)",
      cerebral_edema_watch: "If osmolality drops >3 mOsm/kg/hr in Phase 1, slow fluids immediately and obtain head CT if symptoms develop",
    }),
  };

  // === RESOLUTION CRITERIA ===
  const resolution_criteria: Record<string, string[]> = {
    DKA: [
      "Glucose < 250 mg/dL",
      "pH > 7.30",
      "Bicarbonate ≥ 18 mEq/L",
      "Anion gap ≤ 12 mEq/L (or normal for lab)",
      "Serum or urine ketones small or negative",
    ],
    HHS: [
      "Effective osmolality < 310 mOsm/kg",
      "Glucose 200-300 mg/dL (controlled)",
      "Mental status alert or clearly improving",
      "Hemodynamically stable",
    ],
    MIXED: [
      "PHASE 1 RESOLUTION (HHS component closed):",
      "  • Osmolality < 320 mOsm/kg (HHS threshold for Phase 1→2 transition)",
      "  • Mental status normalized",
      "PHASE 2 RESOLUTION (DKA component closed + HHS maintained):",
      "  • Anion gap ≤ 12 mEq/L",
      "  • pH > 7.30",
      "  • Bicarbonate ≥ 18 mEq/L",
      "  • Osmolality remains < 310 mOsm/kg (HHS resolved AND maintained)",
      "FINAL RESOLUTION: Both Phase 1 AND Phase 2 criteria met for ≥2 hours",
    ],
  };

  // === TRANSITION TO SUBCUTANEOUS INSULIN ===
  const transition_to_subq: TreatmentStep[] = [
    {
      step_number: 9,
      name: "Transition to Subcutaneous Insulin",
      priority: "ongoing",
      actions: [
        "Criteria: Resolution criteria met AND patient able to eat or on stable nutrition.",
        "Continue IV insulin for 1-2 hours after first SQ dose to prevent recurrence.",
        "Calculate total daily dose from IV infusion rate (mL/hour × insulin conc / 100 × 24).",
        "Use basal-bolus regimen: ~50% basal, ~50% divided with meals.",
        "Adjust based on home regimen and type 1 vs type 2 diabetes.",
        "Educate on sick-day management, signs of recurrence, and follow-up.",
      ],
      monitoring: ["Glucose q4h during transition", "Electrolytes before discharge"],
      safety_alerts: ["Do not stop IV insulin before SQ insulin is given.", "Arrange endocrinology follow-up within 1-2 weeks."],
    },
  ];

  return {
    status: crisis.crisis_type === "unable_to_determine" ? "incomplete" : "ok",
    crisis_diagnosis: crisis,
    initial_stabilization,
    fluid_management,
    insulin_therapy,
    electrolyte_management,
    glucose_management,
    ...(isMixed && { mixed_phase_management }),
    monitoring_frequencies,
    resolution_criteria,
    transition_to_subq,
    critical_safety_alerts: critical_alerts,
    treatment_contraindications: contraindications,
  };
}
