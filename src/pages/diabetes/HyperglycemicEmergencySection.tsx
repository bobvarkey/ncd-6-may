import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { AlertTriangle, Activity, Syringe, Droplets, FlaskConical, HeartPulse, Copy, Printer, Download, ChevronDown, Image } from "lucide-react";
import ImageLink from "@/components/ImageLink";
import { downloadTextFile } from "@/lib/clinical-utils";
import { toast } from "sonner";

// ─── DKA severity classification ───
type DKASeverity = "mild" | "moderate" | "severe" | null;

function classifyDKA(
  glucose: number,
  bicarb: number | null,
  ph: number | null,
  anionGap: number | null,
  betaOHB: number | null,
): { severity: DKASeverity; label: string; description: string } {
  if (!bicarb && !ph && !anionGap) return { severity: null, label: "Insufficient data", description: "Enter bicarb, pH, or anion gap to classify DKA severity." };

  // By bicarb
  if (bicarb !== null) {
    if (bicarb >= 18 && bicarb < 25) return { severity: "mild", label: "Mild DKA", description: `HCO₃⁻ ${bicarb} mmol/L — fluid resuscitation + insulin drip. Bedtime glucose check hourly.` };
    if (bicarb >= 10 && bicarb < 18) return { severity: "moderate", label: "Moderate DKA", description: `HCO₃⁻ ${bicarb} mmol/L — IV fluids, insulin infusion, monitor K⁺/glucose q1h.` };
    if (bicarb < 10) return { severity: "severe", label: "Severe DKA", description: `HCO₃⁻ ${bicarb} mmol/L — ICU-level care, insulin drip, aggressive fluids, q1h labs.` };
  }

  // By pH (venous or arterial)
  if (ph !== null) {
    if (ph >= 7.25 && ph < 7.30) return { severity: "mild", label: "Mild DKA", description: `pH ${ph} — fluid resuscitation + insulin.` };
    if (ph >= 7.0 && ph < 7.25) return { severity: "moderate", label: "Moderate DKA", description: `pH ${ph} — IV fluids, insulin drip, monitor K⁺.` };
    if (ph < 7.0) return { severity: "severe", label: "Severe DKA", description: `pH ${ph} — ICU, insulin drip, consider bicarb if pH <6.9.` };
  }

  // By anion gap
  if (anionGap !== null) {
    if (anionGap > 12 && anionGap <= 16) return { severity: "mild", label: "Mild DKA (AG 12–16)", description: `Anion gap ${anionGap} — mild metabolic acidosis; fluids + insulin.` };
    if (anionGap > 16 && anionGap <= 24) return { severity: "moderate", label: "Moderate DKA (AG 16–24)", description: `Anion gap ${anionGap} — IV insulin infusion indicated.` };
    if (anionGap > 24) return { severity: "severe", label: "Severe DKA (AG >24)", description: `Anion gap ${anionGap} — severe academia; ICU admission.` };
  }

  return { severity: null, label: "Insufficient data", description: "Enter labs to classify." };
}

// ─── HHS diagnostic criteria ───
function classifyHHS(
  glucose: number,
  osm: number | null,
  bicarb: number | null,
  anionGap: number | null,
  betaOHB: number | null,
): { isHHS: boolean; confidence: "definite" | "probable" | "unlikely"; reason: string } {
  const hhsGlucose = glucose >= 600;
  const hhsOsm = osm !== null && osm > 320;
  const noDKA = (bicarb === null || bicarb > 18) && (anionGap === null || anionGap <= 12) && (betaOHB === null || betaOHB < 1.5);

  if (hhsGlucose && hhsOsm && noDKA) return { isHHS: true, confidence: "definite", reason: `Glucose ${glucose} mg/dL, osm ${osm} mOsm/kg, no significant ketoacidosis. Classic HHS.` };
  if (hhsGlucose && hhsOsm && !noDKA) return { isHHS: true, confidence: "probable", reason: `Glucose ${glucose} mg/dL, osm ${osm} mOsm/kg, with mild ketosis — mixed DKA/HHS picture.` };
  if (hhsGlucose && !hhsOsm && (osm !== null)) return { isHHS: false, confidence: "unlikely", reason: `Osm ${osm} — <320 threshold. Glucose alone insufficient for HHS.` };
  if (!hhsGlucose) return { isHHS: false, confidence: "unlikely", reason: `Glucose ${glucose} mg/dL — below 600 threshold. Consider DKA or other hyperglycemia.` };
  return { isHHS: false, confidence: "unlikely", reason: "Insufficient data to classify HHS." };
}

// ─── Mixed DKA/HHS overlap ───
type OverlapType = "pure-dka" | "pure-hhs" | "dka-hhs-mixed" | "unclear";

