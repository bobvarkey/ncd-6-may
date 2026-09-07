import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Calculator,
  Scale,
  Ruler,
  Calendar,
  Syringe,
  AlertTriangle,
  CheckCircle2,
  Printer,
  Copy,
  Download,
  Info,
  ArrowRight,
  Pill,
} from "lucide-react";
import Seo from "@/components/Seo";
import { copyToClipboard, downloadTextFile } from "@/lib/clinical-utils";
import { ALL_MEDICATIONS, type Medication } from "@/calculators/obesity/medication-database";
import { cn } from "@/lib/utils";

type Sex = "male" | "female";
type RecommendedMed = "semaglutide" | "tirzepatide" | "liraglutide";

const ALL_MEDS: Medication[] = Object.values(ALL_MEDICATIONS).flat();

const COMORBIDITIES = [
  "Type 2 Diabetes",
  "Prediabetes",
  "Hypertension",
  "Dyslipidemia",
  "Obstructive Sleep Apnea",
  "Cardiovascular Disease",
  "Heart Failure (HFpEF)",
  "MASLD / NAFLD",
  "Osteoarthritis",
  "PCOS",
  "CKD",
  "GERD",
];

const GLP1_MEDS: Record<RecommendedMed, { name: string; key: string; schedule: string[]; injectionSites: string[]; max: string }> = {
  semaglutide: {
    name: "Semaglutide (Wegovy/Ozempic)",
    key: "Semaglutide (Wegovy)",
    schedule: [
      "Week 1–4: 0.25 mg weekly",
      "Week 5–8: 0.5 mg weekly",
      "Week 9–12: 1.0 mg weekly",
      "Week 13–16: 1.7 mg weekly",
      "Week 17+: 2.4 mg weekly (maintenance)",
    ],
    injectionSites: ["Abdomen", "Thigh", "Upper arm"],
    max: "2.4 mg weekly",
  },
  tirzepatide: {
    name: "Tirzepatide (Zepbound/Mounjaro)",
    key: "Tirzepatide (Zepbound)",
    schedule: [
      "Week 1–4: 2.5 mg weekly",
      "Week 5–8: 5 mg weekly",
      "Week 9–12: 7.5 mg weekly",
      "Week 13–16: 10 mg weekly",
      "Week 17–20: 12.5 mg weekly",
      "Week 21+: 15 mg weekly (maintenance)",
    ],
    injectionSites: ["Abdomen", "Thigh", "Upper arm"],
    max: "15 mg weekly",
  },
  liraglutide: {
    name: "Liraglutide (Saxenda)",
    key: "Liraglutide (Saxenda)",
    schedule: [
      "Day 1–7: 0.6 mg daily",
      "Day 8–14: 1.2 mg daily",
      "Day 15–21: 1.8 mg daily",
      "Day 22–28: 2.4 mg daily",
      "Day 29+: 3.0 mg daily (maintenance)",
    ],
    injectionSites: ["Abdomen", "Thigh", "Upper arm"],
    max: "3.0 mg daily",
  },
};

function calculateBmi(weightKg: number, heightCm: number): number {
  if (!weightKg || !heightCm) return 0;
  return Number((weightKg / Math.pow(heightCm / 100, 2)).toFixed(1));
}

function bmiCategory(bmi: number): string {
  if (!bmi) return "-";
  if (bmi < 18.5) return "Underweight";
  if (bmi < 25) return "Normal";
  if (bmi < 30) return "Overweight";
  if (bmi < 35) return "Obesity class I";
  if (bmi < 40) return "Obesity class II";
  return "Obesity class III";
}

function recommendAgent(bmi: number, selectedComorbidities: string[], sex: Sex, age: number): RecommendedMed {
  const hasDiabetes = selectedComorbidities.includes("Type 2 Diabetes");
  const hasCvd = selectedComorbidities.includes("Cardiovascular Disease");
  const severeObesity = bmi >= 35;

  if (hasDiabetes && !hasCvd) return "tirzepatide";
  if (hasCvd) return "semaglutide";
  if (severeObesity || age < 60) return "tirzepatide";
  return "semaglutide";
}

function formatDate(date: Date) {
  return date.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}

