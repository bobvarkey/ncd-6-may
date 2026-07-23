import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertTriangle, Shield, Clock, Baby, FlaskConical,
  Printer, Copy, Download, Activity, HeartPulse, Pill,
} from "lucide-react";
import { downloadTextFile } from "@/lib/clinical-utils";
import { toast } from "sonner";

// ══════════════════════════════════════════════
// Exposure definitions
// ══════════════════════════════════════════════

type PEPExposure = {
  id: string;
  label: string;
  category: string;
  pathogen: string;
  incubation: string;
  description: string;
  timeframe: string; // window within which PEP is effective
  urgency: "emergent" | "urgent" | "same-day" | "within-72h" | "within-7d";
};

type PEPRegimen = {
  phase: string;
  drug: string;
  dose: string;
  duration: string;
  notes?: string;
};

type PEPFollowUp = {
  test: string;
  timing: string;
  notes: string;
};

type PEPOutcome = {
  recommend: boolean;
  rationale: string;
  regimens: PEPRegimen[];
  followUp: PEPFollowUp[];
  specialPopulations?: { label: string; advice: string }[];
  redFlags: string[];
  keyPoints: string[];
  hivRiskScore?: { level: "low" | "moderate" | "high" | "very-high"; desc: string };
};

// ─── Exposure type data ───
const EXPOSURES: PEPExposure[] = [
  {
    id: "hiv-needlestick",
    label: "HIV — Percutaneous (Needlestick / Sharps)",
    category: "HIV",
    pathogen: "HIV",
    incubation: "2–4 weeks (acute retroviral syndrome)",
    description: "Percutaneous exposure to blood/body fluid from source with known or suspected HIV. Risk ~0.3% per needlestick.",
    timeframe: "Start within hours; ideal <4 h, can start up to 72 h",
    urgency: "emergent",
  },
  {
    id: "hiv-mucosal",
    label: "HIV — Mucous Membrane / Non-intact Skin",
    category: "HIV",
    pathogen: "HIV",
    incubation: "2–4 weeks",
    description: "Splash to eye, mouth, or non-intact skin with blood/fluid from HIV+ source. Risk ~0.09% per splash.",
    timeframe: "Start within hours; ideal <4 h, can start up to 72 h",
    urgency: "emergent",
  },
  {
    id: "hiv-sexual",
    label: "HIV — Sexual / Non-occupational (nPEP)",
    category: "HIV",
    pathogen: "HIV",
    incubation: "2–4 weeks",
    description: "Receptive or insertive anal/vaginal sex with HIV+ or unknown-status partner without condom or with condom failure. Risk per act: receptive anal ~1.4%, receptive vaginal ~0.08%.",
    timeframe: "Start within 72 h of exposure",
    urgency: "within-72h",
  },
  {
    id: "hbv",
    label: "Hepatitis B (HBV)",
    category: "Viral Hepatitis",
    pathogen: "HBV",
    incubation: "60–150 days",
    description: "Percutaneous, mucosal, or sexual exposure to HBsAg+ source. Risk of clinical hepatitis ~22–31% after needlestick.",
    timeframe: "Start within 24–48 h (HBIG) + vaccine series",
    urgency: "urgent",
  },
  {
    id: "hcv",
    label: "Hepatitis C (HCV)",
    category: "Viral Hepatitis",
    pathogen: "HCV",
    incubation: "14–180 days (avg 6–7 wk)",
    description: "Percutaneous exposure to HCV-RNA+ blood. Risk ~1.8% per needlestick. NO PEP exists — monitor for early treatment.",
    timeframe: "No prophylaxis; test at baseline, 4–6 wk, 12 wk",
    urgency: "same-day",
  },
  {
    id: "tetanus",
    label: "Tetanus",
    category: "Bacterial",
    pathogen: "Clostridium tetani",
    incubation: "3–21 days (avg 8 d)",
    description: "Wound contaminated with soil, manure, or rust. Immunization status determines need for TIG ± vaccine booster.",
    timeframe: "TIG within 24 h if indicated; can give up to 72 h",
    urgency: "urgent",
  },
  {
    id: "rabies",
    label: "Rabies",
    category: "Viral",
    pathogen: "Rabies lyssavirus",
    incubation: "20–90 days (can be years)",
    description: "Bite, scratch, or mucous-membrane exposure from suspect rabid animal (bat, raccoon, skunk, fox, unvaccinated dog/cat in endemic area).",
    timeframe: "RIG + vaccine ASAP; ideally day 0",
    urgency: "emergent",
  },
  {
    id: "meningococcal",
    label: "Meningococcal (Neisseria meningitidis)",
    category: "Bacterial",
    pathogen: "N. meningitidis",
    incubation: "2–10 days",
    description: "Close contact (household, daycare, kissing, shared utensils, healthcare workers with unprotected airway exposure) with confirmed invasive meningococcal disease.",
    timeframe: "Start within 24 h of index case diagnosis",
    urgency: "urgent",
  },
  {
    id: "influenza",
    label: "Influenza",
    category: "Viral",
    pathogen: "Influenza A / B",
    incubation: "1–4 days",
    description: "Household or close-contact exposure to confirmed influenza. Highest risk in unvaccinated, immunocompromised, elderly, pregnant women, and children <5 yr.",
    timeframe: "Start within 48 h of exposure; ideally <36 h",
    urgency: "within-72h",
  },
];

// ─── Risk assessment for HIV PEP ───
type HivExposureType = "percutaneous" | "mucosal" | "sexual";
type HivSourceStatus = "positive-highVL" | "positive-lowVL" | "unknown" | "negative";
type HivInjuryType = "solid-needle" | "hollow-needle" | "deep" | "superficial";
type HivFluidType = "blood" | "fluid-with-blood" | "csf-peritoneal" | "other" | "non-infectious";
type HivSexualRole = "receptive-anal" | "receptive-vaginal" | "insertive-anal" | "insertive-vaginal" | "oral";
type HivTiming = "<4h" | "4-24h" | "24-48h" | "48-72h" | ">72h";

function calculateHivRisk(
  sourceStatus: HivSourceStatus,
  injuryType?: HivInjuryType,
  fluidType?: HivFluidType,
  sexualRole?: HivSexualRole,
  condomUsed?: boolean,
): { recommend: boolean; level: string; desc: string; } {
  // High-risk source
  if (sourceStatus === "negative") return { recommend: false, level: "none", desc: "Source is HIV-negative. PEP not indicated." };

  const highRiskSource = sourceStatus === "positive-highVL";

  if (sourceStatus === "positive-lowVL") {
    return {
      recommend: true,
      level: "low-moderate",
      desc: "HIV+ source with suppressed/low VL (typically <200 copies/mL). Transmission risk is very low but PEP is generally recommended for occupational exposure per CDC guidelines.",
    };
  }

  if (sourceStatus === "unknown") {
    let risk = "low";
    if (injuryType === "hollow-needle" || injuryType === "deep") risk = "moderate";
    if (fluidType && ["blood", "csf-peritoneal"].includes(fluidType)) risk = "moderate";
    if (sexualRole === "receptive-anal") risk = "moderate";
    let desc = `Unknown source status. `;
    desc += risk === "moderate" ? "Risk factors present (deep injury, hollow needle, blood exposure, or receptive anal). Recommend PEP pending source testing." : "Low-risk characteristics. Individualized decision for PEP.";
    return { recommend: risk === "moderate", level: risk === "moderate" ? "moderate" : "low", desc };
  }

  // Positive high VL — definite PEP
  return { recommend: true, level: "high", desc: "Confirmed HIV+ source with detectable/high viral load. High-risk exposure — PEP strongly recommended." };
}

