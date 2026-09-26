import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ShieldAlert, RotateCcw, AlertTriangle, XCircle, Info } from "lucide-react";

export const drugList = [
  { id: "losartan", name: "Losartan", group: "ARB" },
  { id: "telmisartan", name: "Telmisartan", group: "ARB" },
  { id: "enalapril", name: "Enalapril", group: "ACEi" },
  { id: "ramipril", name: "Ramipril", group: "ACEi" },
  { id: "atenolol", name: "Atenolol", group: "Beta-blocker" },
  { id: "metoprolol", name: "Metoprolol", group: "Beta-blocker" },
  { id: "labetalol", name: "Labetalol", group: "Beta-blocker" },
  { id: "carvedilol", name: "Carvedilol", group: "Beta-blocker" },
  { id: "amlodipine", name: "Amlodipine", group: "CCB" },
  { id: "nifedipine", name: "Nifedipine", group: "CCB" },
  { id: "hctz", name: "Hydrochlorothiazide", group: "Thiazide" },
  { id: "chlorthalidone", name: "Chlorthalidone", group: "Thiazide" },
  { id: "furosemide", name: "Furosemide", group: "Loop" },
  { id: "spironolactone", name: "Spironolactone", group: "K-sparing" },
  { id: "eplerenone", name: "Eplerenone", group: "K-sparing" },
  { id: "prazosin", name: "Prazosin", group: "Alpha-blocker" },
  { id: "clonidine", name: "Clonidine", group: "Central" },
  { id: "moxonidine", name: "Moxonidine", group: "Central" },
  { id: "methyldopa", name: "Methyldopa", group: "Central" },
];

export type Severity = "critical" | "major" | "moderate";

export interface Interaction {
  drugs: [string, string];
  severity: Severity;
  description: string;
  mechanism: string;
  recommendation: string;
}

export interface InteractionResult {
  interaction: Interaction;
  drugA: string;
  drugB: string;
}

export interface DrugSelectionData {
  selectedDrugNames: string[];
  interactions: InteractionResult[];
}

