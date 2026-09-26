import { useState } from 'react';
import { Droplet, AlertTriangle, ChevronDown, ChevronUp, Activity, Stethoscope, TestTube, Pill, Info, ArrowDown } from 'lucide-react';

const commonDITPDrugs = {
  antibiotics: [
    'Vancomycin', 'TMP-SMX (Bactrim)', 'Linezolid', 'Cefazolin', 'Piperacillin-tazobactam',
    'Rifampin', 'Ciprofloxacin', 'Levofloxacin'
  ],
  cardiovascular: [
    'Heparin (unfractionated & LMWH)', 'Amiodarone', 'Digoxin', 'Abciximab', 'Eptifibatide'
  ],
  anticonvulsants: [
    'Valproic acid', 'Carbamazepine', 'Phenytoin', 'Levetiracetam', 'Lamotrigine'
  ],
  analgesics: [
    'Ibuprofen', 'Naproxen', 'Diclofenac', 'Acetaminophen (rare)'
  ],
  psychotropic: [
    'Haloperidol', 'Olanzapine', 'Risperidone', 'Sertraline', 'Fluoxetine'
  ],
  other: [
    'Furosemide', 'Omeprazole/PPIs', 'Methyldopa', 'Interferon', 'Rituximab',
    'Chemotherapy agents', 'Quinine/Quinidine', 'Gold salts'
  ]
};

interface PlateletValues {
  plateletCount: string;
  mpv: string;
  pdw: string;
}

interface PatientFactors {
  age: string;
  recentHeparin: boolean;
  bleedingSymptoms: boolean;
  neurologicSymptoms: boolean;
  renalDysfunction: boolean;
  fever: boolean;
  newMedications: boolean;
  priorPlateletCount: string;
}

const EMPTY_VALUES: PlateletValues = { plateletCount: '', mpv: '', pdw: '' };
const EMPTY_FACTORS: PatientFactors = {
  age: '',
  recentHeparin: false,
  bleedingSymptoms: false,
  neurologicSymptoms: false,
  renalDysfunction: false,
  fever: false,
  newMedications: false,
  priorPlateletCount: '',
};

