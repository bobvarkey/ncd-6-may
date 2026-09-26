import { FrequencyBadge } from "@/components/FrequencyBadge";
import { useState } from "react";
import { PatientData } from "@/lib/patient-data";
import {
  ChevronDown, ChevronUp, Syringe, AlertTriangle, CheckCircle2,
  ArrowDown, Scale, Activity, FlaskConical, Eye, Clock, TrendingUp,
  XCircle, RefreshCw, Pill,
} from "lucide-react";

interface GLP1Drug {
  name: string;
  route: string;
  frequency: string;
  titration: string[];
  maxDose: string;
}

const glp1Drugs: GLP1Drug[] = [
  {
    name: "Semaglutide",
    route: "SC",
    frequency: "Weekly",
    titration: ["0.25 mg", "0.5 mg", "1.0 mg", "1.7 mg", "2.4 mg"],
    maxDose: "2.4 mg/week",
  },
  {
    name: "Liraglutide",
    route: "SC",
    frequency: "Daily",
    titration: ["0.6 mg", "1.2 mg", "1.8 mg", "2.4 mg", "3.0 mg"],
    maxDose: "3.0 mg/day",
  },
  {
    name: "Tirzepatide",
    route: "SC",
    frequency: "Weekly",
    titration: ["2.5 mg", "5 mg", "7.5 mg", "10 mg", "12.5 mg", "15 mg"],
    maxDose: "15 mg/week",
  },
];

const monitoringSchedule = [
  { param: "Weight", freq: "Every 4 weeks" },
  { param: "Blood Pressure", freq: "Every 4–8 weeks" },
  { param: "Glucose / HbA1c", freq: "Every 3 months" },
  { param: "Lipid Profile", freq: "Every 6 months" },
  { param: "LFTs (ALT/AST)", freq: "Every 3–6 months" },
  { param: "Renal Function", freq: "Every 6–12 months" },
];

const comorbidities = [
  "Hypertension", "Dyslipidemia", "Prediabetes / Insulin resistance",
  "Cardiovascular disease", "Obstructive sleep apnea", "NAFLD/NASH",
  "Osteoarthritis", "PCOS", "Early CKD",
];

function getPatientEligibility(p: PatientData) {
  const eligible = p.bmi >= 30 || (p.bmi >= 27 && (p.hasASCVD || p.hasHypertension || p.hasCKD || p.hasNAFLD || p.hasOSA || p.hba1c >= 5.7));
  const matchedComorbidities: string[] = [];
  if (p.hasHypertension) matchedComorbidities.push("Hypertension");
  if (p.ldl > 130 || (p.triglycerides && p.triglycerides > 150)) matchedComorbidities.push("Dyslipidemia");
  if (p.hba1c >= 5.7 && p.hba1c < 6.5) matchedComorbidities.push("Prediabetes");
  if (p.hasASCVD || p.hasPostStroke || p.hasPAD) matchedComorbidities.push("CVD");
  if (p.hasOSA) matchedComorbidities.push("OSA");
  if (p.hasNAFLD) matchedComorbidities.push("NAFLD/NASH");
  if (p.hasCKD || p.eGFR < 60) matchedComorbidities.push("Early CKD");

  // Preferred agent
  let preferred: string;
  if (p.bmi >= 35 || p.hba1c >= 8.0) preferred = "Tirzepatide";
  else if (p.hasASCVD) preferred = "Semaglutide";
  else preferred = "Semaglutide";

  return { eligible, matchedComorbidities, preferred };
}

interface Props {
  patient: PatientData;
}