function getHivPepRegimen(category: string, egfr?: number): PEPOutcome {
  const baseRegimens: PEPRegimen[] = [
    {
      phase: "Preferred (3-drug)",
      drug: "Tenofovir disoproxil fumarate (TDF) 300 mg + Emtricitabine (FTC) 200 mg",
      dose: "1 tab PO daily (Truvada)",
      duration: "28 days",
      notes: "TDF/emtricitabine = Truvada or generic",
    },
    {
      phase: "PLUS",
      drug: "Raltegravir (RAL) 400 mg",
      dose: "1 tab PO BID",
      duration: "28 days",
      notes: "Or Dolutegravir (DTG) 50 mg PO daily as alternative",
    },
  ];

  const altRegimens: PEPRegimen[] = [
    {
      phase: "Alt to TDF/FTC",
      drug: "Tenofovir alafenamide (TAF) 25 mg + Emtricitabine 200 mg",
      dose: "1 tab PO daily (Descovy)",
      duration: "28 days",
      notes: "Preferred if eGFR <60 or osteopenia risk",
    },
    {
      phase: "Alt to RAL/DTG",
      drug: "Darunavir (DRV) 800 mg + Ritonavir 100 mg (or cobicistat)",
      dose: "1 tab PO daily (or BID for DRV/r)",
      duration: "28 days",
      notes: "Boosted PI; more GI side effects. Use if integrase resistance suspected",
    },
  ];

  const renalAdjustment: PEPRegimen[] = [];
  if (egfr !== undefined && egfr < 60) {
    renalAdjustment.push({
      phase: "Renal adjustment (eGFR <60)",
      drug: "TDF — avoid if eGFR <50; switch to TAF/FTC (Descovy)",
      dose: "TAF 25 mg / FTC 200 mg PO daily",
      duration: "28 days",
      notes: "Monitor renal function weekly",
    });
  }

  const followUp: PEPFollowUp[] = [
    { test: "HIV Ag/Ab (4th gen)", timing: "Baseline (day 0)", notes: "Confirm exposed person is HIV-negative before starting PEP" },
    { test: "HIV Ag/Ab (4th gen)", timing: "4–6 weeks post-exposure", notes: "~99% sensitivity; if negative, HIV infection ruled out" },
    { test: "HIV Ag/Ab (4th gen)", timing: "3 months post-exposure", notes: "Conclusive; no further testing if negative" },
    { test: "CBC, LFT, renal function", timing: "Baseline + 2 weeks", notes: "Monitor TDF nephrotoxicity and DTG/RAL LFT effects" },
  ];

  const special: { label: string; advice: string }[] = [];
  if (egfr !== undefined && egfr < 50) {
    special.push({ label: "eGFR <50", advice: "Avoid TDF. Use TAF/FTC (Descovy) as backbone. Consider DTG for simplicity. Monitor renal function closely." });
  }
  special.push({ label: "Pregnancy / breastfeeding", advice: "TDF/FTC + RAL preferred in pregnancy. DTG is safe (per WHO). Avoid DRV/r if possible. Continue breastfeeding on PEP." });
  special.push({ label: "Sexual nPEP", advice: "Same 3-drug regimen for 28 days. Offer emergency contraception if indicated. Discuss PrEP transition if ongoing risk." });

  return {
    recommend: true,
    rationale: `Starting 3-drug HIV PEP for ${category}.`,
    regimens: [...baseRegimens, ...altRegimens, ...renalAdjustment],
    followUp,
    specialPopulations: special,
    redFlags: [
      "Delay >72 h since exposure → PEP NOT effective for HIV",
      "Source known to have drug-resistant HIV → consult ID",
      "Exposed person on PrEP → still give PEP if high-risk exposure",
      "Needlestick with visible blood in hollow needle → highest risk level",
      "Acute retroviral syndrome symptoms (fever, rash, lymphadenopathy, pharyngitis) within 2–6 wk → urgent HIV testing",
    ],
    keyPoints: [
      "Start ASAP — every hour counts. Do NOT wait for source HIV test if high risk.",
      "Take with food (RAL/DTG). Complete full 28-day course.",
      "Counsel on side effects: nausea (common first 3–5d), headache, fatigue. Anti-emetics can help.",
      "Use condoms consistently during PEP course to avoid onward transmission.",
      "Document exposure in occupational health register (if occupational).",
    ],
  };
}

// ─── HBV PEP ───
type HbvVaxStatus = "vaccinated-responder" | "vaccinated-nonresponder" | "unknown-responder" | "unvaccinated" | "incomplete";
type HbvSource = "hbsag-positive" | "hbsag-unknown" | "hbsag-negative";

function getHbvPep(
  source: HbvSource,
  vaxStatus: HbvVaxStatus,
): PEPOutcome {
  const recommend = source !== "hbsag-negative";
  const isHighRisk = source === "hbsag-positive" || (source === "hbsag-unknown" && vaxStatus !== "vaccinated-responder");

  const baseRegimens: PEPRegimen[] = [];
  const followUp: PEPFollowUp[] = [
    { test: "HBsAg, anti-HBs, anti-HBc total", timing: "Baseline", notes: "Check if exposed person has past/current infection" },
  ];

  if (source === "hbsag-negative") {
    return {
      recommend: false,
      rationale: "Source is HBsAg-negative. No HBV PEP needed. Ensure exposed person is vaccinated if not already immune.",
      regimens: [],
      followUp: [],
      redFlags: [],
      keyPoints: [],
    };
  }

  if (vaxStatus === "vaccinated-responder") {
    return {
      recommend: false,
      rationale: "Exposed person has documented vaccine response (anti-HBs ≥10 IU/mL). No PEP needed. Give vaccine booster if anti-HBs <10.",
      regimens: [],
      followUp: [{ test: "anti-HBs", timing: "Baseline + 1–2 months", notes: "Confirm responder status" }],
      redFlags: [],
      keyPoints: [],
    };
  }

  if (source === "hbsag-positive" && (vaxStatus === "vaccinated-nonresponder" || vaxStatus === "unknown-responder")) {
    baseRegimens.push({
      phase: "HBIG + Vaccine",
      drug: "Hepatitis B Immune Globulin (HBIG) 0.06 mL/kg IM",
      dose: "Single dose (up to 5 mL IM)",
      duration: "Once within 24–48 h",
      notes: "Give IM in deltoid/gluteal. Separate injection site from vaccine.",
    });
    baseRegimens.push({
      phase: "HBV vaccine booster",
      drug: "Engerix-B 20 mcg (or Recombivax 10 mcg) IM",
      dose: "1 mL IM deltoid",
      duration: "Day 0 → month 1 → month 6 (full series)",
      notes: "Begin immediately. Complete 3-dose series. If declined, HBIG alone is suboptimal.",
    });
    followUp.push(
      { test: "HBsAg, anti-HBs", timing: "1–2 months post-last dose", notes: "Confirm immunity (anti-HBs ≥10)" },
      { test: "HBsAg, anti-HBc", timing: "6 months", notes: "Rule out breakthrough infection" },
    );
  } else if (vaxStatus === "unvaccinated" || vaxStatus === "incomplete") {
    baseRegimens.push({
      phase: "HBIG (if source HBsAg+)",
      drug: "HBIG 0.06 mL/kg IM",
      dose: "Single dose within 24–48 h",
      duration: "Once",
      notes: "May give up to 7 days post-exposure. Maximum benefit in 24 h.",
    });
    baseRegimens.push({
      phase: "HBV vaccine series",
      drug: "Engerix-B 20 mcg (or Recombivax 10 mcg) IM",
      dose: "1 mL IM deltoid × 3 doses",
      duration: "Day 0 → month 1 → month 6",
      notes: "Standard 3-dose series. If source HBsAg unknown, start vaccine alone pending results.",
    });
    followUp.push(
      { test: "HBsAg, anti-HBs", timing: "1–2 months post-last dose", notes: "Confirm immunity" },
      { test: "HBsAg, anti-HBc", timing: "6 months", notes: "Rule out infection" },
    );
  } else {
    // vaccinated-responder is handled above
    baseRegimens.push({
      phase: "HBV vaccine booster",
      drug: "Engerix-B 20 mcg IM ×1",
      dose: "1 mL IM deltoid ×1",
      duration: "Single booster",
      notes: "Anti-HBs <10 IU/mL → give booster dose. Retest anti-HBs in 1–2 mo.",
    });
  }

  return {
    recommend,
    rationale: isHighRisk
      ? "HBsAg-positive or unknown source with non-immune recipient. HBIG + vaccine indicated."
      : "Source HBsAg unknown. Vaccine alone recommended while awaiting source results.",
    regimens: baseRegimens,
    followUp,
    specialPopulations: [
      { label: "Pregnancy", advice: "HBIG and HBV vaccine are safe in pregnancy. Do not withhold." },
      { label: "Known non-responder to vaccine", advice: "Give HBIG ×2 doses 1 month apart, no vaccine. If higher risk, consider repeating HBIG at 1 month." },
    ],
    redFlags: [
      "HBsAg-positive source + unvaccinated → highest risk (22–31% hepatitis rate) — start HBIG + vaccine immediately",
      "HBIG must be given within 7 days to be effective; optimal within 24–48 h",
      "Do not give HBIG IV — IM only. Use separate injection site from vaccine.",
    ],
    keyPoints: [
      "HBV vaccine alone is sufficient for low-risk exposures (HBsAg unknown + immune-competent).",
      "Combined HBIG + vaccine is 85–95% effective in preventing HBV.",
      "Anti-HBs ≥10 IU/mL = protected. If unknown, treat as non-responder.",
      "If source is HBsAg-negative, no PEP needed regardless of vaccination status.",
    ],
  };
}

