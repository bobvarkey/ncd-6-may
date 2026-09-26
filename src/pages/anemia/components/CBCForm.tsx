import type { CBCValues, Sex } from '../types';
import Tooltip from './Tooltip';

interface Props {
  values: CBCValues;
  sex: Sex;
  onChange: (field: keyof CBCValues, value: string) => void;
  onSexChange: (sex: Sex) => void;
  onEvaluate: () => void;
  onReset: () => void;
}

const paramInfo: Record<keyof CBCValues, { what: string; normal: string; low: string; high: string }> = {
  hgb: {
    what: 'Hemoglobin (Hgb) — the oxygen-carrying protein inside red blood cells, measured in g/dL.',
    normal: 'Men: 13.5–17.5 g/dL | Women: 12.0–16.0 g/dL | Pregnant: ≥ 11.0 g/dL | Children: 11.0–14.0 g/dL',
    low: 'Anemia — from iron/B12/folate deficiency, blood loss, hemolysis, chronic disease, bone marrow failure, or thalassemia.',
    high: 'Polycythemia — dehydration, chronic hypoxia (COPD, high altitude), polycythemia vera, or EPO-secreting tumors.',
  },
  rbc: {
    what: 'RBC Count — number of red blood cells per litre of blood (×10¹²/L). Used in multiple discriminant indices.',
    normal: 'Men: 4.5–5.9 ×10¹²/L | Women: 4.0–5.2 ×10¹²/L | Children: 3.8–5.2 ×10¹²/L',
    low: 'Anemia, bone marrow suppression, hemolysis, nutritional deficiencies, or chronic kidney disease.',
    high: 'Polycythemia vera, chronic hypoxia, dehydration, or spurious elevation.',
  },
  mcv: {
    what: 'Mean Corpuscular Volume (MCV) — average size of a single red blood cell in femtolitres (fL). Key for morphological classification.',
    normal: 'Adults & children (>6y): 80–100 fL',
    low: 'Microcytic anemia — iron deficiency, thalassemia, sideroblastic anemia, anemia of chronic disease, or lead poisoning.',
    high: 'Macrocytic anemia — B12/folate deficiency, liver disease, hypothyroidism, alcohol use, medications (hydroxyurea, methotrexate), or myelodysplasia.',
  },
  mch: {
    what: 'Mean Corpuscular Hemoglobin (MCH) — average amount of hemoglobin per red cell in picograms (pg). Parallels MCV in most cases.',
    normal: 'Adults: 27–33 pg | Children: 24–30 pg',
    low: 'Hypochromia — iron deficiency, thalassemia, or sideroblastic anemia. Closely mirrors a low MCV.',
    high: 'Hyperchromia — macrocytic states (B12/folate deficiency), or hereditary spherocytosis.',
  },
  mchc: {
    what: 'Mean Corpuscular Hemoglobin Concentration (MCHC) — hemoglobin concentration per unit volume of RBCs (g/dL). Assesses degree of hemoglobin packing.',
    normal: '32–36 g/dL',
    low: 'Hypochromic cells — iron deficiency anemia or thalassemia (cells are pale and under-filled with hemoglobin).',
    high: 'Spherocytosis (hereditary or immune hemolysis) — cells are small and densely packed. Also seen in severe burns or HbC disease.',
  },
  rdw: {
    what: 'Red Cell Distribution Width (RDW) — coefficient of variation in red cell size. Reflects anisocytosis (inequality of RBC sizes).',
    normal: '11.5–14.5%',
    low: 'Rarely clinically significant; may be seen in aplastic states where all cells are uniformly abnormal.',
    high: 'Anisocytosis — iron deficiency anemia (earliest sign), mixed deficiency (iron + B12/folate), hemolytic anemia, recent transfusion, or early response to treatment. A high RDW with low MCV strongly suggests IDA over thalassemia.',
  },
  hct: {
    what: 'Hematocrit (Hct) — proportion of blood volume occupied by red blood cells, expressed as a percentage.',
    normal: 'Men: 41–53% | Women: 36–46% | Pregnant: 33–44% | Children: 35–45%',
    low: 'Anemia — mirrors hemoglobin; reduced in all causes of anemia. Hct ≈ 3 × Hgb is a useful approximation.',
    high: 'Polycythemia, dehydration, chronic hypoxia. Hct > 60% significantly raises thrombotic risk.',
  },
};

