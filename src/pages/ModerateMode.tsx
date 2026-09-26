import { useState } from "react";
import { AbbreviationHover } from "@/components/AbbreviationHover";
import { useNavigate } from "react-router-dom";
import { Syringe, Heart, Dna, Scale, ArrowLeft, Calculator } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SectionCard } from "@/components/ui/section-card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

export function ModeNav() {
  const navigate = useNavigate();
  return (
    <div className="flex items-center justify-between mb-6 px-1">
      <Button variant="ghost" size="sm" onClick={() => navigate("/")}>
        <ArrowLeft className="h-4 w-4 mr-1" /> Home
      </Button>
      <div className="flex items-center gap-1.5 bg-muted/50 rounded-lg p-1">
        <button onClick={() => navigate("/simple")} className="px-3 py-1.5 text-xs font-semibold rounded-lg text-muted-foreground hover:bg-muted">Simple</button>
        <button onClick={() => navigate("/moderate")} className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-warning/100/15 text-orange-600 border border-warning/30">Moderate</button>
        <button onClick={() => navigate("/home")} className="px-3 py-1.5 text-xs font-semibold rounded-lg text-muted-foreground hover:bg-muted">Complex</button>
      </div>
    </div>
  );
}

/* ─── Diabetes (Moderate) ─── */
function DiabetesModerate() {
  const [hba1c, setHba1c] = useState("");
  const [fbg, setFbg] = useState("");
  const [age, setAge] = useState("");
  const [weight, setWeight] = useState("");
  const [egfr, setEgfr] = useState("");
  const [hasCVD, setHasCVD] = useState(false);
  const [hasCKD, setHasCKD] = useState(false);
  const [hasHF, setHasHF] = useState(false);
  const [currentDose, setCurrentDose] = useState("");
  const [result, setResult] = useState<React.ReactNode>(null);
  const [insulinRec, setInsulinRec] = useState<string | null>(null);

  const calculate = () => {
    const a1c = parseFloat(hba1c);
    const f = parseFloat(fbg);
    const dose = parseFloat(currentDose);
    const gfr = parseFloat(egfr) || 60;
    const w = parseFloat(weight);

    const lines: React.ReactNode[] = [];
    lines.push(<span><span className="font-medium">📊 Risk-Stratified Recommendations:</span></span>);

    // Metformin decision
    if (gfr >= 30) {
      const maxMetformin = gfr >= 45 ? "2000 mg/day" : "1000 mg/day";
      lines.push(<span>✅ Metformin: Start 500 mg BID (max {maxMetformin}{gfr < 45 ? " — eGFR 30-44" : ""})</span>);
    } else {
      lines.push(<span>❌ Metformin: Contraindicated (<AbbreviationHover term="eGFR">eGFR</AbbreviationHover> &lt; 30)</span>);
    }

    // SGLT2i / GLP-1 based on comorbidities
    if (hasCVD || hasCKD || hasHF) {
      if (gfr >= 25) {
        lines.push(<span>✅ <AbbreviationHover term="SGLT2i">SGLT2i</AbbreviationHover> (Empagliflozin 10 mg / Dapagliflozin 10 mg): <AbbreviationHover term="CV">CV</AbbreviationHover> + renal protection</span>);
        if (hasHF) lines.push(<span>   Dapagliflozin preferred for <AbbreviationHover term="HF">HF</AbbreviationHover> (DELIVER/DAPA-HF)</span>);
      }
    }
    if ((hasCVD && a1c >= 7) || (w && w > 70)) {
      lines.push(<span>✅ <AbbreviationHover term="GLP-1">GLP-1</AbbreviationHover> RA (Semaglutide 0.25 mg → 0.5 mg weekly): <AbbreviationHover term="CV">CV</AbbreviationHover> benefit + weight loss</span>);
    }

    // Insulin titration suggestion
    if (a1c >= 7.5 || dose > 0) {
      if (a1c >= 9 || f >= 200) {
        lines.push(<span><span className="font-medium">💉 Insulin Assessment:</span></span>);
        lines.push(<span>   <AbbreviationHover term="HbA1c">HbA1c</AbbreviationHover> ≥ 9% or <AbbreviationHover term="FBG">FBG</AbbreviationHover> ≥ 200: Start basal insulin</span>);
        const startingDose = w ? Math.round(w * 0.2) : 10;
        lines.push(<span>   Glargine {startingDose} U SC bedtime (0.2 U/kg/day)</span>);
      }

      if (dose > 0 && f > 0) {
        const avgReading = f;
        if (avgReading > 130) {
          const increase = avgReading > 180 ? 4 : 2;
          lines.push(<span>   Current {dose} U → increase by {increase} U to {dose + increase} U</span>);
          lines.push(<span>   Reason: <AbbreviationHover term="FBG">FBG</AbbreviationHover> {avgReading} &gt; target (70-130 mg/dL)</span>);
        } else if (avgReading < 70) {
          const decrease = avgReading < 54 ? 4 : 2;
          lines.push(<span>   Current {dose} U → DECREASE by {decrease} U to {Math.max(0, dose - decrease)} U</span>);
          lines.push(<span>   ⚠ Hypoglycemia detected (<AbbreviationHover term="FBG">FBG</AbbreviationHover> {avgReading})</span>);
        } else {
          lines.push(<span>   Current {dose} U — At target. Maintain dose.</span>);
        }
      }
    }

    lines.push(<span className="pt-1">Targets: <AbbreviationHover term="HbA1c">HbA1c</AbbreviationHover> &lt; 7.0% · <AbbreviationHover term="FBG">FBG</AbbreviationHover> &lt; 130 · TBG &lt; 180 mg/dL</span>);
    setResult(<div className="space-y-1">{lines}</div>);
  };

  return (
    <SectionCard title="Diabetes — Guideline-Integrated" icon={<Syringe className="h-4 w-4" />} tone="danger">
      <div className="max-w-xl space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div><Label className="text-xs mb-1.5 block">HbA1c (%)</Label><Input type="number" step="0.1" value={hba1c} onChange={e => setHba1c(e.target.value)} placeholder="7.2" className="h-10 px-3 rounded-lg border-border/60 focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all" /></div>
          <div><Label className="text-xs mb-1.5 block">FBG (mg/dL)</Label><Input type="number" value={fbg} onChange={e => setFbg(e.target.value)} placeholder="140" className="h-10 px-3 rounded-lg border-border/60 focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all" /></div>
          <div><Label className="text-xs mb-1.5 block">Age</Label><Input type="number" value={age} onChange={e => setAge(e.target.value)} placeholder="55" className="h-10 px-3 rounded-lg border-border/60 focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all" /></div>
          <div><Label className="text-xs mb-1.5 block">Weight (kg)</Label><Input type="number" value={weight} onChange={e => setWeight(e.target.value)} placeholder="75" className="h-10 px-3 rounded-lg border-border/60 focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all" /></div>
          <div><Label className="text-xs mb-1.5 block">eGFR</Label><Input type="number" value={egfr} onChange={e => setEgfr(e.target.value)} placeholder="90" className="h-10 px-3 rounded-lg border-border/60 focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all" /></div>
          <div><Label className="text-xs mb-1.5 block">Current Insulin (U)</Label><Input type="number" value={currentDose} onChange={e => setCurrentDose(e.target.value)} placeholder="10" className="h-10 px-3 rounded-lg border-border/60 focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all" /></div>
        </div>
        <div className="flex flex-wrap gap-3 pt-1">
          <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={hasCVD} onChange={e => setHasCVD(e.target.checked)} className="rounded" /><span className="text-xs">CVD</span></label>
          <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={hasCKD} onChange={e => setHasCKD(e.target.checked)} className="rounded" /><span className="text-xs">CKD</span></label>
          <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={hasHF} onChange={e => setHasHF(e.target.checked)} className="rounded" /><span className="text-xs">Heart Failure</span></label>
        </div>
        <Button size="sm" onClick={calculate} className="w-full"><Calculator className="h-3.5 w-3.5 mr-1.5" /> Generate Recommendations</Button>
        {result && <div className="p-4 rounded-xl border border-border/50 bg-card/80 text-sm leading-relaxed shadow-sm animate-in slide-in-from-top-2 fade-in duration-300">{result}</div>}
      </div>
    </SectionCard>
  );
}

