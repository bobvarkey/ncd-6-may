import { useMemo, useState, type ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Syringe, Shield, Clock, Copy, Download, AlertTriangle, Info,
  CheckCircle2, XCircle, AlertCircle, ChevronDown, ChevronUp,
} from "lucide-react";
import { downloadTextFile } from "@/lib/clinical-utils";
import { toast } from "sonner";
import ZoomableImage from "@/components/ZoomableImage";
import vaccinesLiveVsInactivatedAsset from "@/assets/vaccines-live-vs-inactivated.png.asset.json";

// ══════════════════════════════════════════════
// Vaccine Data Schema
// ══════════════════════════════════════════════

type VaccineSchedule = {
  dose_schedule?: string;
  doses?: number;
  interval?: string;
};

type ImplementationGuidance = {
  age_restriction?: string;
  pre_vaccination_testing?: string;
  dose_schedule?: string;
  special_notes?: string;
};

type Vaccine = {
  id: string;
  name: string;
  type: "live-attenuated" | "inactivated" | "inactivated/recombinant" | "inactivated/conjugate and polysaccharide" | "inactivated/non-replicating (platform-dependent)";
  age_min: number;
  age_max: number | null;
  routine_adult_schedule: string;
  timing_before_immunosuppression?: string;
  timing_before_travel?: string;
  contraindications: string[];
  notes: string;
  recommendation: "ESSENTIAL" | "RECOMMENDED" | "CONSIDER" | "CONTRAINDICATED";
  implementation_guidance?: ImplementationGuidance;
};

