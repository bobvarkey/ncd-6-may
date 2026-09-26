# Obesity Tab Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a 4th Obesity category tab with BMI Calculator (ethnicity-aware thresholds for Standard WHO, Asian-Pacific, and Indian populations) and Waist-to-Height Ratio Calculator, including treatment guidelines.

**Architecture:** Create two calculator components following the existing calculator patterns in the codebase. Store shared threshold data and treatment guidelines in a constants file. Update Home.tsx to add the Obesity category and App.tsx to add routes.

**Tech Stack:** React 18, TypeScript, Tailwind CSS 3, shadcn/ui, react-hook-form + zod, lucide-react icons

---

## File Structure

```
src/
├── calculators/
│   └── obesity/
│       ├── obesity-guidelines.ts   # Shared thresholds, categories, treatment data
│       ├── BmiCalculator.tsx       # BMI calculator with ethnicity selector
│       └── WaistHeightRatio.tsx    # WHtR calculator
├── pages/
│   └── Home.tsx                    # Add Obesity category card
└── App.tsx                         # Add obesity routes
```

---

## Reference Files

Before implementing, review these existing calculators for patterns:
- `src/calculators/htn/GfrCalculator.tsx` - Good example of form + result pattern
- `src/calculators/lipids/LipidPanel.tsx` - Example with multiple inputs and validation
- `src/pages/Home.tsx` - See how categories are structured

---

### Task 1: Create obesity-guidelines.ts constants file

**Files:**
- Create: `src/calculators/obesity/obesity-guidelines.ts`

**Purpose:** Centralize all BMI thresholds, WHtR categories, and treatment guidelines.

- [ ] **Step 1: Write the constants file**