/* ─── Hypertension (Moderate) ─── */
function HypertensionModerate() {
  const [sbp, setSbp] = useState("");
  const [dbp, setDbp] = useState("");
  const [age, setAge] = useState("");
  const [hasCKD, setHasCKD] = useState(false);
  const [hasDM, setHasDM] = useState(false);
  const [hasCAD, setHasCAD] = useState(false);
  const [currentMeds, setCurrentMeds] = useState("");
  const [result, setResult] = useState<React.ReactNode>(null);

  const calculate = () => {
    const s = parseInt(sbp);
    const d = parseInt(dbp);
    const lines: React.ReactNode[] = [];

    const grade = gradeHTN(s, d);
    lines.push(<span><span className="font-medium">📊 <AbbreviationHover term="BP">BP</AbbreviationHover>: {s}/{d} mmHg — {grade.replace("HTN", "HTN")}</span></span>);

    if (grade === "Normal" || grade === "High-Normal") {
      lines.push(<span>✅ At target. Continue lifestyle measures.</span>);
    } else {
      lines.push(<span><span className="font-medium">🔄 Treatment Algorithm:</span></span>);

      if (hasCKD || hasDM) {
        lines.push(<span>Step 1: <AbbreviationHover term="ACEi">ACEi</AbbreviationHover>/<AbbreviationHover term="ARB">ARB</AbbreviationHover> (Ramipril 2.5-5 mg / Losartan 50 mg)</span>);
        if (s >= 140) lines.push(<span>Step 2: Add <AbbreviationHover term="CCB">CCB</AbbreviationHover> (Amlodipine 5-10 mg)</span>);
        if (s >= 150) lines.push(<span>Step 3: Add Thiazide diuretic (Chlorthalidone 12.5-25 mg)</span>);
        if (hasCKD) lines.push(<span>Note: Monitor K+ and Cr within 2 weeks of <AbbreviationHover term="ACEi">ACEi</AbbreviationHover>/<AbbreviationHover term="ARB">ARB</AbbreviationHover> start</span>);
      } else {
        lines.push(<span>Step 1: <AbbreviationHover term="CCB">CCB</AbbreviationHover> (Amlodipine 5 mg) OR Thiazide (Chlorthalidone 12.5 mg)</span>);
        if (s >= 150) lines.push(<span>Step 2: Add second agent from another class</span>);
        if (s >= 160) lines.push(<span>Step 3: Triple therapy — <AbbreviationHover term="ACEi">ACEi</AbbreviationHover>/<AbbreviationHover term="ARB">ARB</AbbreviationHover> + <AbbreviationHover term="CCB">CCB</AbbreviationHover> + Thiazide</span>);
      }

      lines.push(<span><span className="font-medium">⚠ Drug Interaction Check:</span></span>);
      if (currentMeds.toLowerCase().includes("nsaid")) lines.push(<span>  NSAIDs: Reduce antihypertensive efficacy. Limit use.</span>);
      if (currentMeds.toLowerCase().includes("steroid") || currentMeds.toLowerCase().includes("pred")) lines.push(<span>  Steroids: May cause fluid retention &amp; <AbbreviationHover term="BP">BP</AbbreviationHover> elevation.</span>);
      if (currentMeds.toLowerCase().includes("spiro") || currentMeds.toLowerCase().includes("epler")) lines.push(<span>  Monitor K+ with <AbbreviationHover term="ACEi">ACEi</AbbreviationHover>/<AbbreviationHover term="ARB">ARB</AbbreviationHover> + K-sparing diuretic.</span>);

      lines.push(<span className="pt-1">Target: &lt; 130/80 mmHg</span>);
    }
    setResult(<div className="space-y-1">{lines}</div>);
  };

  const gradeHTN = (s: number, d: number): string => {
    if (s < 120 && d < 80) return "Normal";
    if (s < 130 && d < 85) return "High-Normal";
    if (s < 140 || d < 90) return "Grade 1 HTN";
    if (s < 160 || d < 100) return "Grade 2 HTN";
    return "Grade 3 HTN";
  };

  return (
    <SectionCard title="Hypertension — ESC Algorithm + Drug Check" icon={<Heart className="h-4 w-4" />} tone="warning">
      <div className="max-w-xl space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div><Label className="text-xs mb-1.5 block">SBP</Label><Input type="number" value={sbp} onChange={e => setSbp(e.target.value)} placeholder="145" className="h-10 px-3 rounded-lg border-border/60 focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all" /></div>
          <div><Label className="text-xs mb-1.5 block">DBP</Label><Input type="number" value={dbp} onChange={e => setDbp(e.target.value)} placeholder="92" className="h-10 px-3 rounded-lg border-border/60 focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all" /></div>
          <div><Label className="text-xs mb-1.5 block">Age</Label><Input type="number" value={age} onChange={e => setAge(e.target.value)} placeholder="55" className="h-10 px-3 rounded-lg border-border/60 focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all" /></div>
        </div>
        <div className="flex flex-wrap gap-3 pt-1">
          <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={hasCKD} onChange={e => setHasCKD(e.target.checked)} className="rounded" /><span className="text-xs">CKD</span></label>
          <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={hasDM} onChange={e => setHasDM(e.target.checked)} className="rounded" /><span className="text-xs">Diabetes</span></label>
          <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={hasCAD} onChange={e => setHasCAD(e.target.checked)} className="rounded" /><span className="text-xs">CAD</span></label>
        </div>
        <div><Label className="text-xs mb-1.5 block">Current Medications (for interaction check)</Label><Input type="text" value={currentMeds} onChange={e => setCurrentMeds(e.target.value)} placeholder="e.g., ibuprofen, prednisone" className="h-10 px-3 rounded-lg border-border/60 focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all" /></div>
        <Button size="sm" onClick={calculate} className="w-full"><Calculator className="h-3.5 w-3.5 mr-1.5" /> Generate</Button>
        {result && <div className="p-4 rounded-xl border border-border/50 bg-card/80 text-sm leading-relaxed shadow-sm animate-in slide-in-from-top-2 fade-in duration-300">{result}</div>}
      </div>
    </SectionCard>
  );
}

