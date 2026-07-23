import { useState, useEffect } from "react";
import { AbbrText } from "@/components/AbbreviationHover";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";


import {
  Calculator,
  ShieldAlert,
  AlertTriangle,
  RotateCcw,
  ArrowLeftRight,
  Stethoscope,
  Info,
} from "lucide-react";

// Category colors for hypertension (orange theme)
const categoryColors = {
  accent: "#fb923c",
  bg: "rgba(251,146,60,0.12)",
  border: "rgba(251,146,60,0.2)",
};

// ===== GFR CALCULATOR =====
type CreatinineUnit = "mgdl" | "umol";
type Sex = "male" | "female" | null;

const UMOL_TO_MGDL = 1 / 88.42;

interface GfrResult {
  gfr: number;
  stage: string;
  label: string;
  color: string;
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

function getGfrStage(gfr: number): GfrResult {
  if (gfr >= 90) return { gfr, stage: "G1", label: "Normal or High", color: "bg-emerald-500/20 text-success border-emerald-500/30" };
  if (gfr >= 60) return { gfr, stage: "G2", label: "Mildly Decreased", color: "bg-emerald-500/20 text-success border-emerald-500/30" };
  if (gfr >= 45) return { gfr, stage: "G3a", label: "Mild-Moderate Decrease", color: "bg-warning/20 text-warning border-yellow-500/30" };
  if (gfr >= 30) return { gfr, stage: "G3b", label: "Moderate-Severe Decrease", color: "bg-warning/100/20 text-warning border-warning/30" };
  if (gfr >= 15) return { gfr, stage: "G4", label: "Severely Decreased", color: "bg-destructive/100/20 text-destructive border-red-500/30" };
  return { gfr, stage: "G5", label: "Kidney Failure", color: "bg-destructive/20 text-destructive border-destructive/30" };
}

// ===== DRUG INTERACTION CHECKER =====
const drugList = [
  { id: "losartan", name: "Losartan", group: "ARB" },
  { id: "telmisartan", name: "Telmisartan", group: "ARB" },
  { id: "enalapril", name: "Enalapril", group: "ACEi" },
  { id: "ramipril", name: "Ramipril", group: "ACEi" },
  { id: "atenolol", name: "Atenolol", group: "Beta-blocker" },
  { id: "metoprolol", name: "Metoprolol", group: "Beta-blocker" },
  { id: "labetalol", name: "Labetalol", group: "Beta-blocker" },
  { id: "carvedilol", name: "Carvedilol", group: "Beta-blocker" },
  { id: "amlodipine", name: "Amlodipine", group: "CCB" },
  { id: "nifedipine", name: "Nifedipine", group: "CCB" },
  { id: "hctz", name: "Hydrochlorothiazide", group: "Thiazide" },
  { id: "chlorthalidone", name: "Chlorthalidone", group: "Thiazide" },
  { id: "furosemide", name: "Furosemide", group: "Loop" },
  { id: "spironolactone", name: "Spironolactone", group: "K-sparing" },
  { id: "eplerenone", name: "Eplerenone", group: "K-sparing" },
  { id: "prazosin", name: "Prazosin", group: "Alpha-blocker" },
  { id: "clonidine", name: "Clonidine", group: "Central" },
  { id: "moxonidine", name: "Moxonidine", group: "Central" },
  { id: "methyldopa", name: "Methyldopa", group: "Central" },
];

type Severity = "critical" | "major" | "moderate";

interface Interaction {
  drugs: [string, string];
  severity: Severity;
  description: string;
  mechanism: string;
  recommendation: string;
}

const interactions: Interaction[] = [
  {
    drugs: ["ACEi", "ARB"],
    severity: "critical",
    description: "Dual RAAS blockade — increased risk of hyperkalemia, renal failure, and hypotension",
    mechanism: "Both block the renin-angiotensin system at different points, causing excessive suppression",
    recommendation: "AVOID combination. ONTARGET trial showed harm with no benefit. Use one agent only.",
  },
  {
    drugs: ["ACEi", "K-sparing"],
    severity: "critical",
    description: "Severe hyperkalemia risk — potentially life-threatening",
    mechanism: "ACEi reduces aldosterone → K⁺ retention; K-sparing diuretics further block K⁺ excretion",
    recommendation: "If combination unavoidable (e.g., HFrEF), monitor K⁺ within 1 week, then every 1-3 months. Avoid if GFR < 30.",
  },
  {
    drugs: ["ARB", "K-sparing"],
    severity: "critical",
    description: "Severe hyperkalemia risk — potentially life-threatening",
    mechanism: "ARB reduces aldosterone → K⁺ retention; K-sparing diuretics further block K⁺ excretion",
    recommendation: "If combination unavoidable, monitor K⁺ within 1 week, then every 1-3 months. Avoid if GFR < 30.",
  },
  {
    drugs: ["Beta-blocker", "Central"],
    severity: "major",
    description: "Rebound hypertensive crisis if central agent stopped abruptly",
    mechanism: "Beta-blockers block compensatory vasodilation during clonidine/moxonidine withdrawal, worsening rebound hypertension",
    recommendation: "If discontinuing, taper central agent FIRST over 1-2 weeks, then taper beta-blocker. Never stop central agent abruptly.",
  },
  {
    drugs: ["K-sparing", "K-sparing"],
    severity: "critical",
    description: "Life-threatening hyperkalemia",
    mechanism: "Additive potassium retention from dual blockade of K⁺ excretion",
    recommendation: "NEVER combine two potassium-sparing diuretics. Choose one agent.",
  },
  {
    drugs: ["Loop", "ACEi"],
    severity: "moderate",
    description: "First-dose hypotension risk; potential for acute kidney injury in volume-depleted patients",
    mechanism: "Diuretic-induced volume depletion amplifies the hypotensive effect of ACEi initiation",
    recommendation: "Consider holding or reducing diuretic 24-48 hours before starting ACEi. Start ACEi at lowest dose. Monitor renal function.",
  },
  {
    drugs: ["Thiazide", "ACEi"],
    severity: "moderate",
    description: "Enhanced hypotension on initiation; beneficial combination long-term",
    mechanism: "Thiazide-induced volume contraction activates RAAS, which is then blocked by ACEi",
    recommendation: "Commonly used and effective combination. Start ACEi at low dose if already on thiazide. Monitor electrolytes.",
  },
];

function getGroup(drugId: string): string {
  return drugList.find((d) => d.id === drugId)?.group ?? "";
}

function findInteractions(selectedIds: string[]): Interaction[] {
  const results: Interaction[] = [];
  const seen = new Set<string>();

  for (let i = 0; i < selectedIds.length; i++) {
    for (let j = i + 1; j < selectedIds.length; j++) {
      const gA = getGroup(selectedIds[i]);
      const gB = getGroup(selectedIds[j]);

      for (const ix of interactions) {
        const [g1, g2] = ix.drugs;
        if ((gA === g1 && gB === g2) || (gA === g2 && gB === g1)) {
          const key = [selectedIds[i], selectedIds[j]].sort().join("-") + ix.description;
          if (!seen.has(key)) {
            seen.add(key);
            results.push(ix);
          }
        }
      }
    }
  }

  const order: Record<Severity, number> = { critical: 0, major: 1, moderate: 2 };
  results.sort((a, b) => order[a.severity] - order[b.severity]);
  return results;
}

const groupedDrugs = drugList.reduce<Record<string, typeof drugList>>((acc, drug) => {
  if (!acc[drug.group]) acc[drug.group] = [];
  acc[drug.group].push(drug);
  return acc;
}, {});

const severityConfig: Record<Severity, { label: string; color: string; borderClass: string }> = {
  critical: {
    label: "CRITICAL",
    color: "bg-destructive/20 text-destructive border-destructive/30",
    borderClass: "border-destructive/40 bg-destructive/5",
  },
  major: {
    label: "MAJOR",
    color: "bg-warning/100/20 text-warning border-warning/30",
    borderClass: "border-warning/30 bg-warning/100/5",
  },
  moderate: {
    label: "MODERATE",
    color: "bg-warning/20 text-warning border-yellow-500/30",
    borderClass: "border-yellow-500/30 bg-warning/5",
  },
};

// ===== SECONDARY HTN CHECKLIST =====
interface SecondaryHtnItem {
  id: string;
  category: string;
  feature: string;
  workup: string;
}

const secondaryHtnChecklist: SecondaryHtnItem[] = [
  {
    id: "young_onset",
    category: "Clinical",
    feature: "Onset < 30 years without family history",
    workup: "Comprehensive secondary HTN screen",
  },
  {
    id: "resistant",
    category: "Clinical",
    feature: "Resistant HTN (≥ 3 drugs including diuretic)",
    workup: "Consider primary aldosteronism, renal artery stenosis",
  },
  {
    id: "sudden_severe",
    category: "Clinical",
    feature: "Sudden onset severe HTN in older patient",
    workup: "Renal artery stenosis evaluation (MRA/CTA)",
  },
  {
    id: "hypokalemia",
    category: "Laboratory",
    feature: "Hypokalemia with normal/high sodium",
    workup: "Aldosterone-renin ratio (ARR) — consider Liddle syndrome if ARR normal/low",
  },
  {
    id: "liddle",
    category: "Family",
    feature: "Early-onset hypertension with low renin & aldosterone, +/- hypokalemia",
    workup: "Genetic testing for ENaC mutations (SCNN1B/SCNN1G)",
  },
  {
    id: "liddle_labs",
    category: "Laboratory",
    feature: "Hypokalemic metabolic alkalosis + low renin + LOW aldosterone (vs Conn's)",
    workup: "Serial K+, renin, aldosterone. Trial amiloride responsive — confirms",
  },
  {
    id: "liddle_treatment",
    category: "Treatment",
    feature: "Resistant HTN with hypokalemia — spironolactone unresponsive",
    workup: "Trial amiloride/triamterene (ENaC blocker) — responds if Liddle's",
  },
  {
    id: "flash_pulm",
    category: "Clinical",
    feature: "Flash pulmonary edema",
    workup: "Bilateral renal artery stenosis evaluation",
  },
  {
    id: "adrenal_mass",
    category: "Radiology",
    feature: "Adrenal incidentaloma",
    workup: "Hormonal workup for pheochromocytoma, aldosteronism, Cushing's",
  },
  {
    id: "episodic_htn",
    category: "Symptoms",
    feature: "Episodic hypertension with sweating, palpitations, headache",
    workup: "Plasma free or urinary fractionated metanephrines",
  },
  {
    id: "cushing_features",
    category: "Physical",
    feature: "Central obesity, striae, proximal myopathy",
    workup: "Overnight dexamethasone suppression test",
  },
  {
    id: "osl",
    category: "History",
    feature: "Loud snoring, daytime somnolence",
    workup: "Polysomnography for OSA",
  },
  {
    id: "kidney_size_diff",
    category: "Radiology",
    feature: "Asymmetric kidney size (> 1.5 cm difference)",
    workup: "Doppler ultrasound or MRA for RAS",
  },
];

export default function HypertensionAssessment() {
  // GFR Calculator State
  const [creatinine, setCreatinine] = useState("");
  const [age, setAge] = useState("");
  const [sex, setSex] = useState<Sex>(null);
  const [unit, setUnit] = useState<CreatinineUnit>("mgdl");
  const [gfrResult, setGfrResult] = useState<GfrResult | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Drug Interaction State
  const [selectedDrugs, setSelectedDrugs] = useState<Set<string>>(new Set());
  const [interactionResults, setInteractionResults] = useState<Interaction[]>([]);

  // Secondary HTN Checklist State
  const [checkedSecondary, setCheckedSecondary] = useState<Set<string>>(new Set());

  // GFR Functions
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

  const getCreatinineMgdl = (): number => {
    const val = parseFloat(creatinine);
    return unit === "umol" ? val * UMOL_TO_MGDL : val;
  };

  const validateGfr = (): boolean => {
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
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const calculateGfr = () => {
    if (!validateGfr()) return;
    const crMgdl = getCreatinineMgdl();
    const gfr = calculateCkdEpi(crMgdl, parseInt(age), sex!);
    setGfrResult(getGfrStage(gfr));
  };

  const resetGfr = () => {
    setCreatinine("");
    setAge("");
    setSex(null);
    setUnit("mgdl");
    setGfrResult(null);
    setErrors({});
  };

  // Drug Interaction Functions
  const toggleDrug = (id: string) => {
    setSelectedDrugs((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  useEffect(() => {
    const selectedArray = Array.from(selectedDrugs);
    if (selectedArray.length >= 2) {
      setInteractionResults(findInteractions(selectedArray));
    } else {
      setInteractionResults([]);
    }
  }, [selectedDrugs]);

  const resetDrugs = () => {
    setSelectedDrugs(new Set());
    setInteractionResults([]);
  };

  // Secondary HTN Functions
  const toggleSecondary = (id: string) => {
    setCheckedSecondary((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const checkedCount = checkedSecondary.size;
  const screeningRecommended = checkedCount >= 3;

  return (
    <div className="space-y-6">
      {/* GFR Calculator */}
      <Card className="border-2 border-warning/20">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calculator className="h-5 w-5" style={{ color: categoryColors.accent }} />
              <CardTitle className="text-lg">GFR Calculator (CKD-EPI 2021)</CardTitle>
            </div>
            {gfrResult && (
              <Button variant="ghost" size="sm" onClick={resetGfr}>
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
                <Label htmlFor="creatinine" className="text-sm font-medium">
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
                id="creatinine"
                type="number"
                step={unit === "mgdl" ? "0.01" : "1"}
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
              <Label className="text-sm font-medium">Age (years)</Label>
              <Input
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

          <Button onClick={calculateGfr} className="w-full sm:w-auto">
            <Calculator className="h-4 w-4 mr-2" />
            Calculate eGFR
          </Button>

          {gfrResult && (
            <div className="mt-4 p-4 rounded-lg bg-card border-2 border-border">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <p className="text-sm text-muted-foreground">Estimated GFR</p>
                  <p className="text-3xl font-bold text-foreground">
                    {gfrResult.gfr} <span className="text-sm font-normal text-muted-foreground">mL/min/1.73m²</span>
                  </p>
                </div>
                <div className="flex flex-col items-start sm:items-end gap-1">
                  <Badge variant="outline" className={gfrResult.color}>
                    Stage {gfrResult.stage}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{gfrResult.label}</span>
                </div>
              </div>
              {gfrResult.gfr < 60 && (
                <Alert className="mt-3 border-amber-500/30 bg-warning/100/5">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  <AlertDescription className="text-warning text-sm">
                    GFR &lt; 60: Review renal dosing adjustments for all medications
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Secondary Hypertension Checklist */}
      <Card className="border-2 border-warning/20">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Stethoscope className="h-5 w-5" style={{ color: categoryColors.accent }} />
            <CardTitle className="text-lg">Secondary Hypertension Screening Checklist</CardTitle>
          </div>
          <p className="text-xs text-muted-foreground">
            Check features that suggest secondary causes of hypertension
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {secondaryHtnChecklist.map((item) => (
              <div
                key={item.id}
                className={`p-3 rounded-lg border transition-colors cursor-pointer ${
                  checkedSecondary.has(item.id)
                    ? "bg-warning/100/5 border-warning/30"
                    : "border-border/50 hover:border-warning/20"
                }`}
                onClick={() => toggleSecondary(item.id)}
              >
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={checkedSecondary.has(item.id)}
                    onCheckedChange={() => {}}
                    className="mt-0.5"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-muted-foreground uppercase">{item.category}</span>
                    </div>
                    <p className="text-sm font-medium">{item.feature}</p>
                    {checkedSecondary.has(item.id) && (
                      <div className="mt-2 p-2 rounded bg-muted/50 border border-border/50">
                        <p className="text-xs text-muted-foreground">
                          <span className="font-medium">Recommended Workup:</span> {item.workup}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <Separator className="my-4" />

          <div
            className={`p-4 rounded-lg border ${
              screeningRecommended
                ? "bg-destructive/5 border-destructive/30"
                : "bg-muted/30 border-border/50"
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <Info className="h-4 w-4" style={{ color: screeningRecommended ? "#ef4444" : categoryColors.accent }} />
              <span className="text-sm font-medium">Assessment Summary</span>
            </div>
            <p className="text-sm text-muted-foreground">
              {checkedCount} features checked. {" "}
              {screeningRecommended ? (
                <span className="text-destructive font-medium">
                  Secondary hypertension screening strongly recommended.
                </span>
              ) : (
                <span>Check more features if clinical suspicion remains.</span>
              )}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Drug Interaction Checker */}

      <Card className="border-2 border-warning/20">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5" style={{ color: categoryColors.accent }} />
              <CardTitle className="text-lg">Drug Interaction Checker</CardTitle>
            </div>
            {selectedDrugs.size > 0 && (
              <Button variant="ghost" size="sm" onClick={resetDrugs}>
                <RotateCcw className="h-4 w-4 mr-1" />
                Clear
              </Button>
            )}
          </div>
          <p className="text-xs text-muted-foreground">Select 2 or more medications to check for dangerous combinations</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {Object.entries(groupedDrugs).map(([group, drugs]) => (
              <div key={group} className="space-y-1.5">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{group}</p>
                {drugs.map((drug) => (
                  <label
                    key={drug.id}
                    className={`flex items-center space-x-2 p-1.5 rounded-md cursor-pointer transition-colors text-sm ${
                      selectedDrugs.has(drug.id) ? "bg-warning/100/10 text-warning font-medium" : "hover:bg-muted/50"
                    }`}
                  >
                    <Checkbox
                      checked={selectedDrugs.has(drug.id)}
                      onCheckedChange={() => toggleDrug(drug.id)}
                      className="h-4 w-4"
                    />
                    <span><AbbrText text={drug.name} /></span>
                  </label>
                ))}
              </div>
            ))}
          </div>

          {selectedDrugs.size >= 2 && (
            <div className="border-t border-border pt-4 mt-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground">
                  Interaction Results ({selectedDrugs.size} drugs selected)
                </h3>
                {interactionResults.length === 0 && (
                  <Badge variant="outline" className="bg-emerald-500/20 text-success border-emerald-500/30">
                    No interactions found
                  </Badge>
                )}
              </div>

              {interactionResults.length > 0 && (
                <div className="space-y-3">
                  {interactionResults.map((interaction, i) => {
                    const config = severityConfig[interaction.severity];
                    return (
                      <div key={i} className={`p-3 rounded-lg border-2 ${config.borderClass}`}>
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4" />
                            <span className="font-semibold text-sm">
                              {interaction.drugs[0]} + {interaction.drugs[1]}
                            </span>
                          </div>
                          <Badge variant="outline" className={config.color}>{config.label}</Badge>
                        </div>
                        <p className="text-sm text-foreground mb-2">{interaction.description}</p>
                        <div className="space-y-1 text-xs text-muted-foreground">
                          <p><span className="font-medium text-foreground">Mechanism:</span> {interaction.mechanism}</p>
                          <p><span className="font-medium text-foreground">Recommendation:</span> {interaction.recommendation}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>


    </div>
  );
}
