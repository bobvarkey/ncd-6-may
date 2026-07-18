import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { AlertCircle, CheckCircle2, Heart, Activity, Droplet, AlertTriangle, ChevronDown, ChevronRight, Stethoscope } from "lucide-react";
import { FrequencyBadge } from "@/components/FrequencyBadge";
import ImageLink from "@/components/ImageLink";

/** Extract frequency tag from a dose range string like "8–16 mg OD" -> "OD" */
function extractCardFreq(dose: string): string {
  const s = dose.toLowerCase();
  if (/\b(weekly)\b/.test(s)) return "Weekly";
  if (/\b(qid|qds|four\s*times)\b/.test(s)) return "QID";
  if (/\b(tds|tid|three\s*times)\b/.test(s)) return "TDS";
  if (/\b(bd|bid|twice)\b/.test(s)) return "BD";
  if (/\b(od|daily|once|day|qd|o\.d)\b/.test(s)) return "OD";
  if (/\b(prn)\b/.test(s)) return "PRN";
  return "—";
}

// Antihypertensive Classes — `classMatch` maps a class card to entries in
// drugDoseDetails so we can render the full name/dose/interval table per class.
const medicationClasses = [
  {
    class: "ACE Inhibitors",
    suffix: "-pril",
    classMatch: ["ACEi"],
    mechanism: "Block conversion of angiotensin I to II → ↓ vasoconstriction, ↓ aldosterone",
    indications: ["Diabetes with proteinuria", "CKD", "Heart failure", "Post-MI", "High CV risk"],
    contraindications: ["Pregnancy", "Bilateral renal artery stenosis", "ACEi-induced angioedema", "Hyperkalemia (K+ >5.5)"],
    sideEffects: ["Dry cough (10-20%)", "Hyperkalemia", "Acute kidney injury", "Angioedema (rare)"],
    monitoring: ["Creatinine & K+ at baseline, 1-2 weeks, then annually", "Check BP response"],
    firstLine: true,
    color: "bg-primary/10 border-primary/30",
  },
  {
    class: "ARBs (Angiotensin Receptor Blockers)",
    suffix: "-sartan",
    classMatch: ["ARB"],
    mechanism: "Block AT1 receptor → vasodilation, ↓ aldosterone without affecting bradykinin",
    indications: ["ACEi cough intolerance", "Diabetes with proteinuria", "CKD", "Heart failure"],
    contraindications: ["Pregnancy", "Bilateral renal artery stenosis", "Hyperkalemia"],
    sideEffects: ["Hyperkalemia", "Hypotension", "Acute kidney injury", "Less cough than ACEi"],
    monitoring: ["Creatinine & K+ at baseline, 1-2 weeks, then annually", "BP response"],
    firstLine: true,
    color: "bg-primary/10 border-primary/30",
  },
  {
    class: "Calcium Channel Blockers (CCBs)",
    suffix: "-pine",
    classMatch: ["DHP-CCB", "Non-DHP CCB", "IV DHP-CCB"],
    mechanism: "Block L-type calcium channels → arterial vasodilation, ↓ peripheral resistance",
    indications: ["Isolated systolic HTN (elderly)", "Angina", "Black patients", "Metabolic syndrome"],
    contraindications: ["Cardiogenic shock", "Severe aortic stenosis", "Verapamil/Diltiazem: avoid with HFrEF"],
    sideEffects: ["Peripheral edema", "Flushing", "Dizziness", "Gingival hyperplasia", "Constipation (verapamil)"],
    monitoring: ["Peripheral edema", "BP response", "Heart rate (non-DHP CCBs)"],
    firstLine: true,
    color: "bg-success/10 border-success/30",
  },
  {
    class: "Thiazide Diuretics",
    suffix: "-thiazide",
    classMatch: ["Thiazide", "Thiazide-like"],
    mechanism: "Inhibit Na+/Cl- cotransporter in distal tubule → ↑ Na+ & water excretion",
    indications: ["Isolated systolic HTN", "Elderly patients", "Heart failure", "Osteoporosis prevention"],
    contraindications: ["Gout", "Severe CKD (GFR <30)", "Hyponatremia", "Addison's disease"],
    sideEffects: ["Hypokalemia", "Hyponatremia", "Hyperglycemia", "Hyperuricemia", "Dehydration"],
    monitoring: ["Electrolytes (Na+, K+) at 1-2 weeks then 6-12 monthly", "Creatinine", "Glucose", "Uric acid"],
    firstLine: true,
    color: "bg-warning/10 border-warning/30",
  },
  {
    class: "Loop Diuretics",
    suffix: "-semide/-anide",
    classMatch: ["Loop"],
    mechanism: "Inhibit Na⁺/K⁺/2Cl⁻ cotransporter in thick ascending limb → potent natriuresis",
    indications: ["HTN with GFR <30", "Volume overload / HF", "Refractory edema"],
    contraindications: ["Anuria", "Severe electrolyte depletion", "Sulfa allergy (some)"],
    sideEffects: ["Hypokalemia", "Hyponatremia", "Ototoxicity", "Hyperuricemia"],
    monitoring: ["Electrolytes, volume status, weight"],
    firstLine: false,
    color: "bg-warning/10 border-warning/30",
  },
  {
    class: "Beta-Blockers",
    suffix: "-olol",
    classMatch: ["β₁-selective BB", "Non-selective BB", "α/β blocker", "IV β₁-blocker", "IV α/β blocker"],
    mechanism: "Block β-adrenergic receptors → ↓ HR, ↓ contractility, ↓ renin release",
    indications: ["Heart failure (carvedilol, bisoprolol, metoprolol)", "Post-MI", "Angina", "Rate control (AF)"],
    contraindications: ["Severe asthma/COPD", "Bradycardia (<50 bpm)", "Heart block", "Decompensated HF"],
    sideEffects: ["Fatigue", "Bradycardia", "Sexual dysfunction", "Mask hypoglycemia", "Depression"],
    monitoring: ["Heart rate", "BP", "Signs of heart failure", "Masked hypoglycemia in diabetics"],
    firstLine: false,
    color: "bg-muted border-border",
  },
  {
    class: "Mineralocorticoid Receptor Antagonists",
    suffix: "-none/-actone",
    classMatch: ["K-sparing / MRA"],
    mechanism: "Block aldosterone receptor → Na+ excretion, K+ retention, antifibrotic",
    indications: ["Resistant HTN", "HFrEF", "Primary aldosteronism"],
    contraindications: ["Hyperkalemia", "Severe CKD", "Addison's disease"],
    sideEffects: ["Hyperkalemia", "Gynecomastia (spironolactone)", "Renal dysfunction"],
    monitoring: ["K+ and creatinine at 1 week, 1 month, then 3-6 monthly", "BP response"],
    firstLine: false,
    color: "bg-accent/10 border-accent/30",
  },
  {
    class: "Alpha Blockers",
    suffix: "-osin",
    classMatch: ["α₁-blocker"],
    mechanism: "Selective α₁-adrenergic blockade → arteriolar & venous dilation",
    indications: ["HTN with BPH", "Not preferred 1st line (ALLHAT: ↑ HF vs chlorthalidone)"],
    contraindications: ["Orthostatic hypotension", "Concomitant PDE5 inhibitor use (caution)"],
    sideEffects: ["First-dose syncope", "Orthostasis", "Dizziness"],
    monitoring: ["Standing BP, symptoms of orthostasis"],
    firstLine: false,
    color: "bg-muted border-border",
  },
  {
    class: "Central α₂-Agonists",
    suffix: "-clonidine/methyldopa",
    classMatch: ["Central α₂-agonist"],
    mechanism: "Central α₂-stimulation → ↓ sympathetic outflow",
    indications: ["Resistant HTN (add-on)", "Pregnancy (methyldopa)", "Perioperative"],
    contraindications: ["Severe bradycardia", "Depression (relative)"],
    sideEffects: ["Sedation", "Dry mouth", "Rebound HTN on abrupt stop (clonidine)"],
    monitoring: ["BP, HR, mental status; taper — don't stop abruptly"],
    firstLine: false,
    color: "bg-muted border-border",
  },
  {
    class: "Direct Vasodilators",
    suffix: "hydralazine, minoxidil",
    classMatch: ["Direct vasodilator"],
    mechanism: "Direct arteriolar smooth-muscle relaxation",
    indications: ["Resistant HTN", "HF in African-Americans (hydralazine + nitrate)", "Pregnancy (dihydralazine)"],
    contraindications: ["CAD (reflex tachycardia)", "Aortic dissection"],
    sideEffects: ["Reflex tachycardia", "Fluid retention", "Drug-induced lupus (hydralazine)", "Hirsutism (minoxidil)"],
    monitoring: ["HR, volume status, ANA if prolonged use"],
    firstLine: false,
    color: "bg-muted border-border",
  },
  {
    class: "IV Antihypertensives (Hypertensive Emergency)",
    suffix: "IV agents",
    classMatch: ["IV vasodilator", "IV DHP-CCB", "IV α/β blocker", "IV β₁-blocker", "DA₁ agonist"],
    mechanism: "Rapid-titratable parenteral BP control",
    indications: ["Hypertensive emergency", "Aortic dissection", "Eclampsia", "Perioperative"],
    contraindications: ["Agent-specific — see individual drug notes"],
    sideEffects: ["Hypotension, agent-specific toxicities"],
    monitoring: ["Arterial line preferred; continuous BP & HR"],
    firstLine: false,
    color: "bg-accent/10 border-accent/30",
  },
];

