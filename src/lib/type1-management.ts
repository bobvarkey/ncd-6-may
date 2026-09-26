import { PatientData } from "./patient-data";

export interface Type1Management {
  tdd_calculation: {
    kg_weight: number;
    tdd_range: string;
    estimated_tdd: number;
  };
  basal_insulin: {
    recommended_daily_dose: string;
    percentage_of_tdd: string;
    agent_options: string[];
    fasting_glucose_target: string;
    notes: string;
  };
  bolus_insulin: {
    icr_insulin_to_carb_ratio: string;
    cf_correction_factor: string;
    carb_counting_method: string;
    timing: string;
    agents: string[];
  };
  glucose_targets: {
    premeal: string;
    postmeal_1_2h: string;
    bedtime: string;
    nighttime: string;
    time_in_range_goal: string;
    hba1c_target: string;
  };
  monitoring_protocol: {
    cgm_recommended: {
      metrics: string[];
      review_frequency: string;
      targets: string;
    };
    smbg_minimum: string[];
    ketone_testing: string;
  };
  hypoglycemia_protocol: {
    level_1_70_54: {
      range: string;
      treatment: string;
      recheck: string;
    };
    level_2_below_54: {
      range: string;
      treatment: string;
    };
    level_3_severe: {
      definition: string;
      treatment: string;
    };
    prevention_strategies: string[];
  };
  sick_day_rules: {
    insulin_adjustment: string;
    hydration_goal: string;
    monitoring: string;
    escalation_criteria: string;
  };
  exercise_adjustments: {
    pre_exercise: string;
    during_exercise: string;
    post_exercise: string;
  };
  complication_screening: {
    annual: string[];
    blood_pressure_goal: string;
    lipid_goals: string;
  };
  key_safety_rules: string[];
}

