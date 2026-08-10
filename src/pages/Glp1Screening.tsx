import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Syringe, Eye, Home, Printer, Copy, AlertTriangle, CheckCircle2, Info, ShieldAlert } from "lucide-react";
import Seo from "@/components/Seo";
import { copyToClipboard, downloadTextFile } from "@/lib/clinical-utils";
import OpticNerveAssessment from "@/calculators/obesity/OpticNerveAssessment";

/* ---------------------------------- data ---------------------------------- */

const AGENTS = [
  { id: "semaglutide", label: "Semaglutide" },
  { id: "tirzepatide", label: "Tirzepatide" },
  { id: "liraglutide", label: "Liraglutide" },
  { id: "dulaglutide", label: "Dulaglutide" },
] as const;

const INDICATIONS = [
  "Type 2 diabetes",
  "Chronic weight management",
  "Cardiometabolic risk reduction",
  "Other approved local indication",
] as const;

const WEIGHT_COMORBIDITIES = [
  "Type 2 diabetes",
  "Hypertension",
  "Dyslipidaemia",
  "Obstructive sleep apnoea",
  "Established cardiovascular disease",
  "Metabolic dysfunction-associated steatotic liver disease",
  "Osteoarthritis / mobility-limiting obesity complication",
] as const;

const GI_OPTIONS = [
  "Known gastroparesis",
  "Severe GI motility disorder",
  "Persistent vomiting / dehydration",
  "Inflammatory bowel disease flare",
  "None known",
] as const;

const RENAL_OPTIONS = [
  "eGFR below 30 mL/min/1.73m2",
  "Recent acute kidney injury",
  "Loop diuretic use",
  "Recurrent vomiting or poor oral intake",
  "None known",
] as const;

const RETINOPATHY = [
  "No known retinopathy",
  "Mild/moderate NPDR",
  "Severe NPDR",
  "Proliferative DR",
  "Diabetic macular oedema",
  "Unknown / not assessed",
] as const;

const RETINOPATHY_TREATMENT = [
  "Anti-VEGF treatment",
  "Retinal laser treatment",
  "Vitrectomy",
  "Under active retinal follow-up",
  "None",
] as const;

const VISUAL_RED_FLAGS = [
  "Sudden painless visual loss",
  "New visual-field defect",
  "Acute unilateral colour desaturation",
  "New flashes or floaters",
  "Distortion / metamorphopsia",
  "None",
] as const;

const OTHER_EYE_DISEASE = [
  "Glaucoma or glaucoma suspect",
  "Macular degeneration",
  "Optic neuropathy / disc disease",
  "No relevant history",
] as const;

const NUTRITION_TESTS = [
  "Vitamin B12",
  "25-OH vitamin D",
  "Ferritin / iron studies",
  "Folate",
  "Albumin / nutrition assessment",
] as const;

const COUNSELLING = [
  "Expected GI effects (nausea, vomiting, constipation) and how to manage them",
  "Slow titration; do not double doses; missed-dose rules for the chosen product",
  "Injection technique, site rotation, storage and sharps disposal",
  "Hydration and sick-day rules; stop and seek advice with persistent vomiting",
  "Severe abdominal pain radiating to the back → stop drug, seek urgent review (pancreatitis)",
  "Sudden painless visual loss or new field defect → same-day eye assessment",
  "Contraception advice; stop before planned pregnancy per product label",
  "Diet quality, protein intake and resistance activity to preserve lean mass",
  "Anaesthetic/endoscopy teams must be told about GLP-1 use (retained gastric contents)",
];

type YN = "yes" | "no";
type YNU = "yes" | "no" | "unknown";
type Outcome =
  | "NOT_ELIGIBLE"
  | "DO_NOT_START"
  | "DEFER_AND_REVIEW"
  | "START_WITH_PRECAUTIONS"
  | "ELIGIBLE_PENDING_CLINICIAN_REVIEW";

const OUTCOME_META: Record<Outcome, { label: string; cls: string; Icon: typeof AlertTriangle }> = {
  DO_NOT_START: { label: "Do not start", cls: "border-destructive/40 bg-destructive/10 text-destructive", Icon: ShieldAlert },
  NOT_ELIGIBLE: { label: "Not eligible (indication threshold)", cls: "border-destructive/40 bg-destructive/10 text-destructive", Icon: AlertTriangle },
  DEFER_AND_REVIEW: { label: "Defer and review", cls: "border-amber-500/40 bg-amber-500/10 text-amber-600", Icon: AlertTriangle },
  START_WITH_PRECAUTIONS: { label: "Start with precautions", cls: "border-amber-500/40 bg-amber-500/10 text-amber-600", Icon: Info },
  ELIGIBLE_PENDING_CLINICIAN_REVIEW: { label: "Eligible — pending clinician review", cls: "border-emerald-500/40 bg-emerald-500/10 text-emerald-600", Icon: CheckCircle2 },
};

