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
  "Obesity (BMI ≥30)",
  "Overweight with comorbidity",
  "Type 2 diabetes",
  "ASCVD / Heart failure",
  "Chronic kidney disease",
];

const STEPS = ["Patient & Indication", "Safety & Assessment", "Plan & Summary"];

const COUNSELLING = [
  "Dose titration explained",
  "GI side-effect management",
  "Protein & hydration focus",
  "Pancreatitis/Gallbladder warning",
  "Hypoglycaemia (if on insulin/SU)",
  "Retinal review (if diabetic)",
];

const pretty = (s: string) => s.replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase());
const toggle = (list: string[], value: string) =>
  list.includes(value) ? list.filter((v) => v !== value) : [...list, value];

export default function GLP1PreInitiationScreener() {
  const [step, setStep] = useState(0);

  // Data State
  const [age, setAge] = useState("");
  const [sex, setSex] = useState("");
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [conditions, setConditions] = useState<string[]>([]);
  const [pregnancyStatus, setPregnancyStatus] = useState("not_applicable");
  
  const [mtc, setMtc] = useState(false);
  const [men2, setMen2] = useState(false);
  const [hypersensitivity, setHypersensitivity] = useState(false);
  const [t1dOrDka, setT1dOrDka] = useState(false);
  const [pancreatitis, setPancreatitis] = useState(false);
  const [suicidal, setSuicidal] = useState(false);
  const [giDisease, setGiDisease] = useState("none_known");
  const [retinopathy, setRetinopathy] = useState("unknown");
  const [naion, setNaion] = useState(false);
  const [sarcopeniaRisk, setSarcopeniaRisk] = useState("low");

  const [hba1c, setHba1c] = useState("");
  const [egfr, setEgfr] = useState("");
  const [bp, setBp] = useState("");
  
  const [agent, setAgent] = useState("Not yet chosen");
  const [insulin, setInsulin] = useState(false);
  const [secretagogue, setSecretagogue] = useState(false);
  const [dpp4, setDpp4] = useState(false);
  
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
    if (mtc) f.push({ id: "mtc", severity: "critical", message: "Do not start: personal/family history of MTC." });
    if (men2) f.push({ id: "men2", severity: "critical", message: "Do not start: history of MEN2." });
    if (hypersensitivity) f.push({ id: "hyper", severity: "critical", message: "Do not start: prior serious hypersensitivity to GLP-1 RA." });
    if (t1dOrDka) f.push({ id: "t1d", severity: "critical", message: "Not for Type 1 Diabetes or DKA." });
    if (suicidal) f.push({ id: "suicide", severity: "critical", message: "Active suicidal ideation: urgent mental health review required." });
    if (pregnancyStatus === "pregnant" || pregnancyStatus === "planning") f.push({ id: "preg", severity: "critical", message: "Do not initiate during pregnancy or when planning pregnancy." });
    
    if (pancreatitis) f.push({ id: "panc", severity: "high", message: "Prior pancreatitis: specialist review recommended." });
    if (giDisease === "severe_gastroparesis" || giDisease === "severe_gi_disease") f.push({ id: "gi", severity: "high", message: "Severe GI disease: obtain specialist assessment." });
    if (retinopathy === "proliferative_or_high_risk" || retinopathy === "unknown") f.push({ id: "retin", severity: "high", message: "Retinal review needed, especially if rapid HbA1c drop expected." });
    if (naion) f.push({ id: "naion", severity: "high", message: "History of NAION: Increased risk of recurrence. Specialist ophthalmology review required before initiation." });
    if (insulin || secretagogue) f.push({ id: "hypo", severity: "high", message: "Hypoglycaemia risk: adjust insulin/secretagogue dose." });
    
    if (dpp4) f.push({ id: "dpp4", severity: "moderate", message: "Discontinue DPP-4 inhibitor (gliptin). Combined use provides no extra glycemic benefit (same pathway) and increases cost/side-effect risk." });
    if (sarcopeniaRisk === "high") f.push({ id: "sarco", severity: "moderate", message: "Sarcopenia risk: prioritise protein intake & resistance exercise." });
    if (egfr && parseFloat(egfr) < 30) f.push({ id: "renal", severity: "moderate", message: "eGFR <30: specialist guidance & close monitoring recommended." });
    
    return f;
  }, [mtc, men2, hypersensitivity, t1dOrDka, suicidal, pregnancyStatus, pancreatitis, giDisease, retinopathy, insulin, secretagogue, dpp4, sarcopeniaRisk, egfr]);

  const status = useMemo(() => {
    if (flags.some((f) => f.severity === "critical")) return "Do not start";
    if (flags.some((f) => ["panc", "gi", "retin", "naion"].includes(f.id))) return "Defer pending specialist review";
    if (flags.some((f) => f.severity === "high" || f.severity === "moderate")) return "Eligible with clinical monitoring plan";
    return "Eligible to start (Routine)";
  }, [flags]);

  const report = useMemo(() => {
    const lines = [
      "GLP-1 RA PRE-INITIATION ASSESSMENT",
      "=================================",
      `Status: ${status}`,
      "",
      `Patient: ${age || "—"}y / ${sex || "—"} | BMI: ${bmi ? bmi.toFixed(1) : "—"}`,
      `Indications: ${conditions.join(", ") || "—"}`,
      `Labs: HbA1c ${hba1c || "—"}% | eGFR ${egfr || "—"} | BP ${bp || "—"}`,
      "",
      "SAFETY FLAGS:",
      flags.length ? flags.map(f => `- [${f.severity.toUpperCase()}] ${f.message}`).join("\n") : "- None identified",
      "",
      `Medication: ${agent} (Insulin: ${insulin ? "Yes" : "No"} | SU: ${secretagogue ? "Yes" : "No"})`,
      `NAION Status: ${naion ? "Positive History (Specialist Review Required)" : "Negative History"}`,
      "",
      "COUNSELLING:",
      counselling.length ? counselling.map(c => `- ${c}`).join("\n") : "- None documented",
      "",
      "CLINICIAN PLAN:",
      plan || "Routine titration as per protocol.",
    ];
    return lines.join("\n");
  }, [status, age, sex, bmi, conditions, hba1c, egfr, bp, flags, agent, insulin, secretagogue, counselling, plan]);

  const Check = ({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) => (
    <label className="flex items-start gap-2 rounded-lg border border-border/60 p-2.5 text-xs cursor-pointer hover:bg-muted/40 transition-colors">
      <Checkbox checked={checked} onCheckedChange={(v) => onChange(Boolean(v))} className="mt-0.5 h-3.5 w-3.5" />
      <span>{label}</span>
    </label>
  );

  const canContinue = useMemo(() => {
    if (step === 0) {
      return !!age && !!sex && !!weight && !!height && conditions.length > 0;
    }
    if (step === 1) {
      // Basic check for mandatory labs/cautions logic could be added here if needed
      // For now, requiring HbA1c and eGFR as minimal clinical safety data
      return !!hba1c && !!egfr;
    }
    return true;
  }, [step, age, sex, weight, height, conditions, hba1c, egfr]);

  return (
    <div className="space-y-4">
      <Card className="border-border/60">
        <CardHeader className="py-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Syringe className="h-4 w-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base">GLP-1 Initiation Screener</CardTitle>
              <p className="text-[11px] text-muted-foreground">Triage, safety screening, and plan documentation.</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[10px] text-muted-foreground font-medium mb-1">
              <span>Step {step + 1} of {STEPS.length}: {STEPS[step]}</span>
              <span>{Math.round(((step + 1) / STEPS.length) * 100)}%</span>
            </div>
            <div className="flex gap-1.5 mb-2">
              {STEPS.map((_, i) => (
                <div 
                  key={i} 
                  className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                    i <= step ? "bg-primary" : "bg-muted"
                  }`} 
                />
              ))}
            </div>
          </div>

          {/* STEP 1: Patient & Indication */}
          {step === 0 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Age</Label>
                  <Input size={1} className="h-8 text-xs" value={age} onChange={e => setAge(e.target.value)} placeholder="Years" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Sex</Label>
                  <Select value={sex} onValueChange={setSex}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="male">Male</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Weight (kg)</Label>
                  <Input className="h-8 text-xs" value={weight} onChange={e => setWeight(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Height (cm)</Label>
                  <Input className="h-8 text-xs" value={height} onChange={e => setHeight(e.target.value)} />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold">Primary Indication</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {CONDITIONS.map(c => (
                    <Check key={c} label={c} checked={conditions.includes(c)} onChange={() => setConditions(p => toggle(p, c))} />
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Pregnancy Status</Label>
                <Select value={pregnancyStatus} onValueChange={setPregnancyStatus}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="not_applicable">N/A</SelectItem>
                    <SelectItem value="not_pregnant">Not Pregnant</SelectItem>
                    <SelectItem value="pregnant">Pregnant</SelectItem>
                    <SelectItem value="planning">Planning / Trying</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* STEP 2: Safety & Assessment */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-semibold">Red Flags & Cautions</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <Check label="MTC / MEN2 / Hypersensitivity" checked={mtc || men2 || hypersensitivity} onChange={v => { setMtc(v); setMen2(v); setHypersensitivity(v); }} />
                  <Check label="Type 1 Diabetes / DKA" checked={t1dOrDka} onChange={setT1dOrDka} />
                  <Check label="History of Pancreatitis" checked={pancreatitis} onChange={setPancreatitis} />
                  <Check label="Active Suicidal Ideation" checked={suicidal} onChange={setSuicidal} />
                </div>
              </div>

              {/* Optic nerve / NAION — single streamlined group */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold">Optic nerve / NAION</Label>
                <Check
                  label="Prior NAION or optic nerve risk (crowded/anomalous disc, prior ischaemic optic event)"
                  checked={naion}
                  onChange={setNaion}
                />
                {naion && (
                  <div className="p-3 rounded-lg border border-danger/20 bg-danger/5 space-y-2">
                    <div className="flex items-center gap-2 text-danger font-semibold text-xs">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      NAION Safety Protocol
                    </div>
                    <ul className="text-[11px] space-y-1 text-muted-foreground list-disc pl-4">
                      <li>Recent studies (e.g., JAMA Ophthalmol 2024) suggest an increased hazard ratio for NAION in patients prescribed Semaglutide.</li>
                      <li><span className="font-semibold text-foreground">Specialist Review Required:</span> Defer initiation until cleared by Ophthalmology.</li>
                      <li><span className="font-semibold text-foreground">Monitoring:</span> If initiated, patient must report any sudden visual changes immediately.</li>
                    </ul>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">GI Disease</Label>
                  <Select value={giDisease} onValueChange={setGiDisease}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none_known">None</SelectItem>
                      <SelectItem value="mild">Mild</SelectItem>
                      <SelectItem value="severe_gastroparesis">Severe Gastroparesis</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {(naion || conditions.includes("Type 2 diabetes")) && (
                  <div className="space-y-1.5">
                    <Label className="text-xs">Retinopathy</Label>
                    <Select value={retinopathy} onValueChange={setRetinopathy}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="non_proliferative">NPDR</SelectItem>
                        <SelectItem value="proliferative_or_high_risk">PDR / High Risk</SelectItem>
                        <SelectItem value="unknown">Unknown</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div className="space-y-1.5">
                  <Label className="text-xs">Sarcopenia Risk</Label>
                  <Select value={sarcopeniaRisk} onValueChange={setSarcopeniaRisk}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="moderate">Moderate</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">HbA1c (%)</Label>
                  <Input className="h-8 text-xs" value={hba1c} onChange={e => setHba1c(e.target.value)} placeholder="7.5" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">eGFR</Label>
                  <Input className="h-8 text-xs" value={egfr} onChange={e => setEgfr(e.target.value)} placeholder=">60" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">BP</Label>
                  <Input className="h-8 text-xs" value={bp} onChange={e => setBp(e.target.value)} placeholder="130/80" />
                </div>
              </div>
          )}

          {/* STEP 3: Plan & Summary */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Prescribing Plan</Label>
                    <Select value={agent} onValueChange={setAgent}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {["Semaglutide (SC)", "Semaglutide (Oral)", "Tirzepatide", "Liraglutide", "Dulaglutide"].map(a => (
                          <SelectItem key={a} value={a}>{a}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    <Check label="Concomitant Insulin" checked={insulin} onChange={setInsulin} />
                    <Check label="Concomitant Secretagogue (SU)" checked={secretagogue} onChange={setSecretagogue} />
                    <Check label="Concomitant DPP-4i (Gliptin)" checked={dpp4} onChange={setDpp4} />
                    {dpp4 && (
                      <div className="text-[10px] text-amber-600 dark:text-amber-400 font-medium px-2 py-1 bg-amber-50 dark:bg-amber-950/30 rounded border border-amber-200/50 dark:border-amber-900/50">
                        Guideline advice: Stop DPP-4i. Dual use adds no benefit (shared pathway) but increases cost/risk.
                      </div>
                    )}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Counselling Done</Label>
                  <div className="grid grid-cols-1 gap-1.5">
                    {COUNSELLING.map(c => (
                      <Check key={c} label={c} checked={counselling.includes(c)} onChange={() => setCounselling(p => toggle(p, c))} />
                    ))}
                  </div>
                </div>
              </div>

              {naion && (
                <div className="p-3 rounded-lg border border-warning/30 bg-warning/5 space-y-2">
                  <div className="flex items-center justify-between text-warning font-semibold text-xs text-amber-600 dark:text-amber-400">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      NAION Safety Summary
                    </div>
                    <button 
                      onClick={() => setStep(1)} 
                      className="text-[10px] underline hover:text-amber-700 dark:hover:text-amber-300"
                    >
                      Edit Answers
                    </button>
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    Patient has reported a history of NAION. Guideline-based next steps:
                  </div>
                  <div className="grid grid-cols-1 gap-1.5 mt-1">
                    <div className="flex items-start gap-2 text-[10px] bg-background/50 p-1.5 rounded border border-border/40">
                      <div className="h-1.5 w-1.5 rounded-full bg-danger mt-1 shrink-0" />
                      <span>Obtain mandatory Ophthalmology clearance before initiating GLP-1 RA.</span>
                    </div>
                    <div className="flex items-start gap-2 text-[10px] bg-background/50 p-1.5 rounded border border-border/40">
                      <div className="h-1.5 w-1.5 rounded-full bg-warning mt-1 shrink-0" />
                      <span>Document detailed discussion regarding increased hazard ratio for recurrence.</span>
                    </div>
                  </div>
                </div>
              )}

              <div className={`p-3 rounded-lg border text-xs font-semibold flex items-center gap-2 ${
                status === "Do not start" ? "bg-destructive/10 text-destructive border-destructive/20" :
                status.includes("Defer") ? "bg-warning/10 text-warning border-warning/20" :
                "bg-success/10 text-success border-success/20"
              }`}>
                {status === "Do not start" ? <AlertTriangle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                {status}
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Clinical Note & Titration Plan</Label>
                <Textarea className="text-xs min-h-[80px]" value={plan} onChange={e => setPlan(e.target.value)} placeholder="e.g. Start 0.25mg SC weekly for 4 weeks..." />
              </div>

              <pre className="p-3 bg-muted/40 rounded-lg text-[10px] whitespace-pre-wrap border border-border/40 select-all">{report}</pre>
              
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="h-8 text-[11px] flex-1" onClick={() => copyToClipboard(report)}>
                  <Copy className="h-3 w-3 mr-1.5" /> Copy Note
                </Button>
                <Button variant="outline" size="sm" className="h-8 text-[11px] flex-1" onClick={() => downloadTextFile("glp1-assessment.txt", report)}>
                  <Download className="h-3 w-3 mr-1.5" /> Download
                </Button>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-2 border-t border-border/40">
            <Button variant="ghost" size="sm" className="h-8 text-xs" disabled={step === 0} onClick={() => setStep(s => s - 1)}>
              <ChevronLeft className="h-3.5 w-3.5 mr-1" /> Back
            </Button>
            {step < STEPS.length - 1 && (
              <Button size="sm" className="h-8 text-xs" onClick={() => setStep(s => s + 1)} disabled={!canContinue}>
                Next <ChevronRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
