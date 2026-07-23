import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Activity,
  Syringe,
  Heart,
  Brain,
  Pill,
  AlertTriangle,
  ArrowDown,
  CheckCircle2,
  Scale,
  FileText,
  BookOpen,
  Monitor,
  Thermometer,
  MessageSquare,
} from "lucide-react";
import { AbbrText } from "@/components/AbbreviationHover";

// ─── Algorithm Step Component ───

interface AlgorithmStepProps {
  step: number;
  title: string;
  description: string;
  criteria: string;
  medications?: Array<{
    name: string;
    class: string;
    notes?: string;
    ebm?: string;
  }>;
  icon: React.ReactNode;
  tone: "primary" | "accent" | "warning" | "danger";
  isLast?: boolean;
}

function AlgorithmStep({
  step,
  title,
  description,
  criteria,
  medications,
  icon,
  tone,
  isLast,
}: AlgorithmStepProps) {
  const getToneClasses = () => {
    switch (tone) {
      case "primary": return "border-primary/30 bg-primary/5";
      case "accent": return "border-accent/30 bg-accent/5";
      case "warning": return "border-warning/30 bg-warning/10/50";
      case "danger": return "border-destructive/30 bg-destructive/5";
      default: return "border-border bg-card";
    }
  };

  const getIconColor = () => {
    switch (tone) {
      case "primary": return "text-primary";
      case "accent": return "text-accent";
      case "warning": return "text-amber-500";
      case "danger": return "text-destructive";
      default: return "text-foreground";
    }
  };

  return (
    <div className="flex flex-col">
      <div className={cn("p-4 rounded-lg border-2", getToneClasses())}>
        <div className="flex items-start gap-3">
          <div className={cn("mt-0.5", getIconColor())}>{icon}</div>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-semibold text-foreground">{title}</h3>
              <Badge variant="outline" className="text-xs">Step {step}</Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-2">{description}</p>

            {criteria && (
              <div className="mb-3">
                <span className="text-xs font-medium text-primary">Criteria: </span>
                <span className="text-xs text-muted-foreground">{criteria}</span>
              </div>
            )}

            {medications && medications.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium">Treatment Options:</p>
                <div className="grid gap-2">
                  {medications.map((med, i) => (
                    <div key={i} className="flex items-start gap-2 p-2 rounded bg-background/50">
                      <CheckCircle2 className="h-3 w-3 text-emerald-500 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-sm font-medium"><AbbrText text={med.name} /></p>
                        <p className="text-xs text-muted-foreground"><AbbrText text={med.class} /></p>
                        {med.notes && (
                          <p className="text-xs text-primary mt-0.5"><AbbrText text={med.notes} /></p>
                        )}
                        {med.ebm && (
                          <p className="text-xs text-muted-foreground mt-0.5 italic">{med.ebm}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      {!isLast && (
        <div className="flex justify-center py-2">
          <ArrowDown className="h-5 w-5 text-muted-foreground" />
        </div>
      )}
    </div>
  );
}

// ─── Treatment Algorithm Component ───
const Type2Algorithm = () => {
  const steps: AlgorithmStepProps[] = [
    {
      step: 1,
      title: "Lifestyle Interventions",
      description: "Foundation of diabetes management — prescribe at diagnosis alongside metformin",
      criteria: "All patients with type 2 diabetes regardless of HbA1c level",
      medications: [
        { name: "Medical Nutrition Therapy (MNT)", class: "Dietary Intervention", notes: "Individualized meal plan: reduced refined carbs, increased fiber. <45% calories from carbs, >20g fiber/day.", ebm: "MNT reduces HbA1c by 1.0-2.0% (ADA 2026 Standards)" },
        { name: "Physical Activity", class: "Exercise Prescription", notes: "≥150 min/week moderate aerobic (brisk walking, cycling) + 2 sessions/week resistance training.", ebm: "Exercise improves insulin sensitivity for 24-48h post-activity" },
        { name: "Weight Management", class: "Obesity Intervention", notes: "5-10% weight loss target. BMI ≥27: consider anti-obesity pharmacotherapy. BMI ≥35: consider bariatric referral.", ebm: "Durability of weight loss declines with oral meds alone" },
      ],
      icon: <Activity className="h-5 w-5" />,
      tone: "primary",
    },
    {
      step: 2,
      title: "Metformin First-Line Therapy",
      description: "Start metformin at diagnosis unless contraindicated",
      criteria: "All T2DM patients (HbA1c ≥6.5%), eGFR ≥30 mL/min/1.73m², no severe hepatic impairment",
      medications: [
        { name: "Metformin Immediate Release", class: "Biguanide", notes: "Start 500 mg once daily with largest meal. Titrate by 500 mg/week to target 1500-2000 mg/day (divided BID).", ebm: "UKPDS — metformin reduced diabetes-related death by 42% and MI by 39%" },
        { name: "Metformin Extended Release", class: "Biguanide XR", notes: "Start 500 mg once daily. Titrate to 1500-2000 mg once daily (or 1000 mg BID). Better GI tolerance.", ebm: "Equivalent efficacy to IR with fewer GI side effects" },
        { name: "Metformin HCL ER", class: "Alternative Formulation", notes: "For patients intolerant to IR due to GI side effects. Same efficacy profile.", ebm: "Monitor B12 annually — metformin associated with B12 deficiency" },
      ],
      icon: <Pill className="h-5 w-5" />,
      tone: "primary",
    },
    {
      step: 3,
      title: "ASCVD / CKD / HF Comorbidity-Driven Selection",
      description: "Choose SGLT2i or GLP-1 RA regardless of HbA1c if CV/renal disease or high risk",
      criteria: "Established ASCVD, CKD (eGFR <60 or UACR >30), HF (HFpEF or HFrEF), or high CV risk (≥10-year risk >20%)",
      medications: [
        { name: "SGLT2 Inhibitor (Add to Metformin)", class: "SGLT2i", notes: "Empagliflozin 10-25 mg, dapagliflozin 5-10 mg, canagliflozin 100-300 mg. No dose adjustment for mild CKD.", ebm: "EMPA-REG (↓CVD death 38%), CREDENCE (↓renal progression 34%), DAPA-HF (↓HF hospitalization 36%)" },
        { name: "GLP-1 Receptor Agonist (Add to Metformin)", class: "GLP-1 RA", notes: "Semaglutide 0.25→1.0 mg SC weekly, liraglutide 0.6→1.8 mg SC daily, dulaglutide 0.75→1.5 mg SC weekly.", ebm: "LEADER (↓MACE 13%), SUSTAIN-6 (↓MACE 26%), REWIND (↓MACE 12%)" },
        { name: "Combination Strategy", class: "SGLT2i + GLP-1 RA", notes: "May use together for additive CV/renal benefit. Preferred over sulfonylureas, TZDs, or DPP-4i.", ebm: "ADA/EASD consensus — SGLT2i/GLP-1 RA preferred over traditional agents in CV/CKD patients" },
      ],
      icon: <Heart className="h-5 w-5" />,
      tone: "danger",
    },
    {
      step: 4,
      title: "Weight Management Priority (Obesity-First Approach)",
      description: "For overweight/obese patients — consider weight-centric pharmacotherapy",
      criteria: "BMI ≥27 kg/m² (≥25 for Asian populations) — anti-obesity medication indicated",
      medications: [
        { name: "Tirzepatide (Dual GIP/GLP-1 RA)", class: "Incretin Dual Agonist", notes: "Start 2.5 mg SC weekly → titrate to 5-15 mg. Superior weight loss (15-20% at 15 mg dose).", ebm: "SURMOUNT-1: tirzepatide 15mg → avg weight loss 22.5% (48 lb at 72 weeks)" },
        { name: "Semaglutide 2.4 mg (Wegovy)", class: "GLP-1 RA for Weight", notes: "Titrate from 0.25→2.4 mg SC weekly. Avg weight loss 12-15%. Approved for BMI ≥30 or ≥27 + comorbidity.", ebm: "STEP-1: semaglutide 2.4mg → avg weight loss 14.9% vs 2.4% placebo" },
        { name: "Alternative Options", class: "Weight Management", notes: "Liraglutide 3.0 mg (Saxenda) — daily, modest weight loss. Orlistat — GI side effects limit use.", ebm: "Weight loss of 5-10% improves HbA1c by 0.5-1.0% and reduces CV risk" },
      ],
      icon: <Scale className="h-5 w-5" />,
      tone: "accent",
    },
    {
      step: 5,
      title: "Dual Oral Therapy (If HbA1c Not at Goal)",
      description: "Add a second oral agent if HbA1c above target after 3 months of metformin ± CV-protective agents",
      criteria: "HbA1c ≥7.5% or not at individualized goal after 3 months of metformin + lifestyle",
      medications: [
        { name: "SGLT2 Inhibitor", class: "SGLT2i (if not already on)", notes: "Empagliflozin/dapagliflozin — preferred if not already selected for ASCVD/CKD/HF indication.", ebm: "Versus DPP-4i: SGLT2i superior for weight loss, CV events, and renal outcomes" },
        { name: "DPP-4 Inhibitor", class: "DPP-4i", notes: "Sitagliptin 100 mg daily, linagliptin 5 mg daily (no renal dose adjustment). Weight neutral.", ebm: "Neutral on CV outcomes (SAVOR-TIMI, TECOS, EXAMINE). No hypoglycemia risk." },
        { name: "Pioglitazone", class: "TZD", notes: "15-45 mg daily. Durable A1c reduction. Watch for edema, weight gain, fracture risk. Avoid if HF or active bladder cancer.", ebm: "PROactive: pioglitazone ↓ CV events in T2DM with CVD" },
        { name: "Sulfonylurea", class: "SU", notes: "Gliclazide MR 30-120 mg, glimepiride 1-4 mg, glipizide 2.5-20 mg. Inexpensive but hypo risk.", ebm: "Lowest cost option but hypoglycemia (10-20% annual incidence)" },
      ],
      icon: <Pill className="h-5 w-5" />,
      tone: "warning",
    },
    {
      step: 6,
      title: "Triple Therapy (Intensification)",
      description: "If HbA1c remains above target on dual therapy",
      criteria: "HbA1c ≥8.0% on dual oral therapy, or not at target after 3-6 months of dual therapy",
      medications: [
        { name: "Triple Oral Regimen", class: "Met + SGLT2i + DPP-4i/TZD", notes: "Maximize oral agents. Avoid triple combinations with SUs or TZDs if weight gain risk is high.", ebm: "Triple therapy reduces HbA1c by 0.5-0.8% over dual therapy" },
        { name: "Add GLP-1 RA (if not on)", class: "Incretin Therapy", notes: "Switch from DPP-4i to GLP-1 RA if available. Superior efficacy and weight loss.", ebm: "GLP-1 RA superior to DPP-4i for A1c reduction (0.5% difference) and weight" },
        { name: "Consider Insulin Earlier", class: "Transition", notes: "If HbA1c ≥9.0% or catabolic symptoms, bypass triple therapy and start insulin.", ebm: "Early insulinization preserves β-cell function (ORIGIN trial)" },
      ],
      icon: <Brain className="h-5 w-5" />,
      tone: "warning",
    },
    {
      step: 7,
      title: "Insulin Initiation & Intensification",
      description: "Start insulin when oral agents ± GLP-1 RA insufficient for glycemic control",
      criteria: "HbA1c ≥9.0% (≥10% if symptomatic/catabolic → bypass oral) OR persistent hyperglycemia despite triple therapy OR acute illness/injury",
      medications: [
        { name: "Basal Insulin (First Step)", class: "Long-acting", notes: "Glargine U100 10U or 0.1-0.2 U/kg once daily. Titrate 1-2U every 3 days until fasting 80-130 mg/dL.", ebm: "Basal insulin reduces HbA1c by 1.5-2.5% when added to oral therapy" },
        { name: "GLP-1 RA + Basal (Ideal Combo)", class: "Combination Therapy", notes: "Add GLP-1 RA if not already on it. Reduces GLP-1 RA + basal is superior to basal-bolus in weight and hypo risk.", ebm: "Dual therapy: GLP-1 RA + basal insulin ↓ A1c similarly to basal-bolus with less hypo and weight gain" },
        { name: "Basal-Bolus (Intensification)", class: "Multiple Daily Injections", notes: "Add prandial rapid-acting insulin if postprandial excursions persist. Start 1-2U or 10% of basal as pre-meal bolus.", ebm: "Titrate based on CGM/SMBG patterns. Goal: TIR >70%." },
        { name: "Pre-Mixed Insulin", class: "Alternative Regimen", notes: "Biphasic insulin (30/70) BID. Less flexible but simpler for some patients. Preferred in some resource-limited settings.", ebm: "BIAsp 30 (NovoMix 30): BID regimen reduces A1c comparable to basal-bolus" },
      ],
      icon: <Syringe className="h-5 w-5" />,
      tone: "danger",
    },
    {
      step: 8,
      title: "CGM Initiation & Monitoring Protocol",
      description: "Continuous glucose monitoring for all insulin-treated T2DM patients",
      criteria: "All T2DM patients on insulin therapy qualify for CGM. Consider real-time CGM for patients with hypoglycemia unawareness or frequent hypoglycemia.",
      medications: [
        { name: "CGM Targets", class: "Glucose Metrics", notes: "TIR 70-180 mg/dL >70%. TAR >250 <5%. TBR <70 <4%. HbA1c <7% (individualized 6.5-8%).", ebm: "ATTD consensus: TIR >70% correlates with HbA1c <7%" },
        { name: "SMBG Protocol (No CGM)", class: "Blood Glucose Monitoring", notes: "Fasting + pre-meal + bedtime. Check before driving. QID minimum for insulin-treated patients.", ebm: "Structured SMBG improves HbA1c by 0.3-0.5%" },
        { name: "HbA1c Monitoring", class: "Glycemic Assessment", notes: "Every 3 months if above target. Every 6 months if stable at goal. Correlate with CGM-derived GMI.", ebm: "HbA1c target: <7% (most adults), <6.5% (newly diagnosed, long life expectancy), <8% (elderly, comorbidities)" },
      ],
      icon: <Monitor className="h-5 w-5" />,
      tone: "accent",
    },
    {
      step: 9,
      title: "Hypoglycemia Management & Prevention",
      description: "Structured approach to hypo recognition and treatment — especially for SU/insulin-treated patients",
      criteria: "All T2DM patients on insulin or SU require hypo education. Hypo unawareness risk increases with diabetes duration and autonomic neuropathy.",
      medications: [
        { name: "Level 1 (70-54 mg/dL)", class: "Mild Hypo", notes: "15g fast-acting carbs. 4 oz fruit juice, 3-4 glucose tabs, 1 tbsp honey. Recheck in 15 min.", ebm: "Rule of 15: 15g carbs, wait 15 min, recheck — repeat if still <70" },
        { name: "Level 2 (<54 mg/dL)", class: "Significant Hypo", notes: "15-20g fast carbs + long-acting snack. Do not drive. Alert family/caregiver.", ebm: "Reduce SU dose or insulin by 10-20% if recurrent hypo" },
        { name: "Level 3 (Severe)", class: "Emergency", notes: "Glucagon IM 1 mg (Baqsimi 3 mg nasal). Call 911. Prevent DDA: de-escalate SU/insulin after event.", ebm: "T2DM severe hypo: 2-4% annual incidence (much lower than T1DM)" },
      ],
      icon: <AlertTriangle className="h-5 w-5" />,
      tone: "danger",
    },
    {
      step: 10,
      title: "Sick Day & De-escalation Rules",
      description: "Illness management and medication de-escalation when glycemic control improves",
      criteria: "All patients on SGLT2i: hold during illness. All patients on SU/insulin: adjust during illness. Reassess when HbA1c <6.5% on dual/triple therapy.",
      medications: [
        { name: "SGLT2i Sick Day Rule", class: "Hold During Illness", notes: "Hold empagliflozin/dapagliflozin during acute illness (fever, GI, surgery, fasting). Resume when well and eating normally.", ebm: "Euglycemic DKA risk increased during illness/surgery on SGLT2i" },
        { name: "Metformin Sick Day", class: "Hold If Risk of AKI", notes: "Hold metformin if vomiting, diarrhea, dehydration, or contrast exposure. Restart when hydration and eGFR stable.", ebm: "Risk of lactic acidosis very low but avoid during acute illness" },
        { name: "Medication De-escalation", class: "Deprescribing", notes: "If HbA1c <6.5% on dual/triple therapy, consider stopping SU or reducing insulin. Re-evaluate need for each agent.", ebm: "Intensive therapy ↓ A1c below 6.5%: reduce agents to prevent hypo" },
      ],
      icon: <Thermometer className="h-5 w-5" />,
      tone: "warning",
    },
    {
      step: 11,
      title: "Annual Complication Screening & Prevention",
      description: "Systematic surveillance for microvascular complications and CV risk reduction",
      criteria: "Annual screening from diagnosis for all T2DM patients — T2DM may be present for years before diagnosis",
      medications: [
        { name: "Nephropathy Screening", class: "Kidney Protection", notes: "eGFR + UACR annually. ACEi/ARB if UACR >30 mg/g or hypertension. SGLT2i for nephroprotection if eGFR ≥20.", ebm: "ACEi reduces nephropathy progression by 50% in T2DM with microalbuminuria" },
        { name: "Retinopathy Screening", class: "Eye Health", notes: "Dilated fundus exam at diagnosis, then annually (q6-12 months if abnormal). Tele-retina programs effective.", ebm: "Intensive glycemic control reduces retinopathy by 25% (UKPDS, ACCORD)" },
        { name: "Cardiovascular Risk", class: "CVD Prevention", notes: "BP goal <130/80 mmHg. LDL goal <100 mg/dL (<70 if ASCVD). Aspirin if ASCVD or high 10-year risk.", ebm: "Statin therapy in T2DM reduces major vascular events by 25%" },
      ],
      icon: <Heart className="h-5 w-5" />,
      tone: "warning",
      isLast: true,
    },
  ];

  return (
    <Card className="clinical-card">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Brain className="h-4 w-4 text-primary" />
          </div>
          <CardTitle className="text-base">ADA 2026 T2DM Stepped Treatment Algorithm</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {steps.map((step, index) => (
            <AlgorithmStep key={index} {...step} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

// ─── Stepwise Therapy Selection Guide ───
const TherapySelectionGuide = () => {
  const guide = [
    {
      scenario: "New diagnosis, HbA1c <7.5%",
      therapy: "Lifestyle + Metformin monotherapy",
      recheck: "3 months",
    },
    {
      scenario: "New diagnosis, HbA1c 7.5-9.0%",
      therapy: "Lifestyle + Metformin + GLP-1 RA or SGLT2i (if ASCVD/CKD/HF/obesity)",
      recheck: "3 months",
    },
    {
      scenario: "New diagnosis, HbA1c ≥9.0%",
      therapy: "Lifestyle + Metformin + GLP-1 RA + SGLT2i combination. Consider early basal insulin if catabolic symptoms.",
      recheck: "3 months",
    },
    {
      scenario: "On metformin, HbA1c >7% (no ASCVD/CKD/HF)",
      therapy: "Add DPP-4i, TZD, or SU. Avoid weight-gaining options if BMI ≥30.",
      recheck: "3-6 months",
    },
    {
      scenario: "On metformin, HbA1c >7% (with ASCVD/CKD/HF)",
      therapy: "Add SGLT2i and/or GLP-1 RA regardless of HbA1c level.",
      recheck: "3 months",
    },
    {
      scenario: "On dual therapy, HbA1c >7.5%",
      therapy: "Add third agent (prefer different class). Consider early insulin if HbA1c >9% or catabolic.",
      recheck: "3 months",
    },
    {
      scenario: "On triple therapy, HbA1c >8%",
      therapy: "Transition to basal insulin + continue GLP-1 RA. Basal + GLP-1 RA combination preferred over basal-bolus in T2DM.",
      recheck: "3 months",
    },
    {
      scenario: "On basal insulin + GLP-1 RA, HbA1c >8%",
      therapy: "Add prandial insulin (start with 1-2U or 10% of basal per meal). Consider HCL/automated insulin delivery.",
      recheck: "3 months",
    },
  ];

  return (
    <Card className="clinical-card">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
            <BookOpen className="h-4 w-4 text-accent" />
          </div>
          <CardTitle className="text-base">Stepwise Therapy Selection by HbA1c</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {guide.map((entry, i) => (
            <div key={i} className="p-3 rounded-lg bg-muted/30 border border-border/50">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-semibold">Scenario</p>
                  <p className="text-xs font-medium">{entry.scenario}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-semibold">Therapy</p>
                  <p className="text-xs">{entry.therapy}</p>
                </div>
                <div className="text-right md:text-left">
                  <p className="text-xs text-muted-foreground uppercase font-semibold">Recheck</p>
                  <Badge variant="outline" className="text-xs">{entry.recheck}</Badge>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

// ─── De-escalation Guide ───
const DeescalationGuide = () => (
  <Card className="clinical-card">
    <CardHeader className="pb-3">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center">
          <MessageSquare className="h-4 w-4 text-success" />
        </div>
        <CardTitle className="text-base">Medication De-escalation Protocol</CardTitle>
      </div>
    </CardHeader>
    <CardContent className="space-y-3">
      <div className="p-3 rounded-lg bg-warning/10 border-l-4 border-amber-400">
        <p className="text-xs font-medium text-amber-800 mb-1">When to De-escalate</p>
        <ul className="space-y-1">
          <li className="text-xs text-amber-700">• HbA1c consistently &lt;6.5% on ≥3 agents</li>
          <li className="text-xs text-amber-700">• Recurrent hypoglycemia on SU or insulin</li>
          <li className="text-xs text-amber-700">• After significant weight loss (≥10% body weight)</li>
          <li className="text-xs text-amber-700">• After lifestyle improvement (new exercise regimen, dietary change)</li>
        </ul>
      </div>
      <div className="p-3 rounded-lg bg-success/10 border-l-4 border-green-400">
        <p className="text-xs font-medium text-success mb-1">De-escalation Order</p>
        <ol className="space-y-1 list-decimal ml-4">
          <li className="text-xs text-success">Reduce/stop SU (highest hypo risk)</li>
          <li className="text-xs text-success">Reduce insulin by 10-20% if on basal</li>
          <li className="text-xs text-success">Consider stopping TZD if weight gain/edema</li>
          <li className="text-xs text-success">Maintain metformin + SGLT2i/GLP-1 RA (CV/renal benefit)</li>
          <li className="text-xs text-success">Recheck HbA1c at 3 months after each change</li>
        </ol>
      </div>
      <div className="p-3 rounded-lg bg-destructive/10 border-l-4 border-destructive/50">
        <p className="text-xs font-medium text-destructive mb-1">Never De-escalate Without Reassessment</p>
        <p className="text-xs text-destructive">
          Re-check HbA1c and CGM data before each reduction. If HbA1c remains &lt;7% after de-escalation, consider further reduction. If HbA1c rises above target, restart the agent at previous dose and re-evaluate adherence/lifestyle changes.
        </p>
      </div>
    </CardContent>
  </Card>
);

// ─── Management Checklist ───
const ManagementChecklist = () => {
  const checklist = [
    {
      category: "Every Visit (3-6 months)",
      items: [
        "HbA1c (goal <7% or individualized target)",
        "Blood pressure (goal <130/80 mmHg)",
        "Weight and BMI assessment",
        "Review self-monitoring data (CGM/SMBG)",
        "Assess medication adherence and side effects",
        "Hypoglycemia history since last visit",
        "Smoking cessation counseling (if applicable)",
        "Foot inspection (visual + monofilament annually)",
      ],
    },
    {
      category: "Annual Screening",
      items: [
        "Lipid panel (LDL goal <100 mg/dL, <70 if ASCVD)",
        "eGFR + UACR (nephropathy screening)",
        "Dilated eye exam (retinopathy screening)",
        "Comprehensive foot exam (podiatrist referral if abnormal)",
        "TSH (especially if on TZD or GLP-1 RA)",
        "B12 level (metformin-associated deficiency)",
        "Electrocardiogram (if >40 years or CV risk factors)",
      ],
    },
    {
      category: "Immunizations",
      items: [
        "Influenza vaccine (annually)",
        "Pneumococcal vaccine (PCV20 or PCV15 + PPSV23)",
        "Hepatitis B series (if not immune)",
        "COVID-19 vaccine and boosters (per current guidelines)",
        "Tdap vaccine (every 10 years)",
        "Zoster vaccine (≥50 years — Shingrix 2 doses)",
      ],
    },
  ];

  return (
    <Card className="clinical-card">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center">
            <FileText className="h-4 w-4 text-success" />
          </div>
          <CardTitle className="text-base">T2DM Annual Care Checklist</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {checklist.map((section, i) => (
            <div key={i}>
              <p className="text-sm font-medium mb-2">{section.category}</p>
              <div className="space-y-1">
                {section.items.map((item, j) => (
                  <div key={j} className="flex items-start gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
                    <span className="text-xs text-muted-foreground">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

// ─── Main Page ───
export default function Type2TreatmentAlgorithm() {
  const [activeTab, setActiveTab] = useState<"algorithm" | "guide" | "deescalate" | "checklist">("algorithm");

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="rounded-xl p-6 text-primary-foreground" style={{ background: "var(--gradient-hero)" }}>
        <h1 className="text-3xl font-heading font-bold mb-2">Type 2 DM Treatment Algorithm</h1>
        <p className="text-primary-foreground/80">
          Step-by-step treatment algorithm from diagnosis through insulin intensification for type 2 diabetes — ADA 2026 Standards of Care
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 mb-4">
        {[
          { id: "algorithm", label: "Treatment Algorithm", icon: Brain },
          { id: "guide", label: "HbA1c-Based Selection", icon: BookOpen },
          { id: "deescalate", label: "De-escalation", icon: MessageSquare },
          { id: "checklist", label: "Checklist", icon: FileText },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "algorithm" && <Type2Algorithm />}
      {activeTab === "guide" && <TherapySelectionGuide />}
      {activeTab === "deescalate" && <DeescalationGuide />}
      {activeTab === "checklist" && <ManagementChecklist />}
    </div>
  );
}
