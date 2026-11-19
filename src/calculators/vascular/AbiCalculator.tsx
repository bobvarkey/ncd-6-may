import { useMemo, useState } from "react";
import { Activity, AlertTriangle, Copy, Info, Printer, RotateCcw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { copyToClipboard } from "@/lib/clinical-utils";
import { cn } from "@/lib/utils";
import { calculateAbi, type AbiInputs, type AbiLevel, type AbiSideResult } from "@/lib/abi";

const EMPTY_INPUTS: AbiInputs = {
  rightBrachial: "",
  leftBrachial: "",
  rightDorsalisPedis: "",
  rightPosteriorTibial: "",
  leftDorsalisPedis: "",
  leftPosteriorTibial: "",
};

const LEVEL_CLASS: Record<AbiLevel, string> = {
  bad: "border-destructive/30 bg-destructive/10 text-destructive",
  warn: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  good: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  neutral: "border-border bg-muted text-muted-foreground",
};

function PressureInput({
  id,
  label,
  value,
  onChange,
  placeholder,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs">
        {label}
      </Label>
      <Input
        id={id}
        type="number"
        inputMode="decimal"
        min={0}
        max={350}
        step={1}
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-9 bg-card"
      />
    </div>
  );
}

function AnkleCard({
  title,
  idPrefix,
  dorsalis,
  posterior,
  onDorsalis,
  onPosterior,
  side,
}: {
  title: string;
  idPrefix: string;
  dorsalis: string;
  posterior: string;
  onDorsalis: (value: string) => void;
  onPosterior: (value: string) => void;
  side: AbiSideResult;
}) {
  return (
    <Card className="border-border/40">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <PressureInput
          id={`${idPrefix}-dp`}
          label="Dorsalis pedis (mmHg)"
          placeholder="e.g. 118"
          value={dorsalis}
          onChange={onDorsalis}
        />
        <PressureInput
          id={`${idPrefix}-pt`}
          label="Posterior tibial (mmHg)"
          placeholder="e.g. 124"
          value={posterior}
          onChange={onPosterior}
        />
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          <p className="text-3xl font-heading font-bold">
            {side.abi === null ? "—" : side.abi.toFixed(2)}
          </p>
          <span
            className={cn(
              "rounded-full border px-2.5 py-1 text-xs font-semibold",
              LEVEL_CLASS[side.level],
            )}
          >
            {side.category}
          </span>
        </div>
        {side.note ? <p className="text-xs text-muted-foreground">{side.note}</p> : null}
      </CardContent>
    </Card>
  );
}

export default function AbiCalculator() {
  const [inputs, setInputs] = useState<AbiInputs>(EMPTY_INPUTS);

  const result = useMemo(() => calculateAbi(inputs), [inputs]);

  const update = (field: keyof AbiInputs, value: string) => {
    setInputs((previous) => ({ ...previous, [field]: value }));
  };

  const reset = () => setInputs(EMPTY_INPUTS);

  const referenceLabel =
    result.brachialReference === null
      ? "—"
      : `${result.brachialReference} mmHg` +
        (result.brachialCount === 1 ? " (one arm entered; complete both arms)" : "");

  return (
    <div className="space-y-4">
      <Card className="border-border/40">
        <CardHeader className="pb-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Activity className="h-4 w-4 text-cyan-600" />
              Ankle–Brachial Index (ABI) Calculator
            </CardTitle>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={reset} title="Reset">
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Enter systolic pressures in mmHg. The calculator uses the higher brachial pressure from
            either arm and the higher of dorsalis pedis or posterior tibial pressure for each ankle.
          </p>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-cyan-500/30 bg-cyan-500/5 p-3 text-sm">
            <span className="font-semibold">ABI</span> = Higher ankle artery systolic pressure ÷ Higher
            brachial systolic pressure
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-3 md:grid-cols-3">
        <Card className="border-border/40">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Arm pressures</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <PressureInput
              id="abi-brach-r"
              label="Right brachial (mmHg)"
              placeholder="e.g. 132"
              value={inputs.rightBrachial}
              onChange={(value) => update("rightBrachial", value)}
            />
            <PressureInput
              id="abi-brach-l"
              label="Left brachial (mmHg)"
              placeholder="e.g. 128"
              value={inputs.leftBrachial}
              onChange={(value) => update("leftBrachial", value)}
            />
            <p className="text-xs text-muted-foreground">
              Reference brachial pressure: {referenceLabel}
            </p>
          </CardContent>
        </Card>

        <AnkleCard
          title="Right ankle"
          idPrefix="abi-right"
          dorsalis={inputs.rightDorsalisPedis}
          posterior={inputs.rightPosteriorTibial}
          onDorsalis={(value) => update("rightDorsalisPedis", value)}
          onPosterior={(value) => update("rightPosteriorTibial", value)}
          side={result.right}
        />

        <AnkleCard
          title="Left ankle"
          idPrefix="abi-left"
          dorsalis={inputs.leftDorsalisPedis}
          posterior={inputs.leftPosteriorTibial}
          onDorsalis={(value) => update("leftDorsalisPedis", value)}
          onPosterior={(value) => update("leftPosteriorTibial", value)}
          side={result.left}
        />
      </div>

      <Card className="border-border/40">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Interpretation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            <span className="font-semibold">≤0.90</span> Abnormal, consistent with PAD
          </p>
          <p>
            <span className="font-semibold">0.91–0.99</span> Borderline
          </p>
          <p>
            <span className="font-semibold">1.00–1.40</span> Normal
          </p>
          <p>
            <span className="font-semibold">&gt;1.40</span> Noncompressible arteries
          </p>
          <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-muted-foreground">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
            <p>
              <span className="font-semibold text-foreground">Clinical caution:</span> ABI &gt;1.40
              suggests noncompressible vessels. Consider toe–brachial index (TBI) with waveforms.
              Normal resting ABI does not exclude PAD in symptomatic patients; consider exercise ABI
              when appropriate.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/40">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Info className="h-4 w-4 text-muted-foreground" />
            Report impression
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            readOnly
            value={result.report}
            className="min-h-[120px] bg-muted/30 font-mono text-xs"
          />
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={() => copyToClipboard(result.report, "ABI report copied")}>
              <Copy className="mr-1.5 h-4 w-4" />
              Copy report
            </Button>
            <Button size="sm" variant="outline" onClick={reset}>
              <RotateCcw className="mr-1.5 h-4 w-4" />
              Reset
            </Button>
            <Button size="sm" variant="outline" onClick={() => window.print()}>
              <Printer className="mr-1.5 h-4 w-4" />
              Print
            </Button>
          </div>
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            Interpretation follows commonly used ACC/AHA ABI categories. This is a clinical aid, not a
            substitute for waveform assessment or vascular evaluation. For standardized resting ABI,
            measure both brachial pressures and both ankle arteries using appropriate Doppler
            technique.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
