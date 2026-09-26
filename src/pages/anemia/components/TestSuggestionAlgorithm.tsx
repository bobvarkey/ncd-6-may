import { useState } from 'react';
import { TestTube, ChevronRight, Microscope, Beaker, FileText, ArrowRight } from 'lucide-react';

type MorphologyType = 'microcytic' | 'normocytic' | 'macrocytic' | null;

interface TestCategory {
  category: string;
  icon: React.ReactNode;
  tests: string[];
  urgency: 'routine' | 'urgent' | 'immediate';
}

const testRecommendations: Record<string, TestCategory[]> = {
  microcytic: [
    {
      category: 'Iron Studies (First Line)',
      icon: <Beaker className="w-4 h-4" />,
      tests: [
        'Serum ferritin — most sensitive for iron deficiency',
        'Serum iron and TIBC / transferrin saturation',
        'Soluble transferrin receptor (sTfR) if ferritin equivocal',
      ],
      urgency: 'immediate',
    },
    {
      category: 'Hemoglobin Analysis',
      icon: <Microscope className="w-4 h-4" />,
      tests: [
        'Hemoglobin electrophoresis / HPLC',
        'Hemoglobin A2 and F quantification',
        'Alpha-globin gene deletion analysis (if beta-thalassemia ruled out)',
      ],
      urgency: 'routine',
    },
    {
      category: 'Supporting Tests',
      icon: <FileText className="w-4 h-4" />,
      tests: [
        'Peripheral blood smear (target cells, hypochromia)',
        'Reticulocyte count',
        'Serum lead level (if occupational exposure suspected)',
        'C-reactive protein or ESR (if anemia of chronic disease suspected)',
      ],
      urgency: 'routine',
    },
  ],
  normocytic: [
    {
      category: 'Hemolysis Workup (Priority)',
      icon: <Beaker className="w-4 h-4" />,
      tests: [
        'Reticulocyte count and reticulocyte index',
        'LDH, haptoglobin, indirect bilirubin',
        'Peripheral blood smear (schistocytes, spherocytes)',
        'Direct antiglobulin test (DAT/Coombs)',
      ],
      urgency: 'urgent',
    },
    {
      category: 'Organ Function',
      icon: <Microscope className="w-4 h-4" />,
      tests: [
        'Serum creatinine / eGFR (renal function)',
        'Liver function tests (hepatocellular vs obstructive pattern)',
        'Thyroid stimulating hormone (TSH)',
      ],
      urgency: 'routine',
    },
    {
      category: 'Inflammation & Nutrition',
      icon: <FileText className="w-4 h-4" />,
      tests: [
        'C-reactive protein (CRP) or ESR',
        'Serum iron, ferritin, TIBC (anemia of chronic disease vs iron deficiency)',
        'Vitamin B12 and folate (early deficiency may be normocytic)',
      ],
      urgency: 'routine',
    },
    {
      category: 'If Hemolysis Negative',
      icon: <TestTube className="w-4 h-4" />,
      tests: [
        'Bone marrow biopsy (if cytopenias present)',
        'Flow cytometry for PNH (if appropriate clinical context)',
        'Erythropoietin level (if renal function normal)',
      ],
      urgency: 'routine',
    },
  ],
  macrocytic: [
    {
      category: 'Vitamin Levels (First Line)',
      icon: <Beaker className="w-4 h-4" />,
      tests: [
        'Serum vitamin B12 with methylmalonic acid (MMA) if borderline',
        'Serum folate with RBC folate',
        'Homocysteine level (elevated in B12/folate deficiency)',
      ],
      urgency: 'immediate',
    },
    {
      category: 'Thyroid & Liver',
      icon: <Microscope className="w-4 h-4" />,
      tests: [
        'Thyroid stimulating hormone (TSH)',
        'Comprehensive liver panel (AST, ALT, alkaline phosphatase, bilirubin)',
        'Hepatitis serologies (if liver disease suspected)',
      ],
      urgency: 'routine',
    },
    {
      category: 'Peripheral Smear Review',
      icon: <FileText className="w-4 h-4" />,
      tests: [
        'Hypersegmented neutrophils (B12/folate deficiency)',
        'Macro-ovalocytes vs round macrocytes',
        'Blasts or dysplastic features (suspect MDS)',
        'Howell-Jolly bodies (splenic dysfunction)',
      ],
      urgency: 'routine',
    },
    {
      category: 'If Deficiency Ruled Out',
      icon: <TestTube className="w-4 h-4" />,
      tests: [
        'Bone marrow biopsy with cytogenetics (suspected MDS)',
        'Flow cytometry (suspected marrow failure)',
        'Copper level (rare cause of macrocytosis)',
        'Drug levels (methotrexate, hydroxyurea, etc.)',
      ],
      urgency: 'routine',
    },
  ],
};

