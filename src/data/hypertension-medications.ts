// Individual Drug Doses & Clinical Pearls
export interface DrugDoseDetail {
  name: string;
  brand: string;
  drugClass: string;
  doseRange: string;
  pearls: string;
  caution?: string;
}

export const drugDoseDetails: DrugDoseDetail[] = [
  // ─── ACE Inhibitors ───
  { name: "Lisinopril", brand: "Prinivil, Zestril", drugClass: "ACEi", doseRange: "10–40 mg OD", pearls: "Monitor K+ and Cr. Dry cough common (10-20%). Contraindicated in pregnancy.", caution: "Angioedema (rare but serious)" },
  { name: "Enalapril", brand: "Vasotec", drugClass: "ACEi", doseRange: "2.5–40 mg/day OD/BID", pearls: "Can be dosed BID for smoother BP control. HOPE trial benefit in high CV risk.", caution: "Monitor K+ and Cr" },
  { name: "Ramipril", brand: "Altace", drugClass: "ACEi", doseRange: "2.5–10 mg OD/BID", pearls: "HOPE trial: ↓ CV events, stroke, mortality. Start 2.5 mg daily.", caution: "Cough, angioedema" },
  { name: "Captopril", brand: "Capoten", drugClass: "ACEi", doseRange: "12.5–50 mg TID", pearls: "Short T½ — requires TID dosing. Used for diabetic nephropathy.", caution: "Rash, taste disturbance" },
  { name: "Perindopril", brand: "Aceon", drugClass: "ACEi", doseRange: "4–16 mg OD", pearls: "Long T½ — true OD dosing. Perindopril + Indapamide (PROGRESS) ↓ recurrent stroke.", caution: "Same ACEi class effects" },

  // ─── ARBs ───
  { name: "Losartan", brand: "Cozaar", drugClass: "ARB", doseRange: "25–100 mg OD/BID", pearls: "RENAAL trial: ↓ progression of diabetic nephropathy. Weak uricosuric effect.", caution: "Avoid in pregnancy — ALL ARBs" },
  { name: "Valsartan", brand: "Diovan", drugClass: "ARB", doseRange: "80–320 mg OD", pearls: "Val-HeFT: ↓ HF hospitalizations. Also has HF indication.", caution: "Hyperkalemia, renal impairment" },
  { name: "Telmisartan", brand: "Micardis", drugClass: "ARB", doseRange: "20–80 mg OD", pearls: "PPAR-γ agonist activity — modest glucose lowering. ONTARGET trial.", caution: "Same ARB class effects" },
  { name: "Irbesartan", brand: "Avapro", drugClass: "ARB", doseRange: "75–300 mg OD", pearls: "IDNT trial: ↓ diabetic nephropathy progression. Well tolerated.", caution: "Same ARB class effects" },
  { name: "Olmesartan", brand: "Benicar", drugClass: "ARB", doseRange: "20–40 mg OD", pearls: "Potent ARB. Rare sprue-like enteropathy reported.", caution: "Monitor for GI symptoms" },

  // ─── CCBs ───
  { name: "Azelnidipine", brand: "Calblock", drugClass: "DHP-CCB", doseRange: "8–16 mg OD", pearls: "Long t½ (~19h) — true OD. Less pedal oedema vs amlodipine. Also blocks T-type Ca channels — may have less reflex tachycardia. Popular in Japanese/Asian markets.", caution: "Headache, dizziness. Avoid with strong CYP3A4 inhibitors." },
  { name: "Cilnidipine", brand: "Cilacar, Cilnidipine", drugClass: "DHP-CCB", doseRange: "5–20 mg OD (once-daily)", pearls: "Dual L/N-type Ca channel blocker — blocks N-type Ca channels in sympathetic nerve terminals, reducing reflex tachycardia. Less pedal edema vs amlodipine. Renoprotective (↓ proteinuria). Popular in India/Asia. T½ ~16h.", caution: "Headache, dizziness, flushing. Caution with CYP3A4 inhibitors." },
  { name: "Amlodipine", brand: "Norvasc", drugClass: "DHP-CCB", doseRange: "2.5–10 mg OD", pearls: "Long T½ (30-50h) — true OD dosing. Vasoselective. Peripheral edema common.", caution: "Lower extremity edema" },
  { name: "Nifedipine ER", brand: "Procardia XL, Adalat CC", drugClass: "DHP-CCB", doseRange: "30–90 mg OD", pearls: "ER/XL only — short-acting IR NEVER use (reflex tachycardia, ↑ CV events).", caution: "Short-acting form contraindicated" },
  { name: "Verapamil", brand: "Calan, Isoptin", drugClass: "Non-DHP CCB", doseRange: "120–480 mg/day", pearls: "Rate + BP control — use in AF + HTN. Causes constipation.", caution: "Avoid with BB (bradycardia). Negative inotrope." },
  { name: "Diltiazem", brand: "Cardizem", drugClass: "Non-DHP CCB", doseRange: "CD: 120–360 mg OD", pearls: "Both BP and rate control. IV for AF rate control.", caution: "Avoid with BB (bradycardia)" },

  // ─── Thiazide Diuretics ───
  { name: "Chlorthalidone", brand: "Hygroton", drugClass: "Thiazide-like", doseRange: "12.5–25 mg OD", pearls: "Preferred thiazide — longer T½, stronger CV outcome data vs HCTZ (ALLHAT).", caution: "Monitor K+, Na+, uric acid" },
  { name: "Hydrochlorothiazide", brand: "Microzide", drugClass: "Thiazide", doseRange: "12.5–50 mg OD", pearls: "Less potent than chlorthalidone. Causes photosensitivity. Sulfa allergy caution.", caution: "Hyperglycemia, hyperuricemia" },
  { name: "Indapamide", brand: "Lozol", drugClass: "Thiazide-like", doseRange: "1.25–5 mg OD", pearls: "Lipid-neutral. HYVET trial: benefit in very elderly (>80y).", caution: "Hypokalemia risk" },
  { name: "Metolazone", brand: "Zaroxolyn", drugClass: "Thiazide-like", doseRange: "2.5–10 mg OD", pearls: "Works even in GFR <30 (unlike HCTZ). Used synergistically with loop diuretics in refractory edema.", caution: "Profound diuresis — monitor volume" },

  // ─── Loop Diuretics ───
  { name: "Furosemide", brand: "Lasix", drugClass: "Loop", doseRange: "20–80 mg OD/BID", pearls: "Short T½ — often needs BID. PO bioavailability ~50%. Ototoxicity with rapid IV push.", caution: "Monitor K+. Hypovolemia risk" },

  // ─── Potassium-Sparing ───
  { name: "Spironolactone", brand: "Aldactone", drugClass: "K-sparing / MRA", doseRange: "25–50 mg OD", pearls: "RALES: ↓ mortality 30% in HFrEF. Also for resistant HTN (PATHWAY-2) and primary aldosteronism.", caution: "Gynecomastia, hyperkalemia" },
  { name: "Eplerenone", brand: "Inspra", drugClass: "K-sparing / MRA", doseRange: "25–50 mg OD (up to 50 mg BID)", pearls: "Selective steroidal aldosterone antagonist. Less gynecomastia vs spironolactone. EMPHASIS-HF, EPHESUS trials.", caution: "Hyperkalemia risk if eGFR <50; avoid strong CYP3A4 inhibitors" },
  { name: "Finerenone", brand: "Kerendia", drugClass: "Nonsteroidal MRA", doseRange: "10 mg OD (eGFR 25–<60); 20 mg OD (eGFR ≥60)", pearls: "Nonsteroidal, selective MRA. FIDELIO-DKD & FIGARO-DKD: ↓ CKD progression and CV events in T2DM + albuminuric CKD. Add on top of maximally tolerated ACEi/ARB. Titrate up if K+ ≤4.8 after 4 weeks.", caution: "Hyperkalemia — hold if K+ >5.5; avoid strong CYP3A4 inhibitors (e.g., ketoconazole); do not combine with steroidal MRAs or K-sparing diuretics" },

  // ─── Beta-Blockers ───
  { name: "Metoprolol Succinate", brand: "Toprol XL", drugClass: "β₁-selective BB", doseRange: "25–200 mg OD", pearls: "MERIT-HF: ↓ mortality in HFrEF. Use ER formulation only in HF.", caution: "Bradycardia, fatigue, mask hypoglycemia" },
  { name: "Carvedilol", brand: "Coreg", drugClass: "α/β blocker", doseRange: "6.25–25 mg BID", pearls: "COPERNICUS, CAPRICORN: ↓ mortality in HFrEF. α-blockade adds vasodilation.", caution: "Titrate slowly. Avoid in asthma." },
  { name: "Bisoprolol", brand: "Zebeta", drugClass: "β₁-selective BB", doseRange: "5–10 mg OD", pearls: "CIBIS-II: ↓ mortality in HFrEF. Most β₁-selective — better tolerated in COPD/asthma.", caution: "Same BB class effects" },
  { name: "Atenolol", brand: "Tenormin", drugClass: "β₁-selective BB", doseRange: "25–100 mg OD", pearls: "ASCOT showed atenolol inferior to amlodipine for CV outcomes. No longer preferred.", caution: "Less evidence vs newer BBs" },
  { name: "Propranolol", brand: "Inderal", drugClass: "Non-selective BB", doseRange: "40–240 mg BID", pearls: "Non-selective — blocks β₂ receptors. Used for migraine prophylaxis, essential tremor, performance anxiety.", caution: "Avoid in asthma, COPD" },

  // Beta-blocker selection guide
  {
    name: "Beta-Blocker Selection Guide",
    brand: "",
    drugClass: "Clinical Decision Tool",
    doseRange: "",
    pearls: "Beta-blockers are not interchangeable — choose based on patient's phenotype. See image below for comparison.",
    caution: ""
  },

  // ─── Alpha Blockers ───
  { name: "Prazosin", brand: "Minipress", drugClass: "α₁-blocker", doseRange: "1–10 mg BID/TID", pearls: "First-dose syncope risk — start at bedtime. Also for BPH, PTSD nightmares.", caution: "Orthostatic hypotension" },
  { name: "Doxazosin", brand: "Cardura", drugClass: "α₁-blocker", doseRange: "1–8 mg OD", pearls: "Longer T½ — OD dosing. ALLHAT: increased HF vs chlorthalidone — no longer 1st line.", caution: "Not 1st-line for HTN" },
  { name: "Terazosin", brand: "Hytrin", drugClass: "α₁-blocker", doseRange: "1–10 mg OD", pearls: "Also for BPH. Start 1 mg at bedtime.", caution: "Same α-blocker class effects" },

  // ─── Centrally Acting ───
  { name: "Clonidine", brand: "Catapres", drugClass: "Central α₂-agonist", doseRange: "0.1–0.8 mg BID (TID if needed)", pearls: "Oral tablets given in divided doses — typically start BID (morning + bedtime); some patients need TID for smoother BP control. Also available as transdermal patch (0.1–0.3 mg/day × 7 days). Rebound HTN on abrupt stop.", caution: "Sedation, dry mouth. REBOUND HTN" },
  { name: "Methyldopa", brand: "Aldomet", drugClass: "Central α₂-agonist", doseRange: "250–1000 mg BID", pearls: "Gold standard in pregnancy (decades of safety data). Positive Coombs test — doesn't cause hemolysis.", caution: "Sedation, positive Coombs" },
  { name: "Guanfacine", brand: "Tenex", drugClass: "Central α₂-agonist", doseRange: "0.5–2 mg OD", pearls: "Less sedation vs clonidine. Also used for ADHD.", caution: "Same class effects, less rebound" },

  // ─── Vasodilators ───
  { name: "Hydralazine", brand: "Apresoline", drugClass: "Direct vasodilator", doseRange: "10–50 mg QID", pearls: "Use with BB + diuretic (pseudo-tolerance). A-HeFT: ↓ mortality in African-Americans with HF.", caution: "Reflex tachycardia, drug-induced lupus" },
  { name: "Dihydralazine", brand: "Aprilife", drugClass: "Direct vasodilator", doseRange: "12.5–25 mg TID/QID", pearls: "Hydralazine derivative; used in pregnancy hypertension (esp. pre-eclampsia) where other agents have failed. Similar properties to hydralazine with possibly less reflex tachycardia.", caution: "Reflex tachycardia, drug-induced lupus (lower risk than hydralazine)" },
  { name: "Minoxidil", brand: "Loniten", drugClass: "Direct vasodilator", doseRange: "2.5–40 mg BID/TID", pearls: "Most potent oral agent. Requires loop diuretic + BB (reflex tachycardia + fluid retention).", caution: "Pericardial effusion, hirsutism" },

  // ─── Direct Renin Inhibitor ───
  { name: "Aliskiren", brand: "Tekturna, Rasilez", drugClass: "DRI", doseRange: "150–300 mg OD", pearls: "Only oral DRI. Modest BP reduction. Long T½ (~24 h). Take on empty stomach — high-fat meals ↓ absorption ~70%.", caution: "AVOID with ACEi/ARB in diabetes (ALTITUDE — ↑ AKI, stroke, hyperkalemia). Contraindicated in pregnancy." },

  // ─── ARNI ───
  { name: "Sacubitril/Valsartan", brand: "Entresto", drugClass: "ARNI", doseRange: "49/51 mg BID → titrate to 97/103 mg BID", pearls: "PARADIGM-HF: 20% ↓ CV death/HF hospitalisation vs enalapril in HFrEF. Also PARAGON-HF (HFpEF, borderline). Start low if hypotensive or elderly.", caution: "Requires 36-h washout from ACEi (angioedema risk). Avoid with ACEi. Monitor BP, K+, Cr." },

  // ─── SGLT2 inhibitors (BP-lowering + cardiorenal) ───
  { name: "Empagliflozin", brand: "Jardiance", drugClass: "SGLT2i", doseRange: "10–25 mg OD", pearls: "EMPA-REG, EMPEROR-Reduced/Preserved: CV & renal benefit. Modest BP ↓ (~4/2 mmHg) via osmotic diuresis.", caution: "Genital mycotic infections, euglycemic DKA, volume depletion" },
  { name: "Dapagliflozin", brand: "Farxiga, Forxiga", drugClass: "SGLT2i", doseRange: "10 mg OD", pearls: "DAPA-HF, DAPA-CKD: mortality and CKD progression benefit even in non-diabetics. Adjunct in resistant HTN.", caution: "Same SGLT2i class effects; hold before major surgery" },


  // ─── IV Agents ───
  { name: "Sodium Nitroprusside", brand: "Nipride", drugClass: "IV vasodilator", doseRange: "0.25–10 µg/kg/min IV", pearls: "Gold standard for hypertensive crisis. Rapid onset/offset. Light-sensitive.", caution: "Cyanide/thiocyanate toxicity >72h or CKD" },
  { name: "Labetalol IV", brand: "—", drugClass: "IV α/β blocker", doseRange: "10–80 mg IV push, 0.5–2 mg/min infusion", pearls: "IV: 10 mg over 2 min for emergencies. β:α blockade ~7:1 IV. Preferred in eclampsia + aortic dissection.", caution: "Avoid in asthma" },
  { name: "Nicardipine IV", brand: "Cardene", drugClass: "IV DHP-CCB", doseRange: "5–15 mg/h IV drip", pearls: "No negative inotrope. Used in stroke, encephalopathy. Easy to titrate.", caution: "May cause reflex tachycardia" },
  { name: "Esmolol IV", brand: "Brevibloc", drugClass: "IV β₁-blocker", doseRange: "25–300 µg/kg/min IV", pearls: "Ultra-short T½ (2 min) — titrate minute-to-minute. Aortic dissection, ACS.", caution: "Avoid in decompensated HF" },
  { name: "Fenoldopam", brand: "Corlopam", drugClass: "DA₁ agonist", doseRange: "0.1–1.6 µg/kg/min IV", pearls: "Renal vasodilation — preserves GFR. No toxic metabolites.", caution: "Monitor for hypotension" },
  { name: "Clevidipine", brand: "Cleviprex", drugClass: "IV DHP-CCB", doseRange: "1–16 mg/h IV", pearls: "Ultra-rapid onset/offset — ideal for tight control. Lipid emulsion.", caution: "Egg/soy allergy" },
];
