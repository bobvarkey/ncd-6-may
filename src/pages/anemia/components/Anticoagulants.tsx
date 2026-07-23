import { useState, useMemo } from 'react';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Pill,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  FlaskConical,
  Stethoscope,
  Syringe,
  HeartPulse,
  BookOpen,
  Scale,
  FileText,
  ImageIcon,
  ToggleLeft,
  Info,
  XCircle,
  ArrowRight, Heart, Activity,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const indications = [
  { indication: 'Non-valvular Atrial Fibrillation', preferred_drug: 'DOAC (Apixaban preferred)', duration: 'Lifelong', notes: 'Based on CHA2DS2-VASc score' },
  { indication: 'Mechanical Prosthetic Valves (AVR / MVR)', preferred_drug: 'Warfarin', duration: 'Lifelong', notes: 'DOACs contraindicated' },
  { indication: 'Rheumatic Mitral Stenosis with AF', preferred_drug: 'Warfarin', duration: 'Lifelong', notes: 'Valvular AF' },
  { indication: 'Unprovoked DVT / PE', preferred_drug: 'DOAC', duration: 'Extended / Lifelong', notes: 'If bleeding risk acceptable' },
  { indication: 'Recurrent DVT / PE', preferred_drug: 'DOAC', duration: 'Lifelong', notes: 'Strong indication' },
  { indication: 'Cancer-associated VTE', preferred_drug: 'Apixaban / LMWH', duration: 'While cancer active', notes: 'DOACs now preferred in many cancers' },
  { indication: 'Antiphospholipid Syndrome (Triple positive)', preferred_drug: 'Warfarin', duration: 'Lifelong', notes: 'DOACs generally avoided' },
  { indication: 'Left Ventricular Thrombus (post-MI)', preferred_drug: 'Warfarin / DOAC', duration: '3-6 months', notes: 'Repeat imaging' },
  { indication: 'Severe Inherited Thrombophilia', preferred_drug: 'DOAC / Warfarin', duration: 'Often lifelong', notes: 'Individualized' },
];

const drugComparison = [
  { drug: 'Apixaban', class: 'Factor Xa inhibitor', dose: '5 mg BID', renal: '2.5 mg BID if 2 of: Age ≥80 yr, Wt ≤60 kg, SCr ≥1.5 mg/dL', monitoring: 'No routine monitoring' },
  { drug: 'Rivaroxaban', class: 'Factor Xa inhibitor', dose: '20 mg OD with food', renal: '15 mg OD if CrCl 15–49 mL/min', monitoring: 'No routine monitoring' },
  { drug: 'Dabigatran', class: 'Direct thrombin inhibitor', dose: '150 mg BID', renal: 'Avoid if CrCl <30 mL/min', monitoring: 'No routine monitoring' },
  { drug: 'Edoxaban', class: 'Factor Xa inhibitor', dose: '60 mg OD', renal: '30 mg OD if CrCl 15–50 mL/min or wt ≤60 kg', monitoring: 'No routine monitoring' },
  { drug: 'Warfarin', class: 'Vitamin K antagonist', dose: 'INR guided (2–3 generally)', renal: 'No adjustment', monitoring: 'INR mandatory' },
];

const afDosing = [
  { drug: 'Apixaban', dose: '5 mg BID', notes: '' },
  { drug: 'Apixaban (Reduced)', dose: '2.5 mg BID if 2 of: Age ≥80 yr, Weight ≤60 kg, Serum creatinine ≥1.5 mg/dL', notes: '' },
  { drug: 'Rivaroxaban', dose: '20 mg OD with food (15 mg OD if CrCl 15–49 mL/min)', notes: '' },
  { drug: 'Dabigatran', dose: '150 mg BID (110 mg BID in elderly / high bleeding risk)', notes: '' },
  { drug: 'Edoxaban', dose: '60 mg OD', notes: '' },
  { drug: 'Warfarin', dose: 'INR target 2–3', notes: '' },
];

const dvtPeDosing = {
  initial: [
    { drug: 'Apixaban', dose: '10 mg BID × 7 days' },
    { drug: 'Rivaroxaban', dose: '15 mg BID × 21 days' },
    { drug: 'Dabigatran', dose: 'Heparin for 5–10 days then 150 mg BID' },
    { drug: 'Edoxaban', dose: 'Heparin for 5–10 days then 60 mg OD' },
    { drug: 'Warfarin', dose: 'Heparin overlap (min 5 days)' },
  ],
  maintenance: [
    { drug: 'Apixaban', dose: '5 mg BID' },
    { drug: 'Rivaroxaban', dose: '20 mg OD' },
    { drug: 'Dabigatran', dose: '150 mg BID' },
    { drug: 'Edoxaban', dose: '60 mg OD' },
    { drug: 'Warfarin', dose: 'INR 2–3' },
  ],
  extended: [
    { drug: 'Apixaban', dose: '2.5 mg BID after 6 months' },
    { drug: 'Rivaroxaban', dose: '10 mg OD after 6 months' },
    { drug: 'Dabigatran', dose: '150 mg BID' },
    { drug: 'Edoxaban', dose: '60 mg OD' },
    { drug: 'Warfarin', dose: 'INR 2–3' },
  ],
};

const inrTargets = [
  { condition: 'Atrial Fibrillation', target: '2.0–3.0' },
  { condition: 'DVT / PE', target: '2.0–3.0' },
  { condition: 'Bioprosthetic Valve', target: '2.0–3.0' },
  { condition: 'Mechanical AVR', target: '2.5–3.5' },
  { condition: 'Mechanical AVR + Risk Factors*', target: '3.0–3.5' },
  { condition: 'Mechanical MVR', target: '2.5–3.5' },
  { condition: 'Antiphospholipid Syndrome', target: '2.0–3.0 (sometimes 3.0–4.0)' },
];

const specialSituations = [
  { situation: 'Mechanical valve', drug: 'Warfarin' },
  { situation: 'Rheumatic MS with AF', drug: 'Warfarin' },
  { situation: 'Triple positive APS', drug: 'Warfarin' },
  { situation: 'Active cancer with VTE', drug: 'Apixaban / LMWH' },
  { situation: 'Elderly with high bleeding risk', drug: 'Apixaban' },
  { situation: 'CKD (non-dialysis)', drug: 'Apixaban' },
  { situation: 'Pregnancy', drug: 'LMWH' },
  { situation: 'Breastfeeding', drug: 'Warfarin / LMWH' },
];

const reversalAgents = [
  { drug: 'Warfarin', agent: 'Vitamin K + 4-factor PCC / FFP' },
  { drug: 'Dabigatran', agent: 'Idarucizumab' },
  { drug: 'Apixaban', agent: 'Andexanet alfa' },
  { drug: 'Rivaroxaban', agent: 'Andexanet alfa' },
  { drug: 'Edoxaban', agent: 'Andexanet alfa' },
  { drug: 'Any DOAC (if specific antidote not available)', agent: '4-factor PCC' },
];

