import { cn } from "@/lib/utils";

/**
 * Normalize a free-form frequency / dose string into a canonical
 * dosing-frequency tag suitable for an inline badge.
 *
 * Recognized tags: OD, BD, TDS, QID, Q6H, Q8H, Q12H, Q24H,
 * Weekly, Monthly, PRN, IV, —
 */
export function normalizeFrequency(input?: string | null): string {
  if (!input) return "—";
  const s = String(input).toLowerCase();

  // Explicit interval shorthand first ("q8h", "q 12 h", "q6-8h", "q24h")
  const qMatch = s.match(/q\s*(\d+)(?:\s*[-–to]+\s*\d+)?\s*h/);
  if (qMatch) {
    const n = parseInt(qMatch[1], 10);
    if (n === 24) return "OD";
    if (n === 12) return "BD";
    if (n === 8) return "TDS";
    if (n === 6) return "QID";
    return `Q${n}H`;
  }

  if (/\b(qds|qid|four\s*times)\b/.test(s)) return "QID";
  if (/\b(tds|tid|three\s*times|thrice)\b/.test(s)) return "TDS";
  if (/\b(bd|bid|twice|two\s*times|b\.i\.d)\b/.test(s)) return "BD";
  if (/\b(od|once\s*daily|once\s*a?\s*day|daily|every\s*morning|every\s*evening|bedtime|o\.d|qd)\b/.test(s)) return "OD";
  if (/\b(weekly|once\s*a?\s*week|every\s*week)\b/.test(s)) return "Weekly";
  if (/\b(monthly|every\s*month)\b/.test(s)) return "Monthly";
  if (/\b(prn|as\s*needed|when\s*required)\b/.test(s)) return "PRN";
  if (/\b(infusion|drip|iv)\b/.test(s)) return "IV";

  // Already a short tag (OD/BD/TDS/etc.) — return uppercase trimmed token
  const token = s.trim().split(/[\s,/(]/)[0];
  if (/^(od|bd|tds|qid|prn)$/i.test(token)) return token.toUpperCase();

  return input.length > 12 ? input.slice(0, 12) + "…" : input;
}

const TONES: Record<string, string> = {
  OD: "bg-primary/15 text-primary border-primary/30",
  BD: "bg-accent/20 text-accent-foreground border-accent/40",
  TDS: "bg-warning/15 text-warning border-warning/30",
  QID: "bg-destructive/15 text-destructive border-destructive/30",
  Weekly: "bg-success/15 text-success border-success/30",
  Monthly: "bg-success/15 text-success border-success/30",
  PRN: "bg-muted text-muted-foreground border-border",
  IV: "bg-info/15 text-info border-info/30",
};

interface FrequencyBadgeProps {
  frequency?: string | null;
  className?: string;
  /** Show 📅 calendar prefix */
  withIcon?: boolean;
}

export function FrequencyBadge({ frequency, className, withIcon = false }: FrequencyBadgeProps) {
  const tag = normalizeFrequency(frequency);
  const tone = TONES[tag] ?? "bg-muted text-muted-foreground border-border";
  return (
    <span
      title={frequency ?? undefined}
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide leading-none",
        tone,
        className,
      )}
    >
      {withIcon && <span aria-hidden>📅</span>}
      {tag}
    </span>
  );
}

export default FrequencyBadge;
