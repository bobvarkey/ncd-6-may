// ============================================================
// OBESITY GUIDELINES - BMI and WHtR Thresholds
// ADA Standards of Care in Diabetes—2025 (Section 8)
// Reference: https://diabetesjournals.org/care/article/49/Supplement_1/S166/163915
// ============================================================

export type EthnicityType = "standard" | "asian-pacific" | "indian";
export type BmiCategory = "underweight" | "normal" | "overweight" | "obese";
export type RiskLevel = "underweight" | "healthy" | "increased" | "high";

export interface BmiThreshold {
  max: number;
  category: BmiCategory;
  label: string;
  color: string;
}

export interface EthnicityGuideline {
  id: EthnicityType;
  name: string;
  description: string;
  thresholds: BmiThreshold[];
}

export const ETHNICITY_GUIDELINES: EthnicityGuideline[] = [
  {
    id: "standard",
    name: "Standard WHO",
    description: "For Europid, African, and other non-Asian populations",
    thresholds: [
      { max: 18.5, category: "underweight", label: "Underweight", color: "text-yellow-500" },
      { max: 25, category: "normal", label: "Normal", color: "text-emerald-500" },
      { max: 30, category: "overweight", label: "Overweight", color: "text-amber-500" },
      { max: 35, category: "obese", label: "Obese Class I", color: "text-orange-500" },
      { max: 40, category: "obese", label: "Obese Class II", color: "text-red-500" },
      { max: Infinity, category: "obese", label: "Obese Class III", color: "text-destructive" },
    ],
  },
  {
    id: "asian-pacific",
    name: "WHO Asian-Pacific",
    description: "For East Asian, Southeast Asian, and Pacific populations",
    thresholds: [
      { max: 18.5, category: "underweight", label: "Underweight", color: "text-yellow-500" },
      { max: 23, category: "normal", label: "Normal", color: "text-emerald-500" },
      { max: 25, category: "overweight", label: "Overweight/At Risk", color: "text-amber-500" },
      { max: 27.5, category: "obese", label: "Obese Class I", color: "text-orange-500" },
      { max: Infinity, category: "obese", label: "Obese Class II+", color: "text-red-500" },
    ],
  },
  {
    id: "indian",
    name: "Indian-Specific (ICMR)",
    description: "For South Asian/Indian populations with higher metabolic risk",
    thresholds: [
      { max: 18.5, category: "underweight", label: "Underweight", color: "text-yellow-500" },
      { max: 22.9, category: "normal", label: "Normal", color: "text-emerald-500" },
      { max: 24.9, category: "overweight", label: "Overweight", color: "text-amber-500" },
      { max: 29.9, category: "obese", label: "Obese", color: "text-orange-500" },
      { max: Infinity, category: "obese", label: "Severely Obese", color: "text-red-500" },
    ],
  },
];

export interface WhtrCategory {
  max: number;
  riskLevel: RiskLevel;
  label: string;
  color: string;
  action: string;
}

export const WHTR_CATEGORIES: WhtrCategory[] = [
  { max: 0.4, riskLevel: "underweight", label: "Underweight", color: "text-yellow-500", action: "Nutritional assessment recommended" },
  { max: 0.5, riskLevel: "healthy", label: "Healthy", color: "text-emerald-500", action: "Maintain current lifestyle" },
  { max: 0.6, riskLevel: "increased", label: "Increased Risk", color: "text-amber-500", action: "Lifestyle modification recommended" },
  { max: Infinity, riskLevel: "high", label: "High Risk", color: "text-red-500", action: "Intensive intervention required" },
];

export interface WaistThreshold {
  gender: "male" | "female";
  ethnicity: "standard" | "asian";
  threshold: number;
  label: string;
}

export const WAIST_THRESHOLDS: WaistThreshold[] = [
  { gender: "male", ethnicity: "standard", threshold: 94, label: "Central obesity" },
  { gender: "female", ethnicity: "standard", threshold: 80, label: "Central obesity" },
  { gender: "male", ethnicity: "asian", threshold: 90, label: "Central obesity" },
  { gender: "female", ethnicity: "asian", threshold: 80, label: "Central obesity" },
];

