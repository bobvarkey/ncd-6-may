// ── Field configuration for each calculator ──

export interface FieldDef {
  /** Unique key used as callback identifier */
  key: string;
  /** Display label shown in the parser UI */
  label: string;
  /** Unit hint shown next to the field */
  unit?: string;
  /** Keywords to scan for in OCR/free-text (case-insensitive) */
  keywords: string[];
  /** Regex to extract value — must have one capture group for the number */
  regex: RegExp;
  /** Optional: value transform (e.g., convert units) */
  transform?: (val: number) => number;
}

export interface CalculatorFields {
  id: string;
  label: string;
  fields: FieldDef[];
}

// ── Iron Replacement ──
export const IRON_FIELDS: CalculatorFields = {
  id: "iron",
  label: "Iron Replacement Calculator",
  fields: [
    { key: "ferritin", label: "Ferritin", unit: "ng/mL", keywords: ["ferritin", "fer"], regex: /ferritin[:\s]*([\d.]+)/i },
    { key: "hemoglobin", label: "Hemoglobin", unit: "g/dL", keywords: ["hemoglobin", "haemoglobin", "hb", "hgb"], regex: /hemoglobin[:\s]*([\d.]+)|[Hh]b[:\s]*([\d.]+)|HGB[:\s]*([\d.]+)/ },
    { key: "weight", label: "Weight", unit: "kg", keywords: ["weight", "wt", "body weight"], regex: /weight[:\s]*([\d.]+)/i },
    { key: "tsat", label: "TSAT", unit: "%", keywords: ["tsat", "transferrin saturation", "iron saturation"], regex: /(?:TSAT|transferrin saturation|iron saturation)[:\s]*([\d.]+)/i },
    { key: "serumIron", label: "Serum Iron", unit: "µg/dL", keywords: ["serum iron", "serum fe", "iron", "fe"], regex: /serum iron[:\s]*([\d.]+)|serum fe[:\s]*([\d.]+)|iron[:\s]*([\d.]+)/i },
    { key: "tibc", label: "TIBC", unit: "µg/dL", keywords: ["tibc", "total iron binding capacity"], regex: /tibc[:\s]*([\d.]+)/i },
  ],
};

// ── Thyroid ──
export const THYROID_FIELDS: CalculatorFields = {
  id: "thyroid",
  label: "Thyroid Evaluation Calculator",
  fields: [
    { key: "tsh", label: "TSH", unit: "mIU/L", keywords: ["tsh", "thyroid stimulating hormone", "thyrotropin"], regex: /tsh[:\s]*([\d.]+)/i },
    { key: "ft4", label: "Free T4", unit: "ng/dL", keywords: ["free t4", "ft4", "fT4", "free thyroxine"], regex: /(?:free t4|ft4|fT4|free thyroxine)[:\s]*([\d.]+)/i },
    { key: "ft3", label: "T3", unit: "ng/dL", keywords: ["t3", "free t3", "ft3", "triiodothyronine"], regex: /(?:free t3|ft3|fT3|triiodothyronine|t3)[:\s]*([\d.]+)/i },
    { key: "age", label: "Age", unit: "years", keywords: ["age", "years old"], regex: /age[:\s]*([\d]+)/i },
    { key: "weight", label: "Weight", unit: "kg", keywords: ["weight", "wt"], regex: /weight[:\s]*([\d.]+)/i },
  ],
};

