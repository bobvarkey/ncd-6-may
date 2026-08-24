import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Activity,
  AlertTriangle,
  Brain,
  Heart,
  User,
  Users,
  Pill,
  Bone,
  Stethoscope,
  Info,
  RotateCcw,
  Footprints,
  Shield,
  Search,
  ClipboardList,
  ArrowRight,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ExternalLink,
  Image as ImageIcon
} from "lucide-react";
import ImageLink from "@/components/ImageLink";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

// ── Risk Flag Checklist ──
const RISK_FLAGS = [
  { id: "falls", label: "Recent fall or fear of falling" },
  { id: "weight_loss", label: "Unintentional weight loss" },
  { id: "memory", label: "Memory complaint or confusion" },
  { id: "incontinence", label: "Urinary incontinence" },
  { id: "depression", label: "Depressive symptoms or social isolation" },
  { id: "adl", label: "Difficulty with ADL or IADL" },
  { id: "polypharmacy", label: "Use of 5 or more medications" },
  { id: "sensory", label: "Sensory impairment (vision/hearing)" },
];

// ── Screening Domains ──
const SCREENING_DOMAINS = [
  { domain: "Cognition", tools: "Mini-Cog, AMT-4, MoCA if indicated" },
  { domain: "Delirium", tools: "4AT, CAM in acute settings" },
  { domain: "Mood", tools: "PHQ-2, GDS-5" },
  { domain: "Mobility & Falls", tools: "Timed Up and Go, Gait speed, Orthostatic vitals" },
  { domain: "Frailty", tools: "Clinical Frailty Scale, Fried phenotype features" },
  { domain: "Function", tools: "ADL, IADL" },
  { domain: "Nutrition", tools: "MNA-SF, BMI, Recent weight loss" },
  { domain: "Medication Burden", tools: "Medication reconciliation, High-risk medication review" },
  { domain: "Sensory Status", tools: "Vision screen, Hearing screen" },
  { domain: "Continence", tools: "Urinary and fecal continence history" },
  { domain: "Social Support", tools: "Caregiver assessment, Living situation review" },
];

// ── Geriatric Syndromes ──
const GERIATRIC_SYNDROMES = [
  { name: "Falls", icon: <Footprints className="h-4 w-4" />, color: "text-red-400" },
  { name: "Incontinence", icon: <Activity className="h-4 w-4" />, color: "text-blue-400" },
  { name: "Delirium", icon: <Brain className="h-4 w-4" />, color: "text-orange-400" },
  { name: "Cognitive Impairment", icon: <Brain className="h-4 w-4" />, color: "text-purple-400" },
  { name: "Depression", icon: <Heart className="h-4 w-4" />, color: "text-rose-400" },
  { name: "Isolation", icon: <Users className="h-4 w-4" />, color: "text-amber-400" },
  { name: "Frailty", icon: <Activity className="h-4 w-4" />, color: "text-yellow-400" },
  { name: "Sarcopenia", icon: <Bone className="h-4 w-4" />, color: "text-lime-400" },
  { name: "Polypharmacy", icon: <Pill className="h-4 w-4" />, color: "text-cyan-400" },
  { name: "Medication Mismanagement", icon: <Pill className="h-4 w-4" />, color: "text-pink-400" },
];

