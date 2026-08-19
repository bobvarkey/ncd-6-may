import { useState, useMemo, useEffect } from "react";
import { useLocation } from "react-router-dom";
import {
  Heart, AlertTriangle, CheckCircle, ChevronDown, ChevronUp, Shield, Wind, Brain, Eye, Timer, Droplets, Pill, FileText,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import ZoomableImage from "@/components/ZoomableImage";
import { CsdhRiskCalculator } from "@/calculators/perioperative/CsdhRiskCalculator";
import mallampatiAsset from "@/assets/mallampati-score.png.asset.json";

// ─── RCRI (Revised Cardiac Risk Index) ───
interface RCRIFactor {
  id: string;
  label: string;
  points: number;
  active: boolean;
}

const RCRI_FACTORS: RCRIFactor[] = [
  { id: "hx_ischemic", label: "History of ischemic heart disease (MI, angina, CABG, PCI)", points: 1, active: false },
  { id: "hx_hf", label: "History of heart failure", points: 1, active: false },
  { id: "hx_cva", label: "History of cerebrovascular disease (TIA, stroke)", points: 1, active: false },
  { id: "dm_insulin", label: "Diabetes mellitus requiring insulin therapy", points: 1, active: false },
  { id: "ckd", label: "Chronic kidney disease (Cr > 2.0 mg/dL)", points: 1, active: false },
  { id: "high_risk_surg", label: "High-risk surgery (intraperitoneal, intrathoracic, suprainguinal vascular)", points: 1, active: false },
];

const RCRI_CLASSES = [
  { label: "Class I", points: "0", risk: "0.4%", color: "text-success" },
  { label: "Class II", points: "1", risk: "0.9%", color: "text-success" },
  { label: "Class III", points: "2", risk: "6.6%", color: "text-warning" },
  { label: "Class IV", points: "≥3", risk: "11%", color: "text-destructive" },
];

// ─── ASA Physical Status ───
const ASA_CLASSES = [
  { class: "I", description: "Normal healthy patient — no systemic disease, good exercise tolerance", example: "Healthy, non-smoking, no meds", color: "text-success" },
  { class: "II", description: "Mild systemic disease — no substantive functional limitation", example: "Well-controlled HTN/DM, mild lung disease, pregnancy, social alcohol use, remote TIA/CVA with no/minimal residual deficit", color: "text-success" },
  { class: "III", description: "Severe systemic disease — substantive functional limitation, not constant threat to life", example: "Poorly controlled DM/HTN, mod-severe COPD, BMI ≥40, ESRD on dialysis, >3mo MI/CVA/TIA/stents, remote CVA with residual deficit", color: "text-warning" },
  { class: "IV", description: "Severe disease — constant threat to life", example: "Recent (<3mo) MI/CVA/TIA, ongoing ischemia, severe valve disease, low EF, sepsis, ARDS, unstable hemodynamics", color: "text-warning" },
  { class: "V", description: "Moribund — not expected to survive without surgery", example: "Ruptured AAA, massive trauma with shock, ischemic bowel with major cardiac disease", color: "text-destructive" },
  { class: "VI", description: "Declared brain-dead — organ donor", example: "Organ procurement", color: "text-muted-foreground" },
];

// ─── Mallampati Score ───
const MALLAMPATI_CLASSES = [
  { class: "I", description: "Soft palate, uvula, fauces, pillars visible", risk: "Low", intubation: "Easy", color: "text-success" },
  { class: "II", description: "Soft palate, uvula, fauces visible", risk: "Low", intubation: "Easy", color: "text-success" },
  { class: "III", description: "Soft palate, base of uvula visible", risk: "Moderate", intubation: "Moderate difficulty", color: "text-warning" },
  { class: "IV", description: "Only hard palate visible", risk: "High", intubation: "Difficult", color: "text-destructive" },
];

// ─── Caprini VTE Risk Score ───
interface CapriniFactor {
  id: string;
  label: string;
  points: number;
  active: boolean;
  group: "minor" | "moderate" | "major" | "high";
}

const CAPRINI_FACTORS: CapriniFactor[] = [
  // 1 point each
  { id: "age_41_60", label: "Age 41–60 years", points: 1, active: false, group: "minor" },
  { id: "bmi_25", label: "BMI > 25 kg/m²", points: 1, active: false, group: "minor" },
  { id: "pregnancy", label: "Pregnancy or postpartum (<1 month)", points: 1, active: false, group: "minor" },
  { id: "hx_abortion", label: "History of unexplained stillborn infant, recurrent spontaneous abortion, or preterm birth", points: 1, active: false, group: "minor" },
  { id: "edema", label: "Leg edema, varicose veins, or venous stasis", points: 1, active: false, group: "minor" },
  { id: "sepsis", label: "Sepsis (<1 month)", points: 1, active: false, group: "minor" },
  { id: "major_surg", label: "Major surgery (<1 month)", points: 1, active: false, group: "minor" },
  { id: "acute_mi", label: "Acute MI, HF exacerbation, or serious medical illness", points: 1, active: false, group: "minor" },
  { id: "copd", label: "COPD or pneumonia", points: 1, active: false, group: "minor" },
  { id: "bed_rest", label: "Bed rest >72 hours", points: 1, active: false, group: "minor" },
  { id: "pneumonia", label: "Pneumonia", points: 1, active: false, group: "minor" },
  { id: "central_line", label: "Central venous access", points: 1, active: false, group: "minor" },
  { id: "blood_transfusion", label: "Blood transfusion (<1 month)", points: 1, active: false, group: "minor" },
  // 2 points each
  { id: "age_61_74", label: "Age 61–74 years", points: 2, active: false, group: "moderate" },
  { id: "arthroscopic", label: "Arthroscopic surgery", points: 2, active: false, group: "moderate" },
  { id: "malignancy", label: "Malignancy (current or previous)", points: 2, active: false, group: "moderate" },
  { id: "laparoscopic", label: "Laparoscopic surgery (>45 min)", points: 2, active: false, group: "moderate" },
  { id: "bed_rest_72h", label: "Bed rest >72 hours", points: 2, active: false, group: "moderate" },
  { id: "cast_immobilization", label: "Plaster cast or splint", points: 2, active: false, group: "moderate" },
  // 3 points each
  { id: "age_75", label: "Age ≥75 years", points: 3, active: false, group: "major" },
  { id: "vte_hx", label: "History of VTE (DVT/PE)", points: 3, active: false, group: "major" },
  { id: "family_vte", label: "Family history of VTE", points: 3, active: false, group: "major" },
  { id: "factor_v_leiden", label: "Factor V Leiden", points: 3, active: false, group: "major" },
  { id: "prothrombin", label: "Prothrombin 20210A", points: 3, active: false, group: "major" },
  { id: "lupus_anticoag", label: "Lupus anticoagulant", points: 3, active: false, group: "major" },
  { id: "anticardiolipin", label: "Anticardiolipin antibodies", points: 3, active: false, group: "major" },
  { id: "elevated_homocysteine", label: "Elevated serum homocysteine", points: 3, active: false, group: "major" },
  { id: "hx_heparin", label: "Heparin-induced thrombocytopenia (HIT)", points: 3, active: false, group: "major" },
  { id: "other_thrombophilia", label: "Other congenital/acquired thrombophilia", points: 3, active: false, group: "major" },
  // 5 points each
  { id: "elective_arthroplasty", label: "Elective major lower extremity arthroplasty", points: 5, active: false, group: "high" },
  { id: "hip_pelvis_fracture", label: "Hip, pelvis, or leg fracture", points: 5, active: false, group: "high" },
  { id: "stroke", label: "Stroke (<1 month)", points: 5, active: false, group: "high" },
  { id: "acute_spinal_cord", label: "Acute spinal cord injury (<1 month)", points: 5, active: false, group: "high" },
  { id: "multiple_trauma", label: "Multiple trauma (<1 month)", points: 5, active: false, group: "high" },
];

const CAPRINI_RISK_LEVELS = [
  { min: 0, max: 1, risk: "Low", vte_risk: "<10%", prophylaxis: "Early ambulation ± mechanical", color: "text-success" },
  { min: 2, max: 3, risk: "Moderate", vte_risk: "10–20%", prophylaxis: "Mechanical ± pharmacologic", color: "text-warning" },
  { min: 4, max: 5, risk: "High", vte_risk: "20–30%", prophylaxis: "Pharmacologic + mechanical", color: "text-warning" },
  { min: 6, max: 99, risk: "Very High", vte_risk: ">30%", prophylaxis: "Pharmacologic + mechanical ± extended prophylaxis", color: "text-destructive" },
];

// ─── Surgical Apgar Score ───
interface ApgarInputs {
  estimatedBloodLoss: string;
  lowestMAP: string;
  lowestHR: string;
}

const APGAR_POINTS_MAP = (ebl: number, map: number, hr: number): number => {
  let points = 0;
  // EBL
  if (ebl <= 100) points += 4;
  else if (ebl <= 600) points += 3;
  else if (ebl <= 1000) points += 2;
  else if (ebl <= 1500) points += 1;
  else points += 0;
  // MAP
  if (map > 70) points += 4;
  else if (map > 60) points += 3;
  else if (map > 50) points += 2;
  else if (map > 40) points += 1;
  else points += 0;
  // HR
  if (hr <= 70) points += 4;
  else if (hr <= 90) points += 3;
  else if (hr <= 110) points += 2;
  else if (hr <= 130) points += 1;
  else points += 0;
  return points;
};

const APGAR_RISK = [
  { min: 9, max: 10, risk: "Very Low", mortality: "0.2%", morbidity: "5.4%", color: "text-success" },
  { min: 7, max: 8, risk: "Low", mortality: "0.7%", morbidity: "9.8%", color: "text-success" },
  { min: 5, max: 6, risk: "Moderate", mortality: "2.5%", morbidity: "17.5%", color: "text-warning" },
  { min: 3, max: 4, risk: "High", mortality: "7.6%", morbidity: "32.6%", color: "text-warning" },
  { min: 0, max: 2, risk: "Very High", mortality: "21.5%", morbidity: "56.2%", color: "text-destructive" },
];

// ─── STOP-Bang (OSA Screening) ───
interface STOPBangItem {
  id: string;
  label: string;
  active: boolean;
}

const STOPBANG_ITEMS: STOPBangItem[] = [
  { id: "snore", label: "Snoring (loud enough to be heard through closed doors)", active: false },
  { id: "tired", label: "Tired/fatigued during daytime despite adequate sleep", active: false },
  { id: "observed", label: "Observed apnea (someone witnessed you stop breathing)", active: false },
  { id: "pressure", label: "High blood pressure (treated or untreated)", active: false },
  { id: "bmi_35", label: "BMI > 35 kg/m²", active: false },
  { id: "age_50", label: "Age > 50 years", active: false },
  { id: "neck", label: "Neck circumference > 40 cm (male) or > 35 cm (female)", active: false },
  { id: "gender_male", label: "Male gender", active: false },
];

const STOPBANG_RISK = [
  { min: 0, max: 2, risk: "Low", osa_prob: "Low probability of moderate-severe OSA", color: "text-success" },
  { min: 3, max: 4, risk: "Intermediate", osa_prob: "Consider polysomnography if high clinical suspicion", color: "text-warning" },
  { min: 5, max: 8, risk: "High", osa_prob: "High probability of moderate-severe OSA — consider PSG", color: "text-destructive" },
];

// ─── NSQIP Simplified Risk ───
interface NSQIPInputs {
  age: string;
  sex: "male" | "female" | "";
  functionalStatus: "independent" | "partially" | "totally" | "";
  ascites: "yes" | "no" | "";
  copd: "yes" | "no" | "";
  dm: "none" | "oral" | "insulin" | "";
  htn: "yes" | "no" | "";
  chf: "yes" | "no" | "";
  dialysis: "yes" | "no" | "";
  steroid: "yes" | "no" | "";
  weightLoss: "yes" | "no" | "";
  bleeding: "yes" | "no" | "";
  sepsis: "none" | "sirs" | "sepsis" | "septic" | "";
  surgeryType: "low" | "intermediate" | "high" | "";
  emergency: "yes" | "no" | "";
}

// ─── Perioperative Medication Management ───
interface MedManagement {
  drug: string;
  preop: string;
  postop: string;
  notes: string;
  category: "cardiac" | "endocrine" | "renal" | "pulmonary" | "cns" | "rheum" | "gi" | "other";
}

const PERIOP_MEDS: MedManagement[] = [
  // Cardiac
  { drug: "Beta-blockers", preop: "Continue (withhold day of surgery if hypotension)", postop: "Resume as soon as hemodynamically stable", notes: "Withdrawal can cause rebound tachycardia, hypertension, ischemia. Taper if discontinuing.", category: "cardiac" },
  { drug: "Statins", preop: "Continue (take morning of surgery)", postop: "Resume ASAP", notes: "Perioperative statin reduces MI risk. Withdrawal increases cardiac events.", category: "cardiac" },
  { drug: "Aspirin (primary prevention)", preop: "Hold 5–7 days before surgery", postop: "Resume when bleeding risk low (usually 24–48h)", notes: "Low bleeding risk procedures (dental, skin, cataract) — continue aspirin.", category: "cardiac" },
  { drug: "Aspirin (secondary prevention)", preop: "Continue for most surgeries (hold for high bleeding risk)", postop: "Resume ASAP", notes: "Bridging with GP IIb/IIIa inhibitors rarely needed. Discuss with cardiology.", category: "cardiac" },
  { drug: "P2Y12 inhibitors (clopidogrel, ticagrelor, prasugrel)", preop: "Hold 5–7 days (clopidogrel), 3–5 days (ticagrelor), 7 days (prasugrel)", postop: "Resume when bleeding risk low", notes: "Bare metal stent: hold 4 weeks. DES: hold 6–12 months if possible. Bridging with cangrelor or tirofiban in high-risk.", category: "cardiac" },
  { drug: "Warfarin", preop: "Hold 5 days, bridge with LMWH if high thromboembolic risk", postop: "Resume when hemostasis achieved (usually 12–24h)", notes: "High risk: mechanical mitral valve, AF with CHA₂DS₂-VASc ≥6, recent VTE (<3 months).", category: "cardiac" },
  { drug: "DOACs (apixaban, rivaroxaban, edoxaban, dabigatran)", preop: "Hold 24–48h (low bleeding risk) or 48–72h (high bleeding risk)", postop: "Resume when hemostasis achieved (usually 24–48h)", notes: "Renal function affects timing. Dabigatran: hold longer if CrCl <50. No routine bridging needed.", category: "cardiac" },
  { drug: "ACEi/ARBs", preop: "Hold 24h before surgery (or morning of)", postop: "Resume when hemodynamically stable (usually 24–48h)", notes: "Continue in HF with reduced EF. Associated with intraoperative hypotension. Restart before discharge.", category: "cardiac" },
  { drug: "CCBs (non-DHP: verapamil, diltiazem)", preop: "Continue (hold if hypotension)", postop: "Resume when stable", notes: "Rate control for AF. Avoid in WPW with pre-excited AF.", category: "cardiac" },
  { drug: "CCBs (DHP: amlodipine, nifedipine)", preop: "Continue", postop: "Resume when stable", notes: "No significant perioperative concerns.", category: "cardiac" },
  { drug: "Digoxin", preop: "Continue (check levels)", postop: "Resume when stable", notes: "Narrow therapeutic window. Monitor K+, Mg²⁺, renal function. Toxicity risk with hypokalemia.", category: "cardiac" },
  { drug: "Amiodarone", preop: "Continue", postop: "Resume when stable", notes: "Long half-life (40–55 days). Monitor thyroid, LFTs, pulmonary. Drug interactions (CYP inhibitor).", category: "cardiac" },
  { drug: "Diuretics", preop: "Hold morning of surgery (or continue if HF)", postop: "Resume when stable, monitor electrolytes", notes: "Hypovolemia risk. Check K+ pre-op. Continue in HF to avoid pulmonary congestion.", category: "cardiac" },
  { drug: "Nitrates", preop: "Continue (transdermal patch may be removed for surgery)", postop: "Resume when stable", notes: "Avoid hypotension. Transdermal: remove if risk of hypotension.", category: "cardiac" },
  { drug: "Antiarrhythmics", preop: "Continue all antiarrhythmics", postop: "Resume when stable", notes: "Check drug levels (digoxin, procainamide). Monitor QT interval. Avoid QT-prolonging drugs.", category: "cardiac" },
  // Endocrine
  { drug: "Insulin (Type 1 DM)", preop: "Reduce basal insulin by 20–30% day before. Give 50–80% basal on morning of surgery.", postop: "Resume basal + correction. Sliding scale alone is inadequate.", notes: "NEVER hold basal insulin in Type 1 DM — risk of DKA. Target BG 140–180 mg/dL perioperatively. Hourly glucose monitoring.", category: "endocrine" },
  { drug: "Insulin (Type 2 DM)", preop: "Hold short-acting. Give 50–80% basal on morning of surgery.", postop: "Resume basal + correction when eating", notes: "Consider insulin infusion for prolonged surgery or poor control. Target BG 140–180 mg/dL.", category: "endocrine" },
  { drug: "Metformin", preop: "Hold 24h before surgery (or morning of)", postop: "Resume when renal function stable and eating", notes: "Lactic acidosis risk with renal impairment, contrast, hypotension. Hold 48h after contrast.", category: "endocrine" },
  { drug: "Sulfonylureas (glipizide, glimepiride)", preop: "Hold morning of surgery", postop: "Resume when eating", notes: "Hypoglycemia risk with NPO status. Long-acting (glibenclamide) hold 24h before.", category: "endocrine" },
  { drug: "DPP-4 inhibitors (sitagliptin, linagliptin)", preop: "Continue or hold morning of surgery", postop: "Resume when eating", notes: "Low hypoglycemia risk. Safe perioperatively.", category: "endocrine" },
  { drug: "GLP-1 RAs (semaglutide, liraglutide, dulaglutide)", preop: "Hold weekly GLP-1 RAs 1 week before. Hold daily GLP-1 RAs day before.", postop: "Resume when eating and GI function normal", notes: "Gastroparesis risk — increased aspiration risk. Consider rapid sequence induction. Hold before procedures requiring sedation.", category: "endocrine" },
  { drug: "SGLT2 inhibitors (empagliflozin, dapagliflozin)", preop: "Hold 3–4 days before surgery", postop: "Resume when eating and euglycemic", notes: "Euglycemic DKA risk. Hold 3–4 days before elective surgery. Monitor ketones if ill.", category: "endocrine" },
  { drug: "TZDs (pioglitazone)", preop: "Continue (hold if HF exacerbation)", postop: "Resume when eating", notes: "Fluid retention risk. Avoid in NYHA III/IV HF.", category: "endocrine" },
  { drug: "Corticosteroids (chronic)", preop: "Continue usual dose. Consider stress-dose for major surgery.", postop: "Continue stress dose, taper over 1–2 days", notes: "Adrenal insufficiency risk with chronic use. Stress dose: hydrocortisone 50–100 mg IV q8h for major surgery.", category: "endocrine" },
  { drug: "Thyroid hormone (levothyroxine)", preop: "Continue (take morning of surgery with small sip of water)", postop: "Resume when eating", notes: "Long half-life (7 days). Missing 1–2 doses is safe. IV form available if prolonged NPO.", category: "endocrine" },
  { drug: "Antithyroid drugs (methimazole, PTU)", preop: "Continue", postop: "Resume when stable", notes: "Monitor for agranulocytosis (fever, sore throat). Check CBC if symptomatic.", category: "endocrine" },
  { drug: "Estrogen/HRT/OCPs", preop: "Continue (or hold 4 weeks before major surgery if high VTE risk)", postop: "Resume when fully mobile", notes: "Increased VTE risk. Consider holding for major orthopedic or cancer surgery. Weigh risk vs benefit.", category: "endocrine" },
  { drug: "Testosterone", preop: "Continue", postop: "Resume when stable", notes: "No significant perioperative concerns.", category: "endocrine" },
  // Pulmonary
  { drug: "Inhaled bronchodilators (SABA, LABA, LAMA)", preop: "Continue (take morning of surgery)", postop: "Resume ASAP", notes: "Essential for COPD/asthma. Continue through perioperative period. May need MDI with spacer if unable to coordinate.", category: "pulmonary" },
  { drug: "Inhaled corticosteroids (ICS)", preop: "Continue", postop: "Resume ASAP", notes: "Continue to prevent exacerbation. May need IV hydrocortisone if unable to inhale.", category: "pulmonary" },
  { drug: "Leukotriene receptor antagonists (montelukast)", preop: "Continue", postop: "Resume when stable", notes: "No significant perioperative concerns.", category: "pulmonary" },
  { drug: "Theophylline", preop: "Continue (check levels)", postop: "Resume when stable", notes: "Narrow therapeutic window. Drug interactions. Monitor levels.", category: "pulmonary" },
  // CNS
  { drug: "SSRIs/SNRIs", preop: "Continue (abrupt withdrawal causes discontinuation syndrome)", postop: "Resume ASAP", notes: "Increased bleeding risk (especially with NSAIDs/anticoagulants). Taper if discontinuing.", category: "cns" },
  { drug: "MAOIs", preop: "Hold 2 weeks before elective surgery (if possible)", postop: "Resume when stable", notes: "Risk of hypertensive crisis with sympathomimetics. Serotonin syndrome risk. Consult psychiatry.", category: "cns" },
  { drug: "Lithium", preop: "Hold 24–72h before surgery (check levels)", postop: "Resume when stable and euvolemic", notes: "Narrow therapeutic window. Dehydration, NSAIDs, diuretics increase toxicity. Monitor levels, renal function.", category: "cns" },
  { drug: "Antipsychotics", preop: "Continue (consider QT monitoring)", postop: "Resume when stable", notes: "QT prolongation risk. Monitor QTc. Avoid other QT-prolonging drugs. Haloperidol IV for acute agitation.", category: "cns" },
  { drug: "Benzodiazepines (chronic)", preop: "Continue (do not abruptly withdraw)", postop: "Resume when stable", notes: "Withdrawal causes seizures, delirium. Taper if discontinuing. Use short-acting for sedation.", category: "cns" },
  { drug: "Antiepileptics", preop: "Continue (take morning of surgery with small sip of water)", postop: "Resume when stable", notes: "IV forms available if NPO. Check levels (phenytoin, valproate, carbamazepine). Drug interactions.", category: "cns" },
  { drug: "Parkinson's medications (levodopa/carbidopa)", preop: "Continue (hold morning of surgery if prolonged NPO)", postop: "Resume ASAP", notes: "Withdrawal causes rigidity, aspiration, NMS. Consider transdermal rotigotine if NPO. Avoid droperidol, metoclopramide.", category: "cns" },
  { drug: "Anticholinesterases (donepezil, rivastigmine)", preop: "Continue (hold morning of surgery)", postop: "Resume when stable", notes: "May prolong succinylcholine effect. Withdrawal worsens cognition.", category: "cns" },
  // Rheumatology
  { drug: "Methotrexate", preop: "Continue (hold 1 week before if high infection risk)", postop: "Resume when wound healing adequate", notes: "Low-dose MTX for RA: continue perioperatively. High-dose: hold 1 week. Monitor renal function.", category: "rheum" },
  { drug: "Biologics (TNFi, IL-6i, etc.)", preop: "Hold 1–2 dosing cycles before surgery", postop: "Resume when wound healing adequate (usually 14 days)", notes: "Increased infection risk. Time surgery at end of dosing cycle. Resume when no signs of infection.", category: "rheum" },
  { drug: "Hydroxychloroquine", preop: "Continue", postop: "Resume when stable", notes: "No significant perioperative concerns.", category: "rheum" },
  { drug: "Sulfasalazine", preop: "Continue", postop: "Resume when stable", notes: "No significant perioperative concerns.", category: "rheum" },
  { drug: "Leflunomide", preop: "Continue", postop: "Resume when stable", notes: "Long half-life. Cholestyramine washout if needed.", category: "rheum" },
  { drug: "Colchicine", preop: "Continue (hold if renal impairment)", postop: "Resume when stable", notes: "Monitor renal function. Drug interactions (CYP3A4, P-gp).", category: "rheum" },
  { drug: "NSAIDs", preop: "Hold 1–5 days before surgery (depending on half-life)", postop: "Resume when bleeding risk low", notes: "Increased bleeding risk (platelet dysfunction). Ibuprofen: hold 1 day. Naproxen: hold 3–5 days. Celecoxib: hold 1 day.", category: "rheum" },
  // GI
  { drug: "PPIs (omeprazole, pantoprazole)", preop: "Continue (take morning of surgery)", postop: "Resume when eating", notes: "Stress ulcer prophylaxis in ICU. IV form available.", category: "gi" },
  { drug: "H2RAs (famotidine, ranitidine)", preop: "Continue (take morning of surgery)", postop: "Resume when eating", notes: "IV form available. May reduce gastric volume and acidity.", category: "gi" },
  { drug: "Antiemetics (ondansetron)", preop: "Continue if needed", postop: "Use as needed for PONV", notes: "QT prolongation with ondansetron (dose-dependent). Aprepitant for high-risk PONV.", category: "gi" },
  { drug: "Immunosuppressants (tacrolimus, cyclosporine, mycophenolate)", preop: "Continue (hold morning of surgery if NPO)", postop: "Resume ASAP", notes: "IV forms available. Monitor levels. Risk of rejection if held too long.", category: "other" },
  { drug: "Antiretrovirals (ART)", preop: "Continue (take morning of surgery with small sip of water)", postop: "Resume ASAP", notes: "IV forms limited. Drug interactions with anesthetics. Check with ID/pharmacy.", category: "other" },
  { drug: "Antibiotics (chronic/prophylactic)", preop: "Continue (time surgical prophylaxis appropriately)", postop: "Resume when stable", notes: "Surgical prophylaxis: give within 60 min before incision. Redose for prolonged surgery or blood loss.", category: "other" },
  { drug: "Anticoagulants (prophylactic LMWH)", preop: "Hold 12h before surgery (or 24h if high dose)", postop: "Start 6–12h post-op (or 24h if high bleeding risk)", notes: "Neuraxial anesthesia: hold 12h (LMWH prophylactic), 24h (LMWH therapeutic).", category: "other" },
];

// ─── Perioperative Labs ───
interface PreopLab {
  test: string;
  indication: string;
  timing: string;
  notes: string;
}

const PREOP_LABS: PreopLab[] = [
  { test: "CBC", indication: "Major surgery, age >65, anemia symptoms, bleeding history", timing: "Within 30 days", notes: "Hb <10 g/dL may warrant further workup. Platelets <100K: bleeding risk." },
  { test: "BMP / Renal function", indication: "Age >50, CKD, DM, HTN, diuretics, ACEi/ARBs, contrast", timing: "Within 30 days", notes: "Cr >2.0: assess GFR. K+ <3.5 or >5.5: correct before surgery." },
  { test: "Coagulation (PT/PTT/INR)", indication: "Anticoagulant use, bleeding history, liver disease, malnutrition", timing: "Within 30 days", notes: "INR >1.5: increased bleeding risk. Correct with vitamin K or FFP if needed." },
  { test: "LFTs", indication: "Liver disease, alcohol use, hepatotoxic meds, biliary surgery", timing: "Within 30 days", notes: "Child-Pugh class affects surgical risk. AST/ALT >3x ULN: evaluate before elective surgery." },
  { test: "ECG", indication: "Age >65, cardiac history, DM, HTN, symptoms, high-risk surgery", timing: "Within 30 days", notes: "New changes: evaluate before surgery. Rhythm other than sinus: assess significance." },
  { test: "Chest X-ray", indication: "Age >70, cardiac/pulmonary disease, smokers, respiratory symptoms", timing: "Within 6 months", notes: "Not routine. Only if clinically indicated. New findings: evaluate before surgery." },
  { test: "Echocardiogram", indication: "Dyspnea of unknown cause, HF, murmur, known valve disease, prior abnormal echo", timing: "Within 12 months", notes: "LVEF <40%: high risk. Severe AS: consider valve intervention before elective non-cardiac surgery." },
  { test: "Stress test / Cardiac imaging", indication: "≥1 RCRI factor with poor functional capacity (<4 METs) undergoing high-risk surgery", timing: "Within 6 months", notes: "Only if results will change management. Do not routinely screen." },
  { test: "HbA1c", indication: "DM (known or suspected), poor glycemic control", timing: "Within 3 months", notes: "HbA1c >8%: increased infection risk. Optimize before elective surgery." },
  { test: "BNP / NT-proBNP", indication: "HF suspicion, dyspnea, high-risk surgery in elderly", timing: "Within 30 days", notes: "BNP >100 pg/mL or NT-proBNP >300 pg/mL: increased cardiac risk." },
  { test: "Troponin", indication: "ACS suspicion, high-risk patients undergoing high-risk surgery", timing: "Baseline + 48–72h post-op", notes: "Routine screening not recommended. Check if signs/symptoms of myocardial injury." },
  { test: "Pregnancy test", indication: "All women of childbearing age", timing: "Day of surgery", notes: "Mandatory before elective surgery. Discuss risks/benefits if positive." },
  { test: "Type & Screen / Crossmatch", indication: "Anticipated blood loss >500 mL, anemia, bleeding risk", timing: "Within 72 hours", notes: "Type & screen for low-risk. Crossmatch for high-risk. Antibody screen if prior transfusion." },
  { test: "Drug levels (digoxin, lithium, anticonvulsants)", indication: "Narrow therapeutic index drugs, toxicity concern", timing: "Within 24–48 hours", notes: "Therapeutic range: digoxin 0.5–1.0 ng/mL, lithium 0.6–1.2 mEq/L." },
];

// ─── Calculator cards (overview) ───
const CALCULATOR_CARDS: {
  value: string;
  title: string;
  icon: typeof Heart;
  inputs: string;
  results: string;
}[] = [
  { value: "rcri", title: "RCRI", icon: Heart, inputs: "6 cardiac risk factors (IHD, HF, CVA, insulin-treated DM, CKD, high-risk surgery)", results: "0–6 points → Class I–IV with % major cardiac event risk" },
  { value: "asa", title: "ASA Physical Status", icon: Shield, inputs: "Select the class that matches systemic disease burden", results: "ASA I–VI with description, examples and perioperative implications" },
  { value: "mallampati", title: "Mallampati", icon: Eye, inputs: "Oropharyngeal view on mouth opening (Class I–IV)", results: "Airway difficulty grade and intubation risk" },
  { value: "stopbang", title: "STOP-Bang", icon: Wind, inputs: "Snoring, tiredness, observed apnea, BP, BMI, age, neck size, sex", results: "0–8 score → low / intermediate / high OSA risk with airway plan" },
  { value: "caprini", title: "Caprini VTE", icon: Droplets, inputs: "Weighted thrombosis risk factors (1, 2, 3 and 5-point items)", results: "Total score → VTE risk band and prophylaxis recommendation" },
  { value: "apgar", title: "Surgical Apgar", icon: Timer, inputs: "Estimated blood loss, lowest MAP, lowest heart rate (intra-op)", results: "0–10 score → 30-day major complication / mortality risk" },
  { value: "woo", title: "Woo Perioperative Risk", icon: Brain, inputs: "Age, ASA class, surgery type and comorbidities", results: "Predicted stroke / MACE category with clinical interpretation" },
  { value: "sts", title: "STS Cardiac", icon: Heart, inputs: "Cardiac-surgery specific patient and procedure variables", results: "Estimated operative mortality and morbidity band" },
  { value: "meds", title: "Med Management", icon: Pill, inputs: "Browse by drug class (anticoagulants, antiplatelets, diabetes, etc.)", results: "Hold / continue timing before surgery and restart guidance" },
  { value: "labs", title: "Pre-op Labs", icon: FileText, inputs: "Patient factors and planned procedure risk", results: "Which pre-operative tests are indicated (and which are not)" },
  { value: "csdh", title: "cSDH Risk", icon: Brain, inputs: "Age, GCS, imaging (shift/thickness), ASA, frailty", results: "Standardized perioperative report for chronic SDH" },
];

// ─── Component ───
const PerioperativeCalculators = () => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState("rcri");

  useEffect(() => {
    const hash = location.hash.replace("#", "");
    if (hash && ["rcri", "asa", "mallampati", "stopbang", "caprini", "apgar", "meds", "labs", "woo", "sts", "csdh"].includes(hash)) {
      setActiveTab(hash);
      const element = document.getElementById(hash);
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    }
  }, [location]);

  return (
    <div className="space-y-5 animate-slide-in">
      <div>
        <h1 className="text-3xl font-heading font-bold">Perioperative Calculators</h1>
        <p className="text-base text-muted-foreground">
          Pre-operative risk assessment, intra-operative scoring, and medication management tools
        </p>
      </div>

      {/* Calculator cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {CALCULATOR_CARDS.map(card => {
          const Icon = card.icon;
          const isActive = activeTab === card.value;
          return (
            <button
              key={card.value}
              type="button"
              onClick={() => setActiveTab(card.value)}
              aria-pressed={isActive}
              className={`text-left rounded-xl border p-4 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                isActive ? "border-primary bg-primary/5" : "border-border bg-card hover:bg-muted/40"
              }`}
            >
              <div className="flex items-center gap-2">
                <Icon className={`w-4 h-4 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
                <h2 className="text-sm font-heading font-semibold">{card.title}</h2>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                <span className="font-medium text-foreground">Inputs: </span>{card.inputs}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                <span className="font-medium text-foreground">Results: </span>{card.results}
              </p>
            </button>
          );
        })}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">

        <TabsList className="flex-wrap h-auto gap-1 p-1">
          <TabsTrigger value="rcri" className="text-sm">RCRI</TabsTrigger>
          <TabsTrigger value="asa" className="text-sm">ASA Class</TabsTrigger>
          <TabsTrigger value="mallampati" className="text-sm">Mallampati</TabsTrigger>
          <TabsTrigger value="stopbang" className="text-sm">STOP-Bang</TabsTrigger>
          <TabsTrigger value="caprini" className="text-sm">Caprini VTE</TabsTrigger>
          <TabsTrigger value="apgar" className="text-sm">Surgical Apgar</TabsTrigger>
          <TabsTrigger value="meds" className="text-sm">Med Management</TabsTrigger>
          <TabsTrigger value="labs" className="text-sm">Pre-op Labs</TabsTrigger>
          <TabsTrigger value="woo" className="text-sm">Woo Perioperative Risk (Non-Cardiac Surgery)</TabsTrigger>
          <TabsTrigger value="sts" className="text-sm">STS Cardiac</TabsTrigger>
          <TabsTrigger value="csdh" className="text-sm">cSDH Risk</TabsTrigger>
        </TabsList>


        {/* ─── RCRI ─── */}
        <TabsContent value="rcri" className="mt-4 space-y-4">
          <RCRICalculator />
        </TabsContent>

        {/* ─── ASA ─── */}
        <TabsContent value="asa" className="mt-4 space-y-4">
          <ASACalculator />
        </TabsContent>

        {/* ─── Mallampati ─── */}
        <TabsContent value="mallampati" className="mt-4 space-y-4">
          <MallampatiCalculator />
        </TabsContent>

        {/* ─── STOP-Bang ─── */}
        <TabsContent value="stopbang" className="mt-4 space-y-4">
          <STOPBangCalculator />
        </TabsContent>

        {/* ─── Caprini ─── */}
        <TabsContent value="caprini" className="mt-4 space-y-4">
          <CapriniCalculator />
        </TabsContent>

        {/* ─── Surgical Apgar ─── */}
        <TabsContent value="apgar" className="mt-4 space-y-4">
          <SurgicalApgarCalculator />
        </TabsContent>

        {/* ─── Med Management ─── */}
        <TabsContent value="meds" className="mt-4 space-y-4">
          <PeriopMedManagement />
        </TabsContent>

        {/* ─── Pre-op Labs ─── */}
        <TabsContent value="labs" className="mt-4 space-y-4">
          <PreopLabsGuide />
        </TabsContent>
        <TabsContent value="woo" className="mt-4 space-y-4">
          <WooRiskCalculator onSwitchToASA={() => setActiveTab("asa")} />
        </TabsContent>
        <TabsContent value="sts" className="mt-4 space-y-4">
          <STSCardiacRiskCalculator />
        </TabsContent>
        <TabsContent value="csdh" className="mt-4 space-y-4">
          <CsdhRiskCalculator />
        </TabsContent>
      </Tabs>
    </div>
  );
};

