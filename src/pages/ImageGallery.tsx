import haalandMnemonic from "@/assets/haaland-mnemonic.png.asset.json";
import kdigoAkiAkd from "@/assets/kdigo-2026-aki-akd-guideline.png.asset.json";
import antibioticsSpectrum from "@/assets/antibiotics-spectrum.jpeg.asset.json";
import acuteDiarrhoeaClassification from "@/assets/acute-diarrhoea-classification.jpg.asset.json";
import vitaminDProtocol from "@/assets/vitamin-d-protocol.png.asset.json";
import structuredHypercortisolism from "@/assets/structured-hypercortisolism-screen.jpg.asset.json";
import osteoporosisTreatment from "@/assets/osteoporosis-treatment-approach-2026.jpg.asset.json";
import osteoporosisTreatmentV2 from "@/assets/osteoporosis-treatment-v3.jpg.asset.json";
import additionalOsteoporosisAlgorithm from "@/assets/file-5.png.asset.json";
import bisphosphonatesCriteria from "@/assets/bisphosphonates-criteria.png.asset.json";


import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Image, Home, ChevronDown, ChevronUp, ExternalLink, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import Seo from "@/components/Seo";

interface ImageEntry {
  id: string;
  src: string;
  label: string;
  category: string;
  description: string;
  sourcePages: { label: string; path: string }[];
}