const landmarkTrials = [
  { trial: 'RE-LY (2009)', drug: 'Dabigatran', compared: 'Warfarin', population: 'Non-valvular AF', results: '150 mg BID = stroke vs warfarin; similar major bleeding; 110 mg lower bleed', impact: 'First DOAC success in AF' },
  { trial: 'ROCKET-AF (2011)', drug: 'Rivaroxaban', compared: 'Warfarin', population: 'Non-valvular AF', results: 'Non-inferior for stroke/SE', impact: 'Established rivaroxaban in AF' },
  { trial: 'ARISTOTLE (2011)', drug: 'Apixaban', compared: 'Warfarin', population: 'Non-valvular AF', results: '↓ Stroke, ↓ major bleeding, ↓ mortality', impact: 'Apixaban became preferred DOAC' },
  { trial: 'ENGAGE AF-TIMI 48 (2013)', drug: 'Edoxaban', compared: 'Warfarin', population: 'Non-valvular AF', results: 'Non-inferior; lower bleeding with lower dose', impact: 'Edoxaban effective & safe' },
  { trial: 'EINSTEIN-DVT (2010)', drug: 'Rivaroxaban', compared: 'Enoxaparin / Warfarin', population: 'Acute DVT', results: 'Non-inferior for VTE recurrence, similar bleeding', impact: 'Single drug approach validated' },
  { trial: 'EINSTEIN-PE (2012)', drug: 'Rivaroxaban', compared: 'Enoxaparin / Warfarin', population: 'Acute PE', results: 'Non-inferior; no increase in major bleeding', impact: 'Effective for PE treatment' },
  { trial: 'AMPLIFY (2013)', drug: 'Apixaban', compared: 'Conventional therapy', population: 'Acute VTE', results: 'Non-inferior; ↓ major bleeding', impact: 'One of the best VTE trials' },
  { trial: 'AMPLIFY-EXT (2013)', drug: 'Apixaban', compared: 'Placebo', population: 'After 6–12 mo VTE', results: 'Reduced recurrent VTE; no significant increase in major bleeding', impact: 'Supports extended low-dose therapy' },
  { trial: 'RE-MEDY (2013)', drug: 'Dabigatran', compared: 'Warfarin', population: 'VTE (extended)', results: 'Non-inferior for recurrence; similar bleeding', impact: 'Extended therapy effective' },
  { trial: 'RE-ALIGN (2013)', drug: 'Dabigatran', compared: 'Warfarin', population: 'Mechanical valves', results: '↑ Thrombosis & bleeding with dabigatran', impact: 'DOACs contraindicated in mechanical valves' },
];

const pearls = [
  'Best overall DOAC: Apixaban',
  'Best in elderly / CKD: Apixaban',
  'Best in mechanical valve / APS: Warfarin only',
  'DOAC with specific antidote: Dabigatran (Idarucizumab)',
  'Factor Xa inhibitor antidote: Andexanet alfa',
  'Lowest intracranial hemorrhage risk: Apixaban',
  'Highest GI bleed risk among DOACs: Rivaroxaban / Dabigatran',
];

const takeHomeMessages = [
  'AF → Apixaban 5 mg BID is often the default choice',
  'DVT/PE → Apixaban or Rivaroxaban preferred',
  'Mechanical valve or APS → Warfarin only',
  'Unprovoked recurrent VTE → Consider lifelong anticoagulation after bleeding risk assessment',
  'Always balance thrombosis risk against bleeding risk (HAS-BLED, renal function, age, prior hemorrhage)',
];

// ─── HIT Risk Toggle & Fondaparinux ───────────────────────────────────

type HitStatus = 'none' | 'suspected' | 'confirmed' | 'history';
type RenalStatus = 'normal_mild' | 'moderate' | 'severe_dialysis';
type HemodynamicStatus = 'stable' | 'unstable';
type Indication = 'vte_treatment' | 'vte_prophylaxis_medical' | 'vte_prophylaxis_surgical' | 'af' | 'other';

interface HitState {
  status: HitStatus;
  currentAnticoagulant: 'ufh_iv' | 'ufh_sc' | 'lmwh' | 'doac' | 'warfarin' | 'none';
  renalStatus: RenalStatus;
  hemodynamicStatus: HemodynamicStatus;
  indication: Indication;
  weightKg: string;
}

const defaultHitState: HitState = {
  status: 'none',
  currentAnticoagulant: 'none',
  renalStatus: 'normal_mild',
  hemodynamicStatus: 'stable',
  indication: 'vte_treatment',
  weightKg: '70',
};

function getFondaparinuxDose(indication: Indication, weightKg: number, renal: RenalStatus): { dose: string; notes: string } {
  if (renal === 'severe_dialysis') {
    return { dose: 'CONTRAINDICATED', notes: 'Avoid fondaparinux in CrCl <30 mL/min or dialysis' };
  }
  if (indication === 'vte_treatment') {
    if (weightKg < 50) return { dose: '5 mg SC daily', notes: 'Weight-based dosing for VTE treatment' };
    if (weightKg <= 100) return { dose: '7.5 mg SC daily', notes: 'Standard VTE treatment dose' };
    return { dose: '10 mg SC daily', notes: 'Higher dose for weight >100 kg' };
  }
  if (indication === 'vte_prophylaxis_surgical') {
    if (weightKg < 50) return { dose: '1.5 mg SC daily', notes: 'Low weight prophylaxis' };
    if (weightKg <= 100) return { dose: '2.5 mg SC daily', notes: 'Standard surgical prophylaxis dose' };
    return { dose: '2.5 mg SC daily', notes: 'Standard dose; consider bleeding risk if >100 kg' };
  }
  // medical prophylaxis or other
  return { dose: '2.5 mg SC daily', notes: 'Standard medical VTE prophylaxis dose' };
}

