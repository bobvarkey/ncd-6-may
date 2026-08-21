import { useState, useMemo, useEffect } from "react";
import { useLocation } from "react-router-dom";
import {
  Heart, AlertTriangle, CheckCircle, ChevronDown, ChevronUp, Shield, Wind, Brain, Eye, Timer, Droplets, Pill, FileText, Info, Activity, Copy, Download,
  HelpCircle, Filter
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import ZoomableImage from "@/components/ZoomableImage";
import { CsdhRiskCalculator } from "@/calculators/perioperative/CsdhRiskCalculator";
import mallampatiAsset from "@/assets/mallampati-score.png.asset.json";
import { copyToClipboard, downloadTextFile } from "@/lib/clinical-utils";

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
  bestFit?: string;
}[] = [
  { 
    value: "rcri", 
    title: "RCRI", 
    icon: Heart, 
    inputs: "6 cardiac risk factors (IHD, HF, CVA, insulin-treated DM, CKD, high-risk surgery)", 
    results: "0–6 points → Class I–IV with % major cardiac event risk",
    bestFit: `### Best-fit: MACE estimation in non-cardiac surgery.
---
**Guidance:**
1. **Identify Factors:** Select all known comorbidities. 
2. **Determine Urgency:** Choose procedure risk level.
3. **Missing Data:** If CKD status unknown, use Cr >2.0 mg/dL if available, else mark 'no' but document as 'not assessed'.
4. **Output:** Score corresponds to Major Adverse Cardiac Events (MACE).

**Typical Scenarios:** 
- Pre-op assessment of a 70yo with DM/HTN for hip replacement.
- Risk stratification for an elderly patient with prior TIA undergoing vascular surgery.`
  },
  { 
    value: "asa", 
    title: "ASA Physical Status", 
    icon: Shield, 
    inputs: "Select the class that matches systemic disease burden", 
    results: "ASA I–VI with description, examples and perioperative implications",
    bestFit: `### Best-fit: Universal communication of systemic disease burden.
---
**Guidance:**
1. **Review History:** Select the class that best reflects current disease control.
2. **Missing Data:** If functional status is unknown, opt for a conservative (higher) class if multiple comorbidities exist.
3. **Emergencies:** Append 'E' to the class in your documentation.

**Typical Scenarios:** 
- Standardized triage of all surgical patients from elective cataracts to emergent trauma.
- Categorizing a smoker with well-controlled HTN as ASA II.`
  },
  { 
    value: "mallampati", 
    title: "Mallampati", 
    icon: Eye, 
    inputs: "Oropharyngeal view on mouth opening (Class I–IV)", 
    results: "Airway difficulty grade and intubation risk",
    bestFit: `### Best-fit: Predicting difficult direct laryngoscopy.
---
**Guidance:**
1. **Positioning:** Patient must be sitting, mouth open wide, tongue protruded, **NO** phonation.
2. **Visualization:** Note which structures (uvula, soft palate, pillars) are visible.
3. **Missing Data:** If patient cannot cooperate, document as 'not assessable' and prioritize alternative airway markers.

**Typical Scenarios:** 
- Routine pre-intubation assessment in the anesthesia bay.
- Screening for difficult airway in obesity or OSA.`
  },
  { 
    value: "stopbang", 
    title: "STOP-Bang", 
    icon: Wind, 
    inputs: "Snoring, tiredness, observed apnea, BP, BMI, age, neck size, sex", 
    results: "0–8 score → low / intermediate / high OSA risk with airway plan",
    bestFit: `### Best-fit: Screening for obstructive sleep apnea (OSA).
---
**Guidance:**
1. **Questions:** Ask the 8 items directly. Neck size is >40cm (M) or >35cm (F).
2. **Interpretation:** Score ≥5 indicates high probability of moderate-severe OSA.
3. **Missing Data:** If bed partner unavailable for 'observed apnea', assume 'no' but flag as 'partial assessment'.

**Typical Scenarios:** 
- Pre-operative screening of bariatric surgery candidates.
- Planning post-op monitoring for patients receiving high-dose opioids.`
  },
  { 
    value: "caprini", 
    title: "Caprini VTE", 
    icon: Droplets, 
    inputs: "Weighted thrombosis risk factors (1, 2, 3 and 5-point items)", 
    results: "Total score → VTE risk band and prophylaxis recommendation",
    bestFit: `### Best-fit: Comprehensive VTE risk stratification.
---
**Guidance:**
1. **Thorough Review:** Go through the checklist; items are weighted (1-5 pts).
2. **Missing Data:** If thrombophilia status unknown, leave unchecked unless there is a strong family history.
3. **Result:** Score >6 requires aggressive/extended prophylaxis.

**Typical Scenarios:** 
- Risk-stratifying a patient with malignancy undergoing major abdominal surgery.
- Deciding on extended (4-week) LMWH for hip arthroplasty.`
  },
  { 
    value: "apgar", 
    title: "Surgical Apgar", 
    icon: Timer, 
    inputs: "Estimated blood loss, lowest MAP, lowest heart rate (intra-op)", 
    results: "0–10 score → 30-day major complication / mortality risk",
    bestFit: `### Best-fit: Immediate post-op identification of high-risk instability.
---
**Guidance:**
1. **Data Collection:** Retrieve lowest MAP and HR from the intra-operative record.
2. **Calculation:** Use the most accurate EBL provided by the surgeon/anesthetist.
3. **Missing Data:** If MAP/HR records are incomplete, use the lowest confirmed stable values.

**Typical Scenarios:** 
- Post-operative handoff to ICU/PACU teams.
- Identifying 'silent' high-risk patients who had intra-operative instability.`
  },
  { 
    value: "woo", 
    title: "Woo Perioperative Risk", 
    icon: Brain, 
    inputs: "Age, ASA class, surgery type and comorbidities", 
    results: "Predicted stroke / MACE category with clinical interpretation",
    bestFit: `### Best-fit: Stroke and MACE risk in general non-cardiac surgery.
---
**Guidance:**
1. **Inputs:** Requires age, ASA status, and procedure risk level.
2. **Missing Data:** If procedure risk is unclear, consult the 'Surgical Risk Categories' reference within the tool.
3. **Interpretation:** Use results to guide shared decision-making regarding elective timing.

**Typical Scenarios:** 
- Assessing an 80yo patient for elective hernia repair.
- Communicating stroke risk to a patient with prior CVA.`
  },
  { 
    value: "goldman", 
    title: "Goldman Cardiac Index", 
    icon: Heart, 
    inputs: "S3 gallop, JVP, recent MI, PVCs, rhythm, age, urgency", 
    results: "Class I-IV with observed cardiac mortality risk",
    bestFit: `### Best-fit: Cardiac risk in patients with overt HF or arrhythmias.
---
**Guidance:**
1. **Physical Exam:** Specifically look for S3 and elevated JVP (>12cm).
2. **ECG:** Check for >5 PVCs/min or non-sinus rhythm.
3. **Missing Data:** If physical exam for JVP is difficult (e.g., obesity), note as 'limited exam' and lean on ECG/Age criteria.

**Typical Scenarios:** 
- Pre-op evaluation of a patient with decompensated heart failure.
- Assessing surgical risk in an elderly patient with atrial fibrillation.`
  },
  { 
    value: "sts", 
    title: "STS Cardiac", 
    icon: Heart, 
    inputs: "Cardiac-surgery specific patient and procedure variables", 
    results: "Estimated operative mortality and morbidity band",
    bestFit: `### Best-fit: Adult cardiac surgery operative risk (CABG, Valve).
---
**Guidance:**
1. **Proc Type:** Select the specific cardiac procedure (e.g., isolated CABG).
2. **LVEF:** Input the most recent echocardiographic ejection fraction.
3. **Missing Data:** If LVEF is unavailable, defer calculation until echo is performed.

**Typical Scenarios:** 
- Informed consent for a patient undergoing triple vessel bypass.
- Risk assessment for mitral valve replacement.`
  },
  { 
    value: "labs", 
    title: "Pre-op Labs", 
    icon: FileText, 
    inputs: "Patient factors and planned procedure risk", 
    results: "Which pre-operative tests are indicated (and which are not)",
    bestFit: `### Best-fit: Evidence-based reduction of unnecessary pre-op tests.
---
**Guidance:**
1. **Assess Patient:** Select age and relevant comorbidities.
2. **Assess Surgery:** Select planned procedure risk level.
3. **Missing Data:** If comorbidities are unknown, assume a baseline assessment (CBC/ECG) may be needed.

**Typical Scenarios:** 
- Screening a healthy 40yo for laparoscopic cholecystectomy.
- Deciding which labs are needed for a diabetic patient undergoing major joint surgery.`
  },
  { 
    value: "csdh", 
    title: "cSDH Risk", 
    icon: Brain, 
    inputs: "Age, GCS, imaging (shift/thickness), ASA, frailty", 
    results: "Standardized perioperative report for chronic SDH",
    bestFit: `### Best-fit: Neurosurgical cSDH multidisciplinary assessment.
---
**Guidance:**
1. **Imaging:** Input midline shift and maximal hematoma thickness from CT.
2. **Clinical:** Assess GCS and Clinical Frailty Scale (CFS).
3. **Missing Data:** If frailty assessment is not formal, use the interactive CFS selector provided in the tool.

**Typical Scenarios:** 
- Pre-operative planning for burr-hole drainage in an elderly patient.
- Deciding between surgical vs. conservative management of a chronic subdural.`
  },
];

