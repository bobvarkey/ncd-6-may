import { Check } from "lucide-react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export type TriStateValue = "yes" | "no" | "unknown";

const LABELS: Record<TriStateValue, string> = {
  yes: "Yes",
  no: "No",
  unknown: "Unknown",
};

const ORDER: TriStateValue[] = ["unknown", "yes", "no"];

interface TriStateToggleProps {
  id?: string;
  label: string;
  help?: string;
  value: TriStateValue;
  onChange: (v: TriStateValue) => void;
  required?: boolean;
}

export function TriStateToggle({
  id,
  label,
  help,
  value,
  onChange,
  required,
}: TriStateToggleProps) {
  return (
    <div className="space-y-1.5 sm:space-y-2">
      <Label className="text-xs sm:text-sm font-medium leading-tight block" htmlFor={id}>
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      <div className="flex flex-wrap gap-1.5 sm:gap-2" id={id} role="group" aria-label={label}>
        {ORDER.map((opt) => {
          const selected = value === opt;
          return (
            <button
              key={opt}
              type="button"
              onClick={() => onChange(opt)}
              aria-pressed={selected}
              className={cn(
                "inline-flex items-center gap-1 sm:gap-1.5 rounded-full px-3 py-1.5 text-xs sm:px-4 sm:py-2 sm:text-sm font-medium transition-colors",
                selected
                  ? "bg-[#e91e63] text-white shadow-sm"
                  : "bg-[#fff5f0] text-foreground hover:bg-[#ffe8dc]"
              )}
            >
              {selected && <Check className="h-3 w-3 sm:h-3.5 sm:w-3.5" />}
              {LABELS[opt]}
            </button>
          );
        })}
      </div>
      {help && <p className="text-[11px] sm:text-xs text-muted-foreground leading-tight">{help}</p>}
    </div>
  );
}
