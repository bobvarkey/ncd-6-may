import 'ai_models.dart';

// Common field definitions shared by the import targets and the local parser.
const ageField = AiFieldSpec(
  key: 'age',
  label: 'Age',
  unit: 'years',
  keywords: ['age', 'years old'],
  pattern: r'\bage\b\s*[:=]?\s*(\d{1,3})|(\d{1,3})[- ]years?[- ]old',
  description: 'Patient age in years.',
);

const sexField = AiFieldSpec(
  key: 'sex',
  label: 'Sex',
  keywords: ['sex', 'gender', 'male', 'female'],
  pattern:
      r'(?:sex|gender)\s*[:=]?\s*(male|female|\bm\b|\bf\b)|\b(male|female)\b',
  kind: AiFieldKind.text,
  description: 'Record male or female. Preserve the source wording if other.',
);

const heightField = AiFieldSpec(
  key: 'heightCm',
  label: 'Height',
  unit: 'cm',
  keywords: ['height', 'ht'],
  pattern: r'(?:height|ht)\s*[:=]?\s*(\d{2,3}(?:\.\d+)?)',
  description:
      'Height in centimetres; preserve the original unit if different.',
);

const weightField = AiFieldSpec(
  key: 'weightKg',
  label: 'Weight',
  unit: 'kg',
  keywords: ['weight', 'wt', 'body weight'],
  pattern: r'(?:weight|wt|body weight)\s*[:=]?\s*(\d{2,3}(?:\.\d+)?)',
  description: 'Weight in kilograms; preserve the original unit if different.',
);

const waistField = AiFieldSpec(
  key: 'waistCm',
  label: 'Waist circumference',
  unit: 'cm',
  keywords: ['waist', 'waist circumference', 'abdominal girth'],
  pattern: r'(?:waist|waist circumference|abdominal girth)\s*[:=]?\s*(\d{2,3}(?:\.\d+)?)',
  description: 'Waist circumference in centimetres.',
);

const bmiField = AiFieldSpec(
  key: 'bmi',
  label: 'BMI',
  unit: 'kg/m²',
  keywords: ['bmi', 'body mass index'],
  pattern: r'(?:bmi|body mass index)\s*[:=]?\s*(\d{2}(?:\.\d+)?)',
  description: 'Body mass index; report it only if the source states it.',
);

const creatinineField = AiFieldSpec(
  key: 'creatinine',
  label: 'Creatinine',
  unit: 'mg/dL',
  keywords: ['creatinine', 'serum creatinine', 'scr', 's. creatinine'],
  pattern: r'(?:creatinine|serum creatinine|s\.?\s*creatinine|scr)\s*[:=]?\s*(\d+(?:\.\d+)?)',
  description:
      'Serum creatinine; preserve the original unit (mg/dL or µmol/L).',
);

const egfrField = AiFieldSpec(
  key: 'egfr',
  label: 'eGFR',
  unit: 'mL/min/1.73m²',
  keywords: ['egfr', 'e gfr', 'gfr', 'estimated gfr'],
  pattern: r'(?:egfr|e\.?gfr|gfr|estimated gfr)\s*[:=]?\s*(\d+(?:\.\d+)?)',
  description: 'Estimated GFR if the report provides it.',
);

const uacrField = AiFieldSpec(
  key: 'uacr',
  label: 'Urine albumin-to-creatinine ratio',
  unit: 'mg/g',
  keywords: ['uacr', 'albumin creatinine ratio', 'urine albumin', 'acr'],
  pattern: r'(?:uacr|albumin[ -]?(?:to[ -]?)?creatinine ratio|urine albumin|acr)\s*[:=]?\s*(\d+(?:\.\d+)?)',
  description: 'Albumin-to-creatinine ratio; preserve mg/g or mg/mmol.',
);

const potassiumField = AiFieldSpec(
  key: 'potassium',
  label: 'Potassium',
  unit: 'mmol/L',
  keywords: ['potassium', 'k+', 'serum potassium'],
  pattern: r'(?:potassium|serum potassium|k\+?)\s*[:=]?\s*(\d+(?:\.\d+)?)',
  description: 'Serum potassium.',
);

const sodiumField = AiFieldSpec(
  key: 'sodium',
  label: 'Sodium',
  unit: 'mmol/L',
  keywords: ['sodium', 'na+', 'serum sodium'],
  pattern: r'(?:sodium|serum sodium|na\+?)\s*[:=]?\s*(\d+(?:\.\d+)?)',
  description: 'Serum sodium.',
);

