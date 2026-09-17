import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calculator, RotateCcw, ArrowLeftRight, Info } from "lucide-react";
import { BsaAdjustmentFields } from "@/components/calculator/BsaAdjustmentFields";
import {
  adjustEgfrForBsa,
  calculateMostellerBsa,
  roundTo,
  validateBsaInputs,
} from "@/lib/egfr-bsa";

type CreatinineUnit = "mgdl" | "umol";
type Sex = "male" | "female" | null;
type UacrUnit = "mg_g" | "mg_mmol";

// Conversion: 1 mg/dL = 88.42 µmol/L
const UMOL_TO_MGDL = 1 / 88.42;
// Conversion: 1 mg/g = 0.113 mg/mmol
const MMOL_TO_MG_G = 1 / 0.113;

export interface GfrResult {
  gfr: number;
  stage: string;
  label: string;
  creatinine: number;
  age: number;
  sex: "male" | "female";
  uacr?: number;
  kdigoStage?: string;
  kdigoRisk?: string;
  bsa?: number;
  bsaAdjustedGfr?: number;
  weightKg?: number;
  heightCm?: number;
}

// KDIGO G stages
const G_STAGES = [
  { stage: "G1", label: "Normal or High", gfrRange: "≥90", color: "bg-success/20 text-success border-success/30" },
  { stage: "G2", label: "Mildly Decreased", gfrRange: "60–89", color: "bg-success/20 text-success border-success/30" },
  { stage: "G3a", label: "Mild–Moderate", gfrRange: "45–59", color: "bg-warning/20 text-warning border-yellow-500/30" },
  { stage: "G3b", label: "Moderate–Severe", gfrRange: "30–44", color: "bg-orange-100/20 text-orange-600 border-orange-400/30" },
  { stage: "G4", label: "Severely Decreased", gfrRange: "15–29", color: "bg-destructive/20 text-destructive border-destructive/30" },
  { stage: "G5", label: "Kidney Failure", gfrRange: "<15", color: "bg-destructive/30 text-destructive border-destructive/40" },
];

// KDIGO A stages (albuminuria)
const A_STAGES = [
  { stage: "A1", label: "Normal–Mildly Increased", uacrRange: "<30 mg/g", color: "bg-success/20 text-success border-success/30" },
  { stage: "A2", label: "Moderately Increased", uacrRange: "30–300 mg/g", color: "bg-warning/20 text-warning border-yellow-500/30" },
  { stage: "A3", label: "Severely Increased", uacrRange: ">300 mg/g", color: "bg-destructive/20 text-destructive border-destructive/30" },
];

// KDIGO risk matrix: rows = G stage index, cols = A stage index
// 0=low, 1=moderate, 2=high, 3=very high risk
const RISK_MATRIX: number[][] = [
  // A1  A2  A3
  [0,  1,  2],  // G1
  [0,  1,  2],  // G2
  [1,  2,  3],  // G3a
  [2,  3,  3],  // G3b
  [3,  3,  3],  // G4
  [3,  3,  3],  // G5
];

const RISK_LABELS = ["Low Risk", "Moderate Risk", "High Risk", "Very High Risk"];
const RISK_COLORS = [
  "bg-success/10 text-success border-success/30",
  "bg-warning/10 text-warning border-yellow-500/30",
  "bg-orange-100/10 text-orange-600 border-orange-400/30",
  "bg-destructive/10 text-destructive border-destructive/30",
];

function calculateCkdEpi(creatinine: number, age: number, sex: "male" | "female"): number {
  const isFemale = sex === "female";
  const kappa = isFemale ? 0.7 : 0.9;
  const alpha = isFemale ? -0.241 : -0.302;
  const sexMultiplier = isFemale ? 1.012 : 1.0;

  const crRatio = creatinine / kappa;
  const minRatio = Math.min(crRatio, 1);
  const maxRatio = Math.max(crRatio, 1);

  const gfr = 142 * Math.pow(minRatio, alpha) * Math.pow(maxRatio, -1.200) * Math.pow(0.9938, age) * sexMultiplier;
  return Math.round(gfr * 10) / 10;
}