// ─── HCV PEP (monitoring only — no prophylaxis exists) ───
function getHcvMonitoring(): PEPOutcome {
  return {
    recommend: true,
    rationale: "There is NO prophylaxis for HCV. Management is test-and-monitor for early detection and treatment.",
    regimens: [],
    followUp: [
      { test: "HCV Ab + HCV RNA (PCR)", timing: "Baseline (day 0)", notes: "Confirm exposed person not already HCV-infected" },
      { test: "HCV RNA (PCR)", timing: "2–4 weeks post-exposure", notes: "Earliest detection window; ALT also typically peaks at 4–8 wk" },
      { test: "HCV Ab + HCV RNA", timing: "4–6 weeks", notes: "Most seroconversions detectable by 6–8 wk" },
      { test: "HCV Ab + HCV RNA", timing: "12 weeks", notes: "Conclusive; >99% of seroconversions detected" },
      { test: "ALT", timing: "Monthly × 4 months", notes: "ALT elevation often precedes seroconversion" },
    ],
    specialPopulations: [
      { label: "Pregnancy", advice: "Same monitoring protocol. No contraindication to testing." },
      { label: "HIV co-infection", advice: "May have delayed seroconversion — monitor HCV RNA monthly for 6 months." },
    ],
    redFlags: [
      "HCV RNA or Ab seroconversion → refer to hepatology / ID for DAA therapy",
      "ALT >10× ULN + HCV RNA+ → start DAA (direct-acting antiviral) treatment promptly",
      "Spontaneous clearance occurs in ~25% (higher in younger, IL28B CC genotype) — confirm with repeated viral load",
    ],
    keyPoints: [
      "No HCV PEP exists — do NOT give antivirals for prophylaxis.",
      "If seroconversion occurs, DAA therapy has >95% cure rate. Treat early.",
      "HCV can survive in syringes for up to 63 days. Handle sharps carefully.",
      "Advise exposed person to avoid blood/tissue donation until cleared.",
    ],
  };
}

// ─── Tetanus PEP ───
type TetanusWound = "clean-minor" | "clean-major" | "dirty-puncture" | "dirty-heavy" | "burn-frostbite";
const WOUND_CATEGORIES: Record<TetanusWound, { label: string; atRisk: boolean }> = {
  "clean-minor": { label: "Clean, minor wound", atRisk: false },
  "clean-major": { label: "Clean, major wound (surgical)", atRisk: false },
  "dirty-puncture": { label: "Dirty / puncture / contaminated with soil/manure", atRisk: true },
  "dirty-heavy": { label: "Heavy contamination (soil, feces, saliva), devitalized tissue", atRisk: true },
  "burn-frostbite": { label: "Burn / frostbite / crush injury", atRisk: true },
};

type TetanusVax = "up-to-date" | "not-updated" | "unknown" | "never";

function getTetanusPep(
  wound: TetanusWound,
  vax: TetanusVax,
  lastBoosterYears: number | null,
): PEPOutcome {
  const woundInfo = WOUND_CATEGORIES[wound];
  const regimens: PEPRegimen[] = [];

  // Determine TIG need
  const needTIG = woundInfo.atRisk && (vax === "unknown" || vax === "never" || vax === "not-updated" || (vax === "up-to-date" && lastBoosterYears !== null && lastBoosterYears > 10));
  const needBooster = vax === "unknown" || vax === "never" || vax === "not-updated" || (vax === "up-to-date" && lastBoosterYears !== null && lastBoosterYears >= 5 && woundInfo.atRisk) || (vax === "up-to-date" && lastBoosterYears !== null && lastBoosterYears >= 10);

  let rationale = "";
  const keyPoints: string[] = [];

  if (vax === "up-to-date" && !woundInfo.atRisk) {
    rationale = "Up-to-date tetanus vaccination + clean minor wound. Neither TIG nor booster needed.";
  } else if (vax === "up-to-date" && woundInfo.atRisk) {
    if (lastBoosterYears !== null && lastBoosterYears < 5) {
      rationale = `Up-to-date (<5 yr since last booster). No TIG or booster needed.`;
    } else if (lastBoosterYears !== null && lastBoosterYears >= 5 && lastBoosterYears < 10) {
      rationale = "Up-to-date (5–10 yr). Give booster (Td or Tdap). TIG NOT needed.";
      regimens.push({
        phase: "Vaccine booster",
        drug: "Tdap (or Td if Tdap given within 5 yr)",
        dose: "0.5 mL IM deltoid ×1",
        duration: "Single dose",
        notes: "If Tdap not given before, give Tdap now",
      });
    } else {
      rationale = "Last booster >10 yr. Give TIG + booster because wound is tetanus-prone.";
      regimens.push({
        phase: "TIG",
        drug: "Tetanus Immune Globulin 250–500 U IM",
        dose: "250 IU IM (500 IU for heavy contamination)",
        duration: "Single dose, within 24 h",
        notes: "May give up to 72 h. Larger wounds → 500 IU.",
      });
      regimens.push({
        phase: "Vaccine booster",
        drug: "Tdap (or Td)",
        dose: "0.5 mL IM ×1",
        duration: "Single dose",
        notes: "Separate injection site from TIG.",
      });
    }
  } else {
    // not up to date / unknown / never
    if (woundInfo.atRisk) {
      rationale = `Not fully vaccinated + tetanus-prone wound. Give TIG + start/complete vaccine series.`;
      regimens.push({
        phase: "TIG",
        drug: "Tetanus Immune Globulin 250–500 U IM",
        dose: "250 IU IM (500 IU for heavy/dirty)",
        duration: "Single dose ASAP",
        notes: "Give within 24 h. TIG provides immediate passive immunity.",
      });
      regimens.push({
        phase: "Vaccine dose 1 (of series)",
        drug: "Tdap (or DTaP if age <7)",
        dose: "0.5 mL IM deltoid ×1",
        duration: "Day 0",
        notes: "Complete series: dose 2 at 4 wk, dose 3 at 6–12 mo",
      });
    } else {
      rationale = `Not up-to-date, but wound is clean/minor. Give vaccine dose now. No TIG needed.`;
      regimens.push({
        phase: "Vaccine dose",
        drug: "Tdap (or Td)",
        dose: "0.5 mL IM ×1",
        duration: "Single dose now, then complete series",
        notes: "Complete series: dose 2 at 4 wk, dose 3 at 6–12 mo",
      });
    }
  }

  const followUp: PEPFollowUp[] = [
    { test: "Wound check", timing: "48–72 h", notes: "Reinspect for signs of infection" },
  ];
  if (regimens.some(r => r.phase.includes("Vaccine") || r.phase.includes("series"))) {
    followUp.push(
      { test: "Tdap dose 2", timing: "4 weeks", notes: "Second dose of series" },
      { test: "Tdap dose 3", timing: "6–12 months", notes: "Third/final dose" },
    );
  }

  const redFlags: string[] = [];
  if (woundInfo.atRisk) redFlags.push("Tetanus-prone wound — ensure thorough wound debridement and irrigation");
  if (regimens.some(r => r.phase === "TIG")) redFlags.push("TIG should be given within 24 h — delay reduces efficacy");

  return {
    recommend: true,
    rationale,
    regimens,
    followUp,
    keyPoints: [
      ...keyPoints,
      "TIG and Td/Tdap should be given at separate injection sites (different limbs preferred).",
      "Tdap preferred over Td for adults who have never received Tdap (covers pertussis).",
      "Routine adult tetanus booster: every 10 years.",
      "Tetanus has no cure — prevention is everything.",
    ],
    redFlags,
  };
}

// ─── Rabies PEP ───
type RabiesExposureCategory = "I" | "II" | "III";
type RabiesAnimal = "bat" | "raccoon-skunk-fox" | "dog-cat-domestic" | "dog-cat-stray" | "rodent-rabbit" | "livestock";
type RabiesVax = "previously-vaccinated" | "not-vaccinated";