const interactions: Interaction[] = [
  {
    drugs: ["ACEi", "ARB"],
    severity: "critical",
    description: "Dual RAAS blockade — increased risk of hyperkalemia, renal failure, and hypotension",
    mechanism: "Both block the renin-angiotensin system at different points, causing excessive suppression",
    recommendation: "AVOID combination. ONTARGET trial showed harm with no benefit. Use one agent only.",
  },
  {
    drugs: ["ACEi", "K-sparing"],
    severity: "critical",
    description: "Severe hyperkalemia risk — potentially life-threatening",
    mechanism: "ACEi reduces aldosterone → K⁺ retention; K-sparing diuretics further block K⁺ excretion",
    recommendation: "If combination unavoidable (e.g., HFrEF), monitor K⁺ within 1 week, then every 1-3 months. Avoid if GFR < 30.",
  },
  {
    drugs: ["ARB", "K-sparing"],
    severity: "critical",
    description: "Severe hyperkalemia risk — potentially life-threatening",
    mechanism: "ARB reduces aldosterone → K⁺ retention; K-sparing diuretics further block K⁺ excretion",
    recommendation: "If combination unavoidable, monitor K⁺ within 1 week, then every 1-3 months. Avoid if GFR < 30.",
  },
  {
    drugs: ["Beta-blocker", "Central"],
    severity: "major",
    description: "Rebound hypertensive crisis if central agent stopped abruptly",
    mechanism: "Beta-blockers block compensatory vasodilation during clonidine/moxonidine withdrawal, worsening rebound hypertension",
    recommendation: "If discontinuing, taper central agent FIRST over 1-2 weeks, then taper beta-blocker. Never stop central agent abruptly.",
  },
  {
    drugs: ["Beta-blocker", "CCB"],
    severity: "major",
    description: "Risk of severe bradycardia, heart block, and cardiac depression (especially with non-DHP CCBs)",
    mechanism: "Both suppress AV conduction and myocardial contractility. Amlodipine/nifedipine (DHP) are safer than verapamil/diltiazem",
    recommendation: "Amlodipine + beta-blocker is generally SAFE and commonly used. Avoid beta-blocker + verapamil/diltiazem. Monitor HR closely.",
  },
  {
    drugs: ["Central", "Central"],
    severity: "major",
    description: "Excessive CNS depression and severe hypotension",
    mechanism: "Additive central sympatholytic effects causing excessive reduction in sympathetic outflow",
    recommendation: "Avoid combining two central-acting agents. Choose one based on clinical profile (prefer moxonidine).",
  },
  {
    drugs: ["ACEi", "ACEi"],
    severity: "major",
    description: "No added benefit, increased adverse effects",
    mechanism: "Redundant mechanism — both inhibit ACE enzyme",
    recommendation: "Use only one ACEi. Switch agent or increase dose if response is inadequate.",
  },
  {
    drugs: ["ARB", "ARB"],
    severity: "major",
    description: "No added benefit, increased adverse effects",
    mechanism: "Redundant mechanism — both block AT1 receptors",
    recommendation: "Use only one ARB. Switch agent or increase dose if response is inadequate.",
  },
  {
    drugs: ["Alpha-blocker", "Beta-blocker"],
    severity: "moderate",
    description: "First-dose orthostatic hypotension may be exaggerated",
    mechanism: "Alpha-blocker causes vasodilation; beta-blocker prevents compensatory tachycardia",
    recommendation: "Start alpha-blocker at lowest dose at bedtime. Monitor BP lying and standing. Can be used together with caution.",
  },
  {
    drugs: ["Alpha-blocker", "CCB"],
    severity: "moderate",
    description: "Additive hypotension and dizziness",
    mechanism: "Both cause peripheral vasodilation through different mechanisms",
    recommendation: "Use with caution. Start alpha-blocker at low dose. Monitor for symptomatic hypotension.",
  },
  {
    drugs: ["Loop", "ACEi"],
    severity: "moderate",
    description: "First-dose hypotension risk; potential for acute kidney injury in volume-depleted patients",
    mechanism: "Diuretic-induced volume depletion amplifies the hypotensive effect of ACEi initiation",
    recommendation: "Consider holding or reducing diuretic 24-48 hours before starting ACEi. Start ACEi at lowest dose. Monitor renal function.",
  },
  {
    drugs: ["Loop", "ARB"],
    severity: "moderate",
    description: "First-dose hypotension risk; potential for acute kidney injury in volume-depleted patients",
    mechanism: "Diuretic-induced volume depletion amplifies the hypotensive effect of ARB initiation",
    recommendation: "Consider reducing diuretic dose before starting ARB. Start ARB at lowest dose (e.g., Losartan 25 mg). Monitor renal function.",
  },
  {
    drugs: ["Thiazide", "ACEi"],
    severity: "moderate",
    description: "Enhanced hypotension on initiation; beneficial combination long-term",
    mechanism: "Thiazide-induced volume contraction activates RAAS, which is then blocked by ACEi",
    recommendation: "Commonly used and effective combination. Start ACEi at low dose if already on thiazide. Monitor electrolytes.",
  },
  {
    drugs: ["Thiazide", "ARB"],
    severity: "moderate",
    description: "Enhanced hypotension on initiation; beneficial combination long-term",
    mechanism: "Thiazide-induced volume contraction activates RAAS, which is then blocked by ARB",
    recommendation: "Well-established combination (e.g., Losartan + HCTZ). Start at low doses. Monitor electrolytes.",
  },
  {
    drugs: ["K-sparing", "K-sparing"],
    severity: "critical",
    description: "Life-threatening hyperkalemia",
    mechanism: "Additive potassium retention from dual blockade of K⁺ excretion",
    recommendation: "NEVER combine two potassium-sparing diuretics. Choose one agent.",
  },
  {
    drugs: ["Loop", "K-sparing"],
    severity: "moderate",
    description: "Beneficial combination — K-sparing offsets loop-induced hypokalemia, but monitor K⁺",
    mechanism: "Loop diuretics waste K⁺; potassium-sparing agents retain K⁺ — complementary effects",
    recommendation: "Commonly used and beneficial (e.g., furosemide + spironolactone in HF). Monitor K⁺ regularly.",
  },
  {
    drugs: ["Alpha-blocker", "Central"],
    severity: "moderate",
    description: "Excessive hypotension and orthostatic symptoms",
    mechanism: "Both reduce sympathetic tone — alpha-blocker peripherally, central agent centrally",
    recommendation: "Avoid if possible. If needed, use lowest doses and monitor for orthostasis.",
  },
];

function getGroup(drugId: string): string {
  return drugList.find((d) => d.id === drugId)?.group ?? "";
}

export function findInteractions(selectedIds: string[]): InteractionResult[] {
  const results: InteractionResult[] = [];
  const seen = new Set<string>();

  for (let i = 0; i < selectedIds.length; i++) {
    for (let j = i + 1; j < selectedIds.length; j++) {
      const gA = getGroup(selectedIds[i]);
      const gB = getGroup(selectedIds[j]);
      const nameA = drugList.find((d) => d.id === selectedIds[i])?.name ?? "";
      const nameB = drugList.find((d) => d.id === selectedIds[j])?.name ?? "";

      for (const ix of interactions) {
        const [g1, g2] = ix.drugs;
        if ((gA === g1 && gB === g2) || (gA === g2 && gB === g1)) {
          const key = [selectedIds[i], selectedIds[j]].sort().join("-") + ix.description;
          if (!seen.has(key)) {
            seen.add(key);
            results.push({ interaction: ix, drugA: nameA, drugB: nameB });
          }
        }
      }
    }
  }

  const order: Record<Severity, number> = { critical: 0, major: 1, moderate: 2 };
  results.sort((a, b) => order[a.interaction.severity] - order[b.interaction.severity]);
  return results;
}

