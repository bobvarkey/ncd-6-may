import { ChevronDown, ChevronUp, Heart, Apple, Activity, Brain, Droplet, Pill, TrendingUp } from "lucide-react";
import { useState } from "react";

interface EducationSection {
  id: string;
  title: string;
  icon: React.ReactNode;
  color: string;
  content: {
    heading: string;
    tips: string[];
    details?: string;
    links?: Array<{ text: string; url: string }>;
  }[];
}

const EDUCATION_SECTIONS: EducationSection[] = [
    {
      id: "daily-management",
      title: "Daily Diabetes Management",
      icon: <Heart className="w-5 h-5" />,
      color: "bg-destructive/10 text-destructive",
      content: [
        {
          heading: "Core Habits for Success",
          tips: [
            "Monitor blood sugar regularly to spot patterns—aim for fasting 80-130 mg/dL and <180 mg/dL after meals",
            "Track trends with a log or app, and adjust based on exercise, stress, or illness",
            "Manage stress with relaxation techniques, as it raises blood sugar via cortisol",
            "Limit alcohol (≤1-2 drinks/day) and aim for 5-7% weight loss if overweight",
            "Get annual kidney/eye checks and maintain consistent sleep (7-9 hours nightly)"
          ],
          details: "Consistent habits like monitoring blood sugar, healthy eating, and staying active prevent complications and keep glucose stable.",
          links: [
            { text: "CDC Diabetes Living Guide", url: "https://www.cdc.gov/diabetes/living-with/index.html" },
            { text: "Mayo Clinic Diabetes Management", url: "https://www.mayoclinic.org/diseases-conditions/diabetes/in-depth/diabetes-management/art-20047963" }
          ]
        }
      ]
    },
    {
      id: "glucose-monitoring",
      title: "Blood Glucose Monitoring",
      icon: <Droplet className="w-5 h-5" />,
      color: "bg-info/10 text-info",
      content: [
        {
          heading: "Monitoring Tips for Pattern Recognition",
          tips: [
            "Check fasting glucose (target 80-130 mg/dL) before meals and at bedtime",
            "Test 2 hours after meals (target <180 mg/dL) to assess meal impact",
            "Use CGM or glucose logs to identify patterns—spikes, lows, and timing triggers",
            "Monitor during stress, illness, or exercise for personalized adjustments",
            "Track patterns over 2-week periods; trends matter more than single readings"
          ],
          details: "Regular glucose monitoring reveals how food, exercise, stress, and medications affect your blood sugar so you can make informed adjustments.",
          links: [
            { text: "Monitoring Best Practices", url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC10402910/" }
          ]
        }
      ]
    },
    {
      id: "nutrition",
      title: "Nutrition & Eating Habits",
      icon: <Apple className="w-5 h-5" />,
      color: "bg-success/10 text-success",
      content: [
        {
          heading: "Evidence-Based Eating Strategies",
          tips: [
            "Prioritize fiber-rich foods (25-30g daily): vegetables, whole grains, legumes, fruits",
            "Eat protein at breakfast (e.g., eggs, yogurt) to stabilize morning glucose",
            "Pair carbs with protein and healthy fat (e.g., apple + almond butter, rice + chicken)",
            "Walk 10-15 minutes post-meal to lower blood sugar spikes—especially effective after dinner",
            "Drink water (2L+ daily) instead of sugary drinks; limit refined carbs and processed foods"
          ],
          details: "Balanced nutrition with fiber, protein, and physical activity timing work together to stabilize blood sugar and reduce medication burden.",
          links: [
            { text: "Texas Health Daily Habits", url: "https://www.texashealth.org/areyouawellbeing/Diabetes/type-2-diabetes-daily-habits-lower-blood-sugar" }
          ]
        }
      ]
    },
    {
      id: "activity",
      title: "Physical Activity Routine",
      icon: <Activity className="w-5 h-5" />,
      color: "bg-primary/10 text-primary",
      content: [
        {
          heading: "Exercise for Insulin Sensitivity",
          tips: [
            "Aim for 150 minutes weekly of moderate exercise: brisk walking, cycling, swimming, yoga",
            "Start small with 10-minute post-meal walks if inactive—build to 30 minutes over weeks",
            "Add 2-3 strength sessions weekly (weights, bodyweight, resistance bands) to increase muscle glucose uptake",
            "Test blood glucose before exercise (target 100-250 mg/dL); treat lows <100 mg/dL with 15g fast carbs",
            "Monitor during workouts >60 minutes and 15 minutes after for delayed glucose drops"
          ],
          details: "Regular exercise boosts insulin sensitivity without needing intense workouts. Low-impact activities (walking, swimming) are effective and safe.",
          links: [
            { text: "Exercise Safety Guide", url: "https://www.goodrx.com/conditions/diabetes/exercise-safety" },
            { text: "WebMD Exercise Guidelines", url: "https://www.webmd.com/diabetes/exercise-guidelines" },
            { text: "Healthline Top Exercises", url: "https://www.healthline.com/health/type-2-diabetes/top-exercises" }
          ]
        }
      ]
    },
    {
      id: "medication-adherence",
      title: "Medication Adherence",
      icon: <Pill className="w-5 h-5" />,
      color: "bg-warning/10 text-warning",
      content: [
        {
          heading: "Staying on Track with Meds",
          tips: [
            "Take medications/insulin on schedule, even when feeling well—never skip doses",
            "Set phone reminders or pill organizers to prevent missed doses",
            "Carry glucose tablets or fast-acting carbs for hypoglycemia emergencies",
            "Wear a medical ID bracelet listing diabetes, medications, and emergency contacts",
            "Discuss side effects with your doctor—many can be managed or alternatives found"
          ],
          details: "Consistent medication use prevents complications and maintains stable glucose control. Adherence is as important as diet and exercise.",
          links: [
            { text: "CDC Medication Guide", url: "https://www.cdc.gov/diabetes/living-with/index.html" }
          ]
        }
      ]
    },
    {
      id: "stress-management",
      title: "Stress Management",
      icon: <Brain className="w-5 h-5" />,
      color: "bg-indigo-500/10 text-indigo-600",
      content: [
        {
          heading: "How Stress Affects Blood Sugar",
          tips: [
            "Stress raises cortisol and adrenaline, prompting the liver to release stored glucose—spikes without eating",
            "Quick breathing exercises (4-7-8 breathing: inhale 4s, hold 7s, exhale 8s) activate relaxation and lower cortisol fast",
            "Brisk walking 10-15 minutes when stressed boosts endorphins and burns excess glucose",
            "Use 5-minute daily meditation, gratitude journaling, or yoga to rewire stress responses long-term",
            "Sleep 7-9 hours nightly—poor sleep amplifies cortisol; maintain consistent bedtimes, limit screens"
          ],
          details: "Stress management via breathing, exercise, and mindfulness prevents reactive glucose surges and supports overall diabetes control.",
          links: [
            { text: "Diabetes.org Stress Management", url: "https://diabetes.org/health-wellness/mental-health/ease-diabetes-care-stress" },
            { text: "BSWHealth Sleep & Stress", url: "https://www.bswhealth.com/blog/can-stress-affect-blood-sugar" },
            { text: "Doral HW Stress Management", url: "https://doralhw.org/stress-management-for-blood-sugar-2/" }
          ]
        }
      ]
    },
    {
      id: "kidney-screening",
      title: "Kidney Health Screening",
      icon: <TrendingUp className="w-5 h-5" />,
      color: "bg-secondary/10 text-secondary",
      content: [
        {
          heading: "Annual Kidney Disease Screening",
          tips: [
            "All diabetics need spot urine albumin-to-creatinine ratio (UACR) and serum creatinine (eGFR)",
            "UACR detects microalbuminuria (30-300 mg/g) as early kidney damage; eGFR shows filtration decline",
            "Type 1: Start ≥5 years after diagnosis, then annually. Type 2: Start at diagnosis, annually",
            "Avoid screening during illness, infection, or heavy exercise (false positives)",
            "If abnormal UACR, confirm with 2 of 3 tests over 3-6 months, then start ACEi/ARB and nephrology referral"
          ],
          details: "Early detection via UACR and eGFR allows intervention (ACE inhibitors, blood pressure control) to slow CKD progression.",
          links: [
            { text: "Diabetes Journals KDN Review", url: "https://diabetesjournals.org/care/article/48/Supplement_1/S239/157554/11-Chronic-Kidney-Disease-and-Risk-Management" },
            { text: "NIDDK UACR & eGFR Reference", url: "https://www.niddk.nih.gov/health-information/professionals/advanced-search/quick-reference-uacr-gfr" },
            { text: "Kidney.org Kidney Screening", url: "https://www.kidney.org/kidney-topics/diabetes-ten-tips-self-management" }
          ]
        }
      ]
    }
];

const DailyManagementGuide = () => {
  const [expanded, setExpanded] = useState<string | null>("daily-management");

  return (
    <div className="space-y-6 animate-slide-in max-w-4xl mx-auto">
      {/* Header */}
      <div className="rounded-xl p-6 text-primary-foreground" style={{ background: "var(--gradient-hero)" }}>
        <h1 className="text-3xl font-heading font-bold mb-2">Daily Diabetes Management Guide</h1>
        <p className="text-primary-foreground/80">Evidence-based pearls for sustainable glucose control and complication prevention</p>
      </div>

      {/* Education Sections */}
      <div className="space-y-3">
        {EDUCATION_SECTIONS.map((section) => {
          const isExpanded = expanded === section.id;

          return (
            <div key={section.id} className="clinical-card border border-border">
              <button
                onClick={() => setExpanded(isExpanded ? null : section.id)}
                className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${section.color}`}>
                    {section.icon}
                  </div>
                  <h2 className="text-lg font-heading font-semibold">{section.title}</h2>
                </div>
                {isExpanded ? (
                  <ChevronUp className="w-5 h-5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-muted-foreground" />
                )}
              </button>

              {isExpanded && (
                <div className="border-t px-4 py-4 space-y-4">
                  {section.content.map((content, cidx) => (
                    <div key={cidx}>
                      <h3 className="font-semibold text-sm mb-3 text-foreground">{content.heading}</h3>

                      {/* Tips List */}
                      <ul className="space-y-2 mb-4">
                        {content.tips.map((tip, tipIdx) => (
                          <li key={tipIdx} className="flex gap-3 text-sm">
                            <span className="text-primary font-bold flex-shrink-0 mt-0.5">•</span>
                            <span className="text-muted-foreground">{tip}</span>
                          </li>
                        ))}
                      </ul>

                      {/* Details */}
                      {content.details && (
                        <div className="bg-muted/30 border border-border rounded-lg p-3 mb-3">
                          <p className="text-sm text-muted-foreground italic">{content.details}</p>
                        </div>
                      )}

                      {/* Links */}
                      {content.links && (
                        <div className="flex flex-wrap gap-2">
                          {content.links.map((link, linkIdx) => (
                            <a
                              key={linkIdx}
                              href={link.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs px-3 py-1.5 bg-primary/10 text-primary rounded-full hover:bg-primary/10 transition-colors"
                            >
                              {link.text}
                            </a>
                          ))}
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

      {/* Summary Card */}
      <div className="clinical-card bg-gradient-to-r from-primary/5 to-accent/5 border-primary/20">
        <h3 className="section-title mb-3">Key Takeaway</h3>
        <p className="text-sm text-muted-foreground">
          Diabetes management succeeds through consistent habits: monitor glucose regularly, eat balanced meals with fiber and protein,
          exercise 150 minutes weekly, manage stress, adhere to medications, and get annual kidney/eye screening.
          Small changes compound—focus on one habit at a time and build from there.
        </p>
      </div>
    </div>
  );
};

export default DailyManagementGuide;