const bicarbonateField = AiFieldSpec(
  key: 'bicarbonate',
  label: 'Bicarbonate',
  unit: 'mmol/L',
  keywords: ['bicarbonate', 'hco3', 'total co2'],
  pattern: r'(?:bicarbonate|hco3|total co2)\s*[:=]?\s*(\d+(?:\.\d+)?)',
  description: 'Serum bicarbonate.',
);

const hba1cField = AiFieldSpec(
  key: 'hba1c',
  label: 'HbA1c',
  unit: '%',
  keywords: ['hba1c', 'a1c', 'glycated hemoglobin'],
  pattern: r'(?:hba1c|a1c|glycated h(?:a)?emoglobin)\s*[:=]?\s*(\d+(?:\.\d+)?)',
  description: 'Glycated haemoglobin.',
);

const fastingGlucoseField = AiFieldSpec(
  key: 'fastingGlucose',
  label: 'Fasting glucose',
  unit: 'mg/dL',
  keywords: ['fasting glucose', 'fbs', 'fasting blood sugar', 'fpg'],
  pattern: r'(?:fasting glucose|fbs|fasting blood sugar|fpg)\s*[:=]?\s*(\d+(?:\.\d+)?)',
  description: 'Fasting plasma glucose; preserve mg/dL or mmol/L.',
);

const randomGlucoseField = AiFieldSpec(
  key: 'randomGlucose',
  label: 'Random glucose',
  unit: 'mg/dL',
  keywords: ['random glucose', 'rbs', 'random blood sugar'],
  pattern:
      r'(?:random glucose|rbs|random blood sugar)\s*[:=]?\s*(\d+(?:\.\d+)?)',
  description: 'Random or post-prandial glucose.',
);

const ldlField = AiFieldSpec(
  key: 'ldl',
  label: 'LDL-C',
  unit: 'mg/dL',
  keywords: ['ldl', 'ldl-c', 'ldl cholesterol'],
  pattern: r'(?:ldl(?:-c)?|ldl cholesterol)\s*[:=]?\s*(\d+(?:\.\d+)?)',
  description: 'LDL cholesterol; preserve the original unit.',
);

const hdlField = AiFieldSpec(
  key: 'hdl',
  label: 'HDL-C',
  unit: 'mg/dL',
  keywords: ['hdl', 'hdl-c', 'hdl cholesterol'],
  pattern: r'(?:hdl(?:-c)?|hdl cholesterol)\s*[:=]?\s*(\d+(?:\.\d+)?)',
  description: 'HDL cholesterol; preserve the original unit.',
);

const triglyceridesField = AiFieldSpec(
  key: 'triglycerides',
  label: 'Triglycerides',
  unit: 'mg/dL',
  keywords: ['triglycerides', 'tg', 'trig'],
  pattern: r'(?:triglycerides|tg|trig)\s*[:=]?\s*(\d+(?:\.\d+)?)',
  description: 'Triglycerides; preserve the original unit.',
);

const totalCholesterolField = AiFieldSpec(
  key: 'totalCholesterol',
  label: 'Total cholesterol',
  unit: 'mg/dL',
  keywords: ['total cholesterol', 'cholesterol total', 'tc'],
  pattern:
      r'(?:total cholesterol|cholesterol total|tc)\s*[:=]?\s*(\d+(?:\.\d+)?)',
  description: 'Total cholesterol; preserve the original unit.',
);

const nonHdlField = AiFieldSpec(
  key: 'nonHdl',
  label: 'Non-HDL cholesterol',
  unit: 'mg/dL',
  keywords: ['non hdl', 'non-hdl', 'nonhdl'],
  pattern: r'(?:non[ -]?hdl)\s*[:=]?\s*(\d+(?:\.\d+)?)',
  description: 'Non-HDL cholesterol.',
);

const sbpField = AiFieldSpec(
  key: 'sbp',
  label: 'Systolic blood pressure',
  unit: 'mmHg',
  keywords: ['systolic', 'sbp', 'systolic bp'],
  pattern: r'(?:systolic(?: blood pressure)?|sbp|bp)\s*[:=]?\s*(\d{2,3})',
  description: 'Systolic blood pressure.',
);

