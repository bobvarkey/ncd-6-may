import { useState } from "react";
import {
  Clock,
  AlertTriangle,
  Pill,
  Apple,
  Droplets,
  ChevronDown,
  ChevronRight,
  Info,
  Baby,
  Download,
  Printer,
  Copy,
  ClipboardList,
} from "lucide-react";
import ZoomableImage from "@/components/ZoomableImage";
import { downloadTextFile } from "@/lib/clinical-utils";
import { toast } from "sonner";
import definitionImg from "@/assets/constipation-definition-causes.png.asset.json";
import managementImg from "@/assets/constipation-management.png.asset.json";

const doodleCard =
  "relative rounded-2xl border-2 border-amber-800/30 bg-gradient-to-br from-amber-50/90 to-orange-50/80 p-4 shadow-sm";
const doodleTitle =
  "font-handwritten text-lg font-bold text-amber-900 flex items-center gap-2";
const doodleBox =
  "rounded-xl border-2 border-dashed border-amber-700/25 bg-white/60 p-3";
const doodleBadge =
  "inline-flex items-center gap-1 rounded-full border border-amber-700/30 bg-amber-100/60 px-2.5 py-1 font-handwritten text-xs text-amber-900";

const DEFINITION = [
  "Less than 3 bowel movements per week",
  "Hard stools",
  "Excessive straining",
  "Feeling of incomplete evacuation",
];

const ACUTE_CAUSES = [
  "Intestinal obstruction",
  "Dehydration",
  "Electrolyte imbalance",
  "Drug induced",
  "Dietary cause",
];

const CHRONIC_CAUSES: { group: string; items: string[] }[] = [
  { group: "Functional", items: ["Low fibre diet", "Poor hydration", "Lifestyle"] },
  { group: "Irritable bowel syndrome (IBS)", items: ["IBS-C phenotype"] },
  { group: "Metabolic / endocrine", items: ["Hypothyroidism", "Diabetes", "Hypercalcemia"] },
  { group: "Neurological", items: ["Spinal cord lesion"] },
  { group: "Chronic drug use", items: ["Iron", "Calcium", "Opioids", "Antidepressants"] },
];

const LIFESTYLE = [
  "Increase dietary fibre (fruits, vegetables, whole grains)",
  "Adequate hydration (2–3 L/day)",
  "Regular physical activity",
  "Establish regular bowel habits",
  "Respond promptly to the urge to defecate",
  "Avoid excessive straining and sedentary lifestyle",
];

const DIET = [
  "High fibre diet (20–30 g/day)",
  "Bulk forming foods: oats, bran, psyllium husk",
  "Probiotics: curd, buttermilk",
  "Limit low fibre, processed foods and excess dairy",
];

const DRUG_TABLE = [
  {
    cls: "Bulk forming agents",
    agents: "Psyllium (Isabgol), Methylcellulose (Citrucel), Calcium polycarbophil",
    use: "Chronic mild constipation",
    action: "Increases stool bulk, promotes peristalsis",
  },
  {
    cls: "Osmotic laxatives",
    agents: "Lactulose (Duphalac), PEG (Laxiflui, Peglax), Milk of magnesia",
    use: "Chronic constipation, elderly, pregnancy",
    action: "Draws water into bowel, softens stool",
  },
  {
    cls: "Stimulant laxatives",
    agents: "Senna (Senokot), Bisacodyl (Dulcolax), Sodium picosulfate",
    use: "Occasional / short-term constipation",
    action: "Stimulate intestinal motility",
  },
  {
    cls: "Stool softeners",
    agents: "Docusate sodium",
    use: "Hard stool, avoid straining",
    action: "Softens stool by wetting effect",
  },
  {
    cls: "Lubricant laxatives",
    agents: "Liquid paraffin (Cremaffin), Glycerin suppository",
    use: "Hard stool, fissure, piles; suppository if oral route not possible",
    action: "Lubricates stool / rectum, eases passage",
  },
  {
    cls: "Prokinetic agents",
    agents: "Prucalopride, Tegaserod",
    use: "Refractory chronic constipation",
    action: "Enhance colonic transit (5-HT4 agonists)",
  },
];

