import { useMemo, useState } from "react";
import { Activity, ChevronDown, Copy, FileDown, RotateCcw, TrendingDown } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { copyToClipboard, downloadTextFile } from "@/lib/clinical-utils";
import {
  GLUCOCORTICOID_NAMES,
  TAPER_SPEED,
  WITHDRAWAL_PHASES,
  buildTaperSchedule,
  cortisolUgDlFromNmolL,
  doseBand,
  fromPrednisoloneEq,
  interpretMorningCortisolUgDl,
  roundMg,
  toPrednisoloneEq,
  type CortisolBand,
  type DoseBand,
  type TaperSpeed,
} from "@/lib/steroid-taper";

function ReadMore({ summary, children }: { summary: string; children: React.ReactNode }) {
  return (
    <details className="group text-xs text-muted-foreground min-w-0">
      <summary className="cursor-pointer list-none flex items-center gap-1 text-primary hover:underline font-medium select-none">
        <ChevronDown className="h-3 w-3 shrink-0 transition-transform group-open:rotate-180" />
        {summary}
      </summary>
      <div className="mt-2 space-y-1.5 leading-relaxed">{children}</div>
    </details>
  );
}

const BAND_TONE: Record<DoseBand, string> = {
  high: "border-sky-500/30 bg-sky-500/5",
  ten_to_five: "border-amber-500/30 bg-amber-500/5",
  near_physiologic: "border-rose-500/30 bg-rose-500/5",
};

const CORT_TONE: Record<CortisolBand, string> = {
  low: "border-destructive/40 bg-destructive/10 text-destructive",
  indeterminate: "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400",
  adequate: "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
};

const fieldClass =
  "mt-1 h-9 w-full min-w-0 rounded-md border border-border/60 bg-card px-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30";

