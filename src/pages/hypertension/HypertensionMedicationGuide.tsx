import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heart, AlertTriangle, ChevronDown, ChevronRight, Stethoscope, Search, X } from "lucide-react";
import { FrequencyBadge } from "@/components/FrequencyBadge";
import ImageLink from "@/components/ImageLink";
import { headerTabClass, headerTabListClass } from "@/lib/header-tabs";
import ZoomableImage from "@/components/ZoomableImage";
import mraPocketCard from "@/assets/mra-pocket-card.jpg.asset.json";

/** Extract frequency tag from a dose range string like "8–16 mg OD" -> "OD" */
function extractCardFreq(dose: string): string {
  const s = dose.toLowerCase();
  if (/\b(weekly)\b/.test(s)) return "Weekly";
  if (/\b(qid|qds|four\s*times)\b/.test(s)) return "QID";
  if (/\b(tds|tid|three\s*times)\b/.test(s)) return "TDS";
  if (/\b(bd|bid|twice)\b/.test(s)) return "BD";
  if (/\b(od|daily|once|day|qd|o\.d)\b/.test(s)) return "OD";
  if (/\b(prn)\b/.test(s)) return "PRN";
  return "—";
}

// Antihypertensive Classes — `classMatch` maps a class card to entries in
// drugDoseDetails so we can render the full name/dose/interval table per class.
interface MedicationClass {
  class: string;
  suffix: string;
  classMatch: string[];
  mechanism: string;
  indications: string[];
  contraindications: string[];
  sideEffects: string[];
  monitoring: string[];
  firstLine: boolean;
  color: string;
  showMraCard?: boolean;
  pearls?: string;
}

