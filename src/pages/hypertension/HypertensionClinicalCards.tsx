import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";


import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import DstInterpretationPanel from "@/components/hypertension/DstInterpretationPanel";
import {
  Activity,
  AlertTriangle,
  AlertCircle,
  Brain,
  Heart,
  Gauge,
  Info,
  Search,
  Stethoscope,
  CheckCircle2,
  XCircle,
  Ban,
} from "lucide-react";

// ─── Color tokens ───
const accent = "#fb923c";
const accentBg = "rgba(251,146,60,0.12)";
const accentBorder = "rgba(251,146,60,0.2)";

// ─── Tabs ───
const CARD_TABS = [
  { id: "secondary", label: "Secondary HTN Workup" },
  { id: "treatment", label: "Treatment Guide" },
  { id: "emergencies", label: "Hypertensive Emergencies" },
];

// ═══════════════════════════════════════════════════════════════════════════
// 1. SECONDARY HYPERTENSION WORKUP
// ═══════════════════════════════════════════════════════════════════════════

const BP_CLASSIFICATION = [
  { label: "Normal", sbp: "<120", dbp: "<80", color: "text-emerald-400", action: "Reassess in 1 year", bg: "bg-success/100/10" },
  { label: "Elevated", sbp: "120–129", dbp: "<80", color: "text-yellow-400", action: "Lifestyle modification, reassess 3-6 months", bg: "bg-warning/10" },
  { label: "Stage 1 HTN", sbp: "130–139", dbp: "80–89", color: "text-warning", action: "Lifestyle + 1 medication if high CV risk", bg: "bg-warning/100/10" },
  { label: "Stage 2 HTN", sbp: "≥140", dbp: "≥90", color: "text-destructive", action: "Lifestyle + 2 antihypertensives", bg: "bg-destructive/100/10" },
  { label: "Crisis", sbp: ">180", dbp: ">120", color: "text-destructive", action: "Immediate evaluation + IV therapy", bg: "bg-rose-500/10" },
];

const RED_FLAGS: { flag: string; icon: React.ReactNode; detail?: string }[] = [
  { flag: "Age <30 or >55 years at onset", icon: <Activity className="h-3 w-3" />, detail: "New-onset HTN outside typical age range" },
  { flag: "Resistant HTN", icon: <AlertTriangle className="h-3 w-3" />, detail: "Uncontrolled BP despite ≥3 drugs (including diuretic)" },
  { flag: "Sudden worsening of previously controlled BP", icon: <Gauge className="h-3 w-3" />, detail: "Previously well-controlled HTN becoming refractory" },
  { flag: "Severe / malignant HTN (≥180/120)", icon: <AlertCircle className="h-3 w-3" />, detail: "With end-organ damage" },
  { flag: "Unprovoked or severe hypokalemia", icon: <Stethoscope className="h-3 w-3" />, detail: "K+ <3.5 without diuretic use → think Conn's" },
  { flag: "Abdominal bruit", icon: <Stethoscope className="h-3 w-3" />, detail: "Suggests renal artery stenosis (especially young female → FMD)" },
  { flag: "Episodic symptoms (palpitations, sweating, headache)", icon: <Brain className="h-3 w-3" />, detail: "Triad = pheochromocytoma" },
  { flag: "Cushingoid appearance", icon: <Search className="h-3 w-3" />, detail: "Moon facies, buffalo hump, striae, central obesity" },
  { flag: "Asymmetric kidney size (>1.5 cm)", icon: <Stethoscope className="h-3 w-3" />, detail: "Suggests renovascular disease" },
  { flag: "Discrepant limb BP (>20 mmHg)", icon: <Activity className="h-3 w-3" />, detail: "Upper > lower → coarctation of aorta" },
];

