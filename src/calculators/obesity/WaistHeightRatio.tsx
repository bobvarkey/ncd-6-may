import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Ruler, Calculator, Info, ChevronDown, ChevronUp, Home, RotateCcw, Target, BookOpen } from "lucide-react";
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

type TabKey = "calculator" | "guidelines";

const TABS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  { key: "calculator", label: "Calculator", icon: <Target className="h-4 w-4" /> },
  { key: "guidelines", label: "Guidelines", icon: <BookOpen className="h-4 w-4" /> },
];

export default function WaistHeightRatio() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabKey>("calculator");
  const [result, setResult] = useState<WhtrResult | null>(null);
  const [showGuidance, setShowGuidance] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    reset: formReset,
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
    formReset();
  };

  function handleSmartParse(values: Record<string, string>) {
    Object.entries(values).forEach(([key, value]) => {
      // WHtR uses waist and height - just set form fields
    });
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky Header */}
      <div className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="mx-auto max-w-2xl px-4">
          <div className="flex items-center gap-3 py-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-pink-500 to-rose-600 shadow-md">
              <Ruler className="h-5 w-5 text-foreground" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="font-display text-xl font-extrabold tracking-tight bg-gradient-to-r from-pink-500 via-rose-500 to-orange-500 bg-clip-text text-transparent truncate">
                Waist-to-Height Ratio
              </h1>
              <p className="text-xs font-medium text-destructive dark:text-destructive truncate">
                Central Obesity Assessment
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
          <div className="flex gap-0.5 pb-2 overflow-x-auto no-print">
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

      <main className="mx-auto max-w-2xl px-4 py-5">
        {activeTab === "calculator" && (
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
                  {...register("ethnicity")}
                >
                  <SelectTrigger id="ethnicity" className="bg-card border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem
                      value="standard"
                      className="text-foreground focus:bg-muted focus:text-foreground"
                    >
                      Europid/African/American
                    </SelectItem>
                    <SelectItem
                      value="asian"
                      className="text-foreground focus:bg-muted focus:text-foreground"
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
                  className="bg-card border-border"
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
                  className="bg-card border-border"
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
                          <div className="p-3 rounded bg-warning/100/10 border border-amber-500/30">
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
        )}

        {activeTab === "guidelines" && (
          <div className="space-y-4">
            <Card className="clinical-card border-primary/20">
              <CardHeader>
                <CardTitle className="text-lg">WHtR Interpretation</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-warning/10 border border-yellow-500/20">
                    <span className="text-sm">&lt; 0.40</span>
                    <span className="text-sm font-medium text-yellow-500">Underweight</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                    <span className="text-sm">0.40 - 0.49</span>
                    <span className="text-sm font-medium text-emerald-500">Healthy</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-warning/100/10 border border-amber-500/20">
                    <span className="text-sm">0.50 - 0.59</span>
                    <span className="text-sm font-medium text-amber-500">Increased Risk</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-destructive/100/10 border border-red-500/20">
                    <span className="text-sm">≥ 0.60</span>
                    <span className="text-sm font-medium text-red-500">High Risk</span>
                  </div>
                </div>              </CardContent>
            </Card>

            <Card className="clinical-card border-primary/20">
              <CardHeader>
                <CardTitle className="text-lg">Waist Circumference Thresholds</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium mb-2">Standard (Europid/African/American)</p>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="p-2 rounded bg-muted/30">Men: ≥94 cm (⬆️ risk), ≥102 cm (high risk)</div>
                      <div className="p-2 rounded bg-muted/30">Women: ≥80 cm (⬆️ risk), ≥88 cm (high risk)</div>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-2">South/East Asian</p>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="p-2 rounded bg-muted/30">Men: ≥90 cm (high risk)</div>
                      <div className="p-2 rounded bg-muted/30">Women: ≥80 cm (high risk)</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
