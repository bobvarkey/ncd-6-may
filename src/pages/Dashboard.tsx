import { FrequencyBadge } from "@/components/FrequencyBadge";
import { useState, useEffect, useMemo } from "react";
import { Activity, Heart, Brain, TrendingDown, AlertTriangle, Pill, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { PatientData, loadPatient, EXAMPLE_PATIENT, getBMICategory } from "@/lib/patient-data";
import { generateMedRecommendations } from "@/lib/med-logic";

const Dashboard = () => {
  const [patient, setPatient] = useState<PatientData>(EXAMPLE_PATIENT);

  useEffect(() => {
    const saved = loadPatient();
    if (saved) setPatient(saved);
  }, []);

  const meds = useMemo(() => generateMedRecommendations(patient), [patient]);
  const bmiCat = getBMICategory(patient.bmi);

  const statCards = [
    { label: "BMI", value: patient.bmi.toString(), sub: bmiCat.label, icon: Activity, color: "text-primary" },
    { label: "HbA1c", value: `${patient.hba1c}%`, sub: patient.hba1c > 7 ? "Above target" : "At target", icon: TrendingDown, color: patient.hba1c > 7 ? "text-destructive" : "text-success" },
    { label: "eGFR", value: patient.eGFR.toString(), sub: patient.eGFR < 60 ? "CKD Stage 3" : "Normal", icon: Heart, color: patient.eGFR < 60 ? "text-warning" : "text-success" },
    { label: "RBS", value: `${patient.rbs}`, sub: patient.rbs > 250 ? "⚠ High" : "Controlled", icon: AlertTriangle, color: patient.rbs > 250 ? "text-destructive" : "text-success" },
  ];

  return (
    <div className="space-y-6 animate-slide-in">
      {/* Hero */}
      <div className="rounded-xl p-6 text-primary-foreground" style={{ background: "var(--gradient-hero)" }}>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm opacity-80 mb-1">Diabetes Med Optimizer</p>
            <h1 className="text-2xl font-heading font-bold mb-2">{patient.name}</h1>
            <p className="text-sm opacity-90">
              {patient.age}y {patient.gender} · Post-Stroke · HF NYHA {patient.hfNYHA} · T2DM
            </p>
          </div>
          <Brain className="w-10 h-10 opacity-60" />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {statCards.map((s) => (
          <div key={s.label} className="clinical-card flex flex-col">
            <div className="flex items-center gap-2 mb-2">
              <s.icon className={`w-4 h-4 ${s.color}`} />
              <span className="text-xs text-muted-foreground font-medium">{s.label}</span>
            </div>
            <span className={`text-2xl font-heading font-bold ${s.color}`}>{s.value}</span>
            <span className="text-xs text-muted-foreground mt-1">{s.sub}</span>
          </div>
        ))}
      </div>

      {/* BG Trend */}
      <div className="clinical-card">
        <h3 className="section-title mb-3">7-Day BG Trend</h3>
        <div className="flex items-end gap-2 h-24">
          {patient.serialBG.map((bg, i) => {
            const maxBG = Math.max(...patient.serialBG);
            const height = (bg / maxBG) * 100;
            const isHigh = bg > 180;
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-xs text-muted-foreground">{bg}</span>
                <div
                  className={`w-full rounded-t-sm transition-all ${isHigh ? "bg-destructive/80" : "bg-primary/70"}`}
                  style={{ height: `${height}%` }}
                />
                <span className="text-[9px] text-muted-foreground">D{i + 1}</span>
              </div>
            );
          })}
        </div>
        <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
          <div className="w-2 h-2 rounded-full bg-destructive/80" /> Above 180
          <div className="w-2 h-2 rounded-full bg-primary/70 ml-2" /> Controlled
        </div>
      </div>

      {/* Quick Med Alerts */}
      <div className="clinical-card">
        <div className="flex items-center justify-between mb-3">
          <h3 className="section-title">Medication Alerts</h3>
          <Link to="/medications" className="text-xs text-primary font-medium flex items-center gap-1">
            View all <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="space-y-2">
          {meds.slice(0, 3).map((m, i) => (
            <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
              <Pill className={`w-4 h-4 mt-0.5 ${m.priority === "first-line" ? "text-primary" : m.priority === "adjustment" ? "text-warning" : "text-muted-foreground"}`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{m.drug}</span>
                  <span className={`stat-badge text-xs py-0.5 px-2 ${
                    m.priority === "first-line" ? "bg-primary/10 text-primary" :
                    m.priority === "adjustment" ? "bg-warning/10 text-warning" :
                    "bg-muted text-muted-foreground"
                  }`}>{m.priority}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5 flex-wrap">{m.dose} {m.frequency} <FrequencyBadge frequency={m.frequency} /></p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {[
          { to: "/plate", label: "Plate Method", icon: "🍽️", desc: "Build balanced meals" },
          { to: "/diet-plan", label: "7-Day Plan", icon: "📋", desc: "Kerala diet generator" },
          { to: "/foods", label: "Food Database", icon: "🥘", desc: "Kerala foods + carbs" },
          { to: "/progress", label: "Progress", icon: "📊", desc: "Track weight & BG" },
        ].map((link) => (
          <Link key={link.to} to={link.to} className="clinical-card flex items-center gap-3 hover:border-primary/30">
            <span className="text-2xl">{link.icon}</span>
            <div>
              <span className="text-sm font-medium">{link.label}</span>
              <p className="text-xs text-muted-foreground">{link.desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
