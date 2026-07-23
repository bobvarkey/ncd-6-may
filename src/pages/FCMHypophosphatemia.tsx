import { useState } from "react";
import { Bone, ChevronDown, ChevronUp, AlertTriangle, Info, Syringe, Stethoscope, ShieldAlert } from "lucide-react";

type Severity = "none" | "mild" | "moderate" | "severe" | "life_threatening";

interface InputState {
  phosphate: string;
  bonePain: boolean;
  proximalWeakness: boolean;
  fatigue: boolean;
  fracture: boolean;
  respiratoryFailure: boolean;
  cardiacDysfunction: boolean;
  rhabdomyolysis: boolean;
  fcmReexposure: boolean;
  // Risk factors
  ibd: boolean;
  lowBmi: boolean;
  baselineHypo: boolean;
  vitDDeficiency: boolean;
  hyperPTH: boolean;
  antiresorptive: boolean;
  priorFcmHypo: boolean;
}

const defaultState: InputState = {
  phosphate: "",
  bonePain: false,
  proximalWeakness: false,
  fatigue: false,
  fracture: false,
  respiratoryFailure: false,
  cardiacDysfunction: false,
  rhabdomyolysis: false,
  fcmReexposure: false,
  ibd: false,
  lowBmi: false,
  baselineHypo: false,
  vitDDeficiency: false,
  hyperPTH: false,
  antiresorptive: false,
  priorFcmHypo: false,
};

function classifySeverity(s: InputState): Severity {
  const phos = parseFloat(s.phosphate);
  if (isNaN(phos)) return "none";

  const hasBoneSymptoms = s.bonePain || s.proximalWeakness || s.fracture;
  const hasGeneralSymptoms = s.fatigue;
  const hasLifeThreatening = s.respiratoryFailure || s.cardiacDysfunction || s.rhabdomyolysis;

  if (phos < 0.4 && hasLifeThreatening) return "life_threatening";
  if (phos < 0.4 && (hasBoneSymptoms || hasGeneralSymptoms)) return "severe";
  if (phos >= 0.4 && phos < 0.6 && (hasBoneSymptoms || hasGeneralSymptoms || s.fracture)) return "moderate";
  if (phos >= 0.6 && !hasBoneSymptoms && !hasGeneralSymptoms) return "mild";
  return "none";
}

const severityConfig: Record<Severity, { label: string; color: string; border: string; bg: string; icon: any }> = {
  none: { label: "—", color: "", border: "", bg: "", icon: Info },
  mild: {
    label: "Mild Asymptomatic",
    color: "text-emerald-400",
    border: "border-emerald-800/30",
    bg: "bg-emerald-900/10",
    icon: Info,
  },
  moderate: {
    label: "Moderate Symptomatic",
    color: "text-amber-400",
    border: "border-amber-800/30",
    bg: "bg-amber-900/10",
    icon: AlertTriangle,
  },
  severe: {
    label: "Severe (Non-Life-Threatening)",
    color: "text-orange-400",
    border: "border-orange-800/30",
    bg: "bg-orange-900/10",
    icon: AlertTriangle,
  },
  life_threatening: {
    label: "Life-Threatening",
    color: "text-rose-400",
    border: "border-rose-800/30",
    bg: "bg-rose-900/10",
    icon: ShieldAlert,
  },
};

