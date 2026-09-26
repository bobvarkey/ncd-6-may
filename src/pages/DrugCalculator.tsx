import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calculator, Copy, Syringe, AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { GLP1_PRODUCTS, SITE_ROTATION } from "@/data/glp1-schedules";
import { parseClinicalValue } from "@/lib/clinical-utils";
import Seo from "@/components/Seo";

const CONDITIONS = [
  { id: "t2dm", label: "Type 2 diabetes" },
  { id: "prediabetes", label: "Prediabetes" },
  { id: "cvd", label: "Established cardiovascular disease" },
  { id: "osa", label: "Obstructive sleep apnoea" },
  { id: "masld", label: "Fatty liver (MASLD)" },
  { id: "ckd", label: "Chronic kidney disease" },
  { id: "gastroparesis", label: "Gastroparesis / severe reflux" },
  { id: "pancreatitis", label: "Past pancreatitis" },
  { id: "mtc", label: "Medullary thyroid cancer / MEN 2 (personal or family)" },
  { id: "pregnancy", label: "Pregnant, breastfeeding or planning pregnancy" },
  { id: "insulin", label: "On insulin or sulfonylurea" },
  { id: "gallstones", label: "Gallstone disease" },
];

const DrugCalculator = () => {
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [age, setAge] = useState("");
  const [goal, setGoal] = useState<"weight" | "glycaemia">("weight");
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  const toggle = (id: string) => setChecked((c) => ({ ...c, [id]: !c[id] }));

  const result = useMemo(() => {
    const w = parseClinicalValue(weight);
    const hCm = parseClinicalValue(height);
    const a = parseClinicalValue(age);
    if (w === null || hCm === null || w <= 0 || hCm <= 0) return null;

    const bmi = w / Math.pow(hCm / 100, 2);
    const has = (id: string) => !!checked[id];

    const blockers: string[] = [];
    if (has("mtc")) blockers.push("Medullary thyroid cancer or MEN 2 history — GLP-1 agonists are contraindicated.");
    if (has("pregnancy")) blockers.push("Pregnancy, breastfeeding or planning pregnancy — do not start; stop at least 2 months before conception.");

    const cautions: string[] = [];
    if (has("pancreatitis")) cautions.push("Past pancreatitis — use only if benefit clearly outweighs risk; stop for severe abdominal pain.");
    if (has("gastroparesis")) cautions.push("Gastroparesis or severe reflux — expect worse nausea; titrate slower or avoid.");
    if (has("gallstones")) cautions.push("Gallstone disease — rapid weight loss raises the risk of biliary events.");
    if (has("insulin")) cautions.push("On insulin or a sulfonylurea — cut that dose by about 20% at start to avoid hypos.");
    if (has("ckd")) cautions.push("CKD — no dose change needed, but dehydration from vomiting can worsen kidney function.");
    if (a !== null && a >= 75) cautions.push("Age 75+ — watch for sarcopenia, falls and poor oral intake; prioritise protein and resistance exercise.");
    if (a !== null && a < 18) cautions.push("Under 18 — paediatric prescribing is outside this tool.");

    const asianCutoffNote = "Asian/South Asian BMI cut-offs used: overweight ≥23, obesity ≥25.";
    const eligible =
      bmi >= 27 ||
      (bmi >= 25 && (has("t2dm") || has("osa") || has("cvd") || has("masld") || has("prediabetes")));

    const prefersGlycaemia = goal === "glycaemia" || has("t2dm");
    const productId = prefersGlycaemia
      ? has("cvd")
        ? "semaglutide-ozempic"
        : "tirzepatide-mounjaro"
      : "tirzepatide-zepbound";
    const first = GLP1_PRODUCTS.find((p) => p.id === productId)!;
    const alternative = GLP1_PRODUCTS.find(
      (p) => p.id === (prefersGlycaemia ? "dulaglutide-trulicity" : "semaglutide-wegovy"),
    )!;

    const slowTitration = has("gastroparesis") || (a !== null && a >= 75);

    const target5 = w * 0.05;
    const target10 = w * 0.1;
    const target15 = w * 0.15;

    return {
      bmi,
      eligible,
      blockers,
      cautions,
      first,
      alternative,
      slowTitration,
      asianCutoffNote,
      targets: { target5, target10, target15 },
    };
  }, [weight, height, age, goal, checked]);

  const copy = async () => {
    if (!result) return;
    const lines = [
      `BMI ${result.bmi.toFixed(1)} kg/m²`,
      `Suggested: ${result.first.drug} (${result.first.brand}) — ${result.first.frequency}, ${result.first.route.toLowerCase()}`,
      "Titration:",
      ...result.first.steps.map(
        (s) => `  ${s.dose} — ${s.weeks ? `${s.weeks * (result.slowTitration ? 2 : 1)} week(s)` : "ongoing"} (${s.label})`,
      ),
      `Sites: ${result.first.sites.join("; ")}`,
      result.blockers.length ? `Do not start: ${result.blockers.join(" ")}` : "",
      result.cautions.length ? `Cautions: ${result.cautions.join(" ")}` : "",
    ].filter(Boolean);
    await navigator.clipboard.writeText(lines.join("\n"));
    toast({ title: "Recommendation copied" });
  };

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 space-y-6">
      <Seo
        title="GLP-1 Drug Calculator — Dose, Titration & Injection Sites"
        description="Enter weight, height, age and health conditions to get a suggested GLP-1 medicine, starting dose, titration steps and injection sites."
      />

      <header className="space-y-1">
        <h1 className="flex items-center gap-2 text-2xl font-semibold">
          <Calculator className="h-6 w-6 text-primary" />
          Drug Calculator
        </h1>
        <p className="text-sm text-muted-foreground">
          Enter the basics and get a suggested GLP-1 medicine with its starting dose, step-up plan and injection sites.
        </p>
      </header>

      <Card className="p-4 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1.5">
            <Label htmlFor="w">Weight (kg)</Label>
            <Input id="w" type="text" inputMode="decimal" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="82" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="h">Height (cm)</Label>
            <Input id="h" type="text" inputMode="decimal" value={height} onChange={(e) => setHeight(e.target.value)} placeholder="168" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="a">Age (years)</Label>
            <Input id="a" type="text" inputMode="decimal" value={age} onChange={(e) => setAge(e.target.value)} placeholder="45" />
          </div>
          <div className="space-y-1.5">
            <Label>Main goal</Label>
            <Select value={goal} onValueChange={(v) => setGoal(v as "weight" | "glycaemia")}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="weight">Weight loss</SelectItem>
                <SelectItem value="glycaemia">Blood sugar control</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Health status</Label>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {CONDITIONS.map((c) => (
              <label key={c.id} className="flex items-start gap-2 text-sm">
                <Checkbox checked={!!checked[c.id]} onCheckedChange={() => toggle(c.id)} />
                <span>{c.label}</span>
              </label>
            ))}
          </div>
        </div>
      </Card>

      {!result && (
        <Card className="p-4 text-sm text-muted-foreground">
          Enter weight and height to see a recommendation.
        </Card>
      )}

      {result && (
        <>
          <Card className="p-4 space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-3xl font-semibold">{result.bmi.toFixed(1)}</span>
              <span className="text-sm text-muted-foreground">BMI kg/m²</span>
              <Badge variant={result.eligible ? "default" : "secondary"}>
                {result.eligible ? "Meets usual treatment threshold" : "Below usual treatment threshold"}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">{result.asianCutoffNote}</p>
            <p className="text-sm">
              Realistic loss targets: <strong>{result.targets.target5.toFixed(1)} kg</strong> (5%),{" "}
              <strong>{result.targets.target10.toFixed(1)} kg</strong> (10%),{" "}
              <strong>{result.targets.target15.toFixed(1)} kg</strong> (15%).
            </p>
          </Card>

          {result.blockers.length > 0 && (
            <Card className="border-destructive/40 bg-destructive/5 p-4 space-y-2">
              <h3 className="flex items-center gap-2 font-semibold text-destructive">
                <AlertTriangle className="h-4 w-4" /> Do not start
              </h3>
              <ul className="list-disc pl-5 text-sm space-y-1">
                {result.blockers.map((b) => <li key={b}>{b}</li>)}
              </ul>
            </Card>
          )}

          <Card className="p-4 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-semibold">
                {result.first.drug} ({result.first.brand})
              </h2>
              <Badge variant="outline">{result.first.frequency}</Badge>
              <Badge variant="outline">{result.first.route}</Badge>
            </div>
            {result.slowTitration && (
              <p className="text-sm text-warning">
                Slower step-up advised — hold each dose about twice as long before increasing.
              </p>
            )}
            <ol className="space-y-2">
              {result.first.steps.map((s, i) => (
                <li key={s.dose} className="flex gap-3 rounded-lg border border-border p-3 text-sm">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary">
                    {i + 1}
                  </span>
                  <span>
                    <strong>{s.dose}</strong> — {s.label}
                    <span className="block text-muted-foreground">
                      {s.weeks
                        ? `Hold for ${s.weeks * (result.slowTitration ? 2 : 1)} week${s.weeks * (result.slowTitration ? 2 : 1) > 1 ? "s" : ""} before stepping up`
                        : "Continue as maintenance"}
                    </span>
                  </span>
                </li>
              ))}
            </ol>
            <p className="text-sm text-muted-foreground">
              Alternative if not tolerated or unavailable: {result.alternative.drug} ({result.alternative.brand}),{" "}
              {result.alternative.frequency.toLowerCase()}.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={copy}>
                <Copy className="mr-2 h-4 w-4" /> Copy plan
              </Button>
              <Button size="sm" variant="outline" asChild>
                <Link to="/drug-schedule">Open dated schedule</Link>
              </Button>
            </div>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <Card className="p-4 space-y-2">
              <h3 className="flex items-center gap-2 font-semibold">
                <Syringe className="h-4 w-4 text-primary" /> Injection sites
              </h3>
              <ul className="list-disc pl-5 text-sm space-y-1">
                {result.first.sites.map((s) => <li key={s}>{s}</li>)}
              </ul>
              <p className="text-sm text-muted-foreground">
                Suggested rotation: {SITE_ROTATION.join(" → ")}.
              </p>
              <p className="text-sm text-muted-foreground">{result.first.storage}</p>
            </Card>

            <Card className="p-4 space-y-2">
              <h3 className="flex items-center gap-2 font-semibold">
                <AlertTriangle className="h-4 w-4 text-warning" /> Watch for
              </h3>
              <p className="text-sm">
                <span className="font-medium">Common side effects:</span> {result.first.sideEffects.join(", ")}.
              </p>
              {result.cautions.length > 0 && (
                <ul className="list-disc pl-5 text-sm space-y-1">
                  {result.cautions.map((c) => <li key={c}>{c}</li>)}
                </ul>
              )}
              <p className="text-xs text-muted-foreground">
                Suggestions only — final choice and dose stay with the treating clinician.
              </p>
            </Card>
          </div>
        </>
      )}
    </div>
  );
};

export default DrugCalculator;