// ============================================================
// ADA 2025 WEIGHT LOSS TARGETS (Recommendation 8.5)
// ============================================================

export interface WeightLossTarget {
  percentage: string;
  grade: "A" | "B" | "C";
  benefits: string[];
}

export const WEIGHT_LOSS_TARGETS: WeightLossTarget[] = [
  {
    percentage: "3–7%",
    grade: "A",
    benefits: [
      "Improves glycemia, blood pressure, and lipids",
      "Reduces need for glucose-lowering medications",
      "Reduces progression from prediabetes to diabetes in at-risk individuals",
    ],
  },
  {
    percentage: ">10%",
    grade: "B",
    benefits: [
      "Confers greater cardiometabolic benefits",
      "Possible remission of type 2 diabetes (disease-modifying effects)",
      "May improve long-term cardiovascular outcomes and mortality",
      "Improves adipose tissue inflammation and quality of life",
    ],
  },
  {
    percentage: ">15%",
    grade: "B",
    benefits: [
      "Additional benefits for cardiovascular outcomes",
      "Improves metabolic dysfunction-associated steatohepatitis (MASH)",
      "Improves sleep apnea severity",
      "Enhanced quality of life improvements",
    ],
  },
  {
    percentage: ">20%",
    grade: "A",
    benefits: [
      "Achieved with metabolic surgery",
      "Substantial cardiometabolic improvements",
      "High rates of diabetes remission (83-86% at 5 years)",
    ],
  },
];

// ============================================================
// ADA 2025 PHARMACOTHERAPY (Recommendation 8.17 - Grade A)
// ============================================================

export interface PharmacotherapyAgent {
  name: string;
  class: string;
  dosage: string;
  weightLoss: string;
  a1cReduction: string;
  preferred: boolean;
  notes: string[];
}

export const PREFERRED_PHARMACOTHERAPY: PharmacotherapyAgent[] = [
  {
    name: "Tirzepatide",
    class: "Dual GIP/GLP-1 receptor agonist",
    dosage: "5mg, 10mg, or 15mg SC weekly",
    weightLoss: "14.7% (15mg) to 12.8% (10mg) - SURMOUNT-2",
    a1cReduction: "1.55-1.57% more than placebo",
    preferred: true,
    notes: [
      "Preferred agent per ADA 2025",
      "Higher efficacy than GLP-1 RAs alone",
      "Weight loss typically lower in people with diabetes vs without",
    ],
  },
  {
    name: "Semaglutide",
    class: "GLP-1 receptor agonist",
    dosage: "2.4mg SC weekly (obesity dose)",
    weightLoss: "~6.2% more than placebo - STEP 2",
    a1cReduction: "1.2% more than placebo",
    preferred: true,
    notes: [
      "Preferred agent per ADA 2025",
      "Proven CV benefit (SUSTAIN-6)",
      "Continue long-term; discontinuation causes regain",
    ],
  },
  {
    name: "Liraglutide",
    class: "GLP-1 receptor agonist",
    dosage: "3.0mg SC daily",
    weightLoss: "~8% average",
    a1cReduction: "~1.0-1.5%",
    preferred: true,
    notes: [
      "Preferred agent per ADA 2025",
      "Daily injection vs weekly for semaglutide",
      "Proven CV benefit (LEADER)",
    ],
  },
];

export const OTHER_PHARMACOTHERAPY: PharmacotherapyAgent[] = [
  {
    name: "Orlistat",
    class: "Lipase inhibitor",
    dosage: "120mg TID with meals",
    weightLoss: "2.9% more than placebo",
    a1cReduction: "0.3-0.8%",
    preferred: false,
    notes: [
      "Available widely including India",
      "Take multivitamin at bedtime (fat-soluble vitamin malabsorption)",
      "GI side effects common",
    ],
  },
  {
    name: "Phentermine-Topiramate",
    class: "Sympathomimetic/anticonvulsant",
    dosage: "7.5/46mg to 15/92mg daily",
    weightLoss: "7-10%",
    a1cReduction: "Variable",
    preferred: false,
    notes: [
      "Contraindicated in pregnancy (teratogenic)",
      "Requires negative pregnancy test before starting",
    ],
  },
  {
    name: "Naltrexone-Bupropion",
    class: "Opioid antagonist/NDRI",
    dosage: "16/180mg BID",
    weightLoss: "5-8%",
    a1cReduction: "0.5-1.0%",
    preferred: false,
    notes: [
      "Avoid in uncontrolled hypertension",
      "Monitor for neuropsychiatric effects",
    ],
  },
];

