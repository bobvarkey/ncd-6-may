import { useState } from "react";
import { BookOpen, ChevronDown, ChevronUp, Stethoscope, Heart, Scale, Activity, Pill, FlaskConical } from "lucide-react";

const guidelines = [
  {
    icon: Pill,
    title: "Medication Adherence",
    text: "Facilitating medication adherence should be specifically considered when selecting glucose-lowering medications. Patient preference is a major factor — route of administration, injection devices, side effects, and cost may prevent use by some individuals, even when clinical evidence supports a particular medication.",
  },
  {
    icon: BookOpen,
    title: "Diabetes Self-Management Education",
    text: "All patients should have ongoing access to diabetes self-management education and support (DSMES).",
  },
  {
    icon: Stethoscope,
    title: "Medical Nutrition Therapy",
    text: "Healthy eating advice and strategies (MNT) should be offered to all patients with type 2 diabetes.",
  },
  {
    icon: Scale,
    title: "Weight Management",
    text: "All overweight and obese patients with diabetes should be advised of the health benefits of weight loss and encouraged to engage in a programme of intensive lifestyle management, which may include food substitution.",
  },
  {
    icon: Activity,
    title: "Physical Activity",
    text: "Increasing physical activity improves glycaemic control and should be encouraged in all people with type 2 diabetes.",
  },
  {
    icon: Scale,
    title: "Metabolic Surgery",
    text: "Recommended for adults with T2DM and (1) BMI ≥40 (≥37.5 Asian ancestry) or (2) BMI 35.0–39.9 (32.5–37.4 Asian) who do not achieve durable weight loss and improvement in comorbidities with reasonable non-surgical methods.",
  },
  {
    icon: Pill,
    title: "First-Line Therapy",
    text: "Metformin continues to be the first-line recommended therapy for almost all patients with type 2 diabetes.",
  },
  {
    icon: Heart,
    title: "Cardiovascular Disease",
    text: "For patients with clinical CVD, an SGLT2 inhibitor or GLP-1 receptor agonist with proven cardiovascular benefit is recommended. Individual agents within these classes have demonstrated cardiovascular benefits.",
  },
  {
    icon: FlaskConical,
    title: "CKD & Heart Failure",
    text: "For patients with CKD or clinical heart failure and ASCVD, an SGLT2 inhibitor with proven benefit should be considered.",
  },
  {
    icon: Pill,
    title: "Injectable Therapy",
    text: "GLP-1 receptor agonists are generally recommended as the first injectable medication, except in settings where type 1 diabetes is suspected.",
  },
  {
    icon: Stethoscope,
    title: "Intensification Beyond Dual Therapy",
    text: "Requires consideration of the impact of medication side-effects on comorbidities, as well as the burden of treatment and cost. Selection added to metformin is based on patient preference and clinical characteristics.",
  },
];

const researchNote = `The panel notes the lack of evidence over specific combinations of glucose-lowering therapies remains an issue. Key questions include: Do the CV and renal benefits of SGLT2 inhibitors and GLP-1 RAs in established CVD extend to lower-risk patients? Is there additive benefit of combined use? Defining optimal cost-effective approaches, particularly for patients with multi-morbidity, is essential.`;

export function ClinicalGuidelines() {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="clinical-card">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between"
      >
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-primary" />
          <h3 className="section-title">ADA 2026 Clinical Considerations & Guidelines</h3>
        </div>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        )}
      </button>

      {expanded && (
        <div className="mt-4 space-y-3 animate-slide-in">
          {guidelines.map((g, i) => {
            const Icon = g.icon;
            return (
              <div key={i} className="flex items-start gap-2.5 p-2.5 rounded-lg bg-muted/30">
                <Icon className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-medium">{g.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{g.text}</p>
                </div>
              </div>
            );
          })}

          <div className="mt-4 p-3 rounded-lg border border-dashed border-info/30 bg-info/5">
            <p className="text-xs font-medium text-info mb-1">Research Considerations</p>
            <p className="text-xs text-muted-foreground leading-relaxed">{researchNote}</p>
          </div>
        </div>
      )}
    </div>
  );
}
