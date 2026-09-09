import { useMemo, useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { FlaskConical, ChevronDown, RotateCcw, AlertTriangle, CheckCircle2, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { parseClinicalValue, roundClinical } from "@/lib/clinical-utils";
import { useLabContext } from "@/components/SmartLabelUpload/GlobalLabContext";

// ─────────────────────────────────────────────────────────────────────────────
// Lab field definition
// ─────────────────────────────────────────────────────────────────────────────
interface LabField {
  key: string;
  label: string;
  unit: string;
  /** Reference range [low, high]; null = open-ended */
  refLow?: number;
  refHigh?: number;
  /** Optional derived calculation from other fields */
  derived?: (v: Record<string, number>) => { value: number; label: string; unit: string } | null;
  /** Optional interpretation note when abnormal */
  note?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Page → lab fields mapping
// ─────────────────────────────────────────────────────────────────────────────
const PAGE_LABS: Record<string, { title: string; fields: LabField[] }> = {
  "/lipids": {
    title: "Lipid Panel",
    fields: [
      { key: "ldl", label: "LDL-C", unit: "mg/dL", refHigh: 100, note: "Target <100 mg/dL (or <70 high risk)" },
      { key: "hdl", label: "HDL-C", unit: "mg/dL", refLow: 40, note: "Low HDL: <40 mg/dL (M), <50 (F)" },
      { key: "totalCholesterol", label: "Total Cholesterol", unit: "mg/dL", refHigh: 200 },
      { key: "triglycerides", label: "Triglycerides", unit: "mg/dL", refHigh: 150 },
      {
        key: "nonHdl",
        label: "Non-HDL-C",
        unit: "mg/dL",
        derived: (v) =>
          v.totalCholesterol !== undefined && v.hdl !== undefined
            ? { value: v.totalCholesterol - v.hdl, label: "Non-HDL-C", unit: "mg/dL" }
            : null,
        refHigh: 130,
        note: "Non-HDL = Total − HDL. Target <130 mg/dL (or <100 high risk)",
      },
    ],
  },
  "/diabetes": {
    title: "Diabetes / Glucose",
    fields: [
      { key: "hba1c", label: "HbA1c", unit: "%", refHigh: 6.5, note: "Target <7% (individualize)" },
      { key: "fastingGlucose", label: "Fasting Glucose", unit: "mg/dL", refHigh: 100, note: "≥126 mg/dL = diabetes" },
      { key: "postprandialGlucose", label: "Postprandial Glucose", unit: "mg/dL", refHigh: 140, note: "≥200 mg/dL = diabetes" },
    ],
  },
  "/hypertension": {
    title: "Hypertension / Renal",
    fields: [
      { key: "sbp", label: "Systolic BP", unit: "mmHg", refHigh: 130 },
      { key: "dbp", label: "Diastolic BP", unit: "mmHg", refHigh: 80 },
      { key: "potassium", label: "Potassium", unit: "mEq/L", refLow: 3.5, refHigh: 5.0, note: "Monitor with RAAS inhibitors" },
      { key: "creatinine", label: "Creatinine", unit: "mg/dL", refHigh: 1.2 },
      { key: "egfr", label: "eGFR", unit: "mL/min/1.73m²", refLow: 60, note: "<60 = CKD" },
    ],
  },
  "/anemia": {
    title: "Anemia / CBC",
    fields: [
      { key: "hgb", label: "Hemoglobin", unit: "g/dL", refLow: 13, note: "Anemia: <13 (M), <12 (F)" },
      { key: "mcv", label: "MCV", unit: "fL", refLow: 80, refHigh: 100, note: "Microcytic <80, macrocytic >100" },
      { key: "ferritin", label: "Ferritin", unit: "ng/mL", refLow: 30, note: "<30 = iron deficiency" },
      { key: "tsat", label: "TSAT", unit: "%", refLow: 20, note: "<20% = iron deficiency" },
    ],
  },
  "/iron-calculator": {
    title: "Iron Studies",
    fields: [
      { key: "ferritin", label: "Ferritin", unit: "ng/mL", refLow: 30 },
      { key: "serumIron", label: "Serum Iron", unit: "µg/dL", refLow: 60, refHigh: 170 },
      { key: "tibc", label: "TIBC", unit: "µg/dL", refLow: 250, refHigh: 450 },
      {
        key: "tsat",
        label: "TSAT",
        unit: "%",
        derived: (v) =>
          v.serumIron !== undefined && v.tibc !== undefined && v.tibc > 0
            ? { value: (v.serumIron / v.tibc) * 100, label: "TSAT", unit: "%" }
            : null,
        refLow: 20,
        note: "TSAT = Iron / TIBC × 100. <20% = iron deficiency",
      },
    ],
  },
  "/thyroid": {
    title: "Thyroid",
    fields: [
      { key: "tsh", label: "TSH", unit: "mIU/L", refLow: 0.4, refHigh: 4.0 },
      { key: "ft4", label: "Free T4", unit: "ng/dL", refLow: 0.8, refHigh: 1.8 },
      { key: "ft3", label: "Free T3", unit: "pg/mL", refLow: 2.3, refHigh: 4.2 },
    ],
  },
  "/renal-dosing": {
    title: "Renal Function",
    fields: [
      { key: "egfr", label: "eGFR", unit: "mL/min/1.73m²", refLow: 60, note: "<60 = CKD stage 3+" },
      { key: "creatinine", label: "Creatinine", unit: "mg/dL", refHigh: 1.2 },
      { key: "bun", label: "BUN", unit: "mg/dL", refHigh: 20 },
      { key: "potassium", label: "Potassium", unit: "mEq/L", refLow: 3.5, refHigh: 5.0 },
    ],
  },
  "/ckd-guideline": {
    title: "CKD / eGFR",
    fields: [
      { key: "egfr", label: "eGFR", unit: "mL/min/1.73m²", refLow: 60, note: "G1 ≥90, G2 60-89, G3a 45-59, G3b 30-44, G4 15-29, G5 <15" },
      { key: "creatinine", label: "Creatinine", unit: "mg/dL", refHigh: 1.2 },
      { key: "potassium", label: "Potassium", unit: "mEq/L", refLow: 3.5, refHigh: 5.0 },
    ],
  },
  "/electrolytes": {
    title: "Electrolytes",
    fields: [
      { key: "sodium", label: "Sodium", unit: "mEq/L", refLow: 135, refHigh: 145 },
      { key: "potassium", label: "Potassium", unit: "mEq/L", refLow: 3.5, refHigh: 5.0 },
      { key: "calcium", label: "Calcium", unit: "mg/dL", refLow: 8.5, refHigh: 10.5 },
      { key: "magnesium", label: "Magnesium", unit: "mg/dL", refLow: 1.7, refHigh: 2.2 },
      { key: "phosphate", label: "Phosphate", unit: "mg/dL", refLow: 2.5, refHigh: 4.5 },
    ],
  },
  "/hyponatremia": {
    title: "Sodium",
    fields: [
      { key: "sodium", label: "Sodium", unit: "mEq/L", refLow: 135, refHigh: 145, note: "<135 hyponatremia, <120 severe" },
      { key: "potassium", label: "Potassium", unit: "mEq/L", refLow: 3.5, refHigh: 5.0 },
    ],
  },
  "/hypernatremia": {
    title: "Sodium",
    fields: [
      { key: "sodium", label: "Sodium", unit: "mEq/L", refLow: 135, refHigh: 145, note: ">145 hypernatremia" },
    ],
  },
  "/hyperkalemia": {
    title: "Potassium",
    fields: [
      { key: "potassium", label: "Potassium", unit: "mEq/L", refLow: 3.5, refHigh: 5.0, note: ">5.0 hyperkalemia, >6.0 severe" },
      { key: "egfr", label: "eGFR", unit: "mL/min/1.73m²", refLow: 60 },
    ],
  },
  "/hypokalemia": {
    title: "Potassium",
    fields: [
      { key: "potassium", label: "Potassium", unit: "mEq/L", refLow: 3.5, refHigh: 5.0, note: "<3.5 hypokalemia, <2.5 severe" },
    ],
  },
  "/hypocalcemia": {
    title: "Calcium",
    fields: [
      { key: "calcium", label: "Calcium", unit: "mg/dL", refLow: 8.5, refHigh: 10.5, note: "<8.5 hypocalcemia" },
      { key: "albumin", label: "Albumin", unit: "g/dL", refLow: 3.5, refHigh: 5.0 },
      {
        key: "correctedCalcium",
        label: "Corrected Ca",
        unit: "mg/dL",
        derived: (v) =>
          v.calcium !== undefined && v.albumin !== undefined
            ? { value: v.calcium + 0.8 * (4 - v.albumin), label: "Corrected Ca", unit: "mg/dL" }
            : null,
        note: "Corrected Ca = Ca + 0.8 × (4 − albumin)",
      },
    ],
  },
  "/hypercalcemia": {
    title: "Calcium",
    fields: [
      { key: "calcium", label: "Calcium", unit: "mg/dL", refLow: 8.5, refHigh: 10.5, note: ">10.5 hypercalcemia, >14 severe" },
    ],
  },
  "/hypomagnesemia": {
    title: "Magnesium",
    fields: [
      { key: "magnesium", label: "Magnesium", unit: "mg/dL", refLow: 1.7, refHigh: 2.2, note: "<1.7 hypomagnesemia" },
    ],
  },
  "/hypermagnesemia": {
    title: "Magnesium",
    fields: [
      { key: "magnesium", label: "Magnesium", unit: "mg/dL", refLow: 1.7, refHigh: 2.2, note: ">2.2 hypermagnesemia" },
    ],
  },
  "/hypophosphatemia": {
    title: "Phosphate",
    fields: [
      { key: "phosphate", label: "Phosphate", unit: "mg/dL", refLow: 2.5, refHigh: 4.5, note: "<2.5 hypophosphatemia" },
    ],
  },
  "/hyperphosphatemia": {
    title: "Phosphate",
    fields: [
      { key: "phosphate", label: "Phosphate", unit: "mg/dL", refLow: 2.5, refHigh: 4.5, note: ">4.5 hyperphosphatemia" },
      { key: "egfr", label: "eGFR", unit: "mL/min/1.73m²", refLow: 60 },
    ],
  },
  "/acid-base": {
    title: "Acid-Base / ABG",
    fields: [
      { key: "ph", label: "pH", unit: "", refLow: 7.35, refHigh: 7.45 },
      { key: "pco2", label: "pCO₂", unit: "mmHg", refLow: 35, refHigh: 45 },
      { key: "hco3", label: "HCO₃⁻", unit: "mEq/L", refLow: 22, refHigh: 28 },
      {
        key: "anionGap",
        label: "Anion Gap",
        unit: "mEq/L",
        derived: (v) =>
          v.sodium !== undefined && v.hco3 !== undefined && v.chloride !== undefined
            ? { value: v.sodium - (v.chloride + v.hco3), label: "Anion Gap", unit: "mEq/L" }
            : null,
        refHigh: 12,
        note: "AG = Na − (Cl + HCO₃). Normal 8-12",
      },
    ],
  },
  "/hyperglycemic-emergency": {
    title: "Hyperglycemic Emergency",
    fields: [
      { key: "glucose", label: "Glucose", unit: "mg/dL", refHigh: 180, note: "DKA/HHS: usually >250" },
      { key: "hba1c", label: "HbA1c", unit: "%", refHigh: 6.5 },
      { key: "potassium", label: "Potassium", unit: "mEq/L", refLow: 3.5, refHigh: 5.0 },
      { key: "bicarb", label: "Bicarbonate", unit: "mEq/L", refLow: 22, refHigh: 28, note: "DKA: <18" },
    ],
  },
  "/vitamin-d": {
    title: "Vitamin D",
    fields: [
      { key: "vitaminD", label: "25-OH Vitamin D", unit: "ng/mL", refLow: 30, note: "<20 deficient, 20-29 insufficient" },
      { key: "calcium", label: "Calcium", unit: "mg/dL", refLow: 8.5, refHigh: 10.5 },
    ],
  },
  "/fatigue": {
    title: "Fatigue Workup",
    fields: [
      { key: "hgb", label: "Hemoglobin", unit: "g/dL", refLow: 13 },
      { key: "tsh", label: "TSH", unit: "mIU/L", refLow: 0.4, refHigh: 4.0 },
      { key: "ferritin", label: "Ferritin", unit: "ng/mL", refLow: 30 },
      { key: "vitaminD", label: "Vitamin D", unit: "ng/mL", refLow: 30 },
    ],
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────
export function LabAutoCalculator() {
  const location = useLocation();
  const { parsedValues } = useLabContext();

  // Find the config for the current path (exact or prefix match)
  const config = useMemo(() => {
    const path = location.pathname;
    if (PAGE_LABS[path]) return PAGE_LABS[path];
    // prefix match for nested routes like /lipids/assessment
    const match = Object.keys(PAGE_LABS)
      .filter((k) => k !== "/" && path.startsWith(k))
      .sort((a, b) => b.length - a.length)[0];
    return match ? PAGE_LABS[match] : null;
  }, [location.pathname]);

  const [values, setValues] = useState<Record<string, string>>({});
  const [open, setOpen] = useState(false);

  // Prefill from global lab context when available
  useEffect(() => {
    if (!config || !parsedValues) return;
    setValues((prev) => {
      const next = { ...prev };
      let changed = false;
      for (const f of config.fields) {
        const v = parsedValues[f.key];
        if (v && next[f.key] === undefined) {
          next[f.key] = v;
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [config, parsedValues]);

  if (!config) return null;

  const numeric = useMemo(() => {
    const out: Record<string, number> = {};
    for (const [k, v] of Object.entries(values)) {
      const n = parseClinicalValue(v);
      if (n !== null) out[k] = n;
    }
    return out;
  }, [values]);

  const setField = (key: string, v: string) => setValues((prev) => ({ ...prev, [key]: v }));

  const reset = () => setValues({});

  const abnormalCount = useMemo(() => {
    let count = 0;
    for (const f of config.fields) {
      const n = numeric[f.key];
      if (n === undefined) continue;
      if (f.refLow !== undefined && n < f.refLow) count++;
      if (f.refHigh !== undefined && n > f.refHigh) count++;
    }
    return count;
  }, [config, numeric]);

  return (
    <Card className="mb-4 border-primary/20 bg-card/95 shadow-sm">
      <Collapsible open={open} onOpenChange={setOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer select-none py-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
                  <FlaskConical className="h-4 w-4" />
                </span>
                <CardTitle className="text-sm font-semibold">Lab Auto-Calculator · {config.title}</CardTitle>
                {abnormalCount > 0 && (
                  <Badge variant="destructive" className="text-[10px]">
                    {abnormalCount} abnormal
                  </Badge>
                )}
              </div>
              <ChevronDown className={cn("h-4 w-4 transition-transform", open && "rotate-180")} />
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="pt-0">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {config.fields.map((f) => {
                const n = numeric[f.key];
                const derived = f.derived ? f.derived(numeric) : null;
                const displayVal = derived ? derived.value : n;
                const abnormal =
                  displayVal !== undefined &&
                  ((f.refLow !== undefined && displayVal < f.refLow) ||
                    (f.refHigh !== undefined && displayVal > f.refHigh));

                return (
                  <div key={f.key} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-medium text-muted-foreground">
                        {f.label} <span className="text-[10px] text-muted-foreground/70">({f.unit})</span>
                      </label>
                      {abnormal && <AlertTriangle className="h-3.5 w-3.5 text-destructive" />}
                      {displayVal !== undefined && !abnormal && (
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                      )}
                    </div>
                    {derived ? (
                      <div className="flex h-9 items-center rounded-md border border-primary/30 bg-primary/5 px-3 text-sm font-semibold text-primary">
                        {roundClinical(derived.value)} {derived.unit}
                        <span className="ml-1 text-[9px] font-normal uppercase text-muted-foreground">auto</span>
                      </div>
                    ) : (
                      <Input
                        type="number"
                        value={values[f.key] ?? ""}
                        onChange={(e) => setField(f.key, e.target.value)}
                        placeholder={f.refLow !== undefined ? `${f.refLow}-${f.refHigh ?? "∞"}` : "Enter value"}
                        className={cn("h-9", abnormal && "border-destructive focus-visible:ring-destructive/40")}
                      />
                    )}
                    {f.note && (
                      <p className="flex items-start gap-1 text-[10px] leading-tight text-muted-foreground">
                        <Info className="mt-0.5 h-3 w-3 shrink-0" />
                        {f.note}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="mt-3 flex items-center justify-between">
              <p className="text-[10px] text-muted-foreground">
                Reference ranges are general adult values; interpret in clinical context.
              </p>
              <Button variant="ghost" size="sm" onClick={reset} className="h-7 text-xs">
                <RotateCcw className="mr-1 h-3 w-3" /> Reset
              </Button>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