// ── Overview Section ──
function GeriatricsOverview() {
  return (
    <div className="space-y-6">
      {/* Definition */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Info className="h-5 w-5 text-primary" />
            Definition & Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm">
            Geriatric syndromes are multifactorial health conditions common in older adults, resulting from the interaction of aging, disease, and environmental stressors.
          </p>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="text-xs">Frailty</Badge>
            <Badge variant="secondary" className="text-xs">Multimorbidity</Badge>
            <Badge variant="secondary" className="text-xs">Functional Decline</Badge>
          </div>
          <div>
            <p className="text-sm font-semibold mb-2">Age-Related Changes</p>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
              {[
                "Reduced physiologic reserve",
                "Stiffened vessels",
                "Decline in senses (vision, hearing)",
                "Musculoskeletal decline",
                "Cognitive and psychosocial changes",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span className="text-muted-foreground">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Key Geriatric Syndromes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Activity className="h-5 w-5 text-rose-400" />
            Key Geriatric Syndromes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
            {GERIATRIC_SYNDROMES.map((s) => (
              <div key={s.name} className="flex items-center gap-2 p-2 rounded-lg bg-muted/30 border border-border/50">
                <span className={s.color}>{s.icon}</span>
                <span className="text-xs font-medium">{s.name}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Clinical Assessment */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Stethoscope className="h-5 w-5 text-emerald-400" />
            Clinical Assessment
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-3 rounded-lg bg-muted/30 border border-border">
              <p className="text-sm font-semibold mb-2">Medical History Focus</p>
              <ul className="space-y-1 text-xs text-muted-foreground">
                <li>• Functional decline</li>
                <li>• Social support</li>
                <li>• Polypharmacy</li>
              </ul>
            </div>
            <div className="p-3 rounded-lg bg-muted/30 border border-border">
              <p className="text-sm font-semibold mb-2">Physical Exam Focus</p>
              <ul className="space-y-1 text-xs text-muted-foreground">
                <li>• Mobility</li>
                <li>• Balance</li>
                <li>• Cognition</li>
                <li>• Sensory function</li>
              </ul>
            </div>
            <div className="p-3 rounded-lg bg-muted/30 border border-border">
              <p className="text-sm font-semibold mb-2">Cognitive Screen</p>
              <ul className="space-y-1 text-xs text-muted-foreground">
                <li>• Mini-Cog</li>
                <li>• AMT-4</li>
                <li>• MoCA (if indicated)</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Multidisciplinary Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="h-5 w-5 text-blue-400" />
            Multidisciplinary Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-3 rounded-lg bg-blue-500/5 border border-blue-500/20">
              <p className="text-sm font-semibold text-blue-400 mb-2">Coordinated Care</p>
              <p className="text-xs text-muted-foreground">Primary care, specialists, nurses, and social workers working together</p>
            </div>
            <div className="p-3 rounded-lg bg-green-500/5 border border-green-500/20">
              <p className="text-sm font-semibold text-green-400 mb-2">Goal-Oriented Care</p>
              <p className="text-xs text-muted-foreground">Focused on function, independence, and quality of life</p>
            </div>
            <div className="p-3 rounded-lg bg-purple-500/5 border border-purple-500/20">
              <p className="text-sm font-semibold text-purple-400 mb-2">Lifestyle Interventions</p>
              <p className="text-xs text-muted-foreground">Exercise, nutrition, and environmental modification</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Prevention */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Shield className="h-5 w-5 text-teal-400" />
            Prevention & Enhancing Quality of Life
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { title: "Regular Screenings", desc: "Preventive health check-ups and early detection" },
              { title: "Social Engagement", desc: "Community activity and social connections" },
              { title: "Adaptive Strategies", desc: "Assistive devices and cognitive aids" },
              { title: "Advance Care Planning", desc: "Goals of care, advance directives, surrogate decision-makers" },
            ].map((item) => (
              <div key={item.title} className="flex items-start gap-2 p-3 rounded-lg bg-muted/20 border border-border/50">
                <CheckCircle2 className="h-4 w-4 text-teal-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-semibold">{item.title}</p>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Screening Algorithm ──
function GeriatricScreening() {
  const [flags, setFlags] = useState<string[]>([]);
  const [showScreen, setShowScreen] = useState(false);
  const [complexity, setComplexity] = useState<"low" | "intermediate" | "high" | null>(null);
  const [urgentFlags, setUrgentFlags] = useState<string[]>([]);

  const toggleFlag = (id: string) => {
    setFlags((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]
    );
  };

  const URGENT_FLAGS = [
    { id: "delirium", label: "Acute delirium" },
    { id: "syncope", label: "Syncope or recurrent unexplained falls" },
    { id: "rapid_decline", label: "Rapid functional decline" },
    { id: "abuse", label: "Suspected abuse or neglect" },
    { id: "toxicity", label: "Medication toxicity" },
    { id: "malnutrition", label: "Malnutrition or dehydration" },
    { id: "neuro_deficit", label: "New focal neurological deficit" },
  ];

  const toggleUrgent = (id: string) => {
    setUrgentFlags((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]
    );
  };

  const assessComplexity = () => {
    const count = flags.length;
    if (count === 0) setComplexity("low");
    else if (count <= 2) setComplexity("intermediate");
    else setComplexity("high");
  };

  const reset = () => {
    setFlags([]);
    setShowScreen(false);
    setComplexity(null);
    setUrgentFlags([]);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <ClipboardList className="h-6 w-6 text-primary" />
        <h2 className="text-xl font-bold">Rapid Geriatric Screening Algorithm</h2>
      </div>
      <p className="text-muted-foreground">
        For older adults in primary care, internal medicine, neurology, or hospital follow-up settings.
      </p>

      {/* Entry Criteria */}
      <Card className="border-2 border-primary/20 bg-primary/5">
        <CardContent className="pt-4">
          <p className="text-sm font-semibold mb-1">Target Population</p>
          <p className="text-sm text-muted-foreground">
            Age 65 years or older <strong>OR</strong> any age with functional decline, recurrent falls, cognitive concern, weight loss, polypharmacy, or caregiver concern
          </p>
        </CardContent>
      </Card>

      {/* Step 1: Risk Flags */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <AlertTriangle className="h-5 w-5 text-amber-400" />
            Step 1: Identify Risk Flags
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Check any risk flags present. If any are positive, proceed to focused geriatric screen.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {RISK_FLAGS.map((flag) => (
              <label
                key={flag.id}
                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                  flags.includes(flag.id)
                    ? "border-amber-500/50 bg-amber-500/10"
                    : "border-border/50 bg-card hover:bg-muted/30"
                }`}
              >
                <Checkbox
                  checked={flags.includes(flag.id)}
                  onCheckedChange={() => toggleFlag(flag.id)}
                />
                <span className="text-sm">{flag.label}</span>
              </label>
            ))}
          </div>
          <div className="mt-4 flex gap-2">
            <Button onClick={() => setShowScreen(true)} disabled={flags.length === 0}>
              Proceed to Screening
            </Button>
            {flags.length > 0 && (
              <Button variant="ghost" size="sm" onClick={reset}>
                <RotateCcw className="h-4 w-4 mr-1" /> Reset
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Step 2: Focused Geriatric Screen */}
      {showScreen && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Search className="h-5 w-5 text-cyan-400" />
              Step 2: Focused Geriatric Screen
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 px-3 font-semibold">Domain</th>
                    <th className="text-left py-2 px-3 font-semibold">Screening Tools</th>
                  </tr>
                </thead>
                <tbody>
                  {SCREENING_DOMAINS.map((d) => (
                    <tr key={d.domain} className="border-b border-border/50">
                      <td className="py-2 px-3 font-medium">{d.domain}</td>
                      <td className="py-2 px-3 text-muted-foreground text-xs">{d.tools}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Stratify Complexity */}
      {showScreen && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Activity className="h-5 w-5 text-violet-400" />
              Step 3: Stratify Complexity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Based on {flags.length} risk flag(s) identified:
            </p>
            <Button onClick={assessComplexity} className="mb-4">
              Assess Complexity
            </Button>

            {complexity && (
              <div className="space-y-3">
                {complexity === "low" && (
                  <div className="p-4 rounded-lg border-2 border-success/30 bg-success/5">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle2 className="h-5 w-5 text-success" />
                      <span className="text-lg font-bold text-success">Low Risk 🟢</span>
                    </div>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• No major deficits</li>
                      <li>• Independent function</li>
                      <li>• No recent falls or delirium</li>
                    </ul>
                    <p className="text-sm font-medium mt-2 text-success">Action: Routine preventive follow-up and annual rescreening</p>
                  </div>
                )}
                {complexity === "intermediate" && (
                  <div className="p-4 rounded-lg border-2 border-warning/30 bg-warning/5">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle className="h-5 w-5 text-warning" />
                      <span className="text-lg font-bold text-warning">Intermediate Risk 🟡</span>
                    </div>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Impairment in 1–2 domains</li>
                      <li>• Early frailty, mild cognitive concern, or polypharmacy</li>
                    </ul>
                    <p className="text-sm font-medium mt-2 text-warning">Action: Targeted interventions, medication review, PT/OT, nutrition, follow-up within 1–3 months</p>
                  </div>
                )}
                {complexity === "high" && (
                  <div className="p-4 rounded-lg border-2 border-destructive/30 bg-destructive/5">
                    <div className="flex items-center gap-2 mb-2">
                      <XCircle className="h-5 w-5 text-destructive" />
                      <span className="text-lg font-bold text-destructive">High Risk 🔴</span>
                    </div>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Multiple domain deficits</li>
                      <li>• Delirium, recurrent falls, major functional decline</li>
                      <li>• Caregiver strain or severe frailty</li>
                    </ul>
                    <p className="text-sm font-medium mt-2 text-destructive">Action: Comprehensive Geriatric Assessment and multidisciplinary management</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 4: Urgent Evaluation */}
      {showScreen && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <AlertTriangle className="h-5 w-5 text-red-400" />
              Step 4: Trigger Urgent Evaluation 🚨
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Check any of the following that apply — these require urgent medical assessment:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {URGENT_FLAGS.map((flag) => (
                <label
                  key={flag.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    urgentFlags.includes(flag.id)
                      ? "border-red-500/50 bg-red-500/10"
                      : "border-border/50 bg-card hover:bg-muted/30"
                  }`}
                >
                  <Checkbox
                    checked={urgentFlags.includes(flag.id)}
                    onCheckedChange={() => toggleUrgent(flag.id)}
                  />
                  <span className="text-sm">{flag.label}</span>
                </label>
              ))}
            </div>
            {urgentFlags.length > 0 && (
              <div className="mt-4 p-3 rounded-lg bg-destructive/10 border border-destructive/30">
                <p className="text-sm font-semibold text-destructive">
                  🚨 Urgent medical assessment or hospital-level evaluation required
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 5: Care Plan */}
      {showScreen && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <ClipboardList className="h-5 w-5 text-emerald-400" />
              Step 5: Care Plan Generation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { title: "Problem List", desc: "By geriatric domain" },
                { title: "Medication Optimization", desc: "Deprescribing, high-risk medication review" },
                { title: "Fall Prevention Plan", desc: "Home safety, balance training, assistive devices" },
                { title: "Exercise & Nutrition", desc: "Strength training, protein intake, vitamin D" },
                { title: "Cognitive & Mood Interventions", desc: "Cognitive stimulation, social engagement, antidepressants" },
                { title: "Caregiver Support", desc: "Respite care, education, support groups" },
                { title: "Advance Care Planning", desc: "Goals of care, advance directives" },
              ].map((item) => (
                <div key={item.title} className="flex items-start gap-2 p-3 rounded-lg bg-muted/20 border border-border/50">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold">{item.title}</p>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Implementation Notes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Info className="h-5 w-5 text-sky-400" />
            Implementation Notes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            {[
              "Use a brief intake screen at triage or nursing station",
              "Auto-trigger domain tools when any flag is positive",
              "Escalate high-risk cases to CGA pathway",
              "Track longitudinal decline in function, cognition, falls, and weight",
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-2">
                <ArrowRight className="h-4 w-4 text-sky-400 mt-0.5 shrink-0" />
                <span className="text-muted-foreground">{item}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

function FragilityFractures() {
  return (
    <div className="space-y-6">
      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Bone className="h-5 w-5 text-amber-400" />
            Fragility Fractures & Metabolic Bone Disease
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
            <h4 className="text-sm font-semibold mb-2">Clinical Context</h4>
            <p className="text-sm text-muted-foreground">
              Fragility fractures (fractures resulting from low-energy trauma, such as a fall from standing height) are a hallmark of osteoporosis and increased bone fragility. 
              In patients with multiple fractures or those with unexpected severity, screening for secondary causes is essential.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-lg border border-border bg-card">
              <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                <Search className="h-4 w-4 text-primary" />
                Initial Evaluation
              </h4>
              <ul className="text-xs text-muted-foreground space-y-2">
                <li>• Bone Mineral Density (DEXA) — spine and hip</li>
                <li>• FRAX Score calculation</li>
                <li>• Vertebral Fracture Assessment (VFA)</li>
                <li>• Lab workup: Vitamin D, Calcium, PTH, Thyroid, eGFR</li>
              </ul>
            </div>
            <div className="p-4 rounded-lg border border-warning/20 bg-warning/5">
              <h4 className="text-sm font-semibold mb-2 flex items-center gap-2 text-warning">
                <AlertTriangle className="h-4 w-4" />
                Secondary Causes Screening
              </h4>
              <p className="text-xs text-muted-foreground mb-3">
                If Z-score &lt; -2.0 or recurrent fractures despite therapy, evaluate for:
              </p>
              <ul className="text-xs text-muted-foreground space-y-2">
                <li>• <strong>Hypercortisolism (Cushing's)</strong> — Structured screen recommended</li>
                <li>• Multiple Myeloma (SPEP/UPEP)</li>
                <li>• Celiac disease</li>
                <li>• Hyperparathyroidism</li>
              </ul>
            </div>
          </div>

          <div className="flex justify-center py-2">
            <ImageLink imageId="structured-hypercortisolism-screen" label="View Structured Hypercortisolism Screen →" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Main Page ──
export default function Geriatrics() {
  const [activeTab, setActiveTab] = useState("overview");

  // Handle URL tab param if needed
  useState(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get("tab");
    if (tab === "fractures") setActiveTab("fractures");
  });

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex items-center gap-2">
        <User className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">Geriatrics</h1>
        <Badge variant="outline" className="text-xs">
          Geriatric Syndromes
        </Badge>
      </div>
      <p className="text-muted-foreground">
        Comprehensive approach to geriatric syndromes — screening algorithm, clinical assessment, and management of common disorders of aging.
      </p>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full flex-wrap">
          <TabsTrigger value="overview" className="flex-1 gap-2">
            <Info className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="screening" className="flex-1 gap-2">
            <ClipboardList className="h-4 w-4" />
            Screening Algorithm
          </TabsTrigger>
          <TabsTrigger value="fractures" className="flex-1 gap-2">
            <Bone className="h-4 w-4" />
            Fragility Fractures
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <GeriatricsOverview />
        </TabsContent>

        <TabsContent value="screening" className="mt-6">
          <GeriatricScreening />
        </TabsContent>

        <TabsContent value="fractures" className="mt-6">
          <FragilityFractures />
        </TabsContent>
      </Tabs>

      <div className="flex justify-center py-4 border-t border-border/50">
        <ImageLink imageId="structured-hypercortisolism-screen" label="View Structured Hypercortisolism Screen →" />
      </div>
    </div>
  );
}
