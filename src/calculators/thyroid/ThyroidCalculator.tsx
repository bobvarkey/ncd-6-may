import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Activity,
  Pill,
  AlertTriangle,
  FlaskConical,
  Home,
  RotateCcw,
  Calculator,
  BookOpen,
  Info,
  Shield,
  Copy,
  Printer,
  Download,
  ImageIcon,
} from "lucide-react";
import { copyToClipboard, formatClinicalNote, downloadTextFile } from "@/lib/clinical-utils";
import { cn } from "@/lib/utils";
import { AbbreviationHover } from "@/components/AbbreviationHover";
import ImageLink from "@/components/ImageLink";

type TabKey = "calculator" | "reference" | "about";

const TABS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  { key: "calculator", label: "Calculator", icon: <Calculator className="h-4 w-4" /> },
  { key: "reference", label: "Reference", icon: <BookOpen className="h-4 w-4" /> },
  { key: "about", label: "About", icon: <Info className="h-4 w-4" /> },
];

interface PatientInputs {
  tsh: string;
  ft4: string;
  ft3: string;
  tpo: "yes" | "no";
  trab: "yes" | "no";
  pregnant: "yes" | "no";
  weight: string;
  age: string;
  cardiac: "yes" | "no";
  severity: "mild" | "moderate" | "severe";
}

interface DiagnosisResult {
  diagnosis: string;
  color: "success" | "warning" | "error" | "primary";
  rationale: string[];
  keyValues: { label: string; value: string }[];
}

interface MedicationResult {
  levoText: string;
  levoDose: number;
  methimazoleText: string;
  methimazoleDose: number;
}

const EMPTY_INPUTS: PatientInputs = {
  tsh: "",
  ft4: "",
  ft3: "",
  tpo: "no",
  trab: "no",
  pregnant: "no",
  weight: "",
  age: "",
  cardiac: "no",
  severity: "mild",
};

const DEFAULT_INPUTS: PatientInputs = {
  tsh: "8.5",
  ft4: "0.7",
  ft3: "2.7",
  tpo: "yes",
  trab: "no",
  pregnant: "no",
  weight: "70",
  age: "42",
  cardiac: "no",
  severity: "mild",
};

const SEVERITY_LABELS: Record<string, string> = {
  mild: "Mild",
  moderate: "Moderate",
  severe: "Severe",
};

type DiagnosisColor = "success" | "warning" | "error" | "primary";

function fmt(n: number, d = 1): string {
  return Number.isFinite(n) ? n.toFixed(d) : "—";
}

function analyze(
  tsh: number,
  ft4: number,
  ft3: number,
  tpo: boolean,
  trab: boolean
): DiagnosisResult {
  const tshLow = tsh < 0.4, tshHigh = tsh > 4.0, tshSuppressed = tsh < 0.1;
  const ft4Low = ft4 < 0.8, ft4High = ft4 > 1.8;
  const t3High = ft3 > 4.2;

  if (tshHigh && ft4Low) {
    const r: string[] = [
      "High TSH with low FT4 is the classic biochemical pattern of primary hypothyroidism.",
    ];
    if (tpo) r.push("Anti-TPO positivity supports autoimmune thyroiditis, most often Hashimoto disease.");
    return { diagnosis: "Overt Primary Hypothyroidism", color: "success", rationale: r, keyValues: [] };
  }

  if (tshHigh && !ft4Low && !ft4High) {
    const r: string[] = [
      "High TSH with normal FT4 fits subclinical hypothyroidism.",
    ];
    if (tpo) r.push("Positive thyroid antibodies increase the chance of progression to overt disease.");
    return { diagnosis: "Subclinical Hypothyroidism", color: "warning", rationale: r, keyValues: [] };
  }

  if ((tshLow || tshSuppressed) && (ft4High || t3High)) {
    const r: string[] = [
      "Low or suppressed TSH with elevated FT4 or T3 indicates overt thyrotoxicosis.",
    ];
    if (trab) r.push("Positive TRAb/TSI strongly supports Graves disease.");
    else r.push("If TRAb is negative, consider toxic nodular disease, thyroiditis, or exogenous thyroid hormone.");
    return { diagnosis: "Overt Thyrotoxicosis / Hyperthyroidism", color: "error", rationale: r, keyValues: [] };
  }

  if ((tshLow || tshSuppressed) && !ft4High && !ft4Low) {
    return {
      diagnosis: "Subclinical Hyperthyroidism or Early Thyrotoxicosis",
      color: "warning",
      rationale: [
        "Low TSH with normal FT4 and non-elevated T3 suggests subclinical hyperthyroidism, early Graves disease, thyroiditis, or over-replacement.",
      ],
      keyValues: [],
    };
  }

  if (!tshHigh && !tshLow && ft4Low) {
    return {
      diagnosis: "Possible Central Hypothyroidism",
      color: "error",
      rationale: [
        "A low FT4 without an appropriately elevated TSH suggests pituitary or hypothalamic disease, or severe NTI.",
        "This pattern needs clinical correlation and pituitary review; TSH alone is not reliable here.",
      ],
      keyValues: [],
    };
  }

  return {
    diagnosis: "Near-Euthyroid or Indeterminate Pattern",
    color: "primary",
    rationale: [
      "These values do not fit a single classic pattern. Recheck against the local laboratory range, medication use, illness state, and pregnancy-specific thresholds.",
    ],
    keyValues: [],
  };
}

