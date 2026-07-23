import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  AlertTriangle, Droplets, Stethoscope, FlaskConical,
  HeartPulse, Brain, Pill, Syringe, Activity, Copy,
  Download, ChevronRight, ChevronDown, Bone,
} from "lucide-react";
import { downloadTextFile } from "@/lib/clinical-utils";
import { toast } from "sonner";

// ══════════════════════════════════════════════
// Types
// ══════════════════════════════════════════════

type Severity = "mild" | "moderate" | "severe" | "critical" | null;
type Cause = "renal_failure" | "excess_intake" | "unknown" | null;

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
  "MSD Manual 2025",
  "StatPearls 2023",
  "Hospital Handbook",
  "PMC clinical review 2023",
];

const DEFINITION = "Serum Mg²⁺ >2.6 mg/dL (>1.05 mmol/L)";

// ══════════════════════════════════════════════
// Severity ranges
// ══════════════════════════════════════════════

const SEVERITY_RANGES = [
  { level: "Mild", range: "2.6–4.0 mg/dL", color: "text-green-400", bg: "bg-green-500/5", border: "border-green-500/20" },
  { level: "Moderate", range: "4.0–6.0 mg/dL", color: "text-yellow-400", bg: "bg-yellow-500/5", border: "border-yellow-500/20" },
  { level: "Severe", range: "6.0–12.0 mg/dL", color: "text-orange-400", bg: "bg-orange-500/5", border: "border-orange-500/20" },
  { level: "Critical", range: "≥12.0 mg/dL", color: "text-red-400", bg: "bg-red-500/5", border: "border-red-500/20" },
];

// ══════════════════════════════════════════════
// Symptoms by severity
// ══════════════════════════════════════════════

const SYMPTOM_PROGRESSION = [
  { level: "Mild", symptoms: ["Nausea", "Flushing", "Headache", "Drowsiness"] },
  { level: "Moderate", symptoms: ["Lethargy", "Hyporeflexia", "Weakness", "Mild hypotension"] },
  { level: "Severe", symptoms: ["Loss of reflexes", "Bradycardia", "Hypotension", "Respiratory depression"] },
  { level: "Critical", symptoms: ["Heart block", "Cardiac arrest", "Respiratory failure", "Coma"] },
];

// ══════════════════════════════════════════════
// ECG changes
// ══════════════════════════════════════════════

const ECG_CHANGES = [
  "Prolonged PR interval",
  "Widened QRS",
  "Increased T wave amplitude",
  "Bradyarrhythmia",
  "Heart block (complete AV block at very high levels)",
];

// ══════════════════════════════════════════════
// Safety rules
// ══════════════════════════════════════════════

const SAFETY_RULES = [
  {
    icon: <Pill className="h-4 w-4" />,
    title: "Stop All Magnesium Sources Immediately",
    detail: "Antacids, laxatives, supplements, IV Mg — stopping intake is the first and most critical step to prevent worsening.",
    color: "text-red-500",
    bg: "bg-red-500/5",
    border: "border-red-500/20",
  },
  {
    icon: <HeartPulse className="h-4 w-4" />,
    title: "IV Calcium for Severe Symptoms / ECG Changes",
    detail: "Calcium gluconate 10% 10–20 mL IV over 5–10 min (may repeat). Stabilizes myocardium and reverses neuromuscular toxicity. This is a temporizing measure — works within minutes.",
    color: "text-orange-500",
    bg: "bg-orange-500/5",
    border: "border-orange-500/20",
  },
  {
    icon: <Droplets className="h-4 w-4" />,
    title: "Dialyze If Renal Excretion Inadequate",
    detail: "Hemodialysis is definitive removal in renal failure, anuria/oliguria, critical levels (≥12 mg/dL), refractory symptoms, or life-threatening arrhythmia.",
    color: "text-purple-500",
    bg: "bg-purple-500/5",
    border: "border-purple-500/20",
  },
  {
    icon: <Brain className="h-4 w-4" />,
    title: "Monitor Calcium and Reflexes",
    detail: "Mg²⁺ depresses neuromuscular function — loss of patellar reflex is an early sign. Check Ca²⁺ levels and deep tendon reflexes regularly.",
    color: "text-cyan-500",
    bg: "bg-cyan-500/5",
    border: "border-cyan-500/20",
  },
];