const morphologyInfo = {
  microcytic: {
    title: 'Microcytic Anemia (MCV < 80 fL)',
    description: 'Most commonly due to decreased heme synthesis. Key differentials: Iron deficiency, thalassemia, anemia of chronic disease.',
    color: 'text-primary',
    bg: 'bg-sky-900/20 border-sky-800',
  },
  normocytic: {
    title: 'Normocytic Anemia (MCV 80-100 fL)',
    description: 'Suggests adequate hemoglobinization but insufficient RBC mass. Key differentials: Hemolysis, blood loss, early nutritional deficiency, bone marrow failure.',
    color: 'text-blue-400',
    bg: 'bg-blue-900/20 border-blue-800',
  },
  macrocytic: {
    title: 'Macrocytic Anemia (MCV > 100 fL)',
    description: 'Typically reflects impaired DNA synthesis or increased membrane. Key differentials: B12/folate deficiency, liver disease, MDS, medications.',
    color: 'text-violet-400',
    bg: 'bg-violet-900/20 border-violet-800',
  },
};

export default function TestSuggestionAlgorithm() {
  const [selectedMorphology, setSelectedMorphology] = useState<MorphologyType>(null);

  return (
    <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-900/30 flex items-center justify-center border border-emerald-800">
            <TestTube className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">Next Test Algorithm</h2>
            <p className="text-xs text-muted-foreground">Select MCV category to see recommended workup</p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Morphology Selection */}
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-3">
            Select Morphology / MCV Category
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {(['microcytic', 'normocytic', 'macrocytic'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setSelectedMorphology(type)}
                className={`p-4 rounded-xl border transition-all text-left ${
                  selectedMorphology === type
                    ? morphologyInfo[type].bg
                    : 'bg-muted border-border hover:border-muted-foreground'
                }`}
              >
                <div className={`font-semibold text-sm capitalize ${
                  selectedMorphology === type ? morphologyInfo[type].color : 'text-muted-foreground'
                }`}>
                  {type}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {type === 'microcytic' && '< 80 fL'}
                  {type === 'normocytic' && '80-100 fL'}
                  {type === 'macrocytic' && '> 100 fL'}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Results Display */}
        {selectedMorphology && (
          <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
            {/* Header */}
            <div className={`p-4 rounded-xl border ${morphologyInfo[selectedMorphology].bg}`}>
              <h3 className={`font-semibold ${morphologyInfo[selectedMorphology].color}`}>
                {morphologyInfo[selectedMorphology].title}
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                {morphologyInfo[selectedMorphology].description}
              </p>
            </div>

            {/* Test Categories */}
            <div className="space-y-3">
              {testRecommendations[selectedMorphology].map((category, idx) => (
                <div
                  key={category.category}
                  className="bg-muted/50 rounded-xl border border-border overflow-hidden"
                >
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">{category.icon}</span>
                        <h4 className="font-semibold text-foreground text-sm">
                          {idx + 1}. {category.category}
                        </h4>
                      </div>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full border ${
                          category.urgency === 'immediate'
                            ? 'bg-red-900/30 text-destructive border-red-800'
                            : category.urgency === 'urgent'
                            ? 'bg-amber-900/30 text-warning border-amber-800'
                            : 'bg-muted/50 text-muted-foreground border-border'
                        }`}
                      >
                        {category.urgency}
                      </span>
                    </div>
                    <ul className="space-y-2">
                      {category.tests.map((test) => (
                        <li
                          key={test}
                          className="flex items-start gap-2 text-sm text-muted-foreground"
                        >
                          <ChevronRight className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                          <span>{test}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>

            {/* Clinical Note */}
            <div className="bg-emerald-900/20 border border-emerald-800/50 rounded-lg p-3">
              <p className="text-xs text-emerald-300">
                <strong>Note:</strong> This algorithm provides a structured approach. Always correlate with clinical presentation and prior laboratory results. Consider hematology referral if diagnosis remains unclear.
              </p>
            </div>
          </div>
        )}

        {!selectedMorphology && (
          <div className="text-center py-8 text-muted-foreground">
            <ArrowRight className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Select a morphology category above to view recommended tests</p>
          </div>
        )}
      </div>
    </div>
  );
}
