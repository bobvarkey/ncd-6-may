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
  Download, ChevronRight, ChevronDown, Zap, Bone,
} from "lucide-react";
import { downloadTextFile } from "@/lib/clinical-utils";
import { toast } from "sonner";

// ══════════════════════════════════════════════
// Types
// ══════════════════════════════════════════════

type Severity = "mild" | "moderate" | "severe" | null;
type Route = "oral" | "iv" | null;
type FemgResult = "low" | "high" | null;
type UrineCalciumResult = "high" | "low" | null;

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
  "UpToDate 2024",
  "NHS Magnesium Protocol",
  "KDIGO electrolyte management",
];

const DEFINITION = "Serum Mg²⁺ <0.6 mmol/L";

// ══════════════════════════════════════════════
// Severity ranges
// ══════════════════════════════════════════════

const SEVERITY_RANGES = [
  { level: "Mild", range: "0.5–0.6 mmol/L", color: "text-yellow-400", bg: "bg-yellow-500/5", border: "border-yellow-500/20" },
  { level: "Moderate", range: "0.4–0.5 mmol/L", color: "text-orange-400", bg: "bg-orange-500/5", border: "border-orange-500/20" },
  { level: "Severe", range: "<0.4 mmol/L", color: "text-red-400", bg: "bg-red-500/5", border: "border-red-500/20" },
];

// ══════════════════════════════════════════════
// FEMg interpretation
// ══════════════════════════════════════════════

const FEMG_CRITERIA = [
  {
    result: "Extrarenal loss / low intake" as const,
    femg: "<2%",
    causes: ["Diarrhea", "Vomiting", "Malabsorption", "Poor intake"],
  },
  {
    result: "Renal magnesium wasting" as const,
    femg: ">2%",
    causes: ["Diuretics", "PPIs", "Aminoglycosides", "Cisplatin", "Calcineurin inhibitors", "Tubulopathy"],
  },
];

// ══════════════════════════════════════════════
// Safety rules
// ══════════════════════════════════════════════

const SAFETY_RULES = [
  {
    icon: <Droplets className="h-4 w-4" />,
    title: "Check Renal Function Before IV Mg",
    detail: "Renal impairment significantly reduces Mg²⁺ clearance — reduce dose and monitor closely to avoid dangerous hypermagnesemia.",
    color: "text-red-500",
    bg: "bg-red-500/5",
    border: "border-red-500/20",
  },
  {
    icon: <HeartPulse className="h-4 w-4" />,
    title: "Monitor for Mg Toxicity",
    detail: "Signs: hypotension, bradycardia, loss of deep tendon reflexes, respiratory depression. Loss of patellar reflex is an early sign of impending toxicity.",
    color: "text-orange-500",
    bg: "bg-orange-500/5",
    border: "border-orange-500/20",
  },
  {
    icon: <Zap className="h-4 w-4" />,
    title: "Treat K⁺ and Ca²⁺ Concomitantly",
    detail: "Mg deficiency can block K⁺ and Ca²⁺ correction. Refractory hypokalemia or hypocalcemia often resolves after Mg repletion.",
    color: "text-purple-500",
    bg: "bg-purple-500/5",
    border: "border-purple-500/20",
  },
  {
    icon: <Pill className="h-4 w-4" />,
    title: "Stop Offending Medications",
    detail: "PPIs, loop diuretics, aminoglycosides, cisplatin, calcineurin inhibitors — discontinue if possible.",
    color: "text-amber-500",
    bg: "bg-amber-500/5",
    border: "border-amber-500/20",
  },
];

// ══════════════════════════════════════════════
// Component
// ══════════════════════════════════════════════

