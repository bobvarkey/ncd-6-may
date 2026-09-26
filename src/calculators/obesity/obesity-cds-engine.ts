// ============================================================
// OBESITY CDS ENGINE — Structured Clinical Decision Support
// Extends the ObesityAssessmentDecision with:
//   - Weight loss effects (5-7%, ≥10%, ≥15%, ≥20%)
//   - Lifestyle prescription (energy deficit, kcal targets)
//   - Micronutrient risk (screening flags, nutrient list)
//   - Pharmacotherapy eligibility (BMI + comorbidities)
// ============================================================

// ─── Weight Loss Effects ─────────────────────────────────────

export interface WeightLossEffects {
  baseline_weight_kg: number;
  current_weight_kg: number;
  percent_weight_loss: number;
  meets_5_to_7_percent_target: boolean;
  meets_10_percent_target: boolean;
  meets_15_percent_target: boolean;
  meets_20_percent_target: boolean;
  expected_benefits: WeightLossBenefitTag[];
  look_ahead_intensive_lifestyle_like: boolean;
}

export type WeightLossBenefitTag =
  | "improved_glycemia"
  | "improved_intermediate_cv_risk_factors"
  | "reduced_progression_prediabetes_to_diabetes"
  | "disease_modifying_effects"
  | "possible_t2d_remission"
  | "reduced_all_cause_mortality"
  | "reduced_cv_mortality"
  | "reduced_medication_burden";

export const WEIGHT_LOSS_BENEFIT_MAP: Record<number, { tags: WeightLossBenefitTag[]; label: string; description: string }> = {
  5: {
    tags: ["improved_glycemia", "improved_intermediate_cv_risk_factors", "reduced_progression_prediabetes_to_diabetes", "reduced_medication_burden"],
    label: "5–7% Weight Loss",
    description: "Improves glycemia, blood pressure, and lipids; reduces need for glucose-lowering medications; reduces progression from prediabetes to diabetes in at-risk individuals.",
  },
  10: {
    tags: ["disease_modifying_effects", "possible_t2d_remission", "reduced_all_cause_mortality", "reduced_cv_mortality"],
    label: "≥10% Weight Loss",
    description: "Confers greater cardiometabolic benefits; possible remission of type 2 diabetes (disease-modifying effects); may improve long-term cardiovascular outcomes and mortality; improves adipose tissue inflammation and quality of life.",
  },
  15: {
    tags: ["disease_modifying_effects", "reduced_cv_mortality"],
    label: "≥15% Weight Loss",
    description: "Additional benefits for cardiovascular outcomes; improves metabolic dysfunction-associated steatohepatitis (MASH); improves sleep apnea severity; enhanced quality of life improvements.",
  },
  20: {
    tags: ["disease_modifying_effects", "possible_t2d_remission", "reduced_all_cause_mortality", "reduced_cv_mortality"],
    label: "≥20% Weight Loss",
    description: "Achieved with metabolic surgery; substantial cardiometabolic improvements; high rates of diabetes remission (83-86% at 5 years).",
  },
};

export function evaluateWeightLossEffects(
  baselineWeightKg: number,
  currentWeightKg: number
): WeightLossEffects {
  const percentLoss = ((baselineWeightKg - currentWeightKg) / baselineWeightKg) * 100;
  const roundedPercent = Math.round(percentLoss * 10) / 10;

  const benefits: WeightLossBenefitTag[] = [];

  if (roundedPercent >= 5) {
    benefits.push(...WEIGHT_LOSS_BENEFIT_MAP[5].tags);
  }
  if (roundedPercent >= 10) {
    // Add 10% benefits (avoid duplicates)
    const existing = new Set(benefits);
    for (const tag of WEIGHT_LOSS_BENEFIT_MAP[10].tags) {
      if (!existing.has(tag)) benefits.push(tag);
    }
  }
  if (roundedPercent >= 15) {
    const existing = new Set(benefits);
    for (const tag of WEIGHT_LOSS_BENEFIT_MAP[15].tags) {
      if (!existing.has(tag)) benefits.push(tag);
    }
  }
  if (roundedPercent >= 20) {
    const existing = new Set(benefits);
    for (const tag of WEIGHT_LOSS_BENEFIT_MAP[20].tags) {
      if (!existing.has(tag)) benefits.push(tag);
    }
  }

  return {
    baseline_weight_kg: baselineWeightKg,
    current_weight_kg: currentWeightKg,
    percent_weight_loss: roundedPercent,
    meets_5_to_7_percent_target: roundedPercent >= 5,
    meets_10_percent_target: roundedPercent >= 10,
    meets_15_percent_target: roundedPercent >= 15,
    meets_20_percent_target: roundedPercent >= 20,
    expected_benefits: benefits,
    look_ahead_intensive_lifestyle_like: roundedPercent >= 10,
  };
}