// Individual Drug Doses & Clinical Pearls
interface DrugDoseDetail {
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
  { name: "Eplerenone", brand: "Inspra", drugClass: "K-sparing / MRA", doseRange: "50–100 mg OD", pearls: "Selective aldosterone antagonist. Less gynecomastia vs spironolactone. EMPHASIS-HF trial.", caution: "Hyperkalemia risk if GFR <50" },

  // ─── Beta-Blockers ───
  { name: "Metoprolol Succinate", brand: "Toprol XL", drugClass: "β₁-selective BB", doseRange: "25–200 mg OD", pearls: "MERIT-HF: ↓ mortality in HFrEF. Use ER formulation only in HF.", caution: "Bradycardia, fatigue, mask hypoglycemia" },
  { name: "Carvedilol", brand: "Coreg", drugClass: "α/β blocker", doseRange: "6.25–25 mg BID", pearls: "COPERNICUS, CAPRICORN: ↓ mortality in HFrEF. α-blockade adds vasodilation.", caution: "Titrate slowly. Avoid in asthma." },
  { name: "Bisoprolol", brand: "Zebeta", drugClass: "β₁-selective BB", doseRange: "5–10 mg OD", pearls: "CIBIS-II: ↓ mortality in HFrEF. Most β₁-selective — better tolerated in COPD/asthma.", caution: "Same BB class effects" },
  { name: "Atenolol", brand: "Tenormin", drugClass: "β₁-selective BB", doseRange: "25–100 mg OD", pearls: "ASCOT showed atenolol inferior to amlodipine for CV outcomes. No longer preferred.", caution: "Less evidence vs newer BBs" },
  { name: "Propranolol", brand: "Inderal", drugClass: "Non-selective BB", doseRange: "40–240 mg BID", pearls: "Non-selective — blocks β₂ receptors. Used for migraine prophylaxis, essential tremor, performance anxiety.", caution: "Avoid in asthma, COPD" },