const dbpField = AiFieldSpec(
  key: 'dbp',
  label: 'Diastolic blood pressure',
  unit: 'mmHg',
  keywords: ['diastolic', 'dbp', 'diastolic bp'],
  pattern: r'(?:diastolic(?: blood pressure)?|dbp)\s*[:=]?\s*(\d{2,3})|(?:bp|blood pressure)\s*[:=]?\s*\d{2,3}\s*/\s*(\d{2,3})',
  description: 'Diastolic blood pressure.',
);

const tshField = AiFieldSpec(
  key: 'tsh',
  label: 'TSH',
  unit: 'mIU/L',
  keywords: ['tsh', 'thyroid stimulating hormone', 'thyrotropin'],
  pattern: r'(?:tsh|thyroid stimulating hormone|thyrotropin)\s*[:=]?\s*(\d+(?:\.\d+)?)',
  description: 'Thyroid stimulating hormone.',
);

const ft4Field = AiFieldSpec(
  key: 'ft4',
  label: 'Free T4',
  unit: 'ng/dL',
  keywords: ['free t4', 'ft4', 'free thyroxine'],
  pattern: r'(?:free t4|ft4|free thyroxine)\s*[:=]?\s*(\d+(?:\.\d+)?)',
  description: 'Free thyroxine; preserve the original unit.',
);

const ft3Field = AiFieldSpec(
  key: 'ft3',
  label: 'T3',
  unit: 'pg/mL',
  keywords: ['free t3', 'ft3', 't3', 'triiodothyronine'],
  pattern: r'(?:free t3|ft3|triiodothyronine|t3)\s*[:=]?\s*(\d+(?:\.\d+)?)',
  description: 'Triiodothyronine; preserve free vs total.',
);

const ferritinField = AiFieldSpec(
  key: 'ferritin',
  label: 'Ferritin',
  unit: 'ng/mL',
  keywords: ['ferritin', 'fer'],
  pattern: r'(?:ferritin|fer)\s*[:=]?\s*(\d+(?:\.\d+)?)',
  description: 'Serum ferritin.',
);

const tsatField = AiFieldSpec(
  key: 'tsat',
  label: 'TSAT',
  unit: '%',
  keywords: ['tsat', 'transferrin saturation', 'iron saturation'],
  pattern: r'(?:tsat|transferrin saturation|iron saturation)\s*[:=]?\s*(\d+(?:\.\d+)?)',
  description: 'Transferrin saturation.',
);

const hemoglobinField = AiFieldSpec(
  key: 'hemoglobin',
  label: 'Haemoglobin',
  unit: 'g/dL',
  keywords: ['hemoglobin', 'haemoglobin', 'hb', 'hgb'],
  pattern: r'(?:h(?:a)?emoglobin|hgb|hb)\s*[:=]?\s*(\d+(?:\.\d+)?)',
  description: 'Haemoglobin; preserve g/dL or g/L.',
);

const plateletField = AiFieldSpec(
  key: 'platelets',
  label: 'Platelets',
  unit: '×10⁹/L',
  keywords: ['platelets', 'platelet count', 'plt'],
  pattern: r'(?:platelets?|platelet count|plt)\s*[:=]?\s*(\d[\d,]*(?:\.\d+)?)',
  description:
      'Platelet count; preserve the unit and thousands separators as text.',
);

const wbcField = AiFieldSpec(
  key: 'wbc',
  label: 'White cell count',
  unit: '×10⁹/L',
  keywords: ['wbc', 'white blood cell', 'white cell count'],
  pattern:
      r'(?:wbc|white blood cells?|white cell count)\s*[:=]?\s*(\d+(?:\.\d+)?)',
  description: 'White blood cell count.',
);

const mcvField = AiFieldSpec(
  key: 'mcv',
  label: 'MCV',
  unit: 'fL',
  keywords: ['mcv', 'mean corpuscular volume'],
  pattern: r'(?:mcv|mean corpuscular volume)\s*[:=]?\s*(\d+(?:\.\d+)?)',
  description: 'Mean corpuscular volume.',
);

const rdwField = AiFieldSpec(
  key: 'rdw',
  label: 'RDW',
  unit: '%',
  keywords: ['rdw', 'red cell distribution width'],
  pattern: r'(?:rdw|red cell distribution width)\s*[:=]?\s*(\d+(?:\.\d+)?)',
  description: 'Red cell distribution width.',
);

const astField = AiFieldSpec(
  key: 'ast',
  label: 'AST',
  unit: 'U/L',
  keywords: ['ast', 'sgot', 'aspartate aminotransferase'],
  pattern: r'(?:ast|sgot|aspartate aminotransferase)\s*[:=]?\s*(\d+(?:\.\d+)?)',
  description: 'Aspartate aminotransferase.',
);

