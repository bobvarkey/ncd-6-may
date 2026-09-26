import { useState } from "react";
import { AlertTriangle, Pill, Syringe, TrendingUp, Plus, ShieldAlert, ChevronDown, ChevronUp } from "lucide-react";

interface EducationSection {
  id: string;
  title: string;
  icon: React.ReactNode;
  color: string;
  content: {
    heading: string;
    tips: string[];
    details?: string;
  }[];
}

const Type2Transition = () => {
  const [expanded, setExpanded] = useState<string | null>("when-to-start");

  const sections: EducationSection[] = [
    {
      id: "when-to-start",
      title: "When to Start Basal Insulin",
      icon: <AlertTriangle className="w-5 h-5" />,
      color: "bg-warning/10 text-warning",
      content: [{
        heading: "Primary Indications",
        tips: [
          "A1C is well above goal (≥8.0%) despite optimized oral/GLP-1 therapy",
          "Blood glucose persistently high (fasting ≥130–150 mg/dL or more)",
          "These thresholds indicate beta-cell failure requiring insulin support"
        ]
      }]
    },
    {
      id: "which-orals",
      title: "Which Oral Agents to Keep",
      icon: <Pill className="w-5 h-5" />,
      color: "bg-success/10 text-success",
      content: [{
        heading: "Strategic Agent Continuation",
        tips: [
          "Continue metformin (if tolerated) — helps with weight and requires less insulin dose",
          "Continue GLP-1 RA or SGLT2i where appropriate (weight, ASCVD, HF, CKD)",
          "Often stop or taper secretagogues (sulfonylureas, meglitinides) once basal increases — reduces hypoglycemia risk"
        ],
        details: "GLP-1 RAs and SGLT2i can be safely combined with basal insulin. Metformin is weight-neutral and cardio-protective, so maintain it unless contraindicated."
      }]
    },
    {
      id: "how-to-start",
      title: "How to Start Basal Insulin",
      icon: <Syringe className="w-5 h-5" />,
      color: "bg-info/10 text-info",
      content: [{
        heading: "Starting Scheme",
        tips: [
          "Prefer long-acting analogue (glargine, detemir, degludec) over NPH — fewer nocturnal hypoglycemia events",
          "Starting dose based on A1C tier: A1C < 8.0% → 0.1–0.2 U/kg; A1C > 8.0% → 0.2–0.3 U/kg",
          "Give as a single daily injection at bedtime (or morning degludec)"
        ],
        details: "Example: 70 kg patient, A1C 8.5% → start about 15 units glargine at bedtime (0.2 U/kg = 14 units rounded to 15)."
      }]
    },
    {
      id: "titration",
      title: "Titration Strategy",
      icon: <TrendingUp className="w-5 h-5" />,
      color: "bg-primary/10 text-primary",
      content: [{
        heading: "Fasting Blood Glucose Titration",
        tips: [
          "Target fasting BG: usually ≤100–130 mg/dL (individualize; more liberal for frailty)",
          "Increase by 2–4 units every 3–4 days (or 10–15%) until fasting goal is reached",
          "If hypoglycemia: reduce by 10–20% and correct the cause (timing, food, activity, or dose)"
        ],
        details: "Continue titration for 2–4 weeks before deciding whether post-meal hyperglycemia needs prandial insulin. Slow titration reduces hypoglycemia risk."
      }]
    },
    {
      id: "add-prandial",
      title: "When to Add Prandial Insulin",
      icon: <Plus className="w-5 h-5" />,
      color: "bg-secondary/10 text-secondary",
      content: [{
        heading: "Escalation to Basal-Bolus",
        tips: [
          "Add rapid-acting insulin if A1C is still above target after basal optimization",
          "Look for frequently elevated post-meal glucose (often >180 mg/dL 2 hours after meals)",
          "Start with the largest meal, then add to other meals as needed"
        ],
        details: "Common starting dose: 10–20% of the basal dose or 4–6 units before the main meal, then titrate to post-meal targets."
      }]
    },
    {
      id: "key-pitfalls",
      title: "Key Pitfalls to Avoid",
      icon: <ShieldAlert className="w-5 h-5" />,
      color: "bg-destructive/10 text-destructive",
      content: [{
        heading: "Common Mistakes",
        tips: [
          "Don't stop metformin/GLP-1 RA/SGLT2i without reason — they complement insulin and help weight and cardiometabolic risk",
          "Don't start with empirically high basal dose — slow, bi-weekly titration reduces hypoglycemia risk",
          "Don't ignore post-meal glucose — persistent highs mean intensify regimen before A1C becomes very high"
        ]
      }]
    }
  ];

  return (
    <div className="space-y-6 animate-slide-in max-w-4xl mx-auto">
      {/* Hero Header */}
      <div className="rounded-xl p-6 text-primary-foreground" style={{ background: "var(--gradient-hero)" }}>
        <h1 className="text-3xl font-heading font-bold mb-2">Type 2 DM: Basal Insulin Transition</h1>
        <p className="text-sm text-primary-foreground/80">Evidence-based approach to initiating basal insulin while optimizing oral agents. Step-by-step dosing and titration strategy.</p>
      </div>

      {/* Expandable Sections */}
      <div className="space-y-3">
        {sections.map(section => {
          const isExpanded = expanded === section.id;
          return (
            <div key={section.id} className="clinical-card border border-border">
              <button
                onClick={() => setExpanded(isExpanded ? null : section.id)}
                className="w-full flex items-center justify-between p-4 hover:bg-muted/30"
              >
                <div className="flex items-center gap-3">
                  <div className={section.color}>{section.icon}</div>
                  <h2 className="text-base font-heading font-semibold">{section.title}</h2>
                </div>
                {isExpanded ? (
                  <ChevronUp className="w-5 h-5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-muted-foreground" />
                )}
              </button>
              {isExpanded && (
                <div className="border-t border-border px-4 py-4">
                  {section.content.map((item, i) => (
                    <div key={i} className="space-y-3">
                      <h3 className="font-semibold text-sm">{item.heading}</h3>
                      <ul className="space-y-2 text-sm">
                        {item.tips.map((tip, j) => (
                          <li key={j} className="flex gap-3">
                            <span className="text-primary font-bold flex-shrink-0 mt-0.5">•</span>
                            <span className="text-muted-foreground">{tip}</span>
                          </li>
                        ))}
                      </ul>
                      {item.details && (
                        <div className="mt-3 p-3 bg-muted/30 border border-border rounded-lg text-xs text-muted-foreground italic">
                          {item.details}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Type2Transition;
