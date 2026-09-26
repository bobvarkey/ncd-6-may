import { useState } from "react";
import {
  ClipboardList,
  Beaker,
  Syringe,
  AlertTriangle,
  Droplets,
  Utensils,
  Clock,
  Thermometer,
  Pill,
  User,
  FlaskConical,
  Image as ImageIcon,
  FileText,
  Printer,
  Copy,
  BrainCircuit,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { downloadTextFile } from "@/lib/clinical-utils";
import ImageLink from "@/components/ImageLink";
import { toast } from "sonner";

/* ── Hand-drawn style helpers ──────────────────────────────────── */

const doodleCard =
  "relative rounded-2xl border-2 border-amber-800/30 bg-gradient-to-br from-amber-50/90 to-orange-50/80 p-4 shadow-sm before:absolute before:inset-0 before:rounded-2xl before:border-2 before:border-amber-900/10 before:pointer-events-none";
const doodleTitle =
  "font-handwritten text-lg font-bold text-amber-900 flex items-center gap-2";
const doodleSubtitle =
  "font-handwritten text-sm text-amber-800/70 mt-0.5";
const doodleBox =
  "rounded-xl border-2 border-dashed border-amber-700/25 bg-white/60 p-3";
const doodleBadge =
  "inline-flex items-center gap-1 rounded-full border border-amber-700/30 bg-amber-100/60 px-2.5 py-1 font-handwritten text-xs text-amber-900";
const doodleStep =
  "relative flex items-start gap-3 pl-6 before:absolute before:left-2 before:top-2 before:h-full before:w-0.5 before:bg-amber-300/50 last:before:hidden";
const doodleDot =
  "absolute left-1.5 top-1.5 h-2.5 w-2.5 rounded-full border-2 border-amber-600 bg-amber-200";

/* ── Data ──────────────────────────────────────────────────────── */

const DEFINITION = "Food poisoning = illness acquired through ingestion of contaminated food or water";

const ALGORITHM_STEPS = [
  {
    title: "Classify by incubation period",
    items: [
      "<b>&lt;6 hours</b> → Preformed toxin: <i>S. aureus</i> (meat, dairy, eggs), <i>B. cereus</i> emetic (fried rice)",
      "<b>6–24 hours</b> → Toxin-mediated: <i>C. perfringens</i> (reheated meat, gravy), <i>B. cereus</i> diarrheal",
      "<b>24–72 hours</b> → Infectious: Norovirus, Salmonella, Campylobacter, Shigella, ETEC, Vibrio",
      "<b>&gt;72 hours</b> → Parasitic / other: Giardia, E. histolytica, Hepatitis A, Listeria",
    ],
  },
  {
    title: "Identify the syndrome",
    items: [
      "<b>Vomiting-predominant</b> → <i>S. aureus</i>, <i>B. cereus</i> emetic, norovirus, viral hepatitis",
      "<b>Watery diarrhoea</b> → ETEC, V. cholerae, C. perfringens, viral, Giardia",
      "<b>Bloody diarrhoea (dysentery)</b> → Shigella, Salmonella, Campylobacter, EHEC, Amoebiasis",
      "<b>Neurological symptoms</b> → Botulism (↓CN, descending paralysis), scombroid (flushing, hives), ciguatera (temp reversal)",
    ],
  },
];

const HISTORY_ITEMS = [
  { icon: Utensils, label: "Food history", detail: "Undercooked meat / poultry / beef, seafood, shellfish, raw eggs, unpasteurised milk / juice, fried rice, deli meats, soft cheese, mayonnaise, custards, home-canned foods, honey, pork, gravy, buffets, large reef fish" },
  { icon: Clock, label: "Incubation period", detail: "Hours to days — key to narrowing aetiology" },
  { icon: Droplets, label: "Stool character", detail: "Watery, bloody, mucous — suggests invasive vs non‑invasive" },
  { icon: Thermometer, label: "Fever", detail: "High fever favours invasive bacterial pathogen" },
  { icon: User, label: "Host & setting", detail: "Age extremes, immunocompromised, pregnancy, outbreak setting" },
  { icon: Pill, label: "Recent exposures", detail: "Antibiotics, travel, hospitalisation, restaurant, picnic, well water" },
];

const RED_FLAGS = [
  "Bloody diarrhoea (dysentery)",
  "High fever ≥38.5°C",
  "Signs of severe dehydration (↓skin turgor, dry mucosa, orthostasis, ↓UOP)",
  "Neurological symptoms (diplopia, dysphagia, descending paralysis, paraesthesias)",
  "Age >65 or <1 year",
  "Immunocompromised (HIV, chemo, transplant, biologics, pregnancy)",
  "Outbreak suspicion (multiple cases, food handler, institution)",
  "Persistent symptoms beyond 5–7 days despite supportive care",
];

const WORKUP = [
  { label: "Stool culture + sensitivity", when: "Bloody stool, severe illness, travel, outbreak, immunocompromised, persistent symptoms" },
  { label: "Multiplex GI PCR panel", when: "Rapid identification when available (covers bacteria + viruses + parasites)" },
  { label: "C. difficile toxin", when: "Recent antibiotic use, hospitalisation, or chemotherapy" },
  { label: "O&P (ova & parasites)", when: "Persistent >14 days, travel, waterborne, daycare" },
  { label: "Stool WBC / lactoferrin", when: "Suggests inflammatory diarrhoea" },
  { label: "CBC / CRP / BMP", when: "Moderate–severe, dehydration, elderly, systemic toxicity" },
  { label: "Blood cultures", when: "Sepsis, toxic appearance, immunocompromised" },
  { label: "Serology / special tests", when: "Hepatitis A/E (jaundice), botulism (stool/serum toxin), scombroid/ciguatera (clinical)" },
];

const INCUBATION_TABLE = [
  { incubation: "< 1 h", toxins: "Heavy metals, chemicals", clues: "---" },
  { incubation: "1–6 h", toxins: "<i>S. aureus</i>, <i>B. cereus</i> (emetic)", clues: "Rapid onset; vomiting-predominant; no fever" },
  { incubation: "6–24 h", toxins: "<i>C. perfringens</i>, <i>B. cereus</i> (diarrheal)", clues: "Watery diarrhoea; abdominal cramps; afebrile" },
  { incubation: "24–72 h", toxins: "Norovirus, Rotavirus, Salmonella, Campylobacter, Shigella, ETEC, V. cholerae", clues: "Diarrhoea ± vomiting ± fever; consider stool culture / PCR" },
  { incubation: "> 72 h", toxins: "Giardia, Amoebiasis, Cryptosporidium, Hepatitis A, Listeria", clues: "Persistent, often prolonged; consider O&P, serology, stool Ag" },
];

const MANAGEMENT_STEPS = [
  {
    title: "Resuscitation & rehydration",
    items: [
      "Mild–moderate dehydration → ORS (oral rehydration solution) after each loose stool",
      "Severe dehydration → IV Ringer's lactate or NS 20 mL/kg bolus ± repeat",
      "Replace ongoing losses: 1 cup ORS per loose stool for adults, 50–100 mL/kg/4h for children",
    ],
  },
  {
    title: "Empiric antibiotics — when indicated",
    items: [
      "Dysentery (bloody stool + fever) → azithromycin 500 mg PO ×3d OR ciprofloxacin 500 mg BID ×3–5d",
      "Severe / hospitalised → ceftriaxone 1 g IV daily + rehydration",
      "Suspected C. difficile → oral vancomycin 125 mg QID ×10d OR fidaxomicin 200 mg BID ×10d",
      "Cholera / severe watery → azithromycin 1 g PO ×1 + aggressive rehydration",
      "Suspected Listeria (pregnancy, neonate, elderly) → ampicillin ± gentamicin",
    ],
  },
  {
    title: "Symptomatic relief — selective use",
    items: [
      "Loperamide — ONLY if afebrile, no bloody stool, no systemic toxicity (contraindicated in dysentery, EHEC, C. difficile)",
      "Bismuth subsalicylate — mild watery diarrhoea, traveller's diarrhoea, vomiting",
      "Antiemetics — ondansetron for significant vomiting (risk of QTc prolongation — check ECG)",
    ],
  },
  {
    title: "Antibiotics to AVOID in EHEC (O157:H7)",
    items: [
      "DO NOT give antibiotics if EHEC suspected — ↑ risk of HUS (haemolytic uraemic syndrome)",
      "Supportive care only. Monitor Hb, platelets, creatinine for 5–7 days",
      "Also avoid loperamide in EHEC",
    ],
  },
  {
    title: "Public health & reporting",
    items: [
      "Report suspected outbreaks to local health department",
      "Food handlers, healthcare workers, daycare staff → clear before return to work",
      "Contact precautions if hospitalised with suspected norovirus, C. difficile, or outbreak pathogen",
      "Hand hygiene: soap & water for C. difficile & norovirus (alcohol gel ineffective)",
    ],
  },
];

const PATHOGEN_TABLE = [
  { pathogen: "<i>S. aureus</i>", incubation: "1–6 h", duration: "<24 h", features: "Nausea, vomiting prominent, no fever | Meat, dairy, eggs, cream pastries", workup: "Clinical", management: "Supportive + rehydration" },
  { pathogen: "<i>B. cereus</i> (emetic)", incubation: "1–6 h", duration: "<24 h", features: "Vomiting, cramps | Fried rice, reheated grains", workup: "Clinical", management: "Supportive" },
  { pathogen: "<i>C. perfringens</i>", incubation: "6–24 h", duration: "24–48 h", features: "Watery diarrhoea, cramps, afebrile | Reheated meat, gravy", workup: "Stool culture", management: "Supportive" },
  { pathogen: "<i>B. cereus</i> (diarrheal)", incubation: "6–24 h", duration: "24–48 h", features: "Watery diarrhoea, cramps | Meat, vegetables, sauces", workup: "Stool culture", management: "Supportive" },
  { pathogen: "Norovirus", incubation: "12–48 h", duration: "24–72 h", features: "Vomiting, watery diarrhoea, brief | Shellfish, salad, person‑to‑person", workup: "PCR clinical", management: "Supportive + rehydration" },
  { pathogen: "Rotavirus", incubation: "1–3 d", duration: "3–7 d", features: "Watery, vomiting, fever, children", workup: "Stool Ag", management: "Supportive ± vaccine" },
  { pathogen: "Salmonella (non‑typhi)", incubation: "6–72 h", duration: "3–7 d", features: "Watery or bloody, fever, cramps | Eggs, poultry, dairy", workup: "Stool culture", management: "Supportive unless severe / age extremes / prosthetic" },
  { pathogen: "Campylobacter", incubation: "2–5 d", duration: "3–7 d", features: "Bloody, cramps, fever, prodrome | Poultry, raw milk", workup: "Stool culture", management: "Azithromycin (if early/severe)" },
  { pathogen: "Shigella", incubation: "1–3 d", duration: "3–7 d", features: "Bloody, mucoid, tenesmus, fever | Person‑to‑person, food", workup: "Stool culture", management: "Azithromycin or ciprofloxacin" },
  { pathogen: "ETEC", incubation: "1–3 d", duration: "3–5 d", features: "Watery, traveller's diarrhoea | Contaminated water, food", workup: "Stool PCR", management: "Supportive ± azithromycin" },
  { pathogen: "V. cholerae", incubation: "2 h–5 d", duration: "3–7 d", features: "Profuse rice‑water stool, rapid dehydration | Shellfish, water", workup: "Stool culture", management: "Aggressive rehydration + azithromycin" },
  { pathogen: "EHEC (O157:H7)", incubation: "3–4 d", duration: "5–10 d", features: "Bloody, no fever, HUS risk | Undercooked beef, raw milk", workup: "Stool culture + Shiga toxin", management: "Supportive ONLY — NO abx, NO loperamide" },
  { pathogen: "C. difficile", incubation: "During or up to 8 wk post‑abx", duration: "Variable", features: "Watery to bloody, foul, hospital/abx setting", workup: "Stool toxin + PCR", management: "Vancomycin or fidaxomicin" },
  { pathogen: "Listeria", incubation: "9–48 h (invasive: 1–4 wk)", duration: "Variable", features: "Fever, myalgia; pregnant, neonate, elderly | Deli meats, soft cheese, raw milk", workup: "Blood / CSF culture, PCR", management: "Ampicillin ± gentamicin" },
  { pathogen: "Giardia", incubation: "1–3 wk", duration: "2–6 wk", features: "Watery, foul, bloating, greasy stool | Waterborne, daycare", workup: "Stool O&P, Ag", management: "Metronidazole 500 mg TID ×5–7d or tinidazole ×1" },
  { pathogen: "Amoebiasis", incubation: "2–4 wk", duration: "Weeks", features: "Bloody, mucoid, tenesmus, liver abscess | Water, food", workup: "Stool O&P, serology", management: "Metronidazole + luminal agent (paromomycin)" },
  { pathogen: "Botulism", incubation: "12–72 h", duration: "Weeks–months", features: "Descending paralysis, diplopia, dysphagia | Home‑canned foods, fermented fish", workup: "Stool/serum toxin, EMG", management: "Antitoxin + ICU (do NOT wait for confirmation)" },
  { pathogen: "Scombroid", incubation: "10–60 min", duration: "4–6 h", features: "Flushing, hives, headache, diarrhoea | Spoiled tuna, mackerel", workup: "Clinical", management: "Antihistamines (H1 ± H2 blockers)" },
  { pathogen: "Ciguatera", incubation: "1–6 h", duration: "Days–weeks", features: "GI + neuro (temp reversal, paraesthesia) | Reef fish (barracuda, grouper)", workup: "Clinical", management: "Supportive; IV mannitol controversial" },
  { pathogen: "Hepatitis A", incubation: "15–50 d", duration: "Weeks", features: "Jaundice, malaise, anorexia, vomiting | Shellfish, food handler", workup: "Serum IgM anti‑HAV", management: "Supportive; prevention = vaccine" },
];

/* ── Collapsible section ──────────────────────────────────────── */

function CollapsibleSection({
  title,
  icon: Icon,
  defaultOpen = false,
  children,
}: {
  title: string;
  icon: React.ElementType;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={doodleCard}>
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between text-left"
      >
        <div className={doodleTitle}>
          <Icon className="h-5 w-5 text-amber-700" />
          {title}
        </div>
        {open ? (
          <ChevronDown className="h-4 w-4 text-amber-600" />
        ) : (
          <ChevronRight className="h-4 w-4 text-amber-600" />
        )}
      </button>
      {open && <div className="mt-3 space-y-3">{children}</div>}
    </div>
  );
}

/* ── Export & Print helpers ────────────────────────────────────── */

function getFullTextContent() {
  const lines: string[] = [];
  lines.push("FOOD POISONING — Clinical Algorithm");
  lines.push("=".repeat(40));
  lines.push("\nDefinition: " + DEFINITION);
  lines.push("\nAlgorithm:");
  ALGORITHM_STEPS.forEach((step) => {
    lines.push(`\n${step.title}`);
    step.items.forEach((item) => lines.push(`  • ${item.replace(/<[^>]+>/g, "")}`));
  });
  lines.push("\nHistory:");
  HISTORY_ITEMS.forEach((item) => lines.push(`  • ${item.label}: ${item.detail}`));
  lines.push("\nRed Flags:");
  RED_FLAGS.forEach((flag) => lines.push(`  • ${flag}`));
  lines.push("\nInvestigations:");
  WORKUP.forEach((item) => lines.push(`  • ${item.label}: ${item.when}`));
  lines.push("\nIncubation Table:");
  INCUBATION_TABLE.forEach((row) => lines.push(`  • ${row.incubation} — ${row.toxins}`));
  lines.push("\nPathogen Table:");
  PATHOGEN_TABLE.forEach((row) => lines.push(`  • ${row.pathogen} (${row.incubation}): ${row.features} → ${row.management}`));
  lines.push("\nManagement:");
  MANAGEMENT_STEPS.forEach((step) => {
    lines.push(`\n${step.title}`);
    step.items.forEach((item) => lines.push(`  • ${item.replace(/<[^>]+>/g, "")}`));
  });
  return lines.join("\n");
}

function handleExport() {
  downloadTextFile(getFullTextContent(), "food-poisoning-algorithm.txt");
}

async function handleCopy() {
  try {
    await navigator.clipboard.writeText(getFullTextContent());
    toast.success("Algorithm copied to clipboard");
  } catch {
    toast.error("Failed to copy");
  }
}

function handlePrint() {
  window.print();
}

/* ── Component ─────────────────────────────────────────────────── */

export default function FoodPoisoning() {
  return (
    <div className="mx-auto max-w-3xl space-y-4 px-0.5 py-4 sm:px-1">

      {/* Title + export bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="relative">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border-2 border-amber-600/40 bg-amber-100/80">
              <Utensils className="h-6 w-6 text-amber-800" />
            </div>
            <div>
              <h2 className="font-handwritten text-2xl font-bold text-amber-900">
                Food Poisoning — Algorithm
              </h2>
              <p className="font-handwritten text-sm text-amber-700/80">
                {DEFINITION}
              </p>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className={doodleBadge}>
              <Clock className="h-3 w-3" /> Incubation-based
            </span>
            <span className={doodleBadge}>
              <BrainCircuit className="h-3 w-3" /> Syndrome approach
            </span>
            <span className={doodleBadge}>
              <AlertTriangle className="h-3 w-3" /> Red flags
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={handleExport} className="rounded-lg border border-amber-300/50 bg-amber-50/80 p-2 text-amber-700 hover:bg-amber-100/80" title="Export .txt">
            <FileText className="h-4 w-4" />
          </button>
          <button onClick={handleCopy} className="rounded-lg border border-amber-300/50 bg-amber-50/80 p-2 text-amber-700 hover:bg-amber-100/80" title="Copy to clipboard">
            <Copy className="h-4 w-4" />
          </button>
          <button onClick={handlePrint} className="rounded-lg border border-amber-300/50 bg-amber-50/80 p-2 text-amber-700 hover:bg-amber-100/80" title="Print / PDF">
            <Printer className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Algorithm — Classification by incubation and syndrome */}
      <CollapsibleSection title="Algorithm — Classify by Incubation & Syndrome" icon={BrainCircuit} defaultOpen>
        <div className="space-y-3">
          {ALGORITHM_STEPS.map((step) => (
            <div key={step.title} className={doodleBox}>
              <div className="mb-2 font-handwritten text-sm font-bold text-amber-900">
                {step.title}
              </div>
              <ul className="space-y-1">
                {step.items.map((item) => (
                  <li key={item} className="flex items-start gap-2 font-handwritten text-xs text-amber-800/80">
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                    <span dangerouslySetInnerHTML={{ __html: item }} />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </CollapsibleSection>

      {/* Step 1: History */}
      <CollapsibleSection title="1. History — Key Questions" icon={ClipboardList} defaultOpen>
        <div className="grid gap-2 sm:grid-cols-2">
          {HISTORY_ITEMS.map((item) => (
            <div key={item.label} className={doodleBox}>
              <div className="flex items-start gap-2">
                <item.icon className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
                <div>
                  <div className="font-handwritten text-sm font-bold text-amber-900">
                    {item.label}
                  </div>
                  <div className="font-handwritten text-xs text-amber-800/70">
                    {item.detail}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CollapsibleSection>

      {/* Step 2: Red Flags */}
      <CollapsibleSection title="2. Red Flags — Escalate / Refer" icon={AlertTriangle} defaultOpen>
        <div className="rounded-xl border-2 border-dashed border-red-300/60 bg-red-50/60 p-3">
          <div className="grid gap-1.5 sm:grid-cols-2">
            {RED_FLAGS.map((flag) => (
              <div key={flag} className="flex items-start gap-2 text-sm">
                <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-red-400" />
                <span className="font-handwritten text-red-800">{flag}</span>
              </div>
            ))}
          </div>
        </div>
      </CollapsibleSection>

      {/* Step 3: Investigations */}
      <CollapsibleSection title="3. Investigations" icon={Beaker} defaultOpen>
        <div className="overflow-x-auto rounded-xl border-2 border-dashed border-amber-700/25 bg-white/60">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-dashed border-amber-300/50 bg-amber-100/40">
                <th className="px-3 py-2 text-left font-handwritten text-xs font-bold text-amber-900 uppercase">Test</th>
                <th className="px-3 py-2 text-left font-handwritten text-xs font-bold text-amber-900 uppercase">When to order</th>
              </tr>
            </thead>
            <tbody>
              {WORKUP.map((item) => (
                <tr key={item.label} className="border-b border-dashed border-amber-200/40 last:border-0">
                  <td className="px-3 py-2 font-handwritten text-sm font-bold text-amber-900">{item.label}</td>
                  <td className="px-3 py-2 font-handwritten text-xs text-amber-800/80">{item.when}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CollapsibleSection>

      {/* Incubation Table */}
      <CollapsibleSection title="Incubation Period — Quick Reference" icon={Clock} defaultOpen>
        <div className="overflow-x-auto rounded-xl border-2 border-dashed border-amber-700/25 bg-white/60">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-dashed border-amber-300/50 bg-amber-100/40">
                <th className="px-3 py-2 text-left font-handwritten text-xs font-bold text-amber-900 uppercase">Incubation</th>
                <th className="px-3 py-2 text-left font-handwritten text-xs font-bold text-amber-900 uppercase">Typical pathogens</th>
                <th className="px-3 py-2 text-left font-handwritten text-xs font-bold text-amber-900 uppercase">Clinical clues</th>
              </tr>
            </thead>
            <tbody>
              {INCUBATION_TABLE.map((row) => (
                <tr key={row.incubation} className="border-b border-dashed border-amber-200/40 last:border-0">
                  <td className="px-3 py-2 font-handwritten text-sm font-bold text-amber-900">{row.incubation}</td>
                  <td className="px-3 py-2 font-handwritten text-xs text-amber-800/80" dangerouslySetInnerHTML={{ __html: row.toxins }} />
                  <td className="px-3 py-2 font-handwritten text-xs text-amber-800/80">{row.clues}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CollapsibleSection>

      {/* Images */}
      <CollapsibleSection title="Images" icon={ImageIcon} defaultOpen={false}>
        <div className="mx-auto max-w-lg space-y-4">
          <ImageLink imageId="food-poisoning-poster" label="View Food Poisoning Poster →" />
          <p className="mt-2 text-center font-handwritten text-xs text-amber-700/60">
            Classification by incubation period and clinical syndrome
          </p>
          <ImageLink imageId="food-poisoning-poster-2" label="View Additional Reference →" />
          <p className="mt-2 text-center font-handwritten text-xs text-amber-700/60">
            Food poisoning reference poster
          </p>
        </div>
      </CollapsibleSection>

      {/* Step 4: Management */}
      <CollapsibleSection title="4. Management" icon={Syringe} defaultOpen>
        <div className="space-y-3">
          {MANAGEMENT_STEPS.map((step) => (
            <div key={step.title} className={doodleBox}>
              <div className="mb-2 font-handwritten text-sm font-bold text-amber-900">
                {step.title}
              </div>
              <ul className="space-y-1">
                {step.items.map((item) => (
                  <li key={item} className="flex items-start gap-2 font-handwritten text-xs text-amber-800/80">
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                    <span dangerouslySetInnerHTML={{ __html: item }} />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </CollapsibleSection>

      {/* Pathogen Table */}
      <CollapsibleSection title="Pathogen Table — Comprehensive" icon={FlaskConical} defaultOpen>
        <div className="overflow-x-auto rounded-xl border-2 border-dashed border-amber-700/25 bg-white/60">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-dashed border-amber-300/50 bg-amber-100/40">
                <th className="px-2 py-2 text-left font-handwritten text-xs font-bold text-amber-900 uppercase">Pathogen</th>
                <th className="px-2 py-2 text-left font-handwritten text-xs font-bold text-amber-900 uppercase">Incubation</th>
                <th className="px-2 py-2 text-left font-handwritten text-xs font-bold text-amber-900 uppercase">Features & food</th>
                <th className="px-2 py-2 text-left font-handwritten text-xs font-bold text-amber-900 uppercase">Management</th>
              </tr>
            </thead>
            <tbody>
              {PATHOGEN_TABLE.map((row) => (
                <tr key={row.pathogen} className="border-b border-dashed border-amber-200/40 last:border-0">
                  <td className="px-2 py-2 font-handwritten text-xs font-bold text-amber-900" dangerouslySetInnerHTML={{ __html: row.pathogen }} />
                  <td className="px-2 py-2 font-handwritten text-xs text-amber-800/80">{row.incubation}</td>
                  <td className="px-2 py-2 font-handwritten text-xs text-amber-800/80">{row.features}</td>
                  <td className="px-2 py-2 font-handwritten text-xs text-amber-800/80">{row.management}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CollapsibleSection>
    </div>
  );
}