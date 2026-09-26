import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  FlaskConical,
  Droplets,
  Stethoscope,
  AlertTriangle,
  Info,
  RotateCcw,
  Syringe,
  Activity,
  Wind,
} from "lucide-react";

// ── Metabolic Alkalosis Component ──

type UrineChloride = "low" | "high" | null;
type VolumeStatus = "hypovolemic" | "hypervolemic" | null;
type Etiology =
  | "vomiting"
  | "diuretic"
  | "bartter"
  | "gitelman"
  | "hyperaldosteronism"
  | "cushing"
  | "ectopic_acth"
  | null;

const ETIOLOGY_LABELS: Record<string, string> = {
  vomiting: "Vomiting / NG Aspiration",
  diuretic: "Diuretic Overuse",
  bartter: "Bartter Syndrome",
  gitelman: "Gitelman Syndrome",
  hyperaldosteronism: "Primary Hyperaldosteronism (Conn's)",
  cushing: "Cushing Disease",
  ectopic_acth: "Ectopic ACTH Production",
};

const ETIOLOGY_DETAILS: Record<
  string,
  { saline: string; tests: string[]; management: string[] }
> = {
  vomiting: {
    saline: "Saline Responsive ✓",
    tests: ["Low urine Cl⁻ (<20 mEq/L)", "Low urine Na⁺", "Metabolic alkalosis + volume contraction"],
    management: [
      "IV isotonic saline (0.9% NaCl) — corrects both volume and alkalosis",
      "Antiemetics (ondansetron) to stop ongoing losses",
      "PPI/H₂ blocker if NG aspiration",
      "K⁺ repletion if hypokalemic",
    ],
  },
  diuretic: {
    saline: "Saline Responsive ✓",
    tests: ["Low urine Cl⁻ (<20 mEq/L)", "High urine Na⁺ and K⁺ (active diuretic effect)", "Hypokalemia common"],
    management: [
      "Hold or reduce diuretic dose",
      "IV isotonic saline if volume depleted",
      "K⁺ and Mg²⁺ repletion",
      "Consider alternative diuretic strategy",
    ],
  },
  bartter: {
    saline: "Saline Unresponsive ✗",
    tests: ["High urine Cl⁻ (>20 mEq/L)", "High urine Na⁺ and K⁺", "Hyperreninemia", "Normal BP (or low)"],
    management: [
      "NSAIDs (indomethacin) — reduce renal prostaglandins",
      "K⁺-sparing diuretics (spironolactone, amiloride)",
      "Mg²⁺ and K⁺ supplementation",
      "ACEi/ARB if tolerated",
    ],
  },
  gitelman: {
    saline: "Saline Unresponsive ✗",
    tests: ["High urine Cl⁻ (>20 mEq/L)", "Hypocalciuria (pathognomonic)", "Hypomagnesemia (common)", "Normal BP"],
    management: [
      "Mg²⁺ supplementation (corrects both Mg and K⁺)",
      "K⁺-sparing diuretics (spironolactone, eplerenone)",
      "High-Na⁺, high-K⁺ diet",
      "Avoid thiazide diuretics",
    ],
  },
  hyperaldosteronism: {
    saline: "Saline Unresponsive ✗",
    tests: ["High urine Cl⁻ (>20 mEq/L)", "High BP (hypertension)", "Low renin + High aldosterone", "Hypokalemia"],
    management: [
      "Mineralocorticoid receptor antagonist (spironolactone / eplerenone)",
      "Unilateral adrenal adenoma → surgical adrenalectomy",
      "Bilateral adrenal hyperplasia → medical therapy",
      "BP control + K⁺ monitoring",
    ],
  },
  cushing: {
    saline: "Saline Unresponsive ✗",
    tests: ["High urine Cl⁻ (>20 mEq/L)", "High BP", "Elevated cortisol (24h UFC, DST)", "ACTH-dependent vs independent"],
    management: [
      "Treat underlying cause (pituitary adenoma, ectopic, adrenal)",
      "Ketoconazole / metyrapone (steroidogenesis inhibitors)",
      "If pituitary: transsphenoidal surgery",
      "If ectopic: tumor resection",
    ],
  },
  ectopic_acth: {
    saline: "Saline Unresponsive ✗",
    tests: ["High urine Cl⁻ (>20 mEq/L)", "Very high ACTH", "High cortisol", "Severe hypokalemia (common)"],
    management: [
      "Tumor localization (CT chest, Octreotide scan, PET-CT)",
      "Steroidogenesis inhibitors (ketoconazole, metyrapone, osilodrostat)",
      "K⁺ repletion (often requires high doses)",
      "Definitive: tumor resection if feasible",
    ],
  },
};

