import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Home, Printer, Copy, Syringe, Scale, AlertTriangle, CheckCircle2,
  Info, ChevronLeft, ChevronRight, ShieldAlert, ClipboardList, PlayCircle,
  RotateCcw, Download,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Seo from "@/components/Seo";
import { downloadTextFile } from "@/lib/clinical-utils";

/* ------------------------------------------------------------------ */
/* Types & constants (mirrors the provided JSON spec)                 */
/* ------------------------------------------------------------------ */

type Goal = "weight_loss" | "glycemic_control" | "cardiovascular_or_renal_risk_reduction";
type MajorCaution =
  | "none"
  | "prior_pancreatitis"
  | "severe_gastroparesis_or_persistent_gi_symptoms"
  | "active_or_recent_gallbladder_disease"
  | "advanced_ckd_or_dehydration_risk"
  | "proliferative_or_unknown_diabetic_retinopathy"
  | "significant_eating_disorder_or_nutritional_risk";
type RetinalReview = "not_applicable" | "needed" | "done";
type ScreeningResult =
  | "eligible_to_start"
  | "review_indication"
  | "review_before_start"
  | "complete_safety_plan"
  | "defer_and_urgent_mental_health_assessment"
  | "do_not_start";

interface State {
  // indication
  bmi: string;
  hasWeightRelatedComorbidity: boolean;
  type2Diabetes: boolean;
  ascvdHfOrCkd: boolean;
  goal: Goal;
  // safety
  mtcOrMen2: boolean;
  seriousGlp1Allergy: boolean;
  pregnantOrPlanningPregnancy: boolean;
  type1DiabetesOrDka: boolean;
  majorCaution: MajorCaution;
  activeSuicidalIdeation: boolean;
  // start plan
  hba1cOrGlucoseAvailable: boolean;
  egfrAvailable: boolean;
  retinalReviewNeeded: RetinalReview;
  insulinOrSecretagogue: boolean;
  doseReductionAndGlucoseMonitoringPlan: boolean;
  dpp4Inhibitor: boolean;
  dpp4StopPlan: boolean;
  nutritionOrSarcopeniaRisk: boolean;
  nutritionSupportPlan: boolean;
  counsellingCompleted: boolean;
  followUpArranged: boolean;
  // output
  clinicianNotes: string;
}

const initialState: State = {
  bmi: "",
  hasWeightRelatedComorbidity: false,
  type2Diabetes: false,
  ascvdHfOrCkd: false,
  goal: "weight_loss",
  mtcOrMen2: false,
  seriousGlp1Allergy: false,
  pregnantOrPlanningPregnancy: false,
  type1DiabetesOrDka: false,
  majorCaution: "none",
  activeSuicidalIdeation: false,
  hba1cOrGlucoseAvailable: false,
  egfrAvailable: false,
  retinalReviewNeeded: "not_applicable",
  insulinOrSecretagogue: false,
  doseReductionAndGlucoseMonitoringPlan: false,
  dpp4Inhibitor: false,
  dpp4StopPlan: false,
  nutritionOrSarcopeniaRisk: false,
  nutritionSupportPlan: false,
  counsellingCompleted: false,
  followUpArranged: false,
  clinicianNotes: "",
};

const GOAL_LABELS: Record<Goal, string> = {
  weight_loss: "Weight loss",
  glycemic_control: "Glycemic control (T2D)",
  cardiovascular_or_renal_risk_reduction: "CV / renal risk reduction",
};

const CAUTION_LABELS: Record<MajorCaution, string> = {
  none: "None",
  prior_pancreatitis: "Prior pancreatitis",
  severe_gastroparesis_or_persistent_gi_symptoms: "Severe gastroparesis / persistent GI symptoms",
  active_or_recent_gallbladder_disease: "Active or recent gallbladder disease",
  advanced_ckd_or_dehydration_risk: "Advanced CKD / dehydration risk",
  proliferative_or_unknown_diabetic_retinopathy: "Proliferative / unknown diabetic retinopathy",
  significant_eating_disorder_or_nutritional_risk: "Significant eating disorder / nutritional risk",
};