export default function ThrombocytopeniaEvaluator() {
  const [values, setValues] = useState<PlateletValues>(EMPTY_VALUES);
  const [factors, setFactors] = useState<PatientFactors>(EMPTY_FACTORS);
  const [result, setResult] = useState<string | null>(null);
  const [showAlgorithm, setShowAlgorithm] = useState(false);
  const [showDrugList, setShowDrugList] = useState(false);

  const plateletNum = parseFloat(values.plateletCount);

  function getSeverity(count: number): { level: string; color: string; risk: string } {
    if (count >= 150) return { level: 'Normal', color: 'text-emerald-400', risk: 'No bleeding risk' };
    if (count >= 100) return { level: 'Mild', color: 'text-warning', risk: 'Minimal bleeding risk' };
    if (count >= 50) return { level: 'Moderate', color: 'text-warning', risk: 'Increased bleeding with trauma/surgery' };
    if (count >= 20) return { level: 'Severe', color: 'text-destructive', risk: 'Spontaneous bleeding risk' };
    return { level: 'Life-threatening', color: 'text-red-500', risk: 'High risk of spontaneous hemorrhage' };
  }

  function generateAssessment() {
    const parts: string[] = [];

    // Severity assessment
    if (!isNaN(plateletNum)) {
      const severity = getSeverity(plateletNum);
      parts.push(`Severity: ${severity.level} (${plateletNum} ×10⁹/L) - ${severity.risk}`);
    }

    // Urgent red flags
    const redFlags: string[] = [];
    if (plateletNum < 20) redFlags.push('Platelets <20,000/μL');
    if (factors.neurologicSymptoms) redFlags.push('Neurologic symptoms (TTP concern)');
    if (factors.recentHeparin && plateletNum < 150) redFlags.push('Heparin exposure (HIT concern)');
    if (factors.renalDysfunction && plateletNum < 150) redFlags.push('Renal dysfunction + thrombocytopenia (TTP/HUS)');

    if (redFlags.length > 0) {
      parts.push(`URGENT: ${redFlags.join(', ')} - Consider hematology consult`);
    }

    // Differential based on history
    const differentials: string[] = [];

    if (factors.recentHeparin && plateletNum < 150) {
      differentials.push('Heparin-Induced Thrombocytopenia (HIT) - Calculate 4Ts score');
    }

    if (factors.neurologicSymptoms || factors.renalDysfunction || factors.fever) {
      differentials.push('TTP/HUS/DIC - Check peripheral smear for schistocytes, LDH, haptoglobin');
    }

    if (factors.newMedications) {
      differentials.push('Drug-Induced Thrombocytopenia (DITP) - Review all meds/supplements');
    }

    if (plateletNum > 20 && plateletNum < 100 && !factors.recentHeparin && !factors.newMedications) {
      differentials.push('Immune Thrombocytopenia (ITP) - Diagnosis of exclusion');
    }

    if (factors.age && parseInt(factors.age) > 60 && plateletNum < 100) {
      differentials.push('Consider MDS or other primary bone marrow disorder in elderly');
    }

    if (differentials.length > 0) {
      parts.push(`Consider: ${differentials.join('; ')}`);
    }

    // Recommendations
    const recs: string[] = [];
    if (plateletNum < 150) {
      recs.push('Confirm with peripheral smear (exclude pseudothrombocytopenia/clumping)');
    }
    if (plateletNum < 100) {
      recs.push('Hemolysis panel: LDH, haptoglobin, reticulocyte count, direct antiglobulin test');
      recs.push('Liver function tests (portal hypertension/sequestration)');
      recs.push('Hepatitis C, HIV screening');
    }
    if (redFlags.length > 0) {
      recs.push('URGENT: Hematology consult, possible admission for severe thrombocytopenia');
    }

    if (recs.length > 0) {
      parts.push(`Recommendations: ${recs.join('; ')}`);
    }

    setResult(parts.join('\n\n'));
  }

  function handleReset() {
    setValues(EMPTY_VALUES);
    setFactors(EMPTY_FACTORS);
    setResult(null);
  }

  return (
    <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-900/30 flex items-center justify-center border border-rose-800">
            <Droplet className="w-5 h-5 text-destructive" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">Thrombocytopenia Evaluator</h2>
            <p className="text-xs text-muted-foreground">ASH-guided diagnostic algorithm (2024)</p>
          </div>
        </div>

        <div className="flex items-start gap-3 bg-amber-900/20 border border-amber-800/50 rounded-xl px-4 py-3 text-sm text-amber-300 mt-4">
          <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0 text-amber-500" />
          <p>
            This tool is for <strong>educational and decision-support purposes only</strong>. Severe thrombocytopenia (&lt;20,000/μL) and suspected TTP/HIT require urgent evaluation.
          </p>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Platelet Count Input */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              Platelet Count (×10⁹/L) *
            </label>
            <input
              type="number"
              value={values.plateletCount}
              onChange={(e) => setValues({ ...values, plateletCount: e.target.value })}
              placeholder="e.g., 45"
              className="w-full px-4 py-2 bg-muted border border-border text-foreground rounded-xl focus:ring-2 focus:ring-destructive focus:border-transparent outline-none transition-all placeholder-muted-foreground"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              MPV (fL) - Optional
            </label>
            <input
              type="number"
              value={values.mpv}
              onChange={(e) => setValues({ ...values, mpv: e.target.value })}
              placeholder="7-11"
              className="w-full px-4 py-2 bg-muted border border-border text-foreground rounded-xl focus:ring-2 focus:ring-destructive focus:border-transparent outline-none transition-all placeholder-muted-foreground"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              Patient Age
            </label>
            <input
              type="number"
              value={factors.age}
              onChange={(e) => setFactors({ ...factors, age: e.target.value })}
              placeholder="years"
              className="w-full px-4 py-2 bg-muted border border-border text-foreground rounded-xl focus:ring-2 focus:ring-destructive focus:border-transparent outline-none transition-all placeholder-muted-foreground"
            />
          </div>
        </div>

        {/* Clinical Factors */}
        <div className="bg-muted/50 rounded-xl p-4 border border-border">
          <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <Stethoscope className="w-4 h-4 text-muted-foreground" />
            Clinical Factors (Check all that apply)
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { key: 'recentHeparin', label: 'Heparin exposure in last 30 days' },
              { key: 'bleedingSymptoms', label: 'Bleeding symptoms (petechiae, ecchymosis)' },
              { key: 'neurologicSymptoms', label: 'Neurologic symptoms' },
              { key: 'renalDysfunction', label: 'Renal dysfunction' },
              { key: 'fever', label: 'Fever' },
              { key: 'newMedications', label: 'New medications in last 2 weeks' },
            ].map((item) => (
              <label key={item.key} className="flex items-center gap-3 cursor-pointer hover:bg-muted/80 p-2 rounded-lg transition-colors">
                <input
                  type="checkbox"
                  checked={factors[item.key as keyof PatientFactors] as boolean}
                  onChange={(e) => setFactors({ ...factors, [item.key]: e.target.checked })}
                  className="w-4 h-4 text-destructive rounded border-border bg-muted focus:ring-destructive"
                />
                <span className="text-sm text-muted-foreground">{item.label}</span>
              </label>
            ))}
          </div>

          {/* Collapsible Drug List */}
          <div className="mt-4 border-t border-border pt-4">
            <button
              onClick={() => setShowDrugList(!showDrugList)}
              className="flex items-center gap-2 text-sm text-warning hover:text-amber-300 transition-colors"
            >
              <Pill className="w-4 h-4" />
              <span>Common drugs causing thrombocytopenia (DITP)</span>
              {showDrugList ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showDrugList && (
              <div className="mt-3 bg-card/50 rounded-lg p-4 border border-border animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="flex items-start gap-2 mb-3">
                  <Info className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-muted-foreground">
                    Drug-induced thrombocytopenia (DITP) typically occurs 5-10 days after exposure. This is not an exhaustive list — always review ALL medications, OTC drugs, and supplements.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <h4 className="text-xs font-semibold text-destructive mb-2">Antibiotics</h4>
                    <ul className="space-y-1">
                      {commonDITPDrugs.antibiotics.map(drug => (
                        <li key={drug} className="text-xs text-muted-foreground">{drug}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-destructive mb-2">Cardiovascular</h4>
                    <ul className="space-y-1">
                      {commonDITPDrugs.cardiovascular.map(drug => (
                        <li key={drug} className="text-xs text-muted-foreground">{drug}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-destructive mb-2">Anticonvulsants</h4>
                    <ul className="space-y-1">
                      {commonDITPDrugs.anticonvulsants.map(drug => (
                        <li key={drug} className="text-xs text-muted-foreground">{drug}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-destructive mb-2">NSAIDs/Analgesics</h4>
                    <ul className="space-y-1">
                      {commonDITPDrugs.analgesics.map(drug => (
                        <li key={drug} className="text-xs text-muted-foreground">{drug}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-destructive mb-2">Psychotropic</h4>
                    <ul className="space-y-1">
                      {commonDITPDrugs.psychotropic.map(drug => (
                        <li key={drug} className="text-xs text-muted-foreground">{drug}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-destructive mb-2">Other</h4>
                    <ul className="space-y-1">
                      {commonDITPDrugs.other.map(drug => (
                        <li key={drug} className="text-xs text-muted-foreground">{drug}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Prior Platelet Count */}
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-2">
            Prior Platelet Count (if known)
          </label>
          <input
            type="number"
            value={factors.priorPlateletCount}
            onChange={(e) => setFactors({ ...factors, priorPlateletCount: e.target.value })}
            placeholder="e.g., 250"
            className="w-full px-4 py-2 bg-muted border border-border text-foreground rounded-xl focus:ring-2 focus:ring-destructive focus:border-transparent outline-none transition-all placeholder-muted-foreground"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={generateAssessment}
            disabled={!values.plateletCount}
            className="flex-1 bg-destructive text-foreground py-3 rounded-xl font-semibold hover:bg-destructive/80 disabled:bg-muted disabled:text-muted-foreground transition-colors"
          >
            Evaluate Thrombocytopenia
          </button>
          <button
            onClick={handleReset}
            className="px-6 py-3 border border-border text-muted-foreground rounded-xl font-medium hover:bg-muted/80 transition-colors"
          >
            Reset
          </button>
        </div>

        {/* Results */}
        {result && (
          <div className="bg-rose-900/20 border border-rose-800/50 rounded-xl p-5 space-y-3">
            <h3 className="font-semibold text-rose-300 flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Assessment Results
            </h3>
            <div className="text-sm text-rose-200 whitespace-pre-line space-y-2">
              {result.split('\n\n').map((line, i) => (
                <p key={i} className={line.startsWith('URGENT') ? 'font-semibold bg-red-900/30 p-2 rounded border border-red-800' : ''}>
                  {line}
                </p>
              ))}
            </div>
          </div>
        )}

        {/* Algorithm Section */}
        <button
          onClick={() => setShowAlgorithm(!showAlgorithm)}
          className="w-full flex items-center justify-between p-4 bg-muted/50 hover:bg-muted/80 border border-border rounded-xl transition-colors"
        >
          <div className="flex items-center gap-2">
            <TestTube className="w-5 h-5 text-muted-foreground" />
            <span className="font-semibold text-foreground">ASH Thrombocytopenia Diagnostic Algorithm</span>
          </div>
          {showAlgorithm ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </button>

        {showAlgorithm && (
          <div className="bg-card rounded-xl p-5 space-y-6 text-sm border border-border">
            {/* 🧩 VISUAL ALGORITHM FLOWCHART */}
            <div className="text-center">
              <h3 className="text-base font-bold text-foreground mb-4">🩸 Differential Diagnosis of Thrombocytopenia</h3>

              <div className="inline-flex flex-col items-center">
                {/* START NODE */}
                <div className="rounded-full border-2 border-destructive bg-rose-500/15 px-6 py-2 text-sm font-bold text-foreground">
                  🟡 DECREASED PLATELETS
                </div>

                <div className="flex justify-center">
                  <ArrowDown className="h-5 w-5 text-muted-foreground my-1" />
                </div>

                {/* MAIN DECISION — MAHA? */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1 sm:gap-3">
                  {/* NO → ITP */}
                  <div className="flex flex-col items-center w-36">
                    <div className="rounded-md border border-emerald-500/50 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-400">NO</div>
                    <ArrowDown className="h-4 w-4 text-muted-foreground" />
                    <div className="rounded-xl border border-purple-500/40 bg-purple-500/15 px-3 py-2 space-y-1.5">
                      <div className="text-xs font-semibold text-foreground">Isolated Thrombocytopenia</div>
                      <div className="text-sm font-bold text-purple-300">ITP</div>
                      <div className="text-[10px] text-muted-foreground">Immune Thrombocytopenic Purpura</div>

                      {/* Vignette */}
                      <div className="text-[10px] leading-relaxed text-muted-foreground">
                        Seen in children <span className="font-medium text-purple-200">post-viral infection</span> or <span className="font-medium text-purple-200">women 30s–40s</span>.
                        Anti-GpIIb/IIIa antibodies destroy platelets.
                      </div>

                      {/* Mechanism */}
                      <div className="bg-purple-950/30 rounded-md border border-purple-500/20 p-2 mt-1">
                        <div className="text-[10px] font-bold text-purple-300 mb-1">MECHANISM</div>
                        <div className="text-[10px] text-muted-foreground leading-relaxed">
                          Anti-<span className="font-medium text-purple-200">GpIIb/IIIa</span> antibodies → opsonization → splenic <span className="font-medium text-purple-200">Fcγ receptor-mediated destruction</span> → ↓platelet lifespan
                        </div>
                      </div>

                      {/* Labs */}
                      <div className="bg-purple-950/20 rounded-md border border-purple-500/15 p-2 mt-1">
                        <div className="text-[10px] font-bold text-purple-300 mb-0.5">LABS</div>
                        <div className="text-[10px] text-muted-foreground">
                          <span className="font-medium text-rose-300">Isolated thrombocytopenia</span> | ↓Platelets | ↑Bleeding time | <span className="font-medium text-emerald-300">NO schistocytes</span> | Normal PT/PTT
                        </div>
                      </div>

                      {/* Clinical Pearl */}
                      <div className="bg-yellow-950/30 rounded-md border border-yellow-500/30 p-1.5 mt-1">
                        <div className="text-[10px] font-bold text-yellow-300">💡 CLINICAL PEARL</div>
                        <div className="text-[10px] text-yellow-200/90">
                          <span className="font-bold">If you see schistocytes on smear, it's NOT ITP</span> — think TTP, HUS, or DIC. Platelet transfusion is generally avoided because antibodies destroy transfused platelets too.
                        </div>
                      </div>

                      {/* Treatment */}
                      <div className="text-[10px] text-left font-medium text-emerald-400 mt-1">
                        TREATMENT: <span className="font-bold text-emerald-300">Steroids</span> (first-line) | <span className="text-emerald-300">IVIG</span> (acute bleeding) | <span className="text-amber-300">Splenectomy</span> (if refractory) | Observation if mild
                      </div>
                    </div>
                  </div>

                  {/* DECISION DIAMOND */}
                  <div className="flex flex-col items-center my-2 sm:my-0">
                    <div className="bg-card border-2 border-border rounded-md px-4 py-2 text-center">
                      <div className="text-xs font-bold text-foreground">Is there MAHA</div>
                      <div className="text-xs text-muted-foreground">(schistocytes)?</div>
                    </div>
                    <div className="flex items-center gap-1 mt-1">
                      <span className="text-xs text-muted-foreground">🔴 schistocytes</span>
                    </div>
                  </div>

                  {/* YES → MAHA BRANCH */}
                  <div className="flex flex-col items-center w-40">
                    <div className="rounded-md border border-rose-500/50 bg-rose-500/10 px-3 py-1 text-xs font-bold text-rose-400">YES</div>
                    <ArrowDown className="h-4 w-4 text-muted-foreground" />
                    <div className="rounded-lg bg-muted/60 border border-border px-3 py-1.5 text-xs text-muted-foreground">
                      MAHA PRESENT
                    </div>
                    <ArrowDown className="h-4 w-4 text-muted-foreground" />
                    <div className="rounded-md bg-muted border border-border px-3 py-1.5 text-xs text-muted-foreground">
                      Consider TTP, HUS, or DIC
                    </div>

                    {/* Three sub-branches */}
                    <div className="mt-2 space-y-2 w-full">
                      {/* TTP — expanded */}
                      <div className="rounded-xl border border-sky-500/40 bg-sky-500/15 px-3 py-2 space-y-1.5">
                        <div className="font-bold text-sm text-sky-300">TTP</div>
                        <div className="text-[10px] text-muted-foreground">Thrombotic Thrombocytopenic Purpura</div>

                        {/* Vignette */}
                        <div className="text-[10px] leading-relaxed text-muted-foreground">
                          Seen in adults, <span className="font-medium text-sky-200">classically young women</span> —
                          anti-ADAMTS13 antibodies prevent vWF multimer cleavage
                        </div>

                        {/* Mechanism + Labs — side by side */}
                        <div className="grid grid-cols-2 gap-1.5 mt-1">
                          <div className="bg-sky-950/30 rounded-md border border-sky-500/20 p-2">
                            <div className="text-[10px] font-bold text-sky-300 mb-1">MECHANISM</div>
                            <div className="text-[10px] text-muted-foreground leading-relaxed">
                              Anti-ADAMTS13 Enzyme → ↓ADAMTS13 → <span className="font-medium text-sky-200">vWF multimers accumulate</span> → Adhesion & Occlusion → <span className="font-medium text-rose-300">Thrombocytopenia + MAHA</span>
                            </div>
                          </div>
                          <div className="bg-sky-950/20 rounded-md border border-sky-500/15 p-2">
                            <div className="text-[10px] font-bold text-sky-300 mb-0.5">LABS</div>
                            <div className="text-[10px] text-muted-foreground leading-relaxed">
                              ↓ADAMTS13 activity<br/>
                              ↑Bleeding time<br/>
                              Normal PT/PTT<br/>
                              <span className="font-medium text-rose-300">MAHA</span> + Schistocytes
                            </div>
                          </div>
                        </div>

                        {/* The Pentad */}
                        <div className="bg-rose-950/20 rounded-md border border-rose-500/20 p-2 mt-1">
                          <div className="text-[10px] font-bold text-rose-300 mb-0.5">🔴 TTP PENTAD</div>
                          <div className="text-[10px] text-muted-foreground">
                            TTP Pentad = HUS triad + <span className="font-medium text-sky-200">Fever</span> + <span className="font-medium text-sky-200">Neurologic signs</span>
                          </div>
                        </div>

                        {/* Critical Warning */}
                        <div className="bg-red-950/30 rounded-md border border-red-500/30 p-1.5 mt-1">
                          <div className="text-[10px] font-bold text-red-300">⚠ CRITICAL</div>
                          <div className="text-[10px] text-red-200/90">
                            <span className="font-bold">AVOID PLATELET TRANSFUSION</span> — fuels systemic thrombotic process ("lvematic process")
                          </div>
                        </div>

                        <div className="bg-emerald-950/20 rounded-md border border-emerald-500/20 p-2 mt-1">
                          <div className="text-[10px] font-bold text-emerald-300 mb-0.5">TREATMENT</div>
                          <ul className="text-[10px] text-muted-foreground space-y-0.5 list-disc list-inside">
                            <li><span className="font-bold text-emerald-200">PLASMAPHERESIS</span> — removes antibodies + replaces ADAMTS13 (<span className="text-emerald-200">emergent</span>)</li>
                            <li><span className="font-bold text-red-300">Do NOT</span> transfuse platelets</li>
                          </ul>
                        </div>
                      </div>

                      {/* HUS — expanded */}
                      <div className="rounded-xl border border-amber-500/40 bg-amber-500/15 px-3 py-2 space-y-1.5">
                        <div className="font-bold text-sm text-amber-300">HUS</div>
                        <div className="text-[10px] text-muted-foreground">Hemolytic Uremic Syndrome <span className="text-amber-300 font-medium">(HUD)</span></div>
                        <div className="text-[9px] italic text-muted-foreground mb-0.5">Hemolysis, Uremia, Diarrhea</div>

                        {/* Epidemiology */}
                        <div className="text-[10px] leading-relaxed text-muted-foreground">
                          Seen in children after <span className="font-medium text-amber-200">bloody diarrhea</span>.
                          Caused by <span className="font-medium text-amber-200">Shiga toxin</span> (EHEC O157:H7 or <em>Shigella</em>).
                          <span className="text-amber-400"> ⚠ NOT ETEC</span> (does not cause HUS).
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          <span className="font-medium text-warning">Effect:</span> Renal endothelial damage → microthrombi
                        </div>

                        {/* Pathophysiology flowchart */}
                        <div className="bg-amber-950/30 rounded-md border border-amber-500/20 p-2 mt-1">
                          <div className="text-[10px] font-bold text-amber-300 mb-1">PATHOPHYSIOLOGY</div>
                          <div className="text-[10px] text-muted-foreground leading-relaxed">
                            EHEC/Shigella → <span className="font-medium text-amber-200">Shiga Toxin</span> → Toxin targets renal endothelium →<br />
                            VWF multimers released → <span className="font-medium text-amber-200">Microthrombi</span> → Platelet consumption + RBC fragmentation (schistocytes) → Renal failure
                          </div>
                        </div>

                        {/* Labs */}
                        <div className="bg-amber-950/20 rounded-md border border-amber-500/15 p-2 mt-1">
                          <div className="text-[10px] font-bold text-amber-300 mb-0.5">LABS</div>
                          <div className="text-[10px] text-muted-foreground">
                            ↓Platelets (Thrombocytopenia) | <span className="font-medium text-rose-300">Schistocytes present</span> (MAHA) | ↑BUN/Creatinine (Renal Failure)
                          </div>
                        </div>

                        {/* The Triad */}
                        <div className="bg-rose-950/20 rounded-md border border-rose-500/20 p-2 mt-1">
                          <div className="text-[10px] font-bold text-rose-300 mb-0.5">🔴 THE TRIAD</div>
                          <div className="text-[10px] text-muted-foreground">
                            <span className="font-medium text-amber-300">Thrombocytopenia</span> + <span className="font-medium text-amber-300">Schistocytes</span> + <span className="font-medium text-amber-300">Renal Failure</span>
                          </div>
                          <div className="text-[10px] text-muted-foreground">(Low platelets + ↑BUN/Creatinine + schistocytes)</div>
                        </div>

                        {/* Clinical Pearl */}
                        <div className="bg-yellow-950/30 rounded-md border border-yellow-500/30 p-1.5 mt-1">
                          <div className="text-[10px] font-bold text-yellow-300">💡 CLINICAL PEARL</div>
                          <div className="text-[10px] text-yellow-200/90">
                            Avoid antibiotics for EHEC. Antibiotics <span className="font-bold">increase Shiga toxin release</span> and worsen HUS.
                          </div>
                        </div>

                        <div className="text-[10px] text-left font-medium text-emerald-400 mt-1">
                          TREATMENT: Supportive care — IV fluids + renal monitoring | <span className="text-rose-300">NO ANTIBIOTICS</span> | Dialysis if needed
                        </div>
                      </div>

                      {/* DIC */}
                      <div className="rounded-xl border border-rose-400/40 bg-rose-500/15 px-3 py-2">
                        <div className="font-bold text-sm text-rose-300">DIC</div>
                        <div className="text-[10px] text-muted-foreground mb-1">Disseminated Intravascular Coagulation</div>
                        <div className="text-[10px] text-left space-y-0.5">
                          <span className="font-medium text-warning">CLUES:</span> systemic trigger (sepsis, trauma), coag abnormalities (↑PT, ↑PTT, ↑D-dimer)
                        </div>
                        <div className="text-[10px] text-left font-medium text-emerald-400">
                          TREATMENT: treat cause + FFP
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* HORIZONTAL SEPARATOR */}
                <div className="w-full border-t border-border my-4" />

                {/* HIT BRANCH */}
                <div className="flex flex-col items-center">
                  <div className="rounded-lg bg-card border-2 border-border px-4 py-2 text-center">
                    <div className="text-xs font-bold text-foreground">New thrombosis +</div>
                    <div className="text-xs font-bold text-foreground">heparin exposure?</div>
                  </div>
                  <div className="flex items-center gap-1 mt-1">
                    <span className="rounded-md border border-emerald-500/50 bg-emerald-500/10 px-2 py-0.5 text-xs font-bold text-emerald-400">YES</span>
                  </div>
                  <ArrowDown className="h-4 w-4 text-muted-foreground" />
                  <div className="rounded-xl border border-red-500/50 bg-red-500/20 px-3 py-2.5 space-y-1.5 text-left">
                    <div className="text-sm font-bold text-red-300 text-center">HIT</div>
                    <div className="text-[10px] text-muted-foreground text-center">Heparin-Induced Thrombocytopenia</div>

                    {/* Timing */}
                    <div className="text-[10px] leading-relaxed text-muted-foreground">
                      Seen <span className="font-medium text-red-200">5–10 days</span> after starting heparin. Paradoxical prothrombotic state — bleeding is rare; <span className="font-medium text-red-200">thrombosis</span> is the hallmark.
                    </div>

                    {/* Mechanism */}
                    <div className="bg-red-950/30 rounded-md border border-red-500/20 p-2 mt-1">
                      <div className="text-[10px] font-bold text-red-300 mb-1">MECHANISM</div>
                      <div className="text-[10px] text-muted-foreground leading-relaxed">
                        <span className="font-medium text-red-200">IgG antibodies</span> bind to <span className="font-medium text-red-200">PF4-heparin complex</span> → Fcγ receptor activation → platelet activation/consumption → <span className="font-medium text-amber-200">paradoxical thrombosis</span>
                      </div>
                    </div>

                    {/* Clinical Features */}
                    <div className="bg-red-950/20 rounded-md border border-red-500/15 p-2 mt-1">
                      <div className="text-[10px] font-bold text-red-300 mb-0.5">CLINICAL FEATURES</div>
                      <div className="text-[10px] text-muted-foreground">
                        🔴 <span className="font-medium">Thrombosis</span> (paradoxical) | 🩸 <span className="font-medium">Thrombocytopenia</span> | ⚪ <span className="font-medium text-rose-300">Bleeding is FALSE</span> — comment: <span className="italic">"Low platelets with new clot, not bleeding"</span>
                      </div>
                    </div>

                    {/* Management */}
                    <div className="bg-green-950/30 rounded-md border border-green-500/20 p-2 mt-1">
                      <div className="text-[10px] font-bold text-green-300 mb-1">MANAGEMENT</div>
                      <div className="text-[10px] text-muted-foreground">
                        <span className="font-medium text-red-200">Immediate: STOP all heparin</span> | <span className="font-medium text-emerald-300">Preferred:</span> <span className="text-emerald-200">Argatroban</span> or <span className="text-emerald-200">Bivalirudin</span> (direct thrombin inhibitors) | <span className="font-medium text-rose-300">Avoid: Warfarin</span>
                      </div>
                    </div>

                    {/* Warfarin Warning */}
                    <div className="bg-rose-950/30 rounded-md border border-rose-500/30 p-1.5 mt-1">
                      <div className="text-[10px] font-bold text-rose-300">⚠ WARFARIN WARNING</div>
                      <div className="text-[10px] text-rose-200/90">
                        Warfarin <span className="font-bold">worsens HIT</span> — depletes protein C early → worsens hypercoagulability → may cause <span className="font-bold">skin necrosis</span>. Never start warfarin until platelets recover &gt;150.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* SUMMARY TABLE */}
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-xs">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-3 py-2 text-left font-semibold text-foreground">Diagnosis</th>
                    <th className="px-3 py-2 text-left font-semibold text-foreground">MAHA / Schistocytes</th>
                    <th className="px-3 py-2 text-left font-semibold text-foreground">Key Clues</th>
                    <th className="px-3 py-2 text-left font-semibold text-foreground">Treatment</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t border-border">
                    <td className="px-3 py-2 font-semibold text-purple-400">ITP</td>
                    <td className="px-3 py-2 text-muted-foreground">—</td>
                    <td className="px-3 py-2 text-muted-foreground">Isolated low platelets, no systemic illness</td>
                    <td className="px-3 py-2 font-medium text-emerald-400">Steroids / IVIG</td>
                  </tr>
                  <tr className="border-t border-border">
                    <td className="px-3 py-2 font-semibold text-sky-400">TTP</td>
                    <td className="px-3 py-2 text-rose-400">YES</td>
                    <td className="px-3 py-2 text-muted-foreground">Fever, neuro signs, renal failure</td>
                    <td className="px-3 py-2 font-medium text-emerald-400">Plasmapheresis</td>
                  </tr>
                  <tr className="border-t border-border">
                    <td className="px-3 py-2 font-semibold text-amber-400">HUS</td>
                    <td className="px-3 py-2 text-rose-400">YES</td>
                    <td className="px-3 py-2 text-muted-foreground">Bloody diarrhea, renal failure, child</td>
                    <td className="px-3 py-2 font-medium text-emerald-400">Supportive care (NO abx)</td>
                  </tr>
                  <tr className="border-t border-border">
                    <td className="px-3 py-2 font-semibold text-rose-400">DIC</td>
                    <td className="px-3 py-2 text-rose-400">YES</td>
                    <td className="px-3 py-2 text-muted-foreground">Systemic trigger (sepsis/trauma), ↑PT/PTT/D-dimer</td>
                    <td className="px-3 py-2 font-medium text-emerald-400">Treat cause + FFP</td>
                  </tr>
                  <tr className="border-t border-border">
                    <td className="px-3 py-2 font-semibold text-red-400">HIT</td>
                    <td className="px-3 py-2 text-muted-foreground">—</td>
                    <td className="px-3 py-2 text-muted-foreground">Heparin exposure + thrombosis, platelet fall &gt;50%</td>
                    <td className="px-3 py-2 font-medium text-emerald-400">Stop heparin → DTI (argatroban)</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p className="text-muted-foreground">
              Based on Al-Samkari H, Kuter DJ. <em>How I diagnose and treat thrombocytopenia in geriatric patients.</em> Blood 2024.
            </p>

            {/* Algorithm Steps */}
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <span className="bg-destructive text-foreground text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0">1</span>
                <div>
                  <p className="font-medium text-foreground">Confirm True Thrombocytopenia</p>
                  <p className="text-xs text-muted-foreground mt-1">Review peripheral smear to exclude pseudothrombocytopenia (platelet clumping). If suspected, repeat using heparin or citrate tube.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="bg-destructive text-foreground text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0">2</span>
                <div>
                  <p className="font-medium text-foreground">Assess Other Cell Lines</p>
                  <p className="text-xs text-muted-foreground mt-1">Look for leukocyte abnormalities (blasts, dysplasia) or anemia suggesting underlying malignancy or bone marrow disorder.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="bg-destructive text-foreground text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0">3</span>
                <div>
                  <p className="font-medium text-foreground">Evaluate for Hemolysis</p>
                  <p className="text-xs text-muted-foreground mt-1">LDH, haptoglobin, reticulocyte count, direct antiglobulin test (DAT). Schistocytes on smear suggest TTP/HUS/DIC.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="bg-destructive text-foreground text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0">4</span>
                <div>
                  <p className="font-medium text-foreground">Mechanism-Based Classification</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                    <div className="bg-muted rounded-lg p-2 border border-border">
                      <p className="text-xs font-semibold text-destructive">↓ Production</p>
                      <p className="text-xs text-muted-foreground">MDS, malignancy, B12/folate deficiency</p>
                    </div>
                    <div className="bg-muted rounded-lg p-2 border border-border">
                      <p className="text-xs font-semibold text-destructive">↑ Destruction</p>
                      <p className="text-xs text-muted-foreground">ITP, drug-induced, autoimmune</p>
                    </div>
                    <div className="bg-muted rounded-lg p-2 border border-border">
                      <p className="text-xs font-semibold text-destructive">Consumption</p>
                      <p className="text-xs text-muted-foreground">DIC, TTP, HUS, TMA</p>
                    </div>
                    <div className="bg-muted rounded-lg p-2 border border-border">
                      <p className="text-xs font-semibold text-destructive">Sequestration</p>
                      <p className="text-xs text-muted-foreground">Hypersplenism/portal hypertension</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="bg-destructive text-foreground text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0">5</span>
                <div>
                  <p className="font-medium text-foreground">Red Flags Requiring Urgent Action</p>
                  <ul className="text-xs text-muted-foreground mt-1 space-y-1 list-disc list-inside">
                    <li>Platelets &lt;10,000/μL (spontaneous bleeding risk)</li>
                    <li>Neurologic symptoms or renal dysfunction (TTP)</li>
                    <li>Recent heparin exposure (HIT)</li>
                    <li>Hemolysis on smear with thrombocytopenia</li>
                    <li>Fever + thrombocytopenia</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* HIT 4Ts Score Reference */}
            <div className="bg-amber-900/20 rounded-lg p-3 border border-amber-800/50 mt-4">
              <p className="font-semibold text-amber-300 text-xs">HIT 4Ts Score (Pretest Probability)</p>
              <p className="text-xs text-warning mt-1">
                <strong>Thrombocytopenia:</strong> &gt;50% fall = 2 pts, 10-50% = 1 pt, &lt;10% = 0 pts<br/>
                <strong>Timing:</strong> 5-10 days = 2 pts, &gt;10 days or &lt;4 days = 1 pt<br/>
                <strong>Thrombosis:</strong> Confirmed thrombosis = 2 pts, progressive/recurrent = 1 pt<br/>
                <strong>Other causes:</strong> None = 2 pts, Possible = 1 pt, Definite = 0 pts<br/>
                <strong>Score:</strong> 0-3 = Low (risk &lt;1%), 4-5 = Intermediate (risk ~10%), 6-8 = High (risk &gt;50%)
              </p>
            </div>

            <p className="text-xs text-muted-foreground pt-2">
              Sources: Al-Samkari H, Kuter DJ. Blood 2024; ASH 2019 ITP Guidelines; ASH HIT Guidelines.
            </p>

            {/* Thrombocytopenia Diagnostic Algorithm Reference Image */}
            <div className="mt-4 rounded-lg overflow-hidden border border-border">
              <img
                src="/thrombocytopenia-algorithm.jpg"
                alt="Thrombocytopenia Diagnostic Algorithm"
                className="w-full h-auto"
              />
              <p className="text-[10px] text-muted-foreground text-center py-1.5 bg-muted/30">
                Thrombocytopenia Diagnostic Algorithm — Reference Card
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
