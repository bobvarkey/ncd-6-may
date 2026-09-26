export interface AlgorithmNode {
  id: string;
  type: "decision" | "action";
  question?: string;
  field?: string;
  options?: Record<string, AlgorithmNode>;
  next?: AlgorithmNode;
  recommendation?: string;
  tests?: string[];
  cautions?: string[];
  frequency?: string;
  principles?: string[];
  tests_if_essential?: string[];
  screening_tests?: string[];
  dic_features?: Array<{ id: string; text: string }>;
  vte_thrombophilia_features?: Array<{ id: string; text: string }>;
}

export const THROMBOSIS_ALGORITHM: AlgorithmNode = {
  id: "start",
  type: "decision",
  question: "What is the clinical concern?",
  field: "clinical_concern",
  options: {
    vte: {
      type: "decision",
      id: "suspected_vte",
      question: "Is there clinical suspicion of acute venous thromboembolism (DVT or PE)?",
      field: "suspected_vte",
      options: {
        no: {
          type: "action",
          id: "no_vte_suspicion",
          recommendation: "Consider alternative diagnoses. Use thrombosis risk assessment and prophylaxis tools as appropriate for hospitalization or surgery."
        },
        yes: {
          type: "decision",
          id: "pretest_probability",
          question: "Clinical pretest probability (e.g., Wells score category)?",
          field: "vte_pretest_probability",
          options: {
            low_unlikely: {
              type: "decision",
              id: "low_prob_d_dimer",
              question: "Is a high‑sensitivity D‑dimer test available and appropriate?",
              field: "d_dimer_available",
              options: {
                no: {
                  type: "action",
                  id: "low_prob_no_d_dimer",
                  recommendation: "If D‑dimer is not available, proceed to appropriate imaging (compression ultrasound for DVT, CTPA/VQ for PE) based on clinical judgment."
                },
                yes: {
                  type: "decision",
                  id: "d_dimer_result",
                  question: "D‑dimer result (age‑adjusted or guideline‑specified threshold)?",
                  field: "d_dimer_category",
                  options: {
                    negative: {
                      type: "action",
                      id: "vte_ruled_out_low_prob",
                      recommendation: "VTE effectively ruled out; no imaging needed. Reassess if symptoms progress or new risk factors arise."
                    },
                    positive: {
                      type: "action",
                      id: "low_prob_positive_d_dimer",
                      recommendation: "Obtain imaging (compression ultrasound for suspected DVT; CTPA/VQ scan for suspected PE) to confirm or exclude VTE."
                    }
                  }
                }
              }
            },
            intermediate: {
              type: "decision",
              id: "intermediate_prob_branch",
              question: "Local practice: D‑dimer first vs direct imaging?",
              field: "intermediate_strategy",
              options: {
                d_dimer_first: {
                  type: "decision",
                  id: "intermediate_d_dimer_result",
                  question: "D‑dimer result?",
                  field: "d_dimer_category",
                  options: {
                    negative: {
                      type: "action",
                      id: "vte_unlikely_intermediate",
                      recommendation: "VTE unlikely; consider alternative diagnoses and clinical follow‑up."
                    },
                    positive: {
                      type: "action",
                      id: "intermediate_positive_d_dimer",
                      recommendation: "Proceed to imaging (compression ultrasound for DVT; CTPA/VQ scan for PE) to confirm or exclude VTE."
                    }
                  }
                },
                imaging_direct: {
                  type: "action",
                  id: "intermediate_direct_imaging",
                  recommendation: "Proceed directly to imaging (compression ultrasound for DVT; CTPA/VQ scan for PE). Consider empiric anticoagulation if imaging delayed and risk is significant."
                }
              }
            },
            high_likely: {
              type: "action",
              id: "high_prob_direct_imaging",
              recommendation: "High pretest probability: perform imaging urgently (compression ultrasound for DVT; CTPA/VQ scan for PE). Do not use D‑dimer to rule out VTE. Consider starting anticoagulation while awaiting imaging unless contraindicated."
            }
          },
          next: {
            id: "vte_confirmed_branch",
            type: "decision",
            question: "Is VTE confirmed by imaging?",
            field: "vte_confirmed",
            options: {
              no: {
                type: "action",
                id: "vte_not_confirmed",
                recommendation: "VTE not confirmed. Consider alternative diagnoses and evaluate for non‑thrombotic causes of symptoms. Reassess if clinical picture changes."
              },
              yes: {
                type: "decision",
                id: "cancer_status_check",
                question: "Does the patient have active or newly diagnosed cancer?",
                field: "cancer_active_or_new",
                options: {
                  no: {
                    type: "decision",
                    id: "on_anticoagulants_check_no_cancer",
                    question: "Is the patient currently on anticoagulation therapy?",
                    field: "patient_on_anticoagulants",
                    options: {
                      no: {
                        type: "decision",
                        id: "thrombophilia_appropriateness_no_anticoag_no_cancer",
                        question: "Does this patient meet criteria for appropriate inherited thrombophilia testing?",
                        field: "thrombophilia_appropriate",
                        options: {
                          no: {
                            type: "action",
                            id: "no_thrombophilia_testing_no_cancer",
                            recommendation: "Do not test for inherited thrombophilia. Manage anticoagulation duration based on clinical features (provoked vs unprovoked, recurrence). Use standard duration guidance."
                          },
                          yes: {
                            type: "action",
                            id: "order_thrombophilia_tests_no_anticoag_no_cancer",
                            recommendation: "Order inherited thrombophilia tests when indicated (see criteria below).",
                            tests: [
                              "Antithrombin activity",
                              "Protein C activity",
                              "Protein S activity",
                              "Factor V Leiden (FV G1691A)",
                              "Prothrombin G20210A mutation",
                              "Consider additional genetic testing if clinically indicated"
                            ],
                            cautions: [
                              "Do not test during acute thrombotic event; results can be inaccurate.",
                              "Repeat abnormal or borderline results: at least 2 abnormal results before final diagnosis.",
                              "Test results alone should not determine duration of anticoagulation; use clinical risk and recurrence patterns."
                            ]
                          }
                        }
                      },
                      yes: {
                        type: "decision",
                        id: "anticoagulant_thrombophilia_strategy_no_cancer",
                        question: "Is thrombophilia testing likely to change management?",
                        field: "thrombophilia_changes_management",
                        options: {
                          no: {
                            type: "action",
                            id: "defer_testing_not_likely_to_help_no_cancer",
                            recommendation: "Do not test for thrombophilia while on anticoagulants if results will not change management. Manage based on clinical features (provoked vs unprovoked, recurrence)."
                          },
                          yes: {
                            type: "decision",
                            id: "which_anticoagulant_no_cancer",
                            question: "Which anticoagulant is the patient on?",
                            field: "current_anticoagulant_type",
                            options: {
                              warfarin: {
                                type: "action",
                                id: "pause_warfarin_and_test_no_cancer",
                                recommendation: "Hold warfarin at least 2 weeks before thrombophilia testing. After stopping warfarin, wait 2 weeks, then test for Protein C, Protein S, antithrombin, and lupus anticoagulant. Genetic tests (Factor V Leiden, Prothrombin G20210A) can be done regardless of anticoagulation."
                              },
                              doac: {
                                type: "action",
                                id: "pause_doac_and_test_no_cancer",
                                recommendation: "Hold DOAC at least 2 days (48 hours) before thrombophilia testing; if renal dysfunction, consider longer hold. After stopping DOAC, wait 2 days, then test for Protein C, Protein S, lupus anticoagulant, and antithrombin. Genetic tests (Factor V Leiden, Prothrombin G20210A) can be done regardless of anticoagulation."
                              },
                              heparin_lmwh: {
                                type: "action",
                                id: "pause_heparin_and_test_no_cancer",
                                recommendation: "Hold heparin at least 24 hours (or 2 days for LMWH) before thrombophilia testing. Test for Protein C, Protein S, antithrombin, lupus anticoagulant. Genetic tests (Factor V Leiden, Prothrombin G20210A) can be done regardless of anticoagulation."
                              }
                            }
                          }
                        }
                      }
                    }
                  },
                  yes: {
                    type: "decision",
                    id: "cancer_vte_pathway",
                    question: "Is this cancer‑associated thrombosis (active cancer and VTE)?",
                    field: "cancer_associated_vte",
                    options: {
                      no: {
                        type: "decision",
                        id: "cancer_screening_unprovoked_vte",
                        question: "Is VTE unprovoked and patient age >40 years?",
                        field: "unprovoked_vte_age_gt40",
                        options: {
                          no: {
                            type: "action",
                            id: "limited_cancer_screen_age_or_provoked",
                            recommendation: "Age‑appropriate routine screening for occult malignancy is sufficient (e.g., mammography, colonoscopy per guidelines). No need for extensive cancer screening unless new symptoms or risk factors emerge."
                          },
                          yes: {
                            type: "action",
                            id: "screen_for_occult_malignancy",
                            recommendation: "In unprovoked VTE in patients >40 years, consider limited screening for occult malignancy: history, physical exam, CBC, creatinine, LFTs, urinalysis; age‑appropriate screening (mammography, colon cancer screening). Consider CT abdomen/pelvis and/or chest CT if high risk (e.g., bilateral DVT, very high D‑dimer, early recurrence).",
                            screening_tests: [
                              "History and physical exam",
                              "CBC, creatinine, LFTs, urinalysis",
                              "Age‑appropriate screening (mammography, colonoscopy)",
                              "Consider CT chest/abdomen/pelvis if high risk features"
                            ]
                          }
                        }
                      },
                      yes: {
                        type: "decision",
                        id: "cancer_thrombosis_testing_strategy",
                        question: "Is inherited thrombophilia testing likely to change management in this cancer patient?",
                        field: "cancer_thrombophilia_changes_management",
                        options: {
                          no: {
                            type: "action",
                            id: "no_cancer_thrombophilia_testing",
                            recommendation: "Do not routinely test for inherited thrombophilia in patients with cancer‑associated VTE. Anticoagulation decisions should be based on cancer status (active vs cured), bleeding risk, and thrombosis risk, not thrombophilia results."
                          },
                          yes: {
                            type: "decision",
                            id: "cancer_anticoagulation_status",
                            question: "Is the patient on anticoagulation for cancer‑associated VTE?",
                            field: "cancer_patient_on_anticoagulation",
                            options: {
                              no: {
                                type: "action",
                                id: "cancer_no_anticoag_thrombophilia_test",
                                recommendation: "If thrombophilia testing is essential (e.g., very strong family history of high‑risk thrombophilia, unusual site VTE, and management could change), consider testing after VTE is stable and at least 3 months post‑event. Avoid testing during acute thrombotic event. Use same timing rules as non‑cancer patients (hold warfarin 2 weeks, DOAC 2 days, heparin 24 h).",
                                tests: [
                                  "Antithrombin activity",
                                  "Protein C activity",
                                  "Protein S activity",
                                  "Factor V Leiden (FV G1691A)",
                                  "Prothrombin G20210A mutation",
                                  "Consider additional genetic testing if clinically indicated"
                                ]
                              },
                              yes: {
                                type: "action",
                                id: "cancer_on_anticoag_thrombophilia_strategy",
                                recommendation: "In cancer patients on anticoagulation for VTE, inherited thrombophilia testing is rarely needed. If testing is considered for specific scenarios (e.g., planning anticoagulation duration in low‑intermediate thrombosis risk cancer with strong family history), use these principles:",
                                principles: [
                                  "Wait until patient is stable, at least 3 months post‑VTE diagnosis.",
                                  "If possible, hold warfarin ≥2 weeks, DOAC ≥2 days, or heparin/LMWH ≥24–48 h before testing functional assays.",
                                  "Genetic tests (Factor V Leiden, Prothrombin G20210A) can be done regardless of anticoagulation.",
                                  "Functional assays (Protein C/S, antithrombin, lupus anticoagulant) should be interpreted with caution in cancer and may be affected by anticoagulants.",
                                  "Thrombophilia results should not routinely alter anticoagulation duration in active cancer; decisions primarily based on cancer status and bleeding risk."
                                ],
                                tests_if_essential: [
                                  "Factor V Leiden (FV G1691A)",
                                  "Prothrombin G20210A mutation",
                                  "Consider additional genetic testing if clinically indicated"
                                ],
                                cautions: [
                                  "Avoid testing during acute thrombotic event.",
                                  "Cancer itself can alter Protein C/S, antithrombin, and lupus anticoagulant assays.",
                                  "Repeat abnormal or borderline results: at least 2 abnormal results before final diagnosis.",
                                  "Thrombophilia results alone should not determine duration of anticoagulation in cancer patients."
                                ]
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
          }
        }
      }
    },
    dic: {
      type: "decision",
      id: "dic_suspicion",
      question: "Does the patient have risk factors for DIC? (Sepsis, trauma/major surgery, AML especially APL/M3, amniotic fluid embolism, massive transfusion, obstetric complications)",
      field: "dic_risk_factors",
      options: {
        no: {
          type: "action",
          id: "dic_unlikely_no_risk",
          recommendation: "DIC unlikely based on absence of risk factors. Consider alternative causes of coagulopathy: liver disease, vitamin K deficiency, factor deficiency, or anticoagulant effect."
        },
        yes: {
          type: "decision",
          id: "dic_labs_done",
          question: "Have labs been sent for DIC evaluation? (CBC with smear, PT/aPTT, fibrinogen, D-dimer, schistocytes)",
          field: "dic_labs_sent",
          options: {
            no: {
              type: "action",
              id: "order_dic_labs",
              recommendation: "Order DIC labs: CBC with peripheral smear (schistocytes), PT, aPTT, fibrinogen, D-dimer. Use ISTH DIC scoring: platelets (≥100K=0, 50–100K=1, <50K=2), D-dimer (moderate increase=2, strong increase=3), PT prolongation (<3s=0, 3–6s=1, >6s=2), fibrinogen (>1.0 g/L=0, <1.0 g/L=1)."
            },
            yes: {
              type: "decision",
              id: "dic_isth_score",
              question: "ISTH DIC score ≥5? (Overt DIC diagnostic criteria per Taylor et al. 2001, Thromb Haemost)",
              field: "dic_score_overt",
              options: {
                no: {
                  type: "action",
                  id: "dic_non_overt",
                  recommendation: "DIC not overt by ISTH criteria (score <5). Repeat scoring daily if clinical suspicion persists. Supportive care and close monitoring of trend. Consider alternative diagnoses."
                },
                yes: {
                  type: "action",
                  id: "dic_overt_diagnosis",
                  recommendation: "Overt DIC diagnosed (ISTH score ≥5). Immediate management indicated.",
                  next: {
                    id: "dic_management_summary",
                    type: "decision",
                    question: "Select DIC management action:",
                    field: "dic_action",
                    options: {
                      treat_cause: {
                        type: "action",
                        id: "treat_cause",
                        recommendation: "Treat the underlying cause as the cornerstone of DIC management: antibiotics for sepsis, surgical control of trauma, treat malignancy (e.g., ATRA for APL), deliver fetus in AFE, stop causative drug."
                      },
                      blood_products: {
                        type: "action",
                        id: "blood_products",
                        recommendation: "Transfuse with blood products: PRBCs, FFP, platelets in 1:1:1 ratio (massive transfusion protocol) if actively bleeding with coagulopathy. FFP 10–15 mL/kg to correct PT/PTT. Goal: maintain perfusion and hemostasis.",
                        principles: [
                          "Use 1:1:1 ratio (PRBC:FFP:platelets) in massive hemorrhage",
                          "FFP 10–15 mL/kg for PT/PTT correction",
                          "Cryoprecipitate 10–15 pooled units if fibrinogen <100–150 mg/dL",
                          "Avoid excessive crystalloid — use blood products"
                        ]
                      },
                      fibrinogen_target: {
                        type: "action",
                        id: "fibrinogen_target",
                        recommendation: "Replace fibrinogen to maintain target ≥200 mg/dL. If actively bleeding, target level >300 mg/dL. Use cryoprecipitate (10–15 pooled units) or fibrinogen concentrate (4–6 g IV)."
                      },
                      platelet_target: {
                        type: "action",
                        id: "platelet_target",
                        recommendation: "Maintain platelet count ≥50,000/microL. Transfuse platelets if <50,000/microL with active bleeding. In non‑bleeding patients, transfuse if <20,000/microL."
                      },
                      hemoglobin_target: {
                        type: "action",
                        id: "hemoglobin_target",
                        recommendation: "Maintain Hb ≥7 g/dL. Transfuse PRBCs to keep hemoglobin above threshold. Individualize target based on hemodynamic status, bleeding rate, and cardiopulmonary reserve."
                      },
                      pt_aPTT_target: {
                        type: "action",
                        id: "pt_aPTT_target",
                        recommendation: "Maintain PT, aPTT <1.5× control. Use FFP (10–15 mL/kg) to correct prolonged coagulation times. Avoid excessive FFP which can cause volume overload — consider factor concentrates if refractory."
                      },
                      warmth: {
                        type: "action",
                        id: "warmth",
                        recommendation: "Maintain warmth: give blankets, warm any IV fluids. Hypothermia worsens coagulopathy by impairing enzyme function of clotting factors and platelet function. Target normothermia (36.5–37.5°C)."
                      },
                      txA: {
                        type: "action",
                        id: "txA",
                        recommendation: "Consider TXA (tranexamic acid) 1 g over 10 min IV early if bleeding, repeat if bleeding still at 30 min. Caution: TXA is not standard in all DIC — consider in hyperfibrinolytic pattern (e.g., APL, prostate cancer, aortic surgery). Do not use in DIC with predominant thrombotic phenotype."
                      },
                      dvt_prophylaxis: {
                        type: "action",
                        id: "dvt_prophylaxis",
                        recommendation: "LMWH for DVT prophylaxis according to local guidelines (unless severe bleeding).",
                        cautions: [
                          "Do not start anticoagulation while actively bleeding or platelets <50K",
                          "Monitor for signs of both bleeding and thrombosis",
                          "Use LMWH preferentially — avoid warfarin in acute DIC",
                          "Reassess daily as DIC can shift phenotype"
                        ]
                      },
                      monitoring: {
                        type: "action",
                        id: "monitoring",
                        recommendation: "Serial monitoring essential to track progression or resolution.",
                        tests: ["CBC", "PT/aPTT", "Fibrinogen", "FDPs/D-dimer"],
                        frequency: "Serial monitoring essential to track progression or resolution"
                      },
                      discriminating_dic_from_vte: {
                        type: "action",
                        id: "discriminating_dic_from_vte",
                        recommendation: "Key differences between DIC and VTE/thrombophilia to avoid misdiagnosis.",
                        dic_features: [
                          { id: "bleeding_predominant", text: "DIC typically presents with bleeding + microthrombi‑induced organ dysfunction, not isolated VTE." },
                          { id: "multisystem_labs", text: "DIC shows multisystem coagulation abnormalities: low platelets, prolonged PT/aPTT, low fibrinogen, elevated D‑dimer/FDP." },
                          { id: "underlying_acute", text: "DIC usually has acute underlying condition (sepsis, trauma, obstetric hemorrhage, malignancy)." }
                        ],
                        vte_thrombophilia_features: [
                          { id: "isolated_vte", text: "VTE presents as isolated DVT/PE without multisystem coagulation abnormalities." },
                          { id: "normal_coags", text: "In VTE, PT/aPTT, fibrinogen, and platelet count are typically normal." },
                          { id: "chronic_risk", text: "VTE/thrombophilia usually involves chronic/genetic risk factors (Factor V Leiden, prothrombin mutation, antiphospholipid syndrome), not acute triggers." },
                          { id: "thrombophilia_risk", text: "Thrombophilia may increase VTE risk but does not cause DIC laboratory pattern." }
                        ]
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
  }
};
