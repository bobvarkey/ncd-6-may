import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Home, Printer, Copy, Syringe, Scale, AlertTriangle, CheckCircle2, Info } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import Seo from "@/components/Seo";
import { downloadTextFile } from "@/lib/clinical-utils";

type Mode = "global" | "india";
type Sex = "male" | "female";
type Med = "semaglutide" | "tirzepatide" | "liraglutide";
type Goal = "weight" | "diabetes";

const COMORBIDITIES = [
  "Type 2 Diabetes", "Prediabetes", "Hypertension", "Dyslipidemia",
  "Obstructive Sleep Apnea", "Cardiovascular Disease", "Heart Failure (HFpEF)",
  "MASLD / NAFLD", "Osteoarthritis", "PCOS", "CKD", "GERD",
];

const CONTRAINDICATIONS = [
  "Pregnancy",
  "Personal/family history of medullary thyroid carcinoma or MEN2",
  "History of pancreatitis",
  "Active gallbladder disease",
  "Severe GI disease / gastroparesis concern",
  "Current severe dehydration or acute illness",
  "Needs medication-specific renal/hepatic review",
];

const EOSS: Record<number, string> = {
  0: "No apparent obesity-related risk factors, symptoms, psychopathology, or functional limitation.",
  1: "Subclinical risk factors or mild physical, psychological, or functional impact.",
  2: "Established obesity-related chronic disease requiring medical treatment or moderate functional/psychological impact.",
  3: "End-organ damage, significant psychopathology, or major functional limitation.",
  4: "Severe or potentially end-stage obesity-related disability or impairment.",
};

const SCHEDULES: Record<Med, Record<Goal, string[]>> = {
  semaglutide: {
    weight: [
      "Week 1–4: 0.25 mg weekly",
      "Week 5–8: 0.5 mg weekly",
      "Week 9–12: 1.0 mg weekly",
      "Week 13–16: 1.7 mg weekly",
      "Week 17+: 2.4 mg weekly (maintenance)",
    ],
    diabetes: [
      "Follow local diabetes product label",
      "Typical step-up: 0.25 → 0.5 → 1.0 mg weekly",
      "Dose and maximum depend on approved product in your market",
    ],
  },
  tirzepatide: {
    weight: [
      "Week 1–4: 2.5 mg weekly",
      "Week 5–8: 5 mg weekly",
      "Week 9–12: 7.5 mg weekly",
      "Week 13–16: 10 mg weekly",
      "Week 17–20: 12.5 mg weekly",
      "Week 21+: 15 mg weekly (maintenance)",
    ],
    diabetes: [
      "Week 1–4: 2.5 mg weekly",
      "Increase by 2.5 mg every 4 weeks as tolerated",
      "Follow local product label for maintenance maximum",
    ],
  },
  liraglutide: {
    weight: [
      "Day 1–7: 0.6 mg daily",
      "Day 8–14: 1.2 mg daily",
      "Day 15–21: 1.8 mg daily",
      "Day 22–28: 2.4 mg daily",
      "Day 29+: 3.0 mg daily (maintenance)",
    ],
    diabetes: [
      "Day 1–7: 0.6 mg daily",
      "Then 1.2 mg daily; may increase to 1.8 mg daily",
      "Follow local diabetes label",
    ],
  },
};

function bmiCategory(bmi: number, mode: Mode): string {
  if (!Number.isFinite(bmi)) return "-";
  if (mode === "india") {
    if (bmi < 18.5) return "Underweight";
    if (bmi < 23) return "Normal";
    if (bmi < 25) return "Increased-risk band";
    if (bmi < 30) return "Obesity (India-adjusted)";
    return "High obesity band";
  }
  if (bmi < 18.5) return "Underweight";
  if (bmi < 25) return "Normal";
  if (bmi < 30) return "Overweight";
  if (bmi < 35) return "Obesity class I";
  if (bmi < 40) return "Obesity class II";
  return "Obesity class III";
}

function Pill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "px-3 py-1.5 rounded-full border text-xs font-semibold transition",
        active ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:bg-muted"
      )}
    >
      {children}
    </button>
  );
}

