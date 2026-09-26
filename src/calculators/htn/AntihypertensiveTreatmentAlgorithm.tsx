import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GitBranch, ChevronRight, RotateCcw, Activity, Heart, Brain, Baby, AlertTriangle, Home } from "lucide-react";

interface AlgorithmNode {
  id: string;
  question: string;
  type: "decision" | "recommendation";
  options?: { label: string; nextId: string }[];
  recommendation?: {
    firstLine: string[];
    secondLine?: string[];
    avoid?: string[];
    notes?: string;
  };
}

const algorithmNodes: AlgorithmNode[] = [
  {
    id: "start",
    question: "What is the primary comorbidity?",
    type: "decision",
    options: [
      { label: "Diabetes (with or without proteinuria)", nextId: "diabetes" },
      { label: "CKD (GFR < 60 or proteinuria)", nextId: "ckd" },
      { label: "Heart Failure", nextId: "hf_type" },
      { label: "Coronary Artery Disease", nextId: "cad" },
      { label: "Stroke / Cerebrovascular Disease", nextId: "stroke" },
      { label: "Pregnancy", nextId: "pregnancy" },
      { label: "No major comorbidity", nextId: "uncomplicated" },
    ],
  },
  {
    id: "diabetes",
    question: "Diabetes — Is there proteinuria/albuminuria?",
    type: "decision",
    options: [
      { label: "Yes — Diabetic nephropathy / proteinuria", nextId: "diabetes_proteinuria" },
      { label: "No — Diabetes without nephropathy", nextId: "diabetes_no_proteinuria" },
    ],
  },
  {
    id: "diabetes_proteinuria",
    question: "",
    type: "recommendation",
    recommendation: {
      firstLine: ["ACEi (Ramipril / Enalapril)", "OR ARB (Losartan / Telmisartan)"],
      secondLine: ["Add CCB (Amlodipine)", "Add Thiazide-like (Chlorthalidone)"],
      avoid: ["Dual RAAS blockade (ACEi + ARB)", "Beta-blockers (mask hypoglycemia — use with caution)"],
      notes: "ACEi/ARB are renoprotective and reduce proteinuria progression. RENAAL & IDNT trials support ARB in type 2 diabetic nephropathy. Target BP < 130/80 mmHg.",
    },
  },
  {
    id: "diabetes_no_proteinuria",
    question: "",
    type: "recommendation",
    recommendation: {
      firstLine: ["ACEi / ARB", "CCB (Amlodipine)", "Thiazide-like diuretic (Chlorthalidone)"],
      secondLine: ["Combination of above classes"],
      avoid: ["Dual RAAS blockade", "High-dose thiazides (worsen glucose control)"],
      notes: "Any first-line agent is acceptable. ACEi/ARB preferred if microalbuminuria develops. Monitor glucose with thiazides. Target BP < 130/80 mmHg.",
    },
  },
  {
    id: "ckd",
    question: "CKD — Is there significant proteinuria (>300 mg/day)?",
    type: "decision",
    options: [
      { label: "Yes — Proteinuric CKD", nextId: "ckd_proteinuria" },
      { label: "No — Non-proteinuric CKD", nextId: "ckd_no_proteinuria" },
    ],
  },
  {
    id: "ckd_proteinuria",
    question: "",
    type: "recommendation",
    recommendation: {
      firstLine: ["ACEi (Ramipril)", "OR ARB (Losartan / Telmisartan)"],
      secondLine: ["Loop diuretic (Furosemide) if GFR < 30", "CCB (Amlodipine)"],
      avoid: ["Dual RAAS blockade", "Thiazides alone if GFR < 30 (ineffective)", "K-sparing diuretics if GFR < 30"],
      notes: "ACEi/ARB reduce proteinuria and slow CKD progression. Switch from thiazide to loop diuretic when GFR < 30. Monitor K+ closely with ACEi/ARB. Target BP < 130/80 mmHg.",
    },
  },
  {
    id: "ckd_no_proteinuria",
    question: "",
    type: "recommendation",
    recommendation: {
      firstLine: ["ACEi / ARB", "CCB (Amlodipine)", "Thiazide-like (if GFR > 30)"],
      secondLine: ["Loop diuretic (if GFR < 30)", "Add second agent from first-line"],
      avoid: ["Dual RAAS blockade", "K-sparing diuretics if GFR < 30"],
      notes: "No single class clearly superior without proteinuria. Choose based on other comorbidities. Adjust doses per GFR. Target BP < 130/80 mmHg.",
    },
  },
  {
    id: "hf_type",
    question: "Heart Failure — What type?",
    type: "decision",
    options: [
      { label: "HFrEF (EF ≤ 40%)", nextId: "hfref" },
      { label: "HFpEF (EF > 40%)", nextId: "hfpef" },
    ],
  },
  {
    id: "hfref",
    question: "",
    type: "recommendation",
    recommendation: {
      firstLine: [
        "ACEi / ARB (Ramipril, Enalapril, Losartan)",
        "Beta-blocker (Carvedilol, Metoprolol Succinate)",
        "Aldosterone antagonist (Spironolactone 25 mg)",
      ],
      secondLine: ["Loop diuretic (Furosemide) for volume overload"],
      avoid: ["Non-DHP CCBs (Verapamil, Diltiazem — negative inotropes)", "Moxonidine (MOXCON trial — increased mortality in HF)"],
      notes: "Guideline-directed medical therapy (GDMT): ACEi/ARB + Beta-blocker + MRA form the cornerstone. Titrate to target doses. RALES trial: Spironolactone reduces mortality by 30% in HFrEF.",
    },
  },
  {
    id: "hfpef",
    question: "",
    type: "recommendation",
    recommendation: {
      firstLine: ["Diuretics for volume control (Furosemide / Thiazide)", "Manage comorbidities (HTN, AF, CAD)"],
      secondLine: ["ACEi / ARB", "Beta-blocker for rate control if AF", "Spironolactone (may reduce hospitalizations)"],
      avoid: ["No proven mortality-reducing therapy yet"],
      notes: "Focus on symptom management, volume control, and comorbidity treatment. TOPCAT trial suggested benefit of spironolactone in some HFpEF populations. Target BP < 130/80 mmHg.",
    },
  },
  {
    id: "cad",
    question: "",
    type: "recommendation",
    recommendation: {
      firstLine: [
        "Beta-blocker (Metoprolol, Carvedilol) — especially post-MI",
        "ACEi (Ramipril) — HOPE trial benefit",
      ],
      secondLine: ["CCB (Amlodipine) if beta-blocker contraindicated or for angina", "Thiazide diuretic for additional BP control"],
      avoid: ["Short-acting nifedipine (reflex tachycardia)", "Hydralazine monotherapy (reflex tachycardia)"],
      notes: "Beta-blockers reduce reinfarction and mortality post-MI. Ramipril shown to reduce CV events in HOPE trial. Amlodipine is safe in stable CAD (CAMELOT trial). Target BP < 130/80 mmHg.",
    },
  },
  {
    id: "stroke",
    question: "",
    type: "recommendation",
    recommendation: {
      firstLine: ["ACEi + Thiazide-like diuretic (Perindopril + Indapamide — PROGRESS trial)", "ARB (Telmisartan — PROFESS trial)"],
      secondLine: ["CCB (Amlodipine)", "Any first-line agent achieving target BP"],
      avoid: ["Aggressive BP lowering in acute stroke (within 72 hours)"],
      notes: "BP reduction is the most important factor for secondary stroke prevention. PROGRESS trial: ACEi + diuretic reduced stroke recurrence by 43%. Target BP < 130/80 mmHg after stabilization.",
    },
  },
  {
    id: "pregnancy",
    question: "",
    type: "recommendation",
    recommendation: {
      firstLine: ["Methyldopa (Aldomet) — safest, most studied", "Labetalol", "Nifedipine Extended Release"],
      secondLine: ["Hydralazine (IV for severe hypertension / eclampsia)"],
      avoid: ["ACEi — TERATOGENIC (all trimesters)", "ARB — TERATOGENIC", "Spironolactone — anti-androgenic effects", "Atenolol — fetal growth restriction"],
      notes: "Methyldopa is the gold standard for chronic HTN in pregnancy. Labetalol is preferred for acute severe hypertension. ACEi/ARB are ABSOLUTELY CONTRAINDICATED — cause renal agenesis, oligohydramnios. Target BP < 140/90 mmHg (CHIPS trial).",
    },
  },
  {
    id: "uncomplicated",
    question: "Uncomplicated Hypertension — Age group?",
    type: "decision",
    options: [
      { label: "Age < 55 (or any age South Asian descent)", nextId: "young_uncomplicated" },
      { label: "Age ≥ 55 (or Black African/Caribbean descent)", nextId: "older_uncomplicated" },
    ],
  },
  {
    id: "young_uncomplicated",
    question: "",
    type: "recommendation",
    recommendation: {
      firstLine: ["ACEi (Ramipril)", "OR ARB (Losartan / Telmisartan)"],
      secondLine: ["Add CCB (Amlodipine)", "Then add Thiazide-like (Chlorthalidone)"],
      avoid: ["Beta-blockers as first-line for uncomplicated HTN (no longer recommended)"],
      notes: "NICE/BHS ACD algorithm: Step 1 = A (ACEi/ARB). Step 2 = A + C or A + D. Step 3 = A + C + D. Step 4 (resistant) = Add Spironolactone 25 mg. Target BP < 140/90 mmHg (< 130/80 if high risk).",
    },
  },
  {
    id: "older_uncomplicated",
    question: "",
    type: "recommendation",
    recommendation: {
      firstLine: ["CCB (Amlodipine)", "OR Thiazide-like diuretic (Chlorthalidone)"],
      secondLine: ["Add ACEi / ARB", "Then triple therapy (A + C + D)"],
      avoid: ["Beta-blockers as first-line (less effective for stroke prevention in elderly)"],
      notes: "CCB or thiazide preferred in older and Black patients due to lower renin states. ALLHAT trial supports thiazide-like diuretics. Step 4 (resistant): Add Spironolactone (PATHWAY-2 trial). Target BP < 140/90 mmHg.",
    },
  },
];

