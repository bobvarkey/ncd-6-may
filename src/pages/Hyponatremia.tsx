import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  AlertTriangle, Droplets, Stethoscope, FlaskConical, Brain, Pill, Syringe, Activity, Info, Copy,
  Download, Clock, ShieldAlert, ChevronRight, ChevronDown,
  Calculator, Beaker, TestTube, FileText, Zap,
} from "lucide-react";
import { downloadTextFile } from "@/lib/clinical-utils";
import { toast } from "sonner";

// ══════════════════════════════════════════════
// Differential Diagnosis: Hyponatremia & Polyuria Syndromes
// Serum & Urine Osmolality Pattern Mapping
// ══════════════════════════════════════════════

interface OsmPattern {
  id: string;
  serumOsm: string;
  urineOsm: string;
  meaning: string;
  condition: string;
  keyClue: string;
  color: string;
  icon: string;
}

const OSM_PATTERNS: OsmPattern[] = [
  {
    id: "siadh",
    serumOsm: "Dilute (low)",
    urineOsm: "Concentrated (high)",
    meaning: "Body is making excess ADH → retains water",
    condition: "SIADH",
    keyClue: "Euvolemic hyponatremia with inappropriately concentrated urine",
    color: "blue",
    icon: "🧪",
  },
  {
    id: "psychogenic",
    serumOsm: "Dilute (low)",
    urineOsm: "Dilute (low)",
    meaning: "Excess water intake → ADH suppressed",
    condition: "Primary Polydipsia (Psychogenic Polydipsia)",
    keyClue: "Very dilute urine, low urine sodium, psychiatric patient",
    color: "emerald",
    icon: "💧",
  },
  {
    id: "di",
    serumOsm: "Concentrated (high)",
    urineOsm: "Dilute (low)",
    meaning: "ADH problem → kidneys cannot concentrate urine",
    condition: "Diabetes Insipidus (Central or Nephrogenic)",
    keyClue: "Polyuria + polydipsia, hypernatremia risk, dilute urine",
    color: "red",
    icon: "🔥",
  },
  {
    id: "lithium",
    serumOsm: "Concentrated (high)",
    urineOsm: "Concentrated (high)",
    meaning: "Appropriate ADH response or non-specific situation",
    condition: "Lithium-Induced Nephrogenic DI OR Appropriate Renal Concentration",
    keyClue: "Check clinical context, lithium use, and other causes",
    color: "purple",
    icon: "⚡",
  },
];

interface ConditionDetail {
  id: string;
  name: string;
  pathophysiology: string;
  labPattern: { label: string; value: string }[];
  clinicalFeatures: string[];
  management: string[];
  examBuzzwords: string[];
  color: string;
}

const CONDITIONS: ConditionDetail[] = [
  {
    id: "lithium-di",
    name: "Lithium-Induced Nephrogenic DI",
    pathophysiology: "Lithium impairs ADH response in the collecting duct, causing nephrogenic diabetes insipidus.",
    labPattern: [
      { label: "Serum sodium", value: "High or high-normal" },
      { label: "Serum osmolality", value: "High (>295 mOsm/kg)" },
      { label: "Urine osmolality", value: "Low (<300 mOsm/kg)" },
      { label: "Urine specific gravity", value: "Low (<1.005)" },
      { label: "Urine volume", value: "High (>3 L/day)" },
      { label: "Desmopressin response", value: "Poor or none" },
    ],
    clinicalFeatures: ["Polyuria", "Polydipsia", "Nocturia", "Dry mouth", "Hypernatremia (severe cases)", "Dehydration symptoms", "Fatigue", "Weakness"],
    management: [
      "Evaluate need for continuing lithium",
      "Amiloride preferred 5–10 mg/day",
      "Or thiazide diuretics",
      "Low-sodium diet + adequate water",
      "Monitor serum lithium levels",
      "Monitor electrolytes and renal function",
      "Educate patient about dehydration and hypernatremia",
    ],
    examBuzzwords: ["Lithium", "Nephrogenic DI", "ADH resistance in collecting duct", "Polyuria + polydipsia + hypernatremia risk", "Poor response to DDAVP"],
    color: "purple",
  },
  {
    id: "siadh-detail",
    name: "SIADH (Syndrome of Inappropriate Antidiuretic Hormone)",
    pathophysiology: "Euvolemic hyponatremia with inappropriately concentrated urine. Inappropriate ADH release causes increased collecting duct water reabsorption, water retention, dilutional hyponatremia, plasma hypo-osmolality, while urine remains inappropriately concentrated.",
    labPattern: [
      { label: "Serum sodium", value: "Low (<135 mEq/L)" },
      { label: "Serum osmolality", value: "Low (<275 mOsm/kg)" },
      { label: "Urine osmolality", value: "High (>100 mOsm/kg)" },
      { label: "Urine sodium", value: "High (>40 mEq/L)" },
      { label: "ECF volume status", value: "Euvolemic" },
      { label: "Hematocrit/BUN", value: "Normal" },
    ],
    clinicalFeatures: ["Euvolemic hyponatremia", "Inappropriately concentrated urine", "High urine sodium", "Low serum osmolality"],
    management: [
      "Treat underlying cause",
      "Fluid restriction",
      "Increase solute intake",
      "Hypertonic saline in severe symptomatic cases",
      "Vasopressin receptor antagonists",
      "Monitor serum sodium carefully",
    ],
    examBuzzwords: ["Euvolemic hyponatremia", "Inappropriately concentrated urine", "High urine sodium", "Low serum osmolality", "ADH excess", "Small cell lung carcinoma"],
    color: "blue",
  },
  {
    id: "psychogenic-detail",
    name: "Psychogenic Polydipsia (Primary Polydipsia)",
    pathophysiology: "Excessive voluntary water intake suppresses ADH and causes dilutional hyponatremia with very dilute urine.",
    labPattern: [
      { label: "Serum sodium", value: "Low (<135 mEq/L)" },
      { label: "Serum osmolality", value: "Low (<275 mOsm/kg)" },
      { label: "Urine osmolality", value: "Very low (<100 mOsm/kg)" },
      { label: "Urine sodium", value: "Low (<20 mEq/L)" },
      { label: "Urine specific gravity", value: "Low (<1.005)" },
      { label: "ECF volume status", value: "Euvolemic" },
      { label: "BUN/Creatinine", value: "Low or normal" },
    ],
    clinicalFeatures: ["Psychiatric illness", "Schizophrenia", "Affective disorders", "Compulsive water drinking (often 10–15 L/day or more)"],
    management: [
      "Restrict water intake",
      "Treat underlying psychiatric illness",
      "Monitor serum sodium closely",
      "Avoid rapid correction",
      "3% saline if severe symptomatic hyponatremia",
    ],
    examBuzzwords: ["Excess water intake", "Suppressed ADH", "Very dilute urine", "Low urine sodium", "Dilutional hyponatremia", "Psychiatric patient"],
    color: "emerald",
  },
  {
    id: "di-detail",
    name: "Diabetes Insipidus (Central & Nephrogenic)",
    pathophysiology: "Failure of ADH action causing inability to concentrate urine. Central DI: deficiency of ADH secretion from hypothalamus/posterior pituitary. Nephrogenic DI: renal resistance to ADH in collecting duct.",
    labPattern: [
      { label: "Serum sodium", value: "High or high-normal" },
      { label: "Serum osmolality", value: "High (>295 mOsm/kg)" },
      { label: "Urine osmolality", value: "Low (<300 mOsm/kg)" },
      { label: "Urine specific gravity", value: "Low (<1.005)" },
      { label: "Urine volume", value: "High (>3 L/day)" },
      { label: "Desmopressin response (Central)", value: "GOOD" },
      { label: "Desmopressin response (Nephrogenic)", value: "POOR or NONE" },
    ],
    clinicalFeatures: ["Polyuria", "Polydipsia", "Nocturia", "Dry mouth", "Weakness", "Hypernatremia (in severe cases)"],
    management: [
      "Central DI: Desmopressin, adequate water intake",
      "Nephrogenic DI: Treat underlying cause, thiazides, amiloride, low-sodium + low-protein diet, adequate water intake",
    ],
    examBuzzwords: ["Polyuria + polydipsia", "Dilute urine", "Hypernatremia risk", "Central responds to DDAVP", "Nephrogenic no response to DDAVP", "Lithium", "Hypercalcemia", "Hypokalemia"],
    color: "red",
  },
];

