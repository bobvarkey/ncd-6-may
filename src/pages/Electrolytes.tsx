import { useState, useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Copy,
  RotateCcw,
  AlertTriangle,
  Stethoscope,
  FileText,
  Activity,
  Droplets,
  Bone,
  Zap,
  Heart,
  Brain,
  Bean,
  Dumbbell,
} from "lucide-react";

type ElectrolyteKey =
  | "hyponatremia" | "hypernatremia"
  | "hypokalemia" | "hyperkalemia"
  | "hypocalcemia" | "hypercalcemia"
  | "hypomagnesemia" | "hypermagnesemia"
  | "hypophosphatemia" | "hyperphosphatemia";

type Severity = "mild" | "moderate" | "severe";
type Volume = "unknown" | "hypovolemic" | "euvolemic" | "hypervolemic";
type Flag = "arrhythmia" | "seizure" | "confusion" | "weakness" | "ecg_changes" | "renal_failure";

interface ElectrolyteRule {
  eval: string[];
  mild: { actions: string[] };
  moderate: { actions: string[] };
  severe: { actions: string[] };
  monitoring: string[];
}

const ELECTROLYTE_LABELS: Record<ElectrolyteKey, string> = {
  hyponatremia: "Hyponatremia",
  hypernatremia: "Hypernatremia",
  hypokalemia: "Hypokalemia",
  hyperkalemia: "Hyperkalemia",
  hypocalcemia: "Hypocalcemia",
  hypercalcemia: "Hypercalcemia",
  hypomagnesemia: "Hypomagnesemia",
  hypermagnesemia: "Hypermagnesemia",
  hypophosphatemia: "Hypophosphatemia",
  hyperphosphatemia: "Hyperphosphatemia",
};

const ELECTROLYTE_ICONS: Record<ElectrolyteKey, React.ReactNode> = {
  hyponatremia: <Droplets className="h-4 w-4" />,
  hypernatremia: <Droplets className="h-4 w-4" />,
  hypokalemia: <Zap className="h-4 w-4" />,
  hyperkalemia: <Zap className="h-4 w-4" />,
  hypocalcemia: <Bone className="h-4 w-4" />,
  hypercalcemia: <Bone className="h-4 w-4" />,
  hypomagnesemia: <Activity className="h-4 w-4" />,
  hypermagnesemia: <Activity className="h-4 w-4" />,
  hypophosphatemia: <Dumbbell className="h-4 w-4" />,
  hyperphosphatemia: <Dumbbell className="h-4 w-4" />,
};

