import type { LucideIcon } from "lucide-react";
import {
  Activity, AirVent, Bandage, BookOpen, Bone, Bug, Calculator, Dna, Droplet, Droplets,
  Eye, Filter, Flame, Gem, Heart, Image, Microscope, Moon, Pill, Search, Shield,
  Stethoscope, Sun, Syringe, Thermometer, Timer, User, UtensilsCrossed, Weight, Zap,
} from "lucide-react";

export type PrimaryNavItem = {
  path: string;
  label: string;
  icon: LucideIcon;
  keywords?: string;
};

export type PrimaryNavSection = {
  id: string;
  label: string;
  items: PrimaryNavItem[];
};

/** Destinations previously exposed by the left TabNavigation sidebar. */
export const PRIMARY_NAV_SECTIONS: PrimaryNavSection[] = [
  {
    id: "core",
    label: "Cardiometabolic & endocrine",
    items: [
      { path: "/diabetes", label: "Diabetes", icon: Droplets, keywords: "ada glucose insulin" },
      { path: "/hypertension", label: "Hypertension", icon: Heart, keywords: "bp esc" },
      { path: "/hypertension/secondary-htn", label: "Secondary HTN", icon: Search, keywords: "workup" },
      { path: "/lipids", label: "Lipids", icon: Droplet, keywords: "ascvd ldl" },
      { path: "/liver", label: "Liver", icon: Dna, keywords: "masld nafld" },
      { path: "/liver/auto-calc", label: "Liver Auto-Calc", icon: Calculator },
      { path: "/thyroid", label: "Thyroid", icon: Microscope, keywords: "tsh" },
      { path: "/obesity/bmi-calculator", label: "Body weight issues", icon: Weight, keywords: "bmi" },
      { path: "/obesity/glp1-dosing", label: "GLP-1 Doses & Schedules", icon: Syringe, keywords: "semaglutide tirzepatide" },
      { path: "/glp1-screening", label: "GLP-1 Screening", icon: Eye, keywords: "naion retinopathy" },
    ],
  },
  {
    id: "renal-blood",
    label: "Renal, blood & electrolytes",
    items: [
      { path: "/aki-criteria", label: "AKI / AKD Criteria", icon: Activity, keywords: "kdigo rifle" },
      { path: "/renal-dosing", label: "Renal", icon: Filter, keywords: "egfr dosing" },
      { path: "/gfr-calculator", label: "eGFR Calculator", icon: Calculator, keywords: "ckd-epi bsa" },
      { path: "/anemia", label: "Blood", icon: Droplet, keywords: "anemia iron" },
      { path: "/anemia?tab=anemia", label: "Anemia Evaluator", icon: Droplet },
      { path: "/anemia?tab=thrombocytopenia", label: "Thrombocytopenia", icon: Bandage },
      { path: "/anemia?tab=bleeding-clotting", label: "Bleeding / Clotting", icon: Bandage },
      { path: "/anemia?tab=iron", label: "Iron Parameters", icon: Syringe },
      { path: "/anemia?tab=ganzoni", label: "Ganzoni Deficit", icon: Calculator },
      { path: "/anemia?tab=esr", label: "ESR", icon: Timer },
      { path: "/anemia?tab=erythrocytosis", label: "Erythrocytosis / PV", icon: Droplet },
      { path: "/anemia?tab=anticoagulants", label: "Anticoagulants", icon: Pill },
      { path: "/electrolytes", label: "Electrolytes", icon: Zap },
      { path: "/hyponatremia", label: "Hyponatremia", icon: Droplet },
      { path: "/hypernatremia", label: "Hypernatremia", icon: Thermometer },
      { path: "/hyperkalemia", label: "Hyperkalemia", icon: Zap },
      { path: "/hypokalemia", label: "Hypokalemia", icon: Zap },
      { path: "/hypocalcemia", label: "Hypocalcemia", icon: Bone },
      { path: "/hypercalcemia", label: "Hypercalcemia", icon: Flame },
      { path: "/hypomagnesemia", label: "Hypomagnesemia", icon: Bone },
      { path: "/hypermagnesemia", label: "Hypermagnesemia", icon: Gem },
      { path: "/hypophosphatemia", label: "Hypophosphatemia", icon: Bone },
      { path: "/hyperphosphatemia", label: "Hyperphosphatemia", icon: Gem },
    ],
  },
  {
    id: "general",
    label: "Respiratory, infection & general",
    items: [
      { path: "/respiratory", label: "Asthma and COPD", icon: AirVent, keywords: "gold" },
      { path: "/fatigue", label: "Fatigue", icon: Moon },
      { path: "/infections", label: "Infections", icon: Bug },
      { path: "/acute-diarrhoea", label: "Diarrhoea and constipation", icon: UtensilsCrossed },
      { path: "/food-poisoning", label: "Food Poisoning", icon: UtensilsCrossed },
      { path: "/pep", label: "Post exposure prophylaxis (PEP)", icon: Shield },
      { path: "/adult-vaccinations", label: "Vaccinations", icon: Syringe },
      { path: "/vitamin-d", label: "Vitamin D", icon: Sun },
      { path: "/geriatrics", label: "Geriatrics", icon: User },
      { path: "/frailty-calculator", label: "Frailty Calculator", icon: User },
      { path: "/vaccine-calculator", label: "Vaccine Calculator", icon: Syringe },
      { path: "/perioperative-calculators", label: "Perioperative Tools", icon: Stethoscope, keywords: "rcri asa mallampati" },
    ],
  },
  {
    id: "womens-health",
    label: "Women's health",
    items: [
      { path: "/women-health?tab=pmos", label: "PMOS / PCOS", icon: Stethoscope },
      { path: "/women-health?tab=hrt", label: "HRT Algorithm", icon: Heart },
    ],
  },
  {
    id: "reference",
    label: "Reference",
    items: [
      { path: "/images", label: "Images", icon: Image, keywords: "figures diagrams" },
      { path: "/glossary", label: "Clinical Glossary", icon: BookOpen },
    ],
  },
];
