import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  AlertTriangle, Droplets, FlaskConical,
  HeartPulse, Pill, Syringe, Activity, Copy,
  Download, Clock, ChevronRight, ChevronDown,
  Calculator, Zap, Bone,
} from "lucide-react";
import { downloadTextFile } from "@/lib/clinical-utils";
import { toast } from "sonner";

// ══════════════════════════════════════════════
// Types
// ══════════════════════════════════════════════

type Severity = "mild" | "moderate" | "severe" | null;
type Route = "oral" | "iv" | null;
type UrineKResult = "low" | "high" | null;
type BpStatus = "hypertension" | "normal" | null;
type AcidBase = "metabolic_alkalosis" | "metabolic_acidosis" | null;
type EtiologyBranch = "nonrenal" | "renal" | null;

interface StepState {
  step1_complete: boolean;
  step2_complete: boolean;
  step3_complete: boolean;
  step4_complete: boolean;
}

// ══════════════════════════════════════════════
// Guideline metadata
// ══════════════════════════════════════════════

const GUIDELINES = [
  "AAFP 2023",
  "RCH Clinical Practice Guideline",
  "PMC clinical update 2018",
  "KDIGO potassium management",
];

const DEFINITION = "Serum K⁺ <3.5 mmol/L";

// ══════════════════════════════════════════════
// Severity ranges
// ══════════════════════════════════════════════

const SEVERITY_RANGES = [
  { level: "Mild", range: "3.0–3.4 mmol/L", color: "text-yellow-400", bg: "bg-yellow-500/5", border: "border-yellow-500/20" },
  { level: "Moderate", range: "2.5–2.9 mmol/L", color: "text-orange-400", bg: "bg-orange-500/5", border: "border-orange-500/20" },
  { level: "Severe", range: "<2.5 mmol/L", color: "text-red-400", bg: "bg-red-500/5", border: "border-red-500/20" },
];

// ══════════════════════════════════════════════
// Urine K interpretation
// ══════════════════════════════════════════════

const URINE_K_CRITERIA = [
  {
    result: "Non-renal loss / transcellular shift" as const,
    uK: "<15–20 mEq/day",
    spotRatio: "Low (K/creat <13 mEq/g)",
    causes: ["Vomiting", "Diarrhea", "Laxatives", "Poor intake", "Insulin shift", "β-agonist shift"],
  },
  {
    result: "Renal potassium wasting" as const,
    uK: ">20 mEq/day",
    spotRatio: "High (K/creat >13 mEq/g)",
    causes: ["Diuretics", "Hyperaldosteronism", "RTA", "Bartter/Gitelman", "Magnesium deficiency"],
  },
];

// ══════════════════════════════════════════════
// Etiology branches
// ══════════════════════════════════════════════

const ETIOLOGY_BRANCHES: Record<string, { title: string; causes: string[]; tests: string[] }> = {
  "hypertension_alkalosis": {
    title: "HTN + Metabolic Alkalosis",
    causes: ["Primary aldosteronism", "Renovascular disease", "Licorice ingestion", "Apparent mineralocorticoid excess"],
    tests: ["Aldosterone-renin ratio", "Renin", "Aldosterone", "CT adrenals"],
  },
  "hypertension_acidosis": {
    title: "HTN + Metabolic Acidosis",
    causes: ["Renal tubular acidosis", "Diuretic effect", "Rare tubulopathies"],
    tests: ["Urine pH", "Urine anion gap", "Serum bicarbonate", "ABG"],
  },
  "normal_alkalosis": {
    title: "Normal BP + Metabolic Alkalosis",
    causes: ["Vomiting", "Diuretics", "Bartter syndrome", "Gitelman syndrome"],
    tests: ["Urine chloride", "Urine calcium (Gitelman → low Ca)", "Renin/aldosterone"],
  },
  "normal_acidosis": {
    title: "Normal BP + Metabolic Acidosis",
    causes: ["RTA (distal/proximal)", "Proximal tubular disorders"],
    tests: ["Urine pH", "Urine anion gap", "Serum bicarbonate", "ABG"],
  },
};

// ══════════════════════════════════════════════
// Replacement calculation
// ══════════════════════════════════════════════

function estimateKDeficit(measuredK: number, weightKg: number): number {
  return Math.max(0, (3.5 - measuredK) * weightKg * 0.4);
}

// ══════════════════════════════════════════════
// Safety rules
// ══════════════════════════════════════════════

