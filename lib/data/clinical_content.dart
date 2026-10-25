import 'package:flutter/material.dart';

class ClinicalItem {
  const ClinicalItem(this.title, this.body);
  final String title;
  final String body;
}

class ClinicalSection {
  const ClinicalSection(this.title, this.items);
  final String title;
  final List<ClinicalItem> items;
}

class ClinicalTool {
  const ClinicalTool({
    required this.id,
    required this.title,
    required this.subtitle,
    required this.category,
    required this.icon,
    required this.tone,
    required this.keywords,
    this.core = false,
  });

  final String id;
  final String title;
  final String subtitle;
  final String category;
  final IconData icon;
  final String tone;
  final String keywords;
  final bool core;

  String get searchText => '$title $subtitle $category $keywords'.toLowerCase();
}

class ClinicalModule {
  const ClinicalModule({
    required this.id,
    required this.title,
    required this.subtitle,
    required this.icon,
    required this.tone,
    required this.keywords,
    required this.targets,
    required this.overview,
    required this.assessment,
    required this.treatment,
  });

  final String id;
  final String title;
  final String subtitle;
  final IconData icon;
  final String tone;
  final String keywords;
  final List<String> targets;
  final List<ClinicalSection> overview;
  final List<ClinicalSection> assessment;
  final List<ClinicalSection> treatment;

  String get searchText =>
      '$title $subtitle $keywords ${targets.join(' ')}'.toLowerCase();
}

const kTools = <ClinicalTool>[
  ClinicalTool(
    id: 'bmi',
    title: 'Body mass index',
    subtitle: 'BMI, healthy range and ethnicity-specific class',
    category: 'Obesity',
    icon: Icons.monitor_weight_outlined,
    tone: 'violet',
    keywords: 'bmi weight obesity asian indian waist hip',
    core: true,
  ),
  ClinicalTool(
    id: 'whtr',
    title: 'Waist-to-height',
    subtitle: 'Central adiposity and waist threshold',
    category: 'Obesity',
    icon: Icons.straighten,
    tone: 'violet',
    keywords: 'waist height ratio central obesity whtr',
  ),
  ClinicalTool(
    id: 'egfr',
    title: 'eGFR & KDIGO',
    subtitle: 'CKD-EPI 2021 with G/A staging and risk',
    category: 'Renal',
    icon: Icons.water_drop_outlined,
    tone: 'sky',
    keywords: 'egfr creatinine kidney ckd kdigo uacr albuminuria',
    core: true,
  ),
  ClinicalTool(
    id: 'ascvd',
    title: 'ASCVD risk',
    subtitle: 'AHA PREVENT 10-year cardiovascular risk',
    category: 'Lipids',
    icon: Icons.monitor_heart_outlined,
    tone: 'amber',
    keywords: 'ascvd prevent risk cholesterol statin cardiovascular',
    core: true,
  ),
  ClinicalTool(
    id: 'insulin',
    title: 'Insulin titration',
    subtitle: 'Basal dose adjustment from fasting glucose',
    category: 'Diabetes',
    icon: Icons.vaccines_outlined,
    tone: 'teal',
    keywords: 'insulin basal glargine titration fasting glucose diabetes',
    core: true,
  ),
  ClinicalTool(
    id: 'hypo',
    title: 'Hypoglycemia risk',
    subtitle: 'Multi-factor score and individualised HbA1c target',
    category: 'Diabetes',
    icon: Icons.warning_amber_rounded,
    tone: 'coral',
    keywords: 'hypoglycemia hypo risk insulin sulfonylurea hba1c',
    core: true,
  ),
  ClinicalTool(
    id: 'sliding',
    title: 'Inpatient insulin',
    subtitle: 'TDD, basal-bolus split and correction scale',
    category: 'Diabetes',
    icon: Icons.local_hospital_outlined,
    tone: 'teal',
    keywords: 'sliding scale inpatient insulin basal bolus correction npo',
  ),
  ClinicalTool(
    id: 'steroid',
    title: 'Steroid taper',
    subtitle: 'Prednisolone-equivalent, HPA-safe schedule',
    category: 'Endocrine',
    icon: Icons.trending_down,
    tone: 'amber',
    keywords: 'steroid taper prednisolone glucocorticoid adrenal hpa cortisol',
    core: true,
  ),
  ClinicalTool(
    id: 'thyroid',
    title: 'Thyroid interpreter',
    subtitle: 'TSH / FT4 / T3 with medication estimate',
    category: 'Endocrine',
    icon: Icons.science_outlined,
    tone: 'amber',
    keywords: 'thyroid tsh ft4 t3 levothyroxine methimazole graves hashimoto',
  ),
  ClinicalTool(
    id: 'iron',
    title: 'Iron & Ganzoni',
    subtitle: 'Deficiency classification and IV iron deficit',
    category: 'Hematology',
    icon: Icons.bloodtype_outlined,
    tone: 'coral',
    keywords: 'iron ferritin tsat hemoglobin ganzoni anemia deficiency',
  ),
  ClinicalTool(
    id: 'vitd',
    title: 'Vitamin D',
    subtitle: 'Severity, correction and maintenance dosing',
    category: 'Bone health',
    icon: Icons.wb_sunny_outlined,
    tone: 'amber',
    keywords: 'vitamin d 25 oh deficiency dosing bone',
  ),
  ClinicalTool(
    id: 'liver',
    title: 'FIB-4 & liver scores',
    subtitle: 'Fibrosis risk, APRI and NAFLD score',
    category: 'Liver',
    icon: Icons.biotech_outlined,
    tone: 'teal',
    keywords: 'fib4 fib-4 apri nfs liver fibrosis masld nafld',
  ),
  ClinicalTool(
    id: 'lytes',
    title: 'Corrected Na & Ca',
    subtitle: 'Sodium, calcium, anion gap and osmolality',
    category: 'Electrolytes',
    icon: Icons.bolt,
    tone: 'violet',
    keywords: 'sodium calcium anion gap osmolality electrolytes correction',
  ),
  ClinicalTool(
    id: 'homa',
    title: 'HOMA-IR',
    subtitle: 'Insulin resistance estimate',
    category: 'Metabolic',
    icon: Icons.insights,
    tone: 'violet',
    keywords: 'homa insulin resistance metabolic fasting insulin glucose',
  ),
  ClinicalTool(
    id: 'ai-import',
    title: 'AI document import',
    subtitle: 'Text, image OCR, PDF and session-only BYOK',
    category: 'Utilities',
    icon: Icons.auto_awesome_outlined,
    tone: 'violet',
    keywords: 'ai ocr pdf import byok claude openai gemini document lab report extraction',
    core: true,
  ),
];