// ============================================================
// ADA 2025 METABOLIC SURGERY (Recommendation 8.21 - Grade A)
// ============================================================

export interface MetabolicSurgeryGuideline {
  procedure: string;
  bmiThresholdStandard: number;
  bmiThresholdAsian: number;
  weightLoss1yr: string;
  weightLoss5yr: string;
  diabetesRemission5yr: string;
  medianDiseaseFreeYears: number;
  notes: string[];
}

export const METABOLIC_SURGERY: MetabolicSurgeryGuideline[] = [
  {
    procedure: "Roux-en-Y Gastric Bypass (RYGB)",
    bmiThresholdStandard: 30,
    bmiThresholdAsian: 27.5,
    weightLoss1yr: "~29%",
    weightLoss5yr: "~24%",
    diabetesRemission5yr: "86.1%",
    medianDiseaseFreeYears: 8.3,
    notes: [
      "Gold standard procedure",
      "Reduces microvascular disease incidence",
      "Decreases all-cause mortality",
      "Requires lifelong nutritional monitoring",
    ],
  },
  {
    procedure: "Vertical Sleeve Gastrectomy (VSG)",
    bmiThresholdStandard: 30,
    bmiThresholdAsian: 27.5,
    weightLoss1yr: "~23%",
    weightLoss5yr: "~16%",
    diabetesRemission5yr: "83.5%",
    medianDiseaseFreeYears: 8.3,
    notes: [
      "Most common procedure currently",
      "Preserves anatomy (no intestinal bypass)",
      "GLP-1 RAs can augment post-surgical weight loss",
    ],
  },
];

// ============================================================
// ADA 2025 TREATMENT MONITORING
// ============================================================

export const TREATMENT_MONITORING = {
  earlyResponse: {
    timeframe: "3 months",
    target: ">5% weight loss",
    interpretation: "Early response predicts long-term success",
  },
  longTermTherapy: {
    continuation: "Continue beyond reaching goals",
    discontinuationWarning: "Sudden discontinuation results in regain of 50-66% of weight within 1 year",
    note: "Obesity is a chronic disease requiring long-term management",
  },
};

export interface TreatmentGuideline {
  bmiMin: number;
  bmiMax: number;
  ethnicity?: EthnicityType;
  recommendations: string[];
  medications?: string[];
  surgeryConsideration?: boolean;
}

// ADA 2025 Source: American Diabetes Association Professional Practice Committee.
// 8. Obesity and weight management for the prevention and treatment of type 2 diabetes:
// Standards of Care in Diabetes—2025. Diabetes Care 2025;48(Suppl. 1):S167–S180.
// URL: https://diabetesjournals.org/care/article/49/Supplement_1/S166/163915
export const ADA_2025_CITATION = "ADA Standards of Care in Diabetes—2025. Diabetes Care 2025;48(Suppl. 1):S167–S180";

