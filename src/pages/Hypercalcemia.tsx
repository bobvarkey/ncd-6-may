import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertTriangle, Droplets, Stethoscope, FlaskConical,
  HeartPulse, Brain, Pill, Syringe, Activity, Copy,
  Download, ShieldAlert, ChevronRight, ChevronDown,
} from "lucide-react";
import { downloadTextFile } from "@/lib/clinical-utils";
import { toast } from "sonner";

// ══════════════════════════════════════════════
// Types
// ══════════════════════════════════════════════

type Severity = "mild" | "moderate" | "severe" | null;
type TrueHypercalcemia = "yes" | "no" | null;
type PTHDependent = "dependent" | "independent" | null;
type FHHLikely = "fhh" | "primary_hpt" | null;

interface StepState {
  step1_complete: boolean;
  step2_complete: boolean;
  step3_complete: boolean;
}

// ══════════════════════════════════════════════
// Guideline metadata
// ══════════════════════════════════════════════

const GUIDELINES = [
  "AAFP practical approach",
  "Merck Manual Professional 2025",
  "Endocrine Society",
  "NHS/primary care",
];

const DEFINITION = "Elevated corrected or ionized serum calcium";

// ══════════════════════════════════════════════
// Severity thresholds
// ══════════════════════════════════════════════

function getSeverity(correctedCa: number): Severity {
  if (correctedCa >= 14.0) return "severe";
  if (correctedCa >= 12.0) return "moderate";
  if (correctedCa >= 10.5) return "mild";
  return null;
}

// ══════════════════════════════════════════════
// Treatment recommendations
// ══════════════════════════════════════════════

function getInitialManagement(): { title: string; details: string[]; agent: string; dose: string; maxCorrection: string } {
  return {
    title: "Step 4 — Initial Management",
    agent: "0.9% Saline + Furosemide (after repletion)",
    dose: "IV 0.9% NaCl at 200–300 mL/h until euvolemic; then furosemide 20–40 mg IV PRN",
    maxCorrection: "Monitor Ca, Cr, electrolytes daily",
    details: [
      "Stop thiazides, lithium, Ca/Vitamin D supplements if causative",
      "Review for underlying malignancy",
      "Restore euvolemia with 0.9% saline to promote calciuresis",
      "Loop diuretic (furosemide) ONLY after volume repletion — never before",
      "Nephrology consult if moderate/severe or refractory",
    ],
  };
}

function getSevereTreatment(): { title: string; details: string[]; agent: string; dose: string; maxCorrection: string } {
  return {
    title: "Step 5 — Severe / Symptomatic Treatment",
    agent: "IV saline + Calcitonin + IV Bisphosphonate",
    dose: "Zoledronic acid 4 mg IV over ≥15 min (preferred) OR Pamidronate 60–90 mg IV",
    maxCorrection: "Ca expected to fall in 2–4 days; bridge with calcitonin",
    details: [
      "First line: IV saline + calcitonin + IV bisphosphonate",
      "Calcitonin 4 IU/kg SC/IM q12h — rapid temporary reduction, tachyphylaxis in 2–3 days",
      "Bisphosphonate: zoledronic acid 4 mg IV over ≥15 min (preferred) or pamidronate 60–90 mg IV",
      "Steroids (prednisone 40–60 mg/d PO/IV) when vitamin D-mediated, lymphoma, granulomatous",
      "Refractory/recurrent: denosumab 60–120 mg SC, or dialysis if renal failure/oliguria/life-threatening",
    ],
  };
}

