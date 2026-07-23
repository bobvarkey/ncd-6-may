import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import {
  Activity,
  Syringe,
  Heart,
  Brain,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  ArrowDown,
  CheckCircle2,
  Droplet,
  Pill,
  Thermometer,
  Monitor,
  FileText,
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
  showInsulinRef?: boolean;
  onToggleInsulinRef?: () => void;
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
  showInsulinRef,
  onToggleInsulinRef,
}: AlgorithmStepProps) {
  const getToneClasses = () => {
    switch (tone) {
      case "primary":
        return "border-primary/30 bg-primary/5";
      case "accent":
        return "border-accent/30 bg-accent/5";
      case "warning":
        return "border-warning/30 bg-warning/10/50";
      case "danger":
        return "border-destructive/30 bg-destructive/5";
      default:
        return "border-border bg-card";
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
                {isLast && onToggleInsulinRef && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onToggleInsulinRef}
                    className="mt-2"
                  >
                    {showInsulinRef ? "Hide Insulin Reference" : "Show Insulin Reference Charts"}
                    <ChevronRight className={`h-4 w-4 ml-1 transition-transform ${showInsulinRef ? "rotate-90" : ""}`} />
                  </Button>
                )}
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

// ─── Insulin Brand Reference Data ───

const INSULIN_TYPES_DATA = [
  {
    category: "Rapid-Acting (Onset: 10-15 min, Peak: 1-2h, Duration: 3-5h)",
    items: [
      { generic: "Insulin Lispro", usBrand: "Humalog", indianBrands: ["Humalog", "Lispro (Biocon)"], note: "Mealtime insulin. Inject 0-15 min before meals. Most commonly used in insulin pumps." },
      { generic: "Insulin Aspart", usBrand: "NovoLog / Fiasp", indianBrands: ["NovoRapid", "NovoLog", "Aspart (Wockhardt)"], note: "Fiasp = faster-acting aspart with niacinamide. NovoRapid is widely available in India." },
      { generic: "Insulin Glulisine", usBrand: "Apidra", indianBrands: ["Apidra"], note: "Alternative to lispro/aspart. May have slightly faster onset. Less commonly used in India." },
    ],
  },
  {
    category: "Short-Acting / Regular (Onset: 30 min, Peak: 2-4h, Duration: 5-8h)",
    items: [
      { generic: "Regular Insulin (Soluble)", usBrand: "Humulin R / Novolin R", indianBrands: ["Actrapid", "Humulin R", "Wosulin R", "Insugen R", "Insuman Rapid"], note: "IV compatible. Used for sliding scales, DKA management, and pre-meal coverage. Inject 30 min before meals." },
    ],
  },
  {
    category: "Intermediate-Acting (Onset: 2-4h, Peak: 4-10h, Duration: 10-18h)",
    items: [
      { generic: "NPH Insulin (Isophane)", usBrand: "Humulin N / Novolin N", indianBrands: ["Humulin N", "Wosulin N", "Insugen N", "Insuman Basal", "NPH (Biocon)"], note: "Cloudy suspension — must be resuspended before use. Traditionally BID dosing. Higher variability vs analogs." },
    ],
  },
  {
    category: "Long-Acting Basal (Onset: 1-2h, Peak: Flat/None, Duration: 18-24+h)",
    items: [
      { generic: "Insulin Glargine U100", usBrand: "Lantus / Basaglar", indianBrands: ["Lantus", "Basalog", "Glaritus (Wockhardt)", "Glargine (Biocon)", "Toujeo (U300)"], note: "Most prescribed basal insulin. Flat profile, once-daily dosing. U300 version has longer duration (36h)." },
      { generic: "Insulin Detemir", usBrand: "Levemir", indianBrands: ["Levemir"], note: "Duration slightly shorter than glargine (~16-20h). May require BID dosing in some patients. Lower weight gain vs glargine." },
      { generic: "Insulin Degludec", usBrand: "Tresiba", indianBrands: ["Tresiba", "Degludec (Biocon)"], note: "Ultra-long (42h). Flexible dosing (8-40h window). Lower hypoglycemia risk vs glargine. U100/U200 available." },
    ],
  },
  {
    category: "Pre-Mixed Insulins (Convenience, less flexible)",
    items: [
      { generic: "Biphasic Insulin Aspart 30 (30% aspart, 70% protamine aspart)", usBrand: "NovoMix 30", indianBrands: ["NovoMix 30"], note: "30/70 mix. BID dosing." },
      { generic: "Biphasic Human Insulin 30/70 (30% regular, 70% NPH)", usBrand: "Humulin 70/30", indianBrands: ["Humulin 70/30", "Wosulin 30/70", "Insugen 30/70", "Mixtard 30"], note: "Traditional mix. Lower cost. BID dosing." },
      { generic: "Biphasic Insulin Lispro 25/50", usBrand: "Humalog Mix 25/50", indianBrands: ["Humalog Mix 25"], note: "25% lispro / 75% protamine lispro." },
    ],
  },
  {
    category: "Concentrated Insulins (for severe insulin resistance)",
    items: [
      { generic: "Insulin Glargine U300", usBrand: "Toujeo", indianBrands: ["Toujeo"], note: "3× concentrated glargine. 300 U/mL. Longer/flatter than U100." },
      { generic: "Insulin Degludec U200", usBrand: "Tresiba U200", indianBrands: ["Tresiba U200"], note: "2× concentrated degludec. Same profile as U100, lower injection volume." },
    ],
  },
];

// ─── Insulin Tooltip Component ───
function InsulinTooltip({ brand }: { brand: string }) {
  const found = INSULIN_TYPES_DATA.flatMap(c => c.items).find(
    i => i.generic.includes(brand) || i.usBrand.includes(brand) || i.indianBrands.some(b => b.includes(brand))
  );
  if (!found) return null;
  return (
    <div className="group relative inline-block">
      <span className="text-foreground font-medium underline decoration-dotted decoration-muted-foreground/40 cursor-help">{brand}</span>
      <div className="absolute left-0 top-full mt-1 w-72 hidden group-hover:block z-50">
        <div className="bg-popover text-popover-foreground text-xs p-3 rounded-lg shadow-xl border border-border">
          <p className="font-semibold mb-1">{found.generic}</p>
          <p className="text-muted-foreground mb-1.5">
            <span className="font-medium text-foreground">US: </span>{found.usBrand}
          </p>
          <p className="text-muted-foreground mb-1.5">
            <span className="font-medium text-foreground">🇮🇳 India: </span>{found.indianBrands.join(", ")}
          </p>
          <p className="text-muted-foreground">{found.note}</p>
        </div>
      </div>
    </div>
  );
}

// ─── Insulin Reference Section ───
const InsulinReferenceSection = () => (
  <div className="mt-4">
    <Collapsible defaultOpen>
      <CollapsibleTrigger asChild>
        <Button variant="outline" className="w-full justify-between gap-2">
          <span className="flex items-center gap-2"><Syringe className="h-4 w-4" /> Insulin Brand Name Reference (US & India)</span>
          <ChevronDown className="h-4 w-4" />
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-3 space-y-4">
        {INSULIN_TYPES_DATA.map((cat, ci) => (
          <div key={ci} className="p-3 rounded-lg border border-border bg-card/50">
            <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">{cat.category}</p>
            <div className="space-y-2">
              {cat.items.map((item, ii) => (
                <div key={ii} className="p-2.5 rounded-lg bg-muted/30 border border-border/40">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground uppercase font-semibold mb-0.5">Generic</p>
                      <p className="text-foreground">{item.generic.split(" (")[0]}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase font-semibold mb-0.5">US Brand</p>
                      <p className="text-foreground"><AbbrText text={item.usBrand} /></p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase font-semibold mb-0.5">🇮🇳 India</p>
                      <p className="text-foreground"><AbbrText text={item.indianBrands.join(", ")} /></p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1.5"><AbbrText text={item.note} /></p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </CollapsibleContent>
    </Collapsible>
  </div>
);

// ─── Tidal Dosing & CGM Integration Panel ───
const TidalDosingPanel = () => (
  <Card className="clinical-card">
    <CardHeader className="pb-3">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <Monitor className="h-4 w-4 text-primary" />
        </div>
        <CardTitle className="text-base">Tidal Dosing & CGM Integration</CardTitle>
      </div>
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
        <p className="text-sm font-medium mb-2">Tidal Dosing Strategy</p>
        <p className="text-xs text-muted-foreground">
          Adjust basal insulin in small increments (0.5-1U or 5-10% per adjustment) every 3-5 days based on CGM fasting glucose patterns. Target fasting glucose 80-130 mg/dL before adjusting.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="p-3 rounded-lg bg-accent/5 border border-accent/20">
          <p className="text-xs font-medium mb-1.5">Fasting Pattern → Action</p>
          <ul className="space-y-1">
            <li className="text-xs text-muted-foreground">• <strong>Above target 3+ days:</strong> ↑ basal by 5-10%</li>
            <li className="text-xs text-muted-foreground">• <strong>Below target 2+ days:</strong> ↓ basal by 5-10%</li>
            <li className="text-xs text-muted-foreground">• <strong>Nocturnal hypo:</strong> ↓ basal by 10-20%</li>
            <li className="text-xs text-muted-foreground">• <strong>Dawn phenomenon:</strong> Consider split basal or higher evening dose</li>
          </ul>
        </div>
        <div className="p-3 rounded-lg bg-success/5 border border-success/20">
          <p className="text-xs font-medium mb-1.5">CGM Metrics to Track Weekly</p>
          <ul className="space-y-1">
            <li className="text-xs text-muted-foreground">• TIR 70-180 mg/dL → Goal: &gt;70%</li>
            <li className="text-xs text-muted-foreground">• Time above 180 mg/dL → Goal: &lt;25%</li>
            <li className="text-xs text-muted-foreground">• Time below 70 mg/dL → Goal: &lt;4%</li>
            <li className="text-xs text-muted-foreground">• Coefficient of Variation → Goal: &lt;36%</li>
          </ul>
        </div>
      </div>
      <div className="p-3 rounded-lg bg-warning/10 border-l-4 border-warning/50">
        <p className="text-xs font-medium text-yellow-800">ICR & CF Adjustment Guidance</p>
        <p className="text-xs text-muted-foreground mt-1">
          If postprandial excursions persist despite correct bolus timing, decrease ICR by 5g (e.g., 1:12 → 1:10). If hypoglycemia occurs within 4h of meals, increase ICR by 5g. Correction factor adjustments: if correction fails to bring glucose to target, decrease CF by 5-10 mg/dL/U.
        </p>
      </div>
    </CardContent>
  </Card>
);

// ─── Pump Therapy Panel ───
const PumpTherapyPanel = () => (
  <Card className="clinical-card">
    <CardHeader className="pb-3">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
          <Activity className="h-4 w-4 text-accent" />
        </div>
        <CardTitle className="text-base">Advanced Insulin Delivery: Pumps & Hybrid Closed-Loop</CardTitle>
      </div>
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
          <p className="text-xs font-medium mb-2">CSII Pump Candidates</p>
          <ul className="space-y-1">
            <li className="text-xs text-muted-foreground">• Recurrent severe hypoglycemia</li>
            <li className="text-xs text-muted-foreground">• Dawn phenomenon (morning hyperglycemia)</li>
            <li className="text-xs text-muted-foreground">• Glycemic variability despite MDI optimization</li>
            <li className="text-xs text-muted-foreground">• Need for flexible dosing (variable schedules)</li>
            <li className="text-xs text-muted-foreground">• Pregnancy (T1D preconception or gestational)</li>
            <li className="text-xs text-muted-foreground">• Gastroparesis (micro-dosing ability)</li>
          </ul>
        </div>
        <div className="p-3 rounded-lg bg-accent/10/50 border border-purple-200/50">
          <p className="text-xs font-medium mb-2">Hybrid Closed-Loop (HCL) Systems</p>
          <ul className="space-y-1">
            <li className="text-xs text-muted-foreground">• MiniMed 780G (Medtronic) — SmartGuard auto-correction</li>
            <li className="text-xs text-muted-foreground">• t:slim X2 + Control-IQ (Tandem/Dexcom) — Basal auto-adjust</li>
            <li className="text-xs text-muted-foreground">• Omnipod 5 (Insulet) — Tubeless HCL with Dexcom G6</li>
            <li className="text-xs text-muted-foreground">• CamAPS FX (Cambridge) — Android-based, adaptive algorithm</li>
            <li className="text-xs text-muted-foreground">• OpenAPS / AndroidAPS — DIY systems (informed patients)</li>
          </ul>
        </div>
      </div>
      <div className="p-3 rounded-lg bg-warning/10 border-l-4 border-amber-400">
        <p className="text-xs font-medium text-amber-800">Safety Considerations</p>
        <p className="text-xs text-muted-foreground mt-1">
          Always maintain backup insulin pens/syringes. Rotate infusion set every 2-3 days. Monitor for lipodystrophy. Check for ketones if unexplained hyperglycemia occurs. Never disconnect pump for &gt;2h without basal coverage.
        </p>
      </div>
    </CardContent>
  </Card>
);

// ─── Main Type 1 Treatment Algorithm Component ───
const Type1Algorithm = () => {
  const [showInsulinRef, setShowInsulinRef] = useState(false);

  const steps: AlgorithmStepProps[] = [
    {
      step: 1,
      title: "Confirm Diagnosis & Start Insulin Immediately",
      description: "All new-onset T1DM patients require insulin from diagnosis — no 'honeymoon' observation period",
      criteria: "Symptomatic hyperglycemia + random glucose ≥200 mg/dL + positive antibodies (GAD, IA-2, ZnT8) or C-peptide <0.2 nmol/L",
      medications: [
        { name: "Basal-Bolus Regimen (MDI)", class: "Standard of Care", notes: "Start insulin same day as diagnosis. Target 0.3-0.5 U/kg/day total", ebm: "ADA 2026 Standards of Care — Section 9" },
        { name: "CSII (Insulin Pump)", class: "Advanced Delivery", notes: "Consider in motivated patients, recurrent DKA, or severe hypoglycemia", ebm: "DCCT/EDIC — intensive therapy reduces complications" },
      ],
      icon: <Syringe className="h-5 w-5" />,
      tone: "danger",
    },
    {
      step: 2,
      title: "TDD Calculation & Basal Insulin Initiation",
      description: "Calculate total daily dose (TDD) and establish basal insulin at ~45% of TDD",
      criteria: "Calculate: 0.4-0.6 U/kg/day TDD. Lower end (0.4) for non-obese, higher (0.6) for insulin-resistant states, illness, puberty",
      medications: [
        { name: "Basal Insulin (TDD × 45%)", class: "Long-acting", notes: "Glargine U100 (1× daily) or Degludec (1× daily) — flat profile", ebm: "50% of TDD for new-onset, adjust based on fasting glucose" },
        { name: "NPH Insulin", class: "Intermediate-acting", notes: "BID dosing (2/3 AM, 1/3 PM). Higher variability vs analogs", ebm: "Cost-effective alternative, but higher hypo risk" },
        { name: "Basal Dose Titration", class: "Tidal Dosing", notes: "↑/↓ by 1-2U or 5-10% every 3-5 days. Target fasting glucose 80-130 mg/dL", ebm: "Small, gradual adjustments reduce hypo risk" },
      ],
      icon: <Droplet className="h-5 w-5" />,
      tone: "primary",
    },
    {
      step: 3,
      title: "Bolus Insulin — ICR & Correction Factor",
      description: "Establish insulin-to-carb ratio (ICR) and correction factor (CF) for meal coverage",
      criteria: "ICR default: 1U per 10-15g carbs. CF default: 1700 rule (1700 ÷ TDD = mg/dL drop per unit)",
      medications: [
        { name: "ICR Calculation", class: "Insulin-to-Carb Ratio", notes: "Standard: 1U:12g (1:10 for resistance, 1:15 for sensitivity)", ebm: "Adjust based on 4h postprandial CGM data" },
        { name: "Correction Factor (CF)", class: "1700 Rule", notes: "Example: TDD 40U → CF = 1700/40 ≈ 42 mg/dL drop per 1U", ebm: "Alternative: 2000 rule for insulin-sensitive patients" },
        { name: "Bolus Timing", class: "Pre-meal", notes: "Inject 10-15 min BEFORE meals (rapid-acting). For low BG, inject after meal begins", ebm: "Preprandial dosing reduces post-meal spikes by 30-40%" },
      ],
      icon: <Pill className="h-5 w-5" />,
      tone: "primary",
    },
    {
      step: 4,
      title: "CGM Initiation & Glucose Targets",
      description: "Continuous glucose monitoring is the standard of care — start at diagnosis or within 1-2 weeks",
      criteria: "All patients with T1DM qualify for CGM (real-time or intermittent scanning). Medicare/insurance covers with T1D diagnosis",
      medications: [
        { name: "Glucose Targets", class: "ADA Standards", notes: "Premeal: 80-130 mg/dL · Postmeal <180 · Bedtime: 100-140 · TIR >70%", ebm: "ADA 2026 — individualized by age and hypo awareness" },
        { name: "Time in Range Goals", class: "CGM Metrics", notes: "TIR >70% · TR <70: <4% · TR <54: <1% · TAR >250: <5%", ebm: "Advanced Technologies & Treatments for Diabetes (ATTD) 2024" },
        { name: "CGM Device Selection", class: "Monitoring", notes: "Dexcom G7, FreeStyle Libre 3, Medtronic Guardian 4 — choose by HCL compatibility", ebm: "CGM use reduces HbA1c by 0.5% and severe hypo by 40%" },
      ],
      icon: <Monitor className="h-5 w-5" />,
      tone: "accent",
    },
    {
      step: 5,
      title: "Hypoglycemia Management Protocol",
      description: "Structured response to hypo — level-based treatment algorithm",
      criteria: "All T1DM patients require written hypoglycemia action plan. Educate family/school/workplace on glucagon use",
      medications: [
        { name: "Level 1 (70-54 mg/dL)", class: "Mild Hypo", notes: "15g fast carbs: 4oz juice, 3-4 glucose tabs, 1 tbsp honey. Recheck in 15 min. Repeat if still <70.", ebm: "Rule of 15: 15g carbs, wait 15 min, recheck" },
        { name: "Level 2 (<54 mg/dL)", class: "Significant Hypo", notes: "15-20g fast carbs + complex carb/protein snack. Do NOT drive. Alert caregiver.", ebm: "Hypo unaware patients need higher BG targets" },
        { name: "Level 3 (Severe)", class: "Emergency", notes: "Glucagon IM 1mg or IN 3mg (nasal). Call 911. Once conscious, give fast carbs + complex snack.", ebm: "Nasal glucagon (Baqsimi) is caregiver-friendly" },
      ],
      icon: <AlertTriangle className="h-5 w-5" />,
      tone: "danger",
    },
    {
      step: 6,
      title: "Sick Day Rules & DKA Prevention",
      description: "Illness management — critical for DKA prevention in T1DM",
      criteria: "Any illness (fever, infection, GI upset) — glucose management changes immediately",
      medications: [
        { name: "NEVER Skip Basal", class: "Critical Rule", notes: "Continue basal insulin even if not eating. Illness increases insulin requirement.", ebm: "DKA occurs within 4-8h of missed basal in T1DM" },
        { name: "Monitor q4h", class: "During Illness", notes: "Check glucose every 4 hours. Test blood ketones if glucose >250 mg/dL.", ebm: "Ketones ≥1.5 mmol/L = ER evaluation" },
        { name: "Hydration", class: "Fluid Management", notes: "Minimum 2-3 L/day sugar-free fluids. Sip electrolyte drinks if vomiting.", ebm: "Prevent dehydration-driven DKA progression" },
      ],
      icon: <Thermometer className="h-5 w-5" />,
      tone: "warning",
    },
    {
      step: 7,
      title: "Exercise Adjustments",
      description: "Physical activity requires proactive insulin and glucose management",
      criteria: "All T1DM patients engaging in moderate-vigorous exercise (>30 min) need insulin adjustment plan",
      medications: [
        { name: "Pre-Exercise", class: "Basal Reduction", notes: "Reduce basal 20-50% starting 30 min before. OR reduce pre-exercise bolus 50% if exercising within 2h of meal.", ebm: "Aerobic exercise increases glucose uptake 2-5×" },
        { name: "During Exercise", class: "Carb Supplementation", notes: "If >60 min: 15-30g carbs without bolus. Check CGM or SMBG every 30-60 min.", ebm: "Delayed hypo risk up to 24h post-exercise" },
        { name: "Post-Exercise", class: "Extended Monitoring", notes: "Monitor for 12-24h for delayed hypoglycemia. May need basal reduction that night.", ebm: "Exercise increases insulin sensitivity for 24-48h" },
      ],
      icon: <Activity className="h-5 w-5" />,
      tone: "accent",
    },
    {
      step: 8,
      title: "Advanced Therapy & HCL Systems",
      description: "Consider advanced insulin delivery systems for patients not meeting targets on MDI",
      criteria: "Consider insulin pump if: recurrent severe hypo, dawn phenomenon, glycemic variability, pregnancy planning, or patient preference after education",
      medications: [
        { name: "CSII (Pump)", class: "Continuous Subcutaneous Insulin Infusion", notes: "Basal rate + bolus via infusion set. Allows micro-adjustments (0.025U increments).", ebm: "Pump therapy reduces HbA1c by 0.3-0.5% vs MDI" },
        { name: "Hybrid Closed-Loop (HCL)", class: "Automated Insulin Delivery", notes: "CGM + pump algorithm auto-adjusts basal. Available: MiniMed 780G, t:slim X2+Control-IQ, Omnipod 5.", ebm: "HCL increases TIR by 10-15% and reduces hypoglycemia by 50%" },
        { name: "Adjuvant Pramlintide", class: "Amylin Analog", notes: "Slows gastric emptying, reduces postprandial excursions. Consider in patients with high post-meal spikes despite optimal ICR.", ebm: "Modest A1c reduction (-0.3%), nausea common" },
      ],
      icon: <Brain className="h-5 w-5" />,
      tone: "accent",
    },
    {
      step: 9,
      title: "Annual Complication Screening & Prevention",
      description: "Systematic surveillance for micro- and macrovascular complications",
      criteria: "Annual screening starting 5 years after diagnosis for asymptomatic patients (earlier if symptoms or HbA1c >7.5%)",
      medications: [
        { name: "Nephropathy Screening", class: "Kidney Health", notes: "eGFR + UACR annually. ACEi/ARB if UACR >30 mg/g, regardless of BP.", ebm: "Early ACEi delays progression of nephropathy" },
        { name: "Retinopathy Screening", class: "Eye Health", notes: "Dilated fundus exam annually. Refer to ophthalmologist if any retinopathy found.", ebm: "DCCT: intensive therapy reduces retinopathy by 76%" },
        { name: "Neuropathy & Foot Exam", class: "Neurological", notes: "10g monofilament + vibration testing annually. Inspect feet at every visit.", ebm: "Early detection of neuropathic foot reduces amputation risk" },
      ],
      icon: <Heart className="h-5 w-5" />,
      tone: "warning",
      isLast: true,
    },
  ];

  return (
    <div className="space-y-4">
      <Card className="clinical-card">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Brain className="h-4 w-4 text-primary" />
              </div>
              <CardTitle className="text-base">T1DM Stepped Treatment Algorithm</CardTitle>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {steps.map((step, index) => (
              <AlgorithmStep
                key={index}
                {...step}
                showInsulinRef={showInsulinRef}
                onToggleInsulinRef={step.isLast ? () => setShowInsulinRef(!showInsulinRef) : undefined}
              />
            ))}
            {showInsulinRef && <InsulinReferenceSection />}
          </div>
        </CardContent>
      </Card>

      <TidalDosingPanel />

      <PumpTherapyPanel />
    </div>
  );
};

// ─── GLP-1 in T1DM Panel ───
const GLP1InT1DMPanel = () => {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card className="clinical-card">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-warning/10 flex items-center justify-center">
            <FileText className="h-4 w-4 text-amber-500" />
          </div>
          <CardTitle className="text-base">Off-Label Adjunct Therapies in T1DM</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
          <p className="text-sm font-medium mb-2">GLP-1 Receptor Agonists (Off-Label)</p>
          <p className="text-xs text-muted-foreground">
            Emerging evidence supports GLP-1 RA use as adjunct in overweight/obese T1DM patients. Liraglutide (1.8 mg SC daily) or semaglutide (1.0 mg SC weekly) can reduce insulin dose by 15-30% and promote weight loss. Risk of DKA if insulin is reduced too aggressively — reduce basal by no more than 10-15% at initiation.
          </p>
          <p className="text-xs text-muted-foreground mt-2 italic">
            Evidence: Liraglutide in T1D (ADJUNCT ONE/TWO trials) — reduced A1c by 0.2-0.3%, weight loss 4-6 kg, but increased risk of symptomatic hypoglycemia (adjusted for lower insulin doses).
          </p>
        </div>
        <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
          <p className="text-sm font-medium mb-2">SGLT2 Inhibitors in T1DM</p>
          <p className="text-xs text-muted-foreground">
            Dapagliflozin and empagliflozin not approved for T1DM in most regions due to EUGLYCEMIC DKA RISK (~5% incidence). Use only under specialist supervision with strict ketone monitoring protocol. If used: reduce basal by 10-20% at initiation, test ketones daily, discontinue if any illness or reduced oral intake.
          </p>
          <p className="text-xs text-destructive mt-2 font-medium">
            ⚠ WARNING: SGLT2i in T1DM carries FDA boxed warning for DKA. Not approved as add-on therapy.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

// ─── Management Checklist ───
const ManagementChecklist = () => {
  const checklist = [
    {
      category: "Daily Essentials",
      items: [
        "Check CGM/SMBG — fasting, pre-meal, bedtime",
        "Inject basal insulin at same time daily",
        "Calculate pre-meal bolus (ICR + correction)",
        "Test ketones if glucose >250 mg/dL or unwell",
        "Carry fast-acting carbs at all times",
      ],
    },
    {
      category: "Weekly Review",
      items: [
        "Review CGM Time in Range (goal: >70%)",
        "Check glucose variability (CV <36%)",
        "Review hypo frequency (goal: <4% time below 70)",
        "Assess basal pattern from fasting glucose",
        "Review bolus accuracy from postprandial CGM",
      ],
    },
    {
      category: "Annual Screening",
      items: [
        "HbA1c (every 3 months if above target)",
        "eGFR & UACR (nephropathy screen)",
        "Dilated fundus exam (retinopathy screen)",
        "Foot exam (monofilament + vibration)",
        "Lipid panel + BP check",
        "TSH (autoimmune thyroiditis screen)",
        "Celiac screen (tissue transglutaminase)",
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
          <CardTitle className="text-base">T1DM Management Checklist</CardTitle>
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
export default function Type1TreatmentAlgorithm() {
  const [activeTab, setActiveTab] = useState<"algorithm" | "glp1" | "checklist">("algorithm");

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="rounded-xl p-6 text-primary-foreground" style={{ background: "var(--gradient-hero)" }}>
        <h1 className="text-3xl font-heading font-bold mb-2">Type 1 DM Treatment Algorithm</h1>
        <p className="text-primary-foreground/80">
          Step-by-step treatment algorithm from diagnosis through advanced insulin delivery for type 1 diabetes mellitus
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 mb-4">
        {[
          { id: "algorithm", label: "Treatment Algorithm", icon: Brain },
          { id: "glp1", label: "Adjunct Therapies", icon: FileText },
          { id: "checklist", label: "Checklist", icon: CheckCircle2 },
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

      {activeTab === "algorithm" && <Type1Algorithm />}
      {activeTab === "glp1" && <GLP1InT1DMPanel />}
      {activeTab === "checklist" && <ManagementChecklist />}
    </div>
  );
}
