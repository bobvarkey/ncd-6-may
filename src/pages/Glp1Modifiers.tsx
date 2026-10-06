import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Copy, FileJson, RotateCcw, Sliders, AlertTriangle, CheckCircle2, ShieldAlert } from "lucide-react";
import { copyToClipboard, downloadTextFile } from "@/lib/clinical-utils";

/* ------------------------------- schema v1 -------------------------------- */

type PancreatitisHistory = "none" | "single_resolved" | "recurrent" | "chronic";
type GpSeverity = "none" | "mild" | "moderate" | "severe";
type Decision = "proceed_with_plan" | "defer" | "avoid";

interface ModifierState {
  absolute_contraindications: {
    MTC_personal_or_family: boolean;
    MEN2: boolean;
    hypersensitivity_to_GLP1_RA: boolean;
    pregnancy_or_breastfeeding: boolean;
    active_eating_disorder_unsafe: boolean;
  };
  strong_cautions: {
    history_of_pancreatitis: PancreatitisHistory | "";
    gastroparesis_severity: GpSeverity | "";
    renal_function: {
      eGFR: string;
    };
    severe_liver_disease: boolean;
    uncontrolled_psychiatric_or_subuse: boolean;
  };
  conditional_risks: {
    gallbladder: { status: string; last_event_months_ago: string; plan: string };
    pancreatitis_risk: { alcohol_heavy: boolean; triglycerides_mmol_L: string; known_gallstones: boolean; plan: string };
    retinopathy: { history: boolean; last_exam_date: string; proliferative: boolean; plan: string };
    renal_dehydration_risk: { CKD_stage: string; diuretics: boolean; plan: string };
    thyroid_non_MTC: { history_goiter_nodules: boolean; plan: string };
    GI_and_eating_behavior: { baseline_GI_symptoms: string; eating_disorder_screen: string; plan: string };
  };
  follow_up_plan: {
    visit_interval_weeks: string;
    labs: string[];
  };
}

const LABS = ["eGFR", "LFTs", "lipids", "HbA1c"] as const;

const STOP_RULES = [
  "persistent_severe_abdominal_pain → evaluate_pancreatitis",
  "RUQ_pain_fever_jaundice → evaluate_gallbladder",
  "neck_mass_dysphagia_hoarseness → evaluate_thyroid",
];

const YN_OPTS = [
  { v: "no", l: "No" },
  { v: "yes", l: "Yes" },
];

const PANCREATITIS_OPTS = [
  { v: "none", l: "None" },
  { v: "single_resolved", l: "Single episode — resolved" },
  { v: "recurrent", l: "Recurrent" },
  { v: "chronic", l: "Chronic" },
];

const GASTROPARESIS_OPTS = [
  { v: "none", l: "None" },
  { v: "mild", l: "Mild" },
  { v: "moderate", l: "Moderate" },
  { v: "severe", l: "Severe" },
];

const GALLBLADDER_STATUS_OPTS = [
  { v: "none", l: "None" },
  { v: "asymptomatic_stones", l: "Asymptomatic stones" },
  { v: "prior_cholecystectomy", l: "Prior cholecystectomy" },
  { v: "recent_biliary_event", l: "Recent biliary event" },
];

const GALLBLADDER_PLAN_OPTS = [
  { v: "counsel_and_monitor", l: "Counsel and monitor" },
  { v: "defer_until_surgical_management", l: "Defer until surgical management" },
  { v: "consider_UDCA", l: "Consider UDCA" },
];

const PANCREATITIS_RISK_PLAN_OPTS = [
  { v: "counsel_symptoms", l: "Counsel symptoms" },
  { v: "optimize_TG_and_alcohol", l: "Optimize TG and alcohol" },
];

const RETINOPATHY_PLAN_OPTS = [
  { v: "ensure_retinal_screening_before_start", l: "Ensure retinal screening before start" },
  { v: "defer_until_ophtho_clearance", l: "Defer until ophthalmology clearance" },
];

