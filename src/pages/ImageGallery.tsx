import haalandMnemonic from "@/assets/haaland-mnemonic.png.asset.json";
import subclinicalAtherosclerosis from "@/assets/subclinical-atherosclerosis.png.asset.json";

import kdigoAkiAkd from "@/assets/kdigo-2026-aki-akd-guideline.png.asset.json";
import antibioticsSpectrum from "@/assets/antibiotics-spectrum.jpeg.asset.json";
import acuteDiarrhoeaClassification from "@/assets/acute-diarrhoea-classification.jpg.asset.json";
import vitaminDProtocol from "@/assets/vitamin-d-protocol.png.asset.json";
import structuredHypercortisolism from "@/assets/structured-hypercortisolism-screen.jpg.asset.json";
import osteoporosisTreatment from "@/assets/osteoporosis-treatment-approach-2026.jpg.asset.json";

import additionalOsteoporosisAlgorithm from "@/assets/fragility-fracture-management-guide.jpg.asset.json";
import bisphosphonatesCriteria from "@/assets/bisphosphonates-criteria.png.asset.json";

import fragilityFractureFirstLineV2 from "@/assets/fragility-fracture-first-line-v2.jpg.asset.json";

import vaccinesLiveVsInactivated from "@/assets/vaccines-live-vs-inactivated.png.asset.json";
import ironProfileStory from "@/assets/iron-profile-story.png.asset.json";
import constipationDefinition from "@/assets/constipation-definition-causes.png.asset.json";
import constipationManagement from "@/assets/constipation-management.png.asset.json";
import masldOverview from "@/assets/masld-assessment-overview.png.asset.json";
import diabetesTreatmentAlgorithm from "@/assets/diabetes-treatment-algorithm.png.asset.json";
import tampDcmi from "@/assets/tamp-dcmi-resistant-htn.png.asset.json";
import ferritinTsatThresholds from "@/assets/ferritin-tsat-thresholds.png.asset.json";
import ironTransportHepcidin from "@/assets/iron-transport-hepcidin.jpeg.asset.json";
import ironIceCreamAnalogy from "@/assets/iron-ice-cream-analogy.jpeg.asset.json";
import ironDeficiencyStages from "@/assets/iron-deficiency-stages.png.asset.json";
import rlsIronAlgorithm1 from "@/assets/rls-iron-algorithm-1.png.asset.json";
import rlsIronAlgorithm2 from "@/assets/rls-iron-algorithm-2.png.asset.json";
import lipidTargetGuide from "@/assets/lipid-target-guide.png.asset.json";
import mallampatiScore from "@/assets/mallampati-score.png.asset.json";

// Images bundled from src/assets rather than hosted on the CDN. Note that
// diabetes-treatment-algorithm-v2.jpg.asset.json is NOT used here: its url points
// at /images/diabetes-treatment-algorithm-v2.jpg, which does not exist in public/.
import cprFrameworkImg from "@/assets/cpr-framework.png";
import cvRiskMeasuresImg from "@/assets/cv-risk-measures.png";
import diabetesTreatmentAlgorithmV2Img from "@/assets/diabetes-treatment-algorithm-v2.jpg";
import foodPoisoningAlgorithmImg from "@/assets/food-poisoning-algorithm.jpg";
import foodPoisoningPoster2Img from "@/assets/food-poisoning-poster-2.jpg";
import frailtyQuestionnaireImg from "@/assets/frailty-questionnaire.jpg";
import frailtyScaleChartImg from "@/assets/frailty-scale-chart.jpg";
import heroDoctorImg from "@/assets/hero-doctor.jpg";
import lipidPanelDecodedImg from "@/assets/lipid-panel-decoded.jpg";
import lipidsGeminiImg from "@/assets/Lipids Gemini_Generated_Image_4o82814o82814o82.png";
import lipoproteinParticlesImg from "@/assets/lipoprotein-particles.png";
import niceCkdAlgorithmImg from "@/assets/nice-ckd-algorithm.png";

import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Image, Home, ChevronDown, ChevronUp, ExternalLink, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import Seo from "@/components/Seo";

interface ImageEntry {
  id: string;
  src: string;
  label: string;
  category: string;
  description: string;
  sourcePages: { label: string; path: string }[];
  /**
   * Extra ids that older deep links use for this same image, so a page that
   * passes `acs-lipid-algorithm-lai` still resolves to `acs-lipid-algorithm`.
   */
  aliases?: string[];
}