const RULES: Record<ElectrolyteKey, ElectrolyteRule> = {
  hyponatremia: {
    eval: [
      "Check serum osmolality",
      "Assess volume status",
      "Check urine osmolality and urine sodium",
      "Review thyroid and adrenal status if unclear",
    ],
    mild: {
      actions: [
        "Treat the underlying cause",
        "If chronic and asymptomatic, avoid rapid correction",
        "Use fluid strategy based on volume status",
      ],
    },
    moderate: {
      actions: [
        "Reassess symptoms and chronicity",
        "Use isotonic saline if hypovolemic",
        "Use fluid restriction if euvolemic SIADH is likely",
      ],
    },
    severe: {
      actions: [
        "If neurologic symptoms are present, use 3% saline",
        "Aim for an initial safe rise, not full normalization",
        "Escalate monitoring with frequent sodium checks",
      ],
    },
    monitoring: [
      "Avoid overcorrection",
      "Repeat sodium frequently during active correction",
      "Watch for osmotic demyelination risk in malnutrition, alcoholism, liver disease",
    ],
  },
  hypernatremia: {
    eval: [
      "Assess free water losses and urine output",
      "Review osmotic diuresis, diabetes insipidus, and poor access to water",
      "Check volume status before choosing fluid",
    ],
    mild: {
      actions: [
        "Estimate water deficit",
        "Use enteral or IV free water when appropriate",
        "Correct gradually",
      ],
    },
    moderate: {
      actions: [
        "If hypovolemic, restore intravascular volume first",
        "Then replace free water deficit carefully",
        "Track ongoing losses",
      ],
    },
    severe: {
      actions: [
        "Restore circulation first if unstable",
        "Correct sodium slowly with close neurologic monitoring",
        "Evaluate for diabetes insipidus or major water loss source",
      ],
    },
    monitoring: [
      "Check sodium serially",
      "Document fluid balance and urine output",
      "Avoid overly rapid correction in chronic cases",
    ],
  },
  hypokalemia: {
    eval: [
      "Check magnesium",
      "Review diuretics, GI losses, insulin, and alkalosis",
      "Obtain ECG if moderate or severe",
    ],
    mild: {
      actions: [
        "Use oral potassium if feasible",
        "Replace magnesium if low",
        "Address ongoing losses",
      ],
    },
    moderate: {
      actions: [
        "Use oral or IV potassium depending on symptoms and intake tolerance",
        "Correct associated hypomagnesemia",
        "Review telemetry need",
      ],
    },
    severe: {
      actions: [
        "Use IV potassium with monitoring",
        "Place on cardiac monitoring",
        "Search for arrhythmia trigger and concurrent magnesium depletion",
      ],
    },
    monitoring: [
      "Recheck potassium after replacement",
      "Magnesium correction may be required for potassium to normalize",
      "Watch ECG if severe",
    ],
  },
  hyperkalemia: {
    eval: [
      "Review ECG immediately",
      "Look for renal failure, ACE inhibitor/ARB use, potassium load, acidosis, tissue breakdown",
      "Confirm if pseudohyperkalemia is possible",
    ],
    mild: {
      actions: [
        "Stop potassium sources",
        "Review medications",
        "Use potassium removal strategy if trend is rising",
      ],
    },
    moderate: {
      actions: [
        "Use potassium shift therapy if concern for progression",
        "Begin removal strategy such as diuresis or binder when appropriate",
        "Investigate the cause urgently",
      ],
    },
    severe: {
      actions: [
        "Give IV calcium if ECG changes or severe risk",
        "Shift potassium intracellularly with insulin and glucose; consider beta-agonist",
        "Remove potassium with diuresis, binders, or dialysis if needed",
      ],
    },
    monitoring: [
      "Repeat potassium soon after treatment",
      "Continuous ECG monitoring if severe or ECG changes",
      "Dialysis threshold is lower in renal failure or refractory hyperkalemia",
    ],
  },
  hypocalcemia: {
    eval: [
      "Check ionized or corrected calcium",
      "Review magnesium, phosphate, vitamin D, pancreatitis, transfusion",
      "Assess QT interval",
    ],
    mild: {
      actions: [
        "Use oral calcium if asymptomatic",
        "Treat reversible causes",
        "Correct magnesium if low",
      ],
    },
    moderate: {
      actions: [
        "Consider IV calcium if symptomatic",
        "Correct concurrent magnesium issues",
        "Clarify whether low albumin is driving total calcium only",
      ],
    },
    severe: {
      actions: [
        "Give IV calcium gluconate",
        "Monitor ECG",
        "Treat associated hypomagnesemia and identify the cause",
      ],
    },
    monitoring: [
      "Reassess symptoms and ECG",
      "Repeat calcium after treatment",
      "Ionized calcium is more useful in critical illness",
    ],
  },
  hypercalcemia: {
    eval: [
      "Confirm corrected or ionized calcium",
      "Review malignancy, hyperparathyroidism, vitamin D excess, and medications",
      "Assess dehydration and renal function",
    ],
    mild: {
      actions: [
        "Stop calcium or vitamin D contributors",
        "Encourage hydration if appropriate",
        "Investigate the cause",
      ],
    },
    moderate: {
      actions: [
        "Use IV isotonic saline if volume depleted",
        "Consider calcitonin for quicker effect when symptomatic",
        "Plan antiresorptive therapy if malignancy related",
      ],
    },
    severe: {
      actions: [
        "Use aggressive but appropriate IV hydration",
        "Consider calcitonin for rapid temporary lowering",
        "Escalate definitive therapy and consider dialysis in refractory severe cases",
      ],
    },
    monitoring: [
      "Track volume status and urine output",
      "Repeat calcium after intervention",
      "Review renal function during treatment",
    ],
  },
  hypomagnesemia: {
    eval: [
      "Look for GI loss, diuretics, PPI use, malnutrition, alcoholism",
      "Check potassium and calcium because they may remain abnormal until magnesium is corrected",
    ],
    mild: {
      actions: ["Use oral magnesium if tolerated", "Treat the cause"],
    },
    moderate: {
      actions: [
        "Use IV magnesium if symptomatic or unable to take orally",
        "Correct coexisting potassium or calcium issues",
      ],
    },
    severe: {
      actions: [
        "Use IV magnesium sulfate",
        "Consider telemetry if arrhythmia risk",
        "Treat associated hypokalemia or hypocalcemia",
      ],
    },
    monitoring: [
      "Repeat magnesium levels",
      "Expect recurrent loss if the underlying driver persists",
      "Repletion may need repetition in renal wasting states",
    ],
  },
  hypermagnesemia: {
    eval: [
      "Review renal function and magnesium-containing medications",
      "Check for loss of reflexes, hypotension, or cardiac conduction effects",
    ],
    mild: {
      actions: ["Stop magnesium source", "Observe and recheck level"],
    },
    moderate: {
      actions: [
        "Use IV fluids and loop diuretics if appropriate and kidneys permit",
        "Escalate monitoring if symptoms appear",
      ],
    },
    severe: {
      actions: [
        "Give IV calcium for membrane stabilization",
        "Use supportive care and consider dialysis in renal failure or marked toxicity",
        "Monitor airway and hemodynamics if unstable",
      ],
    },
    monitoring: [
      "Repeat magnesium and ECG if severe",
      "Assess reflexes and blood pressure",
      "Renal failure increases risk of persistence",
    ],
  },
  hypophosphatemia: {
    eval: [
      "Look for refeeding syndrome, alcoholism, DKA treatment, respiratory alkalosis, malnutrition",
      "Assess weakness, respiratory compromise, hemolysis risk",
    ],
    mild: {
      actions: ["Use oral phosphate if tolerated", "Correct the underlying trigger"],
    },
    moderate: {
      actions: [
        "Choose oral vs IV phosphate based on symptoms and intake",
        "Review calcium and renal function before IV therapy",
      ],
    },
    severe: {
      actions: [
        "Use IV phosphate with close monitoring",
        "Watch for respiratory muscle weakness and cardiac effects",
        "Search for refeeding or DKA-treatment context",
      ],
    },
    monitoring: [
      "Repeat phosphate after replacement",
      "Check calcium during treatment",
      "Be careful in renal impairment",
    ],
  },
  hyperphosphatemia: {
    eval: [
      "Assess renal failure, tumor lysis, rhabdomyolysis, phosphate load",
      "Check calcium and ECG if clinically relevant",
    ],
    mild: {
      actions: [
        "Restrict phosphate load and treat the cause",
        "Review medication and dietary sources",
      ],
    },
    moderate: {
      actions: [
        "Consider phosphate binders if appropriate",
        "Treat associated kidney or cell-lysis cause",
      ],
    },
    severe: {
      actions: [
        "Escalate treatment of the cause urgently",
        "Use dialysis if severe and refractory or in advanced renal failure",
        "Monitor for associated hypocalcemia",
      ],
    },
    monitoring: [
      "Trend phosphate and calcium together",
      "Review renal function closely",
      "Watch for tissue calcium-phosphate complications in sustained severe cases",
    ],
  },
};