  // ─── Alpha Blockers ───
  { name: "Prazosin", brand: "Minipress", drugClass: "α₁-blocker", doseRange: "1–10 mg BID/TID", pearls: "First-dose syncope risk — start at bedtime. Also for BPH, PTSD nightmares.", caution: "Orthostatic hypotension" },
  { name: "Doxazosin", brand: "Cardura", drugClass: "α₁-blocker", doseRange: "1–8 mg OD", pearls: "Longer T½ — OD dosing. ALLHAT: increased HF vs chlorthalidone — no longer 1st line.", caution: "Not 1st-line for HTN" },
  { name: "Terazosin", brand: "Hytrin", drugClass: "α₁-blocker", doseRange: "1–10 mg OD", pearls: "Also for BPH. Start 1 mg at bedtime.", caution: "Same α-blocker class effects" },

  // ─── Centrally Acting ───
  { name: "Clonidine", brand: "Catapres", drugClass: "Central α₂-agonist", doseRange: "0.1–0.8 mg BID", pearls: "Also available as transdermal patch (0.1-0.3 mg/day × 7 days). Rebound HTN on abrupt stop.", caution: "Sedation, dry mouth. REBOUND HTN" },
  { name: "Methyldopa", brand: "Aldomet", drugClass: "Central α₂-agonist", doseRange: "250–1000 mg BID", pearls: "Gold standard in pregnancy (decades of safety data). Positive Coombs test — doesn't cause hemolysis.", caution: "Sedation, positive Coombs" },
  { name: "Guanfacine", brand: "Tenex", drugClass: "Central α₂-agonist", doseRange: "0.5–2 mg OD", pearls: "Less sedation vs clonidine. Also used for ADHD.", caution: "Same class effects, less rebound" },