export default function Glp1DoseCalculatorPage() {
  const navigate = useNavigate();
  const [weight, setWeight] = useState<number | "">("");
  const [height, setHeight] = useState<number | "">("");
  const [age, setAge] = useState<number | "">("");
  const [sex, setSex] = useState<Sex>("male");
  const [comorbidities, setComorbidities] = useState<string[]>([]);
  const [startDate, setStartDate] = useState<string>(() => new Date().toISOString().split("T")[0]);
  const [preference, setPreference] = useState<RecommendedMed | "auto">("auto");

  const bmi = useMemo(() => calculateBmi(Number(weight), Number(height)), [weight, height]);
  const category = useMemo(() => bmiCategory(bmi), [bmi]);

  const recommended = useMemo<RecommendedMed>(() => {
    if (!bmi) return "semaglutide";
    if (preference !== "auto") return preference;
    return recommendAgent(bmi, comorbidities, sex, Number(age) || 40);
  }, [bmi, comorbidities, sex, age, preference]);

  const med = GLP1_MEDS[recommended];
  const dbMed = useMemo(() => ALL_MEDS.find((m) => m.name === med.key), [med.key]);

  const titrationDates = useMemo(() => {
    const start = new Date(startDate);
    return med.schedule.map((step, idx) => {
      const stepDate = new Date(start);
      const isLiraglutide = recommended === "liraglutide";
      const daysToAdd = isLiraglutide ? idx * 7 : idx * 28;
      stepDate.setDate(start.getDate() + daysToAdd);
      return { date: stepDate, step };
    });
  }, [med.schedule, startDate, recommended]);

  const exportText = useMemo(() => {
    const lines = [
      "GLP-1 Dose Calculator Report",
      `Patient: ${sex}, ${age || "-"} years, ${weight || "-"} kg, ${height || "-"} cm`,
      `BMI: ${bmi || "-"} kg/m² (${category})`,
      `Recommended agent: ${med.name}`,
      "",
      "Titration schedule:",
      ...titrationDates.map((t) => `${formatDate(t.date)} | ${t.step}`),
      "",
      "Injection sites:",
      ...med.injectionSites,
      "",
      "Common side effects:",
      ...(dbMed?.sideEffects.slice(0, 6) || ["Nausea", "Diarrhea", "Vomiting", "Constipation"]),
      "",
      "Contraindications / key precautions:",
      ...(dbMed?.contraindications.slice(0, 4) || ["Pregnancy", "MTC/MEN2", "History of pancreatitis"]),
    ];
    return lines.join("\n");
  }, [sex, age, weight, height, bmi, category, med, titrationDates, dbMed]);

  const toggleComorbidity = (label: string) => {
    setComorbidities((prev) =>
      prev.includes(label) ? prev.filter((c) => c !== label) : [...prev, label]
    );
  };

  return (
    <main className="min-h-screen bg-background text-foreground p-4 md:p-6">
      <Seo title="GLP-1 Dose Calculator" description="Calculate GLP-1 dose recommendations based on BMI and health status." />
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-sunset flex items-center justify-center">
            <Calculator className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-heading font-semibold">GLP-1 Dose Calculator</h1>
            <p className="text-sm text-muted-foreground">
              Enter weight, height, age and health status to get a personalized GLP-1 titration plan.
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Scale className="h-5 w-5" /> Patient details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="weight">Weight (kg)</Label>
                <Input
                  id="weight"
                  type="number"
                  placeholder="e.g. 82"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value === "" ? "" : Number(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="height">Height (cm)</Label>
                <Input
                  id="height"
                  type="number"
                  placeholder="e.g. 170"
                  value={height}
                  onChange={(e) => setHeight(e.target.value === "" ? "" : Number(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="age">Age (years)</Label>
                <Input
                  id="age"
                  type="number"
                  placeholder="e.g. 45"
                  value={age}
                  onChange={(e) => setAge(e.target.value === "" ? "" : Number(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sex">Sex</Label>
                <Select value={sex} onValueChange={(v) => setSex(v as Sex)}>
                  <SelectTrigger id="sex">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {bmi > 0 && (
              <div className={cn("rounded-xl p-4 border", bmi >= 30 ? "bg-sunset/10 border-sunset/30" : "bg-muted border-border")}>
                <div className="flex items-center gap-2 mb-1">
                  <Ruler className="h-4 w-4" />
                  <span className="font-semibold">BMI: {bmi} kg/m²</span>
                  <Badge variant={bmi >= 30 ? "default" : "outline"}>{category}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Based on {weight} kg and {height} cm.
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label>Health status / comorbidities</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                {COMORBIDITIES.map((c) => (
                  <div key={c} className="flex items-center gap-2">
                    <Checkbox
                      id={`como-${c}`}
                      checked={comorbidities.includes(c)}
                      onCheckedChange={() => toggleComorbidity(c)}
                    />
                    <Label htmlFor={`como-${c}`} className="font-normal text-sm">
                      {c}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start">Start date</Label>
                <Input id="start" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pref">Agent preference</Label>
                <Select value={preference} onValueChange={(v) => setPreference(v as RecommendedMed | "auto")}>
                  <SelectTrigger id="pref">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">Auto-recommend</SelectItem>
                    <SelectItem value="semaglutide">Semaglutide</SelectItem>
                    <SelectItem value="tirzepatide">Tirzepatide</SelectItem>
                    <SelectItem value="liraglutide">Liraglutide</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {bmi > 0 && (
          <Card className="border-l-4 border-l-sunset">
            <CardHeader>
              <CardTitle className="text-lg flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-sunset" />
                  Recommended: {med.name}
                </span>
                <Badge variant="default">{med.max}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium flex items-center gap-2 mb-2">
                    <Calendar className="h-4 w-4" /> Titration plan
                  </h3>
                  <ul className="space-y-2 text-sm">
                    {titrationDates.map((t, idx) => (
                      <li key={idx} className="flex items-start gap-3 p-2 rounded-lg bg-muted">
                        <span className="font-medium text-sunset whitespace-nowrap">{formatDate(t.date)}</span>
                        <span>{t.step}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium flex items-center gap-2 mb-2">
                      <Syringe className="h-4 w-4" /> Injection site rotation
                    </h3>
                    <ul className="space-y-1 text-sm">
                      {med.injectionSites.map((site, idx) => (
                        <li key={site} className="flex items-center gap-2">
                          <span className="h-5 w-5 rounded-full bg-sunset/20 text-sunset text-xs flex items-center justify-center font-semibold">
                            {idx + 1}
                          </span>
                          {site}
                        </li>
                      ))}
                    </ul>
                    <p className="text-xs text-muted-foreground mt-2">
                      Rotate sites each week. Same general area is okay, but use a different spot within it.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-medium flex items-center gap-2 mb-2">
                      <AlertTriangle className="h-4 w-4 text-sunset" /> Common side effects
                    </h3>
                    <div className="flex flex-wrap gap-1">
                      {(dbMed?.sideEffects.slice(0, 8) || ["Nausea", "Diarrhea", "Vomiting", "Constipation"]).map((se) => (
                        <Badge key={se} variant="secondary" className="font-normal">{se}</Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {dbMed?.contraindications.length ? (
                <div className="rounded-lg bg-destructive/10 p-3 text-sm">
                  <p className="font-semibold text-destructive mb-1 flex items-center gap-2">
                    <Info className="h-4 w-4" /> Contraindications / key precautions
                  </p>
                  <ul className="space-y-1">
                    {dbMed.contraindications.slice(0, 5).map((c) => (
                      <li key={c}>{c}</li>
                    ))}
                  </ul>
                </div>
              ) : null}

              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={() => copyToClipboard(exportText)}>
                  <Copy className="h-4 w-4 mr-1" /> Copy plan
                </Button>
                <Button variant="outline" size="sm" onClick={() => downloadTextFile(exportText, `glp1-plan-${recommended}.txt`)}>
                  <Download className="h-4 w-4 mr-1" /> Export
                </Button>
                <Button variant="outline" size="sm" onClick={() => window.print()}>
                  <Printer className="h-4 w-4 mr-1" /> Print
                </Button>
                <Button variant="default" size="sm" onClick={() => navigate(`/drug-schedule?drug=${encodeURIComponent(med.key)}`)}>
                  <Calendar className="h-4 w-4 mr-1" /> Build full schedule
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <p className="text-xs text-muted-foreground text-center">
          This is a clinical decision support tool, not a prescription. Verify against local guidelines and patient history.
        </p>
      </div>
    </main>
  );
}
