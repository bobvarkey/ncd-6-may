import { useState } from "react";
import {
  Stethoscope,
  ClipboardList,
  Beaker,
  Syringe,
  AlertTriangle,
  Droplets,
  Utensils,
  Plane,
  Pill,
  Thermometer,
  ChevronDown,
  ChevronRight,
  Info,
  FlaskConical,
  User,
  Clock,
  Download,
  Printer,
  Copy,
} from "lucide-react";
import { downloadTextFile } from "@/lib/clinical-utils";
import { toast } from "sonner";
import ZoomableImage from "@/components/ZoomableImage";
import diarrhoeaClassImg from "@/assets/acute-diarrhoea-classification.jpg.asset.json";

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

const DEFINITION = "Acute diarrhoea = <14 days duration";

const HISTORY_ITEMS = [
  { icon: Clock, label: "Onset & duration", detail: "Sudden vs gradual; hours to days" },
  { icon: Droplets, label: "Stool character", detail: "Watery, bloody (dysentery), mucous, frequency" },
  { icon: Thermometer, label: "Fever", detail: "High fever suggests invasive pathogen" },
  { icon: Utensils, label: "Food history", detail: "Undercooked meat, seafood, raw eggs, unpasteurised milk" },
  { icon: Plane, label: "Travel", detail: "Recent travel, camping, daycare, nursing home" },
  { icon: Pill, label: "Antibiotics", detail: "Recent abx use → C. difficile suspicion" },
  { icon: User, label: "Host factors", detail: "Age >65, immunocompromised, IBD, pregnancy" },
];

const RED_FLAGS = [
  "Bloody diarrhoea (dysentery)",
  "High fever ≥38.5°C",
  "Severe abdominal pain / peritonitis",
  "Signs of dehydration (↓skin turgor, dry mucosa, orthostasis)",
  "Age >65 or <1 year",
  "Immunocompromised (HIV, chemo, transplant, biologics)",
  "Recent antibiotic use (C. difficile)",
  "Outbreak setting (food handler, daycare, institution)",
];

const WORKUP = [
  { label: "Stool culture", when: "Bloody stool, severe, travel, outbreak, immunocompromised" },
  { label: "Stool WBC / lactoferrin", when: "Suggests inflammatory diarrhoea" },
  { label: "Fecal calprotectin", when: "Inflammatory vs non‑inflammatory triage; bloody stools, systemic features, moderate–severe" },
  { label: "C. difficile toxin", when: "Recent abx, hospitalisation, persistent after 7d" },
  { label: "O&P (ova & parasites)", when: "Persistent >14d, travel, waterborne, daycare" },
  { label: "CBC / CRP / BMP", when: "Moderate–severe, dehydration, elderly" },
  { label: "Blood cultures", when: "Sepsis, toxic appearance, immunocompromised" },
];

const MANAGEMENT_STEPS = [
  {
    title: "Rehydration — first priority",
    items: [
      "Mild–moderate dehydration → ORS (oral rehydration solution)",
      "Severe dehydration → IV Ringer's lactate or NS 20 mL/kg bolus",
      "Continue ORS after rehydration to match ongoing losses",
    ],
  },
  {
    title: "Symptomatic relief (selective)",
    items: [
      "Loperamide — ONLY if afebrile, no bloody stool, no systemic toxicity",
      "Avoid in dysentery, C. difficile, or suspected invasive disease",
      "Bismuth subsalicylate — safe alternative for mild watery diarrhoea",
    ],
  },
  {
    title: "Empiric antibiotics — when indicated",
    items: [
      "Dysentery (bloody stool + fever) → azithromycin 500 mg PO ×3d OR ciprofloxacin 500 mg BID ×3–5d",
      "Severe / hospitalised → ceftriaxone 1 g IV daily",
      "Suspected C. difficile → oral vancomycin 125 mg QID ×10d OR fidaxomicin 200 mg BID ×10d",
      "Cholera / severe watery → azithromycin 1 g PO ×1 + aggressive rehydration",
    ],
  },
  {
    title: "Infection control",
    items: [
      "Contact precautions if hospitalised (C. difficile, suspected outbreak)",
      "Hand hygiene with soap & water (alcohol gel ineffective for C. difficile, norovirus)",
      "Food handler / daycare / healthcare worker → clear stool culture before return",
    ],
  },
];

