import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  AlertTriangle, Stethoscope, FlaskConical,
  HeartPulse, Pill, Syringe, Copy,
  Download, Clock, ShieldAlert, ChevronRight, ChevronDown,
  Calculator, Thermometer,
} from "lucide-react";
import { downloadTextFile, parseClinicalValue } from "@/lib/clinical-utils";
import { toast } from "sonner";

// ══════════════════════════════════════════════
// Types
// ══════════════════════════════════════════════

type VolumeStatus = "hypovolemic" | "euvolemic" | "hypervolemic" | null;
type Chronicity = "acute" | "chronic" | null;
type SymptomSeverity = "asymptomatic" | "moderate" | "severe" | null;
type Gender = "male" | "female" | null;
type UrineResult = "concentrated" | "partial" | "dilute" | null;

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
  "Society for Endocrinology 2018",
  "Merck Manual Professional 2025",
  "Emergency Care BC 2024",
];

const DEFINITION = "Serum Na⁺ >145 mmol/L";

// ══════════════════════════════════════════════
// Volume / urine diagnostic reference
// ══════════════════════════════════════════════

const VOLUME_DIAGNOSTICS: { volume: Exclude<VolumeStatus, null>; causes: string[] }[] = [
  {
    volume: "hypovolemic",
    causes: ["GI loss", "Renal loss", "Osmotic diuresis", "Diuretics", "DI", "Poor intake"],
  },
  {
    volume: "euvolemic",
    causes: ["Diabetes insipidus", "Insensible loss", "Inadequate water intake"],
  },
  {
    volume: "hypervolemic",
    causes: ["Hypertonic sodium load", "Iatrogenic saline", "Salt poisoning", "Positive fluid balance"],
  },
];

// ══════════════════════════════════════════════
// TBW calculation (water deficit formula)
// ══════════════════════════════════════════════

function tbw(weight: number, age: number, gender: Gender): number {
  if (age <= 60) {
    return gender === "female" ? weight * 0.5 : weight * 0.6;
  }
  return gender === "female" ? weight * 0.45 : weight * 0.5;
}

function waterDeficit(weight: number, age: number, gender: Gender, serumNa: number): number {
  const bodyWater = tbw(weight, age, gender);
  return bodyWater * ((serumNa / 140) - 1);
}

// ══════════════════════════════════════════════
// Treatment recommendations
// ══════════════════════════════════════════════

interface TreatmentPlan {
  title: string;
  agent: string;
  dose: string;
  maxCorrection: string;
  details: string[];
}