const RESULT_META: Record<ScreeningResult, { label: string; tone: "success" | "warning" | "danger" | "info" }> = {
  eligible_to_start: { label: "Eligible to start", tone: "success" },
  review_indication: { label: "Review indication", tone: "info" },
  review_before_start: { label: "Review before start", tone: "warning" },
  complete_safety_plan: { label: "Complete safety plan", tone: "warning" },
  defer_and_urgent_mental_health_assessment: { label: "Defer — urgent mental-health assessment", tone: "danger" },
  do_not_start: { label: "Do not start", tone: "danger" },
};

/* ------------------------------------------------------------------ */
/* Rule engine (mirrors the provided JSON `rules`)                     */
/* ------------------------------------------------------------------ */

interface RuleOutcome {
  result: ScreeningResult;
  messages: string[];
}

function evaluateRules(s: State): RuleOutcome {
  const bmi = parseFloat(s.bmi);
  const hasBmi = Number.isFinite(bmi) && bmi > 0;
  const messages: string[] = [];

  // not_eligible
  const notEligible =
    (hasBmi && bmi < 27) &&
    !s.type2Diabetes &&
    !s.ascvdHfOrCkd;
  if (notEligible) {
    messages.push("No clear screened indication. Confirm the product-specific approved indication and local eligibility criteria.");
  }

  // do_not_start (absolute contraindications)
  const doNotStart =
    s.mtcOrMen2 || s.seriousGlp1Allergy || s.pregnantOrPlanningPregnancy || s.type1DiabetesOrDka;
  if (doNotStart) {
    messages.push("Do not start: contraindication or unsuitable clinical setting identified.");
  }

  // urgent mental health
  const urgentMh = s.activeSuicidalIdeation;
  if (urgentMh) {
    messages.push("Active suicidal ideation: arrange urgent mental-health assessment before initiation.");
  }

  // specialist / targeted review
  const cautionReview = s.majorCaution !== "none";
  if (cautionReview) {
    messages.push("Important caution identified. Individualize risk-benefit assessment, optimize the issue, and obtain targeted specialist input where appropriate.");
  }

  // hypoglycemia action
  const hypoAction = s.insulinOrSecretagogue && !s.doseReductionAndGlucoseMonitoringPlan;
  if (hypoAction) {
    messages.push("Before starting, document an insulin/secretagogue dose-adjustment and glucose-monitoring plan.");
  }

  // dpp4 action
  const dpp4Action = s.dpp4Inhibitor && !s.dpp4StopPlan;
  if (dpp4Action) {
    messages.push("Avoid routine concurrent DPP-4 inhibitor and GLP-1 RA use; document the discontinuation plan.");
  }

  // nutrition action
  const nutritionAction = s.nutritionOrSarcopeniaRisk && !s.nutritionSupportPlan;
  if (nutritionAction) {
    messages.push("Document a nutrition, hydration, protein, resistance-exercise, and/or dietitian support plan.");
  }

  // ready_to_start
  const ready =
    !doNotStart &&
    !urgentMh &&
    s.majorCaution === "none" &&
    s.followUpArranged;

  let result: ScreeningResult;
  if (doNotStart) result = "do_not_start";
  else if (urgentMh) result = "defer_and_urgent_mental_health_assessment";
  else if (notEligible) result = "review_indication";
  else if (cautionReview) result = "review_before_start";
  else if (hypoAction || dpp4Action || nutritionAction) result = "complete_safety_plan";
  else if (ready) result = "eligible_to_start";
  else result = "complete_safety_plan"; // safety plan incomplete (e.g. follow-up not arranged)

  if (result === "eligible_to_start") {
    messages.push("Eligible to start with product-specific titration, counselling, and planned follow-up.");
  }

  return { result, messages };
}

/* ------------------------------------------------------------------ */
/* Small UI helpers                                                    */
/* ------------------------------------------------------------------ */

function Toggle({ checked, onChange, label, hint }: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  hint?: string;
}) {
  return (
    <label className="flex items-start gap-2.5 p-2.5 rounded-lg border cursor-pointer hover:bg-muted/40 transition-colors">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 accent-primary"
      />
      <span className="min-w-0">
        <span className="text-sm font-medium block leading-snug">{label}</span>
        {hint && <span className="text-xs text-muted-foreground block mt-0.5">{hint}</span>}
      </span>
    </label>
  );
}