const severityConfig: Record<Severity, { label: string; icon: React.ReactNode; badgeClass: string; borderClass: string }> = {
  critical: {
    label: "CRITICAL",
    icon: <XCircle className="h-4 w-4" />,
    badgeClass: "bg-destructive/20 text-destructive border-destructive/30",
    borderClass: "border-destructive/40 bg-destructive/5",
  },
  major: {
    label: "MAJOR",
    icon: <AlertTriangle className="h-4 w-4" />,
    badgeClass: "bg-warning/100/20 text-warning border-warning/30",
    borderClass: "border-warning/30 bg-warning/100/5",
  },
  moderate: {
    label: "MODERATE",
    icon: <Info className="h-4 w-4" />,
    badgeClass: "bg-warning/20 text-warning border-yellow-500/30",
    borderClass: "border-yellow-500/30 bg-warning/5",
  },
};

const groupedDrugs = drugList.reduce<Record<string, typeof drugList>>((acc, drug) => {
  if (!acc[drug.group]) acc[drug.group] = [];
  acc[drug.group].push(drug);
  return acc;
}, {});

interface DrugInteractionCheckerProps {
  onSelectionChange?: (data: DrugSelectionData) => void;
}

export default function DrugInteractionChecker({ onSelectionChange }: DrugInteractionCheckerProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const reset = () => setSelected(new Set());

  const selectedArray = Array.from(selected);
  const results = selected.size >= 2 ? findInteractions(selectedArray) : [];

  useEffect(() => {
    const names = selectedArray
      .map((id) => drugList.find((d) => d.id === id)?.name ?? "")
      .filter(Boolean);
    onSelectionChange?.({ selectedDrugNames: names, interactions: results });
  }, [selected]);

  function handleSmartParse(values: Record<string, string>) {
    // Drug interaction checker - no direct input state for parsed values
  }

  return (
    <>
      <Card className="border-2 border-primary/20 bg-gradient-to-br from-muted/5 to-primary/5">
        <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ShieldAlert className="h-5 w-5 text-primary" />
            <CardTitle className="text-xl">Drug Interaction Checker</CardTitle>
          </div>
          {selected.size > 0 && (
            <Button variant="ghost" size="sm" onClick={reset} className="text-muted-foreground">
              <RotateCcw className="h-4 w-4 mr-1" />
              Clear
            </Button>
          )}
        </div>
        <p className="text-xs text-muted-foreground">Select 2 or more medications to check for dangerous combinations</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {Object.entries(groupedDrugs).map(([group, drugs]) => (
            <div key={group} className="space-y-1.5">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{group}</p>
              {drugs.map((drug) => (
                <label
                  key={drug.id}
                  className={`flex items-center space-x-2 p-1.5 rounded-md cursor-pointer transition-colors text-sm ${
                    selected.has(drug.id) ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted/50"
                  }`}
                >
                  <Checkbox
                    checked={selected.has(drug.id)}
                    onCheckedChange={() => toggle(drug.id)}
                    className="h-4 w-4"
                  />
                  <span>{drug.name}</span>
                </label>
              ))}
            </div>
          ))}
        </div>

        {selected.size >= 2 && (
          <div className="border-t border-border pt-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">
                Interaction Results ({selected.size} drugs selected)
              </h3>
              {results.length === 0 && (
                <Badge className="bg-success/20 text-success border-success/30">No interactions found</Badge>
              )}
            </div>

            {results.length > 0 && (
              <div className="space-y-3">
                {results.map((r, i) => {
                  const config = severityConfig[r.interaction.severity];
                  return (
                    <div key={i} className={`p-3 rounded-lg border-2 ${config.borderClass}`}>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center space-x-2">
                          {config.icon}
                          <span className="font-semibold text-sm">
                            {r.drugA} + {r.drugB}
                          </span>
                        </div>
                        <Badge className={config.badgeClass}>{config.label}</Badge>
                      </div>
                      <p className="text-sm text-foreground mb-2">{r.interaction.description}</p>
                      <div className="space-y-1 text-xs text-muted-foreground">
                        <p><span className="font-medium text-foreground">Mechanism:</span> {r.interaction.mechanism}</p>
                        <p><span className="font-medium text-foreground">Recommendation:</span> {r.interaction.recommendation}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {results.length === 0 && selected.size >= 2 && (
              <p className="text-sm text-muted-foreground italic">
                No significant interactions detected between selected medications. Always verify with a comprehensive drug interaction database for complete safety.
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
    </>
  );
}