const medicationClasses: MedicationClass[] = [
  {
    class: "ACE Inhibitors",
    suffix: "-pril",
    classMatch: ["ACEi"],
    mechanism: "Block conversion of angiotensin I to II → ↓ vasoconstriction, ↓ aldosterone",
    indications: ["Diabetes with proteinuria", "CKD", "Heart failure", "Post-MI", "High CV risk"],
    contraindications: ["Pregnancy", "Bilateral renal artery stenosis", "ACEi-induced angioedema", "Hyperkalemia (K+ >5.5)"],
    sideEffects: ["Dry cough (10-20%)", "Hyperkalemia", "Acute kidney injury", "Angioedema (rare)"],
    monitoring: ["Creatinine & K+ at baseline, 1-2 weeks, then annually", "Check BP response"],
    firstLine: true,
    color: "bg-primary/10 border-primary/30",
  },
  {
    class: "ARBs (Angiotensin Receptor Blockers)",
    suffix: "-sartan",
    classMatch: ["ARB"],
    mechanism: "Block AT1 receptor → vasodilation, ↓ aldosterone without affecting bradykinin",
    indications: ["ACEi cough intolerance", "Diabetes with proteinuria", "CKD", "Heart failure"],
    contraindications: ["Pregnancy", "Bilateral renal artery stenosis", "Hyperkalemia"],
    sideEffects: ["Hyperkalemia", "Hypotension", "Acute kidney injury", "Less cough than ACEi"],
    monitoring: ["Creatinine & K+ at baseline, 1-2 weeks, then annually", "BP response"],
    firstLine: true,
    color: "bg-primary/10 border-primary/30",
  },
  {
    class: "Calcium Channel Blockers (CCBs)",
    suffix: "-pine",
    classMatch: ["DHP-CCB", "Non-DHP CCB", "IV DHP-CCB"],
    mechanism: "Block L-type calcium channels → arterial vasodilation, ↓ peripheral resistance",
    indications: ["Isolated systolic HTN (elderly)", "Angina", "Black patients", "Metabolic syndrome"],
    contraindications: ["Cardiogenic shock", "Severe aortic stenosis", "Verapamil/Diltiazem: avoid with HFrEF"],
    sideEffects: ["Peripheral edema", "Flushing", "Dizziness", "Gingival hyperplasia", "Constipation (verapamil)"],
    monitoring: ["Peripheral edema", "BP response", "Heart rate (non-DHP CCBs)"],
    firstLine: true,
    color: "bg-success/10 border-success/30",
  },
  {
    class: "Thiazide Diuretics",
    suffix: "-thiazide",
    classMatch: ["Thiazide", "Thiazide-like"],
    mechanism: "Inhibit Na+/Cl- cotransporter in distal tubule → ↑ Na+ & water excretion",
    indications: ["Isolated systolic HTN", "Elderly patients", "Heart failure", "Osteoporosis prevention"],
    contraindications: ["Gout", "Severe CKD (GFR <30)", "Hyponatremia", "Addison's disease"],
    sideEffects: ["Hypokalemia", "Hyponatremia", "Hyperglycemia", "Hyperuricemia", "Dehydration"],
    monitoring: ["Electrolytes (Na+, K+) at 1-2 weeks then 6-12 monthly", "Creatinine", "Glucose", "Uric acid"],
    firstLine: true,
    color: "bg-warning/10 border-warning/30",
  },
  {
    class: "Loop Diuretics",
    suffix: "-semide/-anide",
    classMatch: ["Loop"],
    mechanism: "Inhibit Na⁺/K⁺/2Cl⁻ cotransporter in thick ascending limb → potent natriuresis",
    indications: ["HTN with GFR <30", "Volume overload / HF", "Refractory edema"],
    contraindications: ["Anuria", "Severe electrolyte depletion", "Sulfa allergy (some)"],
    sideEffects: ["Hypokalemia", "Hyponatremia", "Ototoxicity", "Hyperuricemia"],
    monitoring: ["Electrolytes, volume status, weight"],
    firstLine: false,
    color: "bg-warning/10 border-warning/30",
  },
  {
    class: "Beta-Blockers",
    suffix: "-olol",
    classMatch: ["β₁-selective BB", "Non-selective BB", "α/β blocker", "IV β₁-blocker", "IV α/β blocker"],
    mechanism: "Block β-adrenergic receptors → ↓ HR, ↓ contractility, ↓ renin release",
    indications: ["Heart failure (carvedilol, bisoprolol, metoprolol)", "Post-MI", "Angina", "Rate control (AF)"],
    contraindications: ["Severe asthma/COPD", "Bradycardia (<50 bpm)", "Heart block", "Decompensated HF"],
    sideEffects: ["Fatigue", "Bradycardia", "Sexual dysfunction", "Mask hypoglycemia", "Depression"],
    monitoring: ["Heart rate", "BP", "Signs of heart failure", "Masked hypoglycemia in diabetics"],
    firstLine: false,
    color: "bg-muted border-border",
  },
  {
    class: "Mineralocorticoid Receptor Antagonists (MRAs)",
    suffix: "steroidal & nonsteroidal",
    classMatch: ["K-sparing / MRA", "Nonsteroidal MRA"],
    mechanism: "Block aldosterone receptor → Na+ excretion, K+ retention, antifibrotic. Steroidal (spironolactone, eplerenone) vs nonsteroidal (finerenone — bulky, non-hormonal, more selective for MR, cardiorenal antifibrotic in diabetic CKD).",
    indications: ["Resistant HTN", "HFrEF (spironolactone, eplerenone)", "Primary aldosteronism", "Diabetic CKD with albuminuria (finerenone — FIDELIO/FIGARO)", "Patients with Hyperuricemia / Gout"],
    contraindications: ["Hyperkalemia (K+ >5.0)", "Severe CKD (eGFR <25 for finerenone; <30 for steroidal)", "Addison's disease", "Strong CYP3A4 inhibitors with finerenone"],
    sideEffects: ["Hyperkalemia (all)", "Gynecomastia / breast tenderness (spironolactone)", "Renal dysfunction", "Gynecomastia rare with eplerenone & finerenone"],
    pearls: "Generally neutral/minimal effect on serum uric acid levels. Unlike thiazide or loop diuretics, MRAs do not strongly interfere with renal uric acid transporters, making them preferred in patients with hyperuricemia or gout flares. [1, 2, 3, 4, 5]",
    monitoring: ["K+ and creatinine at 1 week, 1 month, then 3–6 monthly", "BP response", "Hold if K+ >5.5"],
    firstLine: false,
    color: "bg-accent/10 border-accent/30",
    showMraCard: true,
  },
  {
    class: "Direct Renin Inhibitors (DRI)",
    suffix: "aliskiren",
    classMatch: ["DRI"],
    mechanism: "Bind renin's active site → block conversion of angiotensinogen to angiotensin I → suppress entire RAAS cascade",
    indications: ["Alternative for HTN when ACEi/ARB not tolerated (rarely first-line)"],
    contraindications: ["Pregnancy", "Diabetes on ACEi/ARB (ALTITUDE — ↑ AKI, stroke, hyperkalemia)", "eGFR <60 combined with ACEi/ARB"],
    sideEffects: ["Diarrhea (dose-dependent)", "Hyperkalemia", "Angioedema (rare)", "Cough (uncommon)"],
    monitoring: ["K+, creatinine, BP", "Do not combine with ACEi/ARB in diabetes"],
    firstLine: false,
    color: "bg-muted border-border",
  },
  {
    class: "ARNI (Angiotensin Receptor–Neprilysin Inhibitor)",
    suffix: "sacubitril/valsartan",
    classMatch: ["ARNI"],
    mechanism: "Sacubitril inhibits neprilysin (↑ natriuretic peptides, bradykinin) + valsartan blocks AT1 receptor → vasodilation, natriuresis, antifibrotic",
    indications: ["HFrEF (PARADIGM-HF: ↓ mortality vs enalapril)", "HFpEF (selected)", "Resistant HTN (off-label add-on)"],
    contraindications: ["Pregnancy", "History of ACEi/ARB angioedema", "Concomitant ACEi (wait 36 h washout)", "Severe hepatic impairment"],
    sideEffects: ["Hypotension", "Hyperkalemia", "Renal impairment", "Angioedema"],
    monitoring: ["BP, K+, creatinine at 1–2 weeks then periodically", "36-hour ACEi washout before starting"],
    firstLine: false,
    color: "bg-muted border-border",
  },
  {
    class: "SGLT2 Inhibitors (BP-lowering effect)",
    suffix: "-flozin",
    classMatch: ["SGLT2i"],
    mechanism: "Block SGLT2 in proximal tubule → glucosuria + osmotic/natriuretic diuresis → modest BP ↓ (3–5 mmHg systolic), cardiorenal protection",
    indications: ["HFrEF & HFpEF", "Diabetic & non-diabetic CKD with albuminuria", "T2DM with ASCVD risk", "Adjunct in resistant HTN"],
    contraindications: ["Type 1 DM (DKA risk)", "eGFR <20", "Recurrent genitourinary infections", "Active foot ulcer/gangrene"],
    sideEffects: ["Genital mycotic infections", "Volume depletion / hypotension", "Euglycemic DKA (rare)", "Fournier's gangrene (very rare)"],
    monitoring: ["Volume status, eGFR, glucose (if diabetic)", "Foot exam"],
    firstLine: false,
    color: "bg-muted border-border",
  },
  {
    class: "Alpha Blockers",
    suffix: "-osin",
    classMatch: ["α₁-blocker"],
    mechanism: "Selective α₁-adrenergic blockade → arteriolar & venous dilation",
    indications: ["HTN with BPH", "Not preferred 1st line (ALLHAT: ↑ HF vs chlorthalidone)"],
    contraindications: ["Orthostatic hypotension", "Concomitant PDE5 inhibitor use (caution)"],
    sideEffects: ["First-dose syncope", "Orthostasis", "Dizziness"],
    monitoring: ["Standing BP, symptoms of orthostasis"],
    firstLine: false,
    color: "bg-muted border-border",
  },
  {
    class: "Central α₂-Agonists",
    suffix: "-clonidine/methyldopa",
    classMatch: ["Central α₂-agonist"],
    mechanism: "Central α₂-stimulation → ↓ sympathetic outflow",
    indications: ["Resistant HTN (add-on)", "Pregnancy (methyldopa)", "Perioperative"],
    contraindications: ["Severe bradycardia", "Depression (relative)"],
    sideEffects: ["Sedation", "Dry mouth", "Rebound HTN on abrupt stop (clonidine)"],
    monitoring: ["BP, HR, mental status; taper — don't stop abruptly"],
    firstLine: false,
    color: "bg-muted border-border",
  },
  {
    class: "Direct Vasodilators",
    suffix: "hydralazine, minoxidil",
    classMatch: ["Direct vasodilator"],
    mechanism: "Direct arteriolar smooth-muscle relaxation",
    indications: ["Resistant HTN", "HF in African-Americans (hydralazine + nitrate)", "Pregnancy (dihydralazine)"],
    contraindications: ["CAD (reflex tachycardia)", "Aortic dissection"],
    sideEffects: ["Reflex tachycardia", "Fluid retention", "Drug-induced lupus (hydralazine)", "Hirsutism (minoxidil)"],
    monitoring: ["HR, volume status, ANA if prolonged use"],
    firstLine: false,
    color: "bg-muted border-border",
  },
  {
    class: "IV Antihypertensives (Hypertensive Emergency)",
    suffix: "IV agents",
    classMatch: ["IV vasodilator", "IV DHP-CCB", "IV α/β blocker", "IV β₁-blocker", "DA₁ agonist"],
    mechanism: "Rapid-titratable parenteral BP control",
    indications: ["Hypertensive emergency", "Aortic dissection", "Eclampsia", "Perioperative"],
    contraindications: ["Agent-specific — see individual drug notes"],
    sideEffects: ["Hypotension, agent-specific toxicities"],
    monitoring: ["Arterial line preferred; continuous BP & HR"],
    firstLine: false,
    color: "bg-accent/10 border-accent/30",
  },
];

