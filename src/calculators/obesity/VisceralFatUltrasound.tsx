import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Calculator, Info, RotateCcw, Activity, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { headerTabClass, headerTabListClass } from "@/lib/header-tabs";
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

interface VisceralFatResult {
  peritoneumDepth: number;
  aortaDepth: number;
  visceralFatThickness: number;
  sex: "male" | "female";
  cutoff: number;
  aboveCutoff: boolean;
}

/** Ultrasound VAT cutoffs (cm), midline transverse pre-peritoneal/peri-aortic protocol. */
const VAT_CUTOFFS: Record<"male" | "female", number> = {
  male: 1.0,
  female: 0.8,
};

function computeVisceralFat(
  peritoneumDepth: number,
  aortaDepth: number,
  sex: "male" | "female"
): VisceralFatResult {
  const visceralFatThickness = aortaDepth - peritoneumDepth;
  const cutoff = VAT_CUTOFFS[sex];
  return {
    peritoneumDepth,
    aortaDepth,
    visceralFatThickness,
    sex,
    cutoff,
    aboveCutoff: visceralFatThickness > cutoff,
  };
}

type TabKey = "calculator" | "protocol";

const TABS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  { key: "calculator", label: "Calculator", icon: <Calculator className="h-4 w-4" /> },
  { key: "protocol", label: "Protocol", icon: <BookOpen className="h-4 w-4" /> },
];

export default function VisceralFatUltrasound() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabKey>("calculator");
  const [peritoneumDepth, setPeritoneumDepth] = useState("");
  const [aortaDepth, setAortaDepth] = useState("");
  const [sex, setSex] = useState<"male" | "female">("male");
  const [result, setResult] = useState<VisceralFatResult | null>(null);

  const handleCalculate = () => {
    const p = parseFloat(peritoneumDepth);
    const a = parseFloat(aortaDepth);
    if (isNaN(p) || isNaN(a) || p <= 0 || a <= 0) return;
    setResult(computeVisceralFat(p, a, sex));
  };

  const handleReset = () => {
    setPeritoneumDepth("");
    setAortaDepth("");
    setSex("male");
    setResult(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-4 pb-16 pt-6">
        {/* Header */}
        <div className="mb-5 flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Visceral Fat Ultrasound</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Ultrasound measurement of visceral (intra-abdominal) fat thickness with the VAT &amp; abdominal SAT protocol.
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="shrink-0">
            Home
          </Button>
        </div>

        {/* Tabs */}
        <div className={headerTabListClass}>
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              data-active={activeTab === tab.key}
              className={headerTabClass()}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "calculator" && (
          <div className="mt-5 space-y-5">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Measurements</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="peritoneumDepth">Peritoneum depth (cm)</Label>
                    <Input
                      id="peritoneumDepth"
                      type="number"
                      step="0.1"
                      min="0"
                      placeholder="e.g. 1.2"
                      value={peritoneumDepth}
                      onChange={(e) => setPeritoneumDepth(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="aortaDepth">Anterior aorta depth (cm)</Label>
                    <Input
                      id="aortaDepth"
                      type="number"
                      step="0.1"
                      min="0"
                      placeholder="e.g. 2.5"
                      value={aortaDepth}
                      onChange={(e) => setAortaDepth(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Sex reference cutoff</Label>
                  <RadioGroup value={sex} onValueChange={(v) => setSex(v as "male" | "female")} className="flex gap-6">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="male" id="sex-male" />
                      <Label htmlFor="sex-male" className="font-normal cursor-pointer">
                        Male (&gt; 1.0 cm)
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="female" id="sex-female" />
                      <Label htmlFor="sex-female" className="font-normal cursor-pointer">
                        Female (&gt; 0.8 cm)
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
                <div className="flex gap-3">
                  <Button className="flex-1" onClick={handleCalculate}>
                    <Calculator className="mr-2 h-4 w-4" />
                    Calculate
                  </Button>
                  <Button variant="outline" size="icon" onClick={handleReset} aria-label="Reset">
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {result && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Activity className="h-4 w-4 text-primary" />
                    Visceral Fat Thickness
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold tracking-tight">
                      {result.visceralFatThickness.toFixed(1)}
                    </span>
                    <span className="text-sm text-muted-foreground">cm</span>
                  </div>
                  <Alert variant={result.aboveCutoff ? "destructive" : "default"}>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      {result.aboveCutoff
                        ? `Above the ${result.cutoff.toFixed(2)} cm ${result.sex} reference cutoff — consistent with increased visceral adiposity.`
                        : `At or below the ${result.cutoff.toFixed(2)} cm ${result.sex} reference cutoff.`}
                      {" "}Anterior aorta depth {result.aortaDepth.toFixed(1)} cm − peritoneum depth {result.peritoneumDepth.toFixed(1)} cm.
                    </AlertDescription>
                  </Alert>
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    Thresholds vary by population and protocol. Use the same landmark, respiratory phase, and probe pressure for serial measurements; interpret alongside clinical findings.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {activeTab === "protocol" && (
          <div className="mt-5 space-y-5">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">How is the measurement conducted?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-primary">Visceral adipose tissue and abdominal subcutaneous adipose tissue protocol</p>
                </div>
                <div className="space-y-3 rounded-md border bg-muted/40 p-3 text-sm leading-relaxed text-muted-foreground [&_strong]:font-semibold [&_strong]:text-foreground">
                  <p>
                    <strong>Landmarking (adults):</strong> The waist (the midpoint between the lower rib and the iliac crest) is measured using a D-loop tape measure with the participant standing.
                  </p>
                  <p>
                    <strong>Infants and toddlers:</strong> The waist is taken at the same location, but with the baby/toddler lying quietly in the supine position on a flat surface.
                  </p>
                  <p>
                    <strong>Marking:</strong> On the skin, the location where the xiphoid line intercepts the waist circumference is marked. This is the area (midline position) where the transducer is positioned for the intra-abdominal (visceral) and abdominal subcutaneous fat measurements.
                  </p>
                  <p>
                    <strong>Transducer placement:</strong> The transducer is positioned transversely on the midline location marked previously. On the image, the linea alba is to be placed centrally. The transducer is then decompressed as much as possible to avoid compression of the subcutaneous tissue and the image is frozen just before the probe loses contact.
                  </p>
                </div>
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    Practical notes: measure during quiet expiration; avoid compressing the abdominal wall; center the linea alba on the image before freezing. Thresholds vary — interpret alongside clinical findings.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}