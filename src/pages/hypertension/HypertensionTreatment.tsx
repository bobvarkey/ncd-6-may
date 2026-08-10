import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Heart, Wine, Pill, Activity, Zap, Moon, TestTube, Stethoscope, FlaskConical,
  Droplets, Syringe, Info, AlertTriangle, Ban,
  GitBranch, ChevronRight, ChevronDown, RotateCcw, Gauge, CheckCircle, Brain, Baby,
} from "lucide-react";
import HtnAlgorithmFlowchart from "@/components/hypertension/HtnAlgorithmFlowchart";
import ImageLink from "@/components/ImageLink";
import { AbbreviationHover } from "@/components/AbbreviationHover";
const AbbrText = ({ text }: { text: string }) => <AbbreviationHover term={text}>{text}</AbbreviationHover>;
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Separator } from "@/components/ui/separator";

// Category colors for hypertension (orange theme)
const categoryColors = {
  accent: "#fb923c",
  bg: "rgba(251,146,60,0.12)",
  border: "rgba(251,146,60,0.2)",
};

// ===== TREATMENT ALGORITHM =====
interface AlgorithmNode {
  id: string;
  question: string;
  type: "decision" | "recommendation";
  options?: { label: string; nextId: string }[];
  recommendation?: {
    firstLine: string[];
    secondLine?: string[];
    avoid?: string[];
    notes?: string;
  };
}

const algorithmNodes: AlgorithmNode[] = [
  {
    id: "start",
    question: "What is the primary comorbidity?",
    type: "decision",
    options: [
      { label: "Diabetes (with or without proteinuria)", nextId: "diabetes" },
      { label: "CKD (GFR < 60 or proteinuria)", nextId: "ckd" },
      { label: "Heart Failure", nextId: "hf_type" },
      { label: "Coronary Artery Disease", nextId: "cad" },
      { label: "Stroke / Cerebrovascular Disease", nextId: "stroke" },
      { label: "Pregnancy", nextId: "pregnancy" },
      { label: "Hyperuricemia / Gout", nextId: "gout" },
      { label: "No major comorbidity", nextId: "uncomplicated" },
    ],
  },
  {
    id: "diabetes",
    question: "Diabetes — Is there proteinuria/albuminuria?",
    type: "decision",
    options: [
      { label: "Yes — Diabetic nephropathy / proteinuria", nextId: "diabetes_proteinuria" },
      { label: "No — Diabetes without nephropathy", nextId: "diabetes_no_proteinuria" },
    ],
  },
  {
    id: "diabetes_proteinuria",
    question: "",
    type: "recommendation",
    recommendation: {
      firstLine: ["ACEi (Ramipril / Enalapril)", "OR ARB (Losartan / Telmisartan)"],
      secondLine: ["Add CCB (Amlodipine)", "Add Thiazide-like (Chlorthalidone)"],
      avoid: ["Dual RAAS blockade (ACEi + ARB)", "Beta-blockers (mask hypoglycemia — use with caution)"],
      notes: "ACEi/ARB are renoprotective and reduce proteinuria progression. RENAAL & IDNT trials support ARB in type 2 diabetic nephropathy. Target BP < 130/80 mmHg.",
    },
  },
  {
    id: "diabetes_no_proteinuria",
    question: "",
    type: "recommendation",
    recommendation: {
      firstLine: ["ACEi / ARB", "CCB (Amlodipine)", "Thiazide-like diuretic (Chlorthalidone)"],
      secondLine: ["Combination of above classes"],
      avoid: ["Dual RAAS blockade", "High-dose thiazides (worsen glucose control)"],
      notes: "Any first-line agent is acceptable. ACEi/ARB preferred if microalbuminuria develops. Monitor glucose with thiazides. Target BP < 130/80 mmHg.",
    },
  },
  {
    id: "ckd",
    question: "CKD — Is there significant proteinuria (>300 mg/day)?",
    type: "decision",
    options: [
      { label: "Yes — Proteinuric CKD", nextId: "ckd_proteinuria" },
      { label: "No — Non-proteinuric CKD", nextId: "ckd_no_proteinuria" },
    ],
  },
  {
    id: "ckd_proteinuria",
    question: "",
    type: "recommendation",
    recommendation: {
      firstLine: ["ACEi (Ramipril)", "OR ARB (Losartan / Telmisartan)"],
      secondLine: ["Loop diuretic (Furosemide) if GFR < 30", "CCB (Amlodipine)"],
      avoid: ["Dual RAAS blockade", "Thiazides alone if GFR < 30 (ineffective)", "K-sparing diuretics if GFR < 30"],
      notes: "ACEi/ARB reduce proteinuria and slow CKD progression. Switch from thiazide to loop diuretic when GFR < 30. Monitor K+ closely with ACEi/ARB. Target BP < 130/80 mmHg.",
    },
  },
  {
    id: "ckd_no_proteinuria",
    question: "",
    type: "recommendation",
    recommendation: {
      firstLine: ["ACEi / ARB", "CCB (Amlodipine)", "Thiazide-like (if GFR > 30)"],
      secondLine: ["Loop diuretic (if GFR < 30)", "Add second agent from first-line"],
      avoid: ["Dual RAAS blockade", "K-sparing diuretics if GFR < 30"],
      notes: "No single class clearly superior without proteinuria. Choose based on other comorbidities. Adjust doses per GFR. Target BP < 130/80 mmHg.",
    },
  },
  {
    id: "hf_type",
    question: "Heart Failure — What type?",
    type: "decision",
    options: [
      { label: "HFrEF (EF ≤ 40%)", nextId: "hfref" },
      { label: "HFpEF (EF > 40%)", nextId: "hfpef" },
    ],
  },
  {
    id: "hfref",
    question: "",
    type: "recommendation",
    recommendation: {
      firstLine: [
        "ACEi / ARB (Ramipril, Enalapril, Losartan)",
        "Beta-blocker (Carvedilol, Metoprolol Succinate)",
        "Aldosterone antagonist (Spironolactone 25 mg)",
      ],
      secondLine: ["Loop diuretic (Furosemide) for volume overload"],
      avoid: ["Non-DHP CCBs (Verapamil, Diltiazem — negative inotropes)", "Moxonidine (MOXCON trial — increased mortality in HF)"],
      notes: "Guideline-directed medical therapy (GDMT): ACEi/ARB + Beta-blocker + MRA form the cornerstone. Titrate to target doses. RALES trial: Spironolactone reduces mortality by 30% in HFrEF.",
    },
  },
  {
    id: "hfpef",
    question: "",
    type: "recommendation",
    recommendation: {
      firstLine: ["Diuretics for volume control (Furosemide / Thiazide)", "Manage comorbidities (HTN, AF, CAD)"],
      secondLine: ["ACEi / ARB", "Beta-blocker for rate control if AF", "Spironolactone (may reduce hospitalizations)"],
      avoid: ["No proven mortality-reducing therapy yet"],
      notes: "Focus on symptom management, volume control, and comorbidity treatment. TOPCAT trial suggested benefit of spironolactone in some HFpEF populations. Target BP < 130/80 mmHg.",
    },
  },
  {
    id: "cad",
    question: "",
    type: "recommendation",
    recommendation: {
      firstLine: [
        "Beta-blocker (Metoprolol, Carvedilol) — especially post-MI",
        "ACEi (Ramipril) — HOPE trial benefit",
      ],
      secondLine: ["CCB (Amlodipine) if beta-blocker contraindicated or for angina", "Thiazide diuretic for additional BP control"],
      avoid: ["Short-acting nifedipine (reflex tachycardia)", "Hydralazine monotherapy (reflex tachycardia)"],
      notes: "Beta-blockers reduce reinfarction and mortality post-MI. Ramipril shown to reduce CV events in HOPE trial. Amlodipine is safe in stable CAD (CAMELOT trial). Target BP < 130/80 mmHg.",
    },
  },
  {
    id: "stroke",
    question: "",
    type: "recommendation",
    recommendation: {
      firstLine: ["ACEi + Thiazide-like diuretic (Perindopril + Indapamide — PROGRESS trial)", "ARB (Telmisartan — PROFESS trial)"],
      secondLine: ["CCB (Amlodipine)", "Any first-line agent achieving target BP"],
      avoid: ["Aggressive BP lowering in acute stroke (within 72 hours)"],
      notes: "BP reduction is the most important factor for secondary stroke prevention. PROGRESS trial: ACEi + diuretic reduced stroke recurrence by 43%. Target BP < 130/80 mmHg after stabilization.",
    },
  },
  {
    id: "pregnancy",
    question: "",
    type: "recommendation",
    recommendation: {
      firstLine: ["Methyldopa (Aldomet) — safest, most studied", "Labetalol", "Nifedipine Extended Release"],
      secondLine: ["Hydralazine (IV for severe hypertension / eclampsia)"],
      avoid: ["ACEi — TERATOGENIC (all trimesters)", "ARB — TERATOGENIC", "Spironolactone — anti-androgenic effects", "Atenolol — fetal growth restriction"],
      notes: "Methyldopa is the gold standard for chronic HTN in pregnancy. Labetalol is preferred for acute severe hypertension. ACEi/ARB are ABSOLUTELY CONTRAINDICATED — cause renal agenesis, oligohydramnios. Target BP < 140/90 mmHg (CHIPS trial).",
    },
  },
  {
    id: "uncomplicated",
    question: "Uncomplicated Hypertension — Age group?",
    type: "decision",
    options: [
      { label: "Age < 55 (or any age South Asian descent)", nextId: "young_uncomplicated" },
      { label: "Age ≥ 55 (or Black African/Caribbean descent)", nextId: "older_uncomplicated" },
    ],
  },
  {
    id: "young_uncomplicated",
    question: "",
    type: "recommendation",
    recommendation: {
      firstLine: ["ACEi (Ramipril)", "OR ARB (Losartan / Telmisartan)"],
      secondLine: ["Add CCB (Amlodipine)", "Then add Thiazide-like (Chlorthalidone)"],
      avoid: ["Beta-blockers as first-line for uncomplicated HTN (no longer recommended)"],
      notes: "NICE/BHS ACD algorithm: Step 1 = A (ACEi/ARB). Step 2 = A + C or A + D. Step 3 = A + C + D. Step 4 (resistant) = Add Spironolactone 25 mg. Target BP < 140/90 mmHg (< 130/80 if high risk).",
    },
  },
  {
    id: "older_uncomplicated",
    question: "",
    type: "recommendation",
    recommendation: {
      firstLine: ["CCB (Amlodipine)", "OR Thiazide-like diuretic (Chlorthalidone)"],
      secondLine: ["Add ACEi / ARB", "Then triple therapy (A + C + D)"],
      avoid: ["Beta-blockers as first-line (less effective for stroke prevention in elderly)"],
      notes: "CCB or thiazide preferred in older and Black patients due to lower renin states. ALLHAT trial supports thiazide-like diuretics. Step 4 (resistant): Add Spironolactone (PATHWAY-2 trial). Target BP < 140/90 mmHg.",
    },
  },
  {
    id: "gout",
    question: "",
    type: "recommendation",
    recommendation: {
      firstLine: ["Losartan (Uricosuric)", "CCB (Amlodipine)", "MRA (Neutral uric acid effect)"],
      secondLine: ["ARB (other than losartan)", "ACEi"],
      avoid: ["Thiazide diuretics", "Loop diuretics"],
      notes: "MRAs (Spironolactone, Eplerenone, Finerenone) have a neutral effect on serum uric acid, unlike thiazides or loop diuretics which can trigger gout flares. Losartan has a beneficial uricosuric effect.",
    },
  },
];

