import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  HeartPulse, Activity, Pill, AlertTriangle, Copy, Download,
  ChevronRight, ChevronDown, Stethoscope,
  Brain, ShieldAlert, Info, FileText, Zap,
} from "lucide-react";
import { downloadTextFile } from "@/lib/clinical-utils";
import { toast } from "sonner";

// ══════════════════════════════════════════════
// Types
// ══════════════════════════════════════════════

type HFType = "none" | "HFrEF" | "HFmrEF" | "HFpEF";
type CKDStage = "none" | "G1" | "G2" | "G3a" | "G3b" | "G4" | "G5";
type Albuminuria = "none" | "A1" | "A2" | "A3";
type RAASMed = "ACEi" | "ARB" | "ARNI" | "Direct_renin_inhibitor";
type Contraindication =
  | "K_ge_5_0"
  | "eGFR_lt_30"
  | "severe_hepatic_impairment"
  | "strong_CYP3A4_inhibitor"
  | "pregnancy_or_lactation"
  | "known_MRA_hypersensitivity";

interface InputState {
  heart_failure_type: HFType;
  post_MI_with_LV_dysfunction: boolean;
  diabetes_type2: boolean;
  ckd_stage: CKDStage;
  albuminuria: Albuminuria;
  resistant_hypertension: boolean;
  primary_aldosteronism: boolean;
  baseline_K: string;
  sex: "male" | "female" | "other" | null;
  high_risk_endocrine_AEs: boolean;
  current_RAAS: RAASMed[];
  contraindications: Contraindication[];
}

// ══════════════════════════════════════════════
// MRA drug profiles
// ══════════════════════════════════════════════

interface MRAProfile {
  name: string;
  brand: string;
  class: string;
  doseRange: string;
  keyTrials: string;
  advantages: string[];
  disadvantages: string[];
  ckdDosing: string;
  monitoring: string;
  color: string;
}

const MRA_PROFILES: MRAProfile[] = [
  {
    name: "Spironolactone",
    brand: "Aldactone",
    class: "Steroidal MRA (non-selective)",
    doseRange: "12.5–50 mg OD (HF) / 25–100 mg OD (HTN)",
    keyTrials: "RALES (HFrEF ↓ mortality 30%), TOPCAT (HFpEF), PATHWAY-2 (resistant HTN)",
    advantages: [
      "Strongest evidence in HFrEF (RALES)",
      "Proven in resistant hypertension (PATHWAY-2)",
      "First-line for primary aldosteronism",
      "Lowest cost, widely available",
    ],
    disadvantages: [
      "Gynecomastia / breast tenderness (10–20%) — anti-androgen effect",
      "Hyperkalemia risk, especially with CKD",
      "Menstrual irregularities in women",
      "Long half-life (t½ ~20 h)",
    ],
    ckdDosing: "Caution if eGFR <45; avoid if eGFR <30 or K ≥5.0",
    monitoring: "K⁺ and Cr at 1 week, 4 weeks, then q3–6 months",
    color: "blue",
  },
  {
    name: "Eplerenone",
    brand: "Inspra",
    class: "Steroidal MRA (selective)",
    doseRange: "25–50 mg OD (HF) / 50–100 mg OD (HTN)",
    keyTrials: "EPHESUS (post-MI LV dysfunction ↓ mortality 15%), EMPHASIS-HF (HFrEF ↓ mortality 24%)",
    advantages: [
      "Selective — minimal gynecomastia (<1%)",
      "Strong post-MI LV dysfunction data (EPHESUS)",
      "Better tolerated in men concerned about endocrine AEs",
      "Proven in HFrEF (EMPHASIS-HF)",
    ],
    disadvantages: [
      "Higher cost than spironolactone",
      "CYP3A4 interaction — avoid with strong CYP3A4 inhibitors",
      "Weaker BP-lowering effect vs spironolactone",
      "Twice-daily dosing for HTN indication",
    ],
    ckdDosing: "Caution if eGFR <50; avoid if eGFR <30 or K ≥5.0",
    monitoring: "K⁺ and Cr at 1 week, 4 weeks, then q3–6 months",
    color: "emerald",
  },
  {
    name: "Finerenone",
    brand: "Kerendia",
    class: "Non-steroidal MRA",
    doseRange: "10–20 mg OD",
    keyTrials: "FIDELIO-DKD (T2DM + CKD ↓ kidney failure 18%), FIGARO-DKD (T2DM + CKD ↓ CV events 13%), FINEARTS-HF (HFmrEF/HFpEF)",
    advantages: [
      "Dedicated outcome data in T2DM + albuminuric CKD",
      "Lower hyperkalemia risk vs steroidal MRAs",
      "No anti-androgen effects (no gynecomastia)",
      "Once-daily dosing, no food interaction",
      "Emerging HFmrEF/HFpEF data (FINEARTS-HF)",
    ],
    disadvantages: [
      "No HFrEF outcome data (not yet studied in RALES-like population)",
      "Higher cost / limited availability",
      "Less experience in resistant hypertension",
      "Not studied in primary aldosteronism",
    ],
    ckdDosing: "Approved for eGFR ≥25; start 20 mg if eGFR ≥60, 10 mg if eGFR 25–59",
    monitoring: "K⁺ at 4 weeks, then q4 months; more frequent if CKD or K-altering meds",
    color: "purple",
  },
];

