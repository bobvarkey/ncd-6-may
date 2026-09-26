import { PatientData, getCKDStage } from "./patient-data";

// ============================================================
// ADA 2026 COMPLETE MEDICATION DATABASE
// Priorities-first approach: CV/Kidney → Weight → Glycemic
// ============================================================

export interface MedRecommendation {
  drug: string;
  genericName: string;
  drugClass: DrugClass;
  dose: string;
  frequency: string;
  reason: string;
  priority: "first-line" | "add-on" | "adjustment" | "intensification" | "de-escalate" | "emergency";
  category: AlgorithmPriority;
  warnings: string[];
  contraindications: string[];
  adaReference: string;
  hba1cReduction: string;
  cvBenefit: boolean;
  renalBenefit: boolean;
  weightEffect: "loss" | "neutral" | "gain";
  clinicalExplanation?: string;
  lifestyleComplement?: LifestyleComplement;
}

export type DrugClass =
  | "biguanide"
  | "sglt2i"
  | "glp1ra"
  | "dpp4i"
  | "sulfonylurea"
  | "tzd"
  | "agi"
  | "meglitinide"
  | "basal-insulin"
  | "prandial-insulin"
  | "premixed-insulin"
  | "dual-agonist"
  | "statin"
  | "ace-arb";

export type AlgorithmPriority = "cvkd-risk" | "weight-management" | "glycemic-control" | "lipid" | "current-med-review";

export interface HypoProtocol {
  trigger: string;
  immediate: string[];
  followUp: string[];
}

// ============================================================
// DRUG DATABASE — All ADA 2026 approved medications
// ============================================================

interface DrugProfile {
  name: string;
  generic: string;
  class: DrugClass;
  doses: { label: string; dose: string; frequency: string; condition?: string }[];
  hba1cReduction: string;
  cvBenefit: boolean;
  renalBenefit: boolean;
  weightEffect: "loss" | "neutral" | "gain";
  hypoRisk: "low" | "moderate" | "high";
  minEGFR: number;
  renalDoseAdjust?: { eGFRRange: [number, number]; dose: string; frequency: string }[];
  contraindications: string[];
  sideEffects: string[];
  adaReference: string;
  dosageFrequency: "OD" | "BD" | "TDS" | "QID" | "Weekly" | "Variable";
}

