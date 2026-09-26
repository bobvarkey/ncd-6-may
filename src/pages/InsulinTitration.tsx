import { useState, useMemo } from "react";
import { loadPatient } from "@/lib/patient-data";
import { Syringe, Plus, Trash2, TrendingDown, AlertTriangle, CheckCircle, Info, UserX, ChevronDown, ChevronUp, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface BGReading {
  day: number;
  fasting: number;
}

type Protocol = "simple" | "treat-to-target" | "conservative";

const PROTOCOLS: Record<Protocol, { label: string; description: string; target: [number, number]; rules: { range: [number, number]; adjustment: number; label: string }[] }> = {
  "simple": {
    label: "ADA Simple (±2U q3d)",
    description: "Increase by 2 units every 3 days if FBG >130 mg/dL. Decrease by 2 units if FBG <70.",
    target: [80, 130],
    rules: [
      { range: [0, 54], adjustment: -4, label: "Severe hypo — reduce 4U + contact MD" },
      { range: [54, 70], adjustment: -2, label: "Hypoglycemia — reduce 2U" },
      { range: [70, 80], adjustment: -1, label: "Near-low — reduce 1U" },
      { range: [80, 130], adjustment: 0, label: "At target — no change" },
      { range: [130, 180], adjustment: 2, label: "Above target — increase 2U" },
      { range: [180, 9999], adjustment: 2, label: "High — increase 2U" },
    ],
  },
  "treat-to-target": {
    label: "Treat-to-Target (Riddle)",
    description: "Based on INSIGHT/AT.LANTUS trials. Titrate based on 3-day FBG average. Target FBG 70-130.",
    target: [70, 130],
    rules: [
      { range: [0, 56], adjustment: -4, label: "Severe hypo — reduce 4U immediately" },
      { range: [56, 70], adjustment: -2, label: "Hypoglycemia — reduce 2U" },
      { range: [70, 130], adjustment: 0, label: "At target — maintain dose" },
      { range: [130, 160], adjustment: 2, label: "Mildly elevated — increase 2U" },
      { range: [160, 200], adjustment: 4, label: "Elevated — increase 4U" },
      { range: [200, 9999], adjustment: 6, label: "Very high — increase 6U (consider review)" },
    ],
  },
  "conservative": {
    label: "Conservative (Elderly/CKD)",
    description: "For patients >65y, eGFR <30, or hypo-prone. Relaxed target FBG 100-150. Slower titration.",
    target: [100, 150],
    rules: [
      { range: [0, 70], adjustment: -4, label: "Hypoglycemia — reduce 4U + alert MD" },
      { range: [70, 100], adjustment: -2, label: "Below target — reduce 2U" },
      { range: [100, 150], adjustment: 0, label: "At target — maintain dose" },
      { range: [150, 200], adjustment: 2, label: "Above target — increase 2U" },
      { range: [200, 9999], adjustment: 2, label: "High — increase 2U (max)" },
    ],
  },
};

const InsulinTitration = () => {
  const navigate = useNavigate();
  const patient = loadPatient();
  const hasPatient = patient && patient.name && patient.age > 0;
  const [currentDose, setCurrentDose] = useState(10);
  const [insulinType, setInsulinType] = useState("Glargine (Lantus/Basaglar)");
  const [showInsulins, setShowInsulins] = useState(false);
  const [protocol, setProtocol] = useState<Protocol>(
    patient && (patient.age > 65 || patient.eGFR < 30) ? "conservative" : "treat-to-target"
  );
  const [readings, setReadings] = useState<BGReading[]>([
    { day: 1, fasting: 0 },
    { day: 2, fasting: 0 },
    { day: 3, fasting: 0 },
  ]);

  const updateReading = (index: number, value: number) => {
    setReadings(prev => prev.map((r, i) => i === index ? { ...r, fasting: value } : r));
  };

  const addDay = () => {
    setReadings(prev => [...prev, { day: prev.length + 1, fasting: 0 }]);
  };

  const removeDay = (index: number) => {
    if (readings.length <= 3) return;
    setReadings(prev => prev.filter((_, i) => i !== index).map((r, i) => ({ ...r, day: i + 1 })));
  };

  const result = useMemo(() => {
    const validReadings = readings.filter(r => r.fasting > 0);
    if (validReadings.length < 3) return null;

    const last3 = validReadings.slice(-3);
    const avg = Math.round(last3.reduce((sum, r) => sum + r.fasting, 0) / 3);
    const min = Math.min(...last3.map(r => r.fasting));
    const max = Math.max(...last3.map(r => r.fasting));

    const proto = PROTOCOLS[protocol];
    const matchedRule = proto.rules.find(r => avg >= r.range[0] && avg < r.range[1]);
    const adjustment = matchedRule?.adjustment ?? 0;
    const newDose = Math.max(0, currentDose + adjustment);

    // Check for any hypo episode in the 3 days
    const hasHypo = last3.some(r => r.fasting < 70);
    const hasSevereHypo = last3.some(r => r.fasting < 54);

    const atTarget = avg >= proto.target[0] && avg <= proto.target[1];

    return {
      avg,
      min,
      max,
      adjustment,
      newDose,
      rule: matchedRule?.label ?? "",
      hasHypo,
      hasSevereHypo,
      atTarget,
      target: proto.target,
    };
  }, [readings, currentDose, protocol]);

  const proto = PROTOCOLS[protocol];

  const bgColor = (val: number) => {
    if (val <= 0) return "";
    if (val < 70) return "text-warning font-bold";
    if (val <= proto.target[1]) return "text-success font-medium";
    return "text-destructive font-medium";
  };

  if (!hasPatient) {
    return (
      <div className="space-y-5 animate-slide-in">
        <h1 className="text-xl font-heading font-bold">Insulin Titration Calculator</h1>
        <div className="clinical-card flex flex-col items-center justify-center py-12 text-center">
          <UserX className="w-12 h-12 text-muted-foreground mb-4" />
          <h2 className="text-lg font-heading font-semibold mb-2">No Patient Data</h2>
          <p className="text-sm text-muted-foreground mb-4 max-w-md">
            Please enter patient demographics first. Insulin titration protocol selection depends on age, eGFR, and other patient factors.
          </p>
          <Button onClick={() => navigate("/patient")}>
            Enter Patient Data
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-slide-in">
      <div>
        <h1 className="text-xl font-heading font-bold">Insulin Titration Calculator</h1>
        <p className="text-sm text-muted-foreground">ADA basal insulin dose adjustment based on fasting BG</p>
      </div>

      {/* Patient context */}
      {patient && (
        <div className="clinical-card p-3 bg-muted/30">
          <p className="text-sm"><strong>{patient.name}</strong> · {patient.age}y · eGFR {patient.eGFR} · HbA1c {patient.hba1c}%</p>
          {(patient.age > 65 || patient.eGFR < 30) && (
            <p className="text-xs text-warning mt-1">⚠ Conservative protocol auto-selected (age &gt;65 or eGFR &lt;30)</p>
          )}
        </div>
      )}

      {/* Setup */}
      <div className="clinical-card">
        <h3 className="section-title mb-3">Insulin Setup</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <Label className="text-xs text-muted-foreground">Insulin Type</Label>
            <Select value={insulinType} onValueChange={setInsulinType}>
              <SelectTrigger className="h-10 px-3 rounded-lg border-border/60 focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Glargine (Lantus/Basaglar)">Glargine (Lantus/Basaglar)</SelectItem>
                <SelectItem value="Degludec (Tresiba)">Degludec (Tresiba)</SelectItem>
                <SelectItem value="Detemir (Levemir)">Detemir (Levemir)</SelectItem>
                <SelectItem value="NPH (Humulin N)">NPH (Humulin N)</SelectItem>
                <SelectItem value="Meal Bolus">Meal Bolus</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {insulinType === "Meal Bolus" && (
            <div>
              <Label className="text-xs text-muted-foreground">Bolus Insulin Name</Label>
              <div className="flex gap-2 mt-1">
                {["Aspart (NovoLog)", "Lispro (Humalog)", "Glulisine (Apidra)", "Regular (Humulin R)"].map((name) => (
                  <label key={name} className="flex items-center gap-1.5 text-xs cursor-pointer">
                    <input type="radio" name="bolusName" defaultChecked={name === "Aspart (NovoLog)"} className="accent-primary" />
                    {name}
                  </label>
                ))}
              </div>
            </div>
          )}
          <div>
            <Label className="text-xs text-muted-foreground">Current Dose (units)</Label>
            <Input
              type="number"
              value={currentDose || ""}
              onChange={e => setCurrentDose(e.target.value === "" ? 0 : parseInt(e.target.value))}
              className="h-10 px-3 rounded-lg border-border/60 focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
              min={0}
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Titration Protocol</Label>
            <Select value={protocol} onValueChange={v => setProtocol(v as Protocol)}>
              <SelectTrigger className="h-10 px-3 rounded-lg border-border/60 focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(PROTOCOLS).map(([key, p]) => (
                  <SelectItem key={key} value={key}>{p.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="mt-3 p-2.5 rounded-lg bg-accent/50 text-xs text-accent-foreground flex items-start gap-2">
          <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          <span>{proto.description} Target FBG: {proto.target[0]}–{proto.target[1]} mg/dL.</span>
        </div>
      </div>

      {/* Fasting BG Entries */}
      <div className="clinical-card">
        <div className="flex items-center justify-between mb-3">
          <h3 className="section-title">Fasting BG Readings</h3>
          <Button variant="outline" size="sm" onClick={addDay}>
            <Plus className="w-3.5 h-3.5 mr-1" /> Add Day
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mb-3">Enter at least 3 consecutive fasting blood glucose readings (mg/dL)</p>

        <div className="space-y-2">
          {readings.map((r, i) => (
            <div key={i} className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground w-12 shrink-0">Day {r.day}</span>
              <Input
                type="number"
                value={r.fasting || ""}
                onChange={e => updateReading(i, e.target.value === "" ? 0 : parseInt(e.target.value))}
                placeholder="FBG mg/dL"
                className={`h-9 flex-1 ${bgColor(r.fasting)}`}
                min={0}
              />
              <span className={`text-xs w-16 ${bgColor(r.fasting)}`}>
                {r.fasting > 0 ? (r.fasting < 70 ? "⚠ Low" : r.fasting <= proto.target[1] ? "✓ OK" : "↑ High") : ""}
              </span>
              {readings.length > 3 && (
                <button onClick={() => removeDay(i)} className="text-muted-foreground hover:text-destructive">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Mini bar chart */}
        {readings.some(r => r.fasting > 0) && (
          <div className="mt-4 flex items-end gap-1.5 h-16">
            {readings.map((r, i) => {
              if (r.fasting <= 0) return <div key={i} className="flex-1" />;
              const maxBG = Math.max(...readings.map(x => x.fasting), 200);
              const height = (r.fasting / maxBG) * 100;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                  <span className="text-[9px] text-muted-foreground">{r.fasting}</span>
                  <div
                    className={`w-full rounded-t-sm ${r.fasting < 70 ? "bg-warning/70" : r.fasting <= proto.target[1] ? "bg-success/70" : "bg-destructive/70"}`}
                    style={{ height: `${height}%` }}
                  />
                </div>
              );
            })}
            {/* Target zone indicator */}
            <div className="absolute left-0 right-0 pointer-events-none" />
          </div>
        )}
      </div>

      {/* Result */}
      {result && (
        <div className={`clinical-card border-l-4 ${result.atTarget ? "border-l-success" : result.hasHypo ? "border-l-warning" : "border-l-primary"}`}>
          <div className="flex items-center gap-2 mb-3">
            <Syringe className="w-4 h-4 text-primary" />
            <h3 className="section-title">Titration Recommendation</h3>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            <div className="text-center p-2.5 rounded-lg bg-muted/50">
              <span className="text-xs text-muted-foreground block">3-Day Avg FBG</span>
              <span className={`text-lg font-heading font-bold ${result.avg < 70 ? "text-warning" : result.atTarget ? "text-success" : "text-destructive"}`}>
                {result.avg}
              </span>
              <span className="text-xs text-muted-foreground block">mg/dL</span>
            </div>
            <div className="text-center p-2.5 rounded-lg bg-muted/50">
              <span className="text-xs text-muted-foreground block">Current Dose</span>
              <span className="text-lg font-heading font-bold">{currentDose}</span>
              <span className="text-xs text-muted-foreground block">units</span>
            </div>
            <div className="text-center p-2.5 rounded-lg bg-muted/50">
              <span className="text-xs text-muted-foreground block">New Dose</span>
              <span className={`text-lg font-heading font-bold ${result.adjustment > 0 ? "text-primary" : result.adjustment < 0 ? "text-warning" : "text-success"}`}>
                {result.newDose}
              </span>
              <span className="text-xs text-muted-foreground block">units</span>
            </div>
          </div>

          {/* Adjustment */}
          <div className={`p-3 rounded-lg ${result.atTarget ? "bg-success/10" : result.adjustment < 0 ? "bg-warning/10" : "bg-primary/10"}`}>
            <div className="flex items-center gap-2 mb-1">
              {result.atTarget ? (
                <CheckCircle className="w-4 h-4 text-success" />
              ) : result.adjustment < 0 ? (
                <AlertTriangle className="w-4 h-4 text-warning" />
              ) : (
                <TrendingDown className="w-4 h-4 text-primary" />
              )}
              <span className="text-sm font-medium">
                {result.adjustment === 0
                  ? "No dose change — at target"
                  : result.adjustment > 0
                  ? `↑ Increase by ${result.adjustment} units → ${result.newDose}U`
                  : `↓ Decrease by ${Math.abs(result.adjustment)} units → ${result.newDose}U`}
              </span>
            </div>
            <p className="text-xs text-muted-foreground ml-6">{result.rule}</p>
          </div>

          {/* Warnings */}
          {result.hasSevereHypo && (
            <div className="mt-3 p-3 rounded-lg bg-destructive/10 text-sm text-destructive flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
              <div>
                <strong>SEVERE HYPOGLYCEMIA detected (&lt;54 mg/dL)</strong>
                <p className="text-xs mt-1">Reduce dose immediately. Assess for hypo unawareness. Contact physician. Review concurrent SU/meglitinide.</p>
              </div>
            </div>
          )}
          {result.hasHypo && !result.hasSevereHypo && (
            <div className="mt-3 p-3 rounded-lg bg-warning/10 text-sm text-warning flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>Hypoglycemia episode detected. Ensure patient has fast-acting carbs available. Review timing of injection.</span>
            </div>
          )}

          {/* Prescription line */}
          <div className="mt-4 p-3 rounded-lg bg-muted/50 border border-border">
            <p className="text-xs text-muted-foreground mb-1">Prescription</p>
            <p className="text-sm font-medium">
              Insulin {insulinType} — <strong>{result.newDose} units</strong> subcutaneous {insulinType.includes("NPH") ? "at bedtime" : "once daily at the same time"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Re-check fasting BG in 3 days. Repeat titration until target {proto.target[0]}–{proto.target[1]} mg/dL achieved.
            </p>
          </div>
        </div>
      )}

      {/* Quick Reference: Insulin Brands */}
      <div className="clinical-card">
        <button
          onClick={() => setShowInsulins(!showInsulins)}
          className="w-full flex items-center justify-between text-left"
        >
          <span className="text-sm font-medium flex items-center gap-2">
            <ChevronRight className={`w-4 h-4 transition-transform ${showInsulins ? "rotate-90" : ""}`} />
            Insulin Brands (US & India)
          </span>
          {showInsulins ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {showInsulins && (
          <div className="mt-3 space-y-3 text-xs">
            {/* Basal Insulins */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="p-2 rounded bg-muted/30">
                <p className="font-semibold text-xs uppercase text-muted-foreground mb-1">Long-Acting (Basal)</p>
                <table className="w-full">
                  <tbody>
                    <tr className="border-b border-border/30"><td className="py-1">Glargine</td><td className="text-right">Lantus®, Abasaglar®, Semglee®</td></tr>
                    <tr className="border-b border-border/30"><td className="py-1">Degludec</td><td className="text-right">Tresiba®</td></tr>
                    <tr className="border-b border-border/30"><td className="py-1">Detemir</td><td className="text-right">Levemir®</td></tr>
                    <tr><td className="py-1">NPH</td><td className="text-right">Humulin I®, Insulatard®</td></tr>
                  </tbody>
                </table>
              </div>
              <div className="p-2 rounded bg-muted/30">
                <p className="font-semibold text-xs uppercase text-muted-foreground mb-1">Rapid-Acting (Bolus)</p>
                <table className="w-full">
                  <tbody>
                    <tr className="border-b border-border/30"><td className="py-1">Aspart</td><td className="text-right">NovoRapid®, Fiasp®, Trurapi®</td></tr>
                    <tr className="border-b border-border/30"><td className="py-1">Lispro</td><td className="text-right">Humalog®, Lyumjev®</td></tr>
                    <tr className="border-b border-border/30"><td className="py-1">Glulisine</td><td className="text-right">Apidra®</td></tr>
                    <tr><td className="py-1">Regular</td><td className="text-right">Actrapid®, Humulin S®</td></tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Onset/Duration */}
            <div className="p-2 rounded bg-muted/30">
              <p className="font-semibold text-xs uppercase text-muted-foreground mb-1">Onset & Duration</p>
              <table className="w-full">
                <tbody>
                  <tr className="border-b border-border/30"><td className="py-1">Ultra-Rapid (Bolus)</td><td className="text-right">Onset 4 min · 3-5h</td></tr>
                  <tr className="border-b border-border/30"><td className="py-1">Rapid (Bolus)</td><td className="text-right">Onset 10-20 min · 3-5h</td></tr>
                  <tr className="border-b border-border/30"><td className="py-1">Short (Bolus)</td><td className="text-right">Onset 30 min · 6-8h</td></tr>
                  <tr className="border-b border-border/30"><td className="py-1">NPH (Intermediate)</td><td className="text-right">Onset 1-2h · 12-18h</td></tr>
                  <tr className="border-b border-border/30"><td className="py-1">Long Acting</td><td className="text-right">Onset 1-2h · 24h</td></tr>
                  <tr><td className="py-1">Ultra-Long</td><td className="text-right">Onset 1-2h · 42h</td></tr>
                </tbody>
              </table>
            </div>

            {/* Prescribing Safety */}
            <div className="p-2 rounded bg-warning/100/10 border border-amber-500/30">
              <p className="font-semibold text-xs uppercase text-warning mb-1">Prescribing Safety</p>
              <ul className="space-y-0.5 text-xs">
                <li>• Always prescribe by <strong>brand name</strong> (not generic)</li>
                <li>• Write <strong>"units"</strong> in full — never abbreviate</li>
                <li>• NPH: Resuspend before use (cloudy)</li>
                <li>• Basal: OD/BD · Bolus: Pre-meal (0-15 min)</li>
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Protocol reference */}
      <div className="clinical-card">
        <h3 className="section-title mb-2">Titration Rules — {proto.label}</h3>
        <div className="space-y-1.5">
          {proto.rules.map((rule, i) => (
            <div key={i} className="flex items-center gap-2 text-xs">
              <span className={`w-28 shrink-0 text-right ${
                rule.adjustment < 0 ? "text-warning" : rule.adjustment === 0 ? "text-success" : "text-primary"
              }`}>
                {rule.range[0]}–{rule.range[1] >= 9999 ? "∞" : rule.range[1]} mg/dL
              </span>
              <span className="text-muted-foreground">→</span>
              <span className={`font-medium ${
                rule.adjustment < 0 ? "text-warning" : rule.adjustment === 0 ? "text-success" : "text-primary"
              }`}>
                {rule.adjustment > 0 ? `+${rule.adjustment}U` : rule.adjustment < 0 ? `${rule.adjustment}U` : "No change"}
              </span>
              <span className="text-muted-foreground">{rule.label}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-3 italic">
          ADA Standards of Care 2026 §9.5 · Riddle MC et al. Treat-to-Target · INSIGHT/AT.LANTUS protocols
        </p>
      </div>
    </div>
  );
};

export default InsulinTitration;
