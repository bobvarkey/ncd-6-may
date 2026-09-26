import { useState, useEffect, useMemo } from "react";
import { PatientData, loadPatient } from "@/lib/patient-data";
import { generatePrediabetesRecommendations } from "@/lib/med-logic";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import {
  UserX, ArrowDown, CheckCircle2, Activity, Heart, Scale, Scissors, Stethoscope,
  Apple, AlertTriangle, Target,
} from "lucide-react";

const categoryIcon: Record<string, typeof Heart> = {
  lifestyle: Apple,
  "cv-risk": Heart,
  "weight-loss-med": Scale,
  "dysglycemia-med": Activity,
  surgery: Scissors,
  monitoring: Stethoscope,
};

const categoryColor: Record<string, string> = {
  lifestyle: "border-l-success bg-success/5",
  "cv-risk": "border-l-destructive bg-destructive/5",
  "weight-loss-med": "border-l-warning bg-warning/5",
  "dysglycemia-med": "border-l-primary bg-primary/5",
  surgery: "border-l-muted-foreground bg-muted/30",
  monitoring: "border-l-info bg-info/5",
};

const PrediabetesAlgorithm = () => {
  const navigate = useNavigate();
  const [patient, setPatient] = useState<PatientData | null>(null);

  useEffect(() => {
    const saved = loadPatient();
    if (saved && saved.name && saved.age > 0) setPatient(saved);
  }, []);

  const result = useMemo(
    () => patient ? generatePrediabetesRecommendations(patient) : null,
    [patient]
  );

  if (!patient) {
    return (
      <div className="space-y-5 animate-slide-in">
        <h1 className="text-xl font-heading font-bold">Prediabetes Algorithm</h1>
        <div className="clinical-card flex flex-col items-center justify-center py-12 text-center">
          <UserX className="w-12 h-12 text-muted-foreground mb-4" />
          <h2 className="text-lg font-heading font-semibold mb-2">No Patient Data</h2>
          <p className="text-sm text-muted-foreground mb-4 max-w-md">
            Enter patient demographics and lab values first. The prediabetes algorithm requires FBS, HbA1c, and BMI.
          </p>
          <Button onClick={() => navigate("/patient")}>Enter Patient Data</Button>
        </div>
      </div>
    );
  }

  if (!result || !result.isPrediabetic) {
    const isOvertDiabetes = patient.hba1c >= 6.5 || patient.fbs >= 126;
    return (
      <div className="space-y-5 animate-slide-in">
        <h1 className="text-xl font-heading font-bold">Prediabetes Algorithm</h1>
        <div className="clinical-card flex flex-col items-center justify-center py-12 text-center">
          {isOvertDiabetes ? (
            <>
              <AlertTriangle className="w-12 h-12 text-destructive mb-4" />
              <h2 className="text-lg font-heading font-semibold mb-2">Overt Diabetes Detected</h2>
              <p className="text-sm text-muted-foreground mb-4 max-w-md">
                HbA1c {patient.hba1c}% / FBS {patient.fbs} mg/dL indicates overt diabetes, not prediabetes.
                Use the Medication Optimizer for full T2DM management.
              </p>
              <Button onClick={() => navigate("/medications")}>Go to Medication Optimizer</Button>
            </>
          ) : (
            <>
              <CheckCircle2 className="w-12 h-12 text-success mb-4" />
              <h2 className="text-lg font-heading font-semibold mb-2">Not Prediabetic</h2>
              <p className="text-sm text-muted-foreground mb-4 max-w-md">
                HbA1c {patient.hba1c}% and FBS {patient.fbs} mg/dL are within normal range.
                Continue healthy lifestyle and periodic screening.
              </p>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-slide-in">
      <div>
        <h1 className="text-xl font-heading font-bold">Prediabetes Algorithm</h1>
        <p className="text-sm text-muted-foreground">AACE 2023 Prediabetes Management Flowchart</p>
      </div>

      {/* Criteria banner */}
      <div className="clinical-card p-4 border-l-4 border-l-warning bg-warning/5">
        <h3 className="text-sm font-heading font-semibold text-warning mb-2">Prediabetes Criteria Met</h3>
        <div className="flex flex-wrap gap-3 text-xs">
          {patient.fbs >= 100 && patient.fbs <= 125 && (
            <span className="bg-warning/10 text-warning px-2 py-1 rounded-full">IFG: FPG {patient.fbs} mg/dL (100-125)</span>
          )}
          {patient.hba1c >= 5.7 && patient.hba1c <= 6.4 && (
            <span className="bg-warning/10 text-warning px-2 py-1 rounded-full">A1C: {patient.hba1c}% (5.7-6.4%)</span>
          )}
          <span className="bg-muted px-2 py-1 rounded-full">BMI: {patient.bmi} ({result.isOverweight ? "Overweight/Obese" : "Normal"})</span>
        </div>
      </div>

      {/* Visual flowchart */}
      <div className="clinical-card">
        <h3 className="section-title mb-4">AACE Decision Tree — Patient's Path</h3>
        <div className="flex flex-col items-center gap-1">
          {/* Prediabetes entry */}
          <div className="w-full max-w-md border-2 border-primary rounded-full p-3 bg-primary/10 text-center">
            <p className="text-sm font-medium text-primary">Prediabetes Identified</p>
            <p className="text-xs text-muted-foreground">IFG | IGT | A1C 5.7-6.4% | Metabolic Syndrome</p>
          </div>
          <ArrowDown className="w-4 h-4 text-muted-foreground" />

          {/* Goals */}
          <div className="w-full max-w-md border-2 border-border rounded-lg p-3 bg-muted/30">
            <p className="text-xs font-medium text-center mb-1">Goals</p>
            <div className="flex flex-wrap gap-1 justify-center">
              {result.goals.map((g, i) => (
                <span key={i} className="text-xs bg-background px-2 py-0.5 rounded-full">{g}</span>
              ))}
            </div>
          </div>
          <ArrowDown className="w-4 h-4 text-muted-foreground" />

          {/* Lifestyle */}
          <div className="w-full max-w-md border-2 border-success rounded-lg p-3 bg-success/10">
            <p className="text-sm font-medium text-center">Lifestyle Intervention</p>
            <p className="text-xs text-muted-foreground text-center">Nutrition | Physical Activity | Sleep Hygiene | Healthy Habits</p>
          </div>
          <ArrowDown className="w-4 h-4 text-muted-foreground" />

          {/* CV Risk */}
          <div className="w-full max-w-md border-2 border-destructive/50 rounded-lg p-3 bg-destructive/5">
            <p className="text-sm font-medium text-center">Cardiovascular Risk Reduction</p>
            <p className="text-xs text-muted-foreground text-center">Weight Reduction | Blood Pressure Control | Lipid Management</p>
          </div>
          <ArrowDown className="w-4 h-4 text-muted-foreground" />

          {/* Decision: Overweight? */}
          <div className="w-full max-w-md border-2 border-primary rounded-xl p-3 bg-primary/5">
            <p className="text-sm font-medium text-center">Overweight or Obesity?</p>
          </div>

          {/* Branches */}
          <div className="w-full max-w-lg grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
            {/* YES branch */}
            <div className={`flex flex-col items-center gap-1 ${result.isOverweight ? "" : "opacity-40"}`}>
              <span className={`text-xs font-bold ${result.isOverweight ? "text-primary" : "text-muted-foreground"}`}>
                {result.isOverweight ? "✓ YES" : "NO"}
              </span>
              <div className="w-full border-2 border-warning rounded-lg p-2 bg-warning/5 text-center">
                <p className="text-xs font-medium">Goal: Weight Loss &gt;7-10%</p>
              </div>
              <ArrowDown className="w-3 h-3 text-muted-foreground" />
              <div className="w-full border rounded-lg p-2 bg-background text-center">
                <p className="text-xs font-medium">GLP-1 RA</p>
                <p className="text-xs text-muted-foreground">Phentermine / Topiramate ER</p>
              </div>
              <ArrowDown className="w-3 h-3 text-muted-foreground" />
              <div className="w-full border border-dashed rounded-lg p-2 bg-muted/20 text-center">
                <p className="text-xs font-medium">Consider Bariatric Surgery</p>
                <p className="text-xs text-muted-foreground">BMI ≥35 (≥32.5 Asian)</p>
              </div>
            </div>

            {/* NO branch */}
            <div className={`flex flex-col items-center gap-1 ${!result.isOverweight ? "" : "opacity-40"}`}>
              <span className={`text-xs font-bold ${!result.isOverweight ? "text-primary" : "text-muted-foreground"}`}>
                {!result.isOverweight ? "✓ NO" : "YES"}
              </span>
              <div className="w-full border-2 border-primary rounded-lg p-2 bg-primary/5 text-center">
                <p className="text-xs font-medium">Goal: Treat Dysglycemia</p>
              </div>
              <ArrowDown className="w-3 h-3 text-muted-foreground" />
              <div className="w-full border rounded-lg p-2 bg-background text-center">
                <p className="text-xs font-medium">Metformin</p>
                <p className="text-xs text-muted-foreground">Pioglitazone / Acarbose</p>
              </div>
              <ArrowDown className="w-3 h-3 text-muted-foreground" />
              <div className="w-full border border-dashed rounded-lg p-2 bg-muted/20 text-center">
                <p className="text-xs font-medium">→ Glycemic Control Algorithms</p>
                <p className="text-xs text-muted-foreground">If progresses to overt diabetes</p>
              </div>
            </div>
          </div>
        </div>

        {/* Persistent hyperglycemia callout */}
        {result.isOverweight && (patient.fbs > 100 || patient.hba1c > 5.9) && (
          <div className="mt-4 p-3 rounded-lg border border-destructive/30 bg-destructive/5">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="w-4 h-4 text-destructive" />
              <span className="text-xs font-medium text-destructive">Persistent Hyperglycemia Detected</span>
            </div>
            <p className="text-xs text-muted-foreground">
              FPG {patient.fbs} mg/dL — If weight-loss medications insufficient, transition to dysglycemia-specific agents
              (Metformin, Pioglitazone, Acarbose) or proceed to overt diabetes management algorithms.
            </p>
          </div>
        )}

        <p className="text-xs text-muted-foreground text-center mt-4 italic">
          Based on AACE 2023 Prediabetes Algorithm. Active pathway highlighted for this patient.
        </p>
      </div>

      {/* Detailed recommendations */}
      <div className="space-y-3">
        <h2 className="text-sm font-heading font-semibold">Personalized Recommendations</h2>
        {result.recommendations.map((rec, i) => {
          const Icon = categoryIcon[rec.category] || Target;
          return (
            <div key={i} className={`clinical-card border-l-4 ${categoryColor[rec.category]}`}>
              <div className="flex items-start gap-2">
                <Icon className="w-4 h-4 mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-medium">{rec.title}</h3>
                    {rec.isActive && <CheckCircle2 className="w-3.5 h-3.5 text-success shrink-0" />}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{rec.detail}</p>
                  {rec.medications && rec.medications.length > 0 && (
                    <div className="mt-2 space-y-1">
                      <span className="text-xs font-medium text-foreground">Medications:</span>
                      {rec.medications.map((med, j) => (
                        <div key={j} className="flex items-center gap-1.5 text-xs">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                          <span>{med}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {rec.footnote && (
                    <p className="text-xs text-muted-foreground italic mt-2">{rec.footnote}</p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footnotes */}
      <div className="clinical-card bg-muted/30">
        <h3 className="text-xs font-medium mb-2">References & Notes</h3>
        <div className="space-y-1 text-xs text-muted-foreground">
          <p>¹ NCEP ATP III Criteria for Metabolic Syndrome</p>
          <p>² See Complications-Centric Model for the Care of Persons with Overweight/Obesity</p>
          <p>³ If no overweight or obesity, consider T1D antibody testing for LADA</p>
          <p>⁴ Indications for weight-loss medications: obesity or overweight BMI &gt;27 kg/m² with ABCD complication(s) including prediabetes</p>
          <p className="mt-2 italic">AACE 2023 Prediabetes Algorithm. Copyright © 2023 AACE.</p>
        </div>
      </div>
    </div>
  );
};

export default PrediabetesAlgorithm;
