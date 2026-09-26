import { useState } from "react";
import { AbbreviationHover } from "@/components/AbbreviationHover";
import { useNavigate } from "react-router-dom";
import { Syringe, Heart, Dna, Scale, ArrowLeft, Calculator } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SectionCard } from "@/components/ui/section-card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const GLP_COMORBIDITIES = ["Type 2 Diabetes (HbA1c ≥ 7%)", "Hypertension (BP ≥ 130/80)", "CVD / ASCVD history", "CKD (eGFR ≥ 25)", "Heart Failure (HFrEF)", "NAFLD / MASLD", "OSA (Obstructive Sleep Apnea)"];

function TooltipGLP({ text }: { text: string }) {
  return (
    <span className="group relative inline-block">
      <span className="text-foreground font-medium underline decoration-dotted decoration-primary/40 cursor-help">{text}</span>
      <div className="absolute left-0 bottom-full mb-2 w-56 hidden group-hover:block z-50">
        <div className="bg-popover text-popover-foreground text-xs p-3 rounded-lg shadow-xl border border-border">
          <p className="font-semibold text-primary mb-1.5">GLP-1 RA indicated for:</p>
          <ul className="space-y-0.5">
            {GLP_COMORBIDITIES.map((c, i) => (
              <li key={i} className="flex items-start gap-1.5">
                <span className="text-success mt-0.5">•</span>
                <span>{c}</span>
              </li>
            ))}
          </ul>
          <p className="text-xs text-muted-foreground mt-2 italic">Semaglutide 0.25 mg → 1.0 mg weekly / Tirzepatide 2.5 mg → 15 mg weekly</p>
        </div>
      </div>
    </span>
  );
}

export function ModeNav() {
  const navigate = useNavigate();
  return (
    <div className="flex items-center justify-between mb-6 px-1">
      <Button variant="ghost" size="sm" onClick={() => navigate("/")}>
        <ArrowLeft className="h-4 w-4 mr-1" /> Home
      </Button>
      <div className="flex items-center gap-1.5 bg-muted/50 rounded-lg p-1">
        <button onClick={() => navigate("/simple")} className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-success/100/15 text-success border border-green-500/30">Simple</button>
        <button onClick={() => navigate("/moderate")} className="px-3 py-1.5 text-xs font-semibold rounded-lg text-muted-foreground hover:bg-muted">Moderate</button>
        <button onClick={() => navigate("/home")} className="px-3 py-1.5 text-xs font-semibold rounded-lg text-muted-foreground hover:bg-muted">Complex</button>
      </div>
    </div>
  );
}

