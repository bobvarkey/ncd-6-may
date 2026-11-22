/**
 * Side-tab rail for clinical pages.
 *
 * The first groups are the rail restored from the pre-sunburst TabNavigation
 * (commit 55379bb^), plus Common Calculators and Clinical Apps. Later sections
 * add every other user-facing page so it can be opened from the rail.
 * Development-only /dev/tools and the account header routes are not listed.
 */

export type SideTab = {
  path: string;
  label: string;
  emoji: string;
};

export type BloodSideTab = {
  tab: string;
  label: string;
  emoji: string;
};

export type SideSection = {
  id: string;
  label: string;
  items: SideTab[];
};

/** Historical top-level rail, in its previous order. */
export const MAIN_SIDE_TABS: SideTab[] = [
  { path: "/home", label: "Home", emoji: "🏠" },
  { path: "/diabetes", label: "Diabetes", emoji: "🩸" },
  { path: "/hypertension", label: "Hypertension", emoji: "❤️" },
  { path: "/lipids", label: "Lipids", emoji: "💧" },
  { path: "/liver", label: "Liver", emoji: "🫀" },
  { path: "/thyroid", label: "Thyroid", emoji: "🦋" },
  { path: "/obesity/bmi-calculator", label: "Body weight issues", emoji: "⚖️" },
  { path: "/obesity/glp1-dosing", label: "GLP-1 Doses & Schedules", emoji: "💉" },
  { path: "/glp1-screening", label: "GLP-1 Screening", emoji: "👁️" },
  { path: "/respiratory", label: "Asthma and COPD", emoji: "🫁" },
  { path: "/aki-criteria", label: "AKI / AKD Criteria", emoji: "🧪" },
  { path: "/renal-dosing", label: "Renal", emoji: "🫘" },
  { path: "/anemia", label: "Blood", emoji: "🩸" },
  { path: "/fatigue", label: "Fatigue", emoji: "😴" },
  { path: "/infections", label: "Infections", emoji: "🦠" },
  { path: "/acute-diarrhoea", label: "Diarrhoea and constipation", emoji: "💩" },
  { path: "/food-poisoning", label: "Food Poisoning", emoji: "🤢" },
  { path: "/pep", label: "Post exposure prophylaxis (PEP)", emoji: "💉" },
  { path: "/adult-vaccinations", label: "Vaccinations", emoji: "💉" },
  { path: "/vitamin-d", label: "Vitamin D", emoji: "☀️" },
  { path: "/geriatrics", label: "Geriatrics", emoji: "👴" },
  { path: "/frailty-calculator", label: "Frailty Calculator", emoji: "🧍" },
  { path: "/vaccine-calculator", label: "Vaccine Calculator", emoji: "🧮" },
  { path: "/electrolytes", label: "Electrolytes", emoji: "⚡" },
  { path: "/perioperative-calculators", label: "Perioperative Tools", emoji: "🏥" },
];

export const BLOOD_SIDE_TABS: BloodSideTab[] = [
  { tab: "anemia", label: "Anemia Evaluator", emoji: "🩸" },
  { tab: "thrombocytopenia", label: "Thrombocytopenia", emoji: "🩹" },
  { tab: "bleeding-clotting", label: "Bleeding / Clotting", emoji: "🩹" },
  { tab: "iron", label: "Iron Parameters", emoji: "💉" },
  { tab: "ganzoni", label: "Ganzoni Deficit", emoji: "🧮" },
  { tab: "esr", label: "ESR", emoji: "⏱️" },
  { tab: "erythrocytosis", label: "Erythrocytosis / PV", emoji: "🩸" },
  { tab: "anticoagulants", label: "Anticoagulants", emoji: "💊" },
];

export const HTN_SIDE_TABS: SideTab[] = [
  { path: "/hypertension/secondary-htn", label: "Secondary HTN", emoji: "🔍" },
];

export const LIVER_SIDE_TABS: SideTab[] = [
  { path: "/liver/auto-calc", label: "Liver Auto-Calc", emoji: "🧮" },
];

export const OBESITY_SIDE_TABS: SideTab[] = [
  { path: "/obesity/bmi-calculator", label: "BMI Calculator", emoji: "🧮" },
  { path: "/obesity/glp1-dosing", label: "GLP-1 Doses & Schedules", emoji: "💉" },
];