function getMedications(
  dx: DiagnosisResult,
  tsh: number,
  weight: number,
  age: number,
  cardiac: boolean,
  pregnant: boolean,
  tpo: boolean,
  severity: string
): MedicationResult {
  let levoDose = 0;
  let levoText = "Levothyroxine not automatically suggested from this pattern.";

  if (dx.diagnosis === "Overt Primary Hypothyroidism") {
    if (cardiac || age >= 65) {
      levoDose = 25;
      levoText = `Suggested starting levothyroxine: ${levoDose} mcg daily, with cautious titration every 4–6 weeks because older age, frailty, or coronary disease lowers the starting dose.`;
    } else {
      levoDose = Math.round(weight * 1.6);
      levoText = `Estimated full replacement levothyroxine dose: about ${levoDose} mcg daily (${fmt(weight * 1.6)} mcg/kg/day). Round to a practical tablet strength and titrate to TSH.`;
    }
  } else if (dx.diagnosis === "Subclinical Hypothyroidism") {
    const treat = tsh >= 10 || pregnant || tpo;
    if (treat) {
      levoDose = cardiac || age >= 65 ? 25 : 50;
      const reasons: string[] = [];
      if (tsh >= 10) reasons.push(`TSH ${fmt(tsh,1)} mIU/L`);
      if (pregnant) reasons.push("pregnancy is present");
      if (tpo) reasons.push("anti-TPO is positive");
      levoText = `Treatment can be considered because ${reasons.join(", ")}. A common starting dose is ${levoDose} mcg daily, then retest in 6–8 weeks.`;
    } else {
      levoText = "Observation with repeat TSH and FT4 in 6–12 weeks is reasonable if symptoms are mild and there is no pregnancy, strong antibody signal, or TSH ≥ 10.";
    }
  }

  let methimazoleDose = 0;
  let methimazoleText = "Methimazole not automatically suggested from this pattern.";

  if (dx.diagnosis.includes("Thyrotoxicosis") || dx.diagnosis.includes("Hyperthyroidism")) {
    const dose = severity === "mild" ? 10 : severity === "moderate" ? 20 : 30;
    methimazoleDose = dose;
    if (pregnant) {
      methimazoleText = "In pregnancy, antithyroid drug choice depends on trimester; propylthiouracil is generally preferred in the first trimester, while methimazole is more commonly used later. Specialist review is advised.";
    } else {
      methimazoleText = `Estimated starting methimazole dose: ${dose} mg/day for ${SEVERITY_LABELS[severity]?.toLowerCase() ?? severity} biochemical hyperthyroidism, with follow-up FT4 and T3 in about 4 weeks and later dose reduction once euthyroid. Check baseline CBC and liver profile before treatment.`;
    }
  }

  return { levoText, levoDose, methimazoleText, methimazoleDose };
}