/* ─── Diabetes Calculator (Easy) ─── */
function DiabetesCalc() {
  const [fbg, setFbg] = useState("");
  const [hba1c, setHba1c] = useState("");
  const [age, setAge] = useState("");
  const [weight, setWeight] = useState("");
  const [result, setResult] = useState<React.ReactNode>(null);

  const calculate = () => {
    const a1c = parseFloat(hba1c);
    const f = parseFloat(fbg);
    const a = parseInt(age);
    const w = parseFloat(weight);
    if (!a1c && !f) { setResult(<span className="text-muted-foreground">Enter at least <AbbreviationHover term="HbA1c">HbA1c</AbbreviationHover> or <AbbreviationHover term="FBG">FBG</AbbreviationHover></span>); return; }

    const lines: React.ReactNode[] = [];
    if (a1c >= 6.5 || f >= 126) {
      lines.push(<span><span className="text-success font-medium">✅ Diabetes diagnosed</span></span>);
      if (a1c >= 9) {
        lines.push(<span>➡️ <AbbreviationHover term="HbA1c">HbA1c</AbbreviationHover> ≥ 9%: Consider insulin therapy</span>);
        lines.push(<span>   Metformin + Basal insulin (Glargine 10U bedtime)</span>);
      } else {
        lines.push(<span>➡️ Start Metformin 500 mg BID, titrate to 1000 mg BID</span>);
      }
      if (w && w > 70) {
        lines.push(<span>➡️ Overweight: Consider <AbbreviationHover term="GLP-1">GLP-1</AbbreviationHover> RA (Semaglutide 0.25 mg weekly)</span>);
      }
      if (a1c >= 7.5) {
        lines.push(<span>➡️ Add <AbbreviationHover term="SGLT2i">SGLT2i</AbbreviationHover> (Empagliflozin 10 mg) for <AbbreviationHover term="CV">CV</AbbreviationHover>/renal protection</span>);
      }
      lines.push(<span className="pt-1">Target: <AbbreviationHover term="HbA1c">HbA1c</AbbreviationHover> &lt; 7.0%, <AbbreviationHover term="FBG">FBG</AbbreviationHover> &lt; 130 mg/dL</span>);
    } else if (a1c >= 5.7 || f >= 100) {
      lines.push(<span><span className="text-warning font-medium">⚠️ Prediabetes range</span></span>);
      lines.push(<span>➡️ Lifestyle modification + Metformin if age &lt; 60 or <AbbreviationHover term="BMI">BMI</AbbreviationHover> ≥ 35</span>);
      lines.push(<span>➡️ Repeat <AbbreviationHover term="HbA1c">HbA1c</AbbreviationHover> in 3-6 months</span>);
    } else {
      lines.push(<span>✅ Normal glucose. Maintain lifestyle.</span>);
    }
    setResult(<div className="space-y-1">{lines}</div>);
  };

  return (
    <SectionCard title="Diabetes" icon={<Syringe className="h-4 w-4" />} tone="danger" defaultOpen={false}>
      <div className="max-w-md space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div><Label className="text-xs mb-1.5 block">HbA1c (%)</Label><Input type="number" step="0.1" value={hba1c} onChange={e => setHba1c(e.target.value)} placeholder="7.2" className="h-10 px-3 rounded-lg border-border/60 focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all" /></div>
          <div><Label className="text-xs mb-1.5 block">FBG (mg/dL)</Label><Input type="number" value={fbg} onChange={e => setFbg(e.target.value)} placeholder="140" className="h-10 px-3 rounded-lg border-border/60 focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all" /></div>
          <div><Label className="text-xs mb-1.5 block">Age</Label><Input type="number" value={age} onChange={e => setAge(e.target.value)} placeholder="55" className="h-10 px-3 rounded-lg border-border/60 focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all" /></div>
          <div><Label className="text-xs mb-1.5 block">Weight (kg)</Label><Input type="number" value={weight} onChange={e => setWeight(e.target.value)} placeholder="e.g. 75" className="h-10 px-3 rounded-lg border-border/60 focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all" /></div>
        </div>
        <Button size="sm" onClick={calculate} className="w-full"><Calculator className="h-3.5 w-3.5 mr-1.5" /> Calculate</Button>
        {result && <div className="p-4 rounded-xl border border-border/50 bg-card/80 text-sm leading-relaxed shadow-sm animate-in slide-in-from-top-2 fade-in duration-300">{result}</div>}
      </div>
    </SectionCard>
  );
}

