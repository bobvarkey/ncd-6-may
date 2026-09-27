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
  Download, Clock, ShieldAlert, ChevronRight, ChevronDown,
} from "lucide-react";
import { downloadTextFile } from "@/lib/clinical-utils";
import { toast } from "sonner";

// ══════════════════════════════════════════════
// Types
// ══════════════════════════════════════════════

type ConfirmationResult = "true_hypocalcemia" | "not_hypocalcemia" | null;
type SymptomSeverity = "severe" | "moderate" | "mild_asymptomatic" | null;
type EcgChange = "qt_prolongation" | "arrhythmia";
type TreatmentRoute = "iv_calcium" | "oral_calcium" | null;
type PthResult = "low" | "normal" | "high" | null;

interface StepState {
  step1_complete: boolean;
  step2_complete: boolean;
  step3_complete: boolean;
  step4_complete: boolean;
  step5_complete: boolean;
}

interface TreatmentPlan {
  title: string;
  route: string;
  agent: string;
  dose: string;
  details: string[];
}

// ══════════════════════════════════════════════
// Guideline metadata
// ══════════════════════════════════════════════

const GUIDELINES = [
  "NHS acute hypocalcaemia guidance",
  "UCSF Hospital Handbook",
  "EndoText",
  "StatPearls calcium gluconate",
];

const DEFINITION = "Low serum calcium; prefer ionized Ca for diagnosis";

// ══════════════════════════════════════════════
// Corrected calcium calculation
// ══════════════════════════════════════════════

function correctedCalcium(totalCa: number, albumin: number): number {
  return totalCa + 0.8 * (4 - albumin);
}

// ══════════════════════════════════════════════
// Treatment recommendations
// ══════════════════════════════════════════════

function getTreatmentPlan(
  severity: SymptomSeverity,
  ecgChanges: EcgChange[]
): TreatmentPlan {
  const hasSevereSymptoms = severity === "severe";
  const hasEcgChanges = ecgChanges.length > 0;

  if (hasSevereSymptoms || hasEcgChanges) {
    return {
      title: "Severe Symptoms / ECG Changes — IV Calcium",
      route: "Intravenous",
      agent: "Calcium gluconate 10%",
      dose: "10–20 mL IV over 10–15 min (diluted in D5W)",
      details: [
        "Indications: seizure, tetany, laryngospasm, arrhythmia, marked QT prolongation, altered mental status, rapid drop",
        "Give calcium gluconate 10% 10–20 mL IV over 10–15 min (must dilute in D5W)",
        "Infusion option: 100 mL 10% Ca gluconate in 1 L NS or D5W at 50–100 mL/h",
        "Monitor ECG and calcium q6h initially, then daily once stable",
        "Correct magnesium if hypomagnesemic (Mg may need repletion before Ca normalizes)",
        "Do NOT delay acute treatment — obtain labs but don't wait for results if symptomatic",
      ],
    };
  }

  // Mild/asymptomatic with intact gut function
  return {
    title: "Mild / Asymptomatic — Oral Calcium",
    route: "Oral",
    agent: "Calcium carbonate OR calcium citrate",
    dose: "500–1000 mg elemental Ca 2–3× daily",
    details: [
      "Indications: mild or asymptomatic hypocalcemia with intact gut function",
      "Calcium carbonate (40% elemental Ca) — take with food (requires gastric acid)",
      "Calcium citrate (21% elemental Ca) — better absorption, no food requirement",
      "Co-therapy: vitamin D if indicated (cholecalciferol or calcitriol)",
      "Monitor calcium levels periodically",
      "If gut function impaired or refractory, consider IV route",
    ],
  };
}

// ══════════════════════════════════════════════
// Cause identification logic
// ══════════════════════════════════════════════

