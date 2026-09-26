import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  FlaskConical,
  Droplets,
  Stethoscope,
  AlertTriangle,
  Info,
  RotateCcw,
  Syringe,
} from "lucide-react";

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

export default function MetabolicAlkalosis() {
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
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex items-center gap-2">
        <FlaskConical className="h-6 w-6 text-orange-400" />
        <h1 className="text-2xl font-bold">Metabolic Alkalosis</h1>
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