const RENAL_DEHYD_PLAN_OPTS = [
  { v: "hydration_education_and_sick_day_rules", l: "Hydration education and sick-day rules" },
  { v: "nephrology_review", l: "Nephrology review" },
];

const THYROID_PLAN_OPTS = [
  { v: "counsel_thyroid_tumor_symptoms", l: "Counsel thyroid tumor symptoms" },
  { v: "ultrasound_and_review", l: "Ultrasound and review" },
];

const GI_PLAN_OPTS = [
  { v: "slow_titration_and_GI_support", l: "Slow titration and GI support" },
  { v: "dietitian_review", l: "Dietitian review" },
];

const GI_SYMPTOM_OPTS = [
  { v: "none", l: "None" },
  { v: "mild_nausea", l: "Mild nausea" },
  { v: "moderate", l: "Moderate (daily symptoms / vomiting)" },
  { v: "severe", l: "Severe" },
];

const ED_SCREEN_OPTS = [
  { v: "negative", l: "Negative" },
  { v: "positive", l: "Positive" },
  { v: "not_screened", l: "Not screened" },
];

const DECISION_META: Record<Decision, { label: string; cls: string; Icon: typeof AlertTriangle }> = {
  avoid: { label: "Avoid", cls: "border-destructive/40 bg-destructive/10 text-destructive", Icon: ShieldAlert },
  defer: { label: "Defer", cls: "border-amber-500/40 bg-amber-500/10 text-amber-600", Icon: AlertTriangle },
  proceed_with_plan: { label: "Proceed with plan", cls: "border-emerald-500/40 bg-emerald-500/10 text-emerald-600", Icon: CheckCircle2 },
};

const numStr = (s: string): number | null => {
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : null;
};
const orNull = (s: string) => (s === "" ? null : s);

/* -------------------------------- defaults -------------------------------- */

function defaultModifierState(): ModifierState {
  return {
    absolute_contraindications: {
      MTC_personal_or_family: false,
      MEN2: false,
      hypersensitivity_to_GLP1_RA: false,
      pregnancy_or_breastfeeding: false,
      active_eating_disorder_unsafe: false,
    },
    strong_cautions: {
      history_of_pancreatitis: "none",
      gastroparesis_severity: "none",
      renal_function: { eGFR: "" },
      severe_liver_disease: false,
      uncontrolled_psychiatric_or_subuse: false,
    },
    conditional_risks: {
      gallbladder: { status: "none", last_event_months_ago: "", plan: "counsel_and_monitor" },
      pancreatitis_risk: { alcohol_heavy: false, triglycerides_mmol_L: "", known_gallstones: false, plan: "counsel_symptoms" },
      retinopathy: { history: false, last_exam_date: "", proliferative: false, plan: "ensure_retinal_screening_before_start" },
      renal_dehydration_risk: { CKD_stage: "", diuretics: false, plan: "hydration_education_and_sick_day_rules" },
      thyroid_non_MTC: { history_goiter_nodules: false, plan: "counsel_thyroid_tumor_symptoms" },
      GI_and_eating_behavior: { baseline_GI_symptoms: "none", eating_disorder_screen: "negative", plan: "slow_titration_and_GI_support" },
    },
    follow_up_plan: { visit_interval_weeks: "4", labs: [...LABS] },
  };
}

/* --------------------------------- engine --------------------------------- */

