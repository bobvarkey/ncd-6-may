import { useMemo, useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { parseClinicalValue, roundClinical } from "@/lib/clinical-utils";

/**
 * LabInput — colorful, unit-aware clinical input.
 *
 * State is always stored in the canonical METRIC unit (the first unit listed).
 * The user may toggle to imperial/alternate units; values are converted on the fly.
 */

export type LabTone =
  | "rose"
  | "amber"
  | "violet"
  | "emerald"
  | "sky"
  | "indigo"
  | "fuchsia"
  | "teal"
  | "orange"
  | "lime"
  | "cyan"
  | "slate";

const TONE: Record<
  LabTone,
  { bar: string; label: string; ring: string; chipOn: string; chipOff: string; glow: string }
> = {
  rose:    { bar: "bg-[hsl(346_77%_55%)]",  label: "text-[hsl(346_77%_45%)]",  ring: "focus-within:ring-[hsl(346_77%_55%)]/40",  chipOn: "bg-[hsl(346_77%_55%)] text-white",  chipOff: "text-[hsl(346_77%_45%)] hover:bg-[hsl(346_77%_55%)]/10",  glow: "from-[hsl(346_77%_55%)]/10" },
  amber:   { bar: "bg-[hsl(38_92%_50%)]",   label: "text-[hsl(32_95%_42%)]",   ring: "focus-within:ring-[hsl(38_92%_50%)]/40",   chipOn: "bg-[hsl(38_92%_50%)] text-white",   chipOff: "text-[hsl(32_95%_42%)] hover:bg-[hsl(38_92%_50%)]/10",   glow: "from-[hsl(38_92%_50%)]/10" },
  violet:  { bar: "bg-[hsl(262_70%_58%)]",  label: "text-[hsl(262_70%_48%)]",  ring: "focus-within:ring-[hsl(262_70%_58%)]/40",  chipOn: "bg-[hsl(262_70%_58%)] text-white",  chipOff: "text-[hsl(262_70%_48%)] hover:bg-[hsl(262_70%_58%)]/10",  glow: "from-[hsl(262_70%_58%)]/10" },
  emerald: { bar: "bg-[hsl(160_60%_40%)]",  label: "text-[hsl(160_60%_32%)]",  ring: "focus-within:ring-[hsl(160_60%_40%)]/40",  chipOn: "bg-[hsl(160_60%_40%)] text-white",  chipOff: "text-[hsl(160_60%_32%)] hover:bg-[hsl(160_60%_40%)]/10",  glow: "from-[hsl(160_60%_40%)]/10" },
  sky:     { bar: "bg-[hsl(199_89%_48%)]",  label: "text-[hsl(199_89%_38%)]",  ring: "focus-within:ring-[hsl(199_89%_48%)]/40",  chipOn: "bg-[hsl(199_89%_48%)] text-white",  chipOff: "text-[hsl(199_89%_38%)] hover:bg-[hsl(199_89%_48%)]/10",  glow: "from-[hsl(199_89%_48%)]/10" },
  indigo:  { bar: "bg-[hsl(245_70%_58%)]",  label: "text-[hsl(245_70%_48%)]",  ring: "focus-within:ring-[hsl(245_70%_58%)]/40",  chipOn: "bg-[hsl(245_70%_58%)] text-white",  chipOff: "text-[hsl(245_70%_48%)] hover:bg-[hsl(245_70%_58%)]/10",  glow: "from-[hsl(245_70%_58%)]/10" },
  fuchsia: { bar: "bg-[hsl(292_84%_55%)]",  label: "text-[hsl(292_84%_45%)]",  ring: "focus-within:ring-[hsl(292_84%_55%)]/40",  chipOn: "bg-[hsl(292_84%_55%)] text-white",  chipOff: "text-[hsl(292_84%_45%)] hover:bg-[hsl(292_84%_55%)]/10",  glow: "from-[hsl(292_84%_55%)]/10" },
  teal:    { bar: "bg-[hsl(178_70%_40%)]",  label: "text-[hsl(178_70%_30%)]",  ring: "focus-within:ring-[hsl(178_70%_40%)]/40",  chipOn: "bg-[hsl(178_70%_40%)] text-white",  chipOff: "text-[hsl(178_70%_30%)] hover:bg-[hsl(178_70%_40%)]/10",  glow: "from-[hsl(178_70%_40%)]/10" },
  orange:  { bar: "bg-[hsl(20_90%_55%)]",   label: "text-[hsl(20_90%_45%)]",   ring: "focus-within:ring-[hsl(20_90%_55%)]/40",   chipOn: "bg-[hsl(20_90%_55%)] text-white",   chipOff: "text-[hsl(20_90%_45%)] hover:bg-[hsl(20_90%_55%)]/10",   glow: "from-[hsl(20_90%_55%)]/10" },
  lime:    { bar: "bg-[hsl(85_65%_45%)]",   label: "text-[hsl(85_65%_32%)]",   ring: "focus-within:ring-[hsl(85_65%_45%)]/40",   chipOn: "bg-[hsl(85_65%_45%)] text-white",   chipOff: "text-[hsl(85_65%_32%)] hover:bg-[hsl(85_65%_45%)]/10",   glow: "from-[hsl(85_65%_45%)]/10" },
  cyan:    { bar: "bg-[hsl(190_85%_45%)]",  label: "text-[hsl(190_85%_35%)]",  ring: "focus-within:ring-[hsl(190_85%_45%)]/40",  chipOn: "bg-[hsl(190_85%_45%)] text-white",  chipOff: "text-[hsl(190_85%_35%)] hover:bg-[hsl(190_85%_45%)]/10",  glow: "from-[hsl(190_85%_45%)]/10" },
  slate:   { bar: "bg-[hsl(215_20%_50%)]",  label: "text-[hsl(215_25%_35%)]",  ring: "focus-within:ring-[hsl(215_20%_50%)]/40",  chipOn: "bg-[hsl(215_20%_50%)] text-white",  chipOff: "text-[hsl(215_25%_35%)] hover:bg-[hsl(215_20%_50%)]/10",  glow: "from-[hsl(215_20%_50%)]/10" },
};

type Unit = {
  label: string;          // e.g. "mg/dL"
  /** Convert FROM canonical metric value TO this unit's value. */
  fromMetric: (v: number) => number;
  /** Convert FROM this unit's value TO canonical metric value. */
  toMetric: (v: number) => number;
  /** Display precision (decimal places) when showing the converted value. */
  precision?: number;
  /** Placeholder hint shown in the input when this unit is selected. */
  placeholder?: string;
};

interface LabInputProps {
  /** Short metric label, e.g. "LDL-C". */
  label: string;
  /** Icon shown inside the colored chip. */
  icon?: React.ReactNode;
  /** Color tone (semantic per analyte). */
  tone?: LabTone;
  /** Canonical metric value (string for empty/typing support). */
  value: string;
  /** Setter for the canonical metric value (string). */
  onChange: (v: string) => void;
  /** First entry MUST be the canonical metric unit. */
  units: Unit[];
  /** Optional helper text (e.g. "Auto" badge or note). */
  hint?: React.ReactNode;
  /** Optional badge node (e.g. "auto" tag). */
  badge?: React.ReactNode;
  /** Visually mark the input as auto-derived. */
  auto?: boolean;
  /** className extension on outer wrapper. */
  className?: string;
  /** Disable user typing. */
  disabled?: boolean;
  /** Step for the underlying number input. */
  step?: string;
  /** Slot rendered below the input (status badges, warnings). */
  belowInput?: React.ReactNode;
  /** When set, overrides the internal unit selection (0 = metric, 1 = imperial). */
  forcedUnitIdx?: number;
}

export function LabInput({
  label,
  icon,
  tone = "sky",
  value,
  onChange,
  units,
  hint,
  badge,
  auto,
  className,
  disabled,
  step = "any",
  belowInput,
  forcedUnitIdx,
}: LabInputProps) {
  const t = TONE[tone];
  const [unitIdx, setUnitIdx] = useState(0);
  const activeIdx = forcedUnitIdx !== undefined ? Math.min(forcedUnitIdx, units.length - 1) : unitIdx;
  const unit = units[activeIdx] ?? units[0];
  const metricUnit = units[0];

  // Convert the canonical metric value to the currently displayed unit string.
  const displayValue = useMemo(() => {
    if (value === "" || value === null || value === undefined) return "";
    const n = parseClinicalValue(value);
    if (n === null) return "";
    if (activeIdx === 0) return value; // store-as-typed for metric
    const converted = unit.fromMetric(n);
    if (!isFinite(converted)) return "";
    const p = unit.precision ?? 1;
    return Number(converted.toFixed(p)).toString();
  }, [value, unit, activeIdx]);

  const [localText, setLocalText] = useState(displayValue);
  useEffect(() => setLocalText(displayValue), [displayValue]);

  const handleChange = (raw: string) => {
    setLocalText(raw);
    if (raw === "") {
      onChange("");
      return;
    }
    const n = parseClinicalValue(raw);
    if (n === null) return;
    const metric = activeIdx === 0 ? n : unit.toMetric(n);
    const rounded = roundClinical(metric);
    onChange(rounded.toString());
  };

  return (
    <div className={cn("group", className)}>
      <div className="mb-1 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          {icon && (
            <span
              className={cn(
                "flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-white",
                t.bar,
              )}
            >
              {icon}
            </span>
          )}
          <label className={cn("text-xs font-bold truncate", t.label)}>
            {label}
          </label>
          {auto && (
            <span className="text-[9px] font-semibold uppercase tracking-wider text-primary">
              auto
            </span>
          )}
          {badge}
        </div>
        {units.length > 1 && (
          <div className="flex items-center rounded-md border border-border bg-background/60 p-0.5 shrink-0">
            {units.map((u, i) => (
              <button
                key={u.label}
                type="button"
                onClick={() => setUnitIdx(i)}
                className={cn(
                  "px-1.5 py-0.5 text-[9px] font-semibold rounded transition-colors leading-tight",
                  i === activeIdx ? t.chipOn : t.chipOff,
                )}
                aria-pressed={i === unitIdx}
              >
                {u.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div
        className={cn(
          "relative flex items-stretch overflow-hidden rounded-md border border-input bg-background transition-shadow",
          "focus-within:ring-2 focus-within:ring-offset-1 focus-within:ring-offset-background",
          t.ring,
          auto && "bg-muted/40",
        )}
      >
        <span className={cn("w-1 shrink-0", t.bar)} aria-hidden />
        <input
          type="text"
          inputMode="decimal"
          step={step}
          disabled={disabled}
          value={localText}
          onChange={(e) => handleChange(e.target.value)}
          placeholder={unit.placeholder ?? metricUnit.placeholder ?? ""}
          className={cn(
            "h-9 w-full bg-transparent px-2.5 text-sm font-semibold text-foreground placeholder:font-normal placeholder:text-muted-foreground focus:outline-none disabled:cursor-not-allowed disabled:opacity-50",
          )}
        />
        <span
          className={cn(
            "flex items-center pr-2 pl-1 text-xs font-bold uppercase tracking-wide",
            t.label,
          )}
        >
          {unit.label}
        </span>
      </div>

      {hint && (
        <p className="mt-0.5 text-xs text-muted-foreground leading-snug">
          {hint}
        </p>
      )}
      {belowInput}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Reusable unit presets — keep math centralized so all callers stay consistent.
// First entry of each list is the CANONICAL metric unit (state is stored in it).
// ─────────────────────────────────────────────────────────────────────────────

/** Cholesterol fractions: mg/dL ↔ mmol/L (factor 38.67). */
export const UNITS_CHOL: Unit[] = [
  { label: "mg/dL",  fromMetric: (v) => v,            toMetric: (v) => v,            precision: 0, placeholder: "85" },
  { label: "mmol/L", fromMetric: (v) => v / 38.67,    toMetric: (v) => v * 38.67,    precision: 2, placeholder: "2.2" },
];

/** ApoB: mg/dL ↔ g/L (factor 100). */
export const UNITS_APOB: Unit[] = [
  { label: "mg/dL", fromMetric: (v) => v,         toMetric: (v) => v,         precision: 0, placeholder: "70" },
  { label: "g/L",   fromMetric: (v) => v / 100,   toMetric: (v) => v * 100,   precision: 2, placeholder: "0.70" },
];

/** Lp(a): mg/dL ↔ nmol/L (factor 2.5, approximate). */
export const UNITS_LPA: Unit[] = [
  { label: "mg/dL",  fromMetric: (v) => v,          toMetric: (v) => v,          precision: 0, placeholder: "45" },
  { label: "nmol/L", fromMetric: (v) => v * 2.5,    toMetric: (v) => v / 2.5,    precision: 0, placeholder: "112" },
];

/** HbA1c: % (NGSP/DCCT) ↔ mmol/mol (IFCC). */
export const UNITS_HBA1C: Unit[] = [
  { label: "%",       fromMetric: (v) => v,                       toMetric: (v) => v,                       precision: 1, placeholder: "7.2" },
  { label: "mmol/mol", fromMetric: (v) => (v - 2.15) * 10.929,    toMetric: (v) => v / 10.929 + 2.15,        precision: 0, placeholder: "55" },
];

/** hs-CRP: mg/L ↔ mg/dL. */
export const UNITS_HSCRP: Unit[] = [
  { label: "mg/L",  fromMetric: (v) => v,        toMetric: (v) => v,        precision: 1, placeholder: "3.5" },
  { label: "mg/dL", fromMetric: (v) => v / 10,   toMetric: (v) => v * 10,   precision: 2, placeholder: "0.35" },
];

/** Creatinine: mg/dL ↔ µmol/L (factor 88.4). */
export const UNITS_CREAT: Unit[] = [
  { label: "mg/dL",  fromMetric: (v) => v,           toMetric: (v) => v,           precision: 2, placeholder: "1.2" },
  { label: "µmol/L", fromMetric: (v) => v * 88.4,    toMetric: (v) => v / 88.4,    precision: 0, placeholder: "106" },
];

/** Length (height/waist): cm ↔ in. */
export const UNITS_CM: Unit[] = [
  { label: "cm", fromMetric: (v) => v,          toMetric: (v) => v,          precision: 1, placeholder: "170" },
  { label: "in", fromMetric: (v) => v / 2.54,   toMetric: (v) => v * 2.54,   precision: 1, placeholder: "67" },
];

/** Weight: kg ↔ lb. */
export const UNITS_KG: Unit[] = [
  { label: "kg", fromMetric: (v) => v,            toMetric: (v) => v,            precision: 1, placeholder: "75" },
  { label: "lb", fromMetric: (v) => v * 2.2046,   toMetric: (v) => v / 2.2046,   precision: 1, placeholder: "165" },
];

/** Blood pressure (mmHg ↔ kPa). */
export const UNITS_MMHG: Unit[] = [
  { label: "mmHg", fromMetric: (v) => v,            toMetric: (v) => v,            precision: 0, placeholder: "130" },
  { label: "kPa",  fromMetric: (v) => v * 0.13332,  toMetric: (v) => v / 0.13332,  precision: 2, placeholder: "17.3" },
];

/** eGFR — single unit (no clinical alt). */
export const UNITS_EGFR: Unit[] = [
  { label: "mL/min/1.73m²", fromMetric: (v) => v, toMetric: (v) => v, precision: 0, placeholder: "90" },
];