```typescript
export type EthnicityType = "standard" | "asian-pacific" | "indian";
export type BmiCategory = "underweight" | "normal" | "overweight" | "obese";
export type RiskLevel = "underweight" | "healthy" | "increased" | "high";

export interface BmiThreshold {
  max: number;
  category: BmiCategory;
  label: string;
  color: string; // tailwind color class
}

export interface EthnicityGuideline {
  id: EthnicityType;
  name: string;
  description: string;
  thresholds: BmiThreshold[];
}

export const ETHNICITY_GUIDELINES: EthnicityGuideline[] = [
  {
    id: "standard",
    name: "Standard WHO",
    description: "For Europid, African, and other non-Asian populations",
    thresholds: [
      { max: 18.5, category: "underweight", label: "Underweight", color: "text-yellow-500" },
      { max: 25, category: "normal", label: "Normal", color: "text-emerald-500" },
      { max: 30, category: "overweight", label: "Overweight", color: "text-amber-500" },
      { max: 35, category: "obese", label: "Obese Class I", color: "text-orange-500" },
      { max: 40, category: "obese", label: "Obese Class II", color: "text-red-500" },
      { max: Infinity, category: "obese", label: "Obese Class III", color: "text-red-700" },
    ],
  },
  {
    id: "asian-pacific",
    name: "WHO Asian-Pacific",
    description: "For East Asian, Southeast Asian, and Pacific populations",
    thresholds: [
      { max: 18.5, category: "underweight", label: "Underweight", color: "text-yellow-500" },
      { max: 23, category: "normal", label: "Normal", color: "text-emerald-500" },
      { max: 25, category: "overweight", label: "Overweight/At Risk", color: "text-amber-500" },
      { max: 27.5, category: "obese", label: "Obese Class I", color: "text-orange-500" },
      { max: Infinity, category: "obese", label: "Obese Class II+", color: "text-red-500" },
    ],
  },
  {
    id: "indian",
    name: "Indian-Specific (ICMR)",
    description: "For South Asian/Indian populations with higher metabolic risk",
    thresholds: [
      { max: 18.5, category: "underweight", label: "Underweight", color: "text-yellow-500" },
      { max: 22.9, category: "normal", label: "Normal", color: "text-emerald-500" },
      { max: 24.9, category: "overweight", label: "Overweight", color: "text-amber-500" },
      { max: 29.9, category: "obese", label: "Obese", color: "text-orange-500" },
      { max: Infinity, category: "obese", label: "Severely Obese", color: "text-red-500" },
    ],
  },
];

export interface WhtrCategory {
  max: number;
  riskLevel: RiskLevel;
  label: string;
  color: string;
  action: string;
}

export const WHTR_CATEGORIES: WhtrCategory[] = [
  { max: 0.4, riskLevel: "underweight", label: "Underweight", color: "text-yellow-500", action: "Nutritional assessment recommended" },
  { max: 0.5, riskLevel: "healthy", label: "Healthy", color: "text-emerald-500", action: "Maintain current lifestyle" },
  { max: 0.6, riskLevel: "increased", label: "Increased Risk", color: "text-amber-500", action: "Lifestyle modification recommended" },
  { max: Infinity, riskLevel: "high", label: "High Risk", color: "text-red-500", action: "Intensive intervention required" },
];

export interface WaistThreshold {
  gender: "male" | "female";
  ethnicity: "standard" | "asian";
  threshold: number;
  label: string;
}

export const WAIST_THRESHOLDS: WaistThreshold[] = [
  { gender: "male", ethnicity: "standard", threshold: 94, label: "Central obesity" },
  { gender: "female", ethnicity: "standard", threshold: 80, label: "Central obesity" },
  { gender: "male", ethnicity: "asian", threshold: 90, label: "Central obesity" },
  { gender: "female", ethnicity: "asian", threshold: 80, label: "Central obesity" },
];

export interface TreatmentGuideline {
  bmiMin: number;
  bmiMax: number;
  ethnicity?: EthnicityType;
  recommendations: string[];
  medications?: string[];
  surgeryConsideration?: boolean;
}

export const TREATMENT_GUIDELINES: TreatmentGuideline[] = [
  {
    bmiMin: 0,
    bmiMax: 18.5,
    recommendations: [
      "Nutritional assessment for underweight",
      "Rule out underlying conditions (malabsorption, eating disorders, hyperthyroidism)",
      "Refer to dietitian for healthy weight gain plan",
    ],
  },
  {
    bmiMin: 18.5,
    bmiMax: 24.9,
    recommendations: [
      "Maintain healthy lifestyle",
      "Regular physical activity (150-300 min/week)",
      "Balanced diet (Mediterranean/DASH patterns)",
      "Annual weight monitoring",
    ],
  },
  {
    bmiMin: 25,
    bmiMax: 29.9,
    ethnicity: "standard",
    recommendations: [
      "Weight loss goal: 5-10% over 3-6 months",
      "Caloric deficit: 500-750 kcal/day",
      "Physical activity: 150-300 min/week moderate intensity",
      "Behavioral interventions: self-monitoring, goal setting",
      "Screen for comorbidities (HTN, T2DM, dyslipidemia)",
    ],
  },
  {
    bmiMin: 23,
    bmiMax: 24.9,
    ethnicity: "asian-pacific",
    recommendations: [
      "Weight loss goal: 5-10% over 3-6 months (earlier intervention for Asian populations)",
      "Caloric deficit: 500-750 kcal/day",
      "Physical activity: 150-300 min/week",
      "Emphasize waist circumference assessment (higher visceral fat risk)",
      "Screen for metabolic syndrome components",
    ],
  },
  {
    bmiMin: 23,
    bmiMax: 24.9,
    ethnicity: "indian",
    recommendations: [
      "Weight loss goal: 5-10% over 3-6 months",
      "Higher metabolic risk at lower BMI - prioritize diabetes screening",
      "Emphasize carbohydrate quality (low glycemic index foods)",
      "Monitor for glucose intolerance even with 'normal' BMI",
      "Physical activity: 150-300 min/week + resistance training",
    ],
  },
  {
    bmiMin: 30,
    bmiMax: 34.9,
    ethnicity: "standard",
    recommendations: [
      "Weight loss goal: 10% over 6 months",
      "Intensive lifestyle intervention",
      "Consider pharmacotherapy if lifestyle alone insufficient",
      "Screen and treat all obesity-related comorbidities",
    ],
    medications: ["Orlistat", "Liraglutide 3.0mg (if available)", "Naltrexone-bupropion (if available)"],
  },
  {
    bmiMin: 25,
    bmiMax: 27.4,
    ethnicity: "asian-pacific",
    recommendations: [
      "Weight loss goal: 10% over 6 months",
      "Consider pharmacotherapy at BMI ≥25 with metabolic syndrome",
      "Intensive lifestyle intervention",
      "Monitor HbA1c, lipids, blood pressure",
    ],
    medications: ["Orlistat", "Liraglutide 3.0mg (if available)"],
  },
  {
    bmiMin: 25,
    bmiMax: 29.9,
    ethnicity: "indian",
    recommendations: [
      "Weight loss goal: 10% over 6 months",
      "Strong consideration for pharmacotherapy at BMI ≥25",
      "Intensive lifestyle intervention with cultural dietary adaptations",
      "Aggressive management of metabolic comorbidities",
      "Consider bariatric surgery if BMI ≥30 with uncontrolled T2DM",
    ],
    medications: ["Orlistat (widely available)", "Liraglutide 3.0mg", "Metformin if prediabetic"],
  },
  {
    bmiMin: 35,
    bmiMax: 39.9,
    ethnicity: "standard",
    recommendations: [
      "Weight loss goal: 15% over 6-12 months",
      "Pharmacotherapy recommended",
      "Consider bariatric surgery if comorbidities present",
      "Multidisciplinary team approach",
    ],
    medications: ["Orlistat", "Liraglutide 3.0mg", "Phentermine-topiramate (where approved)"],
    surgeryConsideration: true,
  },
  {
    bmiMin: 27.5,
    bmiMax: 32.4,
    ethnicity: "asian-pacific",
    recommendations: [
      "Weight loss goal: 15% over 6-12 months",
      "Pharmacotherapy recommended",
      "Consider bariatric surgery if BMI ≥32.5 with T2DM or metabolic syndrome",
      "Multidisciplinary team approach",
    ],
    medications: ["Orlistat", "Liraglutide 3.0mg", "Naltrexone-bupropion (if available)"],
    surgeryConsideration: true,
  },
  {
    bmiMin: 30,
    bmiMax: 32.4,
    ethnicity: "indian",
    recommendations: [
      "Weight loss goal: 15% over 6-12 months",
      "Pharmacotherapy strongly recommended",
      "Consider bariatric surgery if BMI ≥30 with poorly controlled T2DM",
      "Multidisciplinary team approach with endocrinologist referral",
    ],
    medications: ["Orlistat", "Liraglutide 3.0mg", "Consider GLP-1 agonists"],
    surgeryConsideration: true,
  },
  {
    bmiMin: 40,
    bmiMax: Infinity,
    ethnicity: "standard",
    recommendations: [
      "Weight loss goal: 20% over 12 months",
      "Bariatric surgery referral indicated",
      "Pre-surgical evaluation required",
      "Long-term follow-up essential",
    ],
    surgeryConsideration: true,
  },
  {
    bmiMin: 32.5,
    bmiMax: Infinity,
    ethnicity: "asian-pacific",
    recommendations: [
      "Weight loss goal: 20% over 12 months",
      "Bariatric surgery referral indicated at BMI ≥32.5",
      "Pre-surgical evaluation required",
      "Long-term follow-up essential",
    ],
    surgeryConsideration: true,
  },
  {
    bmiMin: 32.5,
    bmiMax: Infinity,
    ethnicity: "indian",
    recommendations: [
      "Weight loss goal: 20% over 12 months",
      "Bariatric surgery referral indicated at BMI ≥32.5 (or ≥30 with uncontrolled T2DM)",
      "Pre-surgical evaluation required",
      "Long-term follow-up essential",
    ],
    surgeryConsideration: true,
  },
];

// Helper functions
export function getBmiCategory(bmi: number, ethnicity: EthnicityType): BmiThreshold {
  const guideline = ETHNICITY_GUIDELINES.find((g) => g.id === ethnicity);
  if (!guideline) throw new Error(`Unknown ethnicity: ${ethnicity}`);
  
  for (const threshold of guideline.thresholds) {
    if (bmi < threshold.max) return threshold;
  }
  return guideline.thresholds[guideline.thresholds.length - 1];
}

export function getWhtrCategory(whtr: number): WhtrCategory {
  for (const category of WHTR_CATEGORIES) {
    if (whtr < category.max) return category;
  }
  return WHTR_CATEGORIES[WHTR_CATEGORIES.length - 1];
}

export function getWaistThreshold(gender: "male" | "female", ethnicity: "standard" | "asian"): number {
  const threshold = WAIST_THRESHOLDS.find(
    (t) => t.gender === gender && t.ethnicity === ethnicity
  );
  return threshold?.threshold || (gender === "male" ? 94 : 80);
}

export function getTreatmentGuidelines(
  bmi: number,
  ethnicity: EthnicityType
): TreatmentGuideline | undefined {
  // First try to find exact ethnicity match
  let guideline = TREATMENT_GUIDELINES.find(
    (g) =>
      bmi >= g.bmiMin &&
      bmi < g.bmiMax &&
      g.ethnicity === ethnicity
  );
  
  // Fallback to standard if no ethnicity-specific guideline found
  if (!guideline && ethnicity !== "standard") {
    guideline = TREATMENT_GUIDELINES.find(
      (g) => bmi >= g.bmiMin && bmi < g.bmiMax && g.ethnicity === "standard"
    );
  }
  
  // Final fallback - any matching BMI range
  if (!guideline) {
    guideline = TREATMENT_GUIDELINES.find(
      (g) => bmi >= g.bmiMin && bmi < g.bmiMax && !g.ethnicity
    );
  }
  
  return guideline;
}
```

