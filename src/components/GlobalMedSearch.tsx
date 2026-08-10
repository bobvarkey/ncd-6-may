import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Pill, X, FileText } from "lucide-react";
import { RENAL_DATA } from "@/calculators/diabetes/RenalDosing";
import { ANTIBIOTICS_DATA } from "@/calculators/diabetes/antibiotics-data";
import { ANTICOAGULANTS_DATA } from "@/calculators/diabetes/anticoagulants-data";
import { ADDITIONAL_MEDS_DATA } from "@/calculators/diabetes/additional-meds-data";
import { drugDoseDetails as HTN_MEDS } from "@/pages/hypertension/HypertensionMedicationGuide";

// Normalize HTN meds into the same shape used by the search (drug/drugClass/normalDose).
const HTN_MEDS_NORMALIZED = HTN_MEDS.map((m) => ({
  drug: m.name,
  drugClass: m.drugClass,
  normalDose: m.doseRange,
  hepatic: m.pearls,
  brand: m.brand,
  _target: "htn" as const,
}));

const ALL_MEDS = [
  ...RENAL_DATA,
  ...ANTIBIOTICS_DATA,
  ...ANTICOAGULANTS_DATA,
  ...ADDITIONAL_MEDS_DATA,
  ...HTN_MEDS_NORMALIZED,
].filter((m, index, self) => 
  m.drug && index === self.findIndex((t) => t.drug.toLowerCase() === m.drug.toLowerCase())
);