export default function AntihypertensiveTreatmentAlgorithm() {
  const navigate = useNavigate();
  const [history, setHistory] = useState<string[]>(["start"]);

  const currentId = history[history.length - 1];
  const currentNode = algorithmNodes.find((n) => n.id === currentId);

  const selectOption = (nextId: string) => {
    setHistory((prev) => [...prev, nextId]);
  };

  const goBack = () => {
    if (history.length > 1) {
      setHistory((prev) => prev.slice(0, -1));
    }
  };

  const restart = () => setHistory(["start"]);

  // Build breadcrumb from history
  const breadcrumb = history.map((id) => {
    const node = algorithmNodes.find((n) => n.id === id);
    if (!node) return "";
    if (node.type === "decision") return node.question;
    // For recommendations, find the option label that led here
    const parentId = history[history.indexOf(id) - 1];
    const parent = algorithmNodes.find((n) => n.id === parentId);
    const option = parent?.options?.find((o) => o.nextId === id);
    return option?.label ?? "";
  }).filter(Boolean);

  function handleSmartParse(values: Record<string, string>) {
    // This algorithm is decision-tree based, no direct state to set
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky Header */}
      <div className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="mx-auto max-w-3xl px-4">
          <div className="flex items-center gap-3 py-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-md">
              <GitBranch className="h-5 w-5 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="font-display text-xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-600 bg-clip-text text-transparent truncate">
                HTN Treatment Algorithm
              </h1>
              <p className="text-xs font-medium text-emerald-500 dark:text-emerald-400 truncate">
                Evidence-Based Antihypertensive Selection
              </p>
            </div>
            <div className="flex items-center gap-2 no-print shrink-0">
              <Button variant="ghost" size="sm" onClick={() => navigate("/")} title="Back to Home">
                <Home className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={restart} title="Restart">
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-3xl px-4 py-5">
        <div className="mb-4">
        </div>
        <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Activity className="h-5 w-5 text-primary" />
                <CardTitle className="text-xl">Treatment Algorithm</CardTitle>
              </div>
              {history.length > 1 && (
                <div className="flex gap-2">
                  <button onClick={goBack} className="text-xs text-primary hover:underline font-medium">
                    ← Back
                  </button>
                  <button onClick={restart} className="text-xs text-muted-foreground hover:underline">
                    Restart
                  </button>
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground">Evidence-based antihypertensive selection by comorbidity</p>
          </CardHeader>
          <CardContent>
            {/* Breadcrumb */}
            {history.length > 1 && (
              <div className="flex flex-wrap items-center gap-1 mb-4 text-xs text-muted-foreground">
                {breadcrumb.map((crumb, i) => (
                  <span key={i} className="flex items-center gap-1">
                    {i > 0 && <ChevronRight className="h-3 w-3" />}
                    <span className={i === breadcrumb.length - 1 ? "font-semibold text-foreground" : ""}>
                      {crumb}
                    </span>
                  </span>
                ))}
              </div>
            )}

            {currentNode?.type === "decision" && (
              <div className="space-y-3">
                <h3 className="text-base font-semibold text-foreground">{currentNode.question}</h3>
                <div className="grid gap-2">
                  {currentNode.options?.map((opt) => (
                    <button
                      key={opt.nextId}
                      onClick={() => selectOption(opt.nextId)}
                      className="text-left p-3 rounded-lg border-2 border-border hover:border-primary/50 hover:bg-primary/5 transition-all group"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium group-hover:text-primary">{opt.label}</span>
                        <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {currentNode?.type === "recommendation" && currentNode.recommendation && (
              <div className="space-y-4">
                {/* First Line */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Heart className="h-4 w-4 text-emerald-500" />
                    <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">First-Line</Badge>
                  </div>
                  <ul className="space-y-1.5 ml-1">
                    {currentNode.recommendation.firstLine.map((drug, i) => (
                      <li key={i} className="flex items-start space-x-2 text-sm">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0" />
                        <span className="text-foreground">{drug}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Second Line */}
                {currentNode.recommendation.secondLine && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Activity className="h-4 w-4 text-primary" />
                      <Badge className="bg-primary/20 text-primary border-primary/30">Second-Line / Add-on</Badge>
                    </div>
                    <ul className="space-y-1.5 ml-1">
                      {currentNode.recommendation.secondLine.map((drug, i) => (
                        <li key={i} className="flex items-start space-x-2 text-sm">
                          <div className="w-2 h-2 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                          <span className="text-foreground">{drug}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Avoid */}
                {currentNode.recommendation.avoid && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="h-4 w-4 text-destructive" />
                      <Badge className="bg-destructive/20 text-destructive border-destructive/30">Avoid / Caution</Badge>
                    </div>
                    <ul className="space-y-1.5 ml-1">
                      {currentNode.recommendation.avoid.map((drug, i) => (
                        <li key={i} className="flex items-start space-x-2 text-sm">
                          <div className="w-2 h-2 rounded-full bg-destructive mt-1.5 flex-shrink-0" />
                          <span className="text-foreground">{drug}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Evidence / Notes */}
                {currentNode.recommendation.notes && (
                  <div className="p-3 rounded-lg bg-muted/50 border border-border">
                    <p className="text-xs text-muted-foreground">
                      <span className="font-semibold text-foreground">📚 Evidence & Notes: </span>
                      {currentNode.recommendation.notes}
                    </p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Reference Cards */}
        <div className="grid grid-cols-2 gap-4 mt-6">
          <Card className="clinical-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Brain className="h-4 w-4 text-primary" />
                Stroke Prevention
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                ACEi + Thiazide (PROGRESS trial) reduces recurrence by 43%. Target BP &lt;130/80 mmHg.
              </p>
            </CardContent>
          </Card>

          <Card className="clinical-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Baby className="h-4 w-4 text-primary" />
                Pregnancy
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                Methyldopa, Labetalol, Nifedipine SR are safe. ACEi/ARB are TERATOGENIC — strictly contraindicated.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