export const ELECTROLYTE_SIDE_TABS: SideTab[] = [
  { path: "/hyponatremia", label: "Hyponatremia", emoji: "💧" },
  { path: "/hypernatremia", label: "Hypernatremia", emoji: "🌡️" },
  { path: "/hyperkalemia", label: "Hyperkalemia", emoji: "⚡" },
  { path: "/hypokalemia", label: "Hypokalemia", emoji: "⚡" },
  { path: "/hypocalcemia", label: "Hypocalcemia", emoji: "🦴" },
  { path: "/hypercalcemia", label: "Hypercalcemia", emoji: "🔥" },
  { path: "/hypomagnesemia", label: "Hypomagnesemia", emoji: "🦴" },
  { path: "/hypermagnesemia", label: "Hypermagnesemia", emoji: "💎" },
  { path: "/hypophosphatemia", label: "Hypophosphatemia", emoji: "🦴" },
  { path: "/hyperphosphatemia", label: "Hyperphosphatemia", emoji: "💎" },
];

export const WOMEN_HEALTH_SIDE_TABS: SideTab[] = [
  { path: "/women-health?tab=pmos", label: "PMOS / PCOS", emoji: "🌸" },
  { path: "/women-health?tab=hrt", label: "HRT Algorithm", emoji: "💊" },
];

export const IMAGE_SIDE_TAB: SideTab = { path: "/images", label: "Images", emoji: "🖼️" };
export const GLOSSARY_SIDE_TAB: SideTab = { path: "/glossary", label: "Clinical Glossary", emoji: "📖" };

export const MISC_SIDE_TABS: SideTab[] = [
  { path: "/calculators", label: "Common Calculators", emoji: "🧮" },
  { path: "/clinical-apps", label: "Clinical Apps", emoji: "🧩" },
];

/**
 * Pages that were not on the restored rail. Order follows the route table's
 * clinical grouping. Labels are the page titles already used in the router.
 */
