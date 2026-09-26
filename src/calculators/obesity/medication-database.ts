// ============================================================
// OBESITY MEDICATION DATABASE
// Combined from htn-detective-kit and diabetes-buddy
// Includes: Antihypertensives, Diabetes meds with obesity focus,
// and dedicated anti-obesity medications
// ============================================================

export type DrugClass =
  | "anti-obesity"
  | "sglt2i"
  | "glp1ra"
  | "dual-agonist"
  | "biguanide"
  | "dpp4i"
  | "acei"
  | "arb"
  | "ccb"
  | "thiazide"
  | "mra"
  | "beta-blocker"
  | "statin";

export interface Medication {
  name: string;
  genericName: string;
  class: DrugClass;
  brandNames: string[];
  indications: string[];
  doses: { label: string; dose: string; frequency: string; notes?: string }[];
  contraindications: string[];
  warnings: string[];
  sideEffects: string[];
  efficacyNotes: string;
  specialPopulations?: {
    asian?: string;
    indian?: string;
    elderly?: string;
    renal?: string;
    hepatic?: string;
  };
}

// ============================================================
// ANTI-OBESITY MEDICATIONS (Dedicated weight management)
// ============================================================

export const ANTI_OBESITY_MEDICATIONS: Medication[] = [
  {
    name: "Orlistat",
    genericName: "Orlistat",
    class: "anti-obesity",
    brandNames: ["Xenical (120mg)", "Alli (60mg OTC)"],
    indications: ["Obesity (BMI ≥30)", "Overweight (BMI ≥27) with comorbidities"],
    doses: [
      { label: "Standard", dose: "120mg", frequency: "TDS with meals", notes: "Take during or up to 1 hour after meal" },
      { label: "OTC", dose: "60mg", frequency: "TDS with meals" },
    ],
    contraindications: [
      "Chronic malabsorption syndromes",
      "Cholestasis",
      "Pregnancy/Breastfeeding",
      "Hypersensitivity to orlistat",
    ],
    warnings: [
      "May decrease absorption of fat-soluble vitamins (A, D, E, K) - supplement",
      "Rare severe liver injury reported",
      "Oxalate nephropathy risk",
    ],
    sideEffects: [
      "Oily spotting",
      "Flatus with discharge",
      "Fecal urgency",
      "Fatty/oily stools",
      "Fecal incontinence",
    ],
    efficacyNotes: "3-5% weight loss at 1 year. Most widely available anti-obesity agent globally, including India/South Asia.",
    specialPopulations: {
      asian: "Same dosing; may have higher GI side effect incidence",
      indian: "Widely available in India; take with multivitamin at bedtime",
      elderly: "Use caution; monitor nutritional status",
    },
  },
  {
    name: "Liraglutide (Saxenda)",
    genericName: "Liraglutide",
    class: "anti-obesity",
    brandNames: ["Saxenda"],
    indications: ["Obesity (BMI ≥30)", "Overweight (BMI ≥27) with comorbidities"],
    doses: [
      { label: "Week 1", dose: "0.6mg", frequency: "Daily SC", notes: "Titration to reduce GI side effects" },
      { label: "Week 2", dose: "1.2mg", frequency: "Daily SC" },
      { label: "Week 3", dose: "1.8mg", frequency: "Daily SC" },
      { label: "Week 4", dose: "2.4mg", frequency: "Daily SC" },
      { label: "Target", dose: "3.0mg", frequency: "Daily SC", notes: "Max dose for obesity" },
    ],
    contraindications: [
      "Personal/family history of medullary thyroid carcinoma (MTC)",
      "MEN2 syndrome",
      "Pregnancy/Breastfeeding",
      "History of pancreatitis",
    ],
    warnings: [
      "Boxed warning: Thyroid C-cell tumors in rodents (human relevance unknown)",
      "Acute pancreatitis risk",
      "Gallbladder disease",
      "Increased heart rate",
      "Suicidal behavior and ideation",
    ],
    sideEffects: [
      "Nausea (very common - 40%)",
      "Vomiting",
      "Diarrhea",
      "Constipation",
      "Injection site reactions",
      "Headache",
    ],
    efficacyNotes: "8-12% weight loss at 1 year. SCALE trials demonstrated significant weight reduction.",
    specialPopulations: {
      asian: "May achieve comparable weight loss at lower BMI thresholds",
      indian: "Availability limited; check insurance coverage",
    },
  },
  {
    name: "Semaglutide (Wegovy)",
    genericName: "Semaglutide",
    class: "anti-obesity",
    brandNames: ["Wegovy"],
    indications: ["Obesity (BMI ≥30)", "Overweight (BMI ≥27) with comorbidities"],
    doses: [
      { label: "Month 1", dose: "0.25mg", frequency: "Weekly SC" },
      { label: "Month 2", dose: "0.5mg", frequency: "Weekly SC" },
      { label: "Month 3", dose: "1.0mg", frequency: "Weekly SC" },
      { label: "Month 4", dose: "1.7mg", frequency: "Weekly SC" },
      { label: "Maintenance", dose: "2.4mg", frequency: "Weekly SC", notes: "Max dose" },
    ],
    contraindications: [
      "Personal/family history of MTC",
      "MEN2 syndrome",
      "Pregnancy/Breastfeeding",
      "History of pancreatitis",
    ],
    warnings: [
      "Boxed warning: Thyroid C-cell tumors",
      "Acute pancreatitis",
      "Acute gallbladder disease",
      "Hypoglycemia risk with insulin/secretagogues",
      "Suicidal ideation",
    ],
    sideEffects: [
      "Nausea (44%)",
      "Diarrhea (30%)",
      "Vomiting (24%)",
      "Constipation (24%)",
      "Abdominal pain",
      "Injection site reactions",
    ],
    efficacyNotes: "15-17% weight loss at 1 year. STEP trials showed superior efficacy. Available in limited markets.",
  },
  {
    name: "Tirzepatide (Zepbound)",
    genericName: "Tirzepatide",
    class: "anti-obesity",
    brandNames: ["Zepbound"],
    indications: ["Obesity (BMI ≥30)", "Overweight (BMI ≥27) with comorbidities"],
    doses: [
      { label: "Month 1", dose: "2.5mg", frequency: "Weekly SC" },
      { label: "Month 2", dose: "5mg", frequency: "Weekly SC" },
      { label: "Month 3", dose: "7.5mg", frequency: "Weekly SC" },
      { label: "Month 4", dose: "10mg", frequency: "Weekly SC" },
      { label: "Optional", dose: "12.5mg", frequency: "Weekly SC" },
      { label: "Max", dose: "15mg", frequency: "Weekly SC" },
    ],
    contraindications: [
      "Personal/family history of MTC",
      "MEN2 syndrome",
      "Pregnancy/Breastfeeding",
      "History of pancreatitis",
    ],
    warnings: [
      "Boxed warning: Thyroid C-cell tumors",
      "Acute pancreatitis",
      "Gallbladder disease",
      "Hypoglycemia with insulin/secretagogues",
    ],
    sideEffects: [
      "Nausea",
      "Diarrhea",
      "Vomiting",
      "Constipation",
      "Decreased appetite",
    ],
    efficacyNotes: "20-22% weight loss at 1 year. SURMOUNT trials showed highest efficacy of approved agents.",
  },
  {
    name: "Naltrexone-Bupropion (Contrave)",
    genericName: "Naltrexone/Bupropion",
    class: "anti-obesity",
    brandNames: ["Contrave"],
    indications: ["Obesity (BMI ≥30)", "Overweight (BMI ≥27) with comorbidities"],
    doses: [
      { label: "Week 1", dose: "8/90mg", frequency: "Morning only" },
      { label: "Week 2", dose: "8/90mg", frequency: "BID (morning & evening)" },
      { label: "Week 3", dose: "16/180mg", frequency: "Morning + 8/90mg evening" },
      { label: "Maintenance", dose: "16/180mg", frequency: "BID", notes: "Two 8/90mg tablets AM, one PM" },
    ],
    contraindications: [
      "Uncontrolled hypertension",
      "Seizure disorder",
      "Bulimia/anorexia",
      "Abrupt alcohol/benzodiazepine/barbiturate discontinuation",
      "Chronic opioid use or acute opiate withdrawal",
      "MAO inhibitor use within 14 days",
      "Pregnancy",
    ],
    warnings: [
      "Suicidal thoughts and behaviors (bupropion component)",
      "Neuropsychiatric reactions",
      "Increase in BP and HR",
      "Hepatotoxicity (naltrexone)",
    ],
    sideEffects: [
      "Nausea",
      "Headache",
      "Constipation",
      "Vomiting",
      "Dizziness",
      "Insomnia",
      "Dry mouth",
    ],
    efficacyNotes: "5-8% weight loss at 1 year. CONQUER trials demonstrated efficacy.",
  },
  {
    name: "Phentermine-Topiramate (Qsymia)",
    genericName: "Phentermine/Topiramate",
    class: "anti-obesity",
    brandNames: ["Qsymia"],
    indications: ["Obesity (BMI ≥30)", "Overweight (BMI ≥27) with comorbidities"],
    doses: [
      { label: "Start", dose: "3.75/23mg", frequency: "Daily × 14 days" },
      { label: "Standard", dose: "7.5/46mg", frequency: "Daily" },
      { label: "Max", dose: "15/92mg", frequency: "Daily" },
    ],
    contraindications: [
      "Pregnancy (teratogenic) - negative pregnancy test required",
      "Glaucoma",
      "Hyperthyroidism",
      "MAO inhibitor use within 14 days",
    ],
    warnings: [
      "Fetal toxicity - REMS program required",
      "Increased heart rate",
      "Suicidal thoughts (topiramate)",
      "Cognitive impairment",
      "Metabolic acidosis",
      "Acute myopia/secondary angle closure glaucoma",
    ],
    sideEffects: [
      "Paresthesia (tingling)",
      "Dry mouth",
      "Constipation",
      "Dysgeusia (altered taste)",
      "Insomnia",
      "Dizziness",
    ],
    efficacyNotes: "10-12% weight loss at 1 year. EQUIP/CONQUER trials.",
  },
];

