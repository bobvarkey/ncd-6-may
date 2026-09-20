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
    <div className="space-y-2">
      <Label className="text-sm font-medium" htmlFor={id}>
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      <div className="flex flex-wrap gap-2" id={id} role="group" aria-label={label}>
        {ORDER.map((opt) => {
          const selected = value === opt;
          return (
            <button
              key={opt}
              type="button"
              onClick={() => onChange(opt)}
              aria-pressed={selected}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-colors",
                selected
                  ? "bg-[#e91e63] text-white shadow-sm"
                  : "bg-[#fff5f0] text-foreground hover:bg-[#ffe8dc]"
              )}
            >
              {selected && <Check className="h-3.5 w-3.5" />}
              {LABELS[opt]}
            </button>
          );
        })}
      </div>
      {help && <p className="text-xs text-muted-foreground">{help}</p>}
    </div>
  );
}