// ── Diabetes ──
export const DIABETES_FIELDS: CalculatorFields = {
  id: "diabetes",
  label: "Diabetes Calculator",
  fields: [
    { key: "hba1c", label: "HbA1c", unit: "%", keywords: ["hba1c", "a1c", "hb a1c", "hemoglobin a1c", "glycated hemoglobin"], regex: /(?:hba1c|a1c|hb a1c|hemoglobin a1c|glycated hemoglobin)[:\s]*([\d.]+)/i },
    { key: "fastingGlucose", label: "Fasting Glucose", unit: "mg/dL", keywords: ["fasting glucose", "fbs", "fasting blood sugar", "glucose fasting"], regex: /(?:fasting glucose|fbs|fasting blood sugar|glucose fasting)[:\s]*([\d]+)/i },
    { key: "postprandialGlucose", label: "Postprandial Glucose", unit: "mg/dL", keywords: ["postprandial", "ppbs", "post meal", "2 hour glucose", "after meal"], regex: /(?:postprandial|ppbs|post meal|2.hour)[:\s]*([\d]+)/i },
    { key: "egfr", label: "eGFR", unit: "mL/min/1.73m²", keywords: ["egfr", "e gfr", "gfr", "estimated gfr"], regex: /(?:egfr|e.gfr|gfr|estimated gfr)[:\s]*([\d.]+)/i },
    { key: "creatinine", label: "Creatinine", unit: "mg/dL", keywords: ["creatinine", "cr", "s.creatinine", "serum creatinine"], regex: /(?:creatinine|serum creatinine)[:\s]*([\d.]+)/i },
    { key: "weight", label: "Weight", unit: "kg", keywords: ["weight", "wt"], regex: /weight[:\s]*([\d.]+)/i },
    { key: "ldl", label: "LDL", unit: "mg/dL", keywords: ["ldl", "ldl cholesterol", "ldl-c"], regex: /(?:ldl|ldl cholesterol|ldl-c)[:\s]*([\d]+)/i },
    { key: "triglycerides", label: "Triglycerides", unit: "mg/dL", keywords: ["triglycerides", "tg", "trig"], regex: /(?:triglycerides|tg|trig)[:\s]*([\d]+)/i },
  ],
};

// ── Hypertension ──
export const HTN_FIELDS: CalculatorFields = {
  id: "hypertension",
  label: "Hypertension Calculator",
  fields: [
    { key: "sbp", label: "Systolic BP", unit: "mm Hg", keywords: ["systolic", "sbp", "systolic bp", "bp systolic"], regex: /(?:systolic|sbp)[:\s]*([\d]{2,3})/i },
    { key: "dbp", label: "Diastolic BP", unit: "mm Hg", keywords: ["diastolic", "dbp", "diastolic bp", "bp diastolic"], regex: /(?:diastolic|dbp)[:\s]*([\d]{2,3})/i },
    { key: "age", label: "Age", unit: "years", keywords: ["age", "years old"], regex: /age[:\s]*([\d]+)/i },
    { key: "weight", label: "Weight", unit: "kg", keywords: ["weight", "wt"], regex: /weight[:\s]*([\d.]+)/i },
    { key: "creatinine", label: "Creatinine", unit: "mg/dL", keywords: ["creatinine", "cr", "serum creatinine"], regex: /(?:creatinine|serum creatinine)[:\s]*([\d.]+)/i },
    { key: "egfr", label: "eGFR", unit: "mL/min/1.73m²", keywords: ["egfr", "e gfr", "gfr"], regex: /(?:egfr|e.gfr|gfr)[:\s]*([\d.]+)/i },
    { key: "potassium", label: "Potassium", unit: "mEq/L", keywords: ["potassium", "k+", "k", "serum potassium"], regex: /(?:potassium|serum potassium|k\+)[:\s]*([\d.]+)/i },
  ],
};

// ── Lipids ──
export const LIPID_FIELDS: CalculatorFields = {
  id: "lipids",
  label: "Lipids Calculator",
  fields: [
    { key: "ldl", label: "LDL", unit: "mg/dL", keywords: ["ldl", "ldl cholesterol", "ldl-c"], regex: /(?:ldl|ldl cholesterol|ldl-c)[:\s]*([\d]+)/i },
    { key: "hdl", label: "HDL", unit: "mg/dL", keywords: ["hdl", "hdl cholesterol", "hdl-c"], regex: /(?:hdl|hdl cholesterol|hdl-c)[:\s]*([\d]+)/i },
    { key: "totalCholesterol", label: "Total Cholesterol", unit: "mg/dL", keywords: ["total cholesterol", "tc", "cholesterol total"], regex: /(?:total cholesterol|tc|cholesterol)[:\s]*([\d]+)/i },
    { key: "triglycerides", label: "Triglycerides", unit: "mg/dL", keywords: ["triglycerides", "tg", "trig"], regex: /(?:triglycerides|tg|trig)[:\s]*([\d]+)/i },
    { key: "nonHdl", label: "Non-HDL", unit: "mg/dL", keywords: ["non hdl", "non-hdl", "nonhdl"], regex: /(?:non.hdl|nonhdl)[:\s]*([\d]+)/i },
    { key: "age", label: "Age", unit: "years", keywords: ["age", "years old"], regex: /age[:\s]*([\d]+)/i },
    { key: "sbp", label: "Systolic BP", unit: "mm Hg", keywords: ["systolic", "sbp"], regex: /(?:systolic|sbp)[:\s]*([\d]{2,3})/i },
  ],
};

