import { useState } from "react";
import { ScanLine, Target } from "lucide-react";

type CacRange = "0" | "1-99" | ">=100" | ">=300";

const CAC_OPTIONS: {
  id: CacRange;
  label: string;
  ldlTarget: string;
  intensity: string;
  rationale: string;
  tone: string;
}[] = [
  {
    id: "0",
    label: "CAC 0",
    ldlTarget: "No specific LDL-C threshold required from CAC",
    intensity: "Statin generally deferrable",
    rationale:
      "No detectable plaque. Risk often LOWER than PREVENT alone suggests. Reasonable to defer statin in borderline / intermediate PREVENT risk; reassess CAC in 5–10 y.",
    tone: "emerald",
  },
  {
    id: "1-99",
    label: "CAC 1–99",
    ldlTarget: "LDL-C < 100 mg/dL (consider < 70 mg/dL)",
    intensity: "Moderate-intensity statin",
    rationale:
      "Mild plaque burden — modest upward risk shift over PREVENT estimate. Initiate moderate-intensity statin, especially if age ≥ 55 y or risk-enhancers present.",
    tone: "amber",
  },
  {
    id: ">=100",
    label: "CAC ≥ 100",
    ldlTarget: "LDL-C < 70 mg/dL (target < 55 mg/dL if enhancers)",
    intensity: "High-intensity statin — START or INTENSIFY",
    rationale:
      "Guideline-endorsed statin trigger (2018 ACC/AHA). Meaningful upward risk shift; PREVENT alone underestimates true ASCVD risk. Initiate high-intensity statin; add ezetimibe if LDL-C above goal.",
    tone: "orange",
  },
  {
    id: ">=300",
    label: "CAC ≥ 300",
    ldlTarget: "LDL-C < 55 mg/dL (consider < 40 if CAC ≥ 1000)",
    intensity: "Maximal statin + add-on therapy",
    rationale:
      "Extensive calcification — risk approaches secondary-prevention levels. Maximally tolerated statin + ezetimibe; consider PCSK9 inhibitor / bempedoic acid. Discuss low-dose aspirin and functional testing.",
    tone: "danger",
  },
];

const TONE_CLASSES: Record<string, { border: string; bg: string; pill: string; text: string }> = {
  emerald: {
    border: "border-emerald-500/40",
    bg: "bg-emerald-500/[0.06]",
    pill: "bg-emerald-500/15 text-success dark:text-emerald-400",
    text: "text-success dark:text-emerald-400",
  },
  amber: {
    border: "border-amber-500/40",
    bg: "bg-warning/100/[0.06]",
    pill: "bg-warning/100/15 text-amber-700 dark:text-warning",
    text: "text-amber-700 dark:text-warning",
  },
  orange: {
    border: "border-warning/40",
    bg: "bg-warning/100/[0.06]",
    pill: "bg-warning/100/15 text-warning dark:text-warning",
    text: "text-warning dark:text-warning",
  },
  danger: {
    border: "border-danger/40",
    bg: "bg-danger/[0.06]",
    pill: "bg-danger/15 text-danger",
    text: "text-danger",
  },
};

export function CacLdlTargetGuide() {
  const [selected, setSelected] = useState<CacRange | null>(null);
  const active = CAC_OPTIONS.find((o) => o.id === selected);
  const tone = active ? TONE_CLASSES[active.tone] : null;

  return (
    <div className="mt-3 rounded-lg border border-[hsl(245_70%_55%)]/30 bg-[hsl(245_70%_55%)]/5 p-3">
      <div className="flex items-center gap-2 mb-2">
        <ScanLine className="h-3.5 w-3.5 text-[hsl(245_70%_55%)]" />
        <p className="text-xs font-bold text-[hsl(245_70%_55%)]">
          LDL-C Target Guide — by CAC Range
        </p>
      </div>
      <p className="text-xs text-muted-foreground mb-2">
        Select the patient's CAC range to view the suggested LDL-C target and statin intensity.
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
        {CAC_OPTIONS.map((opt) => {
          const isActive = selected === opt.id;
          const t = TONE_CLASSES[opt.tone];
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => setSelected(isActive ? null : opt.id)}
              className={`rounded-md border px-2 py-1.5 text-xs font-semibold transition-all ${
                isActive
                  ? `${t.border} ${t.bg} ${t.text} shadow-sm`
                  : "border-border bg-card text-foreground hover:bg-muted/40"
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      {active && tone && (
        <div className={`mt-2.5 rounded-md border ${tone.border} ${tone.bg} p-2.5`}>
          <div className="flex items-start gap-2">
            <Target className={`h-3.5 w-3.5 mt-0.5 ${tone.text}`} />
            <div className="flex-1">
              <p className={`text-xs font-bold uppercase tracking-wider ${tone.text}`}>
                Suggested LDL-C target
              </p>
              <p className="text-sm font-bold text-foreground mt-0.5">{active.ldlTarget}</p>
              <span
                className={`inline-block mt-1 rounded-full px-2 py-0.5 text-xs font-bold ${tone.pill}`}
              >
                {active.intensity}
              </span>
              <p className="mt-1.5 text-xs leading-relaxed text-foreground">
                {active.rationale}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