const DRUG_DB: DrugProfile[] = [
  // === BIGUANIDE ===
  {
    name: "Metformin (Glucophage)",
    generic: "Metformin",
    class: "biguanide",
    doses: [
      { label: "Start", dose: "500mg", frequency: "OD with dinner" },
      { label: "Titrate", dose: "500mg", frequency: "BD (week 2)" },
      { label: "Target", dose: "1000mg", frequency: "BD (max 2550mg/day)" },
    ],
    hba1cReduction: "1.0-1.5%",
    cvBenefit: false,
    renalBenefit: false,
    weightEffect: "neutral",
    hypoRisk: "low",
    minEGFR: 30,
    dosageFrequency: "BD",
    renalDoseAdjust: [
      { eGFRRange: [30, 45], dose: "500mg", frequency: "BD (max 1000mg/day)" },
    ],
    contraindications: ["eGFR <30", "Acute/chronic metabolic acidosis", "Severe hepatic impairment"],
    sideEffects: ["GI (diarrhea, nausea)", "B12 deficiency (monitor annually)", "Lactic acidosis (rare)"],
    adaReference: "ADA 2026 §9.2 – Metformin as foundational therapy",
  },

  // === GLP-1 RECEPTOR AGONISTS ===
  {
    name: "Semaglutide (Ozempic)",
    generic: "Semaglutide",
    class: "glp1ra",
    doses: [
      { label: "Start", dose: "0.25mg", frequency: "Weekly SC × 4 weeks" },
      { label: "Step-up", dose: "0.5mg", frequency: "Weekly SC × 4 weeks" },
      { label: "Target", dose: "1.0mg", frequency: "Weekly SC" },
      { label: "Max", dose: "2.0mg", frequency: "Weekly SC" },
    ],
    hba1cReduction: "1.5-2.0%",
    cvBenefit: true,
    renalBenefit: true,
    weightEffect: "loss",
    hypoRisk: "low",
    minEGFR: 15,
    dosageFrequency: "Weekly",
    contraindications: ["Personal/family history of MTC", "MEN2 syndrome", "Pancreatitis history"],
    sideEffects: ["Nausea, vomiting (dose-dependent)", "Diarrhea", "Injection site reactions", "Gallbladder disease"],
    adaReference: "ADA 2026 §9.3 – GLP-1 RA proven CV benefit (SUSTAIN-6, SELECT)",
  },
  {
    name: "Liraglutide (Victoza)",
    generic: "Liraglutide",
    class: "glp1ra",
    doses: [
      { label: "Start", dose: "0.6mg", frequency: "Daily SC × 1 week" },
      { label: "Step-up", dose: "1.2mg", frequency: "Daily SC" },
      { label: "Target", dose: "1.8mg", frequency: "Daily SC" },
    ],
    hba1cReduction: "1.0-1.5%",
    cvBenefit: true,
    renalBenefit: true,
    weightEffect: "loss",
    hypoRisk: "low",
    minEGFR: 15,
    dosageFrequency: "OD",
    contraindications: ["Personal/family history of MTC", "MEN2 syndrome"],
    sideEffects: ["Nausea, vomiting", "Diarrhea", "Pancreatitis (rare)"],
    adaReference: "ADA 2026 §9.3 – GLP-1 RA proven CV benefit (LEADER)",
  },
  {
    name: "Dulaglutide (Trulicity)",
    generic: "Dulaglutide",
    class: "glp1ra",
    doses: [
      { label: "Start", dose: "0.75mg", frequency: "Weekly SC" },
      { label: "Target", dose: "1.5mg", frequency: "Weekly SC" },
      { label: "Max", dose: "4.5mg", frequency: "Weekly SC" },
    ],
    hba1cReduction: "1.2-1.6%",
    cvBenefit: true,
    renalBenefit: true,
    weightEffect: "loss",
    hypoRisk: "low",
    minEGFR: 15,
    dosageFrequency: "Weekly",
    contraindications: ["Personal/family history of MTC", "MEN2 syndrome"],
    sideEffects: ["Nausea, diarrhea", "Abdominal pain", "Injection site reactions"],
    adaReference: "ADA 2026 §9.3 – GLP-1 RA proven CV benefit (REWIND)",
  },
  {
    name: "Exenatide ER (Bydureon)",
    generic: "Exenatide",
    class: "glp1ra",
    doses: [
      { label: "Standard", dose: "2mg", frequency: "Weekly SC" },
    ],
    hba1cReduction: "0.8-1.3%",
    cvBenefit: false,
    renalBenefit: false,
    weightEffect: "loss",
    hypoRisk: "low",
    minEGFR: 45,
    dosageFrequency: "Weekly",
    contraindications: ["eGFR <45", "Personal/family MTC history"],
    sideEffects: ["Nausea", "Injection site nodules", "Diarrhea"],
    adaReference: "ADA 2026 §9.3 – GLP-1 RA (EXSCEL – neutral CV)",
  },

  // === DUAL GIP/GLP-1 AGONIST ===
  {
    name: "Tirzepatide (Mounjaro)",
    generic: "Tirzepatide",
    class: "dual-agonist",
    doses: [
      { label: "Start", dose: "2.5mg", frequency: "Weekly SC × 4 weeks" },
      { label: "Step-up 1", dose: "5mg", frequency: "Weekly SC × 4 weeks" },
      { label: "Step-up 2", dose: "7.5mg", frequency: "Weekly SC" },
      { label: "Step-up 3", dose: "10mg", frequency: "Weekly SC" },
      { label: "Max", dose: "15mg", frequency: "Weekly SC" },
    ],
    hba1cReduction: "2.0-2.6%",
    cvBenefit: true,
    renalBenefit: true,
    weightEffect: "loss",
    hypoRisk: "low",
    minEGFR: 15,
    dosageFrequency: "Weekly",
    contraindications: ["Personal/family history of MTC", "MEN2 syndrome", "Pancreatitis history"],
    sideEffects: ["Nausea, vomiting (dose-dependent)", "Diarrhea, constipation", "Decreased appetite", "Gallbladder events"],
    adaReference: "ADA 2026 §9.3 – GIP/GLP-1 dual agonist, very high efficacy (SURPASS, SURMOUNT)",
  },

  // === SGLT2 INHIBITORS ===
  {
    name: "Empagliflozin (Jardiance)",
    generic: "Empagliflozin",
    class: "sglt2i",
    doses: [
      { label: "Start", dose: "10mg", frequency: "Once daily morning" },
      { label: "Max", dose: "25mg", frequency: "Once daily morning" },
    ],
    hba1cReduction: "0.7-1.0%",
    cvBenefit: true,
    renalBenefit: true,
    weightEffect: "loss",
    hypoRisk: "low",
    minEGFR: 20,
    dosageFrequency: "OD",
    contraindications: ["eGFR <20", "Recurrent UTI/genital mycotic infections", "Type 1 DM"],
    sideEffects: ["Genital mycotic infections", "UTI", "Volume depletion", "Euglycemic DKA (rare)"],
    adaReference: "ADA 2026 §9.4 – SGLT2i proven CV+renal benefit (EMPA-REG, EMPEROR)",
  },
  {
    name: "Dapagliflozin (Farxiga)",
    generic: "Dapagliflozin",
    class: "sglt2i",
    doses: [
      { label: "Start", dose: "5mg", frequency: "Once daily morning" },
      { label: "Max", dose: "10mg", frequency: "Once daily morning" },
    ],
    hba1cReduction: "0.7-1.0%",
    cvBenefit: true,
    renalBenefit: true,
    weightEffect: "loss",
    hypoRisk: "low",
    minEGFR: 20,
    dosageFrequency: "OD",
    contraindications: ["eGFR <20", "Recurrent UTI", "Type 1 DM"],
    sideEffects: ["Genital infections", "Polyuria", "Hypotension risk", "Euglycemic DKA"],
    adaReference: "ADA 2026 §9.4 – SGLT2i proven CV+renal benefit (DECLARE, DAPA-CKD, DAPA-HF)",
  },
  {
    name: "Canagliflozin (Invokana)",
    generic: "Canagliflozin",
    class: "sglt2i",
    doses: [
      { label: "Start", dose: "100mg", frequency: "Once daily before breakfast" },
      { label: "Max", dose: "300mg", frequency: "Once daily" },
    ],
    hba1cReduction: "0.7-1.2%",
    cvBenefit: true,
    renalBenefit: true,
    weightEffect: "loss",
    hypoRisk: "low",
    minEGFR: 30,
    dosageFrequency: "OD",
    renalDoseAdjust: [
      { eGFRRange: [30, 60], dose: "100mg", frequency: "Once daily (max)" },
    ],
    contraindications: ["eGFR <30", "History of amputation (caution)", "Type 1 DM"],
    sideEffects: ["Genital mycotic infections", "Amputation risk (monitor feet)", "Bone fracture risk"],
    adaReference: "ADA 2026 §9.4 – SGLT2i (CANVAS, CREDENCE)",
  },

  // === DPP-4 INHIBITORS ===
  {
    name: "Sitagliptin (Januvia)",
    generic: "Sitagliptin",
    class: "dpp4i",
    doses: [
      { label: "Standard", dose: "100mg", frequency: "Once daily" },
    ],
    hba1cReduction: "0.5-0.8%",
    cvBenefit: false,
    renalBenefit: false,
    weightEffect: "neutral",
    hypoRisk: "low",
    minEGFR: 0,
    dosageFrequency: "OD",
    renalDoseAdjust: [
      { eGFRRange: [30, 50], dose: "50mg", frequency: "Once daily" },
      { eGFRRange: [0, 30], dose: "25mg", frequency: "Once daily" },
    ],
    contraindications: ["History of pancreatitis with DPP-4i", "Concurrent GLP-1 RA use (no added benefit)"],
    sideEffects: ["Nasopharyngitis", "Headache", "Pancreatitis (rare)", "Joint pain"],
    adaReference: "ADA 2026 §9.2 – DPP-4i intermediate efficacy, renal-safe with dose adjustment",
  },
  {
    name: "Linagliptin (Trajenta)",
    generic: "Linagliptin",
    class: "dpp4i",
    doses: [
      { label: "Standard", dose: "5mg", frequency: "Once daily" },
    ],
    hba1cReduction: "0.5-0.7%",
    cvBenefit: false,
    renalBenefit: false,
    weightEffect: "neutral",
    hypoRisk: "low",
    minEGFR: 0,
    dosageFrequency: "OD",
    contraindications: ["Concurrent GLP-1 RA", "History of pancreatitis with DPP-4i"],
    sideEffects: ["Nasopharyngitis", "Cough", "Pancreatitis (rare)"],
    adaReference: "ADA 2026 §9.2 – DPP-4i, NO renal dose adjustment needed (biliary excretion)",
  },
  {
    name: "Vildagliptin (Galvus)",
    generic: "Vildagliptin",
    class: "dpp4i",
    doses: [
      { label: "Standard", dose: "50mg", frequency: "BD" },
    ],
    hba1cReduction: "0.5-0.9%",
    cvBenefit: false,
    renalBenefit: false,
    weightEffect: "neutral",
    hypoRisk: "low",
    minEGFR: 0,
    dosageFrequency: "BD",
    renalDoseAdjust: [
      { eGFRRange: [0, 50], dose: "50mg", frequency: "Once daily" },
    ],
    contraindications: ["Hepatic impairment", "Concurrent GLP-1 RA"],
    sideEffects: ["Headache", "Dizziness", "Peripheral edema", "Hepatotoxicity (rare, check LFT)"],
    adaReference: "ADA 2026 §9.2 – DPP-4i, popular in Asian markets",
  },
  {
    name: "Saxagliptin (Onglyza)",
    generic: "Saxagliptin",
    class: "dpp4i",
    doses: [
      { label: "Standard", dose: "5mg", frequency: "Once daily" },
    ],
    hba1cReduction: "0.5-0.7%",
    cvBenefit: false,
    renalBenefit: false,
    weightEffect: "neutral",
    hypoRisk: "low",
    minEGFR: 0,
    dosageFrequency: "OD",
    renalDoseAdjust: [
      { eGFRRange: [0, 45], dose: "2.5mg", frequency: "Once daily" },
    ],
    contraindications: ["Heart failure (increased HF hospitalization – SAVOR-TIMI)", "Concurrent GLP-1 RA"],
    sideEffects: ["UTI", "Headache", "HF risk (caution)"],
    adaReference: "ADA 2026 §9.2 – DPP-4i, ⚠ AVOID in HF (SAVOR-TIMI 53)",
  },

  // === SULFONYLUREAS ===
  {
    name: "Glimepiride (Amaryl)",
    generic: "Glimepiride",
    class: "sulfonylurea",
    doses: [
      { label: "Start", dose: "1mg", frequency: "Once daily with breakfast" },
      { label: "Titrate", dose: "2mg", frequency: "Once daily" },
      { label: "Max", dose: "4mg", frequency: "Once daily" },
    ],
    hba1cReduction: "1.0-1.5%",
    cvBenefit: false,
    renalBenefit: false,
    weightEffect: "gain",
    hypoRisk: "high",
    minEGFR: 0,
    dosageFrequency: "OD",
    renalDoseAdjust: [
      { eGFRRange: [0, 30], dose: "1mg", frequency: "Once daily (use with extreme caution)" },
    ],
    contraindications: ["Severe hepatic insufficiency", "G6PD deficiency (some)"],
    sideEffects: ["Hypoglycemia (HIGH risk)", "Weight gain (2-3 kg)", "Rash"],
    adaReference: "ADA 2026 §9.2 – SU high efficacy but hypoglycemia+weight gain risk",
  },
  {
    name: "Gliclazide MR (Diamicron MR)",
    generic: "Gliclazide",
    class: "sulfonylurea",
    doses: [
      { label: "Start", dose: "30mg", frequency: "Once daily with breakfast" },
      { label: "Titrate", dose: "60mg", frequency: "Once daily" },
      { label: "Max", dose: "120mg", frequency: "Once daily" },
    ],
    hba1cReduction: "1.0-1.5%",
    cvBenefit: false,
    renalBenefit: false,
    weightEffect: "gain",
    hypoRisk: "moderate",
    minEGFR: 0,
    dosageFrequency: "OD",
    renalDoseAdjust: [
      { eGFRRange: [0, 30], dose: "30mg", frequency: "Once daily (caution)" },
    ],
    contraindications: ["Severe hepatic impairment", "Type 1 DM"],
    sideEffects: ["Hypoglycemia (lower than glimepiride)", "Weight gain", "GI upset"],
    adaReference: "ADA 2026 §9.2 – Preferred SU (lower hypo risk vs. glimepiride, ADVANCE trial)",
  },
  {
    name: "Glipizide (Glucotrol)",
    generic: "Glipizide",
    class: "sulfonylurea",
    doses: [
      { label: "Start", dose: "5mg", frequency: "Once daily 30min before breakfast" },
      { label: "Max", dose: "20mg", frequency: "BD (divided)" },
    ],
    hba1cReduction: "1.0-1.5%",
    cvBenefit: false,
    renalBenefit: false,
    weightEffect: "gain",
    hypoRisk: "high",
    minEGFR: 0,
    dosageFrequency: "BD",
    contraindications: ["Severe renal impairment (prefer gliclazide)"],
    sideEffects: ["Hypoglycemia", "Weight gain", "GI disturbance"],
    adaReference: "ADA 2026 §9.2 – SU, shorter acting",
  },
  {
    name: "Glyburide (Diabeta/Glynase)",
    generic: "Glyburide",
    class: "sulfonylurea",
    doses: [
      { label: "Start", dose: "2.5mg", frequency: "Once daily with breakfast" },
      { label: "Titrate", dose: "5mg", frequency: "Once daily" },
      { label: "Max", dose: "10mg", frequency: "BD (20mg/day)" },
    ],
    hba1cReduction: "1.0-1.5%",
    cvBenefit: false,
    renalBenefit: false,
    weightEffect: "gain",
    hypoRisk: "high",
    minEGFR: 30,
    dosageFrequency: "BD",
    contraindications: ["eGFR <30", "Severe hepatic insufficiency", "Elderly (high hypo risk)"],
    sideEffects: ["Hypoglycemia (HIGHEST among SUs)", "Weight gain (2-4 kg)", "Nausea"],
    adaReference: "ADA 2026 §9.2 – SU, longest acting — higher hypo risk, avoid in elderly/CKD",
  },

  // === THIAZOLIDINEDIONES (TZDs) ===
  {
    name: "Pioglitazone (Actos)",
    generic: "Pioglitazone",
    class: "tzd",
    doses: [
      { label: "Start", dose: "15mg", frequency: "Once daily" },
      { label: "Target", dose: "30mg", frequency: "Once daily" },
      { label: "Max", dose: "45mg", frequency: "Once daily" },
    ],
    hba1cReduction: "1.0-1.5%",
    cvBenefit: true,
    renalBenefit: false,
    weightEffect: "gain",
    hypoRisk: "low",
    minEGFR: 0,
    dosageFrequency: "OD",
    contraindications: ["NYHA III-IV heart failure", "Active bladder cancer", "Hepatic disease"],
    sideEffects: ["Weight gain (2-5 kg)", "Edema", "Bone fractures (women)", "Bladder cancer concern", "HF exacerbation"],
    adaReference: "ADA 2026 §9.2 – TZD, proven CV benefit (PROactive) but HF/weight concerns",
  },

  // === ALPHA-GLUCOSIDASE INHIBITORS ===
  {
    name: "Voglibose (Volix)",
    generic: "Voglibose",
    class: "agi",
    doses: [
      { label: "Standard", dose: "0.2mg", frequency: "TDS (before meals)" },
      { label: "Max", dose: "0.3mg", frequency: "TDS" },
    ],
    hba1cReduction: "0.5-0.8%",
    cvBenefit: false,
    renalBenefit: false,
    weightEffect: "neutral",
    hypoRisk: "low",
    minEGFR: 0,
    dosageFrequency: "TDS",
    contraindications: ["Inflammatory bowel disease", "Intestinal obstruction", "Hepatic cirrhosis"],
    sideEffects: ["Flatulence", "Diarrhea", "Abdominal discomfort"],
    adaReference: "ADA 2026 §9.2 – AGI, popular in Asia for post-prandial glucose",
  },
  {
    name: "Acarbose (Glucobay)",
    generic: "Acarbose",
    class: "agi",
    doses: [
      { label: "Start", dose: "25mg", frequency: "TDS (with first bite)" },
      { label: "Target", dose: "50mg", frequency: "TDS" },
      { label: "Max", dose: "100mg", frequency: "TDS" },
    ],
    hba1cReduction: "0.5-0.8%",
    cvBenefit: false,
    renalBenefit: false,
    weightEffect: "neutral",
    hypoRisk: "low",
    minEGFR: 25,
    dosageFrequency: "TDS",
    contraindications: ["eGFR <25", "IBD", "Intestinal obstruction"],
    sideEffects: ["Flatulence (common)", "Diarrhea", "Elevated LFT (rare)"],
    adaReference: "ADA 2026 §9.2 – AGI for post-prandial glucose",
  },
  {
    name: "Miglitol (Glyset)",
    generic: "Miglitol",
    class: "agi",
    doses: [
      { label: "Start", dose: "25mg", frequency: "TDS (with first bite)" },
      { label: "Target", dose: "50mg", frequency: "TDS" },
      { label: "Max", dose: "100mg", frequency: "TDS" },
    ],
    hba1cReduction: "0.5-0.8%",
    cvBenefit: false,
    renalBenefit: false,
    weightEffect: "neutral",
    hypoRisk: "low",
    minEGFR: 25,
    dosageFrequency: "TDS",
    contraindications: ["eGFR <25", "IBD", "Intestinal obstruction", "Diabetic ketoacidosis"],
    sideEffects: ["Flatulence", "Diarrhea", "Abdominal pain", "Skin rash (rare)"],
    adaReference: "ADA 2026 §9.2 – AGI, systemically absorbed unlike acarbose",
  },

  // === MEGLITINIDES ===
  {
    name: "Repaglinide (NovoNorm)",
    generic: "Repaglinide",
    class: "meglitinide",
    doses: [
      { label: "Start", dose: "0.5mg", frequency: "TDS (before meals)" },
      { label: "Target", dose: "1mg", frequency: "TDS" },
      { label: "Max", dose: "4mg", frequency: "TDS (16mg/day)" },
    ],
    hba1cReduction: "0.5-1.0%",
    cvBenefit: false,
    renalBenefit: false,
    weightEffect: "gain",
    hypoRisk: "moderate",
    minEGFR: 0,
    dosageFrequency: "TDS",
    contraindications: ["Severe hepatic impairment", "Co-administration with gemfibrozil"],
    sideEffects: ["Hypoglycemia (less than SU)", "Weight gain", "Upper respiratory infection"],
    adaReference: "ADA 2026 §9.2 – Meglitinide, flexible meal-time dosing",
  },
  {
    name: "Nateglinide (Starlix)",
    generic: "Nateglinide",
    class: "meglitinide",
    doses: [
      { label: "Start", dose: "60mg", frequency: "TDS (1-30 min before meals)" },
      { label: "Target", dose: "120mg", frequency: "TDS (before meals)" },
    ],
    hba1cReduction: "0.5-0.8%",
    cvBenefit: false,
    renalBenefit: false,
    weightEffect: "gain",
    hypoRisk: "moderate",
    minEGFR: 0,
    dosageFrequency: "TDS",
    renalDoseAdjust: [
      { eGFRRange: [0, 30], dose: "60mg", frequency: "TDS (use with caution)" },
    ],
    contraindications: ["Type 1 DM", "Diabetic ketoacidosis"],
    sideEffects: ["Hypoglycemia (less than SU)", "Weight gain", "Dizziness", "Upper respiratory infection"],
    adaReference: "ADA 2026 §9.2 – Meglitinide, rapid onset/short duration, ideal for irregular meals",
  },

  // === BASAL INSULIN ===
  {
    name: "Insulin Glargine U-100 (Lantus/Basaglar)",
    generic: "Insulin Glargine",
    class: "basal-insulin",
    doses: [
      { label: "Start", dose: "10 units or 0.1-0.2 U/kg", frequency: "Once daily (bedtime or morning)" },
      { label: "Titrate", dose: "+2 units q3 days", frequency: "Until FBG 80-130" },
    ],
    hba1cReduction: "1.5-3.5%",
    cvBenefit: false,
    renalBenefit: false,
    weightEffect: "gain",
    hypoRisk: "moderate",
    minEGFR: 0,
    dosageFrequency: "OD",
    contraindications: ["Hypoglycemia unawareness (caution)"],
    sideEffects: ["Hypoglycemia", "Weight gain (2-4 kg)", "Injection site reactions", "Lipodystrophy"],
    adaReference: "ADA 2026 §9.5 – Basal insulin, stepwise intensification",
  },
  {
    name: "Insulin Degludec (Tresiba)",
    generic: "Insulin Degludec",
    class: "basal-insulin",
    doses: [
      { label: "Start", dose: "10 units", frequency: "Once daily (any time, consistent)" },
      { label: "Titrate", dose: "+2 units q3 days", frequency: "Until FBG 80-130" },
    ],
    hba1cReduction: "1.5-3.5%",
    cvBenefit: false,
    renalBenefit: false,
    weightEffect: "gain",
    hypoRisk: "low",
    minEGFR: 0,
    dosageFrequency: "OD",
    contraindications: [],
    sideEffects: ["Hypoglycemia (lower vs. glargine)", "Weight gain", "Injection site reactions"],
    adaReference: "ADA 2026 §9.5 – Ultra-long acting, lower nocturnal hypo (DEVOTE)",
  },

  // === PRANDIAL INSULIN ===
  {
    name: "Insulin Aspart (NovoRapid)",
    generic: "Insulin Aspart",
    class: "prandial-insulin",
    doses: [
      { label: "Start", dose: "4 units or 10% of basal", frequency: "Before largest meal" },
      { label: "Titrate", dose: "+1-2 units q3 days", frequency: "Based on post-meal BG" },
    ],
    hba1cReduction: "1.0-2.0% (added to basal)",
    cvBenefit: false,
    renalBenefit: false,
    weightEffect: "gain",
    hypoRisk: "high",
    minEGFR: 0,
    dosageFrequency: "Variable",
    contraindications: [],
    sideEffects: ["Hypoglycemia", "Weight gain", "Requires BG monitoring"],
    adaReference: "ADA 2026 §9.5 – Basal-bolus intensification",
  },

  // === PREMIXED INSULIN ===
  {
    name: "Insulin 70/30 (Mixtard/Novolin 70/30)",
    generic: "NPH/Regular 70/30",
    class: "premixed-insulin",
    doses: [
      { label: "Start", dose: "10-12 units", frequency: "BD (before breakfast & dinner)" },
      { label: "Titrate", dose: "+2 units q3 days", frequency: "Based on FBG & pre-dinner BG" },
    ],
    hba1cReduction: "1.5-2.5%",
    cvBenefit: false,
    renalBenefit: false,
    weightEffect: "gain",
    hypoRisk: "high",
    minEGFR: 0,
    dosageFrequency: "BD",
    contraindications: ["Erratic meal patterns"],
    sideEffects: ["Hypoglycemia", "Weight gain", "Requires consistent meals"],
    adaReference: "ADA 2026 §9.5 – Premixed, less flexible but simpler regimen",
  },

  // === ADDITIONAL SGLT2 INHIBITORS ===
  {
    name: "Ertugliflozin (Steglatro)",
    generic: "Ertugliflozin",
    class: "sglt2i",
    doses: [
      { label: "Start", dose: "5mg", frequency: "Once daily morning" },
      { label: "Max", dose: "15mg", frequency: "Once daily morning" },
    ],
    hba1cReduction: "0.6-0.9%",
    cvBenefit: true,
    renalBenefit: true,
    weightEffect: "loss",
    hypoRisk: "low",
    minEGFR: 20,
    dosageFrequency: "OD",
    contraindications: ["eGFR <20", "Type 1 DM", "Recurrent UTI"],
    sideEffects: ["Genital infections", "Urinary tract infections", "Volume depletion", "Euglycemic DKA (rare)"],
    adaReference: "ADA 2026 §9.4 – SGLT2i with CV/renal benefit (VERTIS-CV)",
  },

  // === ADDITIONAL DPP-4 INHIBITORS ===
  {
    name: "Alogliptin (Nesina)",
    generic: "Alogliptin",
    class: "dpp4i",
    doses: [
      { label: "Start", dose: "25mg", frequency: "Once daily" },
      { label: "Max", dose: "25mg", frequency: "Once daily" },
    ],
    hba1cReduction: "0.5-0.8%",
    cvBenefit: false,
    renalBenefit: false,
    weightEffect: "neutral",
    hypoRisk: "low",
    minEGFR: 0,
    dosageFrequency: "OD",
    renalDoseAdjust: [
      { eGFRRange: [30, 60], dose: "12.5mg", frequency: "Once daily" },
      { eGFRRange: [0, 30], dose: "6.25mg", frequency: "Once daily" },
    ],
    contraindications: ["History of pancreatitis with DPP-4i", "Concurrent GLP-1 RA"],
    sideEffects: ["Nasopharyngitis", "Headache", "Pancreatitis (rare)"],
    adaReference: "ADA 2026 §9.2 – DPP-4i with renal dose adjustment",
  },

  // === BILE ACID SEQUESTRANT ===
  {
    name: "Colesevelam (Welchol)",
    generic: "Colesevelam",
    class: "agi",
    doses: [
      { label: "Start", dose: "3.75g", frequency: "Once or BD" },
      { label: "Max", dose: "3.75g", frequency: "BD (7.5g/day)" },
    ],
    hba1cReduction: "0.5-1.0%",
    cvBenefit: true,
    renalBenefit: false,
    weightEffect: "neutral",
    hypoRisk: "low",
    minEGFR: 0,
    dosageFrequency: "BD",
    contraindications: ["Bowel obstruction", "Severe triglycerides >500 mg/dL"],
    sideEffects: ["Constipation", "Bloating", "Impaired drug absorption (space medications 4+ hours apart)"],
    adaReference: "ADA 2026 §9.2 – BAS for dual glycemia + lipid reduction",
  },

  // === ADDITIONAL MEGLITINIDE ===
  {
    name: "Mitiglinide (Glufast)",
    generic: "Mitiglinide",
    class: "meglitinide",
    doses: [
      { label: "Start", dose: "10mg", frequency: "TDS (before meals)" },
      { label: "Max", dose: "20mg", frequency: "TDS (before meals)" },
    ],
    hba1cReduction: "0.5-0.8%",
    cvBenefit: false,
    renalBenefit: false,
    weightEffect: "gain",
    hypoRisk: "moderate",
    minEGFR: 0,
    dosageFrequency: "TDS",
    contraindications: ["Type 1 DM", "Diabetic ketoacidosis"],
    sideEffects: ["Hypoglycemia (moderate risk)", "Weight gain", "Dizziness"],
    adaReference: "ADA 2026 §9.2 – Meglitinide, rapid-acting insulin secretagogue",
  },

  // === THIAZOLIDINEDIONE (Alternative) ===
  {
    name: "Rosiglitazone (Avandia)",
    generic: "Rosiglitazone",
    class: "tzd",
    doses: [
      { label: "Start", dose: "2mg", frequency: "Once or BD" },
      { label: "Max", dose: "8mg", frequency: "Once or BD (daily)" },
    ],
    hba1cReduction: "1.0-1.5%",
    cvBenefit: false,
    renalBenefit: false,
    weightEffect: "gain",
    hypoRisk: "low",
    minEGFR: 0,
    dosageFrequency: "BD",
    contraindications: ["NYHA II-IV heart failure", "Active hepatic disease", "Macular edema"],
    sideEffects: ["Weight gain (2-5 kg)", "Fluid retention", "HF exacerbation (caution)", "Bone fractures"],
    adaReference: "ADA 2026 §9.2 – TZD with CV signal; use with caution due to HF risk",
  },
];

