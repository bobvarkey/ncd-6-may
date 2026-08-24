import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Droplets,
  Syringe,
  Pill,
  AlertTriangle,
  CheckCircle2,
  FlaskConical,
  Heart,
  Home,
  RotateCcw,
  Calculator,
  ChevronDown,
  BookOpen,
  Info,
  Copy,
  Printer,
  Download,
  Activity,
} from "lucide-react";
import { copyToClipboard, formatClinicalNote, downloadTextFile, parseClinicalValue, roundClinical } from "@/lib/clinical-utils";
import { cn } from "@/lib/utils";

// ── Types ──────────────────────────────────────────────────────
type TabKey = "calculator" | "reference" | "about";

const TABS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  { key: "calculator", label: "Calculator", icon: <Calculator className="h-4 w-4" /> },
  { key: "reference", label: "Reference", icon: <BookOpen className="h-4 w-4" /> },
  { key: "about", label: "About", icon: <Info className="h-4 w-4" /> },
];

interface PatientInputs {
  ferritin: string;
  hemoglobin: string;
  weight: string;
  tsat: string;
  serumIron: string;
  tibc: string;
}

interface ClinicalFlags {
  // Comorbidities affecting iron metabolism
  inflammation: boolean;
  pregnancy: boolean;
  ckd: boolean;
  esa: boolean;
  chf: boolean; // Chronic heart failure
  ibd: boolean; // Inflammatory bowel disease / chronic GI inflammation
  rls: boolean; // Restless legs syndrome
  bariatric: boolean; // Post-bariatric surgery
  
  // Clinical scenarios
  oralIntolerance: boolean;
  rapidCorrection: boolean;
  ongoingBloodLoss: boolean;
}

interface DiagnosisResult {
  diagnosis: string;
  detail: string;
  label: "absolute" | "early" | "borderline" | "functional" | "none" | "other" | "unknown";
}

interface RecommendationResult {
  route: "IV iron" | "Oral iron";
  isIV: boolean;
  deficit: number;
  doseText: string;
  targetHb: number;
}

// ── Logic ──────────────────────────────────────────────────────
function getTSAT(inputs: PatientInputs): number | null {
  if (inputs.tsat && parseFloat(inputs.tsat) > 0) return parseFloat(inputs.tsat);
  const si = parseFloat(inputs.serumIron);
  const tibc = parseFloat(inputs.tibc);
  if (!isNaN(si) && !isNaN(tibc) && tibc > 0) return (si / tibc) * 100;
  return null;
}

function diagnose(ferritin: number, tsat: number, inflammation: boolean): DiagnosisResult {
  const hasInflam = inflammation;
  
  // Exact thresholds per clinical guidelines
  const ferritinAbsLow = hasInflam ? ferritin < 100 : ferritin < 30;
  const ferritinFunctional = ferritin >= 100 && ferritin < 300;
  const ferritinReplete = ferritin >= 300;
  const tsatLow = tsat < 20;
  const tsatNormal = tsat >= 20;

  // Diagnostic logic per reference guidelines
  if (ferritinAbsLow && tsatLow)
    return { diagnosis: "Absolute Iron Deficiency", detail: "Ferritin <30 (no inflammation) or <100 (with inflammation) + TSAT <20%. Definitive iron deficiency.", label: "absolute" };

  if (ferritinFunctional && tsatLow) {
    if (hasInflam)
      return { diagnosis: "Functional Iron Deficiency", detail: "Ferritin 100–300 ng/mL with TSAT <20% in setting of inflammation — iron trapped in storage.", label: "functional" };
    return { diagnosis: "Functional Iron Deficiency (CKD/ESA)", detail: "Ferritin 100–300 with low TSAT — iron available but not utilized.IV iron indicated per guidelines.", label: "functional" };
  }

  if (!hasInflam && ferritin >= 30 && ferritin < 100) {
    if (tsatNormal)
      return { diagnosis: "Early/Marginal Iron Deficiency", detail: "Ferritin 30–100 with normal TSAT. Low stores, still sufficient for erythropoiesis.Oral iron may benefit.", label: "early" };
    return { diagnosis: "Absolute Iron Deficiency (Borderline)", detail: "Ferritin 30–100 with low TSAT — consistent with absolute iron deficiency despite borderline ferritin.", label: "absolute" };
  }

  if (ferritinReplete && tsatNormal)
    return { diagnosis: "Iron Deficiency Unlikely", detail: "Ferritin ≥300 ng/mL and TSAT ≥20%. Adequate iron stores.", label: "none" };

  if (ferritinReplete && tsatLow)
    return { diagnosis: "Low TSAT with Replete Ferritin", detail: "Consider anemia of chronic disease, mixed deficiency, or lab error. Further workup needed.", label: "other" };

  if (ferritinFunctional && tsatNormal)
    return { diagnosis: "Iron Deficiency Unlikely", detail: "Ferritin 100–300 with normal TSAT — adequate iron for erythropoiesis.", label: "none" };

  return { diagnosis: "Unable to Classify", detail: "Check input values.", label: "unknown" };
}

function getTargetHb(weight: number, pregnancy: boolean, ckd: boolean): number {
  if (pregnancy) return 11;
  if (ckd) return 12;
  if (weight >= 35) return 14;
  return 13;
}

function getIronStores(weight: number): number {
  return weight >= 35 ? 500 : 15 * weight;
}

function recommend(
  dx: DiagnosisResult,
  hb: number,
  weight: number,
  pregnancy: boolean,
  ckd: boolean,
  esa: boolean,
  intolerance: boolean,
  rapid: boolean,
  bloodLoss: boolean
): RecommendationResult {
  // IV iron indications per clinical guidelines:
  // Hb < 10 g/dL (severe anemia),
  // CKD (especially if on ESA),
  // Functional iron deficiency (ferritin ≥ 100 but TSAT < 20%),
  // Intolerance/malabsorption/failure of oral,
  // Need for rapid correction (preop, symptomatic),
  // Ongoing heavy blood loss
  const isIV = hb < 10 || dx.label === "functional" || ckd || esa || intolerance || rapid || bloodLoss;

  const targetHb = getTargetHb(weight, pregnancy, ckd);
  const stores = getIronStores(weight);
  const rawDeficit = weight * (targetHb - hb) * 2.4 + stores;
  const deficit = Math.max(0, rawDeficit);


  let doseText: string;
  if (isIV) {
    // IV iron dosing per guidelines:
    // deficit ≤ 500 mg → 500 mg single dose
    // deficit 500–1000 mg → 1000 mg (single or split)
    // deficit > 1000 mg → rounded split into 1–2 doses (max 1000–1500 mg/week)
    if (deficit <= 500) {
      doseText = `${Math.round(deficit)} mg → 500 mg IV iron (single dose)`;
    } else if (deficit <= 1000) {
      doseText = `${Math.round(deficit)} mg → 1000 mg IV iron (single or split dose)`;
    } else {
      const rounded = Math.ceil(deficit / 100) * 100;
      doseText = `${Math.round(deficit)} mg → ${rounded} mg IV iron, split over 1–2 doses (max 1000–1500 mg/week per product)`;
    }
  } else {
    // Oral iron: 40–65 mg elemental iron once daily or every other day
    // Every-other-day improves absorption and reduces GI side effects
    doseText = "40–65 mg elemental iron PO daily or every other day (e.g., ferrous sulfate 325 mg = 65 mg elemental)";
  }

  return { route: isIV ? "IV iron" : "Oral iron", isIV, deficit, doseText, targetHb };
}