// ─── Vaccine Database ───
const VACCINES: Vaccine[] = [
  {
    id: "mmr",
    name: "MMR (Measles, Mumps, Rubella)",
    type: "live-attenuated",
    age_min: 18,
    age_max: null,
    routine_adult_schedule: "Single dose if non-immune; second dose per catch-up rules",
    timing_before_immunosuppression: "At least 6 weeks before initiating immunosuppression",
    contraindications: ["Severe immunosuppression", "Pregnancy"],
    notes: "Live vaccine — contraindicated after immunosuppression; verify serology if unknown",
    recommendation: "ESSENTIAL"
  },
  {
    id: "varicella",
    name: "Varicella (Chickenpox)",
    type: "live-attenuated",
    age_min: 18,
    age_max: null,
    routine_adult_schedule: "2 doses, 4–8 weeks apart if non-immune",
    timing_before_immunosuppression: "At least 6 weeks before initiating immunosuppression",
    contraindications: ["Severe immunosuppression", "Pregnancy"],
    notes: "Live vaccine — high risk of severe VZV disease when given during immunosuppression",
    recommendation: "ESSENTIAL"
  },
  {
    id: "yellow_fever",
    name: "Yellow Fever",
    type: "live-attenuated",
    age_min: 18,
    age_max: null,
    routine_adult_schedule: "Single dose; booster per country rules",
    timing_before_travel: "At least 6 weeks before travel",
    timing_before_immunosuppression: "At least 6 weeks before initiating immunosuppression",
    contraindications: ["Severe immunosuppression", "Certain egg allergies (check product)"],
    notes: "Use only when travel risk warrants; weigh risks in older adults",
    recommendation: "CONSIDER"
  },
  {
    id: "laiv_flu_mist",
    name: "LAIV (Live intranasal influenza, FluMist)",
    type: "live-attenuated",
    age_min: 18,
    age_max: null,
    routine_adult_schedule: "Not routinely used in adults; single seasonal dose where indicated",
    timing_before_immunosuppression: "At least 4 weeks before initiating immunosuppression",
    contraindications: ["Severe immunosuppression", "Pregnancy"],
    notes: "Intranasal live vaccine; most adult programs use inactivated injectable seasonal influenza instead",
    recommendation: "RECOMMENDED"
  },
  {
    id: "influenza_inactivated",
    name: "Influenza (Injectable, inactivated - seasonal quadrivalent)",
    type: "inactivated",
    age_min: 18,
    age_max: null,
    routine_adult_schedule: "Annual single dose each influenza season; high-dose or adjuvanted formulations for older adults as per local guidance",
    timing_before_immunosuppression: "Preferably at least 2 weeks before initiating immunosuppression",
    contraindications: ["Severe allergy to vaccine component"],
    notes: "Strong annual recommendation for immunocompromised and adults at risk",
    recommendation: "ESSENTIAL"
  },
  {
    id: "covid19_mrna_protein",
    name: "COVID-19 (mRNA / protein-based vaccines)",
    type: "inactivated/non-replicating (platform-dependent)",
    age_min: 18,
    age_max: null,
    routine_adult_schedule: "Primary series per product; boosters per current guidance",
    timing_before_immunosuppression: "At least 2 weeks before starting immunosuppression for primary series; boosters ideally ≥4 weeks before",
    contraindications: ["Severe allergy to vaccine component"],
    notes: "Primary series and boosters are critical prior to immunosuppression to optimize protection",
    recommendation: "ESSENTIAL"
  },
  {
    id: "pneumococcal",
    name: "Pneumococcal (PCV20 / PCV21 or PCV15 + PPSV23)",
    type: "inactivated/conjugate and polysaccharide",
    age_min: 18,
    age_max: null,
    routine_adult_schedule: "Single dose PCV20/21 OR PCV15 followed by PPSV23 per interval guidance; additional doses for certain high-risk groups",
    timing_before_immunosuppression: "At least 2 weeks before initiating immunosuppression",
    contraindications: ["Severe allergy to vaccine component"],
    notes: "Recommended for all immunocompromised adults; choice of schedule depends on product availability",
    recommendation: "ESSENTIAL"
  },
  {
    id: "hepatitis_b",
    name: "Hepatitis B",
    type: "inactivated/recombinant",
    age_min: 18,
    age_max: null,
    routine_adult_schedule: "Typical series 0, 1, 6 months (or accelerated/2-dose depending on product)",
    timing_before_immunosuppression: "Start and preferably complete series before B-cell depleting therapy; at least 4 weeks before first dose advised in some protocols",
    contraindications: ["Severe allergy to vaccine component"],
    notes: "Screen for HBsAg/anti-HBs pre-therapy when possible; ensure immunity before anti-CD20 therapies",
    recommendation: "ESSENTIAL"
  },
  {
    id: "hepatitis_a",
    name: "Hepatitis A",
    type: "inactivated",
    age_min: 18,
    age_max: null,
    routine_adult_schedule: "Two-dose series, 0 and 6–12 months (product-dependent)",
    timing_before_immunosuppression: "At least 2–4 weeks before initiating immunosuppression if feasible",
    contraindications: ["Severe allergy to vaccine component"],
    notes: "Consider for travel to endemic areas or for those with liver disease",
    recommendation: "RECOMMENDED"
  },
  {
    id: "tdap",
    name: "Tdap (Tetanus, Diphtheria, Pertussis)",
    type: "inactivated",
    age_min: 18,
    age_max: null,
    routine_adult_schedule: "One dose of Tdap as adult booster if not previously received, then Td/Tdap every 10 years as needed",
    timing_before_immunosuppression: "Ideally before starting immunosuppression (booster timing per routine)",
    contraindications: ["Severe allergy to vaccine component"],
    notes: "Adult booster recommended; important for wound management and maternal vaccination during pregnancy",
    recommendation: "ESSENTIAL"
  },
  {
    id: "meningococcal_menacwy",
    name: "Meningococcal (MenACWY)",
    type: "inactivated/conjugate and polysaccharide",
    age_min: 18,
    age_max: null,
    routine_adult_schedule: "Single or two-dose series in specific risk groups; booster per risk/exposure",
    timing_before_immunosuppression: "At least 2 weeks before initiating immunosuppression",
    contraindications: ["Severe allergy to vaccine component"],
    notes: "Recommend for complement deficiency, asplenia, or outbreak exposure",
    recommendation: "CONSIDER"
  },
  {
    id: "hpv",
    name: "HPV (Human Papillomavirus)",
    type: "inactivated/recombinant",
    age_min: 18,
    age_max: 45,
    routine_adult_schedule: "2 doses (if started <15y: 0, 6–12 months) or 3 doses (if started 15–45y: 0, 1–2, 6 months)",
    timing_before_immunosuppression: "At least 2 weeks before initiating immunosuppression if possible",
    contraindications: ["Severe allergy to vaccine component", "Pregnancy (not recommended during pregnancy)"],
    notes: "Catch-up vaccination recommended for all adults 19–26 not vaccinated as teens. For ages 27–45, shared clinical decision-making based on risk factors (new partners, sexual history). Protects against HPV types causing cervical, vaginal, vulvar, anal, and throat cancers plus genital warts. Even if exposed to one strain, protects against other high-risk strains. Gardasil 9 is the available formulation.",
    recommendation: "RECOMMENDED",
    implementation_guidance: {
      age_restriction: "18–45 years; catch-up strongly recommended for 19–26; shared decision-making for 27–45",
      pre_vaccination_testing: "Not required — no serological or HPV DNA testing needed before vaccination",
      dose_schedule: "<15y at start: 2 doses (0, 6–12 months). 15–45y at start: 3 doses (0, 1–2, 6 months)",
      special_notes: "Gardasil 9 (9-valent) is the standard. Not recommended during pregnancy. Can be given regardless of prior HPV exposure. Available via CDC Vaccine Finder (US) or local pharmacies/private providers (India)."
    }
  },
  {
    id: "herpes_zoster_shingrix",
    name: "Herpes Zoster (Shingrix, recombinant)",
    type: "inactivated/recombinant",
    age_min: 18,
    age_max: null,
    routine_adult_schedule: "Two-dose series, 2–6 months apart (may be shortened to 1–2 months in immunocompromised)",
    timing_before_immunosuppression: "Preferably at least 2 weeks before initiating immunosuppression",
    contraindications: ["Severe allergy to vaccine component"],
    notes: "Recombinant (non-live) vaccine — safe for many immunocompromised adults and strongly recommended",
    recommendation: "ESSENTIAL",
    implementation_guidance: {
      age_restriction: "≥18 years if immunocompromised; ≥50 years for routine immunocompetent adults",
      dose_schedule: "Standard (CDC/ACIP): 2 doses (0.5 mL IM each). Preferred interval 2–6 months after dose 1. Shortened interval 1–2 months is allowed and often preferred in immunocompromised patients to complete the series faster (e.g., before starting rituximab/anti-CD20 or other therapies, or to avoid periods of intense immunosuppression).",
      special_notes: "Practical considerations for mAb patients: Response may be blunted if given soon after a recent mAb dose — especially anti-CD20 therapies (rituximab, ocrelizumab) which deplete B cells. When possible, give closer to the end of the dosing interval (e.g., ~4 weeks before the next infusion). Use the shortened 1–2 month interval between doses for immunocompromised patients when appropriate. Still worth giving even if the response is suboptimal — it provides meaningful protection for many patients."
    }
  },
  {
    id: "japanese_encephalitis",
    name: "Japanese Encephalitis",
    type: "inactivated",
    age_min: 18,
    age_max: null,
    routine_adult_schedule: "2-dose primary series (product-dependent) with boosters per travel exposure guidance",
    timing_before_travel: "At least 1 week (product-dependent) before travel to endemic areas",
    contraindications: ["Severe allergy to vaccine component"],
    notes: "Recommend for travelers to endemic rural/long-stay destinations",
    recommendation: "CONSIDER"
  },
  {
    id: "rabies",
    name: "Rabies (pre- and post-exposure)",
    type: "inactivated",
    age_min: 18,
    age_max: null,
    routine_adult_schedule: "Pre-exposure: 2–3 doses depending on product; Post-exposure: wound care + vaccine series with/without rabies immunoglobulin per protocol",
    timing_before_travel: "Pre-exposure series may be given before travel to endemic areas",
    contraindications: ["Severe allergy to vaccine component"],
    notes: "Standard protocol for post-exposure prophylaxis irrespective of immune status; consult specialist for immunocompromised",
    recommendation: "CONSIDER"
  },
  {
    id: "dengue_qdenga",
    name: "Dengue (Qdenga/TAK-003 — India Approved)",
    type: "live-attenuated",
    age_min: 4,
    age_max: 60,
    routine_adult_schedule: "Two-dose series administered 3 months apart; protects against all four dengue serotypes",
    timing_before_immunosuppression: "Contraindicated in severe immunosuppression; consult specialist for timing",
    timing_before_travel: "Complete series before travel to endemic areas if feasible",
    contraindications: ["Severe immunosuppression", "Pregnancy", "Breastfeeding", "Severe allergy to vaccine component"],
    notes: "India approved Qdenga (TAK-003) in 2024 for ages 4-60. NO prior dengue testing required (unlike Dengvaxia). Highly effective against DENV-2, lower efficacy against DENV-3/DENV-4 in dengue-naïve individuals. Safe for both dengue-naïve and previously infected individuals.",
    recommendation: "CONSIDER",
    implementation_guidance: {
      age_restriction: "Approved in India for ages 4-60 years",
      pre_vaccination_testing: "NOT required for Qdenga (unlike Dengvaxia) — safe for both dengue-naïve and previously infected individuals",
      dose_schedule: "2 doses, 3 months apart",
      special_notes: "India's first approved dengue vaccine (DCGI/Subject Expert Committee cleared). No pre-vaccination serostatus testing needed. Efficacy ~84% against DENV-2, lower against DENV-3/DENV-4 (~50-65%) in seronegative individuals. Dengvaxia requires prior infection documentation and is NOT approved in India."
    }
  },
  {
    id: "dengue_dengvaxia",
    name: "Dengue (Dengvaxia — NOT Available in India)",
    type: "live-attenuated",
    age_min: 9,
    age_max: 16,
    routine_adult_schedule: "Three-dose series at 0, 6, and 12 months (only for laboratory-confirmed prior dengue infection)",
    timing_before_immunosuppression: "Contraindicated in immunosuppressed individuals",
    contraindications: ["No laboratory evidence of prior dengue infection", "Severe immunosuppression", "Pregnancy", "Breastfeeding", "Age >16 years (outside approved indication)"],
    notes: "NOT approved in India. Requires proof of prior dengue infection (serology or documented history). Risk of severe dengue if given to dengue-naïve persons. Limited adult use in some jurisdictions with strict prior-infection requirements.",
    recommendation: "CONTRAINDICATED",
    implementation_guidance: {
      age_restriction: "Approved for 9-16 years in most jurisdictions; adult use off-label and restricted",
      pre_vaccination_testing: "MANDATORY — must document prior dengue infection via serology or documented history",
      dose_schedule: "3 doses at 0, 6, 12 months",
      special_notes: "⚠ CRITICAL: Do NOT vaccinate dengue-seronegative individuals — risk of severe dengue. NOT available in India. Use Qdenga instead."
    }
  }
];