// ─── Lifestyle Prescription ──────────────────────────────────

export type Sex = "male" | "female";

export interface LifestylePrescription {
  recommended_energy_deficit_kcal_per_day: 500 | 750;
  target_energy_intake_kcal_per_day: number;
  sex_specific_reference_range: {
    female_typical_range_kcal_per_day: "1200-1500";
    male_typical_range_kcal_per_day: "1500-1800";
  };
  minimum_weight_loss_for_metabolic_benefit_percent: 5;
  intensive_weight_loss_goals: number[];
}

export function deriveLifestylePrescription(
  sex: Sex,
  currentWeightKg: number,
  activityLevel: "sedentary" | "moderate" | "active" = "sedentary"
): LifestylePrescription {
  // Mifflin-St Jeor estimation for BMR
  // Using weight-only approximation since height may not be available
  const bmrEstimate = sex === "male"
    ? 10 * currentWeightKg + 600  // simplified: 10*kg + 6.25*ht - 5*age + 5
    : 10 * currentWeightKg + 600; // simplified: 10*kg + 6.25*ht - 5*age - 161

  // Activity multipliers
  const activityMultiplier =
    activityLevel === "sedentary" ? 1.2 :
    activityLevel === "moderate" ? 1.375 :
    1.55;

  const tdee = Math.round(bmrEstimate * activityMultiplier);

  // Choose deficit based on sex and weight
  const deficit: 500 | 750 = currentWeightKg >= 100 ? 750 : 500;

  // Target intake within sex-specific range
  const targetIntake = Math.max(
    sex === "female" ? 1200 : 1500,
    tdee - deficit
  );

  return {
    recommended_energy_deficit_kcal_per_day: deficit,
    target_energy_intake_kcal_per_day: targetIntake,
    sex_specific_reference_range: {
      female_typical_range_kcal_per_day: "1200-1500",
      male_typical_range_kcal_per_day: "1500-1800",
    },
    minimum_weight_loss_for_metabolic_benefit_percent: 5,
    intensive_weight_loss_goals: [7, 10, 15],
  };
}

// ─── Micronutrient Risk ──────────────────────────────────────

export type DietPatternTag =
  | "low_intake_fruits_vegetables"
  | "low_intake_whole_grains"
  | "low_intake_protein_foods"
  | "low_intake_nuts_seeds"
  | "strict_vegetarian"
  | "other_restrictive_pattern";

export type MicronutrientOfConcern =
  | "iron"
  | "calcium"
  | "magnesium"
  | "zinc"
  | "vitamin_A"
  | "vitamin_D"
  | "vitamin_E"
  | "vitamin_K"
  | "vitamin_B1"
  | "vitamin_B12"
  | "vitamin_C";

export interface MicronutrientRisk {
  current_energy_intake_kcal_per_day: number;
  diet_pattern: DietPatternTag[];
  age_over_50: boolean;
  underlying_malabsorption_condition: boolean;
  percent_weight_loss: number;
  rapid_weight_loss_percent_per_month: number;
  consider_multivitamin_mineral_supplement: boolean;
  micronutrient_screening_indicated: boolean;
  micronutrients_of_concern: MicronutrientOfConcern[];
  screening_frequency_note: string;
}

