/** Global search (cmd+K) for jumping to any calculator */
import { useEffect, useState, useMemo, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, Calculator, FileText, X, ArrowRight } from "lucide-react";
import { useLocalStorage } from "@/hooks/useLocalStorage";

interface SearchItem {
  id: string;
  label: string;
  category: "calculator" | "guideline" | "page";
  path: string;
  keywords?: string[];
}

// All searchable routes
const SEARCH_ITEMS: SearchItem[] = [
  // Calculators
  { id: "diabetes", label: "Diabetes Medication Algorithm", category: "calculator", path: "/diabetes", keywords: ["glucose", "a1c", "metformin", "GLP1", "diabetes"] },
  { id: "hypo-risk", label: "Hypoglycemia Risk Score", category: "calculator", path: "/diabetes/hypo-risk", keywords: ["hypoglycemia", "low blood sugar"] },
  { id: "insulin-titration", label: "Insulin Titration", category: "calculator", path: "/diabetes/insulin-titration", keywords: ["insulin", "insulin dosing"] },
  { id: "sliding-scale", label: "Sliding Scale Insulin", category: "calculator", path: "/diabetes/sliding-scale", keywords: ["sliding scale", "insulin scale"] },
  { id: "renal-dosing", label: "Renal Dose Adjustment", category: "calculator", path: "/diabetes/renal-dosing", keywords: ["creatinine", "renal", "kidney dose", "gfr dosing"] },
  { id: "htn", label: "Hypertension Treatment Algorithm", category: "calculator", path: "/hypertension", keywords: ["blood pressure", "bp", "hypertension"] },
  { id: "secondary-htn", label: "Secondary Hypertension Evaluation", category: "calculator", path: "/hypertension/secondary-htn", keywords: ["secondary hypertension", "reninoma", "aldosteronism", "pheochromocytoma", "cushing", "sleep apnea", "renal artery stenosis", "secondary cause"] },
  { id: "reninoma", label: "Reninoma Workup (JG Cell Tumor)", category: "calculator", path: "/hypertension/secondary-htn", keywords: ["reninoma", "juxtaglomerular", "renin", "renal vein sampling", "wolley", "high renin", "JG cell"] },
  { id: "gfr", label: "GFR Calculator (CKD-EPI)", category: "calculator", path: "/hypertension/gfr", keywords: ["kidney", "creatinine", "gfr", "egfr"] },
  { id: "drug-interactions", label: "Drug Interactions", category: "calculator", path: "/hypertension/drug-interactions", keywords: ["interaction", "drug interaction", "ddi"] },
  { id: "lipid-panel", label: "Lipid Panel Analysis", category: "calculator", path: "/lipids", keywords: ["cholesterol", "ldl", "hdl", "lipids"] },
  { id: "primary-aldosteronism", label: "Primary Aldosteronism Workup", category: "calculator", path: "/hypertension/secondary-htn", keywords: ["aldosteronism", "conn", "arr", "aldosterone", "renin ratio", "hypokalemia", "adrenal"] },
  { id: "pheochromocytoma", label: "Pheochromocytoma Workup", category: "calculator", path: "/hypertension/secondary-htn", keywords: ["pheochromocytoma", "metanephrines", "adrenal tumor", "catecholamine", "paraganglioma"] },
  { id: "cushings", label: "Cushing's Syndrome Workup", category: "calculator", path: "/hypertension/secondary-htn", keywords: ["cushing", "cortisol", "dexamethasone", "adrenal", "pituitary"] },
  { id: "macs", label: "MACS (Mild Autonomous Cortisol Secretion)", category: "page", path: "/hypertension/secondary-htn", keywords: ["macs", "mild autonomous cortisol secretion", "subclinical cushing", "subclinical hypercortisolism", "dst", "cortisol"] },
  { id: "glossary", label: "Clinical Glossary", category: "page", path: "/glossary", keywords: ["glossary", "definitions", "synonyms", "acronyms", "macs", "dst"] },
  { id: "sleep-apnea", label: "Sleep Apnea Screening", category: "calculator", path: "/hypertension/secondary-htn", keywords: ["sleep apnea", "osa", "polysomnography", "cpap", "snoring"] },
  { id: "ascvd", label: "ASCVD Risk Calculator", category: "calculator", path: "/lipids/ascvd-risk", keywords: ["cardiovascular", "heart risk", "heart score", "ascvd"] },
  { id: "obesity-bmi", label: "BMI Calculator", category: "calculator", path: "/obesity/bmi-calculator", keywords: ["weight", "bmi", "body mass index"] },
  { id: "waist-height", label: "Waist-to-Height Ratio", category: "calculator", path: "/obesity/waist-height-ratio", keywords: ["waist", "waist height", "waist ratio"] },
  { id: "glp1-assessment", label: "GLP-1 Assessment Calculator", category: "calculator", path: "/obesity/glp1-assessment", keywords: ["glp1", "semaglutide", "tirzepatide", "liraglutide", "eligibility", "titration"] },
  { id: "glp1-screener", label: "GLP-1 RA 3-Step Easy Screener", category: "calculator", path: "/obesity/glp1-screener", keywords: ["glp1", "screener", "triage", "pre-initiation", "eligibility", "safety", "start plan"] },
  { id: "glp1", label: "GLP-1 Agonist Selection", category: "calculator", path: "/obesity/glp1-obesity", keywords: ["wegovy", "ozempic", "glp1", "semaglutide"] },
  { id: "copd", label: "COPD/GOLD Assessment", category: "calculator", path: "/respiratory/copd", keywords: ["asthma", "gold", "copd", "lung function"] },
  { id: "anemia", label: "Anemia Workup", category: "calculator", path: "/anemia", keywords: ["hemoglobin", "anemia", "mcv", "iron deficiency"] },
  { id: "thyroid", label: "Thyroid Calculator", category: "calculator", path: "/thyroid", keywords: ["tsh", "thyroid", "t4", "t3"] },
  { id: "iron", label: "Iron Replacement Calculator", category: "calculator", path: "/iron-calculator", keywords: ["ferritin", "iron", "tsat", "iron deficiency"] },
  // Guidelines (placeholder - could expand)
  { id: "ada-guidelines", label: "ADA Standards of Care 2024", category: "guideline", path: "/about", keywords: ["diabetes", "guideline"] },
  { id: "esc-guidelines", label: "ESC Cardiovascular Guidelines", category: "guideline", path: "/about", keywords: ["hypertension", "lipids"] },
  // Pages
  { id: "home", label: "Homepage", category: "page", path: "/home" },
  { id: "about", label: "About / Help", category: "page", path: "/about" },
];