// ══════════════════════════════════════════════
// Algorithm branches
// ══════════════════════════════════════════════

interface BranchResult {
  preferred: string;
  alternative: string | null;
  rationale: string;
  notes: string[];
  contraindicationWarnings: string[];
  doseCategory: string;
  monitoringPlan: string[];
}

function evaluateAlgorithm(input: InputState): BranchResult | null {
  const K = parseFloat(input.baseline_K || "0");
  const warnings: string[] = [];
  const monitoring: string[] = [
    "Check K⁺ and creatinine at baseline, 3–7 days after initiation, at 1 month, then every 3 months.",
    "More frequent monitoring in CKD G3b+ or with ACEi/ARB/ARNI.",
  ];

  // Safety checks
  if (K >= 5.0) {
    warnings.push("K⁺ ≥5.0 — defer any MRA. Correct hyperkalemia first, then reassess.");
  }
  if (["G4", "G5"].includes(input.ckd_stage)) {
    warnings.push("Advanced CKD (G4–G5): high hyperkalemia risk. Consider finerenone at low dose or nephrology input before steroidal MRAs.");
  }
  if (input.contraindications.includes("K_ge_5_0")) {
    warnings.push("Contraindication: K⁺ ≥5.0 — defer MRA.");
  }
  if (input.contraindications.includes("eGFR_lt_30")) {
    warnings.push("Contraindication: eGFR <30 — avoid steroidal MRAs; finerenone may be considered with caution (approved eGFR ≥25).");
  }
  if (input.contraindications.includes("severe_hepatic_impairment")) {
    warnings.push("Contraindication: severe hepatic impairment — avoid all MRAs.");
  }
  if (input.contraindications.includes("strong_CYP3A4_inhibitor")) {
    warnings.push("Contraindication: strong CYP3A4 inhibitor — avoid eplerenone. Consider spironolactone or finerenone.");
  }
  if (input.contraindications.includes("pregnancy_or_lactation")) {
    warnings.push("Contraindication: pregnancy/lactation — avoid all MRAs.");
  }
  if (input.contraindications.includes("known_MRA_hypersensitivity")) {
    warnings.push("Contraindication: known MRA hypersensitivity — avoid all MRAs.");
  }

  // Determine dose category based on CKD stage
  const getDoseCategory = (mra: string): string => {
    if (["G4", "G5"].includes(input.ckd_stage)) return "low";
    if (input.ckd_stage === "G3b") return "low";
    if (input.ckd_stage === "G3a") return mra === "finerenone" ? "standard" : "low";
    return "standard";
  };

  // Branch 1: T2DM + albuminuric CKD
  if (
    input.diabetes_type2 &&
    (input.albuminuria === "A2" || input.albuminuria === "A3") &&
    !["none", "G1"].includes(input.ckd_stage)
  ) {
    return {
      preferred: "Finerenone",
      alternative: input.heart_failure_type === "HFrEF" ? "Spironolactone" : null,
      rationale: "T2DM with albuminuric CKD: finerenone has dedicated outcome data reducing kidney failure, CV events, and hyperkalemia vs steroidal MRAs.",
      notes: [
        "Start finerenone if K < 4.8–5.0 mmol/L and eGFR ≥ 25–30 mL/min/1.73 m², per local labeling.",
        "Monitor K and eGFR at 4 weeks and regularly thereafter.",
        "Reserve spironolactone/eplerenone for additional HF or resistant HTN indications if potassium and renal function allow.",
      ],
      contraindicationWarnings: warnings,
      doseCategory: getDoseCategory("finerenone"),
      monitoringPlan: [
        ...monitoring,
        "Finerenone: check K⁺ at 4 weeks, then q4 months; more frequent if CKD or K-altering meds.",
      ],
    };
  }

  // Branch 2: HFrEF
  if (input.heart_failure_type === "HFrEF") {
    if (input.post_MI_with_LV_dysfunction) {
      return {
        preferred: "Eplerenone",
        alternative: "Spironolactone",
        rationale: "Post-MI LV dysfunction: eplerenone has strong trial support (EPHESUS) and lower endocrine AEs vs spironolactone.",
        notes: [
          "Choose spironolactone if cost is a major barrier and endocrine AEs are acceptable.",
          "Avoid eplerenone with strong CYP3A4 inhibitors; consider spironolactone or finerenone depending on renal status.",
          "Start eplerenone 25 mg OD, titrate to 50 mg OD as tolerated.",
        ],
        contraindicationWarnings: warnings,
        doseCategory: getDoseCategory("eplerenone"),
        monitoringPlan: monitoring,
      };
    }
    // HFrEF without post-MI
    return {
      preferred: "Spironolactone",
      alternative: "Eplerenone",
      rationale: "Chronic HFrEF: spironolactone is extensively proven (RALES), cheap, and effective; switch to eplerenone if gynecomastia or endocrine issues arise.",
      notes: [
        "Start spironolactone 12.5–25 mg OD, titrate to 50 mg OD as tolerated.",
        "Use lower starting doses in CKD G3b–G4 and with ACEi/ARB/ARNI.",
        "Consider finerenone in diabetics with CKD where hyperkalemia limits steroidal MRA dose.",
        "If gynecomastia develops, switch to eplerenone 25 mg OD, titrate to 50 mg OD.",
      ],
      contraindicationWarnings: warnings,
      doseCategory: getDoseCategory("spironolactone"),
      monitoringPlan: monitoring,
    };
  }

  // Branch 3: HFpEF / HFmrEF
  if (input.heart_failure_type === "HFpEF" || input.heart_failure_type === "HFmrEF") {
    return {
      preferred: "Finerenone",
      alternative: "Spironolactone or Eplerenone",
      rationale: "In HFpEF/HFmrEF, finerenone is the only MRA with clear reduction in HF hospitalization and a favorable efficacy–safety balance; steroidal MRAs may still help BP and congestion but with more hyperkalemia/endocrine risk.",
      notes: [
        "Prioritize finerenone in HFpEF/HFmrEF with T2DM/CKD.",
        "Use spironolactone/eplerenone when resistant HTN or classical HFrEF-like phenotypes coexist.",
        "FINEARTS-HF supports finerenone in HFmrEF/HFpEF with recent data.",
      ],
      contraindicationWarnings: warnings,
      doseCategory: getDoseCategory("finerenone"),
      monitoringPlan: [
        ...monitoring,
        "Finerenone: check K⁺ at 4 weeks, then q4 months.",
      ],
    };
  }

  // Branch 4: Primary aldosteronism
  if (input.primary_aldosteronism) {
    return {
      preferred: "Spironolactone",
      alternative: "Eplerenone",
      rationale: "Primary aldosteronism: spironolactone is potent and cost-effective; eplerenone is chosen when endocrine AEs are problematic. Finerenone is not standard first-line for primary aldosteronism.",
      notes: [
        "Start spironolactone 25–50 mg OD, titrate to 100–200 mg OD as needed for BP/K⁺ control.",
        "If gynecomastia develops, switch to eplerenone 50–100 mg OD.",
        "Titrate dose to renin and BP targets; monitor K and renal function closely.",
      ],
      contraindicationWarnings: warnings,
      doseCategory: "high",
      monitoringPlan: [
        ...monitoring,
        "Monitor K⁺ and BP closely during titration — primary aldosteronism often requires higher MRA doses.",
      ],
    };
  }

  // Branch 5: Resistant HTN without CKD/diabetes
  if (input.resistant_hypertension && !input.diabetes_type2 && !["G3a", "G3b", "G4"].includes(input.ckd_stage)) {
    return {
      preferred: "Spironolactone",
      alternative: "Eplerenone",
      rationale: "Resistant hypertension without major CKD/diabetes: spironolactone is the most effective add-on MRA (PATHWAY-2); eplerenone is reserved for intolerance or endocrine AEs.",
      notes: [
        "Start low, titrate based on BP response and K/eGFR.",
        "If gynecomastia or sexual dysfunction occurs, switch to eplerenone with equivalent MR blockade.",
        "Start spironolactone 25 mg OD (PATHWAY-2 protocol), titrate to 50 mg OD if needed.",
      ],
      contraindicationWarnings: warnings,
      doseCategory: getDoseCategory("spironolactone"),
      monitoringPlan: monitoring,
    };
  }

  // Branch 6: Resistant HTN with CKD or T2DM
  if (input.resistant_hypertension && (input.diabetes_type2 || ["G3a", "G3b", "G4"].includes(input.ckd_stage))) {
    return {
      preferred: "Finerenone or low-dose Spironolactone/Eplerenone",
      alternative: null,
      rationale: "Resistant HTN plus CKD/T2DM: balance BP control with cardiorenal protection and hyperkalemia risk; finerenone may offer safer long-term kidney/CV profile.",
      notes: [
        "Consider combining finerenone with careful RAAS blockade when albuminuric CKD is present.",
        "Use low-dose spironolactone/eplerenone only if potassium allows and BP remains uncontrolled.",
        "Monitor K⁺ and eGFR closely — dual RAAS + MRA in CKD carries high hyperkalemia risk.",
      ],
      contraindicationWarnings: warnings,
      doseCategory: "low",
      monitoringPlan: [
        ...monitoring,
        "High-risk combination: check K⁺ at 3–5 days, then weekly for first month.",
      ],
    };
  }

  // Branch 7: High-risk endocrine AEs
  if (input.high_risk_endocrine_AEs || input.sex === "male") {
    return {
      preferred: "Eplerenone or Finerenone",
      alternative: null,
      rationale: "High concern for gynecomastia/sex-hormone effects: avoid spironolactone if possible; use eplerenone or finerenone depending on HF vs CKD/T2DM profile.",
      notes: [
        "For pure HF/HTN without diabetic CKD, eplerenone is typically preferred.",
        "For HF with diabetic CKD or predominant CKD risk, favor finerenone.",
        "Avoid eplerenone with strong CYP3A4 inhibitors.",
      ],
      contraindicationWarnings: warnings,
      doseCategory: getDoseCategory("eplerenone"),
      monitoringPlan: monitoring,
    };
  }

  // Default: no clear indication
  return {
    preferred: "No clear MRA indication identified",
    alternative: null,
    rationale: "Based on the inputs provided, there is no strong evidence-based indication for initiating an MRA. Consider whether the patient has HFrEF, resistant hypertension, T2DM with albuminuric CKD, or primary aldosteronism.",
    notes: [
      "MRAs are not routinely indicated without one of the above conditions.",
      "If considering for other reasons, weigh risks (hyperkalemia, renal function) against potential benefits.",
      "Consult specialist if uncertain.",
    ],
    contraindicationWarnings: warnings,
    doseCategory: "not_applicable",
    monitoringPlan: [],
  };
}