function getTreatmentPlan(
  severity: SymptomSeverity,
  volume: VolumeStatus,
  chronicity: Chronicity,
  urineResult: UrineResult
): TreatmentPlan | null {
  // Severe symptomatic — irrespective of volume/chronicity
  if (severity === "severe") {
    return {
      title: "Severely Symptomatic — Emergency Correction",
      agent: "0.9% NaCl (if shock) → D5W or 0.45% NaCl",
      dose: "Up to 1 mmol/L/h if severely symptomatic",
      maxCorrection: "Acute: up to 10–12 mmol/L/24 h",
      details: [
        "Indications: seizures, coma, marked encephalopathy",
        "If hypovolemic shock: 0.9% NaCl 20 mL/kg bolus over 30–60 min first",
        "Then switch to D5W or 0.45% NaCl for free water replacement",
        "Correction rate: up to 1 mmol/L/hour if severely symptomatic",
        "Do NOT exceed 10–12 mmol/L in 24 h",
        "Monitor q1–2h serum Na⁺ during active correction",
        "Treat underlying cause: stop sodium load, manage DI, etc.",
      ],
    };
  }

  // Urine suggests DI
  if (urineResult === "dilute" && volume !== "hypervolemic") {
    return {
      title: "Diabetes Insipidus — Suspected",
      agent: "D5W or 0.45% NaCl + desmopressin workup",
      dose: "Water deficit + specific DI management",
      maxCorrection: "Chronic: 0.4–0.5 mmol/L/h; max 8–10/24 h",
      details: [
        "UOsm <300 suggests DI — differentiate central vs nephrogenic",
        "Central DI: desmopressin 1–2 µg IV/SC q8–12h",
        "Nephrogenic DI: treat cause, thiazide ± low solute diet ± NSAIDs",
        "Replace free water with D5W or 0.45% NaCl at calculated deficit rate",
        "Chronic correction rate: 0.4–0.5 mmol/L/h",
        "Do NOT exceed 8–10 mmol/L in 24 h",
      ],
    };
  }

  // Base on volume status
  if (volume === "hypovolemic") {
    return {
      title: "Hypovolemic Hypernatremia — Fluid Resuscitation",
      agent: "0.9% NaCl (initial) → D5W or 0.45% NaCl",
      dose: chronicity === "acute" ? "0.5–1 mmol/L/h" : "0.4–0.5 mmol/L/h",
      maxCorrection: chronicity === "acute" ? "≤10–12 mmol/L/24 h" : "≤8–10 mmol/L/24 h",
      details: [
        "First restore perfusion with isotonic saline if hypotensive",
        "Then replace free water deficit with D5W or 0.45% NaCl",
        `Target correction: ${chronicity === "acute" ? "0.5–1 mmol/L/h" : "0.4–0.5 mmol/L/h"}`,
        `Max 24h: ${chronicity === "acute" ? "10–12" : "8–10"} mmol/L`,
        "Use water deficit formula to guide replacement volume",
        "Replace ½ the deficit over first 24h, remainder over next 24–48h",
        "Treat underlying cause: GI losses, diuretics, osmotic diuresis",
      ],
    };
  }

  if (volume === "euvolemic") {
    return {
      title: "Euvolemic Hypernatremia — Free Water Replacement",
      agent: "D5W or 0.45% NaCl or enteral water",
      dose: chronicity === "acute" ? "0.5–1 mmol/L/h" : "0.4–0.5 mmol/L/h",
      maxCorrection: chronicity === "acute" ? "≤10–12 mmol/L/24 h" : "≤8–10 mmol/L/24 h",
      details: [
        "Replace free water deficit with D5W, 0.45% NaCl, or enteral water",
        `Target correction: ${chronicity === "acute" ? "0.5–1 mmol/L/h" : "0.4–0.5 mmol/L/h"}`,
        `Max 24h: ${chronicity === "acute" ? "10–12" : "8–10"} mmol/L`,
        "Assess for diabetes insipidus (especially if UOsm <300)",
        "Check insensible losses: fever, tachypnea, burns",
        "Monitor q2–4h serum Na⁺ initially",
      ],
    };
  }

  if (volume === "hypervolemic") {
    return {
      title: "Hypervolemic Hypernatremia — D5W + Loop Diuretic",
      agent: "D5W + loop diuretic (furosemide)",
      dose: chronicity === "acute" ? "0.5–1 mmol/L/h" : "0.4–0.5 mmol/L/h",
      maxCorrection: chronicity === "acute" ? "≤10–12 mmol/L/24 h" : "≤8–10 mmol/L/24 h",
      details: [
        "Goal: replace free water while removing excess sodium",
        "Give D5W + loop diuretic (furosemide 20–40 mg IV)",
        "Monitor urine output and serum Na⁺ closely",
        "Stop iatrogenic sodium sources (hypertonic saline, NaHCO₃)",
        `Target correction: ${chronicity === "acute" ? "0.5–1 mmol/L/h" : "0.4–0.5 mmol/L/h"}`,
        `Max 24h: ${chronicity === "acute" ? "10–12" : "8–10"} mmol/L`,
        "Treat underlying: review IVF orders, check for salt poisoning",
      ],
    };
  }

  return null;
}

// ══════════════════════════════════════════════
// Safety rules
// ══════════════════════════════════════════════

