/**
 * AHA PREVENT Equations — 10-Year ASCVD Risk (Base Model)
 *
 * Coefficients extracted from the official `preventr` R package (v0.11.0, CRAN)
 * which implements: Khan SS et al. Development and Validation of the American
 * Heart Association's PREVENT Equations. Circulation. 2024;149(6):430-449.
 *
 * The base model uses a logistic-regression approximation (R² ≥ 0.99) with
 * sex-specific coefficients. Centered at: age 55, non-HDL-C 3.5 mmol/L,
 * HDL-C 1.3 mmol/L, SBP 130 mmHg, BMI 25 kg/m², eGFR 90 mL/min/1.73 m².
 */

// Term order for the 23-element coefficient vector (10-year base model):
// 0  age              = (age - 55) / 10
// 1  non_hdl_c        = (TC - HDL in mmol/L) - 3.5
// 2  hdl_c            = ((HDL in mmol/L) - 1.3) / 0.3
// 3  sbp_lt_110       = (min(sbp,110) - 110) / 20
// 4  sbp_gte_110      = (max(sbp,110) - 130) / 20
// 5  dm               = 0 or 1
// 6  smoking          = 0 or 1
// 7  bmi_lt_30        = (min(bmi,30) - 25) / 5
// 8  bmi_gte_30       = (max(bmi,30) - 30) / 5
// 9  egfr_lt_60       = (min(egfr,60) - 60) / -15
// 10 egfr_gte_60      = (max(egfr,60) - 90) / -15
// 11 bp_tx            = 0 or 1
// 12 statin           = 0 or 1
// 13 bp_tx_sbp_gte110 = bp_tx × sbp_gte_110
// 14 statin_non_hdl_c = statin × non_hdl_c
// 15 age_non_hdl_c    = age × non_hdl_c
// 16 age_hdl_c        = age × hdl_c
// 17 age_sbp_gte_110  = age × sbp_gte_110
// 18 age_dm           = age × dm
// 19 age_smoking      = age × smoking
// 20 age_bmi_gte_30   = age × bmi_gte_30
// 21 age_egfr_lt_60   = age × egfr_lt_60
// 22 constant         = 1

const FEMALE_ASCVD_10YR: number[] = [
  0.719883, 0.117697, -0.151185, -0.083536, 0.359285,
  0.834858, 0.483108, 0.0, 0.0, 0.486462, 0.039778,
  0.226531, -0.059237, -0.039576, 0.084442, -0.056784,
  0.032569, -0.103598, -0.241754, -0.079114, 0.0,
  -0.167149, -3.819975,
];

const MALE_ASCVD_10YR: number[] = [
  0.709985, 0.165866, -0.114429, -0.283721, 0.323998,
  0.71896, 0.395697, 0.0, 0.0, 0.369007, 0.020362,
  0.203652, -0.086558, -0.032292, 0.114563, -0.03,
  0.023275, -0.092702, -0.201852, -0.097053, 0.0,
  -0.121708, -3.500655,
];

function mgdlToMmol(mgdl: number): number {
  return mgdl * 0.02586;
}

export interface PreventInput {
  age: number;       // 30–79
  sex: "male" | "female";
  sbp: number;       // 90–180 mmHg
  bpMed: boolean;
  totalChol: number; // mg/dL (130–320)
  hdl: number;       // mg/dL (20–100)
  statin: boolean;
  diabetes: boolean;
  smoking: boolean;
  egfr: number;      // 15–140
  bmi: number;       // 18.5–39.9
}

export interface PreventResult {
  risk10yr: number;   // 0–1 (proportion)
  riskPct: string;    // e.g. "9.2"
  category: "Low" | "Borderline" | "Intermediate" | "High";
  nextSteps: string[];
  valid: boolean;
  warnings: string[];
}

function validateInput(p: PreventInput): string[] {
  const w: string[] = [];
  if (p.age < 30 || p.age > 79) w.push("Age must be 30–79 y");
  if (p.sbp < 90 || p.sbp > 180) w.push("SBP must be 90–180 mmHg");
  if (p.totalChol < 130 || p.totalChol > 320) w.push("Total cholesterol must be 130–320 mg/dL");
  if (p.hdl < 20 || p.hdl > 100) w.push("HDL-C must be 20–100 mg/dL");
  if (p.egfr < 15 || p.egfr > 140) w.push("eGFR must be 15–140 mL/min/1.73m²");
  if (p.bmi < 18.5 || p.bmi > 39.9) w.push("BMI must be 18.5–39.9 kg/m²");
  return w;
}

