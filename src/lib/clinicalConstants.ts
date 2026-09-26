/**
 * Shared clinical qualifier constants used across PrimaryPrevention and AscvdEmr.
 */

export interface SubItem {
  id: string;
  label: string;
  qualifier?: string;
}

// ─── Established ASCVD sub-items ───
export const ASCVD_ESTABLISHED: SubItem[] = [
  { id: "ascvd_cad", label: "CAD / Coronary ASCVD", qualifier: "Prior MI, angina requiring revascularization, or angiographically confirmed coronary stenosis ≥50%" },
  { id: "ascvd_stroke", label: "Ischemic stroke or TIA", qualifier: "Prior ischemic stroke confirmed by imaging, or TIA with neurovascular evidence of atherosclerotic origin" },
  { id: "ascvd_pad", label: "Peripheral arterial disease (PAD)", qualifier: "ABI <0.9, claudication with imaging confirmation, or prior peripheral revascularization" },
];

// ─── Subclinical atherosclerosis sub-items ───
export const SUBCLINICAL_ITEMS: SubItem[] = [
  { id: "sub_cimt", label: "Elevated carotid IMT", qualifier: "Carotid intima-media thickness >75th percentile for age/sex" },
  { id: "sub_plaque", label: "Carotid or femoral plaque", qualifier: "Focal wall thickening ≥1.5 mm or >50% adjacent IMT on ultrasound" },
  { id: "sub_cac", label: "Coronary calcium score (CAC >0)", qualifier: "Any detectable coronary calcium; CAC ≥100 AU or ≥75th percentile = higher risk" },
  { id: "sub_abi", label: "ABI <0.9", qualifier: "Ankle-brachial index <0.9 indicating peripheral atherosclerosis" },
];

// ─── High CAC / extensive plaque sub-items ───
export const HIGH_CAC_ITEMS: SubItem[] = [
  { id: "cac_100", label: "CAC ≥100 AU or ≥75th percentile", qualifier: "Agatston score ≥100 or above 75th percentile for age/sex/ethnicity" },
  { id: "cac_multi", label: "Multi-territory plaque burden", qualifier: "Atherosclerotic plaque in ≥2 vascular beds (carotid, femoral, coronary, aortic) on imaging" },
  { id: "cac_stenosis", label: "Nonobstructive coronary stenosis on CCTA", qualifier: "≥1 coronary segment with plaque without hemodynamically significant stenosis" },
];

// ─── CKD 3B/4 sub-items ───
export const CKD_ITEMS: SubItem[] = [
  { id: "ckd_3b", label: "Stage 3B: eGFR 30–44 mL/min/1.73 m²", qualifier: "Moderately-to-severely decreased kidney function" },
  { id: "ckd_4", label: "Stage 4: eGFR 15–29 mL/min/1.73 m²", qualifier: "Severely decreased kidney function" },
  { id: "ckd_albumin", label: "Albuminuria: UACR ≥30 mg/g", qualifier: "Moderately increased (30–300) or severely increased (>300) albuminuria" },
];

// ─── Familial hypercholesterolemia sub-items ───
export const FH_ITEMS: SubItem[] = [
  { id: "fh_clinical", label: "Clinical heterozygous familial hypercholesterolemia", qualifier: "Definite/probable FH by Dutch Lipid Clinic Network, Simon Broome, or MEDPED criteria" },
  { id: "fh_genetic", label: "Pathogenic FH mutation", qualifier: "LDLR, APOB, PCSK9, or other validated monogenic FH variant" },
  { id: "fh_phenotype", label: "FH phenotype with LDL-C ≥190 mg/dL", qualifier: "Severe hypercholesterolemia with tendon xanthomas, corneal arcus at young age, or compatible family cascade pattern" },
  { id: "fh_tendon_xanthoma", label: "Tendon xanthomas", qualifier: "Cholesterol deposits in tendons (commonly Achilles or extensor tendons of the hand) — highly specific physical sign of FH" },
  { id: "fh_tuberous_xanthoma", label: "Tuberous xanthomas", qualifier: "Firm, painless nodules over extensor surfaces (elbows, knees, buttocks) — cutaneous marker of severe hypercholesterolemia" },
  { id: "fh_xanthelasma", label: "Xanthelasmata", qualifier: "Yellowish cholesterol-rich plaques on the eyelids — less specific but supportive when present at a young age" },
  { id: "fh_corneal_arcus", label: "Corneal arcus before age 45", qualifier: "White/grey ring around the corneal periphery in a patient <45 y — supportive physical sign of FH" },
];