function MetabolicAlkalosisSection() {
  const [urineChloride, setUrineChloride] = useState<UrineChloride>(null);
  const [volumeStatus, setVolumeStatus] = useState<VolumeStatus>(null);
  const [selectedEtiology, setSelectedEtiology] = useState<Etiology>(null);

  const reset = () => {
    setUrineChloride(null);
    setVolumeStatus(null);
    setSelectedEtiology(null);
  };

  const getSalineResponse = () => {
    if (urineChloride === "low") return "Saline Responsive ✓";
    if (urineChloride === "high") return "Saline Unresponsive ✗";
    return null;
  };

  const getEtiologies = () => {
    if (urineChloride === "low") {
      return ["vomiting", "diuretic"] as const;
    }
    if (urineChloride === "high") {
      return ["bartter", "gitelman", "hyperaldosteronism", "cushing", "ectopic_acth"] as const;
    }
    return [];
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <FlaskConical className="h-6 w-6 text-orange-400" />
        <h2 className="text-xl font-bold">Metabolic Alkalosis</h2>
        <Badge variant="outline" className="text-xs">
          pH &gt; 7.45 & HCO₃⁻ &gt; 24 mEq/L
        </Badge>
      </div>
      <p className="text-muted-foreground">
        Differential diagnosis algorithm based on urine chloride and volume status.
      </p>

      {/* Step 1: Urine Chloride */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Droplets className="h-5 w-5 text-blue-400" />
            Step 1: Check Urine Chloride
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Urine chloride is the most reliable test to distinguish saline-responsive from saline-unresponsive metabolic alkalosis.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button
              variant={urineChloride === "low" ? "default" : "outline"}
              onClick={() => {
                setUrineChloride("low");
                setVolumeStatus(null);
                setSelectedEtiology(null);
              }}
              className={urineChloride === "low" ? "bg-green-600" : ""}
            >
              Low Urine Cl⁻ (&lt;20 mEq/L)
            </Button>
            <Button
              variant={urineChloride === "high" ? "default" : "outline"}
              onClick={() => {
                setUrineChloride("high");
                setVolumeStatus("hypervolemic");
                setSelectedEtiology(null);
              }}
              className={urineChloride === "high" ? "bg-orange-600" : ""}
            >
              High Urine Cl⁻ (&gt;20 mEq/L)
            </Button>
            {urineChloride && (
              <Button variant="ghost" size="sm" onClick={reset}>
                <RotateCcw className="h-4 w-4 mr-1" /> Reset
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Step 2: Results */}
      {urineChloride && (
        <>
          {/* Saline Response Banner */}
          <Card
            className={`border-2 ${
              getSalineResponse()?.includes("Responsive")
                ? "border-green-500/50 bg-green-500/5"
                : "border-orange-500/50 bg-orange-500/5"
            }`}
          >
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <Syringe className={`h-5 w-5 ${getSalineResponse()?.includes("Responsive") ? "text-green-400" : "text-orange-400"}`} />
                <span
                  className={`font-semibold text-lg ${
                    getSalineResponse()?.includes("Responsive") ? "text-green-400" : "text-orange-400"
                  }`}
                >
                  {getSalineResponse()}
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {urineChloride === "low"
                  ? "Volume contraction — alkalosis corrects with isotonic saline."
                  : "Volume expansion or normovolemia — alkalosis persists despite saline. Look for mineralocorticoid excess."}
              </p>
            </CardContent>
          </Card>

          {/* Etiology Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Stethoscope className="h-5 w-5 text-purple-400" />
                Step 2: Identify Etiology
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2 mb-4">
                {getEtiologies().map((key) => (
                  <Button
                    key={key}
                    variant={selectedEtiology === key ? "default" : "outline"}
                    onClick={() => setSelectedEtiology(key)}
                    size="sm"
                    className={
                      selectedEtiology === key
                        ? urineChloride === "low"
                          ? "bg-green-600"
                          : "bg-orange-600"
                        : ""
                    }
                  >
                    {ETIOLOGY_LABELS[key]}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Etiology Details */}
          {selectedEtiology && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Info className="h-5 w-5 text-cyan-400" />
                  {ETIOLOGY_LABELS[selectedEtiology]}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="text-sm font-semibold text-muted-foreground mb-2">Saline Response</h4>
                  <Badge
                    variant="outline"
                    className={
                      ETIOLOGY_DETAILS[selectedEtiology].saline.includes("Responsive")
                        ? "border-green-500/50 text-green-400"
                        : "border-orange-500/50 text-orange-400"
                    }
                  >
                    {ETIOLOGY_DETAILS[selectedEtiology].saline}
                  </Badge>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-muted-foreground mb-2">Diagnostic Tests</h4>
                  <ul className="space-y-1">
                    {ETIOLOGY_DETAILS[selectedEtiology].tests.map((test, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <span className="text-cyan-400 mt-0.5">•</span>
                        <span>{test}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-muted-foreground mb-2">Management</h4>
                  <ul className="space-y-1">
                    {ETIOLOGY_DETAILS[selectedEtiology].management.map((step, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <span className="text-green-400 mt-0.5">✓</span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quick Reference Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <AlertTriangle className="h-5 w-5 text-yellow-400" />
                Complete Differential Diagnosis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 px-3 font-semibold">Urine Cl⁻</th>
                      <th className="text-left py-2 px-3 font-semibold">Volume</th>
                      <th className="text-left py-2 px-3 font-semibold">Saline Response</th>
                      <th className="text-left py-2 px-3 font-semibold">Etiology</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      className={`border-b border-border/50 cursor-pointer hover:bg-accent/50 ${
                        selectedEtiology && ["vomiting", "diuretic"].includes(selectedEtiology)
                          ? "bg-green-500/10"
                          : ""
                      }`}
                      onClick={() => {
                        setUrineChloride("low");
                        setVolumeStatus("hypovolemic");
                      }}
                    >
                      <td className="py-2 px-3 font-mono text-green-400">&lt;20 mEq/L</td>
                      <td className="py-2 px-3">Hypovolemic</td>
                      <td className="py-2 px-3">
                        <Badge variant="outline" className="border-green-500/50 text-green-400 text-xs">
                          Responsive
                        </Badge>
                      </td>
                      <td className="py-2 px-3">
                        <div className="flex flex-wrap gap-1">
                          <Badge
                            variant="secondary"
                            className="cursor-pointer text-xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedEtiology("vomiting");
                            }}
                          >
                            Vomiting / NG
                          </Badge>
                          <Badge
                            variant="secondary"
                            className="cursor-pointer text-xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedEtiology("diuretic");
                            }}
                          >
                            Diuretic Overuse
                          </Badge>
                        </div>
                      </td>
                    </tr>
                    <tr
                      className={`border-b border-border/50 cursor-pointer hover:bg-accent/50 ${
                        selectedEtiology &&
                        ["bartter", "gitelman", "hyperaldosteronism", "cushing", "ectopic_acth"].includes(
                          selectedEtiology
                        )
                          ? "bg-orange-500/10"
                          : ""
                      }`}
                      onClick={() => {
                        setUrineChloride("high");
                        setVolumeStatus("hypervolemic");
                      }}
                    >
                      <td className="py-2 px-3 font-mono text-orange-400">&gt;20 mEq/L</td>
                      <td className="py-2 px-3">Hypervolemic / Euvolemic</td>
                      <td className="py-2 px-3">
                        <Badge variant="outline" className="border-orange-500/50 text-orange-400 text-xs">
                          Unresponsive
                        </Badge>
                      </td>
                      <td className="py-2 px-3">
                        <div className="flex flex-wrap gap-1">
                          <Badge
                            variant="secondary"
                            className="cursor-pointer text-xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedEtiology("bartter");
                            }}
                          >
                            Bartter
                          </Badge>
                          <Badge
                            variant="secondary"
                            className="cursor-pointer text-xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedEtiology("gitelman");
                            }}
                          >
                            Gitelman
                          </Badge>
                          <Badge
                            variant="secondary"
                            className="cursor-pointer text-xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedEtiology("hyperaldosteronism");
                            }}
                          >
                            Hyperaldosteronism
                          </Badge>
                          <Badge
                            variant="secondary"
                            className="cursor-pointer text-xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedEtiology("cushing");
                            }}
                          >
                            Cushing
                          </Badge>
                          <Badge
                            variant="secondary"
                            className="cursor-pointer text-xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedEtiology("ectopic_acth");
                            }}
                          >
                            Ectopic ACTH
                          </Badge>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