const PATHOGEN_TABLE = [
  { pathogen: "Norovirus", incubation: "12–48 h", features: "Vomiting prominent, watery, brief (24–72 h)", treatment: "Supportive" },
  { pathogen: "Rotavirus", incubation: "1–3 d", features: "Watery, vomiting, fever, children", treatment: "Supportive ± vaccine prevention" },
  { pathogen: "ETEC / EAEC", incubation: "1–3 d", features: "Watery, traveller's diarrhoea", treatment: "Supportive ± azithromycin" },
  { pathogen: "V. cholerae", incubation: "2 h–5 d", features: "Profuse rice-water stool, rapid dehydration", treatment: "Aggressive rehydration + azithromycin" },
  { pathogen: "Shigella", incubation: "1–3 d", features: "Bloody, mucoid, tenesmus, fever", treatment: "Azithromycin or ciprofloxacin" },
  { pathogen: "Salmonella (non-typhi)", incubation: "6–72 h", features: "Watery or bloody, fever, cramps", treatment: "Supportive unless severe / age <3 mo / >50 / prosthetic" },
  { pathogen: "Campylobacter", incubation: "2–5 d", features: "Bloody, cramps, fever, prodrome", treatment: "Azithromycin (if early/severe)" },
  { pathogen: "C. difficile", incubation: "During or up to 8 wk post-abx", features: "Watery to bloody, foul, hospital/abx", treatment: "Vancomycin or fidaxomicin" },
  { pathogen: "EHEC (O157:H7)", incubation: "3–4 d", features: "Bloody, no fever, HUS risk", treatment: "Supportive ONLY — NO abx, NO loperamide" },
  { pathogen: "Giardia", incubation: "1–3 wk", features: "Watery, foul, bloating, greasy stool", treatment: "Metronidazole 500 mg TID ×5–7d or tinidazole ×1" },
  { pathogen: "Amoebiasis (E. histolytica)", incubation: "2–4 wk", features: "Bloody, mucoid, tenesmus, liver abscess", treatment: "Metronidazole + paromomycin (luminal agent)" },
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
      {open && <div className="mt-3 space-y-2">{children}</div>}
    </div>
  );
}

/* ── Main component ────────────────────────────────────────────── */