function classifyOverlap(
  dka: { severity: DKASeverity; label: string },
  hhs: { isHHS: boolean; confidence: string },
): { type: OverlapType; label: string; management: string } {
  if (dka.severity && hhs.isHHS) return {
    type: "dka-hhs-mixed",
    label: "Mixed DKA/HHS Overlap",
    management: "Treat both: aggressive IVF (10–15 mL/kg NS bolus, then 0.5–1 L/h NS), insulin drip (0.1 U/kg bolus + 0.1 U/kg/h), replace K⁺ per protocol. Monitor glucose, bicarb, anion gap, osm q1–2h. Transition to SQ insulin when gap closes AND glucose <250. HHS may require more fluids and lower insulin threshold.",
  };
  if (dka.severity && !hhs.isHHS) return {
    type: "pure-dka",
    label: "DKA (no HHS features)",
    management: "Standard DKA protocol: IVF (NS 15–20 mL/kg bolus, then 250–500 mL/h), insulin drip (0.1 U/kg + 0.1 U/kg/h), K⁺ replacement when <5.3. Monitor glucose, bicarb, gap q1h. Transition when gap closes + glucose <200 (or <250 for T1D).",
  };
  if (!dka.severity && hhs.isHHS) return {
    type: "pure-hhs",
    label: "HHS (no significant ketosis)",
    management: "HHS protocol: aggressive IVF (NS 15–20 mL/kg bolus, then 0.5–1 L/h NS), insulin 0.1 U/kg IV bolus + 0.1 U/kg/h once glucose plateaus. K⁺ replacement. Monitor glucose, osm, Na q1–2h. Transition when glucose <250–300 AND osm normalizes.",
  };
  return { type: "unclear", label: "Incomplete data", management: "Enter labs to determine DKA vs HHS classification." };
}

// ─── Fluid & insulin calculator ───
type FluidPhase = "bolus" | "maintenance" | "transition";

function fluidCalculator(weightKg: number, overlap: OverlapType, phase: FluidPhase): { recommendation: string; rate: string; volume?: number } {
  if (!weightKg || weightKg <= 0) return { recommendation: "Enter weight to calculate.", rate: "—" };

  if (phase === "bolus") {
    if (overlap === "pure-hhs") return {
      recommendation: `NS 15–20 mL/kg = ${(weightKg * 17.5).toFixed(0)} mL (range ${(weightKg * 15).toFixed(0)}–${(weightKg * 20).toFixed(0)}) over 1–2 h`,
      rate: "1000 mL/h typical",
      volume: weightKg * 17.5,
    };
    return {
      recommendation: `NS 15–20 mL/kg = ${(weightKg * 17.5).toFixed(0)} mL (range ${(weightKg * 15).toFixed(0)}–${(weightKg * 20).toFixed(0)}) over 1 h`,
      rate: "bolus then reassess",
      volume: weightKg * 17.5,
    };
  }

  if (phase === "maintenance") {
    if (overlap === "pure-hhs") return {
      recommendation: `0.45% NaCl (½NS) at 250–500 mL/h, based on corrected Na⁺. Target urine output 0.5 mL/kg/h. Replace fluid deficit (estimated 6–10 L in HHS) over 24–48 h.`,
      rate: "250–500 mL/h ½NS",
    };
    return {
      recommendation: `NS at 250–500 mL/h once bolus complete. When glucose <250 (DKA) or <300 (HHS), switch to D5 ½NS at 150–250 mL/h to maintain glucose 150–250.`,
      rate: "250–500 mL/h",
    };
  }

  return {
    recommendation: "Transition to SQ when: anion gap ≤12, bicarb ≥18, pH ≥7.30, glucose <200 (DKA) or <250–300 (HHS), and eating. Start SQ insulin 2 h before stopping drip (basal + prandial).",
    rate: "overlap period",
  };
}

function insulinCalculator(weightKg: number): { bolus: string; infusion: string; notes: string } {
  if (!weightKg || weightKg <= 0) return { bolus: "—", infusion: "—", notes: "Enter weight to calculate." };
  const bolusDose = Math.round(weightKg * 0.1 * 10) / 10;
  const infusionRate = Math.round(weightKg * 0.1 * 10) / 10;
  return {
    bolus: `${bolusDose} U IV (0.1 U/kg × ${weightKg} kg)`,
    infusion: `${infusionRate} U/h IV (0.1 U/kg/h × ${weightKg} kg)`,
    notes: "Omit IV bolus if glucose is falling with fluids alone. Reduce rate once glucose drops by 50–75 mg/dL/h. Target: 50–75 mg/dL/h decrease.",
  };
}

// ─── Potassium replacement ───
type KLevel = "<3.3" | "3.3–5.2" | "5.3–5.9" | "≥6.0" | null;

function potassiumReplacement(k: KLevel): { action: string; rate: string; caution: string } {
  switch (k) {
    case "<3.3":
      return {
        action: "Hold insulin until K⁺ corrected! Life-threatening hypokalemia.",
        rate: "10–20 mEq KCl/h IV",
        caution: "Central line preferred for rates >10 mEq/h. Cardiac monitoring.",
      };
    case "3.3–5.2":
      return {
        action: "Replace K⁺ in IV fluids to maintain target 4–5 mEq/L.",
        rate: "20–30 mEq KCl per liter of IV fluids",
        caution: "Adjust rate based on urine output and renal function.",
      };
    case "5.3–5.9":
      return {
        action: "Observe; monitor q2h. Do not add K⁺ to fluids yet.",
        rate: "None — recheck in 2 h",
        caution: "K⁺ will fall as acidosis corrects and insulin drives it intracellularly.",
      };
    case "≥6.0":
      return {
        action: "Hold K⁺ replacement. Assess for renal failure. Consider ECG + calcium gluconate.",
        rate: "Hold",
        caution: "Hyperkalemia may be artefactual (hemolysis) or due to acidosis/renal failure.",
      };
    default:
      return { action: "Check serum K⁺", rate: "—", caution: "—" };
  }
}