const kModules = <ClinicalModule>[
  ClinicalModule(
    id: 'diabetes',
    title: 'Diabetes',
    subtitle: 'Diagnosis, targets and stepped therapy',
    icon: Icons.water_drop_outlined,
    tone: 'teal',
    keywords: 'diabetes t2d t1d glucose hba1c insulin metformin sglt2 glp1 dka',
    targets: [
      'HbA1c <7% (individualise)',
      'BP <130/80 mmHg',
      'LDL-C <100 mg/dL',
      'Non-HDL-C <130 mg/dL',
    ],
    overview: [
      ClinicalSection('Definition and diagnosis', [
        ClinicalItem(
          'Diagnostic thresholds',
          'HbA1c ≥6.5%, fasting plasma glucose ≥126 mg/dL (8 h fast), 2-h OGTT ≥200 mg/dL, or random glucose ≥200 mg/dL with classic symptoms. Confirm an asymptomatic result on a second test.',
        ),
        ClinicalItem(
          'Prediabetes',
          'HbA1c 5.7–6.4%, fasting glucose 100–125 mg/dL, or 2-h OGTT 140–199 mg/dL. Offer structured lifestyle change and annual screening.',
        ),
        ClinicalItem(
          'Set the target',
          'HbA1c <7% suits most non-pregnant adults. Aim for <6.5% when young, early disease and low hypoglycaemia risk. Relax toward <8% with frailty, advanced CKD, cognitive impairment or hypoglycaemia unawareness.',
        ),
        ClinicalItem(
          'Baseline work-up',
          'HbA1c, BP, lipids, eGFR, urine ACR, foot examination, retinal screening, weight and waist. Score ASCVD risk and hypoglycaemia risk before choosing therapy.',
        ),
      ]),
    ],
    assessment: [
      ClinicalSection('Control and complications', [
        ClinicalItem(
          'Glycaemic pattern',
          'Review HbA1c trend, SMBG or CGM, fasting and post-prandial excursions, adherence and every hypoglycaemia episode. Look for dawn phenomenon and post-meal spikes.',
        ),
        ClinicalItem(
          'Cardiorenal status',
          'eGFR, UACR, BP and lipids. Heart failure, CKD and ASCVD status decide whether an SGLT2 inhibitor or GLP-1 receptor agonist belongs in the regimen.',
        ),
        ClinicalItem(
          'Complication screen',
          'Annual retinal examination, foot risk assessment, urine ACR and eGFR, lipids, and symptoms of neuropathy or autonomic dysfunction.',
        ),
        ClinicalItem(
          'Red flags',
          'Vomiting and abdominal pain (DKA), marked hyperosmolality (HHS), foot ulcer or spreading infection, rapidly falling eGFR, severe hypoglycaemia, or uncontrolled BP.',
        ),
      ]),
    ],
    treatment: [
      ClinicalSection('Stepped therapy', [
        ClinicalItem(
          'Start with lifestyle and metformin',
          'Structured nutrition, 150+ minutes of activity per week and weight loss where indicated. Metformin remains first-line for most type 2 diabetes unless contraindicated.',
        ),
        ClinicalItem(
          'Choose by comorbidity',
          'Heart failure or CKD with eGFR ≥20: SGLT2 inhibitor. ASCVD or high cardiovascular risk: GLP-1 receptor agonist with proven benefit. Weight is the priority: GLP-1 RA or dual GIP/GLP-1.',
        ),
        ClinicalItem(
          'Intensify by HbA1c',
          'HbA1c ≥7.5%: add a second agent. HbA1c ≥9% or symptomatic: consider insulin with or without a GLP-1 RA. Reassess every 3 months until at goal, then every 6 months.',
        ),
        ClinicalItem(
          'Type 1 diabetes',
          'Basal-bolus insulin is mandatory. Never use correction-only or premix as routine care. Teach sick-day rules, ketone monitoring and DKA prevention.',
        ),
      ]),
      ClinicalSection('Emergencies', [
        ClinicalItem(
          'DKA',
          'Fluids first, then an insulin infusion, potassium replacement and treatment of the precipitant. Hold insulin until K+ is safe if hypokalaemic.',
        ),
        ClinicalItem(
          'HHS',
          'Aggressive volume resuscitation, insulin, and close monitoring of osmolality, sodium and potassium. Mortality is higher than in DKA.',
        ),
      ]),
    ],
  ),
  ClinicalModule(
    id: 'hypertension',
    title: 'Hypertension',
    subtitle: 'Confirmation, risk and stepwise control',
    icon: Icons.favorite_outline,
    tone: 'coral',
    keywords: 'hypertension blood pressure bp ace arb ccb thiazide emergency',
    targets: [
      'Most adults <130/80 mmHg',
      'Pregnancy <140/90 mmHg',
      'Individualise in frailty',
    ],
    overview: [
      ClinicalSection('Classification', [
        ClinicalItem(
          'Office thresholds',
          'Normal <120/80. Elevated 120–129/<80. Stage 1: 130–139 or 80–89. Stage 2: ≥140 or ≥90. Crisis: >180 and/or >120 mmHg.',
        ),
        ClinicalItem(
          'Confirm before treating',
          'Use repeated office readings, home BP or 24-hour ambulatory monitoring before committing to lifelong therapy. White-coat and masked hypertension are common.',
        ),
        ClinicalItem(
          'Look for a secondary cause',
          'Young onset, resistant hypertension, hypokalaemia, renal bruit, paroxysmal symptoms, OSA, CKD or adrenal clues.',
        ),
        ClinicalItem(
          'Assess end-organ damage',
          'LVH, heart failure, CKD, albuminuria, retinopathy, stroke or TIA, and peripheral arterial disease.',
        ),
      ]),
    ],
    assessment: [
      ClinicalSection('Before you choose a drug', [
        ClinicalItem(
          'Cardiovascular risk',
          'BP alone is not the whole story. Check lipids, HbA1c, eGFR, UACR and smoking to decide how aggressively to treat.',
        ),
        ClinicalItem(
          'Medication review',
          'NSAIDs, steroids, decongestants, stimulants, oral contraceptives and liquorice can all raise BP.',
        ),
        ClinicalItem(
          'Pregnancy',
          'Never use ACE inhibitors, ARBs or spironolactone. Methyldopa, labetalol or nifedipine are preferred.',
        ),
        ClinicalItem(
          'Emergency or urgency',
          '>180/120 with end-organ damage is an emergency. Without end-organ damage it is urgency: treat as an outpatient and avoid rapid drops.',
        ),
      ]),
    ],
    treatment: [
      ClinicalSection('Stepwise control', [
        ClinicalItem(
          'Lifestyle',
          'DASH-style eating, sodium <2 g/day, 150 minutes of activity per week, weight loss, limited alcohol and smoking cessation.',
        ),
        ClinicalItem(
          'Step 1',
          'ACE inhibitor or ARB for most patients. Use a calcium channel blocker or thiazide-like diuretic when ACE/ARB is unsuitable. Single-pill combinations improve adherence.',
        ),
        ClinicalItem(
          'Step 2 and 3',
          'A + C or A + D, then A + C + D. For resistant hypertension add spironolactone 25 mg after checking potassium and eGFR.',
        ),
        ClinicalItem(
          'Comorbidity-specific choices',
          'CKD with albuminuria: ACEi/ARB plus SGLT2 inhibitor. HFrEF: ARNI/ACEi, beta-blocker, MRA and SGLT2 inhibitor. Post-MI: beta-blocker plus ACEi/ARB.',
        ),
        ClinicalItem(
          'Hypertensive emergency',
          'Controlled intravenous reduction with labetalol, nicardipine or nitroglycerin. Do not normalise the BP within minutes.',
        ),
      ]),
    ],
  ),
  ClinicalModule(
    id: 'lipids',
    title: 'Lipids',
    subtitle: 'Risk groups, LDL targets and therapy',
    icon: Icons.opacity,
    tone: 'amber',
    keywords:
        'lipids cholesterol ldl hdl triglycerides statin ezetimibe pcsk9 ascvd',
    targets: [
      'Extreme risk ≤30 mg/dL',
      'Very high risk <50 mg/dL',
      'High risk <70 mg/dL',
      'Moderate risk <100 mg/dL',
    ],
    overview: [
      ClinicalSection('Measure and stratify', [
        ClinicalItem(
          'Lipid panel',
          'Fasting or non-fasting total cholesterol, LDL-C, HDL-C and triglycerides. Non-HDL-C and ApoB are useful when triglycerides are elevated.',
        ),
        ClinicalItem(
          'Risk group',
          'Established ASCVD, diabetes with end-organ damage, familial hypercholesterolaemia and CKD are high or very-high risk. Use PREVENT for primary prevention.',
        ),
        ClinicalItem(
          'Check Lp(a) once',
          'Lp(a) ≥50 mg/dL is a risk-enhancing factor and may justify earlier PCSK9 inhibition.',
        ),
        ClinicalItem(
          'Secondary causes',
          'Hypothyroidism, nephrotic syndrome, cholestasis, alcohol, steroids and uncontrolled diabetes.',
        ),
      ]),
    ],
    assessment: [
      ClinicalSection('Deciding who to treat', [
        ClinicalItem(
          '10-year risk',
          'Use the AHA PREVENT equation. Add risk-enhancing factors: premature family history, Lp(a), hsCRP ≥2 mg/L, metabolic syndrome, CKD and inflammatory disease.',
        ),
        ClinicalItem(
          'Statin intolerance',
          'True statin intolerance is uncommon. Rechallenge with a lower dose or alternate-day dosing before switching to bempedoic acid or a PCSK9 inhibitor.',
        ),
        ClinicalItem(
          'Severe hypertriglyceridaemia',
          'Triglycerides ≥500 mg/dL warrant urgent attention to prevent pancreatitis: address alcohol, diabetes and diet; consider fibrates or icosapent ethyl.',
        ),
      ]),
    ],
    treatment: [
      ClinicalSection('Lowering LDL', [
        ClinicalItem(
          'High-intensity statin',
          'Atorvastatin 40–80 mg or rosuvastatin 20–40 mg for high and very-high risk. Titrate to the LDL target.',
        ),
        ClinicalItem(
          'Add ezetimibe',
          'If LDL remains above target, add ezetimibe 10 mg daily for a further 20–25% reduction.',
        ),
        ClinicalItem(
          'PCSK9 inhibition',
          'Evolocumab or alirocumab for very-high risk or familial hypercholesterolaemia not at target. Inclisiran is an alternative.',
        ),
        ClinicalItem(
          'Monitor',
          'Lipids 4–12 weeks after starting or changing therapy, then every 3–12 months. Check LFTs and CK only when clinically indicated.',
        ),
        ClinicalItem(
          'Lifestyle',
          'Mediterranean-style eating, soluble fibre, plant sterols, weight loss, activity and smoking cessation. Lifestyle adds to, but does not replace, indicated drug therapy.',
        ),
      ]),
    ],
  ),
  ClinicalModule(
    id: 'obesity',
    title: 'Obesity',
    subtitle: 'Classification, complications and treatment',
    icon: Icons.monitor_weight_outlined,
    tone: 'violet',
    keywords: 'obesity bmi weight glp1 semaglutide tirzepatide waist metabolic surgery',
    targets: [
      'Aim for ≥5–10% weight loss',
      'Waist-to-height ratio <0.5',
      'Use Asian BMI thresholds',
    ],
    overview: [
      ClinicalSection('Classify accurately', [
        ClinicalItem(
          'Standard BMI',
          'Normal 18.5–24.9. Overweight 25–29.9. Obesity ≥30, with class I 30–34.9, class II 35–39.9 and class III ≥40.',
        ),
        ClinicalItem(
          'Asian and Indian thresholds',
          'Overweight from BMI ≥23; obesity from ≥25. Indian guidelines classify ≥25 as obesity and ≥30 as severe obesity.',
        ),
        ClinicalItem(
          'Central adiposity',
          'Waist-to-height ratio <0.5 is a simple target. Waist ≥94 cm in men or ≥80 cm in women signals central obesity; Asian men use ≥90 cm.',
        ),
        ClinicalItem(
          'Complications',
          'Type 2 diabetes, hypertension, dyslipidaemia, OSA, MASLD, PCOS, osteoarthritis, fertility and mental health.',
        ),
      ]),
    ],
    assessment: [
      ClinicalSection('Build the picture', [
        ClinicalItem(
          'Weight history',
          'Onset, previous attempts, medications, sleep, activity, eating patterns and psychosocial factors.',
        ),
        ClinicalItem(
          'Secondary causes',
          'Hypothyroidism, Cushing syndrome, hypothalamic disease and weight-promoting drugs are uncommon but worth screening when clues exist.',
        ),
        ClinicalItem(
          'Comorbidity screen',
          'BP, HbA1c, lipids, liver enzymes and FIB-4, OSA symptoms, knee and hip function.',
        ),
      ]),
    ],
    treatment: [
      ClinicalSection('A staged approach', [
        ClinicalItem(
          'Lifestyle foundation',
          '500–750 kcal/day deficit, a high-protein and high-fibre pattern, 150–300 minutes of activity per week, sleep and behaviour support.',
        ),
        ClinicalItem(
          'Pharmacotherapy',
          'Consider at BMI ≥30, or ≥27 with a weight-related comorbidity; use lower thresholds for Asian and Indian patients. Semaglutide and tirzepatide have the largest weight effects.',
        ),
        ClinicalItem(
          'GLP-1 safety',
          'Avoid with personal or family medullary thyroid carcinoma or MEN2, in pregnancy, and with active pancreatitis or severe gastroparesis. Review response at 3 months.',
        ),
        ClinicalItem(
          'Metabolic surgery',
          'BMI ≥40, or ≥35 with comorbidity; Asian thresholds are ≥37.5 and ≥32.5. Refer to a multidisciplinary centre.',
        ),
        ClinicalItem(
          'Monitor',
          'Weight, waist, BP, HbA1c, lipids, liver and micronutrients. Aim for 5–10% loss first, then reassess the plan.',
        ),
      ]),
    ],
  ),
  ClinicalModule(
    id: 'kidney',
    title: 'Kidney',
    subtitle: 'KDIGO staging and kidney protection',
    icon: Icons.water_drop,
    tone: 'sky',
    keywords: 'kidney ckd egfr uacr kdigo albuminuria sglt2 finerenone aki',
    targets: ['SBP <120 mmHg if tolerated', 'Reduce UACR', 'Slow eGFR decline'],
    overview: [
      ClinicalSection('Define and stage', [
        ClinicalItem(
          'CKD definition',
          'eGFR <60 or markers of kidney damage (albuminuria, haematuria, structural abnormality) present for ≥3 months.',
        ),
        ClinicalItem(
          'G stages',
          'G1 ≥90, G2 60–89, G3a 45–59, G3b 30–44, G4 15–29, G5 <15 mL/min/1.73 m².',
        ),
        ClinicalItem(
          'A stages',
          'A1 <30, A2 30–300, A3 >300 mg/g albumin-to-creatinine ratio.',
        ),
        ClinicalItem(
          'Combine G and A',
          'The KDIGO heat map defines low, moderate, high and very-high risk. A3 is high risk at any G stage.',
        ),
      ]),
    ],
    assessment: [
      ClinicalSection('Work-up', [
        ClinicalItem(
          'Baseline panel',
          'Creatinine and eGFR, UACR, urinalysis, BP, potassium, bicarbonate, haemoglobin, calcium, phosphate, PTH and lipids.',
        ),
        ClinicalItem(
          'Find the cause',
          'Diabetes, hypertension, glomerulonephritis, obstruction, drugs and family history. Ultrasound when structure or obstruction is suspected.',
        ),
        ClinicalItem(
          'Red flags',
          'Rapid eGFR decline, potassium >6 mmol/L, pulmonary oedema, uremic symptoms, uncontrolled hypertension or nephrotic-range proteinuria.',
        ),
      ]),
    ],
    treatment: [
      ClinicalSection('Protect the kidney', [
        ClinicalItem(
          'Blood pressure',
          'Target SBP <120 mmHg if tolerated. ACE inhibitor or ARB for albuminuric CKD, titrated to the maximum tolerated dose.',
        ),
        ClinicalItem(
          'Kidney protection',
          'SGLT2 inhibitor for CKD with eGFR ≥20, irrespective of diabetes. Finerenone for type 2 diabetes with albuminuria. Statin for cardiovascular risk.',
        ),
        ClinicalItem(
          'Avoid harm',
          'Review NSAIDs, contrast, nephrotoxins and renally cleared drugs. Adjust doses to eGFR. Vaccinate against influenza, pneumococcus and hepatitis B.',
        ),
        ClinicalItem(
          'Refer',
          'eGFR <30, rapidly declining function, difficult hypertension, recurrent hyperkalaemia, nephrotic syndrome or suspected glomerulonephritis.',
        ),
        ClinicalItem(
          'Monitor',
          'eGFR and UACR every 3–12 months depending on risk. Track the slope, not just a single value.',
        ),
      ]),
    ],
  ),
];

const kGuidelineSources = <String>[
  'ADA Standards of Care 2026',
  'KDIGO 2024 CKD guideline',
  '2024 AHA PREVENT equations',
  'ACC/AHA hypertension and cholesterol guidance',
  'LAI 2023 lipid classification',
  'ESC 2024 cardiovascular prevention',
];

ClinicalTool? toolById(String id) {
  for (final t in kTools) {
    if (t.id == id) return t;
  }
  return null;
}

ClinicalModule? moduleById(String id) {
  for (final m in kModules) {
    if (m.id == id) return m;
  }
  return null;
}
