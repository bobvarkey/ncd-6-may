import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Stethoscope } from "lucide-react";
import ImageLink from "@/components/ImageLink";

export default function WeightLoss() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="text-center space-y-3">
        <Badge variant="outline" className="text-sm px-4 py-1 border-amber-400/40 text-warning">
          Unintentional Weight Loss Differential
        </Badge>
        <h1 className="text-3xl font-bold tracking-tight">Clinical Approach to Weight Loss</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          A structured diagnostic framework for evaluating unintentional weight loss —
          guided by appetite, associated symptoms, and key red flags.
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
          <ImageLink imageId="weight-loss-flowchart" label="View Weight Loss Flowchart →" />
        </CardContent>
      </Card>

      {/* Decision Tree */}
      <Card className="border-border/60">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-warning" />
            Decision Tree — Mirror of the Flowchart
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-muted/40 border border-border/50 space-y-2">
              <h3 className="text-sm font-semibold text-warning">🍽️ Increased Appetite</h3>
              <ul className="space-y-1.5 text-sm text-muted-foreground">
                <li className="flex items-start gap-2"><span className="text-warning mt-0.5 shrink-0">•</span><strong>Polyuria / polydipsia</strong> → Diabetes (check HbA1c, FBS)</li>
                <li className="flex items-start gap-2"><span className="text-warning mt-0.5 shrink-0">•</span><strong>Heat intolerance, tremor, palpitations</strong> → Hyperthyroidism (TSH, Free T4)</li>
                <li className="flex items-start gap-2"><span className="text-warning mt-0.5 shrink-0">•</span>If neither → still consider cancer</li>
              </ul>
            </div>

            <div className="p-4 rounded-lg bg-muted/40 border border-border/50 space-y-2">
              <h3 className="text-sm font-semibold text-warning">🌡️ Fever / Night Sweats</h3>
              <ul className="space-y-1.5 text-sm text-muted-foreground">
                <li className="flex items-start gap-2"><span className="text-warning mt-0.5 shrink-0">•</span><strong>Tuberculosis</strong> — IGRA / Quantiferon, chest X-ray, sputum AFB</li>
                <li className="flex items-start gap-2"><span className="text-warning mt-0.5 shrink-0">•</span>Consider other chronic infections (HIV, endocarditis)</li>
              </ul>
            </div>

            <div className="p-4 rounded-lg bg-muted/40 border border-border/50 space-y-2">
              <h3 className="text-sm font-semibold text-warning">🩺 GI Symptoms</h3>
              <ul className="space-y-1.5 text-sm text-muted-foreground">
                <li className="flex items-start gap-2"><span className="text-warning mt-0.5 shrink-0">•</span><strong>Malabsorption</strong> — anti-TTG, IgA (celiac), stool fat, fecal elastase</li>
              </ul>
            </div>

            <div className="p-4 rounded-lg bg-muted/40 border border-border/50 space-y-2">
              <h3 className="text-sm font-semibold text-purple-400">😟 Mood Changes</h3>
              <ul className="space-y-1.5 text-sm text-muted-foreground">
                <li className="flex items-start gap-2"><span className="text-warning mt-0.5 shrink-0">•</span><strong>Depression</strong> — PHQ-9 screening</li>
                <li className="flex items-start gap-2"><span className="text-warning mt-0.5 shrink-0">•</span>If absent → occult malignancy / cancer workup</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* investigations strip */}
      <Card className="border-border/60">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Stethoscope className="h-5 w-5 text-warning" />
            First-Line Investigations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-muted/40 border border-border/50 space-y-2">
              <h3 className="text-sm font-semibold text-destructive">🧪 Core panel</h3>
              <ul className="space-y-1.5 text-sm text-muted-foreground">
                <li className="flex items-start gap-2"><span className="text-warning mt-0.5 shrink-0">•</span>CBC, ESR/CRP</li>
                <li className="flex items-start gap-2"><span className="text-warning mt-0.5 shrink-0">•</span>HbA1c / fasting glucose (diabetes)</li>
                <li className="flex items-start gap-2"><span className="text-warning mt-0.5 shrink-0">•</span>TSH, Free T4 (thyroid disease)</li>
                <li className="flex items-start gap-2"><span className="text-warning mt-0.5 shrink-0">•</span>LFTs, RFT/eGFR</li>
                <li className="flex items-start gap-2"><span className="text-warning mt-0.5 shrink-0">•</span>Chest X-ray (TB, malignancy, heart failure)</li>
              </ul>
            </div>
            <div className="p-4 rounded-lg bg-muted/40 border border-border/50 space-y-2">
              <h3 className="text-sm font-semibold text-success">🔍 Targeted / second-line</h3>
              <ul className="space-y-1.5 text-sm text-muted-foreground">
                <li className="flex items-start gap-2"><span className="text-warning mt-0.5 shrink-0">•</span>Anti-TTG, IgA (celiac if GI symptoms)</li>
                <li className="flex items-start gap-2"><span className="text-warning mt-0.5 shrink-0">•</span>IGRA / Quantiferon (TB if fever/night sweats)</li>
                <li className="flex items-start gap-2"><span className="text-warning mt-0.5 shrink-0">•</span>Age-appropriate cancer screening; CT chest/abdomen/pelvis if suspicion persists</li>
                <li className="flex items-start gap-2"><span className="text-warning mt-0.5 shrink-0">•</span>PHQ-9 for all with mood symptoms</li>
                <li className="flex items-start gap-2"><span className="text-warning mt-0.5 shrink-0">•</span>HIV serology where risk factors exist</li>
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