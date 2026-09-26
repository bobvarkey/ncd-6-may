import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Calculator, RotateCcw, ArrowLeftRight, AlertTriangle, Info,
  Activity, Droplets, Gauge, Stethoscope, Heart, TrendingUp, FlaskConical
} from "lucide-react";
import ImageLink from "@/components/ImageLink";

type CreatinineUnit = "mgdl" | "umol";
type Sex = "male" | "female";
type AKIStage = "none" | "stage1" | "stage2" | "stage3";
type RIFLEStage = "none" | "risk" | "injury" | "failure" | "loss" | "esrd";

const UMOL_TO_MGDL = 1 / 88.42;

// ─── KDIGO AKI Staging ───────────────────────────────────────────────

interface KdigoAKIInfo {
  stage: AKIStage;
  label: string;
  crCriteria: string;
  uoCriteria: string;
  color: string;
  management: string[];
}

const KDIGO_AKI_STAGES: KdigoAKIInfo[] = [
  {
    stage: "stage1",
    label: "Stage 1",
    crCriteria: "↑ Cr ≥0.3 mg/dL (≥26.5 µmol/L) in 48h OR ↑ Cr 1.5–1.9× baseline in 7d",
    uoCriteria: "<0.5 mL/kg/h for 6–12h",
    color: "bg-yellow-100/20 text-yellow-600 border-yellow-400/30",
    management: [
      "Identify & remove precipitating cause (hypovolemia, nephrotoxins, sepsis)",
      "Review all medications — hold nephrotoxins (NSAIDs, ACEi/ARB, aminoglycosides)",
      "Optimize volume status — IV fluids if hypovolemic, diuretics if fluid overloaded",
      "Monitor serum Cr, UO, electrolytes q6–12h",
      "Avoid contrast studies if possible",
    ],
  },
  {
    stage: "stage2",
    label: "Stage 2",
    crCriteria: "↑ Cr 2.0–2.9× baseline",
    uoCriteria: "<0.5 mL/kg/h for ≥12h",
    color: "bg-orange-100/20 text-orange-600 border-orange-400/30",
    management: [
      "All Stage 1 measures +",
      "Nephrology consultation",
      "Correct metabolic acidosis (HCO₃ <18 → consider NaHCO₃)",
      "Correct electrolyte disturbances (K⁺, Ca²⁺, PO₄³⁻, Mg²⁺)",
      "Adjust drug doses for eGFR",
      "Consider renal replacement therapy planning",
    ],
  },
  {
    stage: "stage3",
    label: "Stage 3",
    crCriteria: "↑ Cr ≥3.0× baseline OR Cr ≥4.0 mg/dL (≥353.6 µmol/L) OR Initiation of RRT OR eGFR <35 in <18y",
    uoCriteria: "<0.3 mL/kg/h for ≥24h OR anuria ≥12h",
    color: "bg-destructive/20 text-destructive border-destructive/30",
    management: [
      "All Stage 1–2 measures +",
      "Urgent nephrology consultation",
      "Assess for RRT indications: refractory hyperkalemia (K⁺ >6.5), severe acidosis (pH <7.15), uremic complications, fluid overload refractory to diuretics",
      "Consider temporary dialysis access",
      "ICU-level monitoring if hemodynamically unstable",
      "Avoid nephrotoxins absolutely",
    ],
  },
];

// ─── RIFLE Criteria ──────────────────────────────────────────────────

interface RIFLEInfo {
  stage: RIFLEStage;
  label: string;
  crGfrCriteria: string;
  uoCriteria: string;
  color: string;
  description: string;
}