const ENEMA = {
  when: [
    "Severe constipation",
    "Faecal impaction",
    "Pre-procedure bowel emptying",
    "When other measures fail",
  ],
  examples: ["Glycerin enema", "Pedia-Lax enema"],
  action: ["Softens stool", "Lubricates", "Stimulates bowel movement"],
};

const SPECIAL = [
  { who: "Children", advice: "Ensure diet, hydration and behaviour modification" },
  { who: "Elderly", advice: "Review drugs, ensure mobility and hydration" },
  { who: "Pregnancy", advice: "Fibre, fluids, safe laxatives like lactulose" },
];

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

const SUMMARY = `APPROACH TO CONSTIPATION

Definition:
${DEFINITION.map((d) => `  • ${d}`).join("\n")}

Acute constipation (<4 weeks):
${ACUTE_CAUSES.map((c) => `  • ${c}`).join("\n")}

Chronic constipation (>3 months):
${CHRONIC_CAUSES.map((g) => `  ${g.group}: ${g.items.join(", ")}`).join("\n")}

Lifestyle:
${LIFESTYLE.map((l) => `  • ${l}`).join("\n")}

Diet:
${DIET.map((l) => `  • ${l}`).join("\n")}

Pharmacological:
${DRUG_TABLE.map((d) => `  ${d.cls}: ${d.agents} — ${d.use}; ${d.action}`).join("\n")}

Enema — when: ${ENEMA.when.join(", ")}; examples: ${ENEMA.examples.join(", ")}; action: ${ENEMA.action.join(", ")}

Special situations:
${SPECIAL.map((s) => `  ${s.who}: ${s.advice}`).join("\n")}

Disclaimer: Decision-support only. Does not replace clinical judgement.`;

