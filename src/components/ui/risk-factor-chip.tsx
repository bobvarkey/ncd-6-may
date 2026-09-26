import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import type { LabTone } from "@/components/ui/lab-input";

/**
 * RiskFactorChip — colorful, icon-led checkbox card for risk factors,
 * modifiers, and clinical features. Each chip carries a semantic tone
 * so a long checklist becomes scannable at a glance.
 *
 * State stays where the caller wants it; this is purely presentational.
 */

const TONE: Record<
  LabTone,
  { bar: string; iconBg: string; iconText: string; ringOn: string; bgOn: string; labelOn: string }
> = {
  rose:    { bar: "bg-[hsl(346_77%_55%)]",  iconBg: "bg-[hsl(346_77%_55%)]/12",  iconText: "text-[hsl(346_77%_45%)]",  ringOn: "ring-[hsl(346_77%_55%)]/40",  bgOn: "bg-[hsl(346_77%_55%)]/10",  labelOn: "text-[hsl(346_77%_35%)]" },
  amber:   { bar: "bg-[hsl(38_92%_50%)]",   iconBg: "bg-[hsl(38_92%_50%)]/15",   iconText: "text-[hsl(32_95%_42%)]",   ringOn: "ring-[hsl(38_92%_50%)]/40",   bgOn: "bg-[hsl(38_92%_50%)]/10",   labelOn: "text-[hsl(32_95%_32%)]" },
  violet:  { bar: "bg-[hsl(262_70%_58%)]",  iconBg: "bg-[hsl(262_70%_58%)]/12",  iconText: "text-[hsl(262_70%_48%)]",  ringOn: "ring-[hsl(262_70%_58%)]/40",  bgOn: "bg-[hsl(262_70%_58%)]/10",  labelOn: "text-[hsl(262_70%_38%)]" },
  emerald: { bar: "bg-[hsl(160_60%_40%)]",  iconBg: "bg-[hsl(160_60%_40%)]/12",  iconText: "text-[hsl(160_60%_32%)]",  ringOn: "ring-[hsl(160_60%_40%)]/40",  bgOn: "bg-[hsl(160_60%_40%)]/10",  labelOn: "text-[hsl(160_60%_25%)]" },
  sky:     { bar: "bg-[hsl(199_89%_48%)]",  iconBg: "bg-[hsl(199_89%_48%)]/12",  iconText: "text-[hsl(199_89%_38%)]",  ringOn: "ring-[hsl(199_89%_48%)]/40",  bgOn: "bg-[hsl(199_89%_48%)]/10",  labelOn: "text-[hsl(199_89%_30%)]" },
  indigo:  { bar: "bg-[hsl(245_70%_58%)]",  iconBg: "bg-[hsl(245_70%_58%)]/12",  iconText: "text-[hsl(245_70%_48%)]",  ringOn: "ring-[hsl(245_70%_58%)]/40",  bgOn: "bg-[hsl(245_70%_58%)]/10",  labelOn: "text-[hsl(245_70%_38%)]" },
  fuchsia: { bar: "bg-[hsl(292_84%_55%)]",  iconBg: "bg-[hsl(292_84%_55%)]/12",  iconText: "text-[hsl(292_84%_45%)]",  ringOn: "ring-[hsl(292_84%_55%)]/40",  bgOn: "bg-[hsl(292_84%_55%)]/10",  labelOn: "text-[hsl(292_84%_38%)]" },
  teal:    { bar: "bg-[hsl(178_70%_40%)]",  iconBg: "bg-[hsl(178_70%_40%)]/12",  iconText: "text-[hsl(178_70%_30%)]",  ringOn: "ring-[hsl(178_70%_40%)]/40",  bgOn: "bg-[hsl(178_70%_40%)]/10",  labelOn: "text-[hsl(178_70%_24%)]" },
  orange:  { bar: "bg-[hsl(20_90%_55%)]",   iconBg: "bg-[hsl(20_90%_55%)]/12",   iconText: "text-[hsl(20_90%_45%)]",   ringOn: "ring-[hsl(20_90%_55%)]/40",   bgOn: "bg-[hsl(20_90%_55%)]/10",   labelOn: "text-[hsl(20_90%_35%)]" },
  lime:    { bar: "bg-[hsl(85_65%_45%)]",   iconBg: "bg-[hsl(85_65%_45%)]/15",   iconText: "text-[hsl(85_65%_32%)]",   ringOn: "ring-[hsl(85_65%_45%)]/40",   bgOn: "bg-[hsl(85_65%_45%)]/10",   labelOn: "text-[hsl(85_65%_24%)]" },
  cyan:    { bar: "bg-[hsl(190_85%_45%)]",  iconBg: "bg-[hsl(190_85%_45%)]/12",  iconText: "text-[hsl(190_85%_35%)]",  ringOn: "ring-[hsl(190_85%_45%)]/40",  bgOn: "bg-[hsl(190_85%_45%)]/10",  labelOn: "text-[hsl(190_85%_28%)]" },
  slate:   { bar: "bg-[hsl(215_20%_50%)]",  iconBg: "bg-[hsl(215_20%_50%)]/15",  iconText: "text-[hsl(215_25%_35%)]",  ringOn: "ring-[hsl(215_20%_50%)]/40",  bgOn: "bg-[hsl(215_20%_50%)]/10",  labelOn: "text-foreground" },
};

