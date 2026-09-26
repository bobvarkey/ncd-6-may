import type { AnemiaClassification } from '../types';
import { Lightbulb } from 'lucide-react';

interface Props {
  morphology: AnemiaClassification['morphology'];
  severity: AnemiaClassification['severity'];
}

const morphologyCauses: Record<string, { causes: string[]; workup: string[] }> = {
  Microcytic: {
    causes: [
      'Iron deficiency anemia (most common)',
      'Thalassemia (alpha or beta)',
      'Anemia of chronic disease (some cases)',
      'Sideroblastic anemia',
      'Lead poisoning',
      'Chronic gastrointestinal blood loss (H. pylori, ulcer)',
      'Parasitic infections (hookworm, whipworm)',
    ],
    workup: [
      'Serum ferritin, iron, TIBC',
      'Hemoglobin electrophoresis / HPLC',
      'Peripheral blood smear',
      'Reticulocyte count',
      'Stool occult blood / colonoscopy (if IDA unexplained)',
      'Stool ova & parasite examination (if eosinophilia/travel)',
      'Serum lead level (if indicated)',
    ],
  },
  Normocytic: {
    causes: [
      'Acute blood loss',
      'Hemolytic anemia',
      'Anemia of chronic disease',
      'Renal failure (EPO deficiency)',
      'Mixed deficiency (iron + B12/folate)',
      'Aplastic anemia / bone marrow failure',
      'Chronic GI blood loss (occult)',
    ],
    workup: [
      'Reticulocyte count (& index)',
      'Peripheral blood smear',
      'LDH, haptoglobin, indirect bilirubin',
      'Stool occult blood x3 / colonoscopy',
      'Stool ova & parasite (if eosinophilia/travel history)',
      'Serum creatinine / eGFR',
      'Bone marrow biopsy (if indicated)',
      'Coombs test',
    ],
  },
  Macrocytic: {
    causes: [
      'Vitamin B12 deficiency',
      'Folate deficiency',
      'Liver disease / alcohol use',
      'Hypothyroidism',
      'Medications (methotrexate, hydroxyurea)',
      'Myelodysplastic syndrome',
    ],
    workup: [
      'Serum B12, folate, methylmalonic acid',
      'Homocysteine level',
      'Thyroid function tests (TSH)',
      'Liver function tests',
      'Peripheral blood smear',
      'Bone marrow biopsy (if MDS suspected)',
    ],
  },
};

export default function CausesPanel({ morphology, severity }: Props) {
  if (morphology === 'N/A' || severity === 'None' || severity === 'N/A') return null;

  const data = morphologyCauses[morphology];
  if (!data) return null;

  return (
    <div className="bg-card rounded-2xl shadow-sm border border-border p-6">
      <div className="flex items-center gap-2 mb-4">
        <Lightbulb className="w-5 h-5 text-warning" />
        <h2 className="text-lg font-semibold text-foreground">Differential Diagnosis</h2>
        <span className="text-xs bg-amber-900/30 text-warning border border-amber-800 px-2 py-0.5 rounded-full font-medium">
          {morphology} Anemia
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Common Causes</h3>
          <ul className="space-y-2">
            {data.causes.map(c => (
              <li key={c} className="flex items-start gap-2 text-sm text-muted-foreground">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
                {c}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Recommended Workup</h3>
          <ul className="space-y-2">
            {data.workup.map(w => (
              <li key={w} className="flex items-start gap-2 text-sm text-muted-foreground">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-400 mt-1.5 flex-shrink-0" />
                {w}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