const IMAGE_CATALOG: ImageEntry[] = [
  // ─── Diabetes ───
  { id: "semaglutide-vs-tirzepatide", src: "/images/semaglutide-vs-tirzepatide.jpg", label: "Semaglutide vs Tirzepatide", category: "Diabetes", description: "Head-to-head comparison — metabolic vs cardiorenal outcomes", sourcePages: [{ label: "Diabetes Treatment", path: "/diabetes/treatment" }, { label: "GLP-1 Administration", path: "/db/glp1-administration" }] },
  { id: "dka-algorithm", src: "/dka-algorithm.jpg", label: "DKA Algorithm", category: "Diabetes", description: "Diabetic Ketoacidosis management algorithm", sourcePages: [{ label: "Hyperglycemic Emergency", path: "/hyperglycemic-emergency" }, { label: "Diabetes Treatment", path: "/diabetes/treatment" }] },
  { id: "hhs-algorithm", src: "/hhs-algorithm.jpg", label: "HHS Algorithm", category: "Diabetes", description: "Hyperosmolar Hyperglycemic State management algorithm", sourcePages: [{ label: "Hyperglycemic Emergency", path: "/hyperglycemic-emergency" }, { label: "Diabetes Treatment", path: "/diabetes/treatment" }] },
  { id: "mixed-dka-hhs", src: "/mixed-dka-hhs-algorithm.jpg", label: "Mixed DKA/HHS Algorithm", category: "Diabetes", description: "Mixed DKA and HHS management algorithm", sourcePages: [{ label: "Hyperglycemic Emergency", path: "/hyperglycemic-emergency" }, { label: "Diabetes Treatment", path: "/diabetes/treatment" }], aliases: ["mixed-dka-hhs-algorithm"] },
  { id: "insulins", src: "/images/Insulins.jpg", label: "Insulin Types", category: "Diabetes", description: "Types of insulin preparations", sourcePages: [{ label: "Insulin Guide", path: "/diabetes/insulin-guide" }] },
  { id: "insulin-types-graph", src: "/images/insulin-types-graph.png", label: "Insulin Types Graph", category: "Diabetes", description: "Insulin action profiles graph", sourcePages: [{ label: "Insulin Guide", path: "/diabetes/insulin-guide" }] },
  { id: "geriatric-syndromes", src: "/geriatric-syndromes.jpg", label: "Geriatric Syndromes", category: "Diabetes", description: "Geriatric syndromes in diabetes management", sourcePages: [{ label: "Diabetes Treatment", path: "/diabetes/treatment" }] },
  { id: "dm-types-reference", src: "/dm-types-reference.jpg", label: "Diabetes Mellitus Types Classification", category: "Diabetes", description: "Classification reference table for the types of diabetes mellitus", sourcePages: [{ label: "Diabetes Overview", path: "/diabetes/overview" }] },
  { id: "obesity-glp1-checklist", src: "/obesity-glp1-checklist.jpg", label: "Obesity GLP-1 Treatment Checklist", category: "Diabetes", description: "Checklist for obesity management with GLP-1 receptor agonists", sourcePages: [{ label: "GLP-1 Administration", path: "/db/glp1-administration" }, { label: "GLP-1 Doses", path: "/obesity/glp1-dosing" }] },
  { id: "diabetes-treatment-algorithm", src: diabetesTreatmentAlgorithm.url, label: "Diabetes Treatment Algorithm", category: "Diabetes", description: "Treatment algorithm for type 2 diabetes mellitus", sourcePages: [{ label: "Diabetes Treatment", path: "/diabetes/treatment" }] },
  { id: "diabetes-treatment-algorithm-v2", src: diabetesTreatmentAlgorithmV2Img, label: "Diabetes Treatment Algorithm (with Insulin Icodec)", category: "Diabetes", description: "Algorithm for the treatment of type 2 diabetes including insulin icodec — when to start insulin, basal titration, and where once-weekly icodec fits", sourcePages: [{ label: "Diabetes Treatment", path: "/diabetes/treatment" }, { label: "T2D Treatment Algorithm", path: "/type2-treatment-algorithm" }] },

  // ─── Hypertension ───
  { id: "htn-algorithm-steps", src: "/images/htn-algorithm-steps.jpg", label: "HTN Algorithm Steps", category: "Hypertension", description: "Hypertension treatment algorithm steps", sourcePages: [{ label: "HTN Algorithm Flowchart", path: "/hypertension/assessment" }] },
  { id: "htn-comorbidity-matrix", src: "/images/htn-comorbidity-matrix.jpg", label: "HTN Comorbidity Matrix", category: "Hypertension", description: "Hypertension comorbidity treatment matrix", sourcePages: [{ label: "HTN Algorithm Flowchart", path: "/hypertension/assessment" }] },
  { id: "htn-rx", src: "/images/htn-rx.png", label: "HTN Medication Guide", category: "Hypertension", description: "Hypertension medication reference", sourcePages: [{ label: "HTN Medication Guide", path: "/hypertension/medication-guide" }] },
  { id: "beta-blocker-selection", src: "/beta-blocker-selection.jpg", label: "Beta-Blocker Selection Guide", category: "Hypertension", description: "Choose the right beta-blocker based on clinical phenotype", sourcePages: [{ label: "HTN Medication Guide", path: "/hypertension/medication-guide" }] },
  { id: "haaland-mnemonic", src: haalandMnemonic.url, label: "HAALAND Mnemonic — Secondary HTN", category: "Hypertension", description: "HAALAND mnemonic for secondary hypertension causes (Hyperaldosteronism, Aortic coarctation, Apnea/OSA, Liddle syndrome, Adrenal, Nephropathy, Drugs)", sourcePages: [{ label: "Secondary HTN Evaluation", path: "/hypertension/assessment" }] },
  { id: "mra-pocket-card", src: "/__l5e/assets-v1/0da12e7b-777a-4554-ba13-192499cd8e22/mra-pocket-card.jpg", label: "MRA Pocket Card", category: "Hypertension", description: "Spironolactone vs Eplerenone vs Finerenone — steroidal & nonsteroidal MRAs: uses, dosing, key cautions", sourcePages: [{ label: "HTN Medication Guide", path: "/hypertension/medication-guide" }] },
  { id: "tamp-dcmi", src: tampDcmi.url, label: "TAMP-DCMI Resistant HTN Guide", category: "Hypertension", description: "TAMP-DCMI framework for resistant hypertension — treatment sequencing and drug-class selection", sourcePages: [{ label: "HTN Treatment", path: "/hypertension/treatment" }] },

  // ─── Lipids ───
  { id: "lipids-infographic", src: "/lipids-infographic.jpg", label: "Lipids Infographic", category: "Lipids", description: "Lipid management overview infographic", sourcePages: [{ label: "Lipids Overview", path: "/lipids/overview" }] },
  { id: "ascvd-risk-stratification", src: "/images/ascvd-risk-stratification-lai.jpg", label: "ASCVD Risk Stratification", category: "Lipids", description: "ASCVD risk stratification by LAI guidelines", sourcePages: [{ label: "Lipids Assessment", path: "/lipids/assessment" }], aliases: ["ascvd-risk-stratification-lai"] },
  { id: "subclinical-atherosclerosis", src: subclinicalAtherosclerosis.url, label: "Subclinical Atherosclerosis", category: "Lipids", description: "Subclinical atherosclerosis vs clinical ASCVD — definition, decision algorithm, coronary/carotid/peripheral/aortic plaque criteria, plaque burden and multiterritorial disease", sourcePages: [{ label: "Lipids Assessment", path: "/lipids/assessment" }] },

  { id: "hypertriglyceridemia-algorithm", src: "/images/hypertriglyceridemia-algorithm-lai.jpg", label: "Hypertriglyceridemia Algorithm", category: "Lipids", description: "Hypertriglyceridemia management algorithm (LAI)", sourcePages: [{ label: "Lipids Assessment", path: "/lipids/assessment" }], aliases: ["hypertriglyceridemia-algorithm-lai"] },
  { id: "hypertriglyceridemia-cac", src: "/images/hypertriglyceridemia-cac-lai.jpg", label: "Hypertriglyceridemia CAC", category: "Lipids", description: "Hypertriglyceridemia CAC-based approach (LAI)", sourcePages: [{ label: "Lipids Assessment", path: "/lipids/assessment" }], aliases: ["hypertriglyceridemia-cac-lai"] },
  { id: "cacs-risk-stratification", src: "/images/cacs-risk-stratification-lai.jpg", label: "CACS Risk Stratification", category: "Lipids", description: "Coronary artery calcium score risk stratification (LAI)", sourcePages: [{ label: "Lipids Assessment", path: "/lipids/assessment" }], aliases: ["cacs-risk-stratification-lai"] },
  { id: "cacs-risk-targets", src: "/images/cacs-risk-targets-lai.jpg", label: "CACS Risk Targets", category: "Lipids", description: "CACS-based lipid treatment targets (LAI)", sourcePages: [{ label: "Lipids Assessment", path: "/lipids/assessment" }], aliases: ["cacs-risk-targets-lai"] },
  { id: "diabetes-lipid-algorithm", src: "/images/diabetes-lipid-algorithm-lai.jpg", label: "Diabetes Lipid Algorithm", category: "Lipids", description: "Lipid management in diabetes (LAI)", sourcePages: [{ label: "Lipids Assessment", path: "/lipids/assessment" }], aliases: ["diabetes-lipid-algorithm-lai"] },
  { id: "acs-lipid-algorithm", src: "/images/acs-lipid-algorithm-lai.jpg", label: "ACS Lipid Algorithm", category: "Lipids", description: "Post-ACS lipid management algorithm (LAI)", sourcePages: [{ label: "Lipids Assessment", path: "/lipids/assessment" }], aliases: ["acs-lipid-algorithm-lai"] },
  { id: "lai-treatment-algorithm", src: "/images/lai-treatment-algorithm.jpg", label: "LAI Treatment Algorithm", category: "Lipids", description: "Lipid Association of India treatment algorithm", sourcePages: [{ label: "Lipids Assessment", path: "/lipids/assessment" }] },
  { id: "lipid-goals-by-risk", src: "/images/lipid-goals-by-risk-lai.jpg", label: "Lipid Goals by Risk", category: "Lipids", description: "Lipid treatment goals by risk category (LAI)", sourcePages: [{ label: "Lipids Assessment", path: "/lipids/assessment" }], aliases: ["lipid-goals-by-risk-lai"] },
  { id: "cv-risk-measures", src: cvRiskMeasuresImg, label: "CV Risk Measures", category: "Lipids", description: "Cardiovascular risk measures used to stratify and monitor lipid therapy", sourcePages: [{ label: "Lipid Panel", path: "/lipid-panel" }] },
  { id: "lipid-panel-decoded", src: lipidPanelDecodedImg, label: "Lipid Panel Decoded", category: "Lipids", description: "How to read a lipid panel — what each reported value means", sourcePages: [{ label: "Lipid Panel", path: "/lipid-panel" }] },
  { id: "lipoprotein-particles", src: lipoproteinParticlesImg, label: "Lipoprotein Particles", category: "Lipids", description: "Lipoprotein particle classes and their atherogenic contribution", sourcePages: [{ label: "Lipid Panel", path: "/lipid-panel" }] },
  { id: "lipids-gemini-infographic", src: lipidsGeminiImg, label: "Lipid Particles Infographic", category: "Lipids", description: "Illustrated overview of lipid particles and lipid transport", sourcePages: [{ label: "Lipid Panel", path: "/lipid-panel" }] },
  { id: "cpr-framework", src: cprFrameworkImg, label: "CPR Framework", category: "Lipids", description: "CPR framework applied to cardiovascular risk and lipid management", sourcePages: [{ label: "Lipid Panel", path: "/lipid-panel" }] },
  { id: "lipid-target-guide", src: lipidTargetGuide.url, label: "Lipid Targets Guide", category: "Lipids", description: "LDL-C and ApoB goals by risk category", sourcePages: [{ label: "Lipids", path: "/lipids" }] },

  // ─── Anemia / Coagulation ───
  { id: "bleed-algorithm", src: "/images/bleed-algorithm.png", label: "Bleeding Algorithm", category: "Anemia & Coagulation", description: "Bleeding disorder evaluation algorithm", sourcePages: [{ label: "Bleeding/Clotting Evaluator", path: "/anemia" }] },
  { id: "thrombosis-algorithm", src: "/images/thrombosis-algorithm.png", label: "Thrombosis Algorithm", category: "Anemia & Coagulation", description: "Thrombosis evaluation algorithm", sourcePages: [{ label: "Bleeding/Clotting Evaluator", path: "/anemia" }] },
  { id: "dic-isth-score", src: "/images/dic-isth-score.webp", label: "DIC ISTH Score", category: "Anemia & Coagulation", description: "ISTH DIC scoring system", sourcePages: [{ label: "Bleeding/Clotting Evaluator", path: "/anemia" }] },
  { id: "anticoagulation-reference", src: "/images/anticoagulation-reference.jpg", label: "Anticoagulation Reference", category: "Anemia & Coagulation", description: "Anticoagulation reference chart", sourcePages: [{ label: "Bleeding/Clotting Evaluator", path: "/anemia" }, { label: "Anticoagulants", path: "/anemia" }] },
  { id: "iron-profile-story", src: ironProfileStory.url, label: "Iron Profile Patterns", category: "Anemia & Coagulation", description: "IDA vs anaemia of chronic disease vs sideroblastic anaemia: serum iron, TSAT, ferritin and TIBC patterns", sourcePages: [{ label: "Iron Interpretation", path: "/anemia" }] },
  { id: "thrombocytopenia-algorithm", src: "/thrombocytopenia-algorithm.jpg", label: "Thrombocytopenia Diagnostic Algorithm", category: "Anemia & Coagulation", description: "Diagnostic algorithm for thrombocytopenia — pseudo-thrombocytopenia, consumption, marrow failure and sequestration", sourcePages: [{ label: "Thrombocytopenia Evaluator", path: "/anemia" }] },
  { id: "anemia-classification-mnemonic", src: "/images/anemia-classification-mnemonic.jpg", label: "Anemia Classification Mnemonics", category: "Anemia & Coagulation", description: "Mnemonics for anaemia classification — TAILS / BIG FAT RBC / CHART / HALT", sourcePages: [{ label: "Anemia", path: "/anemia" }] },
  { id: "ferritin-tsat-thresholds", src: ferritinTsatThresholds.url, label: "Ferritin & TSAT Thresholds", category: "Anemia & Coagulation", description: "Suggested ferritin and TSAT thresholds by clinical context", sourcePages: [{ label: "Iron Therapy", path: "/anemia" }] },
  { id: "iron-transport-hepcidin", src: ironTransportHepcidin.url, label: "Iron Transport & Hepcidin", category: "Anemia & Coagulation", description: "Iron storage (ferritin), free iron pool, transferrin transport and hepcidin regulation", sourcePages: [{ label: "Iron Therapy", path: "/anemia" }] },
  { id: "iron-ice-cream-analogy", src: ironIceCreamAnalogy.url, label: "Iron Studies — Ice Cream Shop Analogy", category: "Anemia & Coagulation", description: "Ice cream shop analogy for ferritin storage, free iron pool, transferrin, serum iron, TIBC and TSAT", sourcePages: [{ label: "Iron Therapy", path: "/anemia" }] },
  { id: "iron-deficiency-stages", src: ironDeficiencyStages.url, label: "Iron Deficiency Stages", category: "Anemia & Coagulation", description: "MCV, RDW, sTfR, ferritin, TIBC, ZPP and transferrin saturation across normal, iron depletion, iron-deficient erythropoiesis and iron deficiency anaemia", sourcePages: [{ label: "Iron Therapy", path: "/anemia" }] },
  { id: "rls-iron-algorithm-1", src: rlsIronAlgorithm1.url, label: "RLS Iron Therapy Algorithm", category: "Anemia & Coagulation", description: "Restless legs syndrome — diagnosis, iron assessment, TSAT and ferritin thresholds, and the oral iron pathway", sourcePages: [{ label: "Iron Therapy", path: "/anemia" }] },
  { id: "rls-iron-algorithm-2", src: rlsIronAlgorithm2.url, label: "RLS IV Iron Algorithm", category: "Anemia & Coagulation", description: "Indications for IV iron in restless legs syndrome — FCM and LMW iron dextran dosing, follow-up and repeat infusion criteria", sourcePages: [{ label: "Iron Therapy", path: "/anemia" }] },

  // ─── Thyroid ───
  { id: "hyperthyroidism-algorithm", src: "/images/hyperthyroidism-algorithm.jpg", label: "Hyperthyroidism Algorithm", category: "Thyroid", description: "Hyperthyroidism management algorithm", sourcePages: [{ label: "Thyroid Calculator", path: "/thyroid" }] },

  // ─── Women's Health ───
  { id: "pmos-dx-eval", src: "/images/pmos-dx-eval.png", label: "PMOS Diagnosis & Evaluation", category: "Women's Health", description: "PCOS/PMOS diagnosis and evaluation algorithm", sourcePages: [{ label: "PCOS", path: "/pcos" }, { label: "Women Health", path: "/women-health" }, { label: "Lipid Panel", path: "/lipid-panel" }] },
  { id: "hrt-algorithm", src: "/images/hrt-algorithm.png", label: "HRT Algorithm", category: "Women's Health", description: "Hormone replacement therapy algorithm", sourcePages: [{ label: "Women Health", path: "/women-health" }] },

  // ─── Other ───
  { id: "vitamin-d", src: vitaminDProtocol.url, label: "Vitamin D Treatment & Monitoring Protocol", category: "Other", description: "Comprehensive protocol for vitamin D assessment and management. Includes loading doses (e.g., 60k IU weekly) and maintenance strategies. Source: Clinical Consensus Guidelines.", sourcePages: [{ label: "Vitamin D", path: "/vitamin-d" }] },
  { id: "constipation-definition", src: constipationDefinition.url, label: "Constipation Definition & Causes", category: "Other", description: "Definition of constipation and common acute and chronic causes", sourcePages: [{ label: "Constipation", path: "/infections/constipation" }] },
  { id: "constipation-management", src: constipationManagement.url, label: "Constipation Management", category: "Other", description: "Stepwise pharmacological and lifestyle management of constipation", sourcePages: [{ label: "Constipation", path: "/infections/constipation" }] },
  { id: "masld-overview", src: masldOverview.url, label: "MASLD Overview", category: "Other", description: "MASLD assessment, management and treatment overview infographic", sourcePages: [{ label: "Liver Mini App", path: "/liver" }] },
  { id: "fatigue-flowchart", src: "/fatigue-flowchart.jpg", label: "Fatigue Flowchart", category: "Other", description: "Fatigue evaluation flowchart", sourcePages: [{ label: "Fatigue", path: "/fatigue" }] },
  { id: "anticoagulation-cheatsheet", src: "/anticoagulation-cheatsheet.jpg", label: "Anticoagulation Cheatsheet", category: "Other", description: "Anticoagulation quick reference", sourcePages: [{ label: "Liver Mini App", path: "/liver" }] },
  { id: "doctor-monitors", src: "/doctor-monitors.jpg", label: "Doctor Monitors", category: "Other", description: "Landing page hero image", sourcePages: [{ label: "Landing Page", path: "/" }] },
  { id: "vitamin-d-chart", src: "/images/vitamin-d.png", label: "Vitamin D Reference Chart", category: "Other", description: "Vitamin D reference chart — sources, thresholds and interpretation", sourcePages: [{ label: "Vitamin D", path: "/vitamin-d" }] },
  { id: "standard-drink-guide", src: "/standard-drink-guide.svg", label: "Standard Drink Sizes", category: "Other", description: "Standard drink sizes reference guide — beer, wine, and spirits", sourcePages: [{ label: "Liver Mini App", path: "/liver" }] },
  { id: "frailty-cfs-scale", src: "/frailty-cfs-scale.png", label: "Clinical Frailty Scale", category: "Other", description: "Clinical Frailty Scale — grading frailty from very fit through to terminally ill", sourcePages: [{ label: "Frailty Calculator", path: "/frailty-calculator" }, { label: "Geriatrics", path: "/geriatrics" }] },
  { id: "frailty-scale-chart", src: frailtyScaleChartImg, label: "Frailty Scale Chart", category: "Other", description: "Frailty scale reference chart", sourcePages: [{ label: "Frailty Calculator", path: "/frailty-calculator" }] },
  { id: "frailty-questionnaire", src: frailtyQuestionnaireImg, label: "Frailty Questionnaire & CFS Scoring", category: "Other", description: "Frailty questionnaire and CFS scoring flowchart for assigning frailty categories from reported functional dependence and symptoms", sourcePages: [{ label: "Frailty Calculator", path: "/frailty-calculator" }, { label: "Geriatrics", path: "/geriatrics" }] },
  { id: "hero-doctor", src: heroDoctorImg, label: "Cardiovascular Care", category: "Other", description: "Cardiovascular care illustration used in the lipid panel", sourcePages: [{ label: "Lipid Panel", path: "/lipid-panel" }] },
  { id: "mallampati-score", src: mallampatiScore.url, label: "Mallampati Score", category: "Other", description: "Mallampati classification (Class I–IV) airway diagram for predicting difficult intubation", sourcePages: [{ label: "Perioperative Tools", path: "/perioperative-calculators" }] },

  // ─── Infections ───
  { id: "antibiotic-spectrum-map", src: "/images/antibiotic-spectrum-map.jpg", label: "Antibiotic Spectrum Map", category: "Infections", description: "Quick visual guide to antibiotic coverage — Gram-positive, Gram-negative, anaerobes, and atypicals", sourcePages: [{ label: "Infections", path: "/infections" }] },
  { id: "acute-diarrhoea-classification", src: acuteDiarrhoeaClassification.url, label: "Acute Diarrhoea Classification", category: "Infections", description: "Acute diarrhoea classification and initial management approach", sourcePages: [{ label: "Diarrhoea and Constipation", path: "/acute-diarrhoea" }] },
  // Note: the food-poisoning poster and the "acute diarrhoea overview poster" are the
  // same artwork in this repo (byte-identical files), so they share one entry.
  { id: "food-poisoning-poster", src: "/images/acute-diarrhoea.jpg", label: "Acute Diarrhoea / Food Poisoning Poster", category: "Infections", description: "Risk stratification and management overview poster — classification by incubation period and clinical syndrome", sourcePages: [{ label: "Food Poisoning", path: "/food-poisoning" }, { label: "Acute Diarrhoea", path: "/acute-diarrhoea" }] },
  { id: "food-poisoning-poster-2", src: foodPoisoningPoster2Img, label: "Food Poisoning Reference Poster", category: "Infections", description: "Additional food poisoning reference poster", sourcePages: [{ label: "Food Poisoning", path: "/food-poisoning" }] },
  { id: "food-poisoning-algorithm", src: foodPoisoningAlgorithmImg, label: "Food Poisoning Algorithm", category: "Infections", description: "Approach to suspected food poisoning — assessment and management algorithm", sourcePages: [{ label: "Food Poisoning", path: "/food-poisoning" }] },
  { id: "vaccines-live-vs-inactivated", src: vaccinesLiveVsInactivated.url, label: "Live vs Inactivated Vaccines", category: "Infections", description: "Live attenuated versus inactivated vaccines — and when each is contraindicated", sourcePages: [{ label: "Adult Vaccinations", path: "/adult-vaccinations" }] },

  // ─── Renal / AKI ───
  { id: "kdigo-2026-aki-akd-guideline", src: kdigoAkiAkd.url, label: "KDIGO 2026 AKI & AKD Guideline", category: "Renal / AKI", description: "Definitions and diagnostic criteria for acute kidney injury and acute kidney disease", sourcePages: [{ label: "AKI / AKD Mini App", path: "/aki-akd" }] },
  { id: "fst-infographic", src: "/images/fst-infographic.png", label: "FST Infographic", category: "Renal / AKI", description: "Furosemide Stress Test — predicting AKI progression", sourcePages: [{ label: "AKI Criteria", path: "/aki-criteria" }] },
  { id: "kdigo-staging-reference", src: "/kdigo-staging-reference.jpg", label: "KDIGO Staging Reference", category: "Renal / AKI", description: "KDIGO staging reference for acute kidney injury and chronic kidney disease", sourcePages: [{ label: "CKD Guideline", path: "/db/ckd-guideline" }, { label: "AKI / AKD", path: "/aki-criteria" }] },
  { id: "nice-ckd-algorithm", src: niceCkdAlgorithmImg, label: "NICE CKD Algorithm", category: "Renal / AKI", description: "NICE algorithm for the investigation and management of chronic kidney disease", sourcePages: [{ label: "CKD Guideline", path: "/db/ckd-guideline" }] },

  // ─── Infections ───
  { id: "antibiotics-spectrum", src: antibioticsSpectrum.url, label: "Antibiotics by Spectrum", category: "Infections", description: "Complete classification of antibiotics by gram-positive, gram-negative, and broad/mixed spectrum coverage", sourcePages: [{ label: "Infections", path: "/infections" }] },

  // ─── Anemia / Hemolysis ───
  { id: "hemolytic-anemia-algorithm", src: "/images/hemolytic-anemia-algorithm.jpg", label: "Hemolytic Anemia Algorithm", category: "Anemia & Coagulation", description: "Diagnostic algorithm for hemolytic anemia — Coombs-negative workup", sourcePages: [{ label: "Anemia", path: "/anemia" }] },
  { id: "anemia-algorithm", src: "/images/anemia-algorithm.jpg", label: "Anemia Algorithm", category: "Anemia & Coagulation", description: "MCV-based diagnostic algorithm for anemia — microcytic, normocytic, and macrocytic classification", sourcePages: [{ label: "Anemia", path: "/anemia" }] },
  { id: "essential-thrombocythemia-algorithm", src: "/images/essential-thrombocythemia-algorithm.jpg", label: "Essential Thrombocythemia Algorithm", category: "Anemia & Coagulation", description: "IPSET-thrombosis risk stratification and treatment algorithm for essential thrombocythemia", sourcePages: [{ label: "Anemia", path: "/anemia" }] },
  { id: "polycythemia-vera-algorithm", src: "/images/polycythemia-vera-algorithm.jpg", label: "Polycythemia Vera Algorithm", category: "Anemia & Coagulation", description: "Risk-stratified treatment algorithm for polycythemia vera — phlebotomy, aspirin, and cytoreductive therapy", sourcePages: [{ label: "Anemia", path: "/anemia" }] },
  { id: "erythrocytosis-approach", src: "/images/erythrocytosis/approach-to-erythrocytosis.jpg", label: "Approach to Erythrocytosis", category: "Anemia & Coagulation", description: "Diagnostic algorithm for erythrocytosis — PV vs secondary, JAK2 testing, and WHO criteria", sourcePages: [{ label: "Erythrocytosis / PV", path: "/anemia?tab=erythrocytosis" }] },
  { id: "erythrocytosis-molecular-key", src: "/images/erythrocytosis/molecular-key.jpg", label: "The Molecular Key — JAK2 in PV", category: "Anemia & Coagulation", description: "JAK2 V617F and exon 12 mutations driving polycythemia vera, with molecular testing approach", sourcePages: [{ label: "Erythrocytosis / PV", path: "/anemia?tab=erythrocytosis" }] },
  { id: "erythrocytosis-jak2-exon12", src: "/images/erythrocytosis/jak2-exon12.jpg", label: "Why JAK2 Exon 12 Matters", category: "Anemia & Coagulation", description: "JAK2 exon 12 mutations in V617F-negative PV — constitutive JAK-STAT activation and bone marrow findings", sourcePages: [{ label: "Erythrocytosis / PV", path: "/anemia?tab=erythrocytosis" }] },
  { id: "erythrocytosis-mpn-mutations", src: "/images/erythrocytosis/mpn-mutations.jpg", label: "MPN Driver Mutations", category: "Anemia & Coagulation", description: "Characteristic driver mutations of PV, ET, PMF, CML, and systemic mastocytosis", sourcePages: [{ label: "Erythrocytosis / PV", path: "/anemia?tab=erythrocytosis" }] },
  { id: "erythrocytosis-pv-vs-secondary", src: "/images/erythrocytosis/pv-vs-secondary.jpg", label: "PV vs Secondary Erythrocytosis", category: "Anemia & Coagulation", description: "Comparison of polycythemia vera and secondary erythrocytosis — causes and clinical clues", sourcePages: [{ label: "Erythrocytosis / PV", path: "/anemia?tab=erythrocytosis" }] },
  { id: "erythrocytosis-management", src: "/images/erythrocytosis/management-key-points.jpg", label: "Management & Key Points in PV", category: "Anemia & Coagulation", description: "WHO 2022 criteria, clinical features, complications, treatment principles, and risk stratification in PV", sourcePages: [{ label: "Erythrocytosis / PV", path: "/anemia?tab=erythrocytosis" }] },
  { id: "et-ipset-algorithm", src: "/images/erythrocytosis/et-ipset-algorithm.jpg", label: "Essential Thrombocythemia — IPSET-thrombosis", category: "Anemia & Coagulation", description: "Risk stratification and treatment algorithm for essential thrombocythemia (IPSET-thrombosis)", sourcePages: [{ label: "Erythrocytosis / PV", path: "/anemia?tab=erythrocytosis" }] },
  { id: "pv-treatment-algorithm", src: "/images/erythrocytosis/pv-treatment-algorithm.jpg", label: "Polycythemia Vera — Treatment Algorithm", category: "Anemia & Coagulation", description: "Risk-stratified treatment algorithm for polycythemia vera — phlebotomy, aspirin, cytoreductive therapy, ruxolitinib", sourcePages: [{ label: "Erythrocytosis / PV", path: "/anemia?tab=erythrocytosis" }] },
  { 
    id: "structured-hypercortisolism-screen", 
    src: structuredHypercortisolism.url, 
    label: "Structured Hypercortisolism Screen for Refractory Big 4", 
    category: "Endocrinology & Osteoporosis", 
    description: "Structured approach to hypercortisolism screening in refractory T2D, HTN, obesity, and osteoporosis (Big 4). Includes case identification, pre-screen checks (therapeutic steroids, etc.), 1-mg overnight DST interpretation, and confirmatory evaluation path.", 
    sourcePages: [
      { label: "Diabetes", path: "/diabetes/treatment" },
      { label: "Secondary HTN", path: "/hypertension/assessment" },
      { label: "Obesity", path: "/obesity" }
    ] 
  },
  {
    id: "osteoporosis-treatment-approach",
    src: osteoporosisTreatment.url,
    label: "Osteoporosis Treatment Approach (2026)",
    category: "Endocrinology & Osteoporosis",
    description: "2026 update on osteoporosis medication sequencing: Anabolic-first strategy in very high-risk patients vs antiresorptive-first in high-risk patients. Source: Consensus clinical update 2026.",
    sourcePages: [
      { label: "Vitamin D", path: "/vitamin-d" },
      { label: "Geriatrics", path: "/geriatrics?tab=fractures" }
    ]
  },
  {
    id: "bisphosphonates-criteria",
    src: bisphosphonatesCriteria.url,
    label: "Clinical Criteria for Initiating Bisphosphonates",
    category: "Endocrinology & Osteoporosis",
    description: "Specific diagnostic thresholds for bisphosphonate therapy across primary osteoporosis, glucocorticoid-induced osteoporosis, and oncology-specific criteria. Includes mandatory clinical prerequisites (renal function, metabolic status, esophageal health).",
    sourcePages: [
      { label: "Vitamin D", path: "/vitamin-d" }
    ]
  },
  {
    id: "fragility-fracture-first-line-v2",
    src: fragilityFractureFirstLineV2.url,
    label: "Osteoporosis Fragility Fracture: First-Line Visual Guide",
    category: "Endocrinology & Osteoporosis",
    description: "Visual clinical guide for first-line osteoporosis treatment (Bisphosphonates). Includes clinical situation matching (ambulant vs dysphagia vs poor adherence), treatment selection (Alendronate, Risedronate, Zoledronic acid, Denosumab), and route/risk categorization.",
    sourcePages: [
      { label: "Vitamin D", path: "/vitamin-d" }
    ]
  },
  {
    id: "osteoporosis-summary",
    src: "/osteoporosis-summary.jpg",
    label: "Osteoporosis Summary",
    category: "Endocrinology & Osteoporosis",
    description: "Osteoporosis summary — diagnosis, treatment and follow-up",
    sourcePages: [
      { label: "Bone Health", path: "/bone-health" }
    ]
  },
  {
    id: "osteoporosis-algorithm",
    src: "/osteoporosis-algorithm.jpg",
    label: "Osteoporosis Treatment Algorithm",
    category: "Endocrinology & Osteoporosis",
    description: "Osteoporosis treatment algorithm — risk stratification and therapy selection",
    sourcePages: [
      { label: "Bone Health", path: "/bone-health" },
      { label: "Vitamin D", path: "/vitamin-d" }
    ]
  },
  {
    id: "fragility-fracture-management-guide",
    src: additionalOsteoporosisAlgorithm.url,
    label: "Fragility Fracture Management Guide",
    category: "Endocrinology & Osteoporosis",
    description: "Management guide for fragility fractures in osteoporosis",
    sourcePages: [
      { label: "Vitamin D", path: "/vitamin-d" },
      { label: "Bone Health", path: "/bone-health" }
    ]
  },
];