export default function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const navigate = useNavigate();

  // Filter results based on query
  const results = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return SEARCH_ITEMS.slice(0, 8);
    return SEARCH_ITEMS.filter(item => 
      item.label.toLowerCase().includes(q) ||
      item.keywords?.some(k => k.includes(q))
    ).slice(0, 8);
  }, [query]);

  // Keyboard shortcut to open
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
      if (e.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Navigate with keyboard
  const handleSelect = useCallback((item: SearchItem) => {
    setIsOpen(false);
    setQuery("");
    navigate(item.path);
  }, [navigate]);

  // Keyboard nav
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex(i => (i + 1) % results.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex(i => (i - 1 + results.length) % results.length);
      } else if (e.key === "Enter" && results[selectedIndex]) {
        e.preventDefault();
        handleSelect(results[selectedIndex]);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, results, selectedIndex, handleSelect]);

  // Reset selection when results change
  useEffect(() => setSelectedIndex(0), [query]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsOpen(false)} />
      
      {/* Modal */}
      <div className="relative w-full max-w-xl mx-4 bg-card rounded-xl border border-border shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
          <Search className="w-5 h-5 text-muted-foreground shrink-0" />
          <input
            type="text"
            placeholder="Search calculators, guidelines..."
            className="flex-1 bg-transparent outline-none text-foreground placeholder:text-muted-foreground"
            value={query}
            onChange={e => setQuery(e.target.value)}
            autoFocus
          />
          <span className="text-xs text-muted-foreground shrink-0 hidden sm:inline">Esc</span>
          <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-muted rounded">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results */}
        <div className="max-h-[60vh] overflow-y-auto py-2">
          {results.length === 0 ? (
            <div className="px-4 py-8 text-center text-muted-foreground">
              No results found
            </div>
          ) : (
            <ul className="space-y-1 px-2">
              {results.map((item, i) => (
                <li key={item.id}>
                  <Link
                    to={item.path}
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                      i === selectedIndex ? "bg-primary/10 text-primary" : "hover:bg-muted text-foreground"
                    }`}
                  >
                    {item.category === "calculator" ? (
                      <Calculator className="w-4 h-4 text-muted-foreground shrink-0" />
                    ) : item.category === "guideline" ? (
                      <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                    ) : (
                      <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
                    )}
                    <span className="flex-1 truncate">{item.label}</span>
                    <span className="text-xs text-muted-foreground capitalize shrink-0">
                      {item.category}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer hint */}
        <div className="px-4 py-2 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
          <span><kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">↑↓</kbd> navigate</span>
          <span><kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">↵</kbd> select</span>
        </div>
      </div>
    </div>
  );
}

/** Hook to track recently used calculators */
export function useRecentPages(maxItems = 5) {
  const [recent, setRecent] = useLocalStorage<string[]>("ncd_recent_pages", []);
  const addRecent = (path: string) => {
    setRecent(prev => {
      const filtered = prev.filter(p => p !== path);
      return [path, ...filtered].slice(0, maxItems);
    });
  };
  return { recent, addRecent };
}

/** Hook to track favorite calculators */
export function useFavorites() {
  const [favorites, setFavorites] = useLocalStorage<string[]>("ncd_favorite_pages", []);
  const toggle = (path: string) => {
    setFavorites(prev => 
      prev.includes(path) 
        ? prev.filter(p => p !== path)
        : [...prev, path]
    );
  };
  return { favorites, toggle };
}