import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { headerTabClass, headerTabListClass } from "@/lib/header-tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
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
  Heart, AlertTriangle, ShieldCheck, RotateCcw, Activity,
  Printer, Target, Copy, ClipboardCheck, TrendingUp, User,
  TestTube, ChevronDown, Stethoscope, FileText, Home,
  Droplet, Beaker, FlaskConical, Gauge, Ruler, Scale, Waves,
  Wind, Zap, CircleDot, Cigarette, CalendarClock, HeartPulse,
  Dna, Sparkles, Bone, FlameKindling,
  Flame, GitBranch, Network, Layers, Cloud, Bug,
  Donut, Soup, Eye, Repeat, AlertOctagon, Syringe,
  ShieldQuestion,
} from "lucide-react";
import ImageLink from "@/components/ImageLink";
import ZoomableImage from "@/components/ZoomableImage";
import {
  LabInput,
  UNITS_CHOL, UNITS_APOB, UNITS_LPA, UNITS_HBA1C, UNITS_HSCRP,
  UNITS_CREAT, UNITS_CM, UNITS_KG, UNITS_MMHG, UNITS_EGFR,
  type LabTone,
} from "@/components/ui/lab-input";
import { RiskFactorChip } from "@/components/ui/risk-factor-chip";

import heroDoctorImg from "@/assets/hero-doctor.jpg";
import cvRiskImg from "@/assets/cv-risk-measures.png";
import lipidsImg from "@/assets/Lipids Gemini_Generated_Image_4o82814o82814o82.png";
import lipoproteinImg from "@/assets/lipoprotein-particles.png";
import cprFrameworkImg from "@/assets/cpr-framework.png";
import {
  ASCVD_ESTABLISHED, HIGH_CAC_ITEMS, CKD_ITEMS,
  FH_ITEMS, FHX_ITEMS, TOD_MICROVASCULAR, TOD_MACROVASCULAR,
  TOD_ALL, countCheckedItems, type SubItem,
  RISK_MODIFIERS_LAI, HIGH_RISK_FEATURES_LAI,
  RISK_ENHANCERS_2019,
  PMOS_DIAGNOSTIC_CRITERIA, PMOS_ADULT_VS_ADOLESCENT, PMOS_METABOLIC_SCREENING,
} from "@/lib/clinicalConstants";

// ─── Visual mapping: per-item tone + icon for risk-factor chips ───
const RF_VISUALS: Record<string, { tone: LabTone; icon: React.ReactNode }> = {
  ageRisk:  { tone: "amber",   icon: <CalendarClock className="h-4 w-4" /> },
  smoking:  { tone: "orange",  icon: <Cigarette className="h-4 w-4" /> },
  htn:      { tone: "rose",    icon: <HeartPulse className="h-4 w-4" /> },
  lowhdl:   { tone: "violet",  icon: <Droplet className="h-4 w-4" /> },
};

const FEATURE_VISUALS: Record<string, { tone: LabTone; icon: React.ReactNode }> = {
  feat_apob:    { tone: "fuchsia", icon: <Beaker className="h-4 w-4" /> },
  feat_extreme: { tone: "rose",    icon: <Flame className="h-4 w-4" /> },
  feat_lpa:     { tone: "violet",  icon: <Dna className="h-4 w-4" /> },
  feat_mets:    { tone: "amber",   icon: <Layers className="h-4 w-4" /> },
  feat_nafld:   { tone: "lime",    icon: <Soup className="h-4 w-4" /> },
  feat_cacs:    { tone: "indigo",  icon: <CircleDot className="h-4 w-4" /> },
};

// ─── Metabolic Syndrome sub-criteria (≥3 of 5 qualifies — NCEP ATP III / IDF) ───
const METSYN_CRITERIA: SubItem[] = [
  { id: "lc_ms_waist",   label: "Large waistline — >40 in (102 cm) ♂, >35 in (88 cm) ♀ (Asian: >90 cm ♂, >80 cm ♀)" },
  { id: "lc_ms_tg",      label: "High triglycerides — ≥150 mg/dL (1.7 mmol/L) or on TG medication" },
  { id: "lc_ms_hdl",     label: "Low HDL-C — <40 mg/dL ♂, <50 mg/dL ♀ or on HDL medication" },
  { id: "lc_ms_bp",      label: "Elevated BP — ≥130/85 mmHg or on antihypertensive therapy" },
  { id: "lc_ms_glucose", label: "Elevated fasting glucose — ≥100 mg/dL (5.6 mmol/L) or on glucose-lowering therapy" },
];

const MODIFIER_VISUALS_LAI: Record<string, { tone: LabTone; icon: React.ReactNode }> = {
  mod_lpa:        { tone: "violet",  icon: <Dna className="h-4 w-4" /> },
  mod_ifg:        { tone: "amber",   icon: <Donut className="h-4 w-4" /> },
  mod_waist:      { tone: "orange",  icon: <Ruler className="h-4 w-4" /> },
  mod_hscrp:      { tone: "rose",    icon: <FlameKindling className="h-4 w-4" /> },
  mod_tg:         { tone: "fuchsia", icon: <Droplet className="h-4 w-4" /> },
  mod_autoimmune: { tone: "teal",    icon: <Bone className="h-4 w-4" /> },
  mod_pregnancy:  { tone: "rose",    icon: <Sparkles className="h-4 w-4" /> },
  mod_prs:        { tone: "indigo",  icon: <GitBranch className="h-4 w-4" /> },
  mod_pollution:  { tone: "slate",   icon: <Cloud className="h-4 w-4" /> },
  mod_hiv:        { tone: "cyan",    icon: <Bug className="h-4 w-4" /> },
};

const ASCVD_MOD_VISUALS: Record<string, { tone: LabTone; icon: React.ReactNode }> = {
  ascvd:        { tone: "rose",    icon: <HeartPulse className="h-4 w-4" /> },
  polyvascular: { tone: "fuchsia", icon: <Network className="h-4 w-4" /> },
  tod:          { tone: "amber",   icon: <Eye className="h-4 w-4" /> },
  fh:           { tone: "violet",  icon: <Dna className="h-4 w-4" /> },
  familyHistory:{ tone: "sky",     icon: <GitBranch className="h-4 w-4" /> },
  hofh:         { tone: "fuchsia", icon: <Dna className="h-4 w-4" /> },
  subclinical:  { tone: "indigo",  icon: <CircleDot className="h-4 w-4" /> },
  ckd34:        { tone: "teal",    icon: <Activity className="h-4 w-4" /> },
  recurrent50:  { tone: "rose",    icon: <Repeat className="h-4 w-4" /> },
  acs12:        { tone: "orange",  icon: <AlertOctagon className="h-4 w-4" /> },
  sequelae30:   { tone: "rose",    icon: <Syringe className="h-4 w-4" /> },
};

// Tone for nested sub-items, derived from parent modifier
const SUB_TONE_BY_PARENT: Record<string, LabTone> = {
  ascvd: "rose", polyvascular: "fuchsia", tod: "amber", fh: "violet", familyHistory: "sky",
  subclinical: "indigo", ckd34: "teal",
};

import EducationSection from "@/components/calculator/EducationSection";
import { calculatePrevent, type PreventResult } from "@/lib/prevent";

type TabKey = "calculator" | "education";

const TABS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  { key: "calculator", label: "Calculator", icon: <Target className="h-4 w-4" /> },
  { key: "education", label: "Education", icon: <Heart className="h-4 w-4" /> },
];

// ─── Major ASCVD Risk Factors ───
const MAJOR_RF_KEYS = [
  "ageRisk", "smoking", "htn", "lowhdl",
] as const;

const MAJOR_RF_LABELS: Record<string, string> = {
  ageRisk: "Age (Men ≥45y, Women ≥55y)",
  smoking: "Tobacco use: Cigarettes, bidi, paan, gutka, etc.",
  htn: "High blood pressure (≥140/90 or on treatment)",
  lowhdl: "Low HDL-C (Men <40 mg/dL, Women <50 mg/dL)",
};

// ─── ASCVD history & extreme-risk modifiers ───
const MODIFIER_KEYS = [
  "ascvd", "polyvascular",
  "tod", "fh", "familyHistory", "hofh", "subclinical", "ckd34",
  "recurrent50", "acs12", "sequelae30",
] as const;

const MODIFIER_LABELS: Record<string, string> = {
  ascvd: "Established ASCVD",
  polyvascular: "Polyvascular disease (≥2 arterial territories: CAD, cerebrovascular, PAD)",
  tod: "Diabetes target organ damage",
  fh: "Familial hypercholesterolemia",
  familyHistory: "Premature CHD / ASCVD family history",
  hofh: "Homozygous familial hypercholesterolemia",
  subclinical: "High coronary calcium / extensive plaque burden / subclinical high-risk burden",
  ckd34: "CKD stage 3B or 4",
  recurrent50: "Recurrent or progressive events despite LDL-C <50 mg/dL",
  acs12: "Recurrent ACS within 12 months despite being on LDL goal",
  sequelae30: "Ongoing ASCVD sequelae despite LDL-C ≤30 mg/dL and intensive therapy",
};

// Modifiers that have sub-checklists for auto-qualification
const MOD_SUB_MAP: Record<string, { items: SubItem[]; title: string }> = {
  ascvd: { items: ASCVD_ESTABLISHED, title: "Select applicable ASCVD manifestations (≥1 required):" },
  subclinical: { items: HIGH_CAC_ITEMS, title: "Select applicable high CAC / plaque burden findings (≥1 required):" },
  ckd34: { items: CKD_ITEMS, title: "Select CKD stage and albuminuria status (≥1 required):" },
  fh: { items: FH_ITEMS, title: "Select applicable familial hypercholesterolemia criteria (≥1 required):" },
  familyHistory: { items: FHX_ITEMS, title: "Premature CHD / ASCVD: event in a 1st-degree relative before sex-specific age cutoff (≥1 required):" },
};

// Asian BMI classification helper
function getAsianBmiClass(bmiVal: number): { label: string; color: string } {
  if (bmiVal < 18.5) return { label: "Underweight", color: "text-primary" };
  if (bmiVal < 23) return { label: "Normal", color: "text-success" };
  if (bmiVal < 25) return { label: "Overweight (At Risk)", color: "text-warning" };
  if (bmiVal < 27.5) return { label: "Obese I", color: "text-danger" };
  return { label: "Obese II", color: "text-danger" };
}

function getWhoBmiClass(bmiVal: number): { label: string; color: string } {
  if (bmiVal < 18.5) return { label: "Underweight", color: "text-primary" };
  if (bmiVal < 25) return { label: "Normal", color: "text-success" };
  if (bmiVal < 30) return { label: "Overweight", color: "text-warning" };
  return { label: "Obese", color: "text-danger" };
}

