import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertTriangle, CheckCircle2, ChevronLeft, ChevronRight, Copy, Download, Syringe } from "lucide-react";
import { copyToClipboard, downloadTextFile } from "@/lib/clinical-utils";

type Severity = "critical" | "high" | "moderate";
type Flag = { id: string; severity: Severity; message: string };

const CONDITIONS = [
  "Obesity (BMI 30 or more)",
  "Overweight with weight-related comorbidity",
  "Type 2 diabetes",
  "Atherosclerotic cardiovascular disease",
  "Heart failure",
  "Chronic kidney disease",
];

const GOALS = [
  "Weight loss",
  "Glycaemic control",
  "Cardiovascular risk reduction",
  "Renal risk reduction",
  "Improved mobility or function",
];

const GI_OPTIONS = [
  "none_known",
  "mild_symptoms",
  "persistent_nausea_vomiting_or_pain",
  "severe_gastroparesis",
  "severe_gi_disease",
];

const RETINOPATHY_OPTIONS = ["none", "non_proliferative", "proliferative_or_high_risk", "unknown"];
const AGENTS = ["Semaglutide", "Tirzepatide", "Liraglutide", "Dulaglutide", "Not yet chosen"];

const STEPS = [
  "Indication and Goals",
  "Contraindications and Cautions",
  "Psychology, Nutrition and Function",
  "Baseline Examination and Labs",
  "Medication Review",
  "Decision and Follow-up Plan",
];

const COUNSELLING = [
  "Gradual dose titration explained",
  "Nausea / vomiting / constipation management",
  "Protein, hydration and fibre plan",
  "Pancreatitis warning symptoms",
  "Gallbladder warning symptoms",
  "Hypoglycaemia education (if applicable)",
  "Retinal follow-up (if applicable)",
  "Mood-change reporting",
  "Follow-up appointment booked",
];

const pretty = (s: string) => s.replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase());

const toggle = (list: string[], value: string) =>
  list.includes(value) ? list.filter((v) => v !== value) : [...list, value];

