import { Card } from "@/components/ui/card";
import ImageLink from "@/components/ImageLink";
import {
  Heart,
  TrendingUp,
  AlertTriangle,
  Dna,
  Activity,
  ShieldCheck,
  Info,
} from "lucide-react";
import { SectionCard } from "@/components/ui/section-card";

// Lp(a) Levels with risk progression
const LPA_LEVELS = [
  {
    level: "Optimal",
    value: "≤14 mg/dL (≤35 nmol/L)",
    color: "text-success",
    bgColor: "bg-success/10",
    borderColor: "border-success/20",
  },
  {
    level: "Normal",
    value: "≤30 mg/dL (≤75 nmol/L)",
    color: "text-primary",
    bgColor: "bg-primary/10",
    borderColor: "border-primary/20",
  },
  {
    level: "Elevated",
    value: ">50 mg/dL (>125 nmol/L)",
    color: "text-danger",
    bgColor: "bg-danger/10",
    borderColor: "border-danger/20",
  },
];

const LPA_RISK_PROGRESSION = [
  {
    range: "10–49 mg/dL (25–124 nmol/L)",
    risk: "28% higher",
    color: "text-primary",
    bgColor: "bg-primary/20",
  },
  {
    range: "50–99 mg/dL (125–249 nmol/L)",
    risk: "44% higher",
    color: "text-warning",
    bgColor: "bg-warning/20",
  },
  {
    range: ">100 mg/dL (>250 nmol/L)",
    risk: "114% higher",
    color: "text-danger",
    bgColor: "bg-danger/20",
    bold: true,
  },
];

// ASCVD Risk Categories with LAI 2023 emphasis
const ASCVD_RISK_CATEGORIES = [
  {
    category: "Very High Risk",
    criteria:
      "ASCVD, diabetes with organ damage/>20y duration, eGFR<30, FH with ASCVD, SCORE>10%",
    ldlTarget: "<55 mg/dL (<1.4 mmol/L)",
    color: "text-danger",
    bgColor: "bg-danger/5",
    borderColor: "border-danger/20",
  },
  {
    category: "High Risk",
    criteria:
      "LDL-C>190, TC>310, BP>180/110, FH, diabetes>10y, eGFR 30–59, SCORE 5–10%",
    ldlTarget: "<70 mg/dL (<1.8 mmol/L)",
    color: "text-warning",
    bgColor: "bg-warning/5",
    borderColor: "border-warning/20",
  },
  {
    category: "Moderate Risk",
    criteria:
      "Younger diabetes, diabetes<10y without other risks, SCORE 1–5%",
    ldlTarget: "<100 mg/dL (<2.6 mmol/L)",
    color: "text-primary",
    bgColor: "bg-primary/5",
    borderColor: "border-primary/20",
  },
  {
    category: "Low Risk",
    criteria: "SCORE <1%",
    ldlTarget: "<116 mg/dL (<3.0 mmol/L)",
    color: "text-success",
    bgColor: "bg-success/5",
    borderColor: "border-success/20",
  },
];

// ApoB educational points
const APOB_POINTS = [
  {
    text: "LDL is sometimes calculated; ApoB is always measured.",
    highlight: "measured",
    color: "text-purple-500",
  },
  {
    text: "LDL is just one of three atherogenic particles. ApoB counts all of them.",
    highlight: "counts all of them",
    color: "text-blue-500",
  },
  {
    text: "ApoB is a more accurate predictor of cardiovascular events than LDL-C.",
    highlight: "more accurate predictor",
    color: "text-cyan-500",
  },
  {
    text: "When ApoB and LDL-C disagree, ApoB is the better predictor of risk.",
    highlight: "better predictor",
    color: "text-emerald-500",
  },
  {
    text: "Young adults with high ApoB but normal LDL-C had a 55% higher risk of developing coronary artery calcification 25 years later.",
    highlight: "55% higher risk",
    color: "text-warning",
    bold: true,
  },
];