const altField = AiFieldSpec(
  key: 'alt',
  label: 'ALT',
  unit: 'U/L',
  keywords: ['alt', 'sgpt', 'alanine aminotransferase'],
  pattern: r'(?:alt|sgpt|alanine aminotransferase)\s*[:=]?\s*(\d+(?:\.\d+)?)',
  description: 'Alanine aminotransferase.',
);

const alpField = AiFieldSpec(
  key: 'alp',
  label: 'Alkaline phosphatase',
  unit: 'U/L',
  keywords: ['alp', 'alkaline phosphatase', 'alk phos'],
  pattern: r'(?:alp|alkaline phosphatase|alk phos)\s*[:=]?\s*(\d+(?:\.\d+)?)',
  description: 'Alkaline phosphatase.',
);

const bilirubinField = AiFieldSpec(
  key: 'bilirubin',
  label: 'Bilirubin',
  unit: 'mg/dL',
  keywords: ['bilirubin', 'bili', 'total bilirubin'],
  pattern: r'(?:total bilirubin|bilirubin|bili)\s*[:=]?\s*(\d+(?:\.\d+)?)',
  description: 'Total bilirubin; preserve the original unit.',
);

const albuminField = AiFieldSpec(
  key: 'albumin',
  label: 'Albumin',
  unit: 'g/dL',
  keywords: ['albumin', 'alb', 'serum albumin'],
  pattern: r'(?:albumin|serum albumin|alb)\s*[:=]?\s*(\d+(?:\.\d+)?)',
  description: 'Serum albumin.',
);

const inrField = AiFieldSpec(
  key: 'inr',
  label: 'INR',
  keywords: ['inr', 'international normalized ratio'],
  pattern: r'(?:inr|international normalized ratio)\s*[:=]?\s*(\d+(?:\.\d+)?)',
  description: 'International normalized ratio.',
);

const bunField = AiFieldSpec(
  key: 'bun',
  label: 'BUN',
  unit: 'mg/dL',
  keywords: ['bun', 'blood urea nitrogen', 'urea'],
  pattern: r'(?:bun|blood urea nitrogen|urea)\s*[:=]?\s*(\d+(?:\.\d+)?)',
  description: 'Blood urea nitrogen; preserve urea vs BUN.',
);

const calciumField = AiFieldSpec(
  key: 'calcium',
  label: 'Calcium',
  unit: 'mg/dL',
  keywords: ['calcium', 'serum calcium', 'ca'],
  pattern: r'(?:calcium|serum calcium|ca)\s*[:=]?\s*(\d+(?:\.\d+)?)',
  description: 'Serum calcium; preserve total vs ionised.',
);

const magnesiumField = AiFieldSpec(
  key: 'magnesium',
  label: 'Magnesium',
  unit: 'mg/dL',
  keywords: ['magnesium', 'serum magnesium', 'mg'],
  pattern: r'(?:magnesium|serum magnesium|mg)\s*[:=]?\s*(\d+(?:\.\d+)?)',
  description: 'Serum magnesium.',
);

const phosphateField = AiFieldSpec(
  key: 'phosphate',
  label: 'Phosphate',
  unit: 'mg/dL',
  keywords: ['phosphate', 'phosphorus', 'po4'],
  pattern: r'(?:phosphate|phosphorus|po4)\s*[:=]?\s*(\d+(?:\.\d+)?)',
  description: 'Serum phosphate.',
);

const chlorideField = AiFieldSpec(
  key: 'chloride',
  label: 'Chloride',
  unit: 'mmol/L',
  keywords: ['chloride', 'cl'],
  pattern: r'(?:chloride|cl)\s*[:=]?\s*(\d+(?:\.\d+)?)',
  description: 'Serum chloride.',
);

const uricAcidField = AiFieldSpec(
  key: 'uricAcid',
  label: 'Uric acid',
  unit: 'mg/dL',
  keywords: ['uric acid', 'urate'],
  pattern: r'(?:uric acid|urate)\s*[:=]?\s*(\d+(?:\.\d+)?)',
  description: 'Serum uric acid.',
);

const diabetesField = AiFieldSpec(
  key: 'diabetes',
  label: 'Diabetes',
  keywords: ['diabetes', 'type 2 diabetes', 't2dm', 'dm'],
  pattern: r'(?:diabetes|type 2 diabetes|t2dm|dm)\s*[:=]?\s*(yes|no|present|absent|true|false)',
  kind: AiFieldKind.boolean,
  description: 'Yes only if the source states diabetes; do not infer from glucose alone.',
);