function getRabiesPep(
  category: RabiesExposureCategory,
  animal: RabiesAnimal,
  vax: RabiesVax,
  biteLocation: string,
): PEPOutcome {
  const animalRisk: Record<RabiesAnimal, { label: string; reservoir: boolean }> = {
    "bat": { label: "Bat", reservoir: true },
    "raccoon-skunk-fox": { label: "Raccoon / Skunk / Fox", reservoir: true },
    "dog-cat-domestic": { label: "Domestic dog/cat (known vaccinated)", reservoir: false },
    "dog-cat-stray": { label: "Stray dog/cat (unknown status)", reservoir: true },
    "rodent-rabbit": { label: "Rodent / Rabbit", reservoir: false },
    "livestock": { label: "Livestock (horse, cow, etc.)", reservoir: false },
  };

  const isReservoir = animalRisk[animal].reservoir;

  // Category I = touching/feeding animal, intact skin → no PEP
  if (category === "I") {
    return {
      recommend: false,
      rationale: "Category I exposure (touching/feeding, intact skin). No PEP indicated.",
      regimens: [],
      followUp: [],
      redFlags: [],
      keyPoints: ["Educate about future avoidance of wildlife contact"],
    };
  }

  // Category II = nibbling, minor scratches without bleeding
  if (category === "II") {
    if (!isReservoir) {
      return {
        recommend: false,
        rationale: "Category II exposure from non-reservoir animal. No PEP needed. Observe animal for 10 days if captured.",
        regimens: [],
        followUp: [],
        redFlags: [],
        keyPoints: ["Advise wound care: wash ×15 min with soap + water + povidone-iodine"],
      };
    }
    // Reservoir + cat II
    const regimens: PEPRegimen[] = [];
    if (vax === "previously-vaccinated") {
      regimens.push({
        phase: "Vaccine booster",
        drug: "Rabies vaccine (HDCV or PCEC) 1 mL IM",
        dose: "1 mL IM deltoid (opposite arm ×2)",
        duration: "Day 0 and day 3 (2 doses)",
        notes: "No RIG needed if previously vaccinated",
      });
    } else {
      regimens.push({
        phase: "Rabies vaccine series",
        drug: "Rabies vaccine (HDCV or PCEC) 1 mL IM",
        dose: "1 mL IM deltoid",
        duration: "Day 0, 3, 7, 14 (4 doses)",
        notes: "Give in deltoid. Do NOT give in gluteal (poor immunogenicity).",
      });
    }
    return {
      recommend: true,
      rationale: `Category II exposure from ${animalRisk[animal].label}. Rabies cannot be ruled out — start vaccine.`,
      regimens,
      followUp: [
        { test: "Observation (if animal captured)", timing: "10 days", notes: "If animal remains healthy ×10 d → stop vaccine" },
        { test: "Rabies serology", timing: "Day 14", notes: "Optional: confirm antibody response" },
      ],
      redFlags: [
        "Bat exposures are HIGH risk — even without visible bite (e.g., bat in room with sleeping person)",
        "If animal is domestic dog/cat and can be quarantined ×10d, PEP can be deferred pending observation",
      ],
      keyPoints: [
        "Wash wound with soap and water ×15 min — this alone reduces rabies risk significantly.",
        "Apply povidone-iodine or ethanol after washing.",
        "Rabies is 100% fatal once symptomatic — do not withhold PEP when indicated.",
      ],
    };
  }

  // Category III = bite/scratch with bleeding, mucous membrane, bat contact
  const regimens: PEPRegimen[] = [];
  if (vax === "previously-vaccinated") {
    regimens.push({
      phase: "Vaccine booster (no RIG)",
      drug: "Rabies vaccine (HDCV/PCEC) 1 mL IM",
      dose: "1 mL IM deltoid",
      duration: "Day 0 and day 3 (2 doses total)",
      notes: "No RIG needed. Full course if 1st dose >1 yr since last booster.",
    });
  } else {
    regimens.push({
      phase: "RIG (passive immunization)",
      drug: "Human Rabies Immune Globulin (HRIG) 20 IU/kg",
      dose: `20 IU/kg × ${biteLocation ? biteLocation : "weight"} — infiltrate wound site`,
      duration: "Day 0, once",
      notes: "Infiltrate as much as possible into wound. Any remainder IM at distant site.",
    });
    regimens.push({
      phase: "Rabies vaccine series",
      drug: "Rabies vaccine (HDCV or PCEC) 1 mL IM",
      dose: "1 mL IM deltoid",
      duration: "Day 0, 3, 7, 14 (4 doses)",
      notes: "Give in deltoid, opposite arm from RIG injection if possible. No gluteal.",
    });
  }

  return {
    recommend: true,
    rationale: `Category III exposure from ${animalRisk[animal].label}. RIG + vaccine indicated. Rabies is universally fatal — treat aggressively.`,
    regimens,
    followUp: [
      { test: "Animal observation (if captured)", timing: "10 days", notes: "If healthy at 10d, complete vaccine course anyway but RIG may have been unnecessary" },
      { test: "Rabies serology", timing: "Day 14", notes: "Confirm adequate antibody response (titer ≥0.5 IU/mL)" },
    ],
    specialPopulations: [
      { label: "Pregnancy", advice: "RIG and rabies vaccine are safe in pregnancy. Do NOT withhold." },
      { label: "Immunocompromised", advice: "May need 5th dose + serology at day 28. ID consult recommended." },
    ],
    redFlags: [
      "Bat exposure is category III by default if contact is suspected (e.g., bat in room with sleeping person, child, intoxicated adult).",
      "Do NOT give RIG if previously vaccinated with documented antibody response.",
      "RIG and vaccine must not be mixed in same syringe or given at same injection site.",
      "Thorough wound cleaning reduces rabies risk by up to 90%.",
    ],
    keyPoints: [
      "Rabies is 100% fatal — when in doubt, give PEP.",
      "RIG infiltrated into wound site is critical. If wound is small (e.g., finger), infiltrate what fits, remainder IM at distant site.",
      "Vaccine series is 4 doses (WHO: 5 doses for immunocompromised).",
      "Post-exposure serology at day 14 is recommended for immunocompromised patients.",
    ],
  };
}

// ─── Meningococcal PEP ───
type MeningoRelation = "household" | "daycare" | "kissing-sexual" | "healthcare-airway" | "healthcare-other" | "casual";
type MeningoVax = "vaccinated-MenACWY" | "vaccinated-MenB" | "vaccinated-both" | "unvaccinated" | "unknown";

function getMeningoPep(
  relation: MeningoRelation,
  vaxStatus: MeningoVax,
  serogroupKnown: "ACWY" | "B" | "unknown",
): PEPOutcome {
  if (relation === "casual") {
    return {
      recommend: false,
      rationale: "Casual contact with no direct respiratory/secretions exposure. PEP not recommended.",
      regimens: [],
      followUp: [],
      redFlags: [],
      keyPoints: ["Educate on signs of meningococcal disease (fever, rash, stiff neck, photophobia)"],
    };
  }

  if (relation === "healthcare-other") {
    return {
      recommend: false,
      rationale: "Healthcare worker without unprotected airway exposure. PEP not indicated.",
      regimens: [],
      followUp: [],
      redFlags: [],
      keyPoints: ["If mask was worn during intubation/suction, risk is negligible"],
    };
  }

  const recommend = true;
  const regimens: PEPRegimen[] = [];

  const baseMessage = serogroupKnown === "B" ? "Serogroup B" : serogroupKnown === "ACWY" ? "Serogroup ACWY" : "Serogroup not yet typed";

  regimens.push({
    phase: "Preferred (CI below 1 month)",
    drug: "Ciprofloxacin 500 mg PO",
    dose: "500 mg PO ×1",
    duration: "Single dose",
    notes: "Contraindicated <18 yr, pregnancy, fluoroquinolone allergy",
  });
  regimens.push({
    phase: "Preferred (if avoiding cipro)",
    drug: "Ceftriaxone 250 mg IM",
    dose: "250 mg IM ×1",
    duration: "Single dose",
    notes: "Safe in pregnancy and <18 yr. Give IM gluteal.",
  });
  regimens.push({
    phase: "Alternative (oral)",
    drug: "Rifampin 600 mg PO",
    dose: "600 mg PO BID",
    duration: "2 days (4 doses total)",
    notes: "May stain contact lenses/teeth. Drug interactions (OCPs, warfarin).",
  });

  const followUp: PEPFollowUp[] = [
    { test: "Observation for symptoms", timing: "10 days (incubation max)", notes: "Fever, headache, stiff neck, petechial/purpuric rash = medical emergency" },
  ];

  const specialPopulations: { label: string; advice: string }[] = [];
  specialPopulations.push({ label: "Pregnancy", advice: "Ciprofloxacin contraindicated. Rifampin safe but consider ceftriaxone 250 mg IM ×1 as first choice." });
  specialPopulations.push({ label: "Age <18 yr", advice: "Ceftriaxone 250 mg IM ×1 or rifampin (age ≥1 mo: 10 mg/kg/dose PO BID ×2d). Ciprofloxacin NOT approved." });

  if (serogroupKnown === "ACWY" || serogroupKnown === "unknown") {
    const vaccinatedAgainst = (serogroupKnown === "ACWY" && vaxStatus !== "vaccinated-MenACWY" && vaxStatus !== "vaccinated-both");
    if (!vaccinatedAgainst) {
      followUp.push({ test: "MenACWY vaccine", timing: "During PEP course", notes: "Give MenACWY conjugate vaccine if not yet vaccinated (even if serogroup unknown)." });
      specialPopulations.push({ label: "Vaccination (MenACWY)", advice: "Administer MenACWY conjugate vaccine during the same visit (separate injection site)." });
    }
  }
  if (serogroupKnown === "B" || (serogroupKnown === "unknown" && vaxStatus !== "vaccinated-both" && vaxStatus !== "vaccinated-MenB")) {
    followUp.push({ test: "MenB vaccine", timing: "If serogroup B confirmed", notes: "Series (2–3 doses) based on MenB vaccine used." });
  }

  return {
    recommend,
    rationale: `Close contact of ${baseMessage} invasive meningococcal disease case. Start PEP immediately — do not wait for serogroup typing.`,
    regimens,
    followUp,
    specialPopulations,
    redFlags: [
      "PEP must be given within 24 h of index case diagnosis for optimal effectiveness.",
      "If symptoms develop (fever, rash, neck stiffness) — urgent ED evaluation for lumbar puncture + IV antibiotics.",
      "Meningococcal disease can progress from mild symptoms to death in <24 h.",
    ],
    keyPoints: [
      "Ciprofloxacin is first line — single dose, convenient, well-tolerated.",
      "PEP erases nasopharyngeal carriage → prevent secondary cases.",
      "Attack rate in household contacts: 500–800× general population.",
      "Also give chemoprophylaxis to index case before discharge (ceftriaxone or ciprofloxacin to clear carriage).",
    ],
  };
}

