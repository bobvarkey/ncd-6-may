import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { Copy, Printer, ChevronDown, Download, AlertTriangle, Droplets, Stethoscope, FlaskConical, Dna, HeartPulse, Syringe, Pill, Activity, RotateCcw, Info, Check } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { downloadTextFile } from "@/lib/clinical-utils";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

// ── Types ──────────────────────────────────────────────────────
type IronPattern = "normal" | "A_high_ferritin_normal_TS" | "B_high_TS_high_ferritin" | "C_high_TS_normal_ferritin" | null;
type OverloadType = "none" | "reactive" | "primary_hh" | "primary_non_hfe" | "secondary" | null;
type DeficiencyType = "absolute" | "functional" | "early" | "borderline" | "none" | "other" | "unknown";

// ── Range dropdown helper ──────────────────────────────────────
type Range = { label: string; value: number };
const RANGES: Record<string, Range[]> = {
  ts: [
    { label: "< 5% (very low)", value: 3 },
    { label: "5–10%", value: 7.5 },
    { label: "11–15%", value: 13 },
    { label: "16–20%", value: 18 },
    { label: "21–30%", value: 25 },
    { label: "31–44%", value: 37 },
    { label: "45–59%", value: 52 },
    { label: "60–79%", value: 70 },
    { label: "≥ 80%", value: 85 },
  ],
  ferritin: [
    { label: "< 10 (very low)", value: 5 },
    { label: "10–29", value: 20 },
    { label: "30–49", value: 40 },
    { label: "50–100", value: 75 },
    { label: "101–200", value: 150 },
    { label: "201–300", value: 250 },
    { label: "301–500", value: 400 },
    { label: "501–1000", value: 750 },
    { label: "> 1000", value: 1500 },
  ],
  serumIron: [
    { label: "< 30 (very low)", value: 20 },
    { label: "30–59", value: 45 },
    { label: "60–99", value: 80 },
    { label: "100–149", value: 125 },
    { label: "150–199", value: 175 },
    { label: "≥ 200", value: 220 },
  ],
  tibc: [
    { label: "< 200 (low)", value: 180 },
    { label: "200–299", value: 250 },
    { label: "300–399", value: 350 },
    { label: "400–499", value: 450 },
    { label: "≥ 500", value: 550 },
  ],
  hemoglobin: [
    { label: "< 7 (severe)", value: 6 },
    { label: "7–9.9", value: 8.5 },
    { label: "10–11.9", value: 11 },
    { label: "12–13.5", value: 13 },
    { label: "> 13.5", value: 15 },
  ],
  weight: [
    { label: "< 40 kg", value: 35 },
    { label: "40–59", value: 50 },
    { label: "60–79", value: 70 },
    { label: "80–99", value: 90 },
    { label: "100–120", value: 110 },
    { label: "> 120", value: 140 },
  ],
  alt: [
    { label: "< 20", value: 15 },
    { label: "20–39", value: 30 },
    { label: "40–79", value: 60 },
    { label: "80–159", value: 120 },
    { label: "≥ 160", value: 200 },
  ],
  ast: [
    { label: "< 20", value: 15 },
    { label: "20–39", value: 30 },
    { label: "40–79", value: 60 },
    { label: "80–159", value: 120 },
    { label: "≥ 160", value: 200 },
  ],
};

const SLIDER_BOUNDS: Record<string, { min: number; max: number; step: number }> = {
  serumIron: { min: 0, max: 300, step: 1 },
  tibc: { min: 100, max: 700, step: 5 },
  ts: { min: 0, max: 100, step: 1 },
  ferritin: { min: 0, max: 2000, step: 5 },
  hemoglobin: { min: 3, max: 20, step: 0.1 },
  weight: { min: 25, max: 180, step: 1 },
  alt: { min: 0, max: 400, step: 1 },
  ast: { min: 0, max: 400, step: 1 },
};

function RangeOrExact({
  id, label, unit, value, onChange, ranges, tooltip,
}: { id: string; label: string; unit?: string; value: string; onChange: (v: string) => void; ranges: Range[]; tooltip?: string }) {
  const [mode, setMode] = useState<"range" | "exact" | "slider">("slider");
  const bounds = SLIDER_BOUNDS[id] ?? { min: 0, max: 100, step: 1 };

  const validation = useMemo(() => {
    const v = parseFloat(value);
    if (isNaN(v)) return null;
    
    // Typical adult reference ranges (simplified)
    const ranges: Record<string, { min: number, max: number }> = {
      serumIron: { min: 60, max: 170 },
      tibc: { min: 240, max: 450 },
      ts: { min: 20, max: 50 },
      ferritin: { min: 30, max: 300 },
      hemoglobin: { min: 12, max: 17.5 },
      weight: { min: 40, max: 150 },
      alt: { min: 0, max: 56 },
      ast: { min: 0, max: 40 },
    };
    
    const range = ranges[id];
    if (!range) return null;
    
    if (v < range.min) return { type: 'low', msg: `Value is below typical range (${range.min})` };
    if (v > range.max) return { type: 'high', msg: `Value is above typical range (${range.max})` };
    return null;
  }, [id, value]);

  const nextMode = mode === "slider" ? "range" : mode === "range" ? "exact" : "slider";
  const sliderValue = value === "" || isNaN(Number(value))
    ? (bounds.min + bounds.max) / 2
    : Math.min(bounds.max, Math.max(bounds.min, Number(value)));
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <Label htmlFor={id} className={`text-xs ${validation ? 'text-amber-600 dark:text-amber-400' : ''}`}>{label} {unit && <span className="text-muted-foreground">({unit})</span>}</Label>
          {tooltip && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button type="button" className="text-muted-foreground hover:text-foreground">
                    <Info className="h-3 w-3" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs max-w-xs">{tooltip}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
        <button type="button" onClick={() => setMode(nextMode)}
          className="text-xs text-primary hover:underline">{nextMode}</button>
      </div>
      {mode === "range" ? (
        <Select value={value} onValueChange={onChange}>
          <SelectTrigger id={id} className={cn("h-9", validation && "border-amber-500/50")}><SelectValue placeholder="Select range" /></SelectTrigger>
          <SelectContent>{ranges.map(r => <SelectItem key={r.label} value={String(r.value)}>{r.label}</SelectItem>)}</SelectContent>
        </Select>
      ) : mode === "exact" ? (
        <Input id={id} type="number" inputMode="decimal" className={cn("h-9", validation && "border-amber-500/50")} value={value} onChange={e => onChange(e.target.value)} />
      ) : (
        <div className="flex items-center gap-3 h-9">
          <Slider
            id={id}
            aria-label={`${label}${unit ? ` in ${unit}` : ""}`}
            min={bounds.min}
            max={bounds.max}
            step={bounds.step}
            value={[sliderValue]}
            onValueChange={([v]) => onChange(String(v))}
            className="flex-1"
          />
          <Input
            type="number"
            inputMode="decimal"
            aria-label={`${label} value`}
            className={cn("h-9 w-20 shrink-0 text-center", validation && "border-amber-500/50")}
            value={value}
            onChange={e => onChange(e.target.value)}
          />
        </div>
      )}
      {validation && (
        <p className="text-[10px] text-amber-600 dark:text-amber-400 font-medium leading-none">
          {validation.msg}
        </p>
      )}
    </div>
  );
}