/* -------------------------------- controls -------------------------------- */

const YNU_LABEL: Record<YNU, string> = { yes: "Yes", no: "No", unknown: "Unknown" };

function Toggle({
  label,
  help,
  value,
  onChange,
  options,
  required,
}: {
  label: string;
  help?: string;
  value: string;
  onChange: (v: string) => void;
  options: { v: string; l: string }[];
  required?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      <div className="flex gap-1.5" role="group" aria-label={label}>
        {options.map((o) => (
          <Button
            key={o.v}
            type="button"
            size="sm"
            variant={value === o.v ? "default" : "outline"}
            className="h-8 px-3 text-xs"
            aria-pressed={value === o.v}
            onClick={() => onChange(o.v)}
          >
            {o.l}
          </Button>
        ))}
      </div>
      {help && <p className="text-[11px] text-muted-foreground">{help}</p>}
    </div>
  );
}

const YNU_OPTS = [
  { v: "no", l: "No" },
  { v: "yes", l: "Yes" },
  { v: "unknown", l: "Unknown" },
];
const YN_OPTS = [
  { v: "no", l: "No" },
  { v: "yes", l: "Yes" },
];

function CheckGroup({
  label,
  options,
  value,
  onChange,
  noneOption,
  required,
}: {
  label: string;
  options: readonly string[];
  value: string[];
  onChange: (v: string[]) => void;
  noneOption?: string;
  required?: boolean;
}) {
  const toggle = (o: string) => {
    if (noneOption && o === noneOption) {
      onChange(value.includes(o) ? [] : [o]);
      return;
    }
    const next = noneOption ? value.filter((x) => x !== noneOption) : [...value];
    onChange(next.includes(o) ? next.filter((x) => x !== o) : [...next, o]);
  };
  return (
    <div className="space-y-2">
      <Label className="text-xs">
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {options.map((o) => (
          <label key={o} className="flex items-center gap-2 text-xs rounded-md border p-2 cursor-pointer hover:bg-muted/50">
            <Checkbox checked={value.includes(o)} onCheckedChange={() => toggle(o)} aria-label={o} />
            {o}
          </label>
        ))}
      </div>
    </div>
  );
}

function NumField({
  id,
  label,
  unit,
  value,
  onChange,
  note,
}: {
  id: string;
  label: string;
  unit?: string;
  value: string;
  onChange: (v: string) => void;
  note?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs">
        {label} {unit && <span className="text-muted-foreground">({unit})</span>}
      </Label>
      <Input id={id} type="number" inputMode="decimal" value={value} onChange={(e) => onChange(e.target.value)} className="h-9 text-sm" />
      {note && <p className="text-[11px] text-muted-foreground">{note}</p>}
    </div>
  );
}

const num = (s: string) => {
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : null;
};

/* --------------------------------- screen --------------------------------- */