// ===== POTENCY TABLE =====
type Potency = "Very high" | "High" | "Moderate" | "Moderate to low" | "Low to moderate" | "Low";

interface DrugRow {
  potency: Potency;
  drugClass: string;
  examples: string;
  startingDose: string;
  bestUse: string;
}

const drugData: DrugRow[] = [
  {
    potency: "Very high",
    drugClass: "Direct vasodilators",
    examples: "Hydralazine, dihydralazine, minoxidil",
    startingDose: "Hydralazine 25 mg BID; dihydralazine 12.5 mg TID; minoxidil 2.5 mg daily",
    bestUse: "Resistant hypertension or special situations, usually combined with other agents due to adverse-effect burden.",
  },
  {
    potency: "High",
    drugClass: "Mineralocorticoid receptor antagonists",
    examples: "Spironolactone, eplerenone",
    startingDose: "Spironolactone 25 mg daily; eplerenone 50 mg daily",
    bestUse: "Resistant hypertension, primary aldosteronism, heart failure.",
  },
  {
    potency: "High",
    drugClass: "Thiazide / thiazide-like diuretics",
    examples: "Chlorthalidone, indapamide, hydrochlorothiazide",
    startingDose: "Chlorthalidone 12.5 mg daily; indapamide 1.25 mg daily; HCTZ 12.5–25 mg daily",
    bestUse: "First-line for uncomplicated HTN; thiazide-like agents often favored over HCTZ.",
  },
  {
    potency: "High",
    drugClass: "Dihydropyridine CCBs",
    examples: "Amlodipine, felodipine, nifedipine ER",
    startingDose: "Amlodipine 2.5–5 mg daily; felodipine 2.5–5 mg daily; nifedipine ER 30 mg daily",
    bestUse: "First-line, especially older adults, isolated systolic HTN, and combination regimens.",
  },
  {
    potency: "Moderate",
    drugClass: "ACE inhibitors",
    examples: "Lisinopril, enalapril, ramipril",
    startingDose: "Lisinopril 10 mg daily; enalapril 5 mg daily; ramipril 2.5 mg daily",
    bestUse: "CKD, diabetes with albuminuria, coronary disease, proteinuric states.",
  },
  {
    potency: "Moderate",
    drugClass: "ARBs",
    examples: "Losartan, valsartan, telmisartan",
    startingDose: "Losartan 25–50 mg daily; valsartan 80 mg daily; telmisartan 20 mg daily",
    bestUse: "Similar to ACEi when cough or ACE intolerance is an issue.",
  },
  {
    potency: "Moderate",
    drugClass: "Loop diuretics",
    examples: "Furosemide, torsemide, bumetanide",
    startingDose: "Furosemide 20–40 mg daily; torsemide 5–10 mg daily; bumetanide 0.5–1 mg daily",
    bestUse: "More useful for CKD, edema, heart failure, or volume overload than routine HTN.",
  },
  {
    potency: "Moderate to low",
    drugClass: "Central alpha-2 agonists",
    examples: "Clonidine, methyldopa, guanfacine",
    startingDose: "Clonidine 0.1 mg BID; methyldopa 250 mg BID; guanfacine 0.5–1 mg daily",
    bestUse: "Refractory HTN; methyldopa in pregnancy. Limited by sedation and rebound.",
  },
  {
    potency: "Low to moderate",
    drugClass: "Beta-blockers",
    examples: "Metoprolol, bisoprolol, atenolol, carvedilol, labetalol",
    startingDose: "Metoprolol 50 mg daily/BID; bisoprolol 2.5 mg daily; atenolol 25 mg daily",
    bestUse: "CAD, arrhythmia, post-MI, heart failure, or pregnancy (labetalol) — not uncomplicated HTN alone.",
  },
  {
    potency: "Low",
    drugClass: "Alpha-1 blockers",
    examples: "Doxazosin, terazosin, prazosin",
    startingDose: "Doxazosin 1 mg daily; terazosin 1 mg daily; prazosin 1–2 mg BID",
    bestUse: "Add-on therapy, especially with concomitant BPH.",
  },
];

