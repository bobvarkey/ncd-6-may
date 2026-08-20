import React, { useEffect, useMemo, useState } from "react";
import { calculateEGFR } from "@/lib/patient-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { SmartLabelUpload, DIABETES_FIELDS, HTN_FIELDS, LIPID_FIELDS, OBESITY_FIELDS, RENAL_FIELDS } from "@/components/SmartLabelUpload";
import KDIGOStagingCalculator from "@/calculators/renal/KDIGOStagingCalculator";
import {
  Activity,
  Heart,
  Droplet,
  Scale,
  Stethoscope,
  Sparkles,
  Copy,
  CheckCircle,
  XCircle,
  Printer,
  Download,
  RotateCcw,
  Target,
  ListChecks,
  AlertTriangle,
  Upload,
  ChevronDown,
} from "lucide-react";
import { downloadTextFile, copyToClipboard } from "@/lib/clinical-utils";

/* =====================================================================
 * Unified Prescription Mini App
 * Single-page, client-side decision support across NCD domains.
 * - Domain picker drives context-aware field hiding
 * - Each numeric field supports range OR exact entry
 * - Plan is computed locally; Copy + Print(PDF) buttons emit a 1-page summary
 * ===================================================================== */

type Domain = "diabetes" | "hypertension" | "lipids" | "obesity" | "ckd";

type Sex = "male" | "female";

interface Inputs {
  // demographics (always)
  age: string;
  sex: Sex;
  // diabetes
  a1c: string;
  fpg: string;
  ppg: string;
  dmAscvd: boolean;
  dmHf: boolean;
  dmCkd: boolean;
  // hypertension
  sbp: string;
  dbp: string;
  htnAscvd: boolean;
  htnDm: boolean;
  htnCkd: boolean;
  // lipids
  ldl: string;
  hdl: string;
  tg: string;
  hsCrp: string;
  lipAscvd: boolean;
  lipDm: boolean;
  // obesity
  bmi: string;
  waist: string;
  obDm: boolean;
  obOsa: boolean;
  obNafld: boolean;
  // ckd
  egfr: string;
  creatinine: string;
  uacr: string;
  ckdDm: boolean;
  ckdHtn: boolean;
}

const DEFAULTS: Inputs = {
  age: "",
  sex: "male",
  a1c: "",
  fpg: "",
  ppg: "",
  dmAscvd: false,
  dmHf: false,
  dmCkd: false,
  sbp: "",
  dbp: "",
  htnAscvd: false,
  htnDm: false,
  htnCkd: false,
  ldl: "",
  hdl: "",
  tg: "",
  hsCrp: "",
  lipAscvd: false,
  lipDm: false,
  bmi: "",
  waist: "",
  obDm: false,
  obOsa: false,
  obNafld: false,
  egfr: "",
  creatinine: "",
  uacr: "",
  ckdDm: false,
  ckdHtn: false,
};

/* ---------- Range presets per field (midpoint used by the engine) ---------- */
interface RangeOpt {
  label: string;
  mid: number;
}
const RANGES: Record<string, RangeOpt[]> = {
  age: [
    { label: "<40", mid: 35 },
    { label: "40–54", mid: 47 },
    { label: "55–64", mid: 60 },
    { label: "65–74", mid: 70 },
    { label: "≥75", mid: 80 },
  ],
  a1c: [
    { label: "<6.5%", mid: 6.2 },
    { label: "6.5–6.9%", mid: 6.7 },
    { label: "7.0–7.9%", mid: 7.4 },
    { label: "8.0–8.9%", mid: 8.4 },
    { label: "9.0–9.9%", mid: 9.4 },
    { label: "≥10%", mid: 10.5 },
  ],
  fpg: [
    { label: "<100", mid: 90 },
    { label: "100–125", mid: 112 },
    { label: "126–179", mid: 150 },
    { label: "180–249", mid: 215 },
    { label: "≥250", mid: 275 },
  ],
  ppg: [
    { label: "<140", mid: 130 },
    { label: "140–179", mid: 160 },
    { label: "180–249", mid: 215 },
    { label: "≥250", mid: 275 },
  ],
  sbp: [
    { label: "<120", mid: 115 },
    { label: "120–129", mid: 125 },
    { label: "130–139", mid: 135 },
    { label: "140–159", mid: 150 },
    { label: "160–179", mid: 170 },
    { label: "≥180", mid: 185 },
  ],
  dbp: [
    { label: "<80", mid: 75 },
    { label: "80–89", mid: 85 },
    { label: "90–99", mid: 95 },
    { label: "≥100", mid: 105 },
  ],
  ldl: [
    { label: "<55", mid: 50 },
    { label: "55–69", mid: 62 },
    { label: "70–99", mid: 85 },
    { label: "100–129", mid: 115 },
    { label: "130–159", mid: 145 },
    { label: "160–189", mid: 175 },
    { label: "≥190", mid: 200 },
  ],
  hdl: [
    { label: "<40", mid: 35 },
    { label: "40–59", mid: 50 },
    { label: "≥60", mid: 65 },
  ],
  tg: [
    { label: "<150", mid: 120 },
    { label: "150–199", mid: 175 },
    { label: "200–499", mid: 350 },
    { label: "500–999", mid: 700 },
    { label: "≥1000", mid: 1200 },
  ],
  hsCrp: [
    { label: "<1", mid: 0.6 },
    { label: "1–2", mid: 1.5 },
    { label: ">2–3", mid: 2.5 },
    { label: ">3", mid: 4 },
  ],
  bmi: [
    { label: "<23", mid: 21 },
    { label: "23–24.9", mid: 24 },
    { label: "25–29.9", mid: 27 },
    { label: "30–34.9", mid: 32 },
    { label: "≥35", mid: 37 },
  ],
  waist: [
    { label: "<90 (M) / <80 (F)", mid: 85 },
    { label: "90–99 / 80–89", mid: 95 },
    { label: "≥100 / ≥90", mid: 105 },
  ],
  egfr: [
    { label: "≥90", mid: 100 },
    { label: "60–89", mid: 75 },
    { label: "45–59", mid: 52 },
    { label: "30–44", mid: 37 },
    { label: "15–29", mid: 22 },
    { label: "<15", mid: 10 },
  ],
  uacr: [
    { label: "<30", mid: 15 },
    { label: "30–300", mid: 150 },
    { label: ">300", mid: 500 },
  ],
};