/* ─── Lipids (Moderate) ─── */
function LipidsModerate() {
  const [ldl, setLdl] = useState("");
  const [hdl, setHdl] = useState("");
  const [tg, setTg] = useState("");
  const [age, setAge] = useState("");
  const [sex, setSex] = useState<"male" | "female">("male");
  const [hasASCVD, setHasASCVD] = useState(false);
  const [hasDM, setHasDM] = useState(false);
  const [hasCKD, setHasCKD] = useState(false);
  const [smoker, setSmoker] = useState(false);
  const [htn, setHtn] = useState(false);
  const [result, setResult] = useState<React.ReactNode>(null);

  // Live risk computation
  const getRisk = () => {
    if (hasASCVD) return { cat: "Very High Risk", target: "< 55 mg/dL", intensity: "High", color: "text-red-600 bg-destructive/10 border-destructive/30" };
    if (hasDM && (smoker || htn || hasCKD)) return { cat: "Very High Risk", target: "< 55 mg/dL", intensity: "High", color: "text-red-600 bg-destructive/10 border-destructive/30" };
    if (hasDM || hasCKD) return { cat: "High Risk", target: "< 70 mg/dL", intensity: "High", color: "text-orange-600 bg-warning/10 border-warning/30" };
    const s = getScore();
    if (s >= 3) return { cat: "High Risk", target: "< 70 mg/dL", intensity: "High", color: "text-orange-600 bg-warning/10 border-warning/30" };
    if (s >= 2) return { cat: "Moderate Risk", target: "< 100 mg/dL", intensity: "Moderate", color: "text-warning bg-warning/10 border-warning/30" };
    const l = parseFloat(ldl);
    if (!isNaN(l) && l >= 160) return { cat: "Moderate Risk", target: "< 100 mg/dL", intensity: "Moderate", color: "text-warning bg-warning/10 border-warning/30" };
    return { cat: "Low Risk", target: "< 130 mg/dL", intensity: "Lifestyle", color: "text-success bg-success/10 border-success/30" };
  };

  const getScore = () => {
    const a = parseInt(age);
    let s = 0;
    if (!isNaN(a) && ((a >= 45 && sex === "male") || (a >= 55 && sex === "female"))) s += 1;
    if (smoker) s += 1;
    if (htn) s += 1;
    const h = parseFloat(hdl);
    if (!isNaN(h) && h < 40) s += 1;
    if (hasDM) s += 1;
    if (hasCKD) s += 1;
    return s;
  };

  const riskPreview = getRisk();
  const score = getScore();

  const calculate = () => {
    const l = parseFloat(ldl);
    const h = parseFloat(hdl);
    const t = parseFloat(tg);

    const lines: React.ReactNode[] = [];

    lines.push(<span><span className="font-medium">📊 Risk Category: {riskPreview.cat} (Risk factors: {score})</span></span>);
    lines.push(<span className="text-muted-foreground">   <AbbreviationHover term="LDL">LDL</AbbreviationHover>: {l || "?"} · <AbbreviationHover term="HDL">HDL</AbbreviationHover>: {h || "?"} · <AbbreviationHover term="TG">TG</AbbreviationHover>: {t || "?"}</span>);
    lines.push(<span className="text-muted-foreground">   Target <AbbreviationHover term="LDL">LDL</AbbreviationHover>: {riskPreview.target}</span>);

    if (!isNaN(l)) {
      const targetNum = parseInt(riskPreview.target.replace(/[< >mg/dL]/g, ""));
      if (l <= targetNum) {
        lines.push(<span>✅ <AbbreviationHover term="LDL">LDL</AbbreviationHover> at target. Continue current therapy.</span>);
      } else {
        lines.push(<span><span className="text-warning">⚠ {l - targetNum} mg/dL above target</span> (<AbbreviationHover term="LDL">LDL</AbbreviationHover> {l}, target {riskPreview.target})</span>);
        lines.push(<span>➡️ Start: {riskPreview.intensity}</span>);
        if (riskPreview.intensity === "High") lines.push(<span>   Atorvastatin 40-80 mg OD or Rosuvastatin 20-40 mg OD</span>);
        else if (riskPreview.intensity === "Moderate") lines.push(<span>   Atorvastatin 10-20 mg OD or Rosuvastatin 5-10 mg OD</span>);
        if (hasASCVD && l >= 70) lines.push(<span>➡️ Consider adding Ezetimibe 10 mg</span>);
      }
    }

    if (t >= 500) {
      lines.push(<span><span className="text-warning font-medium">⚠ <AbbreviationHover term="TG">TG</AbbreviationHover> ≥ 500:</span> Fenofibrate 145 mg for pancreatitis prevention</span>);
      lines.push(<span>   Avoid Gemfibrozil with statins (myopathy risk)</span>);
    }
    if (t >= 200 && t < 500 && hasDM && hasASCVD) {
      lines.push(<span>   Icosapent ethyl (Vascepa) 2 g BID for <AbbreviationHover term="CV">CV</AbbreviationHover> risk reduction (<AbbreviationHover term="ASCVD">ASCVD</AbbreviationHover>-IT)</span>);
    }

    lines.push(<span className="text-xs text-muted-foreground pt-1"><AbbreviationHover term="LDL">Lp(a)</AbbreviationHover>: Consider testing if early <AbbreviationHover term="ASCVD">ASCVD</AbbreviationHover> or family history</span>);
    lines.push(<span className="text-xs text-muted-foreground">Monitoring: Lipids at 6 weeks, then 6-12 monthly once at target</span>);

    setResult(<div className="space-y-1">{lines}</div>);
  };

  return (
    <SectionCard title="Lipids — ASCVD Risk Score" icon={<Dna className="h-4 w-4" />} tone="primary">
      <div className="max-w-xl space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div><Label className="text-xs mb-1.5 block">LDL</Label><Input type="number" value={ldl} onChange={e => setLdl(e.target.value)} placeholder="130" className="h-10 px-3 rounded-lg border-border/60 focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all" /></div>
          <div><Label className="text-xs mb-1.5 block">HDL</Label><Input type="number" value={hdl} onChange={e => setHdl(e.target.value)} placeholder="42" className="h-10 px-3 rounded-lg border-border/60 focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all" /></div>
          <div><Label className="text-xs mb-1.5 block">TG</Label><Input type="number" value={tg} onChange={e => setTg(e.target.value)} placeholder="150" className="h-10 px-3 rounded-lg border-border/60 focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all" /></div>
          <div><Label className="text-xs mb-1.5 block">Age</Label><Input type="number" value={age} onChange={e => setAge(e.target.value)} placeholder="55" className="h-10 px-3 rounded-lg border-border/60 focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all" /></div>
          <div>
            <Label className="text-xs mb-1.5 block">Sex</Label>
            <Select value={sex} onValueChange={(v: "male" | "female") => setSex(v)}>
              <SelectTrigger className="h-10 px-3 rounded-lg border-border/60 focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex flex-wrap gap-3 pt-1">
          <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={hasASCVD} onChange={e => setHasASCVD(e.target.checked)} className="rounded" /><span className="text-xs">ASCVD Hx</span></label>
          <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={hasDM} onChange={e => setHasDM(e.target.checked)} className="rounded" /><span className="text-xs">Diabetes</span></label>
          <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={hasCKD} onChange={e => setHasCKD(e.target.checked)} className="rounded" /><span className="text-xs">CKD</span></label>
          <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={smoker} onChange={e => setSmoker(e.target.checked)} className="rounded" /><span className="text-xs">Smoker</span></label>
          <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={htn} onChange={e => setHtn(e.target.checked)} className="rounded" /><span className="text-xs">HTN</span></label>
        </div>

        {/* Live Risk Preview */}
        <div className={`p-3 rounded-lg border text-xs ${riskPreview.color}`}>
          <span className="font-semibold">{riskPreview.cat}</span>
          <span className="ml-2">→ LDL Target: <strong>{riskPreview.target}</strong></span>
          <span className="ml-2 text-xs">({riskPreview.intensity} · {score} factor{score !== 1 ? "s" : ""})</span>
        </div>

        <Button size="sm" onClick={calculate} className="w-full"><Calculator className="h-3.5 w-3.5 mr-1.5" /> Calculate Risk & Treatment</Button>
        {result && <div className="p-3 bg-muted rounded-lg text-sm leading-relaxed">{result}</div>}
      </div>
    </SectionCard>
  );
}