export function generateType1Management(patient: PatientData): Type1Management {
  const weight_kg = (patient as any).weight_kg || patient.weightKg || 75;

  // TDD Calculation: 0.4-0.6 U/kg/day (higher in insulin resistance, puberty, illness)
  const tdd_low = 0.4 * weight_kg;
  const tdd_high = 0.6 * weight_kg;
  const estimated_tdd = (tdd_low + tdd_high) / 2;

  // Basal insulin: 40-50% of TDD
  const basal_percentage = 45;
  const basal_dose = (estimated_tdd * basal_percentage) / 100;

  // Bolus insulin: ICR and CF calculation
  // Typical ICR: 1 unit per 10-15g carbs (1700 rule for CF: mg/dL drop per unit)
  const icr_conservative = 15; // 1 unit per 15g carbs (insulin-sensitive)
  const icr_moderate = 12; // 1 unit per 12g carbs (average)
  const icr_aggressive = 10; // 1 unit per 10g carbs (insulin-resistant)

  const cf_conservative = 50; // 1 unit drops 50 mg/dL
  const cf_moderate = 40; // 1 unit drops 40 mg/dL
  const cf_aggressive = 30; // 1 unit drops 30 mg/dL

  // Determine sensitivity based on HbA1c and BMI
  let icr_recommendation = icr_moderate;
  let cf_recommendation = cf_moderate;
  let sensitivity_note = "average insulin sensitivity";

  if (patient.hba1c < 6.5 && patient.bmi < 25) {
    icr_recommendation = icr_conservative;
    cf_recommendation = cf_conservative;
    sensitivity_note = "high insulin sensitivity (low BMI, good control)";
  } else if (patient.hba1c > 8.0 || patient.bmi > 30) {
    icr_recommendation = icr_aggressive;
    cf_recommendation = cf_aggressive;
    sensitivity_note = "lower insulin sensitivity (high BMI, suboptimal control)";
  }

  return {
    tdd_calculation: {
      kg_weight: weight_kg,
      tdd_range: `${tdd_low.toFixed(1)}-${tdd_high.toFixed(1)} U/day (0.4-0.6 U/kg/day)`,
      estimated_tdd: Math.round(estimated_tdd),
    },
    basal_insulin: {
      recommended_daily_dose: `${basal_dose.toFixed(1)} U/day (40-50% of TDD = ${basal_percentage}%)`,
      percentage_of_tdd: "40-50% (typical 45%)",
      agent_options: [
        "Insulin glargine U100 (1x daily) — most common, peak-less",
        "Insulin glargine U300 (1x daily) — longer duration, less variability",
        "Insulin degludec (1x daily) — ultra-long duration, Flexpen available",
        "Insulin detemir (1-2x daily) — may require twice-daily dosing",
      ],
      fasting_glucose_target: "80-130 mg/dL (avoid nocturnal hypoglycemia)",
      notes: "Basal insulin covers hepatic glucose output during fasting and overnight. Titrate basal first (0.1-0.2U adjustments every 3 days) using fasting glucose.",
    },
    bolus_insulin: {
      icr_insulin_to_carb_ratio: `1 unit per ${icr_recommendation}g carbohydrates (${sensitivity_note}). Typical range 1:10-1:15.`,
      cf_correction_factor: `1 unit lowers glucose ~${cf_recommendation} mg/dL (using 1700 rule ÷ TDD). Range ${cf_aggressive}-${cf_conservative} based on sensitivity.`,
      carb_counting_method: "15g = 1 exchange. Measure portions, use labels, apps (MyFitnessPal, Carb Manager).",
      timing: "15 minutes BEFORE meals (inject rapid-acting insulin before eating to prevent post-meal spikes).",
      agents: [
        "Insulin lispro (Humalog) — onset 15min, peak 1h, duration 3-4h",
        "Insulin aspart (NovoLog) — onset 10-20min, peak 1-3h, duration 3-5h",
        "Insulin glulisine (Apidra) — onset 20min, peak 1h, duration 3-4h",
        "Inhaled insulin (Afrezza) — rapid onset, useful for mealtime coverage",
      ],
    },
    glucose_targets: {
      premeal: "80-130 mg/dL (American Diabetes Association standard for adults)",
      postmeal_1_2h: "<180 mg/dL (prevent hyperglycemic spikes)",
      bedtime: "100-140 mg/dL (balance hypoglycemia risk vs. morning control)",
      nighttime: "70-120 mg/dL (CGM overnight review)",
      time_in_range_goal: ">70% of readings 70-180 mg/dL (CGM metric)",
      hba1c_target: "<7% (individualize to <6.5-8% based on hypoglycemia risk, age, comorbidities)",
    },
    monitoring_protocol: {
      cgm_recommended: {
        metrics: [
          "Time in Range (TIR) 70-180 mg/dL >70% = excellent control",
          "Glucose Variability (coefficient of variation <36% = stable)",
          "Hypoglycemia % <4% of readings below 70 mg/dL",
          "Hypoglycemia alerts for proactive intervention",
        ],
        review_frequency: "Weekly by patient, bi-weekly with provider. Adjust basal/bolus based on patterns.",
        targets: "TIR >70%, GMI <7% (Glucose Management Indicator ≈ HbA1c), hypo <4%",
      },
      smbg_minimum: [
        "Before meals (assess pre-meal glucose, plan bolus)",
        "Before bed (ensure safe overnight glucose)",
        "3am check if nocturnal hypo risk or new pump/basal adjustment",
        "After exercise (check for delayed hypoglycemia)",
        "When CGM unavailable or if symptoms don't match CGM reading (sensor error)",
      ],
      ketone_testing: "If glucose >250 mg/dL or illness (flu, infection). Check blood ketones (preferred) or urine ketones. Escalate if positive + nausea/vomiting.",
    },
    hypoglycemia_protocol: {
      level_1_70_54: {
        range: "70-54 mg/dL (alert glucose, mild hypo)",
        treatment: "15g fast-acting carbs: 4 oz juice, 3-4 glucose tablets, 1 tbsp honey, 5-6 Skittles. Recheck in 15 min.",
        recheck: "If glucose still <70, repeat 15g carbs. Once ≥70, eat complex snack (crackers+cheese, apple+peanut butter).",
      },
      level_2_below_54: {
        range: "<54 mg/dL (significant hypo, risk of seizure/loss of consciousness)",
        treatment: "15-20g fast carbs + complex carb/protein snack. Do NOT drive. Alert caregiver.",
      },
      level_3_severe: {
        definition: "Altered mental status, inability to eat (seizure, loss of consciousness), or emergency services called",
        treatment: "Glucagon IM 1mg (glucagon kit) OR Glucagon 3mg IN (nasal powder, GlucaGon). Call 911. Once conscious, give fast carbs + complex snack.",
      },
      prevention_strategies: [
        "Reduce basal 20-50% before planned exercise (or before bed if active earlier)",
        "Carb snack (15-30g) if CGM trend is declining or exercise lasts >60min",
        "Use CGM low alerts (set to 70 mg/dL) for proactive intervention",
        "Carry fast-acting carbs (glucose tabs, juice, candy) always",
        "Wear medical ID (diabetes, insulin-dependent)",
        "Educate family/friends on hypo recognition and glucagon use",
      ],
    },
    sick_day_rules: {
      insulin_adjustment: "NEVER skip basal insulin, even if not eating. Reduce bolus 25-50% for nausea, but maintain basal (illness increases glucose).",
      hydration_goal: "Minimum 2-3 L/day of sugar-free fluids (water, sugar-free electrolyte drinks). Prevent DKA dehydration.",
      monitoring: "Check glucose q4h (or more if ill), test for ketones if glucose >250 mg/dL. Monitor nausea, vomiting, fever.",
      escalation_criteria: "Ketones ≥1.5 mmol/L (or moderate-large urine ketones) + nausea/vomiting/abdominal pain → GO TO ER (DKA risk).",
    },
    exercise_adjustments: {
      pre_exercise: "Reduce basal 20-50% starting 30min before moderate exercise (>30min). OR reduce mealtime bolus 50% if exercising within 2h of meal. Check CGM trend.",
      during_exercise: "If exercise >60min, consume 15-30g carbs without insulin (no bolus). Monitor for hypo with CGM or check SMBG every 30-60min.",
      post_exercise: "Monitor 12-24h for delayed hypoglycemia (even 4-8h post-exercise). May need basal reduction or extra carbs. Log exercise + glucose patterns for future reference.",
    },
    complication_screening: {
      annual: [
        "eGFR & UACR (kidney disease screening) — baseline then annually",
        "Dilated eye exam (proliferative retinopathy, macular edema) — by ophthalmologist",
        "Foot exam (neuropathy, ulcer risk) — by podiatrist or provider",
        "Lipids (LDL, HDL, triglycerides) — at diagnosis, then annually",
        "Blood pressure (hypertension screening) — every visit, goal <130/80 mmHg",
        "Thyroid function (TSH) — at diagnosis, then every 1-2 years (autoimmune thyroiditis common)",
        "Celiac screening (tissue transglutaminase) — at diagnosis (autoimmune association)",
      ],
      blood_pressure_goal: "<130/80 mmHg (lower threshold than Type 2 due to CVD risk)",
      lipid_goals: "LDL <100 mg/dL (or <70 if CVD or albuminuria present). HDL >40 mg/dL (men) / >50 mg/dL (women).",
    },
    key_safety_rules: [
      "✓ NEVER skip basal insulin, even if fasting",
      "✓ Always carry fast-acting carbs (hypoglycemia treatment)",
      "✓ Check glucose before driving; if <100 mg/dL, eat snack first",
      "✓ Enable CGM alerts at night (hypo risk during sleep)",
      "✓ Sick days: maintain basal, reduce bolus, test ketones q4h",
      "✓ Ketones + vomiting = ER (DKA emergency)",
      "✓ Annual complication screening (kidney, eye, foot, lipids, BP, thyroid)",
      "✓ Inform all providers you have Type 1 DM (affects drug choices, anesthesia)",
      "✓ Wear medical alert ID bracelet/necklace",
      "✓ Communicate exercise plans to providers; adjust insulin accordingly",
    ],
  };
}