/* ---------- Reusable field: range OR exact entry ---------- */
function RangeOrExactField({
  label,
  unit,
  fieldKey,
  value,
  onChange,
}: {
  label: string;
  unit?: string;
  fieldKey: keyof typeof RANGES;
  value: string;
  onChange: (v: string) => void;
}) {
  const [mode, setMode] = useState<"range" | "exact">("range");
  const opts = RANGES[fieldKey] || [];

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label className="text-xs text-muted-foreground">
          {label} {unit ? <span className="text-xs">({unit})</span> : null}
        </Label>
        <button
          type="button"
          onClick={() => setMode(mode === "range" ? "exact" : "range")}
          className="text-xs text-primary hover:underline"
        >
          {mode === "range" ? "exact" : "range"}
        </button>
      </div>

      {mode === "range" ? (
        <Select
          value={value}
          onValueChange={(v) => {
            const opt = opts.find((o) => o.label === v);
            onChange(opt ? String(opt.mid) : v);
          }}
        >
          <SelectTrigger className="h-9 text-xs">
            <SelectValue placeholder="Select range">
              {(() => {
                const cur = opts.find((o) => String(o.mid) === value);
                return cur ? cur.label : value || "Select range";
              })()}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {opts.map((o) => (
              <SelectItem key={o.label} value={o.label} className="text-xs">
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <Input
          type="number"
          inputMode="decimal"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={`Exact ${unit || ""}`.trim()}
          className="h-9 text-xs"
        />
      )}
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-2.5 py-1 rounded-full text-xs border transition ${
        active
          ? "bg-primary text-primary-foreground border-primary"
          : "bg-card text-foreground/80 border-border hover:border-primary/50"
      }`}
    >
      {children}
    </button>
  );
}

/* ---------- Domain meta ---------- */
const DOMAINS: { id: Domain; label: string; icon: React.ReactNode }[] = [
  { id: "diabetes", label: "Diabetes", icon: <Droplet className="h-3.5 w-3.5" /> },
  { id: "hypertension", label: "Hypertension", icon: <Activity className="h-3.5 w-3.5" /> },
  { id: "lipids", label: "Lipids", icon: <Heart className="h-3.5 w-3.5" /> },
  { id: "obesity", label: "Obesity", icon: <Scale className="h-3.5 w-3.5" /> },
  { id: "ckd", label: "CKD / Renal", icon: <Stethoscope className="h-3.5 w-3.5" /> },
];

/* ---------- Result shape ---------- */
interface Result {
  domain: string;
  classification: string;
  targets: string[];
  plan: string[];
  followUp: string;
  alerts: string[];
}

const n = (s: string) => {
  const v = parseFloat(s);
  return isNaN(v) ? undefined : v;
};

/* ---------- Engines ---------- */
function diabetesPlan(i: Inputs): Result {
  const a1c = n(i.a1c);
  const fpg = n(i.fpg);
  const age = n(i.age) ?? 50;
  const high = (a1c ?? 0) >= 9 || (fpg ?? 0) >= 250;
  const veryFrail = age >= 75;

  let cls = "Type 2 DM — standard control";
  if (high) cls = "Type 2 DM — markedly uncontrolled";
  else if ((a1c ?? 0) >= 7.5) cls = "Type 2 DM — above target";
  else if ((a1c ?? 0) > 0 && (a1c ?? 0) < 7) cls = "Type 2 DM — at goal";

  const a1cTarget = veryFrail ? "<8.0%" : i.dmCkd ? "<7.5%" : "<7.0%";
  const targets = [
    `HbA1c ${a1cTarget}`,
    "FPG 80–130 mg/dL",
    "Post-prandial <180 mg/dL",
    "BP <130/80 mmHg if tolerated",
  ];

  const plan: string[] = ["Lifestyle: Mediterranean / low-GI diet, 150 min/wk MVPA, weight loss 5–10%."];
  plan.push("Metformin first-line unless contraindicated (titrate to 1–2 g/day).");

  if (i.dmAscvd) plan.push("Add GLP-1 RA (semaglutide / liraglutide) for ASCVD benefit.");
  if (i.dmHf) plan.push("Add SGLT2i (empagliflozin/dapagliflozin) for HF benefit, regardless of A1c.");
  if (i.dmCkd) plan.push("Add SGLT2i if eGFR ≥20; consider finerenone if albuminuria persists.");
  if (high) plan.push("Consider basal insulin titration (10 U/day or 0.1–0.2 U/kg, titrate by 2 U every 3 days).");
  if ((a1c ?? 0) >= 7.5 && !i.dmAscvd && !i.dmHf) plan.push("Add second agent (SGLT2i, GLP-1 RA, DPP-4i, or SU) based on weight/cost.");

  const alerts: string[] = [];
  if (high) alerts.push("Rule out DKA / HHS if symptomatic; check ketones, anion gap.");
  if (veryFrail) alerts.push("Avoid SU/glinide — hypoglycemia risk in elderly.");

  return {
    domain: "Diabetes (T2DM)",
    classification: cls,
    targets,
    plan,
    followUp: high ? "Review in 1–2 weeks, A1c at 3 months." : "Review at 3 months with A1c.",
    alerts,
  };
}

function hypertensionPlan(i: Inputs): Result {
  const sbp = n(i.sbp) ?? 0;
  const dbp = n(i.dbp) ?? 0;
  const age = n(i.age) ?? 50;
  let stage = "Normal";
  if (sbp >= 180 || dbp >= 110) stage = "Hypertensive crisis";
  else if (sbp >= 140 || dbp >= 90) stage = "Stage 2 HTN";
  else if (sbp >= 130 || dbp >= 80) stage = "Stage 1 HTN";
  else if (sbp >= 120) stage = "Elevated BP";

  const target = i.htnDm || i.htnCkd || i.htnAscvd ? "<130/80 mmHg" : age >= 65 ? "<140/80 mmHg" : "<130/80 mmHg";

  const plan: string[] = ["Lifestyle: DASH diet, Na <2 g/d, weight loss, alcohol limit, regular aerobic exercise."];
  if (sbp >= 140 || dbp >= 90) {
    plan.push("Start dual therapy: ACEi/ARB + CCB (e.g., telmisartan 40 mg + amlodipine 5 mg).");
  } else if (sbp >= 130) {
    plan.push("Start single-agent ACEi/ARB; reassess at 4 weeks.");
  }
  if (i.htnDm) plan.push("Prefer ACEi/ARB first-line (reno-protective in DM).");
  if (i.htnCkd) plan.push("ACEi/ARB recommended; avoid in bilateral RAS; monitor K+ and creatinine.");
  if (i.htnAscvd) plan.push("Add beta-blocker if post-MI or symptomatic CAD.");
  if (sbp >= 160) plan.push("Consider adding thiazide-like diuretic (chlorthalidone/indapamide) early.");

  const alerts: string[] = [];
  if (stage === "Hypertensive crisis") alerts.push("Assess for end-organ damage; if present → emergency referral.");

  return {
    domain: "Hypertension",
    classification: stage,
    targets: [`BP ${target}`, "Home BP avg <125/75", "Pulse 60–80 bpm if on β-blocker"],
    plan,
    followUp: stage.includes("crisis") ? "Immediate / 24–48 hrs" : "Recheck in 2–4 weeks.",
    alerts,
  };
}

function lipidsPlan(i: Inputs): Result {
  const ldl = n(i.ldl) ?? 0;
  const tg = n(i.tg) ?? 0;
  const hsCrp = n(i.hsCrp) ?? 0;
  let risk = "Low risk";
  if (i.lipAscvd) risk = "Very High Risk (secondary prevention / ASCVD)";
  else if (i.lipDm) risk = "High Risk (diabetes — primary prevention)";
  else if (ldl >= 190) risk = "High Risk (severe hypercholesterolemia)";
  else if (ldl >= 160) risk = "Moderate–High Risk";

  const ldlTarget = i.lipAscvd ? "<55 mg/dL (≥50% ↓)" : i.lipDm ? "<70 mg/dL" : ldl >= 190 ? "<100 mg/dL" : "<130 mg/dL";

  const plan: string[] = [
    "Lifestyle: Mediterranean / plant-forward diet, ≥150 min/wk MVPA, weight optimization, smoking cessation.",
  ];
  if (i.lipAscvd || i.lipDm || ldl >= 190) plan.push("High-intensity statin (atorvastatin 40–80 or rosuvastatin 20–40 mg).");
  else if (ldl >= 160) plan.push("Moderate-intensity statin (atorvastatin 10–20 or rosuvastatin 5–10 mg).");
  if (i.lipAscvd) plan.push("Add ezetimibe 10 mg if LDL above target after 4–6 weeks; consider PCSK9i if still not at goal.");
  if (tg >= 500) plan.push("Triglycerides ≥500 → fibrate / icosapent ethyl; pancreatitis prevention.");
  else if (tg >= 200 && i.lipAscvd) plan.push("Consider icosapent ethyl 2 g BID for residual ASCVD risk.");
  if (hsCrp > 2 && i.lipAscvd) plan.push("Residual inflammatory risk — consider colchicine 0.5 mg/d after risk/benefit.");

  const alerts: string[] = [];
  if (tg >= 1000) alerts.push("Severe hypertriglyceridemia — urgent pancreatitis prophylaxis.");

  return {
    domain: "Lipids",
    classification: risk,
    targets: [`LDL-C ${ldlTarget}`, "Non-HDL-C <100 mg/dL (VHR <85)", "Apo-B <80 mg/dL (VHR <65)"],
    plan,
    followUp: "Lipid panel + LFT at 6–12 weeks after initiation/dose change.",
    alerts,
  };
}

function obesityPlan(i: Inputs): Result {
  const bmi = n(i.bmi) ?? 0;
  let cls = "Normal";
  if (bmi >= 35) cls = "Class II–III Obesity";
  else if (bmi >= 30) cls = "Class I Obesity";
  else if (bmi >= 25) cls = "Overweight";
  else if (bmi >= 23) cls = "Asian overweight";

  const plan: string[] = [
    "Lifestyle: 500–750 kcal/d deficit, ≥150 min/wk MVPA, behavioral support.",
  ];
  if (bmi >= 27 && (i.obDm || i.obOsa || i.obNafld)) plan.push("Pharmacotherapy indicated (BMI ≥27 + comorbidity).");
  if (bmi >= 30) plan.push("Pharmacotherapy: GLP-1 RA (semaglutide 2.4 mg) or GIP/GLP-1 (tirzepatide).");
  if (bmi >= 35 && (i.obDm || i.obOsa)) plan.push("Bariatric surgery referral (BMI ≥35 + comorbidity, or ≥40).");
  if (i.obNafld) plan.push("NAFLD: FIB-4, hepatology referral if FIB-4 >2.67; pioglitazone or GLP-1 RA.");
  if (i.obOsa) plan.push("Sleep study; CPAP if confirmed OSA.");

  const alerts: string[] = [];
  if (bmi >= 40) alerts.push("Class III obesity — multidisciplinary evaluation recommended.");

  return {
    domain: "Obesity",
    classification: cls,
    targets: ["≥5–10% weight loss at 6 months", "Waist <90 cm (M) / <80 cm (F)", "Improve comorbid markers"],
    plan,
    followUp: "Monthly during pharmacotherapy initiation; q3 mo maintenance.",
    alerts,
  };
}

function ckdPlan(i: Inputs): Result {
  const egfr = n(i.egfr) ?? 0;
  const uacr = n(i.uacr) ?? 0;
  let stage = "G1";
  if (egfr < 15) stage = "G5 (kidney failure)";
  else if (egfr < 30) stage = "G4";
  else if (egfr < 45) stage = "G3b";
  else if (egfr < 60) stage = "G3a";
  else if (egfr < 90) stage = "G2";
  let alb = "A1 (<30)";
  if (uacr > 300) alb = "A3 (>300)";
  else if (uacr >= 30) alb = "A2 (30–300)";

  const plan: string[] = [
    "Lifestyle: Na <2 g/d, protein 0.8 g/kg/d, BP control, smoking cessation.",
    "ACEi or ARB (titrate to max tolerated) if albuminuria or HTN.",
  ];
  if (egfr >= 20) plan.push("SGLT2i (dapagliflozin 10 mg) — reno-protective irrespective of DM.");
  if (uacr >= 30 && i.ckdDm) plan.push("Finerenone 10–20 mg if K+ <4.8 and eGFR ≥25.");
  if (stage.startsWith("G4") || stage.startsWith("G5")) plan.push("Nephrology referral; vaccinate (HBV, pneumococcus); avoid nephrotoxins.");
  if (stage === "G5 (kidney failure)") plan.push("Plan for RRT (dialysis access / transplant work-up).");

  const alerts: string[] = [];
  if (egfr < 30) alerts.push("Adjust drug doses for renal clearance; avoid metformin if eGFR <30.");

  return {
    domain: "CKD",
    classification: `KDIGO ${stage} / ${alb}`,
    targets: ["BP <130/80", "UACR reduction ≥30%", "K+ 3.5–5.0", "HbA1c ~7% if DM"],
    plan,
    followUp: egfr < 30 ? "Every 4–6 weeks." : "Every 3–6 months with eGFR + UACR.",
    alerts,
  };
}

const ENGINES: Record<Domain, (i: Inputs) => Result> = {
  diabetes: diabetesPlan,
  hypertension: hypertensionPlan,
  lipids: lipidsPlan,
  obesity: obesityPlan,
  ckd: ckdPlan,
};

/* ---------- Main component ---------- */
export default function UnifiedPrescriptionMiniApp() {
  const [domain, setDomain] = useState<Domain>("diabetes");
  const [inputs, setInputs] = useState<Inputs>(DEFAULTS);

  const set = <K extends keyof Inputs>(k: K, v: Inputs[K]) =>
    setInputs((p) => ({ ...p, [k]: v }));

  const parseFields = (values: Record<string, string>) => {
    const numericKeys = ["age", "a1c", "fpg", "ppg", "sbp", "dbp", "ldl", "hdl", "tg", "hsCrp", "bmi", "waist", "egfr", "uacr"] as const;
    const updates: Partial<Inputs> = {};
    Object.entries(values).forEach(([key, val]) => {
      if ((numericKeys as readonly string[]).includes(key)) {
        (updates as any)[key] = val;
      } else {
        (updates as any)[key] = val;
      }
    });
    setInputs((p) => ({ ...p, ...updates }));
  };

  // Auto-calculate eGFR from creatinine + age + sex (CKD-EPI 2021)
  useEffect(() => {
    const cr = parseFloat(inputs.creatinine);
    const ageNum = parseFloat(inputs.age);
    if (!isNaN(cr) && cr > 0 && !isNaN(ageNum) && ageNum > 0) {
      const gender = inputs.sex === "female" ? "F" : "M";
      const computed = calculateEGFR(cr, ageNum, gender);
      if (computed > 0 && String(computed) !== inputs.egfr) {
        setInputs((p) => ({ ...p, egfr: String(computed) }));
      }
    }
  }, [inputs.creatinine, inputs.age, inputs.sex]);

  const result = useMemo(() => ENGINES[domain](inputs), [domain, inputs]);

  const reset = () => setInputs(DEFAULTS);

  const summaryText = useMemo(() => {
    const lines: string[] = [];
    lines.push(`--- ${result.domain.toUpperCase()} ASSESSMENT ---`);
    lines.push(`Date: ${new Date().toLocaleDateString()}`);
    lines.push("");
    lines.push(`Patient: ${inputs.age || "—"}y, ${inputs.sex}`);
    lines.push(`Classification: ${result.classification}`);
    
    // Add specific parameters for context if available
    if (domain === "ckd" && inputs.egfr) {
      lines.push(`eGFR: ${inputs.egfr} mL/min/1.73m²`);
      if (inputs.uacr) lines.push(`UACR: ${inputs.uacr} mg/g`);
    } else if (domain === "diabetes") {
      if (inputs.a1c) lines.push(`HbA1c: ${inputs.a1c}%`);
    } else if (domain === "hypertension") {
      if (inputs.sbp && inputs.dbp) lines.push(`BP: ${inputs.sbp}/${inputs.dbp} mmHg`);
    }

    lines.push("");
    lines.push("TARGETS:");
    result.targets.forEach((t) => lines.push(`- ${t}`));
    
    lines.push("");
    lines.push("PLAN:");
    result.plan.forEach((p) => lines.push(`- ${p}`));
    
    if (result.alerts.length) {
      lines.push("");
      lines.push("ALERTS:");
      result.alerts.forEach((a) => lines.push(`! ${a}`));
    }
    
    lines.push("");
    lines.push(`FOLLOW-UP: ${result.followUp}`);
    return lines.join("\n");
  }, [inputs, result, domain]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(summaryText);
      toast({ title: "Summary copied", description: "Clinical summary copied to clipboard." });
    } catch {
      toast({ title: "Copy failed", description: "Clipboard unavailable.", variant: "destructive" });
    }
  };

  const handlePrint = () => {
    const w = window.open("", "_blank", "width=820,height=1000");
    if (!w) return;
    const esc = (s: string) =>
      s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    w.document.write(`<!doctype html><html><head><title>Prescription Summary — ${esc(
      result.domain
    )}</title>
<style>
  body{font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#111;margin:32px;line-height:1.45;}
  h1{font-size:18px;margin:0 0 4px;}
  h2{font-size:13px;margin:14px 0 6px;text-transform:uppercase;letter-spacing:.06em;color:#444;border-bottom:1px solid #ddd;padding-bottom:3px;}
  .meta{font-size:11px;color:#666;}
  ul{margin:4px 0 0 18px;padding:0;font-size:12px;}
  li{margin:2px 0;}
  .grid{display:grid;grid-template-columns:1fr 1fr;gap:14px;}
  .alert{color:#a00;}
  .footer{margin-top:18px;font-size:10px;color:#777;border-top:1px solid #eee;padding-top:8px;}
  @page{size:A4;margin:14mm;}
</style></head><body>
  <h1>Prescription Plan — ${esc(result.domain)}</h1>
  <div class="meta">${esc(new Date().toLocaleString())} · Age ${esc(inputs.age || "—")} · ${esc(inputs.sex)}</div>
  <h2>Classification</h2><div style="font-size:13px;font-weight:600;">${esc(result.classification)}</div>
  <div class="grid">
    <div><h2>Targets</h2><ul>${result.targets.map((t) => `<li>${esc(t)}</li>`).join("")}</ul></div>
    <div><h2>Plan</h2><ul>${result.plan.map((p) => `<li>${esc(p)}</li>`).join("")}</ul></div>
  </div>
  ${
    result.alerts.length
      ? `<h2>Alerts</h2><ul class="alert">${result.alerts
          .map((a) => `<li>${esc(a)}</li>`)
          .join("")}</ul>`
      : ""
  }
  <h2>Follow-up</h2><div style="font-size:12px;">${esc(result.followUp)}</div>
  <div class="footer">Generated by the NCD Prescription Engine. For clinician use; verify against current guidelines.</div>
  <script>window.onload=()=>{setTimeout(()=>window.print(),200);}</script>
</body></html>`);
    w.document.close();
  };

  return (
    <Card className="border-primary/30 bg-gradient-to-br from-card to-card/60">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          Unified Prescription Mini-App
          <Badge variant="outline" className="text-xs border-primary/30 text-primary">
            client-side
          </Badge>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-5">
        {/* Domain picker */}
        <div className="flex flex-wrap gap-2">
          {DOMAINS.map((d) => (
            <button
              key={d.id}
              onClick={() => setDomain(d.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs border transition ${
                domain === d.id
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-foreground/80 border-border hover:border-primary/50"
              }`}
            >
              {d.icon}
              {d.label}
            </button>
          ))}
        </div>

        {/* Demographics — always */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <RangeOrExactField
            label="Age"
            unit="yrs"
            fieldKey="age"
            value={inputs.age}
            onChange={(v) => set("age", v)}
          />
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Sex</Label>
            <div className="flex gap-2">
              <Chip active={inputs.sex === "male"} onClick={() => set("sex", "male")}>
                Male
              </Chip>
              <Chip active={inputs.sex === "female"} onClick={() => set("sex", "female")}>
                Female
              </Chip>
            </div>
          </div>
        </div>

        {/* Context-aware domain fields */}

        {/* ── Smart Lab Import ── */}
        <details className="group rounded-lg border border-border/60 bg-muted/10">
          <summary className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-muted-foreground cursor-pointer hover:text-foreground transition select-none">
            <Upload className="h-3.5 w-3.5" />
            Smart Lab Import
            <ChevronDown className="h-3 w-3 ml-auto transition-transform group-open:rotate-180" />
          </summary>
          <div className="px-3 pb-3 space-y-2">
            {domain === "obesity" && <SmartLabelUpload fields={OBESITY_FIELDS.fields} onParse={parseFields} existingValues={{}} />}
            {domain === "diabetes" && <SmartLabelUpload fields={DIABETES_FIELDS.fields} onParse={parseFields} existingValues={{}} />}
            {domain === "hypertension" && <SmartLabelUpload fields={HTN_FIELDS.fields} onParse={parseFields} existingValues={{}} />}
            {domain === "lipids" && <SmartLabelUpload fields={LIPID_FIELDS.fields} onParse={parseFields} existingValues={{}} />}
            {domain === "ckd" && <SmartLabelUpload fields={RENAL_FIELDS.fields} onParse={parseFields} existingValues={{}} />}
          </div>
        </details>

        {/* Domain-specific fields — collapsed by default */}
        {domain === "diabetes" && (
          <details className="group rounded-lg border border-border/60 bg-muted/10">
            <summary className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-muted-foreground cursor-pointer hover:text-foreground transition select-none">
              <Droplet className="h-3.5 w-3.5" />
              Diabetes Inputs
              <ChevronDown className="h-3 w-3 ml-auto transition-transform group-open:rotate-180" />
            </summary>
            <div className="px-3 pb-3 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <RangeOrExactField label="HbA1c" unit="%" fieldKey="a1c" value={inputs.a1c} onChange={(v) => set("a1c", v)} />
                <RangeOrExactField label="FPG" unit="mg/dL" fieldKey="fpg" value={inputs.fpg} onChange={(v) => set("fpg", v)} />
                <RangeOrExactField label="2-hr PPG" unit="mg/dL" fieldKey="ppg" value={inputs.ppg} onChange={(v) => set("ppg", v)} />
              </div>
              <div className="flex flex-wrap gap-2">
                <Chip active={inputs.dmAscvd} onClick={() => set("dmAscvd", !inputs.dmAscvd)}>ASCVD</Chip>
                <Chip active={inputs.dmHf} onClick={() => set("dmHf", !inputs.dmHf)}>Heart failure</Chip>
                <Chip active={inputs.dmCkd} onClick={() => set("dmCkd", !inputs.dmCkd)}>CKD</Chip>
              </div>
            </div>
          </details>
        )}

        {domain === "hypertension" && (
          <details className="group rounded-lg border border-border/60 bg-muted/10">
            <summary className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-muted-foreground cursor-pointer hover:text-foreground transition select-none">
              <Activity className="h-3.5 w-3.5" />
              Hypertension Inputs
              <ChevronDown className="h-3 w-3 ml-auto transition-transform group-open:rotate-180" />
            </summary>
            <div className="px-3 pb-3 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <RangeOrExactField label="SBP" unit="mmHg" fieldKey="sbp" value={inputs.sbp} onChange={(v) => set("sbp", v)} />
                <RangeOrExactField label="DBP" unit="mmHg" fieldKey="dbp" value={inputs.dbp} onChange={(v) => set("dbp", v)} />
              </div>
              <div className="flex flex-wrap gap-2">
                <Chip active={inputs.htnAscvd} onClick={() => set("htnAscvd", !inputs.htnAscvd)}>ASCVD</Chip>
                <Chip active={inputs.htnDm} onClick={() => set("htnDm", !inputs.htnDm)}>Diabetes</Chip>
                <Chip active={inputs.htnCkd} onClick={() => set("htnCkd", !inputs.htnCkd)}>CKD</Chip>
              </div>
            </div>
          </details>
        )}

        {domain === "lipids" && (
          <details className="group rounded-lg border border-border/60 bg-muted/10">
            <summary className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-muted-foreground cursor-pointer hover:text-foreground transition select-none">
              <Heart className="h-3.5 w-3.5" />
              Lipids Inputs
              <ChevronDown className="h-3 w-3 ml-auto transition-transform group-open:rotate-180" />
            </summary>
            <div className="px-3 pb-3 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <RangeOrExactField label="LDL-C" unit="mg/dL" fieldKey="ldl" value={inputs.ldl} onChange={(v) => set("ldl", v)} />
                <RangeOrExactField label="HDL-C" unit="mg/dL" fieldKey="hdl" value={inputs.hdl} onChange={(v) => set("hdl", v)} />
                <RangeOrExactField label="Triglycerides" unit="mg/dL" fieldKey="tg" value={inputs.tg} onChange={(v) => set("tg", v)} />
                <RangeOrExactField label="hsCRP" unit="mg/L" fieldKey="hsCrp" value={inputs.hsCrp} onChange={(v) => set("hsCrp", v)} />
              </div>
              <div className="flex flex-wrap gap-2">
                <Chip active={inputs.lipAscvd} onClick={() => set("lipAscvd", !inputs.lipAscvd)}>Established ASCVD</Chip>
                <Chip active={inputs.lipDm} onClick={() => set("lipDm", !inputs.lipDm)}>Diabetes</Chip>
              </div>
            </div>
          </details>
        )}

        {domain === "obesity" && (
          <details className="group rounded-lg border border-border/60 bg-muted/10">
            <summary className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-muted-foreground cursor-pointer hover:text-foreground transition select-none">
              <Scale className="h-3.5 w-3.5" />
              Obesity Inputs
              <ChevronDown className="h-3 w-3 ml-auto transition-transform group-open:rotate-180" />
            </summary>
            <div className="px-3 pb-3 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <RangeOrExactField label="BMI" unit="kg/m²" fieldKey="bmi" value={inputs.bmi} onChange={(v) => set("bmi", v)} />
                <RangeOrExactField label="Waist" unit="cm" fieldKey="waist" value={inputs.waist} onChange={(v) => set("waist", v)} />
              </div>
              <div className="flex flex-wrap gap-2">
                <Chip active={inputs.obDm} onClick={() => set("obDm", !inputs.obDm)}>Diabetes</Chip>
                <Chip active={inputs.obOsa} onClick={() => set("obOsa", !inputs.obOsa)}>OSA</Chip>
                <Chip active={inputs.obNafld} onClick={() => set("obNafld", !inputs.obNafld)}>NAFLD / MASLD</Chip>
              </div>
            </div>
          </details>
        )}

        {domain === "ckd" && (
          <>
            {/* eGFR + UACR Calculator at top of CKD section */}
            <KDIGOStagingCalculator />

            <details className="group rounded-lg border border-border/60 bg-muted/10">
            <summary className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-muted-foreground cursor-pointer hover:text-foreground transition select-none">
              <Stethoscope className="h-3.5 w-3.5" />
              CKD / Renal Inputs
              <ChevronDown className="h-3 w-3 ml-auto transition-transform group-open:rotate-180" />
            </summary>
            <div className="px-3 pb-3 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <RangeOrExactField label="eGFR" unit="mL/min/1.73m²" fieldKey="egfr" value={inputs.egfr} onChange={(v) => set("egfr", v)} />
                  {inputs.egfr && (() => {
                    const e = parseFloat(inputs.egfr);
                    if (isNaN(e)) return null;
                    let stage = "G1";
                    if (e < 15) stage = "G5";
                    else if (e < 30) stage = "G4";
                    else if (e < 45) stage = "G3b";
                    else if (e < 60) stage = "G3a";
                    else if (e < 90) stage = "G2";
                    const colors: Record<string, string> = {
                      "G1": "bg-green-100 text-green-800 border-green-300",
                      "G2": "bg-yellow-100 text-yellow-800 border-yellow-300",
                      "G3a": "bg-orange-100 text-orange-800 border-orange-300",
                      "G3b": "bg-red-100 text-red-800 border-red-300",
                      "G4": "bg-red-200 text-red-900 border-red-400",
                      "G5": "bg-purple-100 text-purple-800 border-purple-300",
                    };
                    return (
                      <div className="flex items-center gap-1.5 mt-1 select-all">
                        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full border ${colors[stage] || "bg-muted text-muted-foreground border-border"}`}>
                          KDIGO {stage}
                        </span>
                      </div>
                    );
                  })()}
                </div>
                <RangeOrExactField label="UACR" unit="mg/g" fieldKey="uacr" value={inputs.uacr} onChange={(v) => set("uacr", v)} />
              </div>
              <div className="flex flex-wrap gap-2">
                <Chip active={inputs.ckdDm} onClick={() => set("ckdDm", !inputs.ckdDm)}>Diabetes</Chip>
                <Chip active={inputs.ckdHtn} onClick={() => set("ckdHtn", !inputs.ckdHtn)}>Hypertension</Chip>
              </div>
            </div>
          </details>
          </>
        )}

        {/* Result panel */}
        <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-3">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground">
                Computed plan — {result.domain}
              </div>
              <div className="text-sm font-semibold mt-0.5">{result.classification}</div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={() => copyToClipboard(summaryText, "Summary")} className="h-8 text-xs">
                <Copy className="h-3.5 w-3.5 mr-1" /> Copy results
              </Button>
              <Button size="sm" variant="outline" onClick={() => downloadTextFile(`prescription-${new Date().toISOString().slice(0,10)}`, summaryText)} className="h-8 text-xs">
                <Download className="h-3.5 w-3.5 mr-1" /> Download report
              </Button>
              <Button size="sm" variant="outline" onClick={handlePrint} className="h-8 text-xs">
                <Printer className="h-3.5 w-3.5 mr-1" /> Print / PDF
              </Button>
              <Button size="sm" variant="ghost" onClick={reset} className="h-8 text-xs">
                <RotateCcw className="h-3.5 w-3.5 mr-1" /> Reset
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-muted-foreground mb-1.5">
                <Target className="h-3 w-3" /> Targets
              </div>
              <ul className="text-xs space-y-1 list-disc pl-4">
                {result.targets.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-muted-foreground mb-1.5">
                <ListChecks className="h-3 w-3" /> Plan
              </div>
              <ul className="text-xs space-y-1 list-disc pl-4">
                {result.plan.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            </div>
          </div>

          {result.alerts.length > 0 && (
            <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-2.5">
              <div className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-destructive mb-1">
                <AlertTriangle className="h-3 w-3" /> Alerts
              </div>
              <ul className="text-xs space-y-1 list-disc pl-4 text-destructive">
                {result.alerts.map((a) => (
                  <li key={a}>{a}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="text-xs text-muted-foreground italic">
            Follow-up: {result.followUp}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