// ── Numeric lab reference ranges ──
const REFERENCE_RANGES: Record<
  ElectrolyteKey,
  { unit: string; normalLow: number; normalHigh: number; severeLow?: number; severeHigh?: number }
> = {
  hyponatremia: { unit: "mmol/L", normalLow: 135, normalHigh: 145, severeLow: 120 },
  hypernatremia: { unit: "mmol/L", normalLow: 135, normalHigh: 145, severeHigh: 155 },
  hypokalemia: { unit: "mmol/L", normalLow: 3.5, normalHigh: 5, severeLow: 2.5 },
  hyperkalemia: { unit: "mmol/L", normalLow: 3.5, normalHigh: 5, severeHigh: 6.5 },
  hypocalcemia: { unit: "mg/dL", normalLow: 8.5, normalHigh: 10.5, severeLow: 7 },
  hypercalcemia: { unit: "mg/dL", normalLow: 8.5, normalHigh: 10.5, severeHigh: 13 },
  hypomagnesemia: { unit: "mg/dL", normalLow: 1.7, normalHigh: 2.4, severeLow: 1.2 },
  hypermagnesemia: { unit: "mg/dL", normalLow: 1.7, normalHigh: 2.4, severeHigh: 4 },
  hypophosphatemia: { unit: "mg/dL", normalLow: 2.5, normalHigh: 4.5, severeLow: 1.5 },
  hyperphosphatemia: { unit: "mg/dL", normalLow: 2.5, normalHigh: 4.5, severeHigh: 7 },
};