// ══════════════════════════════════════════════
// Patient Categories
// ══════════════════════════════════════════════

type PatientCategory = {
  id: string;
  label: string;
  description: string;
  icon: string;
  vaccineIds: string[];
};

const PATIENT_CATEGORIES: PatientCategory[] = [
  {
    id: "elderly",
    label: "Elderly (≥65 years)",
    description: "Age-related immune senescence — prioritise high-dose/adjuvanted formulations",
    icon: "👴",
    vaccineIds: ["influenza_inactivated", "pneumococcal", "herpes_zoster_shingrix", "covid19_mrna_protein", "tdap"]
  },
  {
    id: "immunocompromised",
    label: "Immunocompromised",
    description: "Primary/secondary immunodeficiency, transplant, chemotherapy, biologics",
    icon: "🛡️",
    vaccineIds: ["pneumococcal", "influenza_inactivated", "covid19_mrna_protein", "hepatitis_b", "herpes_zoster_shingrix", "meningococcal_menacwy", "tdap"]
  },
  {
    id: "pre_mab",
    label: "Pre-Monoclonal Antibody / Biologic Therapy",
    description: "Complete vaccine series before B-cell depleting therapy (anti-CD20, etc.)",
    icon: "💉",
    vaccineIds: ["hepatitis_b", "pneumococcal", "influenza_inactivated", "covid19_mrna_protein", "tdap", "herpes_zoster_shingrix", "mmr", "varicella"]
  },
  {
    id: "pregnancy",
    label: "Pregnancy",
    description: "Vaccines recommended during or before pregnancy for maternal/neonatal protection",
    icon: "🤰",
    vaccineIds: ["tdap", "influenza_inactivated", "covid19_mrna_protein"]
  },
  {
    id: "healthy_adult",
    label: "Healthy Adult (18–64)",
    description: "Routine adult immunisation for general population without special risks",
    icon: "✅",
    vaccineIds: ["tdap", "hpv", "influenza_inactivated", "covid19_mrna_protein"]
  },
  {
    id: "chronic_disease",
    label: "Chronic Disease (DM / CLD / CKD / Heart Disease)",
    description: "Chronic medical conditions that increase vaccine-preventable disease risk",
    icon: "🏥",
    vaccineIds: ["pneumococcal", "influenza_inactivated", "covid19_mrna_protein", "hepatitis_b", "herpes_zoster_shingrix", "tdap"]
  },
  {
    id: "healthcare_worker",
    label: "Healthcare Worker",
    description: "Occupational exposure risk — protect self and patients",
    icon: "👨‍⚕️",
    vaccineIds: ["influenza_inactivated", "covid19_mrna_protein", "hepatitis_b", "mmr", "varicella", "tdap"]
  },
  {
    id: "asplenia",
    label: "Asplenia / Hyposplenism",
    description: "High risk of encapsulated bacterial infection — pneumococcal + meningococcal critical",
    icon: "🫀",
    vaccineIds: ["pneumococcal", "meningococcal_menacwy", "influenza_inactivated", "covid19_mrna_protein", "tdap"]
  },
  {
    id: "travel",
    label: "Travel to Endemic Areas",
    description: "Destination-specific vaccines for international travel",
    icon: "✈️",
    vaccineIds: ["hepatitis_a", "yellow_fever", "japanese_encephalitis", "rabies", "dengue_qdenga", "meningococcal_menacwy", "typhoid"]
  }
];

// ─── Helper functions ───

function getRecommendationBadge(recommendation: Vaccine["recommendation"]) {
  switch (recommendation) {
    case "ESSENTIAL":
      return <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30">ESSENTIAL</Badge>;
    case "RECOMMENDED":
      return <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/30">RECOMMENDED</Badge>;
    case "CONSIDER":
      return <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/30">CONSIDER</Badge>;
    case "CONTRAINDICATED":
      return <Badge className="bg-red-500/10 text-red-400 border-red-500/30">CONTRAINDICATED</Badge>;
  }
}

function getTypeBadge(type: Vaccine["type"]) {
  if (type.includes("live")) {
    return <Badge variant="outline" className="text-rose-400 border-rose-400/40">Live-attenuated</Badge>;
  }
  return <Badge variant="outline" className="text-sky-400 border-sky-400/40">Inactivated</Badge>;
}

function formatAgeRange(age_min: number, age_max: number | null): string {
  if (age_max === null) {
    return `${age_min}+ years`;
  }
  return `${age_min}–${age_max} years`;
}

// ─── Co-Administration Schedule Component ───

type SiteInjection = {
  site: string;
  icon: string;
  injections: { name: string; note?: string; details?: string[] }[];
};

type Visit = {
  label: string;
  timing: string;
  sites: SiteInjection[];
  note?: string;
};