import { drugDoseDetails } from "@/data/hypertension-medications";

const treatmentAlgorithm = [
  {
    condition: "Diabetes with Proteinuria",
    firstLine: ["ACEi (Ramipril)", "OR ARB (Losartan, Telmisartan)"],
    rationale: "RENAAAL & IDNT trials: ARB reduces proteinuria progression and renal outcomes",
    targetBP: "< 130/80 mmHg",
  },
  {
    condition: "CKD with Proteinuria",
    firstLine: ["ACEi or ARB (max tolerated dose)"],
    rationale: "Slows CKD progression by reducing intraglomerular pressure",
    targetBP: "< 130/80 mmHg",
  },
  {
    condition: "Heart Failure (HFrEF)",
    firstLine: ["ACEi/ARB", "Beta-blocker (Carvedilol, Metoprolol, Bisoprolol)", "MRA (Spironolactone)"],
    rationale: "GDMT: RALES trial - Spironolactone ↓ mortality 30%; CIBIS-II, COPERNICUS - Beta-blockers improve survival",
    targetBP: "< 130/80 mmHg",
  },
  {
    condition: "Post-MI",
    firstLine: ["Beta-blocker", "ACEi (Ramipril - HOPE trial benefit)"],
    rationale: "Reduce reinfarction and mortality; HOPE trial: Ramipril ↓ CV events",
    targetBP: "< 130/80 mmHg",
  },
  {
    condition: "Stroke Prevention",
    firstLine: ["ACEi + Thiazide (Perindopril + Indapamide - PROGRESS trial)"],
    rationale: "PROGRESS: 43% reduction in recurrent stroke; BP reduction is key factor",
    targetBP: "< 130/80 mmHg",
  },
  {
    condition: "Isolated Systolic HTN (Elderly)",
    firstLine: ["Thiazide (Chlorthalidone)", "OR CCB (Amlodipine)"],
    rationale: "ALLHAT trial: Thiazide-like diuretics effective in elderly; HYVET showed benefit even in >80y",
    targetBP: "< 140/90 mmHg (or < 150/90 if >80y frail)",
  },
  {
    condition: "Black Patients",
    firstLine: ["CCB or Thiazide"],
    rationale: "Lower renin state; ACEi/ARB less effective as monotherapy",
    targetBP: "< 130/80 mmHg",
  },
  {
    condition: "Pregnancy",
    firstLine: ["Methyldopa (safest)", "Labetalol", "Nifedipine"],
    rationale: "Methyldopa most studied; ACEi/ARB absolutely contraindicated (teratogenic)",
    targetBP: "< 140/90 mmHg (CHIPS trial)",
    avoid: ["ACEi/ARB", "Spironolactone", "Atenolol"],
  },
];