const RIFLE_STAGES: RIFLEInfo[] = [
  {
    stage: "risk",
    label: "Risk",
    crGfrCriteria: "↑ Cr ×1.5 OR ↓ GFR >25%",
    uoCriteria: "<0.5 mL/kg/h × 6h",
    color: "bg-yellow-100/20 text-yellow-600 border-yellow-400/30",
    description: "Increased sensitivity to injury — early intervention window",
  },
  {
    stage: "injury",
    label: "Injury",
    crGfrCriteria: "↑ Cr ×2.0 OR ↓ GFR >50%",
    uoCriteria: "<0.5 mL/kg/h × 12h",
    color: "bg-orange-100/20 text-orange-600 border-orange-400/30",
    description: "Kidney damage sustained — nephrology referral indicated",
  },
  {
    stage: "failure",
    label: "Failure",
    crGfrCriteria: "↑ Cr ×3.0 OR ↓ GFR >75% OR Cr ≥4.0 mg/dL (acute rise ≥0.5)",
    uoCriteria: "<0.3 mL/kg/h × 24h OR anuria × 12h",
    color: "bg-destructive/20 text-destructive border-destructive/30",
    description: "Loss of kidney function — RRT consideration",
  },
  {
    stage: "loss",
    label: "Loss",
    crGfrCriteria: "Persistent ARF = complete loss of kidney function >4 weeks",
    uoCriteria: "—",
    color: "bg-destructive/30 text-destructive border-destructive/40",
    description: "Complete loss of kidney function >4 weeks — dialysis dependence",
  },
  {
    stage: "esrd",
    label: "ESRD",
    crGfrCriteria: "End-stage renal disease >3 months",
    uoCriteria: "—",
    color: "bg-purple-900/20 text-purple-400 border-purple-500/30",
    description: "Irreversible kidney failure — chronic dialysis or transplant",
  },
];

// ─── Baseline Cr estimation (MDRD equation back-calculation) ──────────

function estimateBaselineCr(age: number, sex: Sex, assumedGfr: number = 75): number {
  // Back-calculate from MDRD: eGFR = 175 × (Cr/SCr)^-1.154 × age^-0.203 × (0.742 if female)
  // Assume baseline eGFR ~75 mL/min for AKI assessment
  const sexFactor = sex === "female" ? 0.742 : 1.0;
  const cr = Math.pow(175 * Math.pow(age, -0.203) * sexFactor / assumedGfr, 1 / 1.154);
  return Math.round(cr * 100) / 100;
}

// ─── KDIGO AKI determination ──────────────────────────────────────────

function getKdigoAKIStage(
  currentCr: number, baselineCr: number | null, crRise48h: number | null,
  uoMlPerKgH: number | null, uoDurationH: number | null
): KdigoAKIInfo | null {
  if (currentCr <= 0 || !baselineCr) return null;

  const ratio = currentCr / baselineCr;

  // Stage 3
  if (ratio >= 3.0 || currentCr >= 4.0) return KDIGO_AKI_STAGES[2];
  if (uoMlPerKgH !== null && uoDurationH !== null) {
    if (uoMlPerKgH < 0.3 && uoDurationH >= 24) return KDIGO_AKI_STAGES[2];
    if (uoMlPerKgH === 0 && uoDurationH >= 12) return KDIGO_AKI_STAGES[2];
  }

  // Stage 2
  if (ratio >= 2.0) return KDIGO_AKI_STAGES[1];
  if (uoMlPerKgH !== null && uoDurationH !== null) {
    if (uoMlPerKgH < 0.5 && uoDurationH >= 12) return KDIGO_AKI_STAGES[1];
  }

  // Stage 1
  if (crRise48h !== null && crRise48h >= 0.3) return KDIGO_AKI_STAGES[0];
  if (ratio >= 1.5) return KDIGO_AKI_STAGES[0];
  if (uoMlPerKgH !== null && uoDurationH !== null) {
    if (uoMlPerKgH < 0.5 && uoDurationH >= 6) return KDIGO_AKI_STAGES[0];
  }

  return null;
}

// ─── RIFLE determination ──────────────────────────────────────────────