function evaluateModifiers(m: ModifierState) {
  const a = m.absolute_contraindications;
  const sc = m.strong_cautions;
  const cr = m.conditional_risks;
  const egfr = numStr(sc.renal_function.eGFR);
  const tg = numStr(cr.pancreatitis_risk.triglycerides_mmol_L);
  const ckd = numStr(cr.renal_dehydration_risk.CKD_stage);

  const avoid: string[] = [];
  const defer: string[] = [];
  const cautions: string[] = [];

  if (a.pregnancy_or_breastfeeding) avoid.push("Pregnancy or breastfeeding — do not start; contraception advice and stop rules per product label");
  if (a.MTC_personal_or_family) avoid.push("Personal or family history of medullary thyroid carcinoma (MTC) — contraindicated");
  if (a.MEN2) avoid.push("MEN2 — contraindicated");
  if (a.hypersensitivity_to_GLP1_RA) avoid.push("Hypersensitivity to GLP-1 receptor agonists — contraindicated");
  if (a.active_eating_disorder_unsafe) avoid.push("Active eating disorder — unsafe to start");

  if (sc.history_of_pancreatitis === "recurrent" || sc.history_of_pancreatitis === "chronic")
    defer.push("Recurrent or chronic pancreatitis — defer for specialist review");
  if (sc.gastroparesis_severity === "moderate" || sc.gastroparesis_severity === "severe")
    defer.push("Moderate to severe gastroparesis — GLP-1RA delays gastric emptying further");
  if (sc.severe_liver_disease) defer.push("Severe liver disease — defer and reassess hepatic status");
  if (sc.uncontrolled_psychiatric_or_subuse) defer.push("Uncontrolled psychiatric illness or substance use — defer until stabilized");
  if (egfr !== null && egfr < 30) defer.push("eGFR < 30 — defer with nephrology input; exenatide contraindicated at this level");
  if (cr.gallbladder.status === "recent_biliary_event" && cr.gallbladder.plan === "defer_until_surgical_management")
    defer.push("Recent biliary event — defer until surgical management decided");
  if (tg !== null && tg >= 11.3) defer.push("Triglycerides ≥ 11.3 mmol/L — defer until optimized (pancreatitis risk)");
  if (cr.retinopathy.proliferative) defer.push("Proliferative retinopathy — defer until retinal screening and stabilization");
  if (cr.retinopathy.history && cr.retinopathy.last_exam_date === "") defer.push("Retinopathy history without a dated eye exam — defer until retinal assessment recorded");
  if (cr.GI_and_eating_behavior.eating_disorder_screen === "positive") defer.push("Eating disorder screen positive — defer for specialist input");

  if (sc.history_of_pancreatitis === "single_resolved")
    cautions.push("Single resolved pancreatitis — counsel symptom red flags and monitor");
  if (sc.gastroparesis_severity === "mild") cautions.push("Mild gastroparesis — slow titration and monitor GI tolerance");
  if (egfr === null) cautions.push("eGFR not recorded — record baseline renal function");
  else if (egfr < 60) cautions.push("eGFR < 60 — reduced reserve; hydration education and sick-day rules");
  if (tg !== null && tg >= 5.6 && tg < 11.3) cautions.push("Triglycerides 5.6–11.3 mmol/L — optimize before starting");
  if (cr.pancreatitis_risk.alcohol_heavy) cautions.push("Heavy alcohol use — reduce intake before/whilst starting");
  if (cr.pancreatitis_risk.known_gallstones) cautions.push("Known gallstones — counsel biliary symptoms (RUQ pain, fever, jaundice)");
  if (cr.gallbladder.status === "asymptomatic_stones") cautions.push("Asymptomatic gallstones — counsel and monitor");
  if (cr.retinopathy.history && !cr.retinopathy.proliferative) cautions.push("Retinopathy history — ensure retinal screening before start");
  if (cr.renal_dehydration_risk.diuretics) cautions.push("Diuretic use — dehydration/AKI risk; hydration education and sick-day rules");
  if (ckd !== null && ckd >= 4) cautions.push("CKD stage ≥ 4 — tight hydration plan and periodic eGFR");
  if (cr.thyroid_non_MTC.history_goiter_nodules) cautions.push("Goiter / thyroid nodule history — counsel thyroid tumor symptoms (neck mass, dysphagia, hoarseness)");
  if (cr.thyroid_non_MTC.history_goiter_nodules && cr.thyroid_non_MTC.plan === "ultrasound_and_review")
    cautions.push("Thyroid nodules on record — ultrasound and endocrine review alongside counseling");
  if (cr.GI_and_eating_behavior.baseline_GI_symptoms !== "none" && cr.GI_and_eating_behavior.baseline_GI_symptoms !== "")
    cautions.push("Baseline GI symptoms — slow titration and GI support");
  if (cr.GI_and_eating_behavior.eating_disorder_screen === "not_screened")
    cautions.push("Eating disorder screening not done — screen (e.g. SCOFF) before starting");

  const domains = [
    cr.gallbladder.status !== "none",
    cr.pancreatitis_risk.alcohol_heavy || cr.pancreatitis_risk.known_gallstones || (tg !== null && tg >= 5.6),
    cr.retinopathy.history,
    ckd !== null || cr.renal_dehydration_risk.diuretics,
    cr.thyroid_non_MTC.history_goiter_nodules,
    (cr.GI_and_eating_behavior.baseline_GI_symptoms !== "none" && cr.GI_and_eating_behavior.baseline_GI_symptoms !== "") ||
      cr.GI_and_eating_behavior.eating_disorder_screen !== "negative",
  ];
  const riskCount = domains.filter(Boolean).length;

  const decision: Decision = avoid.length > 0 ? "avoid" : defer.length > 0 ? "defer" : "proceed_with_plan";
  return { decision, avoid, defer, cautions, riskCount };
}

