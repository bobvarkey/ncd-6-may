import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calculator, RotateCcw, ArrowLeftRight, AlertTriangle, Info, Copy, Download } from "lucide-react";
import { copyToClipboard, downloadTextFile, parseClinicalValue, roundClinical } from "@/lib/clinical-utils";

type CreatinineUnit = "mgdl" | "umol";
type Sex = "male" | "female" | null;
type UacrUnit = "mg_g" | "mg_mmol";

const UMOL_TO_MGDL = 1 / 88.42;

interface GStage {
  stage: string;
  label: string;
  gfrRange: string;
  color: string;
}

interface AStage {
  stage: string;
  label: string;
  uacrRange: string;
  color: string;
}

const G_STAGES: GStage[] = [
  { stage: "G1", label: "Normal or High", gfrRange: "≥90", color: "bg-success/20 text-success border-success/30" },
  { stage: "G2", label: "Mildly Decreased", gfrRange: "60–89", color: "bg-success/20 text-success border-success/30" },
  { stage: "G3a", label: "Mild–Moderate Decrease", gfrRange: "45–59", color: "bg-warning/20 text-warning border-yellow-500/30" },
  { stage: "G3b", label: "Moderate–Severe Decrease", gfrRange: "30–44", color: "bg-orange-100/20 text-orange-600 border-orange-400/30" },
  { stage: "G4", label: "Severely Decreased", gfrRange: "15–29", color: "bg-destructive/20 text-destructive border-destructive/30" },
  { stage: "G5", label: "Kidney Failure", gfrRange: "<15", color: "bg-destructive/30 text-destructive border-destructive/40" },
];

const A_STAGES: AStage[] = [
  { stage: "A1", label: "Normal–Mildly Increased", uacrRange: "<30 mg/g (<3 mg/mmol)", color: "bg-success/20 text-success border-success/30" },
  { stage: "A2", label: "Moderately Increased", uacrRange: "30–300 mg/g (3–30 mg/mmol)", color: "bg-warning/20 text-warning border-yellow-500/30" },
  { stage: "A3", label: "Severely Increased", uacrRange: ">300 mg/g (>30 mg/mmol)", color: "bg-destructive/20 text-destructive border-destructive/30" },
];

function getGStage(gfr: number): GStage {
  if (gfr >= 90) return G_STAGES[0];
  if (gfr >= 60) return G_STAGES[1];
  if (gfr >= 45) return G_STAGES[2];
  if (gfr >= 30) return G_STAGES[3];
  if (gfr >= 15) return G_STAGES[4];
  return G_STAGES[5];
}

function getAStage(uacrMgG: number): AStage {
  if (uacrMgG < 30) return A_STAGES[0];
  if (uacrMgG <= 300) return A_STAGES[1];
  return A_STAGES[2];
}

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

// KDIGO risk heatmap: rows = G stage index, cols = A stage index
// 0=low risk, 1=moderate, 2=high, 3=very high
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
  "bg-orange-100/20 text-orange-600 border-orange-400/30",
  "bg-destructive/20 text-destructive border-destructive/30",
];

