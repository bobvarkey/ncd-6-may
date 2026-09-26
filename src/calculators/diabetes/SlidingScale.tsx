import { useMemo, useState } from "react";
import { loadPatient } from "@/lib/patient-data";
import {
  evaluateSSI,
  SSIInput,
  CareSetting,
  NutritionStatus,
  DiabetesType,
  calculateSSIDoses,
  INSULIN_PRODUCTS,
  InsulinProduct,
  CorrectionScale,
} from "@/lib/sliding-scale-logic";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Activity, Syringe, Info, ShieldAlert, CheckCircle2 } from "lucide-react";

const sevColor: Record<string, string> = {
  critical: "bg-destructive/10 text-destructive border-destructive/30",
  high: "bg-destructive/10 text-destructive border-destructive/20",
  warning: "bg-warning/10 text-warning-foreground border-warning/30",
  info: "bg-info/10 text-info border-info/20",
};

const regimenLabel: Record<string, string> = {
  basal_bolus_correction: "Basal-Bolus + Correction",
  basal_plus_correction: "Basal + Correction (no scheduled prandial)",
  correction_only_exception: "Correction-only (exception)",
  iv_insulin_protocol: "IV Insulin Infusion Protocol",
  endocrinology_review: "Endocrinology Review",
};

export default function SlidingScaleInsulin() {
  const patient = loadPatient();

  const [input, setInput] = useState<SSIInput>({
    age_years: patient?.age ?? 60,
    weight_kg: patient?.weightKg ?? 75,
    diabetes_type: "type2",
    a1c_percent: patient?.hba1c,
    pregnant: false,
    care_setting: "ward",
    nutrition_status: "eating_regular",
    npo: false,
    egfr: patient?.eGFR ?? 75,
    dialysis: false,
    liver_failure: false,
    hemodynamic_instability: false,
    on_glucocorticoid: false,
    steroid_dose_pred_eq_mg: 0,
    procedure_planned_within_24h: false,
    basal_ordered: false,
    prandial_ordered: false,
    correction_ordered: true,
    sliding_scale_only: true,
    iv_insulin: false,
    total_daily_dose_units: 0,
    min_glucose: 95,
    max_glucose: 240,
    mean_glucose: 175,
    events_ge_180: 4,
    events_ge_250: 1,
    events_le_80: 0,
    events_le_70: 0,
  });

  const result = useMemo(() => evaluateSSI(input), [input]);

  const update = <K extends keyof SSIInput>(k: K, v: SSIInput[K]) =>
    setInput((s) => ({ ...s, [k]: v }));

  function handleSmartParse(values: Record<string, string>) {
    Object.entries(values).forEach(([key, value]) => {
      update(key as keyof SSIInput, value as any);
    });
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center gap-3">
        <Syringe className="h-7 w-7 text-primary" />
        <div>
          <h1 className="text-2xl font-heading font-bold">Sliding Scale Insulin — Decision Logic</h1>
          <p className="text-sm text-muted-foreground">
            Inpatient Glycemic Management CDS · ADA hospital glucose targets 140–180 mg/dL
          </p>
        </div>
      </div>

      <Card className="p-5 space-y-4">
        <h2 className="font-heading font-semibold flex items-center gap-2">
          <Activity className="h-4 w-4 text-primary" /> Patient & Encounter
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <Label>Age (yrs)</Label>
            <Input type="number" value={input.age_years} onChange={(e) => update("age_years", +e.target.value)} />
          </div>
          <div>
            <Label>Weight (kg)</Label>
            <Input type="number" value={input.weight_kg} onChange={(e) => update("weight_kg", +e.target.value)} />
          </div>
          <div>
            <Label>eGFR</Label>
            <Input type="number" value={input.egfr} onChange={(e) => update("egfr", +e.target.value)} />
          </div>
          <div>
            <Label>A1c %</Label>
            <Input type="number" step="0.1" value={input.a1c_percent ?? ""} onChange={(e) => update("a1c_percent", +e.target.value)} />
          </div>
          <div>
            <Label>Diabetes Type</Label>
            <Select value={input.diabetes_type} onValueChange={(v) => update("diabetes_type", v as DiabetesType)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="type1">Type 1</SelectItem>
                <SelectItem value="type2">Type 2</SelectItem>
                <SelectItem value="stress_hyperglycemia">Stress hyperglycemia</SelectItem>
                <SelectItem value="other">Other</SelectItem>
                <SelectItem value="unknown">Unknown</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Care setting</Label>
            <Select value={input.care_setting} onValueChange={(v) => update("care_setting", v as CareSetting)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ward">Ward</SelectItem>
                <SelectItem value="stepdown">Stepdown</SelectItem>
                <SelectItem value="icu">ICU</SelectItem>
                <SelectItem value="ed">ED</SelectItem>
                <SelectItem value="perioperative">Perioperative</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Nutrition</Label>
            <Select value={input.nutrition_status} onValueChange={(v) => update("nutrition_status", v as NutritionStatus)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="eating_regular">Eating regular</SelectItem>
                <SelectItem value="eating_poorly">Eating poorly</SelectItem>
                <SelectItem value="clear_liquids">Clear liquids</SelectItem>
                <SelectItem value="enteral_feeds">Enteral feeds</SelectItem>
                <SelectItem value="parenteral_nutrition">TPN</SelectItem>
                <SelectItem value="npo">NPO</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Home TDD (units, optional)</Label>
            <Input type="number" value={input.total_daily_dose_units || ""} onChange={(e) => update("total_daily_dose_units", +e.target.value)} />
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
          {[
            ["npo", "NPO"],
            ["dialysis", "Dialysis"],
            ["liver_failure", "Liver failure"],
            ["hemodynamic_instability", "Hemodynamic instability"],
            ["on_glucocorticoid", "On glucocorticoid"],
            ["pregnant", "Pregnant"],
            ["procedure_planned_within_24h", "Procedure <24h"],
            ["sliding_scale_only", "Currently SSI-only"],
            ["basal_ordered", "Basal ordered"],
            ["prandial_ordered", "Prandial ordered"],
          ].map(([key, label]) => (
            <label key={key} className="flex items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm">
              <span>{label}</span>
              <Switch
                checked={!!(input as any)[key]}
                onCheckedChange={(v) => update(key as keyof SSIInput, v as any)}
              />
            </label>
          ))}
        </div>
      </Card>

      <Card className="p-5 space-y-4">
        <h2 className="font-heading font-semibold">Glucose summary — last 24 h</h2>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
          <div>
            <Label>Min</Label>
            <Input type="number" value={input.min_glucose} onChange={(e) => update("min_glucose", +e.target.value)} />
          </div>
          <div>
            <Label>Max</Label>
            <Input type="number" value={input.max_glucose} onChange={(e) => update("max_glucose", +e.target.value)} />
          </div>
          <div>
            <Label>Mean</Label>
            <Input type="number" value={input.mean_glucose ?? 0} onChange={(e) => update("mean_glucose", +e.target.value)} />
          </div>
          <div>
            <Label>≥180</Label>
            <Input type="number" value={input.events_ge_180} onChange={(e) => update("events_ge_180", +e.target.value)} />
          </div>
          <div>
            <Label>≥250</Label>
            <Input type="number" value={input.events_ge_250} onChange={(e) => update("events_ge_250", +e.target.value)} />
          </div>
          <div>
            <Label>≤70</Label>
            <Input type="number" value={input.events_le_70} onChange={(e) => update("events_le_70", +e.target.value)} />
          </div>
        </div>
      </Card>

      {/* Recommendation */}
      <Card className="p-5 space-y-4 border-primary/30 bg-primary/5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="text-xs uppercase text-muted-foreground">Recommended regimen</div>
            <div className="text-xl font-heading font-bold text-primary">
              {regimenLabel[result.recommended_regimen]}
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Badge variant="secondary">TDD ≈ {result.tdd_estimate_units} U</Badge>
            <Badge variant="secondary">Scale: {result.recommended_scale.toUpperCase()}</Badge>
            {result.basal_units ? <Badge>Basal {result.basal_units} U</Badge> : null}
            {result.prandial_units_per_meal ? <Badge>Prandial {result.prandial_units_per_meal} U/meal</Badge> : null}
          </div>
        </div>
        <ul className="text-sm space-y-1">
          {result.rationale.map((r, i) => (
            <li key={i} className="flex gap-2"><CheckCircle2 className="h-4 w-4 text-success shrink-0 mt-0.5" />{r}</li>
          ))}
        </ul>
      </Card>

      {/* Alerts */}
      {result.alerts.length > 0 && (
        <Card className="p-5 space-y-3">
          <h2 className="font-heading font-semibold flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-destructive" /> Decision Alerts
          </h2>
          <div className="space-y-2">
            {result.alerts.map((a, i) => (
              <div key={i} className={`rounded-md border p-3 ${sevColor[a.severity]}`}>
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <AlertTriangle className="h-4 w-4" />
                  <span>{a.code}</span>
                  <Badge variant="outline" className="ml-auto text-xs">{a.severity}</Badge>
                </div>
                <div className="text-sm mt-1">{a.message}</div>
                <div className="text-xs mt-1 opacity-80"><strong>Action:</strong> {a.recommended_action}</div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Sliding Scale Table */}
      <Card className="p-5 space-y-3">
        <h2 className="font-heading font-semibold flex items-center gap-2">
          <Info className="h-4 w-4 text-primary" /> Subcutaneous Correction Scale (units rapid-acting)
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-muted">
                <th className="text-left p-2 border">BG (mg/dL)</th>
                <th className="p-2 border">Low (sensitive)</th>
                <th className="p-2 border">Medium (usual)</th>
                <th className="p-2 border">High (resistant)</th>
              </tr>
            </thead>
            <tbody>
              {result.scale_table.map((r) => {
                const cols: Array<keyof typeof r> = ["low", "medium", "high"];
                return (
                  <tr key={r.range}>
                    <td className="p-2 border font-medium">{r.range}</td>
                    {cols.map((c) => (
                      <td
                        key={c}
                        className={`p-2 border text-center ${
                          c === result.recommended_scale ? "bg-primary/10 font-bold text-primary" : ""
                        }`}
                      >
                        {r[c]}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-muted-foreground">
          Highlighted column = scale recommended for this patient. Give before meals & at bedtime (reduce bedtime by ~50%).
          Always pair with scheduled basal insulin in T1DM and most T2DM patients — SSI-alone is discouraged by ADA.
        </p>
      </Card>

      <SSIDoseCalculator
        weight_kg={input.weight_kg}
        age_years={input.age_years}
        egfr={input.egfr}
        npo={input.npo}
        on_glucocorticoid={!!input.on_glucocorticoid}
        steroid_dose_pred_eq_mg={input.steroid_dose_pred_eq_mg}
        diabetes_type={input.diabetes_type}
        dialysis={input.dialysis}
        liver_failure={input.liver_failure}
        total_daily_dose_units={input.total_daily_dose_units}
        min_glucose={input.min_glucose}
        max_glucose={input.max_glucose}
        events_ge_180={input.events_ge_180}
        events_ge_250={input.events_ge_250}
        events_le_70={input.events_le_70}
        events_le_80={input.events_le_80}
      />
    </div>
  );
}

// ============================================================
// SSI Dose Calculator — exact units per POC BG range
// ============================================================
type CalcProps = {
  weight_kg: number;
  age_years: number;
  egfr: number;
  npo: boolean;
  on_glucocorticoid: boolean;
  steroid_dose_pred_eq_mg?: number;
  diabetes_type: DiabetesType;
  dialysis?: boolean;
  liver_failure?: boolean;
  total_daily_dose_units?: number;
  min_glucose: number;
  max_glucose: number;
  events_ge_180: number;
  events_ge_250: number;
  events_le_70: number;
  events_le_80: number;
};

function SSIDoseCalculator(props: CalcProps) {
  const [product, setProduct] = useState<InsulinProduct>("insugen_r");
  const [scaleOverride, setScaleOverride] = useState<CorrectionScale | "auto">("auto");

  const result = useMemo(
    () =>
      calculateSSIDoses({
        ...props,
        product,
        scale_override: scaleOverride === "auto" ? undefined : scaleOverride,
      }),
    [props, product, scaleOverride],
  );

  const meta = result.product;

  return (
    <Card className="p-5 space-y-4 border-accent/40 bg-accent/5">
      <div className="flex items-center gap-2">
        <Syringe className="h-5 w-5 text-accent-foreground" />
        <h2 className="font-heading font-semibold">SSI Dose Calculator — exact units per POC BG</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <Label>Insulin product</Label>
          <Select value={product} onValueChange={(v) => setProduct(v as InsulinProduct)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.values(INSULIN_PRODUCTS).map((p) => (
                <SelectItem key={p.id} value={p.id}>{p.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Correction scale</Label>
          <Select value={scaleOverride} onValueChange={(v) => setScaleOverride(v as any)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="auto">Auto ({result.scale.toUpperCase()})</SelectItem>
              <SelectItem value="low">Low (sensitive)</SelectItem>
              <SelectItem value="medium">Medium (usual)</SelectItem>
              <SelectItem value="high">High (resistant)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="rounded-md border bg-background p-3 text-xs space-y-1">
        <div className="font-semibold text-sm">{meta.label} <Badge variant="outline" className="ml-1 text-xs">{meta.kind}</Badge></div>
        <div>Onset {meta.onset_min} · Peak {meta.peak_hr} h · Duration {meta.duration_hr} h</div>
        <div className="text-muted-foreground">{meta.notes}</div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
        <Badge variant="secondary">TDD ≈ {result.tdd_units} U</Badge>
        <Badge variant="secondary">Scale: {result.scale.toUpperCase()}</Badge>
        {result.prandial_units_per_meal !== undefined && (
          <Badge>Scheduled bolus {result.prandial_units_per_meal} U/meal</Badge>
        )}
        {result.basal_units !== undefined && (
          <Badge>NPH basal {result.basal_units} U/day</Badge>
        )}
        {result.basal_split && (
          <Badge variant="outline">{result.basal_split.am} U AM + {result.basal_split.hs} U HS</Badge>
        )}
        {result.premix_breakfast_units !== undefined && (
          <Badge>Premix: {result.premix_breakfast_units} U breakfast + {result.premix_dinner_units} U dinner</Badge>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-muted">
              <th className="text-left p-2 border">POC BG (mg/dL)</th>
              <th className="p-2 border">Pre-meal (U)</th>
              <th className="p-2 border">Bedtime (U)</th>
              <th className="p-2 border">Correction-only (U)</th>
              <th className="text-left p-2 border">Notes</th>
            </tr>
          </thead>
          <tbody>
            {result.poc_table.map((r) => (
              <tr key={r.range} className={r.bg_high < 70 ? "bg-destructive/5" : r.bg_low >= 400 ? "bg-warning/10" : ""}>
                <td className="p-2 border font-medium">{r.range}</td>
                <td className="p-2 border text-center font-bold">{r.premeal_units}</td>
                <td className="p-2 border text-center">{r.bedtime_units}</td>
                <td className="p-2 border text-center">{r.correction_only_units}</td>
                <td className="p-2 border text-xs text-muted-foreground">{r.action ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {result.adjustments.length > 0 && (
        <div className="text-xs space-y-1">
          <div className="font-semibold">Dose adjustments applied:</div>
          <ul className="list-disc pl-5 space-y-0.5">
            {result.adjustments.map((a, i) => <li key={i}>{a}</li>)}
          </ul>
        </div>
      )}

      {result.warnings.length > 0 && (
        <div className="rounded-md border border-warning/40 bg-warning/10 p-3 text-xs space-y-1">
          <div className="font-semibold flex items-center gap-1"><AlertTriangle className="h-3.5 w-3.5" /> Warnings</div>
          <ul className="list-disc pl-5 space-y-0.5">
            {result.warnings.map((w, i) => <li key={i}>{w}</li>)}
          </ul>
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Pre-meal column = scheduled bolus + correction. Bedtime column = correction reduced ~50% (no scheduled prandial). 
        Correction-only column = stand-alone correction for NPO patients (q4–6h with regular insulin).
        For premix 30/70 and NPH, ad-hoc correction must use Insugen-R, Actrapid, or generic regular insulin.
      </p>
    </Card>
  );
}