// ══════════════════════════════════════════════
// Safety rules
// ══════════════════════════════════════════════

const SAFETY_RULES = [
  {
    icon: <ShieldAlert className="h-4 w-4" />,
    title: "Hyperkalemia — Most Important Safety Concern",
    detail: "Check K⁺ before starting any MRA. If K⁺ ≥5.0, defer and correct first. Monitor K⁺ at 1 week, 4 weeks, then q3–6 months. Risk ↑ with CKD, diabetes, concomitant ACEi/ARB/ARNI, NSAIDs.",
    color: "text-red-500",
    bg: "bg-red-500/5",
    border: "border-red-500/20",
  },
  {
    icon: <Activity className="h-4 w-4" />,
    title: "Renal Function Monitoring",
    detail: "Check eGFR before starting. Avoid steroidal MRAs if eGFR <30. Finerenone approved for eGFR ≥25. Monitor Cr at 1 week, 4 weeks, then q3–6 months. eGFR drop >30% warrants holding and reassessment.",
    color: "text-amber-500",
    bg: "bg-amber-500/5",
    border: "border-amber-500/20",
  },
  {
    icon: <AlertTriangle className="h-4 w-4" />,
    title: "Drug Interactions",
    detail: "Eplerenone: avoid with strong CYP3A4 inhibitors (ketoconazole, itraconazole, clarithromycin, ritonavir). Spironolactone: no CYP interaction but potentiates other antihypertensives. All MRAs: additive hyperkalemia risk with K⁺ supplements, K⁺-sparing diuretics, and high-K⁺ diets.",
    color: "text-orange-500",
    bg: "bg-orange-500/5",
    border: "border-orange-500/20",
  },
  {
    icon: <Brain className="h-4 w-4" />,
    title: "Endocrine Side Effects — Spironolactone",
    detail: "Gynecomastia/breast tenderness in 10–20% (dose-related). Menstrual irregularities. Switch to eplerenone or finerenone if problematic. Eplerenone: <1% gynecomastia. Finerenone: no anti-androgen effects.",
    color: "text-purple-500",
    bg: "bg-purple-500/5",
    border: "border-purple-500/20",
  },
];

