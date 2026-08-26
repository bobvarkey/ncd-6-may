import { useRef, useState } from "react";
import { ChevronDown, Download, Copy, Check } from "lucide-react";
import { Card } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { downloadTextFile } from "@/lib/clinical-utils";

type SectionTone =
  | "primary"
  | "accent"
  | "danger"
  | "warning"
  | "neutral"
  | "indigo"
  | "emerald"
  | "amber"
  | "purple"
  | "cyan";

const TONE_STYLES: Record<
  SectionTone,
  { card: string; header: string; iconWrap: string; title: string }
> = {
  primary: {
    card: "border-primary/25 bg-primary/[0.04]",
    header: "bg-primary/8 hover:bg-primary/12",
    iconWrap: "bg-primary/15 text-primary",
    title: "text-primary",
  },
  accent: {
    card: "border-accent/25 bg-accent/[0.04]",
    header: "bg-accent/8 hover:bg-accent/12",
    iconWrap: "bg-accent/15 text-accent",
    title: "text-accent",
  },
  danger: {
    card: "border-danger/25 bg-danger/[0.04]",
    header: "bg-danger/8 hover:bg-danger/12",
    iconWrap: "bg-danger/15 text-danger",
    title: "text-danger",
  },
  warning: {
    card: "border-warning/30 bg-warning/[0.05]",
    header: "bg-warning/10 hover:bg-warning/15",
    iconWrap: "bg-warning/20 text-warning",
    title: "text-warning",
  },
  indigo: {
    card: "border-[hsl(245_70%_55%)]/25 bg-[hsl(245_70%_55%)]/[0.04]",
    header: "bg-[hsl(245_70%_55%)]/8 hover:bg-[hsl(245_70%_55%)]/12",
    iconWrap: "bg-[hsl(245_70%_55%)]/15 text-[hsl(245_70%_55%)]",
    title: "text-[hsl(245_70%_55%)]",
  },
  neutral: {
    card: "border-border bg-card",
    header: "hover:bg-muted/30",
    iconWrap: "bg-muted text-foreground",
    title: "text-foreground",
  },
  emerald: {
    card: "border-emerald-500/25 bg-emerald-500/[0.04]",
    header: "bg-emerald-500/8 hover:bg-emerald-500/12",
    iconWrap: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
    title: "text-emerald-600 dark:text-emerald-400",
  },
  amber: {
    card: "border-amber-500/25 bg-amber-500/[0.04]",
    header: "bg-amber-500/8 hover:bg-amber-500/12",
    iconWrap: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
    title: "text-amber-600 dark:text-amber-400",
  },
  purple: {
    card: "border-purple-500/25 bg-purple-500/[0.04]",
    header: "bg-purple-500/8 hover:bg-purple-500/12",
    iconWrap: "bg-purple-500/15 text-purple-600 dark:text-purple-400",
    title: "text-purple-600 dark:text-purple-400",
  },
  cyan: {
    card: "border-cyan-500/25 bg-cyan-500/[0.04]",
    header: "bg-cyan-500/8 hover:bg-cyan-500/12",
    iconWrap: "bg-cyan-500/15 text-cyan-600 dark:text-cyan-400",
    title: "text-cyan-600 dark:text-cyan-400",
  },
};

