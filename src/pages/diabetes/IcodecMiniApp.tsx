import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { AlertTriangle, Syringe, Activity, Shield, TrendingUp, TrendingDown, Minus, AlertCircle, Info, Clock, Droplets, Brain, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

// ─── Types ───
type PriorBasalType = "none" | "od_basal" | "bid_basal" | "pump";
type StackRisk = "low" | "moderate" | "high";
type ChangeCategory = "up_20" | "up_10" | "no_change" | "no_change_or_consider_-10" | "down_10" | "down_20";
type BolusAdvice = "no_change" | "reduce_10pct" | "review_with_clinician";

interface PatientInputs {
  age: string;
  weight: string;
  egfr: string;
  pregnant: boolean;
  severeHypoHistory: boolean;
  priorBasalType: PriorBasalType;
  priorDailyUnits: string;
  priorBasalName: string;
  onBolus: boolean;
  bolusUnits: string;
}

interface CourseInputs {
  weekNumber: string;
  lastDose: string;
  useLoading: boolean;
}

interface CGMInputs {
  windowDays: string;
  nocturnalMean: string;
  tir: string;
  tbr54_69: string;
  tbrLt54: string;
  tarGt180: string;
  nocturnalMin: string;
  nocturnalDownward: boolean;
  dataCompleteness: string;
}

interface SMBGInputs {
  fasting1: string;
  fasting2: string;
  fasting3: string;
}

interface IcodecOutput {
  nextDose: number | null;
  doseDelta: number | null;
  changeCategory: ChangeCategory | null;
  stackRisk: StackRisk | null;
  bolusAdvice: BolusAdvice | null;
  monitoringDays: number[];
  warnings: string[];
  explanation: string;
}

// ─── Initiation Rules ───
function computeInitiationDose(p: PatientInputs, c: CourseInputs): { dose: number; loading: boolean; highRisk: boolean; explanation: string } {
  const wt = parseFloat(p.weight) || 0;
  const dailyU = parseFloat(p.priorDailyUnits) || 0;

  if (p.priorBasalType === "none") {
    return { dose: 70, loading: false, highRisk: false, explanation: "Insulin-naïve: start 70 U once weekly. No loading dose to minimize early stack risk." };
  }

  if (p.priorBasalType === "od_basal") {
    const dosePerKg = wt > 0 ? dailyU / wt : 0;
    const highRisk = p.severeHypoHistory || dosePerKg > 0.7;

    if (c.useLoading && !highRisk) {
      const loadingDose = Math.round(10.5 * dailyU);
      return {
        dose: loadingDose,
        loading: true,
        highRisk: false,
        explanation: `Loading strategy: 10.5 × ${dailyU} U = ${loadingDose} U (7× + 50% once). Week 2: ${7 * dailyU} U. Never repeat loading. Up-titration blocked weeks 1–2.`
      };
    }

    if (highRisk) {
      const dose = 6 * dailyU;
      return {
        dose,
        loading: false,
        highRisk: true,
        explanation: `High-risk switch: 6 × ${dailyU} U = ${dose} U. Cap at 6× daily dose. No loading. Emphasise CGM and early down-titration if lows occur.`
      };
    }

    const dose = 7 * dailyU;
    return {
      dose,
      loading: false,
      highRisk: false,
      explanation: `Switch from daily: 7 × ${dailyU} U = ${dose} U. No loading. Stop daily basal on day of first icodec injection.`
    };
  }

  // bid_basal or pump — conservative
  const dose = Math.round(6 * dailyU);
  return {
    dose,
    loading: false,
    highRisk: true,
    explanation: `BID basal/pump switch: 6 × ${dailyU} U = ${dose} U. Conservative start due to higher stack risk.`
  };
}

// ─── Stack Risk Module ───
function computeStackRisk(p: PatientInputs, c: CourseInputs, init: { loading: boolean; highRisk: boolean }): { risk: StackRisk; maxUp: number; maxDown: number; messages: string[] } {
  const week = parseInt(c.weekNumber) || 1;
  const dailyU = parseFloat(p.priorDailyUnits) || 0;
  const wt = parseFloat(p.weight) || 0;
  const dosePerKg = wt > 0 ? dailyU / wt : 0;

  // High risk
  if (week <= 3 && init.loading) {
    return { risk: "high", maxUp: 0, maxDown: 30, messages: ["High stack risk: no automatic up-titration allowed.", "Prioritise CGM review on days 2–4 post-dose."] };
  }
  if (dosePerKg > 0.7) {
    return { risk: "high", maxUp: 0, maxDown: 30, messages: ["High stack risk: no automatic up-titration allowed.", "Prioritise CGM review on days 2–4 post-dose."] };
  }
  if (p.severeHypoHistory) {
    return { risk: "high", maxUp: 0, maxDown: 30, messages: ["High stack risk: no automatic up-titration allowed.", "Prioritise CGM review on days 2–4 post-dose."] };
  }

  // Moderate risk
  if (week <= 3 && !init.loading) {
    return { risk: "moderate", maxUp: 10, maxDown: 30, messages: ["Moderate stack risk: limit up-titration to +10 U/week.", "Carefully evaluate nocturnal CGM before increasing dose."] };
  }
  if (week <= 5 && p.priorBasalType !== "none") {
    return { risk: "moderate", maxUp: 10, maxDown: 30, messages: ["Moderate stack risk: limit up-titration to +10 U/week.", "Carefully evaluate nocturnal CGM before increasing dose."] };
  }

  // Low risk
  return { risk: "low", maxUp: 20, maxDown: 30, messages: ["Low stack risk: titrate per CGM rules up to ±20 U/week."] };
}

// ─── CGM Titration ───
function computeTitration(cgm: CGMInputs, smbg: SMBGInputs, lastDose: number): { delta: number; category: ChangeCategory; explanation: string } {
  const completeness = parseFloat(cgm.dataCompleteness) || 0;
  const tbrLt54 = parseFloat(cgm.tbrLt54) || 0;
  const tbr54_69 = parseFloat(cgm.tbr54_69) || 0;
  const nocturnalMin = parseFloat(cgm.nocturnalMin) || 0;
  const nocturnalMean = parseFloat(cgm.nocturnalMean) || 0;
  const tir = parseFloat(cgm.tir) || 0;

  // Fallback to SMBG if CGM incomplete
  if (completeness < 70) {
    const f1 = parseFloat(smbg.fasting1) || 0;
    const f2 = parseFloat(smbg.fasting2) || 0;
    const f3 = parseFloat(smbg.fasting3) || 0;
    const vals = [f1, f2, f3].filter(v => v > 0);
    if (vals.length > 0) {
      const meanFasting = vals.reduce((a, b) => a + b, 0) / vals.length;
      if (meanFasting > 140) return { delta: 20, category: "up_20", explanation: `SMBG backup: mean fasting ${meanFasting.toFixed(0)} mg/dL — increase 20 U.` };
      if (meanFasting > 110) return { delta: 10, category: "up_10", explanation: `SMBG backup: mean fasting ${meanFasting.toFixed(0)} mg/dL — increase 10 U.` };
      return { delta: 0, category: "no_change", explanation: `SMBG backup: mean fasting ${meanFasting.toFixed(0)} mg/dL — no change.` };
    }
    return { delta: 0, category: "no_change", explanation: "Insufficient CGM and SMBG data. No change recommended." };
  }

  // Safety: severe hypo first
  if (tbrLt54 >= 1 || nocturnalMin < 54) {
    const reduction = Math.max(-20, Math.round(-0.2 * lastDose));
    return { delta: reduction, category: "down_20", explanation: `Severe nocturnal hypoglycemia (TBR<54: ${tbrLt54}%, min: ${nocturnalMin} mg/dL). Reduce ~20%: ${reduction} U.` };
  }

  if (tbr54_69 >= 4 || (nocturnalMin > 0 && nocturnalMin < 70)) {
    const reduction = Math.max(-10, Math.round(-0.1 * lastDose));
    return { delta: reduction, category: "down_10", explanation: `Recurrent nocturnal lows (TBR 54-69: ${tbr54_69}%, min: ${nocturnalMin} mg/dL). Reduce ~10%: ${reduction} U.` };
  }

  // No hypo — titrate up
  if (nocturnalMean > 140 && tbr54_69 === 0 && tbrLt54 === 0) {
    return { delta: 20, category: "up_20", explanation: `Persistent nocturnal hyperglycemia (mean ${nocturnalMean} mg/dL) without lows. Increase 20 U.` };
  }

  if (nocturnalMean > 110 && nocturnalMean <= 140 && tbr54_69 === 0 && tbrLt54 === 0 && tir < 70) {
    return { delta: 10, category: "up_10", explanation: `Mild nocturnal hyperglycemia (mean ${nocturnalMean} mg/dL) with low TIR (${tir}%). Increase 10 U.` };
  }

  if (nocturnalMean >= 80 && nocturnalMean <= 110 && tbrLt54 === 0 && tbr54_69 < 4) {
    return { delta: 0, category: "no_change", explanation: `On target (mean ${nocturnalMean} mg/dL). No change needed.` };
  }

  if (nocturnalMean >= 70 && nocturnalMean < 80) {
    return { delta: 0, category: "no_change_or_consider_-10", explanation: `Borderline low (mean ${nocturnalMean} mg/dL). Avoid up-titration; consider -10 U if downward trend.` };
  }

  return { delta: 0, category: "no_change", explanation: "No clear titration signal. Maintain current dose." };
}

// ─── Bolus Adjustment ───
function computeBolusAdvice(stackRisk: StackRisk, cgm: CGMInputs): { advice: BolusAdvice; explanation: string } {
  const tbr54_69 = parseFloat(cgm.tbr54_69) || 0;
  const tbrLt54 = parseFloat(cgm.tbrLt54) || 0;

  if (stackRisk === "high" && (tbr54_69 > 0 || tbrLt54 > 0)) {
    return { advice: "reduce_10pct", explanation: "High stack risk with hypoglycemia: reduce total daily bolus by ~10% and re-titrate later." };
  }
  return { advice: "no_change", explanation: "No automatic bolus change recommended." };
}

// ─── Main Component ───
export default function IcodecMiniApp() {
  // Patient inputs
  const [patient, setPatient] = useState<PatientInputs>({
    age: "58", weight: "78", egfr: "65",
    pregnant: false, severeHypoHistory: false,
    priorBasalType: "od_basal", priorDailyUnits: "24", priorBasalName: "degludec",
    onBolus: true, bolusUnits: "30",
  });

  // Course inputs
  const [course, setCourse] = useState<CourseInputs>({
    weekNumber: "1", lastDose: "", useLoading: false,
  });

  // CGM inputs
  const [cgm, setCgm] = useState<CGMInputs>({
    windowDays: "3", nocturnalMean: "165", tir: "45",
    tbr54_69: "0", tbrLt54: "0", tarGt180: "55",
    nocturnalMin: "92", nocturnalDownward: false, dataCompleteness: "90",
  });

  // SMBG backup
  const [smbg, setSmbg] = useState<SMBGInputs>({
    fasting1: "165", fasting2: "158", fasting3: "170",
  });

  const updatePatient = <K extends keyof PatientInputs>(key: K, value: PatientInputs[K]) =>
    setPatient(p => ({ ...p, [key]: value }));

  const updateCourse = <K extends keyof CourseInputs>(key: K, value: CourseInputs[K]) =>
    setCourse(c => ({ ...c, [key]: value }));

  const updateCGM = <K extends keyof CGMInputs>(key: K, value: CGMInputs[K]) =>
    setCgm(c => ({ ...c, [key]: value }));

  const updateSMBG = <K extends keyof SMBGInputs>(key: K, value: SMBGInputs[K]) =>
    setSmbg(s => ({ ...s, [key]: value }));

  // ─── Compute ───
  const output = useMemo((): IcodecOutput => {
    const lastDose = parseFloat(course.lastDose) || 0;
    const isInitiation = course.weekNumber === "1" || !course.lastDose;

    // Initiation
    const init = isInitiation
      ? computeInitiationDose(patient, course)
      : { dose: 0, loading: false, highRisk: false, explanation: "" };

    // Stack risk
    const stack = computeStackRisk(patient, course, { loading: init.loading, highRisk: init.highRisk });

    // Titration
    const titrate = isInitiation
      ? { delta: 0, category: "no_change" as ChangeCategory, explanation: "Initiation week — use starting dose above." }
      : computeTitration(cgm, smbg, lastDose);

    // Cap titration by stack risk
    let cappedDelta = titrate.delta;
    if (cappedDelta > 0 && cappedDelta > stack.maxUp) cappedDelta = stack.maxUp;
    if (cappedDelta < 0 && Math.abs(cappedDelta) > stack.maxDown) cappedDelta = -stack.maxDown;

    // Final dose
    let nextDose: number;
    if (isInitiation) {
      nextDose = init.dose;
    } else {
      nextDose = lastDose + cappedDelta;
    }

    // Round to nearest 10
    nextDose = Math.round(nextDose / 10) * 10;
    if (nextDose < 10) nextDose = 10;

    const doseDelta = isInitiation ? null : cappedDelta;

    // Bolus advice
    const bolus = computeBolusAdvice(stack.risk, cgm);

    // Warnings
    const warnings: string[] = [
      "Do not give any additional basal insulin.",
      "Schedule CGM review on days 2–4 post-injection.",
    ];
    if (stack.risk === "high") {
      warnings.push("High stack risk: no automatic up-titration allowed.");
    }
    if (init.loading) {
      warnings.push("Loading dose week 1 only. Never repeat loading. Week 2 dose = 7× daily basal.");
    }
    if (patient.priorBasalType !== "none") {
      warnings.push("Stop daily basal insulin on day of first icodec injection. No overlap.");
    }

    return {
      nextDose,
      doseDelta,
      changeCategory: isInitiation ? null : titrate.category,
      stackRisk: stack.risk,
      bolusAdvice: bolus.advice,
      monitoringDays: [2, 3, 4],
      warnings,
      explanation: isInitiation ? init.explanation : titrate.explanation,
    };
  }, [patient, course, cgm, smbg]);

  const PILL = "w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30";

  return (
    <div className="space-y-4 max-w-6xl">
      {/* Header */}
      <Card className="border-sky-500/30 bg-gradient-to-br from-sky-500/5 to-muted/5">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-sky-500/10 flex items-center justify-center">
              <Syringe className="h-5 w-5 text-sky-500" />
            </div>
            <div>
              <CardTitle className="text-lg">Insulin Icodec (Awiqli) — Once-Weekly Dosing Guide</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Initiation, titration, and stack-risk management for once-weekly icodec in adult T2DM
              </p>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {/* ─── Inputs Column ─── */}
        <div className="space-y-4">
          {/* Patient Data */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Info className="h-4 w-4 text-primary" />
                <CardTitle className="text-sm">Patient Data</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Age (years)</Label>
                  <Input className="h-9" value={patient.age} onChange={e => updatePatient("age", e.target.value)} placeholder="e.g. 58" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Weight (kg)</Label>
                  <Input className="h-9" value={patient.weight} onChange={e => updatePatient("weight", e.target.value)} placeholder="e.g. 78" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">eGFR</Label>
                  <Input className="h-9" value={patient.egfr} onChange={e => updatePatient("egfr", e.target.value)} placeholder="e.g. 65" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Prior Basal Type</Label>
                  <select className={PILL} value={patient.priorBasalType} onChange={e => updatePatient("priorBasalType", e.target.value as PriorBasalType)}>
                    <option value="none">None (insulin-naïve)</option>
                    <option value="od_basal">Once-daily basal</option>
                    <option value="bid_basal">Twice-daily basal</option>
                    <option value="pump">Insulin pump</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Prior Daily Units</Label>
                  <Input className="h-9" value={patient.priorDailyUnits} onChange={e => updatePatient("priorDailyUnits", e.target.value)} placeholder="e.g. 24" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Prior Basal Name</Label>
                  <Input className="h-9" value={patient.priorBasalName} onChange={e => updatePatient("priorBasalName", e.target.value)} placeholder="e.g. degludec" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <label className="flex items-center gap-2 text-xs cursor-pointer">
                  <Switch checked={patient.pregnant} onCheckedChange={v => updatePatient("pregnant", v)} />
                  Pregnant
                </label>
                <label className="flex items-center gap-2 text-xs cursor-pointer">
                  <Switch checked={patient.severeHypoHistory} onCheckedChange={v => updatePatient("severeHypoHistory", v)} />
                  Severe hypo history
                </label>
                <label className="flex items-center gap-2 text-xs cursor-pointer">
                  <Switch checked={patient.onBolus} onCheckedChange={v => updatePatient("onBolus", v)} />
                  On bolus insulin
                </label>
                {patient.onBolus && (
                  <div className="space-y-1">
                    <Label className="text-xs">Total daily bolus (U)</Label>
                    <Input className="h-9" value={patient.bolusUnits} onChange={e => updatePatient("bolusUnits", e.target.value)} placeholder="e.g. 30" />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Course Data */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                <CardTitle className="text-sm">Icodec Course</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Week Number</Label>
                  <Input className="h-9" value={course.weekNumber} onChange={e => updateCourse("weekNumber", e.target.value)} placeholder="e.g. 1" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Last Weekly Dose (U)</Label>
                  <Input className="h-9" value={course.lastDose} onChange={e => updateCourse("lastDose", e.target.value)} placeholder="Leave blank for initiation" />
                </div>
              </div>
              <label className="flex items-center gap-2 text-xs cursor-pointer">
                <Switch checked={course.useLoading} onCheckedChange={v => updateCourse("useLoading", v)} />
                Use loading strategy (week 1 only, low-risk prior daily basal)
              </label>
            </CardContent>
          </Card>

          {/* CGM Data */}
          <Collapsible defaultOpen={true}>
            <Card>
              <CollapsibleTrigger asChild>
                <CardHeader className="pb-2 cursor-pointer hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-primary" />
                    <CardTitle className="text-sm">CGM Summary</CardTitle>
                    <ChevronDown className="h-4 w-4 ml-auto text-muted-foreground transition-transform group-data-[state=open]/collapsible:rotate-180" />
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Window (days)</Label>
                      <Input className="h-9" value={cgm.windowDays} onChange={e => updateCGM("windowDays", e.target.value)} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Nocturnal Mean (mg/dL)</Label>
                      <Input className="h-9" value={cgm.nocturnalMean} onChange={e => updateCGM("nocturnalMean", e.target.value)} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">TIR 70-180 (%)</Label>
                      <Input className="h-9" value={cgm.tir} onChange={e => updateCGM("tir", e.target.value)} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">TBR 54-69 (%)</Label>
                      <Input className="h-9" value={cgm.tbr54_69} onChange={e => updateCGM("tbr54_69", e.target.value)} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">TBR &lt;54 (%)</Label>
                      <Input className="h-9" value={cgm.tbrLt54} onChange={e => updateCGM("tbrLt54", e.target.value)} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">TAR &gt;180 (%)</Label>
                      <Input className="h-9" value={cgm.tarGt180} onChange={e => updateCGM("tarGt180", e.target.value)} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Nocturnal Min (mg/dL)</Label>
                      <Input className="h-9" value={cgm.nocturnalMin} onChange={e => updateCGM("nocturnalMin", e.target.value)} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Data Completeness (%)</Label>
                      <Input className="h-9" value={cgm.dataCompleteness} onChange={e => updateCGM("dataCompleteness", e.target.value)} />
                    </div>
                  </div>
                  <label className="flex items-center gap-2 text-xs cursor-pointer">
                    <Switch checked={cgm.nocturnalDownward} onCheckedChange={v => updateCGM("nocturnalDownward", v)} />
                    Nocturnal downward trend
                  </label>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* SMBG Backup */}
          <Collapsible>
            <Card>
              <CollapsibleTrigger asChild>
                <CardHeader className="pb-2 cursor-pointer hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-2">
                    <Droplets className="h-4 w-4 text-primary" />
                    <CardTitle className="text-sm">SMBG Backup (if CGM &lt;70% complete)</CardTitle>
                    <ChevronDown className="h-4 w-4 ml-auto text-muted-foreground transition-transform group-data-[state=open]/collapsible:rotate-180" />
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs">Fasting 1</Label>
                      <Input className="h-9" value={smbg.fasting1} onChange={e => updateSMBG("fasting1", e.target.value)} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Fasting 2</Label>
                      <Input className="h-9" value={smbg.fasting2} onChange={e => updateSMBG("fasting2", e.target.value)} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Fasting 3</Label>
                      <Input className="h-9" value={smbg.fasting3} onChange={e => updateSMBG("fasting3", e.target.value)} />
                    </div>
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        </div>

        {/* ─── Outputs Column ─── */}
        <div className="space-y-4">
          {/* Dose Recommendation */}
          <Card className={cn(
            "border-2",
            output.stackRisk === "high" ? "border-red-500/40" :
            output.stackRisk === "moderate" ? "border-amber-500/40" :
            "border-emerald-500/40"
          )}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Syringe className="h-4 w-4 text-primary" />
                  <CardTitle className="text-sm">Dose Recommendation</CardTitle>
                </div>
                {output.stackRisk && (
                  <Badge className={cn(
                    "text-xs",
                    output.stackRisk === "high" ? "bg-red-500/15 text-red-400 border-red-500/30" :
                    output.stackRisk === "moderate" ? "bg-amber-500/15 text-amber-400 border-amber-500/30" :
                    "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                  )}>
                    {output.stackRisk === "high" ? "🔴 High" : output.stackRisk === "moderate" ? "🟡 Moderate" : "🟢 Low"} Stack Risk
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Dose display */}
              <div className="text-center p-4 rounded-lg bg-muted/20 border border-border">
                <p className="text-xs text-muted-foreground mb-1">Recommended Icodec Dose</p>
                <p className="text-4xl font-bold text-sky-500">{output.nextDose} U</p>
                <p className="text-xs text-muted-foreground mt-1">Once weekly</p>
              </div>

              {/* Dose change indicator */}
              {output.doseDelta !== null && (
                <div className="flex items-center justify-center gap-2">
                  {output.doseDelta > 0 && (
                    <span className="flex items-center gap-1 text-emerald-500 font-semibold">
                      <TrendingUp className="h-4 w-4" /> +{output.doseDelta} U
                    </span>
                  )}
                  {output.doseDelta === 0 && (
                    <span className="flex items-center gap-1 text-muted-foreground font-semibold">
                      <Minus className="h-4 w-4" /> No change
                    </span>
                  )}
                  {output.doseDelta < 0 && (
                    <span className="flex items-center gap-1 text-red-500 font-semibold">
                      <TrendingDown className="h-4 w-4" /> {output.doseDelta} U
                    </span>
                  )}
                  {output.changeCategory && (
                    <Badge variant="outline" className="text-xs">{output.changeCategory.replace(/_/g, " ")}</Badge>
                  )}
                </div>
              )}

              <Separator />

              {/* Explanation */}
              <div className="text-xs text-muted-foreground leading-relaxed">
                <p className="font-medium text-foreground mb-1">Clinical Logic</p>
                <p>{output.explanation}</p>
              </div>

              {/* Stack risk messages */}
              {output.stackRisk && (
                <div className={cn(
                  "rounded-lg border p-3 space-y-1",
                  output.stackRisk === "high" ? "bg-red-500/5 border-red-500/20" :
                  output.stackRisk === "moderate" ? "bg-amber-500/5 border-amber-500/20" :
                  "bg-emerald-500/5 border-emerald-500/20"
                )}>
                  <p className="text-xs font-semibold flex items-center gap-1.5">
                    <Shield className="h-3.5 w-3.5" />
                    Stack Risk — {output.stackRisk === "high" ? "High" : output.stackRisk === "moderate" ? "Moderate" : "Low"}
                  </p>
                  <ul className="space-y-0.5">
                    {output.stackRisk === "high" && (
                      <>
                        <li className="text-xs text-muted-foreground">• No automatic up-titration allowed</li>
                        <li className="text-xs text-muted-foreground">• Prioritise CGM review on days 2–4 post-dose</li>
                      </>
                    )}
                    {output.stackRisk === "moderate" && (
                      <>
                        <li className="text-xs text-muted-foreground">• Limit up-titration to +10 U/week</li>
                        <li className="text-xs text-muted-foreground">• Carefully evaluate nocturnal CGM before increasing dose</li>
                      </>
                    )}
                    {output.stackRisk === "low" && (
                      <li className="text-xs text-muted-foreground">• Titrate per CGM rules up to ±20 U/week</li>
                    )}
                  </ul>
                </div>
              )}

              {/* Bolus advice */}
              {output.bolusAdvice && (
                <div className="rounded-lg border border-border bg-muted/20 p-3">
                  <p className="text-xs font-semibold flex items-center gap-1.5 mb-1">
                    <Droplets className="h-3.5 w-3.5 text-primary" />
                    Bolus Adjustment
                  </p>
                  <Badge variant={output.bolusAdvice === "reduce_10pct" ? "destructive" : "secondary"} className="text-xs">
                    {output.bolusAdvice === "reduce_10pct" ? "Reduce 10%" : "No change"}
                  </Badge>
                </div>
              )}

              {/* Monitoring focus */}
              <div className="rounded-lg border border-border bg-muted/20 p-3">
                <p className="text-xs font-semibold flex items-center gap-1.5 mb-1">
                  <Activity className="h-3.5 w-3.5 text-primary" />
                  Monitoring Focus Days
                </p>
                <div className="flex gap-1.5">
                  {output.monitoringDays.map(d => (
                    <Badge key={d} variant="outline" className="text-xs">Day {d}</Badge>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Schedule CGM review on days 2–4 post-injection (peak icodec activity).</p>
              </div>
            </CardContent>
          </Card>

          {/* Warnings */}
          {output.warnings.length > 0 && (
            <Card className="border-red-500/30 bg-gradient-to-br from-red-500/5 to-rose-500/5">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                  <CardTitle className="text-sm text-destructive">Warnings</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1">
                  {output.warnings.map((w, i) => (
                    <li key={i} className="text-xs flex gap-2">
                      <span className="text-destructive shrink-0">•</span>
                      <span>{w}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Contraindications */}
          {(parseFloat(patient.egfr) < 15 || patient.pregnant) && (
            <Card className="border-red-500/30 bg-red-500/5">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-red-500" />
                  <CardTitle className="text-sm text-destructive">Contraindication</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="text-xs">
                {parseFloat(patient.egfr) < 15 && <p>eGFR &lt;15 — Icodec is contraindicated in severe renal impairment.</p>}
                {patient.pregnant && <p>Pregnancy — Icodec is not recommended during pregnancy. Insufficient data.</p>}
              </CardContent>
            </Card>
          )}

          {/* Quick Reference */}
          <Collapsible>
            <Card>
              <CollapsibleTrigger asChild>
                <CardHeader className="pb-2 cursor-pointer hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-2">
                    <Brain className="h-4 w-4 text-primary" />
                    <CardTitle className="text-sm">Algorithm Reference</CardTitle>
                    <ChevronDown className="h-4 w-4 ml-auto text-muted-foreground transition-transform group-data-[state=open]/collapsible:rotate-180" />
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="space-y-3 text-xs">
                  <div>
                    <p className="font-semibold mb-1">Initiation</p>
                    <ul className="space-y-0.5 text-muted-foreground">
                      <li>• Insulin-naïve: 70 U once weekly</li>
                      <li>• Switch from daily basal: 7× daily dose (6× if high-risk)</li>
                      <li>• Loading option (low-risk only): 10.5× daily dose week 1, then 7× from week 2</li>
                      <li>• Stop daily basal on day of first icodec injection — no overlap</li>
                    </ul>
                  </div>
                  <div>
                    <p className="font-semibold mb-1">Titration (CGM-based)</p>
                    <ul className="space-y-0.5 text-muted-foreground">
                      <li>• TBR &lt;54 ≥1% or nocturnal min &lt;54: ↓ ~20%</li>
                      <li>• TBR 54-69 ≥4% or nocturnal min &lt;70: ↓ ~10%</li>
                      <li>• Nocturnal mean &gt;140, no lows: ↑ 20 U</li>
                      <li>• Nocturnal mean 110-140, TIR &lt;70%: ↑ 10 U</li>
                      <li>• Nocturnal mean 80-110: no change</li>
                      <li>• Borderline 70-80: no change, consider −10 if downward trend</li>
                    </ul>
                  </div>
                  <div>
                    <p className="font-semibold mb-1">Stack Risk</p>
                    <ul className="space-y-0.5 text-muted-foreground">
                      <li>• High: loading + week ≤3, dose &gt;0.7 U/kg, or severe hypo history — max ↑ 0 U</li>
                      <li>• Moderate: week ≤3 (no loading) or week ≤5 with prior basal — max ↑ 10 U</li>
                      <li>• Low: week ≥4, insulin-naïve — max ↑ 20 U</li>
                    </ul>
                  </div>
                  <p className="text-muted-foreground italic mt-2">
                    Based on FDA label, ONWARDS 5 app approach, and published guidance. Decision-support only — does not replace clinical judgment.
                  </p>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        </div>
      </div>
    </div>
  );
}