const CATEGORIES = [...new Set(IMAGE_CATALOG.map((img) => img.category))];

/**
 * Resolve a deep link to a catalog entry: exact id, then a known alias, then a
 * loose label match (so pre-existing `?search=`-style links keep resolving).
 */
function resolveImage(imageParam: string): ImageEntry | null {
  const q = imageParam.trim().toLowerCase();
  if (!q) return null;
  return (
    IMAGE_CATALOG.find((img) => img.id.toLowerCase() === q) ??
    IMAGE_CATALOG.find((img) => img.aliases?.some((a) => a.toLowerCase() === q)) ??
    IMAGE_CATALOG.find((img) => img.label.toLowerCase().includes(q)) ??
    null
  );
}

export default function ImageGallery() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const imageParam = searchParams.get("image") || "";
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>(
    Object.fromEntries(CATEGORIES.map((c) => [c, true]))
  );

  // A "View ..." link from a clinical page focuses one image by id.
  const focused = resolveImage(imageParam);
  // An id that resolves to nothing must say so, rather than silently show everything.
  const unresolvedImage = imageParam.trim() !== "" && focused === null;

  const filtered = focused
    ? [focused]
    : IMAGE_CATALOG.filter(
        (img) =>
          img.label.toLowerCase().includes(search.toLowerCase()) ||
          img.category.toLowerCase().includes(search.toLowerCase()) ||
          img.description.toLowerCase().includes(search.toLowerCase())
      );

  const grouped = CATEGORIES.map((cat) => ({
    category: cat,
    images: filtered.filter((img) => img.category === cat),
  })).filter((g) => g.images.length > 0);

  const showAll = () => {
    setSearch("");
    navigate("/images", { replace: true });
  };

  const toggleCategory = (cat: string) => {
    // While focused on a single image the category is pinned open, so the first
    // click on the header should return to the full gallery instead.
    if (focused) {
      showAll();
      return;
    }
    setExpandedCategories((prev) => ({ ...prev, [cat]: !prev[cat] }));
  };

  return (
    <div className="min-h-screen bg-background" role="none">
      <Seo
        title="Image Gallery — Clinical Algorithms & Pocket Cards"
        description="Zoomable clinical algorithms, mnemonics and pocket cards across diabetes, hypertension, lipids, renal, infections and geriatrics."
        path="/images"
      />
      {/* Sticky Header */}
      <div className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="mx-auto max-w-4xl px-4">
          <div className="flex items-center gap-3 py-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 shadow-md">
              <Image className="h-5 w-5 text-foreground" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="font-display text-xl font-extrabold tracking-tight bg-gradient-to-r from-purple-500 via-violet-500 to-indigo-600 bg-clip-text text-transparent truncate">
                Image Gallery
              </h1>
              <p className="text-xs font-medium text-muted-foreground truncate">
                All reference images in one place
              </p>
            </div>
            <div className="flex items-center gap-2 no-print shrink-0">
              <Button variant="ghost" size="sm" onClick={() => navigate("/")} title="Back to Home">
                <Home className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <main id="main-content" className="mx-auto w-full max-w-4xl px-4 py-6 space-y-6">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search images..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              // Typing takes over from a deep link.
              if (imageParam) navigate("/images", { replace: true });
            }}
            className="pl-10 bg-card border-border"
          />
        </div>

        {focused && (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2">
            <p className="text-sm">
              Showing: <span className="font-semibold">{focused.label}</span>
            </p>
            <button onClick={showAll} className="text-xs font-medium text-primary hover:underline">
              Show all images
            </button>
          </div>
        )}

        {!unresolvedImage && filtered.length > 0 && (
          <p className="text-xs text-muted-foreground">
            {filtered.length} image{filtered.length !== 1 ? "s" : ""} found
          </p>
        )}

        {unresolvedImage && (
          <Card className="clinical-card">
            <CardContent className="space-y-3 py-10 text-center">
              <Image className="mx-auto h-8 w-8 text-muted-foreground" />
              <p className="text-sm font-medium">No image matches “{imageParam}”.</p>
              <p className="text-xs text-muted-foreground">
                The linked image may have been renamed or removed from the catalog.
              </p>
              <Button variant="outline" size="sm" onClick={showAll}>
                Show all images
              </Button>
            </CardContent>
          </Card>
        )}

        {!unresolvedImage && filtered.length === 0 && (
          <Card className="clinical-card">
            <CardContent className="space-y-3 py-10 text-center">
              <Image className="mx-auto h-8 w-8 text-muted-foreground" />
              <p className="text-sm font-medium">No images match “{search}”.</p>
              <Button variant="outline" size="sm" onClick={() => setSearch("")}>
                Clear search
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Image Grid by Category.
            Suppressed when a deep link names an id the catalog doesn't have: the
            empty state above already offers the way back, and rendering the whole
            gallery underneath would leave that button with nothing to reveal. */}
        {!unresolvedImage && grouped.map((group) => (
          <Card key={group.category} className="clinical-card overflow-hidden">
            <button
              onClick={() => toggleCategory(group.category)}
              className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors"
            >
              <CardTitle className="text-base flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {group.images.length}
                </Badge>
                {group.category}
              </CardTitle>
              {expandedCategories[group.category] ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </button>

            {(focused || expandedCategories[group.category]) && (
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {group.images.map((img) => (
                    <div
                      key={img.id}
                      className="rounded-lg border border-border bg-card/50 overflow-hidden group"
                    >
                      <a
                        href={img.src}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block"
                      >
                        <div className="aspect-video bg-muted/30 flex items-center justify-center overflow-hidden">
                          <img
                            src={img.src}
                            alt={img.label}
                            className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform"
                            loading="lazy"
                          />
                        </div>
                      </a>
                      <div className="p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="font-semibold text-sm">{img.label}</p>
                          <a
                            href={img.src}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-muted-foreground hover:text-foreground transition-colors"
                            title="Open full size"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        </div>
                        <p className="text-xs text-muted-foreground">{img.description}</p>
                        <div className="flex flex-wrap gap-1">
                          {img.sourcePages.map((page, i) => (
                            <button
                              key={i}
                              onClick={() => navigate(page.path)}
                              className="text-xs text-primary hover:underline"
                            >
                              {page.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            )}
          </Card>
        ))}
      </main>    </div>
  );
}