function buildNotes(
  dx: DiagnosisResult,
  rec: RecommendationResult,
  pregnancy: boolean,
  ckd: boolean,
  esa: boolean,
  intolerance: boolean,
  rapid: boolean,
  bloodLoss: boolean
): string[] {
  const notes: string[] = [];
  if (dx.label === "none" || dx.label === "borderline" || dx.label === "other")
    notes.push("This result does not indicate a clear need for iron replacement. Re-evaluate clinical context.");
  if (pregnancy)
    notes.push("Pregnancy: target Hb 11 g/dL. Oral is first-line unless rapid correction needed.");
  if (ckd)
    notes.push("CKD: target Hb 12 g/dL. IV iron preferred, especially if on ESA.");
  if (rec.isIV && rec.deficit > 0)
    notes.push(`Ganzoni deficit: ${Math.round(rec.deficit)} mg. Target Hb ${rec.targetHb} g/dL.`);
  if (rec.isIV && dx.label === "functional")
    notes.push("Functional iron deficiency: IV iron bypasses hepcidin-mediated block.");
  if (esa)
    notes.push("ESA use: monitor iron status closely; IV iron often needed to support erythropoiesis.");
  return notes;
}

// ── Range / Exact toggle ───────────────────────────────────────
type RangeOpt = { label: string; mid: number };
const RANGES: Record<string, RangeOpt[]> = {
  ferritin: [
    { label: "< 10 (very low)", mid: 5 },
    { label: "10 – 29", mid: 20 },
    { label: "30 – 49", mid: 40 },
    { label: "50 – 100", mid: 75 },
    { label: "101 – 200", mid: 150 },
    { label: "> 200", mid: 300 },
  ],
  hemoglobin: [
    { label: "< 7 (severe anemia)", mid: 6 },
    { label: "7 – 9.9", mid: 8.5 },
    { label: "10 – 11.9", mid: 11 },
    { label: "12 – 13.5", mid: 13 },
    { label: "> 13.5", mid: 15 },
  ],
  weight: [
    { label: "< 40 kg", mid: 35 },
    { label: "40 – 59", mid: 50 },
    { label: "60 – 79", mid: 70 },
    { label: "80 – 99", mid: 90 },
    { label: "100 – 120", mid: 110 },
    { label: "> 120", mid: 140 },
  ],
  serumIron: [
    { label: "< 30 (very low)", mid: 20 },
    { label: "30 – 59", mid: 45 },
    { label: "60 – 99", mid: 80 },
    { label: "100 – 149", mid: 125 },
    { label: "150 – 200", mid: 175 },
    { label: "> 200", mid: 220 },
  ],
  tibc: [
    { label: "< 200 (low)", mid: 180 },
    { label: "200 – 299", mid: 250 },
    { label: "300 – 399", mid: 350 },
    { label: "400 – 499", mid: 450 },
    { label: "> 500", mid: 550 },
  ],
  tsat: [
    { label: "< 5% (very low)", mid: 3 },
    { label: "5 – 10%", mid: 7.5 },
    { label: "11 – 15%", mid: 13 },
    { label: "16 – 20%", mid: 18 },
    { label: "21 – 30%", mid: 25 },
    { label: "> 30%", mid: 35 },
  ],
};