const SEVERITY_RANGES: Record<
  ElectrolyteKey,
  { mild: string; moderate: string; severe: string }
> = {
  hyponatremia: { mild: "130–134", moderate: "120–129", severe: "<120" },
  hypernatremia: { mild: "146–149", moderate: "150–154", severe: "≥155" },
  hypokalemia: { mild: "3.0–3.4", moderate: "2.5–2.9", severe: "<2.5" },
  hyperkalemia: { mild: "5.1–5.5", moderate: "5.6–6.4", severe: "≥6.5" },
  hypocalcemia: { mild: "7.5–8.4", moderate: "7.0–7.4", severe: "<7.0" },
  hypercalcemia: { mild: "10.6–11.9", moderate: "12.0–12.9", severe: "≥13.0" },
  hypomagnesemia: { mild: "1.4–1.6", moderate: "1.2–1.3", severe: "<1.2" },
  hypermagnesemia: { mild: "2.5–4.9", moderate: "5.0–6.9", severe: "≥7.0" },
  hypophosphatemia: { mild: "2.0–2.4", moderate: "1.5–1.9", severe: "<1.5" },
  hyperphosphatemia: { mild: "4.6–5.9", moderate: "6.0–6.9", severe: "≥7.0" },
};

const FLAG_LABELS: Record<Flag, { label: string; icon: React.ReactNode }> = {
  arrhythmia: { label: "Arrhythmia", icon: <Heart className="h-3.5 w-3.5" /> },
  seizure: { label: "Seizure", icon: <Brain className="h-3.5 w-3.5" /> },
  confusion: { label: "Confusion", icon: <Brain className="h-3.5 w-3.5" /> },
  weakness: { label: "Weakness", icon: <Dumbbell className="h-3.5 w-3.5" /> },
  ecg_changes: { label: "ECG changes", icon: <Activity className="h-3.5 w-3.5" /> },
  renal_failure: { label: "Renal failure", icon: <Bean className="h-3.5 w-3.5" /> },
};

const ALL_ELECTROLYTES = Object.keys(RULES) as ElectrolyteKey[];

const SEVERITY_COLORS: Record<Severity, string> = {
  mild: "bg-white text-black border-emerald-400 shadow-sm",
  moderate: "bg-white text-black border-amber-400 shadow-sm",
  severe: "bg-white text-black border-red-500 shadow-sm",
};