function getHitRecommendations(state: HitState): { recommendations: string[]; fondaparinuxDose?: string; fondaparinuxNotes?: string; color: string; title: string } {
  const isHitActive = state.status === 'suspected' || state.status === 'confirmed' || state.status === 'history';
  
  if (!isHitActive) {
    return {
      title: 'HIT Risk Not Active',
      color: 'bg-green-900/20 text-green-400 border-green-500/30',
      recommendations: ['No HIT concern identified. Standard anticoagulation protocols apply.'],
    };
  }

  const recs: string[] = [];
  const isOnHeparin = state.currentAnticoagulant === 'ufh_iv' || state.currentAnticoagulant === 'ufh_sc' || state.currentAnticoagulant === 'lmwh';

  if (isOnHeparin) {
    recs.push('🚫 STOP all heparin products immediately (UFH IV, UFH SC, LMWH).');
  }

  if (state.renalStatus === 'severe_dialysis') {
    recs.push('⚠️ Avoid fondaparinux (CrCl <30 mL/min or dialysis).');
    recs.push('→ Suggest argatroban or bivalirudin (parenteral DTI).');
    recs.push('→ DOAC may be considered if appropriate and patient stable.');
    return {
      title: `HIT ${state.status === 'confirmed' ? 'Confirmed' : state.status === 'suspected' ? 'Suspected' : 'History'} — Severe Renal Impairment`,
      color: 'bg-red-900/20 text-red-400 border-red-500/30',
      recommendations: recs,
    };
  }

  if (state.hemodynamicStatus === 'unstable') {
    recs.push('⚠️ Hemodynamically unstable — prefer titratable parenteral non-heparin anticoagulant.');
    recs.push('→ Argatroban (hepatic) or Bivalirudin (renal) — preferred.');
    recs.push('→ Fondaparinux may be considered only if parenteral DTIs unavailable and renal function acceptable.');
    const dose = getFondaparinuxDose(state.indication, parseFloat(state.weightKg) || 70, state.renalStatus);
    return {
      title: `HIT ${state.status === 'confirmed' ? 'Confirmed' : state.status === 'suspected' ? 'Suspected' : 'History'} — Unstable`,
      color: 'bg-red-900/20 text-red-400 border-red-500/30',
      recommendations: recs,
      fondaparinuxDose: dose.dose,
      fondaparinuxNotes: dose.notes,
    };
  }

  if ((state.indication === 'vte_treatment' || state.indication === 'vte_prophylaxis_medical' || state.indication === 'vte_prophylaxis_surgical') &&
      (state.renalStatus === 'normal_mild' || state.renalStatus === 'moderate')) {
    const dose = getFondaparinuxDose(state.indication, parseFloat(state.weightKg) || 70, state.renalStatus);
    recs.push('✅ Fondaparinux is an appropriate non-heparin alternative for this indication.');
    recs.push(`📋 Fondaparinux dose: ${dose.dose} — ${dose.notes}`);
    recs.push('→ Fondaparinux has extremely low risk of HIT (negligible PF4 complex formation).');
    recs.push('→ Monitor for bleeding; no routine lab monitoring required.');
    return {
      title: `HIT ${state.status === 'confirmed' ? 'Confirmed' : state.status === 'suspected' ? 'Suspected' : 'History'} — Fondaparinux Recommended`,
      color: 'bg-amber-900/20 text-amber-400 border-amber-500/30',
      recommendations: recs,
      fondaparinuxDose: dose.dose,
      fondaparinuxNotes: dose.notes,
    };
  }

  recs.push('⚠️ Fondaparinux not first-line for this indication.');
  recs.push('→ Consider guideline-preferred non-heparin option (argatroban, bivalirudin, or DOAC).');
  return {
    title: `HIT ${state.status === 'confirmed' ? 'Confirmed' : state.status === 'suspected' ? 'Suspected' : 'History'} — Alternative Indication`,
    color: 'bg-amber-900/20 text-amber-400 border-amber-500/30',
    recommendations: recs,
  };
}

function CollapsibleSection({ title, icon: Icon, defaultOpen = false, children }: { title: string; icon: any; defaultOpen?: boolean; children: React.ReactNode }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-border rounded-xl overflow-hidden bg-card">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-accent/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-primary" />
          <span className="font-semibold text-sm">{title}</span>
        </div>
        {open ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
      </button>
      {open && <div className="px-4 pb-4 border-t border-border pt-3">{children}</div>}
    </div>
  );
}