function StepHeader({ step, title, icon: Icon, active }: {
  step: number;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  active: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      <div
        className={cn(
          "flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold shrink-0",
          active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
        )}
      >
        {step}
      </div>
      <Icon className={cn("w-5 h-5 shrink-0", active ? "text-primary" : "text-muted-foreground")} />
      <h2 className="text-base font-semibold">{title}</h2>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Main component                                                      */
/* ------------------------------------------------------------------ */

export default function GLP1Screener() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [s, setS] = useState<State>(initialState);
  const [showResult, setShowResult] = useState(false);

  const set = <K extends keyof State>(key: K, value: State[K]) =>
    setS((prev) => ({ ...prev, [key]: value }));

  const outcome = useMemo(() => evaluateRules(s), [s]);
  const bmi = parseFloat(s.bmi);
  const hasBmi = Number.isFinite(bmi) && bmi > 0;

  const steps = [
    { id: "step_1_eligible", title: "1. Is there an indication?" },
    { id: "step_2_safe", title: "2. Is it safe to start?" },
    { id: "step_3_start_plan", title: "3. Make a safe start plan" },
  ];

  const canAdvance = (i: number): boolean => {
    if (i === 0) return hasBmi; // BMI required to judge indication
    return true;
  };

  const goNext = () => {
    if (step < 2) {
      setStep(step + 1);
    } else {
      setShowResult(true);
    }
  };

  const goBack = () => {
    if (showResult) setShowResult(false);
    else if (step > 0) setStep(step - 1);
  };

  const reset = () => {
    setS(initialState);
    setStep(0);
    setShowResult(false);
  };

  const report = useMemo(() => {
    const lines = [
      "GLP-1 RA 3-STEP EASY SCREENER",
      "--------------------------------",
      `Screening result: ${RESULT_META[outcome.result].label}`,
      "",
      "STEP 1 — INDICATION",
      `  BMI: ${hasBmi ? bmi.toFixed(1) + " kg/m²" : "-"}`,
      `  Weight-related comorbidity: ${s.hasWeightRelatedComorbidity ? "Yes" : "No"}`,
      `  Type 2 diabetes: ${s.type2Diabetes ? "Yes" : "No"}`,
      `  ASCVD / HF / CKD: ${s.ascvdHfOrCkd ? "Yes" : "No"}`,
      `  Goal: ${GOAL_LABELS[s.goal]}`,
      "",
      "STEP 2 — SAFETY",
      `  MTC / MEN2: ${s.mtcOrMen2 ? "Yes" : "No"}`,
      `  Serious GLP-1 allergy: ${s.seriousGlp1Allergy ? "Yes" : "No"}`,
      `  Pregnant / planning pregnancy: ${s.pregnantOrPlanningPregnancy ? "Yes" : "No"}`,
      `  Type 1 diabetes / DKA: ${s.type1DiabetesOrDka ? "Yes" : "No"}`,
      `  Major caution: ${CAUTION_LABELS[s.majorCaution]}`,
      `  Active suicidal ideation: ${s.activeSuicidalIdeation ? "Yes" : "No"}`,
      "",
      "STEP 3 — START PLAN",
      `  HbA1c / glucose available: ${s.hba1cOrGlucoseAvailable ? "Yes" : "No"}`,
      `  eGFR available: ${s.egfrAvailable ? "Yes" : "No"}`,
      `  Retinal review: ${s.retinalReviewNeeded}`,
      `  Insulin / secretagogue: ${s.insulinOrSecretagogue ? "Yes" : "No"}`,
      `  Dose-reduction + glucose-monitoring plan: ${s.doseReductionAndGlucoseMonitoringPlan ? "Yes" : "No"}`,
      `  DPP-4 inhibitor: ${s.dpp4Inhibitor ? "Yes" : "No"}`,
      `  DPP-4 stop plan: ${s.dpp4StopPlan ? "Yes" : "No"}`,
      `  Nutrition / sarcopenia risk: ${s.nutritionOrSarcopeniaRisk ? "Yes" : "No"}`,
      `  Nutrition support plan: ${s.nutritionSupportPlan ? "Yes" : "No"}`,
      `  Counselling completed: ${s.counsellingCompleted ? "Yes" : "No"}`,
      `  Follow-up arranged: ${s.followUpArranged ? "Yes" : "No"}`,
      "",
      "ACTIONS / MESSAGES",
      ...outcome.messages.map((m) => `  • ${m}`),
      "",
      "CLINICIAN NOTES",
      s.clinicianNotes ? s.clinicianNotes : "(none)",
      "",
      "Note: A screening aid only. Use product-specific labeling, local protocols, and clinical judgement; it does not replace a full assessment.",
    ];
    return lines.join("\n");
  }, [s, outcome, bmi, hasBmi]);

  const copyReport = async () => {
    try { await navigator.clipboard.writeText(report); } catch { /* ignore */ }
  };

  const toneClasses: Record<RuleOutcome["result"], string> = {
    eligible_to_start: "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400",
    review_indication: "bg-sky-500/10 border-sky-500/30 text-sky-700 dark:text-sky-400",
    review_before_start: "bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-400",
    complete_safety_plan: "bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-400",
    defer_and_urgent_mental_health_assessment: "bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-400",
    do_not_start: "bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-400",
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Seo
        title="GLP-1 RA 3-Step Easy Screener"
        description="Brief pre-initiation triage for GLP-1 receptor agonists in obesity and/or type 2 diabetes."
      />
      <div className="max-w-3xl mx-auto p-4 sm:p-6 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <div className="flex items-start gap-2">
            <Syringe className="w-5 h-5 text-primary mt-1" />
            <div>
              <h1 className="text-xl sm:text-2xl font-semibold">GLP-1 RA 3-Step Easy Screener</h1>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                Brief pre-initiation triage for GLP-1 receptor agonists in obesity and/or type 2 diabetes.
              </p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={() => navigate("/")}>
            <Home className="w-4 h-4 mr-1" /> Home
          </Button>
        </div>

        {/* Disclaimer */}
        <div className="flex items-start gap-2 p-3 rounded-lg border border-muted bg-muted/20 text-xs text-muted-foreground">
          <Info className="w-4 h-4 shrink-0 mt-0.5" />
          <p>
            A screening aid only. Use product-specific labeling, local protocols, and clinical judgement;
            it does not replace a full assessment.
          </p>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-2">
          {steps.map((st, i) => {
            const active = showResult ? i === 2 : i === step;
            const done = showResult ? true : i < step;
            return (
              <div key={st.id} className="flex-1">
                <div
                  className={cn(
                    "h-1.5 rounded-full transition-colors",
                    done || active ? "bg-primary" : "bg-muted"
                  )}
                />
                <div className={cn(
                  "text-[11px] mt-1 truncate",
                  active ? "text-primary font-medium" : "text-muted-foreground"
                )}>
                  {st.title}
                </div>
              </div>
            );
          })}
        </div>

        {/* Step content */}
        {!showResult && (
          <Card>
            <CardContent className="p-4 sm:p-5 space-y-4">
              {step === 0 && (
                <>
                  <StepHeader step={1} title="Is there an indication?" icon={Scale} active />
                  <div>
                    <Label htmlFor="bmi">BMI (kg/m²)</Label>
                    <Input
                      id="bmi"
                      type="number"
                      step="0.1"
                      min="0"
                      value={s.bmi}
                      onChange={(e) => set("bmi", e.target.value)}
                      placeholder="e.g. 32.5"
                      className="mt-1"
                    />
                    <p className="text-[11px] text-muted-foreground mt-1">
                      Required. GLP-1 RA is typically indicated at BMI ≥27 with a weight-related comorbidity, or BMI ≥30 (obesity), or for T2D / ASCVD / HF / CKD.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Toggle
                      checked={s.hasWeightRelatedComorbidity}
                      onChange={(v) => set("hasWeightRelatedComorbidity", v)}
                      label="Weight-related comorbidity present"
                      hint="e.g. hypertension, dyslipidemia, OSA, NAFLD/MASLD, osteoarthritis, prediabetes"
                    />
                    <Toggle
                      checked={s.type2Diabetes}
                      onChange={(v) => set("type2Diabetes", v)}
                      label="Type 2 diabetes"
                    />
                    <Toggle
                      checked={s.ascvdHfOrCkd}
                      onChange={(v) => set("ascvdHfOrCkd", v)}
                      label="ASCVD, heart failure, or CKD"
                      hint="Established atherosclerotic CVD, HF, or chronic kidney disease"
                    />
                  </div>
                  <div>
                    <Label>Primary goal</Label>
                    <Select value={s.goal} onValueChange={(v) => set("goal", v as Goal)}>
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {(Object.keys(GOAL_LABELS) as Goal[]).map((g) => (
                          <SelectItem key={g} value={g}>{GOAL_LABELS[g]}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}

              {step === 1 && (
                <>
                  <StepHeader step={2} title="Is it safe to start?" icon={ShieldAlert} active />
                  <div className="space-y-2">
                    <Toggle
                      checked={s.mtcOrMen2}
                      onChange={(v) => set("mtcOrMen2", v)}
                      label="Personal/family history of MTC or MEN2"
                      hint="Medullary thyroid carcinoma or multiple endocrine neoplasia type 2 — contraindicated"
                    />
                    <Toggle
                      checked={s.seriousGlp1Allergy}
                      onChange={(v) => set("seriousGlp1Allergy", v)}
                      label="Serious GLP-1 allergy"
                      hint="Anaphylaxis / angioedema to a GLP-1 RA — contraindicated"
                    />
                    <Toggle
                      checked={s.pregnantOrPlanningPregnancy}
                      onChange={(v) => set("pregnantOrPlanningPregnancy", v)}
                      label="Pregnant or planning pregnancy"
                      hint="Contraindicated; discontinue before conception"
                    />
                    <Toggle
                      checked={s.type1DiabetesOrDka}
                      onChange={(v) => set("type1DiabetesOrDka", v)}
                      label="Type 1 diabetes or DKA"
                      hint="Not indicated for T1D; not for DKA"
                    />
                  </div>
                  <div>
                    <Label>Major caution</Label>
                    <Select
                      value={s.majorCaution}
                      onValueChange={(v) => set("majorCaution", v as MajorCaution)}
                    >
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {(Object.keys(CAUTION_LABELS) as MajorCaution[]).map((c) => (
                          <SelectItem key={c} value={c}>{CAUTION_LABELS[c]}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-[11px] text-muted-foreground mt-1">
                      Selecting a caution flags a targeted review before start.
                    </p>
                  </div>
                  <Toggle
                    checked={s.activeSuicidalIdeation}
                    onChange={(v) => set("activeSuicidalIdeation", v)}
                    label="Active suicidal ideation"
                    hint="If present, arrange urgent mental-health assessment before initiation"
                  />
                </>
              )}

              {step === 2 && (
                <>
                  <StepHeader step={3} title="Make a safe start plan" icon={ClipboardList} active />
                  <div className="grid gap-2 sm:grid-cols-2">
                    <Toggle
                      checked={s.hba1cOrGlucoseAvailable}
                      onChange={(v) => set("hba1cOrGlucoseAvailable", v)}
                      label="HbA1c / glucose available"
                    />
                    <Toggle
                      checked={s.egfrAvailable}
                      onChange={(v) => set("egfrAvailable", v)}
                      label="eGFR available"
                    />
                  </div>
                  <div>
                    <Label>Retinal review</Label>
                    <Select
                      value={s.retinalReviewNeeded}
                      onValueChange={(v) => set("retinalReviewNeeded", v as RetinalReview)}
                    >
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="not_applicable">Not applicable</SelectItem>
                        <SelectItem value="needed">Needed</SelectItem>
                        <SelectItem value="done">Done</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Toggle
                      checked={s.insulinOrSecretagogue}
                      onChange={(v) => set("insulinOrSecretagogue", v)}
                      label="On insulin or a secretagogue"
                      hint="Sulfonylurea / glinide — hypoglycemia risk"
                    />
                    {s.insulinOrSecretagogue && (
                      <Toggle
                        checked={s.doseReductionAndGlucoseMonitoringPlan}
                        onChange={(v) => set("doseReductionAndGlucoseMonitoringPlan", v)}
                        label="Dose-reduction + glucose-monitoring plan documented"
                      />
                    )}
                    <Toggle
                      checked={s.dpp4Inhibitor}
                      onChange={(v) => set("dpp4Inhibitor", v)}
                      label="On a DPP-4 inhibitor"
                    />
                    {s.dpp4Inhibitor && (
                      <Toggle
                        checked={s.dpp4StopPlan}
                        onChange={(v) => set("dpp4StopPlan", v)}
                        label="DPP-4 discontinuation plan documented"
                      />
                    )}
                    <Toggle
                      checked={s.nutritionOrSarcopeniaRisk}
                      onChange={(v) => set("nutritionOrSarcopeniaRisk", v)}
                      label="Nutrition / sarcopenia risk"
                    />
                    {s.nutritionOrSarcopeniaRisk && (
                      <Toggle
                        checked={s.nutritionSupportPlan}
                        onChange={(v) => set("nutritionSupportPlan", v)}
                        label="Nutrition / protein / resistance-exercise / dietitian plan documented"
                      />
                    )}
                    <Toggle
                      checked={s.counsellingCompleted}
                      onChange={(v) => set("counsellingCompleted", v)}
                      label="Counselling completed"
                      hint="GI side effects, injection technique, expectations"
                    />
                    <Toggle
                      checked={s.followUpArranged}
                      onChange={(v) => set("followUpArranged", v)}
                      label="Follow-up arranged"
                      hint="Required for an eligible-to-start result"
                    />
                  </div>
                </>
              )}

              {/* Nav buttons */}
              <div className="flex items-center justify-between pt-2">
                <Button variant="ghost" size="sm" onClick={goBack} disabled={step === 0}>
                  <ChevronLeft className="w-4 h-4 mr-1" /> Back
                </Button>
                <Button size="sm" onClick={goNext} disabled={!canAdvance(step)}>
                  {step < 2 ? (
                    <>Next <ChevronRight className="w-4 h-4 ml-1" /></>
                  ) : (
                    <>Review result <PlayCircle className="w-4 h-4 ml-1" /></>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Result */}
        {showResult && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                {outcome.result === "eligible_to_start" ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                )}
                Screening result
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className={cn("rounded-lg border p-3", toneClasses[outcome.result])}>
                <div className="font-semibold text-sm">{RESULT_META[outcome.result].label}</div>
                <ul className="mt-2 space-y-1.5 text-xs">
                  {outcome.messages.map((m, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="mt-0.5">•</span>
                      <span>{m}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Summary chips */}
              <div className="flex flex-wrap gap-1.5">
                <Badge variant="outline" className="text-[11px]">BMI {hasBmi ? bmi.toFixed(1) : "—"}</Badge>
                <Badge variant="outline" className="text-[11px]">T2D {s.type2Diabetes ? "Yes" : "No"}</Badge>
                <Badge variant="outline" className="text-[11px]">Caution: {CAUTION_LABELS[s.majorCaution]}</Badge>
                <Badge variant="outline" className="text-[11px]">Follow-up {s.followUpArranged ? "arranged" : "not arranged"}</Badge>
              </div>

              {/* Clinician notes */}
              <div>
                <Label htmlFor="notes" className="text-xs">Clinician notes</Label>
                <Textarea
                  id="notes"
                  value={s.clinicianNotes}
                  onChange={(e) => set("clinicianNotes", e.target.value)}
                  rows={3}
                  placeholder="Optional notes for the summary / report…"
                  className="mt-1 text-sm"
                />
              </div>

              {/* Report */}
              <div>
                <Label className="text-xs">Summary / report</Label>
                <Textarea value={report} readOnly rows={10} className="font-mono text-[11px] mt-1" />
                <div className="flex flex-wrap gap-2 mt-2">
                  <Button size="sm" variant="outline" onClick={() => window.print()}>
                    <Printer className="w-4 h-4 mr-1" /> Print / PDF
                  </Button>
                  <Button size="sm" variant="outline" onClick={copyReport}>
                    <Copy className="w-4 h-4 mr-1" /> Copy
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => downloadTextFile("glp1-screener.txt", report)}>
                    <Download className="w-4 h-4 mr-1" /> Download .txt
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <Button variant="ghost" size="sm" onClick={goBack}>
                  <ChevronLeft className="w-4 h-4 mr-1" /> Edit answers
                </Button>
                <Button variant="outline" size="sm" onClick={reset}>
                  <RotateCcw className="w-4 h-4 mr-1" /> Start over
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
