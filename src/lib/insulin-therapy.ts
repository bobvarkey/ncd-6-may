import { PatientData } from "./patient-data";

export interface InsulinTherapyResult {
  type: "type1" | "type2";
  rationale: string;
  bg_goals: { fasting: string; preprandial: string; postprandial_2h: string; a1c: string };
  tdd: { range: string; calculated_units: number; dose_per_kg: string };
  distribution: { basal_pct: string; prandial_pct: string; basal_units: number; prandial_units: number };
  regimen_modes: string[];
  basal_agents: string[];
  prandial_agents: string[];
  premixed_agents?: string[];
  start_indications?: string[];
  basal_augmentation?: { dose_range: string; target_fbg: string; description: string };
  premixed_use_cases?: string[];
  special_considerations: Record<string, string>;
}

export function generateInsulinTherapy(patient: PatientData, type: "type1" | "type2"): InsulinTherapyResult {
  const weightKg = patient.weightKg || 75;

  if (type === "type1") {
    return generateType1Therapy(weightKg);
  } else {
    return generateType2Therapy(weightKg, patient.hba1c);
  }
}

function generateType1Therapy(weightKg: number): InsulinTherapyResult {
  const tddUnits = Math.round(weightKg * 0.5 * 2) / 2;
  const basalUnits = Math.round(tddUnits * 0.5 * 2) / 2;
  const prandialUnits = Math.round(tddUnits * 0.5 * 2) / 2;

  return {
    type: "type1",
    rationale: "Absolute insulin deficiency; insulin is essential to prevent DKA and long-term complications.",
    bg_goals: {
      fasting: "80–130 mg/dL",
      preprandial: "80–130 mg/dL",
      postprandial_2h: "<180 mg/dL",
      a1c: "<7% (individualized)",
    },
    tdd: {
      range: "0.5–1.0 units/kg/day (new onset may be lower)",
      calculated_units: tddUnits,
      dose_per_kg: `${(tddUnits / weightKg).toFixed(2)} U/kg/day`,
    },
    distribution: {
      basal_pct: "40–60% of TDD",
      prandial_pct: "40–60% of TDD",
      basal_units: basalUnits,
      prandial_units: prandialUnits,
    },
    regimen_modes: [
      "Multiple Daily Injections (MDI): basal 1–2 injections + prandial 3–4 injections",
      "Continuous Subcutaneous Insulin Infusion (CSII) pump: preferred for frequent hypoglycemia, dawn phenomenon, or high variability",
    ],
    basal_agents: [
      "Glargine (U-100, U-300)",
      "Detemir",
      "Degludec",
      "NPH (intermediate, less common)",
    ],
    prandial_agents: [
      "Lispro",
      "Aspart",
      "Glulisine",
      "Regular human insulin (less preferred)",
    ],
    special_considerations: {
      "DKA Risk": "High if insulin is withheld; needs sick-day rules and emergency action plan",
      "Hypoglycemia": "Common with intensive regimens; CGM and insulin-pump technology reduce risk",
      "Adjuncts": "GLP-1 RAs, SGLT2i under investigation (risk-benefit carefully weighed due to DKA risk)",
      "Monitoring": "CGM recommended for continuous glucose monitoring; SMBG minimum 4 times daily",
      "Exercise": "Insulin adjustment needed before/during/after; carb supplementation important",
    },
  };
}

