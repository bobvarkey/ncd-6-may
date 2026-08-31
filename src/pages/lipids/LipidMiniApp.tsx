import { useMemo, useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { SectionCard } from "@/components/ui/section-card";
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
import { toast } from "@/hooks/use-toast";
import {
  Activity,
  Target,
  ListChecks,
  Stethoscope,
  Pill,
  AlertTriangle,
  RotateCcw,
  ScanLine,
  Droplet,
  Printer,
  Copy,
  Download,
  Heart,
  Info,
  ChevronDown,
  Dna,
  Scale,
  TrendingUp,
  BookOpen,
} from "lucide-react";
import { downloadTextFile } from "@/lib/clinical-utils";
import { cn } from "@/lib/utils";
import { calculatePrevent, type PreventResult } from "@/lib/prevent";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

/* ============================================================
   Lipid Management Mini-App (fully client-side)
   Based on LAI 2023 lipid algorithm
   ============================================================ */

type Scenario = "acs" | "dm" | "htg" | "general" | "recurrent" | "secondary";
type StatinGroup = "naive" | "low_mod" | "high" | "intolerant";
type DmAscvd = "no" | "yes";
type DmModifiers = "none" | "tod_or_2rf";
type CacRange = "" | "0" | "1-99_lt75" | "1-99_ge75" | "100-299" | ">=300";
type SecondaryType = "stroke" | "pad" | "ascvd";

type Inputs = {
  scenario: Scenario | "";
  // labs
  ldl: string;
  hdl: string;
  tg: string;
  totalChol: string;
  apoB: string;
  lpa: string;
  hsCrp: string;
  // demographics
  ageMale45OrFemale55: boolean;
  smoking: boolean;
  htn: boolean;
  lowHdl: boolean;
  // high-risk features
  famHxPremature: boolean;
  ckd3b4: boolean;
  apoBHigh: boolean;
  lpaHigh: boolean;
  metSyn: boolean;
  naflFibrosis: boolean;
  southAsian: boolean;
  polyvascular: boolean;
  // ACS specifics
  acsGroup: StatinGroup | "";
  // DM specifics
  dmAscvd: DmAscvd | "";
  dmMods: DmModifiers | "";
  // CAC
  cac: CacRange;
  // recurrent
  recurrentEvent: boolean;
  // secondary prevention
  secondaryType: SecondaryType | "";
  secondaryPolyvascular: boolean;
  secondaryRecurrent: boolean;
};

const EMPTY: Inputs = {
  scenario: "",
  ldl: "",
  hdl: "",
  tg: "",
  totalChol: "",
  apoB: "",
  lpa: "",
  hsCrp: "",
  ageMale45OrFemale55: false,
  smoking: false,
  htn: false,
  lowHdl: false,
  famHxPremature: false,
  ckd3b4: false,
  apoBHigh: false,
  lpaHigh: false,
  metSyn: false,
  naflFibrosis: false,
  southAsian: false,
  polyvascular: false,
  acsGroup: "",
  dmAscvd: "",
  dmMods: "",
  cac: "",
  recurrentEvent: false,
  secondaryType: "",
  secondaryPolyvascular: false,
  secondaryRecurrent: false,
};

type RiskGroup =
  | "LOW"
  | "MOD"
  | "HR"
  | "VHR"
  | "EHR-A"
  | "EHR-B"
  | "EHR-C";

type Result = {
  group: RiskGroup;
  groupLabel: string;
  ldlTarget: string;
  nonHdlTarget: string;
  apoBTarget: string;
  intensity: string;
  initialRx: string[];
  escalation: string[];
  followUp: { week: string; action: string }[];
  notes: string[];
  triglycerideTrack?: string[];
};

const GROUP_LABEL: Record<RiskGroup, string> = {
  LOW: "Low risk",
  MOD: "Moderate risk",
  HR: "High risk",
  VHR: "Very high risk",
  "EHR-A": "Extreme risk — Category A",
  "EHR-B": "Extreme risk — Category B",
  "EHR-C": "Extreme risk — Category C (recurrent despite LDL ~30)",
};

const TARGETS: Record<
  RiskGroup,
  { ldl: string; nonHdl: string; apoB: string }
> = {
  LOW: { ldl: "<100 mg/dL", nonHdl: "<130 mg/dL", apoB: "<90 mg/dL" },
  MOD: {
    ldl: "<100 mg/dL (optional <70)",
    nonHdl: "<130 mg/dL (optional <100)",
    apoB: "<90 mg/dL",
  },
  HR: { ldl: "<70 mg/dL", nonHdl: "<100 mg/dL", apoB: "<80 mg/dL" },
  VHR: { ldl: "<50 mg/dL", nonHdl: "<80 mg/dL", apoB: "<65 mg/dL" },
  "EHR-A": {
    ldl: "<50 mg/dL (optional ≤30)",
    nonHdl: "<80 mg/dL (optional ≤60)",
    apoB: "<65 mg/dL",
  },
  "EHR-B": { ldl: "≤30 mg/dL", nonHdl: "≤60 mg/dL", apoB: "<50 mg/dL" },
  "EHR-C": {
    ldl: "10–15 mg/dL",
    nonHdl: "40–45 mg/dL",
    apoB: "—",
  },
};

/* ============================================================
   LAI 2023 Risk Modifier Groups (from LipidsAssessment)
   ============================================================ */
const LAI_MODIFIER_GROUPS = [
  {
    title: "Established ASCVD",
    icon: <Heart className="h-4 w-4" />,
    items: [
      { id: "ascvd_cad", label: "Coronary artery disease", qualifier: "Prior MI, CABG, PCI, or ≥50% stenosis" },
      { id: "ascvd_cva", label: "Cerebrovascular disease", qualifier: "Ischemic stroke, TIA, carotid revascularization" },
      { id: "ascvd_pad", label: "Peripheral arterial disease", qualifier: "ABI <0.9, claudication, prior revascularization" },
      { id: "ascvd_polyvascular", label: "Polyvascular disease", qualifier: "ASCVD in ≥2 vascular beds (e.g. CAD + PAD, CAD + CVA) → EHR-B" },
      { id: "ascvd_recurrent_lowldl", label: "Recurrent events despite low LDL", qualifier: "Recurrent/progressive ASCVD event on therapy with LDL ~30 mg/dL → EHR-C" },
    ],
  },
  {
    title: "Diabetes with Target Organ Damage",
    icon: <Dna className="h-4 w-4" />,
    items: [
      { id: "dmtod_retinopathy", label: "Diabetic retinopathy", qualifier: "Microaneurysms, hemorrhages on fundoscopy" },
      { id: "dmtod_nephropathy", label: "Diabetic nephropathy", qualifier: "UACR ≥30 mg/g or eGFR <60" },
      { id: "dmtod_neuropathy", label: "Diabetic neuropathy", qualifier: "Peripheral/autonomic neuropathy" },
    ],
  },
  {
    title: "Chronic Kidney Disease",
    icon: <Scale className="h-4 w-4" />,
    items: [
      { id: "ckd_3b", label: "Stage 3B (eGFR 30-44)", qualifier: "Moderately-to-severely decreased" },
      { id: "ckd_4", label: "Stage 4 (eGFR 15-29)", qualifier: "Severely decreased" },
      { id: "ckd_albuminuria", label: "Albuminuria (UACR ≥30 mg/g)", qualifier: "Kidney damage marker" },
    ],
  },
  {
    title: "Familial Hypercholesterolemia",
    icon: <Dna className="h-4 w-4" />,
    items: [
      { id: "fh_clinical", label: "Clinical FH (DLCN ≥6)", qualifier: "Definite FH by criteria" },
      { id: "fh_genetic", label: "Pathogenic FH mutation", qualifier: "LDLR, APOB, PCSK9 mutation" },
      { id: "fh_xanthoma", label: "Tendon xanthomas", qualifier: "Physical exam finding" },
    ],
  },
  {
    title: "High-Risk Features (EHR Reclassification)",
    icon: <AlertTriangle className="h-4 w-4" />,
    items: [
      { id: "hrf_lpa", label: "Lp(a) ≥50 mg/dL", qualifier: "Major Lp(a) elevation" },
      { id: "hrf_apob", label: "ApoB >130 mg/dL", qualifier: "Highly atherogenic particle burden" },
      { id: "hrf_mets", label: "Metabolic syndrome", qualifier: "≥3 MetS criteria" },
      { id: "hrf_cac", label: "CAC ≥100 AU or ≥75th %ile", qualifier: "High plaque burden" },
      { id: "hrf_nafld", label: "NAFLD with fibrosis (Stage 2/3)", qualifier: "Advanced fatty liver" },
      { id: "hrf_extreme", label: "Extreme single risk factor", qualifier: "Smoking >1ppd or BP >180/110" },
    ],
  },
  {
    title: "Risk-Enhancing Factors",
    icon: <Stethoscope className="h-4 w-4" />,
    items: [
      { id: "enh_fhx", label: "Premature ASCVD in 1st-degree relative", qualifier: "Male <55y / Female <65y" },
      { id: "enh_hscrp", label: "hs-CRP ≥2 mg/L", qualifier: "Inflammatory marker" },
      { id: "enh_lpa_minor", label: "Lp(a) 20-49 mg/dL", qualifier: "Minor elevation" },
      { id: "enh_autoimmune", label: "RA / Psoriasis / Spondyloarthropathy", qualifier: "Chronic inflammatory condition" },
      { id: "enh_hiv", label: "HIV infection", qualifier: "Viral inflammatory risk" },
      { id: "enh_pcos", label: "Premature menopause / PMOS / Pre-eclampsia", qualifier: "Women-specific" },
    ],
  },
];

function classifyLAI(
  checked: Record<string, boolean>,
  age: number, ldl: number,
  southAsian?: boolean,
  hasDiabetes?: boolean
): { cat: "EHR" | "VHR" | "HR" | "MOD" | "LOW"; sub: "A" | "B" | "C" | ""; label: string } {
  const h = (id: string) => !!checked[id];
  const sa = !!southAsian;
  const dm = !!hasDiabetes;

  const hasASCVD = h("ascvd_cad") || h("ascvd_cva") || h("ascvd_pad");
  const hasPolyvascular = h("ascvd_polyvascular");
  const hasRecurrentLowLdl = h("ascvd_recurrent_lowldl");
  const hasDMTOD = h("dmtod_retinopathy") || h("dmtod_nephropathy") || h("dmtod_neuropathy");
  const hasCKD = h("ckd_3b") || h("ckd_4") || h("ckd_albuminuria");
  const hasFH = h("fh_clinical") || h("fh_genetic") || h("fh_xanthoma");

  const ldlVhr = sa ? 160 : 190;
  const ldlHr = sa ? 130 : 160;
  const ldlMod = sa ? 100 : 130;

  const hrfCount = ["hrf_lpa", "hrf_apob", "hrf_mets", "hrf_cac", "hrf_nafld", "hrf_extreme"].filter(k => h(k)).length + (sa ? 1 : 0);
  const enhCount = ["enh_fhx", "enh_hscrp", "enh_lpa_minor", "enh_autoimmune", "enh_hiv", "enh_pcos"].filter(k => h(k)).length;

  if (hasASCVD) {
    if (hasRecurrentLowLdl || hrfCount >= 2) return { cat: "EHR", sub: "C", label: "Extreme High Risk C" };
    if (hasPolyvascular || hrfCount === 1 || (h("ascvd_cad") && (h("ascvd_cva") || h("ascvd_pad")))) return { cat: "EHR", sub: "B", label: "Extreme High Risk B" };
    if (sa) return { cat: "EHR", sub: "A", label: "Extreme High Risk A (South Asian)" };
    return { cat: "EHR", sub: "A", label: "Extreme High Risk A" };
  }
  if (hasDMTOD && (hrfCount >= 1 || enhCount >= 2)) return { cat: "VHR", sub: "C", label: "Very High Risk C" };
  if (hasDMTOD) return { cat: "VHR", sub: "B", label: "Very High Risk B" };
  if (hasCKD || hasFH || ldl >= ldlVhr) return { cat: "VHR", sub: "C", label: "Very High Risk C" };
  if (sa && dm) return { cat: "VHR", sub: "B", label: "Very High Risk B (South Asian + Diabetes)" };
  if (enhCount >= 3) return { cat: "HR", sub: "", label: "High Risk" };
  if (h("enh_fhx") && (enhCount >= 2 || hrfCount >= 1)) return { cat: "HR", sub: "", label: "High Risk" };
  if (age >= 40 && (enhCount >= 2 || hrfCount >= 1)) return { cat: "HR", sub: "", label: "High Risk" };
  if (age >= 40 && enhCount >= 1) return { cat: "MOD", sub: "", label: "Moderate Risk" };
  if (ldl >= ldlHr) return { cat: "HR", sub: "", label: "High Risk" };
  if (ldl >= ldlMod) return { cat: "MOD", sub: "", label: "Moderate Risk" };
  return { cat: "LOW", sub: "", label: "Low Risk" };
}

const LAI_BUCKET_DETAILS: Record<string, { ldl: string; nonHdl: string; apoB: string; intensity: string; drug: string }> = {
  "EHR-A": { ldl: "< 50", nonHdl: "< 80", apoB: "< 65", intensity: "High-Intensity Statin", drug: "Atorva 40-80 / Rosuva 20-40 + Ezetimibe ± PCSK9i" },
  "EHR-B": { ldl: "≤ 30", nonHdl: "≤ 60", apoB: "< 50", intensity: "High-Intensity Statin + Add-on", drug: "Atorva 40-80 / Rosuva 20-40 + Ezetimibe + PCSK9i" },
  "EHR-C": { ldl: "10-15", nonHdl: "40-45", apoB: "—", intensity: "Maximal Therapy", drug: "Max statin + Ezetimibe + PCSK9i + Bempedoic acid" },
  "VHR-A": { ldl: "< 50", nonHdl: "< 80", apoB: "< 65", intensity: "High-Intensity Statin", drug: "Atorva 40-80 / Rosuva 20-40 ± Ezetimibe" },
  "VHR-B": { ldl: "< 50", nonHdl: "< 80", apoB: "< 65", intensity: "High-Intensity Statin + Add-on", drug: "Atorva 40-80 / Rosuva 20-40 + Ezetimibe" },
  "VHR-C": { ldl: "< 50", nonHdl: "< 80", apoB: "< 65", intensity: "Maximal Therapy", drug: "Max statin + Ezetimibe ± PCSK9i" },
  "HR":    { ldl: "< 70", nonHdl: "< 100", apoB: "< 80", intensity: "High-Intensity Statin", drug: "Atorva 20-40 / Rosuva 10-20" },
  "MOD":   { ldl: "< 100", nonHdl: "< 130", apoB: "< 90", intensity: "Moderate-Intensity Statin", drug: "Atorva 10-20 / Rosuva 5-10" },
  "LOW":   { ldl: "< 100", nonHdl: "< 130", apoB: "< 90", intensity: "Lifestyle", drug: "No pharmacotherapy indicated" },
};

const LAI_TREATMENT_RECS: Record<string, { title: string; drug: string; rationale: string; followUp: string; alternative: string }> = {
  "EHR-A": { title: "High-Intensity Statin + Ezetimibe", drug: "Atorvastatin 40-80 mg OD or Rosuvastatin 20-40 mg OD + Ezetimibe 10 mg OD", rationale: "ASCVD alone or with minor risk features. Dual therapy achieves ~55-65% LDL reduction, targeting <50 mg/dL.", followUp: "Recheck lipids at 6 weeks. If LDL >50, add PCSK9i.", alternative: "If intolerant: Rosuvastatin 5-10 mg + Ezetimibe + Bempedoic acid 180 mg OD" },
  "EHR-B": { title: "Maximal Lipid-Lowering", drug: "Atorvastatin 80 mg OD + Ezetimibe 10 mg OD + PCSK9i (Evolocumab 140 mg SC q2w)", rationale: "ASCVD + ≥1 high-risk feature or polyvascular disease. Triple therapy needed for target ≤30 mg/dL.", followUp: "LDL at 4 weeks. Consider Bempedoic acid if PCSK9i not tolerated.", alternative: "Rosuvastatin 40 mg + Ezetimibe + Inclisiran 284 mg SC" },
  "EHR-C": { title: "Ultra-Maximal Therapy", drug: "Max statin + Ezetimibe + PCSK9i + Bempedoic acid 180 mg OD", rationale: "Recurrent/progressive events despite therapy. Targeting LDL 10-15 mg/dL.", followUp: "Monthly monitoring. Consider Lp(a) apheresis if LDL at goal but events persist.", alternative: "Add Colchicine 0.5 mg OD for anti-inflammatory benefit" },
  "VHR-A": { title: "High-Intensity Statin", drug: "Atorvastatin 40-80 mg OD or Rosuvastatin 20-40 mg OD", rationale: "Very high risk equivalent. Statin alone may suffice; add Ezetimibe if not at target <50.", followUp: "Lipids at 6-8 weeks. Add Ezetimibe if LDL >50.", alternative: "If statin-intolerant: Bempedoic acid 180 mg OD + Ezetimibe" },
  "VHR-B": { title: "High-Intensity Statin + Ezetimibe", drug: "Atorvastatin 40-80 mg OD + Ezetimibe 10 mg OD", rationale: "DM with TOD — combination therapy indicated from the start.", followUp: "Lipids at 6 weeks. Consider PCSK9i if LDL >50.", alternative: "Rosuvastatin 20-40 mg + Ezetimibe" },
  "VHR-C": { title: "Maximal Therapy (Triple)", drug: "Max tolerated statin + Ezetimibe ± PCSK9i", rationale: "CKD 3B-4, FH, or LDL ≥190. Triple therapy often needed.", followUp: "Lipids at 4-6 weeks. Add PCSK9i early if >1 high-risk feature.", alternative: "Consider Inclisiran 284 mg SC (6-monthly dosing)" },
  "HR": { title: "High-Intensity Statin", drug: "Atorvastatin 20-40 mg OD or Rosuvastatin 10-20 mg OD", rationale: "Multiple risk factors or diabetes alone. Target LDL <70 mg/dL.", followUp: "Lipids at 12 weeks. Intensify if not at target.", alternative: "Moderate statin + Ezetimibe if high-dose not tolerated" },
  "MOD": { title: "Moderate-Intensity Statin", drug: "Atorvastatin 10-20 mg OD or Rosuvastatin 5-10 mg OD", rationale: "Intermediate risk. Moderate statin expected to achieve <100 mg/dL.", followUp: "Recheck lipids at 12 weeks. Escalate if not at target.", alternative: "Lifestyle modification (3-month trial) if LDL 100-129" },
  "LOW": { title: "Lifestyle Modification", drug: "No pharmacotherapy indicated", rationale: "Low risk. Target LDL <100 mg/dL. Diet, exercise, and periodic surveillance.", followUp: "Recheck lipids in 6-12 months.", alternative: "Consider statin if CAC >0 or Lp(a) ≥50 on shared decision-making" },
};

/* ============================================================
   AHA Recommendation engine (2018 ACC/AHA + PREVENT)
   ============================================================ */
function ahaRec(
  preventPct: number | null,
  hasDiabetes: boolean,
  ldl: number
): { intensity: string; target: string; note: string } {
  // Diabetes → statin always
  if (hasDiabetes) {
    if (ldl >= 190 || preventPct !== null && preventPct >= 20) {
      return { intensity: "High-intensity statin", target: "< 70 mg/dL (≥50% reduction)", note: "Diabetes + high ASCVD risk: high-intensity statin (atorva 40-80 / rosuva 20-40)." };
    }
    return { intensity: "Moderate-to-high-intensity statin", target: "< 70 mg/dL", note: "Diabetes: at least moderate-intensity statin regardless of 10-yr risk; target LDL < 70." };
  }
  if (preventPct === null) {
    if (ldl >= 190) return { intensity: "High-intensity statin", target: "≥50% reduction (no lower bound)", note: "LDL ≥190 (likely FH): high-intensity statin regardless of risk." };
    return { intensity: "Shared decision", target: "—", note: "Enter age 30-79 + TC/HDL/SBP/BMI/eGFR to compute AHA PREVENT 10-yr risk." };
  }
  if (preventPct >= 20) return { intensity: "High-intensity statin", target: "< 70 mg/dL", note: "PREVENT 10-yr ≥20% (high): high-intensity statin (atorva 40-80 / rosuva 20-40)." };
  if (preventPct >= 7.5) return { intensity: "Moderate-to-high-intensity statin", target: "< 100 mg/dL (consider < 70)", note: "PREVENT 10-yr 7.5-19.9% (intermediate): moderate-to-high statin; consider risk enhancers." };
  if (preventPct >= 5) return { intensity: "Moderate-intensity statin (selective)", target: "< 100 mg/dL", note: "PREVENT 10-yr 5-7.4% (borderline): moderate statin if risk enhancers present." };
  return { intensity: "Lifestyle first", target: "< 100 mg/dL", note: "PREVENT 10-yr <5% (low): lifestyle; statin only with risk enhancers." };
}

function countMajorRF(i: Inputs): number {
  let n = 0;
  if (i.ageMale45OrFemale55) n++;
  if (i.smoking) n++;
  if (i.htn) n++;
  if (i.lowHdl) n++;
  return n;
}
function countHighRiskFeatures(i: Inputs): number {
  let n = 0;
  if (i.famHxPremature) n++;
  if (i.ckd3b4) n++;
  if (i.apoBHigh) n++;
  if (i.lpaHigh) n++;
  if (i.metSyn) n++;
  if (i.naflFibrosis) n++;
  if (i.southAsian) n++;
  return n;
}

function classifyGeneral(i: Inputs): RiskGroup {
  const ldl = parseFloat(i.ldl);
  const rf = countMajorRF(i);
  const hrf = countHighRiskFeatures(i);

  if (i.polyvascular) return "EHR-B";
  if (i.cac === ">=300") return "EHR-A";
  if (i.cac === "100-299" || i.cac === "1-99_ge75") return "VHR";

  // LAI 2023: South Asian ethnicity lowers LDL thresholds
  const ldlVhr = i.southAsian ? 160 : 190;
  const ldlHr = i.southAsian ? 130 : 160;
  const ldlMod = i.southAsian ? 100 : 130;

  if (!Number.isNaN(ldl) && ldl >= ldlVhr) return "VHR";
  if (hrf >= 2) return "VHR";
  if (hrf >= 1) return "HR";
  if (!Number.isNaN(ldl) && ldl >= ldlHr) return "HR";
  if (rf >= 3) return "HR";
  if (rf === 2) return "MOD";
  if (!Number.isNaN(ldl) && ldl >= ldlMod) return "MOD";
  return "LOW";
}

function classifyDm(i: Inputs): RiskGroup {
  const ascvd = i.dmAscvd === "yes";
  const heavy = i.dmMods === "tod_or_2rf";
  // LAI 2023: South Asian ethnicity with DM is automatically higher risk
  if (ascvd && heavy) return "EHR-B";
  if (ascvd && !heavy) return "EHR-A";
  if (!ascvd && heavy) return "VHR";
  if (!ascvd && i.southAsian) return "VHR"; // South Asian DM alone = VHR per LAI
  return "HR";
}

function buildResult(i: Inputs): Result | null {
  if (!i.scenario) return null;

  // Recurrent override
  if (i.scenario === "recurrent" || i.recurrentEvent) {
    const g: RiskGroup = "EHR-C";
    return {
      group: g,
      groupLabel: GROUP_LABEL[g],
      ldlTarget: TARGETS[g].ldl,
      nonHdlTarget: TARGETS[g].nonHdl,
      apoBTarget: TARGETS[g].apoB,
      intensity: "Maximally tolerated statin + ezetimibe + PCSK9i",
      initialRx: [
        "Continue maximally tolerated high-intensity statin + ezetimibe",
        "Add PCSK9 inhibitor if not already on one",
        "Consider bempedoic acid / bile acid sequestrant if still above goal",
      ],
      escalation: [
        "Myocardial revascularization as indicated",
        "Aggressive lifestyle management; control every modifiable risk factor",
        "SGLT2i and/or GLP-1 RA for metabolic residual risk",
        "Icosapent ethyl 2 g BID if TG elevated",
        "Colchicine 0.5 mg/day if hsCRP > 2 mg/L",
        "DAPT including ticagrelor, or aspirin + low-dose rivaroxaban for thrombotic residual risk",
        "Consider lipoprotein apheresis if refractory",
      ],
      followUp: [
        { week: "4 wk", action: "Extended lipid profile incl. Apo-B" },
        { week: "8 wk", action: "Repeat lipid profile; escalate if not at goal" },
        { week: "12 wk", action: "Reassess; target LDL ~10–15 mg/dL if events persist" },
      ],
      notes: ["Recurrent CV event despite LDL ~30 mg/dL → Extreme-Risk Category C.", ...(i.southAsian ? ["LAI 2023: South Asian ethnicity — consider even more aggressive targets and earlier PCSK9i."] : [])],
    };
  }

  // Secondary prevention (stroke, PAD, established ASCVD)
  if (i.scenario === "secondary") {
    const st = i.secondaryType;
    const poly = i.secondaryPolyvascular;
    const rec = i.secondaryRecurrent;

    let g: RiskGroup = "EHR-A";
    if (rec) g = "EHR-C";
    else if (poly) g = "EHR-B";

    const conditionLabel =
      st === "stroke" ? "Ischemic stroke / TIA" :
      st === "pad" ? "Peripheral arterial disease" :
      "Established ASCVD (CAD/MI/PCI/CABG)";

    const groupLabel = `Secondary prevention — ${conditionLabel} — ${GROUP_LABEL[g]}`;

    return {
      group: g,
      groupLabel,
      ldlTarget: TARGETS[g].ldl,
      nonHdlTarget: TARGETS[g].nonHdl,
      apoBTarget: TARGETS[g].apoB,
      intensity:
        g === "EHR-C"
          ? "Maximal therapy (statin + ezetimibe + PCSK9i ± bempedoic acid)"
          : g === "EHR-B"
            ? "High-intensity statin + ezetimibe + PCSK9i"
            : "High-intensity statin + ezetimibe",
      initialRx: [
        "Send extended lipid panel incl. Apo-B and Lp(a) if not done",
        g === "EHR-A"
          ? "High-intensity statin (atorvastatin 40–80 mg or rosuvastatin 20–40 mg)"
          : "Continue maximally tolerated high-intensity statin",
        "Add ezetimibe 10 mg from start",
        g === "EHR-B" || g === "EHR-C"
          ? "Add PCSK9 inhibitor (evolocumab or alirocumab)"
          : "Consider PCSK9i if LDL not <50 mg/dL by 4–6 weeks",
        parseFloat(i.lpa) > 50 ? "Lp(a) > 50 mg/dL → prioritize PCSK9i early" : "Check Lp(a); if ≥50 mg/dL → prioritize PCSK9i",
        st === "stroke" ? "Ensure BP <130/80; antiplatelet per stroke protocol" : undefined,
        st === "pad" ? "Add low-dose rivaroxaban 2.5 mg BID + aspirin if PAD + CAD (COMPASS-eligible)" : undefined,
      ].filter(Boolean) as string[],
      escalation: [
        "If LDL not at goal: add bempedoic acid 180 mg OD",
        "Refractory after triple therapy: consider lipoprotein apheresis",
        "Persistent TG >150 mg/dL on statin → add icosapent ethyl 2 g BID",
        "Colchicine 0.5 mg/day if hsCRP > 2 mg/L (residual inflammatory risk)",
        "SGLT2i / GLP-1 RA for metabolic residual risk if diabetic or obese",
      ],
      followUp: [
        { week: "4 wk", action: "Extended lipid profile incl. Apo-B; intensify if not at goal" },
        { week: "8 wk", action: "Repeat lipid profile; escalate if not at goal" },
        { week: "12 wk", action: "Reassess all targets (LDL, non-HDL, Apo-B)" },
      ],
      notes: [
        `Condition: ${conditionLabel}.`,
        poly ? "Polyvascular disease → Extreme-Risk Category B." : undefined,
        rec ? "Recurrent event despite therapy → Extreme-Risk Category C." : undefined,
        "All secondary prevention patients are at least EHR-A per LAI 2023.",
        ...(i.southAsian ? ["LAI 2023: South Asian ethnicity — South Asians with ASCVD are automatically EHR-A even without other high-risk features."] : []),
      ].filter(Boolean) as string[],
    };
  }

  if (i.scenario === "acs") {
    const g: RiskGroup = "EHR-A";
    const base =
      i.acsGroup === "intolerant"
        ? ["Low-dose statin + ezetimibe (statin intolerant)"]
        : ["Start/continue high-intensity statin + ezetimibe"];
    const lpa = parseFloat(i.lpa);
    return {
      group: g,
      groupLabel: "ACS — Extreme risk (post-ACS)",
      ldlTarget: "<50 mg/dL (≤30 mg/dL if feasible)",
      nonHdlTarget: "<60 mg/dL",
      apoBTarget: "<50 mg/dL",
      intensity:
        i.acsGroup === "intolerant"
          ? "Low-dose statin + ezetimibe"
          : "High-intensity statin + ezetimibe",
      initialRx: [
        "On admission: send extended lipid panel incl. Lp(a) at triage",
        ...base,
        "Consider bempedoic acid, bile acid sequestrant, or PCSK9i during admission to reach LDL <50 (or ≤30)",
        !Number.isNaN(lpa) && lpa > 50
          ? "Lp(a) > 50 mg/dL → add PCSK9 inhibitor"
          : "If Lp(a) > 50 mg/dL → add PCSK9 inhibitor",
      ],
      escalation: [
        "If not at goal: add remaining LDL-lowering drugs",
        "Refractory after PCSK9i: consider lipoprotein apheresis",
      ],
      followUp: [
        { week: "2 wk", action: "Extended lipid profile; intensify if not at goal" },
        { week: "4 wk", action: "Extended lipid profile; escalate / consider newer agents" },
      ],
      notes: [
        "All post-ACS patients are extreme-risk regardless of baseline LDL.",
        ...(i.southAsian ? ["LAI 2023: South Asian ethnicity — consider PCSK9i earlier and target LDL ≤30 mg/dL if feasible."] : []),
      ],
    };
  }

  if (i.scenario === "dm") {
    const g = classifyDm(i);
    return {
      group: g,
      groupLabel: `Diabetes — ${GROUP_LABEL[g]}`,
      ldlTarget: TARGETS[g].ldl,
      nonHdlTarget: TARGETS[g].nonHdl,
      apoBTarget: TARGETS[g].apoB,
      intensity:
        g === "EHR-A" || g === "EHR-B"
          ? "High-intensity statin + ezetimibe ± PCSK9i"
          : g === "VHR"
            ? "High-intensity statin + ezetimibe"
            : "Moderate–high-intensity statin",
      initialRx: [
        "At diagnosis: send lipid profile incl. Apo-B and Lp(a)",
        "Week 0: start LDL-lowering Rx based on % reduction needed",
        parseFloat(i.tg) > 500
          ? "TG > 500 mg/dL → add fibrate"
          : "Add fibrate only if TG > 500 mg/dL",
        "SGLT2i / GLP-1 RA if not contraindicated",
      ],
      escalation: [
        "Add ezetimibe → bempedoic acid → PCSK9i sequentially until goal",
        "Persistent TG > 150 mg/dL on statin → add icosapent ethyl 2 g BID",
        "Consider familial hypercholesterolemia if LDL stays high",
      ],
      followUp: [
        { week: "4 wk", action: "Repeat lipid profile incl. Apo-B" },
        { week: "8 wk", action: "Repeat lipid profile; if all targets met → maintain" },
      ],
      notes: [
        "Aggressive lifestyle + glycemic control alongside lipid Rx.",
        ...(i.southAsian ? ["LAI 2023: South Asian ethnicity — South Asians with DM + 1 risk factor are VHR; with ASCVD are EHR-B. Consider lower LDL threshold."] : []),
      ],
    };
  }

  if (i.scenario === "htg") {
    const tg = parseFloat(i.tg);
    const track: string[] = [];
    let urgency = "Lifestyle + assess ASCVD risk";

    if (!Number.isNaN(tg)) {
      if (tg >= 1000) {
        urgency = "Treat urgently — markedly increased pancreatitis risk";
        track.push("Fibrate first-line (fenofibrate)");
        track.push("Strict low-fat diet, abstain from alcohol");
        track.push("Add omega-3 fatty acids (4 g/day)");
        track.push("Treat secondary causes (DM, hypothyroidism)");
      } else if (tg >= 500) {
        urgency = "Treat — pancreatitis + ASCVD risk";
        track.push("Fibrate ± omega-3");
        track.push("Initiate statin once TG < 500");
      } else if (tg >= 200) {
        urgency = "Statin-first; address residual TG with icosapent ethyl";
        track.push("Statin ± ezetimibe to LDL goal");
        track.push("Icosapent ethyl 2 g BID if TG 150–499 on statin and ASCVD/high-risk");
      } else if (tg >= 150) {
        urgency = "Lifestyle; statin if ASCVD risk warrants";
        track.push("Lifestyle measures; statin per ASCVD risk");
      }
    }

    const g = classifyGeneral(i);
    return {
      group: g,
      groupLabel: `Hypertriglyceridemia — ${GROUP_LABEL[g]} background`,
      ldlTarget: TARGETS[g].ldl,
      nonHdlTarget: TARGETS[g].nonHdl,
      apoBTarget: TARGETS[g].apoB,
      intensity: urgency,
      initialRx: [
        "Low-fat diet, avoid refined carbs, weight loss + exercise",
        "Avoid alcohol; no smoking",
        "Control secondary causes (DM, hypothyroidism, drugs)",
      ],
      escalation: [
        "If TG / non-HDL remain high → fibrate + omega-3 (preferably icosapent ethyl)",
        "Refractory very high TG → lipid specialist; consider genetic testing & newer drugs",
      ],
      followUp: [
        { week: "4 wk", action: "Lipid profile; assess TG trend" },
        { week: "8 wk", action: "Lipid profile; escalate if non-HDL/Apo-B above goal" },
      ],
      notes: [
        "Goal: achieve LDL, non-HDL, and Apo-B targets per LAI.",
        ...(i.southAsian ? ["LAI 2023: South Asian ethnicity — South Asians with TG >150 + low HDL have higher metabolic risk. Consider earlier pharmacotherapy."] : []),
      ],
      triglycerideTrack: track,
    };
  }

  // general
  const g = classifyGeneral(i);
  return {
    group: g,
    groupLabel: GROUP_LABEL[g],
    ldlTarget: TARGETS[g].ldl,
    nonHdlTarget: TARGETS[g].nonHdl,
    apoBTarget: TARGETS[g].apoB,
    intensity:
      g === "LOW"
        ? "Lifestyle; statin only if risk modifiers"
        : g === "MOD"
          ? "Lifestyle + moderate-intensity statin"
          : g === "HR"
            ? "High-intensity statin"
            : g === "VHR"
              ? "High-intensity statin + ezetimibe"
              : "High-intensity statin + ezetimibe ± PCSK9i",
    initialRx: [
      "Send extended lipid panel incl. Apo-B and Lp(a) if not done",
      "Calculate % LDL reduction required and start statin accordingly",
      parseFloat(i.tg) > 500 ? "TG > 500 → add fibrate" : "Add fibrate only if TG > 500",
    ],
    escalation: [
      "Week 4 & 8: recheck lipid panel incl. Apo-B",
      "Add ezetimibe → bempedoic acid → PCSK9i sequentially",
      "Consider familial hypercholesterolemia if LDL persistently high",
    ],
    followUp: [
      { week: "4 wk", action: "Lipid profile incl. Apo-B" },
      { week: "8 wk", action: "Lipid profile; escalate if not at goal" },
    ],
    notes: [
      "Aim to reach LDL, non-HDL, and Apo-B targets at the earliest.",
      ...(i.southAsian ? ["LAI 2023: South Asian ethnicity increases ASCVD risk ~2×. Consider lower LDL threshold for therapy initiation (≥100 mg/dL) and more aggressive targets."] : []),
    ],
  };
}

/* ---------- UI helpers ---------- */

// Range buckets — each option's `value` is the midpoint/representative used by the algorithm
type RangeOpt = { label: string; value: string };
const RANGES: Record<string, RangeOpt[]> = {
  ldl: [
    { label: "< 55 mg/dL", value: "40" },
    { label: "55 – 69", value: "62" },
    { label: "70 – 99", value: "85" },
    { label: "100 – 129", value: "115" },
    { label: "130 – 159", value: "145" },
    { label: "160 – 189", value: "175" },
    { label: "≥ 190", value: "200" },
  ],
  hdl: [
    { label: "< 40 mg/dL (low)", value: "35" },
    { label: "40 – 59", value: "50" },
    { label: "≥ 60", value: "65" },
  ],
  tg: [
    { label: "< 150 mg/dL", value: "120" },
    { label: "150 – 199", value: "175" },
    { label: "200 – 499", value: "350" },
    { label: "500 – 999", value: "750" },
    { label: "≥ 1000", value: "1200" },
  ],
  totalChol: [
    { label: "< 200 mg/dL", value: "180" },
    { label: "200 – 239", value: "220" },
    { label: "≥ 240", value: "260" },
  ],
  apoB: [
    { label: "< 80 mg/dL", value: "70" },
    { label: "80 – 99", value: "90" },
    { label: "100 – 129", value: "115" },
    { label: "≥ 130", value: "140" },
  ],
  lpa: [
    { label: "< 30 mg/dL", value: "20" },
    { label: "30 – 49", value: "40" },
    { label: "50 – 99", value: "75" },
    { label: "≥ 100", value: "120" },
  ],
  hsCrp: [
    { label: "< 1 mg/L (low risk)", value: "0.5" },
    { label: "1 – 2 (avg)", value: "1.5" },
    { label: "> 2 – 10 (high)", value: "5" },
    { label: "> 10 (acute/inflammation)", value: "15" },
  ],
};

function RangeField({
  label,
  fieldKey,
  value,
  onChange,
}: {
  label: string;
  fieldKey: keyof typeof RANGES;
  value: string;
  onChange: (v: string) => void;
}) {
  const [mode, setMode] = useState<"range" | "exact">("range");
  const opts = RANGES[fieldKey];
  const matched = opts.find((o) => o.value === value);
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <Label className="text-xs text-muted-foreground">{label}</Label>
        <button type="button" onClick={() => setMode(m => m === "range" ? "exact" : "range")}
          className="text-[10px] text-primary hover:underline">{mode === "range" ? "exact" : "range"}</button>
      </div>
      {mode === "range" ? (
        <Select value={value} onValueChange={onChange}>
          <SelectTrigger className="h-9 text-xs">
            <SelectValue placeholder="Select range">
              {matched?.label ?? "Select range"}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {opts.map((o) => (
              <SelectItem key={o.value} value={o.value} className="text-xs">
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <Input type="text" inputMode="decimal" step="0.1" className="h-9 text-xs" value={value} onChange={e => onChange(e.target.value)} placeholder="Enter exact value" />
      )}
    </div>
  );
}


function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1 text-xs font-medium transition-all ${
        active
          ? "border-primary bg-primary/15 text-primary"
          : "border-border bg-card text-muted-foreground hover:bg-muted/40"
      }`}
    >
      {children}
    </button>
  );
}

function ScenarioCard({
  active,
  onClick,
  icon,
  title,
  subtitle,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-left rounded-xl border p-3 transition-all ${
        active
          ? "border-primary bg-primary/[0.08] shadow-sm"
          : "border-border bg-card hover:bg-muted/30"
      }`}
    >
      <div className="flex items-center gap-2 mb-1">
        <span
          className={`flex h-7 w-7 items-center justify-center rounded-lg ${
            active ? "bg-primary/20 text-primary" : "bg-muted text-foreground"
          }`}
        >
          {icon}
        </span>
        <span className="text-sm font-semibold text-foreground">{title}</span>
      </div>
      <p className="text-xs text-muted-foreground leading-snug">{subtitle}</p>
    </button>
  );
}

