import type { AnemiaClassification, Sex, DiscriminantResult } from '../types';
import { Activity, Beaker, AlertCircle, CheckCircle, ArrowRight } from 'lucide-react';

interface Props {
  classification: AnemiaClassification;
  hgb: number;
  mcv: number;
  sex: Sex;
  discriminantResults?: DiscriminantResult[];
}

const severityConfig = {
  None:     { bg: 'bg-emerald-900/30', border: 'border-emerald-800', text: 'text-emerald-400', badge: 'bg-emerald-900/30 text-emerald-400', icon: CheckCircle },
  Mild:     { bg: 'bg-amber-900/30',   border: 'border-amber-800',   text: 'text-warning',   badge: 'bg-amber-900/30 text-warning',   icon: AlertCircle },
  Moderate: { bg: 'bg-orange-900/30',  border: 'border-orange-800',  text: 'text-warning',  badge: 'bg-orange-900/30 text-warning', icon: AlertCircle },
  Severe:   { bg: 'bg-red-900/30',     border: 'border-red-800',     text: 'text-destructive',     badge: 'bg-red-900/30 text-destructive',       icon: AlertCircle },
  'N/A':    { bg: 'bg-card/30',    border: 'border-border',    text: 'text-muted-foreground',    badge: 'bg-card/30 text-muted-foreground',     icon: AlertCircle },
};

const morphologyConfig = {
  Microcytic:  { color: 'text-primary',   bg: 'bg-sky-900/30',    desc: 'MCV < 80 fL — Consider iron deficiency, thalassemia, chronic disease' },
  Normocytic:  { color: 'text-blue-400',  bg: 'bg-blue-900/30',   desc: 'MCV 80–100 fL — Consider hemolysis, acute blood loss, chronic disease' },
  Macrocytic:  { color: 'text-violet-400', bg: 'bg-violet-900/30', desc: 'MCV > 100 fL — Consider B12/folate deficiency, liver disease, medications' },
  'N/A':       { color: 'text-muted-foreground',  bg: 'bg-card/30',   desc: 'MCV not provided' },
};

const sexLabels: Record<Sex, string> = {
  male: 'Adult Male',
  female: 'Adult Female',
  child: 'Child',
  pregnant: 'Pregnant Female',
};

export default function ClassificationCard({ classification, hgb, mcv, sex, discriminantResults }: Props) {
  const sc = severityConfig[classification.severity] || severityConfig['N/A'];
  const mc = morphologyConfig[classification.morphology] || morphologyConfig['N/A'];
  const Icon = sc.icon;

  const mentzer = discriminantResults?.find(r => r.name === 'Mentzer Index');

  return (
    <div className="bg-card rounded-2xl shadow-sm border border-border p-6">
      <div className="flex items-center gap-2 mb-4">
        <Activity className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-semibold text-foreground">Anemia Classification</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Severity */}
        <div className={`rounded-xl p-4 border ${sc.bg} ${sc.border}`}>
          <div className="flex items-center gap-2 mb-2">
            <Icon className={`w-4 h-4 ${sc.text}`} />
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Severity</span>
          </div>
          <div className={`text-2xl font-bold ${sc.text}`}>{classification.severity}</div>
          {classification.severity !== 'N/A' && (
            <div className="mt-1 text-xs text-muted-foreground">
              {classification.severity === 'None'
                ? 'Hemoglobin within normal range'
                : `Hgb ${hgb.toFixed(1)} g/dL — ${sexLabels[sex]}`}
            </div>
          )}
          {classification.severity !== 'None' && classification.severity !== 'N/A' && (
            <div className="mt-2 text-xs text-muted-foreground space-y-0.5">
              <div>Mild: Hgb ≥ {classification.hgbThreshold.mild} g/dL</div>
              <div>Moderate: Hgb ≥ {classification.hgbThreshold.moderate} g/dL</div>
              <div>Severe: Hgb &lt; {classification.hgbThreshold.moderate} g/dL</div>
            </div>
          )}
        </div>

        {/* Morphology */}
        <div className="rounded-xl p-4 border border-border bg-muted/50">
          <div className="flex items-center gap-2 mb-2">
            <Beaker className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Morphology</span>
          </div>
          <div className={`text-2xl font-bold ${mc.color}`}>{classification.morphology}</div>
          {!isNaN(mcv) && (
            <div className="mt-1">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${mc.bg} ${mc.color}`}>
                MCV: {mcv.toFixed(1)} fL
              </span>
            </div>
          )}
          <div className="mt-2 text-xs text-muted-foreground leading-relaxed">{mc.desc}</div>
        </div>
      </div>

      {mentzer && classification.morphology === 'Microcytic' && (
        <div className="mt-4 rounded-xl border border-border bg-muted/50 p-4">
          <div className="flex items-center gap-2 mb-2">
            <ArrowRight className="w-4 h-4 text-primary" />
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Discriminant Index</span>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="text-xl font-bold text-foreground">
              Mentzer: {mentzer.value?.toFixed(2) ?? '—'}
            </div>
            <span className="text-xs text-muted-foreground">cutoff &gt; 13</span>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <span className={`text-sm font-semibold px-2.5 py-0.5 rounded-full ${
              mentzer.interpretation === 'IDA'
                ? 'bg-amber-900/30 text-warning'
                : mentzer.interpretation === 'Thalassemia'
                ? 'bg-violet-900/30 text-violet-400'
                : 'bg-muted text-muted-foreground'
            }`}>
              {mentzer.interpretation === 'IDA' && '→ Iron Deficiency Anemia'}
              {mentzer.interpretation === 'Thalassemia' && '→ Thalassemia Trait'}
              {mentzer.interpretation === 'N/A' && 'Inconclusive'}
            </span>
          </div>
          <div className="mt-2 text-xs text-muted-foreground">
            {mentzer.direction} — {mentzer.reference}
          </div>
        </div>
      )}

      <div className="mt-4 text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2 border border-border">
        WHO 2024 criteria — Classification based on hemoglobin thresholds for {sexLabels[sex].toLowerCase()}
      </div>
    </div>
  );
}