export default function SteroidTaperCalculator() {
  const [drug, setDrug] = useState("Prednisolone");
  const [dose, setDose] = useState("40");
  const [durationWeeks, setDurationWeeks] = useState("6");
  const [speed, setSpeed] = useState<TaperSpeed>("standard");
  const [target, setTarget] = useState("0");
  const [cortisol, setCortisol] = useState("");
  const [cortisolUnit, setCortisolUnit] = useState<"ugdl" | "nmoll">("ugdl");

  const doseNum = parseFloat(dose);
  const targetNum = parseFloat(target);
  const predEq = !Number.isNaN(doseNum) && doseNum > 0 ? toPrednisoloneEq(drug, doseNum) : NaN;
  const durNum = parseFloat(durationWeeks);
  const activeBand = Number.isNaN(predEq) ? null : doseBand(predEq);

  const invalid =
    Number.isNaN(doseNum) || doseNum <= 0 || doseNum > 1000
      ? "Enter a dose between 0 and 1000 mg"
      : Number.isNaN(durNum) || durNum < 0
        ? "Enter duration in weeks"
        : Number.isNaN(targetNum) || targetNum < 0 || (!Number.isNaN(predEq) && targetNum >= predEq)
          ? "Target prednisolone-equivalent must be ≥ 0 and below the current dose"
          : null;

  const schedule = useMemo(
    () => (invalid || Number.isNaN(predEq) ? [] : buildTaperSchedule(predEq, speed, targetNum)),
    [invalid, predEq, speed, targetNum],
  );
  const totalWeeks = schedule.reduce((sum, step) => sum + step.weeks, 0);

  const cortRaw = parseFloat(cortisol);
  const cortUgDl = Number.isNaN(cortRaw)
    ? NaN
    : cortisolUnit === "ugdl"
      ? cortRaw
      : cortisolUgDlFromNmolL(cortRaw);
  const cortInterp = Number.isNaN(cortUgDl) ? null : interpretMorningCortisolUgDl(cortUgDl);

  const reset = () => {
    setDrug("Prednisolone");
    setDose("40");
    setDurationWeeks("6");
    setSpeed("standard");
    setTarget("0");
    setCortisol("");
    setCortisolUnit("ugdl");
  };

  const planText = () => {
    const lines = [
      "STEROID TAPER PLAN",
      `Drug: ${drug} ${dose} mg/day  (≈ ${roundMg(predEq)} mg prednisolone-equivalent)`,
      `Duration so far: ${durationWeeks} weeks`,
      `Pace: ${TAPER_SPEED[speed].label}`,
      `Target: ${target} mg prednisolone-equivalent`,
      "",
      ...schedule.map(
        (s, i) =>
          `Step ${i + 1}: ${roundMg(fromPrednisoloneEq(drug, s.predEq))} mg ${drug}/day (${roundMg(s.predEq)} mg pred-eq) × ${s.weeks} week(s) — ${s.phase}`,
      ),
      "",
      `Estimated duration: ${totalWeeks} weeks`,
      "",
      "WITHDRAWAL — avoid adrenal insufficiency",
      "• High doses: relatively rapid reduction toward ~10 mg/day prednisolone.",
      "• 10 → 5 mg/day: reduce more slowly.",
      "• Near 5 mg/day: more gradual, to allow HPA-axis recovery.",
      "• Prolonged use or symptoms: 08:00 cortisol <3 µg/dL suggests adrenal insufficiency; >15 µg/dL makes it unlikely; 3–15 µg/dL → consider ACTH stimulation test.",
      "• Ultra-slow tapering is not useful while still well above the physiologic dose; the delicate bottleneck begins near physiologic replacement.",
      "Educational decision support only — verify against local protocol.",
    ];
    return lines.filter(Boolean).join("\n");
  };

  return (
    <div className="space-y-4 min-w-0 w-full overflow-x-clip">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2 min-w-0">
            <TrendingDown className="h-5 w-5 text-primary shrink-0" />
            <CardTitle className="text-xl truncate">Steroid taper</CardTitle>
          </div>
          <CardDescription>Prednisolone-eq · HPA recovery</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 min-w-0">
          <section aria-labelledby="withdraw-heading" className="space-y-2">
            <h2 id="withdraw-heading" className="text-sm font-semibold">
              How to withdraw glucocorticoids without causing adrenal insufficiency
            </h2>
            <ol className="grid gap-2 sm:grid-cols-3 min-w-0">
              {WITHDRAWAL_PHASES.map((phase, i) => (
                <li
                  key={phase.id}
                  className={cn(
                    "rounded-lg border p-3 min-w-0",
                    BAND_TONE[phase.id],
                    activeBand === phase.id && "ring-2 ring-primary/50",
                  )}
                >
                  <div className="flex items-baseline gap-2">
                    <span className="text-[10px] font-mono text-muted-foreground">{i + 1}</span>
                    <p className="text-sm font-semibold leading-tight">{phase.title}</p>
                  </div>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">{phase.dose}</p>
                  <p className="mt-1 text-xs leading-snug">{phase.action}</p>
                </li>
              ))}
            </ol>
            <p className="text-xs text-muted-foreground">
              Key: do not ultra-slow taper while still well above the physiologic dose.
            </p>
            <ReadMore summary="Read more">
              <p>
                It does not make much sense to do an ultra-slow taper while the patient is still well
                above the physiological dose. The delicate bottleneck begins when approaching
                physiological doses (~5 mg/day prednisolone-equivalent), where HPA-axis recovery
                — not disease control — becomes the limiting factor.
              </p>
              <p>
                After prolonged treatment or when withdrawal symptoms occur, check an 08:00 cortisol.
                Below 3 µg/dL suggests adrenal insufficiency; above 15 µg/dL makes it unlikely;
                3–15 µg/dL is indeterminate, so consider ACTH stimulation testing.
              </p>
            </ReadMore>
          </section>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2 min-w-0">
            <Activity className="h-4 w-4 text-primary shrink-0" />
            <CardTitle className="text-base">Morning cortisol (08:00)</CardTitle>
          </div>
          <CardDescription>Prolonged use or symptoms — adrenal insufficiency screen</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 min-w-0">
          <div className="grid grid-cols-3 gap-2 text-center text-[11px] leading-snug">
            <div className={cn("rounded-md border p-2 min-w-0", CORT_TONE.low)}>
              <div className="font-semibold">&lt;3 µg/dL</div>
              <div>AI suggested</div>
            </div>
            <div className={cn("rounded-md border p-2 min-w-0", CORT_TONE.indeterminate)}>
              <div className="font-semibold">3–15 µg/dL</div>
              <div>ACTH stim</div>
            </div>
            <div className={cn("rounded-md border p-2 min-w-0", CORT_TONE.adequate)}>
              <div className="font-semibold">&gt;15 µg/dL</div>
              <div>AI unlikely</div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-[1fr_auto] items-end min-w-0">
            <div className="min-w-0">
              <Label htmlFor="am-cortisol" className="text-xs">
                08:00 serum cortisol
              </Label>
              <Input
                id="am-cortisol"
                type="number"
                min={0}
                inputMode="decimal"
                className="h-9 mt-1"
                placeholder={cortisolUnit === "ugdl" ? "e.g. 8" : "e.g. 220"}
                value={cortisol}
                onChange={(e) => setCortisol(e.target.value)}
              />
            </div>
            <div className="min-w-0">
              <Label htmlFor="cortisol-unit" className="text-xs">
                Unit
              </Label>
              <select
                id="cortisol-unit"
                value={cortisolUnit}
                onChange={(e) => setCortisolUnit(e.target.value as "ugdl" | "nmoll")}
                className={fieldClass}
              >
                <option value="ugdl">µg/dL</option>
                <option value="nmoll">nmol/L</option>
              </select>
            </div>
          </div>

          {cortInterp && (
            <div className={cn("rounded-md border p-3 text-sm min-w-0", CORT_TONE[cortInterp.band])}>
              <p className="font-semibold">{cortInterp.label}</p>
              <ReadMore summary="Read more">{cortInterp.detail}</ReadMore>
            </div>
          )}

          <ReadMore summary="When to test">
            <ul className="list-disc pl-4 space-y-1">
              <li>At or near physiologic dose (≤5 mg prednisolone-equivalent) after ≥3–4 weeks of therapy, or if withdrawal symptoms appear.</li>
              <li>Draw ≥24 h after last hydrocortisone, or ≥48–72 h after prednisolone. Do not measure while on dexamethasone-suppressive doses.</li>
              <li>ACTH test: 250 µg Synacthen; interpret 30/60-min cortisol with the local assay cut-off.</li>
            </ul>
          </ReadMore>
        </CardContent>
      </Card>

      <Collapsible>
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-2 min-w-0">
              <CollapsibleTrigger asChild>
                <button type="button" className="flex min-w-0 flex-1 items-center justify-between gap-2 text-left">
                  <div className="min-w-0">
                    <CardTitle className="text-base">Plan a taper</CardTitle>
                    <CardDescription>Faster above physiologic dose; slower near 5 mg</CardDescription>
                  </div>
                  <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                </button>
              </CollapsibleTrigger>
              <Button size="sm" variant="ghost" onClick={reset} aria-label="Reset taper inputs">
                <RotateCcw className="h-3.5 w-3.5" />
              </Button>
            </div>
          </CardHeader>
          <CollapsibleContent>
        <CardContent className="space-y-3 min-w-0">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5 min-w-0">
            <div className="min-w-0">
              <Label htmlFor="gc-drug" className="text-xs">
                Glucocorticoid
              </Label>
              <select
                id="gc-drug"
                value={drug}
                onChange={(e) => setDrug(e.target.value)}
                className={fieldClass}
              >
                {GLUCOCORTICOID_NAMES.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </div>
            <div className="min-w-0">
              <Label htmlFor="gc-dose" className="text-xs">
                Current dose (mg/day)
              </Label>
              <Input
                id="gc-dose"
                type="number"
                min={0}
                className="h-9 mt-1"
                value={dose}
                onChange={(e) => setDose(e.target.value)}
              />
            </div>
            <div className="min-w-0">
              <Label htmlFor="gc-duration" className="text-xs">
                Duration so far (weeks)
              </Label>
              <Input
                id="gc-duration"
                type="number"
                min={0}
                className="h-9 mt-1"
                value={durationWeeks}
                onChange={(e) => setDurationWeeks(e.target.value)}
              />
            </div>
            <div className="min-w-0">
              <Label htmlFor="gc-pace" className="text-xs">
                Taper pace
              </Label>
              <select
                id="gc-pace"
                value={speed}
                onChange={(e) => setSpeed(e.target.value as TaperSpeed)}
                className={fieldClass}
              >
                {Object.entries(TAPER_SPEED).map(([key, value]) => (
                  <option key={key} value={key}>
                    {value.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="min-w-0">
              <Label htmlFor="gc-target" className="text-xs">
                Target (mg pred-eq)
              </Label>
              <Input
                id="gc-target"
                type="number"
                min={0}
                className="h-9 mt-1"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
              />
            </div>
          </div>

          {invalid ? (
            <p className="text-xs text-amber-700 dark:text-amber-400">{invalid}</p>
          ) : (
            <>
              <div className="flex flex-wrap gap-2 min-w-0">
                <Badge variant="outline" className="whitespace-normal">
                  ≈ {roundMg(predEq)} mg/d prednisolone-eq
                </Badge>
                <Badge variant="outline">{schedule.length} steps</Badge>
                <Badge variant="outline">~{totalWeeks} weeks</Badge>
              </div>

              <div className="overflow-x-auto overscroll-x-contain rounded-md border border-border min-w-0">
                <table className="w-full text-xs">
                  <thead className="bg-muted/50 text-left">
                    <tr>
                      <th className="p-2">Step</th>
                      <th className="p-2">Phase</th>
                      <th className="p-2">{drug}</th>
                      <th className="p-2">Pred-eq</th>
                      <th className="p-2">Hold</th>
                    </tr>
                  </thead>
                  <tbody>
                    {schedule.length === 0 ? (
                      <tr>
                        <td className="p-2 text-muted-foreground" colSpan={5}>
                          No taper needed for these inputs.
                        </td>
                      </tr>
                    ) : (
                      schedule.map((step, i) => (
                        <tr key={`${step.predEq}-${i}`} className="border-t border-border">
                          <td className="p-2 font-medium">{i + 1}</td>
                          <td className="p-2 text-muted-foreground">{step.phase}</td>
                          <td className="p-2">{roundMg(fromPrednisoloneEq(drug, step.predEq))} mg/d</td>
                          <td className="p-2">{roundMg(step.predEq)} mg</td>
                          <td className="p-2">{step.weeks} wk</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyToClipboard(planText(), "Taper plan copied")}
                >
                  <Copy className="mr-1 h-3.5 w-3.5" /> Copy
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => downloadTextFile("steroid-taper-plan.txt", planText())}
                >
                  <FileDown className="mr-1 h-3.5 w-3.5" /> Download
                </Button>
              </div>
            </>
          )}

          <p className="text-[11px] text-muted-foreground">
            Educational decision support. Confirm against local protocol and clinical judgement.
            Individualise for disease activity, prior flares, and comorbidities.
          </p>
        </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    </div>
  );
}