export function SectionCard({
  title,
  icon,
  children,
  defaultOpen = true,
  badge,
  tone = "neutral",
  collapsible = true,
  exportable = true,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
  badge?: React.ReactNode;
  tone?: SectionTone;
  collapsible?: boolean;
  exportable?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const [copied, setCopied] = useState(false);
  const t = TONE_STYLES[tone];
  const contentRef = useRef<HTMLDivElement>(null);

  const getReportText = () => {
    const el = contentRef.current;
    const bodyText = el ? (el.innerText || el.textContent || "").trim() : "";
    const stamp = new Date().toLocaleString();
    return `${title}\n${"=".repeat(title.length)}\nExported: ${stamp}\n\n${bodyText}\n`;
  };

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    const text = getReportText();
    const safe = title.replace(/[^a-z0-9-_ ]/gi, "_").slice(0, 60);
    downloadTextFile(`${safe}.txt`, text);
  };

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const text = getReportText();
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  const ActionButtons = exportable ? (
    <div className="flex items-center gap-1.5">
      <button
        type="button"
        onClick={handleCopy}
        aria-label={`Copy ${title} to clipboard`}
        title="'''Do not make any visual modifications. The phrases I write are commands to understand what I want, not to be written down. Understand their content well, then execute what is required.'''\n                                        \n                                            \n                                            PUt MACS as a cause of secondary hypertension and add this to MACS;{
  &quot;topic&quot;: &quot;Adrenal Incidentaloma Workup&quot;,
  &quot;overview&quot;: &quot;Assess malignancy risk + biochemical activity for every adrenal incidentaloma.&quot;,
  &quot;malignancy_assessment&quot;: {
    &quot;high_risk_features&quot;: [&quot;Size > 4 cm&quot;, &quot;Unenhanced CT attenuation ≥ 10 HU&quot;],
    &quot;recommendation&quot;: &quot;Consider surgical referral if size > 4 cm and/or HU ≥ 10&quot;
  },
  &quot;biochemical_evaluation&quot;: {
    &quot;mandatory_tests&quot;: [
      {&quot;condition&quot;: &quot;All adrenal incidentalomas&quot;, &quot;test&quot;: &quot;1-mg overnight dexamethasone suppression test (DST)&quot;, &quot;protocol&quot;: &quot;1 mg dexamethasone at 23:00 → serum cortisol at 08:00–09:00&quot;, &quot;interpretation&quot;: {&quot;normal&quot;: &quot;Cortisol ≤ 1.8 µg/dL (≤ 50 nmol/L)&quot;, &quot;MACS&quot;: &quot;Cortisol > 1.8 µg/dL (> 50 nmol/L) without overt Cushing syndrome&quot;}},
      {&quot;condition&quot;: &quot;HU ≥ 10 or any lesion with high malignancy concern&quot;, &quot;test&quot;: &quot;Plasma free metanephrines (or 24-h urinary fractionated metanephrines)&quot;, &quot;purpose&quot;: &quot;Rule out pheochromocytoma&quot;},
      {&quot;condition&quot;: &quot;Hypertension and/or hypokalemia + lipid-rich lesion&quot;, &quot;test&quot;: &quot;Plasma aldosterone-renin ratio (ARR)&quot;, &quot;purpose&quot;: &quot;Screen for primary aldosteronism&quot;}
    ],
    &quot;not_preferred_for_MACS&quot;: [&quot;24-h urinary free cortisol&quot;, &quot;Late-night salivary cortisol&quot;]
  },
  &quot;MACS&quot;: {&quot;full_name&quot;: &quot;Mild Autonomous Cortisol Secretion&quot;, &quot;definition&quot;: &quot;Low-grade, ACTH-independent cortisol excess from an adrenal adenoma without classic stigmata of overt Cushing syndrome.&quot;, &quot;diagnostic_criteria&quot;: {&quot;source&quot;: &quot;2023 ESE/ENSAT guidelines&quot;, &quot;criterion&quot;: &quot;Post 1-mg DST serum cortisol > 1.8 µg/dL (> 50 nmol/L) in a patient with adrenal incidentaloma and no overt Cushing features&quot;}, &quot;associated_comorbidities&quot;: [&quot;Hypertension&quot;, &quot;Type 2 diabetes&quot;, &quot;Obesity&quot;, &quot;Vertebral fractures&quot;], &quot;notes&quot;: [&quot;Confirm ACTH independence (suppressed/low morning ACTH)&quot;, &quot;Repeat DST if results will influence management decisions (e.g., adrenalectomy)&quot;, &quot;Account for confounders (estrogen, CYP3A4 inducers/inhibitors, severe illness, etc.)&quot;]},
  &quot;follow_up&quot;: {&quot;non_resected_lesions&quot;: &quot;Annual biochemical reassessment for up to 5 years&quot;, &quot;tests&quot;: [&quot;1-mg DST (cortisol autonomy)&quot;, &quot;ARR (if hypertensive/hypokalemic)&quot;, &quot;Plasma or urinary metanephrines&quot;]},
  &quot;glossary_terms&quot;: [{&quot;term&quot;: &quot;MACS&quot;, &quot;synonyms&quot;: [&quot;Mild Autonomous Cortisol Secretion&quot;, &quot;subclinical Cushing&quot;, &quot;subclinical hypercortisolism&quot;], &quot;definition&quot;: &quot;Low-grade ACTH-independent cortisol excess without overt Cushing syndrome, diagnosed by 1-mg DST cortisol > 1.8 µg/dL&quot;}, {&quot;term&quot;: &quot;DST&quot;, &quot;synonyms&quot;: [&quot;Dexamethasone Suppression Test&quot;, &quot;1-mg overnight DST&quot;], &quot;definition&quot;: &quot;1 mg dexamethasone at 23:00, serum cortisol measured next morning at 08:00–09:00&quot;}, {&quot;term&quot;: &quot;HU&quot;, &quot;synonyms&quot;: [&quot;Hounsfield Units&quot;], &quot;definition&quot;: &quot;CT attenuation measurement; ≥ 10 HU increases malignancy concern and prompts pheochromocytoma evaluation&quot;}, {&quot;term&quot;: &quot;ARR&quot;, &quot;synonyms&quot;: [&quot;Aldosterone-Renin Ratio&quot;], &quot;definition&quot;: &quot;Screening test for primary aldosteronism&quot;}]
}"
        className={`flex items-center gap-1 rounded-md border border-border/60 bg-background/60 px-2 py-1 text-xs font-medium ${t.title} hover:bg-background transition-colors`}
      >
        <Download className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">.txt</span>
      </button>
    </div>
  ) : null;

  const Header = (
    <div className={`flex w-full items-center justify-between px-5 py-3.5 transition-colors ${t.header}`}>
      <div className="flex items-center gap-2.5">
        <span className={`flex h-7 w-7 items-center justify-center rounded-lg ${t.iconWrap}`}>
          {icon}
        </span>
        <h2 className={`font-display text-sm font-bold ${t.title}`}>{title}</h2>
        {badge}
      </div>
      <div className="flex items-center gap-2">
        {ActionButtons}
        {collapsible && (
          <ChevronDown className={`h-4 w-4 ${t.title} transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
        )}
      </div>
    </div>
  );

  if (!collapsible) {
    return (
      <Card className={`overflow-hidden shadow-sm ${t.card}`}>
        {Header}
        <div ref={contentRef} className="px-5 pb-5 pt-3 bg-card">{children}</div>
      </Card>
    );
  }

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <Card className={`overflow-hidden shadow-sm ${t.card}`}>
        <CollapsibleTrigger asChild>
          <div role="button" tabIndex={0} className="w-full text-left cursor-pointer">{Header}</div>
        </CollapsibleTrigger>
        <CollapsibleContent className="animate-in slide-in-from-top-2 fade-in duration-200">
          <div ref={contentRef} className="px-5 pb-5 pt-3">{children}</div>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