function Checkbox({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
  return (
    <label className="flex items-center gap-2 p-2 rounded-lg border border-border bg-card/50 cursor-pointer hover:bg-accent/30 transition-colors text-xs">
      <input type="checkbox" checked={checked} onChange={onChange} className="rounded border-border accent-primary" />
      <span className="text-muted-foreground">{label}</span>
    </label>
  );
}

export default function FCMHypophosphatemia() {
  const [inputs, setInputs] = useState<InputState>(defaultState);
  const [showDetails, setShowDetails] = useState(false);

  const severity = classifySeverity(inputs);
  const cfg = severityConfig[severity];
  const hasRiskFactors = inputs.ibd || inputs.lowBmi || inputs.baselineHypo || inputs.vitDDeficiency || inputs.hyperPTH || inputs.antiresorptive || inputs.priorFcmHypo;
  const riskCount = [inputs.ibd, inputs.lowBmi, inputs.baselineHypo, inputs.vitDDeficiency, inputs.hyperPTH, inputs.antiresorptive, inputs.priorFcmHypo].filter(Boolean).length;

  const set = (key: keyof InputState) => (val: boolean | string) =>
    setInputs(prev => ({ ...prev, [key]: val }));

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl bg-rose-900/20 flex items-center justify-center">
          <Bone className="w-5 h-5 text-rose-400" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-foreground">FCM-Induced Hypophosphatemia</h1>
          <p className="text-xs text-muted-foreground">Clinical Decision Support Algorithm</p>
        </div>
      </div>

      <p className="text-xs text-muted-foreground leading-relaxed">
        Ferric carboxymaltose (FCM) causes hypophosphatemia via <strong className="text-foreground">FGF23-mediated renal phosphate wasting</strong>.
        Check serum phosphate <strong className="text-foreground">1–2 weeks</strong> after FCM infusion in high-risk or symptomatic patients.
        Risk is formulation-specific — lower with ferric derisomaltose and iron sucrose.
      </p>

      {/* Phosphate Input */}
      <div className="rounded-xl border border-border bg-card p-4">
        <label className="text-xs font-semibold text-foreground mb-2 block">
          Serum Phosphate (mmol/L)
        </label>
        <input
          type="number"
          step="0.01"
          min="0"
          max="2"
          placeholder="e.g. 0.45"
          value={inputs.phosphate}
          onChange={e => set("phosphate")(e.target.value)}
          className="w-full max-w-[200px] h-9 px-3 rounded-lg border border-border bg-muted text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>

      {/* Symptoms */}
      <div className="rounded-xl border border-border bg-card p-4">
        <h3 className="text-xs font-semibold text-foreground mb-3 flex items-center gap-2">
          <Stethoscope className="w-3.5 h-3.5 text-primary" />
          Symptoms
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
          <Checkbox label="Bone pain" checked={inputs.bonePain} onChange={() => setInputs(p => ({ ...p, bonePain: !p.bonePain }))} />
          <Checkbox label="Proximal muscle weakness" checked={inputs.proximalWeakness} onChange={() => setInputs(p => ({ ...p, proximalWeakness: !p.proximalWeakness }))} />
          <Checkbox label="Fatigue" checked={inputs.fatigue} onChange={() => setInputs(p => ({ ...p, fatigue: !p.fatigue }))} />
          <Checkbox label="Fracture / stress fracture" checked={inputs.fracture} onChange={() => setInputs(p => ({ ...p, fracture: !p.fracture }))} />
          <Checkbox label="Respiratory failure" checked={inputs.respiratoryFailure} onChange={() => setInputs(p => ({ ...p, respiratoryFailure: !p.respiratoryFailure }))} />
          <Checkbox label="Cardiac dysfunction / arrhythmia" checked={inputs.cardiacDysfunction} onChange={() => setInputs(p => ({ ...p, cardiacDysfunction: !p.cardiacDysfunction }))} />
          <Checkbox label="Rhabdomyolysis" checked={inputs.rhabdomyolysis} onChange={() => setInputs(p => ({ ...p, rhabdomyolysis: !p.rhabdomyolysis }))} />
        </div>
      </div>

      {/* Risk Factors */}
      <div className="rounded-xl border border-amber-800/30 bg-amber-900/5 p-4">
        <h3 className="text-xs font-semibold text-foreground mb-3 flex items-center gap-2">
          <AlertTriangle className="w-3.5 h-3.5 text-warning" />
          High-Risk Factors
          {riskCount > 0 && (
            <span className="text-[10px] bg-amber-900/30 text-warning border border-amber-800 px-2 py-0.5 rounded-full">{riskCount}</span>
          )}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
          <Checkbox label="IBD / malabsorption" checked={inputs.ibd} onChange={() => setInputs(p => ({ ...p, ibd: !p.ibd }))} />
          <Checkbox label="Low BMI / malnutrition" checked={inputs.lowBmi} onChange={() => setInputs(p => ({ ...p, lowBmi: !p.lowBmi }))} />
          <Checkbox label="Baseline hypophosphatemia" checked={inputs.baselineHypo} onChange={() => setInputs(p => ({ ...p, baselineHypo: !p.baselineHypo }))} />
          <Checkbox label="Vitamin D deficiency" checked={inputs.vitDDeficiency} onChange={() => setInputs(p => ({ ...p, vitDDeficiency: !p.vitDDeficiency }))} />
          <Checkbox label="Hyperparathyroidism" checked={inputs.hyperPTH} onChange={() => setInputs(p => ({ ...p, hyperPTH: !p.hyperPTH }))} />
          <Checkbox label="Antiresorptive therapy" checked={inputs.antiresorptive} onChange={() => setInputs(p => ({ ...p, antiresorptive: !p.antiresorptive }))} />
          <Checkbox label="Prior FCM hypophosphatemia" checked={inputs.priorFcmHypo} onChange={() => setInputs(p => ({ ...p, priorFcmHypo: !p.priorFcmHypo }))} />
        </div>
      </div>

      {/* Re-exposure */}
      <div className="rounded-xl border border-red-800/30 bg-red-900/5 p-4">
        <h3 className="text-xs font-semibold text-foreground mb-3 flex items-center gap-2">
          <Syringe className="w-3.5 h-3.5 text-destructive" />
          FCM Re-Exposure Planned
        </h3>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setInputs(p => ({ ...p, fcmReexposure: true }))}
            className={`rounded-full border px-4 py-1.5 text-xs font-medium transition-all ${
              inputs.fcmReexposure
                ? "border-red-500 bg-red-900/20 text-red-400"
                : "border-border bg-card text-muted-foreground hover:bg-muted/40"
            }`}
          >
            Yes
          </button>
          <button
            type="button"
            onClick={() => setInputs(p => ({ ...p, fcmReexposure: false }))}
            className={`rounded-full border px-4 py-1.5 text-xs font-medium transition-all ${
              !inputs.fcmReexposure
                ? "border-emerald-500 bg-emerald-900/20 text-emerald-400"
                : "border-border bg-card text-muted-foreground hover:bg-muted/40"
            }`}
          >
            No
          </button>
        </div>
      </div>

      {/* Result */}
      {severity !== "none" && (
        <div className={`rounded-xl border-2 ${cfg.border} ${cfg.bg} p-4`}>
          <div className="flex items-center gap-2 mb-3">
            <cfg.icon className={`w-5 h-5 ${cfg.color}`} />
            <span className={`text-sm font-bold ${cfg.color}`}>{cfg.label}</span>
            <span className="text-[11px] font-mono text-muted-foreground ml-auto">
              PO₄ = {inputs.phosphate} mmol/L
            </span>
          </div>

          {/* Management by severity */}
          {severity === "mild" && (
            <ul className="space-y-1.5 text-xs text-muted-foreground">
              <li>• Discontinue FCM</li>
              <li>• No phosphate replacement needed</li>
              <li>• Check vitamin D &amp; PTH if high-risk</li>
              <li>• Repeat phosphate in 1–2 weeks</li>
            </ul>
          )}

          {severity === "moderate" && (
            <ul className="space-y-1.5 text-xs text-muted-foreground">
              <li>• Discontinue FCM</li>
              <li>• Outpatient management if no red flags</li>
              <li>• Measure vitamin D, PTH, calcium, eGFR</li>
              <li>• Replete vitamin D if deficient</li>
              <li>• Start calcitriol if PTH elevated or osteomalacia suspected</li>
              <li>• Avoid routine oral phosphate (short course only if severe &amp; monitored)</li>
              <li>• Monitor phosphate, calcium, PTH q1–2wk until normalization</li>
              <li>• Consider spine/pelvis/hip imaging if bone pain or fracture suspected</li>
            </ul>
          )}

          {severity === "severe" && (
            <ul className="space-y-1.5 text-xs text-muted-foreground">
              <li>• Admit or observe unit</li>
              <li>• Discontinue FCM</li>
              <li>• Prioritize calcitriol &amp; vitamin D repletion</li>
              <li>• Consider IV phosphate if PO₄ &lt; 0.3 or symptoms severe</li>
              <li>• Avoid chronic high-dose oral phosphate (phosphaturia)</li>
              <li>• Monitor phosphate, calcium, PTH daily until stable</li>
              <li>• Evaluate for insufficiency fractures</li>
              <li>• Follow up with endocrinology / metabolic bone clinic</li>
            </ul>
          )}

          {severity === "life_threatening" && (
            <ul className="space-y-1.5 text-xs text-muted-foreground">
              <li className="text-rose-400 font-semibold">🚨 ICU admission</li>
              <li>• Discontinue FCM</li>
              <li>• IV phosphate with continuous cardiac monitoring</li>
              <li>• Start calcitriol &amp; replete vitamin D if deficient</li>
              <li>• Serial phosphate, calcium, PTH q6–12h initially</li>
              <li>• Anticipate repeated IV phosphate until FGF23 wasting resolves</li>
            </ul>
          )}

          {/* Re-exposure override */}
          {inputs.fcmReexposure && (
            <div className="mt-3 p-3 rounded-lg border border-red-800/30 bg-red-900/10">
              <p className="text-xs font-semibold text-destructive mb-1">⚠️ FCM Re-Exposure Planned</p>
              <p className="text-xs text-muted-foreground">
                <strong className="text-muted-foreground">Avoid FCM</strong> — recommend alternative IV iron: ferric derisomaltose, iron sucrose, or ferumoxytol.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Prevention & Monitoring — collapsible */}
      <div className="rounded-xl border border-border overflow-hidden bg-card">
        <button
          type="button"
          onClick={() => setShowDetails(v => !v)}
          className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-accent/50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">Prevention &amp; Monitoring</span>
          </div>
          {showDetails ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </button>
        {showDetails && (
          <div className="px-4 pb-4 border-t border-border space-y-3">
            <div className="pt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 rounded-lg border border-border bg-muted/30">
                <h4 className="text-xs font-semibold text-foreground mb-1.5">Post-FCM Monitoring</h4>
                <p className="text-xs text-muted-foreground">Check phosphate at 1–2 weeks in high-risk or symptomatic patients.</p>
              </div>
              <div className="p-3 rounded-lg border border-border bg-muted/30">
                <h4 className="text-xs font-semibold text-foreground mb-1.5">Future IV Iron Selection</h4>
                <p className="text-xs text-muted-foreground">Prefer non-FCM formulation if any history of FCM hypophosphatemia or high risk.</p>
              </div>
              <div className="p-3 rounded-lg border border-border bg-muted/30 sm:col-span-2">
                <h4 className="text-xs font-semibold text-foreground mb-1.5">Patient Education</h4>
                <p className="text-xs text-muted-foreground">Warn about symptoms: fatigue, bone pain, proximal weakness, gait change. Advise early testing if symptoms develop.</p>
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground italic">
              Mechanism: FCM increases intact FGF23 → renal phosphate wasting &amp; calcitriol suppression.
              Risk is formulation-specific (lower with ferric derisomaltose and iron sucrose).
            </p>
          </div>
        )}
      </div>

      {/* Reset */}
      <button
        type="button"
        onClick={() => { setInputs(defaultState); setShowDetails(false); }}
        className="text-xs text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2"
      >
        Reset all inputs
      </button>
    </div>
  );
}