export function calculatePrevent(p: PreventInput): PreventResult {
  const warnings = validateInput(p);
  if (warnings.length > 0) {
    return { risk10yr: NaN, riskPct: "—", category: "Low", nextSteps: [], valid: false, warnings };
  }

  const coefs = p.sex === "female" ? FEMALE_ASCVD_10YR : MALE_ASCVD_10YR;

  // Prepare terms
  const age = (p.age - 55) / 10;
  const nonHdlMmol = mgdlToMmol(p.totalChol - p.hdl) - 3.5;
  const hdlMmol = (mgdlToMmol(p.hdl) - 1.3) / 0.3;
  const sbpLt110 = (Math.min(p.sbp, 110) - 110) / 20;
  const sbpGte110 = (Math.max(p.sbp, 110) - 130) / 20;
  const dm = p.diabetes ? 1 : 0;
  const smoking = p.smoking ? 1 : 0;
  const bmiLt30 = (Math.min(p.bmi, 30) - 25) / 5;
  const bmiGte30 = (Math.max(p.bmi, 30) - 30) / 5;
  const egfrLt60 = (Math.min(p.egfr, 60) - 60) / -15;
  const egfrGte60 = (Math.max(p.egfr, 60) - 90) / -15;
  const bpTx = p.bpMed ? 1 : 0;
  const statin = p.statin ? 1 : 0;

  const terms: number[] = [
    age, nonHdlMmol, hdlMmol, sbpLt110, sbpGte110,
    dm, smoking, bmiLt30, bmiGte30,
    egfrLt60, egfrGte60, bpTx, statin,
    bpTx * sbpGte110,        // bp_tx × sbp_gte_110
    statin * nonHdlMmol,     // statin × non_hdl_c
    age * nonHdlMmol,        // age × non_hdl_c
    age * hdlMmol,           // age × hdl_c
    age * sbpGte110,         // age × sbp_gte_110
    age * dm,                // age × dm
    age * smoking,           // age × smoking
    age * bmiGte30,          // age × bmi_gte_30
    age * egfrLt60,          // age × egfr_lt_60
    1,                       // constant
  ];

  const logOdds = terms.reduce((sum, t, i) => sum + t * coefs[i], 0);
  const risk = Math.exp(logOdds) / (1 + Math.exp(logOdds));
  const riskPct = (risk * 100).toFixed(1);

  // Categorize per ACC/AHA thresholds
  const pct = risk * 100;
  const category: PreventResult["category"] =
    pct >= 20 ? "High" :
    pct >= 7.5 ? "Intermediate" :
    pct >= 5 ? "Borderline" :
    "Low";

  const nextSteps = getNextSteps(pct, category, p);

  return { risk10yr: risk, riskPct, category, nextSteps, valid: true, warnings: [] };
}

function getNextSteps(
  pct: number,
  category: PreventResult["category"],
  p: PreventInput
): string[] {
  const steps: string[] = [];

  if (category === "Low") {
    steps.push("Statin therapy not routinely indicated at this risk level.");
    steps.push("Emphasize heart-healthy lifestyle: diet, physical activity, weight management, smoking cessation.");
    steps.push("Reassess ASCVD risk every 4–6 years or if new risk factors develop.");
  }

  if (category === "Borderline") {
    steps.push("Clinician–patient risk discussion recommended before initiating pharmacotherapy.");
    steps.push("Consider risk-enhancing factors: family history of premature ASCVD, Lp(a) ≥50 mg/dL, hsCRP ≥2 mg/L, metabolic syndrome, CKD, inflammatory conditions.");
    steps.push("If risk-enhancing factors present → moderate-intensity statin is reasonable.");
    steps.push("Consider CAC scoring: CAC = 0 supports deferring statin; CAC ≥100 or ≥75th percentile favors statin initiation.");
    steps.push("Reinforce lifestyle modifications at every visit.");
  }

  if (category === "Intermediate") {
    steps.push("Moderate- to high-intensity statin is generally indicated (LDL-C reduction ≥30–50%).");
    steps.push("If uncertain or patient hesitant: obtain CAC score to reclassify risk (CAC = 0 → consider deferral; CAC ≥100 → high-intensity statin).");
    steps.push("Evaluate risk-enhancing factors: Lp(a), ApoB, hsCRP, metabolic syndrome, CKD, premature family history.");
    steps.push("Target LDL-C < 100 mg/dL (or ≥50% reduction from baseline).");
    steps.push("Reassess lipids 4–12 weeks after therapy initiation, then every 3–12 months.");
    if (p.diabetes) {
      steps.push("Diabetes present: initiate at least moderate-intensity statin regardless of 10-year risk; target LDL-C < 70 mg/dL.");
    }
  }

  if (category === "High") {
    steps.push("High-intensity statin therapy indicated (atorvastatin 40–80 mg or rosuvastatin 20–40 mg).");
    steps.push("Target LDL-C < 70 mg/dL (or ≥50% reduction from baseline).");
    steps.push("If LDL-C remains above goal on maximally tolerated statin → add ezetimibe.");
    steps.push("If still above goal → consider PCSK9 inhibitor.");
    steps.push("Optimize all modifiable risk factors: BP < 130/80, HbA1c < 7%, smoking cessation.");
    steps.push("Reassess lipids at 4–12 weeks, then every 3–12 months to verify adherence and goal attainment.");
    if (p.diabetes) {
      steps.push("Diabetes at high risk: treat as secondary prevention equivalent — target LDL-C < 70 mg/dL; consider < 55 mg/dL if additional risk factors.");
    }
  }

  // Universal risk factor notes
  if (p.smoking) {
    steps.push("Active smoker: smoking cessation is the single most impactful lifestyle intervention — consider pharmacotherapy (varenicline, NRT, bupropion).");
  }
  if (p.egfr < 60) {
    steps.push("CKD (eGFR < 60): contributes independently to CVD risk — ensure nephroprotection with SGLT2i or finerenone if indicated.");
  }
  if (p.bmi >= 30) {
    steps.push("Obesity (BMI ≥ 30): recommend structured weight management program; GLP-1 RA may provide cardiometabolic benefit.");
  }

  return steps;
}
