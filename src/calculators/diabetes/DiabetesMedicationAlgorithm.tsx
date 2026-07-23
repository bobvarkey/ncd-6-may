import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import {
  GitBranch,
  Heart,
  Activity,
  Scale,
  AlertTriangle,
  CheckCircle2,
  ArrowDown,
  Brain,
  BookOpen,
  Stethoscope,
  Pill,
  FlaskConical,
  Home,
} from "lucide-react";

interface AlgorithmStep {
  id: string;
  title: string;
  description: string;
  criteria?: string;
  medications?: { name: string; class: string; notes?: string }[];
  icon: React.ReactNode;
  tone: "primary" | "accent" | "warning" | "danger";
}

const adaAlgorithmSteps: AlgorithmStep[] = [
  {
    id: "step1",
    title: "Lifestyle Interventions",
    description: "Foundation of diabetes management",
    criteria: "All patients with type 2 diabetes",
    medications: [],
    icon: <Activity className="h-5 w-5" />,
    tone: "primary",
  },
  {
    id: "step2",
    title: "Metformin First-Line",
    description: "Unless contraindicated or not tolerated",
    criteria: "HbA1c ≥6.5%, eGFR ≥30 mL/min/1.73m²",
    medications: [
      { name: "Metformin", class: "Biguanide", notes: "Start 500 mg BID, titrate to 1000 mg BID" },
    ],
    icon: <Pill className="h-5 w-5" />,
    tone: "primary",
  },
  {
    id: "step3",
    title: "ASCVD / CKD / HF Present?",
    description: "Check for established cardiovascular or renal disease",
    criteria: "ASCVD, HF, or CKD with albuminuria",
    medications: [
      { name: "SGLT2 Inhibitor", class: "SGLT2i", notes: "Empagliflozin, dapagliflozin — CV/renal benefit" },
      { name: "GLP-1 Receptor Agonist", class: "GLP-1 RA", notes: "Liraglutide, semaglutide — CV benefit" },
    ],
    icon: <Heart className="h-5 w-5" />,
    tone: "accent",
  },
  {
    id: "step4",
    title: "Weight Management Priority",
    description: "For patients with obesity",
    criteria: "BMI ≥27 kg/m² (Asian: ≥25)",
    medications: [
      { name: "GLP-1 RA / Dual GIP/GLP-1", class: "Incretin", notes: "Semaglutide, tirzepatide — superior weight loss" },
      { name: "SGLT2 Inhibitor", class: "SGLT2i", notes: "Moderate weight loss, additional CV benefit" },
    ],
    icon: <Scale className="h-5 w-5" />,
    tone: "accent",
  },
  {
    id: "step5",
    title: "Dual Therapy",
    description: "Add second agent if HbA1c above target",
    criteria: "HbA1c ≥7.5% or not at goal after 3 months",
    medications: [
      { name: "DPP-4 Inhibitor", class: "DPP-4i", notes: "Sitagliptin, linagliptin — weight neutral, low hypoglycemia" },
      { name: "Pioglitazone", class: "TZD", notes: "Durable, but weight gain and edema" },
      { name: "Sulfonylurea", class: "SU", notes: "Gliclazide MR — inexpensive but hypoglycemia risk" },
      { name: "SGLT2 Inhibitor", class: "SGLT2i", notes: "If not already on for CV/renal indication" },
      { name: "GLP-1 RA", class: "GLP-1 RA", notes: "If not already on for CV/weight indication" },
    ],
    icon: <Pill className="h-5 w-5" />,
    tone: "warning",
  },
  {
    id: "step6",
    title: "Triple Therapy",
    description: "Intensify if still above target",
    criteria: "HbA1c ≥8.0% on dual therapy",
    medications: [
      { name: "Triple oral combination", class: "Various", notes: "Met + DPP-4i + SGLT2i or other combinations" },
    ],
    icon: <FlaskConical className="h-5 w-5" />,
    tone: "warning",
  },
  {
    id: "step7",
    title: "Insulin-Based Therapy",
    description: "For severe hyperglycemia",
    criteria: "HbA1c ≥9.0% OR RBS >300 mg/dL OR symptomatic hyperglycemia",
    medications: [
      { name: "Basal Insulin", class: "Insulin", notes: "Glargine, detemir, degludec — start 10 U or 0.1-0.2 U/kg" },
      { name: "Prandial Insulin", class: "Insulin", notes: "Add if postprandial excursions — rapid-acting" },
    ],
    icon: <AlertTriangle className="h-5 w-5" />,
    tone: "danger",
  },
];