export const EXTRA_SIDE_SECTIONS: SideSection[] = [
  {
    id: "diabetes-pathways",
    label: "Diabetes pathways",
    items: [
      { path: "/prediabetes", label: "Prediabetes", emoji: "🎯" },
      { path: "/diabetes/assessment", label: "Diabetes Assessment", emoji: "🩺" },
      { path: "/diabetes/overview", label: "Diabetes Overview", emoji: "📋" },
      { path: "/diabetes/treatment", label: "Diabetes Treatment", emoji: "💊" },
      { path: "/diabetes/insulin-guide", label: "Insulin Guide", emoji: "💉" },
      { path: "/diabetes/medication-algorithm", label: "Diabetes Medication Algorithm", emoji: "🧬" },
      { path: "/insulin-titration", label: "Insulin Titration", emoji: "💉" },
      { path: "/sliding-scale", label: "Sliding Scale", emoji: "📈" },
      { path: "/hypo-risk", label: "Hypo Risk", emoji: "⚠️" },
      { path: "/insulin-therapy", label: "Insulin Therapy", emoji: "🩸" },
      { path: "/daily-management", label: "Daily Management", emoji: "📖" },
      { path: "/type1-management", label: "Type 1 DM", emoji: "💉" },
      { path: "/type1-pitfalls", label: "T1D Pitfalls", emoji: "⚠️" },
      { path: "/type2-transition", label: "T2D Transition", emoji: "🔄" },
      { path: "/type1-treatment-algorithm", label: "T1D Treatment Algorithm", emoji: "🧠" },
      { path: "/type2-treatment-algorithm", label: "T2D Treatment Algorithm", emoji: "🧠" },
      { path: "/hyperglycemic-emergency", label: "Hyperglycemic Emergency", emoji: "🚨" },
      { path: "/diabetic-foot-scoring", label: "Diabetic Foot Scoring", emoji: "🦶" },
    ],
  },
  {
    id: "htn-lipids",
    label: "Hypertension & lipids",
    items: [
      { path: "/hypertension/assessment", label: "Hypertension Assessment", emoji: "🩺" },
      { path: "/hypertension/overview", label: "Hypertension Overview", emoji: "📋" },
      { path: "/hypertension/treatment", label: "Hypertension Treatment", emoji: "💊" },
      { path: "/hypertension/medication-guide", label: "Medication Guide", emoji: "💊" },
      { path: "/hypertension/clinical-cards", label: "Clinical Cards", emoji: "🗂️" },
      { path: "/hypertension/mra-selection", label: "MRA Selection", emoji: "❤️" },
      { path: "/htn/treatment-algorithm", label: "Treatment Algorithm", emoji: "📐" },
      { path: "/htn/potency-table", label: "Potency Table", emoji: "📊" },
      { path: "/drug-interactions", label: "Drug Interactions", emoji: "⚗️" },
      { path: "/metabolic-syndrome", label: "Metabolic Syndrome", emoji: "📏" },
      { path: "/steroid-taper", label: "Steroid Taper", emoji: "📉" },
      { path: "/lipids/assessment", label: "Lipids Assessment", emoji: "🩺" },
      { path: "/lipids/overview", label: "Lipids Overview", emoji: "📋" },
      { path: "/lipids/treatment", label: "Lipids Treatment", emoji: "💊" },
      { path: "/lipid-panel", label: "Lipid Panel", emoji: "💧" },
      { path: "/ascvd-risk", label: "ASCVD Risk", emoji: "❤️" },
      { path: "/guides/mme-cdc", label: "MME Guide", emoji: "📘" },
    ],
  },
  {
    id: "weight-glp1",
    label: "Weight & GLP-1",
    items: [
      { path: "/glp1-prescreen", label: "GLP-1 Pre-Initiation Screener", emoji: "👁️" },
      { path: "/obesity/glp1-algorithm", label: "GLP-1 Algorithm", emoji: "🧬" },
      { path: "/obesity/glp1-assessment", label: "GLP-1 Assessment", emoji: "📋" },
      { path: "/obesity/glp1-screener", label: "GLP-1 Screener", emoji: "✅" },
      { path: "/obesity/optic-nerve-assessment", label: "Optic Nerve Assessment", emoji: "👁️" },
      { path: "/obesity/waist-height-ratio", label: "Waist-Height Ratio", emoji: "📏" },
      { path: "/obesity/visceral-fat-ultrasound", label: "Visceral Fat Ultrasound", emoji: "📡" },
      { path: "/drug-schedule", label: "Drug Schedule", emoji: "📅" },
      { path: "/drug-calculator", label: "Drug Calculator", emoji: "🧮" },
    ],
  },
  {
    id: "kidney-bone-acute",
    label: "Kidney, bone & acute",
    items: [
      { path: "/gfr-calculator", label: "GFR Calculator", emoji: "🧮" },
      { path: "/ckd-guideline", label: "CKD Guideline", emoji: "🫘" },
      { path: "/acid-base", label: "Acid-Base Disorders", emoji: "⚖️" },
      { path: "/bone-health", label: "Bone Health", emoji: "🦴" },
      { path: "/bladder-urology", label: "Bladder & Urology", emoji: "💧" },
      { path: "/fcm-hypophosphatemia", label: "FCM Hypophosphatemia", emoji: "🦴" },
      { path: "/perioperative-calculators#csdh", label: "cSDH", emoji: "🧠" },
    ],
  },
  {
    id: "records-diet",
    label: "Records, diet & medicines",
    items: [
      { path: "/db/dashboard", label: "Dashboard", emoji: "📊" },
      { path: "/patient", label: "Patient", emoji: "🧑" },
      { path: "/summary", label: "Summary", emoji: "📋" },
      { path: "/progress", label: "Progress", emoji: "📉" },
      { path: "/foods", label: "Foods", emoji: "🍎" },
      { path: "/plate", label: "Plate Method", emoji: "🍽️" },
      { path: "/diet-plan", label: "Diet Plan", emoji: "🥗" },
      { path: "/medications", label: "Medications", emoji: "💊" },
    ],
  },
  {
    id: "account-legal",
    label: "Account & legal",
    items: [
      { path: "/settings", label: "Settings", emoji: "⚙️" },
      { path: "/feedback", label: "Feedback", emoji: "💬" },
      { path: "/disclaimer", label: "Disclaimer", emoji: "⚠️" },
      { path: "/privacy", label: "Privacy Policy", emoji: "🔒" },
      { path: "/terms", label: "Terms of Service", emoji: "📜" },
      { path: "/delete-account", label: "Delete Account", emoji: "🗑️" },
    ],
  },
];

/** Pathname of a side-tab href, without query or hash. */
export function sideTabPathname(href: string): string {
  const hash = href.indexOf("#");
  const query = href.indexOf("?");
  const cut = [hash, query].filter((i) => i >= 0).sort((a, b) => a - b)[0];
  return cut === undefined ? href : href.slice(0, cut);
}

export function allSideNavEntries(): SideTab[] {
  return [
    ...MAIN_SIDE_TABS,
    ...BLOOD_SIDE_TABS.map((tab) => ({
      path: `/anemia?tab=${tab.tab}`,
      label: tab.label,
      emoji: tab.emoji,
    })),
    ...HTN_SIDE_TABS,
    ...LIVER_SIDE_TABS,
    ...OBESITY_SIDE_TABS,
    ...ELECTROLYTE_SIDE_TABS,
    ...WOMEN_HEALTH_SIDE_TABS,
    IMAGE_SIDE_TAB,
    GLOSSARY_SIDE_TAB,
    ...MISC_SIDE_TABS,
    ...EXTRA_SIDE_SECTIONS.flatMap((section) => section.items),
  ];
}
