import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  AlertTriangle, Droplets, FlaskConical,
  HeartPulse, Brain, Syringe, Activity, Copy,
  Download, Clock, ShieldAlert, ChevronRight, ChevronDown, Search,
} from "lucide-react";
import { downloadTextFile } from "@/lib/clinical-utils";
import { toast } from "sonner";

// ══════════════════════════════════════════════
// Types
// ══════════════════════════════════════════════

type Severity = "none" | "mild" | "moderate" | "severe" | null;
type EcgFinding =
  | "peaked_t_waves" | "prolonged_pr" | "flattened_p" | "qrs_widening"
  | "sine_wave" | "bradyarrhythmia" | "ventricular_arrhythmia";

interface StepState {
  step1_confirmed: boolean;
  step2_severity: boolean;
  step3_stabilize: boolean;
  step4_remove: boolean;
  step5_cause: boolean;
}

// ══════════════════════════════════════════════
// Guideline metadata
// ══════════════════════════════════════════════

const GUIDELINES = [
  "UK Kidney Association 2020",
  "NHS Adult Hyperkalaemia Guidelines",
  "Emergency Care BC 2022",
  "ACEP Algorithm",
];

const DEFINITION = "Serum K⁺ >5.5 mmol/L (alert), severe ≥6.5";

// ══════════════════════════════════════════════
// Reference data
// ══════════════════════════════════════════════

const ECG_FINDINGS: { id: EcgFinding; label: string }[] = [
  { id: "peaked_t_waves", label: "Peaked T waves" },
  { id: "prolonged_pr", label: "Prolonged PR interval" },
  { id: "flattened_p", label: "Flattened / lost P wave" },
  { id: "qrs_widening", label: "QRS widening" },
  { id: "sine_wave", label: "Sine wave pattern" },
  { id: "bradyarrhythmia", label: "Bradyarrhythmia" },
  { id: "ventricular_arrhythmia", label: "Ventricular arrhythmia" },
];

const ECG_LABELS: Record<EcgFinding, string> = {
  peaked_t_waves: "Peaked T waves",
  prolonged_pr: "Prolonged PR interval",
  flattened_p: "Flattened / lost P wave",
  qrs_widening: "QRS widening",
  sine_wave: "Sine wave pattern",
  bradyarrhythmia: "Bradyarrhythmia",
  ventricular_arrhythmia: "Ventricular arrhythmia",
};

const EMERGENCY_TRIGGERS = [
  { id: "ecg_changes", label: "ECG changes present" },
  { id: "weakness_paralysis", label: "Weakness / paralysis" },
  { id: "rapid_rise", label: "Rapidly rising K⁺" },
  { id: "oliguria_eskd", label: "Oliguria / ESKD" },
  { id: "severe_acidosis", label: "Severe acidosis" },
  { id: "hemodynamic", label: "Hemodynamic instability" },
];

const PSEUDO_CAUSES = [
  "Hemolyzed sample",
  "Thrombocytosis",
  "Leukocytosis",
  "Sample handling error",
];

const SHIFT_THERAPIES = [
  {
    id: "insulin_dextrose",
    label: "Insulin + Dextrose",
    standard: "10U regular insulin + 25-50g dextrose IV",
    alternative: "5U insulin in select high-risk / insulin-naive patients",
    note: "Monitor POC glucose at 0, 30, 60 min then hourly up to 4-6h",
  },
  {
    id: "albuterol",
    label: "Nebulized Albuterol",
    detail: "10-20 mg over 10-15 minutes via nebulizer",
  },
  {
    id: "bicarbonate",
    label: "Sodium Bicarbonate",
    detail: "Use when metabolic acidosis present; less predictable without acidosis",
  },
];

const REMOVAL_OPTIONS = [
  {
    id: "loop_diuretic",
    label: "Loop Diuretic",
    detail: "If adequate urine output; avoid if volume depleted",
  },
  {
    id: "oral_binder",
    label: "Oral Potassium Binder",
    detail: "SZC, patiromer, or calcium resonium — if able to take PO",
  },
  {
    id: "dialysis",
    label: "Urgent Hemodialysis",
    detail: "For ESKD, oliguria, refractory, or life-threatening ECG changes",
  },
];

