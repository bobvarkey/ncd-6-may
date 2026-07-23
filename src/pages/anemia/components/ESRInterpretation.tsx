import { useState } from 'react';
import { Timer, TrendingUp, TrendingDown, Activity, Info, ChevronDown, ChevronUp, AlertTriangle, FlaskConical, ClipboardList, ArrowRight } from 'lucide-react';

interface ESRRange {
  group: string;
  age: string;
  range: string;
  max: number;
}

const NORMAL_RANGES: ESRRange[] = [
  { group: 'Male', age: '< 50 years', range: '< 15 mm/hr', max: 15 },
  { group: 'Male', age: '> 50 years', range: '< 20 mm/hr', max: 20 },
  { group: 'Female', age: '< 50 years', range: '< 20 mm/hr', max: 20 },
  { group: 'Female', age: '> 50 years', range: '< 30 mm/hr', max: 30 },
];

const ELEVATED_CAUSES = {
  infection: ['Pneumonia', 'UTIs', 'Sepsis'],
  inflammation: ['Rheumatoid arthritis', 'Lupus', 'Vasculitis'],
  cancer: ['Lymphoma', 'Multiple myeloma', 'Metastatic cancers'],
  other: ['Anemia', 'Pregnancy', 'Kidney disease', 'Heart disease', 'Trauma', 'Preeclampsia'],
};

const LOW_CAUSES = [
  'Polycythemia',
  'Sickle cell disease',
  'Spherocytosis',
  'Low protein levels',
  'Leukemia',
  'Congestive heart failure',
];

interface NextStep {
  label: string;
  urgency: 'routine' | 'urgent' | 'emergency';
  details?: string;
}

interface FollowUpLab {
  name: string;
  indication: string;
}

const ELEVATED_NEXT_STEPS: Record<string, NextStep[]> = {
  'Mild elevation (≤2× upper limit)': [
    { label: 'Repeat ESR in 4–6 weeks', urgency: 'routine', details: 'Confirm persistence before extensive workup.' },
    { label: 'Review medications', urgency: 'routine', details: 'Oral contraceptives, steroids, and IVIG can raise ESR.' },
  ],
  'Moderate elevation (>2× upper limit)': [
    { label: 'Order follow-up labs (see below)', urgency: 'routine' },
    { label: 'Targeted history & physical', urgency: 'routine', details: 'Focus on infection signs, autoimmune symptoms, weight change, and bleeding.' },
    { label: 'Consider imaging if localized symptoms', urgency: 'routine', details: 'CXR for respiratory symptoms; joint imaging for monoarthritis.' },
  ],
  'Marked elevation (>100 mm/hr)': [
    { label: 'Urgent evaluation for occult infection or malignancy', urgency: 'urgent', details: 'ESR >100 has high positive predictive value for serious disease.' },
    { label: 'Age-appropriate cancer screening', urgency: 'urgent', details: 'Ensure colonoscopy, mammography, and low-dose CT (if smoker) are up to date.' },
    { label: 'SPEP / UPEP with immunofixation', urgency: 'urgent', details: 'Rule out plasma cell dyscrasia (multiple myeloma).' },
  ],
};

const ELEVATED_FOLLOW_UP_LABS: FollowUpLab[] = [
  { name: 'C-Reactive Protein (CRP)', indication: 'Confirm inflammatory activity; CRP rises and falls faster than ESR.' },
  { name: 'CBC with differential', indication: 'Leukocytosis suggests infection; anemia of chronic disease is common.' },
  { name: 'Comprehensive Metabolic Panel', indication: 'Renal/hepatic dysfunction, hypoalbuminemia, or hyperglobulinemia.' },
  { name: 'Ferritin', indication: 'Elevated ferritin supports inflammation; low ferritin suggests iron deficiency as cause.' },
  { name: 'ANA & RF / anti-CCP', indication: 'If autoimmune features (arthralgia, rash, serositis) present.' },
  { name: 'SPEP / UPEP with immunofixation', indication: 'If ESR >100 or clinical suspicion for plasma cell dyscrasia.' },
  { name: 'TB testing (IGRA / TST)', indication: 'If risk factors or constitutional symptoms without clear source.' },
  { name: 'Blood cultures ×2', indication: 'If febrile or hemodynamically unstable.' },
  { name: 'LDH, uric acid, calcium', indication: 'If malignancy or lymphoma suspected.' },
];

const LOW_NEXT_STEPS: NextStep[] = [
  { label: 'Repeat ESR with CBC & peripheral smear', urgency: 'routine', details: 'Confirm low result and assess RBC morphology.' },
  { label: 'Check hematocrit / hemoglobin', urgency: 'routine', details: 'Elevated Hct supports polycythemia; low Hct with low ESR is unusual.' },
  { label: 'Serum protein electrophoresis', urgency: 'routine', details: 'If low protein levels suspected clinically.' },
  { label: 'Review red-cell indices (MCV, MCHC)', urgency: 'routine', details: 'Spherocytosis or sickle cell may show characteristic indices.' },
];