const IMAGE_CATALOG: ImageEntry[] = [
  // ─── Diabetes ───
  { id: "semaglutide-vs-tirzepatide", src: "/images/semaglutide-vs-tirzepatide.jpg", label: "Semaglutide vs Tirzepatide", category: "Diabetes", description: "Head-to-head comparison — metabolic vs cardiorenal outcomes", sourcePages: [{ label: "Diabetes Treatment", path: "/diabetes/treatment" }, { label: "GLP-1 Administration", path: "/db/glp1-administration" }] },
  { id: "dka-algorithm", src: "/dka-algorithm.jpg", label: "DKA Algorithm", category: "Diabetes", description: "Diabetic Ketoacidosis management algorithm", sourcePages: [{ label: "Hyperglycemic Emergency", path: "/hyperglycemic-emergency" }, { label: "Diabetes Treatment", path: "/diabetes/treatment" }] },
  { id: "hhs-algorithm", src: "/hhs-algorithm.jpg", label: "HHS Algorithm", category: "Diabetes", description: "Hyperosmolar Hyperglycemic State management algorithm", sourcePages: [{ label: "Hyperglycemic Emergency", path: "/hyperglycemic-emergency" }, { label: "Diabetes Treatment", path: "/diabetes/treatment" }] },
  { id: "mixed-dka-hhs", src: "/mixed-dka-hhs-algorithm.jpg", label: "Mixed DKA/HHS Algorithm", category: "Diabetes", description: "Mixed DKA and HHS management algorithm", sourcePages: [{ label: "Hyperglycemic Emergency", path: "/hyperglycemic-emergency" }, { label: "Diabetes Treatment", path: "/diabetes/treatment" }] },
  { id: "insulins", src: "/images/Insulins.jpg", label: "Insulin Types", category: "Diabetes", description: "Types of insulin preparations", sourcePages: [{ label: "Insulin Guide", path: "/diabetes/insulin-guide" }] },
  { id: "insulin-types-graph", src: "/images/insulin-types-graph.png", label: "Insulin Types Graph", category: "Diabetes", description: "Insulin action profiles graph", sourcePages: [{ label: "Insulin Guide", path: "/diabetes/insulin-guide" }] },
  { id: "geriatric-syndromes", src: "/geriatric-syndromes.jpg", label: "Geriatric Syndromes", category: "Diabetes", description: "Geriatric syndromes in diabetes management", sourcePages: [{ label: "Diabetes Treatment", path: "/diabetes/treatment" }] },

  // ─── Hypertension ───
  { id: "htn-algorithm-steps", src: "/images/htn-algorithm-steps.jpg", label: "HTN Algorithm Steps", category: "Hypertension", description: "Hypertension treatment algorithm steps", sourcePages: [{ label: "HTN Algorithm Flowchart", path: "/hypertension/assessment" }] },
  { id: "htn-comorbidity-matrix", src: "/images/htn-comorbidity-matrix.jpg", label: "HTN Comorbidity Matrix", category: "Hypertension", description: "Hypertension comorbidity treatment matrix", sourcePages: [{ label: "HTN Algorithm Flowchart", path: "/hypertension/assessment" }] },
  { id: "htn-rx", src: "/images/htn-rx.png", label: "HTN Medication Guide", category: "Hypertension", description: "Hypertension medication reference", sourcePages: [{ label: "HTN Medication Guide", path: "/hypertension/medication-guide" }] },
  { id: "haaland-mnemonic", src: haalandMnemonic.url, label: "HAALAND Mnemonic — Secondary HTN", category: "Hypertension", description: "HAALAND mnemonic for secondary hypertension causes (Hyperaldosteronism, Aortic coarctation, Apnea/OSA, Liddle syndrome, Adrenal, Nephropathy, Drugs)", sourcePages: [{ label: "Secondary HTN Evaluation", path: "/hypertension/assessment" }] },
  { id: "mra-pocket-card", src: "/__l5e/assets-v1/0da12e7b-777a-4554-ba13-192499cd8e22/mra-pocket-card.jpg", label: "MRA Pocket Card", category: "Hypertension", description: "Spironolactone vs Eplerenone vs Finerenone — steroidal & nonsteroidal MRAs: uses, dosing, key cautions", sourcePages: [{ label: "HTN Medication Guide", path: "/hypertension/medication-guide" }] },

  // ─── Lipids ───
  { id: "lipids-infographic", src: "/lipids-infographic.jpg", label: "Lipids Infographic", category: "Lipids", description: "Lipid management overview infographic", sourcePages: [{ label: "Lipids Overview", path: "/lipids/overview" }] },
  { id: "ascvd-risk-stratification", src: "/images/ascvd-risk-stratification-lai.jpg", label: "ASCVD Risk Stratification", category: "Lipids", description: "ASCVD risk stratification by LAI guidelines", sourcePages: [{ label: "Lipids Assessment", path: "/lipids/assessment" }] },
  { id: "hypertriglyceridemia-algorithm", src: "/images/hypertriglyceridemia-algorithm-lai.jpg", label: "Hypertriglyceridemia Algorithm", category: "Lipids", description: "Hypertriglyceridemia management algorithm (LAI)", sourcePages: [{ label: "Lipids Assessment", path: "/lipids/assessment" }] },
  { id: "hypertriglyceridemia-cac", src: "/images/hypertriglyceridemia-cac-lai.jpg", label: "Hypertriglyceridemia CAC", category: "Lipids", description: "Hypertriglyceridemia CAC-based approach (LAI)", sourcePages: [{ label: "Lipids Assessment", path: "/lipids/assessment" }] },
  { id: "cacs-risk-stratification", src: "/images/cacs-risk-stratification-lai.jpg", label: "CACS Risk Stratification", category: "Lipids", description: "Coronary artery calcium score risk stratification (LAI)", sourcePages: [{ label: "Lipids Assessment", path: "/lipids/assessment" }] },
  { id: "cacs-risk-targets", src: "/images/cacs-risk-targets-lai.jpg", label: "CACS Risk Targets", category: "Lipids", description: "CACS-based lipid treatment targets (LAI)", sourcePages: [{ label: "Lipids Assessment", path: "/lipids/assessment" }] },
  { id: "diabetes-lipid-algorithm", src: "/images/diabetes-lipid-algorithm-lai.jpg", label: "Diabetes Lipid Algorithm", category: "Lipids", description: "Lipid management in diabetes (LAI)", sourcePages: [{ label: "Lipids Assessment", path: "/lipids/assessment" }] },
  { id: "acs-lipid-algorithm", src: "/images/acs-lipid-algorithm-lai.jpg", label: "ACS Lipid Algorithm", category: "Lipids", description: "Post-ACS lipid management algorithm (LAI)", sourcePages: [{ label: "Lipids Assessment", path: "/lipids/assessment" }] },
  { id: "lai-treatment-algorithm", src: "/images/lai-treatment-algorithm.jpg", label: "LAI Treatment Algorithm", category: "Lipids", description: "Lipid Association of India treatment algorithm", sourcePages: [{ label: "Lipids Assessment", path: "/lipids/assessment" }] },
  { id: "lipid-goals-by-risk", src: "/images/lipid-goals-by-risk-lai.jpg", label: "Lipid Goals by Risk", category: "Lipids", description: "Lipid treatment goals by risk category (LAI)", sourcePages: [{ label: "Lipids Assessment", path: "/lipids/assessment" }] },

  // ─── Anemia / Coagulation ───
  { id: "bleed-algorithm", src: "/images/bleed-algorithm.png", label: "Bleeding Algorithm", category: "Anemia & Coagulation", description: "Bleeding disorder evaluation algorithm", sourcePages: [{ label: "Bleeding/Clotting Evaluator", path: "/anemia" }] },
  { id: "thrombosis-algorithm", src: "/images/thrombosis-algorithm.png", label: "Thrombosis Algorithm", category: "Anemia & Coagulation", description: "Thrombosis evaluation algorithm", sourcePages: [{ label: "Bleeding/Clotting Evaluator", path: "/anemia" }] },
  { id: "dic-isth-score", src: "/images/dic-isth-score.webp", label: "DIC ISTH Score", category: "Anemia & Coagulation", description: "ISTH DIC scoring system", sourcePages: [{ label: "Bleeding/Clotting Evaluator", path: "/anemia" }] },
  { id: "anticoagulation-reference", src: "/images/anticoagulation-reference.jpg", label: "Anticoagulation Reference", category: "Anemia & Coagulation", description: "Anticoagulation reference chart", sourcePages: [{ label: "Bleeding/Clotting Evaluator", path: "/anemia" }, { label: "Anticoagulants", path: "/anemia" }] },

  // ─── Thyroid ───
  { id: "hyperthyroidism-algorithm", src: "/images/hyperthyroidism-algorithm.jpg", label: "Hyperthyroidism Algorithm", category: "Thyroid", description: "Hyperthyroidism management algorithm", sourcePages: [{ label: "Thyroid Calculator", path: "/thyroid" }] },

  // ─── Women's Health ───
  { id: "pmos-dx-eval", src: "/images/pmos-dx-eval.png", label: "PMOS Diagnosis & Evaluation", category: "Women's Health", description: "PCOS/PMOS diagnosis and evaluation algorithm", sourcePages: [{ label: "PCOS", path: "/pcos" }, { label: "Women Health", path: "/women-health" }, { label: "Lipid Panel", path: "/lipid-panel" }] },
  { id: "hrt-algorithm", src: "/images/hrt-algorithm.png", label: "HRT Algorithm", category: "Women's Health", description: "Hormone replacement therapy algorithm", sourcePages: [{ label: "Women Health", path: "/women-health" }] },

  // ─── Other ───
  { id: "vitamin-d", src: vitaminDProtocol.url, label: "Vitamin D Treatment & Monitoring Protocol", category: "Other", description: "Comprehensive protocol for vitamin D assessment and management. Includes loading doses (e.g., 60k IU weekly) and maintenance strategies. Source: Clinical Consensus Guidelines.", sourcePages: [{ label: "Vitamin D", path: "/vitamin-d" }] },
  { id: "fatigue-flowchart", src: "/fatigue-flowchart.jpg", label: "Fatigue Flowchart", category: "Other", description: "Fatigue evaluation flowchart", sourcePages: [{ label: "Fatigue", path: "/fatigue" }] },
  { id: "anticoagulation-cheatsheet", src: "/anticoagulation-cheatsheet.jpg", label: "Anticoagulation Cheatsheet", category: "Other", description: "Anticoagulation quick reference", sourcePages: [{ label: "Liver Mini App", path: "/liver" }] },
  { id: "doctor-monitors", src: "/doctor-monitors.jpg", label: "Doctor Monitors", category: "Other", description: "Landing page hero image", sourcePages: [{ label: "Landing Page", path: "/" }] },

  // ─── Infections ───
  { id: "antibiotic-spectrum-map", src: "/images/antibiotic-spectrum-map.jpg", label: "Antibiotic Spectrum Map", category: "Infections", description: "Quick visual guide to antibiotic coverage — Gram-positive, Gram-negative, anaerobes, and atypicals", sourcePages: [{ label: "Infections", path: "/infections" }] },
  { id: "acute-diarrhoea-classification", src: acuteDiarrhoeaClassification.url, label: "Acute Diarrhoea Classification", category: "Infections", description: "Acute diarrhoea classification and initial management approach", sourcePages: [{ label: "Diarrhoea and Constipation", path: "/acute-diarrhoea" }] },

  // ─── Renal / AKI ───
  { id: "kdigo-2026-aki-akd-guideline", src: kdigoAkiAkd.url, label: "KDIGO 2026 AKI & AKD Guideline", category: "Renal / AKI", description: "Definitions and diagnostic criteria for acute kidney injury and acute kidney disease", sourcePages: [{ label: "AKI / AKD Mini App", path: "/aki-akd" }] },
  { id: "fst-infographic", src: "/images/fst-infographic.png", label: "FST Infographic", category: "Renal / AKI", description: "Furosemide Stress Test — predicting AKI progression", sourcePages: [{ label: "AKI Criteria", path: "/aki-criteria" }] },

  // ─── Infections ───
  { id: "antibiotics-spectrum", src: antibioticsSpectrum.url, label: "Antibiotics by Spectrum", category: "Infections", description: "Complete classification of antibiotics by gram-positive, gram-negative, and broad/mixed spectrum coverage", sourcePages: [{ label: "Infections", path: "/infections" }] },

  // ─── Anemia / Hemolysis ───
  { id: "hemolytic-anemia-algorithm", src: "/images/hemolytic-anemia-algorithm.jpg", label: "Hemolytic Anemia Algorithm", category: "Anemia & Coagulation", description: "Diagnostic algorithm for hemolytic anemia — Coombs-negative workup", sourcePages: [{ label: "Anemia", path: "/anemia" }] },
  { id: "anemia-algorithm", src: "/images/anemia-algorithm.jpg", label: "Anemia Algorithm", category: "Anemia & Coagulation", description: "MCV-based diagnostic algorithm for anemia — microcytic, normocytic, and macrocytic classification", sourcePages: [{ label: "Anemia", path: "/anemia" }] },
  { 
    id: "structured-hypercortisolism-screen", 
    src: structuredHypercortisolism.url, 
    label: "Structured Hypercortisolism Screen for Refractory Big 4", 
    category: "Endocrinology", 
    description: "Structured approach to hypercortisolism screening in refractory T2D, HTN, obesity, and osteoporosis (Big 4). Includes case identification, pre-screen checks (therapeutic steroids, etc.), 1-mg overnight DST interpretation, and confirmatory evaluation path.", 
    sourcePages: [
      { label: "Diabetes", path: "/diabetes/treatment" },
      { label: "Secondary HTN", path: "/hypertension/assessment" },
      { label: "Obesity", path: "/obesity" }
    ] 
  },
  {
    id: "osteoporosis-treatment-approach",
    src: osteoporosisTreatment.url,
    label: "Osteoporosis Treatment Approach (2026)",
    category: "Endocrinology",
    description: "2026 update on osteoporosis medication sequencing: Anabolic-first strategy in very high-risk patients vs antiresorptive-first in high-risk patients. Source: Consensus clinical update 2026.",
    sourcePages: [
      { label: "Vitamin D", path: "/vitamin-d" },
      { label: "Geriatrics", path: "/geriatrics?tab=fractures" }
    ]
  },
  {
    id: "osteoporosis-treatment-v2",
    src: osteoporosisTreatmentV2.url,
    label: "Osteoporosis Treatment Approach (Extended)",
    category: "Endocrinology",
    description: "Supplemental 2026 approach for osteoporosis management and clinical decision support.",
    sourcePages: [
      { label: "Vitamin D", path: "/vitamin-d" }
    ]
  },
  {
    id: "bisphosphonates-criteria",
    src: bisphosphonatesCriteria.url,
    label: "Clinical Criteria for Initiating Bisphosphonates",
    category: "Endocrinology",
    description: "Specific diagnostic thresholds for bisphosphonate therapy across primary osteoporosis, glucocorticoid-induced osteoporosis, and oncology-specific criteria. Includes mandatory clinical prerequisites (renal function, metabolic status, esophageal health).",
    sourcePages: [
      { label: "Vitamin D", path: "/vitamin-d" }
    ]
  },
  {
    id: "osteoporosis-treatment-v4",
    src: additionalOsteoporosisAlgorithm.url,
    label: "Osteoporosis Management & Fragility Fracture Prevention",
    category: "Endocrinology",
    description: "2026 update on clinical management approach for osteoporosis and fragility fracture prevention.",
    sourcePages: [
      { label: "Vitamin D", path: "/vitamin-d" }
    ]
  },
];