// ─── Trigger workup ───
type Trigger = {
  id: string;
  label: string;
  category: string;
  investigations: string[];
  management: string;
};

const TRIGGERS: Trigger[] = [
  {
    id: "infection",
    label: "Infection (most common)",
    category: "Medical",
    investigations: ["CBC with differential", "Blood cultures ×2", "Urinalysis + culture", "Chest X-ray", "Procalcitonin if indicated"],
    management: "Empiric antibiotics per local protocol once cultures drawn. Consider urinary, respiratory, or skin source.",
  },
  {
    id: "insulin-nonadherence",
    label: "Insulin non-adherence / missed doses",
    category: "Behavioral",
    investigations: ["HbA1c for baseline control", "Review insulin prescription + fill history"],
    management: "Resume basal insulin. Assess barriers (cost, access, injection technique, depression). Diabetes educator consult.",
  },
  {
    id: "new-onset",
    label: "New-onset T1D (first presentation)",
    category: "Endocrine",
    investigations: ["C-peptide (fasting or random)", "Autoantibodies (GAD, IA-2, ZnT8, insulin)", "HbA1c", "TSH (rule out autoimmune thyroiditis)"],
    management: "Initiate insulin therapy. Educate on sick-day rules. Refer to endocrinology and diabetes education.",
  },
  {
    id: "mi-stroke",
    label: "ACS / Stroke / Acute illness",
    category: "Cardiovascular",
    investigations: ["ECG ×2 in 24 h", "Troponin", "CK-MB", "CT head if neuro symptoms", "Echocardiogram if indicated"],
    management: "Treat primary event. Stress hyperglycemia independently predicts worse outcomes — manage with insulin infusion.",
  },
  {
    id: "meds",
    label: "Drug-induced (SGLT2i, steroids, antipsychotics)",
    category: "Medication",
    investigations: ["Review medication list", "Check for SGLT2i (euglycemic DKA)", "Check for recent steroids"],
    management: "Withhold offending agent if possible. SGLT2i: euglycemic DKA (glucose <250) — treat with D10 + insulin, dextrose + IVF.",
  },
  {
    id: "pump-failure",
    label: "Insulin pump / CGM failure",
    category: "Device",
    investigations: ["Check pump history, infusion set, reservoir", "Check CGM calibration"],
    management: "Replace infusion set + reservoir. Give SQ correction immediately. Backup basal insulin (glargine) at 80% of total daily basal dose.",
  },
  {
    id: "pancreatitis",
    label: "Pancreatitis",
    category: "GI",
    investigations: ["Lipase (amylase less specific)", "Abdominal CT if diagnosis uncertain", "LFTs, triglycerides, calcium"],
    management: "DKA + pancreatitis is a dangerous combination. Aggressive IVF, insulin drip, NPO, pain control. Monitor for acute kidney injury.",
  },
  {
    id: "pregnancy",
    label: "Pregnancy (DKA in pregnancy)",
    category: "Obstetric",
    investigations: ["Fetal monitoring", "Urine ketones", "Serum beta-OHB", "Electrolytes q2h"],
    management: "Diabetic Ketoacidosis in Pregnancy is a fetal emergency. Admit to ICU/MFM. Aggressive IVF (1–2 L NS in first hour). Insulin drip. Fetal monitoring throughout. Deliver if non-reassuring fetal status.",
  },
];

// ─── Euglycemic DKA (SGLT2i) ───
type EuglycemicDKA = {
  suspect: boolean;
  criteria: string[];
  management: string;
};

function assessEuglycemicDKA(glucose: number, ketones: string | null, sglt2i: boolean, anionGap: number | null): EuglycemicDKA {
  if (!sglt2i) return { suspect: false, criteria: [], management: "Not applicable — no SGLT2i exposure." };
  const criteria: string[] = [];
  if (glucose < 250) criteria.push(`Glucose ${glucose} mg/dL (<250) — euglycemic range`);
  else criteria.push(`Glucose ${glucose} mg/dL — not euglycemic but SGLT2i can still cause DKA`);
  if (ketones === "positive") criteria.push("Ketones positive");
  if (anionGap !== null && anionGap > 12) criteria.push(`Anion gap ${anionGap} — elevated`);
  const suspect = (glucose < 250 || sglt2i) && (ketones === "positive" || (anionGap !== null && anionGap > 12));
  return {
    suspect,
    criteria,
    management: suspect
      ? "Suspect euglycemic DKA. Stop SGLT2i. Treat with D10W + insulin infusion (maintain glucose 150–200). Aggressive IVF (NS) — these patients need dextrose to avoid hypoglycemia. Monitor gap and ketones closely."
      : "SGLT2i exposure noted but no biochemical evidence of euglycemic DKA. Continue standard DKA management; hold SGLT2i until resolution.",
  };
}