// ─── Component ───
const PerioperativeCalculators = () => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState("rcri");

  useEffect(() => {
    const hash = location.hash.replace("#", "");
    if (hash && ["rcri", "asa", "mallampati", "stopbang", "caprini", "apgar", "meds", "labs", "woo", "sts", "csdh", "goldman"].includes(hash)) {
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
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon className={`w-4 h-4 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
                  <h2 className="text-sm font-heading font-semibold">{card.title}</h2>
                </div>
                {card.bestFit && (
                  <Dialog>
                    <DialogTrigger asChild>
                      <button
                        type="button"
                        onClick={(e) => e.stopPropagation()}
                        className="p-1 hover:bg-muted rounded-full transition-colors"
                        title="Best case-fit for this tool"
                      >
                        <HelpCircle className="w-3.5 h-3.5 text-muted-foreground" />
                      </button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                          <Icon className="w-5 h-5 text-primary" />
                          {card.title} Clinical Context
                        </DialogTitle>
                        <DialogDescription className="text-sm pt-4 text-foreground leading-relaxed whitespace-pre-wrap">
                          {card.bestFit}
                        </DialogDescription>
                      </DialogHeader>
                    </DialogContent>
                  </Dialog>
                )}
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
          <TabsTrigger value="woo" className="text-sm">Woo Risk</TabsTrigger>
          <TabsTrigger value="goldman" className="text-sm">Goldman Index</TabsTrigger>
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
        <TabsContent value="goldman" className="mt-4 space-y-4">
          <GoldmanCardiacIndex />
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
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Heart className="w-5 h-5 text-rose-500" />
              Revised Cardiac Risk Index (RCRI)
            </CardTitle>
            <div className="flex gap-2">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => {
                const note = `REVISED CARDIAC RISK INDEX (RCRI)\nDate: ${new Date().toLocaleString()}\n\nFactors:\n${result.active.map(f => `- ${f.label}`).join("\n") || "- None"}\n\nResult:\n- Total Score: ${result.total}\n- Risk Class: ${result.cls.label}\n- MACE Risk: ${result.cls.risk}\n\nReference: Lee et al., Circulation 1999.`;
                copyToClipboard(note, "RCRI result copied");
              }}>
                <Copy className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => {
                const note = `REVISED CARDIAC RISK INDEX (RCRI)\nDate: ${new Date().toLocaleString()}\n\nFactors:\n${result.active.map(f => `- ${f.label}`).join("\n") || "- None"}\n\nResult:\n- Total Score: ${result.total}\n- Risk Class: ${result.cls.label}\n- MACE Risk: ${result.cls.risk}\n\nReference: Lee et al., Circulation 1999.`;
                downloadTextFile("RCRI_Result", note);
              }}>
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>
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
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Eye className="w-4 h-4 text-violet-500" />
              Mallampati Score (Airway Assessment)
            </CardTitle>
            <div className="flex gap-2">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => {
                const m = MALLAMPATI_CLASSES.find(c => c.class === selectedClass);
                const note = `MALLAMPATI SCORE\nDate: ${new Date().toLocaleString()}\n\nResult:\n- Class: ${selectedClass || "Not selected"}\n- Description: ${m?.description || "N/A"}\n- Intubation: ${m?.intubation || "N/A"}\n- Risk: ${m?.risk || "N/A"} risk`;
                copyToClipboard(note, "Mallampati result copied");
              }}>
                <Copy className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => {
                const m = MALLAMPATI_CLASSES.find(c => c.class === selectedClass);
                const note = `MALLAMPATI SCORE\nDate: ${new Date().toLocaleString()}\n\nResult:\n- Class: ${selectedClass || "Not selected"}\n- Description: ${m?.description || "N/A"}\n- Intubation: ${m?.intubation || "N/A"}\n- Risk: ${m?.risk || "N/A"} risk`;
                downloadTextFile("Mallampati_Result", note);
              }}>
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>
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
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Wind className="w-4 h-4 text-cyan-500" />
              STOP-Bang (OSA Screening)
            </CardTitle>
            <div className="flex gap-2">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => {
                const note = `STOP-BANG OSA SCREEN\nDate: ${new Date().toLocaleString()}\n\nPositive Items:\n${result.total === 0 ? "- None" : items.filter(i => i.active).map(i => `- ${i.label}`).join("\n")}\n\nResult:\n- Total Score: ${result.total}/8\n- Risk Level: ${result.level.risk}\n- OSA Probability: ${result.level.osa_prob}`;
                copyToClipboard(note, "STOP-Bang result copied");
              }}>
                <Copy className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => {
                const note = `STOP-BANG OSA SCREEN\nDate: ${new Date().toLocaleString()}\n\nPositive Items:\n${result.total === 0 ? "- None" : items.filter(i => i.active).map(i => `- ${i.label}`).join("\n")}\n\nResult:\n- Total Score: ${result.total}/8\n- Risk Level: ${result.level.risk}\n- OSA Probability: ${result.level.osa_prob}`;
                downloadTextFile("STOPBang_Result", note);
              }}>
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>
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
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Droplets className="w-4 h-4 text-indigo-500" />
              Caprini VTE Risk Assessment
            </CardTitle>
            <div className="flex gap-2">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => {
                const note = `CAPRINI VTE RISK SCORE\nDate: ${new Date().toLocaleString()}\n\nFactors Selected: ${result.active.length}\n${result.active.map(f => `- ${f.label}`).join("\n") || "- None"}\n\nResult:\n- Total Score: ${result.total}\n- Risk Level: ${result.level.risk}\n- VTE Risk: ${result.level.vte_risk}\n- Prophylaxis: ${result.level.prophylaxis}`;
                copyToClipboard(note, "Caprini result copied");
              }}>
                <Copy className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => {
                const note = `CAPRINI VTE RISK SCORE\nDate: ${new Date().toLocaleString()}\n\nFactors Selected: ${result.active.length}\n${result.active.map(f => `- ${f.label}`).join("\n") || "- None"}\n\nResult:\n- Total Score: ${result.total}\n- Risk Level: ${result.level.risk}\n- VTE Risk: ${result.level.vte_risk}\n- Prophylaxis: ${result.level.prophylaxis}`;
                downloadTextFile("Caprini_Result", note);
              }}>
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>
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
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Timer className="w-4 h-4 text-amber-500" />
              Surgical Apgar Score
            </CardTitle>
            <div className="flex gap-2">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => {
                const note = `SURGICAL APGAR SCORE\nDate: ${new Date().toLocaleString()}\n\nInputs:\n- Estimated Blood Loss: ${inputs.estimatedBloodLoss} mL\n- Lowest MAP: ${inputs.lowestMAP} mmHg\n- Lowest HR: ${inputs.lowestHR} bpm\n\nResult:\n- Total Points: ${result.points}/10\n- Risk Level: ${result.level.risk}`;
                copyToClipboard(note, "Apgar result copied");
              }}>
                <Copy className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => {
                const note = `SURGICAL APGAR SCORE\nDate: ${new Date().toLocaleString()}\n\nInputs:\n- Estimated Blood Loss: ${inputs.estimatedBloodLoss} mL\n- Lowest MAP: ${inputs.lowestMAP} mmHg\n- Lowest HR: ${inputs.lowestHR} bpm\n\nResult:\n- Total Points: ${result.points}/10\n- Risk Level: ${result.level.risk}`;
                downloadTextFile("Apgar_Result", note);
              }}>
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>
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

// Validated coefficients from Woo SH et al. JAHA 2021
// These coefficients are calibrated for non-cardiac, non-neurological surgery.
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
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Brain className="w-4 h-4 text-purple-500" />
              Woo Perioperative Risk (Non-Cardiac Surgery)
            </CardTitle>
            <div className="flex gap-2">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => {
                if (!result) return;
                const note = `WOO PERIOPERATIVE RISK\nDate: ${new Date().toLocaleString()}\n\nInputs:\n- Age: ${inputs.age}\n- ASA: ${inputs.asa}\n- Emergency: ${inputs.emergency}\n- Surgery: ${SURGERY_TYPES.find(t => t.value === inputs.surgeryType)?.label}\n\nResults:\n- 30d Mortality: ${result.mortality.toFixed(2)}%\n- 30d Cardiac MACE: ${result.cardiac.toFixed(2)}%\n- 30d Stroke: ${result.stroke.toFixed(2)}%`;
                copyToClipboard(note, "Woo result copied");
              }}>
                <Copy className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => {
                if (!result) return;
                const note = `WOO PERIOPERATIVE RISK\nDate: ${new Date().toLocaleString()}\n\nInputs:\n- Age: ${inputs.age}\n- ASA: ${inputs.asa}\n- Emergency: ${inputs.emergency}\n- Surgery: ${SURGERY_TYPES.find(t => t.value === inputs.surgeryType)?.label}\n\nResults:\n- 30d Mortality: ${result.mortality.toFixed(2)}%\n- 30d Cardiac MACE: ${result.cardiac.toFixed(2)}%\n- 30d Stroke: ${result.stroke.toFixed(2)}%`;
                downloadTextFile("Woo_Result", note);
              }}>
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>
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
                <h4 className="text-xs font-medium text-warning mb-1">Clinical Scope</h4>
                <p className="text-xs">
                  No, the Woo perioperative risk scores—developed by Dr. Jonathan Sang Hoon Woo and colleagues—cannot be used for all types of cases. These predictive tools are specifically tailored for non-cardiac, non-neurological surgery to estimate specific 30-day postoperative risks like acute kidney injury (AKI), major adverse kidney events (MAKE), or stroke/cardiac complications.
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
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Heart className="w-4 h-4 text-red-500" />
              STS-Style Cardiac Surgery Risk Calculator
            </CardTitle>
            <div className="flex gap-2">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => {
                if (!result) return;
                const note = `STS CARDIAC RISK\nDate: ${new Date().toLocaleString()}\n\nResults:\n- Mortality: ${result.mortality.toFixed(2)}%\n- Stroke: ${result.stroke.toFixed(2)}%\n- Major Morbidity: ${result.majorMorbidity.toFixed(2)}%`;
                copyToClipboard(note, "STS result copied");
              }}>
                <Copy className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => {
                if (!result) return;
                const note = `STS CARDIAC RISK\nDate: ${new Date().toLocaleString()}\n\nResults:\n- Mortality: ${result.mortality.toFixed(2)}%\n- Stroke: ${result.stroke.toFixed(2)}%\n- Major Morbidity: ${result.majorMorbidity.toFixed(2)}%`;
                downloadTextFile("STS_Result", note);
              }}>
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>
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
interface RiskFactor {
  id: string;
  letter: string;
  factor: string;
  points: number;
  active: boolean;
  category: "history" | "examination" | "ecg" | "vitals" | "lab" | "age";
}

interface RiskClass {
  label: string;
  points: string;
  observedRisk: string;
  color: string;
}

interface ECGPattern {
  id: string;
  name: string;
  description: string;
  criteria: string[];
  clinicalSignificance: string;
  management: string;
}

const GOLDMAN_CLASSES: RiskClass[] = [
  { label: "Class I", points: "0", observedRisk: "0.7%", color: "success" },
  { label: "Class II", points: "1–2", observedRisk: "3%", color: "warning" },
  { label: "Class III", points: "3–4", observedRisk: "15%", color: "warning" },
  { label: "Class IV", points: "5+", observedRisk: "30%", color: "destructive" },
];

const ECG_PATTERNS: ECGPattern[] = [
  {
    id: "af",
    name: "Atrial Fibrillation",
    description: "Irregularly irregular rhythm with absent P waves",
    criteria: [
      "Irregularly irregular RR intervals",
      "No distinct P waves (replaced by fibrillatory waves)",
      "Ventricular rate typically 100-160 bpm (uncontrolled)",
      "Narrow QRS complexes (unless BBB or aberrancy)",
      "Baseline may show coarse or fine fibrillatory waves",
    ],
    clinicalSignificance: "Most common sustained arrhythmia. Associated with increased stroke risk (CHA₂DS₂-VASc scoring). Rate control vs rhythm control decision needed pre-operatively.",
    management: "Rate control (beta-blocker, diltiazem, digoxin). Anticoagulation if CHA₂DS₂-VASc ≥2. Consider cardioversion if <48h onset. Bridge with heparin for surgery.",
  },
  {
    id: "aflutter",
    name: "Atrial Flutter",
    description: "Sawtooth flutter waves, typically 2:1 or 4:1 conduction",
    criteria: [
      "Sawtooth flutter waves (F waves) best seen in II, III, aVF",
      "Atrial rate typically 250-350 bpm",
      "Ventricular rate often 150 bpm (2:1 block)",
      "Regular or regularly irregular RR intervals",
      "F waves visible between QRS complexes",
    ],
    clinicalSignificance: "Organized atrial tachycardia. Higher stroke risk than AF. Often converts to AF. Pre-operative ablation may be considered.",
    management: "Rate control (beta-blocker, calcium channel blocker). Anticoagulation recommended. Consider DC cardioversion or ablation.",
  },
  {
    id: "svt",
    name: "Supraventricular Tachycardia (SVT)",
    description: "Regular narrow-complex tachycardia, abrupt onset/offset",
    criteria: [
      "Regular, narrow QRS tachycardia (150-250 bpm)",
      "Abrupt onset and termination",
      "P waves may be hidden (AVNRT) or retrograde (AVRT)",
      "No visible atrial activity in many cases",
      "May have QRST pattern mimicking atrial activity",
    ],
    clinicalSignificance: "Includes AVNRT, AVRT (WPW), atrial tachycardia. Generally benign but symptomatic. Rarely life-threatening unless WPW with AF.",
    management: "Vagal maneuvers, adenosine 6-12mg IV. If recurrent, beta-blocker or ablation. Avoid AV nodal blockers in WPW with pre-excited AF.",
  },
  {
    id: "vt",
    name: "Ventricular Tachycardia (VT)",
    description: "Wide-complex tachycardia, regular, AV dissociation",
    criteria: [
      "Wide QRS complexes (>120ms, usually >140ms)",
      "Regular RR intervals",
      "Rate typically 150-250 bpm",
      "AV dissociation (P waves independent of QRS)",
      "Capture beats or fusion beats (diagnostic)",
      "Extreme axis deviation ('northwest axis')",
    ],
    clinicalSignificance: "Medical emergency if unstable. May be monomorphic or polymorphic. High perioperative risk. Requires urgent evaluation.",
    management: "If unstable: immediate DC cardioversion. If stable: amiodarone, procainamide, or lidocaine. Identify reversible causes. ICD evaluation.",
  },
  {
    id: "vfib",
    name: "Ventricular Fibrillation (VF)",
    description: "Chaotic, irregular wide-complex rhythm, no organized QRS",
    criteria: [
      "Irregularly irregular, chaotic rhythm",
      "No distinct QRS complexes",
      "Coarse or fine fibrillatory waves",
      "Rate cannot be determined (usually very fast)",
      "No P waves, no organized electrical activity",
    ],
    clinicalSignificance: "Cardiac arrest rhythm. No pulse. Requires immediate defibrillation. Post-op VF rare but catastrophic.",
    management: "Immediate defibrillation (200J biphasic). ACLS protocol. Identify cause (ischemia, electrolytes, drugs). Post-ROSC: amiodarone, cooling.",
  },
  {
    id: "pvc",
    name: "Premature Ventricular Contractions (PVCs)",
    description: "Early, wide QRS with compensatory pause",
    criteria: [
      "Premature, wide QRS complex (>120ms)",
      "No preceding P wave",
      "Bizarre morphology, different from sinus beats",
      "Full compensatory pause (pause = 2x RR interval)",
      "May be unifocal (same morphology) or multifocal",
    ],
    clinicalSignificance: "Common in healthy individuals. >5/min increases perioperative risk (Goldman criteria). Evaluate for underlying heart disease.",
    management: "If asymptomatic and no structural heart disease: reassurance. If >5/min: beta-blocker, consider cardiology consult. Check electrolytes (K, Mg).",
  },
  {
    id: "pac",
    name: "Premature Atrial Contractions (PACs)",
    description: "Early P wave with different morphology",
    criteria: [
      "Premature P wave with different morphology",
      "PR interval may be normal, shortened, or prolonged",
      "QRS typically narrow (unless aberrancy)",
      "Incomplete compensatory pause",
      "May trigger SVT or AF in susceptible patients",
    ],
    clinicalSignificance: "Generally benign. May indicate atrial irritability, electrolyte disturbance, or hypervagal tone. Less concerning than PVCs.",
    management: "Usually no treatment needed. Address triggers (caffeine, alcohol, stress, electrolytes). Beta-blocker if symptomatic.",
  },
  {
    id: "avblock",
    name: "AV Blocks (1st, 2nd, 3rd Degree)",
    description: "Progressive impairment of AV conduction",
    criteria: [
      "1st degree: PR interval >200ms, all P waves conducted",
      "2nd degree Mobitz I (Wenckebach): progressive PR prolongation, then dropped beat",
      "2nd degree Mobitz II: sudden dropped beats without PR prolongation",
      "3rd degree (complete): P waves and QRS independent, regular escape rhythm",
      "Mobitz II and 3rd degree: wide QRS suggests infranodal block",
    ],
    clinicalSignificance: "1st degree and Mobitz I usually benign. Mobitz II and 3rd degree: high perioperative risk. May need temporary pacing.",
    management: "1st degree/Mobitz I: monitor. Mobitz II/3rd degree: cardiology consult, consider pacing. Avoid AV node blockers. Check for reversible causes (drugs, ischemia).",
  },
  {
    id: "bbb",
    name: "Bundle Branch Blocks (RBBB, LBBB)",
    description: "Wide QRS from delayed ventricular conduction",
    criteria: [
      "QRS duration >120ms",
      "RBBB: rsR' in V1 ('M' pattern), wide S in I, V5, V6",
      "LBBB: Broad/notched R in I, V5, V6; QS or rS in V1, V2",
      "LBBB: ST-T changes opposite to QRS direction",
      "New LBBB: consider acute MI until proven otherwise",
    ],
    clinicalSignificance: "RBBB often benign. LBBB may indicate structural heart disease. New LBBB with chest pain = STEMI equivalent. Affects ECG interpretation.",
    management: "Evaluate for underlying heart disease. New LBBB: troponins, echo. Chronic stable BBB: no specific treatment. Consider cardiology if symptomatic.",
  },
  {
    id: "lvh",
    name: "Left Ventricular Hypertrophy (LVH)",
    description: "Increased QRS voltage from left ventricular mass",
    criteria: [
      "Sokolow-Lyon: S in V1 + R in V5/V6 > 35mm",
      "Cornell: R in aVL + S in V3 > 20mm (women), > 28mm (men)",
      "Romhilt-Estes score ≥5 (definite LVH)",
      "Repolarization abnormalities (strain pattern)",
      "Left axis deviation common",
    ],
    clinicalSignificance: "Indicates pressure or volume overload. Associated with HTN, aortic stenosis, hypertrophic cardiomyopathy. Independent CV risk factor.",
    management: "Identify and treat underlying cause (HTN, AS, HCM). Optimize blood pressure. Echo for structural assessment. May affect surgical risk.",
  },
  {
    id: "stchanges",
    name: "ST-T Changes (Ischemia, Injury, Infarction)",
    description: "ST elevation, depression, or T wave abnormalities",
    criteria: [
      "ST elevation: >1mm in ≥2 contiguous leads (STEMI)",
      "ST depression: horizontal or downsloping >0.5mm",
      "T wave inversions: >1mm in ≥2 contiguous leads",
      "New changes are more concerning than chronic",
      "ST elevation + Q waves = late MI",
    ],
    clinicalSignificance: "ST elevation = acute MI until proven otherwise. ST depression = ischemia or reciprocal changes. T wave inversion: ischemia, LVH, electrolytes.",
    management: "New STEMI: immediate reperfusion (PCI or thrombolysis). ST depression with chest pain: NSTE-ACS pathway. Compare to prior ECGs.",
  },
  {
    id: "paced",
    name: "Paced Rhythm",
    description: "Pacemaker-generated rhythm with pacing spikes",
    criteria: [
      "Pacing spikes preceding QRS complexes",
      "LBBB morphology (right ventricular pacing)",
      "May have atrial pacing spikes before P waves",
      "Fusion beats if intrinsic rhythm competes",
      "Rate typically set 60-70 bpm (ventricular)",
    ],
    clinicalSignificance: "Patient has pacemaker/ICD. Requires device interrogation pre-operatively. May need mode switch for surgery. MRI compatibility check.",
    management: "Cardiology/pacemaker clinic consult. Check battery life, lead function. Pacemaker: set to asynchronous mode if needed. ICD: may need magnet or reprogramming.",
  },
  {
    id: "sinusarrhythmia",
    name: "Sinus Arrhythmia",
    description: "Normal sinus rhythm with respiratory variation",
    criteria: [
      "Normal P wave morphology and axis",
      "PR interval constant (120-200ms)",
      "RR interval varies with respiration",
      "Rate variation >10% common in young/athletic",
      "Augments with inspiration, decreases with expiration",
    ],
    clinicalSignificance: "Normal variant, especially in young patients. Sign of good vagal tone. No clinical significance. NOT counted in Goldman 'rhythm other than sinus'.",
    management: "No treatment needed. Reassurance that this is normal.",
  },
  {
    id: "sinustachy",
    name: "Sinus Tachycardia",
    description: "Normal sinus rhythm at rate >100 bpm",
    criteria: [
      "P waves normal morphology and axis",
      "PR interval normal (120-200ms)",
      "Rate 100-150 bpm (may be higher if young)",
      "Gradual onset and offset",
      "Each P wave followed by QRS",
    ],
    clinicalSignificance: "Physiologic response to stress, pain, fever, hypovolemia, anemia, thyrotoxicosis. Find and treat underlying cause. NOT counted in Goldman 'rhythm other than sinus'.",
    management: "Identify and treat underlying cause. Correct hypovolemia, hypoxia, pain, anxiety. Avoid treating the tachycardia itself without addressing cause.",
  },
  {
    id: "sinusbrady",
    name: "Sinus Bradycardia",
    description: "Normal sinus rhythm at rate <60 bpm",
    criteria: [
      "P waves normal morphology and axis",
      "PR interval normal (120-200ms)",
      "Rate <60 bpm",
      "Each P wave followed by QRS",
      "May be seen in athletes, during sleep",
    ],
    clinicalSignificance: "Common in athletes, elderly, hypothyroidism, increased vagal tone. May cause symptoms if severe. NOT counted in Goldman 'rhythm other than sinus'.",
    management: "If asymptomatic: observation. If symptomatic: atropine, transcutaneous pacing. Evaluate for beta-blocker overdose, sick sinus syndrome.",
  },
  {
    id: "wpw",
    name: "Wolff-Parkinson-White (WPW)",
    description: "Pre-excitation syndrome with delta wave",
    criteria: [
      "Short PR interval (<120ms)",
      "Delta wave (slurred upstroke of QRS)",
      "Wide QRS complex (>120ms)",
      "May have narrow QRS if accessory pathway far from AV node",
      "Predisposes to AVRT (orthodromic or antidromic)",
    ],
    clinicalSignificance: "Pre-excited AF can degenerate to VF (life-threatening). Avoid AV nodal blockers in wide-complex tachycardia. Risk stratification needed.",
    management: "Asymptomatic: may monitor or ablate. Symptomatic: ablation first-line. Avoid digoxin, verapamil in WPW with AF. Procainamide for acute management.",
  },
  {
    id: "qtprolong",
    name: "QT Prolongation",
    description: "Prolonged QT interval, risk of torsades",
    criteria: [
      "QTc >450ms (men), >470ms (women)",
      "Corrected QT = QT / √RR (Bazett formula)",
      "May be congenital or acquired (drugs, electrolytes)",
      "T wave may be notched or bifid",
      "Predisposes to torsades de pointes",
    ],
    clinicalSignificance: "Risk of torsades de pointes (polymorphic VT). Many drugs prolong QT (antiarrhythmics, antibiotics, antipsychotics). Avoid QT-prolonging drugs.",
    management: "Correct electrolytes (K, Mg). Stop QT-prolonging drugs. If torsades: magnesium sulfate IV. Consider temporary pacing for bradycardia-induced QT prolongation.",
  },
  // Syncope-relevant ECG patterns
  {
    id: "brugada",
    name: "Brugada Syndrome",
    description: "Inherited sodium channelopathy with coved ST elevation in V1-V3",
    criteria: [
      "Type 1 (diagnostic): Coved ST elevation ≥2mm in V1-V3 with negative T waves",
      "Type 2: Saddleback ST elevation with ≥2mm J-point elevation, ≥1mm ST",
      "Type 3: ST elevation <1mm (saddleback or coved)",
      "May be unmasked by fever, sodium channel blockers (ajmaline, flecainide)",
      "Normal cardiac imaging, no structural heart disease",
    ],
    clinicalSignificance: "Channelopathy causing sudden cardiac death in structurally normal heart. VF/SCD risk even with Type 1 ECG and no symptoms. Quotidian arrhythmia trigger. High perioperative risk if ECG abnormal.",
    management: "ICD implantation for Type 1 ECG with symptoms or spontaneous ECG. Avoid sodium channel blockers, tricyclic antidepressants. Treat fever aggressively. Genetic testing, family screening. Avoid general anesthesia without cardiac monitoring.",
  },
  {
    id: "arvc",
    name: "Arrhythmogenic Right Ventricular Cardiomyopathy (ARVC)",
    description: "Fibrofatty replacement of RV myocardium, epsilon waves",
    criteria: [
      "Epsilon wave: Small deflection after QRS in V1-V3 (pathognomonic)",
      "T wave inversions in V1-V3 (in right precordial leads)",
      "Prolonged QRS duration >110ms in V1-V3",
      "Localized QRS prolongation in right precordial leads",
      "May show ventricular arrhythmias with LBBB morphology",
    ],
    clinicalSignificance: "Genetic cardiomyopathy with fibrofatty RV infiltration. Cause of sudden death in young athletes. VT with LBBB morphology typical. Progressive RV dysfunction.",
    management: "ICD for sustained VT or high-risk features. Avoid endurance exercise. Beta-blockers for symptomatic arrhythmias. Genetic testing, family screening. Echo/CMR for structural assessment. Endocardial ablation may be needed.",
  },
  {
    id: "cpvt",
    name: "Catecholaminergic Polymorphic VT (CPVT)",
    description: "Bidirectional VT triggered by stress/exercise, normal resting ECG",
    criteria: [
      "Normal resting ECG (key diagnostic feature)",
      "Bidirectional VT during exercise/stress: alternating QRS axis",
      "Polymorphic VT triggered by catecholamines",
      "Exercise stress test reproduces arrhythmia",
      "QT interval normal (differentiates from LQTS)",
    ],
    clinicalSignificance: "Genetic ryanodine receptor mutation. Exertion-triggered syncope or SCD. Normal resting ECG makes diagnosis challenging. Often misdiagnosed as seizure disorder.",
    management: "Avoid strenuous exercise, emotional stress. Beta-blockers first-line (nadolol preferred). Flecainide if beta-blocker inadequate. ICD for survivors of cardiac arrest. Genetic testing, family screening. Perioperative: maintain beta-blockade, minimize sympathetic stimulation.",
  },
  {
    id: "hcm",
    name: "Hypertrophic Cardiomyopathy (HCM)",
    description: "LVH with bizarre QRS morphology, deep narrow Q waves",
    criteria: [
      "Marked LVH criteria (Sokolow-Lyon, Cornell voltage)",
      "Deep narrow Q waves in lateral leads (I, aVL, V5-V6)",
      "Bizarre QRS morphology (not typical LBBB or RBBB)",
      "ST-T changes disproportionate to LVH severity",
      "May have LVOT gradient (systolic murmur)",
    ],
    clinicalSignificance: "Most common genetic cardiomyopathy. Risk of sudden death (VT/VF). Myocardial disarray predisposes to arrhythmia. LVOT obstruction may cause syncope with exertion.",
    management: "Risk stratification for SCD (family history, wall thickness >30mm, NSVT, syncope). Beta-blockers for symptoms. ICD for high-risk patients. Avoid competitive sports. Genetic testing, family screening. Pre-op echo essential.",
  },
  {
    id: "lqtspattern",
    name: "Long QT Syndrome (LQTS) Patterns",
    description: "Inherited QT prolongation with syndrome-specific T wave morphologies",
    criteria: [
      "QTc >460ms (men), >480ms (women) on resting ECG",
      "LQT1: Broad-based T waves, notched T waves common",
      "LQT2: Low-amplitude T waves, bifid T waves",
      "LQT3: Late-onset peaked T waves, prolonged ST segment",
      "May have normal QTc at rest; exercise ECG unmasked",
    ],
    clinicalSignificance: "Inherited cardiac channelopathy. Trigger-specific arrhythmia: LQT1 (exercise/swimming), LQT2 (sudden auditory stimuli), LQT3 (sleep/rest). Syncope may be cardiac arrest.",
    management: "Beta-blockers for all symptomatic patients (nadolol preferred). Avoid QT-prolonging drugs. Lifestyle modification based on genotype. ICD for cardiac arrest survivors. Genetic testing, family screening. Perioperative: maintain beta-blockade, avoid hypokalemia, minimize QT-prolonging drugs.",
  },
  {
    id: "erls",
    name: "Early Repolarization Syndrome (ERS)",
    description: "J-point elevation in inferior/lateral leads, may cause VF",
    criteria: [
      "J-point elevation ≥1mm in ≥2 inferior leads (II, III, aVF) or lateral leads (I, aVL, V4-V6)",
      "Notching or slurring of J point",
      "May have horizontal or descending ST segment",
      "More prominent during bradycardia, reduced with tachycardia",
      "Commonly seen in young healthy males",
    ],
    clinicalSignificance: "Most commonly benign variant. ERS associated with idiopathic VF when J-point elevation >2mm, horizontal ST, in inferior leads. May cause unexplained syncope.",
    management: "Risk stratification if symptomatic (syncope, cardiac arrest). Avoid Vaughn-Williams class I antiarrhythmics. Quinidine may be effective. ICD for cardiac arrest survivors. Perioperative: monitor for VF, avoid hypothermia.",
  },
  {
    id: "sqs",
    name: "Sick Sinus Syndrome (SSS)",
    description: "Sinus node dysfunction, bradycardia-tachycardia syndrome",
    criteria: [
      "Sinus bradycardia <50 bpm or sinus pauses >2 seconds",
      "Sinus arrest or exit block",
      "Alternating bradycardia and tachycardia (brady-tachy syndrome)",
      "Failure of sinus rhythm after cardioversion",
      "May have prolonged sinus node recovery time on EP study",
    ],
    clinicalSignificance: "Age-related sinus node degeneration. Syncope from prolonged sinus pauses. Often coexists with AF. Drug interactions common (beta-blockers, CCBs, digoxin).",
    management: "Pacemaker for symptomatic bradycardia. Rate control for AF. Avoid AV nodal blockers if pacing not established. Consider anticoagulation if AF present. Perioperative: careful with anesthetics, may need temporary pacing.",
  },
  {
    id: "hbs",
    name: "High-Grade AV Block",
    description: "Advanced AV conduction disease requiring pacing",
    criteria: [
      "2:1 or higher degree AV block (alternating conducted and blocked beats)",
      "Advanced AV block: multiple consecutive nonconducted P waves",
      "Wide QRS escape rhythm (<40 bpm) suggests infranodal block",
      "Narrow QRS escape (>40 bpm) suggests AV nodal level",
      "May progress to complete heart block",
    ],
    clinicalSignificance: "High perioperative risk. Syncope common. May be asymptomatic until stressed. Requires permanent pacing. Infranodal block has unreliable escape rhythm.",
    management: "Urgent cardiology referral. Temporary pacing if symptomatic. Permanent pacemaker for Mobitz II or advanced AV block. Avoid AV nodal blockers. Perioperative: may need temporary pacing wire, avoid agents that worsen AV block.",
  },
];

// Anti-arrhythmic Drug Classification (Vaughn-Williams)
interface AntiarrhythmicDrug {
  name: string;
  uses?: string[];
  cautions?: string;
}

interface AntiarrhythmicSubclass {
  class: string;
  mnemonic?: string;
  drugs: AntiarrhythmicDrug[];
}

interface AntiarrhythmicClass {
  class: string;
  mechanism: string;
  mnemonic?: string;
  drugs: AntiarrhythmicDrug[];
  subclasses?: AntiarrhythmicSubclass[];
  clinicalPearls?: string[];
}

const ANTIARRHYTHMIC_CLASSES: AntiarrhythmicClass[] = [
  {
    class: "I",
    mechanism: "Na⁺ channel blockers (membrane stabilizers)",
    drugs: [],
    subclasses: [
      {
        class: "A",
        mnemonic: "Quinine Likes Fever",
        drugs: [
          { name: "Quinidine", uses: ["AF/flutter conversion", "ventricular arrhythmias"], cautions: "QT prolongation, TdP risk, GI upset, cinchonism" },
          { name: "Procainamide", uses: ["VT", "AF (IV)", "SVT"], cautions: "Lupus-like syndrome, QT prolongation, hypotension IV" },
          { name: "Disopyramide", uses: ["VT prevention", "vagal AF"], cautions: "Anticholinergic effects, negative inotropy, contraindicated in HCM" },
        ],
      },
      {
        class: "B",
        mnemonic: "Likes",
        drugs: [
          { name: "Lidocaine", uses: ["VT/VF (IV)", "post-MI VT"], cautions: "CNS toxicity (seizures, confusion), only IV/IM, narrow therapeutic window" },
          { name: "Mexiletine", uses: ["VT (oral)", "neuropathic pain"], cautions: "GI upset, tremor, CNS effects, check levels" },
        ],
      },
      {
        class: "C",
        mnemonic: "Fever",
        drugs: [
          { name: "Flecainide", uses: ["AF/flutter", "SVT", "WPW"], cautions: "Pro-arrhythmic in structural heart disease, contraindicated post-MI, CAD" },
          { name: "Propafenone", uses: ["AF", "SVT"], cautions: "Structural heart disease contraindication, beta-blocking properties, interacts with digoxin" },
        ],
      },
    ],
    clinicalPearls: [
      "Class IA: Moderate Na⁺ block, prolongs QRS and QT",
      "Class IB: Mild Na⁺ block, shortens QT, ischemic tissue effect",
      "Class IC: Strong Na⁺ block, markedly prolongs QRS, avoid in CAD",
      "CAST trial: Flecainide/propafenone contraindicated post-MI",
    ],
  },
  {
    class: "II",
    mechanism: "Beta blockers (β-adrenergic antagonists)",
    mnemonic: "LOL",
    drugs: [
      { name: "Propranolol", uses: ["SVT", "thyroid storm", "essential tremor", "migraine prophylaxis"], cautions: "Non-selective, asthma contraindication, hypoglycemia masking" },
      { name: "Metoprolol", uses: ["Rate control (AF)", "HF (succinate)", "post-MI", "HTN"], cautions: "β1-selective (less bronchospasm), fatigue, bradycardia" },
      { name: "Atenolol", uses: ["HTN", "rate control"], cautions: "β1-selective, once daily, less effective post-MI" },
      { name: "Esmolol", uses: ["IV rate control (AF)", "intraoperative", "thyroid storm"], cautions: "Short half-life (9 min), IV only, continuous infusion" },
      { name: "Bisoprolol", uses: ["HF", "HTN"], cautions: "β1-selective, long-acting, well-tolerated in HF" },
      { name: "Carvedilol", uses: ["HF", "HTN"], cautions: "Non-selective + α-blockade, more hypotension, take with food" },
    ],
    clinicalPearls: [
      "First-line for rate control in AF (with diltiazem)",
      "Reduce mortality post-MI and in HF",
      "Avoid in acute decompensated HF, severe asthma, bradycardia",
      "Never stop abruptly — taper over 1-2 weeks",
    ],
  },
  {
    class: "III",
    mechanism: "K⁺ channel blockers (prolong repolarization)",
    mnemonic: "AIDS",
    drugs: [
      { name: "Amiodarone", uses: ["VT/VF", "AF (rate/rhythm)", "ICD storms"], cautions: "Pulmonary fibrosis, thyroid dysfunction, hepatitis, photosensitivity, QT prolongation, drug interactions (CYP inhibitor), long half-life (40-55 days)" },
      { name: "Dronedarone", uses: ["AF (non-permanent)", "paroxysmal AF"], cautions: "Contraindicated in HF (NYHA III-IV), permanent AF, contraindicated with potent CYP3A4 inhibitors" },
      { name: "Sotalol", uses: ["AF", "VT"], cautions: "QT prolongation, TdP risk (especially females, hypokalemia), β-blockade effects, renal dosing" },
      { name: "Ibutilide", uses: ["AF/flutter conversion (IV)"], cautions: "QT prolongation, TdP risk (3-4%), give with Mg, continuous monitoring required" },
      { name: "Dofetilide", uses: ["AF conversion/maintenance"], cautions: "QT prolongation, TdP risk, requires inpatient initiation, renal dosing" },
    ],
    clinicalPearls: [
      "Amiodarone: most effective, most toxic, long half-life",
      "Dronedarone: amiodarone analog, less effective, less toxic",
      "All prolong QT — monitor electrolytes, avoid with QT drugs",
      "Sotalol/dofetilide/ibutilide require QT monitoring",
    ],
  },
  {
    class: "IV",
    mechanism: "Ca²⁺ channel blockers (non-dihydropyridine)",
    drugs: [
      { name: "Verapamil", uses: ["SVT (AVNRT)", "rate control (AF)", "HTN", "HOCM"], cautions: "Negative inotropy, avoid in HF, AV block, WPW with AF, interacts with β-blockers" },
      { name: "Diltiazem", uses: ["Rate control (AF)", "HTN", "angina"], cautions: "Less negative inotropy than verapamil, avoid in HF with reduced EF, contraindicated with β-blockers" },
    ],
    clinicalPearls: [
      "Only non-DHP CCBs affect AV node (verapamil, diltiazem)",
      "DHP CCBs (amlodipine, nifedipine) do NOT affect AV node",
      "Avoid in WPW with AF (may precipitate VF)",
      "First-line for SVT (AVNRT) with Valsalva/adenosine failure",
    ],
  },
  {
    class: "V",
    mechanism: "Other / Miscellaneous",
    drugs: [
      { name: "Adenosine", uses: ["SVT termination (AVNRT)", "diagnostic (wide-complex tachycardia)"], cautions: "Very short half-life (<10s), avoid in WPW, asthma, heart transplant, may cause chest tightness/flushing" },
      { name: "Digoxin", uses: ["Rate control (AF, especially HF)", "HF (add-on)"], cautions: "Narrow therapeutic window, renal dosing, toxicity (GI, visual, arrhythmias), avoid in WPW, interactions with amiodarone/verapamil" },
      { name: "Magnesium sulfate", uses: ["TdP", "VT (refractory)", "digitalis toxicity"], cautions: "Hypotension IV, flushing, check renal function, may cause reflex hypocalcemia" },
    ],
    clinicalPearls: [
      "Adenosine: diagnostic AND therapeutic for SVT",
      "Digoxin: only improves resting rate (not exercise)",
      "Magnesium: first-line for TdP regardless of Mg level",
    ],
  },
];

const GoldmanCardiacIndex = () => {
  const buildInitialFactors = (): RiskFactor[] => [
    // History
    { id: "s3", letter: "S", factor: "S3 gallop or JVP > 12 cm", points: 11, active: false, category: "history" },
    { id: "mi_recent", letter: "M", factor: "MI within 6 months", points: 10, active: false, category: "history" },
    { id: "pvc", letter: "P", factor: "> 5 PVCs/min", points: 7, active: false, category: "history" },
    { id: "ischemic_hd", letter: "O", factor: "Ischemic heart disease", points: 3, active: false, category: "history" },
    { id: "multiple_risk_factors", letter: "M", factor: "Multiple risk factors (DM, HTN, smoking, hyperlipidemia)", points: 2, active: false, category: "history" },

    // Examination
    { id: "aortic_stenosis", letter: "A", factor: "Aortic stenosis (critical)", points: 3, active: false, category: "examination" },

    // ECG
    { id: "rhythm_other", letter: "R", factor: "Rhythm other than sinus or PVCs on last ECG", points: 7, active: false, category: "ecg" },
    { id: "ecg_abnormal", letter: "E", factor: "ECG abnormal (ST-T changes, LVH, LBBB, pacing)", points: 3, active: false, category: "ecg" },

    // Vitals
    { id: "emergency", letter: "E", factor: "Emergency surgery", points: 4, active: false, category: "vitals" },

    // Lab/Vitals
    { id: "poor_medical", letter: "P", factor: "Poor general medical status (bedridden, cachexia)", points: 3, active: false, category: "lab" },
    { id: "elderly", letter: "E", factor: "Age > 70 years", points: 5, active: false, category: "age" },
    { id: "age_60_69", letter: "A", factor: "Age 60–69 years", points: 2, active: false, category: "age" },
  ];

  const [factors, setFactors] = useState<RiskFactor[]>(buildInitialFactors());
  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set(["history", "examination", "ecg", "vitals", "lab", "age"]));
  const [showECGPatterns, setShowECGPatterns] = useState(false);
  const [expandedECGPatterns, setExpandedECGPatterns] = useState<Set<string>>(new Set());
  const [showAntiarrhythmics, setShowAntiarrhythmics] = useState(false);
  const [expandedDrugClasses, setExpandedDrugClasses] = useState<Set<string>>(new Set());
  const [showSyncopeAlgorithm, setShowSyncopeAlgorithm] = useState(false);
  const [showACLS, setShowACLS] = useState(false);

  const toggleFactor = (id: string) => {
    setFactors(prev => prev.map(f => f.id === id ? { ...f, active: !f.active } : f));
  };

  const toggleCat = (cat: string) => {
    setExpandedCats(prev => {
      const next = new Set(prev);
      if (next.has(cat)) {
        next.delete(cat);
      } else {
        next.add(cat);
      }
      return next;
    });
  };

  const toggleECGPattern = (id: string) => {
    setExpandedECGPatterns(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleDrugClass = (cls: string) => {
    setExpandedDrugClasses(prev => {
      const next = new Set(prev);
      if (next.has(cls)) {
        next.delete(cls);
      } else {
        next.add(cls);
      }
      return next;
    });
  };

  const result = useMemo(() => {
    const activeFactors = factors.filter(f => f.active);
    const totalPoints = activeFactors.reduce((sum, f) => sum + f.points, 0);

    let riskClass: string;
    let observedRisk: string;
    let color: string;

    if (totalPoints === 0) {
      riskClass = "Class I";
      observedRisk = "0.7%";
      color = "text-success";
    } else if (totalPoints <= 2) {
      riskClass = "Class II";
      observedRisk = "3%";
      color = "text-warning";
    } else if (totalPoints <= 4) {
      riskClass = "Class III";
      observedRisk = "15%";
      color = "text-warning";
    } else {
      riskClass = "Class IV";
      observedRisk = "30%";
      color = "text-destructive";
    }

    return { totalPoints, riskClass, observedRisk, color, activeFactors };
  }, [factors]);

  const categoryLabels: Record<string, { label: string; icon: typeof Heart }> = {
    history: { label: "Cardiac History", icon: Heart },
    examination: { label: "Examination Findings", icon: Info },
    ecg: { label: "ECG Abnormalities", icon: Activity },
    vitals: { label: "Surgery Urgency", icon: AlertTriangle },
    lab: { label: "General Status", icon: Info },
    age: { label: "Age", icon: Info },
  };

  const grouped = useMemo(() => {
    const cats = ["history", "examination", "ecg", "vitals", "lab", "age"];
    return cats.map(cat => ({
      key: cat,
      ...categoryLabels[cat],
      factors: factors.filter(f => f.category === cat),
      activeCount: factors.filter(f => f.category === cat && f.active).length,
      points: factors.filter(f => f.category === cat && f.active).reduce((s, f) => s + f.points, 0),
    }));
  }, [factors]);

  const riskMeter = () => {
    const maxScore = 60;
    const pct = Math.min((result.totalPoints / maxScore) * 100, 100);
    return (
      <div className="relative h-4 rounded-full overflow-hidden bg-muted">
        <div
          className="absolute inset-y-0 left-0 rounded-full transition-all duration-500"
          style={{
            width: `${pct}%`,
            background: result.totalPoints === 0
              ? "hsl(var(--success))"
              : result.totalPoints <= 4
              ? "hsl(var(--warning))"
              : "hsl(var(--destructive))",
          }}
        />
      </div>
    );
  };

  return (
    <div className="space-y-5 animate-slide-in">
      <div>
        <h1 className="text-xl font-heading font-bold">Goldman Cardiac Risk Index</h1>
        <p className="text-sm text-muted-foreground">
          Cardiac risk index for non-cardiac surgery — Goldman et al., N Engl J Med 1977
        </p>
      </div>

      {/* Score result card */}
      <div className={`clinical-card border-l-4 ${
        result.totalPoints === 0 ? "border-l-success" :
        result.totalPoints <= 4 ? "border-l-warning" : "border-l-destructive"
      }`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {result.totalPoints === 0 ? (
              <CheckCircle className="w-5 h-5 text-success" />
            ) : (
              <AlertTriangle className={`w-5 h-5 ${result.color}`} />
            )}
            <div>
              <h3 className="font-heading font-bold text-lg">{result.riskClass}</h3>
              <p className="text-xs text-muted-foreground">
                {result.activeFactors.length} selected · {result.totalPoints} points
              </p>
            </div>
          </div>
          <div className="text-right">
            <span className={`text-3xl font-heading font-bold ${result.color}`}>{result.observedRisk}</span>
            <span className="text-xs text-muted-foreground block">mortality risk</span>
          </div>
        </div>

        {riskMeter()}
        <div className="flex justify-between text-xs text-muted-foreground mt-1">
          <span>Class I (0)</span>
          <span>Class II (1–2)</span>
          <span>Class III (3–4)</span>
          <span>Class IV (5+)</span>
        </div>

        {result.activeFactors.length > 0 && (
          <div className="mt-4 p-3 rounded-lg bg-muted/50">
            <h4 className="text-sm font-medium mb-2">Selected Factors</h4>
            <div className="flex flex-wrap gap-2">
              {result.activeFactors.map(f => (
                <span key={f.id} className="text-xs px-2 py-1 rounded-full bg-background border border-border">
                  <strong>{f.letter}</strong> · {f.factor} (+{f.points})
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Risk classes reference */}
      <Card className="border-border/40">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Info className="w-4 h-4 text-muted-foreground" />
            Risk Classes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-2 text-center">
            {GOLDMAN_CLASSES.map(cls => (
              <div key={cls.label} className={`p-2 rounded-lg ${
                cls.color === "success" ? "bg-success/10 border border-success/20" :
                cls.color === "warning" ? "bg-warning/10 border border-warning/20" :
                "bg-destructive/10 border border-destructive/20"
              }`}>
                <div className="font-medium text-sm">{cls.label}</div>
                <div className="text-xs text-muted-foreground">{cls.points} pts</div>
                <div className={`text-lg font-bold mt-1 ${
                  cls.color === "success" ? "text-success" :
                  cls.color === "warning" ? "text-warning" : "text-destructive"
                }`}>
                  {cls.observedRisk}
                </div>
                <div className="text-xs text-muted-foreground">mortality</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ECG Patterns Reference */}
      <Card className="border-border/40">
        <Collapsible open={showECGPatterns} onOpenChange={setShowECGPatterns}>
          <CollapsibleTrigger asChild>
            <button className="w-full">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-muted-foreground" />
                    ECG Patterns Reference
                  </span>
                  {showECGPatterns ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                </CardTitle>
              </CardHeader>
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-2 space-y-3">
              <p className="text-xs text-muted-foreground mb-3">
                Detailed ECG criteria for arrhythmias and conduction abnormalities. Helpful for interpreting Goldman's "Rhythm other than sinus" criterion.
              </p>
              {ECG_PATTERNS.map(pattern => (
                <Collapsible key={pattern.id} open={expandedECGPatterns.has(pattern.id)} onOpenChange={() => toggleECGPattern(pattern.id)}>
                  <CollapsibleTrigger asChild>
                    <button className="w-full text-left">
                      <div className={`p-3 rounded-lg border transition-colors ${
                        expandedECGPatterns.has(pattern.id) ? "bg-muted/50 border-primary/30" : "bg-muted/20 border-border/40 hover:bg-muted/30"
                      }`}>
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-medium text-sm">{pattern.name}</span>
                            <p className="text-xs text-muted-foreground mt-0.5">{pattern.description}</p>
                          </div>
                          {expandedECGPatterns.has(pattern.id) ? (
                            <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
                          )}
                        </div>
                      </div>
                    </button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="mt-2 p-3 rounded-lg bg-muted/30 border border-border/30 space-y-3">
                      {/* ECG Criteria */}
                      <div>
                        <h4 className="text-xs font-semibold text-muted-foreground mb-1.5">ECG Criteria</h4>
                        <ul className="text-xs space-y-1">
                          {pattern.criteria.map((c, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <span className="text-primary">•</span>
                              <span>{c}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      {/* Clinical Significance */}
                      <div>
                        <h4 className="text-xs font-semibold text-muted-foreground mb-1.5">Clinical Significance</h4>
                        <p className="text-xs text-foreground">{pattern.clinicalSignificance}</p>
                      </div>
                      {/* Management */}
                      <div className="p-2 rounded bg-background/50 border border-border/20">
                        <h4 className="text-xs font-semibold text-muted-foreground mb-1">Pre-operative Management</h4>
                        <p className="text-xs">{pattern.management}</p>
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              ))}
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* Anti-arrhythmic Drugs Classification */}
      <Card className="border-border/40">
        <Collapsible open={showAntiarrhythmics} onOpenChange={setShowAntiarrhythmics}>
          <CollapsibleTrigger asChild>
            <button className="w-full">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Pill className="w-4 h-4 text-muted-foreground" />
                    Anti-arrhythmic Drugs (Vaughn-Williams)
                  </span>
                  {showAntiarrhythmics ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                </CardTitle>
              </CardHeader>
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-2 space-y-4">
              {/* Mnemonic */}
              <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                <p className="text-xs text-muted-foreground mb-1">Mnemonic</p>
                <p className="text-lg font-bold text-primary">"Some Block Potassium Channels"</p>
                <div className="grid grid-cols-4 gap-2 mt-2 text-xs">
                  {["Some", "Block", "Potassium", "Channels"].map((word, i) => (
                    <div key={word} className="text-center p-1.5 rounded bg-muted/50">
                      <div className="font-medium text-foreground">{word}</div>
                      <div className="text-muted-foreground">
                        {["Sodium channel", "Beta blockers", "Potassium channel", "Calcium channel"][i]}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Drug Classes */}
              <div className="space-y-2">
                {ANTIARRHYTHMIC_CLASSES.map((cls) => (
                  <Collapsible key={cls.class} open={expandedDrugClasses.has(cls.class)} onOpenChange={() => toggleDrugClass(cls.class)}>
                    <CollapsibleTrigger asChild>
                      <button className="w-full text-left">
                        <div className={`p-3 rounded-lg border transition-colors ${
                          expandedDrugClasses.has(cls.class) ? "bg-muted/50 border-primary/30" : "bg-muted/20 border-border/40 hover:bg-muted/30"
                        }`}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-lg font-bold text-primary">Class {cls.class}</span>
                              <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                                {cls.mechanism}
                              </span>
                              {cls.mnemonic && (
                                <span className="text-xs px-2 py-0.5 rounded-full bg-warning/10 text-warning">
                                  {cls.mnemonic}
                                </span>
                              )}
                            </div>
                            {expandedDrugClasses.has(cls.class) ? (
                              <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
                            )}
                          </div>
                        </div>
                      </button>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="mt-2 p-3 rounded-lg bg-muted/30 border border-border/30 space-y-3">
                        {/* Subclasses for Class I */}
                        {cls.subclasses ? (
                          <div className="space-y-3">
                            {cls.subclasses.map((sub) => (
                              <div key={sub.class} className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-sm">Class {cls.class}{sub.class}</span>
                                  {sub.mnemonic && (
                                    <span className="text-xs px-2 py-0.5 rounded-full bg-warning/10 text-warning">
                                      {sub.mnemonic}
                                    </span>
                                  )}
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                                  {sub.drugs.map((drug) => (
                                    <div key={drug.name} className="p-2 rounded bg-background/50 border border-border/30">
                                      <div className="font-medium text-sm">{drug.name}</div>
                                      {drug.uses && (
                                        <div className="text-xs text-muted-foreground mt-1">
                                          <span className="text-muted-foreground/70">Uses: </span>
                                          {drug.uses.join(", ")}
                                        </div>
                                      )}
                                      {drug.cautions && (
                                        <div className="text-xs text-destructive/80 mt-1">
                                          <span className="text-muted-foreground/70">⚠️ </span>
                                          {drug.cautions}
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                            {cls.drugs.map((drug) => (
                              <div key={drug.name} className="p-2 rounded bg-background/50 border border-border/30">
                                <div className="font-medium text-sm">{drug.name}</div>
                                {drug.uses && (
                                  <div className="text-xs text-muted-foreground mt-1">
                                    <span className="text-muted-foreground/70">Uses: </span>
                                    {drug.uses.join(", ")}
                                  </div>
                                )}
                                {drug.cautions && (
                                  <div className="text-xs text-destructive/80 mt-1">
                                    <span className="text-muted-foreground/70">⚠️ </span>
                                    {drug.cautions}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Clinical Pearls */}
                        {cls.clinicalPearls && (
                          <div className="p-2 rounded bg-primary/5 border border-primary/20">
                            <div className="text-xs font-medium text-primary mb-1">Clinical Pearls</div>
                            <ul className="text-xs space-y-1">
                              {cls.clinicalPearls.map((pearl, i) => (
                                <li key={i} className="flex items-start gap-1.5">
                                  <span className="text-primary shrink-0">•</span>
                                  <span>{pearl}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                ))}
              </div>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>
      {/* Syncope Algorithm */}
      <Card className="border-border/40">
        <Collapsible open={showSyncopeAlgorithm} onOpenChange={setShowSyncopeAlgorithm}>
          <CollapsibleTrigger asChild>
            <button className="w-full">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Brain className="w-4 h-4 text-muted-foreground" />
                    Syncope Diagnostic Algorithm
                  </span>
                  {showSyncopeAlgorithm ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                </CardTitle>
              </CardHeader>
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-2 space-y-4">
              {/* Step 1: Initial Evaluation */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-primary">Step 1: Initial Evaluation</h4>
                <div className="p-3 rounded-lg bg-muted/30 border border-border/30 space-y-2">
                  <div className="text-xs">
                    <strong>History:</strong>
                    <ul className="mt-1 space-y-0.5 ml-4 list-disc">
                      <li>Circumstances (standing, sitting, exertion)</li>
                      <li>Prodromal symptoms (warning signs)</li>
                      <li>Witnessed seizure activity, incontinence</li>
                      <li>Duration, recovery time</li>
                      <li>Medications, family history of SCD</li>
                    </ul>
                  </div>
                  <div className="text-xs">
                    <strong>Physical Exam:</strong>
                    <ul className="mt-1 space-y-0.5 ml-4 list-disc">
                      <li>Blood pressure (supine and standing)</li>
                      <li>Heart rate, rhythm</li>
                      <li>Cardiac exam (murmurs, S3/S4)</li>
                      <li>Neurologic exam</li>
                    </ul>
                  </div>
                  <div className="text-xs">
                    <strong>ECG (12-lead):</strong>
                    <ul className="mt-1 space-y-0.5 ml-4 list-disc">
                      <li>QT prolongation (LQTS)</li>
                      <li>Brugada pattern (coved ST elevation V1-V3)</li>
                      <li>Epsilon waves, T-wave inversions V1-V3 (ARVC)</li>
                      <li>LVH, Q waves (HCM)</li>
                      <li>AV block, bundle branch block</li>
                      <li>Pre-excitation (WPW)</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Red Flags */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-destructive">Red Flags (High-Risk Features)</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div className="p-2 rounded bg-destructive/5 border border-destructive/20">
                    <div className="text-xs font-medium text-destructive">Cardiac Red Flags</div>
                    <ul className="text-xs mt-1 space-y-0.5">
                      <li>• Syncope during exertion</li>
                      <li>• Palpitations before syncope</li>
                      <li>• Family history of SCD &lt;50 years</li>
                      <li>• Known structural heart disease</li>
                      <li>• Abnormal ECG</li>
                      <li>• Heart failure, prior MI</li>
                    </ul>
                  </div>
                  <div className="p-2 rounded bg-destructive/5 border border-destructive/20">
                    <div className="text-xs font-medium text-destructive">Orthostatic Red Flags</div>
                    <ul className="text-xs mt-1 space-y-0.5">
                      <li>• SBP drop &gt;20 mmHg standing</li>
                      <li>• Immediate syncope on standing</li>
                      <li>• Recent medication changes</li>
                      <li>• Dehydration, blood loss</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Classification */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-primary">Step 2: Classify by Mechanism</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <div className="p-2 rounded bg-muted/30 border border-border/30">
                    <div className="text-xs font-medium text-foreground">Reflex (Neurocardiogenic)</div>
                    <div className="text-xs text-muted-foreground mt-1 font-medium">Most common (35-50%)</div>
                    <ul className="text-xs mt-1 space-y-0.5">
                      <li>• Vasovagal syncope</li>
                      <li>• Situational (cough, micturition)</li>
                      <li>• Carotid sinus hypersensitivity</li>
                    </ul>
                    <div className="text-xs text-success mt-2">
                      <strong>Clues:</strong> Prodrome (nausea, diaphoresis), standing/sitting, triggers
                    </div>
                  </div>
                  <div className="p-2 rounded bg-muted/30 border border-border/30">
                    <div className="text-xs font-medium text-foreground">Orthostatic Hypotension</div>
                    <div className="text-xs text-muted-foreground mt-1 font-medium">10-20%</div>
                    <ul className="text-xs mt-1 space-y-0.5">
                      <li>• Medication-induced</li>
                      <li>• Volume depletion</li>
                      <li>• Autonomic dysfunction</li>
                      <li>• Deconditioning</li>
                    </ul>
                    <div className="text-xs text-success mt-2">
                      <strong>Clues:</strong> Immediate on standing, SBP drop &gt;20 mmHg
                    </div>
                  </div>
                  <div className="p-2 rounded bg-destructive/5 border border-destructive/20">
                    <div className="text-xs font-medium text-destructive">Cardiac Syncope</div>
                    <div className="text-xs text-destructive/70 mt-1 font-medium">Highest mortality</div>
                    <ul className="text-xs mt-1 space-y-0.5">
                      <li>• Arrhythmias (VT, SVT, brady)</li>
                      <li>• Structural (AS, HCM, PE)</li>
                      <li>• Channelopathies (Brugada, LQTS)</li>
                    </ul>
                    <div className="text-xs text-destructive mt-2">
                      <strong>Clues:</strong> No prodrome, exertion, abnormal ECG, heart disease
                    </div>
                  </div>
                </div>
              </div>

              {/* Treatment */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-primary">Step 3: Treatment by Etiology</h4>
                <div className="space-y-2">
                  <div className="p-2 rounded bg-muted/30 border border-border/30">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-foreground">Reflex (Vasovagal)</span>
                      <span className="text-xs px-1.5 py-0.5 rounded-full bg-success/10 text-success">First-line</span>
                    </div>
                    <ul className="text-xs space-y-0.5">
                      <li>• Lifestyle: avoid triggers, increase fluid/salt</li>
                      <li>• Physical counterpressure: isometric exercises, leg crossing</li>
                      <li>• Educate on prodrome → sit/lie down</li>
                      <li>• Consider: midodrine, fludrocortisone if recurrent</li>
                    </ul>
                  </div>
                  <div className="p-2 rounded bg-muted/30 border border-border/30">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-foreground">Orthostatic</span>
                    </div>
                    <ul className="text-xs space-y-0.5">
                      <li>• Address cause (meds, volume)</li>
                      <li>• Non-pharmacologic: compression, rise slowly</li>
                      <li>• Pharmacologic: midodrine, fludrocortisone</li>
                    </ul>
                  </div>
                  <div className="p-2 rounded bg-destructive/5 border border-destructive/20">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-destructive">Cardiac</span>
                      <span className="text-xs px-1.5 py-0.5 rounded-full bg-destructive/10 text-destructive">Urgent</span>
                    </div>
                    <ul className="text-xs space-y-0.5">
                      <li>• <strong>Brady:</strong> Pacemaker (sick sinus, AV block)</li>
                      <li>• <strong>Tachy:</strong> Antiarrhythmics, ablation, ICD</li>
                      <li>• <strong>Structural:</strong> Valve replacement, myectomy</li>
                      <li>• <strong>Channelopathy:</strong> ICD (Brugada, LQTS), avoid triggers</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Clinical Pearls */}
              <div className="p-3 rounded bg-primary/5 border border-primary/20">
                <h4 className="text-xs font-medium text-primary mb-2">Clinical Pearls</h4>
                <ul className="text-xs space-y-1">
                  <li>
                    <span className="text-primary">•</span> <strong>Syncope vs Seizure:</strong> Syncope = rapid recovery (&lt;1 min), no postictal; Seizure = postictal confusion, tongue bite
                  </li>
                  <li>
                    <span className="text-primary">•</span> <strong>Exertional syncope:</strong> Always cardiac until proven otherwise — echo, consider HCM, AS, VT
                  </li>
                  <li>
                    <span className="text-primary">•</span> <strong>Young athlete:</strong> Screen for HCM, ARVC, Brugada, CPVT — may need sports restriction
                  </li>
                  <li>
                    <span className="text-primary">•</span> <strong>Normal ECG:</strong> Does not exclude channelopathy — CPVT, Brugada may need provocation
                  </li>
                </ul>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>
      {/* ACLS/BLS Algorithms */}
      <Card className="border-border/40">
        <Collapsible open={showACLS} onOpenChange={setShowACLS}>
          <CollapsibleTrigger asChild>
            <button className="w-full">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-muted-foreground" />
                    ACLS/BLS Algorithms
                  </span>
                  {showACLS ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                </CardTitle>
              </CardHeader>
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-2 space-y-4">
              {/* BLS Algorithm */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-primary">BLS (Basic Life Support) Algorithm</h4>
                <div className="p-3 rounded-lg bg-success/5 border border-success/20 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-medium text-success">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-success/20">1</span>
                    Verify Scene Safety
                  </div>
                  <div className="flex items-center gap-2 text-xs font-medium text-success">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-success/20">2</span>
                    Check Responsiveness (tap shoulders, shout "Are you okay?")
                  </div>
                  <div className="flex items-center gap-2 text-xs font-medium text-success">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-success/20">3</span>
                    <span>If unresponsive:</span>
                    <span className="text-muted-foreground">Call for help, activate emergency response, get AED</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-medium text-success">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-success/20">4</span>
                    <span>Check breathing and pulse (simultaneously, &lt;10 seconds)</span>
                  </div>
                  <div className="ml-8 p-2 rounded bg-background/50 space-y-2">
                    <div className="text-xs">
                      <strong className="text-destructive">If no breathing + no pulse:</strong>
                      <span className="text-muted-foreground"> Start CPR</span>
                    </div>
                    <div className="text-xs">
                      <strong className="text-warning">If gasping only (agonal):</strong>
                      <span className="text-muted-foreground"> Start CPR</span>
                    </div>
                    <div className="text-xs">
                      <strong className="text-success">If normal breathing + pulse:</strong>
                      <span className="text-muted-foreground"> Monitor, recovery position if needed</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <div className="p-2 rounded bg-background/50 border border-success/20">
                      <div className="text-xs font-medium text-success mb-1">CPR Quality</div>
                      <ul className="text-xs text-muted-foreground space-y-0.5">
                        <li>• Rate: 100-120/min</li>
                        <li>• Depth: 2-2.4 inches (5-6 cm)</li>
                        <li>• Allow full chest recoil</li>
                        <li>• Minimize interruptions (&lt;10 seconds)</li>
                        <li>• Ratio: 30:2 (compression:breath)</li>
                      </ul>
                    </div>
                    <div className="p-2 rounded bg-background/50 border border-success/20">
                      <div className="text-xs font-medium text-success mb-1">AED Use</div>
                      <ul className="text-xs text-muted-foreground space-y-0.5">
                        <li>• Power on immediately</li>
                        <li>• Attach pads as shown</li>
                        <li>• Clear during analysis</li>
                        <li>• Deliver shock if advised</li>
                        <li>• Resume CPR immediately after shock</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* ACLS Cardiac Arrest */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-primary">ACLS Cardiac Arrest Algorithm</h4>
                <div className="p-3 rounded-lg bg-destructive/5 border border-destructive/20 space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2 rounded bg-background/50 border border-destructive/10">
                      <div className="text-xs font-bold text-destructive mb-1">VF/pVT (Shockable)</div>
                      <div className="text-xs space-y-1">
                        <div className="font-medium">Shock → CPR 2 min → Rhythm check</div>
                        <ul className="text-muted-foreground space-y-0.5 ml-2">
                          <li>• Epinephrine 1 mg IV/IO q 3-5 min</li>
                          <li>• Amiodarone 300 mg IV/IO after 2nd shock</li>
                          <li>• Consider amiodarone 150 mg after 3rd shock</li>
                          <li>• Continue until ROSC or termination</li>
                        </ul>
                      </div>
                    </div>
                    <div className="p-2 rounded bg-background/50 border border-destructive/10">
                      <div className="text-xs font-bold text-destructive mb-1">Asystole/PEA (Non-Shockable)</div>
                      <div className="text-xs space-y-1">
                        <div className="font-medium">CPR → Epinephrine → Rhythm check</div>
                        <ul className="text-muted-foreground space-y-0.5 ml-2">
                          <li>• Epinephrine 1 mg IV/IO ASAP</li>
                          <li>• Repeat epinephrine q 3-5 min</li>
                          <li>• Search for reversible causes (H's & T's)</li>
                          <li>• Continue high-quality CPR</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                  <div className="p-2 rounded bg-background/50 border border-destructive/10">
                    <div className="text-xs font-medium text-destructive mb-1">Reversible Causes (H's &amp; T's)</div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <div className="font-medium text-muted-foreground">H's:</div>
                        <ul className="text-muted-foreground">
                          <li>• Hypovolemia</li>
                          <li>• Hypoxia</li>
                          <li>• Hydrogen ion (acidosis)</li>
                          <li>• Hypo-/Hyperkalemia</li>
                          <li>• Hypothermia</li>
                        </ul>
                      </div>
                      <div>
                        <div className="font-medium text-muted-foreground">T's:</div>
                        <ul className="text-muted-foreground">
                          <li>• Tension pneumothorax</li>
                          <li>• Tamponade (cardiac)</li>
                          <li>• Toxins (drug OD)</li>
                          <li>• Thrombosis (pulmonary)</li>
                          <li>• Thrombosis (coronary)</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bradycardia Algorithm */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-primary">Bradycardia Algorithm</h4>
                <div className="p-3 rounded-lg bg-warning/5 border border-warning/20 space-y-2">
                  <div className="text-xs">
                    <strong>Assess:</strong> HR &lt;60 bpm with symptoms?
                  </div>
                  <div className="text-xs space-y-1">
                    <div className="font-medium">Symptoms of poor perfusion:</div>
                    <ul className="text-muted-foreground ml-2">
                      <li>• Hypotension (SBP &lt;90)</li>
                      <li>• Altered mental status</li>
                      <li>• Shock signs</li>
                      <li>• Chest pain, dyspnea</li>
                    </ul>
                  </div>
                  <div className="p-2 rounded bg-background/50 mt-2">
                    <div className="text-xs font-medium text-warning mb-1">If symptomatic:</div>
                    <ol className="text-xs space-y-1">
                      <li>1. <strong>Atropine 0.5 mg IV</strong> (may repeat, max 3 mg)</li>
                      <li>2. If atropine ineffective → <strong>Dopamine</strong> (2-20 mcg/kg/min) or <strong>Epinephrine</strong> (2-10 mcg/min)</li>
                      <li>3. Prepare for <strong>transcutaneous pacing</strong></li>
                      <li>4. Consider <strong>transvenous pacing</strong></li>
                      <li>5. Consult cardiology for <strong>permanent pacemaker</strong></li>
                    </ol>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    <strong>Note:</strong> Atropine may be ineffective in Mobitz II or complete heart block
                  </div>
                </div>
              </div>

              {/* Tachycardia Algorithm */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-primary">Tachycardia Algorithm</h4>
                <div className="p-3 rounded-lg bg-warning/5 border border-warning/20 space-y-2">
                  <div className="text-xs">
                    <strong>Assess:</strong> HR &gt;150 bpm, stable vs unstable
                  </div>
                  <div className="p-2 rounded bg-destructive/10 border border-destructive/20">
                    <div className="text-xs font-bold text-destructive mb-1">Unstable (immediate synchronized cardioversion)</div>
                    <ul className="text-xs text-muted-foreground">
                      <li>• Hypotension (SBP &lt;90)</li>
                      <li>• Altered mental status</li>
                      <li>• Shock signs</li>
                      <li>• Chest pain, dyspnea</li>
                    </ul>
                    <div className="text-xs mt-1">
                      <strong>Energy:</strong> Narrow: 50-100J → 200J; Wide: 100J → 200J
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <div className="p-2 rounded bg-background/50 border border-warning/10">
                      <div className="text-xs font-medium text-warning mb-1">Narrow QRS (&lt;120ms)</div>
                      <ul className="text-xs text-muted-foreground space-y-0.5">
                        <li>• Regular: Vagal → Adenosine 6mg → 12mg</li>
                        <li>• Irregular (AF): Rate control (β-blocker, CCB)</li>
                        <li>• If unstable: Cardiovert</li>
                      </ul>
                    </div>
                    <div className="p-2 rounded bg-background/50 border border-warning/10">
                      <div className="text-xs font-medium text-warning mb-1">Wide QRS (&gt;120ms)</div>
                      <ul className="text-xs text-muted-foreground space-y-0.5">
                        <li>• Regular: Consider adenosine (diagnostic)</li>
                        <li>• VT: Amiodarone 150mg IV</li>
                        <li>• If unstable: Cardiovert 100J</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* ROSC */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-success">Post-ROSC (Return of Spontaneous Circulation)</h4>
                <div className="p-3 rounded-lg bg-success/5 border border-success/20 space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2 rounded bg-background/50">
                      <div className="text-xs font-medium text-success mb-1">Immediate</div>
                      <ul className="text-xs text-muted-foreground space-y-0.5">
                        <li>• Airway management</li>
                        <li>• Oxygen (SpO2 94-98%)</li>
                        <li>• IV access</li>
                        <li>• 12-lead ECG</li>
                        <li>• Consider coronary angiography</li>
                      </ul>
                    </div>
                    <div className="p-2 rounded bg-background/50">
                      <div className="text-xs font-medium text-success mb-1">Hemodynamic Support</div>
                      <ul className="text-xs text-muted-foreground space-y-0.5">
                        <li>• Fluid bolus for hypotension</li>
                        <li>• Vasopressors if needed</li>
                        <li>• Treat reversible causes</li>
                      </ul>
                    </div>
                  </div>
                  <div className="p-2 rounded bg-background/50 border border-success/20">
                    <div className="text-xs font-medium text-success mb-1">TTM (Targeted Temperature Management)</div>
                    <ul className="text-xs text-muted-foreground">
                      <li>• Consider if comatose after ROSC</li>
                      <li>• Target 32-36°C for 24 hours</li>
                      <li>• Avoid fever for 72 hours</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Drug Doses */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-primary">Quick Drug Reference</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                  <div className="p-2 rounded bg-muted/30 border border-border/30">
                    <div className="font-medium">Epinephrine</div>
                    <div className="text-muted-foreground">1 mg IV/IO q 3-5 min</div>
                  </div>
                  <div className="p-2 rounded bg-muted/30 border border-border/30">
                    <div className="font-medium">Amiodarone</div>
                    <div className="text-muted-foreground">300 mg → 150 mg IV/IO</div>
                  </div>
                  <div className="p-2 rounded bg-muted/30 border border-border/30">
                    <div className="font-medium">Atropine</div>
                    <div className="text-muted-foreground">0.5 mg IV (max 3 mg)</div>
                  </div>
                  <div className="p-2 rounded bg-muted/30 border border-border/30">
                    <div className="font-medium">Adenosine</div>
                    <div className="text-muted-foreground">6 mg → 12 mg rapid IV push</div>
                  </div>
                  <div className="p-2 rounded bg-muted/30 border border-border/30">
                    <div className="font-medium">Magnesium</div>
                    <div className="text-muted-foreground">1-2 g IV for TdP</div>
                  </div>
                  <div className="p-2 rounded bg-muted/30 border border-border/30">
                    <div className="font-medium">Calcium Chloride</div>
                    <div className="text-muted-foreground">1 g IV for hyperkalemia</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>
      {/* Interactive Calculator Selector Wizard */}
      <Card className="border-border/40 bg-primary/5">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Filter className="w-4 h-4 text-primary" />
            Interactive Tool Selector
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">1. What is the surgery type?</Label>
              <div className="flex flex-wrap gap-2">
                {[
                  { id: 'non-cardiac', label: 'Non-cardiac' },
                  { id: 'cardiac', label: 'Cardiac' },
                  { id: 'neuro', label: 'Neurosurgery' },
                  { id: 'emergency', label: 'Emergency' }
                ].map((type) => (
                  <button
                    key={type.id}
                    onClick={() => {
                      const el = document.getElementById(
                        type.id === 'cardiac' ? 'sts-score' : 
                        type.id === 'neuro' ? 'csdh-risk' : 
                        'rcri'
                      );
                      el?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="text-[10px] px-2.5 py-1.5 rounded-md bg-background border border-border hover:border-primary hover:bg-primary/5 transition-all font-medium"
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">2. What is the clinical focus?</Label>
              <div className="flex flex-wrap gap-2">
                {[
                  { id: 'airway', label: 'Airway / OSA', target: 'mallampati' },
                  { id: 'vte', label: 'VTE / Clotting', target: 'caprini' },
                  { id: 'frailty', label: 'Frailty / General', target: 'asa' },
                  { id: 'meds', label: 'Medication Management', target: 'med-management' }
                ].map((focus) => (
                  <button
                    key={focus.id}
                    onClick={() => {
                      const el = document.getElementById(focus.target);
                      el?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="text-[10px] px-2.5 py-1.5 rounded-md bg-background border border-border hover:border-primary hover:bg-primary/5 transition-all font-medium"
                  >
                    {focus.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground italic border-t border-border/40 pt-2">
            Click a button to jump to the best-matched calculator for your scenario.
          </p>
        </CardContent>
      </Card>

      {/* Expand All / Collapse All */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex gap-2">
          <button
            onClick={() => setExpandedCats(new Set(["history", "examination", "ecg", "vitals", "lab", "age"]))}
            className="text-xs px-3 py-1.5 rounded-lg bg-muted/50 hover:bg-muted"
          >
            Expand All
          </button>
          <button
            onClick={() => setExpandedCats(new Set())}
            className="text-xs px-3 py-1.5 rounded-lg bg-muted/50 hover:bg-muted"
          >
            Collapse All
          </button>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => {
            const note = `GOLDMAN CARDIAC RISK INDEX\nDate: ${new Date().toLocaleString()}\n\nSelected Factors:\n${result.activeFactors.length === 0 ? "- None" : result.activeFactors.map(f => `- ${f.factor} (+${f.points})`).join("\n")}\n\nSummary:\n- Total Points: ${result.totalPoints}\n- Risk Class: ${result.riskClass}\n- Observed Risk (Mortality): ${result.observedRisk}`;
            copyToClipboard(note, "Goldman result copied");
          }}>
            <Copy className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => {
            const note = `GOLDMAN CARDIAC RISK INDEX\nDate: ${new Date().toLocaleString()}\n\nSelected Factors:\n${result.activeFactors.length === 0 ? "- None" : result.activeFactors.map(f => `- ${f.factor} (+${f.points})`).join("\n")}\n\nSummary:\n- Total Points: ${result.totalPoints}\n- Risk Class: ${result.riskClass}\n- Observed Risk (Mortality): ${result.observedRisk}`;
            downloadTextFile("Goldman_Result", note);
          }}>
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Risk factor categories */}
      {grouped.map(group => (
        <div key={group.key} className="clinical-card">
          <button onClick={() => toggleCat(group.key)} className="w-full flex items-center justify-between">
            <div className="flex items-center gap-2">
              <group.icon className={`w-4 h-4 ${group.points > 0 ? "text-warning" : "text-muted-foreground"}`} />
              <h3 className="section-title">{group.label}</h3>
              {group.activeCount > 0 && (
                <span className="text-xs bg-warning/10 text-warning px-2 py-0.5 rounded-full">
                  {group.activeCount} active · {group.points} pts
                </span>
              )}
            </div>
            {expandedCats.has(group.key) ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
          </button>

          {expandedCats.has(group.key) && (
            <div className="mt-3 space-y-2">
              {group.factors.map(factor => (
                <label key={factor.id} className={`flex items-start gap-3 p-2.5 rounded-lg transition-colors cursor-pointer ${
                  factor.active ? "bg-warning/5 border border-warning/20" : "hover:bg-muted/30"
                }`}>
                  <Switch
                    checked={factor.active}
                    onCheckedChange={() => toggleFactor(factor.id)}
                    className="mt-0.5 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{factor.factor}</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                        factor.points >= 7 ? "bg-destructive/10 text-destructive" :
                        factor.points >= 3 ? "bg-warning/10 text-warning" :
                        "bg-muted text-muted-foreground"
                      }`}>
                        +{factor.points}
                      </span>
                      <span className="text-xs px-1.5 py-0.5 rounded-full bg-muted/50 text-muted-foreground">
                        {factor.letter}
                      </span>
                    </div>
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>
      ))}

      {/* Clinical notes */}
      <Card className="border-border/40">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Heart className="w-4 h-4 text-muted-foreground" />
            Clinical Notes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="text-sm text-muted-foreground space-y-2">
            <li>• <strong>Original cohort:</strong> 1001 patients, non-cardiac surgery (1977)</li>
            <li>• <strong>Highest risk factors:</strong> S3/JVP (11 pts), recent MI (10 pts), arrhythmia (7 pts)</li>
            <li>• <strong>Limitations:</strong> Derived before modern perioperative management; may underestimate benefit of beta-blockade, statins</li>
            <li>• <strong>Alternatives:</strong> RCRI (Revised Cardiac Risk Index) for modern risk stratification</li>
          </ul>
        </CardContent>
      </Card>

      {/* JSON output */}
      <Card className="border-border/40 bg-muted/30">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-mono">Machine output</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="text-xs font-mono overflow-auto">
{JSON.stringify({
  model: "Goldman Cardiac Index (original)",
  total_points: result.totalPoints,
  selected_factor_count: result.activeFactors.length,
  selected_factors: result.activeFactors.map(f => ({
    id: f.id,
    letter: f.letter,
    factor: f.factor,
    points: f.points,
  })),
  risk_class: result.riskClass,
  score_range: result.totalPoints === 0 ? "0" : result.totalPoints <= 2 ? "1–2" : result.totalPoints <= 4 ? "3–4" : "5+",
  observed_risk: result.observedRisk,
}, null, 1)}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
};


export default PerioperativeCalculators;