const CATEGORIES = [...new Set(IMAGE_CATALOG.map((img) => img.category))];

export default function ImageGallery() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>(
    Object.fromEntries(CATEGORIES.map((c) => [c, true]))
  );

  const filtered = IMAGE_CATALOG.filter(
    (img) =>
      img.label.toLowerCase().includes(search.toLowerCase()) ||
      img.category.toLowerCase().includes(search.toLowerCase()) ||
      img.description.toLowerCase().includes(search.toLowerCase())
  );

  const grouped = CATEGORIES.map((cat) => ({
    category: cat,
    images: filtered.filter((img) => img.category === cat),
  })).filter((g) => g.images.length > 0);

  const toggleCategory = (cat: string) => {
    setExpandedCategories((prev) => ({ ...prev, [cat]: !prev[cat] }));
  };

  return (
    <div className="min-h-screen bg-background" role="none">
      <Seo
        title="Image Gallery — Clinical Algorithms & Pocket Cards"
        description="Zoomable clinical algorithms, mnemonics and pocket cards across diabetes, hypertension, lipids, renal, infections and geriatrics."
        path="/images"
      />
      {/* Sticky Header */}
      <div className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="mx-auto max-w-4xl px-4">
          <div className="flex items-center gap-3 py-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 shadow-md">
              <Image className="h-5 w-5 text-foreground" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="font-display text-xl font-extrabold tracking-tight bg-gradient-to-r from-purple-500 via-violet-500 to-indigo-600 bg-clip-text text-transparent truncate">
                Image Gallery
              </h1>
              <p className="text-xs font-medium text-muted-foreground truncate">
                All reference images in one place
              </p>
            </div>
            <div className="flex items-center gap-2 no-print shrink-0">
              <Button variant="ghost" size="sm" onClick={() => navigate("/")} title="Back to Home">
                <Home className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <main id="main-content" className="mx-auto w-full max-w-4xl px-4 py-6 space-y-6">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search images..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-card border-border"
          />
        </div>

        <p className="text-xs text-muted-foreground">
          {filtered.length} image{filtered.length !== 1 ? "s" : ""} found
        </p>

        {/* Image Grid by Category */}
        {grouped.map((group) => (
          <Card key={group.category} className="clinical-card overflow-hidden">
            <button
              onClick={() => toggleCategory(group.category)}
              className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors"
            >
              <CardTitle className="text-base flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {group.images.length}
                </Badge>
                {group.category}
              </CardTitle>
              {expandedCategories[group.category] ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </button>

            {expandedCategories[group.category] && (
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {group.images.map((img) => (
                    <div
                      key={img.id}
                      className="rounded-lg border border-border bg-card/50 overflow-hidden group"
                    >
                      <a
                        href={img.src}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block"
                      >
                        <div className="aspect-video bg-muted/30 flex items-center justify-center overflow-hidden">
                          <img
                            src={img.src}
                            alt={img.label}
                            className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform"
                            loading="lazy"
                          />
                        </div>
                      </a>
                      <div className="p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="font-semibold text-sm">{img.label}</p>
                          <a
                            href={img.src}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-muted-foreground hover:text-foreground transition-colors"
                            title="Open full size"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        </div>
                        <p className="text-xs text-muted-foreground">{img.description}</p>
                        <div className="flex flex-wrap gap-1">
                          {img.sourcePages.map((page, i) => (
                            <button
                              key={i}
                              onClick={() => navigate(page.path)}
                              className="text-xs text-primary hover:underline"
                            >
                              {page.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            )}
          </Card>
        ))}
      </main>
    </div>
  );
}
