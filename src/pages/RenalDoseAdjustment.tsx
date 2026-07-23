import Seo from "@/components/Seo";
import { FrequencyBadge } from "@/components/FrequencyBadge";
import { useState, useEffect } from "react";
import { Pill, FlaskConical, Search, AlertTriangle, ChevronDown, Calculator, RotateCcw, ArrowLeftRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import KDIGOStagingCalculator from "@/calculators/renal/KDIGOStagingCalculator";
import { ADDITIONAL_MEDS_DATA } from "@/calculators/diabetes/additional-meds-data";
import { ANTIBIOTICS_DATA } from "@/calculators/diabetes/antibiotics-data";
import { ANTICOAGULANTS_DATA } from "@/calculators/diabetes/anticoagulants-data";

type DoseEntry = {
  drug: string;
  drugClass: string;
  frequency: string;
  normalDose: string;
  eGFR60_89: string;
  eGFR45_59: string;
  eGFR30_44: string;
  eGFR15_29: string;
  eGFRBelow15: string;
  notes: string;
};

const RENAL_DATA: DoseEntry[] = [
  {
    drug: "Metformin",
    drugClass: "Biguanide",
    frequency: "OD–BD",
    normalDose: "500–2000 mg/day",
    eGFR60_89: "No adjustment",
    eGFR45_59: "No adjustment",
    eGFR30_44: "Max 1000 mg/day",
    eGFR15_29: "Contraindicated",
    eGFRBelow15: "Contraindicated",
    notes: "Do not initiate if eGFR <30. Reassess if <45.",
  },
  {
    drug: "Empagliflozin",
    drugClass: "SGLT2 Inhibitor",
    frequency: "OD",
    normalDose: "10–25 mg/day",
    eGFR60_89: "No adjustment",
    eGFR45_59: "No adjustment",
    eGFR30_44: "No adjustment",
    eGFR15_29: "Do not initiate; may continue if already on",
    eGFRBelow15: "Contraindicated",
    notes: "CV/renal benefit persists at lower eGFR. Glycemic efficacy reduced below 45.",
  },
  {
    drug: "Dapagliflozin",
    drugClass: "SGLT2 Inhibitor",
    frequency: "OD",
    normalDose: "5–10 mg/day",
    eGFR60_89: "No adjustment",
    eGFR45_59: "No adjustment",
    eGFR30_44: "No adjustment",
    eGFR15_29: "Do not initiate; may continue if already on",
    eGFRBelow15: "Contraindicated",
    notes: "Approved for CKD and HF benefit regardless of diabetes.",
  },
  {
    drug: "Canagliflozin",
    drugClass: "SGLT2 Inhibitor",
    frequency: "OD",
    normalDose: "100–300 mg/day",
    eGFR60_89: "No adjustment",
    eGFR45_59: "Max 100 mg/day",
    eGFR30_44: "Max 100 mg/day",
    eGFR15_29: "Contraindicated",
    eGFRBelow15: "Contraindicated",
    notes: "Monitor for amputation risk in peripheral vascular disease.",
  },
  {
    drug: "Semaglutide (oral)",
    drugClass: "GLP-1 RA",
    frequency: "OD",
    normalDose: "3–14 mg/day",
    eGFR60_89: "No adjustment",
    eGFR45_59: "No adjustment",
    eGFR30_44: "No adjustment",
    eGFR15_29: "Use with caution",
    eGFRBelow15: "Limited data",
    notes: "GI side effects may worsen dehydration in CKD.",
  },
  {
    drug: "Semaglutide (SC)",
    drugClass: "GLP-1 RA",
    frequency: "Weekly",
    normalDose: "0.25–2 mg/week",
    eGFR60_89: "No adjustment",
    eGFR45_59: "No adjustment",
    eGFR30_44: "No adjustment",
    eGFR15_29: "Use with caution",
    eGFRBelow15: "Limited data",
    notes: "Proven CV benefit (SUSTAIN-6, SELECT).",
  },
  {
    drug: "Liraglutide",
    drugClass: "GLP-1 RA",
    frequency: "OD",
    normalDose: "0.6–1.8 mg/day",
    eGFR60_89: "No adjustment",
    eGFR45_59: "No adjustment",
    eGFR30_44: "No adjustment",
    eGFR15_29: "Use with caution",
    eGFRBelow15: "Limited data",
    notes: "CV benefit proven (LEADER trial).",
  },
  {
    drug: "Dulaglutide",
    drugClass: "GLP-1 RA",
    frequency: "Weekly",
    normalDose: "0.75–4.5 mg/week",
    eGFR60_89: "No adjustment",
    eGFR45_59: "No adjustment",
    eGFR30_44: "No adjustment",
    eGFR15_29: "Use with caution",
    eGFRBelow15: "Limited data",
    notes: "Renal composite benefit shown in REWIND.",
  },
  {
    drug: "Tirzepatide",
    drugClass: "GIP/GLP-1 RA",
    frequency: "Weekly",
    normalDose: "2.5–15 mg/week",
    eGFR60_89: "No adjustment",
    eGFR45_59: "No adjustment",
    eGFR30_44: "No adjustment",
    eGFR15_29: "Use with caution",
    eGFRBelow15: "Limited data",
    notes: "Superior HbA1c and weight reduction (SURPASS trials).",
  },
  {
    drug: "Sitagliptin",
    drugClass: "DPP-4 Inhibitor",
    frequency: "OD",
    normalDose: "100 mg/day",
    eGFR60_89: "No adjustment",
    eGFR45_59: "50 mg/day",
    eGFR30_44: "50 mg/day",
    eGFR15_29: "25 mg/day",
    eGFRBelow15: "25 mg/day",
    notes: "Can be used across all stages of CKD with dose adjustment.",
  },
  {
    drug: "Saxagliptin",
    drugClass: "DPP-4 Inhibitor",
    frequency: "OD",
    normalDose: "5 mg/day",
    eGFR60_89: "No adjustment",
    eGFR45_59: "2.5 mg/day",
    eGFR30_44: "2.5 mg/day",
    eGFR15_29: "2.5 mg/day",
    eGFRBelow15: "2.5 mg/day",
    notes: "Caution: associated with HF hospitalization (SAVOR-TIMI 53).",
  },
  {
    drug: "Linagliptin",
    drugClass: "DPP-4 Inhibitor",
    frequency: "OD",
    normalDose: "5 mg/day",
    eGFR60_89: "No adjustment",
    eGFR45_59: "No adjustment",
    eGFR30_44: "No adjustment",
    eGFR15_29: "No adjustment",
    eGFRBelow15: "No adjustment",
    notes: "No renal dose adjustment needed — hepatic elimination.",
  },
  {
    drug: "Vildagliptin",
    drugClass: "DPP-4 Inhibitor",
    frequency: "OD–BID",
    normalDose: "50 mg BID",
    eGFR60_89: "No adjustment",
    eGFR45_59: "50 mg OD",
    eGFR30_44: "50 mg OD",
    eGFR15_29: "50 mg OD",
    eGFRBelow15: "50 mg OD",
    notes: "Widely used in India. Monitor LFTs.",
  },
  {
    drug: "Pioglitazone",
    drugClass: "Thiazolidinedione",
    frequency: "OD",
    normalDose: "15–45 mg/day",
    eGFR60_89: "No adjustment",
    eGFR45_59: "No adjustment",
    eGFR30_44: "No adjustment",
    eGFR15_29: "No adjustment",
    eGFRBelow15: "No adjustment",
    notes: "Avoid in HF (NYHA III–IV). Risk of fluid retention.",
  },
  {
    drug: "Glimepiride",
    drugClass: "Sulfonylurea",
    frequency: "OD",
    normalDose: "1–4 mg/day",
    eGFR60_89: "No adjustment",
    eGFR45_59: "Start at 1 mg",
    eGFR30_44: "Start at 1 mg",
    eGFR15_29: "Avoid",
    eGFRBelow15: "Avoid",
    notes: "High hypo risk in CKD — active metabolites accumulate.",
  },
  {
    drug: "Gliclazide",
    drugClass: "Sulfonylurea",
    frequency: "OD–BD",
    normalDose: "40–320 mg/day",
    eGFR60_89: "No adjustment",
    eGFR45_59: "No adjustment",
    eGFR30_44: "Use with caution",
    eGFR15_29: "Avoid",
    eGFRBelow15: "Avoid",
    notes: "Preferred SU in CKD (hepatic metabolism). Still carries hypo risk.",
  },
  {
    drug: "Glipizide",
    drugClass: "Sulfonylurea",
    frequency: "OD",
    normalDose: "2.5–20 mg/day",
    eGFR60_89: "No adjustment",
    eGFR45_59: "No adjustment",
    eGFR30_44: "Start low",
    eGFR15_29: "Avoid",
    eGFRBelow15: "Avoid",
    notes: "Short-acting, hepatic metabolism. Preferred SU if CKD stage 3.",
  },
  {
    drug: "Insulin Glargine",
    drugClass: "Basal Insulin",
    frequency: "OD (bedtime)",
    normalDose: "Individualized",
    eGFR60_89: "No adjustment",
    eGFR45_59: "No adjustment",
    eGFR30_44: "Reduce dose 25%",
    eGFR15_29: "Reduce dose 50%",
    eGFRBelow15: "Reduce dose 50%+",
    notes: "Insulin clearance is reduced in CKD — high hypo risk.",
  },
  {
    drug: "Insulin Degludec",
    drugClass: "Basal Insulin",
    frequency: "OD",
    normalDose: "Individualized",
    eGFR60_89: "No adjustment",
    eGFR45_59: "No adjustment",
    eGFR30_44: "Reduce dose 25%",
    eGFR15_29: "Reduce dose 50%",
    eGFRBelow15: "Reduce dose 50%+",
    notes: "Ultra-long acting — lower hypo risk vs glargine in CKD.",
  },
  {
    drug: "Finerenone",
    drugClass: "MRA (non-steroidal)",
    frequency: "OD",
    normalDose: "10–20 mg/day",
    eGFR60_89: "20 mg/day",
    eGFR45_59: "20 mg/day",
    eGFR30_44: "10 mg/day",
    eGFR15_29: "10 mg/day",
    eGFRBelow15: "Avoid",
    notes: "Indicated for CKD + T2DM. Monitor K+ closely. Do not start if K >5.0.",
  },

  // ═══════ Calcium Channel Blockers ═══════
  {
    drug: "Cilnidipine",
    drugClass: "Calcium Channel Blocker (N/L-type)",
    frequency: "OD",
    normalDose: "5–20 mg/day",
    eGFR60_89: "No adjustment",
    eGFR45_59: "No adjustment",
    eGFR30_44: "No adjustment",
    eGFR15_29: "Use with caution",
    eGFRBelow15: "Limited data",
    notes: "Dual L/N-type CCB — reduces sympathetic overactivity. Hepatic metabolism (CYP3A4). Minimal renal excretion. Preferred CCB in CKD with proteinuria due to N-type blockade. Monitor edema.",
  },

  // ═══════ Beta Blockers ═══════
  {
    drug: "Nebivolol",
    drugClass: "Beta Blocker (vasodilating)",
    frequency: "OD",
    normalDose: "2.5–10 mg/day",
    eGFR60_89: "No adjustment",
    eGFR45_59: "No adjustment",
    eGFR30_44: "Start at 2.5 mg",
    eGFR15_29: "Start at 2.5 mg",
    eGFRBelow15: "Limited data",
    notes: "3rd-gen β₁-selective blocker with NO-mediated vasodilation. Hepatic metabolism (CYP2D6). Active metabolites accumulate in CKD — start low. Reduces oxidative stress and improves endothelial function. Preferred β-blocker in CKD with metabolic syndrome.",
  },

  // ═══════ Antibiotics — Cephalosporins ═══════
  {
    drug: "Cephalexin",
    drugClass: "Cephalosporin (1st gen)",
    frequency: "Q6h",
    normalDose: "250–500 mg Q6h",
    eGFR60_89: "No adjustment",
    eGFR45_59: "No adjustment",
    eGFR30_44: "500 mg Q6–8h",
    eGFR15_29: "500 mg Q8–12h",
    eGFRBelow15: "500 mg Q12h",
    notes: "Primarily renal excretion. Reduce dose in severe impairment.",
  },
  {
    drug: "Cefuroxime",
    drugClass: "Cephalosporin (2nd gen)",
    frequency: "BID",
    normalDose: "250–500 mg BID",
    eGFR60_89: "No adjustment",
    eGFR45_59: "No adjustment",
    eGFR30_44: "Standard dose, interval q12h",
    eGFR15_29: "250–500 mg Q24h",
    eGFRBelow15: "250–500 mg Q24h",
    notes: "Renal elimination. Interval doubling in advanced CKD.",
  },
  {
    drug: "Cefixime",
    drugClass: "Cephalosporin (3rd gen)",
    frequency: "OD/BID",
    normalDose: "200–400 mg OD/BID",
    eGFR60_89: "No adjustment",
    eGFR45_59: "No adjustment",
    eGFR30_44: "No adjustment",
    eGFR15_29: "Max 200 mg OD",
    eGFRBelow15: "Max 200 mg OD",
    notes: "Dual excretion (hepatic + renal). Less adjustment needed vs other cephalosporins.",
  },
  {
    drug: "Ceftriaxone",
    drugClass: "Cephalosporin (3rd gen)",
    frequency: "OD/BID",
    normalDose: "1–2 g OD/BID",
    eGFR60_89: "No adjustment",
    eGFR45_59: "No adjustment",
    eGFR30_44: "No adjustment",
    eGFR15_29: "No adjustment",
    eGFRBelow15: "No adjustment (max 2 g/day)",
    notes: "Biliary excretion — no dose adjustment needed in renal impairment. Preferred cephalosporin in CKD.",
  },
  {
    drug: "Cefotaxime",
    drugClass: "Cephalosporin (3rd gen)",
    frequency: "Q8h",
    normalDose: "1–2 g Q8h",
    eGFR60_89: "No adjustment",
    eGFR45_59: "No adjustment",
    eGFR30_44: "1–2 g Q8–12h",
    eGFR15_29: "1–2 g Q12h",
    eGFRBelow15: "1 g Q12–24h",
    notes: "Hepatic metabolism with active metabolite partially renally cleared.",
  },
  {
    drug: "Ceftazidime",
    drugClass: "Cephalosporin (3rd gen)",
    frequency: "Q8h",
    normalDose: "1–2 g Q8h",
    eGFR60_89: "No adjustment",
    eGFR45_59: "No adjustment",
    eGFR30_44: "1–2 g Q12h",
    eGFR15_29: "1–2 g Q24h",
    eGFRBelow15: "500 mg Q24h",
    notes: "Pure renal elimination — significant accumulation in CKD. Good anti-pseudomonal coverage.",
  },
  {
    drug: "Cefepime",
    drugClass: "Cephalosporin (4th gen)",
    frequency: "Q8–12h",
    normalDose: "1–2 g Q8–12h",
    eGFR60_89: "No adjustment",
    eGFR45_59: "No adjustment",
    eGFR30_44: "1–2 g Q12h",
    eGFR15_29: "1–2 g Q24h",
    eGFRBelow15: "500 mg–1 g Q24h",
    notes: "Risk of neurotoxicity (seizures) if not dose-reduced in CKD. Monitor closely.",
  },
  // ═══════ Other Key Antibiotics ═══════
  {
    drug: "Amoxicillin",
    drugClass: "Penicillin",
    frequency: "Q8h",
    normalDose: "250–500 mg Q8h",
    eGFR60_89: "No adjustment",
    eGFR45_59: "No adjustment",
    eGFR30_44: "No adjustment",
    eGFR15_29: "500 mg Q12h",
    eGFRBelow15: "500 mg Q24h",
    notes: "Renal elimination. Risk of seizure at high doses in CKD.",
  },
  {
    drug: "Amoxicillin-Clavulanate",
    drugClass: "Penicillin + β-lactamase inh.",
    frequency: "BID–TID",
    normalDose: "625 mg TID / 1 g BID",
    eGFR60_89: "No adjustment",
    eGFR45_59: "No adjustment",
    eGFR30_44: "625 mg Q12h",
    eGFR15_29: "625 mg Q24h",
    eGFRBelow15: "625 mg Q24h",
    notes: "Clavulanate accumulates in CKD. Can cause diarrhea and hepatic issues.",
  },
  {
    drug: "Piperacillin-Tazobactam",
    drugClass: "Penicillin + β-lactamase inh.",
    frequency: "Q6h",
    normalDose: "4.5 g Q6h",
    eGFR60_89: "4.5 g Q6h",
    eGFR45_59: "4.5 g Q6h",
    eGFR30_44: "4.5 g Q8h",
    eGFR15_29: "4.5 g Q12h",
    eGFRBelow15: "4.5 g Q12h",
    notes: "Extends interval in CKD. Covers pseudomonas, anaerobes. Neurotoxicity risk at high doses.",
  },
  {
    drug: "Ciprofloxacin",
    drugClass: "Fluoroquinolone",
    frequency: "BID",
    normalDose: "250–750 mg BID",
    eGFR60_89: "No adjustment",
    eGFR45_59: "No adjustment",
    eGFR30_44: "50–75% of standard dose",
    eGFR15_29: "50% of standard dose",
    eGFRBelow15: "50% of standard dose",
    notes: "Renal + hepatic elimination. Reduce dose in advanced CKD. Tendon rupture risk.",
  },
  {
    drug: "Levofloxacin",
    drugClass: "Fluoroquinolone",
    frequency: "OD",
    normalDose: "250–750 mg OD",
    eGFR60_89: "No adjustment",
    eGFR45_59: "No adjustment",
    eGFR30_44: "750 mg Q48h or 500 mg OD",
    eGFR15_29: "750 mg loading then 500 mg Q48h",
    eGFRBelow15: "750 mg loading then 500 mg Q48h",
    notes: "Primarily renal excretion. Significant accumulation in CKD. Adjust accordingly.",
  },
  {
    drug: "Azithromycin",
    drugClass: "Macrolide",
    frequency: "OD",
    normalDose: "250–500 mg OD",
    eGFR60_89: "No adjustment",
    eGFR45_59: "No adjustment",
    eGFR30_44: "No adjustment",
    eGFR15_29: "No adjustment",
    eGFRBelow15: "No adjustment",
    notes: "Biliary/fecal excretion — no renal adjustment needed. Preferred macrolide in CKD.",
  },
  {
    drug: "Vancomycin",
    drugClass: "Glycopeptide",
    frequency: "Q8–12h",
    normalDose: "15–20 mg/kg Q8–12h",
    eGFR60_89: "15–20 mg/kg Q12h",
    eGFR45_59: "15–20 mg/kg Q12–24h",
    eGFR30_44: "15–20 mg/kg Q24–48h",
    eGFR15_29: "15–20 mg/kg Q48–96h",
    eGFRBelow15: "TDM-guided; avoid if possible",
    notes: "Nephrotoxic + ototoxic. Trough monitoring mandatory. CRITICAL: dose by AUC/MIC.",
  },
  {
    drug: "Gentamicin",
    drugClass: "Aminoglycoside",
    frequency: "Q24h (extended interval)",
    normalDose: "5–7 mg/kg Q24h",
    eGFR60_89: "No adjustment",
    eGFR45_59: "5–7 mg/kg Q24h",
    eGFR30_44: "5–7 mg/kg Q36–48h",
    eGFR15_29: "5–7 mg/kg Q48–72h",
    eGFRBelow15: "5–7 mg/kg with TDM",
    notes: "Nephrotoxic + ototoxic. Avoid in CKD if alternatives available. Extended interval dosing preferred. Monitor levels.",
  },
  {
    drug: "Metronidazole",
    drugClass: "Nitroimidazole",
    frequency: "Q8h",
    normalDose: "400–500 mg Q8h",
    eGFR60_89: "No adjustment",
    eGFR45_59: "No adjustment",
    eGFR30_44: "No adjustment",
    eGFR15_29: "No adjustment",
    eGFRBelow15: "No adjustment (reduce dose in hepatic impairment)",
    notes: "Hepatic metabolism — no renal adjustment needed. Use with caution in liver disease.",
  },
  {
    drug: "Clindamycin",
    drugClass: "Lincosamide",
    frequency: "Q6–8h",
    normalDose: "300–600 mg Q6–8h",
    eGFR60_89: "No adjustment",
    eGFR45_59: "No adjustment",
    eGFR30_44: "No adjustment",
    eGFR15_29: "No adjustment",
    eGFRBelow15: "No adjustment",
    notes: "Hepatic metabolism with biliary excretion. Safe in CKD. Risk of C. difficile colitis.",
  },
  {
    drug: "Doxycycline",
    drugClass: "Tetracycline",
    frequency: "BID",
    normalDose: "100 mg BID",
    eGFR60_89: "No adjustment",
    eGFR45_59: "No adjustment",
    eGFR30_44: "No adjustment",
    eGFR15_29: "No adjustment",
    eGFRBelow15: "No adjustment",
    notes: "GI excretion — safe in CKD. Avoid tetracycline (not doxycycline) in CKD as it accumulates.",
  },
  {
    drug: "Linezolid",
    drugClass: "Oxazolidinone",
    frequency: "BID",
    normalDose: "600 mg BID",
    eGFR60_89: "No adjustment",
    eGFR45_59: "No adjustment",
    eGFR30_44: "No adjustment",
    eGFR15_29: "No adjustment",
    eGFRBelow15: "No adjustment",
    notes: "Excellent bioavailability. No renal dose adjustment. Monitor for thrombocytopenia (myelosuppression).",
  },
  {
    drug: "Nitrofurantoin",
    drugClass: "Nitrofuran",
    frequency: "Q6h",
    normalDose: "100 mg Q6h (UTI)",
    eGFR60_89: "No adjustment",
    eGFR45_59: "No adjustment",
    eGFR30_44: "Avoid",
    eGFR15_29: "Contraindicated",
    eGFRBelow15: "Contraindicated",
    notes: "Accumulates in CKD → peripheral neuropathy, pulmonary fibrosis. Contraindicated if eGFR <30.",
  },
  {
    drug: "Trimethoprim-Sulfamethoxazole",
    drugClass: "Sulfonamide combo",
    frequency: "BID (DS tabs)",
    normalDose: "800/160 mg BID (DS)",
    eGFR60_89: "No adjustment",
    eGFR45_59: "No adjustment",
    eGFR30_44: "400/80 mg Q12h (SS)",
    eGFR15_29: "400/80 mg Q24h",
    eGFRBelow15: "Avoid unless dialysis",
    notes: "Both components renally excreted. Reduces Cr secretion → false Cr rise. K+ elevation. Avoid in G6PD.",
  },

  // ═══════ Anticoagulants — NOACs / DOACs ═══════
  {
    drug: "Apixaban",
    drugClass: "NOAC (Factor Xa inhibitor)",
    frequency: "BID",
    normalDose: "5 mg BID (AF); 10 mg BID ×7d then 5 mg BID (VTE)",
    eGFR60_89: "No adjustment",
    eGFR45_59: "No adjustment",
    eGFR30_44: "No adjustment (5 mg BID); 2.5 mg BID if ≥2 of: age ≥80, wt ≤60 kg, Cr ≥1.5",
    eGFR15_29: "2.5 mg BID (AF)",
    eGFRBelow15: "Use with caution / avoid; limited data, may use 2.5 mg BID in HD per US label",
    notes: "~27% renal excretion. Preferred NOAC in advanced CKD. Avoid with strong dual CYP3A4/P-gp inhibitors or inducers.",
  },
  {
    drug: "Rivaroxaban",
    drugClass: "NOAC (Factor Xa inhibitor)",
    frequency: "OD",
    normalDose: "20 mg OD (AF, with food); 15 mg BID ×21d then 20 mg OD (VTE)",
    eGFR60_89: "No adjustment",
    eGFR45_59: "15 mg OD (AF)",
    eGFR30_44: "15 mg OD (AF)",
    eGFR15_29: "15 mg OD (AF) — use with caution",
    eGFRBelow15: "Avoid",
    notes: "~33% active renal excretion. Take with evening meal for 15/20 mg doses. Avoid in CrCl <15.",
  },
  {
    drug: "Edoxaban",
    drugClass: "NOAC (Factor Xa inhibitor)",
    frequency: "OD",
    normalDose: "60 mg OD",
    eGFR60_89: "60 mg OD",
    eGFR45_59: "30 mg OD",
    eGFR30_44: "30 mg OD",
    eGFR15_29: "30 mg OD",
    eGFRBelow15: "Avoid",
    notes: "Do NOT use if CrCl >95 mL/min (reduced efficacy in AF). Reduce to 30 mg if CrCl 15–50, wt ≤60 kg, or with P-gp inhibitors.",
  },
  {
    drug: "Dabigatran",
    drugClass: "NOAC (Direct thrombin inhibitor)",
    frequency: "BID",
    normalDose: "150 mg BID (AF)",
    eGFR60_89: "150 mg BID",
    eGFR45_59: "150 mg BID",
    eGFR30_44: "150 mg BID (consider 110 mg BID if high bleeding risk; 75 mg BID per US label if CrCl 15–30)",
    eGFR15_29: "75 mg BID (US) / Avoid (EU)",
    eGFRBelow15: "Contraindicated",
    notes: "~80% renal excretion — most renally cleared NOAC. Avoid with P-gp inhibitors in CKD. Reversal: idarucizumab.",
  },

  // ═══════ Vitamin K Antagonists ═══════
  {
    drug: "Warfarin",
    drugClass: "Vitamin K antagonist",
    frequency: "OD (INR-guided)",
    normalDose: "2–10 mg/day, INR-guided (target 2–3)",
    eGFR60_89: "No adjustment",
    eGFR45_59: "No adjustment",
    eGFR30_44: "No dose adjustment; monitor INR closely",
    eGFR15_29: "No dose adjustment; ↑ bleeding risk — monitor INR",
    eGFRBelow15: "No dose adjustment; high bleeding risk, calciphylaxis risk",
    notes: "Hepatic metabolism. CKD increases bleeding and over-anticoagulation risk. Often preferred over NOACs in eGFR <15 / dialysis.",
  },
  {
    drug: "Acenocoumarol",
    drugClass: "Vitamin K antagonist",
    frequency: "OD (INR-guided)",
    normalDose: "1–8 mg/day, INR-guided",
    eGFR60_89: "No adjustment",
    eGFR45_59: "No adjustment",
    eGFR30_44: "No adjustment; monitor INR",
    eGFR15_29: "No adjustment; ↑ bleeding risk",
    eGFRBelow15: "No adjustment; close INR monitoring",
    notes: "Shorter half-life than warfarin. Same INR target. Bleeding risk rises with declining eGFR.",
  },

  // ═══════ Unfractionated Heparin & LMWH ═══════
  {
    drug: "Unfractionated Heparin (UFH)",
    drugClass: "Heparin (parenteral)",
    frequency: "IV infusion (aPTT-guided)",
    normalDose: "80 U/kg bolus then 18 U/kg/h IV (VTE/ACS), aPTT-guided",
    eGFR60_89: "No adjustment",
    eGFR45_59: "No adjustment",
    eGFR30_44: "No adjustment — aPTT/anti-Xa guided",
    eGFR15_29: "No adjustment — preferred over LMWH; aPTT monitoring",
    eGFRBelow15: "No adjustment — preferred parenteral anticoagulant in severe CKD/HD",
    notes: "Reticuloendothelial clearance — not renally eliminated. Preferred over LMWH if eGFR <30. Monitor aPTT 1.5–2.5× control or anti-Xa 0.3–0.7. HIT risk.",
  },
  {
    drug: "Enoxaparin",
    drugClass: "LMWH",
    frequency: "BID/OD",
    normalDose: "1 mg/kg SC Q12h (treatment) or 40 mg SC OD (prophylaxis)",
    eGFR60_89: "No adjustment",
    eGFR45_59: "No adjustment",
    eGFR30_44: "No adjustment; consider anti-Xa monitoring",
    eGFR15_29: "Treatment: 1 mg/kg SC Q24h; Prophylaxis: 30 mg SC OD",
    eGFRBelow15: "Avoid — use UFH instead",
    notes: "Renal accumulation → bleeding risk in CKD. Peak anti-Xa monitoring recommended in CKD, obesity, pregnancy.",
  },
  {
    drug: "Dalteparin",
    drugClass: "LMWH",
    frequency: "OD",
    normalDose: "200 IU/kg SC OD (VTE) or 100 IU/kg BID; 5000 IU OD (prophylaxis)",
    eGFR60_89: "No adjustment",
    eGFR45_59: "No adjustment",
    eGFR30_44: "No adjustment; anti-Xa monitoring advised",
    eGFR15_29: "Use with caution; anti-Xa monitoring",
    eGFRBelow15: "Avoid — use UFH",
    notes: "Less renal accumulation than enoxaparin; preferred LMWH in CKD when LMWH must be used. Still monitor anti-Xa.",
  },
  {
    drug: "Tinzaparin",
    drugClass: "LMWH",
    frequency: "OD",
    normalDose: "175 IU/kg SC OD",
    eGFR60_89: "No adjustment",
    eGFR45_59: "No adjustment",
    eGFR30_44: "No adjustment",
    eGFR15_29: "Use with caution; anti-Xa monitoring",
    eGFRBelow15: "Avoid",
    notes: "Less bioaccumulation in moderate CKD vs enoxaparin (IRIS trial cautioned in elderly CKD). Monitor anti-Xa.",
  },
  {
    drug: "Fondaparinux",
    drugClass: "Synthetic pentasaccharide (anti-Xa)",
    frequency: "OD",
    normalDose: "2.5 mg SC OD (prophylaxis); 5–10 mg SC OD (treatment, by weight)",
    eGFR60_89: "No adjustment",
    eGFR45_59: "No adjustment",
    eGFR30_44: "Use with caution; consider dose reduction",
    eGFR15_29: "Contraindicated (treatment); 1.5 mg OD if prophylaxis with caution",
    eGFRBelow15: "Contraindicated",
    notes: "Almost entirely renally cleared. No antidote. Avoid in CrCl <30 for treatment doses.",
  },
];

const eGFRColumns = [
  { key: "eGFR60_89" as const, label: "60–89" },
  { key: "eGFR45_59" as const, label: "45–59" },
  { key: "eGFR30_44" as const, label: "30–44" },
  { key: "eGFR15_29" as const, label: "15–29" },
  { key: "eGFRBelow15" as const, label: "<15" },
];

const cellStyle = (val: string) => {
  const v = val.toLowerCase();
  if (v.includes("contraindicated") || v === "avoid")
    return "bg-destructive/10 text-destructive font-medium";
  if (v.includes("caution") || v.includes("reduce") || v.includes("start low") || v.includes("start at") || v.includes("max") || v.includes("do not initiate"))
    return "bg-warning/10 text-warning font-medium";
  if (v.includes("limited"))
    return "bg-muted text-muted-foreground";
  return "";
};

/** Extract a concise frequency tag from a normalDose string like "5 mg BID (AF)" → "BID" */
function extractFreq(dose: string): string {
  const s = dose.toLowerCase();
  if (/\b(weekly|once\s*a?\s*week|every\s*week|week)\b/.test(s)) return "Weekly";
  if (/\b(monthly|month)\b/.test(s)) return "Monthly";
  if (/\b(qds|qid|four\s*times|q\s*6\s*h)\b/.test(s)) return "QID";
  if (/\b(tds|tid|three\s*times|thrice|q\s*8\s*h)\b/.test(s)) return "TDS";
  if (/\b(bd|bid|twice|two\s*times|q\s*12\s*h|b\.i\.d)\b/.test(s)) return "BD";
  if (/\b(od|once\s*daily|daily|day|every\s*(morning|evening|night|day)|q\s*24\s*h|o\.d|qd|bedtime)\b/.test(s)) return "OD";
  if (/\b(prn|as\s*needed)\b/.test(s)) return "PRN";
  if (/\b(iv|infusion|drip)\b/.test(s)) return "IV";
  // Handle "q6–8h" / "q12h" / "q6-8h" with optional range
  const qMatch = s.match(/q\s*(\d+)[–\-]?\d*\s*h/);
  if (qMatch) {
    const n = parseInt(qMatch[1], 10);
    if (n === 6) return "Q6H";
    if (n === 8) return "Q8H";
    if (n === 12) return "Q12H";
    if (n === 24) return "OD";
    return `Q${n}H`;
  }
  // Fallback: use the first short token if it looks like a freq
  const tokens = s.split(/[\s,/(]/);
  for (const t of tokens) {
    if (/^(od|bd|tds|qid|prn)$/i.test(t)) return t.toUpperCase();
  }
  return "—"; // unknown
}

/** Convert external DoseEntry (no frequency field) into page-local DoseEntry */
function wrapExternal(d: typeof ADDITIONAL_MEDS_DATA[number]): DoseEntry {
  return { ...d, frequency: extractFreq(d.normalDose) };
}

// Merge all data sources
const ALL_RENAL_DATA: DoseEntry[] = [
  ...RENAL_DATA,
  ...ADDITIONAL_MEDS_DATA.map(wrapExternal),
  ...ANTIBIOTICS_DATA.map(wrapExternal),
  ...ANTICOAGULANTS_DATA.map(wrapExternal),
];

// ── eGFR Calculator (CKD-EPI 2021) with optional UACR ──
function EgfrCalculator() {
  const [cr, setCr] = useState(() => { try { return localStorage.getItem("ncd_egfr_cr") || ""; } catch { return ""; } });
  const [crUnit, setCrUnit] = useState<"mgdl" | "umol">(() => { try { return (localStorage.getItem("ncd_egfr_cr_unit") as "mgdl" | "umol") || "mgdl"; } catch { return "mgdl"; } });
  const [age, setAge] = useState(() => { try { return localStorage.getItem("ncd_egfr_age") || ""; } catch { return ""; } });
  const [sex, setSex] = useState<"male" | "female" | null>(() => { try { return localStorage.getItem("ncd_egfr_sex") as "male" | "female" | null || null; } catch { return null; } });
  const [uacr, setUacr] = useState(() => { try { return localStorage.getItem("ncd_egfr_uacr") || ""; } catch { return ""; } });
  const [uacrUnit, setUacrUnit] = useState<"mg_g" | "mg_mmol">(() => { try { return (localStorage.getItem("ncd_egfr_uacr_unit") as "mg_g" | "mg_mmol") || "mg_g"; } catch { return "mg_g"; } });
  const [result, setResult] = useState<{ gfr: number; gStage: string; gLabel: string; aStage?: string; aLabel?: string; risk?: string; riskColor?: string } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => { localStorage.setItem("ncd_egfr_cr", cr); }, [cr]);
  useEffect(() => { localStorage.setItem("ncd_egfr_cr_unit", crUnit); }, [crUnit]);
  useEffect(() => { localStorage.setItem("ncd_egfr_age", age); }, [age]);
  useEffect(() => { if (sex) localStorage.setItem("ncd_egfr_sex", sex); }, [sex]);
  useEffect(() => { localStorage.setItem("ncd_egfr_uacr", uacr); }, [uacr]);
  useEffect(() => { localStorage.setItem("ncd_egfr_uacr_unit", uacrUnit); }, [uacrUnit]);

  const getCrMgdl = () => {
    const v = parseFloat(cr);
    return crUnit === "umol" ? v / 88.42 : v;
  };

  const getUacrMgG = () => {
    const v = parseFloat(uacr);
    return uacrUnit === "mg_mmol" ? v * 10 : v;
  };

  const calcCkdEpi = (creat: number, a: number, s: "male" | "female") => {
    const isF = s === "female";
    const k = isF ? 0.7 : 0.9;
    const al = isF ? -0.241 : -0.302;
    const sf = isF ? 1.012 : 1.0;
    const r = creat / k;
    return Math.round(142 * Math.pow(Math.min(r, 1), al) * Math.pow(Math.max(r, 1), -1.200) * Math.pow(0.9938, a) * sf * 10) / 10;
  };

  const getGStage = (g: number) => {
    if (g >= 90) return { stage: "G1", label: "Normal or High" };
    if (g >= 60) return { stage: "G2", label: "Mildly Decreased" };
    if (g >= 45) return { stage: "G3a", label: "Mild–Moderate Decrease" };
    if (g >= 30) return { stage: "G3b", label: "Moderate–Severe Decrease" };
    if (g >= 15) return { stage: "G4", label: "Severely Decreased" };
    return { stage: "G5", label: "Kidney Failure" };
  };

  const getAStage = (u: number) => {
    if (u < 30) return { stage: "A1", label: "Normal–Mildly Increased" };
    if (u <= 300) return { stage: "A2", label: "Moderately Increased" };
    return { stage: "A3", label: "Severely Increased" };
  };

  const RISK_MATRIX: number[][] = [
    [0, 1, 2], [0, 1, 2], [1, 2, 3], [2, 3, 3], [3, 3, 3], [3, 3, 3],
  ];
  const RISK_LABELS = ["Low Risk", "Moderate Risk", "High Risk", "Very High Risk"];
  const RISK_COLORS = ["text-success", "text-warning", "text-orange-500", "text-destructive"];
  const G_STAGES = ["G1","G2","G3a","G3b","G4","G5"];
  const A_STAGES = ["A1","A2","A3"];

  const validate = () => {
    const e: Record<string, string> = {};
    const cv = parseFloat(cr);
    const maxCr = crUnit === "mgdl" ? 30 : 2652;
    if (!cr.trim() || isNaN(cv) || cv <= 0 || cv > maxCr) e.cr = `Valid creatinine (0.1–${maxCr} ${crUnit === "mgdl" ? "mg/dL" : "µmol/L"})`;
    if (!age.trim() || isNaN(parseInt(age)) || parseInt(age) < 18 || parseInt(age) > 120) e.age = "Age 18–120";
    if (!sex) e.sex = "Select sex";
    if (uacr.trim()) {
      const uv = parseFloat(uacr);
      if (isNaN(uv) || uv < 0 || uv > (uacrUnit === "mg_g" ? 5000 : 500)) e.uacr = `UACR 0–${uacrUnit === "mg_g" ? "5000 mg/g" : "500 mg/mmol"}`;
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const calculate = () => {
    if (!validate()) return;
    const gfr = calcCkdEpi(getCrMgdl(), parseInt(age), sex!);
    const gs = getGStage(gfr);
    let aStage: { stage: string; label: string } | undefined;
    let risk: string | undefined;
    let riskColor: string | undefined;
    if (uacr.trim()) {
      const u = getUacrMgG();
      aStage = getAStage(u);
      const gi = G_STAGES.indexOf(gs.stage);
      const ai = A_STAGES.indexOf(aStage.stage);
      const rl = RISK_MATRIX[gi][ai];
      risk = RISK_LABELS[rl];
      riskColor = RISK_COLORS[rl];
    }
    setResult({ gfr, gStage: gs.stage, gLabel: gs.label, aStage: aStage?.stage, aLabel: aStage?.label, risk, riskColor });
  };

  const reset = () => {
    setCr(""); setAge(""); setSex(null); setUacr(""); setResult(null); setErrors({});
  };

  return (
    <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-muted/5">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">eGFR Calculator</CardTitle>
          </div>
          {result && (
            <Button variant="ghost" size="sm" onClick={reset} className="text-muted-foreground">
              <RotateCcw className="h-4 w-4 mr-1" /> Reset
            </Button>
          )}
        </div>
        <p className="text-xs text-muted-foreground">CKD-EPI 2021 (race-free) — UACR optional for KDIGO staging</p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          {/* Creatinine */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Creatinine ({crUnit === "mgdl" ? "mg/dL" : "µmol/L"})</Label>
              <button type="button" onClick={() => {
                const v = parseFloat(cr);
                if (!isNaN(v) && v > 0) setCr(crUnit === "mgdl" ? (v * 88.42).toFixed(0) : (v / 88.42).toFixed(2));
                setCrUnit(p => p === "mgdl" ? "umol" : "mgdl");
              }} className="flex items-center gap-1 text-xs text-primary hover:underline font-medium">
                <ArrowLeftRight className="h-3 w-3" /> {crUnit === "mgdl" ? "µmol/L" : "mg/dL"}
              </button>
            </div>
            <Input type="number" step={crUnit === "mgdl" ? "0.01" : "1"} placeholder={crUnit === "mgdl" ? "e.g. 1.2" : "e.g. 106"} value={cr} onChange={e => { setCr(e.target.value); if (errors.cr) setErrors(p => ({ ...p, cr: "" })); }} className={errors.cr ? "border-destructive" : ""} />
            {errors.cr && <p className="text-xs text-destructive">{errors.cr}</p>}
          </div>
          {/* Age */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Age (years)</Label>
            <Input type="number" min="18" max="120" placeholder="e.g. 55" value={age} onChange={e => { setAge(e.target.value); if (errors.age) setErrors(p => ({ ...p, age: "" })); }} className={errors.age ? "border-destructive" : ""} />
            {errors.age && <p className="text-xs text-destructive">{errors.age}</p>}
          </div>
          {/* Sex */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Sex</Label>
            <div className="flex gap-2">
              <Button type="button" variant={sex === "male" ? "default" : "outline"} size="sm" className="flex-1" onClick={() => { setSex("male"); if (errors.sex) setErrors(p => ({ ...p, sex: "" })); }}>Male</Button>
              <Button type="button" variant={sex === "female" ? "default" : "outline"} size="sm" className="flex-1" onClick={() => { setSex("female"); if (errors.sex) setErrors(p => ({ ...p, sex: "" })); }}>Female</Button>
            </div>
            {errors.sex && <p className="text-xs text-destructive">{errors.sex}</p>}
          </div>
          {/* UACR (optional) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">UACR <span className="text-xs text-muted-foreground font-normal">(optional)</span></Label>
              <button type="button" onClick={() => {
                const v = parseFloat(uacr);
                if (!isNaN(v) && v > 0) setUacr(uacrUnit === "mg_g" ? (v / 10).toFixed(1) : (v * 10).toFixed(0));
                setUacrUnit(p => p === "mg_g" ? "mg_mmol" : "mg_g");
              }} className="flex items-center gap-1 text-xs text-primary hover:underline font-medium">
                <ArrowLeftRight className="h-3 w-3" /> {uacrUnit === "mg_g" ? "mg/mmol" : "mg/g"}
              </button>
            </div>
            <Input type="number" step="0.1" placeholder={uacrUnit === "mg_g" ? "e.g. 30" : "e.g. 3"} value={uacr} onChange={e => { setUacr(e.target.value); if (errors.uacr) setErrors(p => ({ ...p, uacr: "" })); }} className={errors.uacr ? "border-destructive" : ""} />
            {errors.uacr && <p className="text-xs text-destructive">{errors.uacr}</p>}
          </div>
        </div>

        <Button onClick={calculate} className="w-full sm:w-auto">
          <Calculator className="h-4 w-4 mr-2" />
          Calculate eGFR
        </Button>

        {result && (
          <div className="mt-4 space-y-3">
            {/* eGFR result */}
            <div className="p-4 rounded-lg bg-card border-2 border-border">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <p className="text-sm text-muted-foreground">eGFR (CKD-EPI 2021)</p>
                  <p className="text-3xl font-bold text-foreground">
                    {result.gfr} <span className="text-sm font-normal text-muted-foreground">mL/min/1.73m²</span>
                  </p>
                </div>
                <Badge className={result.gfr >= 60 ? "bg-success/20 text-success border-success/30" : result.gfr >= 30 ? "bg-warning/20 text-warning border-yellow-500/30" : "bg-destructive/20 text-destructive border-destructive/30"}>
                  {result.gStage} — {result.gLabel}
                </Badge>
              </div>
            </div>

            {/* UACR + A stage (if provided) */}
            {result.aStage && (
              <div className="p-4 rounded-lg bg-card border-2 border-border">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <p className="text-sm text-muted-foreground">UACR</p>
                    <p className="text-3xl font-bold text-foreground">
                      {getUacrMgG().toFixed(0)} <span className="text-sm font-normal text-muted-foreground">mg/g</span>
                    </p>
                  </div>
                  <Badge className={result.aStage === "A1" ? "bg-success/20 text-success border-success/30" : result.aStage === "A2" ? "bg-warning/20 text-warning border-yellow-500/30" : "bg-destructive/20 text-destructive border-destructive/30"}>
                    {result.aStage} — {result.aLabel}
                  </Badge>
                </div>
              </div>
            )}

            {/* Combined KDIGO risk */}
            {result.risk && (
              <div className={`p-4 rounded-lg border-2 ${result.riskColor === "text-success" ? "bg-success/10 text-success border-success/30" : result.riskColor === "text-warning" ? "bg-warning/10 text-warning border-yellow-500/30" : result.riskColor === "text-orange-500" ? "bg-orange-100/20 text-orange-600 border-orange-400/30" : "bg-destructive/20 text-destructive border-destructive/30"}`}>
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="text-sm font-semibold">KDIGO {result.gStage}{result.aStage} — {result.risk}</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  eGFR {result.gfr} mL/min/1.73m² × UACR {getUacrMgG().toFixed(0)} mg/g
                </p>
              </div>
            )}

            {result.gfr < 60 && (
              <p className="text-xs text-destructive font-medium border-t border-border pt-2">
                ⚠️ eGFR &lt; 60: Review renal dosing adjustments for all medications below
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

const RenalDoseAdjustment = () => {
  const [search, setSearch] = useState("");

  // Group drugs by class
  const groupedByClass = ALL_RENAL_DATA.reduce((acc, drug) => {
    if (!acc[drug.drugClass]) acc[drug.drugClass] = [];
    acc[drug.drugClass].push(drug);
    return acc;
  }, {} as Record<string, DoseEntry[]>);

  // Filter groups and drugs based on search
  const filteredGroups = Object.entries(groupedByClass)
    .map(([drugClass, drugs]) => {
      const filtered = drugs.filter(d =>
        !search ||
        d.drug.toLowerCase().includes(search.toLowerCase()) ||
        d.drugClass.toLowerCase().includes(search.toLowerCase()) ||
        d.notes.toLowerCase().includes(search.toLowerCase())
      );
      return [drugClass, filtered] as const;
    })
    .filter(([_, drugs]) => drugs.length > 0);

  return (
    <div className="space-y-5 animate-slide-in">
      <Seo
        title="Renal Dose Adjustment — eGFR-Based Prescribing"
        description="eGFR-based dose adjustments across diabetes, cardiovascular and antibiotic classes, aligned with ADA 2026 and KDIGO."
        path="/renal-dosing"
      />
      <div>
        <h1 className="text-xl font-heading font-bold flex items-center gap-2">
          <FlaskConical className="w-5 h-5 text-primary" />
          Renal Dose Adjustment
        </h1>
        <p className="text-sm text-muted-foreground">eGFR-based dose modifications for diabetes medications (ADA 2026 + KDIGO)</p>
      </div>

      {/* Full KDIGO Staging with heatmap (eGFR + UACR) */}
      <KDIGOStagingCalculator />

      {/* Formula Reference */}
      <details className="clinical-card p-3 group">
        <summary className="text-sm font-medium text-primary cursor-pointer select-none list-none flex items-center gap-2">
          <span className="text-xs">📐</span>
          CKD-EPI 2021 eGFR Formula
          <ChevronDown className="w-4 h-4 ml-auto text-muted-foreground group-open:rotate-180 transition-transform" />
        </summary>
        <div className="mt-3 space-y-2 text-xs text-muted-foreground border-t border-border pt-3">
          <p><strong className="text-foreground">Equation:</strong></p>
          <div className="bg-muted/40 p-3 rounded-md font-mono text-[11px] leading-relaxed">
            eGFR = 142 × min(Cr/κ, 1)<sup>α</sup> × max(Cr/κ, 1)<sup>−1.200</sup> × 0.9938<sup>Age</sup> × SF
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
            <div>
              <p><strong className="text-foreground">Sex</strong></p>
              <table className="w-full text-[11px] mt-1">
                <thead><tr className="border-b border-border"><th className="text-left pr-4">Parameter</th><th className="text-left">Male</th><th className="text-left pl-4">Female</th></tr></thead>
                <tbody>
                  <tr><td className="pr-4">κ</td><td>0.9</td><td className="pl-4">0.7</td></tr>
                  <tr><td className="pr-4">α</td><td>−0.302</td><td className="pl-4">−0.241</td></tr>
                  <tr><td className="pr-4">SF</td><td>1.000</td><td className="pl-4">1.012</td></tr>
                </tbody>
              </table>
            </div>
            <div>
              <p><strong className="text-foreground">Variables</strong></p>
              <ul className="list-disc list-inside space-y-0.5 mt-1">
                <li>Cr = Serum creatinine (mg/dL)</li>
                <li>κ = 0.7 (F) / 0.9 (M)</li>
                <li>SF = Sex factor</li>
              </ul>
            </div>
          </div>
          <p className="text-[11px] italic mt-2">
            Race-free equation. Valid for adults ≥18 years. Results in mL/min/1.73m².
            Inokuchi et al. 2021 (Ann Clin Biochem).
          </p>
        </div>
      </details>

      {/* Drug Dosing Section — collapsible master wrapper */}
      <details className="clinical-card p-0 overflow-hidden group" defaultChecked>
        <summary className="flex items-center gap-2 px-4 py-3 cursor-pointer select-none list-none hover:bg-muted/30 transition-colors sticky top-0 bg-card z-10">
          <ChevronDown className="w-4 h-4 text-primary shrink-0 group-open:rotate-0 -rotate-90 transition-transform" />
          <Pill className="w-4 h-4 text-primary shrink-0" />
          <span className="text-sm font-semibold">Drug Dosing Tables</span>
          <span className="text-[11px] text-muted-foreground ml-auto">{ALL_RENAL_DATA.length} drugs</span>
        </summary>
        <div className="border-t border-border p-4 space-y-4">

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs">
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-destructive/20 border border-destructive/30" /> Contraindicated / Avoid</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-warning/20 border border-warning/30" /> Dose adjustment required</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-muted border border-border" /> Limited data</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-background border border-border" /> No adjustment</span>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search drug or class..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Search Results Panel — appears below search bar when searching */}
      {search && (
        <div className="clinical-card overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="px-4 py-2 bg-primary/10 border-b border-border flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs font-medium">Search Results: "{search}"</span>
            <span className="text-[11px] text-muted-foreground ml-auto">
              {filteredGroups.reduce((acc, [_, drugs]) => acc + drugs.length, 0)} match(es)
            </span>
          </div>
          <div className="divide-y divide-border">
            {filteredGroups.flatMap(([drugClass, drugs]) =>
              drugs.map((d, i) => (
                <details key={`${drugClass}-${i}`} className="group/drug" defaultChecked>
                  <summary className="flex items-center gap-2 px-4 py-2.5 cursor-pointer select-none list-none hover:bg-muted/20 transition-colors text-sm">
                    <ChevronDown className="w-3.5 h-3.5 text-muted-foreground shrink-0 group-open/drug:rotate-0 -rotate-90 transition-transform" />
                    <span className="font-medium">{d.drug}</span>
                    <span className="text-xs text-muted-foreground ml-1">({d.drugClass})</span>
                    <FrequencyBadge frequency={d.frequency} className="text-[10px] ml-auto" />
                  </summary>
                  <div className="px-4 pb-3 pt-1 border-t border-border/50">
                    <div className="overflow-x-auto mt-2">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b border-border">
                            <th className="text-left py-1.5 pr-2 font-medium text-muted-foreground">Normal Dose</th>
                            {eGFRColumns.map(col => (
                              <th key={col.key} className="text-center py-1.5 px-1.5 font-medium text-muted-foreground">
                                <div className="text-[10px]">eGFR</div>
                                <div>{col.label}</div>
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="py-1.5 pr-2 align-top">{d.normalDose}</td>
                            {eGFRColumns.map(col => (
                              <td key={col.key} className={`text-center py-1.5 px-1.5 ${cellStyle(d[col.key])}`}>
                                {d[col.key]}
                              </td>
                            ))}
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    {d.notes && (
                      <div className="mt-2 text-[11px] text-muted-foreground bg-muted/20 p-2 rounded-md">
                        {d.notes}
                      </div>
                    )}
                  </div>
                </details>
              ))
            )}
          </div>
          {filteredGroups.length === 0 && (
            <div className="text-center text-muted-foreground py-8 text-sm">
              No medications found matching "<span className="text-foreground font-medium">{search}</span>"
            </div>
          )}
        </div>
      )}

      {/* Drug groups — collapsed by default when search is active */}
      {filteredGroups.map(([drugClass, drugs]) => (
        <details key={drugClass} className="clinical-card p-0 overflow-hidden group" defaultChecked={!search}>
          <summary className="flex items-center gap-2 px-4 py-3 cursor-pointer select-none list-none hover:bg-muted/30 transition-colors sticky top-0 bg-card z-10">
            <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0 group-open:rotate-0 -rotate-90 transition-transform" />
            <Pill className="w-4 h-4 text-primary shrink-0" />
            <span className="text-sm font-medium">{drugClass}</span>
            <span className="text-[11px] text-muted-foreground ml-auto">{drugs.length} drug{drugs.length !== 1 ? "s" : ""}</span>
          </summary>
          <div className="border-t border-border divide-y divide-border">
            {drugs.map((d, i) => (
              <details key={i} className="group/drug">
                <summary className="flex items-center gap-2 px-4 py-2.5 cursor-pointer select-none list-none hover:bg-muted/20 transition-colors text-sm">
                  <ChevronDown className="w-3.5 h-3.5 text-muted-foreground shrink-0 group-open/drug:rotate-0 -rotate-90 transition-transform" />
                  <span className="font-medium">{d.drug}</span>
                  <span className="text-xs text-muted-foreground ml-1">({d.drugClass})</span>
                  <FrequencyBadge frequency={d.frequency} className="text-[10px] ml-auto" />
                </summary>
                <div className="px-4 pb-3 pt-1 border-t border-border/50">
                  <div className="overflow-x-auto mt-2">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-1.5 pr-2 font-medium text-muted-foreground">Normal Dose</th>
                          {eGFRColumns.map(col => (
                            <th key={col.key} className="text-center py-1.5 px-1.5 font-medium text-muted-foreground">
                              <div className="text-[10px]">eGFR</div>
                              <div>{col.label}</div>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="py-1.5 pr-2 align-top">{d.normalDose}</td>
                          {eGFRColumns.map(col => (
                            <td key={col.key} className={`text-center py-1.5 px-1.5 ${cellStyle(d[col.key])}`}>
                              {d[col.key]}
                            </td>
                          ))}
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  {d.notes && (
                    <div className="mt-2 text-[11px] text-muted-foreground bg-muted/20 p-2 rounded-md">
                      {d.notes}
                    </div>
                  )}
                </div>
              </details>
            ))}
          </div>
        </details>
      ))}

      {!search && filteredGroups.length === 0 && (
        <div className="text-center text-muted-foreground py-12 text-sm">
          No medications found matching "<span className="text-foreground font-medium">{search}</span>"
        </div>
      )}

      {/* Clinical Notes */}
      {(() => {
        const allFiltered = filteredGroups.flatMap(([_, drugs]) => drugs);
        return allFiltered.filter(d => d.notes).length > 0 ? (
          <div className="clinical-card">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-4 h-4 text-warning" />
              <h3 className="section-title">Clinical Notes</h3>
            </div>
            <div className="space-y-2">
              {allFiltered.filter(d => d.notes).map((d, i) => (
                <div key={i} className="flex items-start gap-2 text-xs">
                  <span className="font-medium text-primary min-w-[100px]">{d.drug}:</span>
                  <span className="text-muted-foreground">{d.notes}</span>
                </div>
              ))}
            </div>
          </div>
        ) : null;
      })()}

        </div>
      </details>
    </div>
  );
};

export default RenalDoseAdjustment;