const CHARLES_MNEMONIC: { letter: string; stands: string; color: string }[] = [
  { letter: "C", stands: "Conn's syndrome, Cushing's, Congenital adrenal hyperplasia", color: "text-destructive" },
  { letter: "H", stands: "Hyperparathyroidism, Hyperthyroidism", color: "text-warning" },
  { letter: "A", stands: "Aortic coarctation, Adrenal carcinoma", color: "text-yellow-400" },
  { letter: "R", stands: "Renovascular hypertension, Reninoma, Renal parenchymal disease", color: "text-warning" },
  { letter: "L", stands: "Liddle's syndrome (ENaC gain-of-function), Licorice", color: "text-cyan-400" },
  { letter: "E", stands: "Estrogen pills (OCPs), End-stage renal disease", color: "text-blue-400" },
  { letter: "S", stands: "Sleep apnea, Stenosis (renal artery)", color: "text-teal-400" },
];

interface WorkupTest {
  name: string;
  tag: "screening" | "confirmatory" | "localization" | "history" | "monitoring";
  reference?: string;
  detail?: string;
  required?: boolean;
}

interface WorkupCategory {
  category: string;
  group: "Endocrine" | "Renal" | "Vascular" | "Lifestyle" | "Other";
  tests: WorkupTest[];
}

interface DrugProfile {
  name: string;
  class: string;
  dosing: string;
  pearls: string;
  caution: string;
}

const COMBINATION_TABLE: { combo: string; safe: boolean; note: string }[] = [];
const ANTIHYPERTENSIVE_DRUGS: DrugProfile[] = [];


