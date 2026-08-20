import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import BackToHome from "@/components/BackToHome";
import Seo from "@/components/Seo";
import { AlertTriangle, Activity, Download, Copy, Image } from "lucide-react";
import { downloadTextFile, copyToClipboard } from "@/lib/clinical-utils";

type BaselineSource = "known" | "estimated" | "provisional" | "unknown";
type BaselineMethod =
  | "outpatient_recent"
  | "outpatient_mean_7_365d"
  | "mdrd_back_calc"
  | "ckdepi_back_calc"
  | "inpatient_nadir"
  | "clinician_adjudicated";

const num = (v: string) => {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : NaN;
};

// Back-calculate baseline SCr from assumed eGFR=75 (MDRD simplified)
function estimateBaselineMDRD(age: number, sex: "M" | "F"): number {
  if (!age || !sex) return NaN;
  // MDRD: eGFR = 175 * Scr^-1.154 * age^-0.203 * (0.742 if F)
  // Solve for Scr with eGFR=75
  const sexFactor = sex === "F" ? 0.742 : 1;
  // 75 = 175 * Scr^-1.154 * age^-0.203 * sexFactor
  const scr = Math.pow((175 * Math.pow(age, -0.203) * sexFactor) / 75, 1 / 1.154);
  return Math.round(scr * 100) / 100;
}

