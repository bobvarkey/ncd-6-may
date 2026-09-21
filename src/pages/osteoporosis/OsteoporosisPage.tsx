import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  Bone,
  CheckCircle2,
  ClipboardList,
  Info,
  RotateCcw,
  ShieldAlert,
  Stethoscope,
} from "lucide-react";
import Seo from "@/components/Seo";
import ZoomableImage from "@/components/ZoomableImage";
import ImageLink from "@/components/ImageLink";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TakeHomeMessage } from "@/components/ui/take-home-message";
import { cn } from "@/lib/utils";
import {
  ALGORITHM,
  EMPTY_ASSESSMENT,
  JSON_THRESHOLDS,
  classifyOsteoporosis,
  type DxaStatus,
  type FraxFlag,
  type OsteoporosisAssessmentInput,
  type Population,
  type TherapyClass,
  type TriState,
} from "./classifier";

const FLOWCHART_SRC = "/images/osteoporosis-algorithm-flowchart-v3.png";

type PillOption<T extends string> = { value: T; label: string };

function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
  hint,
}: {
  label: string;
  value: T;
  options: PillOption<T>[];
  onChange: (value: T) => void;
  hint?: string;
}) {
  return (
    <div className="min-w-0 space-y-1.5">
      <p className="text-sm font-medium">{label}</p>
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      <div className="flex flex-wrap gap-1.5">
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            aria-pressed={value === opt.value}
            onClick={() => onChange(opt.value)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors min-h-9",
              value === opt.value
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border/60 bg-background/60 text-muted-foreground hover:bg-muted",
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function NumberField({
  id,
  label,
  value,
  onChange,
  placeholder,
  step = "any",
  hint,
}: {
  id: string;
  label: string;
  value: number | null;
  onChange: (value: number | null) => void;
  placeholder?: string;
  step?: string;
  hint?: string;
}) {
  return (
    <div className="min-w-0 space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        inputMode="decimal"
        type="number"
        step={step}
        placeholder={placeholder}
        value={value ?? ""}
        onChange={(e) => {
          const raw = e.target.value;
          onChange(raw === "" ? null : Number(raw));
        }}
      />
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

const TRI: PillOption<TriState>[] = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
  { value: "unknown", label: "Unknown" },
];

const POPULATION: PillOption<Population>[] = [
  { value: "postmenopausal_woman", label: "Postmenopausal woman" },
  { value: "man_50_or_older", label: "Man ≥50 years" },
  { value: "premenopausal_woman", label: "Premenopausal woman" },
  { value: "man_under_50", label: "Man <50 years" },
];

const DXA: PillOption<DxaStatus>[] = [
  { value: "completed", label: "Completed" },
  { value: "not_indicated", label: "Not indicated" },
  { value: "pending", label: "Pending" },
  { value: "unavailable", label: "Unavailable" },
  { value: "uninterpretable", label: "Uninterpretable" },
];

const FRAX: PillOption<FraxFlag>[] = [
  { value: "yes", label: "Above national threshold" },
  { value: "no", label: "Below national threshold" },
  { value: "not_indicated", label: "Not indicated" },
  { value: "unknown", label: "Unknown" },
];

const THERAPY: PillOption<TherapyClass>[] = [
  { value: "none", label: "None" },
  { value: "oral_bisphosphonate", label: "Oral BP" },
  { value: "iv_bisphosphonate", label: "IV BP" },
  { value: "denosumab", label: "Denosumab" },
  { value: "anabolic", label: "Anabolic" },
  { value: "other", label: "Other" },
];

function categoryTone(category: string): string {
  switch (category) {
    case "very_high":
      return "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30";
    case "high":
      return "bg-amber-500/10 text-amber-800 dark:text-amber-300 border-amber-500/30";
    case "low":
      return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30";
    case "intermediate_assessment_risk":
      return "bg-violet-500/10 text-violet-700 dark:text-violet-300 border-violet-500/30";
    default:
      return "bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/30";
  }
}

function pretty(value: string): string {
  return value.replace(/_/g, " ");
}

export default function OsteoporosisPage() {
  const [input, setInput] = useState<OsteoporosisAssessmentInput>(EMPTY_ASSESSMENT);
  const set = <K extends keyof OsteoporosisAssessmentInput>(key: K, value: OsteoporosisAssessmentInput[K]) =>
    setInput((prev) => ({ ...prev, [key]: value }));

  const result = useMemo(() => classifyOsteoporosis(input), [input]);

  return (
    <div className="max-w-4xl mx-auto w-full min-w-0 overflow-x-clip space-y-6">
      <Seo
        title="Bone health and osteoporosis algorithm"
        description="Interactive clinician decision support for fracture-risk classification, screening, treatment routing and follow-up. Driven by algorithm 3.0 JSON; not a FRAX calculator."
        path="/osteoporosis"
      />

      <header className="space-y-3 min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="border-lime-500/40 text-lime-800 dark:text-lime-300">
            Bone health
          </Badge>
          <Badge variant="outline">Schema {ALGORITHM.schema_version}</Badge>
          <Badge variant="outline">Algorithm {ALGORITHM.algorithm_version}</Badge>
        </div>
        <h1 className="text-2xl sm:text-3xl font-heading font-semibold tracking-tight flex items-start gap-2 min-w-0">
          <Bone className="h-7 w-7 text-primary shrink-0 mt-0.5" />
          <span className="min-w-0">{ALGORITHM.title}</span>
        </h1>
        <p className="text-sm text-muted-foreground">{ALGORITHM.purpose}</p>
        <p className="text-sm text-muted-foreground">{ALGORITHM.scope}</p>
      </header>

      <div className="flex items-start gap-3 bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-3 text-sm">
        <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0 text-amber-600 dark:text-amber-400" />
        <p>
          Educational decision support transcribed from the v3 JSON. FRAX is a <strong>national-threshold flag only</strong>
          {" "}— this page does not calculate FRAX. T-score very-high remains SEIOMM <strong>&lt; -3.5</strong> (not NOGG ≤ -3.5).
        </p>
      </div>

      <Card className="border-border/60 min-w-0">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-primary" />
            Assessment inputs
          </CardTitle>
          <CardDescription>{ALGORITHM.assessment.missing_data}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 min-w-0">
          <section className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Urgent check</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {(
                [
                  ["suspectedAcuteFracture", "Suspected acute / hip fracture"],
                  ["severeBackPainOrHeightLoss", "Severe back pain or height loss"],
                  ["neurologicalDeficit", "Neurological deficit"],
                ] as const
              ).map(([key, label]) => (
                <label
                  key={key}
                  className={cn(
                    "flex items-start gap-2 rounded-lg border px-3 py-2 text-sm min-w-0",
                    input[key] ? "border-rose-500/40 bg-rose-500/10" : "border-border",
                  )}
                >
                  <input
                    type="checkbox"
                    className="mt-1"
                    checked={input[key]}
                    onChange={(e) => set(key, e.target.checked)}
                  />
                  <span>{label}</span>
                </label>
              ))}
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Pathway</h2>
            <Segmented
              label="Who is this for?"
              value={input.population}
              options={POPULATION}
              onChange={(value) => set("population", value)}
              hint={ALGORITHM.entry_triage.outside_main_scope}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <NumberField
                id="age"
                label="Age (years)"
                value={input.ageYears}
                onChange={(v) => set("ageYears", v)}
                placeholder="e.g. 68"
                step="1"
              />
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Fragility fractures</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <NumberField
                id="vertebral-count"
                label="Vertebral fracture count"
                value={input.vertebralFractureCount}
                onChange={(v) => set("vertebralFractureCount", v)}
                placeholder="Unknown if blank"
                step="1"
                hint={`Very high if at least ${JSON_THRESHOLDS.vertebralCountVeryHigh.value} vertebral fractures, or vertebral + hip.`}
              />
              <NumberField
                id="years-since-fracture"
                label="Years since most recent fragility fracture"
                value={input.yearsSinceMostRecentFragilityFracture}
                onChange={(v) => set("yearsSinceMostRecentFragilityFracture", v)}
                placeholder="Leave blank if none/unknown"
                hint={`Recent-fracture window in JSON: previous ${JSON_THRESHOLDS.recentFractureYears.value} years.`}
              />
              <Segmented label="Hip fracture" value={input.hipFracture} options={TRI} onChange={(v) => set("hipFracture", v)} />
              <Segmented
                label="Other fragility fracture (e.g. humeral, pelvic)"
                value={input.otherFragilityFracture}
                options={TRI}
                onChange={(v) => set("otherFragilityFracture", v)}
              />
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">DXA / BMD status</h2>
            <p className="text-xs text-muted-foreground">{ALGORITHM.bone_density_status.override}</p>
            <Segmented label="DXA status" value={input.dxaStatus} options={DXA} onChange={(v) => set("dxaStatus", v)} />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <NumberField
                id="t-score"
                label="Diagnostic T-score (lowest valid central site)"
                value={input.diagnosticTScore}
                onChange={(v) => set("diagnosticTScore", v)}
                placeholder="e.g. -2.7"
                hint={`Very high only if ${JSON_THRESHOLDS.veryHighTScore.source}. High if ${JSON_THRESHOLDS.highTScore.source}.`}
              />
              <NumberField
                id="fn-t-score"
                label="Femoral-neck T-score (follow-up)"
                value={input.femoralNeckTScore}
                onChange={(v) => set("femoralNeckTScore", v)}
                placeholder="optional"
              />
              <NumberField
                id="z-score"
                label="Z-score (younger adults)"
                value={input.zScore}
                onChange={(v) => set("zScore", v)}
                placeholder="optional"
                hint={ALGORITHM.entry_triage.younger_adult_dxa}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {(
                [
                  ["lowBodyWeight", "Low body weight"],
                  ["highRiskMedicines", "High-risk medicines"],
                  ["boneLossCondition", "Bone-loss condition"],
                ] as const
              ).map(([key, label]) => (
                <label key={key} className="flex items-start gap-2 rounded-lg border border-border px-3 py-2 text-sm min-w-0">
                  <input type="checkbox" className="mt-1" checked={input[key]} onChange={(e) => set(key, e.target.checked)} />
                  <span>{label}</span>
                </label>
              ))}
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">FRAX (flag only)</h2>
            <TakeHomeMessage title="No FRAX calculator" variant="caution">
              Record whether country-appropriate FRAX sits above the applicable national treatment threshold. Do not enter 10-year probabilities here. {ALGORITHM.screening_and_assessment.frax}
            </TakeHomeMessage>
            <Segmented
              label="FRAX versus applicable national treatment threshold"
              value={input.fraxVsNationalThreshold}
              options={FRAX}
              onChange={(v) => set("fraxVsNationalThreshold", v)}
            />
            <Segmented
              label="Selected local policy: intermediate assessment band (DXA / further assessment before treatment)?"
              value={input.intermediateAssessmentBand}
              options={TRI}
              onChange={(v) => set("intermediateAssessmentBand", v)}
              hint={ALGORITHM.screening_and_assessment.intermediate_risk}
            />
          </section>

          <section className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Special-scenario review (every patient)</h2>
            <p className="text-xs text-muted-foreground">
              {ALGORITHM.mandatory_special_scenario_review.principles[0]} {ALGORITHM.mandatory_special_scenario_review.principles[1]}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <NumberField
                id="gc-dose"
                label="Prednisolone-equivalent dose (mg/day)"
                value={input.prednisoloneEquivalentMgPerDay}
                onChange={(v) => set("prednisoloneEquivalentMgPerDay", v)}
                placeholder="blank if none"
                hint={ALGORITHM.mandatory_special_scenario_review.scenarios.find((s) => s.id === "glucocorticoids")?.note}
              />
              <NumberField
                id="gc-months"
                label="Glucocorticoid duration (months)"
                value={input.glucocorticoidMonths}
                onChange={(v) => set("glucocorticoidMonths", v)}
                placeholder="blank if none"
                step="1"
              />
              <Segmented label="Frequent falls / high falls risk" value={input.frequentFalls} options={TRI} onChange={(v) => set("frequentFalls", v)} />
              <Segmented label="Frailty" value={input.frailty} options={TRI} onChange={(v) => set("frailty", v)} />
              <Segmented label="New fragility fracture on treatment" value={input.fractureOnTreatment} options={TRI} onChange={(v) => set("fractureOnTreatment", v)} />
              <Segmented label="Advanced CKD or suspected CKD-MBD" value={input.advancedCkdOrCkdMbd} options={TRI} onChange={(v) => set("advancedCkdOrCkdMbd", v)} />
              <Segmented label="Secondary causes unresolved" value={input.secondaryCausesUnresolved} options={TRI} onChange={(v) => set("secondaryCausesUnresolved", v)} />
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Treatment history</h2>
            <p className="text-xs text-muted-foreground">{ALGORITHM.entry_triage.previous_treatment}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Segmented label="Current osteoporosis therapy" value={input.currentTherapy} options={TRI} onChange={(v) => set("currentTherapy", v)} />
              <Segmented label="Previous osteoporosis diagnosis" value={input.previousOsteoporosisDiagnosis} options={TRI} onChange={(v) => set("previousOsteoporosisDiagnosis", v)} />
              <Segmented label="Previous denosumab exposure" value={input.previousDenosumab} options={TRI} onChange={(v) => set("previousDenosumab", v)} />
              <Segmented label="Therapy class" value={input.therapyClass} options={THERAPY} onChange={(v) => set("therapyClass", v)} />
              <NumberField
                id="tx-years"
                label="Therapy duration (years)"
                value={input.therapyDurationYears}
                onChange={(v) => set("therapyDurationYears", v)}
                placeholder="optional"
                step="any"
              />
            </div>
            <label className="flex items-start gap-2 rounded-lg border border-border px-3 py-2 text-sm min-w-0">
              <input
                type="checkbox"
                className="mt-1"
                checked={input.clinicalReviewComplete}
                onChange={(e) => set("clinicalReviewComplete", e.target.checked)}
              />
              <span>Special-scenario clinical review is complete (do not tick to skip review).</span>
            </label>
          </section>

          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={() => setInput(EMPTY_ASSESSMENT)}>
              <RotateCcw className="h-4 w-4" />
              Reset
            </Button>
            <Button type="button" variant="ghost" asChild>
              <a href="#flowchart">View educational flowchart</a>
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/60 min-w-0">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Stethoscope className="h-5 w-5 text-primary" />
            Classification
          </CardTitle>
          <CardDescription>
            BMD status is independent of fracture risk. assessment_incomplete is a status, not a risk category.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 min-w-0">
          {result.urgent ? (
            <TakeHomeMessage title="Urgent" variant="warning">
              {result.urgentMessages.join(" ")}
            </TakeHomeMessage>
          ) : null}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className={cn("rounded-xl border p-4 min-w-0", categoryTone(result.finalCategory))}>
              <p className="text-xs uppercase tracking-wide font-semibold">Final risk category</p>
              <p className="text-2xl font-bold capitalize break-words">{pretty(result.finalCategory)}</p>
              <p className="text-xs mt-1">Allowed finals: {ALGORITHM.final_decision.allowed_categories.join(", ")}</p>
            </div>
            <div className={cn("rounded-xl border p-4 min-w-0", categoryTone(result.baselineCategory))}>
              <p className="text-xs uppercase tracking-wide font-semibold">Baseline (evaluate in order)</p>
              <p className="text-2xl font-bold capitalize break-words">{pretty(result.baselineCategory)}</p>
              {result.establishedRiskCategory ? (
                <p className="text-xs mt-1">Preserved established risk: {pretty(result.establishedRiskCategory)}</p>
              ) : null}
            </div>
            <div className="rounded-xl border border-border bg-muted/40 p-4 min-w-0">
              <p className="text-xs uppercase tracking-wide font-semibold text-muted-foreground">BMD status (not fracture risk)</p>
              <p className="text-lg font-semibold capitalize">{pretty(result.bmdStatus)}</p>
              <p className="text-xs text-muted-foreground mt-1">{result.bmdMeaning}</p>
            </div>
            <div className="rounded-xl border border-border bg-muted/40 p-4 min-w-0">
              <p className="text-xs uppercase tracking-wide font-semibold text-muted-foreground">Assessment status</p>
              <p className="text-lg font-semibold capitalize flex items-center gap-2">
                {result.assessmentStatus === "complete" ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                ) : (
                  <Info className="h-4 w-4 text-amber-500" />
                )}
                {result.assessmentStatus}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Review: {result.clinicalReviewStatus}. This status is not a substitute for high / very high / low.
              </p>
            </div>
          </div>

          {result.matchedCriteria.length > 0 ? (
            <div>
              <h3 className="text-sm font-semibold mb-2">Matched JSON criteria</h3>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                {result.matchedCriteria.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
            </div>
          ) : null}

          {result.specialScenarios.length > 0 ? (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold">Special-scenario flags</h3>
              {result.specialScenarios.map((s) => (
                <div key={`${s.id}-${s.summary}`} className="rounded-lg border border-border px-3 py-2 text-sm min-w-0">
                  <p className="font-medium">
                    {s.id.replace(/_/g, " ")}
                    {s.noggVeryHighIndicator ? (
                      <Badge variant="outline" className="ml-2">NOGG very-high indicator</Badge>
                    ) : null}
                    <Badge variant="outline" className="ml-2">no automatic upgrade</Badge>
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">{s.action}</p>
                </div>
              ))}
            </div>
          ) : null}

          <TakeHomeMessage title="Next action" variant={result.urgent ? "warning" : "key-point"}>
            {result.nextAction}
          </TakeHomeMessage>

          {result.drugSelection.pathway ? (
            <div className="rounded-xl border border-border p-4 space-y-2 min-w-0">
              <h3 className="text-sm font-semibold">Drug selection ({pretty(result.drugSelection.pathway)})</h3>
              {result.drugSelection.consider.length > 0 ? (
                <ul className="text-sm space-y-1">
                  {result.drugSelection.consider.map((d) => (
                    <li key={d.drug}>
                      <strong className="capitalize">{d.drug}</strong>
                      {d.months ? ` — ${d.months} months` : ""}
                      {d.note ? ` (${d.note})` : ""}
                    </li>
                  ))}
                </ul>
              ) : null}
              {result.drugSelection.sequence ? <p className="text-sm text-muted-foreground">{result.drugSelection.sequence}</p> : null}
              {result.drugSelection.preferred ? <p className="text-sm">Preferred: {result.drugSelection.preferred}</p> : null}
              {result.drugSelection.alternative ? <p className="text-sm">Alternative: {result.drugSelection.alternative}</p> : null}
              {result.drugSelection.note ? <p className="text-xs text-muted-foreground">{result.drugSelection.note}</p> : null}
              <p className="text-xs text-muted-foreground">Factors: {ALGORITHM.drug_selection.factors.join("; ")}.</p>
            </div>
          ) : null}

          {result.followUp.indicated ? (
            <div className="rounded-xl border border-border p-4 space-y-2 min-w-0">
              <h3 className="text-sm font-semibold">Follow-up (current / previous treatment)</h3>
              {result.followUp.persistentHighRisk ? (
                <p className="text-sm">Persistent high-risk indicators: {result.followUp.persistentHighRiskIndicators.join("; ")}</p>
              ) : (
                <p className="text-sm text-muted-foreground">Reassess current risk before pause or continuation.</p>
              )}
              <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                {result.followUp.plan.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </div>
          ) : null}

          {result.prevention.indicated ? (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 space-y-2 min-w-0">
              <h3 className="text-sm font-semibold">Untreated / prevention pathway</h3>
              <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                {result.prevention.summary.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </div>
          ) : null}

          <div>
            <h3 className="text-sm font-semibold mb-2">Rationale</h3>
            <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
              {result.rationale.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </div>

          {result.safetyAlerts.length > 0 ? (
            <TakeHomeMessage title="Safety rules" variant="warning">
              {result.safetyAlerts.join("\n\n")}
            </TakeHomeMessage>
          ) : null}

          <p className="text-xs text-muted-foreground">
            Related tools:{" "}
            <Link className="text-primary underline" to="/vitamin-d">Vitamin D</Link>
            {" · "}
            <Link className="text-primary underline" to="/geriatrics?tab=fractures">Geriatrics — fragility fractures</Link>
            {" · "}
            <Link className="text-primary underline" to="/steroid-taper">Steroid taper</Link>
          </p>
        </CardContent>
      </Card>

      <Card id="flowchart" className="border-border/60 min-w-0 overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-primary" />
            Educational flowchart (version 3)
          </CardTitle>
          <CardDescription>Companion graphic for the JSON algorithm. Tap to zoom; pinch/scroll in the lightbox. Not a substitute for the interactive classifier.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 min-w-0">
          <figure className="space-y-2 min-w-0">
            <ZoomableImage
              src={FLOWCHART_SRC}
              alt="Bone health and osteoporosis version 3 educational flowchart: screening, BMD versus fracture risk, initial risk, special-scenario review, treatment pathways and follow-up"
              className="w-full h-auto max-w-full rounded-lg border border-border/60"
            />
            <figcaption className="text-xs text-muted-foreground text-center">
              Version 3 synthesis: supplied SEIOMM-based criteria + NOGG + ISCD + KDIGO. Source T-score &lt; -3.5 retained; NOGG uses ≤ -3.5.
            </figcaption>
          </figure>
          <ImageLink imageId="osteoporosis-algorithm-flowchart-v3" label="Open flowchart in image gallery →" />
        </CardContent>
      </Card>
    </div>
  );
}