// ══════════════════════════════════════════════
// Types
// ══════════════════════════════════════════════

type VolumeStatus = "hypovolemic" | "euvolemic" | "hypervolemic" | null;
type OsmResult = "hypotonic" | "isotonic" | "hypertonic" | null;
type SymptomSeverity = "asymptomatic" | "moderate" | "severe" | null;
type Chronicity = "acute" | "chronic" | null;
type Gender = "male" | "female" | null;

interface StepState {
  step1_complete: boolean;
  step2_complete: boolean;
  step3_complete: boolean;
}

// ══════════════════════════════════════════════
// Guideline metadata
// ══════════════════════════════════════════════

const GUIDELINES = [
  "European 2014/2020",
  "American ASN 2022",
  "Critical-care guidelines",
];

const DEFINITION = "Serum Na⁺ <135 mmol/L";

// ══════════════════════════════════════════════
// Volume status diagnostic criteria
// ══════════════════════════════════════════════

const VOLUME_CRITERIA = [
  {
    volume: "Hypovolemic" as const,
    uOsm: ">100 mOsm/kg",
    uNa: "<20 mEq/L",
    causes: ["GI losses", "Diuretics", "Adrenal insufficiency"],
    feNaNote: "FENa <1% — extrarenal losses",
  },
  {
    volume: "Hypovolemic" as const,
    uOsm: ">100 mOsm/kg",
    uNa: ">20 mEq/L",
    causes: ["Renal salt wasting", "Mineralocorticoid deficiency"],
    feNaNote: "FENa >2% — renal losses",
  },
  {
    volume: "Euvolemic" as const,
    uOsm: ">100 mOsm/kg",
    uNa: ">20 mEq/L",
    causes: ["SIADH", "Psychogenic polydipsia (late)", "Glucocorticoid deficiency"],
    feNaNote: "FENa >2% — SIADH pattern",
  },
  {
    volume: "Hypervolemic" as const,
    uOsm: ">100 mOsm/kg",
    uNa: ">20 mEq/L",
    causes: ["CHF", "Cirrhosis", "Nephrotic syndrome", "Advanced kidney disease"],
    feNaNote: "FENa <1% — edema states",
  },
  {
    volume: "Any (dilute urine)" as const,
    uOsm: "<100 mOsm/kg",
    uNa: "<20 mEq/L",
    causes: ["Polydipsia", "Low solute intake", "Beer potomania"],
    feNaNote: "Dilute urine — consider water overload",
  },
];

// ══════════════════════════════════════════════
// Infusate composition (Adrogue-Madias)
// ══════════════════════════════════════════════

const INFUSATE_COMPOSITION: Record<string, { Na: number; Cl: number }> = {
  "3% NaCl": { Na: 1026, Cl: 1026 },
  "0.9% NaCl": { Na: 154, Cl: 154 },
  D5W: { Na: 0, Cl: 0 },
};

function tbw(weight: number, age: number, gender: Gender): number {
  if (age <= 60) {
    return gender === "female" ? weight * 0.5 : weight * 0.6;
  }
  return gender === "female" ? weight * 0.45 : weight * 0.5;
}

function adrogueMadias(
  infusateNa: number,
  serumNa: number,
  weight: number,
  age: number,
  gender: Gender
): number {
  const water = tbw(weight, age, gender);
  return (infusateNa - serumNa) / (water + 1);
}

// ══════════════════════════════════════════════
// Treatment recommendations
// ══════════════════════════════════════════════