export const TREATMENT_GUIDELINES: TreatmentGuideline[] = [
  {
    bmiMin: 0,
    bmiMax: 18.5,
    recommendations: [
      "Nutritional assessment for underweight",
      "Rule out underlying conditions (malabsorption, eating disorders, hyperthyroidism)",
      "Refer to dietitian for healthy weight gain plan",
    ],
  },
  {
    bmiMin: 18.5,
    bmiMax: 24.9,
    recommendations: [
      "Maintain healthy lifestyle",
      "Regular physical activity (150-300 min/week)",
      "Balanced diet (Mediterranean/DASH patterns)",
      "Annual weight monitoring",
    ],
  },
  {
    bmiMin: 25,
    bmiMax: 29.9,
    ethnicity: "standard",
    recommendations: [
      "Weight loss goal: 5-10% over 3-6 months (Grade A)",
      "Caloric deficit: 500-750 kcal/day",
      "Physical activity: 150-300 min/week moderate intensity",
      "Behavioral interventions: self-monitoring, goal setting",
      "Screen for comorbidities (HTN, T2DM, dyslipidemia)",
      "ADA 2025: Aim for >10% for greater cardiometabolic benefits",
    ],
  },
  {
    bmiMin: 23,
    bmiMax: 24.9,
    ethnicity: "asian-pacific",
    recommendations: [
      "Weight loss goal: 5-10% over 3-6 months (earlier intervention for Asian populations)",
      "Caloric deficit: 500-750 kcal/day",
      "Physical activity: 150-300 min/week",
      "Emphasize waist circumference assessment (higher visceral fat risk)",
      "Screen for metabolic syndrome components",
    ],
  },
  {
    bmiMin: 23,
    bmiMax: 24.9,
    ethnicity: "indian",
    recommendations: [
      "Weight loss goal: 5-10% over 3-6 months",
      "Higher metabolic risk at lower BMI - prioritize diabetes screening",
      "Emphasize carbohydrate quality (low glycemic index foods)",
      "Monitor for glucose intolerance even with 'normal' BMI",
      "Physical activity: 150-300 min/week + resistance training",
    ],
  },
  {
    bmiMin: 30,
    bmiMax: 34.9,
    ethnicity: "standard",
    recommendations: [
      "Weight loss goal: >10% over 6 months (Grade B - disease-modifying effects)",
      "Intensive lifestyle intervention",
      "Consider pharmacotherapy if lifestyle alone insufficient",
      "Screen and treat all obesity-related comorbidities",
      "ADA 2025: Consider metabolic surgery if BMI ≥30.0 kg/m² (Grade A)",
    ],
    medications: [
      "Tirzepatide (15mg: 14.7% weight loss) - PREFERRED",
      "Semaglutide 2.4mg weekly - PREFERRED",
      "Liraglutide 3.0mg daily - PREFERRED",
      "Orlistat 120mg TID",
    ],
  },
  {
    bmiMin: 25,
    bmiMax: 27.4,
    ethnicity: "asian-pacific",
    recommendations: [
      "Weight loss goal: 10% over 6 months",
      "Consider pharmacotherapy at BMI ≥25 with metabolic syndrome",
      "Intensive lifestyle intervention",
      "Monitor HbA1c, lipids, blood pressure",
    ],
    medications: ["Orlistat", "Liraglutide 3.0mg (if available)"],
  },
  {
    bmiMin: 25,
    bmiMax: 29.9,
    ethnicity: "indian",
    recommendations: [
      "Weight loss goal: 10% over 6 months",
      "Strong consideration for pharmacotherapy at BMI ≥25",
      "Intensive lifestyle intervention with cultural dietary adaptations",
      "Aggressive management of metabolic comorbidities",
      "Consider bariatric surgery if BMI ≥30 with uncontrolled T2DM",
    ],
    medications: ["Orlistat (widely available)", "Liraglutide 3.0mg", "Metformin if prediabetic"],
  },
  {
    bmiMin: 35,
    bmiMax: 39.9,
    ethnicity: "standard",
    recommendations: [
      "Weight loss goal: 15% over 6-12 months",
      "Pharmacotherapy recommended",
      "Consider bariatric surgery if comorbidities present",
      "Multidisciplinary team approach",
    ],
    medications: ["Orlistat", "Liraglutide 3.0mg", "Phentermine-topiramate (where approved)"],
    surgeryConsideration: true,
  },
  {
    bmiMin: 27.5,
    bmiMax: 32.4,
    ethnicity: "asian-pacific",
    recommendations: [
      "Weight loss goal: 15% over 6-12 months",
      "Pharmacotherapy recommended",
      "Consider bariatric surgery if BMI ≥32.5 with T2DM or metabolic syndrome",
      "Multidisciplinary team approach",
    ],
    medications: ["Orlistat", "Liraglutide 3.0mg", "Naltrexone-bupropion (if available)"],
    surgeryConsideration: true,
  },
  {
    bmiMin: 30,
    bmiMax: 32.4,
    ethnicity: "indian",
    recommendations: [
      "Weight loss goal: 15% over 6-12 months",
      "Pharmacotherapy strongly recommended",
      "Consider bariatric surgery if BMI ≥30 with poorly controlled T2DM",
      "Multidisciplinary team approach with endocrinologist referral",
    ],
    medications: ["Orlistat", "Liraglutide 3.0mg", "Consider GLP-1 agonists"],
    surgeryConsideration: true,
  },
  {
    bmiMin: 40,
    bmiMax: Infinity,
    ethnicity: "standard",
    recommendations: [
      "Weight loss goal: 20% over 12 months",
      "Bariatric surgery referral indicated",
      "Pre-surgical evaluation required",
      "Long-term follow-up essential",
    ],
    surgeryConsideration: true,
  },
  {
    bmiMin: 32.5,
    bmiMax: Infinity,
    ethnicity: "asian-pacific",
    recommendations: [
      "Weight loss goal: 20% over 12 months",
      "Bariatric surgery referral indicated at BMI ≥32.5",
      "Pre-surgical evaluation required",
      "Long-term follow-up essential",
    ],
    surgeryConsideration: true,
  },
  {
    bmiMin: 32.5,
    bmiMax: Infinity,
    ethnicity: "indian",
    recommendations: [
      "Weight loss goal: 20% over 12 months",
      "Bariatric surgery referral indicated at BMI ≥32.5 (or ≥30 with uncontrolled T2DM)",
      "Pre-surgical evaluation required",
      "Long-term follow-up essential",
    ],
    surgeryConsideration: true,
  },
];

