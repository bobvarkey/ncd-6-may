// GLP-1 / dual-agonist products with titration schedules, injection sites and
// side effects. Used by the Drug Schedule page and the GLP-1 Drug Calculator.

export interface TitrationStep {
  dose: string;
  /** Duration of this step in weeks (0 = maintenance / open-ended) */
  weeks: number;
  label: string;
}

export interface Glp1Product {
  id: string;
  drug: string;
  brand: string;
  /** "weekly" | "daily" */
  cadence: "weekly" | "daily";
  frequency: string;
  route: string;
  indication: string;
  steps: TitrationStep[];
  sites: string[];
  storage: string;
  sideEffects: string[];
  cautions: string[];
}

export const GLP1_PRODUCTS: Glp1Product[] = [
  {
    id: "tirzepatide-mounjaro",
    drug: "Tirzepatide",
    brand: "Mounjaro",
    cadence: "weekly",
    frequency: "Once weekly",
    route: "Subcutaneous",
    indication: "Type 2 diabetes (± weight benefit)",
    steps: [
      { dose: "2.5 mg", weeks: 4, label: "Starting dose" },
      { dose: "5 mg", weeks: 4, label: "First maintenance dose" },
      { dose: "7.5 mg", weeks: 4, label: "Escalation (if needed)" },
      { dose: "10 mg", weeks: 4, label: "Escalation (if needed)" },
      { dose: "12.5 mg", weeks: 4, label: "Escalation (if needed)" },
      { dose: "15 mg", weeks: 0, label: "Maximum dose" },
    ],
    sites: ["Abdomen (≥5 cm from navel)", "Front of thigh", "Back of upper arm"],
    storage: "Fridge 2–8 °C. Once in use, up to 30 °C for 21 days.",
    sideEffects: ["Nausea", "Vomiting", "Diarrhoea", "Constipation", "Reduced appetite", "Injection-site reaction"],
    cautions: [
      "Personal/family history of medullary thyroid carcinoma or MEN 2",
      "History of pancreatitis",
      "Severe gastroparesis",
      "Pregnancy / planning pregnancy",
    ],
  },
  {
    id: "tirzepatide-zepbound",
    drug: "Tirzepatide",
    brand: "Zepbound",
    cadence: "weekly",
    frequency: "Once weekly",
    route: "Subcutaneous",
    indication: "Weight management",
    steps: [
      { dose: "2.5 mg", weeks: 4, label: "Starting dose" },
      { dose: "5 mg", weeks: 4, label: "First maintenance dose" },
      { dose: "7.5 mg", weeks: 4, label: "Escalation (if needed)" },
      { dose: "10 mg", weeks: 4, label: "Escalation (if needed)" },
      { dose: "12.5 mg", weeks: 4, label: "Escalation (if needed)" },
      { dose: "15 mg", weeks: 0, label: "Maximum dose" },
    ],
    sites: ["Abdomen (≥5 cm from navel)", "Front of thigh", "Back of upper arm"],
    storage: "Fridge 2–8 °C. Once in use, up to 30 °C for 21 days.",
    sideEffects: ["Nausea", "Diarrhoea", "Vomiting", "Constipation", "Fatigue", "Injection-site reaction"],
    cautions: [
      "Medullary thyroid carcinoma / MEN 2 history",
      "History of pancreatitis",
      "Active gallbladder disease",
      "Pregnancy / planning pregnancy",
    ],
  },
  {
    id: "semaglutide-ozempic",
    drug: "Semaglutide",
    brand: "Ozempic",
    cadence: "weekly",
    frequency: "Once weekly",
    route: "Subcutaneous",
    indication: "Type 2 diabetes",
    steps: [
      { dose: "0.25 mg", weeks: 4, label: "Starting dose (not for glycaemic effect)" },
      { dose: "0.5 mg", weeks: 4, label: "First therapeutic dose" },
      { dose: "1 mg", weeks: 4, label: "Escalation (if needed)" },
      { dose: "2 mg", weeks: 0, label: "Maximum dose" },
    ],
    sites: ["Abdomen", "Front of thigh", "Back of upper arm"],
    storage: "Fridge 2–8 °C. Once in use, up to 30 °C for 56 days.",
    sideEffects: ["Nausea", "Vomiting", "Diarrhoea", "Abdominal pain", "Constipation"],
    cautions: ["Medullary thyroid carcinoma / MEN 2", "Pancreatitis history", "Proliferative retinopathy — monitor"],
  },
  {
    id: "semaglutide-wegovy",
    drug: "Semaglutide",
    brand: "Wegovy",
    cadence: "weekly",
    frequency: "Once weekly",
    route: "Subcutaneous",
    indication: "Weight management",
    steps: [
      { dose: "0.25 mg", weeks: 4, label: "Starting dose" },
      { dose: "0.5 mg", weeks: 4, label: "Escalation" },
      { dose: "1 mg", weeks: 4, label: "Escalation" },
      { dose: "1.7 mg", weeks: 4, label: "Escalation" },
      { dose: "2.4 mg", weeks: 0, label: "Maintenance / maximum dose" },
    ],
    sites: ["Abdomen", "Front of thigh", "Back of upper arm"],
    storage: "Fridge 2–8 °C. Once in use, up to 30 °C for 56 days.",
    sideEffects: ["Nausea", "Diarrhoea", "Vomiting", "Constipation", "Headache", "Fatigue"],
    cautions: ["Medullary thyroid carcinoma / MEN 2", "Pancreatitis history", "Gallstone disease", "Pregnancy"],
  },
  {
    id: "liraglutide-saxenda",
    drug: "Liraglutide",
    brand: "Saxenda",
    cadence: "daily",
    frequency: "Once daily",
    route: "Subcutaneous",
    indication: "Weight management",
    steps: [
      { dose: "0.6 mg", weeks: 1, label: "Starting dose" },
      { dose: "1.2 mg", weeks: 1, label: "Escalation" },
      { dose: "1.8 mg", weeks: 1, label: "Escalation" },
      { dose: "2.4 mg", weeks: 1, label: "Escalation" },
      { dose: "3 mg", weeks: 0, label: "Maintenance / maximum dose" },
    ],
    sites: ["Abdomen", "Front of thigh", "Back of upper arm"],
    storage: "Fridge 2–8 °C. Once in use, up to 30 °C for 30 days.",
    sideEffects: ["Nausea", "Vomiting", "Diarrhoea", "Constipation", "Hypoglycaemia (with insulin/sulfonylurea)"],
    cautions: ["Medullary thyroid carcinoma / MEN 2", "Pancreatitis history", "Pregnancy"],
  },
  {
    id: "liraglutide-victoza",
    drug: "Liraglutide",
    brand: "Victoza",
    cadence: "daily",
    frequency: "Once daily",
    route: "Subcutaneous",
    indication: "Type 2 diabetes",
    steps: [
      { dose: "0.6 mg", weeks: 1, label: "Starting dose" },
      { dose: "1.2 mg", weeks: 1, label: "First therapeutic dose" },
      { dose: "1.8 mg", weeks: 0, label: "Maximum dose" },
    ],
    sites: ["Abdomen", "Front of thigh", "Back of upper arm"],
    storage: "Fridge 2–8 °C. Once in use, up to 30 °C for 30 days.",
    sideEffects: ["Nausea", "Diarrhoea", "Headache", "Hypoglycaemia (with insulin/sulfonylurea)"],
    cautions: ["Medullary thyroid carcinoma / MEN 2", "Pancreatitis history"],
  },
  {
    id: "dulaglutide-trulicity",
    drug: "Dulaglutide",
    brand: "Trulicity",
    cadence: "weekly",
    frequency: "Once weekly",
    route: "Subcutaneous",
    indication: "Type 2 diabetes",
    steps: [
      { dose: "0.75 mg", weeks: 4, label: "Starting dose" },
      { dose: "1.5 mg", weeks: 4, label: "Usual maintenance dose" },
      { dose: "3 mg", weeks: 4, label: "Escalation (if needed)" },
      { dose: "4.5 mg", weeks: 0, label: "Maximum dose" },
    ],
    sites: ["Abdomen", "Front of thigh", "Back of upper arm (carer administered)"],
    storage: "Fridge 2–8 °C. Once out, up to 30 °C for 14 days.",
    sideEffects: ["Nausea", "Diarrhoea", "Vomiting", "Abdominal pain", "Reduced appetite"],
    cautions: ["Medullary thyroid carcinoma / MEN 2", "Pancreatitis history"],
  },
  {
    id: "semaglutide-wegovy-sunday",
    drug: "Semaglutide",
    brand: "Wegovy (Sunday injections)",
    cadence: "weekly",
    frequency: "Once weekly on Sunday",
    route: "Subcutaneous",
    indication: "Weight management",
    steps: [
      { dose: "0.25 mg", weeks: 4, label: "Starting dose" },
      { dose: "0.5 mg", weeks: 4, label: "Escalation" },
      { dose: "1 mg", weeks: 4, label: "Escalation" },
      { dose: "2 mg", weeks: 0, label: "Maintenance / maximum dose available" },
    ],
    sites: ["Abdomen", "Front of thigh", "Back of upper arm"],
    storage: "Fridge 2–8 °C. Once in use, up to 30 °C for 56 days.",
    sideEffects: ["Nausea", "Diarrhoea", "Vomiting", "Constipation", "Headache", "Fatigue"],
    cautions: ["Medullary thyroid carcinoma / MEN 2", "Pancreatitis history", "Gallstone disease", "Pregnancy"],
  },
];

/** Rotation order used for weekly injection-site suggestions. */
export const SITE_ROTATION = [
  "Abdomen — left",
  "Abdomen — right",
  "Left thigh",
  "Right thigh",
  "Left upper arm",
  "Right upper arm",
];

export function addDays(date: Date, days: number): Date {
  const d = new Date(date.getTime());
  d.setDate(d.getDate() + days);
  return d;
}

export function formatDate(d: Date): string {
  return d.toLocaleDateString(undefined, { weekday: "short", day: "2-digit", month: "short", year: "numeric" });
}
