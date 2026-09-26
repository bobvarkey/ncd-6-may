import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Activity,
  Target,
  GitBranch,
  Search,
  Stethoscope,
  Beaker,
  AlertTriangle,
  Heart,
  Dna,
  TrendingUp,
  ShieldCheck,
  Info,
  Copy,
  Check,
} from "lucide-react";

const ALGORITHM = {
  algorithm_name: "Comprehensive Dyslipidemia Assessment & Management Algorithm",
  version: "2.0",
  purpose:
    "Systematic interpretation of advanced lipid testing, identification of cardiovascular phenotypes, evaluation of secondary causes, and clinical decision-making.",
  workflow: [
    {
      step: 1,
      title: "Obtain Initial Laboratory Evaluation",
      tests: [
        "Total Cholesterol",
        "LDL-C",
        "HDL-C",
        "Triglycerides",
        "ApoB",
        "LDL-P",
        "Lp(a)",
        "sdLDL",
        "hs-CRP",
        "Homocysteine",
        "HbA1c",
        "Fasting Insulin",
      ],
    },
    {
      step: 2,
      title: "Compare Against Functional Targets",
      targets: {
        ApoB: "<82 mg/dL",
        "LDL-P": "<1000 nmol/L",
        "Lp(a)": "<30 nmol/L",
        sdLDL: "<20 mg/dL",
        Triglycerides: "<80 mg/dL",
        HDL: ">55 mg/dL",
        "Total:HDL Ratio": "<3.5",
        "ApoB:ApoA1 Ratio": "<0.25",
        "hs-CRP": "<0.55 mg/L",
        Homocysteine: "<7.2 μmol/L",
        HbA1c: "<5.5%",
        "Fasting Insulin": "<5 μIU/mL",
      },
    },
    {
      step: 3,
      title: "Identify Cardiovascular Phenotype",
      decision_tree: [
        {
          if: "Triglycerides elevated AND HDL reduced AND sdLDL elevated",
          diagnosis: "Insulin Resistant Dyslipidemia",
          management: [
            "Treat insulin resistance",
            "LCHF (Low-Carbohydrate High-Fat diet)",
            "Exercise",
            "Consider berberine",
          ],
        },
        {
          if: "LDL-C >190 mg/dL with family history of premature CVD",
          diagnosis: "Familial Hypercholesterolemia",
          management: [
            "Genetic evaluation",
            "Refer specialist",
            "Monitor ApoB",
          ],
        },
        {
          if: "LDL-C normal but ApoB or LDL-P elevated",
          diagnosis: "Discordant LDL",
          management: [
            "Treat based on particle number rather than LDL-C",
          ],
        },
        {
          if: "Very high LDL + Low TG + High HDL + LCHF diet",
          diagnosis: "Lean Mass Hyper-Responder",
          management: [
            "Monitor ApoB carefully",
            "Avoid automatic statin initiation",
          ],
        },
        {
          if: "Lp(a) elevated",
          diagnosis: "High Lp(a) Phenotype",
          management: [
            "Aggressive ApoB reduction",
            "Optimize blood pressure",
            "Genetic counselling",
          ],
        },
        {
          if: "hs-CRP OR Lp-PLA2 OR MPO elevated",
          diagnosis: "Inflammatory Cardiovascular Pattern",
          management: [
            "Identify inflammatory source",
            "Treat underlying inflammation",
          ],
        },
        {
          if: "Metabolic syndrome features",
          diagnosis: "Metabolic Syndrome",
          management: [
            "Treat insulin resistance",
            "Evaluate NAFLD",
            "Control blood pressure",
            "Optimize lipid profile",
          ],
        },
      ],
    },
    {
      step: 4,
      title: "Investigate Root Causes",
      evaluate: [
        {
          driver: "Insulin Resistance",
          tests: ["Fasting insulin", "HOMA-IR", "TG:HDL ratio >2"],
        },
        {
          driver: "Hypothyroidism",
          tests: ["TSH", "Free T3", "LDL elevation"],
        },
        {
          driver: "NAFLD",
          tests: ["ALT", "GGT", "Liver imaging"],
        },
        {
          driver: "Inflammation / Infection",
          tests: ["hs-CRP", "Ferritin", "Dental/oral evaluation"],
        },
        {
          driver: "Gut Dysbiosis",
          tests: ["TMAO"],
        },
      ],
    },
  ],
};