const RED_FLAGS = [
  'ESR >100 mm/hr',
  'Fever >38.3°C or rigors',
  'Unintentional weight loss >10% in 6 months',
  'Night sweats',
  'New focal neurologic deficit',
  'Severe back pain with fever (possible spinal infection)',
  'Acute monoarthritis with fever',
  'Immunocompromised host',
];

export default function ESRInterpretation() {
  const [esrValue, setEsrValue] = useState<string>('');
  const [age, setAge] = useState<string>('');
  const [sex, setSex] = useState<'male' | 'female'>('male');
  const [showRanges, setShowRanges] = useState(true);

  const esrNum = parseFloat(esrValue);
  const ageNum = parseFloat(age);

  function getNormalMax(): number | null {
    if (!sex) return null;
    if (sex === 'male') return ageNum >= 50 ? 20 : 15;
    return ageNum >= 50 ? 30 : 20;
  }

  const normalMax = getNormalMax();
  let interpretation: 'normal' | 'high' | 'low' | null = null;
  if (!isNaN(esrNum) && normalMax !== null) {
    if (esrNum < 1) interpretation = 'low';
    else if (esrNum <= normalMax) interpretation = 'normal';
    else interpretation = 'high';
  }

  return (
    <div className="space-y-6">
      {/* Header / Definition */}
      <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center border border-destructive/30">
              <Timer className="w-5 h-5 text-rose-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">ESR Interpretation</h2>
              <p className="text-xs text-muted-foreground">Erythrocyte Sedimentation Rate</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div className="bg-primary/10 border border-primary/20 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm text-foreground leading-relaxed">
                  <strong>ESR</strong> is a measure of how fast red blood cells settle in a tube over one hour.
                  Standard methods include <strong>Westergren</strong> or <strong>Wintrobe</strong>.
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Slow settling = normal RBC sedimentation. Fast settling = elevated ESR.
                </p>
              </div>
            </div>
          </div>

          {/* Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">ESR Value</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={esrValue}
                  onChange={(e) => setEsrValue(e.target.value)}
                  placeholder="e.g. 25"
                  className="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <span className="text-sm text-muted-foreground whitespace-nowrap">mm/hr</span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">Age</label>
              <input
                type="number"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="e.g. 45"
                className="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">Sex</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setSex('male')}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium border transition-all ${
                    sex === 'male'
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-card text-foreground border-border hover:border-muted-foreground'
                  }`}
                >
                  Male
                </button>
                <button
                  onClick={() => setSex('female')}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium border transition-all ${
                    sex === 'female'
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-card text-foreground border-border hover:border-muted-foreground'
                  }`}
                >
                  Female
                </button>
              </div>
            </div>
          </div>

          {/* Interpretation result */}
          {interpretation && (
            <div
              className={`rounded-xl border p-4 flex items-center gap-3 ${
                interpretation === 'normal'
                  ? 'bg-success/10 border-success/30'
                  : interpretation === 'high'
                  ? 'bg-destructive/10 border-destructive/30'
                  : 'bg-warning/10 border-warning/30'
              }`}
            >
              {interpretation === 'normal' && <Activity className="w-5 h-5 text-emerald-600" />}
              {interpretation === 'high' && <TrendingUp className="w-5 h-5 text-rose-600" />}
              {interpretation === 'low' && <TrendingDown className="w-5 h-5 text-warning" />}
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {interpretation === 'normal' && 'ESR within normal range'}
                  {interpretation === 'high' && `Elevated ESR (> ${normalMax} mm/hr for ${sex}, age ${ageNum}+)`}
                  {interpretation === 'low' && 'Low ESR (< 1 mm/hr)'}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {interpretation === 'normal' && 'No acute inflammatory process suggested by ESR alone.'}
                  {interpretation === 'high' && 'Consider infection, inflammation, malignancy, or other causes below.'}
                  {interpretation === 'low' && 'Consider polycythemia, sickle cell disease, low protein, CHF, or leukemia.'}
                </p>
              </div>
            </div>
          )}

          {/* Red Flags — Urgent Evaluation */}
          {interpretation && interpretation !== 'normal' && (
            <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-foreground mb-2">When to Consider Urgent Evaluation</p>
                  <ul className="space-y-1">
                    {RED_FLAGS.map((flag) => (
                      <li key={flag} className="flex items-start gap-2 text-sm text-foreground">
                        <ArrowRight className="w-3.5 h-3.5 text-red-500 mt-0.5 flex-shrink-0" />
                        {flag}
                      </li>
                    ))}
                  </ul>
                  <p className="text-xs text-muted-foreground mt-2">
                    Any red flag in the setting of an abnormal ESR warrants prompt clinician review and targeted workup.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Next Steps */}
          {interpretation && interpretation !== 'normal' && (
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="p-4 border-b border-border flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-primary" />
                <p className="text-sm font-semibold text-foreground">Recommended Next Steps</p>
              </div>
              <div className="p-4 space-y-4">
                {interpretation === 'high' && (
                  <>
                    {(() => {
                      const severity = esrNum > 100 ? 'Marked elevation (>100 mm/hr)' : esrNum > (normalMax || 0) * 2 ? 'Moderate elevation (>2× upper limit)' : 'Mild elevation (≤2× upper limit)';
                      const steps = ELEVATED_NEXT_STEPS[severity] || [];
                      return (
                        <div>
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">{severity}</p>
                          <div className="space-y-2">
                            {steps.map((step, i) => (
                              <div key={i} className={`rounded-lg border p-3 ${step.urgency === 'urgent' ? 'bg-destructive/10 border-destructive/30' : 'bg-muted border-border'}`}>
                                <div className="flex items-center gap-2">
                                  <span className={`text-xs font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${step.urgency === 'urgent' ? 'bg-red-900/40 text-red-300' : 'bg-muted text-muted-foreground'}`}>
                                    {step.urgency}
                                  </span>
                                  <p className="text-sm font-medium text-foreground">{step.label}</p>
                                </div>
                                {step.details && (
                                  <p className="text-xs text-muted-foreground mt-1 ml-[calc(10px+0.5rem+2px)]">{step.details}</p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })()}
                  </>
                )}
                {interpretation === 'low' && (
                  <div className="space-y-2">
                    {LOW_NEXT_STEPS.map((step, i) => (
                      <div key={i} className="rounded-lg border border-border bg-muted p-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                            {step.urgency}
                          </span>
                          <p className="text-sm font-medium text-foreground">{step.label}</p>
                        </div>
                        {step.details && (
                          <p className="text-xs text-muted-foreground mt-1 ml-[calc(10px+0.5rem+2px)]">{step.details}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Follow-up Labs for Elevated ESR */}
          {interpretation === 'high' && (
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="p-4 border-b border-border flex items-center gap-2">
                <FlaskConical className="w-5 h-5 text-primary" />
                <p className="text-sm font-semibold text-foreground">Suggested Follow-up Labs</p>
              </div>
              <div className="p-4">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-2 px-3 font-semibold text-foreground">Test</th>
                        <th className="text-left py-2 px-3 font-semibold text-foreground">Rationale</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ELEVATED_FOLLOW_UP_LABS.map((lab, i) => (
                        <tr key={i} className="border-b border-border last:border-0">
                          <td className="py-2 px-3 font-medium text-foreground whitespace-nowrap">{lab.name}</td>
                          <td className="py-2 px-3 text-muted-foreground">{lab.indication}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="text-xs text-muted-foreground mt-3">
                  Order selectively based on clinical context. Not all tests are indicated in every patient.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Normal Ranges */}
      <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
        <button
          onClick={() => setShowRanges(!showRanges)}
          className="w-full p-6 flex items-center justify-between border-b border-border"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/30">
              <Activity className="w-5 h-5 text-sky-600" />
            </div>
            <div className="text-left">
              <h3 className="text-lg font-bold text-foreground">Normal ESR Ranges</h3>
              <p className="text-xs text-muted-foreground">Age and sex-specific reference values</p>
            </div>
          </div>
          {showRanges ? <ChevronUp className="w-5 h-5 text-muted-foreground" /> : <ChevronDown className="w-5 h-5 text-muted-foreground" />}
        </button>

        {showRanges && (
          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 px-3 font-semibold text-foreground">Group</th>
                    <th className="text-left py-2 px-3 font-semibold text-foreground">Age</th>
                    <th className="text-left py-2 px-3 font-semibold text-foreground">Upper Limit</th>
                  </tr>
                </thead>
                <tbody>
                  {NORMAL_RANGES.map((r, i) => (
                    <tr key={i} className="border-b border-border last:border-0">
                      <td className="py-2 px-3 text-muted-foreground">{r.group}</td>
                      <td className="py-2 px-3 text-muted-foreground">{r.age}</td>
                      <td className="py-2 px-3 font-medium text-foreground">{r.range}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              Higher values in females and older adults reflect physiological differences in plasma proteins and hematocrit.
            </p>
          </div>
        )}
      </div>

      {/* Elevated ESR Causes */}
      <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center border border-destructive/30">
              <TrendingUp className="w-5 h-5 text-rose-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground">Causes of Elevated ESR</h3>
              <p className="text-xs text-muted-foreground">Common and important differentials</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-4">
          {Object.entries(ELEVATED_CAUSES).map(([category, items]) => (
            <div key={category}>
              <h4 className="text-sm font-semibold text-foreground capitalize mb-2">{category}</h4>
              <div className="flex flex-wrap gap-2">
                {items.map((item) => (
                  <span
                    key={item}
                    className="px-3 py-1 rounded-full text-xs font-medium bg-muted text-foreground border border-border"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Low ESR Causes */}
      <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center border border-warning/30">
              <TrendingDown className="w-5 h-5 text-warning" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground">Causes of Low ESR</h3>
              <p className="text-xs text-muted-foreground">Less common but clinically significant</p>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="flex flex-wrap gap-2">
            {LOW_CAUSES.map((item) => (
              <span
                key={item}
                className="px-3 py-1 rounded-full text-xs font-medium bg-muted text-foreground border border-border"
              >
                {item}
              </span>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            Low ESR usually reflects altered red-cell morphology (e.g., sickled or spherocytic cells) or reduced plasma fibrinogen.
          </p>
        </div>
      </div>
    </div>
  );
}