const getPotencyColor = (potency: Potency): string => {
  switch (potency) {
    case "Very high":
      return "bg-destructive/20 text-destructive border-destructive/30";
    case "High":
      return "bg-warning/100/20 text-warning border-warning/30";
    case "Moderate":
      return "bg-warning/100/20 text-amber-700 border-amber-500/30";
    case "Moderate to low":
    case "Low to moderate":
      return "bg-warning/20 text-warning border-yellow-500/30";
    case "Low":
      return "bg-muted text-muted-foreground border-border";
    default:
      return "bg-muted text-muted-foreground border-border";
  }
};

// ===== STROKE PREVENTION PROTOCOL =====
const strokeProtocol = {
  title: "Recurrent Stroke Prevention",
  background: "After ischemic stroke or TIA, BP reduction is the most effective intervention for preventing recurrence.",
  keyTrials: [
    { name: "PROGRESS", result: "ACEi + diuretic reduced stroke recurrence by 43%" },
    { name: "PROFESS", result: "Telmisartan (ARB) showed benefit in secondary prevention" },
    { name: "SP S3", result: "Target SBP < 130 mmHg reduces recurrent stroke risk" },
  ],
  recommendations: [
    "Start antihypertensive therapy within 24 hours if BP > 140/90 and patient stable",
    "Target BP < 130/80 mmHg for secondary stroke prevention",
    "Preferred: ACE inhibitor + Thiazide-like diuretic combination",
    "Alternative: ARB-based regimen (Telmisartan)",
    "Avoid aggressive lowering in acute stroke (< 72 hours) unless BP > 220/120",
  ],
  cautions: [
    "If thrombolysis planned: BP must be < 185/110 before treatment",
    "After thrombolysis: Maintain BP < 180/105 for 24 hours",
    "Consider permissive hypertension in acute stroke if no thrombolysis",
  ],
};

// Secondary HTN Workup Checklist
interface ChecklistItem {
  id: string;
  condition: string;
  tests: string[];
  icon: React.ReactNode;
  category: 'endocrine' | 'renal' | 'lifestyle' | 'vascular' | 'gout' | 'other';
}

const checklistItems: ChecklistItem[] = [
  {
    id: 'hyperuricemia-gout',
    condition: 'Hyperuricemia / Gout',
    tests: ['Serum uric acid level', 'Synovial fluid analysis (if flare)', 'Renal function (eGFR)'],
    icon: <AlertTriangle className="h-5 w-5" />,
    category: 'gout'
  },
  {
    id: 'primary-aldosteronism',
    condition: 'Primary Aldosteronism',
    tests: ['Aldosterone/renin ratio', 'Saline suppression test', 'Adrenal CT/MRI'],
    icon: <Droplets className="h-5 w-5" />,
    category: 'endocrine'
  },
  {
    id: 'sleep-apnea',
    condition: 'Obstructive Sleep Apnea',
    tests: ['Sleep study (polysomnography)', 'Epworth sleepiness scale', 'Overnight oximetry'],
    icon: <Moon className="h-5 w-5" />,
    category: 'other'
  },
  {
    id: 'alcohol-use',
    condition: 'Alcohol Use',
    tests: ['Detailed alcohol history', 'AUDIT questionnaire', 'GGT, AST, ALT levels'],
    icon: <Wine className="h-5 w-5" />,
    category: 'lifestyle'
  },
  {
    id: 'nsaid-use',
    condition: 'NSAID Use',
    tests: ['Medication history review', 'OTC medication assessment', 'Drug interaction check'],
    icon: <Pill className="h-5 w-5" />,
    category: 'lifestyle'
  },
  {
    id: 'renovascular-disease',
    condition: 'Renovascular Disease',
    tests: ['Renal ultrasound', 'Serum creatinine', 'BUN', 'Urinalysis'],
    icon: <FlaskConical className="h-5 w-5" />,
    category: 'renal'
  },
  {
    id: 'renal-artery-stenosis',
    condition: 'Renal Artery Stenosis',
    tests: ['Renal artery Doppler', 'CT angiography', 'MR angiography', 'ACE inhibitor test'],
    icon: <Activity className="h-5 w-5" />,
    category: 'vascular'
  },
  {
    id: 'thyroid-disorders',
    condition: 'Thyroid Disorders',
    tests: ['TSH', 'Free T3', 'Free T4', 'Thyroid antibodies'],
    icon: <Zap className="h-5 w-5" />,
    category: 'endocrine'
  },
  {
    id: 'cushings',
    condition: "Cushing's Syndrome",
    tests: ['24-hour urine cortisol', 'Dexamethasone suppression test', 'Late-night salivary cortisol'],
    icon: <TestTube className="h-5 w-5" />,
    category: 'endocrine'
  },
  {
    id: 'pheochromocytoma',
    condition: 'Pheochromocytoma / Paraganglioma',
    tests: ['Plasma free metanephrines', '24-hour urinary metanephrines', 'Adrenal CT/MRI', 'Genetic testing if indicated'],
    icon: <Syringe className="h-5 w-5" />,
    category: 'endocrine'
  },
  {
    id: 'substance-abuse',
    condition: 'Substance Abuse & Polycythemia',
    tests: ['Urine toxicology screen', 'Complete blood count', 'Hematocrit', 'EPO levels'],
    icon: <Stethoscope className="h-5 w-5" />,
    category: 'other'
  }
];

const checklistCategoryColors = {
  endocrine: 'bg-primary/10 text-primary border-primary/20',
  renal: 'bg-accent/10 text-accent border-accent/20',
  lifestyle: 'bg-success/10 text-success border-success/20',
  vascular: 'bg-destructive/10 text-destructive border-destructive/20',
  other: 'bg-muted/50 text-muted-foreground border-border'
};

