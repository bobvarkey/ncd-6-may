import { useState, useEffect } from "react";
import { PatientData, EXAMPLE_PATIENT, loadPatient } from "@/lib/patient-data";
import { InsulinTherapyResult, generateInsulinTherapy } from "@/lib/insulin-therapy";
import { Target, Pill, Activity, AlertTriangle, ShieldAlert, Syringe, TrendingUp, ChevronDown, ChevronUp } from "lucide-react";
import { headerTabClass, headerTabListClass } from "@/lib/header-tabs";

const InsulinTherapy = () => {
  const [patient, setPatient] = useState<PatientData>(EXAMPLE_PATIENT);
  const [activeType, setActiveType] = useState<"type1" | "type2">("type2");
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(["bg-goals", "tdd"]));
  const [therapy, setTherapy] = useState<InsulinTherapyResult | null>(null);

  useEffect(() => {
    const saved = loadPatient();
    if (saved) {
      setPatient(saved);
      setActiveType(saved.diabetesType || "type2");
    }
  }, []);

  useEffect(() => {
    setTherapy(generateInsulinTherapy(patient, activeType));
  }, [patient, activeType]);

  const toggleSection = (section: string) => {
    const newSet = new Set(expandedSections);
    if (newSet.has(section)) {
      newSet.delete(section);
    } else {
      newSet.add(section);
    }
    setExpandedSections(newSet);
  };

  if (!therapy) return null;

  const commonSections = [
    {
      id: "bg-goals",
      title: "Glycemic Targets",
      icon: <Target className="w-5 h-5" />,
      color: "text-secondary",
      content: (
        <div className="space-y-3 text-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-3 rounded-lg bg-muted/30">
              <p className="text-xs text-muted-foreground mb-1">Fasting</p>
              <p className="font-medium">{therapy.bg_goals.fasting}</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/30">
              <p className="text-xs text-muted-foreground mb-1">Preprandial</p>
              <p className="font-medium">{therapy.bg_goals.preprandial}</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/30">
              <p className="text-xs text-muted-foreground mb-1">2h Postprandial</p>
              <p className="font-medium">{therapy.bg_goals.postprandial_2h}</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/30">
              <p className="text-xs text-muted-foreground mb-1">A1C Target</p>
              <p className="font-medium">{therapy.bg_goals.a1c}</p>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "tdd",
      title: "Total Daily Dose (TDD)",
      icon: <Pill className="w-5 h-5" />,
      color: "text-info",
      content: (
        <div className="space-y-3 text-sm">
          <div className="p-3 rounded-lg bg-muted/30">
            <p className="text-xs text-muted-foreground mb-1">Calculation Basis</p>
            <p className="font-medium">{therapy.tdd.range}</p>
            <p className="text-xs text-muted-foreground mt-2">Calculated for {patient.weightKg} kg: <strong>{therapy.tdd.calculated_units} units/day</strong> ({therapy.tdd.dose_per_kg})</p>
          </div>
        </div>
      ),
    },
    {
      id: "distribution",
      title: "Dose Distribution",
      icon: <Activity className="w-5 h-5" />,
      color: "text-primary",
      content: (
        <div className="space-y-3 text-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-3 rounded-lg bg-muted/30">
              <p className="text-xs text-muted-foreground mb-1">Basal</p>
              <p className="font-medium">{therapy.distribution.basal_pct}</p>
              <p className="text-xs text-muted-foreground mt-1">{therapy.distribution.basal_units} units/day</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/30">
              <p className="text-xs text-muted-foreground mb-1">Prandial</p>
              <p className="font-medium">{therapy.distribution.prandial_pct}</p>
              <p className="text-xs text-muted-foreground mt-1">{therapy.distribution.prandial_units} units/day</p>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "regimen",
      title: "Regimen Modes",
      icon: <Syringe className="w-5 h-5" />,
      color: "text-warning",
      content: (
        <div className="space-y-2 text-sm">
          {therapy.regimen_modes.map((mode, i) => (
            <div key={i} className="p-2 rounded-lg bg-muted/30 text-xs">
              {mode}
            </div>
          ))}
        </div>
      ),
    },
    {
      id: "agents",
      title: "Insulin Agents",
      icon: <Pill className="w-5 h-5" />,
      color: "text-success",
      content: (
        <div className="space-y-4 text-sm">
          <div>
            <p className="font-medium text-xs text-muted-foreground mb-2">Basal (Long-Acting)</p>
            <div className="space-y-1">
              {therapy.basal_agents.map((agent, i) => (
                <div key={i} className="text-xs p-2 rounded bg-muted/30">{agent}</div>
              ))}
            </div>
          </div>
          <div>
            <p className="font-medium text-xs text-muted-foreground mb-2">Prandial (Rapid-Acting)</p>
            <div className="space-y-1">
              {therapy.prandial_agents.map((agent, i) => (
                <div key={i} className="text-xs p-2 rounded bg-muted/30">{agent}</div>
              ))}
            </div>
          </div>
          {therapy.premixed_agents && therapy.premixed_agents.length > 0 && (
            <div>
              <p className="font-medium text-xs text-muted-foreground mb-2">Premixed Options (T2DM)</p>
              <div className="space-y-1">
                {therapy.premixed_agents.map((agent, i) => (
                  <div key={i} className="text-xs p-2 rounded bg-muted/30">{agent}</div>
                ))}
              </div>
            </div>
          )}
        </div>
      ),
    },
    {
      id: "special",
      title: "Special Considerations",
      icon: <ShieldAlert className="w-5 h-5" />,
      color: "text-destructive",
      content: (
        <div className="space-y-2 text-sm">
          {Object.entries(therapy.special_considerations).map(([key, value]) => (
            <div key={key} className="p-3 rounded-lg bg-muted/30">
              <p className="font-medium text-xs mb-1">{key}</p>
              <p className="text-xs text-muted-foreground">{value}</p>
            </div>
          ))}
        </div>
      ),
    },
  ];

  const type2OnlySections = [
    {
      id: "start-when",
      title: "When to Start Insulin",
      icon: <AlertTriangle className="w-5 h-5" />,
      color: "text-warning",
      content: (
        <div className="space-y-2 text-sm">
          {therapy.start_indications?.map((indication, i) => (
            <div key={i} className="p-3 rounded-lg bg-warning/10">
              <p className="text-xs text-warning">{indication}</p>
            </div>
          ))}
        </div>
      ),
    },
    {
      id: "approaches",
      title: "Insulin Approaches",
      icon: <TrendingUp className="w-5 h-5" />,
      color: "text-primary",
      content: (
        <div className="space-y-3 text-sm">
          {therapy.basal_augmentation && (
            <div className="p-3 rounded-lg bg-muted/30">
              <p className="font-medium mb-1">Basal Augmentation</p>
              <p className="text-xs text-muted-foreground mb-1">{therapy.basal_augmentation.description}</p>
              <p className="text-xs"><strong>Dosing:</strong> {therapy.basal_augmentation.dose_range}</p>
              <p className="text-xs"><strong>Target:</strong> {therapy.basal_augmentation.target_fbg}</p>
            </div>
          )}
          {therapy.premixed_use_cases && therapy.premixed_use_cases.length > 0 && (
            <div className="p-3 rounded-lg bg-info/10">
              <p className="font-medium text-info text-xs mb-2">Premixed Insulins (When Adherence is a Barrier)</p>
              <ul className="text-xs space-y-1 text-muted-foreground">
                {therapy.premixed_use_cases.map((use, i) => (
                  <li key={i} className="ml-4">• {use}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ),
    },
  ];

  const sections = activeType === "type1" ? commonSections : [...commonSections.slice(0, 4), ...type2OnlySections, commonSections[4], commonSections[5]];

  return (
    <div className="space-y-6 animate-slide-in max-w-4xl mx-auto">
      {/* Hero Header */}
      <div className="rounded-xl p-6 text-primary-foreground" style={{ background: "var(--gradient-hero)" }}>
        <h1 className="text-3xl font-heading font-bold mb-2">Insulin Therapy Guide</h1>
        <p className="text-sm text-primary-foreground/80 mb-4 max-w-2xl">{therapy.rationale}</p>

        {/* Type Toggle */}
        <div className={`${headerTabListClass} mt-4`}>
          <button
            type="button"
            onClick={() => setActiveType("type1")}
            data-active={activeType === "type1"}
            className={headerTabClass("rounded-full px-4 py-2")}
          >
            Type 1 DM
          </button>
          <button
            type="button"
            onClick={() => setActiveType("type2")}
            data-active={activeType === "type2"}
            className={headerTabClass("rounded-full px-4 py-2")}
          >
            Type 2 DM
          </button>
        </div>
      </div>

      {/* Patient Context */}
      <div className="clinical-card border border-border">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-3">
            <p className="text-xs text-muted-foreground mb-1">HbA1c</p>
            <p className="text-lg font-semibold">{patient.hba1c}%</p>
          </div>
          <div className="p-3">
            <p className="text-xs text-muted-foreground mb-1">Weight</p>
            <p className="text-lg font-semibold">{patient.weightKg} kg</p>
          </div>
          <div className="p-3">
            <p className="text-xs text-muted-foreground mb-1">BMI</p>
            <p className="text-lg font-semibold">{patient.bmi}</p>
          </div>
          <div className="p-3">
            <p className="text-xs text-muted-foreground mb-1">Age</p>
            <p className="text-lg font-semibold">{patient.age}y</p>
          </div>
        </div>
      </div>

      {/* Expand All / Collapse All */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border/40 py-3 -mt-2 px-6 flex gap-2 mb-3">
        <button
          onClick={() => setExpandedSections(new Set(sections.map(s => s.id)))}
          className="text-xs px-3 py-1.5 rounded-lg bg-muted/50 hover:bg-muted text-muted-foreground"
        >
          Expand All
        </button>
        <button
          onClick={() => setExpandedSections(new Set())}
          className="text-xs px-3 py-1.5 rounded-lg bg-muted/50 hover:bg-muted text-muted-foreground"
        >
          Collapse All
        </button>
      </div>

      {/* Expandable Sections */}
      <div className="space-y-3">
        {sections.map(section => {
          const isExpanded = expandedSections.has(section.id);
          return (
            <div key={section.id} className="clinical-card border border-border">
              <button
                onClick={() => toggleSection(section.id)}
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
                <div className="border-t border-border px-4 py-4">{section.content}</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default InsulinTherapy;
