import React from "react";

const ABBREVIATIONS: Record<string, string> = {
  "ASCVD": "Atherosclerotic Cardiovascular Disease — includes CAD (MI, angina, revasc), cerebrovascular disease (stroke/TIA), and PAD",
  "GLP-1 RA": "Glucagon-Like Peptide-1 Receptor Agonist — e.g., Semaglutide, Liraglutide, Dulaglutide, Tirzepatide. CV benefit, weight loss.",
  "GLP-1": "Glucagon-Like Peptide-1 — incretin hormone that stimulates insulin secretion in response to meals",
  "SGLT2i": "Sodium-Glucose Cotransporter-2 Inhibitor — e.g., Empagliflozin, Dapagliflozin. Reduces glucose reabsorption in kidney, provides CV/renal protection.",
  "SGLT2": "Sodium-Glucose Cotransporter-2 — transporter in proximal renal tubule responsible for 90% of glucose reabsorption",
  "CKD": "Chronic Kidney Disease — persistent kidney damage or reduced eGFR < 60 for ≥ 3 months",
  "OSA": "Obstructive Sleep Apnea — repetitive upper airway collapse during sleep causing intermittent hypoxia",
  "NAFLD": "Non-Alcoholic Fatty Liver Disease — hepatic steatosis without significant alcohol use",
  "MASLD": "Metabolic Dysfunction-Associated Steatotic Liver Disease — updated nomenclature for NAFLD",
  "CVD": "Cardiovascular Disease — encompasses CAD, cerebrovascular disease, and peripheral vascular disease",
  "HF": "Heart Failure — clinical syndrome of impaired ventricular filling or ejection",
  "HFrEF": "Heart Failure with reduced Ejection Fraction — LVEF ≤ 40%",
  "eGFR": "estimated Glomerular Filtration Rate — measure of kidney function (mL/min/1.73m²)",
  "BMI": "Body Mass Index — weight (kg) / height (m)². Asian thresholds: normal < 23, overweight 23-24.9, obese ≥ 25",
  "HbA1c": "Glycated Hemoglobin — average blood glucose over 2-3 months. Normal < 5.7%, Prediabetes 5.7-6.4%, Diabetes ≥ 6.5%",
  "LDL": "Low-Density Lipoprotein — 'bad cholesterol', primary target of lipid-lowering therapy",
  "LDL-C": "Low-Density Lipoprotein Cholesterol — calculated or directly measured LDL fraction",
  "HDL": "High-Density Lipoprotein — 'good cholesterol', < 40 mg/dL (♂) or < 50 mg/dL (♀) is low",
  "HDL-C": "High-Density Lipoprotein Cholesterol — cardioprotective lipoprotein fraction",
  "TG": "Triglycerides — fasting ≥ 150 mg/dL elevated, ≥ 500 mg/dL severe (pancreatitis risk)",
  "FH": "Familial Hypercholesterolemia — genetic disorder causing severely elevated LDL-C from birth",
  "HoFH": "Homozygous Familial Hypercholesterolemia — both alleles affected, extremely high LDL, requires specialized therapy",
  "TOD": "Target Organ Damage — microvascular (retinopathy, nephropathy, neuropathy) or macrovascular (LVH, diastolic dysfunction)",
  "PAD": "Peripheral Arterial Disease — atherosclerotic narrowing of peripheral arteries, ABI < 0.9",
  "MI": "Myocardial Infarction — heart attack, necrosis of cardiac muscle due to ischemia",
  "CABG": "Coronary Artery Bypass Graft — surgical revascularization of coronary arteries",
  "ACS": "Acute Coronary Syndrome — encompasses STEMI, NSTEMI, and unstable angina",
  "PCSK9i": "Proprotein Convertase Subtilisin/Kexin type 9 inhibitor — e.g., Evolocumab, Alirocumab. Dramatically lowers LDL by increasing hepatic LDL receptor availability.",
  "PCSK9": "Proprotein Convertase Subtilisin/Kexin type 9 — enzyme that degrades LDL receptors, limiting hepatic LDL clearance",
  "ACEi": "Angiotensin-Converting Enzyme Inhibitor — e.g., Ramipril, Enalapril. First-line for HTN with CKD/DM.",
  "ARB": "Angiotensin Receptor Blocker — e.g., Losartan, Telmisartan. Alternative to ACEi.",
  "CCB": "Calcium Channel Blocker — e.g., Amlodipine, Nifedipine. First-line antihypertensive.",
  "HTN": "Hypertension — sustained BP ≥ 130/80 mmHg or on treatment",
  "DM": "Diabetes Mellitus — HbA1c ≥ 6.5% or FBG ≥ 126 mg/dL on two occasions",
  "CAD": "Coronary Artery Disease — atherosclerotic narrowing of coronary arteries",
  "TIA": "Transient Ischemic Attack — temporary focal neurological deficit due to ischemia, resolves within 24h",
  "CVA": "Cerebrovascular Accident — stroke, ischemic or hemorrhagic",
  "LVH": "Left Ventricular Hypertrophy — increased LV mass, marker of hypertensive heart disease",
  "Lp(a)": "Lipoprotein(a) — genetically determined lipoprotein, ≥ 50 mg/dL = elevated ASCVD risk",
  "ApoB": "Apolipoprotein B — main apolipoprotein of atherogenic lipoproteins, > 130 mg/dL = elevated",
  "hsCRP": "High-Sensitivity C-Reactive Protein — inflammatory marker, ≥ 2 mg/L = elevated CV risk",
  "CAC": "Coronary Artery Calcium — CT-measured coronary calcification, Agatston score quantifies plaque burden",
  "ARR": "Aldosterone-to-Renin Ratio — screening test for primary hyperaldosteronism",
  "PRA": "Plasma Renin Activity — measure of renin-angiotensin system activity",
  "DST": "Dexamethasone Suppression Test — screening for Cushing syndrome",
  "CPAP": "Continuous Positive Airway Pressure — treatment for OSA",
  "SBP": "Systolic Blood Pressure",
  "DBP": "Diastolic Blood Pressure",
  "BP": "Blood Pressure",
  "UACR": "Urine Albumin-to-Creatinine Ratio — marker of kidney damage, ≥ 30 mg/g = abnormal",
  "MetS": "Metabolic Syndrome — ≥ 3 of: ↑waist, ↑TG, ↓HDL, ↑BP, ↑glucose",
  "MACE": "Major Adverse Cardiac Events — composite: CV death, MI, stroke",
  "ENaC": "Epithelial Sodium Channel — sodium channel in collecting duct, gain-of-function mutation causes Liddle syndrome",
  "AME": "Apparent Mineralocorticoid Excess — 11β-HSD2 deficiency causing HTN with low renin/aldosterone",
  "GRA": "Glucocorticoid-Remediable Aldosteronism — aldosterone high, responds to dexamethasone",
  "CAH": "Congenital Adrenal Hyperplasia — 11β-hydroxylase or 17α-hydroxylase deficiency",
  "WNK": "With No Lysine kinase — mutations cause Gordon syndrome (hyperkalemic HTN)",
  "NPH": "Neutral Protamine Hagedorn — intermediate-acting insulin",
  "BID": "Bis In Die — twice daily dosing",
  "OD": "Omni Die — once daily dosing",
  "SC": "Subcutaneous — route of administration",
  "q2w": "Every 2 weeks — dosing frequency",

  // Landmark Clinical Trials
  "ACCORD": "Action to Control Cardiovascular Risk in Diabetes — landmark trial on intensive glycemic control in T2DM (NEJM 2008)",
  "ADVANCE": "Action in Diabetes and Vascular Disease — trial on intensive glucose control and BP lowering in T2DM",
  "ALLHAT": "Antihypertensive and Lipid-Lowering Treatment to Prevent Heart Attack Trial — major HTN outcomes trial",
  "SPRINT": "Systolic Blood Pressure Intervention Trial — showed intensive BP target (<120 mmHg) reduces CV events",
  "HOPE": "Heart Outcomes Prevention Evaluation — trial showing ramipril reduces CV events in high-risk patients",
  "ONTARGET": "Ongoing Telmisartan Alone and in Combination with Ramipril Global Endpoint Trial — dual RAAS blockade harmful",
  "PROGRESS": "Perindopril Protection Against Recurrent Stroke Study — BP lowering reduces stroke recurrence",
  "RENAAL": "Reduction of Endpoints in NIDDM with Angiotensin II Antagonist Losartan — losartan renoprotective in DN",
  "IDNT": "Irbesartan Diabetic Nephropathy Trial — irbesartan renoprotective in T2DM nephropathy",
  "RALES": "Randomized Aldactone Evaluation Study — spironolactone reduces mortality in HFrEF",
  "TOPCAT": "Treatment of Preserved Cardiac Function HF with Aldosterone Antagonist — spironolactone in HFpEF",
  "CIBIS": "Cardiac Insufficiency Bisoprolol Study — bisoprolol reduces mortality in HF",
  "PROFESS": "Prevention Regimen for Effectively Avoiding Second Strokes — antiplatelet + telmisartan in stroke",
  "HYVET": "Hypertension in the Very Elderly Trial — antihypertensives beneficial in patients ≥80 years",
  "CAMELOT": "Comparison of Amlodipine vs Enalapril to Limit Occurrences of Thrombosis — CCB slows CAD progression",
  "MOXCON": "Moxonidine Congestive Heart Failure Trial — central sympatholytic harmful in HF",
  "LEADER": "Liraglutide Effect and Action in Diabetes — CV outcomes trial showing CV benefit with liraglutide",
  "SUSTAIN": "Semaglutide Unabated Sustainability in T2DM — CV outcomes trial for subcutaneous semaglutide",
  "REWIND": "Researching CV Events with Weekly Incretin in Diabetes — dulaglutide CV outcomes trial",
  "SAVOR": "Saxagliptin Assessment of Vascular Outcomes — saxagliptin CV outcomes in T2DM",
  "TECOS": "Trial Evaluating CV Outcomes with Sitagliptin — sitagliptin CV safety in T2DM",
  "DECLARE": "Dapagliflozin Effect on CV Events — dapagliflozin CV/renal outcomes trial",
  "DELIVER": "Dapagliflozin Evaluation to Improve Outcomes in HFpEF — dapagliflozin in HF with preserved EF",
  "DAPA": "Dapagliflozin — SGLT2i used in Diabetes, HF, and CKD. DAPA-HF / DAPA-CKD / DECLARE-TIMI 58",
  "EMPA": "Empagliflozin — SGLT2i. EMPA-REG OUTCOME showed CV mortality reduction in T2DM",
  "FOURIER": "Further CV Outcomes Research with PCSK9 Inhibition — evolocumab reduces MACE",
  "ODYSSEY": "ODYSSEY OUTCOMES — alirocumab (PCSK9i) reduces MACE in post-ACS patients",
  "CANTOS": "Canakinumab Anti-Inflammatory Thrombosis Outcomes Study — anti-inflammatory therapy reduces CV events",
  "COLCOT": "Colchicine CV Outcomes Trial — low-dose colchicine reduces ischemic events in CAD",
  "REDUCE": "REDUCE-IT — icosapent ethyl (Vascepa) reduces CV events in high-risk patients with elevated TG",
  "CARE": "Cholesterol and Recurrent Events — pravastatin reduces events post-MI",
  "LIPID": "Long-Term Intervention with Pravastatin in Ischemic Disease — pravastatin reduces mortality in CAD",
  "ASCOT": "Anglo-Scandinavian Cardiac Outcomes Trial — amlodipine + perindopril superior to atenolol + thiazide",
  "VALUE": "Valsartan Antihypertensive Long-term Use Evaluation — valsartan vs amlodipine in high-risk HTN",
  "LIFE": "Losartan Intervention For Endpoint Reduction — losartan superior to atenolol in HTN with LVH",
  "ACCOMPLISH": "Avoiding CV Events through Combination Therapy — benazepril + amlodipine > benazepril + HCTZ",
  "SELECT": "Semaglutide Effects on CV Outcomes in Overweight/Obese — CV benefit in non-diabetic obesity",
  "SURPASS": "Tirzepatide clinical trial program — GIP/GLP-1 RA showing superior glucose and weight reduction",
  "DURATION": "DURATION program — exenatide once weekly clinical trials (DURATION-1 through -8)",
  "KDN": "Key Doing Nothing — tongue-in-cheek term for watchful waiting",

  // Systems & Pathways
  "RAS": "Renin-Angiotensin System — hormonal cascade regulating BP and fluid balance",
  "RAAS": "Renin-Angiotensin-Aldosterone System — complete pathway including aldosterone",
  "EF": "Ejection Fraction — % of blood ejected from LV per beat. Normal ≥ 50%",
  "GDMT": "Guideline-Directed Medical Therapy — evidence-based pharmacological therapy per clinical guidelines",
  "AKI": "Acute Kidney Injury — rapid decline in kidney function (↑Cr, ↓urine output)",
  "ESRD": "End-Stage Renal Disease — eGFR < 15 mL/min or on dialysis",
  "CGM": "Continuous Glucose Monitoring — real-time interstitial glucose measurement device (Dexcom, Freestyle Libre)",
  "SMBG": "Self-Monitoring of Blood Glucose — fingerstick blood glucose testing",
  "DKA": "Diabetic Ketoacidosis — acute hyperglycemic emergency with ketosis and metabolic acidosis",
  "HHS": "Hyperosmolar Hyperglycemic State — extreme hyperglycemia (>600 mg/dL) without significant ketosis",
  "T1DM": "Type 1 Diabetes Mellitus — autoimmune β-cell destruction → absolute insulin deficiency",
  "T2DM": "Type 2 Diabetes Mellitus — insulin resistance with progressive β-cell failure",
  "LADA": "Latent Autoimmune Diabetes of Adults — slowly progressive autoimmune diabetes, onset >30y",
  "MODY": "Maturity-Onset Diabetes of the Young — monogenic diabetes (AD inheritance, onset <25y)",
  "GDM": "Gestational Diabetes Mellitus — glucose intolerance first diagnosed during pregnancy",
  "IFG": "Impaired Fasting Glucose — FBG 100-125 mg/dL (prediabetes category)",
  "IGT": "Impaired Glucose Tolerance — 2h OGTT 140-199 mg/dL (prediabetes category)",
  "FPG": "Fasting Plasma Glucose — glucose after ≥8h of no caloric intake",
  "OGTT": "Oral Glucose Tolerance Test — 75g glucose load with 2h glucose measurement",
  "HCTZ": "Hydrochlorothiazide — thiazide diuretic used as first-line HTN therapy",
  "NSAID": "Non-Steroidal Anti-Inflammatory Drug — can worsen BP control, reduce ACEi/ARB efficacy",
  "TZD": "Thiazolidinedione — insulin sensitizer (Pioglitazone). Limited use due to fluid retention/CV concerns",
  "SU": "Sulfonylurea — insulin secretagogue (Glimepiride, Gliclazide, Glipizide). Hypoglycemia risk",
  "DPP4i": "Dipeptidyl Peptidase-4 Inhibitor — Sitagliptin, Vildagliptin, Linagliptin. Modest HbA1c reduction, weight neutral",
  "GIP": "Glucose-Dependent Insulinotropic Polypeptide — second incretin hormone, co-agonized by Tirzepatide",
  "TSH": "Thyroid-Stimulating Hormone — screening test; normal 0.4-4.0 mIU/L",
  "TPO": "Thyroid Peroxidase — anti-TPO antibodies (also called TgAb / thyroid microsomal antibodies) indicate autoimmune thyroid disease (Hashimoto, Graves)",
  "TRAb": "TSH Receptor Antibody — TRAb (includes TSI = thyroid-stimulating immunoglobulin) autoantibody that stimulates or blocks the TSH receptor; positive in Graves disease",
  "TSI": "Thyroid-Stimulating Immunoglobulin — subclass of TRAb that directly stimulates the TSH receptor, causing hyperthyroidism in Graves disease",
  "ALT": "Alanine Aminotransferase — liver enzyme, marker of hepatocellular injury (normal <40 U/L)",
  "AST": "Aspartate Aminotransferase — liver enzyme, also present in cardiac/muscle tissue",
  "CK": "Creatine Kinase — muscle enzyme. Elevated in statin-induced myopathy/rhabdomyolysis",
  "ULN": "Upper Limit of Normal — ceiling of lab reference range",
  "ECG": "Electrocardiogram — recording of cardiac electrical activity (12-lead)",
  "CTA": "CT Angiography — non-invasive angiogram using CT contrast",
  "MRA": "MR Angiography — non-invasive angiogram using MRI contrast",
  "ABI": "Ankle-Brachial Index — ratio of ankle to arm SBP. <0.9 = PAD, >1.4 = non-compressible",
  "CRP": "C-Reactive Protein — acute phase reactant, non-specific inflammatory marker",
  "hs-CRP": "High-Sensitivity C-Reactive Protein — more sensitive CRP for CV risk prediction",
  "TC": "Total Cholesterol — sum of LDL + HDL + VLDL (VLDL ≈ TG/5)",
  "NCEP": "National Cholesterol Education Program — US guideline body for cholesterol management",
  "ATP III": "Adult Treatment Panel III — NCEP cholesterol guidelines (2001/2004)",
  "DLCN": "Dutch Lipid Clinic Network — FH diagnostic scoring: definite ≥8, probable 6-8, possible 3-5",
  "NYHA": "New York Heart Association — HF severity classification (I: no sx, II: mild, III: mod, IV: severe)",
  "PCI": "Percutaneous Coronary Intervention — coronary angioplasty ± stenting",
  "COPD": "Chronic Obstructive Pulmonary Disease — chronic lung disease with airflow limitation",
  "HIV": "Human Immunodeficiency Virus — viral infection associated with increased CV risk",
  "RA": "Rheumatoid Arthritis — autoimmune inflammatory arthritis, CV risk enhancer",
  "TOS": "The Obesity Society — professional society for obesity medicine",
  "FBG": "Fasting Blood Glucose — glucose level after ≥8h fasting (normal <100 mg/dL)",
  "RBS": "Random Blood Sugar — any-time glucose measurement",
  "FBS": "Fasting Blood Sugar — alternate term for FBG",
  "PP": "Post-Prandial — glucose measurement 2h after a meal",
  "TDD": "Total Daily Dose — sum of all insulin doses in 24 hours",
  "SSI": "Sliding Scale Insulin — correction-dose insulin algorithm based on current glucose",
  "PRN": "Pro Re Nata — as needed (per required circumstances)",
  "TID": "Ter In Die — three times daily dosing",
  "QID": "Quater In Die — four times daily dosing",
  "AC": "Ante Cibum — before meals (used with insulin timing)",
  "HS": "Hora Somni — at bedtime",
  "IM": "Intramuscular — injection into muscle",

  // Guidelines & Organizations
  "WHO": "World Health Organization — UN agency; defines BMI classifications and global health standards",
  "CDC": "Centers for Disease Control and Prevention — US public health agency",
  "ADA": "American Diabetes Association — publishes annual Standards of Medical Care in Diabetes",
  "AHA": "American Heart Association — publishes CV prevention and treatment guidelines",
  "ACC": "American College of Cardiology — publishes joint clinical guidelines with AHA",
  "AACE": "American Association of Clinical Endocrinology — lipid and diabetes guidelines",
  "ESC": "European Society of Cardiology — European CV clinical practice guidelines",
  "ESH": "European Society of Hypertension — European HTN management guidelines",
  "KDIGO": "Kidney Disease Improving Global Outcomes — global CKD management guidelines",
  "NICE": "National Institute for Health and Care Excellence — UK clinical guidelines",
  "LAI": "Lipid Association of India — publishes Indian lipid management guidelines",

  // LAI Risk Categories
  "EHR": "Extreme High Risk — LAI risk category for patients with ASCVD or equivalents; LDL target < 55 mg/dL",
  "EHR-A": "Extreme High Risk — Category A: ASCVD alone or with minor risk features. Tx: High-intensity statin + Ezetimibe. LDL target < 55 mg/dL",
  "EHR-B": "Extreme High Risk — Category B: ASCVD + ≥1 high-risk feature or polyvascular disease. Tx: High-intensity statin + Ezetimibe + PCSK9i. LDL target < 55 mg/dL",
  "EHR-C": "Extreme High Risk — Category C: Recurrent/progressive ASCVD events despite therapy. Tx: Maximal multi-drug therapy (statin + Ezetimibe + PCSK9i + Bempedoic acid). LDL target < 30 mg/dL",
};

