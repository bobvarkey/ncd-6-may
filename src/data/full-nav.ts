import {
  Activity, AlertTriangle, ArrowRight, Bean, BookMarked, BookOpen, Brain, Calculator,
  CalendarDays, Droplet, Eye, FileText, FlaskConical, HeartPulse, LayoutDashboard,
  MessageSquare, Pill, Pizza, Scale, Settings, Shield, ShieldAlert, Stethoscope, Syringe,
  TableProperties, Trash2, TrendingDown, TriangleAlert, User, UtensilsCrossed,
} from "lucide-react";
import type { PrimaryNavSection } from "@/data/primary-nav";

/**
 * Destinations from the app-wide sidebar that are not clinical content sections:
 * account, patient data, medications, and the legal pages.
 *
 * Several of these appear in PRIMARY_NAV_SECTIONS too. That overlap is resolved once,
 * at render time, by AllNavigation's merge, so this list stays a faithful copy of the
 * sidebar rather than a hand-pruned variant of it.
 *
 * The Image Gallery is the one deliberate omission: AllNavigation lifts it out and
 * renders it as its own always-visible entry.
 */
export const FULL_NAV_SECTIONS: PrimaryNavSection[] = [
  {
    id: "overview",
    label: "Overview",
    tone: "orange",
    icon: LayoutDashboard,
    items: [
      { path: "/", label: "Dashboard", icon: LayoutDashboard, tone: "orange" },
      { path: "/patient", label: "Patient", icon: User, tone: "sky" },
      { path: "/summary", label: "Summary", icon: FileText, tone: "violet" },
      { path: "/progress", label: "Progress", icon: TrendingDown, tone: "teal" },
      { path: "/settings", label: "Settings", icon: Settings, tone: "slate", keywords: "offline mode theme dark light text size accessibility sync" },
    ],
  },
  {
    id: "diet",
    label: "Diet & Lifestyle",
    tone: "amber",
    icon: UtensilsCrossed,
    items: [
      { path: "/foods", label: "Foods", icon: UtensilsCrossed, tone: "amber" },
      { path: "/plate", label: "Plate Method", icon: Pizza, tone: "lime" },
      { path: "/diet-plan", label: "Diet Plan", icon: CalendarDays, tone: "orange" },
    ],
  },
  {
    id: "medications",
    label: "Medications & Insulin",
    tone: "fuchsia",
    icon: Pill,
    items: [
      { path: "/medications", label: "Medications", icon: Pill, tone: "fuchsia" },
      { path: "/insulin-titration", label: "Insulin Titration", icon: Syringe, tone: "rose", keywords: "basal bolus" },
      { path: "/sliding-scale", label: "Sliding Scale Insulin", icon: TableProperties, tone: "orange" },
      { path: "/anemia?tab=iron", label: "Iron Calculator", icon: Syringe, tone: "amber", keywords: "ferritin tsat ganzoni iron deficit" },
      { path: "/steroid-taper", label: "Steroid Taper", icon: TrendingDown, tone: "orange", keywords: "glucocorticoid prednisolone adrenal insufficiency hpa cortisol" },
      { path: "/glp1-administration", label: "GLP-1 Administration", icon: Droplet, tone: "indigo", keywords: "semaglutide tirzepatide" },
      { path: "/drug-schedule", label: "Drug Schedule", icon: CalendarDays, tone: "violet", keywords: "schedule dates injection sites side effects semaglutide tirzepatide" },
      { path: "/drug-calculator", label: "Drug Calculator", icon: Calculator, tone: "sky", keywords: "glp1 dose weight bmi titration injection sites semaglutide tirzepatide" },
      { path: "/glp1-screening", label: "GLP-1 Screening", icon: Eye, tone: "cyan", keywords: "prescreen pre-screen eligibility contraindication naion optic nerve glaucoma retinopathy semaglutide tirzepatide" },
      { path: "/glp1-prescreen", label: "GLP-1 Pre-Initiation Screener", icon: Syringe, tone: "emerald", keywords: "glp1 prescreening pre-initiation wizard mtc men2 pancreatitis scoff eating disorder dpp4 hypoglycaemia sarcopenia referral" },
      { path: "/insulin-therapy", label: "Insulin Therapy", icon: BookMarked, tone: "rose" },
    ],
  },
  {
    id: "risk",
    label: "Risk & Renal",
    tone: "indigo",
    icon: ShieldAlert,
    items: [
      { path: "/prediabetes", label: "Prediabetes", icon: HeartPulse, tone: "amber" },
      { path: "/hypo-risk", label: "Hypo Risk Score", icon: ShieldAlert, tone: "rose" },
      { path: "/renal-dosing", label: "Renal Dosing", icon: FlaskConical, tone: "orange", keywords: "egfr ckd mehran pci cin" },
      { path: "/gfr-calculator", label: "KDIGO eGFR", icon: Calculator, tone: "cyan", keywords: "ckd-epi bsa kidney function" },
      { path: "/ckd-guideline", label: "CKD Guideline", icon: Bean, tone: "cyan", keywords: "kdigo" },
    ],
  },
  {
    id: "algorithms",
    label: "Algorithms & Guides",
    tone: "orange",
    icon: BookOpen,
    items: [
      { path: "/daily-management", label: "Daily Management", icon: BookOpen, tone: "orange" },
      { path: "/type1-management", label: "Type 1 DM", icon: Activity, tone: "teal" },
      { path: "/type1-pitfalls", label: "T1D Pitfalls", icon: TriangleAlert, tone: "rose" },
      { path: "/type2-transition", label: "T2D Transition", icon: ArrowRight, tone: "violet" },
      { path: "/type1-treatment-algorithm", label: "T1D Treatment Algorithm", icon: Brain, tone: "indigo" },
      { path: "/type2-treatment-algorithm", label: "T2D Treatment Algorithm", icon: Brain, tone: "sky" },
      { path: "/hyperglycemic-emergency", label: "Hyperglycemic Emergency", icon: AlertTriangle, tone: "fuchsia", keywords: "dka hhs" },
    ],
  },
  {
    id: "perioperative",
    label: "Perioperative & Acute",
    tone: "teal",
    icon: Stethoscope,
    items: [
      { path: "/perioperative-calculators", label: "Perioperative Scores", icon: Stethoscope, tone: "indigo", keywords: "rcri asa mallampati caprini apgar stop-bang" },
      { path: "/perioperative-calculators#csdh", label: "cSDH", icon: Brain, tone: "violet", keywords: "chronic subdural hematoma perioperative plan neurosurgery" },
      { path: "/aki-criteria", label: "AKI / AKD Criteria", icon: Activity, tone: "orange", keywords: "acute kidney injury renal kdigo rifle akd" },
    ],
  },
  {
    id: "legal",
    label: "Legal & Support",
    tone: "slate",
    icon: Shield,
    items: [
      { path: "/feedback", label: "Feedback & Tips", icon: MessageSquare, tone: "sky" },
      { path: "/disclaimer", label: "Disclaimer", icon: TriangleAlert, tone: "amber" },
      { path: "/privacy", label: "Privacy Policy", icon: Shield, tone: "indigo" },
      { path: "/terms", label: "Terms of Service", icon: Scale, tone: "slate" },
      { path: "/delete-account", label: "Delete My Data", icon: Trash2, tone: "rose" },
    ],
  },
];