// ── Differential Diagnosis Table ───────────────────────────────
function DifferentialDiagnosisTable({ ferritin, tsVal, sex, inflammation, ckd, pregnancy }: {
  ferritin: number; tsVal: number; sex: string; inflammation: boolean; ckd: boolean; pregnancy: boolean;
}) {
  const ferritinThreshold = sex === "female" ? 200 : 300;
  const tsHigh = tsVal >= 45;
  const ferritinHigh = ferritin > ferritinThreshold;
  const ferritinLow = inflammation ? ferritin < 100 : ferritin < 30;
  const tsLow = tsVal < 20;

  const conditions = useMemo(() => {
    const list: { condition: string; pattern: string; ferritin: string; tsat: string; probability: string; color: string }[] = [];

    // Iron deficiency
    if (ferritinLow && tsLow) {
      list.push({ condition: "Absolute Iron Deficiency Anemia", pattern: "Low ferritin + low TSAT", ferritin: `${ferritin.toFixed(0)} µg/L`, tsat: `${tsVal.toFixed(1)}%`, probability: "High", color: "bg-red-500/15 text-red-400" });
    } else if (ferritin > 0 && ferritin < (inflammation ? 100 : 30) && !tsLow) {
      list.push({ condition: "Early / Marginal Iron Deficiency", pattern: "Low ferritin, normal TSAT", ferritin: `${ferritin.toFixed(0)} µg/L`, tsat: `${tsVal.toFixed(1)}%`, probability: "Moderate", color: "bg-amber-500/15 text-amber-400" });
    } else if (ferritin >= 100 && ferritin < 300 && tsLow && inflammation) {
      list.push({ condition: "Functional Iron Deficiency (ACD)", pattern: "Normal ferritin + low TSAT + inflammation", ferritin: `${ferritin.toFixed(0)} µg/L`, tsat: `${tsVal.toFixed(1)}%`, probability: "High", color: "bg-amber-500/15 text-amber-400" });
    }

    // Iron overload
    if (tsHigh && ferritinHigh) {
      list.push({ condition: "Iron Overload (HH / secondary)", pattern: "High TSAT + high ferritin", ferritin: `${ferritin.toFixed(0)} µg/L`, tsat: `${tsVal.toFixed(1)}%`, probability: "High", color: "bg-red-500/15 text-red-400" });
    } else if (tsHigh && !ferritinHigh) {
      list.push({ condition: "Early / Latent Hemochromatosis", pattern: "High TSAT, normal ferritin", ferritin: `${ferritin.toFixed(0)} µg/L`, tsat: `${tsVal.toFixed(1)}%`, probability: "Possible", color: "bg-amber-500/15 text-amber-400" });
    }

    // Reactive
    if (!tsHigh && ferritinHigh) {
      list.push({ condition: "Reactive Hyperferritinemia", pattern: "High ferritin, normal TSAT", ferritin: `${ferritin.toFixed(0)} µg/L`, tsat: `${tsVal.toFixed(1)}%`, probability: "Likely", color: "bg-amber-500/15 text-amber-400" });
    }

    // Anemia of chronic disease
    if (ferritin >= 30 && ferritin < 300 && tsLow && inflammation) {
      list.push({ condition: "Anemia of Chronic Disease (ACD)", pattern: "Normal/high ferritin + low TSAT + inflammation", ferritin: `${ferritin.toFixed(0)} µg/L`, tsat: `${tsVal.toFixed(1)}%`, probability: "High", color: "bg-blue-500/15 text-blue-400" });
    }

    // CKD
    if (ckd && tsLow) {
      list.push({ condition: "CKD-Related Anemia", pattern: "CKD + low TSAT", ferritin: `${ferritin.toFixed(0)} µg/L`, tsat: `${tsVal.toFixed(1)}%`, probability: "Consider", color: "bg-purple-500/15 text-purple-400" });
    }

    // Normal
    if (!tsHigh && !ferritinHigh && !ferritinLow) {
      list.push({ condition: "Normal Iron Studies", pattern: "Normal TSAT + normal ferritin", ferritin: `${ferritin.toFixed(0)} µg/L`, tsat: `${tsVal.toFixed(1)}%`, probability: "—", color: "bg-emerald-500/15 text-emerald-400" });
    }

    return list;
  }, [ferritin, tsVal, sex, inflammation, ckd, ferritinLow, tsLow, tsHigh, ferritinHigh]);

  if (conditions.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className="text-xs font-semibold text-muted-foreground flex items-center gap-2">
        <Activity className="h-3 w-3" />
        Differential Diagnosis Based on Iron Studies
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="border-b">
              <th className="text-left p-2 font-semibold bg-muted/50">Condition</th>
              <th className="text-left p-2 font-semibold bg-muted/50">Pattern</th>
              <th className="text-left p-2 font-semibold bg-muted/50">Ferritin</th>
              <th className="text-left p-2 font-semibold bg-muted/50">TSAT</th>
              <th className="text-left p-2 font-semibold bg-muted/50">Probability</th>
            </tr>
          </thead>
          <tbody>
            {conditions.map((c, i) => (
              <tr key={i} className="border-b last:border-0">
                <td className="p-2 font-medium">{c.condition}</td>
                <td className="p-2 text-muted-foreground">{c.pattern}</td>
                <td className="p-2 text-muted-foreground">{c.ferritin}</td>
                <td className="p-2 text-muted-foreground">{c.tsat}</td>
                <td className="p-2"><Badge className={cn("text-[10px]", c.color)}>{c.probability}</Badge></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────
export default function IronStudiesCombined() {
  // ── Labs ──
  const [ts, setTs] = useState("");
  const [ferritin, setFerritin] = useState("");
  const [serumIron, setSerumIron] = useState("");
  const [tibc, setTibc] = useState("");
  const [hemoglobin, setHemoglobin] = useState("");
  const [weight, setWeight] = useState("");
  const [alt, setAlt] = useState("");
  const [ast, setAst] = useState("");

  // ── Patient ──
  const [sex, setSex] = useState("");
  const [age, setAge] = useState("");

  // ── Overload context ──
  const [transfusions, setTransfusions] = useState(false);
  const [thalassemia, setThalassemia] = useState(false);
  const [sickleCell, setSickleCell] = useState(false);
  const [chronicAnemia, setChronicAnemia] = useState(false);
  const [mds, setMds] = useState(false);
  const [viralHepatitis, setViralHepatitis] = useState(false);
  const [alcohol, setAlcohol] = useState(false);
  const [nafld, setNafld] = useState(false);
  const [metabolicSyndrome, setMetabolicSyndrome] = useState(false);
  const [ckd, setCkd] = useState(false);
  const [inflammation, setInflammation] = useState(false);
  const [hemolysis, setHemolysis] = useState(false);
  const [pct, setPct] = useState(false);

  // ── Deficiency context ──
  const [pregnancy, setPregnancy] = useState(false);
  const [esa, setEsa] = useState(false);
  const [chf, setChf] = useState(false);
  const [ibd, setIbd] = useState(false);
  const [rls, setRls] = useState(false);
  const [bariatric, setBariatric] = useState(false);
  const [oralIntolerance, setOralIntolerance] = useState(false);
  const [rapidCorrection, setRapidCorrection] = useState(false);
  const [ongoingBloodLoss, setOngoingBloodLoss] = useState(false);

  // ── Symptoms (overload) ──
  const [symptomsFatigue, setSymptomsFatigue] = useState(false);
  const [symptomsArthralgia, setSymptomsArthralgia] = useState(false);
  const [symptomsDiabetes, setSymptomsDiabetes] = useState(false);
  const [symptomsCardiac, setSymptomsCardiac] = useState(false);
  const [symptomsHypogonadism, setSymptomsHypogonadism] = useState(false);
  const [familyHx, setFamilyHx] = useState(false);

  // ── HFE ──
  const [hfeStatus, setHfeStatus] = useState("unknown");
  const [showAdvanced, setShowAdvanced] = useState(false);

  const n = (s: string) => parseFloat(s) || 0;

  // ── Computed TSAT ──
  const computedTs = useMemo(() => {
    const si = n(serumIron);
    const ti = n(tibc);
    if (si && ti) return ((si / ti) * 100).toFixed(1);
    return null;
  }, [serumIron, tibc]);

  const tsVal = computedTs ? n(computedTs) : n(ts);

  // ── Overload Pattern ──
  const pattern = useMemo((): IronPattern => {
    const f = n(ferritin);
    if (!tsVal && !f) return null;
    const ferritinHigh = sex === "female" ? f > 200 : f > 300;
    const tsHigh = tsVal >= 45;
    if (!tsHigh && !ferritinHigh) return "normal";
    if (!tsHigh && ferritinHigh) return "A_high_ferritin_normal_TS";
    if (tsHigh && ferritinHigh) return "B_high_TS_high_ferritin";
    if (tsHigh && !ferritinHigh) return "C_high_TS_normal_ferritin";
    return null;
  }, [tsVal, ferritin, sex]);

  // ── Overload Classification ──
  const secondaryCauses = useMemo(() => {
    const causes: string[] = [];
    if (transfusions) causes.push("Chronic transfusions");
    if (thalassemia) causes.push("Thalassemia");
    if (sickleCell) causes.push("Sickle cell disease");
    if (chronicAnemia) causes.push("Other chronic anemia");
    if (mds) causes.push("MDS / sideroblastic anemia");
    if (hemolysis) causes.push("Chronic hemolysis");
    if (pct) causes.push("Porphyria cutanea tarda");
    return causes;
  }, [transfusions, thalassemia, sickleCell, chronicAnemia, mds, hemolysis, pct]);

  const reactiveCauses = useMemo(() => {
    const causes: string[] = [];
    if (nafld) causes.push("NAFLD / MASLD");
    if (alcohol) causes.push("Alcohol use");
    if (metabolicSyndrome) causes.push("Metabolic syndrome");
    if (ckd) causes.push("CKD");
    if (inflammation) causes.push("Inflammation / infection");
    if (viralHepatitis) causes.push("Viral hepatitis");
    return causes;
  }, [nafld, alcohol, metabolicSyndrome, ckd, inflammation, viralHepatitis]);

  const hasSecondary = secondaryCauses.length > 0;
  const hasReactive = reactiveCauses.length > 0;

  const overloadType = useMemo((): OverloadType => {
    if (pattern === "normal") return "none";
    if (pattern === "A_high_ferritin_normal_TS") return "reactive";
    if (pattern === "B_high_TS_high_ferritin" || pattern === "C_high_TS_normal_ferritin") {
      if (hasSecondary) return "secondary";
      if (hfeStatus === "c282y_homo") return "primary_hh";
      if (hfeStatus === "c282y_h63d_compound" || hfeStatus === "other") return "primary_non_hfe";
      if (hfeStatus === "negative" && !hasSecondary) return "primary_non_hfe";
      return null;
    }
    return null;
  }, [pattern, hasSecondary, hfeStatus]);

  // ── Deficiency Diagnosis ──
  const deficiencyDiagnosis = useMemo(() => {
    const f = n(ferritin);
    if (!f && !tsVal) return null;
    const hasInflam = inflammation;
    const ferritinAbsLow = hasInflam ? f < 100 : f < 30;
    const ferritinFunctional = f >= 100 && f < 300;
    const ferritinReplete = f >= 300;
    const tsatLow = tsVal < 20;
    const tsatNormal = tsVal >= 20;

    if (ferritinAbsLow && tsatLow)
      return { diagnosis: "Absolute Iron Deficiency", detail: "Ferritin <30 (no inflammation) or <100 (with inflammation) + TSAT <20%. Definitive iron deficiency.", label: "absolute" as DeficiencyType };
    if (ferritinFunctional && tsatLow) {
      if (hasInflam)
        return { diagnosis: "Functional Iron Deficiency", detail: "Ferritin 100–300 ng/mL with TSAT <20% in setting of inflammation — iron trapped in storage.", label: "functional" as DeficiencyType };
      return { diagnosis: "Functional Iron Deficiency (CKD/ESA)", detail: "Ferritin 100–300 with low TSAT — iron available but not utilized. IV iron indicated per guidelines.", label: "functional" as DeficiencyType };
    }
    if (!hasInflam && f >= 30 && f < 100) {
      if (tsatNormal)
        return { diagnosis: "Early/Marginal Iron Deficiency", detail: "Ferritin 30–100 with normal TSAT. Low stores, still sufficient for erythropoiesis. Oral iron may benefit.", label: "early" as DeficiencyType };
      return { diagnosis: "Absolute Iron Deficiency (Borderline)", detail: "Ferritin 30–100 with low TSAT — consistent with absolute iron deficiency despite borderline ferritin.", label: "absolute" as DeficiencyType };
    }
    if (ferritinReplete && tsatNormal)
      return { diagnosis: "Iron Deficiency Unlikely", detail: "Ferritin ≥300 ng/mL and TSAT ≥20%. Adequate iron stores.", label: "none" as DeficiencyType };
    if (ferritinReplete && tsatLow)
      return { diagnosis: "Low TSAT with Replete Ferritin", detail: "Consider anemia of chronic disease, mixed deficiency, or lab error. Further workup needed.", label: "other" as DeficiencyType };
    if (ferritinFunctional && tsatNormal)
      return { diagnosis: "Iron Deficiency Unlikely", detail: "Ferritin 100–300 with normal TSAT — adequate iron for erythropoiesis.", label: "none" as DeficiencyType };
    return { diagnosis: "Unable to Classify", detail: "Check input values.", label: "unknown" as DeficiencyType };
  }, [ferritin, tsVal, inflammation]);

  // ── Ganzoni ──
  const ganzoni = useMemo(() => {
    const hb = n(hemoglobin);
    const w = n(weight);
    if (!hb || !w) return null;
    const targetHb = pregnancy ? 11 : ckd ? 12 : w >= 35 ? 14 : 13;
    const stores = w >= 35 ? 500 : 15 * w;
    const deficit = Math.max(0, w * (targetHb - hb) * 2.4 + stores);
    const isIV = hb < 10 || (deficiencyDiagnosis?.label === "functional") || ckd || esa || oralIntolerance || rapidCorrection || ongoingBloodLoss;
    let doseText: string;
    if (isIV) {
      if (deficit <= 500) doseText = `${Math.round(deficit)} mg → 500 mg IV iron (single dose)`;
      else if (deficit <= 1000) doseText = `${Math.round(deficit)} mg → 1000 mg IV iron (single or split dose)`;
      else doseText = `${Math.round(deficit)} mg → ${Math.ceil(deficit / 100) * 100} mg IV iron, split over 1–2 doses`;
    } else {
      doseText = "40–65 mg elemental iron PO daily or every other day (e.g., ferrous sulfate 325 mg = 65 mg elemental)";
    }
    return { targetHb, stores, deficit, isIV, doseText };
  }, [hemoglobin, weight, pregnancy, ckd, esa, oralIntolerance, rapidCorrection, ongoingBloodLoss, deficiencyDiagnosis]);

  // ── Overload Red Flags ──
  const redFlags = useMemo(() => {
    const flags: string[] = [];
    if (n(ferritin) >= 1000) flags.push(`Ferritin ≥ 1000 µg/L — high risk of organ iron deposition; initiate treatment regardless of symptoms`);
    if (tsVal >= 80) flags.push(`TS ≥ 80% — severe iron overload, high risk of organ damage`);
    if (symptomsCardiac) flags.push("Cardiac symptoms — urgent cardiac T2* MRI to assess myocardial iron");
    if (symptomsDiabetes && n(ferritin) > 500) flags.push("Diabetes + ferritin > 500 — screen for hemochromatosis-related endocrine dysfunction");
    if (familyHx && hfeStatus === "unknown") flags.push("Family history of hemochromatosis — HFE genotyping indicated");
    return flags;
  }, [ferritin, tsVal, symptomsCardiac, symptomsDiabetes, familyHx, hfeStatus]);

  // ── Overload Pathway ──
  const overloadPathway = useMemo(() => {
    const steps: string[] = [];
    if (redFlags.length) steps.push("URGENT: features of significant iron overload — initiate work-up and treatment.");
    if (pattern === "normal") {
      steps.push("No biochemical evidence of iron excess. Consider other causes of symptoms or non-iron causes of high ferritin (metabolic/inflammatory, liver disease).");
      return steps;
    }
    if (pattern === "A_high_ferritin_normal_TS") {
      steps.push("Pattern A: High ferritin with normal TS (< 45%) — favors reactive/inflammatory causes.");
      if (hasReactive) steps.push(`Identified reactive cause(s): ${reactiveCauses.join(", ")}. Treat underlying condition; no iron-overload work-up unless TS later rises.`);
      else steps.push("No clear reactive cause identified. Screen for liver disease (ALT/AST, GGT, ultrasound), alcohol use, metabolic syndrome, infection/inflammation.");
      steps.push("Monitor TS and ferritin in 3–6 months. If TS rises ≥ 45%, reclassify as Pattern B.");
      return steps;
    }
    if (pattern === "B_high_TS_high_ferritin" || pattern === "C_high_TS_normal_ferritin") {
      if (pattern === "C_high_TS_normal_ferritin") steps.push("Pattern C: High TS (≥ 45%) with normal ferritin — possible early/latent HH or lab variability. Repeat fasting morning TS and ferritin in 3–6 months. If TS remains ≥ 45% on repeat, treat as Pattern B.");
      else steps.push("Pattern B: High TS (≥ 45%) with elevated ferritin — high pretest probability of iron overload.");
      if (hasSecondary) {
        steps.push(`Secondary iron overload identified: ${secondaryCauses.join(", ")}. Proceed to organ iron quantification (MRI LIC, cardiac T2*).`);
        steps.push("Management: iron chelation guided by LIC and cardiac iron plus underlying disease guidelines.");
      } else {
        steps.push("No clear secondary cause. Order HFE genotyping (C282Y, H63D) for suspected hereditary hemochromatosis.");
        if (hfeStatus === "c282y_homo") {
          steps.push("C282Y homozygote with TS ≥ 45% and elevated ferritin → diagnose HFE-related HH (biochemical iron overload).");
          steps.push("Initiate therapeutic phlebotomy: target ferritin 50–100 µg/L. Maintenance: 3–4 phlebotomies per year.");
          if (n(ferritin) < 1000) steps.push("Ferritin < 1000 µg/L and no cirrhosis risk factors — biopsy often unnecessary in C282Y homozygotes.");
        } else if (hfeStatus === "c282y_h63d_compound") {
          steps.push("C282Y/H63D compound heterozygote with persistent iron excess → non-classic HH. Consider broader genetic/metabolic work-up, hepatology referral.");
        } else if (hfeStatus === "negative") {
          steps.push("HFE negative and secondary causes excluded → evaluate for occult liver disease, metabolic syndrome, or rare iron overload syndromes.");
          steps.push("Consider hepatology referral; liver biopsy or MRI-based LIC if diagnosis remains unclear.");
        } else if (hfeStatus === "other") {
          steps.push("Non-HFE genetic pattern → broader genetic/metabolic work-up. Consider hepatology referral.");
        } else {
          steps.push("HFE genotyping pending. If C282Y homozygote → diagnose HH. If negative → evaluate for non-HFE causes.");
        }
      }
      steps.push("Organ iron assessment: preferred method is confounder-corrected R2*-based MRI for liver iron concentration (LIC).");
      if (hasSecondary || symptomsCardiac) steps.push("Cardiac T2* MRI recommended for myocardial iron burden (transfusional overload, thalassemia).");
    }
    return steps;
  }, [pattern, redFlags, hasReactive, hasSecondary, hfeStatus, reactiveCauses, secondaryCauses, ferritin, symptomsCardiac]);

  // ── Deficiency Notes ──
  const deficiencyNotes = useMemo(() => {
    if (!deficiencyDiagnosis) return [];
    const notes: string[] = [];
    if (deficiencyDiagnosis.label === "none" || deficiencyDiagnosis.label === "borderline" || deficiencyDiagnosis.label === "other")
      notes.push("This result does not indicate a clear need for iron replacement. Re-evaluate clinical context.");
    if (pregnancy) notes.push("Pregnancy: target Hb 11 g/dL. Oral is first-line unless rapid correction needed.");
    if (ckd) notes.push("CKD: target Hb 12 g/dL. IV iron preferred, especially if on ESA.");
    if (ganzoni && ganzoni.isIV && ganzoni.deficit > 0)
      notes.push(`Ganzoni deficit: ${Math.round(ganzoni.deficit)} mg. Target Hb ${ganzoni.targetHb} g/dL.`);
    if (ganzoni && ganzoni.isIV && deficiencyDiagnosis.label === "functional")
      notes.push("Functional iron deficiency: IV iron bypasses hepcidin-mediated block.");
    if (esa) notes.push("ESA use: monitor iron status closely; IV iron often needed to support erythropoiesis.");
    return notes;
  }, [deficiencyDiagnosis, pregnancy, ckd, esa, ganzoni]);

  // ── Build Summary ──
  const buildSummary = () => {
    const lines = [
      "COMPREHENSIVE IRON STUDIES ASSESSMENT",
      "=".repeat(50),
      `Patient: ${sex || "—"}, age ${age || "—"}`,
      "",
      "LABS",
      `  Serum iron: ${serumIron || "—"} µg/dL`,
      `  TIBC: ${tibc || "—"} µg/dL`,
      `  Transferrin saturation: ${computedTs ? computedTs + "% (computed)" : ts ? ts + "%" : "—"}`,
      `  Ferritin: ${ferritin || "—"} µg/L`,
      `  Hemoglobin: ${hemoglobin || "—"} g/dL`,
      `  Weight: ${weight || "—"} kg`,
      `  ALT: ${alt || "—"} / AST: ${ast || "—"}`,
      "",
      "DIFFERENTIAL DIAGNOSIS",
      `  Iron overload pattern: ${pattern === "normal" ? "Normal" : pattern === "A_high_ferritin_normal_TS" ? "A — High ferritin, normal TS" : pattern === "B_high_TS_high_ferritin" ? "B — High TS, high ferritin" : pattern === "C_high_TS_normal_ferritin" ? "C — High TS, normal ferritin" : "—"}`,
      `  Overload classification: ${overloadType === "none" ? "No iron excess" : overloadType === "reactive" ? "Reactive hyperferritinemia" : overloadType === "primary_hh" ? "HFE-related HH" : overloadType === "primary_non_hfe" ? "Non-classic / idiopathic iron overload" : overloadType === "secondary" ? "Secondary iron overload" : "—"}`,
      `  Iron deficiency: ${deficiencyDiagnosis ? deficiencyDiagnosis.diagnosis : "—"}`,
      "",
      ganzoni ? `  Ganzoni deficit: ${Math.round(ganzoni.deficit)} mg (target Hb ${ganzoni.targetHb} g/dL)` : "",
      ganzoni ? `  Recommended route: ${ganzoni.isIV ? "IV iron" : "Oral iron"}` : "",
      ganzoni ? `  Dose: ${ganzoni.doseText}` : "",
      "",
      redFlags.length ? "RED FLAGS\n" + redFlags.map(f => "  • " + f).join("\n") + "\n" : "",
      secondaryCauses.length ? "SECONDARY CAUSES\n" + secondaryCauses.map(s => "  • " + s).join("\n") + "\n" : "",
      reactiveCauses.length ? "REACTIVE CAUSES\n" + reactiveCauses.map(s => "  • " + s).join("\n") + "\n" : "",
      hfeStatus !== "unknown" ? `HFE: ${hfeStatus}` : "",
      "",
      "OVERLOAD MANAGEMENT PATHWAY",
      ...overloadPathway.map((s, i) => `  ${i + 1}. ${s}`),
      "",
      deficiencyNotes.length ? "DEFICIENCY NOTES\n" + deficiencyNotes.map(s => "  • " + s).join("\n") : "",
    ];
    return lines.filter(Boolean).join("\n");
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(buildSummary());
    toast({ title: "Summary copied", description: "Iron studies assessment copied to clipboard." });
  };

  const handlePrint = () => {
    const html = `<!doctype html><html><head><title>Iron Studies Assessment</title>
      <style>body{font-family:system-ui,sans-serif;max-width:780px;margin:2rem auto;padding:0 1.5rem;color:#111;line-height:1.5}
      h1{font-size:18px;border-bottom:2px solid #333;padding-bottom:6px}
      pre{white-space:pre-wrap;font-family:inherit;font-size:13px}
      .meta{font-size:11px;color:#666;margin-top:24px;border-top:1px solid #ccc;padding-top:8px}</style></head>
      <body><h1>Comprehensive Iron Studies Assessment</h1>
      <pre>${buildSummary().replace(/</g,"&lt;")}</pre>
      <div class="meta">Generated ${new Date().toLocaleString()} — clinical decision support, not a substitute for clinical judgment.</div>
      <script>window.onload=()=>window.print()</script></body></html>`;
    const w = window.open("", "_blank");
    if (w) { w.document.write(html); w.document.close(); }
  };

  const handleReset = () => {
    setTs(""); setFerritin(""); setSerumIron(""); setTibc(""); setHemoglobin(""); setWeight(""); setAlt(""); setAst("");
    setSex(""); setAge("");
    setTransfusions(false); setThalassemia(false); setSickleCell(false); setChronicAnemia(false); setMds(false);
    setViralHepatitis(false); setAlcohol(false); setNafld(false); setMetabolicSyndrome(false); setCkd(false);
    setInflammation(false); setHemolysis(false); setPct(false);
    setPregnancy(false); setEsa(false); setChf(false); setIbd(false); setRls(false); setBariatric(false);
    setOralIntolerance(false); setRapidCorrection(false); setOngoingBloodLoss(false);
    setSymptomsFatigue(false); setSymptomsArthralgia(false); setSymptomsDiabetes(false); setSymptomsCardiac(false); setSymptomsHypogonadism(false);
    setFamilyHx(false); setHfeStatus("unknown"); setShowAdvanced(false);
  };

  const hasData = n(ferritin) > 0 || tsVal > 0 || n(serumIron) > 0 || n(tibc) > 0;

  return (
    <div className="space-y-4 max-w-6xl mx-auto">
      {/* Header */}
      <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-accent/5">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Droplets className="h-5 w-5 text-primary" />
            <CardTitle className="text-xl">Iron Studies — Comprehensive Assessment</CardTitle>
          </div>
          <CardDescription>
            Unified iron evaluation: deficiency diagnosis + Ganzoni dosing + iron overload algorithm + differential diagnosis. Enter any combination of labs to begin.
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Labs */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2"><FlaskConical className="h-4 w-4 text-primary" />Iron Studies</CardTitle>
            <Button size="sm" variant="ghost" onClick={handleReset}><RotateCcw className="h-3 w-3" /></Button>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <RangeOrExact 
              id="serumIron" 
              label="Serum Iron" 
              unit="µg/dL" 
              value={serumIron} 
              onChange={setSerumIron} 
              ranges={RANGES.serumIron} 
              tooltip="Measures iron circulating in the blood. Varies significantly by diet and time of day. Ref: 60-170 µg/dL."
            />
            <RangeOrExact 
              id="tibc" 
              label="TIBC" 
              unit="µg/dL" 
              value={tibc} 
              onChange={setTibc} 
              ranges={RANGES.tibc} 
              tooltip="Total Iron Binding Capacity. Measures transferrin's capacity to bind iron; high levels usually indicate low iron stores. Ref: 240-450 µg/dL."
            />
            <RangeOrExact 
              id="ts" 
              label="Transferrin Saturation" 
              unit="%" 
              value={ts} 
              onChange={setTs} 
              ranges={RANGES.ts} 
              tooltip="The ratio of serum iron to TIBC. A key indicator of iron availability for erythropoiesis. Low (<20%) indicates deficiency. Ref: 20-50%."
            />
            <RangeOrExact 
              id="ferritin" 
              label="Ferritin" 
              unit="µg/L" 
              value={ferritin} 
              onChange={setFerritin} 
              ranges={RANGES.ferritin} 
              tooltip="Reflects total body iron stores. Also an acute-phase reactant (can be falsely high in inflammation). Ref: 30-300 µg/L."
            />
            <RangeOrExact 
              id="hemoglobin" 
              label="Hemoglobin" 
              unit="g/dL" 
              value={hemoglobin} 
              onChange={setHemoglobin} 
              ranges={RANGES.hemoglobin} 
              tooltip="The iron-containing oxygen-transport metalloprotein in red blood cells. Ref: 12-16 (F), 13.5-17.5 (M) g/dL."
            />
            <RangeOrExact 
              id="weight" 
              label="Weight" 
              unit="kg" 
              value={weight} 
              onChange={setWeight} 
              ranges={RANGES.weight} 
              tooltip="Required for Ganzoni formula deficit calculation."
            />
            <RangeOrExact 
              id="alt" 
              label="ALT" 
              unit="U/L" 
              value={alt} 
              onChange={setAlt} 
              ranges={RANGES.alt} 
              tooltip="Alanine Transaminase. Liver enzyme used to screen for liver damage in iron overload. Ref: 7-56 U/L."
            />
            <RangeOrExact 
              id="ast" 
              label="AST" 
              unit="U/L" 
              value={ast} 
              onChange={setAst} 
              ranges={RANGES.ast} 
              tooltip="Aspartate Transaminase. Liver enzyme used alongside ALT to assess liver health. Ref: 10-40 U/L."
            />
          </CardContent>
          {computedTs && (
            <CardContent className="pt-0">
              <div className="text-xs text-muted-foreground">
                Computed TS: <span className="font-semibold text-foreground">{computedTs}%</span> (serum iron / TIBC × 100)
              </div>
            </CardContent>
          )}
        </Card>

        {/* Patient + Context */}
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Stethoscope className="h-4 w-4 text-primary" />Patient &amp; Context</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Sex</Label>
                <Select value={sex} onValueChange={setSex}>
                  <SelectTrigger className="h-9"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="male">Male</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Age</Label>
                <Input type="number" className="h-9" value={age} onChange={e => setAge(e.target.value)} placeholder="years" />
              </div>
            </div>

            {/* Overload symptoms */}
            <div className="pt-2 border-t space-y-2">
              <div className="text-xs font-semibold text-muted-foreground">Symptoms (iron overload)</div>
              <div className="grid grid-cols-2 gap-x-3 gap-y-2">
                {[
                  ["fatigue","Fatigue / malaise", symptomsFatigue, setSymptomsFatigue],
                  ["arthralgia","Arthralgia (MCP/PIP)", symptomsArthralgia, setSymptomsArthralgia],
                  ["diab","Diabetes / glucose intolerance", symptomsDiabetes, setSymptomsDiabetes],
                  ["cardiac","Cardiac symptoms", symptomsCardiac, setSymptomsCardiac],
                  ["hypo","Hypogonadism / libido loss", symptomsHypogonadism, setSymptomsHypogonadism],
                ].map(([id, label, val, setter]: any) => (
                  <label key={id} className="flex items-center gap-2 text-xs cursor-pointer">
                    <Checkbox checked={val} onCheckedChange={(v) => setter(!!v)} />
                    <span>{label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Family history */}
            <div className="pt-2 border-t">
              <label className="flex items-center gap-2 text-xs cursor-pointer">
                <Checkbox checked={familyHx} onCheckedChange={(v) => setFamilyHx(!!v)} />
                <span>Family history of hemochromatosis / iron overload</span>
              </label>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Risk factor cards */}
      <div className="grid lg:grid-cols-3 gap-4">
        {/* Secondary overload */}
        <Card>
          <CardHeader><CardTitle className="text-sm flex items-center gap-2"><HeartPulse className="h-4 w-4 text-primary" />Secondary Overload</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 gap-x-3 gap-y-2">
            {[
              ["transfusions","Chronic transfusions", transfusions, setTransfusions],
              ["thal","Thalassemia", thalassemia, setThalassemia],
              ["scd","Sickle cell disease", sickleCell, setSickleCell],
              ["anemia","Other chronic anemia", chronicAnemia, setChronicAnemia],
              ["mds","MDS / sideroblastic anemia", mds, setMds],
              ["hemolysis","Chronic hemolysis", hemolysis, setHemolysis],
              ["pct","Porphyria cutanea tarda", pct, setPct],
            ].map(([id, label, val, setter]: any) => (
              <label key={id} className="flex items-center gap-2 text-xs cursor-pointer">
                <Checkbox checked={val} onCheckedChange={(v) => setter(!!v)} />
                <span>{label}</span>
              </label>
            ))}
          </CardContent>
        </Card>

        {/* Reactive hyperferritinemia */}
        <Card>
          <CardHeader><CardTitle className="text-sm flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-warning" />Reactive / Inflammatory</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 gap-x-3 gap-y-2">
            {[
              ["nafld","NAFLD / MASLD", nafld, setNafld],
              ["alcohol","Alcohol use", alcohol, setAlcohol],
              ["metsyn","Metabolic syndrome", metabolicSyndrome, setMetabolicSyndrome],
              ["ckd","CKD", ckd, setCkd],
              ["inflam","Inflammation / infection", inflammation, setInflammation],
              ["viralhep","Viral hepatitis", viralHepatitis, setViralHepatitis],
            ].map(([id, label, val, setter]: any) => (
              <label key={id} className="flex items-center gap-2 text-xs cursor-pointer">
                <Checkbox checked={val} onCheckedChange={(v) => setter(!!v)} />
                <span>{label}</span>
              </label>
            ))}
          </CardContent>
        </Card>

        {/* Deficiency context */}
        <Card>
          <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Syringe className="h-4 w-4 text-primary" />Deficiency Context</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 gap-x-3 gap-y-2">
            {[
              ["preg","Pregnancy", pregnancy, setPregnancy],
              ["esa","On ESA therapy", esa, setEsa],
              ["chf","Chronic heart failure", chf, setChf],
              ["ibd","IBD / GI inflammation", ibd, setIbd],
              ["rls","Restless legs syndrome", rls, setRls],
              ["bariatric","Post-bariatric surgery", bariatric, setBariatric],
              ["oralintol","Oral iron intolerant", oralIntolerance, setOralIntolerance],
              ["rapid","Rapid correction needed", rapidCorrection, setRapidCorrection],
              ["bloodloss","Ongoing blood loss", ongoingBloodLoss, setOngoingBloodLoss],
            ].map(([id, label, val, setter]: any) => (
              <label key={id} className="flex items-center gap-2 text-xs cursor-pointer">
                <Checkbox checked={val} onCheckedChange={(v) => setter(!!v)} />
                <span>{label}</span>
              </label>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* HFE genotyping */}
      <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
        <Card>
          <CardHeader className="py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Dna className="h-4 w-4 text-primary" />
                <CardTitle className="text-sm">HFE Genotyping &amp; Advanced Work-up</CardTitle>
              </div>
              <CollapsibleTrigger asChild>
                <button type="button" className="text-xs text-primary hover:underline flex items-center gap-1">
                  {showAdvanced ? "Hide" : "Show"} <ChevronDown className={`h-3 w-3 transition-transform ${showAdvanced ? "rotate-180" : ""}`} />
                </button>
              </CollapsibleTrigger>
            </div>
          </CardHeader>
          <CollapsibleContent>
            <CardContent className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs">HFE Genotyping Result</Label>
                <Select value={hfeStatus} onValueChange={setHfeStatus}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unknown">Not tested / pending</SelectItem>
                    <SelectItem value="negative">Negative (no C282Y/H63D)</SelectItem>
                    <SelectItem value="c282y_homo">C282Y homozygote</SelectItem>
                    <SelectItem value="c282y_h63d_compound">C282Y/H63D compound heterozygote</SelectItem>
                    <SelectItem value="other">Other / non-HFE mutation</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="text-xs text-muted-foreground space-y-1 p-3 rounded-lg bg-muted/30">
                <p><strong>HFE genotyping indications</strong> (per AASLD/EASL):</p>
                <ul className="list-disc list-inside space-y-0.5">
                  <li>TS ≥ 45% (fasting, morning) on at least two occasions</li>
                  <li>Elevated ferritin above sex-specific threshold</li>
                  <li>Family history of hemochromatosis</li>
                  <li>Unexplained liver disease with elevated iron indices</li>
                </ul>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Results */}
      {hasData && (
        <Card className="border-primary/40">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">Computed Assessment</CardTitle>
              <CardDescription>
                Iron deficiency diagnosis, Ganzoni dosing, overload classification, and differential diagnosis
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={handleCopy}><Copy className="h-4 w-4 mr-1" />Copy</Button>
              <Button size="sm" variant="outline" onClick={() => downloadTextFile(`iron-studies-${new Date().toISOString().slice(0,10)}`, buildSummary())}><Download className="h-4 w-4 mr-1" />Download .txt</Button>
              <Button size="sm" onClick={handlePrint}><Printer className="h-4 w-4 mr-1" />Print / PDF</Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Summary cards */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="p-3 rounded-lg border bg-card/60">
                <div className="text-xs uppercase text-muted-foreground">Iron Pattern</div>
                <div className="text-sm font-semibold mt-1">
                  {pattern === "normal" ? "Normal" :
                   pattern === "A_high_ferritin_normal_TS" ? "A — High ferritin, normal TS" :
                   pattern === "B_high_TS_high_ferritin" ? "B — High TS, high ferritin" :
                   pattern === "C_high_TS_normal_ferritin" ? "C — High TS, normal ferritin" : "—"}
                </div>
              </div>
              <div className="p-3 rounded-lg border bg-card/60">
                <div className="text-xs uppercase text-muted-foreground">TS</div>
                <div className="text-sm font-semibold mt-1">{computedTs ? `${computedTs}%` : ts ? `${ts}%` : "—"}</div>
                <div className="mt-1">
                  {tsVal >= 45 ? <Badge className="bg-red-500/15 text-red-400 border-red-500/30">Elevated (≥45%)</Badge> :
                   tsVal > 0 ? <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30">Normal</Badge> :
                   <Badge variant="outline">—</Badge>}
                </div>
              </div>
              <div className="p-3 rounded-lg border bg-card/60">
                <div className="text-xs uppercase text-muted-foreground">Ferritin</div>
                <div className="text-sm font-semibold mt-1">{ferritin || "—"} µg/L</div>
                <div className="mt-1">
                  {(() => {
                    const f = n(ferritin);
                    const threshold = sex === "female" ? 200 : 300;
                    if (f > threshold) return <Badge className="bg-red-500/15 text-red-400 border-red-500/30">Elevated</Badge>;
                    if (f > 0) return <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30">Normal</Badge>;
                    return <Badge variant="outline">—</Badge>;
                  })()}
                </div>
              </div>
              <div className="p-3 rounded-lg border bg-card/60">
                <div className="text-xs uppercase text-muted-foreground">Overload</div>
                <div className="text-sm font-semibold mt-1">
                  {overloadType === "none" ? "No iron excess" :
                   overloadType === "reactive" ? "Reactive hyperferritinemia" :
                   overloadType === "primary_hh" ? "HFE-related HH" :
                   overloadType === "primary_non_hfe" ? "Non-classic iron overload" :
                   overloadType === "secondary" ? "Secondary iron overload" : "—"}
                </div>
              </div>
            </div>

            {/* Interpretation Summary */}
            {hasData && (
              <div className={cn(
                "p-3 rounded-lg border",
                deficiencyDiagnosis?.label === "none" || pattern === "normal"
                  ? "bg-emerald-500/5 border-emerald-500/20"
                  : "bg-primary/5 border-primary/20"
              )}>
                <div className="flex items-center gap-2 mb-2">
                  <Stethoscope className="h-4 w-4 text-primary" />
                  <span className="text-sm font-bold">Interpretation Summary</span>
                </div>
                <div className="text-sm">
                  {deficiencyDiagnosis?.label !== "none" && deficiencyDiagnosis?.label !== "unknown" ? (
                    <div className="flex items-start gap-2 text-amber-600 dark:text-amber-400">
                      <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                      <p>
                        Likely <span className="font-bold">{deficiencyDiagnosis.diagnosis}</span>. {deficiencyDiagnosis.detail}
                      </p>
                    </div>
                  ) : pattern !== "normal" && pattern !== null ? (
                    <div className="flex items-start gap-2 text-primary">
                      <Info className="h-4 w-4 mt-0.5 shrink-0" />
                      <p>
                        Pattern indicates <span className="font-bold">{overloadType === 'reactive' ? 'Reactive Hyperferritinemia' : 'Possible Iron Overload'}</span>. TSAT is {tsVal}%.
                      </p>
                    </div>
                  ) : (
                    <div className="flex items-start gap-2 text-emerald-600 dark:text-emerald-400">
                      <Check className="h-4 w-4 mt-0.5 shrink-0" />
                      <p>Iron studies are currently within <span className="font-bold">Normal Limits</span> for iron deficiency assessment.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Deficiency + Ganzoni */}
            {deficiencyDiagnosis && (
              <div className="p-3 rounded-lg border bg-card/60">
                <div className="text-xs mb-2 flex items-center gap-2">
                  <Pill className="h-3 w-3 text-primary" />
                  <span className="font-bold">Iron Deficiency Assessment</span>
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div>
                    <div className="text-xs text-muted-foreground">Diagnosis</div>
                    <div className="text-sm font-semibold mt-0.5">{deficiencyDiagnosis.diagnosis}</div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">{deficiencyDiagnosis.detail}</div>
                  </div>
                  {ganzoni && (
                    <>
                      <div>
                        <div className="text-xs text-muted-foreground">Route</div>
                        <div className="text-sm font-semibold mt-0.5">{ganzoni.isIV ? "IV iron" : "Oral iron"}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Ganzoni Deficit</div>
                        <div className="text-sm font-semibold mt-0.5">{Math.round(ganzoni.deficit)} mg</div>
                        <div className="text-[10px] text-muted-foreground mt-0.5">Target Hb: {ganzoni.targetHb} g/dL</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Dose</div>
                        <div className="text-xs font-semibold mt-0.5">{ganzoni.doseText}</div>
                      </div>
                    </>
                  )}
                </div>
                {deficiencyNotes.length > 0 && (
                  <div className="mt-2 text-xs text-muted-foreground space-y-0.5">
                    {deficiencyNotes.map((n, i) => <p key={i}>• {n}</p>)}
                  </div>
                )}
              </div>
            )}

            {/* Differential Diagnosis */}
            {n(ferritin) > 0 && tsVal > 0 && (
              <DifferentialDiagnosisTable
                ferritin={n(ferritin)}
                tsVal={tsVal}
                sex={sex}
                inflammation={inflammation}
                ckd={ckd}
                pregnancy={pregnancy}
              />
            )}

            {/* Red flags */}
            {redFlags.length > 0 && (
              <div className="p-3 rounded-lg border border-red-500/40 bg-destructive/100/5">
                <div className="text-xs font-semibold text-destructive mb-1">Red flags — urgent action</div>
                <ul className="text-xs space-y-0.5 list-disc list-inside">
                  {redFlags.map(f => <li key={f}>{f}</li>)}
                </ul>
              </div>
            )}

            {/* Overload pathway */}
            {overloadPathway.length > 0 && (
              <div className="p-3 rounded-lg border bg-card/60">
                <div className="text-xs font-semibold mb-2">Overload management pathway</div>
                <ol className="text-xs space-y-1 list-decimal list-inside">
                  {overloadPathway.map((s, i) => <li key={i}>{s}</li>)}
                </ol>
              </div>
            )}

            {/* Reference thresholds */}
            <div className="text-xs text-muted-foreground space-y-1 p-3 rounded-lg bg-muted/30">
              <p className="font-semibold">Screening thresholds (adult, non-pregnant):</p>
              <ul className="list-disc list-inside space-y-0.5">
                <li>TS ≥ 45% suggests iron overload</li>
                <li>Ferritin &gt; 300 µg/L (men) or &gt; 200 µg/L (women) strengthens suspicion</li>
                <li>TS &lt; 20% suggests inadequate iron for erythropoiesis</li>
                <li>Ferritin &lt; 30 (no inflammation) or &lt; 100 (with inflammation) = absolute iron deficiency</li>
              </ul>
              <p className="mt-2 text-[10px] text-muted-foreground/70">
                Sources: AASLD, EASL, BC Guidelines, Mayo Clinic Laboratories, NCBI, ESGAR/SAR, ACG Clinical Guideline 2023, KDIGO
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