const SAFETY_RULES = [
  {
    icon: <Bone className="h-4 w-4" />,
    title: "Magnesium First If Low",
    detail: "Correct hypomagnesemia first — K⁺ repletion is ineffective without Mg²⁺ repletion. Check Mg²⁺ in all hypokalemic patients.",
    color: "text-purple-500",
    bg: "bg-purple-500/5",
    border: "border-purple-500/20",
  },
  {
    icon: <Droplets className="h-4 w-4" />,
    title: "Avoid Glucose-Containing Fluids",
    detail: "D5W/D5NS can shift K⁺ intracellularly, worsening hypokalemia. Use NS or Plasmalyte for IV K⁺ repletion.",
    color: "text-amber-500",
    bg: "bg-amber-500/5",
    border: "border-amber-500/20",
  },
  {
    icon: <HeartPulse className="h-4 w-4" />,
    title: "Telemetry for High-Risk IV Replacement",
    detail: "Severe hypokalemia (<2.5), ECG changes, heart disease, or rapid IV repletion → continuous ECG monitoring.",
    color: "text-red-500",
    bg: "bg-red-500/5",
    border: "border-red-500/20",
  },
  {
    icon: <Clock className="h-4 w-4" />,
    title: "Recheck Labs Frequently",
    detail: "Repeat K⁺ every 2–4 hours during active IV replacement. Reassess after each 20–40 mEq increment.",
    color: "text-cyan-500",
    bg: "bg-cyan-500/5",
    border: "border-cyan-500/20",
  },
  {
    icon: <Zap className="h-4 w-4" />,
    title: "ECG Monitoring",
    detail: "ECG changes: U waves, flattened T waves, ST depression, prolonged QT. Severe: ventricular arrhythmias, torsades.",
    color: "text-orange-500",
    bg: "bg-orange-500/5",
    border: "border-orange-500/20",
  },
];

// ══════════════════════════════════════════════
// Component
// ══════════════════════════════════════════════

