import { useEffect, useState } from "react";
import { ArrowLeftRight, Info } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  heightFromFtIn,
  heightToFtIn,
  kgFromLb,
  lbFromKg,
  parsePositiveNumber,
  roundTo,
} from "@/lib/egfr-bsa";

type HeightUnit = "cm" | "ftin";
type WeightUnit = "kg" | "lb";

interface BsaAdjustmentFieldsProps {
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
  heightCm: string;
  weightKg: string;
  onHeightCmChange: (value: string) => void;
  onWeightKgChange: (value: string) => void;
  errors?: { height?: string; weight?: string };
  idPrefix?: string;
}

function readUnit<T extends string>(key: string, fallback: T): T {
  try {
    return (localStorage.getItem(key) as T) || fallback;
  } catch {
    return fallback;
  }
}

export function BsaAdjustmentFields({
  enabled,
  onEnabledChange,
  heightCm,
  weightKg,
  onHeightCmChange,
  onWeightKgChange,
  errors,
  idPrefix = "bsa",
}: BsaAdjustmentFieldsProps) {
  const [heightUnit, setHeightUnit] = useState<HeightUnit>(() => readUnit("ncd_gfr_height_unit", "cm"));
  const [weightUnit, setWeightUnit] = useState<WeightUnit>(() => readUnit("ncd_gfr_weight_unit", "kg"));
  const [feet, setFeet] = useState(() => {
    const cm = parsePositiveNumber(heightCm);
    if (cm === null) return "";
    return String(heightToFtIn(cm).feet);
  });
  const [inches, setInches] = useState(() => {
    const cm = parsePositiveNumber(heightCm);
    if (cm === null) return "";
    return roundTo(heightToFtIn(cm).inches, 1).toString();
  });
  const [weightDisplay, setWeightDisplay] = useState(() => {
    const kg = parsePositiveNumber(weightKg);
    if (kg === null) return "";
    return roundTo(lbFromKg(kg), 1).toString();
  });

  useEffect(() => {
    try {
      localStorage.setItem("ncd_gfr_height_unit", heightUnit);
    } catch {
      /* ignore */
    }
  }, [heightUnit]);

  useEffect(() => {
    try {
      localStorage.setItem("ncd_gfr_weight_unit", weightUnit);
    } catch {
      /* ignore */
    }
  }, [weightUnit]);

  // Keep imperial fields in sync when the parent clears values (Reset).
  useEffect(() => {
    if (!heightCm.trim()) {
      setFeet("");
      setInches("");
    }
  }, [heightCm]);

  useEffect(() => {
    if (!weightKg.trim()) setWeightDisplay("");
  }, [weightKg]);

  const toggleHeightUnit = () => {
    setHeightUnit((prev) => {
      const next = prev === "cm" ? "ftin" : "cm";
      if (next === "ftin") {
        const cm = parsePositiveNumber(heightCm);
        if (cm !== null) {
          const parsed = heightToFtIn(cm);
          setFeet(String(parsed.feet));
          setInches(roundTo(parsed.inches, 1).toString());
        }
      }
      return next;
    });
  };

  const toggleWeightUnit = () => {
    setWeightUnit((prev) => {
      const next = prev === "kg" ? "lb" : "kg";
      if (next === "lb") {
        const kg = parsePositiveNumber(weightKg);
        setWeightDisplay(kg === null ? "" : roundTo(lbFromKg(kg), 1).toString());
      }
      return next;
    });
  };

  const commitFtIn = (nextFeet: string, nextInches: string) => {
    setFeet(nextFeet);
    setInches(nextInches);
    const f = parsePositiveNumber(nextFeet) ?? 0;
    const i = parsePositiveNumber(nextInches) ?? 0;
    if (!nextFeet.trim() && !nextInches.trim()) {
      onHeightCmChange("");
      return;
    }
    onHeightCmChange(roundTo(heightFromFtIn(f, i), 1).toString());
  };

  const commitWeight = (raw: string) => {
    setWeightDisplay(raw);
    const n = parsePositiveNumber(raw);
    if (n === null) {
      onWeightKgChange(raw.trim() ? raw : "");
      return;
    }
    onWeightKgChange(weightUnit === "lb" ? roundTo(kgFromLb(n), 2).toString() : raw);
  };

  return (
    <div className="mt-4 p-3 rounded-lg bg-muted/30 border border-border/50">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <Switch
            id={`${idPrefix}-adjust`}
            checked={enabled}
            onCheckedChange={onEnabledChange}
            aria-describedby={`${idPrefix}-help`}
          />
          <Label htmlFor={`${idPrefix}-adjust`} className="text-sm font-medium cursor-pointer">
            Adjust eGFR for body surface area (BSA)
          </Label>
        </div>
      </div>
      <p id={`${idPrefix}-help`} className="mt-2 text-xs text-muted-foreground flex items-start gap-1.5">
        <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
        <span>
          Optional. CKD-EPI reports indexed eGFR in mL/min/1.73&nbsp;m². When enabled, Mosteller BSA
          is used to also show absolute (unindexed) eGFR in mL/min. KDIGO staging still uses the
          indexed value.
        </span>
      </p>

      {enabled && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor={`${idPrefix}-height`} className="text-sm font-medium">
                Height ({heightUnit === "cm" ? "cm" : "ft / in"})
              </Label>
              <button
                type="button"
                onClick={toggleHeightUnit}
                className="flex items-center gap-1 text-xs text-primary hover:underline font-medium"
              >
                <ArrowLeftRight className="h-3 w-3" />
                {heightUnit === "cm" ? "ft / in" : "cm"}
              </button>
            </div>
            {heightUnit === "cm" ? (
              <Input
                id={`${idPrefix}-height`}
                type="number"
                inputMode="decimal"
                step="0.1"
                min="50"
                max="250"
                placeholder="e.g. 170"
                value={heightCm}
                onChange={(e) => onHeightCmChange(e.target.value)}
                className={errors?.height ? "border-destructive" : ""}
                aria-invalid={Boolean(errors?.height)}
              />
            ) : (
              <div className="flex gap-2">
                <Input
                  id={`${idPrefix}-height`}
                  type="number"
                  inputMode="numeric"
                  min="1"
                  max="8"
                  placeholder="ft"
                  value={feet}
                  onChange={(e) => commitFtIn(e.target.value, inches)}
                  className={errors?.height ? "border-destructive" : ""}
                  aria-label="Height in feet"
                />
                <Input
                  id={`${idPrefix}-height-in`}
                  type="number"
                  inputMode="decimal"
                  step="0.1"
                  min="0"
                  max="11.9"
                  placeholder="in"
                  value={inches}
                  onChange={(e) => commitFtIn(feet, e.target.value)}
                  className={errors?.height ? "border-destructive" : ""}
                  aria-label="Height in inches"
                />
              </div>
            )}
            {errors?.height && <p className="text-xs text-destructive">{errors.height}</p>}
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor={`${idPrefix}-weight`} className="text-sm font-medium">
                Weight ({weightUnit === "kg" ? "kg" : "lb"})
              </Label>
              <button
                type="button"
                onClick={toggleWeightUnit}
                className="flex items-center gap-1 text-xs text-primary hover:underline font-medium"
              >
                <ArrowLeftRight className="h-3 w-3" />
                {weightUnit === "kg" ? "lb" : "kg"}
              </button>
            </div>
            <Input
              id={`${idPrefix}-weight`}
              type="number"
              inputMode="decimal"
              step="0.1"
              min="1"
              max={weightUnit === "kg" ? "300" : "660"}
              placeholder={weightUnit === "kg" ? "e.g. 70" : "e.g. 154"}
              value={weightUnit === "kg" ? weightKg : weightDisplay}
              onChange={(e) => commitWeight(e.target.value)}
              className={errors?.weight ? "border-destructive" : ""}
              aria-invalid={Boolean(errors?.weight)}
            />
            {errors?.weight && <p className="text-xs text-destructive">{errors.weight}</p>}
          </div>
        </div>
      )}
    </div>
  );
}