const SECONDARY_WORKUP: WorkupCategory[] = [
  {
    category: "Primary Aldosteronism",
    group: "Endocrine",
    tests: [
      { name: "Aldosterone/renin ratio", tag: "screening", reference: "ARR >20 ng/dL per ng/mL/h", detail: "Initial screening only; positive if ARR >20" },
      { name: "Saline suppression test", tag: "confirmatory", reference: "Aldosterone >10 ng/dL post-infusion", detail: "Gold standard confirmatory test for hyperaldosteronism" },
      { name: "Adrenal CT/MRI", tag: "localization", detail: "Identify adenoma vs bilateral hyperplasia" },
    ],
  },
  {
    category: "Obstructive Sleep Apnea",
    group: "Other",
    tests: [
      { name: "Sleep study (polysomnography)", tag: "confirmatory", reference: "AHI >5 events/hour", detail: "Gold standard for diagnosis" },
      { name: "Epworth sleepiness scale", tag: "screening", reference: "Score >10 suggestive of excessive daytime sleepiness", detail: "Subjective daytime sleepiness assessment" },
      { name: "Overnight oximetry", tag: "screening", reference: "SpO2 <90% for >1% of sleep time", detail: "Screens for nocturnal hypoxemia" },
    ],
  },
  {
    category: "Alcohol Use",
    group: "Lifestyle",
    tests: [
      { name: "Detailed alcohol history", tag: "history", detail: "Quantify intake; >2 drinks/day linked to HTN" },
      { name: "AUDIT questionnaire", tag: "screening", reference: "Score >8 suggests hazardous use", detail: "Standardized alcohol use assessment" },
      { name: "GGT, AST, ALT levels", tag: "monitoring", reference: "GGT >50 U/L, AST/ALT ratio >2", detail: "Liver enzymes elevated with chronic use" },
    ],
  },
  {
    category: "NSAID Use",
    group: "Lifestyle",
    tests: [
      { name: "Medication history review", tag: "history", detail: "Include Rx, OTC, and herbal supplements" },
      { name: "OTC medication assessment", tag: "history", detail: "NSAIDs can raise BP by 3-5 mmHg" },
      { name: "Drug interaction check", tag: "monitoring", detail: "NSAIDs reduce efficacy of antihypertensives" },
    ],
  },
  {
    category: "Renovascular Disease",
    group: "Renal",
    tests: [
      { name: "Renal ultrasound", tag: "screening", reference: "Renal size difference >1.5 cm suggests RAS", detail: "Assess kidney size and asymmetry" },
      { name: "Serum creatinine", tag: "screening", reference: "M: 0.7-1.3 mg/dL, W: 0.6-1.1 mg/dL", detail: "Monitor renal function" },
      { name: "BUN", tag: "screening", reference: "7-20 mg/dL", detail: "Assess renal perfusion" },
      { name: "Urinalysis", tag: "screening", detail: "Assess proteinuria or hematuria" },
    ],
  },
  {
    category: "Renal Artery Stenosis",
    group: "Vascular",
    tests: [
      { name: "Renal artery Doppler", tag: "screening", reference: "PSV >180 cm/s suggests >60% stenosis", detail: "Non-invasive; detect flow velocity changes" },
      { name: "CT angiography", tag: "confirmatory", reference: "<50% narrow non-sorting", detail: "High sensitivity for detecting stenosis" },
      { name: "MR angiography", tag: "confirmatory", detail: "Avoids contrast nephropathy risk" },
      { name: "ACE inhibitor test", tag: "screening", detail: "Excessive rise in Cr suggests bilateral RAS" },
    ],
  },
  {
    category: "Thyroid Disorders",
    group: "Endocrine",
    tests: [
      { name: "TSH", tag: "screening", reference: "0.4 to 4.0 mIU/L", detail: "First-line thyroid function test" },
      { name: "Free T3", tag: "confirmatory", reference: "2.3-4.1 pg/mL", detail: "Active thyroid hormone level" },
      { name: "Free T4", tag: "confirmatory", reference: "0.9-1.7 ng/dL", detail: "Unbound thyroxine level" },
      { name: "Thyroid antibodies", tag: "confirmatory", detail: "TPO Ab, Tg Ab for autoimmune thyroiditis" },
    ],
  },
  {
    category: "Cushing's Syndrome",
    group: "Endocrine",
    tests: [
      { name: "1 mg overnight DST (preferred screen)", tag: "screening", reference: "8 am cortisol ≤50 nmol/L (1.8 µg/dL) rules out Cushing's", detail: "1 mg dexamethasone at 23:00 → 08:00 serum cortisol next morning. Best initial screen." },
      { name: "Late-night salivary cortisol", tag: "screening", reference: ">0.13 µg/dL (loss of diurnal variation)", detail: "Alternative screen; two separate late-night samples." },
      { name: "24-hour urine free cortisol", tag: "screening", reference: ">3× upper limit suggests Cushing's", detail: "Two collections; confirms endogenous hypercortisolism." },
      { name: "Random morning cortisol (NOT recommended)", tag: "screening", reference: "Too nonspecific — do NOT use to screen for Cushing's", detail: "Diurnal variability and stress make a single AM cortisol unreliable for screening Cushing's syndrome." },
    ],
  },
  {
    category: "Substance Abuse & Polycythemia",
    group: "Other",
    tests: [
      { name: "Urine toxicology screen", tag: "screening", detail: "Cocaine, amphetamines cause acute HTN" },
      { name: "Complete blood count", tag: "screening", detail: "Routine hematology assessment" },
      { name: "Hematocrit", tag: "screening", reference: ">52% (men), >48% (women)", detail: "Elevated in polycythemia" },
      { name: "EPO levels", tag: "confirmatory", reference: "4-24 mU/mL", detail: "Distinguish primary vs secondary polycythemia" },
    ],
  },
  {
    category: "Pheochromocytoma",
    group: "Endocrine",
    tests: [
      { name: "24-hour urine metanephrines", tag: "screening", reference: "Metanephrines >400 µg/24h", detail: "High sensitivity screening test" },
      { name: "Plasma metanephrines", tag: "screening", reference: "Normetanephrines >0.9 nmol/L", detail: "Preferred if high clinical suspicion" },
      { name: "CT/MRI adrenal glands", tag: "localization", detail: "MRI preferred; 10% rule (extra-adrenal, bilateral)" },
      { name: "MIBG scan if positive", tag: "localization", detail: "Localize catecholamine-secreting tissue" },
    ],
  },
  {
    category: "Reninoma (JG Cell Tumor)",
    group: "Endocrine",
    tests: [
      { name: "Stop ACEi/ARB/MRA", tag: "screening", detail: "Hold interfering meds 2-4 weeks before renin measurement" },
      { name: "Plasma renin activity", tag: "screening", reference: "Elevated", detail: "High renin - key diagnostic finding" },
      { name: "Direct renin concentration", tag: "screening", reference: "Elevated", detail: "Confirms elevated renin" },
      { name: "Serum aldosterone", tag: "screening", reference: "Elevated", detail: "Secondary hyperaldosteronism" },
      { name: "Serum potassium", tag: "screening", reference: "↓ K+ common", detail: "Hypokalemia (can be normokalemic)" },
      { name: "CT abdomen with contrast", tag: "localization", detail: "Look for small cortical renal tumor/cyst" },
      { name: "MRI kidney with contrast", tag: "localization", detail: "Further characterize if CT inconclusive" },
      { name: "Renal vein renin sampling", tag: "confirmatory", reference: "Lateralization ratio >1.5", detail: "Gold standard - Wolley technique with enalaprilat stimulation" },
    ],
  },
  {
    category: "Liddle's Syndrome",
    group: "Endocrine",
    tests: [
      { name: "Serum K+ (serial)", tag: "screening", reference: "↓ K+ (<3.5 mEq/L)", detail: "Hypokalemia - key feature" },
      { name: "Serum aldosterone", tag: "screening", reference: "LOW/NORMAL", detail: "LOW distinguishes from Conn's (HIGH)" },
      { name: "Plasma renin activity", tag: "screening", reference: "LOW/SUPPRESSED", detail: "Suppressed renin" },
      { name: "Trial amiloride 5-10mg", tag: "confirmatory", reference: "BP ↓ & K+ normalizes", detail: "DIAGNOSTIC: Amiloride responsive confirms Liddle's" },
      { name: "Genetic testing (ENaC)", tag: "confirmatory", reference: "SCNN1B or SCNN1G", detail: "Gold standard for definitive diagnosis" },
    ],
  },
];

