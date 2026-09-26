export interface DicScoringCategory {
  [key: string]: number | string | undefined;
  note?: string;
}

export interface IsthOvertDicScoring {
  platelet_count: DicScoringCategory;
  d_dimer_fdp_2025_updated: DicScoringCategory;
  prothrombin_time: DicScoringCategory;
  fibrinogen: DicScoringCategory;
}

export interface DicScoringSection {
  id: string;
  type: "action";
  recommendation: string;
  laboratory_tests_required: string[];
  isth_overt_dic_scoring: IsthOvertDicScoring;
  diagnosis_criteria: {
    overt_dic_score_threshold: string;
    interpretation: string;
  };
  clinical_implementation: {
    repeat_screening: string;
    monitoring: string;
  };
}

export interface DicTreatmentPrinciple {
  id: string;
  text: string;
}

export interface DicTreatmentPrinciples {
  description: string;
  primary_approach: DicTreatmentPrinciple[];
  monitoring: {
    tests: string[];
    frequency: string;
  };
}

export interface DiscriminatingFeature {
  id: string;
  text: string;
}

export interface DiscriminatingSection {
  description: string;
  dic_features: DiscriminatingFeature[];
  other_bleeding_disorder_features: DiscriminatingFeature[];
}

export interface BleedingAlgorithmNode {
  id: string;
  type: "decision" | "action";
  question?: string;
  field?: string;
  options?: Record<string, BleedingAlgorithmNode>;
  next?: BleedingAlgorithmNode;
  recommendation?: string;
  tests?: string[];
  cautions?: string[];
  frequency?: string;
  principles?: string[];
  sic_score_principles?: string[];
  next_step?: string;
}

export interface BleedingAlgorithmRoot {
  algorithm_name: string;
  version: string;
  root: BleedingAlgorithmNode;
  dic_scoring: DicScoringSection;
  dic_treatment_principles: DicTreatmentPrinciples;
  discriminating_dic_from_bleeding_disorders: DiscriminatingSection;
}