function getRIFLEStage(
  currentCr: number, baselineCr: number | null,
  uoMlPerKgH: number | null, uoDurationH: number | null
): RIFLEInfo | null {
  if (currentCr <= 0 || !baselineCr) return null;

  const ratio = currentCr / baselineCr;
  const gfrDrop = 1 - (1 / ratio); // approximate GFR drop

  // Failure
  if (ratio >= 3.0 || gfrDrop > 0.75 || currentCr >= 4.0) return RIFLE_STAGES[2];
  if (uoMlPerKgH !== null && uoDurationH !== null) {
    if (uoMlPerKgH < 0.3 && uoDurationH >= 24) return RIFLE_STAGES[2];
    if (uoMlPerKgH === 0 && uoDurationH >= 12) return RIFLE_STAGES[2];
  }

  // Injury
  if (ratio >= 2.0 || gfrDrop > 0.50) return RIFLE_STAGES[1];
  if (uoMlPerKgH !== null && uoDurationH !== null) {
    if (uoMlPerKgH < 0.5 && uoDurationH >= 12) return RIFLE_STAGES[1];
  }

  // Risk
  if (ratio >= 1.5 || gfrDrop > 0.25) return RIFLE_STAGES[0];
  if (uoMlPerKgH !== null && uoDurationH !== null) {
    if (uoMlPerKgH < 0.5 && uoDurationH >= 6) return RIFLE_STAGES[0];
  }

  return null;
}

// ─── Component ───────────────────────────────────────────────────────