const SAFETY_RULES = [
  {
    icon: <HeartPulse className="h-4 w-4" />,
    title: "Restore Perfusion First in Shock",
    detail: "Use isotonic saline (0.9% NaCl) to restore perfusion before switching to hypotonic fluids for free water replacement.",
    color: "text-red-500",
    bg: "bg-red-500/5",
    border: "border-red-500/20",
  },
  {
    icon: <ShieldAlert className="h-4 w-4" />,
    title: "Avoid Rapid Overcorrection",
    detail: "Chronic hypernatremia: limit to 0.4–0.5 mmol/L/h, max 8–10 mmol/L/24 h. Acute: up to 1 mmol/L/h, max 10–12 mmol/L/24 h.",
    color: "text-amber-500",
    bg: "bg-amber-500/5",
    border: "border-amber-500/20",
  },
  {
    icon: <Clock className="h-4 w-4" />,
    title: "Monitor I/O & Neurological Status",
    detail: "Serum Na⁺ q2–4h initially; frequent reassessment of neuro status (mental state, seizures, weakness).",
    color: "text-cyan-500",
    bg: "bg-cyan-500/5",
    border: "border-cyan-500/20",
  },
  {
    icon: <HeartPulse className="h-4 w-4" />,
    title: "Treat Underlying Cause",
    detail: "Identify and treat: diabetes insipidus (central vs nephrogenic), osmotic diuresis (hyperglycemia), GI losses, iatrogenic sodium load.",
    color: "text-purple-500",
    bg: "bg-purple-500/5",
    border: "border-purple-500/20",
  },
];

// ══════════════════════════════════════════════
// Component
// ══════════════════════════════════════════════