function getIndianBmiClass(bmiVal: number): { label: string; color: string } {
  if (bmiVal < 18.5) return { label: "Underweight", color: "text-primary" };
  if (bmiVal < 23) return { label: "Normal", color: "text-success" };
  if (bmiVal < 25) return { label: "Overweight (At Risk)", color: "text-warning" };
  if (bmiVal < 27) return { label: "Obese I", color: "text-danger" };
  return { label: "Obese II", color: "text-danger" };
}

function getBmiClass(bmiVal: number, ethnicity: string): { label: string; color: string } {
  if (ethnicity === "asian") return getAsianBmiClass(bmiVal);
  if (ethnicity === "indian") return getIndianBmiClass(bmiVal);
  return getWhoBmiClass(bmiVal);
}

function getObesityThreshold(ethnicity: string): number {
  if (ethnicity === "asian" || ethnicity === "indian") return 25;
  return 30;
}

// ─── Result buckets ───
interface CategoryResult {
  category: string;
  ldlTarget: string;
  nonHdlTarget: string;
  apoBTarget: string;
  treatment: string[];
  why: string[];
}

const BUCKET_TABLE = [
  { cat: "C", trigger: "Recurrent ASCVD despite LDL ~30", ldl: "Focus on non-LDL factors / specialized care" },
  { cat: "B", trigger: "ASCVD + 2 VHR features, recurrent ACS, or polyvascular", ldl: "Aggressive target" },
  { cat: "A", trigger: "ASCVD + 1 High-Risk feature or CACS ≥300", ldl: "<50 mg/dL" },
  { cat: "VHR", trigger: "DM + TOD, DM + ≥2 major factors, or LDL ≥190", ldl: "<50 mg/dL" },
  { cat: "High", trigger: "≥3 major RF or DM + 0–1 major factor", ldl: "<70 mg/dL" },
  { cat: "Moderate", trigger: "2 major RF or 1 risk modifier", ldl: "<100 mg/dL" },
  { cat: "Low", trigger: "0–1 major RF", ldl: "<100 mg/dL (primary prevention)" },
];

const TREATMENTS: Record<string, string[]> = {
  "Extreme Risk C": [
    "Ultralow LDL-C strategy: maximize statin + ezetimibe + PCSK9 inhibitor",
    "Anti-inflammatory therapy (e.g., colchicine)",
    "Strict control of all other risk factors",
    "Guideline-directed management of comorbidities",
    "Target LDL-C 10–15 mg/dL (residual-risk phenotype)",
  ],
  "Extreme Risk B": [
    "Maximal statin + ezetimibe (often insufficient alone)",
    "PCSK9 inhibitor–based intensification commonly required",
    "Aggressive LDL-C lowering to ≤30 mg/dL",
    "Reinforce lifestyle measures",
  ],
  "Extreme Risk A": [
    "High-intensity statin first",
    "Add ezetimibe if LDL-C target not met",
    "Add PCSK9 inhibitor if combination insufficient",
    "Optional goal ≤30 mg/dL after physician–patient discussion",
    "Reinforce lifestyle measures",
  ],
  "Very High Risk": [
    "High-intensity statin therapy",
    "If LDL-C ≥50 mg/dL → Add ezetimibe",
    "If still ≥50 mg/dL → Consider PCSK9 inhibitor",
    "Reinforce lifestyle measures",
  ],
};

// ─── CKD Stage helper ───
function getCkdStage(egfrVal: number): string {
  if (egfrVal >= 90) return "Stage 1 (≥90)";
  if (egfrVal >= 60) return "Stage 2 (60–89)";
  if (egfrVal >= 45) return "Stage 3A (45–59)";
  if (egfrVal >= 30) return "Stage 3B (30–44)";
  if (egfrVal >= 15) return "Stage 4 (15–29)";
  return "Stage 5 (<15)";
}

// ─── Section tone palette (color-coded cards) ───
type SectionTone = "primary" | "accent" | "danger" | "warning" | "neutral" | "indigo";

const TONE_STYLES: Record<SectionTone, { card: string; header: string; iconWrap: string; title: string; ring: string }> = {
  primary: {
    card: "border-primary/25 bg-primary/[0.04]",
    header: "bg-primary/8 hover:bg-primary/12",
    iconWrap: "bg-primary/15 text-primary",
    title: "text-primary",
    ring: "ring-primary/20",
  },
  accent: {
    card: "border-accent/25 bg-accent/[0.04]",
    header: "bg-accent/8 hover:bg-accent/12",
    iconWrap: "bg-accent/15 text-accent",
    title: "text-accent",
    ring: "ring-accent/20",
  },
  danger: {
    card: "border-danger/25 bg-danger/[0.04]",
    header: "bg-danger/8 hover:bg-danger/12",
    iconWrap: "bg-danger/15 text-danger",
    title: "text-danger",
    ring: "ring-danger/20",
  },
  warning: {
    card: "border-warning/30 bg-warning/[0.05]",
    header: "bg-warning/10 hover:bg-warning/15",
    iconWrap: "bg-warning/20 text-warning",
    title: "text-warning",
    ring: "ring-warning/20",
  },
  indigo: {
    card: "border-[hsl(245_70%_55%)]/25 bg-[hsl(245_70%_55%)]/[0.04]",
    header: "bg-[hsl(245_70%_55%)]/8 hover:bg-[hsl(245_70%_55%)]/12",
    iconWrap: "bg-[hsl(245_70%_55%)]/15 text-[hsl(245_70%_55%)]",
    title: "text-[hsl(245_70%_55%)]",
    ring: "ring-[hsl(245_70%_55%)]/20",
  },
  neutral: {
    card: "border-border bg-card",
    header: "hover:bg-muted/30",
    iconWrap: "bg-muted text-foreground",
    title: "text-foreground",
    ring: "ring-border",
  },
};