// ============================================================
// ADA 2026 ALGORITHM ENGINE
// Priority: 1) CVKD Risk → 2) Weight → 3) Glycemic Control
// ============================================================

function isOnDrug(patient: PatientData, generic: string): boolean {
  return patient.currentMeds.some(m => m.toLowerCase().includes(generic.toLowerCase()));
}

function isOnDrugClass(patient: PatientData, cls: DrugClass): boolean {
  return DRUG_DB.filter(d => d.class === cls).some(d => isOnDrug(patient, d.generic));
}

function hasASCVD(patient: PatientData): boolean {
  return patient.hasASCVD || patient.hasPostStroke || patient.hasPAD;
}

function hasCKD(patient: PatientData): boolean {
  return patient.hasCKD || patient.eGFR < 60;
}

function hasHF(patient: PatientData): boolean {
  return patient.hasHF || patient.hfNYHA >= 2;
}

function needsWeightManagement(patient: PatientData): boolean {
  return patient.bmi >= 25;
}

function getRecommendedDose(drug: DrugProfile, patient: PatientData): { dose: string; frequency: string } {
  // Check renal dose adjustments
  if (drug.renalDoseAdjust) {
    for (const adj of drug.renalDoseAdjust) {
      if (patient.eGFR >= adj.eGFRRange[0] && patient.eGFR < adj.eGFRRange[1]) {
        return { dose: adj.dose, frequency: adj.frequency };
      }
    }
  }
  // Return starting dose
  return { dose: drug.doses[0].dose, frequency: drug.doses[0].frequency };
}

// ============================================================
// LIFESTYLE PAIRING ENGINE — Lifestyle therapy integration per ADA/EASD 2023-2026
// Lifestyle is the base that runs alongside pharmacotherapy—not separate from it
// ============================================================

export interface LifestyleComplement {
  nutrition: string;
  physicalActivity: string;
  weight: string;
  other: string[];
}

// ============================================================
// SMART GOALS MODULE — Behavioral goal-setting per ADA guidelines
// SMART: Specific, Measurable, Achievable, Relevant, Time-bound
// ============================================================

export interface SMARTGoal {
  category: "medication-adherence" | "nutrition" | "physical-activity" | "weight-loss" | "glucose-monitoring" | "stress-sleep";
  title: string;
  goal: string;
  specific: string;
  measurable: string;
  timeframe: string;
  isActive: boolean;
}

export function generateSMARTGoals(patient: PatientData, drugs: MedRecommendation[]): SMARTGoal[] {
  const goals: SMARTGoal[] = [];
  const hasMultipleMeds = drugs.length > 1;
  const hasObesity = patient.bmi >= 27;
  const hasGLP1 = drugs.some(d => d.drugClass === "glp1ra" || d.drugClass === "dual-agonist");
  const hasSGLT2i = drugs.some(d => d.drugClass === "sglt2i");
  const hasSU = drugs.some(d => d.drugClass === "sulfonylurea");

  // ─── MEDICATION ADHERENCE GOALS ───
  if (hasMultipleMeds) {
    goals.push({
      category: "medication-adherence",
      title: "Take morning diabetes medication with breakfast",
      goal: "I will take my morning diabetes medicines with breakfast every day for the next 4 weeks.",
      specific: "With breakfast, same time each day (e.g., 7:00 AM)",
      measurable: "Use a daily checklist or medication-tracking app; aim for ≥28 of 30 days",
      timeframe: "4-week period, then review with clinician",
      isActive: true,
    });

    goals.push({
      category: "medication-adherence",
      title: "Fill weekly pill organizer",
      goal: "I will fill my weekly pill organizer every Sunday evening for the next 8 weeks.",
      specific: "Fill organizer once weekly on Sunday, checking all doses",
      measurable: "Missed no more than 1 week in 8 weeks",
      timeframe: "8-week block, then shift to monthly audits",
      isActive: true,
    });

    if (hasGLP1 || hasSGLT2i) {
      goals.push({
        category: "medication-adherence",
        title: `Take ${hasGLP1 ? "weekly GLP-1 injection" : "daily SGLT2i"} on schedule`,
        goal: `I will take my ${hasGLP1 ? "weekly GLP-1 injection every Monday morning" : "daily SGLT2i with breakfast"} for the next 6 weeks.`,
        specific: `${hasGLP1 ? "Monday morning, 15 minutes after waking" : "With breakfast, same time daily"}`,
        measurable: `${hasGLP1 ? "100% adherence (6 injections in 6 weeks)" : "At least 40 of 42 days"}`,
        timeframe: "6 weeks, then assess HbA1c impact",
        isActive: true,
      });
    }
  } else if (drugs.length === 1) {
    goals.push({
      category: "medication-adherence",
      title: `Take ${drugs[0].drug} daily`,
      goal: `I will take ${drugs[0].drug} ${drugs[0].frequency === "OD" ? "with breakfast every day" : drugs[0].frequency === "BD" ? "with breakfast and dinner" : "before each meal"} for the next 30 days.`,
      specific: `${drugs[0].frequency === "OD" ? "Same time daily (e.g., 7:00 AM with breakfast)" : "Consistent meals with medication"}`,
      measurable: "≥25 days of correct dosing in 30 days using a reminder system",
      timeframe: "1 month, then decide if habit is sustained",
      isActive: true,
    });
  }

  // ─── NUTRITION GOALS ───
  goals.push({
    category: "nutrition",
    title: "Replace sugary drinks with water",
    goal: "I will drink water instead of soda or sugary drinks at lunch and dinner 5 days a week for the next month.",
    specific: "At lunch and dinner, replace one sugary drink with water",
    measurable: "5 days per week (10 replacements per week minimum)",
    timeframe: "4 weeks, then extend to daily",
    isActive: true,
  });

  if (hasGLP1) {
    goals.push({
      category: "nutrition",
      title: "Practice portion control with GLP-1",
      goal: "I will use a smaller plate at dinner and stop eating when comfortably full for the next 30 days.",
      specific: "Use a 9-inch plate instead of 11-inch; wait 10 min before having seconds",
      measurable: "Track plate size changes in a food journal; report fullness cues",
      timeframe: "30 days (pairs with GLP-1 satiety effect)",
      isActive: true,
    });
  }

  // ─── PHYSICAL ACTIVITY GOALS ───
  goals.push({
    category: "physical-activity",
    title: "Walk after dinner",
    goal: "I will walk 30 minutes after dinner on Monday, Tuesday, Thursday, Friday, and Saturday for the next 6 weeks.",
    specific: "30-minute moderate-pace walk (can talk but not sing)",
    measurable: "5 days per week; use a step counter or fitness app",
    timeframe: "6 weeks, then reassess time/distance",
    isActive: true,
  });

  if (hasObesity) {
    goals.push({
      category: "physical-activity",
      title: "Add resistance training",
      goal: "I will do 20 minutes of resistance exercises (bodyweight or weights) on 2 days per week for the next 8 weeks.",
      specific: "Monday and Thursday; simple exercises like squats, push-ups, or dumbbells",
      measurable: "2 sessions per week; log in fitness app or journal",
      timeframe: "8 weeks (pairs with weight-loss medications like GLP-1)",
      isActive: hasGLP1 || hasSGLT2i,
    });
  }

  // ─── WEIGHT LOSS GOALS ───
  if (hasObesity) {
    goals.push({
      category: "weight-loss",
      title: "Achieve 5-10% weight loss",
      goal: `I will lose ${Math.round(patient.weightKg * 0.05)} to ${Math.round(patient.weightKg * 0.10)} kg over the next 12 weeks through diet and exercise.`,
      specific: `Combine portion control (smaller plate) + 150 min/week activity + ${hasGLP1 ? "GLP-1 appetite reduction" : "calorie awareness"}`,
      measurable: "Weigh weekly on same day/time; track in health app",
      timeframe: "12 weeks (0.5–1 lbs per week)",
      isActive: true,
    });
  }

  // ─── GLUCOSE MONITORING GOALS ───
  if (hasSU || (patient.hba1c >= 8.5)) {
    goals.push({
      category: "glucose-monitoring",
      title: "Check fasting glucose",
      goal: "I will check my blood sugar before breakfast and 2 hours after dinner 4 days per week for 3 weeks.",
      specific: "Before breakfast (fasting) and 2 hours post–largest meal",
      measurable: "4 days per week; record in logbook or app",
      timeframe: "3 weeks (gather baseline data for dose adjustment)",
      isActive: true,
    });
  }

  // ─── STRESS & SLEEP GOALS ───
  goals.push({
    category: "stress-sleep",
    title: "Practice bedtime relaxation",
    goal: "I will do 10 minutes of breathing exercises or meditation before bed at least 5 nights per week for 2 weeks.",
    specific: "10-minute deep breathing or guided meditation (via app like Calm or Insight Timer)",
    measurable: "5 of 7 nights per week; track in a journal",
    timeframe: "2 weeks, then extend to nightly if helpful",
    isActive: true,
  });

  goals.push({
    category: "stress-sleep",
    title: "Get 7-9 hours of sleep",
    goal: "I will aim for 7–9 hours of sleep nightly by going to bed by 10:30 PM for the next 4 weeks.",
    specific: "Bedtime by 10:30 PM, wake time 7:00 AM (or similar 9-hour window)",
    measurable: "Track sleep hours in a sleep app or journal; 5+ nights per week",
    timeframe: "4 weeks; assess energy and glucose patterns",
    isActive: true,
  });

  return goals;
}