const CAUSES = [
  "Renal failure (AKI / CKD / ESKD)",
  "Metabolic acidosis",
  "Rhabdomyolysis / tissue breakdown",
  "Medications (RAAS blockers, NSAIDs, K-sparing diuretics)",
  "Insulin deficiency / hyperosmolar state",
  "Excess intake / massive transfusion",
  "Tumor lysis syndrome",
];

const CAUSE_TESTS = [
  { id: "creatinine", label: "Creatinine / eGFR" },
  { id: "bicarbonate", label: "Bicarbonate" },
  { id: "glucose", label: "Glucose" },
  { id: "ck", label: "CK (rhabdomyolysis)" },
  { id: "hemolysis", label: "Hemolysis index" },
  { id: "med_review", label: "Medication review" },
];

// ══════════════════════════════════════════════
// Severity logic
// ══════════════════════════════════════════════

function getSeverity(k: number): Severity {
  if (k < 5.5) return "none";
  if (k <= 5.9) return "mild";
  if (k <= 6.4) return "moderate";
  return "severe";
}

function getSeverityLabel(sev: Severity): string {
  switch (sev) {
    case "mild": return "5.5–5.9 mmol/L";
    case "moderate": return "6.0–6.4 mmol/L";
    case "severe": return "≥6.5 mmol/L";
    default: return "";
  }
}

function getSeverityColor(sev: Severity): string {
  switch (sev) {
    case "none": return "bg-green-500/5 border-green-500/20 text-green-400";
    case "mild": return "bg-amber-500/5 border-amber-500/20 text-amber-400";
    case "moderate": return "bg-orange-500/5 border-orange-500/20 text-orange-400";
    case "severe": return "bg-red-500/5 border-red-500/20 text-red-400";
    default: return "";
  }
}

// ══════════════════════════════════════════════
// Safety rules
// ══════════════════════════════════════════════

const SAFETY_RULES = [
  {
    icon: <Brain className="h-4 w-4" />,
    title: "Calcium First if ECG Changes",
    detail: "Calcium gluconate/chloride stabilizes the myocardium but does NOT lower serum K⁺. Repeat after 5-10 min if ECG changes persist.",
    color: "text-red-500", bg: "bg-red-500/5", border: "border-red-500/20",
  },
  {
    icon: <Clock className="h-4 w-4" />,
    title: "Recheck Potassium q1-2h Until Stable",
    detail: "Shift therapies are transient (~4-6 h). Repeat K⁺ every 1-2 hours. Monitor more frequently (q30-60 min) if unstable.",
    color: "text-amber-500", bg: "bg-amber-500/5", border: "border-amber-500/20",
  },
  {
    icon: <Activity className="h-4 w-4" />,
    title: "Insulin ± Glucose Monitoring",
    detail: "POC glucose at 0, 30, 60 min then hourly up to 4-6 h after insulin + dextrose. 5U alternative dose in select high-risk patients.",
    color: "text-orange-500", bg: "bg-orange-500/5", border: "border-orange-500/20",
  },
  {
    icon: <Droplets className="h-4 w-4" />,
    title: "Dialysis if Refractory",
    detail: "When K⁺ remains ≥6.5 despite medical therapy, or if ESKD/oliguria/anuria with life-threatening ECG changes — proceed to urgent hemodialysis.",
    color: "text-purple-500", bg: "bg-purple-500/5", border: "border-purple-500/20",
  },
  {
    icon: <Search className="h-4 w-4" />,
    title: "Rule Out Pseudohyperkalemia",
    detail: "Check for hemolysis on lab sample, thrombocytosis, leukocytosis, or sample handling errors before committing to aggressive therapy.",
    color: "text-blue-500", bg: "bg-blue-500/5", border: "border-blue-500/20",
  },
];

// ══════════════════════════════════════════════
// Component
// ══════════════════════════════════════════════