function PreScreen() {
  const [agent, setAgent] = useState<string>("");
  const [indication, setIndication] = useState<string[]>([]);
  const [heightCm, setHeightCm] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [comorbidities, setComorbidities] = useState<string[]>([]);
  const [lifestyle, setLifestyle] = useState<YN>("no");

  const [personalMtc, setPersonalMtc] = useState<YNU>("no");
  const [familyMtc, setFamilyMtc] = useState<YNU>("no");
  const [men2, setMen2] = useState<YNU>("no");
  const [hypersensitivity, setHypersensitivity] = useState<YNU>("no");
  const [pregnant, setPregnant] = useState<YNU>("no");
  const [breastfeeding, setBreastfeeding] = useState<YNU>("no");
  const [pregnancyPlanned, setPregnancyPlanned] = useState<YNU>("no");

  const [diabetes, setDiabetes] = useState<YN>("no");
  const [diabetesType, setDiabetesType] = useState<string>("");
  const [insulinSu, setInsulinSu] = useState<YN>("no");
  const [pancreatitis, setPancreatitis] = useState<YNU>("no");
  const [biliary, setBiliary] = useState<YNU>("no");
  const [gi, setGi] = useState<string[]>([]);
  const [renal, setRenal] = useState<string[]>([]);
  const [psych, setPsych] = useState<YNU>("no");
  const [currentGlp1, setCurrentGlp1] = useState<YN>("no");

  const [eyeExamDate, setEyeExamDate] = useState("");
  const [retinopathy, setRetinopathy] = useState<string>("");
  const [retinopathyRx, setRetinopathyRx] = useState<string[]>([]);
  const [visualFlags, setVisualFlags] = useState<string[]>([]);
  const [otherEye, setOtherEye] = useState<string[]>([]);

  const [bp, setBp] = useState("");
  const [hba1c, setHba1c] = useState("");
  const [fpg, setFpg] = useState("");
  const [creatinine, setCreatinine] = useState("");
  const [egfr, setEgfr] = useState("");
  const [alt, setAlt] = useState("");
  const [ast, setAst] = useState("");
  const [bili, setBili] = useState("");
  const [tsh, setTsh] = useState("");
  const [lipase, setLipase] = useState("");
  const [amylase, setAmylase] = useState("");
  const [nutrition, setNutrition] = useState<string[]>([]);

  const [clinician, setClinician] = useState("");
  const [nextReview, setNextReview] = useState("");

  const h = num(heightCm);
  const w = num(weightKg);
  const bmi = h && w && h > 0 ? w / Math.pow(h / 100, 2) : null;
  const a1c = num(hba1c);

  const weightIndicationMet =
    bmi !== null && (bmi >= 30 || (bmi >= 27 && comorbidities.length > 0));

  const rapidA1cFallRisk =
    diabetes === "yes" &&
    ((a1c !== null && a1c >= 9) ||
      insulinSu === "yes" ||
      ["Mild/moderate NPDR", "Severe NPDR", "Proliferative DR", "Diabetic macular oedema"].includes(retinopathy));

  const evaluation = useMemo(() => {
    type Fired = { id: string; priority: number; outcome: Outcome; message: string };
    const fired: Fired[] = [];
    const add = (id: string, priority: number, outcome: Outcome, message: string) =>
      fired.push({ id, priority, outcome, message });

    if (personalMtc === "yes" || familyMtc === "yes" || men2 === "yes")
      add("hard_stop_mtc_men2", 1, "DO_NOT_START", "Personal/family MTC or MEN2: do not initiate the selected GLP-1RA / dual incretin agent. Confirm history and select an alternative strategy.");
    if (hypersensitivity === "yes")
      add("hard_stop_allergy", 1, "DO_NOT_START", "Prior serious hypersensitivity: do not initiate the implicated product. Document the reaction and choose an alternative treatment.");
    if (visualFlags.length > 0 && !visualFlags.includes("None"))
      add("urgent_ophthalmology", 1, "DEFER_AND_REVIEW", "Urgent same-day ophthalmology or emergency assessment before treatment decision. Do not attribute acute visual symptoms to GLP-1 therapy without evaluation.");
    if (["Severe NPDR", "Proliferative DR", "Diabetic macular oedema"].includes(retinopathy) || (retinopathyRx.length > 0 && !retinopathyRx.includes("None")))
      add("retinal_specialist_review", 2, "DEFER_AND_REVIEW", "Obtain retinal specialist input and a plan for close follow-up before or contemporaneous with initiation; avoid unnecessarily rapid glycaemic correction.");
    if (rapidA1cFallRisk || retinopathy === "Unknown / not assessed")
      add("high_retinopathy_risk", 3, "START_WITH_PRECAUTIONS", "Arrange baseline dilated retinal assessment or retinal photography/OCT according to access and risk; plan follow-up in the first 3–6 months.");
    if (diabetes === "yes" && diabetesType === "Type 1")
      add("type1_diabetes_review", 2, "DEFER_AND_REVIEW", "Not a substitute for insulin. Require endocrinology-led assessment and a ketone/sick-day safety plan.");
    if (pancreatitis === "yes" || biliary === "yes")
      add("pancreatobiliary_review", 3, "DEFER_AND_REVIEW", "Clarify aetiology, current activity, and competing risk before prescribing; investigate active abdominal symptoms before initiation.");
    if (gi.some((g) => ["Known gastroparesis", "Severe GI motility disorder", "Persistent vomiting / dehydration"].includes(g)))
      add("gi_motility_review", 3, "DEFER_AND_REVIEW", "Assess severity and risks of worsening nausea, vomiting, dehydration, and medication intolerance; consider specialist review or alternative therapy.");
    if (insulinSu === "yes")
      add("hypoglycaemia_plan", 3, "START_WITH_PRECAUTIONS", "Create an insulin/sulfonylurea dose-reduction and glucose-monitoring plan at initiation and each titration step.");
    if (indication.includes("Chronic weight management") && bmi !== null && !weightIndicationMet)
      add("weight_indication_not_met", 3, "NOT_ELIGIBLE", "Does not meet this app's default weight-management threshold (BMI ≥30, or ≥27 with a weight-related comorbidity). Check approved local indication and payer policy.");

    // Additional label-level safety captured from the form
    if (pregnant === "yes")
      add("pregnancy", 1, "DO_NOT_START", "Pregnancy: GLP-1RAs are not recommended — stop or withhold and use an alternative strategy.");
    if (breastfeeding === "yes")
      add("breastfeeding", 2, "DEFER_AND_REVIEW", "Breastfeeding: safety not established — review the product label and discuss alternatives.");
    if (pregnancy_planned_flag(pregnancyPlanned))
      add("pregnancy_planned", 3, "START_WITH_PRECAUTIONS", "Pregnancy planned: agree contraception, and stop the agent before conception per the product label washout period.");
    if (currentGlp1 === "yes")
      add("duplicate_incretin", 2, "DEFER_AND_REVIEW", "Already on another GLP-1RA or dual incretin agent — do not co-prescribe; switch rather than add.");
    if (psych === "yes")
      add("eating_disorder", 3, "DEFER_AND_REVIEW", "Active eating disorder or major psychiatric risk — arrange specialist input before initiation.");
    if (renal.includes("eGFR below 30 mL/min/1.73m2") || renal.includes("Recent acute kidney injury"))
      add("renal_risk", 3, "START_WITH_PRECAUTIONS", "Renal risk: monitor renal function, counsel on hydration and sick-day rules, and review diuretics/ACEi/ARB/NSAIDs during GI illness.");
    else if (renal.some((r) => r !== "None known"))
      add("volume_risk", 3, "START_WITH_PRECAUTIONS", "Volume-depletion risk: counsel on hydration and temporary withholding of nephrotoxic or diuretic drugs during vomiting.");
    if (lifestyle === "no")
      add("lifestyle", 3, "START_WITH_PRECAUTIONS", "Document a diet, activity and behavioural plan alongside pharmacotherapy.");

    add("default_eligible", 99, "ELIGIBLE_PENDING_CLINICIAN_REVIEW", "No hard-stop risk identified. Confirm indication, product-specific label requirements, baseline data, education, and follow-up plan.");

    const order: Outcome[] = ["DO_NOT_START", "NOT_ELIGIBLE", "DEFER_AND_REVIEW", "START_WITH_PRECAUTIONS", "ELIGIBLE_PENDING_CLINICIAN_REVIEW"];
    const sorted = [...fired].sort((x, y) => x.priority - y.priority || order.indexOf(x.outcome) - order.indexOf(y.outcome));
    const primary = sorted.reduce<Fired>((best, f) => (order.indexOf(f.outcome) < order.indexOf(best.outcome) ? f : best), sorted[sorted.length - 1]);

    const missing: string[] = [];
    if (!agent) missing.push("Proposed agent");
    if (indication.length === 0) missing.push("Intended indication");
    if (h === null) missing.push("Height");
    if (w === null) missing.push("Weight");
    if (!retinopathy) missing.push("Known diabetic retinopathy status");
    if (visualFlags.length === 0) missing.push("Current visual symptoms (select None if absent)");

    const pending: string[] = [];
    if ((diabetes === "yes" || indication.includes("Type 2 diabetes")) && a1c === null) pending.push("HbA1c");
    if (num(creatinine) === null) pending.push("Serum creatinine");
    if (num(egfr) === null) pending.push("eGFR");
    if (num(alt) === null) pending.push("ALT");
    if (!bp.trim()) pending.push("Blood pressure");
    if (!eyeExamDate) pending.push("Date of most recent dilated retinal examination");

    const ophthTier =
      visualFlags.length > 0 && !visualFlags.includes("None")
        ? { tier: "Urgent", note: "Same-day ophthalmology / emergency eye assessment before any prescribing decision." }
        : ["Severe NPDR", "Proliferative DR", "Diabetic macular oedema"].includes(retinopathy)
          ? { tier: "High", note: "Retinal specialist review before or alongside initiation; review at 1–3 months, then per specialist." }
          : rapidA1cFallRisk || retinopathy === "Unknown / not assessed" || otherEye.some((o) => o !== "No relevant history")
            ? { tier: "Moderate", note: "Baseline retinal imaging/dilated exam; re-check at 3–6 months during rapid HbA1c reduction." }
            : { tier: "Routine", note: "Standard annual dilated eye examination; report new visual symptoms promptly." };

    return { fired: sorted.filter((f) => f.id !== "default_eligible" || sorted.length === 1), primary, missing, pending, ophthTier };
  }, [agent, indication, h, w, bmi, weightIndicationMet, comorbidities, lifestyle, personalMtc, familyMtc, men2, hypersensitivity, pregnant, breastfeeding, pregnancyPlanned, diabetes, diabetesType, insulinSu, pancreatitis, biliary, gi, renal, psych, currentGlp1, retinopathy, retinopathyRx, visualFlags, otherEye, rapidA1cFallRisk, a1c, creatinine, egfr, alt, bp, eyeExamDate]);

  const meta = OUTCOME_META[evaluation.primary.outcome];

  const report = useMemo(() => {
    const L: string[] = [];
    L.push("GLP-1RA / DUAL GIP–GLP-1 PRE-SCREEN");
    L.push(`Date: ${new Date().toLocaleDateString()}`);
    L.push(`Proposed agent: ${AGENTS.find((x) => x.id === agent)?.label || "not selected"}`);
    L.push(`Indication: ${indication.join(", ") || "not selected"}`);
    L.push("");
    L.push("--- BMI AND INDICATION ASSESSMENT ---");
    L.push(`Height ${heightCm || "-"} cm, weight ${weightKg || "-"} kg, BMI ${bmi ? bmi.toFixed(1) : "-"} kg/m2`);
    L.push(`Weight-related comorbidities: ${comorbidities.join(", ") || "none recorded"}`);
    L.push(`Weight-management indication met: ${bmi === null ? "cannot compute" : weightIndicationMet ? "Yes" : "No"}`);
    L.push(`Lifestyle intervention reviewed/planned: ${lifestyle === "yes" ? "Yes" : "No"}`);
    L.push("");
    L.push("--- HARD-STOP SAFETY SCREEN ---");
    L.push(`Personal MTC: ${YNU_LABEL[personalMtc]} | Family MTC: ${YNU_LABEL[familyMtc]} | MEN2: ${YNU_LABEL[men2]}`);
    L.push(`Serious hypersensitivity: ${YNU_LABEL[hypersensitivity]}`);
    L.push(`Pregnant: ${YNU_LABEL[pregnant]} | Breastfeeding: ${YNU_LABEL[breastfeeding]} | Pregnancy planned: ${YNU_LABEL[pregnancyPlanned]}`);
    L.push("");
    L.push("--- CLINICAL RISK REVIEW ---");
    L.push(`Diabetes: ${diabetes === "yes" ? `Yes (${diabetesType || "type not recorded"})` : "No"}`);
    L.push(`Insulin or sulfonylurea: ${insulinSu === "yes" ? "Yes" : "No"}`);
    L.push(`Previous pancreatitis: ${YNU_LABEL[pancreatitis]} | Active biliary disease: ${YNU_LABEL[biliary]}`);
    L.push(`GI disorders: ${gi.join(", ") || "not recorded"}`);
    L.push(`Renal / volume risk: ${renal.join(", ") || "not recorded"}`);
    L.push(`Eating disorder / psychiatric risk: ${YNU_LABEL[psych]}`);
    L.push(`Currently on another incretin agent: ${currentGlp1 === "yes" ? "Yes" : "No"}`);
    L.push("");
    L.push("--- OPHTHALMIC RISK TIER AND FOLLOW-UP ---");
    L.push(`Tier: ${evaluation.ophthTier.tier} — ${evaluation.ophthTier.note}`);
    L.push(`Last dilated retinal examination: ${eyeExamDate || "not recorded"}`);
    L.push(`Known retinopathy: ${retinopathy || "not recorded"}`);
    L.push(`Retinopathy treatment: ${retinopathyRx.join(", ") || "not recorded"}`);
    L.push(`Current visual symptoms: ${visualFlags.join(", ") || "not recorded"}`);
    L.push(`Other ophthalmic history: ${otherEye.join(", ") || "not recorded"}`);
    L.push("");
    L.push("--- BASELINE DATA ---");
    L.push(`BP ${bp || "-"} | HbA1c ${hba1c || "-"} % | FPG ${fpg || "-"} mg/dL`);
    L.push(`Creatinine ${creatinine || "-"} mg/dL | eGFR ${egfr || "-"} mL/min/1.73m2`);
    L.push(`ALT ${alt || "-"} | AST ${ast || "-"} U/L | Bilirubin ${bili || "-"} mg/dL`);
    L.push(`TSH ${tsh || "-"} mIU/L | Lipase ${lipase || "-"} | Amylase ${amylase || "-"} U/L`);
    L.push(`Nutrition tests requested: ${nutrition.join(", ") || "none"}`);
    L.push("");
    L.push(`--- OUTCOME: ${evaluation.primary.outcome} (${meta.label}) ---`);
    L.push(evaluation.primary.message);
    if (evaluation.fired.length) {
      L.push("Precautions and referral flags:");
      evaluation.fired.forEach((f) => L.push(`  - [${f.outcome}] ${f.message}`));
    }
    if (evaluation.missing.length) {
      L.push("Required fields outstanding:");
      evaluation.missing.forEach((m) => L.push(`  ! ${m}`));
    }
    if (evaluation.pending.length) {
      L.push("Baseline investigations missing / pending:");
      evaluation.pending.forEach((p) => L.push(`  ? ${p}`));
    }
    L.push(`Insulin/sulfonylurea adjustment required: ${insulinSu === "yes" ? "YES — reduce dose and set monitoring plan" : "No"}`);
    L.push("");
    L.push("--- COUNSELLING CHECKLIST ---");
    COUNSELLING.forEach((c) => L.push(`  [ ] ${c}`));
    L.push("");
    L.push(`Clinician approval: ${clinician || "________________"}   Date: ${new Date().toLocaleDateString()}`);
    L.push(`Next review: ${nextReview || "________________"}`);
    L.push("");
    L.push("Clinician use only. Decision support — does not replace product-specific prescribing information, local policy, clinical judgement, or specialist referral.");
    return L.join("\n");
  }, [agent, indication, heightCm, weightKg, bmi, comorbidities, weightIndicationMet, lifestyle, personalMtc, familyMtc, men2, hypersensitivity, pregnant, breastfeeding, pregnancyPlanned, diabetes, diabetesType, insulinSu, pancreatitis, biliary, gi, renal, psych, currentGlp1, eyeExamDate, retinopathy, retinopathyRx, visualFlags, otherEye, bp, hba1c, fpg, creatinine, egfr, alt, ast, bili, tsh, lipase, amylase, nutrition, evaluation, meta.label, clinician, nextReview]);

  return (
    <div className="space-y-4">
      {/* Indication */}
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Indication and treatment goal</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Proposed agent <span className="text-destructive">*</span></Label>
              <Select value={agent} onValueChange={setAgent}>
                <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select agent" /></SelectTrigger>
                <SelectContent>
                  {AGENTS.map((a) => <SelectItem key={a.id} value={a.id} className="text-sm">{a.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Toggle label="Diet/activity/behavioural intervention reviewed or planned" required value={lifestyle} onChange={(v) => setLifestyle(v as YN)} options={YN_OPTS} />
            <NumField id="height" label="Height" unit="cm" value={heightCm} onChange={setHeightCm} />
            <NumField id="weight" label="Weight" unit="kg" value={weightKg} onChange={setWeightKg} />
          </div>
          <CheckGroup label="Intended indication *" options={INDICATIONS} value={indication} onChange={setIndication} />
          <CheckGroup label="Weight-related comorbidities" options={WEIGHT_COMORBIDITIES} value={comorbidities} onChange={setComorbidities} />
          {bmi !== null && (
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="text-[11px]">BMI {bmi.toFixed(1)} kg/m²</Badge>
              <Badge variant="outline" className={`text-[11px] ${weightIndicationMet ? "text-emerald-600" : "text-amber-600"}`}>
                Weight-management indication {weightIndicationMet ? "met" : "not met"}
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Hard stops */}
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Hard-stop safety screen</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Toggle label="Personal history of medullary thyroid carcinoma (MTC)" required value={personalMtc} onChange={(v) => setPersonalMtc(v as YNU)} options={YNU_OPTS} />
          <Toggle label="Family history of MTC" required value={familyMtc} onChange={(v) => setFamilyMtc(v as YNU)} options={YNU_OPTS} />
          <Toggle label="Multiple endocrine neoplasia type 2 (MEN2)" required value={men2} onChange={(v) => setMen2(v as YNU)} options={YNU_OPTS} />
          <Toggle label="Prior serious hypersensitivity to the intended agent or excipients" required value={hypersensitivity} onChange={(v) => setHypersensitivity(v as YNU)} options={YNU_OPTS} />
          <Toggle label="Currently pregnant" required value={pregnant} onChange={(v) => setPregnant(v as YNU)} options={YNU_OPTS} />
          <Toggle label="Currently breastfeeding" required value={breastfeeding} onChange={(v) => setBreastfeeding(v as YNU)} options={YNU_OPTS} />
          <Toggle label="Pregnancy planned during the treatment period" required value={pregnancyPlanned} onChange={(v) => setPregnancyPlanned(v as YNU)} options={YNU_OPTS} />
        </CardContent>
      </Card>

      {/* Clinical risk */}
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Clinical risk review</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Toggle label="Diabetes mellitus" value={diabetes} onChange={(v) => setDiabetes(v as YN)} options={YN_OPTS} />
            {diabetes === "yes" && (
              <div className="space-y-1.5">
                <Label className="text-xs">Diabetes type</Label>
                <Select value={diabetesType} onValueChange={setDiabetesType}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>
                    {["Type 1", "Type 2", "Other / uncertain"].map((o) => <SelectItem key={o} value={o} className="text-sm">{o}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
            <Toggle
              label="Current insulin or sulfonylurea treatment"
              help="Triggers hypoglycaemia-medication review and glucose-monitoring plan."
              value={insulinSu}
              onChange={(v) => setInsulinSu(v as YN)}
              options={YN_OPTS}
            />
            <Toggle label="Previous acute or chronic pancreatitis" value={pancreatitis} onChange={(v) => setPancreatitis(v as YNU)} options={YNU_OPTS} />
            <Toggle label="Active biliary colic, cholecystitis, choledocholithiasis or cholestatic symptoms" value={biliary} onChange={(v) => setBiliary(v as YNU)} options={YNU_OPTS} />
            <Toggle label="Active eating disorder or major psychiatric risk" value={psych} onChange={(v) => setPsych(v as YNU)} options={YNU_OPTS} />
            <Toggle label="Currently using another GLP-1RA or dual incretin agent" value={currentGlp1} onChange={(v) => setCurrentGlp1(v as YN)} options={YN_OPTS} />
          </div>
          <CheckGroup label="GI disorders" options={GI_OPTIONS} value={gi} onChange={setGi} noneOption="None known" />
          <CheckGroup label="Renal / volume-depletion risk" options={RENAL_OPTIONS} value={renal} onChange={setRenal} noneOption="None known" />
        </CardContent>
      </Card>

      {/* Ophthalmology */}
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Ophthalmology screening</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="eye-exam" className="text-xs">Most recent dilated retinal examination</Label>
              <Input id="eye-exam" type="date" value={eyeExamDate} onChange={(e) => setEyeExamDate(e.target.value)} className="h-9 text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Known diabetic retinopathy <span className="text-destructive">*</span></Label>
              <Select value={retinopathy} onValueChange={setRetinopathy}>
                <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {RETINOPATHY.map((o) => <SelectItem key={o} value={o} className="text-sm">{o}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <CheckGroup label="Retinopathy treatment/history" options={RETINOPATHY_TREATMENT} value={retinopathyRx} onChange={setRetinopathyRx} noneOption="None" />
          <CheckGroup label="Current visual symptoms *" options={VISUAL_RED_FLAGS} value={visualFlags} onChange={setVisualFlags} noneOption="None" />
          <CheckGroup label="Other ophthalmic history" options={OTHER_EYE_DISEASE} value={otherEye} onChange={setOtherEye} noneOption="No relevant history" />
          <p className="text-[11px] text-muted-foreground">
            For cup-to-disc ratios, intraocular pressure, OCT/RNFL and NAION-specific risk, use the <strong>Optic nerve / NAION</strong> tab.
          </p>
        </CardContent>
      </Card>

      {/* Baseline */}
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Baseline observations and investigations</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="bp" className="text-xs">Blood pressure</Label>
              <Input id="bp" value={bp} onChange={(e) => setBp(e.target.value)} placeholder="e.g., 132/82" className="h-9 text-sm" />
            </div>
            <NumField id="hba1c" label="HbA1c" unit="%" value={hba1c} onChange={setHba1c} />
            <NumField id="fpg" label="Fasting plasma glucose" unit="mg/dL" value={fpg} onChange={setFpg} />
            <NumField id="creat" label="Serum creatinine" unit="mg/dL" value={creatinine} onChange={setCreatinine} />
            <NumField id="egfr" label="eGFR" unit="mL/min/1.73m²" value={egfr} onChange={setEgfr} />
            <NumField id="alt" label="ALT" unit="U/L" value={alt} onChange={setAlt} />
            <NumField id="ast" label="AST" unit="U/L" value={ast} onChange={setAst} />
            <NumField id="bili" label="Total bilirubin" unit="mg/dL" value={bili} onChange={setBili} />
            <NumField id="tsh" label="TSH" unit="mIU/L" value={tsh} onChange={setTsh} note="Consider for unexplained weight change or thyroid symptoms; not GLP-1RA-specific." />
            <NumField id="lipase" label="Lipase" unit="U/L" value={lipase} onChange={setLipase} note="Order for suggestive symptoms; isolated asymptomatic elevation is not pancreatitis." />
            <NumField id="amylase" label="Amylase" unit="U/L" value={amylase} onChange={setAmylase} />
          </div>
          <CheckGroup label="Nutrition testing, if risk or dietary restriction is anticipated" options={NUTRITION_TESTS} value={nutrition} onChange={setNutrition} />
        </CardContent>
      </Card>

      {/* Result */}
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Pre-screen outcome</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className={`rounded-lg border p-3 ${meta.cls}`} role="status" aria-live="polite">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <meta.Icon className="w-4 h-4" />
              {meta.label}
            </div>
            <p className="text-xs mt-1 font-normal">{evaluation.primary.message}</p>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {bmi !== null && <Badge variant="outline" className="text-[11px]">BMI {bmi.toFixed(1)}</Badge>}
              <Badge variant="outline" className="text-[11px]">Ophthalmic tier: {evaluation.ophthTier.tier}</Badge>
              {rapidA1cFallRisk && <Badge variant="outline" className="text-[11px]">Rapid HbA1c fall risk</Badge>}
              {insulinSu === "yes" && <Badge variant="outline" className="text-[11px]">Hypoglycaemia med review</Badge>}
            </div>
          </div>

          {evaluation.missing.length > 0 && (
            <div className="rounded-lg border p-3 bg-muted/30">
              <div className="text-xs font-semibold mb-1">Required fields outstanding</div>
              <ul className="text-xs list-disc ml-4 space-y-0.5">{evaluation.missing.map((m) => <li key={m}>{m}</li>)}</ul>
            </div>
          )}

          {evaluation.fired.length > 0 && (
            <div className="rounded-lg border border-amber-500/40 bg-amber-500/5 p-3">
              <div className="text-xs font-semibold mb-1 text-amber-600">Precautions and referral flags</div>
              <ul className="text-xs list-disc ml-4 space-y-1">
                {evaluation.fired.map((f) => (
                  <li key={f.id}><span className="font-medium">[{OUTCOME_META[f.outcome].label}]</span> {f.message}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="rounded-lg border border-primary/30 bg-primary/5 p-3">
            <div className="text-xs font-semibold mb-1">Ophthalmic follow-up</div>
            <p className="text-xs">{evaluation.ophthTier.note}</p>
          </div>

          {evaluation.pending.length > 0 && (
            <div className="rounded-lg border p-3 bg-muted/30">
              <div className="text-xs font-semibold mb-1">Baseline investigations missing / pending</div>
              <ul className="text-xs list-disc ml-4 space-y-0.5">{evaluation.pending.map((p) => <li key={p}>{p}</li>)}</ul>
            </div>
          )}

          <div className="rounded-lg border p-3">
            <div className="text-xs font-semibold mb-1">Counselling checklist</div>
            <ul className="text-xs list-disc ml-4 space-y-0.5">{COUNSELLING.map((c) => <li key={c}>{c}</li>)}</ul>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="clinician" className="text-xs">Clinician approval (name)</Label>
              <Input id="clinician" value={clinician} onChange={(e) => setClinician(e.target.value)} className="h-9 text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="next-review" className="text-xs">Next review date</Label>
              <Input id="next-review" type="date" value={nextReview} onChange={(e) => setNextReview(e.target.value)} className="h-9 text-sm" />
            </div>
          </div>

          <div>
            <Label className="text-xs">Printable report</Label>
            <Textarea value={report} readOnly rows={14} className="font-mono text-[11px] mt-1" />
            <div className="flex flex-wrap gap-2 mt-2">
              <Button size="sm" variant="outline" onClick={() => window.print()}><Printer className="w-4 h-4 mr-1" /> Print / PDF</Button>
              <Button size="sm" variant="outline" onClick={() => copyToClipboard(report, "Report copied")}><Copy className="w-4 h-4 mr-1" /> Copy</Button>
              <Button size="sm" variant="outline" onClick={() => downloadTextFile("glp1-prescreen.txt", report)}>Download .txt</Button>
            </div>
          </div>

          <p className="text-[11px] text-muted-foreground">
            Clinician use only. Decision support — does not replace product-specific prescribing information, local policy, clinical judgement, or specialist referral.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function pregnancy_planned_flag(v: YNU) {
  return v === "yes";
}

/* ---------------------------------- page ---------------------------------- */

export default function Glp1Screening() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background">
      <Seo
        title="GLP-1 Screening: Pre-Screen, Eye & NAION Risk"
        description="Clinician GLP-1RA / dual GIP-GLP-1 pre-screen with hard-stop contraindications, precautions, ophthalmic risk tiering and an optic nerve / glaucoma / NAION assessment."
        path="/glp1-screening"
      />
      <div className="max-w-4xl mx-auto p-4 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
              <Syringe className="w-5 h-5 text-primary" />
              GLP-1 screening
            </h1>
            <p className="text-xs text-muted-foreground mt-1">
              GLP-1RA / dual GIP–GLP-1 pre-screen combined with optic nerve, glaucoma and NAION risk assessment. Clinician use only.
            </p>
          </div>
          <Button size="sm" variant="outline" onClick={() => navigate("/home")}>
            <Home className="w-4 h-4 mr-1" /> Home
          </Button>
        </div>

        <Tabs defaultValue="prescreen">
          <TabsList className="w-full grid grid-cols-2">
            <TabsTrigger value="prescreen" className="text-xs sm:text-sm">
              <Syringe className="w-4 h-4 mr-1" /> Pre-screen
            </TabsTrigger>
            <TabsTrigger value="optic" className="text-xs sm:text-sm">
              <Eye className="w-4 h-4 mr-1" /> Optic nerve / NAION
            </TabsTrigger>
          </TabsList>
          <TabsContent value="prescreen" className="mt-4">
            <PreScreen />
          </TabsContent>
          <TabsContent value="optic" className="mt-4">
            <div className="rounded-lg border p-3 mb-3 bg-muted/30">
              <p className="text-xs text-muted-foreground">
                Complete by an ophthalmologist or optometrist. CDR values are supportive screening data, not stand-alone diagnoses.
              </p>
            </div>
            <OpticNerveAssessment embedded />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