function getLifestyleComplement(drugClass: DrugClass, patient: PatientData): LifestyleComplement {
  const hasObesity = patient.bmi >= 27;
  const postStrokeDysphagia = patient.postStrokeDysphagia;

  const baseActivities = [
    "Diabetes self-management education (DSME) for medication adherence and glucose monitoring",
    "Regular follow-up at 3 months to assess efficacy and tolerability",
    "Sleep hygiene (7–9 hours nightly) and stress management",
    "Smoking cessation if applicable; limit alcohol intake",
  ];

  if (drugClass === "glp1ra" || drugClass === "dual-agonist") {
    return {
      nutrition: "Structured portion-control plan and lower-calorie eating pattern (500–750 kcal deficit if weight loss desired); coordinate with GLP-1 satiety effect to avoid overeating triggers. Medical nutrition therapy individualized per ADA 2025.",
      physicalActivity: "Aerobic (150 min/week moderate) + resistance training (2 days/week). Exercise amplifies weight loss and cardiometabolic benefit beyond medication alone.",
      weight: hasObesity ? "Intensive weight-loss program targeting ≥5–10% weight reduction; GLP-1 RA most effective when paired with behavioral coaching, structured meal plans, and activity targets." : "Maintain weight through balanced nutrition + activity; GLP-1 benefit extends beyond weight to CV/renal protection.",
      other: baseActivities,
    };
  }

  if (drugClass === "sglt2i") {
    return {
      nutrition: "Adequate hydration (2–3 L water daily) and individualized eating plan. SGLT2i benefit is orthogonal to diet; no special dietary restrictions but hydration important to offset osmotic diuresis.",
      physicalActivity: "Regular aerobic and resistance exercise (150 min/week moderate) to maximize CV and renal protection; complements SGLT2i benefit in HF/CKD.",
      weight: hasObesity ? "Weight loss support through calorie reduction + structured exercise; SGLT2i provides 2–3 kg loss and cardiorenal benefit." : "Maintain current weight; SGLT2i primarily addresses CV/kidney health, not weight loss.",
      other: [
        ...baseActivities,
        "Sick-day rules: maintain fluid intake and monitor for symptoms of euglycemic DKA (rare but important in acute illness)",
      ],
    };
  }

  if (drugClass === "biguanide") {
    return {
      nutrition: "Calorie reduction for weight loss when overweight; individualized eating pattern. Coordinate timing around GI tolerance (take with meals to minimize diarrhea). Monitor B12 annually.",
      physicalActivity: "Regular aerobic + resistance exercise (150 min/week moderate) for glycemic and weight benefit. Metformin enhances exercise effect on insulin sensitivity.",
      weight: "Weight loss support when overweight through diet + exercise; metformin is weight-neutral to modest benefit but does not drive weight reduction like GLP-1 RA.",
      other: [
        ...baseActivities,
        "Annual B12 screening, especially if eGFR <45 or on long-term metformin (lactic acidosis risk is rare but monitor)",
      ],
    };
  }

  if (drugClass === "sulfonylurea") {
    return {
      nutrition: "Regular meal timing essential (SU induces insulin release; skipped meals increase hypo risk). Balanced carbs, consistent calorie intake.",
      physicalActivity: "Moderate aerobic exercise; avoid strenuous activity without snacks (hypoglycemia risk). Inform exercise partners of SU use.",
      weight: "Weight gain expected (2–4 kg); emphasize satiety and portion control to offset.",
      other: [
        ...baseActivities,
        "Patient education on hypoglycemia recognition + treatment (15 g fast carbs, recheck in 15 min). Teach family members hypo symptoms and rescue procedures.",
      ],
    };
  }

  if (drugClass === "tzd") {
    return {
      nutrition: "Standard individualized nutrition therapy; no special dietary modifications needed. Avoid excessive sodium (fluid retention risk).",
      physicalActivity: "Regular exercise supports insulin sensitivity and mitigates weight gain. Recommend aerobic + resistance (150 min/week).",
      weight: "Weight gain expected (2–5 kg) and difficult to offset without very aggressive calorie restriction; educate patient on realistic expectations and importance of exercise.",
      other: [
        ...baseActivities,
        "Monitor for fluid retention, edema, bone health (especially in women); annual liver function tests; screening for bladder cancer risk with long-term use.",
      ],
    };
  }

  if (drugClass.includes("insulin")) {
    return {
      nutrition: "Carbohydrate counting or consistent carb timing depending on insulin regimen. Coordinate meal timing with insulin action profile (basal vs. bolus). DSME essential.",
      physicalActivity: "Regular aerobic + resistance exercise; coordinate with insulin dose and timing to avoid hypoglycemia. Educate on activity-related carb adjustments.",
      weight: "Weight gain expected (2–4 kg typical); calorie reduction + exercise important to mitigate. Insulin efficacy not undermined by modest weight gain but combined diet/activity improves outcomes.",
      other: [
        ...baseActivities,
        "Intensive glucose self-monitoring (finger-stick 4+ times daily or CGM) essential for dose titration and hypo prevention.",
        "Annual A1c review and dose adjustment (+2 U q3 days until target fasting 80–130).",
      ],
    };
  }

  // Default for DPP-4i, AGI, meglitinide, etc.
  return {
    nutrition: "Individualized medical nutrition therapy; no special restrictions for most agents. AGI users: coordinate carb intake timing and avoid large meals.",
    physicalActivity: "Regular aerobic + resistance exercise (150 min/week) for glycemic and overall cardiometabolic benefit.",
    weight: hasObesity ? "Weight management through lifestyle; these agents are weight-neutral, so weight loss requires caloric deficit + activity." : "Maintain current weight through balanced nutrition.",
    other: baseActivities,
  };
}

// ============================================================
// CLINICAL EXPLANATION ENGINE — RAG-based justification
// Generates 3-4 line explanations per ADA/EASD 2023-2026 guidelines
// ============================================================

function generateClinicalExplanation(drug: DrugProfile, patient: PatientData, reason: string): string {
  const hasASCVD = patient.hasASCVD || patient.hasPostStroke || patient.hasPAD;
  const hasCKD = patient.hasCKD || patient.eGFR < 60;
  const hasHF = patient.hasHF || patient.hfNYHA >= 2;
  const hasObesity = patient.bmi >= 27;
  const hba1c = patient.hba1c;

  // GLP-1 Receptor Agonists
  if (drug.class === "glp1ra") {
    if (hasASCVD) {
      return `GLP-1 RAs with proven CV benefit (semaglutide, liraglutide, dulaglutide) are preferred for established ASCVD independent of HbA1c control per ADA/EASD 2023–2026. Demonstrated >20% MACE reduction in landmark trials (SUSTAIN-6, LEADER, REWIND). Offers dual benefit of glycemic control and weight loss, addressing both cardiometabolic risk and obesity when present. ⚠️ If on DPP-4i, discontinue it—no additive benefit with GLP-1 RA.`;
    }
    if (hasObesity && hba1c >= 7.5) {
      return `GLP-1 RAs provide highest weight loss efficacy (5–15%) among non-insulin agents per ADA 2025 obesity guidance. Significant HbA1c reduction (1.0–2.0%) enables earlier achievement of glycemic targets while managing weight—particularly valuable when HbA1c exceeds 7.5% in overweight/obese patients. Low hypoglycemia risk and durable efficacy support use as first-line weight management therapy. ⚠️ De-escalate concurrent DPP-4i.`;
    }
    return `GLP-1 RAs are increasingly preferred as early agents when glycemic durability or weight reduction is needed, reflecting the 2025 ADA shift away from obligatory metformin-first sequencing. Low hypoglycemia risk and demonstrated cardiorenal benefits in high-risk patients support expanding indications beyond strict HbA1c targets. ⚠️ CRITICAL: If patient is on a DPP-4i (sitagliptin, linagliptin, vildagliptin, saxagliptin), DISCONTINUE it. Both agents target the incretin system; combining them provides no added benefit per ADA/FDA guidance.`;
  }

  // Dual GIP/GLP-1 Agonists
  if (drug.class === "dual-agonist") {
    return `Tirzepatide delivers the highest HbA1c reduction (2.0–2.6%) and weight loss efficacy (15–20%) among all non-insulin agents per SURPASS and SURMOUNT trials, positioned as the most potent option for dual unmet needs. Particularly optimal when HbA1c >8.0% and BMI >27, directly addressing glycemic control + obesity simultaneously. Supports earlier intensification than traditional stepwise monotherapy, aligning with 2025 ADA preference for aggressive early combination therapy.`;
  }

  // SGLT2 Inhibitors
  if (drug.class === "sglt2i") {
    if (hasHF) {
      return `SGLT2 inhibitors are established first-line for heart failure with diabetes per both ADA/EASD and AACE 2023–2026 guidelines, irrespective of glycemic control or HbA1c target. EMPEROR-Reduced/Preserved and DAPA-HF trials demonstrate 25–40% HF hospitalization reduction. Oral convenience, weight loss benefit (2–3 kg), and cardiorenal protection make SGLT2i the preferred early choice in HF before or instead of traditional stepwise escalation.`;
    }
    if (hasCKD && !hasHF) {
      return `SGLT2 inhibitors are the preferred agents for CKD with or without diabetes (eGFR ≥20) per ADA/EASD consensus, providing proven slowing of CKD progression and albuminuria reduction (DAPA-CKD, CREDENCE). Independent of HbA1c targets, SGLT2i should be initiated early in CKD—often as first-line monotherapy or dual therapy with metformin. Dual benefit of glycemic control and renal protection addresses the highest-priority comorbidity.`;
    }
    if (hasASCVD && !hasHF && !hasCKD) {
      return `SGLT2 inhibitors with proven CV outcomes (empagliflozin, dapagliflozin, canagliflozin) provide established cardiovascular benefit in ASCVD (EMPA-REG OUTCOME, DECLARE-TIMI, CREDENCE) with modest weight loss and low hypoglycemia risk. Particularly suitable when oral therapy is preferred or as add-on to metformin in patients without HF/CKD who need glycemic + CV benefit with simpler regimen than GLP-1 RA.`;
    }
    return `SGLT2 inhibitors provide cardiorenal protection with proven HbA1c reduction (0.7–1.2%) and weight loss (2–3 kg) at lower glycemic efficacy than GLP-1 RAs but with excellent CV/renal outcomes in landmark trials. Preferred in early CKD/HF or as oral monotherapy/dual therapy option when injectable agents not tolerated. Safe renal dosing with eGFR ≥20.`;
  }

  // Metformin
  if (drug.class === "biguanide") {
    if (hba1c < 7.5) {
      return `Metformin remains appropriate as foundational therapy per ADA 2026 when HbA1c <7.5% and no major cardiorenal contraindications, delivering 1.0–1.5% HbA1c reduction with excellent tolerability and safety record. Weight-neutral and low hypoglycemia risk support its continued use, though 2023–2026 guidelines no longer mandate universal first-line use when ASCVD, HF, or CKD is present—comorbidities now drive agent selection. eGFR ≥30 is safe; dose reduce if eGFR 30–45.`;
    }
    return `Metformin provides foundational glycemic control (1.0–1.5% HbA1c reduction) with excellent long-term safety and weight neutrality, supporting continued use as a background agent in early-stage disease without major cardiorenal comorbidities. 2025 ADA no longer requires metformin as obligatory first line, especially in ASCVD/CKD/HF where comorbidity-driven therapy (GLP-1 RA, SGLT2i) takes priority. Dose adjust for eGFR 30–45; contraindicated eGFR <30.`;
  }

  // DPP-4 Inhibitors
  if (drug.class === "dpp4i") {
    return `DPP-4 inhibitors offer intermediate HbA1c reduction (0.5–0.8%) with low hypoglycemia risk and weight neutrality, suitable for patients requiring glycemic control without CV/renal comorbidities when GLP-1 RA/SGLT2i not tolerated or not indicated. However, no proven CV/renal outcomes and inconsistent placement in 2023–2026 guidelines suggest they are add-on rather than preferred first-line agents. Avoid combined DPP-4i + GLP-1 RA (no additive benefit); avoid saxagliptin in HF (SAVOR-TIMI 53 signal).`;
  }

  // Sulfonylureas
  if (drug.class === "sulfonylurea") {
    if (patient.bmi >= 27) {
      return `Sulfonylureas (gliclazide preferred per ADVANCE trial) are increasingly reserved for specific scenarios where HbA1c >8.5%, cost is limiting, or when GLP-1 RA/SGLT2i cannot be used. High hypoglycemia and weight-gain risk (2–4 kg) make them less ideal in overweight/obese populations. When necessary, prefer later-generation gliclazide (lower hypo risk) over glimepiride/glipizide/glyburide. 2023–2026 guidelines de-emphasize SU use, especially in obese and elderly patients.`;
    }
    return `Sulfonylureas provide effective HbA1c reduction (1.0–1.5%) but carry high hypoglycemia risk and weight gain (2–3 kg), limiting use in modern diabetes management per ADA/EASD 2023–2026 guidelines. Reserve for cost-sensitive settings or when GLP-1 RA/SGLT2i contraindicated. If used, prefer later-generation gliclazide (ADVANCE: lower hypo risk) over older agents. Avoid in elderly and HF patients; use with extreme caution in eGFR <30.`;
  }

  // Thiazolidinediones
  if (drug.class === "tzd") {
    return `Pioglitazone addresses insulin resistance with modest CV benefit (PROactive trial) but carries significant weight gain (2–5 kg), fluid retention/edema, bone fracture risk (women), and potential bladder cancer concern, limiting modern use. Contraindicated in HF (NYHA III–IV) per both guidelines. Reserved for specific patients with insulin resistance and no HF/obesity concerns. 2023–2026 guidelines position TZD as third/fourth-line due to adverse effect profile and availability of safer agents.`;
  }

  // Basal Insulin
  if (drug.class === "basal-insulin") {
    if (hba1c >= 9.5 || patient.rbs > 300) {
      return `Basal insulin is indicated when HbA1c ≥9% with symptomatic hyperglycemia, RBS >300 mg/dL, or severe catabolic features (weight loss, suspected ketosis) per ADA/EASD 2023–2026 emergency protocols. Insulin Degludec (Tresiba) is preferred over glargine when nocturnal hypoglycemia is a concern (DEVOTE trial: 26% lower nocturnal hypo). Requires patient education, glucose monitoring, and careful titration (+2 U q3 days until FBG 80–130); weight gain and hypoglycemia are expected.`;
    }
    return `Basal insulin is indicated when HbA1c ≥8.5–9% despite oral triple therapy, or for rapid glycemic control in symptomatic hyperglycemia. Insulin Degludec is preferred for lower nocturnal hypoglycemia risk (DEVOTE) vs. glargine. Stepwise titration (starting 10 U or 0.1–0.2 U/kg, +2 U q3 days) minimizes hypoglycemia. Combines with oral agents (especially metformin + SGLT2i) for cardiorenal + glycemic benefits, addressing intensification without full insulin dependence.`;
  }

  // Default explanation
  return `This drug aligns with ADA/EASD 2023–2026 recommendations for the patient's current HbA1c (${hba1c}%), comorbidity profile, and renal function. Offers the balance of efficacy, tolerability, and cardiorenal benefit appropriate for this stage of therapy. Review tolerability and adherence at each visit; intensify if HbA1c not at goal after 3 months.`;
}