// ─── Influenza PEP ───
type FluExposureType = "household" | "occupational-hcw" | "caregiver" | "prolonged-close" | "casual";
type FluVaxStatus = "current-season" | "this-season" | "not-vaccinated" | "unknown";
type FluRiskGroup = "none" | "age-65+" | "pregnant" | "immunocompromised" | "chronic-respiratory" | "cardiac" | "renal" | "metabolic" | "morbid-obesity" | "age-<5" | "neurodevelopmental";

function getInfluenzaPep(
  exposureType: FluExposureType,
  vaxStatus: FluVaxStatus,
  riskGroups: FluRiskGroup[],
  hoursSinceExposure: number | null,
): PEPOutcome {
  if (exposureType === "casual") {
    return {
      recommend: false,
      rationale: "Casual contact (same room, brief interaction). No PEP indicated. Symptom monitoring only.",
      regimens: [],
      followUp: [],
      keyPoints: ["Hand hygiene, mask, symptom watch x7 days"],
      redFlags: [],
    };
  }

  const isHighRisk = riskGroups.length > 0;
  const isLate = hoursSinceExposure !== null && hoursSinceExposure > 48;
  const isVaccinated = vaxStatus === "current-season" || vaxStatus === "this-season";
  const vaxThisSeason = vaxStatus === "current-season";

  // If vaccinated current season + no high risk → observe
  if (vaxThisSeason && !isHighRisk) {
    return {
      recommend: false,
      rationale: "Vaccinated this season with current vaccine, no high-risk conditions. Symptom monitoring and early treatment if symptoms develop.",
      regimens: [],
      followUp: [
        { test: "Symptom monitoring", timing: "Day 0–7", notes: "Fever, cough, sore throat, myalgia" },
      ],
      redFlags: [],
      keyPoints: [
        "Influenza vaccine this season provides best protection. Continue hand hygiene + mask.",
      ],
    };
  }

  // Outside 48h window → no PEP, recommend early treatment
  if (isLate) {
    return {
      recommend: false,
      rationale: `Exposure was ${hoursSinceExposure}h ago (>48 h window). Chemoprophylaxis no longer effective. If symptoms develop, start antiviral treatment (oseltamivir) promptly.`,
      regimens: [],
      followUp: [
        { test: "Symptom onset", timing: "Days 0–7", notes: "If fever/cough/sore throat develop → test (RAT or PCR) + oseltamivir 75 mg BID x5d" },
      ],
      keyPoints: [
        "Oseltamivir treatment effective even if started >48h in hospitalized / severe cases.",
        "Risk groups should have a low threshold for testing and early treatment.",
      ],
      redFlags: [
        "Exposure >48 h ago → chemoprophylaxis not recommended per CDC; switch to watch-and-treat",
        "If hospitalized or severely immunocompromised, consider oseltamivir treatment regardless of timing if symptomatic",
      ],
    };
  }

  // -- PEP indicated --
  const regimens: PEPRegimen[] = [];
  const followUp: PEPFollowUp[] = [];

  if (isHighRisk) {
    regimens.push({
      phase: "Chemoprophylaxis (high risk)",
      drug: "Oseltamivir 75 mg PO",
      dose: "75 mg PO once daily",
      duration: "10 days (or 7 days after last exposure)",
      notes: "Start within 48 h of exposure. Use 150 mg daily in dialysis patients.",
    });
    followUp.push(
      { test: "Symptom check", timing: "Daily x10 days", notes: "If breakthrough symptoms → switch to treatment dose (75 mg BID x5d)" },
      { test: "Influenza test (RAT or PCR)", timing: "If symptoms develop", notes: "Confirm and consider treatment dose" },
    );
  } else if (!isVaccinated) {
    regimens.push({
      phase: "Chemoprophylaxis (unvaccinated)",
      drug: "Oseltamivir 75 mg PO",
      dose: "75 mg PO once daily",
      duration: "10 days (or 7 days after last exposure)",
      notes: "Consider if in close contact with confirmed case. Balances modest benefit with side effects (nausea, headache).",
    });
    followUp.push({
      test: "Symptom monitoring",
      timing: "10 days",
      notes: "If breakthrough → test + treatment dose",
    });
  } else {
    // Vaccinated but not current season OR vaccinated + high risk
    regimens.push({
      phase: "Chemoprophylaxis",
      drug: "Oseltamivir 75 mg PO",
      dose: "75 mg PO once daily",
      duration: "10 days",
      notes: "Vaccinated but high-risk contacts or suboptimal vaccine match may still benefit",
    });
    followUp.push({
      test: "Symptom monitoring",
      timing: "10 days",
      notes: "Switch to treatment dose if symptoms develop",
    });
  }

  const specialPopulations: { label: string; advice: string }[] = [];
  if (riskGroups.includes("pregnant")) {
    specialPopulations.push({
      label: "Pregnancy",
      advice: "Oseltamivir is pregnancy category C — but benefits usually outweigh risks. Treat/prophylax as indicated. Pregnant women are at high risk for severe influenza.",
    });
  }
  if (riskGroups.includes("immunocompromised")) {
    specialPopulations.push({
      label: "Immunocompromised",
      advice: "May have prolonged viral shedding. Consider extended prophylaxis (14 days or longer). Test if symptoms appear (PCR preferred over RAT due to higher sensitivity).",
    });
  }

  return {
    recommend: true,
    rationale: isHighRisk
      ? "High-risk close contact with confirmed influenza. Chemoprophylaxis with oseltamivir recommended."
      : "Close contact with confirmed influenza. Oseltamivir chemoprophylaxis recommended (especially if unvaccinated or vaccine mismatch).",
    regimens,
    followUp,
    specialPopulations: specialPopulations.length > 0 ? specialPopulations : undefined,
    redFlags: [
      "Oseltamivir must start within 48 h of exposure for PEP efficacy",
      "Zanamivir (inhaled) is an alternative if oseltamivir resistance suspected, but contraindicated in asthma/COPD",
      "Breakthrough influenza while on prophylaxis → treat with treatment-dose oseltamivir 75 mg BID x5d",
      "Household influenza attack rate: 10–40% — highest in children",
    ],
    keyPoints: [
      "Annual influenza vaccine remains the primary prevention — both seasonal and universal recommendations.",
      "Oseltamivir PEP reduces risk by ~70-85% if taken within 48h of exposure.",
      "Side effects: nausea/vomiting (10-15%), headache. Taking with food reduces GI effects.",
      "Peramivir IV and baloxavir marboxil are treatment options but NOT approved for PEP.",
    ],
  };
}

// ─── Summary builder ───
function buildSummary(
  exposure: PEPExposure,
  outcome: PEPOutcome,
  context: Record<string, string>,
): string {
  const lines: string[] = [
    `POST-EXPOSURE PROPHYLAXIS PLAN — ${exposure.label}`,
    "=".repeat(60),
    `Date: ${new Date().toLocaleString()}`,
    `Pathogen: ${exposure.pathogen}`,
    `Incubation: ${exposure.incubation}`,
    `Timeframe: ${exposure.timeframe}`,
    "",
    "CONTEXT",
    ...Object.entries(context).map(([k, v]) => `  ${k}: ${v}`),
    "",
    "RECOMMENDATION",
    `  PEP indicated: ${outcome.recommend ? "YES" : "NO"}`,
    `  Rationale: ${outcome.rationale}`,
    "",
  ];

  if (outcome.regimens.length > 0) {
    lines.push("REGIMEN", "");
    outcome.regimens.forEach(r => {
      lines.push(`  [${r.phase}]`);
      lines.push(`    Drug: ${r.drug}`);
      lines.push(`    Dose: ${r.dose}`);
      lines.push(`    Duration: ${r.duration}`);
      if (r.notes) lines.push(`    Notes: ${r.notes}`);
      lines.push("");
    });
  }

  if (outcome.followUp.length > 0) {
    lines.push("FOLLOW-UP TESTING", "");
    outcome.followUp.forEach(f => {
      lines.push(`  • ${f.test} — ${f.timing}: ${f.notes}`);
    });
    lines.push("");
  }

  if (outcome.specialPopulations && outcome.specialPopulations.length > 0) {
    lines.push("SPECIAL POPULATIONS", "");
    outcome.specialPopulations.forEach(s => {
      lines.push(`  • ${s.label}: ${s.advice}`);
    });
    lines.push("");
  }

  if (outcome.redFlags.length > 0) {
    lines.push("RED FLAGS / WARNINGS", "");
    outcome.redFlags.forEach(f => lines.push(`  ⚠ ${f}`));
    lines.push("");
  }

  if (outcome.keyPoints.length > 0) {
    lines.push("KEY POINTS", "");
    outcome.keyPoints.forEach(p => lines.push(`  • ${p}`));
    lines.push("");
  }

  lines.push("Disclaimer: Decision-support only. Local guidelines (CDC, WHO, national) always take precedence. Consult ID for complex cases.");

  return lines.join("\n");
}

