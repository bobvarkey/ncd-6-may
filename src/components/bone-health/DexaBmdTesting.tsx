import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { dexaBmdTesting } from "@/data/dexa-bmd-testing";
import { Bone, CheckCircle2, RotateCcw, Scan, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type Sex = "female" | "male" | null;
type Menopausal = "premenopausal" | "transition" | "postmenopausal" | null;

const RISK_FACTORS = [
  "Low body weight",
  "Prior fracture",
  "High-risk medication use",
  "Disease or condition associated with low bone mass or bone loss",
] as const;

const ALL_ADULT_INDICATIONS = [
  "Fragility fracture",
  "Disease or condition associated with low bone mass or bone loss",
  "Medication associated with low bone mass or bone loss",
  "Being considered for pharmacologic osteoporosis therapy",
  "Currently receiving pharmacologic osteoporosis therapy (monitoring)",
  "Bone loss result would change management",
] as const;

export default function DexaBmdTesting() {
  const d = dexaBmdTesting;
  const [sex, setSex] = useState<Sex>(null);
  const [age, setAge] = useState("");
  const [menopausal, setMenopausal] = useState<Menopausal>(null);
  const [riskFactors, setRiskFactors] = useState<string[]>([]);
  const [adultIndications, setAdultIndications] = useState<string[]>([]);

  const toggle = (list: string[], value: string, setter: (v: string[]) => void) => {
    setter(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  };

  const reset = () => {
    setSex(null);
    setAge("");
    setMenopausal(null);
    setRiskFactors([]);
    setAdultIndications([]);
  };

  const result = useMemo(() => {
    const ageNum = parseInt(age, 10);
    if (!sex || Number.isNaN(ageNum) || ageNum <= 0) return null;
    if (sex === "female" && !menopausal) return null;

    const reasons: string[] = [];

    if (sex === "female" && ageNum >= 65) reasons.push("Female age ≥ 65 years");
    if (sex === "male" && ageNum >= 70) reasons.push("Male age ≥ 70 years");

    if (sex === "female" && ageNum < 65 && menopausal === "postmenopausal" && riskFactors.length > 0) {
      reasons.push("Postmenopausal woman < 65 with risk factor for low bone mass");
    }
    if (sex === "female" && menopausal === "transition" && riskFactors.length > 0) {
      reasons.push("Woman in menopausal transition with clinical fracture risk factor");
    }
    if (sex === "male" && ageNum < 70 && riskFactors.length > 0) {
      reasons.push("Man < 70 with risk factor for low bone mass");
    }

    adultIndications.forEach((ind) => reasons.push(ind));

    return { indicated: reasons.length > 0, reasons };
  }, [sex, age, menopausal, riskFactors, adultIndications]);

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Scan className="h-5 w-5 text-primary" />
            {d.test}
          </CardTitle>
          <p className="text-xs text-muted-foreground">{d.purpose} — indication checker</p>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Sex */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Sex</Label>
            <div className="flex gap-2">
              {(["female", "male"] as const).map((s) => (
                <Button
                  key={s}
                  type="button"
                  size="sm"
                  variant={sex === s ? "default" : "outline"}
                  className="rounded-full capitalize"
                  onClick={() => setSex(s)}
                >
                  {s}
                </Button>
              ))}
            </div>
          </div>

          {/* Age */}
          <div className="space-y-2">
            <Label htmlFor="dexa-age" className="text-sm font-semibold">Age (years)</Label>
            <input
              id="dexa-age"
              type="text"
              inputMode="numeric"
              value={age}
              onChange={(e) => setAge(e.target.value.replace(/[^0-9]/g, ""))}
              placeholder="e.g. 68"
              className="flex h-10 w-32 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          {/* Menopausal status (women only) */}
          {sex === "female" && (
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Menopausal status</Label>
              <div className="flex flex-wrap gap-2">
                {(
                  [
                    ["premenopausal", "Premenopausal"],
                    ["transition", "Menopausal transition"],
                    ["postmenopausal", "Postmenopausal"],
                  ] as const
                ).map(([value, label]) => (
                  <Button
                    key={value}
                    type="button"
                    size="sm"
                    variant={menopausal === value ? "default" : "outline"}
                    className="rounded-full"
                    onClick={() => setMenopausal(value)}
                  >
                    {label}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Risk factors */}
          {sex && (
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Risk factors for low bone mass</Label>
              <div className="grid sm:grid-cols-2 gap-2">
                {RISK_FACTORS.map((rf) => (
                  <label
                    key={rf}
                    className="flex items-start gap-2 rounded-lg border p-2.5 text-sm cursor-pointer hover:bg-muted/40"
                  >
                    <Checkbox
                      checked={riskFactors.includes(rf)}
                      onCheckedChange={() => toggle(riskFactors, rf, setRiskFactors)}
                      className="mt-0.5"
                    />
                    <span>{rf}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* All-adult indications */}
          {sex && (
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Other indications (all adults)</Label>
              <div className="grid sm:grid-cols-2 gap-2">
                {ALL_ADULT_INDICATIONS.map((ind) => (
                  <label
                    key={ind}
                    className="flex items-start gap-2 rounded-lg border p-2.5 text-sm cursor-pointer hover:bg-muted/40"
                  >
                    <Checkbox
                      checked={adultIndications.includes(ind)}
                      onCheckedChange={() => toggle(adultIndications, ind, setAdultIndications)}
                      className="mt-0.5"
                    />
                    <span>{ind}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Result */}
          {result && (
            <div
              className={cn(
                "rounded-xl border p-4",
                result.indicated
                  ? "border-emerald-300/60 bg-emerald-50/60"
                  : "border-slate-300/60 bg-slate-50/60"
              )}
            >
              <div className="flex items-center gap-2 font-semibold">
                {result.indicated ? (
                  <>
                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                    <span className="text-emerald-800">{d.output.positive}</span>
                  </>
                ) : (
                  <>
                    <XCircle className="h-5 w-5 text-slate-500" />
                    <span className="text-slate-700">{d.output.negative}</span>
                  </>
                )}
              </div>
              {result.reasons.length > 0 && (
                <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                  {result.reasons.map((r, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="mt-2 h-1.5 w-1.5 rounded-full bg-emerald-600 shrink-0" />
                      {r}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <Button variant="ghost" size="sm" onClick={reset}>
            <RotateCcw className="h-4 w-4 mr-2" /> Reset
          </Button>
        </CardContent>
      </Card>

      {/* Reference: full indication criteria */}
      <Card className="overflow-hidden">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Bone className="h-5 w-5 text-primary" />
            Indication criteria
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="rounded-lg border p-3 bg-muted/20">
              <h4 className="font-semibold mb-1">Women</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• {d.indications.women.age_65_or_older.criteria}</li>
                <li>• Postmenopausal &lt; 65 with risk factors: {d.indications.women.postmenopausal_under_65.risk_factors.join(", ").toLowerCase()}</li>
                <li>• Menopausal transition with clinical fracture risk factors</li>
                <li>• {d.indications.women.discontinuing_estrogen.recommendation}</li>
              </ul>
            </div>
            <div className="rounded-lg border p-3 bg-muted/20">
              <h4 className="font-semibold mb-1">Men</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• {d.indications.men.age_70_or_older.criteria}</li>
                <li>• Age &lt; 70 with risk factors: {d.indications.men.under_70.risk_factors.join(", ").toLowerCase()}</li>
              </ul>
            </div>
          </div>
          <div className="rounded-lg border p-3 bg-muted/20">
            <h4 className="font-semibold mb-1">All adults</h4>
            <ul className="space-y-1 text-muted-foreground">
              {d.indications.all_adults.map((a, i) => (
                <li key={i}>
                  • {a.indication}
                  {"purpose" in a && a.purpose ? ` (${a.purpose})` : ""}
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