function buildRec(
  drug: DrugProfile,
  patient: PatientData,
  reason: string,
  priority: MedRecommendation["priority"],
  category: AlgorithmPriority,
): MedRecommendation {
  const recommended = getRecommendedDose(drug, patient);
  const warnings: string[] = [...drug.sideEffects.slice(0, 2)];

  // Add renal warnings
  if (drug.renalDoseAdjust && patient.eGFR < 60) {
    const adj = drug.renalDoseAdjust.find(a => patient.eGFR >= a.eGFRRange[0] && patient.eGFR < a.eGFRRange[1]);
    if (adj) warnings.unshift(`⚠ Renal dose: ${adj.dose} ${adj.frequency} (eGFR ${patient.eGFR})`);
  }
  if (patient.eGFR < drug.minEGFR) {
    warnings.unshift(`🚫 CONTRAINDICATED: eGFR ${patient.eGFR} < minimum ${drug.minEGFR}`);
  }
  if (patient.postStrokeDysphagia) {
    warnings.push("⚠ Post-stroke dysphagia: verify swallowing safety for oral meds");
  }
  if (drug.hypoRisk === "high") {
    warnings.push("⚠ HIGH hypoglycemia risk – monitor closely, educate patient");
  }
  if (drug.class === "tzd" && patient.hfNYHA >= 3) {
    warnings.unshift("🚫 CONTRAINDICATED in NYHA III-IV heart failure");
  }
  if (drug.generic === "Saxagliptin" && patient.hfNYHA >= 2) {
    warnings.unshift("🚫 AVOID: Increased HF hospitalization risk (SAVOR-TIMI 53)");
  }

  // Check if already on drug
  if (isOnDrug(patient, drug.generic)) {
    const currentMed = patient.currentMeds.find(m => m.toLowerCase().includes(drug.generic.toLowerCase()));
    warnings.unshift(`📋 Currently on: ${currentMed} – review dosing`);
  }

  return {
    drug: drug.name,
    genericName: drug.generic,
    drugClass: drug.class,
    dose: recommended.dose,
    frequency: recommended.frequency,
    reason,
    priority,
    category,
    warnings,
    contraindications: drug.contraindications,
    adaReference: drug.adaReference,
    hba1cReduction: drug.hba1cReduction,
    cvBenefit: drug.cvBenefit,
    renalBenefit: drug.renalBenefit,
    weightEffect: drug.weightEffect,
    clinicalExplanation: generateClinicalExplanation(drug, patient, reason),
    lifestyleComplement: getLifestyleComplement(drug.class, patient),
  };
}

/**
 * Determines which ADA 2026 pathway the patient falls into.
 * Based on the glucose-lowering algorithm flowchart.
 */
export type AlgorithmPathway =
  | "ascvd-predominant"
  | "hf-ckd-predominant"
  | "hypo-minimization"
  | "weight-management"
  | "cost-sensitive"
  | "general";

export function getAlgorithmPathway(patient: PatientData): AlgorithmPathway {
  const establishedASCVD = patient.hasASCVD || patient.hasPostStroke || patient.hasPAD;
  const establishedCKD = patient.hasCKD || patient.eGFR < 60;
  const establishedHF = patient.hasHF || patient.hfNYHA >= 2;

  if (establishedASCVD && !establishedHF && !establishedCKD) return "ascvd-predominant";
  if (establishedHF || establishedCKD) return "hf-ckd-predominant";
  // Without established ASCVD or CKD — check compelling needs
  if (patient.bmi >= 25 || patient.hasObesity) return "weight-management";
  // Default: minimize hypo
  return "hypo-minimization";
}

export function getPathwayLabel(pathway: AlgorithmPathway): string {
  const labels: Record<AlgorithmPathway, string> = {
    "ascvd-predominant": "ASCVD Predominates",
    "hf-ckd-predominant": "HF or CKD Predominates",
    "hypo-minimization": "Minimize Hypoglycemia",
    "weight-management": "Weight Management Priority",
    "cost-sensitive": "Cost-Sensitive Approach",
    "general": "General Glycemic Control",
  };
  return labels[pathway];
}

export function generateMedRecommendations(patient: PatientData): MedRecommendation[] {
  const recs: MedRecommendation[] = [];
  const addedClasses = new Set<DrugClass>();
  const addedGenerics = new Set<string>();

  // Memoized drug lookup to avoid repeated DRUG_DB.find() calls
  const drugCache = new Map<string, DrugProfile>();
  const getDrug = (generic: string): DrugProfile => {
    if (!drugCache.has(generic)) {
      drugCache.set(generic, DRUG_DB.find(d => d.generic === generic)!);
    }
    return drugCache.get(generic)!;
  };

  function addRec(rec: MedRecommendation) {
    if (!addedGenerics.has(rec.genericName)) {
      recs.push(rec);
      addedGenerics.add(rec.genericName);
      addedClasses.add(rec.drugClass);
    }
  }

  const hba1c = patient.hba1c;
  const pathway = getAlgorithmPathway(patient);
  const establishedASCVD = patient.hasASCVD || patient.hasPostStroke || patient.hasPAD;
  const establishedCKD = patient.hasCKD || patient.eGFR < 60;
  const establishedHF = patient.hasHF || patient.hfNYHA >= 2;
  const hba1cAboveTarget = hba1c >= 7.0;

  // ============================================================
  // STEP 1: FIRST-LINE — Metformin + lifestyle (universal)
  // ============================================================
  if (patient.eGFR >= 30 && !isOnDrug(patient, "Metformin")) {
    const met = getDrug("Metformin");
    addRec(buildRec(met, patient,
      `First-line therapy: Metformin + comprehensive lifestyle (including weight management and physical activity). eGFR ${patient.eGFR} ≥ 30 → safe. ${patient.eGFR < 45 ? "Reduced dose for CKD Stage 3b." : ""}`,
      "first-line", "glycemic-control"));
  }

  // ============================================================
  // STEP 2: ESTABLISHED ASCVD OR CKD? → Branch into pathways
  // ============================================================

  if (establishedASCVD || establishedCKD || establishedHF) {
    // ─── BRANCH A: ASCVD PREDOMINATES ───
    if (pathway === "ascvd-predominant") {
      // EITHER/OR: GLP-1 RA with proven CV benefit OR SGLT2i with proven CVD benefit
      // GLP-1 RA: strongest evidence semaglutide > liraglutide > dulaglutide > exenatide ER
      const sema = getDrug("Semaglutide");
      addRec(buildRec(sema, patient,
        `ASCVD predominates → GLP-1 RA with proven CV benefit (SUSTAIN-6, SELECT). Strongest evidence. ${patient.bmi >= 27 ? "Also addresses weight management." : ""}`,
        "first-line", "cvkd-risk"));

      if (patient.eGFR >= 20) {
        const empa = getDrug("Empagliflozin");
        addRec(buildRec(empa, patient,
          `ASCVD predominates → SGLT2i with proven CVD benefit, if eGFR adequate (${patient.eGFR} ≥ 20). EMPA-REG OUTCOME.`,
          "first-line", "cvkd-risk"));
      }

      // If HbA1c still above target → intensify
      if (hba1cAboveTarget) {
        // Consider adding the other class, DPP-4i (if not on GLP-1 RA), basal insulin, TZD (low dose), SU
        if (!addedClasses.has("dual-agonist") && patient.bmi >= 27) {
          const tirz = getDrug("Tirzepatide");
          addRec(buildRec(tirz, patient,
            `HbA1c ${hba1c}% above target + BMI ${patient.bmi} → Dual GIP/GLP-1 agonist for maximum efficacy (SURPASS, SURMOUNT). Alternative to semaglutide.`,
            "add-on", "cvkd-risk"));
        }

        const lira = getDrug("Liraglutide");
        addRec(buildRec(lira, patient,
          `ASCVD intensification → Alternative GLP-1 RA with proven CV benefit (LEADER). Consider if semaglutide not tolerated.`,
          "add-on", "cvkd-risk"));

        // Further intensification: DPP-4i, basal insulin, TZD, SU
        addIntensificationAgents(patient, hba1c, recs, addRec, addedClasses, addedGenerics, true);
      }
    }

    // ─── BRANCH B: HF OR CKD PREDOMINATES ───
    else if (pathway === "hf-ckd-predominant") {
      // PREFERABLY: SGLT2i with evidence of reducing HF and/or CKD progression (if eGFR adequate)
      // Empagliflozin & canagliflozin both shown reduction in HF and CKD progression
      if (patient.eGFR >= 20) {
        const sglt2Choice = establishedHF
          ? getDrug("Empagliflozin")   // EMPEROR trials
          : getDrug("Dapagliflozin");  // DAPA-CKD

        addRec(buildRec(sglt2Choice, patient,
          `HF/CKD predominates → PREFERABLY SGLT2i with evidence of reducing ${establishedHF ? "HF (EMPEROR-Reduced/Preserved)" : "CKD progression (DAPA-CKD)"}. eGFR ${patient.eGFR} adequate.`,
          "first-line", "cvkd-risk"));

        // Offer alternative SGLT2i
        const altSGLT2 = establishedHF
          ? getDrug("Dapagliflozin")
          : getDrug("Empagliflozin");
        addRec(buildRec(altSGLT2, patient,
          `Alternative SGLT2i for ${establishedHF ? "HF + CKD protection" : "CV + renal benefit"}. ${altSGLT2.adaReference}`,
          "add-on", "cvkd-risk"));
      }

      // OR if SGLT2i not tolerated/contraindicated or eGFR inadequate → GLP-1 RA with proven CV benefit
      const sema = getDrug("Semaglutide");
      addRec(buildRec(sema, patient,
        `${patient.eGFR < 20 ? "eGFR < 20 → SGLT2i contraindicated. " : "If SGLT2i not tolerated/contraindicated → "}Add GLP-1 RA with proven CV benefit.`,
        patient.eGFR < 20 ? "first-line" : "add-on", "cvkd-risk"));

      // If HbA1c above target → intensify
      if (hba1cAboveTarget) {
        // AVOID TZD in HF setting
        // Choose agents demonstrating CV safety
        // DPP-4i (not saxagliptin) in HF setting, basal insulin, SU
        if (!addedClasses.has("dpp4i")) {
          // Avoid saxagliptin in HF → use linagliptin or sitagliptin
          const dpp4 = establishedHF
            ? getDrug("Linagliptin")    // No HF signal + no renal dose adj
            : getDrug("Sitagliptin");
          const warning = establishedHF ? "DPP-4i (NOT saxagliptin) in HF setting." : "";
          addRec(buildRec(dpp4, patient,
            `HbA1c ${hba1c}% above target → ${warning} ${dpp4.name} for additional glycemic control. ${dpp4.generic === "Linagliptin" ? "No renal dose adjustment needed." : ""}`,
            "add-on", "glycemic-control"));
        }

        addIntensificationAgents(patient, hba1c, recs, addRec, addedClasses, addedGenerics, establishedHF);
      }
    }
  }

  // ============================================================
  // STEP 2 (NO): WITHOUT ESTABLISHED ASCVD OR CKD
  // ============================================================
  else {
    if (!hba1cAboveTarget) {
      // At target — no additional agents needed beyond metformin
    } else {
      // ─── COMPELLING NEED TO MINIMIZE HYPOGLYCEMIA ───
      if (pathway === "hypo-minimization" || patient.age >= 65) {
        // Prefer: DPP-4i, GLP-1 RA, SGLT2i, TZD (all low hypo risk)
        if (!addedClasses.has("dpp4i") && !addedClasses.has("glp1ra") && !addedClasses.has("dual-agonist")) {
          const lina = getDrug("Linagliptin");
          addRec(buildRec(lina, patient,
            `Minimize hypoglycemia → DPP-4i: low hypo risk, weight neutral. No renal dose adjustment (biliary excretion).`,
            "add-on", "glycemic-control"));
        }

        if (!addedClasses.has("glp1ra")) {
          const sema = getDrug("Semaglutide");
          addRec(buildRec(sema, patient,
            `Minimize hypoglycemia → GLP-1 RA: low hypo risk + weight loss benefit.`,
            "add-on", "glycemic-control"));
        }

        if (!addedClasses.has("sglt2i") && patient.eGFR >= 20) {
          const empa = getDrug("Empagliflozin");
          addRec(buildRec(empa, patient,
            `Minimize hypoglycemia → SGLT2i: low hypo risk + CV/renal benefit.`,
            "add-on", "glycemic-control"));
        }

        // Second tier if HbA1c still above target
        if (hba1c >= 8.0) {
          // GLP-1 RA or SGLT2i add-ons, then continue with other agents
          if (!addedClasses.has("sglt2i") && patient.eGFR >= 20) {
            const dapa = getDrug("Dapagliflozin");
            addRec(buildRec(dapa, patient,
              `HbA1c ${hba1c}% still above target → Add SGLT2i as second agent.`,
              "add-on", "glycemic-control"));
          }

          // Third tier: consider SU (later gen) or basal insulin with lower hypo risk
          if (hba1c >= 9.0) {
            const glic = getDrug("Gliclazide");
            addRec(buildRec(glic, patient,
              `HbA1c ${hba1c}% ≥ 9 → Consider SU OR basal insulin. Choose later-generation SU (gliclazide) with lower hypo risk.`,
              "intensification", "glycemic-control"));

            const degludec = getDrug("Insulin Degludec");
            addRec(buildRec(degludec, patient,
              `Consider basal insulin with lower risk of hypoglycemia. Degludec preferred over glargine for nocturnal hypo safety (DEVOTE).`,
              "intensification", "glycemic-control"));
          }
        }
      }

      // ─── COMPELLING NEED TO MINIMIZE WEIGHT GAIN / PROMOTE WEIGHT LOSS ───
      else if (pathway === "weight-management") {
        // EITHER/OR: GLP-1 RA with good efficacy for weight loss OR SGLT2i
        if (patient.bmi >= 27) {
          const tirz = getDrug("Tirzepatide");
          addRec(buildRec(tirz, patient,
            `Weight management priority (BMI ${patient.bmi}) → Dual GIP/GLP-1 agonist: highest weight loss efficacy (15-20%). SURMOUNT/SURPASS trials.`,
            "first-line", "weight-management"));
        }

        const sema = getDrug("Semaglutide");
        addRec(buildRec(sema, patient,
          `Weight management (BMI ${patient.bmi}) → GLP-1 RA with good efficacy for weight loss (5-15%). SELECT/STEP trials.`,
          patient.bmi >= 27 ? "add-on" : "first-line", "weight-management"));

        if (patient.eGFR >= 20) {
          const empa = getDrug("Empagliflozin");
          addRec(buildRec(empa, patient,
            `Weight management → SGLT2i: modest weight loss (2-3 kg) + CV/renal benefit.`,
            "add-on", "weight-management"));
        }

        // If HbA1c still above target
        if (hba1c >= 8.0) {
          if (!addedClasses.has("sglt2i") && patient.eGFR >= 20) {
            const dapa = getDrug("Dapagliflozin");
            addRec(buildRec(dapa, patient,
              `HbA1c ${hba1c}% above target → Add SGLT2i for weight-neutral glycemic control.`,
              "add-on", "weight-management"));
          }

          // If triple therapy needed and GLP-1 RA/SGLT2i not tolerated → DPP-4i (weight neutral)
          if (!addedClasses.has("dpp4i")) {
            const lina = getDrug("Linagliptin");
            addRec(buildRec(lina, patient,
              `HbA1c ${hba1c}% → PREFERABLY DPP-4i (if not on GLP-1 RA) based on weight neutrality.`,
              "add-on", "glycemic-control"));
          }
        }

        // De-escalate weight-gaining agents
        if (patient.bmi >= 30 && isOnDrugClass(patient, "sulfonylurea")) {
          const glic = getDrug("Gliclazide");
          recs.push({
            ...buildRec(glic, patient, "", "de-escalate", "weight-management"),
            reason: `BMI ${patient.bmi} (≥30) + on sulfonylurea → Consider de-escalation/switch to weight-neutral agent. SU causes 2-3 kg weight gain.`,
            warnings: ["Consider replacing with DPP-4i or dose reduction if GLP-1 RA started", "High hypo risk with concurrent GLP-1 RA"],
          });
          addedGenerics.add("Gliclazide");
        }
      }
    }
  }

  // ============================================================
  // SEVERE HYPERGLYCEMIA — insulin regardless of pathway
  // ============================================================
  if (hba1c >= 9.0 && (patient.rbs > 300 || hba1c >= 10)) {
    if (!addedClasses.has("basal-insulin")) {
      const glargine = getDrug("Insulin Glargine");
      addRec(buildRec(glargine, patient,
        `HbA1c ${hba1c}% + RBS ${patient.rbs} → Symptomatic hyperglycemia: basal insulin required. Start 10 units or 0.1-0.2 U/kg. Titrate +2 U q3 days to FBG 80-130.`,
        "first-line", "glycemic-control"));
    }
  } else if (hba1c >= 9.0 && !addedClasses.has("basal-insulin")) {
    const glargine = getDrug("Insulin Glargine");
    addRec(buildRec(glargine, patient,
      `HbA1c ${hba1c}% (≥9) → Consider early basal insulin if oral combination insufficient. Target FBG 80-130.`,
      "intensification", "glycemic-control"));
  }

  // ============================================================
  // CURRENT MEDICATION REVIEW
  // ============================================================
  for (const med of patient.currentMeds) {
    const medLower = med.toLowerCase();
    for (const drug of DRUG_DB) {
      if (medLower.includes(drug.generic.toLowerCase()) && !addedGenerics.has(drug.generic)) {
        let isContra = false;
        if (drug.minEGFR > 0 && patient.eGFR < drug.minEGFR) isContra = true;
        if (drug.generic === "Saxagliptin" && patient.hfNYHA >= 2) isContra = true;
        if (drug.class === "tzd" && patient.hfNYHA >= 3) isContra = true;

        if (isContra) {
          addRec(buildRec(drug, patient,
            `Currently on ${med} → ⚠ CONTRAINDICATED in this patient. Discontinue and switch.`,
            "de-escalate", "current-med-review"));
        } else {
          const needsAdj = drug.renalDoseAdjust?.some(a => patient.eGFR >= a.eGFRRange[0] && patient.eGFR < a.eGFRRange[1]);
          addRec(buildRec(drug, patient,
            `Currently on ${med}. ${needsAdj ? "⚠ DOSE ADJUSTMENT needed for current renal function." : "Review: appropriate for current clinical status."}`,
            needsAdj ? "adjustment" : "add-on", "current-med-review"));
        }
        break;
      }
    }

    if (medLower.includes("voglibose") && !addedGenerics.has("Voglibose")) {
      const vogl = getDrug("Voglibose");
      addRec(buildRec(vogl, patient,
        `Currently on ${med}. Limited HbA1c reduction (0.5-0.8%). Consider de-escalation if GLP-1 RA or SGLT2i started.`,
        "adjustment", "current-med-review"));
    }
  }

  // ============================================================
  // LIPID MANAGEMENT (Post-stroke LAI targets)
  // ============================================================
  if (patient.ldl > 55) {
    const statin: MedRecommendation = {
      drug: patient.ldl > 100 ? "Rosuvastatin 20mg" : "Rosuvastatin 10mg",
      genericName: "Rosuvastatin",
      drugClass: "statin",
      dose: patient.ldl > 100 ? "20mg" : "10mg",
      frequency: "Once daily at bedtime",
      reason: `LDL ${patient.ldl} mg/dL → Post-stroke target <55 mg/dL (LAI very high-risk). ${patient.ldl > 100 ? "High-intensity statin required." : "Moderate-high intensity."}`,
      priority: "first-line",
      category: "lipid",
      warnings: [
        "Target LDL <55 mg/dL for post-stroke + DM",
        "Check LFT at 3 months",
        patient.eGFR < 30 ? "⚠ Renal dosing: max 10mg if eGFR <30" : "",
        patient.ldl > 100 ? "Consider adding ezetimibe 10mg if target not met at 3 months" : "",
      ].filter(Boolean),
      contraindications: ["Active liver disease", "Pregnancy"],
      adaReference: "ADA 2026 §10.2 + LAI Lipid Guidelines – Very high CV risk",
      hba1cReduction: "N/A",
      cvBenefit: true,
      renalBenefit: false,
      weightEffect: "neutral",
    };
    addRec(statin);

    if (patient.ldl > 100) {
      recs.push({
        drug: "Ezetimibe (Zetia)",
        genericName: "Ezetimibe",
        drugClass: "statin",
        dose: "10mg",
        frequency: "Once daily",
        reason: `LDL ${patient.ldl} > 100 → Add ezetimibe to statin if LDL not at target after 3 months. Reduces LDL by additional 15-20%.`,
        priority: "add-on",
        category: "lipid",
        warnings: ["Usually combined with statin", "Check LFT"],
        contraindications: ["Active liver disease"],
        adaReference: "ADA 2026 §10.2 – Combination lipid therapy",
        hba1cReduction: "N/A",
        cvBenefit: true,
        renalBenefit: false,
        weightEffect: "neutral",
      });
    }
  }

  // Sort
  const priorityOrder: Record<string, number> = {
    "cvkd-risk": 0, "weight-management": 1, "glycemic-control": 2, "lipid": 3, "current-med-review": 4,
  };
  const statusOrder: Record<string, number> = {
    "first-line": 0, "adjustment": 1, "add-on": 2, "intensification": 3, "de-escalate": 4, "emergency": 5,
  };
  recs.sort((a, b) => {
    const catDiff = (priorityOrder[a.category] ?? 5) - (priorityOrder[b.category] ?? 5);
    if (catDiff !== 0) return catDiff;
    return (statusOrder[a.priority] ?? 5) - (statusOrder[b.priority] ?? 5);
  });

  return recs;
}