// Medication Dosing Reference
interface RenalDosing {
  gfrRange: string;
  recommendation: string;
}

interface MedicationDose {
  route: 'IV' | 'Oral';
  dosing: string[];
  notes?: string;
}

interface DrugInteraction {
  drug: string;
  severity: 'contraindicated' | 'major' | 'moderate';
  effect: string;
  management: string;
}

interface LactationGuidance {
  status: 'avoid' | 'caution' | 'compatible';
  summary: string;
  details: string[];
}

interface Medication {
  name: string;
  category: string;
  doses: MedicationDose[];
  renalDosing?: RenalDosing[];
  monitoring?: string[];
  redFlags?: string[];
  contraindications?: string[];
  lactation?: LactationGuidance;
  interactions?: DrugInteraction[];
}

const medications: Medication[] = [
  // ACE Inhibitors
  {
    name: 'Enalapril',
    category: 'ACE Inhibitor',
    doses: [
      { route: 'Oral', dosing: ['Initial: 2.5-5 mg daily', 'Maintenance: 10-40 mg/day in 1-2 divided doses'] },
      { route: 'IV', dosing: ['1.25 mg over 5 minutes q6h', 'May increase to 5 mg/dose'] }
    ],
    renalDosing: [
      { gfrRange: '> 30 mL/min', recommendation: 'No adjustment' },
      { gfrRange: '10-30 mL/min', recommendation: 'Start 2.5 mg daily, titrate cautiously' },
      { gfrRange: '< 10 mL/min', recommendation: 'Start 2.5 mg on dialysis days' }
    ]
  },
  {
    name: 'Lisinopril',
    category: 'ACE Inhibitor',
    doses: [
      { route: 'Oral', dosing: ['Initial: 5-10 mg daily', 'Maintenance: 20-40 mg daily'] }
    ],
    renalDosing: [
      { gfrRange: '> 30 mL/min', recommendation: 'No adjustment' },
      { gfrRange: '10-30 mL/min', recommendation: 'Start 2.5-5 mg daily' },
      { gfrRange: '< 10 mL/min', recommendation: 'Start 2.5 mg daily, monitor K+' }
    ]
  },
  {
    name: 'Ramipril',
    category: 'ACE Inhibitor',
    doses: [
      { route: 'Oral', dosing: ['Initial: 1.25-2.5 mg daily', 'Maintenance: 5-10 mg daily', 'Max: 20 mg daily'] }
    ],
    renalDosing: [
      { gfrRange: '> 30 mL/min', recommendation: 'No adjustment' },
      { gfrRange: '< 30 mL/min', recommendation: 'Start 1.25 mg daily, titrate slowly' }
    ]
  },
  {
    name: 'Perindopril',
    category: 'ACE Inhibitor',
    doses: [
      { route: 'Oral', dosing: ['Initial: 4 mg daily', 'Maintenance: 4-8 mg daily', 'Max: 8 mg daily'] }
    ],
    renalDosing: [
      { gfrRange: '> 30 mL/min', recommendation: 'No adjustment' },
      { gfrRange: '< 30 mL/min', recommendation: 'Start 2 mg daily' }
    ]
  },
  // ARBs
  {
    name: 'Losartan',
    category: 'ARB',
    doses: [
      { route: 'Oral', dosing: ['Initial: 50 mg daily', 'Maintenance: 50-100 mg daily', 'Max: 100 mg daily'] }
    ],
    renalDosing: [
      { gfrRange: '> 30 mL/min', recommendation: 'No adjustment' },
      { gfrRange: '< 30 mL/min', recommendation: 'Use with caution; monitor K+' }
    ]
  },
  {
    name: 'Valsartan',
    category: 'ARB',
    doses: [
      { route: 'Oral', dosing: ['Initial: 80-160 mg daily', 'Maintenance: 160-320 mg daily', 'Max: 320 mg daily'] }
    ],
    renalDosing: [
      { gfrRange: '> 30 mL/min', recommendation: 'No adjustment' },
      { gfrRange: '< 30 mL/min', recommendation: 'Use with caution' }
    ]
  },
  {
    name: 'Telmisartan',
    category: 'ARB',
    doses: [
      { route: 'Oral', dosing: ['Initial: 40 mg daily', 'Maintenance: 40-80 mg daily', 'Max: 80 mg daily'] }
    ],
    renalDosing: [
      { gfrRange: 'All GFR', recommendation: 'No adjustment (hepatically metabolized)' }
    ]
  },
  {
    name: 'Olmesartan',
    category: 'ARB',
    doses: [
      { route: 'Oral', dosing: ['Initial: 20 mg daily', 'Maintenance: 20-40 mg daily', 'Max: 40 mg daily'] }
    ],
    renalDosing: [
      { gfrRange: '> 20 mL/min', recommendation: 'No adjustment' },
      { gfrRange: '< 20 mL/min', recommendation: 'Use with caution' }
    ]
  },
  // Beta Blockers
  {
    name: 'Metoprolol',
    category: 'Beta-Blocker',
    doses: [
      { route: 'Oral', dosing: ['Initial: 25-50 mg BID', 'Maintenance: 100-200 mg/day', 'Max: 400 mg/day'] },
      { route: 'IV', dosing: ['2.5-5 mg over 2 minutes', 'May repeat q5-10 min', 'Max: 15 mg'] }
    ],
    renalDosing: [
      { gfrRange: 'All GFR', recommendation: 'No adjustment needed' }
    ]
  },
  {
    name: 'Atenolol',
    category: 'Beta-Blocker',
    doses: [
      { route: 'Oral', dosing: ['Initial: 25-50 mg daily', 'Maintenance: 50-100 mg daily', 'Max: 100 mg daily'] }
    ],
    renalDosing: [
      { gfrRange: '> 50 mL/min', recommendation: 'No adjustment' },
      { gfrRange: '10-50 mL/min', recommendation: 'Reduce dose by 50%' },
      { gfrRange: '< 10 mL/min', recommendation: 'Reduce dose by 75%' }
    ]
  },
  {
    name: 'Carvedilol',
    category: 'Beta-Blocker',
    doses: [
      { route: 'Oral', dosing: ['Initial: 6.25 mg BID', 'Maintenance: 12.5-25 mg BID', 'Max: 50 mg/day'] }
    ],
    renalDosing: [
      { gfrRange: 'All GFR', recommendation: 'Use with caution in severe CKD' }
    ]
  },
  {
    name: 'Labetalol',
    category: 'Beta-Blocker',
    doses: [
      { route: 'Oral', dosing: ['Initial: 100 mg BID', 'Maintenance: 200-400 mg BID', 'Max: 1200 mg/day'] },
      { route: 'IV', dosing: ['10-20 mg over 2 minutes', 'May double q10 min', 'Max: 300 mg total'] }
    ],
    renalDosing: [
      { gfrRange: 'All GFR', recommendation: 'Use with caution' }
    ]
  },
  {
    name: 'Nebivolol',
    category: 'Beta-Blocker',
    doses: [
      { route: 'Oral', dosing: ['Initial: 2.5 mg daily', 'Maintenance: 5-10 mg daily', 'Max: 10 mg daily'] }
    ],
    renalDosing: [
      { gfrRange: '> 30 mL/min', recommendation: 'No adjustment' },
      { gfrRange: '< 30 mL/min', recommendation: 'Use with caution' }
    ]
  },
  // CCBs
  {
    name: 'Amlodipine',
    category: 'CCB (DHP)',
    doses: [
      { route: 'Oral', dosing: ['Initial: 2.5-5 mg daily', 'Maintenance: 5-10 mg daily', 'Max: 10 mg daily'] }
    ],
    renalDosing: [
      { gfrRange: 'All GFR', recommendation: 'No adjustment needed' }
    ]
  },
  {
    name: 'Nifedipine',
    category: 'CCB (DHP)',
    doses: [
      { route: 'Oral', dosing: ['ER: 30-60 mg daily', 'Max: 90 mg/day'] }
    ],
    renalDosing: [
      { gfrRange: 'All GFR', recommendation: 'No adjustment needed' }
    ]
  },
  {
    name: 'Diltiazem',
    category: 'CCB (Non-DHP)',
    doses: [
      { route: 'Oral', dosing: ['ER: 120-240 mg daily', 'Max: 480 mg/day'] }
    ],
    renalDosing: [
      { gfrRange: 'All GFR', recommendation: 'Use with caution in severe CKD' }
    ]
  },
  {
    name: 'Azelnidipine',
    category: 'CCB (DHP)',
    doses: [
      { route: 'Oral', dosing: ['Initial: 8 mg daily', 'Maintenance: 8-16 mg daily', 'Max: 16 mg daily'] }
    ],
    renalDosing: [
      { gfrRange: 'All GFR', recommendation: 'No adjustment needed' }
    ]
  },
  // Diuretics
  {
    name: 'Hydrochlorothiazide',
    category: 'Thiazide',
    doses: [
      { route: 'Oral', dosing: ['Initial: 12.5-25 mg daily', 'Maintenance: 25-50 mg daily', 'Max: 100 mg/day'] }
    ],
    renalDosing: [
      { gfrRange: '> 30 mL/min', recommendation: 'Effective' },
      { gfrRange: '< 30 mL/min', recommendation: 'Less effective; consider loop diuretic' }
    ]
  },
  {
    name: 'Indapamide',
    category: 'Thiazide-like',
    doses: [
      { route: 'Oral', dosing: ['Initial: 1.25 mg daily', 'Maintenance: 1.25-2.5 mg daily', 'Max: 2.5 mg daily'] }
    ],
    renalDosing: [
      { gfrRange: '> 30 mL/min', recommendation: 'No adjustment' },
      { gfrRange: '< 30 mL/min', recommendation: 'Use with caution' }
    ]
  },
  {
    name: 'Furosemide',
    category: 'Loop Diuretic',
    doses: [
      { route: 'Oral', dosing: ['Initial: 20-40 mg daily', 'Maintenance: 40-80 mg daily', 'Max: 160 mg/day'] },
      { route: 'IV', dosing: ['20-40 mg IV', 'May double q2h', 'Max: 200 mg/day'] }
    ],
    renalDosing: [
      { gfrRange: '> 30 mL/min', recommendation: 'No adjustment' },
      { gfrRange: '< 30 mL/min', recommendation: 'May need higher doses' }
    ]
  },
  {
    name: 'Torsemide',
    category: 'Loop Diuretic',
    doses: [
      { route: 'Oral', dosing: ['Initial: 5-10 mg daily', 'Maintenance: 10-20 mg daily', 'Max: 40 mg/day'] }
    ],
    renalDosing: [
      { gfrRange: 'All GFR', recommendation: 'No adjustment needed' }
    ]
  },
  {
    name: 'Spironolactone',
    category: 'MRA',
    doses: [
      { route: 'Oral', dosing: ['Initial: 12.5-25 mg daily', 'Maintenance: 25-50 mg daily', 'Max: 100 mg/day'] }
    ],
    renalDosing: [
      { gfrRange: '> 30 mL/min', recommendation: 'No adjustment' },
      { gfrRange: '< 30 mL/min', recommendation: 'Avoid; monitor K+' }
    ]
  }
];