// Every page and topic in the app — searchable by label or keyword
const CLINICAL_TOPICS = [
  // ── Home ──
  { id: "home", label: "Home", path: "/home", keywords: ["home", "dashboard", "landing"] },

  // ── Diabetes ──
  { id: "diabetes", label: "Diabetes Overview", path: "/diabetes", keywords: ["diabetes", "glucose", "a1c", "metformin", "type 2", "t2dm"] },
  { id: "diabetes-assessment", label: "Diabetes Assessment", path: "/diabetes/assessment", keywords: ["diabetes assessment", "diabetes evaluation", "screening"] },
  { id: "diabetes-overview", label: "Diabetes Overview (Detailed)", path: "/diabetes/overview", keywords: ["diabetes overview", "diabetes summary"] },
  { id: "diabetes-tab", label: "Diabetes Tab View", path: "/diabetes/tab", keywords: ["diabetes tab", "diabetes sections"] },
  { id: "diabetes-treatment", label: "Diabetes Treatment", path: "/diabetes/treatment", keywords: ["diabetes treatment", "antidiabetic", "insulin", "oral hypoglycemic"] },
  { id: "insulin-guide", label: "Insulin Guide", path: "/diabetes/insulin-guide", keywords: ["insulin guide", "insulin types", "insulin dosing", "basal bolus"] },
  { id: "diabetes-medication-algorithm", label: "Diabetes Medication Algorithm", path: "/diabetes/medication-algorithm", keywords: ["diabetes algorithm", "medication algorithm", "step therapy"] },
  { id: "type1-dm", label: "Type 1 Diabetes", path: "/diabetes/type1", keywords: ["type 1 diabetes", "t1dm", "insulin dependent", "autoimmune diabetes"] },
  { id: "type2-dm", label: "Type 2 Diabetes", path: "/diabetes", keywords: ["type 2 diabetes", "t2dm", "insulin resistance", "metformin"] },
  { id: "gestational-diabetes", label: "Gestational Diabetes", path: "/diabetes", keywords: ["gestational diabetes", "gdm", "pregnancy diabetes"] },
  { id: "dka", label: "DKA (Diabetic Ketoacidosis)", path: "/diabetes", keywords: ["dka", "diabetic ketoacidosis", "ketoacidosis", "diabetes emergency"] },
  { id: "hhs", label: "HHS (Hyperosmolar Hyperglycemic State)", path: "/diabetes", keywords: ["hhs", "hyperosmolar", "hyperglycemic coma", "non-ketotic"] },
  { id: "prediabetes", label: "Prediabetes Algorithm", path: "/db/prediabetes", keywords: ["prediabetes", "impaired glucose", "igr", "ifg"] },
  { id: "daily-management", label: "Daily Diabetes Management", path: "/db/daily-management", keywords: ["daily management", "self monitoring", "sick day rules"] },
  { id: "type1-management", label: "Type 1 DM Management", path: "/db/type1-management", keywords: ["type 1 management", "t1dm management", "insulin pump"] },
  { id: "insulin-therapy", label: "Insulin Therapy Guide", path: "/db/insulin-therapy", keywords: ["insulin therapy", "insulin initiation", "insulin adjustment"] },
  { id: "type1-pitfalls", label: "Type 1 Pitfalls", path: "/db/type1-pitfalls", keywords: ["type 1 pitfalls", "t1dm pitfalls", "hypoglycemia unawareness"] },
  { id: "type2-transition", label: "Type 2 to Insulin Transition", path: "/db/type2-transition", keywords: ["type 2 transition", "insulin initiation", "oral to insulin"] },
  { id: "feedback-tips", label: "Diabetes Feedback & Tips", path: "/db/feedback", keywords: ["diabetes tips", "feedback", "patient education"] },
  { id: "type1-treatment-algorithm", label: "Type 1 Treatment Algorithm", path: "/type1-treatment-algorithm", keywords: ["type 1 algorithm", "t1dm algorithm", "insulin algorithm"] },
  { id: "type2-treatment-algorithm", label: "Type 2 Treatment Algorithm", path: "/type2-treatment-algorithm", keywords: ["type 2 algorithm", "t2dm algorithm", "treatment algorithm"] },
  { id: "hyperglycemic-emergency", label: "Hyperglycemic Emergency", path: "/hyperglycemic-emergency", keywords: ["hyperglycemic emergency", "dka", "hhs", "hyperglycemia"] },

  // ── Diabetes Calculators ──
  { id: "insulin-titration", label: "Insulin Titration Calculator", path: "/insulin-titration", keywords: ["insulin titration", "insulin dosing", "basal insulin"] },
  { id: "sliding-scale", label: "Sliding Scale Insulin", path: "/sliding-scale", keywords: ["sliding scale", "insulin scale", "correction insulin"] },
  { id: "hypo-risk", label: "Hypoglycemia Risk Score", path: "/hypo-risk", keywords: ["hypoglycemia", "low blood sugar", "hypo risk"] },
  { id: "renal-dosing", label: "Renal Dose Adjustment", path: "/renal-dosing", keywords: ["renal dosing", "creatinine", "kidney dose", "gfr dosing"] },
  { id: "glp1-administration", label: "GLP-1 Administration Guide", path: "/db/glp1-administration", keywords: ["glp1", "semaglutide", "ozempic", "wegovy", "injection"] },

  // ── Hypertension ──
  { id: "hypertension", label: "Hypertension Overview", path: "/hypertension", keywords: ["hypertension", "blood pressure", "bp", "antihypertensive"] },
  { id: "htn-assessment", label: "Hypertension Assessment", path: "/hypertension/assessment", keywords: ["hypertension assessment", "bp assessment", "cardiovascular risk"] },
  { id: "htn-overview", label: "Hypertension Overview (Detailed)", path: "/hypertension/overview", keywords: ["hypertension overview", "bp overview"] },
  { id: "htn-tab", label: "Hypertension Tab View", path: "/hypertension/tab", keywords: ["hypertension tab", "htn sections"] },
  { id: "htn-treatment", label: "Hypertension Treatment", path: "/hypertension/treatment", keywords: ["hypertension treatment", "antihypertensive", "bp medication"] },
  { id: "htn-medication-guide", label: "Hypertension Medication Guide", path: "/hypertension/medication-guide", keywords: ["htn medication", "antihypertensive guide", "bp drugs", "cilnidipine", "cilacar", "ccb", "calcium channel blocker", "eplerenone", "inspra", "spironolactone", "aldactone", "mra", "finerenone", "kerendia"] },
  { id: "htn-clinical-cards", label: "Hypertension Clinical Cards", path: "/hypertension/clinical-cards", keywords: ["htn clinical cards", "hypertension cards", "clinical pearls"] },
  { id: "htn-treatment-algorithm", label: "Antihypertensive Treatment Algorithm", path: "/htn/treatment-algorithm", keywords: ["antihypertensive algorithm", "htn algorithm", "step therapy"] },
  { id: "htn-potency-table", label: "Antihypertensive Potency Table", path: "/htn/potency-table", keywords: ["potency table", "antihypertensive potency", "bp drug comparison"] },
  { id: "reninoma", label: "Reninoma (JG Cell Tumor)", path: "/hypertension/secondary-htn", keywords: ["reninoma", "juxtaglomerular", "renal vein renin", "high renin hypertension", "secondary hypertension"] },
  { id: "primary-aldosteronism", label: "Primary Aldosteronism", path: "/hypertension/secondary-htn", keywords: ["aldosteronism", "conn syndrome", "arr", "aldosterone renin ratio", "hypokalemia", "adrenal"] },
  { id: "pheochromocytoma", label: "Pheochromocytoma", path: "/hypertension/secondary-htn", keywords: ["pheochromocytoma", "metanephrines", "catecholamine", "adrenal tumor"] },
  { id: "cushings", label: "Cushing's Syndrome", path: "/hypertension/secondary-htn", keywords: ["cushing", "cortisol", "dexamethasone suppression", "acth", "pituitary adrenal"] },
  { id: "sleep-apnea", label: "Sleep Apnea Screening", path: "/hypertension/secondary-htn", keywords: ["sleep apnea", "osa", "polysomnography", "cpap", "snoring"] },
  { id: "renal-artery-stenosis", label: "Renal Artery Stenosis", path: "/hypertension/secondary-htn", keywords: ["renal artery stenosis", "ras", "fibromuscular dysplasia", "atherosclerotic"] },
  { id: "secondary-htn", label: "Secondary Hypertension", path: "/hypertension/secondary-htn", keywords: ["secondary hypertension", "secondary cause", "endocrine hypertension"] },

  // ── Lipids ──
  { id: "lipids", label: "Lipids Overview", path: "/lipids", keywords: ["lipids", "cholesterol", "ldl", "hdl", "triglycerides"] },
  { id: "lipids-assessment", label: "Lipids Assessment", path: "/lipids/assessment", keywords: ["lipids assessment", "lipid evaluation", "cholesterol screening"] },
  { id: "lipids-overview", label: "Lipids Overview (Detailed)", path: "/lipids/overview", keywords: ["lipids overview", "lipid summary"] },
  { id: "lipids-tab", label: "Lipids Tab View", path: "/lipids/tab", keywords: ["lipids tab", "lipid sections"] },
  { id: "lipids-treatment", label: "Lipids Treatment", path: "/lipids/treatment", keywords: ["lipids treatment", "statin", "ezetimibe", "pcsk9", "lipid lowering"] },
  { id: "statins", label: "Statin Therapy", path: "/lipids", keywords: ["statins", "atorvastatin", "rosuvastatin", "simvastatin", "cholesterol"] },
  { id: "familial-hypercholesterolemia", label: "Familial Hypercholesterolemia", path: "/lipids", keywords: ["familial hypercholesterolemia", "fh", "ldl", "atherosclerosis"] },
  { id: "lipid-panel", label: "Lipid Panel Analysis", path: "/lipid-panel", keywords: ["lipid panel", "lipid profile", "cholesterol panel"] },
  { id: "ascvd-risk", label: "ASCVD Risk Calculator", path: "/ascvd-risk", keywords: ["ascvd", "cardiovascular risk", "heart risk", "pooled cohort"] },
  { id: "lipid-risk-mini", label: "Lipid Risk Mini", path: "/lipid-risk-mini", keywords: ["lipid risk", "cholesterol risk", "quick risk"] },

  // ── Liver ──
  { id: "liver", label: "Liver Overview", path: "/liver", keywords: ["liver", "hepatic", "lft", "liver enzymes", "alt", "ast"] },

  // ── Anemia / Blood ──
  { id: "anemia", label: "Anemia Workup", path: "/anemia", keywords: ["anemia", "hemoglobin", "mcv", "anemia evaluation"] },
  { id: "iron-deficiency-anemia", label: "Iron Deficiency Anemia", path: "/anemia", keywords: ["iron deficiency", "microcytic anemia", "ferritin", "tsat", "iron studies"] },
  { id: "b12-deficiency", label: "Vitamin B12 Deficiency", path: "/anemia", keywords: ["b12 deficiency", "cobalamin", "megaloblastic", "pernicious anemia"] },
  { id: "folate-deficiency", label: "Folate Deficiency", path: "/anemia", keywords: ["folate deficiency", "folic acid", "megaloblastic anemia"] },
  { id: "anemia-chronic-disease", label: "Anemia of Chronic Disease", path: "/anemia", keywords: ["anemia chronic disease", "anemia inflammation", "normocytic anemia"] },
  { id: "thrombocytopenia", label: "Thrombocytopenia", path: "/anemia?tab=thrombocytopenia", keywords: ["thrombocytopenia", "low platelets", "itp", "platelet"] },
  { id: "bleeding-clotting", label: "Bleeding / Clotting Disorders", path: "/anemia?tab=bleeding-clotting", keywords: ["bleeding", "clotting", "coagulation", "hemophilia", "dvt"] },
  { id: "iron-parameters", label: "Iron Parameters", path: "/anemia?tab=iron", keywords: ["iron", "ferritin", "transferrin", "tsat", "iron studies"] },
  { id: "esr", label: "ESR (Erythrocyte Sedimentation Rate)", path: "/anemia?tab=esr", keywords: ["esr", "sed rate", "inflammation marker"] },
  { id: "iron-replacement", label: "Iron Replacement Calculator", path: "/iron-calculator", keywords: ["iron replacement", "iron dosing", "iron infusion", "ferric"] },

  // ── Thyroid ──
  { id: "thyroid", label: "Thyroid Calculator", path: "/thyroid", keywords: ["thyroid", "tsh", "t4", "t3", "thyroid function"] },
  { id: "hypothyroidism", label: "Hypothyroidism", path: "/thyroid", keywords: ["hypothyroidism", "low t4", "high tsh", "thyroid deficiency"] },
  { id: "hyperthyroidism", label: "Hyperthyroidism", path: "/thyroid", keywords: ["hyperthyroidism", "thyrotoxicosis", "high t4", "low tsh", "graves"] },
  { id: "thyroid-nodules", label: "Thyroid Nodules", path: "/thyroid", keywords: ["thyroid nodule", "fna", "thyroid ultrasound", "tirads"] },

  // ── Obesity ──
  { id: "obesity", label: "Obesity Management", path: "/obesity/bmi-calculator", keywords: ["obesity", "bmi", "weight loss", "overweight"] },
  { id: "bmi-calculator", label: "BMI Calculator", path: "/obesity/bmi-calculator", keywords: ["bmi", "body mass index", "weight"] },
  { id: "waist-height-ratio", label: "Waist-to-Height Ratio", path: "/obesity/waist-height-ratio", keywords: ["waist", "waist height", "waist ratio", "central obesity"] },
  { id: "glp1-agonists", label: "GLP-1 Agonists (Obesity)", path: "/obesity/glp1-algorithm", keywords: ["glp1", "semaglutide", "tirzepatide", "wegovy", "ozempic", "weight loss"] },
  { id: "glp1-assessment", label: "GLP-1 Assessment Calculator", path: "/obesity/glp1-assessment", keywords: ["glp1", "assessment", "eligibility", "titration", "semaglutide", "tirzepatide", "liraglutide", "india"] },

  // ── Renal ──
  { id: "gfr-calculator", label: "GFR Calculator (CKD-EPI)", path: "/gfr-calculator", keywords: ["gfr", "egfr", "ckd-epi", "creatinine", "kidney function"] },
  { id: "ckd", label: "CKD (Chronic Kidney Disease)", path: "/gfr-calculator", keywords: ["ckd", "chronic kidney disease", "renal failure", "esrd"] },
  { id: "aki", label: "AKI (Acute Kidney Injury)", path: "/gfr-calculator", keywords: ["aki", "acute kidney injury", "renal failure", "creatinine rise"] },
  { id: "ckd-guideline", label: "CKD Guideline", path: "/db/ckd-guideline", keywords: ["ckd guideline", "kidney guideline", "kdigo"] },

  // ── Drug Interactions ──
  { id: "drug-interactions", label: "Drug Interaction Checker", path: "/drug-interactions", keywords: ["drug interaction", "ddi", "interaction checker", "drug compatibility"] },

  // ── Respiratory ──
  { id: "respiratory", label: "Respiratory / COPD", path: "/respiratory", keywords: ["respiratory", "copd", "asthma", "lung", "pulmonary"] },
  { id: "copd", label: "COPD / GOLD Assessment", path: "/respiratory", keywords: ["copd", "gold", "emphysema", "chronic bronchitis", "lung function"] },

  // ── Fatigue ──
  { id: "fatigue", label: "Fatigue Evaluation", path: "/fatigue", keywords: ["fatigue", "tiredness", "chronic fatigue", "exhaustion"] },

  // ── Vitamin D ──
  { id: "vitamin-d", label: "Vitamin D", path: "/vitamin-d", keywords: ["vitamin d", "vitamin d deficiency", "25-oh", "calcitriol"] },

  // ── PCOS ──
  { id: "pmos", label: "PMOS (Polyendocrine Metabolic Ovarian Syndrome)", path: "/women-health?tab=pmos", keywords: ["pmos", "pcos", "polycystic ovary", "polyendocrine metabolic ovarian", "anovulation", "hirsutism", "metformin"] },

  // ── Women's Health ──
  { id: "women-health", label: "Women's Health", path: "/women-health", keywords: ["women health", "women's health", "pmos", "hrt"] },
  { id: "pmos", label: "PMOS / PCOS (Women's Health)", path: "/women-health?tab=pmos", keywords: ["pmos", "pcos women", "menstrual disorder"] },
  { id: "hrt", label: "HRT Algorithm (Hormone Replacement)", path: "/women-health?tab=hrt", keywords: ["hrt", "hormone replacement", "menopause", "estrogen"] },

  // ── Infections ──
  { id: "infections", label: "Infections Overview", path: "/infections", keywords: ["infections", "infection", "uti", "pneumonia", "cellulitis"] },

  // ── Acute Diarrhoea ──
  { id: "acute-diarrhoea", label: "Diarrhoea and Constipation", path: "/acute-diarrhoea", keywords: ["acute diarrhoea", "diarrhea", "gastroenteritis", "stool", "dehydration", "constipation", "laxative", "lactulose", "psyllium", "bisacodyl", "senna", "PEG", "enema"] },

  // ── Food Poisoning ──
  { id: "food-poisoning", label: "Food Poisoning", path: "/food-poisoning", keywords: ["food poisoning", "foodborne", "salmonella", "e coli", "botulism"] },

  // ── PEP ──
  { id: "pep", label: "PEP (Post-Exposure Prophylaxis)", path: "/pep", keywords: ["pep", "post exposure prophylaxis", "hiv pep", "rabies pep", "needlestick"] },

  // ── Adult Vaccinations ──
  { id: "adult-vaccinations", label: "Adult Vaccinations", path: "/adult-vaccinations", keywords: ["vaccination", "vaccine", "immunization", "adult vaccine", "flu", "pneumococcal"] },

  // ── Electrolytes ──
  { id: "electrolytes", label: "Electrolyte Disturbances", path: "/electrolytes", keywords: ["electrolyte", "electrolyte disturbance", "sodium", "potassium", "calcium"] },
  { id: "hyponatremia", label: "Hyponatremia", path: "/hyponatremia", keywords: ["hyponatremia", "low sodium", "sodium", "hypotonic", "siadh"] },
  { id: "hypernatremia", label: "Hypernatremia", path: "/hypernatremia", keywords: ["hypernatremia", "high sodium", "sodium", "hypertonic", "diabetes insipidus"] },
  { id: "hyperkalemia", label: "Hyperkalemia", path: "/hyperkalemia", keywords: ["hyperkalemia", "high potassium", "potassium", "ecg changes"] },
  { id: "hypokalemia", label: "Hypokalemia", path: "/hypokalemia", keywords: ["hypokalemia", "low potassium", "potassium"] },
  { id: "hypocalcemia", label: "Hypocalcemia", path: "/hypocalcemia", keywords: ["hypocalcemia", "low calcium", "calcium", "tetany", "chvostek"] },
  { id: "hypercalcemia", label: "Hypercalcemia", path: "/hypercalcemia", keywords: ["hypercalcemia", "high calcium", "calcium", "parathyroid"] },
  { id: "hypomagnesemia", label: "Hypomagnesemia", path: "/hypomagnesemia", keywords: ["hypomagnesemia", "low magnesium", "magnesium"] },
  { id: "hypermagnesemia", label: "Hypermagnesemia", path: "/hypermagnesemia", keywords: ["hypermagnesemia", "high magnesium", "magnesium"] },
  { id: "hypophosphatemia", label: "Hypophosphatemia", path: "/hypophosphatemia", keywords: ["hypophosphatemia", "low phosphate", "phosphate", "phosphorus"] },
  { id: "hyperphosphatemia", label: "Hyperphosphatemia", path: "/hyperphosphatemia", keywords: ["hyperphosphatemia", "high phosphate", "phosphate", "phosphorus"] },

  // ── Diet Plan ──
  { id: "diet-plan", label: "Diet Plan", path: "/diet-plan", keywords: ["diet plan", "meal plan", "nutrition", "dietary"] },

  // ── Legal / Compliance ──
  { id: "privacy", label: "Privacy Policy", path: "/privacy", keywords: ["privacy", "privacy policy", "data protection"] },
  { id: "terms", label: "Terms of Service", path: "/terms", keywords: ["terms", "terms of service", "legal"] },
  { id: "disclaimer", label: "Medical Disclaimer", path: "/disclaimer", keywords: ["disclaimer", "medical disclaimer", "legal"] },
  { id: "delete-account", label: "Delete Account & Data", path: "/delete-account", keywords: ["delete", "account", "erase", "wipe", "remove data", "clear data", "reset app", "privacy"] },
];

