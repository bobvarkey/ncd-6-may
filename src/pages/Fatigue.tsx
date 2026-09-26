import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowRight, AlertCircle, Stethoscope, FileSearch } from "lucide-react";
import ImageLink from "@/components/ImageLink";

const flowchartPath = "/fatigue-flowchart.jpg";

export default function Fatigue() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="text-center space-y-3">
        <Badge variant="outline" className="text-sm px-4 py-1 border-amber-400/40 text-warning">
          Fatigue Differential Diagnosis
        </Badge>
        <h1 className="text-3xl font-bold tracking-tight">Clinical Approach to Fatigue</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          A structured diagnostic framework for evaluating patients presenting with fatigue —
          guided by symptom pattern, timing, and associated weight changes.
        </p>
      </div>

      {/* Flowchart Image */}
      <Card className="border-border/60 overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Stethoscope className="h-5 w-5 text-warning" />
            Diagnostic Flowchart
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ImageLink imageId="fatigue-flowchart" label="View Fatigue Flowchart →" />
        </CardContent>
      </Card>

      {/* Decision Tree */}
      <Card className="border-border/60">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-warning" />
            Stepwise Differential Diagnosis
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 1. Intermittent Fatigue */}
          <div className="space-y-2">
            <h3 className="font-semibold text-base flex items-center gap-2">
              <Badge className="bg-warning/100/20 text-warning border-amber-500/30">1</Badge>
              Is fatigue <span className="underline decoration-wavy decoration-amber-400">intermittent</span>?
            </h3>
            <div className="ml-8 p-3 rounded-lg bg-warning/100/5 border border-amber-500/20">
              <p className="text-sm font-medium text-amber-300 mb-2">If Yes → Consider:</p>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <ArrowRight className="h-4 w-4 mt-0.5 text-warning shrink-0" />
                  <span><strong>Periodic Paralysis</strong> — hypokalemic, hyperkalemic, thyrotoxic, familial</span>
                </li>
              </ul>
            </div>
          </div>

          <Separator />

          {/* 2. Time of Day */}
          <div className="space-y-2">
            <h3 className="font-semibold text-base flex items-center gap-2">
              <Badge className="bg-warning/100/20 text-warning border-amber-500/30">2</Badge>
              Any pattern by <span className="underline decoration-wavy decoration-amber-400">time of day</span>?
            </h3>
            <div className="ml-8 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-blue-500/5 border border-blue-500/20">
                <p className="text-sm font-medium text-blue-300 mb-2">🌅 Worse in Morning</p>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <ArrowRight className="h-4 w-4 mt-0.5 text-blue-400 shrink-0" />
                    <span>Obstructive Sleep Apnea (OSA)</span>
                  </li>
                </ul>
              </div>
              <div className="p-3 rounded-lg bg-purple-500/5 border border-purple-500/20">
                <p className="text-sm font-medium text-purple-300 mb-2">🌆 Worse in Evening</p>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <ArrowRight className="h-4 w-4 mt-0.5 text-purple-400 shrink-0" />
                    <span>Myasthenia Gravis (MG)</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <Separator />

          {/* 3. Weight Changes */}
          <div className="space-y-2">
            <h3 className="font-semibold text-base flex items-center gap-2">
              <Badge className="bg-warning/100/20 text-warning border-amber-500/30">3</Badge>
              Any <span className="underline decoration-wavy decoration-amber-400">weight changes</span>?
            </h3>

            {/* Weight Gain */}
            <div className="ml-8 p-3 rounded-lg bg-destructive/100/5 border border-red-500/20">
              <p className="text-sm font-medium text-red-300 mb-2">⬆️ Weight Gain</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Generalized</p>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2"><ArrowRight className="h-4 w-4 mt-0.5 text-destructive shrink-0" />Hypothyroidism</li>
                    <li className="flex items-start gap-2"><ArrowRight className="h-4 w-4 mt-0.5 text-destructive shrink-0" />Acromegaly</li>
                    <li className="flex items-start gap-2"><ArrowRight className="h-4 w-4 mt-0.5 text-destructive shrink-0" />OSA / Insulinoma</li>
                    <li className="flex items-start gap-2"><ArrowRight className="h-4 w-4 mt-0.5 text-destructive shrink-0" />Organ failure (CCF/HFpEF/HFrEF, nephrotic syndrome, liver disease)</li>
                  </ul>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Localized</p>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2"><ArrowRight className="h-4 w-4 mt-0.5 text-destructive shrink-0" />Cushing syndrome (abdominal swelling)</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Weight Loss */}
            <div className="ml-8 p-3 rounded-lg bg-warning/100/5 border border-warning/20 mt-3">
              <p className="text-sm font-medium text-orange-300 mb-2">⬇️ Weight Loss</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">🍽️ Good Appetite</p>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2"><ArrowRight className="h-4 w-4 mt-0.5 text-warning shrink-0" />Hyperthyroidism</li>
                    <li className="flex items-start gap-2"><ArrowRight className="h-4 w-4 mt-0.5 text-warning shrink-0" />Malabsorption</li>
                    <li className="flex items-start gap-2"><ArrowRight className="h-4 w-4 mt-0.5 text-warning shrink-0" />Diabetes mellitus</li>
                    <li className="flex items-start gap-2"><ArrowRight className="h-4 w-4 mt-0.5 text-warning shrink-0" />Pheochromocytoma</li>
                  </ul>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">😟 Poor Appetite</p>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2"><ArrowRight className="h-4 w-4 mt-0.5 text-warning shrink-0" />Addison&apos;s disease / CKD</li>
                    <li className="flex items-start gap-2"><ArrowRight className="h-4 w-4 mt-0.5 text-warning shrink-0" />Cancer</li>
                    <li className="flex items-start gap-2"><ArrowRight className="h-4 w-4 mt-0.5 text-warning shrink-0" />Connective tissue disease</li>
                    <li className="flex items-start gap-2"><ArrowRight className="h-4 w-4 mt-0.5 text-warning shrink-0" />Chronic infections (TB, HIV)</li>
                    <li className="flex items-start gap-2"><ArrowRight className="h-4 w-4 mt-0.5 text-warning shrink-0" />Cholestatic liver disease / PBC</li>
                    <li className="flex items-start gap-2"><ArrowRight className="h-4 w-4 mt-0.5 text-warning shrink-0" />Anorexia nervosa</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* No Weight Change */}
            <div className="ml-8 p-3 rounded-lg bg-success/100/5 border border-green-500/20 mt-3">
              <p className="text-sm font-medium text-success/80 mb-2">➡️ No Weight Change</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-muted-foreground">
                <ul className="space-y-1">
                  <li className="flex items-start gap-2"><ArrowRight className="h-4 w-4 mt-0.5 text-success shrink-0" />Anemia</li>
                  <li className="flex items-start gap-2"><ArrowRight className="h-4 w-4 mt-0.5 text-success shrink-0" />Iron deficiency (with or without anemia)</li>
                  <li className="flex items-start gap-2"><ArrowRight className="h-4 w-4 mt-0.5 text-success shrink-0" />HFpEF / HFrEF (exertional fatigue, DOE)</li>
                  <li className="flex items-start gap-2"><ArrowRight className="h-4 w-4 mt-0.5 text-success shrink-0" />SLE</li>
                  <li className="flex items-start gap-2"><ArrowRight className="h-4 w-4 mt-0.5 text-success shrink-0" />Multiple sclerosis</li>
                  <li className="flex items-start gap-2"><ArrowRight className="h-4 w-4 mt-0.5 text-success shrink-0" />Chronic fatigue syndrome</li>
                  <li className="flex items-start gap-2"><ArrowRight className="h-4 w-4 mt-0.5 text-success shrink-0" />Fibromyalgia</li>
                </ul>
                <ul className="space-y-1">
                  <li className="flex items-start gap-2"><ArrowRight className="h-4 w-4 mt-0.5 text-success shrink-0" />Depression</li>
                  <li className="flex items-start gap-2"><ArrowRight className="h-4 w-4 mt-0.5 text-success shrink-0" />Medications (β-blockers, tenofovir)</li>
                  <li className="flex items-start gap-2"><ArrowRight className="h-4 w-4 mt-0.5 text-success shrink-0" />Sheehan syndrome</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Suggested Investigations */}
      <Card className="border-border/60">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <FileSearch className="h-5 w-5 text-warning" />
            Suggested Investigations
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Targeted workup based on the suspected etiology from the decision tree.
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-muted/40 border border-border/50 space-y-2">
              <h3 className="text-sm font-semibold text-destructive">⬆️ Weight Gain / Hypometabolic</h3>
              <ul className="space-y-1.5 text-sm text-muted-foreground">
                <li className="flex items-start gap-2"><span className="text-warning mt-0.5 shrink-0">•</span>TSH, Free T4 (hypothyroidism)</li>
                <li className="flex items-start gap-2"><span className="text-warning mt-0.5 shrink-0">•</span>IGF-1 (acromegaly)</li>
                <li className="flex items-start gap-2"><span className="text-warning mt-0.5 shrink-0">•</span>Overnight dexamethasone suppression test, 24h UFC (Cushing)</li>
                <li className="flex items-start gap-2"><span className="text-warning mt-0.5 shrink-0">•</span>Polysomnography (OSA)</li>
                <li className="flex items-start gap-2"><span className="text-warning mt-0.5 shrink-0">•</span>Fasting glucose, insulin, C-peptide (insulinoma)</li>
                <li className="flex items-start gap-2"><span className="text-warning mt-0.5 shrink-0">•</span>BNP, echo (CCF), LFTs (liver), urine protein/albumin (nephrotic)</li>
              </ul>
            </div>

            <div className="p-4 rounded-lg bg-muted/40 border border-border/50 space-y-2">
              <h3 className="text-sm font-semibold text-warning">⬇️ Weight Loss</h3>
              <ul className="space-y-1.5 text-sm text-muted-foreground">
                <li className="flex items-start gap-2"><span className="text-warning mt-0.5 shrink-0">•</span>TSH, Free T4, Free T3 (hyperthyroidism)</li>
                <li className="flex items-start gap-2"><span className="text-warning mt-0.5 shrink-0">•</span>HbA1c, FBS (diabetes)</li>
                <li className="flex items-start gap-2"><span className="text-warning mt-0.5 shrink-0">•</span>Plasma metanephrines (pheochromocytoma)</li>
                <li className="flex items-start gap-2"><span className="text-warning mt-0.5 shrink-0">•</span>Anti-TTG, IgA (celiac / malabsorption)</li>
                <li className="flex items-start gap-2"><span className="text-warning mt-0.5 shrink-0">•</span>Cortisol, ACTH (Addison&apos;s)</li>
                <li className="flex items-start gap-2"><span className="text-warning mt-0.5 shrink-0">•</span>Se, Cr, eGFR (CKD)</li>
                <li className="flex items-start gap-2"><span className="text-warning mt-0.5 shrink-0">•</span>ANA, anti-dsDNA, ESR, CRP (CTD)</li>
                <li className="flex items-start gap-2"><span className="text-warning mt-0.5 shrink-0">•</span>IGRA / Quantiferon (TB), HIV serology</li>
                <li className="flex items-start gap-2"><span className="text-warning mt-0.5 shrink-0">•</span>ALP, GGT, AMA (PBC / cholestatic liver)</li>
              </ul>
            </div>

            <div className="p-4 rounded-lg bg-muted/40 border border-border/50 space-y-2">
              <h3 className="text-sm font-semibold text-success">➡️ No Weight Change</h3>
              <ul className="space-y-1.5 text-sm text-muted-foreground">
                <li className="flex items-start gap-2"><span className="text-warning mt-0.5 shrink-0">•</span>CBC, ferritin, iron studies (anemia / iron deficiency)</li>
                <li className="flex items-start gap-2"><span className="text-warning mt-0.5 shrink-0">•</span>BNP or NT-proBNP, echo (HFpEF / HFrEF)</li>
                <li className="flex items-start gap-2"><span className="text-warning mt-0.5 shrink-0">•</span>ANA, anti-dsDNA, C3/C4, ESR (SLE)</li>
                <li className="flex items-start gap-2"><span className="text-warning mt-0.5 shrink-0">•</span>MRI brain, CSF analysis (MS)</li>
                <li className="flex items-start gap-2"><span className="text-warning mt-0.5 shrink-0">•</span>PHQ-9 / GAD-7 screening (depression)</li>
                <li className="flex items-start gap-2"><span className="text-warning mt-0.5 shrink-0">•</span>Review medications (beta-blockers, tenofovir, statins, PPIs)</li>
                <li className="flex items-start gap-2"><span className="text-warning mt-0.5 shrink-0">•</span>Prolactin, FSH/LH (Sheehan syndrome)</li>
              </ul>
            </div>

            <div className="p-4 rounded-lg bg-muted/40 border border-border/50 space-y-2">
              <h3 className="text-sm font-semibold text-purple-400">⏱️ Pattern-Specific</h3>
              <ul className="space-y-1.5 text-sm text-muted-foreground">
                <li className="flex items-start gap-2"><span className="text-warning mt-0.5 shrink-0">•</span>Serum K+, TSH, TFT (periodic paralysis)</li>
                <li className="flex items-start gap-2"><span className="text-warning mt-0.5 shrink-0">•</span>Acetylcholine receptor antibodies (MG)</li>
                <li className="flex items-start gap-2"><span className="text-warning mt-0.5 shrink-0">•</span>Repetitive nerve stimulation / SFEMG (MG)</li>
                <li className="flex items-start gap-2"><span className="text-warning mt-0.5 shrink-0">•</span>Polysomnography (OSA)</li>
                <li className="flex items-start gap-2"><span className="text-warning mt-0.5 shrink-0">•</span>Epworth Sleepiness Scale</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Polymyalgia Rheumatica */}
      <Card className="border-border/60">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-warning" />
            Polymyalgia Rheumatica (PMR) — Differential Diagnosis
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            PMR presents with proximal muscle pain &amp; stiffness (&gt;45 yrs, elevated ESR/CRP).
            Key differentials to consider:
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-muted/40 border border-border/50 space-y-2">
              <h3 className="text-sm font-semibold text-purple-400">🩺 Inflammatory / Rheumatologic</h3>
              <ul className="space-y-1.5 text-sm text-muted-foreground">
                <li className="flex items-start gap-2"><span className="text-warning mt-0.5 shrink-0">•</span><strong>Giant Cell Arteritis (GCA)</strong> — may coexist with PMR; headache, jaw claudication, visual symptoms</li>
                <li className="flex items-start gap-2"><span className="text-warning mt-0.5 shrink-0">•</span><strong>Rheumatoid Arthritis</strong> — symmetrical small joint synovitis, RF/anti-CCP positive</li>
                <li className="flex items-start gap-2"><span className="text-warning mt-0.5 shrink-0">•</span><strong>SLE / Lupus</strong> — malar rash, oral ulcers, serositis, ANA positive</li>
                <li className="flex items-start gap-2"><span className="text-warning mt-0.5 shrink-0">•</span><strong>Sjögren&apos;s syndrome</strong> — sicca symptoms, anti-Ro/La</li>
                <li className="flex items-start gap-2"><span className="text-warning mt-0.5 shrink-0">•</span><strong>Systemic Sclerosis</strong> — sclerodactyly, Raynaud&apos;s, telangiectasias</li>
                <li className="flex items-start gap-2"><span className="text-warning mt-0.5 shrink-0">•</span><strong>Idiopathic Inflammatory Myopathies</strong> — dermatomyositis, polymyositis (elevated CK)</li>
                <li className="flex items-start gap-2"><span className="text-warning mt-0.5 shrink-0">•</span><strong>RS3PE syndrome</strong> — remitting seronegative symmetrical synovitis with pitting edema</li>
              </ul>
            </div>

            <div className="p-4 rounded-lg bg-muted/40 border border-border/50 space-y-2">
              <h3 className="text-sm font-semibold text-destructive">🦴 Musculoskeletal / Degenerative</h3>
              <ul className="space-y-1.5 text-sm text-muted-foreground">
                <li className="flex items-start gap-2"><span className="text-warning mt-0.5 shrink-0">•</span><strong>Cervical spondylosis / Radiculopathy</strong> — neck pain radiating to shoulders</li>
                <li className="flex items-start gap-2"><span className="text-warning mt-0.5 shrink-0">•</span><strong>Rotator cuff pathology</strong> — shoulder pain, restricted abduction</li>
                <li className="flex items-start gap-2"><span className="text-warning mt-0.5 shrink-0">•</span><strong>Adhesive capsulitis (Frozen shoulder)</strong> — stiffness, restricted ROM</li>
                <li className="flex items-start gap-2"><span className="text-warning mt-0.5 shrink-0">•</span><strong>Osteoarthritis</strong> — hip/knee pain, morning stiffness &lt;30 min</li>
                <li className="flex items-start gap-2"><span className="text-warning mt-0.5 shrink-0">•</span><strong>Fibromyalgia</strong> — widespread pain, tender points, fatigue, sleep disturbance</li>
              </ul>
            </div>

            <div className="p-4 rounded-lg bg-muted/40 border border-border/50 space-y-2">
              <h3 className="text-sm font-semibold text-warning">🧪 Endocrine / Metabolic</h3>
              <ul className="space-y-1.5 text-sm text-muted-foreground">
                <li className="flex items-start gap-2"><span className="text-warning mt-0.5 shrink-0">•</span><strong>Hypothyroidism</strong> — myalgias, stiffness, elevated TSH</li>
                <li className="flex items-start gap-2"><span className="text-warning mt-0.5 shrink-0">•</span><strong>Hyperparathyroidism</strong> — bone pain, proximal weakness, elevated Ca</li>
                <li className="flex items-start gap-2"><span className="text-warning mt-0.5 shrink-0">•</span><strong>Osteomalacia</strong> — bone pain, proximal myopathy, low Vit D</li>
                <li className="flex items-start gap-2"><span className="text-warning mt-0.5 shrink-0">•</span><strong>Diabetes (stiff hand syndrome)</strong> — limited joint mobility</li>
              </ul>
            </div>

            <div className="p-4 rounded-lg bg-muted/40 border border-border/50 space-y-2">
              <h3 className="text-sm font-semibold text-success">🧬 Infections / Malignancy / Other</h3>
              <ul className="space-y-1.5 text-sm text-muted-foreground">
                <li className="flex items-start gap-2"><span className="text-warning mt-0.5 shrink-0">•</span><strong>Viral myalgias</strong> — influenza, COVID-19, EBV, chikungunya</li>
                <li className="flex items-start gap-2"><span className="text-warning mt-0.5 shrink-0">•</span><strong>Paraneoplastic syndromes</strong> — associated with occult malignancy</li>
                <li className="flex items-start gap-2"><span className="text-warning mt-0.5 shrink-0">•</span><strong>Multiple myeloma</strong> — bone pain, anemia, monoclonal gammopathy</li>
                <li className="flex items-start gap-2"><span className="text-warning mt-0.5 shrink-0">•</span><strong>Drug-induced myalgias</strong> — statins, glucocorticoid withdrawal, fluoroquinolones</li>
                <li className="flex items-start gap-2"><span className="text-warning mt-0.5 shrink-0">•</span><strong>Chronic infections</strong> — TB, HIV, hepatitis B/C</li>
                <li className="flex items-start gap-2"><span className="text-warning mt-0.5 shrink-0">•</span><strong>Parkinson&apos;s disease</strong> — rigidity, bradykinesia, tremor (can mimic PMR stiffness)</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Disclaimer */}
      <p className="text-xs text-muted-foreground text-center">
        This is a clinical decision support tool. Always correlate with history, examination, and appropriate investigations.
      </p>
    </div>
  );
}
