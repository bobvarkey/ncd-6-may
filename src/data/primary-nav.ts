import type { LucideIcon } from "lucide-react";
import {
  Activity, AirVent, Bandage, BookOpen, Bone, Bug, Calculator, Dna, Droplet, Droplets,
  Eye, Filter, Flame, Gem, Heart, Image, Microscope, Moon, Pill, Search, Shield,
  Stethoscope, Sun, Syringe, Thermometer, Timer, User, UtensilsCrossed, Weight, Zap,
} from "lucide-react";
import type { EntryTone } from "@/lib/entry-tones";

export type PrimaryNavItem = {
  path: string;
  label: string;
  icon: LucideIcon;
  tone: EntryTone;
  keywords?: string;
};

export type PrimaryNavSection = {
  id: string;
  label: string;
  tone: EntryTone;
  items: PrimaryNavItem[];
};

/** Destinations previously exposed by the left TabNavigation sidebar. */
export const PRIMARY_NAV_SECTIONS: PrimaryNavSection[] = [
  {
    id: "core",
    label: "Cardiometabolic & endocrine",
    tone: "rose",
    items: [
      { path: "/diabetes", label: "Diabetes", icon: Droplets, tone: "teal", keywords: "ada glucose insulin" },
      { path: "/hypertension", label: "Hypertension", icon: Heart, tone: "rose", keywords: "bp esc" },
      { path: "/hypertension/secondary-htn", label: "Secondary HTN", icon: Search, tone: "fuchsia", keywords: "workup" },
      { path: "/lipids", label: "Lipids", icon: Droplet, tone: "amber", keywords: "ascvd ldl" },
      { path: "/liver", label: "Liver", icon: Dna, tone: "lime", keywords: "masld nafld" },
      { path: "/liver/auto-calc", label: "Liver Auto-Calc", icon: Calculator, tone: "emerald" },
      { path: "/thyroid", label: "Thyroid", icon: Microscope, tone: "orange", keywords: "tsh" },
      { path: "/obesity/bmi-calculator", label: "Body weight issues", icon: Weight, tone: "violet", keywords: "bmi" },
      { path: "/obesity/glp1-dosing", label: "GLP-1 Doses & Schedules", icon: Syringe, tone: "indigo", keywords: "semaglutide tirzepatide" },
      { path: "/glp1-screening", label: "GLP-1 Screening", icon: Eye, tone: "sky", keywords: "naion retinopathy" },
    ],
  },
  {
    id: "renal-blood",
    label: "Renal, blood & electrolytes",
    tone: "orange",
    items: [
      { path: "/aki-criteria", label: "AKI / AKD Criteria", icon: Activity, tone: "orange", keywords: "kdigo rifle" },
      { path: "/renal-dosing", label: "Renal", icon: Filter, tone: "amber", keywords: "egfr dosing" },
      { path: "/gfr-calculator", label: "eGFR Calculator", icon: Calculator, tone: "cyan", keywords: "ckd-epi bsa" },
      { path: "/anemia", label: "Blood", icon: Droplet, tone: "rose", keywords: "anemia iron" },
      { path: "/anemia?tab=anemia", label: "Anemia Evaluator", icon: Droplet, tone: "fuchsia" },
      { path: "/anemia?tab=thrombocytopenia", label: "Thrombocytopenia", icon: Bandage, tone: "violet" },
      { path: "/anemia?tab=bleeding-clotting", label: "Bleeding / Clotting", icon: Bandage, tone: "orange" },
      { path: "/anemia?tab=iron", label: "Iron Parameters", icon: Syringe, tone: "amber" },
      { path: "/anemia?tab=ganzoni", label: "Ganzoni Deficit", icon: Calculator, tone: "teal" },
      { path: "/anemia?tab=esr", label: "ESR", icon: Timer, tone: "slate" },
      { path: "/anemia?tab=erythrocytosis", label: "Erythrocytosis / PV", icon: Droplet, tone: "rose" },
      { path: "/anemia?tab=anticoagulants", label: "Anticoagulants", icon: Pill, tone: "indigo" },
      { path: "/electrolytes", label: "Electrolytes", icon: Zap, tone: "violet" },
      { path: "/hyponatremia", label: "Hyponatremia", icon: Droplet, tone: "sky" },
      { path: "/hypernatremia", label: "Hypernatremia", icon: Thermometer, tone: "orange" },
      { path: "/hyperkalemia", label: "Hyperkalemia", icon: Zap, tone: "rose" },
      { path: "/hypokalemia", label: "Hypokalemia", icon: Zap, tone: "lime" },
      { path: "/hypocalcemia", label: "Hypocalcemia", icon: Bone, tone: "teal" },
      { path: "/hypercalcemia", label: "Hypercalcemia", icon: Flame, tone: "amber" },
      { path: "/hypomagnesemia", label: "Hypomagnesemia", icon: Bone, tone: "cyan" },
      { path: "/hypermagnesemia", label: "Hypermagnesemia", icon: Gem, tone: "indigo" },
      { path: "/hypophosphatemia", label: "Hypophosphatemia", icon: Bone, tone: "lime" },
      { path: "/hyperphosphatemia", label: "Hyperphosphatemia", icon: Gem, tone: "fuchsia" },
    ],
  },
  {
    id: "general",
    label: "Respiratory, infection & general",
    tone: "cyan",
    items: [
      { path: "/respiratory", label: "Asthma and COPD", icon: AirVent, tone: "cyan", keywords: "gold" },
      { path: "/fatigue", label: "Fatigue", icon: Moon, tone: "slate" },
      { path: "/infections", label: "Infections", icon: Bug, tone: "rose" },
      { path: "/acute-diarrhoea", label: "Diarrhoea and constipation", icon: UtensilsCrossed, tone: "amber" },
      { path: "/food-poisoning", label: "Food Poisoning", icon: UtensilsCrossed, tone: "orange" },
      { path: "/pep", label: "Post exposure prophylaxis (PEP)", icon: Shield, tone: "indigo" },
      { path: "/adult-vaccinations", label: "Vaccinations", icon: Syringe, tone: "teal" },
      { path: "/vitamin-d", label: "Vitamin D", icon: Sun, tone: "amber" },
      { path: "/geriatrics", label: "Geriatrics", icon: User, tone: "violet" },
      { path: "/frailty-calculator", label: "Frailty Calculator", icon: User, tone: "fuchsia" },
      { path: "/vaccine-calculator", label: "Vaccine Calculator", icon: Syringe, tone: "emerald" },
      { path: "/perioperative-calculators", label: "Perioperative Tools", icon: Stethoscope, tone: "indigo", keywords: "rcri asa mallampati" },
    ],
  },
  {
    id: "womens-health",
    label: "Women's health",
    tone: "fuchsia",
    items: [
      { path: "/women-health?tab=pmos", label: "PMOS / PCOS", icon: Stethoscope, tone: "fuchsia" },
      { path: "/women-health?tab=hrt", label: "HRT Algorithm", icon: Heart, tone: "rose" },
    ],
  },
  {
    id: "reference",
    label: "Reference",
    tone: "slate",
    items: [
      { path: "/images", label: "Images", icon: Image, tone: "sky", keywords: "figures diagrams" },
      { path: "/glossary", label: "Clinical Glossary", icon: BookOpen, tone: "slate" },
    ],
  },
];
