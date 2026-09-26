import { useState, useEffect, useMemo } from "react";
import { loadPatient, getCKDStage } from "@/lib/patient-data";
import { AlertTriangle, Shield, CheckCircle, Info, ChevronDown, ChevronUp } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface RiskFactor {
  id: string;
  label: string;
  description: string;
  points: number;
  active: boolean;
  category: "demographic" | "clinical" | "medication" | "history";
}

interface ManualPatientInputs {
  age: string;
  bmi: string;
  eGFR: string;
  onInsulin: boolean;
  priorHypo: boolean;
  severeHypo: boolean;
}

const INPUT_DRIVEN_FACTORS = new Set([
  "age65",
  "age75",
  "lowBMI",
  "ckd3",
  "ckd4",
  "insulin",
  "priorHypo",
  "severeHypo",
]);

const HypoRiskCalculator = () => {
  const patient = loadPatient();

  const buildInitialFactors = (): RiskFactor[] => [
    // Demographic
    { id: "age65", label: "Age ≥ 65 years", description: "Impaired counter-regulatory response, slower symptom recognition", points: 2, active: false, category: "demographic" },
    { id: "age75", label: "Age ≥ 75 years", description: "Very high risk — cognitive decline, fall risk, polypharmacy", points: 3, active: false, category: "demographic" },
    { id: "lowBMI", label: "BMI < 20 (underweight)", description: "Reduced glycogen stores, less metabolic reserve", points: 1, active: false, category: "demographic" },

    // Clinical
    { id: "ckd3", label: "CKD Stage 3 (eGFR 30–59)", description: "Reduced insulin clearance → prolonged drug action", points: 2, active: false, category: "clinical" },
    { id: "ckd4", label: "CKD Stage 4–5 (eGFR < 30)", description: "Severely reduced insulin clearance — high risk", points: 4, active: false, category: "clinical" },
    { id: "hf", label: "Heart failure (NYHA ≥ II)", description: "Hepatic congestion impairs gluconeogenesis", points: 2, active: false, category: "clinical" },
    { id: "liver", label: "Hepatic impairment", description: "Reduced glycogen storage and gluconeogenesis", points: 3, active: false, category: "clinical" },
    { id: "cognitive", label: "Cognitive impairment / dementia", description: "Inability to recognize or self-treat hypoglycemia", points: 3, active: false, category: "clinical" },
    { id: "neuropathy", label: "Autonomic neuropathy", description: "Impaired counter-regulatory hormone response, hypo unawareness", points: 3, active: false, category: "clinical" },
    { id: "malnutrition", label: "Poor oral intake / malnutrition", description: "Inadequate carbohydrate substrate", points: 2, active: false, category: "clinical" },
    { id: "dysphagia", label: "Dysphagia / swallowing difficulty", description: "Cannot self-treat with oral glucose", points: 2, active: false, category: "clinical" },

    // Medication
    { id: "insulin", label: "On insulin therapy", description: "Dose-dependent hypo risk, especially basal-bolus", points: 3, active: false, category: "medication" },
    { id: "su", label: "On sulfonylurea (SU)", description: "Glimepiride/gliclazide/glipizide — insulin secretagogue", points: 3, active: false, category: "medication" },
    { id: "meglitinide", label: "On meglitinide (repaglinide)", description: "Short-acting secretagogue — meal-time hypo risk", points: 1, active: false, category: "medication" },
    { id: "insulinSU", label: "Insulin + SU combination", description: "Synergistic hypo risk — avoid if possible", points: 2, active: false, category: "medication" },
    { id: "polypharm", label: "≥ 5 medications (polypharmacy)", description: "Drug interactions, adherence issues", points: 1, active: false, category: "medication" },

    // History
    { id: "priorHypo", label: "Prior hypoglycemia episode", description: "Strongest predictor of future hypoglycemia", points: 4, active: false, category: "history" },
    { id: "severeHypo", label: "Prior severe hypo (needed assistance)", description: "Very high recurrence risk — triggers hypo unawareness cycle", points: 5, active: false, category: "history" },
    { id: "unawareness", label: "Hypoglycemia unawareness", description: "Cannot feel symptoms below 54 mg/dL — life-threatening", points: 5, active: false, category: "history" },
    { id: "recentHospital", label: "Recent hospitalization (< 3 months)", description: "Medication changes, deconditioning, altered eating", points: 2, active: false, category: "history" },
    { id: "longDM", label: "Diabetes duration > 10 years", description: "Progressive beta-cell failure, impaired counter-regulation", points: 1, active: false, category: "history" },
  ];

  const [factors, setFactors] = useState<RiskFactor[]>(buildInitialFactors());
  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set(["demographic", "clinical", "medication", "history"]));
  const [manualInputs, setManualInputs] = useState<ManualPatientInputs>(() => {
    const p = loadPatient();
    const hasInsulin = p?.currentMeds?.some(m => /insulin/i.test(m)) ?? false;
    return {
      age: p && p.age > 0 ? String(p.age) : "",
      bmi: p && p.bmi > 0 ? String(p.bmi) : "",
      eGFR: p && p.eGFR > 0 ? String(p.eGFR) : "",
      onInsulin: hasInsulin,
      priorHypo: false,
      severeHypo: false,
    };
  });

  useEffect(() => {
    const age = Number(manualInputs.age);
    const bmi = Number(manualInputs.bmi);
    const eGFR = Number(manualInputs.eGFR);

    const hasAge = manualInputs.age.trim() !== "" && Number.isFinite(age);
    const hasBMI = manualInputs.bmi.trim() !== "" && Number.isFinite(bmi);
    const hasEGFR = manualInputs.eGFR.trim() !== "" && Number.isFinite(eGFR);

    setFactors(prev =>
      prev.map(f => {
        if (f.id === "age65") return { ...f, active: hasAge && age >= 65 };
        if (f.id === "age75") return { ...f, active: hasAge && age >= 75 };
        if (f.id === "lowBMI") return { ...f, active: hasBMI && bmi < 20 };
        if (f.id === "ckd3") return { ...f, active: hasEGFR && eGFR >= 30 && eGFR < 60 };
        if (f.id === "ckd4") return { ...f, active: hasEGFR && eGFR < 30 };
        if (f.id === "insulin") return { ...f, active: manualInputs.onInsulin };
        if (f.id === "priorHypo") return { ...f, active: manualInputs.priorHypo };
        if (f.id === "severeHypo") return { ...f, active: manualInputs.severeHypo };
        return f;
      }),
    );
  }, [manualInputs]);

  const toggleFactor = (id: string) => {
    if (INPUT_DRIVEN_FACTORS.has(id)) return;
    setFactors(prev => prev.map(f => f.id === id ? { ...f, active: !f.active } : f));
  };

  const toggleCat = (cat: string) => {
    setExpandedCats(prev => {
      const next = new Set(prev);
      if (next.has(cat)) {
        next.delete(cat);
      } else {
        next.add(cat);
      }
      return next;
    });
  };

  const result = useMemo(() => {
    const activeFactors = factors.filter(f => f.active);
    const totalScore = activeFactors.reduce((sum, f) => sum + f.points, 0);

    let riskLevel: "low" | "moderate" | "high" | "very-high";
    let recommendation: string;
    let targetHba1c: string;
    let color: string;

    if (totalScore <= 3) {
      riskLevel = "low";
      recommendation = "Standard glycemic targets appropriate. Routine monitoring.";
      targetHba1c = "< 7.0%";
      color = "text-success";
    } else if (totalScore <= 8) {
      riskLevel = "moderate";
      recommendation = "Consider relaxed targets. Avoid SU if possible. Prefer low-hypo-risk agents (GLP-1 RA, SGLT2i, DPP-4i).";
      targetHba1c = "< 7.5%";
      color = "text-warning";
    } else if (totalScore <= 15) {
      riskLevel = "high";
      recommendation = "Relaxed HbA1c target. De-escalate SU/insulin if safe. Ensure hypo kit available. Educate caregiver. Consider CGM.";
      targetHba1c = "< 8.0%";
      color = "text-destructive";
    } else {
      riskLevel = "very-high";
      recommendation = "Avoid hypoglycemia-causing agents. Prioritize safety over tight control. CGM strongly recommended. Caregiver education critical. Consider endocrinology referral.";
      targetHba1c = "< 8.5%";
      color = "text-destructive";
    }

    return { totalScore, riskLevel, recommendation, targetHba1c, color, activeFactors, activeCount: activeFactors.length };
  }, [factors]);

  const categoryLabels: Record<string, { label: string; icon: typeof Shield }> = {
    demographic: { label: "Demographics", icon: Info },
    clinical: { label: "Clinical Conditions", icon: AlertTriangle },
    medication: { label: "Medications", icon: Shield },
    history: { label: "Hypo History", icon: AlertTriangle },
  };

  const grouped = useMemo(() => {
    const cats = ["demographic", "clinical", "medication", "history"];
    return cats.map(cat => ({
      key: cat,
      ...categoryLabels[cat],
      factors: factors.filter(f => f.category === cat),
      activeCount: factors.filter(f => f.category === cat && f.active).length,
      points: factors.filter(f => f.category === cat && f.active).reduce((s, f) => s + f.points, 0),
    }));
  }, [factors]);

  const riskMeter = () => {
    const maxScore = 40;
    const pct = Math.min((result.totalScore / maxScore) * 100, 100);
    return (
      <div className="relative h-4 rounded-full overflow-hidden bg-muted">
        <div
          className="absolute inset-y-0 left-0 rounded-full transition-all duration-500"
          style={{
            width: `${pct}%`,
            background: result.totalScore <= 3
              ? "hsl(var(--success))"
              : result.totalScore <= 8
              ? "hsl(var(--warning))"
              : "hsl(var(--destructive))",
          }}
        />
      </div>
    );
  };

  function handleSmartParse(values: Record<string, string>) {
    Object.entries(values).forEach(([key, value]) => {
      setManualInputs(prev => ({ ...prev, [key]: value }));
    });
  }

  return (
    <div className="space-y-5 animate-slide-in">
      <div>
        <h1 className="text-xl font-heading font-bold">Hypoglycemia Risk Score</h1>
        <p className="text-sm text-muted-foreground">Multi-factor risk assessment — ADA 2026 + clinical evidence</p>
      </div>

      {/* Patient context */}
      {patient && patient.name && (
        <div className="clinical-card p-3 bg-muted/30">
          <p className="text-sm">
            <strong>{patient.name}</strong> · {patient.age}y · eGFR {patient.eGFR} ({getCKDStage(patient.eGFR)}) · HbA1c {patient.hba1c}%
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Enter demographics below to drive score calculation for age, BMI, CKD, insulin use, and prior hypoglycemia.
          </p>
        </div>
      )}

      {/* Manual patient factor inputs */}
      <div className="clinical-card">
        <h3 className="section-title mb-3">Manual Patient Inputs</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="hypo-age" className="text-xs text-muted-foreground">Age (years)</Label>
            <Input
              id="hypo-age"
              type="number"
              min={0}
              value={manualInputs.age}
              onChange={(e) => setManualInputs(prev => ({ ...prev, age: e.target.value }))}
              placeholder="e.g., 68"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="hypo-bmi" className="text-xs text-muted-foreground">BMI</Label>
            <Input
              id="hypo-bmi"
              type="number"
              min={0}
              step="0.1"
              value={manualInputs.bmi}
              onChange={(e) => setManualInputs(prev => ({ ...prev, bmi: e.target.value }))}
              placeholder="e.g., 19.4"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="hypo-egfr" className="text-xs text-muted-foreground">eGFR (mL/min/1.73m²)</Label>
            <Input
              id="hypo-egfr"
              type="number"
              min={0}
              value={manualInputs.eGFR}
              onChange={(e) => setManualInputs(prev => ({ ...prev, eGFR: e.target.value }))}
              placeholder="e.g., 42"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
          <label className="flex items-center justify-between p-2.5 rounded-lg border border-border bg-muted/20">
            <span className="text-sm">On insulin therapy</span>
            <Switch
              checked={manualInputs.onInsulin}
              onCheckedChange={(checked) => setManualInputs(prev => ({ ...prev, onInsulin: checked }))}
            />
          </label>
          <label className="flex items-center justify-between p-2.5 rounded-lg border border-border bg-muted/20">
            <span className="text-sm">Prior hypoglycemia</span>
            <Switch
              checked={manualInputs.priorHypo}
              onCheckedChange={(checked) => setManualInputs(prev => ({ ...prev, priorHypo: checked }))}
            />
          </label>
          <label className="flex items-center justify-between p-2.5 rounded-lg border border-border bg-muted/20">
            <span className="text-sm">Prior severe hypo</span>
            <Switch
              checked={manualInputs.severeHypo}
              onCheckedChange={(checked) => setManualInputs(prev => ({ ...prev, severeHypo: checked }))}
            />
          </label>
        </div>

        <p className="text-xs text-muted-foreground mt-2">
          These entries auto-update matching risk factors; remaining factors can be toggled manually.
        </p>
      </div>

      {/* Score result card */}
      <div className={`clinical-card border-l-4 ${
        result.riskLevel === "low" ? "border-l-success" :
        result.riskLevel === "moderate" ? "border-l-warning" : "border-l-destructive"
      }`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {result.riskLevel === "low" ? (
              <CheckCircle className="w-5 h-5 text-success" />
            ) : (
              <AlertTriangle className={`w-5 h-5 ${result.color}`} />
            )}
            <div>
              <h3 className="font-heading font-bold text-lg capitalize">{result.riskLevel.replace("-", " ")} Risk</h3>
              <p className="text-xs text-muted-foreground">{result.activeCount} active risk factors</p>
            </div>
          </div>
          <div className="text-right">
            <span className={`text-3xl font-heading font-bold ${result.color}`}>{result.totalScore}</span>
            <span className="text-xs text-muted-foreground block">points</span>
          </div>
        </div>

        {riskMeter()}
        <div className="flex justify-between text-xs text-muted-foreground mt-1">
          <span>Low (0–3)</span>
          <span>Moderate (4–8)</span>
          <span>High (9–15)</span>
          <span>Very High (16+)</span>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="p-2.5 rounded-lg bg-muted/50 text-center">
            <span className="text-xs text-muted-foreground block">Recommended HbA1c</span>
            <span className={`text-lg font-heading font-bold ${result.color}`}>{result.targetHba1c}</span>
          </div>
          <div className="p-2.5 rounded-lg bg-muted/50 text-center">
            <span className="text-xs text-muted-foreground block">Category Scores</span>
            <div className="flex justify-center gap-2 mt-1">
              {grouped.map(g => (
                <span key={g.key} className={`text-xs ${g.points > 0 ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                  {g.label.slice(0, 3)}: {g.points}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className={`mt-3 p-3 rounded-lg text-sm ${
          result.riskLevel === "low" ? "bg-success/10" :
          result.riskLevel === "moderate" ? "bg-warning/10" : "bg-destructive/10"
        }`}>
          <p>{result.recommendation}</p>
        </div>
      </div>

      {/* Risk factor categories */}
      {grouped.map(group => (
        <div key={group.key} className="clinical-card">
          <button onClick={() => toggleCat(group.key)} className="w-full flex items-center justify-between">
            <div className="flex items-center gap-2">
              <group.icon className={`w-4 h-4 ${group.points > 0 ? "text-warning" : "text-muted-foreground"}`} />
              <h3 className="section-title">{group.label}</h3>
              {group.activeCount > 0 && (
                <span className="text-xs bg-warning/10 text-warning px-2 py-0.5 rounded-full">
                  {group.activeCount} active · {group.points} pts
                </span>
              )}
            </div>
            {expandedCats.has(group.key) ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
          </button>

          {expandedCats.has(group.key) && (
            <div className="mt-3 space-y-2">
              {group.factors.map(factor => {
                const isInputDriven = INPUT_DRIVEN_FACTORS.has(factor.id);

                return (
                <label key={factor.id} className={`flex items-start gap-3 p-2.5 rounded-lg transition-colors ${
                  factor.active ? "bg-warning/5 border border-warning/20" : "hover:bg-muted/30"
                } ${isInputDriven ? "cursor-not-allowed" : "cursor-pointer"}`}>
                  <Switch
                    checked={factor.active}
                    onCheckedChange={() => toggleFactor(factor.id)}
                    disabled={isInputDriven}
                    className="mt-0.5 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{factor.label}</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                        factor.points >= 4 ? "bg-destructive/10 text-destructive" :
                        factor.points >= 2 ? "bg-warning/10 text-warning" :
                        "bg-muted text-muted-foreground"
                      }`}>
                        +{factor.points}
                      </span>
                      {isInputDriven && (
                        <span className="text-xs px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">
                          from input
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{factor.description}</p>
                  </div>
                </label>
              )})}
            </div>
          )}
        </div>
      ))}

      {/* Clinical actions */}
      <div className="clinical-card">
        <h3 className="section-title mb-3">Clinical Actions by Risk Level</h3>
        <div className="space-y-3">
          {[
            { level: "Low (0–3)", color: "border-l-success", actions: ["Standard HbA1c < 7.0%", "Routine glucose monitoring", "Standard medication regimen"] },
            { level: "Moderate (4–8)", color: "border-l-warning", actions: ["Consider HbA1c < 7.5%", "Prefer DPP-4i/GLP-1 RA/SGLT2i over SU", "Pre-meal BG checks if on insulin", "Hypo education for patient"] },
            { level: "High (9–15)", color: "border-l-destructive", actions: ["Relax HbA1c to < 8.0%", "De-escalate or stop SU", "Reduce insulin dose", "Hypo kit + caregiver education", "Consider CGM", "Bedtime snack if on basal insulin"] },
            { level: "Very High (16+)", color: "border-l-destructive", actions: ["Relax HbA1c to < 8.5%", "Avoid SU entirely", "Minimize insulin if possible", "CGM strongly recommended", "Endocrinology referral", "Structured hypo avoidance program"] },
          ].map(tier => (
            <div key={tier.level} className={`border-l-4 ${tier.color} pl-3`}>
              <h4 className="text-sm font-medium mb-1">{tier.level}</h4>
              <ul className="text-xs text-muted-foreground space-y-0.5">
                {tier.actions.map((a, i) => <li key={i}>• {a}</li>)}
              </ul>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-3 italic">
          Based on ADA Standards of Care 2026 §6.6 · Seaquist ER et al. Diabetes Care · NICE NG17 Hypo Guidelines
        </p>
      </div>
    </div>
  );
};

export default HypoRiskCalculator;