export default function AcuteDiarrhoea() {
  const [showPathogens, setShowPathogens] = useState(false);

  const handleCopy = async () => {
    const text = `EVALUATION OF ACUTE DIARRHOEA
Definition: ${DEFINITION}

Red Flags:
${RED_FLAGS.map((f) => `  • ${f}`).join("\n")}

Management:
1. Rehydration — first priority
2. Symptomatic relief (loperamide only if afebrile, no blood)
3. Empiric antibiotics if dysentery, severe, or C. difficile suspected
4. Infection control — contact precautions, hand hygiene

Disclaimer: Decision-support only. Does not replace clinical judgement.`;
    await navigator.clipboard.writeText(text);
    toast.success("Summary copied");
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl border-2 border-amber-800/30 bg-gradient-to-br from-amber-50 via-orange-50/60 to-yellow-50/80 p-5">
        {/* Decorative doodle elements */}
        <div className="absolute -top-3 -right-3 h-20 w-20 rounded-full border-4 border-amber-200/40" />
        <div className="absolute -bottom-4 -left-4 h-16 w-16 rounded-full border-4 border-amber-200/30" />
        <div className="absolute top-1/2 right-8 h-8 w-8 rotate-45 border-2 border-amber-300/30" />

        <div className="relative">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border-2 border-amber-600/40 bg-amber-100/80">
              <Stethoscope className="h-6 w-6 text-amber-800" />
            </div>
            <div>
              <h2 className="font-handwritten text-2xl font-bold text-amber-900">
                Evaluation of Acute Diarrhoea
              </h2>
              <p className="font-handwritten text-sm text-amber-700/80">
                {DEFINITION}
              </p>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className={doodleBadge}>
              <Clock className="h-3 w-3" /> &lt;14 days
            </span>
            <span className={doodleBadge}>
              <Droplets className="h-3 w-3" /> Watery / bloody
            </span>
            <span className={doodleBadge}>
              <AlertTriangle className="h-3 w-3" /> Red flags
            </span>
          </div>
        </div>
      </div>

      {/* Diagnostic classification image */}
      <div className="relative rounded-2xl border-2 border-amber-800/30 bg-gradient-to-br from-amber-50/90 to-orange-50/80 p-3">
        <div className="mb-2 font-handwritten text-sm font-bold text-amber-900 flex items-center gap-2">
          <FlaskConical className="h-4 w-4 text-amber-700" />
          Diarrhoea Classification Framework
        </div>
        <ZoomableImage
          src={diarrhoeaClassImg.url}
          alt="Acute diarrhoea diagnostic classification — osmotic, secretory, inflammatory, malabsorptive, and motility-related causes"
          className="w-full h-auto rounded-xl"
        />
      </div>

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

      {/* Step 3: Workup */}
      <CollapsibleSection title="3. Investigations" icon={Beaker} defaultOpen>
        <div className="overflow-x-auto rounded-xl border-2 border-dashed border-amber-700/25 bg-white/60">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-dashed border-amber-300/50 bg-amber-100/40">
                <th className="px-3 py-2 text-left font-handwritten text-xs font-bold text-amber-900 uppercase">
                  Test
                </th>
                <th className="px-3 py-2 text-left font-handwritten text-xs font-bold text-amber-900 uppercase">
                  When to order
                </th>
              </tr>
            </thead>
            <tbody>
              {WORKUP.map((item) => (
                <tr
                  key={item.label}
                  className="border-b border-dashed border-amber-200/40 last:border-0"
                >
                  <td className="px-3 py-2 font-handwritten text-sm font-bold text-amber-900">
                    {item.label}
                  </td>
                  <td className="px-3 py-2 font-handwritten text-xs text-amber-800/80">
                    {item.when}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CollapsibleSection>

      {/* fCal — Clinical Interpretation Guide */}
      <div className="relative rounded-2xl border-2 border-amber-600/30 bg-gradient-to-br from-amber-100/80 to-yellow-50/80 p-4">
        <div className="absolute -top-2 -left-2 flex h-7 w-7 items-center justify-center rounded-full border-2 border-amber-600/40 bg-amber-200">
          <FlaskConical className="h-3.5 w-3.5 text-amber-900" />
        </div>
        <div className="ml-2">
          <div className="font-handwritten text-sm font-bold text-amber-900">
            Fecal Calprotectin (fCal) — Interpretation
          </div>
          <div className="mt-2 space-y-2 font-handwritten text-xs text-amber-800/80">
            <p>
              Use fCal as an adjunct test when the key clinical question is
              <strong> inflammatory vs non‑inflammatory </strong> diarrhoea
              (eg, bloody stools, systemic features, or moderate–severe
              disease). Interpret alongside history, exam, stool
              microscopy/PCR, and medication history (NSAIDs).
            </p>
            <div className="flex items-start gap-2">
              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
              <span>
                <strong>Positive</strong> + clinical suspicion for invasive infection
                → prioritise stool culture/PCR and consider empiric therapy per
                local protocols.
              </span>
            </div>
            <div className="flex items-start gap-2">
              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
              <span>
                <strong>Negative</strong> + low clinical concern → favour
                supportive care.
              </span>
            </div>
            <div className="flex items-start gap-2">
              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
              <span>
                Know your lab's assay cutoffs and pretest probability —
                thresholds and performance characteristics vary between
                populations and settings.
              </span>
            </div>
            <div className="flex items-start gap-2">
              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
              <span>
                <strong>Mild, self‑limited, non‑bloody</strong> → supportive
                care is usually enough. fCal adds limited value as most
                uncomplicated viral diarrhoeas resolve without testing.
              </span>
            </div>
            <div className="flex items-start gap-2">
              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
              <span>
                <strong>Diagnosis uncertain</strong> → fCal helps triage. A
                higher value supports an inflammatory process; one multicentre
                study reported sensitivity 83% and specificity 87% for acute
                bacterial diarrhoea, outperforming lactoferrin and FOBT.
              </span>
            </div>
            <div className="flex items-start gap-2">
              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
              <span>
                <strong>Elevated</strong> → send stool PCR/culture and manage
                based on the clinical picture. Do NOT treat as proof of
                bacterial infection — IBD, NSAIDs, and other inflammatory
                states can also raise fCal.
              </span>
            </div>
            <div className="flex items-start gap-2">
              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
              <span>
                <strong>Low</strong> → invasive bacterial diarrhoea is less likely.
              </span>
            </div>
          </div>
        </div>
      </div>

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
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </CollapsibleSection>

      {/* Step 5: Pathogen quick reference */}
      <CollapsibleSection
        title="5. Pathogen Quick Reference"
        icon={FlaskConical}
        defaultOpen={false}
      >
        <div className="overflow-x-auto rounded-xl border-2 border-dashed border-amber-700/25 bg-white/60">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b-2 border-dashed border-amber-300/50 bg-amber-100/40">
                <th className="px-2 py-1.5 text-left font-handwritten font-bold text-amber-900">
                  Pathogen
                </th>
                <th className="px-2 py-1.5 text-left font-handwritten font-bold text-amber-900">
                  Incubation
                </th>
                <th className="px-2 py-1.5 text-left font-handwritten font-bold text-amber-900">
                  Features
                </th>
                <th className="px-2 py-1.5 text-left font-handwritten font-bold text-amber-900">
                  Treatment
                </th>
              </tr>
            </thead>
            <tbody>
              {PATHOGEN_TABLE.map((row) => (
                <tr
                  key={row.pathogen}
                  className="border-b border-dashed border-amber-200/40 last:border-0"
                >
                  <td className="whitespace-nowrap px-2 py-1.5 font-handwritten font-bold text-amber-900">
                    {row.pathogen}
                  </td>
                  <td className="whitespace-nowrap px-2 py-1.5 font-handwritten text-amber-800/80">
                    {row.incubation}
                  </td>
                  <td className="px-2 py-1.5 font-handwritten text-amber-800/80">
                    {row.features}
                  </td>
                  <td className="px-2 py-1.5 font-handwritten text-amber-800/80">
                    {row.treatment}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CollapsibleSection>

      {/* Key pearls */}
      <div className="relative rounded-2xl border-2 border-amber-600/30 bg-gradient-to-br from-amber-100/80 to-yellow-50/80 p-4">
        <div className="absolute -top-2 -left-2 flex h-7 w-7 items-center justify-center rounded-full border-2 border-amber-600/40 bg-amber-200">
          <Info className="h-3.5 w-3.5 text-amber-900" />
        </div>
        <div className="ml-2">
          <div className="font-handwritten text-sm font-bold text-amber-900">
            Key Pearls
          </div>
          <ul className="mt-2 space-y-1">
            <li className="flex items-start gap-2 font-handwritten text-xs text-amber-800/80">
              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
              <strong>EHEC O157:H7</strong> — NO antibiotics, NO loperamide. Supportive care only. High HUS risk.
            </li>
            <li className="flex items-start gap-2 font-handwritten text-xs text-amber-800/80">
              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
              <strong>C. difficile</strong> — Stop offending abx. Vancomycin or fidaxomicin. Metronidazole only for mild non-severe.
            </li>
            <li className="flex items-start gap-2 font-handwritten text-xs text-amber-800/80">
              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
              <strong>Traveller's diarrhoea</strong> — Most self-limited. Azithromycin 1 g ×1 for moderate–severe.
            </li>
            <li className="flex items-start gap-2 font-handwritten text-xs text-amber-800/80">
              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
              <strong>ORS recipe</strong> — 1 L clean water + 6 tsp sugar + ½ tsp salt. Continue feeding.
            </li>
          </ul>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={handleCopy}
          className="inline-flex items-center gap-1.5 rounded-xl border-2 border-amber-700/30 bg-amber-100/60 px-3 py-1.5 font-handwritten text-xs text-amber-900 hover:bg-amber-200/60"
        >
          <Copy className="h-3.5 w-3.5" /> Copy summary
        </button>
        <button
          onClick={() => {
            downloadTextFile(
              `acute-diarrhoea-${new Date().toISOString().slice(0, 10)}`,
              `EVALUATION OF ACUTE DIARRHOEA\n${DEFINITION}\n\nRed Flags:\n${RED_FLAGS.map((f) => `  • ${f}`).join("\n")}\n\nDisclaimer: Decision-support only.`
            );
          }}
          className="inline-flex items-center gap-1.5 rounded-xl border-2 border-amber-700/30 bg-amber-100/60 px-3 py-1.5 font-handwritten text-xs text-amber-900 hover:bg-amber-200/60"
        >
          <Download className="h-3.5 w-3.5" /> Download
        </button>
        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-1.5 rounded-xl border-2 border-amber-700/30 bg-amber-100/60 px-3 py-1.5 font-handwritten text-xs text-amber-900 hover:bg-amber-200/60"
        >
          <Printer className="h-3.5 w-3.5" /> Print
        </button>
      </div>

      <div className="rounded-xl border-2 border-dashed border-amber-400/30 bg-amber-50/40 p-3 text-center font-handwritten text-xs text-amber-700/70">
        Decision-support only. Does not replace clinical judgement or local guidelines.
      </div>
    </div>
  );
}
