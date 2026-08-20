import { useMemo, useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, Gauge, RotateCcw, AlertTriangle, Copy, Clock, Settings2, CheckSquare, Square } from "lucide-react";
import { downloadTextFile, copyToClipboard } from "@/lib/clinical-utils";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";

function calculateEGFR(age: number, creatinine: number, gender: "male" | "female") {
  if (isNaN(age) || isNaN(creatinine) || !creatinine) return null;
  // CKD-EPI 2021 formula
  const kappa = gender === "female" ? 0.7 : 0.9;
  const alpha = gender === "female" ? -0.241 : -0.302;
  const genderConstant = gender === "female" ? 1.012 : 1;
  
  const minCrK = Math.min(creatinine / kappa, 1);
  const maxCrK = Math.max(creatinine / kappa, 1);
  
  return 142 * Math.pow(minCrK, alpha) * Math.pow(maxCrK, -1.2) * Math.pow(0.9938, age) * genderConstant;
}

type MehranRisk = "low" | "moderate" | "high" | "very_high" | null;

const n = (v: string) => (v.trim() === "" ? NaN : Number(v));
const fmt = (v: number, d = 2) => (isNaN(v) ? "—" : v.toFixed(d));

export default function MehranScoreCalculator() {
  const [age, setAge] = useState("");
  const [creatinine, setCreatinine] = useState("");
  const [creatinineUnit, setCreatinineUnit] = useState<"mgdl" | "umol">("mgdl");
  const [gender, setGender] = useState<"male" | "female">("male");
  const [eGFR, setEGFR] = useState("");
  const [diabetes, setDiabetes] = useState("0");
  const [anaemia, setAnaemia] = useState("0");
  const [chf, setCHF] = useState("0");
  const [hypotension, setHypotension] = useState("0");
  const [iabp, setIABP] = useState("0");
  const [contrastVolume, setContrastVolume] = useState("");

  useEffect(() => {
    const a = n(age);
    let cr = n(creatinine);
    if (!isNaN(a) && !isNaN(cr) && cr > 0) {
      // Convert to mg/dL for the formula if it's in umol/L
      const crMgDl = creatinineUnit === "umol" ? cr / 88.4 : cr;
      const calculated = calculateEGFR(a, crMgDl, gender);
      if (calculated !== null) {
        setEGFR(calculated.toFixed(0));
      }
    }
  }, [age, creatinine, creatinineUnit, gender]);

  const scoreData = useMemo(() => {
    let score = 0;
    const reasons: string[] = [];

    // Hypotension (SBP < 80 mmHg for >1 hr requiring inotropic support) = 5 points
    if (hypotension === "5") {
      score += 5;
      reasons.push("Hypotension (5 pts)");
    }

    // IABP = 5 points
    if (iabp === "5") {
      score += 5;
      reasons.push("IABP (5 pts)");
    }

    // CHF (Class III/IV or history of pulmonary edema) = 5 points
    if (chf === "5") {
      score += 5;
      reasons.push("CHF Class III/IV (5 pts)");
    }

    // Age > 75 years = 4 points
    const a = n(age);
    if (a > 75) {
      score += 4;
      reasons.push("Age >75y (4 pts)");
    }

    // Anaemia (Hct <39% M, <36% F) = 3 points
    if (anaemia === "3") {
      score += 3;
      reasons.push("Anaemia (3 pts)");
    }

    // Diabetes Mellitus = 3 points
    if (diabetes === "3") {
      score += 3;
      reasons.push("Diabetes (3 pts)");
    }

    // Contrast volume (1 point per 100 mL)
    const cv = n(contrastVolume);
    if (cv > 0) {
      const cvPoints = Math.floor(cv / 100);
      score += cvPoints;
      if (cvPoints > 0) reasons.push(`Contrast ${cv}mL (${cvPoints} pts)`);
    }

    // Serum creatinine / eGFR
    const gfr = n(eGFR);
    const cr = n(creatinine);
    let renalPoints = 0;

    // Preference for eGFR in modern scoring, but Mehran originally used Cr categories
    // eGFR points: <20=6, 20-40=4, 40-60=2
    if (!isNaN(gfr)) {
      if (gfr < 20) renalPoints = 6;
      else if (gfr < 40) renalPoints = 4;
      else if (gfr < 60) renalPoints = 2;
    } else if (!isNaN(cr)) {
      if (cr > 1.5) renalPoints = 4;
    }

    if (renalPoints > 0) {
      score += renalPoints;
      reasons.push(`Renal Impairment (${renalPoints} pts)`);
    }

    const risk: MehranRisk = 
      score <= 5 ? "low" :
      score <= 10 ? "moderate" :
      score <= 15 ? "high" : "very_high";

    // CIN Risk % and Dialysis Risk %
    let cinRisk = "0%";
    let dialysisRisk = "0%";

    if (score <= 5) { cinRisk = "7.5%"; dialysisRisk = "0.04%"; }
    else if (score <= 10) { cinRisk = "14.0%"; dialysisRisk = "0.12%"; }
    else if (score <= 15) { cinRisk = "26.1%"; dialysisRisk = "1.09%"; }
    else { cinRisk = "57.3%"; dialysisRisk = "12.6%"; }

    return { score, reasons, risk, cinRisk, dialysisRisk };
  }, [age, creatinine, eGFR, diabetes, anaemia, chf, hypotension, iabp, contrastVolume]);

  const riskBadge = (r: MehranRisk) => {
    switch(r) {
      case "low": return <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-500/30">Low Risk</Badge>;
      case "moderate": return <Badge className="bg-amber-500/15 text-amber-600 border-amber-500/30">Moderate Risk</Badge>;
      case "high": return <Badge className="bg-orange-500/15 text-orange-600 border-orange-500/30">High Risk</Badge>;
      case "very_high": return <Badge className="bg-destructive/15 text-destructive border-destructive/30">Very High Risk</Badge>;
      default: return null;
    }
  };

  const nextSteps = useMemo(() => {
    const steps = [
      "Ensure adequate hydration: Normal saline (1 mL/kg/h) 12h before and after procedure.",
      "Consider holding nephrotoxic drugs (NSAIDs, aminoglycosides) 24-48h prior.",
      "Use low-osmolar or iso-osmolar contrast media.",
      "Minimize contrast volume (aim for <3 x eGFR mL)."
    ];
    if (scoreData.risk === "high" || scoreData.risk === "very_high") {
      steps.push("Consider alternative imaging if possible.");
      steps.push("Post-procedure surveillance: Recheck SCr at 48-72h.");
    }
    return steps;
  }, [scoreData.risk]);

  const reset = () => {
    setAge(""); setCreatinine(""); setEGFR(""); setDiabetes("0"); setAnaemia("0");
    setCHF("0"); setHypotension("0"); setIABP("0"); setContrastVolume("");
  };

  return (
    <div className="space-y-4">
      <div className="pb-3">
        <CardDescription className="text-xs">
          Predicts risk of Contrast-Induced Nephropathy (CIN) and requirement for dialysis after PCI.
        </CardDescription>
      </div>
      <div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Age (years)</Label>
            <Input type="number" value={age} onChange={e => setAge(e.target.value)} placeholder="e.g. 76" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Gender</Label>
            <Select value={gender} onValueChange={(v: "male" | "female") => setGender(v)}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Serum Creatinine</Label>
            <div className="flex gap-1">
              <Input 
                type="number" 
                value={creatinine} 
                onChange={e => setCreatinine(e.target.value)} 
                placeholder={creatinineUnit === "mgdl" ? "e.g. 1.2" : "e.g. 106"} 
                step="0.01"
                className="flex-1"
              />
              <Select value={creatinineUnit} onValueChange={(v: "mgdl" | "umol") => setCreatinineUnit(v)}>
                <SelectTrigger className="h-9 w-20 px-2 text-[10px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="mgdl">mg/dL</SelectItem>
                  <SelectItem value="umol">µmol/L</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">eGFR (mL/min/1.73m²)</Label>
            <Input type="number" value={eGFR} onChange={e => setEGFR(e.target.value)} placeholder="Auto-calculated" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Contrast Volume (mL)</Label>
            <Input type="number" value={contrastVolume} onChange={e => setContrastVolume(e.target.value)} placeholder="e.g. 200" />
          </div>
          
          <div className="space-y-1.5">
            <Label className="text-xs">Diabetes Mellitus</Label>
            <Select value={diabetes} onValueChange={setDiabetes}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="0">No</SelectItem>
                <SelectItem value="3">Yes (+3)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Anaemia</Label>
            <Select value={anaemia} onValueChange={setAnaemia}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="0">No</SelectItem>
                <SelectItem value="3">Yes (+3)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">CHF (Class III/IV)</Label>
            <Select value={chf} onValueChange={setCHF}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="0">No</SelectItem>
                <SelectItem value="5">Yes (+5)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Hypotension (SBP &lt;80 mmHg)</Label>
            <Select value={hypotension} onValueChange={setHypotension}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="0">No</SelectItem>
                <SelectItem value="5">Yes (+5)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">IABP Requirement</Label>
            <Select value={iabp} onValueChange={setIABP}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="0">No</SelectItem>
                <SelectItem value="5">Yes (+5)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          <div className="bg-muted/30 rounded-xl p-4 border border-border">
            <div className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Total Mehran Score</div>
            <div className="text-3xl font-bold text-primary">{scoreData.score}</div>
            <div className="mt-2">{riskBadge(scoreData.risk)}</div>
            
            <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-border">
              <div>
                <div className="text-[10px] uppercase text-muted-foreground">CIN Risk</div>
                <div className="text-lg font-semibold">{scoreData.cinRisk}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase text-muted-foreground">Dialysis Risk</div>
                <div className="text-lg font-semibold">{scoreData.dialysisRisk}</div>
              </div>
            </div>
          </div>

          <div className="bg-primary/5 rounded-xl p-4 border border-primary/10">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="h-4 w-4 text-primary" />
              <div className="text-sm font-semibold text-primary">Management Strategy</div>
            </div>
            <ul className="space-y-2">
              {nextSteps.map((step, idx) => (
                <li key={idx} className="text-xs text-muted-foreground flex gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>{step}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 pt-2">
          <Button variant="outline" size="sm" onClick={() => copyToClipboard(`Mehran Score Assessment\nScore: ${scoreData.score}\nRisk: ${scoreData.risk}\nCIN Risk: ${scoreData.cinRisk}\nDialysis Risk: ${scoreData.dialysisRisk}\n\nPost–intra-arterial angiography renal monitoring\nBaseline:\n- Serum creatinine, eGFR, electrolytes\n- Assess AKI/CKD, volume status, heart failure, diabetes, nephrotoxins\n- Record contrast type and total volume\n\nHigh-risk definition:\n- eGFR <30 mL/min/1.73 m², AKI, unstable renal function,\n  first-pass renal arterial contrast, or CKD plus major haemodynamic/clinical risks\n\nAfter procedure:\n- Monitor urine output and haemodynamics if admitted/high risk\n- Maintain clinically appropriate hydration\n- Avoid NSAIDs and avoid repeat iodinated contrast if possible\n- Serum creatinine/eGFR at 48 hours; accept 48–72 h for outpatient follow-up\n- Consider an additional earlier check (~12–24 h) in severe CKD, shock,\n  ICU patients, or ongoing haemodynamic instability\n\nEscalate:\n- Creatinine rise ≥0.3 mg/dL or ≥1.5× baseline\n- Oliguria, fluid overload, hyperkalaemia, acidosis, or uraemic symptoms\n- Consider nephrology consultation based on severity/trajectory`, "Mehran Score")}>
            <Copy className="h-3.5 w-3.5 mr-1.5" /> Copy results
          </Button>
          <Button variant="outline" size="sm" onClick={() => downloadTextFile("mehran-score-pci.txt", `Mehran Score Assessment\nScore: ${scoreData.score}\nRisk: ${scoreData.risk}\nCIN Risk: ${scoreData.cinRisk}\nDialysis Risk: ${scoreData.dialysisRisk}\n\nPost–intra-arterial angiography renal monitoring\nBaseline:\n- Serum creatinine, eGFR, electrolytes\n- Assess AKI/CKD, volume status, heart failure, diabetes, nephrotoxins\n- Record contrast type and total volume\n\nHigh-risk definition:\n- eGFR <30 mL/min/1.73 m², AKI, unstable renal function,\n  first-pass renal arterial contrast, or CKD plus major haemodynamic/clinical risks\n\nAfter procedure:\n- Monitor urine output and haemodynamics if admitted/high risk\n- Maintain clinically appropriate hydration\n- Avoid NSAIDs and avoid repeat iodinated contrast if possible\n- Serum creatinine/eGFR at 48 hours; accept 48–72 h for outpatient follow-up\n- Consider an additional earlier check (~12–24 h) in severe CKD, shock,\n  ICU patients, or ongoing haemodynamic instability\n\nEscalate:\n- Creatinine rise ≥0.3 mg/dL or ≥1.5× baseline\n- Oliguria, fluid overload, hyperkalaemia, acidosis, or uraemic symptoms\n- Consider nephrology consultation based on severity/trajectory`)}>
            <Download className="h-3.5 w-3.5 mr-1.5" /> Download report
          </Button>
          <Button variant="ghost" size="sm" onClick={reset}>
            <RotateCcw className="h-3.5 w-3.5 mr-1.5" /> Reset
          </Button>
        </div>

        <div className="mt-6 border-t border-border pt-4">
          <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/20 p-3 rounded-lg border border-border/50">
            <AlertTriangle className="h-3.5 w-3.5 mt-0.5 text-amber-500 shrink-0" />
            <div className="w-full space-y-3">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-foreground/80">Post–intra-arterial angiography renal monitoring</p>
              </div>
              
              <Accordion type="single" collapsible className="w-full border-none">
                <AccordionItem value="timeline" className="border-none">
                  <AccordionTrigger className="py-2 hover:no-underline hover:bg-muted/30 rounded px-2 transition-colors">
                    <div className="flex items-center gap-2 text-xs font-medium text-primary">
                      <Clock className="h-3.5 w-3.5" />
                      View Monitoring Timeline & Criteria
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-3 pb-1 px-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-foreground/60">
                          <span className="w-2 h-2 rounded-full bg-slate-400" />
                          Baseline
                        </div>
                        <ul className="list-disc pl-4 space-y-0.5">
                          <li>Serum creatinine, eGFR, electrolytes</li>
                          <li>Assess AKI/CKD, volume status, HF, DM, nephrotoxins</li>
                          <li>Record contrast type and total volume</li>
                        </ul>
                      </div>
                      
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-amber-500">
                          <span className="w-2 h-2 rounded-full bg-amber-500" />
                          High-risk definition
                        </div>
                        <p className="pl-4">eGFR &lt;30, AKI, unstable function, first-pass renal contrast, or CKD plus major clinical risks.</p>
                      </div>
                      
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-blue-500">
                          <span className="w-2 h-2 rounded-full bg-blue-500" />
                          After procedure
                        </div>
                        <ul className="list-disc pl-4 space-y-0.5">
                          <li>Monitor UOP and haemodynamics if admitted/high risk</li>
                          <li>Maintain clinically appropriate hydration</li>
                          <li>Avoid NSAIDs and repeat iodinated contrast</li>
                        </ul>
                      </div>
                      
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-indigo-500">
                          <span className="w-2 h-2 rounded-full bg-indigo-500" />
                          12–24h (Severe/ICU)
                        </div>
                        <p className="pl-4">Earlier check in severe CKD, shock, ICU patients, or ongoing haemodynamic instability.</p>
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-purple-500">
                          <span className="w-2 h-2 rounded-full bg-purple-500" />
                          48h Follow-up
                        </div>
                        <p className="pl-4">SCr/eGFR at 48h (accept 48–72h for outpatient follow-up).</p>
                      </div>
                      
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-destructive">
                          <span className="w-2 h-2 rounded-full bg-destructive" />
                          Escalate
                        </div>
                        <p className="pl-4">Cr rise ≥0.3 mg/dL or ≥1.5× baseline; oliguria, fluid overload, hyperkalaemia, acidosis, or uraemic symptoms.</p>
                      </div>
                    </div>

                    <div className="italic pt-2 border-t border-border/50 mt-4 text-[10px]">
                      Note: ESUR advises 48h eGFR in at-risk patients; Canadian guidance uses eGFR ≤30 threshold after intra-arterial contrast.
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