function titleCase(str: string) {
  return str.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function Electrolytes() {
  const [electrolyte, setElectrolyte] = useState<ElectrolyteKey>("hyponatremia");
  const [serumValue, setSerumValue] = useState("");
  const [serumRangeLow, setSerumRangeLow] = useState("");
  const [serumRangeHigh, setSerumRangeHigh] = useState("");
  const [useRange, setUseRange] = useState(false);
  const [osmolality, setOsmolality] = useState("");
  const [urineNa, setUrineNa] = useState("");
  const [urineOsm, setUrineOsm] = useState("");
  const [manualSeverity, setManualSeverity] = useState<Severity | null>(null);
  const [severity, setSeverity] = useState<Severity>("mild");
  const [volume, setVolume] = useState<Volume>("unknown");
  const [flags, setFlags] = useState<Set<Flag>>(new Set());
  const [notes, setNotes] = useState("");
  const [copied, setCopied] = useState(false);

  const toggleFlag = useCallback((flag: Flag) => {
    setFlags((prev) => {
      const next = new Set(prev);
      if (next.has(flag)) next.delete(flag);
      else next.add(flag);
      return next;
    });
  }, []);

  const ref = REFERENCE_RANGES[electrolyte];

  // ── Auto-severity from value ──
  const autoSeverity = useMemo((): Severity | null => {
    const val = useRange
      ? parseFloat(serumRangeLow)
      : parseFloat(serumValue);
    if (isNaN(val) || !ref) return null;
    const v = val;
    // For low-type disorders
    if (ref.severeLow !== undefined && v <= ref.severeLow) return "severe";
    if (v < ref.normalLow) return "moderate";
    // For high-type disorders
    if (ref.severeHigh !== undefined && v >= ref.severeHigh) return "severe";
    if (v > ref.normalHigh) return "moderate";
    return "mild";
  }, [serumValue, serumRangeLow, useRange, ref]);

  // Use auto if available, fall back to manual
  const effectiveSeverity = manualSeverity ?? autoSeverity ?? severity;
  const setEffectiveSeverity = useCallback(
    (s: Severity) => {
      setSeverity(s);
      setManualSeverity(s);
    },
    []
  );

  // ── Osmolality annotation for sodium ──
  const osmoAnnotation = useMemo(() => {
    if (!osmolality || (electrolyte !== "hyponatremia" && electrolyte !== "hypernatremia"))
      return null;
    const osm = parseFloat(osmolality);
    if (isNaN(osm)) return null;
    if (electrolyte === "hyponatremia") {
      if (osm < 275) return "Hypotonic hyponatremia — true hyponatremia; proceed with volume assessment";
      if (osm >= 275 && osm <= 295) return "Isotonic hyponatremia — pseudohyponatremia (hyperlipidemia, hyperproteinemia) or isotonic irrigant (TURP)";
      return "Hypertonic hyponatremia — translocational (hyperglycemia, mannitol). Correct Na for glucose.";
    }
    // hypernatremia
    if (osm > 300) return "Hyperosmolality confirmed — true hypernatremia. Assess water loss.";
    return "Osmolality not elevated — consider lab error or pseudohypernatremia.";
  }, [osmolality, electrolyte]);

  // ── Urine studies annotation ──
  const urineAnnotation = useMemo(() => {
    if (!urineNa || !urineOsm || (electrolyte !== "hyponatremia" && electrolyte !== "hypernatremia"))
      return null;
    const uNa = parseFloat(urineNa);
    const uOsm = parseFloat(urineOsm);
    if (isNaN(uNa) || isNaN(uOsm)) return null;
    if (electrolyte === "hyponatremia") {
      if (uNa < 20) return `FENa <1% — hypovolemic (extrarenal losses) or hypervolemic (CHF, cirrhosis). UOsm ${uOsm} supports this.`;
      return `FENa >2% — SIADH, cerebral salt wasting, or renal losses/hypovolemia with ongoing Na excretion. UOsm ${uOsm} ${uOsm > 300 ? "(concentrated — SIADH pattern)" : "(dilute — consider primary polydipsia)"}.`;
    }
    // hypernatremia
    return `Urine output and concentrating ability: UOsm ${uOsm}. ${uOsm < 300 ? "Dilute urine — consider diabetes insipidus" : uOsm > 600 ? "Concentrated urine — extrarenal water loss" : "Intermediate — mixed picture"}.`;
  }, [urineNa, urineOsm, electrolyte]);

  const reset = useCallback(() => {
    setElectrolyte("hyponatremia");
    setSerumValue("");
    setSerumRangeLow("");
    setSerumRangeHigh("");
    setUseRange(false);
    setOsmolality("");
    setUrineNa("");
    setUrineOsm("");
    setManualSeverity(null);
    setSeverity("mild");
    setVolume("unknown");
    setFlags(new Set());
    setNotes("");
  }, []);




  const data = RULES[electrolyte];
  const actions = useMemo(() => {
    const result = [...data[effectiveSeverity].actions];
    if (
      (electrolyte === "hyponatremia" || electrolyte === "hypernatremia") &&
      volume !== "unknown"
    ) {
      result.push(`Volume context: ${titleCase(volume)}.`);
    }
    if (osmoAnnotation) {
      result.push(`Osmolality interpretation: ${osmoAnnotation}`);
    }
    if (urineAnnotation) {
      result.push(`Urine studies: ${urineAnnotation}`);
    }
    if (flags.has("renal_failure")) {
      result.push(
        "Adjust replacement or removal strategy to renal function and dialysis availability."
      );
    }
    // Add value-contextual action for all
    if (!useRange && serumValue) {
      result.push(`Serum level: ${serumValue} ${ref?.unit || ""}.`);
    } else if (useRange && serumRangeLow && serumRangeHigh) {
      result.push(`Serum range: ${serumRangeLow}–${serumRangeHigh} ${ref?.unit || ""}.`);
    }
    return result;
  }, [data, effectiveSeverity, electrolyte, volume, osmoAnnotation, urineAnnotation, flags, serumValue, useRange, serumRangeLow, serumRangeHigh, ref]);

  const evals = useMemo(() => {
    const result = [...data.eval];
    if (autoSeverity !== null) {
      result.unshift(
        `Auto-severity from value: ${effectiveSeverity.toUpperCase()} (value: ${
          useRange ? `${serumRangeLow}–${serumRangeHigh}` : serumValue
        } ${ref?.unit || ""}, normal ${ref?.normalLow}–${ref?.normalHigh}).`
      );
    }
    if (flags.size > 0) {
      result.push(
        `Red flags present: ${Array.from(flags)
          .map((f) => FLAG_LABELS[f].label)
          .join(", ")}.`
      );
    }
    if (notes.trim()) {
      result.push(`Context note: ${notes.trim()}`);
    }
    return result;
  }, [data.eval, flags, notes, autoSeverity, effectiveSeverity, useRange, serumValue, serumRangeLow, serumRangeHigh, ref]);

  const monitoring = useMemo(() => {
    const result = [...data.monitoring];
    if (flags.has("renal_failure")) {
      result.push(
        "Renal failure lowers the threshold for ICU-level monitoring or dialysis-based correction."
      );
    }
    if (flags.has("arrhythmia") || flags.has("ecg_changes")) {
      result.push("Use continuous telemetry until the electrical risk is controlled.");
    }
    return result;
  }, [data.monitoring, flags]);

  const priority = useMemo(() => {
    const danger =
      effectiveSeverity === "severe" ||
      ["arrhythmia", "seizure", "ecg_changes"].some((f) => flags.has(f as Flag));
    if (
      electrolyte === "hyperkalemia" &&
      (flags.has("ecg_changes") || effectiveSeverity === "severe")
    ) {
      return {
        tone: "danger" as const,
        text: "Highest priority: stabilize myocardium, shift potassium intracellularly, and remove potassium.",
      };
    }
    if (danger) {
      return {
        tone: "danger" as const,
        text: "High priority: this profile needs urgent correction, close monitoring, and frequent reassessment.",
      };
    }
    if (flags.size > 0 || effectiveSeverity === "moderate") {
      return {
        tone: "warn" as const,
        text: "Intermediate priority: investigate the cause promptly and correct with monitored therapy.",
      };
    }
    return {
      tone: "good" as const,
      text: "Lower immediate risk: focus on cause, structured replacement or restriction, and serial labs.",
    };
  }, [electrolyte, effectiveSeverity, flags]);

  const jsonOutput = useMemo(
    () =>
      JSON.stringify(
        {
          electrolyte,
          serum_level: useRange
            ? `${serumRangeLow}–${serumRangeHigh}`
            : serumValue || undefined,
          unit: ref?.unit,
          auto_severity: autoSeverity,
          effective_severity: effectiveSeverity,
          osmolality: osmolality || undefined,
          osmolality_interpretation: osmoAnnotation,
          urine_sodium: urineNa || undefined,
          urine_osmolality: urineOsm || undefined,
          volume_status: volume,
          red_flags: Array.from(flags),
          notes: notes.trim() || undefined,
          algorithm: {
            priority: priority.text,
            immediate_actions: actions,
            evaluation: evals,
            monitoring: monitoring,
          },
        },
        null,
        2
      ),
    [
      electrolyte,
      serumValue,
      useRange,
      serumRangeLow,
      serumRangeHigh,
      ref,
      autoSeverity,
      effectiveSeverity,
      osmolality,
      osmoAnnotation,
      urineNa,
      urineOsm,
      volume,
      flags,
      notes,
      priority.text,
      actions,
      evals,
      monitoring,
    ]
  );

  const copyJson = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(jsonOutput);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      // fallback
    }
  }, [jsonOutput]);

  const PRIORITY_STYLES = {
    danger: "bg-red-950/20 border-red-500/30 text-red-300",
    warn: "bg-amber-950/20 border-amber-500/30 text-amber-300",
    good: "bg-emerald-950/20 border-emerald-500/30 text-emerald-300",
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <Activity className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Dyselectrolyte Mini App</h1>
            <p className="text-sm text-muted-foreground">
              A compact inpatient bedside algorithm for sodium, potassium, calcium, phosphate,
              and magnesium disturbances.
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={copyJson}>
            <Copy className="h-3.5 w-3.5 mr-1.5" />
            {copied ? "Copied" : "Copy JSON"}
          </Button>
          <Button variant="default" size="sm" onClick={reset}>
            <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
            Reset
          </Button>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
        {/* Left panel — Patient input */}
        <Card className="border-border/60 h-fit">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Stethoscope className="h-4 w-4 text-primary" />
              Patient Input
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Electrolyte selector */}
            <div>
              <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-2">
                Electrolyte
              </label>
              <select
                value={electrolyte}
                onChange={(e) => setElectrolyte(e.target.value as ElectrolyteKey)}
                className="w-full bg-surface-2 text-foreground border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                {ALL_ELECTROLYTES.map((key) => (
                  <option key={key} value={key}>
                    {ELECTROLYTE_LABELS[key]}
                  </option>
                ))}
              </select>
            </div>

            {/* Severity */}
            <div>
              <span className="block text-xs uppercase tracking-wider text-muted-foreground mb-2">
                Severity
              </span>
              <div className="flex flex-wrap gap-2">
                {(["mild", "moderate", "severe"] as Severity[]).map((s) => {
                  const range = SEVERITY_RANGES[electrolyte]?.[s];
                  return (
                    <button
                      key={s}
                      onClick={() => setSeverity(s)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors min-h-[36px] ${
                        severity === s
                          ? SEVERITY_COLORS[s]
                          : "border-border bg-surface-2 text-foreground hover:bg-muted"
                      }`}
                    >
                      <span className="text-foreground">{titleCase(s)}</span>
                      {range && (
                        <span className="ml-1.5 font-normal text-muted-foreground">
                          {range} {ref?.unit}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Flags / Danger markers */}
            <div>
              <span className="block text-xs uppercase tracking-wider text-muted-foreground mb-2">
                Symptoms / Danger Markers
              </span>
              <div className="flex flex-wrap gap-2">
                {(Object.entries(FLAG_LABELS) as [Flag, (typeof FLAG_LABELS)[Flag]][]).map(
                  ([key, val]) => (
                    <button
                      key={key}
                      onClick={() => toggleFlag(key)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors min-h-[36px] ${
                        flags.has(key)
                          ? "bg-primary/15 text-primary border-primary/30"
                          : "border-border bg-surface-2 text-foreground hover:bg-muted"
                      }`}
                    >
                      {val.icon}
                      <span className="text-foreground">{val.label}</span>
                    </button>
                  )
                )}
              </div>
            </div>

            {/* Volume status */}
            <div>
              <span className="block text-xs uppercase tracking-wider text-muted-foreground mb-2">
                Volume Status
              </span>
              <div className="flex flex-wrap gap-2">
                {(["unknown", "hypovolemic", "euvolemic", "hypervolemic"] as Volume[]).map(
                  (v) => (
                    <button
                      key={v}
                      onClick={() => setVolume(v)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors min-h-[36px] ${
                        volume === v
                          ? "bg-cyan-500/15 text-cyan-400 border-cyan-500/30"
                          : "border-border bg-surface-2 text-foreground hover:bg-muted"
                      }`}
                    >
                      <span className="text-foreground">{titleCase(v)}</span>
                    </button>
                  )
                )}
              </div>
            </div>

            {/* Clinical notes */}
            <div>
              <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-2">
                Clinical Notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional: diarrhea, diuretics, malignancy, DKA treatment, SIADH, dialysis, etc."
                className="w-full bg-surface-2 text-foreground border border-border rounded-lg px-3 py-2 text-sm min-h-[80px] resize-y focus:outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground/50"
              />
            </div>
          </CardContent>
        </Card>

        {/* Right panel — Management pathway */}
        <div className="space-y-4">
          {/* Summary badge */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              Management Pathway
            </h2>
            <Badge
              variant="outline"
              className="text-xs px-3 py-1 border-primary/30 text-foreground bg-primary/5"
            >
              {ELECTROLYTE_LABELS[electrolyte]} · {titleCase(severity)}
            </Badge>
          </div>

          {/* Priority alert */}
          <div
            className={`rounded-xl border px-4 py-3 text-sm font-medium ${PRIORITY_STYLES[priority.tone]}`}
          >
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>{priority.text}</span>
            </div>
          </div>

          {/* Actions + Evaluation grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border-border/60">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Immediate Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1.5">
                  {actions.map((a, i) => (
                    <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="text-primary mt-1 shrink-0">•</span>
                      <span>{a}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
            <Card className="border-border/60">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Evaluation</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1.5">
                  {evals.map((e, i) => (
                    <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="text-amber-400 mt-1 shrink-0">•</span>
                      <span>{e}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Monitoring */}
          <Card className="border-border/60">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Monitoring &amp; Safety</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1.5">
                {monitoring.map((m, i) => (
                  <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                    <span className="text-emerald-400 mt-1 shrink-0">•</span>
                    <span>{m}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* JSON output */}
          <Card className="border-border/60">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Generated JSON</CardTitle>
            </CardHeader>
            <CardContent>
              <textarea
                readOnly
                value={jsonOutput}
                className="w-full bg-surface-2 text-foreground border border-border rounded-lg px-3 py-2 text-xs font-mono min-h-[100px] resize-y focus:outline-none"
              />
            </CardContent>
          </Card>

          {/* Footer note */}
          <p className="text-xs text-muted-foreground leading-relaxed">
            This mini app is a structured decision aid and should be adapted to local protocols,
            renal function, telemetry availability, and ICU context. It includes evaluation,
            treatment, and management pathways for sodium, potassium, calcium, phosphate, and
            magnesium disorders.
          </p>
        </div>
      </div>
    </div>
  );
}