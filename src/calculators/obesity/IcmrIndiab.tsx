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
import { getBmiCategory } from "./obesity-guidelines";

type Sex = "male" | "female";

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

export default function IcmrIndiab() {
  // ---------- ICMR BMI calculator ----------
  const [heightCm, setHeightCm] = useState("");
  const [weightKg, setWeightKg] = useState("");

  const bmi = useMemo(() => {
    const h = parseFloat(heightCm);
    const w = parseFloat(weightKg);
    if (!h || !w || h < 30) return null;
    const b = w / ((h / 100) ** 2);
    return Math.round(b * 10) / 10;
  }, [heightCm, weightKg]);

  const icmr = bmi != null ? icmrCategory(bmi) : null;
  const who = bmi != null ? whoCategory(bmi) : null;

  // ---------- INDIAB phenotype tool ----------
  const [sex, setSex] = useState<Sex>("male");
  const [phenBmi, setPhenBmi] = useState("");
  const [waist, setWaist] = useState("");
  const [sbp, setSbp] = useState("");
  const [dbp, setDbp] = useState("");
  const [onAntiHtn, setOnAntiHtn] = useState(false);
  const [fbg, setFbg] = useState("");
  const [onDmRx, setOnDmRx] = useState(false);
  const [tg, setTg] = useState("");
  const [hdl, setHdl] = useState("");

  const phenotype = useMemo(() => {
    const b = parseFloat(phenBmi);
    if (!b || b <= 0) return null;

    const abnormalities: { name: string; met: boolean; detail: string }[] = [];

    // 1. Elevated waist (ICMR/IDF South Asian cutoffs)
    const w = parseFloat(waist);
    const wCut = sex === "male" ? 90 : 80;
    abnormalities.push({
      name: "Elevated waist circumference",
      met: !!w && w >= wCut,
      detail: `${sex === "male" ? "M" : "F"} ≥ ${wCut} cm${w ? ` (entered ${w})` : ""}`,
    });

    // 2. Elevated BP
    const s = parseFloat(sbp);
    const d = parseFloat(dbp);
    const bpMet = onAntiHtn || (!!s && s >= 130) || (!!d && d >= 85);
    abnormalities.push({
      name: "Elevated blood pressure",
      met: bpMet,
      detail: `SBP ≥ 130 or DBP ≥ 85 or on antihypertensive${s || d ? ` (entered ${s || "—"}/${d || "—"})` : ""}`,
    });

    // 3. Elevated fasting glucose
    const f = parseFloat(fbg);
    const fbgMet = onDmRx || (!!f && f >= 100);
    abnormalities.push({
      name: "Elevated fasting glucose",
      met: fbgMet,
      detail: `FBG ≥ 100 mg/dL or on diabetes therapy${f ? ` (entered ${f})` : ""}`,
    });

    // 4. Elevated triglycerides
    const t = parseFloat(tg);
    abnormalities.push({
      name: "Elevated triglycerides",
      met: !!t && t >= 150,
      detail: `TG ≥ 150 mg/dL${t ? ` (entered ${t})` : ""}`,
    });

    // 5. Low HDL
    const h = parseFloat(hdl);
    const hdlCut = sex === "male" ? 40 : 50;
    abnormalities.push({
      name: "Low HDL cholesterol",
      met: !!h && h < hdlCut,
      detail: `${sex === "male" ? "M" : "F"} < ${hdlCut} mg/dL${h ? ` (entered ${h})` : ""}`,
    });

    const abnCount = abnormalities.filter((a) => a.met).length;
    const metUnhealthy = abnCount >= 2;
    const isObese = b >= 25; // ICMR / Asian Indian cutoff

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

  // Auto-copy BMI from ICMR calculator into phenotype tool
  const useBmiFromAbove = () => {
    if (bmi != null) setPhenBmi(String(bmi));
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
            Classifies BMI using ICMR / Asia-Pacific cutoffs with side-by-side WHO comparison.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
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

          {bmi != null && icmr && who && (
            <div className="space-y-3">
              <div className="rounded-lg border border-border bg-card/50 p-4 text-center">
                <p className="text-xs text-muted-foreground">Body Mass Index</p>
                <p className="text-4xl font-bold text-primary">{bmi}</p>
                <p className="text-xs text-muted-foreground">kg/m²</p>
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
            Classifies MHNO / MONO / MHO / MOO by BMI (≥25 vs &lt;25) and count of metabolic abnormalities (≥2 = unhealthy).
          </p>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Sex + BMI */}
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
            <div className="space-y-2">
              <Label htmlFor="phen-bmi">BMI (kg/m²)</Label>
              <Input id="phen-bmi" type="number" step="0.1" placeholder="e.g., 26.5"
                value={phenBmi} onChange={(e) => setPhenBmi(e.target.value)} />
            </div>
          </div>

          {/* Metabolic abnormalities */}
          <div className="rounded-lg border border-dashed border-border p-4 space-y-4 bg-muted/20">
            <p className="text-sm font-semibold">Metabolic abnormalities (INDIAB / IDF South Asian)</p>

            <div className="space-y-2">
              <Label>Waist circumference (cm) — cutoff {sex === "male" ? "≥ 90" : "≥ 80"}</Label>
              <Input type="number" step="0.1" placeholder="optional"
                value={waist} onChange={(e) => setWaist(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label>Blood pressure (mmHg) — cutoff ≥ 130 / 85</Label>
              <div className="grid grid-cols-2 gap-3">
                <Input type="number" placeholder="SBP" value={sbp} onChange={(e) => setSbp(e.target.value)} />
                <Input type="number" placeholder="DBP" value={dbp} onChange={(e) => setDbp(e.target.value)} />
              </div>
              <label className="flex items-center gap-2 text-xs">
                <Checkbox checked={onAntiHtn} onCheckedChange={(v) => setOnAntiHtn(!!v)} />
                On antihypertensive therapy
              </label>
            </div>

            <div className="space-y-2">
              <Label>Fasting glucose (mg/dL) — cutoff ≥ 100</Label>
              <Input type="number" step="0.1" placeholder="optional"
                value={fbg} onChange={(e) => setFbg(e.target.value)} />
              <label className="flex items-center gap-2 text-xs">
                <Checkbox checked={onDmRx} onCheckedChange={(v) => setOnDmRx(!!v)} />
                On diabetes therapy
              </label>
            </div>

            <div className="space-y-2">
              <Label>Triglycerides (mg/dL) — cutoff ≥ 150</Label>
              <Input type="number" step="0.1" placeholder="optional"
                value={tg} onChange={(e) => setTg(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label>HDL cholesterol (mg/dL) — cutoff {sex === "male" ? "< 40" : "< 50"}</Label>
              <Input type="number" step="0.1" placeholder="optional"
                value={hdl} onChange={(e) => setHdl(e.target.value)} />
            </div>
          </div>

          {/* Phenotype output */}
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