/* ─── Hypertension Calculator (Easy) ─── */
function HypertensionCalc() {
  const [sbp, setSbp] = useState("");
  const [dbp, setDbp] = useState("");
  const [age, setAge] = useState("");
  const [hasCKD, setHasCKD] = useState(false);
  const [hasDM, setHasDM] = useState(false);
  const [result, setResult] = useState<React.ReactNode>(null);

  const calculate = () => {
    const s = parseInt(sbp);
    const d = parseInt(dbp);
    const a = parseInt(age);

    const lines: React.ReactNode[] = [];
    let grade = "";
    if (s < 120 && d < 80) grade = "Normal";
    else if (s < 130 && d < 85) grade = "High-Normal";
    else if (s < 140 || d < 90) grade = "Grade 1 HTN";
    else if (s < 160 || d < 100) grade = "Grade 2 HTN";
    else grade = "Grade 3 HTN";

    lines.push(<span><span className="font-medium">📊 BP Classification: {grade}</span></span>);
    lines.push(<span>   {s || "?"}/{d || "?"} mmHg</span>);

    if (grade === "Normal" || grade === "High-Normal") {
      lines.push(<span>✅ Target achieved. Lifestyle maintenance.</span>);
    } else {
      if (hasCKD || hasDM) {
        lines.push(<span>➡️ Start <AbbreviationHover term="ACEi">ACEi</AbbreviationHover> (Ramipril 2.5-5 mg OD) or <AbbreviationHover term="ARB">ARB</AbbreviationHover> (Losartan 50 mg OD)</span>);
        lines.push(<span>   Reason: <AbbreviationHover term="CKD">CKD</AbbreviationHover> or <AbbreviationHover term="DM">DM</AbbreviationHover> present — <AbbreviationHover term="RAS">RAS</AbbreviationHover> blocker first-line</span>);
      } else {
        lines.push(<span>➡️ Start <AbbreviationHover term="CCB">CCB</AbbreviationHover> (Amlodipine 5 mg OD)</span>);
        lines.push(<span>   Alternative: Thiazide diuretic (Chlorthalidone 12.5 mg)</span>);
      }

      if (s >= 160 || d >= 100) {
        lines.push(<span>➡️ Grade 2+: Consider dual therapy add-on</span>);
        lines.push(<span>   <AbbreviationHover term="ACEi">ACEi</AbbreviationHover>/<AbbreviationHover term="ARB">ARB</AbbreviationHover> + <AbbreviationHover term="CCB">CCB</AbbreviationHover> or <AbbreviationHover term="ACEi">ACEi</AbbreviationHover>/<AbbreviationHover term="ARB">ARB</AbbreviationHover> + Thiazide</span>);
      }

      lines.push(<span className="pt-1">Target: <AbbreviationHover term="BP">BP</AbbreviationHover> &lt; 130/80 mmHg</span>);
    }
    setResult(<div className="space-y-1">{lines}</div>);
  };

  return (
    <SectionCard title="Hypertension" icon={<Heart className="h-4 w-4" />} tone="warning" defaultOpen={false}>
      <div className="max-w-md space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div><Label className="text-xs mb-1.5 block">SBP (mmHg)</Label><Input type="number" value={sbp} onChange={e => setSbp(e.target.value)} placeholder="e.g. 145" className="h-10 px-3 rounded-lg border-border/60 focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all" /></div>
          <div><Label className="text-xs mb-1.5 block">DBP (mmHg)</Label><Input type="number" value={dbp} onChange={e => setDbp(e.target.value)} placeholder="e.g. 92" className="h-10 px-3 rounded-lg border-border/60 focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all" /></div>
          <div><Label className="text-xs mb-1.5 block">Age</Label><Input type="number" value={age} onChange={e => setAge(e.target.value)} placeholder="55" className="h-10 px-3 rounded-lg border-border/60 focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all" /></div>
        </div>
        <div className="flex gap-4 pt-1">
          <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={hasCKD} onChange={e => setHasCKD(e.target.checked)} className="rounded" /><span className="text-xs">CKD</span></label>
          <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={hasDM} onChange={e => setHasDM(e.target.checked)} className="rounded" /><span className="text-xs">Diabetes</span></label>
        </div>
        <Button size="sm" onClick={calculate} className="w-full"><Calculator className="h-3.5 w-3.5 mr-1.5" /> Calculate</Button>
        {result && <div className="p-4 rounded-xl border border-border/50 bg-card/80 text-sm leading-relaxed shadow-sm animate-in slide-in-from-top-2 fade-in duration-300">{result}</div>}
      </div>
    </SectionCard>
  );
}