  // ─── Vasodilators ───
  { name: "Hydralazine", brand: "Apresoline", drugClass: "Direct vasodilator", doseRange: "10–50 mg QID", pearls: "Use with BB + diuretic (pseudo-tolerance). A-HeFT: ↓ mortality in African-Americans with HF.", caution: "Reflex tachycardia, drug-induced lupus" },
  { name: "Dihydralazine", brand: "Aprilife", drugClass: "Direct vasodilator", doseRange: "12.5–25 mg TID/QID", pearls: "Hydralazine derivative; used in pregnancy hypertension (esp. pre-eclampsia) where other agents have failed. Similar properties to hydralazine with possibly less reflex tachycardia.", caution: "Reflex tachycardia, drug-induced lupus (lower risk than hydralazine)" },
  { name: "Minoxidil", brand: "Loniten", drugClass: "Direct vasodilator", doseRange: "2.5–40 mg BID/TID", pearls: "Most potent oral agent. Requires loop diuretic + BB (reflex tachycardia + fluid retention).", caution: "Pericardial effusion, hirsutism" },

  // ─── IV Agents ───
  { name: "Sodium Nitroprusside", brand: "Nipride", drugClass: "IV vasodilator", doseRange: "0.25–10 µg/kg/min IV", pearls: "Gold standard for hypertensive crisis. Rapid onset/offset. Light-sensitive.", caution: "Cyanide/thiocyanate toxicity >72h or CKD" },
  { name: "Labetalol IV", brand: "—", drugClass: "IV α/β blocker", doseRange: "10–80 mg IV push, 0.5–2 mg/min infusion", pearls: "IV: 10 mg over 2 min for emergencies. β:α blockade ~7:1 IV. Preferred in eclampsia + aortic dissection.", caution: "Avoid in asthma" },
  { name: "Nicardipine IV", brand: "Cardene", drugClass: "IV DHP-CCB", doseRange: "5–15 mg/h IV drip", pearls: "No negative inotrope. Used in stroke, encephalopathy. Easy to titrate.", caution: "May cause reflex tachycardia" },
  { name: "Esmolol IV", brand: "Brevibloc", drugClass: "IV β₁-blocker", doseRange: "25–300 µg/kg/min IV", pearls: "Ultra-short T½ (2 min) — titrate minute-to-minute. Aortic dissection, ACS.", caution: "Avoid in decompensated HF" },
  { name: "Fenoldopam", brand: "Corlopam", drugClass: "DA₁ agonist", doseRange: "0.1–1.6 µg/kg/min IV", pearls: "Renal vasodilation — preserves GFR. No toxic metabolites.", caution: "Monitor for hypotension" },
  { name: "Clevidipine", brand: "Cleviprex", drugClass: "IV DHP-CCB", doseRange: "1–16 mg/h IV", pearls: "Ultra-rapid onset/offset — ideal for tight control. Lipid emulsion.", caution: "Egg/soy allergy" },
];
const treatmentAlgorithm = [
  {
    condition: "Diabetes with Proteinuria",
    firstLine: ["ACEi (Ramipril)", "OR ARB (Losartan, Telmisartan)"],
    rationale: "RENAAAL & IDNT trials: ARB reduces proteinuria progression and renal outcomes",
    targetBP: "< 130/80 mmHg",
  },
  {
    condition: "CKD with Proteinuria",
    firstLine: ["ACEi or ARB (max tolerated dose)"],
    rationale: "Slows CKD progression by reducing intraglomerular pressure",
    targetBP: "< 130/80 mmHg",
  },
  {
    condition: "Heart Failure (HFrEF)",
    firstLine: ["ACEi/ARB", "Beta-blocker (Carvedilol, Metoprolol, Bisoprolol)", "MRA (Spironolactone)"],
    rationale: "GDMT: RALES trial - Spironolactone ↓ mortality 30%; CIBIS-II, COPERNICUS - Beta-blockers improve survival",
    targetBP: "< 130/80 mmHg",
  },
  {
    condition: "Post-MI",
    firstLine: ["Beta-blocker", "ACEi (Ramipril - HOPE trial benefit)"],
    rationale: "Reduce reinfarction and mortality; HOPE trial: Ramipril ↓ CV events",
    targetBP: "< 130/80 mmHg",
  },
  {
    condition: "Stroke Prevention",
    firstLine: ["ACEi + Thiazide (Perindopril + Indapamide - PROGRESS trial)"],
    rationale: "PROGRESS: 43% reduction in recurrent stroke; BP reduction is key factor",
    targetBP: "< 130/80 mmHg",
  },
  {
    condition: "Isolated Systolic HTN (Elderly)",
    firstLine: ["Thiazide (Chlorthalidone)", "OR CCB (Amlodipine)"],
    rationale: "ALLHAT trial: Thiazide-like diuretics effective in elderly; HYVET showed benefit even in >80y",
    targetBP: "< 140/90 mmHg (or < 150/90 if >80y frail)",
  },
  {
    condition: "Black Patients",
    firstLine: ["CCB or Thiazide"],
    rationale: "Lower renin state; ACEi/ARB less effective as monotherapy",
    targetBP: "< 130/80 mmHg",
  },
  {
    condition: "Pregnancy",
    firstLine: ["Methyldopa (safest)", "Labetalol", "Nifedipine"],
    rationale: "Methyldopa most studied; ACEi/ARB absolutely contraindicated (teratogenic)",
    targetBP: "< 140/90 mmHg (CHIPS trial)",
    avoid: ["ACEi/ARB", "Spironolactone", "Atenolol"],
  },
];

