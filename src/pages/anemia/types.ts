export interface CBCValues {
  hgb: string;   // Hemoglobin g/dL
  mcv: string;   // Mean Corpuscular Volume fL
  mch: string;   // Mean Corpuscular Hemoglobin pg
  mchc: string;  // Mean Corpuscular Hemoglobin Concentration g/dL
  rbc: string;   // Red Blood Cell count ×10¹²/L
  rdw: string;   // Red Cell Distribution Width %
  hct: string;   // Hematocrit %
}

export type Sex = 'male' | 'female' | 'child' | 'pregnant';

export interface DiscriminantResult {
  name: string;
  formula: string;
  value: number | null;
  cutoff: number;
  interpretation: 'IDA' | 'Thalassemia' | 'N/A';
  direction: string; // e.g. ">13 = IDA"
  reference: string;
  explanation: string;
}

export interface AnemiaClassification {
  severity: 'None' | 'Mild' | 'Moderate' | 'Severe' | 'N/A';
  morphology: 'Microcytic' | 'Normocytic' | 'Macrocytic' | 'N/A';
  hgbThreshold: { mild: number; moderate: number; severe: number };
}

export interface EvaluationResult {
  classification: AnemiaClassification;
  discriminantResults: DiscriminantResult[];
  idaCount: number;
  thalCount: number;
  consensus: 'IDA' | 'Thalassemia' | 'Inconclusive' | 'N/A';
  missingFields: string[];
}