export function GlobalMedSearch() {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const wrapRef = useRef<HTMLDivElement>(null);

  const results = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return [];

    // Search both medications and clinical topics
    const medResults = ALL_MEDS
      .filter(
        (m) =>
          m.drug.toLowerCase().includes(term) ||
          m.drugClass.toLowerCase().includes(term) ||
          ("brand" in m && typeof m.brand === "string" && m.brand.toLowerCase().includes(term))
      )
      .slice(0, 8)
      .map(m => ({ type: 'medication' as const, ...m }));

    const topicResults = CLINICAL_TOPICS
      .filter(
        (t) =>
          t.label.toLowerCase().includes(term) ||
          t.keywords?.some(k => k.includes(term))
      )
      .slice(0, 5)
      .map(t => ({ type: 'topic' as const, ...t }));

    // Interleave results: medications first, then topics
    return [...medResults, ...topicResults].slice(0, 8);
  }, [q]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen(true);
        wrapRef.current?.querySelector("input")?.focus();
      }
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  function goToDrug(drugName: string, target?: "htn") {
    // Log search query for analytics and debugging
    console.log(`[Search Analytics] Term: "${drugName}", Target: ${target || 'default'}`);
    
    setOpen(false);
    setQ("");
    
    if (target === "htn") {
      navigate(`/hypertension/medication-guide?q=${encodeURIComponent(drugName)}`);
      return;
    }

    // Use term-based search to find the drug entry
    const term = drugName.toLowerCase();
    const drug = ALL_MEDS.find((m) => 
      m.drug.toLowerCase() === term || 
      ('brand' in m && typeof m.brand === 'string' && m.brand.toLowerCase().includes(term))
    );
    
    // Type-safe check for _target
    if (drug && '_target' in drug && drug._target === "htn") {
      navigate(`/hypertension/medication-guide?q=${encodeURIComponent(drugName)}`);
      return;
    }

    if (drug) {
      // For any matched drug from other datasets, also default to HTN guide as a safe fallback
      // unless it's explicitly renal or another category we've handled.
      // Currently the user wants "safe redirect to Hypertension Medication Guide"
      navigate(`/hypertension/medication-guide?q=${encodeURIComponent(drugName)}`);
    } else {
      // Fallback for unknown medications to ensure a safe route
      console.warn(`[Search] No exact match for "${drugName}". Redirecting to HTN guide fallback.`);
      navigate(`/hypertension/medication-guide?q=${encodeURIComponent(drugName)}`);
    }
  }

  return (
    <div
      ref={wrapRef}
      className="fixed top-0 left-0 right-0 z-[60] h-12 border-b border-border bg-card/95 backdrop-blur-md shadow-sm relative"
    >
      <div className="flex items-center h-full max-w-7xl mx-auto px-4 gap-3">
        <Search className="h-4 w-4 text-primary shrink-0" />
        <input
          type="text"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Search any topic — reninoma, hypothyroidism, medications…"
          className="flex-1 bg-transparent py-1.5 text-sm placeholder:text-muted-foreground focus:outline-none"
          aria-label="Search medications"
          onKeyDown={(e) => {
            if (e.key === "Enter" && q.trim()) {
              goToDrug(q.trim());
            }
          }}
        />
        {q && (
          <button
            type="button"
            onClick={() => {
              setQ("");
              setOpen(false);
            }}
            className="inline-flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground shrink-0"
            aria-label="Clear search"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
        <kbd className="hidden md:inline-flex items-center gap-0.5 rounded border border-border bg-muted px-1.5 py-0.5 text-xs font-medium text-muted-foreground shrink-0">
          ⌘K
        </kbd>
      </div>

      {open && q.trim() && <>
        <div
          className="fixed inset-0 z-0 backdrop-blur-lg bg-background/50"
          onClick={() => { setOpen(false); setQ(""); }}
        />
        <div className="absolute top-full left-0 right-0 mt-0 max-h-[60vh] overflow-y-auto border-b border-border bg-card/95 backdrop-blur-xl shadow-xl">
          {results.length === 0 ? (
            <div className="p-4 text-sm text-muted-foreground">
              No medications or topics found for "{q}".
            </div>
          ) : (
            <ul className="py-1">
              {results.map((item, idx) => (
                <li key={item.type === 'medication' ? `${item.drug}-${item.drugClass}` : item.id}>
                  {item.type === 'medication' ? (
                    <button
                      type="button"
                      onClick={() => goToDrug(item.drug, '_target' in item ? (item as any)._target : undefined)}
                      className="w-full flex items-start gap-3 px-3 py-2.5 text-left hover:bg-muted/60 transition-colors"
                    >
                      <Pill className="mt-0.5 h-4 w-4 text-primary shrink-0" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline justify-between gap-2">
                          <span className="font-semibold text-sm text-foreground truncate">
                            {item.drug}
                          </span>
                          <span className="text-xs uppercase tracking-wide text-muted-foreground shrink-0">
                            {item.drugClass}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          Normal: {item.normalDose}
                        </div>
                        {item.hepatic && (
                          <div className="text-xs text-accent mt-0.5 line-clamp-1">
                            Hepatic: {item.hepatic}
                          </div>
                        )}
                      </div>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setOpen(false);
                        setQ("");
                        navigate(item.path);
                      }}
                      className="w-full flex items-start gap-3 px-3 py-2.5 text-left hover:bg-muted/60 transition-colors"
                    >
                      <FileText className="mt-0.5 h-4 w-4 text-blue-500 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline justify-between gap-2">
                          <span className="font-semibold text-sm text-foreground truncate">
                            {item.label}
                          </span>
                          <span className="text-xs uppercase tracking-wide text-blue-500 shrink-0">
                            Topic
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          {item.keywords?.slice(0, 3).join(", ")}
                        </div>
                      </div>
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
          <div className="border-t border-border px-3 py-2 text-xs text-muted-foreground">
            <kbd className="rounded bg-muted px-1">↵</kbd> to open • Medications or clinical topics
          </div>
        </div>
      </>}
    </div>
  );
}

export default GlobalMedSearch;