function getGfrStage(gfr: number): { stage: string; label: string; color: string; index: number } {
  if (gfr >= 90) return { ...G_STAGES[0], index: 0 };
  if (gfr >= 60) return { ...G_STAGES[1], index: 1 };
  if (gfr >= 45) return { ...G_STAGES[2], index: 2 };
  if (gfr >= 30) return { ...G_STAGES[3], index: 3 };
  if (gfr >= 15) return { ...G_STAGES[4], index: 4 };
  return { ...G_STAGES[5], index: 5 };
}

function getAStage(uacrMgG: number): { stage: string; label: string; color: string; index: number } {
  if (uacrMgG < 30) return { ...A_STAGES[0], index: 0 };
  if (uacrMgG <= 300) return { ...A_STAGES[1], index: 1 };
  return { ...A_STAGES[2], index: 2 };
}

function getKdigoRisk(gfrIndex: number, aIndex: number): { label: string; color: string } {
  const riskIndex = RISK_MATRIX[gfrIndex]?.[aIndex] ?? 0;
  return {
    label: RISK_LABELS[riskIndex],
    color: RISK_COLORS[riskIndex],
  };
}


interface GfrCalculatorProps {
  onResultChange?: (result: GfrResult | null) => void;
}

export default function GfrCalculator({ onResultChange }: GfrCalculatorProps) {
  const [creatinine, setCreatinine] = useState(() => {
    try { return localStorage.getItem("ncd_gfr_creatinine") || ""; } catch { return ""; }
  });
  const [age, setAge] = useState(() => {
    try { return localStorage.getItem("ncd_gfr_age") || ""; } catch { return ""; }
  });
  const [sex, setSex] = useState<Sex>(() => {
    try { return (localStorage.getItem("ncd_gfr_sex") as Sex) || null; } catch { return null; }
  });
  const [unit, setUnit] = useState<CreatinineUnit>(() => {
    try { return (localStorage.getItem("ncd_gfr_unit") as CreatinineUnit) || "mgdl"; } catch { return "mgdl"; }
  });
  // UACR state (optional)
  const [uacr, setUacr] = useState(() => {
    try { return localStorage.getItem("ncd_gfr_uacr") || ""; } catch { return ""; }
  });
  const [uacrUnit, setUacrUnit] = useState<UacrUnit>(() => {
    try { return (localStorage.getItem("ncd_gfr_uacr_unit") as UacrUnit) || "mg_g"; } catch { return "mg_g"; }
  });

  // BSA adjustment state (optional)
  const [adjustBsa, setAdjustBsa] = useState(() => {
    try { return localStorage.getItem("ncd_gfr_adjust_bsa") === "true"; } catch { return false; }
  });
  const [weightKg, setWeightKg] = useState(() => {
    try { return localStorage.getItem("ncd_gfr_weight") || ""; } catch { return ""; }
  });
  const [heightCm, setHeightCm] = useState(() => {
    try { return localStorage.getItem("ncd_gfr_height") || ""; } catch { return ""; }
  });

  const [result, setResult] = useState<number | null>(null);
  const [bsaAdjustedResult, setBsaAdjustedResult] = useState<number | null>(null);
  const [bsa, setBsa] = useState<number | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Auto-save
  useEffect(() => { localStorage.setItem("ncd_gfr_creatinine", creatinine); }, [creatinine]);
  useEffect(() => { localStorage.setItem("ncd_gfr_age", age); }, [age]);
  useEffect(() => { if (sex) localStorage.setItem("ncd_gfr_sex", sex); }, [sex]);
  useEffect(() => { localStorage.setItem("ncd_gfr_unit", unit); }, [unit]);
  useEffect(() => { localStorage.setItem("ncd_gfr_uacr", uacr); }, [uacr]);
  useEffect(() => { localStorage.setItem("ncd_gfr_uacr_unit", uacrUnit); }, [uacrUnit]);
  useEffect(() => { localStorage.setItem("ncd_gfr_adjust_bsa", adjustBsa ? "true" : "false"); }, [adjustBsa]);
  useEffect(() => { localStorage.setItem("ncd_gfr_weight", weightKg); }, [weightKg]);
  useEffect(() => { localStorage.setItem("ncd_gfr_height", heightCm); }, [heightCm]);

  const toggleUnit = () => {
    const crVal = parseFloat(creatinine);
    if (!isNaN(crVal) && crVal > 0) {
      if (unit === "mgdl") {
        setCreatinine((crVal * 88.42).toFixed(0));
      } else {
        setCreatinine((crVal * UMOL_TO_MGDL).toFixed(2));
      }
    }
    setUnit((prev) => (prev === "mgdl" ? "umol" : "mgdl"));
    setErrors((p) => ({ ...p, creatinine: "" }));
  };

  const toggleUacrUnit = () => {
    const uacrVal = parseFloat(uacr);
    if (!isNaN(uacrVal) && uacrVal > 0) {
      if (uacrUnit === "mg_g") {
        setUacr((uacrVal / 0.113).toFixed(0));
      } else {
        setUacr((uacrVal * 0.113).toFixed(0));
      }
    }
    setUacrUnit((prev) => (prev === "mg_g" ? "mg_mmol" : "mg_g"));
    setErrors((p) => ({ ...p, uacr: "" }));
  };

  const getCreatinineMgdl = (): number => {
    const val = parseFloat(creatinine);
    return unit === "umol" ? val * UMOL_TO_MGDL : val;
  };

  const getUacrMgG = (): number => {
    const val = parseFloat(uacr);
    return uacrUnit === "mg_mmol" ? val * 0.113 : val;
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    const crVal = parseFloat(creatinine);
    const maxVal = unit === "mgdl" ? 30 : 2652;

    if (!creatinine.trim() || isNaN(crVal) || crVal <= 0 || crVal > maxVal) {
      newErrors.creatinine = unit === "mgdl"
        ? "Enter valid creatinine (0.1-30 mg/dL)"
        : "Enter valid creatinine (9-2652 µmol/L)";
    }
    if (!age.trim() || isNaN(parseInt(age)) || parseInt(age) < 18 || parseInt(age) > 120) {
      newErrors.age = "Enter valid age (18-120)";
    }
    if (!sex) {
      newErrors.sex = "Select sex";
    }
    if (adjustBsa) {
      Object.assign(newErrors, validateBsaInputs(heightCm, weightKg));
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const calculate = () => {
    if (!validate()) return;
    const crMgdl = getCreatinineMgdl();
    const gfr = calculateCkdEpi(crMgdl, parseInt(age), sex!);
    setResult(gfr);

    let bsaValue: number | null = null;
    let bsaAdj: number | null = null;
    if (adjustBsa) {
      bsaValue = calculateMostellerBsa(parseFloat(weightKg), parseFloat(heightCm));
      bsaAdj = adjustEgfrForBsa(gfr, bsaValue);
      setBsa(roundTo(bsaValue, 2));
      setBsaAdjustedResult(roundTo(bsaAdj, 1));
    } else {
      setBsa(null);
      setBsaAdjustedResult(null);
    }

    const stageInfo = getGfrStage(gfr);
    
    // Calculate KDIGO staging if UACR is provided
    const uacrValue = uacr.trim() ? parseFloat(uacr) : null;
    let kdigoStage: string | undefined;
    let kdigoRisk: string | undefined;
    let uacrMgG: number | undefined;
    
    if (uacrValue !== null && !isNaN(uacrValue) && uacrValue > 0) {
      uacrMgG = getUacrMgG();
      const aStage = getAStage(uacrMgG);
      kdigoStage = `${stageInfo.stage}/${aStage.stage}`;
      const risk = getKdigoRisk(stageInfo.index, aStage.index);
      kdigoRisk = risk.label;
    }
    
    onResultChange?.({
      gfr,
      stage: stageInfo.stage,
      label: stageInfo.label,
      creatinine: crMgdl,
      age: parseInt(age),
      sex: sex!,
      uacr: uacrMgG,
      kdigoStage,
      kdigoRisk,
      bsa: bsaValue ?? undefined,
      bsaAdjustedGfr: bsaAdj ?? undefined,
      weightKg: adjustBsa ? parseFloat(weightKg) : undefined,
      heightCm: adjustBsa ? parseFloat(heightCm) : undefined,
    });
  };

  const reset = () => {
    setCreatinine("");
    setAge("");
    setSex(null);
    setUnit("mgdl");
    setUacr("");
    setUacrUnit("mg_g");
    setAdjustBsa(false);
    setWeightKg("");
    setHeightCm("");
    setResult(null);
    setBsa(null);
    setBsaAdjustedResult(null);
    setErrors({});
    onResultChange?.(null);
  };

  function handleSmartParse(values: Record<string, string>) {
    Object.entries(values).forEach(([key, value]) => {
      if (key === 'egfr') {
        // Will auto-calculate from creatinine
      } else if (key === 'creatinine') {
        setCreatinine(value);
      } else if (key === 'age') {
        setAge(value);
      }
    });
  }

  const stage = result !== null ? getGfrStage(result) : null;

  return (
    <>
      <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-muted/5">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Calculator className="h-5 w-5 text-primary" />
              <CardTitle className="text-xl">GFR Calculator (CKD-EPI 2021)</CardTitle>
            </div>
            {result !== null && (
              <Button variant="ghost" size="sm" onClick={reset} className="text-muted-foreground">
                <RotateCcw className="h-4 w-4 mr-1" />
                Reset
            </Button>
          )}
        </div>
        <p className="text-xs text-muted-foreground">Race-free CKD-EPI equation for adults ≥18 years</p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="gfr-creatinine" className="text-sm font-medium">
                Serum Creatinine ({unit === "mgdl" ? "mg/dL" : "µmol/L"})
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
              id="gfr-creatinine"
              type="number"
              step={unit === "mgdl" ? "0.01" : "1"}
              min={unit === "mgdl" ? "0.1" : "9"}
              max={unit === "mgdl" ? "30" : "2652"}
              placeholder={unit === "mgdl" ? "e.g. 1.2" : "e.g. 106"}
              value={creatinine}
              onChange={(e) => {
                setCreatinine(e.target.value);
                if (errors.creatinine) setErrors((p) => ({ ...p, creatinine: "" }));
              }}
              className={errors.creatinine ? "border-destructive" : ""}
            />
            {errors.creatinine && <p className="text-xs text-destructive">{errors.creatinine}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="gfr-age" className="text-sm font-medium">
              Age (years)
            </Label>
            <Input
              id="gfr-age"
              type="number"
              min="18"
              max="120"
              placeholder="e.g. 55"
              value={age}
              onChange={(e) => {
                setAge(e.target.value);
                if (errors.age) setErrors((p) => ({ ...p, age: "" }));
              }}
              className={errors.age ? "border-destructive" : ""}
            />
            {errors.age && <p className="text-xs text-destructive">{errors.age}</p>}
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Sex</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={sex === "male" ? "default" : "outline"}
                size="sm"
                className="flex-1"
                onClick={() => {
                  setSex("male");
                  if (errors.sex) setErrors((p) => ({ ...p, sex: "" }));
                }}
              >
                Male
              </Button>
              <Button
                type="button"
                variant={sex === "female" ? "default" : "outline"}
                size="sm"
                className="flex-1"
                onClick={() => {
                  setSex("female");
                  if (errors.sex) setErrors((p) => ({ ...p, sex: "" }));
                }}
              >
                Female
              </Button>
            </div>
            {errors.sex && <p className="text-xs text-destructive">{errors.sex}</p>}
          </div>
        </div>

        {/* Optional UACR input for KDIGO staging */}
        <div className="mt-4 p-3 rounded-lg bg-muted/30 border border-border/50">
          <div className="flex items-center gap-2 mb-3">
            <Info className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Optional: Add UACR for KDIGO G,A staging</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="gfr-uacr" className="text-sm font-medium">
                  UACR ({uacrUnit === "mg_g" ? "mg/g" : "mg/mmol"})
                </Label>
                <button
                  type="button"
                  onClick={toggleUacrUnit}
                  className="flex items-center gap-1 text-xs text-primary hover:underline font-medium"
                >
                  <ArrowLeftRight className="h-3 w-3" />
                  {uacrUnit === "mg_g" ? "mg/mmol" : "mg/g"}
                </button>
              </div>
              <Input
                id="gfr-uacr"
                type="number"
                step="1"
                min="0"
                placeholder={uacrUnit === "mg_g" ? "e.g. 30" : "e.g. 3"}
                value={uacr}
                onChange={(e) => {
                  setUacr(e.target.value);
                  if (errors.uacr) setErrors((p) => ({ ...p, uacr: "" }));
                }}
              />
              <p className="text-xs text-muted-foreground">Urine Albumin-to-Creatinine Ratio</p>
            </div>
            <div className="space-y-1.5 flex items-end">
              <p className="text-xs text-muted-foreground">
                <strong>A1:</strong> &lt;30 mg/g{" "}
                <strong className="ml-2">A2:</strong> 30–300 mg/g{" "}
                <strong className="ml-2">A3:</strong> &gt;300 mg/g
              </p>
            </div>
          </div>
        </div>

        <BsaAdjustmentFields
          enabled={adjustBsa}
          onEnabledChange={(next) => {
            setAdjustBsa(next);
            if (!next) {
              setBsa(null);
              setBsaAdjustedResult(null);
              setErrors((p) => ({ ...p, height: "", weight: "" }));
            }
          }}
          heightCm={heightCm}
          weightKg={weightKg}
          onHeightCmChange={(v) => {
            setHeightCm(v);
            if (errors.height) setErrors((p) => ({ ...p, height: "" }));
          }}
          onWeightKgChange={(v) => {
            setWeightKg(v);
            if (errors.weight) setErrors((p) => ({ ...p, weight: "" }));
          }}
          errors={{ height: errors.height, weight: errors.weight }}
          idPrefix="gfr-bsa"
        />

        <Button onClick={calculate} className="w-full sm:w-auto mt-4">
          <Calculator className="h-4 w-4 mr-2" />
          Calculate eGFR{uacr.trim() && " & KDIGO Stage"}
        </Button>

        {result !== null && stage && (
          <div className="mt-4 p-4 rounded-lg bg-card border-2 border-border">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <p className="text-sm text-muted-foreground">
                  Indexed eGFR (CKD-EPI 2021, per 1.73 m²)
                </p>
                <p className="text-3xl font-bold text-foreground">
                  {result} <span className="text-sm font-normal text-muted-foreground">mL/min/1.73m²</span>
                </p>
                {adjustBsa && bsaAdjustedResult !== null && bsa !== null && (
                  <div className="mt-3 pt-3 border-t border-border">
                    <p className="text-sm text-muted-foreground">
                      BSA-adjusted eGFR (absolute / unindexed)
                    </p>
                    <p className="text-xl font-semibold text-foreground">
                      {bsaAdjustedResult} <span className="text-sm font-normal text-muted-foreground">mL/min</span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Mosteller BSA {bsa} m² · indexed × (BSA / 1.73). Staging below uses the indexed value.
                    </p>
                  </div>
                )}
              </div>
              <div className="flex flex-col items-start sm:items-end gap-1">
                <Badge className={stage.color}>
                  Stage {stage.stage}
                </Badge>
                <span className="text-xs text-muted-foreground">{stage.label}</span>
              </div>
            </div>
            
            {/* KDIGO G,A staging when UACR provided */}
            {uacr.trim() && parseFloat(uacr) > 0 && !isNaN(parseFloat(uacr)) && (() => {
              const uacrMgG = getUacrMgG();
              const aStage = getAStage(uacrMgG);
              const risk = getKdigoRisk(stage.index, aStage.index);
              return (
                <div className="mt-4 pt-4 border-t border-border">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-semibold text-foreground">KDIGO Stage:</span>
                    <Badge className={"border " + aStage.color}>
                      {stage.stage}/{aStage.stage}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Albuminuria:</span>
                    <span className="text-sm font-medium">{aStage.label}</span>
                    <span className="text-xs text-muted-foreground">({uacrMgG.toFixed(0)} mg/g)</span>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-sm font-semibold">Risk:</span>
                    <Badge className={"border " + risk.color}>
                      {risk.label}
                    </Badge>
                  </div>
                </div>
              );
            })()}
            
            {result < 60 && (
              <p className="mt-3 text-xs text-destructive font-medium border-t border-border pt-3">
                ⚠️ GFR &lt; 60: Review renal dosing adjustments for all medications above
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
    </>
  );
}