// Drug Interactions
const drugInteractions = [
  {
    interaction: "ACEi/ARB + Spironolactone",
    risk: "HIGH",
    effect: "Hyperkalemia",
    management: "Monitor K+ closely; avoid if K+ >5.0 or eGFR <30",
  },
  {
    interaction: "ACEi + ARB (Dual RAAS blockade)",
    risk: "HIGH",
    effect: "↑ AKI, ↑ Hyperkalemia, no mortality benefit",
    management: "AVOID - contraindicated in most patients",
  },
  {
    interaction: "Beta-blockers + Verapamil/Diltiazem",
    risk: "MODERATE",
    effect: "Severe bradycardia, heart block",
    management: "Avoid combination; if used, monitor ECG",
  },
  {
    interaction: "Thiazides + NSAIDs",
    risk: "MODERATE",
    effect: "↓ Diuretic efficacy, ↑ AKI risk",
    management: "Use lowest dose NSAID; monitor renal function",
  },
  {
    interaction: "ACEi/ARB + NSAIDs",
    risk: "MODERATE",
    effect: "Triple whammy: AKI risk",
    management: "Avoid NSAIDs if possible; monitor creatinine",
  },
];

export default function HypertensionMedicationGuide() {
  const [expandedClass, setExpandedClass] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"classes" | "dosing" | "algorithm" | "interactions">("classes");
  const [drugSearch, setDrugSearch] = useState("");

  return (
    <div className="space-y-6">
      {/* HTN Rx Image — always visible at top */}
      <Card className="clinical-card overflow-hidden">
        <CardContent className="p-0">
          <div className="p-3">
            <ImageLink imageId="htn-rx" label="View HTN Medication Guide →" />
          </div>
        </CardContent>
      </Card>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2">
        {[
          { id: "classes", label: "Drug Classes", icon: Stethoscope },
          { id: "dosing", label: "Dosing Guide", icon: Stethoscope },
          { id: "algorithm", label: "By Comorbidity", icon: Heart },
          { id: "interactions", label: "Drug Interactions", icon: AlertTriangle },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "classes" && (
        <div className="space-y-4">
          <Card className="clinical-card">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Stethoscope className="h-4 w-4 text-primary" />
                </div>
                <CardTitle className="text-base">Antihypertensive Drug Classes</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {medicationClasses.map((medClass) => (
                  <div
                    key={medClass.class}
                    className={`border-2 rounded-lg overflow-hidden ${medClass.color} ${
                      expandedClass === medClass.class ? "border-opacity-100" : "border-opacity-50"
                    }`}
                  >
                    <button
                      onClick={() =>
                        setExpandedClass(
                          expandedClass === medClass.class ? null : medClass.class
                        )
                      }
                      className="w-full p-4 text-left flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-semibold">{medClass.class}</span>
                        {medClass.firstLine && (
                          <Badge className="bg-success/20 text-success border-success/30">
                            First-Line
                          </Badge>
                        )}
                      </div>
                      {expandedClass === medClass.class ? (
                        <ChevronDown className="h-5 w-5" />
                      ) : (
                        <ChevronRight className="h-5 w-5" />
                      )}
                    </button>

                    {expandedClass === medClass.class && (
                      <div className="px-4 pb-4 space-y-3 border-t border-inherit pt-3">
                        <div>
                          <span className="text-xs font-medium text-muted-foreground">Examples:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {medClass.examples.map((ex, i) => (
                              <Badge key={i} variant="outline" className="text-xs">
                                {ex}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        <div>
                          <span className="text-xs font-medium text-muted-foreground">Mechanism:</span>
                          <p className="text-sm mt-0.5">{medClass.mechanism}</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <span className="text-xs font-medium text-success">✓ Indications:</span>
                            <ul className="text-xs mt-1 space-y-0.5">
                              {medClass.indications.map((ind, i) => (
                                <li key={i}>• {ind}</li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <span className="text-xs font-medium text-destructive">✗ Contraindications:</span>
                            <ul className="text-xs mt-1 space-y-0.5">
                              {medClass.contraindications.map((con, i) => (
                                <li key={i}>• {con}</li>
                              ))}
                            </ul>
                          </div>
                        </div>

                        <div>
                          <span className="text-xs font-medium text-warning">⚠ Side Effects:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {medClass.sideEffects.map((se, i) => (
                              <Badge key={i} variant="outline" className="text-xs bg-warning/10">
                                {se}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        <div>
                          <span className="text-xs font-medium text-primary">📋 Monitoring:</span>
                          <ul className="text-xs mt-1 space-y-0.5">
                            {medClass.monitoring.map((mon, i) => (
                              <li key={i}>• {mon}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "dosing" && (
        <Card className="clinical-card">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Stethoscope className="h-4 w-4 text-primary" />
              </div>
              <CardTitle className="text-base">Antihypertensive Dosing Guide</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {/* Search */}
            <div className="relative mb-4">
              <input
                type="text"
                placeholder="Search by drug name, brand, or class..."
                value={drugSearch}
                onChange={(e) => setDrugSearch(e.target.value)}
                className="w-full h-10 pl-3 pr-3 rounded-lg border border-input bg-background text-sm"
              />
            </div>

            <div className="space-y-2">
              {(drugSearch
                ? drugDoseDetails.filter(d =>
                    d.name.toLowerCase().includes(drugSearch.toLowerCase()) ||
                    d.brand.toLowerCase().includes(drugSearch.toLowerCase()) ||
                    d.drugClass.toLowerCase().includes(drugSearch.toLowerCase())
                  )
                : drugDoseDetails
              ).map((drug, i) => (
                <div
                  key={i}
                  className="p-3 rounded-lg border border-border/50 hover:border-primary/30 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div>
                      <span className="font-semibold text-sm">{drug.name}</span>
                      <span className="text-xs text-muted-foreground ml-2">({drug.brand})</span>
                    </div>
                    <div className="flex flex-wrap gap-1 items-center">
                      <FrequencyBadge frequency={extractCardFreq(drug.doseRange)} className="text-[10px]" />
                      <span className="text-xs font-mono bg-muted px-2 py-0.5 rounded">{drug.doseRange}</span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{drug.pearls}</p>
                  {drug.caution && (
                    <p className="text-xs text-warning mt-1 flex items-start gap-1">
                      <span>⚠</span> <span>{drug.caution}</span>
                    </p>
                  )}
                </div>
              ))}
              {(drugSearch && drugDoseDetails.filter(d => 
                d.name.toLowerCase().includes(drugSearch.toLowerCase()) ||
                d.brand.toLowerCase().includes(drugSearch.toLowerCase()) ||
                d.drugClass.toLowerCase().includes(drugSearch.toLowerCase())
              ).length === 0) && (
                <p className="text-sm text-muted-foreground text-center py-8">No drugs found matching "{drugSearch}"</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === "algorithm" && (
        <Card className="clinical-card">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center">
                <Heart className="h-4 w-4 text-success" />
              </div>
              <CardTitle className="text-base">Treatment Selection by Comorbidity</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {treatmentAlgorithm.map((item, index) => (
                <div
                  key={index}
                  className="p-4 rounded-lg border border-border hover:border-primary/50 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold">{item.condition}</h3>
                    <Badge variant="outline">Target: {item.targetBP}</Badge>
                  </div>

                  <div className="mb-3">
                    <span className="text-xs text-success font-medium">First-Line:</span>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {item.firstLine.map((drug, i) => (
                        <Badge key={i} className="bg-success/10 text-success border-success/30">
                          {drug}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {item.avoid && (
                    <div className="mb-2">
                      <span className="text-xs text-destructive font-medium">Avoid:</span>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {item.avoid.map((drug, i) => (
                          <Badge key={i} variant="destructive" className="text-xs">
                            {drug}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <p className="text-xs text-muted-foreground">
                    <span className="font-medium">Evidence: </span>{item.rationale}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === "interactions" && (
        <Card className="clinical-card">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-destructive/10 flex items-center justify-center">
                <AlertTriangle className="h-4 w-4 text-destructive" />
              </div>
              <CardTitle className="text-base">Important Drug Interactions</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {drugInteractions.map((interaction, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg border ${
                    interaction.risk === "HIGH"
                      ? "border-destructive bg-destructive/5"
                      : "border-warning bg-warning/5"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-sm">{interaction.interaction}</span>
                    <Badge
                      variant={interaction.risk === "HIGH" ? "destructive" : "default"}
                      className="text-xs"
                    >
                      {interaction.risk} RISK
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground mb-1">
                    Effect: {interaction.effect}
                  </div>
                  <div className="text-xs">
                    <span className="font-medium">Management: </span>
                    {interaction.management}
                  </div>
                </div>
              ))}
            </div>          </CardContent>
        </Card>
      )}
    </div>
  );
}
