import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Heart, Activity, AlertTriangle, ChevronRight, RotateCcw, GitBranch
} from "lucide-react";
import { AbbreviationHover } from "@/components/AbbreviationHover";

const AbbrText = ({ text }: { text: string }) => <AbbreviationHover term={text}>{text}</AbbreviationHover>;

// ===== ALGORITHM NODES =====
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

// Category colors for hypertension (orange theme)
const categoryColors = {
  accent: "#fb923c",
  bg: "rgba(251,146,60,0.12)",
  border: "rgba(251,146,60,0.2)",
};

interface TreatmentAlgorithmProps {
  className?: string;
}

export default function TreatmentAlgorithm({ className }: TreatmentAlgorithmProps) {
  const [algorithmHistory, setAlgorithmHistory] = useState<string[]>(["start"]);

  const currentId = algorithmHistory[algorithmHistory.length - 1];
  const currentNode = algorithmNodes.find((n) => n.id === currentId);

  const selectAlgorithmOption = (nextId: string) => {
    setAlgorithmHistory((prev) => [...prev, nextId]);
  };

  const goBackAlgorithm = () => {
    if (algorithmHistory.length > 1) {
      setAlgorithmHistory((prev) => prev.slice(0, -1));
    }
  };

  const restartAlgorithm = () => setAlgorithmHistory(["start"]);

  return (
    <Card className={`border-2 border-warning/20 ${className || ""}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GitBranch className="h-5 w-5" style={{ color: categoryColors.accent }} />
            <CardTitle className="text-lg">Treatment Algorithm</CardTitle>
          </div>
          {algorithmHistory.length > 1 && (
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={goBackAlgorithm}>
                ← Back
              </Button>
              <Button variant="ghost" size="sm" onClick={restartAlgorithm}>
                <RotateCcw className="h-4 w-4 mr-1" />
                Restart
              </Button>
            </div>
          )}
        </div>
        <p className="text-xs text-muted-foreground">Evidence-based antihypertensive selection by comorbidity</p>
      </CardHeader>
      <CardContent>
        {/* Breadcrumb */}
        {algorithmHistory.length > 1 && (
          <div className="flex flex-wrap items-center gap-1 mb-4 text-xs text-muted-foreground">
            {algorithmHistory.map((id, i) => {
              const node = algorithmNodes.find((n) => n.id === id);
              if (!node || node.type !== "decision") return null;
              return (
                <span key={i} className="flex items-center gap-1">
                  {i > 0 && <ChevronRight className="h-3 w-3" />}
                  <span className={i === algorithmHistory.length - 1 ? "font-semibold text-foreground" : ""}>
                    {node.question.substring(0, 30)}{node.question.length > 30 ? "..." : ""}
                  </span>
                </span>
              );
            })}
          </div>
        )}

        {currentNode?.type === "decision" && (
          <div className="space-y-3">
            <h3 className="text-base font-semibold text-foreground">{currentNode.question}</h3>
            <div className="grid gap-2">
              {currentNode.options?.map((opt) => (
                <button
                  key={opt.nextId}
                  onClick={() => selectAlgorithmOption(opt.nextId)}
                  className="text-left p-3 rounded-lg border-2 border-border hover:border-warning/50 hover:bg-warning/100/5 transition-all group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium group-hover:text-warning">{opt.label}</span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-orange-500" />
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
                <Heart className="h-4 w-4" style={{ color: categoryColors.accent }} />
                <Badge variant="outline" style={{ color: categoryColors.accent, borderColor: categoryColors.border }}>
                  First-Line
                </Badge>
              </div>
              <ul className="space-y-1.5 ml-1">
                {currentNode.recommendation.firstLine.map((drug, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: categoryColors.accent }} />
                    <span className="text-foreground"><AbbrText text={drug} /></span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Second Line */}
            {currentNode.recommendation.secondLine && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="h-4 w-4 text-muted-foreground" />
                  <Badge variant="outline" className="text-muted-foreground">Second-Line / Add-on</Badge>
                </div>
                <ul className="space-y-1.5 ml-1">
                  {currentNode.recommendation.secondLine.map((drug, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <div className="w-2 h-2 rounded-full bg-muted-foreground/50 mt-1.5 flex-shrink-0" />
                      <span className="text-foreground"><AbbrText text={drug} /></span>
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
                  <Badge variant="outline" className="text-destructive border-destructive/30">Avoid / Caution</Badge>
                </div>
                <ul className="space-y-1.5 ml-1">
                  {currentNode.recommendation.avoid.map((drug, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <div className="w-2 h-2 rounded-full bg-destructive mt-1.5 flex-shrink-0" />
                      <span className="text-foreground"><AbbrText text={drug} /></span>
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
                  <AbbrText text={currentNode.recommendation.notes} />
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}