const clinicalGuidelines = [
  {
    icon: <Pill className="h-4 w-4" />,
    title: "Medication Adherence",
    text: "Facilitating medication adherence should be specifically considered when selecting glucose-lowering medications. Patient preference is a major factor — route of administration, injection devices, side effects, and cost may prevent use.",
  },
  {
    icon: <BookOpen className="h-4 w-4" />,
    title: "DSMES",
    text: "All patients should have ongoing access to diabetes self-management education and support (DSMES).",
  },
  {
    icon: <Stethoscope className="h-4 w-4" />,
    title: "Medical Nutrition Therapy",
    text: "Healthy eating advice and strategies (MNT) should be offered to all patients with type 2 diabetes.",
  },
  {
    icon: <Scale className="h-4 w-4" />,
    title: "Weight Management",
    text: "All overweight and obese patients with diabetes should be advised of the health benefits of weight loss and encouraged to engage in intensive lifestyle management.",
  },
  {
    icon: <Activity className="h-4 w-4" />,
    title: "Physical Activity",
    text: "Increasing physical activity improves glycaemic control and should be encouraged in all people with type 2 diabetes. Target: 150 min/week moderate activity.",
  },
  {
    icon: <Heart className="h-4 w-4" />,
    title: "Cardiovascular Disease",
    text: "For patients with clinical CVD, an SGLT2 inhibitor or GLP-1 receptor agonist with proven cardiovascular benefit is recommended.",
  },
  {
    icon: <FlaskConical className="h-4 w-4" />,
    title: "CKD & Heart Failure",
    text: "For patients with CKD or clinical heart failure, an SGLT2 inhibitor with proven benefit should be considered (EMPEROR, DAPA-CKD trials).",
  },
];

const drugClasses = [
  {
    class: "Biguanides",
    examples: "Metformin",
    advantages: ["First-line", "Weight neutral", "Low hypoglycemia", "Inexpensive"],
    disadvantages: ["GI side effects", "B12 deficiency", "Contraindicated if eGFR <30"],
    a1cReduction: "1.0-1.5%",
  },
  {
    class: "SGLT2 Inhibitors",
    examples: "Empagliflozin, Dapagliflozin, Canagliflozin",
    advantages: ["CV benefit", "Renal protection", "Weight loss", "BP reduction"],
    disadvantages: ["Genital infections", "Volume depletion", "DKA risk", "Amputation (canagliflozin)"],
    a1cReduction: "0.5-1.0%",
  },
  {
    class: "GLP-1 Receptor Agonists",
    examples: "Liraglutide, Semaglutide, Dulaglutide",
    advantages: ["Superior CV benefit", "Weight loss", "Low hypoglycemia"],
    disadvantages: ["Injectable", "GI side effects", "Pancreatitis concern", "Gallstones"],
    a1cReduction: "1.0-1.5%",
  },
  {
    class: "Dual GIP/GLP-1",
    examples: "Tirzepatide",
    advantages: ["Highest A1C reduction", "Greatest weight loss", "Once weekly"],
    disadvantages: ["Injectable", "GI side effects", "Higher cost"],
    a1cReduction: "2.0-2.5%",
  },
  {
    class: "DPP-4 Inhibitors",
    examples: "Sitagliptin, Linagliptin, Vildagliptin",
    advantages: ["Weight neutral", "Low hypoglycemia", "Well tolerated", "Oral"],
    disadvantages: ["No CV benefit", "Cost", "Heart failure (saxagliptin)"],
    a1cReduction: "0.5-0.8%",
  },
  {
    class: "Thiazolidinediones",
    examples: "Pioglitazone",
    advantages: ["Durable glycemic control", "Inexpensive"],
    disadvantages: ["Weight gain", "Edema", "HF exacerbation", "Fractures"],
    a1cReduction: "0.8-1.0%",
  },
  {
    class: "Sulfonylureas",
    examples: "Gliclazide MR, Glimepiride",
    advantages: ["Inexpensive", "Effective", "Oral"],
    disadvantages: ["Hypoglycemia", "Weight gain", "Secondary failure"],
    a1cReduction: "1.0-1.5%",
  },
];