/* ─── Obesity (Moderate) ─── */
function ObesityModerate() {
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [waist, setWaist] = useState("");
  const [hasDM, setHasDM] = useState(false);
  const [hasHTN, setHasHTN] = useState(false);
  const [hasOSA, setHasOSA] = useState(false);
  const [result, setResult] = useState<React.ReactNode>(null);

  const calculate = () => {
    const w = parseFloat(weight);
    const h = parseFloat(height);
    const wa = parseFloat(waist);

    const bmi = w / ((h / 100) * (h / 100));
    const whr = wa ? wa / (h / 100) : null;

    const lines: React.ReactNode[] = [];
    if (whr) {
      lines.push(<span>📊 <AbbreviationHover term="BMI">BMI</AbbreviationHover>: {bmi.toFixed(1)} kg/m² — Waist-Height Ratio: {whr.toFixed(2)} {whr >= 0.5 ? <span className="text-warning">⚠ Elevated</span> : <span className="text-success">✅ Normal</span>}</span>);
    } else {
      lines.push(<span>📊 <AbbreviationHover term="BMI">BMI</AbbreviationHover>: {bmi.toFixed(1)} kg/m²</span>);
    }

    let cat: string;
    let rx: string;
    const med: React.ReactNode[] = [];

    if (bmi < 23) {
      cat = "Normal (Indian)"; rx = "Maintain lifestyle.";
    } else if (bmi < 25) {
      cat = "Overweight — At risk"; rx = "Diet + exercise. Screen for MetS.";
      if (hasDM || hasHTN) med.push(<span>Consider <AbbreviationHover term="GLP-1">GLP-1</AbbreviationHover> RA (Semaglutide 1.0 mg)</span>);
    } else if (bmi < 30) {
      cat = "Obese Class I"; rx = "500 kcal deficit + 150 min exercise/week";
      med.push(<span><AbbreviationHover term="GLP-1">GLP-1</AbbreviationHover> RA: Semaglutide 0.25 mg → 2.4 mg weekly</span>);
    } else if (bmi < 35) {
      cat = "Obese Class II"; rx = "Structured weight program";
      med.push(<span><AbbreviationHover term="GLP-1">GLP-1</AbbreviationHover> RA: Semaglutide 2.4 mg weekly</span>);
      med.push(<span>Consider Tirzepatide 2.5 mg → 15 mg weekly (superior weight loss)</span>);
      if (hasDM) med.push(<span>Bariatric referral if <AbbreviationHover term="BMI">BMI</AbbreviationHover> ≥ 32.5 with diabetes</span>);
    } else {
      cat = "Obese Class III"; rx = "Refer bariatric surgery evaluation";
      med.push(<span>Pre-op: <AbbreviationHover term="GLP-1">GLP-1</AbbreviationHover> RA (Semaglutide 2.4 mg / Tirzepatide 15 mg)</span>);
      med.push(<span><AbbreviationHover term="BMI">BMI</AbbreviationHover> ≥ 40: Surgery + medical therapy</span>);
    }

    lines.push(<span>   Category: {cat}</span>);
    lines.push(<span>   Plan: {rx}</span>);
    if (med.length > 0) {
      lines.push(<span><span className="font-medium">💊 Medications:</span></span>);
      med.forEach(m => lines.push(<span>   • {m}</span>));
    }

    lines.push(<span className="pt-1">Target: 5-10% weight loss over 6 months</span>);
    setResult(<div className="space-y-1">{lines}</div>);
  };

  return (
    <SectionCard title="Obesity — GLP-1 Algorithm" icon={<Scale className="h-4 w-4" />} tone="purple">
      <div className="max-w-xl space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div><Label className="text-xs mb-1.5 block">Weight (kg)</Label><Input type="number" step="0.1" value={weight} onChange={e => setWeight(e.target.value)} placeholder="75" className="h-10 px-3 rounded-lg border-border/60 focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all" /></div>
          <div><Label className="text-xs mb-1.5 block">Height (cm)</Label><Input type="number" value={height} onChange={e => setHeight(e.target.value)} placeholder="170" className="h-10 px-3 rounded-lg border-border/60 focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all" /></div>
          <div><Label className="text-xs mb-1.5 block">Waist (cm)</Label><Input type="number" value={waist} onChange={e => setWaist(e.target.value)} placeholder="95" className="h-10 px-3 rounded-lg border-border/60 focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all" /></div>
        </div>
        <div className="flex flex-wrap gap-3 pt-1">
          <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={hasDM} onChange={e => setHasDM(e.target.checked)} className="rounded" /><span className="text-xs">Diabetes</span></label>
          <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={hasHTN} onChange={e => setHasHTN(e.target.checked)} className="rounded" /><span className="text-xs">HTN</span></label>
          <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={hasOSA} onChange={e => setHasOSA(e.target.checked)} className="rounded" /><span className="text-xs">OSA</span></label>
        </div>
        <Button size="sm" onClick={calculate} className="w-full"><Calculator className="h-3.5 w-3.5 mr-1.5" /> Assess & Recommend</Button>
        {result && <div className="p-3 bg-muted rounded-lg text-sm leading-relaxed">{result}</div>}
      </div>
    </SectionCard>
  );
}

