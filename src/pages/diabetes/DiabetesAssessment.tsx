import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Calculator, Activity, AlertTriangle, TrendingUp, TrendingDown, Syringe, Droplets, FileText, ChevronRight, Scale } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { AbbreviationHover } from "@/components/AbbreviationHover";

// BMI Calculator Component
const BMICalculator = () => {
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");

  const bmi = useMemo(() => {
    const w = parseFloat(weight);
    const h = parseFloat(height);
    if (isNaN(w) || isNaN(h) || h <= 0) return null;
    return w / ((h / 100) * (h / 100));
  }, [weight, height]);

  const category = useMemo(() => {
    if (bmi === null) return null;
    if (bmi < 18.5) return { label: "Underweight", color: "text-yellow-500", bgColor: "bg-warning/10", borderColor: "border-yellow-500/30" };
    if (bmi < 23) return { label: "Normal", color: "text-success", bgColor: "bg-success/10", borderColor: "border-success/30" };
    if (bmi < 25) return { label: "Overweight (At Risk)", color: "text-warning", bgColor: "bg-warning/10", borderColor: "border-warning/30" };
    if (bmi < 30) return { label: "Obese Class I", color: "text-warning", bgColor: "bg-orange-400/10", borderColor: "border-warning/50/30" };
    return { label: "Obese Class II", color: "text-destructive", bgColor: "bg-destructive/10", borderColor: "border-destructive/30" };
  }, [bmi]);

  const referenceRanges = [
    { range: "< 18.5", category: "Underweight", class: "text-yellow-500" },
    { range: "18.5 — 23", category: "Normal", class: "text-success" },
    { range: "23 — 25", category: "Overweight (At Risk)", class: "text-warning" },
    { range: "25 — 30", category: "Obese Class I", class: "text-warning" },
    { range: "> 30", category: "Obese Class II", class: "text-destructive" },
  ];

  return (
    <Card className="clinical-card">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
            <Scale className="h-4 w-4 text-purple-500" />
          </div>
          <CardTitle className="text-base">BMI Calculator</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <Label htmlFor="bmi-weight" className="text-xs text-muted-foreground mb-1.5 block">
              Weight (kg)
            </Label>
            <Input
              id="bmi-weight"
              type="number"
              step="0.1"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="e.g., 75"
            />
          </div>
          <div>
            <Label htmlFor="bmi-height" className="text-xs text-muted-foreground mb-1.5 block">
              Height (cm)
            </Label>
            <Input
              id="bmi-height"
              type="number"
              value={height}
              onChange={(e) => setHeight(e.target.value)}
              placeholder="e.g., 170"
            />
          </div>
        </div>

        {bmi !== null && category && (
          <div className={cn("p-4 rounded-lg border", category.borderColor, category.bgColor)}>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">BMI</p>
              <p className="text-3xl font-bold">{bmi.toFixed(1)} kg/m²</p>
              <p className={cn("text-lg font-semibold mt-1", category.color)}>{category.label}</p>
            </div>
            <div className="mt-3 h-2 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(((bmi - 10) / 30) * 100, 100)}%`,
                  background: `linear-gradient(to right, #22c55e, #eab308, #ef4444)`,
                }}
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>10</span>
              <span>18.5</span>
              <span>23</span>
              <span>25</span>
              <span>30</span>
              <span>40</span>
            </div>
          </div>
        )}

        <div>
          <p className="text-sm font-medium mb-2">Indian BMI Cutoffs</p>
          <div className="space-y-1">
            {referenceRanges.map((r, i) => (
              <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                <span className="text-sm">{r.range}</span>
                <span className={cn("text-sm font-medium", r.class)}>{r.category}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// HbA1c Interpretation Component
const HbA1cInterpretation = () => {
  const [hba1c, setHba1c] = useState("");

  const interpretation = useMemo(() => {
    const val = parseFloat(hba1c);
    if (isNaN(val)) return null;

    if (val < 5.7) return { category: "Normal", color: "text-success", bgColor: "bg-success/10", borderColor: "border-success/30" };
    if (val < 6.5) return { category: "Prediabetes", color: "text-warning", bgColor: "bg-warning/10", borderColor: "border-warning/30" };
    if (val < 7.0) return { category: "Diabetes (Near Target)", color: "text-warning", bgColor: "bg-orange-400/10", borderColor: "border-warning/50/30" };
    if (val < 8.0) return { category: "Diabetes (Above Target)", color: "text-destructive", bgColor: "bg-destructive/10", borderColor: "border-destructive/30" };
    if (val < 9.0) return { category: "Diabetes (Poor Control)", color: "text-destructive", bgColor: "bg-destructive/10", borderColor: "border-destructive/30" };
    return { category: "Diabetes (Very Poor Control)", color: "text-destructive", bgColor: "bg-destructive/20", borderColor: "border-destructive/50" };
  }, [hba1c]);

  const estimatedAvgGlucose = useMemo(() => {
    const val = parseFloat(hba1c);
    if (isNaN(val)) return null;
    // eAG = (28.7 × HbA1c) − 46.7
    return Math.round((28.7 * val) - 46.7);
  }, [hba1c]);

  const targets = [
    { population: "Most non-pregnant adults", target: "< 7.0%", eag: "< 154 mg/dL" },
    { population: "Pregnancy (GDM/T1DM)", target: "< 6.0%", eag: "< 126 mg/dL" },
    { population: "Elderly (low hypo risk)", target: "< 7.5%", eag: "< 169 mg/dL" },
    { population: "Complex/comorbid", target: "< 8.0%", eag: "< 183 mg/dL" },
    { population: "End of life/very complex", target: "< 8.5%", eag: "< 197 mg/dL" },
  ];

  return (
    <Card className="clinical-card">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Activity className="h-4 w-4 text-primary" />
          </div>
          <CardTitle className="text-base"><AbbreviationHover term="HbA1c">HbA1c</AbbreviationHover> Interpretation</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-3">
          <div className="flex-1">
            <Label htmlFor="hba1c-input" className="text-xs text-muted-foreground mb-1.5 block">
              <AbbreviationHover term="HbA1c">HbA1c</AbbreviationHover> (%)
            </Label>
            <Input
              id="hba1c-input"
              type="number"
              step="0.1"
              min="4"
              max="20"
              value={hba1c}
              onChange={(e) => setHba1c(e.target.value)}
              placeholder="e.g., 7.2"
            />
          </div>
        </div>

        {interpretation && estimatedAvgGlucose && (
          <div className={cn("p-4 rounded-lg border", interpretation.borderColor, interpretation.bgColor)}>
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm text-muted-foreground">Category</p>
                <p className={cn("text-lg font-semibold", interpretation.color)}>{interpretation.category}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground"><AbbreviationHover term="eAG">eAG</AbbreviationHover></p>
                <p className="text-lg font-semibold">{estimatedAvgGlucose} mg/dL</p>
              </div>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min((parseFloat(hba1c) / 14) * 100, 100)}%`,
                  background: `linear-gradient(to right, hsl(var(--success)), hsl(var(--warning)), hsl(var(--destructive)))`,
                }}
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>4%</span>
              <span>Normal</span>
              <span>Prediabetes</span>
              <span>Diabetes</span>
              <span>14%</span>
            </div>
          </div>
        )}

        <div className="mt-4">
          <p className="text-sm font-medium mb-3">Glycemic Targets by Population</p>
          <div className="space-y-2">
            {targets.map((t, i) => (
              <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                <span className="text-sm">{t.population}</span>
                <div className="text-right">
                  <Badge variant="outline" className="text-xs">{t.target}</Badge>
                  <span className="text-xs text-muted-foreground ml-2">{t.eag}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Insulin Dosing Calculator
const InsulinDosingCalculator = () => {
  const [weight, setWeight] = useState("");
  const [hba1c, setHba1c] = useState("");
  const [isInsulinNaive, setIsInsulinNaive] = useState(true);
  const [hasCkd, setHasCkd] = useState(false);
  const [isElderly, setIsElderly] = useState(false);

  const calculations = useMemo(() => {
    const wt = parseFloat(weight);
    if (isNaN(wt) || wt <= 0) return null;

    // Total Daily Dose (TDD) calculation
    // Insulin naive: 0.3-0.5 U/kg/day
    // Already on insulin: 0.5-1.0 U/kg/day
    const baseFactor = isInsulinNaive ? 0.4 : 0.7;
    const hba1cVal = parseFloat(hba1c);
    let hba1cFactor = 1;
    if (!isNaN(hba1cVal)) {
      if (hba1cVal > 10) hba1cFactor = 1.3;
      else if (hba1cVal > 9) hba1cFactor = 1.2;
      else if (hba1cVal > 8) hba1cFactor = 1.1;
    }

    let tdd = Math.round(wt * baseFactor * hba1cFactor);

    // Adjustments
    const adjustments = [];
    if (hasCkd) {
      tdd = Math.round(tdd * 0.75);
      adjustments.push("Reduced 25% for CKD");
    }
    if (isElderly) {
      tdd = Math.round(tdd * 0.85);
      adjustments.push("Reduced 15% for elderly");
    }

    // Basal: 50% of TDD
    const basalDose = Math.round(tdd * 0.5);
    // Bolus: 50% of TDD divided by 3 meals
    const bolusPerMeal = Math.round((tdd * 0.5) / 3);

    return {
      tdd,
      basalDose,
      bolusPerMeal,
      adjustments,
    };
  }, [weight, hba1c, isInsulinNaive, hasCkd, isElderly]);

  return (
    <Card className="clinical-card">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-destructive/100/10 flex items-center justify-center">
            <Syringe className="h-4 w-4 text-red-500" />
          </div>
          <CardTitle className="text-base">Insulin Dosing Calculator</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Weight (kg)</Label>
            <Input
              type="number"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="e.g., 70"
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block"><AbbreviationHover term="HbA1c">HbA1c</AbbreviationHover> (%)</Label>
            <Input
              type="number"
              step="0.1"
              value={hba1c}
              onChange={(e) => setHba1c(e.target.value)}
              placeholder="e.g., 8.5"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="flex items-center justify-between p-2.5 rounded-lg border border-border bg-muted/20">
            <span className="text-sm">Insulin naive</span>
            <Switch checked={isInsulinNaive} onCheckedChange={setIsInsulinNaive} />
          </label>
          <label className="flex items-center justify-between p-2.5 rounded-lg border border-border bg-muted/20">
            <span className="text-sm"><AbbreviationHover term="CKD">CKD</AbbreviationHover> (<AbbreviationHover term="eGFR">eGFR</AbbreviationHover> &lt; 60)</span>
            <Switch checked={hasCkd} onCheckedChange={setHasCkd} />
          </label>
          <label className="flex items-center justify-between p-2.5 rounded-lg border border-border bg-muted/20">
            <span className="text-sm">Age {'>'} 65 years</span>
            <Switch checked={isElderly} onCheckedChange={setIsElderly} />
          </label>
        </div>

        {calculations && (
          <div className="p-4 rounded-lg bg-destructive/100/5 border border-red-500/20">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Total Daily Dose</p>
                <p className="text-xl font-bold">{calculations.tdd} U</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Basal (50%)</p>
                <p className="text-xl font-bold text-primary">{calculations.basalDose} U</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Meal Bolus</p>
                <p className="text-xl font-bold text-accent">{calculations.bolusPerMeal} U</p>
              </div>
            </div>
            {calculations.adjustments.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                {calculations.adjustments.map((adj, i) => (
                  <Badge key={i} variant="secondary" className="text-xs">{adj}</Badge>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="text-xs text-muted-foreground">
          <p className="font-medium mb-1">Basal Insulin Options:</p>
          <ul className="space-y-0.5">
            <li>• Glargine (Lantus/Basaglar): Start once daily, same time</li>
            <li>• Detemir (Levemir): 1-2x daily</li>
            <li>• Degludec (Tresiba): Once daily, flexible timing</li>
            <li>• <AbbreviationHover term="NPH">NPH</AbbreviationHover>: Bedtime dosing (higher hypoglycemia risk)</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

// Quick Links Component
const QuickCalculatorLinks = () => {
  const calculators = [
    {
      path: "/insulin-titration",
      title: "Insulin Titration",
      description: "Calculate optimal insulin dosing adjustments",
      icon: TrendingUp,
    },
    {
      path: "/sliding-scale",
      title: "Sliding Scale Insulin",
      description: "Inpatient insulin protocols",
      icon: Droplets,
    },
    {
      path: "/hypo-risk",
      title: "Hypoglycemia Risk",
      description: "Assess hypoglycemia risk factors",
      icon: AlertTriangle,
    },
    {
      path: "/renal-dosing",
      title: "Renal Dosing",
      description: "Adjust doses based on kidney function",
      icon: Activity,
    },
  ];

  return (
    <Card className="clinical-card">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Calculator className="h-4 w-4 text-primary" />
          </div>
          <CardTitle className="text-base">Quick Calculators</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {calculators.map((calc) => (
            <Link key={calc.path} to={calc.path}>
              <div className="flex items-center gap-3 p-3 rounded-lg border border-border/60 hover:border-red-500/30 hover:bg-muted/30 transition-all group">
                <div className="w-8 h-8 rounded-lg bg-destructive/100/10 flex items-center justify-center shrink-0">
                  <calc.icon className="h-4 w-4 text-red-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{calc.title}</p>
                  <p className="text-xs text-muted-foreground truncate">{calc.description}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-red-500 transition-colors shrink-0" />
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

// Glucose Monitoring Guide
const GlucoseMonitoringGuide = () => {
  const patterns = [
    {
      pattern: "Dawn Phenomenon",
      bg: "High fasting, normal pre-meal",
      action: "Increase basal insulin or move to bedtime",
    },
    {
      pattern: "Somogyi Effect",
      bg: "Low overnight, high fasting",
      action: "Reduce evening basal; check 2-3 AM glucose",
    },
    {
      pattern: "Post-prandial Spike",
      bg: "Normal fasting, high after meals",
      action: "Adjust mealtime bolus or review carb counting",
    },
  ];

  return (
    <Card className="clinical-card">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <TrendingDown className="h-4 w-4 text-primary" />
          </div>
          <CardTitle className="text-base">Glucose Pattern Recognition</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {patterns.map((p, i) => (
            <div key={i} className="p-3 rounded-lg bg-muted/30">
              <p className="text-sm font-medium">{p.pattern}</p>
              <p className="text-xs text-muted-foreground">BG Pattern: {p.bg}</p>
              <div className="flex items-start gap-2 mt-2">
                <FileText className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                <p className="text-xs">{p.action}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

// Main Component
export default function DiabetesAssessment() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-1 sm:grid-cols-2 gap-4">
        <HbA1cInterpretation />
        <InsulinDosingCalculator />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-1 sm:grid-cols-2 gap-4">
        <BMICalculator />
        <QuickCalculatorLinks />
        <GlucoseMonitoringGuide />
      </div>
    </div>
  );
}