// ── Anemia / CBC ──
export const CBC_FIELDS: CalculatorFields = {
  id: "anemia",
  label: "Anemia / CBC Calculator",
  fields: [
    { key: "hgb", label: "Hemoglobin", unit: "g/dL", keywords: ["hemoglobin", "haemoglobin", "hb", "hgb"], regex: /(?:hemoglobin|haemoglobin|hb|hgb)[:\s]*([\d.]+)/i },
    { key: "rbc", label: "RBC Count", unit: "M/µL", keywords: ["rbc", "red blood cell", "red cell count"], regex: /(?:rbc|red blood cell|red cell count)[:\s]*([\d.]+)/i },
    { key: "mcv", label: "MCV", unit: "fL", keywords: ["mcv", "mean corpuscular volume"], regex: /mcv[:\s]*([\d.]+)/i },
    { key: "mch", label: "MCH", unit: "pg", keywords: ["mch", "mean corpuscular hemoglobin"], regex: /mch[:\s]*([\d.]+)/i },
    { key: "mchc", label: "MCHC", unit: "g/dL", keywords: ["mchc", "mean corpuscular hemoglobin conc"], regex: /mchc[:\s]*([\d.]+)/i },
    { key: "rdw", label: "RDW", unit: "%", keywords: ["rdw", "red cell distribution width"], regex: /rdw[:\s]*([\d.]+)/i },
    { key: "hct", label: "Hematocrit", unit: "%", keywords: ["hematocrit", "haematocrit", "hct", "pcv"], regex: /(?:hematocrit|haematocrit|hct|pcv)[:\s]*([\d.]+)/i },
    { key: "platelet", label: "Platelets", unit: "K/µL", keywords: ["platelet", "plt", "thrombocyte", "platelet count"], regex: /(?:platelet|plt|platelet count)[:\s]*([\d,]+)/i },
    { key: "wbc", label: "WBC", unit: "K/µL", keywords: ["wbc", "white blood cell", "total count", "tc"], regex: /(?:wbc|white blood cell|total count|tc)[:\s]*([\d.]+)/i },
  ],
};

// ── Liver / LFT ──
export const LIVER_FIELDS: CalculatorFields = {
  id: "liver",
  label: "Liver Auto-Calculator",
  fields: [
    { key: "age", label: "Age", unit: "years", keywords: ["age", "years old"], regex: /age[:\s]*([\d]+)/i },
    { key: "sex", label: "Sex", unit: "", keywords: ["sex", "gender"], regex: /(?:sex|gender)[:\s]*([MmFf])|\b([Mm]ale|[Ff]emale)\b/i },
    { key: "bmi", label: "BMI", unit: "", keywords: ["bmi", "body mass index"], regex: /bmi[:\s]*([\d.]+)/i },
    { key: "ast", label: "AST", unit: "U/L", keywords: ["ast", "sgot", "aspartate aminotransferase"], regex: /(?:ast|sgot|aspartate aminotransferase)[:\s]*([\d,.]+)/i },
    { key: "alt", label: "ALT", unit: "U/L", keywords: ["alt", "sgpt", "alanine aminotransferase"], regex: /(?:alt|sgpt|alanine aminotransferase)[:\s]*([\d,.]+)/i },
    { key: "alp", label: "ALP", unit: "U/L", keywords: ["alp", "alkaline phosphatase", "alk phos"], regex: /(?:alp|alkaline phosphatase|alk phos)[:\s]*([\d,.]+)/i },
    { key: "ggt", label: "GGT", unit: "U/L", keywords: ["ggt", "gamma gt", "gamma glutamyl transferase"], regex: /(?:ggt|gamma.?glutamyl|gamma gt)[:\s]*([\d,.]+)/i },
    { key: "bili", label: "Bilirubin", unit: "mg/dL", keywords: ["bilirubin", "bili", "total bilirubin"], regex: /(?:total bilirubin|bilirubin|bili)[:\s]*([\d.]+)/i },
    { key: "alb", label: "Albumin", unit: "g/dL", keywords: ["albumin", "alb", "serum albumin"], regex: /(?:albumin|serum albumin|alb)[:\s]*([\d.]+)/i },
    { key: "plt", label: "Platelets", unit: "K/µL", keywords: ["platelet", "plt", "platelet count"], regex: /(?:platelet|plt|platelet count)[:\s]*([\d,]+)/i },
    { key: "inr", label: "INR", unit: "", keywords: ["inr", "international normalized ratio"], regex: /(?:inr|international normalized ratio)[:\s]*([\d.]+)/i },
    { key: "creatinine", label: "Creatinine", unit: "mg/dL", keywords: ["creatinine", "cr", "serum creatinine"], regex: /(?:creatinine|serum creatinine)[:\s]*([\d.]+)/i },
    { key: "sodium", label: "Sodium", unit: "mEq/L", keywords: ["sodium", "na", "serum sodium"], regex: /(?:sodium|serum sodium|na\+?)[:\s]*([\d.]+)/i },
  ],
};

