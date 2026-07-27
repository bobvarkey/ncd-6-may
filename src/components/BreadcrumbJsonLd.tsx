import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * Injects a JSON-LD BreadcrumbList into <head> for every route.
 * Updates automatically on client-side navigation. A single <script>
 * element (id="breadcrumb-jsonld") is reused and rewritten per route.
 */

const SITE_URL = "https://ncdapp.store";
const SCRIPT_ID = "breadcrumb-jsonld";

const LABEL_OVERRIDES: Record<string, string> = {
  home: "Home",
  diabetes: "Diabetes",
  hypertension: "Hypertension",
  lipids: "Lipids",
  liver: "Liver",
  anemia: "Anemia",
  respiratory: "Respiratory",
  infections: "Infections",
  electrolytes: "Electrolytes",
  geriatrics: "Geriatrics",
  fatigue: "Fatigue",
  "vitamin-d": "Vitamin D",
  "women-health": "Women's Health",
  "adult-vaccinations": "Adult Vaccinations",
  pep: "PEP (Post exposure prophylaxis)",
  "acute-diarrhoea": "Acute Diarrhoea",
  "food-poisoning": "Food Poisoning",
  "aki-criteria": "AKI Criteria",
  "acid-base": "Acid-Base Disorders",
  "metabolic-alkalosis": "Metabolic Alkalosis",
  hyponatremia: "Hyponatremia",
  hypernatremia: "Hypernatremia",
  hyperkalemia: "Hyperkalemia",
  hypokalemia: "Hypokalemia",
  hypocalcemia: "Hypocalcemia",
  hypercalcemia: "Hypercalcemia",
  hypomagnesemia: "Hypomagnesemia",
  hypermagnesemia: "Hypermagnesemia",
  hypophosphatemia: "Hypophosphatemia",
  hyperphosphatemia: "Hyperphosphatemia",
  "hyperglycemic-emergency": "Hyperglycemic Emergency",
  "type1-treatment": "Type 1 Treatment Algorithm",
  "type2-treatment": "Type 2 Treatment Algorithm",
  "goldman-cardiac": "Goldman Cardiac Index",
  perioperative: "Perioperative Calculators",
  "insulin-titration": "Insulin Titration",
  "sliding-scale": "Sliding Scale Insulin",
  "hypo-risk": "Hypo Risk",
  "renal-dosing": "Renal Dosing",
  "delete-account": "Delete Account",
  "privacy-policy": "Privacy Policy",
  "terms-of-service": "Terms of Service",
  disclaimer: "Disclaimer",
  gallery: "Image Gallery",
  assessment: "Assessment",
  overview: "Overview",
  treatment: "Treatment",
  tab: "Details",
  "insulin-guide": "Insulin Guide",
  "medication-guide": "Medication Guide",
  "clinical-cards": "Clinical Cards",
  "secondary-htn": "Secondary Hypertension",
  "mra-selection": "MRA Selection",
  db: "Diabetes Buddy",
};

function prettify(segment: string): string {
  if (LABEL_OVERRIDES[segment]) return LABEL_OVERRIDES[segment];
  return segment
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function BreadcrumbJsonLd() {
  const { pathname } = useLocation();

  useEffect(() => {
    const segments = pathname.split("/").filter(Boolean);
    const items = [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: `${SITE_URL}/home`,
      },
    ];

    let acc = "";
    segments.forEach((seg, i) => {
      acc += `/${seg}`;
      // Skip duplicate "Home" entry when the first segment is already home.
      if (i === 0 && seg === "home") return;
      items.push({
        "@type": "ListItem",
        position: items.length + 1,
        name: prettify(seg),
        item: `${SITE_URL}${acc}`,
      });
    });

    const payload = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: items,
    };

    let el = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
    if (!el) {
      el = document.createElement("script");
      el.type = "application/ld+json";
      el.id = SCRIPT_ID;
      document.head.appendChild(el);
    }
    el.textContent = JSON.stringify(payload);
  }, [pathname]);

  return null;
}