export default function GLP1PreInitiationScreener() {
  const [step, setStep] = useState(0);

  // Step 1
  const [age, setAge] = useState("");
  const [sex, setSex] = useState("");
  const [pregnancyStatus, setPregnancyStatus] = useState("not_applicable_or_unknown");
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [conditions, setConditions] = useState<string[]>([]);
  const [priorAttempts, setPriorAttempts] = useState(false);
  const [goals, setGoals] = useState<string[]>([]);

  // Step 2
  const [mtc, setMtc] = useState(false);
  const [men2, setMen2] = useState(false);
  const [hypersensitivity, setHypersensitivity] = useState(false);
  const [t1dOrDka, setT1dOrDka] = useState(false);
  const [pregnantOrPlanning, setPregnantOrPlanning] = useState(false);
  const [pancreatitis, setPancreatitis] = useState(false);
  const [giDisease, setGiDisease] = useState("none_known");
  const [gallbladder, setGallbladder] = useState("none_known");
  const [retinopathy, setRetinopathy] = useState("unknown");
  const [volumeRisk, setVolumeRisk] = useState(false);

  // Step 3
  const [scoff, setScoff] = useState(false);
  const [bingeRestrictive, setBingeRestrictive] = useState(false);
  const [depression, setDepression] = useState(false);
  const [suicidal, setSuicidal] = useState(false);
  const [foodBarrier, setFoodBarrier] = useState(false);
  const [protein, setProtein] = useState("unknown");
  const [fiber, setFiber] = useState("unknown");
  const [falls, setFalls] = useState(false);
  const [gaitConcern, setGaitConcern] = useState(false);
  const [sarcopeniaRisk, setSarcopeniaRisk] = useState("unknown");

  // Step 4
  const [bp, setBp] = useState("");
  const [pulse, setPulse] = useState("");
  const [orthostatic, setOrthostatic] = useState(false);
  const [hfSigns, setHfSigns] = useState(false);
  const [hba1c, setHba1c] = useState("");
  const [creatinine, setCreatinine] = useState("");
  const [egfr, setEgfr] = useState("");
  const [acrDone, setAcrDone] = useState(false);
  const [lipidsDone, setLipidsDone] = useState(false);
  const [retinalExam, setRetinalExam] = useState(false);

  // Step 5
  const [agent, setAgent] = useState("Not yet chosen");
  const [insulin, setInsulin] = useState(false);
  const [secretagogue, setSecretagogue] = useState(false);
  const [dpp4, setDpp4] = useState(false);
  const [otherMeds, setOtherMeds] = useState("");

  // Step 6
  const [counselling, setCounselling] = useState<string[]>([]);
  const [plan, setPlan] = useState("");

  const bmi = useMemo(() => {
    const w = parseFloat(weight);
    const h = parseFloat(height) / 100;
    if (!w || !h) return null;
    return w / (h * h);
  }, [weight, height]);

  const flags = useMemo<Flag[]>(() => {
    const f: Flag[] = [];
    const add = (id: string, severity: Severity, message: string) => f.push({ id, severity, message });

    if (mtc) add("do_not_start_mtc", "critical", "Do not start: personal or family history of medullary thyroid carcinoma.");
    if (men2) add("do_not_start_men2", "critical", "Do not start: multiple endocrine neoplasia type 2.");
    if (hypersensitivity)
      add("do_not_start_hypersensitivity", "critical", "Do not start the implicated GLP-1 receptor agonist: prior serious hypersensitivity reaction.");
    if (pregnantOrPlanning)
      add("pregnancy_review", "critical", "Do not initiate for weight loss during pregnancy; review medication-specific pregnancy guidance and reproductive plan.");
    if (t1dOrDka) add("type1_dka_review", "critical", "GLP-1 receptor agonist is not a treatment for type 1 diabetes or diabetic ketoacidosis.");
    if (suicidal) add("suicide_risk_review", "critical", "Active suicidal ideation: arrange urgent mental-health risk assessment before medication initiation.");

    if (pancreatitis)
      add("pancreatitis_review", "high", "Previous pancreatitis: individualise risk-benefit assessment and consider specialist review before initiation.");
    if (["severe_gastroparesis", "severe_gi_disease", "persistent_nausea_vomiting_or_pain"].includes(giDisease))
      add("severe_gi_review", "high", "Significant gastrointestinal symptoms or severe gastroparesis: do not proceed routinely; obtain specialist assessment.");
    if (retinopathy === "proliferative_or_high_risk" || retinopathy === "unknown")
      add("retinopathy_review", "high", "Confirm retinopathy status and arrange appropriate retinal follow-up, particularly if rapid HbA1c reduction is expected.");
    if (scoff || bingeRestrictive)
      add("eating_disorder_review", "high", "Positive eating-disorder screen: consider psychological and dietitian co-management before or alongside treatment.");
    if (insulin || secretagogue)
      add("hypoglycemia_plan", "high", "Hypoglycaemia risk: document insulin/secretagogue dose-adjustment and glucose-monitoring plan before initiation.");

    if (dpp4)
      add("dpp4_stop", "moderate", "Avoid routine concurrent DPP-4 inhibitor and GLP-1 receptor agonist therapy; document a discontinuation plan.");
    if (foodBarrier || protein === "inadequate" || sarcopeniaRisk === "high")
      add("nutrition_support", "moderate", "Nutrition or sarcopenia risk: provide dietitian support and individualise protein, resistance-exercise, hydration, and micronutrient planning.");
    if (volumeRisk || (egfr && parseFloat(egfr) < 30))
      add("renal_hydration", "moderate", "Renal or volume-depletion risk: review hydration, concurrent diuretics/nephrotoxins, GI adverse-effect plan, and monitoring interval.");
    return f;
  }, [
    mtc, men2, hypersensitivity, pregnantOrPlanning, t1dOrDka, suicidal, pancreatitis, giDisease,
    retinopathy, scoff, bingeRestrictive, insulin, secretagogue, dpp4, foodBarrier, protein,
    sarcopeniaRisk, volumeRisk, egfr,
  ]);

  const status = useMemo(() => {
    if (flags.some((f) => f.severity === "critical")) return "Do not start";
    if (flags.some((f) => f.id === "retinopathy_review" || f.id === "severe_gi_review" || f.id === "eating_disorder_review" || f.id === "pancreatitis_review"))
      return "Defer pending investigation or referral";
    if (flags.some((f) => f.severity === "high" || f.severity === "moderate"))
      return "Eligible to start after medication or monitoring plan";
    return "Eligible to start with routine monitoring";
  }, [flags]);

  const referrals = useMemo(() => {
    const r: string[] = [];
    if (suicidal || depression) r.push("Mental health assessment");
    if (scoff || bingeRestrictive) r.push("Eating-disorder / psychology service");
    if (foodBarrier || protein === "inadequate" || sarcopeniaRisk === "high") r.push("Dietitian");
    if (retinopathy === "unknown" || retinopathy === "proliferative_or_high_risk" || !retinalExam) r.push("Ophthalmology / retinal screening");
    if (["severe_gastroparesis", "severe_gi_disease", "persistent_nausea_vomiting_or_pain"].includes(giDisease) || pancreatitis) r.push("Gastroenterology");
    if (egfr && parseFloat(egfr) < 30) r.push("Nephrology");
    if (hfSigns) r.push("Cardiology");
    return r;
  }, [suicidal, depression, scoff, bingeRestrictive, foodBarrier, protein, sarcopeniaRisk, retinopathy, retinalExam, giDisease, pancreatitis, egfr, hfSigns]);

  const report = useMemo(() => {
    const lines: string[] = [];
    lines.push("GLP-1 RA PRE-INITIATION ASSESSMENT");
    lines.push("=================================");
    lines.push(`Decision: ${status}`);
    lines.push("");
    lines.push(`Age/Sex: ${age || "—"} / ${sex || "—"}`);
    lines.push(`Pregnancy status: ${pretty(pregnancyStatus)}`);
    lines.push(`Weight: ${weight || "—"} kg | Height: ${height || "—"} cm | BMI: ${bmi ? bmi.toFixed(1) : "—"}`);
    lines.push(`Indications: ${conditions.length ? conditions.join(", ") : "—"}`);
    lines.push(`Prior weight-loss attempts: ${priorAttempts ? "Yes" : "No"}`);
    lines.push(`Patient goals: ${goals.length ? goals.join(", ") : "—"}`);
    lines.push("");
    lines.push("BASELINE");
    lines.push(`BP: ${bp || "—"} | Pulse: ${pulse || "—"} | Orthostatic symptoms: ${orthostatic ? "Yes" : "No"} | HF signs: ${hfSigns ? "Yes" : "No"}`);
    lines.push(`HbA1c: ${hba1c || "—"} % | Creatinine: ${creatinine || "—"} mg/dL | eGFR: ${egfr || "—"} mL/min/1.73m2`);
    lines.push(`Urine ACR done: ${acrDone ? "Yes" : "No"} | Lipids done: ${lipidsDone ? "Yes" : "No"} | Retinal exam current: ${retinalExam ? "Yes" : "No"}`);
    lines.push("");
    lines.push("MEDICATIONS");
    lines.push(`Selected agent: ${agent}`);
    lines.push(`Insulin: ${insulin ? "Yes" : "No"} | Sulfonylurea/glinide: ${secretagogue ? "Yes" : "No"} | DPP-4 inhibitor: ${dpp4 ? "Yes" : "No"}`);
    if (otherMeds.trim()) lines.push(`Other relevant medicines: ${otherMeds.trim()}`);
    lines.push("");
    lines.push("SAFETY FLAGS");
    if (!flags.length) lines.push("- None identified");
    flags.forEach((f) => lines.push(`- [${f.severity.toUpperCase()}] ${f.message}`));
    lines.push("");
    lines.push(`REFERRALS / MONITORING: ${referrals.length ? referrals.join(", ") : "Routine follow-up"}`);
    lines.push("");
    lines.push("COUNSELLING COMPLETED");
    if (!counselling.length) lines.push("- None documented");
    counselling.forEach((c) => lines.push(`- ${c}`));
    if (plan.trim()) {
      lines.push("");
      lines.push("CLINICIAN PLAN");
      lines.push(plan.trim());
    }
    lines.push("");
    lines.push("This tool supports clinical assessment and documentation. It does not replace product-specific prescribing information, local protocols, specialist input, or clinician judgement.");
    return lines.join("\n");
  }, [status, age, sex, pregnancyStatus, weight, height, bmi, conditions, priorAttempts, goals, bp, pulse, orthostatic, hfSigns, hba1c, creatinine, egfr, acrDone, lipidsDone, retinalExam, agent, insulin, secretagogue, dpp4, otherMeds, flags, referrals, counselling, plan]);

  const Check = ({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) => (
    <label className="flex items-start gap-2 rounded-lg border border-border/60 p-3 text-sm cursor-pointer hover:bg-muted/40 transition-colors">
      <Checkbox checked={checked} onCheckedChange={(v) => onChange(Boolean(v))} className="mt-0.5" />
      <span>{label}</span>
    </label>
  );

  const statusTone =
    status === "Do not start"
      ? "bg-destructive/10 text-destructive border-destructive/30"
      : status.startsWith("Defer")
        ? "bg-warning/10 text-warning border-warning/30"
        : status.includes("after")
          ? "bg-primary/10 text-primary border-primary/30"
          : "bg-success/10 text-success border-success/30";

  return (
    <div className="space-y-4">
      <Card className="border-border/60">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Syringe className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">GLP-1 RA Pre-Initiation Screener</CardTitle>
              <p className="text-sm text-muted-foreground">
                Structured screening, documentation and triage before GLP-1 receptor agonist initiation.
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Step {step + 1} of {STEPS.length} — {STEPS[step]}</span>
              <span>{Math.round(((step + 1) / STEPS.length) * 100)}%</span>
            </div>
            <Progress value={((step + 1) / STEPS.length) * 100} />
          </div>

          <div className="flex flex-wrap gap-1.5">
            {STEPS.map((s, i) => (
              <button
                key={s}
                onClick={() => setStep(i)}
                className={`px-2.5 py-1 text-xs rounded-full border transition-colors ${
                  i === step ? "border-primary/40 text-primary" : "bg-muted/50 text-muted-foreground border-border hover:text-foreground"
                }`}
              >
                {i + 1}. {s.split(" ")[0]}
              </button>
            ))}
          </div>

          {/* STEP 1 */}
          {step === 0 && (
            <div className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <Label>Age (years)</Label>
                  <Input inputMode="numeric" value={age} onChange={(e) => setAge(e.target.value)} placeholder="e.g. 48" />
                </div>
                <div className="space-y-1.5">
                  <Label>Sex</Label>
                  <Select value={sex} onValueChange={setSex}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="other">Other / not stated</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Pregnancy status</Label>
                  <Select value={pregnancyStatus} onValueChange={setPregnancyStatus}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["not_applicable_or_unknown", "not_pregnant", "pregnant", "planning_pregnancy", "breastfeeding"].map((o) => (
                        <SelectItem key={o} value={o}>{pretty(o)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <Label>Weight (kg)</Label>
                  <Input inputMode="decimal" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="e.g. 92" />
                </div>
                <div className="space-y-1.5">
                  <Label>Height (cm)</Label>
                  <Input inputMode="decimal" value={height} onChange={(e) => setHeight(e.target.value)} placeholder="e.g. 168" />
                </div>
                <div className="space-y-1.5">
                  <Label>BMI (auto)</Label>
                  <div className="h-10 flex items-center px-3 rounded-md border border-border/60 bg-muted/40 text-sm select-all">
                    {bmi ? `${bmi.toFixed(1)} kg/m²` : "—"}
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Indication / conditions</Label>
                <div className="grid gap-2 sm:grid-cols-2">
                  {CONDITIONS.map((c) => (
                    <Check key={c} label={c} checked={conditions.includes(c)} onChange={() => setConditions((p) => toggle(p, c))} />
                  ))}
                </div>
              </div>
              <Check label="Documented prior structured weight-loss attempts" checked={priorAttempts} onChange={setPriorAttempts} />
              <div className="space-y-2">
                <Label>Patient goals</Label>
                <div className="grid gap-2 sm:grid-cols-2">
                  {GOALS.map((g) => (
                    <Check key={g} label={g} checked={goals.includes(g)} onChange={() => setGoals((p) => toggle(p, g))} />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 2 */}
          {step === 1 && (
            <div className="space-y-3">
              <div className="grid gap-2 sm:grid-cols-2">
                <Check label="Personal / family history of medullary thyroid carcinoma" checked={mtc} onChange={setMtc} />
                <Check label="Multiple endocrine neoplasia type 2 (MEN2)" checked={men2} onChange={setMen2} />
                <Check label="Prior serious hypersensitivity to a GLP-1 RA" checked={hypersensitivity} onChange={setHypersensitivity} />
                <Check label="Type 1 diabetes or DKA" checked={t1dOrDka} onChange={setT1dOrDka} />
                <Check label="Pregnant or planning pregnancy" checked={pregnantOrPlanning} onChange={setPregnantOrPlanning} />
                <Check label="History of pancreatitis" checked={pancreatitis} onChange={setPancreatitis} />
                <Check label="Volume depletion / AKI risk (diuretics, nephrotoxins)" checked={volumeRisk} onChange={setVolumeRisk} />
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <Label>GI disease</Label>
                  <Select value={giDisease} onValueChange={setGiDisease}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {GI_OPTIONS.map((o) => <SelectItem key={o} value={o}>{pretty(o)}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Gallbladder disease</Label>
                  <Select value={gallbladder} onValueChange={setGallbladder}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["none_known", "prior_cholelithiasis", "symptomatic_gallstones", "post_cholecystectomy"].map((o) => (
                        <SelectItem key={o} value={o}>{pretty(o)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Diabetic retinopathy</Label>
                  <Select value={retinopathy} onValueChange={setRetinopathy}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {RETINOPATHY_OPTIONS.map((o) => <SelectItem key={o} value={o}>{pretty(o)}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3 */}
          {step === 2 && (
            <div className="space-y-3">
              <div className="grid gap-2 sm:grid-cols-2">
                <Check label="SCOFF screen positive (≥2)" checked={scoff} onChange={setScoff} />
                <Check label="Binge or restrictive eating pattern" checked={bingeRestrictive} onChange={setBingeRestrictive} />
                <Check label="Major depression" checked={depression} onChange={setDepression} />
                <Check label="Active suicidal ideation" checked={suicidal} onChange={setSuicidal} />
                <Check label="Food access / affordability barrier" checked={foodBarrier} onChange={setFoodBarrier} />
                <Check label="Falls or generalised weakness" checked={falls} onChange={setFalls} />
                <Check label="Gait or strength concern" checked={gaitConcern} onChange={setGaitConcern} />
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <Label>Protein intake</Label>
                  <Select value={protein} onValueChange={setProtein}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["unknown", "adequate", "borderline", "inadequate"].map((o) => <SelectItem key={o} value={o}>{pretty(o)}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Fibre intake</Label>
                  <Select value={fiber} onValueChange={setFiber}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["unknown", "adequate", "low"].map((o) => <SelectItem key={o} value={o}>{pretty(o)}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Sarcopenia risk</Label>
                  <Select value={sarcopeniaRisk} onValueChange={setSarcopeniaRisk}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["unknown", "low", "moderate", "high"].map((o) => <SelectItem key={o} value={o}>{pretty(o)}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4 */}
          {step === 3 && (
            <div className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Blood pressure (mmHg)</Label>
                  <Input value={bp} onChange={(e) => setBp(e.target.value)} placeholder="e.g. 132/84" />
                </div>
                <div className="space-y-1.5">
                  <Label>Pulse (bpm)</Label>
                  <Input inputMode="numeric" value={pulse} onChange={(e) => setPulse(e.target.value)} placeholder="e.g. 78" />
                </div>
                <div className="space-y-1.5">
                  <Label>HbA1c (%)</Label>
                  <Input inputMode="decimal" value={hba1c} onChange={(e) => setHba1c(e.target.value)} placeholder="e.g. 7.8" />
                </div>
                <div className="space-y-1.5">
                  <Label>Creatinine (mg/dL)</Label>
                  <Input inputMode="decimal" value={creatinine} onChange={(e) => setCreatinine(e.target.value)} placeholder="e.g. 0.9" />
                </div>
                <div className="space-y-1.5">
                  <Label>eGFR (mL/min/1.73m²)</Label>
                  <Input inputMode="decimal" value={egfr} onChange={(e) => setEgfr(e.target.value)} placeholder="e.g. 82" />
                </div>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <Check label="Orthostatic symptoms" checked={orthostatic} onChange={setOrthostatic} />
                <Check label="Signs of heart failure" checked={hfSigns} onChange={setHfSigns} />
                <Check label="Urine ACR done" checked={acrDone} onChange={setAcrDone} />
                <Check label="Lipid profile done" checked={lipidsDone} onChange={setLipidsDone} />
                <Check label="Retinal exam current" checked={retinalExam} onChange={setRetinalExam} />
              </div>
            </div>
          )}

          {/* STEP 5 */}
          {step === 4 && (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label>Selected GLP-1 receptor agonist</Label>
                <Select value={agent} onValueChange={setAgent}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {AGENTS.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <Check label="On insulin" checked={insulin} onChange={setInsulin} />
                <Check label="On sulfonylurea or glinide" checked={secretagogue} onChange={setSecretagogue} />
                <Check label="On DPP-4 inhibitor" checked={dpp4} onChange={setDpp4} />
              </div>
              <div className="space-y-1.5">
                <Label>Other relevant medicines</Label>
                <Textarea value={otherMeds} onChange={(e) => setOtherMeds(e.target.value)} placeholder="Diuretics, NSAIDs, oral contraceptives, warfarin, thyroid hormone…" />
              </div>
            </div>
          )}

          {/* STEP 6 */}
          {step === 5 && (
            <div className="space-y-3">
              <div className={`rounded-lg border p-4 ${statusTone}`}>
                <div className="flex items-center gap-2 font-semibold">
                  {status === "Eligible to start with routine monitoring" ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                  {status}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Safety flags</Label>
                {flags.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No safety flags identified.</p>
                ) : (
                  <div className="space-y-2">
                    {flags.map((f) => (
                      <div key={f.id} className="rounded-lg border border-border/60 p-3 text-sm">
                        <Badge variant="outline" className="mr-2 uppercase text-[10px]">{f.severity}</Badge>
                        {f.message}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>Referrals / monitoring</Label>
                <div className="flex flex-wrap gap-1.5">
                  {(referrals.length ? referrals : ["Routine follow-up"]).map((r) => (
                    <Badge key={r} variant="outline">{r}</Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Counselling checklist</Label>
                <div className="grid gap-2 sm:grid-cols-2">
                  {COUNSELLING.map((c) => (
                    <Check key={c} label={c} checked={counselling.includes(c)} onChange={() => setCounselling((p) => toggle(p, c))} />
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Clinician plan</Label>
                <Textarea rows={4} value={plan} onChange={(e) => setPlan(e.target.value)} placeholder="Starting dose, titration interval, review date, monitoring…" />
              </div>

              <pre className="whitespace-pre-wrap rounded-lg border border-border/60 bg-muted/40 p-3 text-xs select-all">{report}</pre>

              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={() => copyToClipboard(report)}>
                  <Copy className="h-4 w-4 mr-1" /> Copy results
                </Button>
                <Button variant="outline" size="sm" onClick={() => downloadTextFile("glp1-pre-initiation-screen.txt", report)}>
                  <Download className="h-4 w-4 mr-1" /> Download .txt
                </Button>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-2 border-t border-border/40">
            <Button variant="ghost" size="sm" disabled={step === 0} onClick={() => setStep((s) => s - 1)}>
              <ChevronLeft className="h-4 w-4 mr-1" /> Back
            </Button>
            {step < STEPS.length - 1 ? (
              <Button size="sm" onClick={() => setStep((s) => s + 1)}>
                Next <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            ) : (
              <span className="text-xs text-muted-foreground">Summary generated automatically</span>
            )}
          </div>

          <p className="text-xs text-muted-foreground">
            This tool supports clinical assessment and documentation. It does not replace product-specific prescribing
            information, local protocols, specialist input, or clinician judgement.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
