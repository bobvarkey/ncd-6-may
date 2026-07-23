import { FrequencyBadge } from "@/components/FrequencyBadge";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ChevronDown,
  ChevronUp,
  Syringe,
  AlertTriangle,
  CheckCircle2,
  ArrowDown,
  Scale,
  Activity,
  FlaskConical,
  Eye,
  Clock,
  TrendingUp,
  XCircle,
  RefreshCw,
  Pill,
  Heart,
  Home,
  RotateCcw,
  Target,
  Swords,
  Brain,
} from "lucide-react";

interface GLP1Drug {
  name: string;
  route: string;
  frequency: string;
  titration: string[];
  maxDose: string;
  a1cReduction: string;
  weightLoss: string;
}

const glp1Drugs: GLP1Drug[] = [
  {
    name: "Tirzepatide",
    route: "SC",
    frequency: "Weekly",
    titration: ["2.5 mg", "5 mg", "7.5 mg", "10 mg", "12.5 mg", "15 mg"],
    maxDose: "15 mg/week",
    a1cReduction: "2.0-2.5%",
    weightLoss: "15-22%",
  },
  {
    name: "Semaglutide",
    route: "SC",
    frequency: "Weekly",
    titration: ["0.25 mg", "0.5 mg", "1.0 mg", "1.7 mg", "2.4 mg"],
    maxDose: "2.4 mg/week",
    a1cReduction: "1.5-1.8%",
    weightLoss: "12-15%",
  },
  {
    name: "Liraglutide",
    route: "SC",
    frequency: "Daily",
    titration: ["0.6 mg", "1.2 mg", "1.8 mg", "2.4 mg", "3.0 mg"],
    maxDose: "3.0 mg/day",
    a1cReduction: "1.0-1.5%",
    weightLoss: "8-10%",
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

interface PatientData {
  bmi: number;
  hasHypertension: boolean;
  hasASCVD: boolean;
  hasCKD: boolean;
  hasNAFLD: boolean;
  hasOSA: boolean;
  hba1c: number;
}

function getPatientEligibility(patient: PatientData) {
  const eligible = patient.bmi >= 30 || (patient.bmi >= 27 && (patient.hasASCVD || patient.hasHypertension || patient.hasCKD || patient.hasNAFLD || patient.hasOSA || patient.hba1c >= 5.7));
  const matchedComorbidities: string[] = [];
  if (patient.hasHypertension) matchedComorbidities.push("Hypertension");
  if (patient.hba1c >= 5.7 && patient.hba1c < 6.5) matchedComorbidities.push("Prediabetes");
  if (patient.hasASCVD) matchedComorbidities.push("ASCVD");
  if (patient.hasOSA) matchedComorbidities.push("OSA");
  if (patient.hasNAFLD) matchedComorbidities.push("NAFLD/NASH");
  if (patient.hasCKD) matchedComorbidities.push("CKD");

  // Preferred agent
  let preferred: string;
  if (patient.bmi >= 35 || patient.hba1c >= 8.0) preferred = "Tirzepatide";
  else if (patient.hasASCVD) preferred = "Semaglutide";
  else preferred = "Semaglutide";

  return { eligible, matchedComorbidities, preferred };
}

type TabKey = "algorithm" | "drugs" | "monitoring";

const TABS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  { key: "algorithm", label: "Algorithm", icon: <Target className="h-4 w-4" /> },
  { key: "drugs", label: "Drug Comparison", icon: <Pill className="h-4 w-4" /> },
  { key: "monitoring", label: "Monitoring", icon: <Eye className="h-4 w-4" /> },
];

export default function GLP1ObesityAlgorithm() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabKey>("algorithm");
  const [expanded, setExpanded] = useState(true);
  const [patient, setPatient] = useState<PatientData>({
    bmi: 32,
    hasHypertension: true,
    hasASCVD: false,
    hasCKD: false,
    hasNAFLD: false,
    hasOSA: false,
    hba1c: 6.2,
  });

  const reset = () => {
    setPatient({
      bmi: 32,
      hasHypertension: true,
      hasASCVD: false,
      hasCKD: false,
      hasNAFLD: false,
      hasOSA: false,
      hba1c: 6.2,
    });
  };

  const { eligible, matchedComorbidities, preferred } = getPatientEligibility(patient);

  const flowSteps = [
    {
      label: "Step 1: Diagnose",
      detail: patient.bmi >= 30
        ? `BMI ${patient.bmi} ≥30 → Eligible`
        : patient.bmi >= 27
        ? `BMI ${patient.bmi} ≥27 + comorbidity → ${eligible ? "Eligible" : "Evaluate comorbidities"}`
        : `BMI ${patient.bmi} <27 → Not eligible for GLP-1 obesity Rx`,
      active: true,
      icon: Scale,
    },
    {
      label: "Step 2: Baseline Evaluation",
      detail: "Glucose, lipids, LFTs, renal function, pancreatitis/gallbladder/MTC history",
      active: true,
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

  function handleSmartParse(values: Record<string, string>) {
    Object.entries(values).forEach(([key, value]) => {
      if (key === 'hba1c' || key === 'bmi') {
        setPatient(prev => ({ ...prev, [key]: parseFloat(value) }));
      } else if (key === 'weight') {
        setPatient(prev => ({ ...prev, [key]: parseFloat(value) }));
      }
    });
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky Header */}
      <div className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="mx-auto max-w-4xl px-4">
          <div className="flex items-center gap-3 py-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-pink-500 to-rose-600 shadow-md">
              <Syringe className="h-5 w-5 text-foreground" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="font-display text-xl font-extrabold tracking-tight bg-gradient-to-r from-pink-500 via-rose-500 to-orange-500 bg-clip-text text-transparent truncate">
                GLP-1 / GIP Obesity Algorithm
              </h1>
              <p className="text-xs font-medium text-destructive dark:text-destructive truncate">
                Evidence-Based Obesity Pharmacotherapy
              </p>
            </div>
            <div className="flex items-center gap-2 no-print shrink-0">
              <Button variant="ghost" size="sm" onClick={() => navigate("/")} title="Back to Home">
                <Home className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={reset} title="Reset">
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="flex gap-0.5 pb-2 overflow-x-auto no-print">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${
                  activeTab === tab.key
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-4xl px-4 py-5 space-y-6">
        {activeTab === "algorithm" && (
        <>
        {/* Patient Profile Input */}
        <Card className="clinical-card border-primary/20">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Scale className="h-4 w-4 text-primary" />
              Patient Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bmi">BMI</Label>
                <Input
                  id="bmi"
                  type="number"
                  value={patient.bmi}
                  onChange={(e) => setPatient({ ...patient, bmi: parseFloat(e.target.value) || 0 })}
                  className="bg-card border-border"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hba1c">HbA1c (%)</Label>
                <Input
                  id="hba1c"
                  type="number"
                  step="0.1"
                  value={patient.hba1c}
                  onChange={(e) => setPatient({ ...patient, hba1c: parseFloat(e.target.value) || 0 })}
                  className="bg-card border-border"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {[
                { key: "hasHypertension", label: "Hypertension" },
                { key: "hasASCVD", label: "ASCVD" },
                { key: "hasCKD", label: "CKD" },
                { key: "hasNAFLD", label: "NAFLD/NASH" },
                { key: "hasOSA", label: "OSA" },
              ].map((comorbidity) => (
                <Button
                  key={comorbidity.key}
                  variant={patient[comorbidity.key as keyof PatientData] ? "default" : "outline"}
                  size="sm"
                  onClick={() =>
                    setPatient({
                      ...patient,
                      [comorbidity.key]: !patient[comorbidity.key as keyof PatientData],
                    })
                  }
                >
                  {comorbidity.label}
                </Button>
              ))}
            </div>

            {/* Eligibility Status */}
            <div className={`p-3 rounded-lg border-2 ${eligible ? "border-success/30 bg-success/5" : "border-muted bg-muted/30"}`}>
              <div className="flex items-center gap-2">
                {eligible ? (
                  <CheckCircle2 className="h-5 w-5 text-success" />
                ) : (
                  <XCircle className="h-5 w-5 text-muted-foreground" />
                )}
                <div>
                  <p className="font-medium">
                    {eligible ? "Patient Eligible for GLP-1 Therapy" : "Patient Not Eligible"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {patient.bmi >= 30
                      ? `BMI ${patient.bmi} ≥30 (meets criteria)`
                      : patient.bmi >= 27 && matchedComorbidities.length > 0
                      ? `BMI ${patient.bmi} ≥27 with comorbidities: ${matchedComorbidities.join(", ")}`
                      : "BMI <27 or insufficient comorbidities"}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Treatment Algorithm Flow */}
        <Card className="clinical-card">
          <CardHeader>
            <button onClick={() => setExpanded(!expanded)} className="w-full flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">Treatment Algorithm</CardTitle>
              </div>
              {expanded ? <ChevronUp className="h-5 w-5 text-muted-foreground" /> : <ChevronDown className="h-5 w-5 text-muted-foreground" />}
            </button>
          </CardHeader>

          {expanded && (
            <CardContent className="space-y-4">
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
            </CardContent>
          )}
        </Card>

        {/* Drug Comparison Cards */}
        <Card className="clinical-card">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Pill className="h-4 w-4 text-primary" />
              Dose Escalation Schedules
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {glp1Drugs.map((drug) => (
              <div
                key={drug.name}
                className={`p-4 rounded-lg border ${drug.name === preferred ? "border-primary/40 bg-primary/5" : "border-border bg-muted/20"}`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{drug.name}</span>
                    {drug.name === preferred && (
                      <Badge variant="default" className="text-xs">Preferred</Badge>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground flex items-center gap-1.5">{drug.route} · {drug.frequency} <FrequencyBadge frequency={drug.frequency} /></span>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-3">
                  <div>
                    <span className="text-xs text-muted-foreground">A1C Reduction:</span>
                    <p className="text-sm font-medium text-primary">{drug.a1cReduction}</p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">Weight Loss:</span>
                    <p className="text-sm font-medium text-emerald-400">{drug.weightLoss}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1 flex-wrap">
                  <span className="text-xs text-muted-foreground mr-1">Titration:</span>
                  {drug.titration.map((dose, di) => (
                    <div key={di} className="flex items-center gap-1">
                      {di > 0 && <span className="text-muted-foreground text-xs">→</span>}
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        di === drug.titration.length - 1
                          ? "bg-primary/20 text-primary font-medium"
                          : "bg-muted text-muted-foreground"
                      }`}>
                        {dose}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Response Criteria & Monitoring */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Response Assessment */}
          <Card className="clinical-card">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                Response Assessment (12–16 Weeks)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-2 p-3 rounded-lg bg-success/5 border border-success/20">
                <CheckCircle2 className="w-4 h-4 text-success shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-success">Adequate Response (≥5%)</p>
                  <p className="text-xs text-muted-foreground">Continue current therapy + monitoring</p>
                </div>
              </div>
              <div className="flex items-start gap-2 p-3 rounded-lg bg-warning/5 border border-warning/20">
                <RefreshCw className="w-4 h-4 text-warning shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-warning">Partial Response (3–5%)</p>
                  <p className="text-xs text-muted-foreground">Optimize dose / reinforce lifestyle</p>
                </div>
              </div>
              <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/5 border border-destructive/20">
                <XCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-destructive">Inadequate (&lt;3–5%)</p>
                  <p className="text-xs text-muted-foreground">Switch: Liraglutide → Semaglutide → Tirzepatide</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Monitoring Schedule */}
          <Card className="clinical-card">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Eye className="h-4 w-4 text-primary" />
                Periodic Monitoring
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {monitoringSchedule.map((item, index) => (
                  <div key={index} className="flex justify-between items-center py-2 border-b border-border/50 last:border-0">
                    <span className="text-sm">{item.param}</span>
                    <Badge variant="outline" className="text-xs">{item.freq}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Safety Alerts */}
        <Card className="clinical-card border-destructive/30">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-4 w-4" />
              Safety Surveillance & Contraindications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <p className="font-medium text-destructive">Absolute Contraindications</p>
                <ul className="text-muted-foreground space-y-1 text-xs">
                  <li>• History of medullary thyroid carcinoma (MTC)</li>
                  <li>• Multiple Endocrine Neoplasia syndrome type 2 (MEN2)</li>
                  <li>• Personal/family history of MTC</li>
                  <li>• Prior serious hypersensitivity to drug</li>
                </ul>
              </div>
              <div className="space-y-2">
                <p className="font-medium text-warning">Warnings & Precautions</p>
                <ul className="text-muted-foreground space-y-1 text-xs">
                  <li>• Acute pancreatitis — discontinue if suspected</li>
                  <li>• Acute gallbladder disease — assess if symptoms</li>
                  <li>• Hypoglycemia risk when combined with insulin/SU</li>
                  <li>• Renal impairment — caution with dehydration</li>
                  <li>• Diabetic retinopathy complications (semaglutide)</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Clinical Bottom Line */}
        <Card className="clinical-card border-primary/20">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Heart className="h-4 w-4 text-primary" />
              Clinical Bottom Line
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="text-sm text-muted-foreground space-y-2">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-success shrink-0 mt-0.5" />
                Always evaluate baseline labs and contraindications before starting
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-success shrink-0 mt-0.5" />
                Assess response at 12–16 weeks on therapeutic dose
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-success shrink-0 mt-0.5" />
                Continue only if clinically meaningful benefit (≥5% weight loss)
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-success shrink-0 mt-0.5" />
                Monitor systematically and long-term for safety
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-success shrink-0 mt-0.5" />
                Discontinuation results in weight regain — discuss long-term commitment
              </li>
            </ul>
          </CardContent>
        </Card>
        </>
        )}

        {activeTab === "drugs" && (
          <div className="space-y-6">
            <Card className="clinical-card">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Pill className="h-5 w-5 text-primary" />
                  Dose Escalation Schedules
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {glp1Drugs.map((drug) => (
                  <div
                    key={drug.name}
                    className={`p-4 rounded-lg border ${drug.name === preferred ? "border-primary/40 bg-primary/5" : "border-border bg-muted/20"}`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{drug.name}</span>
                        {drug.name === preferred && (
                          <Badge variant="default" className="text-xs">Preferred</Badge>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground flex items-center gap-1.5">{drug.route} · {drug.frequency} <FrequencyBadge frequency={drug.frequency} /></span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-3">
                      <div>
                        <span className="text-xs text-muted-foreground">A1C Reduction:</span>
                        <p className="text-sm font-medium text-primary">{drug.a1cReduction}</p>
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground">Weight Loss:</span>
                        <p className="text-sm font-medium text-emerald-400">{drug.weightLoss}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 flex-wrap">
                      <span className="text-xs text-muted-foreground mr-1">Titration:</span>
                      {drug.titration.map((dose, di) => (
                        <div key={di} className="flex items-center gap-1">
                          {di > 0 && <span className="text-muted-foreground text-xs">→</span>}
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            di === drug.titration.length - 1
                              ? "bg-primary/20 text-primary font-medium"
                              : "bg-muted text-muted-foreground"
                          }`}>
                            {dose}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Semaglutide vs Tirzepatide Comparison */}
            <Card className="clinical-card border-indigo-500/20">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Swords className="h-5 w-5 text-indigo-500" />
                  <CardTitle className="text-lg">Semaglutide vs. Tirzepatide — Choosing Between Them</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <img
                  src="/sema-vs-tirz.jpg"
                  alt="Semaglutide vs Tirzepatide comparison table"
                  className="w-full rounded-lg border border-border"
                  style={{ maxWidth: "100%", height: "auto" }}
                />

                {/* Summary note */}
                <div className="mt-4 p-3 rounded-lg bg-indigo-500/5 border border-indigo-500/20">
                  <div className="flex items-start gap-2">
                    <Brain className="h-4 w-4 text-indigo-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-medium text-indigo-600 dark:text-indigo-400">Clinical Takeaway</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        <strong>Tirzepatide</strong> wins on metabolic efficacy (weight loss, HbA1c, lean mass preservation) and tolerability. 
                        <strong>Semaglutide</strong> wins on CV outcomes (SELECT, FLOW), temperature stability, and specific comorbidities (MASH, OA, PAD, HFpEF). 
                        Choose based on the dominant clinical concern: metabolic vs. organ-protection.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "monitoring" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="clinical-card">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    Response Assessment (12–16 Weeks)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-success/5 border border-success/20">
                    <CheckCircle2 className="w-4 h-4 text-success shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-success">Adequate Response (≥5%)</p>
                      <p className="text-xs text-muted-foreground">Continue current therapy + monitoring</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-warning/5 border border-warning/20">
                    <RefreshCw className="w-4 h-4 text-warning shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-warning">Partial Response (3–5%)</p>
                      <p className="text-xs text-muted-foreground">Optimize dose / reinforce lifestyle</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/5 border border-destructive/20">
                    <XCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-destructive">Inadequate (&lt;3–5%)</p>
                      <p className="text-xs text-muted-foreground">Switch: Liraglutide → Semaglutide → Tirzepatide</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="clinical-card">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Eye className="h-4 w-4 text-primary" />
                    Periodic Monitoring
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {monitoringSchedule.map((item, index) => (
                      <div key={index} className="flex justify-between items-center py-2 border-b border-border/50 last:border-0">
                        <span className="text-sm">{item.param}</span>
                        <Badge variant="outline" className="text-xs">{item.freq}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="clinical-card border-destructive/30">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2 text-destructive">
                  <AlertTriangle className="h-4 w-4" />
                  Safety Surveillance & Contraindications
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="space-y-2">
                    <p className="font-medium text-destructive">Absolute Contraindications</p>
                    <ul className="text-muted-foreground space-y-1 text-xs">
                      <li>• History of medullary thyroid carcinoma (MTC)</li>
                      <li>• Multiple Endocrine Neoplasia syndrome type 2 (MEN2)</li>
                      <li>• Personal/family history of MTC</li>
                      <li>• Prior serious hypersensitivity to drug</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <p className="font-medium text-warning">Warnings & Precautions</p>
                    <ul className="text-muted-foreground space-y-1 text-xs">
                      <li>• Acute pancreatitis — discontinue if suspected</li>
                      <li>• Acute gallbladder disease — assess if symptoms</li>
                      <li>• Hypoglycemia risk when combined with insulin/SU</li>
                      <li>• Renal impairment — caution with dehydration</li>
                      <li>• Diabetic retinopathy complications (semaglutide)</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