// Drug Interactions
const drugInteractions = [
  {
    interaction: "ACEi/ARB + Spironolactone",
    risk: "HIGH",
    effect: "Hyperkalemia",
    management: "Monitor K+ closely; avoid if K+ >5.0 or eGFR <30",
  },
  {
    interaction: "ACEi + ARB (Dual RAAS blockade)",
    risk: "HIGH",
    effect: "↑ AKI, ↑ Hyperkalemia, no mortality benefit",
    management: "AVOID - contraindicated in most patients",
  },
  {
    interaction: "Beta-blockers + Verapamil/Diltiazem",
    risk: "MODERATE",
    effect: "Severe bradycardia, heart block",
    management: "Avoid combination; if used, monitor ECG",
  },
  {
    interaction: "Thiazides + NSAIDs",
    risk: "MODERATE",
    effect: "↓ Diuretic efficacy, ↑ AKI risk",
    management: "Use lowest dose NSAID; monitor renal function",
  },
  {
    interaction: "ACEi/ARB + NSAIDs",
    risk: "MODERATE",
    effect: "Triple whammy: AKI risk",
    management: "Avoid NSAIDs if possible; monitor creatinine",
  },
];

export default function HypertensionMedicationGuide() {
  const [expandedClass, setExpandedClass] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"classes" | "dosing" | "algorithm" | "interactions">("classes");
  const [drugSearch, setDrugSearch] = useState(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      return params.get("q") || "";
    }
    return "";
  });

  // Highlight and scroll to matched drug logic
  const drugRefs = React.useRef<Record<string, HTMLTableRowElement | null>>({});

  // Effect to sync search from URL if it changes while component is mounted
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const q = params.get("q");
    if (q) {
      setDrugSearch(q);
      
      // Auto-expand class if a specific drug matches
      const drugMatch = drugDoseDetails.find(d => 
        d.name.toLowerCase() === q.toLowerCase() || 
        d.brand.toLowerCase().includes(q.toLowerCase())
      );
      
      if (drugMatch) {
        const matchingClass = medicationClasses.find(c => c.classMatch.includes(drugMatch.drugClass));
        if (matchingClass) {
          setExpandedClass(matchingClass.class);
          
          // Small delay to allow expansion animation/render
          setTimeout(() => {
            const element = drugRefs.current[drugMatch.name];
            if (element) {
              element.scrollIntoView({ behavior: 'smooth', block: 'center' });
              element.classList.add('bg-primary/20', 'animate-pulse');
              setTimeout(() => {
                element.classList.remove('animate-pulse');
              }, 2000);
            }
          }, 300);
        }
      }
    }
  }, []);

  return (
    <div className="space-y-6">
      {/* HTN Rx Image — always visible at top */}
      <Card className="clinical-card overflow-hidden">
        <CardContent className="p-0">
          <div className="p-3">
            <ImageLink imageId="htn-rx" label="View HTN Medication Guide →" />
          </div>
        </CardContent>
      </Card>

      {/* Beta-Blocker Selection Guide */}
      <Card className="clinical-card overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Beta-Blocker Selection Guide</CardTitle>
          <p className="text-sm text-muted-foreground">Choose the right beta-blocker for the right patient</p>
        </CardHeader>
        <CardContent className="p-3">
          <ZoomableImage
            src="/beta-blocker-selection.jpg"
            alt="Beta-blocker selection by clinical phenotype"
            caption="Beta-blockers are not interchangeable — choose based on patient's phenotype"
          />
        </CardContent>
      </Card>

      {/* Beta-Blocker Selection Guidance */}
      <Card className="border-amber-200 bg-amber-50/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-base text-amber-800">Clinical Guidance: Beta-Blocker Selection by Phenotype</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="grid gap-3 md:grid-cols-3">
            <div className="bg-white p-3 rounded-lg border">
              <p className="font-medium text-green-700">❤️ Best for HR Control + HF</p>
              <p className="text-muted-foreground mt-1">Bisoprolol • Metoprolol Succinate</p>
              <p className="text-xs text-muted-foreground mt-1">Excellent HR control and established HFrEF evidence</p>
            </div>
            <div className="bg-white p-3 rounded-lg border">
              <p className="font-medium text-blue-700">🫁 Best When Bronchospasm Matters</p>
              <p className="text-muted-foreground mt-1">Bisoprolol • Nebivolol</p>
              <p className="text-xs text-muted-foreground mt-1">Highest β₁-selectivity, lower bronchospasm risk</p>
            </div>
            <div className="bg-white p-3 rounded-lg border">
              <p className="font-medium text-purple-700">🔄 Better Metabolic Profile</p>
              <p className="text-muted-foreground mt-1">Nebivolol • Carvedilol</p>
              <p className="text-xs text-muted-foreground mt-1">More favourable metabolic effects</p>
            </div>
          </div>
          <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg">
            <p className="font-medium text-amber-800 text-xs">⚠️ Important Note on Metoprolol Formulations</p>
            <div className="mt-2 text-xs text-amber-700 space-y-1">
              <p><strong>Metoprolol tartrate</strong> = immediate release (twice daily)</p>
              <p><strong>Metoprolol succinate</strong> = extended release (once daily) — the formulation used in guideline-directed HFrEF therapy</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Navigation Tabs */}
      <div className={headerTabListClass}>
        {[
          { id: "classes", label: "Drug Classes", icon: Stethoscope },
          { id: "dosing", label: "Dosing Guide", icon: Stethoscope },
          { id: "algorithm", label: "By Comorbidity", icon: Heart },
          { id: "interactions", label: "Drug Interactions", icon: AlertTriangle },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as any)}
            data-active={activeTab === tab.id}
            className={headerTabClass("px-4 py-2")}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "classes" && (
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Filter drugs (e.g. Eplerenone, Cilnidipine)..."
              value={drugSearch}
              onChange={(e) => setDrugSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-card border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            {drugSearch && (
              <button 
                onClick={() => setDrugSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <Card className="clinical-card">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Stethoscope className="h-4 w-4 text-primary" />
                </div>
                <CardTitle className="text-base">Antihypertensive Drug Classes</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {medicationClasses
                  .filter(medClass => {
                    if (!drugSearch) return true;
                    const search = drugSearch.toLowerCase();
                    const hasDrugMatch = drugDoseDetails.some(d => 
                      medClass.classMatch.includes(d.drugClass) && 
                      (d.name.toLowerCase().includes(search) || d.brand.toLowerCase().includes(search))
                    );
                    return medClass.class.toLowerCase().includes(search) || hasDrugMatch;
                  })
                  .map((medClass: MedicationClass) => (

                  <div
                    key={medClass.class}
                    className={`border-2 rounded-lg overflow-hidden ${medClass.color} ${
                      expandedClass === medClass.class ? "border-opacity-100" : "border-opacity-50"
                    }`}
                  >
                    <button
                      onClick={() =>
                        setExpandedClass(
                          expandedClass === medClass.class ? null : medClass.class
                        )
                      }
                      className="w-full p-4 text-left flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-semibold">{medClass.class}</span>
                        {medClass.firstLine && (
                          <Badge className="bg-success/20 text-success border-success/30">
                            First-Line
                          </Badge>
                        )}
                      </div>
                      {expandedClass === medClass.class ? (
                        <ChevronDown className="h-5 w-5" />
                      ) : (
                        <ChevronRight className="h-5 w-5" />
                      )}
                    </button>

                    {(expandedClass === medClass.class || (drugSearch && drugDoseDetails.some(d => 
                      medClass.classMatch.includes(d.drugClass) && 
                      (d.name.toLowerCase().includes(drugSearch.toLowerCase()) || d.brand.toLowerCase().includes(drugSearch.toLowerCase()))
                    ))) && (

                      <div className="px-4 pb-4 space-y-3 border-t border-inherit pt-3">
                        <div>
                          <span className="text-xs font-medium text-muted-foreground">
                            Drugs, doses & dosing intervals:
                          </span>
                          {(() => {
                            const drugs = drugDoseDetails.filter((d) =>
                              medClass.classMatch.includes(d.drugClass)
                            );
                            if (drugs.length === 0) {
                              return (
                                <p className="text-xs text-muted-foreground mt-1 italic">
                                  No individual drug entries listed.
                                </p>
                              );
                            }
                            return (
                              <div className="mt-1 overflow-x-auto rounded-md border border-border/60">
                                <table className="w-full text-xs">
                                  <thead className="bg-muted/60 text-muted-foreground">
                                    <tr>
                                      <th className="text-left font-medium px-2 py-1.5">Drug (brand)</th>
                                      <th className="text-left font-medium px-2 py-1.5">Dose range</th>
                                      <th className="text-left font-medium px-2 py-1.5 whitespace-nowrap">Interval</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-border/60">
                                      {drugs.map((d) => (
                                        <tr 
                                          key={d.name} 
                                          className="align-top transition-colors duration-500"
                                          ref={el => drugRefs.current[d.name] = el}
                                        >
                                        <td className="px-2 py-1.5">
                                          <div className="font-semibold text-foreground">{d.name}</div>
                                          <div className="text-[11px] text-muted-foreground">{d.brand}</div>
                                        </td>
                                        <td className="px-2 py-1.5">{d.doseRange}</td>
                                        <td className="px-2 py-1.5 whitespace-nowrap">
                                          <FrequencyBadge frequency={extractCardFreq(d.doseRange)} />
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            );
                          })()}
                        </div>

                        {medClass.showMraCard && (
                          <div>
                            <span className="text-xs font-medium text-muted-foreground">
                              MRA pocket card — steroidal vs nonsteroidal:
                            </span>
                            <div className="mt-2 rounded-md overflow-hidden border border-border/60">
                              <ZoomableImage
                                src={mraPocketCard.url}
                                alt="MRA pocket card — Spironolactone vs Eplerenone vs Finerenone"
                                className="w-full h-auto"
                              />
                            </div>
                          </div>
                        )}




                        <div>
                          <span className="text-xs font-medium text-muted-foreground">Mechanism:</span>
                          <p className="text-sm mt-0.5">{medClass.mechanism}</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <span className="text-xs font-medium text-success">✓ Indications:</span>
                            <ul className="text-xs mt-1 space-y-0.5">
                              {medClass.indications.map((ind, i) => (
                                <li key={i}>• {ind}</li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <span className="text-xs font-medium text-destructive">✗ Contraindications:</span>
                            <ul className="text-xs mt-1 space-y-0.5">
                              {medClass.contraindications.map((con, i) => (
                                <li key={i}>• {con}</li>
                              ))}
                            </ul>
                          </div>
                        </div>

                        <div>
                          <span className="text-xs font-medium text-warning">⚠ Side Effects:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {medClass.sideEffects.map((se, i) => (
                              <Badge key={i} variant="outline" className="text-xs bg-warning/10">
                                {se}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        <div>
                          <span className="text-xs font-medium text-primary">📋 Monitoring:</span>
                          <ul className="text-xs mt-1 space-y-0.5">
                            {medClass.monitoring.map((mon, i) => (
                              <li key={i}>• {mon}</li>
                            ))}
                          </ul>
                        </div>

                        {medClass.pearls && (
                          <div className="mt-2 p-2 rounded-md bg-primary/5 border border-primary/20">
                            <span className="text-xs font-bold text-primary block mb-1 uppercase tracking-wider">Clinical Pearls:</span>
                            <p className="text-[11px] leading-relaxed italic">{medClass.pearls}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "dosing" && (
        <Card className="clinical-card">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Stethoscope className="h-4 w-4 text-primary" />
              </div>
              <CardTitle className="text-base">Antihypertensive Dosing Guide</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {/* Search */}
            <div className="relative mb-4">
              <input
                type="text"
                placeholder="Search by drug name, brand, or class..."
                value={drugSearch}
                onChange={(e) => setDrugSearch(e.target.value)}
                className="w-full h-10 pl-3 pr-3 rounded-lg border border-input bg-background text-sm"
              />
            </div>

            <div className="space-y-2">
              {(drugSearch
                ? drugDoseDetails.filter(d =>
                    d.name.toLowerCase().includes(drugSearch.toLowerCase()) ||
                    d.brand.toLowerCase().includes(drugSearch.toLowerCase()) ||
                    d.drugClass.toLowerCase().includes(drugSearch.toLowerCase())
                  )
                : drugDoseDetails
              ).map((drug, i) => (
                <div
                  key={i}
                  className="p-3 rounded-lg border border-border/50 hover:border-primary/30 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div>
                      <span className="font-semibold text-sm">{drug.name}</span>
                      <span className="text-xs text-muted-foreground ml-2">({drug.brand})</span>
                    </div>
                    <div className="flex flex-wrap gap-1 items-center">
                      <FrequencyBadge frequency={extractCardFreq(drug.doseRange)} className="text-[10px]" />
                      <span className="text-xs font-mono bg-muted px-2 py-0.5 rounded">{drug.doseRange}</span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{drug.pearls}</p>
                  {drug.caution && (
                    <p className="text-xs text-warning mt-1 flex items-start gap-1">
                      <span>⚠</span> <span>{drug.caution}</span>
                    </p>
                  )}
                </div>
              ))}
              {(drugSearch && drugDoseDetails.filter(d => 
                d.name.toLowerCase().includes(drugSearch.toLowerCase()) ||
                d.brand.toLowerCase().includes(drugSearch.toLowerCase()) ||
                d.drugClass.toLowerCase().includes(drugSearch.toLowerCase())
              ).length === 0) && (
                <p className="text-sm text-muted-foreground text-center py-8">No drugs found matching "{drugSearch}"</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === "algorithm" && (
        <Card className="clinical-card">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center">
                <Heart className="h-4 w-4 text-success" />
              </div>
              <CardTitle className="text-base">Treatment Selection by Comorbidity</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {treatmentAlgorithm.map((item, index) => (
                <div
                  key={index}
                  className="p-4 rounded-lg border border-border hover:border-primary/50 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold">{item.condition}</h3>
                    <Badge variant="outline">Target: {item.targetBP}</Badge>
                  </div>

                  <div className="mb-3">
                    <span className="text-xs text-success font-medium">First-Line:</span>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {item.firstLine.map((drug, i) => (
                        <Badge key={i} className="bg-success/10 text-success border-success/30">
                          {drug}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {item.avoid && (
                    <div className="mb-2">
                      <span className="text-xs text-destructive font-medium">Avoid:</span>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {item.avoid.map((drug, i) => (
                          <Badge key={i} variant="destructive" className="text-xs">
                            {drug}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <p className="text-xs text-muted-foreground">
                    <span className="font-medium">Evidence: </span>{item.rationale}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === "interactions" && (
        <Card className="clinical-card">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-destructive/10 flex items-center justify-center">
                <AlertTriangle className="h-4 w-4 text-destructive" />
              </div>
              <CardTitle className="text-base">Important Drug Interactions</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {drugInteractions.map((interaction, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg border ${
                    interaction.risk === "HIGH"
                      ? "border-destructive bg-destructive/5"
                      : "border-warning bg-warning/5"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-sm">{interaction.interaction}</span>
                    <Badge
                      variant={interaction.risk === "HIGH" ? "destructive" : "default"}
                      className="text-xs"
                    >
                      {interaction.risk} RISK
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground mb-1">
                    Effect: {interaction.effect}
                  </div>
                  <div className="text-xs">
                    <span className="font-medium">Management: </span>
                    {interaction.management}
                  </div>
                </div>
              ))}
            </div>          </CardContent>
        </Card>
      )}
    </div>
  );
}
