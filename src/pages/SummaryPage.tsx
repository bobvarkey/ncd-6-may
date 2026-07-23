import { FrequencyBadge } from "@/components/FrequencyBadge";
import { useState, useEffect, useMemo } from "react";
import { PatientData, EXAMPLE_PATIENT, loadPatient, getBMICategory, getCKDStage } from "@/lib/patient-data";
import { generateMedRecommendations, getHypoProtocol, getLipidTargets, getCategoryLabel, getDrugClassLabel, AlgorithmPriority } from "@/lib/med-logic";
import { generate7DayPlan, DayPlan } from "@/lib/diet-generator";
import { Pill, AlertTriangle, Heart, Shield, ChevronDown, ChevronUp, User, UtensilsCrossed } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const categoryColor: Record<AlgorithmPriority, string> = {
  "cvkd-risk": "border-l-destructive",
  "weight-management": "border-l-warning",
  "glycemic-control": "border-l-primary",
  "lipid": "border-l-info",
  "current-med-review": "border-l-muted-foreground",
};

const priorityBadge = (p: string) => {
  const s: Record<string, string> = {
    "first-line": "bg-primary/10 text-primary",
    "adjustment": "bg-warning/10 text-warning",
    "add-on": "bg-info/10 text-info",
    "intensification": "bg-destructive/10 text-destructive",
    "de-escalate": "bg-muted text-muted-foreground",
  };
  return s[p] || "bg-muted text-muted-foreground";
};

