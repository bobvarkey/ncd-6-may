import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { CBCValues, Sex, EvaluationResult } from './anemia/types';
import { evaluate } from './anemia/utils/anemia';
import CBCForm from './anemia/components/CBCForm';
import ClassificationCard from './anemia/components/ClassificationCard';
import DiscriminantTable from './anemia/components/DiscriminantTable';
import CausesPanel from './anemia/components/CausesPanel';
import ReferenceRanges from './anemia/components/ReferenceRanges';
import IronTherapy from './anemia/components/IronTherapy';
import IronStudiesCombined from './anemia/components/IronStudiesCombined';
import IronInterpretation from './anemia/components/IronInterpretation';
import ThrombocytopeniaEvaluator from './anemia/components/ThrombocytopeniaEvaluator';
import BleedingClottingEvaluator from './anemia/components/BleedingClottingEvaluator';
import ESRInterpretation from './anemia/components/ESRInterpretation';
import Anticoagulants from './anemia/components/Anticoagulants';
import { Microscope, AlertTriangle } from 'lucide-react';
import TestSuggestionAlgorithm from './anemia/components/TestSuggestionAlgorithm';

const EMPTY_CBC: CBCValues = { hgb: '', rbc: '', mcv: '', mch: '', mchc: '', rdw: '', hct: '' };

type Tab = 'anemia' | 'thrombocytopenia' | 'bleeding-clotting' | 'iron' | 'esr' | 'anticoagulants';

export default function Anemia() {
  const [searchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const validTabs: Tab[] = ['anemia', 'thrombocytopenia', 'bleeding-clotting', 'iron', 'esr', 'anticoagulants'];
  const activeTab: Tab = validTabs.includes(tabParam as Tab) ? (tabParam as Tab) : 'anemia';
  const [cbc, setCbc] = useState<CBCValues>(() => {
    try { const s = localStorage.getItem('ncd_anemia_cbc'); return s ? JSON.parse(s) : EMPTY_CBC; } catch { return EMPTY_CBC; }
  });
  const [sex, setSex] = useState<Sex>(() => {
    try { return (localStorage.getItem('ncd_anemia_sex') as Sex) || 'male'; } catch { return 'male'; }
  });
  const [result, setResult] = useState<EvaluationResult | null>(null);

  // Auto-save
  useEffect(() => { localStorage.setItem('ncd_anemia_cbc', JSON.stringify(cbc)); }, [cbc]);
  useEffect(() => { if (sex) localStorage.setItem('ncd_anemia_sex', sex); }, [sex]);

  function handleChange(field: keyof CBCValues, value: string) {
    setCbc(prev => ({ ...prev, [field]: value }));
    setResult(null);
  }

  function handleEvaluate() {
    setResult(evaluate(cbc, sex));
    setTimeout(() => {
      document.getElementById('results')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  }

  function handleSmartParse(values: Record<string, string>) {
    Object.entries(values).forEach(([key, value]) => {
      handleChange(key as keyof CBCValues, value);
    });
  }

  function handleReset() {
    setCbc(EMPTY_CBC);
    setResult(null);
  }

  const hgbNum = parseFloat(cbc.hgb);
  const mcvNum = parseFloat(cbc.mcv);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="bg-card border-b border-border shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow-sm">
              <Microscope className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground leading-tight">Hematology Evaluators</h1>
              <p className="text-xs text-muted-foreground leading-tight">CBC-based diagnostic decision-support tools</p>
            </div>
          </div>

          {/* Sub-navigation hint — use sidebar tabs */}
        </div>
      </header>


      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Disclaimer */}
        <div className="flex items-start gap-3 bg-amber-900/20 border border-amber-800/50 rounded-xl px-4 py-3 text-sm text-amber-300">
          <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0 text-amber-500" />
          <p>
            This tool is for <strong>educational and decision-support purposes only</strong>. Always correlate with clinical presentation.
          </p>
        </div>


        {activeTab === 'anemia' ? (
          <>
            {/* Input form */}
            <CBCForm
              values={cbc}
              sex={sex}
              onChange={handleChange}
              onSexChange={setSex}
              onEvaluate={handleEvaluate}
              onReset={handleReset}
            />

            {/* Results */}
            {result && (
              <div id="results" className="space-y-5 pt-1">
                {result.missingFields.length > 0 && result.missingFields.includes('Hemoglobin') && (
                  <div className="flex items-center gap-2 text-sm text-amber-700 bg-warning/10 border border-amber-100 rounded-xl px-4 py-3">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                    Missing required fields: {result.missingFields.join(', ')}
                  </div>
                )}

                {result.classification.severity !== 'N/A' && (
                  <ClassificationCard
                    classification={result.classification}
                    hgb={hgbNum}
                    mcv={mcvNum}
                    sex={sex}
                    discriminantResults={result.discriminantResults}
                  />
                )}

                {result.classification.severity !== 'None' && result.classification.severity !== 'N/A' && (
                  <CausesPanel
                    morphology={result.classification.morphology}
                    severity={result.classification.severity}
                  />
                )}

                {/* Hemolytic Anemia Diagnostic Algorithm */}
                {result.classification.morphology === 'Normocytic' && (
                  <div className="bg-card rounded-2xl shadow-sm border border-border p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Microscope className="w-5 h-5 text-primary" />
                      <h2 className="text-lg font-semibold text-foreground">Hemolytic Anemia Diagnostic Algorithm</h2>
                    </div>
                    <p className="text-xs text-muted-foreground mb-3">
                      Stepwise approach for Coombs-negative hemolytic anemia workup. Click to view full size.
                    </p>
                    <a href="/images/hemolytic-anemia-algorithm.jpg" target="_blank" rel="noopener noreferrer" className="block rounded-lg overflow-hidden border border-border">
                      <img
                        src="/images/hemolytic-anemia-algorithm.jpg"
                        alt="Hemolytic Anemia Diagnostic Algorithm"
                        className="w-full h-auto object-contain"
                        loading="lazy"
                      />
                    </a>
                  </div>
                )}

                <DiscriminantTable
                  results={result.discriminantResults}
                  idaCount={result.idaCount}
                  thalCount={result.thalCount}
                  consensus={result.consensus}
                />
              </div>
            )}

            {/* Reference ranges */}
            <ReferenceRanges />

            {/* IV Iron Replacement */}
            <IronTherapy />

            {/* Next Test Algorithm */}
            <TestSuggestionAlgorithm />
          </>
        ) : activeTab === 'iron' ? (
          <>
            <IronInterpretation />
            <IronStudiesCombined />
            <IronTherapy />
          </>

        ) : activeTab === 'bleeding-clotting' ? (
          <BleedingClottingEvaluator />
        ) : activeTab === 'esr' ? (
          <ESRInterpretation />
        ) : activeTab === 'anticoagulants' ? (
          <Anticoagulants />
        ) : (
          <ThrombocytopeniaEvaluator />
        )}
      </main>
    </div>
  );
}