const IV_AGENTS: DrugProfile[] = [
  { name: "Nitroprusside", class: "NO donor", dosing: "0.25–10 µg/kg/min", pearls: "Gold standard for crisis. Rapid onset/offset.", caution: "Cyanide/thiocyanate toxicity >72h or CKD" },
  { name: "Fenoldopam", class: "DA₁ agonist", dosing: "0.1–1.6 µg/kg/min", pearls: "Renal vasodilation — preserves GFR. No toxic metabolites.", caution: "Monitor for hypotension" },
  { name: "Nicardipine", class: "DHP-CCB IV", dosing: "5–15 mg/h", pearls: "No negative inotrope. Used in stroke, encephalopathy.", caution: "May cause reflex tachycardia" },
  { name: "Clevidipine", class: "DHP-CCB IV", dosing: "1–16 mg/h", pearls: "Ultra-rapid onset/offset — ideal for tight control.", caution: "Lipid emulsion → caution with egg/soy allergy" },
  { name: "Esmolol", class: "β₁-blocker IV", dosing: "25–300 µg/kg/min", pearls: "Ultra-short T½ (2 min) — titrate minute-to-minute.", caution: "Avoid in decompensated HF" },
];

// ═══════════════════════════════════════════════════════════════════════════
// 3. HYPERTENSIVE EMERGENCIES
// ═══════════════════════════════════════════════════════════════════════════

interface EmergencyProtocol {
  scenario: string;
  target: string;
  timeline: string;
  preferred: string[];
  avoid: string[];
  notes: string;
}