const smokerField = AiFieldSpec(
  key: 'smoker',
  label: 'Current smoker',
  keywords: ['smoker', 'smoking', 'tobacco'],
  pattern: r'(?:smoker|smoking|tobacco)\s*[:=]?\s*(yes|no|present|absent|true|false|current|former|never)',
  kind: AiFieldKind.boolean,
  description: 'Current smoking status only; preserve former/never if stated.',
);

const bpMedField = AiFieldSpec(
  key: 'bpMed',
  label: 'On blood pressure medication',
  keywords: ['antihypertensive', 'blood pressure medication', 'bp medication'],
  pattern: r'(?:antihypertensive|blood pressure medication|bp medication)\s*[:=]?\s*(yes|no|true|false)',
  kind: AiFieldKind.boolean,
  description:
      'Yes only if the source states current antihypertensive treatment.',
);

const statinField = AiFieldSpec(
  key: 'statin',
  label: 'On a statin',
  keywords: ['statin', 'atorvastatin', 'rosuvastatin'],
  pattern:
      r'(?:statin|atorvastatin|rosuvastatin)\s*[:=]?\s*(yes|no|true|false)',
  kind: AiFieldKind.boolean,
  description: 'Yes only if the source states current statin use.',
);

const kidneyTarget = AiTarget(
  id: 'kidney',
  label: 'Kidney function',
  subtitle: 'Creatinine, eGFR, age, sex and kidney-related labs',
  fields: [
    creatinineField,
    ageField,
    sexField,
    egfrField,
    uacrField,
    potassiumField,
    sodiumField,
    bicarbonateField,
  ],
);

const bmiTarget = AiTarget(
  id: 'bmi',
  label: 'Body mass index',
  subtitle: 'Height, weight, waist and sex',
  fields: [heightField, weightField, waistField, sexField, ageField, bmiField],
);

const ascvdTarget = AiTarget(
  id: 'ascvd',
  label: 'ASCVD risk inputs',
  subtitle: 'Age, sex, blood pressure, lipids, eGFR, BMI and risk modifiers',
  fields: [
    ageField,
    sexField,
    sbpField,
    totalCholesterolField,
    hdlField,
    egfrField,
    bmiField,
    hba1cField,
    diabetesField,
    smokerField,
    bpMedField,
    statinField,
  ],
);

const patientTarget = AiTarget(
  id: 'patient',
  label: 'Patient profile',
  subtitle: 'Core demographics, anthropometrics, kidney and metabolic values',
  fields: [
    ageField,
    sexField,
    heightField,
    weightField,
    bmiField,
    waistField,
    creatinineField,
    egfrField,
    hba1cField,
    fastingGlucoseField,
    randomGlucoseField,
    ldlField,
    hdlField,
    triglyceridesField,
    totalCholesterolField,
    sbpField,
    dbpField,
    potassiumField,
    sodiumField,
    diabetesField,
    smokerField,
  ],
);

const labPanelTarget = AiTarget(
  id: 'labs',
  label: 'Full lab panel',
  subtitle:
      'Diabetes, lipids, kidney, thyroid, iron, haematology and liver values',
  fields: [
    ageField,
    sexField,
    heightField,
    weightField,
    bmiField,
    waistField,
    hba1cField,
    fastingGlucoseField,
    randomGlucoseField,
    creatinineField,
    egfrField,
    uacrField,
    bunField,
    potassiumField,
    sodiumField,
    bicarbonateField,
    chlorideField,
    calciumField,
    magnesiumField,
    phosphateField,
    uricAcidField,
    ldlField,
    hdlField,
    triglyceridesField,
    totalCholesterolField,
    nonHdlField,
    sbpField,
    dbpField,
    tshField,
    ft4Field,
    ft3Field,
    ferritinField,
    tsatField,
    hemoglobinField,
    plateletField,
    wbcField,
    mcvField,
    rdwField,
    astField,
    altField,
    alpField,
    bilirubinField,
    albuminField,
    inrField,
    diabetesField,
    smokerField,
  ],
);

const allAiTargets = <AiTarget>[
  kidneyTarget,
  bmiTarget,
  ascvdTarget,
  patientTarget,
  labPanelTarget,
];

AiTarget targetById(String id) => allAiTargets.firstWhere(
  (target) => target.id == id,
  orElse: () => labPanelTarget,
);