export default function Hypomagnesemia() {
  // ── Step 1: Confirm ──
  const [serumMg, setSerumMg] = useState("");
  const [confirmed, setConfirmed] = useState<boolean | null>(null);

  // ── Step 2: Severity ──
  const [severity, setSeverity] = useState<Severity>(null);
  const [hasEmergencyFeatures, setHasEmergencyFeatures] = useState<boolean | null>(null);

  // ── Step 3: Route ──
  const [route, setRoute] = useState<Route>(null);

  // ── Step 4: Find cause ──
  const [femg, setFemg] = useState("");
  const [urineMg, setUrineMg] = useState("");
  const [urineCreat, setUrineCreat] = useState("");
  const [urineCalcium, setUrineCalcium] = useState("");
  const [femgResult, setFemgResult] = useState<FemgResult>(null);
  const [urineCaResult, setUrineCaResult] = useState<UrineCalciumResult>(null);

  // ── Associated electrolyte issues ──
  const [hasHypokalemia, setHasHypokalemia] = useState<boolean | null>(null);
  const [hasHypocalcemia, setHasHypocalcemia] = useState<boolean | null>(null);

  // ── UI state ──
  const [expandedSection, setExpandedSection] = useState<string | null>("step1");

  // ── Step progression ──
  const steps: StepState = useMemo(() => ({
    step1_complete: confirmed === true,
    step2_complete: severity !== null,
    step3_complete: route !== null,
    step4_complete: femgResult !== null,
  }), [confirmed, severity, route, femgResult]);

  // ── Step 1: Confirm ──
  const confirmHypomagnesemia = () => {
    const mg = parseFloat(serumMg);
    if (isNaN(mg)) {
      toast.error("Enter a valid serum Mg²⁺ value");
      return;
    }
    if (mg >= 0.6) {
      toast.error("Mg²⁺ ≥0.6 mmol/L — this is not hypomagnesemia");
      return;
    }
    setConfirmed(true);
    toast.success("Hypomagnesemia confirmed. Assess severity.");
    setExpandedSection("step2");
  };

  // ── Step 2: Classify severity ──
  const classifySeverity = () => {
    const mg = parseFloat(serumMg);
    if (isNaN(mg)) {
      toast.error("Enter serum Mg²⁺ first");
      return;
    }
    if (mg < 0.4) {
      setSeverity("severe");
      toast.error("Severe hypomagnesemia — urgent IV replacement indicated");
    } else if (mg < 0.5) {
      setSeverity("moderate");
      toast.info("Moderate hypomagnesemia");
    } else {
      setSeverity("mild");
      toast.success("Mild hypomagnesemia");
    }
    setExpandedSection("step3");
  };

  // ── Step 3: Determine route ──
  const determineRoute = () => {
    const isSymptomaticOrSevere = severity === "severe" || hasEmergencyFeatures === true;

    if (isSymptomaticOrSevere) {
      setRoute("iv");
      toast.info("IV replacement indicated — symptomatic or severe");
    } else {
      setRoute("oral");
      toast.success("Oral replacement appropriate — mild, stable, able to take PO");
    }
    setExpandedSection("step4");
  };

  // ── Step 4: FEMg analysis ──
  const analyzeFemg = () => {
    const mg = parseFloat(femg);
    if (isNaN(mg)) {
      toast.error("Enter FEMg value");
      return;
    }
    if (mg < 2) {
      setFemgResult("low");
      toast.info("FEMg <2% — extrarenal loss or low intake");
    } else {
      setFemgResult("high");
      toast.info("FEMg >2% — renal magnesium wasting");
    }
  };

  const analyzeUrineCalcium = () => {
    const ca = parseFloat(urineCalcium);
    if (isNaN(ca)) {
      toast.error("Enter urine calcium value");
      return;
    }
    const isHigh = window.confirm?.() ?? false; // not needed, use buttons instead
    if (ca > 300) {
      setUrineCaResult("high");
      toast.info("High urine Ca²⁺ — consider loop diuretic or Bartter");
    } else {
      setUrineCaResult("low");
      toast.info("Low urine Ca²⁺ — consider thiazide or Gitelman");
    }
  };

  // ── Clinical note generation ──
  const generateNote = () => {
    const lines: string[] = [
      "═══ Hypomagnesemia Clinical Summary ═══",
      `Serum Mg²⁺: ${serumMg || "—"} mmol/L`,
      "",
    ];
    if (steps.step2_complete) {
      lines.push(`Severity: ${severity?.toUpperCase() || "?"}`);
      lines.push(`Emergency features: ${hasEmergencyFeatures === null ? "?" : hasEmergencyFeatures ? "Yes" : "No"}`);
      lines.push("");
    }
    if (steps.step3_complete) {
      lines.push(`Replacement route: ${route?.toUpperCase() || "?"}`);
      if (route === "oral") {
        lines.push("  Agent: Mg salts (oxide, glycerophosphate, aspartate, citrate)");
        lines.push("  Dose: 10–24 mmol/day in divided doses");
      }
      if (route === "iv") {
        lines.push("  Agent: Magnesium sulfate");
        lines.push("  Dose: 1–2 g IV over 15–60 min; repeat/infuse based on response");
        lines.push("  Monitoring: ECG, reflexes, BP");
      }
      lines.push("");
    }
    if (steps.step4_complete) {
      lines.push(`FEMg: ${femg || "—"}% → ${femgResult === "low" ? "Extrarenal loss" : "Renal wasting"}`);
      if (urineCaResult) {
        lines.push(`Urine Ca²⁺: ${urineCalcium || "—"} → ${urineCaResult === "high" ? "High (loop diuretic / Bartter)" : "Low (thiazide / Gitelman)"}`);
      }
      lines.push("");
    }
    if (hasHypokalemia !== null || hasHypocalcemia !== null) {
      lines.push("Associated disorders:");
      if (hasHypokalemia) lines.push("  • Hypokalemia — often refractory until Mg corrected");
      if (hasHypocalcemia) lines.push("  • Hypocalcemia — functional hypoparathyroidism possible");
      lines.push("");
    }
    return lines.join("\n");
  };

  const copyNote = () => {
    navigator.clipboard.writeText(generateNote());
    toast.success("Note copied to clipboard");
  };

  const downloadNote = () => {
    downloadTextFile(generateNote(), `hypomagnesemia-summary-${Date.now()}.txt`);
    toast.success("Note downloaded");
  };

  // ── Reset ──
  const resetAll = () => {
    setSerumMg("");
    setConfirmed(null);
    setSeverity(null);
    setHasEmergencyFeatures(null);
    setRoute(null);
    setFemg("");
    setUrineMg("");
    setUrineCreat("");
    setUrineCalcium("");
    setFemgResult(null);
    setUrineCaResult(null);
    setHasHypokalemia(null);
    setHasHypocalcemia(null);
    setExpandedSection("step1");
    toast.info("Reset complete");
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Bone className="h-6 w-6 text-purple-400" />
            Hypomagnesemia Decision Support
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
          Step 2: Severity
        </Badge>
        <ChevronRight className="h-3 w-3" />
        <Badge variant={steps.step3_complete ? "default" : "outline"}>
          Step 3: Replace
        </Badge>
        <ChevronRight className="h-3 w-3" />
        <Badge variant={steps.step4_complete ? "default" : "outline"}>
          Step 4: Find Cause
        </Badge>
      </div>

      {/* ── STEP 1: Confirm ── */}
      <Card className="border-blue-500/20">
        <button
          onClick={() => setExpandedSection(expandedSection === "step1" ? null : "step1")}
          className="w-full text-left"
        >
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FlaskConical className="h-5 w-5 text-blue-400" />
                <CardTitle className="text-base">Step 1: Confirm Hypomagnesemia</CardTitle>
              </div>
              {expandedSection === "step1" ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </div>
            <CardDescription>Check serum Mg²⁺ — confirm true hypomagnesemia</CardDescription>
          </CardHeader>
        </button>

        {expandedSection === "step1" && (
          <CardContent className="space-y-4 pt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Serum Mg²⁺ (mmol/L)</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="e.g. 0.45"
                  value={serumMg}
                  onChange={(e) => setSerumMg(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Conversion: 1 mg/dL = 0.4114 mmol/L</Label>
                <div className="text-xs text-muted-foreground p-2 rounded bg-muted/50">
                  <p>Normal range: 0.6–1.1 mmol/L (1.5–2.7 mg/dL)</p>
                  <p>Critical low: &lt;0.4 mmol/L (&lt;1.0 mg/dL)</p>
                </div>
              </div>
            </div>

            <Button onClick={confirmHypomagnesemia} className="w-full" disabled={!serumMg}>
              Confirm Hypomagnesemia
            </Button>

            {confirmed === true && (
              <div className="p-3 rounded-lg border bg-green-500/5 border-green-500/20 text-sm">
                <p className="font-semibold text-green-400">✓ True hypomagnesemia confirmed (Mg²⁺ &lt;0.6 mmol/L)</p>
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {/* ── STEP 2: Severity & Emergency Features ── */}
      <Card className={`border-${severity ? "green" : "purple"}-500/20 ${!steps.step1_complete ? "opacity-50 pointer-events-none" : ""}`}>
        <button
          onClick={() => setExpandedSection(expandedSection === "step2" ? null : "step2")}
          className="w-full text-left"
        >
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-purple-400" />
                <CardTitle className="text-base">Step 2: Classify Severity</CardTitle>
              </div>
              {expandedSection === "step2" ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </div>
            <CardDescription>Determine severity class and identify emergency features</CardDescription>
          </CardHeader>
        </button>

        {expandedSection === "step2" && (
          <CardContent className="space-y-4 pt-0">
            <Button onClick={classifySeverity} className="w-full" disabled={!serumMg}>
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
                  {severity === "severe" && "⚠ Severe hypomagnesemia (<0.4 mmol/L) — urgent IV replacement"}
                  {severity === "moderate" && "⚠ Moderate hypomagnesemia (0.4–0.5 mmol/L)"}
                  {severity === "mild" && "✓ Mild hypomagnesemia (0.5–0.6 mmol/L)"}
                </p>
              </div>
            )}

            {/* Emergency features */}
            <div>
              <Label className="mb-2 block">Emergency Features</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <Button
                  variant={hasEmergencyFeatures === true ? "default" : "outline"}
                  onClick={() => setHasEmergencyFeatures(true)}
                  className={hasEmergencyFeatures === true ? "bg-red-500/20 text-red-400 border-red-500/30" : ""}
                >
                  Yes — arrhythmia, seizure, tetany, delirium, QT prolongation
                </Button>
                <Button
                  variant={hasEmergencyFeatures === false ? "default" : "outline"}
                  onClick={() => setHasEmergencyFeatures(false)}
                >
                  No emergency features
                </Button>
              </div>
            </div>

            {/* Mg toxicity signs reference */}
            <div className="p-3 rounded-lg border border-orange-500/10 bg-orange-500/5 text-xs text-muted-foreground">
              <p className="font-semibold text-orange-400 mb-1">Emergency features indicating urgent admission:</p>
              <ul className="list-disc list-inside space-y-0.5">
                <li>Arrhythmia / QT prolongation</li>
                <li>Seizure / tetany</li>
                <li>Delirium / altered mental status</li>
                <li>Severe weakness</li>
                <li>Concurrent refractory hypokalemia or hypocalcemia</li>
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
            <CardDescription>Choose oral vs IV based on severity and symptoms</CardDescription>
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
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">When</div>
                  <div className="font-semibold">Mild, stable, able to take PO</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Dose</div>
                  <div className="font-semibold">10–24 mmol/day in divided doses</div>
                </div>
              </div>
              <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                <li>• Agents: Mg oxide, Mg glycerophosphate, Mg aspartate, Mg citrate</li>
                <li>• Monitor: repeat level in 3–7 days</li>
                <li>• Split doses for better tolerance and absorption</li>
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
                Indicated for: symptomatic, severe, arrhythmia, unable to take PO
              </div>
              <div className="space-y-2 text-sm">
                <div className="p-3 rounded bg-card/50 border border-border">
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Agent</div>
                  <div className="font-semibold">Magnesium Sulfate</div>
                </div>
                <div className="p-3 rounded bg-card/50 border border-border">
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Dose</div>
                  <div className="font-semibold">1–2 g IV over 15–60 min</div>
                  <div className="text-xs text-muted-foreground">Repeat or infuse based on response and renal function</div>
                </div>
              </div>
              <div className="mt-2 text-xs text-muted-foreground">
                <p className="font-semibold text-amber-400">Monitoring:</p>
                <ul className="list-disc list-inside space-y-0.5">
                  <li>ECG if severe</li>
                  <li>Patellar reflexes (loss = early toxicity)</li>
                  <li>Blood pressure</li>
                  <li>Repeat Mg²⁺, K⁺, Ca²⁺</li>
                </ul>
              </div>
            </div>

            {route === "iv" && (
              <div className="p-3 rounded-lg border border-red-500/10 bg-red-500/5 text-xs text-muted-foreground">
                <p className="font-semibold text-red-400">⚠ Renal impairment:</p>
                <p>Reduce dose and monitor closely to avoid hypermagnesemia. Toxicity signs: hypotension, bradycardia, loss of reflexes, respiratory depression.</p>
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {/* ── STEP 4: Find Cause ── */}
      <Card className={`border-${femgResult ? "green" : "teal"}-500/20 ${!steps.step3_complete ? "opacity-50 pointer-events-none" : ""}`}>
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
            <CardDescription>FEMg → Urine Ca → Associated disorders → Etiology</CardDescription>
          </CardHeader>
        </button>

        {expandedSection === "step4" && (
          <CardContent className="space-y-4 pt-0">
            {/* Labs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label>FEMg (%)</Label>
                <Input
                  type="number"
                  step="0.1"
                  placeholder="e.g. 1.5"
                  value={femg}
                  onChange={(e) => setFemg(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Urine Mg (mg/dL)</Label>
                <Input
                  type="number"
                  placeholder="e.g. 5"
                  value={urineMg}
                  onChange={(e) => setUrineMg(e.target.value)}
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
            </div>

            <Button onClick={analyzeFemg} className="w-full" disabled={!femg}>
              Analyze FEMg
            </Button>

            {/* FEMg reference */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 px-2 font-medium">Interpretation</th>
                    <th className="text-left py-2 px-2 font-medium">FEMg</th>
                    <th className="text-left py-2 px-2 font-medium">Causes</th>
                  </tr>
                </thead>
                <tbody>
                  {FEMG_CRITERIA.map((fc, i) => (
                    <tr key={i} className="border-b border-border/50 hover:bg-muted/30">
                      <td className="py-1.5 px-2 font-medium">{fc.result}</td>
                      <td className="py-1.5 px-2">{fc.femg}</td>
                      <td className="py-1.5 px-2 text-muted-foreground">{fc.causes.join(", ")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {femgResult && (
              <div className={`p-3 rounded-lg border text-sm ${
                femgResult === "low"
                  ? "bg-green-500/5 border-green-500/20 text-green-400"
                  : "bg-amber-500/5 border-amber-500/20 text-amber-400"
              }`}>
                <p className="font-semibold">
                  {femgResult === "low"
                    ? "✓ Extrarenal loss or low intake — GI/losses, malabsorption, poor intake"
                    : "⚠ Renal magnesium wasting — check urine Ca²⁺, review medications"}
                </p>
              </div>
            )}

            {/* Urine calcium (only if renal wasting) */}
            {femgResult === "high" && (
              <>
                <Separator />
                <div className="space-y-3">
                  <Label className="block">Urine Calcium (mg/day)</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant={urineCaResult === "high" ? "default" : "outline"}
                      onClick={() => setUrineCaResult("high")}
                      className={urineCaResult === "high" ? "bg-orange-500/20 text-orange-400 border-orange-500/30" : ""}
                    >High — loop diuretic / Bartter</Button>
                    <Button
                      variant={urineCaResult === "low" ? "default" : "outline"}
                      onClick={() => setUrineCaResult("low")}
                      className={urineCaResult === "low" ? "bg-blue-500/20 text-blue-400 border-blue-500/30" : ""}
                    >Low — thiazide / Gitelman</Button>
                  </div>
                  {urineCaResult && (
                    <div className="p-3 rounded-lg border text-xs border-teal-500/20 bg-teal-500/5">
                      <p className="font-semibold text-teal-400">
                        {urineCaResult === "high"
                          ? "High urine Ca²⁺ — consider loop diuretic therapy or Bartter syndrome"
                          : "Low urine Ca²⁺ — consider thiazide effect or Gitelman syndrome"}
                      </p>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Associated electrolyte disorders */}
            <Separator />
            <div>
              <Label className="mb-2 block">Associated Electrolyte Disorders</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs text-muted-foreground">Concurrent Hypokalemia?</Label>
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    <Button
                      variant={hasHypokalemia === true ? "default" : "outline"}
                      size="sm"
                      onClick={() => setHasHypokalemia(true)}
                      className={hasHypokalemia === true ? "bg-amber-500/20 text-amber-400 border-amber-500/30" : ""}
                    >Yes</Button>
                    <Button
                      variant={hasHypokalemia === false ? "default" : "outline"}
                      size="sm"
                      onClick={() => setHasHypokalemia(false)}
                    >No</Button>
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Concurrent Hypocalcemia?</Label>
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    <Button
                      variant={hasHypocalcemia === true ? "default" : "outline"}
                      size="sm"
                      onClick={() => setHasHypocalcemia(true)}
                      className={hasHypocalcemia === true ? "bg-amber-500/20 text-amber-400 border-amber-500/30" : ""}
                    >Yes</Button>
                    <Button
                      variant={hasHypocalcemia === false ? "default" : "outline"}
                      size="sm"
                      onClick={() => setHasHypocalcemia(false)}
                    >No</Button>
                  </div>
                </div>
              </div>
            </div>

            {(hasHypokalemia === true || hasHypocalcemia === true) && (
              <div className="p-3 rounded-lg border border-purple-500/10 bg-purple-500/5 text-xs text-muted-foreground">
                <p className="font-semibold text-purple-400 mb-1">Associated disorder management:</p>
                {hasHypokalemia && <p>• Hypokalemia: often refractory until Mg corrected — replace Mg before or with K⁺</p>}
                {hasHypocalcemia && <p>• Hypocalcemia: functional hypoparathyroidism possible — Mg repletion may normalize Ca²⁺/PTH</p>}
              </div>
            )}

            {/* Refractory / recurrent guidance */}
            <Separator />
            <div className="p-3 rounded-lg border border-blue-500/10 bg-blue-500/5 text-xs text-muted-foreground">
              <p className="font-semibold text-blue-400 mb-1">Refractory or Recurrent Hypomagnesemia</p>
              <ul className="list-disc list-inside space-y-0.5">
                <li>Stop causative drugs (PPIs, loop diuretics, aminoglycosides, cisplatin)</li>
                <li>Consider amiloride for renal Mg wasting</li>
                <li>Nephrology referral</li>
                <li>Consider genetic tubulopathy workup (Gitelman, Bartter)</li>
              </ul>
            </div>
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
            <CardDescription>Critical safety rules for magnesium repletion</CardDescription>
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