// ══════════════════════════════════════════════
// Component
// ══════════════════════════════════════════════

export default function MRASelectionAlgorithm() {
  const [inputs, setInputs] = useState<InputState>({
    heart_failure_type: "none",
    post_MI_with_LV_dysfunction: false,
    diabetes_type2: false,
    ckd_stage: "none",
    albuminuria: "none",
    resistant_hypertension: false,
    primary_aldosteronism: false,
    baseline_K: "",
    sex: null,
    high_risk_endocrine_AEs: false,
    current_RAAS: [],
    contraindications: [],
  });

  const [expandedSection, setExpandedSection] = useState<string | null>("input");
  const [result, setResult] = useState<BranchResult | null>(null);

  const updateInput = <K extends keyof InputState>(key: K, value: InputState[K]) => {
    setInputs((prev) => ({ ...prev, [key]: value }));
  };

  const toggleRAAS = (med: RAASMed) => {
    setInputs((prev) => ({
      ...prev,
      current_RAAS: prev.current_RAAS.includes(med)
        ? prev.current_RAAS.filter((m) => m !== med)
        : [...prev.current_RAAS, med],
    }));
  };

  const toggleContraindication = (c: Contraindication) => {
    setInputs((prev) => ({
      ...prev,
      contraindications: prev.contraindications.includes(c)
        ? prev.contraindications.filter((x) => x !== c)
        : [...prev.contraindications, c],
    }));
  };

  const runAlgorithm = () => {
    const K = parseFloat(inputs.baseline_K || "0");
    if (isNaN(K) && inputs.baseline_K !== "") {
      toast.error("Enter a valid baseline potassium value");
      return;
    }
    const result = evaluateAlgorithm(inputs);
    setResult(result);
    setExpandedSection("result");
    toast.success("Algorithm evaluated — see recommendation below");
  };

  const resetAll = () => {
    setInputs({
      heart_failure_type: "none",
      post_MI_with_LV_dysfunction: false,
      diabetes_type2: false,
      ckd_stage: "none",
      albuminuria: "none",
      resistant_hypertension: false,
      primary_aldosteronism: false,
      baseline_K: "",
      sex: null,
      high_risk_endocrine_AEs: false,
      current_RAAS: [],
      contraindications: [],
    });
    setResult(null);
    setExpandedSection("input");
    toast.info("Reset complete");
  };

  const generateNote = () => {
    const lines: string[] = [
      "═══ MRA Selection Algorithm Summary ═══",
      "",
      "Clinical Profile:",
      `  Heart Failure: ${inputs.heart_failure_type}`,
      `  Post-MI LV Dysfunction: ${inputs.post_MI_with_LV_dysfunction ? "Yes" : "No"}`,
      `  T2DM: ${inputs.diabetes_type2 ? "Yes" : "No"}`,
      `  CKD Stage: ${inputs.ckd_stage}`,
      `  Albuminuria: ${inputs.albuminuria}`,
      `  Resistant HTN: ${inputs.resistant_hypertension ? "Yes" : "No"}`,
      `  Primary Aldosteronism: ${inputs.primary_aldosteronism ? "Yes" : "No"}`,
      `  Baseline K⁺: ${inputs.baseline_K || "—"} mmol/L`,
      `  High-risk Endocrine AEs: ${inputs.high_risk_endocrine_AEs ? "Yes" : "No"}`,
      `  Current RAAS Blockade: ${inputs.current_RAAS.join(", ") || "None"}`,
      "",
    ];
    if (result) {
      lines.push("Recommendation:");
      lines.push(`  Preferred MRA: ${result.preferred}`);
      if (result.alternative) lines.push(`  Alternative: ${result.alternative}`);
      lines.push(`  Rationale: ${result.rationale}`);
      lines.push("");
      lines.push("Notes:");
      result.notes.forEach((n) => lines.push(`  • ${n}`));
      lines.push("");
      lines.push(`  Dose Category: ${result.doseCategory}`);
      lines.push("  Monitoring Plan:");
      result.monitoringPlan.forEach((m) => lines.push(`    • ${m}`));
      if (result.contraindicationWarnings.length > 0) {
        lines.push("");
        lines.push("Warnings:");
        result.contraindicationWarnings.forEach((w) => lines.push(`  ⚠ ${w}`));
      }
    }
    return lines.join("\n");
  };

  const copyNote = () => {
    navigator.clipboard.writeText(generateNote());
    toast.success("Summary copied to clipboard");
  };

  const downloadNote = () => {
    downloadTextFile(generateNote(), `mra-selection-${Date.now()}.txt`);
    toast.success("Summary downloaded");
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Pill className="h-6 w-6 text-indigo-400" />
            MRA Selection Algorithm
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Spironolactone vs Eplerenone vs Finerenone — evidence-based decision support for cardiology, nephrology &amp; hypertension
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={copyNote} disabled={!result}>
            <Copy className="h-4 w-4 mr-1" /> Copy
          </Button>
          <Button variant="outline" size="sm" onClick={downloadNote} disabled={!result}>
            <Download className="h-4 w-4 mr-1" /> Export
          </Button>
          <Button variant="ghost" size="sm" onClick={resetAll}>
            Reset
          </Button>
        </div>
      </div>

      {/* ── MRA Drug Profiles ── */}
      <Card className="border-indigo-500/20">
        <button
          onClick={() => setExpandedSection(expandedSection === "profiles" ? null : "profiles")}
          className="w-full text-left"
        >
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-indigo-400" />
                <CardTitle className="text-base">📋 MRA Drug Profiles</CardTitle>
              </div>
              {expandedSection === "profiles" ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </div>
            <CardDescription>Spironolactone · Eplerenone · Finerenone — key differences at a glance</CardDescription>
          </CardHeader>
        </button>

        {expandedSection === "profiles" && (
          <CardContent className="pt-0">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {MRA_PROFILES.map((mra) => (
                <div key={mra.name} className={`rounded-lg border border-${mra.color}-500/20 bg-${mra.color}-500/5 p-4`}>
                  <h3 className={`text-sm font-bold text-${mra.color}-400 mb-1`}>{mra.name}</h3>
                  <p className="text-[10px] text-muted-foreground mb-2">{mra.brand} — {mra.class}</p>

                  <div className="mb-2">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Dose Range</p>
                    <p className="text-xs font-medium">{mra.doseRange}</p>
                  </div>

                  <div className="mb-2">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Key Trials</p>
                    <p className="text-[10px] text-muted-foreground">{mra.keyTrials}</p>
                  </div>

                  <div className="mb-2">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground text-green-400">Advantages</p>
                    <ul className="space-y-0.5">
                      {mra.advantages.map((a, i) => (
                        <li key={i} className="flex items-start gap-1 text-[10px] text-muted-foreground">
                          <span className={`text-${mra.color}-400 mt-0.5`}>+</span>
                          {a}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mb-2">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground text-red-400">Disadvantages</p>
                    <ul className="space-y-0.5">
                      {mra.disadvantages.map((d, i) => (
                        <li key={i} className="flex items-start gap-1 text-[10px] text-muted-foreground">
                          <span className="text-red-400 mt-0.5">−</span>
                          {d}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mb-2">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">CKD Dosing</p>
                    <p className="text-[10px] text-muted-foreground">{mra.ckdDosing}</p>
                  </div>

                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Monitoring</p>
                    <p className="text-[10px] text-muted-foreground">{mra.monitoring}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        )}
      </Card>

      {/* ── Clinical Inputs ── */}
      <Card className="border-cyan-500/20">
        <button
          onClick={() => setExpandedSection(expandedSection === "input" ? null : "input")}
          className="w-full text-left"
        >
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Stethoscope className="h-5 w-5 text-cyan-400" />
                <CardTitle className="text-base">Clinical Inputs</CardTitle>
              </div>
              {expandedSection === "input" ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </div>
            <CardDescription>Enter patient characteristics to determine the optimal MRA</CardDescription>
          </CardHeader>
        </button>

        {expandedSection === "input" && (
          <CardContent className="space-y-5 pt-0">
            {/* Heart Failure */}
            <div>
              <Label className="mb-2 block flex items-center gap-2">
                <HeartPulse className="h-4 w-4 text-rose-400" />
                Heart Failure Type
              </Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {(["none", "HFrEF", "HFmrEF", "HFpEF"] as const).map((hf) => (
                  <Button
                    key={hf}
                    variant={inputs.heart_failure_type === hf ? "default" : "outline"}
                    size="sm"
                    onClick={() => updateInput("heart_failure_type", hf)}
                    className={inputs.heart_failure_type === hf ? "bg-rose-500 hover:bg-rose-600" : ""}
                  >
                    {hf === "none" ? "None" : hf}
                  </Button>
                ))}
              </div>
            </div>

            {/* Post-MI LV Dysfunction */}
            {inputs.heart_failure_type === "HFrEF" && (
              <div>
                <Label className="mb-2 block">Post-MI with LV Dysfunction</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant={inputs.post_MI_with_LV_dysfunction ? "default" : "outline"}
                    size="sm"
                    onClick={() => updateInput("post_MI_with_LV_dysfunction", true)}
                    className={inputs.post_MI_with_LV_dysfunction ? "bg-orange-500" : ""}
                  >Yes — recent MI + LVEF ≤40%</Button>
                  <Button
                    variant={!inputs.post_MI_with_LV_dysfunction ? "default" : "outline"}
                    size="sm"
                    onClick={() => updateInput("post_MI_with_LV_dysfunction", false)}
                  >No</Button>
                </div>
              </div>
            )}

            {/* T2DM */}
            <div>
              <Label className="mb-2 block">Type 2 Diabetes</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant={inputs.diabetes_type2 ? "default" : "outline"}
                  size="sm"
                  onClick={() => updateInput("diabetes_type2", true)}
                  className={inputs.diabetes_type2 ? "bg-emerald-500" : ""}
                >Yes</Button>
                <Button
                  variant={!inputs.diabetes_type2 ? "default" : "outline"}
                  size="sm"
                  onClick={() => updateInput("diabetes_type2", false)}
                >No</Button>
              </div>
            </div>

            {/* CKD Stage */}
            <div>
              <Label className="mb-2 block flex items-center gap-2">
                <Activity className="h-4 w-4 text-amber-400" />
                CKD Stage
              </Label>
              <div className="grid grid-cols-4 md:grid-cols-7 gap-1.5">
                {(["none", "G1", "G2", "G3a", "G3b", "G4", "G5"] as const).map((stage) => (
                  <Button
                    key={stage}
                    variant={inputs.ckd_stage === stage ? "default" : "outline"}
                    size="sm"
                    onClick={() => updateInput("ckd_stage", stage)}
                    className={`text-[11px] h-8 ${inputs.ckd_stage === stage ? "bg-amber-500" : ""}`}
                  >
                    {stage === "none" ? "None" : stage}
                  </Button>
                ))}
              </div>
            </div>

            {/* Albuminuria */}
            <div>
              <Label className="mb-2 block">Albuminuria Category</Label>
              <div className="grid grid-cols-4 gap-2">
                {(["none", "A1", "A2", "A3"] as const).map((a) => (
                  <Button
                    key={a}
                    variant={inputs.albuminuria === a ? "default" : "outline"}
                    size="sm"
                    onClick={() => updateInput("albuminuria", a)}
                    className={inputs.albuminuria === a ? "bg-blue-500" : ""}
                  >
                    {a === "none" ? "None" : a}
                  </Button>
                ))}
              </div>
            </div>

            {/* Resistant HTN */}
            <div>
              <Label className="mb-2 block">Resistant Hypertension</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant={inputs.resistant_hypertension ? "default" : "outline"}
                  size="sm"
                  onClick={() => updateInput("resistant_hypertension", true)}
                  className={inputs.resistant_hypertension ? "bg-red-500" : ""}
                >Yes</Button>
                <Button
                  variant={!inputs.resistant_hypertension ? "default" : "outline"}
                  size="sm"
                  onClick={() => updateInput("resistant_hypertension", false)}
                >No</Button>
              </div>
            </div>

            {/* Primary Aldosteronism */}
            <div>
              <Label className="mb-2 block">Primary Aldosteronism</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant={inputs.primary_aldosteronism ? "default" : "outline"}
                  size="sm"
                  onClick={() => updateInput("primary_aldosteronism", true)}
                  className={inputs.primary_aldosteronism ? "bg-purple-500" : ""}
                >Yes</Button>
                <Button
                  variant={!inputs.primary_aldosteronism ? "default" : "outline"}
                  size="sm"
                  onClick={() => updateInput("primary_aldosteronism", false)}
                >No</Button>
              </div>
            </div>

            {/* Baseline K⁺ */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Baseline Potassium (mmol/L)</Label>
                <Input
                  type="number"
                  step="0.1"
                  placeholder="e.g. 4.2"
                  value={inputs.baseline_K}
                  onChange={(e) => updateInput("baseline_K", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Sex</Label>
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    variant={inputs.sex === "male" ? "default" : "outline"}
                    size="sm"
                    onClick={() => updateInput("sex", "male")}
                  >Male</Button>
                  <Button
                    variant={inputs.sex === "female" ? "default" : "outline"}
                    size="sm"
                    onClick={() => updateInput("sex", "female")}
                  >Female</Button>
                  <Button
                    variant={inputs.sex === "other" ? "default" : "outline"}
                    size="sm"
                    onClick={() => updateInput("sex", "other")}
                  >Other</Button>
                </div>
              </div>
            </div>

            {/* High-risk endocrine AEs */}
            <div>
              <Label className="mb-2 block">High Risk of Endocrine AEs</Label>
              <p className="text-[10px] text-muted-foreground mb-2">Patient has gynecomastia history or strong concern about sex-hormone side effects</p>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant={inputs.high_risk_endocrine_AEs ? "default" : "outline"}
                  size="sm"
                  onClick={() => updateInput("high_risk_endocrine_AEs", true)}
                  className={inputs.high_risk_endocrine_AEs ? "bg-pink-500" : ""}
                >Yes — avoid spironolactone if possible</Button>
                <Button
                  variant={!inputs.high_risk_endocrine_AEs ? "default" : "outline"}
                  size="sm"
                  onClick={() => updateInput("high_risk_endocrine_AEs", false)}
                >No</Button>
              </div>
            </div>

            {/* Current RAAS Blockade */}
            <div>
              <Label className="mb-2 block">Current RAAS Blockade</Label>
              <div className="flex flex-wrap gap-2">
                {(["ACEi", "ARB", "ARNI", "Direct_renin_inhibitor"] as const).map((med) => (
                  <Badge
                    key={med}
                    variant={inputs.current_RAAS.includes(med) ? "default" : "outline"}
                    className="cursor-pointer text-xs"
                    onClick={() => toggleRAAS(med)}
                  >
                    {med === "Direct_renin_inhibitor" ? "Direct Renin Inhibitor" : med}
                    {inputs.current_RAAS.includes(med) ? " ✓" : " +"}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Contraindications */}
            <div>
              <Label className="mb-2 block flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-400" />
                Contraindications
              </Label>
              <div className="flex flex-wrap gap-2">
                {([
                  { id: "K_ge_5_0" as const, label: "K⁺ ≥5.0" },
                  { id: "eGFR_lt_30" as const, label: "eGFR <30" },
                  { id: "severe_hepatic_impairment" as const, label: "Severe Hepatic Impairment" },
                  { id: "strong_CYP3A4_inhibitor" as const, label: "Strong CYP3A4 Inhibitor" },
                  { id: "pregnancy_or_lactation" as const, label: "Pregnancy / Lactation" },
                  { id: "known_MRA_hypersensitivity" as const, label: "MRA Hypersensitivity" },
                ]).map((c) => (
                  <Badge
                    key={c.id}
                    variant={inputs.contraindications.includes(c.id) ? "default" : "outline"}
                    className={`cursor-pointer text-xs ${
                      inputs.contraindications.includes(c.id) ? "bg-red-500 hover:bg-red-600" : "border-red-500/30 text-red-400"
                    }`}
                    onClick={() => toggleContraindication(c.id)}
                  >
                    {inputs.contraindications.includes(c.id) ? "✕ " : "+ "}
                    {c.label}
                  </Badge>
                ))}
              </div>
            </div>

            <Button onClick={runAlgorithm} className="w-full" size="lg">
              <Zap className="h-5 w-5 mr-2" />
              Run MRA Selection Algorithm
            </Button>
          </CardContent>
        )}
      </Card>

      {/* ── Result ── */}
      {result && (
        <Card className="border-green-500/20">
          <button
            onClick={() => setExpandedSection(expandedSection === "result" ? null : "result")}
            className="w-full text-left"
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-green-400" />
                  <CardTitle className="text-base">Algorithm Result</CardTitle>
                </div>
                {expandedSection === "result" ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </div>
              <CardDescription>Evidence-based MRA recommendation based on your inputs</CardDescription>
            </CardHeader>
          </button>

          {expandedSection === "result" && (
            <CardContent className="space-y-4 pt-0">
              {/* Preferred MRA */}
              <div className="p-4 rounded-lg border border-green-500/20 bg-green-500/5">
                <div className="flex items-center gap-2 mb-2">
                  <Pill className="h-5 w-5 text-green-400" />
                  <h3 className="text-base font-bold text-green-400">Preferred: {result.preferred}</h3>
                </div>
                {result.alternative && (
                  <p className="text-sm text-muted-foreground mb-2">
                    Alternative: <strong>{result.alternative}</strong>
                  </p>
                )}
                <p className="text-sm text-muted-foreground">{result.rationale}</p>
              </div>

              {/* Dose Category & Monitoring */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-3 rounded-lg border border-cyan-500/20 bg-cyan-500/5">
                  <h4 className="text-sm font-semibold text-cyan-400 mb-1 flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    Dose Category
                  </h4>
                  <Badge variant="outline" className={`text-xs ${
                    result.doseCategory === "low" ? "border-amber-500/30 text-amber-400" :
                    result.doseCategory === "high" ? "border-red-500/30 text-red-400" :
                    result.doseCategory === "not_applicable" ? "border-muted-foreground/30 text-muted-foreground" :
                    "border-green-500/30 text-green-400"
                  }`}>
                    {result.doseCategory === "low" ? "Low — start at reduced dose" :
                     result.doseCategory === "high" ? "High — may require higher doses" :
                     result.doseCategory === "not_applicable" ? "N/A" :
                     "Standard — start at usual dose"}
                  </Badge>
                </div>
                <div className="p-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5">
                  <h4 className="text-sm font-semibold text-emerald-400 mb-1 flex items-center gap-2">
                    <HeartPulse className="h-4 w-4" />
                    Monitoring Plan
                  </h4>
                  <ul className="space-y-0.5">
                    {result.monitoringPlan.map((m, i) => (
                      <li key={i} className="flex items-start gap-1.5 text-[11px] text-muted-foreground">
                        <span className="text-emerald-400 mt-0.5">•</span>
                        {m}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Notes */}
              <div className="p-3 rounded-lg border border-blue-500/20 bg-blue-500/5">
                <h4 className="text-sm font-semibold text-blue-400 mb-2 flex items-center gap-2">
                  <Info className="h-4 w-4" />
                  Clinical Notes
                </h4>
                <ul className="space-y-1">
                  {result.notes.map((n, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                      <span className="text-blue-400 mt-0.5">•</span>
                      {n}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Warnings */}
              {result.contraindicationWarnings.length > 0 && (
                <div className="p-3 rounded-lg border border-red-500/20 bg-red-500/5">
                  <h4 className="text-sm font-semibold text-red-400 mb-2 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    Warnings
                  </h4>
                  <ul className="space-y-1">
                    {result.contraindicationWarnings.map((w, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                        <span className="text-red-400 mt-0.5">⚠</span>
                        {w}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          )}
        </Card>
      )}

      {/* ── Safety Rules ── */}
      <Card className="border-red-500/20">
        <button
          onClick={() => setExpandedSection(expandedSection === "safety" ? null : "safety")}
          className="w-full text-left"
        >
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-red-400" />
                <CardTitle className="text-base">⚠ Safety Rules & Monitoring</CardTitle>
              </div>
              {expandedSection === "safety" ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </div>
            <CardDescription>Hyperkalemia prevention, renal monitoring, drug interactions, and endocrine AE management</CardDescription>
          </CardHeader>
        </button>

        {expandedSection === "safety" && (
          <CardContent className="space-y-3 pt-0">
            {SAFETY_RULES.map((rule, i) => (
              <div key={i} className={`p-3 rounded-lg border ${rule.border} ${rule.bg} flex items-start gap-3`}>
                <span className={`mt-0.5 ${rule.color}`}>{rule.icon}</span>
                <div>
                  <p className="text-sm font-semibold">{rule.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{rule.detail}</p>
                </div>
              </div>
            ))}
          </CardContent>
        )}
      </Card>
    </div>
  );
}