const COADMIN6_VISITS: Visit[] = [
  {
    label: "Visit 1",
    timing: "Day 0 — Initial Doses",
    note: "All six vaccines are non-live and can be given the same day. Separate injections in the same muscle by ≥2.5 cm (1 inch).",
    sites: [
      {
        site: "Left Deltoid",
        icon: "💪",
        injections: [
          { name: "Influenza", note: "1 dose" },
          { name: "PCV20", note: "1 dose" },
        ],
      },
      {
        site: "Right Deltoid",
        icon: "💪",
        injections: [
          { name: "Shingrix", note: "Dose 1 of 2" },
          { name: "Tdap / DPT", note: "1 dose" },
        ],
      },
      {
        site: "Left Thigh (Vastus Lateralis)",
        icon: "🦵",
        injections: [{ name: "Hepatitis A", note: "Dose 1 of 2" }],
      },
      {
        site: "Right Thigh (Vastus Lateralis)",
        icon: "🦵",
        injections: [{ name: "Hepatitis B", note: "Dose 1" }],
      },
    ],
  },
  {
    label: "Visit 2",
    timing: "Month 1 (4 weeks after Visit 1)",
    note: "Accelerates protection before or during active mAb/steroid therapy. CDC permits shortening the Shingrix interval to 1–2 months for immunocompromised patients.",
    sites: [
      {
        site: "Left Deltoid",
        icon: "💪",
        injections: [{ name: "Shingrix", note: "Dose 2 of 2" }],
      },
      {
        site: "Right Deltoid",
        icon: "💪",
        injections: [{ name: "Hepatitis B", note: "Dose 2 — series complete if using 2-dose Heplisav-B" }],
      },
    ],
  },
  {
    label: "Visit 3",
    timing: "Month 6 (6 months after Visit 1)",
    note: "Completes the long-term protection series.",
    sites: [
      {
        site: "Left Deltoid",
        icon: "💪",
        injections: [{ name: "Hepatitis A", note: "Dose 2 of 2 — completes series" }],
      },
      {
        site: "Right Deltoid",
        icon: "💪",
        injections: [{ name: "Hepatitis B", note: "Dose 3 — only if using 3-dose (Engerix-B / Recombivax HB)" }],
      },
    ],
  },
];

const COADMIN8_VISITS: Visit[] = [
  {
    label: "Visit 1",
    timing: "Day 0 — Initial Doses",
    note: undefined,
    sites: [
      {
        site: "Left deltoid",
        icon: "💪",
        injections: [
          { name: "Influenza", note: "1 dose" },
          { name: "COVID-19 vaccine", note: "Current season/product/age-appropriate dose" },
        ],
      },
      {
        site: "Right deltoid",
        icon: "💪",
        injections: [
          { name: "Shingrix", note: "Dose 1 of 2" },
          { name: "Tdap/Td", note: "1 dose if indicated" },
        ],
      },
      {
        site: "Left thigh (vastus lateralis)",
        icon: "🦵",
        injections: [
          { name: "PCV20", note: "1 dose if indicated" },
          { name: "Hepatitis A", note: "Dose 1 of 2" },
        ],
      },
      {
        site: "Right thigh (vastus lateralis)",
        icon: "🦵",
        injections: [
          { name: "Hepatitis B", note: "Dose 1" },
          { name: "RSV vaccine", note: "1 dose if eligible" },
        ],
      },
    ],
  },
  {
    label: "Visit 2",
    timing: "Month 1–2",
    sites: [
      {
        site: "Left deltoid",
        icon: "💪",
        injections: [
          {
            name: "Shingrix",
            note: "Dose 2 of 2",
            details: [
              "Routine interval: 2–6 months after Dose 1",
              "If immunocompromised or immunosuppression is imminent: Dose 2 may be given 1–2 months after Dose 1",
            ],
          },
        ],
      },
      {
        site: "Right deltoid",
        icon: "💪",
        injections: [
          {
            name: "Hepatitis B",
            note: "Dose 2",
            details: ["Completes the series only if using 2-dose Heplisav-B"],
          },
        ],
      },
    ],
  },
  {
    label: "Visit 3",
    timing: "Month 6",
    note: "Completes the long-term protection series.",
    sites: [
      {
        site: "Left deltoid",
        icon: "💪",
        injections: [{ name: "Hepatitis A", note: "Dose 2 of 2" }],
      },
      {
        site: "Right deltoid",
        icon: "💪",
        injections: [
          {
            name: "Hepatitis B",
            note: "Dose 3",
            details: [
              "Required only for a 3-dose Hepatitis B product/schedule",
              "Examples: Engerix-B or Recombivax HB",
            ],
          },
        ],
      },
    ],
  },
];

const COADMIN8_IMPORTANT: string[] = [
  "RSV vaccine is generally a one-time dose for eligible adults, not an annual vaccine.",
  "COVID-19 dose number and timing must follow the current age-, product-, and immunocompromise-specific seasonal recommendations.",
  "If eight same-day injections are impractical or unacceptable, prioritize time-sensitive vaccination and schedule a near-term follow-up for the remainder.",
];

const COADMIN8_CAVEATS: { title: string; text: string }[] = [
  {
    title: "RSV eligibility",
    text: "Confirm age, pregnancy status, underlying risk factors, and current local/national policy before giving it. In the US, RSV vaccination is recommended based on age/risk or pregnancy timing; it is not universal for every adult.",
  },
  {
    title: "PCV20",
    text: "Usually completes the pneumococcal conjugate vaccination requirement in eligible adults, but verify past PCV13/PCV15/PPSV23 history.",
  },
  {
    title: "Hepatitis B",
    text: "Do not combine a Heplisav-B 2-dose schedule with an assumed 3-dose schedule; document the exact product and follow its interval rules.",
  },
  {
    title: "Reactogenicity",
    text: "Co-administration is permitted, but counsel that fever, fatigue, injection-site pain, myalgia, and malaise may be more noticeable when several reactogenic vaccines are given together. If the patient has limited tolerance or therapy timing permits, spacing non-urgent doses is reasonable.",
  },
  {
    title: "Immunosuppression",
    text: "Ideally administer vaccines before immunosuppressive therapy when possible, but do not unnecessarily delay indicated therapy; coordinate with the treating specialty.",
  },
];