/* ---------- main component ---------- */
export default function LipidMiniApp() {
  const [i, setI] = useState<Inputs>(EMPTY);
  const set = <K extends keyof Inputs>(k: K, v: Inputs[K]) =>
    setI((p) => ({ ...p, [k]: v }));

  // ── LAI Risk Modifier group checkboxes (full LAI 2023 groups) ──
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const toggleChecked = (id: string) =>
    setChecked((p) => ({ ...p, [id]: !p[id] }));
  const modifierCounts = useMemo(() => {
    const r: Record<string, number> = {};
    for (const g of LAI_MODIFIER_GROUPS)
      r[g.title] = g.items.filter((it) => checked[it.id]).length;
    return r;
  }, [checked]);
  const totalChecked = Object.values(checked).filter(Boolean).length;

  // ── AHA PREVENT 10-year inputs ──
  const [age, setAge] = useState("");
  const [sex, setSex] = useState("male");
  const [tcInput, setTcInput] = useState("");
  const [hdlInput, setHdlInput] = useState("");
  const [sbpInput, setSbpInput] = useState("");
  const [bmiInput, setBmiInput] = useState("");
  const [egfrInput, setEgfrInput] = useState("");
  const [bpMed, setBpMed] = useState(false);
  const [onStatin, setOnStatin] = useState(false);
  const [smoking, setSmoking] = useState(false);
  const [diabetes, setDiabetes] = useState(false);

  const a = parseInt(age) || 0;
  const l = parseFloat(i.ldl) || 0;
  const h = parseFloat(hdlInput) || 0;
  const tc = parseFloat(tcInput) || 0;
  const sb = parseFloat(sbpInput) || 0;
  const b = parseFloat(bmiInput) || 0;
  const e = parseFloat(egfrInput) || 0;

  const [preventResult, setPreventResult] = useState<PreventResult | null>(null);
  useEffect(() => {
    if (a >= 30 && a <= 79 && tc > 0 && h > 0 && sb > 0 && b > 0 && e > 0) {
      setPreventResult(calculatePrevent({
        age: a, sex: sex as "male" | "female",
        totalChol: tc, hdl: h, sbp: sb, bmi: b, egfr: e,
        bpMed, statin: onStatin, diabetes, smoking,
      }));
    } else {
      setPreventResult(null);
    }
  }, [a, sex, tc, h, sb, b, e, bpMed, onStatin, diabetes, smoking]);

  // ── LAI classification (full modifier groups) ──
  const laiClass = classifyLAI(checked, a, l, i.southAsian, diabetes);
  const laiKey = laiClass.cat + (laiClass.sub ? "-" + laiClass.sub : "");
  const laiDetails = LAI_BUCKET_DETAILS[laiKey] || LAI_BUCKET_DETAILS["LOW"];
  const laiRec = LAI_TREATMENT_RECS[laiKey] || LAI_TREATMENT_RECS["LOW"];
  const preventPct = preventResult?.valid ? parseFloat(preventResult.riskPct) : null;
  const aha = ahaRec(preventPct, diabetes, l);

  const result = useMemo(() => buildResult(i), [i]);
  const showLabs = i.scenario !== "";
  const showGeneralRF = i.scenario === "general" || i.scenario === "htg";
  const showHighRiskFeatures =
    i.scenario === "general" || i.scenario === "htg";
  const showCac = i.scenario === "general";
  const showAcsBlock = i.scenario === "acs";
  const showDmBlock = i.scenario === "dm";
  const showTgBlock = i.scenario === "htg";
  const showSecondaryBlock = i.scenario === "secondary";

  // ----- Export helpers -----
  const buildSummaryText = (): string => {
    if (!result) return "";
    const labelFor = (k: keyof typeof RANGES, v: string) =>
      RANGES[k].find((o) => o.value === v)?.label ?? "—";
    const labs = [
      `LDL-C: ${labelFor("ldl", i.ldl)}`,
      `HDL-C: ${labelFor("hdl", i.hdl)}`,
      `Triglycerides: ${labelFor("tg", i.tg)}`,
      `Total cholesterol: ${labelFor("totalChol", i.totalChol)}`,
      `Apo-B: ${labelFor("apoB", i.apoB)}`,
      `Lp(a): ${labelFor("lpa", i.lpa)}`,
      `hsCRP: ${labelFor("hsCrp", i.hsCrp)}`,
    ].join("\n  ");
    const date = new Date().toLocaleString();
    return [
      `LIPID MANAGEMENT — Clinical Summary`,
      `Generated: ${date}`,
      ``,
      `Scenario: ${i.scenario.toUpperCase()}`,
      `Risk classification: ${result.groupLabel} [${result.group}]`,
      ``,
      `LABS (selected ranges):`,
      `  ${labs}`,
      ``,
      `TARGETS:`,
      `  LDL-C: ${result.ldlTarget}`,
      `  Non-HDL-C: ${result.nonHdlTarget}`,
      `  Apo-B: ${result.apoBTarget}`,
      ``,
      `THERAPY INTENSITY:`,
      `  ${result.intensity}`,
      ``,
      `INITIAL Rx:`,
      ...result.initialRx.map((x) => `  • ${x}`),
      ``,
      ...(result.triglycerideTrack?.length
        ? [`TG-SPECIFIC TRACK:`, ...result.triglycerideTrack.map((x) => `  • ${x}`), ``]
        : []),
      `ESCALATION:`,
      ...result.escalation.map((x) => `  • ${x}`),
      ``,
      `FOLLOW-UP:`,
      ...result.followUp.map((f) => `  ${f.week} — ${f.action}`),
      ``,
      ...(result.notes.length ? [`NOTES:`, ...result.notes.map((n) => `  • ${n}`)] : []),
      ``,
      `— Per LAI 2023 lipid algorithm. Clinical decision support; verify before prescribing.`,
    ].join("\n");
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(buildSummaryText());
      toast({ title: "Copied", description: "Summary copied to clipboard." });
    } catch {
      toast({ title: "Copy failed", description: "Clipboard unavailable.", variant: "destructive" });
    }
  };

  const handlePrint = () => {
    if (!result) return;
    const w = window.open("", "_blank", "width=900,height=1100");
    if (!w) return;
    const txt = buildSummaryText()
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
    w.document.write(`<!doctype html><html><head><title>Lipid Plan Summary</title>
<style>
  body { font-family: ui-sans-serif, system-ui, -apple-system, "Helvetica Neue", Arial, sans-serif;
         padding: 32px; color: #0c2340; max-width: 800px; margin: 0 auto; line-height: 1.45; }
  h1 { font-size: 18px; border-bottom: 2px solid #2d8a9e; padding-bottom: 6px; margin: 0 0 12px; }
  pre { white-space: pre-wrap; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 12px; }
  .meta { color: #5cbdb9; font-size: 11px; margin-bottom: 16px; }
  @media print { body { padding: 16px; } }
</style></head><body>
<h1>Lipid Management — Clinical Summary</h1>
<div class="meta">Generated ${new Date().toLocaleString()}</div>
<pre>${txt}</pre>
<script>window.onload = () => { window.print(); };</script>
</body></html>`);
    w.document.close();
  };


  return (
    <div className="space-y-5">

      <SectionCard
        title="Lipid Management Mini-App"
        icon={<Activity className="h-4 w-4" />}
        tone="primary"
        collapsible={false}
      >
        <p className="text-xs text-muted-foreground mb-4">
          Pick the clinical scenario, fill only what's asked, and get an LAI 2023–aligned plan computed locally on this page.
        </p>

        {/* Scenario picker */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 mb-4">
          <ScenarioCard
            active={i.scenario === "acs"}
            onClick={() => set("scenario", "acs")}
            icon={<AlertTriangle className="h-3.5 w-3.5" />}
            title="ACS"
            subtitle="Acute coronary syndrome / post-ACS"
          />
          <ScenarioCard
            active={i.scenario === "dm"}
            onClick={() => set("scenario", "dm")}
            icon={<Droplet className="h-3.5 w-3.5" />}
            title="Diabetes"
            subtitle="DM ± ASCVD"
          />
          <ScenarioCard
            active={i.scenario === "htg"}
            onClick={() => set("scenario", "htg")}
            icon={<Activity className="h-3.5 w-3.5" />}
            title="Hypertriglyceridemia"
            subtitle="TG-driven track"
          />
          <ScenarioCard
            active={i.scenario === "general"}
            onClick={() => set("scenario", "general")}
            icon={<Stethoscope className="h-3.5 w-3.5" />}
            title="Primary prevention"
            subtitle="LAI risk stratification"
          />
          <ScenarioCard
            active={i.scenario === "secondary"}
            onClick={() => set("scenario", "secondary")}
            icon={<Heart className="h-3.5 w-3.5" />}
            title="Secondary prevention"
            subtitle="Stroke, PAD, or established ASCVD"
          />
          <ScenarioCard
            active={i.scenario === "recurrent"}
            onClick={() => set("scenario", "recurrent")}
            icon={<RotateCcw className="h-3.5 w-3.5" />}
            title="Recurrent event"
            subtitle="Event despite LDL ~30"
          />
        </div>

        {/* Labs — only after scenario chosen */}
        {showLabs && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <RangeField label="LDL-C" fieldKey="ldl" value={i.ldl} onChange={(v) => set("ldl", v)} />
            <RangeField label="HDL-C" fieldKey="hdl" value={i.hdl} onChange={(v) => set("hdl", v)} />
            <RangeField label="Triglycerides" fieldKey="tg" value={i.tg} onChange={(v) => set("tg", v)} />
            <RangeField label="Total cholesterol" fieldKey="totalChol" value={i.totalChol} onChange={(v) => set("totalChol", v)} />
            <RangeField label="Apo-B" fieldKey="apoB" value={i.apoB} onChange={(v) => set("apoB", v)} />
            <RangeField label="Lp(a)" fieldKey="lpa" value={i.lpa} onChange={(v) => set("lpa", v)} />
            <RangeField label="hsCRP" fieldKey="hsCrp" value={i.hsCrp} onChange={(v) => set("hsCrp", v)} />
          </div>
        )}

        {/* ACS context-aware block */}
        {showAcsBlock && (
          <div className="mb-4">
            <Label className="text-xs text-muted-foreground mb-1.5 block">
              Pre-admission statin status
            </Label>
            <div className="flex flex-wrap gap-2">
              <Chip active={i.acsGroup === "naive"} onClick={() => set("acsGroup", "naive")}>
                Group 1 — Statin-naive
              </Chip>
              <Chip active={i.acsGroup === "low_mod"} onClick={() => set("acsGroup", "low_mod")}>
                Group 2 — Low/Mod intensity
              </Chip>
              <Chip active={i.acsGroup === "high"} onClick={() => set("acsGroup", "high")}>
                Group 3 — High intensity
              </Chip>
              <Chip active={i.acsGroup === "intolerant"} onClick={() => set("acsGroup", "intolerant")}>
                Group 4 — Statin intolerant
              </Chip>
            </div>
          </div>
        )}

        {/* DM context-aware block */}
        {showDmBlock && (
          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <Label className="text-xs text-muted-foreground">
                  Established ASCVD?
                </Label>
                <Dialog>
                  <DialogTrigger asChild>
                    <button type="button" className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors" title="What counts as established ASCVD?">
                      <Info className="h-3.5 w-3.5" />
                    </button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Established ASCVD</DialogTitle>
                      <DialogDescription>
                        Defined as a history of any of the following atherosclerotic cardiovascular disease events.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-2 text-sm">
                      <div className="p-3 rounded-lg border border-border bg-muted/20">
                        <p className="font-semibold text-foreground">Acute Coronary Syndrome (ACS)</p>
                        <p className="text-xs text-muted-foreground mt-1">MI, unstable angina, or coronary revascularization (PCI/CABG)</p>
                      </div>
                      <div className="p-3 rounded-lg border border-border bg-muted/20">
                        <p className="font-semibold text-foreground">Stroke / TIA</p>
                        <p className="text-xs text-muted-foreground mt-1">Ischemic cerebrovascular event or transient ischemic attack</p>
                      </div>
                      <div className="p-3 rounded-lg border border-border bg-muted/20">
                        <p className="font-semibold text-foreground">Peripheral Arterial Disease (PAD)</p>
                        <p className="text-xs text-muted-foreground mt-1">ABI &lt;0.9, claudication, or prior peripheral revascularization/amputation due to atherosclerosis</p>
                      </div>
                      <div className="p-3 rounded-lg border border-border bg-muted/20">
                        <p className="font-semibold text-foreground">Other</p>
                        <p className="text-xs text-muted-foreground mt-1">Carotid artery disease (&gt;50% stenosis), aortic aneurysm, or prior carotid revascularization</p>
                      </div>
                      <p className="text-xs text-muted-foreground italic">Per LAI 2023: DM + ASCVD = Extreme Risk (EHR-A or EHR-B depending on additional features)</p>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              <div className="flex gap-2">
                <Chip active={i.dmAscvd === "no"} onClick={() => set("dmAscvd", "no")}>No</Chip>
                <Chip active={i.dmAscvd === "yes"} onClick={() => set("dmAscvd", "yes")}>Yes</Chip>
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <Label className="text-xs text-muted-foreground">
                  Target-organ damage OR ≥2 ASCVD RFs?
                </Label>
                <Dialog>
                  <DialogTrigger asChild>
                    <button type="button" className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors" title="What counts as TOD and ASCVD RFs?">
                      <Info className="h-3.5 w-3.5" />
                    </button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Target-Organ Damage &amp; ASCVD Risk Factors</DialogTitle>
                      <DialogDescription>
                        These modifiers upgrade risk in diabetic patients per LAI 2023.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3 text-sm">
                      <div>
                        <p className="font-semibold text-foreground mb-1.5">Target-Organ Damage (TOD)</p>
                        <div className="space-y-1.5">
                          <div className="p-2.5 rounded-lg border border-border bg-muted/20">
                            <p className="text-xs font-medium text-foreground">Albuminuria</p>
                            <p className="text-[11px] text-muted-foreground">UACR ≥30 mg/g (micro- or macroalbuminuria)</p>
                          </div>
                          <div className="p-2.5 rounded-lg border border-border bg-muted/20">
                            <p className="text-xs font-medium text-foreground">CKD</p>
                            <p className="text-[11px] text-muted-foreground">eGFR &lt;60 mL/min/1.73m²</p>
                          </div>
                          <div className="p-2.5 rounded-lg border border-border bg-muted/20">
                            <p className="text-xs font-medium text-foreground">LVH</p>
                            <p className="text-[11px] text-muted-foreground">Left ventricular hypertrophy on ECG or echocardiography</p>
                          </div>
                          <div className="p-2.5 rounded-lg border border-border bg-muted/20">
                            <p className="text-xs font-medium text-foreground">Retinopathy</p>
                            <p className="text-[11px] text-muted-foreground">Diabetic retinopathy on fundoscopy</p>
                          </div>
                        </div>
                      </div>
                      <div>
                        <p className="font-semibold text-foreground mb-1.5">ASCVD Risk Factors (RFs)</p>
                        <div className="grid grid-cols-2 gap-1.5">
                          {[
                            { name: "Age", detail: "≥45 ♂ / ≥55 ♀" },
                            { name: "Smoking", detail: "Current tobacco use" },
                            { name: "Hypertension", detail: "BP ≥130/80 or on Rx" },
                            { name: "Low HDL-C", detail: "&lt;40 ♂ / &lt;50 ♀ mg/dL" },
                            { name: "High LDL-C", detail: "≥160 mg/dL" },
                            { name: "Obesity", detail: "BMI ≥30 kg/m²" },
                          ].map((rf, i) => (
                            <div key={i} className="p-2 rounded-lg border border-border bg-muted/20">
                              <p className="text-xs font-medium text-foreground">{rf.name}</p>
                              <p className="text-[10px] text-muted-foreground">{rf.detail}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground italic">
                        Per LAI 2023: DM + TOD or ≥2 RFs = Very High Risk (VHR). DM + ASCVD + TOD/≥2 RFs = Extreme Risk B (EHR-B).
                      </p>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              <div className="flex gap-2">
                <Chip active={i.dmMods === "none"} onClick={() => set("dmMods", "none")}>None / 0–1 RF</Chip>
                <Chip active={i.dmMods === "tod_or_2rf"} onClick={() => set("dmMods", "tod_or_2rf")}>TOD or ≥2 RF</Chip>
              </div>
            </div>
          </div>
        )}

        {/* Secondary prevention context-aware block */}
        {showSecondaryBlock && (
          <div className="mb-4 space-y-3">
            <div>
              <Label className="text-sm font-semibold text-foreground mb-2 block">
                Established atherosclerotic condition
              </Label>
              <div className="flex flex-wrap gap-2">
                <Chip active={i.secondaryType === "stroke"} onClick={() => set("secondaryType", "stroke")}>
                  Ischemic stroke / TIA
                </Chip>
                <Chip active={i.secondaryType === "pad"} onClick={() => set("secondaryType", "pad")}>
                  PAD (ABI &lt;0.9, claudication, revascularization)
                </Chip>
                <Chip active={i.secondaryType === "ascvd"} onClick={() => set("secondaryType", "ascvd")}>
                  CAD / prior MI / PCI / CABG
                </Chip>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Chip active={i.secondaryPolyvascular} onClick={() => set("secondaryPolyvascular", !i.secondaryPolyvascular)}>
                Polyvascular disease (≥2 vascular beds)
              </Chip>
              <Chip active={i.secondaryRecurrent} onClick={() => set("secondaryRecurrent", !i.secondaryRecurrent)}>
                Recurrent event despite therapy
              </Chip>
              <Chip active={i.southAsian} onClick={() => set("southAsian", !i.southAsian)}>
                South Asian ethnicity
              </Chip>
            </div>
          </div>
        )}

        {/* TG explainer */}
        {showTgBlock && (
          <p className="mb-4 text-xs text-muted-foreground italic">
            TG values automatically branch the algorithm: 150–199 / 200–499 / 500–999 / ≥1000.
          </p>
        )}

        {/* Major ASCVD risk factors */}
        {showGeneralRF && (
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-1.5">
              <Label className="text-xs text-muted-foreground">
                Major ASCVD risk factors
              </Label>
              <Dialog>
                <DialogTrigger asChild>
                  <button type="button" className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors" title="What are these risk factors?">
                    <Info className="h-3.5 w-3.5" />
                  </button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Major ASCVD Risk Factors</DialogTitle>
                    <DialogDescription>
                      These are the traditional risk factors used in ASCVD risk stratification. Each one independently increases cardiovascular risk.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-3 text-sm">
                    <div className="p-3 rounded-lg border border-border bg-muted/20">
                      <p className="font-semibold text-foreground">Age ≥45 (♂) / ≥55 (♀)</p>
                      <p className="text-xs text-muted-foreground mt-1">Age is the strongest non-modifiable risk factor. ASCVD risk increases exponentially with age. The threshold differs by sex because women typically develop ASCVD ~10 years later than men due to estrogen's cardioprotective effect.</p>
                    </div>
                    <div className="p-3 rounded-lg border border-border bg-muted/20">
                      <p className="font-semibold text-foreground">Current Smoker</p>
                      <p className="text-xs text-muted-foreground mt-1">Smoking causes endothelial dysfunction, promotes atherosclerosis, increases oxidative stress, and raises fibrinogen levels. Risk is dose-dependent and partially reversible with cessation. Even 1–5 cigarettes/day significantly increases ASCVD risk.</p>
                    </div>
                    <div className="p-3 rounded-lg border border-border bg-muted/20">
                      <p className="font-semibold text-foreground">Hypertension</p>
                      <p className="text-xs text-muted-foreground mt-1">Chronic hypertension damages arterial endothelium, accelerates atherosclerosis, and increases left ventricular afterload. Each 20 mmHg increase in SBP doubles ASCVD mortality. BP ≥130/80 is considered elevated per ACC/AHA guidelines.</p>
                    </div>
                    <div className="p-3 rounded-lg border border-border bg-muted/20">
                      <p className="font-semibold text-foreground">Low HDL-C (&lt;40 mg/dL ♂ / &lt;50 mg/dL ♀)</p>
                      <p className="text-xs text-muted-foreground mt-1">Low HDL-C is an independent ASCVD risk marker. HDL normally promotes reverse cholesterol transport, has anti-inflammatory and antioxidant properties. Low HDL often clusters with insulin resistance, high TG, and small dense LDL particles.</p>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            <div className="flex flex-wrap gap-2">
              <Chip active={i.ageMale45OrFemale55} onClick={() => set("ageMale45OrFemale55", !i.ageMale45OrFemale55)}>
                Age ≥45 ♂ / ≥55 ♀
              </Chip>
              <Chip active={i.smoking} onClick={() => set("smoking", !i.smoking)}>
                Current smoker
              </Chip>
              <Chip active={i.htn} onClick={() => set("htn", !i.htn)}>
                Hypertension
              </Chip>
              <Chip active={i.lowHdl} onClick={() => set("lowHdl", !i.lowHdl)}>
                Low HDL-C
              </Chip>
            </div>
          </div>
        )}

        {/* High-risk features */}
        {showHighRiskFeatures && (
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-1.5">
              <Label className="text-xs text-muted-foreground">
                High-risk features
              </Label>
              <Dialog>
                <DialogTrigger asChild>
                  <button type="button" className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors" title="What are these high-risk features?">
                    <Info className="h-3.5 w-3.5" />
                  </button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>High-Risk Features</DialogTitle>
                    <DialogDescription>
                      These features further amplify ASCVD risk beyond traditional risk factors. Presence of any one may upgrade risk category per LAI 2023.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-3 text-sm">
                    <div className="p-3 rounded-lg border border-border bg-muted/20">
                      <p className="font-semibold text-foreground">Family History of Premature ASCVD</p>
                      <p className="text-xs text-muted-foreground mt-1">Defined as ASCVD in a first-degree relative (♂ &lt;55 yr, ♀ &lt;65 yr). Suggests genetic predisposition to early atherosclerosis. Increases risk ~1.5–2× independent of other factors.</p>
                    </div>
                    <div className="p-3 rounded-lg border border-border bg-muted/20">
                      <p className="font-semibold text-foreground">CKD Stage 3B/4</p>
                      <p className="text-xs text-muted-foreground mt-1">eGFR &lt;45 mL/min/1.73m². CKD is an independent ASCVD risk equivalent. Uremic milieu promotes vascular calcification, inflammation, and oxidative stress. Risk of CV death exceeds risk of progression to ESRD in most patients.</p>
                    </div>
                    <div className="p-3 rounded-lg border border-border bg-muted/20">
                      <p className="font-semibold text-foreground">Apo-B &gt;130 mg/dL</p>
                      <p className="text-xs text-muted-foreground mt-1">Apo-B reflects total atherogenic particle count (VLDL, IDL, LDL, Lp(a)). It may be elevated even when LDL-C is normal (discordance). Each 10 mg/dL increase in Apo-B raises ASCVD risk by ~12%.</p>
                    </div>
                    <div className="p-3 rounded-lg border border-border bg-muted/20">
                      <p className="font-semibold text-foreground">Lp(a) ≥50 mg/dL</p>
                      <p className="text-xs text-muted-foreground mt-1">Lipoprotein(a) is a genetically determined, pro-atherosclerotic and pro-thrombotic particle. Levels are largely unaffected by lifestyle or statins. Elevated Lp(a) increases ASCVD risk ~1.5–2×. PCSK9i and emerging therapies (pelacarsen, olpasiran) can lower it.</p>
                    </div>
                    <div className="p-3 rounded-lg border border-border bg-muted/20">
                      <p className="font-semibold text-foreground">Metabolic Syndrome</p>
                      <p className="text-xs text-muted-foreground mt-1">Defined by ≥3 of: central obesity, high TG, low HDL, elevated BP, elevated fasting glucose. Clusters multiple risk factors and amplifies ASCVD risk beyond the sum of its components. Strongly linked to insulin resistance.</p>
                    </div>
                    <div className="p-3 rounded-lg border border-border bg-muted/20">
                      <p className="font-semibold text-foreground">NAFLD with Fibrosis Stage 2/3</p>
                      <p className="text-xs text-muted-foreground mt-1">NAFLD with significant fibrosis is an independent ASCVD risk factor. Hepatic inflammation and insulin resistance drive systemic pro-atherogenic changes. FIB-4 score &gt;2.67 or NFS &gt;0.676 suggests advanced fibrosis.</p>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            <div className="flex flex-wrap gap-2">
              <Chip active={i.famHxPremature} onClick={() => set("famHxPremature", !i.famHxPremature)}>
                FHx premature ASCVD
              </Chip>
              <Chip active={i.ckd3b4} onClick={() => set("ckd3b4", !i.ckd3b4)}>
                CKD 3B/4
              </Chip>
              <Chip active={i.apoBHigh} onClick={() => set("apoBHigh", !i.apoBHigh)}>
                Apo-B &gt; 130
              </Chip>
              <Chip active={i.lpaHigh} onClick={() => set("lpaHigh", !i.lpaHigh)}>
                Lp(a) ≥ 50
              </Chip>
              <Chip active={i.metSyn} onClick={() => set("metSyn", !i.metSyn)}>
                Metabolic syndrome
              </Chip>
              <Chip active={i.naflFibrosis} onClick={() => set("naflFibrosis", !i.naflFibrosis)}>
                NAFLD fibrosis 2/3
              </Chip>
            </div>
          </div>
        )}

        {/* LAI 2023 South Asian Risk Modifier — prominent callout */}
        {showHighRiskFeatures && i.southAsian && (
          <div className="mb-4 p-3 rounded-lg border-2 border-orange-500/30 bg-gradient-to-r from-orange-500/10 to-amber-500/5">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-orange-400" />
              <span className="text-xs font-bold text-orange-600 dark:text-orange-400 uppercase tracking-wider">
                LAI 2023 — South Asian Risk Modifier
              </span>
            </div>
            <p className="text-xs text-foreground leading-relaxed mb-2">
              South Asian ethnicity is an independent risk modifier per LAI 2023. It <strong>increases ASCVD risk by ~2×</strong> compared to non-South Asians at the same LDL level. This means:
            </p>
            <ul className="space-y-1 text-xs text-foreground">
              <li className="flex items-start gap-1.5">
                <span className="text-orange-400 mt-0.5">•</span>
                <span>Lower LDL thresholds for initiating therapy (LDL ≥100 mg/dL may warrant statin in South Asians vs ≥130 in others)</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-orange-400 mt-0.5">•</span>
                <span>More aggressive targets: South Asians with ASCVD are automatically EHR-A even without other high-risk features</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-orange-400 mt-0.5">•</span>
                <span>Earlier screening recommended (from age 20 vs 40 in general population)</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-orange-400 mt-0.5">•</span>
                <span>Higher prevalence of metabolic syndrome, low HDL, high TG, and Lp(a) elevation</span>
              </li>
            </ul>
            <p className="text-[10px] text-muted-foreground mt-1.5 italic">
              Source: Lipid Association of India (LAI) 2023 Expert Consensus Statement
            </p>
          </div>
        )}

        {/* Polyvascular disease — direct EHR-B criterion */}
        {showHighRiskFeatures && (
          <div className="mb-4">
            <Label className="text-xs text-muted-foreground mb-1.5 block">
              Polyvascular disease (≥2 beds) — <span className="text-destructive font-semibold">direct EHR-B</span>
            </Label>
            <div className="flex flex-wrap gap-2">
              <Chip active={i.polyvascular} onClick={() => set("polyvascular", !i.polyvascular)}>
                Polyvascular disease (≥2 beds)
              </Chip>
            </div>
          </div>
        )}

        {/* CAC */}
        {showCac && (
          <div className="mb-4">
            <Label className="text-xs text-muted-foreground mb-1.5 block">
              CAC score (if available)
            </Label>
            <div className="flex flex-wrap gap-2">
              <Chip active={i.cac === ""} onClick={() => set("cac", "")}>Not done</Chip>
              <Chip active={i.cac === "0"} onClick={() => set("cac", "0")}>0</Chip>
              <Chip active={i.cac === "1-99_lt75"} onClick={() => set("cac", "1-99_lt75")}>
                1–99, &lt;75th %ile
              </Chip>
              <Chip active={i.cac === "1-99_ge75"} onClick={() => set("cac", "1-99_ge75")}>
                1–99, ≥75th %ile
              </Chip>
              <Chip active={i.cac === "100-299"} onClick={() => set("cac", "100-299")}>100–299</Chip>
              <Chip active={i.cac === ">=300"} onClick={() => set("cac", ">=300")}>≥300</Chip>
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setI(EMPTY);
              setChecked({});
              setPreventResult(null);
              setAge(""); setTcInput(""); setHdlInput(""); setSbpInput("");
              setBmiInput(""); setEgfrInput("");
            }}
          >
            <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
            Reset
          </Button>
        </div>

        {/* LAI 2023 Risk Modifier Groups — full modifier set */}
        <div className="mt-2">
          <div className="flex items-center gap-2 mb-2">
            <BookOpen className="h-4 w-4 text-danger" />
            <p className="text-sm font-semibold text-foreground">LAI 2023 Risk Modifiers</p>
            {totalChecked > 0 && <Badge variant="secondary" className="text-xs">{totalChecked} selected</Badge>}
          </div>
          <p className="text-xs text-muted-foreground mb-3">
            Select applicable LAI 2023 risk modifiers for full risk classification.
          </p>
          <div className="space-y-2">
            {LAI_MODIFIER_GROUPS.map((group) => {
              const count = modifierCounts[group.title];
              return (
                <Collapsible key={group.title} defaultOpen={count > 0 || group.title === "Established ASCVD"}>
                  <CollapsibleTrigger asChild>
                    <button className="flex w-full items-center justify-between rounded-lg border border-border bg-muted/30 px-4 py-2.5 hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-foreground">{group.title}</span>
                        {count > 0 && <Badge variant="secondary" className="text-xs">{count}/{group.items.length}</Badge>}
                      </div>
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    </button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-1 border-x border-b border-border rounded-b-lg bg-card p-3">
                    {group.items.map((item) => (
                      <label key={item.id} className={cn("flex cursor-pointer items-start gap-2.5 rounded-md px-3 py-2 transition-colors", checked[item.id] ? "bg-danger/5 ring-1 ring-danger/20" : "hover:bg-muted/50")}>
                        <Checkbox checked={!!checked[item.id]} onCheckedChange={() => toggleChecked(item.id)} className="mt-0.5" />
                        <div>
                          <span className="text-sm text-foreground font-medium">{item.label}</span>
                          <p className="text-xs text-muted-foreground">{item.qualifier}</p>
                        </div>
                      </label>
                    ))}
                  </CollapsibleContent>
                </Collapsible>
              );
            })}
          </div>

          {laiClass && totalChecked > 0 && (
            <div className="mt-4 rounded-lg border p-3 border-warning/30 bg-warning/5">
              <p className="text-xs font-semibold text-warning mb-1">LAI 2023 Classification</p>
              <p className="text-sm font-bold text-foreground">
                {laiClass.cat}{laiClass.sub ? `-${laiClass.sub}` : ""} — {laiClass.label}
              </p>
              <p className="text-xs text-muted-foreground mt-1">LDL target {laiDetails.ldl} mg/dL · {laiRec.drug}</p>
            </div>
          )}
        </div>
      </SectionCard>

      {/* AHA PREVENT 10-year risk + AHA recommendation */}
      {i.scenario !== "" && (
        <SectionCard
          title="AHA PREVENT 10-Year Risk"
          icon={<TrendingUp className="h-4 w-4" />}
          tone="primary"
        >
          <p className="text-xs text-muted-foreground mb-3">
            Age 30–79, TC, HDL, SBP, BMI, eGFR required.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div><Label className="text-xs">Age</Label><Input type="number" value={age} onChange={(e) => setAge(e.target.value)} className="h-9 text-xs" /></div>
            <div><Label className="text-xs">Sex</Label>
              <Select value={sex} onValueChange={setSex}>
                <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label className="text-xs">Total Chol</Label><Input type="number" value={tcInput} onChange={(e) => setTcInput(e.target.value)} className="h-9 text-xs" /></div>
            <div><Label className="text-xs">HDL</Label><Input type="number" value={hdlInput} onChange={(e) => setHdlInput(e.target.value)} className="h-9 text-xs" /></div>
            <div><Label className="text-xs">SBP</Label><Input type="number" value={sbpInput} onChange={(e) => setSbpInput(e.target.value)} className="h-9 text-xs" /></div>
            <div><Label className="text-xs">BMI</Label><Input type="number" step="0.1" value={bmiInput} onChange={(e) => setBmiInput(e.target.value)} className="h-9 text-xs" /></div>
            <div><Label className="text-xs">eGFR</Label><Input type="number" value={egfrInput} onChange={(e) => setEgfrInput(e.target.value)} className="h-9 text-xs" /></div>
          </div>
          <div className="flex flex-wrap gap-3 mt-2">
            <label className="flex items-center gap-2 cursor-pointer text-xs"><input type="checkbox" checked={bpMed} onChange={(e) => setBpMed(e.target.checked)} className="rounded" /> BP Meds</label>
            <label className="flex items-center gap-2 cursor-pointer text-xs"><input type="checkbox" checked={onStatin} onChange={(e) => setOnStatin(e.target.checked)} className="rounded" /> On Statin</label>
            <label className="flex items-center gap-2 cursor-pointer text-xs"><input type="checkbox" checked={diabetes} onChange={(e) => setDiabetes(e.target.checked)} className="rounded" /> Diabetes</label>
            <label className="flex items-center gap-2 cursor-pointer text-xs"><input type="checkbox" checked={smoking} onChange={(e) => setSmoking(e.target.checked)} className="rounded" /> Smoker</label>
          </div>
          {preventResult?.valid ? (
            <div className="mt-3 p-3 rounded-lg border border-primary/30 bg-primary/5">
              <span className="font-semibold text-lg">{preventResult.riskPct}%</span>
              <span className="ml-2 text-xs font-semibold">({preventResult.category}) 10-yr ASCVD</span>
              <p className="text-xs text-muted-foreground mt-1">{aha.note}</p>
            </div>
          ) : (
            <div className="mt-3 text-xs text-muted-foreground">
              {preventResult?.warnings?.length ? preventResult.warnings.join("; ") : "Enter values to compute AHA PREVENT risk."}
            </div>
          )}
        </SectionCard>
      )}

      {/* Result */}
      {result && (
        <SectionCard
          title="Computed Plan"
          icon={<Target className="h-4 w-4" />}
          tone="accent"
          collapsible={false}
          badge={
            <Badge variant="outline" className="ml-2 border-accent/40 text-accent">
              {result.group}
            </Badge>
          }
        >
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2 justify-end -mt-1">
              <Button variant="outline" size="sm" onClick={handleCopy}>
                <Copy className="h-3.5 w-3.5 mr-1.5" /> Copy summary
              </Button>
              <Button variant="outline" size="sm" onClick={() => downloadTextFile(`lipids-${new Date().toISOString().slice(0,10)}`, buildSummaryText())}>
                <Download className="h-3.5 w-3.5 mr-1.5" /> Download .txt
              </Button>
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="h-3.5 w-3.5 mr-1.5" /> Print / PDF
              </Button>
            </div>

            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">
                Risk classification
              </p>
              <p className="text-base font-semibold text-foreground">
                {result.groupLabel}
              </p>
            </div>

            <div className="grid sm:grid-cols-3 gap-3">
              <Card className="p-3 border-primary/30 bg-primary/[0.05]">
                <p className="text-xs uppercase tracking-wider text-primary font-bold">LDL-C target</p>
                <p className="text-sm font-bold text-foreground mt-0.5">{result.ldlTarget}</p>
              </Card>
              <Card className="p-3 border-accent/30 bg-accent/[0.05]">
                <p className="text-xs uppercase tracking-wider text-accent font-bold">Non-HDL-C target</p>
                <p className="text-sm font-bold text-foreground mt-0.5">{result.nonHdlTarget}</p>
              </Card>
              <Card className="p-3 border-warning/30 bg-warning/[0.05]">
                <p className="text-xs uppercase tracking-wider text-warning font-bold">Apo-B target</p>
                <p className="text-sm font-bold text-foreground mt-0.5">{result.apoBTarget}</p>
              </Card>
            </div>

            {/* Dual AHA + LAI recommendations */}
            {(totalChecked > 0 || preventResult?.valid) && (
              <div className="rounded-xl border border-border overflow-hidden">
                <div className="px-4 py-2 bg-muted/40 border-b border-border flex items-center gap-2">
                  <Info className="h-4 w-4 text-primary" />
                  <p className="text-xs font-bold text-foreground">Guideline comparison</p>
                </div>
                <div className="grid sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-border">
                  {/* AHA */}
                  <div className={cn("p-4 space-y-1.5", !i.southAsian && "bg-primary/[0.04]")}>
                    <div className="flex items-center gap-1.5">
                      <TrendingUp className="h-3.5 w-3.5 text-primary" />
                      <p className="text-xs font-bold text-primary">ACC/AHA {!i.southAsian && <span className="ml-1 text-[10px] font-semibold text-muted-foreground">(preferred)</span>}</p>
                    </div>
                    <p className="text-sm font-semibold text-foreground">{aha.intensity}</p>
                    <p className="text-xs text-muted-foreground">LDL target: {aha.target}</p>
                    <p className="text-xs text-muted-foreground">{aha.note}</p>
                  </div>
                  {/* LAI */}
                  <div className={cn("p-4 space-y-1.5", i.southAsian && "bg-warning/[0.06]")}>
                    <div className="flex items-center gap-1.5">
                      <BookOpen className="h-3.5 w-3.5 text-warning" />
                      <p className="text-xs font-bold text-warning">LAI 2023 {i.southAsian && <span className="ml-1 text-[10px] font-semibold text-muted-foreground">(preferred)</span>}</p>
                    </div>
                    {totalChecked > 0 ? (
                      <>
                        <p className="text-sm font-semibold text-foreground">{laiRec.title}</p>
                        <p className="text-xs text-muted-foreground">LDL target: {laiDetails.ldl} mg/dL</p>
                        <p className="text-xs text-muted-foreground">{laiRec.drug}</p>
                      </>
                    ) : (
                      <p className="text-xs text-muted-foreground">Select LAI risk modifiers above to generate the LAI plan.</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <Pill className="h-3.5 w-3.5 text-primary" />
                <p className="text-xs font-bold text-foreground">Therapy intensity</p>
              </div>
              <p className="text-sm text-foreground">{result.intensity}</p>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <ListChecks className="h-3.5 w-3.5 text-primary" />
                <p className="text-xs font-bold text-foreground">Initial Rx</p>
              </div>
              <ul className="list-disc pl-5 space-y-1 text-sm text-foreground">
                {result.initialRx.map((x, idx) => <li key={idx}>{x}</li>)}
              </ul>
            </div>

            {result.triglycerideTrack && result.triglycerideTrack.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <Activity className="h-3.5 w-3.5 text-warning" />
                  <p className="text-xs font-bold text-foreground">TG-specific track</p>
                </div>
                <ul className="list-disc pl-5 space-y-1 text-sm text-foreground">
                  {result.triglycerideTrack.map((x, idx) => <li key={idx}>{x}</li>)}
                </ul>
              </div>
            )}

            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <ScanLine className="h-3.5 w-3.5 text-accent" />
                <p className="text-xs font-bold text-foreground">Escalation</p>
              </div>
              <ul className="list-disc pl-5 space-y-1 text-sm text-foreground">
                {result.escalation.map((x, idx) => <li key={idx}>{x}</li>)}
              </ul>
            </div>

            <div>
              <p className="text-xs font-bold text-foreground mb-1.5">Follow-up</p>
              <div className="grid sm:grid-cols-3 gap-2">
                {result.followUp.map((f, idx) => (
                  <Card key={idx} className="p-2.5 border-border bg-card">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">{f.week}</p>
                    <p className="text-xs text-foreground mt-0.5">{f.action}</p>
                  </Card>
                ))}
              </div>
            </div>

            {result.notes.length > 0 && (
              <div className="rounded-md border border-border bg-muted/30 p-2.5">
                {result.notes.map((n, idx) => (
                  <p key={idx} className="text-xs text-muted-foreground">• {n}</p>
                ))}
              </div>
            )}
          </div>
        </SectionCard>
      )}
    </div>
  );
}