/**
 * Helper: add intensification agents after primary CV/Kidney agents.
 * Avoids TZD in HF. Follows the ADA 2026 stepwise approach.
 */
function addIntensificationAgents(
  patient: PatientData,
  hba1c: number,
  recs: MedRecommendation[],
  addRec: (rec: MedRecommendation) => void,
  addedClasses: Set<DrugClass>,
  addedGenerics: Set<string>,
  avoidTZD: boolean,
) {
  const getDrug = (generic: string): DrugProfile => DRUG_DB.find(d => d.generic === generic)!;

  // Basal insulin if HbA1c very high
  if (hba1c >= 9.0 && !addedClasses.has("basal-insulin")) {
    const degludec = getDrug("Insulin Degludec");
    addRec(buildRec(degludec, patient,
      `HbA1c ${hba1c}% ≥ 9 → Basal insulin for intensification. Degludec preferred (lower nocturnal hypo, DEVOTE). U100 glargine also CV-safe.`,
      "intensification", "glycemic-control"));
  }

  // SU — later generation, lower hypo
  if (hba1c >= 8.5 && !addedClasses.has("sulfonylurea") && patient.bmi < 27) {
    const glic = getDrug("Gliclazide");
    addRec(buildRec(glic, patient,
      `HbA1c ${hba1c}% → Later-generation SU with lower hypo risk (gliclazide MR, ADVANCE trial). Use if cost is a factor.`,
      "intensification", "glycemic-control"));
  }

  // TZD — only if no HF
  if (!avoidTZD && hba1c >= 7.5 && !addedClasses.has("tzd") && patient.hfNYHA < 2) {
    const pio = getDrug("Pioglitazone");
    addRec(buildRec(pio, patient,
      `Pioglitazone: addresses insulin resistance. CV benefit (PROactive). Low dose may be better tolerated. ⚠ Avoid in HF.`,
      "add-on", "glycemic-control"));
  }
}

// ============================================================
// HYPO PROTOCOL & LIPID TARGETS (unchanged)
// ============================================================

export function getHypoProtocol(patient: PatientData): HypoProtocol {
  return {
    trigger: "Blood glucose < 70 mg/dL",
    immediate: [
      "Moru (buttermilk) 240ml immediately – 5g fast carbs",
      "15g almonds (badam) – sustained glucose release",
      "Recheck BG in 15 minutes",
      patient.postStrokeDysphagia ? "⚠ DYSPHAGIA: Use thickened moru, avoid whole almonds → use almond paste" : "",
    ].filter(Boolean),
    followUp: [
      "If BG still <70: repeat 15g carb rule",
      "Moru every 3 hours until BG stable >100",
      "Document episode and inform physician",
      "Review sulfonylurea/insulin doses",
    ],
  };
}

export function getLipidTargets(patient: PatientData) {
  return {
    ldlTarget: 55,
    ldlCurrent: patient.ldl,
    ldlGap: patient.ldl - 55,
    trigTarget: 150,
    trigCurrent: patient.triglycerides || 0,
    hdlTarget: patient.gender === "M" ? 40 : 50,
    hdlCurrent: patient.hdl || 0,
    riskCategory: "Very High (Post-stroke + T2DM)",
  };
}

export function getDrugClassLabel(cls: DrugClass): string {
  const labels: Record<DrugClass, string> = {
    "biguanide": "Biguanide",
    "sglt2i": "SGLT2 Inhibitor",
    "glp1ra": "GLP-1 Receptor Agonist",
    "dpp4i": "DPP-4 Inhibitor",
    "sulfonylurea": "Sulfonylurea",
    "tzd": "Thiazolidinedione",
    "agi": "α-Glucosidase Inhibitor",
    "meglitinide": "Meglitinide",
    "basal-insulin": "Basal Insulin",
    "prandial-insulin": "Prandial Insulin",
    "premixed-insulin": "Premixed Insulin",
    "dual-agonist": "Dual GIP/GLP-1 Agonist",
    "statin": "Statin / Lipid",
    "ace-arb": "ACE/ARB",
  };
  return labels[cls] || cls;
}

export function getCategoryLabel(cat: AlgorithmPriority): string {
  const labels: Record<AlgorithmPriority, string> = {
    "cvkd-risk": "① CV & Kidney Risk Reduction",
    "weight-management": "② Weight Management",
    "glycemic-control": "③ Glycemic Control",
    "lipid": "④ Lipid Management",
    "current-med-review": "⑤ Current Medication Review",
  };
  return labels[cat] || cat;
}

// ============================================================
// NEXT BEST MEDICATION ENGINE — Scoring-based
// Evaluates ALL eligible drugs and ranks them by weighted score
// ============================================================

export interface NextBestMed {
  recommendation: MedRecommendation;
  reasoning: string[];
  clinicalBasis: string;
  alternatives: { drug: string; reason: string; score: number }[];
  score: number;
  scoreBreakdown: { factor: string; value: number; max: number }[];
  smartGoals?: SMARTGoal[];
}

interface ScoredDrug {
  drug: DrugProfile;
  score: number;
  breakdown: { factor: string; value: number; max: number }[];
  reasoning: string[];
  clinicalBasis: string;
}

export interface ContraindicationCheck {
  drug: string;
  isContraindicated: boolean;
  severity: "absolute" | "relative" | "caution" | "none";
  reasons: string[];
  clinicalGuidance: string;
}

function checkContraindications(drug: DrugProfile, patient: PatientData): ContraindicationCheck {
  const reasons: string[] = [];
  let severity: "absolute" | "relative" | "caution" | "none" = "none";

  // === ABSOLUTE CONTRAINDICATIONS (patient history matches drug contraindications) ===
  const absoluteContraindications: Record<string, (p: PatientData) => boolean> = {
    "eGFR <30": (p) => p.eGFR < 30 && drug.contraindications.some(c => c.includes("eGFR <30")),
    "eGFR <45": (p) => p.eGFR < 45 && drug.contraindications.some(c => c.includes("eGFR <45")),
    "eGFR <20": (p) => p.eGFR < 20 && drug.contraindications.some(c => c.includes("eGFR <20")),
    "Type 1 diabetes": (p) => !p.hasT2DM && drug.contraindications.some(c => c.includes("Type 1")),
    "Heart failure": (p) => p.hasHF && drug.contraindications.some(c => c.includes("Heart failure")),
    "NYHA III-IV": (p) => p.hfNYHA >= 3 && drug.contraindications.some(c => c.includes("NYHA")),
  };

  for (const [condition, check] of Object.entries(absoluteContraindications)) {
    if (check(patient)) {
      reasons.push(condition);
      severity = "absolute";
    }
  }

  // === RELATIVE CONTRAINDICATIONS (caution but not absolute) ===
  const relativeContraindications: Record<string, (p: PatientData) => boolean> = {
    "History of pancreatitis": (p) => drug.contraindications.some(c => c.includes("pancreatitis")),
    "Personal/family MTC history": (p) => drug.contraindications.some(c => c.includes("MTC")),
    "MEN2 syndrome": (p) => drug.contraindications.some(c => c.includes("MEN2")),
    "Recurrent UTI/genital infections": (p) => drug.contraindications.some(c => c.includes("UTI") || c.includes("genital")),
    "Severe hepatic impairment": (p) => drug.contraindications.some(c => c.includes("hepatic")),
  };

  if (severity === "none") {
    for (const [condition, check] of Object.entries(relativeContraindications)) {
      if (check(patient)) {
        reasons.push(condition);
        severity = "relative";
      }
    }
  }

  // === CLINICAL CAUTIONS (drug-specific concerns) ===
  const cautions: Array<{ condition: string; check: (p: PatientData) => boolean }> = [
    { condition: "Elderly (≥75) + high hypo risk", check: (p) => p.age >= 75 && drug.hypoRisk === "high" },
    { condition: "Postural hypotension risk", check: (p) => p.hasHypertension && drug.class === "ace-arb" },
    { condition: "Concurrent metformin + eGFR <45", check: (p) => p.eGFR < 45 && isOnDrug(p, "Metformin") && drug.class !== "biguanide" },
  ];

  if (severity === "none") {
    for (const c of cautions) {
      if (c.check(patient)) {
        reasons.push(c.condition);
        if (severity === "none") severity = "caution";
      }
    }
  }

  // === BUILD CLINICAL GUIDANCE ===
  let clinicalGuidance = "";
  if (severity === "absolute") {
    clinicalGuidance = `This drug is contraindicated due to: ${reasons.join(", ")}. Avoid entirely.`;
  } else if (severity === "relative") {
    clinicalGuidance = `Relative contraindication(s): ${reasons.join(", ")}. Use with caution and close monitoring, or consider alternatives.`;
  } else if (severity === "caution") {
    clinicalGuidance = `Clinical caution: ${reasons.join(", ")}. Can be used but requires careful patient counseling and monitoring.`;
  } else {
    clinicalGuidance = `No known contraindications. Safe to use in this patient.`;
  }

  return {
    drug: drug.name,
    isContraindicated: severity === "absolute",
    severity,
    reasons,
    clinicalGuidance,
  };
}