export default function AKIAKDMiniApp() {
  // Baseline
  const [baselineSource, setBaselineSource] = useState<BaselineSource>("known");
  const [baselineMethod, setBaselineMethod] = useState<BaselineMethod>("outpatient_recent");
  const [baselineValue, setBaselineValue] = useState("");
  const [age, setAge] = useState("");
  const [sex, setSex] = useState<"M" | "F">("M");
  const [weightKg, setWeightKg] = useState("");

  // Current values
  const [currentScr, setCurrentScr] = useState("");
  const [scr48hAgo, setScr48hAgo] = useState("");
  const [cystatinBaseline, setCystatinBaseline] = useState("");
  const [cystatinCurrent, setCystatinCurrent] = useState("");

  // Urine output
  const [uopMl, setUopMl] = useState("");
  const [uopHours, setUopHours] = useState("6");

  // Structural
  const [biomarkerPositive, setBiomarkerPositive] = useState(false);
  const [albuminuria, setAlbuminuria] = useState(false);
  const [hematuria, setHematuria] = useState(false);

  // AKD extras
  const [currentGFR, setCurrentGFR] = useState("");
  const [baselineGFR, setBaselineGFR] = useState("");
  const [durationDays, setDurationDays] = useState("");

  const result = useMemo(() => {
    const scrNow = num(currentScr);
    const scr48 = num(scr48hAgo);
    const bWt = num(weightKg);
    const uop = num(uopMl);
    const hrs = num(uopHours) || 6;

    // Effective baseline
    let effBaseline = num(baselineValue);
    let effSource: BaselineSource = baselineSource;
    let imputed = false;
    if (!Number.isFinite(effBaseline) && (baselineSource === "unknown" || baselineSource === "estimated")) {
      const est = estimateBaselineMDRD(num(age), sex);
      if (Number.isFinite(est)) {
        effBaseline = est;
        effSource = "estimated";
        imputed = true;
      }
    }

    const triggered: string[] = [];
    const reasons: string[] = [];

    // 48h delta
    if (Number.isFinite(scrNow) && Number.isFinite(scr48) && scrNow - scr48 >= 0.3) {
      triggered.push(`SCr rise ≥0.3 mg/dL in 48h (Δ ${(scrNow - scr48).toFixed(2)}) [KDIGO 2026]`);
      reasons.push("scr_rise_48h");
    }
    // 7d ratio
    let ratio7d = NaN;
    if (Number.isFinite(scrNow) && Number.isFinite(effBaseline) && effBaseline > 0) {
      ratio7d = scrNow / effBaseline;
      if (ratio7d >= 1.5) {
        triggered.push(`SCr ≥1.5× baseline (ratio ${ratio7d.toFixed(2)}) [KDIGO 2026]`);
        reasons.push("scr_ratio_7d");
      }
    }
    // Cystatin C
    const cysB = num(cystatinBaseline);
    const cysN = num(cystatinCurrent);
    if (Number.isFinite(cysB) && Number.isFinite(cysN) && cysB > 0 && cysN / cysB >= 1.5) {
      triggered.push(`Cystatin C ≥1.5× baseline (ratio ${(cysN / cysB).toFixed(2)}) [KDIGO 2026]`);
      reasons.push("cystatin_c_ratio_7d");
    }
    // Urine output — ideal body weight ~ use provided weight
    let uopPerKgHr = NaN;
    if (Number.isFinite(uop) && Number.isFinite(bWt) && bWt > 0 && hrs > 0) {
      uopPerKgHr = uop / bWt / hrs;
      if (uopPerKgHr < 0.5 && hrs >= 6) {
        triggered.push(`UOP <0.5 mL/kg/h for ${hrs}h (${uopPerKgHr.toFixed(2)}) [KDIGO 2026]`);
        reasons.push("uop_low_6h");
      }
    }
    // Structural
    if (biomarkerPositive) {
      triggered.push("Kidney damage biomarker positive [KDIGO 2026]");
      reasons.push("structural_biomarker");
    }

    const akiPresent = triggered.length > 0;

    // Staging (KDIGO)
    let stage: "none" | "stage_1" | "stage_2" | "stage_3" | "unclassified" = "none";
    if (akiPresent) {
      stage = "stage_1";
      if (Number.isFinite(ratio7d)) {
        if (ratio7d >= 3.0) stage = "stage_3";
        else if (ratio7d >= 2.0) stage = "stage_2";
        else if (ratio7d >= 1.5) stage = "stage_1";
      }
      if (Number.isFinite(scrNow) && scrNow >= 4.0) stage = "stage_3";
      if (Number.isFinite(uopPerKgHr)) {
        if (uopPerKgHr < 0.3 && hrs >= 24) stage = "stage_3";
        else if (uopPerKgHr < 0.5 && hrs >= 12 && stage === "stage_1") stage = "stage_2";
      }
    }

    // Confidence & quality
    const missingBaseline = !Number.isFinite(num(baselineValue));
    const missingUOP = !Number.isFinite(uop);
    const inpatientOnly = baselineMethod === "inpatient_nadir";
    let confidence: "high" | "moderate" | "low" = "high";
    if (imputed || inpatientOnly) confidence = "low";
    else if (missingBaseline || missingUOP) confidence = "moderate";

    let misclass: "low" | "moderate" | "high" = "low";
    if (imputed) misclass = "high";
    else if (missingBaseline || inpatientOnly) misclass = "moderate";

    // AKD
    const cGFR = num(currentGFR);
    const bGFR = num(baselineGFR);
    const dur = num(durationDays);
    const akdCriteria: string[] = [];
    if (akiPresent) akdCriteria.push("AKI functional criteria met");
    if (Number.isFinite(cGFR) && cGFR < 60) akdCriteria.push(`GFR <60 (${cGFR}) [KDIGO 2026]`);
    if (Number.isFinite(cGFR) && Number.isFinite(bGFR) && bGFR - cGFR >= 35)
      akdCriteria.push(`GFR drop ≥35 (Δ ${(bGFR - cGFR).toFixed(0)}) [KDIGO 2026]`);
    if (Number.isFinite(scrNow) && Number.isFinite(effBaseline) && scrNow / effBaseline > 1.5)
      akdCriteria.push(`SCr rise >50% from baseline [KDIGO 2026]`);
    if (albuminuria) akdCriteria.push("Albuminuria present [KDIGO 2026]");
    if (hematuria) akdCriteria.push("Hematuria present [KDIGO 2026]");
    if (biomarkerPositive) akdCriteria.push("Structural biomarker positive [KDIGO 2026]");
    const akdPresent = akdCriteria.length > 0 && (!Number.isFinite(dur) || dur <= 90);

    // Next steps
    const steps: string[] = [];
    if (akiPresent) {
      steps.push("Check volume/sepsis/obstruction.");
      steps.push("Hold NSAIDs/ACEi/ARB/contrast.");
      steps.push("Dose adjust drugs; check levels.");
      steps.push("Serial SCr; strict I/O; daily weights.");
      if (stage === "stage_2" || stage === "stage_3") {
        steps.push("Nephrology consult; ICU; RRT eval.");
      }
      if (imputed) {
        steps.push("Suspected AKI (imputed baseline).");
      }
    } else if (akdPresent) {
      steps.push("Order urine ACR, urinalysis with microscopy, renal ultrasound.");
      steps.push("Repeat SCr in 7–14 days; monitor trajectory over ≤3 months.");
      steps.push("Address chronic drivers: BP, glycemia, proteinuria, cardiovascular risk.");
    } else if (missingBaseline && Number.isFinite(scrNow)) {
      steps.push("No baseline available — continue surveillance: serial SCr q12–24h and 6h UOP windows.");
    } else {
      steps.push("No AKI/AKD criteria met on current data. Reassess if clinical status changes.");
    }

    return {
      akiPresent,
      triggered,
      reasons,
      stage,
      ratio7d,
      uopPerKgHr,
      effBaseline,
      effSource,
      imputed,
      confidence,
      misclass,
      missingBaseline,
      missingUOP,
      inpatientOnly,
      akdPresent,
      akdCriteria,
      steps,
    };
  }, [
    baselineSource, baselineMethod, baselineValue, age, sex, weightKg,
    currentScr, scr48hAgo, cystatinBaseline, cystatinCurrent,
    uopMl, uopHours, biomarkerPositive, albuminuria, hematuria,
    currentGFR, baselineGFR, durationDays,
  ]);

  const stageColor =
    result.stage === "stage_3" ? "bg-destructive/15 text-destructive border-destructive/30" :
    result.stage === "stage_2" ? "bg-orange-500/15 text-orange-500 border-orange-500/30" :
    result.stage === "stage_1" ? "bg-amber-500/15 text-amber-500 border-amber-500/30" :
    "bg-muted text-muted-foreground border-border";

  const confColor =
    result.confidence === "high" ? "text-success" :
    result.confidence === "moderate" ? "text-warning" : "text-destructive";

  const buildReport = () => {
    const lines: string[] = [];
    lines.push("AKI / AKD Assessment");
    lines.push("=====================");
    lines.push(`Date: ${new Date().toLocaleString()}`);
    lines.push("");
    lines.push("INPUTS");
    lines.push(`- Age/Sex: ${age || "—"} / ${sex}`);
    lines.push(`- Weight (kg): ${weightKg || "—"}`);
    lines.push(`- Baseline SCr: ${baselineValue || "—"} mg/dL  (source: ${baselineSource}, method: ${baselineMethod})`);
    lines.push(`- Effective baseline used: ${Number.isFinite(result.effBaseline) ? result.effBaseline.toFixed(2) : "—"} mg/dL${result.imputed ? " (imputed)" : ""}`);
    lines.push(`- Current SCr: ${currentScr || "—"} mg/dL`);
    lines.push(`- SCr 48h ago: ${scr48hAgo || "—"} mg/dL`);
    lines.push(`- Cystatin C base/current: ${cystatinBaseline || "—"} / ${cystatinCurrent || "—"}`);
    lines.push(`- Urine output: ${uopMl || "—"} mL over ${uopHours}h`);
    lines.push(`- Structural biomarker positive: ${biomarkerPositive ? "yes" : "no"}`);
    lines.push(`- Albuminuria / Hematuria: ${albuminuria ? "yes" : "no"} / ${hematuria ? "yes" : "no"}`);
    lines.push(`- Current / Baseline eGFR: ${currentGFR || "—"} / ${baselineGFR || "—"}`);
    lines.push(`- Duration (days): ${durationDays || "—"}`);
    lines.push("");
    lines.push("RESULTS");
    lines.push(`- AKI present: ${result.akiPresent ? "YES" : "no"}`);
    lines.push(`- KDIGO stage: ${result.stage}`);
    lines.push(`- AKD present (≤90d): ${result.akdPresent ? "YES" : "no"}`);
    lines.push(`- Confidence: ${result.confidence}`);
    lines.push(`- Misclassification risk: ${result.misclass}`);
    lines.push("");
    lines.push("TRIGGERED RULES");
    (result.triggered.length ? result.triggered : ["(none)"]).forEach(t => lines.push(`- ${t}`));
    lines.push("");
    lines.push("AKD CRITERIA");
    (result.akdCriteria.length ? result.akdCriteria : ["(none)"]).forEach(t => lines.push(`- ${t}`));
    lines.push("");
    lines.push("NEXT STEPS");
    result.steps.forEach(s => lines.push(`- ${s}`));
    lines.push("");
    lines.push("Reference: KDIGO 2026 Clinical Practice Guideline for AKI & AKD");
    return lines.join("\n");
  };

  return (
    <>
      <Seo
        title="AKI / AKD Mini App — KDIGO 2026 detection & staging"
        description="Baseline-aware acute kidney injury and acute kidney disease detection with KDIGO 2026 functional, urine output, and structural criteria."
      />
      <BackToHome />
      <div className="max-w-5xl mx-auto p-4 md:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex items-center gap-3 flex-1">
            <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
              <Activity className="h-6 w-6 text-amber-500" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-heading font-semibold">AKI / AKD Mini App</h1>
              <p className="text-sm text-muted-foreground">Baseline-aware detection & staging — KDIGO 2026</p>
            </div>
          </div>
          <a
            href="/images?search=KDIGO%202026%20AKI%20%26%20AKD"
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-primary hover:bg-muted transition-colors"
          >
            <Image className="h-4 w-4" />
            View KDIGO 2026 guideline
          </a>
        </div>

        {/* Baseline */}
        <Card>
          <CardHeader><CardTitle className="text-lg">Baseline kidney function</CardTitle></CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <div>
              <Label>Baseline source</Label>
              <Select value={baselineSource} onValueChange={(v) => setBaselineSource(v as BaselineSource)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="known">Known</SelectItem>
                  <SelectItem value="estimated">Estimated</SelectItem>
                  <SelectItem value="provisional">Provisional</SelectItem>
                  <SelectItem value="unknown">Unknown</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Baseline method</Label>
              <Select value={baselineMethod} onValueChange={(v) => setBaselineMethod(v as BaselineMethod)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="outpatient_recent">Outpatient — most recent</SelectItem>
                  <SelectItem value="outpatient_mean_7_365d">Outpatient — mean 7–365d</SelectItem>
                  <SelectItem value="mdrd_back_calc">Back-calc (MDRD, eGFR=75)</SelectItem>
                  <SelectItem value="ckdepi_back_calc">Back-calc (CKD-EPI, eGFR=75)</SelectItem>
                  <SelectItem value="inpatient_nadir">Inpatient nadir (provisional)</SelectItem>
                  <SelectItem value="clinician_adjudicated">Clinician adjudicated</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Baseline SCr (mg/dL)</Label>
              <Input inputMode="decimal" placeholder="e.g. 1.0" value={baselineValue} onChange={e => setBaselineValue(e.target.value)} />
            </div>
            <div>
              <Label>Age</Label>
              <Input inputMode="numeric" value={age} onChange={e => setAge(e.target.value)} />
            </div>
            <div>
              <Label>Sex</Label>
              <Select value={sex} onValueChange={(v) => setSex(v as "M" | "F")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="M">Male</SelectItem>
                  <SelectItem value="F">Female</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Weight (kg)</Label>
              <Input inputMode="decimal" value={weightKg} onChange={e => setWeightKg(e.target.value)} />
            </div>
          </CardContent>
        </Card>

        {/* Current values */}
        <Card>
          <CardHeader><CardTitle className="text-lg">Current labs & urine output</CardTitle></CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <div>
              <Label>Current SCr (mg/dL)</Label>
              <Input inputMode="decimal" value={currentScr} onChange={e => setCurrentScr(e.target.value)} />
            </div>
            <div>
              <Label>SCr 48h ago (mg/dL)</Label>
              <Input inputMode="decimal" value={scr48hAgo} onChange={e => setScr48hAgo(e.target.value)} />
            </div>
            <div>
              <Label>Cystatin C baseline / current (mg/L)</Label>
              <div className="flex gap-2">
                <Input inputMode="decimal" placeholder="base" value={cystatinBaseline} onChange={e => setCystatinBaseline(e.target.value)} />
                <Input inputMode="decimal" placeholder="now" value={cystatinCurrent} onChange={e => setCystatinCurrent(e.target.value)} />
              </div>
            </div>
            <div>
              <Label>Urine output (mL total)</Label>
              <Input inputMode="decimal" value={uopMl} onChange={e => setUopMl(e.target.value)} />
            </div>
            <div>
              <Label>Over (hours)</Label>
              <Input inputMode="decimal" value={uopHours} onChange={e => setUopHours(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Structural markers</Label>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox checked={biomarkerPositive} onCheckedChange={v => setBiomarkerPositive(!!v)} />
                Kidney damage biomarker positive (e.g., NGAL, KIM-1, TIMP-2·IGFBP7)
              </label>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox checked={albuminuria} onCheckedChange={v => setAlbuminuria(!!v)} />
                Albuminuria
              </label>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox checked={hematuria} onCheckedChange={v => setHematuria(!!v)} />
                Hematuria
              </label>
            </div>
          </CardContent>
        </Card>

        {/* AKD extras */}
        <Card>
          <CardHeader><CardTitle className="text-lg">AKD context (optional)</CardTitle></CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <div>
              <Label>Current eGFR (mL/min/1.73m²)</Label>
              <Input inputMode="decimal" value={currentGFR} onChange={e => setCurrentGFR(e.target.value)} />
            </div>
            <div>
              <Label>Baseline eGFR</Label>
              <Input inputMode="decimal" value={baselineGFR} onChange={e => setBaselineGFR(e.target.value)} />
            </div>
            <div>
              <Label>Duration of abnormality (days)</Label>
              <Input inputMode="numeric" value={durationDays} onChange={e => setDurationDays(e.target.value)} />
            </div>
          </CardContent>
        </Card>

        {/* Result & Criteria Summary Panel */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className={`md:col-span-2 border-2 ${result.akiPresent ? "border-destructive/30" : "border-primary/20"}`}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Activity className={`h-5 w-5 ${result.akiPresent ? "text-destructive" : "text-success"}`} />
                  KDIGO 2026 Detection Result
                </CardTitle>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => copyToClipboard(buildReport(), "Report copied")}>
                    <Copy className="h-4 w-4 mr-1" /> Copy
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Badge className={`${stageColor} text-sm py-1 px-3`}>
                  {result.akiPresent ? `AKI — ${result.stage.replace("_", " ")}` : "No AKI Criteria Met"}
                </Badge>
                {result.akdPresent && <Badge variant="secondary" className="text-sm py-1 px-3">AKD Detected</Badge>}
                <Badge variant="outline" className={confColor}>Data Confidence: {result.confidence.toUpperCase()}</Badge>
              </div>

              <div className="space-y-3">
                <div className="p-3 rounded-lg bg-muted/50 border border-border/50">
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Primary Criteria Summary</div>
                  <div className="grid gap-2 text-sm">
                    {result.triggered.length > 0 ? (
                      result.triggered.map((t, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-destructive shrink-0" />
                          <span>{t}</span>
                        </div>
                      ))
                    ) : (
                      <div className="text-muted-foreground italic">No functional or structural criteria triggered.</div>
                    )}
                  </div>
                </div>

                {result.akdCriteria.length > 0 && (
                  <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/20">
                    <div className="text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wider mb-2">AKD Indicators (Duration ≤90d)</div>
                    <div className="grid gap-1 text-sm">
                      {result.akdCriteria.map((t, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />
                          <span>{t}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Clinical Next Steps</div>
                <ul className="space-y-1.5">
                  {result.steps.map((s, i) => (
                    <li key={i} className="text-sm flex gap-2">
                      <span className="text-primary font-bold">•</span>
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-muted/30 border-none shadow-none">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Internal Log</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea 
                readOnly 
                value={buildReport()} 
                className="font-mono text-[10px] h-[340px] bg-background/50 resize-none border-none" 
              />
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-full text-xs gap-2"
                onClick={() => copyToClipboard(buildReport(), "AKI/AKD Results")}
              >
                <Copy className="h-3 w-3" /> Copy results
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-full text-xs gap-2"
                onClick={() => downloadTextFile("aki-akd-assessment", buildReport())}
              >
                <Download className="h-3 w-3" /> Download .txt
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="text-xs text-muted-foreground">
          Reference: KDIGO 2026 Clinical Practice Guideline for AKI & AKD. This tool assists interpretation and does not replace clinical judgment.
        </div>
      </div>
    </>
  );
}