function generateType2Therapy(weightKg: number, hba1c: number = 8): InsulinTherapyResult {
  let approach: "basal-augmentation" | "basal-bolus" | "premixed" = "basal-augmentation";
  let doseMultiplier = 0.15;
  let dosageDescription = "0.1–0.2 units/kg/day";

  if (hba1c >= 9) {
    approach = "basal-bolus";
    doseMultiplier = 0.4;
    dosageDescription = "0.3–0.5 units/kg/day (full replacement)";
  } else if (hba1c >= 8) {
    approach = "basal-augmentation";
    doseMultiplier = 0.25;
    dosageDescription = "0.2–0.3 units/kg/day";
  }

  const tddUnits = Math.round(weightKg * doseMultiplier * 2) / 2;
  const basalUnits = approach === "basal-bolus" ? Math.round(tddUnits * 0.5 * 2) / 2 : tddUnits;
  const prandialUnits = approach === "basal-bolus" ? Math.round(tddUnits * 0.5 * 2) / 2 : 0;

  return {
    type: "type2",
    rationale: "Relative insulin deficiency and resistance; insulin supplements or replaces failing beta-cell function.",
    bg_goals: {
      fasting: "80–130 mg/dL",
      preprandial: "80–130 mg/dL",
      postprandial_2h: "<180 mg/dL",
      a1c: "<7% or individualized (e.g., higher in frail elderly)",
    },
    tdd: {
      range: dosageDescription,
      calculated_units: tddUnits,
      dose_per_kg: `${(tddUnits / weightKg).toFixed(2)} U/kg/day`,
    },
    distribution: {
      basal_pct: approach === "basal-bolus" ? "50% of TDD" : "100% (basal only)",
      prandial_pct: approach === "basal-bolus" ? "50% of TDD" : "0% (unless escalating to basal-bolus)",
      basal_units: basalUnits,
      prandial_units: prandialUnits,
    },
    regimen_modes: [
      "Once-daily basal insulin (most common) — Glargine U-100 (Lantus, Basalog, Glaritus), Glargine U-300 (Toujeo), Degludec (Tresiba), or Detemir (Levemir) at bedtime",
      "Twice-daily basal — NPH (Insugen-N, Huminsulin-N, Insulatard) split 2/3 AM + 1/3 HS, or Detemir (Levemir) BID",
      "Basal-bolus (advanced) — Basal: Glargine/Degludec/Detemir once daily PLUS Prandial: Lispro (Humalog), Aspart (NovoRapid), Glulisine (Apidra), or Regular (Actrapid, Insugen-R, Huminsulin-R) before each meal",
      "Premixed injections — Biphasic 30/70 (Insugen 30/70, Mixtard 30, Huminsulin 30/70), 50/50 (Mixtard 50), or analogue premix (NovoMix 30, Humalog Mix 25/50, Ryzodeg 70/30) BID before breakfast & dinner",
    ],
    basal_agents: ["Glargine (U-100, U-300)", "Detemir", "Degludec", "NPH"],
    prandial_agents: ["Lispro", "Aspart", "Glulisine", "Regular human insulin"],
    premixed_agents: ["70/30", "50/50", "IDeg/Asp (Ryzodeg)"],
    start_indications: [
      "A1C ≥9% with symptoms or catabolism (weight loss, polyuria)",
      "Failure despite maximal oral/GLP-1 therapy after 2–3 months",
      "Acute hyperglycemia (BG >300 mg/dL with symptoms)",
    ],
    basal_augmentation: {
      dose_range: dosageDescription,
      target_fbg: "≤100 mg/dL",
      description: "Add basal insulin to existing OADs/GLP-1 RA; titrate by 2-4 units every 3 days until target",
    },
    premixed_use_cases: ["Patients who cannot count carbs", "Those unable to manage multiple injections", "Bridge to basal-bolus if adherence is a barrier"],
    special_considerations: {
      "Metformin": "Typically continued if tolerated (cardio-benefits, weight-neutral)",
      "GLP-1/SGLT2i": "Often combined with basal or basal-bolus when weight and cardiorenal risk are concerns",
      "Hypoglycemia": "Lower risk at initiation, increases with titration and prandial/intensive regimens",
      "Weight Gain": "Common with intensive prandial insulin; mitigated by GLP-1 RAs, SGLT2i, and diet/exercise",
      "Monitoring": "SMBG fasting + 2h postprandial, or CGM for intensive regimens",
    },
  };
}
