import { useMemo, useState } from "react";
import { Activity, AlertTriangle, CheckCircle2, Copy, Info, RotateCcw, Stethoscope } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChoiceGroup } from "@/components/ui/choice-group";
import { copyToClipboard } from "@/lib/clinical-utils";
import { cn } from "@/lib/utils";
import {
  EMPTY_MINI_STATE,
  SEVERITY_LABELS,
  evaluateMiniApp,
  type MiniState,
} from "@/lib/cts-mini-app";

const resultTone = (grade: number | null) => {
  if (grade === null) {
    return {
      border: "border-amber-500/40",
      surface: "bg-amber-500/5",
      text: "text-amber-700 dark:text-amber-300",
      icon: AlertTriangle,
    };
  }
  if (grade <= 2) {
    return {
      border: "border-emerald-500/40",
      surface: "bg-emerald-500/5",
      text: "text-emerald-700 dark:text-emerald-300",
      icon: CheckCircle2,
    };
  }
  if (grade <= 4) {
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
};

export default function CtsGradingMiniApp() {
  const [state, setState] = useState<MiniState>(EMPTY_MINI_STATE);
  const [latency, setLatency] = useState("");
  const [amplitude, setAmplitude] = useState("");

  const result = useMemo(() => evaluateMiniApp(state, latency, amplitude), [state, latency, amplitude]);
  const tone = resultTone(result.grade);
  const ResultIcon = tone.icon;
  const hasSelection = Object.values(state).some(Boolean) || latency !== "" || amplitude !== "";

  const update = <K extends keyof MiniState>(field: K, value: MiniState[K]) => {
    setState((previous) => ({ ...previous, [field]: value }));
  };

  const reset = () => {
    setState({ ...EMPTY_MINI_STATE });
    setLatency("");
    setAmplitude("");
  };

  return (
    <div className="space-y-4">
      <Card className="border-border/40">
        <CardHeader className="pb-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Activity className="h-4 w-4 text-cyan-600" />
              Bland CTS Grading Calculator
            </CardTitle>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={reset} title="Reset">
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Bland neurophysiological scale · Grades 0–6 · Median nerve at wrist
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <section className="space-y-3">
            <h3 className="text-sm font-semibold">1. Sensory nerve conduction</h3>
            <ChoiceGroup
              label="Median sensory response"
              value={state.sensory}
              onChange={(value) => update("sensory", value)}
              options={[
                { value: "normal", label: "Normal" },
                { value: "slow", label: "Slowed, SNAP present" },
                { value: "absent", label: "SNAP absent" },
              ]}
            />
            <ChoiceGroup
              label="Sensitive comparative tests"
              value={state.comparison}
              onChange={(value) => update("comparison", value)}
              options={[
                { value: "normal", label: "Normal" },
                { value: "abnormal", label: "Abnormal" },
                { value: "unknown", label: "Not done" },
              ]}
            />
          </section>

          <section className="space-y-3 border-t border-border/40 pt-4">
            <h3 className="text-sm font-semibold">2. Median motor response (APB)</h3>
            <ChoiceGroup
              label="Median motor response"
              value={state.motor}
              onChange={(value) => update("motor", value)}
              options={[
                { value: "present", label: "Recordable" },
                { value: "absent", label: "Unrecordable" },
              ]}
            />
            <ChoiceGroup
              label="Median APB distal motor latency (DML)"
              value={state.dml}
              onChange={(value) => update("dml", value)}
              options={[
                { value: "lt", label: "< 6.5 ms" },
                { value: "gt", label: "> 6.5 ms" },
                { value: "eq", label: "Exactly 6.5 ms" },
                { value: "unrecordable", label: "Not measurable" },
              ]}
            />
            <div className="max-w-[220px] space-y-1.5">
              <Label htmlFor="cts-mini-latency" className="text-xs">
                Optional exact DML (ms)
              </Label>
              <Input
                id="cts-mini-latency"
                type="number"
                inputMode="decimal"
                min={0}
                max={50}
                step={0.01}
                placeholder="e.g. 4.8"
                value={latency}
                onChange={(event) => setLatency(event.target.value)}
                className="h-9 bg-card"
              />
            </div>
            <ChoiceGroup
              label="Is the distal motor latency prolonged by your laboratory reference?"
              value={state.prolonged}
              onChange={(value) => update("prolonged", value)}
              options={[
                { value: "yes", label: "Yes" },
                { value: "no", label: "No" },
                { value: "unknown", label: "Unknown" },
              ]}
            />
            <ChoiceGroup
              label="APB CMAP response"
              value={state.cmap}
              onChange={(value) => update("cmap", value)}
              options={[
                { value: "adequate", label: "≥ 0.2 mV" },
                { value: "low", label: "< 0.2 mV" },
                { value: "absent", label: "Unrecordable" },
              ]}
            />
            <div className="max-w-[220px] space-y-1.5">
              <Label htmlFor="cts-mini-amplitude" className="text-xs">
                Optional exact APB CMAP amplitude (mV)
              </Label>
              <Input
                id="cts-mini-amplitude"
                type="number"
                inputMode="decimal"
                min={0}
                max={100}
                step={0.01}
                placeholder="e.g. 5.2"
                value={amplitude}
                onChange={(event) => setAmplitude(event.target.value)}
                className="h-9 bg-card"
              />
            </div>
          </section>

          <section className="space-y-3 border-t border-border/40 pt-4">
            <h3 className="text-sm font-semibold">3. Second lumbrical response</h3>
            <ChoiceGroup
              label="Median-innervated second lumbrical potential recorded?"
              value={state.lumbrical}
              onChange={(value) => update("lumbrical", value)}
              options={[
                { value: "yes", label: "Yes, recorded" },
                { value: "no", label: "No, unrecordable" },
                { value: "notdone", label: "Not tested" },
              ]}
            />
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              Documented separately. A preserved lumbrical response does not override an absent APB
              response or independently change the supplied Bland grade.
            </p>
          </section>
        </CardContent>
      </Card>

      <Card className={cn("border-l-4", tone.border, tone.surface)} aria-live="polite">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <ResultIcon className={cn("h-4 w-4", tone.text)} />
            Calculated grade
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className={cn("text-2xl font-heading font-bold", tone.text)}>
              {result.grade === null
                ? "Review required"
                : `Grade ${result.grade} · ${SEVERITY_LABELS[result.grade]}`}
            </p>
            <p
              className={cn(
                "mt-1 text-sm",
                result.grade === null
                  ? "text-amber-700 dark:text-amber-300"
                  : tone.text,
              )}
            >
              {hasSelection ? result.why : "Select the findings above."}
            </p>
          </div>

          <div>
            <h4 className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <Stethoscope className="h-3.5 w-3.5" />
              NCS report impression
            </h4>
            <div className="whitespace-pre-wrap rounded-lg border border-border/40 bg-muted/30 p-3 text-sm">
              {result.impression}
            </div>
          </div>

          {result.warnings.length > 0 && (
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
              <h4 className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-amber-700 dark:text-amber-300">
                <Info className="h-3.5 w-3.5" />
                Discordant findings
              </h4>
              <ul className="list-disc space-y-1 pl-4 text-xs text-muted-foreground">
                {result.warnings.map((warning) => (
                  <li key={warning}>{warning}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              onClick={() => copyToClipboard(result.impression, "Impression copied")}
              disabled={!hasSelection}
            >
              <Copy className="mr-1.5 h-4 w-4" />
              Copy impression
            </Button>
            <Button size="sm" variant="outline" onClick={reset}>
              <RotateCcw className="mr-1.5 h-4 w-4" />
              Reset
            </Button>
          </div>

          <p className="text-[11px] leading-relaxed text-muted-foreground">
            Based on the supplied 0–6 Bland scale. A latency of exactly 6.5 ms is a boundary case in
            the supplied text. Grade 6 requires absent sensory potentials and an APB CMAP &lt;0.2 mV or
            unrecordable. The lumbrical response is recorded separately. Discordant findings are flagged
            rather than forced into a grade. Confirm electrode distance, temperature, reference limits
            and technical adequacy before clinical reporting.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
