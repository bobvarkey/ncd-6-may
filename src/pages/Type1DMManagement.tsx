import { useState, useEffect } from "react";
import { PatientData, EXAMPLE_PATIENT, loadPatient } from "@/lib/patient-data";
import { Type1Management, generateType1Management } from "@/lib/type1-management";
import { AlertTriangle, Heart, Activity, Droplet, Pill, Shield, ChevronDown, ChevronUp } from "lucide-react";

export default function Type1DMManagement() {
  const [patient, setPatient] = useState<PatientData>(EXAMPLE_PATIENT);
  const [management, setManagement] = useState<Type1Management | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(["tdd", "basal"]));

  useEffect(() => {
    const saved = loadPatient();
    if (saved) setPatient(saved);
  }, []);

  useEffect(() => {
    setManagement(generateType1Management(patient));
  }, [patient]);

  const toggleSection = (section: string) => {
    const newSet = new Set(expandedSections);
    if (newSet.has(section)) {
      newSet.delete(section);
    } else {
      newSet.add(section);
    }
    setExpandedSections(newSet);
  };

  if (!management) return <div>Loading...</div>;

  const sections = [
    {
      id: "tdd",
      title: "Total Daily Dose (TDD) Calculation",
      icon: <Pill className="w-5 h-5" />,
      color: "text-blue-600",
      content: (
        <div className="space-y-3">
          <div className="bg-info/10 p-4 rounded-lg">
            <p className="text-sm text-muted-foreground"><strong>Patient Weight:</strong> {management.tdd_calculation.kg_weight} kg</p>
            <p className="text-sm text-muted-foreground mt-2"><strong>TDD Range:</strong> {management.tdd_calculation.tdd_range}</p>
            <p className="text-lg font-bold text-info mt-3">Estimated TDD: {management.tdd_calculation.estimated_tdd} units/day</p>
          </div>
          <p className="text-xs text-muted-foreground italic">Higher TDD needed in puberty, insulin resistance, pregnancy, or acute illness.</p>
        </div>
      ),
    },
    {
      id: "basal",
      title: "Basal Insulin (Background Coverage)",
      icon: <Heart className="w-5 h-5" />,
      color: "text-red-600",
      content: (
        <div className="space-y-3">
          <div className="bg-destructive/5 p-4 rounded-lg">
            <p className="text-sm font-semibold text-foreground mb-2">Recommended Daily Basal Dose:</p>
            <p className="text-base font-bold text-destructive">{management.basal_insulin.recommended_daily_dose}</p>
            <p className="text-xs text-muted-foreground mt-3">{management.basal_insulin.percentage_of_tdd}</p>
          </div>
          <div>
            <p className="text-sm font-semibold mb-2">Agent Options:</p>
            <ul className="space-y-2">
              {management.basal_insulin.agent_options.map((agent, idx) => (
                <li key={idx} className="text-sm text-muted-foreground flex gap-2">
                  <span className="text-blue-600 font-bold flex-shrink-0">•</span>
                  <span>{agent}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-warning/10 border-l-4 border-warning/50 p-3 mt-3">
            <p className="text-xs text-muted-foreground"><strong>Target Fasting Glucose:</strong> {management.basal_insulin.fasting_glucose_target}</p>
            <p className="text-xs text-muted-foreground mt-2">{management.basal_insulin.notes}</p>
          </div>
        </div>
      ),
    },
    {
      id: "bolus",
      title: "Bolus Insulin (Mealtime Coverage)",
      icon: <Activity className="w-5 h-5" />,
      color: "text-success",
      content: (
        <div className="space-y-3">
          <div className="bg-success/5 p-4 rounded-lg">
            <p className="text-sm font-semibold mb-2">Insulin-to-Carb Ratio (ICR):</p>
            <p className="text-base text-success">{management.bolus_insulin.icr_insulin_to_carb_ratio}</p>
            <p className="text-sm font-semibold mt-4 mb-2">Correction Factor (CF):</p>
            <p className="text-base text-success">{management.bolus_insulin.cf_correction_factor}</p>
          </div>
          <div>
            <p className="text-sm font-semibold mb-2">Rapid-Acting Insulin Agents:</p>
            <ul className="space-y-1">
              {management.bolus_insulin.agents.map((agent, idx) => (
                <li key={idx} className="text-xs text-muted-foreground">• {agent}</li>
              ))}
            </ul>
          </div>
          <p className="text-sm text-muted-foreground bg-info/10 p-2 rounded"><strong>Timing:</strong> {management.bolus_insulin.timing}</p>
          <p className="text-sm text-muted-foreground"><strong>Carb Counting:</strong> {management.bolus_insulin.carb_counting_method}</p>
        </div>
      ),
    },
    {
      id: "glucose-targets",
      title: "Glucose Targets & Goals",
      icon: <Droplet className="w-5 h-5" />,
      color: "text-cyan-600",
      content: (
        <div className="bg-primary/10 p-4 rounded-lg space-y-2">
          <div className="text-sm">
            <p><strong>Premeal:</strong> <span className="text-cyan-700">{management.glucose_targets.premeal}</span></p>
            <p><strong>Postmeal (1-2h):</strong> <span className="text-cyan-700">{management.glucose_targets.postmeal_1_2h}</span></p>
            <p><strong>Bedtime:</strong> <span className="text-cyan-700">{management.glucose_targets.bedtime}</span></p>
            <p><strong>Overnight:</strong> <span className="text-cyan-700">{management.glucose_targets.nighttime}</span></p>
          </div>
          <div className="border-t pt-2 mt-2">
            <p><strong>Time in Range Goal:</strong> <span className="text-cyan-700 font-semibold">{management.glucose_targets.time_in_range_goal}</span></p>
            <p><strong>HbA1c Target:</strong> <span className="text-cyan-700 font-semibold">{management.glucose_targets.hba1c_target}</span></p>
          </div>
        </div>
      ),
    },
    {
      id: "monitoring",
      title: "Glucose Monitoring Protocol",
      icon: <Shield className="w-5 h-5" />,
      color: "text-purple-600",
      content: (
        <div className="space-y-3">
          <div className="bg-accent/10 p-4 rounded-lg">
            <p className="text-sm font-semibold mb-2">🎯 CGM (Preferred):</p>
            <ul className="space-y-1">
              {management.monitoring_protocol.cgm_recommended.metrics.map((metric, idx) => (
                <li key={idx} className="text-xs text-muted-foreground">• {metric}</li>
              ))}
            </ul>
            <p className="text-xs text-muted-foreground mt-3"><strong>Review:</strong> {management.monitoring_protocol.cgm_recommended.review_frequency}</p>
            <p className="text-xs text-muted-foreground"><strong>Targets:</strong> {management.monitoring_protocol.cgm_recommended.targets}</p>
          </div>
          <div>
            <p className="text-sm font-semibold mb-2">📍 SMBG (Minimum):</p>
            <ul className="space-y-1">
              {management.monitoring_protocol.smbg_minimum.map((item, idx) => (
                <li key={idx} className="text-xs text-muted-foreground">• {item}</li>
              ))}
            </ul>
          </div>
          <p className="text-sm text-muted-foreground bg-warning/10 p-2 rounded"><strong>Ketone Testing:</strong> {management.monitoring_protocol.ketone_testing}</p>
        </div>
      ),
    },
    {
      id: "hypo",
      title: "Hypoglycemia Management",
      icon: <AlertTriangle className="w-5 h-5" />,
      color: "text-red-600",
      content: (
        <div className="space-y-3">
          <div className="bg-destructive/5 p-3 rounded-lg border-l-4 border-destructive/50">
            <p className="text-sm font-semibold text-foreground mb-2">Level 1 (70-54 mg/dL):</p>
            <p className="text-xs text-muted-foreground"><strong>Treatment:</strong> {management.hypoglycemia_protocol.level_1_70_54.treatment}</p>
            <p className="text-xs text-muted-foreground"><strong>Recheck:</strong> {management.hypoglycemia_protocol.level_1_70_54.recheck}</p>
          </div>
          <div className="bg-warning/10 p-3 rounded-lg border-l-4 border-warning/50">
            <p className="text-sm font-semibold text-foreground mb-2">Level 2 (Below 54 mg/dL):</p>
            <p className="text-xs text-muted-foreground">{management.hypoglycemia_protocol.level_2_below_54.treatment}</p>
          </div>
          <div className="bg-destructive/10 p-3 rounded-lg border-l-4 border-red-600">
            <p className="text-sm font-semibold text-foreground mb-2">Level 3 (Severe):</p>
            <p className="text-xs text-muted-foreground"><strong>Definition:</strong> {management.hypoglycemia_protocol.level_3_severe.definition}</p>
            <p className="text-xs text-muted-foreground mt-1"><strong>Treatment:</strong> {management.hypoglycemia_protocol.level_3_severe.treatment}</p>
          </div>
          <div>
            <p className="text-sm font-semibold mb-2">Prevention Strategies:</p>
            <ul className="space-y-1">
              {management.hypoglycemia_protocol.prevention_strategies.map((strategy, idx) => (
                <li key={idx} className="text-xs text-muted-foreground">✓ {strategy}</li>
              ))}
            </ul>
          </div>
        </div>
      ),
    },
    {
      id: "exercise",
      title: "Exercise Adjustments",
      icon: <Activity className="w-5 h-5" />,
      color: "text-success",
      content: (
        <div className="space-y-3">
          <div className="bg-success/5 p-3 rounded-lg">
            <p className="text-sm font-semibold mb-2">Before Exercise:</p>
            <p className="text-xs text-muted-foreground">{management.exercise_adjustments.pre_exercise}</p>
          </div>
          <div className="bg-success/5 p-3 rounded-lg">
            <p className="text-sm font-semibold mb-2">During Exercise:</p>
            <p className="text-xs text-muted-foreground">{management.exercise_adjustments.during_exercise}</p>
          </div>
          <div className="bg-success/5 p-3 rounded-lg">
            <p className="text-sm font-semibold mb-2">Post-Exercise:</p>
            <p className="text-xs text-muted-foreground">{management.exercise_adjustments.post_exercise}</p>
          </div>
        </div>
      ),
    },
    {
      id: "safety",
      title: "Key Safety Rules",
      icon: <Shield className="w-5 h-5" />,
      color: "text-red-600",
      content: (
        <div className="bg-destructive/5 p-4 rounded-lg space-y-2">
          {management.key_safety_rules.map((rule, idx) => (
            <p key={idx} className="text-xs text-muted-foreground font-semibold">{rule}</p>
          ))}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-slide-in max-w-4xl mx-auto">
      {/* Header */}
      <div className="rounded-xl p-6 text-primary-foreground" style={{ background: "var(--gradient-hero)" }}>
        <h1 className="text-3xl font-heading font-bold mb-2">Type 1 Diabetes Management</h1>
        <p className="text-primary-foreground/80">Comprehensive basal-bolus insulin therapy with CGM-guided adjustments for adults with T1D</p>
      </div>

      {/* Patient Context */}
      <div className="clinical-card border border-gray-200">
        <h3 className="section-title mb-3">Patient Context</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <div>
            <span className="text-muted-foreground">HbA1c</span>
            <p className="font-bold text-lg">{patient.hba1c}%</p>
          </div>
          <div>
            <span className="text-muted-foreground">Weight</span>
            <p className="font-bold text-lg">{patient.weightKg} kg</p>
          </div>
          <div>
            <span className="text-muted-foreground">BMI</span>
            <p className="font-bold text-lg">{patient.bmi.toFixed(1)}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Age</span>
            <p className="font-bold text-lg">{patient.age}y</p>
          </div>
        </div>
      </div>

      {/* Management Sections */}
      <div className="space-y-3">
        {sections.map((section) => {
          const isExpanded = expandedSections.has(section.id);

          return (
            <div key={section.id} className="clinical-card border border-gray-200">
              <button
                onClick={() => toggleSection(section.id)}
                className="w-full flex items-center justify-between p-4 hover:bg-muted/80 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={section.color}>{section.icon}</div>
                  <h2 className="text-lg font-heading font-semibold">{section.title}</h2>
                </div>
                {isExpanded ? (
                  <ChevronUp className="w-5 h-5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-muted-foreground" />
                )}
              </button>

              {isExpanded && <div className="border-t px-4 py-4">{section.content}</div>}
            </div>
          );
        })}
      </div>

      {/* Sick Day Rules Alert */}
      <div className="clinical-card bg-gradient-to-r from-red-50 to-orange-50 border-destructive/30">
        <h3 className="section-title mb-3 text-destructive">⚠️ Sick Day Rules</h3>
        <p className="text-sm text-muted-foreground mb-3">{management.sick_day_rules.insulin_adjustment}</p>
        <p className="text-sm text-muted-foreground mb-3"><strong>Hydration:</strong> {management.sick_day_rules.hydration_goal}</p>
        <p className="text-sm text-muted-foreground mb-3"><strong>Monitoring:</strong> {management.sick_day_rules.monitoring}</p>
        <p className="text-sm font-semibold text-destructive bg-destructive/10 p-2 rounded"><strong>🚨 Escalation:</strong> {management.sick_day_rules.escalation_criteria}</p>
      </div>

      {/* Complication Screening */}
      <div className="clinical-card border border-gray-200">
        <h3 className="section-title mb-3">Annual Complication Screening</h3>
        <div className="space-y-3">
          <div>
            <p className="text-sm font-semibold mb-2">Required Tests:</p>
            <ul className="space-y-1">
              {management.complication_screening.annual.map((test, idx) => (
                <li key={idx} className="text-sm text-muted-foreground">✓ {test}</li>
              ))}
            </ul>
          </div>
          <div className="border-t pt-3">
            <p className="text-sm"><strong>Blood Pressure Goal:</strong> <span className="text-info font-semibold">{management.complication_screening.blood_pressure_goal}</span></p>
            <p className="text-sm"><strong>Lipid Goals:</strong> <span className="text-info font-semibold">{management.complication_screening.lipid_goals}</span></p>
          </div>
        </div>
      </div>
    </div>
  );
}