const EMERGENCIES: EmergencyProtocol[] = [
  {
    scenario: "Aortic Dissection",
    target: "SBP <120 mmHg",
    timeline: "0–10 min",
    preferred: ["Esmolol IV", "Labetalol IV", "Nitroprusside (+ BB)"],
    avoid: ["Hydralazine (reflex tachycardia)"],
    notes: "Rate control BEFORE vasodilation. β-blockade first to reduce dP/dt, then add vasodilator if needed.",
  },
  {
    scenario: "Acute Pulmonary Edema",
    target: "MAP ↓ 25%",
    timeline: "Minutes–1 h",
    preferred: ["Nitroglycerin IV", "Nitroprusside", "Loop diuretics"],
    avoid: ["β-blockers (decompensated HF)"],
    notes: "Preload + afterload reduction. Avoid negative inotropes in acute decompensated HF.",
  },
  {
    scenario: "Acute MI / ACS",
    target: "SBP <140 mmHg",
    timeline: "~1 h",
    preferred: ["Nitroglycerin IV", "Esmolol"],
    avoid: ["Nitroprusside", "Nifedipine"],
    notes: "Prevent reflex tachycardia which increases myocardial O₂ demand. Nifedipine increases mortality in ACS.",
  },
  {
    scenario: "Hypertensive Encephalopathy",
    target: "MAP ↓ 20–25%",
    timeline: "1 h, then gradual",
    preferred: ["Labetalol IV", "Nicardipine IV", "Nitroprusside"],
    avoid: ["Clonidine (sedation)", "Methyldopa"],
    notes: "Reduce MAP by max 25% in first hour. Over-aggressive reduction → cerebral ischemia.",
  },
  {
    scenario: "Eclampsia / Pre-eclampsia",
    target: "SBP <160, DBP <110",
    timeline: "30–60 min",
    preferred: ["Labetalol IV", "Hydralazine IV", "MgSO₄"],
    avoid: ["ACEi/ARBs (teratogenic)", "Nitroprusside (fetal cyanide)"],
    notes: "MgSO₄ for seizure prophylaxis regardless of BP. Delivery definitive treatment.",
  },
  {
    scenario: "Pheochromocytoma Crisis",
    target: "Normalize BP",
    timeline: "Minutes",
    preferred: ["Phentolamine IV", "Nicardipine IV"],
    avoid: ["β-blockers ALONE (unopposed α-stimulation)"],
    notes: "α-blockade FIRST, then add β-blocker if needed. Phentolamine 5-10 mg IV push.",
  },
  {
    scenario: "Acute Stroke (Ischemic)",
    target: "<185/110 (tPA) / <220/120",
    timeline: "~1 h",
    preferred: ["Labetalol IV", "Nicardipine IV"],
    avoid: ["Aggressive lowering (maintain perfusion)"],
    notes: "If tPA candidate → lower to <185/110. If no tPA → only lower if >220/120 or MAP >130.",
  },
  {
    scenario: "Acute Kidney Injury",
    target: "MAP ↓ 20–25%",
    timeline: "Hours",
    preferred: ["Fenoldopam", "Nicardipine IV", "Clevidipine"],
    avoid: ["ACEi/ARBs acutely", "Nitroprusside (thiocyanate)"],
    notes: "Fenoldopam has renoprotective effects (dopamine-1 agonist). Avoid volume depletion.",
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export default function HypertensionClinicalCards() {
  const [activeCard, setActiveCard] = useState("secondary");
  const [searchDrug, setSearchDrug] = useState("");
  const [checkedTests, setCheckedTests] = useState<Set<string>>(new Set());

  const toggleTest = (name: string) => {
    setCheckedTests(prev => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const totalTests = SECONDARY_WORKUP.reduce((acc, cat) => acc + cat.tests.length, 0);
  const completedTests = checkedTests.size;

  return (
    <div className="space-y-5 animate-slide-in">
      <div>
        <h1 className="text-xl font-heading font-bold flex items-center gap-2">
          <Heart className="w-5 h-5 text-primary" />
          Hypertension Clinical Reference
        </h1>
        <p className="text-sm text-muted-foreground">
          Point-of-care clinical cards covering secondary HTN workup, treatment guide, and hypertensive emergencies
        </p>
      </div>

      {/* Tab navigation */}
      <div className="flex flex-wrap items-center gap-2">
        {CARD_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveCard(tab.id)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeCard === tab.id
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ───── CARD 1: SECONDARY HTN ───── */}
      {activeCard === "secondary" && (
        <div className="space-y-5">
          {/* BP Classification */}
          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Gauge className="h-4 w-4" />
                BP Classification (ACC/AHA 2025)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                {BP_CLASSIFICATION.map((bpc) => (
                  <div key={bpc.label} className="p-2.5 rounded-lg bg-muted/40 text-center border border-border/30">
                    <p className={`text-sm font-bold ${bpc.color}`}>{bpc.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      SBP {bpc.sbp}
                    </p>
                    <p className="text-xs text-muted-foreground">DBP {bpc.dbp}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Red Flags */}
          <Card className="border-rose-500/30 bg-rose-500/5">
            <CardHeader className="pb-1">
              <CardTitle className="text-base flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-4 w-4" />
                When to Suspect Secondary HTN
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {RED_FLAGS.map((rf) => (
                  <div key={rf.flag} className="flex items-start gap-2 text-sm p-1.5 rounded-md hover:bg-rose-500/5">
                    <span className="text-destructive mt-0.5 shrink-0">{rf.icon}</span>
                    <div>
                      <span className="font-medium">{rf.flag}</span>
                      {rf.detail && <p className="text-xs text-muted-foreground mt-0.5">{rf.detail}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* CHARLES Mnemonic */}
          <Card className="border-blue-500/30 bg-blue-500/5">
            <CardHeader className="pb-1">
              <CardTitle className="text-base flex items-center gap-2 text-blue-400">
                <Brain className="h-4 w-4" />
                CHARLES Mnemonic — Causes of Secondary HTN
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
                {CHARLES_MNEMONIC.map((m) => (
                  <div key={m.letter} className="p-2 rounded bg-blue-500/10 border border-blue-500/20">
                    <span className="font-bold text-blue-400">{m.letter}</span> — {m.stands}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 5-Step Workup */}
          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Search className="h-4 w-4" />
                Condition-Specific Workup Table
              </CardTitle>
            </CardHeader>
  
          </Card>

          {/* Detailed Workup Table */}
          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Stethoscope className="h-4 w-4" />
                Condition-Specific Workup
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="min-w-[150px]">Condition</TableHead>
                    <TableHead className="min-w-[180px]">Required</TableHead>
                    <TableHead className="min-w-[180px]">Recommended</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {SECONDARY_WORKUP.map((cat) => (
                    <TableRow key={cat.category}>
                      <TableCell className="font-medium">{cat.category}</TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {cat.tests.filter(t => t.required).map((t) => (
                            <Badge key={t.name} variant="secondary" className="text-xs mr-1 bg-purple-500/15 text-purple-400 border-purple-500/30">
                              {t.name}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {cat.tests.filter(t => !t.required).map((t) => (
                            <Badge key={t.name} variant="outline" className="text-xs mr-1 bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
                              {t.name}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Cushing's — 1 mg overnight DST interpretation */}
          <DstInterpretationPanel />
        </div>
      )}

      {/* ───── CARD 2: TREATMENT GUIDE ───── */}
      {activeCard === "treatment" && (
        <div className="space-y-5">
          {/* Combination Therapy */}
          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Heart className="h-4 w-4" />
                Combination Therapy
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Combination</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {COMBINATION_TABLE.map((c) => (
                    <TableRow key={c.combo}>
                      <TableCell className="font-medium">{c.combo}</TableCell>
                      <TableCell className="text-center">
                        {c.safe ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-400 inline" />
                        ) : (
                          <XCircle className="h-4 w-4 text-destructive inline" />
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{c.note}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search drugs..."
              value={searchDrug}
              onChange={(e) => setSearchDrug(e.target.value)}
              className="w-full h-10 pl-9 pr-3 rounded-lg border border-input bg-background text-sm"
            />
          </div>

          {/* Drug profiles grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {(searchDrug
              ? ANTIHYPERTENSIVE_DRUGS.filter(
                  (d) =>
                    d.name.toLowerCase().includes(searchDrug.toLowerCase()) ||
                    d.class.toLowerCase().includes(searchDrug.toLowerCase())
                )
              : ANTIHYPERTENSIVE_DRUGS
            ).map((drug) => (
              <Card key={drug.name} className="border-l-4" style={{ borderLeftColor: accent }}>
                <CardHeader className="pb-1">
                  <div className="flex items-start justify-between gap-1">
                    <div>
                      <CardTitle className="text-sm font-bold">{drug.name}</CardTitle>
                      <p className="text-xs text-muted-foreground">{drug.class}</p>
                    </div>
                    <Badge variant="outline" className="shrink-0 text-xs">{drug.dosing}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="text-xs space-y-2">
                  <p className="text-muted-foreground">{drug.pearls}</p>
                  {drug.caution && (
                    <p className="flex items-start gap-1 text-warning">
                      <AlertTriangle className="h-3 w-3 mt-0.5 shrink-0" />
                      <span>{drug.caution}</span>
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* IV Agents */}
          <Card className="border-primary/30 bg-primary/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Activity className="h-4 w-4" />
                IV Agents for Hypertensive Crisis
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Drug</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Dosing</TableHead>
                    <TableHead>Clinical Pearls</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {IV_AGENTS.map((d) => (
                    <TableRow key={d.name}>
                      <TableCell className="font-medium">{d.name}</TableCell>
                      <TableCell className="text-xs">{d.class}</TableCell>
                      <TableCell className="text-xs font-mono">{d.dosing}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{d.pearls}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ───── CARD 3: HYPERTENSIVE EMERGENCIES ───── */}
      {activeCard === "emergencies" && (
        <div className="space-y-5">
          <p className="text-xs text-muted-foreground">
            Scenario-specific management algorithms for acute hypertensive crises with timelines, BP targets, preferred drugs, and agents to avoid.
          </p>

          <div className="space-y-4">
            {EMERGENCIES.map((em) => (
              <Card key={em.scenario} className={`border-l-4 ${
                em.scenario.includes("Aortic Dissection") || em.scenario.includes("Eclampsia")
                  ? "border-rose-500" 
                  : em.scenario.includes("Encephalopathy") || em.scenario.includes("Stroke")
                  ? "border-amber-500"
                  : "border-primary"
              }`}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Activity className="h-4 w-4 shrink-0" />
                    {em.scenario}
                    <Badge className="ml-auto shrink-0 text-xs" variant="outline">
                      {em.timeline}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs text-muted-foreground">Target:</span>
                    <Badge variant="secondary" className="text-xs">{em.target}</Badge>
                  </div>

                  <div className="space-y-1">
                    <p className="text-xs font-medium flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3 text-emerald-400" /> Preferred
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {em.preferred.map((d) => (
                        <Badge key={d} className="text-xs bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
                          {d}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <p className="text-xs font-medium flex items-center gap-1">
                      <Ban className="h-3 w-3 text-destructive" /> Avoid
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {em.avoid.map((d) => (
                        <Badge key={d} variant="destructive" className="text-xs">
                          {d}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <Alert className="bg-muted/30 border-border/50">
                    <Info className="h-3 w-3" />
                    <AlertDescription className="text-xs">{em.notes}</AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
