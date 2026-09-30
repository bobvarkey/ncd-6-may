import { cn } from "@/lib/utils";
import { label } from "@/lib/osteo/logic";
import type { ReactNode } from "react";

export function Field({
  title,
  hint,
  children,
  className,
}: {
  title: string;
  hint?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <div className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        {title}
      </div>
      {hint ? <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{hint}</p> : null}
      <div className="mt-2">{children}</div>
    </div>
  );
}

const pillBase =
  "rounded-full px-3.5 py-1.5 text-sm font-medium transition-all duration-150 active:scale-[0.98]";

export function PillRadio<T extends string>({
  options,
  value,
  onChange,
}: {
  options: readonly T[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => {
        const active = o === value;
        const isUnknownish = o === "unknown" || o === "not_assessed";
        return (
          <button
            key={o}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(o)}
            className={cn(
              pillBase,
              active
                ? isUnknownish
                  ? "bg-secondary text-secondary-foreground shadow-inner ring-1 ring-border"
                  : "bg-brand text-brand-foreground shadow-md"
                : "bg-card/60 text-muted-foreground ring-1 ring-border hover:bg-card hover:text-foreground",
            )}
          >
            {label(o)}
          </button>
        );
      })}
    </div>
  );
}

/**
 * Like PillRadio, but takes its labels from the caller. logic.ts's label() falls
 * back to humanising an unknown id — it would render the CKD ladder as "Ckd g4" —
 * and logic.ts is frozen, so the labels live with the option definitions instead.
 */
export function PillSelect<T extends string>({
  options,
  value,
  onChange,
  labels,
}: {
  options: readonly T[];
  value: T;
  onChange: (v: T) => void;
  labels: Record<T, string>;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => {
        const active = o === value;
        const isUnknownish = o === "unknown" || o === "not_assessed";
        return (
          <button
            key={o}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(o)}
            className={cn(
              pillBase,
              active
                ? isUnknownish
                  ? "bg-secondary text-secondary-foreground shadow-inner ring-1 ring-border"
                  : "bg-brand text-brand-foreground shadow-md"
                : "bg-card/60 text-muted-foreground ring-1 ring-border hover:bg-card hover:text-foreground",
            )}
          >
            {labels[o]}
          </button>
        );
      })}
    </div>
  );
}

export function PillMultiselect({
  options,
  value,
  onChange,
  exclusive,
}: {
  options: readonly string[];
  value: string[];
  onChange: (v: string[]) => void;
  exclusive?: string;
}) {
  const toggle = (o: string) => {
    if (exclusive && o === exclusive) {
      onChange(value.includes(o) ? [] : [o]);
      return;
    }
    // Ticking a normal option must clear the exclusive one, and vice versa, or the
    // two chips are shown active together and the engine sees the blocking
    // none_and_factors issue. Task 5 reconciles the same rule for values it
    // derives on its own (the frailty flag), which this component cannot see.
    const withoutExclusive = exclusive ? value.filter((v) => v !== exclusive) : value;
    onChange(
      withoutExclusive.includes(o)
        ? withoutExclusive.filter((v) => v !== o)
        : [...withoutExclusive, o],
    );
  };
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => {
        const active = value.includes(o);
        return (
          <button
            key={o}
            type="button"
            aria-pressed={active}
            onClick={() => toggle(o)}
            className={cn(
              pillBase,
              active
                ? o === exclusive
                  ? "bg-secondary text-secondary-foreground ring-1 ring-border"
                  : "bg-accent text-accent-foreground shadow-md"
                : "bg-card/60 text-muted-foreground ring-1 ring-border hover:bg-card hover:text-foreground",
            )}
          >
            {label(o)}
          </button>
        );
      })}
    </div>
  );
}

/**
 * A partially typed number ("-", "1e", "Infinity") must never reach the engine as
 * NaN. An empty entry means "not recorded", which the engine reads as unknown.
 * Out-of-domain values are returned as-is — the engine blocks them, it does not
 * want them clamped here.
 */
export function parseNumberInput(raw: string): number | null {
  if (raw.trim() === "") return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

export function NumberField({
  value,
  onChange,
  unit,
  placeholder,
  step,
}: {
  value: number | null;
  onChange: (v: number | null) => void;
  unit?: string;
  placeholder?: string;
  step?: string;
}) {
  return (
    <div className="flex max-w-[14rem] items-center gap-2 rounded-xl bg-card/70 px-3 py-2 ring-1 ring-border focus-within:ring-2 focus-within:ring-ring">
      <input
        type="number"
        inputMode="decimal"
        step={step ?? "any"}
        value={value === null ? "" : String(value)}
        placeholder={placeholder ?? "Blank = unknown"}
        onChange={(e) => onChange(parseNumberInput(e.target.value))}
        className="tabular w-full bg-transparent text-base font-medium outline-none placeholder:text-sm placeholder:font-normal placeholder:text-muted-foreground"
      />
      {unit ? <span className="shrink-0 text-xs text-muted-foreground">{unit}</span> : null}
    </div>
  );
}

export function TextField({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <input
      type="text"
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className="w-full max-w-md rounded-xl bg-card/70 px-3 py-2 text-sm ring-1 ring-border outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring"
    />
  );
}

export function DateField({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <input
      type="date"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="tabular rounded-xl bg-card/70 px-3 py-2 text-sm ring-1 ring-border outline-none focus:ring-2 focus:ring-ring"
    />
  );
}

export function Gate({
  index,
  title,
  purpose,
  children,
  delay = 0,
}: {
  index: string;
  title: string;
  purpose: string;
  children: ReactNode;
  delay?: number;
}) {
  return (
    <section
      className="animate-seat glass overflow-hidden rounded-3xl"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start gap-3 border-b border-border px-5 py-4">
        <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-brand to-accent font-heading text-sm font-bold text-primary-foreground shadow-md">
          {index}
        </span>
        <div>
          <h2 className="font-heading text-base font-bold tracking-tight">{title}</h2>
          <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{purpose}</p>
        </div>
      </div>
      <div className="space-y-5 px-5 py-5">{children}</div>
    </section>
  );
}

export function Conditional({ children }: { children: ReactNode }) {
  return (
    <div className="animate-seat rounded-2xl bg-mist/70 p-4 ring-1 ring-border">{children}</div>
  );
}