function identifyCause(
  mg: number | null,
  phosphate: number | null,
  pth: PthResult,
  vitD: number | null,
  cr: number | null
): { title: string; description: string; therapy: string }[] {
  const findings: { title: string; description: string; therapy: string }[] = [];

  if (mg !== null && mg < 1.7) {
    findings.push({
      title: "Hypomagnesemia Detected",
      description: "Correct Mg first — calcium may remain low until magnesium is repleted. Magnesium is required for PTH secretion and end-organ responsiveness.",
      therapy: "IV/PO magnesium repletion: MgSO₄ 2–4 g IV (if severe) or Mg oxide 400–800 mg PO daily",
    });
  }

  if (pth === "low" || pth === "normal") {
    if (phosphate !== null && phosphate > 4.5) {
      findings.push({
        title: "Hypoparathyroidism",
        description: "Low/inappropriately normal PTH with hyperphosphatemia — classic hypoparathyroidism pattern. Causes: post-surgical, autoimmune, genetic.",
        therapy: "Oral calcium + calcitriol (0.25–1 mcg/d) or alfacalcidol. Monitor Ca/phosphate. Avoid thiazides if hypercalciuria.",
      });
    } else {
      findings.push({
        title: "PTH Suppression / Hypoparathyroidism",
        description: "Low or inappropriately normal PTH in the setting of hypocalcemia. Consider post-surgical (thyroid/parathyroid), autoimmune, or magnesium deficiency.",
        therapy: "Oral calcium + calcitriol/alfacalcidol. Correct Mg if low.",
      });
    }
  }

  if (pth === "high") {
    if (phosphate !== null && phosphate < 2.5) {
      findings.push({
        title: "Vitamin D Deficiency",
        description: "High PTH with low phosphate — classic secondary hyperparathyroidism from vitamin D deficiency. 25-OH vitamin D level confirms.",
        therapy: "Vitamin D repletion (cholecalciferol 50,000 IU weekly × 8 weeks then 800–2000 IU/d maintenance) + oral calcium supplements.",
      });
    } else if (cr !== null && cr > 1.5) {
      findings.push({
        title: "CKD / Renal Failure",
        description: "High PTH with renal impairment — secondary hyperparathyroidism of CKD. Phosphate retention and impaired 1α-hydroxylation of vitamin D.",
        therapy: "Manage hyperphosphatemia (phosphate binders), calcium as needed, active vitamin D (calcitriol or paricalcitol). Monitor Ca × Phos product.",
      });
    } else {
      findings.push({
        title: "PTH Resistance / Other",
        description: "High PTH without clear pattern — consider pseudohypoparathyroidism (PTH resistance), early CKD, or medication effect.",
        therapy: "Evaluate further: check 1,25-OH vitamin D, consider genetic testing if PTH resistance suspected. Treat with calcium + active vitamin D.",
      });
    }
  }

  return findings;
}

// ══════════════════════════════════════════════
// Safety rules
// ══════════════════════════════════════════════

const SAFETY_RULES = [
  {
    icon: <ShieldAlert className="h-4 w-4" />,
    title: "Treat Symptomatic Hypocalcemia Promptly",
    detail: "Start IV calcium immediately if severe symptoms (seizure, tetany, laryngospasm) or ECG changes (QT prolongation, arrhythmia) are present. Do not wait for lab confirmation.",
    color: "text-red-500",
    bg: "bg-red-500/5",
    border: "border-red-500/20",
  },
  {
    icon: <Activity className="h-4 w-4" />,
    title: "Correct Magnesium First",
    detail: "Measure and replete magnesium in all unexplained or refractory cases. Hypomagnesemia impairs PTH secretion and end-organ response — calcium may remain low until Mg is corrected.",
    color: "text-amber-500",
    bg: "bg-amber-500/5",
    border: "border-amber-500/20",
  },
  {
    icon: <Clock className="h-4 w-4" />,
    title: "Monitoring Frequency",
    detail: "Unstable / IV therapy: monitor ECG and calcium q6h initially, then daily once stable. Oral therapy: monitor calcium and PTH periodically.",
    color: "text-orange-500",
    bg: "bg-orange-500/5",
    border: "border-orange-500/20",
  },
  {
    icon: <AlertTriangle className="h-4 w-4" />,
    title: "Do Not Delay Acute Treatment",
    detail: "Obtain labs (Mg, phosphate, PTH, vitamin D, Cr) but do not wait for results if the patient is symptomatic. Start IV calcium immediately for severe presentations.",
    color: "text-purple-500",
    bg: "bg-purple-500/5",
    border: "border-purple-500/20",
  },
];

// ══════════════════════════════════════════════
// Cause-specific therapy plans
// ══════════════════════════════════════════════

const CAUSE_THERAPIES = [
  {
    title: "Hypoparathyroidism",
    therapy: "Oral calcium + calcitriol (0.25–1 mcg/d) or alfacalcidol. Titrate to maintain low-normal serum Ca. Avoid thiazides if hypercalciuria.",
    icon: <Brain className="h-4 w-4" />,
  },
  {
    title: "Vitamin D Deficiency",
    therapy: "Vitamin D repletion (cholecalciferol 50,000 IU weekly × 8 weeks, then 800–2000 IU/d maintenance) + oral calcium supplements.",
    icon: <FlaskConical className="h-4 w-4" />,
  },
  {
    title: "CKD / Hyperphosphatemia",
    therapy: "Manage hyperphosphatemia (phosphate binders), calcium as needed, active vitamin D (calcitriol or paricalcitol). Monitor Ca × Phos product.",
    icon: <HeartPulse className="h-4 w-4" />,
  },
  {
    title: "Post-Thyroidectomy / Bone Hungry",
    therapy: "Calcium replacement (IV if severe, then PO) + monitoring + active vitamin D (calcitriol). May require high doses initially. Check Mg and replete.",
    icon: <Syringe className="h-4 w-4" />,
  },
  {
    title: "Drug-Related",
    therapy: "Stop or modify causative agent (cinacalcet, bisphosphonates, denosumab, loop diuretics). Provide calcium supplementation as needed. Monitor for rebound hypercalcemia with denosumab.",
    icon: <Pill className="h-4 w-4" />,
  },
];