/* ─── Lipids Calculator (Easy) with Risk Modifiers ─── */
function LipidsCalc() {
  const [ldl, setLdl] = useState("");
  const [hdl, setHdl] = useState("");
  const [tg, setTg] = useState("");
  const [age, setAge] = useState("");
  const [sex, setSex] = useState<"male" | "female">("male");
  const [hasASCVD, setHasASCVD] = useState(false);
  const [hasDM, setHasDM] = useState(false);
  const [hasCKD, setHasCKD] = useState(false);
  const [hasFH, setHasFH] = useState(false);
  const [hasSevereHyperLDL, setHasSevereHyperLDL] = useState(false);
  const [hasHTN, setHasHTN] = useState(false);
  const [smoker, setSmoker] = useState(false);
  const [result, setResult] = useState<React.ReactNode>(null);

  // Compute risk category and target LIVE based on selected modifiers
  const getRiskCategory = () => {
    if (hasASCVD) return { risk: "Very High Risk", target: "< 55 mg/dL", intensity: "High", color: "text-red-600" };
    if (hasDM && (hasCKD || hasFH || hasSevereHyperLDL)) return { risk: "Very High Risk", target: "< 55 mg/dL", intensity: "High", color: "text-red-600" };
    if (hasDM || hasFH || hasSevereHyperLDL || hasCKD) return { risk: "High Risk", target: "< 70 mg/dL", intensity: "High", color: "text-orange-600" };
    const a = parseInt(age);
    if (!isNaN(a) && ((a >= 45 && sex === "male") || (a >= 55 && sex === "female"))) {
      let modCount = 0;
      if (hasHTN) modCount++;
      if (smoker) modCount++;
      const h = parseFloat(hdl);
      if (!isNaN(h) && h < 40) modCount++;
      if (modCount >= 2) return { risk: "High Risk", target: "< 70 mg/dL", intensity: "High", color: "text-orange-600" };
      if (modCount >= 1) return { risk: "Moderate Risk", target: "< 100 mg/dL", intensity: "Moderate", color: "text-warning" };
    }
    const l = parseFloat(ldl);
    if (!isNaN(l) && l >= 160) return { risk: "Moderate Risk", target: "< 100 mg/dL", intensity: "Moderate", color: "text-warning" };
    if (!isNaN(a) && a > 40) return { risk: "Moderate Risk", target: "< 100 mg/dL", intensity: "Moderate", color: "text-warning" };
    return { risk: "Low Risk", target: "< 130 mg/dL", intensity: "Lifestyle", color: "text-success" };
  };

  const riskInfo = getRiskCategory();

  const calculate = () => {
    const l = parseFloat(ldl);
    const h = parseFloat(hdl);
    const t = parseFloat(tg);
    const a = parseInt(age);

    const lines: React.ReactNode[] = [];

    // Risk modifier summary
    const activeModifiers = [];
    if (hasASCVD) activeModifiers.push("ASCVD history");
    if (hasDM) activeModifiers.push("Diabetes");
    if (hasCKD) activeModifiers.push("CKD (eGFR < 60)");
    if (hasFH) activeModifiers.push("Family history of premature ASCVD");
    if (hasSevereHyperLDL) activeModifiers.push("Severe hypercholesterolemia (LDL ≥ 190)");
    if (hasHTN) activeModifiers.push("Hypertension");
    if (smoker) activeModifiers.push("Smoking");

    lines.push(<span><span className="font-medium">📊 Risk Category: {riskInfo.risk}</span></span>);
    if (activeModifiers.length > 0) {
      lines.push(<span className="text-muted-foreground">   Modifiers: {activeModifiers.join(", ")}</span>);
    } else {
      lines.push(<span className="text-muted-foreground">   Modifiers: None</span>);
    }
    lines.push(<span className="text-muted-foreground">   <AbbreviationHover term="LDL">LDL</AbbreviationHover> Target: {riskInfo.target}</span>);

    // Where is the patient vs target?
    if (!isNaN(l)) {
      const targetNum = parseInt(riskInfo.target.replace(/[< >mg/dL]/g, ""));
      if (l <= targetNum) {
        lines.push(<span>✅ At target <AbbreviationHover term="LDL">LDL</AbbreviationHover>. Maintain current therapy.</span>);
      } else {
        const above = l - targetNum;
        lines.push(<span><span className="text-warning">⚠ {above} mg/dL above target</span> (current <AbbreviationHover term="LDL">LDL</AbbreviationHover> {l}, target {riskInfo.target})</span>);
        lines.push(<span>➡️ Start {riskInfo.intensity} intensity statin</span>);
        if (riskInfo.intensity === "High") lines.push(<span>   Atorvastatin 40-80 mg OD or Rosuvastatin 20-40 mg OD</span>);
        else if (riskInfo.intensity === "Moderate") lines.push(<span>   Atorvastatin 10-20 mg OD or Rosuvastatin 5-10 mg OD</span>);
        else lines.push(<span>   Lifestyle modification. Recheck lipids in 6-12 months.</span>);

        if (activeModifiers.includes("ASCVD history") && l >= 70) {
          lines.push(<span>➡️ Consider adding Ezetimibe 10 mg OD</span>);
        }
      }
    } else {
      lines.push(<span>ℹ️ Enter <AbbreviationHover term="LDL">LDL</AbbreviationHover> value above and click Calculate</span>);
    }

    if (!isNaN(t) && t >= 500) {
      lines.push(<span><span className="text-warning font-medium">⚠ <AbbreviationHover term="TG">TG</AbbreviationHover> ≥ 500 mg/dL:</span> Add Fenofibrate 145 mg OD for pancreatitis prevention</span>);
    }

    lines.push(<span className="text-xs text-muted-foreground pt-1">Monitoring: Lipids at 6 weeks, then 6-12 monthly</span>);

    setResult(<div className="space-y-1">{lines}</div>);
  };

  return (
    <SectionCard title="Lipids" icon={<Dna className="h-4 w-4" />} tone="primary" defaultOpen={false}>
      <div className="max-w-md space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div><Label className="text-xs mb-1.5 block">LDL (mg/dL)</Label><Input type="number" value={ldl} onChange={e => setLdl(e.target.value)} placeholder="e.g. 130" className="h-10 px-3 rounded-lg border-border/60 focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all" /></div>
          <div><Label className="text-xs mb-1.5 block">HDL (mg/dL)</Label><Input type="number" value={hdl} onChange={e => setHdl(e.target.value)} placeholder="e.g. 42" className="h-10 px-3 rounded-lg border-border/60 focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all" /></div>
          <div><Label className="text-xs mb-1.5 block">TG (mg/dL)</Label><Input type="number" value={tg} onChange={e => setTg(e.target.value)} placeholder="e.g. 150" className="h-10 px-3 rounded-lg border-border/60 focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all" /></div>
          <div><Label className="text-xs mb-1.5 block">Age</Label><Input type="number" value={age} onChange={e => setAge(e.target.value)} placeholder="55" className="h-10 px-3 rounded-lg border-border/60 focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all" /></div>
        </div>
        <div className="flex items-center gap-2">
          <Label className="text-xs mb-1.5 block">Sex</Label>
          <Select value={sex} onValueChange={(v: "male" | "female") => setSex(v)}>
            <SelectTrigger className="h-8 w-24"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="male">Male</SelectItem>
              <SelectItem value="female">Female</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Risk Modifiers */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground mb-1.5">Risk Modifiers — toggle to set LDL target</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5">
            <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={hasASCVD} onChange={e => setHasASCVD(e.target.checked)} className="rounded" /><span className="text-xs">ASCVD History</span></label>
            <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={hasDM} onChange={e => setHasDM(e.target.checked)} className="rounded" /><span className="text-xs">Diabetes</span></label>
            <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={hasCKD} onChange={e => setHasCKD(e.target.checked)} className="rounded" /><span className="text-xs">CKD (eGFR &lt; 60)</span></label>
            <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={hasFH} onChange={e => setHasFH(e.target.checked)} className="rounded" /><span className="text-xs">Family Hx ASCVD</span></label>
            <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={hasSevereHyperLDL} onChange={e => setHasSevereHyperLDL(e.target.checked)} className="rounded" /><span className="text-xs">LDL ≥ 190 (Severe)</span></label>
            <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={hasHTN} onChange={e => setHasHTN(e.target.checked)} className="rounded" /><span className="text-xs">Hypertension</span></label>
            <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={smoker} onChange={e => setSmoker(e.target.checked)} className="rounded" /><span className="text-xs">Smoker</span></label>
          </div>
        </div>

        {/* Live Risk Target Preview */}
        <div className={`p-3 rounded-lg border text-xs ${riskInfo.color} ${riskInfo.risk.includes("Very High") ? "bg-destructive/10 border-destructive/30" : riskInfo.risk.includes("High") ? "bg-warning/10 border-warning/30" : riskInfo.risk.includes("Moderate") ? "bg-warning/10 border-warning/30" : "bg-success/10 border-success/30"}`}>
          <span className="font-semibold">{riskInfo.risk}</span>
          <span className="ml-2">→ LDL Target: <strong>{riskInfo.target}</strong></span>
          <span className="ml-2 text-xs">({riskInfo.intensity})</span>
        </div>

        <Button size="sm" onClick={calculate} className="w-full"><Calculator className="h-3.5 w-3.5 mr-1.5" /> Calculate &amp; Recommend</Button>
        {result && <div className="p-4 rounded-xl border border-border/50 bg-card/80 text-sm leading-relaxed shadow-sm animate-in slide-in-from-top-2 fade-in duration-300">{result}</div>}
      </div>
    </SectionCard>
  );
}

