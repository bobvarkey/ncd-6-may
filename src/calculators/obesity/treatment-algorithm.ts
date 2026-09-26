// ============================================================
// OBESITY TREATMENT ALGORITHM
// Based on ADA 2026, AACE 2024, and regional guidelines
// Incorporates medication recommendations from htn-detective-kit
// and diabetes-buddy repositories
// ============================================================

import { EthnicityType } from "./obesity-guidelines";

export interface TreatmentStep {
  id: string;
  title: string;
  description: string;
  criteria?: {
    bmi?: { min?: number; max?: number };
    ethnicity?: EthnicityType[];
    comorbidities?: string[];
  };
  interventions: Intervention[];
  duration: string;
  expectedOutcome: string;
  nextStepId?: string | null;
}

export interface Intervention {
  type: "lifestyle" | "medication" | "procedure" | "monitoring" | "referral";
  name: string;
  details: string;
  priority: "essential" | "recommended" | "optional";
}

export interface AlgorithmBranch {
  id: string;
  label: string;
  conditions: string[];
  firstLine: string[];
  secondLine?: string[];
  avoid?: string[];
  monitoring?: string[];
  notes: string;
}

// ============================================================
// COMORBIDITY-BASED TREATMENT BRANCHES
// ============================================================

export const TREATMENT_BRANCHES: AlgorithmBranch[] = [
  // === UNCOMPLICATED OBESITY ===
  {
    id: "uncomplicated",
    label: "Uncomplicated Obesity",
    conditions: ["No major comorbidities", "BMI ≥30 or ≥27 with risk factors"],
    firstLine: [
      "Caloric deficit: 500-750 kcal/day",
      "Physical activity: 150-300 min/week moderate intensity",
      "Behavioral therapy: Self-monitoring, goal setting",
    ],
    secondLine: [
      "Pharmacotherapy: Orlistat (if available)",
      "Consider GLP-1 RA for weight ≥10% target",
    ],
    monitoring: [
      "Weight every 4 weeks × 3 months",
      "Waist circumference at 3 months",
      "Metabolic panel at baseline and 3 months",
    ],
    notes: "5-10% weight loss goal over 3-6 months. Prioritize sustainable lifestyle changes.",
  },

  // === OBESITY + TYPE 2 DIABETES ===
  {
    id: "obesity-diabetes",
    label: "Obesity with Type 2 Diabetes",
    conditions: ["T2DM", "BMI ≥27"],
    firstLine: [
      "GLP-1 RA (Semaglutide preferred for weight)",
      "Dual GIP/GLP-1 agonist (Tirzepatide)",
      "SGLT2 inhibitor (Empagliflozin/Dapagliflozin)",
      "Metformin (if not contraindicated)",
    ],
    secondLine: [
      "Combination: Metformin + GLP-1 RA",
      "Combination: SGLT2i + GLP-1 RA",
      "Insulin (if HbA1c >10% or symptoms)",
    ],
    avoid: [
      "Sulfonylureas (weight gain)",
      "Pioglitazone (weight gain)",
      "Insulin (if alternatives available)",
    ],
    monitoring: [
      "HbA1c every 3 months until stable",
      "Weight every 2-4 weeks initially",
      "Hypoglycemia assessment",
      "Renal function if on metformin/SGLT2i",
    ],
    notes: "ADA 2026: Prioritize medications with weight loss benefit. GLP-1 RA or dual agonist preferred for obesity + T2DM.",
  },

  // === OBESITY + HYPERTENSION ===
  {
    id: "obesity-hypertension",
    label: "Obesity with Hypertension",
    conditions: ["HTN", "BMI ≥27"],
    firstLine: [
      "ACE inhibitor (Ramipril)",
      "ARB (Losartan)",
      "CCB (Amlodipine)",
      "Thiazide-like diuretic (Chlorthalidone)",
    ],
    secondLine: [
      "Combination therapy (ACEi/ARB + CCB or diuretic)",
      "Add anti-obesity medication if BP not controlled",
    ],
    avoid: [
      "Atenolol (weight gain)",
      "Other beta-blockers (unless CAD/HF)",
      "Alpha-blockers as monotherapy",
    ],
    monitoring: [
      "Home BP monitoring daily × 1 week, then weekly",
      "Weight every 4 weeks",
      "Electrolytes if on diuretic",
      "Renal function if on ACEi/ARB",
    ],
    notes: "Weight loss of 5-10% can reduce SBP by 5-20 mmHg. Consider spironolactone for resistant HTN.",
  },

  // === OBESITY + CKD ===
  {
    id: "obesity-ckd",
    label: "Obesity with CKD",
    conditions: ["CKD (any stage)", "BMI ≥27"],
    firstLine: [
      "ACE inhibitor or ARB (cardio- and renoprotective)",
      "SGLT2 inhibitor (if eGFR ≥20)",
      "GLP-1 RA (if no contraindications)",
      "Diuretic for volume control",
    ],
    secondLine: [
      "Adjust doses for eGFR",
      "Consider bariatric surgery if BMI ≥35",
    ],
    avoid: [
      "Metformin if eGFR <30",
      "NSAIDs",
      "High-protein diets in advanced CKD",
    ],
    monitoring: [
      "eGFR and urine ACR every 3-6 months",
      "Potassium if on ACEi/ARB/MRA",
      "Weight monthly",
    ],
    notes: "SGLT2i and GLP-1 RA have proven kidney benefits independent of glucose lowering.",
  },

  // === OBESITY + CVD/HIGH CV RISK ===
  {
    id: "obesity-cvd",
    label: "Obesity with CVD or High CV Risk",
    conditions: ["ASCVD", "HF", "Stroke history", "High 10-year CV risk"],
    firstLine: [
      "GLP-1 RA with proven CV benefit (Semaglutide, Liraglutide, Dulaglutide)",
      "SGLT2 inhibitor with CV benefit (Empagliflozin, Dapagliflozin)",
      "High-intensity statin",
      "ACEi/ARB (Ramipril - HOPE trial)",
    ],
    secondLine: [
      "Dual therapy: SGLT2i + GLP-1 RA",
      "Consider anti-obesity medication",
    ],
    avoid: [
      "Sibutramine (withdrawn - CV risk)",
      "Weight gain-promoting medications",
    ],
    monitoring: [
      "CV risk factors every 3-6 months",
      "Weight every 2-4 weeks",
      "Statin intolerance assessment",
    ],
    notes: "Weight loss improves all CV risk factors. 10% weight loss → 20% CV event reduction.",
  },

  // === OBESITY + NAFLD/NASH ===
  {
    id: "obesity-nafld",
    label: "Obesity with NAFLD/NASH",
    conditions: ["NAFLD/NASH", "Elevated liver enzymes", "Hepatic steatosis"],
    firstLine: [
      "Weight loss: 7-10% minimum",
      "Pioglitazone (if T2DM present)",
      "Vitamin E (if non-diabetic, biopsy-proven NASH)",
      "GLP-1 RA (Semaglutide - NASH trials)",
    ],
    secondLine: [
      "Resmetirom (if approved)",
      "Lanifibranor (investigational)",
    ],
    avoid: [
      "Orlistat (hepatotoxicity concern)",
      "Alcohol",
    ],
    monitoring: [
      "LFTs every 3-6 months",
      "Fibrosis assessment (FibroScan, FIB-4)",
      "Weight every 4 weeks",
    ],
    notes: "7-10% weight loss improves steatosis; 10% improves fibrosis. Resmetirom is first FDA-approved NASH treatment.",
  },

  // === OBESITY + PCOS ===
  {
    id: "obesity-pcos",
    label: "Obesity with PCOS",
    conditions: ["PCOS", "Hyperandrogenism", "Irregular menses"],
    firstLine: [
      "Weight loss: 5-10%",
      "Metformin (improves insulin resistance)",
      "Combined oral contraceptives",
    ],
    secondLine: [
      "GLP-1 RA (emerging evidence for PCOS)",
      "Spironolactone (for hirsutism)",
      "Letrozole (for fertility)",
    ],
    avoid: [
      "Thiazolidinediones (fluid retention)",
    ],
    monitoring: [
      "Menstrual regularity",
      "Androgen levels",
      "Glucose tolerance annually",
      "Weight monthly",
    ],
    notes: "5-10% weight loss can restore ovulation and improve metabolic parameters.",
  },

  // === OBESITY + SLEEP APNEA ===
  {
    id: "obesity-osa",
    label: "Obesity with OSA",
    conditions: ["Obstructive sleep apnea", "Daytime somnolence", "Snoring"],
    firstLine: [
      "CPAP therapy",
      "Weight loss: 10-15% target",
      "Positional therapy",
    ],
    secondLine: [
      "MAD (Mandibular advancement device)",
      "GLP-1 RA (improves OSA severity)",
      "Surgical options if CPAP intolerant",
    ],
    avoid: [
      "Sedatives",
      "Alcohol before sleep",
    ],
    monitoring: [
      "AHI on CPAP",
      "CPAP adherence",
      "Weight every 2-4 weeks",
      "Epworth Sleepiness Scale",
    ],
    notes: "10% weight loss can reduce AHI by 50%. GLP-1 RAs may reduce OSA severity beyond weight loss.",
  },

  // === SOUTH ASIAN-SPECIFIC CONSIDERATIONS ===
  {
    id: "south-asian",
    label: "South Asian-Specific Considerations",
    conditions: ["South Asian ethnicity", "BMI ≥23 (lower threshold)"],
    firstLine: [
      "Earlier intervention at BMI ≥23",
      "Waist circumference <80cm (women) / <90cm (men)",
      "Aggressive diabetes screening (HbA1c, OGTT)",
      "Cultural dietary counseling",
    ],
    secondLine: [
      "Metformin for prediabetes",
      "Consider statin at lower risk threshold",
    ],
    monitoring: [
      "Fasting glucose and HbA1c annually",
      "Lipids annually",
      "Waist circumference every visit",
    ],
    notes: "South Asians have higher metabolic risk at lower BMI. Consider bariatric surgery at BMI ≥32.5 with comorbidities.",
  },
];

