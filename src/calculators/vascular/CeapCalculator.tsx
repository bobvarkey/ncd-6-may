import { useMemo, useState, type ReactNode } from "react";
import { Activity, AlertTriangle, Copy, Download, Info, Printer, RotateCcw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { copyToClipboard } from "@/lib/clinical-utils";
import { cn } from "@/lib/utils";
import {
  CEAP_ANATOMY,
  CEAP_CLINICAL_CLASSES,
  CEAP_ETIOLOGY,
  CEAP_LATERALITY,
  CEAP_PATHOPHYSIOLOGY,
  EMPTY_CEAP_STATE,
  buildCeap,
  type CeapAnatomy,
  type CeapClinicalCode,
  type CeapLaterality,
  type CeapPathophysiology,
  type CeapState,
} from "@/lib/ceap";
import ceapC1 from "@/assets/ceap-c1.png";
import ceapC2 from "@/assets/ceap-c2.png";
import ceapC3 from "@/assets/ceap-c3.png";
import ceapC4 from "@/assets/ceap-c4.png";
import ceapC5 from "@/assets/ceap-c5.png";
import ceapC6 from "@/assets/ceap-c6.png";

const CLINICAL_IMAGES: Partial<Record<CeapClinicalCode, string>> = {
  C1: ceapC1,
  C2: ceapC2,
  C3: ceapC3,
  C4: ceapC4,
  C5: ceapC5,
  C6: ceapC6,
};

function downloadJson(filename: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function ToggleChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "rounded-lg border px-3 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        active
          ? "border-primary bg-primary text-primary-foreground shadow-sm"
          : "border-border bg-card text-foreground hover:bg-muted/40",
      )}
    >
      {children}
    </button>
  );
}

