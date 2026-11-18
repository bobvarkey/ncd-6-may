import { useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Copy,
  Download,
  Info,
  RotateCcw,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { copyToClipboard, downloadTextFile, parseClinicalValue } from "@/lib/clinical-utils";
import { cn } from "@/lib/utils";
import {
  APB_DML_NORMAL_UPPER_LIMIT_MS,
  APB_DML_SEVERE_CUTOFF_MS,
  CTS_ABBREVIATIONS,
  CTS_GRADES,
  CTS_GRADING_SCALE,
  gradeCts,
  type CtsInputs,
  type MotorResponse,
  type SensoryResponse,
  type SensoryVelocity,
  type TriState,
} from "@/data/cts-grading-scale";

const GRADE_TONE: Record<number, { text: string; border: string; surface: string; dot: string }> = {
  0: {
    text: "text-emerald-700 dark:text-emerald-300",
    border: "border-emerald-500/40",
    surface: "bg-emerald-500/10",
    dot: "bg-emerald-500",
  },
  1: {
    text: "text-teal-700 dark:text-teal-300",
    border: "border-teal-500/40",
    surface: "bg-teal-500/10",
    dot: "bg-teal-500",
  },
  2: {
    text: "text-sky-700 dark:text-sky-300",
    border: "border-sky-500/40",
    surface: "bg-sky-500/10",
    dot: "bg-sky-500",
  },
  3: {
    text: "text-amber-700 dark:text-amber-300",
    border: "border-amber-500/45",
    surface: "bg-amber-500/10",
    dot: "bg-amber-500",
  },
  4: {
    text: "text-orange-700 dark:text-orange-300",
    border: "border-orange-500/45",
    surface: "bg-orange-500/10",
    dot: "bg-orange-500",
  },
  5: {
    text: "text-rose-700 dark:text-rose-300",
    border: "border-rose-500/45",
    surface: "bg-rose-500/10",
    dot: "bg-rose-500",
  },
  6: {
    text: "text-red-700 dark:text-red-300",
    border: "border-red-600/45",
    surface: "bg-red-500/10",
    dot: "bg-red-600",
  },
};

const SENSITIVE_OPTIONS: { value: TriState; label: string }[] = [
  { value: "not-done", label: "Not documented" },
  { value: "normal", label: "Normal" },
  { value: "abnormal", label: "Abnormal" },
];

const VELOCITY_OPTIONS: { value: SensoryVelocity; label: string }[] = [
  { value: "not-done", label: "Not documented" },
  { value: "normal", label: "Normal" },
  { value: "slowed", label: "Slowed" },
];

const SENSORY_OPTIONS: { value: SensoryResponse; label: string }[] = [
  { value: "not-done", label: "Not documented" },
  { value: "present", label: "Present" },
  { value: "absent", label: "Absent" },
  { value: "unrecordable", label: "Effectively unrecordable" },
];

const MOTOR_OPTIONS: { value: MotorResponse; label: string }[] = [
  { value: "not-done", label: "Not documented" },
  { value: "present", label: "Present" },
  { value: "unrecordable", label: "Effectively unrecordable" },
];

function FieldSelect({
  id,
  label,
  value,
  onChange,
  options,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs">
        {label}
      </Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id={id} className="h-9 bg-card">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="bg-card">
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export function CtsGradingCalculator() {
  const [sensitive, setSensitive] = useState<TriState>("not-done");
  const [velocity, setVelocity] = useState<SensoryVelocity>("not-done");
  const [sensory, setSensory] = useState<SensoryResponse>("not-done");
  const [motor, setMotor] = useState<MotorResponse>("not-done");
  const [dml, setDml] = useState("");
  const [cmap, setCmap] = useState("");

  const result = useMemo(() => {
    const inputs: CtsInputs = {
      sensitiveComparisonTests: sensitive,
      medianSensoryConductionVelocity: velocity,
      medianSensoryResponse: sensory,
      medianMotorResponse: motor,
      apbDistalMotorLatencyMs: parseClinicalValue(dml),
      apbCmapAmplitudeMv: parseClinicalValue(cmap),
    };
    return gradeCts(inputs);
  }, [sensitive, velocity, sensory, motor, dml, cmap]);

  const reset = () => {
    setSensitive("not-done");
    setVelocity("not-done");
    setSensory("not-done");
    setMotor("not-done");
    setDml("");
    setCmap("");
  };

  const clinicalNote = () =>
    [
      "BLAND NEUROPHYSIOLOGICAL GRADING — CARPAL TUNNEL SYNDROME",
      `Date: ${new Date().toLocaleString()}`,
      "",
      "Nerve conduction findings:",
      `- Sensitive comparison tests: ${labelFor(SENSITIVE_OPTIONS, sensitive)}`,
      `- Median sensory conduction velocity: ${labelFor(VELOCITY_OPTIONS, velocity)}`,
      `- Median sensory response: ${labelFor(SENSORY_OPTIONS, sensory)}`,
      `- Median motor response (APB): ${labelFor(MOTOR_OPTIONS, motor)}`,
      `- APB distal motor latency: ${dml ? `${parseClinicalValue(dml)} ms` : "not entered"}`,
      `- APB CMAP amplitude: ${cmap ? `${parseClinicalValue(cmap)} mV` : "not entered"}`,
      "",
      "Result:",
      `- Grade: ${result.grade}/6`,
      `- Severity: ${result.severity}`,
      `- ${result.description}`,
      "",
      "Reference: Bland neurophysiological grading scale for carpal tunnel syndrome.",
    ].join("\n");

  const tone = GRADE_TONE[result.grade] ?? GRADE_TONE[0];

  return (
    <div className="space-y-4">
      <Card className="border-border/40">
        <CardHeader className="pb-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="h-4 w-4 text-cyan-600" />
              Bland CTS Neurophysiological Grading
            </CardTitle>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => copyToClipboard(clinicalNote(), "Bland CTS grade copied")}
                disabled={!result.hasData}
                title="Copy result"
              >
                <Copy className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => downloadTextFile("Bland_CTS_Grading", clinicalNote())}
                disabled={!result.hasData}
                title="Download result"
              >
                <Download className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={reset} title="Reset">
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Electrophysiological severity classification of median neuropathy at the wrist (grades 0–6),
            graded from routine nerve conduction studies to the abductor pollicis brevis (APB).
          </p>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Sensory studies
            </h3>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <FieldSelect
                id="cts-sensitive"
                label="Sensitive comparison tests"
                value={sensitive}
                onChange={(value) => setSensitive(value as TriState)}
                options={SENSITIVE_OPTIONS}
              />
              <FieldSelect
                id="cts-velocity"
                label="Median sensory conduction velocity"
                value={velocity}
                onChange={(value) => setVelocity(value as SensoryVelocity)}
                options={VELOCITY_OPTIONS}
              />
              <FieldSelect
                id="cts-sensory"
                label="Median sensory response (finger–wrist)"
                value={sensory}
                onChange={(value) => setSensory(value as SensoryResponse)}
                options={SENSORY_OPTIONS}
              />
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Motor studies (APB)
            </h3>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <FieldSelect
                id="cts-motor"
                label="Median motor response"
                value={motor}
                onChange={(value) => setMotor(value as MotorResponse)}
                options={MOTOR_OPTIONS}
              />
              <div className="space-y-1.5">
                <Label htmlFor="cts-dml" className="text-xs">
                  Distal motor latency (ms)
                </Label>
                <Input
                  id="cts-dml"
                  type="number"
                  inputMode="decimal"
                  step="0.1"
                  min="0"
                  placeholder="e.g. 5.2"
                  value={dml}
                  onChange={(event) => setDml(event.target.value)}
                  className="h-9 bg-card"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cts-cmap" className="text-xs">
                  CMAP amplitude (mV)
                </Label>
                <Input
                  id="cts-cmap"
                  type="number"
                  inputMode="decimal"
                  step="0.1"
                  min="0"
                  placeholder="e.g. 4.5"
                  value={cmap}
                  onChange={(event) => setCmap(event.target.value)}
                  className="h-9 bg-card"
                />
              </div>
            </div>
          </div>

          <p className="text-[11px] leading-relaxed text-muted-foreground">
            Normal distal motor latency is laboratory-specific; this tool uses{" "}
            {APB_DML_NORMAL_UPPER_LIMIT_MS} ms as a typical upper limit of normal and{" "}
            {APB_DML_SEVERE_CUTOFF_MS} ms as the grade 5 cut-off. Temperature, distance and electrode
            placement should be documented alongside the grade.
          </p>

          <div className="flex flex-wrap gap-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground self-center">
              Abbreviations
            </span>
            {Object.entries(CTS_ABBREVIATIONS).map(([abbr, full]) => (
              <span
                key={abbr}
                className="rounded-full border border-border/60 bg-muted/30 px-2 py-0.5 text-[10px] text-muted-foreground"
                title={full}
              >
                <span className="font-semibold text-foreground">{abbr}</span> {full}
              </span>
            ))}
          </div>
        </CardContent>
      </Card>

      {result.hasData ? (
        <Card className={cn("border-border/40", tone.surface, tone.border)}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              {result.grade <= 2 ? (
                <CheckCircle2 className={cn("h-4 w-4", tone.text)} />
              ) : (
                <AlertTriangle className={cn("h-4 w-4", tone.text)} />
              )}
              Result
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Bland grade</p>
                <p className={cn("text-4xl font-heading font-bold", tone.text)}>
                  {result.grade}
                  <span className="text-lg font-medium text-muted-foreground"> / 6</span>
                </p>
                <p className={cn("text-lg font-semibold", tone.text)}>{result.severity}</p>
              </div>
              <div className="max-w-md text-sm text-muted-foreground">{result.description}</div>
            </div>

            <div className="grid grid-cols-7 gap-1.5" aria-hidden>
              {CTS_GRADES.map((definition) => {
                const gradeTone = GRADE_TONE[definition.grade];
                const active = definition.grade === result.grade;
                return (
                  <div
                    key={definition.grade}
                    title={`Grade ${definition.grade} — ${definition.severity}`}
                    className={cn(
                      "rounded-md border px-1 py-1.5 text-center transition-all",
                      gradeTone.border,
                      active ? gradeTone.surface : "bg-background/40 opacity-60",
                    )}
                  >
                    <div className={cn("text-sm font-bold", gradeTone.text)}>{definition.grade}</div>
                    <div className="truncate text-[9px] text-muted-foreground">{definition.severity}</div>
                  </div>
                );
              })}
            </div>

            {result.matchedCriteria.length > 0 && (
              <div>
                <h4 className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Criteria applied
                </h4>
                <ul className="space-y-1 text-sm">
                  {result.matchedCriteria.map((criterion) => (
                    <li key={criterion} className="flex items-start gap-2">
                      <span className={cn("mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full", tone.dot)} />
                      <span>{criterion}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {result.notes.length > 0 && (
              <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
                <h4 className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-amber-700 dark:text-amber-300">
                  <Info className="h-3.5 w-3.5" />
                  Interpretation notes
                </h4>
                <ul className="list-disc space-y-1 pl-4 text-xs text-muted-foreground">
                  {result.notes.map((note) => (
                    <li key={note}>{note}</li>
                  ))}
                </ul>
              </div>
            )}

            <p className="text-[11px] text-muted-foreground">
              {CTS_GRADING_SCALE.clinicalApplication.purpose} · Assessed by{" "}
              {CTS_GRADING_SCALE.clinicalApplication.assessmentMethod.toLowerCase()}.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-dashed border-border/60 bg-muted/10">
          <CardContent className="flex items-start gap-3 py-6">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Enter the nerve conduction findings above to assign a Bland grade. A grade is only shown
              once at least one finding is documented.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function labelFor(options: { value: string; label: string }[], value: string) {
  return options.find((option) => option.value === value)?.label ?? value;
}

export function CtsGradingReference() {
  return (
    <div className="space-y-4">
      <Card className="border-border/40">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{CTS_GRADING_SCALE.title}</CardTitle>
          <p className="text-xs text-muted-foreground">
            {CTS_GRADING_SCALE.scaleName} · {CTS_GRADING_SCALE.condition} (
            {CTS_GRADING_SCALE.abbreviation})
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border">
                  <th className="py-2 pr-3 text-left font-semibold">Grade</th>
                  <th className="py-2 pr-3 text-left font-semibold">Severity</th>
                  <th className="py-2 pr-3 text-left font-semibold">Description</th>
                  <th className="py-2 text-left font-semibold">Defining criteria</th>
                </tr>
              </thead>
              <tbody>
                {CTS_GRADES.map((definition) => {
                  const tone = GRADE_TONE[definition.grade];
                  return (
                    <tr key={definition.grade} className="border-b border-border/40 align-top">
                      <td className={cn("py-2 pr-3 text-base font-bold", tone.text)}>
                        {definition.grade}
                      </td>
                      <td className={cn("py-2 pr-3 font-medium", tone.text)}>{definition.severity}</td>
                      <td className="py-2 pr-3 text-muted-foreground">{definition.description}</td>
                      <td className="py-2 text-muted-foreground">{definition.summary}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-border/40 bg-muted/20 p-3">
              <h4 className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Clinical application
              </h4>
              <ul className="space-y-1 text-xs text-muted-foreground">
                <li>
                  <span className="font-medium text-foreground">Purpose: </span>
                  {CTS_GRADING_SCALE.clinicalApplication.purpose}
                </li>
                <li>
                  <span className="font-medium text-foreground">Method: </span>
                  {CTS_GRADING_SCALE.clinicalApplication.assessmentMethod}
                </li>
                <li>
                  <span className="font-medium text-foreground">Output: </span>
                  grade {CTS_GRADING_SCALE.gradeRange.minimum}–
                  {CTS_GRADING_SCALE.gradeRange.maximum} with the corresponding severity category
                </li>
              </ul>
            </div>
            <div className="rounded-lg border border-border/40 bg-muted/20 p-3">
              <h4 className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Abbreviations
              </h4>
              <ul className="space-y-1 text-xs text-muted-foreground">
                {Object.entries(CTS_ABBREVIATIONS).map(([abbr, full]) => (
                  <li key={abbr}>
                    <span className="font-semibold text-foreground">{abbr}</span> — {full}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <p className="text-[11px] text-muted-foreground">
            Grade 0 describes a normal study; grades 1–2 are mild disease detectable with sensitive
            studies; grades 3–4 reflect preserved or absent sensory potentials with a motor latency
            below 6.5 ms; grades 5–6 reflect a markedly prolonged latency or unrecordable responses.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default CtsGradingCalculator;