// ─── Collapsible Section ───
function Section({
  title,
  icon,
  children,
  defaultOpen = true,
  badge,
  tone = "neutral",
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
  badge?: React.ReactNode;
  tone?: SectionTone;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const t = TONE_STYLES[tone];
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <Card className={`overflow-hidden shadow-sm ${t.card}`}>
        <CollapsibleTrigger className={`flex w-full items-center justify-between px-5 py-3.5 transition-colors ${t.header}`}>
          <div className="flex items-center gap-2.5">
            <span className={`flex h-7 w-7 items-center justify-center rounded-lg ${t.iconWrap}`}>
              {icon}
            </span>
            <h2 className={`font-display text-sm font-bold ${t.title}`}>{title}</h2>
            {badge}
          </div>
          <ChevronDown className={`h-4 w-4 ${t.title} transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="px-5 pb-5 pt-3 bg-card">{children}</div>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}

export default function LipidCalculator() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabKey>("calculator");
  const [prevType, setPrevType] = useState<"primary" | "secondary">("primary");
  // 0 = metric (default), 1 = imperial
  const [unitSystem, setUnitSystem] = useState<0 | 1>(0);

  // ─── Lab inputs ───
  const [age, setAge] = useState("");
  const [sex, setSex] = useState<"male" | "female">("male");
  const [ldl, setLdl] = useState("");
  const [nonhdl, setNonhdl] = useState("");
  const [apob, setApob] = useState("");
  const [lpa, setLpa] = useState("");
  const [hba1c, setHba1c] = useState("");
  const [egfr, setEgfr] = useState("");
  const [creatinine, setCreatinine] = useState("");
  const [egfrAuto, setEgfrAuto] = useState(false);
  const [hscrp, setHscrp] = useState("");
  const [hdl, setHdl] = useState("");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [bmi, setBmi] = useState("");
  const [bmiAuto, setBmiAuto] = useState(false);
  const [waistCirc, setWaistCirc] = useState("");
  const [ethnicity, setEthnicity] = useState<"caucasian" | "asian" | "indian" | "other">("indian");
  // ─── PREVENT inputs ───
  const [sbp, setSbp] = useState("");
  const [totalChol, setTotalChol] = useState("");
  const [bpMed, setBpMed] = useState(false);
  const [onStatin, setOnStatin] = useState(false);

  // ─── Risk factors ───
  const [rfChecked, setRfChecked] = useState<Record<string, boolean>>(
    Object.fromEntries(MAJOR_RF_KEYS.map((k) => [k, false]))
  );
  const [modChecked, setModChecked] = useState<Record<string, boolean>>(
    Object.fromEntries(MODIFIER_KEYS.map((k) => [k, false]))
  );

  // ─── Sub-checklist state for modifier auto-qualification ───
  const [subChecked, setSubChecked] = useState<Record<string, boolean>>({});
  const [subListOpen, setSubListOpen] = useState<Record<string, boolean>>({});
  const [pmosOpen, setPmosOpen] = useState(false);
  
  const toggleSub = (id: string) =>
    setSubChecked((prev) => ({ ...prev, [id]: !prev[id] }));
  
  const toggleSubList = (key: string) =>
    setSubListOpen((prev) => ({ ...prev, [key]: !prev[key] }));

  // Auto-qualification for Major RF "fhx" from FHX sub-items
  const fhxAutoQual = useMemo(() => countCheckedItems(FHX_ITEMS, subChecked) >= 1, [subChecked]);

  useEffect(() => {
    if (fhxAutoQual && !rfChecked.fhx) {
      setRfChecked((prev) => ({ ...prev, fhx: true }));
    }
  }, [fhxAutoQual, rfChecked.fhx]);

  // Auto-qualification: if any sub-item is checked, parent modifier is auto-qualified
  const modAutoQual = useMemo(() => {
    const map: Record<string, boolean> = {};
    for (const [modKey, config] of Object.entries(MOD_SUB_MAP)) {
      map[modKey] = countCheckedItems(config.items, subChecked) >= 1;
    }
    // TOD auto-qual
    map.tod = countCheckedItems(TOD_ALL, subChecked) >= 1;
    return map;
  }, [subChecked]);

  // Auto-sync modChecked when sub-checklists qualify
  useEffect(() => {
    setModChecked((prev) => {
      const next = { ...prev };
      let changed = false;
      for (const [key, qualified] of Object.entries(modAutoQual)) {
        if (qualified && !prev[key]) {
          next[key] = true;
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [modAutoQual]);

  const [copied, setCopied] = useState(false);

  // ─── Auto-derive age risk ───
  useEffect(() => {
    const a = parseFloat(age);
    if (isNaN(a)) return;
    const hit = (sex === "male" && a >= 45) || (sex === "female" && a >= 55);
    setRfChecked((prev) => (prev.ageRisk === hit ? prev : { ...prev, ageRisk: hit }));
  }, [age, sex]);

  // ─── Auto-calculate BMI ───
  useEffect(() => {
    const h = parseFloat(height);
    const w = parseFloat(weight);
    if (isNaN(h) || h <= 0 || isNaN(w) || w <= 0) { setBmiAuto(false); return; }
    const hm = h / 100;
    setBmi((w / (hm * hm)).toFixed(1));
    setBmiAuto(true);
  }, [height, weight]);

  // ─── Auto-derive obesity ───
  useEffect(() => {
    const v = parseFloat(bmi);
    if (isNaN(v)) return;
    const threshold = getObesityThreshold(ethnicity);
    const isObese = v >= threshold;
    setRfChecked((prev) => (prev.obesity === isObese ? prev : { ...prev, obesity: isObese }));
  }, [bmi, ethnicity]);

  // ─── Auto-calculate eGFR (CKD-EPI 2021) ───
  useEffect(() => {
    const cr = parseFloat(creatinine);
    const a = parseFloat(age);
    if (isNaN(cr) || cr <= 0 || isNaN(a) || a <= 0) { setEgfrAuto(false); return; }
    const kappa = sex === "female" ? 0.7 : 0.9;
    const alpha = sex === "female" ? -0.241 : -0.302;
    const sexMul = sex === "female" ? 1.012 : 1.0;
    const calculated = 142 * Math.pow(Math.min(cr / kappa, 1), alpha) * Math.pow(Math.max(cr / kappa, 1), -1.200) * Math.pow(0.9938, a) * sexMul;
    setEgfr(Math.round(calculated).toString());
    setEgfrAuto(true);
  }, [creatinine, age, sex]);

  const egfrVal = parseFloat(egfr);
  const ckdStage = !isNaN(egfrVal) ? getCkdStage(egfrVal) : null;

  // ─── Auto-derive CKD ───
  useEffect(() => {
    const v = parseFloat(egfr);
    if (isNaN(v)) return;
    setRfChecked((prev) => { const val = v < 60; return prev.ckd === val ? prev : { ...prev, ckd: val }; });
    setModChecked((prev) => { const is3b4 = v >= 15 && v < 45; return prev.ckd34 === is3b4 ? prev : { ...prev, ckd34: is3b4 }; });
  }, [egfr]);

  // ─── Auto-derive DM ───
  useEffect(() => {
    const v = parseFloat(hba1c);
    if (!isNaN(v) && v > 7) setRfChecked((prev) => (prev.dm ? prev : { ...prev, dm: true }));
  }, [hba1c]);

  // ─── Auto-derive low HDL ───
  useEffect(() => {
    const v = parseFloat(hdl);
    if (isNaN(v)) return;
    const isLow = sex === "male" ? v < 40 : v < 50;
    setRfChecked((prev) => (prev.lowhdl === isLow ? prev : { ...prev, lowhdl: isLow }));
  }, [hdl, sex]);

  const rfCount = Object.values(rfChecked).filter(Boolean).length;
  const toggleRf = (key: string) => setRfChecked((prev) => ({ ...prev, [key]: !prev[key] }));
  const toggleMod = (key: string) => setModChecked((prev) => ({ ...prev, [key]: !prev[key] }));

  // ─── Classification logic ───
  const [laiModChecked, setLaiModChecked] = useState<Record<string, boolean>>(
    Object.fromEntries(RISK_MODIFIERS_LAI.map(m => [m.id, false]))
  );
  const [laiFeatChecked, setLaiFeatChecked] = useState<Record<string, boolean>>(
    Object.fromEntries(HIGH_RISK_FEATURES_LAI.map(f => [f.id, false]))
  );

  const toggleLaiMod = (id: string) => setLaiModChecked(prev => ({ ...prev, [id]: !prev[id] }));
  const toggleLaiFeat = (id: string) => setLaiFeatChecked(prev => ({ ...prev, [id]: !prev[id] }));

  // ─── Metabolic Syndrome auto-qualification (≥3 of 5) ───
  const metsynCount = useMemo(
    () => countCheckedItems(METSYN_CRITERIA, subChecked),
    [subChecked]
  );
  const metsynQualified = metsynCount >= 3;

  useEffect(() => {
    setLaiFeatChecked((prev) =>
      prev.feat_mets === metsynQualified ? prev : { ...prev, feat_mets: metsynQualified }
    );
  }, [metsynQualified]);

  // ─── 2019 ACC/AHA Risk-Enhancing Factors (Primary Prevention) ───
  // User-driven checkbox state — items are NEVER auto-flipped.
  const [enhChecked, setEnhChecked] = useState<Record<string, boolean>>(
    Object.fromEntries(RISK_ENHANCERS_2019.map(e => [e.id, false]))
  );
  const toggleEnh = (id: string) => setEnhChecked(prev => ({ ...prev, [id]: !prev[id] }));

  // Compute non-binding "suggestions" derived from numeric inputs / sub-lists.
  // These power a "suggested" badge + one-click apply, but never override the user.
  const enhSuggested = useMemo<Record<string, boolean>>(() => {
    const ldlV = parseFloat(ldl);
    const nonhdlV = parseFloat(nonhdl);
    const lpaV = parseFloat(lpa);
    const apobV = parseFloat(apob);
    const egfrV = parseFloat(egfr);
    const hscrpV = parseFloat(hscrp);
    return {
      enh_persistldl:
        (!isNaN(ldlV) && ldlV >= 160 && ldlV <= 189) ||
        (!isNaN(nonhdlV) && nonhdlV >= 190 && nonhdlV <= 219),
      enh_lpa: !isNaN(lpaV) && lpaV >= 50,
      enh_apob: !isNaN(apobV) && apobV >= 130,
      enh_ckd: !isNaN(egfrV) && egfrV >= 15 && egfrV < 60,
      enh_hscrp: !isNaN(hscrpV) && hscrpV >= 2,
      enh_ethnicity: ethnicity === "indian",
      enh_mets: metsynQualified,
      enh_fhx: countCheckedItems(FHX_ITEMS, subChecked) >= 1,
    };
  }, [ldl, nonhdl, lpa, apob, egfr, hscrp, ethnicity, metsynQualified, subChecked]);

  const enhCount = Object.values(enhChecked).filter(Boolean).length;


  // ─── Classification logic (LAI 2023) ───
  const classify = useCallback((): CategoryResult | null => {
    const v = modChecked;
    const ldlVal = parseFloat(ldl);
    const nonhdlVal = parseFloat(nonhdl);
    const rf = rfCount;
    const mods = Object.values(laiModChecked).filter(Boolean).length;
    const feats = Object.values(laiFeatChecked).filter(Boolean).length;
    
    let cat = "", ldlTarget = "", nonHdlTarget = "", apoBTarget = "";
    const why: string[] = [];

    // Reverse order: start from most extreme
    
    // Extreme C
    if (v.sequelae30) {
      cat = "Extreme Risk C"; ldlTarget = "Specialized Care"; nonHdlTarget = "—"; apoBTarget = "—";
      why.push("Recurrent ASCVD event despite LDL-C around 30 mg/dL.");
    } 
    // Extreme B
    else if ((v.ascvd && (feats >= 2)) || v.acs12 || v.polyvascular || v.hofh) {
      cat = "Extreme Risk B"; ldlTarget = "≤ 30 mg/dL"; nonHdlTarget = "≤ 60 mg/dL"; apoBTarget = "< 45 mg/dL";
      if (v.ascvd && feats >= 2) why.push("ASCVD with ≥2 features of very high risk group.");
      if (v.acs12) why.push("Recurrent ACS.");
      if (v.polyvascular) why.push("Polyvascular disease.");
      if (v.hofh) why.push("Homozygous FH.");
    }
    // Extreme A
    else if ((v.ascvd && feats >= 1) || (!isNaN(parseFloat(lpa)) && parseFloat(lpa) >= 300) || v.hofh) { // Note: HoFH is also here in Category A if less severe? Prompt says HoFH in B too.
      // CACS >= 300
      cat = "Extreme Risk A"; ldlTarget = "< 50 mg/dL"; nonHdlTarget = "< 80 mg/dL"; apoBTarget = "< 55 mg/dL";
      why.push("ASCVD with ≥1 High-risk group feature or HoFH.");
    }
    // Very High Risk
    else if ((rfChecked.dm && (v.tod || rf >= 2)) || feats >= 2 || v.ascvd || v.fh || ldlVal >= 190) {
      cat = "Very High Risk"; ldlTarget = "< 50 mg/dL"; nonHdlTarget = "< 80 mg/dL"; apoBTarget = "< 65 mg/dL";
      if (rfChecked.dm && (v.tod || rf >= 2)) why.push("Diabetes with TOD or ≥2 major risk factors.");
      if (feats >= 2) why.push("≥2 High-risk features present.");
      if (v.ascvd) why.push("Established ASCVD.");
      if (v.fh || ldlVal >= 190) why.push("Heterozygous FH or LDL-C ≥190 mg/dL.");
    }
    // High Risk
    else if (rf >= 3 || (ldlVal >= 160 && ldlVal <= 189) || (nonhdlVal >= 190 && nonhdlVal <= 219) || (rfChecked.dm && rf <= 1) || (rf === 2 && mods >= 1) || feats >= 1) {
      cat = "High Risk"; ldlTarget = "< 70 mg/dL"; nonHdlTarget = "< 100 mg/dL"; apoBTarget = "< 80 mg/dL";
      if (rf >= 3) why.push("≥3 major ASCVD risk factors.");
      if (ldlVal >= 160) why.push("LDL-C 160-189 mg/dL.");
      if (rfChecked.dm) why.push("Diabetes with 0-1 major risk factors.");
      if (rf === 2 && mods >= 1) why.push("2 major factors + ≥1 risk modifier.");
      if (feats >= 1) why.push("1 high-risk feature present.");
    }
    // Moderate Risk
    else if (rf === 2 || (ldlVal >= 130 && ldlVal <= 159) || (nonhdlVal >= 160 && nonhdlVal <= 189) || (rf <= 1 && mods >= 1)) {
      cat = "Moderate Risk"; ldlTarget = "< 100 mg/dL"; nonHdlTarget = "< 130 mg/dL"; apoBTarget = "—";
      if (rf === 2) why.push("2 major ASCVD risk factors.");
      if (mods >= 1) why.push("≥1 risk modifier present.");
    }
    // Low Risk
    else if (rf <= 1 || (ldlVal >= 100 && ldlVal <= 129)) {
      cat = "Low Risk"; ldlTarget = "< 100 mg/dL"; nonHdlTarget = "< 130 mg/dL"; apoBTarget = "—";
      why.push("0–1 major ASCVD risk factor.");
    }
    else {
      return null;
    }

    return { category: cat, ldlTarget, nonHdlTarget, apoBTarget, treatment: TREATMENTS[cat] || [], why };
  }, [modChecked, rfChecked, rfCount, lpa, ldl, nonhdl, laiModChecked, laiFeatChecked]);

  const result = classify();

  // ─── PREVENT ───
  const preventResult: PreventResult | null = useMemo(() => {
    const a = parseFloat(age), s = parseFloat(sbp), tc = parseFloat(totalChol), h = parseFloat(hdl), e = parseFloat(egfr), b = parseFloat(bmi);
    if ([a, s, tc, h, e, b].some(isNaN)) return null;
    return calculatePrevent({ age: a, sex, sbp: s, bpMed, totalChol: tc, hdl: h, statin: onStatin, diabetes: rfChecked.dm, smoking: rfChecked.smoking, egfr: e, bmi: b });
  }, [age, sex, sbp, totalChol, hdl, egfr, bmi, bpMed, onStatin, rfChecked.dm, rfChecked.smoking]);

  // ─── EMR Note ───
  const generateNote = useCallback(() => {
    const lines: string[] = [];
    lines.push("LIPID RISK PREDICTOR");
    lines.push("CATEGORY: " + (result?.category || "Lower than VHR / not classifiable"));
    lines.push("LDL-C Target: " + (result?.ldlTarget || "Use standard LAI primary-prevention pathway"));
    lines.push("Non-HDL-C Target: " + (result?.nonHdlTarget || "—"));
    lines.push("ApoB Target: " + (result?.apoBTarget || "—"));
    lines.push("Ref: 2026 ACC/AHA Guideline on Management of Dyslipidemia · LAI 2023 Consensus IV");
    return lines.join("\n");
  }, [result]);

  const copyNote = async () => {
    try {
      await navigator.clipboard.writeText(generateNote());
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  const reset = () => {
    setAge(""); setSex("male"); setLdl(""); setNonhdl(""); setApob(""); setLpa("");
    setHba1c(""); setEgfr(""); setCreatinine(""); setEgfrAuto(false); setHscrp(""); setHdl("");
    setHeight(""); setWeight(""); setBmi(""); setBmiAuto(false); setWaistCirc("");
    setSbp(""); setTotalChol(""); setBpMed(false); setOnStatin(false);
    setRfChecked(Object.fromEntries(MAJOR_RF_KEYS.map((k) => [k, false])));
    setModChecked(Object.fromEntries(MODIFIER_KEYS.map((k) => [k, false])));
    setSubChecked({});
  };

  // ─── Goal checks ───
  const ldlNum = parseFloat(ldl);
  const nonHdlNum = parseFloat(nonhdl);
  const apoBNum = parseFloat(apob);
  const lpaNum = parseFloat(lpa);

  const ldlAtGoal = result && !isNaN(ldlNum) ? (result.category === "Extreme Risk C" ? ldlNum <= 15 : result.category === "Extreme Risk B" ? ldlNum <= 30 : ldlNum < 50) : null;
  const nonHdlAtGoal = result && !isNaN(nonHdlNum) ? (result.category === "Extreme Risk C" ? nonHdlNum <= 40 : result.category === "Extreme Risk B" ? nonHdlNum <= 60 : nonHdlNum < 80) : null;
  const apoBAtGoal = result && !isNaN(apoBNum) ? (result.category === "Extreme Risk C" ? apoBNum < 35 : result.category === "Extreme Risk B" ? apoBNum < 45 : result.category === "Extreme Risk A" ? apoBNum < 55 : apoBNum < 65) : null;

  const catColor = result ? (result.category === "Very High Risk" ? "warning" : "danger") : "muted";

  return (
    <div className="min-h-screen bg-background">
      {/* ─── Sticky Header + Tabs ─── */}
      <div className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="mx-auto max-w-2xl px-4">
          <div className="flex items-center gap-3 py-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 shadow-md">
              <Heart className="h-5 w-5 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="font-display text-xl font-extrabold tracking-tight bg-gradient-to-r from-rose-500 via-pink-500 to-purple-600 bg-clip-text text-transparent truncate">
                Lipid Risk Predictor
              </h1>
              <p className="text-xs font-medium text-indigo-500 dark:text-indigo-400 truncate">
                Cardiovascular Risk Assessment & Management
              </p>
            </div>
            <div className="flex items-center gap-2 no-print shrink-0">
              {preventResult?.valid && (
                <div className={`hidden sm:flex flex-col items-end rounded-lg border px-2.5 py-1 leading-none ${
                  preventResult.category === "High" ? "border-danger/30 bg-danger/5"
                  : preventResult.category === "Intermediate" ? "border-warning/30 bg-warning/5"
                  : preventResult.category === "Borderline" ? "border-primary/30 bg-primary/5"
                  : "border-accent/30 bg-accent/5"
                }`}>
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Risk Index</span>
                  <span className={`font-display text-sm font-bold ${
                    preventResult.category === "High" ? "text-danger"
                    : preventResult.category === "Intermediate" ? "text-warning"
                    : preventResult.category === "Borderline" ? "text-primary"
                    : "text-accent"
                  }`}>{preventResult.riskPct}<span className="text-xs">%</span></span>
                </div>
              )}
              {/* Metric / Imperial toggle */}
              <div className="flex items-center rounded-md border border-border bg-background/60 p-0.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setUnitSystem(0)}
                  className={`px-2 py-1 text-xs font-bold rounded transition-colors ${unitSystem === 0 ? "bg-primary text-white" : "text-muted-foreground hover:text-foreground"}`}
                >
                  Metric
                </button>
                <button
                  type="button"
                  onClick={() => setUnitSystem(1)}
                  className={`px-2 py-1 text-xs font-bold rounded transition-colors ${unitSystem === 1 ? "bg-primary text-white" : "text-muted-foreground hover:text-foreground"}`}
                >
                  Imperial
                </button>
              </div>
              <Button variant="ghost" size="sm" onClick={() => navigate("/")} title="Back to Home">
                <Home className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={reset} title="Reset Form">
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className={`${headerTabListClass} pb-2 overflow-x-auto no-print`}>
            {TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                data-active={activeTab === tab.key}
                className={headerTabClass()}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Hero Image ─── */}
      {activeTab === "calculator" && (
        <div className="w-full overflow-hidden" style={{ maxHeight: "220px" }}>
          <ZoomableImage src={heroDoctorImg} alt="Cardiovascular care" className="w-full object-cover object-top" style={{ maxHeight: "220px" }} />
        </div>
      )}


      {/* ─── Content ─── */}
      <div className="mx-auto max-w-2xl px-4 py-5">
        {activeTab === "calculator" && (
          <div className="space-y-3">
            {/* ── Primary / Secondary Prevention switch ── */}
            <div className={`no-print rounded-xl border-2 p-1 shadow-sm transition-colors ${
              prevType === "primary"
                ? "border-emerald-400 bg-success/10 dark:bg-emerald-950/30"
                : "border-rose-400 bg-destructive/10 dark:bg-rose-950/30"
            }`}>
              <div className="grid grid-cols-2 gap-1">
                <button
                  type="button"
                  onClick={() => setPrevType("primary")}
                  className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-xs font-bold transition-all ${
                    prevType === "primary"
                      ? "bg-gradient-to-br from-emerald-500 to-green-600 text-white shadow-md"
                      : "text-success dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/30"
                  }`}
                >
                  <ShieldCheck className="h-4 w-4" />
                  Primary Prevention
                </button>
                <button
                  type="button"
                  onClick={() => setPrevType("secondary")}
                  className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-xs font-bold transition-all ${
                    prevType === "secondary"
                      ? "bg-gradient-to-br from-rose-500 to-red-600 text-white shadow-md"
                      : "text-rose-700 dark:text-destructive hover:bg-destructive/10 dark:hover:bg-rose-900/30"
                  }`}
                >
                  <HeartPulse className="h-4 w-4" />
                  Secondary Prevention
                </button>
              </div>
              <p className={`px-2 pt-2 pb-1.5 text-center text-sm font-semibold leading-snug ${
                prevType === "primary"
                  ? "text-emerald-800 dark:text-emerald-300"
                  : "text-rose-800 dark:text-rose-300"
              }`}>
                {prevType === "primary"
                  ? "No established ASCVD — uses PREVENT 10-yr risk + risk-factor counting"
                  : "Established ASCVD — auto-classifies VHR / Extreme A·B·C buckets"}
              </p>
            </div>

            {/* Quick Link */}
            <Card className="border-border bg-card p-3.5 no-print">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-display text-xs font-bold text-foreground">ASCVD Risk Assessment & EMR</h3>
                  <p className="text-xs text-muted-foreground">ACC/AHA Primary Prevention</p>
                </div>
                <div className="flex gap-1">
                  <Button variant="outline" size="sm" onClick={() => { 
                    const linesText = `# Lipid Panel Analysis\n${new Date().toLocaleDateString()}\n\nCategory: ${result?.category || "—"}\nLDL-C Target: ${result?.ldlTarget || "—"}\nNon-HDL-C Target: ${result?.nonHdlTarget || "—"}\nApoB Target: ${result?.apoBTarget || "—"}`;
                    navigator.clipboard.writeText(linesText);
                    toast.success('Copied to clipboard!');
                  }} className="gap-1 text-xs h-7">
                    <Copy className="h-3 w-3" /> Copy
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => navigate("/ascvd")} className="gap-1.5 text-xs h-7">
                    Open <Activity className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </Card>

            {/* ── Section 1: Demographics & Anthropometrics ── */}
            <Section title="Demographics & Body Metrics" tone="primary" icon={<User className="h-4 w-4" />}>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-foreground">Age</label>
                  <Input type="number" placeholder="e.g. 55" value={age} onChange={(e) => setAge(e.target.value)} />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-foreground">Sex</label>
                  <select value={sex} onChange={(e) => setSex(e.target.value as "male" | "female")} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground">
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>
              </div>
              <div className="mb-3">
                <label className="mb-1 block text-xs font-semibold text-foreground">Ethnicity</label>
                <Select value={ethnicity} onValueChange={(v) => setEthnicity(v as "caucasian" | "asian" | "indian" | "other")}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select ethnicity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="caucasian">Caucasian</SelectItem>
                    <SelectItem value="asian">Asian</SelectItem>
                    <SelectItem value="indian">Indian</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <LabInput
                  label="Height"
                  tone="sky"
                  icon={<Ruler className="h-3 w-3" />}
                  value={height}
                  onChange={setHeight}
                  units={UNITS_CM}
                  forcedUnitIdx={unitSystem}
                />
                <LabInput
                  label="Weight"
                  tone="teal"
                  icon={<Scale className="h-3 w-3" />}
                  value={weight}
                  onChange={setWeight}
                  units={UNITS_KG}
                  forcedUnitIdx={unitSystem}
                />
                <LabInput
                  label="BMI"
                  tone="emerald"
                  icon={<Gauge className="h-3 w-3" />}
                  value={bmi}
                  onChange={(v) => { setBmi(v); setBmiAuto(false); setHeight(""); setWeight(""); }}
                  units={[{ label: "kg/m²", fromMetric: (n) => n, toMetric: (n) => n, precision: 1, placeholder: "26" }]}
                  auto={bmiAuto}
                  belowInput={(() => {
                    const bmiVal = parseFloat(bmi);
                    if (isNaN(bmiVal) || bmiVal <= 0) return null;
                    const bmiClass = getBmiClass(bmiVal, ethnicity);
                    const threshold = getObesityThreshold(ethnicity);
                    return (
                      <div className="mt-1.5 space-y-1">
                        <p className={`text-xs font-medium ${bmiClass.color}`}>
                          {ethnicity === "caucasian" ? "WHO" : ethnicity.charAt(0).toUpperCase() + ethnicity.slice(1)}: {bmiClass.label} (BMI {bmiVal.toFixed(1)})
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Obesity threshold: ≥{threshold} kg/m²
                        </p>
                      </div>
                    );
                  })()}
                />
              </div>
              {/* BMI Classification Reference — Collapsible */}
              {!isNaN(parseFloat(bmi)) && (
                <Collapsible>
                  <CollapsibleTrigger className="w-full mt-3 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground/70 transition-colors cursor-pointer">
                    <ChevronDown className="h-3.5 w-3.5 transition-transform duration-200 [&[data-state=open]]:rotate-0 -rotate-90 shrink-0" />
                    BMI Classification Criteria (WHO &amp; Asian Guidelines)
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="mt-2 rounded-lg border border-border bg-muted/30 p-3 space-y-3">
                      {/* WHO Standard */}
                      <div>
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1">WHO Standard Criteria</p>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                          {[
                            { range: "<18.5", label: "Underweight", color: "text-primary" },
                            { range: "18.5–24.9", label: "Normal", color: "text-success" },
                            { range: "25–29.9", label: "Overweight", color: "text-warning" },
                            { range: "≥30", label: "Obese", color: "text-danger" },
                          ].map((t) => (
                            <div key={t.label} className={`rounded px-2 py-1.5 bg-muted/50 ${t.color}`}>
                              <span className="font-bold">{t.label}</span><br />
                              <span className="text-muted-foreground">{t.range} kg/m²</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      {/* Asian Criteria */}
                      <div>
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1">Asian-Specific Cut-offs (WHO Asia-Pacific)</p>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                          {[
                            { range: "18.5–22.9", label: "Normal", color: "text-success" },
                            { range: "23–24.9", label: "Overweight", color: "text-warning" },
                            { range: "25–27.4", label: "Obese I", color: "text-danger" },
                            { range: "≥27.5", label: "Obese II", color: "text-danger" },
                          ].map((t) => (
                            <div key={t.label} className={`rounded px-2 py-1.5 bg-muted/50 ${t.color}`}>
                              <span className="font-bold">{t.label}</span><br />
                              <span className="text-muted-foreground">{t.range} kg/m²</span>
                            </div>
                          ))}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1.5 leading-snug">
                          Asian populations face higher metabolic risks at lower BMI. WHO action points: ≥23 (public health), ≥27.5 (high risk).
                        </p>
                      </div>
                      {/* Country Examples */}
                      <div>
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1">Country-Specific Variations</p>
                        <div className="space-y-1 text-xs text-muted-foreground leading-snug">
                          <p>🇮🇳 <strong className="text-foreground">India</strong>: Overweight 23–24.9, Obesity ≥25 kg/m²</p>
                          <p>🇯🇵 <strong className="text-foreground">Japan</strong>: Obesity ≥25 kg/m²</p>
                          <p>🇰🇷 <strong className="text-foreground">Korea</strong>: Overweight/Pre-obese ≥23, Obesity ≥25 kg/m²</p>
                          <p>🇨🇳 <strong className="text-foreground">China</strong>: Overweight ≥24, Obesity ≥28 kg/m²</p>
                        </div>
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              )}

              {/* Waist Circumference */}
              <div className="mt-3 grid grid-cols-2 gap-3 items-end">
                <LabInput
                  label="Waist Circumference"
                  tone="orange"
                  icon={<CircleDot className="h-3 w-3" />}
                  value={waistCirc}
                  onChange={setWaistCirc}
                  units={UNITS_CM}
                  forcedUnitIdx={unitSystem}
                  belowInput={(() => {
                    const wc = parseFloat(waistCirc);
                    if (isNaN(wc) || wc <= 0) return null;
                    const maleHigh = wc >= 90;
                    const femaleHigh = wc >= 80;
                    const isHigh = sex === "male" ? maleHigh : femaleHigh;
                    const threshold = sex === "male" ? "≥90 cm" : "≥80 cm";
                    return (
                      <p className={`mt-1 text-xs font-medium ${isHigh ? "text-danger" : "text-success"}`}>
                        {isHigh ? `⚠ Above Asian cutoff (${threshold})` : `Below Asian cutoff (${threshold})`}
                      </p>
                    );
                  })()}
                />
              </div>

              {/* Waist Circumference Reference — Collapsible */}
              <Collapsible>
                <CollapsibleTrigger className="w-full mt-3 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground/70 transition-colors cursor-pointer">
                  <ChevronDown className="h-3.5 w-3.5 transition-transform duration-200 [&[data-state=open]]:rotate-0 -rotate-90 shrink-0" />
                  Waist Circumference — Asian Cutoffs &amp; Clinical Role
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="mt-2 rounded-lg border border-border bg-muted/30 p-3 space-y-2.5 text-xs text-muted-foreground leading-snug">
                    <p>WC assesses central/abdominal obesity, complementing BMI due to higher visceral fat and metabolic risks at lower BMIs in Asians. Predicts CV and diabetes risks better than BMI alone.</p>
                    <div>
                      <p className="font-bold text-foreground uppercase tracking-wide mb-1">Measurement</p>
                      <p>Midpoint between lower rib margin and iliac crest, midway in axilla, relaxed abdomen. Non-stretch tape at minimal tension. Avoid post-meal.</p>
                    </div>
                    <div>
                      <p className="font-bold text-foreground uppercase tracking-wide mb-1">Asian Cutoffs</p>
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs border-collapse">
                          <thead>
                            <tr className="border-b border-border">
                              <th className="text-left py-1 pr-2 font-bold text-foreground">Population</th>
                              <th className="text-center py-1 px-2 font-bold text-foreground">Men (cm)</th>
                              <th className="text-center py-1 pl-2 font-bold text-foreground">Women (cm)</th>
                            </tr>
                          </thead>
                          <tbody className="text-muted-foreground">
                            <tr className="border-b border-border/50"><td className="py-1 pr-2">🇮🇳 India — Action Level 1</td><td className="text-center py-1 px-2">≥78</td><td className="text-center py-1 pl-2">≥72</td></tr>
                            <tr className="border-b border-border/50"><td className="py-1 pr-2">🇮🇳 India — Action Level 2</td><td className="text-center py-1 px-2">≥90</td><td className="text-center py-1 pl-2">≥80</td></tr>
                            <tr className="border-b border-border/50"><td className="py-1 pr-2">IDF South Asians</td><td className="text-center py-1 px-2">≥90</td><td className="text-center py-1 pl-2">≥80</td></tr>
                            <tr><td className="py-1 pr-2">🇨🇳 Chinese</td><td className="text-center py-1 px-2">≥90</td><td className="text-center py-1 pl-2">≥80</td></tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                    <p>WC identifies abdominal obesity even at "normal" BMI (18.5–22.9) in Asians. Combine with BMI: overweight/obesity if BMI ≥23 or WC above cutoffs.</p>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </Section>

            {/* ── Divider image ── */}
            <div className="rounded-xl overflow-hidden opacity-80 my-1" style={{ maxHeight: "110px" }}>
              <ZoomableImage src={lipidsImg} alt="Lipid particles" className="w-full object-cover object-center" style={{ maxHeight: "110px" }} />
            </div>

            {/* ── Section 2: Lab Values ── */}
            <Section title="Lab Values" tone="indigo" icon={<TestTube className="h-4 w-4" />}>
              <div className="grid grid-cols-3 gap-3 mb-3">
                <LabInput
                  label="LDL-C"
                  tone="rose"
                  icon={<Droplet className="h-3 w-3" />}
                  value={ldl}
                  onChange={setLdl}
                  units={UNITS_CHOL}
                />
                <LabInput
                  label="Non-HDL-C"
                  tone="amber"
                  icon={<Droplet className="h-3 w-3" />}
                  value={nonhdl}
                  onChange={setNonhdl}
                  units={UNITS_CHOL}
                />
                <LabInput
                  label="ApoB"
                  tone="violet"
                  icon={<FlaskConical className="h-3 w-3" />}
                  value={apob}
                  onChange={setApob}
                  units={UNITS_APOB}
                />
              </div>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <LabInput
                  label="Lp(a)"
                  tone="fuchsia"
                  icon={<Beaker className="h-3 w-3" />}
                  value={lpa}
                  onChange={setLpa}
                  units={UNITS_LPA}
                  belowInput={
                    !isNaN(lpaNum) && lpaNum >= 50 ? (
                      <div className="mt-1 flex items-center gap-1 text-xs font-medium text-danger">
                        <AlertTriangle className="h-3 w-3" /> ≥50 → Extreme Risk A
                      </div>
                    ) : null
                  }
                />
                <LabInput
                  label="HbA1c"
                  tone="orange"
                  icon={<Activity className="h-3 w-3" />}
                  value={hba1c}
                  onChange={setHba1c}
                  units={UNITS_HBA1C}
                />
              </div>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <LabInput
                  label="HDL-C"
                  tone="emerald"
                  icon={<Droplet className="h-3 w-3" />}
                  value={hdl}
                  onChange={setHdl}
                  units={UNITS_CHOL}
                />
                <LabInput
                  label="hs-CRP"
                  tone="lime"
                  icon={<Wind className="h-3 w-3" />}
                  value={hscrp}
                  onChange={setHscrp}
                  units={UNITS_HSCRP}
                />
              </div>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <LabInput
                  label="Creatinine"
                  tone="teal"
                  icon={<TestTube className="h-3 w-3" />}
                  value={creatinine}
                  onChange={setCreatinine}
                  units={UNITS_CREAT}
                  hint="Auto-calculates eGFR"
                />
                <LabInput
                  label="eGFR"
                  tone="cyan"
                  icon={<Waves className="h-3 w-3" />}
                  value={egfr}
                  onChange={(v) => { setEgfr(v); setEgfrAuto(false); setCreatinine(""); }}
                  units={UNITS_EGFR}
                  auto={egfrAuto}
                  belowInput={
                    ckdStage ? (
                      <p className={`mt-0.5 text-xs font-medium ${egfrVal < 60 ? "text-danger" : "text-muted-foreground"}`}>
                        CKD {ckdStage}
                      </p>
                    ) : null
                  }
                />
              </div>
              {/* PREVENT-specific */}
              <div className="border-t border-border pt-3 mt-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">PREVENT Calculator Inputs</p>
                <div className="grid grid-cols-2 gap-3 mb-2">
                  <LabInput
                    label="Systolic BP"
                    tone="rose"
                    icon={<Zap className="h-3 w-3" />}
                    value={sbp}
                    onChange={setSbp}
                    units={UNITS_MMHG}
                  />
                  <LabInput
                    label="Total Cholesterol"
                    tone="violet"
                    icon={<Droplet className="h-3 w-3" />}
                    value={totalChol}
                    onChange={setTotalChol}
                    units={UNITS_CHOL}
                  />
                </div>
                <div className="flex flex-wrap gap-4">
                  <label className="flex cursor-pointer items-center gap-2">
                    <Checkbox checked={bpMed} onCheckedChange={() => setBpMed(!bpMed)} />
                    <span className="text-xs text-foreground">On BP medication</span>
                  </label>
                  <label className="flex cursor-pointer items-center gap-2">
                    <Checkbox checked={onStatin} onCheckedChange={() => setOnStatin(!onStatin)} />
                    <span className="text-xs text-foreground">On statin</span>
                  </label>
                </div>
              </div>
            </Section>

            {/* ── Divider image ── */}
            <div className="rounded-xl overflow-hidden opacity-80 my-1" style={{ maxHeight: "110px" }}>
              <ZoomableImage src={cvRiskImg} alt="CV risk measures" className="w-full object-cover object-top" style={{ maxHeight: "110px" }} />
            </div>

            {/* ── Section 3: PREVENT Risk Score (Primary only) ── */}
            {prevType === "primary" && (<>
            {/* ── Section 3: PREVENT Risk Score ── */}
            <Section
              title="AHA PREVENT — 10-Year ASCVD Risk"
              tone="accent"
              icon={<TrendingUp className="h-4 w-4" />}
              defaultOpen={true}
              badge={preventResult?.valid ? (
                <span className={`ml-2 rounded-full px-2 py-0.5 text-xs font-bold ${
                  preventResult.category === "High" ? "bg-danger/15 text-danger"
                  : preventResult.category === "Intermediate" ? "bg-warning/15 text-warning"
                  : preventResult.category === "Borderline" ? "bg-primary/15 text-primary"
                  : "bg-success/15 text-success"
                }`}>
                  {preventResult.riskPct}% — {preventResult.category}
                </span>
              ) : undefined}
            >
              {preventResult?.valid ? (
                <div className="space-y-3">
                  <div className={`rounded-lg px-4 py-3 ${
                    preventResult.category === "High" ? "bg-danger/10"
                    : preventResult.category === "Intermediate" ? "bg-warning/10"
                    : preventResult.category === "Borderline" ? "bg-primary/10"
                    : "bg-success/10"
                  }`}>
                    <span className={`font-display text-2xl font-bold ${
                      preventResult.category === "High" ? "text-danger"
                      : preventResult.category === "Intermediate" ? "text-warning"
                      : preventResult.category === "Borderline" ? "text-primary"
                      : "text-success"
                    }`}>
                      {preventResult.riskPct}%
                    </span>
                    <span className="text-sm text-muted-foreground ml-2">
                      {preventResult.category} Risk
                      {preventResult.category === "Low" && " (<5%)"}
                      {preventResult.category === "Borderline" && " (5–7.5%)"}
                      {preventResult.category === "Intermediate" && " (7.5–20%)"}
                      {preventResult.category === "High" && " (≥20%)"}
                    </span>
                  </div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Recommended Next Steps</p>
                  <ul className="space-y-2">
                    {preventResult.nextSteps.map((step, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-foreground leading-relaxed">
                        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">{i + 1}</span>
                        {step}
                      </li>
                    ))}
                  </ul>
                  <p className="text-xs text-muted-foreground italic">
                    Ref: Khan SS et al. Circulation 2024;149(6):430-449.
                  </p>
                </div>
              ) : preventResult && !preventResult.valid ? (
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Cannot calculate — fix the following:</p>
                  {preventResult.warnings.map((w, i) => (
                    <p key={i} className="text-xs text-danger">• {w}</p>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-2">
                  Enter Age, SBP, Total Cholesterol, HDL-C, eGFR, and BMI to auto-calculate.
                </p>
              )}
            </Section>
            </>)}

            {/* ── Divider ── */}
            <div className="rounded-xl overflow-hidden opacity-75 my-1">
              <ZoomableImage src={lipoproteinImg} alt="Lipoprotein particles" className="w-full object-cover object-center" style={{ maxHeight: "100px" }} />
            </div>

            {/* ── Major RFs + Risk Modifiers (Primary only) ── */}
            {prevType === "primary" && (<>

            {/* ── 2019 ACC/AHA Risk-Enhancing Factors ── */}
            <Section
              title="2019 ACC/AHA Risk-Enhancing Factors"
              tone="indigo"
              icon={<ShieldQuestion className="h-4 w-4" />}
              defaultOpen={
                preventResult?.valid &&
                (preventResult.category === "Borderline" || preventResult.category === "Intermediate")
              }
              badge={<span className="ml-2 rounded-full bg-[hsl(245_70%_55%)]/15 px-2 py-0.5 text-xs font-bold text-[hsl(245_70%_55%)]">
                {enhCount}/{RISK_ENHANCERS_2019.length}
              </span>}
            >
              <p className="mb-3 text-xs text-muted-foreground leading-snug">
                Use these factors to refine therapy decisions when 10-yr ASCVD risk is{" "}
                <strong className="text-foreground">borderline (5–&lt;7.5%)</strong> or{" "}
                <strong className="text-foreground">intermediate (7.5–&lt;20%)</strong>.
                Presence of one or more favors statin initiation or intensification.
                A <strong className="text-foreground">"suggested"</strong> badge appears when an entered value meets the criterion — confirm clinically before checking.
              </p>

              {Array.from(new Set(RISK_ENHANCERS_2019.map(e => e.category))).map((cat) => (
                <div key={cat} className="mb-3">
                  <p className="mb-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">{cat}</p>
                  <div className="space-y-1.5">
                    {RISK_ENHANCERS_2019.filter(e => e.category === cat).map((item) => {
                      const isSuggested = !!enhSuggested[item.id] && !enhChecked[item.id];
                      return (
                        <RiskFactorChip
                          key={item.id}
                          label={item.label}
                          qualifier={item.qualifier}
                          tone="indigo"
                          size="sm"
                          checked={!!enhChecked[item.id]}
                          onToggle={() => toggleEnh(item.id)}
                          rightSlot={isSuggested ? (
                            <span
                              className="rounded-full bg-[hsl(245_70%_55%)]/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[hsl(245_70%_55%)]"
                              title="Your entered value meets this criterion — click the chip to confirm."
                            >
                              suggested
                            </span>
                          ) : undefined}
                        />
                      );
                    })}
                  </div>
                </div>
              ))}

              {/* ── CAC tie-breaker callout ── */}
              {preventResult?.valid &&
               (preventResult.category === "Borderline" || preventResult.category === "Intermediate") && (
                <div className="mt-3 rounded-lg border border-[hsl(245_70%_55%)]/30 bg-[hsl(245_70%_55%)]/5 p-3">
                  <p className="text-xs font-bold text-[hsl(245_70%_55%)] mb-1">
                    Coronary Artery Calcium (CAC) — Tie-Breaker
                  </p>
                  <p className="text-xs text-foreground leading-relaxed">
                    If risk-enhancers do not clarify the decision, obtain a CAC score:
                  </p>
                  <ul className="mt-1.5 space-y-0.5 text-xs text-foreground">
                    <li>• <strong>CAC = 0</strong> → reasonable to defer/avoid statin (reassess in 5–10 y)</li>
                    <li>• <strong>CAC 1–99</strong> → favor statin, especially if age ≥55 y</li>
                    <li>• <strong>CAC ≥100 AU or ≥75th percentile</strong> → initiate statin therapy</li>
                  </ul>
                </div>
              )}
            </Section>

            {/* ── Divider ── */}
            <div className="rounded-xl overflow-hidden opacity-60 my-1">
              <ZoomableImage src={cprFrameworkImg} alt="CPR framework" className="w-full object-cover object-top" style={{ maxHeight: "80px" }} />
            </div>


            {/* ── Section 4: Major ASCVD Risk Factors ── */}
            <Section
              title="Major ASCVD Risk Factors"
              tone="warning"
              icon={<Heart className="h-4 w-4" />}
              badge={<span className="ml-2 rounded-full bg-warning/15 px-2 py-0.5 text-xs font-bold text-warning">{rfCount}/4</span>}
            >
              <p className="mb-3 text-xs text-muted-foreground">Age and Low HDL-C are auto-derived from your inputs.</p>
              <div className="space-y-2">
                {MAJOR_RF_KEYS.map((key) => {
                  const v = RF_VISUALS[key];
                  const isAuto = key === "ageRisk" || key === "lowhdl";
                  return (
                    <RiskFactorChip
                      key={key}
                      label={MAJOR_RF_LABELS[key]}
                      icon={v.icon}
                      tone={v.tone}
                      checked={!!rfChecked[key]}
                      onToggle={() => toggleRf(key)}
                      disabled={isAuto}
                      rightSlot={isAuto ? (
                        <span className="rounded-full bg-primary/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-primary">auto</span>
                      ) : undefined}
                    />
                  );
                })}
              </div>
            </Section>

            {/* ── Divider ── */}
            <div className="rounded-xl overflow-hidden opacity-75 my-1">
              <ZoomableImage src={cprFrameworkImg} alt="CPR framework" className="w-full object-cover object-top" style={{ maxHeight: "100px" }} />
            </div>

            {/* ── Section: High-Risk Features ── */}
            <Section
              title="High-Risk Features"
              tone="danger"
              icon={<AlertTriangle className="h-4 w-4" />}
              badge={<span className="ml-2 rounded-full bg-danger/15 px-2 py-0.5 text-xs font-bold text-danger">
                {Object.values(laiFeatChecked).filter(Boolean).length}/{HIGH_RISK_FEATURES_LAI.length}
              </span>}
            >
              <p className="mb-3 text-xs text-muted-foreground">Indicates a higher categorical risk even at lower RF counts.</p>
              <div className="space-y-2">
                {HIGH_RISK_FEATURES_LAI.map((item) => {
                  const v = FEATURE_VISUALS[item.id] ?? { tone: "rose" as LabTone, icon: <AlertTriangle className="h-4 w-4" /> };
                  const isMets = item.id === "feat_mets";
                  return (
                    <div key={item.id}>
                      <RiskFactorChip
                        label={item.label}
                        qualifier={item.qualifier}
                        icon={v.icon}
                        tone={v.tone}
                        checked={!!laiFeatChecked[item.id]}
                        onToggle={() => toggleLaiFeat(item.id)}
                        disabled={isMets}
                        rightSlot={isMets ? (
                          <span className={`rounded px-1.5 py-0.5 text-xs font-bold ${
                            metsynQualified ? "bg-warning/15 text-warning" : "bg-muted text-muted-foreground"
                          }`}>
                            {metsynCount}/5 — {metsynQualified ? "Qualified ✓" : "≥3 required"}
                          </span>
                        ) : undefined}
                      />
                      {isMets && (
                        <Collapsible
                          open={subListOpen.feat_mets}
                          onOpenChange={() => toggleSubList("feat_mets")}
                          className="ml-8 mt-2 mb-1"
                        >
                          <CollapsibleTrigger asChild>
                            <button className="flex w-full items-center justify-between rounded-lg border border-border bg-muted/30 p-3 hover:bg-muted/50 transition-colors">
                              <span className="text-xs font-semibold text-muted-foreground">
                                Metabolic Syndrome Criteria ({metsynCount}/5)
                              </span>
                              <ChevronDown className={`h-4 w-4 transition-transform ${subListOpen.feat_mets ? "rotate-180" : ""}`} />
                            </button>
                          </CollapsibleTrigger>
                          <CollapsibleContent className="space-y-1.5 rounded-b-lg border-x border-b border-border bg-muted/30 p-3 pt-0">
                            <p className="text-xs text-muted-foreground leading-snug">
                              ≥3 of 5 criteria qualifies as <strong className="text-foreground">Metabolic Syndrome</strong> (NCEP ATP III / IDF).
                            </p>
                            {METSYN_CRITERIA.map((crit) => (
                              <RiskFactorChip
                                key={crit.id}
                                label={crit.label}
                                tone="amber"
                                size="sm"
                                checked={!!subChecked[crit.id]}
                                onToggle={() => toggleSub(crit.id)}
                              />
                            ))}
                          </CollapsibleContent>
                        </Collapsible>
                      )}
                    </div>
                  );
                })}
              </div>
            </Section>

            {/* ── Divider ── */}
            <div className="rounded-xl overflow-hidden opacity-75 my-1">
              <ZoomableImage src={cvRiskImg} alt="CV risk measures" className="w-full object-cover object-top" style={{ maxHeight: "100px" }} />
            </div>

            {/* ── Section: Risk Modifiers ── */}
            <Section
              title="Risk Modifiers"
              tone="primary"
              icon={<ShieldCheck className="h-4 w-4" />}
              badge={<span className="ml-2 rounded-full bg-primary/15 px-2 py-0.5 text-xs font-bold text-primary">
                {Object.values(laiModChecked).filter(Boolean).length}/{RISK_MODIFIERS_LAI.length}
              </span>}
            >
              <p className="mb-3 text-xs text-muted-foreground">Modifiers that can upgrade Low to Moderate or Moderate to High Risk.</p>
              <div className="space-y-2">
                {RISK_MODIFIERS_LAI.map((item) => {
                  const v = MODIFIER_VISUALS_LAI[item.id] ?? { tone: "sky" as LabTone, icon: <ShieldCheck className="h-4 w-4" /> };
                  const isPmos = item.id === "mod_pregnancy";
                  return (
                    <div key={item.id}>
                      <RiskFactorChip
                        label={item.label}
                        qualifier={item.qualifier}
                        icon={v.icon}
                        tone={v.tone}
                        checked={!!laiModChecked[item.id]}
                        onToggle={() => toggleLaiMod(item.id)}
                      />
                      {isPmos && (
                        <Collapsible open={pmosOpen} onOpenChange={setPmosOpen} className="ml-8 mt-2 mb-1">
                          <CollapsibleTrigger asChild>
                            <button className="flex w-full items-center justify-between rounded-lg border border-border bg-muted/30 p-3 hover:bg-muted/50 transition-colors">
                              <span className="text-xs font-semibold text-muted-foreground">
                                PMOS Diagnostic Criteria (2026 Lancet Consensus)
                              </span>
                              <ChevronDown className={`h-4 w-4 transition-transform ${pmosOpen ? "rotate-180" : ""}`} />
                            </button>
                          </CollapsibleTrigger>
                          <CollapsibleContent className="space-y-3 rounded-b-lg border-x border-b border-border bg-muted/30 p-3 pt-2">
                            <p className="text-xs text-muted-foreground leading-snug">
                              The PMOS (Polyendocrine Metabolic Ovarian Syndrome) diagnostic framework maintains the core "two-out-of-three" Rotterdam structure with updated biochemical thresholds and follicle counting. At least two of three criteria must be met <strong className="text-foreground">after excluding other mimics</strong> (thyroid disease, hyperprolactinemia, non-classic CAH).
                            </p>
                            {PMOS_DIAGNOSTIC_CRITERIA.map((criterion) => (
                              <div key={criterion.id}>
                                <p className="text-xs font-bold text-rose-700 dark:text-destructive uppercase tracking-wide mb-1.5">
                                  {criterion.title}
                                </p>
                                <ul className="space-y-1">
                                  {criterion.subCriteria.map((sub, i) => (
                                    <li key={i} className="flex items-start gap-2 text-xs text-foreground leading-snug">
                                      <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-rose-400 mt-[5px]" />
                                      {sub.label}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            ))}

                            {/* Adult vs Adolescent Comparison */}
                            <div>
                              <p className="text-xs font-bold text-rose-700 dark:text-destructive uppercase tracking-wide mb-1.5">
                                Adult vs. Adolescent Criteria
                              </p>
                              <div className="overflow-x-auto">
                                <table className="w-full text-xs border-collapse">
                                  <thead>
                                    <tr className="border-b border-border">
                                      <th className="text-left py-1 pr-2 font-bold text-foreground">Feature</th>
                                      <th className="text-center py-1 px-2 font-bold text-foreground">Adult (PMOS)</th>
                                      <th className="text-center py-1 pl-2 font-bold text-foreground">Adolescent</th>
                                    </tr>
                                  </thead>
                                  <tbody className="text-muted-foreground">
                                    {PMOS_ADULT_VS_ADOLESCENT.map((row, i) => (
                                      <tr key={i} className="border-b border-border/50 last:border-0">
                                        <td className="py-1 pr-2 font-medium text-foreground">{row.feature}</td>
                                        <td className="text-center py-1 px-2">{row.adult}</td>
                                        <td className="text-center py-1 pl-2">{row.adolescent}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>

                            {/* Metabolic Screening */}
                            <div>
                              <p className="text-xs font-bold text-rose-700 dark:text-destructive uppercase tracking-wide mb-1.5">
                                Metabolic Screening (M Severity)
                              </p>
                              <p className="text-xs text-muted-foreground mb-1.5">
                                Required to categorize Metabolic severity, though not strictly diagnostic.
                              </p>
                              <ul className="space-y-1">
                                {PMOS_METABOLIC_SCREENING.map((item, i) => (
                                  <li key={i} className="flex items-start gap-2 text-xs text-foreground leading-snug">
                                    <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400 mt-[5px]" />
                                    {item}
                                  </li>
                                ))}
                              </ul>
                            </div>

                            {/* PMOS Biochemical Evaluation Image */}
                            <div className="mt-2">
                              <ImageLink imageId="pmos-dx-eval" label="View PMOS Diagnostic Evaluation →" />
                            </div>

                            <p className="text-xs text-muted-foreground italic border-t border-border pt-2">
                              Ref: 2026 Lancet Consensus on PMOS Diagnostic Framework
                            </p>
                          </CollapsibleContent>
                        </Collapsible>
                      )}
                    </div>
                  );
                })}
              </div>
            </Section>
            </>)}

            {/* ── ASCVD History (Secondary only) ── */}
            {prevType === "secondary" && (<>
            {/* ── Divider ── */}
            <div className="rounded-xl overflow-hidden opacity-75 my-1">
              <ZoomableImage src={lipidsImg} alt="Lipid particles" className="w-full object-cover object-center" style={{ maxHeight: "100px" }} />
            </div>

            {/* ── Section 5: ASCVD History & Modifiers ── */}
            <Section
              title="ASCVD History & Extreme-Risk Modifiers"
              tone="danger"
              icon={<Stethoscope className="h-4 w-4" />}
            >
              <p className="mb-3 text-xs text-muted-foreground">
                Tick all that apply. Auto-classifies C → B → A → VHR.
              </p>
              <div className="space-y-2.5">
                {MODIFIER_KEYS.map((key) => {
                  const hasSubMap = key in MOD_SUB_MAP;
                  const hasTod = key === "tod";
                  const isAutoQualified = modAutoQual[key];
                  const subConfig = MOD_SUB_MAP[key];

                  const v = ASCVD_MOD_VISUALS[key] ?? { tone: "rose" as LabTone, icon: <Stethoscope className="h-4 w-4" /> };
                  const subCountBadge = (hasSubMap || hasTod) ? (() => {
                    const items = hasTod ? TOD_ALL : subConfig!.items;
                    const count = countCheckedItems(items, subChecked);
                    const qualified = isAutoQualified;
                    return (
                      <span className={`rounded px-1.5 py-0.5 text-xs font-bold ${
                        qualified ? "bg-warning/15 text-warning" : "bg-muted text-muted-foreground"
                      }`}>
                        {count}/{items.length} — {qualified ? "Qualified ✓" : "≥1 required"}
                      </span>
                    );
                  })() : undefined;

                  return (
                    <div key={key}>
                      <RiskFactorChip
                        label={MODIFIER_LABELS[key]}
                        icon={v.icon}
                        tone={v.tone}
                        checked={!!modChecked[key]}
                        onToggle={() => toggleMod(key)}
                        disabled={!!isAutoQualified}
                        rightSlot={subCountBadge}
                      />

                      {/* Sub-checklists */}
                      {hasSubMap && (
                        <Collapsible open={subListOpen[key]} onOpenChange={() => toggleSubList(key)} className="ml-8 mt-2 mb-1">
                          <CollapsibleTrigger asChild>
                            <button className="flex w-full items-center justify-between rounded-lg border border-border bg-muted/30 p-3 hover:bg-muted/50 transition-colors">
                              <span className="text-xs font-semibold text-muted-foreground">
                                {subConfig!.title.split("(")[0].trim()} ({countCheckedItems(subConfig!.items, subChecked)}/{subConfig!.items.length})
                              </span>
                              <ChevronDown className={`h-4 w-4 transition-transform ${subListOpen[key] ? "rotate-180" : ""}`} />
                            </button>
                          </CollapsibleTrigger>
                          <CollapsibleContent className="space-y-1.5 rounded-b-lg border-x border-b border-border bg-muted/30 p-3 pt-0">
                            {key === "familyHistory" && (
                              <p className="text-xs text-muted-foreground leading-snug">
                                "Premature" = CHD or atherosclerotic CVD event in a <strong className="text-foreground">male &lt;55 y</strong> or <strong className="text-foreground">female &lt;65 y</strong>. Includes MI, coronary revascularization, angina, ischemic stroke, or PAD.
                              </p>
                            )}
                            {subConfig!.items.map((item) => (
                              <RiskFactorChip
                                key={item.id}
                                label={item.label}
                                qualifier={item.qualifier}
                                tone={SUB_TONE_BY_PARENT[key] ?? "amber"}
                                size="sm"
                                checked={!!subChecked[item.id]}
                                onToggle={() => toggleSub(item.id)}
                              />
                            ))}
                          </CollapsibleContent>
                        </Collapsible>
                      )}

                      {/* TOD sub-checklist */}
                      {hasTod && (
                        <Collapsible open={subListOpen.tod} onOpenChange={() => toggleSubList("tod")} className="ml-8 mt-2 mb-1">
                          <CollapsibleTrigger asChild>
                            <button className="flex w-full items-center justify-between rounded-lg border border-border bg-muted/30 p-3 hover:bg-muted/50 transition-colors">
                              <span className="text-xs font-semibold text-muted-foreground">
                                Target Organ Damage Criteria ({countCheckedItems(TOD_ALL, subChecked)}/${TOD_ALL.length})
                              </span>
                              <ChevronDown className={`h-4 w-4 transition-transform ${subListOpen.tod ? "rotate-180" : ""}`} />
                            </button>
                          </CollapsibleTrigger>
                          <CollapsibleContent className="space-y-3 rounded-b-lg border-x border-b border-border bg-muted/30 p-3 pt-0">
                            {([
                              { title: "Microvascular", items: TOD_MICROVASCULAR },
                              { title: "Macrovascular / Cardiac", items: TOD_MACROVASCULAR },
                            ] as const).map(({ title, items }) => (
                              <div key={title}>
                                <p className="text-xs font-bold text-warning/80 uppercase tracking-wide mb-1.5">{title}</p>
                                <div className="space-y-1.5">
                                   {items.map((tod) => (
                                     <RiskFactorChip
                                       key={tod.id}
                                       label={tod.label}
                                       qualifier={tod.qualifier}
                                       tone={title === "Microvascular" ? "amber" : "rose"}
                                       size="sm"
                                       checked={!!subChecked[tod.id]}
                                       onToggle={() => toggleSub(tod.id)}
                                     />
                                   ))}
                                </div>
                              </div>
                            ))}
                          </CollapsibleContent>
                        </Collapsible>
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="mt-3 rounded-lg bg-muted/50 px-3 py-2">
                <p className="text-xs text-muted-foreground">
                  <span className="font-semibold text-foreground">Polyvascular disease:</span> Atherosclerosis in ≥2 major arterial territories — coronary (CAD), cerebrovascular (ischemic stroke/TIA), and/or peripheral arterial disease (PAD).
                </p>
              </div>
            </Section>
            </>)}
            {/* ── Section 6: Classification Result ── */}
            <Card className={`border-border bg-card overflow-hidden`}>
              <div className={`px-5 py-4 ${result ? (catColor === "warning" ? "bg-warning/10" : "bg-danger/10") : "bg-muted/30"}`}>
                <div className="flex items-center justify-between">
                  <div className={`flex items-center gap-2 font-display font-bold ${result ? (catColor === "warning" ? "text-warning" : "text-danger") : "text-muted-foreground"}`}>
                    {result ? <AlertTriangle className="h-5 w-5" /> : <ShieldCheck className="h-5 w-5" />}
                    {result ? result.category : "Unclassified"}
                  </div>
                  {result && (
                    <Button variant="ghost" size="sm" className="no-print" onClick={() => window.print()}>
                      <Printer className="h-4 w-4 mr-1" /> Print
                    </Button>
                  )}
                </div>
              </div>
              <div className="p-5 space-y-4">
                {result ? (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {[
                        { label: "LDL-C Target", value: result.ldlTarget },
                        { label: "Non-HDL-C Target", value: result.nonHdlTarget },
                        { label: "ApoB Target", value: result.apoBTarget },
                      ].map((t) => (
                        <div key={t.label}>
                          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t.label}</p>
                          <p className="mt-1 font-display text-lg font-bold text-foreground">{t.value}</p>
                        </div>
                      ))}
                    </div>
                    {(ldlAtGoal !== null || nonHdlAtGoal !== null || apoBAtGoal !== null) && (
                      <div className="space-y-2">
                        {ldlAtGoal !== null && <GoalIndicator label={`LDL-C (${ldl} mg/dL)`} atGoal={ldlAtGoal} />}
                        {nonHdlAtGoal !== null && <GoalIndicator label={`Non-HDL-C (${nonhdl} mg/dL)`} atGoal={nonHdlAtGoal} />}
                        {apoBAtGoal !== null && <GoalIndicator label={`ApoB (${apob} mg/dL)`} atGoal={apoBAtGoal} />}
                      </div>
                    )}
                    {result.why.length > 0 && (
                      <div className="rounded-lg bg-muted/50 px-4 py-3 space-y-1">
                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Rationale</p>
                        {result.why.map((w, i) => <p key={i} className="text-sm text-foreground">{w}</p>)}
                      </div>
                    )}
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Treatment Algorithm</p>
                      <ul className="space-y-2">
                        {result.treatment.map((step, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">{i + 1}</span>
                            {step}
                          </li>
                        ))}
                      </ul>
                    </div>
                    {result.category === "Extreme Risk A" && (
                      <p className="text-xs text-muted-foreground italic">*The LDL-C goal of ≤30 mg/dL must be pursued after detailed risk–benefit discussion.</p>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-2">Enter data or tick criteria to classify the patient.</p>
                )}
              </div>
            </Card>

            {/* ── Divider ── */}
            <div className="rounded-xl overflow-hidden opacity-75 my-1">
              <ZoomableImage src={cprFrameworkImg} alt="CPR framework" className="w-full object-cover object-top" style={{ maxHeight: "100px" }} />
            </div>

            {/* ── Section 7: Decision Logic ── */}
            <Section title="Decision Logic & Bucket Summary" tone="neutral" icon={<Target className="h-4 w-4" />} defaultOpen={false}>
              <ol className="list-decimal ml-5 space-y-1 text-sm text-foreground mb-4">
                <li>Check Category C first: ongoing ASCVD sequelae despite LDL-C ≤30 and intensive therapy.</li>
                <li>Then Category B: CAD plus very-high-risk features or recurrent events despite LDL-C &lt;50.</li>
                <li>Then Category A: ASCVD or equivalent burden with diabetes, FH, CKD, Lp(a), stroke, PAD, polyvascular disease, or high calcium/plaque burden.</li>
                <li>If not extreme-risk, label Very High Risk when established ASCVD, homozygous FH, or diabetes with ≥3 major RF / target-organ damage is present.</li>
              </ol>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="py-2 pr-3 text-left text-xs font-semibold text-muted-foreground">Category</th>
                      <th className="py-2 pr-3 text-left text-xs font-semibold text-muted-foreground">Main Trigger</th>
                      <th className="py-2 text-left text-xs font-semibold text-muted-foreground">LDL-C Target</th>
                    </tr>
                  </thead>
                  <tbody>
                    {BUCKET_TABLE.map((row) => (
                      <tr key={row.cat} className="border-b border-border last:border-0">
                        <td className="py-2 pr-3 font-bold text-foreground">{row.cat}</td>
                        <td className="py-2 pr-3 text-foreground">{row.trigger}</td>
                        <td className="py-2 font-semibold text-foreground">{row.ldl}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Section>

            {/* ── Divider ── */}
            <div className="rounded-xl overflow-hidden opacity-75 my-1">
              <ZoomableImage src={cvRiskImg} alt="CV risk measures" className="w-full object-cover object-top" style={{ maxHeight: "100px" }} />
            </div>

            {/* ── Section 8: EMR Note ── */}
            <Section title="EMR Note" tone="indigo" icon={<FileText className="h-4 w-4" />}>
              <textarea
                readOnly
                value={generateNote()}
                className="w-full min-h-[180px] resize-y rounded-lg border border-border bg-muted/30 p-3 text-sm text-foreground font-mono"
              />
              <div className="flex gap-3 mt-3">
                <Button onClick={copyNote} className="gap-1.5">
                  {copied ? <ClipboardCheck className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copied ? "Copied" : "Copy Note"}
                </Button>
                <Button onClick={reset} variant="outline" className="gap-1.5">
                  <RotateCcw className="h-4 w-4" /> Reset
                </Button>
              </div>
            </Section>
          </div>
        )}

        {activeTab === "education" && <EducationSection />}

        <p className="mt-8 text-center text-xs text-muted-foreground pb-6">
          Reference: 2026 ACC/AHA Guideline on Management of Dyslipidemia · LAI 2023 Consensus IV
        </p>
      </div>
    </div>
  );
}

function GoalIndicator({ label, atGoal }: { label: string; atGoal: boolean }) {
  return (
    <div className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium ${atGoal ? "bg-success/10 text-success" : "bg-danger/10 text-danger"}`}>
      {atGoal ? <ShieldCheck className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
      {label} — {atGoal ? "At goal" : "Above target"}
    </div>
  );
}
