import { useState, useMemo, useEffect } from "react";
import { AbbreviationHover } from "@/components/AbbreviationHover";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  ChevronDown, ClipboardCopy, TrendingUp, User, Heart,
  AlertTriangle, Target, Dna, Scale, Stethoscope, ArrowRight, BookOpen, Calculator,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SectionCard } from "@/components/ui/section-card";
import { toast } from "sonner";
import { calculatePrevent, type PreventResult } from "@/lib/prevent";
import type { LAIResult } from "./LipidsTab";
import ImageLink from "@/components/ImageLink";

// ─── LAI 2023 Classification ───
const MODIFIER_GROUPS = [
  {
    title: "Established ASCVD",
    icon: <Heart className="h-4 w-4" />,
    items: [
      { id: "ascvd_cad", label: "Coronary artery disease", qualifier: "Prior MI, CABG, PCI, or ≥50% stenosis" },
      { id: "ascvd_cva", label: "Cerebrovascular disease", qualifier: "Ischemic stroke, TIA, carotid revascularization" },
      { id: "ascvd_pad", label: "Peripheral arterial disease", qualifier: "ABI <0.9, claudication, prior revascularization" },
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
      { id: "enh_pcos", label: "Premature menopause / PMOS / Pre-eclampsia", qualifier: "Women-specific", dxCriteria: "Rotterdam: ≥2 of 3: oligovulation, hyperandrogenism, polycystic ovaries" },
    ],
  },
];

// ─── Classification engine ───
function classifyLAI(
  checked: Record<string, boolean>,
  age: number, ldl: number
): { cat: "EHR" | "VHR" | "HR" | "MOD" | "LOW"; sub: "A" | "B" | "C" | ""; label: string } {
  const h = (id: string) => !!checked[id];

  const hasASCVD = h("ascvd_cad") || h("ascvd_cva") || h("ascvd_pad");
  const hasDMTOD = h("dmtod_retinopathy") || h("dmtod_nephropathy") || h("dmtod_neuropathy");
  const hasCKD = h("ckd_3b") || h("ckd_4") || h("ckd_albuminuria");
  const hasFH = h("fh_clinical") || h("fh_genetic") || h("fh_xanthoma");

  const hrfCount = ["hrf_lpa", "hrf_apob", "hrf_mets", "hrf_cac", "hrf_nafld", "hrf_extreme"].filter(k => h(k)).length;
  const enhCount = ["enh_fhx", "enh_hscrp", "enh_lpa_minor", "enh_autoimmune", "enh_hiv", "enh_pcos"].filter(k => h(k)).length;

  if (hasASCVD) {
    if (hrfCount >= 2) return { cat: "EHR", sub: "C", label: "Extreme High Risk C" };
    if (hrfCount === 1 || (h("ascvd_cad") && (h("ascvd_cva") || h("ascvd_pad")))) return { cat: "EHR", sub: "B", label: "Extreme High Risk B" };
    return { cat: "EHR", sub: "A", label: "Extreme High Risk A" };
  }
  if (hasDMTOD && (hrfCount >= 1 || enhCount >= 2)) return { cat: "VHR", sub: "C", label: "Very High Risk C" };
  if (hasDMTOD) return { cat: "VHR", sub: "B", label: "Very High Risk B" };
  if (hasCKD || hasFH || ldl >= 190) return { cat: "VHR", sub: "C", label: "Very High Risk C" };
  if (enhCount >= 3) return { cat: "HR", sub: "", label: "High Risk" };
  if (h("enh_fhx") && (enhCount >= 2 || hrfCount >= 1)) return { cat: "HR", sub: "", label: "High Risk" };
  if (age >= 40 && (enhCount >= 2 || hrfCount >= 1)) return { cat: "HR", sub: "", label: "High Risk" };
  if (age >= 40 && enhCount >= 1) return { cat: "MOD", sub: "", label: "Moderate Risk" };
  if (ldl >= 130) return { cat: "MOD", sub: "", label: "Moderate Risk" };
  return { cat: "LOW", sub: "", label: "Low Risk" };
}