function getTreatmentPlan(
  severity: SymptomSeverity,
  volume: VolumeStatus,
  chronicity: Chronicity
): { title: string; details: string[]; agent: string; dose: string; maxCorrection: string } {
  if (severity === "severe") {
    return {
      title: "Severely Symptomatic — Emergency 3% NaCl",
      agent: "3% NaCl",
      dose: "100 mL IV bolus, repeat 2–3× as needed",
      maxCorrection: "Target +4–6 mmol/L in 6 h; Max ≤8 mmol/L/24 h",
      details: [
        "Indications: seizures, coma, life-threatening symptoms",
        "Give 100 mL IV bolus over 10 min — can repeat 2–3×",
        "Check Na⁺ after each bolus",
        "Target: +4–6 mmol/L in first 6 hours",
        "Once symptoms improve, slow to 0.5–1 mL/kg/hr or switch to isotonic",
        "Do NOT exceed 8–10 mmol/L correction in 24 h",
      ],
    };
  }

  if (severity === "moderate") {
    if (volume === "hypovolemic") {
      return {
        title: "Moderately Symptomatic — Hypovolemic",
        agent: "0.9% NaCl",
        dose: "1 L at 120 mL/h",
        maxCorrection: "Stop at Na⁺ +5 mmol/L or symptom resolution",
        details: [
          "Symptoms: confusion, headache, nausea (no seizures)",
          "Give 0.9% NaCl 1 L at 120 mL/h",
          "Stop if Na⁺ rises by 5 mmol/L or symptoms resolve",
          "Recheck volume status (JVP, orthostatics, urine studies)",
          "If acute onset (<48 h): may use 3% NaCl at 1–2 mL/kg/hr",
        ],
      };
    }
    // euvolemic or hypervolemic + moderate
    return {
      title: "Moderately Symptomatic — Euvolemic / Hypervolemic",
      agent: "3% NaCl (if acute) or 0.9% NaCl",
      dose: "3% at 0.5–1 mL/kg/hr or 0.9% at 120 mL/h",
      maxCorrection: "Target +4–6 mmol/L in 6 h",
      details: [
        "Symptoms: confusion, headache, nausea (no seizures)",
        "If acute (<48 h): 3% NaCl 1–2 mL/kg/hr",
        "If chronic (>48 h): 0.9% NaCl or low-rate 3% at 0.5–1 mL/kg/hr",
        "Target +4–6 mmol/L in first 6 hours",
        "Fluid restriction 800–1000 mL/d if euvolemic SIADH",
        "Loop diuretics + salt/water restriction if hypervolemic",
      ],
    };
  }

  // Asymptomatic
  if (volume === "euvolemic") {
    return {
      title: "Asymptomatic — Euvolemic (SIADH Pattern)",
      agent: "Fluid restriction 800–1000 mL/d",
      dose: "± salt tablets or tolvaptan",
      maxCorrection: "≤8 mmol/L/24 h (≤6 if high-risk)",
      details: [
        "First-line: fluid restriction to 800–1000 mL/d",
        "Adjuncts: salt tablets, loop diuretics, tolvaptan 15 mg → 30–60 mg/d",
        "If chronic: correct slowly — ODS risk is real",
        "High-risk patients (malnutrition, alcoholism, liver disease): ≤6 mmol/L/24 h",
        "Treat underlying cause (SIADH workup: check thyroid, adrenal)",
      ],
    };
  }

  if (volume === "hypervolemic") {
    return {
      title: "Asymptomatic — Hypervolemic",
      agent: "Loop diuretics + salt/water restriction",
      dose: "Treat underlying disease",
      maxCorrection: "≤8 mmol/L/24 h",
      details: [
        "Loop diuretics (furosemide) + sodium and water restriction",
        "Treat underlying: optimize CHF, manage cirrhosis, treat nephrotic syndrome",
        "Vaptans may be used cautiously in cirrhosis (monitor LFTs)",
        "Avoid isotonic saline — it worsens hypervolemia",
        "Do NOT correct beyond 8 mmol/L in 24 h",
      ],
    };
  }

  // hypovolemic asymptomatic
  return {
    title: "Asymptomatic — Hypovolemic",
    agent: "0.9% NaCl or oral rehydration",
    dose: "Replace volume deficit gradually",
    maxCorrection: "≤8 mmol/L/24 h",
    details: [
      "Replace volume deficit with 0.9% NaCl or oral fluids",
      "Address underlying cause (stop diuretics, replace GI losses)",
      "Monitor Na⁺ q6h during correction",
      "Avoid overcorrection — check Adrogue-Madias prediction first",
    ],
  };
}

// ══════════════════════════════════════════════
// Safety rules
// ══════════════════════════════════════════════

const SAFETY_RULES = [
  {
    icon: <ShieldAlert className="h-4 w-4" />,
    title: "Desmopressin Safety Brake",
    detail: "DDAVP 1–2 µg IV/SC if correction overshoots — prevents uncontrolled correction",
    color: "text-red-500",
    bg: "bg-red-500/5",
    border: "border-red-500/20",
  },
  {
    icon: <Clock className="h-4 w-4" />,
    title: "Monitoring Frequency",
    detail: "Standard: q4–6h. On 3% NaCl: q2h mandatory.",
    color: "text-amber-500",
    bg: "bg-amber-500/5",
    border: "border-amber-500/20",
  },
  {
    icon: <AlertTriangle className="h-4 w-4" />,
    title: "Overshoot Management",
    detail: "ΔNa⁺ >8 mmol/L/24 h → DDAVP 2 µg + D5W 10 mL/kg to re-lower by ~1 mmol/h",
    color: "text-orange-500",
    bg: "bg-orange-500/5",
    border: "border-orange-500/20",
  },
  {
    icon: <Brain className="h-4 w-4" />,
    title: "ODS Prevention",
    detail: "Osmotic demyelination is preventable — most cases are iatrogenic. Max safe: ≤8 mmol/L/24 h (≤6 if high-risk: malnutrition, alcoholism, liver disease, hypokalemia)",
    color: "text-purple-500",
    bg: "bg-purple-500/5",
    border: "border-purple-500/20",
  },
];

// ══════════════════════════════════════════════
// Component
// ══════════════════════════════════════════════

