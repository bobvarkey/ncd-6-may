// Central glossary for clinical acronyms used across the app.
// Keep entries short — the Acronym component shows the definition
// on hover; long-form info belongs on the relevant page.
export interface GlossaryEntry {
  term: string;
  full: string;
  description?: string;
  synonyms?: string[];
}

export const GLOSSARY: Record<string, GlossaryEntry> = {
  ASCVD: { term: "ASCVD", full: "Atherosclerotic Cardiovascular Disease", description: "10-year risk of MI, stroke, or coronary death." },
  LDL: { term: "LDL-C", full: "Low-Density Lipoprotein Cholesterol", description: "Primary target for lipid-lowering therapy." },
  HDL: { term: "HDL-C", full: "High-Density Lipoprotein Cholesterol" },
  ApoB: { term: "ApoB", full: "Apolipoprotein B", description: "Marker of atherogenic particle number." },
  "Lp(a)": { term: "Lp(a)", full: "Lipoprotein(a)", description: "Genetic ASCVD risk enhancer." },
  eGFR: { term: "eGFR", full: "Estimated Glomerular Filtration Rate", description: "CKD-EPI 2021 formula, ml/min/1.73m²." },
  UACR: { term: "UACR", full: "Urine Albumin-to-Creatinine Ratio", description: "Marker of kidney damage; guides KDIGO A stage." },
  KDIGO: { term: "KDIGO", full: "Kidney Disease Improving Global Outcomes", description: "CKD staging by eGFR (G) and albuminuria (A)." },
  CKD: { term: "CKD", full: "Chronic Kidney Disease" },
  AKI: { term: "AKI", full: "Acute Kidney Injury" },
  "FIB-4": { term: "FIB-4", full: "Fibrosis-4 Index", description: "Non-invasive liver fibrosis triage score." },
  APRI: { term: "APRI", full: "AST-to-Platelet Ratio Index" },
  NFS: { term: "NFS", full: "NAFLD Fibrosis Score" },
  MRA: { term: "MRA", full: "Mineralocorticoid Receptor Antagonist", description: "Spironolactone, eplerenone, finerenone." },
  ARNI: { term: "ARNI", full: "Angiotensin Receptor–Neprilysin Inhibitor" },
  SGLT2: { term: "SGLT2i", full: "Sodium-Glucose Co-transporter 2 Inhibitor" },
  "GLP-1": { term: "GLP-1 RA", full: "Glucagon-Like Peptide-1 Receptor Agonist" },
  DPP4: { term: "DPP-4i", full: "Dipeptidyl Peptidase-4 Inhibitor" },
  TSAT: { term: "TSAT", full: "Transferrin Saturation", description: "Serum iron ÷ TIBC × 100." },
  TIBC: { term: "TIBC", full: "Total Iron-Binding Capacity" },
  ESR: { term: "ESR", full: "Erythrocyte Sedimentation Rate" },
  CRP: { term: "CRP", full: "C-Reactive Protein" },
  BMI: { term: "BMI", full: "Body Mass Index", description: "kg/m². India cutoffs: ≥23 overweight, ≥25 obese." },
  WHR: { term: "WHR", full: "Waist-to-Hip Ratio" },
  BP: { term: "BP", full: "Blood Pressure" },
  HbA1c: { term: "HbA1c", full: "Glycated Hemoglobin", description: "3-month average glucose control." },
  LAI: { term: "LAI", full: "Lipid Association of India" },
  ADA: { term: "ADA", full: "American Diabetes Association" },
  MDR: { term: "MDR", full: "Multi-Drug Resistant" },
  MACS: {
    term: "MACS",
    full: "Mild Autonomous Cortisol Secretion",
    description: "Post-DST cortisol above 1.8 µg/dL (50 nmol/L) without overt Cushing syndrome.",
    synonyms: ["Subclinical Cushing's syndrome", "Subclinical hypercortisolism"],
  },
  DST: {
    term: "DST",
    full: "Dexamethasone Suppression Test",
    description: "1 mg dexamethasone at 23:00 followed by morning serum cortisol measurement.",
    synonyms: ["1-mg overnight DST"],
  },
  HU: {
    term: "HU",
    full: "Hounsfield Units",
    description: "CT attenuation measurement used in adrenal lesion assessment.",
  },
  ARR: {
    term: "ARR",
    full: "Aldosterone-Renin Ratio",
    description: "Screening test for primary aldosteronism.",
  },
  ACTH: { term: "ACTH", full: "Adrenocorticotropic Hormone", description: "Morning ACTH helps confirm whether cortisol excess is ACTH-independent." },
  OSA: { term: "OSA", full: "Obstructive Sleep Apnea" },
  RVS: { term: "RVS", full: "Renal Vein Sampling" },
  JG: { term: "JG", full: "Juxtaglomerular", description: "Refers to the renin-producing cells of the kidney." },
};

export function lookupGlossary(term: string): GlossaryEntry | undefined {
  return GLOSSARY[term] ?? GLOSSARY[term.toUpperCase()];
}