export default function GLP1AssessmentCalculator() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("global");
  const [sex, setSex] = useState<Sex>("male");
  const [heightCm, setHeightCm] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [waistCm, setWaistCm] = useState("");
  const [eoss, setEoss] = useState("0");
  const [comorb, setComorb] = useState<string[]>([]);
  const [contra, setContra] = useState<string[]>([]);
  const [med, setMed] = useState<Med>("semaglutide");
  const [goal, setGoal] = useState<Goal>("weight");
  const [doseStep, setDoseStep] = useState(0);

  const result = useMemo(() => {
    const h = parseFloat(heightCm);
    const w = parseFloat(weightKg);
    const wa = parseFloat(waistCm);
    const e = parseInt(eoss || "0", 10);
    const bmi = Number.isFinite(h) && Number.isFinite(w) && h > 0 ? w / (h / 100) ** 2 : NaN;
    const whtr = Number.isFinite(h) && Number.isFinite(wa) && h > 0 ? wa / h : NaN;
    const waistThr = sex === "male" ? 90 : 80;
    const central =
      (Number.isFinite(wa) && wa >= waistThr) || (Number.isFinite(whtr) && whtr > 0.5);

    let eligible = false;
    let rule = "";
    if (mode === "global") {
      eligible = bmi >= 30 || (bmi >= 27 && comorb.length > 0);
      rule = "BMI ≥30, or BMI ≥27 with at least 1 comorbidity.";
    } else {
      eligible = bmi >= 27.5 || (bmi >= 25 && (comorb.length > 0 || central));
      rule = "BMI ≥27.5, or BMI ≥25 with ≥1 comorbidity and/or central obesity.";
    }

    const interp: string[] = [
      `EOSS stage ${e}: ${EOSS[e]}`,
      central
        ? "Central obesity marker present by waist and/or WHtR."
        : "Central obesity marker not identified from entered values.",
      contra.length > 0
        ? "One or more contraindication/caution items require clinician review before prescribing."
        : "No contraindication items selected.",
    ];
    if (eligible && contra.length === 0) {
      interp.push(
        e >= 3
          ? "High clinical complexity; specialist obesity/endocrine review advisable."
          : e === 2
          ? "Eligible for pharmacotherapy consideration within comprehensive obesity care."
          : "Screening-positive; confirm goals, risks, and patient preference before prescribing."
      );
    } else if (eligible && contra.length > 0) {
      interp.push("Screening-positive but treatment suitability remains conditional pending caution review.");
    } else {
      interp.push("Consider lifestyle, cardiometabolic risk assessment, and re-evaluation over time.");
    }

    return { h, w, wa, e, bmi, whtr, central, eligible, rule, interp };
  }, [heightCm, weightKg, waistCm, eoss, sex, mode, comorb, contra]);

  const schedule = SCHEDULES[med][goal];
  const clampedStep = Math.min(doseStep, schedule.length - 1);

  const report = useMemo(() => {
    const lines = [
      "GLP-1 ASSESSMENT REPORT",
      "--------------------------------",
      `Mode: ${mode === "india" ? "India-adjusted" : "Global / standard"}`,
      `Sex: ${sex}`,
      `Height: ${Number.isFinite(result.h) ? result.h.toFixed(1) + " cm" : "-"}`,
      `Weight: ${Number.isFinite(result.w) ? result.w.toFixed(1) + " kg" : "-"}`,
      `BMI: ${Number.isFinite(result.bmi) ? result.bmi.toFixed(1) + " kg/m²" : "-"}`,
      `BMI category: ${bmiCategory(result.bmi, mode)}`,
      `Waist: ${Number.isFinite(result.wa) ? result.wa.toFixed(1) + " cm" : "-"}`,
      `WHtR: ${Number.isFinite(result.whtr) ? result.whtr.toFixed(2) : "-"}`,
      `Central obesity: ${result.central ? "Present" : "Not identified"}`,
      `EOSS stage: ${result.e}`,
      `Medication: ${med}`,
      `Goal: ${goal === "weight" ? "Weight management" : "T2DM / glycemic support"}`,
      `Selected dose step: ${schedule[clampedStep]}`,
      `Comorbidities (${comorb.length}): ${comorb.length ? comorb.join(", ") : "None"}`,
      `Contraindications/cautions (${contra.length}): ${contra.length ? contra.join(", ") : "None"}`,
      `Eligibility: ${result.eligible ? "Meets screening criteria" : "Does not meet screening criteria"}`,
      `Rule applied: ${result.rule}`,
      "",
      "Clinical interpretation:",
      ...result.interp.map((x, i) => `${i + 1}. ${x}`),
      "",
      "Note: Supports clinic screening only; does not replace product-label dosing, lab review, or prescribing judgment.",
    ];
    return lines.join("\n");
  }, [mode, sex, result, med, goal, schedule, clampedStep, comorb, contra]);

  const toggleList = (list: string[], setter: (v: string[]) => void, val: string) => {
    setter(list.includes(val) ? list.filter((x) => x !== val) : [...list, val]);
  };

  const copyReport = async () => {
    try {
      await navigator.clipboard.writeText(report);
    } catch { /* ignore */ }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Seo
        title="GLP-1 Assessment Calculator | Obesity"
        description="Eligibility, dose titration, and prescribing report for semaglutide, tirzepatide, and liraglutide with Global vs India-adjusted thresholds."
      />
      <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-4">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <Syringe className="w-5 h-5 text-primary" />
            <h1 className="text-xl sm:text-2xl font-semibold">GLP-1 Assessment Calculator</h1>
          </div>
          <Button variant="ghost" size="sm" onClick={() => navigate("/")}>
            <Home className="w-4 h-4 mr-1" /> Home
          </Button>
        </div>

        {/* Prominent India / Global toggle */}
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="p-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold">Patient population:</span>
              <span className="text-xs text-muted-foreground">
                {mode === "india"
                  ? "India-adjusted cut-offs (BMI ≥23 overweight, ≥25 obesity; waist ≥90 cm M / ≥80 cm F)"
                  : "Global / WHO cut-offs (BMI ≥25 overweight, ≥30 obesity)"}
              </span>
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    aria-label="Show India-adjusted GLP-1 eligibility criteria"
                    aria-haspopup="dialog"
                    className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
                  >
                    <Info className="w-3.5 h-3.5" aria-hidden="true" /> India criteria
                  </button>
                </PopoverTrigger>
                <PopoverContent
                  side="bottom"
                  align="start"
                  role="dialog"
                  aria-labelledby="india-criteria-title"
                  aria-describedby="india-criteria-desc"
                  className="w-80 text-xs space-y-2"
                >
                  <h2 id="india-criteria-title" className="font-semibold text-sm">
                    India-adjusted GLP-1 eligibility
                  </h2>
                  <p id="india-criteria-desc" className="text-muted-foreground">
                    Based on ObSI/IASO-APA 2022 &amp; RSSDI/ICMR consensus — Asian Indians develop
                    cardiometabolic risk at lower BMI and waist thresholds than Western populations.
                  </p>
                  <div className="rounded-md border overflow-hidden">
                    <table className="w-full" aria-label="India versus global cut-offs">
                      <caption className="sr-only">
                        India-adjusted versus global BMI, waist, and WHtR cut-offs
                      </caption>
                      <thead className="bg-muted/60">
                        <tr>
                          <th scope="col" className="text-left px-2 py-1">Parameter</th>
                          <th scope="col" className="text-left px-2 py-1">India</th>
                          <th scope="col" className="text-left px-2 py-1">Global</th>
                        </tr>
                      </thead>
                      <tbody className="[&_td]:px-2 [&_td]:py-1 [&_td]:border-t">
                        <tr><th scope="row" className="text-left font-normal">Overweight (BMI)</th><td>≥ 23</td><td>≥ 25</td></tr>
                        <tr><th scope="row" className="text-left font-normal">Obesity (BMI)</th><td>≥ 25</td><td>≥ 30</td></tr>
                        <tr><th scope="row" className="text-left font-normal">Waist – Male</th><td>≥ 90 cm</td><td>≥ 102 cm</td></tr>
                        <tr><th scope="row" className="text-left font-normal">Waist – Female</th><td>≥ 80 cm</td><td>≥ 88 cm</td></tr>
                        <tr><th scope="row" className="text-left font-normal">WHtR (both sexes)</th><td>&gt; 0.5</td><td>&gt; 0.5</td></tr>
                      </tbody>
                    </table>
                  </div>
                  <div className="space-y-1">
                    <div className="font-semibold">GLP-1 candidacy (India)</div>
                    <ul className="list-disc pl-4 space-y-0.5 text-muted-foreground">
                      <li>BMI ≥ 27.5, or</li>
                      <li>BMI ≥ 25 with a weight-related comorbidity, or</li>
                      <li>BMI ≥ 23 with central obesity + T2D / prediabetes / MASLD / OSA</li>
                    </ul>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Refs: ObSI 2022; RSSDI-ESI 2022; ICMR-INDIAB; Misra et al., JAPI 2009.
                  </p>
                </PopoverContent>
              </Popover>
            </div>
            <div role="radiogroup" aria-label="Patient population" className="inline-flex rounded-full border bg-background p-0.5">
              <button
                type="button"
                role="radio"
                aria-checked={mode === "global"}
                onClick={() => setMode("global")}
                className={cn(
                  "px-3 py-1 text-xs font-semibold rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                  mode === "global" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                Global
              </button>
              <button
                type="button"
                role="radio"
                aria-checked={mode === "india"}
                onClick={() => setMode("india")}
                className={cn(
                  "px-3 py-1 text-xs font-semibold rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                  mode === "india" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                Indian patient
              </button>
            </div>
          </CardContent>
        </Card>

        {/* KPI dashboard */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card><CardContent className="p-3">
            <div className="text-xs text-muted-foreground">BMI</div>
            <div className="text-xl font-bold">{Number.isFinite(result.bmi) ? result.bmi.toFixed(1) : "-"}</div>
            <div className="text-[11px] text-muted-foreground">{bmiCategory(result.bmi, mode)}</div>
          </CardContent></Card>
          <Card><CardContent className="p-3">
            <div className="text-xs text-muted-foreground">WHtR</div>
            <div className="text-xl font-bold">{Number.isFinite(result.whtr) ? result.whtr.toFixed(2) : "-"}</div>
            <div className="text-[11px] text-muted-foreground">{result.central ? "Central obesity" : "—"}</div>
          </CardContent></Card>
          <Card><CardContent className="p-3">
            <div className="text-xs text-muted-foreground">Eligibility</div>
            <div className={cn("text-xl font-bold", result.eligible ? "text-emerald-600" : "text-rose-600")}>
              {result.eligible ? "Eligible" : "Not eligible"}
            </div>
          </CardContent></Card>
          <Card><CardContent className="p-3">
            <div className="text-xs text-muted-foreground">Action</div>
            <div className="text-sm font-semibold">
              {result.eligible ? (contra.length > 0 ? "Review cautions" : "Consider treatment") : "Lifestyle / follow-up"}
            </div>
          </CardContent></Card>
        </div>

        {/* Mode / sex toggle */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2"><Scale className="w-4 h-4" /> Screening mode & anthropometrics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-muted-foreground mr-1">Threshold set:</span>
              <Pill active={mode === "global"} onClick={() => setMode("global")}>Global</Pill>
              <Pill active={mode === "india"} onClick={() => setMode("india")}>India-adjusted</Pill>
              <span className="text-xs text-muted-foreground ml-3 mr-1">Sex:</span>
              <Pill active={sex === "male"} onClick={() => setSex("male")}>Male</Pill>
              <Pill active={sex === "female"} onClick={() => setSex("female")}>Female</Pill>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div><Label>Height (cm)</Label><Input type="number" step="0.1" value={heightCm} onChange={(e) => setHeightCm(e.target.value)} placeholder="168" /></div>
              <div><Label>Weight (kg)</Label><Input type="number" step="0.1" value={weightKg} onChange={(e) => setWeightKg(e.target.value)} placeholder="86" /></div>
              <div><Label>Waist (cm)</Label><Input type="number" step="0.1" value={waistCm} onChange={(e) => setWaistCm(e.target.value)} placeholder="98" /></div>
              <div>
                <Label>EOSS stage</Label>
                <Select value={eoss} onValueChange={setEoss}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[0,1,2,3,4].map((s) => <SelectItem key={s} value={String(s)}>Stage {s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              India mode flags abdominal obesity at ≥90 cm (M) / ≥80 cm (F); WHtR &gt;0.5 = elevated risk.
            </p>
          </CardContent>
        </Card>

        {/* Comorbidities & contraindications */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Comorbidities</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {COMORBIDITIES.map((c) => (
                  <label key={c} className="flex items-start gap-2 text-xs p-2 rounded border cursor-pointer hover:bg-muted/40">
                    <input type="checkbox" checked={comorb.includes(c)} onChange={() => toggleList(comorb, setComorb, c)} className="mt-0.5" />
                    <span>{c}</span>
                  </label>
                ))}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-amber-500" /> Contraindications / cautions</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-2">
                {CONTRAINDICATIONS.map((c) => (
                  <label key={c} className="flex items-start gap-2 text-xs p-2 rounded border cursor-pointer hover:bg-muted/40">
                    <input type="checkbox" checked={contra.includes(c)} onChange={() => toggleList(contra, setContra, c)} className="mt-0.5" />
                    <span>{c}</span>
                  </label>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Medication selection */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2"><Syringe className="w-4 h-4 text-primary" /> Medication selection & titration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {(["semaglutide","tirzepatide","liraglutide"] as Med[]).map((m) => (
                <Pill key={m} active={med === m} onClick={() => { setMed(m); setDoseStep(0); }}>
                  {m[0].toUpperCase() + m.slice(1)}
                </Pill>
              ))}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label>Primary goal</Label>
                <Select value={goal} onValueChange={(v) => { setGoal(v as Goal); setDoseStep(0); }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weight">Weight management</SelectItem>
                    <SelectItem value="diabetes">Type 2 diabetes / glycemic support</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Current / planned titration step</Label>
                <Select value={String(clampedStep)} onValueChange={(v) => setDoseStep(parseInt(v, 10))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {schedule.map((s, i) => <SelectItem key={i} value={String(i)}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="rounded-lg border bg-emerald-500/5 p-3">
              <div className="text-xs font-semibold mb-1">Dose schedule</div>
              <ol className="text-xs space-y-0.5 list-decimal ml-4">
                {schedule.map((s, i) => (
                  <li key={i} className={i === clampedStep ? "font-semibold text-emerald-700" : ""}>{s}</li>
                ))}
              </ol>
            </div>
          </CardContent>
        </Card>

        {/* Summary + report */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              {result.eligible ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertTriangle className="w-4 h-4 text-rose-600" />}
              Clinic summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className={cn(
              "rounded-lg border p-3 text-sm",
              result.eligible
                ? contra.length ? "bg-amber-500/5 border-amber-500/30" : "bg-emerald-500/5 border-emerald-500/30"
                : "bg-rose-500/5 border-rose-500/30"
            )}>
              <div className="font-semibold mb-1">
                {result.eligible ? "Meets screening criteria" : "Does not meet screening criteria"}
              </div>
              <div className="text-xs text-muted-foreground">{result.rule}</div>
              {contra.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {contra.map((c) => <Badge key={c} variant="destructive" className="text-[10px]">{c}</Badge>)}
                </div>
              )}
            </div>
            <div className="rounded-lg border p-3 bg-muted/30">
              <div className="text-xs font-semibold mb-1">Interpretation</div>
              <ul className="text-xs space-y-0.5 list-disc ml-4">
                {result.interp.map((x, i) => <li key={i}>{x}</li>)}
              </ul>
            </div>
            <div>
              <Label className="text-xs">Printable report</Label>
              <Textarea value={report} readOnly rows={12} className="font-mono text-[11px] mt-1" />
              <div className="flex flex-wrap gap-2 mt-2">
                <Button size="sm" variant="outline" onClick={() => window.print()}>
                  <Printer className="w-4 h-4 mr-1" /> Print / PDF
                </Button>
                <Button size="sm" variant="outline" onClick={copyReport}>
                  <Copy className="w-4 h-4 mr-1" /> Copy
                </Button>
                <Button size="sm" variant="outline" onClick={() => downloadTextFile("glp1-assessment.txt", report)}>
                  Download .txt
                </Button>
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Decision support only. Verify against local product labels, renal/hepatic status, and current guidelines before prescribing.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