export default function ModerateMode() {
  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-3xl mx-auto">
        <ModeNav />
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Moderate Mode</h1>
          <p className="text-sm text-muted-foreground">Guideline-integrated recommendations with risk stratification and comorbidity-based algorithm selection.</p>
        </div>
        <div className="space-y-4">
          <DiabetesModerate />
          <HypertensionModerate />
          <LipidsModerate />
          <ObesityModerate />
        </div>
        <p className="text-center text-xs text-muted-foreground mt-6">Guidelines: ADA 2026 · ESC/ESH 2024 · LAI 2023 · ACC/AHA</p>
      </div>

      {/* Bottom nav */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-border/60 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-background/95 py-2.5 px-4 flex items-center justify-center gap-2 z-50">
        <button onClick={() => window.location.href = "/"} className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors">🏠 Homepage</button>
        <span className="text-xs text-muted-foreground/40">|</span>
        <button onClick={() => window.location.href = "/simple"} className="px-3 py-1.5 text-xs font-semibold rounded-lg text-muted-foreground hover:bg-muted transition-colors">🟢 Simple</button>
        <button onClick={() => window.location.href = "/moderate"} className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-warning/100/15 text-orange-600 border border-warning/30 hover:bg-warning/100/25 transition-colors">🟠 Moderate</button>
        <button onClick={() => window.location.href = "/home"} className="px-3 py-1.5 text-xs font-semibold rounded-lg text-muted-foreground hover:bg-muted transition-colors">🔴 Complex</button>
      </div>
      <div className="h-14" />
    </div>
  );
}