export default function KDIGOStagingCalculator() {
  const [creatinine, setCreatinine] = useState(() => {
    try { return localStorage.getItem("ncd_kdigo_creatinine") || ""; } catch { return ""; }
  });
  const [age, setAge] = useState(() => {
    try { return localStorage.getItem("ncd_kdigo_age") || ""; } catch { return ""; }
  });
  const [sex, setSex] = useState<Sex>(() => {
    try { return localStorage.getItem("ncd_kdigo_sex") as Sex || null; } catch { return null; }
  });
  const [unit, setUnit] = useState<CreatinineUnit>(() => {
    try { return (localStorage.getItem("ncd_kdigo_unit") as CreatinineUnit) || "mgdl"; } catch { return "mgdl"; }
  });
  const [uacr, setUacr] = useState(() => {
    try { return localStorage.getItem("ncd_kdigo_uacr") || ""; } catch { return ""; }
  });
  const [uacrUnit, setUacrUnit] = useState<UacrUnit>(() => {
    try { return (localStorage.getItem("ncd_kdigo_uacr_unit") as UacrUnit) || "mg_g"; } catch { return "mg_g"; }
  });
  const [gfr, setGfr] = useState<number | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => { localStorage.setItem("ncd_kdigo_creatinine", creatinine); }, [creatinine]);
  useEffect(() => { localStorage.setItem("ncd_kdigo_age", age); }, [age]);
  useEffect(() => { if (sex) localStorage.setItem("ncd_kdigo_sex", sex); }, [sex]);
  useEffect(() => { localStorage.setItem("ncd_kdigo_unit", unit); }, [unit]);
  useEffect(() => { localStorage.setItem("ncd_kdigo_uacr", uacr); }, [uacr]);
  useEffect(() => { localStorage.setItem("ncd_kdigo_uacr_unit", uacrUnit); }, [uacrUnit]);

  const toggleUnit = () => {
    const crVal = parseClinicalValue(creatinine);
    if (crVal !== null && crVal > 0) {
      if (unit === "mgdl") setCreatinine(roundClinical(crVal * 88.42, 0).toString());
      else setCreatinine(roundClinical(crVal * UMOL_TO_MGDL, 2).toString());
    }
    setUnit((prev) => (prev === "mgdl" ? "umol" : "mgdl"));
    setErrors((p) => ({ ...p, creatinine: "" }));
  };

  const getCreatinineMgdl = (): number => {
    const val = parseClinicalValue(creatinine) || 0;
    return unit === "umol" ? val * UMOL_TO_MGDL : val;
  };

  const getUacrMgG = (): number => {
    const val = parseClinicalValue(uacr) || 0;
    return uacrUnit === "mg_mmol" ? val * 10 : val;
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    const crVal = parseClinicalValue(creatinine);
    const maxCr = unit === "mgdl" ? 30 : 2652;
    if (crVal === null || crVal <= 0 || crVal > maxCr) {
      newErrors.creatinine = unit === "mgdl" ? "Enter valid creatinine (0.1–30 mg/dL)" : "Enter valid creatinine (9–2652 µmol/L)";
    }
    const ageVal = parseClinicalValue(age);
    if (ageVal === null || ageVal < 18 || ageVal > 120) {
      newErrors.age = "Enter valid age (18–120)";
    }
    if (!sex) newErrors.sex = "Select sex";
    if (uacr.trim()) {
      const uVal = parseClinicalValue(uacr);
      if (uVal === null || uVal < 0 || uVal > (uacrUnit === "mg_g" ? 5000 : 500)) {
        newErrors.uacr = uacrUnit === "mg_g" ? "Enter valid UACR (0–5000 mg/g)" : "Enter valid UACR (0–500 mg/mmol)";
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const calculate = () => {
    if (!validate()) return;
    const crMgdl = getCreatinineMgdl();
    const gfrVal = calculateCkdEpi(crMgdl, parseInt(age), sex!);
    setGfr(gfrVal);
  };

  const reset = () => {
    setCreatinine("");
    setAge("");
    setSex(null);
    setUnit("mgdl");
    setUacr("");
    setUacrUnit("mg_g");
    setGfr(null);
    setErrors({});
  };

  const gStage = gfr !== null ? getGStage(gfr) : null;
  const uacrMgG = uacr.trim() ? getUacrMgG() : null;
  const aStage = uacrMgG !== null ? getAStage(uacrMgG) : null;
  const riskLevel = gfr !== null && uacrMgG !== null
    ? RISK_MATRIX[G_STAGES.indexOf(gStage!)][A_STAGES.indexOf(aStage!)]
    : null;

  const buildSummary = () => {
    const lines: string[] = [];
    lines.push("--- KDIGO CKD Assessment ---");
    if (gfr !== null && gStage) {
      lines.push(`eGFR: ${gfr} mL/min/1.73m² (${gStage.stage}: ${gStage.label})`);
    }
    if (uacrMgG !== null && aStage) {
      lines.push(`UACR: ${roundClinical(uacrMgG, 0)} mg/g (${aStage.stage}: ${aStage.label})`);
    }
    if (riskLevel !== null && gStage && aStage) {
      lines.push(`KDIGO Category: ${gStage.stage}${aStage.stage} (${RISK_LABELS[riskLevel]})`);
    }
    lines.push(`Date: ${new Date().toLocaleDateString()}`);
    return lines.join("\n");
  };


  return (
    <div className="space-y-4">
      <div className="pb-3">
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            CKD-EPI 2021 (race-free) + UACR — KDIGO 2024 GA staging
          </p>
          {gfr !== null && (
            <Button variant="ghost" size="sm" onClick={reset} className="text-muted-foreground h-7 px-2">
              <RotateCcw className="h-3.5 w-3.5 mr-1" /> Reset
            </Button>
          )}
        </div>
      </div>
      <div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          {/* Creatinine */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="kdigo-creatinine" className="text-sm font-medium">
                Creatinine ({unit === "mgdl" ? "mg/dL" : "µmol/L"})
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
              id="kdigo-creatinine"
              type="text"
              inputMode="decimal"
              min={unit === "mgdl" ? "0.1" : "9"}
              max={unit === "mgdl" ? "30" : "2652"}
              placeholder={unit === "mgdl" ? "e.g. 1.2" : "e.g. 106"}
              value={creatinine}
              onChange={(e) => { setCreatinine(e.target.value); if (errors.creatinine) setErrors(p => ({ ...p, creatinine: "" })); }}
              className={errors.creatinine ? "border-destructive" : ""}
            />
            {errors.creatinine && <p className="text-xs text-destructive">{errors.creatinine}</p>}
          </div>

          {/* Age */}
          <div className="space-y-1.5">
            <Label htmlFor="kdigo-age" className="text-sm font-medium">Age (years)</Label>
            <Input
              id="kdigo-age"
              type="text"
              inputMode="decimal"
              placeholder="e.g. 55"
              value={age}
              onChange={(e) => { setAge(e.target.value); if (errors.age) setErrors(p => ({ ...p, age: "" })); }}
              className={errors.age ? "border-destructive" : ""}
            />
            {errors.age && <p className="text-xs text-destructive">{errors.age}</p>}
          </div>

          {/* Sex */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Sex</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={sex === "male" ? "default" : "outline"}
                size="sm"
                className="flex-1"
                onClick={() => { setSex("male"); if (errors.sex) setErrors(p => ({ ...p, sex: "" })); }}
              >Male</Button>
              <Button
                type="button"
                variant={sex === "female" ? "default" : "outline"}
                size="sm"
                className="flex-1"
                onClick={() => { setSex("female"); if (errors.sex) setErrors(p => ({ ...p, sex: "" })); }}
              >Female</Button>
            </div>
            {errors.sex && <p className="text-xs text-destructive">{errors.sex}</p>}
          </div>

          {/* UACR */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="kdigo-uacr" className="text-sm font-medium">
                UACR ({uacrUnit === "mg_g" ? "mg/g" : "mg/mmol"})
              </Label>
              <button
                type="button"
                onClick={() => {
                  const val = parseClinicalValue(uacr);
                  if (val !== null && val > 0) {
                    setUacr(uacrUnit === "mg_g" ? roundClinical(val / 10, 1).toString() : roundClinical(val * 10, 0).toString());
                  }
                  setUacrUnit(prev => prev === "mg_g" ? "mg_mmol" : "mg_g");
                }}
                className="flex items-center gap-1 text-xs text-primary hover:underline font-medium"
              >
                <ArrowLeftRight className="h-3 w-3" />
                {uacrUnit === "mg_g" ? "mg/mmol" : "mg/g"}
              </button>
            </div>
            <Input
              id="kdigo-uacr"
              type="text"
              inputMode="decimal"
              min="0"
              max={uacrUnit === "mg_g" ? "5000" : "500"}
              placeholder={uacrUnit === "mg_g" ? "e.g. 30" : "e.g. 3"}
              value={uacr}
              onChange={(e) => { setUacr(e.target.value); if (errors.uacr) setErrors(p => ({ ...p, uacr: "" })); }}
              className={errors.uacr ? "border-destructive" : ""}
            />
            {errors.uacr && <p className="text-xs text-destructive">{errors.uacr}</p>}
          </div>
        </div>

        <Button onClick={calculate} className="w-full sm:w-auto">
          <Calculator className="h-4 w-4 mr-2" />
          Calculate eGFR &amp; KDIGO Stage
        </Button>

        {/* Results */}
        {gfr !== null && gStage && (
          <div className="mt-4 space-y-3">
            {/* eGFR + G stage */}
            <div className="p-4 rounded-lg bg-card border-2 border-border select-all">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <p className="text-sm text-muted-foreground">Estimated GFR (CKD-EPI 2021)</p>
                  <p className="text-3xl font-bold text-foreground">
                    {roundClinical(gfr, 1)} <span className="text-sm font-normal text-muted-foreground">mL/min/1.73m²</span>
                  </p>
                </div>
                <div className="flex flex-col items-start sm:items-end gap-1">
                  <Badge className={gStage.color}>
                    {gStage.stage} — {gStage.label}
                  </Badge>
                  <span className="text-xs text-muted-foreground">eGFR {gStage.gfrRange}</span>
                </div>
              </div>
            </div>

            {/* UACR + A stage */}
            {uacrMgG !== null && aStage && (
              <div className="p-4 rounded-lg bg-card border-2 border-border select-all">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Urine Albumin-to-Creatinine Ratio</p>
                    <p className="text-3xl font-bold text-foreground">
                      {roundClinical(uacrMgG, 0)} <span className="text-sm font-normal text-muted-foreground">mg/g</span>
                    </p>
                  </div>
                  <div className="flex flex-col items-start sm:items-end gap-1">
                    <Badge className={aStage.color}>
                      {aStage.stage} — {aStage.label}
                    </Badge>
                    <span className="text-xs text-muted-foreground">UACR {aStage.uacrRange}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Combined KDIGO Risk */}
            {uacrMgG !== null && riskLevel !== null && (
              <div className={`p-4 rounded-lg border-2 select-all ${RISK_COLORS[riskLevel]}`}>
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="text-sm font-semibold">KDIGO Risk Category</span>
                </div>
                <p className="text-lg font-bold">
                  {gStage!.stage}{aStage!.stage} — {RISK_LABELS[riskLevel]}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Based on eGFR {gStage!.stage} ({roundClinical(gfr, 1)} mL/min/1.73m²) × UACR {aStage!.stage} ({roundClinical(uacrMgG, 0)} mg/g)
                </p>
              </div>
            )}

            {/* KDIGO Heatmap */}
            {uacrMgG !== null && (
              <details className="text-sm">
                <summary className="cursor-pointer text-primary font-medium hover:underline">
                  <Info className="h-3.5 w-3.5 inline mr-1" />
                  KDIGO Prognostic Heatmap
                </summary>
                <div className="mt-2 overflow-x-auto">
                  <table className="w-full text-xs border-collapse">
                    <thead>
                      <tr>
                        <th className="p-1.5 text-left font-medium text-muted-foreground">eGFR</th>
                        <th className="p-1.5 text-center font-medium text-muted-foreground">A1</th>
                        <th className="p-1.5 text-center font-medium text-muted-foreground">A2</th>
                        <th className="p-1.5 text-center font-medium text-muted-foreground">A3</th>
                      </tr>
                    </thead>
                    <tbody>
                      {G_STAGES.map((g, gi) => (
                        <tr key={g.stage} className={g.stage === gStage!.stage ? "ring-1 ring-primary" : ""}>
                          <td className={`p-1.5 font-medium ${g.stage === gStage!.stage ? "text-primary" : ""}`}>
                            {g.stage} ({g.gfrRange})
                          </td>
                          {A_STAGES.map((a, ai) => {
                            const r = RISK_MATRIX[gi][ai];
                            const isActive = g.stage === gStage!.stage && a.stage === aStage!.stage;
                            return (
                              <td
                                key={a.stage}
                                className={`p-1.5 text-center rounded ${RISK_COLORS[r]} ${isActive ? "ring-2 ring-primary font-bold" : ""}`}
                              >
                                {RISK_LABELS[r]}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Green = Low risk · Yellow = Moderate risk · Orange = High risk · Red = Very high risk
                </p>
              </details>
            )}

            <div className="flex flex-wrap gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(buildSummary(), "KDIGO Results")}
              >
                <Copy className="h-3.5 w-3.5 mr-1.5" /> Copy results
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => downloadTextFile("kdigo-assessment.txt", buildSummary())}
              >
                <Download className="h-3.5 w-3.5 mr-1.5" /> Download report
              </Button>
            </div>

            {gfr < 60 && (
              <p className="text-xs text-destructive font-medium border-t border-border pt-2">
                ⚠️ eGFR &lt; 60: Review renal dosing adjustments for all medications
              </p>
            )}

            {/* KDIGO Staging Reference Image */}
            <div className="mt-4 rounded-lg overflow-hidden border border-border">
              <img
                src="/kdigo-staging-reference.jpg"
                alt="KDIGO Staging Reference"
                className="w-full h-auto"
              />
              <p className="text-[10px] text-muted-foreground text-center py-1.5 bg-muted/30">
                KDIGO Staging Reference — GA Classification &amp; Risk Heatmap
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