- [ ] **Step 2: Commit the constants file**

```bash
git add src/calculators/obesity/obesity-guidelines.ts
git commit -m "feat: add obesity guidelines constants with ethnicity-specific thresholds

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### Task 2: Create BmiCalculator.tsx

**Files:**
- Create: `src/calculators/obesity/BmiCalculator.tsx`

**Purpose:** BMI calculator with ethnicity selector and treatment recommendations display.

- [ ] **Step 1: Write the BMI Calculator component**

```typescript
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Scale, Calculator, Info, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  EthnicityType,
  ETHNICITY_GUIDELINES,
  getBmiCategory,
  getTreatmentGuidelines,
} from "./obesity-guidelines";

const bmiSchema = z.object({
  height: z.coerce.number().min(100).max(250).describe("Height in cm"),
  weight: z.coerce.number().min(30).max(300).describe("Weight in kg"),
  ethnicity: z.enum(["standard", "asian-pacific", "indian"] as const),
});

type BmiFormData = z.infer<typeof bmiSchema>;

interface BmiResult {
  bmi: number;
  category: string;
  color: string;
  ethnicityName: string;
}

export default function BmiCalculator() {
  const [result, setResult] = useState<BmiResult | null>(null);
  const [showTreatment, setShowTreatment] = useState(false);
  const [treatmentData, setTreatmentData] = useState<ReturnType<typeof getTreatmentGuidelines>>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<BmiFormData>({
    resolver: zodResolver(bmiSchema),
    defaultValues: {
      ethnicity: "standard",
    },
  });

  const selectedEthnicity = watch("ethnicity") || "standard";

  const onSubmit = (data: BmiFormData) => {
    const heightM = data.height / 100;
    const bmi = data.weight / (heightM * heightM);
    const roundedBmi = Math.round(bmi * 10) / 10;
    
    const category = getBmiCategory(roundedBmi, data.ethnicity);
    const guideline = ETHNICITY_GUIDELINES.find((g) => g.id === data.ethnicity);
    
    const treatment = getTreatmentGuidelines(roundedBmi, data.ethnicity);
    
    setResult({
      bmi: roundedBmi,
      category: category.label,
      color: category.color,
      ethnicityName: guideline?.name || "Standard WHO",
    });
    setTreatmentData(treatment);
    setShowTreatment(false);
  };

  const reset = () => {
    setResult(null);
    setTreatmentData(null);
    setShowTreatment(false);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 px-6 py-5">
        <div className="flex items-center gap-2">
          <Scale className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight">BMI Calculator</h1>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Body Mass Index with ethnicity-specific thresholds
        </p>
      </header>

      <main className="mx-auto max-w-2xl px-6 py-8">
        <Card className="clinical-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Calculator className="h-5 w-5" />
              Enter Measurements
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Ethnicity Selector */}
              <div className="space-y-2">
                <Label htmlFor="ethnicity">Ethnicity / Population Group</Label>
                <Select
                  value={selectedEthnicity}
                  onValueChange={(value: EthnicityType) => {
                    // This is handled by react-hook-form
                  }}
                >
                  <SelectTrigger id="ethnicity" className="bg-slate-900 border-slate-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-700">
                    {ETHNICITY_GUIDELINES.map((guideline) => (
                      <SelectItem
                        key={guideline.id}
                        value={guideline.id}
                        className="text-slate-100 focus:bg-slate-800 focus:text-slate-100"
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
                <Label htmlFor="height">Height (cm)</Label>
                <Input
                  id="height"
                  type="number"
                  placeholder="e.g., 170"
                  className="bg-slate-900 border-slate-700"
                  {...register("height", { valueAsNumber: true })}
                />
                {errors.height && (
                  <p className="text-xs text-red-500">Please enter a valid height (100-250 cm)</p>
                )}
              </div>

              {/* Weight Input */}
              <div className="space-y-2">
                <Label htmlFor="weight">Weight (kg)</Label>
                <Input
                  id="weight"
                  type="number"
                  placeholder="e.g., 70"
                  className="bg-slate-900 border-slate-700"
                  {...register("weight", { valueAsNumber: true })}
                />
                {errors.weight && (
                  <p className="text-xs text-red-500">Please enter a valid weight (30-300 kg)</p>
                )}
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
                </div>

                {/* Treatment Recommendations Toggle */}
                {treatmentData && (
                  <div className="space-y-3">
                    <Button
                      variant="outline"
                      className="w-full flex items-center justify-between"
                      onClick={() => setShowTreatment(!showTreatment)}
                    >
                      <span className="flex items-center gap-2">
                        <Info className="h-4 w-4" />
                        Treatment Recommendations
                      </span>
                      {showTreatment ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>

                    {showTreatment && (
                      <Alert className="border-amber-500/50 bg-amber-500/10">
                        <AlertDescription className="space-y-3">
                          <p className="font-medium">Recommended Actions:</p>
                          <ul className="list-disc pl-4 space-y-1">
                            {treatmentData.recommendations.map((rec, i) => (
                              <li key={i} className="text-sm">{rec}</li>
                            ))}
                          </ul>
                          
                          {treatmentData.medications && treatmentData.medications.length > 0 && (
                            <>
                              <p className="font-medium mt-4">Consider Pharmacotherapy:</p>
                              <ul className="list-disc pl-4 space-y-1">
                                {treatmentData.medications.map((med, i) => (
                                  <li key={i} className="text-sm">{med}</li>
                                ))}
                              </ul>
                            </>
                          )}
                          
                          {treatmentData.surgeryConsideration && (
                            <div className="mt-4 p-3 rounded bg-red-500/20 border border-red-500/30">
                              <p className="text-sm font-medium text-red-400">
                                Consider bariatric surgery referral based on current BMI
                              </p>
                            </div>
                          )}
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
```

- [ ] **Step 2: Commit the BMI Calculator**

```bash
git add src/calculators/obesity/BmiCalculator.tsx
git commit -m "feat: add BMI calculator with ethnicity-aware thresholds

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### Task 3: Create WaistHeightRatio.tsx

**Files:**
- Create: `src/calculators/obesity/WaistHeightRatio.tsx`

**Purpose:** Waist-to-Height Ratio calculator with central obesity assessment and treatment guidance.

- [ ] **Step 1: Write the WHtR Calculator component**

```typescript
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Ruler, Calculator, Info, ChevronDown, ChevronUp, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  getWhtrCategory,
  getWaistThreshold,
  WhtrCategory,
} from "./obesity-guidelines";

const whtrSchema = z.object({
  waist: z.coerce.number().min(50).max(200).describe("Waist circumference in cm"),
  height: z.coerce.number().min(100).max(250).describe("Height in cm"),
  gender: z.enum(["male", "female"] as const),
  ethnicity: z.enum(["standard", "asian"] as const),
});

type WhtrFormData = z.infer<typeof whtrSchema>;

interface WhtrResult {
  whtr: number;
  category: WhtrCategory;
  waistThreshold: number;
  isCentralObese: boolean;
}

export default function WaistHeightRatio() {
  const [result, setResult] = useState<WhtrResult | null>(null);
  const [showGuidance, setShowGuidance] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<WhtrFormData>({
    resolver: zodResolver(whtrSchema),
    defaultValues: {
      gender: "male",
      ethnicity: "standard",
    },
  });

  const selectedGender = watch("gender") || "male";
  const selectedEthnicity = watch("ethnicity") || "standard";

  const onSubmit = (data: WhtrFormData) => {
    const whtr = data.waist / data.height;
    const roundedWhtr = Math.round(whtr * 100) / 100;
    
    const category = getWhtrCategory(roundedWhtr);
    const waistThreshold = getWaistThreshold(data.gender, data.ethnicity);
    const isCentralObese = data.waist >= waistThreshold;
    
    setResult({
      whtr: roundedWhtr,
      category,
      waistThreshold,
      isCentralObese,
    });
    setShowGuidance(false);
  };

  const reset = () => {
    setResult(null);
    setShowGuidance(false);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 px-6 py-5">
        <div className="flex items-center gap-2">
          <Ruler className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight">Waist-to-Height Ratio</h1>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Central obesity assessment with ethnicity-specific thresholds
        </p>
      </header>

      <main className="mx-auto max-w-2xl px-6 py-8">
        <Card className="clinical-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Calculator className="h-5 w-5" />
              Enter Measurements
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Gender Selection */}
              <div className="space-y-2">
                <Label>Gender</Label>
                <RadioGroup
                  defaultValue="male"
                  className="flex gap-4"
                  {...register("gender")}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="male" id="male" />
                    <Label htmlFor="male" className="cursor-pointer">Male</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="female" id="female" />
                    <Label htmlFor="female" className="cursor-pointer">Female</Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Ethnicity Selector */}
              <div className="space-y-2">
                <Label htmlFor="ethnicity">Population Group</Label>
                <Select
                  value={selectedEthnicity}
                  onValueChange={(value: "standard" | "asian") => {
                    // Handled by form
                  }}
                >
                  <SelectTrigger id="ethnicity" className="bg-slate-900 border-slate-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-700">
                    <SelectItem
                      value="standard"
                      className="text-slate-100 focus:bg-slate-800 focus:text-slate-100"
                    >
                      Europid/African/American
                    </SelectItem>
                    <SelectItem
                      value="asian"
                      className="text-slate-100 focus:bg-slate-800 focus:text-slate-100"
                    >
                      South Asian/East Asian
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Waist circumference thresholds differ by ethnicity
                </p>
              </div>

              {/* Height Input */}
              <div className="space-y-2">
                <Label htmlFor="height">Height (cm)</Label>
                <Input
                  id="height"
                  type="number"
                  placeholder="e.g., 170"
                  className="bg-slate-900 border-slate-700"
                  {...register("height", { valueAsNumber: true })}
                />
                {errors.height && (
                  <p className="text-xs text-red-500">Please enter a valid height (100-250 cm)</p>
                )}
              </div>

              {/* Waist Input */}
              <div className="space-y-2">
                <Label htmlFor="waist">Waist Circumference (cm)</Label>
                <Input
                  id="waist"
                  type="number"
                  placeholder="e.g., 90"
                  className="bg-slate-900 border-slate-700"
                  {...register("waist", { valueAsNumber: true })}
                />
                {errors.waist && (
                  <p className="text-xs text-red-500">
                    Please enter a valid waist measurement (50-200 cm)
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  Measure at the level of the umbilicus or midpoint between lower rib and iliac crest
                </p>
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-3">
                <Button type="submit" className="flex-1">
                  Calculate WHtR
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
                    <p className="text-sm text-muted-foreground">Waist-to-Height Ratio</p>
                    <p className="text-5xl font-bold text-primary">{result.whtr.toFixed(2)}</p>
                    <p className={`mt-2 text-lg font-medium ${result.category.color}`}>
                      {result.category.label}
                    </p>
                  </div>

                  {/* Central Obesity Status */}
                  <div className="mt-4 pt-4 border-t border-border">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Central Obesity Status</span>
                      <span className={`font-medium ${result.isCentralObese ? "text-red-500" : "text-emerald-500"}`}>
                        {result.isCentralObese ? "Present" : "Absent"}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Threshold: {result.waistThreshold} cm for {selectedGender === "male" ? "men" : "women"} 
                      ({selectedEthnicity === "asian" ? "Asian" : "standard"} criteria)
                    </p>
                  </div>
                </div>

                {/* Guidance Toggle */}
                <div className="space-y-3">
                  <Button
                    variant="outline"
                    className="w-full flex items-center justify-between"
                    onClick={() => setShowGuidance(!showGuidance)}
                  >
                    <span className="flex items-center gap-2">
                      <Info className="h-4 w-4" />
                      Clinical Guidance
                    </span>
                    {showGuidance ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>

                  {showGuidance && (
                    <Alert className="border-primary/50 bg-primary/5">
                      <AlertDescription className="space-y-4">
                        <div>
                          <p className="font-medium">Recommended Action:</p>
                          <p className="text-sm mt-1">{result.category.action}</p>
                        </div>

                        <div className="pt-3 border-t border-border">
                          <p className="font-medium text-sm">WHtR Interpretation Guide:</p>
                          <ul className="mt-2 space-y-1 text-xs">
                            <li className="flex justify-between">
                              <span>&lt; 0.40</span>
                              <span className="text-yellow-500">Underweight</span>
                            </li>
                            <li className="flex justify-between">
                              <span>0.40 - 0.49</span>
                              <span className="text-emerald-500">Healthy</span>
                            </li>
                            <li className="flex justify-between">
                              <span>0.50 - 0.59</span>
                              <span className="text-amber-500">Increased Risk</span>
                            </li>
                            <li className="flex justify-between">
                              <span>≥ 0.60</span>
                              <span className="text-red-500">High Risk</span>
                            </li>
                          </ul>
                        </div>

                        {result.isCentralObese && (
                          <div className="p-3 rounded bg-amber-500/10 border border-amber-500/30">
                            <p className="text-sm">
                              <strong>Note:</strong> Central obesity is associated with increased 
                              cardiovascular and metabolic risk, even with normal BMI. Consider 
                              comprehensive metabolic screening.
                            </p>
                          </div>
                        )}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
```

- [ ] **Step 2: Commit the WHtR Calculator**

```bash
git add src/calculators/obesity/WaistHeightRatio.tsx
git commit -m "feat: add Waist-to-Height Ratio calculator with ethnicity-specific thresholds

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### Task 4: Update Home.tsx with Obesity category

**Files:**
- Modify: `src/pages/Home.tsx`

**Purpose:** Add the Obesity category card with Scale icon and links to the two calculators.

- [ ] **Step 1: Update Home.tsx**

Add import and update the categories array:

```typescript
import { Link } from "react-router-dom";
import { Activity, Droplets, Heart, Scale } from "lucide-react";  // ADD Scale import

const categories = [
  // ... existing diabetes, lipids, htn categories ...
  {
    id: "obesity",
    label: "Obesity",
    icon: Scale,
    calculators: [
      { name: "BMI Calculator", path: "/obesity/bmi-calculator" },
      { name: "Waist-to-Height Ratio", path: "/obesity/waist-height-ratio" },
    ],
  },
];

// Rest of the component remains the same
```

**Full file with changes:**

```typescript
import { Link } from "react-router-dom";
import { Activity, Droplets, Heart, Scale } from "lucide-react";

const categories = [
  {
    id: "diabetes",
    label: "Diabetes",
    icon: Activity,
    calculators: [
      { name: "Insulin Titration", path: "/insulin-titration" },
      { name: "Sliding Scale Insulin", path: "/sliding-scale" },
      { name: "Hypoglycemia Risk", path: "/hypo-risk" },
      { name: "Renal Dose Adjustment", path: "/renal-dosing" },
    ],
  },
  {
    id: "lipids",
    label: "Lipids",
    icon: Droplets,
    calculators: [
      { name: "Lipid Panel", path: "/lipid-panel" },
      { name: "ASCVD Risk", path: "/ascvd-risk" },
    ],
  },
  {
    id: "htn",
    label: "Hypertension",
    icon: Heart,
    calculators: [
      { name: "GFR Calculator", path: "/gfr-calculator" },
      { name: "Drug Interactions", path: "/drug-interactions" },
    ],
  },
  {
    id: "obesity",
    label: "Obesity",
    icon: Scale,
    calculators: [
      { name: "BMI Calculator", path: "/obesity/bmi-calculator" },
      { name: "Waist-to-Height Ratio", path: "/obesity/waist-height-ratio" },
    ],
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 px-6 py-5">
        <h1 className="text-2xl font-bold tracking-tight">ClinCalc NCD</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Clinical calculators for non-communicable disease management
        </p>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-10">
        <div className="grid gap-6 md:grid-cols-4">  {/* Changed from 3 to 4 columns */}
          {categories.map(({ id, label, icon: Icon, calculators }) => (
            <div key={id} className="clinical-card space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <h2 className="text-lg font-semibold">{label}</h2>
              </div>
              <ul className="space-y-1">
                {calculators.map(({ name, path }) => (
                  <li key={path}>
                    <Link
                      to={path}
                      className="block rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                    >
                      {name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
```

**Changes made:**
1. Added `Scale` import from lucide-react
2. Added obesity category to categories array
3. Changed grid from `md:grid-cols-3` to `md:grid-cols-4`

- [ ] **Step 2: Commit the Home.tsx update**

```bash
git add src/pages/Home.tsx
git commit -m "feat: add Obesity category to home page with Scale icon

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### Task 5: Update App.tsx with obesity routes

**Files:**
- Modify: `src/App.tsx`

**Purpose:** Add imports and routes for the two obesity calculators.

- [ ] **Step 1: Update App.tsx**

Add imports and routes:

```typescript
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "@/pages/Home";
import InsulinTitration from "@/calculators/diabetes/InsulinTitration";
import HypoRiskCalculator from "@/calculators/diabetes/HypoRisk";
import RenalDoseAdjustment from "@/calculators/diabetes/RenalDosing";
import SlidingScaleInsulin from "@/calculators/diabetes/SlidingScale";
import AscvdEmr from "@/calculators/lipids/AscvdRisk";
import LipidCalculator from "@/calculators/lipids/LipidPanel";
import GfrCalculator from "@/calculators/htn/GfrCalculator";
import DrugInteractionChecker from "@/calculators/htn/DrugInteractions";
import BmiCalculator from "@/calculators/obesity/BmiCalculator";           // ADD
import WaistHeightRatio from "@/calculators/obesity/WaistHeightRatio";     // ADD
import NotFound from "@/components/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/insulin-titration" element={<InsulinTitration />} />
          <Route path="/sliding-scale" element={<SlidingScaleInsulin />} />
          <Route path="/hypo-risk" element={<HypoRiskCalculator />} />
          <Route path="/renal-dosing" element={<RenalDoseAdjustment />} />
          <Route path="/lipid-panel" element={<LipidCalculator />} />
          <Route path="/ascvd-risk" element={<AscvdEmr />} />
          <Route path="/gfr-calculator" element={<GfrCalculator />} />
          <Route path="/drug-interactions" element={<DrugInteractionChecker />} />
          <Route path="/obesity/bmi-calculator" element={<BmiCalculator />} />         // ADD
          <Route path="/obesity/waist-height-ratio" element={<WaistHeightRatio />} />  // ADD
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
```

- [ ] **Step 2: Commit the App.tsx update**

```bash
git add src/App.tsx
git commit -m "feat: add obesity calculator routes to App.tsx

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Self-Review Checklist

**1. Spec Coverage:**
- ✅ BMI Calculator with ethnicity selector (Standard WHO, Asian-Pacific, Indian)
- ✅ Waist-to-Height Ratio calculator with gender/ethnicity selectors
- ✅ Treatment guidelines for each category
- ✅ Home.tsx category card with Scale icon
- ✅ App.tsx routes for both calculators

**2. Placeholder Scan:**
- ✅ No "TBD", "TODO", or incomplete sections
- ✅ All code blocks contain actual implementation
- ✅ No vague requirements

**3. Type Consistency:**
- ✅ `EthnicityType` is consistently used across files
- ✅ `BmiCategory` and `RiskLevel` types are properly defined
- ✅ Function signatures match between guidelines.ts and components

**4. Follows Existing Patterns:**
- ✅ Uses existing shadcn/ui components (Card, Input, Select, Button, Alert)
- ✅ Follows same form pattern with react-hook-form + zod
- ✅ Matches existing calculator structure (header, form, result display)
- ✅ Uses clinical-card class for consistent styling

---

## Testing Instructions

**Manual Testing Steps:**

1. **Navigate to Home page**
   - Verify 4 category cards display (Diabetes, Lipids, HTN, Obesity)
   - Verify Obesity card has Scale icon

2. **Test BMI Calculator**
   - Click "BMI Calculator" from Obesity card
   - Test with Standard WHO: Height 170cm, Weight 70kg → Expect BMI 24.2, Normal
   - Switch to Asian-Pacific: Same values → Expect BMI 24.2, Overweight/At Risk
   - Test edge cases: Height 100cm (min), Height 250cm (max)
   - Verify treatment recommendations display and toggle correctly

3. **Test Waist-to-Height Ratio**
   - Click "Waist-to-Height Ratio" from Obesity card
   - Test: Male, Asian, Height 170cm, Waist 90cm → WHtR 0.53, Increased Risk
   - Test: Female, Standard, Height 160cm, Waist 85cm → Check central obesity threshold
   - Verify guidance section expands/collapses

4. **Navigation**
   - Test browser back/forward between calculators
   - Verify direct URL access to `/obesity/bmi-calculator` works
   - Verify direct URL access to `/obesity/waist-height-ratio` works

---

## Post-Implementation

After all tasks complete:
1. Run `git log --oneline` to verify commits
2. Run `git push` to push changes to remote
3. Verify deployment works correctly