function scoreDrug(drug: DrugProfile, patient: PatientData, pathway: AlgorithmPathway): ScoredDrug | null {
  const breakdown: { factor: string; value: number; max: number }[] = [];
  const reasoning: string[] = [];
  let score = 0;

  // === HARD EXCLUSIONS ===
  // Already on this drug
  if (isOnDrug(patient, drug.generic)) return null;
  // Already on same class (except insulin which can have basal+prandial)
  if (isOnDrugClass(patient, drug.class) && !["basal-insulin", "prandial-insulin"].includes(drug.class)) return null;
  // eGFR too low
  if (patient.eGFR < drug.minEGFR) return null;
  // DPP-4i + GLP-1 RA combo is pointless
  if (drug.class === "dpp4i" && (isOnDrugClass(patient, "glp1ra") || isOnDrugClass(patient, "dual-agonist"))) return null;
  if ((drug.class === "glp1ra" || drug.class === "dual-agonist") && isOnDrugClass(patient, "dpp4i")) {
    // Allow but note DPP-4i should be stopped
    reasoning.push("⚠ Stop current DPP-4i if starting this agent (no additive benefit)");
  }
  // Saxagliptin in HF
  if (drug.generic === "Saxagliptin" && hasHF(patient)) return null;
  // TZD in NYHA III-IV
  if (drug.class === "tzd" && patient.hfNYHA >= 3) return null;
  // Prandial insulin only if on basal
  if (drug.class === "prandial-insulin" && !isOnDrugClass(patient, "basal-insulin")) return null;

  // === PATHWAY ALIGNMENT (0-30 pts) ===
  const maxPathway = 30;
  let pathwayScore = 0;

  if (pathway === "ascvd-predominant") {
    if (drug.cvBenefit && (drug.class === "glp1ra" || drug.class === "dual-agonist")) { pathwayScore = 30; reasoning.push("Directly indicated for ASCVD pathway — GLP-1 RA with proven CV benefit"); }
    else if (drug.cvBenefit && drug.class === "sglt2i") { pathwayScore = 28; reasoning.push("SGLT2i with proven CV benefit for ASCVD"); }
    else if (drug.cvBenefit) { pathwayScore = 15; }
    else { pathwayScore = 5; }
  } else if (pathway === "hf-ckd-predominant") {
    if (drug.class === "sglt2i" && drug.renalBenefit) { pathwayScore = 30; reasoning.push("SGLT2i is the PREFERRED agent for HF/CKD pathway"); }
    else if (drug.class === "glp1ra" && drug.cvBenefit) { pathwayScore = 25; reasoning.push("GLP-1 RA with CV benefit — use if SGLT2i not tolerated"); }
    else if (drug.class === "dual-agonist") { pathwayScore = 24; reasoning.push("Dual agonist provides CV + weight benefit in HF/CKD"); }
    else if (drug.class === "tzd") { pathwayScore = 0; reasoning.push("TZD should be avoided in HF setting"); }
    else { pathwayScore = 5; }
  } else if (pathway === "weight-management") {
    if (drug.class === "dual-agonist") { pathwayScore = 30; reasoning.push("Dual GIP/GLP-1 agonist has highest weight loss efficacy (15-20%)"); }
    else if (drug.class === "glp1ra") { pathwayScore = 27; reasoning.push("GLP-1 RA provides significant weight loss (5-15%)"); }
    else if (drug.class === "sglt2i") { pathwayScore = 20; reasoning.push("SGLT2i provides modest weight loss (2-3 kg)"); }
    else if (drug.weightEffect === "gain") { pathwayScore = 0; reasoning.push("Weight-gaining agent avoided in weight management pathway"); }
    else { pathwayScore = 8; }
  } else if (pathway === "hypo-minimization") {
    if (drug.hypoRisk === "low") { pathwayScore = 25; reasoning.push("Low hypoglycemia risk — appropriate for this pathway"); }
    else if (drug.hypoRisk === "moderate") { pathwayScore = 12; }
    else { pathwayScore = 2; reasoning.push("High hypoglycemia risk — generally avoided unless HbA1c very high"); }
  } else {
    pathwayScore = 10;
  }
  breakdown.push({ factor: "Pathway Alignment", value: pathwayScore, max: maxPathway });
  score += pathwayScore;

  // === HbA1c REDUCTION POWER (0-20 pts) ===
  const maxHba1c = 20;
  const hba1cGap = patient.hba1c - 7.0;
  // Parse reduction range e.g. "1.5-2.0%"
  const reductionMatch = drug.hba1cReduction.match(/([\d.]+)-([\d.]+)/);
  const avgReduction = reductionMatch ? (parseFloat(reductionMatch[1]) + parseFloat(reductionMatch[2])) / 2 : 0;
  // Score higher for drugs that can close the gap
  let hba1cScore = 0;
  if (hba1cGap <= 0) {
    hba1cScore = 5; // At target, mild bonus for any agent
  } else if (avgReduction >= hba1cGap) {
    hba1cScore = 20; // Can fully close the gap
    reasoning.push(`Expected HbA1c reduction (${drug.hba1cReduction}) can close the ${hba1cGap.toFixed(1)}% gap to target`);
  } else {
    hba1cScore = Math.min(18, Math.round((avgReduction / Math.max(hba1cGap, 0.5)) * 18));
  }
  breakdown.push({ factor: "HbA1c Reduction", value: hba1cScore, max: maxHba1c });
  score += hba1cScore;

  // === CV/RENAL BENEFIT (0-15 pts) ===
  const maxCVRenal = 15;
  let cvRenalScore = 0;
  if (drug.cvBenefit && (hasASCVD(patient) || hasHF(patient))) { cvRenalScore += 10; reasoning.push("Proven cardiovascular benefit in a patient with established CV disease"); }
  else if (drug.cvBenefit) { cvRenalScore += 5; }
  if (drug.renalBenefit && hasCKD(patient)) { cvRenalScore += 5; reasoning.push("Renal protective effect in CKD patient"); }
  cvRenalScore = Math.min(cvRenalScore, maxCVRenal);
  breakdown.push({ factor: "CV/Renal Benefit", value: cvRenalScore, max: maxCVRenal });
  score += cvRenalScore;

  // === WEIGHT EFFECT (0-15 pts) ===
  const maxWeight = 15;
  let weightScore = 0;
  if (patient.bmi >= 27) {
    if (drug.weightEffect === "loss") { weightScore = 15; }
    else if (drug.weightEffect === "neutral") { weightScore = 8; }
    else { weightScore = 0; }
  } else if (patient.bmi >= 23) {
    if (drug.weightEffect === "loss") { weightScore = 12; }
    else if (drug.weightEffect === "neutral") { weightScore = 10; }
    else { weightScore = 4; }
  } else {
    if (drug.weightEffect === "neutral") { weightScore = 10; }
    else if (drug.weightEffect === "loss") { weightScore = 8; }
    else { weightScore = 6; }
  }
  breakdown.push({ factor: "Weight Effect", value: weightScore, max: maxWeight });
  score += weightScore;

  // === HYPOGLYCEMIA SAFETY (0-10 pts) ===
  const maxHypo = 10;
  let hypoScore = drug.hypoRisk === "low" ? 10 : drug.hypoRisk === "moderate" ? 5 : 1;
  // Extra penalty if elderly or already on SU/insulin
  if (drug.hypoRisk === "high" && (patient.age >= 65 || isOnDrugClass(patient, "sulfonylurea") || isOnDrugClass(patient, "basal-insulin"))) {
    hypoScore = 0;
    reasoning.push("⚠ High hypo risk compounded by age or concurrent SU/insulin");
  }
  breakdown.push({ factor: "Hypo Safety", value: hypoScore, max: maxHypo });
  score += hypoScore;

  // === ADHERENCE / CONVENIENCE (0-5 pts) ===
  const maxAdherence = 5;
  let adherenceScore = 3;
  const freq = drug.doses[0]?.frequency?.toLowerCase() || "";
  if (freq.includes("weekly")) { adherenceScore = 5; reasoning.push("Weekly dosing improves adherence"); }
  else if (freq.includes("once daily") || freq.includes("od")) { adherenceScore = 4; }
  else if (freq.includes("bd")) { adherenceScore = 3; }
  else if (freq.includes("tds")) { adherenceScore = 2; }
  // Oral vs injectable
  if (drug.class === "glp1ra" || drug.class === "dual-agonist" || drug.class.includes("insulin")) {
    adherenceScore = Math.max(adherenceScore - 1, 0); // Slight penalty for injectables
  }
  breakdown.push({ factor: "Adherence", value: adherenceScore, max: maxAdherence });
  score += adherenceScore;

  // === RENAL SAFETY BONUS (0-5 pts) ===
  const maxRenal = 5;
  let renalScore = 3;
  if (patient.eGFR < 45) {
    if (drug.minEGFR <= 15 && !drug.renalDoseAdjust) { renalScore = 5; reasoning.push("No renal dose adjustment needed despite low eGFR"); }
    else if (drug.renalDoseAdjust) { renalScore = 3; }
    else { renalScore = 2; }
  }
  breakdown.push({ factor: "Renal Safety", value: renalScore, max: maxRenal });
  score += renalScore;

  // === PATIENT CONTEXT INTEGRATION (0-20 pts) ===
  const maxContext = 20;
  let contextScore = 0;

  // CKD Stage-specific optimization
  if (hasCKD(patient)) {
    const ckdStage = getCKDStage(patient.eGFR);
    // SGLT2i is MOST beneficial in CKD3-4 (eGFR 15-60)
    if (drug.class === "sglt2i" && patient.eGFR >= 15 && patient.eGFR < 60) {
      contextScore += 8;
      reasoning.push(`SGLT2i proven renal protective in ${ckdStage} CKD — slows progression`);
    }
    // GLP-1 RA is beneficial but secondary to SGLT2i in CKD
    if (drug.class === "glp1ra" && patient.eGFR >= 30) {
      contextScore += 5;
      reasoning.push(`GLP-1 RA provides CV benefit in ${ckdStage} CKD`);
    }
    // Avoid/penalize agents that worsen renal function
    if (drug.class === "dpp4i" && patient.eGFR < 30) {
      contextScore -= 3;
      reasoning.push("DPP-4i has limited renal benefit in advanced CKD");
    }
  }

  // Heart Failure NYHA stage-specific optimization
  if (hasHF(patient)) {
    const nyhaStage = patient.hfNYHA;
    // SGLT2i is preferred across all NYHA stages (DAPA-HF, EMPEROR)
    if (drug.class === "sglt2i") {
      contextScore += 10;
      reasoning.push(`SGLT2i indicated for HF NYHA ${nyhaStage} — improves outcomes in DAPA-HF/EMPEROR trials`);
    }
    // GLP-1 RA is beneficial but less strongly than SGLT2i in HF
    if (drug.class === "glp1ra" && nyhaStage <= 2) {
      contextScore += 6;
      reasoning.push("GLP-1 RA beneficial in NYHA I-II HF without volume concerns");
    }
    // Penalize drugs that worsen HF
    if (drug.class === "tzd") {
      contextScore -= 5;
      reasoning.push("TZD causes fluid retention — contraindicated in HF");
    }
  }

  // Comorbidity-specific drug matching
  if (patient.hasRetinopathy && (drug.class === "glp1ra" || drug.class === "dual-agonist")) {
    contextScore += 4;
    reasoning.push("GLP-1 RA has retinopathy-protective effect (likely glycemic control benefit)");
  }
  if (patient.hasNeuropathy && drug.class === "sglt2i") {
    contextScore += 3;
    reasoning.push("SGLT2i may help neuropathic pain through improved glycemic control");
  }
  if (patient.hasPAD && (drug.class === "glp1ra" || drug.class === "sglt2i")) {
    contextScore += 4;
    reasoning.push("Both GLP-1 RA and SGLT2i improve CV outcomes in PAD patients");
  }
  if (patient.hasNAFLD && (drug.class === "glp1ra" || drug.class === "tzd")) {
    contextScore += 5;
    reasoning.push("GLP-1 RA (preferred) or TZD can improve NAFLD/NASH resolution");
  }

  // Age-specific considerations
  if (patient.age >= 75) {
    // Prefer agents with lower hypo risk in elderly
    if (drug.hypoRisk === "low") {
      contextScore += 4;
      reasoning.push("Low hypo risk appropriate for elderly patient");
    }
    // Avoid high hypo risk agents in very elderly
    if (drug.hypoRisk === "high") {
      contextScore -= 5;
      reasoning.push("High hypo risk — avoid in patients ≥75 years");
    }
  }

  // Formulation preference (dysphagia consideration)
  if (patient.postStrokeDysphagia && patient.dysphagiaLevel !== "none") {
    // Prefer liquid/dissolvable/injection over large tablets
    if (drug.class === "glp1ra" || drug.class === "dual-agonist") {
      contextScore += 3;
      reasoning.push("Injectable formulation suitable for dysphagia");
    }
    // Metformin tablets can be harder to swallow
    if (drug.generic === "Metformin") {
      contextScore -= 2;
      reasoning.push("Tablet form — consider liquid formulation for dysphagia");
    }
  }

  contextScore = Math.max(0, Math.min(contextScore, maxContext));
  breakdown.push({ factor: "Patient Context", value: contextScore, max: maxContext });
  score += contextScore;

  // === BUILD CLINICAL BASIS ===
  const trialMap: Record<string, string> = {
    "Semaglutide": "SUSTAIN-6, SELECT — proven CV benefit and 5-15% weight loss",
    "Liraglutide": "LEADER — 13% reduction in MACE; also approved for obesity (Saxenda 3.0mg)",
    "Dulaglutide": "REWIND — CV benefit even in primary prevention population",
    "Tirzepatide": "SURPASS (T2DM) & SURMOUNT (obesity) — highest HbA1c reduction (2.0-2.6%) and weight loss (15-20%)",
    "Empagliflozin": "EMPA-REG OUTCOME (CV), EMPEROR-Reduced/Preserved (HF) — proven cardiorenal protection",
    "Dapagliflozin": "DECLARE-TIMI, DAPA-CKD, DAPA-HF — broad cardiorenal evidence base",
    "Canagliflozin": "CANVAS, CREDENCE — CV and renal benefit; monitor foot health",
    "Metformin": "UKPDS — long-term safety and efficacy; foundational T2DM therapy",
    "Insulin Degludec": "DEVOTE — lower nocturnal hypo vs glargine with equivalent CV safety",
    "Insulin Glargine": "ORIGIN — CV-safe; most widely used basal insulin globally",
    "Linagliptin": "CARMELINA, CAROLINA — CV-safe; no renal dose adjustment (biliary excretion)",
    "Sitagliptin": "TECOS — CV-safe; renal dose adjustment available down to eGFR <30",
    "Gliclazide": "ADVANCE — lower hypo risk vs other SUs; preferred SU per ADA",
    "Pioglitazone": "PROactive — modest CV benefit; insulin sensitizer; avoid in HF",
  };
  const clinicalBasis = trialMap[drug.generic] || drug.adaReference;

  return { drug, score, breakdown, reasoning, clinicalBasis };
}