// ─── Premature CHD / ASCVD family-history sub-items ───
export const FHX_ITEMS: SubItem[] = [
  { id: "fhx_male", label: "1st-degree male relative with CHD before age 55", qualifier: "Father, brother, or son with MI, coronary revascularization, or angina <55 y" },
  { id: "fhx_female", label: "1st-degree female relative with CHD before age 65", qualifier: "Mother, sister, or daughter with MI, coronary revascularization, or angina <65 y" },
];

// ─── Extreme elevation sub-items ───
export const EXTREME_ELEVATION_ITEMS: SubItem[] = [
  { id: "ext_ldl", label: "LDL-C ≥190 mg/dL", qualifier: "Severe hypercholesterolemia — consider familial hypercholesterolemia workup" },
  { id: "ext_tg", label: "Triglycerides ≥500 mg/dL", qualifier: "Severe hypertriglyceridemia — pancreatitis risk; fibrate or omega-3 FA indicated" },
  { id: "ext_bp", label: "Blood pressure ≥180/120 mmHg", qualifier: "Hypertensive crisis — immediate evaluation and treatment required" },
  { id: "ext_a1c", label: "HbA1c ≥10%", qualifier: "Severely uncontrolled diabetes — insulin therapy often required" },
];

// ─── Diabetes Target Organ Damage ───
export const TOD_MICROVASCULAR: SubItem[] = [
  { id: "tod_retinopathy", label: "Diabetic retinopathy", qualifier: "Microaneurysms, hemorrhages, macular edema on fundoscopy or retinal imaging" },
  { id: "tod_nephropathy", label: "Diabetic nephropathy", qualifier: "UACR ≥30 mg/g (micro-/macroalbuminuria) or reduced eGFR for age" },
  { id: "tod_neuropathy", label: "Diabetic neuropathy", qualifier: "Distal symmetric polyneuropathy, autonomic neuropathy, or foot-ulcer risk (monofilament/NCS)" },
];

export const TOD_MACROVASCULAR: SubItem[] = [
  { id: "tod_lvh", label: "Left-ventricular hypertrophy (LVH)", qualifier: "Increased LV mass index on echocardiography" },
  { id: "tod_diastolic", label: "Diastolic dysfunction", qualifier: "Abnormal E/e′ ratio or impaired global longitudinal strain on echo" },
  { id: "tod_subclinical_tod", label: "Subclinical atherosclerosis", qualifier: "Elevated carotid IMT, carotid/femoral plaque, or coronary calcium score" },
];

export const TOD_ALL: SubItem[] = [...TOD_MICROVASCULAR, ...TOD_MACROVASCULAR];