// LAI 2023 Risk Modifiers specific to Indian population
const LAI_RISK_MODIFIERS = [
  { id: "lpa", label: "Lipoprotein(a) 20–49 mg/dL", category: "Lipid" },
  { id: "ifg", label: "IFG / Prediabetes (FBG 100–125 mg/dL)", category: "Metabolic" },
  { id: "waist", label: "Increased waist circumference (>90cm men, >80cm women)", category: "Anthropometric" },
  { id: "hscrp", label: "hsCRP >2 mg/L", category: "Inflammatory" },
  { id: "tg", label: "Triglycerides >150 mg/dL (fasting) or >175 mg/dL (non-fasting)", category: "Lipid" },
  { id: "autoimmune", label: "RA, Psoriasis, Spondyloarthropathies", category: "Inflammatory" },
  { id: "pregnancy", label: "Premature menopause, Pre-eclampsia, GDM, PMOS", category: "Women's Health" },
  { id: "prs", label: "High polygenic risk score", category: "Genetic" },
  { id: "pollution", label: "Air pollution exposure", category: "Environmental" },
  { id: "hiv", label: "HIV infection", category: "Infectious" },
];

// Primary Prevention LDL-C Targets by 10-Year Risk
const PRIMARY_PREVENTION_TIERS = [
  { risk: "Low (<5%)", ldl: "<100 mg/dL (<2.6 mmol/L)", color: "text-success", bg: "bg-success/10" },
  { risk: "Borderline (5–7.5%)", ldl: "<100 mg/dL (<2.6 mmol/L) — consider statin", color: "text-primary", bg: "bg-primary/10" },
  { risk: "Intermediate (7.5–20%)", ldl: "<70 mg/dL (<1.8 mmol/L)", color: "text-warning", bg: "bg-warning/10" },
  { risk: "High (≥20%)", ldl: "<55 mg/dL (<1.4 mmol/L)", color: "text-danger", bg: "bg-danger/10" },
];