export default function Hypokalemia() {
  // ── Step 1: Confirm & Triage ──
  const [serumK, setSerumK] = useState("");
  const [repeatK, setRepeatK] = useState("");
  const [confirmed, setConfirmed] = useState<boolean | null>(null);

  // ── Step 2: Severity & ECG ──
  const [severity, setSeverity] = useState<Severity>(null);
  const [hasEcgChanges, setHasEcgChanges] = useState<boolean | null>(null);
  const [hasSymptoms, setHasSymptoms] = useState<boolean | null>(null);

  // ── Step 3: Replacement route ──
  const [route, setRoute] = useState<Route>(null);

  // ── Step 4: Find cause ──
  const [urineK, setUrineK] = useState("");
  const [urineCreat, setUrineCreat] = useState("");
  const [urineCl, setUrineCl] = useState("");
  const [serumBicarb, setSerumBicarb] = useState("");
  const [serumMg, setSerumMg] = useState("");
  const [urineKResult, setUrineKResult] = useState<UrineKResult>(null);
  const [bpStatus, setBpStatus] = useState<BpStatus>(null);
  const [acidBase, setAcidBase] = useState<AcidBase>(null);
  const [etiologyBranch, setEtiologyBranch] = useState<string | null>(null);

  // ── Calculator ──
  const [weight, setWeight] = useState("");

  // ── UI state ──
  const [expandedSection, setExpandedSection] = useState<string | null>("step1");

  // ── Step progression ──
  const steps: StepState = useMemo(() => ({
    step1_complete: confirmed === true,
    step2_complete: severity !== null,
    step3_complete: route !== null,
    step4_complete: urineKResult !== null,
  }), [confirmed, severity, route, urineKResult]);

  // ── Step 1: Confirm ──
  const confirmHypokalemia = () => {
    const k = parseFloat(serumK);
    if (isNaN(k)) {
      toast.error("Enter a valid serum K⁺ value");
      return;
    }
    if (k >= 3.5) {
      toast.error("K⁺ ≥3.5 — this is not hypokalemia");
      return;
    }
    setConfirmed(true);
    toast.success("Hypokalemia confirmed. Assess severity and ECG.");
    setExpandedSection("step2");
  };

  const checkPseudohypokalemia = () => {
    const k = parseFloat(serumK);
    const rk = parseFloat(repeatK);
    if (isNaN(k) || isNaN(rk)) {
      toast.error("Enter both initial and repeat K⁺ values");
      return;
    }
    if (rk >= 3.5) {
      toast.warning("Repeat K⁺ ≥3.5 — consider pseudohypokalemia (delayed processing, marked leukocytosis, recent insulin)");
      setConfirmed(false);
    } else {
      confirmHypokalemia();
    }
  };

  // ── Step 2: Classify severity ──
  const classifySeverity = () => {
    const k = parseFloat(serumK);
    if (isNaN(k)) {
      toast.error("Enter serum K⁺ first");
      return;
    }
    if (k < 2.5) {
      setSeverity("severe");
      toast.error("Severe hypokalemia — urgent IV replacement indicated");
    } else if (k < 3.0) {
      setSeverity("moderate");
      toast.info("Moderate hypokalemia");
    } else {
      setSeverity("mild");
      toast.success("Mild hypokalemia");
    }
    setExpandedSection("step3");
  };

  // ── Step 3: Determine route ──
  const determineRoute = () => {
    const isSevere = severity === "severe";
    const isSymptomatic = hasSymptoms === true;
    const hasEcg = hasEcgChanges === true;

    if (isSevere || isSymptomatic || hasEcg) {
      setRoute("iv");
      toast.info("IV replacement indicated — severe, symptomatic, or ECG changes present");
    } else {
      setRoute("oral");
      toast.success("Oral replacement appropriate — mild-moderate, asymptomatic, gut function intact");
    }
    setExpandedSection("step4");
  };

  // ── Step 4: Urine K analysis ──
  const analyzeUrineK = () => {
    const uK = parseFloat(urineK);
    if (isNaN(uK)) {
      toast.error("Enter urine potassium value");
      return;
    }
    if (uK < 20) {
      setUrineKResult("low");
      toast.info("Low urine K⁺ — non-renal loss or transcellular shift");
    } else {
      setUrineKResult("high");
      toast.info("High urine K⁺ — renal potassium wasting. Check BP and acid-base status.");
    }
  };

  // ── Etiology analysis ──
  const analyzeEtiology = () => {
    if (!bpStatus || !acidBase) {
      toast.error("Select both BP status and acid-base status");
      return;
    }
    const key = `${bpStatus}_${acidBase}`;
    setEtiologyBranch(key);
    toast.success(`Etiology: ${ETIOLOGY_BRANCHES[key]?.title || "See below"}`);
  };

  // ── Deficit calculator ──
  const deficit = useMemo(() => {
    const k = parseFloat(serumK);
    const w = parseFloat(weight);
    if (isNaN(k) || isNaN(w) || k >= 3.5) return null;
    return {
      deficit: estimateKDeficit(k, w),
      formula: `(3.5 − ${k.toFixed(1)}) × ${w.toFixed(0)} × 0.4`,
    };
  }, [serumK, weight]);

  // ── IV rate guidance ──
  const ivGuidance = useMemo(() => {
    if (route !== "iv") return null;
    return [
      { label: "Peripheral (max)", rate: "10 mEq/hour", conc: "≤40 mEq/L", note: "Standard peripheral line" },
      { label: "Telemetry", rate: "20 mEq/hour", conc: "≤80 mEq/L", note: "Continuous ECG monitoring" },
      { label: "Central line (life-threatening)", rate: "40 mEq/hour", conc: "≤200 mEq/L", note: "ICU setting, continuous monitoring" },
    ];
  }, [route]);

  // ── Clinical note generation ──
  const generateNote = () => {
    const lines: string[] = [
      "═══ Hypokalemia Clinical Summary ═══",
      `Serum K⁺: ${serumK || "—"} mmol/L`,
      "",
    ];
    if (steps.step2_complete) {
      lines.push(`Severity: ${severity?.toUpperCase() || "?"}`);
      lines.push(`ECG changes: ${hasEcgChanges === null ? "?" : hasEcgChanges ? "Yes" : "No"}`);
      lines.push(`Symptoms: ${hasSymptoms === null ? "?" : hasSymptoms ? "Yes" : "No"}`);
      lines.push("");
    }
    if (steps.step3_complete) {
      lines.push(`Replacement route: ${route?.toUpperCase() || "?"}`);
      if (route === "oral") {
        lines.push("  Agent: Potassium chloride 20–60 mEq/day in split doses");
      }
      if (route === "iv") {
        lines.push("  Agent: Potassium chloride IV");
        lines.push("  Max peripheral rate: 10 mEq/hour (40 mEq/L concentration)");
        lines.push("  Telemetry rate: 20 mEq/hour");
        lines.push("  Central line rate: 40 mEq/hour (life-threatening)");
      }
      lines.push("");
    }
    if (steps.step4_complete) {
      lines.push(`Urine K⁺: ${urineK || "—"} mEq/L → ${urineKResult === "low" ? "Non-renal loss" : "Renal wasting"}`);
      if (bpStatus) lines.push(`BP: ${bpStatus === "hypertension" ? "Hypertensive" : "Normal"}`);
      if (acidBase) lines.push(`Acid-base: ${acidBase === "metabolic_alkalosis" ? "Metabolic alkalosis" : "Metabolic acidosis"}`);
      if (etiologyBranch && ETIOLOGY_BRANCHES[etiologyBranch]) {
        lines.push(`Etiology: ${ETIOLOGY_BRANCHES[etiologyBranch].title}`);
        lines.push(`  Causes: ${ETIOLOGY_BRANCHES[etiologyBranch].causes.join(", ")}`);
        lines.push(`  Suggested tests: ${ETIOLOGY_BRANCHES[etiologyBranch].tests.join(", ")}`);
      }
      lines.push("");
    }
    if (deficit) {
      lines.push(`Estimated K⁺ deficit: ${deficit.deficit.toFixed(1)} mEq`);
      lines.push(`  (${deficit.formula})`);
      lines.push("  Note: Replace in increments and reassess — formula estimates deficit, not exact requirement");
    }
    return lines.join("\n");
  };

  const copyNote = () => {
    navigator.clipboard.writeText(generateNote());
    toast.success("Note copied to clipboard");
  };

  const downloadNote = () => {
    downloadTextFile(generateNote(), `hypokalemia-summary-${Date.now()}.txt`);
    toast.success("Note downloaded");
  };

  // ── Reset ──
  const resetAll = () => {
    setSerumK("");
    setRepeatK("");
    setConfirmed(null);
    setSeverity(null);
    setHasEcgChanges(null);
    setHasSymptoms(null);
    setRoute(null);
    setUrineK("");
    setUrineCreat("");
    setUrineCl("");
    setSerumBicarb("");
    setSerumMg("");
    setUrineKResult(null);
    setBpStatus(null);
    setAcidBase(null);
    setEtiologyBranch(null);
    setWeight("");
    setExpandedSection("step1");
    toast.info("Reset complete");
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Zap className="h-6 w-6 text-yellow-400" />
            Hypokalemia Decision Support
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {DEFINITION} — Based on: {GUIDELINES.join(", ")}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={copyNote}>
            <Copy className="h-4 w-4 mr-1" /> Copy
          </Button>
          <Button variant="outline" size="sm" onClick={downloadNote}>
            <Download className="h-4 w-4 mr-1" /> Export
          </Button>
          <Button variant="ghost" size="sm" onClick={resetAll}>
            Reset
          </Button>
        </div>
      </div>

      {/* Progress indicator */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
        <Badge variant={steps.step1_complete ? "default" : "outline"}>
          Step 1: Confirm
        </Badge>
        <ChevronRight className="h-3 w-3" />
        <Badge variant={steps.step2_complete ? "default" : "outline"}>
          Step 2: Severity/ECG
        </Badge>
        <ChevronRight className="h-3 w-3" />
        <Badge variant={steps.step3_complete ? "default" : "outline"}>
          Step 3: Replacement
        </Badge>
        <ChevronRight className="h-3 w-3" />
        <Badge variant={steps.step4_complete ? "default" : "outline"}>
          Step 4: Find Cause
        </Badge>
      </div>

      {/* ── STEP 1: Confirm & Triage ── */}
      <Card className="border-blue-500/20">
        <button
          onClick={() => setExpandedSection(expandedSection === "step1" ? null : "step1")}
          className="w-full text-left"
        >
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FlaskConical className="h-5 w-5 text-blue-400" />
                <CardTitle className="text-base">Step 1: Confirm Hypokalemia & Triage</CardTitle>
              </div>
              {expandedSection === "step1" ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </div>
            <CardDescription>Confirm true hypokalemia and rule out pseudohypokalemia</CardDescription>
          </CardHeader>
        </button>

        {expandedSection === "step1" && (
          <CardContent className="space-y-4 pt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Serum K⁺ (mmol/L)</Label>
                <Input
                  type="number"
                  step="0.1"
                  placeholder="e.g. 3.0"
                  value={serumK}
                  onChange={(e) => setSerumK(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Repeat K⁺ (optional, for pseudohypokalemia check)</Label>
                <Input
                  type="number"
                  step="0.1"
                  placeholder="e.g. 3.6"
                  value={repeatK}
                  onChange={(e) => setRepeatK(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button onClick={confirmHypokalemia} className="w-full" disabled={!serumK}>
                Confirm Hypokalemia
              </Button>
              <Button onClick={checkPseudohypokalemia} variant="outline" className="w-full" disabled={!serumK || !repeatK}>
                Check Pseudohypokalemia
              </Button>
            </div>

            {confirmed === true && (
              <div className="p-3 rounded-lg border bg-green-500/5 border-green-500/20 text-sm">
                <p className="font-semibold text-green-400">✓ True hypokalemia confirmed (K⁺ &lt;3.5 mmol/L)</p>
              </div>
            )}

            {confirmed === false && (
              <div className="p-3 rounded-lg border bg-amber-500/5 border-amber-500/20 text-sm">
                <p className="font-semibold text-amber-400">⚠ Consider pseudohypokalemia or transient shift</p>
                <p className="text-muted-foreground mt-1">Causes: delayed sample processing, marked leukocytosis, recent insulin</p>
              </div>
            )}

            {/* Pseudohypokalemia info */}
            <div className="p-3 rounded-lg border border-blue-500/10 bg-blue-500/5 text-xs text-muted-foreground">
              <p className="font-semibold text-blue-400 mb-1">Pseudohypokalemia suspects:</p>
              <ul className="list-disc list-inside space-y-0.5">
                <li>Delayed sample processing (cells metabolize K⁺ in vitro)</li>
                <li>Marked leukocytosis (WBC &gt;100,000) — cells take up K⁺ in tube</li>
                <li>Recent insulin administration (transient intracellular shift)</li>
              </ul>
            </div>
          </CardContent>
        )}
      </Card>

      {/* ── STEP 2: Severity & ECG ── */}
      <Card className={`border-${severity ? "green" : "purple"}-500/20 ${!steps.step1_complete ? "opacity-50 pointer-events-none" : ""}`}>
        <button
          onClick={() => setExpandedSection(expandedSection === "step2" ? null : "step2")}
          className="w-full text-left"
        >
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-purple-400" />
                <CardTitle className="text-base">Step 2: Classify Severity & Check ECG</CardTitle>
              </div>
              {expandedSection === "step2" ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </div>
            <CardDescription>Determine severity class and identify urgent features</CardDescription>
          </CardHeader>
        </button>

        {expandedSection === "step2" && (
          <CardContent className="space-y-4 pt-0">
            <Button onClick={classifySeverity} className="w-full" disabled={!serumK}>
              Classify Severity
            </Button>

            {/* Severity ranges */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {SEVERITY_RANGES.map((sr) => (
                <div key={sr.level} className={`p-3 rounded-lg border ${sr.border} ${sr.bg}`}>
                  <div className={`text-sm font-bold ${sr.color}`}>{sr.level}</div>
                  <div className="text-xs text-muted-foreground">{sr.range}</div>
                </div>
              ))}
            </div>

            {severity && (
              <div className={`p-3 rounded-lg border text-sm ${
                severity === "severe"
                  ? "bg-red-500/5 border-red-500/20 text-red-400"
                  : severity === "moderate"
                  ? "bg-orange-500/5 border-orange-500/20 text-orange-400"
                  : "bg-yellow-500/5 border-yellow-500/20 text-yellow-400"
              }`}>
                <p className="font-semibold">
                  {severity === "severe" && "⚠ Severe hypokalemia (<2.5 mmol/L) — urgent IV replacement"}
                  {severity === "moderate" && "⚠ Moderate hypokalemia (2.5–2.9 mmol/L)"}
                  {severity === "mild" && "✓ Mild hypokalemia (3.0–3.4 mmol/L)"}
                </p>
              </div>
            )}

            {/* Urgent features */}
            <div>
              <Label className="mb-2 block">Urgent Features</Label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs text-muted-foreground">ECG Changes?</Label>
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    <Button
                      variant={hasEcgChanges === true ? "default" : "outline"}
                      size="sm"
                      onClick={() => setHasEcgChanges(true)}
                      className={hasEcgChanges === true ? "bg-red-500/20 text-red-400 border-red-500/30" : ""}
                    >Yes — U waves, flat T, arrhythmia</Button>
                    <Button
                      variant={hasEcgChanges === false ? "default" : "outline"}
                      size="sm"
                      onClick={() => setHasEcgChanges(false)}
                    >No</Button>
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Symptoms (paralysis, weakness, respiratory)?</Label>
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    <Button
                      variant={hasSymptoms === true ? "default" : "outline"}
                      size="sm"
                      onClick={() => setHasSymptoms(true)}
                      className={hasSymptoms === true ? "bg-red-500/20 text-red-400 border-red-500/30" : ""}
                    >Yes</Button>
                    <Button
                      variant={hasSymptoms === false ? "default" : "outline"}
                      size="sm"
                      onClick={() => setHasSymptoms(false)}
                    >No</Button>
                  </div>
                </div>
              </div>
            </div>

            {/* ECG changes reference */}
            <div className="p-3 rounded-lg border border-orange-500/10 bg-orange-500/5 text-xs text-muted-foreground">
              <p className="font-semibold text-orange-400 mb-1">ECG findings in hypokalemia:</p>
              <ul className="list-disc list-inside space-y-0.5">
                <li>U waves (most characteristic)</li>
                <li>Flattened / inverted T waves</li>
                <li>ST segment depression</li>
                <li>Prolonged QT interval</li>
                <li>Severe: ventricular arrhythmias, torsades de pointes</li>
              </ul>
            </div>
          </CardContent>
        )}
      </Card>

      {/* ── STEP 3: Replacement Route ── */}
      <Card className={`border-${route ? "green" : "rose"}-500/20 ${!steps.step2_complete ? "opacity-50 pointer-events-none" : ""}`}>
        <button
          onClick={() => setExpandedSection(expandedSection === "step3" ? null : "step3")}
          className="w-full text-left"
        >
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Syringe className="h-5 w-5 text-rose-400" />
                <CardTitle className="text-base">Step 3: Replacement Route</CardTitle>
              </div>
              {expandedSection === "step3" ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </div>
            <CardDescription>Choose oral vs IV based on severity, symptoms, and ECG</CardDescription>
          </CardHeader>
        </button>

        {expandedSection === "step3" && (
          <CardContent className="space-y-4 pt-0">
            <Button onClick={determineRoute} className="w-full" disabled={!severity}>
              Determine Replacement Route
            </Button>

            {/* Oral replacement */}
            <div className={`p-4 rounded-lg border ${route === "oral" ? "border-green-500/20 bg-green-500/5" : "border-border"}`}>
              <div className="flex items-center gap-2 mb-2">
                <Pill className={`h-5 w-5 ${route === "oral" ? "text-green-400" : "text-muted-foreground"}`} />
                <h3 className="font-semibold text-sm">Oral Replacement</h3>
                {route === "oral" && <Badge variant="default" className="text-[10px]">RECOMMENDED</Badge>}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Agent</div>
                  <div className="font-semibold">Potassium Chloride</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Dose</div>
                  <div className="font-semibold">20–60 mEq/day in split doses</div>
                </div>
              </div>
              <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                <li>• Preferred for mild hypokalemia, stable patient, able to take oral</li>
                <li>• Split doses to improve tolerance</li>
                <li>• Recheck level after repletion</li>
              </ul>
            </div>

            {/* IV replacement */}
            <div className={`p-4 rounded-lg border ${route === "iv" ? "border-red-500/20 bg-red-500/5" : "border-border"}`}>
              <div className="flex items-center gap-2 mb-2">
                <Droplets className={`h-5 w-5 ${route === "iv" ? "text-red-400" : "text-muted-foreground"}`} />
                <h3 className="font-semibold text-sm">IV Replacement</h3>
                {route === "iv" && <Badge variant="default" className="text-[10px] bg-red-500/20 text-red-400">RECOMMENDED</Badge>}
              </div>
              <div className="text-xs text-muted-foreground mb-2">
                Indicated for: severe hypokalemia, symptomatic, or ECG changes
              </div>
              {ivGuidance && (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-2 px-2 font-medium">Route</th>
                        <th className="text-left py-2 px-2 font-medium">Max Rate</th>
                        <th className="text-left py-2 px-2 font-medium">Max Conc</th>
                        <th className="text-left py-2 px-2 font-medium">Note</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ivGuidance.map((g, i) => (
                        <tr key={i} className="border-b border-border/50">
                          <td className="py-1.5 px-2 font-medium">{g.label}</td>
                          <td className="py-1.5 px-2">{g.rate}</td>
                          <td className="py-1.5 px-2">{g.conc}</td>
                          <td className="py-1.5 px-2 text-muted-foreground">{g.note}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <div className="mt-2 text-xs text-muted-foreground">
                <p className="font-semibold text-amber-400">Monitoring:</p>
                <ul className="list-disc list-inside space-y-0.5">
                  <li>Continuous ECG if IV high rate</li>
                  <li>Repeat K⁺ every 2–4 hours</li>
                </ul>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* ── STEP 4: Find Cause ── */}
      <Card className={`border-${urineKResult ? "green" : "teal"}-500/20 ${!steps.step3_complete ? "opacity-50 pointer-events-none" : ""}`}>
        <button
          onClick={() => setExpandedSection(expandedSection === "step4" ? null : "step4")}
          className="w-full text-left"
        >
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Droplets className="h-5 w-5 text-teal-400" />
                <CardTitle className="text-base">Step 4: Find the Cause</CardTitle>
              </div>
              {expandedSection === "step4" ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </div>
            <CardDescription>Urine K⁺ → BP → Acid-base → Etiology</CardDescription>
          </CardHeader>
        </button>

        {expandedSection === "step4" && (
          <CardContent className="space-y-4 pt-0">
            {/* Required labs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label>Urine K⁺ (mEq/L)</Label>
                <Input
                  type="number"
                  placeholder="e.g. 10"
                  value={urineK}
                  onChange={(e) => setUrineK(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Urine Creatinine (mg/dL)</Label>
                <Input
                  type="number"
                  placeholder="e.g. 50"
                  value={urineCreat}
                  onChange={(e) => setUrineCreat(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Urine Chloride (mEq/L)</Label>
                <Input
                  type="number"
                  placeholder="e.g. 20"
                  value={urineCl}
                  onChange={(e) => setUrineCl(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Serum Bicarbonate (mmol/L)</Label>
                <Input
                  type="number"
                  placeholder="e.g. 28"
                  value={serumBicarb}
                  onChange={(e) => setSerumBicarb(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Serum Magnesium (mg/dL)</Label>
                <Input
                  type="number"
                  step="0.1"
                  placeholder="e.g. 1.8"
                  value={serumMg}
                  onChange={(e) => setSerumMg(e.target.value)}
                />
              </div>
            </div>

            <Button onClick={analyzeUrineK} className="w-full" disabled={!urineK}>
              Analyze Urine K⁺
            </Button>

            {/* Urine K reference */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 px-2 font-medium">Interpretation</th>
                    <th className="text-left py-2 px-2 font-medium">Urine K⁺</th>
                    <th className="text-left py-2 px-2 font-medium">Spot K/Creat Ratio</th>
                    <th className="text-left py-2 px-2 font-medium">Causes</th>
                  </tr>
                </thead>
                <tbody>
                  {URINE_K_CRITERIA.map((uc, i) => (
                    <tr key={i} className="border-b border-border/50 hover:bg-muted/30">
                      <td className="py-1.5 px-2 font-medium">{uc.result}</td>
                      <td className="py-1.5 px-2">{uc.uK}</td>
                      <td className="py-1.5 px-2">{uc.spotRatio}</td>
                      <td className="py-1.5 px-2 text-muted-foreground">{uc.causes.join(", ")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {urineKResult && (
              <div className={`p-3 rounded-lg border text-sm ${
                urineKResult === "low"
                  ? "bg-green-500/5 border-green-500/20 text-green-400"
                  : "bg-amber-500/5 border-amber-500/20 text-amber-400"
              }`}>
                <p className="font-semibold">
                  {urineKResult === "low"
                    ? "✓ Non-renal loss or transcellular shift"
                    : "⚠ Renal potassium wasting — check BP and acid-base status"}
                </p>
              </div>
            )}

            {/* BP + Acid-base (only if renal wasting) */}
            {urineKResult === "high" && (
              <>
                <Separator />
                <div>
                  <Label className="mb-2 block">Blood Pressure</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant={bpStatus === "hypertension" ? "default" : "outline"}
                      onClick={() => setBpStatus("hypertension")}
                      className={bpStatus === "hypertension" ? "bg-red-500/20 text-red-400 border-red-500/30" : ""}
                    >Hypertension</Button>
                    <Button
                      variant={bpStatus === "normal" ? "default" : "outline"}
                      onClick={() => setBpStatus("normal")}
                    >Normal BP</Button>
                  </div>
                </div>

                <div>
                  <Label className="mb-2 block">Acid-Base Status</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant={acidBase === "metabolic_alkalosis" ? "default" : "outline"}
                      onClick={() => setAcidBase("metabolic_alkalosis")}
                      className={acidBase === "metabolic_alkalosis" ? "bg-green-500/20 text-green-400 border-green-500/30" : ""}
                    >Metabolic Alkalosis</Button>
                    <Button
                      variant={acidBase === "metabolic_acidosis" ? "default" : "outline"}
                      onClick={() => setAcidBase("metabolic_acidosis")}
                      className={acidBase === "metabolic_acidosis" ? "bg-orange-500/20 text-orange-400 border-orange-500/30" : ""}
                    >Metabolic Acidosis</Button>
                  </div>
                </div>

                <Button onClick={analyzeEtiology} className="w-full" disabled={!bpStatus || !acidBase}>
                  Analyze Etiology
                </Button>

                {etiologyBranch && ETIOLOGY_BRANCHES[etiologyBranch] && (
                  <div className="p-4 rounded-lg border border-teal-500/20 bg-teal-500/5">
                    <h3 className="text-sm font-bold text-teal-400 mb-2">{ETIOLOGY_BRANCHES[etiologyBranch].title}</h3>
                    <div className="space-y-2">
                      <div>
                        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Consider</div>
                        <ul className="text-sm mt-1 space-y-0.5">
                          {ETIOLOGY_BRANCHES[etiologyBranch].causes.map((c, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <span className="text-teal-400 mt-0.5">•</span>
                              {c}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Suggested Tests</div>
                        <ul className="text-sm mt-1 space-y-0.5">
                          {ETIOLOGY_BRANCHES[etiologyBranch].tests.map((t, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <span className="text-teal-400 mt-0.5">•</span>
                              {t}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Special etiologies (always visible) */}
            <Separator />
            <div className="p-3 rounded-lg border border-blue-500/10 bg-blue-500/5 text-xs text-muted-foreground">
              <p className="font-semibold text-blue-400 mb-1">Special Etiologies to Consider</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <p className="font-semibold text-[10px] uppercase tracking-wider">Screen When Indicated</p>
                  <ul className="list-disc list-inside space-y-0.5 mt-1">
                    <li>TSH (thyrotoxic periodic paralysis)</li>
                    <li>Morning cortisol / ACTH</li>
                    <li>Aldosterone-renin ratio</li>
                  </ul>
                </div>
                <div>
                  <p className="font-semibold text-[10px] uppercase tracking-wider">Refractory / Recurrent</p>
                  <ul className="list-disc list-inside space-y-0.5 mt-1">
                    <li>Check magnesium</li>
                    <li>Review medications</li>
                    <li>Consider genetic tubulopathy</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* ── Deficit Calculator ── */}
      <Card className="border-cyan-500/20">
        <button
          onClick={() => setExpandedSection(expandedSection === "calculator" ? null : "calculator")}
          className="w-full text-left"
        >
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calculator className="h-5 w-5 text-cyan-400" />
                <CardTitle className="text-base">K⁺ Deficit Calculator</CardTitle>
              </div>
              {expandedSection === "calculator" ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </div>
            <CardDescription>Estimate total body K⁺ deficit: (3.5 − measured K⁺) × weight × 0.4</CardDescription>
          </CardHeader>
        </button>

        {expandedSection === "calculator" && (
          <CardContent className="space-y-4 pt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Serum K⁺ (mmol/L)</Label>
                <Input
                  type="number"
                  step="0.1"
                  placeholder="e.g. 3.0"
                  value={serumK}
                  onChange={(e) => setSerumK(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Body Weight (kg)</Label>
                <Input
                  type="number"
                  placeholder="e.g. 70"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                />
              </div>
            </div>

            {deficit && (
              <div className="p-4 rounded-lg border border-cyan-500/20 bg-cyan-500/5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Estimated K⁺ Deficit</div>
                    <div className="text-2xl font-bold text-cyan-400">{deficit.deficit.toFixed(1)} mEq</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Formula</div>
                    <div className="text-sm font-mono text-cyan-400">{deficit.formula}</div>
                  </div>
                </div>
                <div className="mt-2 text-xs text-muted-foreground">
                  Clinical note: Replace in increments and reassess. Formula estimates deficit, not exact requirement.
                </div>
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {/* ── Safety Rules ── */}
      <Card className="border-red-500/20">
        <button
          onClick={() => setExpandedSection(expandedSection === "safety" ? null : "safety")}
          className="w-full text-left"
        >
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-400" />
                <CardTitle className="text-base">⚠ Safety Rules</CardTitle>
              </div>
              {expandedSection === "safety" ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </div>
            <CardDescription>Critical safety rules for potassium repletion</CardDescription>
          </CardHeader>
        </button>

        {expandedSection === "safety" && (
          <CardContent className="space-y-3 pt-0">
            {SAFETY_RULES.map((rule, i) => (
              <div key={i} className={`p-3 rounded-lg border ${rule.border} ${rule.bg} flex items-start gap-3`}>
                <span className={`mt-0.5 ${rule.color}`}>{rule.icon}</span>
                <div>
                  <p className="text-sm font-semibold">{rule.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{rule.detail}</p>
                </div>
              </div>
            ))}
          </CardContent>
        )}
      </Card>
    </div>
  );
}
