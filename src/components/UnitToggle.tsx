import { Settings } from "lucide-react";

/**
 * Unit toggle component for US/Metric/SI switching
 * Persists to localStorage automatically
 */
import { useLocalStorage } from "@/hooks/useLocalStorage";

interface UnitToggleProps {
  /** Current calculator type */
  category: "glucose" | "weight" | "creatinine";
  /** Callback when unit changes */
  onChange?: (unit: string) => void;
}

export function UnitToggle({ category, onChange }: UnitToggleProps) {
  const [units, setUnits] = useLocalStorage<Record<string, string>>("ncd_preferred_units", {
    glucose: "mg/dL",
    weight: "kg",
    creatinine: "mg/dL",
  });
  
  const current = units[category] || "mg/dL";
  
  const cycle = () => {
    const options = category === "glucose" 
      ? ["mg/dL", "mmol/L"]
      : category === "weight"
        ? ["kg", "lbs"]
        : ["mg/dL", "µmol/L"];
    
    const idx = options.indexOf(current);
    const next = options[(idx + 1) % options.length];
    
    setUnits(prev => ({ ...prev, [category]: next as any }));
    onChange?.(next);
  };

  return (
    <button
      onClick={cycle}
      className="flex items-center gap-1.5 px-2 py-1 text-xs bg-muted/50 hover:bg-muted rounded-lg transition-colors border border-border"
      title={`Current: ${current}. Click to change.`}
    >
      <Settings className="h-3 w-3 text-muted-foreground" />
      <span className="font-medium">{current}</span>
    </button>
  );
}

/**
 * Format a value according to preferred unit system
 */
export function formatValue(
  value: number,
  category: "glucose" | "weight" | "creatinine",
  units: Record<string, string>
): string {
  const unit = units[category] || "mg/dL";
  
  if (category === "glucose") {
    if (unit === "mmol/L") {
      return (value * 0.0555).toFixed(1) + " mmol/L";
    }
    return value.toFixed(0) + " mg/dL";
  }
  
  if (category === "weight") {
    if (unit === "lbs") {
      return (value * 2.20462).toFixed(1) + " lbs";
    }
    return value.toFixed(1) + " kg";
  }
  
  if (category === "creatinine") {
    if (unit === "µmol/L") {
      return (value * 88.4).toFixed(0) + " µmol/L";
    }
    return value.toFixed(2) + " mg/dL";
  }
  
  return value.toString();
}