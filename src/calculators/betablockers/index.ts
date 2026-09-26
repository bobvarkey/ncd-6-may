export const betaBlockerMetabolicData = {
  title: "Beta-blockers and metabolic effects on insulin sensitivity",
  beta_blockers_and_insulin_sensitivity: {
    why_traditional_beta_blockers_worsen_insulin_sensitivity: [
      {
        mechanism: "Reduced skeletal muscle blood flow",
        effect: "Less glucose uptake",
      },
      {
        mechanism: "Decreased insulin secretion",
        detail: "β2 blockade",
      },
      {
        mechanism: "Promotes weight gain",
      },
      {
        mechanism: "Increases insulin resistance",
      },
      {
        mechanism: "Increases triglycerides",
      },
      {
        mechanism: "Reduces HDL cholesterol",
      },
      {
        mechanism: "Masks hypoglycemia symptoms in diabetes",
      },
    ],
    most_prominent_with: ["Atenolol", "Metoprolol (less than atenolol but still present)", "Propranolol"],
  },
  metabolic_ranking_of_beta_blockers: {
    most_likely_to_worsen_insulin_resistance: [
      {
        rank: 1,
        drug: "Atenolol",
      },
      {
        rank: 2,
        drug: "Propranolol",
      },
      {
        rank: 3,
        drug: "Metoprolol",
      },
    ],
    associated_with: [
      "Higher insulin resistance",
      "Weight gain",
      "Increased risk of new-onset diabetes",
    ],
    metabolically_neutral_or_better: {
      Bisoprolol: {
        features: [
          "Highly β1-selective",
          "Minimal effect on glucose metabolism",
          "Preferred in HFrEF",
          "Less effect on insulin sensitivity than atenolol",
        ],
      },
      Nebivolol: {
        features: [
          "Most metabolically favorable conventional beta-blocker",
          "Highly β1-selective",
          "Stimulates nitric oxide release",
          "Improves endothelial function",
          "Improves skeletal muscle blood flow",
          "Improves insulin sensitivity",
          "Weight neutral",
          "Minimal impact on lipid profile",
        ],
        evidence:
          "Several studies show preservation or improvement of insulin sensitivity compared with atenolol and metoprolol.",
      },
      Carvedilol: {
        features: [
          "Blocks β1, β2, and α1 receptors",
          "Vasodilatory",
          "Improves peripheral glucose utilization",
          "Better insulin sensitivity than metoprolol",
          "Lower incidence of new-onset diabetes",
        ],
        gemini_trial: [
          "Did not worsen HbA1c",
          "Improved insulin sensitivity",
          "Less progression of microalbuminuria compared with metoprolol",
        ],
      },
    },
  },
  which_beta_blocker_should_a_physician_choose: [
    {
      clinical_scenario: "Hypertension + Prediabetes / Metabolic Syndrome / Obesity",
      best_choice: {
        drug: "Nebivolol",
        reasons: [
          "Most insulin-sensitive profile",
          "Vasodilatory",
          "Weight neutral",
        ],
      },
      avoid: "Atenolol",
    },
    {
      clinical_scenario: "Diabetes + Hypertension",
      preferred: ["Nebivolol", "Carvedilol"],
      acceptable: ["Bisoprolol"],
      avoid_when_alternatives_available: ["Atenolol"],
    },
    {
      clinical_scenario: "HFrEF",
      guideline_approved: ["Carvedilol", "Bisoprolol", "Metoprolol Succinate"],
      metabolic_profile_ranking: ["Carvedilol", "Bisoprolol", "Metoprolol"],
    },
    {
      clinical_scenario: "Post-MI",
      strongest_evidence: ["Metoprolol", "Bisoprolol", "Carvedilol"],
      if_diabetic_or_insulin_resistant: "Carvedilol often offers metabolic advantages",
    },
    {
      clinical_scenario: "Elderly hypertensive with metabolic syndrome",
      recommended: "Nebivolol",
      advantages: [
        "Better exercise tolerance",
        "Less fatigue",
        "Better erectile function",
        "Better insulin sensitivity",
      ],
    },
  ],
  practical_clinical_pearls: [
    "Beta-blockers are not contraindicated in diabetes.",
    "Problems are mainly associated with older non-vasodilating beta-blockers.",
    "Nebivolol and carvedilol are the most metabolically friendly agents.",
    "Carvedilol has the strongest evidence for preserving insulin sensitivity in diabetes.",
    "Nebivolol may be preferred when insulin resistance, obesity, prediabetes, or metabolic syndrome coexist.",
    "In heart failure, guideline-directed beta-blockers come first; among them, carvedilol generally offers the best metabolic profile.",
  ],
  take_home_message:
    "If a beta-blocker is required in a patient with diabetes, obesity, prediabetes, or metabolic syndrome, consider a vasodilating beta-blocker. Nebivolol is often preferred for hypertension, while carvedilol is often preferred for heart failure.",
};