export default function Constipation() {
  const handleCopy = async () => {
    await navigator.clipboard.writeText(SUMMARY);
    toast.success("Summary copied");
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl border-2 border-amber-800/30 bg-gradient-to-br from-amber-50 via-orange-50/60 to-yellow-50/80 p-5">
        <div className="absolute -top-3 -right-3 h-20 w-20 rounded-full border-4 border-amber-200/40" />
        <div className="relative">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border-2 border-amber-600/40 bg-amber-100/80">
              <ClipboardList className="h-6 w-6 text-amber-800" />
            </div>
            <div>
              <h2 className="font-handwritten text-2xl font-bold text-amber-900">
                Approach to Constipation
              </h2>
              <p className="font-handwritten text-sm text-amber-700/80">
                Definition, causes and stepwise management
              </p>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className={doodleBadge}>
              <Clock className="h-3 w-3" /> Acute &lt;4 weeks
            </span>
            <span className={doodleBadge}>
              <Clock className="h-3 w-3" /> Chronic &gt;3 months
            </span>
            <span className={doodleBadge}>
              <Pill className="h-3 w-3" /> Laxative ladder
            </span>
          </div>
        </div>
      </div>

      {/* Definition */}
      <CollapsibleSection title="1. Defining Constipation" icon={ClipboardList} defaultOpen>
        <div className="grid gap-2 sm:grid-cols-2">
          {DEFINITION.map((d) => (
            <div key={d} className={doodleBox}>
              <span className="font-handwritten text-sm text-amber-900">{d}</span>
            </div>
          ))}
        </div>
        <p className="font-handwritten text-xs text-amber-800/70">
          Two or more features, typically over ≥3 months for chronic constipation (Rome-style
          criteria).
        </p>
      </CollapsibleSection>

      {/* Causes */}
      <CollapsibleSection title="2. Causes — Acute vs Chronic" icon={AlertTriangle} defaultOpen>
        <div className="grid gap-3 md:grid-cols-2">
          <div className={doodleBox}>
            <div className="mb-2 font-handwritten text-sm font-bold text-amber-900">
              Acute constipation (&lt; 4 weeks)
            </div>
            <ul className="space-y-1">
              {ACUTE_CAUSES.map((c) => (
                <li
                  key={c}
                  className="flex items-start gap-2 font-handwritten text-xs text-amber-800/80"
                >
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                  {c}
                </li>
              ))}
            </ul>
            <p className="mt-2 font-handwritten text-xs text-red-700">
              Sudden onset with pain, vomiting or distension → exclude obstruction urgently.
            </p>
          </div>
          <div className={doodleBox}>
            <div className="mb-2 font-handwritten text-sm font-bold text-amber-900">
              Chronic constipation (&gt; 3 months)
            </div>
            <div className="space-y-2">
              {CHRONIC_CAUSES.map((g) => (
                <div key={g.group}>
                  <div className="font-handwritten text-xs font-bold text-amber-900">
                    {g.group}
                  </div>
                  <div className="font-handwritten text-xs text-amber-800/80">
                    {g.items.join(" • ")}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <ZoomableImage
          src={definitionImg.url}
          alt="Approach to constipation — definition and causes chart"
          wrapperClassName="mt-2"
          className="w-full rounded-xl border-2 border-amber-700/20"
        />
      </CollapsibleSection>

      {/* Lifestyle & diet */}
      <CollapsibleSection title="3. Lifestyle & Dietary Modification" icon={Apple} defaultOpen>
        <div className="grid gap-3 md:grid-cols-2">
          <div className={doodleBox}>
            <div className="mb-2 font-handwritten text-sm font-bold text-amber-900">
              Lifestyle
            </div>
            <ul className="space-y-1">
              {LIFESTYLE.map((l) => (
                <li
                  key={l}
                  className="flex items-start gap-2 font-handwritten text-xs text-amber-800/80"
                >
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                  {l}
                </li>
              ))}
            </ul>
          </div>
          <div className={doodleBox}>
            <div className="mb-2 font-handwritten text-sm font-bold text-amber-900">Diet</div>
            <ul className="space-y-1">
              {DIET.map((l) => (
                <li
                  key={l}
                  className="flex items-start gap-2 font-handwritten text-xs text-amber-800/80"
                >
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                  {l}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </CollapsibleSection>

      {/* Pharmacological */}
      <CollapsibleSection title="4. Pharmacological Management" icon={Pill} defaultOpen>
        <div className="overflow-x-auto rounded-xl border-2 border-dashed border-amber-700/25 bg-white/60">
          <table className="w-full min-w-[640px] text-xs">
            <thead>
              <tr className="border-b-2 border-dashed border-amber-300/50 bg-amber-100/40">
                <th className="px-2 py-1.5 text-left font-handwritten font-bold text-amber-900">
                  Class
                </th>
                <th className="px-2 py-1.5 text-left font-handwritten font-bold text-amber-900">
                  Agents / brands
                </th>
                <th className="px-2 py-1.5 text-left font-handwritten font-bold text-amber-900">
                  Use
                </th>
                <th className="px-2 py-1.5 text-left font-handwritten font-bold text-amber-900">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {DRUG_TABLE.map((row) => (
                <tr
                  key={row.cls}
                  className="border-b border-dashed border-amber-200/40 last:border-0"
                >
                  <td className="px-2 py-1.5 font-handwritten font-bold text-amber-900">
                    {row.cls}
                  </td>
                  <td className="px-2 py-1.5 font-handwritten text-amber-800/80">{row.agents}</td>
                  <td className="px-2 py-1.5 font-handwritten text-amber-800/80">{row.use}</td>
                  <td className="px-2 py-1.5 font-handwritten text-amber-800/80">{row.action}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <ZoomableImage
          src={managementImg.url}
          alt="Management and treatment of constipation chart"
          wrapperClassName="mt-2"
          className="w-full rounded-xl border-2 border-amber-700/20"
        />
      </CollapsibleSection>

      {/* Softeners, lubricants, enema */}
      <CollapsibleSection title="5. Softeners, Lubricants & Enema" icon={Droplets} defaultOpen>
        <div className="grid gap-3 md:grid-cols-2">
          <div className={doodleBox}>
            <div className="mb-1 font-handwritten text-sm font-bold text-amber-900">
              Liquid paraffin (Cremaffin liquid)
            </div>
            <div className="font-handwritten text-xs text-amber-800/80">
              Use: hard stool, straining, fissure, piles. Action: lubricates and softens stool,
              makes passage easier.
            </div>
            <div className="mt-2 font-handwritten text-sm font-bold text-amber-900">
              Glycerin suppository
            </div>
            <div className="font-handwritten text-xs text-amber-800/80">
              Use: hard stool, especially when oral route not possible. Action: lubricates rectum
              and stimulates bowel movement.
            </div>
          </div>
          <div className={doodleBox}>
            <div className="mb-1 font-handwritten text-sm font-bold text-amber-900">Enema</div>
            <div className="font-handwritten text-xs text-amber-800/80">
              When: {ENEMA.when.join(", ")}.
            </div>
            <div className="font-handwritten text-xs text-amber-800/80">
              Examples: {ENEMA.examples.join(", ")} — as per condition and need.
            </div>
            <div className="font-handwritten text-xs text-amber-800/80">
              Action: {ENEMA.action.join(", ")}.
            </div>
          </div>
        </div>
      </CollapsibleSection>

      {/* Special situations */}
      <div className="relative rounded-2xl border-2 border-amber-600/30 bg-gradient-to-br from-amber-100/80 to-yellow-50/80 p-4">
        <div className="absolute -top-2 -left-2 flex h-7 w-7 items-center justify-center rounded-full border-2 border-amber-600/40 bg-amber-200">
          <Baby className="h-3.5 w-3.5 text-amber-900" />
        </div>
        <div className="ml-2">
          <div className="font-handwritten text-sm font-bold text-amber-900">
            Special Situations
          </div>
          <ul className="mt-2 space-y-1">
            {SPECIAL.map((s) => (
              <li
                key={s.who}
                className="flex items-start gap-2 font-handwritten text-xs text-amber-800/80"
              >
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                <span>
                  <strong>{s.who}:</strong> {s.advice}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Pearls */}
      <div className="relative rounded-2xl border-2 border-amber-600/30 bg-gradient-to-br from-amber-100/80 to-yellow-50/80 p-4">
        <div className="absolute -top-2 -left-2 flex h-7 w-7 items-center justify-center rounded-full border-2 border-amber-600/40 bg-amber-200">
          <Info className="h-3.5 w-3.5 text-amber-900" />
        </div>
        <div className="ml-2">
          <div className="font-handwritten text-sm font-bold text-amber-900">Key Pearls</div>
          <ul className="mt-2 space-y-1 font-handwritten text-xs text-amber-800/80">
            <li>Always review the drug chart — iron, calcium, opioids and anticholinergics.</li>
            <li>Screen for hypothyroidism, diabetes and hypercalcemia in chronic cases.</li>
            <li>
              Start with fibre + fluids, then osmotic; reserve stimulants for short-term rescue.
            </li>
            <li>
              Alarm features (weight loss, bleeding, anaemia, new onset &gt;50 y) → colonoscopy.
            </li>
          </ul>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={handleCopy}
          className="inline-flex items-center gap-1.5 rounded-xl border-2 border-amber-700/30 bg-amber-100/60 px-3 py-1.5 font-handwritten text-xs text-amber-900 hover:bg-amber-200/60"
        >
          <Copy className="h-3.5 w-3.5" /> Copy summary
        </button>
        <button
          onClick={() =>
            downloadTextFile(
              `constipation-${new Date().toISOString().slice(0, 10)}`,
              SUMMARY
            )
          }
          className="inline-flex items-center gap-1.5 rounded-xl border-2 border-amber-700/30 bg-amber-100/60 px-3 py-1.5 font-handwritten text-xs text-amber-900 hover:bg-amber-200/60"
        >
          <Download className="h-3.5 w-3.5" /> Download .txt
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