interface RiskFactorChipProps {
  label: React.ReactNode;
  qualifier?: React.ReactNode;
  icon?: React.ReactNode;
  tone?: LabTone;
  checked: boolean;
  onToggle: () => void;
  disabled?: boolean;
  /** Visual size — "sm" used for nested sub-items. */
  size?: "md" | "sm";
  /** Override stripe color when checked vs unchecked feel. */
  className?: string;
  /** Slot rendered to the right of the label (e.g. an "auto" badge). */
  rightSlot?: React.ReactNode;
}

export function RiskFactorChip({
  label,
  qualifier,
  icon,
  tone = "slate",
  checked,
  onToggle,
  disabled,
  size = "md",
  className,
  rightSlot,
}: RiskFactorChipProps) {
  const t = TONE[tone];
  const isSm = size === "sm";

  return (
    <label
      className={cn(
        "group relative flex cursor-pointer items-stretch gap-0 overflow-hidden rounded-lg border bg-card transition-all",
        checked
          ? cn("border-transparent ring-1", t.ringOn, t.bgOn)
          : "border-border hover:bg-muted/40",
        disabled && "cursor-not-allowed opacity-60",
        className,
      )}
    >
      {/* Color stripe */}
      <span className={cn("w-1 shrink-0", t.bar)} aria-hidden />

      <div className={cn("flex flex-1 items-start gap-2.5", isSm ? "p-2" : "p-2.5")}>
        {icon && (
          <span
            className={cn(
              "flex shrink-0 items-center justify-center rounded-md",
              isSm ? "h-7 w-7" : "h-8 w-8",
              t.iconBg,
              t.iconText,
            )}
          >
            {icon}
          </span>
        )}

        <div className="flex-1 min-w-0 pt-0.5">
          <div className="flex items-start gap-2">
            <span
              className={cn(
                "flex-1 leading-snug font-medium",
                isSm ? "text-sm" : "text-sm",
                checked ? t.labelOn : "text-foreground",
              )}
            >
              {label}
            </span>
            {rightSlot}
          </div>
          {qualifier && (
            <p className={cn("mt-0.5 leading-snug text-muted-foreground", isSm ? "text-xs" : "text-xs")}>
              {qualifier}
            </p>
          )}
        </div>

        <Checkbox
          checked={checked}
          onCheckedChange={onToggle}
          disabled={disabled}
          className={cn("mt-1 shrink-0", isSm ? "h-3.5 w-3.5" : "h-4 w-4")}
          onClick={(e) => e.stopPropagation()}
        />
      </div>
    </label>
  );
}