// ============================================================
// STEPPED CARE ALGORITHM
// ============================================================

export const STEPPED_CARE: TreatmentStep[] = [
  {
    id: "step1",
    title: "Step 1: Intensive Lifestyle Intervention",
    description: "Foundation for all obesity management",
    interventions: [
      { type: "lifestyle", name: "Caloric deficit", details: "500-750 kcal/day deficit (1200-1500 kcal/day for women, 1500-1800 for men)", priority: "essential" },
      { type: "lifestyle", name: "Physical activity", details: "150-300 minutes/week moderate intensity (brisk walking, cycling, swimming)", priority: "essential" },
      { type: "lifestyle", name: "Behavioral therapy", details: "Self-monitoring, goal setting, stimulus control, problem-solving", priority: "essential" },
      { type: "monitoring", name: "Baseline assessment", details: "Weight, BMI, waist, BP, glucose, lipids, liver enzymes, renal function", priority: "essential" },
    ],
    duration: "3-6 months",
    expectedOutcome: "5-10% weight loss",
    nextStepId: "step2",
  },
  {
    id: "step2",
    title: "Step 2: Add Pharmacotherapy",
    description: "If <5% weight loss after 3-6 months of lifestyle intervention",
    criteria: {
      bmi: { min: 27 },
    },
    interventions: [
      { type: "medication", name: "Orlistat", details: "120mg TDS with meals. Widely available globally.", priority: "recommended" },
      { type: "medication", name: "GLP-1 RA (Liraglutide 3.0mg)", details: "Saxenda - daily injection. 8-12% weight loss.", priority: "recommended" },
      { type: "medication", name: "GLP-1 RA (Semaglutide 2.4mg)", details: "Wegovy - weekly injection. 15-17% weight loss.", priority: "recommended" },
      { type: "medication", name: "Dual GIP/GLP-1 (Tirzepatide)", details: "Zepbound - weekly injection. 20-22% weight loss.", priority: "recommended" },
      { type: "medication", name: "Phentermine-Topiramate", details: "Qsymia - contraindicated in pregnancy.", priority: "optional" },
      { type: "medication", name: "Naltrexone-Bupropion", details: "Contrave - avoid in uncontrolled HTN.", priority: "optional" },
      { type: "monitoring", name: "Medication monitoring", details: "Weight every 2-4 weeks, side effects, adherence", priority: "essential" },
    ],
    duration: "3-6 months",
    expectedOutcome: "Additional 5-15% weight loss (cumulative 10-25%)",
    nextStepId: "step3",
  },
  {
    id: "step3",
    title: "Step 3: Intensify or Combine Therapies",
    description: "If inadequate response to single agent or BMI ≥35",
    criteria: {
      bmi: { min: 35 },
    },
    interventions: [
      { type: "medication", name: "Combination therapy", details: "Consider combining medications with different mechanisms", priority: "recommended" },
      { type: "medication", name: "Dose optimization", details: "Maximize tolerated doses of current medications", priority: "recommended" },
      { type: "referral", name: "Bariatric surgery evaluation", details: "For BMI ≥35 or ≥30 with metabolic syndrome", priority: "recommended" },
      { type: "referral", name: "Endocrinology referral", details: "For complex cases, secondary causes of obesity", priority: "recommended" },
    ],
    duration: "Ongoing",
    expectedOutcome: "≥20% weight loss or surgery referral",
    nextStepId: "step4",
  },
  {
    id: "step4",
    title: "Step 4: Bariatric Surgery",
    description: "For severe obesity or obesity with significant comorbidities",
    criteria: {
      bmi: { min: 35 },
    },
    interventions: [
      { type: "procedure", name: "Sleeve gastrectomy", details: "Most common; 25-30% weight loss; preserves anatomy", priority: "recommended" },
      { type: "procedure", name: "Roux-en-Y gastric bypass", details: "Gold standard; 30-35% weight loss; malabsorption component", priority: "recommended" },
      { type: "procedure", name: "One-anastomosis gastric bypass", details: "Simpler than RYGB; good results", priority: "optional" },
      { type: "monitoring", name: "Pre-surgical evaluation", details: "Psychological, nutritional, medical clearance", priority: "essential" },
      { type: "monitoring", name: "Post-surgical follow-up", details: "Lifelong monitoring for nutritional deficiencies", priority: "essential" },
    ],
    duration: "Lifelong follow-up",
    expectedOutcome: "25-40% weight loss; remission of T2DM in 60-80%",
    nextStepId: null,
  },
];

