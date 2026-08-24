import { Scan } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, ExternalLink, Image as ImageIcon } from "lucide-react";
import {
  Heart, Wine, Pill, Activity, Zap, Moon, TestTube, Stethoscope, FlaskConical,
  Droplets, Syringe,
} from "lucide-react";
import DstInterpretationPanel from "@/components/hypertension/DstInterpretationPanel";
import ImageLink from "@/components/ImageLink";
import { TakeHomeMessage } from "@/components/ui/take-home-message";

// ── Reninoma Clinical Probability Evaluator ──
function ReninomaEvaluator() {
  const [age, setAge] = useState<string>("");
  const [htnSeverity, setHtnSeverity] = useState<string>("");
  const [hypokalemia, setHypokalemia] = useState<boolean>(false);
  const [refractory, setRefractory] = useState<boolean>(false);
  const [youngOnset, setYoungOnset] = useState<boolean>(false);
  const [highRenin, setHighRenin] = useState<boolean>(false);
  const [renalMass, setRenalMass] = useState<boolean>(false);
  const [familyHx, setFamilyHx] = useState<boolean>(false);

  const score = [
    age && parseInt(age) < 30,
    htnSeverity === "severe" || htnSeverity === "resistant",
    hypokalemia,
    refractory,
    youngOnset,
    highRenin,
    renalMass,
    familyHx,
  ].filter(Boolean).length;

  const probability =
    score >= 6 ? "High — strong likelihood of reninoma" :
    score >= 4 ? "Moderate — consider dedicated workup" :
    score >= 2 ? "Low — reninoma unlikely but not excluded" :
    "Very low — alternative causes more likely";

  const probColor =
    score >= 6 ? "text-destructive border-red-500/30 bg-destructive/10" :
    score >= 4 ? "text-warning border-amber-500/30 bg-warning/10" :
    score >= 2 ? "text-blue-500 border-blue-500/30 bg-blue-500/10" :
    "text-muted-foreground border-border bg-muted/20";

  return (
    <div className="p-4 rounded-lg border-2 border-purple-500/30 bg-purple-500/5 mt-4">
      <h4 className="text-sm font-semibold flex items-center gap-2 mb-3">
        <Droplets className="h-4 w-4 text-purple-500" />
        Reninoma Clinical Probability Score
      </h4>
      <p className="text-xs text-muted-foreground mb-3">
        Score clinical features to estimate pre-test probability of reninoma (JG cell tumor).
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
        <div className="space-y-1.5">
          <label className="text-xs text-muted-foreground">Age</label>
          <input type="number" className="w-full h-9 rounded-md border border-border bg-muted px-3 text-xs"
            placeholder="Patient age" value={age} onChange={e => setAge(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs text-muted-foreground">HTN Severity</label>
          <select className="w-full h-9 rounded-md border border-border bg-muted px-3 text-xs"
            value={htnSeverity} onChange={e => setHtnSeverity(e.target.value)}>
            <option value="">Select...</option>
            <option value="mild">Mild (Stage 1)</option>
            <option value="moderate">Moderate (Stage 2)</option>
            <option value="severe">Severe (Stage 3)</option>
            <option value="resistant">Resistant (≥3 meds)</option>
          </select>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
        {[
          [hypokalemia, setHypokalemia, "Hypokalemia (K⁺ < 3.5)"],
          [refractory, setRefractory, "Refractory to ≥3 antihypertensives"],
          [youngOnset, setYoungOnset, "Onset < 30 years"],
          [highRenin, setHighRenin, "High plasma renin activity / direct renin"],
          [renalMass, setRenalMass, "Renal mass / complex cyst on imaging"],
          [familyHx, setFamilyHx, "Family history of HTN / reninoma"],
        ].map(([val, setter, label]) => (
          <label key={label as string} className="flex items-center gap-2 text-xs cursor-pointer">
            <input type="checkbox" checked={val as boolean}
              onChange={() => (setter as React.Dispatch<React.SetStateAction<boolean>>)(!(val as boolean))}
              className="h-4 w-4 accent-purple-500" />
            {label as string}
          </label>
        ))}
      </div>
      <div className={`p-3 rounded-lg border text-xs font-medium ${probColor}`}>
        Score: <strong>{score}/8</strong> — {probability}
      </div>
      {score >= 4 && (
        <div className="mt-2 text-xs text-muted-foreground">
          <strong>Recommended next steps:</strong> Check plasma renin activity + aldosterone, renal imaging
          (CT abdomen with contrast), and consider renal vein renin sampling per Wolley protocol (see above).
        </div>
      )}
    </div>
  );
}

interface EvaluationItem {
  id: string;
  condition: string;
  tests: string[];
  icon: React.ReactNode;
  category: 'endocrine' | 'renal' | 'lifestyle' | 'vascular' | 'other';
}

const evaluationItems: EvaluationItem[] = [
  {
    id: 'primary-aldosteronism',
    condition: 'Primary Aldosteronism',
    tests: ['Aldosterone/renin ratio', 'Saline suppression test', 'Adrenal CT/MRI'],
    icon: <Droplets className="h-5 w-5" />,
    category: 'endocrine'
  },
  {
    id: 'reninoma',
    condition: 'Reninoma (Juxtaglomerular Cell Tumor)',
    tests: [
      'Stop ACEi, ARB, MRA meds (interfere with renin measurement)',
      'CT abdomen with contrast — look for small cortical tumor / complex renal cyst',
      'MRI kidney with delayed contrast',
      'Admit 4–6 days prior to RVS for bed rest, final antihypertensive titration, and salt deprivation',
      'Renal vein renin sampling (Wolley technique): samples before & 20 min after IV enalaprilat 2.5 mg',
      'Lateralization ratio >1.5 consistent with reninoma',
      'Plasma renin activity & direct renin concentration (elevated)',
      'Aldosterone levels (elevated)',
      'Serum K+ (hypokalemia common, can be normokalemic)',
      'Age of onset <30 years (typical: severe HTN + hypokalemia in young)'
    ],
    icon: <Droplets className="h-5 w-5" />,
    category: 'endocrine'
  },
  {
    id: 'sleep-apnea',
    condition: 'Obstructive Sleep Apnea',
    tests: ['Polysomnography', 'Epworth sleepiness scale', 'Overnight oximetry'],
    icon: <Moon className="h-5 w-5" />,
    category: 'other'
  },
  {
    id: 'alcohol-use',
    condition: 'Alcohol Use',
    tests: ['Detailed alcohol history', 'AUDIT questionnaire', 'GGT, AST, ALT'],
    icon: <Wine className="h-5 w-5" />,
    category: 'lifestyle'
  },
  {
    id: 'nsaid-use',
    condition: 'NSAID Use',
    tests: ['Medication history review', 'OTC medication assessment'],
    icon: <Pill className="h-5 w-5" />,
    category: 'lifestyle'
  },
  {
    id: 'renovascular',
    condition: 'Renovascular Disease',
    tests: ['Renal ultrasound', 'Serum creatinine/BUN', 'Urinalysis with microscopy for RBCs and casts'],
    icon: <FlaskConical className="h-5 w-5" />,
    category: 'renal'
  },
  {
    id: 'renal-artery-stenosis',
    condition: 'Renal Artery Stenosis',
    tests: ['Renal artery Doppler', 'CT/MR angiography', 'ACE inhibitor test', 'Urine microscopic exam: look for RBCs, RBC casts, granular casts'],
    icon: <Activity className="h-5 w-5" />,
    category: 'vascular'
  },
  {
    id: 'thyroid',
    condition: 'Thyroid Disorders',
    tests: ['TSH', 'Free T3/T4', 'Thyroid antibodies'],
    icon: <Zap className="h-5 w-5" />,
    category: 'endocrine'
  },
  {
    id: 'cushings',
    condition: "Cushing's Syndrome",
    tests: [
      '1 mg overnight DST — preferred (1 mg dexamethasone 23:00 → 08:00 cortisol; ≤50 nmol/L / 1.8 µg/dL rules out)',
      'Late-night salivary cortisol',
      '24h urine free cortisol',
      'Avoid random morning cortisol — too nonspecific for screening',
    ],
    icon: <TestTube className="h-5 w-5" />,
    category: 'endocrine'
  },
  {
    id: 'pheochromocytoma',
    condition: 'Pheochromocytoma',
    tests: ['Plasma metanephrines', '24h urinary metanephrines', 'Adrenal CT/MRI', 'Genetic testing'],
    icon: <Syringe className="h-5 w-5" />,
    category: 'endocrine'
  },
  {
    id: 'substance-abuse',
    condition: 'Substance Abuse & Polycythemia',
    tests: ['Urine toxicology', 'CBC/Hematocrit', 'EPO levels'],
    icon: <Stethoscope className="h-5 w-5" />,
    category: 'other'
  }
];

const catColors: Record<string, string> = {
  endocrine: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
  renal: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  lifestyle: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  vascular: 'bg-rose-500/10 text-rose-600 border-rose-500/20',
  other: 'bg-gray-500/10 text-gray-600 border-gray-500/20',
};

export default function SecondaryHtnPage() {
  const navigate = useNavigate();
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState("evaluation");

  const toggle = (id: string) => {
    const next = new Set(completed);
    if (next.has(id)) next.delete(id); else next.add(id);
    setCompleted(next);
  };

  const progress = (completed.size / evaluationItems.length) * 100;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 py-6 md:py-8">
        {/* Back to Home */}
        <Button variant="ghost" size="sm" onClick={() => navigate("/home")} className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to Home
        </Button>

        {/* Hero */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
              <Heart className="h-6 w-6 text-purple-500" />
            </div>
            <div>
              <h1 className="text-3xl font-serif font-semibold tracking-tight">
                Secondary Hypertension
              </h1>
              <p className="text-muted-foreground">
                Systematic evaluation for secondary causes of hypertension
              </p>
            </div>
          </div>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-3 mb-6 p-4 rounded-lg border bg-card/60">
          <Progress value={progress} className="h-3 flex-1" />
          <span className="text-sm text-muted-foreground whitespace-nowrap font-medium">{completed.size}/{evaluationItems.length} evaluated</span>
        </div>

        {/* Main content */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 h-auto">
            <TabsTrigger value="evaluation">📋 Workup</TabsTrigger>
            <TabsTrigger value="causes">🔍 Causes</TabsTrigger>
            <TabsTrigger value="tips">💡 Tips</TabsTrigger>
          </TabsList>

          <TabsContent value="evaluation" className="space-y-2 pt-4">
            {evaluationItems.map((item) => {
              const done = completed.has(item.id);
              return (
                <div
                  key={item.id}
                  className={`p-3 rounded-lg border transition-all ${done ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-border hover:border-primary/30'}`}
                >
                  <label className="flex items-start gap-3 cursor-pointer">
                    <Checkbox checked={done} onCheckedChange={() => toggle(item.id)} className="mt-1" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <div className={`p-1 rounded ${catColors[item.category]}`}>{item.icon}</div>
                        <span className={`text-sm font-medium ${done ? 'line-through text-muted-foreground' : ''}`}>
                          {item.condition}
                        </span>
                        <Badge variant="outline" className={`ml-auto text-[10px] ${catColors[item.category]}`}>
                          {item.category}
                        </Badge>
                      </div>
                      {!done && (
                        <div className="flex flex-wrap gap-1">
                          {item.tests.map((t) => (
                            <span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{t}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </label>
                </div>
              );
            })}

            {/* Reninoma — detailed protocol card */}
            <div className="p-4 rounded-lg border-2 border-purple-500/30 bg-purple-500/5 mt-4">
              <h4 className="text-sm font-semibold flex items-center gap-2 mb-3">
                <Droplets className="h-4 w-4 text-purple-500" />
                Reninoma Workup Protocol
              </h4>
              <div className="space-y-2 text-xs">
                <div className="flex items-start gap-2">
                  <span className="font-bold text-purple-500 shrink-0 w-5">a.</span>
                  <span><strong>Stop ACEi, ARB, MRA meds</strong> — these interfere with renin measurement.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-bold text-purple-500 shrink-0 w-5">b.</span>
                  <span><strong>CT abdomen with contrast</strong> — evaluate for renal artery stenosis and reninoma (look for small cortical tumor / complex renal cyst).</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-bold text-purple-500 shrink-0 w-5">c.</span>
                  <span><strong>MRI kidney with delayed contrast</strong> — further characterization if CT inconclusive.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-bold text-purple-500 shrink-0 w-5">d.</span>
                  <span><strong>Admit 4–6 days prior to renal vein sampling (RVS)</strong> for bed rest, final antihypertensive titration, and salt deprivation.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-bold text-purple-500 shrink-0 w-5">e.</span>
                  <span><strong>Renal vein renin sampling per Wolley et al:</strong> After 5 days of salt deprivation and overnight recumbency, simultaneous bilateral renal vein and infrarenal IVC samples are drawn <strong>before</strong> and <strong>20 min after</strong> IV enalaprilat 2.5 mg. A lateralization ratio &gt;1.5 before and after stimulation confirms a unilateral renin-secreting source — typical for reninoma.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-bold text-purple-500 shrink-0 w-5">f.</span>
                  <span><strong>Interpretation:</strong> e.g., right-to-left ratio 1.9 pre-enalaprilat + 2.0 post-enalaprilat → consistent with right renal reninoma (presumed = the imaged complex right renal cyst).</span>
                </div>
              </div>
            </div>

            {/* Cushing's — 1 mg overnight DST interpretation */}
            <DstInterpretationPanel />
            
            <div className="flex justify-center py-2">
              <ImageLink imageId="structured-hypercortisolism-screen" label="View Structured Hypercortisolism Screen →" />
            </div>

            {/* Reninoma — Clinical Probability Evaluator */}
            <ReninomaEvaluator />
          </TabsContent>

          <TabsContent value="causes" className="space-y-3 pt-4">
            <div className="p-3 rounded-lg border bg-muted/20">
              <h4 className="text-sm font-semibold mb-2">🔬 Common Secondary Causes</h4>
              <div className="grid gap-2 text-xs">
                <div className="p-2 rounded bg-purple-500/5 border border-purple-500/20">
                  <strong>Endocrine:</strong> Primary aldosteronism, Cushing's, pheochromocytoma, thyroid disease, hyperparathyroidism, <strong>Reninoma</strong>
                </div>
                <div className="p-2 rounded bg-blue-500/5 border border-blue-500/20">
                  <strong>Renal:</strong> Renovascular disease (RAS), renal artery stenosis, chronic kidney disease, polycystic kidney
                </div>
                <div className="p-2 rounded bg-emerald-500/5 border border-emerald-500/20">
                  <strong>Lifestyle:</strong> Alcohol &gt;3 drinks/day, NSAIDs, cocaine/amphetamines, oral contraceptives, licorice
                </div>
                <div className="p-2 rounded bg-rose-500/5 border border-rose-500/20">
                  <strong>Vascular:</strong> Coarctation of aorta, vasculitis
                </div>
                <div className="p-2 rounded bg-gray-500/5 border border-gray-500/20">
                  <strong>Other:</strong> OSA, polycythemia, pregnancy (preeclampsia), hypercalcemia
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="tips" className="space-y-3 pt-4">
            <div className="p-3 rounded-lg border bg-primary/5">
              <h4 className="text-sm font-semibold mb-2">💡 Clinical Pearls</h4>
              <ul className="space-y-2 text-xs">
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold">•</span>
                  <span><strong>Screen ALL hypertensive patients for primary aldosteronism</strong> — guidelines recommend universal screening, but in practice it rarely happens. A major reason is reluctance to perform an antihypertensive washout. <strong>Washout is NOT required:</strong> take aldosterone, renin and potassium <em>while the patient continues their antihypertensives</em>, then interpret with drug effects in mind (β-blockers/central α₂-agonists can raise ARR → false positives; MRAs, ENaC inhibitors and diuretics raise renin → false negatives). Only re-test off the confounding drug when the result is discordant with clinical suspicion.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold">•</span>
                  <span><strong>Screen for primary aldosteronism</strong> in resistant HTN + hypokalemia (even mild). Aldosterone/renin ratio is the screening test. Confirm with saline suppression or oral salt loading.</span>
                </li>

                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold">•</span>
                  <span><strong>Pheochromocytoma:</strong> Measure plasma metanephrines (supine ≥30 min, LC-MS/MS). Avoid TCAs, SNRIs, levodopa 2 weeks before. If positive, CT/MRI abdomen + 123I-MIBG or 68Ga-DOTATATE PET.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold">•</span>
                  <span><strong>OSA screening:</strong> Snoring, witnessed apneas, daytime sleepiness, BMI &gt;35. Polysomnography is gold standard. CPAP can lower BP 5–10 mmHg.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold">•</span>
                  <span><strong>Drug-induced HTN:</strong> NSAIDs (most common OTC cause), oral contraceptives, steroids, cyclosporine, tacrolimus, erythropoietin, decongestants, TCAs, MAOIs.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold">•</span>
                  <span><strong>Renovascular disease:</strong> Suspect in onset &lt;30y (fibromuscular dysplasia) or &gt;55y (atherosclerotic), worsening renal function with ACEi/ARB, flash pulmonary edema, asymmetric kidneys.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold">•</span>
                  <span><strong>Urine microscopy</strong> is an essential part of secondary HTN workup — check for microscopic hematuria (RBCs), RBC casts (glomerulonephritis), granular/waxy casts (parenchymal disease), and pyuria (infection/pyelonephritis).</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold">•</span>
                  <span><strong>Reninoma (juxtaglomerular cell tumor):</strong> Rare cause of severe HTN in young (&lt;30y), marked by high renin, high aldosterone, low K⁺. Small cortical tumor on CT. <strong>Workup:</strong> Stop ACEi/ARB/MRA; CT abdomen with contrast; MRI kidney with delayed contrast; admit 4–6 days before renal vein sampling for bed rest, BP titration &amp; salt deprivation; renal vein renin sampling per <strong>Wolley et al</strong> — samples before &amp; 20 min after IV enalaprilat 2.5 mg; lateralization ratio &gt;1.5 confirms. Treatment: partial/complete nephrectomy.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold">•</span>
                  <span><strong>Renal vein renin sampling — Wolley technique:</strong> After 5 days of salt deprivation and overnight recumbency, simultaneous bilateral renal vein and infrarenal IVC samples are drawn before and 20 minutes after IV enalaprilat 2.5 mg. A right-to-left ratio &gt;1.5 (or left-to-right &gt;1.5) before and after enalaprilat indicates a unilateral renin-secreting source — typically a reninoma (JG cell tumor).</span>
                </li>
              </ul>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
