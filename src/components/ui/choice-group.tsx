import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

/**
 * Accessible single-select button group used by the clinical mini apps.
 */
export function ChoiceGroup<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label?: string;
  value: T | null;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
}) {
  return (
    <div className="space-y-1.5">
      {label ? <Label className="text-xs">{label}</Label> : null}
      <div className="flex flex-wrap gap-2" role="group" aria-label={label ?? "Options"}>
        {options.map((option) => {
          const selected = value === option.value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              aria-pressed={selected}
              className={cn(
                "rounded-lg border px-3 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                selected
                  ? "border-primary bg-primary text-primary-foreground shadow-sm"
                  : "border-border bg-card text-foreground hover:bg-muted/40",
              )}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