const COADMIN2VISIT_A_VISITS: Visit[] = [
  {
    label: "Visit 1",
    timing: "Day 0 — Respiratory/PCV Priority",
    note: "Option A — respiratory/PCV priority. Use a separate injection site for each vaccine; if two vaccines share the same deltoid, separate by ≥2.5 cm (1 inch) and document the exact site.",
    sites: [
      {
        site: "Left deltoid",
        icon: "💪",
        injections: [
          { name: "Influenza", note: "1 dose" },
          { name: "COVID-19 vaccine", note: "Current indicated dose" },
        ],
      },
      {
        site: "Right deltoid",
        icon: "💪",
        injections: [
          { name: "RSV vaccine", note: "One dose if eligible" },
          { name: "PCV20", note: "One dose if indicated" },
        ],
      },
    ],
  },
  {
    label: "Visit 2",
    timing: "Day 7–14",
    sites: [
      {
        site: "Left deltoid",
        icon: "💪",
        injections: [
          { name: "Shingrix", note: "Dose 1 of 2" },
          { name: "Tdap/Td", note: "One dose if indicated" },
        ],
      },
      {
        site: "Right deltoid",
        icon: "💪",
        injections: [
          { name: "Hepatitis A", note: "Dose 1 of 2" },
          { name: "Hepatitis B", note: "Dose 1" },
        ],
      },
    ],
  },
];

const COADMIN2VISIT_B_VISITS: Visit[] = [
  {
    label: "Visit 1",
    timing: "Day 0 — Influenza/COVID/PCV/Tetanus Priority",
    note: "Option B — influenza/COVID/PCV/tetanus priority. Use a separate injection site for each vaccine; if two vaccines share the same deltoid, separate by ≥2.5 cm (1 inch) and document the exact site.",
    sites: [
      {
        site: "Left deltoid",
        icon: "💪",
        injections: [
          { name: "Influenza", note: "1 dose" },
          { name: "COVID-19 vaccine", note: "Current indicated dose" },
        ],
      },
      {
        site: "Right deltoid",
        icon: "💪",
        injections: [
          { name: "PCV20", note: "One dose if indicated" },
          { name: "Tdap/Td", note: "One dose if indicated" },
        ],
      },
    ],
  },
  {
    label: "Visit 2",
    timing: "Day 7–14",
    sites: [
      {
        site: "Left deltoid",
        icon: "💪",
        injections: [
          { name: "RSV vaccine", note: "One dose if eligible" },
          { name: "Shingrix", note: "Dose 1 of 2" },
        ],
      },
      {
        site: "Right deltoid",
        icon: "💪",
        injections: [
          { name: "Hepatitis A", note: "Dose 1 of 2" },
          { name: "Hepatitis B", note: "Dose 1" },
        ],
      },
    ],
  },
];

const COADMIN2VISIT_OPTIONS: { key: "A" | "B"; label: string; visits: Visit[] }[] = [
  { key: "A", label: "Option A — Respiratory/PCV priority", visits: COADMIN2VISIT_A_VISITS },
  { key: "B", label: "Option B — Influenza/COVID/PCV/Tetanus priority", visits: COADMIN2VISIT_B_VISITS },
];

type CoAdminScheduleKey = "6" | "8" | "2visit";

const COADMIN_SCHEDULES: { key: CoAdminScheduleKey; label: string; titleNote: string; description: ReactNode; visits?: Visit[] }[] = [
  {
    key: "8",
    label: "8-vaccine schedule",
    titleNote: "Including Influenza, COVID-19, RSV, PCV20, Tdap/Td, Hepatitis A, Hepatitis B, and Shingrix",
    description: (
      <>
        All listed vaccines are <strong>non-live</strong> and may be administered during the same visit when indicated.
        Use separate injection sites and document each vaccine's precise anatomic site, manufacturer, lot number, route,
        and date. Separate injections within the same muscle by <strong>≥2.5 cm (1 inch)</strong>.
      </>
    ),
    visits: COADMIN8_VISITS,
  },
  {
    key: "2visit",
    label: "2-visit, 8-vaccine schedule",
    titleNote: "Two-visit co-administration by injection site (Options A & B)",
    description: (
      <>
        All eight vaccines — Influenza, COVID-19, RSV, PCV20, Tdap/Td, Hepatitis A, Hepatitis B, and Shingrix — are{" "}
        <strong>non-live</strong> and can be co-administered. Use a separate injection site for each vaccine; if two
        vaccines are administered in the same deltoid, separate them by <strong>≥2.5 cm (1 inch)</strong> and document
        the exact site. Shingrix dose 2 and the Hepatitis A/B series completions still follow their standard intervals
        after these two visits.
      </>
    ),
  },
  {
    key: "6",
    label: "6-vaccine schedule",
    titleNote: "(Including Hepatitis A)",
    description: (
      <>
        All six vaccines — Influenza, PCV20, Tdap/DPT, Hepatitis A, Hepatitis B, and Shingrix — are{" "}
        <strong>non-live</strong>. They can be safely administered on the same day using different injection sites.
        This schedule distributes injections across both arms and both thighs on Day 0 to avoid overloading individual limbs.
      </>
    ),
    visits: COADMIN6_VISITS,
  },
];

