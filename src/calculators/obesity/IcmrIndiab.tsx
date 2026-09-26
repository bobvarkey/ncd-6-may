import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Calculator, Activity, Info, AlertTriangle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Sex = "male" | "female";
type Mode = "exact" | "range";

/** ICMR (Asian Indian) categories, per ICMR / IOA / Asia-Pacific consensus */
function icmrCategory(bmi: number): { label: string; color: string; obesityClass?: string } {
  if (bmi < 18.5) return { label: "Underweight", color: "text-yellow-500" };
  if (bmi < 23) return { label: "Normal", color: "text-emerald-500" };
  if (bmi < 25) return { label: "Overweight / At Risk", color: "text-amber-500" };
  if (bmi < 30) return { label: "Obese", color: "text-orange-500", obesityClass: "Obesity Class I" };
  if (bmi < 35) return { label: "Obese", color: "text-red-500", obesityClass: "Obesity Class II" };
  return { label: "Severely Obese", color: "text-destructive", obesityClass: "Obesity Class III" };
}

function whoCategory(bmi: number): { label: string; color: string; obesityClass?: string } {
  if (bmi < 18.5) return { label: "Underweight", color: "text-yellow-500" };
  if (bmi < 25) return { label: "Normal", color: "text-emerald-500" };
  if (bmi < 30) return { label: "Overweight", color: "text-amber-500" };
  if (bmi < 35) return { label: "Obese", color: "text-orange-500", obesityClass: "Obesity Class I" };
  if (bmi < 40) return { label: "Obese", color: "text-red-500", obesityClass: "Obesity Class II" };
  return { label: "Severely Obese", color: "text-destructive", obesityClass: "Obesity Class III" };
}

/** Range option — value is a representative midpoint used for downstream logic */
type RangeOpt = { label: string; value: string };

const bmiRanges: RangeOpt[] = [
  { label: "< 18.5 (Underweight)", value: "17" },
  { label: "18.5 – 22.9 (Normal)", value: "21" },
  { label: "23 – 24.9 (Overweight / At Risk)", value: "24" },
  { label: "25 – 29.9 (Obese I)", value: "27" },
  { label: "30 – 34.9 (Obese II)", value: "32" },
  { label: "≥ 35 (Severely Obese)", value: "37" },
];

const waistRangesMale: RangeOpt[] = [
  { label: "< 90 cm (Normal)", value: "85" },
  { label: "90 – 99 cm (Elevated)", value: "94" },
  { label: "≥ 100 cm (High)", value: "104" },
];
const waistRangesFemale: RangeOpt[] = [
  { label: "< 80 cm (Normal)", value: "75" },
  { label: "80 – 89 cm (Elevated)", value: "84" },
  { label: "≥ 90 cm (High)", value: "94" },
];

const sbpRanges: RangeOpt[] = [
  { label: "< 120 (Normal)", value: "115" },
  { label: "120 – 129 (Elevated)", value: "125" },
  { label: "130 – 139 (Stage 1 HTN)", value: "135" },
  { label: "≥ 140 (Stage 2 HTN)", value: "145" },
];
const dbpRanges: RangeOpt[] = [
  { label: "< 80 (Normal)", value: "75" },
  { label: "80 – 84 (Elevated)", value: "82" },
  { label: "85 – 89 (Stage 1)", value: "87" },
  { label: "≥ 90 (Stage 2)", value: "95" },
];

const fbgRanges: RangeOpt[] = [
  { label: "< 100 mg/dL (Normal)", value: "90" },
  { label: "100 – 125 mg/dL (Prediabetes)", value: "110" },
  { label: "≥ 126 mg/dL (Diabetes)", value: "140" },
];

const tgRanges: RangeOpt[] = [
  { label: "< 150 mg/dL (Normal)", value: "120" },
  { label: "150 – 199 mg/dL (Borderline high)", value: "170" },
  { label: "200 – 499 mg/dL (High)", value: "300" },
  { label: "≥ 500 mg/dL (Very high)", value: "550" },
];

const hdlRangesMale: RangeOpt[] = [
  { label: "< 40 mg/dL (Low)", value: "35" },
  { label: "40 – 59 mg/dL (Normal)", value: "50" },
  { label: "≥ 60 mg/dL (Protective)", value: "65" },
];
const hdlRangesFemale: RangeOpt[] = [
  { label: "< 50 mg/dL (Low)", value: "45" },
  { label: "50 – 59 mg/dL (Normal)", value: "55" },
  { label: "≥ 60 mg/dL (Protective)", value: "65" },
];