export function assessMicronutrientRisk(
  currentEnergyIntakeKcal: number,
  dietPattern: DietPatternTag[],
  age: number,
  hasMalabsorption: boolean,
  percentWeightLoss: number,
  rapidWeightLossPercentPerMonth: number
): MicronutrientRisk {
  const ageOver50 = age > 50;
  const lowCaloricIntake = currentEnergyIntakeKcal < 1200;
  const hasRestrictivePattern = dietPattern.length > 0;
  const excessiveLoss = percentWeightLoss > 20;
  const rapidLoss = rapidWeightLossPercentPerMonth > 4;

  const considerSupplement = lowCaloricIntake || hasRestrictivePattern || ageOver50 || hasMalabsorption || excessiveLoss;

  const screeningIndicated = excessiveLoss || rapidLoss || hasMalabsorption || (percentWeightLoss > 15 && ageOver50);

  // Determine nutrients of concern based on diet pattern
  const nutrients: MicronutrientOfConcern[] = [];

  if (dietPattern.includes("low_intake_fruits_vegetables")) {
    nutrients.push("vitamin_A", "vitamin_C", "vitamin_K", "magnesium");
  }
  if (dietPattern.includes("low_intake_whole_grains")) {
    nutrients.push("vitamin_B1", "magnesium", "zinc");
  }
  if (dietPattern.includes("low_intake_protein_foods")) {
    nutrients.push("iron", "vitamin_B12", "zinc");
  }
  if (dietPattern.includes("low_intake_nuts_seeds")) {
    nutrients.push("vitamin_E", "magnesium");
  }
  if (dietPattern.includes("strict_vegetarian")) {
    if (!nutrients.includes("vitamin_B12")) nutrients.push("vitamin_B12");
    if (!nutrients.includes("iron")) nutrients.push("iron");
    if (!nutrients.includes("zinc")) nutrients.push("zinc");
    if (!nutrients.includes("calcium")) nutrients.push("calcium");
  }

  // Universal concerns for low-calorie diets
  if (lowCaloricIntake) {
    if (!nutrients.includes("calcium")) nutrients.push("calcium");
    if (!nutrients.includes("vitamin_D")) nutrients.push("vitamin_D");
    if (!nutrients.includes("iron")) nutrients.push("iron");
  }

  // Age-related concerns
  if (ageOver50) {
    if (!nutrients.includes("vitamin_D")) nutrients.push("vitamin_D");
    if (!nutrients.includes("vitamin_B12")) nutrients.push("vitamin_B12");
    if (!nutrients.includes("calcium")) nutrients.push("calcium");
  }

  // Malabsorption
  if (hasMalabsorption) {
    if (!nutrients.includes("vitamin_B12")) nutrients.push("vitamin_B12");
    if (!nutrients.includes("vitamin_D")) nutrients.push("vitamin_D");
    if (!nutrients.includes("iron")) nutrients.push("iron");
    if (!nutrients.includes("calcium")) nutrients.push("calcium");
    if (!nutrients.includes("magnesium")) nutrients.push("magnesium");
  }

  return {
    current_energy_intake_kcal_per_day: currentEnergyIntakeKcal,
    diet_pattern: dietPattern,
    age_over_50: ageOver50,
    underlying_malabsorption_condition: hasMalabsorption,
    percent_weight_loss: percentWeightLoss,
    rapid_weight_loss_percent_per_month: rapidWeightLossPercentPerMonth,
    consider_multivitamin_mineral_supplement: considerSupplement,
    micronutrient_screening_indicated: screeningIndicated,
    micronutrients_of_concern: [...new Set(nutrients)],
    screening_frequency_note: "Universal screening intervals are not defined; frequency should be driven by clinical judgment and individual risk factors.",
  };
}

// ─── Pharmacotherapy Eligibility ────────────────────────────

export type ComorbidityTag =
  | "type_2_diabetes"
  | "hypertension"
  | "dyslipidemia"
  | "obstructive_sleep_apnea"
  | "osteoarthritis"
  | "masld_mash"
  | "other";

export type PharmacotherapyRole =
  | "adjunct_to_lifestyle"
  | "not_indicated"
  | "consider_for_long_term_weight_maintenance";

export interface PharmacotherapyEligibility {
  bmi_kg_per_m2: number;
  has_obesity_related_comorbidities: boolean;
  comorbidities_list: ComorbidityTag[];
  eligible_for_anti_obesity_pharmacotherapy: boolean;
  pharmacotherapy_role: PharmacotherapyRole;
}

export function checkPharmacotherapyEligibility(
  bmi: number,
  comorbidities: ComorbidityTag[]
): PharmacotherapyEligibility {
  const hasComorbidities = comorbidities.length > 0;
  const bmi30Plus = bmi >= 30;
  const bmi27PlusWithComorbidities = bmi >= 27 && hasComorbidities;

  const eligible = bmi30Plus || bmi27PlusWithComorbidities;

  return {
    bmi_kg_per_m2: bmi,
    has_obesity_related_comorbidities: hasComorbidities,
    comorbidities_list: comorbidities,
    eligible_for_anti_obesity_pharmacotherapy: eligible,
    pharmacotherapy_role: eligible ? "adjunct_to_lifestyle" : "not_indicated",
  };
}

