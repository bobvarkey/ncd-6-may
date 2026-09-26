import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";


import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Sun,
  Calculator,
  Weight,
  User,
  AlertTriangle,
  ChevronDown,
  Info,
  Copy,
  Download,
  FlaskConical,
  Heart,
  Pill,
  Droplets,
} from "lucide-react";
import { copyToClipboard, formatClinicalNote, downloadTextFile } from "@/lib/clinical-utils";
import { cn } from "@/lib/utils";

// ── Types ──────────────────────────────────────────────────────

type AgeGroup = "child" | "adult" | "elderly";
type Severity = "severe" | "deficient" | "insufficient" | "adequate" | "unknown";

interface PatientInputs {
  age: string;
  weight: string;
  vitDLevel: string;
  calcium: string;
}

interface ClinicalFlags {
  pregnancy: boolean;
  breastfeeding: boolean;
  obesity: boolean;
  malabsorption: boolean;
  ckd: boolean;
  osteoporosis: boolean;
  anticonvulsants: boolean;
  bariatric: boolean;
}

interface DosingResult {
  severity: Severity;
  severityLabel: string;
  severityColor: string;
  correctionDose: string;
  correctionDuration: string;
  maintenanceDose: string;
  targetLevel: string;
  followUp: string;
  specialNotes: string[];
}

// ── Severity thresholds ───────────────────────────────────────

function getSeverity(level: number): Severity {
  if (level < 10) return "severe";
  if (level < 20) return "deficient";
  if (level < 30) return "insufficient";
  return "adequate";
}