/** Field with exact / range toggle */
function DualEntry({
  label,
  mode,
  onModeChange,
  ranges,
  value,
  onValueChange,
  placeholder,
  step = "0.1",
}: {
  label: React.ReactNode;
  mode: Mode;
  onModeChange: (m: Mode) => void;
  ranges: RangeOpt[];
  value: string;
  onValueChange: (v: string) => void;
  placeholder?: string;
  step?: string;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <Label>{label}</Label>
        <div className="flex rounded-md border border-border overflow-hidden text-[10px]">
          <button
            type="button"
            onClick={() => { onModeChange("exact"); onValueChange(""); }}
            className={cn("px-2 py-0.5", mode === "exact" ? "bg-primary text-primary-foreground" : "bg-muted/40")}
          >
            Exact
          </button>
          <button
            type="button"
            onClick={() => { onModeChange("range"); onValueChange(""); }}
            className={cn("px-2 py-0.5", mode === "range" ? "bg-primary text-primary-foreground" : "bg-muted/40")}
          >
            Range
          </button>
        </div>
      </div>
      {mode === "exact" ? (
        <Input type="number" step={step} placeholder={placeholder}
          value={value} onChange={(e) => onValueChange(e.target.value)} />
      ) : (
        <Select value={value} onValueChange={onValueChange}>
          <SelectTrigger><SelectValue placeholder="Select range" /></SelectTrigger>
          <SelectContent>
            {ranges.map((r) => (
              <SelectItem key={r.label} value={r.value}>{r.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
}

export default function IcmrIndiab() {
  // ---------- ICMR BMI calculator ----------
  const [bmiMode, setBmiMode] = useState<Mode>("exact");
  const [heightCm, setHeightCm] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [bmiRangeValue, setBmiRangeValue] = useState("");

  const bmi = useMemo(() => {
    if (bmiMode === "range") {
      const b = parseFloat(bmiRangeValue);
      return isNaN(b) ? null : b;
    }
    const h = parseFloat(heightCm);
    const w = parseFloat(weightKg);
    if (!h || !w || h < 30) return null;
    const b = w / ((h / 100) ** 2);
    return Math.round(b * 10) / 10;
  }, [bmiMode, bmiRangeValue, heightCm, weightKg]);

  const icmr = bmi != null ? icmrCategory(bmi) : null;
  const who = bmi != null ? whoCategory(bmi) : null;

  // ---------- INDIAB phenotype tool ----------
  const [sex, setSex] = useState<Sex>("male");

  const [phenBmiMode, setPhenBmiMode] = useState<Mode>("exact");
  const [phenBmi, setPhenBmi] = useState("");

  const [waistMode, setWaistMode] = useState<Mode>("exact");
  const [waist, setWaist] = useState("");

  const [sbpMode, setSbpMode] = useState<Mode>("exact");
  const [sbp, setSbp] = useState("");
  const [dbpMode, setDbpMode] = useState<Mode>("exact");
  const [dbp, setDbp] = useState("");
  const [onAntiHtn, setOnAntiHtn] = useState(false);

  const [fbgMode, setFbgMode] = useState<Mode>("exact");
  const [fbg, setFbg] = useState("");
  const [onDmRx, setOnDmRx] = useState(false);

  const [tgMode, setTgMode] = useState<Mode>("exact");
  const [tg, setTg] = useState("");

  const [hdlMode, setHdlMode] = useState<Mode>("exact");
  const [hdl, setHdl] = useState("");

  const waistRanges = sex === "male" ? waistRangesMale : waistRangesFemale;
  const hdlRanges = sex === "male" ? hdlRangesMale : hdlRangesFemale;

  const phenotype = useMemo(() => {
    const b = parseFloat(phenBmi);
    if (!b || b <= 0) return null;

    const abnormalities: { name: string; met: boolean; detail: string }[] = [];

    const w = parseFloat(waist);
    const wCut = sex === "male" ? 90 : 80;
    abnormalities.push({
      name: "Elevated waist circumference",
      met: !!w && w >= wCut,
      detail: `${sex === "male" ? "M" : "F"} ≥ ${wCut} cm${w ? ` (entered ${w})` : ""}`,
    });

    const s = parseFloat(sbp);
    const d = parseFloat(dbp);
    const bpMet = onAntiHtn || (!!s && s >= 130) || (!!d && d >= 85);
    abnormalities.push({
      name: "Elevated blood pressure",
      met: bpMet,
      detail: `SBP ≥ 130 or DBP ≥ 85 or on antihypertensive${s || d ? ` (entered ${s || "—"}/${d || "—"})` : ""}`,
    });

    const f = parseFloat(fbg);
    const fbgMet = onDmRx || (!!f && f >= 100);
    abnormalities.push({
      name: "Elevated fasting glucose",
      met: fbgMet,
      detail: `FBG ≥ 100 mg/dL or on diabetes therapy${f ? ` (entered ${f})` : ""}`,
    });

    const t = parseFloat(tg);
    abnormalities.push({
      name: "Elevated triglycerides",
      met: !!t && t >= 150,
      detail: `TG ≥ 150 mg/dL${t ? ` (entered ${t})` : ""}`,
    });

    const h = parseFloat(hdl);
    const hdlCut = sex === "male" ? 40 : 50;
    abnormalities.push({
      name: "Low HDL cholesterol",
      met: !!h && h < hdlCut,
      detail: `${sex === "male" ? "M" : "F"} < ${hdlCut} mg/dL${h ? ` (entered ${h})` : ""}`,
    });

    const abnCount = abnormalities.filter((a) => a.met).length;
    const metUnhealthy = abnCount >= 2;
    const isObese = b >= 25;

    let code: "MHNO" | "MONO" | "MHO" | "MOO";
    let name: string;
    let color: string;
    let interpretation: string;

    if (!isObese && !metUnhealthy) {
      code = "MHNO";
      name = "Metabolically Healthy Non-Obese";
      color = "text-emerald-500 border-emerald-500/40 bg-emerald-500/10";
      interpretation = "Lowest cardiometabolic risk profile. Maintain lifestyle; routine screening.";
    } else if (!isObese && metUnhealthy) {
      code = "MONO";
      name = "Metabolically Obese Non-Obese (thin-fat Indian phenotype)";
      color = "text-red-500 border-red-500/40 bg-red-500/10";
      interpretation = "High hidden cardiometabolic risk despite normal BMI — classic thin-fat Asian Indian pattern. Aggressive lifestyle intervention, screen for T2DM / dyslipidemia, treat individual risk factors.";
    } else if (isObese && !metUnhealthy) {
      code = "MHO";
      name = "Metabolically Healthy Obese";
      color = "text-amber-500 border-amber-500/40 bg-amber-500/10";
      interpretation = "Transient state — most convert to MOO within 5–10 years. Weight-loss intervention still indicated; annual metabolic reassessment.";
    } else {
      code = "MOO";
      name = "Metabolically Obese Obese";
      color = "text-destructive border-destructive/40 bg-destructive/10";
      interpretation = "Highest cardiometabolic risk. Multi-modal weight-loss (lifestyle + pharmacotherapy per ADA), aggressive control of BP, lipids, glycemia; consider bariatric referral if BMI ≥ 32.5 with comorbidities.";
    }

    return { code, name, color, interpretation, abnormalities, abnCount, isObese, bmi: b };
  }, [phenBmi, waist, sex, sbp, dbp, onAntiHtn, fbg, onDmRx, tg, hdl]);

  const useBmiFromAbove = () => {
    if (bmi != null) {
      setPhenBmiMode("exact");
      setPhenBmi(String(bmi));
    }
  };

  return (
    <div className="space-y-6">
      {/* ============ ICMR BMI Calculator ============ */}
      <Card className="clinical-card border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Calculator className="h-5 w-5" />
            ICMR (Asian Indian) BMI Calculator
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Enter height & weight, or pick a BMI range using ICMR cutoffs. Compared side-by-side with WHO.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-end">
            <div className="flex rounded-md border border-border overflow-hidden text-[10px]">
              <button
                type="button"
                onClick={() => { setBmiMode("exact"); setBmiRangeValue(""); }}
                className={cn("px-2 py-1", bmiMode === "exact" ? "bg-primary text-primary-foreground" : "bg-muted/40")}
              >
                Exact (H/W)
              </button>
              <button
                type="button"
                onClick={() => { setBmiMode("range"); setHeightCm(""); setWeightKg(""); }}
                className={cn("px-2 py-1", bmiMode === "range" ? "bg-primary text-primary-foreground" : "bg-muted/40")}
              >
                BMI Range
              </button>
            </div>
          </div>

          {bmiMode === "exact" ? (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="icmr-h">Height (cm)</Label>
                <Input id="icmr-h" type="number" step="0.1" placeholder="e.g., 165"
                  value={heightCm} onChange={(e) => setHeightCm(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="icmr-w">Weight (kg)</Label>
                <Input id="icmr-w" type="number" step="0.1" placeholder="e.g., 68"
                  value={weightKg} onChange={(e) => setWeightKg(e.target.value)} />
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <Label>BMI range (ICMR / Asian Indian)</Label>
              <Select value={bmiRangeValue} onValueChange={setBmiRangeValue}>
                <SelectTrigger><SelectValue placeholder="Select ICMR BMI range" /></SelectTrigger>
                <SelectContent>
                  {bmiRanges.map((r) => (
                    <SelectItem key={r.label} value={r.value}>{r.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[10px] text-muted-foreground">
                Ranges use ICMR cutoffs: 18.5 / 23 / 25 / 30 / 35. Midpoint is used to classify.
              </p>
            </div>
          )}

          {bmi != null && icmr && who && (
            <div className="space-y-3">
              <div className="rounded-lg border border-border bg-card/50 p-4 text-center">
                <p className="text-xs text-muted-foreground">Body Mass Index</p>
                <p className="text-4xl font-bold text-primary">{bmi}</p>
                <p className="text-xs text-muted-foreground">kg/m²{bmiMode === "range" && " (range midpoint)"}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border-2 border-primary/40 bg-primary/5 p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-primary">ICMR (Asian Indian)</p>
                  <p className={cn("mt-1 text-base font-bold", icmr.color)}>{icmr.label}</p>
                  {icmr.obesityClass && <Badge variant="outline" className="mt-1 text-[10px]">{icmr.obesityClass}</Badge>}
                  <p className="mt-2 text-[10px] text-muted-foreground">
                    Cutoffs: 18.5 / 23 / 25 / 30 / 35
                  </p>
                </div>
                <div className="rounded-lg border border-border bg-muted/20 p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">WHO Standard</p>
                  <p className={cn("mt-1 text-base font-bold", who.color)}>{who.label}</p>
                  {who.obesityClass && <Badge variant="outline" className="mt-1 text-[10px]">{who.obesityClass}</Badge>}
                  <p className="mt-2 text-[10px] text-muted-foreground">
                    Cutoffs: 18.5 / 25 / 30 / 35 / 40
                  </p>
                </div>
              </div>

              {icmr.label !== who.label && (
                <Alert className="border-amber-500/40 bg-amber-500/10">
                  <Info className="h-4 w-4 text-amber-500" />
                  <AlertDescription className="text-xs">
                    <strong>ICMR reclassification:</strong> This BMI is <em>{icmr.label}</em> by Asian Indian
                    cutoffs but only <em>{who.label}</em> by WHO. Indian patients carry higher visceral fat
                    and diabetes/CVD risk at the same BMI — treat by the ICMR line.
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex justify-end">
                <Button size="sm" variant="outline" onClick={useBmiFromAbove}>
                  Use BMI {bmi} in phenotype tool ↓
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ============ INDIAB Phenotype Tool ============ */}
      <Card className="clinical-card border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Activity className="h-5 w-5" />
            ICMR-INDIAB Phenotype Classifier
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Every field supports <strong>Exact</strong> value entry or a clinical <strong>Range</strong> picker. Classifies MHNO / MONO / MHO / MOO by BMI (≥25 vs &lt;25) and count of metabolic abnormalities (≥2 = unhealthy).
          </p>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="phen-sex">Sex</Label>
              <Select value={sex} onValueChange={(v) => setSex(v as Sex)}>
                <SelectTrigger id="phen-sex"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DualEntry
              label="BMI (kg/m²)"
              mode={phenBmiMode}
              onModeChange={setPhenBmiMode}
              ranges={bmiRanges}
              value={phenBmi}
              onValueChange={setPhenBmi}
              placeholder="e.g., 26.5"
            />
          </div>

          <div className="rounded-lg border border-dashed border-border p-4 space-y-4 bg-muted/20">
            <p className="text-sm font-semibold">Metabolic abnormalities (INDIAB / IDF South Asian)</p>

            <DualEntry
              label={<>Waist circumference (cm) — cutoff {sex === "male" ? "≥ 90" : "≥ 80"}</>}
              mode={waistMode}
              onModeChange={setWaistMode}
              ranges={waistRanges}
              value={waist}
              onValueChange={setWaist}
              placeholder="optional"
            />

            <div className="space-y-2">
              <Label>Blood pressure (mmHg) — cutoff ≥ 130 / 85</Label>
              <div className="grid grid-cols-2 gap-3">
                <DualEntry
                  label={<span className="text-xs">SBP</span>}
                  mode={sbpMode}
                  onModeChange={setSbpMode}
                  ranges={sbpRanges}
                  value={sbp}
                  onValueChange={setSbp}
                  placeholder="SBP"
                  step="1"
                />
                <DualEntry
                  label={<span className="text-xs">DBP</span>}
                  mode={dbpMode}
                  onModeChange={setDbpMode}
                  ranges={dbpRanges}
                  value={dbp}
                  onValueChange={setDbp}
                  placeholder="DBP"
                  step="1"
                />
              </div>
              <label className="flex items-center gap-2 text-xs">
                <Checkbox checked={onAntiHtn} onCheckedChange={(v) => setOnAntiHtn(!!v)} />
                On antihypertensive therapy
              </label>
            </div>

            <div className="space-y-2">
              <DualEntry
                label="Fasting glucose (mg/dL) — cutoff ≥ 100"
                mode={fbgMode}
                onModeChange={setFbgMode}
                ranges={fbgRanges}
                value={fbg}
                onValueChange={setFbg}
                placeholder="optional"
              />
              <label className="flex items-center gap-2 text-xs">
                <Checkbox checked={onDmRx} onCheckedChange={(v) => setOnDmRx(!!v)} />
                On diabetes therapy
              </label>
            </div>

            <DualEntry
              label="Triglycerides (mg/dL) — cutoff ≥ 150"
              mode={tgMode}
              onModeChange={setTgMode}
              ranges={tgRanges}
              value={tg}
              onValueChange={setTg}
              placeholder="optional"
            />

            <DualEntry
              label={<>HDL cholesterol (mg/dL) — cutoff {sex === "male" ? "< 40" : "< 50"}</>}
              mode={hdlMode}
              onModeChange={setHdlMode}
              ranges={hdlRanges}
              value={hdl}
              onValueChange={setHdl}
              placeholder="optional"
            />
          </div>

          {phenotype && (
            <div className="space-y-3">
              <div className={cn("rounded-lg border-2 p-4", phenotype.color)}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide opacity-70">Phenotype</p>
                    <p className="text-2xl font-extrabold">{phenotype.code}</p>
                    <p className="text-sm font-semibold">{phenotype.name}</p>
                  </div>
                  <div className="text-right text-xs">
                    <p>BMI {phenotype.bmi} → {phenotype.isObese ? "≥ 25 (obese)" : "< 25 (non-obese)"}</p>
                    <p>{phenotype.abnCount}/5 metabolic abnormalities → {phenotype.abnCount >= 2 ? "unhealthy" : "healthy"}</p>
                  </div>
                </div>
                <p className="mt-3 text-xs leading-relaxed">{phenotype.interpretation}</p>
              </div>

              <div className="rounded-lg border border-border bg-card/50 p-4">
                <p className="text-xs font-semibold mb-2">Abnormality checklist</p>
                <ul className="space-y-1.5">
                  {phenotype.abnormalities.map((a) => (
                    <li key={a.name} className="flex items-start gap-2 text-xs">
                      {a.met
                        ? <AlertTriangle className="h-3.5 w-3.5 mt-0.5 text-destructive shrink-0" />
                        : <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 text-muted-foreground shrink-0" />}
                      <div className="flex-1">
                        <span className={cn("font-semibold", a.met && "text-destructive")}>{a.name}</span>
                        <span className="text-muted-foreground"> — {a.detail}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-lg border border-border bg-muted/20 p-3 text-[11px] text-muted-foreground leading-relaxed">
                <p className="font-semibold text-foreground mb-1">Reference — 2×2 phenotype grid</p>
                <div className="grid grid-cols-3 gap-1 mt-2">
                  <div />
                  <div className="text-center font-semibold">&lt; 2 abn.</div>
                  <div className="text-center font-semibold">≥ 2 abn.</div>
                  <div className="font-semibold">BMI &lt; 25</div>
                  <div className="text-center rounded bg-emerald-500/10 border border-emerald-500/30 py-1">MHNO</div>
                  <div className="text-center rounded bg-red-500/10 border border-red-500/30 py-1">MONO</div>
                  <div className="font-semibold">BMI ≥ 25</div>
                  <div className="text-center rounded bg-amber-500/10 border border-amber-500/30 py-1">MHO</div>
                  <div className="text-center rounded bg-destructive/10 border border-destructive/30 py-1">MOO</div>
                </div>
                <p className="mt-2">
                  Source: Anjana et al., ICMR-INDIAB phenotypes; IDF South Asian metabolic-syndrome cutoffs.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
