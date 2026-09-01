import { useMemo, useState } from "react";
import Seo from "@/components/Seo";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Activity, Copy, Info, RotateCcw } from "lucide-react";
import { TakeHomeMessage } from "@/components/ui/take-home-message";
import { copyToClipboard } from "@/lib/clinical-utils";
import { ClinicalFrailtyScale } from "@/components/ClinicalFrailtyScale";

type AnswerValue = "yes" | "no" | null;

interface FrailtyItem {
  id: string;
  domain: string;
  question: string;
  hint: string;
  /** CFS level implied when the answer is "yes" */
  score: number;
}

/** Ordered from most severe to least severe — the first "yes" that is reached sets the level. */
const FRAILTY_ITEMS: FrailtyItem[] = [
  {
    id: "terminal",
    domain: "Terminal illness",
    question: "Life expectancy under 6 months from a terminal illness, without otherwise evident frailty?",
    hint: "For example advanced malignancy in a person who is still functionally independent.",
    score: 9,
  },
  {
    id: "endoflife",
    domain: "Dependence",
    question: "Completely dependent for personal care AND approaching end of life / unlikely to recover from a minor illness?",
    hint: "Complete dependence plus clinical instability or irreversible decline.",
    score: 8,
  },
  {
    id: "personalcare",
    domain: "Dependence",
    question: "Completely dependent for personal care but clinically stable (not high risk of dying within ~6 months)?",
    hint: "Full assistance with washing, dressing and toileting, yet stable.",
    score: 7,
  },
  {
    id: "adl",
    domain: "Basic ADLs",
    question: "Needs help with all outside activities, housework and cooking, plus stairs or bathing?",
    hint: "May also need minimal help with dressing.",
    score: 6,
  },
  {
    id: "iadl",
    domain: "Instrumental ADLs",
    question: "Needs help with higher-order IADLs — shopping, walking outside alone, meal preparation or housework?",
    hint: "IADL = finances, transport, heavy housework, medications, shopping.",
    score: 5,
  },
  {
    id: "symptoms",
    domain: "Symptoms",
    question: "Not dependent on others for daily help, but symptoms limit activities (slowed up, tired during the day)?",
    hint: "The classic 'vulnerable' pattern before overt frailty.",
    score: 4,
  },
  {
    id: "controlled",
    domain: "Activity",
    question: "Medical problems well controlled, but no regular activity beyond routine walking?",
    hint: "Independent, walks around, but not exercising.",
    score: 3,
  },
  {
    id: "occasional",
    domain: "Activity",
    question: "No active disease symptoms and exercises or is very active occasionally / seasonally?",
    hint: "Fit but less fit than the most active peers.",
    score: 2,
  },
  {
    id: "veryfit",
    domain: "Activity",
    question: "Robust, energetic, exercises regularly and among the fittest for their age?",
    hint: "Highly active with no limitation.",
    score: 1,
  },
];

const CATEGORY_LABEL: Record<number, string> = {
  1: "Very fit",
  2: "Well",
  3: "Managing well",
  4: "Vulnerable",
  5: "Mildly frail",
  6: "Moderately frail",
  7: "Severely frail",
  8: "Very severely frail",
  9: "Terminally ill",
};

const CATEGORY_EXPLANATION: Record<number, string> = {
  1: "Robust, active and motivated; among the fittest for their age. Routine preventive care.",
  2: "No active disease symptoms; occasionally or seasonally active. Routine preventive care.",
  3: "Medical problems well controlled with no activity beyond routine walking. Encourage exercise and review risk factors.",
  4: "Vulnerable: independent but symptom-limited and slowed up. Target reversible causes, review medications and monitor function.",
  5: "Mildly frail: needs help with higher-order IADLs. Start comprehensive geriatric assessment, falls and nutrition review.",
  6: "Moderately frail: needs help with all outside activities and with stairs or bathing. Multidisciplinary support and carer planning.",
  7: "Severely frail: completely dependent for personal care but clinically stable. Focus on function, comfort and advance care planning.",
  8: "Very severely frail: completely dependent and approaching end of life; unlikely to recover from a minor illness. Palliative-oriented care.",
  9: "Terminally ill: life expectancy under 6 months without otherwise evident frailty. Goals-of-care and symptom-focused management.",
};

function bandTone(score: number): string {
  if (score <= 3) return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30";
  if (score <= 5) return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30";
  if (score <= 8) return "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30";
  return "bg-slate-500/10 text-slate-600 dark:text-slate-300 border-slate-500/30";
}

function bandName(score: number): string {
  if (score <= 3) return "Fit / non-frail (CFS 1–3)";
  if (score <= 5) return "Vulnerable to mild frailty (CFS 4–5)";
  if (score <= 8) return "Moderate to very severe frailty (CFS 6–8)";
  return "Terminal illness (CFS 9)";
}