/* ─── Obesity Calculator (Easy) ─── */
function ObesityCalc() {
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [result, setResult] = useState<React.ReactNode>(null);

  const GLP_COMORBS = ["Type 2 Diabetes", "Hypertension (BP ≥ 130/80)", "CVD / ASCVD", "CKD (eGFR ≥ 25)", "Heart Failure", "NAFLD / MASLD", "OSA", "Metabolic syndrome"];

  const GLP_HOVER = (
    <span className="group relative inline-block">
      <span className="text-foreground font-medium underline decoration-dotted decoration-primary/40 cursor-help">GLP-1 RA</span>
      <div className="absolute left-0 bottom-full mb-2 w-56 hidden group-hover:block z-50">
        <div className="bg-popover text-popover-foreground text-xs p-3 rounded-lg shadow-xl border border-border">
          <p className="font-semibold text-primary mb-1.5">GLP-1 RA indicated for:</p>
          <ul className="space-y-0.5">
            {GLP_COMORBS.map((c, i) => (
              <li key={i} className="flex items-start gap-1.5"><span className="text-success mt-0.5">•</span><span>{c}</span></li>
            ))}
          </ul>
          <p className="text-xs text-muted-foreground mt-2 italic">Semaglutide 0.25→1.0 mg/wk or Tirzepatide 2.5→15 mg/wk</p>
        </div>
      </div>
    </span>
  );

  const calculate = () => {
    const w = parseFloat(weight);
    const h = parseFloat(height);
    if (!w || !h) { setResult(<span className="text-muted-foreground">Enter weight and height</span>); return; }

    const bmi = w / ((h / 100) * (h / 100));
    let category: string;
    let rec: React.ReactNode;

    if (bmi < 18.5) { category = "Underweight"; rec = "Rule out malnutrition or hyperthyroidism."; }
    else if (bmi < 23) { category = "Normal"; rec = "Maintain healthy lifestyle."; }
    else if (bmi < 25) { category = "Overweight (Indian: At risk)"; rec = "Lifestyle advice. Screen for metabolic syndrome."; }
    else if (bmi < 30) { category = "Obese Class I"; rec = <>Diet (500 kcal deficit) + exercise 150 min/week. Consider {GLP_HOVER} if comorbidities.</>; }
    else if (bmi < 35) { category = "Obese Class II"; rec = <>Pharmacotherapy ({GLP_HOVER}). Consider bariatric referral if BMI ≥ 32.5 with diabetes.</>; }
    else { category = "Obese Class III"; rec = <>Refer for bariatric evaluation. {GLP_HOVER} (Semaglutide 2.4 mg weekly).</>; }

    const lines: React.ReactNode[] = [];
    lines.push(<span>📊 <AbbreviationHover term="BMI">BMI</AbbreviationHover>: {bmi.toFixed(1)} kg/m²</span>);
    lines.push(<span>   Category: {category}</span>);
    lines.push(<span>➡️ {rec}</span>);
    setResult(<div className="space-y-1">{lines}</div>);
  };

  return (
    <SectionCard title="Obesity & Weight" icon={<Scale className="h-4 w-4" />} tone="purple" defaultOpen={false}>
      <div className="max-w-md space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div><Label className="text-xs mb-1.5 block">Weight (kg)</Label><Input type="number" step="0.1" value={weight} onChange={e => setWeight(e.target.value)} placeholder="e.g. 75" className="h-10 px-3 rounded-lg border-border/60 focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all" /></div>
          <div><Label className="text-xs mb-1.5 block">Height (cm)</Label><Input type="number" value={height} onChange={e => setHeight(e.target.value)} placeholder="e.g. 170" className="h-10 px-3 rounded-lg border-border/60 focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all" /></div>
        </div>
        <Button size="sm" onClick={calculate} className="w-full"><Calculator className="h-3.5 w-3.5 mr-1.5" /> Calculate</Button>
        {result && <div className="p-3 bg-muted rounded-lg text-sm whitespace-pre-wrap leading-relaxed">{result}</div>}
      </div>
    </SectionCard>
  );
}