function Table({ headers, rows, renderRow }: { headers: string[]; rows: any[]; renderRow: (row: any, i: number) => React.ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-border">
            {headers.map((h, i) => (
              <th key={i} className="text-left py-2 px-2 font-semibold text-muted-foreground whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-border/50 last:border-0 hover:bg-accent/30">
              {renderRow(row, i)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function Anticoagulants() {
  const [showInfographic, setShowInfographic] = useState(false);
  const [hitState, setHitState] = useState<HitState>(defaultHitState);

  // ── CHA2DS2-VASc state ──
  const [cha2ds2Vasc, setCha2ds2Vasc] = useState<Record<string, boolean>>({
    chf: false, htn: false, age65_74: false, age75: false,
    dm: false, stroke: false, vascular: false, female: false,
  });

  const cha2ds2VascTotal = useMemo(() => {
    let t = 0;
    if (cha2ds2Vasc.chf) t += 1;
    if (cha2ds2Vasc.htn) t += 1;
    if (cha2ds2Vasc.age65_74) t += 1;
    if (cha2ds2Vasc.age75) t += 2;
    if (cha2ds2Vasc.dm) t += 1;
    if (cha2ds2Vasc.stroke) t += 2;
    if (cha2ds2Vasc.vascular) t += 1;
    if (cha2ds2Vasc.female) t += 1;
    return t;
  }, [cha2ds2Vasc]);

  const cha2ds2VascRisk = useMemo(() => {
    const riskMap: Record<number, string> = {
      0: '0% (men) / 0.8% (women) per year',
      1: '1.3% (men) / 2.2% (women) per year',
      2: '2.2% per year',
      3: '3.2% per year',
      4: '4.0% per year',
      5: '6.7% per year',
      6: '9.8% per year',
      7: '9.6% per year',
      8: '6.7% per year',
      9: '15.2% per year',
    };
    return riskMap[cha2ds2VascTotal] || '—';
  }, [cha2ds2VascTotal]);

  const cha2ds2VascRecommendation = useMemo(() => {
    if (cha2ds2VascTotal >= 2) return 'Anticoagulation recommended (Class I).';
    if (cha2ds2VascTotal === 1) return 'Consider anticoagulation (Class IIb).';
    return 'No anticoagulation recommended (Class III).';
  }, [cha2ds2VascTotal]);

  // ── HAS-BLED state ──
  const [hasbled, setHasbled] = useState<Record<string, boolean>>({
    htn_hasbled: false, renal: false, liver: false, stroke_hasbled: false,
    bleeding: false, labile_inr: false, elderly: false, drugs: false,
  });

  const hasbledTotal = useMemo(() => {
    let t = 0;
    if (hasbled.htn_hasbled) t += 1;
    if (hasbled.renal) t += 1;
    if (hasbled.liver) t += 1;
    if (hasbled.stroke_hasbled) t += 1;
    if (hasbled.bleeding) t += 1;
    if (hasbled.labile_inr) t += 1;
    if (hasbled.elderly) t += 1;
    if (hasbled.drugs) t += 1;
    return t;
  }, [hasbled]);

  const hasbledRisk = useMemo(() => {
    const riskMap: Record<number, string> = {
      0: '0.9% per year',
      1: '2.0% per year',
      2: '3.7% per year',
      3: '5.8% per year',
      4: '8.9% per year',
      5: '9.1% per year',
      6: '11.1% per year',
      7: '12.5% per year',
      8: '15.0% per year',
      9: '15.0% per year',
    };
    return riskMap[hasbledTotal] || '—';
  }, [hasbledTotal]);

  const hasbledRecommendation = useMemo(() => {
    if (hasbledTotal >= 3) return 'High bleeding risk. Address modifiable factors. Do NOT withhold anticoagulation solely based on HAS-BLED if CHA₂DS₂-VASc indicates need.';
    return 'Low-moderate bleeding risk. Proceed with anticoagulation as indicated.';
  }, [hasbledTotal]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <Pill className="w-4 h-4 text-primary" />
        </div>
        <div>
          <h2 className="text-base font-bold">Long Term Anticoagulation</h2>
          <p className="text-xs text-muted-foreground">Indications, Drugs, Dosages and Analysis of Papers</p>
        </div>
      </div>

      {/* Infographic */}
      <div className="border border-border rounded-xl overflow-hidden bg-card">
        <button
          onClick={() => setShowInfographic(!showInfographic)}
          className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-accent/50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-primary" />
            <span className="font-semibold text-sm">Anticoagulation Cheat Sheet</span>
          </div>
          {showInfographic ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
        </button>
        {showInfographic && (
          <div className="border-t border-border p-3">
            <img
              src="/images/anticoagulation-reference.jpg"
              alt="Anticoagulation Cheat Sheet"
              className="w-full max-h-[600px] object-contain rounded-lg"
              loading="lazy"
            />
          </div>
        )}
      </div>

      {/* Indications */}
      <CollapsibleSection title="Indications for Long Term Anticoagulation" icon={Stethoscope} defaultOpen>
        <Table
          headers={['Indication', 'Preferred Drug', 'Duration', 'Notes']}
          rows={indications}
          renderRow={(row, i) => (
            <>
              <td className="py-2 px-2 font-medium">{row.indication}</td>
              <td className="py-2 px-2">
                <span className="inline-block bg-primary/10 text-primary px-2 py-0.5 rounded text-[11px] font-medium">{row.preferred_drug}</span>
              </td>
              <td className="py-2 px-2 text-muted-foreground">{row.duration}</td>
              <td className="py-2 px-2 text-muted-foreground">{row.notes}</td>
            </>
          )}
        />
      </CollapsibleSection>

      {/* Drug Comparison */}
      <CollapsibleSection title="Oral Anticoagulants Comparison" icon={Pill} defaultOpen>
        <Table
          headers={['Drug', 'Class / Mechanism', 'Standard Dose', 'Renal Adjustment', 'Monitoring']}
          rows={drugComparison}
          renderRow={(row, i) => (
            <>
              <td className="py-2 px-2 font-medium whitespace-nowrap">{row.drug}</td>
              <td className="py-2 px-2 text-muted-foreground">{row.class}</td>
              <td className="py-2 px-2">{row.dose}</td>
              <td className="py-2 px-2 text-muted-foreground text-[11px]">{row.renal}</td>
              <td className="py-2 px-2">
                <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-medium ${
                  row.monitoring === 'No routine monitoring' ? 'bg-green-900/20 text-green-400' : 'bg-amber-900/20 text-amber-400'
                }`}>{row.monitoring}</span>
              </td>
            </>
          )}
        />
      </CollapsibleSection>

      {/* Rivaroxaban Key Takeaway */}
      <div className="rounded-xl border border-blue-500/30 bg-blue-500/5 p-4 space-y-2">
        <div className="flex items-center gap-2">
          <Info className="h-4 w-4 text-blue-400" />
          <span className="text-sm font-bold text-blue-400">Key Takeaway — Rivaroxaban</span>
        </div>
        <p className="text-xs text-foreground">
          Rivaroxaban is a <strong>BCS Class II</strong> compound with limited aqueous solubility (only 5–7 mg/L) but high permeability.
        </p>
        <ul className="space-y-1 text-xs text-muted-foreground list-disc list-inside">
          <li><strong>Rivaroxaban 15 mg and 20 mg</strong> should be taken <strong>with food</strong> because food increases bioavailability.</li>
          <li><strong>Rivaroxaban 10 mg</strong> can be taken with or without food.</li>
          <li>Food, particularly <strong>fat content and bile acids</strong>, enhances solubilization and absorption.</li>
          <li>Food also <strong>delays gastric emptying</strong>, increasing gastric residence time, which contributes to enhanced dissolution.</li>
        </ul>
        <p className="text-[10px] text-muted-foreground italic">
          BCS Class II: Low solubility, high permeability.
        </p>
      </div>

      {/* Dosing in AF */}
      <CollapsibleSection title="Dosing in Atrial Fibrillation" icon={HeartPulse}>
        <Table
          headers={['Drug', 'Dose', 'Notes']}
          rows={afDosing}
          renderRow={(row, i) => (
            <>
              <td className="py-2 px-2 font-medium whitespace-nowrap">{row.drug}</td>
              <td className="py-2 px-2">{row.dose}</td>
              <td className="py-2 px-2 text-muted-foreground">{row.notes}</td>
            </>
          )}
        />
      </CollapsibleSection>

      {/* Dosing in DVT/PE */}
      <CollapsibleSection title="Dosing in DVT / PE" icon={Syringe}>
        <div className="space-y-4">
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Initial Phase</h4>
            <Table
              headers={['Drug', 'Dose']}
              rows={dvtPeDosing.initial}
              renderRow={(row, i) => (
                <><td className="py-2 px-2 font-medium">{row.drug}</td><td className="py-2 px-2">{row.dose}</td></>
              )}
            />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Maintenance Phase</h4>
            <Table
              headers={['Drug', 'Dose']}
              rows={dvtPeDosing.maintenance}
              renderRow={(row, i) => (
                <><td className="py-2 px-2 font-medium">{row.drug}</td><td className="py-2 px-2">{row.dose}</td></>
              )}
            />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Extended Therapy (after 6 months)</h4>
            <Table
              headers={['Drug', 'Dose']}
              rows={dvtPeDosing.extended}
              renderRow={(row, i) => (
                <><td className="py-2 px-2 font-medium">{row.drug}</td><td className="py-2 px-2">{row.dose}</td></>
              )}
            />
          </div>
        </div>
      </CollapsibleSection>

      {/* INR Targets */}
      <CollapsibleSection title="INR Targets (Warfarin)" icon={Scale}>
        <Table
          headers={['Condition', 'Target INR']}
          rows={inrTargets}
          renderRow={(row, i) => (
            <><td className="py-2 px-2 font-medium">{row.condition}</td><td className="py-2 px-2 font-mono font-bold">{row.target}</td></>
          )}
        />
        <p className="text-[11px] text-muted-foreground mt-2 italic">*Risk factors: AF, prior thromboembolism, LV dysfunction, hypercoagulable state</p>
      </CollapsibleSection>

      {/* Special Clinical Situations */}
      <CollapsibleSection title="Special Clinical Situations" icon={AlertTriangle}>
        <Table
          headers={['Situation', 'Drug of Choice']}
          rows={specialSituations}
          renderRow={(row, i) => (
            <><td className="py-2 px-2 font-medium">{row.situation}</td><td className="py-2 px-2"><span className="inline-block bg-primary/10 text-primary px-2 py-0.5 rounded text-[11px] font-medium">{row.drug}</span></td></>
          )}
        />
      </CollapsibleSection>

      {/* Reversal Agents */}
      <CollapsibleSection title="Reversal Agents" icon={FlaskConical}>
        <Table
          headers={['Drug', 'Reversal Agent']}
          rows={reversalAgents}
          renderRow={(row, i) => (
            <><td className="py-2 px-2 font-medium">{row.drug}</td><td className="py-2 px-2"><span className="inline-block bg-red-900/20 text-red-400 px-2 py-0.5 rounded text-[11px] font-medium">{row.agent}</span></td></>
          )}
        />
      </CollapsibleSection>

      {/* Landmark Trials */}
      <CollapsibleSection title="Landmark Trials — Analysis" icon={BookOpen}>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 px-2 font-semibold text-muted-foreground whitespace-nowrap">Trial (Year)</th>
                <th className="text-left py-2 px-2 font-semibold text-muted-foreground">Drug</th>
                <th className="text-left py-2 px-2 font-semibold text-muted-foreground">Compared With</th>
                <th className="text-left py-2 px-2 font-semibold text-muted-foreground">Population</th>
                <th className="text-left py-2 px-2 font-semibold text-muted-foreground">Key Results</th>
                <th className="text-left py-2 px-2 font-semibold text-muted-foreground">Clinical Impact</th>
              </tr>
            </thead>
            <tbody>
              {landmarkTrials.map((t, i) => (
                <tr key={i} className="border-b border-border/50 last:border-0 hover:bg-accent/30">
                  <td className="py-2 px-2 font-medium whitespace-nowrap">{t.trial}</td>
                  <td className="py-2 px-2">
                    <span className="inline-block bg-primary/10 text-primary px-2 py-0.5 rounded text-[11px] font-medium">{t.drug}</span>
                  </td>
                  <td className="py-2 px-2 text-muted-foreground">{t.compared}</td>
                  <td className="py-2 px-2 text-muted-foreground">{t.population}</td>
                  <td className="py-2 px-2 text-muted-foreground">{t.results}</td>
                  <td className="py-2 px-2 text-muted-foreground italic">{t.impact}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CollapsibleSection>

      {/* High-Yield Pearls */}
      <CollapsibleSection title="High-Yield Pearls" icon={FileText}>
        <ul className="space-y-1.5">
          {pearls.map((p, i) => (
            <li key={i} className="flex items-start gap-2 text-sm">
              <span className="text-primary mt-0.5">•</span>
              <span>{p}</span>
            </li>
          ))}
        </ul>
      </CollapsibleSection>

      {/* Take-Home Messages */}
      <CollapsibleSection title="Practical Take-Home Messages" icon={Stethoscope} defaultOpen>
        <ul className="space-y-1.5">
          {takeHomeMessages.map((m, i) => (
            <li key={i} className="flex items-start gap-2 text-sm">
              <span className="text-amber-500 mt-0.5">→</span>
              <span>{m}</span>
            </li>
          ))}
        </ul>
      </CollapsibleSection>

      {/* ─── CHA2DS2-VASc & HAS-BLED Scores ──────────────────── */}
      <CollapsibleSection title="CHA₂DS₂-VASc &amp; HAS-BLED Risk Scores" icon={Heart}>
        <div className="space-y-6">
          <p className="text-xs text-muted-foreground">
            Use CHA₂DS₂-VASc to estimate stroke risk in non-valvular AF. Use HAS-BLED to estimate bleeding risk before starting anticoagulation.
          </p>

          {/* CHA2DS2-VASc */}
          <div className="p-4 rounded-lg border border-blue-500/20 bg-blue-500/5">
            <h3 className="text-sm font-bold text-blue-400 mb-3 flex items-center gap-2">
              <Heart className="h-4 w-4" />
              CHA₂DS₂-VASc Score — Stroke Risk in Non-Valvular AF
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
              {[
                { key: 'chf', label: 'C — CHF / LV dysfunction', points: 1 },
                { key: 'htn', label: 'H — Hypertension', points: 1 },
                { key: 'age65_74', label: 'A₂ — Age 65–74 years', points: 1 },
                { key: 'age75', label: 'A₂ — Age ≥75 years', points: 2 },
                { key: 'dm', label: 'D — Diabetes mellitus', points: 1 },
                { key: 'stroke', label: 'S₂ — Stroke / TIA / TE', points: 2 },
                { key: 'vascular', label: 'V — Vascular disease (PAD, prior MI, aortic plaque)', points: 1 },
                { key: 'female', label: 'Sc — Female sex', points: 1 },
              ].map((item) => (
                <label
                  key={item.key}
                  className="flex items-center gap-2 p-2 rounded-lg border border-border bg-card/50 cursor-pointer hover:bg-accent/30 transition-colors text-xs"
                >
                  <input
                    type="checkbox"
                    checked={cha2ds2Vasc[item.key as keyof typeof cha2ds2Vasc]}
                    onChange={() => {
                      const updated = { ...cha2ds2Vasc, [item.key]: !cha2ds2Vasc[item.key as keyof typeof cha2ds2Vasc] };
                      setCha2ds2Vasc(updated);
                    }}
                    className="rounded border-border accent-blue-500"
                  />
                  <span className="text-muted-foreground">{item.label}</span>
                  <span className="ml-auto font-mono text-blue-400">+{item.points}</span>
                </label>
              ))}
            </div>

            {cha2ds2VascTotal > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 rounded-lg bg-card/50 border border-border">
                  <span className="text-sm font-semibold">Total Score</span>
                  <span className="text-2xl font-bold font-mono text-blue-400">{cha2ds2VascTotal}</span>
                </div>
                <div className="p-3 rounded-lg border border-blue-500/20 bg-blue-500/5">
                  <p className="text-xs font-semibold text-blue-400 mb-1">Stroke Risk (per year)</p>
                  <p className="text-sm font-bold">{cha2ds2VascRisk}</p>
                  <p className="text-xs text-muted-foreground mt-1">{cha2ds2VascRecommendation}</p>
                </div>
              </div>
            )}
          </div>

          {/* HAS-BLED */}
          <div className="p-4 rounded-lg border border-red-500/20 bg-red-500/5">
            <h3 className="text-sm font-bold text-red-400 mb-3 flex items-center gap-2">
              <Activity className="h-4 w-4" />
              HAS-BLED Score — Bleeding Risk
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
              {[
                { key: 'htn_hasbled', label: 'H — Hypertension (uncontrolled, SBP >160)', points: 1 },
                { key: 'renal', label: 'A — Abnormal renal function (CrCl <30 or dialysis)', points: 1 },
                { key: 'liver', label: 'A — Abnormal liver function (cirrhosis, bilirubin >2×, AST/ALT >3×)', points: 1 },
                { key: 'stroke_hasbled', label: 'S — Stroke history', points: 1 },
                { key: 'bleeding', label: 'B — Bleeding history / predisposition', points: 1 },
                { key: 'labile_inr', label: 'L — Labile INR (unstable / TTR <60%)', points: 1 },
                { key: 'elderly', label: 'E — Elderly (age >65)', points: 1 },
                { key: 'drugs', label: 'D — Drugs (antiplatelets, NSAIDs) or alcohol excess', points: 1 },
              ].map((item) => (
                <label
                  key={item.key}
                  className="flex items-center gap-2 p-2 rounded-lg border border-border bg-card/50 cursor-pointer hover:bg-accent/30 transition-colors text-xs"
                >
                  <input
                    type="checkbox"
                    checked={hasbled[item.key as keyof typeof hasbled]}
                    onChange={() => {
                      const updated = { ...hasbled, [item.key]: !hasbled[item.key as keyof typeof hasbled] };
                      setHasbled(updated);
                    }}
                    className="rounded border-border accent-red-500"
                  />
                  <span className="text-muted-foreground">{item.label}</span>
                  <span className="ml-auto font-mono text-red-400">+{item.points}</span>
                </label>
              ))}
            </div>

            {hasbledTotal > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 rounded-lg bg-card/50 border border-border">
                  <span className="text-sm font-semibold">Total Score</span>
                  <span className="text-2xl font-bold font-mono text-red-400">{hasbledTotal}</span>
                </div>
                <div className="p-3 rounded-lg border border-red-500/20 bg-red-500/5">
                  <p className="text-xs font-semibold text-red-400 mb-1">Bleeding Risk (per year)</p>
                  <p className="text-sm font-bold">{hasbledRisk}</p>
                  <p className="text-xs text-muted-foreground mt-1">{hasbledRecommendation}</p>
                </div>
              </div>
            )}
          </div>

          {/* Combined Interpretation */}
          {cha2ds2VascTotal > 0 && hasbledTotal > 0 && (
            <div className="p-4 rounded-lg border border-amber-500/20 bg-amber-500/5">
              <h3 className="text-sm font-bold text-amber-400 mb-2 flex items-center gap-2">
                <Scale className="h-4 w-4" />
                Risk-Benefit Assessment
              </h3>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-2 rounded bg-card/50 border border-border text-center">
                  <div className="text-muted-foreground">CHA₂DS₂-VASc</div>
                  <div className="text-lg font-bold font-mono text-blue-400">{cha2ds2VascTotal}</div>
                </div>
                <div className="p-2 rounded bg-card/50 border border-border text-center">
                  <div className="text-muted-foreground">HAS-BLED</div>
                  <div className="text-lg font-bold font-mono text-red-400">{hasbledTotal}</div>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {hasbledTotal >= 3
                  ? '⚠️ HAS-BLED ≥3 indicates high bleeding risk. Address modifiable risk factors (BP control, avoid NSAIDs, improve INR control). Anticoagulation still indicated if CHA₂DS₂-VASc ≥2 in men or ≥3 in women — do not withhold solely due to HAS-BLED.'
                  : 'HAS-BLED <3 indicates low-moderate bleeding risk. Proceed with anticoagulation as indicated by CHA₂DS₂-VASc score.'
                }
              </p>
            </div>
          )}
        </div>
      </CollapsibleSection>

      {/* ─── HIT Risk Toggle & Fondaparinux Section ──────────────────── */}
      <CollapsibleSection title="HIT Risk Toggle &amp; Fondaparinux Guidance" icon={ToggleLeft}>
        <div className="space-y-4">
          <p className="text-xs text-muted-foreground">
            Toggle HIT status to activate surveillance reminders and management guidance. Fondaparinux is a non-heparin alternative with negligible HIT risk.
          </p>

          {/* HIT Status */}
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block">
              HIT Status
            </Label>
            <div className="flex flex-wrap gap-2">
              {(['none', 'suspected', 'confirmed', 'history'] as HitStatus[]).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setHitState(prev => ({ ...prev, status: s }))}
                  className={`rounded-full border px-3 py-1 text-xs font-medium transition-all ${
                    hitState.status === s
                      ? s === 'none' ? 'border-green-500 bg-green-900/20 text-green-400'
                        : s === 'suspected' ? 'border-amber-500 bg-amber-900/20 text-amber-400'
                        : s === 'confirmed' ? 'border-red-500 bg-red-900/20 text-red-400'
                        : 'border-orange-500 bg-orange-900/20 text-orange-400'
                      : 'border-border bg-card text-muted-foreground hover:bg-muted/40'
                  }`}
                >
                  {s === 'none' ? 'No HIT' : s === 'suspected' ? 'Suspected HIT' : s === 'confirmed' ? 'Confirmed HIT' : 'HIT History'}
                </button>
              ))}
            </div>
          </div>

          {hitState.status !== 'none' && (
            <>
              {/* Current Anticoagulant */}
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">
                  Current Anticoagulant
                </Label>
                <div className="flex flex-wrap gap-2">
                  {([
                    { key: 'none' as const, label: 'None' },
                    { key: 'ufh_iv' as const, label: 'UFH IV' },
                    { key: 'ufh_sc' as const, label: 'UFH SC' },
                    { key: 'lmwh' as const, label: 'LMWH SC' },
                    { key: 'doac' as const, label: 'DOAC' },
                    { key: 'warfarin' as const, label: 'Warfarin' },
                  ]).map((opt) => (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => setHitState(prev => ({ ...prev, currentAnticoagulant: opt.key }))}
                      className={`rounded-full border px-3 py-1 text-xs font-medium transition-all ${
                        hitState.currentAnticoagulant === opt.key
                          ? 'border-primary bg-primary/15 text-primary'
                          : 'border-border bg-card text-muted-foreground hover:bg-muted/40'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Renal Status */}
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">
                  Renal Status
                </Label>
                <div className="flex flex-wrap gap-2">
                  {([
                    { key: 'normal_mild' as const, label: 'Normal / Mild (CrCl ≥60)' },
                    { key: 'moderate' as const, label: 'Moderate (CrCl 30–59)' },
                    { key: 'severe_dialysis' as const, label: 'Severe / Dialysis (CrCl <30)' },
                  ]).map((opt) => (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => setHitState(prev => ({ ...prev, renalStatus: opt.key }))}
                      className={`rounded-full border px-3 py-1 text-xs font-medium transition-all ${
                        hitState.renalStatus === opt.key
                          ? 'border-primary bg-primary/15 text-primary'
                          : 'border-border bg-card text-muted-foreground hover:bg-muted/40'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Hemodynamic Status */}
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">
                  Hemodynamic Status
                </Label>
                <div className="flex flex-wrap gap-2">
                  {([
                    { key: 'stable' as const, label: 'Stable' },
                    { key: 'unstable' as const, label: 'Unstable' },
                  ]).map((opt) => (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => setHitState(prev => ({ ...prev, hemodynamicStatus: opt.key }))}
                      className={`rounded-full border px-3 py-1 text-xs font-medium transition-all ${
                        hitState.hemodynamicStatus === opt.key
                          ? 'border-primary bg-primary/15 text-primary'
                          : 'border-border bg-card text-muted-foreground hover:bg-muted/40'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Indication */}
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">
                  Anticoagulation Indication
                </Label>
                <div className="flex flex-wrap gap-2">
                  {([
                    { key: 'vte_treatment' as const, label: 'VTE Treatment' },
                    { key: 'vte_prophylaxis_medical' as const, label: 'VTE Prophylaxis (Medical)' },
                    { key: 'vte_prophylaxis_surgical' as const, label: 'VTE Prophylaxis (Surgical)' },
                    { key: 'af' as const, label: 'Atrial Fibrillation' },
                    { key: 'other' as const, label: 'Other' },
                  ]).map((opt) => (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => setHitState(prev => ({ ...prev, indication: opt.key }))}
                      className={`rounded-full border px-3 py-1 text-xs font-medium transition-all ${
                        hitState.indication === opt.key
                          ? 'border-primary bg-primary/15 text-primary'
                          : 'border-border bg-card text-muted-foreground hover:bg-muted/40'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Weight */}
              <div className="max-w-[200px]">
                <Label className="text-xs text-muted-foreground mb-1.5 block">
                  Weight (kg) — for Fondaparinux dosing
                </Label>
                <Input
                  type="number"
                  min="30"
                  max="300"
                  step="0.1"
                  value={hitState.weightKg}
                  onChange={(e) => setHitState(prev => ({ ...prev, weightKg: e.target.value }))}
                  className="h-9 text-xs"
                />
              </div>

              {/* Results */}
              {(() => {
                const result = getHitRecommendations(hitState);
                return (
                  <div className={`p-4 rounded-lg border-2 ${result.color}`}>
                    <div className="flex items-center gap-2 mb-3">
                      {hitState.status === 'confirmed' ? (
                        <XCircle className="h-5 w-5" />
                      ) : hitState.status === 'suspected' ? (
                        <AlertTriangle className="h-5 w-5" />
                      ) : (
                        <Info className="h-5 w-5" />
                      )}
                      <span className="text-sm font-bold">{result.title}</span>
                    </div>
                    <ul className="space-y-2">
                      {result.recommendations.map((rec, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs">
                          <ArrowRight className="h-3 w-3 mt-0.5 shrink-0" />
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                    {result.fondaparinuxDose && (
                      <div className="mt-3 p-3 rounded-lg bg-card/50 border border-border">
                        <p className="text-xs font-semibold text-foreground">Fondaparinux Dose</p>
                        <p className="text-sm font-bold text-primary mt-1">{result.fondaparinuxDose}</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">{result.fondaparinuxNotes}</p>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Fondaparinux HIT Safety Info */}
              <Dialog>
                <DialogTrigger asChild>
                  <button type="button" className="text-xs text-primary hover:underline flex items-center gap-1">
                    <Info className="h-3 w-3" />
                    Why is Fondaparinux safe in HIT?
                  </button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Fondaparinux &amp; HIT Risk</DialogTitle>
                    <DialogDescription>
                      Fondaparinux has an extremely low — effectively negligible — risk of classic immune-mediated HIT.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-3 text-sm">
                    <div className="p-3 rounded-lg border border-border bg-muted/20">
                      <p className="font-semibold text-foreground">Mechanism</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Although fondaparinux shares the same antithrombin-binding pentasaccharide as heparins, it lacks the longer polysaccharide chain and is not classified as a heparin product. This markedly reduces PF4 complex formation and immunogenicity.
                      </p>
                    </div>
                    <div className="p-3 rounded-lg border border-border bg-muted/20">
                      <p className="font-semibold text-foreground">Clinical Evidence</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Clinical and mechanistic data suggest that fondaparinux does not (or only exceptionally) cause HIT. Major guidelines list it as an acceptable alternative anticoagulant in patients with HIT, alongside direct thrombin inhibitors and DOACs.
                      </p>
                    </div>
                    <div className="p-3 rounded-lg border border-border bg-muted/20">
                      <p className="font-semibold text-foreground">Practical Points</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        For a patient with current or prior HIT, switching from UFH/LMWH to fondaparinux is widely accepted when renal function is adequate. Dose selection follows standard VTE treatment/prophylaxis algorithms. Rare case reports of "fondaparinux failure" in HIT appear related more to overall thrombotic burden than to true fondaparinux-induced HIT, but support close monitoring and readiness to escalate to argatroban/bivalirudin in unstable patients.
                      </p>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              {/* UFH vs LMWH HIT Risk Comparison */}
              <div className="p-4 rounded-lg border-2 border-blue-500/30 bg-blue-500/5">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="h-4 w-4 text-blue-400" />
                  <span className="text-sm font-bold text-foreground">UFH vs LMWH — HIT Risk Comparison</span>
                </div>
                <div className="space-y-3 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3 rounded-lg border border-red-500/30 bg-red-900/10">
                      <p className="font-semibold text-red-400 mb-1">UFH — Higher HIT Risk</p>
                      <ul className="space-y-1 text-muted-foreground">
                        <li className="flex items-start gap-1.5">
                          <span className="text-red-400 mt-0.5">•</span>
                          <span>HIT incidence: <strong>~3–4%</strong> of exposed patients (surgical/orthopedic populations)</span>
                        </li>
                        <li className="flex items-start gap-1.5">
                          <span className="text-red-400 mt-0.5">•</span>
                          <span>Forms larger, more immunogenic PF4–heparin complexes → stronger IgG response</span>
                        </li>
                        <li className="flex items-start gap-1.5">
                          <span className="text-red-400 mt-0.5">•</span>
                          <span>Higher vigilance required: monitor platelets q2–3d from day 4–14</span>
                        </li>
                        <li className="flex items-start gap-1.5">
                          <span className="text-red-400 mt-0.5">•</span>
                          <span>Still has roles: rapid on/off, renal failure, invasive procedures</span>
                        </li>
                      </ul>
                    </div>
                    <div className="p-3 rounded-lg border border-emerald-500/30 bg-emerald-900/10">
                      <p className="font-semibold text-emerald-400 mb-1">LMWH — Lower HIT Risk</p>
                      <ul className="space-y-1 text-muted-foreground">
                        <li className="flex items-start gap-1.5">
                          <span className="text-emerald-400 mt-0.5">•</span>
                          <span>HIT incidence: <strong>~0.2%</strong> of exposed patients (comparable RCTs)</span>
                        </li>
                        <li className="flex items-start gap-1.5">
                          <span className="text-emerald-400 mt-0.5">•</span>
                          <span>Odds ratio vs UFH: <strong>0.10–0.11</strong> — substantially lower HIT incidence</span>
                        </li>
                        <li className="flex items-start gap-1.5">
                          <span className="text-emerald-400 mt-0.5">•</span>
                          <span>Generates fewer PF4 complexes; more IgA/IgM than IgG response</span>
                        </li>
                        <li className="flex items-start gap-1.5">
                          <span className="text-emerald-400 mt-0.5">•</span>
                          <span>Preferred over UFH when HIT risk is a key consideration (e.g., orthopedic surgery, prolonged prophylaxis)</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-muted/30 border border-border">
                    <p className="text-[11px] text-muted-foreground italic">
                      <strong>Practical takeaway:</strong> When HIT risk is a key consideration, LMWH is preferred over UFH from a safety standpoint. UFH still has roles but should prompt higher vigilance for HIT and earlier consideration of non-heparin alternatives if platelets fall.
                    </p>
                  </div>
                </div>
              </div>

              {/* ─── HIT Surveillance Card ─────────────────────────────── */}
              <div className="p-4 rounded-lg border-2 border-red-500/30 bg-red-900/5">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="h-4 w-4 text-red-400" />
                  <span className="text-sm font-bold text-foreground">HIT Surveillance &amp; Management Card</span>
                </div>

                {/* Platelet Cadence Table */}
                <div className="mb-3">
                  <p className="text-xs font-semibold text-foreground mb-2">Platelet Monitoring Cadence</p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="p-2 text-left font-medium text-muted-foreground">Phase</th>
                          <th className="p-2 text-left font-medium text-muted-foreground">Low Risk</th>
                          <th className="p-2 text-left font-medium text-muted-foreground">Active / Suspected</th>
                          <th className="p-2 text-left font-medium text-muted-foreground">HIT History</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b border-border/50">
                          <td className="p-2 font-medium">Baseline</td>
                          <td className="p-2">Pre-UFH count</td>
                          <td className="p-2 text-amber-400 font-medium">Pre-UFH count + 4T score</td>
                          <td className="p-2 text-orange-400 font-medium">Pre-UFH count + 4T score</td>
                        </tr>
                        <tr className="border-b border-border/50">
                          <td className="p-2 font-medium">Day 1–3</td>
                          <td className="p-2">q2–3d</td>
                          <td className="p-2 text-amber-400 font-medium">q12–24h</td>
                          <td className="p-2 text-orange-400 font-medium">q24h</td>
                        </tr>
                        <tr className="border-b border-border/50">
                          <td className="p-2 font-medium">Day 4–14 (peak)</td>
                          <td className="p-2">q2–3d</td>
                          <td className="p-2 text-red-400 font-medium">q12h</td>
                          <td className="p-2 text-amber-400 font-medium">q24h</td>
                        </tr>
                        <tr className="border-b border-border/50">
                          <td className="p-2 font-medium">Post-Day 14</td>
                          <td className="p-2">q3–5d if still on UFH</td>
                          <td className="p-2 text-amber-400 font-medium">q24h until stable &gt;150 K</td>
                          <td className="p-2">q3–5d if still on UFH</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Escalation Trigger Checklist */}
                <div className="mb-3">
                  <p className="text-xs font-semibold text-foreground mb-2">Escalation Triggers — Any of the following warrants immediate action</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {[
                      { trigger: 'Platelet fall &gt;50% from baseline', severity: 'high' },
                      { trigger: 'Platelet count &lt;150 K/μL', severity: 'high' },
                      { trigger: 'New thrombosis (arterial or venous)', severity: 'critical' },
                      { trigger: '4T score ≥4 (intermediate/high probability)', severity: 'high' },
                      { trigger: 'Skin necrosis at injection site', severity: 'critical' },
                      { trigger: 'Anaphylactoid reaction post-heparin bolus', severity: 'critical' },
                    ].map((item, i) => (
                      <div key={i} className={`p-2.5 rounded-lg border text-xs ${
                        item.severity === 'critical'
                          ? 'border-red-500/40 bg-red-900/15'
                          : 'border-amber-500/30 bg-amber-900/10'
                      }`}>
                        <div className="flex items-center gap-1.5">
                          <span className={item.severity === 'critical' ? 'text-red-400' : 'text-amber-400'}>
                            {item.severity === 'critical' ? '🚨' : '⚠️'}
                          </span>
                          <span className="font-medium text-foreground">{item.trigger}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Non-Heparin Starting Doses */}
                <div>
                  <p className="text-xs font-semibold text-foreground mb-2">Non-Heparin Anticoagulant Starting Doses</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3 rounded-lg border border-blue-500/30 bg-blue-900/10">
                      <p className="text-xs font-bold text-blue-400 mb-1.5">Argatroban</p>
                      <ul className="space-y-1 text-[11px] text-muted-foreground">
                        <li className="flex items-start gap-1.5">
                          <span className="text-blue-400 mt-0.5">•</span>
                          <span><strong>Standard:</strong> 2 μg/kg/min IV (no bolus)</span>
                        </li>
                        <li className="flex items-start gap-1.5">
                          <span className="text-blue-400 mt-0.5">•</span>
                          <span><strong>Hepatic impairment:</strong> 0.5 μg/kg/min</span>
                        </li>
                        <li className="flex items-start gap-1.5">
                          <span className="text-blue-400 mt-0.5">•</span>
                          <span><strong>Target aPTT:</strong> 1.5–3× baseline (not &gt;100s)</span>
                        </li>
                        <li className="flex items-start gap-1.5">
                          <span className="text-blue-400 mt-0.5">•</span>
                          <span><strong>Monitor:</strong> aPTT q2h until stable, then q24h</span>
                        </li>
                        <li className="flex items-start gap-1.5">
                          <span className="text-blue-400 mt-0.5">•</span>
                          <span><strong>Transition:</strong> Overlap with warfarin/DOAC once platelets &gt;150 K</span>
                        </li>
                      </ul>
                    </div>
                    <div className="p-3 rounded-lg border border-purple-500/30 bg-purple-900/10">
                      <p className="text-xs font-bold text-purple-400 mb-1.5">Bivalirudin</p>
                      <ul className="space-y-1 text-[11px] text-muted-foreground">
                        <li className="flex items-start gap-1.5">
                          <span className="text-purple-400 mt-0.5">•</span>
                          <span><strong>Standard:</strong> 0.15–0.2 mg/kg/h IV (no bolus)</span>
                        </li>
                        <li className="flex items-start gap-1.5">
                          <span className="text-purple-400 mt-0.5">•</span>
                          <span><strong>Renal impairment:</strong> Reduce to 0.08–0.1 mg/kg/h if CrCl &lt;30</span>
                        </li>
                        <li className="flex items-start gap-1.5">
                          <span className="text-purple-400 mt-0.5">•</span>
                          <span><strong>Target aPTT:</strong> 1.5–2.5× baseline</span>
                        </li>
                        <li className="flex items-start gap-1.5">
                          <span className="text-purple-400 mt-0.5">•</span>
                          <span><strong>Monitor:</strong> aPTT q2h until stable, then q24h</span>
                        </li>
                        <li className="flex items-start gap-1.5">
                          <span className="text-purple-400 mt-0.5">•</span>
                          <span><strong>Transition:</strong> Overlap with warfarin/DOAC once platelets &gt;150 K</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </CollapsibleSection>
    </div>
  );
}