function getNextSteps(dx: DiagnosisResult): string[] {
  const next: string[] = [];
  if (dx.diagnosis === "Overt Primary Hypothyroidism" || dx.diagnosis === "Subclinical Hypothyroidism") {
    next.push("Repeat TSH about 6 weeks after starting or changing levothyroxine.");
    next.push("Consider anti-TPO if not already known, especially if etiology is unclear.");
  }
  if (dx.diagnosis.includes("Thyrotoxicosis") || dx.diagnosis.includes("Hyperthyroidism")) {
    next.push("Order TRAb/TSI if Graves disease is suspected and antibody status is unknown.");
    next.push("Consider thyroid uptake scan when etiology is unclear and pregnancy is excluded.");
    next.push("Check baseline CBC and LFTs before antithyroid drug therapy.");
  }
  if (dx.diagnosis.includes("Central")) {
    next.push("Assess other pituitary axes and consider pituitary imaging.");
  }
  if (!next.length) {
    next.push("Interpret against symptoms, goiter, drugs such as amiodarone or biotin, and the local assay reference range.");
  }
  return next;
}

const badgeVariants: Record<DiagnosisColor, string> = {
  success: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  warning: "bg-warning/100/20 text-warning border-amber-500/30",
  error: "bg-destructive/100/20 text-destructive border-red-500/30",
  primary: "bg-blue-500/20 text-blue-400 border-blue-500/30",
};

const colorClasses: Record<DiagnosisColor, { bg: string; border: string; accent: string }> = {
  success: { bg: "bg-emerald-500/10", border: "border-emerald-500/30", accent: "bg-emerald-500" },
  warning: { bg: "bg-warning/100/10", border: "border-amber-500/30", accent: "bg-warning/100" },
  error: { bg: "bg-destructive/100/10", border: "border-red-500/30", accent: "bg-destructive/100" },
  primary: { bg: "bg-blue-500/10", border: "border-blue-500/30", accent: "bg-blue-500" },
};

const PATTERN_TABLE = [
  { pattern: "High TSH + low FT4", interpretation: "Primary hypothyroidism; anti-TPO positivity supports Hashimoto pattern." },
  { pattern: "High TSH + normal FT4", interpretation: "Subclinical hypothyroidism." },
  { pattern: "Low TSH + high FT4 or T3", interpretation: "Overt thyrotoxicosis/hyperthyroidism." },
  { pattern: "Low TSH + normal FT4/FT3", interpretation: "Subclinical hyperthyroidism, early Graves, thyroiditis, or over-replacement." },
  { pattern: "Low/normal TSH + low FT4", interpretation: "Sick euthyroid (NTI); TSH suppressed by systemic illness; retest after recovery." },
  { pattern: "Normal TSH + normal FT4", interpretation: "Euthyroid — normal thyroid function." },
];