function RangeOrExact({
  id, label, unit, value, onChange, fieldKey, required,
}: {
  id: string;
  label: string;
  unit?: string;
  value: string;
  onChange: (v: string) => void;
  fieldKey: keyof typeof RANGES;
  required?: boolean;
}) {
  const [mode, setMode] = useState<"range" | "exact">("range");
  const opts = RANGES[fieldKey] || [];
  const matched = opts.find((o) => String(o.mid) === value);
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label htmlFor={id} className="text-sm font-medium">
          {label} {required && <span className="text-destructive">*</span>}
          {unit && <span className="text-xs text-muted-foreground ml-1">({unit})</span>}
        </Label>
        <button type="button" onClick={() => setMode(m => m === "range" ? "exact" : "range")}
          className="text-xs text-primary hover:underline">{mode === "range" ? "exact" : "range"}</button>
      </div>
      {mode === "range" ? (
        <Select value={value} onValueChange={(v) => {
          const opt = opts.find((o) => o.label === v);
          onChange(opt ? String(opt.mid) : v);
        }}>
          <SelectTrigger id={id} className="h-9">
            <SelectValue placeholder="Select range">
              {matched?.label ?? value ?? "Select range"}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {opts.map((o) => (
              <SelectItem key={o.label} value={o.label} className="text-xs">
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <Input
          id={id} type="text" inputMode="decimal" step="0.1"
          placeholder={`e.g. ${opts.length ? opts[Math.floor(opts.length / 2)].mid : ""}`}
          value={value} onChange={(e) => onChange(e.target.value)}
          className="h-9"
        />
      )}
    </div>
  );
}

// ── Default State ──────────────────────────────────────────────
const EMPTY_INPUTS: PatientInputs = {
  ferritin: "",
  hemoglobin: "",
  weight: "",
  tsat: "",
  serumIron: "",
  tibc: "",
};

const DEFAULT_FLAGS: ClinicalFlags = {
  // Comorbidities
  inflammation: false,
  pregnancy: false,
  ckd: false,
  esa: false,
  chf: false,
  ibd: false,
  rls: false,
  bariatric: false,
  
  // Scenarios
  oralIntolerance: false,
  rapidCorrection: false,
  ongoingBloodLoss: false,
};

// ── Diagnosis severity colors ──────────────────────────────────
const dxColors: Record<string, { bg: string; border: string; text: string; accent: string }> = {
  absolute: { bg: "bg-destructive/100/10", border: "border-red-500/30", text: "text-destructive", accent: "bg-destructive/100" },
  early: { bg: "bg-warning/100/10", border: "border-amber-500/30", text: "text-warning", accent: "bg-warning/100" },
  borderline: { bg: "bg-warning/10", border: "border-yellow-500/30", text: "text-yellow-400", accent: "bg-warning" },
  functional: { bg: "bg-warning/100/10", border: "border-warning/30", text: "text-warning", accent: "bg-warning/100" },
  none: { bg: "bg-emerald-500/10", border: "border-emerald-500/30", text: "text-emerald-400", accent: "bg-emerald-500" },
  other: { bg: "bg-muted0/10", border: "border-slate-500/30", text: "text-muted-foreground", accent: "bg-muted0" },
  unknown: { bg: "bg-muted0/10", border: "border-border", text: "text-muted-foreground", accent: "bg-muted0" },
};

// ── Live Iron Parameters Card (auto-calc, no flags needed) ────
function IronParametersLive({
  inputs,
}: {
  inputs: PatientInputs;
}) {
  const hb = parseClinicalValue(inputs.hemoglobin) ?? NaN;
  const weight = parseClinicalValue(inputs.weight) ?? NaN;
  const ferritin = parseClinicalValue(inputs.ferritin) ?? NaN;

  // TSAT — calculated from serum iron/TIBC or entered directly
  const tsatVal = (() => {
    const t = parseClinicalValue(inputs.tsat);
    if (t !== null && t > 0) return t;
    const si = parseClinicalValue(inputs.serumIron);
    const tibc = parseClinicalValue(inputs.tibc);
    if (si !== null && tibc !== null && tibc > 0) return (si / tibc) * 100;
    return null;
  })();

  // Target Hb — default 14 for ≥35kg, 13 for <35kg (no pregnancy/CKD flags since user wants flags-free)
  const targetHb = (() => {
    if (isNaN(weight)) return null;
    return weight >= 35 ? 14 : 13;
  })();

  // Ganzoni iron deficit formula: Weight × (Target Hb − Actual Hb) × 2.4 + Iron Stores
  // Iron stores: 500 mg for ≥35kg, 15 mg/kg for <35kg
  const ironStores = (() => {
    if (isNaN(weight)) return null;
    return weight >= 35 ? 500 : 15 * weight;
  })();

  const ganzoniDeficit = (() => {
    if (isNaN(hb) || isNaN(weight) || targetHb === null) return null;
    const stores = ironStores!;
    const raw = weight * (targetHb - hb) * 2.4 + stores;
    return Math.max(0, Math.round(raw));
  })();

  // Derived status texts
  const hasAny =
    !isNaN(ferritin) || tsatVal !== null || (!isNaN(hb) && !isNaN(weight));

  if (!hasAny) return null; // Nothing to show yet

  const tsatDisplay = tsatVal !== null
    ? `${roundClinical(tsatVal, 1)}%`
    : null;

  return (
    <Card className="clinical-card border-primary/20 mt-4">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Activity className="h-3.5 w-3.5 text-primary" />
          Iron Parameters (Live Summary)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Parameter grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {/* Ferritin */}
          <div className="rounded-lg bg-card border border-border/50 p-2.5">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">Ferritin</div>
            <div className="text-sm font-semibold text-foreground font-mono">
              {!isNaN(ferritin) ? `${roundClinical(ferritin, 1)} ng/mL` : "—"}
            </div>
          </div>

          {/* TSAT */}
          <div className="rounded-lg bg-card border border-border/50 p-2.5">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">TSAT</div>
            <div className="text-sm font-semibold text-foreground font-mono">
              {tsatDisplay ?? "—"}
            </div>
          </div>

          {/* Target Hb */}
          <div className="rounded-lg bg-card border border-border/50 p-2.5">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">Target Hb</div>
            <div className="text-sm font-semibold text-foreground font-mono">
              {targetHb !== null ? `${roundClinical(targetHb, 1)} g/dL` : "—"}
            </div>
            {!isNaN(weight) && (
              <div className="text-[10px] text-muted-foreground mt-0.5">
                {targetHb !== null ? `Weight ≥35kg → 14; <35kg → 13` : ""}
              </div>
            )}
          </div>

          {/* Ganzoni Iron Deficit */}
          <div className="rounded-lg bg-card border border-primary/30 p-2.5">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">Ganzoni Deficit</div>
            <div className="text-sm font-semibold text-foreground font-mono">
              {ganzoniDeficit !== null ? `${ganzoniDeficit} mg` : "—"}
            </div>
            <div className="text-[10px] text-muted-foreground mt-0.5">
              {ganzoniDeficit !== null && ganzoniDeficit <= 500
                ? "→ 500 mg IV single dose"
                : ganzoniDeficit !== null && ganzoniDeficit <= 1000
                ? "→ 1000 mg IV (single/split)"
                : ganzoniDeficit !== null
                ? `→ ~${Math.ceil(ganzoniDeficit / 100) * 100} mg IV`
                : ""}
            </div>
          </div>
        </div>

        {/* Expandable Ganzoni explanation */}
        <Collapsible className="w-full">
          <CollapsibleTrigger className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
            <Info className="h-3 w-3" />
            How is the Ganzoni deficit calculated?
            <ChevronDown className="h-3 w-3 ml-1 collapsible-chevron" />
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2 text-xs text-muted-foreground leading-relaxed space-y-2 bg-card/50 rounded-lg p-3 border border-border/30">
            <p>
              The <strong>Ganzoni formula</strong> estimates total iron deficit (mg) for IV iron dosing:
            </p>
            <div className="font-mono text-foreground/80 bg-black/20 rounded px-2 py-1.5 text-center text-sm">
              Deficit = Weight (kg) × (Target Hb − Actual Hb) × 2.4 + Iron Stores
            </div>
            <ul className="space-y-1 list-disc pl-4">
              <li><strong>Weight × (Target Hb − Actual Hb) × 2.4</strong> — iron needed to raise Hb from current to target level. Factor 2.4 converts (g/dL · kg) to mg of iron.</li>
              <li><strong>Iron Stores</strong> — replenish total body iron stores: 500 mg for most adults, or 15 mg/kg for children &lt;35 kg.</li>
              <li><strong>Default Target Hb</strong>: 14 g/dL (≥35 kg) or 13 g/dL (&lt;35 kg). Adjust for pregnancy (11) or CKD (12) using the flags below.</li>
              <li>Result is <strong>rounded</strong> and capped at ≥0 mg. Dose rounding to nearest 100 mg follows product-specific vial sizes.</li>
            </ul>
            {ganzoniDeficit !== null && targetHb !== null && !isNaN(hb) && !isNaN(weight) && (
              <div className="bg-primary/5 rounded px-2 py-1.5 mt-1">
                <span className="font-semibold text-foreground/80">Your calculation:</span>{` `}
                {`${weight} × (${targetHb} − ${hb}) × 2.4 + ${ironStores} = ${ganzoniDeficit} mg`}
              </div>
            )}
            <p className="text-[10px] pt-1">
              Reference: <a href="https://www.perinatology.com/calculators/IV-Iron-Dosing-Calculator.htm" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Perinatology.com IV Iron Dosing Calculator</a>
            </p>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
}

// ── Component ──────────────────────────────────────────────────
export default function IronReplacementCalculator() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabKey>("calculator");
  
  // Initialize from localStorage if available
  const [inputs, setInputs] = useState<PatientInputs>(() => {
    try {
      const saved = localStorage.getItem("ncd_inputs_iron");
      return saved ? JSON.parse(saved) : EMPTY_INPUTS;
    } catch { return EMPTY_INPUTS; }
  });
  const [flags, setFlags] = useState<ClinicalFlags>(() => {
    try {
      const saved = localStorage.getItem("ncd_flags_iron");
      return saved ? JSON.parse(saved) : DEFAULT_FLAGS;
    } catch { return DEFAULT_FLAGS; }
  });
  const [calcResult, setCalcResult] = useState<{ tsat: number; dx: DiagnosisResult; rec: RecommendationResult; notes: string[] } | null>(null);

  // Auto-save to localStorage on changes
  useEffect(() => {
    localStorage.setItem("ncd_inputs_iron", JSON.stringify(inputs));
  }, [inputs]);
  useEffect(() => {
    localStorage.setItem("ncd_flags_iron", JSON.stringify(flags));
  }, [flags]);

  // Derived TSAT preview
  const previewTSAT = useMemo(() => getTSAT(inputs), [inputs]);

  const hasRequired = inputs.ferritin && inputs.hemoglobin && inputs.weight;
  const tsatReady = previewTSAT !== null;
  const canCalculate = !isNaN(parseFloat(inputs.ferritin)) || tsatReady;

  // Determine what can be shown
  const hasHb = !isNaN(parseFloat(inputs.hemoglobin));
  const hasWeight = !isNaN(parseFloat(inputs.weight)) && parseFloat(inputs.weight) > 0;

  function setInput(key: keyof PatientInputs, value: string) {
    setInputs(prev => ({ ...prev, [key]: value }));
    setCalcResult(null);
  }

  function handleSmartParse(values: Record<string, string>) {
    setInputs(prev => ({ ...prev, ...values }));
  }

  function toggleFlag(key: keyof ClinicalFlags) {
    setFlags(prev => ({ ...prev, [key]: !prev[key] }));
  }

  function handleCalculate() {
    const ferritin = parseFloat(inputs.ferritin);
    const hb = parseFloat(inputs.hemoglobin);
    const w = parseFloat(inputs.weight);
    const tsat = previewTSAT;

    // Need at least one: ferritin or TSAT
    if (isNaN(ferritin) && tsat === null) return;

    // Use what's available; infer missing when only one is provided
    let dx: DiagnosisResult;
    if (!isNaN(ferritin) && tsat !== null) {
      // Both available
      dx = diagnose(ferritin, tsat, flags.inflammation);
    } else if (!isNaN(ferritin)) {
      // Only ferritin — infer likely diagnosis based on clinical context
      const inferredTsat = ferritin < 30 ? 15 : ferritin < 100 ? 18 : ferritin < 300 ? 22 : 28;
      dx = diagnose(ferritin, inferredTsat, flags.inflammation);
      dx = { ...dx, diagnosis: dx.diagnosis + " (estimated)", detail: "TSAT estimated from ferritin. Enter serum iron + TIBC for exact calculation." };
    } else if (tsat !== null) {
      // Only TSAT — cannot determine without ferritin
      const inferredFerritin = 50; // Default mid-range
      dx = diagnose(inferredFerritin, tsat, flags.inflammation);
      dx = { ...dx, diagnosis: "Enter ferritin for definitive diagnosis", detail: "Only TSAT provided. Ferritin is required for accurate diagnosis." };
    } else {
      return;
    }

    // If we have Hb + Weight, do full recommendation
    if (!isNaN(hb) && !isNaN(w) && w > 0) {
      const rec = recommend(dx, hb, w, flags.pregnancy, flags.ckd, flags.esa, flags.oralIntolerance, flags.rapidCorrection, flags.ongoingBloodLoss);
      const notes = buildNotes(dx, rec, flags.pregnancy, flags.ckd, flags.esa, flags.oralIntolerance, flags.rapidCorrection, flags.ongoingBloodLoss);
      setCalcResult({ tsat: tsat || 0, dx, rec, notes });
    } else {
      // Partial result: diagnosis only
      const rec: RecommendationResult = {
        route: 'Oral iron',
        isIV: false,
        deficit: 0,
        doseText: 'Enter Hemoglobin and Weight to estimate dose.',
        targetHb: 14
      };
      const notes = buildNotes(dx, rec, flags.pregnancy, flags.ckd, flags.esa, flags.oralIntolerance, flags.rapidCorrection, flags.ongoingBloodLoss);
      notes.unshift('Partial entry: Hemoglobin and/or Weight missing. Dose estimate requires both values.');
      setCalcResult({ tsat: tsat || 0, dx, rec, notes });
    }
    setTimeout(() => {
      document.getElementById("results")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  }

  function handleReset() {
    setInputs(EMPTY_INPUTS);
    setFlags(DEFAULT_FLAGS);
    setCalcResult(null);
    localStorage.removeItem("ncd_inputs_iron");
    localStorage.removeItem("ncd_flags_iron");
  }

  const colors = calcResult ? dxColors[calcResult.dx.label] ?? dxColors.unknown : dxColors.unknown;

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky Header */}
      <div className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="mx-auto max-w-4xl px-4">
          <div className="flex items-center gap-3 py-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 shadow-md">
              <Droplets className="h-5 w-5 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="font-display text-xl font-extrabold tracking-tight bg-gradient-to-r from-sky-500 via-blue-500 to-indigo-500 bg-clip-text text-transparent truncate">
                Iron Replacement Calculator
              </h1>
              <p className="text-xs font-medium text-blue-500 dark:text-blue-400 truncate">
                Evidence-based iron deficiency diagnosis &amp; Ganzoni dosing
              </p>
            </div>
            <div className="flex items-center gap-2 no-print shrink-0">
              <Button variant="ghost" size="sm" onClick={() => navigate("/anemia")} title="Back to Anemia">
                <Home className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={handleReset} title="Reset">
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="flex gap-0.5 pb-2 overflow-x-auto no-print">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  "flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-2 text-xs font-semibold transition-colors",
                  activeTab === tab.key
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-4xl px-4 py-5 space-y-6">
        {activeTab === "calculator" && (
          <>
            {/* Disclaimer */}
            <div className="flex items-start gap-3 bg-amber-900/20 border border-amber-800/50 rounded-xl px-4 py-3 text-sm text-amber-300">
              <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0 text-amber-500" />
              <p>
                For <strong>educational and decision-support purposes only</strong>. Always correlate with clinical presentation and current guidelines.
              </p>
            </div>


            {/* ── Live Iron Parameters (auto-calc, no flags needed) ── */}
            <IronParametersLive inputs={inputs} />

            {/* Inputs */}
            <Card className="clinical-card border-primary/20">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <FlaskConical className="h-4 w-4 text-primary" />
                  Patient Lab Values
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* Row 1: Ferritin, Hb, Weight */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <RangeOrExact
                    id="ferritin" label="Ferritin" unit="ng/mL"
                    value={inputs.ferritin} onChange={(v) => setInput("ferritin", v)}
                    fieldKey="ferritin" required
                  />
                  <RangeOrExact
                    id="hemoglobin" label="Hemoglobin" unit="g/dL"
                    value={inputs.hemoglobin} onChange={(v) => setInput("hemoglobin", v)}
                    fieldKey="hemoglobin" required
                  />
                  <RangeOrExact
                    id="weight" label="Weight" unit="kg"
                    value={inputs.weight} onChange={(v) => setInput("weight", v)}
                    fieldKey="weight" required
                  />
                </div>

                {/* Row 2: Serum Iron + TIBC (above TSAT, matching its labeled placement) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <RangeOrExact
                    id="serumIron" label="Serum Iron" unit="µg/dL"
                    value={inputs.serumIron} onChange={(v) => setInput("serumIron", v)}
                    fieldKey="serumIron"
                  />
                  <RangeOrExact
                    id="tibc" label="TIBC" unit="µg/dL"
                    value={inputs.tibc} onChange={(v) => setInput("tibc", v)}
                    fieldKey="tibc"
                  />
                </div>

                {/* Row 3: TSAT (auto-calculated from Serum Iron/TIBC if not entered directly) */}
                <div>
                  <RangeOrExact
                    id="tsat" label="Transferrin Saturation (TSAT)" unit="%"
                    value={inputs.tsat} onChange={(v) => setInput("tsat", v)}
                    fieldKey="tsat"
                  />
                  <div className="flex items-center gap-1 mt-2">
                    <Calculator className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      {inputs.tsat
                        ? "✓ Using direct TSAT entry."
                        : inputs.serumIron && inputs.tibc && parseFloat(inputs.tibc) > 0
                        ? `⇢ Calculated TSAT: ${((parseFloat(inputs.serumIron) / parseFloat(inputs.tibc)) * 100).toFixed(1)}%`
                        : "Enter TSAT directly, or Serum Iron + TIBC to auto-calculate."}
                    </span>
                  </div>
                </div>

                {/* Live Iron Parameters Summary — independent of clinical context */}
                {(previewTSAT !== null || (hasHb && hasWeight)) && (() => {
                  const w = parseClinicalValue(inputs.weight) ?? 0;
                  const hb = parseClinicalValue(inputs.hemoglobin) ?? 0;
                  const ferritinNum = parseClinicalValue(inputs.ferritin) ?? NaN;
                  const liveTargetHb = hasWeight && w >= 35 ? 14 : 13;
                  const liveStores = hasWeight ? (w >= 35 ? 500 : 15 * w) : null;
                  const liveDeficit = hasHb && hasWeight
                    ? Math.max(0, w * (liveTargetHb - hb) * 2.4 + (liveStores ?? 0))
                    : null;
                  return (
                    <div className="rounded-xl border-2 border-primary/30 bg-primary/5 p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Calculator className="h-4 w-4 text-primary" />
                        <h4 className="text-sm font-bold text-foreground">Live Iron Parameters</h4>
                        <Badge variant="outline" className="text-[10px]">auto</Badge>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                        <div className="rounded-lg bg-background/60 p-2">
                          <p className="text-xs text-muted-foreground">TSAT</p>
                          <p className="font-bold text-base">{previewTSAT !== null ? roundClinical(previewTSAT, 1) + "%" : "—"}</p>
                        </div>
                        <div className="rounded-lg bg-background/60 p-2">
                          <p className="text-xs text-muted-foreground">Ferritin</p>
                          <p className="font-bold text-base">{!isNaN(ferritinNum) ? roundClinical(ferritinNum, 1) + " ng/mL" : "—"}</p>
                        </div>
                        <div className="rounded-lg bg-background/60 p-2">
                          <p className="text-xs text-muted-foreground">Target Hb</p>
                          <p className="font-bold text-base">{hasWeight ? liveTargetHb + " g/dL" : "—"}</p>
                        </div>
                        <div className="rounded-lg bg-background/60 p-2">
                          <p className="text-xs text-muted-foreground">Ganzoni Deficit</p>
                          <p className="font-bold text-base text-primary">
                            {liveDeficit !== null ? Math.round(liveDeficit) + " mg" : "—"}
                          </p>
                        </div>
                      </div>
                      {liveDeficit === null ? (
                        <p className="text-xs text-muted-foreground mt-2">
                          Enter Hemoglobin + Weight to see the iron deficit (Ganzoni formula).
                        </p>
                      ) : (
                        <p className="text-xs text-muted-foreground mt-2">
                          Deficit = weight × (target Hb − Hb) × 2.4 + iron stores ({liveStores} mg). Shown before clinical context — flags below refine route &amp; targets.
                        </p>
                      )}
                    </div>
                  );
                })()}
              </CardContent>
            </Card>

            {/* Clinical Flags */}
            <Card className="clinical-card">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Heart className="h-4 w-4 text-primary" />
                  Clinical Context
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {[
                    // Comorbidities
                    { key: "inflammation" as keyof ClinicalFlags, label: "Inflammation / Chronic Disease", color: "bg-warning/100" },
                    { key: "rls" as keyof ClinicalFlags, label: "Restless Legs Syndrome", color: "bg-purple-500" },
                    { key: "ibd" as keyof ClinicalFlags, label: "IBD / Chronic GI Inflammation", color: "bg-pink-500" },
                    { key: "chf" as keyof ClinicalFlags, label: "Chronic Heart Failure (CHF)", color: "bg-destructive/100" },
                    { key: "bariatric" as keyof ClinicalFlags, label: "Post-Bariatric Surgery", color: "bg-indigo-500" },
                    // Pregnancy
                    { key: "pregnancy" as keyof ClinicalFlags, label: "Pregnancy", color: "bg-rose-500" },
                    // CKD/ESA
                    { key: "ckd" as keyof ClinicalFlags, label: "CKD", color: "bg-warning/100" },
                    { key: "esa" as keyof ClinicalFlags, label: "On ESA Therapy", color: "bg-amber-600" },
                    // Scenarios
                    { key: "oralIntolerance" as keyof ClinicalFlags, label: "Oral Iron Intolerant", color: "bg-cyan-500" },
                    { key: "rapidCorrection" as keyof ClinicalFlags, label: "Rapid Correction Needed", color: "bg-destructive/100" },
                    { key: "ongoingBloodLoss" as keyof ClinicalFlags, label: "Ongoing Blood Loss", color: "bg-red-600" },
                  ].map(({ key, label }) => (
                    <Button
                      key={key}
                      variant={flags[key] ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleFlag(key)}
                      className={cn(
                        "iron-context-toggle text-xs bg-secondary text-foreground hover:bg-muted hover:text-foreground",
                        flags[key] && "bg-primary text-foreground"
                      )}
                    >
                      {flags[key] && <CheckCircle2 className="h-3 w-3 mr-1" />}
                      {label}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Calculate */}
            <div className="flex gap-3">
              <Button size="lg" onClick={handleCalculate} disabled={!canCalculate}>
                <Calculator className="h-4 w-4 mr-2" />
                Calculate
              </Button>
              {!canCalculate && (
                <span className="text-xs text-muted-foreground self-center">
                  Enter Ferritin and TSAT (or Serum Iron + TIBC) to start
                </span>
              )}
              {canCalculate && (!hasHb || !hasWeight) && (
                <span className="text-xs text-warning self-center">
                  ⚡ Diagnosis available now. Add Hemoglobin + Weight for full dose estimate.
                </span>
              )}
            </div>

            {/* Results */}
            {calcResult && (
              <div id="results" className="space-y-5 scroll-mt-24">
                {/* Parameters Entered (echoed at top of results) */}
                <Card className="clinical-card border-primary/20">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <FlaskConical className="h-4 w-4 text-primary" />
                      Parameters Entered
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      <div className="rounded-lg bg-muted/30 p-2">
                        <p className="text-xs text-muted-foreground">Ferritin</p>
                        <p className="font-semibold">{inputs.ferritin || "—"}{inputs.ferritin ? " ng/mL" : ""}</p>
                      </div>
                      <div className="rounded-lg bg-muted/30 p-2">
                        <p className="text-xs text-muted-foreground">Hemoglobin</p>
                        <p className="font-semibold">{inputs.hemoglobin || "—"}{inputs.hemoglobin ? " g/dL" : ""}</p>
                      </div>
                      <div className="rounded-lg bg-muted/30 p-2">
                        <p className="text-xs text-muted-foreground">Weight</p>
                        <p className="font-semibold">{inputs.weight || "—"}{inputs.weight ? " kg" : ""}</p>
                      </div>
                      <div className="rounded-lg bg-muted/30 p-2">
                        <p className="text-xs text-muted-foreground">TSAT</p>
                        <p className="font-semibold">{calcResult.tsat ? calcResult.tsat.toFixed(1) + "%" : "—"}</p>
                      </div>
                      <div className="rounded-lg bg-muted/30 p-2">
                        <p className="text-xs text-muted-foreground">Serum Iron</p>
                        <p className="font-semibold">{inputs.serumIron || "—"}{inputs.serumIron ? " µg/dL" : ""}</p>
                      </div>
                      <div className="rounded-lg bg-muted/30 p-2">
                        <p className="text-xs text-muted-foreground">TIBC</p>
                        <p className="font-semibold">{inputs.tibc || "—"}{inputs.tibc ? " µg/dL" : ""}</p>
                      </div>
                    </div>
                    {Object.entries(flags).some(([, v]) => v) && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {Object.entries(flags).filter(([, v]) => v).map(([k]) => (
                          <Badge key={k} variant="outline" className="text-xs">{k}</Badge>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Copy/Print/Download toolbar */}
                <div className="flex items-center justify-end gap-2 flex-wrap no-print">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const note = formatClinicalNote({
                        title: "Iron Replacement Calculator",
                        inputs: { ferritin: inputs.ferritin, hemoglobin: inputs.hemoglobin, weight: inputs.weight, tsat: inputs.tsat || inputs.serumIron + " / " + inputs.tibc },
                        results: {
                          TSAT: calcResult.tsat.toFixed(1) + "%",
                          Diagnosis: calcResult.dx.diagnosis,
                          "Route": calcResult.rec.route,
                          "Deficit (mg)": Math.round(calcResult.rec.deficit).toString(),
                          "Target Hb": calcResult.rec.targetHb + " g/dL",
                        },
                        recommendations: calcResult.notes,
                        citation: "ACG Clinical Guideline 2023; Ferritin/TSAT Thresholds per KDIGO",
                      });
                      copyToClipboard(note, "Results copied to clipboard!");
                    }}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const note = formatClinicalNote({
                        title: "Iron Replacement Calculator",
                        inputs: { ferritin: inputs.ferritin, hemoglobin: inputs.hemoglobin, weight: inputs.weight, tsat: inputs.tsat || inputs.serumIron + " / " + inputs.tibc },
                        results: {
                          TSAT: calcResult.tsat.toFixed(1) + "%",
                          Diagnosis: calcResult.dx.diagnosis,
                          "Route": calcResult.rec.route,
                          "Deficit (mg)": Math.round(calcResult.rec.deficit).toString(),
                          "Target Hb": calcResult.rec.targetHb + " g/dL",
                        },
                        recommendations: calcResult.notes,
                        citation: "ACG Clinical Guideline 2023; Ferritin/TSAT Thresholds per KDIGO",
                      });
                      downloadTextFile(`iron-replacement-${new Date().toISOString().slice(0,10)}`, note);
                    }}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download .txt
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => window.print()}>
                    <Printer className="h-4 w-4 mr-2" />
                    Print
                  </Button>
                </div>


                {/* Diagnosis Card */}
                <div className={cn("rounded-xl border-2 p-5", colors.bg, colors.border)}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className={cn("w-3 h-3 rounded-full", colors.accent)} />
                      <h3 className="text-lg font-bold text-foreground">Diagnosis</h3>
                    </div>
                    <Badge variant="outline" className={cn("text-xs font-medium", colors.text)}>
                      TSAT: {calcResult.tsat.toFixed(1)}%
                    </Badge>
                  </div>
                  <p className={cn("text-xl font-extrabold", colors.text)}>{calcResult.dx.diagnosis}</p>
                  <p className="text-sm text-muted-foreground mt-1">{calcResult.dx.detail}</p>
                </div>

                {/* Recommendation Card */}
                <Card className={cn("clinical-card border-2", calcResult.rec.isIV ? "border-sky-500/30" : "border-emerald-500/30")}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      {calcResult.rec.isIV
                        ? <Syringe className="h-5 w-5 text-primary" />
                        : <Pill className="h-5 w-5 text-emerald-400" />
                      }
                      {calcResult.rec.isIV ? "IV Iron Recommendation" : "Oral Iron Recommendation"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div className={cn("rounded-lg p-3", calcResult.rec.isIV ? "bg-sky-500/10" : "bg-emerald-500/10")}>
                        <p className="text-xs text-muted-foreground">Route</p>
                        <p className="text-lg font-bold">{calcResult.rec.route}</p>
                      </div>
                      <div className="rounded-lg bg-muted/30 p-3">
                        <p className="text-xs text-muted-foreground">Ganzoni Deficit</p>
                        <p className="text-lg font-bold">{calcResult.rec.isIV ? `${Math.round(calcResult.rec.deficit)} mg` : "N/A"}</p>
                      </div>
                      <div className="rounded-lg bg-muted/30 p-3">
                        <p className="text-xs text-muted-foreground">Target Hb</p>
                        <p className="text-lg font-bold">{calcResult.rec.targetHb} g/dL</p>
                      </div>
                      <div className="rounded-lg bg-muted/30 p-3">
                        <p className="text-xs text-muted-foreground">Iron Stores</p>
                        <p className="text-lg font-bold">{getIronStores(parseFloat(inputs.weight))} mg</p>
                      </div>
                    </div>

                    <div className={cn("rounded-xl border p-4", calcResult.rec.isIV ? "border-sky-500/30 bg-sky-500/5" : "border-emerald-500/30 bg-emerald-500/5")}>
                      <div className="flex items-start gap-3">
                        <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", calcResult.rec.isIV ? "bg-sky-500/20" : "bg-emerald-500/20")}>
                          {calcResult.rec.isIV
                            ? <Syringe className="h-4 w-4 text-primary" />
                            : <Pill className="h-4 w-4 text-emerald-400" />
                          }
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-foreground">Recommended Dose</p>
                          <p className="text-sm text-muted-foreground mt-1">{calcResult.rec.doseText}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Clinical Notes */}
                {calcResult.notes.length > 0 && (
                  <div className="rounded-xl border border-amber-800/40 bg-amber-900/10 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="h-4 w-4 text-warning" />
                      <span className="text-sm font-semibold text-warning">Clinical Notes</span>
                    </div>
                    <ul className="space-y-1.5">
                      {calcResult.notes.map((note, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-amber-300/80">
                          <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-warning/100/50 flex-shrink-0" />
                          {note}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* When IV criteria */}
                {calcResult.rec.isIV && (
                  <Card className="clinical-card border-destructive/30">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2 text-destructive">
                        <AlertTriangle className="h-4 w-4" />
                        IV Iron Indicated — Criteria Met
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2 text-xs">
                        {parseFloat(inputs.hemoglobin) < 10 && (
                          <Badge variant="destructive">Hb &lt; 10 g/dL</Badge>
                        )}
                        {flags.ckd && <Badge variant="destructive">CKD</Badge>}
                        {calcResult.dx.label === "functional" && <Badge variant="destructive">Functional Iron Deficiency</Badge>}
                        {flags.oralIntolerance && <Badge variant="destructive">Oral Intolerance / Malabsorption</Badge>}
                        {flags.rapidCorrection && <Badge variant="destructive">Rapid Correction Needed</Badge>}
                        {flags.ongoingBloodLoss && <Badge variant="destructive">Ongoing Blood Loss</Badge>}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </>
        )}

        {/* ── Reference Tab ──────────────────────────────── */}
        {activeTab === "reference" && (
          <div className="space-y-6">
            <Card className="clinical-card">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-primary" />
                  Diagnostic Thresholds
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto rounded-xl border border-border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-muted border-b border-border">
                        <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Condition</th>
                        <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Ferritin (no infl.)</th>
                        <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Ferritin (with infl.)</th>
                        <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wide">TSAT</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        ["Absolute iron deficiency", "< 30", "< 100", "< 20%"],
                        ["Functional iron deficiency", "100–300", "100–300", "< 20%"],
                        ["Iron deficiency unlikely", "≥ 300", "≥ 300", "≥ 20%"],
                      ].map((row, i) => (
                        <tr key={i} className={cn("border-b border-border", i % 2 === 0 ? "" : "bg-muted/30")}>
                          <td className="py-3 px-4 text-sm font-medium text-foreground">{row[0]}</td>
                          <td className="py-3 px-4 text-sm text-muted-foreground">{row[1]}</td>
                          <td className="py-3 px-4 text-sm text-muted-foreground">{row[2]}</td>
                          <td className="py-3 px-4 text-sm text-muted-foreground">{row[3]}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="text-xs text-muted-foreground mt-3">
                  TSAT = (Serum Iron ÷ TIBC) × 100. TSAT &lt; 20% suggests inadequate iron for erythropoiesis.
                </p>

                <h4 className="text-sm font-semibold text-foreground mt-6 mb-3">Condition-Specific Thresholds for Iron Replacement</h4>
                <div className="overflow-x-auto rounded-xl border border-border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-muted border-b border-border">
                        <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Condition</th>
                        <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Ferritin</th>
                        <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wide">TSAT</th>
                        <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        ["Restless Legs Syndrome (RLS)", "Target > 75–100", "< 45%", "Treat even without anemia. Target ferritin > 100 µg/L to alleviate neurological symptoms."],
                        ["Chronic Heart Failure", "< 100, or 100–299 if TSAT low", "< 20%", "IV iron recommended regardless of anemia status (ESC Guidelines). Improves QoL and exercise capacity."],
                        ["CKD (Non-Dialysis)", "< 100–500", "< 30%", "Higher cutoffs used — inflammation impairs normal iron usage."],
                        ["CKD on Hemodialysis", "< 200", "< 30%", "Aggressively maintained to support RBC production."],
                        ["IBD (Crohn's / UC)", "< 100", "< 20%", "IV iron preferred due to malabsorption and intolerance of oral iron."],
                        ["Pregnancy", "< 30", "< 20%", "Oral first-line unless severe or rapid correction needed."],
                      ].map((row, i) => (
                        <tr key={i} className={cn("border-b border-border", i % 2 === 0 ? "" : "bg-muted/30")}>
                          <td className="py-3 px-4 text-sm font-medium text-foreground">{row[0]}</td>
                          <td className="py-3 px-4 text-sm text-muted-foreground">{row[1]}</td>
                          <td className="py-3 px-4 text-sm text-muted-foreground">{row[2]}</td>
                          <td className="py-3 px-4 text-sm text-muted-foreground">{row[3]}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            <Card className="clinical-card">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Syringe className="h-4 w-4 text-primary" />
                  IV Iron Indications
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  {[
                    "Hb < 10 g/dL (severe anemia)",
                    "Chronic kidney disease (especially on ESA)",
                    "Functional iron deficiency (ferritin ≥ 100, TSAT < 20%)",
                    "Oral iron intolerance / malabsorption / failure",
                    "Rapid correction needed (preoperative / symptomatic)",
                    "Ongoing heavy blood loss",
                  ].map((indication, i) => (
                    <div key={i} className="flex items-center gap-2 p-3 rounded-lg bg-muted/30 border border-border">
                      <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                      <span className="text-muted-foreground">{indication}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="clinical-card">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Calculator className="h-4 w-4 text-primary" />
                  Ganzoni Formula Reference
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg bg-muted/30 border border-border p-4">
                  <p className="font-mono text-sm">
                    <span className="text-primary font-bold">Total iron deficit (mg)</span> = weight (kg) × [<span className="text-emerald-400">target Hb</span> − <span className="text-destructive">current Hb (g/dL)</span>] × 2.4 + <span className="text-warning">iron stores</span>
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-semibold text-muted-foreground mb-2">Target Hb</h4>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      {[
                        ["≥ 35 kg (most adults)", "14 g/dL"],
                        ["< 35 kg", "13 g/dL"],
                        ["Pregnancy", "11 g/dL"],
                        ["CKD", "12 g/dL"],
                      ].map(([desc, val]) => (
                        <div key={desc} className="flex justify-between py-1 border-b border-border/50 last:border-0">
                          <span>{desc}</span>
                          <span className="font-mono font-semibold text-foreground">{val}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-muted-foreground mb-2">Iron Stores</h4>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      {[
                        ["≥ 35 kg", "500 mg"],
                        ["< 35 kg", "15 mg/kg"],
                      ].map(([desc, val]) => (
                        <div key={desc} className="flex justify-between py-1 border-b border-border/50 last:border-0">
                          <span>{desc}</span>
                          <span className="font-mono font-semibold text-foreground">{val}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-muted-foreground mb-2">Practical IV Dosing</h4>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    {[
                      ["Deficit ≤ 500 mg", "500 mg IV (single or split dose)"],
                      ["Deficit 500–1000 mg", "1000 mg IV (single dose FCM or split)"],
                      ["Deficit > 1000 mg", "Rounded deficit split 1–2 doses (max 1000–1500 mg/week)"],
                    ].map(([def, dose]) => (
                      <div key={def} className="flex justify-between py-1 border-b border-border/50 last:border-0">
                        <span>{def}</span>
                        <span className="font-mono text-xs text-primary text-right">{dose}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Example Scenarios */}
            <Card className="clinical-card">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-primary" />
                  Example Scenarios
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto rounded-xl border border-border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-muted border-b border-border">
                        <th className="text-left py-2.5 px-3 text-xs font-semibold text-muted-foreground uppercase">Scenario</th>
                        <th className="text-left py-2.5 px-3 text-xs font-semibold text-muted-foreground uppercase">Ferritin</th>
                        <th className="text-left py-2.5 px-3 text-xs font-semibold text-muted-foreground uppercase">TSAT</th>
                        <th className="text-left py-2.5 px-3 text-xs font-semibold text-muted-foreground uppercase">Hb</th>
                        <th className="text-left py-2.5 px-3 text-xs font-semibold text-muted-foreground uppercase">Route</th>
                        <th className="text-left py-2.5 px-3 text-xs font-semibold text-muted-foreground uppercase">Dose</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        ["Classic IDA", "15", "12%", "9.2", "IV", "1200 mg IV (split)"],
                        ["Functional ID (CKD)", "150", "15%", "10.5", "IV", "1000 mg IV (single/split)"],
                        ["Early iron deficiency", "25", "22%", "12.5", "Oral", "40–65 mg elemental Fe daily"],
                        ["Severe IDA", "10", "8%", "7.5", "IV", "~1700 mg IV (split)"],
                        ["Pregnancy IDA", "20", "14%", "10.0", "Oral", "40–65 mg elemental Fe daily"],
                      ].map((row, i) => (
                        <tr key={i} className={cn("border-b border-border", i % 2 === 0 ? "" : "bg-muted/30")}>
                          <td className="py-2.5 px-3 text-sm font-medium text-foreground">{row[0]}</td>
                          <td className="py-2.5 px-3 text-sm text-muted-foreground">{row[1]}</td>
                          <td className="py-2.5 px-3 text-sm text-muted-foreground">{row[2]}</td>
                          <td className="py-2.5 px-3 text-sm text-muted-foreground">{row[3]}</td>
                          <td className="py-2.5 px-3 text-sm">
                            <Badge variant={row[4] === "IV" ? "destructive" : "secondary"} className="text-xs">{row[4]}</Badge>
                          </td>
                          <td className="py-2.5 px-3 text-xs text-muted-foreground font-mono">{row[5]}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ── About Tab ──────────────────────────────────── */}
        {activeTab === "about" && (
          <div className="space-y-4">
            <Card className="clinical-card">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Info className="h-4 w-4 text-primary" />
                  About This Calculator
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm text-muted-foreground leading-relaxed">
                <p>
                  This tool implements an evidence-based iron-replacement decision algorithm using ferritin, TSAT, TIBC, serum iron, hemoglobin, weight, and clinical context to provide a diagnosis and concrete replacement recommendation (oral vs IV, plus approximate dose).
                </p>
                <div>
                  <h4 className="font-semibold text-foreground mb-1">Key References</h4>
                  <ul className="space-y-1">
                    <li>• <a href="https://pmc.ncbi.nlm.nih.gov/articles/PMC9827648/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">How to diagnose iron deficiency in chronic disease - PMC</a></li>
                    <li>• <a href="https://www.perinatology.com/calculators/IV-Iron-Dosing-Calculator.htm" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Iron Dosing Calculator (Iron Deficit) - Perinatology.com</a></li>
                    <li>• <a href="https://www2.gov.bc.ca/gov/content/health/practitioner-professional-resources/bc-guidelines/iron-deficiency" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">BC Guidelines: Iron Deficiency – Diagnosis and Management</a></li>
                    <li>• <a href="https://emedicine.medscape.com/article/202333-treatment" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Medscape: Iron Deficiency Anemia Treatment & Management</a></li>
                    <li>• <a href="https://pmc.ncbi.nlm.nih.gov/articles/PMC4518169/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Intravenous Iron Therapy in Patients with Iron Deficiency Anemia</a></li>
                    <li>• <a href="https://www.omnicalculator.com/health/transferrin" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Transferrin Saturation Calculator - Omni Calculator</a></li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