export default function SimpleMode() {
  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-2xl mx-auto">
        <ModeNav />
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Simple Mode</h1>
          <p className="text-sm text-muted-foreground">Quick calculators for all 4 NCDs. Simple inputs, clear outputs.</p>
        </div>
        <div className="space-y-4">
          <DiabetesCalc />
          <HypertensionCalc />
          <LipidsCalc />
          <ObesityCalc />
        </div>
        <p className="text-center text-xs text-muted-foreground mt-6">v1.0 · ADA 2026 · ESC/ESH 2024 · LAI 2023</p>
      </div>

      {/* Bottom nav */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-border/60 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-background/95 py-2.5 px-4 flex items-center justify-center gap-2 z-50">
        <button onClick={() => window.location.href = "/"} className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors">🏠 Homepage</button>
        <span className="text-xs text-muted-foreground/40">|</span>
        <button onClick={() => window.location.href = "/simple"} className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-success/100/15 text-success border border-green-500/30 hover:bg-success/100/25 transition-colors">🟢 Simple</button>
        <button onClick={() => window.location.href = "/moderate"} className="px-3 py-1.5 text-xs font-semibold rounded-lg text-muted-foreground hover:bg-muted transition-colors">🟠 Moderate</button>
        <button onClick={() => window.location.href = "/home"} className="px-3 py-1.5 text-xs font-semibold rounded-lg text-muted-foreground hover:bg-muted transition-colors">🔴 Complex</button>
      </div>
      <div className="h-14" />{/* spacer for fixed bottom nav */}
    </div>
  );
}