export default function HypertensionTreatment() {
  const navigate = useNavigate();
  const [algorithmHistory, setAlgorithmHistory] = useState<string[]>(["start"]);
  const [potencyOpen, setPotencyOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("algorithm");

  const currentId = algorithmHistory[algorithmHistory.length - 1];
  const currentNode = algorithmNodes.find((n) => n.id === currentId);

  const selectAlgorithmOption = (nextId: string) => {
    setAlgorithmHistory((prev) => [...prev, nextId]);
  };

  const goBackAlgorithm = () => {
    if (algorithmHistory.length > 1) {
      setAlgorithmHistory((prev) => prev.slice(0, -1));
    }
  };

  const restartAlgorithm = () => setAlgorithmHistory(["start"]);

  const sections = [
    { id: "algorithm", label: "Algorithm", icon: "📋" },
    { id: "tamp-dcmi", label: "TAMP-DCMI", icon: "🛡️" },
    { id: "potency", label: "Potency", icon: "⚡" },
    { id: "stroke", label: "Stroke", icon: "🧠" },
    { id: "pregnancy", label: "Pregnancy", icon: "🤰" },
    { id: "emergencies", label: "Emergencies", icon: "🚨" },
    { id: "secondary", label: "Secondary HTN", icon: "🔬" },
    { id: "medications", label: "Medications", icon: "💊" },
  ];

  const scrollToSection = (id: string) => {
    setActiveSection(id);
    const el = document.getElementById(`htn-section-${id}`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="space-y-6">
      {/* Quick Navigation Tabs */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 pb-2 pt-2 -mx-4 px-4">
        <div className="flex flex-wrap gap-1.5">
          {sections.map((s) => (
            <button
              key={s.id}
              onClick={() => scrollToSection(s.id)}
              className={`px-3 py-1.5 text-xs rounded-full border transition-all whitespace-nowrap ${
                activeSection === s.id
                  ? "bg-primary text-primary-foreground border-primary shadow-sm"
                  : "bg-muted/50 text-muted-foreground border-border hover:border-primary/40 hover:text-foreground"
              }`}
            >
              {s.icon} {s.label}
            </button>
          ))}
        </div>
      </div>
      {/* TAMP-DCMI: Resistant HTN */}
      <Card id="htn-section-tamp-dcmi" className="border-2 border-warning/20 overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5" style={{ color: categoryColors.accent }} />
            <CardTitle className="text-lg">Stepwise Therapy for Resistant Hypertension — TAMP-DCMI</CardTitle>
          </div>
          <p className="text-xs text-muted-foreground">Mnemonic-based escalation guide (tap to open full size)</p>
        </CardHeader>
        <CardContent>
          <ImageLink imageId="tamp-dcmi" label="View TAMP-DCMI Resistant HTN Guide →" />
        </CardContent>
      </Card>

      {/* Treatment Algorithm */}
      <Card id="htn-section-algorithm" className="border-2 border-warning/20">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <GitBranch className="h-5 w-5" style={{ color: categoryColors.accent }} />
              <CardTitle className="text-lg">Treatment Algorithm</CardTitle>
            </div>
            {algorithmHistory.length > 1 && (
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={goBackAlgorithm}>
                  ← Back
                </Button>
                <Button variant="ghost" size="sm" onClick={restartAlgorithm}>
                  <RotateCcw className="h-4 w-4 mr-1" />
                  Restart
                </Button>
              </div>
            )}
          </div>
          <p className="text-xs text-muted-foreground">Evidence-based antihypertensive selection by comorbidity</p>
        </CardHeader>
        <CardContent>
          {/* Breadcrumb */}
          {algorithmHistory.length > 1 && (
            <div className="flex flex-wrap items-center gap-1 mb-4 text-xs text-muted-foreground">
              {algorithmHistory.map((id, i) => {
                const node = algorithmNodes.find((n) => n.id === id);
                if (!node || node.type !== "decision") return null;
                return (
                  <span key={i} className="flex items-center gap-1">
                    {i > 0 && <ChevronRight className="h-3 w-3" />}
                    <span className={i === algorithmHistory.length - 1 ? "font-semibold text-foreground" : ""}>
                      {node.question.substring(0, 30)}{node.question.length > 30 ? "..." : ""}
                    </span>
                  </span>
                );
              })}
            </div>
          )}

          {currentNode?.type === "decision" && (
            <div className="space-y-3">
              <h3 className="text-base font-semibold text-foreground">{currentNode.question}</h3>
              <div className="grid gap-2">
                {currentNode.options?.map((opt) => (
                  <button
                    key={opt.nextId}
                    onClick={() => selectAlgorithmOption(opt.nextId)}
                    className="text-left p-3 rounded-lg border-2 border-border hover:border-warning/50 hover:bg-warning/100/5 transition-all group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium group-hover:text-warning">{opt.label}</span>
                      <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-orange-500" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {currentNode?.type === "recommendation" && currentNode.recommendation && (
            <div className="space-y-4">
              {/* First Line */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Heart className="h-4 w-4" style={{ color: categoryColors.accent }} />
                  <Badge variant="outline" style={{ color: categoryColors.accent, borderColor: categoryColors.border }}>
                    First-Line
                  </Badge>
                </div>
                <ul className="space-y-1.5 ml-1">
                  {currentNode.recommendation.firstLine.map((drug, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: categoryColors.accent }} />
                      <span className="text-foreground"><AbbrText text={drug} /></span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Second Line */}
              {currentNode.recommendation.secondLine && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Activity className="h-4 w-4 text-muted-foreground" />
                    <Badge variant="outline" className="text-muted-foreground">Second-Line / Add-on</Badge>
                  </div>
                  <ul className="space-y-1.5 ml-1">
                    {currentNode.recommendation.secondLine.map((drug, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <div className="w-2 h-2 rounded-full bg-muted-foreground/50 mt-1.5 flex-shrink-0" />
                        <span className="text-foreground"><AbbrText text={drug} /></span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Avoid */}
              {currentNode.recommendation.avoid && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                    <Badge variant="outline" className="text-destructive border-destructive/30">Avoid / Caution</Badge>
                  </div>
                  <ul className="space-y-1.5 ml-1">
                    {currentNode.recommendation.avoid.map((drug, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <div className="w-2 h-2 rounded-full bg-destructive mt-1.5 flex-shrink-0" />
                        <span className="text-foreground"><AbbrText text={drug} /></span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Evidence / Notes */}
              {currentNode.recommendation.notes && (
                <div className="p-3 rounded-lg bg-muted/50 border border-border">
                  <p className="text-xs text-muted-foreground">
                    <span className="font-semibold text-foreground">📚 Evidence & Notes: </span>
                    <AbbrText text={currentNode.recommendation.notes} />
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card id="htn-section-potency">
        <Collapsible open={potencyOpen} onOpenChange={setPotencyOpen}>
        <CollapsibleTrigger asChild>
        <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors">
          <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Gauge className="h-5 w-5" style={{ color: categoryColors.accent }} />
            <CardTitle className="text-lg">Antihypertensive Drug Potency</CardTitle>
          </div>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            {potencyOpen ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
          </Button>
          </div>
          <p className="text-xs text-muted-foreground">Drug efficacy comparison for clinical decision-making</p>
        </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
        <CardContent>
          {/* Key Considerations Alert */}
          <Alert className="mb-4 border-amber-500/30 bg-warning/100/5">
            <Info className="h-4 w-4 text-amber-500" />
            <AlertDescription className="text-warning text-sm">
              Potency alone should not drive drug selection — consider comorbidities, side effects, and patient preferences.
              Thiazide-like diuretics (chlorthalidone, indapamide) preferred over HCTZ for cardiovascular outcomes.
            </AlertDescription>
          </Alert>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-28">Potency</TableHead>
                  <TableHead>Drug Class</TableHead>
                  <TableHead>Examples</TableHead>
                  <TableHead>Starting Dose</TableHead>
                  <TableHead className="w-1/3">Best Use</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {drugData.map((row, index) => (
                  <TableRow key={index} className="hover:bg-muted/50">
                    <TableCell>
                      <Badge variant="outline" className={getPotencyColor(row.potency)}>
                        {row.potency}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">{row.drugClass}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{row.examples}</TableCell>
                    <TableCell className="text-sm">{row.startingDose}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{row.bestUse}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Clinical Pearls */}
          <Accordion type="single" collapsible className="mt-4">
            <AccordionItem value="pearls">
              <AccordionTrigger className="text-sm font-medium">Clinical Pearls</AccordionTrigger>
              <AccordionContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="space-y-2">
                    <p className="font-medium">Resistant Hypertension (≥3 drugs)</p>
                    <p className="text-xs text-muted-foreground">
                      Confirm adherence, white-coat effect, and secondary causes first. Then add spironolactone 25 mg
                      — PATHWAY-2 trial showed best add-on efficacy.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <p className="font-medium">Thiazide vs Loop Diuretics</p>
                    <p className="text-xs text-muted-foreground">
                      Switch to loop diuretics (furosemide, torsemide) when eGFR &lt;30 mL/min/1.73m².
                      Thiazides lose efficacy at low GFR.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <p className="font-medium">ACEi/ARB Combination</p>
                    <p className="text-xs text-muted-foreground">
                      NEVER combine ACEi + ARB (dual RAAS blockade) — increases hyperkalemia and AKI risk
                      without additional benefit (ONTARGET/ALTITUDE trials).
                    </p>
                  </div>

                  <div className="space-y-2">
                    <p className="font-medium">Beta-Blocker Selection</p>
                    <p className="text-xs text-muted-foreground">
                      Prefer cardioselective beta-blockers (metoprolol, bisoprolol) or vasodilating beta-blockers
                      (carvedilol, labetalol). Atenolol has inferior outcomes data.
                    </p>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* Recurrent Stroke Prevention Protocol */}
      <Card id="htn-section-stroke">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5" style={{ color: categoryColors.accent }} />
            <CardTitle className="text-lg">Recurrent Stroke Prevention Protocol</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">{strokeProtocol.background}</p>

          {/* Key Trials */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
            {strokeProtocol.keyTrials.map((trial, i) => (
              <div key={i} className="p-3 rounded-lg bg-muted/30 border border-border/50">
                <p className="font-medium text-sm" style={{ color: categoryColors.accent }}>{trial.name}</p>
                <p className="text-xs text-muted-foreground">{trial.result}</p>
              </div>
            ))}
          </div>

          <Separator className="my-4" />

          {/* Recommendations */}
          <div className="space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-4 w-4" style={{ color: categoryColors.accent }} />
                <span className="font-medium text-sm">Recommendations</span>
              </div>
              <ul className="space-y-1.5">
                {strokeProtocol.recommendations.map((rec, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: categoryColors.accent }} />
                    {rec}
                  </li>
                ))}
              </ul>
            </div>

            <Alert className="border-red-500/30 bg-destructive/100/5">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <AlertTitle className="text-destructive text-sm">Cautions in Acute Stroke</AlertTitle>
              <AlertDescription className="text-red-600 text-sm">
                <ul className="mt-2 space-y-1">
                  {strokeProtocol.cautions.map((caution, i) => (
                    <li key={i}>• {caution}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>
      </Card>

      {/* Pregnancy Quick Reference */}
      <Card id="htn-section-pregnancy">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Baby className="h-5 w-5" style={{ color: categoryColors.accent }} />
            <CardTitle className="text-lg">Antihypertensives in Pregnancy</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3 rounded-lg border border-emerald-500/30 bg-emerald-500/5">
              <p className="text-sm font-medium text-success mb-2">✓ Safe Options</p>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• Methyldopa — gold standard, most studied</li>
                <li>• Labetalol — preferred for acute severe HTN</li>
                <li>• Nifedipine SR — safe in pregnancy</li>
                <li>• Hydralazine — IV for severe HTN/eclampsia</li>
              </ul>
            </div>
            <div className="p-3 rounded-lg border border-destructive/30 bg-destructive/5">
              <p className="text-sm font-medium text-destructive mb-2">✗ Contraindicated</p>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• ACE inhibitors — TERATOGENIC (all trimesters)</li>
                <li>• ARBs — TERATOGENIC</li>
                <li>• Spironolactone — anti-androgenic effects</li>
                <li>• Atenolol — fetal growth restriction</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Hypertensive Emergencies */}
      <Card id="htn-section-emergencies" className="border-2 border-rose-500/20">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <CardTitle className="text-lg">Hypertensive Emergencies</CardTitle>
          </div>
          <p className="text-xs text-muted-foreground">
            Scenario-specific IV therapy — reduce MAP by 25% in first hour (except aortic dissection)
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            {
              scenario: "Aortic Dissection",
              timeline: "5-10 min",
              target: "SBP <120 mmHg",
              preferred: ["Esmolol IV", "Labetalol IV", "Nitroprusside (+ BB)"],
              avoid: ["Hydralazine (reflex tachycardia)"],
            },
            {
              scenario: "Acute Pulmonary Edema",
              timeline: "Minutes – 1 h",
              target: "MAP ↓ 25%",
              preferred: ["Nitroglycerin IV", "Nitroprusside", "Loop diuretics"],
              avoid: ["BB (decompensated HF)"],
            },
            {
              scenario: "Acute MI / ACS",
              timeline: "~1 h",
              target: "SBP <140 mmHg",
              preferred: ["Nitroglycerin IV", "Esmolol IV"],
              avoid: ["Nitroprusside", "Nifedipine"],
            },
            {
              scenario: "Hypertensive Encephalopathy",
              timeline: "1 h → gradual 24h",
              target: "MAP ↓ 20-25%",
              preferred: ["Labetalol IV", "Nicardipine IV", "Nitroprusside"],
              avoid: ["Clonidine (sedation)", "Methyldopa"],
            },
            {
              scenario: "Eclampsia / Pre-eclampsia",
              timeline: "30-60 min",
              target: "SBP <160, DBP <110",
              preferred: ["Labetalol IV", "Hydralazine IV", "MgSO₄"],
              avoid: ["ACEi/ARBs (teratogenic)", "Nitroprusside (fetal cyanide)"],
            },
            {
              scenario: "Pheochromocytoma Crisis",
              timeline: "Minutes",
              target: "Normalize BP",
              preferred: ["Phentolamine IV", "Nicardipine IV"],
              avoid: ["BB ALONE (unopposed α)"],
            },
            {
              scenario: "Acute Stroke (Ischemic)",
              timeline: "~1 h",
              target: "<185/110 (tPA); <220/120",
              preferred: ["Labetalol IV", "Nicardipine IV"],
              avoid: ["Aggressive lowering (maintain perfusion)"],
            },
            {
              scenario: "Acute Kidney Injury",
              timeline: "Hours",
              target: "MAP ↓ 20-25%",
              preferred: ["Fenoldopam", "Nicardipine IV", "Clevidipine"],
              avoid: ["ACEi/ARBs acutely", "Nitroprusside (thiocyanate)"],
            },
          ].map((em) => (
            <div
              key={em.scenario}
              className="p-4 rounded-lg border border-border/50 hover:border-rose-500/30 transition-colors"
            >
              <div className="flex items-start justify-between gap-2 mb-3">
                <h3 className="text-sm font-semibold">{em.scenario}</h3>
                <span className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground whitespace-nowrap">
                  {em.timeline}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="text-xs text-muted-foreground">Target:</span>
                <Badge variant="secondary" className="text-xs">{em.target}</Badge>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-2.5 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
                  <p className="font-medium flex items-center gap-1 text-emerald-600 mb-1.5">
                    <Activity className="h-3 w-3" /> Preferred
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {em.preferred.map((d) => (
                      <span key={d} className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                        {d}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="p-2.5 rounded-lg bg-rose-500/5 border border-destructive/20">
                  <p className="font-medium flex items-center gap-1 text-rose-600 mb-1.5">
                    <Ban className="h-3 w-3" /> Avoid
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {em.avoid.map((d) => (
                      <span key={d} className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-600 border border-rose-500/20">
                        {d}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Interactive Algorithm Flowchart */}
      <HtnAlgorithmFlowchart />

      {/* Secondary Hypertension Workup */}
      <Card id="htn-section-secondary" className="border-2 border-primary/20 cursor-pointer hover:border-purple-500/40 transition-colors group" onClick={() => navigate('/hypertension/secondary-htn')}>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary group-hover:text-purple-500 transition-colors" />
            <CardTitle className="text-lg">Secondary Hypertension Workup
              <span className="ml-2 inline-flex items-center gap-1 text-xs font-normal text-primary bg-primary/10 rounded-full px-2 py-0.5 group-hover:bg-purple-500/20 transition-colors">
                Open full evaluator →
              </span>
            </CardTitle>
          </div>
          <p className="text-xs text-muted-foreground">Investigations to consider based on clinical suspicion. Click to open the dedicated Secondary Hypertension page with interactive checklists and detailed protocols.</p>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {checklistItems.map((item) => (
              <div key={item.id} className={`p-3 rounded-lg border ${checklistCategoryColors[item.category]}`}>
                <div className="flex items-center gap-2 mb-2">
                  {item.icon}
                  <span className="font-medium text-sm">{item.condition}</span>
                </div>
                <ul className="text-xs space-y-1">
                  {item.tests.map((test, i) => (
                    <li key={i} className="flex items-start gap-1">
                      <span className="text-primary">•</span>
                      {test}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Medication Dosing Tables */}
      <Card id="htn-section-medications" className="border-2 border-primary/20">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Pill className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Medication Dosing Reference</CardTitle>
          </div>
          <p className="text-xs text-muted-foreground">Oral and IV dosing with renal adjustment guides</p>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="ace" className="w-full">
            <TabsList className="flex flex-wrap h-auto">
              <TabsTrigger value="ace">ACE Inhibitors</TabsTrigger>
              <TabsTrigger value="arb">ARBs</TabsTrigger>
              <TabsTrigger value="bb">Beta-Blockers</TabsTrigger>
              <TabsTrigger value="ccb">CCBs</TabsTrigger>
              <TabsTrigger value="diuretic">Diuretics</TabsTrigger>
            </TabsList>
            {[
              { key: "ace", drugs: medications.filter((m) => m.category.includes("ACE")) },
              { key: "arb", drugs: medications.filter((m) => m.category.includes("ARB")) },
              { key: "bb", drugs: medications.filter((m) => m.category.includes("Beta")) },
              { key: "ccb", drugs: medications.filter((m) => m.category.includes("CCB")) },
              { key: "diuretic", drugs: medications.filter((m) => m.category.includes("uretic")) },
            ].map((tab) => (
              <TabsContent key={tab.key} value={tab.key} className="space-y-3">
                {tab.drugs.map((drug) => (
                  <div key={drug.name} className="p-3 rounded-lg border bg-muted/20">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{drug.name}</span>
                      <Badge variant="outline">{drug.category}</Badge>
                    </div>
                    {drug.doses.map((dose, i) => (
                      <div key={i} className="text-xs mb-1">
                        <span className="font-semibold">{dose.route}:</span> {dose.dosing.join(", ")}
                      </div>
                    ))}
                    {drug.renalDosing && drug.renalDosing.length > 0 && (
                      <div className="mt-2 pt-2 border-t text-xs">
                        <span className="font-semibold">Renal dosing:</span>
                        {drug.renalDosing.map((rd, i) => (
                          <div key={i} className="text-muted-foreground">
                            {rd.gfrRange}: {rd.recommendation}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      {/* Moxonidine vs Clonidine Comparison */}
      <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Info className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Moxonidine vs Clonidine: Clinical Comparison</CardTitle>
          </div>
          <p className="text-xs text-muted-foreground">Moxonidine is generally preferred over clonidine due to fewer CNS side effects</p>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b-2 border-border">
                  <th className="text-left p-3 font-semibold text-foreground bg-muted/50">Feature</th>
                  <th className="text-left p-3 font-semibold text-primary bg-primary/10">Moxonidine (Preferred)</th>
                  <th className="text-left p-3 font-semibold text-foreground bg-muted/30">Clonidine</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-border">
                  <td className="p-3 font-medium text-muted-foreground">Mechanism</td>
                  <td className="p-3">Selective I1 imidazoline receptor agonist</td>
                  <td className="p-3">Non-selective: I1 + α2-adrenergic agonist</td>
                </tr>
                <tr className="border-b border-border bg-muted/20">
                  <td className="p-3 font-medium text-muted-foreground">Side Effects</td>
                  <td className="p-3 text-success text-xs">Less sedation, less dry mouth, fewer CNS effects</td>
                  <td className="p-3 text-destructive text-xs">More sedation, dry mouth, CNS effects; rebound HTN on abrupt withdrawal</td>
                </tr>
                <tr className="border-b border-border">
                  <td className="p-3 font-medium text-muted-foreground">Additional Indications</td>
                  <td className="p-3 text-xs">Primarily hypertension</td>
                  <td className="p-3 text-xs">Hypertension, ADHD, opioid withdrawal, pain conditions</td>
                </tr>
                <tr className="bg-muted/20">
                  <td className="p-3 font-medium text-muted-foreground">Clinical Preference</td>
                  <td className="p-3"><Badge className="bg-success/20 text-success border-success">Preferred for HTN</Badge></td>
                  <td className="p-3"><Badge variant="secondary">Use with caution</Badge></td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Diuretic Comparison Table */}
      <Card className="border-2 border-accent/20 bg-gradient-to-br from-accent/5 to-muted/10">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Droplets className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Diuretic Comparison: Loop vs Thiazide vs Potassium-Sparing</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b-2 border-border">
                  <th className="text-left p-3 font-semibold text-foreground bg-muted/50">Feature</th>
                  <th className="text-left p-3 font-semibold text-primary bg-primary/10">Loop Diuretics</th>
                  <th className="text-left p-3 font-semibold text-foreground bg-muted/30">Thiazide / Thiazide-like</th>
                  <th className="text-left p-3 font-semibold text-accent-foreground bg-accent/10">Potassium-Sparing</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-border">
                  <td className="p-3 font-medium text-muted-foreground">Examples</td>
                  <td className="p-3 text-xs">Furosemide, Torsemide, Bumetanide</td>
                  <td className="p-3 text-xs">HCTZ, Chlorthalidone, Indapamide</td>
                  <td className="p-3 text-xs">Spironolactone, Eplerenone, Amiloride</td>
                </tr>
                <tr className="border-b border-border bg-muted/20">
                  <td className="p-3 font-medium text-muted-foreground">Site of Action</td>
                  <td className="p-3 text-xs">Thick ascending limb (Na+/K+/2Cl- cotransporter)</td>
                  <td className="p-3 text-xs">Distal convoluted tubule (Na+/Cl- cotransporter)</td>
                  <td className="p-3 text-xs">Collecting duct (aldosterone receptor or ENaC)</td>
                </tr>
                <tr className="border-b border-border">
                  <td className="p-3 font-medium text-muted-foreground">Potency</td>
                  <td className="p-3"><Badge className="bg-destructive/20 text-destructive">High (15-25% Na+)</Badge></td>
                  <td className="p-3"><Badge className="bg-primary/20 text-primary">Moderate (5-8%)</Badge></td>
                  <td className="p-3"><Badge variant="secondary">Mild (1-3%)</Badge></td>
                </tr>
                <tr className="border-b border-border bg-muted/20">
                  <td className="p-3 font-medium text-muted-foreground">Renal Function</td>
                  <td className="p-3"><Badge className="bg-success/20 text-success">Effective even at GFR {'<'} 15</Badge></td>
                  <td className="p-3"><Badge className="bg-destructive/20 text-destructive">Ineffective at GFR {'<'} 30</Badge></td>
                  <td className="p-3"><Badge className="bg-destructive/20 text-destructive">Risk of hyperkalemia if GFR {'<'} 30</Badge></td>
                </tr>
                <tr className="border-b border-border">
                  <td className="p-3 font-medium text-muted-foreground">Key Electrolyte Effects</td>
                  <td className="p-3 text-xs">↓ K+, Na+, Mg2+, Ca2+</td>
                  <td className="p-3 text-xs">↓ K+, Na+, Mg2+; ↑ Ca2+, uric acid, glucose</td>
                  <td className="p-3 text-xs">↑ K+ (hyperkalemia risk); ↓ Na+ (mild)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