const severityConfig: Record<Severity, { label: string; color: string; bg: string; border: string }> = {
  severe:    { label: "Severe Deficiency",  color: "text-red-400",  bg: "bg-red-500/10",  border: "border-red-500/30" },
  deficient: { label: "Deficiency",         color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/30" },
  insufficient: { label: "Insufficiency",   color: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/30" },
  adequate:  { label: "Adequate",           color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/30" },
  unknown:   { label: "—",                  color: "text-muted-foreground", bg: "bg-muted/10", border: "border-border/30" },
};

// ── Dosing logic ───────────────────────────────────────────────

function computeDosing(
  level: number,
  ageGroup: AgeGroup,
  weight: number | null,
  flags: ClinicalFlags
): DosingResult {
  const severity = getSeverity(level);
  const multiplier = (flags.obesity || flags.malabsorption || flags.bariatric) ? 2.5 : 1;
  const isChild = ageGroup === "child";
  const isElderly = ageGroup === "elderly";

  let correctionDose = "";
  let correctionDuration = "";
  let maintenanceDose = "";
  const targetLevel = "≥30 ng/mL (75 nmol/L)";
  const followUp = "Recheck 25(OH)D after 8–12 weeks";
  const specialNotes: string[] = [];

  switch (severity) {
    case "severe": {
      if (isChild) {
        const base = Math.round(2000 * multiplier);
        correctionDose = `${base}–${Math.round(base * 2)} IU/day`;
        correctionDuration = "6–8 weeks";
      } else {
        const weekly = Math.round(60000 * multiplier);
        correctionDose = `${weekly.toLocaleString()} IU/week`;
        correctionDuration = "8 weeks";
      }
      break;
    }
    case "deficient": {
      if (isChild) {
        const base = Math.round(1000 * multiplier);
        correctionDose = `${base}–${Math.round(base * 2)} IU/day`;
        correctionDuration = "6–8 weeks";
      } else {
        const weekly = Math.round(60000 * multiplier);
        correctionDose = `${weekly.toLocaleString()} IU/week`;
        correctionDuration = "6–8 weeks";
      }
      break;
    }
    case "insufficient": {
      if (isChild) {
        correctionDose = `${Math.round(600 * multiplier)}–${Math.round(1000 * multiplier)} IU/day`;
        correctionDuration = "8–12 weeks";
      } else {
        const daily = Math.round(1000 * multiplier);
        correctionDose = `${daily}–${Math.round(daily * 2)} IU/day or ${Math.round(60000 * multiplier).toLocaleString()} IU/monthly`;
        correctionDuration = "8–12 weeks";
      }
      break;
    }
    case "adequate": {
      correctionDose = "None needed";
      correctionDuration = "—";
      break;
    }
  }

  // Maintenance dosing
  if (severity === "adequate") {
    if (isChild) maintenanceDose = "600 IU/day";
    else if (isElderly) maintenanceDose = "800–2,000 IU/day";
    else if (flags.pregnancy || flags.breastfeeding) maintenanceDose = "1,000–2,000 IU/day";
    else if (flags.osteoporosis) maintenanceDose = "1,000–2,000 IU/day";
    else maintenanceDose = "600–2,000 IU/day (if risk factors present)";
  } else {
    // After correction
    if (isChild) maintenanceDose = "600–1,000 IU/day";
    else if (isElderly) maintenanceDose = "800–2,000 IU/day";
    else if (flags.pregnancy || flags.breastfeeding) maintenanceDose = "1,000–2,000 IU/day";
    else if (flags.osteoporosis) maintenanceDose = "1,000–2,000 IU/day";
    else maintenanceDose = "1,000–2,000 IU/day";
  }

  // Special population notes
  if (flags.obesity) specialNotes.push("Obesity: may require 2–3× higher doses due to sequestration in adipose tissue.");
  if (flags.malabsorption) specialNotes.push("Malabsorption: consider higher doses or intramuscular vitamin D. Monitor levels closely.");
  if (flags.bariatric) specialNotes.push("Post-bariatric surgery: high risk of deficiency. May need lifelong high-dose supplementation (2,000–6,000 IU/day).");
  if (flags.ckd) specialNotes.push("CKD: may require active vitamin D analogs (calcitriol/paricalcitol) under specialist supervision. Monitor Ca, PO4, PTH.");
  if (flags.anticonvulsants) specialNotes.push("Anticonvulsant therapy: induces CYP450, accelerates vitamin D catabolism. May need 2–3× higher doses.");
  if (flags.pregnancy) specialNotes.push("Pregnancy: target 25(OH)D ≥30 ng/mL. Avoid high-dose bolus therapy. Monitor Ca levels.");
  if (flags.breastfeeding) specialNotes.push("Breastfeeding: maintain 1,000–2,000 IU/day. Infant may need 400 IU/day supplementation.");
  if (flags.osteoporosis) specialNotes.push("Osteoporosis: target 25(OH)D ≥30 ng/mL (some guidelines suggest ≥40 ng/mL). Ensure adequate calcium intake.");
  if (isElderly) specialNotes.push("Elderly: increased risk of deficiency due to reduced cutaneous synthesis, dietary intake, and renal 1α-hydroxylase activity.");

  if (weight !== null && weight < 40 && !isChild) {
    specialNotes.push(`Low body weight (${weight} kg): consider lower end of dosing range to avoid toxicity.`);
  }

  return {
    severity,
    severityLabel: severityConfig[severity].label,
    severityColor: severityConfig[severity].color,
    correctionDose,
    correctionDuration,
    maintenanceDose,
    targetLevel,
    followUp,
    specialNotes,
  };
}

// ── Age group helper ───────────────────────────────────────────

function getAgeGroup(age: number): AgeGroup {
  if (age < 18) return "child";
  if (age >= 65) return "elderly";
  return "adult";
}

// ── Component ──────────────────────────────────────────────────

export default function VitaminDDosingCalculator() {
  const [inputs, setInputs] = useState<PatientInputs>({
    age: "",
    weight: "",
    vitDLevel: "",
    calcium: "",
  });
  const [flags, setFlags] = useState<ClinicalFlags>({
    pregnancy: false,
    breastfeeding: false,
    obesity: false,
    malabsorption: false,
    ckd: false,
    osteoporosis: false,
    anticonvulsants: false,
    bariatric: false,
  });

  const updateInput = (field: keyof PatientInputs, value: string) =>
    setInputs((prev) => ({ ...prev, [field]: value }));

  const toggleFlag = (field: keyof ClinicalFlags) =>
    setFlags((prev) => ({ ...prev, [field]: !prev[field] }));

  const reset = () => {
    setInputs({ age: "", weight: "", vitDLevel: "", calcium: "" });
    setFlags({
      pregnancy: false,
      breastfeeding: false,
      obesity: false,
      malabsorption: false,
      ckd: false,
      osteoporosis: false,
      anticonvulsants: false,
      bariatric: false,
    });
  };

  const age = parseFloat(inputs.age);
  const weight = inputs.weight ? parseFloat(inputs.weight) : null;
  const vitDLevel = parseFloat(inputs.vitDLevel);
  const hasRequired = !isNaN(age) && !isNaN(vitDLevel);

  const ageGroup = !isNaN(age) ? getAgeGroup(age) : null;

  const result = useMemo(() => {
    if (!hasRequired) return null;
    return computeDosing(vitDLevel, ageGroup!, weight, flags);
  }, [vitDLevel, ageGroup, weight, flags, hasRequired]);

  const flagButtons: { key: keyof ClinicalFlags; label: string; icon: React.ReactNode }[] = [
    { key: "pregnancy", label: "Pregnancy", icon: <Heart className="h-3.5 w-3.5" /> },
    { key: "breastfeeding", label: "Breastfeeding", icon: <Droplets className="h-3.5 w-3.5" /> },
    { key: "obesity", label: "Obesity (BMI ≥30)", icon: <Weight className="h-3.5 w-3.5" /> },
    { key: "malabsorption", label: "Malabsorption", icon: <AlertTriangle className="h-3.5 w-3.5" /> },
    { key: "ckd", label: "CKD", icon: <FlaskConical className="h-3.5 w-3.5" /> },
    { key: "osteoporosis", label: "Osteoporosis", icon: <Info className="h-3.5 w-3.5" /> },
    { key: "anticonvulsants", label: "Anticonvulsants", icon: <Pill className="h-3.5 w-3.5" /> },
    { key: "bariatric", label: "Post-bariatric", icon: <AlertTriangle className="h-3.5 w-3.5" /> },
  ];

  const handleCopy = () => {
    if (!result) return;
    const lines = [
      "Vitamin D Dosing Calculator — Clinical Note",
      "═══════════════════════════════════════════",
      `Age: ${inputs.age} years (${ageGroup})`,
      `Weight: ${inputs.weight || "—"} kg`,
      `25(OH)D: ${inputs.vitDLevel} ng/mL`,
      `Severity: ${result.severityLabel}`,
      "",
      "Correction Phase:",
      `  Dose: ${result.correctionDose}`,
      `  Duration: ${result.correctionDuration}`,
      "",
      `Maintenance: ${result.maintenanceDose}`,
      `Target: ${result.targetLevel}`,
      `Follow-up: ${result.followUp}`,
    ];
    if (result.specialNotes.length) {
      lines.push("", "Special Considerations:");
      result.specialNotes.forEach((n) => lines.push(`  • ${n}`));
    }
    copyToClipboard(lines.join("\n"));
  };

  const handlePrint = () => {
    if (!result) return;
    const note = formatClinicalNote({
      title: "Vitamin D Dosing Plan",
      inputs: {
        Age: `${inputs.age} yr (${ageGroup})`,
        Weight: `${inputs.weight || "—"} kg`,
        "25(OH)D": `${inputs.vitDLevel} ng/mL — ${result.severityLabel}`,
      },
      results: {
        Correction: `${result.correctionDose} for ${result.correctionDuration}`,
        Maintenance: result.maintenanceDose,
        Target: result.targetLevel,
        "Follow-up": result.followUp,
      },
      recommendations: result.specialNotes,
    });
    downloadTextFile(note, `vitamin-d-plan-${Date.now()}.txt`);
  };

  return (
    <Card className="border-border/60">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Calculator className="h-5 w-5 text-amber-400" />
          Vitamin D Dosing Calculator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="vitd-age" className="text-sm font-medium">
              Age <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <User className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="vitd-age"
                type="number" inputMode="numeric" min="0" max="120"
                placeholder="e.g. 45"
                value={inputs.age}
                onChange={(e) => updateInput("age", e.target.value)}
                className="pl-8 h-9"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="vitd-weight" className="text-sm font-medium">
              Weight (kg)
            </Label>
            <div className="relative">
              <Weight className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="vitd-weight"
                type="number" inputMode="decimal" min="0" max="300" step="0.1"
                placeholder="e.g. 70"
                value={inputs.weight}
                onChange={(e) => updateInput("weight", e.target.value)}
                className="pl-8 h-9"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="vitd-level" className="text-sm font-medium">
              25(OH)D Level (ng/mL) <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <Sun className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="vitd-level"
                type="number" inputMode="decimal" min="0" max="200" step="0.1"
                placeholder="e.g. 12.5"
                value={inputs.vitDLevel}
                onChange={(e) => updateInput("vitDLevel", e.target.value)}
                className="pl-8 h-9"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="vitd-calcium" className="text-sm font-medium">
              Calcium (mg/dL, optional)
            </Label>
            <div className="relative">
              <FlaskConical className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="vitd-calcium"
                type="number" inputMode="decimal" min="0" max="20" step="0.1"
                placeholder="e.g. 9.5"
                value={inputs.calcium}
                onChange={(e) => updateInput("calcium", e.target.value)}
                className="pl-8 h-9"
              />
            </div>
          </div>
        </div>

        {/* Clinical Flags */}
        <div>
          <Label className="text-sm font-medium block mb-2">Clinical Context</Label>
          <div className="flex flex-wrap gap-2">
            {flagButtons.map(({ key, label, icon }) => (
              <button
                key={key}
                type="button"
                onClick={() => toggleFlag(key)}
                className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all border",
                  flags[key]
                    ? "bg-primary/15 border-primary/40 text-primary"
                    : "bg-card border-border/50 text-muted-foreground hover:border-border/80"
                )}
              >
                {icon}
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={reset} className="gap-1.5">
            <Calculator className="h-3.5 w-3.5" />
            Reset
          </Button>
        </div>

        {/* Results */}
        {result && (
          <div className="space-y-4 pt-2 border-t border-border/40">
            {/* Severity badge */}
            <div className="flex items-center gap-3">
              <Badge className={cn("text-sm px-3 py-1", result.severityColor, result.severity === "adequate" ? "bg-emerald-500/15" : result.severity === "severe" ? "bg-red-500/15" : result.severity === "deficient" ? "bg-amber-500/15" : "bg-yellow-500/15")}>
                {result.severityLabel}
              </Badge>
              {ageGroup && (
                <span className="text-xs text-muted-foreground">
                  {ageGroup === "child" ? "Pediatric" : ageGroup === "elderly" ? "Geriatric" : "Adult"} dosing
                </span>
              )}
            </div>

            {/* Dosing plan */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className={cn("rounded-lg border p-3", severityConfig[result.severity].border)}>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Correction Phase</div>
                <div className="text-sm font-semibold text-foreground">{result.correctionDose}</div>
                {result.correctionDuration !== "—" && (
                  <div className="text-xs text-muted-foreground mt-0.5">for {result.correctionDuration}</div>
                )}
              </div>
              <div className="rounded-lg border border-border/50 p-3">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Maintenance</div>
                <div className="text-sm font-semibold text-foreground">{result.maintenanceDose}</div>
              </div>
              <div className="rounded-lg border border-border/50 p-3">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Target Level</div>
                <div className="text-sm font-semibold text-foreground">{result.targetLevel}</div>
              </div>
              <div className="rounded-lg border border-border/50 p-3">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Follow-up</div>
                <div className="text-sm font-semibold text-foreground">{result.followUp}</div>
              </div>
            </div>

            {/* Special notes */}
            {result.specialNotes.length > 0 && (
              <Collapsible className="w-full">
                <CollapsibleTrigger className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
                  <Info className="h-3 w-3" />
                  Special considerations ({result.specialNotes.length})
                  <ChevronDown className="h-3 w-3 ml-1 collapsible-chevron" />
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-2 space-y-1.5">
                  {result.specialNotes.map((note, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-muted-foreground bg-card/50 rounded-lg p-2 border border-border/30">
                      <AlertTriangle className="h-3 w-3 mt-0.5 shrink-0 text-amber-400" />
                      <span>{note}</span>
                    </div>
                  ))}
                </CollapsibleContent>
              </Collapsible>
            )}

            {/* Export buttons */}
            <div className="flex flex-wrap gap-2 pt-1">
              <Button variant="outline" size="sm" onClick={handleCopy} className="gap-1.5">
                <Copy className="h-3.5 w-3.5" />
                Copy Plan
              </Button>
              <Button variant="outline" size="sm" onClick={handlePrint} className="gap-1.5">
                <Download className="h-3.5 w-3.5" />
                Download Note
              </Button>
            </div>
          </div>
        )}

        {!hasRequired && (
          <p className="text-xs text-muted-foreground/60 italic text-center pt-2">
            Enter age and 25(OH)D level to calculate a personalized dosing plan.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