export default function CeapCalculator() {
  const [state, setState] = useState<CeapState>(EMPTY_CEAP_STATE);

  const result = useMemo(() => buildCeap(state), [state]);

  const setClinical = (code: CeapClinicalCode) => {
    setState((previous) => ({ ...previous, clinical: code }));
  };

  const toggleAnatomy = (code: CeapAnatomy) => {
    setState((previous) => ({
      ...previous,
      anatomy: previous.anatomy.includes(code)
        ? previous.anatomy.filter((item) => item !== code)
        : [...previous.anatomy, code],
    }));
  };

  const togglePathophysiology = (code: CeapPathophysiology) => {
    setState((previous) => ({
      ...previous,
      pathophysiology: previous.pathophysiology.includes(code)
        ? previous.pathophysiology.filter((item) => item !== code)
        : [...previous.pathophysiology, code],
    }));
  };

  const reset = () => setState({ ...EMPTY_CEAP_STATE, anatomy: [], pathophysiology: [] });

  return (
    <div className="space-y-4">
      <Card className="border-border/40">
        <CardHeader className="pb-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Activity className="h-4 w-4 text-cyan-600" />
              CEAP Clinical Assessment
            </CardTitle>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={reset} title="Reset">
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Chronic venous disease · Interactive classification and report builder
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          <h3 className="text-sm font-semibold">1. Select the highest clinical class (C)</h3>
          <p className="text-[11px] text-muted-foreground">
            Choose the finding that best represents the most advanced clinical sign.
          </p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
            {CEAP_CLINICAL_CLASSES.map((item) => {
              const selected = state.clinical === item.code;
              const image = CLINICAL_IMAGES[item.code];
              return (
                <button
                  key={item.code}
                  type="button"
                  onClick={() => setClinical(item.code)}
                  aria-pressed={selected}
                  className={cn(
                    "flex flex-col overflow-hidden rounded-xl border text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    selected
                      ? "border-primary bg-primary/5 ring-2 ring-primary/30"
                      : "border-border bg-card hover:bg-muted/40",
                  )}
                >
                  <div className="flex h-28 w-full items-center justify-center overflow-hidden bg-muted/30">
                    {image ? (
                      <img
                        src={image}
                        alt={item.caption}
                        loading="lazy"
                        className="h-full w-full object-contain"
                      />
                    ) : (
                      <span className="px-2 text-center text-[11px] text-muted-foreground">
                        {item.caption}
                      </span>
                    )}
                  </div>
                  <div className="space-y-0.5 p-2">
                    <div className="font-heading text-sm font-bold">{item.code}</div>
                    <div className="text-[11px] leading-tight text-muted-foreground">{item.label}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-3 md:grid-cols-2">
        <Card className="border-border/40">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">2. Etiology (E)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex flex-wrap gap-2">
              {CEAP_ETIOLOGY.map((item) => (
                <ToggleChip
                  key={item.code}
                  active={state.etiology === item.code}
                  onClick={() => setState((previous) => ({ ...previous, etiology: item.code }))}
                >
                  {item.code} · {item.label}
                </ToggleChip>
              ))}
              <ToggleChip
                active={state.etiology === null}
                onClick={() => setState((previous) => ({ ...previous, etiology: null }))}
              >
                Unknown
              </ToggleChip>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Select only when established; do not infer from photographs.
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/40">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">3. Anatomy (A)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex flex-wrap gap-2">
              {CEAP_ANATOMY.map((item) => (
                <ToggleChip
                  key={item.code}
                  active={state.anatomy.includes(item.code)}
                  onClick={() => toggleAnatomy(item.code)}
                >
                  {item.code} · {item.label}
                </ToggleChip>
              ))}
            </div>
            <p className="text-[11px] text-muted-foreground">
              Multiple selections permitted. Leave blank if not established.
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/40">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">4. Pathophysiology (P)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex flex-wrap gap-2">
              {CEAP_PATHOPHYSIOLOGY.map((item) => (
                <ToggleChip
                  key={item.code}
                  active={state.pathophysiology.includes(item.code)}
                  onClick={() => togglePathophysiology(item.code)}
                >
                  {item.code} · {item.label}
                </ToggleChip>
              ))}
            </div>
            <p className="text-[11px] text-muted-foreground">
              Multiple selections permitted. Leave blank if not established.
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/40">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">5. Clinical details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="ceap-side" className="text-xs">
                Laterality
              </Label>
              <Select
                value={state.laterality}
                onValueChange={(value) =>
                  setState((previous) => ({ ...previous, laterality: value as CeapLaterality }))
                }
              >
                <SelectTrigger id="ceap-side" className="h-9 bg-card">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card">
                  {CEAP_LATERALITY.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Symptom designation</Label>
              <div className="flex flex-wrap gap-2">
                <ToggleChip
                  active={state.symptoms === "s"}
                  onClick={() =>
                    setState((previous) => ({
                      ...previous,
                      symptoms: previous.symptoms === "s" ? null : "s",
                    }))
                  }
                >
                  Symptomatic (s)
                </ToggleChip>
                <ToggleChip
                  active={state.symptoms === "a"}
                  onClick={() =>
                    setState((previous) => ({
                      ...previous,
                      symptoms: previous.symptoms === "a" ? null : "a",
                    }))
                  }
                >
                  Asymptomatic (a)
                </ToggleChip>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Select only one symptom designation when known.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/40">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Classification and clinical report</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="rounded-lg border border-primary/30 bg-primary/5 p-3">
            <p className="break-words font-mono text-2xl font-bold">{result.classification}</p>
            <p className="text-sm text-muted-foreground">
              {result.description ?? "Choose C0–C6 to begin."}
            </p>
            {result.warning ? (
              <p className="mt-1 flex items-start gap-1.5 text-xs text-amber-700 dark:text-amber-300">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                {result.warning}
              </p>
            ) : null}
          </div>

          <Textarea
            readOnly
            value={result.report}
            aria-label="CEAP clinical report"
            className="min-h-[170px] bg-muted/30 font-mono text-xs"
          />

          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={() => copyToClipboard(result.report, "CEAP report copied")}>
              <Copy className="mr-1.5 h-4 w-4" />
              Copy report
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                downloadJson("CEAP_patient_assessment.json", {
                  ...result.data,
                  report: result.report,
                })
              }
            >
              <Download className="mr-1.5 h-4 w-4" />
              Export JSON
            </Button>
            <Button size="sm" variant="outline" onClick={() => window.print()}>
              <Printer className="mr-1.5 h-4 w-4" />
              Print
            </Button>
            <Button size="sm" variant="outline" onClick={reset}>
              <RotateCcw className="mr-1.5 h-4 w-4" />
              Reset
            </Button>
          </div>

          <div className="flex items-start gap-2 rounded-lg border border-border/40 bg-muted/20 p-3 text-[11px] text-muted-foreground">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <p>
              Reference: user-provided CEAP illustration. This tool follows the simplified categories
              in that image, not the full revised CEAP 2020 taxonomy. Duplex ultrasound is generally
              needed to establish anatomical and pathophysiological components. Clinical appearance
              alone does not confirm venous etiology. Do not initiate compression solely from this
              classification without assessing contraindications and arterial circulation where
              appropriate.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