// ── Overview / Quick Reference ──
function AcidBaseOverview() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Activity className="h-6 w-6 text-primary" />
        <h2 className="text-xl font-bold">Acid-Base Disorders Overview</h2>
      </div>
      <p className="text-muted-foreground">
        Systematic approach to interpreting arterial blood gas (ABG) and identifying the primary acid-base disorder.
      </p>

      {/* Winter's Formula */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Wind className="h-5 w-5 text-cyan-400" />
            Winter's Formula — Expected Respiratory Compensation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-muted/30 border border-border">
              <p className="text-sm font-semibold mb-1">Metabolic Acidosis</p>
              <p className="text-lg font-mono font-bold">PaCO₂ = (1.5 × HCO₃⁻) + 8 ± 2</p>
              <p className="text-xs text-muted-foreground mt-1">
                If measured PaCO₂ &gt; expected → concurrent respiratory acidosis<br />
                If measured PaCO₂ &lt; expected → concurrent respiratory alkalosis
              </p>
            </div>
            <div className="p-4 rounded-lg bg-muted/30 border border-border">
              <p className="text-sm font-semibold mb-1">Metabolic Alkalosis</p>
              <p className="text-lg font-mono font-bold">PaCO₂ = 0.7 × HCO₃⁻ + 20 ± 5</p>
              <p className="text-xs text-muted-foreground mt-1">
                Expected PaCO₂ rise ~0.7 mmHg per 1 mEq/L HCO₃⁻ increase<br />
                Max compensation: PaCO₂ ~55 mmHg
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Anion Gap */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <FlaskConical className="h-5 w-5 text-purple-400" />
            Anion Gap &amp; Delta-Delta
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-muted/30 border border-border">
              <p className="text-sm font-semibold mb-1">Anion Gap (AG)</p>
              <p className="text-lg font-mono font-bold">AG = Na⁺ − (Cl⁻ + HCO₃⁻)</p>
              <p className="text-xs text-muted-foreground mt-1">
                Normal: 8–12 mEq/L<br />
                Corrected AG = AG + 2.5 × (4.5 − Albumin)
              </p>
            </div>
            <div className="p-4 rounded-lg bg-muted/30 border border-border">
              <p className="text-sm font-semibold mb-1">Delta-Delta Ratio</p>
              <p className="text-lg font-mono font-bold">ΔAG / ΔHCO₃⁻</p>
              <p className="text-xs text-muted-foreground mt-1">
                &lt;1.0: Non-AG metabolic acidosis also present<br />
                1.0–2.0: Pure AG metabolic acidosis<br />
                &gt;2.0: Concurrent metabolic alkalosis
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ABG Interpretation Steps */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Stethoscope className="h-5 w-5 text-emerald-400" />
            Stepwise ABG Interpretation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="space-y-3">
            {[
              { step: "1", title: "Check pH", detail: "Acidemia (&lt;7.35) vs Alkalemia (&gt;7.45)" },
              { step: "2", title: "Identify Primary Disorder", detail: "Match pH direction with PaCO₂ (respiratory) or HCO₃⁻ (metabolic)" },
              { step: "3", title: "Check Compensation", detail: "Use Winter's formula for metabolic acidosis; expected PaCO₂ for metabolic alkalosis" },
              { step: "4", title: "Calculate Anion Gap", detail: "AG = Na⁺ − (Cl⁻ + HCO₃⁻). Correct for albumin if low." },
              { step: "5", title: "Delta-Delta if AG Elevated", detail: "ΔAG/ΔHCO₃⁻ to detect mixed disorders" },
              { step: "6", title: "Check Osmolar Gap", detail: "If AG metabolic acidosis, calculate osmolar gap for methanol/ethylene glycol" },
            ].map((item) => (
              <li key={item.step} className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold shrink-0">
                  {item.step}
                </div>
                <div>
                  <p className="text-sm font-semibold">{item.title}</p>
                  <p className="text-xs text-muted-foreground">{item.detail}</p>
                </div>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>

      {/* Primary Disorders Quick Reference */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Info className="h-5 w-5 text-sky-400" />
            Primary Acid-Base Disorders — Quick Reference
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 px-3 font-semibold">Disorder</th>
                  <th className="text-left py-2 px-3 font-semibold">pH</th>
                  <th className="text-left py-2 px-3 font-semibold">PaCO₂</th>
                  <th className="text-left py-2 px-3 font-semibold">HCO₃⁻</th>
                  <th className="text-left py-2 px-3 font-semibold">Compensation</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-border/50">
                  <td className="py-2 px-3 font-medium">Respiratory Acidosis</td>
                  <td className="py-2 px-3 text-destructive">↓</td>
                  <td className="py-2 px-3 text-destructive">↑</td>
                  <td className="py-2 px-3 text-success">↑ (chronic)</td>
                  <td className="py-2 px-3 text-xs">Acute: HCO₃⁻ ↑ 1 per 10 PaCO₂ ↑<br />Chronic: HCO₃⁻ ↑ 3.5 per 10 PaCO₂ ↑</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-2 px-3 font-medium">Respiratory Alkalosis</td>
                  <td className="py-2 px-3 text-success">↑</td>
                  <td className="py-2 px-3 text-destructive">↓</td>
                  <td className="py-2 px-3 text-destructive">↓ (chronic)</td>
                  <td className="py-2 px-3 text-xs">Acute: HCO₃⁻ ↓ 2 per 10 PaCO₂ ↓<br />Chronic: HCO₃⁻ ↓ 4 per 10 PaCO₂ ↓</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-2 px-3 font-medium">Metabolic Acidosis</td>
                  <td className="py-2 px-3 text-destructive">↓</td>
                  <td className="py-2 px-3 text-destructive">↓</td>
                  <td className="py-2 px-3 text-destructive">↓</td>
                  <td className="py-2 px-3 text-xs">Winter's: PaCO₂ = 1.5×HCO₃⁻ + 8 ± 2</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-2 px-3 font-medium">Metabolic Alkalosis</td>
                  <td className="py-2 px-3 text-success">↑</td>
                  <td className="py-2 px-3 text-success">↑</td>
                  <td className="py-2 px-3 text-success">↑</td>
                  <td className="py-2 px-3 text-xs">PaCO₂ = 0.7×HCO₃⁻ + 20 ± 5</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Common Causes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <AlertTriangle className="h-5 w-5 text-amber-400" />
            Common Causes by Disorder
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-3 rounded-lg bg-destructive/5 border border-destructive/20">
              <p className="text-sm font-semibold text-destructive mb-2">Metabolic Acidosis (AG ↑)</p>
              <ul className="text-xs space-y-1 text-muted-foreground">
                <li><strong>MUDPILES</strong>: Methanol, Uremia, DKA, Paraldehyde, Isoniazid/INH, Lactic acidosis, Ethylene glycol, Salicylates</li>
              </ul>
            </div>
            <div className="p-3 rounded-lg bg-destructive/5 border border-destructive/20">
              <p className="text-sm font-semibold text-destructive mb-2">Metabolic Acidosis (AG normal)</p>
              <ul className="text-xs space-y-1 text-muted-foreground">
                <li><strong>HARDUP</strong>: Hyperalimentation, Acetazolamide, RTA, Diarrhea, Ureteral diversion, Pancreatic fistula</li>
              </ul>
            </div>
            <div className="p-3 rounded-lg bg-success/5 border border-success/20">
              <p className="text-sm font-semibold text-success mb-2">Metabolic Alkalosis</p>
              <ul className="text-xs space-y-1 text-muted-foreground">
                <li>Vomiting/NG suction, Diuretics, Hyperaldosteronism, Cushing, Bartter/Gitelman, Licorice, Milk-alkali syndrome</li>
              </ul>
            </div>
            <div className="p-3 rounded-lg bg-warning/5 border border-warning/20">
              <p className="text-sm font-semibold text-warning mb-2">Respiratory Disorders</p>
              <ul className="text-xs space-y-1 text-muted-foreground">
                <li><strong>Acidosis</strong>: COPD, opioid overdose, neuromuscular weakness, sleep apnea</li>
                <li><strong>Alkalosis</strong>: Anxiety, PE, pneumonia, CHF, high altitude, liver disease, pregnancy</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Main Page ──
export default function AcidBaseDisorders() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabFromUrl = searchParams.get("tab") || "overview";
  const [activeTab, setActiveTab] = useState(tabFromUrl);

  useEffect(() => {
    const t = searchParams.get("tab");
    if (t && ["overview", "metabolic-alkalosis"].includes(t)) {
      setActiveTab(t);
    }
  }, [searchParams]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setSearchParams(value === "overview" ? {} : { tab: value }, { replace: true });
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex items-center gap-2">
        <FlaskConical className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">Acid-Base Disorders</h1>
        <Badge variant="outline" className="text-xs">
          ABG Interpretation
        </Badge>
      </div>
      <p className="text-muted-foreground">
        Comprehensive approach to acid-base disorders — overview, interpretation tools, and condition-specific algorithms.
      </p>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="w-full flex-wrap">
          <TabsTrigger value="overview" className="flex-1 gap-2">
            <Activity className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="metabolic-alkalosis" className="flex-1 gap-2">
            <FlaskConical className="h-4 w-4" />
            Metabolic Alkalosis
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <AcidBaseOverview />
        </TabsContent>

        <TabsContent value="metabolic-alkalosis" className="mt-6">
          <MetabolicAlkalosisSection />
        </TabsContent>
      </Tabs>
    </div>
  );
}