// Helper functions
export function getBmiCategory(bmi: number, ethnicity: EthnicityType): BmiThreshold {
  const guideline = ETHNICITY_GUIDELINES.find((g) => g.id === ethnicity);
  if (!guideline) throw new Error(`Unknown ethnicity: ${ethnicity}`);

  for (const threshold of guideline.thresholds) {
    if (bmi < threshold.max) return threshold;
  }
  return guideline.thresholds[guideline.thresholds.length - 1];
}

// Normalise a threshold boundary for display: thresholds stored as X.9
// (e.g. 22.9, 24.9, 29.9) represent the conceptual boundary X+0.1 (23, 25, 30).
function displayBoundary(max: number): number {
  if (Number.isFinite(max) && Math.round(max * 10) % 10 === 9) {
    return Math.round((max + 0.1) * 10) / 10;
  }
  return max;
}

export interface BmiClassificationConfidence {
  level: "high" | "moderate" | "low";
  label: string;
  percent: number; // 0-100
  note: string;
}

export interface BmiClassificationDetail {
  rangeLabel: string; // "18.5 – 24.9 kg/m²" / "17.0 – 18.4 kg/m²" / "≥ 30.0 kg/m²"
  rangeMin: number; // 0 if unbounded below
  rangeMax: number; // Infinity if unbounded above
  confidence: BmiClassificationConfidence;
}