function getDiseaseSpecificPaths(pthDep: PTHDependent): { title: string; details: string[]; agent: string; dose: string; maxCorrection: string } | null {
  if (pthDep === "dependent") {
    return {
      title: "Step 6 — PTH-Dependent: Primary Hyperparathyroidism / FHH",
      agent: "Parathyroidectomy vs monitoring",
      dose: "Surgery if symptomatic or meets criteria; observe if mild/asymptomatic",
      maxCorrection: "Refer to endocrine surgery",
      details: [
        "Primary hyperparathyroidism: parathyroidectomy if symptomatic, Ca >1 mg/dL above ULN, CrCl <60, osteoporosis, or age <50",
        "FHH: no intervention needed — reassure and avoid unnecessary surgery",
        "Monitor Ca, Cr, bone density annually if managed conservatively",
        "FHH differentiation: low urine Ca → FHH; high urine Ca → primary hyperparathyroidism",
        "Consider lithium-associated hyperparathyroidism if on lithium therapy",
      ],
    };
  }
  return {
    title: "Step 6 — PTH-Independent: Treat Underlying Cause",
    agent: "Depends on etiology",
    dose: "Bisphosphonate ± glucocorticoids ± treat primary disease",
    maxCorrection: "Ca, Cr, electrolytes daily",
    details: [
      "Malignancy: bisphosphonate + denosumab + treat primary malignancy",
      "Vitamin D-mediated: glucocorticoids (prednisone 40–60 mg/d), stop vitamin D source",
      "Milk-alkali / medication: stop causative agent, rehydrate with 0.9% saline, monitor renal function",
      "Granulomatous disease: glucocorticoids, treat underlying disease",
      "Ensure volume repletion before and during any specific therapy",
    ],
  };
}

// ══════════════════════════════════════════════
// Safety rules
// ══════════════════════════════════════════════

const SAFETY_RULES = [
  {
    icon: <ShieldAlert className="h-4 w-4" />,
    title: "Measure PTH Early",
    detail: "PTH separates PTH-dependent from PTH-independent causes — the single most important diagnostic test after confirming hypercalcemia.",
    color: "text-red-500",
    bg: "bg-red-500/5",
    border: "border-red-500/20",
  },
  {
    icon: <Droplets className="h-4 w-4" />,
    title: "Rehydrate Before Loop Diuretic",
    detail: "Loop diuretics before euvolemia worsens volume depletion and prerenal AKI. Always restore euvolemia with 0.9% saline first.",
    color: "text-blue-500",
    bg: "bg-blue-500/5",
    border: "border-blue-500/20",
  },
  {
    icon: <AlertTriangle className="h-4 w-4" />,
    title: "Avoid Nephrotoxins",
    detail: "Avoid NSAIDs, IV contrast, and aminoglycosides when possible — the kidney is already under calcemic stress.",
    color: "text-orange-500",
    bg: "bg-orange-500/5",
    border: "border-orange-500/20",
  },
  {
    icon: <Activity className="h-4 w-4" />,
    title: "Daily Monitoring",
    detail: "Monitor serum calcium, creatinine, and electrolytes daily (more frequently in crisis). Watch for hypocalcemia after bisphosphonate.",
    color: "text-purple-500",
    bg: "bg-purple-500/5",
    border: "border-purple-500/20",
  },
];

// ══════════════════════════════════════════════
// Component
// ══════════════════════════════════════════════