// ─── RCRI Calculator ───
const RCRICalculator = () => {
  const [factors, setFactors] = useState<RCRIFactor[]>(RCRI_FACTORS);

  const toggleFactor = (id: string) => {
    setFactors(prev => prev.map(f => f.id === id ? { ...f, active: !f.active } : f));
  };

  const result = useMemo(() => {
    const total = factors.filter(f => f.active).reduce((s, f) => s + f.points, 0);
    const cls = total === 0 ? RCRI_CLASSES[0] : total === 1 ? RCRI_CLASSES[1] : total === 2 ? RCRI_CLASSES[2] : RCRI_CLASSES[3];
    return { total, cls, active: factors.filter(f => f.active) };
  }, [factors]);

  return (
    <div className="space-y-4">
      <Card className="border-border/40">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Heart className="w-5 h-5 text-rose-500" />
            Revised Cardiac Risk Index (RCRI)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Lee et al., Circulation 1999. Predicts major cardiac complications (MI, pulmonary edema, VF, cardiac arrest, complete heart block) in non-cardiac surgery.
          </p>


          {/* Result */}
          <div className={`clinical-card border-l-4 mb-4 ${
            result.total === 0 ? "border-l-success" :
            result.total === 1 ? "border-l-success" :
            result.total === 2 ? "border-l-warning" : "border-l-destructive"
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {result.total <= 1 ? (
                  <CheckCircle className="w-5 h-5 text-success" />
                ) : (
                  <AlertTriangle className={`w-5 h-5 ${result.cls.color}`} />
                )}
                <div>
                  <h3 className="font-heading font-bold text-lg">{result.cls.label}</h3>
                  <p className="text-xs text-muted-foreground">
                    {result.active.length} factors · {result.total} point{result.total !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className={`text-3xl font-heading font-bold ${result.cls.color}`}>{result.cls.risk}</span>
                <span className="text-xs text-muted-foreground block">MACE risk</span>
              </div>
            </div>
          </div>

          {/* Risk classes reference */}
          <div className="grid grid-cols-4 gap-2 mb-4">
            {RCRI_CLASSES.map(cls => (
              <div key={cls.label} className={`p-2 rounded-lg text-center ${
                cls.color === "text-success" ? "bg-success/10 border border-success/20" :
                cls.color === "text-warning" ? "bg-warning/10 border border-warning/20" :
                "bg-destructive/10 border border-destructive/20"
              }`}>
                <div className="font-medium text-sm">{cls.label}</div>
                <div className="text-xs text-muted-foreground">{cls.points} pts</div>
                <div className={`text-lg font-bold ${cls.color}`}>{cls.risk}</div>
                <div className="text-xs text-muted-foreground">MACE</div>
              </div>
            ))}
          </div>

          {/* Factors */}
          <div className="space-y-2">
            {factors.map(f => (
              <label key={f.id} className={`flex items-start gap-3 p-2.5 rounded-lg transition-colors cursor-pointer ${
                f.active ? "bg-warning/5 border border-warning/20" : "hover:bg-muted/30"
              }`}>
                <Switch
                  checked={f.active}
                  onCheckedChange={() => toggleFactor(f.id)}
                  className="mt-0.5 shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{f.label}</span>
                    <span className="text-xs px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground shrink-0">
                      +{f.points}
                    </span>
                  </div>
                </div>
              </label>
            ))}
          </div>

          {/* Management by class */}
          <div className="mt-4 p-3 rounded-lg bg-muted/30 border border-border/30">
            <h4 className="text-sm font-medium mb-2">Management by RCRI Class</h4>
            <div className="space-y-2 text-xs">
              <div className="p-2 rounded bg-success/5 border border-success/20">
                <strong>Class I–II (0–1 factors):</strong> Proceed with surgery. No additional cardiac testing needed.
              </div>
              <div className="p-2 rounded bg-warning/5 border border-warning/20">
                <strong>Class III (2 factors):</strong> Consider cardiac consultation. Optimize medical management. Beta-blockers if on chronic therapy.
              </div>
              <div className="p-2 rounded bg-destructive/5 border border-destructive/20">
                <strong>Class IV (≥3 factors):</strong> Cardiology consult recommended. Consider postponing for optimization. Beta-blockers, statins. Discuss risk/benefit.
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// ─── ASA Physical Status ───
const ASACalculator = () => {
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [showExamples, setShowExamples] = useState(false);

  return (
    <div className="space-y-4">
      <Card className="border-border/40">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="w-4 h-4 text-blue-500" />
            ASA Physical Status Classification
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground mb-4">
            American Society of Anesthesiologists physical status classification system. A global assessment of a patient's pre-operative physical state.
          </p>

          <div className="space-y-2">
            {ASA_CLASSES.map(asa => (
              <button
                key={asa.class}
                onClick={() => setSelectedClass(asa.class)}
                className={`w-full text-left p-3 rounded-lg border transition-colors ${
                  selectedClass === asa.class
                    ? "bg-primary/5 border-primary/30"
                    : "bg-muted/20 border-border/40 hover:bg-muted/30"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className={`text-lg font-bold ${asa.color}`}>ASA {asa.class}</span>
                    <div>
                      <p className="text-sm font-medium">{asa.description}</p>
                      <p className="text-xs text-muted-foreground">{asa.example}</p>
                    </div>
                  </div>
                  {selectedClass === asa.class && (
                    <CheckCircle className="w-5 h-5 text-primary shrink-0" />
                  )}
                </div>
              </button>
            ))}
          </div>

          {selectedClass && (
            <div className="mt-4 p-3 rounded-lg bg-primary/5 border border-primary/20">
              <h4 className="text-sm font-medium mb-2">Selected: ASA {selectedClass}</h4>
              <p className="text-xs text-muted-foreground">
                {selectedClass === "I" && "Normal healthy patient with no systemic disease and good exercise tolerance. No medical problems. No smoking. No medications."}
                {selectedClass === "II" && "Patient with mild systemic disease without substantive functional limitation. Examples: well-controlled HTN or diabetes, mild lung disease, social alcohol use, pregnancy. Remote TIA/CVA with no or minimal residual deficit and no significant functional limitation."}
                {selectedClass === "III" && "Patient with severe systemic disease that results in substantive functional limitations (but not a constant threat to life). Examples: poorly controlled DM or HTN, moderate-severe COPD, BMI ≥40, ESRD on regular dialysis, >3-month history of MI, CVA, TIA, or stents. Remote (>3 months) TIA/CVA with clear residual deficit causing substantive functional limitation, but medically stable. Or stroke with well-controlled comorbidities, able to perform some activities but clearly limited."}
                {selectedClass === "IV" && "Patient with severe systemic disease that is a constant threat to life. Examples: recent (<3 months) MI or CVA/TIA, ongoing ischemia, severe valve disease, severe reduction in EF, sepsis, ARDS. Stroke with unstable hemodynamics, progressive neurologic deficit, or other organ failure making the patient at constant threat to life. ICU-level care may be needed."}
                {selectedClass === "V" && "Moribund patient who is not expected to survive without the operation. Examples: ruptured abdominal/thoracic aneurysm, massive trauma with shock, ischemic bowel with major cardiac disease. Emergency salvage procedure."}
                {selectedClass === "VI" && "Declared brain-dead patient whose organs are being removed for donor purposes."}
              </p>
              <div className="mt-2 text-xs text-muted-foreground">
                <strong>Note:</strong> ASA class alone does not predict surgical risk. Use with RCRI or other risk calculators.
              </div>
            </div>
          )}

          <div className="mt-4 p-3 rounded-lg bg-muted/30 border border-border/30">
            <h4 className="text-xs font-medium mb-1">ASA with Emergency Modifier</h4>
            <p className="text-xs text-muted-foreground">
              Add "E" suffix for emergency surgery (e.g., ASA IIIE). Emergency surgery increases risk by approximately 1 ASA class equivalent.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// ─── Mallampati Score ───
const MallampatiCalculator = () => {
  const [selectedClass, setSelectedClass] = useState<string>("");

  return (
    <div className="space-y-4">
      <Card className="border-border/40">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Eye className="w-4 h-4 text-violet-500" />
            Mallampati Score (Airway Assessment)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground mb-4">
            Modified Mallampati classification predicts difficulty of endotracheal intubation. Assessed with patient sitting, mouth open, tongue protruded, without phonation.
          </p>

          {/* Visual reference — click to enlarge */}
          <div className="mb-4">
            <ZoomableImage
              src={mallampatiAsset.url}
              alt="Mallampati Score classification diagram showing Class I through IV airway visualization"
              className="w-full max-w-2xl mx-auto rounded-lg border border-border/40"
            />
            <p className="text-[10px] text-muted-foreground text-center mt-1">Tap image to enlarge</p>
          </div>


          {/* Visual guide */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            {MALLAMPATI_CLASSES.map(m => (
              <button
                key={m.class}
                onClick={() => setSelectedClass(m.class)}
                className={`p-3 rounded-lg border text-center transition-colors ${
                  selectedClass === m.class
                    ? "bg-primary/5 border-primary/30"
                    : "bg-muted/20 border-border/40 hover:bg-muted/30"
                }`}
              >
                <div className={`text-2xl font-bold ${m.color}`}>{m.class}</div>
                <div className="text-xs mt-1">{m.description}</div>
                <div className={`text-xs mt-1 font-medium ${m.color}`}>{m.risk} risk</div>
                {selectedClass === m.class && (
                  <CheckCircle className="w-4 h-4 text-primary mx-auto mt-1" />
                )}
              </button>
            ))}
          </div>

          {selectedClass && (
            <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
              <h4 className="text-sm font-medium mb-1">Class {selectedClass}</h4>
              <p className="text-xs text-muted-foreground">
                {selectedClass === "I" && "Full visualization of soft palate, uvula, fauces, and pillars. Intubation expected to be easy."}
                {selectedClass === "II" && "Soft palate, uvula, and fauces visible. Intubation expected to be easy."}
                {selectedClass === "III" && "Only soft palate and base of uvula visible. Intubation may be moderately difficult."}
                {selectedClass === "IV" && "Only hard palate visible. Intubation expected to be difficult. Consider awake fiberoptic intubation."}
              </p>
            </div>
          )}

          <div className="mt-4 p-3 rounded-lg bg-muted/30 border border-border/30">
            <h4 className="text-xs font-medium mb-1">Other Airway Assessment Tests</h4>
            <div className="grid grid-cols-2 gap-2 text-xs mt-2">
              <div className="p-2 rounded bg-background/50">
                <strong>Thyromental Distance:</strong> &lt;6 cm → difficult intubation
              </div>
              <div className="p-2 rounded bg-background/50">
                <strong>Mouth Opening:</strong> &lt;3 cm → difficult intubation
              </div>
              <div className="p-2 rounded bg-background/50">
                <strong>Neck Extension:</strong> Limited → difficult intubation
              </div>
              <div className="p-2 rounded bg-background/50">
                <strong>Upper Lip Bite Test:</strong> Class III → difficult
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// ─── STOP-Bang Calculator ───
const STOPBangCalculator = () => {
  const [items, setItems] = useState<STOPBangItem[]>(STOPBANG_ITEMS);

  const toggleItem = (id: string) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, active: !i.active } : i));
  };

  const result = useMemo(() => {
    const total = items.filter(i => i.active).length;
    const level = total <= 2 ? STOPBANG_RISK[0] : total <= 4 ? STOPBANG_RISK[1] : STOPBANG_RISK[2];
    return { total, level };
  }, [items]);

  return (
    <div className="space-y-4">
      <Card className="border-border/40">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Wind className="w-4 h-4 text-cyan-500" />
            STOP-Bang (OSA Screening)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground mb-4">
            Screening tool for obstructive sleep apnea. Validated in surgical populations. High sensitivity for moderate-severe OSA.
          </p>

          {/* Result */}
          <div className={`clinical-card border-l-4 mb-4 ${
            result.total <= 2 ? "border-l-success" :
            result.total <= 4 ? "border-l-warning" : "border-l-destructive"
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {result.total <= 2 ? (
                  <CheckCircle className="w-5 h-5 text-success" />
                ) : (
                  <AlertTriangle className={`w-5 h-5 ${result.level.color}`} />
                )}
                <div>
                  <h3 className="font-heading font-bold text-lg">{result.level.risk} Risk</h3>
                  <p className="text-xs text-muted-foreground">
                    {result.total}/8 positive
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className={`text-2xl font-heading font-bold ${result.level.color}`}>{result.total}</span>
                <span className="text-xs text-muted-foreground block">of 8</span>
              </div>
            </div>
            <p className="text-xs mt-2 text-muted-foreground">{result.level.osa_prob}</p>
          </div>

          {/* Items */}
          <div className="space-y-2">
            {items.map(item => (
              <label key={item.id} className={`flex items-start gap-3 p-2.5 rounded-lg transition-colors cursor-pointer ${
                item.active ? "bg-warning/5 border border-warning/20" : "hover:bg-muted/30"
              }`}>
                <Switch
                  checked={item.active}
                  onCheckedChange={() => toggleItem(item.id)}
                  className="mt-0.5 shrink-0"
                />
                <span className="text-sm">{item.label}</span>
              </label>
            ))}
          </div>

          {/* Perioperative implications */}
          {result.total >= 3 && (
            <div className="mt-4 p-3 rounded-lg bg-warning/5 border border-warning/20">
              <h4 className="text-sm font-medium mb-2">Perioperative Implications</h4>
              <ul className="text-xs space-y-1">
                <li>• Consider polysomnography before elective major surgery</li>
                <li>• If known OSA: bring CPAP/BiPAP device to hospital</li>
                <li>• Avoid or minimize opioids (respiratory depression risk)</li>
                <li>• Consider regional anesthesia when possible</li>
                <li>• Monitor with continuous pulse oximetry post-operatively</li>
                <li>• Semi-upright positioning in recovery</li>
                <li>• Consider extended monitoring in PACU</li>
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// ─── Caprini VTE Risk Score ───
const CapriniCalculator = () => {
  const [factors, setFactors] = useState<CapriniFactor[]>(CAPRINI_FACTORS);

  const toggleFactor = (id: string) => {
    setFactors(prev => prev.map(f => f.id === id ? { ...f, active: !f.active } : f));
  };

  const result = useMemo(() => {
    const total = factors.filter(f => f.active).reduce((s, f) => s + f.points, 0);
    const level = CAPRINI_RISK_LEVELS.find(l => total >= l.min && total <= l.max) || CAPRINI_RISK_LEVELS[3];
    return { total, level, active: factors.filter(f => f.active) };
  }, [factors]);

  const groupLabels: Record<string, string> = {
    minor: "1 point each",
    moderate: "2 points each",
    major: "3 points each",
    high: "5 points each",
  };

  const groupColors: Record<string, string> = {
    minor: "border-l-success",
    moderate: "border-l-warning",
    major: "border-l-warning",
    high: "border-l-destructive",
  };

  return (
    <div className="space-y-4">
      <Card className="border-border/40">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Droplets className="w-4 h-4 text-indigo-500" />
            Caprini VTE Risk Assessment
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground mb-4">
            Venous thromboembolism risk assessment for surgical patients. Guides VTE prophylaxis decisions.
          </p>

          {/* Result */}
          <div className={`clinical-card border-l-4 mb-4 ${
            result.level.color === "text-success" ? "border-l-success" :
            result.level.color === "text-warning" ? "border-l-warning" : "border-l-destructive"
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {result.total <= 1 ? (
                  <CheckCircle className="w-5 h-5 text-success" />
                ) : (
                  <AlertTriangle className={`w-5 h-5 ${result.level.color}`} />
                )}
                <div>
                  <h3 className="font-heading font-bold text-lg">{result.level.risk} Risk</h3>
                  <p className="text-xs text-muted-foreground">
                    {result.active.length} factors · {result.total} points
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className={`text-2xl font-heading font-bold ${result.level.color}`}>{result.total}</span>
                <span className="text-xs text-muted-foreground block">points</span>
              </div>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
              <div className="p-1.5 rounded bg-muted/50">
                <span className="text-muted-foreground">VTE risk: </span>
                <strong>{result.level.vte_risk}</strong>
              </div>
              <div className="p-1.5 rounded bg-muted/50">
                <span className="text-muted-foreground">Prophylaxis: </span>
                <strong>{result.level.prophylaxis}</strong>
              </div>
            </div>
          </div>

          {/* Risk levels reference */}
          <div className="grid grid-cols-4 gap-2 mb-4">
            {CAPRINI_RISK_LEVELS.map(l => (
              <div key={l.risk} className={`p-2 rounded-lg text-center ${
                l.color === "text-success" ? "bg-success/10 border border-success/20" :
                l.color === "text-warning" ? "bg-warning/10 border border-warning/20" :
                "bg-destructive/10 border border-destructive/20"
              }`}>
                <div className="font-medium text-sm">{l.risk}</div>
                <div className="text-xs text-muted-foreground">{l.min}–{l.max} pts</div>
                <div className={`text-lg font-bold ${l.color}`}>{l.vte_risk}</div>
              </div>
            ))}
          </div>

          {/* Factors by group */}
          {(["minor", "moderate", "major", "high"] as const).map(group => {
            const groupFactors = factors.filter(f => f.group === group);
            const activeCount = groupFactors.filter(f => f.active).length;
            return (
              <div key={group} className={`mb-3 p-3 rounded-lg border-l-4 ${groupColors[group]} bg-muted/20`}>
                <h4 className="text-xs font-medium text-muted-foreground mb-2">
                  {groupLabels[group]} ({activeCount} selected)
                </h4>
                <div className="space-y-1.5">
                  {groupFactors.map(f => (
                    <label key={f.id} className={`flex items-start gap-2 p-1.5 rounded transition-colors cursor-pointer ${
                      f.active ? "bg-warning/5" : "hover:bg-muted/30"
                    }`}>
                      <Switch
                        checked={f.active}
                        onCheckedChange={() => toggleFactor(f.id)}
                        className="mt-0.5 shrink-0 scale-75"
                      />
                      <span className="text-xs flex-1">{f.label}</span>
                      <span className="text-xs text-muted-foreground shrink-0">+{f.points}</span>
                    </label>
                  ))}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
};

// ─── Surgical Apgar Score ───
const SurgicalApgarCalculator = () => {
  const [inputs, setInputs] = useState<ApgarInputs>({
    estimatedBloodLoss: "",
    lowestMAP: "",
    lowestHR: "",
  });

  const updateInput = (field: keyof ApgarInputs, value: string) => {
    setInputs(prev => ({ ...prev, [field]: value }));
  };

  const result = useMemo(() => {
    const ebl = parseFloat(inputs.estimatedBloodLoss);
    const map = parseFloat(inputs.lowestMAP);
    const hr = parseFloat(inputs.lowestHR);

    if (isNaN(ebl) || isNaN(map) || isNaN(hr)) return null;

    const points = APGAR_POINTS_MAP(ebl, map, hr);
    const level = APGAR_RISK.find(l => points >= l.min && points <= l.max) || APGAR_RISK[4];
    return { points, level };
  }, [inputs]);

  return (
    <div className="space-y-4">
      <Card className="border-border/40">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Timer className="w-4 h-4 text-amber-500" />
            Surgical Apgar Score
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground mb-4">
            Intra-operative 10-point score predicting post-operative morbidity and mortality. Based on estimated blood loss, lowest MAP, and lowest heart rate.
          </p>

          {/* Inputs */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Estimated Blood Loss (mL)</Label>
              <Input
                type="number"
                placeholder="e.g., 300"
                value={inputs.estimatedBloodLoss}
                onChange={e => updateInput("estimatedBloodLoss", e.target.value)}
                className="h-9"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Lowest MAP (mmHg)</Label>
              <Input
                type="number"
                placeholder="e.g., 65"
                value={inputs.lowestMAP}
                onChange={e => updateInput("lowestMAP", e.target.value)}
                className="h-9"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Lowest Heart Rate (bpm)</Label>
              <Input
                type="number"
                placeholder="e.g., 80"
                value={inputs.lowestHR}
                onChange={e => updateInput("lowestHR", e.target.value)}
                className="h-9"
              />
            </div>
          </div>

          {/* Result */}
          {result && (
            <div className={`clinical-card border-l-4 mb-4 ${
              result.level.color === "text-success" ? "border-l-success" :
              result.level.color === "text-warning" ? "border-l-warning" : "border-l-destructive"
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {result.points >= 7 ? (
                    <CheckCircle className="w-5 h-5 text-success" />
                  ) : (
                    <AlertTriangle className={`w-5 h-5 ${result.level.color}`} />
                  )}
                  <div>
                    <h3 className="font-heading font-bold text-lg">
                      {result.points}/10 — {result.level.risk}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {result.level.risk} risk of major complication or mortality
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`text-3xl font-heading font-bold ${result.level.color}`}>{result.points}</span>
                  <span className="text-xs text-muted-foreground block">/ 10</span>
                </div>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                <div className="p-1.5 rounded bg-muted/50">
                  <span className="text-muted-foreground">Mortality: </span>
                  <strong>{result.level.mortality}</strong>
                </div>
                <div className="p-1.5 rounded bg-muted/50">
                  <span className="text-muted-foreground">Morbidity: </span>
                  <strong>{result.level.morbidity}</strong>
                </div>
              </div>
            </div>
          )}

          {/* Scoring reference */}
          <div className="p-3 rounded-lg bg-muted/30 border border-border/30">
            <h4 className="text-xs font-medium mb-2">Scoring Reference</h4>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div>
                <div className="font-medium mb-1">EBL (mL)</div>
                <div className="space-y-0.5 text-muted-foreground">
                  <div>≤100 → 4 pts</div>
                  <div>101–600 → 3 pts</div>
                  <div>601–1000 → 2 pts</div>
                  <div>1001–1500 → 1 pt</div>
                  <div>&gt;1500 → 0 pts</div>
                </div>
              </div>
              <div>
                <div className="font-medium mb-1">Lowest MAP</div>
                <div className="space-y-0.5 text-muted-foreground">
                  <div>&gt;70 → 4 pts</div>
                  <div>61–70 → 3 pts</div>
                  <div>51–60 → 2 pts</div>
                  <div>41–50 → 1 pt</div>
                  <div>≤40 → 0 pts</div>
                </div>
              </div>
              <div>
                <div className="font-medium mb-1">Lowest HR</div>
                <div className="space-y-0.5 text-muted-foreground">
                  <div>≤70 → 4 pts</div>
                  <div>71–90 → 3 pts</div>
                  <div>91–110 → 2 pts</div>
                  <div>111–130 → 1 pt</div>
                  <div>&gt;130 → 0 pts</div>
                </div>
              </div>
            </div>
          </div>

          {/* Risk table */}
          <div className="mt-3 grid grid-cols-5 gap-1 text-center text-xs">
            {APGAR_RISK.map(l => (
              <div key={l.min} className={`p-1.5 rounded ${
                l.color === "text-success" ? "bg-success/10" :
                l.color === "text-warning" ? "bg-warning/10" : "bg-destructive/10"
              }`}>
                <div className={`font-bold ${l.color}`}>{l.min}–{l.max}</div>
                <div className="text-muted-foreground">{l.risk}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// ─── Perioperative Medication Management ───
const PeriopMedManagement = () => {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [expandedDrug, setExpandedDrug] = useState<string | null>(null);

  const categoryLabels: Record<string, string> = {
    cardiac: "Cardiovascular",
    endocrine: "Endocrine",
    pulmonary: "Pulmonary",
    cns: "CNS/Psychiatry",
    rheum: "Rheumatology",
    gi: "GI",
    other: "Other",
  };

  const categoryColors: Record<string, string> = {
    cardiac: "bg-rose-500/10 text-rose-500 border-rose-500/20",
    endocrine: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    pulmonary: "bg-cyan-500/10 text-cyan-500 border-cyan-500/20",
    cns: "bg-violet-500/10 text-violet-500 border-violet-500/20",
    rheum: "bg-orange-500/10 text-orange-500 border-orange-500/20",
    gi: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    other: "bg-gray-500/10 text-gray-500 border-gray-500/20",
  };

  const filtered = useMemo(() => {
    return PERIOP_MEDS.filter(m => {
      if (categoryFilter !== "all" && m.category !== categoryFilter) return false;
      if (search && !m.drug.toLowerCase().includes(search.toLowerCase()) && !m.notes.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [search, categoryFilter]);

  return (
    <div className="space-y-4">
      <Card className="border-border/40">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Pill className="w-4 h-4 text-green-500" />
            Perioperative Medication Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground mb-4">
            Guide for managing chronic medications in the perioperative period. Always verify with institutional protocols and consult pharmacy for complex cases.
          </p>

          {/* Filters */}
          <div className="flex flex-wrap gap-2 mb-4">
            <Input
              placeholder="Search medications..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="h-8 text-xs max-w-xs"
            />
            <div className="flex flex-wrap gap-1">
              <button
                onClick={() => setCategoryFilter("all")}
                className={`text-xs px-2 py-1 rounded-full border transition-colors ${
                  categoryFilter === "all" ? "bg-primary text-primary-foreground border-primary" : "bg-muted/30 border-border/40 hover:bg-muted/50"
                }`}
              >
                All
              </button>
              {Object.entries(categoryLabels).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setCategoryFilter(key)}
                  className={`text-xs px-2 py-1 rounded-full border transition-colors ${
                    categoryFilter === key ? "bg-primary text-primary-foreground border-primary" : "bg-muted/30 border-border/40 hover:bg-muted/50"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Medication list */}
          <div className="space-y-2">
            {filtered.map(med => (
              <Collapsible
                key={med.drug}
                open={expandedDrug === med.drug}
                onOpenChange={() => setExpandedDrug(expandedDrug === med.drug ? null : med.drug)}
              >
                <CollapsibleTrigger asChild>
                  <button className="w-full text-left">
                    <div className={`p-3 rounded-lg border transition-colors ${
                      expandedDrug === med.drug ? "bg-muted/50 border-primary/30" : "bg-muted/20 border-border/40 hover:bg-muted/30"
                    }`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{med.drug}</span>
                          <span className={`text-xs px-1.5 py-0.5 rounded-full border ${categoryColors[med.category]}`}>
                            {categoryLabels[med.category]}
                          </span>
                        </div>
                        {expandedDrug === med.drug ? (
                          <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
                        )}
                      </div>
                    </div>
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="mt-2 p-3 rounded-lg bg-muted/30 border border-border/30 space-y-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <div className="p-2 rounded bg-background/50 border border-border/20">
                        <div className="text-xs font-medium text-muted-foreground mb-1">Pre-operative</div>
                        <p className="text-xs">{med.preop}</p>
                      </div>
                      <div className="p-2 rounded bg-background/50 border border-border/20">
                        <div className="text-xs font-medium text-muted-foreground mb-1">Post-operative</div>
                        <p className="text-xs">{med.postop}</p>
                      </div>
                    </div>
                    <div className="p-2 rounded bg-warning/5 border border-warning/20">
                      <div className="text-xs font-medium text-warning mb-1">Notes</div>
                      <p className="text-xs">{med.notes}</p>
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-sm">No medications match your search.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// ─── Pre-op Labs Guide ───
const PreopLabsGuide = () => {
  const [expandedLab, setExpandedLab] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <Card className="border-border/40">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="w-4 h-4 text-sky-500" />
            Pre-operative Laboratory Evaluation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground mb-4">
            Evidence-based guide for pre-operative testing. "Routine" testing is not recommended — test only when clinically indicated.
          </p>

          <div className="space-y-2">
            {PREOP_LABS.map(lab => (
              <Collapsible
                key={lab.test}
                open={expandedLab === lab.test}
                onOpenChange={() => setExpandedLab(expandedLab === lab.test ? null : lab.test)}
              >
                <CollapsibleTrigger asChild>
                  <button className="w-full text-left">
                    <div className={`p-3 rounded-lg border transition-colors ${
                      expandedLab === lab.test ? "bg-muted/50 border-primary/30" : "bg-muted/20 border-border/40 hover:bg-muted/30"
                    }`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{lab.test}</span>
                          <span className="text-xs px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">
                            {lab.timing}
                          </span>
                        </div>
                        {expandedLab === lab.test ? (
                          <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
                        )}
                      </div>
                    </div>
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="mt-2 p-3 rounded-lg bg-muted/30 border border-border/30 space-y-2">
                    <div className="p-2 rounded bg-background/50 border border-border/20">
                      <div className="text-xs font-medium text-muted-foreground mb-1">Indications</div>
                      <p className="text-xs">{lab.indication}</p>
                    </div>
                    <div className="p-2 rounded bg-warning/5 border border-warning/20">
                      <div className="text-xs font-medium text-warning mb-1">Notes</div>
                      <p className="text-xs">{lab.notes}</p>
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            ))}
          </div>

          <div className="mt-4 p-3 rounded-lg bg-primary/5 border border-primary/20">
            <h4 className="text-xs font-medium text-primary mb-1">Key Principles</h4>
            <ul className="text-xs space-y-1">
              <li>• <strong>Do not</strong> order "routine" pre-operative labs — test only when results will change management</li>
              <li>• <strong>Age alone</strong> is not an indication for most tests (except ECG for age &gt;65)</li>
              <li>• <strong>Abnormal results</strong> should be evaluated and corrected before elective surgery when possible</li>
              <li>• <strong>Document</strong> the indication for each test in the medical record</li>
              <li>• <strong>Repeat testing</strong> is rarely needed if recent (&lt;30 days) results are available and stable</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// ─── Woo Perioperative Risk (Non-Cardiac Surgery) ───
// Based on: Woo SH et al. JAHA 2021. PMID: 33522252

interface WooInputs {
  age: string;
  cad: "no" | "yes";
  strokeHx: "no" | "yes";
  emergency: "no" | "yes";
  sodium: "normal" | "low" | "high";
  creatinine: "normal" | "high";
  hematocrit: "normal" | "low";
  asa: string;
  surgeryType: string;
}

// Placeholder coefficients from the HTML skeleton
// Replace with actual β-values from Woo paper for clinical use
const WOO_COEFF = {
  intercept_stroke: -5.0,
  intercept_cardiac: -4.0,
  intercept_mortality: -3.5,
  age: 0.03,
  cad: 0.4,
  strokeHx: 0.9,
  emerg: 0.6,
  naLow: 0.5,
  naHigh: 0.5,
  crHigh: 0.7,
  hctLow: 0.6,
  asa: 0.2,
  surg_ortho: 0.1,
  surg_vasc: 0.5,
  surg_neuro: 0.4,
  surg_thoracic: 0.3,
  surg_other: 0.1,
};

const SURGERY_TYPES = [
  { value: "0", label: "General / Abdominal" },
  { value: "1", label: "Orthopedic" },
  { value: "2", label: "Vascular" },
  { value: "3", label: "Neurosurgery / Brain" },
  { value: "4", label: "Thoracic (non-cardiac)" },
  { value: "5", label: "Other / Mixed" },
];

const logistic = (x: number) => 1 / (1 + Math.exp(-x));

const WooRiskCalculator = ({ onSwitchToASA }: { onSwitchToASA?: () => void }) => {
  const [inputs, setInputs] = useState<WooInputs>({
    age: "",
    cad: "no",
    strokeHx: "no",
    emergency: "no",
    sodium: "normal",
    creatinine: "normal",
    hematocrit: "normal",
    asa: "2",
    surgeryType: "0",
  });

  const update = (field: keyof WooInputs, value: string) => {
    setInputs(prev => ({ ...prev, [field]: value }));
  };

  const result = useMemo(() => {
    const age = parseFloat(inputs.age);
    if (isNaN(age) || age < 18) return null;

    const cad = inputs.cad === "yes" ? 1 : 0;
    const strokeHx = inputs.strokeHx === "yes" ? 1 : 0;
    const emerg = inputs.emergency === "yes" ? 1 : 0;
    const naLow = inputs.sodium === "low" ? 1 : 0;
    const naHigh = inputs.sodium === "high" ? 1 : 0;
    const crHigh = inputs.creatinine === "high" ? 1 : 0;
    const hctLow = inputs.hematocrit === "low" ? 1 : 0;
    const asa = parseFloat(inputs.asa);
    const surgType = parseInt(inputs.surgeryType);

    const surg_ortho = surgType === 1 ? 1 : 0;
    const surg_vasc = surgType === 2 ? 1 : 0;
    const surg_neuro = surgType === 3 ? 1 : 0;
    const surg_thoracic = surgType === 4 ? 1 : 0;
    const surg_other = surgType === 5 ? 1 : 0;

    const calcProb = (beta: typeof WOO_COEFF) => {
      const L = beta.intercept_stroke
        + beta.age * age
        + beta.cad * cad
        + beta.strokeHx * strokeHx
        + beta.emerg * emerg
        + beta.naLow * naLow
        + beta.naHigh * naHigh
        + beta.crHigh * crHigh
        + beta.hctLow * hctLow
        + beta.asa * asa
        + beta.surg_ortho * surg_ortho
        + beta.surg_vasc * surg_vasc
        + beta.surg_neuro * surg_neuro
        + beta.surg_thoracic * surg_thoracic
        + beta.surg_other * surg_other;
      return logistic(L);
    };

    const betaStroke = { ...WOO_COEFF, intercept_stroke: -5.0 };
    const betaCardiac = { ...WOO_COEFF, intercept_stroke: -4.0 };
    const betaMortality = { ...WOO_COEFF, intercept_stroke: -3.5 };

    const pStroke = calcProb(betaStroke);
    const pCardiac = calcProb(betaCardiac);
    const pMort = calcProb(betaMortality);

    return {
      stroke: pStroke * 100,
      cardiac: pCardiac * 100,
      mortality: pMort * 100,
    };
  }, [inputs]);

  const riskColor = (pct: number) => {
    if (pct < 0.5) return "text-success";
    if (pct < 2) return "text-warning";
    return "text-destructive";
  };

  const riskBg = (pct: number) => {
    if (pct < 0.5) return "bg-success/10 border-success/20";
    if (pct < 2) return "bg-warning/10 border-warning/20";
    return "bg-destructive/10 border-destructive/20";
  };

  return (
    <div className="space-y-4">
      <Card className="border-border/40">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Brain className="w-4 h-4 text-purple-500" />
            Woo Perioperative Risk (Non-Cardiac Surgery)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 p-3 rounded-lg bg-purple-500/5 border border-purple-500/20 space-y-3">
            <p className="text-xs">
              <strong className="text-purple-600 dark:text-purple-400">About:</strong> A machine-learning–derived
              risk model developed from over 1.16 million adults undergoing non-cardiac surgery in the ACS-NSQIP
              database (Woo SH et al., <em>JAHA</em> 2021; PMID: 33522252). It uses routinely available
              preoperative variables to estimate individualized perioperative risk.
            </p>
            <div className="p-2.5 rounded bg-warning/5 border border-warning/20">
              <p className="text-[11px] leading-relaxed italic text-muted-foreground">
                No, the Woo perioperative risk scores—developed by Dr. Jonathan Sang Hoon Woo and colleagues—cannot be used for all types of cases. 
                These predictive tools are specifically tailored for <strong>non-cardiac, non-neurological surgery</strong> to estimate specific 30-day postoperative risks like acute kidney injury (AKI), major adverse kidney events (MAKE), or stroke/cardiac complications. [1, 2, 3, 4]
              </p>
            </div>
            <p className="text-xs">
              <strong className="text-purple-600 dark:text-purple-400">Predicts (30-day postoperative):</strong>
            </p>
            <ul className="text-xs list-disc pl-5 space-y-0.5 text-muted-foreground">
              <li><strong className="text-foreground">Stroke</strong> — ischemic or hemorrhagic cerebrovascular event</li>
              <li><strong className="text-foreground">Major adverse cardiac events</strong> — myocardial infarction or cardiac arrest</li>
              <li><strong className="text-foreground">All-cause mortality</strong></li>
            </ul>
            <p className="text-[11px] text-muted-foreground pt-1 border-t border-purple-500/10">
              Use for shared decision-making, preoperative optimization, and identifying patients who may benefit
              from medical consultation, closer monitoring, or deferral of elective surgery.
            </p>
          </div>


          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Age (years)</Label>
              <Input type="number" placeholder="e.g., 65" value={inputs.age} onChange={e => update("age", e.target.value)} className="h-9" />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs">ASA Physical Status</Label>
                <button
                  onClick={onSwitchToASA}
                  className="text-xs text-primary hover:text-primary/80 underline underline-offset-2"
                >
                  View ASA criteria →
                </button>
              </div>
              <Select value={inputs.asa} onValueChange={v => update("asa", v)}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Select ASA class" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">ASA I — Normal healthy</SelectItem>
                  <SelectItem value="2">ASA II — Mild systemic disease</SelectItem>
                  <SelectItem value="3">ASA III — Severe systemic disease</SelectItem>
                  <SelectItem value="4">ASA IV — Constant threat to life</SelectItem>
                  <SelectItem value="5">ASA V — Moribund</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">History of CAD (MI, angina, PCI, CABG)</Label>
              <Select value={inputs.cad} onValueChange={v => update("cad", v)}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="no">No</SelectItem>
                  <SelectItem value="yes">Yes</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">History of Stroke or TIA</Label>
              <Select value={inputs.strokeHx} onValueChange={v => update("strokeHx", v)}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="no">No</SelectItem>
                  <SelectItem value="yes">Yes</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Emergency Surgery</Label>
              <Select value={inputs.emergency} onValueChange={v => update("emergency", v)}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="no">No (elective/urgent)</SelectItem>
                  <SelectItem value="yes">Yes (emergency)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Type of Surgery</Label>
              <Select value={inputs.surgeryType} onValueChange={v => update("surgeryType", v)}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SURGERY_TYPES.map(t => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Serum Sodium</Label>
              <Select value={inputs.sodium} onValueChange={v => update("sodium", v)}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal">Normal (131–146 mEq/L)</SelectItem>
                  <SelectItem value="low">≤130 mEq/L (Hyponatremia)</SelectItem>
                  <SelectItem value="high">&gt;146 mEq/L (Hypernatremia)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Serum Creatinine &gt; 1.8 mg/dL</Label>
              <Select value={inputs.creatinine} onValueChange={v => update("creatinine", v)}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal">No (≤1.8 mg/dL)</SelectItem>
                  <SelectItem value="high">Yes (&gt;1.8 mg/dL)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Hematocrit ≤ 27%</Label>
              <Select value={inputs.hematocrit} onValueChange={v => update("hematocrit", v)}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal">No (&gt;27%)</SelectItem>
                  <SelectItem value="low">Yes (≤27%)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Results */}
          {result && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className={`p-3 rounded-lg border ${riskBg(result.stroke)}`}>
                  <div className="text-xs text-muted-foreground mb-1">30-day Stroke Risk</div>
                  <div className={`text-2xl font-heading font-bold ${riskColor(result.stroke)}`}>
                    {result.stroke.toFixed(2)}%
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {result.stroke < 0.5 ? "Low risk" : result.stroke < 2 ? "Moderate risk" : "High risk"}
                  </div>
                </div>
                <div className={`p-3 rounded-lg border ${riskBg(result.cardiac)}`}>
                  <div className="text-xs text-muted-foreground mb-1">30-day Major Cardiac Event Risk</div>
                  <div className={`text-2xl font-heading font-bold ${riskColor(result.cardiac)}`}>
                    {result.cardiac.toFixed(2)}%
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    MI or cardiac arrest
                  </div>
                </div>
                <div className={`p-3 rounded-lg border ${riskBg(result.mortality)}`}>
                  <div className="text-xs text-muted-foreground mb-1">30-day Mortality Risk</div>
                  <div className={`text-2xl font-heading font-bold ${riskColor(result.mortality)}`}>
                    {result.mortality.toFixed(2)}%
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {result.mortality < 1 ? "Low risk" : result.mortality < 5 ? "Moderate risk" : "High risk"}
                  </div>
                </div>
              </div>

              {/* Overall risk category + interpretation */}
              {(() => {
                const composite = Math.max(result.stroke / 2, result.cardiac / 2, result.mortality / 5);
                let cat: "Low" | "Moderate" | "High" | "Very High" = "Low";
                if (composite >= 3) cat = "Very High";
                else if (composite >= 1) cat = "High";
                else if (composite >= 0.25) cat = "Moderate";
                const catStyle = {
                  Low: "bg-success/10 border-success/30 text-success",
                  Moderate: "bg-warning/10 border-warning/30 text-warning",
                  High: "bg-destructive/10 border-destructive/30 text-destructive",
                  "Very High": "bg-destructive/15 border-destructive/40 text-destructive",
                }[cat];
                const interp = {
                  Low: "Proceed with standard perioperative care. Routine monitoring; no additional cardiac workup indicated based on this score alone.",
                  Moderate: "Optimize modifiable factors (anemia, electrolytes, volume status). Consider medical co-management and perioperative beta-blocker/statin continuation. Discuss risk with patient and surgical team.",
                  High: "Multidisciplinary review recommended. Consider deferring elective surgery for optimization, cardiology/anesthesia consultation, ICU-level postoperative monitoring, and explicit shared decision-making regarding risk–benefit.",
                  "Very High": "Strongly reconsider elective surgery. If proceeding, mandate cardiology + anesthesia consult, ICU postoperative care, and documented informed consent covering elevated stroke, MACE, and mortality risks.",
                }[cat];
                return (
                  <div className={`p-4 rounded-lg border-2 ${catStyle}`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-xs uppercase tracking-wide opacity-80">Predicted Risk Category</div>
                      <div className="text-lg font-heading font-bold">{cat}</div>
                    </div>
                    <p className="text-xs leading-relaxed text-foreground/90">
                      <strong>Clinical interpretation:</strong> {interp}
                    </p>
                  </div>
                );
              })()}

              <div className="p-3 rounded-lg bg-warning/5 border border-warning/20">
                <h4 className="text-xs font-medium text-warning mb-1">⚠️ Placeholder Coefficients</h4>
                <p className="text-xs">
                  These probabilities use placeholder β-values from the HTML skeleton. Replace with actual coefficients from the Woo paper (Table S1-S5) for clinically accurate predictions.
                </p>
              </div>
            </div>
          )}

          {!result && (
            <div className="text-center py-6 text-muted-foreground">
              <p className="text-sm">Enter age ≥ 18 to calculate risks</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// ─── STS-Style Cardiac Surgery Risk Calculator ───
// Based on: STS 2018 Adult Cardiac Surgery Risk Models
// Reference: O'Brien SM et al., Ann Thorac Surg 2018. PMID: 29559225
// Uses the exact placeholder coefficients from the HTML skeleton

interface STSInputs {
  age: string;
  sex: "male" | "female";
  renal: "no" | "yes";
  hf: "no" | "yes";
  priorCardiacSurg: "no" | "yes";
  lvef: string;
  procedureType: string;
  urgency: "elective" | "urgent" | "emergent";
  strokeHx: "no" | "yes";
}

const STS_PROCEDURES = [
  { value: "0", label: "Isolated CABG" },
  { value: "1", label: "Valve only" },
  { value: "2", label: "Valve + CABG" },
  { value: "3", label: "Aortic root / ascending aorta" },
  { value: "4", label: "Other / complex" },
];

// Placeholder coefficients from the HTML skeleton
// Replace with coefficients from your own center's logistic models
const STS_COEFF = {
  intercept_mortality: -6.0,
  intercept_stroke: -5.5,
  intercept_morbidity: -4.5,
  age: 0.04,
  sexFemale: 0.2,
  renal: 0.8,
  hf: 0.7,
  priorSurg: 0.5,
  lvef: -0.02,
  procValve: 0.4,
  procValveCABG: 0.6,
  procAorta: 0.7,
  procOther: 0.3,
  urgUrgent: 0.5,
  urgEmergent: 1.0,
  strokeHx: 0.6,
};

const STSCardiacRiskCalculator = () => {
  const [inputs, setInputs] = useState<STSInputs>({
    age: "",
    sex: "male",
    renal: "no",
    hf: "no",
    priorCardiacSurg: "no",
    lvef: "",
    procedureType: "0",
    urgency: "elective",
    strokeHx: "no",
  });

  const update = (field: keyof STSInputs, value: string) => {
    setInputs(prev => ({ ...prev, [field]: value }));
  };

  const result = useMemo(() => {
    const age = parseFloat(inputs.age);
    const lvef = parseFloat(inputs.lvef);
    if (isNaN(age) || age < 18 || isNaN(lvef)) return null;

    const sexFemale = inputs.sex === "female" ? 1 : 0;
    const renal = inputs.renal === "yes" ? 1 : 0;
    const hf = inputs.hf === "yes" ? 1 : 0;
    const priorSurg = inputs.priorCardiacSurg === "yes" ? 1 : 0;
    const strokeHx = inputs.strokeHx === "yes" ? 1 : 0;
    const procType = parseInt(inputs.procedureType);
    const procValve = procType === 1 ? 1 : 0;
    const procValveCABG = procType === 2 ? 1 : 0;
    const procAorta = procType === 3 ? 1 : 0;
    const procOther = procType === 4 ? 1 : 0;
    const urgUrgent = inputs.urgency === "urgent" ? 1 : 0;
    const urgEmergent = inputs.urgency === "emergent" ? 1 : 0;

    const calcProb = (beta: typeof STS_COEFF) => {
      const L = beta.intercept_mortality
        + beta.age * age
        + beta.sexFemale * sexFemale
        + beta.renal * renal
        + beta.hf * hf
        + beta.priorSurg * priorSurg
        + beta.lvef * lvef
        + beta.procValve * procValve
        + beta.procValveCABG * procValveCABG
        + beta.procAorta * procAorta
        + beta.procOther * procOther
        + beta.urgUrgent * urgUrgent
        + beta.urgEmergent * urgEmergent
        + beta.strokeHx * strokeHx;
      return logistic(L);
    };

    const betaMort = { ...STS_COEFF, intercept_mortality: -6.0 };
    const betaStroke = { ...STS_COEFF, intercept_mortality: -5.5 };
    const betaMajorMorbid = { ...STS_COEFF, intercept_mortality: -4.5 };

    const pMort = calcProb(betaMort);
    const pStroke = calcProb(betaStroke);
    const pMajor = calcProb(betaMajorMorbid);

    return {
      mortality: pMort * 100,
      stroke: pStroke * 100,
      majorMorbidity: pMajor * 100,
    };
  }, [inputs]);

  const riskColor = (pct: number) => {
    if (pct < 2) return "text-success";
    if (pct < 5) return "text-warning";
    return "text-destructive";
  };

  const riskBg = (pct: number) => {
    if (pct < 2) return "bg-success/10 border-success/20";
    if (pct < 5) return "bg-warning/10 border-warning/20";
    return "bg-destructive/10 border-destructive/20";
  };

  return (
    <div className="space-y-4">
      <Card className="border-border/40">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Heart className="w-4 h-4 text-red-500" />
            STS-Style Cardiac Surgery Risk Calculator
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground mb-4">
            Simplified educational model based on the STS 2018 Adult Cardiac Surgery Risk Models (O'Brien SM et al., Ann Thorac Surg 2018).
            For clinical use, use the official STS calculator at <strong>acsdriskcalc.research.sts.org</strong>.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Age (years)</Label>
              <Input type="number" placeholder="e.g., 65" value={inputs.age} onChange={e => update("age", e.target.value)} className="h-9" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Sex</Label>
              <Select value={inputs.sex} onValueChange={v => update("sex", v)}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Procedure Type</Label>
              <Select value={inputs.procedureType} onValueChange={v => update("procedureType", v)}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STS_PROCEDURES.map(p => (
                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Urgency</Label>
              <Select value={inputs.urgency} onValueChange={v => update("urgency", v)}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="elective">Elective</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                  <SelectItem value="emergent">Emergent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">LVEF (%)</Label>
              <Input type="number" placeholder="e.g., 55" value={inputs.lvef} onChange={e => update("lvef", e.target.value)} className="h-9" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Renal dysfunction (Cr &gt;2 or dialysis)</Label>
              <Select value={inputs.renal} onValueChange={v => update("renal", v)}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="no">No</SelectItem>
                  <SelectItem value="yes">Yes</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">History of Heart Failure</Label>
              <Select value={inputs.hf} onValueChange={v => update("hf", v)}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="no">No</SelectItem>
                  <SelectItem value="yes">Yes</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Previous Cardiac Surgery</Label>
              <Select value={inputs.priorCardiacSurg} onValueChange={v => update("priorCardiacSurg", v)}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="no">No</SelectItem>
                  <SelectItem value="yes">Yes</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Prior Stroke/TIA</Label>
              <Select value={inputs.strokeHx} onValueChange={v => update("strokeHx", v)}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="no">No</SelectItem>
                  <SelectItem value="yes">Yes</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Results */}
          {result && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className={`p-3 rounded-lg border ${riskBg(result.mortality)}`}>
                  <div className="text-xs text-muted-foreground mb-1">Operative Mortality</div>
                  <div className={`text-2xl font-heading font-bold ${riskColor(result.mortality)}`}>
                    {result.mortality.toFixed(2)}%
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {result.mortality < 2 ? "Low risk" : result.mortality < 5 ? "Moderate risk" : "High risk"}
                  </div>
                </div>
                <div className={`p-3 rounded-lg border ${riskBg(result.stroke)}`}>
                  <div className="text-xs text-muted-foreground mb-1">Postoperative Stroke</div>
                  <div className={`text-2xl font-heading font-bold ${riskColor(result.stroke)}`}>
                    {result.stroke.toFixed(2)}%
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Permanent stroke risk
                  </div>
                </div>
                <div className={`p-3 rounded-lg border ${riskBg(result.majorMorbidity)}`}>
                  <div className="text-xs text-muted-foreground mb-1">Major Morbidity</div>
                  <div className={`text-2xl font-heading font-bold ${riskColor(result.majorMorbidity)}`}>
                    {result.majorMorbidity.toFixed(2)}%
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Stroke, renal failure, prolonged vent, reoperation, DSWI
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-warning/5 border border-warning/20">
                <h4 className="text-xs font-medium text-warning mb-1">⚠️ Placeholder Coefficients</h4>
                <p className="text-xs">
                  This is a generic logistic model scaffold with placeholder coefficients. For real STS-grade predictions, use the official STS web/mobile calculators or build local models from your own dataset.
                </p>
              </div>
            </div>
          )}

          {!result && (
            <div className="text-center py-6 text-muted-foreground">
              <p className="text-sm">Enter age ≥ 18 and LVEF to calculate risks</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PerioperativeCalculators;