// ============================================================
// GLUCOSE-LOWERING MEDICATIONS WITH WEIGHT BENEFIT
// ============================================================

export const DIABETES_MEDICATIONS: Medication[] = [
  {
    name: "Semaglutide (Ozempic)",
    genericName: "Semaglutide",
    class: "glp1ra",
    brandNames: ["Ozempic"],
    indications: ["Type 2 Diabetes", "ASCVD risk reduction"],
    doses: [
      { label: "Start", dose: "0.25mg", frequency: "Weekly SC × 4 weeks" },
      { label: "Step-up", dose: "0.5mg", frequency: "Weekly SC × 4 weeks" },
      { label: "Target", dose: "1.0mg", frequency: "Weekly SC" },
      { label: "Max", dose: "2.0mg", frequency: "Weekly SC" },
    ],
    contraindications: [
      "Personal/family history of MTC",
      "MEN2 syndrome",
      "Pregnancy/Breastfeeding",
      "History of pancreatitis",
    ],
    warnings: [
      "Thyroid C-cell tumors (boxed warning)",
      "Pancreatitis",
      "Diabetic retinopathy complications",
      "Hypoglycemia with insulin/secretagogues",
    ],
    sideEffects: [
      "Nausea",
      "Vomiting",
      "Diarrhea",
      "Abdominal pain",
      "Constipation",
    ],
    efficacyNotes: "HbA1c ↓ 1.5-1.8%, Weight ↓ 4-6kg. SUSTAIN trials. Proven CV benefit (SUSTAIN-6).",
    specialPopulations: {
      asian: "Effective across ethnic groups; weight loss may be comparable",
      indian: "Available in India; cost may limit access",
      renal: "No renal dose adjustment needed; safe in CKD",
    },
  },
  {
    name: "Tirzepatide (Mounjaro)",
    genericName: "Tirzepatide",
    class: "dual-agonist",
    brandNames: ["Mounjaro"],
    indications: ["Type 2 Diabetes"],
    doses: [
      { label: "Start", dose: "2.5mg", frequency: "Weekly SC × 4 weeks" },
      { label: "Step-up 1", dose: "5mg", frequency: "Weekly SC × 4 weeks" },
      { label: "Step-up 2", dose: "7.5mg", frequency: "Weekly SC" },
      { label: "Step-up 3", dose: "10mg", frequency: "Weekly SC" },
      { label: "Max", dose: "15mg", frequency: "Weekly SC" },
    ],
    contraindications: [
      "Personal/family history of MTC",
      "MEN2 syndrome",
      "Pregnancy/Breastfeeding",
      "History of pancreatitis",
    ],
    warnings: [
      "Thyroid C-cell tumors (boxed warning)",
      "Pancreatitis",
      "Hypoglycemia with insulin/secretagogues",
    ],
    sideEffects: [
      "Nausea",
      "Diarrhea",
      "Decreased appetite",
      "Vomiting",
      "Constipation",
      "Dyspepsia",
      "Abdominal pain",
    ],
    efficacyNotes: "HbA1c ↓ 2.0-2.3%, Weight ↓ 8-12kg. SURPASS trials showed superior glycemic and weight efficacy.",
    specialPopulations: {
      asian: "SURPASS trials included Asian populations with good efficacy",
      indian: "Availability expanding",
    },
  },
  {
    name: "Empagliflozin (Jardiance)",
    genericName: "Empagliflozin",
    class: "sglt2i",
    brandNames: ["Jardiance"],
    indications: ["Type 2 Diabetes", "HFpEF/HFrEF", "CKD"],
    doses: [
      { label: "Start", dose: "10mg", frequency: "Once daily morning" },
      { label: "Max", dose: "25mg", frequency: "Once daily morning" },
    ],
    contraindications: [
      "eGFR <20 mL/min/1.73m²",
      "Type 1 DM (relative)",
      "Severe hepatic impairment",
    ],
    warnings: [
      "Euglycemic DKA",
      "Volume depletion",
      "Genital mycotic infections",
      "UTI",
      "Necrotizing fasciitis of perineum (rare)",
    ],
    sideEffects: [
      "Urinary tract infection",
      "Female genital mycotic infections",
      "Upper respiratory infection",
      "Increased urination",
      "Dyslipidemia",
    ],
    efficacyNotes: "HbA1c ↓ 0.7-1.0%, Weight ↓ 2-3kg. EMPA-REG: CV mortality reduction. EMPEROR: HF benefit. CKD benefit.",
    specialPopulations: {
      asian: "Effective; monitor volume status",
      indian: "Genital infection risk may be higher - patient education important",
      renal: "Continue until eGFR <20",
    },
  },
  {
    name: "Metformin",
    genericName: "Metformin",
    class: "biguanide",
    brandNames: ["Glucophage", "Glucophage XR"],
    indications: ["Type 2 Diabetes", "Prediabetes", "PCOS"],
    doses: [
      { label: "Start", dose: "500mg", frequency: "Once daily with dinner" },
      { label: "Titrate", dose: "500mg", frequency: "BID (week 2)" },
      { label: "Target", dose: "1000mg", frequency: "BID", notes: "Max 2550mg/day" },
    ],
    contraindications: [
      "eGFR <30 mL/min/1.73m²",
      "Acute/chronic metabolic acidosis",
      "Severe hepatic impairment",
      "Severe hypoxic states",
    ],
    warnings: [
      "Lactic acidosis (rare but serious)",
      "Vitamin B12 deficiency (monitor annually)",
      "Suspend before iodinated contrast if eGFR <60",
    ],
    sideEffects: [
      "Diarrhea",
      "Nausea",
      "Vomiting",
      "Flatulence",
      "Abdominal discomfort",
      "Metallic taste",
    ],
    efficacyNotes: "HbA1c ↓ 1.0-1.5%, Weight neutral or slight loss. First-line T2DM per ADA/EASD.",
    specialPopulations: {
      asian: "Higher GI side effects; start low, go slow",
      indian: "Widely available; preferred first-line",
      elderly: "Start 250mg daily; monitor renal function",
      renal: "Contraindicated if eGFR <30; max 1000mg/day if eGFR 30-45",
    },
  },
];