export default function Hypercalcemia() {
  // ── Step 1: Confirm True Hypercalcemia ──
  const [totalCalcium, setTotalCalcium] = useState("");
  const [albumin, setAlbumin] = useState("");
  const [ionizedCalcium, setIonizedCalcium] = useState("");
  const [creatinine, setCreatinine] = useState("");
  const [phosphorus, setPhosphorus] = useState("");
  const [magnesium, setMagnesium] = useState("");
  const [trueHypercalcemia, setTrueHypercalcemia] = useState<TrueHypercalcemia>(null);

  // ── Step 2: Symptoms & Urgency ──
  const [urgencySymptoms, setUrgencySymptoms] = useState<string[]>([]);
  const [isCrisis, setIsCrisis] = useState(false);

  // ── Step 3: Identify PTH-Dependent State ──
  const [intactPTH, setIntactPTH] = useState("");
  const [pthrp, setPthrp] = useState("");
  const [vitaminD25, setVitaminD25] = useState("");
  const [vitaminD125, setVitaminD125] = useState("");
  const [urineCalcium, setUrineCalcium] = useState("");
  const [pthDependent, setPthDependent] = useState<PTHDependent>(null);
  const [fhhLikely, setFhhLikely] = useState<FHHLikely>(null);

  // ── UI state ──
  const [expandedSection, setExpandedSection] = useState<string | null>("step1");

  // ── Calculated values ──
  const correctedCalcium = useMemo(() => {
    const ca = parseFloat(totalCalcium);
    const alb = parseFloat(albumin);
    if (isNaN(ca) || isNaN(alb)) return null;
    return ca + 0.8 * (4.0 - alb);
  }, [totalCalcium, albumin]);

  const severity: Severity = useMemo(() => {
    const cc = correctedCalcium;
    if (cc === null) return null;
    return getSeverity(cc);
  }, [correctedCalcium]);

  // ── Step progression ──
  const steps: StepState = useMemo(() => ({
    step1_complete: trueHypercalcemia === "yes",
    step2_complete: isCrisis !== null,
    step3_complete: pthDependent !== null,
  }), [trueHypercalcemia, isCrisis, pthDependent]);

  // ── Analyze Step 1 ──
  const analyzeHypercalcemia = () => {
    const ca = parseFloat(totalCalcium);
    const alb = parseFloat(albumin);
    const ionCa = parseFloat(ionizedCalcium);
    if (isNaN(ca) || isNaN(alb)) {
      toast.error("Enter valid total calcium and albumin values");
      return;
    }
    const corrected = ca + 0.8 * (4.0 - alb);
    const ionizedElevated = !isNaN(ionCa) && ionCa > 1.35;
    const correctedElevated = corrected > 10.5;

    if (!correctedElevated && !ionizedElevated) {
      setTrueHypercalcemia("no");
      toast.info("No hypercalcemia — both corrected and ionized calcium are normal.");
    } else {
      setTrueHypercalcemia("yes");
      const sev = getSeverity(corrected);
      toast.success(`True hypercalcemia confirmed. Corrected Ca: ${corrected.toFixed(1)} mg/dL — ${sev ? sev.toUpperCase() : "elevated"}`);
      setExpandedSection("step2");
    }
  };

  // ── Analyze Step 2: Symptoms & Urgency ──
  const urgentSymptomsList = [
    { id: "confusion", label: "Confusion / Altered mental status" },
    { id: "stupor", label: "Stupor / Coma" },
    { id: "dehydration", label: "Dehydration" },
    { id: "arrhythmia", label: "Arrhythmia / ECG changes" },
    { id: "vomiting", label: "Vomiting / Nausea" },
    { id: "polyuria", label: "Polyuria / Polydipsia" },
    { id: "aki", label: "AKI (acute kidney injury)" },
  ];

  const toggleSymptom = (id: string) => {
    setUrgencySymptoms((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const analyzeUrgency = () => {
    const cc = correctedCalcium;
    const severeSymptoms = urgencySymptoms.includes("confusion") || urgencySymptoms.includes("stupor") || urgencySymptoms.includes("arrhythmia");
    const caCrisis = cc !== null && cc >= 14.0;
    const crisis = caCrisis || severeSymptoms;
    setIsCrisis(crisis);
    if (crisis) {
      toast.warning("Hypercalcemic crisis — urgent treatment required. Proceed to Step 4 & 5.");
    } else {
      toast.success("No crisis features. Proceed to diagnostic workup (Step 3).");
    }
    setExpandedSection("step3");
  };

  // ── Analyze Step 3: PTH-Dependent State ──
  const analyzePTH = () => {
    const pth = parseFloat(intactPTH);
    if (isNaN(pth)) {
      toast.error("Enter intact PTH value (required)");
      return;
    }

    // Normal PTH range ~10–65 pg/mL (approximate)
    // PTH high (>65) or inappropriately normal (10–65 when Ca is high) → PTH-dependent
    // PTH suppressed (<10) → PTH-independent
    if (pth > 65 || (pth >= 10 && correctedCalcium !== null && correctedCalcium > 10.5)) {
      setPthDependent("dependent");
      // Try to differentiate FHH vs primary hyperparathyroidism
      const uCa = parseFloat(urineCalcium);
      if (!isNaN(uCa) && uCa < 100) {
        setFhhLikely("fhh");
        toast.info("PTH-dependent: low urine calcium suggests FHH. Consider family history, genetic testing.");
      } else if (!isNaN(uCa) && uCa >= 100) {
        setFhhLikely("primary_hpt");
        toast.info("PTH-dependent: high urine calcium suggests primary hyperparathyroidism.");
      } else {
        setFhhLikely(null);
        toast.info("PTH-dependent state identified. Enter urine calcium to differentiate FHH from primary hyperparathyroidism.");
      }
    } else if (pth < 10) {
      setPthDependent("independent");
      toast.info("PTH-independent — consider malignancy, vitamin D-mediated, granulomatous, milk-alkali, or medication causes.");
    } else {
      toast.error("PTH is normal but calcium is not clearly elevated — review lab values.");
      return;
    }
    setExpandedSection("step4");
  };

  // ── Treatment plans ──
  const initialManagement = useMemo(() => {
    if (!steps.step1_complete) return null;
    return getInitialManagement();
  }, [steps.step1_complete]);

  const severeTreatment = useMemo(() => {
    if (!isCrisis) return null;
    return getSevereTreatment();
  }, [isCrisis]);

  const diseaseSpecificPaths = useMemo(() => {
    if (!pthDependent) return null;
    return getDiseaseSpecificPaths(pthDependent);
  }, [pthDependent]);

  // ── Clinical note generation ──
  const generateNote = () => {
    const lines: string[] = [
      "═══ Hypercalcemia Clinical Summary ═══",
      `Total Calcium: ${totalCalcium || "—"} mg/dL`,
      `Albumin: ${albumin || "—"} g/dL`,
      `Corrected Calcium: ${correctedCalcium !== null ? correctedCalcium.toFixed(1) : "—"} mg/dL`,
      `Ionized Calcium: ${ionizedCalcium || "—"} mmol/L`,
      `Severity: ${severity ? severity.toUpperCase() : "—"}`,
      "",
    ];
    if (steps.step2_complete) {
      lines.push(`Crisis: ${isCrisis ? "YES — urgent treatment indicated" : "No crisis features"}`);
      lines.push(`Symptoms: ${urgencySymptoms.length > 0 ? urgencySymptoms.join(", ") : "None selected"}`);
      lines.push("");
    }
    if (steps.step3_complete) {
      lines.push(`PTH Status: ${pthDependent === "dependent" ? "PTH-dependent (primary hyperparathyroidism / FHH)" : "PTH-independent (malignancy / other cause)"}`);
      if (fhhLikely) {
        lines.push(`FHH Differentiation: ${fhhLikely === "fhh" ? "Likely FHH (low urine Ca)" : "Likely primary hyperparathyroidism (high urine Ca)"}`);
      }
      lines.push("");
    }
    lines.push(`Creatinine: ${creatinine || "—"} mg/dL`);
    lines.push(`Phosphorus: ${phosphorus || "—"} mg/dL`);
    lines.push(`Magnesium: ${magnesium || "—"} mg/dL`);
    lines.push("");
    if (initialManagement) {
      lines.push("Initial Management:");
      lines.push(`  Agent: ${initialManagement.agent}`);
      lines.push(`  Dose: ${initialManagement.dose}`);
      lines.push(...initialManagement.details.map((d) => `  • ${d}`));
      lines.push("");
    }
    if (severeTreatment) {
      lines.push("Severe/Symptomatic Treatment:");
      lines.push(`  Agent: ${severeTreatment.agent}`);
      lines.push(`  Dose: ${severeTreatment.dose}`);
      lines.push(...severeTreatment.details.map((d) => `  • ${d}`));
      lines.push("");
    }
    if (diseaseSpecificPaths) {
      lines.push("Disease-Specific Management:");
      lines.push(`  ${diseaseSpecificPaths.title}`);
      lines.push(`  Agent: ${diseaseSpecificPaths.agent}`);
      lines.push(`  Dose: ${diseaseSpecificPaths.dose}`);
      lines.push(...diseaseSpecificPaths.details.map((d) => `  • ${d}`));
    }
    return lines.join("\n");
  };

  const copyNote = () => {
    navigator.clipboard.writeText(generateNote());
    toast.success("Note copied to clipboard");
  };

  const downloadNote = () => {
    downloadTextFile(generateNote(), `hypercalcemia-summary-${Date.now()}.txt`);
    toast.success("Note downloaded");
  };

  // ── Reset ──
  const resetAll = () => {
    setTotalCalcium("");
    setAlbumin("");
    setIonizedCalcium("");
    setCreatinine("");
    setPhosphorus("");
    setMagnesium("");
    setTrueHypercalcemia(null);
    setUrgencySymptoms([]);
    setIsCrisis(false);
    setIntactPTH("");
    setPthrp("");
    setVitaminD25("");
    setVitaminD125("");
    setUrineCalcium("");
    setPthDependent(null);
    setFhhLikely(null);
    setExpandedSection("step1");
    toast.info("Reset complete");
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Droplets className="h-6 w-6 text-blue-400" />
            Hypercalcemia Decision Support
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
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Badge variant={steps.step1_complete ? "default" : "outline"}>
          Step 1: Confirm
        </Badge>
        <ChevronRight className="h-3 w-3" />
        <Badge variant={steps.step2_complete ? "default" : "outline"}>
          Step 2: Urgency
        </Badge>
        <ChevronRight className="h-3 w-3" />
        <Badge variant={steps.step3_complete ? "default" : "outline"}>
          Step 3: PTH state
        </Badge>
        <ChevronRight className="h-3 w-3" />
        <Badge variant={steps.step3_complete ? "default" : "outline"}>
          Steps 4–6: Treatment
        </Badge>
      </div>

      {/* ── STEP 1: Confirm True Hypercalcemia ── */}
      <Card className="border-blue-500/20">
        <button
          onClick={() => setExpandedSection(expandedSection === "step1" ? null : "step1")}
          className="w-full text-left"
        >
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FlaskConical className="h-5 w-5 text-blue-400" />
                <CardTitle className="text-base">Step 1: Confirm True Hypercalcemia</CardTitle>
              </div>
              {expandedSection === "step1" ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </div>
            <CardDescription>Check total calcium, albumin (corrected), and ionized calcium — rule out spurious elevation</CardDescription>
          </CardHeader>
        </button>

        {expandedSection === "step1" && (
          <CardContent className="space-y-4 pt-0">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Total Calcium (mg/dL)</Label>
                <Input
                  type="number"
                  step="0.1"
                  placeholder="e.g. 12.5"
                  value={totalCalcium}
                  onChange={(e) => setTotalCalcium(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Albumin (g/dL)</Label>
                <Input
                  type="number"
                  step="0.1"
                  placeholder="e.g. 3.5"
                  value={albumin}
                  onChange={(e) => setAlbumin(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Ionized Calcium (mmol/L)</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="e.g. 1.45"
                  value={ionizedCalcium}
                  onChange={(e) => setIonizedCalcium(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Creatinine (mg/dL)</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="e.g. 1.2"
                  value={creatinine}
                  onChange={(e) => setCreatinine(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Phosphorus (mg/dL)</Label>
                <Input
                  type="number"
                  step="0.1"
                  placeholder="e.g. 3.0"
                  value={phosphorus}
                  onChange={(e) => setPhosphorus(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Magnesium (mg/dL)</Label>
                <Input
                  type="number"
                  step="0.1"
                  placeholder="e.g. 2.0"
                  value={magnesium}
                  onChange={(e) => setMagnesium(e.target.value)}
                />
              </div>
            </div>

            {correctedCalcium !== null && (
              <div className="p-3 rounded-lg border border-blue-500/20 bg-blue-500/5 text-sm">
                <p className="font-semibold">
                  Albumin-corrected Ca: {correctedCalcium.toFixed(1)} mg/dL
                  {severity && (
                    <Badge className="ml-2" variant={severity === "severe" ? "destructive" : "secondary"}>
                      {severity.toUpperCase()}
                    </Badge>
                  )}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Formula: total_Ca + 0.8 × (4.0 − albumin) = {totalCalcium} + 0.8 × (4.0 − {albumin}) = {correctedCalcium.toFixed(1)} mg/dL
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Severity thresholds: mild 10.5–11.9 | moderate 12.0–13.9 | severe ≥14.0 mg/dL
                </p>
              </div>
            )}

            <Button onClick={analyzeHypercalcemia} className="w-full" disabled={!totalCalcium || !albumin}>
              Confirm True Hypercalcemia
            </Button>

            {trueHypercalcemia && (
              <div className={`p-3 rounded-lg border text-sm ${
                trueHypercalcemia === "yes"
                  ? "bg-green-500/5 border-green-500/20 text-green-400"
                  : "bg-amber-500/5 border-amber-500/20 text-amber-400"
              }`}>
                <p className="font-semibold">
                  {trueHypercalcemia === "yes"
                    ? "✓ True hypercalcemia confirmed — proceed to symptom assessment"
                    : "⚠ No hypercalcemia — both corrected and ionized calcium are within normal limits."}
                </p>
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {/* ── STEP 2: Symptoms & Urgency ── */}
      <Card className={`border-${isCrisis ? "red" : "purple"}-500/20 ${!steps.step1_complete ? "opacity-50 pointer-events-none" : ""}`}>
        <button
          onClick={() => setExpandedSection(expandedSection === "step2" ? null : "step2")}
          className="w-full text-left"
        >
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HeartPulse className="h-5 w-5 text-purple-400" />
                <CardTitle className="text-base">Step 2: Symptoms & Urgency Assessment</CardTitle>
              </div>
              {expandedSection === "step2" ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </div>
            <CardDescription>Identify urgent features and determine if hypercalcemic crisis is present</CardDescription>
          </CardHeader>
        </button>

        {expandedSection === "step2" && (
          <CardContent className="space-y-4 pt-0">
            <div>
              <Label className="mb-2 block">Urgent Features (select all present)</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {urgentSymptomsList.map((s) => (
                  <Button
                    key={s.id}
                    variant={urgencySymptoms.includes(s.id) ? "default" : "outline"}
                    className="h-auto py-2 justify-start text-sm"
                    onClick={() => toggleSymptom(s.id)}
                  >
                    <span className={`w-4 h-4 rounded border mr-2 flex items-center justify-center text-[10px] ${
                      urgencySymptoms.includes(s.id) ? "bg-primary border-primary text-primary-foreground" : "border-muted-foreground"
                    }`}>
                      {urgencySymptoms.includes(s.id) && "✓"}
                    </span>
                    {s.label}
                  </Button>
                ))}
              </div>
            </div>

            <Button onClick={analyzeUrgency} className="w-full" disabled={!correctedCalcium}>
              Assess Urgency
            </Button>

            {isCrisis !== false && isCrisis && (
              <div className="p-3 rounded-lg border bg-red-500/5 border-red-500/20 text-sm">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-400" />
                  <p className="font-semibold text-red-400">
                    Hypercalcemic crisis detected
                  </p>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Ca ≥14 mg/dL or severe symptoms present. Initiate urgent treatment immediately.
                </p>
              </div>
            )}

            {isCrisis !== false && !isCrisis && (
              <div className="p-3 rounded-lg border bg-green-500/5 border-green-500/20 text-sm">
                <p className="font-semibold text-green-400">
                  ✓ No crisis features — proceed to diagnostic workup
                </p>
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {/* ── STEP 3: Identify PTH-Dependent State ── */}
      <Card className={`border-${pthDependent ? "green" : "amber"}-500/20 ${!steps.step2_complete ? "opacity-50 pointer-events-none" : ""}`}>
        <button
          onClick={() => setExpandedSection(expandedSection === "step3" ? null : "step3")}
          className="w-full text-left"
        >
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FlaskConical className="h-5 w-5 text-amber-400" />
                <CardTitle className="text-base">Step 3: Identify PTH-Dependent State</CardTitle>
              </div>
              {expandedSection === "step3" ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </div>
            <CardDescription>Measure PTH to separate PTH-dependent from PTH-independent causes — this is the key diagnostic branch</CardDescription>
          </CardHeader>
        </button>

        {expandedSection === "step3" && (
          <CardContent className="space-y-4 pt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Intact PTH (pg/mL)</Label>
                <Input
                  type="number"
                  step="0.1"
                  placeholder="e.g. 85"
                  value={intactPTH}
                  onChange={(e) => setIntactPTH(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>PTHrP (pmol/L)</Label>
                <Input
                  type="number"
                  step="0.1"
                  placeholder="e.g. 2.5"
                  value={pthrp}
                  onChange={(e) => setPthrp(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>25-OH Vitamin D (ng/mL)</Label>
                <Input
                  type="number"
                  step="0.1"
                  placeholder="e.g. 30"
                  value={vitaminD25}
                  onChange={(e) => setVitaminD25(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>1,25-diOH Vitamin D (pg/mL)</Label>
                <Input
                  type="number"
                  step="0.1"
                  placeholder="e.g. 60"
                  value={vitaminD125}
                  onChange={(e) => setVitaminD125(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Urine Calcium (mg/24h)</Label>
                <Input
                  type="number"
                  step="1"
                  placeholder="e.g. 250"
                  value={urineCalcium}
                  onChange={(e) => setUrineCalcium(e.target.value)}
                />
              </div>
            </div>

            <Button onClick={analyzePTH} className="w-full" disabled={!intactPTH}>
              Determine PTH Dependency
            </Button>

            {pthDependent && (
              <div className={`p-3 rounded-lg border text-sm ${
                pthDependent === "dependent"
                  ? "bg-green-500/5 border-green-500/20"
                  : "bg-blue-500/5 border-blue-500/20"
              }`}>
                <p className="font-semibold">
                  {pthDependent === "dependent"
                    ? "✓ PTH-dependent — Primary hyperparathyroidism / FHH / Lithium"
                    : "✓ PTH-independent — Malignancy / Vitamin D-mediated / Granulomatous / Milk-alkali / Medications"}
                </p>
                {fhhLikely && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {fhhLikely === "fhh"
                      ? "Low urine calcium suggests FHH — consider family history and genetic testing"
                      : "High urine calcium suggests primary hyperparathyroidism — consider parathyroidectomy"}
                  </p>
                )}
                {pthDependent === "independent" && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Consider malignancy workup, vitamin D source, granulomatous disease, medication review, and milk-alkali history.
                  </p>
                )}
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {/* ── STEP 4: Initial Management ── */}
      <Card className={`border-blue-500/20 ${!steps.step1_complete ? "opacity-50 pointer-events-none" : ""}`}>
        <button
          onClick={() => setExpandedSection(expandedSection === "step4" ? null : "step4")}
          className="w-full text-left"
        >
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Droplets className="h-5 w-5 text-blue-400" />
                <CardTitle className="text-base">Step 4: Initial Management</CardTitle>
              </div>
              {expandedSection === "step4" ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </div>
            <CardDescription>General measures for all hypercalcemic patients: stop causative agents, hydrate, review malignancy</CardDescription>
          </CardHeader>
        </button>

        {expandedSection === "step4" && initialManagement && (
          <CardContent className="space-y-4 pt-0">
            <div className="p-4 rounded-lg border border-blue-500/20 bg-blue-500/5">
              <h3 className="text-base font-bold text-blue-400 mb-2 flex items-center gap-2">
                <Pill className="h-5 w-5" />
                {initialManagement.title}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                <div className="p-2 rounded bg-card/50 border border-border">
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Agent</div>
                  <div className="font-semibold text-sm">{initialManagement.agent}</div>
                </div>
                <div className="p-2 rounded bg-card/50 border border-border">
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Dose</div>
                  <div className="font-semibold text-sm">{initialManagement.dose}</div>
                </div>
                <div className="p-2 rounded bg-card/50 border border-border">
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Monitoring</div>
                  <div className="font-semibold text-sm">{initialManagement.maxCorrection}</div>
                </div>
              </div>
              <ul className="space-y-1">
                {initialManagement.details.map((d, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <span className="text-blue-400 mt-0.5">•</span>
                    {d}
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        )}
      </Card>

      {/* ── STEP 5: Severe/Symptomatic Treatment ── */}
      <Card className={`border-red-500/20 ${!isCrisis ? "opacity-50 pointer-events-none" : ""}`}>
        <button
          onClick={() => setExpandedSection(expandedSection === "step5" ? null : "step5")}
          className="w-full text-left"
        >
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Syringe className="h-5 w-5 text-red-400" />
                <CardTitle className="text-base">Step 5: Severe / Symptomatic Treatment</CardTitle>
              </div>
              {expandedSection === "step5" ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </div>
            <CardDescription>Unlocked only in crisis or severe symptomatic hypercalcemia — IV saline + calcitonin + bisphosphonate</CardDescription>
          </CardHeader>
        </button>

        {expandedSection === "step5" && severeTreatment && (
          <CardContent className="space-y-4 pt-0">
            <div className="p-4 rounded-lg border border-red-500/20 bg-red-500/5">
              <h3 className="text-base font-bold text-red-400 mb-2 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                {severeTreatment.title}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                <div className="p-2 rounded bg-card/50 border border-border">
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Agent</div>
                  <div className="font-semibold text-sm">{severeTreatment.agent}</div>
                </div>
                <div className="p-2 rounded bg-card/50 border border-border">
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Dose</div>
                  <div className="font-semibold text-sm">{severeTreatment.dose}</div>
                </div>
                <div className="p-2 rounded bg-card/50 border border-border">
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Response</div>
                  <div className="font-semibold text-sm">{severeTreatment.maxCorrection}</div>
                </div>
              </div>
              <ul className="space-y-1">
                {severeTreatment.details.map((d, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <span className="text-red-400 mt-0.5">•</span>
                    {d}
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        )}
      </Card>

      {/* ── STEP 6: Disease-Specific Paths ── */}
      <Card className={`border-green-500/20 ${!pthDependent ? "opacity-50 pointer-events-none" : ""}`}>
        <button
          onClick={() => setExpandedSection(expandedSection === "step6" ? null : "step6")}
          className="w-full text-left"
        >
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-green-400" />
                <CardTitle className="text-base">Step 6: Disease-Specific Paths</CardTitle>
              </div>
              {expandedSection === "step6" ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </div>
            <CardDescription>Tailored management based on PTH-dependent or PTH-independent etiology</CardDescription>
          </CardHeader>
        </button>

        {expandedSection === "step6" && diseaseSpecificPaths && (
          <CardContent className="space-y-4 pt-0">
            <div className="p-4 rounded-lg border border-green-500/20 bg-green-500/5">
              <h3 className="text-base font-bold text-green-400 mb-2 flex items-center gap-2">
                <Stethoscope className="h-5 w-5" />
                {diseaseSpecificPaths.title}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                <div className="p-2 rounded bg-card/50 border border-border">
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Approach</div>
                  <div className="font-semibold text-sm">{diseaseSpecificPaths.agent}</div>
                </div>
                <div className="p-2 rounded bg-card/50 border border-border">
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Dose/Plan</div>
                  <div className="font-semibold text-sm">{diseaseSpecificPaths.dose}</div>
                </div>
                <div className="p-2 rounded bg-card/50 border border-border">
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Follow-up</div>
                  <div className="font-semibold text-sm">{diseaseSpecificPaths.maxCorrection}</div>
                </div>
              </div>
              <ul className="space-y-1">
                {diseaseSpecificPaths.details.map((d, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <span className="text-green-400 mt-0.5">•</span>
                    {d}
                  </li>
                ))}
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
                <CardTitle className="text-base">⚠ Safety Rules in Hypercalcemia Management</CardTitle>
              </div>
              {expandedSection === "safety" ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </div>
            <CardDescription>Key safety principles to prevent complications during hypercalcemia management</CardDescription>
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