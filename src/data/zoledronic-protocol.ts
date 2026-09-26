export const zoledronicAcidProtocol = {
  title: "Zoledronic Acid (Reclast) Infusion Protocol",
  version: "1.0",
  updated: "2026-09-27",
  
  medication: {
    name: "Zoledronic Acid",
    brand: "Reclast",
    dosage: "5 mg",
    volume: "100 mL",
    form: "Ready-to-infuse solution"
  },
  
  indications: [
    "Osteoporosis treatment",
    "Osteoporosis prevention",
    "Paget's disease",
    "Glucocorticoid-induced osteoporosis"
  ],
  
  preInfusionScreening: {
    renalFunction: {
      requirement: "CrCl ≥ 35 mL/min (Cockcroft-Gault formula)",
      action: "Do not administer if CrCl < 35 mL/min"
    },
    serumCalcium: {
      requirement: "Normal serum calcium",
      action: "Correct hypocalcemia prior to infusion"
    },
    dentalHistory: {
      requirement: "Dental clearance or routine checkup",
      action: "Evaluate for ONJ risk"
    },
    hydration: {
      requirement: "At least 2 glasses of fluids prior to arrival",
      action: "Ensure adequate hydration"
    }
  },
  
  preparation: {
    temperature: "Equilibrate to room temperature if refrigerated",
    visualInspection: "Check for particulates, clarity, discoloration",
    lineSetup: "Dedicated, vented IV infusion line",
    criticalWarning: "Must NEVER contact calcium-containing solutions (e.g., LR) or divalent cations"
  },
  
  administration: {
    infusionRate: "100 mL over no less than 15 minutes",
    postInfusionFlush: "10 mL Normal Saline (0.9% NaCl)",
    monitoring: "Observe for 15-30 minutes post-infusion for hypersensitivity"
  },
  
  postInfusion: {
    observation: "15-30 minutes for immediate reactions",
    hydration: "Maintain oral fluid intake for rest of day",
    patientEducation: [
      "Flu-like symptoms may occur within 24-72 hours",
      "Report severe bone pain",
      "Report muscle spasms",
      "Report tingling around mouth (hypocalcemia signs)"
    ],
    preMedication: "Acetaminophen per physician orders to mitigate acute-phase reactions"
  },
  
  adverseReactions: {
    acutePhase: ["Fever", "Myalgia", "Arthralgia", "Flu-like symptoms"],
    serious: ["Hypocalcemia", "Osteonecrosis of jaw (ONJ)", "Atypical femoral fractures", "Renal dysfunction", "Hypersensitivity reactions"]
  },
  
  contraindications: [
    "Hypocalcemia",
    "CrCl < 35 mL/min",
    "Pregnancy",
    "Known hypersensitivity to zoledronic acid or bisphosphonates"
  ],
  
  nursingChecklist: [
    "□ Verify renal function (CrCl ≥ 35 mL/min)",
    "□ Confirm normal serum calcium",
    "□ Check dental history/clearance",
    "□ Confirm adequate hydration",
    "□ Inspect solution for defects",
    "□ Use dedicated line (no calcium-containing solutions)",
    "□ Program pump: 100 mL over ≥15 minutes",
    "□ Flush with 10 mL NS after infusion",
    "□ Monitor 15-30 minutes post-infusion",
    "□ Provide patient education on adverse reactions",
    "□ Document in patient chart"
  ]
};