export function AbbreviationHover({ term, children, definition: override }: { term: string; children?: React.ReactNode; definition?: string }) {
  const fullForm = override || ABBREVIATIONS[term];
  if (!fullForm) return <>{children || term}</>;

  return (
    <span className="group relative inline-block">
      <span className="text-foreground font-medium underline decoration-dotted decoration-primary/40 cursor-help">
        {children || term}
      </span>
      <div className="absolute left-0 top-full mt-1 w-72 hidden group-hover:block z-50">
        <div className="bg-popover text-popover-foreground text-xs p-3 rounded-lg shadow-xl border border-border">
          <p className="font-semibold text-primary mb-1">{term}</p>
          <p className="text-muted-foreground leading-relaxed">{fullForm}</p>
        </div>
      </div>
    </span>
  );
}

export function AbbreviationHoverInline({ children, definition }: { children: React.ReactNode; definition: string }) {
  return (
    <span className="group relative inline-block">
      <span className="text-foreground underline decoration-dotted decoration-primary/40 cursor-help">
        {children}
      </span>
      <div className="absolute left-1/2 -translate-x-1/2 top-full mt-1 w-72 hidden group-hover:block z-50">
        <div className="bg-popover text-popover-foreground text-xs p-3 rounded-lg shadow-xl border border-border">
          <p className="text-muted-foreground leading-relaxed">{definition}</p>
        </div>
      </div>
    </span>
  );
}

