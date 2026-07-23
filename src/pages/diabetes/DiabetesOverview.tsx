import React from "react";
import { AlertCircle, Activity, Heart, Brain, Flame, Shield, Target, ArrowRight, Dna, Info, AlertTriangle, Stethoscope, UtensilsCrossed, Users, Microscope } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { AbbrText } from "@/components/AbbreviationHover";

// DM Types Classification Section
const DMTypeCard = ({ type, title, subtitle, icon, description, features, badge, badgeColor }: {
  type: string;
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  description: string;
  features: string[];
  badge?: string;
  badgeColor?: string;
}) => (
  <Card className={cn("clinical-card", badgeColor ? `border-${badgeColor}/20` : "")}>
    <CardHeader className="pb-3">
      <div className="flex items-start gap-2">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
          {React.cloneElement(icon as React.ReactElement, { className: "h-4 w-4 text-primary" })}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <CardTitle className="text-base">{title}</CardTitle>
            {badge && (
              <Badge variant="outline" className={cn("text-[10px]", badgeColor ? `border-${badgeColor}/30 text-${badgeColor}` : "")}>
                {badge}
              </Badge>
            )}
          </div>
          {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
        </div>
      </div>
    </CardHeader>
    <CardContent className="space-y-2">
      <p className="text-sm text-muted-foreground">{description}</p>
      <div className="space-y-1">
        <p className="text-xs font-medium">Key Features:</p>
        <ul className="text-xs text-muted-foreground space-y-0.5">
          {features.map((f, i) => (
            <li key={i}>• {f}</li>
          ))}
        </ul>
      </div>
    </CardContent>
  </Card>
);

const DMClassificationSection = () => (
  <div className="space-y-4">
    <div className="flex items-center gap-2 mb-2">
      <Dna className="h-5 w-5 text-primary" />
      <h3 className="text-lg font-serif font-semibold">Diabetes Mellitus — Classification by Type</h3>
    </div>
    <p className="text-sm text-muted-foreground mb-4">
      Beyond the classic Type 1 and Type 2 dichotomy, several other diabetes subtypes are recognized — some officially, others as proposed or descriptive categories.
    </p>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <DMTypeCard
        type="type1"
        title="Type 1 Diabetes"
        icon={<Flame />}
        description="Autoimmune destruction of pancreatic beta cells leading to absolute insulin deficiency. Typically presents in childhood or young adulthood."
        features={[
          "Autoantibodies present (GAD65, IA-2, ZnT8)",
          "Rapid onset with classic symptoms",
          "Ketosis-prone without insulin",
          "Requires lifelong insulin therapy"
        ]}
        badge="Classic"
        badgeColor="destructive"
      />

      <DMTypeCard
        type="type2"
        title="Type 2 Diabetes"
        icon={<Activity />}
        description="Progressive insulin resistance with relative insulin deficiency. Strong genetic and lifestyle factors."
        features={[
          "Insulin resistance predominates initially",
          "Beta-cell dysfunction develops over time",
          "Often associated with obesity",
          "May have slow, insidious onset"
        ]}
        badge="Classic"
        badgeColor="warning"
      />

      <DMTypeCard
        type="lada"
        title="Type 1.5 Diabetes (LADA)"
        subtitle="Latent Autoimmune Diabetes in Adults"
        icon={<Microscope />}
        description="A slowly progressive autoimmune diabetes that straddles Type 1 and Type 2. Presents in adults (&gt;30 years) with detectable autoantibodies but initial non-insulin requirement."
        features={[
          "Positive GAD65 antibodies (most sensitive)",
          "Slower beta-cell decline than classic T1DM",
          "Often misdiagnosed as T2DM initially",
          "Progresses to insulin dependence within 3-6 years",
          "Lower BMI, younger onset than typical T2DM"
        ]}
        badge="Autoimmune"
        badgeColor="purple"
      />

      <DMTypeCard
        type="type3c"
        title="Type 3c Diabetes"
        subtitle="Pancreatogenic / Pancreoprivic Diabetes"
        icon={<Stethoscope />}
        description="Occurs when the pancreas itself is damaged, leading to loss of both endocrine (insulin-producing) and exocrine (enzyme-producing) functions."
        features={[
          "Causes: chronic pancreatitis, pancreatic cancer, cystic fibrosis, pancreatic resection",
          "Concurrent exocrine pancreatic insufficiency (low fecal elastase)",
          "Brittle course with risk of hypoglycemia (loss of glucagon reserve)",
          "Requires insulin; metformin may be insufficient",
          "Pancreatic enzyme replacement therapy (PERT) needed"
        ]}
        badge="Secondary"
        badgeColor="orange"
      />

      <DMTypeCard
        type="type3b"
        title="Type 3b Diabetes"
        subtitle="Genetic Insulin Resistance Syndromes"
        icon={<Dna />}
        description="Any form of diabetes caused by genetic defects that affect the action of insulin — monogenic severe insulin resistance syndromes."
        features={[
          "Genetic defects in insulin receptor (INSR) or post-receptor signaling",
          "Includes: Type A insulin resistance, Rabson-Mendenhall syndrome, Donohue syndrome",
          "Severe hyperinsulinemia with acanthosis nigricans",
          "May have ovarian hyperandrogenism in females",
          "Distinct from T2DM — not obesity-driven"
        ]}
        badge="Monogenic"
        badgeColor="blue"
      />

      <DMTypeCard
        type="type3"
        title={"Type 3 Diabetes (Alzheimer's Disease)"}
        subtitle="Insulin Dysregulation in the Brain"
        icon={<Brain />}
        description={`"Type 3 diabetes" is a term some researchers use to describe Alzheimer's disease — reflecting the role of brain insulin resistance and dysregulated insulin signaling in neurodegeneration. Not an officially recognized health condition.`}
        features={[
          "Brain insulin resistance impairs glucose utilization in neurons",
          "Linked to tau hyperphosphorylation and amyloid-beta accumulation",
          "Reduced insulin receptor expression in Alzheimer's brains",
          "Not a formal ADA/WHO diagnosis — research concept only",
          "May explain link between T2DM and dementia risk"
        ]}
        badge="Proposed"
        badgeColor="violet"
      />

      <DMTypeCard
        type="type4"
        title="Type 4 Diabetes"
        subtitle="Age-Related Insulin Resistance in Lean Individuals"
        icon={<Users />}
        description="A proposed term for insulin resistance in older, lean individuals — distinct from Type 2 (obesity-linked) and Type 1 (autoimmune). Driven by age-related metabolic and immune changes."
        features={[
          "Excess T-regulatory immune cells (Tregs) in fat tissue",
          "Age-related immune dysregulation promotes insulin resistance",
          "Occurs in non-obese, older adults without traditional risk factors",
          "May explain undiagnosed diabetes in lean elderly",
          "Not yet an official diagnostic category"
        ]}
        badge="Proposed"
        badgeColor="violet"
      />

      <DMTypeCard
        type="type5"
        title="Type 5 Diabetes (MRDM)"
        subtitle="Malnutrition-Related Diabetes Mellitus"
        icon={<UtensilsCrossed />}
        description="A form of diabetes primarily caused by chronic undernutrition, especially during childhood or adolescence. Distinct from both Type 1 and Type 2 diabetes."
        features={[
          "History of chronic malnutrition in early life",
          "Presents with hyperglycemia but not ketosis-prone",
          "Often requires insulin but has some residual beta-cell function",
          "More common in low-resource settings (parts of Africa, Asia)",
          "Controversial category — not universally accepted by WHO/ADA"
        ]}
        badge="Proposed"
        badgeColor="violet"
      />
    </div>

    {/* Summary Table — Image */}
    <Card className="clinical-card mt-4">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Info className="h-4 w-4 text-primary" />
          DM Types — Quick Reference
        </CardTitle>
      </CardHeader>
      <CardContent>
        <img
          src="/dm-types-reference.jpg"
          alt="Diabetes Mellitus Types Classification Reference Table"
          className="w-full rounded-lg border border-border"
          style={{ maxWidth: "100%", height: "auto" }}
        />
      </CardContent>
    </Card>

    {/* Clinical Note */}
    <Card className="clinical-card border-amber-500/20 bg-amber-500/5">
      <CardContent className="pt-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-600 dark:text-amber-400">Clinical Note</p>
            <p className="text-xs text-muted-foreground mt-1">
              Types 3, 4, and 5 are not currently recognized as official diagnostic categories by the ADA or WHO. 
              They represent proposed or descriptive classifications that may aid clinical reasoning. 
              Type 3c and Type 3b are officially recognized under the broader category of "secondary diabetes" or "other specific types."
              Type 1.5 (LADA) is recognized as a subtype of Type 1 diabetes.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
);

// Pathophysiology Section
const PathophysiologySection = () => (
  <div className="space-y-4">
    <DMClassificationSection />

    <Separator />

    <Card className="clinical-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Brain className="h-4 w-4 text-primary" />
          The "Ominous Octet" — Pathophysiologic Defects
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { organ: "Brain", defect: "Neurotransmitter dysfunction", effect: "↑ Appetite" },
            { organ: "Liver", defect: "↑ Gluconeogenesis", effect: "↑ Fasting glucose" },
            { organ: "Muscle", defect: "↓ Glucose uptake", effect: "Post-prandial hyperglycemia" },
            { organ: "Fat", defect: "↑ Lipolysis", effect: "↑ FFA, insulin resistance" },
            { organ: "Gut", defect: "↓ Incretin effect", effect: "↓ Insulin secretion" },
            { organ: "α-cells", defect: "↑ Glucagon", effect: "↑ Hepatic glucose" },
            { organ: "β-cells", defect: "↓ Insulin secretion", effect: "Progressive hyperglycemia" },
            { organ: "Kidney", defect: "↑ Glucose reabsorption", effect: "Sustained hyperglycemia" },
          ].map((item, i) => (
            <div key={i} className="p-3 rounded-lg bg-muted/30 border border-border/50">
              <p className="text-xs font-semibold text-foreground">{item.organ}</p>
              <p className="text-xs text-muted-foreground mt-1">{item.defect}</p>
              <div className="mt-2 flex items-center gap-1">
                <ArrowRight className="h-3 w-3 text-red-500" />
                <span className="text-xs text-destructive">{item.effect}</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  </div>
);

// Diagnostic Criteria Section
const DiagnosticCriteriaSection = () => {
  const criteria = [
    { test: "HbA1c", threshold: "≥ 6.5%", notes: "NGSP-certified, DCCT-aligned" },
    { test: "Fasting Plasma Glucose", threshold: "≥ 126 mg/dL (7.0 mmol/L)", notes: "No caloric intake for ≥ 8 hours" },
    { test: "2-Hour OGTT", threshold: "≥ 200 mg/dL (11.1 mmol/L)", notes: "75g anhydrous glucose load" },
    { test: "Random Plasma Glucose", threshold: "≥ 200 mg/dL", notes: "With classic symptoms of hyperglycemia" },
  ];

  const prediabetes = [
    { test: "HbA1c", range: "5.7–6.4%" },
    { test: "Fasting Glucose", range: "100–125 mg/dL (IFG)" },
    { test: "2-Hour OGTT", range: "140–199 mg/dL (IGT)" },
  ];

  return (
    <div className="space-y-4">
      <Card className="clinical-card border-destructive/20">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-destructive/10 flex items-center justify-center">
              <Target className="h-4 w-4 text-destructive" />
            </div>
            <CardTitle className="text-base">ADA Diagnostic Criteria (2026)</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Confirm with repeat testing on a subsequent day unless unequivocal hyperglycemia with acute metabolic decompensation.
          </p>
          <div className="space-y-2">
            {criteria.map((c, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-destructive/5 border border-destructive/20">
                <div className="flex-1">
                  <p className="text-sm font-medium"><AbbrText text={c.test} /></p>
                  <p className="text-xs text-muted-foreground"><AbbrText text={c.notes} /></p>
                </div>
                <Badge variant="destructive" className="text-xs">{c.threshold}</Badge>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-4 italic">
            Source: ADA Standards of Care in Diabetes 2026
          </p>
        </CardContent>
      </Card>

      <Card className="clinical-card border-warning/20">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-warning/10 flex items-center justify-center">
              <AlertCircle className="h-4 w-4 text-warning" />
            </div>
            <CardTitle className="text-base">Prediabetes Categories</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {prediabetes.map((p, i) => (
              <div key={i} className="p-3 rounded-lg bg-warning/5 border border-warning/20">
                <p className="text-sm font-medium"><AbbrText text={p.test} /></p>
                <p className="text-lg font-semibold text-warning mt-1">{p.range}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 p-3 rounded-lg bg-muted/30">
            <p className="text-sm font-medium flex items-center gap-2">
              <Shield className="h-4 w-4 text-success" />
              Risk Reduction Priority
            </p>
            <ul className="text-xs text-muted-foreground mt-2 space-y-1">
              <li>• Lifestyle intervention reduces T2DM risk by 58% (DPP Study)</li>
              <li>• Metformin appropriate for high-risk patients (BMI ≥35, age &lt;60, prior GDM)</li>
              <li>• Annual screening for progression to diabetes</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Risk Stratification Section
const RiskStratificationSection = () => {
  const complications = [
    {
      category: "Microvascular",
      icon: <Activity className="h-4 w-4" />,
      items: [
        { name: "Diabetic Retinopathy", risk: "Leading cause of blindness 20-74y" },
        { name: "Diabetic Nephropathy", risk: "Leading cause of ESRD" },
        { name: "Diabetic Neuropathy", risk: "50% develop neuropathy" },
      ],
    },
    {
      category: "Macrovascular",
      icon: <Heart className="h-4 w-4" />,
      items: [
        { name: "ASCVD", risk: "2-4x increased risk" },
        { name: "Heart Failure", risk: "2-5x increased risk" },
        { name: "Cerebrovascular Disease", risk: "Increased stroke risk" },
      ],
    },
  ];

  const riskFactors = [
    { factor: "Duration of diabetes", impact: "Each year ↑ complication risk" },
    { factor: "HbA1c > 9%", impact: "Poor control accelerates complications" },
    { factor: "Hypertension", impact: "Major accelerator of nephropathy" },
    { factor: "Dyslipidemia", impact: "Drives macrovascular disease" },
    { factor: "Smoking", impact: "Multiplies vascular risk" },
    { factor: "Albuminuria", impact: "Marker of endothelial dysfunction" },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {complications.map((comp, i) => (
          <Card key={i} className="clinical-card">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  {React.cloneElement(comp.icon as React.ReactElement, { className: "h-4 w-4 text-primary" })}
                </div>
                <CardTitle className="text-base">{comp.category} Complications</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {comp.items.map((item, j) => (
                <div key={j} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                  <span className="text-sm font-medium">{item.name}</span>
                  <span className="text-xs text-muted-foreground">{item.risk}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="clinical-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Risk Factor Modifiers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {riskFactors.map((rf, i) => (
              <div key={i} className="flex items-start gap-3 p-2 rounded-lg border border-border/50">
                <div className={cn(
                  "w-2 h-2 rounded-full mt-1.5",
                  i < 2 ? "bg-destructive" : i < 4 ? "bg-warning" : "bg-success"
                )} />
                <div>
                  <p className="text-sm font-medium"><AbbrText text={rf.factor} /></p>
                  <p className="text-xs text-muted-foreground">{rf.impact}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="clinical-card border-success/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="h-4 w-4 text-success" />
            Risk Reduction Targets
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { metric: "HbA1c", target: "< 7%", note: "Individualize based on age/comorbidities" },
              { metric: "BP", target: "< 130/80", note: "Most adults with diabetes" },
              { metric: "LDL-C", target: "< 100", note: "Statins for age 40-75 with diabetes" },
              { metric: "Non-HDL-C", target: "< 130", note: "Alternative target if TG elevated" },
            ].map((t, i) => (
              <div key={i} className="p-3 rounded-lg bg-success/5 border border-success/20 text-center">
                <p className="text-xs text-muted-foreground"><AbbrText text={t.metric} /></p>
                <p className="text-lg font-bold text-success">{t.target}</p>
                <p className="text-xs text-muted-foreground mt-1">{t.note}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Main Component
export default function DiabetesOverview() {
  return (
    <div className="space-y-6">
      <PathophysiologySection />
      <Separator />
      <DiagnosticCriteriaSection />
      <Separator />
      <RiskStratificationSection />
    </div>
  );
}
