import { useState } from "react";
import { AlertTriangle, Droplet, TableProperties, Clock, Monitor, Syringe, Activity, ChevronDown, ChevronUp } from "lucide-react";

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

const Type1Pitfalls = () => {
  const [expanded, setExpanded] = useState<string | null>("premixed-risk");

  const sections: EducationSection[] = [
    {
      id: "premixed-risk",
      title: "Premixed/Fixed-Ratio Regimens in T1D",
      icon: <AlertTriangle className="w-5 h-5" />,
      color: "bg-destructive/10 text-destructive",
      content: [{
        heading: "Why This Matters",
        tips: [
          "Fixed ratios cannot match variable carb intake and activity",
          "Leads to hypoglycemia overnight or hyperglycemia when meals are skipped or changed",
          "Creates unpredictable glucose excursions"
        ],
        details: "Use long-acting basal (e.g., glargine, detemir, degludec) plus flexible rapid-acting prandial doses, or an insulin pump. This allows individualized dosing based on carb counting and glucose levels."
      }]
    },
    {
      id: "basal-coverage",
      title: "Inadequate Basal Coverage",
      icon: <Droplet className="w-5 h-5" />,
      color: "bg-warning/10 text-warning",
      content: [{
        heading: "The Problem",
        tips: [
          "Using only rapid-acting insulin around meals without true basal",
          "Treating NPH as a 'modern basal' causes mid-day hypoglycemic peak",
          "Results in nocturnal hypoglycemia or fasting hyperglycemia"
        ],
        details: "Prefer modern basal analogues (glargine, detemir, degludec) once or twice daily, matching 40–60% of total daily dose, instead of NPH-only basals. Modern agents have flatter, more predictable kinetics."
      }]
    },
    {
      id: "correction-rules",
      title: "Poorly Defined Correction Rules",
      icon: <TableProperties className="w-5 h-5" />,
      color: "bg-info/10 text-info",
      content: [{
        heading: "Sliding Scale Pitfall",
        tips: [
          "Vague or overly aggressive correction orders without carb-counting integration",
          "Insulin 'stacking' from repeated corrections in short time → iatrogenic hypoglycemia",
          "Example: 'Use 6 U if above 200 mg/dL' without considering time since last insulin"
        ],
        details: "Use structured correction algorithms that tie insulin to pre-meal glucose, carbs, expected activity, and time since last insulin. This prevents stacking and improves safety."
      }]
    },
    {
      id: "carb-timing",
      title: "Carb-Counting & Meal-Timing Mismatches",
      icon: <Clock className="w-5 h-5" />,
      color: "bg-primary/10 text-primary",
      content: [{
        heading: "Timing Issues",
        tips: [
          "Rapid-acting insulin injected too early or late for the meal",
          "Fixed prandial doses regardless of meal size (carb mismatches)",
          "Early injection → hypoglycemia before food; late injection → post-meal hyperglycemia"
        ],
        details: "Always perform carb-counting, check blood glucose or CGM before meals, and adjust doses in real-time. Modern insulin pumps and continuous glucose monitors help optimize this."
      }]
    },
    {
      id: "pump-pitfalls",
      title: "Pump-Specific Pitfalls",
      icon: <Monitor className="w-5 h-5" />,
      color: "bg-secondary/10 text-secondary",
      content: [{
        heading: "Pump Management Errors",
        tips: [
          "Over-relying on the pump without SMBG/CGM checks",
          "Skipping site changes or ignoring pump alarms",
          "Risk of DKA from missed or under-dosed basal when pump disconnects or malfunctions"
        ],
        details: "Train patients rigorously on sick-day rules, site-change frequency (every 3 days), and backup basal-only MDI plan if the pump fails. Always have emergency insulin available."
      }]
    },
    {
      id: "injection-technique",
      title: "Injection Technique & Site Errors",
      icon: <Syringe className="w-5 h-5" />,
      color: "bg-success/10 text-success",
      content: [{
        heading: "Lipodystrophy & Absorption",
        tips: [
          "Repeated use of the same injection site → lipodystrophy",
          "Lipodystrophy unpredictably alters insulin absorption",
          "Mixing insulins improperly (wrong ratios that blunt rapid-acting insulin) causes erratic BG"
        ],
        details: "Teach site rotation (abdomen, thighs, arms, buttocks, 1–2 cm apart) and proper mixing rules. Prevent lipodystrophy through systematic rotation to ensure consistent insulin absorption."
      }]
    },
    {
      id: "exercise-illness",
      title: "Exercise & Illness Adjustments",
      icon: <Activity className="w-5 h-5" />,
      color: "bg-warning/100/10 text-orange-600",
      content: [{
        heading: "Metabolic Challenges",
        tips: [
          "Failing to adjust insulin for exercise (especially if injected in the exercised muscle)",
          "Maintaining basal or prandial doses unchanged during infection/illness",
          "Exercise-induced hypoglycemia or stress-induced hyperglycemia, sometimes progressing to DKA"
        ],
        details: "Use sick-day rules: check ketones, keep basal going, give extra prandial only if indicated. For exercise: reduce insulin dose or provide carb supplements. Patient education is critical."
      }]
    }
  ];

  return (
    <div className="space-y-6 animate-slide-in max-w-4xl mx-auto">
      {/* Hero Header */}
      <div className="rounded-xl p-6 text-primary-foreground" style={{ background: "var(--gradient-hero)" }}>
        <h1 className="text-3xl font-heading font-bold mb-2">Type 1 DM: Common Insulin Pitfalls</h1>
        <p className="text-sm text-primary-foreground/80">Over-titration, poor timing, inadequate education, and technical errors. Seven critical prescribing risks to avoid.</p>
      </div>

      {/* Expand All / Collapse All */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border/40 py-3 -mt-2 px-6 flex gap-2 mb-3">
        <button
          onClick={() => setExpanded(sections[sections.length - 1]?.id || null)}
          className="text-xs px-3 py-1.5 rounded-lg bg-muted/50 hover:bg-muted"
        >
          Expand All
        </button>
        <button
          onClick={() => setExpanded(null)}
          className="text-xs px-3 py-1.5 rounded-lg bg-muted/50 hover:bg-muted"
        >
          Collapse All
        </button>
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

export default Type1Pitfalls;