// ============================================================
// ANTIHYPERTENSIVE MEDICATIONS
// ============================================================

export const ANTIHYPERTENSIVE_MEDICATIONS: Medication[] = [
  {
    name: "Amlodipine",
    genericName: "Amlodipine",
    class: "ccb",
    brandNames: ["Norvasc"],
    indications: ["Hypertension", "Coronary artery disease", "Angina"],
    doses: [
      { label: "Start", dose: "2.5-5mg", frequency: "Once daily" },
      { label: "Max", dose: "10mg", frequency: "Once daily" },
    ],
    contraindications: [
      "Severe aortic stenosis",
      "Cardiogenic shock",
      "Hypersensitivity to dihydropyridine CCBs",
    ],
    warnings: [
      "Peripheral edema (dose-dependent)",
      "Gingival hyperplasia",
      "Hypotension",
      "Worsening angina on initiation (rare)",
    ],
    sideEffects: [
      "Peripheral edema",
      "Dizziness",
      "Flushing",
      "Palpitations",
      "Fatigue",
    ],
    efficacyNotes: "Effective first-line agent. Preferred in Black patients and elderly. Weight neutral.",
    specialPopulations: {
      asian: "May achieve adequate response at lower doses; monitor for edema",
      indian: "Edema risk higher; consider ACEi/ARB combination",
      elderly: "Start 2.5mg; peripheral edema more common",
    },
  },
  {
    name: "Ramipril",
    genericName: "Ramipril",
    class: "acei",
    brandNames: ["Altace"],
    indications: ["Hypertension", "Post-MI", "HF", "Nephropathy", "High CV risk (HOPE trial)"],
    doses: [
      { label: "Start", dose: "2.5mg", frequency: "Once daily" },
      { label: "Maintenance", dose: "5-10mg", frequency: "Once daily" },
      { label: "Max", dose: "20mg", frequency: "Once daily or divided BID" },
    ],
    contraindications: [
      "Angioedema history with ACEi",
      "Hereditary/idiopathic angioedema",
      "Pregnancy (teratogenic)",
      "Bilateral renal artery stenosis",
    ],
    warnings: [
      "Angioedema (rare but serious)",
      "Hyperkalemia",
      "Hypotension",
      "Cough (10-20% - switch to ARB)",
      "Elevated creatinine (expected; acceptable up to 30%)",
    ],
    sideEffects: [
      "Cough",
      "Dizziness",
      "Hyperkalemia",
      "Increased creatinine",
      "Angioedema (rare)",
    ],
    efficacyNotes: "HOPE trial: CV event reduction. Renoprotective. Preferred in diabetes with albuminuria.",
    specialPopulations: {
      asian: "Higher ACEi cough incidence; consider ARB alternative",
      indian: "Preferred in diabetes; monitor potassium",
      renal: "May use until dialysis; titrate carefully",
    },
  },
  {
    name: "Losartan",
    genericName: "Losartan",
    class: "arb",
    brandNames: ["Cozaar"],
    indications: ["Hypertension", "Diabetic nephropathy", "HF with ACEi intolerance", "Post-MI"],
    doses: [
      { label: "Start", dose: "25-50mg", frequency: "Once daily" },
      { label: "Maintenance", dose: "50-100mg", frequency: "Once daily or divided BID" },
    ],
    contraindications: [
      "Pregnancy (teratogenic)",
      "Bilateral renal artery stenosis",
    ],
    warnings: [
      "Hyperkalemia",
      "Hypotension",
      "Elevated creatinine",
    ],
    sideEffects: [
      "Dizziness",
      "Hyperkalemia",
      "Hypotension",
      "Fatigue",
    ],
    efficacyNotes: "RENAAL trial: Renoprotection in T2DM. No cough. Alternative to ACEi.",
    specialPopulations: {
      asian: "Effective alternative to ACEi (lower cough risk)",
      indian: "Widely available; good tolerability",
    },
  },
  {
    name: "Chlorthalidone",
    genericName: "Chlorthalidone",
    class: "thiazide",
    brandNames: ["Thalitone"],
    indications: ["Hypertension", "Edema"],
    doses: [
      { label: "Start", dose: "12.5mg", frequency: "Once daily" },
      { label: "Standard", dose: "25mg", frequency: "Once daily" },
      { label: "Max", dose: "50mg", frequency: "Once daily" },
    ],
    contraindications: [
      "Anuria",
      "Sulfonamide allergy",
    ],
    warnings: [
      "Electrolyte disturbances (hypokalemia, hyponatremia)",
      "Hyperuricemia/gout",
      "Hyperglycemia",
      "Photosensitivity",
    ],
    sideEffects: [
      "Hypokalemia",
      "Hyponatremia",
      "Dizziness",
      "Hyperglycemia",
      "Hyperuricemia",
    ],
    efficacyNotes: "ALLHAT trial: Superior CV outcomes vs. ACEi and CCB. Long half-life (40-60h).",
    specialPopulations: {
      asian: "Higher hyponatremia risk in elderly Asians",
      indian: "Preferred thiazide; check electrolytes",
      elderly: "Start 12.5mg; high hyponatremia risk",
    },
  },
  {
    name: "Spironolactone",
    genericName: "Spironolactone",
    class: "mra",
    brandNames: ["Aldactone"],
    indications: ["Resistant hypertension", "Heart failure", "Primary aldosteronism", "Hirsutism"],
    doses: [
      { label: "Resistant HTN", dose: "25mg", frequency: "Once daily" },
      { label: "HF", dose: "25mg", frequency: "Once daily", notes: "Titrate to 50mg" },
    ],
    contraindications: [
      "eGFR <30 (relative)",
      "Hyperkalemia",
      "Addison disease",
    ],
    warnings: [
      "Hyperkalemia (monitor closely)",
      "Gynecomastia",
      "Menstrual irregularities",
    ],
    sideEffects: [
      "Hyperkalemia",
      "Gynecomastia",
      "Breast tenderness",
      "Menstrual irregularities",
      "Diarrhea",
    ],
    efficacyNotes: "PATHWAY-2: Most effective 4th-line agent for resistant HTN. RALES: HF mortality benefit.",
    specialPopulations: {
      renal: "Use caution if eGFR 30-60; avoid if eGFR <30 without close monitoring",
    },
  },
];

// ============================================================
// EXPORT ALL MEDICATIONS BY CATEGORY
// ============================================================

export const ALL_MEDICATIONS = {
  antiObesity: ANTI_OBESITY_MEDICATIONS,
  diabetes: DIABETES_MEDICATIONS,
  antihypertensive: ANTIHYPERTENSIVE_MEDICATIONS,
};

export function getMedicationsByClass(drugClass: DrugClass): Medication[] {
  return Object.values(ALL_MEDICATIONS)
    .flat()
    .filter((med) => med.class === drugClass);
}

export function getMedicationsByIndication(indication: string): Medication[] {
  return Object.values(ALL_MEDICATIONS)
    .flat()
    .filter((med) => med.indications.some((ind) => ind.toLowerCase().includes(indication.toLowerCase())));
}