function CoAdministrationSchedule() {
  const [scheduleKey, setScheduleKey] = useState<CoAdminScheduleKey>("8");
  const [twoVisitOption, setTwoVisitOption] = useState<"A" | "B">("A");
  const schedule = COADMIN_SCHEDULES.find((s) => s.key === scheduleKey) ?? COADMIN_SCHEDULES[0];
  const visits =
    scheduleKey === "2visit"
      ? (COADMIN2VISIT_OPTIONS.find((o) => o.key === twoVisitOption) ?? COADMIN2VISIT_OPTIONS[0]).visits
      : (schedule.visits ?? []);

  return (
    <Card className="border-primary/40 bg-gradient-to-br from-primary/5 to-transparent overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Syringe className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">Co-Administration Schedule &amp; Sites</CardTitle>
        </div>
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          {COADMIN_SCHEDULES.map((s) => (
            <button
              key={s.key}
              type="button"
              onClick={() => setScheduleKey(s.key)}
              aria-pressed={scheduleKey === s.key}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                scheduleKey === s.key
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border/60 bg-background/60 text-muted-foreground hover:bg-background"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
        <CardDescription>
          <span className="block font-medium text-foreground">{schedule.titleNote}</span>
          {schedule.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Visit timeline */}
        <div className="space-y-3">
          {schedule.visits.map((visit) => (
            <div key={visit.label} className="rounded-xl border border-border/60 bg-background/60 overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-2.5 bg-primary/10 border-b border-border/40">
                <Badge className="bg-primary text-primary-foreground">{visit.label}</Badge>
                <span className="text-sm font-semibold">{visit.timing}</span>
              </div>
              <div className="p-3">
                <div className="grid sm:grid-cols-2 gap-2">
                  {visit.sites.map((site) => (
                    <div key={site.site} className="p-2.5 rounded-lg bg-secondary/40 border border-border/40">
                      <p className="text-xs font-semibold text-primary mb-1.5">
                        <span className="mr-1">{site.icon}</span>
                        {site.site}
                      </p>
                      <ul className="space-y-1">
                        {site.injections.map((inj) => (
                          <li key={inj.name} className="text-xs text-muted-foreground flex items-start gap-1.5">
                            <span className="text-primary mt-0.5">•</span>
                            <span>
                              <span className="font-medium text-foreground">{inj.name}</span>
                              {inj.note && <span className="text-muted-foreground"> — {inj.note}</span>}
                              {inj.details && (
                                <ul className="mt-0.5 space-y-0.5 list-disc pl-4">
                                  {inj.details.map((d) => (
                                    <li key={d} className="text-muted-foreground">
                                      {d}
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
                {visit.note && (
                  <p className="text-xs text-muted-foreground mt-2.5 border-t border-border/40 pt-2">{visit.note}</p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Important notes (8-vaccine schedule) */}
        {scheduleKey === "8" && (
          <div className="p-3 rounded-lg bg-primary/10 border border-primary/30">
            <h4 className="text-sm font-semibold text-foreground mb-1.5 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-primary" />
              Important
            </h4>
            <ul className="space-y-1 text-xs text-muted-foreground list-disc pl-4">
              {COADMIN8_IMPORTANT.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Practical caveats (8-vaccine schedule) */}
        {scheduleKey === "8" && (
          <div className="p-3 rounded-lg bg-secondary/40 border border-border/40">
            <h4 className="text-sm font-semibold text-foreground mb-1.5">Practical caveats</h4>
            <ul className="space-y-1.5 text-xs text-muted-foreground list-disc pl-4">
              {COADMIN8_CAVEATS.map((c) => (
                <li key={c.title}>
                  <strong className="text-foreground">{c.title}:</strong> {c.text}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Immunosuppression safety check */}
        <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
          <h4 className="text-sm font-semibold text-amber-400 mb-1.5 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Immunosuppression Safety Check
          </h4>
          <ul className="space-y-1 text-xs text-muted-foreground list-disc pl-4">
            <li>
              <strong className="text-amber-300">Pre-Therapy Window:</strong> Try to administer Visit 1 at least{" "}
              <strong>2–4 weeks</strong> before the first dose of monoclonal antibodies or high-dose systemic steroids.
            </li>
            <li>
              <strong className="text-amber-300">Active Therapy:</strong> If the patient has already started treatment,
              proceed with this schedule immediately, but consult their specialist regarding whether post-therapy
              antibody titers should be drawn later.
            </li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Main Component ───

export default function AdultVaccinations() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"all" | "live" | "inactivated">("all");
  const [filterRecommendation, setFilterRecommendation] = useState<"all" | "ESSENTIAL" | "RECOMMENDED" | "CONSIDER" | "CONTRAINDICATED">("all");
  const [expandedVaccine, setExpandedVaccine] = useState<string | null>(null);
  const [planningForImmunosuppression, setPlanningForImmunosuppression] = useState(false);
  const [planningForTravel, setPlanningForTravel] = useState(false);
  const [selectedVaccines, setSelectedVaccines] = useState<Set<string>>(new Set());
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  // Vaccines always kept (non-optional) — the co-administration schedule set
  const KEPT_VACCINE_IDS = new Set([
    "herpes_zoster_shingrix", // Shingrix
    "hepatitis_a",            // Hepatitis A
    "hepatitis_b",            // Hepatitis B
    "influenza_inactivated",  // Influenza
    "pneumococcal",           // PCV20
    "tdap",                   // Tdap/DPT
  ]);

  // Kept vaccines always shown, at the top; optional vaccines only when selected
  // (or when they match a non-empty search, so they can be discovered and selected)
  const filteredVaccines = useMemo(() => {
    return VACCINES.filter(v => {
      const matchesSearch = searchTerm === "" ||
        v.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.id.toLowerCase().includes(searchTerm.toLowerCase());
      const isKept = KEPT_VACCINE_IDS.has(v.id);
      const isSelected = selectedVaccines.has(v.id);
      const isSearched = searchTerm !== "" && matchesSearch;
      // Kept vaccines always visible; optional vaccines only when selected or searched
      if (!isKept && !isSelected && !isSearched) return false;
      const matchesType = filterType === "all" ||
        (filterType === "live" && v.type.includes("live")) ||
        (filterType === "inactivated" && !v.type.includes("live"));
      const matchesRecommendation = filterRecommendation === "all" || v.recommendation === filterRecommendation;
      return matchesSearch && matchesType && matchesRecommendation;
    });
  }, [searchTerm, filterType, filterRecommendation, selectedVaccines]);

  // Sort: kept vaccines first, then optional (selected) vaccines
  const sortedVaccines = useMemo(() => {
    return [...filteredVaccines].sort((a, b) => {
      const aKept = KEPT_VACCINE_IDS.has(a.id) ? 0 : 1;
      const bKept = KEPT_VACCINE_IDS.has(b.id) ? 0 : 1;
      return aKept - bKept;
    });
  }, [filteredVaccines]);

  // Get pre-immunosuppression vaccines
  const preImmunosuppressionVaccines = useMemo(() => {
    if (!planningForImmunosuppression) return [];
    return VACCINES.filter(v => v.timing_before_immunosuppression);
  }, [planningForImmunosuppression]);

  // Export function — only selected vaccines
  const handleExport = () => {
    const selected = VACCINES.filter(v => selectedVaccines.has(v.id));
    if (selected.length === 0) {
      toast.error("Select at least one vaccine to export");
      return;
    }

    let content = "ADULT VACCINATION SELECTION\n";
    content += "============================\n\n";

    // Header with patient category info
    if (activeCategory) {
      const cat = PATIENT_CATEGORIES.find(c => c.id === activeCategory);
      if (cat) {
        content += `Patient Category: ${cat.label}\n`;
        content += `Description: ${cat.description}\n\n`;
      }
    }

    content += `Selected Vaccines (${selected.length})\n`;
    content += "----------------------------\n";
    selected.forEach(v => {
      content += `\n${v.name}\n`;
      content += `  Type: ${v.type}\n`;
      content += `  Age: ${formatAgeRange(v.age_min, v.age_max)}\n`;
      content += `  Schedule: ${v.routine_adult_schedule}\n`;
      if (v.timing_before_immunosuppression) {
        content += `  Pre-immunosuppression: ${v.timing_before_immunosuppression}\n`;
      }
      if (v.timing_before_travel) {
        content += `  Pre-travel: ${v.timing_before_travel}\n`;
      }
      content += `  Contraindications: ${v.contraindications.join(", ")}\n`;
      content += `  Notes: ${v.notes}\n`;
    });

    content += "\n\n---\n";
    content += "Generated by ncd-app-maker — Adult Vaccination Clinical Reference\n";

    downloadTextFile(content, "vaccination-selection.txt");
    toast.success(`Exported ${selected.length} vaccine(s)`);
  };

  const handleCopy = () => {
    const text = VACCINES.map(v =>
      `${v.name} (${v.recommendation}): ${v.routine_adult_schedule}`
    ).join("\n");
    navigator.clipboard.writeText(text);
    toast.success("Vaccination list copied to clipboard");
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="text-center space-y-3">
        <Badge variant="outline" className="text-sm px-4 py-1 border-emerald-400/40 text-emerald-400">
          <Syringe className="h-4 w-4 mr-1.5" />
          Adult Vaccinations
        </Badge>
        <h1 className="text-3xl font-bold tracking-tight">Adult Vaccination Clinical Reference</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Comprehensive guide for adult vaccination schedules, including pre-immunosuppression planning
          and travel vaccines — with contraindications and timing recommendations.
        </p>
      </div>

      {/* Co-Administration Schedule — featured content */}
      <CoAdministrationSchedule />

      {/* Live vs Inactivated Reference Chart */}
      <Card className="border-border/60 overflow-hidden">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" />
            Live vs Inactivated Vaccines — Before Immunosuppressive Therapy
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ZoomableImage
            src={vaccinesLiveVsInactivatedAsset.url}
            alt="Live vs inactivated vaccines to consider before initiating immunosuppressive therapy"
            className="w-full h-auto rounded-md"
          />
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-end gap-2">
        <Button variant="outline" size="sm" onClick={handleCopy}>
          <Copy className="h-4 w-4 mr-1.5" />
          Copy List
        </Button>
        <Button variant="outline" size="sm" onClick={handleExport}>
          <Download className="h-4 w-4 mr-1.5" />
          Export Reference
        </Button>
      </div>

      {/* Clinical Context Checkboxes */}
      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-amber-400" />
            Clinical Context
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-3">
            <Checkbox
              id="planning-immunosuppression"
              checked={planningForImmunosuppression}
              onCheckedChange={(checked) => setPlanningForImmunosuppression(!!checked)}
            />
            <Label htmlFor="planning-immunosuppression" className="text-sm cursor-pointer">
              Planning for immunosuppression / biologic therapy
            </Label>
          </div>
          <div className="flex items-center space-x-3">
            <Checkbox
              id="planning-travel"
              checked={planningForTravel}
              onCheckedChange={(checked) => setPlanningForTravel(!!checked)}
            />
            <Label htmlFor="planning-travel" className="text-sm cursor-pointer">
              Planning travel to endemic areas
            </Label>
          </div>

          {/* Patient Category Selector */}
          <div className="border-t border-border/40 pt-4">
            <Label className="text-sm font-medium mb-2.5 block">
              Patient Category — auto-selects relevant vaccines
            </Label>
            <div className="flex flex-wrap gap-2">
              {PATIENT_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => {
                    if (activeCategory === cat.id) {
                      setActiveCategory(null);
                      setSelectedVaccines(new Set());
                    } else {
                      setActiveCategory(cat.id);
                      setSelectedVaccines(new Set(cat.vaccineIds));
                    }
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm border transition-colors ${
                    activeCategory === cat.id
                      ? "bg-primary/20 border-primary text-primary"
                      : "bg-muted/30 border-border/60 text-muted-foreground hover:bg-muted/50"
                  }`}
                  title={cat.description}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.label}</span>
                </button>
              ))}
            </div>
            {activeCategory && (
              <p className="text-xs text-muted-foreground mt-2">
                {PATIENT_CATEGORIES.find(c => c.id === activeCategory)?.description}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Pre-Immunosuppression Checklist */}
      {planningForImmunosuppression && (
        <Card className="border-amber-500/40 bg-amber-500/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2 text-amber-400">
              <Shield className="h-5 w-5" />
              Pre-Immunosuppression Vaccine Checklist
            </CardTitle>
            <CardDescription className="text-amber-200/70">
              Complete these vaccines before initiating immunosuppressive therapy
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {preImmunosuppressionVaccines
                .filter(v => v.type.includes("live"))
                .map(v => (
                  <div key={v.id} className="flex items-start gap-3 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30">
                    <AlertTriangle className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold">{v.name}</span>
                        {getRecommendationBadge(v.recommendation)}
                        <Badge variant="outline" className="text-rose-400 border-rose-400/40 text-xs">LIVE</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-1">{v.timing_before_immunosuppression}</p>
                      <p className="text-xs text-rose-300/80">{v.notes}</p>
                    </div>
                  </div>
                ))}
              {preImmunosuppressionVaccines
                .filter(v => !v.type.includes("live"))
                .map(v => (
                  <div key={v.id} className="flex items-start gap-3 p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
                    <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold">{v.name}</span>
                        {getRecommendationBadge(v.recommendation)}
                      </div>
                      <p className="text-sm text-muted-foreground">{v.timing_before_immunosuppression}</p>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card className="border-border/60">
        <CardContent className="pt-4 space-y-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <Label className="text-sm font-medium mb-1.5 block">Search</Label>
              <Input
                placeholder="Search vaccines..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-9"
              />
            </div>
            <div className="w-[180px]">
              <Label className="text-sm font-medium mb-1.5 block">Type</Label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as typeof filterType)}
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="all">All Types</option>
                <option value="live">Live-Attenuated</option>
                <option value="inactivated">Inactivated</option>
              </select>
            </div>
            <div className="w-[180px]">
              <Label className="text-sm font-medium mb-1.5 block">Priority</Label>
              <select
                value={filterRecommendation}
                onChange={(e) => setFilterRecommendation(e.target.value as typeof filterRecommendation)}
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="all">All Priorities</option>
                <option value="ESSENTIAL">Essential</option>
                <option value="RECOMMENDED">Recommended</option>
                <option value="CONSIDER">Consider</option>
                <option value="CONTRAINDICATED">Contraindicated</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Vaccine Cards */}
      <div className="space-y-3">
        {/* Selection Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {selectedVaccines.size > 0
                ? `${selectedVaccines.size} vaccine${selectedVaccines.size > 1 ? "s" : ""} selected`
                : "No vaccines selected"}
            </span>
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                const allIds = new Set(sortedVaccines.map(v => v.id));
                setSelectedVaccines(prev => {
                  const next = new Set(prev);
                  allIds.forEach(id => next.add(id));
                  return next;
                });
              }}
            >
              Select All
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                const filteredIds = new Set(sortedVaccines.map(v => v.id));
                setSelectedVaccines(prev => {
                  const next = new Set(prev);
                  filteredIds.forEach(id => next.delete(id));
                  return next;
                });
              }}
            >
              Deselect All
            </Button>
          </div>
        </div>

        {sortedVaccines.length === 0 ? (
          <Card className="border-border/60">
            <CardContent className="py-8 text-center text-muted-foreground">
              No vaccines match your search criteria.
            </CardContent>
          </Card>
        ) : (
          sortedVaccines.map((vaccine) => (
            <Card
              key={vaccine.id}
              className={`border-border/60 overflow-hidden transition-colors ${
                expandedVaccine === vaccine.id ? "border-primary/40" : ""
              }`}
            >
              <CardContent className="p-0">
                <button
                  onClick={() => setExpandedVaccine(expandedVaccine === vaccine.id ? null : vaccine.id)}
                  className="w-full p-4 text-left hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <Checkbox
                          checked={selectedVaccines.has(vaccine.id)}
                          onCheckedChange={(checked) => {
                            setSelectedVaccines(prev => {
                              const next = new Set(prev);
                              if (checked) {
                                next.add(vaccine.id);
                              } else {
                                next.delete(vaccine.id);
                              }
                              return next;
                            });
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className="mr-1"
                        />
                        <h3 className="font-semibold text-lg">{vaccine.name}</h3>
                        {KEPT_VACCINE_IDS.has(vaccine.id) && (
                          <Badge className="bg-primary text-primary-foreground">★ Kept</Badge>
                        )}
                        {getRecommendationBadge(vaccine.recommendation)}
                        {getTypeBadge(vaccine.type)}
                      </div>
                      <p className="text-sm text-muted-foreground">{vaccine.routine_adult_schedule}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant="outline" className="text-xs">
                        {formatAgeRange(vaccine.age_min, vaccine.age_max)}
                      </Badge>
                      {expandedVaccine === vaccine.id ? (
                        <ChevronUp className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                </button>

                {expandedVaccine === vaccine.id && (
                  <div className="px-4 pb-4 pt-2 border-t border-border/40 space-y-4">
                    {/* Timing info */}
                    {(vaccine.timing_before_immunosuppression || vaccine.timing_before_travel) && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {vaccine.timing_before_immunosuppression && (
                          <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
                            <div className="flex items-center gap-2 mb-1">
                              <Clock className="h-4 w-4 text-amber-400" />
                              <span className="text-sm font-semibold text-amber-400">Pre-Immunosuppression</span>
                            </div>
                            <p className="text-sm text-muted-foreground">{vaccine.timing_before_immunosuppression}</p>
                          </div>
                        )}
                        {vaccine.timing_before_travel && (
                          <div className="p-3 rounded-lg bg-sky-500/10 border border-sky-500/30">
                            <div className="flex items-center gap-2 mb-1">
                              <Clock className="h-4 w-4 text-sky-400" />
                              <span className="text-sm font-semibold text-sky-400">Pre-Travel</span>
                            </div>
                            <p className="text-sm text-muted-foreground">{vaccine.timing_before_travel}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Contraindications */}
                    {vaccine.contraindications.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                          <XCircle className="h-4 w-4 text-red-400" />
                          Contraindications
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {vaccine.contraindications.map((c, i) => (
                            <Badge key={i} variant="outline" className="text-red-400 border-red-400/40">
                              {c}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Notes */}
                    <div>
                      <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                        <Info className="h-4 w-4 text-blue-400" />
                        Clinical Notes
                      </h4>
                      <p className="text-sm text-muted-foreground">{vaccine.notes}</p>
                    </div>

                    {/* Implementation Guidance (for Dengue) */}
                    {vaccine.implementation_guidance && (
                      <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30">
                        <h4 className="text-sm font-semibold mb-2 text-rose-400">Implementation Guidance</h4>
                        {vaccine.implementation_guidance.age_restriction && (
                          <p className="text-sm text-muted-foreground mb-1">
                            <span className="font-medium">Age Restriction:</span> {vaccine.implementation_guidance.age_restriction}
                          </p>
                        )}
                        {vaccine.implementation_guidance.pre_vaccination_testing && (
                          <p className="text-sm text-muted-foreground mb-1">
                            <span className="font-medium">Pre-Vaccination Testing:</span> {vaccine.implementation_guidance.pre_vaccination_testing}
                          </p>
                        )}
                        {vaccine.implementation_guidance.dose_schedule && (
                          <p className="text-sm text-muted-foreground mb-1">
                            <span className="font-medium">Dose Schedule:</span> {vaccine.implementation_guidance.dose_schedule}
                          </p>
                        )}
                        {vaccine.implementation_guidance.special_notes && (
                          <p className="text-sm text-rose-300/80">
                            <span className="font-medium">⚠ Special Notes:</span> {vaccine.implementation_guidance.special_notes}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Summary Statistics */}
      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Vaccine Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
              <div className="text-2xl font-bold text-emerald-400">
                {VACCINES.filter(v => v.recommendation === "ESSENTIAL").length}
              </div>
              <div className="text-sm text-muted-foreground">Essential</div>
            </div>
            <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/30">
              <div className="text-2xl font-bold text-blue-400">
                {VACCINES.filter(v => v.recommendation === "RECOMMENDED").length}
              </div>
              <div className="text-sm text-muted-foreground">Recommended</div>
            </div>
            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
              <div className="text-2xl font-bold text-amber-400">
                {VACCINES.filter(v => v.recommendation === "CONSIDER").length}
              </div>
              <div className="text-sm text-muted-foreground">Consider</div>
            </div>
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30">
              <div className="text-2xl font-bold text-red-400">
                {VACCINES.filter(v => v.recommendation === "CONTRAINDICATED").length}
              </div>
              <div className="text-sm text-muted-foreground">Contraindicated</div>
            </div>
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30">
              <div className="text-2xl font-bold text-rose-400">
                {VACCINES.filter(v => v.type.includes("live")).length}
              </div>
              <div className="text-sm text-muted-foreground">Live Vaccines</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Disclaimer */}
      <Card className="border-amber-500/30 bg-amber-500/5">
        <CardContent className="pt-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="text-sm text-muted-foreground">
              <strong className="text-amber-400">Disclaimer:</strong> This reference is informational and should be mapped to authoritative local
              immunization schedules and product monographs before clinical use. Always verify current guidelines and
              individual patient factors before vaccination.
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}