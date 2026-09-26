import { useState } from "react";
import { 
  Wind, AlertTriangle, CheckCircle, XCircle, Activity, Pill, Info,
  FileText
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";


import { SectionCard } from "@/components/ui/section-card";
import { AbbrText } from "@/components/AbbreviationHover";

// ─── GOLD 2025 Global Strategy ───
const COPD_SEVERITY = [
  {
    stage: "GOLD 1 - Mild",
    fev1: "≥80%",
    description: "Fatigue with strenuous activity. Often unrecognized.",
    action: "Minimize exposure, consider short-acting bronchodilator prn",
  },
  {
    stage: "GOLD 2 - Moderate",
    fev1: "50–79%",
    description: "Exertional dyspnea, chronic cough.",
    action: "Add LAMA or LABA + pulmonary rehab",
  },
  {
    stage: "GOLD 3 - Severe",
    fev1: "30–49%",
    description: "Functional limitation, frequent exacerbations.",
    action: "Triple therapy (ICS+LABA+LAMA), rehab",
  },
  {
    stage: "GOLD 4 - Very Severe",
    fev1: "<30%",
    description: "Severe dyspnea, quality of life impaired.",
    action: "Consider LTOT, lung volume reduction, transplant",
  },
];

// ─── Asthma: GINA 2025 Stepwise ───
const ASTHMA_STEPS = [
  {
    step: "Step 1",
    rescue: "SABA PRN",
    control: "—",
    description: "Infrequent symptoms (<2/week)",
    note: "SABA monotherapy acceptable if mild, lowexacerbation risk",
  },
  {
    step: "Step 2",
    rescue: "SABA PRN",
    control: "Low-dose ICS",
    description: "Symptoms ≥2/week or nighttime awakenings",
    note: "ICSgard for symptom control",
  },
  {
    step: "Step 3",
    rescue: "SABA PRN",
    control: "Medium-dose ICS or Low-dose ICS+LABA",
    description: "Daily symptoms, rescue ≥2/week",
    note: " MART regimen (single inhaler)",
  },
  {
    step: "Step 4",
    rescue: "SABA PRN",
    control: "Medium/high-dose ICS+LABA",
    description: "Uncontrolled on Step 3",
    note: "Add LAMA if needed",
  },
  {
    step: "Step 5",
    rescue: "SABA PRN",
    control: "High-dose ICS+LABA ± LAMA",
    description: "Severe uncontrolled asthma",
    note: "Consider biologics, BTS assessment",
  },
];

// ─── Inhaler Checklist ───
const INHALER_TYPES = [
  {
    category: "SABA",
    examples: "Albuterol/Salbutamol, Levalbuterol",
    brand: "Ventolin®, ProAir®, Accuneb®",
    note: "First-line rescue. Must have ICS if used >2x/week",
  },
  {
    category: "SAMA",
    examples: "Ipratropium",
    brand: "Atrovent®",
    note: "Less preferred than SABA. Moderate COPD only.",
  },
  {
    category: "LABA",
    examples: "Salmeterol, Formoterol, Indacaterol",
    brand: "Serevent®, Foradil®, Onbrez®",
    note: "Never monotherapy. Always+ICS",
  },
  {
    category: "LAMA",
    examples: "Tiotropium, Glycopyrronium, Umeclidinium",
    brand: "Spiriva®, Incruse®, Lonhala®",
    note: "First-line maintenance. Single-agent or+LABA",
  },
  {
    category: "ICS",
    examples: "Fluticasone, Budesonide, Beclomethasone",
    brand: "Flovent®, Pulmicort®, Qvar®",
    note: "Add to LABA/LAMA if AEC≥300 or ≥2 exacerbations/yr",
  },
  {
    category: "LABA+LAMA",
    examples: "Indacaterol+Glycopyrronium, Vilanterol+Umeclidinium",
    brand: "Ultibro®, Anoro®, Breezhaler®",
    note: "Dual bronchodilation, convenience",
  },
  {
    category: "ICS+LABA",
    examples: "Fluticasone+Salmeterol, Budesonide+Formoterol",
    brand: "Advair®, Symbicort®, Breo®",
    note: "Common Step 3+ therapy",
  },
  {
    category: "Triple",
    examples: "ICS+LABA+LAMA (multiple combos)",
    brand: "Trelegy®, Trimbow®",
    note: "GOLD 3-4, AEC≥2/yr despite dual therapy",
  },
  {
    category: "Methylxanthine",
    examples: "Theophylline",
    brand: "Theo-24®, Uniphyl®",
    note: "Narrow therapeutic index. Levels 5-15 μg/mL",
  },
  {
    category: "Mucolytic",
    examples: "Carbocisteine, Erdosteine, NAC",
    brand: "Mucolytic®, Solmesta®",
    note: "Reduces exacerbations in chronic bronchitis",
  },
];

// ─── Rescue Inhaler Protocol ───
function ResucerProtocol() {
  const steps = [
    { n: 1, text: "Take 2 puffs SABA (Ventolin), repeat after 1 min if no improvement", critical: true },
    { n: 2, text: "Sit upright, loosen tight clothing", critical: false },
    { n: 3, text: "IF: speaking in sentences, HR>120, Lips/clubbing blue → EMERGENCY", critical: true },
    { n: 4, text: "Add/ipratropium if poor response to SABA alone", critical: false },
    { n: 5, text: "START oral prednisone 40mg if: persistent wheeze OR PEFR<80%", critical: true },
    { n: 6, text: "Seek emergency care if: no improvement in 20 min OR deteriorating", critical: true },
  ];
  return (
    <div className="space-y-3">
      {steps.map((s) => (
        <div key={s.n} className={`flex gap-3 p-3 rounded-lg ${s.critical ? 'bg-destructive/10 border border-destructive/30' : 'bg-muted/30'}`}>
          <div className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold ${s.critical ? 'bg-destructive/100 text-white' : 'bg-muted text-muted-foreground'}`}>
            {s.n}
          </div>
          <span className={s.critical ? 'text-destructive font-medium' : 'text-foreground'}>{s.text}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Exacerbation Warning Signs ───
const EXACERBATION_SIGNS = [
  { sign: "Increased dyspnea at rest", action: "Start rescue protocol, call emergency" },
  { sign: "Sputum >50 mL/day or purulent", action: "Add antibiotic if 2+ symptoms worsening" },
  { sign: "Fever >38°C", action: "Rule infection, CXR indicated" },
  { sign: "Confusion/agitation", action: "Hypercapnia risk - ABG, ICU if pH<7.35" },
  { sign: "PEFR fall >30% from baseline", action: "Critical, escalate care" },
  { sign: "HR >120, RR >30", action: "Severe exacerbation" },
];

// ─── Main Component ───
export default function RespiratoryTab() {
  const [activeTab, setActiveTab] = useState("copd");

  // Calculate eGFR for COPD medicine adjustment (simplified)
  const [egfr, setEgfr] = useState("");

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 py-6 md:py-8">
        <div className="mb-6 flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20">
            <Wind className="h-6 w-6 text-cyan-500" />
          </div>
          <div>
            <h1 className="text-3xl font-serif font-semibold tracking-tight text-foreground">
              Respiratory Management
            </h1>
            <p className="text-muted-foreground">
              COPD <AbbrText text="GOLD 2025" /> and Asthma <AbbrText text="GINA 2025" /> guidelines
            </p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-1 sm:grid-cols-2 h-auto p-1 bg-muted/50">
            <TabsTrigger value="copd" className="flex items-center gap-2 py-3 data-[state=active]:bg-cyan-500/10 data-[state=active]:text-cyan-600">
              <Wind className="h-4 w-4" /><span>COPD</span>
            </TabsTrigger>
            <TabsTrigger value="asthma" className="flex items-center gap-2 py-3 data-[state=active]:bg-warning/100/10 data-[state=active]:text-warning">
              <Wind className="h-4 w-4" /><span>Asthma</span>
            </TabsTrigger>
          </TabsList>

          {/* COPD TAB */}
          <TabsContent value="copd" className="mt-0 space-y-6">
            <SectionCard title="GOLD 2025 Severity Classification" icon={<Activity className="h-4 w-4" />} tone="cyan" collapsible={false}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {COPD_SEVERITY.map((stage) => (
                  <div key={stage.stage} className="p-4 rounded-lg border border-border bg-card">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-foreground">{stage.stage}</span>
                      <Badge variant="outline" className="font-mono">{stage.fev1}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{stage.description}</p>
                    <p className="text-sm font-medium text-cyan-600">{stage.action}</p>
                  </div>
                ))}
              </div>
            </SectionCard>

            <SectionCard title="Inhaler Classes (COPD)" icon={<Pill className="h-4 w-4" />} tone="cyan" collapsible={false}>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 px-3 font-semibold">Class</th>
                      <th className="text-left py-2 px-3 font-semibold">Examples</th>
                      <th className="text-left py-2 px-3 font-semibold">Note</th>
                    </tr>
                  </thead>
                  <tbody>
                    {INHALER_TYPES.slice(0, 6).map((inh) => (
                      <tr key={inh.category} className="border-b border-border/30">
                        <td className="py-2 px-3 font-medium">{inh.category}</td>
                        <td className="py-2 px-3 text-muted-foreground">{inh.examples}</td>
                        <td className="py-2 px-3 text-xs text-muted-foreground">{inh.note}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </SectionCard>

            <SectionCard title="Exacerbation Warning Signs" icon={<AlertTriangle className="h-4 w-4" />} tone="danger" collapsible={false}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {EXACERBATION_SIGNS.map((item) => (
                  <div key={item.sign} className="flex items-start gap-3 p-3 rounded-lg bg-destructive/10/50 border border-destructive/30/30">
                    <AlertTriangle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-medium text-foreground text-sm">{item.sign}</span>
                      <p className="text-xs text-red-600 mt-1">{item.action}</p>
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>
          </TabsContent>

          {/* ASTHMA TAB */}
          <TabsContent value="asthma" className="mt-0 space-y-6">
            <SectionCard title="GINA 2025 Stepwise Management" icon={<FileText className="h-4 w-4" />} tone="amber" collapsible={false}>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 px-2 font-semibold">Step</th>
                      <th className="text-left py-2 px-2 font-semibold">Reliever</th>
                      <th className="text-left py-2 px-2 font-semibold">Controller</th>
                      <th className="text-left py-2 px-2 font-semibold">Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ASTHMA_STEPS.map((step) => (
                      <tr key={step.step} className="border-b border-border/30">
                        <td className="py-2 px-2 font-medium">{step.step}</td>
                        <td className="py-2 px-2">{step.rescue}</td>
                        <td className="py-2 px-2 text-muted-foreground">{step.control}</td>
                        <td className="py-2 px-2 text-xs">{step.note}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </SectionCard>

            <SectionCard title="SABA Over-reliance Warning" icon={<AlertTriangle className="h-4 w-4" />} tone="danger" collapsible={false}>
              <div className="p-4 bg-warning/10/50 rounded-lg border border-warning/30/30">
                <p className="text-sm text-amber-800">
                  <strong>Red flag:</strong> Using SABA &gt;2 times/week (excluding PRN for exercise) indicates uncontrolled asthma.
                </p>
                <ul className="mt-3 space-y-2 text-sm text-amber-700">
                  <li className="flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-red-500" /> SABA-only regimen increases mortality risk
                  </li>
                  <li className="flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-red-500" /> Reliever alone reduces clinic visits but increases exacerbations
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-success" /> Always pair SABA with ICS (formoterol doubles as controller)
                  </li>
                </ul>
              </div>
            </SectionCard>

            <SectionCard title="Inhaler Technique" icon={<Info className="h-4 w-4" />} tone="neutral" collapsible={false}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="p-3 rounded-lg bg-muted/30">
                  <h4 className="font-semibold mb-2">MDI (Metered Dose)</h4>
                  <ol className="space-y-1 text-muted-foreground text-xs list-decimal list-inside">
                    <li>Remove cap, shake well (4-5 shakes)</li>
                    <li>Breathe out fully (not into device)</li>
                    <li>Place mouthpiece between teeth</li>
                    <li>Start breathing in slowly, press canister</li>
                    <li>Hold breath 10 sec, exhale</li>
                    <li>Wait 30sec before 2nd puff</li>
                  </ol>
                </div>
                <div className="p-3 rounded-lg bg-muted/30">
                  <h4 className="font-semibold mb-2">DPI (Dry Powder)</h4>
                  <ol className="space-y-1 text-muted-foreground text-xs list-decimal list-inside">
                    <li>Load dose (click or capsule)</li>
                    <li>Breathe out fully (away from device)</li>
                    <li>Place mouthpiece, seal lips</li>
                    <li>Breathe in rapidly and deeply</li>
                    <li>Hold breath 10 sec</li>
                    <li>Do not shake; powder is the carrier</li>
                  </ol>
                </div>
              </div>
            </SectionCard>

            <SectionCard title="Acute Asthma Rescue Protocol" icon={<AlertTriangle className="h-4 w-4" />} tone="danger" collapsible={false}>
              <ResucerProtocol />
            </SectionCard>
          </TabsContent>
        </Tabs>

        {/* Bottom info */}
        <div className="mt-8 p-4 rounded-lg bg-muted/30 border border-border/30">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
            <div className="text-xs text-muted-foreground">
              <p className="font-semibold text-foreground mb-1">References:</p>
              <p>GOLD 2025: Global Strategy for Diagnosis, Management and Prevention of COPD</p>
              <p>GINA 2025: Global Initiative for Asthma</p>
              <p className="mt-2">Always individualize based on severity, comorbidities, and patient preference.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}