function buildJson(m: ModifierState, decision: Decision): string {
  const egfr = numStr(m.strong_cautions.renal_function.eGFR);
  const ex = egfr === null ? null : egfr >= 30; // exenatide contraindicated below eGFR 30 (BID and long-acting)
  const cr = m.conditional_risks;
  const sc = m.strong_cautions;
  const payload = {
    absolute_contraindications: {
      MTC_personal_or_family: m.absolute_contraindications.MTC_personal_or_family,
      MEN2: m.absolute_contraindications.MEN2,
      hypersensitivity_to_GLP1_RA: m.absolute_contraindications.hypersensitivity_to_GLP1_RA,
      pregnancy_or_breastfeeding: m.absolute_contraindications.pregnancy_or_breastfeeding,
      active_eating_disorder_unsafe: m.absolute_contraindications.active_eating_disorder_unsafe,
    },
    strong_cautions: {
      history_of_pancreatitis: orNull(sc.history_of_pancreatitis),
      gastroparesis_severity: orNull(sc.gastroparesis_severity),
      renal_function: {
        eGFR: egfr,
        exenatide_BID_allowed: ex,
        exenatide_QW_allowed: ex,
      },
      severe_liver_disease: sc.severe_liver_disease,
      uncontrolled_psychiatric_or_subuse: sc.uncontrolled_psychiatric_or_subuse,
    },
    conditional_risks: {
      gallbladder: {
        status: orNull(cr.gallbladder.status),
        last_event_months_ago: numStr(cr.gallbladder.last_event_months_ago),
        plan: orNull(cr.gallbladder.plan),
      },
      pancreatitis_risk: {
        alcohol_heavy: cr.pancreatitis_risk.alcohol_heavy,
        triglycerides_mmol_L: numStr(cr.pancreatitis_risk.triglycerides_mmol_L),
        known_gallstones: cr.pancreatitis_risk.known_gallstones,
        plan: orNull(cr.pancreatitis_risk.plan),
      },
      retinopathy: {
        history: cr.retinopathy.history,
        last_exam_date: orNull(cr.retinopathy.last_exam_date),
        proliferative: cr.retinopathy.proliferative,
        plan: orNull(cr.retinopathy.plan),
      },
      renal_dehydration_risk: {
        CKD_stage: numStr(cr.renal_dehydration_risk.CKD_stage),
        diuretics: cr.renal_dehydration_risk.diuretics,
        plan: orNull(cr.renal_dehydration_risk.plan),
      },
      thyroid_non_MTC: {
        history_goiter_nodules: cr.thyroid_non_MTC.history_goiter_nodules,
        plan: orNull(cr.thyroid_non_MTC.plan),
      },
      GI_and_eating_behavior: {
        baseline_GI_symptoms: orNull(cr.GI_and_eating_behavior.baseline_GI_symptoms),
        eating_disorder_screen: orNull(cr.GI_and_eating_behavior.eating_disorder_screen),
        plan: orNull(cr.GI_and_eating_behavior.plan),
      },
    },
    decision,
    follow_up_plan: {
      visit_interval_weeks: numStr(m.follow_up_plan.visit_interval_weeks),
      labs: m.follow_up_plan.labs,
      stop_rules: STOP_RULES,
    },
  };
  return JSON.stringify(payload, null, 2);
}