export default AbbreviationHover;

// ─── Auto-replace abbreviations in any text string ───
// Sorts by length (longest first) to avoid partial replacements
const SORTED_TERMS = Object.keys(ABBREVIATIONS).sort((a, b) => b.length - a.length);

/**
 * AbbrText: Takes a plain text string and auto-wraps every known abbreviation
 * with an AbbreviationHover component. Handles abbreviations in any position
 * — standalone, parenthesized, followed by punctuation, etc.
 *
 * Example: "ACEi/ARB are recommended for CKD with HTN"
 * → <span><AbbreviationHover term="ACEi">ACEi</AbbreviationHover>/
 *      <AbbreviationHover term="ARB">ARB</AbbreviationHover> are recommended for
 *      <AbbreviationHover term="CKD">CKD</AbbreviationHover> with
 *      <AbbreviationHover term="HTN">HTN</AbbreviationHover></span>
 */
export function AbbrText({ text, className }: { text: string; className?: string }) {
  if (!text) return <span className={className} />;

  // Build regex pattern: match any known abbreviation as a whole word
  // (preceded by start/whitespace/paren/slash, followed by end/whitespace/paren/slash/punctuation)
  const escapedTerms = SORTED_TERMS.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const pattern = new RegExp(`(${escapedTerms.join('|')})(?=[\\s.,;:/)\]!?-+]|$)`, 'g');

  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  const regex = new RegExp(pattern.source, 'g');
  while ((match = regex.exec(text)) !== null) {
    // Add text before the match
    if (match.index > lastIndex) {
      parts.push(<span key={key++}>{text.slice(lastIndex, match.index)}</span>);
    }
    // Add the abbreviation as hoverable
    const abbr = match[1];
    parts.push(<AbbreviationHover key={key++} term={abbr}>{abbr}</AbbreviationHover>);
    lastIndex = match.index + abbr.length;
  }
  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(<span key={key++}>{text.slice(lastIndex)}</span>);
  }

  if (parts.length === 0) return <span className={className}>{text}</span>;
  return <span className={className}>{parts}</span>;
}
