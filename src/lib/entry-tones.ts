import type { LabTone } from "@/components/ui/lab-input";

/**
 * Shared colour treatments for homepage entry tabs/tiles.
 * Reuses the clinical LabTone palette (lab-input / risk-factor chips).
 * Labels and icons carry meaning — colour is a secondary cue.
 */
export type EntryTone = LabTone;

export type EntryToneClasses = {
  /** Tinted surface + coloured border, including hover. */
  card: string;
  /** Top accent stripe. */
  bar: string;
  /** Icon chip: solid hue, white glyph (WCAG-ish on the chip). */
  iconWrap: string;
  /** Title colour on hover. */
  titleHover: string;
  /** Outline badge. */
  badge: string;
  /** Compact shortcut tile (Quick Access). */
  shortcut: string;
  /** Topic TabsTrigger idle + selected. */
  tab: string;
};

export const ENTRY_TONES: Record<EntryTone, EntryToneClasses> = {
  rose: {
    card: "border-rose-500/35 bg-rose-500/10 hover:border-rose-400/70 hover:bg-rose-500/18 hover:shadow-md",
    bar: "bg-rose-500",
    iconWrap: "bg-rose-500 text-white shadow-sm",
    titleHover: "group-hover:text-rose-600 dark:group-hover:text-rose-300",
    badge: "border-rose-500/40 text-rose-700 dark:text-rose-300",
    shortcut: "border-rose-500/30 bg-rose-500/10 hover:border-rose-400/60 hover:bg-rose-500/18 hover:shadow-sm",
    tab: "bg-rose-500/15 text-rose-800 dark:text-rose-200 hover:bg-rose-500/25 data-[state=active]:bg-rose-500 data-[state=active]:text-white data-[state=active]:shadow-sm",
  },
  amber: {
    card: "border-amber-500/35 bg-amber-500/10 hover:border-amber-400/70 hover:bg-amber-500/18 hover:shadow-md",
    bar: "bg-amber-500",
    iconWrap: "bg-amber-500 text-white shadow-sm",
    titleHover: "group-hover:text-amber-700 dark:group-hover:text-amber-300",
    badge: "border-amber-500/40 text-amber-800 dark:text-amber-300",
    shortcut: "border-amber-500/30 bg-amber-500/10 hover:border-amber-400/60 hover:bg-amber-500/18 hover:shadow-sm",
    tab: "bg-amber-500/15 text-amber-900 dark:text-amber-200 hover:bg-amber-500/25 data-[state=active]:bg-amber-500 data-[state=active]:text-white data-[state=active]:shadow-sm",
  },
  violet: {
    card: "border-violet-500/35 bg-violet-500/10 hover:border-violet-400/70 hover:bg-violet-500/18 hover:shadow-md",
    bar: "bg-violet-500",
    iconWrap: "bg-violet-500 text-white shadow-sm",
    titleHover: "group-hover:text-violet-600 dark:group-hover:text-violet-300",
    badge: "border-violet-500/40 text-violet-700 dark:text-violet-300",
    shortcut: "border-violet-500/30 bg-violet-500/10 hover:border-violet-400/60 hover:bg-violet-500/18 hover:shadow-sm",
    tab: "bg-violet-500/15 text-violet-800 dark:text-violet-200 hover:bg-violet-500/25 data-[state=active]:bg-violet-500 data-[state=active]:text-white data-[state=active]:shadow-sm",
  },
  emerald: {
    card: "border-emerald-500/35 bg-emerald-500/10 hover:border-emerald-400/70 hover:bg-emerald-500/18 hover:shadow-md",
    bar: "bg-emerald-500",
    iconWrap: "bg-emerald-600 text-white shadow-sm",
    titleHover: "group-hover:text-emerald-700 dark:group-hover:text-emerald-300",
    badge: "border-emerald-500/40 text-emerald-700 dark:text-emerald-300",
    shortcut: "border-emerald-500/30 bg-emerald-500/10 hover:border-emerald-400/60 hover:bg-emerald-500/18 hover:shadow-sm",
    tab: "bg-emerald-500/15 text-emerald-900 dark:text-emerald-200 hover:bg-emerald-500/25 data-[state=active]:bg-emerald-600 data-[state=active]:text-white data-[state=active]:shadow-sm",
  },
  sky: {
    card: "border-sky-500/35 bg-sky-500/10 hover:border-sky-400/70 hover:bg-sky-500/18 hover:shadow-md",
    bar: "bg-sky-500",
    iconWrap: "bg-sky-500 text-white shadow-sm",
    titleHover: "group-hover:text-sky-700 dark:group-hover:text-sky-300",
    badge: "border-sky-500/40 text-sky-700 dark:text-sky-300",
    shortcut: "border-sky-500/30 bg-sky-500/10 hover:border-sky-400/60 hover:bg-sky-500/18 hover:shadow-sm",
    tab: "bg-sky-500/15 text-sky-900 dark:text-sky-200 hover:bg-sky-500/25 data-[state=active]:bg-sky-500 data-[state=active]:text-white data-[state=active]:shadow-sm",
  },
  indigo: {
    card: "border-indigo-500/35 bg-indigo-500/10 hover:border-indigo-400/70 hover:bg-indigo-500/18 hover:shadow-md",
    bar: "bg-indigo-500",
    iconWrap: "bg-indigo-500 text-white shadow-sm",
    titleHover: "group-hover:text-indigo-600 dark:group-hover:text-indigo-300",
    badge: "border-indigo-500/40 text-indigo-700 dark:text-indigo-300",
    shortcut: "border-indigo-500/30 bg-indigo-500/10 hover:border-indigo-400/60 hover:bg-indigo-500/18 hover:shadow-sm",
    tab: "bg-indigo-500/15 text-indigo-800 dark:text-indigo-200 hover:bg-indigo-500/25 data-[state=active]:bg-indigo-500 data-[state=active]:text-white data-[state=active]:shadow-sm",
  },
  fuchsia: {
    card: "border-fuchsia-500/35 bg-fuchsia-500/10 hover:border-fuchsia-400/70 hover:bg-fuchsia-500/18 hover:shadow-md",
    bar: "bg-fuchsia-500",
    iconWrap: "bg-fuchsia-500 text-white shadow-sm",
    titleHover: "group-hover:text-fuchsia-600 dark:group-hover:text-fuchsia-300",
    badge: "border-fuchsia-500/40 text-fuchsia-700 dark:text-fuchsia-300",
    shortcut: "border-fuchsia-500/30 bg-fuchsia-500/10 hover:border-fuchsia-400/60 hover:bg-fuchsia-500/18 hover:shadow-sm",
    tab: "bg-fuchsia-500/15 text-fuchsia-800 dark:text-fuchsia-200 hover:bg-fuchsia-500/25 data-[state=active]:bg-fuchsia-500 data-[state=active]:text-white data-[state=active]:shadow-sm",
  },
  teal: {
    card: "border-teal-500/35 bg-teal-500/10 hover:border-teal-400/70 hover:bg-teal-500/18 hover:shadow-md",
    bar: "bg-teal-500",
    iconWrap: "bg-teal-600 text-white shadow-sm",
    titleHover: "group-hover:text-teal-700 dark:group-hover:text-teal-300",
    badge: "border-teal-500/40 text-teal-800 dark:text-teal-300",
    shortcut: "border-teal-500/30 bg-teal-500/10 hover:border-teal-400/60 hover:bg-teal-500/18 hover:shadow-sm",
    tab: "bg-teal-500/15 text-teal-900 dark:text-teal-200 hover:bg-teal-500/25 data-[state=active]:bg-teal-600 data-[state=active]:text-white data-[state=active]:shadow-sm",
  },
  orange: {
    card: "border-orange-500/35 bg-orange-500/10 hover:border-orange-400/70 hover:bg-orange-500/18 hover:shadow-md",
    bar: "bg-orange-500",
    iconWrap: "bg-orange-500 text-white shadow-sm",
    titleHover: "group-hover:text-orange-700 dark:group-hover:text-orange-300",
    badge: "border-orange-500/40 text-orange-800 dark:text-orange-300",
    shortcut: "border-orange-500/30 bg-orange-500/10 hover:border-orange-400/60 hover:bg-orange-500/18 hover:shadow-sm",
    tab: "bg-orange-500/15 text-orange-900 dark:text-orange-200 hover:bg-orange-500/25 data-[state=active]:bg-orange-500 data-[state=active]:text-white data-[state=active]:shadow-sm",
  },
  lime: {
    card: "border-lime-500/40 bg-lime-500/10 hover:border-lime-400/70 hover:bg-lime-500/18 hover:shadow-md",
    bar: "bg-lime-500",
    iconWrap: "bg-lime-600 text-white shadow-sm",
    titleHover: "group-hover:text-lime-700 dark:group-hover:text-lime-300",
    badge: "border-lime-500/40 text-lime-800 dark:text-lime-300",
    shortcut: "border-lime-500/35 bg-lime-500/10 hover:border-lime-400/60 hover:bg-lime-500/18 hover:shadow-sm",
    tab: "bg-lime-500/15 text-lime-900 dark:text-lime-200 hover:bg-lime-500/25 data-[state=active]:bg-lime-600 data-[state=active]:text-white data-[state=active]:shadow-sm",
  },
  cyan: {
    card: "border-cyan-500/35 bg-cyan-500/10 hover:border-cyan-400/70 hover:bg-cyan-500/18 hover:shadow-md",
    bar: "bg-cyan-500",
    iconWrap: "bg-cyan-600 text-white shadow-sm",
    titleHover: "group-hover:text-cyan-700 dark:group-hover:text-cyan-300",
    badge: "border-cyan-500/40 text-cyan-800 dark:text-cyan-300",
    shortcut: "border-cyan-500/30 bg-cyan-500/10 hover:border-cyan-400/60 hover:bg-cyan-500/18 hover:shadow-sm",
    tab: "bg-cyan-500/15 text-cyan-900 dark:text-cyan-200 hover:bg-cyan-500/25 data-[state=active]:bg-cyan-600 data-[state=active]:text-white data-[state=active]:shadow-sm",
  },
  slate: {
    card: "border-slate-400/40 bg-slate-500/10 hover:border-slate-400/70 hover:bg-slate-500/18 hover:shadow-md",
    bar: "bg-slate-500",
    iconWrap: "bg-slate-500 text-white shadow-sm",
    titleHover: "group-hover:text-slate-700 dark:group-hover:text-slate-200",
    badge: "border-slate-400/40 text-slate-700 dark:text-slate-300",
    shortcut: "border-slate-400/35 bg-slate-500/10 hover:border-slate-400/60 hover:bg-slate-500/18 hover:shadow-sm",
    tab: "bg-slate-500/15 text-slate-800 dark:text-slate-200 hover:bg-slate-500/25 data-[state=active]:bg-slate-600 data-[state=active]:text-white data-[state=active]:shadow-sm",
  },
};