// ══════════════════════════════════════════════
// Component
// ══════════════════════════════════════════════

export default function Hypocalcemia() {
  // ── Step 1: Confirm hypocalcemia ──
  const [totalCalcium, setTotalCalcium] = useState("");
  const [albumin, setAlbumin] = useState("");
  const [ionizedCalcium, setIonizedCalcium] = useState("");
  const [confirmation, setConfirmation] = useState<ConfirmationResult>(null);

  // ── Step 2: Symptoms & ECG ──
  const [symptoms, setSymptoms] = useState<{
    seizure: boolean;
    tetany: boolean;
    laryngospasm: boolean;
    alteredMental: boolean;
    paresthesia: boolean;
    carpopedalSpasm: boolean;
    muscleCramps: boolean;
  }>({
    seizure: false,
    tetany: false,
    laryngospasm: false,
    alteredMental: false,
    paresthesia: false,
    carpopedalSpasm: false,
    muscleCramps: false,
  });
  const [ecgChanges, setEcgChanges] = useState<{
    qtProlongation: boolean;
    arrhythmia: boolean;
  }>({
    qtProlongation: false,
    arrhythmia: false,
  });

  // ── Step 3: Treatment ──
  const [treatmentRoute, setTreatmentRoute] = useState<TreatmentRoute>(null);

  // ── Step 4: Identify Cause ──
  const [magnesium, setMagnesium] = useState("");
  const [phosphate, setPhosphate] = useState("");
  const [pth, setPth] = useState<PthResult>(null);
  const [vitaminD, setVitaminD] = useState("");
  const [creatinine, setCreatinine] = useState("");
  const [causeFindings, setCauseFindings] = useState<{ title: string; description: string; therapy: string }[]>([]);

  // ── UI state ──
  const [expandedSection, setExpandedSection] = useState<string | null>("step1");

  // ── Computed corrected calcium ──
  const correctedCa = useMemo(() => {
    const ca = parseFloat(totalCalcium);
    const alb = parseFloat(albumin);
    if (!isNaN(ca) && !isNaN(alb)) {
      return correctedCalcium(ca, alb).toFixed(2);
    }
    return null;
  }, [totalCalcium, albumin]);

  // ── Step progression ──
  const steps: StepState = useMemo(() => {
    const hasSevereSymptoms = symptoms.seizure || symptoms.tetany || symptoms.laryngospasm || symptoms.alteredMental;
    const hasAnySymptoms = hasSevereSymptoms || symptoms.paresthesia || symptoms.carpopedalSpasm || symptoms.muscleCramps;
    const hasEcg = ecgChanges.qtProlongation || ecgChanges.arrhythmia;

    return {
      step1_complete: confirmation === "true_hypocalcemia",
      step2_complete: hasAnySymptoms || hasEcg || false,
      step3_complete: treatmentRoute !== null,
      step4_complete: causeFindings.length > 0,
      step5_complete: false, // informational, always accessible
    };
  }, [confirmation, symptoms, ecgChanges, treatmentRoute, causeFindings]);

  // ── Determine symptom severity ──
  const symptomSeverity: SymptomSeverity = useMemo(() => {
    const severe = symptoms.seizure || symptoms.tetany || symptoms.laryngospasm || symptoms.alteredMental;
    const ecg = ecgChanges.qtProlongation || ecgChanges.arrhythmia;
    if (severe || ecg) return "severe";
    const moderate = symptoms.paresthesia || symptoms.carpopedalSpasm || symptoms.muscleCramps;
    if (moderate) return "moderate";
    return "mild_asymptomatic";
  }, [symptoms, ecgChanges]);

  // ── Auto-determine treatment route ──
  const autoTreatmentRoute = useMemo(() => {
    const severe = symptoms.seizure || symptoms.tetany || symptoms.laryngospasm || symptoms.alteredMental;
    const ecg = ecgChanges.qtProlongation || ecgChanges.arrhythmia;
    if (severe || ecg) return "iv_calcium" as TreatmentRoute;
    return "oral_calcium" as TreatmentRoute;
  }, [symptoms, ecgChanges]);

  // ── Treatment plan ──
  const treatmentPlan = useMemo(() => {
    if (!treatmentRoute) return null;
    return getTreatmentPlan(symptomSeverity, 
      (["qt_prolongation", "arrhythmia"] as EcgChange[]).filter(
        (e) => (e === "qt_prolongation" && ecgChanges.qtProlongation) || (e === "arrhythmia" && ecgChanges.arrhythmia)
      )
    );
  }, [treatmentRoute, symptomSeverity, ecgChanges]);

  // ── Step 1: Confirm hypocalcemia ──
  const analyzeCalcium = () => {
    const ionized = parseFloat(ionizedCalcium);
    
    if (!isNaN(ionized)) {
      if (ionized < 1.15) {
        setConfirmation("true_hypocalcemia");
        toast.success("✓ Ionized calcium low — true hypocalcemia confirmed. Proceed to symptom assessment.");
        setExpandedSection("step2");
      } else {
        setConfirmation("not_hypocalcemia");
        toast.warning("Ionized calcium normal — this is not true hypocalcemia. Check total calcium and albumin for discrepancy.");
      }
      return;
    }

    const ca = parseFloat(totalCalcium);
    const alb = parseFloat(albumin);
    if (!isNaN(ca) && !isNaN(alb)) {
      const corrected = correctedCalcium(ca, alb);
      if (corrected < 2.1) {
        setConfirmation("true_hypocalcemia");
        toast.success(`✓ Corrected calcium ${corrected.toFixed(2)} mmol/L — hypocalcemia confirmed. Proceed to symptom assessment.`);
        setExpandedSection("step2");
      } else {
        setConfirmation("not_hypocalcemia");
        toast.warning(`Corrected calcium ${corrected.toFixed(2)} mmol/L — normal range. Not hypocalcemia.`);
      }
      return;
    }

    toast.error("Enter ionized calcium OR (total calcium + albumin) to assess");
  };

  // ── Step 4: Analyze cause ──
  const analyzeCause = () => {
    const mg = parseFloat(magnesium);
    const phos = parseFloat(phosphate);
    const vitD = parseFloat(vitaminD);
    const cr = parseFloat(creatinine);

    if (pth === null) {
      toast.error("Select PTH result to interpret the cause");
      return;
    }

    const findings = identifyCause(
      isNaN(mg) ? null : mg,
      isNaN(phos) ? null : phos,
      pth,
      isNaN(vitD) ? null : vitD,
      isNaN(cr) ? null : cr
    );

    if (findings.length === 0) {
      toast.error("Enter lab values (Mg, phosphate, vitamin D, Cr) to identify the cause");
      return;
    }

    setCauseFindings(findings);
    toast.success(`Cause identified: ${findings[0].title}`);
    setExpandedSection("step5");
  };

  // ── Clinical note generation ──
  const generateNote = () => {
    const lines: string[] = [
      "═══ Hypocalcemia Clinical Summary ═══",
      `Total Calcium: ${totalCalcium || "—"} mmol/L`,
      `Albumin: ${albumin || "—"} g/dL`,
      `Corrected Calcium: ${correctedCa || "—"} mmol/L`,
      `Ionized Calcium: ${ionizedCalcium || "—"} mmol/L`,
      "",
    ];

    if (confirmation) {
      lines.push(`Confirmation: ${confirmation === "true_hypocalcemia" ? "TRUE hypocalcemia" : "NOT hypocalcemia"}`);
      lines.push("");
    }

    if (steps.step2_complete) {
      const activeSymptoms = Object.entries(symptoms)
        .filter(([, v]) => v)
        .map(([k]) => k.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase()));
      lines.push(`Symptom Severity: ${symptomSeverity?.toUpperCase() || "?"}`);
      lines.push(`Symptoms: ${activeSymptoms.length > 0 ? activeSymptoms.join(", ") : "None"}`);
      lines.push(`ECG Changes: ${ecgChanges.qtProlongation ? "QT Prolongation" : ""}${ecgChanges.qtProlongation && ecgChanges.arrhythmia ? ", " : ""}${ecgChanges.arrhythmia ? "Arrhythmia" : "None"}`);
      lines.push("");
    }

    if (treatmentPlan && treatmentRoute) {
      lines.push(`Treatment Route: ${treatmentRoute === "iv_calcium" ? "IV Calcium" : "Oral Calcium"}`);
      lines.push(`Plan: ${treatmentPlan.title}`);
      lines.push(`Agent: ${treatmentPlan.agent}`);
      lines.push(`Dose: ${treatmentPlan.dose}`);
      lines.push(...treatmentPlan.details.map((d) => `  • ${d}`));
      lines.push("");
    }

    if (causeFindings.length > 0) {
      lines.push("Cause Identification:");
      causeFindings.forEach((f) => {
        lines.push(`  • ${f.title}`);
        lines.push(`    ${f.description}`);
        lines.push(`    Therapy: ${f.therapy}`);
      });
      lines.push("");
    }

    lines.push("═══ Safety Reminders ═══");
    lines.push("1. Treat symptomatic hypocalcemia promptly — start IV if severe or ECG changes");
    lines.push("2. Correct magnesium — measure and replete in all unexplained/refractory cases");
    lines.push("3. Monitor ECG and calcium q6h initially for unstable/IV therapy, then daily");
    lines.push("4. Do not delay acute treatment — obtain labs but don't wait for results if symptomatic");

    return lines.join("\n");
  };

  const copyNote = () => {
    navigator.clipboard.writeText(generateNote());
    toast.success("Note copied to clipboard");
  };

  const downloadNote = () => {
    downloadTextFile(generateNote(), `hypocalcemia-summary-${Date.now()}.txt`);
    toast.success("Note downloaded");
  };

  // ── Reset ──
  const resetAll = () => {
    setTotalCalcium("");
    setAlbumin("");
    setIonizedCalcium("");
    setConfirmation(null);
    setSymptoms({
      seizure: false,
      tetany: false,
      laryngospasm: false,
      alteredMental: false,
      paresthesia: false,
      carpopedalSpasm: false,
      muscleCramps: false,
    });
    setEcgChanges({ qtProlongation: false, arrhythmia: false });
    setTreatmentRoute(null);
    setMagnesium("");
    setPhosphate("");
    setPth(null);
    setVitaminD("");
    setCreatinine("");
    setCauseFindings([]);
    setExpandedSection("step1");
    toast.info("Reset complete");
  };

  // ── Toggle symptom checkbox ──
  const toggleSymptom = (key: keyof typeof symptoms) => {
    setSymptoms((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleEcg = (key: keyof typeof ecgChanges) => {
    setEcgChanges((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Droplets className="h-6 w-6 text-blue-400" />
            Hypocalcemia Decision Support
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
          Step 2: Symptoms & ECG
        </Badge>
        <ChevronRight className="h-3 w-3" />
        <Badge variant={steps.step3_complete ? "default" : "outline"}>
          Step 3: Treatment
        </Badge>
        <ChevronRight className="h-3 w-3" />
        <Badge variant={steps.step4_complete ? "default" : "outline"}>
          Step 4: Cause
        </Badge>
        <ChevronRight className="h-3 w-3" />
        <Badge variant={steps.step5_complete ? "default" : "outline"}>
          Step 5: Specific Therapy
        </Badge>
      </div>

      {/* ── STEP 1: Confirm Hypocalcemia ── */}
      <Card className="border-blue-500/20">
        <button
          onClick={() => setExpandedSection(expandedSection === "step1" ? null : "step1")}
          className="w-full text-left"
        >
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FlaskConical className="h-5 w-5 text-blue-400" />
                <CardTitle className="text-base">Step 1: Confirm Hypocalcemia</CardTitle>
              </div>
              {expandedSection === "step1" ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </div>
            <CardDescription>Use ionized calcium (preferred) or albumin-corrected total calcium to diagnose true hypocalcemia</CardDescription>
          </CardHeader>
        </button>

        {expandedSection === "step1" && (
          <CardContent className="space-y-4 pt-0">
            <div className="p-3 rounded-lg border border-blue-500/20 bg-blue-500/5 text-sm">
              <p className="font-semibold text-blue-400">Preferred: Ionized Calcium (free, bioactive)</p>
              <p className="text-xs text-muted-foreground mt-1">Normal range: 1.15–1.32 mmol/L. Alternatively, use albumin-corrected total calcium (normal: 2.1–2.6 mmol/L).</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Ionized Calcium (mmol/L) — preferred</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="e.g. 1.02"
                  value={ionizedCalcium}
                  onChange={(e) => setIonizedCalcium(e.target.value)}
                />
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">OR — Albumin-Corrected Total Calcium</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Total Calcium (mmol/L)</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="e.g. 1.8"
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
            </div>

            {correctedCa && (
              <div className="p-3 rounded-lg border border-cyan-500/20 bg-cyan-500/5 text-sm">
                <p className="font-semibold text-cyan-400">
                  Corrected Calcium = {totalCalcium} + 0.8 × (4 − {albumin}) = <span className="text-base">{correctedCa} mmol/L</span>
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Formula: total Ca + 0.8 × (4 − albumin). Normal: 2.1–2.6 mmol/L.
                </p>
              </div>
            )}

            <Button onClick={analyzeCalcium} className="w-full" disabled={!ionizedCalcium && (!totalCalcium || !albumin)}>
              Confirm Diagnosis
            </Button>

            {confirmation && (
              <div className={`p-3 rounded-lg border text-sm ${
                confirmation === "true_hypocalcemia"
                  ? "bg-green-500/5 border-green-500/20 text-green-400"
                  : "bg-amber-500/5 border-amber-500/20 text-amber-400"
              }`}>
                <p className="font-semibold">
                  {confirmation === "true_hypocalcemia"
                    ? "✓ True hypocalcemia confirmed — proceed to symptom assessment"
                    : "⚠ Not true hypocalcemia — ionized calcium is normal"}
                </p>
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {/* ── STEP 2: Symptoms & ECG ── */}
      <Card className={`border-${confirmation === "true_hypocalcemia" ? "purple" : "muted"}-500/20 ${!steps.step1_complete ? "opacity-50 pointer-events-none" : ""}`}>
        <button
          onClick={() => setExpandedSection(expandedSection === "step2" ? null : "step2")}
          className="w-full text-left"
        >
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Stethoscope className="h-5 w-5 text-purple-400" />
                <CardTitle className="text-base">Step 2: Symptoms & ECG Assessment</CardTitle>
              </div>
              {expandedSection === "step2" ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </div>
            <CardDescription>Identify severe features and ECG changes to guide treatment urgency</CardDescription>
          </CardHeader>
        </button>

        {expandedSection === "step2" && (
          <CardContent className="space-y-4 pt-0">
            {/* Severe symptoms */}
            <div>
              <Label className="mb-2 block text-sm font-semibold text-red-400">Severe Features</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {[
                  { key: "seizure" as const, label: "Seizure" },
                  { key: "tetany" as const, label: "Tetany" },
                  { key: "laryngospasm" as const, label: "Laryngospasm" },
                  { key: "alteredMental" as const, label: "Altered Mental Status" },
                ].map((s) => (
                  <Button
                    key={s.key}
                    variant={symptoms[s.key] ? "default" : "outline"}
                    size="sm"
                    className={`h-auto py-2 px-3 justify-start text-xs ${
                      symptoms[s.key] ? "bg-red-500/20 text-red-400 border-red-500/30" : ""
                    }`}
                    onClick={() => toggleSymptom(s.key)}
                  >
                    {symptoms[s.key] ? "✓ " : ""}{s.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Moderate symptoms */}
            <div>
              <Label className="mb-2 block text-sm font-semibold text-amber-400">Moderate Symptoms</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {[
                  { key: "paresthesia" as const, label: "Paresthesia" },
                  { key: "carpopedalSpasm" as const, label: "Carpopedal Spasm" },
                  { key: "muscleCramps" as const, label: "Muscle Cramps" },
                ].map((s) => (
                  <Button
                    key={s.key}
                    variant={symptoms[s.key] ? "default" : "outline"}
                    size="sm"
                    className={`h-auto py-2 px-3 justify-start text-xs ${
                      symptoms[s.key] ? "bg-amber-500/20 text-amber-400 border-amber-500/30" : ""
                    }`}
                    onClick={() => toggleSymptom(s.key)}
                  >
                    {symptoms[s.key] ? "✓ " : ""}{s.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* ECG changes */}
            <Separator />
            <div>
              <Label className="mb-2 block text-sm font-semibold flex items-center gap-2">
                <HeartPulse className="h-4 w-4 text-red-400" />
                ECG Changes
              </Label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { key: "qtProlongation" as const, label: "QT Prolongation" },
                  { key: "arrhythmia" as const, label: "Arrhythmia" },
                ].map((e) => (
                  <Button
                    key={e.key}
                    variant={ecgChanges[e.key] ? "default" : "outline"}
                    size="sm"
                    className={`h-auto py-2 px-3 justify-start text-xs ${
                      ecgChanges[e.key] ? "bg-red-500/20 text-red-400 border-red-500/30" : ""
                    }`}
                    onClick={() => toggleEcg(e.key)}
                  >
                    {ecgChanges[e.key] ? "✓ " : ""}{e.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Summary */}
            {(symptomSeverity !== "mild_asymptomatic" || ecgChanges.qtProlongation || ecgChanges.arrhythmia) && (
              <div className={`p-3 rounded-lg border text-sm ${
                symptomSeverity === "severe" || ecgChanges.qtProlongation || ecgChanges.arrhythmia
                  ? "bg-red-500/5 border-red-500/20 text-red-400"
                  : "bg-amber-500/5 border-amber-500/20 text-amber-400"
              }`}>
                <p className="font-semibold">
                  {symptomSeverity === "severe" || ecgChanges.qtProlongation || ecgChanges.arrhythmia
                    ? "⚠ Severe presentation — IV calcium indicated"
                    : symptomSeverity === "moderate"
                    ? "Moderate symptoms — assess need for IV vs oral based on rapidity of drop and ECG"
                    : "Mild/asymptomatic — oral calcium appropriate if gut function intact"}
                </p>
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {/* ── STEP 3: Treatment Route ── */}
      <Card className={`border-${treatmentRoute ? "green" : "rose"}-500/20 ${!steps.step2_complete ? "opacity-50 pointer-events-none" : ""}`}>
        <button
          onClick={() => setExpandedSection(expandedSection === "step3" ? null : "step3")}
          className="w-full text-left"
        >
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Syringe className="h-5 w-5 text-rose-400" />
                <CardTitle className="text-base">Step 3: Treatment Route</CardTitle>
              </div>
              {expandedSection === "step3" ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </div>
            <CardDescription>Select treatment route based on symptom severity and ECG findings</CardDescription>
          </CardHeader>
        </button>

        {expandedSection === "step3" && (
          <CardContent className="space-y-4 pt-0">
            {/* Route selection */}
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant={treatmentRoute === "iv_calcium" ? "default" : "outline"}
                className={`h-auto py-4 ${treatmentRoute === "iv_calcium" ? "bg-red-500/20 text-red-400 border-red-500/30" : ""}`}
                onClick={() => setTreatmentRoute("iv_calcium")}
              >
                <div className="text-center">
                  <div className="text-xs font-semibold mb-1">IV CALCIUM</div>
                  <div className="text-[10px] text-muted-foreground">Severe symptoms / ECG changes / rapid drop</div>
                </div>
              </Button>
              <Button
                variant={treatmentRoute === "oral_calcium" ? "default" : "outline"}
                className={`h-auto py-4 ${treatmentRoute === "oral_calcium" ? "bg-green-500/20 text-green-400 border-green-500/30" : ""}`}
                onClick={() => setTreatmentRoute("oral_calcium")}
              >
                <div className="text-center">
                  <div className="text-xs font-semibold mb-1">ORAL CALCIUM</div>
                  <div className="text-[10px] text-muted-foreground">Mild / asymptomatic + intact gut function</div>
                </div>
              </Button>
            </div>

            {/* Auto-suggestion */}
            <div className="p-2 rounded-lg border border-blue-500/20 bg-blue-500/5 text-xs text-blue-400">
              Based on your symptom selection: <strong>{autoTreatmentRoute === "iv_calcium" ? "IV calcium recommended" : "Oral calcium recommended"}</strong>
            </div>

            {/* Treatment plan output */}
            {treatmentPlan && (
              <div className="space-y-3">
                <Separator />
                <div className="p-4 rounded-lg border border-green-500/20 bg-green-500/5">
                  <h3 className="text-base font-bold text-green-400 mb-2 flex items-center gap-2">
                    <Pill className="h-5 w-5" />
                    {treatmentPlan.title}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                    <div className="p-2 rounded bg-card/50 border border-border">
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Route</div>
                      <div className="font-semibold text-sm">{treatmentPlan.route}</div>
                    </div>
                    <div className="p-2 rounded bg-card/50 border border-border">
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Agent</div>
                      <div className="font-semibold text-sm">{treatmentPlan.agent}</div>
                    </div>
                    <div className="p-2 rounded bg-card/50 border border-border">
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Dose</div>
                      <div className="font-semibold text-sm">{treatmentPlan.dose}</div>
                    </div>
                  </div>
                  <ul className="space-y-1">
                    {treatmentPlan.details.map((d, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <span className="text-green-400 mt-0.5">•</span>
                        {d}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {/* ── STEP 4: Identify Cause ── */}
      <Card className={`border-cyan-500/20 ${!steps.step3_complete ? "opacity-50 pointer-events-none" : ""}`}>
        <button
          onClick={() => setExpandedSection(expandedSection === "step4" ? null : "step4")}
          className="w-full text-left"
        >
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FlaskConical className="h-5 w-5 text-cyan-400" />
                <CardTitle className="text-base">Step 4: Identify the Cause</CardTitle>
              </div>
              {expandedSection === "step4" ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </div>
            <CardDescription>Required tests: Mg, phosphate, PTH, 25-OH vitamin D, Cr — interpret using the diagnostic algorithm</CardDescription>
          </CardHeader>
        </button>

        {expandedSection === "step4" && (
          <CardContent className="space-y-4 pt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label>Magnesium (mmol/L)</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="e.g. 0.65"
                  value={magnesium}
                  onChange={(e) => setMagnesium(e.target.value)}
                />
                <p className="text-[10px] text-muted-foreground">Normal: 0.75–1.05</p>
              </div>
              <div className="space-y-2">
                <Label>Phosphate (mg/dL)</Label>
                <Input
                  type="number"
                  step="0.1"
                  placeholder="e.g. 3.5"
                  value={phosphate}
                  onChange={(e) => setPhosphate(e.target.value)}
                />
                <p className="text-[10px] text-muted-foreground">Normal: 2.5–4.5</p>
              </div>
              <div className="space-y-2">
                <Label>PTH</Label>
                <div className="grid grid-cols-3 gap-1">
                  {(["low", "normal", "high"] as const).map((v) => (
                    <Button
                      key={v}
                      variant={pth === v ? "default" : "outline"}
                      size="sm"
                      className={`text-xs ${
                        pth === v
                          ? v === "low" ? "bg-blue-500/20 text-blue-400" :
                            v === "high" ? "bg-red-500/20 text-red-400" :
                            "bg-muted"
                          : ""
                      }`}
                      onClick={() => setPth(v)}
                    >
                      {v.charAt(0).toUpperCase() + v.slice(1)}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label>25-OH Vitamin D (ng/mL)</Label>
                <Input
                  type="number"
                  step="1"
                  placeholder="e.g. 18"
                  value={vitaminD}
                  onChange={(e) => setVitaminD(e.target.value)}
                />
                <p className="text-[10px] text-muted-foreground">Normal: &gt;30</p>
              </div>
              <div className="space-y-2">
                <Label>Creatinine (mg/dL)</Label>
                <Input
                  type="number"
                  step="0.1"
                  placeholder="e.g. 0.9"
                  value={creatinine}
                  onChange={(e) => setCreatinine(e.target.value)}
                />
                <p className="text-[10px] text-muted-foreground">Normal: &lt;1.2</p>
              </div>
            </div>

            {/* Diagnostic algorithm reference */}
            <div className="p-3 rounded-lg border border-cyan-500/20 bg-cyan-500/5 text-xs space-y-1">
              <p className="font-semibold text-cyan-400 mb-1">Diagnostic Algorithm:</p>
              <p>a) If hypomagnesemia → correct Mg first (Ca may remain low until Mg corrected)</p>
              <p>b) If PTH low/inappropriately normal → hypoparathyroidism / PTH suppression</p>
              <p>c) If PTH high → vitamin D deficiency or CKD or PTH resistance</p>
              <p>d) If phosphate high + PTH low → hypoparathyroidism</p>
              <p>e) If phosphate low + PTH high → vitamin D deficiency</p>
            </div>

            <Button onClick={analyzeCause} className="w-full" disabled={pth === null}>
              Identify Cause
            </Button>

            {causeFindings.length > 0 && (
              <div className="space-y-3">
                {causeFindings.map((finding, i) => (
                  <div key={i} className="p-3 rounded-lg border border-green-500/20 bg-green-500/5">
                    <h4 className="text-sm font-semibold text-green-400 mb-1">{finding.title}</h4>
                    <p className="text-xs text-muted-foreground mb-2">{finding.description}</p>
                    <div className="p-2 rounded bg-card/50 border border-border text-xs">
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Therapy: </span>
                      <span className="font-medium">{finding.therapy}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {/* ── STEP 5: Cause-Specific Therapy ── */}
      <Card className={`border-emerald-500/20 ${!steps.step4_complete ? "opacity-50 pointer-events-none" : ""}`}>
        <button
          onClick={() => setExpandedSection(expandedSection === "step5" ? null : "step5")}
          className="w-full text-left"
        >
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Pill className="h-5 w-5 text-emerald-400" />
                <CardTitle className="text-base">Step 5: Cause-Specific Therapy</CardTitle>
              </div>
              {expandedSection === "step5" ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </div>
            <CardDescription>Targeted therapy based on underlying etiology — always continue acute calcium support</CardDescription>
          </CardHeader>
        </button>

        {expandedSection === "step5" && (
          <CardContent className="space-y-3 pt-0">
            {CAUSE_THERAPIES.map((therapy, i) => (
              <div key={i} className="p-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5 flex items-start gap-3">
                <span className="mt-0.5 text-emerald-400">{therapy.icon}</span>
                <div>
                  <p className="text-sm font-semibold text-emerald-400">{therapy.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">{therapy.therapy}</p>
                </div>
              </div>
            ))}
            <Separator />
            <div className="p-3 rounded-lg border border-amber-500/20 bg-amber-500/5 text-xs">
              <p className="font-semibold text-amber-400 mb-1">Drugs That Can Cause Hypocalcemia</p>
              <p className="text-muted-foreground">Cinacalcet, bisphosphonates, denosumab, loop diuretics — stop or modify the agent, provide Ca supplementation, and monitor for rebound hypercalcemia (especially with denosumab).</p>
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
            <CardDescription>Critical safety considerations for hypocalcemia management</CardDescription>
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