const STEP_ICONS = [
  <Beaker className="h-5 w-5" />,
  <Target className="h-5 w-5" />,
  <GitBranch className="h-5 w-5" />,
  <Search className="h-5 w-5" />,
];

const STEP_COLORS = [
  "from-blue-500/20 to-cyan-500/20 border-blue-500/30",
  "from-emerald-500/20 to-teal-500/20 border-emerald-500/30",
  "from-amber-500/20 to-orange-500/20 border-amber-500/30",
  "from-purple-500/20 to-pink-500/20 border-purple-500/30",
];

const PHENOTYPE_COLORS: Record<string, string> = {
  "Insulin Resistant Dyslipidemia": "border-amber-500/30 bg-amber-500/5",
  "Familial Hypercholesterolemia": "border-red-500/30 bg-red-500/5",
  "Discordant LDL": "border-blue-500/30 bg-blue-500/5",
  "Lean Mass Hyper-Responder": "border-emerald-500/30 bg-emerald-500/5",
  "High Lp(a) Phenotype": "border-purple-500/30 bg-purple-500/5",
  "Inflammatory Cardiovascular Pattern": "border-orange-500/30 bg-orange-500/5",
  "Metabolic Syndrome": "border-rose-500/30 bg-rose-500/5",
};

const PHENOTYPE_ICONS: Record<string, React.ReactNode> = {
  "Insulin Resistant Dyslipidemia": <Activity className="h-4 w-4 text-amber-500" />,
  "Familial Hypercholesterolemia": <Dna className="h-4 w-4 text-red-500" />,
  "Discordant LDL": <TrendingUp className="h-4 w-4 text-blue-500" />,
  "Lean Mass Hyper-Responder": <Heart className="h-4 w-4 text-emerald-500" />,
  "High Lp(a) Phenotype": <AlertTriangle className="h-4 w-4 text-purple-500" />,
  "Inflammatory Cardiovascular Pattern": <ShieldCheck className="h-4 w-4 text-orange-500" />,
  "Metabolic Syndrome": <Info className="h-4 w-4 text-rose-500" />,
};