const fields: { key: keyof CBCValues; label: string; unit: string; placeholder: string; min: number; max: number }[] = [
  { key: 'hgb',  label: 'Hemoglobin',  unit: 'g/dL',    placeholder: 'e.g. 9.5',  min: 1,   max: 20  },
  { key: 'rbc',  label: 'RBC Count',   unit: '×10¹²/L', placeholder: 'e.g. 3.8',  min: 0.5, max: 8   },
  { key: 'mcv',  label: 'MCV',         unit: 'fL',       placeholder: 'e.g. 68',   min: 40,  max: 140 },
  { key: 'mch',  label: 'MCH',         unit: 'pg',       placeholder: 'e.g. 22',   min: 10,  max: 50  },
  { key: 'mchc', label: 'MCHC',        unit: 'g/dL',     placeholder: 'e.g. 31',   min: 20,  max: 40  },
  { key: 'rdw',  label: 'RDW',         unit: '%',        placeholder: 'e.g. 16.5', min: 8,   max: 30  },
  { key: 'hct',  label: 'Hematocrit',  unit: '%',        placeholder: 'e.g. 30',   min: 5,   max: 65  },
];

const sexOptions: { value: Sex; label: string }[] = [
  { value: 'male',     label: 'Adult Male (≥15y)' },
  { value: 'female',   label: 'Adult Female (≥15y)' },
  { value: 'pregnant', label: 'Pregnant Female' },
  { value: 'child',    label: 'Child (6m–14y)' },
];

export default function CBCForm({ values, sex, onChange, onSexChange, onEvaluate, onReset }: Props) {
  const canEvaluate = values.hgb !== '' && values.mcv !== '';

  return (
    <div className="bg-card rounded-2xl shadow-sm border border-border p-6">
      <h2 className="text-lg font-semibold text-foreground mb-1">Complete Blood Count (CBC)</h2>
      <p className="text-sm text-muted-foreground mb-5">
        Enter available parameters. Hover the <span className="inline-flex items-center gap-0.5 text-primary font-medium"><span className="text-xs">ⓘ</span></span> icon for a description, normal range, and clinical significance of each value.
      </p>

      {/* Sex selector */}
      <div className="mb-5">
        <label className="block text-sm font-medium text-muted-foreground mb-2">Patient Category</label>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {sexOptions.map(opt => (
            <button
              key={opt.value}
              onClick={() => onSexChange(opt.value)}
              className={`py-2 px-3 rounded-lg text-sm font-medium transition-all border ${
                sex === opt.value
                  ? 'bg-primary text-foreground border-sky-600 shadow-sm'
                  : 'bg-muted text-muted-foreground border-border hover:border-primary hover:bg-muted'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* CBC fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        {fields.map(f => (
          <div key={f.key}>
            <label className="flex items-center text-sm font-medium text-muted-foreground mb-1">
              {f.label}
              {(f.key === 'hgb' || f.key === 'mcv') && (
                <span className="ml-1 text-destructive text-xs">*</span>
              )}
              <Tooltip content={paramInfo[f.key]} />
            </label>
            <div className="relative">
              <input
                type="number"
                step="any"
                min={f.min}
                max={f.max}
                value={values[f.key]}
                onChange={e => onChange(f.key, e.target.value)}
                placeholder={f.placeholder}
                className="w-full pr-16 pl-3 py-2.5 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all bg-muted text-foreground hover:bg-muted placeholder-muted-foreground"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-medium pointer-events-none">
                {f.unit}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-3">
        <button
          onClick={onEvaluate}
          disabled={!canEvaluate}
          className="flex-1 py-3 px-6 bg-primary hover:bg-primary/80 disabled:bg-muted disabled:text-muted-foreground text-foreground font-semibold rounded-xl transition-all shadow-sm hover:shadow-md disabled:shadow-none text-sm"
        >
          Evaluate
        </button>
        <button
          onClick={onReset}
          className="py-3 px-5 bg-muted hover:bg-muted text-muted-foreground font-medium rounded-xl transition-all text-sm border border-border"
        >
          Reset
        </button>
      </div>
      <p className="text-xs text-muted-foreground mt-3 text-center">
        * Required. For discriminant indices, also provide RBC, MCH, and RDW.
      </p>
    </div>
  );
}