export const BLEEDING_ALGORITHM: BleedingAlgorithmRoot = {
  algorithm_name: "bleeding_disorders_basic_screen_with_dic",
  version: "1.1",
  root: {
    id: "start",
    type: "decision",
    question: "Is there a clinically significant bleeding history (abnormal BAT score or convincing history)?",
    field: "bleeding_history_abnormal",
    options: {
      no: {
        type: "action",
        id: "reassure_monitor",
        recommendation: "No strong evidence of a bleeding disorder. Consider alternative diagnoses, repeat assessment if clinical picture changes."
      },
      yes: {
        type: "decision",
        id: "initial_labs",
        question: "Initial labs: CBC with platelet count, PT/INR, aPTT, fibrinogen (+/- thrombin time) available?",
        field: "basic_coag_labs_available",
        options: {
          no: {
            type: "action",
            id: "order_labs",
            recommendation: "Order CBC with platelet count, PT/INR, aPTT, fibrinogen (+/- thrombin time) before further classification."
          },
          yes: {
            type: "decision",
            id: "dic_suspicion_check",
            question: "Is there clinical suspicion of DIC (bleeding + microthrombi‑induced organ dysfunction, with underlying condition such as sepsis, trauma, malignancy, obstetric complications)?",
            field: "suspected_dic",
            options: {
              no: {
                type: "decision",
                id: "platelet_count_branch_no_dic",
                question: "What is the platelet count?",
                field: "platelet_category",
                options: {
                  low: {
                    type: "action",
                    id: "thrombocytopenia_pathway_no_dic",
                    recommendation: "Suspected thrombocytopenia-related bleeding. Evaluate for immune thrombocytopenia, marrow failure/infiltration, drug- or infection-related causes, hypersplenism; review smear."
                  },
                  normal_or_high: {
                    type: "decision",
                    id: "pt_aptt_pattern_no_dic",
                    question: "Pattern of PT and aPTT results?",
                    field: "pt_aptt_pattern",
                    options: {
                      both_normal: {
                        type: "decision",
                        id: "primary_hemostasis_vs_vwf_no_dic",
                        question: "Is the bleeding predominantly mucocutaneous (epistaxis, gum bleeding, menorrhagia, easy bruising, petechiae)?",
                        field: "mucocutaneous_bleeding",
                        options: {
                          no: {
                            type: "action",
                            id: "consider_nonhematologic_no_dic",
                            recommendation: "Normal PT/aPTT and non-mucocutaneous pattern. Consider local/anatomical causes, vascular/connective tissue disorders, medications, or hypermobility syndromes; hematology referral if doubt persists."
                          },
                          yes: {
                            type: "action",
                            id: "vwd_or_platelet_function_no_dic",
                            recommendation: "Suspect von Willebrand disease or qualitative platelet function defect. Order VWF antigen, VWF activity, FVIII, and platelet function testing; refer to hematology."
                          }
                        }
                      },
                      isolated_prolonged_aptt: {
                        type: "action",
                        id: "intrinsic_pathway_defect_no_dic",
                        recommendation: "Suspect intrinsic pathway factor deficiency (e.g., VIII, IX, XI) or inhibitor. Perform mixing study; if corrects, assay factors; if not, evaluate for inhibitor (e.g., acquired hemophilia, lupus anticoagulant) with urgent hematology input if bleeding significant."
                      },
                      isolated_prolonged_pt: {
                        type: "action",
                        id: "extrinsic_or_vit_k_no_dic",
                        recommendation: "Isolated prolonged PT suggests factor VII deficiency or early vitamin K deficiency/warfarin effect, or liver disease. Review medications, nutrition, liver function, and consider factor assays."
                      },
                      prolonged_pt_and_aptt: {
                        type: "decision",
                        id: "global_defect_branch_no_dic",
                        question: "Is fibrinogen low or thrombin time prolonged?",
                        field: "fibrinogen_or_tt_abnormal",
                        options: {
                          yes: {
                            type: "action",
                            id: "fibrinogen_or_disseminated_no_dic",
                            recommendation: "Suspect disseminated intravascular coagulation, advanced liver disease, or congenital/acquired hypofibrinogenemia/dysfibrinogenemia. Check D-dimer, liver function, and consult hematology urgently if clinically unstable."
                          },
                          no: {
                            type: "action",
                            id: "multiple_factor_deficiency_no_dic",
                            recommendation: "Prolonged PT and aPTT with normal fibrinogen suggests multiple factor deficiencies (e.g., severe vitamin K deficiency, advanced liver disease, massive transfusion). Evaluate liver function, vitamin K status, and consider factor assays; involve hematology."
                          }
                        }
                      }
                    }
                  }
                }
              },
              yes: {
                type: "decision",
                id: "dic_evaluation_branch",
                question: "Does the patient have an underlying condition known to be associated with DIC (sepsis, trauma, malignancy, obstetric complications)?",
                field: "dic_risk_condition_present",
                options: {
                  no: {
                    type: "action",
                    id: "dic_not_probable_no_risk_condition",
                    recommendation: "DIC unlikely; do not use DIC scoring algorithm. Consider alternative diagnoses for bleeding/organ dysfunction (e.g., primary coagulopathy, liver disease, thrombotic microangiopathy)."
                  },
                  yes: {
                    type: "decision",
                    id: "septic_patient_check",
                    question: "Is the patient septic?",
                    field: "patient_septic",
                    options: {
                      yes: {
                        type: "action",
                        id: "calculate_sic_score_first",
                        recommendation: "For septic patients, calculate SIC (Septicemia Induced Coagulopathy) score first. If SIC ≥4 points → early‑phase DIC present. Then proceed to full ISTH overt DIC scoring. If ISTH ≥5 points → overt DIC confirmed.",
                        sic_score_principles: [
                          "SIC score incorporates platelet count, PT prolongation, and D‑dimer/FDP elevation",
                          "SIC ≥4 points indicates early‑phase DIC in sepsis",
                          "Serial screening improves mortality prediction"
                        ],
                        next_step: "full_isth_dic_scoring"
                      },
                      no: {
                        type: "action",
                        id: "apply_isth_criteria_directly",
                        recommendation: "For non‑septic patients, apply ISTH overt DIC criteria directly. Score ≥5 points confirms diagnosis.",
                        next_step: "full_isth_dic_scoring"
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  },
  dic_scoring: {
    id: "full_isth_dic_scoring",
    type: "action",
    recommendation: "Perform ISTH overt DIC scoring using the following laboratory parameters and points. Required for diagnosis: total score ≥5 points indicates overt DIC.",
    laboratory_tests_required: [
      "Platelet count",
      "Prothrombin time (PT) or PT ratio",
      "Fibrinogen level",
      "D‑dimer or FDP (fibrin degradation products)"
    ],
    isth_overt_dic_scoring: {
      platelet_count: {
        "<50 × 10⁹/L": 2,
        "≥50 to <100 × 10⁹/L": 1,
        "≥100 × 10⁹/L": 0
      },
      d_dimer_fdp_2025_updated: {
        ">7× upper normal limit": 3,
        ">3× upper normal limit": 2,
        "≤3× upper normal limit": 0,
        note: "Updated 2025 thresholds refine D‑dimer cutoffs"
      },
      prothrombin_time: {
        "≥6 seconds prolongation (or PT ratio >1.4)": 2,
        "≥3 to <6 seconds prolongation (or PT ratio >1.2 to ≤1.4)": 1,
        "<3 seconds prolongation (or PT ratio ≤1.2)": 0
      },
      fibrinogen: {
        "<100 mg/dL (or <1 g/L)": 1,
        "≥100 mg/dL (or ≥1 g/L)": 0
      }
    },
    diagnosis_criteria: {
      overt_dic_score_threshold: "≥5 points",
      interpretation: "Total score ≥5 points indicates overt DIC"
    },
    clinical_implementation: {
      repeat_screening: "Screen on ICU admission and repeat 2 days later—serial screening improves mortality prediction",
      monitoring: "Repeat tests and scoring daily in overt DIC"
    }
  },
  dic_treatment_principles: {
    description: "Key principles for managing DIC once diagnosed.",
    primary_approach: [
      {
        id: "treat_underlying_condition",
        text: "Treat the underlying condition (e.g., sepsis, trauma, malignancy, obstetric complications) as the primary intervention."
      },
      {
        id: "supportive_measures",
        text: "Provide supportive measures: volume resuscitation, ventilatory support where needed, maintain MAP ≥65 mmHg, urine output ≥0.5 mL/kg/h."
      },
      {
        id: "blood_products",
        text: "For active bleeding or invasive procedures: give blood products (1:1:1 ratio of red cells to plasma to platelets initially; switch to cross‑matched blood next)."
      },
      {
        id: "fibrinogen_target",
        text: "Maintain fibrinogen ≥200 mg/dL; if fibrinogen <200 mg/dL AND active or expected bleeding, give fibrinogen concentrate to get level >300 mg/dL."
      },
      {
        id: "platelet_target",
        text: "Maintain platelets ≥50,000/microL."
      },
      {
        id: "hemoglobin_target",
        text: "Maintain Hb ≥7 g/dL."
      },
      {
        id: "pt_aPTT_target",
        text: "Maintain PT, aPTT <1.5× control."
      },
      {
        id: "warmth",
        text: "Maintain warmth: give blankets, warm any IV fluids."
      },
      {
        id: "txa",
        text: "Consider TXA (tranexamic acid) 1 g over 10 min IV early if bleeding, repeat if bleeding still at 30 min."
      },
      {
        id: "dvt_prophylaxis",
        text: "LMWH for DVT prophylaxis according to local guidelines (unless severe bleeding)."
      }
    ],
    monitoring: {
      tests: [
        "CBC",
        "PT/aPTT",
        "Fibrinogen",
        "FDPs/D‑dimer"
      ],
      frequency: "Serial monitoring essential to track progression or resolution"
    }
  },
  discriminating_dic_from_bleeding_disorders: {
    description: "Key differences between DIC and other bleeding disorders to avoid misdiagnosis.",
    dic_features: [
      {
        id: "bleeding_plus_microthrombi",
        text: "DIC typically presents with bleeding + microthrombi‑induced organ dysfunction, not isolated bleeding."
      },
      {
        id: "multisystem_labs",
        text: "DIC shows multisystem coagulation abnormalities: low platelets, prolonged PT/aPTT, low fibrinogen, elevated D‑dimer/FDP."
      },
      {
        id: "underlying_acute",
        text: "DIC usually has acute underlying condition (sepsis, trauma, obstetric hemorrhage, malignancy)."
      }
    ],
    other_bleeding_disorder_features: [
      {
        id: "isolated_bleeding",
        text: "Other bleeding disorders (e.g., VWD, factor deficiency, platelet dysfunction) typically present with isolated bleeding without organ dysfunction."
      },
      {
        id: "specific_lab_patterns",
        text: "Other bleeding disorders show specific lab patterns (e.g., normal PT/aPTT in VWD, isolated prolonged aPTT in factor VIII/IX deficiency)."
      },
      {
        id: "no_acute_condition",
        text: "Other bleeding disorders often have no acute underlying condition."
      }
    ]
  }
};
