import { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useNavigate } from "react-router-dom";
import { Scale, Calculator, Info, ChevronDown, ChevronUp, Pill, Target, Activity, AlertCircle, BookOpen, RotateCcw, Home, InfoIcon, Heart, AlertTriangle, BrainCircuit, UtensilsCrossed, FlaskConical, Stethoscope } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import {
  ETHNICITY_GUIDELINES,
  getBmiCategory,
  getTreatmentGuidelines,
  EthnicityType,
  WEIGHT_LOSS_TARGETS,
  PREFERRED_PHARMACOTHERAPY,
  OTHER_PHARMACOTHERAPY,
  METABOLIC_SURGERY,
  TREATMENT_MONITORING,
  ADA_2025_CITATION,
} from "./obesity-guidelines";
import {
  evaluateWeightLossEffects,
  deriveLifestylePrescription,
  assessMicronutrientRisk,
  checkPharmacotherapyEligibility,
  assessAll,
  BENEFIT_LABELS,
  COMORBIDITY_LABELS,
  DIET_PATTERN_LABELS,
  MICRONUTRIENT_LABELS,
  WEIGHT_LOSS_BENEFIT_MAP,
  type Sex,
  type ComorbidityTag,
  type DietPatternTag,
  type WeightLossBenefitTag,
  type MicronutrientOfConcern,
  type ObesityCDSAssessment,
} from "./obesity-cds-engine";

const bmiSchema = z.object({
  height: z.coerce.number().min(30).max(300).describe("Height"),
  weight: z.coerce.number().min(10).max(700).describe("Weight"),
  ethnicity: z.enum(["standard", "asian-pacific", "indian"] as const),
  sex: z.enum(["male", "female", "unspecified"] as const).optional(),
  waist: z.preprocess((v) => (v === "" || v === null || v === undefined || Number.isNaN(v) ? undefined : Number(v)), z.number().min(10).max(400).optional()),
  hip: z.preprocess((v) => (v === "" || v === null || v === undefined || Number.isNaN(v) ? undefined : Number(v)), z.number().min(10).max(400).optional()),
});

type BmiFormData = z.infer<typeof bmiSchema>;

interface AdiposityRisk {
  waistFlag?: { level: "normal" | "increased"; message: string };
  whr?: number;
  whrFlag?: { level: "low" | "increased" | "high"; message: string };
  whtr?: number;
  whtrFlag?: { level: "low" | "increased" | "high"; message: string };
  centralAdiposity: boolean;
  overallNote: string;
  cutoffSource: string;
}

interface BmiResult {
  bmi: number;
  category: string;
  color: string;
  ethnicityName: string;
  adiposity?: AdiposityRisk;
}

const TABS = [
  { key: "calculator", label: "Calculator", icon: <Calculator className="h-4 w-4" /> },
  { key: "indian-classification", label: "Indian Classification", icon: <Info className="h-4 w-4" /> },
  { key: "cds-engine", label: "CDS Engine", icon: <BrainCircuit className="h-4 w-4" /> },
  { key: "guidelines", label: "ADA 2025 Guidelines", icon: <BookOpen className="h-4 w-4" /> },
];