export default function Hyponatremia() {
  // ── Step 1: Confirm hypotonic hyponatremia ──
  const [serumNa, setSerumNa] = useState("");
  const [serumOsm, setSerumOsm] = useState("");
  const [osmResult, setOsmResult] = useState<OsmResult>(null);

  // ── Step 2: Volume status ──
  const [urineOsm, setUrineOsm] = useState("");
  const [urineNa, setUrineNa] = useState("");
  const [volumeStatus, setVolumeStatus] = useState<VolumeStatus>(null);

  // ── Step 3: Treatment ──
  const [symptomSeverity, setSymptomSeverity] = useState<SymptomSeverity>(null);
  const [chronicity, setChronicity] = useState<Chronicity>(null);

  // ── Adrogue-Madias calculator ──
  const [weight, setWeight] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState<Gender>(null);
  const [infusate, setInfusate] = useState("3% NaCl");
  const [targetNa, setTargetNa] = useState("");

  // ── UI state ──
  const [expandedSection, setExpandedSection] = useState<string | null>("step1");

  // ── Step progression ──
  const steps: StepState = useMemo(() => ({
    step1_complete: osmResult === "hypotonic",
    step2_complete: volumeStatus !== null,
    step3_complete: symptomSeverity !== null,
  }), [osmResult, volumeStatus, symptomSeverity]);

  // ── Auto-analyze serum osmolality ──
  const analyzeOsmolality = () => {
    const na = parseFloat(serumNa);
    const osm = parseFloat(serumOsm);
    if (isNaN(osm) || isNaN(na)) {
      toast.error("Enter valid serum Na⁺ and osmolality values");
      return;
    }
    if (na >= 135) {
      toast.error("Na⁺ ≥135 — this is not hyponatremia");
      return;
    }
    if (osm < 280) {
      setOsmResult("hypotonic");
      toast.success("Hypotonic hyponatremia confirmed. Proceed to volume assessment.");
      setExpandedSection("step2");
    } else if (osm >= 280 && osm <= 295) {
      setOsmResult("isotonic");
      toast.warning("Isotonic — pseudohyponatremia. Check lipids, proteins.");
    } else {
      setOsmResult("hypertonic");
      toast.warning("Hypertonic — translocational. Correct for glucose (Na⁺ falls ~1.4 per 100 mg/dL glucose).");
    }
  };

  // ── Analyze urine studies ──
  const analyzeVolume = () => {
    const uOsm = parseFloat(urineOsm);
    const uNa = parseFloat(urineNa);
    if (isNaN(uOsm) || isNaN(uNa)) {
      toast.error("Enter valid urine osmolality and urine sodium");
      return;
    }

    if (uOsm < 100 && uNa < 20) {
      setVolumeStatus(null); // special dilute category
      toast.info("Dilute urine — consider primary polydipsia, low solute intake, or beer potomania");
      setExpandedSection("step3");
    } else if (uOsm > 100) {
      if (uNa < 20) {
        if (uNa < 10) {
          setVolumeStatus("hypovolemic");
          toast.info("Volume status: Hypovolemic (extrarenal losses / CHF / cirrhosis pattern)");
        } else {
          // uNa 10-20
          setVolumeStatus("hypovolemic");
          toast.info("Volume status: Likely Hypovolemic — renal or extrarenal losses");
        }
      } else {
        // uNa > 20
        // Need clinical context to separate euvolemic from hypervolemic
        toast.custom((t) => (
          <div className="bg-card border border-border rounded-lg p-4 shadow-lg max-w-sm">
            <p className="text-sm font-semibold mb-2">UOsm {'>'}100, UNa {'>'}20 — narrow possibilities:</p>
            <div className="space-y-1 text-xs">
              <button
                onClick={() => { setVolumeStatus("euvolemic"); toast.dismiss(t); toast.success("Volume: Euvolemic (SIADH pattern)"); setExpandedSection("step3"); }}
                className="w-full text-left px-2 py-1.5 rounded bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 transition-colors"
              >Euvolemic — SIADH / glucocorticoid deficiency / polydipsia (late)</button>
              <button
                onClick={() => { setVolumeStatus("hypervolemic"); toast.dismiss(t); toast.success("Volume: Hypervolemic (edematous states)"); setExpandedSection("step3"); }}
                className="w-full text-left px-2 py-1.5 rounded bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 transition-colors"
              >Hypervolemic — CHF / cirrhosis / nephrotic syndrome / CKD</button>
            </div>
          </div>
        ), { duration: 10000 });
      }
    }
  };

  // ── Adrogue-Madias calculation ──
  const amResult = useMemo(() => {
    const sNa = parseFloat(serumNa || "0");
    const w = parseFloat(weight);
    const a = parseFloat(age);
    const infNa = INFUSATE_COMPOSITION[infusate]?.Na ?? 0;
    if (!sNa || !w || !a || !gender || !infNa) return null;
    const delta = adrogueMadias(infNa, sNa, w, a, gender);
    const litersToTarget = targetNa ? (parseFloat(targetNa) - sNa) / delta : 0;
    return { delta, litersToTarget: litersToTarget > 0 ? litersToTarget : 0 };
  }, [serumNa, weight, age, gender, infusate, targetNa]);

  // ── Treatment plan ──
  const treatmentPlan = useMemo(() => {
    if (!symptomSeverity || !volumeStatus) return null;
    return getTreatmentPlan(symptomSeverity, volumeStatus, chronicity);
  }, [symptomSeverity, volumeStatus, chronicity]);

  // ── Clinical note generation ──
  const generateNote = () => {
    const lines: string[] = [
      "═══ Hyponatremia Clinical Summary ═══",
      `Serum Na⁺: ${serumNa || "—"} mmol/L`,
      `Serum Osmolality: ${serumOsm || "—"} mOsm/kg → ${osmResult ? osmResult.toUpperCase() : "?"}`,
      "",
    ];
    if (steps.step2_complete) {
      lines.push(`Volume Status: ${volumeStatus?.toUpperCase() || "?"}`);
      lines.push(`Urine Osmolality: ${urineOsm || "—"} mOsm/kg`);
      lines.push(`Urine Sodium: ${urineNa || "—"} mEq/L`);
      lines.push("");
    }
    if (steps.step3_complete) {
      lines.push(`Symptom Severity: ${symptomSeverity?.toUpperCase() || "?"}`);
      lines.push(`Chronicity: ${chronicity?.toUpperCase() || "?"}`);
      lines.push("");
      if (treatmentPlan) {
        lines.push(`Treatment: ${treatmentPlan.title}`);
        lines.push(`Agent: ${treatmentPlan.agent}`);
        lines.push(`Dose: ${treatmentPlan.dose}`);
        lines.push(`Correction target: ${treatmentPlan.maxCorrection}`);
        lines.push(...treatmentPlan.details.map(d => `  • ${d}`));
      }
    }
    return lines.join("\n");
  };

  const copyNote = () => {
    navigator.clipboard.writeText(generateNote());
    toast.success("Note copied to clipboard");
  };

  const downloadNote = () => {
    downloadTextFile(generateNote(), `hyponatremia-summary-${Date.now()}.txt`);
    toast.success("Note downloaded");
  };

  // ── Reset ──
  const resetAll = () => {
    setSerumNa("");
    setSerumOsm("");
    setOsmResult(null);
    setUrineOsm("");
    setUrineNa("");
    setVolumeStatus(null);
    setSymptomSeverity(null);
    setChronicity(null);
    setWeight("");
    setAge("");
    setGender(null);
    setInfusate("3% NaCl");
    setTargetNa("");
    setExpandedSection("step1");
    toast.info("Reset complete");
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Droplets className="h-6 w-6 text-blue-400" />
            Hyponatremia Decision Support
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {DEFINITION} — Based on: {GUIDELINES.join(", ")}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={copyNote}>
            <Copy className="h-4 w-4 mr-1" /> Copy
          </Button>
          <Button variant="outline" size="sm" onClick={downloadNote}>
            <Download className="h-4 w-4 mr-1" /> Export
          </Button>
          <Button variant="ghost" size="sm" onClick={resetAll}>
            Reset
          </Button>
        </div>
      </div>

      {/* Progress indicator */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Badge variant={steps.step1_complete ? "default" : "outline"}>
          Step 1: Confirm hypotonic
        </Badge>
        <ChevronRight className="h-3 w-3" />
        <Badge variant={steps.step2_complete ? "default" : "outline"}>
          Step 2: Volume status
        </Badge>
        <ChevronRight className="h-3 w-3" />
        <Badge variant={steps.step3_complete ? "default" : "outline"}>
          Step 3: Treatment
        </Badge>
      </div>

      {/* ── Quick Reference Card ── */}
      <Card className="border-amber-500/20">
        <button
          onClick={() => setExpandedSection(expandedSection === "quickref" ? null : "quickref")}
          className="w-full text-left"
        >
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-amber-400" />
                <CardTitle className="text-base">📋 Diagnostic Quick Reference Card</CardTitle>
              </div>
              {expandedSection === "quickref" ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </div>
            <CardDescription>Quick differential: SIADH vs Diabetes Insipidus vs Psychogenic Polydipsia — lab patterns at a glance</CardDescription>
          </CardHeader>
        </button>

        {expandedSection === "quickref" && (
          <CardContent className="pt-0">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* SIADH */}
              <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Beaker className="h-5 w-5 text-blue-400" />
                  <h3 className="font-bold text-sm text-blue-400">Diluted Blood / Concentrated Urine</h3>
                </div>
                <p className="text-xs text-muted-foreground mb-2 italic">"Low serum Na⁺ + concentrated urine = SIADH"</p>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between"><span className="text-muted-foreground">Serum Na⁺</span><span className="font-mono font-medium">&lt;135 mEq/L</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Serum Osm</span><span className="font-mono font-medium">&lt;275 mOsm/kg</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Urine Osm</span><span className="font-mono font-medium">&gt;100 mOsm/kg</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Urine Na⁺</span><span className="font-mono font-medium">&gt;40 mEq/L</span></div>
                </div>
                <div className="mt-3 pt-2 border-t border-blue-500/10">
                  <Badge variant="outline" className="text-[10px] border-blue-500/30 text-blue-400">SIADH</Badge>
                </div>
              </div>

              {/* Diabetes Insipidus */}
              <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <TestTube className="h-5 w-5 text-red-400" />
                  <h3 className="font-bold text-sm text-red-400">Concentrated Blood / Diluted Urine</h3>
                </div>
                <p className="text-xs text-muted-foreground mb-2 italic">"↑Na⁺ + dilute urine = Diabetes Insipidus"</p>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between"><span className="text-muted-foreground">Serum Na⁺</span><span className="font-mono font-medium">&gt;145 mEq/L</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Serum Osm</span><span className="font-mono font-medium">&gt;295 mOsm/kg</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Urine Osm</span><span className="font-mono font-medium">&lt;300 mOsm/kg</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Urine Na⁺</span><span className="font-mono font-medium">&lt;20 mEq/L</span></div>
                </div>
                <div className="mt-3 pt-2 border-t border-red-500/10">
                  <Badge variant="outline" className="text-[10px] border-red-500/30 text-red-400">Diabetes Insipidus</Badge>
                </div>
              </div>

              {/* Psychogenic Polydipsia */}
              <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Droplets className="h-5 w-5 text-emerald-400" />
                  <h3 className="font-bold text-sm text-emerald-400">Dilute Blood AND Dilute Urine</h3>
                </div>
                <p className="text-xs text-muted-foreground mb-2 italic">"↓Na⁺ + dilute urine = Psychogenic Polydipsia"</p>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between"><span className="text-muted-foreground">Serum Na⁺</span><span className="font-mono font-medium">&lt;135 mEq/L</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Serum Osm</span><span className="font-mono font-medium">&lt;275 mOsm/kg</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Urine Osm</span><span className="font-mono font-medium">&lt;100 mOsm/kg</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Urine Na⁺</span><span className="font-mono font-medium">&lt;20 mEq/L</span></div>
                </div>
                <div className="mt-3 pt-2 border-t border-blue-500/10">
                  <Badge variant="outline" className="text-[10px] border-emerald-500/30 text-emerald-400">Psychogenic Polydipsia</Badge>
                </div>
              </div>
            </div>

            {/* Lithium toxicity note */}
            <div className="mt-3 p-3 rounded-lg border border-purple-500/20 bg-purple-500/5 text-xs">
              <p className="font-semibold text-purple-400 mb-1">⚠ Lithium Toxicity Note</p>
              <p className="text-muted-foreground">
                Lithium toxicity can present during volume depletion with low serum sodium and low serum osmolality;
                urine osmolality is often low because lithium impairs concentrating ability. Treat by stopping lithium
                and giving normal saline; dialysis if severe.
              </p>
            </div>
          </CardContent>
        )}
      </Card>

      {/* ── Differential Diagnosis: Hyponatremia & Polyuria Syndromes ── */}
      <Card className="border-indigo-500/20">
        <button
          onClick={() => setExpandedSection(expandedSection === "differential" ? null : "differential")}
          className="w-full text-left"
        >
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-indigo-400" />
                <CardTitle className="text-base">🧠 Differential Diagnosis: Hyponatremia &amp; Polyuria Syndromes</CardTitle>
              </div>
              {expandedSection === "differential" ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </div>
            <CardDescription>SIADH vs Psychogenic Polydipsia vs Diabetes Insipidus vs Lithium-Induced Nephrogenic DI — serum &amp; urine osmolality pattern mapping</CardDescription>
          </CardHeader>
        </button>

        {expandedSection === "differential" && (
          <CardContent className="pt-0 space-y-6">
            {/* Osmolality Pattern Mapping Table */}
            <div>
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <FileText className="h-4 w-4 text-indigo-400" />
                Serum &amp; Urine Osmolality Pattern Mapping
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 px-2 font-medium">Pattern</th>
                      <th className="text-left py-2 px-2 font-medium">Serum Osmolality</th>
                      <th className="text-left py-2 px-2 font-medium">Urine Osmolality</th>
                      <th className="text-left py-2 px-2 font-medium">What It Means</th>
                      <th className="text-left py-2 px-2 font-medium">Most Likely Condition</th>
                      <th className="text-left py-2 px-2 font-medium">Key Clue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {OSM_PATTERNS.map((p) => (
                      <tr key={p.id} className="border-b border-border/50 hover:bg-muted/30">
                        <td className="py-2 px-2">
                          <Badge variant="outline" className={`text-[10px] border-${p.color}-500/30 text-${p.color}-400`}>
                            {p.icon} {p.id === "siadh" ? "1" : p.id === "psychogenic" ? "2" : p.id === "di" ? "3" : "4"}
                          </Badge>
                        </td>
                        <td className={`py-2 px-2 font-medium ${p.serumOsm.includes("Dilute") ? "text-blue-400" : "text-orange-400"}`}>{p.serumOsm}</td>
                        <td className={`py-2 px-2 font-medium ${p.urineOsm.includes("Dilute") ? "text-blue-400" : "text-orange-400"}`}>{p.urineOsm}</td>
                        <td className="py-2 px-2 text-muted-foreground">{p.meaning}</td>
                        <td className="py-2 px-2">
                          <Badge variant="outline" className={`text-[10px] border-${p.color}-500/30 text-${p.color}-400`}>
                            {p.condition.split(" (")[0]}
                          </Badge>
                        </td>
                        <td className="py-2 px-2 text-muted-foreground text-[10px]">{p.keyClue}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Decision Tree Logic */}
            <div className="p-4 rounded-lg border border-indigo-500/20 bg-indigo-500/5">
              <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                <Activity className="h-4 w-4 text-indigo-400" />
                Decision Tree Logic
              </h3>
              <ol className="space-y-2 text-xs text-muted-foreground list-decimal list-inside">
                <li><strong className="text-indigo-300">Step 1 — Check serum osmolality:</strong> Is it low (dilute) or high (concentrated)?</li>
                <li><strong className="text-indigo-300">Step 2 — Check urine osmolality:</strong> Is it concentrated or dilute relative to serum?</li>
                <li><strong className="text-indigo-300">Step 3 — Assess volume status:</strong> Euvolemic, hypovolemic, or hypervolemic?</li>
                <li><strong className="text-indigo-300">Step 4 — Apply pattern matching:</strong> Use the table above to identify the most likely condition.</li>
                <li><strong className="text-indigo-300">Step 5 — Use additional clues:</strong>
                  <ul className="list-disc list-inside ml-4 mt-1 space-y-0.5">
                    <li>Urine sodium (&gt;40 in SIADH, &lt;20 in psychogenic polydipsia)</li>
                    <li>Desmopressin response (good in Central DI, poor in Nephrogenic DI / Lithium toxicity)</li>
                    <li>Clinical context (lithium use, psychiatric illness, small cell lung cancer, head trauma)</li>
                  </ul>
                </li>
              </ol>
              <p className="mt-3 text-xs text-indigo-400 font-semibold">
                💡 REMEMBER: Look at both serum &amp; urine osmolality together, assess volume status, and consider the clinical context!
              </p>
            </div>

            {/* ADH Logic Quick Reference */}
            <div className="p-4 rounded-lg border border-cyan-500/20 bg-cyan-500/5">
              <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                <Zap className="h-4 w-4 text-cyan-400" />
                ADH Logic Quick Reference
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 px-2 font-medium">ADH State</th>
                      <th className="text-left py-2 px-2 font-medium">Serum</th>
                      <th className="text-left py-2 px-2 font-medium">Urine</th>
                      <th className="text-left py-2 px-2 font-medium">Condition</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-border/50 hover:bg-muted/30">
                      <td className="py-1.5 px-2 font-medium text-red-400">ADH ↑ (excess)</td>
                      <td className="py-1.5 px-2 text-blue-400">Dilute</td>
                      <td className="py-1.5 px-2 text-orange-400">Concentrated</td>
                      <td className="py-1.5 px-2"><Badge variant="outline" className="text-[10px] border-blue-500/30 text-blue-400">SIADH</Badge></td>
                    </tr>
                    <tr className="border-b border-border/50 hover:bg-muted/30">
                      <td className="py-1.5 px-2 font-medium text-emerald-400">ADH ↓ (suppressed)</td>
                      <td className="py-1.5 px-2 text-blue-400">Dilute</td>
                      <td className="py-1.5 px-2 text-blue-400">Dilute</td>
                      <td className="py-1.5 px-2"><Badge variant="outline" className="text-[10px] border-emerald-500/30 text-emerald-400">Primary Polydipsia</Badge></td>
                    </tr>
                    <tr className="border-b border-border/50 hover:bg-muted/30">
                      <td className="py-1.5 px-2 font-medium text-orange-400">ADH absent/resistant</td>
                      <td className="py-1.5 px-2 text-orange-400">Concentrated</td>
                      <td className="py-1.5 px-2 text-blue-400">Dilute</td>
                      <td className="py-1.5 px-2"><Badge variant="outline" className="text-[10px] border-red-500/30 text-red-400">Diabetes Insipidus</Badge></td>
                    </tr>
                    <tr className="hover:bg-muted/30">
                      <td className="py-1.5 px-2 font-medium text-muted-foreground">ADH appropriate</td>
                      <td className="py-1.5 px-2 text-orange-400">Concentrated</td>
                      <td className="py-1.5 px-2 text-orange-400">Concentrated</td>
                      <td className="py-1.5 px-2"><Badge variant="outline" className="text-[10px] border-purple-500/30 text-purple-400">Lithium NDI / Non-specific</Badge></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Normal Reference Ranges */}
            <div className="p-4 rounded-lg border border-muted-foreground/20 bg-muted/10">
              <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                <Info className="h-4 w-4 text-muted-foreground" />
                Normal Reference Ranges
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-2 rounded bg-card/50 border border-border">
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Serum Osmolality</div>
                  <div className="text-sm font-bold">275–295 mOsm/kg</div>
                </div>
                <div className="p-2 rounded bg-card/50 border border-border">
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Urine Osmolality</div>
                  <div className="text-sm font-bold">50–1200 mOsm/kg</div>
                </div>
                <div className="p-2 rounded bg-card/50 border border-border">
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Urine Specific Gravity</div>
                  <div className="text-sm font-bold">1.005–1.030</div>
                </div>
                <div className="p-2 rounded bg-card/50 border border-border">
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Urine Sodium</div>
                  <div className="text-sm font-bold">Variable</div>
                  <div className="text-[10px] text-muted-foreground">depends on volume status</div>
                </div>
              </div>
            </div>

            {/* Detailed Condition Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {CONDITIONS.map((c) => (
                <div key={c.id} className={`rounded-lg border border-${c.color}-500/20 bg-${c.color}-500/5 p-4`}>
                  <h3 className={`text-sm font-bold text-${c.color}-400 mb-2`}>{c.name}</h3>
                  <p className="text-xs text-muted-foreground mb-3">{c.pathophysiology}</p>

                  <div className="mb-3">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Lab Pattern</p>
                    <div className="space-y-0.5">
                      {c.labPattern.map((l, i) => (
                        <div key={i} className="flex justify-between text-xs">
                          <span className="text-muted-foreground">{l.label}</span>
                          <span className="font-mono font-medium">{l.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mb-3">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Clinical Features</p>
                    <div className="flex flex-wrap gap-1">
                      {c.clinicalFeatures.map((f, i) => (
                        <Badge key={i} variant="secondary" className="text-[10px]">{f}</Badge>
                      ))}
                    </div>
                  </div>

                  <div className="mb-3">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Management</p>
                    <ul className="space-y-0.5">
                      {c.management.map((m, i) => (
                        <li key={i} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                          <span className={`text-${c.color}-400 mt-0.5`}>•</span>
                          {m}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Exam Buzzwords</p>
                    <div className="flex flex-wrap gap-1">
                      {c.examBuzzwords.map((b, i) => (
                        <Badge key={i} variant="outline" className={`text-[10px] border-${c.color}-500/30 text-${c.color}-400`}>{b}</Badge>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        )}
      </Card>

      {/* ── STEP 1: Confirm Hypotonic Hyponatremia ── */}
      <Card className="border-blue-500/20">
        <button
          onClick={() => setExpandedSection(expandedSection === "step1" ? null : "step1")}
          className="w-full text-left"
        >
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FlaskConical className="h-5 w-5 text-blue-400" />
                <CardTitle className="text-base">Step 1: Confirm Hypotonic Hyponatremia</CardTitle>
              </div>
              {expandedSection === "step1" ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </div>
            <CardDescription>Check serum osmolality to rule out pseudohyponatremia and translocational hyponatremia</CardDescription>
          </CardHeader>
        </button>

        {expandedSection === "step1" && (
          <CardContent className="space-y-4 pt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Serum Na⁺ (mmol/L)</Label>
                <Input
                  type="number"
                  step="0.1"
                  placeholder="e.g. 118"
                  value={serumNa}
                  onChange={(e) => setSerumNa(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Serum Osmolality (mOsm/kg)</Label>
                <Input
                  type="number"
                  placeholder="e.g. 245"
                  value={serumOsm}
                  onChange={(e) => setSerumOsm(e.target.value)}
                />
              </div>
            </div>

            <Button onClick={analyzeOsmolality} className="w-full" disabled={!serumNa || !serumOsm}>
              Analyze Osmolality
            </Button>

            {osmResult && (
              <div className={`p-3 rounded-lg border text-sm ${
                osmResult === "hypotonic"
                  ? "bg-green-500/5 border-green-500/20 text-green-400"
                  : osmResult === "isotonic"
                  ? "bg-amber-500/5 border-amber-500/20 text-amber-400"
                  : "bg-orange-500/5 border-orange-500/20 text-orange-400"
              }`}>
                <p className="font-semibold">
                  {osmResult === "hypotonic" && "✓ Hypotonic hyponatremia confirmed — proceed to volume assessment"}
                  {osmResult === "isotonic" && "⚠ Isotonic — pseudohyponatremia (hyperlipidemia, hyperproteinemia). No sodium correction needed."}
                  {osmResult === "hypertonic" && "⚠ Hypertonic — translocational (hyperglycemia). Na⁺ falls ~1.4 mEq/L per 100 mg/dL glucose rise. Treat hyperglycemia first."}
                </p>
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {/* ── STEP 2: Classify Volume Status ── */}
      <Card className={`border-${volumeStatus ? "green" : "purple"}-500/20 ${!steps.step1_complete ? "opacity-50 pointer-events-none" : ""}`}>
        <button
          onClick={() => setExpandedSection(expandedSection === "step2" ? null : "step2")}
          className="w-full text-left"
        >
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Stethoscope className="h-5 w-5 text-purple-400" />
                <CardTitle className="text-base">Step 2: Classify Volume Status</CardTitle>
              </div>
              {expandedSection === "step2" ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </div>
            <CardDescription>Use urine osmolality + urine sodium to determine hypovolemic / euvolemic / hypervolemic</CardDescription>
          </CardHeader>
        </button>

        {expandedSection === "step2" && (
          <CardContent className="space-y-4 pt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Urine Osmolality (mOsm/kg)</Label>
                <Input
                  type="number"
                  placeholder="e.g. 420"
                  value={urineOsm}
                  onChange={(e) => setUrineOsm(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Urine Sodium (mEq/L)</Label>
                <Input
                  type="number"
                  placeholder="e.g. 35"
                  value={urineNa}
                  onChange={(e) => setUrineNa(e.target.value)}
                />
              </div>
            </div>

            <Button onClick={analyzeVolume} className="w-full" disabled={!urineOsm || !urineNa}>
              Classify Volume Status
            </Button>

            {/* Reference table */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 px-2 font-medium">Volume</th>
                    <th className="text-left py-2 px-2 font-medium">UOsm</th>
                    <th className="text-left py-2 px-2 font-medium">UNa</th>
                    <th className="text-left py-2 px-2 font-medium">Causes</th>
                  </tr>
                </thead>
                <tbody>
                  {VOLUME_CRITERIA.map((vc, i) => (
                    <tr key={i} className="border-b border-border/50 hover:bg-muted/30">
                      <td className="py-1.5 px-2 font-medium">{vc.volume}</td>
                      <td className="py-1.5 px-2">{vc.uOsm}</td>
                      <td className="py-1.5 px-2">{vc.uNa}</td>
                      <td className="py-1.5 px-2 text-muted-foreground">{vc.causes.join(", ")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {volumeStatus && (
              <div className="p-3 rounded-lg border bg-green-500/5 border-green-500/20 text-sm">
                <p className="font-semibold text-green-400">
                  ✓ Volume status: <span className="uppercase">{volumeStatus}</span>
                </p>
                <p className="text-muted-foreground mt-1">
                  {volumeStatus === "hypovolemic" && "Hypovolemic hyponatremia — replace volume with isotonic fluids."}
                  {volumeStatus === "euvolemic" && "Euvolemic hyponatremia (SIADH pattern) — fluid restriction + consider vaptans."}
                  {volumeStatus === "hypervolemic" && "Hypervolemic hyponatremia — loop diuretics + salt/water restriction. Treat underlying disease."}
                </p>
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {/* ── STEP 3: Treatment ── */}
      <Card className={`border-${symptomSeverity ? "green" : "rose"}-500/20 ${!steps.step2_complete ? "opacity-50 pointer-events-none" : ""}`}>
        <button
          onClick={() => setExpandedSection(expandedSection === "step3" ? null : "step3")}
          className="w-full text-left"
        >
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Syringe className="h-5 w-5 text-rose-400" />
                <CardTitle className="text-base">Step 3: Treatment Plan</CardTitle>
              </div>
              {expandedSection === "step3" ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </div>
            <CardDescription>Select symptom severity and chronicity to generate a treatment plan</CardDescription>
          </CardHeader>
        </button>

        {expandedSection === "step3" && (
          <CardContent className="space-y-4 pt-0">
            {/* Symptom severity */}
            <div>
              <Label className="mb-2 block">Symptom Severity</Label>
              <div className="grid grid-cols-3 gap-2">
                {(["asymptomatic", "moderate", "severe"] as const).map((s) => (
                  <Button
                    key={s}
                    variant={symptomSeverity === s ? "default" : "outline"}
                    className={`h-auto py-3 ${
                      s === "severe" ? "text-red-400 border-red-500/30" :
                      s === "moderate" ? "text-amber-400 border-amber-500/30" : ""
                    }`}
                    onClick={() => setSymptomSeverity(s)}
                  >
                    <div className="text-center">
                      <div className="text-xs font-semibold mb-1">{s.toUpperCase()}</div>
                      <div className="text-[10px] text-muted-foreground">
                        {s === "asymptomatic" && "No symptoms"}
                        {s === "moderate" && "Confusion/headache/nausea"}
                        {s === "severe" && "Seizures/coma/life-threatening"}
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
            </div>

            {/* Chronicity */}
            {symptomSeverity && symptomSeverity !== "asymptomatic" && (
              <div>
                <Label className="mb-2 block">Duration / Chronicity</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant={chronicity === "acute" ? "default" : "outline"}
                    onClick={() => setChronicity("acute")}
                  >Acute (&lt;48 h) — rapid correction safer</Button>
                  <Button
                    variant={chronicity === "chronic" ? "default" : "outline"}
                    onClick={() => setChronicity("chronic")}
                  >Chronic (&gt;48 h) — slow correction required</Button>
                </div>
              </div>
            )}

            {/* Treatment plan output */}
            {treatmentPlan && (
              <div className="space-y-3">
                <Separator />
                <div className="p-4 rounded-lg border border-green-500/20 bg-green-500/5">
                  <h3 className="text-base font-bold text-green-400 mb-2 flex items-center gap-2">
                    <Pill className="h-5 w-5" />
                    {treatmentPlan.title}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                    <div className="p-2 rounded bg-card/50 border border-border">
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Agent</div>
                      <div className="font-semibold text-sm">{treatmentPlan.agent}</div>
                    </div>
                    <div className="p-2 rounded bg-card/50 border border-border">
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Dose</div>
                      <div className="font-semibold text-sm">{treatmentPlan.dose}</div>
                    </div>
                    <div className="p-2 rounded bg-card/50 border border-border">
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Max Correction</div>
                      <div className="font-semibold text-sm">{treatmentPlan.maxCorrection}</div>
                    </div>
                  </div>
                  <ul className="space-y-1">
                    {treatmentPlan.details.map((d, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <span className="text-green-400 mt-0.5">•</span>
                        {d}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {/* ── Adrogue-Madias Calculator ── */}
      <Card className="border-cyan-500/20">
        <button
          onClick={() => setExpandedSection(expandedSection === "calculator" ? null : "calculator")}
          className="w-full text-left"
        >
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calculator className="h-5 w-5 text-cyan-400" />
                <CardTitle className="text-base">Adrogue-Madias Equation Calculator</CardTitle>
              </div>
              {expandedSection === "calculator" ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </div>
            <CardDescription>Predict ΔNa⁺ per liter of infusate: (infusate_Na − serum_Na) / (TBW + 1)</CardDescription>
          </CardHeader>
        </button>

        {expandedSection === "calculator" && (
          <CardContent className="space-y-4 pt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label>Weight (kg)</Label>
                <Input type="number" placeholder="e.g. 70" value={weight} onChange={(e) => setWeight(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Age (years)</Label>
                <Input type="number" placeholder="e.g. 55" value={age} onChange={(e) => setAge(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Gender</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant={gender === "male" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setGender("male")}
                  >Male</Button>
                  <Button
                    variant={gender === "female" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setGender("female")}
                  >Female</Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Infusate</Label>
                <select
                  className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                  value={infusate}
                  onChange={(e) => setInfusate(e.target.value)}
                >
                  {Object.keys(INFUSATE_COMPOSITION).map((k) => (
                    <option key={k} value={k}>{k} (Na⁺ {INFUSATE_COMPOSITION[k].Na} mEq/L)</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Current Serum Na⁺ (mmol/L)</Label>
                <Input type="number" step="0.1" placeholder="e.g. 118" value={serumNa} onChange={(e) => setSerumNa(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Target Na⁺ (optional)</Label>
                <Input type="number" step="0.1" placeholder="e.g. 125" value={targetNa} onChange={(e) => setTargetNa(e.target.value)} />
              </div>
            </div>

            {amResult && (
              <div className="p-4 rounded-lg border border-cyan-500/20 bg-cyan-500/5">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">TBW Estimate</div>
                    <div className="text-lg font-bold text-cyan-400">{tbw(parseFloat(weight), parseFloat(age), gender).toFixed(1)} L</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">ΔNa⁺ per liter</div>
                    <div className="text-lg font-bold text-cyan-400">{amResult.delta.toFixed(2)} mmol/L</div>
                    <div className="text-xs text-muted-foreground">per 1 L of {infusate}</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Liters to target</div>
                    <div className="text-lg font-bold text-cyan-400">{amResult.litersToTarget.toFixed(2)} L</div>
                    <div className="text-xs text-muted-foreground">
                      {targetNa ? `to reach Na⁺ ${parseFloat(targetNa).toFixed(0)}` : "—"}
                    </div>
                  </div>
                </div>
                <div className="mt-2 text-xs text-muted-foreground">
                  Formula: ΔNa⁺ = (infusate_Na − serum_Na) / (TBW + 1).
                  TBW = {parseFloat(weight).toFixed(0)} kg × {(age ? (parseFloat(age) > 60 ? (gender === "female" ? 0.45 : 0.5) : (gender === "female" ? 0.5 : 0.6)) : 0.6)} = {tbw(parseFloat(weight), parseFloat(age), gender).toFixed(1)} L
                </div>
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {/* ── Safety Rules ── */}
      <Card className="border-red-500/20">
        <button
          onClick={() => setExpandedSection(expandedSection === "safety" ? null : "safety")}
          className="w-full text-left"
        >
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-400" />
                <CardTitle className="text-base">⚠ Safety Rules & ODS Prevention</CardTitle>
              </div>
              {expandedSection === "safety" ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </div>
            <CardDescription>Osmotic demyelination syndrome is preventable — most cases are iatrogenic</CardDescription>
          </CardHeader>
        </button>

        {expandedSection === "safety" && (
          <CardContent className="space-y-3 pt-0">
            {SAFETY_RULES.map((rule, i) => (
              <div key={i} className={`p-3 rounded-lg border ${rule.border} ${rule.bg} flex items-start gap-3`}>
                <span className={`mt-0.5 ${rule.color}`}>{rule.icon}</span>
                <div>
                  <p className="text-sm font-semibold">{rule.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{rule.detail}</p>
                </div>
              </div>
            ))}
          </CardContent>
        )}
      </Card>
    </div>
  );
}