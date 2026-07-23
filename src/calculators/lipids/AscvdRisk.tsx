import lipidTargetGuide from "@/assets/lipid-target-guide.png.asset.json";
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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
  ClipboardCopy,
  ArrowLeft,
  Heart,
  ChevronDown,
  ChevronUp,
  User,
  FileText,
  Sparkles,
  AlertTriangle,
  Info,
  Dna,
  CheckCircle,
  Stethoscope,
  Calculator,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

/* ────────────────────────────────────────────────────────────
   ASCVD Risk Mini-App — ACC/AHA 2022 + LAI 2023 for South Asians
   Format: HypoRisk-style clinical-card layout with Switch toggles
   ──────────────────────────────────────────────────────────── */

type Sex = "" | "male" | "female";
type CkdStage = "" | "3a" | "3b" | "4" | "5";
type Ethnicity =
  | ""
  | "south_asian"
  | "east_asian"
  | "white"
  | "black"
  | "hispanic"
  | "other";

type SubclinicalType =
  | ""
  | "nonobstructive_plaque"
  | "carotid_plaque"
  | "femoral_plaque"
  | "coronary_plaque"
  | "abi_less_09";

type HeFHType = "" | "without_ascvd" | "with_ascvd";
type HoFHType = "" | "alone" | "with_ascvd";

type LaiSub = "" | "HIGH" | "VHR" | "EHR-A" | "EHR-B" | "EHR-C";

type AccCategory =
  | "—"
  | "LOW"
  | "BORDERLINE"
  | "INTERMEDIATE"
  | "HIGH"
  | "HIGH_55"
  | "HIGH_70";

interface Patient {
  name: string;
  age: string;
  sex: Sex;
  mrn: string;
  ethnicity: Ethnicity;
}

interface MajorRisk {
  ascvd: boolean;
  diabetes: boolean;
  htn: boolean;
  smoker: boolean;
  ckd: boolean;
  ckdStage: CkdStage;
  famHx: boolean;
  polyvascularDisease: boolean;
  recurrentACS: boolean;
  recurrentAscvdOnRx: boolean;
}

interface Labs {
  ldl: string;
  hdl: string;
  tg: string;
  hba1c: string;
  apoB: string;
  lpaMg: string;
  lpaNmol: string;
  cacScore: string;
}

interface Enhancers {
  metSyn: boolean;
  inflam: boolean;
  prematureMeno: boolean;
  preeclampsia: boolean;
  hsCrp: boolean;
  abi: boolean;
  subclinical: boolean;
}

interface GeneticRisk {
  subclinicalAtherosclerosis: SubclinicalType;
  heFH: HeFHType;
  hoFH: HoFHType;
}

/* ─── Rich data structure from JSON spec ─── */
interface SubItem {
  name: string;
  description: string;
}

interface RiskItem {
  id: string;
  name: string;
  description: string;
  subitems: SubItem[];
  category: "major" | "genetic" | "enhancer" | "fh";
  active: boolean;
}