/* -------------------------------- controls -------------------------------- */

function PToggle({
  label,
  help,
  value,
  onChange,
  options,
}: {
  label: string;
  help?: string;
  value: string;
  onChange: (v: string) => void;
  options: { v: string; l: string }[];
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
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

function ModBool({ label, help, value, onChange }: { label: string; help?: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <PToggle
      label={label}
      help={help}
      value={value ? "yes" : "no"}
      onChange={(v) => onChange(v === "yes")}
      options={YN_OPTS}
    />
  );
}

function ModSelect({
  label,
  help,
  options,
  value,
  onChange,
}: {
  label: string;
  help?: string;
  options: { v: string; l: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      <Select value={value === "" ? undefined : value} onValueChange={onChange}>
        <SelectTrigger className="h-9 text-xs">
          <SelectValue placeholder="Not recorded" />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o.v} value={o.v} className="text-xs">
              {o.l}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {help && <p className="text-[11px] text-muted-foreground">{help}</p>}
    </div>
  );
}

function ModNum({
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

function ModDate({ id, label, value, onChange }: { id: string; label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs">
        {label}
      </Label>
      <Input id={id} type="date" value={value} onChange={(e) => onChange(e.target.value)} className="h-9 text-sm" />
    </div>
  );
}

function ModChecks({ label, options, value, onChange }: { label: string; options: readonly string[]; value: string[]; onChange: (v: string[]) => void }) {
  const toggle = (o: string) => onChange(value.includes(o) ? value.filter((x) => x !== o) : [...value, o]);
  return (
    <div className="space-y-2">
      <Label className="text-xs">{label}</Label>
      <div className="flex flex-wrap gap-1.5">
        {options.map((o) => (
          <label key={o} className="flex items-center gap-1.5 text-xs rounded-md border p-2 cursor-pointer">
            <Checkbox checked={value.includes(o)} onCheckedChange={() => toggle(o)} aria-label={o} />
            {o}
          </label>
        ))}
      </div>
    </div>
  );
}

function SubSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-lg border p-3 space-y-2.5">
      <div className="text-xs font-semibold">{title}</div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">{children}</div>
    </div>
  );
}

/* -------------------------------- component ------------------------------- */

export default function Glp1Modifiers() {
  const [m, setM] = useState<ModifierState>(defaultModifierState);

  const patchAbs = (k: keyof ModifierState["absolute_contraindications"], v: boolean) =>
    setM((p) => ({ ...p, absolute_contraindications: { ...p.absolute_contraindications, [k]: v } }));
  const patchSc = (patch: Partial<ModifierState["strong_cautions"]>) =>
    setM((p) => ({ ...p, strong_cautions: { ...p.strong_cautions, ...patch } }));
  const patchRenal = (eGFR: string) =>
    setM((p) => ({ ...p, strong_cautions: { ...p.strong_cautions, renal_function: { ...p.strong_cautions.renal_function, eGFR } } }));
  const patchGB = (patch: Partial<ModifierState["conditional_risks"]["gallbladder"]>) =>
    setM((p) => ({ ...p, conditional_risks: { ...p.conditional_risks, gallbladder: { ...p.conditional_risks.gallbladder, ...patch } } }));
  const patchPR = (patch: Partial<ModifierState["conditional_risks"]["pancreatitis_risk"]>) =>
    setM((p) => ({ ...p, conditional_risks: { ...p.conditional_risks, pancreatitis_risk: { ...p.conditional_risks.pancreatitis_risk, ...patch } } }));
  const patchRT = (patch: Partial<ModifierState["conditional_risks"]["retinopathy"]>) =>
    setM((p) => ({ ...p, conditional_risks: { ...p.conditional_risks, retinopathy: { ...p.conditional_risks.retinopathy, ...patch } } }));
  const patchRD = (patch: Partial<ModifierState["conditional_risks"]["renal_dehydration_risk"]>) =>
    setM((p) => ({ ...p, conditional_risks: { ...p.conditional_risks, renal_dehydration_risk: { ...p.conditional_risks.renal_dehydration_risk, ...patch } } }));
  const patchTH = (patch: Partial<ModifierState["conditional_risks"]["thyroid_non_MTC"]>) =>
    setM((p) => ({ ...p, conditional_risks: { ...p.conditional_risks, thyroid_non_MTC: { ...p.conditional_risks.thyroid_non_MTC, ...patch } } }));
  const patchGI = (patch: Partial<ModifierState["conditional_risks"]["GI_and_eating_behavior"]>) =>
    setM((p) => ({ ...p, conditional_risks: { ...p.conditional_risks, GI_and_eating_behavior: { ...p.conditional_risks.GI_and_eating_behavior, ...patch } } }));
  const patchFup = (patch: Partial<ModifierState["follow_up_plan"]>) =>
    setM((p) => ({ ...p, follow_up_plan: { ...p.follow_up_plan, ...patch } }));

  const ev = useMemo(() => evaluateModifiers(m), [m]);
  const json = useMemo(() => buildJson(m, ev.decision), [m, ev.decision]);
  const egfr = numStr(m.strong_cautions.renal_function.eGFR);
  const exOk = egfr === null ? null : egfr >= 30;
  const dmeta = DECISION_META[ev.decision];
  const { Icon: DIcon } = dmeta;

  return (
    <div>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Sliders className="w-4 h-4 text-primary" /> Risk-modifier overlay — absolute contraindications, strong cautions, conditional risks
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-[11px] text-muted-foreground">
            Structured modifier assessment: record findings — the decision derives automatically and the JSON mirrors the agreed modifier schema (key names exact). Defaults assume a clean profile; enter all positive findings for a valid decision.
          </p>

          <div className={`rounded-lg border p-3 flex flex-wrap items-center gap-2 ${dmeta.cls}`}>
            <DIcon className="w-4 h-4" />
            <span className="text-sm font-semibold">{dmeta.label}</span>
            <Badge variant="outline" className="text-[10px]">
              decision: {ev.decision}
            </Badge>
            <Badge variant="outline" className="text-[10px]">
              {ev.riskCount}/6 risk domains flagged
            </Badge>
          </div>

          {(ev.avoid.length > 0 || ev.defer.length > 0) && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3">
              <div className="text-xs font-semibold mb-1 text-destructive">Decision drivers</div>
              <ul className="text-xs list-disc ml-4 space-y-1">
                {[...ev.avoid, ...ev.defer].map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            </div>
          )}

          {ev.cautions.length > 0 && (
            <div className="rounded-lg border border-amber-500/40 bg-amber-500/5 p-3">
              <div className="text-xs font-semibold mb-1 text-amber-600">Cautions to carry into the plan</div>
              <ul className="text-xs list-disc ml-4 space-y-1">
                {ev.cautions.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="space-y-2.5">
            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Absolute contraindications</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2.5">
              <ModBool label="Personal or family history of MTC" value={m.absolute_contraindications.MTC_personal_or_family} onChange={(v) => patchAbs("MTC_personal_or_family", v)} />
              <ModBool label="MEN2 (multiple endocrine neoplasia type 2)" value={m.absolute_contraindications.MEN2} onChange={(v) => patchAbs("MEN2", v)} />
              <ModBool label="Hypersensitivity to a GLP-1RA" value={m.absolute_contraindications.hypersensitivity_to_GLP1_RA} onChange={(v) => patchAbs("hypersensitivity_to_GLP1_RA", v)} />
              <ModBool label="Pregnancy or breastfeeding" help="Includes planned pregnancy — stop per product label" value={m.absolute_contraindications.pregnancy_or_breastfeeding} onChange={(v) => patchAbs("pregnancy_or_breastfeeding", v)} />
              <ModBool label="Active eating disorder (unsafe)" help="Anorexia/bulimia or high-risk restrictive behaviour" value={m.absolute_contraindications.active_eating_disorder_unsafe} onChange={(v) => patchAbs("active_eating_disorder_unsafe", v)} />
            </div>
          </div>

          <div className="space-y-2.5">
            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Strong cautions</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
              <ModSelect label="History of pancreatitis" options={PANCREATITIS_OPTS} value={m.strong_cautions.history_of_pancreatitis} onChange={(v) => patchSc({ history_of_pancreatitis: v as PancreatitisHistory })} help="Recurrent / chronic → defer; single resolved → caution" />
              <ModSelect label="Gastroparesis severity" options={GASTROPARESIS_OPTS} value={m.strong_cautions.gastroparesis_severity} onChange={(v) => patchSc({ gastroparesis_severity: v as GpSeverity })} help="Moderate / severe → defer" />
              <ModNum id="mod-egfr" label="eGFR" unit="mL/min/1.73m²" value={m.strong_cautions.renal_function.eGFR} onChange={patchRenal} note="Exenatide is contraindicated below 30 — derived allowances shown below" />
              <div className="space-y-1.5">
                <Label className="text-xs">Exenatide renal allowances (derived)</Label>
                <div className="flex flex-wrap gap-1.5">
                  <Badge variant={exOk === true ? "default" : "outline"} className="text-[10px]">
                    BID: {exOk === null ? "eGFR not recorded" : exOk ? "allowed (≥ 30)" : "not advised (< 30)"}
                  </Badge>
                  <Badge variant={exOk === true ? "default" : "outline"} className="text-[10px]">
                    QW: {exOk === null ? "eGFR not recorded" : exOk ? "allowed (≥ 30)" : "not advised (< 30)"}
                  </Badge>
                </div>
              </div>
              <ModBool label="Severe liver disease" help="Decompensated / advanced cirrhosis" value={m.strong_cautions.severe_liver_disease} onChange={(v) => patchSc({ severe_liver_disease: v })} />
              <ModBool label="Uncontrolled psychiatric illness or substance use" value={m.strong_cautions.uncontrolled_psychiatric_or_subuse} onChange={(v) => patchSc({ uncontrolled_psychiatric_or_subuse: v })} />
            </div>
          </div>

          <div className="space-y-2.5">
            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Conditional risks</div>

            <SubSection title="Gallbladder">
              <ModSelect label="Status" options={GALLBLADDER_STATUS_OPTS} value={m.conditional_risks.gallbladder.status} onChange={(v) => patchGB({ status: v })} />
              <ModNum id="mod-gb-months" label="Last event" unit="months ago" value={m.conditional_risks.gallbladder.last_event_months_ago} onChange={(v) => patchGB({ last_event_months_ago: v })} />
              <ModSelect label="Plan" options={GALLBLADDER_PLAN_OPTS} value={m.conditional_risks.gallbladder.plan} onChange={(v) => patchGB({ plan: v })} />
            </SubSection>

            <SubSection title="Pancreatitis risk">
              <ModBool label="Heavy alcohol use" value={m.conditional_risks.pancreatitis_risk.alcohol_heavy} onChange={(v) => patchPR({ alcohol_heavy: v })} />
              <ModNum id="mod-tg" label="Triglycerides" unit="mmol/L" value={m.conditional_risks.pancreatitis_risk.triglycerides_mmol_L} onChange={(v) => patchPR({ triglycerides_mmol_L: v })} note="≥ 5.6 caution · ≥ 11.3 defer (≈ 500 / 1000 mg/dL)" />
              <ModBool label="Known gallstones" value={m.conditional_risks.pancreatitis_risk.known_gallstones} onChange={(v) => patchPR({ known_gallstones: v })} />
              <ModSelect label="Plan" options={PANCREATITIS_RISK_PLAN_OPTS} value={m.conditional_risks.pancreatitis_risk.plan} onChange={(v) => patchPR({ plan: v })} />
            </SubSection>

            <SubSection title="Retinopathy">
              <ModBool label="Retinopathy history" value={m.conditional_risks.retinopathy.history} onChange={(v) => patchRT({ history: v })} />
              <ModDate id="mod-ret-date" label="Last eye exam" value={m.conditional_risks.retinopathy.last_exam_date} onChange={(v) => patchRT({ last_exam_date: v })} />
              <ModBool label="Proliferative retinopathy" value={m.conditional_risks.retinopathy.proliferative} onChange={(v) => patchRT({ proliferative: v })} />
              <ModSelect label="Plan" options={RETINOPATHY_PLAN_OPTS} value={m.conditional_risks.retinopathy.plan} onChange={(v) => patchRT({ plan: v })} />
            </SubSection>

            <SubSection title="Renal dehydration risk">
              <ModNum id="mod-ckd" label="CKD stage" value={m.conditional_risks.renal_dehydration_risk.CKD_stage} onChange={(v) => patchRD({ CKD_stage: v })} note="1–5; stage ≥ 4 intensifies hydration precautions" />
              <ModBool label="Diuretic use" value={m.conditional_risks.renal_dehydration_risk.diuretics} onChange={(v) => patchRD({ diuretics: v })} />
              <ModSelect label="Plan" options={RENAL_DEHYD_PLAN_OPTS} value={m.conditional_risks.renal_dehydration_risk.plan} onChange={(v) => patchRD({ plan: v })} />
            </SubSection>

            <SubSection title="Thyroid (non-MTC)">
              <ModBool label="Goiter / thyroid nodule history" value={m.conditional_risks.thyroid_non_MTC.history_goiter_nodules} onChange={(v) => patchTH({ history_goiter_nodules: v })} />
              <ModSelect label="Plan" options={THYROID_PLAN_OPTS} value={m.conditional_risks.thyroid_non_MTC.plan} onChange={(v) => patchTH({ plan: v })} />
            </SubSection>

            <SubSection title="GI and eating behavior">
              <ModSelect label="Baseline GI symptoms" options={GI_SYMPTOM_OPTS} value={m.conditional_risks.GI_and_eating_behavior.baseline_GI_symptoms} onChange={(v) => patchGI({ baseline_GI_symptoms: v })} />
              <ModSelect label="Eating disorder screen" options={ED_SCREEN_OPTS} value={m.conditional_risks.GI_and_eating_behavior.eating_disorder_screen} onChange={(v) => patchGI({ eating_disorder_screen: v })} />
              <ModSelect label="Plan" options={GI_PLAN_OPTS} value={m.conditional_risks.GI_and_eating_behavior.plan} onChange={(v) => patchGI({ plan: v })} />
            </SubSection>
          </div>

          <div className="space-y-2.5">
            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Follow-up plan</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
              <ModNum id="mod-visit-interval" label="Visit interval" unit="weeks" value={m.follow_up_plan.visit_interval_weeks} onChange={(v) => patchFup({ visit_interval_weeks: v })} />
              <ModChecks label="Monitoring labs" options={LABS} value={m.follow_up_plan.labs} onChange={(v) => patchFup({ labs: v })} />
            </div>
            <div className="rounded-lg border p-3">
              <div className="text-xs font-semibold mb-1">Stop rules (fixed)</div>
              <ol className="text-xs list-decimal ml-4 space-y-0.5">
                {STOP_RULES.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ol>
            </div>
          </div>

          <div>
            <Label className="text-xs">Modifier JSON (schema v1)</Label>
            <Textarea value={json} readOnly rows={18} className="font-mono text-[11px] mt-1" />
            <div className="flex flex-wrap gap-2 mt-2">
              <Button size="sm" variant="outline" onClick={() => copyToClipboard(json, "Modifier JSON copied")}>
                <Copy className="w-4 h-4 mr-1" /> Copy JSON
              </Button>
              <Button size="sm" variant="outline" onClick={() => downloadTextFile("glp1-modifiers.json", json)}>
                <FileJson className="w-4 h-4 mr-1" /> Download .json
              </Button>
              <Button size="sm" variant="outline" onClick={() => setM(defaultModifierState())}>
                <RotateCcw className="w-4 h-4 mr-1" /> Reset
              </Button>
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