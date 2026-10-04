import { useMemo, useState } from "react";
import { Activity, AlertTriangle, CheckCircle2, RotateCcw } from "lucide-react";
import Seo from "@/components/Seo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RiskFactorChip } from "@/components/ui/risk-factor-chip";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import {
  METSYN_QUALIFYING_COUNT,
  countCheckedItems,
  getMetsynCriteria,
  type MetSynSet,
} from "@/lib/clinicalConstants";

const WAIST_ID = "lc_ms_waist";

const SET_LABEL: Record<MetSynSet, string> = {
  idf: "South Asian (IDF)",
  ncep: "US (NCEP ATP III)",
};

/**
 * Metabolic syndrome as a five-item checklist. Three or more criteria meet the
 * definition. Only the waist threshold differs between the South Asian and US
 * criteria sets, so the toggle changes that one row and nothing else.
 */
export default function MetabolicSyndrome() {
  const [set, setSet] = useLocalStorage<MetSynSet>("ncd_metsyn_set", "idf");
  const [checked, setChecked] = useLocalStorage<Record<string, boolean>>("ncd_metsyn_checked", {});
  const [waistCleared, setWaistCleared] = useState(false);

  const criteria = useMemo(() => getMetsynCriteria(set), [set]);
  const count = useMemo(() => countCheckedItems(criteria, checked), [criteria, checked]);
  const qualifies = count >= METSYN_QUALIFYING_COUNT;
  const remaining = METSYN_QUALIFYING_COUNT - count;

  const toggle = (id: string) => {
    // Re-ticking the waist is the one thing that resolves the cleared note, so
    // an unrelated tick leaves it up.
    if (id === WAIST_ID && !checked[WAIST_ID]) setWaistCleared(false);
    setChecked((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // The waist tick is only valid under the set it was made in, and we don't know
  // the measured value, so it is cleared rather than carried across. The other
  // four thresholds are identical under both sets and stay put.
  const changeSet = (next: MetSynSet) => {
    if (next === set) return;
    setSet(next);
    if (checked[WAIST_ID]) {
      setChecked((prev) => ({ ...prev, [WAIST_ID]: false }));
      setWaistCleared(true);
    }
  };

  const reset = () => {
    setChecked({});
    setWaistCleared(false);
  };

  return (
    <>
      <Seo
        title="Metabolic Syndrome Criteria | NCEP ATP III / IDF"
        description="Interactive metabolic syndrome checklist. Three or more of five criteria, with South Asian (IDF) and US (NCEP ATP III) waist thresholds."
      />
      <div className="px-4 py-8 md:px-8">
        <div className="mx-auto max-w-6xl space-y-6">
          <header className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <Badge variant="outline" className="mb-3 border-primary/40 text-primary">
                  Diagnostic criteria
                </Badge>
                <h1 className="font-heading text-2xl font-semibold">Metabolic Syndrome</h1>
                <p className="mt-2 max-w-3xl text-muted-foreground">
                  Select the risk factors present. Three or more of the five meet the definition of
                  metabolic syndrome.
                </p>
              </div>
              <Button variant="outline" onClick={reset} aria-label="Reset metabolic syndrome checklist">
                <RotateCcw className="mr-2 h-4 w-4" /> Reset
              </Button>
            </div>
          </header>

          <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Criteria set</CardTitle>
                  <CardDescription>
                    The two sets share triglycerides, HDL, blood pressure and fasting glucose. They
                    differ only in the waist threshold.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ToggleGroup
                    type="single"
                    value={set}
                    onValueChange={(value) => value && changeSet(value as MetSynSet)}
                    className="justify-start"
                    aria-label="Criteria set"
                  >
                    {(Object.keys(SET_LABEL) as MetSynSet[]).map((option) => (
                      <ToggleGroupItem key={option} value={option} aria-label={SET_LABEL[option]}>
                        {SET_LABEL[option]}
                      </ToggleGroupItem>
                    ))}
                  </ToggleGroup>
                  {waistCleared && (
                    <p className="flex items-start gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm">
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                      <span>
                        Waist selection cleared: the waist threshold changed with the criteria set.
                        Re-tick it if the measurement still meets {SET_LABEL[set]}.
                      </span>
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Risk factors present</CardTitle>
                  <CardDescription>
                    Tick each criterion the patient meets, including any treated with medication.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {criteria.map((criterion) => (
                    <RiskFactorChip
                      key={criterion.id}
                      label={criterion.label}
                      tone="amber"
                      checked={!!checked[criterion.id]}
                      onToggle={() => toggle(criterion.id)}
                      rightSlot={
                        criterion.id === WAIST_ID ? (
                          <span
                            className="shrink-0 rounded-full bg-primary/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-primary"
                            title={`Waist threshold in use: ${SET_LABEL[set]}`}
                          >
                            {SET_LABEL[set]}
                          </span>
                        ) : undefined
                      }
                    />
                  ))}
                </CardContent>
              </Card>
            </div>

            <aside className="lg:sticky lg:top-6 lg:self-start">
              <Card
                className={`border-2 ${qualifies ? "border-emerald-500/50 bg-emerald-500/10" : "border-border bg-card"}`}
              >
                <CardHeader>
                  <div className="flex items-center justify-between gap-3">
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="h-5 w-5" /> Assessment
                    </CardTitle>
                    <span className="font-heading text-4xl font-bold">
                      {count}
                      <span className="text-xl text-muted-foreground">/5</span>
                    </span>
                  </div>
                  <CardDescription>{SET_LABEL[set]} criteria</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2 text-xl font-semibold">
                    <CheckCircle2 className="h-5 w-5" />
                    {qualifies ? "Meets criteria" : "Criteria not met"}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {qualifies
                      ? `Three or more of the five criteria are present, so this meets the definition of metabolic syndrome.`
                      : `${remaining} more ${remaining === 1 ? "criterion" : "criteria"} needed for three of five.`}
                  </p>
                  <div className="rounded-lg bg-background/50 p-3 text-sm">
                    <strong>Criteria ticked:</strong> {count} of {criteria.length} · threshold{" "}
                    {METSYN_QUALIFYING_COUNT}
                  </div>
                </CardContent>
              </Card>

              <div className="mt-4 rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm">
                <div className="mb-2 flex items-center gap-2 font-semibold">
                  <AlertTriangle className="h-4 w-4" /> Note
                </div>
                <p className="text-muted-foreground">
                  Metabolic syndrome is a risk marker, not a diagnosis in itself. Treat the
                  individual risk factors and assess overall cardiovascular and diabetes risk.
                </p>
              </div>
            </aside>
          </div>

          <p className="text-xs text-muted-foreground">
            Criteria as supplied from NCEP ATP III with South Asian waist thresholds from the IDF
            definition. This tool supports clinical assessment and does not replace local protocols
            or specialist judgement.
          </p>
        </div>
      </div>
    </>
  );
}