// ─── Main component ───
export default function PEP() {
  // Basic selection
  const [exposureId, setExposureId] = useState<string>("hiv-needlestick");
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Shared context
  const [weight, setWeight] = useState("");
  const [age, setAge] = useState("");
  const [egfr, setEgfr] = useState("");

  // HIV-specific
  const [hivSourceStatus, setHivSourceStatus] = useState<HivSourceStatus>("unknown");
  const [hivInjuryType, setHivInjuryType] = useState<HivInjuryType>("solid-needle");
  const [hivFluidType, setHivFluidType] = useState<HivFluidType>("blood");
  const [hivSexualRole, setHivSexualRole] = useState<HivSexualRole>("receptive-anal");
  const [hivCondom, setHivCondom] = useState(false);
  const [hivTiming, setHivTiming] = useState<HivTiming>("<4h");

  // HBV-specific
  const [hbvSource, setHbSource] = useState<HbvSource>("hbsag-positive");
  const [hbvVaxStatus, setHbVaxStatus] = useState<HbvVaxStatus>("unvaccinated");

  // Tetanus-specific
  const [woundType, setWoundType] = useState<TetanusWound>("dirty-puncture");
  const [tetanusVax, setTetanusVax] = useState<TetanusVax>("not-updated");
  const [lastBooster, setLastBooster] = useState("");

  // Rabies-specific
  const [rabiesCategory, setRabiesCategory] = useState<RabiesExposureCategory>("III");
  const [rabiesAnimal, setRabiesAnimal] = useState<RabiesAnimal>("bat");
  const [rabiesVax, setRabiesVax] = useState<RabiesVax>("not-vaccinated");
  const [rabiesLocation, setRabiesLocation] = useState("");

  // Meningococcal-specific
  const [meningoRelation, setMeningoRelation] = useState<MeningoRelation>("household");
  const [meningoVax, setMeningoVax] = useState<MeningoVax>("unvaccinated");
  const [meningoSerogroup, setMeningoSerogroup] = useState<"ACWY" | "B" | "unknown">("unknown");

  // Influenza-specific
  const [fluExposureType, setFluExposureType] = useState<FluExposureType>("household");
  const [fluVaxStatus, setFluVaxStatus] = useState<FluVaxStatus>("not-vaccinated");
  const [fluRiskGroups, setFluRiskGroups] = useState<FluRiskGroup[]>([]);
  const [fluHours, setFluHours] = useState("");

  const exposure = EXPOSURES.find(e => e.id === exposureId)!;
  const n = (s: string) => parseFloat(s) || 0;

  const PILL = "w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30";

  // ─── Outcome ───
  const outcome = useMemo((): PEPOutcome | null => {
    const cat = exposure.category;

    if (cat === "HIV") {
      return getHivPepRegimen(exposure.label, egfr ? n(egfr) : undefined);
    }
    if (exposureId === "hbv") {
      return getHbvPep(hbvSource, hbvVaxStatus);
    }
    if (exposureId === "hcv") {
      return getHcvMonitoring();
    }
    if (exposureId === "tetanus") {
      return getTetanusPep(woundType, tetanusVax, lastBooster ? n(lastBooster) : null);
    }
    if (exposureId === "rabies") {
      return getRabiesPep(rabiesCategory, rabiesAnimal, rabiesVax, rabiesLocation);
    }
    if (exposureId === "meningococcal") {
      return getMeningoPep(meningoRelation, meningoVax, meningoSerogroup);
    }
    if (exposureId === "influenza") {
      return getInfluenzaPep(fluExposureType, fluVaxStatus, fluRiskGroups, fluHours ? n(fluHours) : null);
    }
    return null;
  }, [exposureId, exposure.category, hbvSource, hbvVaxStatus, woundType, tetanusVax, lastBooster, rabiesCategory, rabiesAnimal, rabiesVax, rabiesLocation, meningoRelation, meningoVax, meningoSerogroup, fluExposureType, fluVaxStatus, fluRiskGroups, fluHours, egfr]);

  const contextMap: Record<string, string> = {};
  if (exposure.category === "HIV") {
    contextMap["Source HIV status"] = hivSourceStatus;
    if (exposureId.includes("needlestick")) contextMap["Injury type"] = hivInjuryType;
    if (exposureId.includes("sex")) contextMap["Sexual role"] = hivSexualRole;
    contextMap["Timing since exposure"] = hivTiming;
    contextMap["Condom used"] = hivCondom ? "Yes" : "No";
  }
  if (exposureId === "hbv") contextMap["Source HBsAg"] = hbvSource;
  if (exposureId === "hcv") contextMap["Source"] = "HCV-RNA+";
  if (exposureId === "tetanus") {
    contextMap["Wound type"] = WOUND_CATEGORIES[woundType].label;
    contextMap["Vaccination status"] = tetanusVax;
    contextMap["Last booster (yr)"] = lastBooster || "—";
  }
  if (exposureId === "rabies") {
    contextMap["Category"] = rabiesCategory;
    contextMap["Animal"] = rabiesAnimal;
  }
  if (exposureId === "meningococcal") {
    contextMap["Relation"] = meningoRelation;
    contextMap["Serogroup"] = meningoSerogroup;
  }
  if (exposureId === "influenza") {
    contextMap["Exposure type"] = fluExposureType;
    contextMap["Vaccination"] = fluVaxStatus;
    contextMap["Hours since exposure"] = fluHours || "—";
    contextMap["Risk groups"] = fluRiskGroups.length > 0 ? fluRiskGroups.join(", ") : "None";
  }
  if (weight) contextMap["Weight"] = weight;
  if (age) contextMap["Age"] = age;

  const summary = useMemo(() => {
    if (!outcome) return "";
    return buildSummary(exposure, outcome, contextMap);
  }, [exposure, outcome, contextMap]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(summary);
    toast.success("Summary copied");
  };

  const handlePrint = () => {
    const html = `<!doctype html><html><head><title>PEP — ${exposure.label}</title>
      <style>body{font-family:system-ui,sans-serif;max-width:780px;margin:2rem auto;padding:0 1.5rem;color:#111;line-height:1.5}
      h1{font-size:18px;border-bottom:2px solid #333;padding-bottom:6px}
      pre{white-space:pre-wrap;font-family:inherit;font-size:13px}
      .meta{font-size:11px;color:#666;margin-top:24px;border-top:1px solid #ccc;padding-top:8px}</style></head>
      <body><h1>PEP Plan — ${exposure.label}</h1>
      <pre>${summary.replace(/</g,"&lt;")}</pre>
      <div class="meta">Generated ${new Date().toLocaleString()} — decision support, not a substitute for clinical judgment.</div>
      <script>window.onload=()=>window.print()</script></body></html>`;
    const w = window.open("", "_blank");
    if (w) { w.document.write(html); w.document.close(); }
  };

  // ─── Urgency badge ───
  const urgencyBadge = (urgency: string) => {
    const colors: Record<string, string> = {
      emergent: "bg-red-500/15 text-red-400 border-red-500/30",
      urgent: "bg-amber-500/15 text-amber-400 border-amber-500/30",
      "same-day": "bg-blue-500/15 text-blue-400 border-blue-500/30",
      "within-72h": "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
      "within-7d": "bg-muted text-muted-foreground border-border",
    };
    return (
      <Badge className={colors[urgency] || ""}>
        {urgency === "emergent" ? "EMERGENT" : urgency === "urgent" ? "URGENT" : urgency === "same-day" ? "Same day" : urgency === "within-72h" ? "Within 72h" : "Within 7d"}
      </Badge>
    );
  };

  return (
    <div className="space-y-4 max-w-6xl mx-auto p-4">
      {/* Header */}
      <Card className="border-amber-500/30 bg-gradient-to-br from-amber-500/5 to-orange-500/5">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-amber-500" />
            <CardTitle className="text-xl">Post-Exposure Prophylaxis (PEP)</CardTitle>
          </div>
          <CardDescription>
            Decision-support for HIV, HBV, HCV, Tetanus, Rabies, Meningococcal, and Influenza post-exposure management.
            Start PEP immediately — time is critical.
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Exposure picker */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm">Select Exposure Type</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {(["HIV", "Viral Hepatitis", "Viral", "Bacterial"] as string[]).map(cat => (
              <div key={cat} className="space-y-1">
                <div className="text-xs uppercase tracking-wide text-muted-foreground">{cat}</div>
                {EXPOSURES.filter(e => e.category === cat).map(e => (
                  <button
                    key={e.id}
                    onClick={() => setExposureId(e.id)}
                    className={`w-full text-left text-xs rounded-md border px-2 py-1.5 transition flex items-center justify-between gap-2 ${
                      exposureId === e.id
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border hover:bg-muted"
                    }`}
                  >
                    <span className="truncate">{e.label}</span>
                    <span className="shrink-0">{urgencyBadge(e.urgency)}</span>
                  </button>
                ))}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Context inputs: shared + exposure-specific */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FlaskConical className="h-4 w-4 text-primary" />
              <CardTitle className="text-sm">Clinical Context</CardTitle>
            </div>
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-xs text-muted-foreground hover:text-foreground underline"
            >
              {showAdvanced ? "Less" : "More"} options
            </button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Shared inputs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Weight (kg)</Label>
              <Input className="h-9" value={weight} onChange={e => setWeight(e.target.value)} placeholder="e.g. 70" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Age (yrs)</Label>
              <Input className="h-9" value={age} onChange={e => setAge(e.target.value)} placeholder="e.g. 35" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">eGFR (mL/min)</Label>
              <Input className="h-9" value={egfr} onChange={e => setEgfr(e.target.value.replace(/[^\d.]/g, ""))} placeholder="e.g. 90" />
            </div>
          </div>

          {/* ─── HIV-specific ─── */}
          {exposure.category === "HIV" && (
            <div className="border-t border-border pt-3 space-y-3">
              <div className="text-xs font-semibold text-muted-foreground">HIV-specific</div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-1">
                  <Label className="text-xs">Source HIV status</Label>
                  <select className={PILL} value={hivSourceStatus} onChange={e => setHivSourceStatus(e.target.value as HivSourceStatus)}>
                    <option value="positive-highVL">HIV+ (detectable / high VL)</option>
                    <option value="positive-lowVL">HIV+ (suppressed / low VL)</option>
                    <option value="unknown">Unknown status</option>
                    <option value="negative">HIV-negative</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Timing since exposure</Label>
                  <select className={PILL} value={hivTiming} onChange={e => setHivTiming(e.target.value as HivTiming)}>
                    <option value="<4h">&lt; 4 hours</option>
                    <option value="4-24h">4–24 hours</option>
                    <option value="24-48h">24–48 hours</option>
                    <option value="48-72h">48–72 hours</option>
                    <option value=">72h">&gt; 72 hours (PEP not effective)</option>
                  </select>
                </div>
                {exposureId.includes("needlestick") && (
                  <>
                    <div className="space-y-1">
                      <Label className="text-xs">Injury type</Label>
                      <select className={PILL} value={hivInjuryType} onChange={e => setHivInjuryType(e.target.value as HivInjuryType)}>
                        <option value="solid-needle">Solid needle (suture)</option>
                        <option value="hollow-needle">Hollow-bore needle (phlebotomy)</option>
                        <option value="deep">Deep injury</option>
                        <option value="superficial">Superficial</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Fluid type</Label>
                      <select className={PILL} value={hivFluidType} onChange={e => setHivFluidType(e.target.value as HivFluidType)}>
                        <option value="blood">Blood / blood-tinged fluid</option>
                        <option value="fluid-with-blood">Fluid with visible blood</option>
                        <option value="csf-peritoneal">CSF / peritoneal / amniotic fluid</option>
                        <option value="other">Other (semen, vaginal)</option>
                        <option value="non-infectious">Non-infectious fluid (urine, saliva)</option>
                      </select>
                    </div>
                  </>
                )}
                {exposureId.includes("sexual") && (
                  <>
                    <div className="space-y-1">
                      <Label className="text-xs">Sexual act</Label>
                      <select className={PILL} value={hivSexualRole} onChange={e => setHivSexualRole(e.target.value as HivSexualRole)}>
                        <option value="receptive-anal">Receptive anal</option>
                        <option value="receptive-vaginal">Receptive vaginal</option>
                        <option value="insertive-anal">Insertive anal</option>
                        <option value="insertive-vaginal">Insertive vaginal</option>
                        <option value="oral">Oral (giving/receiving)</option>
                      </select>
                    </div>
                    <label className="flex items-center gap-2 text-xs cursor-pointer">
                      <Checkbox checked={hivCondom} onCheckedChange={v => setHivCondom(v === true)} />
                      Condom used (failure/breakage)
                    </label>
                  </>
                )}
              </div>
            </div>
          )}

          {/* ─── HBV-specific ─── */}
          {exposureId === "hbv" && (
            <div className="border-t border-border pt-3 space-y-3">
              <div className="text-xs font-semibold text-muted-foreground">HBV-specific</div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label className="text-xs">Source HBsAg</Label>
                  <select className={PILL} value={hbvSource} onChange={e => setHbSource(e.target.value as HbvSource)}>
                    <option value="hbsag-positive">HBsAg-positive</option>
                    <option value="hbsag-unknown">Unknown (awaiting results)</option>
                    <option value="hbsag-negative">HBsAg-negative</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Exposed person's vaccination / immunity</Label>
                  <select className={PILL} value={hbvVaxStatus} onChange={e => setHbVaxStatus(e.target.value as HbvVaxStatus)}>
                    <option value="vaccinated-responder">Vaccinated, known responder (anti-HBs ≥10)</option>
                    <option value="vaccinated-nonresponder">Vaccinated, known non-responder</option>
                    <option value="unknown-responder">Vaccinated, immune status unknown</option>
                    <option value="unvaccinated">Never vaccinated</option>
                    <option value="incomplete">Partially vaccinated (incomplete series)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* ─── Tetanus-specific ─── */}
          {exposureId === "tetanus" && (
            <div className="border-t border-border pt-3 space-y-3">
              <div className="text-xs font-semibold text-muted-foreground">Tetanus-specific</div>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="space-y-1">
                  <Label className="text-xs">Wound type</Label>
                  <select className={PILL} value={woundType} onChange={e => setWoundType(e.target.value as TetanusWound)}>
                    <option value="clean-minor">Clean, minor wound</option>
                    <option value="clean-major">Clean, major wound</option>
                    <option value="dirty-puncture">Dirty / puncture / soil contamination</option>
                    <option value="dirty-heavy">Heavy contamination / devitalized tissue</option>
                    <option value="burn-frostbite">Burn / frostbite / crush</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Vaccination status</Label>
                  <select className={PILL} value={tetanusVax} onChange={e => setTetanusVax(e.target.value as TetanusVax)}>
                    <option value="up-to-date">Up-to-date (completed series + boosters)</option>
                    <option value="not-updated">Not up-to-date (overdue for booster)</option>
                    <option value="unknown">Unknown</option>
                    <option value="never">Never vaccinated</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Years since last booster</Label>
                  <Input className="h-9" value={lastBooster} onChange={e => setLastBooster(e.target.value.replace(/[^\d.]/g, ""))} placeholder="e.g. 8" />
                </div>
              </div>
            </div>
          )}

          {/* ─── Rabies-specific ─── */}
          {exposureId === "rabies" && (
            <div className="border-t border-border pt-3 space-y-3">
              <div className="text-xs font-semibold text-muted-foreground">Rabies-specific</div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-1">
                  <Label className="text-xs">WHO exposure category</Label>
                  <select className={PILL} value={rabiesCategory} onChange={e => setRabiesCategory(e.target.value as RabiesExposureCategory)}>
                    <option value="I">I — Touching/feeding, intact skin</option>
                    <option value="II">II — Minor scratch, no bleeding</option>
                    <option value="III">III — Bite/scratch with bleeding, mucous membrane</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Animal type</Label>
                  <select className={PILL} value={rabiesAnimal} onChange={e => setRabiesAnimal(e.target.value as RabiesAnimal)}>
                    <option value="bat">Bat</option>
                    <option value="raccoon-skunk-fox">Raccoon / Skunk / Fox</option>
                    <option value="dog-cat-domestic">Domestic dog/cat (vaccinated)</option>
                    <option value="dog-cat-stray">Stray dog/cat (unknown)</option>
                    <option value="rodent-rabbit">Rodent / Rabbit</option>
                    <option value="livestock">Livestock (horse, cow)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Prior rabies vaccination</Label>
                  <select className={PILL} value={rabiesVax} onChange={e => setRabiesVax(e.target.value as RabiesVax)}>
                    <option value="not-vaccinated">Not vaccinated</option>
                    <option value="previously-vaccinated">Previously vaccinated (full course)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Bite location</Label>
                  <Input className="h-9" value={rabiesLocation} onChange={e => setRabiesLocation(e.target.value)} placeholder="e.g. right forearm" />
                </div>
              </div>
            </div>
          )}

          {/* ─── Meningococcal-specific ─── */}
          {exposureId === "meningococcal" && (
            <div className="border-t border-border pt-3 space-y-3">
              <div className="text-xs font-semibold text-muted-foreground">Meningococcal-specific</div>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="space-y-1">
                  <Label className="text-xs">Relation to index case</Label>
                  <select className={PILL} value={meningoRelation} onChange={e => setMeningoRelation(e.target.value as MeningoRelation)}>
                    <option value="household">Household contact</option>
                    <option value="daycare">Daycare / nursery contact</option>
                    <option value="kissing-sexual">Kissing partner / sexual contact</option>
                    <option value="healthcare-airway">Healthcare (unprotected airway)</option>
                    <option value="healthcare-other">Healthcare (other, no airway)</option>
                    <option value="casual">Casual contact (classroom, office)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Vaccination history</Label>
                  <select className={PILL} value={meningoVax} onChange={e => setMeningoVax(e.target.value as MeningoVax)}>
                    <option value="unvaccinated">Unvaccinated</option>
                    <option value="vaccinated-MenACWY">MenACWY vaccinated</option>
                    <option value="vaccinated-MenB">MenB vaccinated</option>
                    <option value="vaccinated-both">Both MenACWY + MenB</option>
                    <option value="unknown">Unknown</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Known serogroup</Label>
                  <select className={PILL} value={meningoSerogroup} onChange={e => setMeningoSerogroup(e.target.value as "ACWY" | "B" | "unknown")}>
                    <option value="unknown">Not yet typed / unknown</option>
                    <option value="ACWY">Serogroup ACWY</option>
                    <option value="B">Serogroup B</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* ─── Influenza-specific ─── */}
          {exposureId === "influenza" && (
            <div className="border-t border-border pt-3 space-y-3">
              <div className="text-xs font-semibold text-muted-foreground">Influenza-specific</div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-1">
                  <Label className="text-xs">Exposure type</Label>
                  <select className={PILL} value={fluExposureType} onChange={e => setFluExposureType(e.target.value as FluExposureType)}>
                    <option value="household">Household contact</option>
                    <option value="occupational-hcw">Occupational (HCW)</option>
                    <option value="caregiver">Caregiver</option>
                    <option value="prolonged-close">Prolonged close contact</option>
                    <option value="casual">Casual contact</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Vaccination status</Label>
                  <select className={PILL} value={fluVaxStatus} onChange={e => setFluVaxStatus(e.target.value as FluVaxStatus)}>
                    <option value="current-season">Current season vaccine</option>
                    <option value="this-season">Vaccinated this season (recent)</option>
                    <option value="not-vaccinated">Not vaccinated this season</option>
                    <option value="unknown">Unknown</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Hours since exposure</Label>
                  <Input className="h-9" type="number" min="0" max="72" value={fluHours} onChange={e => setFluHours(e.target.value)} placeholder="e.g. 12" />
                </div>
              </div>
              {/* Risk groups */}
              <div className="space-y-1.5">
                <Label className="text-xs">Risk groups (select all that apply)</Label>
                <div className="flex flex-wrap gap-2">
                  {([
                    { value: "none", label: "None" },
                    { value: "age-65+", label: "Age ≥65" },
                    { value: "pregnant", label: "Pregnant" },
                    { value: "immunocompromised", label: "Immunocompromised" },
                    { value: "chronic-respiratory", label: "Chronic respiratory" },
                    { value: "cardiac", label: "Cardiac disease" },
                    { value: "renal", label: "Renal disease" },
                    { value: "metabolic", label: "Diabetes / metabolic" },
                    { value: "morbid-obesity", label: "Morbid obesity (BMI ≥40)" },
                    { value: "age-<5", label: "Child <5 yr" },
                    { value: "neurodevelopmental", label: "Neurodevelopmental" },
                  ] as { value: FluRiskGroup; label: string }[]).map(g => (
                    <label key={g.value} className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs cursor-pointer transition ${
                      fluRiskGroups.includes(g.value)
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border hover:bg-muted text-muted-foreground"
                    }`}>
                      <Checkbox
                        checked={fluRiskGroups.includes(g.value)}
                        onCheckedChange={v => {
                          if (g.value === "none") {
                            setFluRiskGroups(v ? [] : []);
                          } else {
                            setFluRiskGroups(prev =>
                              v === true
                                ? [...prev.filter(r => r !== "none"), g.value]
                                : prev.filter(r => r !== g.value)
                            );
                          }
                        }}
                      />
                      {g.label}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ─── Output ─── */}
      {outcome && (
        <>
          {/* Recommendation */}
          <Card className={outcome.recommend ? "border-red-500/30 bg-gradient-to-br from-red-500/5 to-amber-500/5" : "border-emerald-500/30 bg-gradient-to-br from-emerald-500/5 to-teal-500/5"}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {outcome.recommend ? (
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                  ) : (
                    <Shield className="h-4 w-4 text-emerald-500" />
                  )}
                  <CardTitle className="text-sm">
                    {outcome.recommend ? "PEP Indicated" : "PEP Not Indicated"}
                  </CardTitle>
                </div>
                <Badge variant={outcome.recommend ? "destructive" : "secondary"}>
                  {outcome.recommend ? "ACTIVE" : "OBSERVE"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-xs leading-relaxed">{outcome.rationale}</p>
            </CardContent>
          </Card>

          {/* Regimen table */}
          {outcome.regimens.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <Pill className="h-4 w-4 text-primary" />
                  <CardTitle className="text-sm">Regimen</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto rounded-md border border-border">
                  <table className="w-full text-sm min-w-[480px]">
                    <thead className="bg-muted text-xs uppercase text-muted-foreground">
                      <tr>
                        <th className="px-3 py-2 text-left">Phase</th>
                        <th className="px-3 py-2 text-left">Drug</th>
                        <th className="px-3 py-2 text-left">Dose</th>
                        <th className="px-3 py-2 text-left">Duration</th>
                        <th className="px-3 py-2 text-left">Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {outcome.regimens.map((r, i) => (
                        <tr key={i} className="border-t border-border">
                          <td className="px-3 py-2 font-medium text-xs">{r.phase}</td>
                          <td className="px-3 py-2">{r.drug}</td>
                          <td className="px-3 py-2">{r.dose}</td>
                          <td className="px-3 py-2">{r.duration}</td>
                          <td className="px-3 py-2 text-xs text-muted-foreground">{r.notes}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Follow-up testing */}
          {outcome.followUp.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" />
                  <CardTitle className="text-sm">Follow-up Testing Schedule</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto rounded-md border border-border">
                  <table className="w-full text-sm min-w-[480px]">
                    <thead className="bg-muted text-xs uppercase text-muted-foreground">
                      <tr>
                        <th className="px-3 py-2 text-left">Test</th>
                        <th className="px-3 py-2 text-left">Timing</th>
                        <th className="px-3 py-2 text-left">Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {outcome.followUp.map((f, i) => (
                        <tr key={i} className="border-t border-border">
                          <td className="px-3 py-2 font-medium">{f.test}</td>
                          <td className="px-3 py-2">{f.timing}</td>
                          <td className="px-3 py-2 text-xs text-muted-foreground">{f.notes}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Special populations */}
          {outcome.specialPopulations && outcome.specialPopulations.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <Baby className="h-4 w-4 text-primary" />
                  <CardTitle className="text-sm">Special Populations</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {outcome.specialPopulations.map((s, i) => (
                  <div key={i} className="rounded-md border border-border p-3">
                    <div className="text-xs font-semibold">{s.label}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{s.advice}</div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Red flags */}
          {outcome.redFlags.length > 0 && (
            <Card className="border-red-500/30 bg-gradient-to-br from-red-500/10 to-rose-500/5">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                  <CardTitle className="text-sm text-red-400">Red Flags / Warnings</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1">
                  {outcome.redFlags.map((f, i) => (
                    <li key={i} className="text-xs flex gap-2">
                      <span className="text-red-400 shrink-0">•</span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Key points */}
          {outcome.keyPoints.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <HeartPulse className="h-4 w-4 text-primary" />
                  <CardTitle className="text-sm">Key Points</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1">
                  {outcome.keyPoints.map((p, i) => (
                    <li key={i} className="text-xs flex gap-2">
                      <span className="text-primary shrink-0">•</span>
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Summary tool bar */}
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={handleCopy}>
              <Copy className="h-4 w-4 mr-1" /> Copy Summary
            </Button>
            <Button size="sm" variant="outline" onClick={handlePrint}>
              <Printer className="h-4 w-4 mr-1" /> Print
            </Button>
            <Button size="sm" variant="outline" onClick={() => {
              downloadTextFile(`pep-${exposure.id}-${new Date().toISOString().slice(0, 10)}`, summary);
            }}>
              <Download className="h-4 w-4 mr-1" /> Download
            </Button>
          </div>
        </>
      )}

      {!outcome && (
        <Card className="border-border bg-muted/20">
          <CardContent className="py-6 text-center text-sm text-muted-foreground">
            Select exposure type and complete context fields to generate PEP plan.
          </CardContent>
        </Card>
      )}
    </div>
  );
}