export default function Hyperkalemia() {
  // ── Step 1: Confirm ──
  const [serumK, setSerumK] = useState("");
  const [repeatK, setRepeatK] = useState("");
  const [ivAccess, setIvAccess] = useState(false);
  const [cardiacMonitoring, setCardiacMonitoring] = useState(false);
  const [pseudoExcluded, setPseudoExcluded] = useState(false);

  // ── Step 1 ECG (for triage) ──
  const [ecgTriage, setEcgTriage] = useState<EcgFinding[]>([]);

  // ── Step 2: Severity ──
  const [severity, setSeverity] = useState<Severity>(null);
  const [emergencyTriggers, setEmergencyTriggers] = useState<string[]>([]);

  // ── Step 3: Stabilize & Shift ──
  const [calciumGiven, setCalciumGiven] = useState(false);
  const [selectedShift, setSelectedShift] = useState<string[]>([]);
  const [acidosisPresent, setAcidosisPresent] = useState(false);

  // ── Step 4: Remove ──
  const [selectedRemoval, setSelectedRemoval] = useState<string[]>([]);

  // ── Step 5: Cause ──
  const [orderedTests, setOrderedTests] = useState<string[]>([]);
  const [selectedCauses, setSelectedCauses] = useState<string[]>([]);

  // ── UI state ──
  const [expanded, setExpanded] = useState<string | null>("step1");

  // ── Derived ──
  const kVal = parseFloat(serumK || "0");
  const kRepeatVal = parseFloat(repeatK || "0");
  const trueHyperkalemia = kVal > 5.5 && kRepeatVal > 5.5;
  const emergencyNeeded =
    severity === "severe" ||
    ecgTriage.length > 0 ||
    emergencyTriggers.length > 0;

  const steps: StepState = useMemo(() => ({
    step1_confirmed: trueHyperkalemia && pseudoExcluded,
    step2_severity: severity !== null && severity !== "none",
    step3_stabilize: selectedShift.length > 0 && (!emergencyNeeded || calciumGiven),
    step4_remove: selectedRemoval.length > 0,
    step5_cause: orderedTests.length > 0,
  }), [trueHyperkalemia, pseudoExcluded, severity, emergencyNeeded, calciumGiven, selectedShift, selectedRemoval, orderedTests]);

  // ── Helpers ──
  const toggleEcg = (f: EcgFinding) =>
    setEcgTriage((p) => p.includes(f) ? p.filter((x) => x !== f) : [...p, f]);

  const toggleTrigger = (id: string) =>
    setEmergencyTriggers((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]);

  const toggleShift = (id: string) =>
    setSelectedShift((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]);

  const toggleRemoval = (id: string) =>
    setSelectedRemoval((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]);

  const toggleTest = (id: string) =>
    setOrderedTests((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]);

  const toggleCause = (c: string) =>
    setSelectedCauses((p) => p.includes(c) ? p.filter((x) => x !== c) : [...p, c]);

  // ── Actions ──
  const confirmStep1 = () => {
    if (!serumK || !repeatK) {
      toast.error("Enter both initial and repeat K⁺ values");
      return;
    }
    if (kVal <= 5.5 && kRepeatVal <= 5.5) {
      setSeverity("none");
      toast.info("Not hyperkalemic — no action needed");
      return;
    }
    if (kVal > 5.5 && kRepeatVal <= 5.5) {
      setSeverity("none");
      toast.warning("Transient elevation — repeat is normal. Consider pseudohyperkalemia.");
      return;
    }
    setSeverity(getSeverity(kVal));
    toast.success(`True hyperkalemia confirmed — K⁺ ${kVal} mmol/L`);
    setExpanded("step2");
  };

  const assessSeverity = () => {
    if (!severity) return;
    if (emergencyNeeded) {
      toast.warning("Emergency triggers present — proceed to stabilization");
      setExpanded("step3");
    } else {
      toast.success("No emergency criteria — proceed to shift + removal");
      setExpanded("step3");
    }
  };

  const confirmCalciumGiven = () => {
    setCalciumGiven(true);
    toast.success("Calcium administered — myocardium stabilised");
  };

  const skipCalcium = () => {
    setCalciumGiven(true);
    toast.info("No ECG changes — proceeding to shift therapy");
    setExpanded("step3");
  };

  // ── Note generation ──
  const generateNote = () => {
    const lines: string[] = [
      "═══ Hyperkalemia Clinical Summary ═══",
      `Serum K⁺ (initial): ${serumK} mmol/L`,
      `Serum K⁺ (repeat): ${repeatK} mmol/L`,
      `Severity: ${severity ? `${severity.toUpperCase()} (${getSeverityLabel(severity)})` : "?"}`,
      `Pseudohyperkalemia excluded: ${pseudoExcluded ? "Yes" : "No"}`,
      "",
      "─ Confirmation & Triage ─",
      `IV access established: ${ivAccess ? "Yes" : "No"}`,
      `Cardiac monitoring: ${cardiacMonitoring ? "Yes" : "No"}`,
      `ECG changes: ${ecgTriage.length > 0 ? ecgTriage.map((f) => ECG_LABELS[f]).join(", ") : "None"}`,
      "",
      "─ Severity Assessment ─",
      `Emergency triggers: ${emergencyTriggers.length > 0 ? emergencyTriggers.join(", ") : "None"}`,
      "",
    ];

    if (selectedShift.length > 0) {
      const shiftNames = selectedShift.map((id) =>
        SHIFT_THERAPIES.find((t) => t.id === id)?.label || id
      );
      lines.push("─ Stabilization & Shift Therapy ─");
      lines.push(`Calcium given: ${calciumGiven ? "Yes" : "No"}`);
      lines.push(`Shift agents: ${shiftNames.join(", ")}`);
      lines.push(`Acidosis: ${acidosisPresent ? "Present" : "No"}`);
      lines.push("Glucose monitoring: POC q30min × 2, then hourly up to 4-6h");
      lines.push("");
    }

    if (selectedRemoval.length > 0) {
      const removalNames = selectedRemoval.map((id) =>
        REMOVAL_OPTIONS.find((t) => t.id === id)?.label || id
      );
      lines.push("─ Removal Therapy ─");
      lines.push(`Strategy: ${removalNames.join(", ")}`);
      lines.push("");
    }

    if (selectedCauses.length > 0) {
      lines.push("─ Identified Causes ─");
      selectedCauses.forEach((c) => lines.push(`  • ${c}`));
      lines.push("");
    }
    if (orderedTests.length > 0) {
      lines.push("─ Tests Ordered ─");
      orderedTests.forEach((t) => lines.push(`  • ${CAUSE_TESTS.find((ct) => ct.id === t)?.label || t}`));
    }

    lines.push("", "Safety: recheck K⁺ q1-2h until stable. Dialysis if refractory.");
    return lines.join("\n");
  };

  const copyNote = () => {
    navigator.clipboard.writeText(generateNote());
    toast.success("Note copied");
  };

  const downloadNote = () => {
    downloadTextFile(generateNote(), `hyperkalemia-${Date.now()}.txt`);
    toast.success("Note downloaded");
  };

  const resetAll = () => {
    setSerumK(""); setRepeatK(""); setIvAccess(false); setCardiacMonitoring(false);
    setPseudoExcluded(false); setEcgTriage([]); setSeverity(null);
    setEmergencyTriggers([]); setCalciumGiven(false); setSelectedShift([]);
    setAcidosisPresent(false); setSelectedRemoval([]); setOrderedTests([]);
    setSelectedCauses([]); setExpanded("step1");
    toast.info("Reset");
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <HeartPulse className="h-6 w-6 text-red-400" />
            Hyperkalemia Decision Support
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {DEFINITION} — {GUIDELINES.join(", ")}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={copyNote}><Copy className="h-4 w-4 mr-1" />Copy</Button>
          <Button variant="outline" size="sm" onClick={downloadNote}><Download className="h-4 w-4 mr-1" />Export</Button>
          <Button variant="ghost" size="sm" onClick={resetAll}>Reset</Button>
        </div>
      </div>

      {/* Progress */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
        <Badge variant={steps.step1_confirmed ? "default" : "outline"}>1: Confirm</Badge>
        <ChevronRight className="h-3 w-3" />
        <Badge variant={steps.step2_severity ? "default" : "outline"}>2: Severity</Badge>
        <ChevronRight className="h-3 w-3" />
        <Badge variant={steps.step3_stabilize ? "default" : "outline"}>3: Stabilize & Shift</Badge>
        <ChevronRight className="h-3 w-3" />
        <Badge variant={steps.step4_remove ? "default" : "outline"}>4: Remove K⁺</Badge>
        <ChevronRight className="h-3 w-3" />
        <Badge variant={steps.step5_cause ? "default" : "outline"}>5: Cause</Badge>
      </div>

      {/* ── STEP 1: Confirm ── */}
      <Card className="border-blue-500/20">
        <button onClick={() => setExpanded(expanded === "step1" ? null : "step1")} className="w-full text-left">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FlaskConical className="h-5 w-5 text-blue-400" />
                <CardTitle className="text-base">Step 1: Confirm Hyperkalemia</CardTitle>
                {trueHyperkalemia && <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/30">Confirmed</Badge>}
              </div>
              {expanded === "step1" ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </div>
            <CardDescription>Repeat K⁺, ECG, cardiac monitoring, IV access — exclude pseudohyperkalemia</CardDescription>
          </CardHeader>
        </button>

        {expanded === "step1" && (
          <CardContent className="space-y-4 pt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Initial Serum K⁺ (mmol/L)</Label>
                <Input type="number" step="0.1" placeholder="e.g. 6.2" value={serumK} onChange={(e) => setSerumK(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Repeat K⁺ (mmol/L)</Label>
                <Input type="number" step="0.1" placeholder="e.g. 6.1" value={repeatK} onChange={(e) => setRepeatK(e.target.value)} />
              </div>
            </div>

            {/* Initial actions checklist */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <Button variant={ivAccess ? "default" : "outline"} size="sm" onClick={() => setIvAccess(!ivAccess)}>
                {ivAccess ? "✓ " : ""}IV Access Established
              </Button>
              <Button variant={cardiacMonitoring ? "default" : "outline"} size="sm" onClick={() => setCardiacMonitoring(!cardiacMonitoring)}>
                {cardiacMonitoring ? "✓ " : ""}Cardiac Monitoring
              </Button>
              <Button variant={pseudoExcluded ? "default" : "outline"} size="sm" onClick={() => setPseudoExcluded(!pseudoExcluded)}>
                {pseudoExcluded ? "✓ " : ""}Pseudohyperkalemia Excluded
              </Button>
            </div>

            {/* Pseudohyperkalemia causes */}
            {pseudoExcluded && (
              <div className="p-3 rounded-lg border border-blue-500/20 bg-blue-500/5">
                <p className="text-xs font-semibold text-blue-400 mb-1">Exclude if any of:</p>
                <div className="flex flex-wrap gap-1.5">
                  {PSEUDO_CAUSES.map((c, i) => (
                    <Badge key={i} variant="outline" className="text-xs">{c}</Badge>
                  ))}
                </div>
              </div>
            )}

            {/* ECG changes for triage */}
            <div>
              <Label className="mb-2 block">ECG Changes (for triage)</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {ECG_FINDINGS.map((ecg) => (
                  <Button
                    key={ecg.id} variant={ecgTriage.includes(ecg.id) ? "default" : "outline"}
                    size="sm" onClick={() => toggleEcg(ecg.id)} className="h-auto py-2 text-xs justify-start"
                  >
                    {ecg.label}
                  </Button>
                ))}
              </div>
            </div>

            <Button onClick={confirmStep1} className="w-full" disabled={!serumK || !repeatK}>
              Confirm & Triage
            </Button>

            {severity && (
              <div className={`p-3 rounded-lg border text-sm ${getSeverityColor(severity)}`}>
                <p className="font-semibold">
                  {severity === "none" && "✓ Not hyperkalemic or transient elevation"}
                  {severity === "mild" && `⚠ Mild: K⁺ ${getSeverityLabel(severity)}`}
                  {severity === "moderate" && `⚠ Moderate: K⁺ ${getSeverityLabel(severity)}`}
                  {severity === "severe" && `🔴 SEVERE: K⁺ ${getSeverityLabel(severity)} — emergency`}
                </p>
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {/* ── STEP 2: Severity ── */}
      <Card className={`border-orange-500/20 ${!steps.step1_confirmed ? "opacity-50 pointer-events-none" : ""}`}>
        <button onClick={() => setExpanded(expanded === "step2" ? null : "step2")} className="w-full text-left">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-orange-400" />
                <CardTitle className="text-base">Step 2: Assess Severity & Emergency Triggers</CardTitle>
                {emergencyNeeded && <Badge variant="destructive" className="text-xs">EMERGENCY</Badge>}
              </div>
              {expanded === "step2" ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </div>
            <CardDescription>
              {severity
                ? `Severity: ${severity.toUpperCase()} (${getSeverityLabel(severity)})`
                : "Classify severity and identify emergency triggers"}
            </CardDescription>
          </CardHeader>
        </button>

        {expanded === "step2" && (
          <CardContent className="space-y-4 pt-0">
            {/* Severity badge */}
            {severity && severity !== "none" && (
              <div className={`p-3 rounded-lg border text-sm ${getSeverityColor(severity)}`}>
                <p className="font-semibold">
                  {severity === "mild" && "Mild hyperkalemia (5.5–5.9 mmol/L)"}
                  {severity === "moderate" && "Moderate hyperkalemia (6.0–6.4 mmol/L)"}
                  {severity === "severe" && "SEVERE hyperkalemia (≥6.5 mmol/L)"}
                </p>
              </div>
            )}

            {/* Emergency triggers */}
            <div>
              <Label className="mb-2 block">Emergency Triggers (check all that apply)</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {EMERGENCY_TRIGGERS.map((t) => (
                  <Button
                    key={t.id} variant={emergencyTriggers.includes(t.id) ? "destructive" : "outline"}
                    size="sm" onClick={() => toggleTrigger(t.id)} className="h-auto py-2 text-xs justify-start"
                  >
                    {emergencyTriggers.includes(t.id) ? "🔴 " : ""}{t.label}
                  </Button>
                ))}
              </div>
            </div>

            <Button onClick={assessSeverity} className="w-full" disabled={!severity}>
              Assess & Proceed
            </Button>
          </CardContent>
        )}
      </Card>

      {/* ── STEP 3: Stabilize & Shift ── */}
      <Card className={`border-rose-500/20 ${!steps.step2_severity ? "opacity-50 pointer-events-none" : ""}`}>
        <button onClick={() => setExpanded(expanded === "step3" ? null : "step3")} className="w-full text-left">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Droplets className="h-5 w-5 text-rose-400" />
                <CardTitle className="text-base">Step 3: Stabilize Myocardium & Shift K⁺ Into Cells</CardTitle>
              </div>
              {expanded === "step3" ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </div>
            <CardDescription>
              {emergencyNeeded
                ? "Calcium first if ECG changes — then shift therapy"
                : "Select shift therapies to transiently lower serum K⁺"}
            </CardDescription>
          </CardHeader>
        </button>

        {expanded === "step3" && (
          <CardContent className="space-y-4 pt-0">
            {/* Calcium stabilization section */}
            {emergencyNeeded && !calciumGiven && (
              <div className="p-4 rounded-lg border border-red-500/20 bg-red-500/5 space-y-3">
                <div className="flex items-center gap-2">
                  <HeartPulse className="h-5 w-5 text-red-400" />
                  <h3 className="font-bold text-red-400">Membrane Stabilization Required</h3>
                </div>
                <p className="text-sm">Administer calcium immediately to protect the myocardium:</p>
                <ul className="text-sm space-y-1">
                  <li className="text-muted-foreground">• <strong>Calcium gluconate</strong> 10 mL of 10% IV over 2-5 min</li>
                  <li className="text-muted-foreground">• <strong>Calcium chloride</strong> 5-10 mL via central access as alternative</li>
                  <li className="text-muted-foreground">• Repeat in 5-10 min if ECG changes persist</li>
                  <li className="text-muted-foreground">• Continuous ECG monitoring during administration</li>
                </ul>
                <p className="text-xs text-muted-foreground">Calcium protects the heart but does NOT lower serum potassium</p>
                <Button onClick={confirmCalciumGiven} className="w-full" variant="destructive">
                  <Syringe className="h-4 w-4 mr-2" />
                  Confirm: Calcium Given
                </Button>
              </div>
            )}

            {emergencyNeeded && calciumGiven && (
              <div className="p-3 rounded-lg border bg-green-500/5 border-green-500/20 text-sm">
                <p className="font-semibold text-green-400">✓ Calcium administered — proceed to shift therapy</p>
              </div>
            )}

            {!emergencyNeeded && !calciumGiven && (
              <div className="p-3 rounded-lg border bg-green-500/5 border-green-500/20 text-sm">
                <p className="font-semibold text-green-400">✓ No ECG changes or emergency — no calcium needed</p>
                <Button onClick={skipCalcium} variant="outline" size="sm" className="mt-2">
                  Proceed to Shift Therapy
                </Button>
              </div>
            )}

            {(calciumGiven || !emergencyNeeded) && (
              <>
                <Separator />
                <div>
                  <Label className="mb-2 block">Select Shift Therapies</Label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {SHIFT_THERAPIES.map((t) => (
                      <Button
                        key={t.id}
                        variant={selectedShift.includes(t.id) ? "default" : "outline"}
                        className={`h-auto py-3 justify-start text-left ${selectedShift.includes(t.id) ? "border-rose-500/30" : ""}`}
                        onClick={() => toggleShift(t.id)}
                      >
                        <div>
                          <div className="text-xs font-semibold">{t.label}</div>
                          <div className="text-[10px] text-muted-foreground mt-0.5">{t.detail || t.standard}</div>
                          {t.alternative && selectedShift.includes(t.id) && (
                            <div className="text-[10px] text-amber-400 mt-0.5">Alt: {t.alternative}</div>
                          )}
                        </div>
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Bicarbonate acidosis toggle */}
                {selectedShift.includes("bicarbonate") && (
                  <div className="flex items-center gap-3">
                    <Label className="text-sm">Metabolic acidosis present?</Label>
                    <Button variant={acidosisPresent ? "default" : "outline"} size="sm" onClick={() => setAcidosisPresent(!acidosisPresent)}>
                      {acidosisPresent ? "Yes — Bicarbonate indicated" : "No"}
                    </Button>
                  </div>
                )}

                {/* Glucose monitoring */}
                {selectedShift.includes("insulin_dextrose") && (
                  <div className="p-3 rounded-lg border border-amber-500/20 bg-amber-500/5">
                    <p className="text-sm font-semibold text-amber-400 flex items-center gap-2">
                      <Activity className="h-4 w-4" />
                      Glucose Monitoring: POC q30min × 2, then hourly up to 4-6h
                    </p>
                  </div>
                )}

                {selectedShift.length > 0 && (
                  <Button onClick={() => setExpanded("step4")} className="w-full">
                    Proceed to Removal Therapy
                  </Button>
                )}
              </>
            )}
          </CardContent>
        )}
      </Card>

      {/* ── STEP 4: Remove K⁺ ── */}
      <Card className={`border-emerald-500/20 ${!steps.step3_stabilize ? "opacity-50 pointer-events-none" : ""}`}>
        <button onClick={() => setExpanded(expanded === "step4" ? null : "step4")} className="w-full text-left">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Syringe className="h-5 w-5 text-emerald-400" />
                <CardTitle className="text-base">Step 4: Remove Potassium</CardTitle>
              </div>
              {expanded === "step4" ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </div>
            <CardDescription>Definitive therapy — loop diuretic, oral binder, or hemodialysis</CardDescription>
          </CardHeader>
        </button>

        {expanded === "step4" && (
          <CardContent className="space-y-4 pt-0">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {REMOVAL_OPTIONS.map((t) => (
                <Button
                  key={t.id}
                  variant={selectedRemoval.includes(t.id) ? "default" : "outline"}
                  className={`h-auto py-3 justify-start text-left ${selectedRemoval.includes(t.id) ? "border-emerald-500/30" : ""}`}
                  onClick={() => toggleRemoval(t.id)}
                >
                  <div>
                    <div className="text-xs font-semibold">{t.label}</div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">{t.detail}</div>
                  </div>
                </Button>
              ))}
            </div>

            {selectedRemoval.length > 0 && (
              <div className="p-4 rounded-lg border border-emerald-500/20 bg-emerald-500/5 space-y-2">
                <h3 className="text-sm font-bold text-emerald-400">Removal Plan</h3>
                <ul className="space-y-1">
                  {selectedRemoval.includes("loop_diuretic") && (
                    <li className="text-xs text-muted-foreground">• Furosemide 40-80 mg IV if adequate urine output</li>
                  )}
                  {selectedRemoval.includes("oral_binder") && (
                    <li className="text-xs text-muted-foreground">• SZC 10 g TID, patiromer 8.4 g daily, or calcium resonium 15 g QID</li>
                  )}
                  {selectedRemoval.includes("dialysis") && (
                    <li className="text-xs text-muted-foreground">• Urgent hemodialysis — definitive for ESKD / refractory cases</li>
                  )}
                </ul>
              </div>
            )}

            {selectedRemoval.length > 0 && (
              <Button onClick={() => setExpanded("step5")} className="w-full">
                Proceed to Cause Investigation
              </Button>
            )}
          </CardContent>
        )}
      </Card>

      {/* ── STEP 5: Cause ── */}
      <Card className={`border-purple-500/20 ${!steps.step4_remove ? "opacity-50 pointer-events-none" : ""}`}>
        <button onClick={() => setExpanded(expanded === "step5" ? null : "step5")} className="w-full text-left">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Search className="h-5 w-5 text-purple-400" />
                <CardTitle className="text-base">Step 5: Identify & Address Cause</CardTitle>
              </div>
              {expanded === "step5" ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </div>
            <CardDescription>Consider underlying etiology and order appropriate tests</CardDescription>
          </CardHeader>
        </button>

        {expanded === "step5" && (
          <CardContent className="space-y-4 pt-0">
            <div>
              <Label className="mb-2 block">Consider These Causes</Label>
              <div className="flex flex-wrap gap-1.5">
                {CAUSES.map((c, i) => (
                  <Button
                    key={i}
                    variant={selectedCauses.includes(c) ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleCause(c)}
                    className="h-auto py-1.5 text-xs"
                  >
                    {c}
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <Label className="mb-2 block">Order These Tests</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {CAUSE_TESTS.map((t) => (
                  <Button
                    key={t.id}
                    variant={orderedTests.includes(t.id) ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleTest(t.id)}
                    className="h-auto py-2 text-xs justify-start"
                  >
                    {orderedTests.includes(t.id) ? "✓ " : ""}{t.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Supportive actions */}
            <div className="p-4 rounded-lg border border-amber-500/20 bg-amber-500/5 space-y-2">
              <h3 className="text-sm font-semibold text-amber-400">Supportive Actions</h3>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• Stop offending agents: RAAS blockers, NSAIDs, K supplements, K-sparing diuretics</li>
                <li>• Treat hypovolemia with isotonic fluids if indicated</li>
                <li>• Treat metabolic acidosis if present</li>
                <li>• Consider special scenarios: rhabdomyolysis, tumor lysis, DKA, massive transfusion</li>
              </ul>
            </div>
          </CardContent>
        )}
      </Card>

      {/* ── Safety Rules ── */}
      <Card className="border-red-500/20">
        <button onClick={() => setExpanded(expanded === "safety" ? null : "safety")} className="w-full text-left">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-400" />
                <CardTitle className="text-base">⚠ Safety Rules</CardTitle>
              </div>
              {expanded === "safety" ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </div>
            <CardDescription>Critical safety information for hyperkalemia management</CardDescription>
          </CardHeader>
        </button>

        {expanded === "safety" && (
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