export default function AKICriteria() {
  const [tab, setTab] = useState("kdigo");

  // Inputs
  const [currentCr, setCurrentCr] = useState(() => {
    try { return localStorage.getItem("ncd_aki_current_cr") || ""; } catch { return ""; }
  });
  const [baselineCr, setBaselineCr] = useState(() => {
    try { return localStorage.getItem("ncd_aki_baseline_cr") || ""; } catch { return ""; }
  });
  const [crRise48h, setCrRise48h] = useState(() => {
    try { return localStorage.getItem("ncd_aki_cr_rise_48h") || ""; } catch { return ""; }
  });
  const [unit, setUnit] = useState<CreatinineUnit>(() => {
    try { return (localStorage.getItem("ncd_aki_unit") as CreatinineUnit) || "mgdl"; } catch { return "mgdl"; }
  });
  const [age, setAge] = useState(() => {
    try { return localStorage.getItem("ncd_aki_age") || ""; } catch { return ""; }
  });
  const [sex, setSex] = useState<Sex | null>(() => {
    try { return localStorage.getItem("ncd_aki_sex") as Sex || null; } catch { return null; }
  });
  const [weight, setWeight] = useState(() => {
    try { return localStorage.getItem("ncd_aki_weight") || ""; } catch { return ""; }
  });
  const [uoTotal, setUoTotal] = useState(() => {
    try { return localStorage.getItem("ncd_aki_uo_total") || ""; } catch { return ""; }
  });
  const [uoDuration, setUoDuration] = useState(() => {
    try { return localStorage.getItem("ncd_aki_uo_duration") || ""; } catch { return ""; }
  });

  // Results
  const [calculated, setCalculated] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Persist
  useEffect(() => { localStorage.setItem("ncd_aki_current_cr", currentCr); }, [currentCr]);
  useEffect(() => { localStorage.setItem("ncd_aki_baseline_cr", baselineCr); }, [baselineCr]);
  useEffect(() => { localStorage.setItem("ncd_aki_cr_rise_48h", crRise48h); }, [crRise48h]);
  useEffect(() => { localStorage.setItem("ncd_aki_unit", unit); }, [unit]);
  useEffect(() => { localStorage.setItem("ncd_aki_age", age); }, [age]);
  useEffect(() => { if (sex) localStorage.setItem("ncd_aki_sex", sex); }, [sex]);
  useEffect(() => { localStorage.setItem("ncd_aki_weight", weight); }, [weight]);
  useEffect(() => { localStorage.setItem("ncd_aki_uo_total", uoTotal); }, [uoTotal]);
  useEffect(() => { localStorage.setItem("ncd_aki_uo_duration", uoDuration); }, [uoDuration]);

  const toggleUnit = () => {
    const val = parseFloat(currentCr);
    if (!isNaN(val) && val > 0) {
      if (unit === "mgdl") setCurrentCr((val * 88.42).toFixed(1));
      else setCurrentCr((val * UMOL_TO_MGDL).toFixed(2));
    }
    const bVal = parseFloat(baselineCr);
    if (!isNaN(bVal) && bVal > 0) {
      if (unit === "mgdl") setBaselineCr((bVal * 88.42).toFixed(1));
      else setBaselineCr((bVal * UMOL_TO_MGDL).toFixed(2));
    }
    setUnit((prev) => (prev === "mgdl" ? "umol" : "mgdl"));
  };

  const getCrMgdl = (val: string): number => {
    const n = parseFloat(val);
    return unit === "umol" ? n * UMOL_TO_MGDL : n;
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    const crVal = parseFloat(currentCr);
    const maxCr = unit === "mgdl" ? 30 : 2652;
    if (!currentCr.trim() || isNaN(crVal) || crVal <= 0 || crVal > maxCr) {
      newErrors.currentCr = unit === "mgdl" ? "Enter valid Cr (0.1–30 mg/dL)" : "Enter valid Cr (9–2652 µmol/L)";
    }
    if (baselineCr.trim()) {
      const bVal = parseFloat(baselineCr);
      if (isNaN(bVal) || bVal <= 0 || bVal > maxCr) {
        newErrors.baselineCr = unit === "mgdl" ? "Enter valid baseline Cr (0.1–30 mg/dL)" : "Enter valid baseline Cr (9–2652 µmol/L)";
      }
    }
    if (crRise48h.trim()) {
      const rVal = parseFloat(crRise48h);
      if (isNaN(rVal) || rVal < 0 || rVal > 10) {
        newErrors.crRise48h = "Enter valid Cr rise (0–10 mg/dL)";
      }
    }
    if (uoTotal.trim() || uoDuration.trim()) {
      const wVal = parseFloat(weight);
      if (!weight.trim() || isNaN(wVal) || wVal < 20 || wVal > 300) {
        newErrors.weight = "Enter weight (20–300 kg) for UO calculation";
      }
      const uVal = parseFloat(uoTotal);
      if (isNaN(uVal) || uVal < 0 || uVal > 20000) {
        newErrors.uoTotal = "Enter valid total urine output (0–20000 mL)";
      }
      const dVal = parseFloat(uoDuration);
      if (isNaN(dVal) || dVal < 1 || dVal > 72) {
        newErrors.uoDuration = "Enter valid duration (1–72 hours)";
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const calculate = () => {
    if (!validate()) return;
    setCalculated(true);
  };

  const reset = () => {
    setCurrentCr("");
    setBaselineCr("");
    setCrRise48h("");
    setAge("");
    setSex(null);
    setWeight("");
    setUoTotal("");
    setUoDuration("");
    setCalculated(false);
    setErrors({});
  };

  // Derived values
  const crMgdl = parseFloat(currentCr) ? getCrMgdl(currentCr) : 0;
  const baselineCrMgdl = baselineCr.trim() ? getCrMgdl(baselineCr) : 0;
  const crRiseMgdl = crRise48h.trim() ? parseFloat(crRise48h) : null;
  const weightKg = weight.trim() ? parseFloat(weight) : 0;
  const uoMl = uoTotal.trim() ? parseFloat(uoTotal) : 0;
  const uoH = uoDuration.trim() ? parseFloat(uoDuration) : 0;
  const uoMlPerKgH = weightKg > 0 && uoH > 0 ? uoMl / weightKg / uoH : null;

  // Auto-estimate baseline Cr if age + sex provided but no baseline entered
  const estimatedBaseline = (!baselineCr.trim() && age.trim() && sex)
    ? estimateBaselineCr(parseInt(age), sex)
    : null;
  const effectiveBaseline = baselineCrMgdl > 0 ? baselineCrMgdl : estimatedBaseline;

  const kdigoStage = calculated ? getKdigoAKIStage(crMgdl, effectiveBaseline, crRiseMgdl, uoMlPerKgH, uoH) : null;
  const rifleStage = calculated ? getRIFLEStage(crMgdl, effectiveBaseline, uoMlPerKgH, uoH) : null;

  return (
    <div className="space-y-5 animate-slide-in">
      <div>
        <h1 className="text-xl font-heading font-bold">AKI Criteria</h1>
        <p className="text-sm text-muted-foreground">
          Acute Kidney Injury staging — KDIGO 2012 &amp; RIFLE criteria
        </p>
      </div>

      {/* Input Card */}
      <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-muted/5">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Calculator className="h-5 w-5 text-primary" />
              <CardTitle className="text-xl">AKI Staging Calculator</CardTitle>
            </div>
            {calculated && (
              <Button variant="ghost" size="sm" onClick={reset} className="text-muted-foreground">
                <RotateCcw className="h-4 w-4 mr-1" /> Reset
              </Button>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Enter current Cr + baseline (or age/sex for estimated baseline) + optional urine output
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            {/* Current Creatinine */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="aki-current-cr" className="text-sm font-medium">
                  Current Cr ({unit === "mgdl" ? "mg/dL" : "µmol/L"})
                </Label>
                <button
                  type="button"
                  onClick={toggleUnit}
                  className="flex items-center gap-1 text-xs text-primary hover:underline font-medium"
                >
                  <ArrowLeftRight className="h-3 w-3" />
                  {unit === "mgdl" ? "µmol/L" : "mg/dL"}
                </button>
              </div>
              <Input
                id="aki-current-cr"
                type="number"
                step={unit === "mgdl" ? "0.01" : "1"}
                min={unit === "mgdl" ? "0.1" : "9"}
                max={unit === "mgdl" ? "30" : "2652"}
                placeholder={unit === "mgdl" ? "e.g. 2.5" : "e.g. 221"}
                value={currentCr}
                onChange={(e) => { setCurrentCr(e.target.value); if (errors.currentCr) setErrors(p => ({ ...p, currentCr: "" })); }}
                className={errors.currentCr ? "border-destructive" : ""}
              />
              {errors.currentCr && <p className="text-xs text-destructive">{errors.currentCr}</p>}
            </div>

            {/* Baseline Creatinine */}
            <div className="space-y-1.5">
              <Label htmlFor="aki-baseline-cr" className="text-sm font-medium">
                Baseline Cr ({unit === "mgdl" ? "mg/dL" : "µmol/L"})
              </Label>
              <Input
                id="aki-baseline-cr"
                type="number"
                step={unit === "mgdl" ? "0.01" : "1"}
                min={unit === "mgdl" ? "0.1" : "9"}
                max={unit === "mgdl" ? "30" : "2652"}
                placeholder="Leave empty to estimate"
                value={baselineCr}
                onChange={(e) => { setBaselineCr(e.target.value); if (errors.baselineCr) setErrors(p => ({ ...p, baselineCr: "" })); }}
                className={errors.baselineCr ? "border-destructive" : ""}
              />
              {errors.baselineCr && <p className="text-xs text-destructive">{errors.baselineCr}</p>}
              {estimatedBaseline && (
                <p className="text-xs text-muted-foreground">
                  Estimated baseline: {estimatedBaseline.toFixed(2)} mg/dL (MDRD back-calculation, eGFR ~75)
                </p>
              )}
            </div>

            {/* Cr rise in 48h */}
            <div className="space-y-1.5">
              <Label htmlFor="aki-cr-rise" className="text-sm font-medium">
                Cr rise in 48h (mg/dL)
              </Label>
              <Input
                id="aki-cr-rise"
                type="number"
                step="0.1"
                min="0"
                max="10"
                placeholder="e.g. 0.3"
                value={crRise48h}
                onChange={(e) => { setCrRise48h(e.target.value); if (errors.crRise48h) setErrors(p => ({ ...p, crRise48h: "" })); }}
                className={errors.crRise48h ? "border-destructive" : ""}
              />
              {errors.crRise48h && <p className="text-xs text-destructive">{errors.crRise48h}</p>}
              <p className="text-xs text-muted-foreground">≥0.3 mg/dL in 48h = KDIGO Stage 1</p>
            </div>

            {/* Age + Sex */}
            <div className="space-y-1.5">
              <Label htmlFor="aki-age" className="text-sm font-medium">Age (years)</Label>
              <Input
                id="aki-age"
                type="number"
                min="18" max="120"
                placeholder="e.g. 55"
                value={age}
                onChange={(e) => { setAge(e.target.value); }}
              />
              <div className="flex gap-2 mt-1">
                <Button
                  type="button"
                  variant={sex === "male" ? "default" : "outline"}
                  size="sm"
                  className="flex-1 h-7 text-xs"
                  onClick={() => setSex("male")}
                >Male</Button>
                <Button
                  type="button"
                  variant={sex === "female" ? "default" : "outline"}
                  size="sm"
                  className="flex-1 h-7 text-xs"
                  onClick={() => setSex("female")}
                >Female</Button>
              </div>
              <p className="text-xs text-muted-foreground">Used for baseline Cr estimation</p>
            </div>
          </div>

          {/* Urine Output Section */}
          <details className="mb-4 text-sm">
            <summary className="cursor-pointer text-primary font-medium hover:underline flex items-center gap-1">
              <Droplets className="h-3.5 w-3.5" />
              Urine Output Criteria (optional)
            </summary>
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="aki-weight" className="text-sm font-medium">Weight (kg)</Label>
                <Input
                  id="aki-weight"
                  type="number"
                  min="20" max="300"
                  step="0.1"
                  placeholder="e.g. 70"
                  value={weight}
                  onChange={(e) => { setWeight(e.target.value); if (errors.weight) setErrors(p => ({ ...p, weight: "" })); }}
                  className={errors.weight ? "border-destructive" : ""}
                />
                {errors.weight && <p className="text-xs text-destructive">{errors.weight}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="aki-uo-total" className="text-sm font-medium">Total Urine Output (mL)</Label>
                <Input
                  id="aki-uo-total"
                  type="number"
                  min="0" max="20000"
                  step="10"
                  placeholder="e.g. 200"
                  value={uoTotal}
                  onChange={(e) => { setUoTotal(e.target.value); if (errors.uoTotal) setErrors(p => ({ ...p, uoTotal: "" })); }}
                  className={errors.uoTotal ? "border-destructive" : ""}
                />
                {errors.uoTotal && <p className="text-xs text-destructive">{errors.uoTotal}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="aki-uo-duration" className="text-sm font-medium">Duration (hours)</Label>
                <Input
                  id="aki-uo-duration"
                  type="number"
                  min="1" max="72"
                  step="1"
                  placeholder="e.g. 6"
                  value={uoDuration}
                  onChange={(e) => { setUoDuration(e.target.value); if (errors.uoDuration) setErrors(p => ({ ...p, uoDuration: "" })); }}
                  className={errors.uoDuration ? "border-destructive" : ""}
                />
                {errors.uoDuration && <p className="text-xs text-destructive">{errors.uoDuration}</p>}
              </div>
            </div>
            {uoMlPerKgH !== null && (
              <p className="text-xs text-muted-foreground mt-2">
                Calculated UO rate: <strong>{uoMlPerKgH.toFixed(2)} mL/kg/h</strong>
              </p>
            )}
          </details>

          <Button onClick={calculate} className="w-full sm:w-auto">
            <Calculator className="h-4 w-4 mr-2" />
            Calculate AKI Stage
          </Button>
        </CardContent>
      </Card>

      {/* Results */}
      {calculated && (
        <Tabs value={tab} onValueChange={setTab} className="w-full">
          <TabsList className="grid grid-cols-2 w-full max-w-md">
            <TabsTrigger value="kdigo" className="flex items-center gap-1">
              <Activity className="h-4 w-4" /> KDIGO AKI
            </TabsTrigger>
            <TabsTrigger value="rifle" className="flex items-center gap-1">
              <Gauge className="h-4 w-4" /> RIFLE
            </TabsTrigger>
          </TabsList>

          {/* ─── KDIGO AKI Tab ─────────────────────────────────────── */}
          <TabsContent value="kdigo" className="space-y-4 mt-4">
            {kdigoStage ? (
              <>
                <div className={`p-4 rounded-lg border-2 ${kdigoStage.color}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-5 w-5" />
                    <span className="text-base font-bold">{kdigoStage.label}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground font-medium">Creatinine Criteria</p>
                      <p>{kdigoStage.crCriteria}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground font-medium">Urine Output Criteria</p>
                      <p>{kdigoStage.uoCriteria}</p>
                    </div>
                  </div>
                  {crMgdl > 0 && effectiveBaseline && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Cr ratio: {(crMgdl / effectiveBaseline).toFixed(1)}× baseline
                      {crRiseMgdl !== null && ` · Rise in 48h: ${crRiseMgdl.toFixed(1)} mg/dL`}
                      {uoMlPerKgH !== null && ` · UO: ${uoMlPerKgH.toFixed(2)} mL/kg/h`}
                    </p>
                  )}
                </div>

                {/* Management */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Stethoscope className="h-4 w-4 text-primary" />
                      Management Recommendations
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-1.5">
                      {kdigoStage.management.map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <span className="bg-primary/10 text-primary rounded-full w-5 h-5 flex items-center justify-center text-xs shrink-0 mt-0.5">{i + 1}</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </>
            ) : (
              <div className="p-4 rounded-lg bg-success/10 text-success border border-success/30">
                <div className="flex items-center gap-2">
                  <Heart className="h-5 w-5" />
                  <span className="text-base font-bold">No AKI detected</span>
                </div>
                <p className="text-sm mt-1">
                  Current Cr does not meet KDIGO AKI thresholds.
                  {effectiveBaseline && ` Cr ratio: ${(crMgdl / effectiveBaseline).toFixed(1)}× baseline.`}
                </p>
              </div>
            )}

            {/* KDIGO AKI Reference Table */}
            <details className="text-sm" open>
              <summary className="cursor-pointer text-primary font-medium hover:underline flex items-center gap-1">
                <Info className="h-3.5 w-3.5" />
                KDIGO AKI Staging Reference
              </summary>
              <div className="mt-2 overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="p-2 text-left font-medium text-muted-foreground">Stage</th>
                      <th className="p-2 text-left font-medium text-muted-foreground">Serum Creatinine</th>
                      <th className="p-2 text-left font-medium text-muted-foreground">Urine Output</th>
                    </tr>
                  </thead>
                  <tbody>
                    {KDIGO_AKI_STAGES.map((s) => (
                      <tr key={s.stage} className={`border-b border-border/50 ${kdigoStage?.stage === s.stage ? "bg-primary/5" : ""}`}>
                        <td className={`p-2 font-medium ${kdigoStage?.stage === s.stage ? "text-primary" : ""}`}>
                          <Badge className={s.color}>{s.label}</Badge>
                        </td>
                        <td className="p-2">{s.crCriteria}</td>
                        <td className="p-2">{s.uoCriteria}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>
          </TabsContent>

          {/* ─── RIFLE Tab ──────────────────────────────────────────── */}
          <TabsContent value="rifle" className="space-y-4 mt-4">
            {rifleStage ? (
              <div className={`p-4 rounded-lg border-2 ${rifleStage.color}`}>
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-5 w-5" />
                  <span className="text-base font-bold">{rifleStage.label}</span>
                </div>
                <p className="text-sm text-muted-foreground mb-3">{rifleStage.description}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">Cr / GFR Criteria</p>
                    <p>{rifleStage.crGfrCriteria}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">Urine Output Criteria</p>
                    <p>{rifleStage.uoCriteria}</p>
                  </div>
                </div>
                {crMgdl > 0 && effectiveBaseline && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Cr ratio: {(crMgdl / effectiveBaseline).toFixed(1)}× baseline
                    {uoMlPerKgH !== null && ` · UO: ${uoMlPerKgH.toFixed(2)} mL/kg/h`}
                  </p>
                )}
              </div>
            ) : (
              <div className="p-4 rounded-lg bg-success/10 text-success border border-success/30">
                <div className="flex items-center gap-2">
                  <Heart className="h-5 w-5" />
                  <span className="text-base font-bold">No AKI detected</span>
                </div>
                <p className="text-sm mt-1">
                  Current Cr does not meet RIFLE thresholds.
                  {effectiveBaseline && ` Cr ratio: ${(crMgdl / effectiveBaseline).toFixed(1)}× baseline.`}
                </p>
              </div>
            )}

            {/* RIFLE Reference Table */}
            <details className="text-sm" open>
              <summary className="cursor-pointer text-primary font-medium hover:underline flex items-center gap-1">
                <Info className="h-3.5 w-3.5" />
                RIFLE Criteria Reference
              </summary>
              <div className="mt-2 overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="p-2 text-left font-medium text-muted-foreground">Class</th>
                      <th className="p-2 text-left font-medium text-muted-foreground">Cr / GFR Criteria</th>
                      <th className="p-2 text-left font-medium text-muted-foreground">Urine Output</th>
                    </tr>
                  </thead>
                  <tbody>
                    {RIFLE_STAGES.map((s) => (
                      <tr key={s.stage} className={`border-b border-border/50 ${rifleStage?.stage === s.stage ? "bg-primary/5" : ""}`}>
                        <td className={`p-2 font-medium ${rifleStage?.stage === s.stage ? "text-primary" : ""}`}>
                          <Badge className={s.color}>{s.label}</Badge>
                        </td>
                        <td className="p-2">{s.crGfrCriteria}</td>
                        <td className="p-2">{s.uoCriteria}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>
          </TabsContent>
        </Tabs>
      )}

      {/* Comparison Section */}
      <Card className="border-2 border-border/40">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            KDIGO vs RIFLE — Key Differences
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border">
                  <th className="p-2 text-left font-medium text-muted-foreground">Feature</th>
                  <th className="p-2 text-left font-medium text-muted-foreground">KDIGO (2012)</th>
                  <th className="p-2 text-left font-medium text-muted-foreground">RIFLE (2004)</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-border/50">
                  <td className="p-2 font-medium">Stages</td>
                  <td className="p-2">3 stages (1, 2, 3)</td>
                  <td className="p-2">5 classes (Risk, Injury, Failure, Loss, ESRD)</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="p-2 font-medium">Cr rise threshold (Stage 1 / Risk)</td>
                  <td className="p-2">≥0.3 mg/dL in 48h OR ≥1.5× in 7d</td>
                  <td className="p-2">≥1.5× (no absolute rise or time window)</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="p-2 font-medium">GFR criterion</td>
                  <td className="p-2">No GFR criterion (Cr-based)</td>
                  <td className="p-2">Includes ↓ GFR {'>'}25% (Risk), {'>'}50% (Injury), {'>'}75% (Failure)</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="p-2 font-medium">Outcome classes</td>
                  <td className="p-2">No outcome classes</td>
                  <td className="p-2">Loss ({'>'}4 weeks) and ESRD ({'>'}3 months)</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="p-2 font-medium">Time window for Cr</td>
                  <td className="p-2">7 days (or 48h for absolute rise)</td>
                  <td className="p-2">1–7 days (not strictly defined)</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="p-2 font-medium">Clinical use</td>
                  <td className="p-2">Current standard — most guidelines</td>
                  <td className="p-2">Historical — still used in some ICU/registry settings</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* ─── Furosemide Stress Test Infographic ─────────────────────── */}
      <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-muted/5">
        <CardHeader className="pb-3">
          <div className="flex items-center space-x-2">
            <FlaskConical className="h-5 w-5 text-primary" />
            <CardTitle className="text-xl">Furosemide Stress Test (FST)</CardTitle>
          </div>
          <p className="text-xs text-muted-foreground">
            A functional test of tubular integrity to predict AKI progression
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg overflow-hidden border border-border">
            <a href="/images/fst-infographic.png" target="_blank" rel="noopener noreferrer" className="block">
              <img
                src="/images/fst-infographic.png"
                alt="Furosemide Stress Test Infographic"
                className="w-full h-auto object-contain"
                loading="lazy"
              />
            </a>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              Click image to view full size
            </p>
            <ImageLink imageId="fst-infographic" label="View in Image Gallery →" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