// Returns the matched BMI range (with thinness sub-grade for underweight) and a
// confidence estimate based on how far the value sits from the nearest category
// boundary. Values near a boundary are flagged "Borderline"; mid-range values are
// "Confident".
export function getBmiClassificationDetail(
  bmi: number,
  ethnicity: EthnicityType
): BmiClassificationDetail {
  const guideline = ETHNICITY_GUIDELINES.find((g) => g.id === ethnicity);
  if (!guideline) throw new Error(`Unknown ethnicity: ${ethnicity}`);

  let idx = guideline.thresholds.findIndex((t) => bmi < t.max);
  if (idx === -1) idx = guideline.thresholds.length - 1;
  const threshold = guideline.thresholds[idx];
  const rawLower = idx === 0 ? 0 : guideline.thresholds[idx - 1].max;
  const rawUpper = threshold.max;
  const lower = displayBoundary(rawLower);
  const upper = displayBoundary(rawUpper);

  // Range label
  let rangeLabel: string;
  if (threshold.category === "underweight") {
    const grade = getUnderweightGrade(bmi);
    rangeLabel = grade ? `${grade.range}` : "< 18.5 kg/m²";
  } else if (!Number.isFinite(upper)) {
    rangeLabel = `≥ ${lower.toFixed(1)} kg/m²`;
  } else {
    rangeLabel = `${lower.toFixed(1)} – ${upper.toFixed(1)} kg/m²`;
  }

  // Confidence: distance to nearest conceptual boundary.
  const boundaries = guideline.thresholds
    .map((t) => t.max)
    .filter((m) => Number.isFinite(m))
    .map((m) => displayBoundary(m));
  const dist = Math.min(...boundaries.map((b) => Math.abs(bmi - b)));
  const percent = Math.round(Math.min(98, 50 + dist * 24));
  let confidence: BmiClassificationConfidence;
  if (percent >= 80) {
    confidence = {
      level: "high",
      label: "Confident",
      percent,
      note: "Value sits well within the matched category — classification is robust.",
    };
  } else if (percent >= 65) {
    confidence = {
      level: "moderate",
      label: "Moderate",
      percent,
      note: "Value is within the category but relatively near a boundary.",
    };
  } else {
    confidence = {
      level: "low",
      label: "Borderline",
      percent,
      note: "Value is very close to a category boundary — recheck with a precise measurement; the category may shift with small changes.",
    };
  }

  return {
    rangeLabel,
    rangeMin: lower,
    rangeMax: upper,
    confidence,
  };
}

export interface UnderweightGrade {
  key: "mild" | "moderate" | "severe";
  label: string;
  range: string;
  note: string;
}

export const UNDERWEIGHT_GRADES: UnderweightGrade[] = [
  { key: "mild", label: "Mild thinness", range: "17.0 – 18.4 kg/m²", note: "Borderline low weight — screen for nutritional adequacy and recent unintentional loss." },
  { key: "moderate", label: "Moderate thinness", range: "16.0 – 16.9 kg/m²", note: "Increased risk of morbidity — nutritional assessment and work-up for underlying causes." },
  { key: "severe", label: "Severe thinness", range: "Below 16.0 kg/m²", note: "High risk — urgent nutritional support and evaluation for malabsorption, malignancy, or eating disorder." },
];

export function getUnderweightGrade(bmi: number): UnderweightGrade | null {
  if (bmi <= 0 || bmi >= 18.5) return null;
  if (bmi >= 17.0) return UNDERWEIGHT_GRADES[0];
  if (bmi >= 16.0) return UNDERWEIGHT_GRADES[1];
  return UNDERWEIGHT_GRADES[2];
}

export function getWhtrCategory(whtr: number): WhtrCategory {
  for (const category of WHTR_CATEGORIES) {
    if (whtr < category.max) return category;
  }
  return WHTR_CATEGORIES[WHTR_CATEGORIES.length - 1];
}

export function getWaistThreshold(gender: "male" | "female", ethnicity: "standard" | "asian"): number {
  const threshold = WAIST_THRESHOLDS.find(
    (t) => t.gender === gender && t.ethnicity === ethnicity
  );
  return threshold?.threshold || (gender === "male" ? 94 : 80);
}

export function getTreatmentGuidelines(
  bmi: number,
  ethnicity: EthnicityType
): TreatmentGuideline | undefined {
  // First try to find exact ethnicity match
  let guideline = TREATMENT_GUIDELINES.find(
    (g) =>
      bmi >= g.bmiMin &&
      bmi < g.bmiMax &&
      g.ethnicity === ethnicity
  );

  // Fallback to standard if no ethnicity-specific guideline found
  if (!guideline && ethnicity !== "standard") {
    guideline = TREATMENT_GUIDELINES.find(
      (g) => bmi >= g.bmiMin && bmi < g.bmiMax && g.ethnicity === "standard"
    );
  }

  // Final fallback - any matching BMI range
  if (!guideline) {
    guideline = TREATMENT_GUIDELINES.find(
      (g) => bmi >= g.bmiMin && bmi < g.bmiMax && !g.ethnicity
    );
  }

  return guideline;
}
