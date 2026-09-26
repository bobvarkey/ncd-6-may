import { Card } from "@/components/ui/card";
import { Heart, TrendingUp, AlertTriangle, Dna, Activity, ShieldCheck, ListChecks, Stethoscope, Footprints, ScanLine, ChevronDown, Sparkles, BookOpen } from "lucide-react";
import { SectionCard } from "@/components/ui/section-card";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

// Inline citation marker — renders a clickable superscript with a tooltip
function Cite({ n, source }: { n: number; source: string }) {
  return (
    <Tooltip delayDuration={150}>
      <TooltipTrigger asChild>
        <sup className="ml-0.5 cursor-help rounded bg-primary/15 px-1 py-0.5 text-[9px] font-bold text-primary hover:bg-primary/25 transition-colors">
          [{n}]
        </sup>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-sm">
        <div className="flex gap-1.5">
          <BookOpen className="h-3 w-3 mt-0.5 shrink-0 text-primary" />
          <span className="leading-relaxed">{source}</span>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}

// ─── Primary Prevention reference content (migrated from former Prevention tab) ───
const PRIMARY_PREVENTION_STEPS = [
  {
    title: "Step 1 — Define Population & Assess Baseline",
    items: [
      "Confirm no clinical ASCVD (no prior MI, stroke, PAD, revascularization).",
      "Obtain fasting or nonfasting lipid panel, A1c, creatinine, urine albumin/creatinine, etc.",
      "Calculate 10-year ASCVD risk with PREVENT-ASCVD for adults 30–79 y (updated ACC/AHA guideline) or Pooled Cohort Equations where PREVENT is not yet embedded.",
    ],
  },
  {
    title: "Step 2 — Decide on Lipid-Lowering Therapy",
    items: [
      "Threshold to treat: updated guideline recommends initiating lipid-lowering therapy at 10-year ASCVD risk ≥5%.",
      "For adults 40–75 y with LDL-C 70–189 mg/dL (1.8–4.9 mmol/L) and 10-year risk ≥7.5%, moderate- to high-intensity statin is recommended.",
      "5–7.5% supports moderate-intensity statin after discussion.",
    ],
  },
  {
    title: "Step 3 — Apply LDL-C Thresholds",
    items: [
      "General primary prevention goal: LDL-C <100 mg/dL (<2.6 mmol/L) to prevent a first MI or stroke.",
      "Higher-risk primary prevention (e.g., diabetes, HIV, CKD) — target <70 mg/dL (<1.8 mmol/L).",
      "If the patient later develops ASCVD and is extremely high risk, aim for <55 mg/dL (<1.4 mmol/L).",
    ],
  },
  {
    title: "Step 4 — Refine Risk & Intensify If Needed",
    items: [
      "When treatment is uncertain or borderline, use CAC scoring, Lp(a), and apoB to reclassify risk and support earlier therapy.",
      "Start with statin; add ezetimibe, PCSK9 inhibitor, or bempedoic acid if LDL-C goals are not reached or statin intolerance exists.",
    ],
  },
  {
    title: "Step 5 — Lifestyle & Follow-Up",
    items: [
      "Reinforce diet, weight, and physical activity at every visit.",
      "Recheck lipids 4–12 weeks after therapy change, then every 3–12 months to assess adherence and goal attainment.",
    ],
  },
];

const PRIMARY_PREVENTION_TIERS = [
  { risk: "Low (<5%)",              ldl: "<100 mg/dL (<2.6 mmol/L)",                  color: "text-success",  bg: "bg-success/10"  },
  { risk: "Borderline (5–7.5%)",    ldl: "<100 mg/dL (<2.6 mmol/L) — consider statin", color: "text-primary",  bg: "bg-primary/10"  },
  { risk: "Intermediate (7.5–20%)", ldl: "<70 mg/dL (<1.8 mmol/L)",                   color: "text-warning",  bg: "bg-warning/10"  },
  { risk: "High (≥20%)",            ldl: "<55 mg/dL (<1.4 mmol/L)",                   color: "text-danger",   bg: "bg-danger/10"   },
];

const DIABETES_PROTOCOL = [
  { label: "Diabetes mellitus (baseline)", target: "<70 mg/dL (<1.8 mmol/L)" },
  { label: "Diabetes + target organ damage or ≥2 major ASCVD RF", target: "<50 mg/dL (<1.3 mmol/L)" },
  { label: "Diabetes + ASCVD (Extreme Risk A)", target: "≤30 mg/dL (≤0.8 mmol/L) — optional" },
  { label: "ASCVD + Diabetes with TOD or ≥2 major ASCVD RF", target: "≤30 mg/dL (≤0.8 mmol/L)" },
];

const ACS_PROTOCOL = [
  "All ASCVD patients must achieve LDL-C <50 mg/dL (<1.3 mmol/L).",
  "Recurrent ACS or polyvascular disease (Extreme Risk B): target ≤30 mg/dL (≤0.8 mmol/L).",
  "Lipid profile at emergency triage; repeat within 2 weeks of initiating therapy.",
  "Start combination therapy (high-intensity statin + ezetimibe) at presentation to ED.",
  "Intensify every 2 weeks until goals achieved, preferably by week 4.",
];

export default function EducationSection() {
  return (
    <div className="space-y-6">

      {/* 2026 AHA/ACC At-a-Glance */}
      <Card className="border-indigo-500/30 bg-indigo-500/5 p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/20">
            <Heart className="h-4 w-4 text-indigo-500" />
          </div>
          <h3 className="font-display text-base font-bold text-indigo-600 dark:text-indigo-400">2026 AHA/ACC Dyslipidemia Guidelines At-a-Glance</h3>
        </div>
        <p className="text-sm text-foreground leading-relaxed mb-4 p-3 rounded-lg border border-indigo-500/20 bg-indigo-500/10">
          The American Heart Association and American College of Cardiology released the first cholesterol guideline update in eight years, with <strong className="text-indigo-600 dark:text-indigo-400">52 distinct new recommendations</strong>.
        </p>

        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-4 mb-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-2">Key Recommendation</p>
          <p className="text-sm text-foreground leading-relaxed">
            <strong className="text-emerald-600 dark:text-emerald-400">Lp(a) Screening:</strong> Measure Lp(a) at least once in every adult's life to identify very high inherited levels (&gt;180 mg/dL / &gt;430 nmol/L), which can reclassify moderate-risk patients to higher risk.
          </p>
        </div>

        <div className="rounded-lg border border-amber-500/30 bg-warning/100/5 p-4 space-y-2.5 text-sm text-foreground leading-relaxed mb-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-warning dark:text-warning mb-2">Biggest Changes</p>
          <p>• <strong className="text-warning dark:text-warning">Lp(a) testing</strong> is now recommended for all adults.</p>
          <p>• Treatment is now recommended for <strong className="text-warning dark:text-warning">younger adults</strong>, based on 30-year risk projections.</p>
          <p>• <strong className="text-warning dark:text-warning">ApoB testing, hsCRP, and CAC</strong> are recommended more frequently.</p>
          <p>• <strong className="text-warning dark:text-warning">Specific LDL targets are back</strong>, after being removed in the 2013 guidelines.</p>
        </div>

        {/* Risk Categories & LDL-C Targets */}
        <div className="mb-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Risk Categories & LDL-C Targets</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 pr-3 font-semibold text-muted-foreground">Risk Level</th>
                  <th className="text-left py-2 pr-3 font-semibold text-muted-foreground">Clinical Criteria</th>
                  <th className="text-left py-2 font-semibold text-muted-foreground">LDL-C Target</th>
                </tr>
              </thead>
              <tbody className="text-foreground">
                <tr className="border-b border-border/50">
                  <td className="py-2.5 pr-3 font-semibold text-danger">Very High</td>
                  <td className="py-2.5 pr-3 text-xs leading-relaxed">ASCVD, diabetes with organ damage/&gt;20y duration, eGFR&lt;30, FH with ASCVD, SCORE&gt;10%</td>
                  <td className="py-2.5 font-semibold whitespace-nowrap">&lt;55 mg/dL (&lt;1.4 mmol/L)<br /><span className="font-normal text-xs text-muted-foreground">(&lt;40 mg/dL / &lt;1.0 mmol/L recurrent ASCVD)</span></td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-2.5 pr-3 font-semibold text-warning">High</td>
                  <td className="py-2.5 pr-3 text-xs leading-relaxed">LDL-C&gt;190, TC&gt;310, BP&gt;180/110, FH, diabetes&gt;10y, eGFR 30–59, SCORE 5–10%</td>
                  <td className="py-2.5 font-semibold">&lt;70 mg/dL (&lt;1.8 mmol/L)</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-2.5 pr-3 font-semibold text-primary">Moderate</td>
                  <td className="py-2.5 pr-3 text-xs leading-relaxed">Younger diabetes, diabetes&lt;10y without other risks, SCORE 1–5%</td>
                  <td className="py-2.5 font-semibold">&lt;100 mg/dL (&lt;2.6 mmol/L)</td>
                </tr>
                <tr>
                  <td className="py-2.5 pr-3 font-semibold text-success">Low</td>
                  <td className="py-2.5 pr-3 text-xs leading-relaxed">SCORE &lt;1%</td>
                  <td className="py-2.5 font-semibold">&lt;116 mg/dL (&lt;3.0 mmol/L)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* ApoB Treatment Targets */}
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 mb-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-primary mb-2">ApoB Treatment Targets</p>
          <p className="text-sm text-foreground leading-relaxed mb-3">
            Because on-treatment LDL-C and apoB levels were nearly identical in trial data, the same number can be used for both.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 pr-3 font-semibold text-muted-foreground">Risk Level</th>
                  <th className="text-left py-2 pr-3 font-semibold text-muted-foreground">LDL-C Target</th>
                  <th className="text-left py-2 font-semibold text-muted-foreground">ApoB Target</th>
                </tr>
              </thead>
              <tbody className="text-foreground">
                <tr className="border-b border-border/50">
                  <td className="py-2 pr-3 font-semibold text-danger">Very High</td>
                  <td className="py-2 pr-3">&lt;55 mg/dL (&lt;1.4 mmol/L)</td>
                  <td className="py-2">&lt;55 mg/dL (0.55 g/L)</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-2 pr-3 font-semibold text-warning">High</td>
                  <td className="py-2 pr-3">&lt;70 mg/dL (&lt;1.8 mmol/L)</td>
                  <td className="py-2">&lt;70 mg/dL (0.70 g/L)</td>
                </tr>
                <tr>
                  <td className="py-2 pr-3 font-semibold text-primary">Moderate</td>
                  <td className="py-2 pr-3">&lt;100 mg/dL (&lt;2.6 mmol/L)</td>
                  <td className="py-2">&lt;100 mg/dL (1.0 g/L)</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* ApoB Reference Ranges */}
          <div className="mt-4 rounded-lg border border-primary/10 bg-background p-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-primary mb-2">Key ApoB Levels (Reference Ranges)</p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 pr-3 font-semibold text-muted-foreground">Category</th>
                    <th className="text-left py-2 font-semibold text-muted-foreground">ApoB Level</th>
                  </tr>
                </thead>
                <tbody className="text-foreground">
                  <tr className="border-b border-border/50">
                    <td className="py-2 pr-3 font-semibold text-primary">Optimal</td>
                    <td className="py-2">&lt;80 mg/dL (&lt;2.1 mmol/L) — &lt;60 mg/dL (&lt;1.6 mmol/L) for high risk</td>
                  </tr>
                  <tr className="border-b border-border/50">
                    <td className="py-2 pr-3 font-semibold text-warning">Borderline High</td>
                    <td className="py-2">90–109 mg/dL (2.3–2.8 mmol/L)</td>
                  </tr>
                  <tr className="border-b border-border/50">
                    <td className="py-2 pr-3 font-semibold text-danger">High Risk</td>
                    <td className="py-2">≥110 mg/dL (≥2.8 mmol/L) — often ≥120 mg/dL (≥3.1 mmol/L)</td>
                  </tr>
                  <tr className="border-b border-border/50">
                    <td className="py-2 pr-3 text-muted-foreground">Male Typical</td>
                    <td className="py-2">66–133 mg/dL (1.7–3.4 mmol/L)</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-3 text-muted-foreground">Female Typical</td>
                    <td className="py-2">60–117 mg/dL (1.6–3.0 mmol/L)</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Treatment Goals Table */}
          <div className="mt-4 rounded-lg border border-primary/10 bg-background p-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-primary mb-1">Treatment Goals: Non-HDL-C, LDL-C & ApoB (mg/dL)</p>
            <p className="text-xs text-muted-foreground mb-2">*ApoB is a secondary, optional target.</p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 pr-3 font-semibold text-muted-foreground">Risk</th>
                    <th className="text-left py-2 pr-3 font-semibold text-muted-foreground">Non-HDL-C</th>
                    <th className="text-left py-2 pr-3 font-semibold text-muted-foreground">LDL-C</th>
                    <th className="text-left py-2 font-semibold text-primary">ApoB*</th>
                  </tr>
                </thead>
                <tbody className="text-foreground">
                  <tr className="border-b border-border/50"><td className="py-2 pr-3">Low</td><td className="py-2 pr-3">&lt;130</td><td className="py-2 pr-3">&lt;100</td><td className="py-2 font-semibold text-primary">&lt;90</td></tr>
                  <tr className="border-b border-border/50"><td className="py-2 pr-3">Moderate</td><td className="py-2 pr-3">&lt;130</td><td className="py-2 pr-3">&lt;100</td><td className="py-2 font-semibold text-primary">&lt;90</td></tr>
                  <tr className="border-b border-border/50"><td className="py-2 pr-3">High</td><td className="py-2 pr-3">&lt;130</td><td className="py-2 pr-3">&lt;100</td><td className="py-2 font-semibold text-primary">&lt;90</td></tr>
                  <tr><td className="py-2 pr-3 font-semibold">Very High</td><td className="py-2 pr-3">&lt;100</td><td className="py-2 pr-3">&lt;70</td><td className="py-2 font-semibold text-primary">&lt;80</td></tr>
                </tbody>
              </table>
            </div>
          </div>

          <p className="text-xs text-danger mt-3 leading-relaxed font-medium">
            ⚠️ Elevated levels of Lp(a) significantly increase the risk of heart disease, stroke, and aortic valve stenosis, even if your other cholesterol numbers are normal.
          </p>
        </div>

        {/* Clinical ASCVD Definition */}
        <div className="rounded-lg border border-border bg-muted/50 p-4 mb-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Clinical ASCVD: Very High Risk Definition</p>
          <p className="text-sm text-foreground leading-relaxed mb-2">
            ≥2 major ASCVD events <strong>OR</strong> 1 major ASCVD event + ≥2 high-risk conditions:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-foreground">
            <div>
              <p className="font-semibold mb-1">Major ASCVD Events:</p>
              <p className="text-muted-foreground leading-relaxed">ACS, MI, ischemic stroke, symptomatic PAD</p>
            </div>
            <div>
              <p className="font-semibold mb-1">High-Risk Conditions:</p>
              <p className="text-muted-foreground leading-relaxed">Age ≥65, coronary bypass/PCI, current smoker, diabetes, HF, HTN, LDL-C ≥100 despite max statin + ezetimibe</p>
            </div>
          </div>
        </div>

        {/* CAC Score Management */}
        <div className="mb-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Subclinical Atherosclerosis — CAC Score Management</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 pr-3 font-semibold text-muted-foreground">CAC Score</th>
                  <th className="text-left py-2 pr-3 font-semibold text-muted-foreground">Risk / Action</th>
                  <th className="text-left py-2 font-semibold text-muted-foreground">LDL-C Target</th>
                </tr>
              </thead>
              <tbody className="text-foreground">
                <tr className="border-b border-border/50"><td className="py-2.5 pr-3">0</td><td className="py-2.5 pr-3">Low risk</td><td className="py-2.5 font-semibold">&lt;100 mg/dL (&lt;2.6 mmol/L)</td></tr>
                <tr className="border-b border-border/50"><td className="py-2.5 pr-3">1–99 AU</td><td className="py-2.5 pr-3">Start moderate statin</td><td className="py-2.5 font-semibold">&lt;70 mg/dL (&lt;1.8 mmol/L)</td></tr>
                <tr className="border-b border-border/50"><td className="py-2.5 pr-3">100–399 AU</td><td className="py-2.5 pr-3">High-intensity statin</td><td className="py-2.5 font-semibold">&lt;55 mg/dL (&lt;1.4 mmol/L)</td></tr>
                <tr><td className="py-2.5 pr-3">≥400 AU</td><td className="py-2.5 pr-3">Very high-intensity</td><td className="py-2.5 font-semibold">&lt;40 mg/dL (&lt;1.0 mmol/L)</td></tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Primary Prevention Table */}
        <div className="mb-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Primary Prevention: Adults 30–79y Without ASCVD</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 pr-3 font-semibold text-muted-foreground">10-Year Risk</th>
                  <th className="text-left py-2 font-semibold text-muted-foreground">LDL-C Target</th>
                </tr>
              </thead>
              <tbody className="text-foreground">
                <tr className="border-b border-border/50"><td className="py-2 pr-3">Low (&lt;5%)</td><td className="py-2 font-semibold">&lt;100 mg/dL (&lt;2.6 mmol/L)</td></tr>
                <tr className="border-b border-border/50"><td className="py-2 pr-3">Borderline (5–7.5%)</td><td className="py-2 font-semibold">&lt;100 mg/dL (&lt;2.6 mmol/L) <span className="font-normal text-xs text-muted-foreground">(consider)</span></td></tr>
                <tr className="border-b border-border/50"><td className="py-2 pr-3">Intermediate (7.5–20%)</td><td className="py-2 font-semibold">&lt;70 mg/dL (&lt;1.8 mmol/L)</td></tr>
                <tr><td className="py-2 pr-3">High (≥20%)</td><td className="py-2 font-semibold">&lt;55 mg/dL (&lt;1.4 mmol/L)</td></tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Treatment Algorithms */}
        <div className="space-y-4 mb-5">
          <div className="rounded-lg border border-danger/20 bg-danger/5 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-danger mb-2">Secondary Prevention: Very High Risk ASCVD</p>
            <ol className="space-y-1.5 text-sm text-foreground leading-relaxed list-decimal list-inside">
              <li>Start <strong>high-intensity statin</strong> → LDL &lt;55 mg/dL (&lt;1.4 mmol/L)</li>
              <li>Add <strong>ezetimibe</strong> if not at goal</li>
              <li>Add <strong>PCSK9 inhibitor</strong> if still not at goal</li>
              <li>Monitor adherence and lifestyle</li>
            </ol>
          </div>
          <div className="rounded-lg border border-warning/20 bg-warning/5 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-warning mb-2">Secondary Prevention: Not Very High Risk ASCVD</p>
            <ol className="space-y-1.5 text-sm text-foreground leading-relaxed list-decimal list-inside">
              <li>Start <strong>moderate statin</strong> → LDL &lt;70 mg/dL (&lt;1.8 mmol/L)</li>
              <li>Add <strong>ezetimibe</strong> if not at goal</li>
              <li>Add <strong>bempedoic acid</strong> if statin-intolerant</li>
              <li>Optional goal: &lt;55 mg/dL (&lt;1.4 mmol/L)</li>
            </ol>
          </div>
          <div className="rounded-lg border border-purple-500/30 bg-purple-500/5 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-purple-500 mb-2">Severe Hypercholesterolemia (LDL-C ≥190 mg/dL / ≥4.9 mmol/L)</p>
            <ol className="space-y-1.5 text-sm text-foreground leading-relaxed list-decimal list-inside">
              <li><strong>Cascade screening</strong> + complete genetic testing</li>
              <li>Add <strong>ezetimibe</strong></li>
              <li>Add <strong>PCSK9 inhibitor</strong> if not at goal</li>
            </ol>
          </div>
        </div>

        {/* TG ≥500 */}
        <div className="rounded-lg border border-amber-500/30 bg-warning/100/5 p-4 mb-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-amber-500 mb-2">Adults with Triglycerides ≥500 mg/dL (≥5.6 mmol/L)</p>
          <ol className="space-y-1.5 text-sm text-foreground leading-relaxed list-decimal list-inside">
            <li>Identify/manage <strong>secondary causes</strong></li>
            <li><strong>Lifestyle:</strong> Optimize diet/exercise</li>
            <li>If TG persists ≥500 mg/dL (≥5.6 mmol/L):
              <ul className="ml-5 mt-1 space-y-1 list-disc">
                <li><strong>Pancreatitis risk:</strong> Refer to lipid specialist</li>
                <li><strong>Prevent ASCVD risk:</strong> Add fiber/omega-3, fenofibrate, or icosapent ethyl</li>
              </ul>
            </li>
          </ol>
        </div>

        {/* Statin-Intolerant */}
        <div className="rounded-lg border border-cyan-500/30 bg-cyan-500/5 p-4 mb-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-cyan-500 mb-2">Statin-Intolerant Adults</p>
          <div className="space-y-1.5 text-sm text-foreground leading-relaxed">
            <p>• Evaluate muscle symptoms</p>
            <p>• <strong>ASCVD absent:</strong> LDL &lt;100 mg/dL (&lt;2.6 mmol/L) → ezetimibe</p>
            <p>• <strong>ASCVD present:</strong> LDL &lt;70 mg/dL (&lt;1.8 mmol/L) → ezetimibe + bempedoic acid</p>
            <p>• If goals not met → Add <strong>PCSK9 inhibitor</strong></p>
          </div>
        </div>

        {/* Screening Recommendations */}
        <div className="mb-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Screening Recommendations</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 pr-3 font-semibold text-muted-foreground">COR (Class of Recommendation)</th>
                  <th className="text-left py-2 pr-3 font-semibold text-muted-foreground">LOE (Level of Evidence)</th>
                  <th className="text-left py-2 font-semibold text-muted-foreground">Recommendation</th>
                </tr>
              </thead>
              <tbody className="text-foreground">
                <tr className="border-b border-border/50">
                  <td className="py-2 pr-3">
                    <p className="font-semibold">1</p>
                    <p className="text-xs text-muted-foreground">Class 1: Recommended/indicated. Evidence is strong that it works.</p>
                  </td>
                  <td className="py-2 pr-3">
                    <p className="font-semibold">B-NR</p>
                    <p className="text-xs text-muted-foreground">Based on Non-Randomized studies or registries (observational data).</p>
                  </td>
                  <td className="py-2 text-xs leading-relaxed">Lipid profile every 5y for ASCVD risk, more frequent with risk factors</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-2 pr-3">
                    <p className="font-semibold">1</p>
                    <p className="text-xs text-muted-foreground">Class 1: Recommended/indicated. Evidence is strong that it works.</p>
                  </td>
                  <td className="py-2 pr-3">
                    <p className="font-semibold">B-NR</p>
                    <p className="text-xs text-muted-foreground">Based on Non-Randomized studies or registries (observational data).</p>
                  </td>
                  <td className="py-2 text-xs leading-relaxed">Children 9–11y to screen for FH/other lipid disorders</td>
                </tr>
                <tr>
                  <td className="py-2 pr-3">
                    <p className="font-semibold">2a</p>
                    <p className="text-xs text-muted-foreground">Class 2a: Reasonable to do. Moderate evidence that it is useful.</p>
                  </td>
                  <td className="py-2 pr-3">
                    <p className="font-semibold">B-NR</p>
                    <p className="text-xs text-muted-foreground">Based on Non-Randomized studies or registries (observational data).</p>
                  </td>
                  <td className="py-2 text-xs leading-relaxed">Cascade screening with lipid profile for FH relatives</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Summary */}
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-primary mb-2">Summary</p>
          <div className="space-y-1.5 text-sm text-foreground leading-relaxed">
            <p>• <strong>Screening:</strong> Lp(a) once in adults, lipid profile every 5y</p>
            <p>• <strong>Targets:</strong> Very high-risk &lt;55 mg/dL (&lt;1.4 mmol/L), high &lt;70 mg/dL (&lt;1.8 mmol/L), moderate &lt;100 mg/dL (&lt;2.6 mmol/L)</p>
            <p>• <strong>Key drugs:</strong> Statins first, then ezetimibe / PCSK9i / bempedoic acid</p>
            <p>• <strong>Special cases:</strong> TG ≥500 → fibrates/omega-3; severe hypercholesterolemia → cascade screening + PCSK9i</p>
          </div>
        </div>

        <p className="mt-4 text-xs text-muted-foreground italic">
          Source: 2026 AHA/ACC Dyslipidemia Guidelines At-a-Glance
        </p>
      </Card>

      {/* Lp(a) Section */}
      <Card className="border-border bg-card p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500/20 to-cyan-500/20 backdrop-blur-md border border-blue-500/30">
            <Dna className="h-5 w-5 text-blue-500" />
          </div>
          <h3 className="font-display text-lg font-bold text-foreground">Lp(a) — Lipoprotein(a)</h3>
        </div>
        
        {/* Lp(a) Levels with Color-Coded Icons */}
        <div className="space-y-3 mb-4">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-success/5 border border-success/20">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-success/20">
              <Heart className="h-4 w-4 text-success" />
            </div>
            <div>
              <p className="text-sm font-semibold text-success">Optimal: ≤14 mg/dL (≤35 nmol/L)</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/20">
              <Heart className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold text-primary">Normal: ≤30 mg/dL (≤75 nmol/L)</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 p-3 rounded-lg bg-danger/5 border border-danger/20">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-danger/20">
              <AlertTriangle className="h-4 w-4 text-danger" />
            </div>
            <div>
              <p className="text-sm font-semibold text-danger">Elevated: &gt;50 mg/dL (&gt;125 nmol/L)</p>
            </div>
          </div>
        </div>

        {/* Risk Progression */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/20">
              <TrendingUp className="h-3 w-3 text-primary" />
            </div>
            <p className="text-sm text-foreground">
              Lp(a) 10–49 mg/dL (25–124 nmol/L) → <strong className="text-primary">28% higher</strong> cardiovascular risk
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-warning/20">
              <TrendingUp className="h-3 w-3 text-warning" />
            </div>
            <p className="text-sm text-foreground">
              Lp(a) 50–99 mg/dL (125–249 nmol/L) → <strong className="text-warning">44% higher</strong> cardiovascular risk
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-danger/20">
              <TrendingUp className="h-3 w-3 text-danger" />
            </div>
            <p className="text-sm text-foreground">
              Lp(a) &gt;100 mg/dL (&gt;250 nmol/L) → <strong className="text-danger font-bold">114% higher</strong> cardiovascular risk
            </p>
          </div>
        </div>

        <p className="text-sm text-muted-foreground italic">
          Lp(a) confers a genetic risk — it represents a specific, highly inherited subset of particles that are particularly dangerous.
        </p>
      </Card>

      {/* Lp(a) Risk Table */}
      <Card className="border-border bg-card p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-orange-500/20 to-red-500/20 backdrop-blur-md border border-warning/30">
            <Activity className="h-5 w-5 text-orange-500" />
          </div>
          <h3 className="font-display text-lg font-bold text-foreground">Lp(a) & Relative ASCVD Risk</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 pr-4 font-semibold text-muted-foreground">Lp(a) Level</th>
                <th className="text-left py-2 font-semibold text-muted-foreground">Relative ASCVD Risk</th>
              </tr>
            </thead>
            <tbody className="text-foreground">
              <tr className="border-b border-border/50">
                <td className="py-3 pr-4">
                  <div className="flex items-center gap-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded-md bg-success/20">
                      <Heart className="h-3 w-3 text-success" />
                    </div>
                    <span>&lt;75 nmol/L (&lt;30 mg/dL)</span>
                  </div>
                </td>
                <td className="py-3">
                  <span className="font-semibold text-success">Reference (low)</span>
                </td>
              </tr>
              <tr className="border-b border-border/50">
                <td className="py-3 pr-4">
                  <div className="flex items-center gap-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/20">
                      <Heart className="h-3 w-3 text-primary" />
                    </div>
                    <span>75–124 nmol/L (30–49 mg/dL)</span>
                  </div>
                </td>
                <td className="py-3">
                  <span className="font-semibold text-primary">1.2×</span>
                </td>
              </tr>
              <tr className="border-b border-border/50">
                <td className="py-3 pr-4">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-md bg-warning/20">
                      <AlertTriangle className="h-4 w-4 text-warning" />
                    </div>
                    <span>≥125 nmol/L (≥50 mg/dL)</span>
                  </div>
                </td>
                <td className="py-3">
                  <span className="font-semibold text-warning">1.4×</span>
                </td>
              </tr>
              <tr className="border-b border-border/50">
                <td className="py-3 pr-4">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-danger/20">
                      <AlertTriangle className="h-5 w-5 text-danger" />
                    </div>
                    <span>≥250 nmol/L (≥100 mg/dL)</span>
                  </div>
                </td>
                <td className="py-3">
                  <span className="font-bold text-danger">2×</span>
                </td>
              </tr>
              <tr className="border-b border-border/50">
                <td className="py-3 pr-4">
                  <div className="flex items-center gap-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-md bg-danger/30">
                      <AlertTriangle className="h-6 w-6 text-danger" />
                    </div>
                    <span>≥350 nmol/L (≥150 mg/dL)</span>
                  </div>
                </td>
                <td className="py-3">
                  <span className="font-bold text-danger">3×</span>
                </td>
              </tr>
              <tr>
                <td className="py-3 pr-4">
                  <div className="flex items-center gap-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-md bg-danger/40">
                      <AlertTriangle className="h-7 w-7 text-danger" />
                    </div>
                    <span>≥430 nmol/L (≥180 mg/dL)</span>
                  </div>
                </td>
                <td className="py-3">
                  <span className="font-bold text-danger">4×</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>

      {/* ApoB Section */}
      <Card className="border-border bg-card p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-md border border-purple-500/30">
            <Activity className="h-5 w-5 text-purple-500" />
          </div>
          <h3 className="font-display text-lg font-bold text-foreground">ApoB — Apolipoprotein B</h3>
        </div>
        
        <div className="space-y-3">
          <div className="flex items-start gap-3 p-3 rounded-lg bg-purple-500/5 border border-purple-500/20">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-purple-500/20 flex-shrink-0">
              <Dna className="h-4 w-4 text-purple-500" />
            </div>
            <p className="text-sm text-foreground">
              LDL is sometimes <strong className="text-purple-500">calculated</strong>; ApoB is always <strong className="text-purple-500">measured</strong>.
            </p>
          </div>
          
          <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-500/5 border border-blue-500/20">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-500/20 flex-shrink-0">
              <Activity className="h-4 w-4 text-blue-500" />
            </div>
            <p className="text-sm text-foreground">
              LDL is just one of three atherogenic particles. <strong className="text-blue-500">ApoB counts all of them.</strong>
            </p>
          </div>
          
          <div className="flex items-start gap-3 p-3 rounded-lg bg-cyan-500/5 border border-cyan-500/20">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-cyan-500/20 flex-shrink-0">
              <TrendingUp className="h-4 w-4 text-cyan-500" />
            </div>
            <p className="text-sm text-foreground">
              ApoB is a <strong className="text-cyan-500">more accurate predictor</strong> of cardiovascular events than LDL-C.
            </p>
          </div>
          
          <div className="flex items-start gap-3 p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-emerald-500/20 flex-shrink-0">
              <Heart className="h-4 w-4 text-emerald-500" />
            </div>
            <p className="text-sm text-foreground">
              When ApoB and LDL-C disagree, <strong className="text-emerald-500">ApoB is the better predictor of risk</strong>.
            </p>
          </div>
          
          <div className="flex items-start gap-3 p-3 rounded-lg bg-warning/100/5 border border-amber-500/20">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-warning/100/20 flex-shrink-0">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
            </div>
            <p className="text-sm text-foreground">
              Young adults with high ApoB but normal LDL-C had a <strong className="text-amber-500 font-bold">55% higher risk</strong> of developing coronary artery calcification 25 years later.
            </p>
          </div>
        </div>
        <p className="mt-3 text-sm text-muted-foreground italic">
          ApoB is "sticky cholesterol" — it reflects the total number of atherogenic particles (LDL + Lp(a) + others).
        </p>
      </Card>

      {/* ─── Primary Prevention Workflow Reference (migrated from Prevention tab) ─── */}
      <SectionCard
        title="Primary Prevention — 5-Step Workflow"
        tone="emerald"
        icon={<ListChecks className="h-4 w-4" />}
        defaultOpen={false}
      >
        <p className="mb-3 text-xs text-muted-foreground">
          Reference workflow for adults 40–75 y without clinical ASCVD. The interactive risk-factor counting and PREVENT calculation are available in the Calculator tab.
        </p>
        <div className="space-y-3">
          {PRIMARY_PREVENTION_STEPS.map((step, i) => (
            <div key={i} className="flex items-start gap-3 rounded-lg border border-border bg-muted/20 p-3">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                {i + 1}
              </span>
              <div className="flex-1">
                <h4 className="font-display text-sm font-bold text-foreground mb-1.5">{step.title}</h4>
                <ul className="space-y-1">
                  {step.items.map((item, j) => (
                    <li key={j} className="text-sm text-foreground leading-relaxed flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* ─── LDL-C Targets by 10-Year Risk ─── */}
      <SectionCard
        title="Primary Prevention LDL-C Targets by 10-Year ASCVD Risk"
        tone="primary"
        icon={<ShieldCheck className="h-4 w-4" />}
        defaultOpen={false}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {PRIMARY_PREVENTION_TIERS.map((t) => (
            <div key={t.risk} className={`rounded-lg ${t.bg} px-4 py-3`}>
              <p className={`text-xs font-semibold ${t.color}`}>{t.risk}</p>
              <p className="text-base font-bold text-foreground mt-1">{t.ldl}</p>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* ─── Diabetes Day-1 Treatment Reference ─── */}
      <SectionCard
        title="Diabetes & Dyslipidemia — Day 1 Treatment Targets"
        tone="danger"
        icon={<Heart className="h-4 w-4" />}
        defaultOpen={false}
      >
        <p className="mb-3 text-xs text-muted-foreground">
          Initiate dyslipidemia treatment <strong className="text-foreground">on day 1</strong> of diabetes diagnosis. Targets must be attained by <strong className="text-foreground">week 12</strong>.
        </p>
        <div className="space-y-2">
          {DIABETES_PROTOCOL.map((row) => (
            <div
              key={row.label}
              className="flex items-start justify-between gap-3 rounded-lg border border-border bg-muted/20 px-3 py-2.5"
            >
              <span className="text-sm leading-snug text-foreground flex-1">{row.label}</span>
              <span className="rounded bg-danger/15 px-2 py-0.5 text-xs font-bold text-danger whitespace-nowrap">
                {row.target}
              </span>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* ─── ASCVD & ACS Management Reference ─── */}
      <SectionCard
        title="ASCVD & ACS Management Principles"
        tone="primary"
        icon={<Stethoscope className="h-4 w-4" />}
        defaultOpen={false}
      >
        <ul className="space-y-2 mt-1">
          {ACS_PROTOCOL.map((line, i) => (
            <li key={i} className="flex items-start gap-2 rounded-lg border border-border bg-muted/20 px-3 py-2.5">
              <span className="text-primary mt-1">•</span>
              <span className="text-sm leading-snug text-foreground">{line}</span>
            </li>
          ))}
        </ul>
      </SectionCard>

      {/* ─── ABI Reference ─── */}
      <SectionCard
        title="Ankle-Brachial Index (ABI) — PAD Severity"
        tone="cyan"
        icon={<Footprints className="h-4 w-4" />}
        defaultOpen={false}
      >
        <p className="mb-3 text-xs text-muted-foreground">
          ABI is the ratio of ankle to brachial systolic BP. An ABI <strong className="text-foreground">&lt;0.9</strong> confirms peripheral arterial disease and qualifies as ASCVD risk equivalent.
        </p>
        <div className="space-y-2">
          {[
            { range: "≥1.3",       interp: "Abnormal calcification (non-compressible vessels)", tone: "bg-warning/15 text-warning" },
            { range: "1.0–1.29",   interp: "Normal value",                                       tone: "bg-success/15 text-success" },
            { range: "0.9–0.99",   interp: "Borderline PAD",                                     tone: "bg-warning/100/15 text-warning dark:text-warning" },
            { range: "0.7–0.89",   interp: "Mild PAD",                                           tone: "bg-warning/100/15 text-orange-600 dark:text-warning" },
            { range: "0.5–0.69",   interp: "Moderate PAD",                                       tone: "bg-danger/15 text-danger" },
            { range: "<0.5",       interp: "Severe PAD with impending gangrene",                 tone: "bg-danger/25 text-danger font-bold" },
          ].map((row) => (
            <div
              key={row.range}
              className="flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/20 px-3 py-2.5"
            >
              <span className={`rounded px-2 py-0.5 text-xs font-bold whitespace-nowrap ${row.tone}`}>
                {row.range}
              </span>
              <span className="text-sm leading-snug text-foreground flex-1 text-right">{row.interp}</span>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* ─── CAC >100 with PREVENT ─── */}
      <SectionCard
        title="CAC >100 — How It Reclassifies PREVENT-Based Risk"
        tone="amber"
        icon={<ScanLine className="h-4 w-4" />}
        defaultOpen={false}
      >
        <p className="mb-3 text-sm text-foreground leading-relaxed">
          A CAC score above 100 doesn't literally change the PREVENT equation, but it <strong>reclassifies risk upward</strong> when used as a decision aid alongside PREVENT.<Cite n={1} source="Grundy SM, et al. 2018 AHA/ACC/Multisociety Cholesterol Guideline. Circulation. 2019;139(25):e1082–e1143." /> CAC &gt;100 typically pushes an intermediate-risk patient toward more aggressive prevention — especially statin therapy — because event rates and expected treatment benefit are higher.<Cite n={2} source="Budoff MJ, et al. Ten-year association of CAC with all-cause and cause-specific mortality. JACC. 2018;72(4):434–447." />
        </p>

        <div className="rounded-lg border border-amber-500/30 bg-warning/100/5 p-3 mb-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-warning dark:text-warning mb-1.5">How to Interpret</p>
          <p className="text-sm text-foreground leading-relaxed">
            PREVENT is a clinical risk estimator based on traditional risk factors;<Cite n={3} source="Khan SS, et al. Development and validation of the PREVENT equations. Circulation. 2024;149:430–449." /> CAC is a <strong>direct measure of coronary atherosclerotic burden</strong>. The 2018 ACC/AHA cholesterol guidance encourages statin initiation when CAC ≥100 AU or ≥75th percentile for age/sex/ethnicity.<Cite n={1} source="Grundy SM, et al. 2018 AHA/ACC/Multisociety Cholesterol Guideline. Circulation. 2019;139(25):e1082–e1143." />
          </p>
        </div>

        <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 mb-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-primary mb-1.5">Practical Impact</p>
          <ul className="text-sm text-foreground leading-relaxed space-y-1.5 list-disc list-inside marker:text-primary">
            <li>If PREVENT is borderline or intermediate, CAC &gt;100 supports <strong>starting or intensifying statin therapy</strong> rather than deferring treatment.<Cite n={1} source="Grundy SM, et al. 2018 AHA/ACC/Multisociety Cholesterol Guideline. Circulation. 2019;139(25):e1082–e1143." /></li>
            <li>CAC &gt;100 implies the patient's true risk is likely <strong>higher than PREVENT alone suggests</strong> — it adds direct evidence of established plaque burden.<Cite n={4} source="MESA (Multi-Ethnic Study of Atherosclerosis): CAC improves discrimination over traditional risk factors. McClelland RL, et al. JACC. 2015;66:1643–1653." /></li>
            <li>In some studies, CAC ≥100 conferred risk approaching <strong>secondary-prevention-like levels</strong>, especially at higher CAC burdens.<Cite n={5} source="Mortensen MB, et al. Association of CAC with risk approaching secondary prevention. JAMA Cardiol. 2022;7(2):192–201." /></li>
          </ul>
        </div>

        {/* What to do next — guideline-style action callout */}
        <div className="rounded-lg border-2 border-primary/40 bg-gradient-to-br from-primary/10 to-primary/5 p-4 mb-4 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/20">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
            </span>
            <p className="text-xs font-bold uppercase tracking-wider text-primary">What to Do Next — Guideline-Directed Action</p>
          </div>

          <div className="space-y-3">
            <div className="rounded-md border border-warning/30 bg-warning/100/5 p-3">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="rounded bg-warning/100/20 px-2 py-0.5 text-xs font-bold text-orange-600 dark:text-warning">
                  CAC ≥100 AU
                </span>
                <span className="text-xs font-semibold text-foreground">→ START or INTENSIFY statin</span>
              </div>
              <ul className="text-xs text-foreground leading-relaxed space-y-1 ml-1">
                <li>• Initiate <strong>high-intensity statin</strong> (atorvastatin 40–80 mg or rosuvastatin 20–40 mg).<Cite n={1} source="2018 AHA/ACC/Multisociety Cholesterol Guideline — Class IIa recommendation." /></li>
                <li>• LDL-C target <strong>&lt;55 mg/dL (&lt;1.4 mmol/L)</strong>; non-HDL-C &lt;85 mg/dL.</li>
                <li>• Add <strong>ezetimibe 10 mg</strong> if LDL-C goal not met at 4–12 weeks.</li>
                <li>• Lifestyle reinforcement, BP &lt;130/80, A1c optimization.</li>
              </ul>
            </div>

            <div className="rounded-md border border-danger/30 bg-danger/5 p-3">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="rounded bg-danger/20 px-2 py-0.5 text-xs font-bold text-danger">
                  CAC ≥300 AU
                </span>
                <span className="text-xs font-semibold text-foreground">→ MAXIMAL statin + add-on therapy</span>
              </div>
              <ul className="text-xs text-foreground leading-relaxed space-y-1 ml-1">
                <li>• <strong>Maximally tolerated high-intensity statin</strong> + ezetimibe upfront.<Cite n={5} source="Mortensen MB, et al. CAC ≥300 confers risk approaching established ASCVD. JAMA Cardiol. 2022." /></li>
                <li>• LDL-C target <strong>&lt;55 mg/dL</strong>; consider <strong>&lt;40 mg/dL if CAC ≥1000</strong>.</li>
                <li>• Add <strong>PCSK9 inhibitor or bempedoic acid</strong> if LDL-C goals unmet.</li>
                <li>• Consider <strong>low-dose aspirin</strong> after shared decision-making (bleeding risk vs. event risk).<Cite n={6} source="Cainzos-Achirica M, et al. Aspirin for primary prevention: CAC-guided decision-making. JACC. 2020;76:1499–1511." /></li>
                <li>• Functional/anatomic testing if symptoms — consider CCTA or stress imaging.</li>
              </ul>
            </div>
          </div>

          <p className="mt-3 text-xs text-muted-foreground italic leading-relaxed">
            These actions reflect 2018 ACC/AHA cholesterol guideline recommendations operationalized for CAC-defined high risk. Always individualize via shared decision-making.
          </p>
        </div>

        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">CAC Rule of Thumb</p>
        <div className="space-y-2">
          {[
            { range: "0",        interp: "Risk often LOWER than PREVENT alone suggests — defer/avoid statin reasonable", tone: "bg-success/15 text-success" },
            { range: "1–99",     interp: "Modest upward shift — moderate-intensity statin generally favored",            tone: "bg-warning/100/15 text-warning dark:text-warning" },
            { range: "≥100",     interp: "Meaningful upward shift — favors pharmacologic prevention (high-intensity statin)", tone: "bg-warning/100/15 text-orange-600 dark:text-warning" },
            { range: "≥300",     interp: "Very high risk — treat aggressively; consider tighter LDL-C targets",          tone: "bg-danger/15 text-danger" },
            { range: "≥1000",    interp: "Risk approaching secondary prevention — maximal therapy warranted",            tone: "bg-danger/25 text-danger font-bold" },
          ].map((row) => (
            <div
              key={row.range}
              className="flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/20 px-3 py-2.5"
            >
              <span className={`rounded px-2 py-0.5 text-xs font-bold whitespace-nowrap ${row.tone}`}>
                CAC {row.range}
              </span>
              <span className="text-sm leading-snug text-foreground flex-1 text-right">{row.interp}</span>
            </div>
          ))}
        </div>

        <p className="mt-3 text-xs text-muted-foreground italic leading-relaxed">
          Bottom line: CAC &gt;100 upgrades the PREVENT-based risk discussion and usually strengthens the case for statins and tighter preventive targets.
        </p>
      </SectionCard>

      {/* ─── CAC Threshold Quick-Guide (clickable) ─── */}
      <SectionCard
        title="CAC Threshold Quick-Guide"
        tone="indigo"
        icon={<ScanLine className="h-4 w-4" />}
        defaultOpen={false}
      >
        <p className="mb-3 text-xs text-muted-foreground">
          Click any range to expand its clinical interpretation, expected event risk, and recommended action.
        </p>
        <div className="space-y-2">
          {[
            {
              range: "0",
              label: "CAC 0",
              tone: "bg-success/15 text-success border-success/30",
              summary: "No detectable calcified plaque",
              risk: "Very low 10-yr ASCVD risk (~1–2%)",
              interp: "Risk is often LOWER than PREVENT alone suggests. The 'power of zero' — strong negative predictive value out to 10 years in low/intermediate-risk adults.",
              action: "Reasonable to DEFER statin in borderline/intermediate PREVENT risk (unless diabetes, FH, smoker, or strong family history). Reassess CAC in 5–10 years.",
            },
            {
              range: "1–99",
              label: "CAC 1–99 AU",
              tone: "bg-warning/100/15 text-warning dark:text-warning border-amber-500/30",
              summary: "Mild calcified plaque burden",
              risk: "Modest upward shift in risk vs. CAC 0",
              interp: "Confirms presence of subclinical atherosclerosis. Particularly meaningful in younger adults (<55 y) where any CAC is abnormal.",
              action: "Initiate moderate-intensity statin. LDL-C target <70 mg/dL (<1.8 mmol/L). Address all risk factors aggressively.",
            },
            {
              range: "≥100",
              label: "CAC ≥100 AU",
              tone: "bg-warning/100/15 text-orange-600 dark:text-warning border-warning/30",
              summary: "Significant plaque burden — 2018 ACC/AHA statin trigger",
              risk: "Meaningful upward shift; risk often >7.5%/10-yr regardless of PREVENT estimate",
              interp: "True risk is likely higher than PREVENT alone suggests. CAC ≥100 OR ≥75th percentile is the guideline-endorsed threshold favoring statin initiation when treatment decision is uncertain.",
              action: "Start (or intensify to) high-intensity statin. LDL-C target <55 mg/dL (<1.4 mmol/L). Consider ezetimibe add-on if LDL-C goal not met.",
            },
            {
              range: "≥300",
              label: "CAC ≥300 AU",
              tone: "bg-danger/15 text-danger border-danger/30",
              summary: "Extensive coronary calcification",
              risk: "Very high risk — approaching secondary-prevention event rates in some cohorts",
              interp: "Patient is functionally in a 'CAC-defined high-risk' category. Treat as if established ASCVD risk equivalent for lipid targets.",
              action: "Maximal-intensity statin + ezetimibe. LDL-C target <55 mg/dL (consider <40 mg/dL if CAC ≥1000). Add PCSK9 inhibitor if goals unmet. Aspirin discussion warranted.",
            },
          ].map((row) => (
            <details
              key={row.range}
              className={`group rounded-lg border bg-muted/10 transition-colors ${row.tone.split(" ").filter(c => c.startsWith("border-")).join(" ")}`}
            >
              <summary className="flex cursor-pointer items-center justify-between gap-3 px-3 py-2.5 list-none [&::-webkit-details-marker]:hidden">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <span className={`rounded px-2 py-0.5 text-xs font-bold whitespace-nowrap ${row.tone.split(" ").filter(c => !c.startsWith("border-")).join(" ")}`}>
                    {row.label}
                  </span>
                  <span className="text-sm text-foreground truncate">{row.summary}</span>
                </div>
                <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-open:rotate-180 shrink-0" />
              </summary>
              <div className="space-y-2 border-t border-border/50 px-3 py-3 text-sm">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Event Risk: </span>
                  <span className="text-foreground">{row.risk}</span>
                </div>
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Interpretation: </span>
                  <span className="text-foreground leading-relaxed">{row.interp}</span>
                </div>
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-primary">Recommended Action: </span>
                  <span className="text-foreground leading-relaxed">{row.action}</span>
                </div>
              </div>
            </details>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