const BUCKET_DETAILS: Record<string, { ldl: string; nonHdl: string; apoB: string; intensity: string; drug: string }> = {
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

// ─── Treatment recommendations per category ───
const TREATMENT_RECS: Record<string, { title: string; drug: string; rationale: string; followUp: string; alternative: string }> = {
  "EHR-A": { title: "High-Intensity Statin + Ezetimibe", drug: "Atorvastatin 40-80 mg OD or Rosuvastatin 20-40 mg OD + Ezetimibe 10 mg OD", rationale: "ASCVD alone or with minor risk features. Dual therapy achieves ~55-65% LDL reduction, targeting <50 mg/dL.", followUp: "Recheck lipids at 6 weeks. If LDL >50, add PCSK9i (Evolocumab 140 mg SC q2w / Alirocumab 75-150 mg SC q2w).", alternative: "If intolerant: Rosuvastatin 5-10 mg + Ezetimibe + Bempedoic acid 180 mg OD" },
  "EHR-B": { title: "Maximal Lipid-Lowering", drug: "Atorvastatin 80 mg OD + Ezetimibe 10 mg OD + PCSK9i (Evolocumab 140 mg SC q2w)", rationale: "ASCVD + ≥1 high-risk feature or polyvascular disease. Triple therapy needed for target ≤30 mg/dL.", followUp: "LDL at 4 weeks. Consider Bempedoic acid if PCSK9i not tolerated.", alternative: "Rosuvastatin 40 mg + Ezetimibe + Inclisiran 284 mg SC initially + 3 months" },
  "EHR-C": { title: "Ultra-Maximal Therapy", drug: "Max statin + Ezetimibe + PCSK9i + Bempedoic acid 180 mg OD", rationale: "Recurrent/progressive events despite therapy. Multi-mechanism approach targeting LDL 10-15 mg/dL.", followUp: "Monthly monitoring. Consider Lp(a) apheresis if LDL at goal but events persist.", alternative: "Add Colchicine 0.5 mg OD for anti-inflammatory benefit (CANTOS/COLCOT)" },
  "VHR-A": { title: "High-Intensity Statin", drug: "Atorvastatin 40-80 mg OD or Rosuvastatin 20-40 mg OD", rationale: "Very high risk equivalent. Statin alone may suffice; add Ezetimibe if not at target <50.", followUp: "Lipids at 6-8 weeks. Add Ezetimibe if LDL >50.", alternative: "If statin-intolerant: Bempedoic acid 180 mg OD + Ezetimibe" },
  "VHR-B": { title: "High-Intensity Statin + Ezetimibe", drug: "Atorvastatin 40-80 mg OD + Ezetimibe 10 mg OD", rationale: "DM with TOD — combination therapy indicated from the start.", followUp: "Lipids at 6 weeks. Consider PCSK9i if LDL >50.", alternative: "Rosuvastatin 20-40 mg + Ezetimibe" },
  "VHR-C": { title: "Maximal Therapy (Triple)", drug: "Max tolerated statin + Ezetimibe ± PCSK9i", rationale: "CKD 3B-4, FH, or LDL ≥190. High residual risk — triple therapy often needed.", followUp: "Lipids at 4-6 weeks. Add PCSK9i early if >1 high-risk feature.", alternative: "Consider Inclisiran 284 mg SC (6-monthly dosing) for adherence" },
  "HR": { title: "High-Intensity Statin", drug: "Atorvastatin 20-40 mg OD or Rosuvastatin 10-20 mg OD", rationale: "Multiple risk factors or diabetes alone. Target LDL <70 mg/dL.", followUp: "Lipids at 12 weeks. Intensify if not at target.", alternative: "Moderate statin + Ezetimibe if high-dose not tolerated" },
  "MOD": { title: "Moderate-Intensity Statin", drug: "Atorvastatin 10-20 mg OD or Rosuvastatin 5-10 mg OD", rationale: "Intermediate risk. Moderate statin expected to achieve <100 mg/dL. Consider optional <70 target if high-risk features emerge.", followUp: "Recheck lipids at 12 weeks. Escalate if not at target.", alternative: "Lifestyle modification (3-month trial) if LDL 100-129 with borderline risk" },
  "LOW": { title: "Lifestyle Modification", drug: "No pharmacotherapy indicated", rationale: "Low risk. Target LDL <100 mg/dL. Diet, exercise, and periodic surveillance.", followUp: "Recheck lipids in 6-12 months.", alternative: "Consider statin if CAC >0 or Lp(a) ≥50 on shared decision-making" },
};

// ─── Secondary HTN algorithm data ───
const RENIN_ALDO_TABLE = [
  { renin: "↑ High", aldo: "↑ High", diagnosis: "Renovascular HTN, malignant HTN, reninoma" },
  { renin: "↓ Low", aldo: "↑↑ High", diagnosis: "Primary hyperaldosteronism (Conn's)" },
  { renin: "↓ Low", aldo: "↓↓ Low", diagnosis: "Liddle syndrome, Gordon, AME, Cushing" },
  { renin: "↔ Normal", aldo: "↔ Normal", diagnosis: "Essential HTN, renal parenchymal disease" },
];

const SECONDARY_HTN_SCREEN = [
  "Age < 30 with HTN, no risk factors",
  "Resistant HTN (≥3 drugs including diuretic)",
  "Hypokalemia (spontaneous or diuretic-induced)",
  "Abdominal bruit / delayed femoral pulses",
  "Family history of early HTN or renal disease",
];

const LIDDLE_FEATURES = [
  "Autosomal dominant, gain-of-function ENaC mutation",
  "Early-onset HTN (childhood/young adult)",
  "Hypokalemic metabolic alkalosis + NO edema",
  "🔑 LOW Renin + LOW Aldosterone (both suppressed!)",
  "Treat: Amiloride / Triamterene (NOT spironolactone)",
];

interface Props {
  onClassificationChange?: (result: LAIResult | null) => void;
  onNavigateToTreatment?: () => void;
}

export default function LipidsAssessment({ onClassificationChange, onNavigateToTreatment }: Props) {
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [sex, setSex] = useState("male");
  const [ldl, setLdl] = useState("");
  const [hdl, setHdl] = useState("");
  const [tg, setTg] = useState("");
  const [nonHdl, setNonHdl] = useState("");

  // PREVENT calculator inputs
  const [totalChol, setTotalChol] = useState("");
  const [sbp, setSbp] = useState("");
  const [bmi, setBmi] = useState("");
  const [egfr, setEgfr] = useState("");
  const [bpMed, setBpMed] = useState(false);
  const [onStatin, setOnStatin] = useState(false);
  const [diabetes, setDiabetes] = useState(false);
  const [smoking, setSmoking] = useState(false);

  // Checked state for risk modifiers
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const toggle = (id: string) => setChecked(p => ({ ...p, [id]: !p[id] }));

  const [preventResult, setPreventResult] = useState<PreventResult | null>(null);

  // HOMA-IR state
  const [homaInsulin, setHomaInsulin] = useState("");
  const [homaGlucose, setHomaGlucose] = useState("");
  const [homaUnit, setHomaUnit] = useState("mg/dL");
  const homaResult = useMemo(() => {
    const ins = parseFloat(homaInsulin);
    const glu = parseFloat(homaGlucose);
    if (isNaN(ins) || isNaN(glu) || ins <= 0 || glu <= 0) return null;
    const divisor = homaUnit === "mg/dL" ? 405 : 22.5;
    return (ins * glu) / divisor;
  }, [homaInsulin, homaGlucose, homaUnit]);

  const a = parseInt(age) || 0;
  const l = parseFloat(ldl) || 0;
  const h = parseFloat(hdl) || 0;
  const t = parseFloat(tg) || 0;
  const tc = parseFloat(totalChol) || 0;
  const sb = parseFloat(sbp) || 0;
  const b = parseFloat(bmi) || 0;
  const e = parseFloat(egfr) || 0;

  const classification = classifyLAI(checked, a, l);
  const key = classification.cat + (classification.sub ? "-" + classification.sub : "");
  const details = BUCKET_DETAILS[key] || BUCKET_DETAILS["LOW"];
  const rec = TREATMENT_RECS[key] || TREATMENT_RECS["LOW"];

  // Parse target: "< 50" → 50, "≤ 30" → 30, "10-15" → 15 (upper bound), "—" → Infinity
  const targetStr = details.ldl.replace(/[<≤> ]/g, "");
  const targetNum = targetStr.includes("-")
    ? parseInt(targetStr.split("-")[1]) // "10-15" → 15
    : parseInt(targetStr);
  const atTarget = !isNaN(l) && !isNaN(targetNum) && l <= targetNum;

  const modifierCounts = useMemo(() => {
    const r: Record<string, number> = {};
    for (const g of MODIFIER_GROUPS) r[g.title] = g.items.filter(i => checked[i.id]).length;
    return r;
  }, [checked]);

  const totalChecked = Object.values(checked).filter(Boolean).length;

  // Compute PREVENT risk
  useEffect(() => {
    if (a >= 30 && a <= 79 && tc > 0 && h > 0 && sb > 0 && b > 0 && e > 0) {
      const result = calculatePrevent({
        age: a, sex: sex as "male" | "female",
        totalChol: tc, hdl: h, sbp: sb, bmi: b, egfr: e,
        bpMed, statin: onStatin, diabetes, smoking,
      });
      setPreventResult(result);
    } else {
      setPreventResult(null);
    }
  }, [a, sex, tc, h, sb, b, e, bpMed, onStatin, diabetes, smoking]);

  // Report classification to parent
  const laiResult: LAIResult = {
    cat: classification.cat, sub: classification.sub,
    label: classification.label,
    ldlTarget: details.ldl, nonHdlTarget: details.nonHdl, apoBTarget: details.apoB,
    intensity: details.intensity, drug: details.drug,
    ldlCurrent: l, atTarget,
    riskFactors: Object.entries(checked).filter(([, v]) => v).map(([k]) => k),
  };

  useEffect(() => {
    onClassificationChange(totalChecked > 0 ? laiResult : null);
  }, [laiResult, totalChecked]);

  const generateNote = () => {
    const active = MODIFIER_GROUPS.flatMap(g => g.items.filter(i => checked[i.id]));
    const lines: string[] = [
      "LAI 2023 LIPID RISK ASSESSMENT",
      `Patient: ${name || "—"} | Age: ${age || "—"} | Sex: ${sex}`,
      `LDL: ${ldl || "—"} | HDL: ${hdl || "—"} | TG: ${tg || "—"} | Non-HDL: ${nonHdl || "—"}`,
      "",
      `RISK: ${classification.label}`,
      `LDL Target: ${details.ldl}`,
      `Therapy: ${details.intensity} — ${details.drug}`,
      `Current LDL ${l} — ${atTarget ? "AT target ✅" : "ABOVE target ⚠️"}`,
      "",
      ...(preventResult?.valid ? [`PREVENT 10-yr: ${preventResult.riskPct}% (${preventResult.category})`] : []),
      "",
      "ACTIVE MODIFIERS:",
      ...(active.length ? active.map(a => `  ✓ ${a.label}`) : ["  (none)"]),
    ];
    return lines.join("\n");
  };

  const bucketColorBg =
    classification.cat === "EHR" ? "bg-destructive/10 border-destructive/30" :
    classification.cat === "VHR" ? "bg-warning/10 border-orange-300" :
    classification.cat === "HR" ? "bg-warning/10 border-warning/30" :
    classification.cat === "MOD" ? "bg-warning/10 border-warning/30" :
    "bg-success/10 border-success/30";

  const bucketBadgeColor =
    classification.cat === "EHR" ? "bg-destructive/100 text-white" :
    classification.cat === "VHR" ? "bg-warning/100 text-white" :
    classification.cat === "HR" ? "bg-warning/100 text-white" :
    classification.cat === "MOD" ? "bg-warning text-white" :
    "bg-success/100 text-white";

  return (
    <div className="space-y-6">

      {/* ─── Patient & Labs ─── */}
      <SectionCard title="Patient Data" icon={<User className="h-4 w-4" />} tone="primary" collapsible={false}>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div><Label className="text-xs">Name</Label><Input value={name} onChange={e => setName(e.target.value)} className="h-10 px-3 rounded-lg border-border/60 focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all" /></div>
          <div><Label className="text-xs">Age</Label><Input type="number" value={age} onChange={e => setAge(e.target.value)} className="h-10 px-3 rounded-lg border-border/60 focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all" /></div>
          <div><Label className="text-xs">Sex</Label>
            <Select value={sex} onValueChange={setSex}>
              <SelectTrigger className="h-10 px-3 rounded-lg border-border/60 focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Male</SelectItem><SelectItem value="female">Female</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-3">
          <div><Label className="text-xs">LDL (mg/dL)</Label><Input type="number" value={ldl} onChange={e => setLdl(e.target.value)} className="h-10 px-3 rounded-lg border-border/60 focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all" /></div>
          <div><Label className="text-xs">HDL (mg/dL)</Label><Input type="number" value={hdl} onChange={e => setHdl(e.target.value)} className="h-10 px-3 rounded-lg border-border/60 focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all" /></div>
          <div><Label className="text-xs">TG (mg/dL)</Label><Input type="number" value={tg} onChange={e => setTg(e.target.value)} className="h-10 px-3 rounded-lg border-border/60 focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all" /></div>
          <div><Label className="text-xs">Non-HDL</Label><Input type="number" value={nonHdl} onChange={e => setNonHdl(e.target.value)} className="h-10 px-3 rounded-lg border-border/60 focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all" /></div>
        </div>
      </SectionCard>

      {/* ─── LAI 2023 Risk Modifiers ─── */}
      <SectionCard title="LAI 2023 Risk Modifiers" icon={<AlertTriangle className="h-4 w-4" />} tone="danger" collapsible={false}>
        <p className="text-xs text-muted-foreground mb-3">
          Select applicable modifiers. The system classifies per LAI 2023 into EHR/VHR/HR/MOD/LOW with A/B/C subcategories.
          Toggle modifiers and see the classification update live.
          {totalChecked > 0 && <span className="ml-1 font-semibold">({totalChecked} selected)</span>}
        </p>
        <div className="space-y-2">
          {MODIFIER_GROUPS.map(group => {
            const count = modifierCounts[group.title];
            return (
              <Collapsible key={group.title} defaultOpen={count > 0}>
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
                  {group.items.map(item => (
                    <label key={item.id} className={cn("flex cursor-pointer items-start gap-2.5 rounded-md px-3 py-2 transition-colors", checked[item.id] ? "bg-danger/5 ring-1 ring-danger/20" : "hover:bg-muted/50")}>
                      <Checkbox checked={!!checked[item.id]} onCheckedChange={() => toggle(item.id)} className="mt-0.5" />
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
      </SectionCard>

      {/* ─── PREVENT Risk ─── */}
      <SectionCard title="AHA PREVENT 10-Year Risk" icon={<TrendingUp className="h-4 w-4" />} tone="neutral" collapsible={false}>
        <p className="text-xs text-muted-foreground mb-3">Calculates 10-year ASCVD risk per AHA PREVENT equations (Khan et al. 2024). Required: age 30-79, TC, HDL, SBP, BMI, eGFR.</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div><Label className="text-xs">Total Chol (mg/dL)</Label><Input type="number" value={totalChol} onChange={e => setTotalChol(e.target.value)} className="h-10 px-3 rounded-lg border-border/60 focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all" /></div>
          <div><Label className="text-xs">SBP (mmHg)</Label><Input type="number" value={sbp} onChange={e => setSbp(e.target.value)} className="h-10 px-3 rounded-lg border-border/60 focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all" /></div>
          <div><Label className="text-xs">BMI (kg/m²)</Label><Input type="number" step="0.1" value={bmi} onChange={e => setBmi(e.target.value)} className="h-10 px-3 rounded-lg border-border/60 focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all" /></div>
          <div><Label className="text-xs">eGFR</Label><Input type="number" value={egfr} onChange={e => setEgfr(e.target.value)} className="h-10 px-3 rounded-lg border-border/60 focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all" /></div>
        </div>
        <div className="flex flex-wrap gap-3 mt-2">
          <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={bpMed} onChange={e => setBpMed(e.target.checked)} className="rounded" /><span className="text-xs">BP Meds</span></label>
          <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={onStatin} onChange={e => setOnStatin(e.target.checked)} className="rounded" /><span className="text-xs">On Statin</span></label>
          <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={diabetes} onChange={e => setDiabetes(e.target.checked)} className="rounded" /><span className="text-xs">Diabetes</span></label>
          <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={smoking} onChange={e => setSmoking(e.target.checked)} className="rounded" /><span className="text-xs">Smoker</span></label>
        </div>
        {preventResult?.valid ? (
          <div className={`mt-3 p-3 rounded-lg border ${preventResult.category === "High" ? "bg-destructive/10 border-destructive/30" : preventResult.category === "Intermediate" ? "bg-warning/10 border-warning/30" : "bg-success/10 border-success/30"}`}>
            <span className="font-semibold text-lg">{preventResult.riskPct}%</span>
            <span className={`ml-2 text-xs font-semibold ${preventResult.category === "High" ? "text-destructive" : preventResult.category === "Intermediate" ? "text-warning" : "text-success"}`}>
              ({preventResult.category})
            </span>
          </div>
        ) : preventResult?.warnings?.length ? (
          <div className="mt-2 text-xs text-muted-foreground">{preventResult.warnings.join("; ")}</div>
        ) : null}
      </SectionCard>

      {/* ─── Classification Result ─── */}
      <Card className={`p-5 border-2 ${bucketColorBg} text-foreground`}>
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold mb-0.5">LAI 2023 Classification</p>
            <div className="flex items-center gap-2 flex-wrap">
              <AbbreviationHover term={`${classification.cat}${classification.sub ? "-" + classification.sub : ""}`}>
                <span className={`text-2xl font-bold px-3 py-1 rounded-lg ${bucketBadgeColor}`}>
                  {classification.cat}{classification.sub && `-${classification.sub}`}
                </span>
              </AbbreviationHover>
              <span className="text-lg font-semibold text-foreground">{classification.label}</span>
            </div>
          </div>
          <Target className="h-6 w-6 text-muted-foreground" />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
          <div className="p-3 rounded-lg bg-muted/80 border border-border">
            <p className="text-xs text-foreground/70 uppercase font-semibold tracking-wide">LDL Target</p>
            <p className="text-lg font-bold text-foreground">{details.ldl} mg/dL</p>
            <p className="text-xs text-muted-foreground">Current: {ldl || "—"}</p>
            {ldl && <p className={`text-xs font-semibold ${atTarget ? "text-success" : "text-destructive"}`}>{atTarget ? "✅ At target" : "⚠ Above target"}</p>}
          </div>
          <div className="p-3 rounded-lg bg-muted/80 border border-border">
            <p className="text-xs text-foreground/70 uppercase font-semibold tracking-wide">Non-HDL Target</p>
            <p className="text-lg font-bold text-foreground">{details.nonHdl} mg/dL</p>
          </div>
          <div className="p-3 rounded-lg bg-muted/80 border border-border">
            <p className="text-xs text-foreground/70 uppercase font-semibold tracking-wide">ApoB Target</p>
            <p className="text-lg font-bold text-foreground">{details.apoB} mg/dL</p>
          </div>
        </div>

        <div className="border-t border-border pt-3">
          <div className="flex items-center gap-2 mb-2">
            <Target className="h-4 w-4 text-foreground" />
            <p className="text-sm font-semibold text-foreground">{rec.title}</p>
          </div>
          <p className="text-sm text-foreground mb-2">{rec.drug}</p>
          <p className="text-xs text-muted-foreground">{rec.rationale}</p>

          <Button size="sm" onClick={onNavigateToTreatment} className="mt-3 gap-1.5" variant="default">
            View Full Treatment <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </Card>

      {/* ─── LAI 2023 ASCVD Risk Stratification Algorithm ─── */}
      <SectionCard title="LAI 2023 ASCVD Risk Stratification Algorithm" icon={<BookOpen className="h-4 w-4" />} tone="indigo" defaultOpen={false}>
        <div className="space-y-2">
          <ImageLink imageId="ascvd-risk-stratification-lai" label="View ASCVD Risk Algorithm →" />
          <p className="text-xs text-muted-foreground">
            <strong>Figure 4.</strong> LAI 2023 Cardiovascular risk stratification algorithm for primary prevention. 
            Source: Puri et al., <em>J Clin Lipidol</em> 2024. 
            <a href="https://doi.org/10.1016/j.jacl.2024.01.006" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
              doi:10.1016/j.jacl.2024.01.006
            </a>
            &nbsp;—&nbsp;
            <a href="https://www.sciencedirect.com/science/article/pii/S1933287424000060#fig0004" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
              View on ScienceDirect
            </a>
          </p>
        </div>
      </SectionCard>

      {/* ─── Hypertriglyceridemia Algorithm ─── */}
      <SectionCard title="Hypertriglyceridemia Management Algorithm (LAI 2023)" icon={<BookOpen className="h-4 w-4" />} tone="indigo" defaultOpen={false}>
        <div className="space-y-2">
          <ImageLink imageId="hypertriglyceridemia-algorithm-lai" label="View Hypertriglyceridemia Algorithm →" />
          <p className="text-xs text-muted-foreground">
            TG-based treatment algorithm. Source: Lipid Association of India 2023 Consensus Statement IV.
            <a href="https://doi.org/10.1016/j.jacl.2024.01.006" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline ml-1">
              doi:10.1016/j.jacl.2024.01.006
            </a>
          </p>
        </div>
        <div className="space-y-2 mt-4">
          <ImageLink imageId="hypertriglyceridemia-cac-lai" label="View Hypertriglyceridemia CAC Reference →" />
          <p className="text-xs text-muted-foreground">
            Hypertriglyceridemia and CAC risk stratification reference. Source: LAI 2023.
            <a href="https://doi.org/10.1016/j.jacl.2024.01.006" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline ml-1">
              doi:10.1016/j.jacl.2024.01.006
            </a>
          </p>
        </div>
      </SectionCard>

      {/* ─── CACS Risk Stratification ─── */}
      <SectionCard title="CACS-Based Risk Stratification (LAI 2023)" icon={<BookOpen className="h-4 w-4" />} tone="indigo" defaultOpen={false}>
        <div className="space-y-2">
          <ImageLink imageId="cacs-risk-stratification-lai" label="View CACS Risk Algorithm →" />
          <p className="text-xs text-muted-foreground">
            Coronary Artery Calcium Score (CACS) risk classification for refining ASCVD risk. 
            Source: Lipid Association of India 2023.
            <a href="https://doi.org/10.1016/j.jacl.2024.01.006" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline ml-1">
              doi:10.1016/j.jacl.2024.01.006
            </a>
          </p>
        </div>
        <div className="space-y-2 mt-4">
          <ImageLink imageId="hypertriglyceridemia-cac-lai" label="View Hypertriglyceridemia CAC Reference →" />
          <p className="text-xs text-muted-foreground">
            Hypertriglyceridemia and CAC risk stratification reference. Source: LAI 2023.
            <a href="https://doi.org/10.1016/j.jacl.2024.01.006" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline ml-1">
              doi:10.1016/j.jacl.2024.01.006
            </a>
          </p>
        </div>
        <div className="space-y-2 mt-4">
          <ImageLink imageId="cacs-risk-targets-lai" label="View CACS Risk Targets →" />
          <p className="text-xs text-muted-foreground">
            Risk stratification and lipid targets based on CACS score: ≥75th percentile → LDL-C target &lt;70 mg/dl. 
            CACS = Coronary Artery Calcium Score. Based on Indian guidelines and risk stratification.
            <a href="https://doi.org/10.1016/j.jacl.2024.01.006" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline ml-1">
              doi:10.1016/j.jacl.2024.01.006
            </a>
          </p>
        </div>
      </SectionCard>

      {/* ─── Diabetes + Lipid Management Algorithm ─── */}
      <SectionCard title="Diabetes + Lipid Management Algorithm (LAI 2023)" icon={<BookOpen className="h-4 w-4" />} tone="danger" defaultOpen={false}>
        <div className="space-y-2">
          <ImageLink imageId="diabetes-lipid-algorithm-lai" label="View Diabetes Lipid Algorithm →" />
          <p className="text-xs text-muted-foreground">
            Risk-stratified lipid targets and treatment algorithm for patients with diabetes mellitus: 
            High Risk (LDL &lt;70) → Very High Risk (&lt;50) → Extreme Cat A (&lt;50, opt ≤30) → Extreme Cat B (≤30). 
            Stepwise therapy at Week 0 → 4 → 8. Source: LAI 2023.
            <a href="https://doi.org/10.1016/j.jacl.2024.01.006" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline ml-1">
              doi:10.1016/j.jacl.2024.01.006
            </a>
          </p>
        </div>
      </SectionCard>

      {/* ─── ACS Lipid Management Algorithm ─── */}
      <SectionCard title="ACS Lipid Management Algorithm (LAI 2023)" icon={<BookOpen className="h-4 w-4" />} tone="danger" defaultOpen={false}>
        <div className="space-y-2">
          <ImageLink imageId="acs-lipid-algorithm-lai" label="View ACS Lipid Algorithm →" />
          <p className="text-xs text-muted-foreground">
            Post-ACS lipid management protocol: statin-naïve → on low/mod-intensity → on high-intensity → intolerant. 
            Admission workup with Lp(a), initial high-intensity statin + ezetimibe, then Step 1 (2 wk) and Step 2 (4 wk) 
            escalation with PCSK9i / bempedoic acid / LDL apheresis if not at target.
            <a href="https://doi.org/10.1016/j.jacl.2024.01.006" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline ml-1">
              doi:10.1016/j.jacl.2024.01.006
            </a>
          </p>
        </div>
      </SectionCard>

      {/* ─── LAI Treatment Algorithm by Risk Group ─── */}
      <SectionCard title="LAI 2023 Treatment Algorithm by Risk Group" icon={<BookOpen className="h-4 w-4" />} tone="indigo" defaultOpen={false}>
        <div className="space-y-2">
          <ImageLink imageId="lai-treatment-algorithm" label="View LAI Treatment Algorithm →" />
          <p className="text-xs text-muted-foreground">
            Full LAI risk-aligned treatment algorithm: Low risk (LDL &lt;100) → Moderate (optional &lt;70) → 
            High (&lt;70) → Very High (&lt;50) → Extreme Cat A (&lt;50, opt ≤30) → Extreme Cat B (≤30). 
            Week 0/4/8 stepped escalation with lipid profile + Apo-B monitoring.
            <a href="https://doi.org/10.1016/j.jacl.2024.01.006" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline ml-1">
              doi:10.1016/j.jacl.2024.01.006
            </a>
          </p>
        </div>
      </SectionCard>

      {/* ─── Lipid Management Goals by Risk Group ─── */}
      <SectionCard title="Lipid Management Goals by Risk Group" icon={<Target className="h-4 w-4" />} tone="indigo" defaultOpen={false}>
        <div className="space-y-2">
          <ImageLink imageId="lipid-goals-by-risk-lai" label="View Lipid Goals by Risk →" />
          <p className="text-xs text-muted-foreground">
            Quick-reference target table: Low/Moderate (LDL &lt;100 / non-HDL &lt;130) → 
            High (&lt;70 / &lt;100) → Very High (&lt;50 / &lt;80) → Extreme A (&lt;50 opt ≤30 / &lt;80 opt ≤60) → 
            Extreme B (&lt;30 / &lt;60) → Extreme C (&lt;15 / &lt;60). 
            Source: Simplified from Multiple Guidelines 2026 (LAI, ACC/AHA, ESC).
            <a href="https://doi.org/10.1016/j.jacl.2024.01.006" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline ml-1">
              doi:10.1016/j.jacl.2024.01.006
            </a>
          </p>
        </div>
      </SectionCard>

      {/* ─── Classification Guide Table ─── */}
      <SectionCard title="LAI 2023 Full Classification Guide" icon={<BookOpen className="h-4 w-4" />} tone="indigo" defaultOpen={false}>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 pr-2 font-semibold text-muted-foreground">Category</th>
                <th className="text-left py-2 pr-2 font-semibold text-muted-foreground">Criteria</th>
                <th className="text-left py-2 pr-2 font-semibold text-muted-foreground">LDL</th>
                <th className="text-left py-2 font-semibold text-muted-foreground">Therapy</th>
              </tr>
            </thead>
            <tbody className="text-foreground">
              <tr className="border-b border-border/50"><td className="py-2 pr-2 font-bold text-destructive"><AbbreviationHover term="EHR-A">EHR-A</AbbreviationHover></td><td className="py-2 pr-2"><AbbreviationHover term="ASCVD">ASCVD</AbbreviationHover> only</td><td className="py-2 pr-2 font-bold">&lt; 55</td><td className="py-2">High statin + Ezetimibe</td></tr>
              <tr className="border-b border-border/50"><td className="py-2 pr-2 font-bold text-destructive"><AbbreviationHover term="EHR-B">EHR-B</AbbreviationHover></td><td className="py-2 pr-2"><AbbreviationHover term="ASCVD">ASCVD</AbbreviationHover> + 1 high-risk feature</td><td className="py-2 pr-2 font-bold">&lt; 55</td><td className="py-2">+ <AbbreviationHover term="PCSK9i">PCSK9i</AbbreviationHover></td></tr>
              <tr className="border-b border-border/50"><td className="py-2 pr-2 font-bold text-destructive"><AbbreviationHover term="EHR-C">EHR-C</AbbreviationHover></td><td className="py-2 pr-2"><AbbreviationHover term="ASCVD">ASCVD</AbbreviationHover> + ≥2 high-risk features</td><td className="py-2 pr-2 font-bold">&lt; 55</td><td className="py-2">Max triple therapy</td></tr>
              <tr className="border-b border-border/50"><td className="py-2 pr-2 font-bold text-orange-600">VHR-A</td><td className="py-2 pr-2"><AbbreviationHover term="ASCVD">ASCVD</AbbreviationHover> equivalent</td><td className="py-2 pr-2 font-bold">&lt; 55</td><td className="py-2">High statin</td></tr>
              <tr className="border-b border-border/50"><td className="py-2 pr-2 font-bold text-orange-600">VHR-B</td><td className="py-2 pr-2"><AbbreviationHover term="DM">DM</AbbreviationHover> + <AbbreviationHover term="TOD">TOD</AbbreviationHover></td><td className="py-2 pr-2 font-bold">&lt; 55</td><td className="py-2">Statin + Ezetimibe</td></tr>
              <tr className="border-b border-border/50"><td className="py-2 pr-2 font-bold text-orange-600">VHR-C</td><td className="py-2 pr-2"><AbbreviationHover term="CKD">CKD</AbbreviationHover>/<AbbreviationHover term="FH">FH</AbbreviationHover>/<AbbreviationHover term="LDL">LDL</AbbreviationHover> ≥190</td><td className="py-2 pr-2 font-bold">&lt; 55</td><td className="py-2">Triple ± <AbbreviationHover term="PCSK9i">PCSK9i</AbbreviationHover></td></tr>
              <tr className="border-b border-border/50"><td className="py-2 pr-2 font-bold text-warning">HR</td><td className="py-2 pr-2">Multiple RF, <AbbreviationHover term="DM">DM</AbbreviationHover> alone, <AbbreviationHover term="LDL">LDL</AbbreviationHover> 160-189</td><td className="py-2 pr-2 font-bold">&lt; 70</td><td className="py-2">High statin</td></tr>
              <tr className="border-b border-border/50"><td className="py-2 pr-2 font-bold text-yellow-600">MOD</td><td className="py-2 pr-2">Age ≥40 + enhancer, <AbbreviationHover term="LDL">LDL</AbbreviationHover> 130-159</td><td className="py-2 pr-2 font-bold">&lt; 100</td><td className="py-2">Moderate statin</td></tr>
              <tr><td className="py-2 pr-2 font-bold text-success">LOW</td><td className="py-2 pr-2">No major risk factors</td><td className="py-2 pr-2 font-bold">&lt; 130</td><td className="py-2">Lifestyle</td></tr>
            </tbody>
          </table>
        </div>
      </SectionCard>

      {/* ─── HOMA-IR Calculator ─── */}
      <SectionCard title="HOMA-IR Calculator" icon={<Calculator className="h-4 w-4" />} tone="accent">
        <p className="text-xs text-muted-foreground mb-3">
          Homeostatic Model Assessment for Insulin Resistance — estimates insulin resistance from fasting glucose and insulin.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <Label className="text-xs">Fasting Insulin (μIU/mL)</Label>
            <Input type="number" min="0" step="0.1" placeholder="e.g. 12" value={homaInsulin} onChange={e => setHomaInsulin(e.target.value)} className="h-10 px-3 rounded-lg border-border/60" />
          </div>
          <div>
            <Label className="text-xs">Fasting Glucose</Label>
            <div className="flex gap-2">
              <Input type="number" min="0" step="1" placeholder="e.g. 95" value={homaGlucose} onChange={e => setHomaGlucose(e.target.value)} className="h-10 px-3 rounded-lg border-border/60 flex-1" />
              <Select value={homaUnit} onValueChange={setHomaUnit}>
                <SelectTrigger className="h-10 w-24 rounded-lg border-border/60">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mg/dL">mg/dL</SelectItem>
                  <SelectItem value="mmol/L">mmol/L</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {homaResult !== null && (
          <div className="rounded-lg border border-border bg-muted/20 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold">HOMA-IR Score</span>
              <span className={cn(
                "text-2xl font-bold",
                homaResult < 1.0 ? "text-success" :
                homaResult < 2.0 ? "text-warning" :
                homaResult < 3.0 ? "text-orange-500" :
                "text-destructive"
              )}>
                {homaResult.toFixed(2)}
              </span>
            </div>
            <div className="text-xs text-muted-foreground">
              Formula: (Insulin × Glucose) / {homaUnit === "mg/dL" ? "405" : "22.5"}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-1.5 pr-3 font-semibold text-muted-foreground">Score</th>
                    <th className="text-left py-1.5 font-semibold text-muted-foreground">Clinical Meaning</th>
                  </tr>
                </thead>
                <tbody className="text-foreground">
                  <tr className={homaResult < 1.0 ? "bg-success/10" : "border-b border-border/50"}>
                    <td className="py-1.5 pr-3 font-medium">&lt; 1.0</td>
                    <td className="py-1.5">Optimal insulin sensitivity (Healthy)</td>
                  </tr>
                  <tr className={homaResult >= 1.0 && homaResult < 2.0 ? "bg-warning/10" : "border-b border-border/50"}>
                    <td className="py-1.5 pr-3 font-medium">1.0 – 1.9</td>
                    <td className="py-1.5">Early or mild insulin resistance</td>
                  </tr>
                  <tr className={homaResult >= 2.0 && homaResult < 3.0 ? "bg-orange-500/10" : "border-b border-border/50"}>
                    <td className="py-1.5 pr-3 font-medium">2.0 – 2.9</td>
                    <td className="py-1.5">Moderate insulin resistance (Commonly seen in MONO and MOO)</td>
                  </tr>
                  <tr className={homaResult >= 3.0 ? "bg-destructive/10" : ""}>
                    <td className="py-1.5 pr-3 font-medium">≥ 3.0</td>
                    <td className="py-1.5">Severe insulin resistance (High risk for Type 2 Diabetes)</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </SectionCard>

      {/* ─── EMR Note ─── */}
      <SectionCard title="EMR Note" icon={<ClipboardCopy className="h-4 w-4" />} tone="neutral">
        <textarea readOnly value={generateNote()} className="w-full h-32 rounded-lg border border-input bg-muted/30 p-3 text-sm font-mono resize-none" />
        <Button variant="outline" className="w-full mt-3" onClick={() => { navigator.clipboard.writeText(generateNote()); toast.success("Copied"); }}>
          <ClipboardCopy className="h-4 w-4 mr-1.5" /> Copy to EMR
        </Button>
      </SectionCard>
    </div>
  );
}