// ── Renal Dosing ──
export const RENAL_FIELDS: CalculatorFields = {
  id: "renal-dosing",
  label: "Renal Dose Adjustment",
  fields: [
    { key: "egfr", label: "eGFR", unit: "mL/min/1.73m²", keywords: ["egfr", "e gfr", "gfr", "estimated gfr"], regex: /(?:egfr|e.gfr|gfr|estimated gfr)[:\s]*([\d.]+)/i },
    { key: "creatinine", label: "Creatinine", unit: "mg/dL", keywords: ["creatinine", "cr", "s.creatinine", "serum creatinine"], regex: /(?:creatinine|serum creatinine)[:\s]*([\d.]+)/i },
    { key: "bun", label: "BUN", unit: "mg/dL", keywords: ["bun", "blood urea nitrogen", "urea"], regex: /(?:bun|blood urea nitrogen|urea)[:\s]*([\d.]+)/i },
    { key: "potassium", label: "Potassium", unit: "mEq/L", keywords: ["potassium", "k+", "k", "serum potassium"], regex: /(?:potassium|serum potassium|k\+)[:\s]*([\d.]+)/i },
    { key: "weight", label: "Weight", unit: "kg", keywords: ["weight", "wt"], regex: /weight[:\s]*([\d.]+)/i },
  ],
};

// ── Obesity ──
export const OBESITY_FIELDS: CalculatorFields = {
  id: "obesity",
  label: "Obesity / GLP-1 Calculator",
  fields: [
    { key: "weight", label: "Weight", unit: "kg", keywords: ["weight", "wt", "body weight"], regex: /weight[:\s]*([\d.]+)/i },
    { key: "height", label: "Height", unit: "cm", keywords: ["height", "ht", "body height"], regex: /height[:\s]*([\d.]+)/i },
    { key: "bmi", label: "BMI", unit: "", keywords: ["bmi", "body mass index"], regex: /bmi[:\s]*([\d.]+)/i },
    { key: "waist", label: "Waist Circumference", unit: "cm", keywords: ["waist", "waist circumference", "abdominal girth"], regex: /(?:waist|waist circumference)[:\s]*([\d.]+)/i },
    { key: "hba1c", label: "HbA1c", unit: "%", keywords: ["hba1c", "a1c", "hb a1c"], regex: /(?:hba1c|a1c|hb a1c)[:\s]*([\d.]+)/i },
  ],
};

// ── Master list ──
export const ALL_CALCULATOR_FIELDS: CalculatorFields[] = [
  IRON_FIELDS,
  THYROID_FIELDS,
  DIABETES_FIELDS,
  HTN_FIELDS,
  LIPID_FIELDS,
  CBC_FIELDS,
  LIVER_FIELDS,
  RENAL_FIELDS,
  OBESITY_FIELDS,
];