const RISK_ITEMS: RiskItem[] = [
  // ── Major Risk Factors ──
  {
    id: "ascvd", name: "Established ASCVD",
    description: "Prior MI, ischemic stroke/TIA, stable/unstable angina, coronary or peripheral revascularization, PAD, or aortic aneurysm. Secondary prevention → high-intensity statin; LDL-C goal <55 mg/dL.",
    category: "major", active: false,
    subitems: [
      { name: "CAD / Coronary ASCVD", description: "Prior MI, angina requiring revascularization, or angiographic stenosis ≥50%" },
      { name: "Ischemic stroke or TIA", description: "Imaging-confirmed ischemic stroke or TIA with neurovascular evidence of atherosclerosis" },
      { name: "Peripheral arterial disease", description: "ABI <0.9, claudication with imaging, or prior peripheral revascularization" },
      { name: "Abdominal aortic aneurysm", description: "AAA ≥3 cm by ultrasound or CT — atherosclerotic in origin" },
    ],
  },
  {
    id: "polyvascularDisease", name: "Polyvascular Disease",
    description: "Atherosclerotic disease in ≥2 vascular beds (coronary + carotid/cerebrovascular + peripheral/aortic). Confers extreme-risk status — LDL-C goal ≤40 mg/dL with high-intensity statin + ezetimibe ± PCSK9i.",
    category: "major", active: false,
    subitems: [
      { name: "Coronary + carotid disease", description: "CAD plus carotid stenosis ≥50% or prior carotid revascularization" },
      { name: "Coronary + PAD", description: "CAD plus ABI <0.9, claudication, or prior peripheral revascularization" },
      { name: "Carotid + PAD", description: "Carotid stenosis ≥50% plus PAD in lower extremities" },
      { name: "≥3 vascular beds involved", description: "Coronary + carotid + peripheral/aortic — extreme atherosclerotic burden" },
    ],
  },
  {
    id: "recurrentAscvdOnRx", name: "Recurrent ASCVD (LDL ≤30 mg/dL on therapy)",
    description: "Recurrent ASCVD event despite LDL-C ≤30 mg/dL on maximally tolerated therapy = extreme residual risk. Evaluate Lp(a), inflammation (hs-CRP), adherence, and consider adding PCSK9i, bempedoic acid, or inclisiran.",
    category: "major", active: false,
    subitems: [
      { name: "Recurrent MI / stroke / revascularization", description: "New event despite maximally tolerated statin therapy" },
      { name: "LDL-C ≤30 mg/dL on therapy", description: "Persistent residual risk despite aggressive LDL reduction — pursue Lp(a) and inflammation pathways" },
      { name: "Elevated Lp(a) contributing", description: "Lp(a) ≥50 mg/dL or ≥125 nmol/L as residual driver" },
    ],
  },
  {
    id: "subclinicalAscvd", name: "Subclinical Atherosclerosis (ASCVD-equivalent — South Asians)",
    description: "LAI 2023: Any subclinical atherosclerosis — nonobstructive carotid/femoral/coronary plaque, or ABI <0.9 — is treated as ASCVD-equivalent in South Asians, with the same LDL-C targets as clinically manifest ASCVD.",
    category: "major", active: false,
    subitems: [
      { name: "Nonobstructive carotid plaque", description: "Focal wall thickening ≥1.5 mm without ≥50% luminal stenosis" },
      { name: "Nonobstructive femoral plaque", description: "Atherosclerotic plaque on femoral artery ultrasound" },
      { name: "Nonobstructive coronary plaque (CCTA)", description: "Any coronary plaque without obstructive stenosis on CT angiography" },
      { name: "ABI <0.9", description: "Indicates peripheral atherosclerosis — ASCVD-equivalent in South Asians (LAI 2023)" },
    ],
  },
  // ── Additional Major Factors (simple toggles) ──
  {
    id: "diabetes", name: "Diabetes",
    description: "T2DM or T1DM with end-organ damage. Multiplies ASCVD risk; treat with high-intensity statin regardless of baseline LDL.",
    category: "major", active: false, subitems: [],
  },
  {
    id: "htn", name: "Hypertension",
    description: "BP ≥130/80 or on antihypertensive therapy. Major ASCVD risk factor; BP control reduces cardiovascular events.",
    category: "major", active: false, subitems: [],
  },
  {
    id: "smoker", name: "Current Smoker",
    description: "Any tobacco use in the past 30 days. Smoking cessation is the single most effective lifestyle intervention for ASCVD prevention.",
    category: "major", active: false, subitems: [],
  },
  {
    id: "ckd", name: "Chronic Kidney Disease",
    description: "eGFR <60 mL/min/1.73m² for ≥3 months. CKD is a coronary heart disease risk equivalent; statin indicated in all adults 40–75 with CKD.",
    category: "major", active: false, subitems: [],
  },
  {
    id: "famHx", name: "Family Hx Premature ASCVD",
    description: "Male <55y or female <65y in first-degree relative. Indicates genetic predisposition; consider Lp(a) testing.",
    category: "major", active: false, subitems: [],
  },
  {
    id: "recurrentACS", name: "Recurrent ACS",
    description: "≥2 acute coronary syndrome events. Confers extreme-risk status; LDL-C goal ≤30 mg/dL with triple therapy.",
    category: "major", active: false, subitems: [],
  },

  // ── Advanced Risk Enhancers ──
  {
    id: "metSyn", name: "Metabolic Syndrome",
    description: "Cluster of ≥3: abdominal obesity, ↑TG, ↓HDL, ↑BP, ↑fasting glucose. Multiplies ASCVD risk.",
    category: "enhancer", active: false,
    subitems: [
      { name: "Waist circumference", description: ">102 cm men, >88 cm women (>90/>80 South Asian)" },
      { name: "TG ≥150 mg/dL", description: "Or on TG-lowering therapy" },
      { name: "Low HDL-C", description: "<40 mg/dL men, <50 mg/dL women" },
      { name: "BP ≥130/85 or on antihypertensives", description: "Hypertension component" },
      { name: "Fasting glucose ≥100 mg/dL", description: "Impaired fasting glucose or diabetes" },
    ],
  },
  {
    id: "inflam", name: "Chronic Inflammatory Disease",
    description: "RA, psoriasis, lupus, IBD, or HIV — chronic systemic inflammation accelerates atherosclerosis.",
    category: "enhancer", active: false,
    subitems: [
      { name: "Rheumatoid arthritis", description: "Doubles ASCVD risk; treat inflammation aggressively" },
      { name: "Psoriasis / psoriatic arthritis", description: "Severe disease confers higher ASCVD risk" },
      { name: "Systemic lupus erythematosus", description: "Markedly elevated cardiovascular risk" },
      { name: "HIV infection", description: "Chronic inflammation + ART-related dyslipidemia" },
      { name: "Inflammatory bowel disease", description: "Moderate cardiovascular risk increase" },
    ],
  },
  {
    id: "prematureMeno", name: "Premature Menopause",
    description: "Menopause before age 40 (natural) or 45 (surgical) — loss of estrogen protection.",
    category: "enhancer", active: false,
    subitems: [
      { name: "Natural menopause before age 40", description: "Premature ovarian insufficiency increases ASCVD risk" },
      { name: "Surgical menopause before age 45", description: "Bilateral oophorectomy without HRT" },
      { name: "Iatrogenic (chemo/radiation)", description: "Treatment-induced ovarian failure" },
    ],
  },
  {
    id: "preeclampsia", name: "Adverse Pregnancy Outcome",
    description: "Preeclampsia, GDM, or pregnancy-induced hypertension — long-term ASCVD risk.",
    category: "enhancer", active: false,
    subitems: [
      { name: "Severe preeclampsia / eclampsia", description: "Doubles long-term ASCVD risk" },
      { name: "Recurrent preeclampsia", description: ">1 affected pregnancy — higher residual risk" },
      { name: "Gestational diabetes", description: "Increases diabetes and ASCVD risk later in life" },
      { name: "Pregnancy-induced hypertension", description: "Predicts future hypertension and ASCVD" },
    ],
  },
  {
    id: "hsCrp", name: "Elevated hs-CRP",
    description: "≥2 mg/L marks vascular inflammation — risk-enhancing factor in primary prevention.",
    category: "enhancer", active: false,
    subitems: [
      { name: "hs-CRP 2–10 mg/L", description: "Vascular inflammation — risk-enhancing factor" },
      { name: "hs-CRP >10 mg/L (persistent)", description: "Rule out infection; if chronic, consider anti-inflammatory strategy" },
    ],
  },
  {
    id: "abi", name: "Abnormal ABI",
    description: "Ankle-brachial index <0.9 (PAD) or >1.4 (non-compressible) — vascular disease marker.",
    category: "enhancer", active: false,
    subitems: [
      { name: "ABI <0.9", description: "Peripheral atherosclerosis — risk-enhancing factor" },
      { name: "ABI ≤0.7 or rest pain", description: "Severe PAD — vascular referral" },
      { name: "ABI >1.4", description: "Non-compressible arteries (often diabetes/CKD) — use toe-brachial index" },
    ],
  },
  {
    id: "subclinical", name: "Subclinical Atherosclerosis (imaging)",
    description: "CAC ≥100 AU, carotid plaque, or elevated CIMT on imaging — direct evidence of plaque.",
    category: "enhancer", active: false,
    subitems: [
      { name: "CAC 1–99 AU", description: "Mild plaque burden — moderate-intensity statin reasonable" },
      { name: "CAC ≥100 AU or ≥75th %ile", description: "Significant atherosclerosis — initiate statin" },
      { name: "Elevated carotid IMT (>75th %ile)", description: "Subclinical atherosclerosis marker" },
      { name: "Carotid or femoral plaque", description: "Focal wall thickening ≥1.5 mm on ultrasound" },
    ],
  },
  {
    id: "nafld", name: "NAFLD / MASLD with fibrosis",
    description: "Hepatic steatosis with significant fibrosis — independent ASCVD risk factor.",
    category: "enhancer", active: false,
    subitems: [
      { name: "Hepatic steatosis on imaging", description: "Bright liver on US or ≥5% steatosis on MRI-PDFF" },
      { name: "Fibrosis stage F2", description: "Significant fibrosis (FIB-4 or transient elastography)" },
    ],
  },
  {
    id: "osa", name: "Obstructive Sleep Apnea",
    description: "AHI ≥5 — moderate-severe disease (AHI ≥15) independently raises CVD risk.",
    category: "enhancer", active: false,
    subitems: [
      { name: "Mild OSA (AHI 5–14)", description: "Lifestyle interventions; consider CPAP if symptomatic" },
      { name: "Moderate-severe OSA (AHI ≥15)", description: "CPAP indicated; independent ASCVD risk factor" },
    ],
  },
  {
    id: "pcos", name: "Polycystic Ovary Syndrome",
    description: "Hyperandrogenism + ovulatory dysfunction ± insulin resistance — early ASCVD risk.",
    category: "enhancer", active: false,
    subitems: [
      { name: "Oligo-/anovulation", description: "Cycles >35 days or <8/year" },
      { name: "Hyperandrogenism", description: "Clinical (hirsutism/acne) or biochemical (↑testosterone)" },
      { name: "Polycystic ovarian morphology / ↑AMH", description: "≥20 follicles per ovary or AMH >3.2 ng/mL" },
      { name: "Insulin resistance / HOMA-IR >2.5", description: "Common metabolic accompaniment — increases ASCVD risk" },
    ],
  },
  {
    id: "highPrs", name: "High Polygenic Risk / Monogenic FH",
    description: "Top-decile PRS for CAD or pathogenic FH variant — genetic ASCVD predisposition.",
    category: "enhancer", active: false,
    subitems: [
      { name: "High polygenic risk score for CAD", description: "Top decile PRS — confers ~2-fold ASCVD risk" },
      { name: "Pathogenic FH variant (LDLR/APOB/PCSK9)", description: "Monogenic familial hypercholesterolemia" },
    ],
  },

  // ── Familial Hypercholesterolemia ──
  {
    id: "heFH", name: "Heterozygous Familial Hypercholesterolemia (HeFH)",
    description: "Without ASCVD → Very High risk, LDL-C <50 mg/dL. With ASCVD → LAI Extreme Group A, optional LDL-C ≤30 mg/dL.",
    category: "fh", active: false,
    subitems: [
      { name: "Clinical HeFH (DLCN ≥6 / Simon Broome definite)", description: "Definite or probable heterozygous FH by validated criteria" },
      { name: "Pathogenic heterozygous LDLR/APOB/PCSK9 variant", description: "Confirmed monogenic FH" },
      { name: "LDL-C ≥190 mg/dL with FH phenotype", description: "Severe hypercholesterolemia with tendon xanthoma, corneal arcus <45 y, or cascade pattern" },
    ],
  },
  {
    id: "hoFH", name: "Homozygous Familial Hypercholesterolemia (HoFH)",
    description: "Without ASCVD → LAI Extreme Group A, LDL-C <50 mg/dL (optional ≤30). With ASCVD → LAI Extreme Group B, mandatory LDL-C ≤30 mg/dL.",
    category: "fh", active: false,
    subitems: [
      { name: "Clinical HoFH (LDL-C ≥400 mg/dL untreated)", description: "Often >500 mg/dL; tendon/cutaneous xanthomata in childhood" },
      { name: "Biallelic pathogenic LDLR/APOB/PCSK9/LDLRAP1", description: "Confirmed homozygous or compound-heterozygous FH" },
      { name: "ASCVD before age 20", description: "Premature coronary or aortic disease pathognomonic of HoFH" },
    ],
  },
];

