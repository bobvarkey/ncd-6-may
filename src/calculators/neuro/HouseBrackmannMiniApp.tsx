import { useMemo, useState } from "react";
import { Activity, AlertTriangle, CheckCircle2, Copy, Info, RotateCcw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChoiceGroup } from "@/components/ui/choice-group";
import { copyToClipboard } from "@/lib/clinical-utils";
import { cn } from "@/lib/utils";
import {
  HB_GRADES,
  HB_QUESTIONS,
  assessHouseBrackmann,
  type HbSelections,
  type HbSide,
} from "@/lib/house-brackmann";

const GRADE_NUMBER: Record<string, number> = { I: 1, II: 2, III: 3, IV: 4, V: 5, VI: 6 };

function resultTone(grade: string | null, discordant: boolean) {
  if (discordant) {
    return {
      border: "border-amber-500/40",
      surface: "bg-amber-500/5",
      text: "text-amber-700 dark:text-amber-300",
      icon: AlertTriangle,
    };
  }
  if (grade === null) {
    return {
      border: "border-sky-500/40",
      surface: "bg-sky-500/5",
      text: "text-sky-700 dark:text-sky-300",
      icon: Info,
    };
  }
  const number = GRADE_NUMBER[grade] ?? 0;
  if (number <= 2) {
    return {
      border: "border-emerald-500/40",
      surface: "bg-emerald-500/5",
      text: "text-emerald-700 dark:text-emerald-300",
      icon: CheckCircle2,
    };
  }
  if (number <= 4) {
    return {
      border: "border-orange-500/40",
      surface: "bg-orange-500/5",
      text: "text-orange-700 dark:text-orange-300",
      icon: AlertTriangle,
    };
  }
  return {
    border: "border-rose-500/40",
    surface: "bg-rose-500/5",
    text: "text-rose-700 dark:text-rose-300",
    icon: AlertTriangle,
  };
}

export default function HouseBrackmannMiniApp() {
  const [side, setSide] = useState<HbSide>(null);
  const [selections, setSelections] = useState<HbSelections>({});

  const result = useMemo(() => assessHouseBrackmann(side, selections), [side, selections]);
  const tone = resultTone(result.winner?.g ?? null, result.isDiscordant);
  const ResultIcon = tone.icon;

  const select = (domain: keyof HbSelections, value: string) => {
    setSelections((previous) => ({ ...previous, [domain]: value }));
  };

  const reset = () => {
    setSide(null);
    setSelections({});
  };

  return (
    <div className="space-y-4">
      <Card className="border-border/40">
        <CardHeader className="pb-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Activity className="h-4 w-4 text-cyan-600" />
              House–Brackmann Facial Palsy Grader
            </CardTitle>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={reset} title="Reset">
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Clickable clinical assessment · Grades I–VI · Based on the supplied grading chart
          </p>
        </CardHeader>
        <CardContent>
          <ChoiceGroup
            label="Side assessed"
            value={side}
            onChange={(value) => setSide(value as HbSide)}
            options={[
              { value: "Right", label: "Right" },
              { value: "Left", label: "Left" },
              { value: "Bilateral", label: "Bilateral" },
            ]}
          />
        </CardContent>
      </Card>

      {HB_QUESTIONS.map((question) => (
        <Card key={question.key} className="border-border/40">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">{question.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <ChoiceGroup
              label={question.title}
              value={selections[question.key] ?? null}
              onChange={(value) => select(question.key, value)}
              options={question.options}
            />
          </CardContent>
        </Card>
      ))}

      <Card className={cn("border-l-4", tone.border, tone.surface)} aria-live="polite">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <ResultIcon className={cn("h-4 w-4", tone.text)} />
            Suggested grade
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className={cn("text-2xl font-heading font-bold", tone.text)}>{result.heading}</p>
            <p className="mt-1 text-sm text-muted-foreground">{result.message}</p>
          </div>

          <div>
            <h4 className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Clinical impression
            </h4>
            <div className="whitespace-pre-wrap rounded-lg border border-border/40 bg-muted/30 p-3 text-sm">
              {result.report}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              onClick={() => copyToClipboard(result.report, "Clinical impression copied")}
              disabled={result.selectedCount === 0}
            >
              <Copy className="mr-1.5 h-4 w-4" />
              Copy clinical impression
            </Button>
            <Button size="sm" variant="outline" onClick={reset}>
              <RotateCcw className="mr-1.5 h-4 w-4" />
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/40">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Reference chart</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border">
                  <th className="py-2 pr-2 text-left font-semibold">Grade</th>
                  <th className="py-2 pr-2 text-left font-semibold">Function</th>
                  <th className="py-2 pr-2 text-left font-semibold">Rest</th>
                  <th className="py-2 pr-2 text-left font-semibold">Eyes</th>
                  <th className="py-2 pr-2 text-left font-semibold">Mouth</th>
                  <th className="py-2 text-left font-semibold">Forehead</th>
                </tr>
              </thead>
              <tbody>
                {HB_GRADES.map((grade) => {
                  const active = result.winner?.g === grade.g;
                  return (
                    <tr
                      key={grade.g}
                      className={cn(
                        "border-b border-border/40 align-top transition-colors",
                        active && "bg-emerald-500/10",
                      )}
                    >
                      <td className={cn("py-2 pr-2 font-bold", active && tone.text)}>{grade.g}</td>
                      <td className="py-2 pr-2">{grade.name}</td>
                      <td className="py-2 pr-2 text-muted-foreground">{grade.rest}</td>
                      <td className="py-2 pr-2 text-muted-foreground">{grade.eye}</td>
                      <td className="py-2 pr-2 text-muted-foreground">{grade.mouth}</td>
                      <td className="py-2 text-muted-foreground">{grade.fore}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <p className="text-[11px] leading-relaxed text-muted-foreground">
            This is a decision aid based on the uploaded simplified chart, not a substitute for a full
            clinical assessment. Mixed or discordant findings may not map uniquely to one grade. Grade
            VI represents total paralysis.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