export function getNextBestMedication(patient: PatientData): NextBestMed | null {
  const pathway = getAlgorithmPathway(patient);

  // Score every drug in the database
  const scored: ScoredDrug[] = [];
  for (const drug of DRUG_DB) {
    const result = scoreDrug(drug, patient, pathway);
    if (result && result.score > 0) scored.push(result);
  }

  if (scored.length === 0) return null;

  // Sort by score descending
  scored.sort((a, b) => b.score - a.score);

  const best = scored[0];
  const rec = buildRec(best.drug, patient, best.reasoning[0] || "Best match for patient profile", "first-line",
    pathway === "ascvd-predominant" || pathway === "hf-ckd-predominant" ? "cvkd-risk" :
    pathway === "weight-management" ? "weight-management" : "glycemic-control"
  );

  // Build alternatives from next best options (different classes preferred)
  const seenClasses = new Set<DrugClass>([best.drug.class]);
  const alternatives: { drug: string; reason: string; score: number }[] = [];
  for (const s of scored.slice(1)) {
    if (alternatives.length >= 4) break;
    if (!seenClasses.has(s.drug.class) || alternatives.length < 2) {
      seenClasses.add(s.drug.class);
      alternatives.push({
        drug: s.drug.name,
        reason: s.reasoning[0] || s.drug.adaReference,
        score: s.score,
      });
    }
  }

  // Generate SMART goals based on this recommendation + all recommendations
  const allRecs = generateMedRecommendations(patient);
  const smartGoals = generateSMARTGoals(patient, allRecs);

  return {
    recommendation: rec,
    reasoning: best.reasoning.slice(0, 5),
    clinicalBasis: `${best.clinicalBasis} (Score: ${best.score}/100)`,
    alternatives,
    score: best.score,
    scoreBreakdown: best.breakdown,
    smartGoals,
  };
}

// ============================================================
// PREDIABETES ALGORITHM (AACE 2023)
// IFG (100-125) | IGT (140-199) | A1C (5.7-6.4%) | MetS
// ============================================================

export interface PrediabetesRecommendation {
  category: "lifestyle" | "cv-risk" | "weight-loss-med" | "dysglycemia-med" | "surgery" | "monitoring";
  title: string;
  detail: string;
  isActive: boolean;
  medications?: string[];
  footnote?: string;
}

export function getAllContraindicationChecks(patient: PatientData): ContraindicationCheck[] {
  return DRUG_DB.map(drug => checkContraindications(drug, patient))
    .filter(check => check.severity !== "none")
    .sort((a, b) => {
      const severityOrder = { "absolute": 0, "relative": 1, "caution": 2 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    });
}

export interface SavedRecommendation {
  patientName: string;
  patientAge: number;
  patientGender: string;
  timestamp: string;
  hba1c: number;
  bmi: number;
  eGFR: number;
  pathway: string;
  recommendations: MedRecommendation[];
  nextBest: NextBestMed | null;
  smartGoals: SMARTGoal[];
}

export function exportRecommendationAsJSON(patient: PatientData, meds: MedRecommendation[], nextBest: NextBestMed | null): SavedRecommendation {
  return {
    patientName: patient.name,
    patientAge: patient.age,
    patientGender: patient.gender,
    timestamp: new Date().toISOString(),
    hba1c: patient.hba1c,
    bmi: patient.bmi,
    eGFR: patient.eGFR,
    pathway: getAlgorithmPathway(patient),
    recommendations: meds,
    nextBest,
    smartGoals: nextBest?.smartGoals || [],
  };
}

export function downloadRecommendationsJSON(patient: PatientData, meds: MedRecommendation[], nextBest: NextBestMed | null) {
  const data = exportRecommendationAsJSON(patient, meds, nextBest);
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${patient.name.replace(/\s+/g, "_")}_recommendations_${new Date().toLocaleDateString().replace(/\//g, "-")}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function generateRecommendationText(patient: PatientData, meds: MedRecommendation[], nextBest: NextBestMed | null): string {
  const lines: string[] = [];
  lines.push("=" .repeat(60));
  lines.push("MEDICATION RECOMMENDATIONS");
  lines.push("=" .repeat(60));
  lines.push("");

  lines.push("PATIENT INFORMATION");
  lines.push("-".repeat(60));
  lines.push(`Name: ${patient.name}`);
  lines.push(`Age: ${patient.age} years (${patient.gender})`);
  lines.push(`BMI: ${patient.bmi} kg/m²`);
  lines.push(`HbA1c: ${patient.hba1c}%`);
  lines.push(`eGFR: ${patient.eGFR} mL/min/1.73m²`);
  lines.push(`Heart Failure (NYHA): ${patient.hfNYHA}`);
  lines.push("");

  if (nextBest) {
    lines.push("NEXT BEST MEDICATION (HIGHEST PRIORITY)");
    lines.push("-".repeat(60));
    lines.push(`Drug: ${nextBest.recommendation.drug}`);
    lines.push(`Class: ${nextBest.recommendation.drugClass}`);
    lines.push(`Dose: ${nextBest.recommendation.dose} ${nextBest.recommendation.frequency}`);
    lines.push(`Expected HbA1c Reduction: ${nextBest.recommendation.hba1cReduction}`);
    lines.push(`Cardiovascular Benefit: ${nextBest.recommendation.cvBenefit ? "Yes" : "No"}`);
    lines.push(`Weight Effect: ${nextBest.recommendation.weightEffect}`);
    lines.push(`Score: ${nextBest.score}/100`);
    lines.push("");

    if (nextBest.recommendation.clinicalExplanation) {
      lines.push("Why This Drug Is Optimal:");
      lines.push(nextBest.recommendation.clinicalExplanation);
      lines.push("");
    }

    if (nextBest.smartGoals && nextBest.smartGoals.length > 0) {
      lines.push("BEHAVIORAL GOALS");
      lines.push("-".repeat(60));
      nextBest.smartGoals.slice(0, 6).forEach((goal, i) => {
        lines.push(`${i + 1}. ${goal.title}`);
        lines.push(`   Goal: ${goal.goal}`);
        lines.push(`   Specific: ${goal.specific}`);
        lines.push(`   Measurable: ${goal.measurable}`);
        lines.push(`   Timeframe: ${goal.timeframe}`);
        lines.push("");
      });
    }
  }

  if (meds.length > 0) {
    lines.push("COMPLETE MEDICATION RECOMMENDATIONS");
    lines.push("-".repeat(60));
    meds.forEach((med, i) => {
      lines.push(`${i + 1}. ${med.drug} (${med.drugClass})`);
      lines.push(`   Dose: ${med.dose} ${med.frequency}`);
      lines.push(`   Priority: ${med.priority}`);
      lines.push(`   Reason: ${med.reason}`);
      lines.push(`   HbA1c Reduction: ${med.hba1cReduction}`);
      if (med.warnings.length > 0) {
        lines.push(`   Warnings: ${med.warnings.join("; ")}`);
      }
      lines.push("");
    });
  }

  lines.push("=" .repeat(60));
  lines.push(`Generated: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`);
  lines.push(`Disclaimer: This is AI-assisted clinical decision support based on ADA 2026 guidelines.`);
  lines.push(`Always consult with qualified healthcare providers before making treatment decisions.`);
  lines.push("=" .repeat(60));

  return lines.join("\n");
}

export function downloadRecommendationsText(patient: PatientData, meds: MedRecommendation[], nextBest: NextBestMed | null) {
  const text = generateRecommendationText(patient, meds, nextBest);
  const blob = new Blob([text], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${patient.name.replace(/\s+/g, "_")}_recommendations_${new Date().toLocaleDateString().replace(/\//g, "-")}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function generatePrediabetesRecommendations(patient: PatientData): {
  isPrediabetic: boolean;
  isOverweight: boolean;
  recommendations: PrediabetesRecommendation[];
  goals: string[];
  pathway: "overweight" | "normal-weight" | "not-prediabetic";
} {
  const hba1c = patient.hba1c;
  const fbs = patient.fbs;
  const bmi = patient.bmi;
  const isPrediabetic = (hba1c >= 5.7 && hba1c <= 6.4) || (fbs >= 100 && fbs <= 125);
  const isOverweight = bmi >= 25 || (bmi >= 23); // Asian cutoff

  if (!isPrediabetic) {
    return {
      isPrediabetic: false,
      isOverweight: bmi >= 23,
      recommendations: [],
      goals: [],
      pathway: "not-prediabetic",
    };
  }

  const pathway = isOverweight ? "overweight" : "normal-weight";
  const recs: PrediabetesRecommendation[] = [];
  const goals: string[] = [
    "Prevent progression to type 2 diabetes",
    "Prevent progression of NAFLD",
    "Improve CVD risk factors",
    "Prevent excess weight gain and promote weight loss",
    "Improve functionality and quality of life",
  ];

  // LIFESTYLE INTERVENTION — always
  recs.push({
    category: "lifestyle",
    title: "Lifestyle Intervention",
    detail: "Nutrition counseling, physical activity (150 min/week moderate), sleep hygiene, healthy habits. Target ≥7% weight loss.",
    isActive: true,
  });

  // CV RISK REDUCTION — always
  recs.push({
    category: "cv-risk",
    title: "Cardiovascular Risk Reduction",
    detail: "Similar targets to T2D: excess weight reduction, blood pressure control (<130/80), lipid management (LDL targets per risk).",
    isActive: true,
  });

  if (isOverweight) {
    // OVERWEIGHT/OBESITY BRANCH
    recs.push({
      category: "weight-loss-med",
      title: "Weight Loss Medications",
      detail: `BMI ${bmi} — Goal: weight loss >7-10%. GLP-1 RA approved for weight loss in obesity/overweight with ABCD complications including prediabetes.`,
      isActive: true,
      medications: [
        "GLP-1 RA (Semaglutide 2.4mg weekly / Liraglutide 3.0mg daily)",
        "Phentermine / Topiramate ER",
        "Naltrexone-ER / Bupropion-ER",
        "Orlistat",
      ],
      footnote: "Indications: obesity or overweight BMI >27 kg/m² with ABCD complication(s) including prediabetes.",
    });

    // Persistent hyperglycemia check
    if (fbs > 100 || hba1c > 5.9) {
      recs.push({
        category: "dysglycemia-med",
        title: "Persistent Hyperglycemia — Additional Pharmacotherapy",
        detail: `FPG ${fbs} mg/dL, HbA1c ${hba1c}% — If lifestyle + weight-loss meds insufficient, consider dysglycemia-specific agents.`,
        isActive: true,
        medications: ["Metformin 500-2000mg/day", "Pioglitazone 15-30mg/day", "Acarbose 25-100mg TDS"],
      });
    }

    // Bariatric surgery consideration
    const asianBMI = bmi >= 32.5;
    const standardBMI = bmi >= 35;
    if (standardBMI || asianBMI) {
      recs.push({
        category: "surgery",
        title: "Consider Bariatric Surgery",
        detail: `BMI ${bmi} ${asianBMI && !standardBMI ? "(Asian threshold ≥32.5)" : "≥35"} — Consider if non-surgical methods insufficient for durable weight loss.`,
        isActive: bmi >= 40 || bmi >= 37.5,
        footnote: "ADA/AACE: Metabolic surgery recommended for BMI ≥40 (≥37.5 Asian) or BMI ≥35 (≥32.5 Asian) with inadequate non-surgical response.",
      });
    }
  } else {
    // NORMAL WEIGHT BRANCH — treat dysglycemia
    recs.push({
      category: "dysglycemia-med",
      title: "Treat Dysglycemia",
      detail: "Not overweight — focus on glycemic control to prevent progression to overt diabetes.",
      isActive: true,
      medications: ["Metformin 500-2000mg/day", "Pioglitazone 15-30mg/day", "Acarbose 25-100mg TDS"],
    });
  }

  // Monitoring — always
  recs.push({
    category: "monitoring",
    title: "Ongoing Monitoring",
    detail: "Recheck HbA1c and FPG every 3-6 months. Screen for overt diabetes annually. Monitor CVD risk factors.",
    isActive: true,
  });

  return { isPrediabetic, isOverweight, recommendations: recs, goals, pathway };
}
