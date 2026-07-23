import { FrequencyBadge } from "@/components/FrequencyBadge";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Syringe } from "lucide-react";

const GLP1Administration = () => {
  const [expandedMed, setExpandedMed] = useState<string | null>("tirzepatide");

  const glp1Medications = [
    {
      id: "tirzepatide",
      name: "Tirzepatide (GLP-1/GIP Agonist)",
      brands: ["Mounjaro", "Zepbound"],
      frequency: "Once weekly (subcutaneous)",
      doses: {
        mounjaro: [
          { dose: "2.5 mg", indication: "Starting dose", week: "Weeks 0-4" },
          { dose: "5.0 mg", indication: "Escalation", week: "Weeks 4-8" },
          { dose: "7.5 mg", indication: "Escalation", week: "Weeks 8-12" },
          { dose: "10.0 mg", indication: "Escalation", week: "Weeks 12-16" },
          { dose: "12.5 mg", indication: "Escalation", week: "Weeks 16-20" },
          { dose: "15.0 mg", indication: "Maximum dose", week: "Week 20+" },
        ],
      },
      storage: "Refrigerate 2-8°C. After first use: room temp max 30°C for 21 days",
      administrationTips: [
        "Dual GLP-1/GIP receptor agonist - enhanced efficacy",
        "Inject same day each week, any time of day",
        "Abdomen, thigh, or upper arm",
        "Stronger weight loss and glycemic effect than GLP-1 alone",
        "More frequent titration required",
      ],
    },
    {
      id: "semaglutide",
      name: "Semaglutide",
      brands: ["Ozempic", "Wegovy", "Rybelsus"],
      frequency: "Once weekly (subcutaneous)",
      doses: {
        ozempic: [
          { dose: "0.25 mg", indication: "Starting dose", week: "Weeks 0-4" },
          { dose: "0.5 mg", indication: "Maintenance/Escalation", week: "Weeks 4-8" },
          { dose: "1.0 mg", indication: "Escalation", week: "Weeks 8-12" },
          { dose: "2.4 mg", indication: "Maximum effective dose", week: "Week 12+" },
        ],
        wegovy: [
          { dose: "0.25 mg", indication: "Starting dose", week: "Weeks 0-4" },
          { dose: "0.5 mg", indication: "Escalation", week: "Weeks 4-8" },
          { dose: "1.0 mg", indication: "Escalation", week: "Weeks 8-12" },
          { dose: "1.7 mg", indication: "Escalation", week: "Weeks 12-16" },
          { dose: "2.4 mg", indication: "Maximum dose", week: "Week 16+" },
        ],
      },
      storage: "Refrigerate 2-8°C before use. After first use: room temp up to 30°C for 56 days",
      administrationTips: [
        "Inject subcutaneously in abdomen, thigh, or upper arm",
        "Rotate injection sites to prevent lipohypertrophy",
        "Can be taken any day of the week, maintain weekly schedule",
        "May give with or without meals",
        "Allow 15-30 min for pen to reach room temperature before use",
      ],
    },
    {
      id: "liraglutide",
      name: "Liraglutide",
      brands: ["Victoza", "Saxenda"],
      frequency: "Once daily (subcutaneous)",
      doses: {
        victoza: [
          { dose: "0.6 mg", indication: "Starting dose", week: "Week 1" },
          { dose: "1.2 mg", indication: "Escalation", week: "Week 2" },
          { dose: "1.8 mg", indication: "Escalation", week: "Week 3+" },
        ],
        saxenda: [
          { dose: "0.6 mg", indication: "Starting dose", week: "Week 1" },
          { dose: "1.2 mg", indication: "Escalation", week: "Week 2" },
          { dose: "1.8 mg", indication: "Escalation", week: "Week 3" },
          { dose: "2.4 mg", indication: "Escalation", week: "Week 4" },
          { dose: "3.0 mg", indication: "Maximum dose", week: "Week 5+" },
        ],
      },
      storage: "Refrigerate 2-8°C. After first use: max 30°C for 30 days",
      administrationTips: [
        "Daily injection at same time of day (usually morning or evening)",
        "Inject into abdomen, thigh, or upper arm",
        "Use new needle for each injection",
        "Can eat before, during, or after injection",
        "Gradual dose escalation reduces GI side effects",
      ],
    },
    {
      id: "dulaglutide",
      name: "Dulaglutide",
      brands: ["Trulicity"],
      frequency: "Once weekly (subcutaneous)",
      doses: {
        trulicity: [
          { dose: "0.75 mg", indication: "Starting dose", week: "Weeks 0-4" },
          { dose: "1.5 mg", indication: "Standard maintenance", week: "Weeks 4+" },
          { dose: "3.0 mg", indication: "Escalation", week: "Weeks 4+" },
          { dose: "4.5 mg", indication: "Maximum dose", week: "Weeks 4+" },
        ],
      },
      storage: "Refrigerate 2-8°C. After first use: up to 30°C for 14 days",
      administrationTips: [
        "Pre-filled pen, ready to use",
        "Inject any time of day, same day each week",
        "Abdomen, thigh, or upper arm injection",
        "Minimal dose titration - faster to therapeutic dose",
        "Can switch injection day as long as 3 days apart",
      ],
    },
  ];

  const injectionSites = [
    {
      area: "Abdomen",
      icon: "🫀",
      details: "2 fingers away from navel, lateral lower abdomen preferred",
      pros: "Best absorption, easiest self-administration",
      cons: "More GI side effects if tender",
    },
    {
      area: "Thigh",
      icon: "🦵",
      details: "Outer aspect, front or back, 4 fingers below hip",
      pros: "Good alternative, less GI disturbance",
      cons: "Slightly slower absorption",
    },
    {
      area: "Upper Arm",
      icon: "💪",
      details: "Back of upper arm, middle third",
      pros: "Discreet, good for rotation",
      cons: "Requires assistance or more dexterity",
    },
  ];

  const commonSideEffects = [
    {
      effect: "Nausea",
      onset: "Days 1-3",
      management: "Take anti-nausea meds, small frequent meals, ginger tea, slower titration",
      resolve: "Usually resolves within 1-2 weeks",
    },
    {
      effect: "Vomiting",
      onset: "Days 2-7",
      management: "Notify provider, may need anti-emetic, consider dose pause",
      resolve: "2-3 weeks with management",
    },
    {
      effect: "Constipation/Diarrhea",
      onset: "Week 1-2",
      management: "Increase fiber, water, psyllium husk, stool softeners",
      resolve: "Usually improves by week 3-4",
    },
    {
      effect: "Abdominal Pain",
      onset: "Days 1-4",
      management: "Use heating pad, antispasmodics, small meals, slow movement",
      resolve: "Typically 3-5 days",
    },
    {
      effect: "Appetite Suppression",
      onset: "Day 1",
      management: "Monitor nutrition, ensure adequate protein intake, supplements if needed",
      resolve: "Persists (desired effect)",
    },
    {
      effect: "Pancreatitis (rare)",
      onset: "Variable",
      management: "STOP immediately, seek emergency care if severe upper abdominal pain",
      resolve: "Monitor with amylase/lipase levels",
    },
  ];

  const safetyConsiderations = [
    "Monitor for medullary thyroid carcinoma (MTC) symptoms: neck swelling, persistent cough, difficulty swallowing",
    "Contraindicated in personal/family history of MTC or MEN-2",
    "Adjust other diabetes meds to prevent hypoglycemia",
    "Dehydration risk - ensure adequate fluid intake",
    "Monitor renal function (can cause acute kidney injury in dehydration)",
    "Gallbladder effects - report right upper quadrant pain",
    "May affect diabetic retinopathy - coordinate with ophthalmology",
    "Pregnancy: most GLP-1s Category C/D - discontinue if pregnancy planned",
    "Drug interactions: slower gastric emptying may affect other oral medications",
  ];

  return (
    <div className="space-y-6 animate-slide-in">
      <div>
        <h1 className="text-4xl font-heading font-bold mb-2 flex items-center gap-3">
          <Syringe className="w-8 h-8 text-primary" />
          GLP-1 Agonist Administration
        </h1>
        <p className="text-lg text-muted-foreground">
          Comprehensive guide to GLP-1 receptor agonist medications, dosing, and injection techniques
        </p>
      </div>

      {/* Quick Overview */}
      <Card className="p-6 bg-card border-2 border-primary/30">
        <h2 className="font-bold mb-3 text-xl text-foreground">Quick Reference</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-base">
          <div>
            <span className="font-semibold block text-foreground">Route:</span>
            <span className="text-muted-foreground">Subcutaneous</span>
          </div>
          <div>
            <span className="font-semibold block text-foreground">Frequency:</span>
            <span className="text-muted-foreground">Daily or Weekly</span>
          </div>
          <div>
            <span className="font-semibold block text-foreground">Onset:</span>
            <span className="text-muted-foreground">30 min - 1 hour</span>
          </div>
          <div>
            <span className="font-semibold block text-foreground">Peak:</span>
            <span className="text-muted-foreground">8-12 hours</span>
          </div>
        </div>
      </Card>

      {/* Medications */}
      <Card className="p-6 bg-card border border-border">
        <h2 className="text-3xl font-heading font-bold mb-4 text-foreground">GLP-1 Medications & Dosing</h2>

        {/* Expand All / Collapse All */}
        <div className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border/40 py-3 -mt-2 px-6 flex gap-2 mb-3">
          <button
            onClick={() => setExpandedMed(glp1Medications[0]?.id || null)}
            className="text-xs px-3 py-1.5 rounded-lg bg-muted/50 hover:bg-muted"
          >
            Expand All
          </button>
          <button
            onClick={() => setExpandedMed(null)}
            className="text-xs px-3 py-1.5 rounded-lg bg-muted/50 hover:bg-muted"
          >
            Collapse All
          </button>
        </div>

        <div className="space-y-3">
          {glp1Medications.map((med) => (
            <div
              key={med.id}
              className="border-2 border-border rounded-lg p-4 cursor-pointer hover:bg-muted/50 transition-colors bg-card"
              onClick={() => setExpandedMed(expandedMed === med.id ? null : med.id)}
            >
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="font-bold text-xl text-foreground">{med.name}</h3>
                  <p className="text-base text-muted-foreground">{med.brands.join(", ")}</p>
                </div>
                <span className="text-3xl text-foreground">{expandedMed === med.id ? "▼" : "▶"}</span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-base bg-info/10 text-info p-3 rounded inline-block font-semibold">
                  {med.frequency}
                </p>
                <FrequencyBadge frequency={med.frequency} />
              </div>

              {expandedMed === med.id && (
                <div className="mt-4 space-y-4 border-t pt-4">
                  {Object.entries(med.doses).map(([brand, dosing]) => (
                    <div key={brand}>
                      <h4 className="font-semibold capitalize mb-2 text-lg text-foreground">{brand}</h4>
                      <table className="w-full text-base">
                        <thead>
                          <tr className="border-b-2 border-border">
                            <th className="text-left py-3 font-bold text-foreground">Dose</th>
                            <th className="text-left py-3 font-bold text-foreground">Indication</th>
                            <th className="text-left py-3 font-bold text-foreground">Timeline</th>
                          </tr>
                        </thead>
                        <tbody>
                          {dosing.map((d, idx) => (
                            <tr key={idx} className="border-b border-border hover:bg-primary/5">
                              <td className="py-3 font-semibold text-info">
                                {d.dose}
                              </td>
                              <td className="py-3 text-muted-foreground">{d.indication}</td>
                              <td className="py-3 text-muted-foreground">{d.week}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ))}

                  <div>
                    <h4 className="font-semibold mb-2 text-lg text-foreground">Storage</h4>
                    <p className="text-base bg-warning/10 text-warning p-3 rounded font-semibold">
                      {med.storage}
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2 text-lg text-foreground">Administration Tips</h4>
                    <ul className="text-base space-y-2">
                      {med.administrationTips.map((tip, idx) => (
                        <li key={idx} className="flex gap-2 text-foreground">
                          <span className="text-success font-bold">✓</span>
                          <span className="text-foreground">{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* Injection Technique */}
      <Card className="p-6 bg-card border border-border">
        <h2 className="text-3xl font-heading font-bold mb-4 text-foreground">💉 Injection Technique & Sites</h2>

        <Tabs defaultValue="technique" className="w-full">
          <TabsList className="grid w-full grid-cols-1 sm:grid-cols-2 bg-muted/50">
            <TabsTrigger value="technique" className="text-base font-semibold text-foreground">Step-by-Step</TabsTrigger>
            <TabsTrigger value="sites" className="text-base font-semibold text-foreground">Injection Sites</TabsTrigger>
          </TabsList>

          <TabsContent value="technique" className="space-y-4">
            <div className="space-y-4">
              {[
                {
                  step: "1. Prepare",
                  details: [
                    "Wash hands thoroughly",
                    "Gather supplies: pen/syringe, new needle, alcohol swab",
                    "Allow cold medication to reach room temperature (15-30 min)",
                    "Inspect for particles or discoloration (should be clear)",
                  ],
                },
                {
                  step: "2. Select Site",
                  details: [
                    "Choose injection site (abdomen, thigh, or upper arm)",
                    "Rotate sites to prevent lipohypertrophy",
                    "Avoid areas with scars, bruises, or infections",
                    "Mark rotation pattern on calendar",
                  ],
                },
                {
                  step: "3. Prepare Site",
                  details: [
                    "Pinch skin firmly with thumb and forefinger",
                    "Clean area with alcohol swab in circular motion",
                    "Wait 10-15 seconds for alcohol to dry completely",
                    "DO NOT touch cleaned area",
                  ],
                },
                {
                  step: "4. Inject",
                  details: [
                    "Hold pen/syringe at 90° angle to skin",
                    "Push needle straight through skin in one motion",
                    "Inject medication slowly (take 5-10 seconds)",
                    "Keep needle in skin for 10 seconds after injection",
                  ],
                },
                {
                  step: "5. Complete",
                  details: [
                    "Remove needle carefully and apply pressure briefly",
                    "Do NOT recap needle (if syringe)",
                    "Dispose in sharps container",
                    "Note time, dose, and site in log",
                  ],
                },
              ].map((section, idx) => (
                <div
                  key={idx}
                  className="p-4 border-2 border-success/30 rounded-lg bg-success/10"
                >
                  <h4 className="font-bold text-xl mb-3 text-foreground">{section.step}</h4>
                  <ul className="space-y-2">
                    {section.details.map((detail, didx) => (
                      <li key={didx} className="flex gap-2 text-base text-foreground">
                        <span className="text-blue-600 font-bold">→</span>
                        <span>{detail}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="sites">
            <div className="grid md:grid-cols-3 gap-4">
              {injectionSites.map((site, idx) => (
                <div key={idx} className="p-4 border-2 border-border rounded-lg bg-card">
                  <div className="text-5xl mb-3">{site.icon}</div>
                  <h4 className="font-bold text-xl mb-2 text-foreground">{site.area}</h4>
                  <p className="text-base text-muted-foreground mb-3">{site.details}</p>

                  <div className="space-y-3 text-base">
                    <div>
                      <span className="font-semibold text-success">✓ Pros:</span>
                      <p className="text-foreground">{site.pros}</p>
                    </div>
                    <div>
                      <span className="font-semibold text-amber-700">⚠ Cons:</span>
                      <p className="text-foreground">{site.cons}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 p-4 bg-accent/10 rounded-lg border-2 border-accent/30">
              <h4 className="font-bold mb-2 text-lg text-foreground">Rotation Pattern Example</h4>
              <p className="text-base text-foreground mb-3">
                To prevent lipohypertrophy (fat lumps):
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm font-mono text-center">
                <div className="p-2 bg-primary/20 text-foreground rounded font-semibold">Week 1<br/>Abd L</div>
                <div className="p-2 bg-primary/30 text-foreground rounded font-semibold">Week 2<br/>Abd R</div>
                <div className="p-2 bg-success/20 text-foreground rounded font-semibold">Week 3<br/>Thigh L</div>
                <div className="p-2 bg-success/30 text-foreground rounded font-semibold">Week 4<br/>Thigh R</div>
              </div>
              <p className="text-sm text-foreground mt-2 font-semibold">
                Then repeat with upper arms, thighs, and abdomen in different spots
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </Card>

      {/* Side Effects Management */}
      <Card className="p-6 bg-card border border-border">
        <h2 className="text-3xl font-heading font-bold mb-4 text-foreground">Side Effects & Management</h2>
        <div className="space-y-3">
          {commonSideEffects.map((se, idx) => (
            <div key={idx} className="p-4 border-2 border-border rounded-lg bg-card">
              <div className="flex items-start gap-3 mb-2">
                <span className="text-4xl">
                  {se.effect === "Nausea"
                    ? "🤢"
                    : se.effect === "Vomiting"
                      ? "🤮"
                      : se.effect === "Constipation/Diarrhea"
                        ? "🚽"
                        : se.effect === "Abdominal Pain"
                          ? "🤕"
                          : se.effect === "Appetite Suppression"
                            ? "🍽️"
                            : "⚠️"}
                </span>
                <div className="flex-1">
                  <h4 className="font-bold text-lg text-foreground">{se.effect}</h4>
                  <p className="text-base text-muted-foreground">Onset: {se.onset}</p>
                </div>
              </div>
              <div className="space-y-2 text-base">
                <div>
                  <span className="font-semibold text-foreground">Management:</span>
                  <p className="text-foreground">{se.management}</p>
                </div>
                <div>
                  <span className="font-semibold text-foreground">Resolution:</span>
                  <p className="text-foreground">{se.resolve}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Safety Considerations */}
      <Card className="p-6 border-2 border-destructive/30 bg-destructive/10">
        <h2 className="text-3xl font-heading font-bold mb-4 text-destructive">⚠️ Safety Considerations</h2>
        <ul className="space-y-2">
          {safetyConsiderations.map((safety, idx) => (
            <li key={idx} className="flex gap-3 text-base text-destructive font-semibold">
              <span className="text-destructive font-bold">✗</span>
              <span>{safety}</span>
            </li>
          ))}
        </ul>
      </Card>

      {/* Medication Interactions */}
      <Card className="p-6 bg-card border border-border">
        <h2 className="text-3xl font-heading font-bold mb-4 text-foreground">⚗️ Important Medication Interactions</h2>
        <div className="space-y-3">
          {[
            {
              drug: "Sulfonylureas (Glyburide, Glipizide)",
              concern: "Increased hypoglycemia risk",
              action: "Reduce SU dose when starting GLP-1",
            },
            {
              drug: "Insulin",
              concern: "Hypoglycemia risk",
              action: "Reduce insulin doses; monitor closely",
            },
            {
              drug: "Oral Medications",
              concern: "Slower gastric emptying may reduce absorption",
              action: "Take 1-2 hours before GLP-1 injection",
            },
            {
              drug: "ACE-I / ARB",
              concern: "Risk of acute kidney injury in dehydration",
              action: "Monitor renal function, ensure hydration",
            },
            {
              drug: "NSAIDs",
              concern: "Dehydration/renal impairment risk",
              action: "Use alternative analgesics when possible",
            },
          ].map((interaction, idx) => (
            <div key={idx} className="p-3 border-2 border-warning/30 rounded-lg bg-warning/10">
              <h4 className="font-bold text-amber-900 mb-1 text-lg">
                {interaction.drug}
              </h4>
              <p className="text-base text-amber-900 mb-1 font-semibold">
                <span className="font-bold">Concern:</span> {interaction.concern}
              </p>
              <p className="text-base text-amber-900 font-semibold">
                <span className="font-bold">Action:</span> {interaction.action}
              </p>
            </div>
          ))}
        </div>
      </Card>

      {/* Monitoring Parameters */}
      <Card className="p-6 bg-success/10 border-2 border-success/30">
        <h2 className="text-3xl font-heading font-bold mb-4 text-success">✓ Monitoring Parameters</h2>
        <div className="grid md:grid-cols-2 gap-4">
          {[
            { param: "HbA1c", frequency: "Every 3 months", target: "<7% or individualized" },
            { param: "Fasting Glucose", frequency: "Weekly initially", target: "80-130 mg/dL" },
            { param: "Weight", frequency: "Weekly", target: "Track for dose adjustment" },
            { param: "Blood Pressure", frequency: "Monthly", target: "<130/80 mmHg" },
            { param: "Renal Function (eGFR, Cr)", frequency: "Baseline, then 6-12 months", target: "eGFR >30" },
            { param: "Pancreatic Enzymes (if symptoms)", frequency: "PRN", target: "Normal range" },
            { param: "Thyroid (TSH if hx of thyroid)", frequency: "Annually", target: "Normal" },
            { param: "Lipid Panel", frequency: "6-12 months", target: "Individual goals" },
          ].map((monitor, idx) => (
            <div key={idx} className="p-3 border-2 border-success/30 rounded-lg bg-card">
              <h4 className="font-bold text-lg text-foreground">{monitor.param}</h4>
              <p className="text-base text-muted-foreground font-semibold">Frequency: {monitor.frequency}</p>
              <p className="text-base mt-1 text-foreground">
                <span className="font-bold">Target:</span> {monitor.target}
              </p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default GLP1Administration;