// ─── Combined Assessment ────────────────────────────────────

export interface ObesityCDSAssessment {
  weightLossEffects: WeightLossEffects | null;
  lifestylePrescription: LifestylePrescription | null;
  micronutrientRisk: MicronutrientRisk | null;
  pharmacotherapyEligibility: PharmacotherapyEligibility | null;
}

export function assessAll(
  params: {
    baselineWeightKg?: number;
    currentWeightKg?: number;
    sex?: Sex;
    age?: number;
    bmi?: number;
    comorbidities?: ComorbidityTag[];
    dietPattern?: DietPatternTag[];
    hasMalabsorption?: boolean;
    currentEnergyIntakeKcal?: number;
    rapidWeightLossPercentPerMonth?: number;
    activityLevel?: "sedentary" | "moderate" | "active";
  }
): ObesityCDSAssessment {
  const {
    baselineWeightKg,
    currentWeightKg,
    sex,
    age = 40,
    bmi,
    comorbidities = [],
    dietPattern = [],
    hasMalabsorption = false,
    currentEnergyIntakeKcal = 1800,
    rapidWeightLossPercentPerMonth = 0,
    activityLevel = "sedentary",
  } = params;

  const weightLossEffects = (baselineWeightKg && currentWeightKg)
    ? evaluateWeightLossEffects(baselineWeightKg, currentWeightKg)
    : null;

  const lifestylePrescription = (sex && currentWeightKg)
    ? deriveLifestylePrescription(sex, currentWeightKg, activityLevel)
    : null;

  const micronutrientRisk = assessMicronutrientRisk(
    currentEnergyIntakeKcal,
    dietPattern,
    age,
    hasMalabsorption,
    weightLossEffects?.percent_weight_loss ?? 0,
    rapidWeightLossPercentPerMonth
  );

  const pharmacotherapyEligibility = bmi
    ? checkPharmacotherapyEligibility(bmi, comorbidities)
    : null;

  return {
    weightLossEffects,
    lifestylePrescription,
    micronutrientRisk,
    pharmacotherapyEligibility,
  };
}

// ─── Benefit Label Helpers ──────────────────────────────────

export const BENEFIT_LABELS: Record<WeightLossBenefitTag, string> = {
  improved_glycemia: "Improved glycemia",
  improved_intermediate_cv_risk_factors: "Improved intermediate CV risk factors",
  reduced_progression_prediabetes_to_diabetes: "Reduced progression from prediabetes to diabetes",
  disease_modifying_effects: "Disease-modifying effects",
  possible_t2d_remission: "Possible T2D remission",
  reduced_all_cause_mortality: "Reduced all-cause mortality",
  reduced_cv_mortality: "Reduced CV mortality",
  reduced_medication_burden: "Reduced medication burden",
};

export const COMORBIDITY_LABELS: Record<ComorbidityTag, string> = {
  type_2_diabetes: "Type 2 Diabetes",
  hypertension: "Hypertension",
  dyslipidemia: "Dyslipidemia",
  obstructive_sleep_apnea: "Obstructive Sleep Apnea",
  osteoarthritis: "Osteoarthritis",
  masld_mash: "MASLD / MASH",
  other: "Other obesity-related condition",
};

export const DIET_PATTERN_LABELS: Record<DietPatternTag, string> = {
  low_intake_fruits_vegetables: "Low intake of fruits & vegetables",
  low_intake_whole_grains: "Low intake of whole grains",
  low_intake_protein_foods: "Low intake of protein foods",
  low_intake_nuts_seeds: "Low intake of nuts & seeds",
  strict_vegetarian: "Strict vegetarian / vegan",
  other_restrictive_pattern: "Other restrictive eating pattern",
};

export const MICRONUTRIENT_LABELS: Record<MicronutrientOfConcern, string> = {
  iron: "Iron",
  calcium: "Calcium",
  magnesium: "Magnesium",
  zinc: "Zinc",
  vitamin_A: "Vitamin A",
  vitamin_D: "Vitamin D",
  vitamin_E: "Vitamin E",
  vitamin_K: "Vitamin K",
  vitamin_B1: "Vitamin B1 (Thiamine)",
  vitamin_B12: "Vitamin B12",
  vitamin_C: "Vitamin C",
};