export default function LipidsComprehensiveAlgorithm() {
  const [copied, setCopied] = React.useState(false);

  const buildAlgorithmText = () => {
    const lines: string[] = [];
    lines.push(ALGORITHM.algorithm_name);
    lines.push(`v${ALGORITHM.version}`);
    lines.push(ALGORITHM.purpose);
    lines.push("");
    for (const step of ALGORITHM.workflow) {
      lines.push(`STEP ${step.step}: ${step.title}`);
      if ("tests" in step && step.tests) {
        lines.push("  Tests: " + (step.tests as string[]).join(", "));
      }
      if ("targets" in step && step.targets) {
        for (const [marker, target] of Object.entries(step.targets as Record<string, string>)) {
          lines.push(`  ${marker}: ${target}`);
        }
      }
      if ("decision_tree" in step && step.decision_tree) {
        for (const p of step.decision_tree as typeof ALGORITHM.workflow[2]["decision_tree"]) {
          lines.push(`  - If: ${p.if} → ${p.diagnosis}`);
          for (const m of p.management) lines.push(`      • ${m}`);
        }
      }
      if ("evaluate" in step && step.evaluate) {
        for (const c of step.evaluate as typeof ALGORITHM.workflow[3]["evaluate"]) {
          lines.push(`  - ${c.driver}: ${c.tests.join(", ")}`);
        }
      }
      lines.push("");
    }
    return lines.join("\n");
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(buildAlgorithmText());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-blue-500/30 bg-gradient-to-br from-blue-500/5 to-muted/5 p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500/20 to-cyan-500/20 backdrop-blur-md border border-blue-500/30">
            <Stethoscope className="h-5 w-5 text-blue-500" />
          </div>
          <div>
            <h3 className="font-display text-lg font-bold text-foreground">
              {ALGORITHM.algorithm_name}
            </h3>
            <div className="flex items-center gap-2 mt-0.5">
              <Badge variant="outline" className="text-xs">
                v{ALGORITHM.version}
              </Badge>
            </div>
          </div>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {ALGORITHM.purpose}
        </p>
        <button
          type="button"
          onClick={handleCopy}
          className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted/40"
        >
          {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? "Copied" : "Copy Algorithm"}
        </button>
      </Card>

      {/* Workflow Steps */}
      {ALGORITHM.workflow.map((step, idx) => (
        <Card
          key={step.step}
          className={`border bg-card p-5 bg-gradient-to-br ${STEP_COLORS[idx]}`}
        >
          {/* Step Header */}
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-background/80 border border-border/50">
              {STEP_ICONS[idx]}
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Step {step.step}
              </p>
              <h4 className="font-display font-bold text-foreground">
                {step.title}
              </h4>
            </div>
          </div>

          {/* Step 1: Lab Tests */}
          {"tests" in step && step.tests && (
            <div className="flex flex-wrap gap-2">
              {(step.tests as string[]).map((test) => (
                <Badge
                  key={test}
                  variant="secondary"
                  className="text-xs px-3 py-1"
                >
                  {test}
                </Badge>
              ))}
            </div>
          )}

          {/* Step 2: Functional Targets */}
          {"targets" in step && step.targets && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 pr-4 font-semibold text-muted-foreground">
                      Marker
                    </th>
                    <th className="text-left py-2 font-semibold text-muted-foreground">
                      Functional Target
                    </th>
                  </tr>
                </thead>
                <tbody className="text-foreground">
                  {Object.entries(step.targets as Record<string, string>).map(
                    ([marker, target], i, arr) => (
                      <tr
                        key={marker}
                        className={
                          i < arr.length - 1 ? "border-b border-border/50" : ""
                        }
                      >
                        <td className="py-2 pr-4 font-medium">{marker}</td>
                        <td className="py-2 font-semibold text-emerald-600 dark:text-emerald-400">
                          {target}
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Step 3: Decision Tree */}
          {"decision_tree" in step && step.decision_tree && (
            <div className="space-y-3">
              {(step.decision_tree as typeof ALGORITHM.workflow[2]["decision_tree"]).map(
                (phenotype) => (
                  <div
                    key={phenotype.diagnosis}
                    className={`rounded-lg border p-4 ${
                      PHENOTYPE_COLORS[phenotype.diagnosis] ||
                      "border-border/50 bg-muted/20"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-md bg-background/80 border border-border/50 shrink-0 mt-0.5">
                        {PHENOTYPE_ICONS[phenotype.diagnosis] || (
                          <Info className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5">
                          <h5 className="text-sm font-bold text-foreground">
                            {phenotype.diagnosis}
                          </h5>
                          <Badge
                            variant="outline"
                            className="text-[10px] px-1.5 py-0"
                          >
                            Phenotype
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mb-2 leading-relaxed">
                          <span className="font-semibold text-foreground">
                            If:
                          </span>{" "}
                          {phenotype.if}
                        </p>
                        <div className="space-y-1">
                          <p className="text-xs font-semibold text-foreground">
                            Management:
                          </p>
                          <ul className="space-y-0.5">
                            {phenotype.management.map((m) => (
                              <li
                                key={m}
                                className="text-xs text-muted-foreground flex items-start gap-1.5"
                              >
                                <span className="text-emerald-500 mt-0.5 shrink-0">
                                  →
                                </span>
                                {m}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              )}
            </div>
          )}

          {/* Step 4: Root Causes */}
          {"evaluate" in step && step.evaluate && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(step.evaluate as typeof ALGORITHM.workflow[3]["evaluate"]).map(
                (cause) => (
                  <div
                    key={cause.driver}
                    className="rounded-lg border border-border/50 bg-muted/20 p-3"
                  >
                    <p className="text-sm font-semibold text-foreground mb-2">
                      {cause.driver}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {cause.tests.map((test) => (
                        <Badge
                          key={test}
                          variant="outline"
                          className="text-[10px] px-2 py-0"
                        >
                          {test}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )
              )}
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}