const SummaryPage = () => {
  const [patient, setPatient] = useState<PatientData>(EXAMPLE_PATIENT);
  const [expandedMeds, setExpandedMeds] = useState<Set<number>>(new Set());
  const [expandedDay, setExpandedDay] = useState(0);

  useEffect(() => {
    const saved = loadPatient();
    if (saved) setPatient(saved);
  }, []);

  const meds = useMemo(() => generateMedRecommendations(patient), [patient]);
  const hypo = getHypoProtocol(patient);
  const lipids = getLipidTargets(patient);
  const [dietPlan, setDietPlan] = useState<DayPlan[]>([]);

  useEffect(() => {
    setDietPlan(generate7DayPlan(patient));
  }, [patient]);

  const bmiCat = getBMICategory(patient.bmi);

  // Group meds by category
  const grouped = useMemo(() => {
    const catOrder: AlgorithmPriority[] = ["cvkd-risk", "weight-management", "glycemic-control", "lipid", "current-med-review"];
    return catOrder
      .map(cat => ({ category: cat, label: getCategoryLabel(cat), meds: meds.filter(m => m.category === cat) }))
      .filter(g => g.meds.length > 0);
  }, [meds]);

  const comorbidities = [
    patient.hasASCVD && "ASCVD",
    patient.hasPostStroke && "Post-Stroke",
    patient.hasCKD && `CKD (${getCKDStage(patient.eGFR)})`,
    patient.hfNYHA > 0 && `HF NYHA ${patient.hfNYHA}`,
    patient.hasHypertension && "Hypertension",
    patient.hasObesity && "Obesity",
    patient.hasRetinopathy && "Retinopathy",
    patient.hasNeuropathy && "Neuropathy",
    patient.hasPAD && "PAD",
    patient.postStrokeDysphagia && `Dysphagia (${patient.dysphagiaLevel})`,
    patient.hasNAFLD && "NAFLD",
    patient.hasOSA && "OSA",
  ].filter(Boolean);

  let medIdx = 0;

  return (
    <div className="space-y-5 animate-slide-in">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-xl font-heading font-bold">Complete Prescription Summary</h1>
          <p className="text-sm text-muted-foreground">ADA 2026 · LAI Lipid · Kerala Diet</p>
        </div>
        <Link to="/patient">
          <Button variant="outline" size="sm">Edit Patient</Button>
        </Link>
      </div>

      {/* ═══════ PATIENT CARD ═══════ */}
      <div className="rounded-xl p-5 text-primary-foreground" style={{ background: "var(--gradient-hero)" }}>
        <div className="flex items-start gap-3 mb-3">
          <User className="w-5 h-5 opacity-70 mt-0.5" />
          <div>
            <h2 className="text-lg font-heading font-bold">{patient.name || "Unnamed Patient"}</h2>
            <p className="text-sm opacity-90">{patient.age}y · {patient.gender === "F" ? "Female" : "Male"} · {patient.hasT2DM ? "Type 2 DM" : "Non-DM"}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <div className="bg-primary-foreground/10 rounded-lg p-2">
            <span className="text-xs opacity-70 block">BMI</span>
            <strong>{patient.bmi || "—"}</strong> <span className="text-xs opacity-80">{bmiCat.label}</span>
          </div>
          <div className="bg-primary-foreground/10 rounded-lg p-2">
            <span className="text-xs opacity-70 block">eGFR</span>
            <strong>{patient.eGFR || "—"}</strong> <span className="text-xs opacity-80">mL/min</span>
          </div>
          <div className="bg-primary-foreground/10 rounded-lg p-2">
            <span className="text-xs opacity-70 block">HbA1c</span>
            <strong>{patient.hba1c || "—"}%</strong>
          </div>
          <div className="bg-primary-foreground/10 rounded-lg p-2">
            <span className="text-xs opacity-70 block">RBS / FBS</span>
            <strong>{patient.rbs || "—"}</strong> / <strong>{patient.fbs || "—"}</strong>
          </div>
        </div>
        {comorbidities.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {comorbidities.map((c, i) => (
              <span key={i} className="text-xs bg-primary-foreground/20 rounded-full px-2 py-0.5">{c}</span>
            ))}
          </div>
        )}
        {patient.currentMeds.length > 0 && (
          <div className="mt-2">
            <span className="text-xs opacity-70 block mb-1">Current Medications:</span>
            <div className="flex flex-wrap gap-1.5">
              {patient.currentMeds.map((m, i) => (
                <span key={i} className="text-xs bg-primary-foreground/15 rounded-full px-2 py-0.5">{m}</span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ═══════ SECTION A: MEDICATION PRESCRIPTION ═══════ */}
      <div className="flex items-center gap-2 pt-2">
        <Pill className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-heading font-bold">A. Medication Prescription</h2>
        <span className="text-xs text-muted-foreground ml-auto">{meds.length} medications</span>
      </div>

      {grouped.map(group => (
        <div key={group.category} className="space-y-2">
          <h3 className="text-xs font-medium text-muted-foreground px-1">{group.label}</h3>
          {group.meds.map(med => {
            const idx = medIdx++;
            const isOpen = expandedMeds.has(idx);
            return (
              <div key={idx} className={`clinical-card border-l-4 p-3 ${categoryColor[group.category]}`}>
                <button onClick={() => setExpandedMeds(prev => {
                  const n = new Set(prev); if (n.has(idx)) { n.delete(idx); } else { n.add(idx); } return n;
                })} className="w-full text-left">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{med.drug}</span>
                        <span className={`text-xs px-1.5 py-0.5 rounded-full ${priorityBadge(med.priority)}`}>{med.priority}</span>
                      </div>
                      <p className="text-xs text-muted-foreground flex items-center gap-1.5 flex-wrap">{getDrugClassLabel(med.drugClass)} · <strong>{med.dose}</strong> {med.frequency} <FrequencyBadge frequency={med.frequency} /></p>
                    </div>
                    {isOpen ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground shrink-0" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground shrink-0" />}
                  </div>
                </button>
                {isOpen && (
                  <div className="mt-2 pt-2 border-t space-y-2 animate-slide-in">
                    <p className="text-xs text-muted-foreground">{med.reason}</p>
                    <div className="flex gap-3 text-xs">
                      <span>HbA1c ↓{med.hba1cReduction}</span>
                      <span className={med.weightEffect === "loss" ? "text-success" : med.weightEffect === "gain" ? "text-destructive" : ""}>
                        Wt: {med.weightEffect === "loss" ? "↓ Loss" : med.weightEffect === "gain" ? "↑ Gain" : "→ Neutral"}
                      </span>
                      <span className={med.cvBenefit ? "text-success" : ""}>CV: {med.cvBenefit ? "✓" : "—"}</span>
                    </div>
                    {med.warnings.length > 0 && med.warnings.map((w, wi) => (
                      <div key={wi} className="flex items-start gap-1 text-xs">
                        <AlertTriangle className="w-3 h-3 text-warning mt-0.5 shrink-0" /><span>{w}</span>
                      </div>
                    ))}
                    <p className="text-[9px] text-muted-foreground italic">{med.adaReference}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ))}

      {/* Lipid bar */}
      {lipids.ldlGap > 0 && (
        <div className="clinical-card p-3">
          <div className="flex items-center gap-2 mb-2">
            <Heart className="w-4 h-4 text-destructive" />
            <span className="text-sm font-medium">LDL-C Gap</span>
          </div>
          <div className="flex justify-between text-xs mb-1">
            <span>Current: {lipids.ldlCurrent}</span><span>Target: &lt;{lipids.ldlTarget} mg/dL</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-destructive rounded-full" style={{ width: `${Math.min((lipids.ldlCurrent / 200) * 100, 100)}%` }} />
          </div>
          <p className="text-xs text-destructive mt-1">Gap: {lipids.ldlGap} mg/dL · Post-stroke very high-risk target</p>
        </div>
      )}

      {/* Hypo protocol */}
      <div className="clinical-card p-3 border-warning/20">
        <div className="flex items-center gap-2 mb-2">
          <Shield className="w-4 h-4 text-warning" />
          <span className="text-sm font-medium">Hypoglycemia Protocol (BG &lt;70)</span>
        </div>
        <div className="text-xs space-y-1">
          {hypo.immediate.map((s, i) => <p key={i}>{i + 1}. {s}</p>)}
        </div>
      </div>

      {/* ═══════ SECTION B: DIET PLAN ═══════ */}
      <div className="flex items-center gap-2 pt-4">
        <UtensilsCrossed className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-heading font-bold">B. 7-Day Kerala Diet Plan</h2>
      </div>

      <div className="flex flex-wrap gap-2 mb-1">
        {patient.postStrokeDysphagia && <span className="stat-badge bg-warning/10 text-warning text-xs">Soft textures</span>}
        {patient.hfNYHA >= 2 && <span className="stat-badge bg-info/10 text-info text-xs">Low sodium</span>}
        <span className="stat-badge bg-primary/10 text-primary text-xs">1600-1800 kcal</span>
        <span className="stat-badge bg-accent text-accent-foreground text-xs">30-45g carb/meal</span>
      </div>

      <div className="space-y-2">
        {dietPlan.map((day, di) => (
          <div key={di} className="clinical-card p-3">
            <button onClick={() => setExpandedDay(expandedDay === di ? -1 : di)} className="w-full flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">{day.day.slice(0, 2)}</span>
                <div className="text-left">
                  <span className="text-sm font-medium">{day.day}</span>
                  <span className="text-xs text-muted-foreground block">{day.totalCalories} kcal · {day.totalCarbs}g carbs</span>
                </div>
              </div>
              {expandedDay === di ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />}
            </button>
            {expandedDay === di && (
              <div className="mt-3 space-y-3 animate-slide-in">
                {day.meals.map((meal, mi) => (
                  <div key={mi}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-medium">{meal.name} <span className="text-muted-foreground">{meal.time}</span></span>
                      <span className="text-muted-foreground">{meal.totalCalories} kcal · {meal.totalCarbs}g C</span>
                    </div>
                    <div className="pl-3 border-l-2 border-primary/20 space-y-0.5">
                      {meal.foods.map((f, fi) => (
                        <div key={fi} className="text-xs flex justify-between">
                          <span>{f.food.name}</span>
                          <span className="text-muted-foreground">{f.food.carbsG}g C · {f.food.proteinG}g P</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                {day.snacks.length > 0 && (
                  <div>
                    <span className="text-xs font-medium">Snacks</span>
                    <div className="pl-3 border-l-2 border-secondary/40 space-y-0.5 mt-1">
                      {day.snacks.map((s, si) => (
                        <div key={si} className="text-xs flex justify-between">
                          <span>{s.food.name}</span>
                          <span className="text-muted-foreground">{s.food.calories} cal</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="clinical-card p-4 bg-muted/30 text-center">
        <p className="text-xs text-muted-foreground">
          Generated by Diabetes Med Optimizer · ADA Standards of Care 2026 · LAI Lipid Guidelines<br />
          For post-stroke neuro patients · Kochi, Kerala · This is a clinical decision support tool — physician review required
        </p>
      </div>
    </div>
  );
};

export default SummaryPage;