export default function DiabetesMedicationAlgorithm() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("algorithm");

  function handleSmartParse(values: Record<string, string>) {
    Object.entries(values).forEach(([key, value]) => {
      (setActiveTab as any)(key);
    });
  }

  const getToneClasses = (tone: string) => {
    switch (tone) {
      case "primary":
        return "border-primary/40 bg-primary/5";
      case "accent":
        return "border-accent/40 bg-accent/5";
      case "warning":
        return "border-amber-500/40 bg-warning/100/5";
      case "danger":
        return "border-destructive/40 bg-destructive/5";
      default:
        return "border-border bg-card";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky Header */}
      <div className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="mx-auto max-w-5xl px-4">
          <div className="flex items-center gap-3 py-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-md">
              <GitBranch className="h-5 w-5 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="font-display text-xl font-extrabold tracking-tight bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-600 bg-clip-text text-transparent truncate">
                Diabetes Medication Algorithm
              </h1>
              <p className="text-xs font-medium text-violet-500 dark:text-violet-400 truncate">
                ADA 2025 Standards of Care
              </p>
            </div>
            <div className="flex items-center gap-2 no-print shrink-0">
              <Button variant="ghost" size="sm" onClick={() => navigate("/")} title="Back to Home">
                <Home className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="flex gap-0.5 pb-2 overflow-x-auto no-print">
            {[
              { key: "algorithm", label: "Treatment Algorithm", icon: <Brain className="h-4 w-4" /> },
              { key: "drug-classes", label: "Drug Classes", icon: <Pill className="h-4 w-4" /> },
              { key: "guidelines", label: "Clinical Guidelines", icon: <BookOpen className="h-4 w-4" /> },
            ].map((tab) => (
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

      <main className="mx-auto max-w-5xl px-4 py-5">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          {/* Algorithm Tab */}
          <TabsContent value="algorithm" className="space-y-6">
            <Card className="clinical-card border-primary/20">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Brain className="h-5 w-5 text-primary" />
                  ADA 2025 Decision Pathway
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {adaAlgorithmSteps.map((step, index) => (
                  <div key={step.id} className="flex flex-col">
                    <div className={`p-4 rounded-lg border-2 ${getToneClasses(step.tone)}`}>
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5">{step.icon}</div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <h3 className="font-semibold text-foreground">{step.title}</h3>
                            <Badge variant="outline" className="text-xs">
                              Step {index + 1}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{step.description}</p>

                          {step.criteria && (
                            <div className="mb-3">
                              <span className="text-xs font-medium text-primary">Criteria: </span>
                              <span className="text-xs text-muted-foreground">{step.criteria}</span>
                            </div>
                          )}

                          {step.medications && step.medications.length > 0 && (
                            <div className="space-y-2">
                              <p className="text-xs font-medium">Medication Options:</p>
                              <div className="grid gap-2">
                                {step.medications.map((med, medIndex) => (
                                  <div key={medIndex} className="flex items-start gap-2 p-2 rounded bg-background/50">
                                    <CheckCircle2 className="h-3 w-3 text-emerald-500 mt-0.5 shrink-0" />
                                    <div>
                                      <p className="text-sm font-medium">{med.name}</p>
                                      <p className="text-xs text-muted-foreground">{med.class}</p>
                                      {med.notes && (
                                        <p className="text-xs text-primary mt-0.5">{med.notes}</p>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    {index < adaAlgorithmSteps.length - 1 && (
                      <div className="flex justify-center py-2">
                        <ArrowDown className="h-5 w-5 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Key Evidence */}
            <Card className="clinical-card border-amber-500/30">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  Key Evidence & Trials
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">SGLT2 Inhibitors</p>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      <li>• EMPA-REG: CV mortality reduction with empagliflozin</li>
                      <li>• DAPA-HF: Dapagliflozin in HFrEF with/without diabetes</li>
                      <li>• CREDENCE: Canagliflozin in diabetic kidney disease</li>
                    </ul>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">GLP-1 Receptor Agonists</p>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      <li>• LEADER: Liraglutide CV benefit in T2DM</li>
                      <li>• SUSTAIN-6: Semaglutide reduces CV events</li>
                      <li>• REWIND: Dulaglutide CV benefit</li>
                    </ul>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Dual GIP/GLP-1</p>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      <li>• SURPASS: Tirzepatide superior A1C reduction vs semaglutide</li>
                      <li>• SURMOUNT: Significant weight loss in obesity</li>
                    </ul>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Metformin</p>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      <li>• UKPDS: Metformin reduced CV mortality in overweight patients</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Drug Classes Tab */}
          <TabsContent value="drug-classes" className="space-y-4">
            <div className="grid gap-4">
              {drugClasses.map((drug, index) => (
                <Card key={index} className="clinical-card">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{drug.class}</CardTitle>
                      <Badge variant="outline" className="text-xs">
                        A1C ↓ {drug.a1cReduction}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{drug.examples}</p>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs font-medium text-emerald-400 mb-1">Advantages</p>
                        <ul className="text-xs text-muted-foreground space-y-0.5">
                          {drug.advantages.map((adv, i) => (
                            <li key={i}>• {adv}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-destructive mb-1">Disadvantages</p>
                        <ul className="text-xs text-muted-foreground space-y-0.5">
                          {drug.disadvantages.map((dis, i) => (
                            <li key={i}>• {dis}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Guidelines Tab */}
          <TabsContent value="guidelines" className="space-y-4">
            <Card className="clinical-card">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-primary" />
                  ADA 2025 Clinical Considerations
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {clinicalGuidelines.map((guideline, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                    <div className="mt-0.5 text-primary">{guideline.icon}</div>
                    <div>
                      <p className="text-sm font-medium">{guideline.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">{guideline.text}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Metabolic Surgery Criteria */}
            <Card className="clinical-card border-primary/20">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Scale className="h-4 w-4 text-primary" />
                  Metabolic Surgery Criteria
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Recommended for adults with T2DM who meet ONE of the following:
                  </p>
                  <ul className="text-sm text-muted-foreground space-y-2 list-disc pl-4">
                    <li>BMI ≥40 kg/m² (≥37.5 for Asian ancestry)</li>
                    <li>BMI 35.0–39.9 kg/m² (32.5–37.4 for Asian) with inadequate glycemic control despite lifestyle & medical therapy</li>
                    <li>BMI 30–34.9 with difficult-to-control T2DM despite optimal medical therapy (may be considered)</li>
                  </ul>
                  <div className="p-3 rounded-lg bg-warning/100/10 border border-amber-500/20 mt-3">
                    <p className="text-xs text-amber-200">
                      <strong>Note:</strong> Surgery should be performed in high-volume centers with multidisciplinary teams.
                      Benefits include diabetes remission in 60-80% of patients at 1-5 years.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