export default function FrailtyCalculator() {
  const [answers, setAnswers] = useState<Record<string, AnswerValue>>({});

  const setAnswer = (id: string, value: AnswerValue) =>
    setAnswers((prev) => ({ ...prev, [id]: prev[id] === value ? null : value }));

  const reset = () => setAnswers({});

  const result = useMemo(() => {
    const firstYes = FRAILTY_ITEMS.find((item) => answers[item.id] === "yes");
    const answeredCount = FRAILTY_ITEMS.filter((i) => answers[i.id]).length;
    return { score: firstYes?.score ?? null, driver: firstYes ?? null, answeredCount };
  }, [answers]);

  const reportText = useMemo(() => {
    if (result.score === null) return "";
    const lines = [
      "Clinical Frailty Scale (Rockwood 9-point)",
      `Date: ${new Date().toLocaleDateString()}`,
      "",
      `CFS score: ${result.score} — ${CATEGORY_LABEL[result.score]}`,
      `Band: ${bandName(result.score)}`,
      `Interpretation: ${CATEGORY_EXPLANATION[result.score]}`,
      "",
      "Functional items entered:",
      ...FRAILTY_ITEMS.filter((i) => answers[i.id]).map(
        (i) => `- ${i.domain}: ${i.question} → ${answers[i.id] === "yes" ? "Yes" : "No"}`
      ),
      "",
      "Score the patient's usual status in the 2 weeks before any acute illness.",
      "Reference: Rockwood K et al. CMAJ 2005;173:489-95.",
    ];
    return lines.join("\n");
  }, [answers, result]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      <Seo
        title="Clinical Frailty Scale Calculator (CFS 1–9)"
        description="Enter functional items — activity, IADLs, personal care and terminal illness — to get the Rockwood Clinical Frailty Scale score, category and interpretation."
        path="/frailty-calculator"
      />

      <header className="space-y-1">
        <h1 className="text-2xl font-heading font-semibold flex items-center gap-2">
          <Activity className="h-6 w-6 text-primary" />
          Clinical Frailty Scale Calculator
        </h1>
        <p className="text-sm text-muted-foreground">
          Answer the functional items from the most severe downwards. The first "Yes" sets the CFS level.
        </p>
      </header>

      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Functional items</CardTitle>
          <CardDescription>
            Base answers on the patient's <strong>usual</strong> status before the current acute illness.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {FRAILTY_ITEMS.map((item) => {
            const value = answers[item.id];
            return (
              <div
                key={item.id}
                className={`rounded-lg border p-3 transition-colors ${
                  value === "yes" ? "border-primary bg-primary/5" : "border-border bg-card"
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <Badge variant="outline" className="mb-1 text-[11px] font-normal">
                      {item.domain} · CFS {item.score}
                    </Badge>
                    <p className="text-sm font-medium">{item.question}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{item.hint}</p>
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    {(["yes", "no"] as const).map((option) => (
                      <button
                        key={option}
                        type="button"
                        onClick={() => setAnswer(item.id, option)}
                        aria-pressed={value === option}
                        className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                          value === option
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border/60 bg-background/60 text-muted-foreground hover:bg-background"
                        }`}
                      >
                        {option === "yes" ? "Yes" : "No"}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card className="border-primary/40">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Result</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {result.score === null ? (
            <p className="text-sm text-muted-foreground">
              Answer "Yes" to the item that best describes the patient to generate a score.
            </p>
          ) : (
            <>
              <div className={`rounded-xl border p-4 ${bandTone(result.score)}`}>
                <p className="text-3xl font-bold">CFS {result.score}</p>
                <p className="text-sm font-semibold mt-1">{CATEGORY_LABEL[result.score]}</p>
                <p className="text-xs mt-1 opacity-90">{bandName(result.score)}</p>
              </div>

              <div className="rounded-lg border border-border bg-muted/20 p-3 space-y-1.5 select-text">
                <p className="text-sm">{CATEGORY_EXPLANATION[result.score]}</p>
                {result.driver && (
                  <p className="text-xs text-muted-foreground">
                    <strong className="text-foreground">Determining item:</strong> {result.driver.domain} — {result.driver.question}
                  </p>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => copyToClipboard(reportText, "Result copied")}>
                  <Copy className="h-4 w-4 mr-1" /> Copy result
                </Button>
                <Button size="sm" variant="ghost" onClick={reset}>
                  <RotateCcw className="h-4 w-4 mr-1" /> Reset
                </Button>
              </div>
            </>
          )}

          <Separator />
          <div className="flex items-start gap-2 text-xs text-muted-foreground">
            <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
            <p>
              The CFS is a judgement-based scale: if two levels seem to fit, choose the one that matches the patient's
              dependence for shopping, walking outside, meals, housework and personal care. Score 9 applies to terminal
              illness even when frailty signs are absent.
            </p>
          </div>
        </CardContent>
      </Card>

      <TakeHomeMessage title="Interpreting the CFS" variant="key-point">
        →CFS 1–3 fit; 4 vulnerable; 5–6 mild-to-moderate frailty; 7–8 severe frailty; 9 terminal illness
        →CFS ≥5 should trigger comprehensive geriatric assessment and medication review
        →Score usual baseline function, not the acute presentation
        →Document the determining functional item alongside the number
      </TakeHomeMessage>

      <ClinicalFrailtyScale />
    </div>
  );
}