// ============================================================
// MEDICATION SELECTION ALGORITHM
// Based on patient profile and comorbidities
// ============================================================

export interface MedicationSelectionCriteria {
  primaryGoal: "weight-loss" | "glycemic-control" | "cv-protection" | "renal-protection" | "combination";
  hasDiabetes: boolean;
  hasCVD: boolean;
  hasCKD: boolean;
  egfr?: number;
  hasHypertension: boolean;
  priorMedications: string[];
  contraindications: string[];
  preferences: {
    injectionVsOral?: "injection" | "oral" | "no-preference";
    frequency?: "daily" | "weekly" | "no-preference";
    weightLossPriority?: "high" | "moderate" | "low";
  };
}

export function selectMedications(criteria: MedicationSelectionCriteria): {
  firstChoice: string[];
  alternatives: string[];
  avoid: string[];
  rationale: string;
} {
  const { primaryGoal, hasDiabetes, hasCVD, hasCKD, preferences } = criteria;

  // Weight loss as primary goal
  if (primaryGoal === "weight-loss") {
    if (preferences.injectionVsOral === "oral") {
      return {
        firstChoice: ["Orlistat"],
        alternatives: ["Naltrexone-Bupropion", "Phentermine-Topiramate"],
        avoid: ["If diabetes: avoid sulfonylureas, insulin (weight gain)"],
        rationale: "Orlistat is the only oral agent with established weight loss efficacy. Widely available.",
      };
    }

    if (preferences.weightLossPriority === "high") {
      return {
        firstChoice: ["Tirzepatide (Zepbound)", "Semaglutide (Wegovy)"],
        alternatives: ["Liraglutide (Saxenda)", "Phentermine-Topiramate"],
        avoid: ["Orlistat (lower efficacy)"],
        rationale: "GLP-1/GIP agents provide superior weight loss (15-22%).",
      };
    }

    return {
      firstChoice: ["Semaglutide (Wegovy)", "Tirzepatide (Zepbound)"],
      alternatives: ["Liraglutide (Saxenda)", "Naltrexone-Bupropion"],
      avoid: [],
      rationale: "Weekly injectable GLP-1 agents are first-line for pharmacological weight management.",
    };
  }

  // Diabetes with weight considerations
  if (hasDiabetes) {
    if (hasCVD || hasCKD) {
      return {
        firstChoice: ["GLP-1 RA (Semaglutide)", "SGLT2 inhibitor", "Dual agonist (Tirzepatide)"],
        alternatives: ["Metformin + GLP-1 RA"],
        avoid: ["Sulfonylureas", "Pioglitazone", "Insulin (if alternatives available)"],
        rationale: "SGLT2i and GLP-1 RA provide cardiometabolic and renal benefits beyond glucose lowering.",
      };
    }

    return {
      firstChoice: ["Metformin + GLP-1 RA", "Tirzepatide"],
      alternatives: ["Metformin + SGLT2i", "Triple therapy"],
      avoid: ["Sulfonylureas (if weight is priority)"],
      rationale: "Metformin + GLP-1 based therapy provides optimal glycemic control with weight loss.",
    };
  }

  // Default for uncomplicated obesity
  return {
    firstChoice: ["Semaglutide (Wegovy)", "Tirzepatide (Zepbound)"],
    alternatives: ["Liraglutide (Saxenda)", "Orlistat", "Naltrexone-Bupropion"],
    avoid: [],
    rationale: "Weekly injectable GLP-1 agents provide best balance of efficacy and tolerability.",
  };
}