export function GLP1ObesityAlgorithm({ patient }: Props) {
  const [expanded, setExpanded] = useState(false);
  const { eligible, matchedComorbidities, preferred } = getPatientEligibility(patient);

  const flowSteps = [
    {
      label: "Step 1: Diagnose",
      detail: patient.bmi >= 30
        ? `BMI ${patient.bmi} ≥30 → Eligible`
        : patient.bmi >= 27
        ? `BMI ${patient.bmi} ≥27 + comorbidity → ${eligible ? "Eligible" : "Evaluate comorbidities"}`
        : `BMI ${patient.bmi} <27 → Not eligible for GLP-1 obesity Rx`,
      active: eligible,
      icon: Scale,
    },
    {
      label: "Step 2: Baseline Evaluation",
      detail: "Glucose, lipids, LFTs, renal function, pancreatitis/gallbladder/MTC history",
      active: eligible,
      icon: FlaskConical,
    },
    {
      label: "Step 3: Lifestyle + Behavioral Therapy",
      detail: "Caloric deficit ~500 kcal/day, ≥150 min/week activity, structured counselling",
      active: true,
      icon: Activity,
    },
    {
      label: "Step 4: Reassess at 12 Weeks",
      detail: "≥5% weight loss → Continue. <5% OR high-risk → Add pharmacotherapy",
      active: eligible,
      icon: Clock,
    },
    {
      label: "Step 5: Start GLP-1/GIP Pharmacotherapy",
      detail: `Preferred: ${preferred}. Titrate to max tolerated dose`,
      active: eligible,
      icon: Syringe,
    },
    {
      label: "Step 6: Evaluate at 12–16 Weeks",
      detail: "≥5% = responder, ≥10% = optimal. <3-5% → Switch agent",
      active: eligible,
      icon: TrendingUp,
    },
    {
      label: "Step 7: Long-term Monitoring",
      detail: "Weight q4w, BP q4-8w, HbA1c q3m, lipids q6m, renal q6-12m",
      active: eligible,
      icon: Eye,
    },
  ];

  return (
    <div className="clinical-card">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between"
      >
        <div className="flex items-center gap-2">
          <Syringe className="w-4 h-4 text-primary" />
          <h3 className="section-title">GLP-1 / GIP Obesity Treatment Algorithm</h3>
          {eligible && (
            <span className="text-xs bg-success/10 text-success px-2 py-0.5 rounded-full">
              Patient Eligible
            </span>
          )}
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>

      {expanded && (
        <div className="mt-4 space-y-4 animate-slide-in">
          {/* Eligibility */}
          <div className={`p-3 rounded-lg border-2 ${eligible ? "border-success/30 bg-success/5" : "border-muted bg-muted/30"}`}>
            <h4 className="text-xs font-medium mb-2">Eligibility Assessment</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-muted-foreground">BMI:</span>{" "}
                <strong className={patient.bmi >= 30 ? "text-destructive" : patient.bmi >= 27 ? "text-warning" : "text-foreground"}>
                  {patient.bmi} kg/m²
                </strong>
              </div>
              <div>
                <span className="text-muted-foreground">Criteria:</span>{" "}
                <strong>{patient.bmi >= 30 ? "BMI ≥30" : "BMI ≥27 + comorbidity"}</strong>
              </div>
            </div>
            {matchedComorbidities.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {matchedComorbidities.map((c, i) => (
                  <span key={i} className="text-xs bg-warning/10 text-warning px-2 py-0.5 rounded-full">{c}</span>
                ))}
              </div>
            )}
          </div>

          {/* Visual Flow */}
          <div className="flex flex-col items-center gap-1">
            {flowSteps.map((step, i) => {
              const Icon = step.icon;
              return (
                <div key={i} className="flex flex-col items-center w-full max-w-md">
                  {i > 0 && <ArrowDown className="w-4 h-4 text-muted-foreground my-1" />}
                  <div className={`w-full border-2 rounded-lg p-3 transition-all ${
                    step.active ? "bg-primary/5 border-primary/30" : "bg-muted/30 border-border"
                  }`}>
                    <div className="flex items-center gap-2">
                      {step.active && <CheckCircle2 className="w-4 h-4 text-success shrink-0" />}
                      <Icon className="w-4 h-4 text-primary shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium">{step.label}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{step.detail}</p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Drug Titration Cards */}
          <div>
            <h4 className="text-xs font-medium mb-2 flex items-center gap-1.5">
              <Pill className="w-3.5 h-3.5 text-primary" /> Dose Escalation Schedules
            </h4>
            <div className="space-y-3">
              {glp1Drugs.map((drug) => (
                <div
                  key={drug.name}
                  className={`p-3 rounded-lg border ${drug.name === preferred ? "border-primary/40 bg-primary/5" : "border-border bg-muted/20"}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{drug.name}</span>
                      {drug.name === preferred && (
                        <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">Preferred</span>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground flex items-center gap-1.5">{drug.route} · {drug.frequency} <FrequencyBadge frequency={drug.frequency} /></span>
                  </div>
                  <div className="flex items-center gap-1 flex-wrap">
                    {drug.titration.map((dose, di) => (
                      <div key={di} className="flex items-center gap-1">
                        {di > 0 && <span className="text-muted-foreground text-xs">→</span>}
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          di === drug.titration.length - 1
                            ? "bg-primary/10 text-primary font-medium"
                            : "bg-muted text-muted-foreground"
                        }`}>
                          {dose}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Response Criteria */}
          <div>
            <h4 className="text-xs font-medium mb-2">Response Assessment (12–16 Weeks)</h4>
            <div className="space-y-2">
              <div className="flex items-start gap-2 p-2.5 rounded-lg bg-success/5 border border-success/20">
                <CheckCircle2 className="w-4 h-4 text-success shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-medium text-success">Adequate Response (≥5% weight loss)</p>
                  <p className="text-xs text-muted-foreground">Continue current therapy + monitoring</p>
                </div>
              </div>
              <div className="flex items-start gap-2 p-2.5 rounded-lg bg-warning/5 border border-warning/20">
                <RefreshCw className="w-4 h-4 text-warning shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-medium text-warning">Partial Response (3–5% weight loss)</p>
                  <p className="text-xs text-muted-foreground">Optimize dose / reinforce lifestyle interventions</p>
                </div>
              </div>
              <div className="flex items-start gap-2 p-2.5 rounded-lg bg-destructive/5 border border-destructive/20">
                <XCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-medium text-destructive">Inadequate Response (&lt;3–5% weight loss)</p>
                  <p className="text-xs text-muted-foreground">Switch: Liraglutide → Semaglutide → Tirzepatide</p>
                </div>
              </div>
            </div>
          </div>

          {/* Monitoring Table */}
          <div>
            <h4 className="text-xs font-medium mb-2 flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-primary" /> Periodic Monitoring
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-1.5 px-2 text-muted-foreground font-medium">Parameter</th>
                    <th className="text-left py-1.5 px-2 text-muted-foreground font-medium">Frequency</th>
                  </tr>
                </thead>
                <tbody>
                  {monitoringSchedule.map((m, i) => (
                    <tr key={i} className="border-b border-border/50">
                      <td className="py-1.5 px-2 font-medium">{m.param}</td>
                      <td className="py-1.5 px-2 text-muted-foreground">{m.freq}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Safety Alerts */}
          <div className="p-3 rounded-lg border border-dashed border-destructive/30 bg-destructive/5">
            <h4 className="text-xs font-medium text-destructive mb-2 flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" /> Safety Surveillance & Contraindications
            </h4>
            <div className="space-y-1 text-xs text-muted-foreground">
              <p>• <strong>Contraindicated:</strong> History of medullary thyroid carcinoma (MTC) or MEN2 syndrome</p>
              <p>• <strong>Monitor for pancreatitis:</strong> Severe abdominal pain → discontinue immediately</p>
              <p>• <strong>Gallstone risk:</strong> RUQ pain — assess with imaging</p>
              <p>• <strong>Excessive weight loss:</strong> Nutritional deficiency screening</p>
              <p>• <strong>Discontinue if:</strong> Persistent intolerance, serious AEs, or no meaningful response at max dose</p>
            </div>
          </div>

          {/* Duration & Escalation */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-muted/30 border">
              <h4 className="text-xs font-medium mb-1 flex items-center gap-1">
                <Clock className="w-3 h-3 text-primary" /> Duration
              </h4>
              <p className="text-xs text-muted-foreground">Minimum 6 months</p>
              <p className="text-xs text-muted-foreground">Typically long-term / lifelong</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/30 border">
              <h4 className="text-xs font-medium mb-1 flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-primary" /> Escalation
              </h4>
              <p className="text-xs text-muted-foreground">Combination pharmacotherapy</p>
              <p className="text-xs text-muted-foreground">Bariatric surgery if refractory</p>
            </div>
          </div>

          {/* Bottom Line */}
          <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
            <h4 className="text-xs font-medium text-primary mb-1">✅ Clinical Bottom Line</h4>
            <ul className="text-xs text-muted-foreground space-y-0.5">
              <li>• Always evaluate before starting GLP-1 therapy</li>
              <li>• Assess response at 12–16 weeks on therapeutic dose</li>
              <li>• Continue only if clinically meaningful benefit</li>
              <li>• Monitor systematically and long-term</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
