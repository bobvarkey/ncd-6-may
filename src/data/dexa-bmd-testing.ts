export const dexaBmdTesting = {
  test: "DXA (Dual-energy X-ray Absorptiometry)",
  purpose: "Bone Mineral Density (BMD) assessment",
  indications: {
    women: {
      age_65_or_older: {
        indicated: true,
        criteria: "All women aged 65 years or older",
      },
      postmenopausal_under_65: {
        indicated_if_risk_factors_present: true,
        risk_factors: [
          "Low body weight",
          "Prior fracture",
          "High-risk medication use",
          "Disease or condition associated with low bone mass or bone loss",
        ],
      },
      menopausal_transition: {
        indicated_if_clinical_fracture_risk_factors_present: true,
        risk_factors: [
          "Low body weight",
          "Prior fracture",
          "High-risk medication use",
        ],
      },
      discontinuing_estrogen: {
        recommendation:
          "Consider DXA testing if any of the standard indications for BMD testing are present",
      },
    },
    men: {
      age_70_or_older: {
        indicated: true,
        criteria: "All men aged 70 years or older",
      },
      under_70: {
        indicated_if_risk_factors_present: true,
        risk_factors: [
          "Low body weight",
          "Prior fracture",
          "High-risk medication use",
          "Disease or condition associated with low bone mass or bone loss",
        ],
      },
    },
    all_adults: [
      { indication: "Fragility fracture", dexa_indicated: true },
      {
        indication: "Disease or condition associated with low bone mass or bone loss",
        dexa_indicated: true,
      },
      {
        indication: "Medication associated with low bone mass or bone loss",
        dexa_indicated: true,
      },
      {
        indication: "Being considered for pharmacologic osteoporosis therapy",
        dexa_indicated: true,
      },
      {
        indication: "Currently receiving pharmacologic osteoporosis therapy",
        dexa_indicated: true,
        purpose: "Monitor treatment effect",
      },
      {
        indication:
          "Not currently receiving therapy but demonstration of bone loss would alter management",
        dexa_indicated: true,
      },
    ],
  },
  decision_logic: {
    dexa_indicated_if_any: [
      "Female age >= 65 years",
      "Male age >= 70 years",
      "Postmenopausal woman < 65 years with risk factor for low bone mass",
      "Woman during menopausal transition with clinical fracture risk factor",
      "Man < 70 years with risk factor for low bone mass",
      "Fragility fracture",
      "Disease or condition associated with low bone mass or bone loss",
      "Medication associated with low bone mass or bone loss",
      "Considering pharmacologic osteoporosis treatment",
      "Monitoring pharmacologic osteoporosis treatment",
      "Evidence of bone loss would change management",
    ],
  },
  output: {
    positive: "DXA/BMD testing indicated",
    negative:
      "No current indication for routine DXA/BMD testing based on the listed criteria",
  },
};
