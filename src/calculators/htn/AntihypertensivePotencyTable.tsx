import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Gauge, AlertTriangle, Home } from "lucide-react";
import { FrequencyBadge } from "@/components/FrequencyBadge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type Potency = "Very high" | "High" | "Moderate" | "Moderate to low" | "Low to moderate" | "Low";

interface DrugRow {
  potency: Potency;
  drugClass: string;
  examples: string;
  startingDose: string;
  bestUse: string;
}

const drugData: DrugRow[] = [
  {
    potency: "Very high",
    drugClass: "Direct vasodilators",
    examples: "Hydralazine, dihydralazine, minoxidil",
    startingDose: "Hydralazine 25 mg BID; dihydralazine 12.5 mg TID; minoxidil 2.5 mg daily",
    bestUse: "Resistant hypertension or special situations, usually combined with other agents due to adverse-effect burden.",
  },
  {
    potency: "High",
    drugClass: "Mineralocorticoid receptor antagonists",
    examples: "Spironolactone, eplerenone",
    startingDose: "Spironolactone 25 mg daily; eplerenone 50 mg daily",
    bestUse: "Resistant hypertension, primary aldosteronism, heart failure.",
  },
  {
    potency: "High",
    drugClass: "Thiazide / thiazide-like diuretics",
    examples: "Chlorthalidone, indapamide, hydrochlorothiazide",
    startingDose: "Chlorthalidone 12.5 mg daily; indapamide 1.25 mg daily; HCTZ 12.5–25 mg daily",
    bestUse: "First-line for uncomplicated HTN; thiazide-like agents often favored over HCTZ.",
  },
  {
    potency: "High",
    drugClass: "Dihydropyridine CCBs",
    examples: "Amlodipine, felodipine, nifedipine ER",
    startingDose: "Amlodipine 2.5–5 mg daily; felodipine 2.5–5 mg daily; nifedipine ER 30 mg daily",
    bestUse: "First-line, especially older adults, isolated systolic HTN, and combination regimens.",
  },
  {
    potency: "Moderate",
    drugClass: "ACE inhibitors",
    examples: "Lisinopril, enalapril, ramipril",
    startingDose: "Lisinopril 10 mg daily; enalapril 5 mg daily; ramipril 2.5 mg daily",
    bestUse: "CKD, diabetes with albuminuria, coronary disease, proteinuric states.",
  },
  {
    potency: "Moderate",
    drugClass: "ARBs",
    examples: "Losartan, valsartan, telmisartan",
    startingDose: "Losartan 25–50 mg daily; valsartan 80 mg daily; telmisartan 20 mg daily",
    bestUse: "Similar to ACEi when cough or ACE intolerance is an issue.",
  },
  {
    potency: "Moderate",
    drugClass: "Loop diuretics",
    examples: "Furosemide, torsemide, bumetanide",
    startingDose: "Furosemide 20–40 mg daily; torsemide 5–10 mg daily; bumetanide 0.5–1 mg daily",
    bestUse: "More useful for CKD, edema, heart failure, or volume overload than routine HTN.",
  },
  {
    potency: "Moderate to low",
    drugClass: "Central alpha-2 agonists",
    examples: "Clonidine, methyldopa, guanfacine",
    startingDose: "Clonidine 0.1 mg BID; methyldopa 250 mg BID; guanfacine 0.5–1 mg daily",
    bestUse: "Refractory HTN; methyldopa in pregnancy. Limited by sedation and rebound.",
  },
  {
    potency: "Low to moderate",
    drugClass: "Beta-blockers",
    examples: "Metoprolol, bisoprolol, atenolol, carvedilol, labetalol",
    startingDose: "Metoprolol 50 mg daily/BID; bisoprolol 2.5 mg daily; atenolol 25 mg daily",
    bestUse: "CAD, arrhythmia, post-MI, heart failure, or pregnancy (labetalol) — not uncomplicated HTN alone.",
  },
  {
    potency: "Low",
    drugClass: "Alpha-1 blockers",
    examples: "Doxazosin, terazosin, prazosin",
    startingDose: "Doxazosin 1 mg daily; terazosin 1 mg daily; prazosin 1–2 mg BID",
    bestUse: "Add-on therapy, especially with concomitant BPH.",
  },
];