// ─── Main component (embedded version — no standalone page header) ───
export default function HyperglycemicEmergencySection() {
  // Labs
  const [glucose, setGlucose] = useState("");
  const [bicarb, setBicarb] = useState("");
  const [ph, setPh] = useState("");
  const [anionGap, setAnionGap] = useState("");
  const [betaOHB, setBetaOHB] = useState("");
  const [sodium, setSodium] = useState("");
  const [bun, setBun] = useState("");
  const [potassium, setPotassium] = useState<KLevel>(null);
  const [ketones, setKetones] = useState<string>("");
  const [creatinine, setCreatinine] = useState("");

  // Patient
  const [weight, setWeight] = useState("");
  const [age, setAge] = useState("");

  // Context
  const [type1DM, setType1DM] = useState(false);
  const [sglt2iUse, setSglt2iUse] = useState(false);
  const [pregnancy, setPregnancy] = useState(false);
  const [alteredMentation, setAlteredMentation] = useState(false);
  const [vomiting, setVomiting] = useState(false);
  const [hypotension, setHypotension] = useState(false);

  // Fluid phase
  const [fluidPhase, setFluidPhase] = useState<FluidPhase>("bolus");

  const n = (s: string) => parseFloat(s) || 0;

  // Computed: calculated osm
  const osm = useMemo(() => {
    const g = n(glucose);
    const na = n(sodium);
    const b = n(bun);
    if (g && na && b) return 2 * na + g / 18 + b / 2.8;
    if (g && na) return 2 * na + g / 18;
    return null;
  }, [glucose, sodium, bun]);

  // Computed: effective osm (without BUN)
  const effectiveOsm = useMemo(() => {
    const g = n(glucose);
    const na = n(sodium);
    if (g && na) return 2 * na + g / 18;
    return null;
  }, [glucose, sodium]);

  // DKA classification
  const dka = useMemo(() => classifyDKA(
    n(glucose),
    bicarb ? n(bicarb) : null,
    ph ? n(ph) : null,
    anionGap ? n(anionGap) : null,
    betaOHB ? n(betaOHB) : null,
  ), [glucose, bicarb, ph, anionGap, betaOHB]);

  // HHS classification
  const hhs = useMemo(() => classifyHHS(
    n(glucose),
    osm,
    bicarb ? n(bicarb) : null,
    anionGap ? n(anionGap) : null,
    betaOHB ? n(betaOHB) : null,
  ), [glucose, osm, bicarb, anionGap, betaOHB]);

  // Overlap
  const overlap = useMemo(() => classifyOverlap(dka, hhs), [dka, hhs]);

  // Fluids
  const fluids = useMemo(() => fluidCalculator(n(weight), overlap.type, fluidPhase), [weight, overlap.type, fluidPhase]);

  // Insulin
  const insulin = useMemo(() => insulinCalculator(n(weight)), [weight]);

  // K⁺ replacement
  const kReplacement = useMemo(() => potassiumReplacement(potassium), [potassium]);

  // Euglycemic DKA
  const euglycemic = useMemo(() => assessEuglycemicDKA(
    n(glucose),
    ketones || null,
    sglt2iUse,
    anionGap ? n(anionGap) : null,
  ), [glucose, ketones, sglt2iUse, anionGap]);

  // DKA criteria evaluation
  const dkaCriteria = useMemo(() => {
    const g = n(glucose);
    const b = bicarb ? n(bicarb) : null;
    const p = ph ? n(ph) : null;
    const bhb = betaOHB ? n(betaOHB) : null;
    return {
      hyperglycemia: g > 200 || type1DM,
      ketosis: bhb !== null ? bhb >= 3.0 : (ketones === "moderate" || ketones === "large"),
      acidosis: (p !== null && p < 7.3) || (b !== null && b < 18),
    };
  }, [glucose, bicarb, ph, betaOHB, ketones, type1DM]);

  // HHS criteria evaluation
  const hhsCriteria = useMemo(() => {
    const g = n(glucose);
    const b = bicarb ? n(bicarb) : null;
    const p = ph ? n(ph) : null;
    const bhb = betaOHB ? n(betaOHB) : null;
    return {
      hyperglycemia: g > 600,
      hyperosmolality: (effectiveOsm !== null && effectiveOsm > 300) || (osm !== null && osm > 320),
      noKetosis: bhb !== null ? bhb < 3.0 : (ketones === "" || ketones === "negative" || ketones === "trace" || ketones === "small"),
      noAcidosis: (p === null || p >= 7.3) && (b === null || b >= 18),
    };
  }, [glucose, bicarb, ph, betaOHB, ketones, osm, effectiveOsm]);

  // Red flags
  const redFlags = useMemo(() => {
    const flags: string[] = [];
    if (alteredMentation) flags.push("Altered mental status — consider cerebral edema (rare in adults), urgent imaging");
    if (hypotension) flags.push("Hypotension — septic shock until proven otherwise; fluids + pressors if needed");
    if (vomiting && n(glucose) > 0 && dka.severity) flags.push("Persistent vomiting with DKA — high aspiration risk, consider NG tube");
    if (pregnancy && dka.severity) flags.push("DKA in pregnancy — fetal emergency, ICU/MFM consult, fetal monitoring");
    if (dka.severity === "severe") flags.push("Severe DKA — ICU admission indicated");
    if (osm !== null && osm > 330) flags.push(`Osm ${osm.toFixed(0)} mOsm/kg (>330) — severe hyperosmolality, ICU, risk of thromboembolism`);
    if (n(creatinine) > 0 && n(bicarb) > 0 && dka.severity && n(creatinine) > 2) flags.push("AKI with DKA — adjust fluid strategy, monitor for fluid overload");
    return flags;
  }, [alteredMentation, hypotension, vomiting, pregnancy, dka, osm, creatinine, bicarb, glucose]);

  // Build summary
  const buildSummary = () => {
    const lines = [
      "HYPERGLYCEMIC EMERGENCY ASSESSMENT",
      "=".repeat(50),
      `Patient: age ${age || "—"}, weight ${weight || "—"} kg`,
      `Type 1 DM: ${type1DM ? "Yes" : "No"} | SGLT2i: ${sglt2iUse ? "Yes" : "No"} | Pregnant: ${pregnancy ? "Yes" : "No"}`,
      "",
      "LABS",
      `  Glucose: ${glucose || "—"} mg/dL`,
      `  Na⁺: ${sodium || "—"} | K⁺: ${potassium || "—"} | BUN: ${bun || "—"} | Cr: ${creatinine || "—"}`,
      `  HCO₃⁻: ${bicarb || "—"} | pH: ${ph || "—"} | AG: ${anionGap || "—"} | β-OHB: ${betaOHB || "—"}`,
      `  Ketones: ${ketones || "—"} | Calculated Osm: ${osm !== null ? osm.toFixed(1) : "—"} mOsm/kg`,
      "",
      "CLASSIFICATION",
      `  DKA: ${dka.label}`,
      `  HHS: ${hhs.isHHS ? `Yes (${hhs.confidence})` : "No"} — ${hhs.reason}`,
      `  Overlap: ${overlap.label}`,
      "",
      euglycemic.suspect ? `⚠ EUGLYCEMIC DKA SUSPECTED (SGLT2i): ${euglycemic.management}` : "",
      euglycemic.suspect ? "" : "",
      redFlags.length ? "RED FLAGS\n" + redFlags.map(f => "  • " + f).join("\n") + "\n" : "",
      "MANAGEMENT",
      ...overlap.management.split(". ").filter(Boolean).map((s, i) => `  ${i + 1}. ${s}.`),
      "",
      "FLUID PROTOCOL",
      `  Bolus: ${fluids.recommendation}`,
      `  Maintenance: ${insulin.notes}`,
      "",
      "INSULIN PROTOCOL",
      `  Bolus: ${insulin.bolus}`,
      `  Infusion: ${insulin.infusion}`,
      `  Notes: ${insulin.notes}`,
      "",
      "POTASSIUM",
      `  Current K⁺: ${potassium || "—"}`,
      `  Action: ${kReplacement.action}`,
      `  Rate: ${kReplacement.rate}`,
      `  Caution: ${kReplacement.caution}`,
      "",
      "TRIGGER WORKUP",
      ...TRIGGERS.filter(t => {
        if (t.id === "pregnancy" && !pregnancy) return false;
        return true;
      }).map(t => `  ${t.label}: ${t.management}`),
      "",
      "Disclaimer: Decision-support only. Does not replace clinical judgment. Manage in appropriate level of care (ICU/step-down).",
    ];
    return lines.filter(Boolean).join("\n");
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(buildSummary());
    toast.success("Summary copied");
  };

  const handlePrint = () => {
    const html = `<!doctype html><html><head><title>Hyperglycemic Emergency</title>
      <style>body{font-family:system-ui,sans-serif;max-width:780px;margin:2rem auto;padding:0 1.5rem;color:#111;line-height:1.5}
      h1{font-size:18px;border-bottom:2px solid #333;padding-bottom:6px}
      pre{white-space:pre-wrap;font-family:inherit;font-size:13px}
      .meta{font-size:11px;color:#666;margin-top:24px;border-top:1px solid #ccc;padding-top:8px}</style></head>
      <body><h1>Hyperglycemic Emergency Assessment</h1>
      <pre>${buildSummary().replace(/</g,"&lt;")}</pre>
      <div class="meta">Generated ${new Date().toLocaleString()} — clinical decision support, not a substitute for clinical judgment.</div>
      <script>window.onload=()=>window.print()</script></body></html>`;
    const w = window.open("", "_blank");
    if (w) { w.document.write(html); w.document.close(); }
  };

  const riskBadge = (severity: DKASeverity) => {
    if (severity === "mild") return <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30">Mild DKA</Badge>;
    if (severity === "moderate") return <Badge className="bg-warning/100/15 text-warning border-amber-500/30">Moderate DKA</Badge>;
    if (severity === "severe") return <Badge className="bg-destructive/100/15 text-destructive border-red-500/30">Severe DKA</Badge>;
    return <Badge variant="outline">—</Badge>;
  };

  const PILL = "w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30";

  return (
    <div className="space-y-4 max-w-6xl">
      <div className="grid gap-4 md:grid-cols-2">
        {/* ─── Labs column ─── */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <FlaskConical className="h-4 w-4 text-primary" />
                <CardTitle className="text-sm">Labs & Vitals</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Glucose (mg/dL)</Label>
                  <Input className="h-9" value={glucose} onChange={e => setGlucose(e.target.value)} placeholder="e.g. 540" />
                  {n(glucose) > 0 && glucose !== "" && <p className="text-[10px] text-muted-foreground">= {(n(glucose) / 18.02).toFixed(1)} mmol/L</p>}
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Na⁺ (mEq/L)</Label>
                  <Input className="h-9" value={sodium} onChange={e => setSodium(e.target.value)} placeholder="e.g. 136" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">HCO₃⁻ (mmol/L)</Label>
                  <Input className="h-9" value={bicarb} onChange={e => setBicarb(e.target.value)} placeholder="e.g. 12" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">pH (VBG/ABG)</Label>
                  <Input className="h-9" value={ph} onChange={e => setPh(e.target.value)} placeholder="e.g. 7.18" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Anion Gap</Label>
                  <Input className="h-9" value={anionGap} onChange={e => setAnionGap(e.target.value)} placeholder="e.g. 22" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">β-OHB (mmol/L)</Label>
                  <Input className="h-9" value={betaOHB} onChange={e => setBetaOHB(e.target.value)} placeholder="e.g. 4.5" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">BUN (mg/dL)</Label>
                  <Input className="h-9" value={bun} onChange={e => setBun(e.target.value)} placeholder="e.g. 28" />
                  {n(bun) > 0 && bun !== "" && <p className="text-[10px] text-muted-foreground">= {(n(bun) / 2.8).toFixed(1)} mmol/L</p>}
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Creatinine (mg/dL)</Label>
                  <Input className="h-9" value={creatinine} onChange={e => setCreatinine(e.target.value)} placeholder="e.g. 1.2" />
                  {n(creatinine) > 0 && creatinine !== "" && <p className="text-[10px] text-muted-foreground">= {(n(creatinine) * 88.42).toFixed(0)} μmol/L</p>}
                </div>
              </div>

              {/* K⁺ & Ketones */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">K⁺ (mEq/L)</Label>
                  <select className={PILL} value={potassium || ""} onChange={e => setPotassium(e.target.value as KLevel)}>
                    <option value="">Select K⁺</option>
                    <option value="<3.3">&lt;3.3 (Hold insulin!)</option>
                    <option value="3.3–5.2">3.3–5.2</option>
                    <option value="5.3–5.9">5.3–5.9</option>
                    <option value="≥6.0">≥6.0</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Urine/Serum Ketones</Label>
                  <select className={PILL} value={ketones} onChange={e => setKetones(e.target.value)}>
                    <option value="">Select</option>
                    <option value="negative">Negative</option>
                    <option value="trace">Trace</option>
                    <option value="small">Small</option>
                    <option value="moderate">Moderate</option>
                    <option value="large">Large</option>
                    <option value="positive">Positive (unspecified)</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ─── Patient context ─── */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <HeartPulse className="h-4 w-4 text-primary" />
                <CardTitle className="text-sm">Patient Context</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Weight (kg)</Label>
                  <Input className="h-9" value={weight} onChange={e => setWeight(e.target.value)} placeholder="e.g. 75" />
                  {n(weight) > 0 && weight !== "" && <p className="text-[10px] text-muted-foreground">= {(n(weight) * 2.205).toFixed(0)} lbs</p>}
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Age</Label>
                  <Input className="h-9" value={age} onChange={e => setAge(e.target.value)} placeholder="e.g. 45" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <label className="flex items-center gap-2 text-xs cursor-pointer">
                  <Checkbox checked={type1DM} onCheckedChange={v => setType1DM(v === true)} />
                  Type 1 DM
                </label>
                <label className="flex items-center gap-2 text-xs cursor-pointer">
                  <Checkbox checked={sglt2iUse} onCheckedChange={v => setSglt2iUse(v === true)} />
                  On SGLT2i
                </label>
                <label className="flex items-center gap-2 text-xs cursor-pointer">
                  <Checkbox checked={pregnancy} onCheckedChange={v => setPregnancy(v === true)} />
                  Pregnant
                </label>
                <label className="flex items-center gap-2 text-xs cursor-pointer">
                  <Checkbox checked={alteredMentation} onCheckedChange={v => setAlteredMentation(v === true)} />
                  Altered mental status
                </label>
                <label className="flex items-center gap-2 text-xs cursor-pointer">
                  <Checkbox checked={vomiting} onCheckedChange={v => setVomiting(v === true)} />
                  Vomiting
                </label>
                <label className="flex items-center gap-2 text-xs cursor-pointer">
                  <Checkbox checked={hypotension} onCheckedChange={v => setHypotension(v === true)} />
                  Hypotension
                </label>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ─── Results column ─── */}
        <div className="space-y-4">
          {/* DKA severity */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-primary" />
                  <CardTitle className="text-sm">Classification</CardTitle>
                </div>
                {riskBadge(dka.severity)}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm">{dka.description}</p>
              <div className="border-t border-border pt-3 space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">HHS:</span>
                  <span className={hhs.isHHS ? "text-destructive font-medium" : "text-emerald-400"}>
                    {hhs.isHHS ? `✅ ${hhs.confidence}` : "❌ Not HHS"}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Calculated Osm:</span>
                  <span>{osm !== null ? `${osm.toFixed(1)} mOsm/kg` : "—"}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Overlap:</span>
                  <span className="font-medium">{overlap.label}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Management */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Syringe className="h-4 w-4 text-primary" />
                <CardTitle className="text-sm">Fluid & Insulin Protocol</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Fluid phase selector */}
              <div className="flex gap-2">
                {(["bolus", "maintenance", "transition"] as const).map(p => (
                  <button
                    key={p}
                    onClick={() => setFluidPhase(p)}
                    className={`text-xs px-2 py-1 rounded border transition ${
                      fluidPhase === p
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border hover:bg-muted text-muted-foreground"
                    }`}
                  >
                    {p === "bolus" ? "Bolus" : p === "maintenance" ? "Maintenance" : "Transition"}
                  </button>
                ))}
              </div>

              <div className="text-xs space-y-2">
                <p><span className="text-muted-foreground">Fluids:</span> {fluids.recommendation}</p>
                <p><span className="text-muted-foreground">Insulin bolus:</span> {insulin.bolus}</p>
                <p><span className="text-muted-foreground">Insulin infusion:</span> {insulin.infusion}</p>
                <p className="text-muted-foreground italic">{insulin.notes}</p>
              </div>
            </CardContent>
          </Card>

          {/* Potassium */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Droplets className="h-4 w-4 text-primary" />
                <CardTitle className="text-sm">Potassium Replacement</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 text-xs">
              <p><span className="text-muted-foreground">Action:</span> {kReplacement.action}</p>
              <p><span className="text-muted-foreground">Rate:</span> {kReplacement.rate}</p>
              <p className="text-muted-foreground italic">{kReplacement.caution}</p>
            </CardContent>
          </Card>

          {/* Euglycemic DKA alert */}
          {euglycemic.suspect && (
            <Card className="border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-orange-500/5">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  <CardTitle className="text-sm text-warning">Euglycemic DKA Suspected (SGLT2i)</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="text-xs">
                <p>{euglycemic.management}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* ─── Red Flags ─── */}
      {redFlags.length > 0 && (
        <Card className="border-red-500/30 bg-gradient-to-br from-red-500/10 to-rose-500/5">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <CardTitle className="text-sm text-destructive">Red Flags</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1">
              {redFlags.map((f, i) => (
                <li key={i} className="text-xs flex gap-2">
                  <span className="text-destructive shrink-0">•</span>
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* ─── Algorithm Images ─── */}
      <Collapsible defaultOpen={true} className="group/collapsible">
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="pb-2 cursor-pointer hover:bg-muted/30 transition-colors">
              <div className="flex items-center gap-2">
                <Image className="h-4 w-4 text-primary" />
                <CardTitle className="text-sm">Clinical Algorithm Flowcharts</CardTitle>
                <ChevronDown className="h-4 w-4 ml-auto text-muted-foreground transition-transform group-data-[state=open]/collapsible:rotate-180" />
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-0">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-foreground">DKA Algorithm</p>
                  <ImageLink imageId="dka-algorithm" label="View DKA Algorithm →" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-foreground">HHS Algorithm</p>
                  <ImageLink imageId="hhs-algorithm" label="View HHS Algorithm →" />
                </div>
                <div className="space-y-1 sm:col-span-2 lg:col-span-1">
                  <p className="text-xs font-semibold text-foreground">Mixed DKA + HHS Algorithm</p>
                  <ImageLink imageId="mixed-dka-hhs-algorithm" label="View Mixed DKA/HHS Algorithm →" />
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* ─── Diagnostic Criteria + Management Pathway ─── */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <FlaskConical className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm">Diagnostic Criteria &amp; Management Pathway</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* DKA Criteria */}
          <div>
            <h4 className="text-xs font-semibold mb-2 flex items-center gap-1.5">
              <span className="text-destructive">DKA Criteria</span>
              {dka.severity && <Badge className="text-[10px] h-5 bg-destructive/15 text-destructive border-destructive/30">Met</Badge>}
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
              <div className={`rounded-md border p-2 ${dkaCriteria.hyperglycemia ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-border'}`}>
                <div className="flex items-center gap-1 mb-1">
                  <span className={dkaCriteria.hyperglycemia ? 'text-emerald-400' : 'text-muted-foreground'}>{dkaCriteria.hyperglycemia ? '✓' : '○'}</span>
                  <span className="font-medium">Hyperglycemia</span>
                </div>
                <p className="text-muted-foreground">Glucose &gt;200 mg/dL <span className="text-foreground">or</span> known diabetes</p>
                {n(glucose) > 0 && <p className="text-foreground mt-1">Current: {glucose} mg/dL</p>}
              </div>
              <div className={`rounded-md border p-2 ${dkaCriteria.ketosis ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-border'}`}>
                <div className="flex items-center gap-1 mb-1">
                  <span className={dkaCriteria.ketosis ? 'text-emerald-400' : 'text-muted-foreground'}>{dkaCriteria.ketosis ? '✓' : '○'}</span>
                  <span className="font-medium">Ketosis</span>
                </div>
                <p className="text-muted-foreground">β-OHB ≥3.0 mmol/L <span className="text-foreground">or</span> urine ketones ≥2+</p>
                {betaOHB && <p className="text-foreground mt-1">β-OHB: {betaOHB} mmol/L</p>}
              </div>
              <div className={`rounded-md border p-2 ${dkaCriteria.acidosis ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-border'}`}>
                <div className="flex items-center gap-1 mb-1">
                  <span className={dkaCriteria.acidosis ? 'text-emerald-400' : 'text-muted-foreground'}>{dkaCriteria.acidosis ? '✓' : '○'}</span>
                  <span className="font-medium">Acidosis</span>
                </div>
                <p className="text-muted-foreground">pH &lt;7.3 <span className="text-foreground">or</span> HCO₃⁻ &lt;18 mmol/L</p>
                {ph && <p className="text-foreground mt-1">pH: {ph}</p>}
                {bicarb && <p className="text-foreground">HCO₃⁻: {bicarb} mmol/L</p>}
              </div>
            </div>
          </div>

          {/* HHS Criteria */}
          <div>
            <h4 className="text-xs font-semibold mb-2 flex items-center gap-1.5">
              <span className="text-amber-500">HHS Criteria</span>
              {hhs.isHHS && <Badge className="text-[10px] h-5 bg-amber-500/15 text-amber-500 border-amber-500/30">Met</Badge>}
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-xs">
              <div className={`rounded-md border p-2 ${hhsCriteria.hyperglycemia ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-border'}`}>
                <div className="flex items-center gap-1 mb-1">
                  <span className={hhsCriteria.hyperglycemia ? 'text-emerald-400' : 'text-muted-foreground'}>{hhsCriteria.hyperglycemia ? '✓' : '○'}</span>
                  <span className="font-medium">Glucose &gt;600</span>
                </div>
                {n(glucose) > 0 && <p className="text-foreground">Current: {glucose} mg/dL</p>}
              </div>
              <div className={`rounded-md border p-2 ${hhsCriteria.hyperosmolality ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-border'}`}>
                <div className="flex items-center gap-1 mb-1">
                  <span className={hhsCriteria.hyperosmolality ? 'text-emerald-400' : 'text-muted-foreground'}>{hhsCriteria.hyperosmolality ? '✓' : '○'}</span>
                  <span className="font-medium">Hyperosmolality</span>
                </div>
                <p className="text-muted-foreground">Eff. Osm &gt;300 <span className="text-foreground">or</span> Total Osm &gt;320</p>
                {osm !== null && <p className="text-foreground mt-1">Osm: {osm.toFixed(0)} mOsm/kg</p>}
              </div>
              <div className={`rounded-md border p-2 ${hhsCriteria.noKetosis ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-border'}`}>
                <div className="flex items-center gap-1 mb-1">
                  <span className={hhsCriteria.noKetosis ? 'text-emerald-400' : 'text-muted-foreground'}>{hhsCriteria.noKetosis ? '✓' : '○'}</span>
                  <span className="font-medium">No Ketosis</span>
                </div>
                <p className="text-muted-foreground">β-OHB &lt;3.0 <span className="text-foreground">or</span> urine ketones &lt;2+</p>
                {betaOHB && <p className="text-foreground mt-1">β-OHB: {betaOHB} mmol/L</p>}
              </div>
              <div className={`rounded-md border p-2 ${hhsCriteria.noAcidosis ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-border'}`}>
                <div className="flex items-center gap-1 mb-1">
                  <span className={hhsCriteria.noAcidosis ? 'text-emerald-400' : 'text-muted-foreground'}>{hhsCriteria.noAcidosis ? '✓' : '○'}</span>
                  <span className="font-medium">No Acidosis</span>
                </div>
                <p className="text-muted-foreground">pH ≥7.3 <span className="text-foreground">and</span> HCO₃⁻ ≥18</p>
                {ph && <p className="text-foreground mt-1">pH: {ph}</p>}
                {bicarb && <p className="text-foreground">HCO₃⁻: {bicarb} mmol/L</p>}
              </div>
            </div>
          </div>

          {/* Management Pathway */}
          <div className="border-t border-border pt-3">
            <h4 className="text-xs font-semibold mb-2 flex items-center gap-1.5">
              <Syringe className="h-3.5 w-3.5 text-primary" />
              Management Pathway
            </h4>
            <p className="text-xs leading-relaxed">{overlap.management}</p>
          </div>
        </CardContent>
      </Card>

      {/* ─── Trigger Workup ─── */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <HeartPulse className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm">Trigger Workup</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 sm:grid-cols-2">
            {TRIGGERS.filter(t => {
              if (t.id === "pregnancy" && !pregnancy) return false;
              return true;
            }).map(t => (
              <div key={t.id} className="rounded-md border border-border p-3 space-y-1">
                <div className="text-xs font-semibold">{t.label}</div>
                <div className="text-xs text-muted-foreground">
                  <span className="text-foreground">Investigations:</span> {t.investigations.join("; ")}
                </div>
                <div className="text-xs text-muted-foreground">
                  <span className="text-foreground">Management:</span> {t.management}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ─── Summary actions ─── */}
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="outline" onClick={handleCopy}>
          <Copy className="h-4 w-4 mr-1" /> Copy Summary
        </Button>
        <Button size="sm" variant="outline" onClick={handlePrint}>
          <Printer className="h-4 w-4 mr-1" /> Print
        </Button>
        <Button size="sm" variant="outline" onClick={() => {
          downloadTextFile("hyperglycemic-emergency", buildSummary());
        }}>
          <Download className="h-4 w-4 mr-1" /> Download
        </Button>
      </div>
    </div>
  );
}