export default function Hypernatremia() {
  // ── Step 1: Confirm true hypernatremia ──
  const [serumNa, setSerumNa] = useState("");
  const [serumOsm, setSerumOsm] = useState("");
  const [glucose, setGlucose] = useState("");
  const [confirmed, setConfirmed] = useState<boolean | null>(null);

  // ── Step 2: Chronicity & volume ──
  const [chronicity, setChronicity] = useState<Chronicity>(null);
  const [volumeStatus, setVolumeStatus] = useState<VolumeStatus>(null);

  // ── Step 3: Urine studies ──
  const [urineOsm, setUrineOsm] = useState("");
  const [urineNa, setUrineNa] = useState("");
  const [urineResult, setUrineResult] = useState<UrineResult>(null);

  // ── Step 4: Treatment ──
  const [symptomSeverity, setSymptomSeverity] = useState<SymptomSeverity>(null);

  // ── Water deficit calculator ──
  const [weight, setWeight] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState<Gender>(null);

  // ── UI state ──
  const [expandedSection, setExpandedSection] = useState<string | null>("step1");

  // ── Step progression ──
  const steps: StepState = useMemo(() => ({
    step1_complete: confirmed === true,
    step2_complete: volumeStatus !== null && chronicity !== null,
    step3_complete: urineResult !== null,
    step4_complete: symptomSeverity !== null,
  }), [confirmed, volumeStatus, chronicity, urineResult, symptomSeverity]);

  // ── Auto-analyze step 1 ──
  const analyzeHypernatremia = () => {
    const na = parseFloat(serumNa);
    const osm = parseFloat(serumOsm);
    if (isNaN(na) || isNaN(osm)) {
      toast.error("Enter valid serum Na⁺ and osmolality values");
      return;
    }
    if (na <= 145) {
      setConfirmed(false);
      toast.error(`Na⁺ ${na} ≤145 — this is not hypernatremia`);
      return;
    }
    if (osm > 295) {
      setConfirmed(true);
      toast.success("True hypernatremia with hyperosmolality confirmed. Proceed to chronicity & volume assessment.");
      setExpandedSection("step2");
    } else {
      setConfirmed(false);
      toast.warning("Osmolality ≤295 with elevated Na⁺ — recheck for lab artifact or mixed disorder. Exclude pseudohypernatremia.");
    }
  };

  // ── Analyze urine studies ──
  const analyzeUrine = () => {
    const uOsm = parseFloat(urineOsm);
    const uNa = parseFloat(urineNa);
    if (isNaN(uOsm) || isNaN(uNa)) {
      toast.error("Enter valid urine osmolality and urine sodium");
      return;
    }

    if (uOsm >= 600) {
      setUrineResult("concentrated");
      toast.success("Urine concentrated (≥600) — appropriate renal concentration. Extrarenal water loss or poor intake.");
      setExpandedSection("step4");
    } else if (uOsm >= 300) {
      setUrineResult("partial");
      toast.info("Urine 300–600 mOsm/kg — partial DI or mixed state. Consider water deprivation test if unclear.");
      setExpandedSection("step4");
    } else {
      setUrineResult("dilute");
      toast.warning("Urine <300 mOsm/kg — impaired concentration. Suspect central or nephrogenic diabetes insipidus.");
      setExpandedSection("step4");
    }
  };

  // ── Water deficit calculation ──
  const deficitResult = useMemo(() => {
    const na = parseFloat(serumNa || "0");
    const w = parseFloat(weight);
    const a = parseFloat(age);
    if (!na || !w || !a || !gender) return null;
    const deficit = waterDeficit(w, a, gender, na);
    return { deficit, tbw: tbw(w, a, gender) };
  }, [serumNa, weight, age, gender]);

  // ── Treatment plan ──
  const treatmentPlan = useMemo(() => {
    if (!symptomSeverity || !volumeStatus) return null;
    return getTreatmentPlan(symptomSeverity, volumeStatus, chronicity, urineResult);
  }, [symptomSeverity, volumeStatus, chronicity, urineResult]);

  // ── Clinical note generation ──
  const generateNote = () => {
    const lines: string[] = [
      "═══ Hypernatremia Clinical Summary ═══",
      `Serum Na⁺: ${serumNa || "—"} mmol/L`,
      `Serum Osmolality: ${serumOsm || "—"} mOsm/kg → ${confirmed === true ? "HYPEROSMOLAR" : confirmed === false ? "NOT HYPERNATREMIA" : "?"}`,
      `Glucose: ${glucose || "—"} mg/dL`,
      "",
    ];
    if (steps.step2_complete) {
      lines.push(`Chronicity: ${chronicity?.toUpperCase() || "?"}`);
      lines.push(`Volume Status: ${volumeStatus?.toUpperCase() || "?"}`);
      lines.push("");
    }
    if (steps.step3_complete) {
      lines.push(`Urine Osmolality: ${urineOsm || "—"} mOsm/kg → ${urineResult?.toUpperCase() || "?"}`);
      lines.push(`Urine Sodium: ${urineNa || "—"} mEq/L`);
      lines.push("");
    }
    if (steps.step4_complete && treatmentPlan) {
      lines.push(`Symptom Severity: ${symptomSeverity?.toUpperCase() || "?"}`);
      lines.push(`Treatment: ${treatmentPlan.title}`);
      lines.push(`Agent: ${treatmentPlan.agent}`);
      lines.push(`Dose: ${treatmentPlan.dose}`);
      lines.push(`Correction target: ${treatmentPlan.maxCorrection}`);
      lines.push(...treatmentPlan.details.map(d => `  • ${d}`));
    }
    if (deficitResult) {
      lines.push("");
      lines.push(`Water Deficit: ${deficitResult.deficit.toFixed(1)} L`);
      lines.push(`TBW: ${deficitResult.tbw.toFixed(1)} L`);
    }
    return lines.join("\n");
  };

  const copyNote = () => {
    navigator.clipboard.writeText(generateNote());
    toast.success("Note copied to clipboard");
  };

  const downloadNote = () => {
    downloadTextFile(generateNote(), `hypernatremia-summary-${Date.now()}.txt`);
    toast.success("Note downloaded");
  };

  // ── Reset ──
  const resetAll = () => {
    setSerumNa("");
    setSerumOsm("");
    setGlucose("");
    setConfirmed(null);
    setChronicity(null);
    setVolumeStatus(null);
    setUrineOsm("");
    setUrineNa("");
    setUrineResult(null);
    setSymptomSeverity(null);
    setWeight("");
    setAge("");
    setGender(null);
    setExpandedSection("step1");
    toast.info("Reset complete");
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Thermometer className="h-6 w-6 text-orange-400" />
            Hypernatremia Decision Support
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
          Step 2: Volume
        </Badge>
        <ChevronRight className="h-3 w-3" />
        <Badge variant={steps.step3_complete ? "default" : "outline"}>
          Step 3: Urine
        </Badge>
        <ChevronRight className="h-3 w-3" />
        <Badge variant={steps.step4_complete ? "default" : "outline"}>
          Step 4: Treatment
        </Badge>
      </div>

      {/* ── STEP 1: Confirm True Hypernatremia ── */}
      <Card className="border-orange-500/20">
        <button
          onClick={() => setExpandedSection(expandedSection === "step1" ? null : "step1")}
          className="w-full text-left"
        >
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FlaskConical className="h-5 w-5 text-orange-400" />
                <CardTitle className="text-base">Step 1: Confirm True Hypernatremia</CardTitle>
              </div>
              {expandedSection === "step1" ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </div>
            <CardDescription>Check serum osmolality to confirm true hypernatremia vs artifact or mixed disorder</CardDescription>
          </CardHeader>
        </button>

        {expandedSection === "step1" && (
          <CardContent className="space-y-4 pt-0">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Serum Na⁺ (mmol/L)</Label>
                <Input
                  type="number"
                  step="0.1"
                  placeholder="e.g. 158"
                  value={serumNa}
                  onChange={(e) => setSerumNa(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Serum Osmolality (mOsm/kg)</Label>
                <Input
                  type="number"
                  placeholder="e.g. 320"
                  value={serumOsm}
                  onChange={(e) => setSerumOsm(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Glucose (mg/dL, optional)</Label>
                <Input
                  type="number"
                  placeholder="e.g. 180"
                  value={glucose}
                  onChange={(e) => setGlucose(e.target.value)}
                />
              </div>
            </div>

            <Button onClick={analyzeHypernatremia} className="w-full" disabled={!serumNa || !serumOsm}>
              Confirm Hypernatremia
            </Button>

            {confirmed !== null && (
              <div className={`p-3 rounded-lg border text-sm ${
                confirmed
                  ? "bg-green-500/5 border-green-500/20 text-green-400"
                  : "bg-amber-500/5 border-amber-500/20 text-amber-400"
              }`}>
                <p className="font-semibold">
                  {confirmed
                    ? "✓ True hypernatremia with hyperosmolality confirmed"
                    : "⚠ Not consistent with true hypernatremia — recheck Na⁺, osmolality, exclude lab artifact / pseudohypernatremia"}
                </p>
                {confirmed && glucose && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Glucose: {glucose} mg/dL — consider osmotic contribution
                  </p>
                )}
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {/* ── STEP 2: Chronicity & Volume Status ── */}
      <Card className={`border-${volumeStatus ? "green" : "purple"}-500/20 ${!steps.step1_complete ? "opacity-50 pointer-events-none" : ""}`}>
        <button
          onClick={() => setExpandedSection(expandedSection === "step2" ? null : "step2")}
          className="w-full text-left"
        >
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Stethoscope className="h-5 w-5 text-purple-400" />
                <CardTitle className="text-base">Step 2: Chronicity &amp; Volume Status</CardTitle>
              </div>
              {expandedSection === "step2" ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </div>
            <CardDescription>Determine onset duration and clinical volume status — guides correction rate and fluid choice</CardDescription>
          </CardHeader>
        </button>

        {expandedSection === "step2" && (
          <CardContent className="space-y-4 pt-0">
            {/* Chronicity */}
            <div>
              <Label className="mb-2 block">Chronicity</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant={chronicity === "acute" ? "default" : "outline"}
                  onClick={() => setChronicity("acute")}
                  className={chronicity === "acute" ? "bg-orange-500 hover:bg-orange-600" : ""}
                >
                  <div className="text-center">
                    <div className="text-sm font-semibold">Acute (&lt;48 h)</div>
                    <div className="text-[10px] text-muted-foreground">Up to 1 mmol/L/h correction</div>
                  </div>
                </Button>
                <Button
                  variant={chronicity === "chronic" ? "default" : "outline"}
                  onClick={() => setChronicity("chronic")}
                  className={chronicity === "chronic" ? "bg-amber-500 hover:bg-amber-600" : ""}
                >
                  <div className="text-center">
                    <div className="text-sm font-semibold">Chronic / Unknown (≥48 h)</div>
                    <div className="text-[10px] text-muted-foreground">Slow 0.4–0.5 mmol/L/h correction</div>
                  </div>
                </Button>
              </div>
            </div>

            {/* Volume status */}
            <div>
              <Label className="mb-2 block">Clinical Volume Status</Label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                {VOLUME_DIAGNOSTICS.map((vd) => (
                  <Button
                    key={vd.volume}
                    variant={volumeStatus === vd.volume ? "default" : "outline"}
                    className={`h-auto py-3 ${
                      volumeStatus === vd.volume
                        ? vd.volume === "hypovolemic" ? "bg-blue-500" :
                          vd.volume === "hypervolemic" ? "bg-rose-500" : "bg-green-500"
                        : ""
                    }`}
                    onClick={() => setVolumeStatus(vd.volume)}
                  >
                    <div className="text-center">
                      <div className="text-sm font-semibold">{vd.volume}</div>
                      <div className="text-[10px] text-muted-foreground mt-1 leading-tight">
                        {vd.causes.join(" · ")}
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
            </div>

            {volumeStatus && chronicity && (
              <div className="p-3 rounded-lg border bg-green-500/5 border-green-500/20 text-sm">
                <p className="font-semibold text-green-400">
                  ✓ {chronicity.toUpperCase()} — <span className="uppercase">{volumeStatus}</span>
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Correction rate: {chronicity === "acute" ? "up to 1 mmol/L/h" : "0.4–0.5 mmol/L/h"}.
                  Max 24h: {chronicity === "acute" ? "10–12" : "8–10"} mmol/L.
                </p>
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {/* ── STEP 3: Urine Studies ── */}
      <Card className={`border-${urineResult ? "green" : "teal"}-500/20 ${!steps.step2_complete ? "opacity-50 pointer-events-none" : ""}`}>
        <button
          onClick={() => setExpandedSection(expandedSection === "step3" ? null : "step3")}
          className="w-full text-left"
        >
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FlaskConical className="h-5 w-5 text-teal-400" />
                <CardTitle className="text-base">Step 3: Urine Studies</CardTitle>
              </div>
              {expandedSection === "step3" ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </div>
            <CardDescription>Urine osmolality and sodium to distinguish renal vs extrarenal losses and identify DI</CardDescription>
          </CardHeader>
        </button>

        {expandedSection === "step3" && (
          <CardContent className="space-y-4 pt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Urine Osmolality (mOsm/kg)</Label>
                <Input
                  type="number"
                  placeholder="e.g. 450"
                  value={urineOsm}
                  onChange={(e) => setUrineOsm(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Urine Sodium (mEq/L)</Label>
                <Input
                  type="number"
                  placeholder="e.g. 25"
                  value={urineNa}
                  onChange={(e) => setUrineNa(e.target.value)}
                />
              </div>
            </div>

            <Button onClick={analyzeUrine} className="w-full" disabled={!urineOsm || !urineNa}>
              Analyze Urine Studies
            </Button>

            {/* Reference table */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 px-2 font-medium">UOsm</th>
                    <th className="text-left py-2 px-2 font-medium">Interpretation</th>
                    <th className="text-left py-2 px-2 font-medium">Suggests</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-border/50 hover:bg-muted/30">
                    <td className="py-1.5 px-2 font-medium">≥600</td>
                    <td className="py-1.5 px-2">Appropriate concentration</td>
                    <td className="py-1.5 px-2 text-muted-foreground">Extrarenal water loss, poor intake</td>
                  </tr>
                  <tr className="border-b border-border/50 hover:bg-muted/30">
                    <td className="py-1.5 px-2 font-medium">300–600</td>
                    <td className="py-1.5 px-2">Partial concentration</td>
                    <td className="py-1.5 px-2 text-muted-foreground">Partial DI or mixed state</td>
                  </tr>
                  <tr className="border-b border-border/50 hover:bg-muted/30">
                    <td className="py-1.5 px-2 font-medium">&lt;300</td>
                    <td className="py-1.5 px-2">Impaired concentration</td>
                    <td className="py-1.5 px-2 text-muted-foreground">Central or nephrogenic DI</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {urineResult && (
              <div className="p-3 rounded-lg border bg-green-500/5 border-green-500/20 text-sm">
                <p className="font-semibold text-green-400">
                  ✓ Urine: <span className="uppercase">{urineResult}</span>
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {urineResult === "concentrated" && "Appropriate renal concentration — extrarenal water loss or poor intake."}
                  {urineResult === "partial" && "Partial concentrating defect — possible partial DI. Consider water deprivation test if unclear."}
                  {urineResult === "dilute" && "Impaired concentration — suspect diabetes insipidus (central vs nephrogenic). Consider desmopressin trial."}
                </p>
                {urineNa && (
                  <p className="text-xs text-muted-foreground mt-1">
                    UNa {parseFloat(urineNa) > 20 ? ">20" : "≤20"} mEq/L — {parseFloat(urineNa) > 20 ? "renal loss possible" : "extrarenal loss or water deficit"}
                  </p>
                )}
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {/* ── STEP 4: Treatment ── */}
      <Card className={`border-${symptomSeverity ? "green" : "rose"}-500/20 ${!steps.step3_complete ? "opacity-50 pointer-events-none" : ""}`}>
        <button
          onClick={() => setExpandedSection(expandedSection === "step4" ? null : "step4")}
          className="w-full text-left"
        >
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Syringe className="h-5 w-5 text-rose-400" />
                <CardTitle className="text-base">Step 4: Treatment Plan</CardTitle>
              </div>
              {expandedSection === "step4" ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </div>
            <CardDescription>Select symptom severity to generate a management plan tailored to volume status and chronicity</CardDescription>
          </CardHeader>
        </button>

        {expandedSection === "step4" && (
          <CardContent className="space-y-4 pt-0">
            {/* Symptom severity */}
            <div>
              <Label className="mb-2 block">Symptom Severity</Label>
              <div className="grid grid-cols-3 gap-2">
                {(["asymptomatic", "moderate", "severe"] as const).map((s) => (
                  <Button
                    key={s}
                    variant={symptomSeverity === s ? "default" : "outline"}
                    className={`h-auto py-3 ${
                      s === "severe" ? "text-red-400 border-red-500/30" :
                      s === "moderate" ? "text-amber-400 border-amber-500/30" : ""
                    }`}
                    onClick={() => setSymptomSeverity(s)}
                  >
                    <div className="text-center">
                      <div className="text-xs font-semibold mb-1">{s.toUpperCase()}</div>
                      <div className="text-[10px] text-muted-foreground">
                        {s === "asymptomatic" && "Thirst, dry mucosa, irritability"}
                        {s === "moderate" && "Confusion, lethargy, weakness"}
                        {s === "severe" && "Seizures, coma, marked encephalopathy"}
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
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
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Agent</div>
                      <div className="font-semibold text-sm">{treatmentPlan.agent}</div>
                    </div>
                    <div className="p-2 rounded bg-card/50 border border-border">
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Dose</div>
                      <div className="font-semibold text-sm text-balance">{treatmentPlan.dose}</div>
                    </div>
                    <div className="p-2 rounded bg-card/50 border border-border">
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Max Correction</div>
                      <div className="font-semibold text-sm">{treatmentPlan.maxCorrection}</div>
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

      {/* ── Water Deficit Calculator ── */}
      <Card className="border-cyan-500/20">
        <button
          onClick={() => setExpandedSection(expandedSection === "calculator" ? null : "calculator")}
          className="w-full text-left"
        >
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calculator className="h-5 w-5 text-cyan-400" />
                <CardTitle className="text-base">Water Deficit Calculator</CardTitle>
              </div>
              {expandedSection === "calculator" ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </div>
            <CardDescription>Formula: Water deficit (L) = TBW × ((Na÷140) − 1) — estimates initial free water replacement</CardDescription>
          </CardHeader>
        </button>

        {expandedSection === "calculator" && (
          <CardContent className="space-y-4 pt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="space-y-2">
                <Label>Weight (kg)</Label>
                <Input type="number" placeholder="e.g. 70" value={weight} onChange={(e) => setWeight(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Age (years)</Label>
                <Input type="number" placeholder="e.g. 55" value={age} onChange={(e) => setAge(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Gender</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant={gender === "male" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setGender("male")}
                  >Male</Button>
                  <Button
                    variant={gender === "female" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setGender("female")}
                  >Female</Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Current Na⁺ (mmol/L)</Label>
                <Input type="number" step="0.1" placeholder="e.g. 158" value={serumNa} onChange={(e) => setSerumNa(e.target.value)} />
              </div>
            </div>

            {deficitResult && (
              <div className="p-4 rounded-lg border border-cyan-500/20 bg-cyan-500/5">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">TBW Estimate</div>
                    <div className="text-lg font-bold text-cyan-400">{deficitResult.tbw.toFixed(1)} L</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Water Deficit</div>
                    <div className="text-lg font-bold text-cyan-400">{deficitResult.deficit.toFixed(1)} L</div>
                    <div className="text-xs text-muted-foreground">total free water replacement</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">First 24 h</div>
                    <div className="text-lg font-bold text-cyan-400">{(deficitResult.deficit * 0.5).toFixed(1)} L</div>
                    <div className="text-xs text-muted-foreground">replace ½ deficit, remainder over 24–48 h</div>
                  </div>
                </div>
                <div className="mt-2 text-xs text-muted-foreground">
                  Formula: Deficit = {deficitResult.tbw.toFixed(1)} L × (({parseFloat(serumNa).toFixed(0)} ÷ 140) − 1) = {deficitResult.deficit.toFixed(1)} L.
                  Replace ½ now ({deficitResult.deficit < 0 ? "0" : (deficitResult.deficit * 0.5).toFixed(1)} L), remainder over next 24–48 h.
                  <span className="block mt-0.5 text-amber-400">⚠ Correct at {chronicity === "acute" ? "0.5–1" : "0.4–0.5"} mmol/L/h — max {chronicity === "acute" ? "10–12" : "8–10"} mmol/L/24 h</span>
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
                <CardTitle className="text-base">⚠ Safety Rules & Monitoring</CardTitle>
              </div>
              {expandedSection === "safety" ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </div>
            <CardDescription>Cerebral edema from rapid correction is preventable — slow and steady</CardDescription>
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

            {/* Cross-reference to Hyponatremia differential */}
            <div className="p-3 rounded-lg border border-indigo-500/20 bg-indigo-500/5 text-xs">
              <p className="font-semibold text-indigo-400 mb-1">🧠 Differential Diagnosis Reference</p>
              <p className="text-muted-foreground">
                For the complete differential diagnosis of <strong>SIADH vs Psychogenic Polydipsia vs Diabetes Insipidus vs Lithium-Induced Nephrogenic DI</strong> —
                including the serum &amp; urine osmolality pattern mapping table, decision tree logic, and detailed condition cards —
                see the <strong>Hyponatremia Decision Support</strong> tool (🧠 Differential Diagnosis section).
              </p>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}