const getPotencyColor = (potency: Potency): string => {
  switch (potency) {
    case "Very high":
      return "bg-destructive/100/20 text-destructive border-red-500/30";
    case "High":
      return "bg-warning/100/20 text-warning border-warning/30";
    case "Moderate":
      return "bg-warning/100/20 text-warning border-amber-500/30";
    case "Moderate to low":
    case "Low to moderate":
      return "bg-warning/20 text-yellow-400 border-yellow-500/30";
    case "Low":
      return "bg-muted text-muted-foreground border-border";
    default:
      return "bg-muted text-muted-foreground border-border";
  }
};

export default function AntihypertensivePotencyTable() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky Header */}
      <div className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="mx-auto max-w-5xl px-4">
          <div className="flex items-center gap-3 py-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-md">
              <Gauge className="h-5 w-5 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="font-display text-xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-600 bg-clip-text text-transparent truncate">
                Antihypertensive Potency
              </h1>
              <p className="text-xs font-medium text-emerald-500 dark:text-emerald-400 truncate">
                Drug Efficacy and Clinical Application
              </p>
            </div>
            <div className="flex items-center gap-2 no-print shrink-0">
              <Button variant="ghost" size="sm" onClick={() => navigate("/")} title="Back to Home">
                <Home className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-5xl px-4 py-5 space-y-6">
        {/* Key Considerations Alert */}
        <div className="rounded-lg border-2 border-amber-500/40 bg-warning/100/5 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5" />
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">Key Considerations in Drug Selection</p>
              <ul className="text-xs text-muted-foreground space-y-1 list-disc pl-4">
                <li>Potency alone should not drive drug selection — consider comorbidities, side effects, and patient preferences</li>
                <li>Thiazide-like diuretics (chlorthalidone, indapamide) preferred over HCTZ for cardiovascular outcomes</li>
                <li>ACE inhibitors and ARBs have similar efficacy but different side effect profiles</li>
                <li>Beta-blockers are no longer first-line for uncomplicated hypertension</li>
                <li>Combination therapy often needed for BP control — start with complementary mechanisms</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Potency Table */}
        <Card className="clinical-card">
          <CardHeader>
            <CardTitle className="text-lg">Drug Potency and Clinical Application</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-32">Potency</TableHead>
                    <TableHead>Drug Class</TableHead>
                    <TableHead>Examples</TableHead>
                    <TableHead>Starting Dose</TableHead>
                    <TableHead className="w-1/3">Best Use</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {drugData.map((row, index) => (
                    <TableRow key={index} className="hover:bg-muted/50">
                      <TableCell>
                        <Badge variant="outline" className={getPotencyColor(row.potency)}>
                          {row.potency}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">{row.drugClass}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{row.examples}</TableCell>
                      <TableCell className="text-sm">
                        <div className="flex flex-col gap-1.5">
                          <span>{row.startingDose}</span>
                          <div className="flex flex-wrap gap-1">
                            {Array.from(new Set(row.startingDose.split(/;|,/).map(s => s.trim()).filter(Boolean))).map((seg, si) => (
                              <FrequencyBadge key={si} frequency={seg} />
                            ))}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{row.bestUse}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Reference Card */}
        <Card className="clinical-card border-primary/20">
          <CardHeader>
            <CardTitle className="text-base">Clinical Pearls</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <p className="text-sm font-medium">Resistant Hypertension (≥3 drugs)</p>
                <p className="text-xs text-muted-foreground">
                  Confirm adherence, white-coat effect, and secondary causes first. Then add spironolactone 25 mg
                  — PATHWAY-2 trial showed best add-on efficacy.
                </p>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">Thiazide vs Loop Diuretics</p>
                <p className="text-xs text-muted-foreground">
                  Switch to loop diuretics (furosemide, torsemide) when eGFR &lt;30 mL/min/1.73m².
                  Thiazides lose efficacy at low GFR.
                </p>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">ACEi/ARB Combination</p>
                <p className="text-xs text-muted-foreground">
                  NEVER combine ACEi + ARB (dual RAAS blockade) — increases hyperkalemia and AKI risk
                  without additional benefit (ONTARGET/ALTITUDE trials).
                </p>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">Beta-Blocker Selection</p>
                <p className="text-xs text-muted-foreground">
                  Prefer cardioselective beta-blockers (metoprolol, bisoprolol) or vasodilating beta-blockers
                  (carvedilol, labetalol). Atenolol has inferior outcomes data.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