const num = (s: string) => {
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : NaN;
};

const SUBCLINICAL_LABELS: Record<Exclude<SubclinicalType, "">, string> = {
  nonobstructive_plaque: "Nonobstructive plaque (any vascular bed)",
  carotid_plaque: "Carotid plaque (nonobstructive)",
  femoral_plaque: "Femoral plaque (nonobstructive)",
  coronary_plaque: "Coronary plaque (nonobstructive)",
  abi_less_09: "ABI <0.9",
};

export default function AscvdEmr() {
  const navigate = useNavigate();

  const [patient, setPatient] = useState<Patient>({
    name: "",
    age: "",
    sex: "",
    mrn: "",
    ethnicity: "",
  });

  const [risk, setRisk] = useState<MajorRisk>({
    ascvd: false,
    diabetes: false,
    htn: false,
    smoker: false,
    ckd: false,
    ckdStage: "",
    famHx: false,
    polyvascularDisease: false,
    recurrentACS: false,
    recurrentAscvdOnRx: false,
  });

  const [labs, setLabs] = useState<Labs>({
    ldl: "",
    hdl: "",
    tg: "",
    hba1c: "",
    apoB: "",
    lpaMg: "",
    lpaNmol: "",
    cacScore: "",
  });

  const [enh, setEnh] = useState<Enhancers>({
    metSyn: false,
    inflam: false,
    prematureMeno: false,
    preeclampsia: false,
    hsCrp: false,
    abi: false,
    subclinical: false,
  });

  const [genetic, setGenetic] = useState<GeneticRisk>({
    subclinicalAtherosclerosis: "",
    heFH: "",
    hoFH: "",
  });

  // Collapsible state for risk factor categories
  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set(["major"]));
  const [geneticOpen, setGeneticOpen] = useState(false);
  const [enhOpen, setEnhOpen] = useState(false);
  const [fhOpen, setFhOpen] = useState(false);
  const [advLipidsOpen, setAdvLipidsOpen] = useState(false);

  // Expanded subitems per risk item
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const toggleCat = (cat: string) => {
    setExpandedCats(prev => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  const toggleItem = (id: string) => {
    setExpandedItems(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // ─── Automatic detection from labs + CKD stage ───
  const auto = useMemo(() => {
    const ldl = num(labs.ldl);
    const tg = num(labs.tg);
    const apoB = num(labs.apoB);
    const lpaMg = num(labs.lpaMg);
    const lpaNmol = num(labs.lpaNmol);
    const advancedCkd =
      risk.ckd && (risk.ckdStage === "3b" || risk.ckdStage === "4" || risk.ckdStage === "5");
    return {
      persistLdl: ldl >= 160,
      persistTg: tg >= 175,
      apoBHigh: apoB >= 130,
      lpaHigh: lpaMg >= 50 || lpaNmol >= 125,
      ckdEnhancer: advancedCkd,
    };
  }, [labs, risk.ckd, risk.ckdStage]);

  // ─── Pure scoring engine ───
  type ScoreInputs = {
    age: number; ldl: number; hdl: number;
    smoker: boolean; diabetes: boolean; htn: boolean;
    ckd: boolean; famHx: boolean; southAsian: boolean;
    lpaHigh: boolean; apoBHigh: boolean;
    persistLdl: boolean; persistTg: boolean;
    metSyn: boolean; inflam: boolean; hsCrp: boolean;
    subclinical: boolean; abi: boolean;
    prematureMeno: boolean; preeclampsia: boolean;
    ckdEnhancer: boolean;
  };

  const scoreRisk = (i: ScoreInputs): number => {
    let r = 0;
    r += (i.age - 30) * 0.6;
    r += (i.ldl - 100) * 0.12;
    r -= (i.hdl - 40) * 0.25;
    if (i.smoker) r += 10;
    if (i.diabetes) r += 12;
    if (i.htn) r += 6;
    if (i.ckd) r += 5;
    if (i.ckdEnhancer) r += 2;
    if (i.famHx) r += 3;
    if (i.southAsian) r += 2;
    if (i.lpaHigh) r += 3;
    if (i.apoBHigh) r += 2;
    if (i.persistLdl) r += 3;
    if (i.persistTg) r += 1.5;
    if (i.metSyn) r += 2;
    if (i.inflam) r += 1.5;
    if (i.hsCrp) r += 1.5;
    if (i.subclinical) r += 4;
    if (i.abi) r += 2;
    if (i.prematureMeno) r += 1;
    if (i.preeclampsia) r += 1;
    return Math.max(1, Math.min(r, 40));
  };

  const ageN = num(patient.age);
  const ldlN = num(labs.ldl);
  const hdlN = num(labs.hdl);
  const cacN = num(labs.cacScore);
  const hasCore = !!ageN && !!ldlN && !!hdlN;
  const southAsian = patient.ethnicity === "south_asian";

  const baseInputs: ScoreInputs = {
    age: ageN, ldl: ldlN, hdl: hdlN,
    smoker: risk.smoker, diabetes: risk.diabetes, htn: risk.htn,
    ckd: risk.ckd, famHx: risk.famHx, southAsian,
    lpaHigh: auto.lpaHigh, apoBHigh: auto.apoBHigh,
    persistLdl: auto.persistLdl, persistTg: auto.persistTg,
    metSyn: enh.metSyn, inflam: enh.inflam, hsCrp: enh.hsCrp,
    subclinical: enh.subclinical, abi: enh.abi,
    prematureMeno: enh.prematureMeno, preeclampsia: enh.preeclampsia,
    ckdEnhancer: auto.ckdEnhancer,
  };

  const computed = useMemo(
    () => (hasCore ? scoreRisk(baseInputs) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [hasCore, JSON.stringify(baseInputs)]
  );

  // ─── ACC/AHA 2022 Consensus Category ───
  const accCategory = useMemo<AccCategory>(() => {
    if (risk.ascvd) {
      const highRiskConditions = [
        risk.diabetes, risk.htn, risk.smoker,
        risk.ckd, risk.famHx,
        auto.lpaHigh, auto.apoBHigh,
        enh.metSyn,
      ].filter(Boolean).length;
      const multipleEvents = risk.recurrentAscvdOnRx || risk.recurrentACS || risk.polyvascularDisease;
      if (multipleEvents || highRiskConditions >= 1) return "HIGH_55";
      return "HIGH_70";
    }
    if (computed == null) return "—";
    if (computed >= 20) return "HIGH";
    if (computed >= 7.5) return "INTERMEDIATE";
    if (computed >= 5) return "BORDERLINE";
    return "LOW";
  }, [computed, risk.ascvd, risk.recurrentAscvdOnRx, risk.recurrentACS,
      risk.polyvascularDisease, risk.diabetes, risk.htn, risk.smoker,
      risk.ckd, risk.famHx, auto, enh.metSyn]);

  const accLabel: Record<AccCategory, string> = {
    "—": "—",
    LOW: "Low Risk (<5%)",
    BORDERLINE: "Borderline Risk (5–7.4%)",
    INTERMEDIATE: "Intermediate Risk (7.5–19.9%)",
    HIGH: "High Risk (≥20%)",
    HIGH_55: "High Risk — ACC/AHA 2022: LDL <55 mg/dL",
    HIGH_70: "High Risk — ACC/AHA 2022: LDL <70 mg/dL",
  };

  const accLdlGoal: Record<AccCategory, string> = {
    "—": "—",
    LOW: "<100 mg/dL",
    BORDERLINE: "<100 mg/dL",
    INTERMEDIATE: "<70 mg/dL",
    HIGH: "<70 mg/dL",
    HIGH_55: "<55 mg/dL",
    HIGH_70: "<70 mg/dL",
  };

  const accTherapy: Record<AccCategory, string> = {
    "—": "—",
    LOW: "Lifestyle therapy",
    BORDERLINE: "Discuss statin; consider CAC for refinement",
    INTERMEDIATE: "Moderate–high-intensity statin",
    HIGH: "High-intensity statin ± ezetimibe",
    HIGH_55: "High-intensity statin + ezetimibe ± PCSK9i",
    HIGH_70: "High-intensity statin ± ezetimibe",
  };

  // ─── LAI 2023 Sub-classification (South Asians) ───
  const hasSubclinicalAscvd = genetic.subclinicalAtherosclerosis !== "";
  const ascvdEquivalent = risk.ascvd || (southAsian && hasSubclinicalAscvd);

  const laiSubclass = useMemo<LaiSub>(() => {
    if (!southAsian) return "";

    const highRiskFeatures = [
      risk.diabetes, risk.htn, risk.smoker,
      risk.ckd, risk.famHx,
      auto.lpaHigh, auto.apoBHigh,
      enh.metSyn,
    ].filter(Boolean).length;

    if (risk.recurrentAscvdOnRx) return "EHR-C";
    if (ascvdEquivalent && (risk.polyvascularDisease || genetic.hoFH === "with_ascvd" || risk.recurrentACS))
      return "EHR-B";
    if (ascvdEquivalent && highRiskFeatures >= 2) return "EHR-A";
    if (cacN >= 300) return "EHR-A";
    if (genetic.heFH === "with_ascvd") return "EHR-A";
    if (genetic.hoFH === "alone") return "EHR-A";
    if (genetic.heFH === "without_ascvd") return "VHR";
    if (cacN >= 100 && cacN < 300) return "VHR";
    if (cacN >= 1 && cacN < 100) return "HIGH";
    if (risk.diabetes && highRiskFeatures >= 2) return "VHR";
    if (ldlN >= 190) return "VHR";
    if (highRiskFeatures >= 2) return "VHR";
    if (risk.diabetes && highRiskFeatures >= 1) return "VHR";
    return "";
  }, [southAsian, ascvdEquivalent, risk, genetic, auto, enh, cacN, ldlN]);

  const LAI_LABEL: Record<Exclude<LaiSub, "">, string> = {
    HIGH: "High Risk — CAC 1-99 (<75th pctile)",
    VHR: "Very High Risk",
    "EHR-A": "Extreme Risk — Category A",
    "EHR-B": "Extreme Risk — Category B (polyvascular / HoFH+ASCVD)",
    "EHR-C": "Extreme Risk — Category C (refractory / recurrent)",
  };

  const LAI_LDL: Record<Exclude<LaiSub, "">, string> = {
    HIGH: "<70 mg/dL",
    VHR: "<50 mg/dL",
    "EHR-A": "<50 mg/dL (optional ≤30)",
    "EHR-B": "≤30 mg/dL (mandatory)",
    "EHR-C": "10–15 mg/dL",
  };

  const LAI_THERAPY: Record<Exclude<LaiSub, "">, string> = {
    HIGH: "Moderate–high statin",
    VHR: "High statin ± ezetimibe",
    "EHR-A": "High statin + ezetimibe ± PCSK9i",
    "EHR-B": "Triple: statin + ezetimibe + PCSK9i",
    "EHR-C": "Max multi-mechanism + Bempedoic acid ± anti-inflammatory",
  };

  const LAI_EXTREME_TABLE = [
    { cat: "EHR-A", criteria: "ASCVD + >1 high-risk features · CACS ≥300 · HeFH+ASCVD · HoFH alone", ldl: "<50 (opt ≤30)", therapy: "High statin + Ezetimibe ± PCSK9i" },
    { cat: "EHR-B", criteria: "ASCVD + polyvascular disease · Recurrent ACS · HoFH+ASCVD", ldl: "≤30 (mandatory)", therapy: "Triple: statin + Ezetimibe + PCSK9i" },
    { cat: "EHR-C", criteria: "Recurrent ASCVD event despite LDL-C ~30 mg/dL on optimal therapy", ldl: "10–15", therapy: "Max multi-mechanism + Bempedoic acid ± anti-inflammatory (colchicine)" },
  ];

  // ─── Per-driver impact ───
  type Driver = { label: string; delta: number; auto?: boolean };
  const drivers = useMemo<Driver[]>(() => {
    if (!hasCore) return [];
    const base = scoreRisk(baseInputs);
    const list: Driver[] = [];

    const tryFlag = (label: string, key: keyof ScoreInputs, isAuto = false) => {
      if (!baseInputs[key]) return;
      const alt = { ...baseInputs, [key]: false } as ScoreInputs;
      const d = base - scoreRisk(alt);
      if (d !== 0) list.push({ label, delta: d, auto: isAuto });
    };

    const ldlRef = { ...baseInputs, ldl: 100 };
    const ldlDelta = base - scoreRisk(ldlRef);
    if (Math.abs(ldlDelta) >= 0.1) list.push({ label: `LDL-C ${ldlN} mg/dL`, delta: ldlDelta });

    const hdlRef = { ...baseInputs, hdl: 50 };
    const hdlDelta = base - scoreRisk(hdlRef);
    if (Math.abs(hdlDelta) >= 0.1) list.push({ label: `HDL-C ${hdlN} mg/dL`, delta: hdlDelta });

    const ageRef = { ...baseInputs, age: 40 };
    const ageDelta = base - scoreRisk(ageRef);
    if (Math.abs(ageDelta) >= 0.1) list.push({ label: `Age ${ageN} y`, delta: ageDelta });

    tryFlag("Diabetes", "diabetes");
    tryFlag("Current smoker", "smoker");
    tryFlag("Hypertension", "htn");
    tryFlag(`CKD${risk.ckdStage ? ` stage ${risk.ckdStage.toUpperCase()}` : ""}`, "ckd");
    tryFlag("Family hx premature ASCVD", "famHx");
    tryFlag("South Asian ethnicity", "southAsian");
    tryFlag("Lp(a) elevated", "lpaHigh", true);
    tryFlag("ApoB ≥130", "apoBHigh", true);
    tryFlag("Persistent ↑ LDL-C (≥160)", "persistLdl", true);
    tryFlag("Persistent ↑ TG (≥175)", "persistTg", true);
    tryFlag("Advanced CKD enhancer", "ckdEnhancer", true);
    tryFlag("Metabolic syndrome", "metSyn");
    tryFlag("Chronic inflammation", "inflam");
    tryFlag("hs-CRP >2", "hsCrp");
    tryFlag("Subclinical atherosclerosis", "subclinical");
    tryFlag("ABI <0.9", "abi");
    tryFlag("Premature menopause", "prematureMeno");
    tryFlag("Preeclampsia hx", "preeclampsia");

    return list.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasCore, JSON.stringify(baseInputs), risk.ckdStage]);

  // ─── EMR Note ───
  const note = useMemo(() => {
    const factorList = drivers.length
      ? drivers.map(d => `  • ${d.label}  (${d.delta >= 0 ? "+" : ""}${d.delta.toFixed(1)}%)${d.auto ? "  [auto]" : ""}`).join("\n")
      : "  • None recorded";

    const laiLines = southAsian && laiSubclass
      ? ["", `LAI 2023 Sub-classification: ${laiSubclass} — ${LAI_LABEL[laiSubclass]}`, `  LDL-C Target: ${LAI_LDL[laiSubclass]}`, `  Recommended Therapy: ${LAI_THERAPY[laiSubclass]}`]
      : [];

    return [
      "ASCVD RISK ASSESSMENT", "",
      `Patient: ${patient.name || "—"}${patient.mrn ? ` (MRN ${patient.mrn})` : ""}`,
      `Age: ${patient.age || "—"}    Sex: ${patient.sex || "—"}    Ethnicity: ${patient.ethnicity || "—"}`,
      "", "Major Risk Factors / Drivers:",
      factorList, "",
      "Lipid Profile:",
      `  LDL-C: ${labs.ldl || "—"} mg/dL`,
      `  HDL-C: ${labs.hdl || "—"} mg/dL`,
      `  TG:    ${labs.tg || "—"} mg/dL`,
      `  HbA1c: ${labs.hba1c || "—"} %`,
      ...(labs.apoB ? [`  ApoB:  ${labs.apoB} mg/dL`] : []),
      ...(labs.lpaMg || labs.lpaNmol ? [`  Lp(a): ${labs.lpaMg || "—"} mg/dL / ${labs.lpaNmol || "—"} nmol/L`] : []),
      ...(labs.cacScore ? [`  CAC Score: ${labs.cacScore}`] : []),
      "", `10-Year ASCVD Risk: ${computed != null ? computed.toFixed(1) + "%" : "—"}  (ACC/AHA: ${accLabel[accCategory]})`,
      ...laiLines, "",
      `ACC/AHA LDL Goal: ${accLdlGoal[accCategory]}`,
      ...(southAsian && laiSubclass ? [`LAI 2023 LDL Goal: ${LAI_LDL[laiSubclass]}`] : []),
      `ACC/AHA Recommendation: ${accTherapy[accCategory]}`,
      ...(southAsian && laiSubclass ? [`LAI 2023 Therapy: ${LAI_THERAPY[laiSubclass]}`] : []),
    ].join("\n");
  }, [patient, labs, computed, accCategory, drivers, southAsian, laiSubclass]);

  const setM = (k: keyof MajorRisk, v: boolean) => setRisk(p => ({ ...p, [k]: v }));
  const setL = (k: keyof Labs, v: string) => setLabs(p => ({ ...p, [k]: v }));
  const setE = (k: keyof Enhancers, v: boolean) => setEnh(p => ({ ...p, [k]: v }));
  const setG = (k: keyof GeneticRisk, v: string) => setGenetic(p => ({ ...p, [k]: v }));

  // ─── Toggle helpers for rich items ───
  const toggleRichItem = (item: RiskItem) => {
    const id = item.id;
    switch (id) {
      case "ascvd": setM("ascvd", !risk.ascvd); break;
      case "polyvascularDisease": setM("polyvascularDisease", !risk.polyvascularDisease); break;
      case "recurrentAscvdOnRx": setM("recurrentAscvdOnRx", !risk.recurrentAscvdOnRx); break;
      case "subclinicalAscvd": setM("ascvd", !risk.ascvd); break; // maps to ascvd toggle for scoring
      case "diabetes": setM("diabetes", !risk.diabetes); break;
      case "htn": setM("htn", !risk.htn); break;
      case "smoker": setM("smoker", !risk.smoker); break;
      case "ckd": setM("ckd", !risk.ckd); break;
      case "famHx": setM("famHx", !risk.famHx); break;
      case "recurrentACS": setM("recurrentACS", !risk.recurrentACS); break;
      case "metSyn": setE("metSyn", !enh.metSyn); break;
      case "inflam": setE("inflam", !enh.inflam); break;
      case "prematureMeno": setE("prematureMeno", !enh.prematureMeno); break;
      case "preeclampsia": setE("preeclampsia", !enh.preeclampsia); break;
      case "hsCrp": setE("hsCrp", !enh.hsCrp); break;
      case "abi": setE("abi", !enh.abi); break;
      case "subclinical": setE("subclinical", !enh.subclinical); break;
      case "nafld": break; // informational only
      case "osa": break; // informational only
      case "pcos": break; // informational only
      case "highPrs": break; // informational only
      case "heFH": setG("heFH", genetic.heFH ? "" : "without_ascvd"); break;
      case "hoFH": setG("hoFH", genetic.hoFH ? "" : "alone"); break;
    }
  };

  const isItemActive = (item: RiskItem): boolean => {
    switch (item.id) {
      case "ascvd": return risk.ascvd;
      case "polyvascularDisease": return risk.polyvascularDisease;
      case "recurrentAscvdOnRx": return risk.recurrentAscvdOnRx;
      case "subclinicalAscvd": return risk.ascvd;
      case "diabetes": return risk.diabetes;
      case "htn": return risk.htn;
      case "smoker": return risk.smoker;
      case "ckd": return risk.ckd;
      case "famHx": return risk.famHx;
      case "recurrentACS": return risk.recurrentACS;
      case "metSyn": return enh.metSyn;
      case "inflam": return enh.inflam;
      case "prematureMeno": return enh.prematureMeno;
      case "preeclampsia": return enh.preeclampsia;
      case "hsCrp": return enh.hsCrp;
      case "abi": return enh.abi;
      case "subclinical": return enh.subclinical;
      case "nafld": return false;
      case "osa": return false;
      case "pcos": return false;
      case "highPrs": return false;
      case "heFH": return genetic.heFH !== "";
      case "hoFH": return genetic.hoFH !== "";
      default: return false;
    }
  };

  // ─── Risk meter ───
  const riskMeter = () => {
    const maxScore = 40;
    const pct = computed != null ? Math.min((computed / maxScore) * 100, 100) : 0;
    const isHigh = accCategory === "HIGH_55" || accCategory === "HIGH_70" || accCategory === "HIGH";
    const isMid = accCategory === "INTERMEDIATE" || accCategory === "BORDERLINE";
    return (
      <div className="relative h-4 rounded-full overflow-hidden bg-muted">
        <div
          className="absolute inset-y-0 left-0 rounded-full transition-all duration-500"
          style={{
            width: `${pct}%`,
            background: isHigh
              ? "hsl(var(--destructive))"
              : isMid
              ? "hsl(var(--warning))"
              : "hsl(var(--success))",
          }}
        />
      </div>
    );
  };

  const riskTone =
    accCategory === "HIGH_55" || accCategory === "HIGH_70" || accCategory === "HIGH"
      ? "danger"
      : accCategory === "INTERMEDIATE" || accCategory === "BORDERLINE"
      ? "warning"
      : accCategory === "LOW"
      ? "accent"
      : "neutral";

  const activeMajorCount = RISK_ITEMS.filter(f => f.category === "major" && isItemActive(f)).length;
  const activeEnhancerCount = RISK_ITEMS.filter(f => f.category === "enhancer" && isItemActive(f)).length;
  const activeFhCount = RISK_ITEMS.filter(f => f.category === "fh" && isItemActive(f)).length;

  // ─── Render a single risk item with subitems ───
  const renderRiskItem = (item: RiskItem) => {
    const active = isItemActive(item);
    const expanded = expandedItems.has(item.id);
    const hasSubitems = item.subitems.length > 0;

    return (
      <div key={item.id} className={`rounded-lg border transition-colors ${
        active ? "border-warning/20 bg-warning/5" : "border-border/40"
      }`}>
        {/* Header row: Switch + name + expand */}
        <div className="flex items-start gap-3 p-2.5">
          <Switch
            checked={active}
            onCheckedChange={() => toggleRichItem(item)}
            className="mt-0.5 shrink-0"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className={`text-sm font-medium ${active ? "text-foreground" : "text-muted-foreground"}`}>
                {item.name}
              </span>
              {active && (
                <span className="text-[10px] bg-warning/15 text-warning px-1.5 py-0.5 rounded-full font-semibold">active</span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{item.description}</p>
          </div>
          {hasSubitems && (
            <button
              onClick={() => toggleItem(item.id)}
              className="shrink-0 p-1 rounded-md hover:bg-muted/50 transition-colors"
              title={expanded ? "Collapse details" : "Expand details"}
            >
              {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
            </button>
          )}
        </div>

        {/* Subitems (collapsible) */}
        {hasSubitems && expanded && (
          <div className="border-t border-border/40 px-3 py-2 space-y-1.5">
            {item.subitems.map((si, idx) => (
              <div key={idx} className="rounded-md bg-muted/20 px-2.5 py-1.5">
                <div className="text-xs font-medium text-foreground">{si.name}</div>
                <div className="text-[11px] text-muted-foreground mt-0.5">{si.description}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background px-3 py-4 md:py-8">
      <div className="mx-auto max-w-2xl space-y-5 animate-slide-in">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/")}
          className="gap-1.5"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>

        <div>
          <h1 className="text-xl font-heading font-bold">Lipid Risk Mini</h1>
          <p className="text-sm text-muted-foreground">2026 ACC/AHA · LAI 2023</p>
        </div>

        {/* ── 1. Patient Information ── */}
        <div className="clinical-card p-4">
          <h3 className="section-title mb-3">
            <User className="h-4 w-4 inline mr-1.5" />
            Patient Information
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="mb-1 block text-xs font-semibold text-muted-foreground">Patient Name</label>
              <Input value={patient.name} onChange={e => setPatient({ ...patient, name: e.target.value })} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-muted-foreground">Age</label>
              <Input type="number" inputMode="numeric" value={patient.age} onChange={e => setPatient({ ...patient, age: e.target.value })} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-muted-foreground">Sex</label>
              <Select value={patient.sex} onValueChange={v => setPatient({ ...patient, sex: v as Sex })}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2">
              <label className="mb-2 block text-xs font-semibold text-muted-foreground">Ethnicity</label>
              <RadioGroup
                value={patient.ethnicity}
                onValueChange={v => setPatient({ ...patient, ethnicity: v as Ethnicity })}
                className="grid grid-cols-2 sm:grid-cols-3 gap-2"
              >
                <label className={cn(
                  "flex cursor-pointer items-center gap-2 rounded-lg border-2 px-3 py-2.5 text-sm transition-all",
                  patient.ethnicity === "south_asian"
                    ? "border-amber-500 bg-amber-500/10 ring-1 ring-amber-500/30 font-semibold"
                    : "border-border/60 hover:border-amber-500/40 hover:bg-amber-500/5"
                )}>
                  <RadioGroupItem value="south_asian" className="text-amber-600" />
                  <span>🇮🇳 South Asian</span>
                </label>
                {([["east_asian", "East Asian"], ["white", "White / Caucasian"], ["black", "Black / African"], ["hispanic", "Hispanic / Latino"], ["other", "Other"]] as const).map(([val, label]) => (
                  <label key={val} className={cn(
                    "flex cursor-pointer items-center gap-2 rounded-lg border-2 px-3 py-2.5 text-sm transition-all",
                    patient.ethnicity === val
                      ? "border-primary bg-primary/10 ring-1 ring-primary/30"
                      : "border-border/60 hover:border-primary/40 hover:bg-primary/5"
                  )}>
                    <RadioGroupItem value={val} />
                    <span>{label}</span>
                  </label>
                ))}
              </RadioGroup>
              {southAsian && (
                <div className="mt-2 rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-xs text-amber-700 dark:text-amber-300">
                  <strong>LAI 2023 enabled:</strong> South Asian ethnicity triggers alternative LAI 2023 risk categorisation (Extreme Risk A/B/C) alongside the standard ACC/AHA 2022 consensus recommendation.
                </div>
              )}
            </div>
            <div className="col-span-2">
              <label className="mb-1 block text-xs font-semibold text-muted-foreground">MRN (optional)</label>
              <Input value={patient.mrn} onChange={e => setPatient({ ...patient, mrn: e.target.value })} />
            </div>
          </div>
        </div>

        {/* ── 2. Major Risk Factors ── */}
        <div className="clinical-card p-4">
          <h3 className="section-title mb-3">
            <Heart className="h-4 w-4 inline mr-1.5" />
            Major Risk Factors
          </h3>
          <p className="text-xs text-muted-foreground mb-3">
            Toggle risk factors on/off. Expand each item to see detailed sub-criteria. Auto-detected flags from lab values appear automatically.
          </p>

          {/* Auto-detected flags */}
          {(auto.persistLdl || auto.persistTg || auto.apoBHigh || auto.lpaHigh || auto.ckdEnhancer) && (
            <div className="mb-3 rounded-lg bg-warning/8 px-3 py-2 text-xs border border-warning/20">
              <div className="mb-1 flex items-center gap-1.5 font-semibold text-warning">
                <Sparkles className="h-3.5 w-3.5" />
                Auto-detected from labs
              </div>
              <ul className="ml-1 space-y-0.5 text-foreground">
                {auto.persistLdl && <li>• Persistent primary hypercholesterolemia (LDL ≥160)</li>}
                {auto.persistTg && <li>• Persistent hypertriglyceridemia (TG ≥175)</li>}
                {auto.apoBHigh && <li>• ApoB ≥130 mg/dL</li>}
                {auto.lpaHigh && <li>• Lipoprotein(a) elevated (≥50 mg/dL or ≥125 nmol/L)</li>}
                {auto.ckdEnhancer && <li>• Advanced CKD enhancer (stage {risk.ckdStage.toUpperCase()})</li>}
              </ul>
            </div>
          )}

          <div className="space-y-2">
            {RISK_ITEMS.filter(i => i.category === "major").map(renderRiskItem)}
          </div>

          {/* CKD stage selector (shown when CKD is active) */}
          {risk.ckd && (
            <div className="mt-3 ml-1">
              <label className="mb-1 block text-xs font-semibold text-muted-foreground">CKD Stage</label>
              <Select value={risk.ckdStage} onValueChange={v => setRisk(p => ({ ...p, ckdStage: v as CkdStage }))}>
                <SelectTrigger className="max-w-xs"><SelectValue placeholder="Select stage" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="3a">Stage 3A (eGFR 45–59)</SelectItem>
                  <SelectItem value="3b">Stage 3B (eGFR 30–44)</SelectItem>
                  <SelectItem value="4">Stage 4 (eGFR 15–29)</SelectItem>
                  <SelectItem value="5">Stage 5 (eGFR &lt;15)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Subclinical Atherosclerosis detail (when subclinicalAscvd is active) */}
          {isItemActive(RISK_ITEMS.find(i => i.id === "subclinicalAscvd")!) && (
            <div className="mt-3 ml-1">
              <label className="mb-1 block text-xs font-semibold text-muted-foreground">
                Subclinical Atherosclerosis Type {southAsian ? "(ASCVD-equivalent for South Asians)" : ""}
              </label>
              <Select value={genetic.subclinicalAtherosclerosis || "none"} onValueChange={v => setG("subclinicalAtherosclerosis", v === "none" ? "" : v)}>
                <SelectTrigger className="max-w-xs"><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None specified</SelectItem>
                  {(Object.entries(SUBCLINICAL_LABELS) as [SubclinicalType, string][]).map(([val, lbl]) => (
                    <SelectItem key={val} value={val}>{lbl}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {southAsian && hasSubclinicalAscvd && (
                <p className="mt-1 text-[10px] text-amber-600 dark:text-amber-400">⚠ Treated as ASCVD-equivalent per LAI 2023 — same LDL targets as clinically manifest ASCVD.</p>
              )}
            </div>
          )}
        </div>

        {/* ── 3. Advanced Risk Enhancers ── */}
        <Collapsible open={enhOpen} onOpenChange={setEnhOpen}>
          <CollapsibleTrigger asChild>
            <button className="flex w-full items-center justify-between rounded-lg border border-border bg-muted/30 p-3 text-xs font-semibold text-muted-foreground hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4" />
                <span>Advanced Risk Enhancers</span>
                {activeEnhancerCount > 0 && (
                  <span className="text-xs bg-warning/10 text-warning px-2 py-0.5 rounded-full">{activeEnhancerCount} selected</span>
                )}
              </div>
              <ChevronDown className={`h-4 w-4 transition-transform ${enhOpen ? "rotate-180" : ""}`} />
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2 space-y-2">
            {RISK_ITEMS.filter(i => i.category === "enhancer").map(renderRiskItem)}
          </CollapsibleContent>
        </Collapsible>

        {/* ── 4. Familial Hypercholesterolemia ── */}
        <Collapsible open={fhOpen} onOpenChange={setFhOpen}>
          <CollapsibleTrigger asChild>
            <button className="flex w-full items-center justify-between rounded-lg border border-border bg-muted/30 p-3 text-xs font-semibold text-muted-foreground hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-2">
                <Dna className="w-4 h-4" />
                <span>Familial Hypercholesterolemia</span>
                {activeFhCount > 0 && (
                  <span className="text-xs bg-warning/10 text-warning px-2 py-0.5 rounded-full">{activeFhCount} selected</span>
                )}
              </div>
              <ChevronDown className={`h-4 w-4 transition-transform ${fhOpen ? "rotate-180" : ""}`} />
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2 space-y-2">
            {RISK_ITEMS.filter(i => i.category === "fh").map(renderRiskItem)}

            {/* HeFH/HoFH detail selectors when active */}
            {genetic.heFH !== "" && (
              <div className="ml-1 mt-1">
                <label className="mb-1 block text-xs font-semibold text-muted-foreground">HeFH Status</label>
                <Select value={genetic.heFH} onValueChange={v => setG("heFH", v as HeFHType)}>
                  <SelectTrigger className="max-w-xs"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="without_ascvd">HeFH without ASCVD</SelectItem>
                    <SelectItem value="with_ascvd">HeFH with ASCVD</SelectItem>
                  </SelectContent>
                </Select>
                {genetic.heFH === "without_ascvd" && <p className="mt-1 text-[10px] text-muted-foreground">LAI 2023: Very High Risk — LDL target &lt;50 mg/dL</p>}
                {genetic.heFH === "with_ascvd" && <p className="mt-1 text-[10px] text-amber-600 dark:text-amber-400">LAI 2023: Extreme Risk A — LDL target &lt;50 mg/dL (optional ≤30)</p>}
              </div>
            )}
            {genetic.hoFH !== "" && (
              <div className="ml-1 mt-1">
                <label className="mb-1 block text-xs font-semibold text-muted-foreground">HoFH Status</label>
                <Select value={genetic.hoFH} onValueChange={v => setG("hoFH", v as HoFHType)}>
                  <SelectTrigger className="max-w-xs"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="alone">HoFH alone</SelectItem>
                    <SelectItem value="with_ascvd">HoFH with ASCVD</SelectItem>
                  </SelectContent>
                </Select>
                {genetic.hoFH === "alone" && <p className="mt-1 text-[10px] text-amber-600 dark:text-amber-400">LAI 2023: Extreme Risk A — LDL target &lt;50 mg/dL (optional ≤30)</p>}
                {genetic.hoFH === "with_ascvd" && <p className="mt-1 text-[10px] text-red-600 dark:text-red-400">LAI 2023: Extreme Risk B — LDL target ≤30 mg/dL (mandatory)</p>}
              </div>
            )}
          </CollapsibleContent>
        </Collapsible>

        {/* ── 5. Risk Calculation Inputs ── */}
        <div className="clinical-card p-4">
          <h3 className="section-title mb-3">
            <Calculator className="h-4 w-4 inline mr-1.5" />
            Risk Calculation Inputs
          </h3>

          {/* CAC Score */}
          <div className="mb-4">
            <label className="mb-1 block text-xs font-semibold text-muted-foreground">Coronary Artery Calcium (CAC) Score</label>
            <Input type="number" inputMode="numeric" value={labs.cacScore} onChange={e => setL("cacScore", e.target.value)} placeholder="e.g. 150" className="max-w-xs" />
            {cacN >= 1 && (
              <div className="mt-2 rounded-lg border border-border/60 bg-muted/30 px-3 py-2 text-xs space-y-1">
                <p><strong>CAC Tier:</strong>{" "}
                  {cacN >= 300 ? "Extreme (≥300) → LAI Extreme Risk A"
                    : cacN >= 100 ? "Very High (100–299) → LAI Very High Risk, LDL <50"
                    : cacN >= 1 ? "High (1–99) → LAI High Risk, LDL <70"
                    : "—"}
                </p>
                {cacN >= 1 && cacN < 100 && (
                  <p className="text-muted-foreground">If &lt;75th percentile for age/sex/ethnicity → High Risk (LDL &lt;70). If &gt;75th percentile → Very High Risk (LDL &lt;50).</p>
                )}
              </div>
            )}
          </div>

          {/* Lipid & Metabolic Data */}
          <div className="mb-4">
            <label className="mb-2 block text-xs font-semibold text-muted-foreground">Lipid & Metabolic Data</label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-semibold text-muted-foreground">LDL-C (mg/dL)</label>
                <Input type="number" inputMode="decimal" value={labs.ldl} onChange={e => setL("ldl", e.target.value)} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-muted-foreground">HDL-C (mg/dL)</label>
                <Input type="number" inputMode="decimal" value={labs.hdl} onChange={e => setL("hdl", e.target.value)} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-muted-foreground">Triglycerides (mg/dL)</label>
                <Input type="number" inputMode="decimal" value={labs.tg} onChange={e => setL("tg", e.target.value)} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-muted-foreground">HbA1c (%)</label>
                <Input type="number" inputMode="decimal" value={labs.hba1c} onChange={e => setL("hba1c", e.target.value)} />
              </div>
            </div>

            {/* Advanced lipid markers collapsible */}
            <Collapsible open={advLipidsOpen} onOpenChange={setAdvLipidsOpen} className="mt-3">
              <CollapsibleTrigger asChild>
                <button className="flex w-full items-center justify-between rounded-lg border border-border bg-muted/30 p-2.5 text-xs font-semibold text-muted-foreground hover:bg-muted/50 transition-colors">
                  Advanced lipid markers
                  <ChevronDown className={`h-4 w-4 transition-transform ${advLipidsOpen ? "rotate-180" : ""}`} />
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-muted-foreground">ApoB (mg/dL)</label>
                  <Input type="number" inputMode="decimal" value={labs.apoB} onChange={e => setL("apoB", e.target.value)} />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-muted-foreground">Lp(a) mg/dL</label>
                  <Input type="number" inputMode="decimal" value={labs.lpaMg} onChange={e => setL("lpaMg", e.target.value)} />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-muted-foreground">Lp(a) nmol/L</label>
                  <Input type="number" inputMode="decimal" value={labs.lpaNmol} onChange={e => setL("lpaNmol", e.target.value)} />
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>

          {/* Vitals for Risk Calculation */}
          <div>
            <label className="mb-2 block text-xs font-semibold text-muted-foreground">Vitals for Risk Calculation</label>
            <p className="text-xs text-muted-foreground">Required for 10-year PREVENT risk score. Age, sex, and ethnicity entered above are used for ACC/AHA 2022 and LAI 2023 classification.</p>
          </div>
        </div>

        {/* ── 6. Risk Summary ── */}
        <div className={`clinical-card border-l-4 p-4 ${
          riskTone === "danger" ? "border-l-destructive" :
          riskTone === "warning" ? "border-l-warning" :
          riskTone === "accent" ? "border-l-success" : "border-l-muted"
        }`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              {riskTone === "danger" ? (
                <AlertTriangle className="w-5 h-5 text-destructive" />
              ) : riskTone === "warning" ? (
                <AlertTriangle className="w-5 h-5 text-warning" />
              ) : (
                <CheckCircle className="w-5 h-5 text-success" />
              )}
              <div>
                <h3 className="font-heading font-bold text-lg">{accLabel[accCategory]}</h3>
                <p className="text-xs text-muted-foreground">{activeMajorCount + activeEnhancerCount + activeFhCount} active risk factors</p>
              </div>
            </div>
            <div className="text-right">
              <span className={`text-3xl font-heading font-bold ${
                riskTone === "danger" ? "text-destructive" :
                riskTone === "warning" ? "text-warning" : "text-success"
              }`}>
                {computed != null ? computed.toFixed(1) : "—"}
              </span>
              <span className="text-xs text-muted-foreground block">% 10-yr risk</span>
            </div>
          </div>

          {riskMeter()}
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>Low (&lt;5%)</span>
            <span>Borderline (5–7.4%)</span>
            <span>Intermediate (7.5–19.9%)</span>
            <span>High (≥20%)</span>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="p-2.5 rounded-lg bg-muted/50 text-center">
              <span className="text-xs text-muted-foreground block">ACC/AHA LDL Goal</span>
              <span className={`text-lg font-heading font-bold ${
                riskTone === "danger" ? "text-destructive" :
                riskTone === "warning" ? "text-warning" : "text-success"
              }`}>{accLdlGoal[accCategory]}</span>
            </div>
            <div className="p-2.5 rounded-lg bg-muted/50 text-center">
              <span className="text-xs text-muted-foreground block">Recommended Therapy</span>
              <span className="text-xs font-semibold text-foreground">{accTherapy[accCategory]}</span>
            </div>
          </div>

          {/* LAI 2023 Panel (South Asians) */}
          {southAsian && laiSubclass && (
            <div className="mt-3 rounded-lg border border-amber-500/40 bg-amber-500/5 px-4 py-3">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <span className="text-sm font-bold text-amber-700 dark:text-amber-300">LAI 2023 Classification (South Asian)</span>
              </div>
              <div className="flex items-center gap-2 mb-2">
                <span className="rounded-full bg-amber-600/15 px-3 py-0.5 text-sm font-bold text-amber-700 dark:text-amber-300">{laiSubclass}</span>
                <span className="text-sm font-semibold text-foreground">{LAI_LABEL[laiSubclass]}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div><span className="text-muted-foreground">LDL target: </span><strong className="text-amber-700 dark:text-amber-300">{LAI_LDL[laiSubclass]}</strong></div>
                <div><span className="text-muted-foreground">Therapy: </span><strong className="text-amber-700 dark:text-amber-300">{LAI_THERAPY[laiSubclass]}</strong></div>
              </div>

              {/* Extreme Risk A/B/C reference table */}
              <Collapsible className="mt-2">
                <CollapsibleTrigger asChild>
                  <button className="flex w-full items-center justify-between rounded-md border border-amber-500/20 bg-amber-500/5 px-3 py-1.5 text-xs font-semibold text-amber-700 dark:text-amber-300 hover:bg-amber-500/10 transition-colors">
                    <span className="flex items-center gap-1.5"><Info className="h-3 w-3" /> LAI 2023 Extreme Risk Categories A / B / C</span>
                    <ChevronDown className="h-3.5 w-3.5" />
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-2">
                  <div className="overflow-x-auto rounded-lg border border-border/60">
                    <table className="w-full text-[11px]">
                      <thead>
                        <tr className="border-b border-border/60 bg-muted/50">
                          <th className="text-left px-2 py-1.5 font-semibold text-muted-foreground">Category</th>
                          <th className="text-left px-2 py-1.5 font-semibold text-muted-foreground">Criteria</th>
                          <th className="text-left px-2 py-1.5 font-semibold text-muted-foreground">LDL Target</th>
                          <th className="text-left px-2 py-1.5 font-semibold text-muted-foreground">Therapy</th>
                        </tr>
                      </thead>
                      <tbody>
                        {LAI_EXTREME_TABLE.map(row => (
                          <tr key={row.cat} className={cn("border-b border-border/40", laiSubclass === row.cat && "bg-amber-500/10 font-semibold")}>
                            <td className="px-2 py-1.5 font-bold text-amber-700 dark:text-amber-300">{row.cat}</td>
                            <td className="px-2 py-1.5 text-foreground">{row.criteria}</td>
                            <td className="px-2 py-1.5 text-foreground">{row.ldl}</td>
                            <td className="px-2 py-1.5 text-foreground">{row.therapy}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p className="mt-1.5 text-[10px] text-muted-foreground">Source: Lipid Association of India 2023 Consensus Statement. Puri et al., J Clin Lipidol 2024.</p>
                </CollapsibleContent>
              </Collapsible>
            </div>
          )}

          {/* Key Drivers */}
          <div className="mt-3">
            <div className="flex items-center justify-between">
              <div className="text-xs font-semibold text-muted-foreground">Key Drivers</div>
              <div className="text-[10px] text-muted-foreground">Δ vs. reference patient</div>
            </div>
            {drivers.length === 0 ? (
              <div className="text-muted-foreground text-sm mt-1">Enter age, LDL, HDL and risk factors to see contributions.</div>
            ) : (
              <ul className="mt-1.5 space-y-1">
                {drivers.map(d => {
                  const pos = d.delta >= 0;
                  const mag = Math.min(100, (Math.abs(d.delta) / Math.max(1, Math.abs(drivers[0].delta))) * 100);
                  return (
                    <li key={d.label} className="relative overflow-hidden rounded-md border border-border/60 bg-muted/30 px-2.5 py-1.5">
                      <div aria-hidden className={`absolute inset-y-0 left-0 ${pos ? "bg-danger/10" : "bg-accent/15"}`} style={{ width: `${mag}%` }} />
                      <div className="relative flex items-center justify-between gap-2 text-xs">
                        <span className="flex items-center gap-1.5 text-foreground">
                          {d.label}
                          {d.auto && <span className="rounded bg-warning/15 px-1 py-0.5 text-[9px] font-bold uppercase tracking-wider text-warning">auto</span>}
                        </span>
                        <span className={`font-mono font-semibold ${pos ? "text-danger" : "text-accent"}`}>{pos ? "+" : ""}{d.delta.toFixed(1)}%</span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Lipid Targets Reference */}
          <div className="mt-3">
            <div className="text-xs font-semibold text-muted-foreground mb-2">Lipid Targets by Risk Category</div>
            <img src={lipidTargetGuide.url} alt="Lipid targets guide by risk category — LDL-C and ApoB goals" className="w-full rounded-lg border border-border/60" loading="lazy" />
          </div>
        </div>

        {/* ── 7. Clinical Actions by Risk Level ── */}
        <div className="clinical-card p-4">
          <h3 className="section-title mb-3">
            <Stethoscope className="h-4 w-4 inline mr-1.5" />
            Clinical Actions by Risk Level
          </h3>
          <div className="space-y-3">
            {[
              { level: "Low (<5%)", color: "border-l-success", actions: ["Lifestyle therapy", "Reassess in 4–6 years", "CAC scoring for shared decision-making if borderline"] },
              { level: "Borderline (5–7.4%)", color: "border-l-warning", actions: ["Discuss moderate-intensity statin", "Consider CAC for refinement", "Lifestyle intensification", "Reassess in 1–2 years"] },
              { level: "Intermediate (7.5–19.9%)", color: "border-l-warning", actions: ["Moderate–high-intensity statin", "Consider ezetimibe if LDL not at goal", "CAC scoring if uncertain", "Lifestyle + risk factor control"] },
              { level: "High (≥20%)", color: "border-l-destructive", actions: ["High-intensity statin + ezetimibe", "Consider PCSK9i if LDL not at goal", "LDL <70 mg/dL (1 event, no high-risk)", "LDL <55 mg/dL (multiple events / 1 event + ≥1 high-risk)", "South Asian: LAI 2023 targets apply"] },
            ].map(tier => (
              <div key={tier.level} className={`border-l-4 ${tier.color} pl-3`}>
                <h4 className="text-sm font-medium mb-1">{tier.level}</h4>
                <ul className="text-xs text-muted-foreground space-y-0.5">
                  {tier.actions.map((a, i) => <li key={i}>• {a}</li>)}
                </ul>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-3 italic">
            Based on ACC/AHA 2022 Consensus · LAI 2023 for South Asians · Grundy SM et al., Circulation 2019 · Puri et al., J Clin Lipidol 2024
          </p>
        </div>

        {/* ── 8. EMR Note ── */}
        <div className="clinical-card p-4">
          <h3 className="section-title mb-3">
            <FileText className="h-4 w-4 inline mr-1.5" />
            EMR Note
          </h3>
          <textarea
            value={note}
            readOnly
            className="w-full h-64 rounded-lg border border-input bg-background p-3 text-xs text-foreground font-mono resize-none"
          />
          <Button
            onClick={() => {
              navigator.clipboard.writeText(note);
              toast.success("Note copied to clipboard");
            }}
            className="w-full mt-3 gap-2"
          >
            <ClipboardCopy className="h-4 w-4" />
            Copy to EMR
          </Button>
        </div>
      </div>
    </div>
  );
}