export default function BmiCalculator() {
  const navigate = useNavigate();
  const [result, setResult] = useState<BmiResult | null>(null);
  const [showTreatment, setShowTreatment] = useState(false);
  const [showCutoffs, setShowCutoffs] = useState(true);
  const [showGrades, setShowGrades] = useState(false);
  const [treatmentData, setTreatmentData] = useState<ReturnType<typeof getTreatmentGuidelines>>(null);
  const [activeTab, setActiveTab] = useState("calculator");
  const [units, setUnits] = useState<"metric" | "imperial">(() => {
    try { return (localStorage.getItem("ncd_bmi_units") as "metric" | "imperial") || "metric"; } catch { return "metric"; }
  });
  const [showAdiposityInfo, setShowAdiposityInfo] = useState(false);

  const toMetric = (v: number | undefined, kind: "length" | "weight"): number | undefined => {
    if (v === undefined || v === null || Number.isNaN(v)) return undefined;
    if (units === "metric") return v;
    return kind === "length" ? v * 2.54 : v * 0.45359237;
  };

  // CDS Engine state
  const [cdsAssessment, setCdsAssessment] = useState<ObesityCDSAssessment | null>(null);
  const [cdsSex, setCdsSex] = useState<Sex>("male");
  const [cdsAge, setCdsAge] = useState("40");
  const [cdsComorbidities, setCdsComorbidities] = useState<ComorbidityTag[]>([]);
  const [cdsDietPattern, setCdsDietPattern] = useState<DietPatternTag[]>([]);
  const [cdsHasMalabsorption, setCdsHasMalabsorption] = useState(false);
  const [cdsEnergyIntake, setCdsEnergyIntake] = useState("1800");
  const [cdsRapidLoss, setCdsRapidLoss] = useState("0");
  const [cdsActivityLevel, setCdsActivityLevel] = useState<"sedentary" | "moderate" | "active">("sedentary");
  const [cdsShowWeightLoss, setCdsShowWeightLoss] = useState(true);
  const [cdsShowLifestyle, setCdsShowLifestyle] = useState(true);
  const [cdsShowMicronutrient, setCdsShowMicronutrient] = useState(true);
  const [cdsShowPharma, setCdsShowPharma] = useState(true);

  // HOMA-IR state
  const [homaInsulin, setHomaInsulin] = useState("");
  const [homaGlucose, setHomaGlucose] = useState("");
  const [homaUnit, setHomaUnit] = useState("mg/dL");
  const homaResult = useMemo(() => {
    const ins = parseFloat(homaInsulin);
    const glu = parseFloat(homaGlucose);
    if (isNaN(ins) || isNaN(glu) || ins <= 0 || glu <= 0) return null;
    const divisor = homaUnit === "mg/dL" ? 405 : 22.5;
    return (ins * glu) / divisor;
  }, [homaInsulin, homaGlucose, homaUnit]);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<BmiFormData>({
    resolver: zodResolver(bmiSchema),
    defaultValues: {
      ethnicity: "standard",
      sex: "unspecified",
    },
  });

  // Load saved values on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("ncd_bmi_default");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.height && parsed.weight) {
          // Can't easily set defaults after mount without setValue, skip
        }
      }
    } catch {
      // localStorage not available or invalid JSON
    }
  }, []);

  const selectedEthnicity = watch("ethnicity") || "standard";

  const onSubmit = (raw: BmiFormData) => {
    const data: BmiFormData = {
      ...raw,
      height: toMetric(raw.height, "length") ?? raw.height,
      weight: toMetric(raw.weight, "weight") ?? raw.weight,
      waist: toMetric(raw.waist, "length"),
      hip: toMetric(raw.hip, "length"),
    };
    const heightM = data.height / 100;
    const bmi = data.weight / (heightM * heightM);
    const roundedBmi = Math.round(bmi * 10) / 10;

    const category = getBmiCategory(roundedBmi, data.ethnicity);
    const guideline = ETHNICITY_GUIDELINES.find((g) => g.id === data.ethnicity);

    const treatment = getTreatmentGuidelines(roundedBmi, data.ethnicity);

    // ADA adiposity risk modifiers (waist + WHR)
    let adiposity: AdiposityRisk | undefined;
    if (data.waist || data.hip) {
      const sex = data.sex;
      let waistFlag: AdiposityRisk["waistFlag"];
      let whr: number | undefined;
      let whrFlag: AdiposityRisk["whrFlag"];
      let centralAdiposity = false;

      if (data.waist && sex && sex !== "unspecified") {
        const cutoff = sex === "male" ? 102 : 88;
        if (data.waist > cutoff) {
          waistFlag = { level: "increased", message: `Waist > ${cutoff} cm suggests increased central adiposity and cardiometabolic risk.` };
          centralAdiposity = true;
        } else {
          waistFlag = { level: "normal", message: `Waist ≤ ${cutoff} cm — within normal range.` };
        }
      } else if (data.waist) {
        waistFlag = { level: "normal", message: "Select sex to apply waist circumference cutoff." };
      }

      if (data.waist && data.hip) {
        whr = Math.round((data.waist / data.hip) * 100) / 100;
        if (sex === "male") {
          if (whr >= 1.0) whrFlag = { level: "high", message: "WHR ≥ 1.00 — high risk (male)." };
          else if (whr >= 0.9) whrFlag = { level: "increased", message: "WHR ≥ 0.90 — increased risk (male)." };
          else whrFlag = { level: "low", message: "WHR < 0.90 — low risk (male)." };
          if (whr >= 0.9) centralAdiposity = true;
        } else if (sex === "female") {
          if (whr >= 0.85) { whrFlag = { level: "increased", message: "WHR ≥ 0.85 — increased risk (female)." }; centralAdiposity = true; }
          else whrFlag = { level: "low", message: "WHR < 0.85 — low risk (female)." };
        }
      }

      let overallNote = "Central adiposity not elevated based on entered measures.";
      if (centralAdiposity) {
        if (roundedBmi >= 25 && roundedBmi < 35) {
          overallNote = "Cardiometabolic risk upgraded: elevated central adiposity in the setting of BMI 25–34.9. Intensify lifestyle and consider earlier pharmacotherapy per ADA.";
        } else {
          overallNote = "Elevated central adiposity — visceral fat pattern suggests higher cardiometabolic risk independent of BMI.";
        }
      }

      adiposity = { waistFlag, whr, whrFlag, centralAdiposity, overallNote };
    }

    setResult({
      bmi: roundedBmi,
      category: category.label,
      color: category.color,
      ethnicityName: guideline?.name || "Standard WHO",
      adiposity,
    });
    setTreatmentData(treatment);
    setShowTreatment(false);

    // Save to localStorage
    try {
      localStorage.setItem("ncd_bmi_last", JSON.stringify(data));
    } catch {
      // localStorage not available
    }
  };

  const reset = () => {
    setResult(null);
    setTreatmentData(null);
    setShowTreatment(false);
    setCdsAssessment(null);
  };

  const runCdsAssessment = () => {
    if (!result) return;
    const assessment = assessAll({
      baselineWeightKg: parseFloat(cdsEnergyIntake) > 0 ? parseFloat(cdsEnergyIntake) : undefined,
      currentWeightKg: parseFloat(cdsEnergyIntake) > 0 ? parseFloat(cdsEnergyIntake) * 0.9 : undefined,
      sex: cdsSex,
      age: parseInt(cdsAge) || 40,
      bmi: result.bmi,
      comorbidities: cdsComorbidities,
      dietPattern: cdsDietPattern,
      hasMalabsorption: cdsHasMalabsorption,
      currentEnergyIntakeKcal: parseInt(cdsEnergyIntake) || 1800,
      rapidWeightLossPercentPerMonth: parseFloat(cdsRapidLoss) || 0,
      activityLevel: cdsActivityLevel,
    });
    setCdsAssessment(assessment);
  };

  function handleSmartParse(values: Record<string, string>) {
    Object.entries(values).forEach(([key, value]) => {
      if (key === 'bmi') {
        // BMI is calculated by the form
      }
    });
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky Header */}
      <div className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="mx-auto max-w-2xl px-4">
          <div className="flex items-center gap-3 py-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-pink-500 to-rose-600 shadow-md">
              <Scale className="h-5 w-5 text-foreground" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="font-display text-xl font-extrabold tracking-tight bg-gradient-to-r from-pink-500 via-rose-500 to-orange-600 bg-clip-text text-transparent truncate">
                BMI Calculator
              </h1>
              <p className="text-xs font-medium text-destructive dark:text-destructive truncate">
                Body Mass Index with Ethnicity-Specific Thresholds
              </p>
            </div>
            <div className="flex items-center gap-2 no-print shrink-0">
              <Button variant="ghost" size="sm" onClick={() => navigate("/")} title="Back to Home">
                <Home className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={reset} title="Reset Form">
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="flex gap-0.5 pb-2 overflow-x-auto no-print flex-wrap">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${
                  activeTab === tab.key
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <main className="mx-auto w-full max-w-2xl px-4 py-6 space-y-6">
        {activeTab === "calculator" && (
          <>
            <Card className="clinical-card border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Calculator className="h-5 w-5" />
                  Enter Measurements
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Unit toggle */}
                <div className="flex items-center justify-between rounded-lg border border-border bg-muted/20 p-2">
                  <span className="text-xs font-semibold text-muted-foreground pl-2">Units</span>
                  <div className="inline-flex rounded-md border border-border bg-card p-0.5">
                    {(["metric", "imperial"] as const).map((u) => (
                      <button
                        key={u}
                        type="button"
                        onClick={() => {
                          setUnits(u);
                          try { localStorage.setItem("ncd_bmi_units", u); } catch { /* noop */ }
                        }}
                        className={cn(
                          "px-3 py-1 text-xs font-semibold rounded transition-colors",
                          units === u ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        {u === "metric" ? "Metric (cm / kg)" : "Imperial (in / lb)"}
                      </button>
                    ))}
                  </div>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  {/* Ethnicity Selector */}
                  <div className="space-y-2">
                    <Label htmlFor="ethnicity">Ethnicity / Population Group</Label>
                    <Select
                      value={selectedEthnicity}
                      onValueChange={(value: EthnicityType) => {
                        setValue("ethnicity", value, { shouldValidate: true });
                        // Auto-recalculate if we have height/weight already
                        const h = Number(watch("height"));
                        const w = Number(watch("weight"));
                        if (h > 0 && w > 0) {
                          handleSubmit(onSubmit)();
                        }
                      }}
                    >
                      <SelectTrigger id="ethnicity" className="bg-card border-border">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border">
                        {ETHNICITY_GUIDELINES.map((guideline) => (
                          <SelectItem
                            key={guideline.id}
                            value={guideline.id}
                            className="text-foreground focus:bg-muted focus:text-foreground"
                          >
                            {guideline.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      {ETHNICITY_GUIDELINES.find((g) => g.id === selectedEthnicity)?.description}
                    </p>
                  </div>

                  {/* Height Input */}
                  <div className="space-y-2">
                    <Label htmlFor="height">Height ({units === "metric" ? "cm" : "in"})</Label>
                    <Input
                      id="height"
                      type="number"
                      step="0.1"
                      placeholder={units === "metric" ? "e.g., 170" : "e.g., 67"}
                      className="bg-card border-border"
                      {...register("height", { valueAsNumber: true })}
                    />
                    {errors.height && (
                      <p className="text-xs text-red-500">
                        Please enter a valid height ({units === "metric" ? "100–250 cm" : "39–98 in"})
                      </p>
                    )}
                  </div>

                  {/* Weight Input */}
                  <div className="space-y-2">
                    <Label htmlFor="weight">Weight ({units === "metric" ? "kg" : "lb"})</Label>
                    <Input
                      id="weight"
                      type="number"
                      step="0.1"
                      placeholder={units === "metric" ? "e.g., 70" : "e.g., 154"}
                      className="bg-card border-border"
                      {...register("weight", { valueAsNumber: true })}
                    />
                    {errors.weight && (
                      <p className="text-xs text-red-500">
                        Please enter a valid weight ({units === "metric" ? "30–300 kg" : "66–660 lb"})
                      </p>
                    )}
                  </div>

                  {/* Optional: Sex / Waist / Hip for ADA adiposity assessment */}
                  <div className="rounded-lg border border-dashed border-border p-4 space-y-4 bg-muted/20">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2">
                        <Info className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                        <div>
                          <p className="text-sm font-semibold">Optional: Central adiposity (ADA)</p>
                          <p className="text-xs text-muted-foreground">
                            Add sex + waist (and optionally hip) circumference to layer waist-circumference and waist-to-hip ratio risk flags on top of BMI.
                          </p>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 shrink-0"
                        onClick={() => setShowAdiposityInfo((v) => !v)}
                        title="How cutoffs and flags are applied"
                      >
                        <InfoIcon className="h-4 w-4" />
                      </Button>
                    </div>

                    {showAdiposityInfo && (
                      <div className="rounded-md border border-primary/30 bg-primary/5 p-3 text-xs space-y-2 leading-relaxed">
                        <p className="font-semibold text-sm">How the cutoffs are applied</p>
                        <div>
                          <p className="font-semibold">Waist circumference (AHA)</p>
                          <ul className="list-disc pl-4 space-y-0.5">
                            <li>Male: waist &gt; 102 cm (&gt; 40 in) → increased central adiposity risk.</li>
                            <li>Female: waist &gt; 88 cm (&gt; 35 in) → increased central adiposity risk.</li>
                            <li>Requires <em>Sex</em> to be set; otherwise no flag is applied.</li>
                          </ul>
                        </div>
                        <div>
                          <p className="font-semibold">Waist-to-Hip Ratio (WHO)</p>
                          <ul className="list-disc pl-4 space-y-0.5">
                            <li>Male: &lt; 0.90 low · ≥ 0.90 increased · ≥ 1.00 high risk.</li>
                            <li>Female: &lt; 0.85 low · ≥ 0.85 increased risk.</li>
                            <li>Computed only when both waist <em>and</em> hip are entered.</li>
                          </ul>
                        </div>
                        <div>
                          <p className="font-semibold">Risk flags</p>
                          <ul className="list-disc pl-4 space-y-0.5">
                            <li><span className="font-semibold">Normal</span> — measurement within reference range for sex.</li>
                            <li><span className="font-semibold text-warning">Increased</span> — elevated visceral / central fat; cardiometabolic risk higher than BMI alone suggests.</li>
                            <li><span className="font-semibold text-destructive">High</span> — strongly elevated central adiposity; consider aggressive lifestyle + earlier pharmacotherapy.</li>
                          </ul>
                        </div>
                        <p className="text-muted-foreground">
                          BMI category is <em>never</em> reclassified. Waist and WHR act only as risk modifiers per ADA guidance — a patient with BMI 25–34.9 plus elevated waist/WHR receives an upgraded cardiometabolic-risk note.
                        </p>
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="sex">Sex</Label>
                      <Select
                        value={watch("sex") || "unspecified"}
                        onValueChange={(value) => setValue("sex", value as "male" | "female" | "unspecified", { shouldValidate: true })}
                      >
                        <SelectTrigger id="sex" className="bg-card border-border">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-card border-border">
                          <SelectItem value="unspecified">Not specified</SelectItem>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="waist">Waist ({units === "metric" ? "cm" : "in"})</Label>
                        <Input
                          id="waist"
                          type="number"
                          step="0.1"
                          placeholder="optional"
                          className="bg-card border-border"
                          {...register("waist")}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="hip">Hip ({units === "metric" ? "cm" : "in"})</Label>
                        <Input
                          id="hip"
                          type="number"
                          step="0.1"
                          placeholder="optional"
                          className="bg-card border-border"
                          {...register("hip")}
                        />
                      </div>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      Cutoffs — Waist: M &gt; 102 cm (40 in), F &gt; 88 cm (35 in) [AHA]. WHR: M ≥ 0.90 increased / ≥ 1.00 high; F ≥ 0.85 increased [WHO]. Tap the info icon above for details.
                    </p>
                  </div>

                  {/* Submit Buttons */}
                  <div className="flex gap-3">
                    <Button type="submit" className="flex-1">
                      Calculate BMI
                    </Button>
                    <Button type="button" variant="outline" onClick={reset}>
                      Reset
                    </Button>
                  </div>
                </form>

                {/* Result Display */}
                {result && (
                  <div className="mt-6 space-y-4">
                    <div className="rounded-lg border border-border bg-card/50 p-6">
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">Body Mass Index</p>
                        <p className="text-5xl font-bold text-primary">{result.bmi}</p>
                        <p className={`mt-2 text-lg font-medium ${result.color}`}>
                          {result.category}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Using {result.ethnicityName} guidelines
                        </p>
                    </div>

                    {/* Adiposity Risk Panel */}
                    {result.adiposity && (
                      <div className="rounded-lg border border-border bg-card/50 p-4 space-y-3">
                        <div className="flex items-center gap-2 font-semibold text-sm">
                          <Activity className="h-4 w-4 text-primary" />
                          Central Adiposity Assessment (ADA)
                        </div>
                        {result.adiposity.waistFlag && (
                          <div className={cn(
                            "rounded-md border p-3 text-xs",
                            result.adiposity.waistFlag.level === "increased"
                              ? "border-destructive/40 bg-destructive/10 text-destructive"
                              : "border-border bg-muted/30"
                          )}>
                            <p className="font-semibold mb-0.5">Waist circumference</p>
                            <p>{result.adiposity.waistFlag.message}</p>
                          </div>
                        )}
                        {result.adiposity.whr !== undefined && (
                          <div className={cn(
                            "rounded-md border p-3 text-xs",
                            result.adiposity.whrFlag?.level === "high" && "border-destructive/40 bg-destructive/10 text-destructive",
                            result.adiposity.whrFlag?.level === "increased" && "border-warning/40 bg-warning/10 text-warning",
                            result.adiposity.whrFlag?.level === "low" && "border-border bg-muted/30",
                          )}>
                            <p className="font-semibold mb-0.5">Waist-to-Hip Ratio: {result.adiposity.whr}</p>
                            <p>{result.adiposity.whrFlag?.message}</p>
                          </div>
                        )}
                        <div className={cn(
                          "rounded-md border p-3 text-xs",
                          result.adiposity.centralAdiposity
                            ? "border-primary/40 bg-primary/10"
                            : "border-border bg-muted/20"
                        )}>
                          <p className="font-semibold mb-0.5">Cardiometabolic risk note</p>
                          <p>{result.adiposity.overallNote}</p>
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                          BMI classification is unchanged; waist and WHR act as risk modifiers per ADA / WHO / AHA guidance.
                        </p>
                      </div>
                    )}

                    </div>

                    {/* BMI Cut-offs Comparison */}
                    <div className="rounded-lg border border-border bg-card/50 p-4">
                      <Button
                        variant="ghost"
                        className="w-full flex items-center justify-between p-0 h-auto"
                        onClick={() => setShowCutoffs(!showCutoffs)}
                      >
                        <span className="flex items-center gap-2 font-semibold">
                          <Info className="h-4 w-4" />
                          BMI Categories & Cut-offs
                        </span>
                        {showCutoffs ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </Button>

                      {showCutoffs && (
                        <div className="mt-3 grid grid-cols-2 gap-3">
                          <div className="rounded-lg bg-muted/30 p-3">
                            <p className="text-xs font-semibold text-center mb-2">Western (WHO)</p>
                            <table className="w-full text-xs">
                              <tbody>
                                <tr className="border-b border-border"><td className="py-1">&lt;18.5</td><td className="text-right">Underweight</td></tr>
                                <tr className="border-b border-border"><td className="py-1">18.5-24.9</td><td className="text-right">Normal</td></tr>
                                <tr className="border-b border-border"><td className="py-1">25-29.9</td><td className="text-right">Overweight</td></tr>
                                <tr className="border-b border-border"><td className="py-1">30-34.9</td><td className="text-right">Obese I</td></tr>
                                <tr><td className="py-1">≥35</td><td className="text-right">Obese II/III</td></tr>
                              </tbody>
                            </table>
                          </div>
                          <div className="rounded-lg bg-muted/30 p-3">
                            <p className="text-xs font-semibold text-center mb-2">Asian (WHO, 2000)</p>
                            <table className="w-full text-xs">
                              <tbody>
                                <tr className="border-b border-border"><td className="py-1">&lt;18.5</td><td className="text-right">Underweight</td></tr>
                                <tr className="border-b border-border"><td className="py-1">18.5-22.9</td><td className="text-right">Normal</td></tr>
                                <tr className="border-b border-border"><td className="py-1">23-24.9</td><td className="text-right">Overweight</td></tr>
                                <tr className="border-b border-border"><td className="py-1">25-29.9</td><td className="text-right">Obese I</td></tr>
                                <tr><td className="py-1">≥30</td><td className="text-right">Obese II/III</td></tr>
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* BMI Grades Collapsible */}
                    <div className="rounded-lg border border-border bg-card/50 p-4">
                      <Button
                        variant="ghost"
                        className="w-full flex items-center justify-between p-0 h-auto"
                        onClick={() => setShowGrades(!showGrades)}
                      >
                        <span className="flex items-center gap-2 font-semibold">
                          <Target className="h-4 w-4" />
                          Obesity Grades & Treatment Targets
                        </span>
                        {showGrades ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </Button>

                      {showGrades && (
                        <div className="mt-3 space-y-2">
                          <div className="rounded-lg bg-muted/30 p-3 flex justify-between items-center">
                            <div>
                              <p className="font-medium">Grade 1 (Overweight)</p>
                              <p className="text-xs text-muted-foreground">BMI 25-29.9</p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs font-medium text-primary">Target: ≥3-7% weight loss</p>
                              <p className="text-xs text-muted-foreground">Grade A</p>
                            </div>
                          </div>
                          <div className="rounded-lg bg-muted/30 p-3 flex justify-between items-center">
                            <div>
                              <p className="font-medium">Grade 2 (Obesity)</p>
                              <p className="text-xs text-muted-foreground">BMI 30-34.9</p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs font-medium text-primary">Target: ≥10% weight loss</p>
                              <p className="text-xs text-muted-foreground">Grade B</p>
                            </div>
                          </div>
                          <div className="rounded-lg bg-muted/30 p-3 flex justify-between items-center">
                            <div>
                              <p className="font-medium">Grade 3 (Severe Obesity)</p>
                              <p className="text-xs text-muted-foreground">BMI ≥35</p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs font-medium text-primary">Target: ≥15-20% weight loss</p>
                              <p className="text-xs text-muted-foreground">Grade A/B</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* ADA 2025 Treatment Guidelines */}
                    <div className="space-y-3">
                      <Button
                        variant="outline"
                        className="w-full flex items-center justify-between"
                        onClick={() => setShowTreatment(!showTreatment)}
                      >
                        <span className="flex items-center gap-2">
                          <BookOpen className="h-4 w-4" />
                          ADA 2025 Treatment Guidelines
                        </span>
                        {showTreatment ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>

                      {showTreatment && (
                        <div className="space-y-4">
                          {/* Weight Loss Targets */}
                          <Card className="border-primary/30">
                            <CardHeader className="pb-3">
                              <CardTitle className="flex items-center gap-2 text-base">
                                <Target className="h-4 w-4 text-primary" />
                                Weight Loss Targets (ADA 2025)
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                              {WEIGHT_LOSS_TARGETS.map((target, i) => (
                                <div key={i} className="p-3 rounded-lg bg-card/50 border border-border">
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="font-semibold text-foreground">{target.percentage} Weight Loss</span>
                                    <Badge variant={target.grade === "A" ? "default" : "secondary"}>
                                      Grade {target.grade}
                                    </Badge>
                                  </div>
                                  <ul className="space-y-1">
                                    {target.benefits.map((benefit, j) => (
                                      <li key={j} className="text-sm text-muted-foreground flex items-start gap-2">
                                        <span className="text-primary mt-1">•</span>
                                        {benefit}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              ))}
                            </CardContent>
                          </Card>

                          {/* Treatment Monitoring */}
                          <Alert className="border-info/50 bg-info/10">
                            <Activity className="h-4 w-4" />
                            <AlertDescription className="space-y-2">
                              <p className="font-medium">Treatment Monitoring</p>
                              <div className="text-sm space-y-1">
                                <p><strong>Early Response ({TREATMENT_MONITORING.earlyResponse.timeframe}):</strong> Target {TREATMENT_MONITORING.earlyResponse.target} weight loss</p>
                                <p className="text-muted-foreground">{TREATMENT_MONITORING.earlyResponse.interpretation}</p>
                                <p className="mt-2 text-warning"><strong>Important:</strong> {TREATMENT_MONITORING.longTermTherapy.discontinuationWarning}</p>
                              </div>
                            </AlertDescription>
                          </Alert>

                          {/* Treatment Recommendations based on BMI */}
                          {treatmentData && (
                            <Alert className="border-amber-500/50 bg-warning/100/10">
                              <AlertCircle className="h-4 w-4" />
                              <AlertDescription className="space-y-3">
                                <p className="font-medium">Personalized Recommendations for Current BMI:</p>
                                <ul className="list-disc pl-4 space-y-1">
                                  {treatmentData.recommendations.map((rec, i) => (
                                    <li key={i} className="text-sm">{rec}</li>
                                  ))}
                                </ul>
                              </AlertDescription>
                            </Alert>
                          )}

                          {/* Pharmacotherapy Tabs */}
                          <Tabs defaultValue="preferred" className="w-full">
                            <TabsList className="grid w-full grid-cols-2">
                              <TabsTrigger value="preferred" className="flex items-center gap-1">
                                <Pill className="h-3 w-3" />
                                Preferred Agents
                              </TabsTrigger>
                              <TabsTrigger value="other">Other Options</TabsTrigger>
                            </TabsList>

                            <TabsContent value="preferred" className="space-y-3">
                              <p className="text-xs text-muted-foreground">ADA 2025 Recommended - Grade A Evidence</p>
                              {PREFERRED_PHARMACOTHERAPY.map((agent, i) => (
                                <Card key={i} className="border-primary/30 bg-primary/5">
                                  <CardHeader className="pb-2">
                                    <div className="flex items-center justify-between">
                                      <CardTitle className="text-base">{agent.name}</CardTitle>
                                      <Badge variant="default" className="text-xs">Preferred</Badge>
                                    </div>
                                    <p className="text-xs text-muted-foreground">{agent.class}</p>
                                  </CardHeader>
                                  <CardContent className="space-y-2 text-sm">
                                    <div className="grid grid-cols-2 gap-2">
                                      <div>
                                        <span className="text-muted-foreground">Dosage:</span>
                                        <p>{agent.dosage}</p>
                                      </div>
                                      <div>
                                        <span className="text-muted-foreground">A1C Reduction:</span>
                                        <p>{agent.a1cReduction}</p>
                                      </div>
                                    </div>
                                    <div>
                                      <span className="text-muted-foreground">Weight Loss:</span>
                                      <p className="font-medium text-primary">{agent.weightLoss}</p>
                                    </div>
                                    <ul className="space-y-1 mt-2">
                                      {agent.notes.map((note, j) => (
                                        <li key={j} className="text-xs text-muted-foreground flex items-start gap-1">
                                          <span className="text-primary">•</span> {note}
                                        </li>
                                      ))}
                                    </ul>
                                  </CardContent>
                                </Card>
                              ))}
                            </TabsContent>

                            <TabsContent value="other" className="space-y-3">
                              {OTHER_PHARMACOTHERAPY.map((agent, i) => (
                                <Card key={i} className="border-border">
                                  <CardHeader className="pb-2">
                                    <CardTitle className="text-base">{agent.name}</CardTitle>
                                    <p className="text-xs text-muted-foreground">{agent.class}</p>
                                  </CardHeader>
                                  <CardContent className="space-y-2 text-sm">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                      <div>
                                        <span className="text-muted-foreground">Dosage:</span>
                                        <p>{agent.dosage}</p>
                                      </div>
                                      <div>
                                        <span className="text-muted-foreground">Weight Loss:</span>
                                        <p className="font-medium">{agent.weightLoss}</p>
                                      </div>
                                    </div>
                                    <ul className="space-y-1 mt-2">
                                      {agent.notes.map((note, j) => (
                                        <li key={j} className="text-xs text-muted-foreground flex items-start gap-1">
                                          <span className="text-amber-500">•</span> {note}
                                        </li>
                                      ))}
                                    </ul>
                                  </CardContent>
                                </Card>
                              ))}
                            </TabsContent>
                          </Tabs>

                          {/* Metabolic Surgery */}
                          {(result.bmi >= 30 || (selectedEthnicity !== "standard" && result.bmi >= 27.5)) && (
                            <Card className="border-red-500/30 bg-destructive/100/5">
                              <CardHeader className="pb-3">
                                <CardTitle className="flex items-center gap-2 text-base text-destructive">
                                  <Activity className="h-4 w-4" />
                                  Metabolic Surgery Consideration
                                </CardTitle>
                              </CardHeader>
                              <CardContent className="space-y-3">
                                <p className="text-sm text-muted-foreground">
                                  BMI ≥{selectedEthnicity === "standard" ? "30" : "27.5"} (Asian/Indian populations):
                                  Consider referral for metabolic surgery evaluation per ADA 2025 (Grade A)
                                </p>
                                <div className="space-y-3">
                                  {METABOLIC_SURGERY.map((surgery, i) => (
                                    <div key={i} className="p-3 rounded-lg bg-card/50 border border-border">
                                      <p className="font-medium text-foreground">{surgery.procedure}</p>
                                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2 text-sm">
                                        <div>
                                          <span className="text-muted-foreground">1-year WL:</span>
                                          <p>{surgery.weightLoss1yr}</p>
                                        </div>
                                        <div>
                                          <span className="text-muted-foreground">5-year WL:</span>
                                          <p>{surgery.weightLoss5yr}</p>
                                        </div>
                                        <div className="col-span-2">
                                          <span className="text-muted-foreground">Diabetes Remission (5yr):</span>
                                          <p className="font-medium text-primary">{surgery.diabetesRemission5yr}</p>
                                        </div>
                                      </div>
                                      <ul className="mt-2 space-y-1">
                                        {surgery.notes.map((note, j) => (
                                          <li key={j} className="text-xs text-muted-foreground flex items-start gap-1">
                                            <span className="text-destructive">•</span> {note}
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  ))}
                                </div>
                              </CardContent>
                            </Card>
                          )}

                          {/* Citation */}
                          <p className="text-xs text-muted-foreground text-center">
                            Source: {ADA_2025_CITATION}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}

        {activeTab === "indian-classification" && (
          <>
            {/* ─── ICMR (Asian Indian) BMI Classification ─── */}
            <Card className="clinical-card border-amber-500/30">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Info className="h-5 w-5 text-amber-500" />
                  ICMR (Asian Indian) BMI Classification
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  Based on the 2009 Indian consensus statement and ICMR-INDIAB study framework
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Main Classification Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-2 pr-4 font-semibold">Category</th>
                        <th className="text-left py-2 pr-4 font-semibold">BMI (kg/m²)</th>
                        <th className="text-left py-2 font-semibold">Risk</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-border/50">
                        <td className="py-2 pr-4 text-yellow-500 font-medium">Underweight</td>
                        <td className="py-2 pr-4 font-mono">&lt;18.5</td>
                        <td className="py-2 text-xs text-muted-foreground">Nutritional deficiency</td>
                      </tr>
                      <tr className="border-b border-border/50">
                        <td className="py-2 pr-4 text-emerald-500 font-medium">Normal</td>
                        <td className="py-2 pr-4 font-mono">18.5–22.9</td>
                        <td className="py-2 text-xs text-muted-foreground">Low risk</td>
                      </tr>
                      <tr className="border-b border-border/50 bg-amber-500/5">
                        <td className="py-2 pr-4 text-amber-500 font-bold">Overweight (At Risk)</td>
                        <td className="py-2 pr-4 font-mono font-bold">23.0–24.9</td>
                        <td className="py-2 text-xs text-muted-foreground">Increased cardiometabolic risk</td>
                      </tr>
                      <tr className="border-b border-border/50 bg-orange-500/5">
                        <td className="py-2 pr-4 text-orange-500 font-bold">Obesity</td>
                        <td className="py-2 pr-4 font-mono font-bold">≥25.0</td>
                        <td className="py-2 text-xs text-muted-foreground">High cardiometabolic risk</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Obesity Classes */}
                <div className="rounded-lg bg-card/50 border border-border p-4">
                  <p className="text-sm font-semibold mb-2">Obesity Classes (commonly used in India after obesity is diagnosed)</p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-2 pr-4 font-semibold">Obesity Class</th>
                          <th className="text-left py-2 font-semibold">BMI (kg/m²)</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b border-border/50">
                          <td className="py-2 pr-4">Class I</td>
                          <td className="py-2 font-mono">25.0–29.9</td>
                        </tr>
                        <tr className="border-b border-border/50">
                          <td className="py-2 pr-4">Class II</td>
                          <td className="py-2 font-mono">30.0–34.9</td>
                        </tr>
                        <tr className="border-b border-border/50">
                          <td className="py-2 pr-4">Class III</td>
                          <td className="py-2 font-mono">35.0–39.9</td>
                        </tr>
                        <tr>
                          <td className="py-2 pr-4">Class IV (Morbid/Extreme)</td>
                          <td className="py-2 font-mono">≥40.0</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    The ICMR/Indian consensus primarily defines obesity as BMI ≥25 kg/m². The subdivision into Classes I–IV is widely used in Indian clinical practice for severity grading, although the original Indian consensus mainly emphasizes the lower BMI threshold rather than formal obesity classes.
                  </p>
                </div>

                {/* WHO vs ICMR Comparison */}
                <div className="rounded-lg bg-blue-500/5 border border-blue-500/30 p-4">
                  <p className="text-sm font-semibold mb-2 flex items-center gap-2">
                    <Activity className="h-4 w-4 text-blue-500" />
                    ICMR vs WHO — BMI Classification Comparison
                  </p>
                  <p className="text-xs text-muted-foreground mb-3">
                    The primary difference is that the ICMR shifts its BMI threshold <strong>downward by 5 units</strong> for obesity and <strong>2 units</strong> for overweight categories compared to WHO guidelines. This adjustment is due to the higher risk of cardiovascular disease and type 2 diabetes in South Asian populations at lower body weights.
                  </p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-2 pr-3 font-semibold">Category</th>
                          <th className="text-left py-2 pr-3 font-semibold">ICMR (India)</th>
                          <th className="text-left py-2 pr-3 font-semibold">WHO (Global)</th>
                          <th className="text-left py-2 font-semibold">Risk for Indians</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b border-border/50">
                          <td className="py-2 pr-3">Underweight</td>
                          <td className="py-2 pr-3 font-mono">&lt;18.5</td>
                          <td className="py-2 pr-3 font-mono">&lt;18.5</td>
                          <td className="py-2 text-xs">Nutritional deficiencies</td>
                        </tr>
                        <tr className="border-b border-border/50">
                          <td className="py-2 pr-3">Normal Weight</td>
                          <td className="py-2 pr-3 font-mono">18.5–22.9</td>
                          <td className="py-2 pr-3 font-mono">18.5–24.9</td>
                          <td className="py-2 text-xs">Standard healthy range</td>
                        </tr>
                        <tr className="border-b border-border/50 bg-amber-500/5">
                          <td className="py-2 pr-3 font-bold">Overweight</td>
                          <td className="py-2 pr-3 font-mono font-bold">23.0–24.9</td>
                          <td className="py-2 pr-3 font-mono">25.0–29.9</td>
                          <td className="py-2 text-xs">Pre-obesity / Increased risk</td>
                        </tr>
                        <tr className="border-b border-border/50 bg-orange-500/5">
                          <td className="py-2 pr-3 font-bold">Obesity Class I</td>
                          <td className="py-2 pr-3 font-mono font-bold">25.0–29.9</td>
                          <td className="py-2 pr-3 font-mono">30.0–34.9</td>
                          <td className="py-2 text-xs">High metabolic risk</td>
                        </tr>
                        <tr className="border-b border-border/50 bg-red-500/5">
                          <td className="py-2 pr-3 font-bold">Obesity Class II</td>
                          <td className="py-2 pr-3 font-mono font-bold">30.0–34.9</td>
                          <td className="py-2 pr-3 font-mono">35.0–39.9</td>
                          <td className="py-2 text-xs">Severe health risk</td>
                        </tr>
                        <tr className="bg-red-500/10">
                          <td className="py-2 pr-3 font-bold">Obesity Class III</td>
                          <td className="py-2 pr-3 font-mono font-bold">≥35.0</td>
                          <td className="py-2 pr-3 font-mono">≥40.0</td>
                          <td className="py-2 text-xs">Morbid obesity / Extreme risk</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Why the Guidelines Differ */}
                  <div className="mt-3 space-y-2">
                    <p className="text-sm font-semibold">Why the Guidelines Differ</p>
                    <ul className="space-y-1 text-xs">
                      <li className="flex items-start gap-2">
                        <span className="text-blue-500 mt-1">•</span>
                        <span><strong>Visceral Fat Accumulation:</strong> Asian Indians tend to have a higher percentage of body fat and more abdominal (visceral) fat at a lower BMI than Caucasians.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-500 mt-1">•</span>
                        <span><strong>The "Thin-Fat" Phenotype:</strong> Individuals may look lean externally but carry high internal fat surrounding major organs.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-500 mt-1">•</span>
                        <span><strong>Metabolic Vulnerability:</strong> Insulin resistance, type 2 diabetes, and early-onset heart attacks occur at much lower BMI levels in India.</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* ─── ICMR-INDIAB Metabolic Phenotypes ─── */}
            <Card className="clinical-card border-blue-500/30">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Activity className="h-5 w-5 text-blue-500" />
                  ICMR-INDIAB Metabolic Phenotypes
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  The ICMR-INDIAB study classifies individuals according to BMI and metabolic health (blood pressure, blood glucose, lipid profile, and waist circumference).
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Phenotype Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-4">
                    <p className="font-bold text-emerald-600 dark:text-emerald-400">MHNO</p>
                    <p className="text-xs text-muted-foreground">Metabolically Healthy Non-Obese</p>
                    <p className="text-sm mt-1">BMI &lt;25 + Metabolically Healthy</p>
                    <p className="text-xs text-muted-foreground mt-1">Lowest cardiometabolic risk</p>
                  </div>
                  <div className="rounded-lg bg-amber-500/10 border border-amber-500/30 p-4">
                    <p className="font-bold text-amber-600 dark:text-amber-400">MONO</p>
                    <p className="text-xs text-muted-foreground">Metabolically Obese Non-Obese</p>
                    <p className="text-sm mt-1">BMI &lt;25 + Metabolically Unhealthy</p>
                    <p className="text-xs text-muted-foreground mt-1">"Slim-fat" phenotype; high risk of T2DM and CKD despite normal BMI</p>
                  </div>
                  <div className="rounded-lg bg-orange-500/10 border border-orange-500/30 p-4">
                    <p className="font-bold text-orange-600 dark:text-orange-400">MHO</p>
                    <p className="text-xs text-muted-foreground">Metabolically Healthy Obese</p>
                    <p className="text-sm mt-1">BMI ≥25 + Metabolically Healthy</p>
                    <p className="text-xs text-muted-foreground mt-1">Obese without metabolic abnormalities; lower risk than MOO but requires follow-up</p>
                  </div>
                  <div className="rounded-lg bg-red-500/10 border border-red-500/30 p-4">
                    <p className="font-bold text-red-600 dark:text-red-400">MOO</p>
                    <p className="text-xs text-muted-foreground">Metabolically Obese Obese</p>
                    <p className="text-sm mt-1">BMI ≥25 + Metabolically Unhealthy</p>
                    <p className="text-xs text-muted-foreground mt-1">Highest risk for T2DM, CVD, and other obesity-related complications</p>
                  </div>
                </div>

                {/* Quick Reference Table */}
                <div className="rounded-lg bg-card/50 border border-border p-4">
                  <p className="text-sm font-semibold mb-2">Quick Reference</p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-2 pr-4 font-semibold">BMI</th>
                          <th className="text-left py-2 pr-4 font-semibold">Metabolic Health</th>
                          <th className="text-left py-2 font-semibold">Phenotype</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b border-border/50">
                          <td className="py-2 pr-4">&lt;25</td>
                          <td className="py-2 pr-4 text-emerald-500">Healthy</td>
                          <td className="py-2 font-bold">MHNO</td>
                        </tr>
                        <tr className="border-b border-border/50">
                          <td className="py-2 pr-4">&lt;25</td>
                          <td className="py-2 pr-4 text-amber-500">Unhealthy</td>
                          <td className="py-2 font-bold">MONO</td>
                        </tr>
                        <tr className="border-b border-border/50">
                          <td className="py-2 pr-4">≥25</td>
                          <td className="py-2 pr-4 text-emerald-500">Healthy</td>
                          <td className="py-2 font-bold">MHO</td>
                        </tr>
                        <tr>
                          <td className="py-2 pr-4">≥25</td>
                          <td className="py-2 pr-4 text-red-500">Unhealthy</td>
                          <td className="py-2 font-bold">MOO</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Key Takeaways */}
                <div className="rounded-lg bg-info/10 border border-info/30 p-4">
                  <p className="text-sm font-semibold mb-2 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-info" />
                    Key Takeaways
                  </p>
                  <ul className="space-y-1 text-xs">
                    <li className="flex items-start gap-2">
                      <span className="text-info mt-1">•</span>
                      <span><strong>BMI alone is insufficient</strong> for risk stratification in Indians.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-info mt-1">•</span>
                      <span><strong>MONO</strong> individuals appear non-obese but carry substantial metabolic risk.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-info mt-1">•</span>
                      <span><strong>MOO</strong> has the greatest risk of diabetes and cardiovascular disease.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-info mt-1">•</span>
                      <span><strong>MHO</strong> exists but may progress to metabolically unhealthy obesity over time, so periodic reassessment is recommended.</span>
                    </li>
                  </ul>
                </div>

                <Alert className="border-info/50 bg-info/10">
                  <InfoIcon className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    <strong>Both classifications are correct, but they answer different questions.</strong>
                    BMI ≥23 kg/m² marks overweight/at-risk in Asian Indians.
                    BMI ≥25 kg/m² defines obesity in both the traditional Indian consensus and the
                    recent ICMR-INDIAB metabolic phenotype paper.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            {/* ─── Metabolic Syndrome ─── */}
            <Card className="clinical-card border-rose-500/30">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Heart className="h-5 w-5 text-rose-500" />
                  Metabolic Syndrome
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  A cluster of cardiometabolic risk factors increasing the risk of Type 2 Diabetes,
                  ASCVD, and chronic kidney disease
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Diagnostic Criteria */}
                <div>
                  <p className="text-sm font-semibold mb-2">
                    Diagnostic Criteria (Harmonized International Definition) —{' '}
                    <span className="text-primary">≥3 of 5 = Metabolic Syndrome</span>
                  </p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-2 pr-4 font-semibold">Component</th>
                          <th className="text-left py-2 font-semibold">Cut-off for Asian Indians</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b border-border/50">
                          <td className="py-2 pr-4">Abdominal obesity</td>
                          <td className="py-2 font-mono">Waist ≥90 cm (men), ≥80 cm (women)</td>
                        </tr>
                        <tr className="border-b border-border/50">
                          <td className="py-2 pr-4">Triglycerides</td>
                          <td className="py-2 font-mono">≥150 mg/dL (1.7 mmol/L) or on treatment</td>
                        </tr>
                        <tr className="border-b border-border/50">
                          <td className="py-2 pr-4">HDL cholesterol</td>
                          <td className="py-2 font-mono">&lt;40 mg/dL (men), &lt;50 mg/dL (women) or on treatment</td>
                        </tr>
                        <tr className="border-b border-border/50">
                          <td className="py-2 pr-4">Blood pressure</td>
                          <td className="py-2 font-mono">≥130/85 mmHg or on antihypertensive treatment</td>
                        </tr>
                        <tr>
                          <td className="py-2 pr-4">Fasting plasma glucose</td>
                          <td className="py-2 font-mono">≥100 mg/dL (5.6 mmol/L) or diagnosed diabetes</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* The Deadly Five */}
                <div className="rounded-lg bg-rose-500/5 border border-rose-500/20 p-4">
                  <p className="text-sm font-semibold mb-2 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-rose-500" />
                    The "Deadly Five"
                  </p>
                  <ul className="space-y-1 text-sm">
                    <li className="flex items-center gap-2"><span className="text-rose-500">•</span> Increased waist circumference</li>
                    <li className="flex items-center gap-2"><span className="text-rose-500">•</span> High triglycerides</li>
                    <li className="flex items-center gap-2"><span className="text-rose-500">•</span> Low HDL cholesterol</li>
                    <li className="flex items-center gap-2"><span className="text-rose-500">•</span> Elevated blood pressure</li>
                    <li className="flex items-center gap-2"><span className="text-rose-500">•</span> Elevated fasting blood glucose</li>
                  </ul>
                  <p className="text-sm font-semibold mt-2 text-primary">Diagnosis: ≥3 of 5 = Metabolic Syndrome</p>
                </div>

                {/* Indian Waist Cut-offs */}
                <Alert className="border-amber-500/30 bg-amber-500/5">
                  <InfoIcon className="h-4 w-4" />
                  <AlertDescription>
                    <p className="text-sm font-semibold mb-1">Indian Waist Circumference Cut-offs</p>
                    <p className="text-sm">Men: <strong>≥90 cm</strong> | Women: <strong>≥80 cm</strong></p>
                    <p className="text-xs text-muted-foreground mt-1">
                      These lower cut-offs reflect the higher cardiometabolic risk among South Asians.
                    </p>
                  </AlertDescription>
                </Alert>

                {/* Clinical Significance */}
                <div className="rounded-lg bg-card/50 border border-border p-4">
                  <p className="text-sm font-semibold mb-2">Clinical Significance</p>
                  <p className="text-sm text-muted-foreground mb-2">
                    Patients with metabolic syndrome have:
                  </p>
                  <ul className="space-y-1 text-sm">
                    <li className="flex items-start gap-2">
                      <span className="text-rose-500 mt-1">•</span>
                      <span>Approximately <strong>2-fold higher risk</strong> of cardiovascular disease</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-rose-500 mt-1">•</span>
                      <span>Approximately <strong>5-fold higher risk</strong> of developing Type 2 diabetes</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-rose-500 mt-1">•</span>
                      <span>Increased risk of fatty liver disease, chronic kidney disease, obstructive sleep apnea, and premature mortality</span>
                    </li>
                  </ul>
                </div>

                {/* Difference Table */}
                <div>
                  <p className="text-sm font-semibold mb-2">
                    Difference Between Metabolic Syndrome and the ICMR-INDIAB Metabolic Phenotypes
                  </p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-2 pr-4 font-semibold">Metabolic Syndrome</th>
                          <th className="text-left py-2 font-semibold">ICMR-INDIAB Metabolic Phenotypes</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b border-border/50">
                          <td className="py-2 pr-4">Requires <strong>≥3 of 5</strong> metabolic abnormalities</td>
                          <td className="py-2">Metabolically unhealthy is defined as <strong>≥2 metabolic abnormalities</strong></td>
                        </tr>
                        <tr className="border-b border-border/50">
                          <td className="py-2 pr-4">Used for routine clinical diagnosis</td>
                          <td className="py-2">Used to classify obesity phenotypes in population studies</td>
                        </tr>
                        <tr className="border-b border-border/50">
                          <td className="py-2 pr-4">Does not include BMI</td>
                          <td className="py-2">Combines BMI (&lt;25 or ≥25 kg/m²) with metabolic health</td>
                        </tr>
                        <tr>
                          <td className="py-2 pr-4">Internationally accepted (IDF, AHA/NHLBI, etc.)</td>
                          <td className="py-2">Specific to the ICMR-INDIAB research framework</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <Alert className="mt-3 border-warning/30 bg-warning/5">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription className="text-xs">
                      This distinction is important because a person may be classified as{' '}
                      <strong>metabolically unhealthy</strong> in the ICMR-INDIAB system (having 2
                      abnormalities) without yet meeting the formal criteria for{' '}
                      <strong>metabolic syndrome</strong>, which requires at least 3 abnormalities.
                    </AlertDescription>
                  </Alert>
                </div>
              </CardContent>
            </Card>

            {/* ─── HOMA-IR Calculator ─── */}
            <Card className="clinical-card border-amber-500/30">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Calculator className="h-5 w-5 text-amber-500" />
                  HOMA-IR Calculator
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  Homeostatic Model Assessment for Insulin Resistance — key for identifying MONO and MOO phenotypes
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Fasting Insulin (μIU/mL)</Label>
                    <Input type="number" min="0" step="0.1" placeholder="e.g. 12" value={homaInsulin} onChange={e => setHomaInsulin(e.target.value)} className="h-10 px-3 rounded-lg border-border/60" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Fasting Glucose</Label>
                    <div className="flex gap-2">
                      <Input type="number" min="0" step="1" placeholder="e.g. 95" value={homaGlucose} onChange={e => setHomaGlucose(e.target.value)} className="h-10 px-3 rounded-lg border-border/60 flex-1" />
                      <Select value={homaUnit} onValueChange={setHomaUnit}>
                        <SelectTrigger className="h-10 w-24 rounded-lg border-border/60">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="mg/dL">mg/dL</SelectItem>
                          <SelectItem value="mmol/L">mmol/L</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {homaResult !== null && (
                  <div className="rounded-lg border border-border bg-muted/20 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold">HOMA-IR Score</span>
                      <span className={cn(
                        "text-2xl font-bold",
                        homaResult < 1.0 ? "text-emerald-500" :
                        homaResult < 2.0 ? "text-amber-500" :
                        homaResult < 3.0 ? "text-orange-500" :
                        "text-red-500"
                      )}>
                        {homaResult.toFixed(2)}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Formula: (Insulin × Glucose) / {homaUnit === "mg/dL" ? "405" : "22.5"}
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b border-border">
                            <th className="text-left py-1.5 pr-3 font-semibold text-muted-foreground">Score</th>
                            <th className="text-left py-1.5 font-semibold text-muted-foreground">Clinical Meaning</th>
                          </tr>
                        </thead>
                        <tbody className="text-foreground">
                          <tr className={homaResult < 1.0 ? "bg-emerald-500/10" : "border-b border-border/50"}>
                            <td className="py-1.5 pr-3 font-medium">&lt; 1.0</td>
                            <td className="py-1.5">Optimal insulin sensitivity (Healthy)</td>
                          </tr>
                          <tr className={homaResult >= 1.0 && homaResult < 2.0 ? "bg-amber-500/10" : "border-b border-border/50"}>
                            <td className="py-1.5 pr-3 font-medium">1.0 – 1.9</td>
                            <td className="py-1.5">Early or mild insulin resistance</td>
                          </tr>
                          <tr className={homaResult >= 2.0 && homaResult < 3.0 ? "bg-orange-500/10" : "border-b border-border/50"}>
                            <td className="py-1.5 pr-3 font-medium">2.0 – 2.9</td>
                            <td className="py-1.5">Moderate insulin resistance — commonly seen in <strong>MONO</strong> and <strong>MOO</strong></td>
                          </tr>
                          <tr className={homaResult >= 3.0 ? "bg-red-500/10" : ""}>
                            <td className="py-1.5 pr-3 font-medium">≥ 3.0</td>
                            <td className="py-1.5">Severe insulin resistance — high risk for Type 2 Diabetes</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    <div className="rounded-lg bg-amber-500/5 border border-amber-500/20 p-3">
                      <p className="text-xs text-muted-foreground">
                        <strong>Example:</strong> Fasting Insulin 12 μIU/mL × Fasting Glucose 95 mg/dL = 1,140 ÷ 405 ={' '}
                        <strong className="text-foreground">2.81</strong> — Moderate insulin resistance (MONO/MOO range)
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}

        {activeTab === "cds-engine" && (
          <>
            <Card className="clinical-card border-violet-500/30">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <BrainCircuit className="h-5 w-5 text-violet-500" />
                  Clinical Decision Support Engine
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  Structured guideline-based assessment for weight loss effects, lifestyle prescription, micronutrient risk, and pharmacotherapy eligibility
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Patient Profile */}
                <div className="rounded-lg border border-border bg-card/50 p-4 space-y-4">
                  <p className="text-sm font-semibold flex items-center gap-2">
                    <Stethoscope className="h-4 w-4 text-violet-500" />
                    Patient Profile
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Sex</Label>
                      <Select value={cdsSex} onValueChange={(v: Sex) => setCdsSex(v)}>
                        <SelectTrigger className="h-10 rounded-lg border-border/60">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Age (years)</Label>
                      <Input type="number" min="18" max="100" value={cdsAge} onChange={e => setCdsAge(e.target.value)} className="h-10 rounded-lg border-border/60" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Current Energy Intake (kcal/day)</Label>
                      <Input type="number" min="800" max="5000" value={cdsEnergyIntake} onChange={e => setCdsEnergyIntake(e.target.value)} className="h-10 rounded-lg border-border/60" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Rapid Weight Loss (%/month)</Label>
                      <Input type="number" min="0" max="20" step="0.5" value={cdsRapidLoss} onChange={e => setCdsRapidLoss(e.target.value)} className="h-10 rounded-lg border-border/60" placeholder="e.g., 4" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Activity Level</Label>
                      <Select value={cdsActivityLevel} onValueChange={(v: "sedentary" | "moderate" | "active") => setCdsActivityLevel(v)}>
                        <SelectTrigger className="h-10 rounded-lg border-border/60">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="sedentary">Sedentary</SelectItem>
                          <SelectItem value="moderate">Moderate</SelectItem>
                          <SelectItem value="active">Active</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Malabsorption Condition</Label>
                      <div className="flex items-center gap-2 h-10">
                        <Button variant={cdsHasMalabsorption ? "default" : "outline"} size="sm" className="flex-1" onClick={() => setCdsHasMalabsorption(!cdsHasMalabsorption)}>
                          {cdsHasMalabsorption ? "Yes" : "No"}
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Comorbidities */}
                  <div className="space-y-2">
                    <Label className="text-xs">Obesity-Related Comorbidities</Label>
                    <div className="flex flex-wrap gap-1.5">
                      {(["type_2_diabetes", "hypertension", "dyslipidemia", "obstructive_sleep_apnea", "osteoarthritis", "masld_mash"] as ComorbidityTag[]).map((tag) => (
                        <Button key={tag} variant={cdsComorbidities.includes(tag) ? "default" : "outline"} size="sm" className="text-xs" onClick={() => { setCdsComorbidities(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]); }}>
                          {COMORBIDITY_LABELS[tag]}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Diet Pattern */}
                  <div className="space-y-2">
                    <Label className="text-xs">Dietary Pattern Concerns</Label>
                    <div className="flex flex-wrap gap-1.5">
                      {(["low_intake_fruits_vegetables", "low_intake_whole_grains", "low_intake_protein_foods", "low_intake_nuts_seeds", "strict_vegetarian", "other_restrictive_pattern"] as DietPatternTag[]).map((tag) => (
                        <Button key={tag} variant={cdsDietPattern.includes(tag) ? "default" : "outline"} size="sm" className="text-xs" onClick={() => { setCdsDietPattern(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]); }}>
                          {DIET_PATTERN_LABELS[tag]}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <Button onClick={runCdsAssessment} className="w-full" disabled={!result}>
                    <BrainCircuit className="h-4 w-4 mr-2" />
                    Run CDS Assessment
                  </Button>
                  {!result && (
                    <p className="text-xs text-muted-foreground text-center">Calculate BMI first to enable CDS assessment</p>
                  )}
                </div>

                {/* CDS Results */}
                {cdsAssessment && (
                  <div className="space-y-4">
                    {/* Weight Loss Effects */}
                    <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5">
                      <Button variant="ghost" className="w-full flex items-center justify-between p-4 h-auto" onClick={() => setCdsShowWeightLoss(!cdsShowWeightLoss)}>
                        <span className="flex items-center gap-2 font-semibold"><Target className="h-4 w-4 text-emerald-500" /> Weight Loss Effects</span>
                        {cdsShowWeightLoss ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </Button>
                      {cdsShowWeightLoss && (
                        <div className="px-4 pb-4 space-y-3">
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {[5, 10, 15, 20].map((pct) => {
                              const key = `meets_${pct}_percent_target` as keyof NonNullable<typeof cdsAssessment.weightLossEffects>;
                              const met = cdsAssessment.weightLossEffects?.[key];
                              return (
                                <div key={pct} className={`rounded-lg p-2 text-center border ${met ? "bg-emerald-500/20 border-emerald-500/50" : "bg-muted/30 border-border"}`}>
                                  <p className="text-xs text-muted-foreground">≥{pct}%</p>
                                  <p className={`text-sm font-bold ${met ? "text-emerald-500" : "text-muted-foreground"}`}>{met ? "✓" : "—"}</p>
                                </div>
                              );
                            })}
                          </div>
                          {cdsAssessment.weightLossEffects.expected_benefits.length > 0 && (
                            <div className="space-y-1">
                              <p className="text-xs font-semibold text-muted-foreground">Expected Benefits:</p>
                              <div className="flex flex-wrap gap-1">
                                {cdsAssessment.weightLossEffects.expected_benefits.map((tag) => (
                                  <Badge key={tag} variant="secondary" className="text-xs">{BENEFIT_LABELS[tag]}</Badge>
                                ))}
                              </div>
                            </div>
                          )}
                          {cdsAssessment.weightLossEffects.look_ahead_intensive_lifestyle_like && (
                            <Alert className="border-emerald-500/30 bg-emerald-500/10">
                              <Target className="h-4 w-4" />
                              <AlertDescription className="text-xs">≥10% weight loss achieved — disease-modifying potential. If sustained long-term, associated with reduced all-cause and CV mortality.</AlertDescription>
                            </Alert>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Lifestyle Prescription */}
                    <div className="rounded-lg border border-blue-500/30 bg-blue-500/5">
                      <Button variant="ghost" className="w-full flex items-center justify-between p-4 h-auto" onClick={() => setCdsShowLifestyle(!cdsShowLifestyle)}>
                        <span className="flex items-center gap-2 font-semibold"><UtensilsCrossed className="h-4 w-4 text-blue-500" /> Lifestyle Prescription</span>
                        {cdsShowLifestyle ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </Button>
                      {cdsShowLifestyle && cdsAssessment.lifestylePrescription && (
                        <div className="px-4 pb-4 space-y-3">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="rounded-lg bg-card/50 border border-border p-3">
                              <p className="text-xs text-muted-foreground">Recommended Energy Deficit</p>
                              <p className="text-lg font-bold text-blue-500">{cdsAssessment.lifestylePrescription.recommended_energy_deficit_kcal_per_day} kcal/day</p>
                            </div>
                            <div className="rounded-lg bg-card/50 border border-border p-3">
                              <p className="text-xs text-muted-foreground">Target Energy Intake</p>
                              <p className="text-lg font-bold text-blue-500">{cdsAssessment.lifestylePrescription.target_energy_intake_kcal_per_day} kcal/day</p>
                            </div>
                          </div>
                          <div className="rounded-lg bg-card/50 border border-border p-3">
                            <p className="text-xs text-muted-foreground mb-1">Sex-Specific Reference Range</p>
                            <p className="text-sm font-medium">{cdsSex === "female" ? cdsAssessment.lifestylePrescription.sex_specific_reference_range.female_typical_range_kcal_per_day : cdsAssessment.lifestylePrescription.sex_specific_reference_range.male_typical_range_kcal_per_day} kcal/day</p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <Badge variant="outline" className="text-xs">Min metabolic benefit: {cdsAssessment.lifestylePrescription.minimum_weight_loss_for_metabolic_benefit_percent}%</Badge>
                            {cdsAssessment.lifestylePrescription.intensive_weight_loss_goals.map((goal) => (
                              <Badge key={goal} variant="outline" className="text-xs">Intensive goal: ≥{goal}%</Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Micronutrient Risk */}
                    <div className="rounded-lg border border-amber-500/30 bg-amber-500/5">
                      <Button variant="ghost" className="w-full flex items-center justify-between p-4 h-auto" onClick={() => setCdsShowMicronutrient(!cdsShowMicronutrient)}>
                        <span className="flex items-center gap-2 font-semibold"><FlaskConical className="h-4 w-4 text-amber-500" /> Micronutrient Risk Assessment</span>
                        {cdsShowMicronutrient ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </Button>
                      {cdsShowMicronutrient && (
                        <div className="px-4 pb-4 space-y-3">
                          <div className="flex flex-wrap gap-2">
                            {cdsAssessment.micronutrientRisk.consider_multivitamin_mineral_supplement && <Badge variant="default" className="bg-amber-500 text-xs">Consider MVI Supplement</Badge>}
                            {cdsAssessment.micronutrientRisk.micronutrient_screening_indicated && <Badge variant="default" className="bg-red-500 text-xs">Screening Indicated</Badge>}
                            {cdsAssessment.micronutrientRisk.age_over_50 && <Badge variant="outline" className="text-xs">Age &gt;50</Badge>}
                            {cdsAssessment.micronutrientRisk.underlying_malabsorption_condition && <Badge variant="outline" className="text-xs">Malabsorption</Badge>}
                          </div>
                          {cdsAssessment.micronutrientRisk.micronutrients_of_concern.length > 0 && (
                            <div className="space-y-1">
                              <p className="text-xs font-semibold text-muted-foreground">Micronutrients of Concern:</p>
                              <div className="flex flex-wrap gap-1">
                                {cdsAssessment.micronutrientRisk.micronutrients_of_concern.map((nutrient) => (
                                  <Badge key={nutrient} variant="secondary" className="text-xs">{MICRONUTRIENT_LABELS[nutrient]}</Badge>
                                ))}
                              </div>
                            </div>
                          )}
                          <div className="rounded-lg bg-card/50 border border-border p-3">
                            <p className="text-xs text-muted-foreground"><strong>Energy Intake:</strong> {cdsAssessment.micronutrientRisk.current_energy_intake_kcal_per_day} kcal/day{cdsAssessment.micronutrientRisk.current_energy_intake_kcal_per_day < 1200 && <span className="text-amber-500"> — Below 1200 kcal threshold</span>}</p>
                            <p className="text-xs text-muted-foreground mt-1"><strong>Screening Note:</strong> {cdsAssessment.micronutrientRisk.screening_frequency_note}</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Pharmacotherapy Eligibility */}
                    <div className="rounded-lg border border-rose-500/30 bg-rose-500/5">
                      <Button variant="ghost" className="w-full flex items-center justify-between p-4 h-auto" onClick={() => setCdsShowPharma(!cdsShowPharma)}>
                        <span className="flex items-center gap-2 font-semibold"><Pill className="h-4 w-4 text-rose-500" /> Pharmacotherapy Eligibility</span>
                        {cdsShowPharma ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </Button>
                      {cdsShowPharma && cdsAssessment.pharmacotherapyEligibility && (
                        <div className="px-4 pb-4 space-y-3">
                          <div className={`rounded-lg p-4 text-center border ${cdsAssessment.pharmacotherapyEligibility.eligible_for_anti_obesity_pharmacotherapy ? "bg-rose-500/20 border-rose-500/50" : "bg-muted/30 border-border"}`}>
                            <p className="text-xs text-muted-foreground">Eligibility Status</p>
                            <p className={`text-lg font-bold ${cdsAssessment.pharmacotherapyEligibility.eligible_for_anti_obesity_pharmacotherapy ? "text-rose-500" : "text-muted-foreground"}`}>
                              {cdsAssessment.pharmacotherapyEligibility.eligible_for_anti_obesity_pharmacotherapy ? "Eligible" : "Not Indicated"}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">Role: {cdsAssessment.pharmacotherapyEligibility.pharmacotherapy_role === "adjunct_to_lifestyle" ? "Adjunct to lifestyle intervention" : cdsAssessment.pharmacotherapyEligibility.pharmacotherapy_role}</p>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <div className="rounded-lg bg-card/50 border border-border p-3">
                              <p className="text-xs text-muted-foreground">Current BMI</p>
                              <p className="text-lg font-bold">{cdsAssessment.pharmacotherapyEligibility.bmi_kg_per_m2}</p>
                            </div>
                            <div className="rounded-lg bg-card/50 border border-border p-3">
                              <p className="text-xs text-muted-foreground">Comorbidities</p>
                              <p className="text-lg font-bold">{cdsAssessment.pharmacotherapyEligibility.comorbidities_list.length}</p>
                            </div>
                          </div>
                          {cdsAssessment.pharmacotherapyEligibility.comorbidities_list.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {cdsAssessment.pharmacotherapyEligibility.comorbidities_list.map((tag) => (
                                <Badge key={tag} variant="secondary" className="text-xs">{COMORBIDITY_LABELS[tag]}</Badge>
                              ))}
                            </div>
                          )}
                          <Alert className={cdsAssessment.pharmacotherapyEligibility.eligible_for_anti_obesity_pharmacotherapy ? "border-rose-500/30 bg-rose-500/10" : "border-border bg-muted/30"}>
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription className="text-xs">
                              {cdsAssessment.pharmacotherapyEligibility.eligible_for_anti_obesity_pharmacotherapy
                                ? "BMI ≥30 OR BMI ≥27 with ≥1 obesity-associated comorbidity. Anti-obesity pharmacotherapy is indicated as an adjunct to reduced-calorie eating pattern and physical activity."
                                : "Current BMI and comorbidity profile does not meet threshold for anti-obesity pharmacotherapy. Continue lifestyle intervention."}
                            </AlertDescription>
                          </Alert>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}

        {activeTab === "guidelines" && (
          <Card className="clinical-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <BookOpen className="h-5 w-5" />
                ADA 2025 Obesity Guidelines Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                The ADA 2025 Standards of Care include comprehensive recommendations for obesity management in diabetes:
              </p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>Weight loss targets: 3-7% (Grade A), &gt;10% (Grade B), &gt;15% (Grade B), &gt;20% (Grade A)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>Preferred agents: Tirzepatide, Semaglutide, Liraglutide</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>Metabolic surgery: BMI ≥30 (≥27.5 Asian) with uncontrolled T2DM</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>Early response: &gt;5% weight loss at 3 months predicts long-term success</span>
                </li>
              </ul>
              <p className="text-xs text-muted-foreground text-center mt-4">
                {ADA_2025_CITATION}
              </p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
