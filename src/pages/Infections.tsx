import { FrequencyBadge } from "@/components/FrequencyBadge";
import { useMemo, useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { AlertTriangle, Pill, Printer, Copy, Download, ShieldAlert, Baby, Activity, Hospital, FlaskConical, Image as ImageIcon, Brain } from "lucide-react";
import { downloadTextFile } from "@/lib/clinical-utils";
import { toast } from "sonner";
import SeriousInfections from "./infections/SeriousInfections";
import { CsdhRiskCalculator } from "@/calculators/perioperative/CsdhRiskCalculator";
import { ANTIBIOTICS_DATA } from "@/calculators/diabetes/antibiotics-data";
import ZoomableImage from "@/components/ZoomableImage";
import antibioticsSpectrum from "@/assets/antibiotics-spectrum.jpeg.asset.json";

function egfrBand(egfr: number): "normal" | "eGFR60_89" | "eGFR45_59" | "eGFR30_44" | "eGFR15_29" | "eGFRBelow15" {
  if (egfr >= 90) return "normal";
  if (egfr >= 60) return "eGFR60_89";
  if (egfr >= 45) return "eGFR45_59";
  if (egfr >= 30) return "eGFR30_44";
  if (egfr >= 15) return "eGFR15_29";
  return "eGFRBelow15";
}

const BAND_LABEL: Record<string, string> = {
  normal: "≥90",
  eGFR60_89: "60–89",
  eGFR45_59: "45–59",
  eGFR30_44: "30–44",
  eGFR15_29: "15–29",
  eGFRBelow15: "<15",
};

type RenalAdj = { drug: string; adjustment: string; notes: string };

function getRenalAdjustments(regimenDrug: string, egfr: number): RenalAdj[] {
  const band = egfrBand(egfr);
  const parts = regimenDrug.split(/[+/,]| or /i).map((s) => s.trim().toLowerCase());
  const results: RenalAdj[] = [];
  const seen = new Set<string>();
  for (const part of parts) {
    if (!part) continue;
    const match = ANTIBIOTICS_DATA.find((d) => {
      const base = d.drug.toLowerCase().split(/[\s(\-]/)[0];
      return part.includes(base);
    });
    if (match && !seen.has(match.drug)) {
      seen.add(match.drug);
      const adj = band === "normal" ? "No adjustment (eGFR ≥90)" : (match as any)[band];
      results.push({ drug: match.drug, adjustment: adj, notes: match.notes });
    }
  }
  return results;
}

type Allergy = "none" | "penicillin-mild" | "penicillin-severe" | "macrolide" | "sulfa";
type Severity = "mild" | "moderate" | "severe";

type Regimen = {
  drug: string;
  dose: string;
  duration: string;
  notes?: string;
};

type ConditionDef = {
  id: string;
  label: string;
  category: string;
  needsAbx: (ctx: Ctx) => { needed: boolean; rationale: string };
  firstLine: Regimen[];
  pcnAllergyMild?: Regimen[];
  pcnAllergySevere?: Regimen[];
  pregnancy: { safe: string[]; avoid: string[]; note?: string };
  renalFlags?: string;
  severityEscalation: string;
  redFlags: string[];
  notes?: string;
};

type Ctx = {
  severity: Severity;
  pregnant: boolean;
  allergy: Allergy;
  egfr: number | null;
  age: number | null;
  duration: string;
};

const CONDITIONS: ConditionDef[] = [
  {
    id: "strep",
    label: "Strep Throat (GAS pharyngitis)",
    category: "ENT",
    needsAbx: () => ({ needed: true, rationale: "Confirmed GAS by RADT or culture (Centor ≥3) → treat to prevent rheumatic fever." }),
    firstLine: [
      { drug: "Penicillin V", dose: "500 mg PO BID–TID", duration: "10 days" },
      { drug: "Amoxicillin", dose: "1 g PO daily or 500 mg BID", duration: "10 days" },
    ],
    pcnAllergyMild: [{ drug: "Cefuroxime", dose: "250 mg PO BID", duration: "10 days" }],
    pcnAllergySevere: [
      { drug: "Azithromycin", dose: "500 mg PO day 1, then 250 mg daily", duration: "5 days" },
      { drug: "Clindamycin", dose: "300 mg PO TID", duration: "10 days" },
    ],
    pregnancy: { safe: ["Penicillin V", "Amoxicillin", "Cephalexin"], avoid: ["Doxycycline", "Fluoroquinolones"] },
    severityEscalation: "Drooling, stridor, trismus, neck swelling → ENT/ED for peritonsillar/retropharyngeal abscess.",
    redFlags: ["Inability to swallow saliva", "Stridor", "Asymmetric tonsillar bulge", "Toxic appearance"],
  },
  {
    id: "sinusitis",
    label: "Acute Bacterial Sinusitis",
    category: "ENT",
    needsAbx: (c) => ({
      needed: c.severity !== "mild",
      rationale: c.severity === "mild"
        ? "Most acute sinusitis is viral. Watchful waiting 7 days if symptoms <10 days and not worsening."
        : "Symptoms ≥10 days, severe (fever ≥39°C + purulent discharge ≥3 days), or double-worsening → bacterial.",
    }),
    firstLine: [{ drug: "Amoxicillin-clavulanate", dose: "875/125 mg PO BID", duration: "5–7 days" }],
    pcnAllergyMild: [{ drug: "Cefuroxime / Cefpodoxime", dose: "500 mg / 200 mg PO BID", duration: "5–7 days" }],
    pcnAllergySevere: [
      { drug: "Doxycycline", dose: "100 mg PO BID", duration: "5–7 days" },
      { drug: "Levofloxacin", dose: "500 mg PO daily", duration: "5–7 days", notes: "Reserve; tendon/QT risk" },
    ],
    pregnancy: { safe: ["Amoxicillin-clavulanate", "Cefuroxime"], avoid: ["Doxycycline", "Fluoroquinolones"] },
    severityEscalation: "Periorbital swelling, vision change, severe headache, altered mental status → ED imaging.",
    redFlags: ["Periorbital/orbital swelling", "Visual changes", "Severe HA or focal neuro deficit", "High fever with toxicity"],
  },
  {
    id: "om",
    label: "Otitis Media (adult)",
    category: "ENT",
    needsAbx: (c) => ({
      needed: c.severity !== "mild",
      rationale: "Treat moderate–severe pain, fever ≥39°C, or symptoms >48–72 h.",
    }),
    firstLine: [{ drug: "Amoxicillin", dose: "1 g PO TID (or amox-clav 875/125 BID if recent abx)", duration: "5–7 days" }],
    pcnAllergyMild: [{ drug: "Cefuroxime", dose: "500 mg PO BID", duration: "5–7 days" }],
    pcnAllergySevere: [{ drug: "Azithromycin", dose: "500 mg → 250 mg ×4", duration: "5 days" }],
    pregnancy: { safe: ["Amoxicillin", "Amoxicillin-clavulanate"], avoid: ["Doxycycline", "Fluoroquinolones"] },
    severityEscalation: "Mastoid tenderness, facial palsy, vertigo → urgent ENT.",
    redFlags: ["Mastoid swelling/erythema", "Facial nerve palsy", "Vertigo / hearing loss"],
  },
  {
    id: "uti",
    label: "Lower UTI (uncomplicated cystitis)",
    category: "GU",
    needsAbx: () => ({ needed: true, rationale: "Symptomatic cystitis → empiric antibiotics." }),
    firstLine: [
      { drug: "Nitrofurantoin", dose: "100 mg PO BID", duration: "5 days", notes: "Avoid if eGFR <30" },
      { drug: "TMP-SMX DS", dose: "1 tab PO BID", duration: "3 days", notes: "Avoid if local resistance >20%" },
      { drug: "Fosfomycin", dose: "3 g PO ×1", duration: "single dose" },
    ],
    pcnAllergyMild: [{ drug: "Nitrofurantoin / Fosfomycin", dose: "as above", duration: "as above" }],
    pcnAllergySevere: [{ drug: "Nitrofurantoin / Fosfomycin", dose: "as above", duration: "as above" }],
    pregnancy: {
      safe: ["Cephalexin 500 mg BID ×5–7d", "Fosfomycin 3 g ×1", "Amoxicillin-clavulanate"],
      avoid: ["Nitrofurantoin (avoid term/38+ wk)", "TMP-SMX (avoid 1st & 3rd trimester)", "Fluoroquinolones"],
    },
    renalFlags: "Nitrofurantoin contraindicated if eGFR <30. Adjust TMP-SMX in CKD.",
    severityEscalation: "Flank pain, fever, rigors, nausea/vomiting → treat as pyelonephritis (ciprofloxacin 500 BID 7d or ceftriaxone IM then PO).",
    redFlags: ["Fever / flank pain (pyelonephritis)", "Sepsis signs", "Pregnancy with any UTI", "Male UTI (treat as complicated)"],
  },
  {
    id: "cellulitis",
    label: "Cellulitis (non-purulent)",
    category: "Skin",
    needsAbx: () => ({ needed: true, rationale: "Bacterial skin infection — empiric coverage of streptococci ± MSSA." }),
    firstLine: [
      { drug: "Cephalexin", dose: "500 mg PO QID", duration: "5–7 days" },
      { drug: "Dicloxacillin", dose: "500 mg PO QID", duration: "5–7 days" },
    ],
    pcnAllergyMild: [{ drug: "Cefadroxil", dose: "1 g PO daily", duration: "5–7 days" }],
    pcnAllergySevere: [{ drug: "Clindamycin", dose: "450 mg PO TID", duration: "5–7 days" }],
    pregnancy: { safe: ["Cephalexin", "Dicloxacillin", "Clindamycin"], avoid: ["Doxycycline", "TMP-SMX (term)"] },
    severityEscalation: "If purulent/MRSA risk add TMP-SMX DS BID or doxycycline 100 BID. Systemic toxicity → IV (cefazolin) admission.",
    redFlags: ["Rapid spread", "Crepitus / bullae / severe pain out of proportion (necrotizing fasciitis)", "Hypotension / sepsis", "Lymphangitic streaking with toxicity"],
  },
  {
    id: "impetigo",
    label: "Impetigo",
    category: "Skin",
    needsAbx: (c) => ({
      needed: c.severity !== "mild",
      rationale: "Limited lesions → topical mupirocin. Numerous/bullous → systemic therapy.",
    }),
    firstLine: [
      { drug: "Mupirocin 2% ointment", dose: "TID to lesions", duration: "5 days", notes: "Limited disease" },
      { drug: "Cephalexin", dose: "500 mg PO QID", duration: "7 days", notes: "Extensive / bullous" },
    ],
    pcnAllergyMild: [{ drug: "Cefadroxil", dose: "1 g PO daily", duration: "7 days" }],
    pcnAllergySevere: [{ drug: "Clindamycin", dose: "300–450 mg PO TID", duration: "7 days" }],
    pregnancy: { safe: ["Mupirocin topical", "Cephalexin"], avoid: ["Doxycycline"] },
    severityEscalation: "Post-strep glomerulonephritis surveillance if outbreak; widespread → systemic abx.",
    redFlags: ["Spreading cellulitis", "Systemic symptoms", "Tea-coloured urine (PSGN)"],
  },
  {
    id: "bronchitis",
    label: "Acute Bronchitis",
    category: "Resp",
    needsAbx: () => ({ needed: false, rationale: "Almost always viral. Antibiotics not indicated regardless of sputum colour or duration <3 weeks." }),
    firstLine: [{ drug: "Symptomatic care", dose: "Fluids, antitussives, bronchodilator PRN", duration: "Up to 3 weeks" }],
    pregnancy: { safe: ["Symptomatic care"], avoid: ["Codeine in 3rd trimester"] },
    severityEscalation: "Consider CXR if HR>100, RR>24, T≥38°C, focal exam, age ≥75 → rule out pneumonia.",
    redFlags: ["Fever >38°C", "Tachypnea / hypoxia", "Focal crackles / consolidation", "Cough >3 weeks (consider pertussis, TB)"],
  },
  {
    id: "copd-ex",
    label: "COPD Exacerbation",
    category: "Resp",
    needsAbx: (c) => ({
      needed: c.severity !== "mild",
      rationale: "Antibiotics if ≥2 cardinal symptoms (↑dyspnea, ↑sputum volume, ↑purulence) — especially with purulence — or mechanical ventilation.",
    }),
    firstLine: [
      { drug: "Amoxicillin-clavulanate", dose: "875/125 mg PO BID", duration: "5 days" },
      { drug: "Doxycycline", dose: "100 mg PO BID", duration: "5 days" },
    ],
    pcnAllergyMild: [{ drug: "Doxycycline", dose: "100 mg PO BID", duration: "5 days" }],
    pcnAllergySevere: [{ drug: "Azithromycin", dose: "500 mg → 250 mg ×4", duration: "5 days", notes: "QT caution" }],
    pregnancy: { safe: ["Amoxicillin-clavulanate"], avoid: ["Doxycycline", "Fluoroquinolones"] },
    severityEscalation: "Add prednisone 40 mg PO ×5 d. If Pseudomonas risk (FEV1<50%, frequent abx, structural lung dz) → levofloxacin 750 mg.",
    redFlags: ["SpO2 <88%", "Use of accessory muscles", "Altered mentation", "Hemodynamic instability"],
  },
  {
    id: "bv",
    label: "Bacterial Vaginosis",
    category: "GU",
    needsAbx: () => ({ needed: true, rationale: "Symptomatic BV (Amsel ≥3 / Nugent ≥7) → treat." }),
    firstLine: [
      { drug: "Metronidazole PO", dose: "500 mg BID", duration: "7 days" },
      { drug: "Metronidazole 0.75% gel", dose: "5 g intravaginally daily", duration: "5 days" },
      { drug: "Clindamycin 2% cream", dose: "5 g intravaginally qHS", duration: "7 days" },
    ],
    pcnAllergyMild: [{ drug: "Metronidazole / Clindamycin", dose: "as above", duration: "as above" }],
    pcnAllergySevere: [{ drug: "Metronidazole / Clindamycin", dose: "as above", duration: "as above" }],
    pregnancy: {
      safe: ["Metronidazole 500 PO BID ×7d", "Clindamycin 300 PO BID ×7d"],
      avoid: [],
      note: "Treat symptomatic pregnant patients; oral preferred. Clindamycin cream may weaken latex condoms.",
    },
    severityEscalation: "Recurrence (≥3 episodes/yr): suppressive metronidazole gel 2×/wk ×4–6 mo.",
    redFlags: ["Pelvic pain / fever (consider PID)", "Pregnancy with preterm labor risk"],
  },
  {
    id: "pid",
    label: "Outpatient PID",
    category: "GU",
    needsAbx: () => ({ needed: true, rationale: "Low threshold to treat sexually active women with pelvic/adnexal tenderness or cervical motion tenderness." }),
    firstLine: [
      {
        drug: "Ceftriaxone + Doxycycline + Metronidazole",
        dose: "CTX 500 mg IM ×1 (1 g if >150 kg); doxy 100 mg PO BID ×14 d; metronidazole 500 mg PO BID ×14 d",
        duration: "14 days",
      },
    ],
    pcnAllergyMild: [{ drug: "Ceftriaxone usually tolerated", dose: "as above", duration: "14 days" }],
    pcnAllergySevere: [
      { drug: "Levofloxacin + Metronidazole", dose: "Levo 500 mg PO daily + metro 500 mg PO BID", duration: "14 days", notes: "Consult ID; verify gonorrhea susceptibility" },
    ],
    pregnancy: {
      safe: ["Inpatient IV therapy"],
      avoid: ["Doxycycline", "Fluoroquinolones"],
      note: "Suspected PID in pregnancy → admit for IV therapy and OB consult.",
    },
    severityEscalation: "Hospitalize if: pregnancy, failure of outpatient therapy, severe illness/N+V, tubo-ovarian abscess, unable to tolerate PO.",
    redFlags: ["Pregnancy", "Tubo-ovarian abscess on US", "Peritonitis / sepsis", "Failure to improve in 72 h"],
  },
  {
    id: "epididymitis",
    label: "Epididymitis",
    category: "GU",
    needsAbx: () => ({ needed: true, rationale: "Empiric coverage based on age/risk: STI vs enteric organisms." }),
    firstLine: [
      {
        drug: "<35 y or STI risk: Ceftriaxone + Doxycycline",
        dose: "CTX 500 mg IM ×1 + doxy 100 mg PO BID ×10 d",
        duration: "10 days",
      },
      {
        drug: "≥35 y or insertive anal sex: Ceftriaxone + Levofloxacin",
        dose: "CTX 500 mg IM ×1 + levo 500 mg PO daily ×10 d",
        duration: "10 days",
      },
      { drug: "Enteric only (low STI risk)", dose: "Levofloxacin 500 mg PO daily", duration: "10 days" },
    ],
    pcnAllergyMild: [{ drug: "Ceftriaxone usually tolerated", dose: "as above", duration: "10 days" }],
    pcnAllergySevere: [{ drug: "Levofloxacin + Doxycycline", dose: "as above", duration: "10 days" }],
    pregnancy: { safe: [], avoid: [], note: "Not applicable." },
    severityEscalation: "Severe pain, fever, abscess, failure at 72 h → urology/US; rule out torsion in any acute scrotum.",
    redFlags: ["Sudden severe pain (torsion!)", "Absent cremasteric reflex", "Fever / toxicity", "Scrotal abscess"],
  },
  {
    id: "prostatitis",
    label: "Acute Bacterial Prostatitis",
    category: "GU",
    needsAbx: () => ({ needed: true, rationale: "Empiric Gram-negative coverage; obtain urine culture first." }),
    firstLine: [
      { drug: "Ciprofloxacin", dose: "500 mg PO BID", duration: "10–14 days (chronic: 4–6 wk)" },
      { drug: "TMP-SMX DS", dose: "1 tab PO BID", duration: "10–14 days" },
    ],
    pcnAllergyMild: [{ drug: "Ciprofloxacin / TMP-SMX", dose: "as above", duration: "as above" }],
    pcnAllergySevere: [{ drug: "Ciprofloxacin / TMP-SMX", dose: "as above", duration: "as above" }],
    pregnancy: { safe: [], avoid: [], note: "Not applicable." },
    renalFlags: "Adjust ciprofloxacin if eGFR <50; TMP-SMX in CKD.",
    severityEscalation: "Septic, urinary retention, immunocompromised, post-procedure → admit for IV (ceftriaxone or pip-tazo).",
    redFlags: ["Sepsis / hemodynamic instability", "Urinary retention", "Prostatic abscess", "Failure after 48–72 h"],
  },
  {
    id: "csdh",
    label: "Chronic Subdural Hematoma (cSDH)",
    category: "Neurosurgery",
    needsAbx: () => ({ needed: false, rationale: "Medical condition, not an infection. Requires neurosurgical assessment for risk stratification." }),
    firstLine: [],
    pregnancy: { safe: [], avoid: [] },
    severityEscalation: "Increasing midline shift, worsening GCS, or new focal deficits → immediate neurosurgical consult.",
    redFlags: ["Worsening GCS", "New pupillary changes", "Rapidly progressive focal deficit", "Increasing midline shift"],
  },
];

const PILL_INPUT =
  "w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30";

export default function Infections() {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlTab = searchParams.get("tab") as "primary" | "serious" | null;
  const [tab, setTab] = useState<"primary" | "serious">(urlTab ?? "primary");

  useEffect(() => {
    if (urlTab) setTab(urlTab);
  }, [urlTab]);
  const [conditionId, setConditionId] = useState<string>("strep");
  const [severity, setSeverity] = useState<Severity>("mild");
  const [pregnant, setPregnant] = useState(false);
  const [allergy, setAllergy] = useState<Allergy>("none");
  const [egfr, setEgfr] = useState<string>("");
  const [age, setAge] = useState<string>("");
  const [duration, setDuration] = useState<string>("");

  const condition = useMemo(() => CONDITIONS.find((c) => c.id === conditionId)!, [conditionId]);
  const ctx: Ctx = {
    severity,
    pregnant,
    allergy,
    egfr: egfr ? Number(egfr) : null,
    age: age ? Number(age) : null,
    duration,
  };

  const abx = condition.needsAbx(ctx);

  const chosenRegimen: Regimen[] = useMemo(() => {
    if (!abx.needed) return [];
    if (allergy === "penicillin-severe" && condition.pcnAllergySevere) return condition.pcnAllergySevere;
    if (allergy === "penicillin-mild" && condition.pcnAllergyMild) return condition.pcnAllergyMild;
    return condition.firstLine;
  }, [abx.needed, allergy, condition]);

  const renalWarn = useMemo(() => {
    if (!ctx.egfr) return null;
    if (ctx.egfr < 30 && condition.id === "uti") return "eGFR <30: avoid nitrofurantoin. Prefer fosfomycin or β-lactam.";
    if (ctx.egfr < 50 && condition.renalFlags) return condition.renalFlags;
    return null;
  }, [ctx.egfr, condition]);

  const renalAdjustments = useMemo(() => {
    if (!ctx.egfr || !chosenRegimen.length) return [];
    const all: RenalAdj[] = [];
    const seen = new Set<string>();
    for (const r of chosenRegimen) {
      for (const a of getRenalAdjustments(r.drug + " " + r.dose, ctx.egfr)) {
        if (!seen.has(a.drug)) {
          seen.add(a.drug);
          all.push(a);
        }
      }
    }
    return all;
  }, [chosenRegimen, ctx.egfr]);

  const summary = useMemo(() => {
    const lines: string[] = [];
    lines.push(`Primary Care Infection Plan — ${condition.label}`);
    lines.push(`Date: ${new Date().toLocaleString()}`);
    if (ctx.age) lines.push(`Age: ${ctx.age}`);
    lines.push(`Severity: ${severity}${pregnant ? " | Pregnant" : ""}`);
    lines.push(`Allergy: ${allergy}${ctx.egfr ? ` | eGFR ${ctx.egfr}` : ""}`);
    if (duration) lines.push(`Symptom duration: ${duration}`);
    lines.push("");
    lines.push(`Antibiotics indicated: ${abx.needed ? "YES" : "NO"}`);
    lines.push(`Rationale: ${abx.rationale}`);
    if (chosenRegimen.length) {
      lines.push("");
      lines.push("Regimen:");
      chosenRegimen.forEach((r) => {
        lines.push(`  • ${r.drug} — ${r.dose} × ${r.duration}${r.notes ? ` (${r.notes})` : ""}`);
      });
    }
    if (pregnant) {
      lines.push("");
      lines.push(`Pregnancy: Safe → ${condition.pregnancy.safe.join("; ") || "see notes"}`);
      if (condition.pregnancy.avoid.length) lines.push(`Pregnancy: Avoid → ${condition.pregnancy.avoid.join("; ")}`);
      if (condition.pregnancy.note) lines.push(`Note: ${condition.pregnancy.note}`);
    }
    if (renalWarn) lines.push(`Renal: ${renalWarn}`);
    if (renalAdjustments.length) {
      lines.push("");
      lines.push(`Renal dose adjustment (eGFR ${ctx.egfr}, band ${BAND_LABEL[egfrBand(ctx.egfr!)]})`);
      renalAdjustments.forEach((a) => lines.push(`  • ${a.drug}: ${a.adjustment}`));
    }
    lines.push("");
    lines.push(`Escalation: ${condition.severityEscalation}`);
    lines.push(`Red flags: ${condition.redFlags.join("; ")}`);
    lines.push("");
    lines.push("Disclaimer: Decision-support only. Does not replace local antimicrobial policy or clinical judgement.");
    return lines.join("\n");
  }, [condition, ctx, severity, pregnant, allergy, duration, abx, chosenRegimen, renalWarn, renalAdjustments]);


  const handleCopy = async () => {
    await navigator.clipboard.writeText(summary);
    toast.success("Summary copied");
  };

  const handlePrint = () => window.print();

  const grouped = useMemo(() => {
    const m: Record<string, ConditionDef[]> = {};
    CONDITIONS.forEach((c) => {
      (m[c.category] ||= []).push(c);
    });
    return m;
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-5xl mx-auto p-3 sm:p-4 md:p-6 space-y-4">
        <header className="space-y-1">
          <h1 className="text-2xl font-heading font-semibold flex items-center gap-2">
            <Pill className="h-6 w-6 text-primary" />
            Infections
          </h1>
          <p className="text-sm text-muted-foreground">
            Decision-support for primary-care and serious/nosocomial infections.
          </p>
          <a
            href="/images?search=antibiotic+spectrum"
            className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
          >
            <ImageIcon className="h-3.5 w-3.5" />
            View Antibiotic Spectrum Map →
          </a>
        </header>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-border print:hidden">
          <button
            onClick={() => { setTab("primary"); setSearchParams({}); }}
            className={`px-3 py-2 text-sm font-medium border-b-2 -mb-px inline-flex items-center gap-1.5 ${
              tab === "primary" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Pill className="h-4 w-4" /> Primary care
          </button>
          <button
            onClick={() => { setTab("serious"); setSearchParams({ tab: "serious" }); }}
            className={`px-3 py-2 text-sm font-medium border-b-2 -mb-px inline-flex items-center gap-1.5 ${
              tab === "serious" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Hospital className="h-4 w-4" /> Serious & nosocomial
          </button>
          <button
            onClick={() => { setTab("csdh"); setSearchParams({ tab: "csdh" }); }}
            className={`px-3 py-2 text-sm font-medium border-b-2 -mb-px inline-flex items-center gap-1.5 ${
              tab === "csdh" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Brain className="h-4 w-4" /> cSDH Risk
          </button>
        </div>

        {tab === "serious" ? (
          <SeriousInfections />
        ) : tab === "csdh" ? (
          <CsdhRiskCalculator />
        ) : (
        <>
        <div className="rounded-md border border-warning/30 bg-warning/10 px-3 py-2 text-xs text-amber-900 flex gap-2">
          <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
          <div>
            Decision-support only. <strong>Does not replace local antimicrobial policy.</strong> Always verify pregnancy,
            allergy, renal function, and red flags before prescribing.
          </div>
        </div>

        {/* Picker */}
        <section className="rounded-lg border border-border bg-card p-4 space-y-3">
          <h2 className="text-sm font-semibold">Select condition</h2>
          <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
            {Object.entries(grouped).map(([cat, items]) => (
              <div key={cat} className="space-y-1">
                <div className="text-xs uppercase tracking-wide text-muted-foreground">{cat}</div>
                <div className="flex flex-col gap-1">
                  {items.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setConditionId(c.id)}
                      className={`text-left text-xs rounded-md border px-2 py-1.5 transition ${
                        conditionId === c.id
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border hover:bg-muted"
                      }`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Context inputs */}
        <section className="rounded-lg border border-border bg-card p-4 grid gap-3 sm:grid-cols-2 md:grid-cols-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground">Severity</label>
            <select className={PILL_INPUT} value={severity} onChange={(e) => setSeverity(e.target.value as Severity)}>
              <option value="mild">Mild</option>
              <option value="moderate">Moderate</option>
              <option value="severe">Severe</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Allergy</label>
            <select className={PILL_INPUT} value={allergy} onChange={(e) => setAllergy(e.target.value as Allergy)}>
              <option value="none">None</option>
              <option value="penicillin-mild">Penicillin — mild (rash)</option>
              <option value="penicillin-severe">Penicillin — severe (anaphylaxis)</option>
              <option value="macrolide">Macrolide intolerance</option>
              <option value="sulfa">Sulfa allergy</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">eGFR (mL/min)</label>
            <input
              className={PILL_INPUT}
              inputMode="numeric"
              placeholder="e.g. 65"
              value={egfr}
              onChange={(e) => setEgfr(e.target.value.replace(/[^\d.]/g, ""))}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Age (yrs)</label>
            <input
              className={PILL_INPUT}
              inputMode="numeric"
              placeholder="e.g. 45"
              value={age}
              onChange={(e) => setAge(e.target.value.replace(/[^\d.]/g, ""))}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Symptom duration</label>
            <select className={PILL_INPUT} value={duration} onChange={(e) => setDuration(e.target.value)}>
              <option value="">—</option>
              <option value="<3 days">&lt; 3 days</option>
              <option value="3–7 days">3–7 days</option>
              <option value="7–10 days">7–10 days</option>
              <option value=">10 days">&gt; 10 days</option>
            </select>
          </div>
          <div className="flex items-end">
            <label className="inline-flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={pregnant}
                onChange={(e) => setPregnant(e.target.checked)}
                className="h-4 w-4"
              />
              <Baby className="h-4 w-4 text-pink-500" />
              Pregnant
            </label>
          </div>
        </section>

        {/* Output */}
        <section className="rounded-lg border border-border bg-card p-4 space-y-4 print:border-none print:p-0">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
            <div>
              <h2 className="text-lg font-heading font-semibold">{condition.label}</h2>
              <p className="text-xs text-muted-foreground">{condition.category}</p>
            </div>
            <div className="flex gap-2 print:hidden">
              <button
                onClick={handleCopy}
                className="inline-flex items-center gap-1 rounded-md border border-border px-3 py-1.5 text-xs hover:bg-muted"
              >
                <Copy className="h-3.5 w-3.5" /> Copy
              </button>
              <button
                onClick={() => downloadTextFile(`infections-${condition.id || condition.label}-${new Date().toISOString().slice(0,10)}`, summary)}
                className="inline-flex items-center gap-1 rounded-md border border-border px-3 py-1.5 text-xs hover:bg-muted"
              >
                <Download className="h-3.5 w-3.5" /> Download .txt
              </button>
              <button
                onClick={handlePrint}
                className="inline-flex items-center gap-1 rounded-md border border-border px-3 py-1.5 text-xs hover:bg-muted"
              >
                <Printer className="h-3.5 w-3.5" /> Print
              </button>
            </div>
          </div>

          <div
            className={`rounded-md border px-3 py-2 text-sm ${
              abx.needed
                ? "border-success/30 bg-success/10 text-success"
                : "border-border bg-card text-foreground"
            }`}
          >
            <div className="font-semibold">
              Antibiotics: {abx.needed ? "Indicated" : "Not routinely indicated"}
            </div>
            <div className="text-xs mt-0.5">{abx.rationale}</div>
          </div>

          {chosenRegimen.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold">
                Recommended regimen
                {allergy.startsWith("penicillin") && (
                  <span className="ml-2 text-xs text-amber-700">(adjusted for {allergy.replace("-", " ")})</span>
                )}
              </h3>
              <div className="overflow-x-auto rounded-md border border-border">
                <table className="w-full text-sm min-w-[480px]">
                  <thead className="bg-muted text-xs uppercase text-muted-foreground">
                    <tr>
                      <th className="px-3 py-2 text-left">Drug</th>
                      <th className="px-3 py-2 text-left">Adult dose</th>
                      <th className="px-3 py-2 text-left">Freq</th>
                      <th className="px-3 py-2 text-left">Duration</th>
                    </tr>
                  </thead>
                  <tbody>
                    {chosenRegimen.map((r, i) => (
                      <tr key={i} className="border-t border-border">
                        <td className="px-3 py-2 font-medium">{r.drug}</td>
                        <td className="px-3 py-2">{r.dose}</td>
                        <td className="px-3 py-2"><FrequencyBadge frequency={r.dose} /></td>
                        <td className="px-3 py-2">
                          {r.duration}
                          {r.notes && <div className="text-xs text-muted-foreground mt-0.5">{r.notes}</div>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {ctx.egfr !== null && chosenRegimen.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold flex items-center gap-1.5">
                <FlaskConical className="h-4 w-4 text-primary" />
                Renal dose adjustment
                <span className="text-xs font-normal text-muted-foreground">
                  (eGFR {ctx.egfr} → band {BAND_LABEL[egfrBand(ctx.egfr)]} mL/min)
                </span>
              </h3>
              {renalAdjustments.length === 0 ? (
                <div className="rounded-md border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                  No renal-adjustable antibiotic matched in the database for this regimen. Verify dose locally.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-md border border-border">
                  <table className="w-full text-sm min-w-[480px]">
                    <thead className="bg-muted text-xs uppercase text-muted-foreground">
                      <tr>
                        <th className="px-3 py-2 text-left">Drug</th>
                        <th className="px-3 py-2 text-left">Adjusted dose</th>
                        <th className="px-3 py-2 text-left">Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {renalAdjustments.map((a, i) => {
                        const danger = /contraindicated|avoid/i.test(a.adjustment);
                        const warn = /reduce|caution|max|q\d{2,}|post-dialysis|tdm/i.test(a.adjustment);
                        return (
                          <tr key={i} className="border-t border-border">
                            <td className="px-3 py-2 font-medium">{a.drug}</td>
                            <td
                              className={`px-3 py-2 ${
                                danger
                                  ? "bg-destructive/10 text-destructive font-medium"
                                  : warn
                                  ? "bg-warning/10 text-warning font-medium"
                                  : ""
                              }`}
                            >
                              {a.adjustment}
                            </td>
                            <td className="px-3 py-2 text-xs text-muted-foreground">{a.notes}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}



          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-xs">
              <div className="font-semibold text-pink-900 flex items-center gap-1">
                <Baby className="h-3.5 w-3.5" /> Pregnancy
              </div>
              <div className="mt-1 text-pink-900">
                <div><strong>Safe:</strong> {condition.pregnancy.safe.join(", ") || "—"}</div>
                {condition.pregnancy.avoid.length > 0 && (
                  <div><strong>Avoid:</strong> {condition.pregnancy.avoid.join(", ")}</div>
                )}
                {condition.pregnancy.note && <div className="mt-1 italic">{condition.pregnancy.note}</div>}
              </div>
            </div>
            <div className="rounded-md border border-primary/30 bg-primary/10 p-3 text-xs">
              <div className="font-semibold text-blue-900 flex items-center gap-1">
                <Activity className="h-3.5 w-3.5" /> Renal / Severity escalation
              </div>
              <div className="mt-1 text-blue-900 space-y-1">
                {renalWarn && <div><strong>Renal:</strong> {renalWarn}</div>}
                {condition.renalFlags && !renalWarn && <div><strong>Renal note:</strong> {condition.renalFlags}</div>}
                <div><strong>Escalate:</strong> {condition.severityEscalation}</div>
              </div>
            </div>
          </div>

          <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3">
            <div className="text-sm font-semibold text-destructive flex items-center gap-1">
              <AlertTriangle className="h-4 w-4" /> Red flags — escalate / refer
            </div>
            <ul className="mt-1 list-disc pl-5 text-xs text-destructive space-y-0.5">
              {condition.redFlags.map((f, i) => (
                <li key={i}>{f}</li>
              ))}
            </ul>
          </div>

          <details className="text-xs">
            <summary className="cursor-pointer text-muted-foreground">Plain-text summary</summary>
            <pre className="mt-2 whitespace-pre-wrap rounded-md border border-border bg-muted/50 p-3 font-mono text-xs">
{summary}
            </pre>
          </details>
        </section>

        {/* Antibiotic spectrum reference */}
        <section className="rounded-lg border border-border bg-card p-4 space-y-3 print:hidden">
          <div className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5 text-primary" />
            <h2 className="text-base font-heading font-semibold">Antibiotics by spectrum of activity</h2>
          </div>
          <p className="text-xs text-muted-foreground">
            Reference chart: gram-positive, gram-negative, and broad/mixed spectrum coverage with common examples.
          </p>
          <div className="rounded-md border border-border bg-muted/30 p-2">
            <ZoomableImage
              src={antibioticsSpectrum.url}
              alt="Antibiotics by spectrum of activity — complete classification and examples"
              className="w-full rounded-md"
              wrapperClassName="rounded-md"
            />
          </div>
        </section>
        </>
        )}
      </div>
    </div>
  );
}