// ══════════════════════════════════════════════
// Component
// ══════════════════════════════════════════════

export default function Hypermagnesemia() {
  // ── Step 1: Confirm ──
  const [serumMg, setSerumMg] = useState("");
  const [confirmed, setConfirmed] = useState<boolean | null>(null);

  // ── Step 2: Severity ──
  const [severity, setSeverity] = useState<Severity>(null);
  const [hasEcgChanges, setHasEcgChanges] = useState<boolean | null>(null);
  const [hasEmergencyFeatures, setHasEmergencyFeatures] = useState<boolean | null>(null);

  // ── Step 3: Treatment ──
  const [calciumGiven, setCalciumGiven] = useState<boolean | null>(null);
  const [dialysisIndicated, setDialysisIndicated] = useState<boolean | null>(null);

  // ── Step 4: Cause ──
  const [cause, setCause] = useState<Cause>(null);
  const [hasRenalFailure, setHasRenalFailure] = useState<boolean | null>(null);

  // ── UI state ──
  const [expandedSection, setExpandedSection] = useState<string | null>("step1");

  // ── Step progression ──
  const steps: StepState = useMemo(() => ({
    step1_complete: confirmed === true,
    step2_complete: severity !== null,
    step3_complete: calciumGiven !== null,
    step4_complete: cause !== null,
  }), [confirmed, severity, calciumGiven, cause]);

  // ── Step 1: Confirm ──
  const confirmHypermagnesemia = () => {
    const mg = parseFloat(serumMg);
    if (isNaN(mg)) {
      toast.error("Enter a valid serum Mg²⁺ value");
      return;
    }
    if (mg <= 2.6) {
      toast.error("Mg²⁺ ≤2.6 mg/dL — this is not hypermagnesemia");
      return;
    }
    setConfirmed(true);
    toast.success("Hypermagnesemia confirmed. Assess severity.");
    setExpandedSection("step2");
  };

  // ── Step 2: Classify severity ──
  const classifySeverity = () => {
    const mg = parseFloat(serumMg);
    if (isNaN(mg)) return;

    if (mg >= 12.0) {
      setSeverity("critical");
      toast.error("Critical hypermagnesemia — life-threatening emergency");
    } else if (mg >= 6.0) {
      setSeverity("severe");
      toast.error("Severe hypermagnesemia — urgent treatment needed");
    } else if (mg >= 4.0) {
      setSeverity("moderate");
      toast.warning("Moderate hypermagnesemia");
    } else {
      setSeverity("mild");
      toast.info("Mild hypermagnesemia — stop Mg sources and monitor");
    }
    setExpandedSection("step3");
  };

  // ── Step 3: Treatment assessment ──
  const assessTreatment = () => {
    const isSevereOrCritical = severity === "severe" || severity === "critical";
    const hasEcg = hasEcgChanges === true;
    const hasEmergency = hasEmergencyFeatures === true;

    if (isSevereOrCritical || hasEcg || hasEmergency) {
      setCalciumGiven(true);
      toast.info("IV calcium indicated for ECG changes / severe symptoms");
    } else {
      setCalciumGiven(false);
      toast.success("No urgent antidote needed — stop Mg sources and monitor");
    }
    setExpandedSection("step4");
  };

  // ── Step 4: Determine cause ──
  const determineCause = () => {
    if (hasRenalFailure === true) {
      setCause("renal_failure");
      setDialysisIndicated(true);
      toast.info("Renal failure → impaired Mg excretion. Consider dialysis.");
    } else {
      setCause("excess_intake");
      setDialysisIndicated(false);
      toast.info("Excess intake with normal kidney function → source removal + supportive care");
    }
  };

  // ── Mg unit conversion helpers ──
  const mgDl = serumMg ? parseFloat(serumMg) : null;
  const mmolL = mgDl !== null && !isNaN(mgDl) ? (mgDl * 0.4114).toFixed(2) : null;

  // ── Clinical note generation ──
  const generateNote = () => {
    const lines: string[] = [
      "═══ Hypermagnesemia Clinical Summary ═══",
      `Serum Mg²⁺: ${serumMg || "—"} mg/dL (${mmolL || "—"} mmol/L)`,
      "",
    ];
    if (steps.step2_complete) {
      lines.push(`Severity: ${severity?.toUpperCase() || "?"}`);
      lines.push(`ECG changes: ${hasEcgChanges === null ? "?" : hasEcgChanges ? "Yes" : "No"}`);
      lines.push(`Emergency features: ${hasEmergencyFeatures === null ? "?" : hasEmergencyFeatures ? "Yes" : "No"}`);
      lines.push("");
    }
    if (steps.step3_complete) {
      lines.push(`IV calcium given: ${calciumGiven ? "Yes" : "No (not indicated)"}`);
      lines.push(`Dialysis indicated: ${dialysisIndicated === null ? "?" : dialysisIndicated ? "Yes" : "No"}`);
      lines.push("");
    }
    if (steps.step4_complete) {
      lines.push(`Etiology: ${cause === "renal_failure" ? "Renal failure → impaired excretion" : "Excess intake with normal kidney function"}`);
      lines.push("Actions: stop all Mg sources, cardiac monitoring, IV access");
      if (cause === "renal_failure" || dialysisIndicated) {
        lines.push("  → Hemodialysis / CRRT indicated");
      }
      lines.push("");
    }
    return lines.join("\n");
  };

  const copyNote = () => {
    navigator.clipboard.writeText(generateNote());
    toast.success("Note copied to clipboard");
  };

  const downloadNote = () => {
    downloadTextFile(generateNote(), `hypermagnesemia-summary-${Date.now()}.txt`);
    toast.success("Note downloaded");
  };

  // ── Reset ──
  const resetAll = () => {
    setSerumMg("");
    setConfirmed(null);
    setSeverity(null);
    setHasEcgChanges(null);
    setHasEmergencyFeatures(null);
    setCalciumGiven(null);
    setDialysisIndicated(null);
    setCause(null);
    setHasRenalFailure(null);
    setExpandedSection("step1");
    toast.info("Reset complete");
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Bone className="h-6 w-6 text-orange-400" />
            Hypermagnesemia Decision Support
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
          Step 3: Treatment
        </Badge>
        <ChevronRight className="h-3 w-3" />
        <Badge variant={steps.step4_complete ? "default" : "outline"}>
          Step 4: Cause
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
                <CardTitle className="text-base">Step 1: Confirm Hypermagnesemia</CardTitle>
              </div>
              {expandedSection === "step1" ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </div>
            <CardDescription>Check serum Mg²⁺ — confirm true hypermagnesemia and rule out hemolysis</CardDescription>
          </CardHeader>
        </button>

        {expandedSection === "step1" && (
          <CardContent className="space-y-4 pt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Serum Mg²⁺ (mg/dL)</Label>
                <Input
                  type="number"
                  step="0.1"
                  placeholder="e.g. 4.5"
                  value={serumMg}
                  onChange={(e) => setSerumMg(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Conversion</Label>
                <div className="text-xs text-muted-foreground p-2 rounded bg-muted/50">
                  {mmolL ? (
                    <p><span className="font-semibold">{mgDl?.toFixed(1)} mg/dL</span> = <span className="font-semibold">{mmolL} mmol/L</span></p>
                  ) : (
                    <p>Normal: 1.5–2.6 mg/dL (0.6–1.05 mmol/L)</p>
                  )}
                  <p>Multiply mg/dL × 0.4114 = mmol/L</p>
                </div>
              </div>
            </div>

            <div className="p-3 rounded-lg border border-blue-500/10 bg-blue-500/5 text-xs text-muted-foreground">
              <p className="font-semibold text-blue-400 mb-1">Actions before confirmation:</p>
              <ul className="list-disc list-inside space-y-0.5">
                <li>Repeat if hemolyzed sample suspected</li>
                <li>Review medication list for Mg-containing products</li>
                <li>Stop all magnesium sources immediately</li>
                <li>Get ECG</li>
              </ul>
            </div>

            <Button onClick={confirmHypermagnesemia} className="w-full" disabled={!serumMg}>
              Confirm Hypermagnesemia
            </Button>

            {confirmed === true && (
              <div className="p-3 rounded-lg border bg-red-500/5 border-red-500/20 text-sm">
                <p className="font-semibold text-red-400">⚠ True hypermagnesemia confirmed (Mg²⁺ &gt;2.6 mg/dL)</p>
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {/* ── STEP 2: Severity ── */}
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
            <CardDescription>Determine severity class and check ECG / emergency features</CardDescription>
          </CardHeader>
        </button>

        {expandedSection === "step2" && (
          <CardContent className="space-y-4 pt-0">
            <Button onClick={classifySeverity} className="w-full" disabled={!serumMg}>
              Classify Severity
            </Button>

            {/* Severity ranges */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
              {SEVERITY_RANGES.map((sr) => (
                <div key={sr.level} className={`p-3 rounded-lg border ${sr.border} ${sr.bg}`}>
                  <div className={`text-sm font-bold ${sr.color}`}>{sr.level}</div>
                  <div className="text-xs text-muted-foreground">{sr.range}</div>
                </div>
              ))}
            </div>

            {severity && (
              <div className={`p-3 rounded-lg border text-sm ${
                severity === "critical"
                  ? "bg-red-500/5 border-red-500/20 text-red-400"
                  : severity === "severe"
                  ? "bg-orange-500/5 border-orange-500/20 text-orange-400"
                  : severity === "moderate"
                  ? "bg-yellow-500/5 border-yellow-500/20 text-yellow-400"
                  : "bg-green-500/5 border-green-500/20 text-green-400"
              }`}>
                <p className="font-semibold">
                  {severity === "critical" && "🚨 Critical (≥12 mg/dL) — life-threatening emergency"}
                  {severity === "severe" && "⚠ Severe (6.0–12.0 mg/dL) — urgent treatment"}
                  {severity === "moderate" && "⚠ Moderate (4.0–6.0 mg/dL)"}
                  {severity === "mild" && "✓ Mild (2.6–4.0 mg/dL) — stop Mg sources and monitor"}
                </p>
              </div>
            )}

            {/* Symptom progression reference */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-1.5 px-2 font-medium">Severity</th>
                    <th className="text-left py-1.5 px-2 font-medium">Symptoms</th>
                  </tr>
                </thead>
                <tbody>
                  {SYMPTOM_PROGRESSION.map((sp, i) => (
                    <tr key={i} className="border-b border-border/50">
                      <td className="py-1 px-2 font-medium">{sp.level}</td>
                      <td className="py-1 px-2 text-muted-foreground">{sp.symptoms.join(" → ")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* ECG changes */}
            <div className="p-3 rounded-lg border border-orange-500/10 bg-orange-500/5 text-xs text-muted-foreground">
              <p className="font-semibold text-orange-400 mb-1">ECG Changes in Hypermagnesemia:</p>
              <ul className="list-disc list-inside space-y-0.5">
                {ECG_CHANGES.map((ecg, i) => <li key={i}>{ecg}</li>)}
              </ul>
            </div>

            {/* ECG + Emergency feature toggles */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="mb-2 block">ECG Changes?</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant={hasEcgChanges === true ? "default" : "outline"}
                    size="sm"
                    onClick={() => setHasEcgChanges(true)}
                    className={hasEcgChanges === true ? "bg-orange-500/20 text-orange-400 border-orange-500/30" : ""}
                  >Yes</Button>
                  <Button
                    variant={hasEcgChanges === false ? "default" : "outline"}
                    size="sm"
                    onClick={() => setHasEcgChanges(false)}
                  >No</Button>
                </div>
              </div>
              <div>
                <Label className="mb-2 block">Emergency Features?</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant={hasEmergencyFeatures === true ? "default" : "outline"}
                    size="sm"
                    onClick={() => setHasEmergencyFeatures(true)}
                    className={hasEmergencyFeatures === true ? "bg-red-500/20 text-red-400 border-red-500/30" : ""}
                  >Yes</Button>
                  <Button
                    variant={hasEmergencyFeatures === false ? "default" : "outline"}
                    size="sm"
                    onClick={() => setHasEmergencyFeatures(false)}
                  >No</Button>
                </div>
              </div>
            </div>

            <div className="p-3 rounded-lg border border-red-500/10 bg-red-500/5 text-xs text-muted-foreground">
              <p className="font-semibold text-red-400">Emergency triggers:</p>
              <p>Respiratory depression, hemodynamic instability, altered mental status, arrhythmia, renal failure, Mg ≥12 mg/dL</p>
            </div>
          </CardContent>
        )}
      </Card>

      {/* ── STEP 3: Treatment ── */}
      <Card className={`border-${calciumGiven !== null ? "green" : "rose"}-500/20 ${!steps.step2_complete ? "opacity-50 pointer-events-none" : ""}`}>
        <button
          onClick={() => setExpandedSection(expandedSection === "step3" ? null : "step3")}
          className="w-full text-left"
        >
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Syringe className="h-5 w-5 text-rose-400" />
                <CardTitle className="text-base">Step 3: Treatment</CardTitle>
              </div>
              {expandedSection === "step3" ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </div>
            <CardDescription>Antidote → Enhance excretion → Dialysis</CardDescription>
          </CardHeader>
        </button>

        {expandedSection === "step3" && (
          <CardContent className="space-y-4 pt-0">
            {/* Initial actions */}
            <div className="p-3 rounded-lg border border-blue-500/10 bg-blue-500/5 text-xs text-muted-foreground">
              <p className="font-semibold text-blue-400 mb-1">Initial Actions (all severity levels):</p>
              <ul className="list-disc list-inside space-y-0.5">
                <li>Stop all magnesium-containing products (antacids, laxatives, supplements, IV Mg)</li>
                <li>Cardiac monitoring</li>
                <li>IV access</li>
                <li>Assess airway and breathing</li>
                <li>Check renal function</li>
              </ul>
            </div>

            <Button onClick={assessTreatment} className="w-full">
              Assess Treatment Need
            </Button>

            {/* Antidote: IV Calcium */}
            <div className={`p-4 rounded-lg border ${calciumGiven === true ? "border-red-500/20 bg-red-500/5" : "border-border"}`}>
              <div className="flex items-center gap-2 mb-2">
                <HeartPulse className={`h-5 w-5 ${calciumGiven === true ? "text-red-400" : "text-muted-foreground"}`} />
                <h3 className="font-semibold text-sm">IV Calcium (Antidote)</h3>
                {calciumGiven === true && <Badge variant="default" className="text-[10px] bg-red-500/20 text-red-400">INDICATED</Badge>}
                {calciumGiven === false && <Badge variant="outline" className="text-[10px]">NOT NEEDED</Badge>}
              </div>
              <div className="text-xs text-muted-foreground">
                <p><span className="font-semibold">Indication:</span> Severe symptoms, ECG changes, or life-threatening hypermagnesemia</p>
                <p><span className="font-semibold">Agent:</span> Calcium gluconate 10% 10–20 mL IV over 5–10 min</p>
                <p><span className="font-semibold">Note:</span> May repeat if needed. Temporizes cardiopulmonary toxicity (membrane stabilization).</p>
              </div>
            </div>

            {/* Enhance excretion */}
            <div className="p-4 rounded-lg border border-cyan-500/10 bg-cyan-500/5">
              <div className="flex items-center gap-2 mb-2">
                <Droplets className="h-5 w-5 text-cyan-400" />
                <h3 className="font-semibold text-sm">Enhance Excretion (if hemodynamically stable)</h3>
              </div>
              <div className="text-xs text-muted-foreground space-y-1">
                <p>• 0.9% saline IVF — promotes renal Mg²⁺ excretion</p>
                <p>• Furosemide — if kidney function adequate and volume status allows</p>
                <p>• Avoid: Mg-containing fluids, continued Mg supplements</p>
              </div>
            </div>

            {/* Dialysis */}
            <div className="p-4 rounded-lg border border-purple-500/10 bg-purple-500/5">
              <div className="flex items-center gap-2 mb-2">
                <Droplets className="h-5 w-5 text-purple-400" />
                <h3 className="font-semibold text-sm">Dialysis</h3>
              </div>
              <div className="text-xs text-muted-foreground">
                <p className="font-semibold text-purple-400">Indications:</p>
                <ul className="list-disc list-inside space-y-0.5 mt-1">
                  <li>Anuric / oliguric renal failure</li>
                  <li>Critical hypermagnesemia (≥12 mg/dL)</li>
                  <li>Refractory symptoms</li>
                  <li>Life-threatening arrhythmia</li>
                  <li>Respiratory failure</li>
                </ul>
                <p className="mt-1">Modalities: Hemodialysis or CRRT if needed</p>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* ── STEP 4: Find Cause ── */}
      <Card className={`border-${cause ? "green" : "teal"}-500/20 ${!steps.step3_complete ? "opacity-50 pointer-events-none" : ""}`}>
        <button
          onClick={() => setExpandedSection(expandedSection === "step4" ? null : "step4")}
          className="w-full text-left"
        >
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Stethoscope className="h-5 w-5 text-teal-400" />
                <CardTitle className="text-base">Step 4: Find the Cause</CardTitle>
              </div>
              {expandedSection === "step4" ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </div>
            <CardDescription>Renal failure vs excess intake — identify and address the source</CardDescription>
          </CardHeader>
        </button>

        {expandedSection === "step4" && (
          <CardContent className="space-y-4 pt-0">
            <div>
              <Label className="mb-2 block">Does the patient have renal failure / oliguria?</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant={hasRenalFailure === true ? "default" : "outline"}
                  onClick={() => setHasRenalFailure(true)}
                  className={hasRenalFailure === true ? "bg-red-500/20 text-red-400 border-red-500/30" : ""}
                >Yes — renal failure / impaired excretion</Button>
                <Button
                  variant={hasRenalFailure === false ? "default" : "outline"}
                  onClick={() => setHasRenalFailure(false)}
                >No — normal kidney function</Button>
              </div>
            </div>

            <Button onClick={determineCause} className="w-full" disabled={hasRenalFailure === null}>
              Determine Cause
            </Button>

            {cause && (
              <div className={`p-4 rounded-lg border ${
                cause === "renal_failure"
                  ? "border-red-500/20 bg-red-500/5"
                  : "border-green-500/20 bg-green-500/5"
              }`}>
                <h3 className="text-sm font-bold mb-2">
                  {cause === "renal_failure" ? "🚨 Impaired Excretion" : "✓ Excess Intake"}
                </h3>
                <div className="text-xs text-muted-foreground space-y-1">
                  {cause === "renal_failure" ? (
                    <>
                      <p>• Common causes: CKD, AKI, lithium-related renal dysfunction</p>
                      <p>• Impaired Mg excretion → accumulation</p>
                      <p>• Dialysis is likely needed for definitive removal</p>
                    </>
                  ) : (
                    <>
                      <p>• Common sources: Mg-containing antacids, laxatives, supplements, eclampsia therapy, bowel preparations</p>
                      <p>• Iatrogenic: IV Mg administration, TPN with Mg</p>
                      <p>• Source removal + supportive care usually sufficient</p>
                      <p>• Consider adrenal insufficiency if recurrent without clear source</p>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Common causes reference */}
            <Separator />
            <div className="p-3 rounded-lg border border-blue-500/10 bg-blue-500/5 text-xs text-muted-foreground">
              <p className="font-semibold text-blue-400 mb-1">Common Causes Summary:</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div>
                  <p className="font-semibold text-[10px] uppercase tracking-wider">Excess Intake</p>
                  <ul className="list-disc list-inside space-y-0.5">
                    <li>Mg-containing antacids</li>
                    <li>Laxatives / bowel preps</li>
                    <li>Supplements</li>
                    <li>Eclampsia therapy (MgSO₄)</li>
                    <li>Iatrogenic IV/TPN</li>
                  </ul>
                </div>
                <div>
                  <p className="font-semibold text-[10px] uppercase tracking-wider">Impaired Excretion</p>
                  <ul className="list-disc list-inside space-y-0.5">
                    <li>Renal failure (CKD/AKI)</li>
                    <li>Adrenal insufficiency</li>
                    <li>Lithium-related renal dysfunction</li>
                    <li>Hypothyroidism (rare)</li>
                  </ul>
                </div>
              </div>
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
            <CardDescription>Critical safety rules for hypermagnesemia management</CardDescription>
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