export default function ThyroidCalculator() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabKey>("calculator");
  const [inputs, setInputs] = useState<PatientInputs>(() => {
    try {
      const saved = localStorage.getItem("ncd_inputs_thyroid");
      return saved ? JSON.parse(saved) : DEFAULT_INPUTS;
    } catch { return DEFAULT_INPUTS; }
  });
  const [calculated, setCalculated] = useState(false);

  // Auto-save
  useEffect(() => {
    localStorage.setItem("ncd_inputs_thyroid", JSON.stringify(inputs));
  }, [inputs]);

  // Auto-calc on mount
  const result = useMemo(() => {
    if (!calculated) return null;
    const tsh = parseFloat(inputs.tsh);
    const ft4 = parseFloat(inputs.ft4);
    const ft3 = parseFloat(inputs.ft3);
    const weight = parseFloat(inputs.weight);
    const age = parseInt(inputs.age, 10);

    // Minimum: TSH is enough for partial analysis
    if (isNaN(tsh)) return null;

    const tpo = inputs.tpo === "yes";
    const trab = inputs.trab === "yes";
    const pregnant = inputs.pregnant === "yes";
    const cardiac = inputs.cardiac === "yes";

    const dx = analyze(tsh, ft4, ft3, tpo, trab);

    // Partial: if weight/age missing, still diagnose but give limited meds
    const hasMeds = !isNaN(weight) && weight > 0 && !isNaN(age);
    const meds = hasMeds
      ? getMedications(dx, tsh, weight, age, cardiac, pregnant, tpo, inputs.severity)
      : { levoDose: 0, levoText: 'Enter weight and age to estimate levothyroxine dose.', methimazoleDose: 0, methimazoleText: 'Enter weight and age to estimate methimazole dose.' };
    const nextSteps = getNextSteps(dx);

    return { dx, meds, nextSteps };
  }, [calculated, inputs]);

  function handleInput(key: keyof PatientInputs, value: string | number) {
    setInputs(prev => ({ ...prev, [key]: String(value) }));
    setCalculated(false);
  }

  function handleSmartParse(values: Record<string, string>) {
    Object.entries(values).forEach(([key, value]) => {
      handleInput(key as keyof PatientInputs, value);
    });
  }

  function calculate() {
    setCalculated(true);
  }

  function resetForm() {
    setInputs(DEFAULT_INPUTS);
    setCalculated(true);
    localStorage.removeItem("ncd_inputs_thyroid");
  }

  const colors = result ? colorClasses[result.dx.color] : colorClasses.primary;

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky Header */}
      <div className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="mx-auto max-w-4xl px-4">
          <div className="flex items-center gap-3 py-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 shadow-md">
              <Activity className="h-5 w-5 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="font-display text-xl font-extrabold tracking-tight bg-gradient-to-r from-teal-500 via-emerald-500 to-green-500 bg-clip-text text-transparent truncate">
                Thyroid Evaluation Calculator
              </h1>
              <p className="text-xs font-medium text-emerald-500 dark:text-emerald-400 truncate">
                TSH · FT4 · T3 interpretation with medication estimation
              </p>
            </div>
            <div className="flex items-center gap-2 no-print shrink-0">
              <Button variant="ghost" size="sm" onClick={() => navigate("/home")} title="Back to Home">
                <Home className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={resetForm} title="Reset">
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="flex gap-0.5 pb-2 overflow-x-auto no-print">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  "flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-2 text-xs font-semibold transition-colors",
                  activeTab === tab.key
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-4xl px-4 py-5 space-y-6">
        {activeTab === "calculator" && (
          <>
            {/* Disclaimer */}
            <div className="flex items-start gap-3 bg-amber-900/20 border border-amber-800/50 rounded-xl px-4 py-3 text-sm text-amber-300">
              <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0 text-amber-500" />
              <p>
                For <strong>educational and decision-support purposes only</strong>. Final prescribing depends on local reference ranges, etiology, pregnancy status, arrhythmia risk, and clinical review.
              </p>
            </div>


            {/* Inputs */}
            <Card className="clinical-card border-primary/20">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <FlaskConical className="h-4 w-4 text-primary" />
                  Lab Values &amp; Clinical Context
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="tsh">TSH (mIU/L)</Label>
                    <Input id="tsh" type="number" step="0.01" value={inputs.tsh} onChange={(e) => handleInput("tsh", e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ft4">Free T4 (ng/dL)</Label>
                    <Input id="ft4" type="number" step="0.01" value={inputs.ft4} onChange={(e) => handleInput("ft4", e.target.value)} />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="ft3">Free or Total T3</Label>
                    <Input id="ft3" type="number" step="0.01" value={inputs.ft3} onChange={(e) => handleInput("ft3", e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tpo"><AbbreviationHover term="TPO">Anti-TPO / TgAb</AbbreviationHover> positive?</Label>
                    <select id="tpo" value={inputs.tpo} onChange={(e) => handleInput("tpo", e.target.value)} className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                      <option value="no">No</option>
                      <option value="yes">Yes</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="trab"><AbbreviationHover term="TRAb">TRAb / TSI</AbbreviationHover> positive?</Label>
                    <select id="trab" value={inputs.trab} onChange={(e) => handleInput("trab", e.target.value)} className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                      <option value="no">No</option>
                      <option value="yes">Yes</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="weight">Weight (kg)</Label>
                    <Input id="weight" type="number" step="0.1" value={inputs.weight} onChange={(e) => handleInput("weight", e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="age">Age (years)</Label>
                    <Input id="age" type="number" step="1" value={inputs.age} onChange={(e) => handleInput("age", e.target.value)} />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cardiac">Coronary disease / elderly frail?</Label>
                    <select id="cardiac" value={inputs.cardiac} onChange={(e) => handleInput("cardiac", e.target.value)} className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                      <option value="no">No</option>
                      <option value="yes">Yes</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pregnant">Pregnant?</Label>
                    <select id="pregnant" value={inputs.pregnant} onChange={(e) => handleInput("pregnant", e.target.value)} className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                      <option value="no">No</option>
                      <option value="yes">Yes</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="severity">Hyperthyroidism severity</Label>
                    <select id="severity" value={inputs.severity} onChange={(e) => handleInput("severity", e.target.value)} className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                      <option value="mild">Mild</option>
                      <option value="moderate">Moderate</option>
                      <option value="severe">Severe</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-3 flex-wrap">
                  <Button size="lg" onClick={calculate}>
                    <Calculator className="h-4 w-4 mr-2" />
                    Calculate
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Results */}
            {result && (
              <div className="space-y-5">
                {/* Copy/Print toolbar */}
                <div className="flex items-center justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const note = formatClinicalNote({
                        title: "Thyroid Calculator",
                        inputs: { TSH: inputs.tsh, FT4: inputs.ft4, FT3: inputs.ft3, "TPO Ab": inputs.tpo, "TRAb": inputs.trab, Age: inputs.age, Weight: inputs.weight },
                        results: {
                          Diagnosis: result.dx.diagnosis,
                          "Levothyroxine Dose": result.meds.levoText,
                          "Methimazole Dose": result.meds.methimazoleText,
                        },
                        recommendations: result.nextSteps,
                        citation: "ATA Guidelines 2023",
                      });
                      copyToClipboard(note, "Results copied to clipboard!");
                    }}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const note = formatClinicalNote({
                        title: "Thyroid Calculator",
                        inputs: { TSH: inputs.tsh, FT4: inputs.ft4, FT3: inputs.ft3, "TPO Ab": inputs.tpo, "TRAb": inputs.trab, Age: inputs.age, Weight: inputs.weight },
                        results: {
                          Diagnosis: result.dx.diagnosis,
                          "Levothyroxine Dose": result.meds.levoText,
                          "Methimazole Dose": result.meds.methimazoleText,
                        },
                        recommendations: result.nextSteps,
                        citation: "ATA Guidelines 2023",
                      });
                      downloadTextFile(`thyroid-${new Date().toISOString().slice(0,10)}`, note);
                    }}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download .txt
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => window.print()}>
                    <Printer className="h-4 w-4 mr-2" />
                    Print
                  </Button>
                </div>

                {/* Diagnosis */}
                <div className={cn("rounded-xl border-2 p-5", colors.bg, colors.border)}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className={cn("w-3 h-3 rounded-full", colors.accent)} />
                      <h3 className="text-lg font-bold text-foreground">Diagnosis</h3>
                    </div>
                    <Badge className={cn("text-xs font-medium border", badgeVariants[result.dx.color])}>
                      {parseFloat(inputs.tsh).toFixed(2)} mIU/L TSH
                    </Badge>
                  </div>
                  <p className={cn("text-xl font-extrabold", colorClasses[result.dx.color].border.replace("border-", "text-").replace("/30", ""))}>
                    {result.dx.diagnosis}
                  </p>
                  <ul className="mt-2 space-y-1">
                    {result.dx.rationale.map((r, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-muted-foreground/50 flex-shrink-0" />
                        {r}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Medications */}
                <Card className={cn("clinical-card border-2",
                  result.meds.levoDose > 0 || result.meds.methimazoleDose > 0
                    ? "border-emerald-500/30" : "border-muted")}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Pill className="h-5 w-5 text-primary" />
                      Medication Guidance
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className={cn("rounded-lg border p-4", result.meds.levoDose > 0 ? "border-emerald-500/30 bg-emerald-500/5" : "border-muted bg-muted/20")}>
                      <div className="flex items-start gap-3">
                        <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", result.meds.levoDose > 0 ? "bg-emerald-500/20" : "bg-muted")}>
                          <Pill className={cn("h-4 w-4", result.meds.levoDose > 0 ? "text-emerald-400" : "text-muted-foreground")} />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-foreground">
                            Levothyroxine
                            {result.meds.levoDose > 0 && (
                              <Badge variant="outline" className="ml-2 text-xs">{result.meds.levoDose} mcg/day</Badge>
                            )}
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">{result.meds.levoText}</p>
                        </div>
                      </div>
                    </div>

                    <div className={cn("rounded-lg border p-4", result.meds.methimazoleDose > 0 ? "border-red-500/30 bg-destructive/100/5" : "border-muted bg-muted/20")}>
                      <div className="flex items-start gap-3">
                        <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", result.meds.methimazoleDose > 0 ? "bg-destructive/100/20" : "bg-muted")}>
                          <Shield className={cn("h-4 w-4", result.meds.methimazoleDose > 0 ? "text-destructive" : "text-muted-foreground")} />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-foreground">
                            Methimazole
                            {result.meds.methimazoleDose > 0 && (
                              <Badge variant="outline" className="ml-2 text-xs">{result.meds.methimazoleDose} mg/day</Badge>
                            )}
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">{result.meds.methimazoleText}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Next Steps */}
                <Card className="clinical-card border-amber-800/40 bg-amber-900/10">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2 text-warning">
                      <Activity className="h-4 w-4" />
                      Next Steps
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-1.5">
                      {result.nextSteps.map((step, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-amber-300/80">
                          <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-warning/100/50 flex-shrink-0" />
                          {step}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>
            )}
          </>
        )}

        {/* ── Reference Tab ── */}
        {activeTab === "reference" && (
          <div className="space-y-6">
            <Card className="clinical-card">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-primary" />
                  Pattern Interpretation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto rounded-xl border border-border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-muted border-b border-border">
                        <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Pattern</th>
                        <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Interpretation</th>
                      </tr>
                    </thead>
                    <tbody>
                      {PATTERN_TABLE.map((row, i) => (
                        <tr key={i} className={cn("border-b border-border", i % 2 === 0 ? "" : "bg-muted/30")}>
                          <td className="py-3 px-4 text-sm font-medium text-foreground">{row.pattern}</td>
                          <td className="py-3 px-4 text-sm text-muted-foreground">{row.interpretation}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            <Card className="clinical-card">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <FlaskConical className="h-4 w-4 text-primary" />
                  Common Thyroid Tests Explained
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { name: "TSH", desc: "Best screening test in most ambulatory adults. High TSH usually points to primary hypothyroidism, while low or suppressed TSH usually points to thyrotoxicosis." },
                    { name: "Free T4", desc: "Confirms hormone deficiency or excess. A low FT4 with high TSH indicates overt primary hypothyroidism; a high FT4 with low TSH indicates overt hyperthyroidism." },
                    { name: "T3", desc: "Most useful when hyperthyroidism is suspected and FT4 is normal or only slightly high, because some patients have T3-predominant thyrotoxicosis." },
                    { name: "Anti-TPO / TgAb", desc: "Support autoimmune hypothyroidism, especially Hashimoto disease. Antibody positivity also increases the likelihood that subclinical hypothyroidism will progress." },
                    { name: "TRAb / TSI", desc: "Supports Graves disease in a thyrotoxic patient and helps distinguish Graves from destructive thyroiditis when uptake scanning is not available." },
                    { name: "Other tests", desc: "Ultrasound is for nodules or structural disease, not routine biochemical diagnosis. Calcitonin and thyroglobulin are niche tests with specific oncology indications." },
                  ].map((test) => (
                    <div key={test.name} className="p-4 rounded-xl bg-muted/30 border border-border">
                      <h3 className="text-sm font-semibold text-foreground mb-1">{test.name}</h3>
                      <p className="text-xs text-muted-foreground leading-relaxed">{test.desc}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* ── Hyperthyroidism Algorithm Image ── */}
            <Card className="clinical-card">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <ImageIcon className="h-4 w-4 text-primary" />
                  Hyperthyroidism Algorithm
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ImageLink imageId="hyperthyroidism-algorithm" label="View Hyperthyroidism Algorithm →" />
                <p className="mt-3 text-xs text-muted-foreground">
                  Reference algorithm for hyperthyroidism evaluation and management.
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ── About Tab ── */}
        {activeTab === "about" && (
          <Card className="clinical-card">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Info className="h-4 w-4 text-primary" />
                About This Calculator
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground leading-relaxed">
              <p>
                This tool interprets common thyroid labs, explains likely patterns such as primary hypothyroidism, subclinical hypothyroidism, thyrotoxicosis, Graves pattern, thyroiditis, and central hypothyroidism, then estimates starting doses for levothyroxine and methimazole using common guideline logic.
              </p>
              <div>
                <h4 className="font-semibold text-foreground mb-1">Key References</h4>
                <ul className="space-y-1">
                  <li>• ATA/AACE Guidelines for Hypothyroidism in Adults (2012, updated)</li>
                  <li>• ATA Guidelines for Hyperthyroidism (2016, updated)</li>
                  <li>• ESC Guidelines for Thyroid and Cardiovascular Disease</li>
                  <li>• Local laboratory reference ranges apply — TSH 0.4–4.0 mIU/L, FT4 0.8–1.8 ng/dL used as defaults</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