// ─── LAI 2023 Risk Modifiers ───
export const RISK_MODIFIERS_LAI: SubItem[] = [
  { id: "mod_lpa", label: "Lipoprotein(a) 20–49 mg/dL", qualifier: "Minor Lp(a) elevation" },
  { id: "mod_ifg", label: "IFG / Prediabetes (FBG 100–125 mg/dL)", qualifier: "Impaired fasting glucose" },
  { id: "mod_waist", label: "Increased waist circumference", qualifier: ">90 cm in men, >80 cm in women" },
  { id: "mod_hscrp", label: "hsCRP >2 mg/L", qualifier: "Inflammatory marker" },
  { id: "mod_tg", label: "Triglycerides >150 mg/dL (fasting) or >175 mg/dL (non-fasting)", qualifier: "Hypertriglyceridemia" },
  { id: "mod_autoimmune", label: "RA, Psoriasis, Spondyloarthropathies", qualifier: "Chronic inflammatory conditions" },
  { id: "mod_pregnancy", label: "Premature menopause, Pre-eclampsia, GDM, PMOS/ PCOS", qualifier: "Women-specific risk modifiers" },
  { id: "mod_prs", label: "High polygenic risk score", qualifier: "Genetic predisposition" },
  { id: "mod_pollution", label: "Air pollution", qualifier: "Environmental risk factor" },
  { id: "mod_hiv", label: "HIV infection", qualifier: "Viral inflammatory risk" },
];

// ─── 2019 ACC/AHA Risk-Enhancing Factors ───
// Used to refine borderline (5–<7.5%) or intermediate (7.5–<20%) 10-yr ASCVD risk
// Ref: Grundy SM et al. 2018 AHA/ACC/Multisociety Cholesterol Guideline (operationalized in 2019 Primary Prevention Guideline)
export interface EnhancerItem extends SubItem {
  category: string;
}

export const RISK_ENHANCERS_2019: EnhancerItem[] = [
  // Family History
  { id: "enh_fhx", category: "Family History", label: "Premature ASCVD in 1st-degree relative", qualifier: "Male <55 y or female <65 y" },
  // Lipid
  { id: "enh_persistldl", category: "Lipid", label: "Persistent primary hypercholesterolemia", qualifier: "LDL-C 160–189 mg/dL or non-HDL-C 190–219 mg/dL" },
  { id: "enh_tg", category: "Lipid", label: "Persistently elevated triglycerides", qualifier: "≥175 mg/dL (non-fasting)" },
  { id: "enh_lpa", category: "Lipid", label: "Lipoprotein(a) ≥50 mg/dL (or ≥125 nmol/L)", qualifier: "Especially with family history of premature ASCVD" },
  { id: "enh_apob", category: "Lipid", label: "ApoB ≥130 mg/dL", qualifier: "Corresponds to LDL-C ≥160 mg/dL" },
  // Metabolic
  { id: "enh_mets", category: "Metabolic", label: "Metabolic syndrome", qualifier: "≥3 of: ↑waist, ↑TG, ↑BP, ↑glucose, ↓HDL-C" },
  // Chronic Conditions
  { id: "enh_ckd", category: "Chronic Conditions", label: "Chronic kidney disease", qualifier: "eGFR 15–59 mL/min/1.73 m² (not on dialysis/transplant)" },
  { id: "enh_inflam", category: "Chronic Conditions", label: "Chronic inflammatory condition", qualifier: "Psoriasis, RA, lupus, or HIV/AIDS" },
  // Women's Health
  { id: "enh_menopause", category: "Women's Health", label: "Premature menopause (<40 y)", qualifier: "Or pregnancy-associated conditions" },
  { id: "enh_pregnancy", category: "Women's Health", label: "History of preeclampsia or pregnancy-associated HTN", qualifier: "Includes gestational diabetes" },
  // Other Markers
  { id: "enh_ethnicity", category: "Ethnicity", label: "High-risk race/ethnicity (e.g., South Asian)", qualifier: "Auto-set when 'Indian' ethnicity is selected" },
  { id: "enh_hscrp", category: "Biomarker", label: "hs-CRP ≥2.0 mg/L", qualifier: "Marker of vascular inflammation" },
  { id: "enh_abi", category: "Vascular", label: "ABI <0.9", qualifier: "Indicates peripheral atherosclerosis" },
];