export default function LipidsOverview() {
  return (
    <div className="space-y-6">
      {/* 2026 AHA/ACC Guidelines At-a-Glance */}
      <Card className="border-blue-500/30 bg-blue-500/5 p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/20">
            <Heart className="h-4 w-4 text-blue-500" />
          </div>
          <h3 className="font-display text-base font-bold text-blue-600 dark:text-blue-400">
            2026 AHA/ACC Dyslipidemia Guidelines At-a-Glance
          </h3>
        </div>

        <p className="text-sm text-foreground leading-relaxed mb-4 p-3 rounded-lg border border-blue-500/20 bg-blue-500/10">
          The American Heart Association and American College of Cardiology
          released the first cholesterol guideline update in eight years, with{" "}
          <strong className="text-blue-600 dark:text-blue-400">
            52 distinct new recommendations
          </strong>
          .
        </p>

        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-4 mb-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-2">
            Key Recommendation
          </p>
          <p className="text-sm text-foreground leading-relaxed">
            <strong className="text-emerald-600 dark:text-emerald-400">
              Lp(a) Screening:
            </strong>{" "}
            Measure Lp(a) at least once in every adult's life to identify very
            high inherited levels (&gt;180 mg/dL / &gt;430 nmol/L), which can
            reclassify moderate-risk patients to higher risk.
          </p>
        </div>

        <div className="rounded-lg border border-amber-500/30 bg-warning/100/5 p-4 space-y-2.5 text-sm text-foreground leading-relaxed mb-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-warning dark:text-warning mb-2">
            Biggest Changes
          </p>
          <p>
            •{" "}
            <strong className="text-warning dark:text-warning">
              Lp(a) testing
            </strong>{" "}
            is now recommended for all adults.
          </p>
          <p>
            • Treatment is now recommended for{" "}
            <strong className="text-warning dark:text-warning">
              younger adults
            </strong>
            , based on 30-year risk projections.
          </p>
          <p>
            •{" "}
            <strong className="text-warning dark:text-warning">
              ApoB testing, hsCRP, and CAC
            </strong>{" "}
            are recommended more frequently.
          </p>
          <p>
            •{" "}
            <strong className="text-warning dark:text-warning">
              Specific LDL targets are back
            </strong>
            , after being removed in the 2013 guidelines.
          </p>
        </div>

        {/* Risk Categories & LDL-C Targets */}
        <div className="mb-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
            Risk Categories & LDL-C Targets
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 pr-3 font-semibold text-muted-foreground">
                    Risk Level
                  </th>
                  <th className="text-left py-2 pr-3 font-semibold text-muted-foreground">
                    Clinical Criteria
                  </th>
                  <th className="text-left py-2 font-semibold text-muted-foreground">
                    LDL-C Target
                  </th>
                </tr>
              </thead>
              <tbody className="text-foreground">
                {ASCVD_RISK_CATEGORIES.map((cat, idx) => (
                  <tr
                    key={cat.category}
                    className={idx < ASCVD_RISK_CATEGORIES.length - 1 ? "border-b border-border/50" : ""}
                  >
                    <td className={`py-2.5 pr-3 font-semibold ${cat.color}`}>
                      {cat.category}
                    </td>
                    <td className="py-2.5 pr-3 text-xs leading-relaxed">
                      {cat.criteria}
                    </td>
                    <td className="py-2.5 font-semibold whitespace-nowrap">
                      {cat.ldlTarget}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ApoB Treatment Targets */}
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 mb-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-primary mb-2">
            ApoB Treatment Targets
          </p>
          <p className="text-sm text-foreground leading-relaxed mb-3">
            Because on-treatment LDL-C and apoB levels were nearly identical in
            trial data, the same number can be used for both.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 pr-3 font-semibold text-muted-foreground">
                    Risk Level
                  </th>
                  <th className="text-left py-2 pr-3 font-semibold text-muted-foreground">
                    LDL-C Target
                  </th>
                  <th className="text-left py-2 font-semibold text-muted-foreground">
                    ApoB Target
                  </th>
                </tr>
              </thead>
              <tbody className="text-foreground">
                <tr className="border-b border-border/50">
                  <td className="py-2 pr-3 font-semibold text-danger">
                    Very High
                  </td>
                  <td className="py-2 pr-3">&lt;55 mg/dL (&lt;1.4 mmol/L)</td>
                  <td className="py-2">&lt;55 mg/dL (0.55 g/L)</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-2 pr-3 font-semibold text-warning">
                    High
                  </td>
                  <td className="py-2 pr-3">&lt;70 mg/dL (&lt;1.8 mmol/L)</td>
                  <td className="py-2">&lt;70 mg/dL (0.70 g/L)</td>
                </tr>
                <tr>
                  <td className="py-2 pr-3 font-semibold text-primary">
                    Moderate
                  </td>
                  <td className="py-2 pr-3">&lt;100 mg/dL (&lt;2.6 mmol/L)</td>
                  <td className="py-2">&lt;100 mg/dL (1.0 g/L)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Clinical ASCVD Definition */}
        <div className="rounded-lg border border-border bg-muted/50 p-4 mb-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            Clinical ASCVD: Very High Risk Definition
          </p>
          <p className="text-sm text-foreground leading-relaxed mb-2">
            ≥2 major ASCVD events <strong>OR</strong> 1 major ASCVD event + ≥2
            high-risk conditions:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-foreground">
            <div>
              <p className="font-semibold mb-1">Major ASCVD Events:</p>
              <p className="text-muted-foreground leading-relaxed">
                ACS, MI, ischemic stroke, symptomatic PAD
              </p>
            </div>
            <div>
              <p className="font-semibold mb-1">High-Risk Conditions:</p>
              <p className="text-muted-foreground leading-relaxed">
                Age ≥65, coronary bypass/PCI, current smoker, diabetes, HF,
                HTN, LDL-C ≥100 despite max statin + ezetimibe
              </p>
            </div>
          </div>
        </div>

        <p className="mt-4 text-xs text-muted-foreground italic">
          Source: 2026 AHA/ACC Dyslipidemia Guidelines At-a-Glance
        </p>
      </Card>

      {/* Infographic Image */}
      <Card className="border-blue-500/20 bg-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/10">
            <svg className="h-4 w-4 text-blue-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
          </div>
          <h3 className="font-display text-sm font-bold text-foreground">
            Lipid Management Infographic
          </h3>
        </div>
        <div className="rounded-lg overflow-hidden border border-border/50">
          <img
            src="/lipids-infographic.jpg"
            alt="Lipid Management Infographic"
            className="w-full h-auto object-contain"
            loading="lazy"
          />
        </div>
      </Card>

      {/* LAI 2023 Indian Guidelines Section */}
      <Card className="border-warning/30 bg-warning/100/5 p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-orange-500/20 to-amber-500/20 backdrop-blur-md border border-warning/30">
            <Info className="h-5 w-5 text-orange-600" />
          </div>
          <div>
            <h3 className="font-display text-lg font-bold text-foreground">
              LAI 2023 Indian Guidelines
            </h3>
            <p className="text-sm text-muted-foreground">
              Lipid Association of India — South Asian specific recommendations
            </p>
          </div>
        </div>

        <div className="rounded-lg border border-warning/20 bg-warning/100/10 p-4 mb-4">
          <p className="text-sm text-foreground leading-relaxed">
            <strong className="text-orange-600 dark:text-warning">
              South Asian populations
            </strong>{" "}
            have higher ASCVD risk at lower BMI and waist circumference
            thresholds. The LAI 2023 guidelines emphasize earlier intervention
            and more aggressive targets for Indian patients.
          </p>
        </div>

        <div className="mb-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
            LAI 2023 Risk Modifiers (Indian Population)
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {LAI_RISK_MODIFIERS.map((mod) => (
              <div
                key={mod.id}
                className="flex items-start gap-2 p-2 rounded-lg border border-warning/10 bg-warning/100/5"
              >
                <span className="text-orange-600 mt-0.5">•</span>
                <div>
                  <p className="text-sm text-foreground">{mod.label}</p>
                  <p className="text-xs text-muted-foreground uppercase">
                    {mod.category}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Primary Prevention Table */}
        <div className="mb-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
            Primary Prevention: Adults 30–79y Without ASCVD
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 pr-3 font-semibold text-muted-foreground">
                    10-Year Risk
                  </th>
                  <th className="text-left py-2 font-semibold text-muted-foreground">
                    LDL-C Target
                  </th>
                </tr>
              </thead>
              <tbody className="text-foreground">
                {PRIMARY_PREVENTION_TIERS.map((tier, idx) => (
                  <tr
                    key={tier.risk}
                    className={idx < PRIMARY_PREVENTION_TIERS.length - 1 ? "border-b border-border/50" : ""}
                  >
                    <td className={`py-2 pr-3 ${tier.color}`}>{tier.risk}</td>
                    <td className="py-2 font-semibold">{tier.ldl}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <p className="text-xs text-muted-foreground italic">
          Source: Lipid Association of India (LAI) 2023 Guidelines
        </p>
      </Card>

      {/* Lp(a) Section */}
      <Card className="border-border bg-card p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500/20 to-cyan-500/20 backdrop-blur-md border border-blue-500/30">
            <Dna className="h-5 w-5 text-blue-500" />
          </div>
          <h3 className="font-display text-lg font-bold text-foreground">
            Lp(a) — Lipoprotein(a)
          </h3>
        </div>

        {/* Lp(a) Levels */}
        <div className="space-y-3 mb-4">
          {LPA_LEVELS.map((level) => (
            <div
              key={level.level}
              className={`flex items-center gap-3 p-3 rounded-lg ${level.bgColor} border ${level.borderColor}`}
            >
              <div className={`flex h-8 w-8 items-center justify-center rounded-md ${level.bgColor}`}>
                <Heart className={`h-4 w-4 ${level.color}`} />
              </div>
              <div>
                <p className={`text-sm font-semibold ${level.color}`}>
                  {level.level}: {level.value}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Risk Progression */}
        <div className="space-y-2 mb-4">
          {LPA_RISK_PROGRESSION.map((item) => (
            <div key={item.range} className="flex items-center gap-3">
              <div
                className={`flex h-6 w-6 items-center justify-center rounded-md ${item.bgColor}`}
              >
                <TrendingUp className={`h-3 w-3 ${item.color}`} />
              </div>
              <p className="text-sm text-foreground">
                Lp(a) {item.range} →{" "}
                <strong className={`${item.color} ${item.bold ? "font-bold" : ""}`}>
                  {item.risk}
                </strong>{" "}
                cardiovascular risk
              </p>
            </div>
          ))}
        </div>

        <p className="text-sm text-muted-foreground italic">
          Lp(a) confers a genetic risk — it represents a specific, highly
          inherited subset of particles that are particularly dangerous.
        </p>
      </Card>

      {/* Familial Hypercholesterolemia (FH) Diagnosis Section */}
      <Card className="border-fuchsia-500/30 bg-gradient-to-br from-fuchsia-500/5 to-purple-500/5 p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-fuchsia-500/20 to-purple-500/20 backdrop-blur-md border border-fuchsia-500/30">
            <Dna className="h-5 w-5 text-fuchsia-500" />
          </div>
          <div>
            <h3 className="font-display text-lg font-bold text-foreground">
              Familial Hypercholesterolemia (FH) — Diagnosis
            </h3>
            <p className="text-sm text-muted-foreground">
              When to suspect, confirm, and cascade-screen for FH
            </p>
          </div>
        </div>

        {/* Suspect FH thresholds */}
        <div className="rounded-lg border border-fuchsia-500/20 bg-fuchsia-500/5 p-4 mb-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-fuchsia-600 dark:text-fuchsia-400 mb-2">
            Suspect FH
          </p>
          <div className="space-y-1.5 text-sm text-foreground leading-relaxed">
            <p>
              • <strong>Adults:</strong> LDL-C ≥190 mg/dL
            </p>
            <p>
              • <strong>Children:</strong> LDL-C ≥150–160 mg/dL
            </p>
          </div>
        </div>

        {/* Strong clues */}
        <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4 mb-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-2">
            Strong Clues
          </p>
          <div className="space-y-1.5 text-sm text-foreground leading-relaxed">
            <p>
              • <strong>Premature ASCVD</strong> (male &lt;55y / female &lt;65y)
            </p>
            <p>
              • <strong>Family history</strong> of premature ASCVD or high cholesterol
            </p>
            <p>
              • <strong>Xanthomas</strong> (tendon) / <strong>corneal arcus</strong> (young)
            </p>
          </div>
        </div>

        {/* Very high LDL → heterozygous vs homozygous */}
        <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-4 mb-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-red-600 dark:text-red-400 mb-2">
            Very High LDL-C (≥330–400 mg/dL)
          </p>
          <p className="text-sm text-foreground leading-relaxed">
            Suspect <strong>heterozygous vs homozygous FH</strong> — homozygous FH
            presents with extreme LDL-C, cutaneous xanthomas in childhood, and
            aortic valve disease; it requires urgent specialist referral and
            often apheresis.
          </p>
        </div>

        {/* Exclude secondary causes */}
        <div className="rounded-lg border border-sky-500/20 bg-sky-500/5 p-4 mb-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-sky-600 dark:text-sky-400 mb-2">
            Exclude Secondary Causes
          </p>
          <p className="text-sm text-foreground leading-relaxed">
            Before diagnosing FH, exclude secondary hypercholesterolemia with a
            basic <strong>diabetes / thyroid / liver / renal</strong> workup
            (fasting glucose/HbA1c, TSH, LFTs, renal function).
          </p>
        </div>

        {/* Genetic testing */}
        <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-2">
            Genetic Testing
          </p>
          <div className="space-y-1.5 text-sm text-foreground leading-relaxed">
            <p>
              • Confirms the variant (LDLR, APOB, PCSK9) and enables{" "}
              <strong>cascade screening</strong> of at-risk relatives.
            </p>
            <p>
              • <strong>Negative test ≠ excludes FH</strong> — a clinical
              diagnosis (e.g., DLCN ≥6) still warrants treatment.
            </p>
          </div>
        </div>
      </Card>

      {/* ApoB Section */}
      <Card className="border-border bg-card p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-md border border-purple-500/30">
            <Activity className="h-5 w-5 text-purple-500" />
          </div>
          <h3 className="font-display text-lg font-bold text-foreground">
            ApoB — Apolipoprotein B
          </h3>
        </div>

        <div className="space-y-3">
          {APOB_POINTS.map((point, idx) => (
            <div
              key={idx}
              className="flex items-start gap-3 p-3 rounded-lg bg-purple-500/5 border border-purple-500/10"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-purple-500/20 flex-shrink-0">
                {idx === 0 && <Dna className="h-4 w-4 text-purple-500" />}
                {idx === 1 && <Activity className="h-4 w-4 text-blue-500" />}
                {idx === 2 && <TrendingUp className="h-4 w-4 text-cyan-500" />}
                {idx === 3 && <Heart className="h-4 w-4 text-emerald-500" />}
                {idx === 4 && <AlertTriangle className="h-4 w-4 text-warning" />}
              </div>
              <p className="text-sm text-foreground">
                {point.text.split(point.highlight).map((part, i, arr) => (
                  <span key={i}>
                    {part}
                    {i < arr.length - 1 && (
                      <strong className={`${point.color} ${point.bold ? "font-bold" : ""}`}>
                        {point.highlight}
                      </strong>
                    )}
                  </span>
                ))}
              </p>
            </div>
          ))}
        </div>

        <p className="mt-3 text-sm text-muted-foreground italic">
          ApoB is "sticky cholesterol" — it reflects the total number of
          atherogenic particles (LDL + Lp(a) + others).
        </p>
      </Card>

      {/* CAC Score Management */}
      <SectionCard
        title="Subclinical Atherosclerosis — CAC Score Management"
        tone="indigo"
        icon={<ShieldCheck className="h-4 w-4" />}
        defaultOpen={false}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 pr-3 font-semibold text-muted-foreground">
                  CAC Score
                </th>
                <th className="text-left py-2 pr-3 font-semibold text-muted-foreground">
                  Risk / Action
                </th>
                <th className="text-left py-2 font-semibold text-muted-foreground">
                  LDL-C Target
                </th>
              </tr>
            </thead>
            <tbody className="text-foreground">
              <tr className="border-b border-border/50">
                <td className="py-2.5 pr-3 font-semibold">0</td>
                <td className="py-2.5 pr-3">Low risk</td>
                <td className="py-2.5 font-semibold">
                  &lt;100 mg/dL (&lt;2.6 mmol/L)
                </td>
              </tr>
              <tr className="border-b border-border/50">
                <td className="py-2.5 pr-3 font-semibold">1–99 AU</td>
                <td className="py-2.5 pr-3">Start moderate statin</td>
                <td className="py-2.5 font-semibold">
                  &lt;70 mg/dL (&lt;1.8 mmol/L)
                </td>
              </tr>
              <tr className="border-b border-border/50">
                <td className="py-2.5 pr-3 font-semibold">100–399 AU</td>
                <td className="py-2.5 pr-3">High-intensity statin</td>
                <td className="py-2.5 font-semibold">
                  &lt;55 mg/dL (&lt;1.4 mmol/L)
                </td>
              </tr>
              <tr>
                <td className="py-2.5 pr-3 font-semibold text-danger">
                  ≥400 AU
                </td>
                <td className="py-2.5 pr-3">Very high-intensity</td>
                <td className="py-2.5 font-semibold">
                  &lt;40 mg/dL (&lt;1.0 mmol/L)
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </SectionCard>

      {/* Lipid Panel Decoded — Image */}
      <Card className="border-emerald-500/30 bg-gradient-to-br from-emerald-500/5 to-muted/5 p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500/20 to-teal-500/20 backdrop-blur-md border border-emerald-500/30">
            <Activity className="h-5 w-5 text-emerald-500" />
          </div>
          <div>
            <h3 className="font-display text-lg font-bold text-foreground">
              Lipid Panel Decoded — Clinical Algorithm
            </h3>
            <p className="text-xs text-muted-foreground">
              A functional medicine approach: Beyond LDL • ApoB • Particles • Patterns • Action
            </p>
          </div>
        </div>

        <div className="mt-3">
          <ImageLink imageId="lipids-infographic" label="View Lipids Infographic →" />
        </div>
        <p className="text-xs text-muted-foreground mt-3 italic">
          Functional medicine approach. Note: This uses more aggressive targets than major guidelines (ACC/AHA, ESC/EAS, NICE). Use clinical judgment and evidence-based guidelines to refine risk assessment and treatment.
        </p>
      </Card>

      {/* Summary Card */}
      <Card className="border-primary/20 bg-primary/5 p-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-primary mb-2">
          Clinical Summary
        </p>
        <div className="space-y-1.5 text-sm text-foreground leading-relaxed">
          <p>
            • <strong>Screening:</strong> Lp(a) once in adults, lipid profile
            every 5y
          </p>
          <p>
            • <strong>Targets:</strong> Very high-risk &lt;55 mg/dL (&lt;1.4
            mmol/L), high &lt;70 mg/dL (&lt;1.8 mmol/L), moderate &lt;100 mg/dL
            (&lt;2.6 mmol/L)
          </p>
          <p>
            • <strong>Key drugs:</strong> Statins first, then ezetimibe / PCSK9i
            / bempedoic acid
          </p>
          <p>
            • <strong>Special cases:</strong> TG ≥500 → fibrates/omega-3;
            severe hypercholesterolemia → cascade screening + PCSK9i
          </p>
          <p>
            • <strong>LAI 2023:</strong> Consider earlier intervention for South
            Asian populations
          </p>
        </div>
      </Card>
    </div>
  );
}