// ============================================================
// MONITORING SCHEDULES
// ============================================================

export const MONITORING_SCHEDULES = {
  lifestyleOnly: {
    weight: "Every 4 weeks × 3 months, then monthly",
    waist: "Every 3 months",
    labs: "Baseline and every 3 months (glucose, lipids, liver)",
    bp: "Every visit",
  },
  withPharmacotherapy: {
    weight: "Every 2-4 weeks × 3 months, then monthly",
    waist: "Every 3 months",
    labs: "Baseline, then every 4-12 weeks depending on medication",
    bp: "Every visit; home monitoring recommended",
    medicationSpecific: {
      orlistat: "Fat-soluble vitamins at 3 months; liver enzymes if symptoms",
      glp1: "No routine labs; monitor GI side effects",
      phentermine: "Heart rate, BP every 2 weeks",
      topiramate: "Cognitive assessment; pregnancy test",
    },
  },
  postBariatric: {
    immediate: "Weekly × 4 weeks",
    shortTerm: "Monthly × 6 months",
    longTerm: "Every 3-6 months lifelong",
    labs: "Micronutrients every 3-6 months; B12, D, iron, folate, thiamine",
  },
};

// ============================================================
// SPECIAL POPULATIONS
// ============================================================

export const SPECIAL_POPULATIONS = {
  southAsian: {
    bmiThreshold: 23,
    waistThresholds: { male: 90, female: 80 },
    notes: [
      "Higher visceral adiposity at lower BMI",
      "Earlier diabetes risk (BMI 23-25)",
      "Consider statins at lower risk threshold",
      "Bariatric surgery: BMI ≥32.5 with comorbidities",
      "Carbohydrate quality important (low GI)",
    ],
  },
  elderly: {
    considerations: [
      "Higher risk of sarcopenic obesity",
      "Target weight loss: 5-10% (not higher)",
      "Avoid aggressive caloric restriction",
      "Emphasize protein intake (1.0-1.2 g/kg)",
      "Resistance training essential",
      "Monitor for frailty",
    ],
  },
  pregnancy: {
    contraindications: [
      "All anti-obesity medications contraindicated",
      "ACEi/ARB contraindicated",
      "Statins contraindicated",
    ],
    recommendations: [
      "Gestational weight gain per IOM guidelines",
      "Insulin for diabetes management",
      "Labetalol, methyldopa, nifedipine for HTN",
      "Metformin considered safe (though insulin preferred)",
    ],
  },
  adolescents: {
    thresholds: {
      obesity: "≥95th percentile or BMI ≥30",
      severe: "≥120% of 95th percentile or BMI ≥35",
    },
    medications: [
      "Orlistat (≥12 years)",
      "Liraglutide 3.0mg (≥12 years)",
      "Semaglutide 2.4mg (≥12 years - Wegovy)",
    ],
    surgery: "Consider if BMI ≥35 with comorbidities and Tanner stage 4+",
  },
};