// ─── LAI 2023 High-Risk Features ───
export const HIGH_RISK_FEATURES_LAI: SubItem[] = [
  { id: "feat_apob", label: "Apolipoprotein B >130 mg/dL", qualifier: "Highly atherogenic particle burden" },
  { id: "feat_extreme", label: "Extreme of a single risk factor", qualifier: "Smoking >1 pack/day or BP >180/110 mmHg" },
  { id: "feat_lpa", label: "Lipoprotein(a) ≥50 mg/dL", qualifier: "Major Lp(a) elevation" },
  { id: "feat_mets", label: "Metabolic syndrome", qualifier: "Clusters of cardiovascular risk factors" },
  { id: "feat_nafld", label: "NAFLD with fibrosis (Stage 2/3)", qualifier: "Non-alcoholic fatty liver disease" },
  { id: "feat_cacs", label: "CACS 1–99 and <75th percentile", qualifier: "Mild subclinical atherosclerosis burden" },
];

// ─── PMOS (Polyendocrine Metabolic Ovarian Syndrome) Diagnostic Criteria ───
// 2026 Lancet Consensus: two-out-of-three Rotterdam structure with updated thresholds
export interface PMOSCriterion {
  id: string;
  title: string;
  description: string;
  subCriteria: { label: string }[];
}

export const PMOS_DIAGNOSTIC_CRITERIA: PMOSCriterion[] = [
  {
    id: "pmos_ovulatory",
    title: "1. Ovulatory Dysfunction (Oligo- or Anovulation)",
    description: "",
    subCriteria: [
      { label: "< 1 year post-menarche: Irregular cycles are considered normal" },
      { label: "1 to < 3 years post-menarche: Cycles < 21 or > 45 days" },
      { label: "> 3 years post-menarche to perimenopause: Cycles < 21 or > 35 days or < 8 cycles per year" },
      { label: "Amenorrhea: Absence of menstruation for 90 days or more after previously having cycles" },
    ],
  },
  {
    id: "pmos_hyperandrogenism",
    title: "2. Hyperandrogenism (Clinical or Biochemical)",
    description: "",
    subCriteria: [
      { label: "Total Testosterone: Elevated above lab reference range (often > 45–60 ng/dL)" },
      { label: "Free Testosterone: Free Androgen Index (FAI) > 5%" },
      { label: "Androstenedione and DHEA-S: Elevated above age-specific reference ranges" },
      { label: "Modified Ferriman-Gallwey (mFG) Score ≥ 4–6 indicates hirsutism" },
      { label: "Significant androgenic alopecia (male-pattern thinning) or persistent severe adult acne" },
    ],
  },
  {
    id: "pmos_ovarian",
    title: "3. Ovarian Morphology or Elevated AMH",
    description: "",
    subCriteria: [
      { label: "Follicle Number per Ovary (FNPO): ≥ 20 follicles (2–9 mm) using ≥ 8 MHz probe" },
      { label: "Ovarian Volume: > 10 mL in either ovary (0.523 × L × W × T)" },
      { label: "Serum AMH > 3.2 ng/mL (> 23 pmol/L) — accepted standalone marker in adults" },
    ],
  },
];

export const PMOS_ADULT_VS_ADOLESCENT: { feature: string; adult: string; adolescent: string }[] = [
  { feature: "Requirements", adult: "2 out of 3", adolescent: "Both Irregular Cycles + Hyperandrogenism" },
  { feature: "Ultrasound", adult: "Used as 3rd criterion", adolescent: "Not recommended (normal in puberty)" },
  { feature: "AMH", adult: "Valid alternative to ultrasound", adolescent: "Not recommended for diagnosis" },
];

export const PMOS_METABOLIC_SCREENING: string[] = [
  "Fasting Insulin: Often > 15–20 μIU/mL suggests insulin resistance",
  "HOMA-IR: (Fasting Insulin × Fasting Glucose) / 405 — value > 2.5 = insulin resistance threshold",
  "HbA1c: Checked for pre-diabetes/diabetes screening (≥ 5.7%)",
];

// ─── Helper ───
export function countCheckedItems(items: { id: string }[], checked: Record<string, boolean>) {
  return items.filter((i) => checked[i.id]).length;
}
